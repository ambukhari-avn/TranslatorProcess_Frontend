import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiError, Job } from './models';

export const ACCEPTED_EXTENSIONS = ['.docx', '.pdf'] as const;
/** The backend's default upload limit; it enforces its own, this only saves a pointless upload. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export type FileProblem = 'type' | 'size' | 'empty' | null;

export function checkFile(file: Pick<File, 'name' | 'size'>): FileProblem {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'type';
  if (file.size === 0) return 'empty';
  if (file.size > MAX_UPLOAD_BYTES) return 'size';
  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A readable sentence for a failed call, preferring the backend's own message. */
export function describeApiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiError | null;
    if (body?.message) return body.message;
    if (error.status === 0) return 'Cannot reach the translation service. Check your connection and try again.';
    if (error.status === 413) return 'This file is too large to upload.';
  }
  return 'Something went wrong. Please try again.';
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/documents`;

  /** Uploads the file and starts the translation (English to Russian). */
  start(file: File): Observable<Job> {
    const form = new FormData();
    form.append('File', file, file.name);
    form.append('Language', 'ru');
    return this.http.post<Job>(this.base, form);
  }

  get(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.base}/${id}`);
  }

  cancel(id: string): Observable<Job> {
    return this.http.post<Job>(`${this.base}/${id}/cancel`, null);
  }

  /** The download endpoints need the sign-in token, so the file is fetched and saved from memory. */
  download(id: string, kind: 'download' | 'review', fallbackName: string): Observable<void> {
    return this.http.get(`${this.base}/${id}/${kind}`, { responseType: 'blob', observe: 'response' }).pipe(
      map((response) => saveBlob(response, fallbackName)),
    );
  }
}

function fileNameFrom(response: HttpResponse<Blob>, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? '';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      /* fall through to the plain name */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : fallback;
}

function saveBlob(response: HttpResponse<Blob>, fallbackName: string): void {
  const blob = response.body;
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileNameFrom(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

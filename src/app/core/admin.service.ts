import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuditEntry, Employee, HistoryItem, Paged } from './models';

type Query = Record<string, string | number | boolean | null | undefined>;

/** Drops empty values so only the filters a person actually set reach the backend. */
function toParams(query: Query): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') params = params.set(key, String(value));
  }
  return params;
}

/** A date from an <input type="date"> as the start of that day, or the end of it for an upper bound. */
export function dayBound(date: string, end = false): string {
  return date ? `${date}T${end ? '23:59:59' : '00:00:00'}` : '';
}

/** The Developer-only calls: everyone's history, the employees, the audit trail. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  history(query: Query): Observable<Paged<HistoryItem>> {
    return this.http.get<Paged<HistoryItem>>(`${this.api}/history`, { params: toParams(query) });
  }

  employees(query: Query): Observable<Paged<Employee>> {
    return this.http.get<Paged<Employee>>(`${this.api}/employees`, { params: toParams(query) });
  }

  setActive(id: string, isActive: boolean): Observable<Employee> {
    return this.http.patch<Employee>(`${this.api}/employees/${id}/status`, { isActive });
  }

  auditLogs(query: Query): Observable<Paged<AuditEntry>> {
    return this.http.get<Paged<AuditEntry>>(`${this.api}/audit-logs`, { params: toParams(query) });
  }
}

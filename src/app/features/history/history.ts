import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, interval, of, switchMap, tap } from 'rxjs';

import { AdminService, dayBound } from '../../core/admin.service';
import { DocumentsService, describeApiError, formatSize } from '../../core/documents.service';
import { HistoryItem, Paged, isFinished } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Pager } from '../../shared/pager';
import { reviewLabel, translatedName } from '../translate/stages';

const AUTO_REFRESH_MS = 5000;

/** Developer view: everyone's translations, who ran them, how they went, with downloads. */
@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, DecimalPipe, Icon, Pager],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly documents = inject(DocumentsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly page = signal(1);
  protected readonly size = signal(20);

  protected readonly data = signal<Paged<HistoryItem> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly downloading = signal<string | null>(null);

  protected readonly statuses = ['Queued', 'Running', 'Done', 'Failed', 'Cancelled'];
  protected readonly formatSize = formatSize;

  ngOnInit(): void {
    this.reload$
      .pipe(
        debounceTime(250),
        tap(() => this.error.set('')),
        switchMap(() =>
          this.admin
            .history({
              page: this.page(),
              pageSize: this.size(),
              search: this.search().trim(),
              status: this.status(),
              from: dayBound(this.from()),
              to: dayBound(this.to(), true),
            })
            .pipe(
              catchError((e: unknown) => {
                this.error.set(describeApiError(e));
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (result) this.data.set(result);
      });

    // Translations that are still running update by themselves.
    interval(AUTO_REFRESH_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.data()?.items.some((j) => !isFinished(j))) this.reload$.next();
      });

    this.reload$.next();
  }

  /** A filter changed: start again from the first page. */
  protected filtersChanged(): void {
    this.page.set(1);
    this.reload$.next();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.reload$.next();
  }

  protected resize(size: number): void {
    this.size.set(size);
    this.filtersChanged();
  }

  protected refresh(): void {
    this.reload$.next();
  }

  protected review(job: HistoryItem): string | null {
    return job.status === 'Done' ? reviewLabel(job) : null;
  }

  /** "42 s" or "3 min 10 s" between start and finish; empty while it has not started. */
  protected took(job: HistoryItem): string {
    if (!job.startedAt) return '';
    const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now();
    const seconds = Math.max(0, Math.round((end - new Date(job.startedAt).getTime()) / 1000));
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
  }

  protected download(job: HistoryItem, kind: 'download' | 'review'): void {
    if (this.downloading()) return;
    this.downloading.set(job.id + kind);
    this.error.set('');
    const word = translatedName(job.originalName);
    const name = kind === 'download' ? word : word.replace(/_RU\.docx$/, '_review.docx');
    this.documents.download(job.id, kind, name).subscribe({
      next: () => this.downloading.set(null),
      error: () => {
        this.downloading.set(null);
        this.error.set('The file could not be downloaded. It may have expired.');
      },
    });
  }
}

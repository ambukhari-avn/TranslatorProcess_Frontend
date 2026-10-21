import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, of, switchMap, tap } from 'rxjs';

import { AdminService, dayBound } from '../../core/admin.service';
import { describeApiError } from '../../core/documents.service';
import { AuditEntry, Paged } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Pager } from '../../shared/pager';

/** Developer view: the audit trail of sign-ins, translations and account changes. */
@Component({
  selector: 'app-audit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, Icon, Pager],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
})
export class Audit implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

  protected readonly search = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly order = signal<'desc' | 'asc'>('desc');
  protected readonly page = signal(1);
  protected readonly size = signal(50);

  protected readonly data = signal<Paged<AuditEntry> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.reload$
      .pipe(
        debounceTime(250),
        tap(() => this.error.set('')),
        switchMap(() =>
          this.admin
            .auditLogs({
              page: this.page(),
              pageSize: this.size(),
              search: this.search().trim(),
              sortBy: 'timestamp',
              sortOrder: this.order(),
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
    this.reload$.next();
  }

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

  protected flip(): void {
    this.order.update((o) => (o === 'desc' ? 'asc' : 'desc'));
    this.filtersChanged();
  }

  protected refresh(): void {
    this.reload$.next();
  }
}

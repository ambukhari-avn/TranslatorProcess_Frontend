import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, of, switchMap, tap } from 'rxjs';

import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { describeApiError } from '../../core/documents.service';
import { Employee, Paged } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Pager } from '../../shared/pager';

const CONFIRM_MS = 4000;

/** Developer view: everyone who has signed in, with the switch that turns an account on or off. */
@Component({
  selector: 'app-employees',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, Icon, Pager],
  templateUrl: './employees.html',
  styleUrl: './employees.scss',
})
export class Employees implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();
  private confirmTimer?: ReturnType<typeof setTimeout>;

  protected readonly search = signal('');
  protected readonly state = signal('');
  protected readonly role = signal('');
  protected readonly page = signal(1);
  protected readonly size = signal(20);

  protected readonly data = signal<Paged<Employee> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  /** The row waiting for a second click, and the row being saved. */
  protected readonly confirming = signal<string | null>(null);
  protected readonly saving = signal<string | null>(null);

  ngOnInit(): void {
    this.reload$
      .pipe(
        debounceTime(250),
        tap(() => this.error.set('')),
        switchMap(() =>
          this.admin
            .employees({
              page: this.page(),
              pageSize: this.size(),
              search: this.search().trim(),
              isActive: this.state() === '' ? '' : this.state() === 'active',
              role: this.role(),
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

  protected isMe(employee: Employee): boolean {
    return (employee.email ?? '').toLowerCase() === this.auth.email().toLowerCase();
  }

  /** The first click asks for confirmation; a second click on the same row within a few seconds does it. */
  protected toggle(employee: Employee): void {
    if (this.saving() || this.isMe(employee)) return;
    if (this.confirming() !== employee.id) {
      this.confirming.set(employee.id);
      clearTimeout(this.confirmTimer);
      this.confirmTimer = setTimeout(() => this.confirming.set(null), CONFIRM_MS);
      return;
    }

    clearTimeout(this.confirmTimer);
    this.confirming.set(null);
    this.saving.set(employee.id);
    this.error.set('');
    this.admin.setActive(employee.id, !employee.isActive).subscribe({
      next: (updated) => {
        this.saving.set(null);
        this.data.update((d) => (d ? { ...d, items: d.items.map((e) => (e.id === updated.id ? updated : e)) } : d));
      },
      error: (e: unknown) => {
        this.saving.set(null);
        const body = e instanceof HttpErrorResponse ? (e.error as { error?: string } | null) : null;
        this.error.set(body?.error ?? describeApiError(e));
      },
    });
  }
}

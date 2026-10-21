import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Icon } from './icon';

/** "Showing 21-40 of 133", previous / next, and how many rows per page. */
@Component({
  selector: 'app-pager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="pager">
      <span class="count">{{ summary() }}</span>
      <span class="spacer"></span>
      <label class="size">
        Rows
        <select [value]="pageSize()" (change)="sizeChange.emit(+$any($event.target).value)">
          @for (n of sizes; track n) {
            <option [value]="n">{{ n }}</option>
          }
        </select>
      </label>
      <button type="button" class="step" aria-label="Previous page" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">
        <app-icon name="chevron-left" [size]="18" />
      </button>
      <span class="of">Page {{ page() }} of {{ totalPages() || 1 }}</span>
      <button type="button" class="step" aria-label="Next page" [disabled]="page() >= totalPages()" (click)="pageChange.emit(page() + 1)">
        <app-icon name="chevron-right" [size]="18" />
      </button>
    </div>
  `,
  styles: `
    .pager {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.6rem 0.8rem;
      padding: 0.8rem 1rem;
      border-top: 1px solid var(--line);
      background: #fafcff;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .spacer {
      flex: 1;
    }
    .size {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    select {
      height: 34px;
      padding: 0 0.5rem;
      border: 1.5px solid var(--line);
      border-radius: 8px;
      background: var(--white);
    }
    .step {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 1.5px solid var(--line);
      border-radius: 8px;
      background: var(--white);
      color: var(--navy);
      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      &:hover:not(:disabled) {
        background: var(--blue-50);
      }
    }
    .of {
      min-width: 6.5rem;
      text-align: center;
    }
  `,
})
export class Pager {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  protected readonly sizes = [10, 20, 50, 100];

  protected summary(): string {
    const total = this.totalCount();
    if (total === 0) return 'No results';
    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(total, this.page() * this.pageSize());
    return `Showing ${from}-${to} of ${total}`;
  }
}

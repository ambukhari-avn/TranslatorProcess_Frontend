import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'mail'
  | 'arrow-right'
  | 'x'
  | 'check'
  | 'download'
  | 'plus'
  | 'clock'
  | 'alert-circle'
  | 'warning'
  | 'document'
  | 'upload'
  | 'users'
  | 'shield'
  | 'menu'
  | 'search'
  | 'refresh'
  | 'chevron-left'
  | 'chevron-right'
  | 'log-out';

/** The small line icons used across the screens (24x24, drawn with the current text colour). */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [attr.width]="size()"
      [attr.height]="size()"
    >
      @switch (name()) {
        @case ('mail') {
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m3.5 7.5 8.5 6 8.5-6" />
        }
        @case ('arrow-right') {
          <path d="M5 12h14M13 6l6 6-6 6" />
        }
        @case ('x') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('check') {
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        }
        @case ('download') {
          <path d="M12 4v11m-5-4 5 5 5-5M5 20h14" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('alert-circle') {
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 7v6.5M12 16.8v.01" />
        }
        @case ('warning') {
          <path d="M12 4 2.7 20h18.6z" />
          <path d="M12 10v4.5M12 17.4v.01" />
        }
        @case ('upload') {
          <path d="M12 16V5m-5 4 5-5 5 5M5 20h14" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.7c2 .6 3.2 2.3 3.5 5.3" />
        }
        @case ('shield') {
          <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z" />
          <path d="m9 12 2.2 2.2L15.5 10" />
        }
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        }
        @case ('refresh') {
          <path d="M20 11a8 8 0 0 0-14.3-4.2L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.2L20 15.5M20 20v-4.5h-4.5" />
        }
        @case ('chevron-left') {
          <path d="m14.5 6-6 6 6 6" />
        }
        @case ('chevron-right') {
          <path d="m9.5 6 6 6-6 6" />
        }
        @case ('log-out') {
          <path d="M9 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H9M15 8l4 4-4 4M19 12H9" />
        }
        @case ('document') {
          <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z" />
          <path d="M14 3v5h5M9 13h6M9 16.5h6" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}

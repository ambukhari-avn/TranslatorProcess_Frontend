import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { Icon, IconName } from './icon';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  exact?: boolean;
}

/**
 * The signed-in frame. A Developer gets a sidebar with the admin pages; everyone else gets the plain top bar
 * (logo, e-mail, "Sign out") from the design.
 */
@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);

  protected readonly main: NavItem[] = [{ label: 'Translate', path: '/', icon: 'upload', exact: true }];
  protected readonly admin: NavItem[] = [
    { label: 'History', path: '/history', icon: 'clock' },
    { label: 'Employees', path: '/employees', icon: 'users' },
    { label: 'Audit log', path: '/audit', icon: 'shield' },
  ];

  constructor() {
    // On a phone the sidebar is a drawer: close it once a page has been chosen.
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuOpen.set(false));
  }

  protected initial(): string {
    return (this.auth.session()?.fullName || this.auth.email() || '?').trim().charAt(0).toUpperCase();
  }
}

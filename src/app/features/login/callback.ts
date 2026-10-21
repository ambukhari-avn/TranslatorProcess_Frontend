import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

/**
 * Where Microsoft sends the person back to. The one-time code in the address is exchanged for a session,
 * then the person goes to the app; any problem goes back to the sign-in page with a message.
 */
@Component({
  selector: 'app-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="screen blue-bg" role="status" aria-live="polite">
      <div class="card">
        <span class="spinner" aria-hidden="true"></span>
        <h1>Signing you in…</h1>
        <p>Finishing your Microsoft sign-in.</p>
      </div>
    </div>
  `,
  styles: `
    .screen {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .card {
      width: min(100%, 360px);
      padding: 2.4rem 2rem;
      border-radius: var(--radius-card);
      background: var(--white);
      box-shadow: var(--shadow-card);
      text-align: center;
    }
    h1 {
      margin: 1.2rem 0 0.4rem;
      font-size: 1.4rem;
    }
    p {
      margin: 0;
      color: var(--muted);
    }
    .spinner {
      display: inline-block;
      width: 44px;
      height: 44px;
      border: 4px solid var(--blue-100);
      border-top-color: var(--blue-600);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Callback implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const microsoftError = query.get('error_description') ?? query.get('error');
    const code = query.get('code');
    const state = query.get('state');

    if (microsoftError || !code || !state) {
      void this.router.navigate(['/login'], { queryParams: microsoftError ? { error: microsoftError } : {}, replaceUrl: true });
      return;
    }

    // The code can be used only once, so it is exchanged exactly once, here.
    this.auth.completeSignIn(code, state).subscribe({
      next: () => void this.router.navigate(['/'], { replaceUrl: true }),
      error: (error: unknown) =>
        void this.router.navigate(['/login'], { queryParams: { error: this.auth.describeError(error) }, replaceUrl: true }),
    });
  }
}

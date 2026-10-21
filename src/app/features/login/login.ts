import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../core/auth.service';

/** Sign-in: one button that sends the person to Microsoft, which proves who they are. */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);

  protected readonly busy = signal(false);
  /** A message from the callback page (for example a wrong company account or a switched-off account), or from the last attempt. */
  protected readonly error = signal<string | null>(inject(ActivatedRoute).snapshot.queryParamMap.get('error'));

  protected signIn(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.auth.beginSignIn().subscribe({
      // On success the browser leaves for Microsoft, so there is nothing more to do here.
      error: (e: unknown) => {
        this.busy.set(false);
        this.error.set(this.auth.describeError(e));
      },
    });
  }
}

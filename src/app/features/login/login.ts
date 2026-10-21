import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService, EmailProblem, checkWorkEmail } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { Icon } from '../../shared/icon';

/** Sign-in: the person enters their work e-mail, then Microsoft confirms who they are. */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);

  protected readonly email = signal('');
  protected readonly problem = signal<EmailProblem>(null);
  protected readonly busy = signal(false);
  /** A message from the callback page (for example a deactivated account), or from the last attempt. */
  protected readonly serverError = signal<string | null>(inject(ActivatedRoute).snapshot.queryParamMap.get('error'));

  protected readonly domainHint = environment.allowedEmailDomains.map((d) => '@' + d.replace(/^@/, '')).join(', ');

  protected onInput(value: string): void {
    this.email.set(value);
    if (this.problem()) this.problem.set(checkWorkEmail(value));
    this.serverError.set(null);
  }

  protected submit(): void {
    const problem = checkWorkEmail(this.email());
    this.problem.set(problem);
    if (problem || this.busy()) return;

    this.busy.set(true);
    this.serverError.set(null);
    this.auth.beginSignIn(this.email()).subscribe({
      // On success the browser leaves for Microsoft, so there is nothing more to do here.
      error: (error: unknown) => {
        this.busy.set(false);
        this.serverError.set(this.auth.describeError(error));
      },
    });
  }
}

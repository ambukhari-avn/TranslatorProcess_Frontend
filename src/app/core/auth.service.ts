import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { Session, SignInResponse } from './models';

const STORAGE_KEY = 'dt.session';

/** Reads the "exp" claim of a JWT (seconds since 1970); null when the token cannot be read. */
function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload));
    return typeof claims.exp === 'number' ? claims.exp : null;
  } catch {
    return null;
  }
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const exp = tokenExpiry(session.token);
    if (!session.token || exp === null || exp * 1000 <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly state = signal<Session | null>(readStoredSession());

  readonly session = this.state.asReadonly();
  readonly isSignedIn = computed(() => this.state() !== null);
  readonly email = computed(() => this.state()?.email ?? '');
  readonly isDeveloper = computed(() => this.state()?.role === 'SuperUser');

  get token(): string | null {
    return this.state()?.token ?? null;
  }

  /** Asks the backend for the Microsoft sign-in address and goes there. */
  beginSignIn(): Observable<void> {
    return this.http.get<{ authUrl: string }>(`${environment.apiUrl}/auth/microsoft/login`).pipe(
      tap(({ authUrl }) => window.location.assign(authUrl)),
      map(() => undefined),
    );
  }

  /** Exchanges the code Microsoft sent back for a session. */
  completeSignIn(code: string, state: string): Observable<Session> {
    const params = { code, state };
    return this.http.get<SignInResponse>(`${environment.apiUrl}/auth/microsoft/callback`, { params }).pipe(
      map((r) => ({ token: r.token, email: r.email, fullName: r.fullName, role: r.role }) satisfies Session),
      tap((session) => {
        this.state.set(session);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
          /* private mode: the session simply lasts until the tab closes */
        }
      }),
    );
  }

  signOut(): void {
    this.state.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.clear();
    } catch {
      /* nothing stored */
    }
    void this.router.navigate(['/login']);
  }

  /** A message for a failed sign-in, taken from the backend's reply when it has one. */
  describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      if (typeof message === 'string' && message) return message;
      if (error.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    }
    return 'Sign-in failed. Please try again.';
  }
}

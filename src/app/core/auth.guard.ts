import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Pages that need a signed-in user. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isSignedIn() ? true : inject(Router).createUrlTree(['/login']);
};

/** The sign-in page: someone who is already signed in goes straight to the app. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isSignedIn() ? inject(Router).createUrlTree(['/']) : true;
};

/** Pages only a Developer (SuperUser) may open; everyone else goes to the translate page. */
export const developerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isDeveloper() ? true : inject(Router).createUrlTree(['/']);
};

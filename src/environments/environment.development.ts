export const environment = {
  production: false,
  /** Base URL of the translation backend (ASP.NET Core). */
  apiUrl: 'http://localhost:5058/api',
  /** Only these e-mail domains can sign in; the backend enforces the same rule. */
  allowedEmailDomains: ['avanceon.ae'],
};

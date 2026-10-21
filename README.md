# Slovo Pulse (frontend)

Angular app for Slovo Pulse, the English to Russian document translator. A person signs in with their work account, drops a
Word or PDF file, watches the progress and downloads the translated Word file and the review file.

```
src/app/
  core/       sign-in session, HTTP interceptor (adds the token), route guards, documents API
  shared/     icons and the signed-in page frame (header with the user's e-mail and "Sign out")
  features/
    login/      sign-in page and the page Microsoft returns to (callback)
    translate/  the whole flow on one page: choose, translate, progress, ready, failed
src/environments/   apiUrl and the allowed e-mail domain
```

## Run it

1. Start the extraction service and the backend (see the Backend README); the backend listens on `http://localhost:5058`.
2. Install and start:

```powershell
npm install
npm start            # http://localhost:5080
```

The API address is `apiUrl` in `src/environments/environment.development.ts`. The backend must allow the origin the app
runs on (`Cors:AllowedOrigins`; locally `http://localhost:5080`, the address registered in Azure). If another app already uses port 4200, run this one
elsewhere (`npx ng serve --port 4201`) and add that origin to the backend's CORS list.

## How sign-in works

1. **Continue with Microsoft** asks the backend for the Microsoft sign-in address and goes there.
2. Microsoft sends the person back to `/auth/microsoft/callback`; the one-time code is exchanged for a token and the
   person lands on the translate page. The Azure app registration must list that exact redirect URI
   (`http://localhost:5080/auth/microsoft/callback` locally) and it must equal the backend's `Microsoft:RedirectUri`.
3. Only company accounts (`Auth:AllowedEmailDomains` in the backend, `avanceon.ae`) are let in; anyone else is sent back to the sign-in page with a message.
4. If the backend later says the token is no longer valid (for example the account was switched off), the app signs
   the person out.

## The translate page

Choose a file (drag and drop, or browse) -> **Translate** -> the page follows the job every two seconds
(Reading document, Translating, Checking translation, Building Word file) -> **Translation ready** with the Word file
and the review file, or **Translation could not be completed** with **Try again** and **Start over**.
A running or finished job survives a refresh of the page. The files are fetched with the token and saved from memory.

## Developer pages

A Developer (SuperUser) gets a sidebar instead of the top bar, with three extra pages. Everyone else keeps the plain
top bar, and the backend refuses these calls for them as well.

- **History** (`/history`): every translation by everyone, with person, document, status, items to review, score and
  time taken; search, status and date filters; downloads of the Word and review files. Running jobs refresh by themselves.
- **Employees** (`/employees`): everyone who has signed in, with a "Switch off / Switch on" button (asks to confirm; you
  cannot switch off your own account). A switched-off person is signed out on their next request.
- **Audit log** (`/audit`): sign-ins, translations and account changes, newest first, with search and date filters.

## Build and test

```powershell
npm test -- --watch=false     # unit tests (Vitest)
npm run build                 # production build into dist/ (uses environment.ts: set its apiUrl first)
```

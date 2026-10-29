# lib/

Shared library code: Firebase integration, hooks, and utilities.

## Subfolders

### `firebase/`
Firebase SDK wrappers. All use the **v9 modular API**.

- `config.ts` — initialises Firebase app (singleton), exports `app`, `auth`, `db`. Uses `getApps()` guard against HMR double-init. Reads config from `NEXT_PUBLIC_FIREBASE_*` env vars.
- `auth.ts` — `signIn()`, `signOut()`, `onAuthChange()` wrappers; `setSessionCookie()` / `clearSessionCookie()` helpers that call the `/api/auth/session` route handler.

#### `firebase/firestore/`
One file per Firestore collection (see `firestore/README.md`).

### `hooks/`
Client-side React hooks (`'use client'`):
- `useAuth.ts` — Firebase user + Firestore `UserProfile` + loading state; `signIn` / `signOut` actions
- `useScholarships.ts` — real-time `onSnapshot` list, optional status filter
- `useNominees.ts` — real-time nominees list for a scholarship ID
- `useVotes.ts` — current SWB member's vote for a scholarship; `hasVoted` boolean

### `utils/`
Pure functions (no Firebase calls, testable in isolation):
- `computeResults.ts` — `Vote[] + Nominee[] → ComputedResults` (ranked nominees, winner, tie detection)
- `formatters.ts` — `formatDate`, `formatCurrency`, `formatRole`, `formatStatus`, `formatDateTime`
- `validators.ts` — `validateScholarshipForm`, `validateEmail`, `validateRating`

### `utils.ts`
Root `cn()` helper — merges Tailwind class names using `clsx` + `tailwind-merge`.

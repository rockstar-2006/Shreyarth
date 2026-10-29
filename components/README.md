# components/

Reusable React components organized by concern.

## Subfolders

### `ui/`
Atomic UI primitives styled with SMVITM brand tokens:
- `Button.tsx` — variants: primary (maroon), secondary, ghost, danger, gold
- `Card.tsx` + `CardHeader` + `CardBody` + `CardFooter` — white surface with optional maroon top accent
- `Badge.tsx` — colored badge chips
- `Input.tsx` — styled text input with label + error support
- `Textarea.tsx` — styled textarea with label + error support
- `Select.tsx` — styled native select
- `Modal.tsx` — accessible dialog with backdrop and Escape-to-close
- `Spinner.tsx` + `FullPageSpinner` — animated loading indicators in SMVITM maroon
- `RatingSlider.tsx` — accessible 1–10 range slider for SWB voting
- `StatusChip.tsx` — colored chip for scholarship status (draft/published/voting_open/closed)

### `layout/`
Shell layout components used by role-specific route group layouts:
- `Header.tsx` — sticky top bar: logo, title, user name + role badge, sign-out
- `AdminSidebar.tsx` — nav for admin panel (Dashboard, Scholarships, Users)
- `SWBSidebar.tsx` — nav for SWB panel (Dashboard, Vote)
- `StudentSidebar.tsx` — nav for student panel (Dashboard, My Scholarships)

### `providers/`
- `AuthProvider.tsx` — React Context wrapping `useAuth`; exposes `useAuthContext()` hook to all children

### `scholarship/`
Domain-specific components:
- `ScholarshipCard.tsx` — card with title, status, sponsor, amount, role-aware action buttons
- `NomineeList.tsx` — table of nominees; admin view includes remove button
- `VotingForm.tsx` — per-nominee RatingSlider cards + confirmation modal before submit
- `ResultsTable.tsx` — ranked table of nominees by total score; winner row in gold; tie warning

# SMVITM Scholarship Portal

Production-grade scholarship management portal for **Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM)**, Bantakal, Udupi, Karnataka.

---

## Overview

Three roles:
- **Admin** — creates scholarships, manages nominees, declares winners
- **SWB Member** — rates nominees (1–10) per scholarship; votes are isolated and locked on submit
- **Student** — views nominated scholarships and award status

Voting algorithm: each SWB member rates each nominee 1–10. Winner = student with highest **sum** of all ratings. Tie-break: higher CGPA. Still tied: admin manually decides.

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- A [Firebase](https://console.firebase.google.com) project with:
  - **Authentication** → Email/Password sign-in enabled
  - **Firestore Database** → created in production mode (then deploy `firestore.rules`)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env.local` and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
SESSION_SECRET=your-32-char-random-secret-here
```

> **Never commit `.env.local`** — it is already in `.gitignore`.

### 3. Create first Admin user

The portal has no public registration. Create the first Admin manually:

1. Go to Firebase Console → **Authentication** → Add user (email + password)
2. Copy the UID shown in Authentication
3. Go to **Firestore Database** → Create collection `users` → Add document with ID = that UID:

```json
{
  "uid": "<paste UID>",
  "name": "Admin Name",
  "email": "admin@smvitm.ac.in",
  "role": "admin",
  "department": "Administration",
  "createdAt": <server timestamp>
}
```

4. Login at `/login` with those credentials — you'll be redirected to `/admin/dashboard`.

### 4. Deploy Firestore security rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Production build

```bash
npm run build
npm start
```

---

## Folder Structure

```
smvitm-scholarship-portal/
├── app/                        # Next.js 14 App Router pages
│   ├── (auth)/                 # Login page (no sidebar)
│   │   └── login/
│   ├── (admin)/                # Admin routes (role-protected)
│   │   ├── dashboard/
│   │   ├── scholarships/
│   │   │   ├── new/            # Create scholarship form
│   │   │   └── [id]/
│   │   │       ├── nominees/   # Manage nominees & publish
│   │   │       └── results/    # View results & declare winner
│   │   └── users/              # Create & list users
│   ├── (swb)/                  # SWB member routes (role-protected)
│   │   ├── dashboard/
│   │   └── vote/[scholarshipId]/
│   ├── (student)/              # Student routes (role-protected)
│   │   ├── dashboard/
│   │   └── scholarship/[id]/
│   └── api/
│       └── auth/session/       # HttpOnly session cookie handler
├── components/
│   ├── layout/                 # Header, sidebars
│   ├── providers/              # AuthProvider (React context)
│   ├── scholarship/            # Domain components
│   └── ui/                     # Reusable UI atoms
├── lib/
│   ├── firebase/               # Firebase config + Firestore helpers
│   │   └── firestore/          # One file per collection
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Pure utility functions
├── types/                      # Shared TypeScript types
├── public/                     # Static assets (logo)
├── firestore.rules             # Production security rules
├── firestore.indexes.json      # Composite indexes
├── .env.example                # Environment variable template
└── middleware.ts               # Role-based route protection
```

---

## User Roles & Flows

| Role | Login redirects to | Key actions |
|------|-------------------|-------------|
| `admin` | `/admin/dashboard` | Create scholarships, add nominees, open/close voting, declare winner, manage users |
| `swb_member` | `/swb/dashboard` | Rate nominees 1–10 for assigned scholarships |
| `student` | `/student/dashboard` | View nominated scholarships; see winner announcement |

---

## Scholarship Lifecycle

```
draft → published → voting_open → closed
```

1. Admin creates scholarship (draft)
2. Admin adds nominees → Publish (published)
3. Admin opens voting (voting_open) → SWB members vote
4. Admin closes voting (closed) → Results computed
5. Admin declares winner → written to `results/{id}` + `scholarships/{id}.winnerId`

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Google Analytics (optional) |
| `SESSION_SECRET` | 32-char random string for session security |

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript strict mode)
- **Firebase** Firestore + Auth (free Spark tier compatible)
- **Tailwind CSS** with SMVITM brand theme
- **React Hot Toast** for notifications
- **Lucide React** for icons

---

## License

Internal use — SMVITM Student Welfare Board.

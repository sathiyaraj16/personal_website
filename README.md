# NEXA – Personal Productivity Workspace

NEXA is a privacy-first personal productivity workspace web application built with React, TypeScript, Tailwind CSS, and Supabase. It integrates task management, Google Drive and Google Photos browsing, profile customization, and a client-side zero-trust encrypted document vault (Secure Locker).

---

## Features

### 1. Productivity Dashboard
- **Live Account Metrics:** Displays real-time task statistics (Total Tasks, Completed, Pending, and Completion Rate) calculated directly from authenticated user records.
- **Daily Focus Queue:** Today's task list with quick completion toggling, priority badges, and category tags.
- **Weekly Trend Chart:** 7-day productivity execution chart computing scheduled vs. completed deliverables for the current week.
- **Category Allocation:** Real task distribution across workspace categories (Work, Projects, Study, Personal, Other).
- **Recent Activity:** Live audit log displaying recent deliverable completions alongside verified Supabase session events.
- **Accurate Empty States:** Clean empty states when no tasks exist, with zero fabricated percentages or dummy data.

### 2. To-Do Manager
- **Dual View Modes:** Switch between an interactive 3-column Kanban Board (To Do, In Progress, Completed) and a detailed List View.
- **Task CRUD Operations:** Create, view, edit, toggle, and delete tasks with optimistic UI updates and real-time persistence.
- **Organization & Filtering:** Filter by status (All, Today, Upcoming, Completed, Overdue) and category; search across titles and descriptions; sort by due date, priority, or creation date.
- **Multi-User Isolation:** All tasks are strictly partitioned by authenticated user ID; no cross-account data leakage.

### 3. Google Drive Integration
- **File & Folder Explorer:** Browse Google Drive files and folders with breadcrumb navigation and real-time search.
- **In-App Document Previews:** Integrated document viewer supporting PDF rendering (via PDF.js), video playback, and image viewing.
- **OAuth Authorization:** Connects via Google OAuth 2.0 with access token handling and reconnect workflows.

### 4. Google Photos Integration
- **Media Gallery:** Browse photo albums and media items from Google Photos Library API.
- **Lightbox Preview:** Full-screen image preview modal with metadata inspection.

### 5. Profile & Workspace Settings
- **User Profile:** Manage display name, full name, phone number, bio, and role.
- **Avatar Management:** Upload profile photos to Supabase Storage (`avatars` bucket) with local data URL fallback.
- **Workspace Preferences:** Configure application theme, default task view (Kanban vs. List), date format (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY), and time format (12h vs. 24h).
- **Account Security:** Update Supabase password and inspect connected service statuses.

### 6. Secure Locker (Zero-Trust Encrypted Vault)
- **Client-Side Envelope Encryption:** Documents are encrypted before upload using Web Crypto AES-256-GCM with distinct Data Encryption Keys (DEK) wrapped under a master Key Encryption Key (KEK).
- **Key Derivation:** Master KEK is derived in-browser using PBKDF2 with 600,000 iterations (HMAC-SHA-256) and a cryptographically secure 16-byte user salt.
- **Server-Side Challenge Verification:** Password verification uses Argon2id client-derived verifiers and atomic, non-replayable challenges; raw passwords and master keys never leave the browser.
- **RAM-Only Key Lifecycle:** Master KEK is stored exclusively in memory and immediately purged upon route navigation away from `/locker`, manual lock, or inactivity timeout.
- **Automatic Lock Protection:** The vault automatically locks whenever the user navigates to any other section (Dashboard, To-Do, Drive, Photos, Profile) or refreshes the page.
- **Private Storage Isolation:** Encrypted documents are stored in a private Supabase Storage bucket (`secure-locker`) scoped to `{user_id}/{document_id}.enc`.
- **Zero-Knowledge Recovery:** Generates a 256-bit emergency recovery key (RFC 1751 / Crockford Base32 format) enabling vault recovery and key rotation without data loss.
- **Cryptographic Audit Log:** Vault events (unlock, lock, encryption, recovery, passphrase change) are logged with redacted parameters and zero plaintext secrets.

---

## Technology Stack

- **Framework:** React 19
- **Language:** TypeScript 5
- **Build Tool & Dev Server:** Vite 6
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Routing:** React Router 7
- **Icons:** Lucide React
- **Backend & Database:** Supabase (Authentication, PostgreSQL Database, Row-Level Security, Object Storage)
- **Cryptography:** Web Crypto API (`crypto.subtle`), `hash-wasm` (Argon2id)
- **Document Rendering:** `pdfjs-dist` (PDF.js worker)
- **Testing:** Vitest 5

---

## Project Structure

```
personal_website/
├── public/
│   └── vite.svg
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── google/             # Google Drive & Photos components
│   │   ├── locker/             # Secure Locker modals & document views
│   │   ├── profile/            # Profile settings & avatar uploader
│   │   └── todos/              # Kanban board, task list & filter controls
│   ├── context/                # React Context providers (Auth, GoogleAuth, Preferences, Tasks)
│   ├── layouts/                # DashboardLayout with navigation sidebar & topbar
│   ├── lib/                    # Supabase client initialization & helpers
│   ├── pages/                  # Route views (Dashboard, Todos, Photos, Drive, Profile, Locker, Login)
│   ├── services/               # API & business logic services
│   │   └── crypto/             # AES-256-GCM, PBKDF2 & Argon2id cryptographic engine
│   ├── tests/                  # Vitest test suites (7 suites, 71 tests)
│   ├── types/                  # TypeScript interface and type declarations
│   ├── App.tsx                 # Route declarations & provider tree
│   ├── index.css               # Global Tailwind CSS imports & theme rules
│   ├── main.tsx                # React DOM entry point
│   └── vite-env.d.ts           # Vite client type references
├── supabase/
│   └── migrations/             # PostgreSQL migrations (Profiles, Secure Locker, Storage RLS)
├── .env.example                # Sanitized environment variable template
├── .gitignore                  # Git ignore rules (protecting .env files and build outputs)
├── FINAL_REPOSITORY_AUDIT.md   # Final pre-push audit and verification report
├── index.html                  # Single-page application HTML entry
├── package.json                # Project dependencies and script definitions
├── tsconfig.json               # TypeScript base configuration
├── tsconfig.app.json           # Application TypeScript configuration
├── tsconfig.node.json          # Node/build TypeScript configuration
└── vite.config.ts              # Vite & Vitest configuration
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (version 9.0.0 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sathiyaraj16/personal_website.git
   cd personal_website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file and provide your credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual project keys:
   ```ini
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

   # Google OAuth 2.0 (Google Drive & Google Photos)
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

   Open your browser and navigate to `http://localhost:5173` (or the port indicated in your terminal).

---

## Available Scripts

The following scripts are defined in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Runs TypeScript type checking (`tsc -b`) and compiles production assets into `dist/`. |
| `npm run test` | Runs the full Vitest automated test suite once (`vitest run`). |
| `npm run preview` | Locally serves the compiled production build from `dist/` for inspection. |

---

## Testing & Quality Assurance

The project includes an automated test suite covering cryptographic primitives, envelope encryption, storage row-level security, navigation auto-lock, and task multi-user isolation.

Run all tests:
```bash
npm run test
```

### Test Suites (71 tests across 7 test files):
- `src/tests/lockerCrypto.test.ts` — Web Crypto AES-256-GCM, PBKDF2 (600,000 rounds), Argon2id verifier computation, and AAD context validation.
- `src/tests/locker-documents-crud.test.ts` — Private document upload, listing, encrypted download, and deletion.
- `src/tests/locker-storage-rls.test.ts` — Supabase Storage RLS enforcement, private bucket access controls, and cross-user isolation.
- `src/tests/locker-auto-lock.test.ts` — Automatic lock on navigation to other routes, browser refresh, and RAM KEK purging.
- `src/tests/locker-security-remediation.test.ts` — Verifier theft prevention, atomic challenge consumption, key rotation, and recovery continuity.
- `src/tests/secure-locker.security.test.ts` — Brute-force lockout enforcement, nonce uniqueness, and audit redaction.
- `src/tests/task-real-data-cleanup.test.ts` — Verification that zero demo tasks are seeded, account isolation, and real CRUD operations.

---

## Production Build

To build the application for production:
```bash
npm run build
```

This compiles TypeScript and bundles minified CSS and JavaScript assets into the `dist/` directory.

---

## Security & Secrets Policy

- Real API keys and credentials must **never** be committed to Git.
- The `.gitignore` file is configured to exclude `.env`, `.env.*`, and `.env.local`.
- `.env.example` contains only non-sensitive placeholder values.

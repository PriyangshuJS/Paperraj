# PaperRaj 📚

**“The place to find and share school question papers.”**

PaperRaj is a community-driven platform where students and contributors can upload,
discover, and share school examination question papers — an ancient library
redesigned for the future.

- **Frontend / backend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Database & auth & files:** Supabase (PostgreSQL · Auth · Storage · Row Level Security)
- **Hosting:** Render
- **Installable:** a real Progressive Web App for Android and iPhone

Guests can browse, search, filter, sort, view, download **and upload** without ever
creating an account. Signing in gives you ownership of your uploads (edit / delete),
comments, and one vote per paper.

---

## 1. What is in the box

| Area | Where |
| --- | --- |
| Brand strings, navigation, contact links (single source of truth) | `src/lib/site.ts` |
| Database schema (Drizzle) | `src/db/schema.ts` |
| Supabase SQL: tables, indexes, triggers | `supabase/migrations/0001_schema.sql` |
| Supabase SQL: Row Level Security | `supabase/migrations/0002_rls_policies.sql` |
| Supabase SQL: private storage bucket + policies | `supabase/migrations/0003_storage.sql` |
| Auth (Supabase Auth + local fallback, sessions) | `src/lib/auth.ts` |
| Storage abstraction (Supabase Storage + local fallback) | `src/lib/storage.ts` |
| File validation (real magic-byte sniffing, 50 MB limit) | `src/lib/validation.ts` |
| Upload / edit / delete / download / vote / comment / report APIs | `src/app/api/**` |
| Library UI (search, filters, sort, pagination) | `src/components/Library.tsx` |
| Librarian (admin) dashboard | `src/components/AdminDashboard.tsx` |
| PWA manifest, service worker, icons | `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` |
| Render blueprint | `render.yaml` |
| Environment template | `.env.example` |
| Demo data seeder | `scripts/seed.mjs` |

### Pages

`/` home + library · `/papers` full catalogue · `/year-papers` · `/specimen-papers`
`/subjects` · `/classes` · `/boards` · `/papers/[id]` details + reader + comments
`/papers/[id]/edit` · `/upload` · `/my-uploads` · `/profile`
`/login` · `/signup` · `/forgot-password` · `/reset-password`
`/teachers` · `/statistics` · `/about` · `/contact` · `/privacy` · `/terms`
`/admin` (librarian's desk) · `/offline`

---

## 2. Local setup — from zero

You need a computer with **Node.js 20+**, **Git** and **VS Code** (any editor works).

1. **Install prerequisites**
   ```bash
   node -v    # should print v20.x or newer
   git --version
   ```
   Node.js: <https://nodejs.org> (choose the LTS build). Git: <https://git-scm.com>.

2. **Get the project** — clone it (or download and unzip) and open the folder in VS Code:
   ```bash
   git clone https://github.com/<your-username>/paperraj.git
   cd paperraj
   code .
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create your environment file**
   ```bash
   cp .env.example .env.local
   ```
   For a first run you only need two values in `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   If you already created a Supabase project, fill in the Supabase values too
   (see section 3) — you can also start local-only and add Supabase later.

5. **Create the database tables** (either way works)
   - *Local Postgres:* make sure PostgreSQL is running, then
     ```bash
     npx drizzle-kit push
     ```
   - *Supabase:* open Supabase Studio → **SQL Editor** → New query, paste the
     contents of `supabase/migrations/0001_schema.sql`, `0002_rls_policies.sql`
     and `0003_storage.sql` (one at a time or all together) → **Run**.

6. **Seed demo papers (optional, recommended)**
   ```bash
   node scripts/seed.mjs
   ```
   This creates the librarian (`admin@paperraj.test` / `paperraj-admin`), a
   contributor (`rahul@example.com` / `paperraj-demo`), three teacher contacts
   and six real, downloadable papers. **Change these before going public.**

7. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>.

8. **Create your first account** → `/signup` (or use the seed librarian).

9. **Test an upload** → `/upload`. Drop in any PDF, JPG, JPEG, PNG or WebP up to
   50 MB, add a class/board/subject, submit. It appears in the library
   immediately when Auto Approval is ON.

10. **Test authentication** → sign out, sign back in, use “Forgot your password”.

11. **Test ownership** → sign in as user A, upload a paper. Sign in as user B in a
    private window: B can view and download A's paper, but `/papers/<id>/edit`
    refuses and the API returns
    `You do not have permission to edit this paper.` (403).

12. **Test admin** → sign in as the librarian, open `/admin`, approve a pending
    paper, flip Auto Approval, resolve a report, delete a comment.

13. **Test downloads** → the counter on the paper's page increases only on
    **Download**, never on View or Details.

14. **Test comments & votes** → sign in, post a comment, like, dislike, remove
    your vote. Guests can read but not post.

---

## 3. Supabase setup

1. **Create the project** → <https://supabase.com> → **New project** → pick an
   organisation, name it `paperraj`, choose a region close to your Render region,
   set a **database password** (save it — you need it in step 7), wait ~2 minutes.

2. **Project URL** → **Project Settings → API → Project URL**
   (looks like `https://abcdefgh.supabase.co`). → `SUPABASE_URL`

3. **Keys** → same screen:
   - `anon` `public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠ **secret, server-side only**

4. **Database connection string** → **Project Settings → Database →
   Connection string → URI**. Replace `[YOUR-PASSWORD]` with the password from
   step 1. Prefer the **Session pooler** URI for Render. → `DATABASE_URL`

5. **Create the tables** → **SQL Editor → New query** → paste
   `supabase/migrations/0001_schema.sql` → **Run**. Then repeat for
   `0002_rls_policies.sql` and `0003_storage.sql`.
   All three files are idempotent, so running them twice is safe.

6. **Storage bucket** → `0003_storage.sql` already creates the **private**
   bucket `paperraj-papers` (50 MB limit, PDF/JPG/PNG/WebP only) with its
   policies. Verify under **Storage → paperraj-papers**; it must show
   **Private**.

7. **Authentication**
   - **Authentication → Providers → Email**: enabled (default).
   - **Authentication → Sign In / Up → Email**: turn *Confirm email* **off** for
     the simplest first run (you can enable it later; PaperRaj then asks users
     to confirm before signing in).
   - **Authentication → URL Configuration → Site URL**:
     `https://<your-render-app>.onrender.com`
   - **Redirect URLs**: add
     `https://<your-render-app>.onrender.com/**` **and**
     `http://localhost:3000/**`.

8. **Row Level Security** → enabled by `0002_rls_policies.sql`. Check any table
   under **Table Editor → papers → RLS enabled**.

9. **Create the administrator**
   1. Set `ADMIN_EMAIL=you@gmail.com` in your environment **before** signing up.
   2. Open the site → **Create account** → use exactly that email.
   3. The account is created with `role = 'admin'` → `/admin` becomes the
      Librarian's Desk.
   Already signed up before setting it? Promote the account with SQL:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@gmail.com';
   ```
   There is **no hardcoded admin password** anywhere in the codebase.

---

## 4. Deploy to Render

*I have the project on my computer — now what?*

### STEP 1 — Create the GitHub repository
1. Go to <https://github.com/new>.
2. Repository name: `paperraj`. Visibility: **Private** (recommended).
3. Do **not** add a README (we already have one). Click **Create repository**.

### STEP 2 — Push the project
```bash
cd paperraj
git init
git add .
git commit -m "PaperRaj — school question paper archive"
git branch -M main
git remote add origin https://github.com/<your-username>/paperraj.git
git push -u origin main
```
⚠ `.env`, `.env.local` are git-ignored — **check** with `git status` that no
`.env` file is staged before pushing.

### STEP 3 — Create the Supabase project
Follow section 3 above and run the three SQL files.

### STEP 4 — Run the database setup
Already done in STEP 3 (SQL Editor → Run). Nothing else to do.

### STEP 5 — Create the storage bucket
Also done by `0003_storage.sql`. Confirm the bucket is **private**.

### STEP 6 — Configure authentication
Section 3, point 7 (Site URL + Redirect URLs point at your Render URL).

### STEP 7 — Create the Render service
1. <https://dashboard.render.com> → **New +** → **Blueprint** → select the
   `paperraj` repository. Render reads `render.yaml` and pre-fills everything.
   *(No blueprint? Use **New + → Web Service**, pick the repo, and fill in the
   values from the table below.)*
2. **Service type:** *Web Service* · **Runtime:** *Node* · **Region:** closest to
   your Supabase region · **Branch:** `main` · **Instance type:** Starter.
3. Fill in the environment variables it asks for (all `sync: false` ones):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase connection URI (with the real password) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-app>.onrender.com` |
   | `SUPABASE_URL` | `https://abcdefgh.supabase.co` |
   | `SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key ⚠ secret |
   | `SUPABASE_STORAGE_BUCKET` | `paperraj-papers` |
   | `ADMIN_EMAIL` | your admin email address |
   | `PUBLIC_OWNER_EMAIL` / `PUBLIC_YOUTUBE_URL` / `PUBLIC_OWNER_NAME` | optional branding |
   | `MAX_UPLOAD_MB` | `50` |

   Render's build command: `npm ci && npm run build`
   Render's start command: `npm run start`
   Health check path: `/api/health`
4. Click **Apply** / **Create Web Service**.

### STEP 8 — Deploy
Render installs dependencies, builds, and starts automatically. Wait for
**Live**. The first build takes 2–4 minutes.

### STEP 9 — Open the Render URL
`https://<your-app>.onrender.com` — you should see the PaperRaj library.
Then set `NEXT_PUBLIC_SITE_URL` (and the Supabase Site URL) to this exact URL so
SEO metadata, password-reset links and PWA icons resolve correctly.

### STEP 10 — Create the administrator
Set `ADMIN_EMAIL` in Render **before** you sign up (Environment → Add, then
**Manual Deploy → Deploy latest commit**). Open the site → **Create account** →
use that email → you are the librarian. Or promote an existing account with the
SQL in section 3, step 9.

### STEP 11 — Test upload
`/upload` → pick a PDF → submit. If Auto Approval is ON it is public instantly.

### STEP 12 — Test authentication
Sign up, sign out, sign in, request a password reset (check the Supabase auth
email, or your own SMTP settings under Authentication → Emails).

### STEP 13 — Test ownership
Two accounts, A and B. A uploads. B can view + download but every edit/delete
attempt returns *“You do not have permission to edit/delete this paper.”*

### STEP 14 — Test admin
`/admin` → Overview shows pending papers, reports, downloads, storage. Approve
one, approve all, flip Auto Approval, resolve a report, delete a comment.

### STEP 15 — Install on Android
Open the site in **Chrome** → tap **⋮** (top right) → **Install app** /
**Add to Home screen** → **Install**. PaperRaj opens full-screen from the home
screen.

### STEP 16 — Install on iPhone
Open the site in **Safari** → tap the **Share** icon (square with an arrow) →
scroll down → **Add to Home Screen** → **Add**. (iOS does not support every PWA
feature Android does — no install prompt banner, and push notifications are more
restricted — but PaperRaj is a proper standalone app on both platforms.)

### STEP 17 — Updating the live website
1. Edit the code locally.
2. ```bash
   git add . && git commit -m "Describe the change" && git push
   ```
3. Render auto-deploys the `main` branch (`autoDeploy: true`). To deploy
   manually: Render dashboard → your service → **Manual Deploy** →
   **Deploy latest commit**.
4. Watch the deploy: service page → **Events** / **Logs** tab.

#### Reading deployment logs
Dashboard → your service → **Logs** (runtime) and **Events** (build). Filter by
“All” if a build fails.

#### Common build failures
| Symptom | Fix |
| --- | --- |
| `DATABASE_URL is required` | Add/fix `DATABASE_URL` in Environment. |
| Build fails on `npm ci` | Ensure `package-lock.json` is committed. |
| Runtime “relation papers does not exist” | You skipped the SQL migrations — run all three files. |
| Supabase `ENOTFOUND` / timeouts | Use the **session pooler** URI, not the direct DB host. |
| `PGRST` / `permission denied` in logs | `SUPABASE_SERVICE_ROLE_KEY` missing or wrong. |
| Uploads fail with “object storage failed” | Bucket name mismatch — must be `paperraj-papers`. |
| Password reset emails never arrive | Authentication → Emails → set a real SMTP sender. |
| Old version still showing | Hard-refresh; then Render → Manual Deploy. |

---

## 5. How security works

1. **Server-side authorization first.** Every write goes through a Next.js route
   handler that re-reads the session cookie from the database and checks
   ownership. Buttons are never the only guard.
2. **Row Level Security** on every table (public read of approved papers only,
   owners limited to their own rows, admin-only policies, blocked ownership
   changes via a trigger).
3. **Private storage bucket.** Files are uploaded and deleted with the
   service-role key, which lives only in server environment variables. Readers
   get short-lived signed URLs, so pending papers cannot be guessed.
4. **File validation.** The extension, the declared size, *and* the actual magic
   bytes of every upload are checked (`%PDF-`, JPEG `FF D8 FF`, PNG signature,
   `RIFF…WEBP`). A renamed executable is rejected.
5. **Duplicate filenames.** Rejected in the application layer **and** by a
   unique, case-insensitive index on `papers.file_name` (also on rename).
6. **Passwords.** Supabase Auth when configured; otherwise scrypt with a random
   per-user salt, compared in constant time. No plaintext anywhere.
7. **No secrets in the client.** Only `NEXT_PUBLIC_*` values reach the browser.
   The service-role key never leaves the server.

---

## 6. Feature checklist

**Guest** — browse · search · filter · sort · view · download · upload (name required)
**Signed in** — everything above, plus own uploads, edit, delete, comments, one vote per paper
**Librarian** — overview statistics · pending queue · approve / approve all · edit or delete any
paper · Auto Approval toggle · maximum upload size · reports · comment moderation ·
users & roles · teacher directory · audit log

**Library** — result count (“7 files found”), 100 papers per page with numbered
pagination, filters for Class, Board, Subject, Exam, Year, Paper type, School and
file type, sorting (newest, oldest, A–Z, Z–A, most downloaded, most liked)

**Papers** — PDF reader and image viewer in the browser, download counting,
likes/dislikes with a single current vote per user, comments, reports
(Incorrect content, Duplicate, Inappropriate, Wrong metadata, Suspicious file, Other)

**Platform** — Year Papers and Specimen Papers sections, Subjects / Classes /
Boards catalogues built from live data, teacher directory, About & Contact with
configurable Gmail and YouTube links, public statistics, privacy & terms pages

**PWA** — manifest, standalone display, theme colour, maskable icons, service
worker with offline page and asset caching, install prompt, Apple touch icon and
mobile meta tags

---

## 7. Testing checklist (copy into your QA run)

<details>
<summary><strong>Click to expand</strong></summary>

**Guest**
- [ ] Home page loads with tagline and description
- [ ] Browse library without an account
- [ ] Search by filename, subject and uploader
- [ ] Filter by class, board, subject, exam, year, paper type, school, file type
- [ ] Sort by all six options
- [ ] View a PDF in the reader; view an image
- [ ] Download increments only the download count
- [ ] Upload with an uploader name → appears in the library (Auto Approval ON)

**Authenticated user**
- [ ] Sign up · sign out · sign in · password reset
- [ ] Upload (name and school pre-filled from the profile)
- [ ] My Uploads lists only their own papers with status, counts, View/Edit/Delete
- [ ] Edit metadata without re-uploading the file
- [ ] Rename a file to an existing name → “A file with this name already exists.”
- [ ] Delete own paper → confirmation → record and stored file removed
- [ ] Try to edit another user's paper → 403
- [ ] Try to delete another user's paper → 403
- [ ] Post a comment · like · dislike · change vote · remove vote
- [ ] Cannot vote twice on the same paper

**Administrator**
- [ ] `/admin` redirects unauthenticated users to sign in
- [ ] Non-admin sees “Administrator access required”
- [ ] Overview statistics are correct
- [ ] Approve one pending paper · approve all pending
- [ ] Edit and delete any paper
- [ ] Toggle Auto Approval and verify new uploads follow it
- [ ] Change the maximum upload size
- [ ] Resolve a report · delete a comment
- [ ] Promote/demote a user

**Files**
- [ ] Valid PDF accepted · valid JPG/PNG/WebP accepted
- [ ] `.exe` renamed to `.pdf` rejected
- [ ] File over 50 MB rejected with the correct message
- [ ] Duplicate filename rejected (upload and rename)
- [ ] Guest upload requires a name

**PWA**
- [ ] Install on Android (Chrome → ⋮ → Install app)
- [ ] Install on iPhone (Safari → Share → Add to Home Screen)
- [ ] Installed app opens standalone, no browser chrome
- [ ] Mobile layout has no horizontal scrolling
- [ ] Offline page appears when the network is dropped

</details>

---

## 8. Project structure

```
paperraj/
├─ public/
│  ├─ manifest.webmanifest      PWA manifest
│  ├─ sw.js                     service worker (offline shell)
│  ├─ favicon.svg               logo favicon
│  ├─ og-image.png              social share image
│  └─ icons/                    192 / 512 / apple-touch icons
├─ scripts/seed.mjs             demo librarian, contributors, papers, teachers
├─ supabase/migrations/         0001 schema · 0002 RLS · 0003 storage
├─ src/
│  ├─ app/
│  │  ├─ api/                   papers, auth, profile, filters, stats, teachers, admin, health
│  │  ├─ papers/[id]/           details page, /edit, /download, /view, /vote, /comments, /report
│  │  ├─ year-papers/ specimen-papers/ subjects/ classes/ boards/
│  │  ├─ upload/ my-uploads/ profile/ teachers/ statistics/ about/ contact/ privacy/ terms/
│  │  ├─ admin/                 librarian's desk
│  │  ├─ login/ signup/ forgot-password/ reset-password/
│  │  ├─ layout.tsx             SEO + PWA metadata, header, footer, SW registration
│  │  ├─ page.tsx               home + library + about
│  │  └─ globals.css            the whole design system (parchment, ink, brass)
│  ├─ components/               Header, Footer, Library, PaperActions, UploadForm, AdminDashboard…
│  ├─ db/                       Drizzle client + schema
│  └─ lib/                      site, auth, storage, validation, papers, settings, format
├─ .env.example
├─ render.yaml
└─ README.md
```

---

## 9. Troubleshooting

| Problem | Solution |
| --- | --- |
| `npm run dev` says `DATABASE_URL is required` | Create `.env.local` from `.env.example`. |
| Empty library on a fresh database | Nothing has been uploaded yet, or everything is PENDING. Run `node scripts/seed.mjs` for demo data. |
| Upload says “This file type is not supported.” | Only PDF/JPG/JPEG/PNG/WebP pass, and the real file signature must match the extension. |
| Upload says “File exceeds the 50 MB maximum.” | Change the limit at `/admin` → Settings, or with `MAX_UPLOAD_MB`. |
| Cannot sign in after enabling Supabase email confirmation | Confirm the email first; the message on screen says exactly that. |
| Password reset link is not emailed | Supabase → Authentication → Emails → configure a custom SMTP sender. |
| Downloads fail in production but work locally | `SUPABASE_SERVICE_ROLE_KEY` is missing/wrong, so signed URLs cannot be created. |
| Search finds nothing | Filters are additive — press “Clear all”. |
| Installed app shows an old version | Close it fully and reopen; the service worker updates on the next launch. |
| Want to reset everything | Supabase SQL Editor: `truncate papers, comments, votes, reports, teachers cascade;` |

---

## 10. Licenses & credits

PaperRaj is built with Next.js, React, TypeScript, Tailwind CSS, Drizzle ORM,
Supabase and Node.js. Fonts are served from Google Fonts (Cormorant Garamond and
Spectral) with system serif fallbacks.

© PaperRaj — built for students, teachers and archivists.

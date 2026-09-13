# Secure Exam — Phase 1 Backend + Person A's Admin Portal

This delivers the **Day 0 shared foundation**, **Person A's backend module**
(Identity, Auth & Security Core), and **Person A's admin portal screens**
(login + student management) from the Phase 1 plan — wired into a real,
buildable NestJS + TypeORM + PostgreSQL + Next.js monorepo.

Person B (Exam Content) and Person C (Attempt/Answer/Monitoring) backend
modules and admin-portal screens are **not implemented** — only placeholder
files exist so the agreed file structure/ownership is already in place for
them to fill in.

Everything below was built, installed, migrated, booted, and exercised
end-to-end (login, RBAC, audit trail, refresh, rate limiting, and the admin
UI rendering against the live API) while putting this together, and the
build/lint/test commands all pass cleanly.

---

## What's included

### Shared foundation (Day 0)
- npm workspaces monorepo: `apps/api`, `apps/admin-web`, `packages/types`,
  `packages/validation`, `packages/api-client`.
- `packages/types` — entity shapes for User/Auth/Audit (Person A, complete)
  plus placeholder Exam/Question/Attempt/Answer types for Person B/C.
- `packages/validation` — class-validator DTOs for auth/students (Person A),
  placeholder schema files for B/C.
- `packages/api-client` — typed axios wrapper (`client.ts`, `auth.api.ts`,
  `user.api.ts`), placeholder files for B/C's endpoints.
- `docker-compose.yml` (Postgres + API + admin-web), CI skeleton
  (`.github/workflows/ci.yml`), env var contract (`.env.example`).

### Person A — Backend (`apps/api`)
- `modules/auth` — login, JWT access+refresh issuance, refresh rotation with
  revocation-on-reuse, logout.
- `common/guards` + `common/decorators` — `JwtAuthGuard`, `RolesGuard`,
  `@Roles()`, `@Public()`, `@CurrentUser()`, `@AuditLog()` — the Auth
  contract Person B/C build against.
- `common/filters` — centralized exception filter (no leaked stack traces).
- `common/interceptors` — optional auto audit-logging hook.
- `common/config` — Joi-validated env config, single source of secrets.
- `modules/audit` — `AuditService.logEvent()` (the shared B/C contract) plus
  `GET /audit` viewer endpoint.
- `modules/user` — Student/User CRUD, bulk import, bcrypt hashing.
- Helmet, CORS, global `ValidationPipe`, `@nestjs/throttler` rate limiting
  on `/auth/login`, Swagger at `/api/docs`.
- Two hand-written TypeORM migrations (`users`+`students`, `audit_events`).

### Person A — Admin Portal (`apps/admin-web`)
- **Design**: an "institutional register" look — ink/paper/verdigris/gold
  palette, serif headings + sans UI type, hairline-divided ledger rows
  instead of shadowed cards — built for an exam-security context rather
  than a generic SaaS dashboard.
- `contexts/auth-context.tsx` — `AuthProvider`/`useAuth()`: access token
  held in memory only, refresh token in `localStorage`, silent session
  resume on page load via `/auth/refresh`.
- `components/ProtectedRoute.tsx` — redirects to `/login` when unauthenticated.
- `app/login/page.tsx` — sign-in screen.
- `app/(protected)/layout.tsx` — sidebar shell with nav slots already laid
  out for Person B's (`/exams`, `/questions`) and Person C's (`/monitoring`,
  `/audit`, `/results`) screens, marked "Soon" until they're built.
- `app/(protected)/students/page.tsx` — student register: list, add-one
  dialog, CSV bulk-import dialog.
- `components/ui/` — shared `Button`, `Field`, `Badge` primitives.
- `lib/api.ts` — thin re-export of `packages/api-client`.

**Note on fonts**: the design calls for Source Serif 4 + IBM Plex Sans via
Google Fonts, but `next/font/google` fetches those at *build time*, which
fails in network-restricted environments (this is exactly what happened
while verifying the build here). The Tailwind config currently falls back to
system font stacks (`ui-serif`/`ui-sans-serif` and friends) so the build
never depends on external network access. If your environment has open
internet access, you can restore the original web fonts — see
"Restoring Google Fonts" below.

---

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose (or a local PostgreSQL 16 instance)

---

## 1. Install everything

From the repo root:

```bash
npm install
```

This installs all workspaces (`apps/api`, `apps/admin-web`, `packages/*`) in
one pass.

## 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin-web/.env.example apps/admin-web/.env
```

Edit the JWT secrets in `apps/api/.env` for anything beyond local dev.
`apps/admin-web/.env`'s `NEXT_PUBLIC_API_URL` only matters if your API isn't
on `http://localhost:3000` — see the note in that file about it being a
**build-time** value.

## 3. Start PostgreSQL

Option A — Docker Compose (starts Postgres + API + admin-web together):

```bash
docker compose up --build
```

Option B — Postgres only, run the apps yourself:

```bash
docker compose up -d postgres
```

## 4. Run database migrations

```bash
npm run migration:run --workspace=apps/api
```

This creates the `users`, `students`, and `audit_events` tables.

## 5. Start the apps (skip if using `docker compose up` for everything)

```bash
# Terminal 1 — API, http://localhost:3000, Swagger at /api/docs
npm run api:start

# Terminal 2 — Admin portal, http://localhost:3001
npm run admin:dev
```

## 6. Seed an admin user

There's no seed script yet (not required by the Phase 1 exit checklist) —
insert one manually:

```bash
node -e "require('bcrypt').hash('AdminPass123', 12).then(console.log)"
```

```sql
INSERT INTO users (email, "fullName", "passwordHash", role)
VALUES ('admin@example.com', 'Admin User', '$2b$12$CE8bajpNJ87HahgWz/K.X.ySV8BCYQb35UoRQDp14k8odl.HLoBvG', 'admin');
```

Run that against your Postgres instance, e.g.:

```bash
psql "postgres://exam_user:exam_pass@localhost:5432/secure_exam" -c "INSERT INTO users (email, "fullName", "passwordHash", role)
VALUES ('admin@example.com', 'Admin User', '$2b$12$CE8bajpNJ87HahgWz/K.X.ySV8BCYQb35UoRQDp14k8odl.HLoBvG', 'admin');"
```

## 7. Try the admin portal

Open `http://localhost:3001` in a browser:

1. You're redirected to `/login`.
2. Sign in with `admin@example.com` / `AdminPass123`.
3. You land on `/students` — add a student, or bulk-import a CSV with
   columns `collegeId,fullName,email`.
4. The sidebar shows `/exams`, `/questions`, `/monitoring`, `/audit`,
   `/results` greyed out with a "Soon" tag — those routes light up once
   Person B and Person C build their screens.
5. "Sign out" in the sidebar revokes the refresh token server-side and
   returns you to `/login`.

## 8. Try the API directly

```bash
# Unauthenticated request -> 401
curl -i http://localhost:3000/students

# Login
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"AdminPass123"}'
# -> { accessToken, refreshToken, user }

TOKEN=<paste accessToken>

# Create a student (admin-only, RBAC-enforced)
curl -s -X POST http://localhost:3000/students \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"collegeId":"CS2026-001","fullName":"Jane Student","email":"jane@example.com","password":"StudentPass1"}'

# List students
curl -s http://localhost:3000/students -H "Authorization: Bearer $TOKEN"

# View the audit trail (LOGIN, STUDENT_CREATED, etc.)
curl -s http://localhost:3000/audit -H "Authorization: Bearer $TOKEN"

# Refresh tokens
curl -s -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<paste refreshToken>"}'

# Logout (revokes the refresh token)
curl -s -X POST http://localhost:3000/auth/logout -H "Authorization: Bearer $TOKEN"
```

A student's token gets `403 Forbidden` on `/students` (admin-only route),
proving RBAC works. Six rapid bad logins within 60s start returning
`429 Too Many Requests`, proving brute-force rate limiting works.

## 9. Lint, build, test (same as CI)

```bash
npm run typecheck    # builds packages/types + validation + api-client
npm run api:lint
npm run api:build
npm run api:test
npm run admin:lint
npm run admin:build
```

All of the above were run while building this scaffold and pass cleanly
(6/6 backend unit tests, 0 lint errors, clean builds on both apps).

---

## Restoring Google Fonts (optional, needs open network access)

If your environment can reach `fonts.googleapis.com`, swap back to the
originally-designed pairing:

1. In `apps/admin-web/src/app/layout.tsx`, re-add:
   ```tsx
   import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';

   const sourceSerif = Source_Serif_4({
     subsets: ['latin'], weight: ['400', '600', '700'],
     variable: '--font-source-serif', display: 'swap',
   });
   const plexSans = IBM_Plex_Sans({
     subsets: ['latin'], weight: ['400', '500', '600'],
     variable: '--font-plex-sans', display: 'swap',
   });
   ```
   and apply `className={\`${sourceSerif.variable} ${plexSans.variable}\`}`
   to the `<html>` tag.
2. `tailwind.config.ts`'s `fontFamily` already reads `var(--font-source-serif, ...)`
   and `var(--font-plex-sans, ...)` with system-font fallbacks, so no change
   is needed there — the real fonts simply take over once those CSS
   variables exist.

---

## Known follow-ups

- `npm audit` flags known CVEs in `next@14.2.35` (fixed only in the Next 16
  major) and a couple of its transitive deps (`postcss`, `picomatch`).
  Upgrading to Next 16 involves breaking changes (React 19, App Router
  updates) that should get their own tested PR rather than being bundled
  into Phase 1 scaffolding — flagging it here rather than shipping an
  unvalidated major bump.
- The refresh token is stored in `localStorage`. That's a reasonable Phase 1
  default for an internal admin tool, but consider moving to an httpOnly
  cookie (via a same-origin proxy route) before this is internet-facing.
- No seed script yet for the first admin user — see step 6 above.

---

## Project layout

See `packages/types`, `packages/validation`, `packages/api-client`,
`apps/api/src`, and `apps/admin-web/src` for the full structure — it mirrors
the "File Structure, Ownership & Integration Map" doc exactly, with
`[A]`-owned files fully implemented and `[B]`/`[C]` files left as
placeholders for the other two people to fill in against the same contracts.

## Next steps for Person B / Person C

### Backend
1. Fill in `packages/types/src/exam.types.ts`, `question.types.ts` (Person B)
   and `attempt.types.ts`, `answer.types.ts` (Person C) — shapes are already
   stubbed, just flesh them out as needed.
2. Add `ExamModule`/`QuestionModule` (B) and `AttemptModule`/`AnswerModule`
   (C) under `apps/api/src/modules/`, each in its own folder.
3. Import `AuditService` from `../audit/audit.service` — it's `@Global()`,
   no need to import `AuditModule` again.
4. Guard admin-only endpoints with `@Roles(Role.ADMIN)`; every route is
   already authenticated by default via the global `JwtAuthGuard`.
5. Add the new module to `apps/api/src/app.module.ts`'s `imports` array
   (one-line, additive PR).
6. Write your own TypeORM migrations under
   `apps/api/src/database/migrations/`.
7. Fill in `packages/api-client/src/exam.api.ts`, `question.api.ts` (B) and
   `attempt.api.ts`, `audit.api.ts` (C) — they're currently empty
   placeholders already wired into the package's `index.ts`.

### Admin Portal
1. Add your route folders under `apps/admin-web/src/app/(protected)/` —
   `exams/`, `questions/` (B); `monitoring/`, `audit/`, `results/` (C).
   `(protected)/layout.tsx` already renders `<ProtectedRoute>` and the
   sidebar around whatever you put there.
2. In `apps/admin-web/src/app/(protected)/layout.tsx`, generalize the
   `owner === 'A'` check for your nav item once your route exists, so it
   stops showing "Soon" and starts linking through.
3. Reuse `components/ui/Button`, `Field`, `Badge` for visual consistency —
   don't introduce a second design system for your screens.
4. Reuse `useAuth()` from `contexts/auth-context.tsx` for the current user
   and role; you don't need your own auth handling.
5. Add your typed API calls in `packages/api-client/src/exam.api.ts` etc.
   (see above) and consume them from your screens via `@/lib/api`.

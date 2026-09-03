# Polar Science Portal (SIH PS 26063) — Phase 2

Integrated Polar Science Outreach, Knowledge Repository and Media
Dissemination Portal for NCPOR. Phase 2 adds auth + RBAC + RLS on top of
the Phase 1 foundation.

## What was implemented

**Phase 1 (preserved):**
- Next.js 14 (App Router) + TypeScript strict + Tailwind + polar design tokens.
- `lib/supabase/client.ts` + `server.ts` + `types/supabase.ts`, sticky header/nav/footer, home status panel.

**Phase 2 — Authentication + RBAC + RLS:**
- `supabase/migrations/001_profiles.sql` — `user_role` enum (`admin|researcher|teacher|student|public`), `profiles` table (`id` FK → `auth.users.id`, `full_name`, `email`, `role`, `institution`, `created_at`, `updated_at`), `is_admin()` helper, `prevent_role_escalation` trigger (blocks client role changes), `handle_new_user` trigger (auto-creates profile on `auth.users` insert, sanitizes `admin` → `public`), RLS policies (`select` authenticated, `insert` own non-admin, `update` own, `admin all`), indexes.
- `types/supabase.ts:1` — typed `profiles` + `user_role` (was placeholder).
- `middleware.ts:1` + `lib/supabase/middleware.ts:1` — `updateSession` refreshes Supabase session on every request (required for Server Components).
- `lib/auth/actions.ts:1` — Server Actions `signUp`/`signIn`/`signOut` with validation (6-char password, role whitelist `public|student|teacher|researcher`), `full_name` + `institution` → `raw_user_meta_data`, `emailRedirectTo` → `/auth/callback`.
- `lib/auth/helpers.ts:1` — `getSessionUser()`, `getCurrentProfile()`, `requireUser()`, `requireRole()`.
- `app/auth/callback/route.ts:1` — `exchangeCodeForSession` for email-confirmation flow.
- `app/login/page.tsx:1` + `app/register/page.tsx:1` — replaced `ComingSoon` stubs with real forms (`components/auth/auth-form.tsx:1` — `LoginForm`/`RegisterForm` using `useFormState` + `useFormStatus`).
- `components/layout/user-menu.tsx:1` + `components/layout/site-header.tsx:1` — header now shows signed-in user (name/role/email) + Sign out, or Sign in/Register when anon. Links to `/account`.
- `app/account/page.tsx:1` — protected account page (shows email/name/role/institution, notes RLS guard).
- `.env.example:1` — added `NEXT_PUBLIC_SITE_URL`.
- ESLint + build clean (`lib/supabase/server.ts:26` typed, `middleware.ts` typed).

## Database changes

- **001_profiles** — see `supabase/migrations/001_profiles.sql`. Run it in Supabase Dashboard → SQL Editor (paste + Run). Idempotent.
- Tables: `profiles` only so far. Repository tables arrive in Phase 3.

## Environment variables

`.env.local` (already has `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` for `uumartyqjyauuxwcrpqz`):
```
NEXT_PUBLIC_SUPABASE_URL=https://uumartyqjyauuxwcrpqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=   # still optional (only needed for service_role admin ops)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # optional, for email redirect
```
`.env.local` is gitignored.

## How to run it (Phase 2)

1) One-time DB setup — in Supabase SQL Editor, paste `supabase/migrations/001_profiles.sql` → Run.
   For a polished demo, create your first admin afterwards:
   ```sql
   -- after registering admin@ncpor.local
   update profiles set role='admin' where email='admin@ncpor.local';
   ```
   Also recommended in Supabase → Auth → Configuration: turn **OFF** "Confirm email" for local demos (so signUp immediately signs in), and add `http://localhost:3000/auth/callback` to redirect URLs.

2) Local dev:
```bash
cd C:/Users/USER/Desktop/polar-portal
npm install
npm run dev
# if PowerShell blocks scripts:
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```
Open http://localhost:3000
- Header shows Sign in/Register when anon, or name/role + Sign out when signed in.
- `/register` — create Public/Student/Teacher/Researcher (admin blocked); `/login` — sign in; `/account` — protected (redirects to `/login` if anon).
- Try changing role via Supabase Table Editor as non-admin → trigger raises `Role changes are not allowed`.

Verify before shipping:
```bash
npm run type-check
npm run lint
npm run build
```
All three pass (build shows `ƒ Middleware 85.3kB`).

## What remains

Phase 3: repository schema (expeditions/publications/datasets/media/etc.) + Storage + approval workflow → Phase 4 search → Phase 5 ingestion/pgvector → Phase 6 RAG → Phase 7 AI generation → Phase 8 Education → Phase 9 Map → Phase 10 Media → Phase 11 Admin.

Do not present `profiles` demo rows as official NCPOR data.

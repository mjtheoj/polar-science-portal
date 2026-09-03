# Polar Science Portal (SIH PS 26063) — Phase 1

Integrated Polar Science Outreach, Knowledge Repository and Media
Dissemination Portal for NCPOR. This is the Phase 1 project foundation only:
no auth, no repository, no AI yet — see "What remains" below.

## What was implemented

- Next.js 14 (App Router) + TypeScript, strict mode.
- Tailwind CSS with a custom design token set (`app/globals.css`,
  `tailwind.config.ts`) — polar-ink/ice/glacial-teal palette, not the
  default shadcn slate/zinc theme.
- `components.json` pre-configured so `npx shadcn@latest add <component>`
  works immediately once dependencies are installed.
- Supabase client wiring:
  - `lib/supabase/client.ts` — browser client (Client Components).
  - `lib/supabase/server.ts` — server client for Server Components/Actions
    (cookie-based session), plus a service-role admin client factory for
    later privileged operations (RLS bypass for approvals, analytics).
  - `types/supabase.ts` — placeholder `Database` type until the schema
    exists (Phase 3), so the clients type-check today.
- Basic layout and navigation: sticky header with primary nav (Repository,
  Search, Knowledge Assistant, Education Hub, Polar Map, Media Gallery),
  sign in/register links, and a footer with the SIH-prototype disclaimer.
- A home page that doubles as a Phase 1 verification screen: it live-checks
  the Supabase connection (via `auth.getUser()`, which succeeds with no
  session even before any tables exist) and reports status inline.
- Stub pages for every nav destination so the shell is fully clickable
  during a demo, each labeled with the phase it'll be built in.

## Files changed / created

Everything under this project is new (Phase 0 → Phase 1). Key paths:

```
app/
  layout.tsx            root layout, fonts, header/footer
  page.tsx              home page + Supabase connectivity check
  globals.css           design tokens
  {repository,search,assistant,education,map,media,login,register}/page.tsx
components/
  layout/site-header.tsx, site-nav.tsx, site-footer.tsx, coming-soon.tsx
lib/
  supabase/client.ts, server.ts
  utils.ts               cn() helper (shadcn convention)
types/supabase.ts
tailwind.config.ts, postcss.config.mjs, components.json
package.json, tsconfig.json, next.config.mjs
.env.local, .env.example, .gitignore
```

## Database changes

None yet. Schema design starts in Phase 3.

## Environment variables

`.env.local` is already filled in with the Supabase project you gave me:

```
NEXT_PUBLIC_SUPABASE_URL=https://uumartyqjyauuxwcrpqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=      # add before Phase 3 (server-side only)
OPENAI_API_KEY=                 # not needed until Phase 5
```

`.env.local` is gitignored — never commit it. `.env.example` is the
template for anyone else pulling the repo.

## How to run it

This sandbox has no network access, so dependencies haven't been installed
here. On your own machine:

```bash
cd polar-portal
npm install
npm run dev
```

Then open http://localhost:3000 — the home page's "Phase 1 build status"
panel should show Supabase as **Connected**.

To verify before shipping a phase (per the project's own workflow rules):

```bash
npm run lint
npm run type-check
npm run build
```

## What remains

Everything from Phase 2 onward: authentication + RBAC + RLS, the
repository schema and upload flow, hybrid search, the RAG assistant and
ingestion pipeline, the AI content generator and approval workflow, the
knowledge graph, the polar map, the education hub, the media gallery, and
the admin dashboard — in that order, per the master prompt's phase plan.
Do not start Phase 2 until you've run the app locally and confirmed the
Supabase connection actually shows **Connected**.

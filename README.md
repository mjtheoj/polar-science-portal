# Polar Science Portal (SIH PS 26063) — Phase 3

Knowledge Repository is now live (documents + expeditions + storage + workflow).

## What was implemented

**Phases 1–2 preserved.**

**Phase 3 — Repository + Storage + Workflow:**
- `supabase/migrations/002_repository.sql:1` — enums `content_type` (8 types), `visibility_level`, `approval_status` (7 states), `processing_status`; tables `institutions`, `expeditions` (region `Arctic|Antarctic|...`), `research_topics` (slug), `locations` (lat/lon), `documents` (title/description/storage_path/file_type/size, author/expedition/institution/location FKs, publication_date, language, license, keywords `TEXT[]`, visibility/approval/processing, metadata `JSONB`, FTS index), junctions `document_topics`/`document_authors`, `document_chunks` (Phase 5 prep), `approvals` + `audit_logs`; triggers `set_updated_at`, `set_published_at`, `enforce_workflow` (only admin can `published`/`rejected`/`archived`), RLS (public sees `public+published` or own or `internal+published` if auth, inserts `author_id=auth.uid()`, updates own|admin).
- `supabase/migrations/002b_storage.sql:1` — bucket `repository-files` (public true) + `storage.objects` policies (public read, auth upload, owner update/delete, admin all).
- `supabase/seed.sql:1` — fictional demo institutions (NCPOR/IITM/NIO), 7 topics, 5 locations, 4 expeditions (43/44/46-ISEA, IND-ARC-2023), 6 documents (report/dataset/publication/photo/education) linked to topics. Re-run safe.
- `types/supabase.ts:1` — expanded to 10 tables + 5 enums.
- `lib/repository/queries.ts:1` + `lib/repository/actions.ts:1` — `getDocuments` (q/contentType/region/expedition/topic, pagination 12), `getDocumentById` (joins topics/authors), `uploadDocument` (validates 5-char title, 50MB limit, admin-only `published`, uploads to `repository-files/<uid>/<uuid>.<ext>` then inserts row + topics, revalidates), `updateApproval` (writes `approvals` + `audit_logs`).
- Pages: `app/repository/page.tsx:1` (filters + DocumentCard grid + pagination + migrate hint), `app/repository/[id]/page.tsx:1` (provenance, file `Open/Download` only if `public+published`, image preview, knowledge-graph links, `ApprovalActions`), `app/repository/upload/page.tsx:1` (protected, shows migrate hint if tables missing).
- Components: `components/repository/document-card.tsx:1`, `filters.tsx:1` (search + 4 selects, Clear), `upload-form.tsx:1` (checkbox topics), `approval-actions.tsx:1` (maps `current` → next-state buttons).

## Database changes
- **002_repository** + **002b_storage** + **seed** — run in Supabase SQL Editor in order `001` → `002` → `002b` → `seed`. All idempotent.

## Environment variables
No new vars (uses existing `NEXT_PUBLIC_SUPABASE_URL`). Bucket public URL is `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/repository-files/<path>`.

## How to run (Phase 3)

1) Supabase SQL Editor → run `supabase/migrations/001_profiles.sql`, then `002_repository.sql`, then `002b_storage.sql`, then `supabase/seed.sql` (seed creates demo docs under your first profile — register a user first if empty).
   Promote an admin: `update profiles set role='admin' where email='admin@ncpor.local';`

2) Local:
```bash
cd C:/Users/USER/Desktop/polar-portal
npm install
npm run dev
# PowerShell blocked: powershell -ExecutionPolicy Bypass -Command "npm run dev"
```
Open http://localhost:3000 → `/repository` (filter/search, open any card), `/repository/upload` (as researcher/teacher/admin → create Draft/Submitted, attach PDF/CSV/image), `/repository/[id]` → test workflow buttons (Submit → Under review → Approved → Published; only admin can Publish — DB trigger enforces `Only admins can publish`).

Verify:
```bash
npm run type-check   # ✔
npm run lint         # ✔
npm run build        # ✔ 15 routes, Middleware 85.3kB, /repository 1.1kB
```

## What remains
Phase 4 hybrid search (FTS + filters UI), Phase 5 ingestion/pgvector embeddings, Phase 6 RAG assistant (citations), Phase 7 AI generation + human review, Phase 8 Education Hub, Phase 9 Polar Map (Leaflet), Phase 10 Media Gallery, Phase 11 Admin dashboard.

Never present demo documents as real NCPOR holdings; all seed titles include `(DEMO)`.

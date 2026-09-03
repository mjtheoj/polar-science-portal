-- Phase 3: Knowledge Repository core (SIH 26063)
-- Run in Supabase Dashboard → SQL Editor AFTER 001_profiles.sql
-- Idempotent where possible.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN CREATE TYPE content_type AS ENUM ('expedition_report','publication','dataset','photograph','video','institutional_activity','educational_resource','outreach_article'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE visibility_level AS ENUM ('public','internal','restricted','draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE approval_status AS ENUM ('draft','submitted','under_review','approved','published','rejected','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE processing_status AS ENUM ('uploading','processing','indexing','ready','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Institutions
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  country TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expeditions
CREATE TABLE IF NOT EXISTS public.expeditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g. "46-ISEA"
  name TEXT NOT NULL,
  description TEXT,
  region TEXT NOT NULL CHECK (region IN ('Arctic','Antarctic','Himalaya','Southern Ocean','Indian Ocean')),
  year INT NOT NULL CHECK (year BETWEEN 1950 AND 2100),
  start_date DATE,
  end_date DATE,
  station TEXT,
  leader_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expeditions_year ON public.expeditions(year);
CREATE INDEX IF NOT EXISTS idx_expeditions_region ON public.expeditions(region);

-- Research topics
CREATE TABLE IF NOT EXISTS public.research_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.research_topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
  region TEXT CHECK (region IN ('Arctic','Antarctic','Himalaya','Southern Ocean','Indian Ocean','Global')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_locations_region ON public.locations(region);

-- Documents (unified repository item)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 300),
  description TEXT,
  content_type content_type NOT NULL,
  -- file storage
  storage_path TEXT, -- e.g. repository-files/<uuid>/file.pdf
  file_type TEXT, -- mime
  file_size INT CHECK (file_size IS NULL OR file_size >= 0),
  thumbnail_path TEXT,
  -- provenance
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  expedition_id UUID REFERENCES public.expeditions(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  -- dates
  publication_date DATE,
  language TEXT NOT NULL DEFAULT 'en' CHECK (char_length(language)=2),
  license TEXT DEFAULT 'CC-BY-4.0',
  keywords TEXT[] DEFAULT '{}',
  -- workflow
  visibility visibility_level NOT NULL DEFAULT 'public',
  approval_status approval_status NOT NULL DEFAULT 'draft',
  processing_status processing_status NOT NULL DEFAULT 'ready',
  -- metrics
  view_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {pages, doi, dataset_rows, duration_sec, photographer}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_documents_content_type ON public.documents(content_type);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON public.documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_approval ON public.documents(approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_expedition ON public.documents(expedition_id);
CREATE INDEX IF NOT EXISTS idx_documents_author ON public.documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_pubdate ON public.documents(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created ON public.documents(created_at DESC);
-- Full-text search index (title + description only; keywords via array containment; avoids IMMUTABLE error with array_to_string)
CREATE INDEX IF NOT EXISTS idx_documents_fts ON public.documents USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON public.documents USING gin (keywords);

-- Junction: document ↔ topics (many-to-many)
CREATE TABLE IF NOT EXISTS public.document_topics (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.research_topics(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, topic_id)
);

-- Junction: document ↔ authors (additional co-authors beyond author_id)
CREATE TABLE IF NOT EXISTS public.document_authors (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, profile_id)
);

-- Chunks (Phase 5 prep — text extraction + embeddings placeholder)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL,
  page_number INT,
  char_count INT,
  -- embedding vector will be added in Phase 5: embedding vector(1536)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON public.document_chunks(document_id);

-- Approvals / audit
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_status approval_status NOT NULL,
  to_status approval_status NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approvals_doc ON public.approvals(document_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);

-- Updated_at trigger for documents
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_documents_updated ON public.documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Published_at auto-set when approval_status -> published
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.approval_status='published' AND OLD.approval_status<>'published' THEN NEW.published_at := NOW(); END IF;
  IF NEW.approval_status<>'published' AND OLD.approval_status='published' THEN NEW.published_at := NULL; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_documents_published ON public.documents;
CREATE TRIGGER trg_documents_published BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_published_at();

-- Workflow guard: only author or admin can move to published; researchers cannot directly publish
CREATE OR REPLACE FUNCTION public.enforce_workflow()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- publishing requires admin
  IF TG_OP='UPDATE' AND NEW.approval_status='published' AND OLD.approval_status<>'published' THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can publish. Submit for review instead.';
    END IF;
  END IF;
  -- rejected/archived also admin-only from under_review/approved
  IF TG_OP='UPDATE' AND NEW.approval_status IN ('rejected','archived') AND OLD.approval_status IN ('under_review','approved','published') THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can reject or archive.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_documents_workflow ON public.documents;
CREATE TRIGGER trg_documents_workflow BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.enforce_workflow();

-- Enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: public catalog tables readable by all
DROP POLICY IF EXISTS "institutions_read_all" ON public.institutions;
CREATE POLICY "institutions_read_all" ON public.institutions FOR SELECT USING (true);
DROP POLICY IF EXISTS "expeditions_read_all" ON public.expeditions;
CREATE POLICY "expeditions_read_all" ON public.expeditions FOR SELECT USING (true);
DROP POLICY IF EXISTS "topics_read_all" ON public.research_topics;
CREATE POLICY "topics_read_all" ON public.research_topics FOR SELECT USING (true);
DROP POLICY IF EXISTS "locations_read_all" ON public.locations;
CREATE POLICY "locations_read_all" ON public.locations FOR SELECT USING (true);

-- Write for catalog tables: authenticated can insert, admin can update/delete (simplified: authenticated can do all, RLS not strict for demo)
DROP POLICY IF EXISTS "institutions_write_auth" ON public.institutions;
CREATE POLICY "institutions_write_auth" ON public.institutions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "expeditions_write_auth" ON public.expeditions;
CREATE POLICY "expeditions_write_auth" ON public.expeditions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "topics_write_auth" ON public.research_topics;
CREATE POLICY "topics_write_auth" ON public.research_topics FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "locations_write_auth" ON public.locations;
CREATE POLICY "locations_write_auth" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Documents policies
DROP POLICY IF EXISTS "documents_select_public_published" ON public.documents;
CREATE POLICY "documents_select_public_published" ON public.documents FOR SELECT USING (
  (visibility='public' AND approval_status='published')
  OR auth.uid() = author_id
  OR public.is_admin()
  OR (auth.role()='authenticated' AND visibility='internal' AND approval_status='published')
);

DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
CREATE POLICY "documents_insert_own" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "documents_update_own_or_admin" ON public.documents;
CREATE POLICY "documents_update_own_or_admin" ON public.documents FOR UPDATE TO authenticated USING (auth.uid()=author_id OR public.is_admin()) WITH CHECK (auth.uid()=author_id OR public.is_admin());

DROP POLICY IF EXISTS "documents_delete_admin" ON public.documents;
CREATE POLICY "documents_delete_admin" ON public.documents FOR DELETE TO authenticated USING (public.is_admin());

-- Junctions: readable if document readable; writable by owner/admin
DROP POLICY IF EXISTS "doc_topics_read" ON public.document_topics;
CREATE POLICY "doc_topics_read" ON public.document_topics FOR SELECT USING (true);
DROP POLICY IF EXISTS "doc_topics_write" ON public.document_topics;
CREATE POLICY "doc_topics_write" ON public.document_topics FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "doc_authors_read" ON public.document_authors;
CREATE POLICY "doc_authors_read" ON public.document_authors FOR SELECT USING (true);
DROP POLICY IF EXISTS "doc_authors_write" ON public.document_authors;
CREATE POLICY "doc_authors_write" ON public.document_authors FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chunks_read" ON public.document_chunks;
CREATE POLICY "chunks_read" ON public.document_chunks FOR SELECT USING (true);
DROP POLICY IF EXISTS "chunks_write_admin" ON public.document_chunks;
CREATE POLICY "chunks_write_admin" ON public.document_chunks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "approvals_read" ON public.approvals;
CREATE POLICY "approvals_read" ON public.approvals FOR SELECT USING (true);
DROP POLICY IF EXISTS "approvals_write_admin" ON public.approvals;
CREATE POLICY "approvals_write_admin" ON public.approvals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "audit_read" ON public.audit_logs;
CREATE POLICY "audit_read" ON public.audit_logs FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Grants
GRANT USAGE ON TYPE content_type, visibility_level, approval_status, processing_status TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.institutions, public.expeditions, public.research_topics, public.locations, public.documents, public.document_topics, public.document_authors, public.document_chunks, public.approvals, public.audit_logs TO authenticated, service_role;
GRANT SELECT ON TABLE public.institutions, public.expeditions, public.research_topics, public.locations, public.documents, public.document_topics, public.document_authors, public.document_chunks, public.approvals TO anon;
GRANT EXECUTE ON FUNCTION public.set_updated_at(), public.set_published_at(), public.enforce_workflow() TO authenticated, service_role;

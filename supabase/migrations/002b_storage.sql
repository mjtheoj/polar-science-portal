-- Phase 3 storage (run after 002_repository.sql)
-- Creates public bucket `repository-files` and RLS policies.

-- Create bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('repository-files', 'repository-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies on storage.objects for this bucket
-- Allow public read of published files: we keep bucket public for simplicity,
-- but also add explicit policies so private tests still work.
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
CREATE POLICY "storage_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'repository-files');

DROP POLICY IF EXISTS "storage_auth_upload" ON storage.objects;
CREATE POLICY "storage_auth_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'repository-files');

DROP POLICY IF EXISTS "storage_auth_update_own" ON storage.objects;
CREATE POLICY "storage_auth_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'repository-files' AND owner = auth.uid());

DROP POLICY IF EXISTS "storage_auth_delete_own" ON storage.objects;
CREATE POLICY "storage_auth_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'repository-files' AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin')));

DROP POLICY IF EXISTS "storage_admin_all" ON storage.objects;
CREATE POLICY "storage_admin_all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id='repository-files' AND public.is_admin())
WITH CHECK (bucket_id='repository-files' AND public.is_admin());

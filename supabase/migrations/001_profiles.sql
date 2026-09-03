-- Phase 2: profiles + RLS for Polar Science Portal (SIH 26063)
-- Run this in Supabase Dashboard → SQL Editor (paste entire file → Run).
-- Idempotent: safe to re-run.

-- 1) Role enum (lowercase canonical; UI maps Admin/Researcher/etc.)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin','researcher','teacher','student','public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) profiles table (id = auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
  email TEXT NOT NULL CHECK (position('@' IN email) > 1),
  role public.user_role NOT NULL DEFAULT 'public',
  institution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3) Helper: is caller an admin? (SECURITY DEFINER so it bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4) Guard: block role escalation unless admin (service_role bypasses RLS+triggers via bypass)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- always bump updated_at
  NEW.updated_at := NOW();
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    -- allow service_role (bypasses RLS but trigger still fires; check jwt role claim as fallback)
    IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Role changes are not allowed. Contact an administrator.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_role_guard ON public.profiles;
CREATE TRIGGER trg_profiles_role_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 5) Auto-create profile on signup (handles email-confirmation ON or OFF)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.user_role;
BEGIN
  -- sanitize role from metadata: never allow 'admin' via self-signup; downgrade silently
  BEGIN
    requested_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'public');
  EXCEPTION WHEN others THEN
    requested_role := 'public';
  END;
  IF requested_role = 'admin' THEN
    requested_role := 'public';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, institution)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    requested_role,
    NULLIF(trim(NEW.raw_user_meta_data->>'institution'), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6) RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean up any previous policies with same names (idempotent re-run)
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_non_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- SELECT: any authenticated user can read all profiles (needed for admin listing + header)
CREATE POLICY "profiles_select_all_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- INSERT: user can only insert their own row and never as admin
CREATE POLICY "profiles_insert_own_non_admin"
  ON public.profiles FOR INSERT TO authenticated, anon
  WITH CHECK (auth.uid() = id AND role <> 'admin');

-- UPDATE: user can only update own row (role change blocked by trigger above); admin can update any
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin full access (select/insert/update/delete) — extra convenience; service_role already bypasses RLS
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No DELETE policy for normal users; deletes only via service_role or admin (via above policy)

-- 7) For local dev: ensure anon/authenticated can still call is_admin/handle_new_user
GRANT USAGE ON TYPE public.user_role TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

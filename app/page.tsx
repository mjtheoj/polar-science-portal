import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function getSupabaseStatus() {
  try {
    const supabase = await createClient();
    // auth.getUser() succeeds (with a null user) even with no schema yet —
    // it's a lightweight way to confirm the URL/anon key are wired correctly.
    const { error } = await supabase.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") {
      return { connected: false, detail: error.message };
    }
    return { connected: true, detail: "Reachable, no active session." };
  } catch (err) {
    return {
      connected: false,
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export default async function HomePage() {
  const status = await getSupabaseStatus();

  return (
    <div className="container py-16">
      <section className="max-w-2xl">
        <p className="text-sm text-muted-foreground mb-3">
          Smart India Hackathon — Problem Statement 26063
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          One research source, many knowledge experiences.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          A unified home for NCPOR&apos;s expedition reports, publications,
          datasets and media — searchable, connected, and open to
          researchers, teachers, students and the public alike.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/search"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search the repository
          </Link>
          <Link
            href="/assistant"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Ask the knowledge assistant
          </Link>
        </div>
      </section>

      <section className="mt-16 max-w-2xl border-t border-border pt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Phase 3 build status
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Frontend foundation</dt>
            <dd className="font-medium text-primary">Next.js + TypeScript + Tailwind ready</dd>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Supabase connection</dt>
            <dd
              className={
                status.connected
                  ? "font-medium text-primary"
                  : "font-medium text-destructive"
              }
            >
              {status.connected ? "Connected" : `Not connected — ${status.detail}`}
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Auth + RLS</dt>
            <dd className="font-medium text-primary">Phase 2 — profiles + middleware</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Repository</dt>
            <dd className="font-medium text-primary">Phase 3 — documents/expeditions/institutions + Storage + workflow</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Run 001_profiles.sql → 002_repository.sql → 002b_storage.sql → seed.sql in Supabase SQL Editor, then visit /repository and /repository/upload.
        </p>
      </section>
    </div>
  );
}

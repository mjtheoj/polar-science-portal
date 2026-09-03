import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadDocument } from "@/lib/repository/actions";
import { UploadForm } from "@/components/repository/upload-form";

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/repository/upload");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role?: string } | null)?.role;
  if (role && !["researcher", "teacher", "admin", "student"].includes(role)) {
    // public can still view but encourage upgrade — not blocking for prototype
  }

  const [{ data: exps }, { data: insts }, { data: locs }, { data: topics }] = await Promise.all([
    supabase.from("expeditions").select("id, code, name").order("year", { ascending: false }),
    supabase.from("institutions").select("id, name").order("name"),
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("research_topics").select("id, name").order("name"),
  ]);

  // If tables not migrated, show guidance
  const notMigrated = !exps && !insts;

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="font-display text-2xl font-semibold">Upload to repository</h1>
      <p className="mt-2 text-sm text-muted-foreground">Researchers: upload reports, publications, datasets, photos, videos. All uploads start as <em>draft/submitted</em> — admins publish (enforced by DB workflow trigger). Files go to Supabase Storage bucket <code>repository-files</code>.</p>

      {notMigrated ? (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-medium">Repository tables not found</p>
          <p className="mt-1">Run <code>supabase/migrations/002_repository.sql</code> and <code>002b_storage.sql</code> in Supabase SQL Editor first, then refresh.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border bg-card p-6">
          <UploadForm
            action={uploadDocument}
            expeditions={(exps as { id: string; code: string; name: string }[] | null) ?? []}
            institutions={(insts as { id: string; name: string }[] | null) ?? []}
            locations={(locs as { id: string; name: string }[] | null) ?? []}
            topics={(topics as { id: string; name: string }[] | null) ?? []}
          />
        </div>
      )}
    </div>
  );
}

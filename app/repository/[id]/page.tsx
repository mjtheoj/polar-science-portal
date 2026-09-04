import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById } from "@/lib/repository/queries";
import { ApprovalActions } from "@/components/repository/approval-actions";

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const { document: doc, error, topics, authors } = await getDocumentById(params.id);
  if (error || !doc) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === (doc as { author_id: string }).author_id;

  const exp = (doc as { expeditions?: { code?: string; name?: string; region?: string; year?: number } | null }).expeditions;
  const inst = (doc as { institutions?: { name?: string } | null }).institutions;
  const loc = (doc as { locations?: { name?: string; latitude?: number; longitude?: number } | null }).locations;
  const meta = (doc as { metadata?: Record<string, unknown> }).metadata ?? {};
  const storagePath = (doc as { storage_path?: string | null }).storage_path;
  const fileType = (doc as { file_type?: string | null }).file_type;
  const originalName = (meta as { original_filename?: string }).original_filename as string | undefined;
  const displayFileName = originalName || (storagePath ? storagePath.split("/").pop() ?? storagePath : null) || null;
  const fileLabel = displayFileName || (doc as { title: string }).title;

  // Build public storage URL if present (bucket is public) — use download param for nice filename
  const publicUrl = storagePath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/repository-files/${encodeURIComponent(storagePath).replace(/%2F/g, "/")}`
    : null;
  const downloadUrl = publicUrl && displayFileName ? `${publicUrl}?download=${encodeURIComponent(displayFileName)}` : publicUrl;

  const topicNames = (topics as { research_topics: { name: string } }[] | null)?.map((t) => t.research_topics.name) ?? [];
  const coAuthors = (authors as { profiles: { full_name: string } }[] | null)?.map((a) => a.profiles.full_name) ?? [];

  return (
    <div className="container py-8 max-w-4xl">
      <Link href="/repository" className="text-sm text-primary hover:underline">← Back to repository</Link>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-secondary px-2 py-1 font-medium capitalize">{String((doc as { content_type: string }).content_type).replace("_", " ")}</span>
        <span className="rounded border px-2 py-1 capitalize">{String((doc as { approval_status: string }).approval_status).replace("_", " ")} · {String((doc as { visibility: string }).visibility)}</span>
        {exp?.code && <span className="rounded border px-2 py-1">{exp.code} · {exp.year} · {exp.region}</span>}
      </div>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">{(doc as { title: string }).title}</h1>
      <p className="mt-3 text-muted-foreground">{(doc as { description: string | null }).description}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-medium">Provenance</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Author</dt><dd className="font-medium">{isOwner ? "You" : (doc as { author_id: string }).author_id.slice(0, 8) + "…"}</dd></div>
              {coAuthors.length > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Co-authors</dt><dd className="font-medium">{coAuthors.join(", ")}</dd></div>}
              {inst?.name && <div className="flex justify-between"><dt className="text-muted-foreground">Institution</dt><dd className="font-medium">{inst.name}</dd></div>}
              {exp?.name && <div className="flex justify-between"><dt className="text-muted-foreground">Expedition</dt><dd className="font-medium">{exp.name}</dd></div>}
              {topicNames.length > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Topics</dt><dd className="font-medium">{topicNames.join(", ")}</dd></div>}
              {loc?.name && <div className="flex justify-between"><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{loc.name} {loc.latitude != null ? `(${loc.latitude}, ${loc.longitude})` : ""}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-foreground">Published</dt><dd className="font-medium">{(doc as { publication_date: string | null }).publication_date ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">License</dt><dd className="font-medium">{(doc as { license: string | null }).license ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Keywords</dt><dd className="font-medium">{((doc as { keywords: string[] | null }).keywords ?? []).join(", ") || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Visibility</dt><dd className="font-medium capitalize">{(doc as { visibility: string }).visibility}</dd></div>
            </dl>
          </div>

          {Object.keys(meta).length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium">Metadata</h3>
              <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(meta, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">File</h3>
            {storagePath ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium truncate" title={displayFileName ?? undefined}>{displayFileName}</p>
                <p className="text-xs text-muted-foreground truncate">{fileType ? `${fileType}` : ""}{fileType && (doc as { file_size?: number | null }).file_size ? ` · ${(((doc as { file_size: number }).file_size) / 1024).toFixed(1)} KB` : ""}</p>
                {publicUrl && (doc as { visibility: string }).visibility === "public" && (doc as { approval_status: string }).approval_status === "published" ? (
                  <div className="flex gap-2">
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-block rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      View
                    </a>
                    <a href={downloadUrl ?? publicUrl} download={displayFileName ?? undefined} className="inline-block rounded-md border px-3 py-2 text-sm font-medium hover:bg-secondary">
                      Download
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">File is {String((doc as { visibility: string }).visibility)}/{String((doc as { approval_status: string }).approval_status)} — only published/public files are directly viewable on the public portal. Owners/admins can still open via Supabase console.</p>
                )}
                {fileType?.startsWith("image/") && publicUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={publicUrl} alt={fileLabel} className="mt-2 w-full rounded border" />
                )}
                {publicUrl && fileType === "application/pdf" && (doc as { visibility: string }).visibility === "public" && (doc as { approval_status: string }).approval_status === "published" && (
                  <iframe src={publicUrl} title={fileLabel} className="mt-2 h-96 w-full rounded border" />
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No file attached — metadata-only record. Attach via upload/edit.</p>
            )}
          </div>

          <div className="rounded-lg border bg-secondary/40 p-4">
            <h3 className="font-medium text-sm">Knowledge graph</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {exp?.code && <li>Expedition → <Link href={`/repository?expeditionId=${(doc as { expedition_id: string | null }).expedition_id}`} className="text-primary hover:underline">{exp.code}</Link></li>}
              {loc?.name && <li>Location → {loc.name}</li>}
              {topicNames.map((t) => <li key={t}>Topic → {t}</li>)}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Phase 3 shows PostgreSQL FKs. Graph UI deepens in later phases.</p>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium text-sm">Workflow</h3>
            <p className="mt-1 text-xs text-muted-foreground">DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PUBLISHED (admin publishes; trigger enforces).</p>
            <div className="mt-3">
              <ApprovalActions documentId={params.id} current={(doc as { approval_status: string }).approval_status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

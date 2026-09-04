import Link from "next/link";

const typeLabel: Record<string, string> = {
  expedition_report: "Report",
  publication: "Publication",
  dataset: "Dataset",
  photograph: "Photo",
  video: "Video",
  institutional_activity: "Activity",
  educational_resource: "Education",
  outreach_article: "Outreach",
};

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-800",
  under_review: "bg-sky-100 text-sky-800",
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  archived: "bg-secondary text-secondary-foreground",
};

export function DocumentCard({ doc }: { doc: Record<string, unknown> }) {
  const title = doc.title as string;
  const id = doc.id as string;
  const ct = doc.content_type as string;
  const desc = (doc.description as string) || "";
  const exp = doc.expeditions as { code?: string; year?: number } | null;
  const keywords = (doc.keywords as string[] | null) ?? [];
  const status = (doc.approval_status as string) ?? "draft";
  const pubDate = doc.publication_date as string | null;
  const meta = (doc.metadata as Record<string, unknown> | null) ?? null;
  const originalName = meta && typeof meta.original_filename === "string" ? (meta.original_filename as string) : null;
  const storagePath = doc.storage_path as string | null;
  const displayFile = originalName || (storagePath ? storagePath.split("/").pop() ?? null : null);
  return (
    <Link href={`/repository/${id}`} className="group flex flex-col rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">{typeLabel[ct] ?? ct}</span>
        <span className={`rounded px-2 py-0.5 font-medium ${statusColor[status] ?? "bg-muted"}`}>{status.replace("_", " ")}</span>
        {exp?.code && <span className="text-muted-foreground">{exp.code} · {exp.year}</span>}
      </div>
      <h3 className="mt-2 line-clamp-2 font-display text-base font-semibold leading-tight group-hover:text-primary">{title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {keywords.slice(0, 3).map((k) => (
          <span key={k} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{k}</span>
        ))}
      </div>
      {displayFile && <p className="mt-2 truncate text-xs text-muted-foreground" title={displayFile}>📎 {displayFile}</p>}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{pubDate ? new Date(pubDate).getFullYear().toString() : ""}</span>
        <span className="font-medium text-primary group-hover:underline">Open →</span>
      </div>
    </Link>
  );
}

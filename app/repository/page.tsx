import Link from "next/link";
import { getDocuments, getExpeditions, getTopics } from "@/lib/repository/queries";
import { DocumentCard } from "@/components/repository/document-card";
import { Filters } from "@/components/repository/filters";

export default async function RepositoryPage({
  searchParams,
}: {
  searchParams: { q?: string; contentType?: string; region?: string; year?: string; expeditionId?: string; topicId?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? "1") || 1;
  const { documents, count, error } = await getDocuments({
    q: searchParams.q,
    contentType: searchParams.contentType,
    region: searchParams.region,
    year: searchParams.year,
    expeditionId: searchParams.expeditionId,
    topicId: searchParams.topicId,
    page,
  });
  const [expeditions, topics] = await Promise.all([getExpeditions(), getTopics()]);
  const totalPages = Math.max(1, Math.ceil(count / 12));

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Knowledge Repository</h1>
          <p className="text-sm text-muted-foreground">Reports, publications, datasets, photos & videos — filter by type, expedition, region, topic. Only <em>published/public</em> items are public; owners & admins see more.</p>
        </div>
        <Link href="/repository/upload" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Upload document
        </Link>
      </div>

      <div className="mt-6">
        <Filters expeditions={expeditions} topics={topics} />
      </div>

      {error ? (
        <div className="mt-8 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">Repository not yet migrated</p>
          <p className="mt-1">Run `supabase/migrations/002_repository.sql` + `002b_storage.sql` in Supabase SQL Editor, then refresh. Detail: {error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">No documents match these filters</p>
          <p className="mt-2 text-sm text-muted-foreground">Upload one as a researcher, or try “Clear”.</p>
          <Link href="/repository/upload" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Upload first document</Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">{count} result{count === 1 ? "" : "s"} · page {page} of {totalPages}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((d) => (
              <DocumentCard key={(d as { id: string }).id} doc={d as unknown as Record<string, unknown>} />
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            {page > 1 && <Link href={`/repository?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-secondary">Previous</Link>}
            {page < totalPages && <Link href={`/repository?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-secondary">Next</Link>}
          </div>
        </>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export async function getDocuments(opts: {
  q?: string;
  contentType?: string;
  region?: string;
  year?: string;
  expeditionId?: string;
  topicId?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(24, Math.max(6, opts.pageSize ?? 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("documents")
    .select("*, expeditions(code, name, region, year), institutions(name), locations(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.q) {
    const q = opts.q.replace(/,/g, " ").trim();
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (opts.contentType) query = query.eq("content_type", opts.contentType as never);
  if (opts.expeditionId) query = query.eq("expedition_id", opts.expeditionId);
  if (opts.year) {
    // filter by expeditions.year via join not directly filterable; do client-side after fetch for now
  }

  const { data, error, count } = await query;
  if (error) return { documents: [], count: 0, error: error.message, page, pageSize };

  // client-side region/year filter when expeditions joined
  let filtered = data as unknown as (DocumentRow & { expeditions: { region: string; year: number } | null })[];
  if (opts.region) filtered = filtered.filter((d) => d.expeditions?.region === opts.region);
  if (opts.year) filtered = filtered.filter((d) => String(d.expeditions?.year) === opts.year);

  return { documents: filtered, count: count ?? filtered.length, error: null, page, pageSize };
}

export async function getDocumentById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, expeditions(*), institutions(*), locations(*)")
    .eq("id", id)
    .single();
  if (error) return { document: null, error: error.message };
  // also fetch topics/authors
  const [{ data: topics }, { data: authors }] = await Promise.all([
    supabase.from("document_topics").select("research_topics(*)").eq("document_id", id),
    supabase.from("document_authors").select("profiles(id, full_name, email)").eq("document_id", id),
  ]);
  return { document: data as unknown as DocumentRow & Record<string, unknown>, topics, authors, error: null };
}

export async function getExpeditions() {
  const supabase = await createClient();
  const { data } = await supabase.from("expeditions").select("id, code, name, region, year").order("year", { ascending: false });
  return (data ?? []) as { id: string; code: string; name: string; region: string; year: number }[];
}

export async function getTopics() {
  const supabase = await createClient();
  const { data } = await supabase.from("research_topics").select("id, name, slug").order("name");
  return (data ?? []) as { id: string; name: string; slug: string }[];
}

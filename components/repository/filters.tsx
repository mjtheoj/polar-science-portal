"use client";

import { useRouter, useSearchParams } from "next/navigation";

const contentTypes = [
  ["", "All types"],
  ["expedition_report", "Report"],
  ["publication", "Publication"],
  ["dataset", "Dataset"],
  ["photograph", "Photo"],
  ["video", "Video"],
  ["educational_resource", "Education"],
  ["outreach_article", "Outreach"],
] as const;

const regions = [["", "All regions"], ["Antarctic", "Antarctic"], ["Arctic", "Arctic"], ["Himalaya", "Himalaya"], ["Southern Ocean", "Southern Ocean"]] as const;

export function Filters({
  expeditions,
  topics,
}: {
  expeditions: { id: string; code: string; name: string }[];
  topics: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete("page");
    router.push(`/repository?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        defaultValue={params.get("q") ?? ""}
        placeholder="Search title/description…"
        onKeyDown={(e) => {
          if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
        }}
        className="w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <select value={params.get("contentType") ?? ""} onChange={(e) => set("contentType", e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
        {contentTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={params.get("region") ?? ""} onChange={(e) => set("region", e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
        {regions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={params.get("expeditionId") ?? ""} onChange={(e) => set("expeditionId", e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
        <option value="">All expeditions</option>
        {expeditions.map((e) => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
      </select>
      <select value={params.get("topicId") ?? ""} onChange={(e) => set("topicId", e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
        <option value="">All topics</option>
        {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      {(params.get("q") || params.get("contentType") || params.get("region") || params.get("expeditionId") || params.get("topicId")) && (
        <button onClick={() => router.push("/repository")} className="rounded-md border px-3 py-2 text-sm hover:bg-secondary">Clear</button>
      )}
    </div>
  );
}

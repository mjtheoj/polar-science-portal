"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { UploadResult } from "@/lib/repository/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
      {pending ? "Uploading…" : label}
    </button>
  );
}

export function UploadForm({
  action,
  expeditions,
  institutions,
  locations,
  topics,
}: {
  action: (prev: UploadResult | null, fd: FormData) => Promise<UploadResult>;
  expeditions: { id: string; code: string; name: string }[];
  institutions: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  topics: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(action, null);
  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Title *</label>
          <input name="title" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. 46th ISEA — Sea-ice core analysis 2024" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Abstract, methods, key findings…" />
        </div>
        <div>
          <label className="text-sm font-medium">Content type *</label>
          <select name="contentType" required defaultValue="expedition_report" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="expedition_report">Expedition report</option>
            <option value="publication">Publication</option>
            <option value="dataset">Dataset (CSV)</option>
            <option value="photograph">Photograph</option>
            <option value="video">Video</option>
            <option value="institutional_activity">Institutional activity</option>
            <option value="educational_resource">Educational resource</option>
            <option value="outreach_article">Outreach article</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">File (PDF/CSV/image/video, ≤50MB)</label>
          <input type="file" name="file" className="mt-1 w-full text-sm" accept=".pdf,.csv,.png,.jpg,.jpeg,.webp,.mp4,.mov,.txt,.docx,.xlsx" />
          <p className="mt-1 text-xs text-muted-foreground">Or leave empty for metadata-only record.</p>
        </div>
        <div>
          <label className="text-sm font-medium">Expedition</label>
          <select name="expeditionId" defaultValue="" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">— none —</option>
            {expeditions.map((e) => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Institution</label>
          <select name="institutionId" defaultValue="" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">— none —</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Location</label>
          <select name="locationId" defaultValue="" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">— none —</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Topics</label>
          <div className="mt-1 flex flex-wrap gap-2 rounded-md border bg-background p-2">
            {topics.length === 0 ? <span className="text-xs text-muted-foreground">Run seed SQL first to get topics</span> : topics.map((t) => (
              <label key={t.id} className="flex items-center gap-1 text-sm"><input type="checkbox" name="topicIds" value={t.id} /> {t.name}</label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Keywords (comma-separated)</label>
          <input name="keywords" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="sea ice, Southern Ocean, paleoclimate" />
        </div>
        <div>
          <label className="text-sm font-medium">Publication date</label>
          <input type="date" name="publicationDate" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Visibility</label>
          <select name="visibility" defaultValue="public" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="restricted">Restricted</option>
            <option value="draft">Draft (only you/admin)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Workflow</label>
          <select name="approvalStatus" defaultValue="draft" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="draft">Draft</option>
            <option value="submitted">Submitted (for review)</option>
            <option value="under_review">Under review</option>
            {/* published blocked for non-admin by server action + DB trigger */}
            <option value="published">Published (admin only)</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Researchers: Draft → Submitted. Admins publish.</p>
        </div>
      </div>

      {state?.error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}

      <Submit label="Create record" />
    </form>
  );
}

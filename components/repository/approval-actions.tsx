"use client";

import { updateApproval } from "@/lib/repository/actions";

export function ApprovalActions({ documentId, current }: { documentId: string; current: string }) {
  const opts: Record<string, { to: string; label: string; cls: string }[]> = {
    draft: [{ to: "submitted", label: "Submit for review", cls: "bg-primary text-primary-foreground" }],
    submitted: [{ to: "under_review", label: "Mark under review (admin)", cls: "bg-sky-600 text-white" }, { to: "rejected", label: "Reject", cls: "border" }],
    under_review: [{ to: "approved", label: "Approve", cls: "bg-emerald-600 text-white" }, { to: "rejected", label: "Reject", cls: "border" }],
    approved: [{ to: "published", label: "Publish", cls: "bg-primary text-primary-foreground" }, { to: "rejected", label: "Reject", cls: "border" }],
    published: [{ to: "archived", label: "Archive", cls: "border" }],
    rejected: [{ to: "draft", label: "Return to draft", cls: "border" }],
    archived: [{ to: "draft", label: "Restore to draft", cls: "border" }],
  };
  const actions = opts[current] ?? [];
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <form key={a.to} action={updateApproval}>
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="toStatus" value={a.to} />
          <button type="submit" className={`rounded-md px-3 py-1.5 text-sm font-medium ${a.cls} hover:opacity-90`}>
            {a.label}
          </button>
        </form>
      ))}
    </div>
  );
}

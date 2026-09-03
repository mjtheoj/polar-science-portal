"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UploadResult = { error?: string; success?: string; id?: string };

export async function uploadDocument(_prev: UploadResult | null, formData: FormData): Promise<UploadResult> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contentType = String(formData.get("contentType") ?? "").trim();
  const expeditionId = String(formData.get("expeditionId") ?? "").trim() || null;
  const institutionId = String(formData.get("institutionId") ?? "").trim() || null;
  const locationId = String(formData.get("locationId") ?? "").trim() || null;
  const keywordsRaw = String(formData.get("keywords") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "public").trim();
  const approvalStatus = String(formData.get("approvalStatus") ?? "draft").trim();
  const publicationDate = String(formData.get("publicationDate") ?? "").trim() || null;
  const file = formData.get("file") as File | null;
  const topicIds = formData.getAll("topicIds").map(String).filter(Boolean);

  if (title.length < 5) return { error: "Title must be at least 5 characters." };
  if (!contentType) return { error: "Content type is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to upload. Sign in as researcher/teacher/admin." };

  // Publishing directly is admin-only (enforced also by DB trigger)
  if (approvalStatus === "published") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = (profile as { role?: string } | null)?.role;
    if (role !== "admin") return { error: "Only admins can publish directly. Use Draft/Submitted instead." };
  }

  let storagePath: string | null = null;
  let fileType: string | null = null;
  let fileSize: number | null = null;

  if (file && file.size > 0) {
    if (file.size > 50 * 1024 * 1024) return { error: "File too large — max 50MB for prototype." };
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const allowed = ["pdf", "csv", "png", "jpg", "jpeg", "webp", "mp4", "mov", "txt", "docx", "xlsx"];
    if (!allowed.includes(ext) && !file.type.startsWith("image/") && !file.type.startsWith("video/") && file.type !== "application/pdf") {
      // still allow but warn — not blocking for prototype
    }
    const docId = crypto.randomUUID();
    storagePath = `${user.id}/${docId}.${ext}`;
    fileType = file.type || `application/${ext}`;
    fileSize = file.size;

    const arrayBuf = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from("repository-files")
      .upload(storagePath, arrayBuf, { contentType: fileType, upsert: false });

    if (uploadErr) return { error: `Storage upload failed: ${uploadErr.message}. Did you run 002b_storage.sql?` };

    // insert document with that storagePath
    const keywords = keywordsRaw ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean) : [];
    const { data: inserted, error: insertErr } = await supabase
      .from("documents")
      .insert({
        id: docId,
        title,
        description: description || null,
        content_type: contentType as never,
        storage_path: storagePath,
        file_type: fileType,
        file_size: fileSize,
        author_id: user.id,
        institution_id: institutionId,
        expedition_id: expeditionId,
        location_id: locationId,
        publication_date: publicationDate,
        keywords,
        visibility: visibility as never,
        approval_status: approvalStatus as never,
        processing_status: "ready",
      } as never)
      .select("id")
      .single();

    if (insertErr) {
      // cleanup uploaded file
      await supabase.storage.from("repository-files").remove([storagePath]);
      return { error: insertErr.message };
    }

    if (topicIds.length) {
      await supabase.from("document_topics").insert(topicIds.map((tid) => ({ document_id: (inserted as { id: string }).id, topic_id: tid })) as never);
    }

    revalidatePath("/repository");
    redirect(`/repository/${(inserted as { id: string }).id}`);
  } else {
    // metadata-only record (no file)
    const keywords = keywordsRaw ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean) : [];
    const { data: inserted, error: insertErr } = await supabase
      .from("documents")
      .insert({
        title,
        description: description || null,
        content_type: contentType as never,
        author_id: user.id,
        institution_id: institutionId,
        expedition_id: expeditionId,
        location_id: locationId,
        publication_date: publicationDate,
        keywords,
        visibility: visibility as never,
        approval_status: approvalStatus as never,
        processing_status: "ready",
      } as never)
      .select("id")
      .single();

    if (insertErr) return { error: insertErr.message };
    if (topicIds.length) {
      await supabase.from("document_topics").insert(topicIds.map((tid) => ({ document_id: (inserted as { id: string }).id, topic_id: tid })) as never);
    }
    revalidatePath("/repository");
    redirect(`/repository/${(inserted as { id: string }).id}`);
  }
}

export async function updateApproval(formData: FormData): Promise<void> {
  const documentId = String(formData.get("documentId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "");
  const comment = String(formData.get("comment") ?? "").trim() || null;
  if (!documentId || !toStatus) throw new Error("Missing fields");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: doc } = await supabase.from("documents").select("approval_status").eq("id", documentId).single();
  if (!doc) throw new Error("Document not found");
  const fromStatus = (doc as { approval_status: string }).approval_status;

  const { error } = await supabase.from("documents").update({ approval_status: toStatus as never } as never).eq("id", documentId);
  if (error) throw new Error(error.message);

  await supabase.from("approvals").insert({ document_id: documentId, reviewer_id: user!.id, from_status: fromStatus as never, to_status: toStatus as never, comment } as never);
  await supabase.from("audit_logs").insert({ action: `approval:${fromStatus}→${toStatus}`, entity_type: "document", entity_id: documentId, actor_id: user!.id, details: { comment } } as never);

  revalidatePath(`/repository/${documentId}`);
  revalidatePath("/repository");
  redirect(`/repository/${documentId}`);
}

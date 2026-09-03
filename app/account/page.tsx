import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = profileRaw as unknown as { full_name?: string; role?: string; institution?: string | null } | null;

  return (
    <div className="container py-10 max-w-xl">
      <h1 className="font-display text-2xl font-semibold">Account</h1>
      <div className="mt-6 rounded-lg border bg-card p-6 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{user.email}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Full name</span><span className="font-medium">{profile?.full_name ?? "—"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{profile?.role ?? "—"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Institution</span><span className="font-medium">{profile?.institution ?? "—"}</span></div>
        <p className="text-xs text-muted-foreground pt-2">Role changes are restricted — contact an admin. This is enforced by RLS + trigger `prevent_role_escalation`.</p>
      </div>
      <form action={signOut} className="mt-6">
        <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Sign out</button>
      </form>
    </div>
  );
}

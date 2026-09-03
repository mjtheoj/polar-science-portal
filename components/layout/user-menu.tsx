import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

function roleBadge(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export async function UserMenu() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2">
          Sign in
        </Link>
        <Link href="/register" className="text-sm font-medium rounded-md bg-primary text-primary-foreground px-3.5 py-2 hover:bg-primary/90">
          Register
        </Link>
      </div>
    );
  }

  const { data: profileRaw } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  const profile = profileRaw as unknown as { full_name?: string; role?: string } | null;

  return (
    <div className="hidden md:flex items-center gap-3 shrink-0">
      <div className="text-right leading-tight">
        <p className="text-sm font-medium text-foreground">{profile?.full_name ?? user.email}</p>
        <p className="text-xs text-muted-foreground">{profile ? roleBadge(profile.role ?? "") : "Signed in"} · {user.email}</p>
      </div>
      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground border">
        {profile ? roleBadge(profile.role ?? "…") : "…"}
      </span>
      <form action={signOut}>
        <button type="submit" className="text-sm font-medium rounded-md border border-border px-3 py-2 hover:bg-secondary">
          Sign out
        </button>
      </form>
    </div>
  );
}

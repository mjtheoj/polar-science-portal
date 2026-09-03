"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { error?: string; success?: string };

const ROLE_OPTIONS = ["public", "student", "teacher", "researcher"] as const;
type AllowedRole = (typeof ROLE_OPTIONS)[number];

function isAllowedRole(v: string): v is AllowedRole {
  return (ROLE_OPTIONS as readonly string[]).includes(v);
}

export async function signUp(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const institution = String(formData.get("institution") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "public").trim().toLowerCase();

  if (fullName.length < 2) return { error: "Full name must be at least 2 characters." };
  if (!email.includes("@")) return { error: "Enter a valid email." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  const role: AllowedRole = isAllowedRole(roleRaw) ? roleRaw : "public";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, institution: institution || undefined },
      // after email confirmation, return to /auth/callback which then redirects home
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // If email confirmations are disabled, user is already signed in.
  // Revalidate and send home; otherwise show message to check email.
  revalidatePath("/", "layout");
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    redirect("/");
  }
  return { success: "Account created. Check your email to confirm, then sign in." };
}

export async function signIn(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

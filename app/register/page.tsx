import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signUp } from "@/lib/auth/actions";
import { RegisterForm } from "@/components/auth/auth-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return (
    <div className="container py-12 max-w-md">
      <h1 className="font-display text-2xl font-semibold text-foreground">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Self-service for Public / Student / Teacher / Researcher. Admin is granted by an existing admin.</p>
      <div className="mt-8">
        <RegisterForm action={signUp} />
      </div>
    </div>
  );
}

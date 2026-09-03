import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/actions";
import { LoginForm } from "@/components/auth/auth-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return (
    <div className="container py-12 max-w-md">
      <h1 className="font-display text-2xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use your NCPOR portal account. Roles: Admin / Researcher / Teacher / Student / Public.</p>
      <div className="mt-8">
        <LoginForm action={signIn} />
      </div>
    </div>
  );
}

import { ComingSoon } from "@/components/layout/coming-soon";

export default function LoginPage() {
  return (
    <ComingSoon
      title="Sign in"
      phase="Arriving in Phase 2"
      description="Authentication with role-based access (Admin, Researcher, Teacher, Student, Public) via Supabase Auth."
    />
  );
}

"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import type { AuthResult } from "@/lib/auth/actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function LoginForm({ action }: { action: (prev: AuthResult | null, fd: FormData) => Promise<AuthResult> }) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          placeholder="you@institution.edu"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>
      )}

      <SubmitButton label="Sign in" pendingLabel="Signing in…" />
      <p className="text-sm text-muted-foreground text-center">
        No account? <Link href="/register" className="font-medium text-primary hover:underline">Register</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ action }: { action: (prev: AuthResult | null, fd: FormData) => Promise<AuthResult> }) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name</label>
        <input id="fullName" name="fullName" type="text" required autoComplete="name" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Asha Verma" />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="you@institution.edu" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
        <input id="password" name="password" type="password" required autoComplete="new-password" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="At least 6 characters" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className="text-sm font-medium text-foreground">Role</label>
          <select id="role" name="role" defaultValue="student" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none">
            <option value="public">Public</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="researcher">Researcher</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Admin is assigned by an admin only.</p>
        </div>
        <div>
          <label htmlFor="institution" className="text-sm font-medium text-foreground">Institution</label>
          <input id="institution" name="institution" type="text" autoComplete="organization" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="NCPOR / Univ." />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>
      )}

      <SubmitButton label="Create account" pendingLabel="Creating…" />
      <p className="text-sm text-muted-foreground text-center">
        Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

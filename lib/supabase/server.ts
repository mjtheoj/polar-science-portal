import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Supabase client for use in Server Components, Server Actions and
 * Route Handlers. Reads/writes the auth session via Next.js cookies.
 *
 * NOTE: `set`/`remove` can throw when called from a Server Component
 * (cookies are read-only there) — Next.js middleware is responsible for
 * refreshing the session in that case. This is expected and safe to ignore
 * once middleware-based session refresh is added in Phase 2.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore, see note above.
          }
        },
      },
    },
  );
}

/**
 * Admin client using the service-role key. SERVER-SIDE ONLY.
 * Never import this from a Client Component or expose the key to the browser.
 * Used for privileged operations (e.g. approval workflow, admin analytics)
 * that must bypass Row Level Security.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (server-side only) before using createAdminClient().",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } },
  );
}

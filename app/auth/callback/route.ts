import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
          ) {
            cookiesToSet.forEach(
              ({ name, value }: { name: string; value: string }) => request.cookies.set(name, value),
            );
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // Need to re-apply cookies to response (edge workaround)
      const supabase2 = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(
              cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
            ) {
              cookiesToSet.forEach(
                ({
                  name,
                  value,
                  options,
                }: {
                  name: string;
                  value: string;
                  options?: Record<string, unknown>;
                }) => response.cookies.set(name, value, options as never),
              );
            },
          },
        },
      );
      await supabase2.auth.getUser();
      return response;
    }
  }
  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}

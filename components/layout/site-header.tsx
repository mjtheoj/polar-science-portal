import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex flex-col leading-tight shrink-0">
          <span className="font-display text-lg font-semibold text-foreground">
            Polar Science Portal
          </span>
          <span className="text-xs text-muted-foreground">
            National Centre for Polar and Ocean Research
          </span>
        </Link>

        <SiteNav />

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium rounded-md bg-primary text-primary-foreground px-3.5 py-2 hover:bg-primary/90"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}

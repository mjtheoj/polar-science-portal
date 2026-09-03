import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { UserMenu } from "@/components/layout/user-menu";

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
        <UserMenu />
      </div>
    </header>
  );
}

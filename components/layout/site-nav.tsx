"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/repository", label: "Repository" },
  { href: "/search", label: "Search" },
  { href: "/assistant", label: "Knowledge Assistant" },
  { href: "/education", label: "Education Hub" },
  { href: "/map", label: "Polar Map" },
  { href: "/media", label: "Media Gallery" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              active
                ? "text-primary"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

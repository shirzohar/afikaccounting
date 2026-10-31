"use client";

import { BadgeCheck, FileCheck2, FileStack, Gauge, Layers, type LucideIcon, Newspaper, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "דאשבורד ואנליטיקה", icon: Gauge },
  { href: "/admin/media", label: "קבצים ומדיה", icon: FileStack },
  { href: "/admin/content", label: "ניהול תוכן", icon: Newspaper },
  { href: "/admin/exams", label: "מבחנים", icon: FileCheck2 },
  { href: "/admin/presets", label: "תרחישים מוכנים", icon: Layers },
  { href: "/admin/subscriptions", label: "מנויים", icon: BadgeCheck },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
];

const active = (pathname: string, href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

/** Sidebar on wide screens; a scrollable row of tabs on narrow ones. */
export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

/** The same links before the pathname is known (the Suspense fallback): nothing marked active. */
export function AdminNavLinks({ pathname = "" }: { pathname?: string }) {
  return (
    <nav aria-label="ניווט ניהול" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const on = active(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              on ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

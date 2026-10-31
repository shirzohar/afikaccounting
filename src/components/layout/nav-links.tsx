"use client";

import { ArrowLeft, ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TierBadge } from "@/components/pricing/tier-badge";
import { type NavEntry, type NavGroup, site } from "@/lib/site";
import { cn } from "@/lib/utils";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
/** A link to a spot inside a page (#tab) or a preset (?calc) is never "the page you're on". */
const plain = (href: string) => !/[?#]/.test(href);
// Pages inside a category can nest (/basics and /basics/inventory), so each one is active only on its own path.
const isItemActive = (pathname: string, href: string) => plain(href) && pathname === href;
const groupActive = (pathname: string, group: NavGroup) => isActive(pathname, group.hub.href) || group.items.some((i) => plain(i.href) && isActive(pathname, i.href));

/** The group's links, gathered under their section headings. */
const sectionsOf = (group: NavGroup) => {
  const out: { title: string; items: NavEntry[] }[] = [];
  for (const i of group.items) {
    const last = out.at(-1);
    if (last?.title === i.section) last.items.push(i);
    else out.push({ title: i.section, items: [i] });
  }
  return out;
};

/**
 * The hook-reading wrappers sit inside Suspense in the navbar, because a
 * dynamic route's URL is only known at request time; the views also render
 * as the fallback (pathname "": no active item).
 */
export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

export function NavLinksView({ pathname = "" }: { pathname?: string }) {
  return (
    <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 md:flex">
      {site.nav.map((item) => {
        if ("items" in item) return <NavDropdown key={item.label} group={item} pathname={pathname} />;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              item.tier === "exams" ? "font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200" : active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {active && <ActivePill />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActivePill() {
  return <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-lg bg-surface-2" transition={{ type: "spring", stiffness: 420, damping: 34 }} />;
}

/** A top-level category: its pages open in a wide panel under the header, sections side by side. */
function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);
  const active = groupActive(pathname, group);
  // Close the panel after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const sections = sectionsOf(group);
  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn("relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors", active || open ? "text-fg" : "text-muted hover:text-fg")}
      >
        {active && <ActivePill />}
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-x-0 top-[4.25rem] z-50 mx-auto w-[min(46rem,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-surface p-2 shadow-xl"
          >
            <div className={cn("max-h-[calc(100vh-9rem)] overflow-y-auto", sections.length > 1 && "columns-2 gap-2")}>
              {sections.map((s) => (
                <div key={s.title} className="mb-1 break-inside-avoid rounded-xl p-1">
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold text-accent">{s.title}</p>
                  {s.items.map((i) => {
                    const on = isItemActive(pathname, i.href);
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        aria-current={on ? "page" : undefined}
                        className={cn("block rounded-xl px-3 py-2 transition-colors hover:bg-surface-2", on && "bg-surface-2")}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                          {i.label}
                          {i.tier && <TierBadge tier={i.tier} label={i.tier === "free" ? "חינם" : undefined} />}
                        </span>
                        {i.description && <span className="block text-xs text-muted">{i.description}</span>}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            <Link
              href={group.hub.href}
              className="mt-1 flex items-center justify-between gap-2 rounded-xl border-t border-line bg-surface-2/60 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-surface-2"
            >
              {group.hub.label}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileNav() {
  return <MobileNavView pathname={usePathname()} />;
}

export function MobileNavView({ pathname = "" }: { pathname?: string }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  // Close the menu after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const link = ({ href, label, tier }: { href: string; label: string; tier?: NavEntry["tier"] }, nested = false) => {
    const on = nested ? isItemActive(pathname, href) : isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-medium",
          nested && "ms-3 border-s-2 border-line-strong ps-4",
          !nested && tier === "exams" ? "font-semibold text-amber-600 dark:text-amber-300" : on ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
        )}
      >
        {label}
        {nested && tier && <TierBadge tier={tier} label={tier === "free" ? "חינם" : undefined} />}
      </Link>
    );
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "סגירת התפריט" : "פתיחת התפריט"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="ניווט ראשי"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-3 top-[4.25rem] z-50 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border border-line-strong bg-surface p-2 shadow-xl"
          >
            {site.nav.map((item) =>
              "items" in item ? (
                // Each category folds, so the menu stays short; the one you're in starts open.
                <details key={item.label} open={groupActive(pathname, item)} className="group py-0.5">
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden",
                      groupActive(pathname, item) ? "text-fg" : "text-muted",
                    )}
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  {sectionsOf(item).map((s) => (
                    <div key={s.title}>
                      <p className="px-4 pt-1.5 pb-1 text-xs font-semibold text-accent">{s.title}</p>
                      {s.items.map((i) => link(i, true))}
                    </div>
                  ))}
                  <Link href={item.hub.href} className="mt-1 flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-accent">
                    {item.hub.label} <ArrowLeft className="h-4 w-4" aria-hidden />
                  </Link>
                </details>
              ) : (
                link(item)
              ),
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { ArrowLeft, ChevronDown, LayoutDashboard, LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { FIRST_LESSON } from "@/lib/catalog";

/** A guest's way in: straight into lesson 1, no account needed. */
export function GuestActions() {
  return (
    <div className="flex items-center gap-1.5">
      <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
        התחברות
      </ButtonLink>
      <ButtonLink href={FIRST_LESSON} size="sm" className="max-sm:px-2.5">
        התחילו בחינם <ArrowLeft className="h-3.5 w-3.5 max-sm:hidden" aria-hidden />
      </ButtonLink>
    </div>
  );
}

/** For an account on the free plan: the way to the plans. */
export function UpgradeButton() {
  return (
    <ButtonLink href="/pricing" size="sm" className="max-sm:hidden">
      <Sparkles className="h-3.5 w-3.5" aria-hidden /> שדרוג
    </ButtonLink>
  );
}

export function UserMenu({ name, email, admin = false }: { name: string; email: string; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="תפריט משתמש"
        className="flex items-center gap-2 rounded-full border border-line py-1 pe-2.5 ps-1 transition-colors hover:border-line-strong"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-accent to-cyan-400 text-[11px] font-semibold text-accent-fg">
          {initials || "U"}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute end-0 z-50 mt-2 w-60 origin-top-left rounded-2xl border border-line-strong bg-surface p-1.5 shadow-xl"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-fg">{name}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <MenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setOpen(false)}>
              לוח אישי
            </MenuLink>
            <MenuLink href="/profile" icon={<UserRound className="h-4 w-4" />} onClick={() => setOpen(false)}>
              פרופיל
            </MenuLink>
            {admin && (
              <MenuLink href="/admin" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => setOpen(false)}>
                מערכת ניהול
              </MenuLink>
            )}
            <div className="my-1 h-px bg-line" />
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-danger"
              >
                <LogOut className="h-4 w-4" /> התנתקות
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg"
    >
      {icon}
      {children}
    </Link>
  );
}

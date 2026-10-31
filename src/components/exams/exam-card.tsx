"use client";

import { ArrowLeft, FileCheck2, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/admin/modal";
import { Paywall } from "@/components/pricing/paywall";
import { TierBadge } from "@/components/pricing/tier-badge";
import { type ExamMeta, examWhen } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

export const EXAMS_LEAD = "פתרונות מלאים מאפס לתרגילים ברמת מבחן, שלב אחר שלב — עם פקודות היומן, הטבלאות וההסבר לכל מספר.";

/**
 * An exam in a list. Open (a sample, or the reader has the plan): a link to
 * it. Locked: the same card with a lock and the exams tag, opening the
 * paywall. `blur` hides a locked card's details behind a blur (the home page's teaser).
 */
export function ExamCard({ exam: e, topic, open, blur = false, sample }: { exam: ExamMeta; topic: string; open: boolean; blur?: boolean; sample?: { href: string } }) {
  const [paywall, setPaywall] = useState(false);
  const body = (
    <>
      <span className="flex flex-wrap items-center gap-1.5">
        {e.isSample ? <TierBadge tier="free" label="לדוגמה — חינם" /> : <TierBadge tier="exams" />}
        <span className="num text-xs text-muted">
          {topic} · {examWhen(e)}
        </span>
        {!open && <Lock className="ms-auto h-4 w-4 text-muted" aria-label="נעול" />}
      </span>
      <span className={cn("mt-2.5 flex items-start gap-2.5", blur && !open && "blur-[3px] select-none")}>
        <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
        <span className="min-w-0">
          <span className="block font-semibold text-fg group-hover:text-accent">{e.title}</span>
          <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-muted">{e.description}</span>
        </span>
      </span>
      {e.subjects.length > 0 && (
        <span className="mt-3 flex flex-wrap gap-1.5">
          {e.subjects.map((s) => (
            <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
              {s}
            </span>
          ))}
        </span>
      )}
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold text-accent">
        {open ? "לשאלה ולפתרון" : "לפתוח במסלול מבחנים"} <ArrowLeft className="ms-auto h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
      </span>
    </>
  );
  const card = "group card flex h-full w-full flex-col p-4 text-start transition-colors hover:border-accent/50 sm:p-5";
  if (open)
    return (
      <Link href={`/exams/${e.id}`} className={card}>
        {body}
      </Link>
    );
  return (
    <>
      <button type="button" onClick={() => setPaywall(true)} className={card} aria-haspopup="dialog">
        {body}
      </button>
      <Modal open={paywall} title="מתחם מבחנים" onClose={() => setPaywall(false)} wide>
        <Paywall tier="exams" title={e.title} course={topic} where={`/exams/${e.id}`} lead={EXAMS_LEAD} taste={sample && { href: sample.href, label: "למבחן לדוגמה — בחינם" }} />
      </Modal>
    </>
  );
}

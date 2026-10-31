"use client";

import { Flame, Star, Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toggleSound, useSound } from "./progress-store";

/** The lesson's running score beside its title: the streak, the XP, and the sound switch. */
export function LessonStats({ streak, xp }: { streak: number; xp: number }) {
  const sound = useSound();
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Stat icon={<Flame className={cn("h-4 w-4", streak > 0 ? "text-[#f97316]" : "text-subtle")} aria-hidden />} value={streak} label="תשובות נכונות ברצף" />
      <Stat icon={<Star className="h-4 w-4 fill-[#eda100] text-[#eda100]" aria-hidden />} value={xp} label="נקודות XP" />
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        aria-label={sound ? "השתקת צלילים" : "הפעלת צלילים"}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
      >
        {sound ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2 py-1" title={label}>
      {icon}
      {/* Keyed by value, so every change pops. */}
      <motion.span key={value} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="num text-[13px] font-bold text-fg">
        {value}
      </motion.span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

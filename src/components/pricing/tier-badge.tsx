import { Crown, Lock, Sparkles } from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/primitives";
import { planOf, type Tier } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const TONES = {
  free: { tone: "success", icon: Sparkles, className: "" },
  courses: { tone: "accent", icon: Lock, className: "" },
  exams: { tone: "neutral", icon: Crown, className: "border-transparent bg-amber-400/15 text-amber-700 dark:text-amber-300" },
} as const;

/**
 * A plan's tag, the same everywhere: free is green, courses accent, exams gold.
 * `label` replaces the plan's name ("שיעור ראשון חינם").
 */
export function TierBadge({ tier, label, icon = true, className, ...props }: ComponentProps<"span"> & { tier: Tier; label?: string; icon?: boolean }) {
  const t = TONES[tier];
  return (
    <Badge tone={t.tone} className={cn("shrink-0 font-semibold whitespace-nowrap", t.className, className)} {...props}>
      {icon && <t.icon className="h-3 w-3" aria-hidden />}
      {label ?? planOf(tier).name}
    </Badge>
  );
}

"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import type { Tier } from "@/lib/pricing";

/** A plan's "choose" link, recording the click (plan_click) on the way. */
export function PlanCta({ tier, from, variant, className, ...props }: ComponentProps<typeof Link> & { tier: Tier; from: string; variant?: "primary" | "secondary" }) {
  return (
    <Link
      {...props}
      className={buttonClass({ variant, size: "lg" }, className)}
      onClick={(e) => {
        track({ kind: "plan_click", target: tier, meta: { from } });
        props.onClick?.(e);
      }}
    />
  );
}

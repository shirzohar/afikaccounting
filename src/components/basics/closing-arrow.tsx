"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

/**
 * The formula's answer and the card it goes into: a dashed arrow from the
 * element marked `data-link-from="closing"` (the answer, under the cards) up
 * to the one marked `data-link-to="closing"` (the allowance's closing balance,
 * under the card's line) — drawn like the course's other arrows.
 */
export function ClosingArrow({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [d, setD] = useState<string>();

  useLayoutEffect(() => {
    const box = wrap.current;
    if (!box) return;
    const draw = () => {
      const from = box.querySelector<HTMLElement>('[data-link-from="closing"]');
      const to = box.querySelector<HTMLElement>('[data-link-to="closing"]');
      if (!from || !to) return setD(undefined);
      const at = box.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const sx = a.left - at.left + a.width / 2;
      const sy = a.top - at.top - 2;
      const ex = b.left - at.left + b.width / 2;
      const ey = b.bottom - at.top + 3;
      const bend = Math.max(14, (sy - ey) / 2);
      setD(`M ${sx} ${sy} C ${sx} ${sy - bend}, ${ex} ${ey + bend}, ${ex} ${ey}`);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} className="relative">
      {children}
      {d && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <marker id="closing-arrow-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-accent" />
            </marker>
          </defs>
          <path d={d} fill="none" strokeWidth={2.25} strokeLinecap="round" strokeDasharray="6 5" markerEnd="url(#closing-arrow-head)" className="stroke-accent" />
        </svg>
      )}
    </div>
  );
}

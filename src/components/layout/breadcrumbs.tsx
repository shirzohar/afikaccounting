import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { LEARN_HUB } from "@/lib/catalog";

type Crumb = { label: string; href?: string };

/**
 * Where a page sits, the same on every page: from its section down, the last
 * crumb being the page itself. Learning pages start from the courses map;
 * any other section passes its own `root` (the exams area, the content hub).
 */
export function Breadcrumbs({ trail, root = { label: "קורסים", href: LEARN_HUB.href } }: { trail: Crumb[]; root?: Crumb }) {
  const all = [root, ...trail];
  return (
    <nav aria-label="מיקום באתר" className="flex flex-wrap items-center gap-1 text-xs font-semibold text-accent">
      {all.map((c, i) => (
        <Fragment key={c.label}>
          {i > 0 && <ChevronLeft className="h-3.5 w-3.5 text-subtle" aria-hidden />}
          {i === all.length - 1 ? (
            <span aria-current="page">{c.label}</span>
          ) : c.href ? (
            <Link href={c.href} className="hover:underline">
              {c.label}
            </Link>
          ) : (
            <span>{c.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

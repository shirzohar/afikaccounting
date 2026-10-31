import { Lock } from "lucide-react";
import { type ReactNode, Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { canAccessWith } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { TOPICS } from "@/lib/catalog";
import { Paywall } from "./paywall";

export type LockedChapter = { id: string; title: string; lead?: string; /** Anchors inside the chapter, so their links still land here. */ anchors?: string[] };

/**
 * The part of a long page after its free chapter. The session is read on the
 * server, behind a boundary whose fallback holds no content: a reader with
 * the plan gets `children`, any other reader the paywall and the chapters'
 * names in their places — the chapters themselves never leave the server.
 */
export function GatedChapters({ topic, chapters, taste, children }: { topic: string; chapters: LockedChapter[]; taste: { href: string; label: string }; children: ReactNode }) {
  return (
    <Suspense fallback={<ChaptersSkeleton />}>
      <Gate topic={topic} chapters={chapters} taste={taste}>
        {children}
      </Gate>
    </Suspense>
  );
}

async function Gate({ topic: id, chapters, taste, children }: { topic: string; chapters: LockedChapter[]; taste: { href: string; label: string }; children: ReactNode }) {
  const topic = TOPICS.find((t) => t.id === id)!;
  if (canAccessWith(await getAccess(), topic)) return children;
  return (
    <div className="mt-10 space-y-6">
      <Paywall title={`${chapters.length} הפרקים הבאים`} course={topic.standard ? `${topic.title} (${topic.standard})` : topic.title} taste={taste} where={topic.href} />
      <ol className="space-y-2" aria-label="הפרקים בקורס המלא">
        {chapters.map((c) => (
          <li key={c.id}>
            <section id={c.id} data-chapter={c.id} aria-labelledby={`${c.id}-h`} className="flex scroll-mt-32 items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 lg:scroll-mt-24">
              {c.anchors?.map((a) => <span key={a} id={a} className="block scroll-mt-32" aria-hidden />)}
              <Lock className="mt-1 h-4 w-4 shrink-0 text-muted" aria-label="נעול" />
              <div className="min-w-0">
                <h3 id={`${c.id}-h`} className="font-semibold text-fg">
                  {c.title}
                </h3>
                {c.lead && <p className="mt-0.5 text-sm text-muted">{c.lead}</p>}
              </div>
            </section>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ChaptersSkeleton() {
  return (
    <div className="mt-10 space-y-4" aria-busy="true" aria-label="טוען פרקים">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

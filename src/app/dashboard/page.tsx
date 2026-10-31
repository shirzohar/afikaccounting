import {
  Activity,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NextLesson } from "@/components/dashboard/next-lesson";
import { SavedSolutions } from "@/components/dashboard/saved-solutions";
import { TrackEvent } from "@/components/layout/track-event";
import { CalculatorIcon } from "@/components/engine/calculator-visuals";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import { lockedOf } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { topicByHref } from "@/lib/catalog";
import { outlineOf } from "@/lib/study/paths";
import { listActivity, listSavedSolutions, listWatchHistory, type WatchEntry } from "@/lib/data/user";
import { duration } from "@/lib/engine/format";
import { CALCULATORS } from "@/lib/engine/registry";
import { BASICS_LESSONS } from "@/lib/study/basics";
import { INVENTORY_LESSONS } from "@/lib/study/inventory";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "לוח אישי" };

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Container className="pt-10 sm:pt-14">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

/** The courses the dashboard walks through, in order: the free one, then inventory. */
const COURSES = [BASICS_LESSONS, INVENTORY_LESSONS].map((lessons) => {
  const topic = topicByHref(lessons[0].backHref)!;
  return { topic, title: topic.title, href: topic.href, lessons };
});

async function Dashboard({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  const user = await requireUser("/dashboard");
  const [profile, solutions, history, activity, access, sp] = await Promise.all([
    getProfile(),
    listSavedSolutions(),
    listWatchHistory(),
    listActivity(),
    getAccess(),
    searchParams,
  ]);
  const locked = COURSES.flatMap((c) => lockedOf(access, c.topic, c.lessons.map((m) => m.slug)));
  const name = profile?.fullName?.split(" ")[0] || user.email.split("@")[0];
  const completed = history.filter((h) => h.completed).length;
  const inProgress = history.filter((h) => !h.completed);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-accent">לוח אישי</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">שלום, {name}</h1>
          <p className="mt-1 text-sm text-muted">השיעור הבא שלכם, התרחישים השמורים והפעילות האחרונה.</p>
        </div>
        <ButtonLink href="/engine" variant="secondary">
          <Plus className="h-4 w-4" /> חישוב חדש
        </ButtonLink>
      </div>
      {/* Signed straight in after sign-up (/register redirects here with ?welcome=1). */}
      {sp.welcome === "1" && <TrackEvent event={{ kind: "signup" }} once="signup" />}

      <div className="mt-8">
        {/* The path needs only each lesson's outline; the lessons' content stays on the server. */}
        <NextLesson courses={COURSES.map(({ title, href, lessons }) => ({ title, href, lessons: lessons.map(outlineOf) }))} locked={locked} upgrade={access.tier === "free"} />
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat icon={<BookmarkCheck className="h-5 w-5" />} label="פתרונות שמורים" value={solutions.length} />
        <Stat icon={<PlayCircle className="h-5 w-5" />} label="שיעורים בתהליך" value={inProgress.length} />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="שיעורים שהושלמו" value={completed} />
      </dl>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-fg">תרחישים שמורים</h2>
            {solutions.length ? (
              <SavedSolutions solutions={solutions} />
            ) : (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="עדיין אין פתרונות שמורים"
                description="הריצו חישוב במנוע ושמרו אותו כדי שיופיע כאן."
                action={
                  <ButtonLink href="/engine" size="sm">
                    הפעלת המנוע
                  </ButtonLink>
                }
              />
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-fg">היסטוריית צפייה</h2>
            {history.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {history.map((h) => (
                  <WatchCard key={h.contentId} entry={h} />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<PlayCircle className="h-5 w-5" />}
                title="עדיין לא נצפו שיעורים"
                description="שיעורים שתתחילו יופיעו כאן כדי שתוכלו להמשיך מאותה נקודה."
                action={
                  <ButtonLink href="/content" variant="secondary" size="sm">
                    לעיון בתכנים
                  </ButtonLink>
                }
              />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Activity className="h-4 w-4 text-accent" /> פעילות אחרונה
            </h2>
            {activity.length ? (
              <ol className="relative mt-4 space-y-4 border-s border-line ps-5">
                {activity.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute top-1.5 -start-[23px] h-2 w-2 rounded-full bg-accent ring-4 ring-surface" />
                    {a.href ? (
                      <Link href={a.href} className="text-[13px] text-fg hover:text-accent">
                        {a.label}
                      </Link>
                    ) : (
                      <p className="text-[13px] text-fg">{a.label}</p>
                    )}
                    <p className="text-xs text-subtle">{relativeTime(a.createdAt)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted">הפעילות שלכם תופיע כאן.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold text-fg">התחלה מהירה</h2>
            <ul className="mt-3 space-y-1">
              {CALCULATORS.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/engine?calc=${c.slug}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                  >
                    <CalculatorIcon calc={c} className="h-8 w-8 rounded-lg [&_svg]:h-4 [&_svg]:w-4" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-fg">{c.standard}</span>
                      <span className="block truncate text-xs text-muted">{c.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <div>
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="num text-2xl font-semibold tracking-tight text-fg">{value}</dd>
      </div>
    </div>
  );
}

function WatchCard({ entry: h }: { entry: WatchEntry }) {
  const pct = h.completed ? 100 : h.durationSeconds ? Math.round((h.progressSeconds / h.durationSeconds) * 100) : 0;
  const video = h.kind === "video";
  return (
    <li>
      <Link href={`/content/${h.slug}`} className="card group block p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted group-hover:text-accent">
            {video ? <PlayCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm leading-snug font-medium text-fg">{h.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
              {h.standard} · <Clock className="h-3 w-3" /> {relativeTime(h.lastViewedAt)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className={h.completed ? "h-full rounded-full bg-success" : "h-full rounded-full bg-gradient-to-l from-accent to-cyan-400"}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="num text-[11px] text-muted">
            {h.completed ? "הושלם" : video ? `${duration(h.progressSeconds)} / ${duration(h.durationSeconds)}` : "התחלת"}
          </span>
        </div>
      </Link>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-10 w-72" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

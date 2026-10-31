import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { orphanScreens, screensFor } from "@/components/basics/screens";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TrackEvent } from "@/components/layout/track-event";
import { Paywall } from "@/components/pricing/paywall";
import { CourseDone } from "@/components/study-mode/course-done";
import { StudyShell } from "@/components/study-mode/shell";
import { Container, Skeleton } from "@/components/ui/primitives";
import { canAccessWith } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { TOPICS, topicByHref } from "@/lib/catalog";
import { STUDY_MODULES, studyHref } from "@/lib/study";
import { outlineOf } from "@/lib/study/paths";

const ORPHANS = orphanScreens(Object.values(STUDY_MODULES));
if (ORPHANS.length) throw new Error(`Screens no lesson shows: ${ORPHANS.join(", ")}`);

export function generateStaticParams() {
  return Object.keys(STUDY_MODULES).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps<"/study/[topic]">): Promise<Metadata> {
  const m = STUDY_MODULES[(await params).topic];
  if (!m) return { title: "לא נמצא" };
  return { title: `${m.course} · שיעור ${m.n}: ${m.title}`, description: m.description };
}

/**
 * Where to go after a lesson: the next lesson of its course, else the topic
 * after the course on the learning path — straight into its free first lesson
 * when it has one (the end of the free course leads into inventory's).
 */
function nextOf(slug: string) {
  const m = STUDY_MODULES[slug];
  const course = Object.values(STUDY_MODULES).filter((x) => x.backHref === m.backHref);
  const after = course.find((x) => x.n === m.n + 1);
  if (after) return { href: studyHref(after.slug), label: `לשיעור ${after.n}: ${after.title}` };
  const t = TOPICS[TOPICS.findIndex((x) => x.href === m.backHref) + 1];
  if (!t) return undefined;
  const taste = t.preview.find((p) => p in STUDY_MODULES);
  if (taste) return { href: studyHref(taste), label: `הצעד הבא — ${t.title}, והשיעור הראשון עלינו` };
  return { href: t.lesson ?? t.href, label: `לנושא הבא: ${t.title}` };
}

/** One interactive lesson, full screen. The lesson is read from the URL, so it streams in behind a boundary and the route's shell stays shared. */
export default function StudyPage({ params }: PageProps<"/study/[topic]">) {
  return (
    <Suspense fallback={<LessonSkeleton />}>
      <Lesson params={params} />
    </Suspense>
  );
}

/**
 * A lesson the reader's plan doesn't open is never rendered: its screens stay
 * on the server, and the paywall takes its place. A free lesson, or a free
 * taste of a paid course, opens without reading the session, so it stays prerendered.
 */
async function Lesson({ params }: Pick<PageProps<"/study/[topic]">, "params">) {
  const m = STUDY_MODULES[(await params).topic];
  if (!m) notFound();
  const topic = topicByHref(m.backHref)!;
  const free = topic.tier === "free" || topic.preview.includes(m.slug);
  if (!free && !canAccessWith(await getAccess(), topic, m.slug)) return <LockedLesson slug={m.slug} />;
  const last = Math.max(...Object.values(STUDY_MODULES).filter((x) => x.backHref === m.backHref).map((x) => x.n));
  return (
    <>
      <TrackEvent event={{ kind: "lesson_start", target: m.slug, meta: { course: topic.id, n: m.n } }} />
      {topic.tier === "free" && m.n === last && <CourseDone module={m} course={topic.id} />}
      <StudyShell module={m} screens={screensFor(m)} next={nextOf(m.slug)} course={courseOf(m.slug)} />
    </>
  );
}

/**
 * The course beside a lesson: its page, and its lessons in order — this one
 * whole, the others as outlines (titles and counts, never their questions).
 */
function courseOf(slug: string) {
  const m = STUDY_MODULES[slug];
  const topic = topicByHref(m.backHref)!;
  const lessons = Object.values(STUDY_MODULES)
    .filter((x) => x.backHref === m.backHref)
    .sort((a, b) => a.n - b.n)
    .map((x) => (x.slug === slug ? x : outlineOf(x)));
  return { title: topic.standard ? `${topic.title} (${topic.standard})` : topic.title, href: topic.href, lessons };
}

/** A locked lesson's place: its name and where it sits in the course, and the paywall. */
function LockedLesson({ slug }: { slug: string }) {
  const m = STUDY_MODULES[slug];
  const topic = topicByHref(m.backHref)!;
  const taste = topic.preview.find((p) => p in STUDY_MODULES);
  return (
    <Container className="pt-10 pb-16 sm:pt-14">
      <Breadcrumbs trail={[{ label: topic.standard ? `${topic.title} (${topic.standard})` : topic.title, href: topic.href }, { label: `שיעור ${m.n}` }]} />
      <p className="mt-2 text-sm text-muted">
        {m.course} · שיעור <span className="num">{m.n}</span>: {m.description}
      </p>
      <div className="mt-6 max-w-4xl">
        <Paywall
          title={`שיעור ${m.n}: ${m.title}`}
          course={m.course}
          where={studyHref(m.slug)}
          heading="h1"
          taste={taste ? { href: studyHref(taste), label: `לשיעור ${STUDY_MODULES[taste].n} — בחינם` } : undefined}
        />
      </div>
    </Container>
  );
}

/** The lesson page's frame — the course beside it, the screen — until the lesson arrives. */
function LessonSkeleton() {
  return (
    <div className="w-full px-4 pt-5 sm:px-6 lg:ps-4 lg:pe-8 lg:pt-6 2xl:pe-12" aria-busy="true" aria-label="טוען שיעור">
      <div className="grid gap-6 lg:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-10">
        <Skeleton className="hidden h-[32rem] rounded-2xl lg:block" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

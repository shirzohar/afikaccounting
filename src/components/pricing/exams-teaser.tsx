import { ArrowLeft, Crown, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EXAMS_LEAD } from "@/components/exams/exam-card";
import { ExamGrid } from "@/components/exams/exam-grid";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { resolveAccess } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { EXAMS_HUB } from "@/lib/catalog";
import { listExams } from "@/lib/data/exams";
import { tierAllows } from "@/lib/pricing";

export { EXAMS_LEAD };

/** How many of a topic's exams a course page shows. */
const ON_COURSE_PAGE = 4;

/**
 * A course page's exams section, under its reference section and in the same
 * form: a heading with its icon, a lead, then the topic's exams as cards
 * (open or locked for this reader) and the way to all of them. The cards read
 * the session, so they stream in behind a boundary; nothing above them moves.
 */
export function ExamsSection({ topic }: { topic: string }) {
  return (
    <section id="exams" aria-labelledby="exams-title" className="mt-14 scroll-mt-24">
      <h2 id="exams-title" className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
        <Crown className="h-6 w-6 text-amber-500" aria-hidden /> {EXAMS_HUB.label}
      </h2>
      <p className="mt-1 text-[15px] text-muted">{EXAMS_LEAD}</p>
      <div className="mt-4">
        <Suspense fallback={<CardsSkeleton n={3} />}>
          <TopicExams topic={topic} />
        </Suspense>
      </div>
    </section>
  );
}

async function TopicExams({ topic }: { topic: string }) {
  const [exams, access] = await Promise.all([listExams({ topic }), getAccess()]);
  if (!exams.length)
    return (
      <div className="card flex flex-wrap items-center gap-3 p-5">
        <FileCheck2 className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-muted">המבחנים בנושא הזה יעלו בקרוב. בינתיים — מבחנים בנושאים אחרים כבר מחכים.</p>
        <Link href={EXAMS_HUB.href} className="text-sm font-semibold text-accent hover:underline">
          לכל המבחנים
        </Link>
      </div>
    );
  return (
    <>
      <ExamGrid exams={exams.slice(0, ON_COURSE_PAGE)} access={access} className="lg:grid-cols-2 xl:grid-cols-2" />
      <Link href={`${EXAMS_HUB.href}?topic=${topic}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
        <span className="num">לכל {exams.length} המבחנים בנושא</span> <ArrowLeft className="h-4 w-4" aria-hidden />
      </Link>
    </>
  );
}

/**
 * The home page's exams block: a few real exams — blurred for a reader
 * without the plan, the sample open to all — and the way to the sample.
 * Before the session is read it shows the guest's view (the usual visitor).
 */
export function HomeExams() {
  return (
    <Suspense fallback={<HomeExamsView access={resolveAccess({ configured: true })} />}>
      <HomeExamsWithAccess />
    </Suspense>
  );
}

async function HomeExamsWithAccess() {
  return <HomeExamsView access={await getAccess()} />;
}

async function HomeExamsView({ access }: { access: Awaited<ReturnType<typeof getAccess>> }) {
  const exams = (await listExams()).slice(0, 3);
  const sample = exams.find((e) => e.isSample);
  if (!exams.length) return null;
  return (
    <>
      <ExamGrid exams={exams} access={access} blur={!tierAllows(access.tier, "exams")} className="mt-8" />
      <div className="mt-5 flex flex-wrap gap-3">
        {sample && (
          <ButtonLink href={`/exams/${sample.id}`} size="lg">
            לפתרון של מבחן לדוגמה — בחינם <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        )}
        <ButtonLink href={EXAMS_HUB.href} variant="secondary" size="lg">
          לכל המבחנים
        </ButtonLink>
      </div>
    </>
  );
}

function CardsSkeleton({ n }: { n: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}

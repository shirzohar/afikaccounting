import { ArrowLeft, Crown, FileSearch } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EXAMS_LEAD } from "@/components/exams/exam-card";
import { ExamFilters } from "@/components/exams/exam-filters";
import { ExamGrid, topicLabel } from "@/components/exams/exam-grid";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import { tierAllows } from "@/lib/pricing";
import { getAccess } from "@/lib/auth/access";
import { EXAMS_HUB } from "@/lib/catalog";
import { examFacets, listExams } from "@/lib/data/exams";

export const metadata: Metadata = {
  title: EXAMS_HUB.label,
  description: "תרגילים ברמת מבחן עם פתרון מלא מאפס, שלב אחר שלב — מלאי, רכוש קבוע ודוחות כספיים. מבחן לדוגמה פתוח לכולם.",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Every exam, filtered by course, subject and year; a locked one opens the paywall, a sample opens for everyone. */
export default function ExamsPage({ searchParams }: PageProps<"/exams">) {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <div className="flex flex-wrap items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" aria-hidden />
          <TierBadge tier="exams" />
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          {EXAMS_HUB.label} — <span className="text-gradient">מתרגלים כמו במבחן</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          {EXAMS_LEAD} פותרים לבד, ופותחים את הפתרון שלב אחר שלב — רק כשצריך.
        </p>

        <div className="mt-8">
          <Suspense fallback={<Skeleton className="h-8 w-full max-w-xl" />}>
            <Filters />
          </Suspense>
        </div>
        <Suspense fallback={<GridSkeleton />}>
          <Exams searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

async function Filters() {
  const f = await examFacets();
  return <ExamFilters topics={f.topics.map((t) => ({ value: t, label: topicLabel(t) }))} subjects={f.subjects} years={f.years} />;
}

async function Exams({ searchParams }: Pick<PageProps<"/exams">, "searchParams">) {
  const sp = await searchParams;
  const filters = { topic: one(sp.topic), subject: one(sp.subject), year: one(sp.year) };
  const [exams, access, all] = await Promise.all([listExams(filters), getAccess(), listExams()]);
  const sample = all.find((e) => e.isSample);
  const member = tierAllows(access.tier, "exams");
  return (
    <>
      {!member && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-400/10 px-4 py-3.5">
          <p className="min-w-0 flex-[1_1_16rem] text-sm text-fg">
            הפתרונות פתוחים במסלול <strong>קורסים + מבחנים</strong>.{sample ? " מבחן לדוגמה פתוח לכולם — נסו אותו." : ""}
          </p>
          {sample && (
            <ButtonLink href={`/exams/${sample.id}`} variant="secondary" size="sm">
              למבחן לדוגמה
            </ButtonLink>
          )}
          <ButtonLink href="/pricing?plan=exams" size="sm">
            למסלול <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </ButtonLink>
        </div>
      )}
      <p className="num mt-6 text-sm text-muted">{exams.length} מבחנים</p>
      {exams.length ? (
        <ExamGrid exams={exams} access={access} className="mt-3" />
      ) : (
        <div className="mt-3">
          <EmptyState icon={<FileSearch className="h-5 w-5" />} title="אין מבחנים שמתאימים לסינון" description="נסו קורס או נושא אחר — או נקו את הסינון." />
        </div>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  );
}

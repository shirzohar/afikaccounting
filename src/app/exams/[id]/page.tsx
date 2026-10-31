import { Download, FileText, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RichParagraph } from "@/components/content/rich-text";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ExamBlocks } from "@/components/exams/exam-blocks";
import { EXAMS_LEAD } from "@/components/exams/exam-card";
import { topicLabel } from "@/components/exams/exam-grid";
import { SolutionSteps } from "@/components/exams/solution-steps";
import { Paywall } from "@/components/pricing/paywall";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, Skeleton } from "@/components/ui/primitives";
import { VideoPlayer } from "@/components/video/video-player";
import { EXAMS_HUB, TOPICS } from "@/lib/catalog";
import { getExam, getExamContent, listExams } from "@/lib/data/exams";
import { type ExamContent, type ExamMeta, examWhen } from "@/lib/exams/types";

export async function generateStaticParams() {
  const exams = await listExams();
  // Cache Components fails the build on an empty list: with nothing published yet, one placeholder that renders notFound().
  return exams.length ? exams.map((e) => ({ id: e.id })) : [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export async function generateMetadata({ params }: PageProps<"/exams/[id]">): Promise<Metadata> {
  const exam = await getExam((await params).id);
  if (!exam) return { title: "לא נמצא" };
  return { title: `${exam.title} · ${EXAMS_HUB.label}`, description: exam.description };
}

/**
 * One exam: the question, then the solution from zero, one step at a time.
 * The page's frame (title, what it covers) is public and prerendered; the
 * question and the solution are read for this reader only, behind a boundary —
 * and only if they may open it. Otherwise the paywall takes their place.
 */
export default async function ExamPage({ params }: PageProps<"/exams/[id]">) {
  const exam = await getExam((await params).id);
  if (!exam) notFound();
  const topic = TOPICS.find((t) => t.id === exam.topic);
  return (
    <Container className="pt-10 pb-16 sm:pt-14">
      <Breadcrumbs root={{ label: EXAMS_HUB.label, href: EXAMS_HUB.href }} trail={[{ label: topicLabel(exam.topic), href: `${EXAMS_HUB.href}?topic=${exam.topic}` }, { label: exam.title }]} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {exam.isSample ? <TierBadge tier="free" label="לדוגמה — חינם" /> : <TierBadge tier="exams" />}
        <span className="num text-sm text-muted">{examWhen(exam)}</span>
      </div>
      <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{exam.title}</h1>
      <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">{exam.description}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="נושאים">
        {exam.subjects.map((s) => (
          <li key={s}>
            <Link href={`${EXAMS_HUB.href}?subject=${encodeURIComponent(s)}`} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted hover:text-fg">
              {s}
            </Link>
          </li>
        ))}
      </ul>
      {topic && (
        <p className="mt-3 text-sm text-muted">
          לחזרה על החומר:{" "}
          <Link href={topic.href} className="font-medium text-accent hover:underline">
            {topicLabel(topic.id)}
          </Link>
        </p>
      )}

      <Suspense fallback={<ContentSkeleton />}>
        <Gated exam={exam} />
      </Suspense>
    </Container>
  );
}

async function Gated({ exam }: { exam: ExamMeta }) {
  const content = await getExamContent(exam);
  if (!content) {
    const sample = (await listExams()).find((e) => e.isSample);
    return (
      <div className="mt-8 max-w-4xl">
        <Paywall tier="exams" title={exam.title} course={topicLabel(exam.topic)} where={`/exams/${exam.id}`} lead={EXAMS_LEAD} taste={sample && { href: `/exams/${sample.id}`, label: "למבחן לדוגמה — בחינם" }} />
      </div>
    );
  }
  return <Solved exam={exam} content={content} />;
}

/** The question and the solution, for a reader who may open them. */
function Solved({ exam, content: c }: { exam: ExamMeta; content: ExamContent }) {
  const file = (which: string, download = false) => `/exams/${exam.id}/file/${which}${download ? "?download=1" : ""}`;
  const external = c.video && /^https?:\/\//.test(c.video);
  return (
    <div className="mt-10 space-y-12">
      <section aria-labelledby="question">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="question" className="flex flex-1 items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <FileText className="h-6 w-6 text-accent" aria-hidden /> השאלה
          </h2>
          {exam.hasPaper && (
            <ButtonLink href={file("question", true)} variant="secondary" size="sm" prefetch={false}>
              <Download className="h-3.5 w-3.5" aria-hidden /> הורדת השאלון
            </ButtonLink>
          )}
        </div>
        {c.question.length > 0 && (
          <div className="card mt-4 p-4 sm:p-6">
            <ExamBlocks blocks={c.question} />
          </div>
        )}
        {exam.hasPaper && (
          <iframe src={file("question")} title={`השאלון: ${exam.title}`} className="mt-4 h-[75vh] w-full rounded-2xl border border-line bg-surface" />
        )}
        {!exam.hasPaper && !c.question.length && <p className="mt-3 text-sm text-muted">השאלה עוד לא הועלתה.</p>}
      </section>

      {c.video && (
        <section aria-labelledby="video">
          <h2 id="video" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <PlayCircle className="h-6 w-6 text-accent" aria-hidden /> הפתרון בסרטון
          </h2>
          <div className="mt-4">
            <VideoPlayer
              item={{ slug: `exam-${exam.id}`, title: exam.title, videoUrl: external ? c.video : file("video"), durationSeconds: c.videoSeconds, chapters: [] }}
              track={false}
              layout="stacked"
            />
          </div>
        </section>
      )}

      <section aria-labelledby="solution">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="solution" className="flex-1 text-2xl font-semibold tracking-tight text-fg">
            הפתרון, מאפס
          </h2>
          {c.hasSolutionFile && (
            <ButtonLink href={file("solution", true)} variant="secondary" size="sm" prefetch={false}>
              <Download className="h-3.5 w-3.5" aria-hidden /> הפתרון כקובץ
            </ButtonLink>
          )}
        </div>
        <div className="mt-4">
          {c.steps.length ? (
            <SolutionSteps
              steps={c.steps.map((s) => ({
                title: s.title,
                body: (
                  <div className="space-y-3">
                    {s.explanation
                      .split(/\n\s*\n/)
                      .filter(Boolean)
                      .map((p, i) => (
                        <RichParagraph key={i} text={p} className="text-[15.5px] leading-relaxed text-fg/90" />
                      ))}
                    <ExamBlocks blocks={s.blocks} />
                  </div>
                ),
              }))}
            />
          ) : (
            <p className="text-sm text-muted">הפתרון המפורט עוד לא נכתב{c.hasSolutionFile ? " — בינתיים הוא זמין כקובץ." : "."}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="mt-10 space-y-4" aria-busy="true" aria-label="טוען">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
}

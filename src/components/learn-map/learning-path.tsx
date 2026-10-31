import { ArrowLeft, Calculator, FileText, Play } from "lucide-react";
import Link from "next/link";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { LEARNING_PATH, type Stage, tasteLabel, type Topic } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * The learning path, stage by stage: what to learn first, and for each topic
 * its guide, its pages and its calculators. `compact` is the home page's version.
 */
export function LearningPath({ compact = false }: { compact?: boolean }) {
  return (
    <ol className="relative space-y-6">
      {LEARNING_PATH.map((stage, i) => (
        <StageRow key={stage.id} stage={stage} compact={compact} last={i === LEARNING_PATH.length - 1} />
      ))}
    </ol>
  );
}

function StageRow({ stage, compact, last }: { stage: Stage; compact: boolean; last: boolean }) {
  return (
    <li className="relative grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)]" aria-labelledby={`stage-${stage.id}`}>
      {/* The line that joins the stages, on wide screens. */}
      {!last && <span aria-hidden className="absolute top-14 bottom-[-1.5rem] start-[1.375rem] hidden w-px bg-line-strong md:block" />}
      <div className="flex items-start gap-3">
        <span className="num relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]">
          {stage.step}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-accent">שלב {stage.step}</p>
          <h3 id={`stage-${stage.id}`} className="text-lg font-semibold text-fg">
            {stage.title}
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{stage.lead}</p>
        </div>
      </div>
      <div className={cn("grid grid-cols-1 gap-4", stage.topics.length > 1 && "lg:grid-cols-2")}>
        {stage.topics.map((t) => (compact ? <CompactCard key={t.id} topic={t} /> : <TopicCard key={t.id} topic={t} />))}
      </div>
    </li>
  );
}

function Title({ topic }: { topic: Topic }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-fg">
      {topic.title}
      {topic.standard && (
        <Badge tone="accent" className="num">
          {topic.standard}
        </Badge>
      )}
      <span className="ms-auto flex flex-wrap gap-1.5">
        <TierBadge tier={topic.tier} label={topic.tier === "free" ? "חינם, כולו" : undefined} />
        {topic.preview.length > 0 && <TierBadge tier="free" label={tasteLabel(topic)} />}
      </span>
    </p>
  );
}

function CompactCard({ topic }: { topic: Topic }) {
  return (
    <Link href={topic.href} className="group card flex min-w-0 flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50">
      <Title topic={topic} />
      <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">{topic.description}</p>
      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent">
        {topic.pages ? `${topic.pages.length} דפים` : "למדריך"}
        {topic.tools.length > 0 && <span className="font-normal text-muted">· {topic.tools.length} כלים</span>}
        <ArrowLeft className="ms-auto h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
      </p>
    </Link>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  return (
    <article className="card flex min-w-0 flex-col p-5">
      <Title topic={topic} />
      <p className="mt-1.5 text-[14px] leading-relaxed text-fg/85">{topic.description}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="מה בפנים">
        {topic.covers.map((c) => (
          <li key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
            {c}
          </li>
        ))}
      </ul>
      {topic.pages && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-fg">
            <FileText className="h-3.5 w-3.5 text-accent" aria-hidden /> הדפים, לפי הסדר
          </p>
          <ol className="space-y-1">
            {topic.pages.map((p, i) => (
              <li key={p.href}>
                <Link href={p.href} className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                  <span className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-muted group-hover:bg-accent group-hover:text-accent-fg">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{p.label}</span>
                    {p.description && <span className="block text-xs text-muted">{p.description}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
      {topic.tools.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-fg">
            <Calculator className="h-3.5 w-3.5 text-accent" aria-hidden /> כלים ומחשבונים
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topic.tools.map((x) => (
              <Link key={x.href} href={x.href} className="rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-medium text-fg hover:border-accent/50 hover:bg-accent-soft">
                {x.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <ButtonLink href={topic.href} variant="secondary" className="w-full sm:w-auto">
          {topic.pages ? "להתחיל מהדף הראשון" : "למדריך"} <ArrowLeft className="h-4 w-4" />
        </ButtonLink>
        {topic.lesson && (
          <ButtonLink href={topic.lesson} className="w-full sm:w-auto">
            <Play className="h-4 w-4" aria-hidden /> שיעור אינטראקטיבי
          </ButtonLink>
        )}
      </div>
    </article>
  );
}

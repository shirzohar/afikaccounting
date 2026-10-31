import { ArrowLeft, CalendarDays, Clock, Paperclip } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleTracker } from "@/components/content/article-tracker";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RichParagraph } from "@/components/content/rich-text";
import { ContentCard, readingMinutes } from "@/components/content/content-card";
import { CalculatorIcon } from "@/components/engine/calculator-visuals";
import { Badge, Container, Skeleton } from "@/components/ui/primitives";
import { ResourceCard } from "@/components/video/resource-card";
import { VideoPlayer } from "@/components/video/video-player";
import { type ContentItem, levelLabel } from "@/lib/content/types";
import { getContent, listContent } from "@/lib/data/content";
import { getProgress } from "@/lib/data/user";
import { duration } from "@/lib/engine/format";
import { CALCULATORS } from "@/lib/engine/registry";
import { shortDate } from "@/lib/utils";

export async function generateStaticParams() {
  const items = await listContent();
  // Cache Components fails the build on an empty list, so with nothing published yet
  // prerender one placeholder: no item has that slug, so the page renders notFound().
  return items.length ? items.map((i) => ({ slug: i.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/content/[slug]">): Promise<Metadata> {
  const item = await getContent((await params).slug);
  if (!item) return { title: "לא נמצא" };
  return { title: item.title, description: item.summary };
}

export default async function LessonPage({ params }: PageProps<"/content/[slug]">) {
  const item = await getContent((await params).slug);
  if (!item) notFound();

  const calc =
    CALCULATORS.find((c) => c.explainerSlug === item.slug) ??
    CALCULATORS.find((c) => c.standard.split(" · ")[0] === item.standard);
  const related = (await listContent({ standard: item.standard })).filter((i) => i.id !== item.id).slice(0, 3);
  const video = item.kind === "video";

  return (
    <Container className="pt-8 sm:pt-10">
      <Breadcrumbs root={{ label: "וידאו ומאמרים", href: "/content" }} trail={[{ label: item.standard, href: `/content?standard=${encodeURIComponent(item.standard)}` }, { label: item.title }]} />

      <header className="mt-5 max-w-3xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">{item.standard}</Badge>
          <Badge>{item.category}</Badge>
          <Badge>{levelLabel(item.level)}</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{item.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.summary}</p>
        <p className="mt-4 flex flex-wrap items-center gap-4 text-xs text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {video ? duration(item.durationSeconds) : `${readingMinutes(item)} דק׳ קריאה`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {shortDate(item.publishedAt)}
          </span>
        </p>
      </header>

      <div className="mt-8">
        {video ? (
          <Suspense fallback={<Skeleton className="aspect-video w-full rounded-2xl lg:w-[calc(100%-340px)]" />}>
            <ResumablePlayer item={item} />
          </Suspense>
        ) : (
          <Article item={item} />
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {item.resources.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Paperclip className="h-4 w-4 text-accent" /> קבצים להורדה
            </h2>
            <div className="mt-3 grid gap-3">
              {item.resources.map((r) => (
                <ResourceCard key={r.url} resource={r} />
              ))}
            </div>
          </section>
        )}
        {calc && (
          <section>
            <h2 className="text-sm font-semibold text-fg">מהתיאוריה למעשה</h2>
            <Link
              href={`/engine?calc=${calc.slug}`}
              className="group card mt-3 flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
            >
              <CalculatorIcon calc={calc} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-accent">{calc.standard}</span>
                <span className="block font-medium text-fg">{calc.title}</span>
                <span className="block text-[13px] text-muted">{calc.tagline}</span>
              </span>
              <ArrowLeft className="h-4 w-4 text-subtle transition-transform group-hover:-translate-x-0.5 group-hover:text-accent" />
            </Link>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight text-fg">עוד על {item.standard}</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ContentCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

/** Reads the viewer's saved position, so it renders at request time. */
async function ResumablePlayer({ item }: { item: ContentItem }) {
  const startAt = await getProgress(item.id);
  return (
    <VideoPlayer
      item={{ slug: item.slug, title: item.title, videoUrl: item.videoUrl, durationSeconds: item.durationSeconds, chapters: item.chapters }}
      startAt={startAt}
    />
  );
}

function Article({ item }: { item: ContentItem }) {
  return (
    <article className="max-w-3xl">
      <ArticleTracker slug={item.slug} seconds={item.durationSeconds} />
      {item.body.length > 1 && (
        <nav aria-label="בדף זה" className="card mb-8 p-5">
          <p className="text-xs font-semibold text-muted">בדף זה</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {item.body.map((s, i) => (
              <li key={i}>
                <a href={`#s-${i}`} className="text-muted hover:text-accent">
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="space-y-10">
        {item.body.map((s, i) => (
          <section key={i} id={`s-${i}`} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight text-fg">{s.heading}</h2>
            {s.paragraphs.map((p, j) => (
              <RichParagraph key={j} text={p} className="mt-4 text-[15.5px] leading-8 text-fg/85" />
            ))}
          </section>
        ))}
      </div>
      <div id="article-end" aria-hidden />
    </article>
  );
}

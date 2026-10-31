import { ArrowLeft, BookOpenText, CheckCircle2, CircleHelp, ClipboardPen, Flag, Hourglass, PlayCircle, Shuffle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { TrackEvent } from "@/components/layout/track-event";
import { HomeExams } from "@/components/pricing/exams-teaser";
import { Faq } from "@/components/pricing/faq";
import { PlanCards } from "@/components/pricing/plan-cards";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Container, SectionHeading } from "@/components/ui/primitives";
import { FIRST_LESSON, PRICING_HUB, tasteLabel, TOPICS } from "@/lib/catalog";
import { studyHref } from "@/lib/study";
import { BASICS_LESSONS } from "@/lib/study/basics";
import type { StudyModule } from "@/lib/study/types";

/**
 * What students say, quoted with their permission. Empty on purpose: the
 * section shows only once there are real quotes. Never invent one, nor a
 * grade or a number of users.
 */
const TESTIMONIALS: { quote: string; name: string; detail?: string }[] = [];

const PAINS = [
  { icon: Shuffle, title: "חובה וזכות מתבלבלים", body: "שיננתם שנכסים בחובה, ובשאלה הראשונה שוב לא בטוחים לאיזה צד הסכום הולך." },
  { icon: Hourglass, title: "שעות על הרצאה, ודקה על תרגול", body: "מבינים בכיתה, נתקעים בבית — ואין מי שיגיד מיד איפה הטעות." },
  { icon: CircleHelp, title: "המבחן מלא במלכודות", body: "תשובה שנראית נכונה, ומחיר של נקודות על כל טעות קטנה שלא הכרתם מראש." },
];

const HOW = [
  { icon: BookOpenText, title: "מושג אחד, עם דוגמה חיה", body: "כל מסך מלמד רעיון אחד — וכל מספר בו זז כשמשנים נתון, כדי שתראו למה." },
  { icon: ClipboardPen, title: "תרגול עם משוב ומלכודות", body: "פקודות יומן, שאלות חישוב ואמריקאיות — עם משוב מיידי, והסבר למה התשובה השגויה מפתה." },
  { icon: Flag, title: "סיכום וטיפים למבחן", body: "בסוף כל שיעור: כמה הצלחתם, מה כדאי לתרגל שוב, וטיפים זהב למבחן." },
];

const FAQ = [
  { q: "זה באמת חינם?", a: "כן. ״חשבונאות מאפס״ — כל 6 השיעורים, עם התרגול, הסרטונים והסיכומים — פתוח בחינם, לתמיד. וגם השיעור הראשון בכל קורס מתקדם." },
  { q: "צריך כרטיס אשראי?", a: "לא. אפשר להתחיל את שיעור 1 עכשיו, בלי הרשמה ובלי כרטיס אשראי." },
  { q: "מה מקבלים במנוי?", a: "את הקורסים המתקדמים במלואם — מלאי, רכוש קבוע והצגת דוחות כספיים, עד רמת מבחן. במסלול ״קורסים + מבחנים״ נוסף מתחם המבחנים: תרגילים ברמת מבחן עם פתרון מלא מאפס." },
  { q: "אפשר לבטל?", a: "כן, בכל רגע. המנוי נשאר פעיל עד סוף התקופה ששילמתם עליה, והקורס החינמי נשאר פתוח לכם תמיד." },
  { q: "צריך רקע קודם?", a: "לא. הקורס מתחיל ממש מההתחלה — מה זה עסק, מה זה נכס ולמה יש חובה וזכות." },
];

const count = (m: StudyModule) => m.exercises.length + m.traps.length;
const minutes = (m: StudyModule) => Math.max(1, Math.round((m.videos ?? []).reduce((a, v) => a + v.duration, 0) / 60));

export default function Home() {
  const trap = BASICS_LESSONS[0].traps.find((t) => t.id === "debit-bad") ?? BASICS_LESSONS[0].traps[0];
  const total = BASICS_LESSONS.reduce((a, m) => a + count(m), 0);
  const paid = TOPICS.filter((t) => t.tier !== "free");
  return (
    <>
      <TrackEvent event={{ kind: "landing_view" }} />
      <Hero trap={trap} lessons={BASICS_LESSONS.length} exercises={total} />

      <Container className="pt-6 sm:pt-10">
        <SectionHeading eyebrow="מכירים את זה?" title="חשבונאות לא קשה. היא פשוט מוסברת מהר מדי." />
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {PAINS.map((p) => (
            <li key={p.title} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger/10 text-danger" aria-hidden>
                <p.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold text-fg">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section className="mt-16 border-y border-line bg-surface/50 sm:mt-20">
        <Container className="py-16">
          <SectionHeading eyebrow="איך לומדים כאן" title="כל שיעור — שלושה צעדים, ותמיד יודעים איפה אתם" />
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {HOW.map((s, i) => (
              <li key={s.title} className="card flex gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent" aria-hidden>
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">
                    <span className="num me-1.5 text-xs text-subtle">0{i + 1}</span>
                    {s.title}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <Shot name="lesson" alt="מסך מושג בשיעור: הכותרת, ההסבר, דוגמה חיה, והכפתורים להמשך" caption="מסך בשיעור: מושג אחד, דוגמה חיה, והתקדמות למעלה" />
            <Shot name="course" alt="דף הקורס: המסלול שלך, השיעור הבא פתוח עם המושגים שבו, והשיעורים שאחריו" caption="דף הקורס: מה עשיתם, כמה XP צברתם, ומה הצעד הבא" />
          </div>
        </Container>
      </section>

      <Container id="free-course" className="scroll-mt-20 pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="הקורס החינמי"
          title={
            <>
              חשבונאות מאפס — <span className="num">{BASICS_LESSONS.length}</span> שיעורים, <span className="num">{total}</span> שאלות תרגול
            </>
          }
          description="מהשאלה ״מה זה בכלל חשבונאות״ ועד גיליון רב-טורי. פתוח כולו, בלי הרשמה."
          action={
            <ButtonLink href="/basics" variant="outline">
              לדף הקורס <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
          }
        />
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BASICS_LESSONS.map((m) => (
            <li key={m.slug}>
              <Link href={studyHref(m.slug)} className="group card flex h-full gap-3 p-4 transition-colors hover:border-accent/50">
                <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">{m.n}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg group-hover:text-accent">{m.title}</span>
                  <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-muted">{m.description}</span>
                  <span className="num mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {m.screens.length} מושגים · {count(m)} שאלות תרגול
                    {m.videos?.length ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
                        <PlayCircle className="h-3.5 w-3.5" aria-hidden /> {m.videos.length > 1 ? `${m.videos.length} סרטונים` : "סרטון"} · {minutes(m)} דק׳
                      </span>
                    ) : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <ButtonLink href={FIRST_LESSON} size="lg">
            התחילו את שיעור 1 <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </Container>

      <Container className="pt-16 sm:pt-20">
        <SectionHeading eyebrow="כשמגיעים למבחן" title="הנושאים שחוזרים בכל מבחן — עד רמת מבחן" description="אותו מבנה בדיוק כמו בקורס החינמי, ובכל קורס השיעור הראשון עלינו." />
        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {paid.map((t) => (
            <li key={t.id}>
              <Link href={t.href} className="group card flex h-full flex-col p-5 transition-colors hover:border-accent/50">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[17px] font-semibold text-fg">{t.title}</span>
                  {t.standard && (
                    <Badge tone="accent" className="num">
                      {t.standard}
                    </Badge>
                  )}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <TierBadge tier={t.tier} />
                  <TierBadge tier="free" label={tasteLabel(t)} />
                </span>
                <span className="mt-3 flex-1 text-[13.5px] leading-relaxed text-muted">{t.description}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {t.covers.slice(0, 5).map((c) => (
                    <span key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      {c}
                    </span>
                  ))}
                </span>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent">
                  {tasteLabel(t)} — להתחיל <ArrowLeft className="ms-auto h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="pt-16 sm:pt-20">
        <SectionHeading eyebrow="השלב הבא" title="ואחרי הקורסים — מתרגלים כמו במבחן" />
        <HomeExams />
      </Container>

      {TESTIMONIALS.length > 0 && (
        <Container className="pt-16 sm:pt-20">
          <SectionHeading eyebrow="מה אומרים סטודנטים" title="מהשיעור הראשון ועד המבחן" />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li key={t.name} className="card p-5">
                <blockquote className="text-[15px] leading-relaxed text-fg/90">״{t.quote}״</blockquote>
                <p className="mt-3 text-sm font-semibold text-fg">{t.name}</p>
                {t.detail && <p className="text-xs text-muted">{t.detail}</p>}
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container className="pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="מחירים"
          title="מתחילים בחינם. משלמים רק כשממשיכים."
          action={
            <ButtonLink href={PRICING_HUB.href} variant="outline">
              להשוואה המלאה <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
          }
        />
        <div className="mt-10">
          <PlanCards from="home" />
        </div>
      </Container>

      <Container className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">שאלות נפוצות</h2>
          <Faq items={FAQ} className="mt-6" />
        </div>
      </Container>

      <Container className="pt-16 sm:pt-20">
        <div className="glass flex flex-col items-start gap-5 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold text-fg">שיעור 1 לוקח כמה דקות. תתחילו עכשיו.</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden /> בלי הרשמה, בלי כרטיס אשראי.
            </p>
          </div>
          <ButtonLink href={FIRST_LESSON} size="lg">
            התחילו את שיעור 1 <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

/** A real screenshot of the course, in the reader's theme. Taken from the site itself (public/landing). */
function Shot({ name, alt, caption }: { name: string; alt: string; caption: string }) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-line-strong shadow-card">
        <Image src={`/landing/${name}-light.png`} alt={alt} width={1280} height={800} className="block h-auto w-full dark:hidden" sizes="(min-width: 1024px) 50vw, 100vw" />
        <Image src={`/landing/${name}-dark.png`} alt={alt} width={1280} height={800} className="hidden h-auto w-full dark:block" sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
      <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}

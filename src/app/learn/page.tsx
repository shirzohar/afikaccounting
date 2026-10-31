import { ArrowLeft, Calculator, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LearningPath } from "@/components/learn-map/learning-path";
import { Container } from "@/components/ui/primitives";
import { ENGINE_HUB, ENGINE_TOOLS, LEARNING_TOOLS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "מפת הלימוד",
  description: "כל הקורסים באתר במקום אחד, לפי הסדר: חשבונאות מאפס בחינם, ואחריה הקורסים המתקדמים — מלאי, רכוש קבוע ודוחות כספיים — עם הכלים והמחשבונים של כל נושא.",
};

export default function LearnPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <p className="text-xs font-semibold text-accent">לימוד</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          מפת <span className="text-gradient">הלימוד</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          כל מה שאפשר ללמוד באתר, לפי הסדר שבו כדאי ללמוד אותו. מתחילים ב״חשבונאות מאפס״ — חינם, כל הקורס — וממשיכים לקורסים המתקדמים, שהשיעור הראשון בכל אחד מהם
          פתוח בחינם. בכל נושא — השיעורים, הכלים והמחשבונים שמראים את הדרך המלאה.
        </p>

        <div className="mt-10">
          <LearningPath />
        </div>

        <section className="mt-14 grid gap-4 lg:grid-cols-2" aria-label="עוד דרכים להתקדם">
          <div className="card p-5">
            <p className="flex items-center gap-2 text-[17px] font-semibold text-fg">
              <Calculator className="h-5 w-5 text-accent" aria-hidden /> רק רוצים לחשב?
            </p>
            <p className="mt-1 text-sm text-muted">כל המחשבונים באתר, במקום אחד.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-accent">מחשבונים לימודיים — עם הדרך המלאה</p>
                <ul className="space-y-1 text-sm">
                  {LEARNING_TOOLS.map((x) => (
                    <li key={x.href}>
                      <Link href={x.href} className="text-fg hover:text-accent hover:underline">
                        {x.label}
                      </Link>
                      <span className="text-xs text-muted"> · {x.topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-accent">מנוע הפתרונות — לתרחישים מקצועיים</p>
                <ul className="space-y-1 text-sm">
                  {ENGINE_TOOLS.map((x) => (
                    <li key={x.href}>
                      <Link href={x.href} className="text-fg hover:text-accent hover:underline">
                        <span className="num">{x.standard}</span> · {x.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={ENGINE_HUB.href} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                  למנוע הפתרונות <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
          <Link href="/content" className="group card flex flex-col p-5 transition-colors hover:border-accent/50">
            <p className="flex items-center gap-2 text-[17px] font-semibold text-fg">
              <PlayCircle className="h-5 w-5 text-accent" aria-hidden /> וידאו ומאמרים
            </p>
            <p className="mt-1 flex-1 text-sm text-muted">כיתות אמן בווידאו ומאמרים מעשיים על IFRS 16, IAS 16, IAS 37 ומיסוי — לצפייה לצד הלימוד.</p>
            <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-accent">
              לכל התכנים <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
            </p>
          </Link>
        </section>
      </Container>
    </div>
  );
}

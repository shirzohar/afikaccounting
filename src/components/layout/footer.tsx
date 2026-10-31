import Link from "next/link";
import { EXAMS_HUB, FIRST_LESSON, LEARN_HUB, LEARNING_TOOLS, PRICING_HUB, TOPICS } from "@/lib/catalog";
import { CALCULATORS } from "@/lib/engine/registry";
import { site } from "@/lib/site";
import { LogoMark } from "./logo";

// The same map as the menu, from the catalog: the courses, the tools, the videos, and the plans and the account.
const COLUMNS = [
  {
    title: "קורסים",
    links: [
      LEARN_HUB,
      ...TOPICS.map((t) => ({ href: t.href, label: `${t.standard ? `${t.standard} · ${t.title}` : t.title}${t.tier === "free" ? " — חינם" : ""}` })),
    ],
  },
  {
    title: "כלים",
    links: [
      ...LEARNING_TOOLS.map((c) => ({ href: c.href, label: c.label })),
      ...CALCULATORS.map((c) => ({ href: `/engine?calc=${c.slug}`, label: `מנוע: ${c.standard} — ${c.category}` })),
    ],
  },
  {
    title: "וידאו ומאמרים",
    links: [
      { href: "/content", label: "כל התכנים" },
      { href: "/content?kind=video", label: "שיעורי וידאו" },
      { href: "/content?kind=article", label: "מאמרים" },
      { href: "/content?level=beginner", label: "למתחילים" },
      { href: "/content?level=advanced", label: "נושאים מתקדמים" },
    ],
  },
  {
    title: "הפלטפורמה",
    links: [
      { href: FIRST_LESSON, label: "שיעור 1 — מתחילים כאן" },
      PRICING_HUB,
      { href: EXAMS_HUB.href, label: EXAMS_HUB.label },
      { href: "/dashboard", label: "הלוח האישי" },
      { href: "/about", label: "אודות" },
    ],
  },
];

const REFERENCES = [
  "IFRS 16 חכירות",
  "IAS 16 רכוש קבוע",
  "IAS 37 הפרשות, התחייבויות תלויות ונכסים תלויים",
  "IAS 12 מסים על ההכנסה",
  "פקודת מס הכנסה [נוסח חדש], התשכ\"א-1961",
];

export function Footer() {
  return (
    <footer className="no-print mt-24 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-[17px] font-semibold tracking-tight">{site.name}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{site.description}</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-fg">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted transition-colors hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 border-t border-line pt-8 text-xs leading-relaxed text-subtle lg:grid-cols-2">
          <div>
            <p className="font-semibold text-muted">תקנים שאליהם יש הפניות</p>
            <p className="mt-2">{REFERENCES.join(" · ")}</p>
            <p className="mt-2">
              תקני הדיווח הכספי הבינלאומיים (IFRS®) מפורסמים על ידי הוועדה הבינלאומית לתקינה בחשבונאות (IASB) של קרן
              IFRS. ההפניות לסעיפים מתייחסות לתקנים כפי שפורסמו; יש לעיין בנוסח המחייב.
            </p>
          </div>
          <div>
            <p className="font-semibold text-muted">הבהרה</p>
            <p className="mt-2">
              {site.name} מספקת כלים לימודיים וחישובים להמחשה. התוצאות תלויות בנתונים ובהנחות שהוזנו, ואינן מהוות
              ייעוץ חשבונאי, ביקורתי, משפטי או מיסויי. יש להפעיל תמיד שיקול דעת מקצועי ולהיוועץ באיש מקצוע מוסמך לפני
              הסתמכות על תוצאה כלשהי.
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs text-subtle">
          © <CurrentYear /> {site.name}. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}

/** Cached so reading the clock doesn't make the footer request-time. */
async function CurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

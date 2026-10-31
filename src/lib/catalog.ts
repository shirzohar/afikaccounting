/**
 * The site's map: every learning page and every calculator, in one place.
 *
 * The menu, the footer, the home page and the learning map are all built from
 * these lists, so a new page added here shows up everywhere at once. Kept free
 * of engine imports, because the menu ships to the browser; a test checks the
 * engine calculators listed here against the engine's own registry.
 */

export type CatalogLink = { href: string; label: string; description?: string };
/** A topic's tool; `calculator` lists a tool inside a lesson among the calculators too (other tools of the page always are). */
export type ToolLink = CatalogLink & { calculator?: boolean };

export type Topic = {
  id: string;
  title: string;
  /** The standard, when the topic is one ("IAS 2"). */
  standard?: string;
  href: string;
  description: string;
  /** What is inside, in a few words each. */
  covers: string[];
  /** Sub-pages, when the topic spans several. */
  pages?: CatalogLink[];
  tools: ToolLink[];
  /** The topic's interactive lesson, when it is a single lesson (/study/[slug]); a course of lessons is its own page. */
  lesson?: string;
};

export type Stage = { id: string; step: number; title: string; lead: string; topics: Topic[] };

/**
 * The learning path. Every guide sits in the foundations, one page each — the
 * course from zero, then inventory, credit losses and property, plant and
 * equipment — so each is one entry in the menu.
 */
export const LEARNING_PATH: Stage[] = [
  {
    id: "foundations",
    step: 1,
    title: "יסודות",
    lead: "מחובה וזכות ועד הנושאים שמופיעים כמעט בכל שאלת מבחן — כל נושא בעמוד מלא אחד",
    topics: [
      {
        id: "basics",
        title: "חשבונאות מאפס",
        href: "/basics",
        description: "6 שיעורים אינטראקטיביים, מ״מה זה בכלל חשבונאות״ דרך התאמות סוף שנה והפסדי אשראי ועד גיליון רב-טורי — עם תרגול בכל שיעור: פקודות יומן, שאלות אמריקאיות ושאלות חישוב.",
        covers: ["חובה וזכות", "פקודות יומן", "כרטיסי T", "מאזן בוחן", "דוחות כספיים", "התאמות סוף שנה", "הפסדי אשראי"],
        tools: [
          { href: "/study/basics-double-entry?screen=lab", label: "עסק שלם, פקודה אחר פקודה" },
          { href: "/study/basics-credit?screen=cl-calc", label: "מחשבון הפסדי אשראי" },
          { href: "/study/basics-final?step=2", label: "תרגול מסכם" },
        ],
      },
      {
        id: "inventory",
        title: "מלאי",
        standard: "IAS 2",
        href: "/basics/inventory",
        description: "6 שיעורים אינטראקטיביים, מ״מה שלא נמכר אינו הוצאה״ דרך עלות לפי התקן, FIFO וממוצעים ושווי מימוש נטו ועד חילוץ נעלמים ושאלה מלאה — עם תרגול בכל שיעור ומחשבון.",
        covers: ["תקופתי ותמידי", "עלות לפי IAS 2", "FIFO", "ממוצע משוקלל", "שווי מימוש נטו", "חילוץ נעלמים", "שריפה וביטוח"],
        tools: [{ href: "/study/inventory-exam?screen=inv-calc", label: "מחשבון מלאי", calculator: true }],
      },
      {
        id: "ias16",
        title: "רכוש קבוע",
        standard: "IAS 16",
        href: "/basics/ias16",
        description: "מהו רכוש קבוע, מושגי יסוד, ואז הסוגיות מהפשוטה למורכבת: פחת, שאלה מלאה, שיפוצים, החלפה והערכה מחדש.",
        covers: ["מהו רכוש קבוע", "שיטות פחת", "שאלה מלאה", "שיפוצים", "החלפה", "הערכה מחדש"],
        tools: [
          { href: "/basics/ias16#depreciation", label: "סימולטור פחת" },
          { href: "/basics/ias16#renovation-calculator", label: "מחשבון שיפוץ" },
          { href: "/basics/ias16#exchange-calculator", label: "מחשבון החלפה" },
          { href: "/basics/ias16#revaluation-calculator", label: "מחשבון הערכה מחדש" },
        ],
      },
      {
        id: "statements",
        title: "הכנת דוחות כספיים",
        standard: "IFRS 18",
        href: "/basics/statements",
        description: "המסגרת המושגית, מבנה המאזן ודוח רווח או הפסד לפי IFRS 18, ושאלה מלאה ממאזן בוחן ועד דוחות.",
        covers: ["מסגרת מושגית", "מאפיינים איכותיים", "שוטף ובלתי שוטף", "קטגוריות IFRS 18", "סיווג לפי מאפיין פעילות", "רווח כולל אחר"],
        tools: [{ href: "/basics/statements#fs-builder", label: "בונה הדוחות" }],
      },
    ],
  },
];

/** The solution engine's calculators (titles as in the engine registry). */
export const ENGINE_TOOLS: (CatalogLink & { slug: string; standard: string })[] = [
  { slug: "ifrs-16-leases", standard: "IFRS 16", href: "/engine?calc=ifrs-16-leases", label: "חכירות", description: "לוח סילוקין, נכס זכות שימוש ובאור" },
  { slug: "ias-16-property-plant-equipment", standard: "IAS 16", href: "/engine?calc=ias-16-property-plant-equipment", label: "רכוש קבוע", description: "ציר זמן מלא של נכס, עם פקודות ובאור" },
  { slug: "ias-37-provisions", standard: "IAS 37", href: "/engine?calc=ias-37-provisions", label: "הפרשות", description: "עץ ההחלטות, אומדן והיוון" },
  { slug: "corporate-tax-ias-12", standard: "IAS 12", href: "/engine?calc=corporate-tax-ias-12", label: "מס הכנסה על חברות", description: "מס שוטף, מסים נדחים והתאמה" },
];

/** Every calculator inside a learning page, in learning-path order. */
export const LEARNING_TOOLS: (CatalogLink & { topic: string })[] = LEARNING_PATH.flatMap((s) =>
  s.topics.flatMap((t) =>
    t.tools.filter((x) => x.calculator || !x.href.startsWith("/study/")).map(({ href, label, description }) => ({ href, label, description, topic: t.standard ? `${t.standard} · ${t.title}` : t.title })),
  ),
);

export const LEARN_HUB = { href: "/learn", label: "מפת הלימוד" };
export const ENGINE_HUB = { href: "/engine", label: "מנוע הפתרונות" };

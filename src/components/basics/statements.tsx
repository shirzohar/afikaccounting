import { ArrowLeft, BookOpenCheck, Calculator, ClipboardList, FileSpreadsheet, Layers, ListChecks, Scale, Split, Table2 } from "lucide-react";
import Link from "next/link";
import { screenHref } from "@/lib/study/basics";
import { Callout, DataTable } from "@/components/study/blocks";
import { ALON, build, CONCEPTS, credits, debits, HAYUVAL, NET, NOF, PL_LINES, questionStatements } from "@/lib/learn/statements";
import { AnswerCheck, MiniQuiz, SortQuiz } from "./inventory-interactive";
import { AllocationDrill, LoanSplitter, StatementsBuilder, StepReveal } from "./statements-builder";
import { StatementWithLines } from "./statements-view";
import { Card, Chapter, Money, Rule, Term } from "./ui";

const S = build(HAYUVAL);
const P = build(ALON);
const amount = (name: string) => HAYUVAL.accounts.find((a) => a.name === name)!.amount;
const P_ = "fs";
const SOLVED = questionStatements(HAYUVAL);
const linkClass = "font-medium text-accent hover:underline";

// ---------------------------------------------------------------------------
// Part A — the conceptual framework.

const USERS: [string, string][] = [
  ["משקיעים", "לקנות, להחזיק או למכור מניות — מסתכלים על רווחיות, יציבות ויכולת לחלק דיבידנדים."],
  ["מלווים ונותני אשראי", "להעניק אשראי ובאילו תנאים — מסתכלים על יכולת הפירעון."],
  ["ספקים", "האם החברה תוכל לשלם להם."],
  ["לקוחות", "האם החברה תמשיך להתקיים ולספק."],
  ["עובדים", "האם המעסיק יציב ורווחי."],
  ["ממשלה ורשויות המס", "בחינת סכומי המס ופיקוח על הפעילות העסקית במשק."],
  ["הציבור", "מידע על החברה ועל השפעתה."],
];

function FrameworkChapter() {
  return (
    <Chapter n={1} id="fs-framework" title="למה יש כללים, ומהי המסגרת המושגית" lead="שפה אחת לכל הדוחות — וחוקה שמסבירה למה">
      <p>
        דוחות כספיים מוכנים לפי <Term he="כללי חשבונאות מקובלים (GAAP)" />: כללים ישראליים (לחברות פרטיות), <Term he="IFRS" /> (לחברות ציבוריות) ו-US GAAP. בקורס —
        IFRS. כשכולם מציגים לפי אותם כללים, אפשר להשוות חברה לעצמה בשנים שונות, וחברה לחברה.
      </p>
      <p>
        <Term he="המסגרת המושגית לדיווח כספי" /> היא &quot;חוקה חשבונאית&quot;: היא מתארת את מטרת הדיווח הכספי ואת הרעיונות שעליהם הוא בנוי. שלוש המטרות שלה:
      </p>
      <ol className="list-inside list-decimal space-y-1 ps-1">
        <li>לעזור לוועדה לתקני חשבונאות בינלאומיים (IASB) לכתוב תקנים שמבוססים על רעיונות עקביים.</li>
        <li>לעזור לחברות לבחור מדיניות חשבונאית עקבית — כשאין תקן שמתאים לעסקה, או כשתקן מאפשר בחירה.</li>
        <li>לעזור לכל הצדדים להבין ולפרש את התקנים.</li>
      </ol>
      <Rule>המסגרת המושגית אינה תקן. היא לא גוברת על שום תקן — ובסתירה ביניהם, התקן גובר.</Rule>
      <p>
        <Term he="מטרת הדיווח הכספי" />: לתת מידע על הישות שמועיל למשקיעים, למלווים ולנותני אשראי — קיימים ועתידיים — בהחלטות על אספקת משאבים לה: קנייה, מכירה או
        החזקה של מניות ואג&quot;ח; מתן או סילוק הלוואות ואשראי; והצבעה או השפעה על פעולות ההנהלה. לכל משתמש צרכים משלו, ולכן הדוחות צריכים לתת את הדעת על כולם:
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {USERS.map(([who, what]) => (
          <div key={who} className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
            <p className="text-[14.5px] font-semibold text-fg">{who}</p>
            <p className="mt-0.5 text-[13.5px] text-fg/85">{what}</p>
          </div>
        ))}
      </div>
      <MiniQuiz
        prefix={P_}
        chapter="fs-framework"
        items={[
          {
            q: "תקן מסוים קובע טיפול שונה ממה שעולה מהמסגרת המושגית. מה עושים?",
            options: ["פועלים לפי המסגרת", "פועלים לפי התקן", "בוחרים את מה שנותן רווח גבוה יותר"],
            answer: 1,
            why: "המסגרת המושגית אינה תקן ואינה גוברת עליו — בסתירה, התקן גובר.",
          },
          {
            q: "אין תקן שמתייחס לעסקה חדשה. במה משתמשת החברה כדי לקבוע מדיניות?",
            options: ["במסגרת המושגית", "בכללי המס", "במה שהמבקר מעדיף"],
            answer: 0,
            why: "זו אחת משלוש המטרות של המסגרת: לעזור לפתח מדיניות עקבית כשאין תקן.",
          },
          {
            q: "בנק שוקל לתת לחברה הלוואה. מה מעניין אותו בדוחות יותר מכול?",
            options: ["יכולת הפירעון", "מספר העובדים", "הדיבידנד לשנה הבאה"],
            answer: 0,
            why: "מלווים ונותני אשראי מחליטים אם להעניק אשראי ובאילו תנאים — לפי יכולת הפירעון.",
          },
        ]}
      />
    </Chapter>
  );
}

function QualitiesChapter() {
  const tree: [string, string[]][] = [
    ["רלוונטיות", ["ערך ניבוי — עוזר לחזות", "ערך אישור — מאשר או מפריך הערכות קודמות", "מהותיות — השמטה או טעות הייתה משנה החלטות"]],
    ["מצג נאמן", ["שלם — כל מה שצריך כדי להבין", "ניטרלי — בלי הטיה לטובה או לרעה", "נטול טעויות — אין טעויות או השמטות בתיאור", "מהות על פני צורה — המציאות הכלכלית, לא רק הצורה המשפטית"]],
  ];
  const better: [string, string][] = [
    ["יכולת השוואה", "אפשר להשוות לחברות אחרות ולשנים אחרות; עקביות בשיטות עוזרת."],
    ["יכולת אימות", "משקיפים בלתי תלויים היו מגיעים להסכמה שזה מצג נאמן."],
    ["עיתוי נאות", "המידע מגיע כשהוא עוד יכול להשפיע. מידע ישן — פחות שימושי."],
    ["מובנות", "סיווג והצגה ברורים ותמציתיים, לקורא בעל ידע סביר שקורא בשקדנות."],
  ];
  return (
    <Chapter n={2} id="fs-qualities" title="מאפיינים איכותיים" lead="מה הופך מידע כספי לשימושי">
      <p>
        כדי שמידע כספי יהיה שימושי, הוא חייב להיות <Term he="רלוונטי" /> ולהציג <Term he="מצג נאמן" /> — אלה המאפיינים <strong>הבסיסיים</strong>. ארבעה מאפיינים{" "}
        <strong>משפרים</strong> מוסיפים לו, ואפשר להתפשר עליהם.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {tree.map(([root, leaves]) => (
          <Card key={root} title={`בסיסי: ${root}`}>
            <ul className="space-y-1.5">
              {leaves.map((l) => (
                <li key={l} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ←
                  </span>
                  {l}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {better.map(([t, d]) => (
          <div key={t} className="rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5">
            <p className="text-[14.5px] font-semibold text-fg">משפר: {t}</p>
            <p className="mt-0.5 text-[13.5px] text-fg/85">{d}</p>
          </div>
        ))}
      </div>
      <Callout title="אילוץ העלות">
        <p>דיווח עולה כסף — איסוף, עיבוד, אימות. התועלת מהמידע צריכה להיות גבוהה מהעלות לספק אותו.</p>
      </Callout>
      <SortQuiz
        prefix={P_}
        id="fs-qualities"
        title="איזה מאפיין נפגע — או בא לידי ביטוי?"
        options={[
          ["predictive", "ערך ניבוי"],
          ["confirm", "ערך אישור"],
          ["material", "מהותיות"],
          ["neutral", "ניטרליות"],
          ["complete", "שלמות"],
          ["comparable", "השוואה"],
          ["timely", "עיתוי נאות"],
          ["substance", "מהות על פני צורה"],
        ]}
        items={[
          { text: "החברה מחליפה את שיטת הפחת של המכונות כל שנה.", answer: "comparable", why: "בלי עקביות אי אפשר להשוות שנה לשנה." },
          { text: "הדוח השנתי פורסם שנה וחצי אחרי סוף השנה.", answer: "timely", why: "המידע הגיע מאוחר מכדי להשפיע על החלטות." },
          { text: "הלוואה גדולה מהבנק לא מופיעה בדוחות בכלל.", answer: "complete", why: "חסר מידע שהקורא צריך — המצג אינו שלם." },
          { text: "החברה מפרסמת תחזית הכנסות לרבעון הבא.", answer: "predictive", why: "המידע עוזר לחזות תוצאות עתידיות." },
          { text: "בסוף השנה החברה מדווחת שעמדה בתחזית שפרסמה.", answer: "confirm", why: "המידע מאשר הערכה קודמת." },
          { text: "ההנהלה בוחרת תמיד את ההנחות האופטימיות ביותר כדי שהרווח ייראה גבוה.", answer: "neutral", why: "הטיה מכוונת — המידע אינו ניטרלי." },
          { text: "טעות של 300 ₪ בחברה עם הכנסות של מיליארד — לא מתקנים.", answer: "material", why: "הטעות אינה מהותית: היא לא הייתה משנה אף החלטה." },
          { text: "חוזה שנקרא \"שכירות\" אבל בפועל החברה קונה את הנכס בתשלומים — מוצג כרכישה.", answer: "substance", why: "מציגים את המהות הכלכלית ולא את השם המשפטי." },
        ]}
      />
    </Chapter>
  );
}

function ConceptsChapter() {
  const c = CONCEPTS;
  return (
    <Chapter n={3} id="fs-concepts" title="מושגי המסגרת שמופיעים בדוחות" lead="חמישה רעיונות, כל אחד על מספר אחד מהדוחות">
      <p>
        כדי לראות את המושגים בעבודה, נשתמש בחברה קטנה: <strong>{c.company}</strong>. בכל מושג — מה הוא אומר, ואיך הוא נראה כשורה בדוח.
      </p>
      <Card title="1. עסק חי">
        <p>
          הדוחות מוכנים בהנחה שהחברה <Term he="עסק חי" />: היא תמשיך לפעול בעתיד הנראה לעין, ואין לה כוונה או צורך להתפרק. לכן הבניין שלה מוצג לפי מה שעלה לה, פחות
          פחת — ולא לפי כמה היו מקבלים עליו במכירה מהירה. אילו החברה הייתה עומדת להיסגר, הדוחות היו מוכנים על בסיס <Term he="עסק בחיסול" />.
        </p>
      </Card>
      <Card title="2. הכרה וערך בספרים">
        <p>
          <Term he="הכרה" /> היא הכללת פריט בדוח, במילים ובסכום. כשהחברה קנתה רכב ב-<Money v={c.vehicle.cost} />, היא הכירה בו כנכס. הסכום שבו הוא מוצג היום הוא{" "}
          <Term he="הערך בספרים" />:
        </p>
        <p className="rounded-lg bg-surface-2/60 px-3 py-2 text-[14.5px]">
          עלות <Money v={c.vehicle.cost} /> − פחת נצבר <Money v={c.vehicle.accumulated} /> = <strong>כלי רכב, נטו <Money v={c.vehicle.net} /></strong>
        </p>
      </Card>
      <Card title="3. גריעה">
        <p>
          <Term he="גריעה" /> היא הוצאת נכס מהדוח, כשהחברה מאבדת עליו שליטה. החברה מכרה מלגזה ישנה בערך בספרים של <Money v={c.disposal.carrying} /> תמורת{" "}
          <Money v={c.disposal.proceeds} />:
        </p>
        <p className="rounded-lg bg-surface-2/60 px-3 py-2 text-[14.5px]">
          תמורה <Money v={c.disposal.proceeds} /> − ערך בספרים <Money v={c.disposal.carrying} /> = <strong>רווח הון <Money v={c.disposal.gain} /></strong> — שורה
          בהכנסות התפעוליות האחרות.
        </p>
      </Card>
      <Card title="4. מדידה">
        <p>
          כל פריט נמדד לפי <Term he="בסיס מדידה" />. ב<strong>עלות היסטורית</strong> — לפי מחיר העסקה: הבניין של החברה מוצג לפי מה שעלה, <Money v={c.building} />, פחות
          פחת. ב<strong>שווי הוגן</strong> — לפי המחיר שהיה מתקבל במכירה בעסקה רגילה היום: אילו החברה הייתה מודדת את הקרקע שלה בשווי הוגן, הקרקע שנקנתה ב-
          <Money v={c.land.cost} /> הייתה מוצגת ב-<Money v={c.land.fairValue} />.
        </p>
      </Card>
      <Card title="5. סיווג וצבירה">
        <p>
          <Term he="סיווג" />: מקבצים פריטים דומים ומפרידים שונים. <Term he="צבירה" />: מחברים את הפריטים שבאותו סיווג לשורה אחת — בלי פירוט מיותר, ובלי לחבר יותר
          מדי. לחברה שלושה חשבונות בנק:
        </p>
        <p className="rounded-lg bg-surface-2/60 px-3 py-2 text-[14.5px]">
          {c.banks.each.map((v, i) => (
            <span key={i}>
              {i > 0 && " + "}
              <Money v={v} plain />
            </span>
          ))}{" "}
          = <strong>מזומנים ושווי מזומנים <Money v={c.banks.total} /></strong> — שורה אחת בדוח.
        </p>
        <p>זה כל העבודה של הכנת הדוחות: עשרות יתרות במאזן הבוחן מתקבצות לשורות מעטות וברורות.</p>
      </Card>
      <Card title="ההגדרות הרשמיות — שורה לכל רכיב">
        <ul className="space-y-1.5 text-[14.5px]">
          <li>
            <strong>נכס:</strong> משאב כלכלי בהווה שבשליטת הישות, כתוצאה מאירוע בעבר.
          </li>
          <li>
            <strong>התחייבות:</strong> מחויבות בהווה של הישות להעביר משאב כלכלי, כתוצאה מאירוע בעבר.
          </li>
          <li>
            <strong>הון:</strong> הזכות השיורית בנכסים, אחרי ניכוי כל ההתחייבויות.
          </li>
          <li>
            <strong>הכנסות:</strong> גידול בנכסים או קיטון בהתחייבויות שמגדיל את ההון — לא מהשקעת בעלים.
          </li>
          <li>
            <strong>הוצאות:</strong> קיטון בנכסים או גידול בהתחייבויות שמקטין את ההון — לא מחלוקה לבעלים.
          </li>
        </ul>
        <p className="text-sm text-muted">
          את חמשת הסוגים עצמם כבר הכרתם —{" "}
          <Link href={screenHref("types")} className={linkClass}>
            חמשת סוגי החשבונות
          </Link>
          .
        </p>
      </Card>
    </Chapter>
  );
}

// ---------------------------------------------------------------------------
// Part B — IFRS 18: how the statements are built.

function SetChapter() {
  const set: [string, string, boolean][] = [
    ["דוח על המצב הכספי (מאזן)", "נכסים, התחייבויות והון — ליום מסוים.", true],
    ["דוח על רווח או הפסד ורווח כולל אחר", "הכנסות והוצאות לתקופה, ומתחתן פריטים שלא עוברים ברווח או הפסד.", true],
    ["דוח על השינויים בהון", "", false],
    ["דוח על תזרימי המזומנים", "", false],
    ["ביאורים", "מדיניות חשבונאית מהותית ומידע מסביר — למשל פירוט השורות שמורכבות מכמה חלקים.", true],
  ];
  return (
    <Chapter n={4} id="fs-set" title="מערכת שלמה של דוחות כספיים" lead="IFRS 18 — חמישה רכיבים, ונתוני השוואה">
      <p>
        ההצגה והגילוי מוסדרים ב-<Term he="IFRS 18" />, שפורסם באפריל 2024 ויחליף את IAS 1 לתקופות שמתחילות ב-1 בינואר 2027 ואילך. מערכת שלמה:
      </p>
      <ol className="space-y-2">
        {set.map(([t, d, inCourse], i) => (
          <li key={t} className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${inCourse ? "border-line bg-surface" : "border-dashed border-line bg-surface-2/30 text-muted"}`}>
            <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">{i + 1}</span>
            <span>
              <span className="font-semibold text-fg">{t}</span>
              {!inCourse && <span className="ms-2 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs">לא בסמסטר זה</span>}
              {d && <span className="block text-[14px]">{d}</span>}
            </span>
          </li>
        ))}
      </ol>
      <Rule>נתוני השוואה: במאזן — גם השנה הקודמת. ברווח או הפסד — לפחות שנה קודמת אחת; בחברות ציבוריות — שתיים.</Rule>
      <p>
        בשני הפרקים הבאים נקרא את שני הדוחות של <strong>{NOF.company}</strong> — קודם את הדוח כולו, כמו שהוא מתפרסם, ואחר כך כל שורה בו: מה נכנס אליה, איך
        מחשבים אותה, ולמה היא יושבת דווקא שם.
      </p>
    </Chapter>
  );
}

function SofpChapter() {
  return (
    <Chapter n={5} id="fs-sofp" title="הדוח על המצב הכספי" lead="הדוח כולו, ואז כל שורה בו">
      <p>
        דוח <strong>ליום</strong> מסוים — בקורס 31 בדצמבר — עם השנה הקודמת לצידו. בצד אחד הנכסים, בצד השני ההתחייבויות וההון, ותמיד:{" "}
        <strong>סך הנכסים = סך ההתחייבויות + ההון.</strong>
      </p>
      <Rule>שוטף או בלתי שוטף? האם הנכס יתממש — או ההתחייבות תיפרע — בתוך 12 חודשים מתאריך המאזן. כן — שוטף. לא — בלתי שוטף.</Rule>
      <p>שלושה דברים לשים לב אליהם בדוח: הסדר (שוטף לפני בלתי שוטף), ההצגה בנטו (לקוחות ורכוש קבוע אחרי מה שמקטין אותם), והצבירה (יתרות קטנות מאוחדות לשורה אחת עם ביאור).</p>
      <StatementWithLines st={NOF.sofp} anchor="nof-sofp" />
      <p>
        הלוואה שנפרעת בתשלומים מתפצלת לשתי שורות: מה שנפרע בתוך 12 חודשים — <Term he="חלויות שוטפות" />, בהתחייבויות השוטפות; השאר — בבלתי שוטפות. נסו:
      </p>
      <LoanSplitter />
      <SortQuiz
        prefix={P_}
        id="fs-sofp"
        title="שוטף או בלתי שוטף?"
        options={[
          ["c", "שוטף"],
          ["n", "בלתי שוטף"],
        ]}
        items={[
          { text: "לקוחות שישלמו בעוד 60 יום.", answer: "c", why: "יתממשו בתוך 12 חודשים." },
          { text: "מבנה שהחברה משתמשת בו.", answer: "n", why: "רכוש קבוע — משמש שנים רבות." },
          { text: "החלק של ההלוואה שנפרע בשנה הקרובה.", answer: "c", why: "חלויות שוטפות — ייפרעו בתוך 12 חודשים." },
          { text: "יתרת ההלוואה שנפרעת בעוד 3 שנים.", answer: "n", why: "תיפרע אחרי 12 חודשים." },
          { text: "שכר דירה ששולם מראש ל-6 החודשים הבאים.", answer: "c", why: "ינוצל בתוך 12 חודשים." },
          { text: "מקדמה שהתקבלה מלקוח על משלוח בחודש הבא.", answer: "c", why: "התחייבות שתסולק בתוך 12 חודשים — זכאים ויתרות זכות." },
        ]}
      />
    </Chapter>
  );
}

function PlChapter() {
  return (
    <Chapter n={6} id="fs-pl" title="דוח רווח או הפסד לפי IFRS 18" lead="הדוח כולו, ואז כל שורה בו — וכל קטגוריה">
      <p>
        דוח <strong>לתקופה</strong> — בקורס, השנה שהסתיימה ב-31 בדצמבר — עם שנה קודמת לפחות. IFRS 18 מחלק את החלק של רווח או הפסד ל<strong>שלוש קטגוריות</strong>,
        ומחייב <strong>שני סיכומי ביניים</strong>:
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <Card title="תפעולית">
          <p>
            הקטגוריה <strong>השיורית</strong>: כל מה שלא שייך לאחרות. הפעילות העיקרית ופעילויות תומכות. רכוש קבוע נשאר כאן — פחת, ורווח או הפסד הון מגריעה.
          </p>
        </Card>
        <Card title="השקעה">
          <p>תשואה על נכסים שעומדים בפני עצמם: ריבית מפיקדונות ומהלוואות שניתנו. בקורס &quot;הכנסות מימון&quot; נמצאות כאן.</p>
        </Card>
        <Card title="מימון">
          <p>הכנסות והוצאות מגיוס חוב והון: ריבית על הלוואות, עמלות בנק ודמי ניהול חשבון.</p>
        </Card>
      </div>
      <Rule>שני סיכומי הביניים החובה: רווח תפעולי, ורווח לפני מימון ומסים על הכנסה. מסים על הכנסה ופעילויות שהופסקו — לא בסמסטר זה, ולכן בקורס הרווח הנקי שווה לרווח לפני מסים.</Rule>
      <StatementWithLines st={NOF.pl} anchor="nof-pl" />
      <Callout title="פעילות עסקית עיקרית מוגדרת — ברמה התיאורטית">
        <p>
          חברה שהפעילות העיקרית שלה היא השקעה או מימון (למשל בנק) מסווגת חלק מאותן הכנסות והוצאות לתפעולית. בקורס עוסקים בחברות שמוכרות מוצרים או שירותים — בלי
          פעילות כזו.
        </p>
      </Callout>
      <SortQuiz
        prefix={P_}
        id="fs-pl"
        title="לאיזו קטגוריה?"
        options={[
          ["o", "תפעולית"],
          ["i", "השקעה"],
          ["f", "מימון"],
        ]}
        items={[
          { text: "עמלות בנק ודמי ניהול חשבון.", answer: "f", why: "עלות של גיוס ושירותי מימון." },
          { text: "ריבית על הלוואה מהבנק.", answer: "f", why: "עלות גיוס חוב." },
          { text: "ריבית שהתקבלה מפיקדון.", answer: "i", why: "תשואה על נכס שעומד בפני עצמו." },
          { text: "פחת מכונת ייצור.", answer: "o", why: "רכוש קבוע נשאר בתפעולית." },
          { text: "רווח הון ממכירת משאית.", answer: "o", why: "גריעת רכוש קבוע — הכנסות תפעוליות אחרות." },
          { text: "הוצאות פרסום.", answer: "o", why: "מכירה ושיווק — תפעולית." },
          { text: "שכר עובדי ההנהלה.", answer: "o", why: "הנהלה וכלליות — תפעולית." },
          { text: "הוצאות הפרשה להפסדי אשראי.", answer: "o", why: "בקורס — הנהלה וכלליות." },
          { text: "ריבית שהתקבלה מהלוואה שהחברה נתנה.", answer: "i", why: "תשואה על נכס שעומד בפני עצמו." },
          { text: "הכנסות ממכירות.", answer: "o", why: "הפעילות העסקית העיקרית." },
        ]}
      />
    </Chapter>
  );
}

function FunctionChapter() {
  return (
    <Chapter n={7} id="fs-function" title="סיווג הוצאות לפי מאפיין פעילות" lead="לא &quot;מה זה&quot; אלא &quot;בשביל מי&quot; — ואיך מחלקים הוצאה בין קבוצות">
      <p>
        בקטגוריה התפעולית אפשר להציג הוצאות <Term he="לפי מהות" /> (פחת, שכר, רכישות) או <Term he="לפי מאפיין פעילות" /> (עלות המכר, מכירה ושיווק, הנהלה וכלליות).{" "}
        <strong>בקורס: לפי מאפיין פעילות.</strong> הפירוט לפי מהות עובר לביאורים.
      </p>
      <DataTable
        caption="מה נכנס לכל קבוצה"
        head={["קבוצה", "דוגמאות"]}
        rows={[
          ["מכירה ושיווק", "עמלות סוכנים, פרסום, קידום מכירות, פחת של נכסי מחלקת המכירות"],
          ["מחקר ופיתוח", "שכר, פחת ציוד, חומרי גלם וחשמל של המו״פ"],
          ["הנהלה וכלליות", "שכר הנהלה, פחת נכסי ההנהלה, שכירות ההנהלה, הוצאות הפרשה להפסדי אשראי, הוצאות משפטיות"],
          ["תפעוליות אחרות", "מחוץ לפעילות הרגילה — רווחי והפסדי הון"],
        ]}
      />
      <Card title="הנתונים הנוספים של היובל">
        <ol className="list-inside list-decimal space-y-1 text-[14.5px]">
          {HAYUVAL.facts.slice(0, 3).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
        <p className="text-sm text-muted">פרסום — 100% מכירה ושיווק מטבעו. הוצאות הפסדי אשראי — 100% הנהלה (הגדרת הקורס). כל השאר — הכלל הכללי 40% / 60%.</p>
      </Card>
      <AllocationDrill q={HAYUVAL} />
      <Rule>
        התוצאה: הנהלה וכלליות <Money v={S.pl.admin} />, מכירה ושיווק <Money v={S.pl.selling} /> — יחד <Money v={S.pl.admin + S.pl.selling} />, בדיוק סך שתים-עשרה ההוצאות.
      </Rule>
    </Chapter>
  );
}

function OciChapter() {
  return (
    <Chapter n={8} id="fs-oci" title="החלק של רווח כולל אחר" lead="איפה הוא יושב בדוח — ולמה לא סופרים אותו פעמיים">
      <p>
        מתחת לרווח הנקי מגיע <Term he="רווח כולל אחר" />: פריטים שלא מוכרים ברווח או הפסד, לעולם או בשלב זה. הם מחולקים ל&quot;פריטים שלא יסווגו מחדש לאחר מכן
        לרווח או הפסד&quot; — כמו הערכה מחדש של רכוש קבוע — ו&quot;פריטים שייתכן ויסווגו&quot;. ובסוף:
      </p>
      <Rule>סך רווח כולל = רווח נקי + רווח כולל אחר</Rule>
      <p>
        ב{NOF.company} זה נראה כך: בדוח רווח או הפסד, מתחת לרווח הנקי, השורה &quot;הערכה מחדש של רכוש קבוע&quot; — תנועת השנה. ובדוח על המצב הכספי, באותו סכום,
        קרן ההערכה מחדש בתוך &quot;קרנות הון&quot; — היתרה שנצברה. שתי הפנים של אותה עלייה בערך: האחת מספרת מה קרה השנה, השנייה מה יש בהון בסוף השנה.
      </p>
      <p>
        איך נוצרת ההערכה מחדש עצמה —{" "}
        <Link href="/basics/ias16#revaluation" className={linkClass}>
          במדריך רכוש קבוע
        </Link>
        . כאן רק ההצגה.
      </p>
      <Callout kind="warn" title="אותם 30 אלף בשני תפקידים">
        <p>
          במאזן הבוחן של היובל יש גם &quot;קרן הערכה מחדש&quot; <Money v={amount("קרן הערכה מחדש - מדפסת תלת מימד")} /> וגם &quot;רווח כולל אחר בגין הערכה מחדש&quot;{" "}
          <Money v={amount("רווח כולל אחר בגין הערכה מחדש של רכוש קבוע")} />. הקרן נוצרה השנה, ולכן זה אותו סכום: <strong>תנועת השנה</strong> בדוח על הרווח הכולל,
          ו<strong>יתרה בהון</strong> במאזן. בדיוק כמו מלאי סגירה מאזני ומלאי סגירה רווח והפסד — לא סופרים פעמיים.
        </p>
      </Callout>
      <MiniQuiz
        prefix={P_}
        chapter="fs-oci"
        items={[
          {
            q: "איפה מוצגת עליית ערך מהערכה מחדש של מבנה?",
            options: ["בהכנסות התפעוליות", "ברווח כולל אחר, מתחת לרווח הנקי", "בהכנסות מימון"],
            answer: 1,
            why: "הערכה מחדש לא עוברת ברווח או הפסד — היא רווח כולל אחר.",
          },
          {
            q: "רווח נקי 1,000, רווח כולל אחר 200. מהו סך הרווח הכולל?",
            options: ["1,000", "1,200", "800"],
            answer: 1,
            why: "סך רווח כולל = רווח נקי + רווח כולל אחר.",
          },
        ]}
      />
    </Chapter>
  );
}

// ---------------------------------------------------------------------------
// Part C — the full question.

const tbRows = HAYUVAL.accounts.map((a) => [a.name, a.side === "dr" ? a.amount : "", a.side === "cr" ? a.amount : ""] as (string | number)[]);

function ExamChapter() {
  const by = (pred: (a: (typeof HAYUVAL.accounts)[number]) => boolean) => HAYUVAL.accounts.filter(pred).map((a) => a.name);
  const sofpIds = new Set(HAYUVAL.sofp.map((l) => l.id));
  const plIds = new Set<string>(PL_LINES.map((l) => l.id));
  const steps = [
    {
      title: "קוראים את הנתונים הנוספים קודם",
      handles: [],
      body: (
        <>
          <p>לפני שנוגעים במאזן הבוחן — קוראים מה עוד נתון. הם קובעים את החלוקה ואת הפיצול:</p>
          <ol className="list-inside list-decimal space-y-1">
            {HAYUVAL.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
          <p>מנתון 4: ההלוואה נלקחה ביום המאזן — ולכן אין עליה הוצאות ריבית השנה.</p>
        </>
      ),
    },
    {
      title: "מסמנים לכל יתרה לאן היא הולכת",
      handles: by((a) => sofpIds.has(a.dest) || plIds.has(a.dest) || a.dest === "oci"),
      body: (
        <p>
          מאזן, רווח והפסד, או רווח כולל אחר. רוב היתרות פשוטות: מזומן, ספקים, הכנסות… <strong>הכנסה ממכירות → רווח והפסד; מזומן → מאזן; רווח כולל אחר → מתחת לרווח הנקי.</strong>
        </p>
      ),
    },
    {
      title: "מאחדים חשבונות מקזזים לשורות נטו",
      handles: by((a) => a.dest === NET && a.into !== "cogs"),
      body: (
        <ul className="space-y-1">
          <li>
            לקוחות, נטו = <Money v={amount("לקוחות")} /> − <Money v={amount("הפרשה להפסדי אשראי חזויים")} /> = <Money v={S.sofp.receivables} />
          </li>
          <li>
            כלי רכב, נטו = <Money v={S.sofp.vehicles} />; מבנה, נטו = <Money v={S.sofp.building} />
          </li>
        </ul>
      ),
    },
    {
      title: "מפצלים לשוטף ולא שוטף — כולל חלויות שוטפות",
      handles: by((a) => a.dest === "split"),
      body: (
        <p>
          ההלוואה: 4 תשלומים שווים, הראשון בעוד שנה. חלויות שוטפות <Money v={S.sofp.currentLoan} /> (שוטף), הלוואה לזמן ארוך <Money v={S.sofp.longLoan} /> (בלתי שוטף).
        </p>
      ),
    },
    {
      title: "עלות המכר",
      handles: ["מלאי סגירה רווח והפסד"],
      body: (
        <p>
          מלאי פתיחה <Money v={amount("מלאי פתיחה")} /> + קניות <Money v={amount("קניות")} /> − מלאי סגירה <Money v={amount("מלאי סגירה רווח והפסד")} /> ={" "}
          <strong>
            <Money v={S.pl.cogs} />
          </strong>
          . &quot;מלאי סגירה רווח והפסד&quot; אינו שורת הכנסה — הוא מקטין את עלות המכר. &quot;מלאי סגירה מאזן&quot; הוא המלאי במאזן.
        </p>
      ),
    },
    {
      title: "טבלת החלוקה ושיבוץ לקטגוריות",
      handles: by((a) => a.dest === "allocate"),
      body: (
        <>
          <DataTable
            head={["הוצאה", "סכום", "% הנהלה", "הנהלה וכלליות", "% מכירה", "מכירה ושיווק"]}
            rows={S.alloc.map((r) => [r.name, r.amount, `${Math.round(r.adminPct * 100)}%`, r.admin, `${Math.round(r.sellingPct * 100)}%`, r.selling])}
            foot={["סה״כ", S.alloc.reduce((t, r) => t + r.amount, 0), "", S.pl.admin, "", S.pl.selling]}
          />
          <p>
            רווח הון ממכירת כלי רכב → הכנסות תפעוליות אחרות. עמלות בנק → הוצאות מימון. אין הכנסות מקטגוריית השקעה, ולכן רווח לפני מימון ומסים = רווח תפעולי.
          </p>
        </>
      ),
    },
    {
      title: "רווח והפסד ורווח כולל, ואז העודפים כהפרש — ובדיקה",
      handles: by((a) => a.ociTwin === true),
      body: (
        <>
          <p>
            רווח נקי <Money v={S.netProfit} />, רווח כולל אחר <Money v={S.oci} />, סך רווח כולל <Money v={S.totalComprehensive} />.
          </p>
          <p>
            כמו שלמדתם, העודפים הם הנעלם (
            <Link href={screenHref("trial")} className={linkClass}>
              מאזן בוחן
            </Link>
            ). כאן: סה&quot;כ נכסים <Money v={S.totalAssets} /> − שוטפות <Money v={S.totals.cl} /> − בלתי שוטפות <Money v={S.totals.ncl} /> − הון מניות{" "}
            <Money v={S.sofp.capital} /> − קרן <Money v={S.sofp.reserve} /> = <strong><Money v={S.retained} /></strong>.
          </p>
          <Callout kind="check" title="להעמקה: הבדיקה דרך עודפי הפתיחה">
            <p>
              סך החובה במאזן הבוחן <Money v={debits(HAYUVAL)} /> פחות סך הזכות בלי הקרן (הכפולה של רווח כולל אחר) <Money v={credits(HAYUVAL, false)} /> = עודפי
              פתיחה <Money v={S.openingRetained} />. ועוד הרווח הנקי <Money v={S.netProfit} /> ={" "}
              <Money v={S.retained} /> ✓. סכימה &quot;תמימה&quot; של היתרות לא יוצאת מאוזנת משתי סיבות: הקרן נספרת פעמיים, והעודפים חסרים.
            </p>
          </Callout>
        </>
      ),
    },
  ];
  return (
    <Chapter n={9} id="fs-exam" title="שאלה מלאה: חברת היובל בע״מ" lead="ממאזן בוחן סופי לשני דוחות — בשבעה צעדים">
      <p>
        לפניכם מאזן הבוחן של {HAYUVAL.company} ליום {HAYUVAL.date}, <strong>לאחר פקודות התאמה וחתך</strong>, עם הצדדים מסומנים. נדרש: (1) דוח על המצב הכספי ליום{" "}
        {HAYUVAL.date}; (2) דוח על הרווח או הפסד ורווח כולל אחר לשנה שהסתיימה בו.
      </p>
      <DataTable caption={`מאזן בוחן ליום ${HAYUVAL.date}`} head={["סעיף", "חובה", "זכות"]} rows={tbRows} />
      <p className="font-semibold text-fg">שגרת פתרון בשבעה צעדים — לכל שאלה כזו:</p>
      <ol className="grid gap-2 md:grid-cols-2">
        {(
          [
            ["קוראים את הנתונים הנוספים קודם", ClipboardList],
            ["מסמנים לכל יתרה לאן היא הולכת", ListChecks],
            ["מאחדים חשבונות מקזזים לשורות נטו", Layers],
            ["מפצלים לשוטף ולא שוטף, כולל חלויות שוטפות", Split],
            ["עלות המכר", Calculator],
            ["טבלת החלוקה ושיבוץ לקטגוריות", Table2],
            ["רווח והפסד ורווח כולל, ואז העודפים כהפרש — ובדיקה", Scale],
          ] as const
        ).map(([t, Icon], i) => (
          <li key={t} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14.5px] font-medium text-fg">
            <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">{i + 1}</span>
            <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            {t}
          </li>
        ))}
      </ol>
      <p>עכשיו הפתרון — צעד אחר צעד. נסו כל צעד לבד, ורק אז פתחו אותו. משמאל: כל יתרה שכבר טופלה מסומנת ✓.</p>
      <StepReveal q={HAYUVAL} steps={steps} />
      <p className="text-[16px] font-semibold text-fg">הפתרון: שני הדוחות, וכל שורה — מאילו יתרות במאזן הבוחן היא נבנתה</p>
      <StatementWithLines st={SOLVED.sofp} anchor="hy-sofp" />
      <Callout title="לפי המבנה הכללי של הקורס">
        <p>
          בפתרון של המרצה &quot;הוצאות שכר דירה מראש&quot; ו&quot;הוצאות טלפון לשלם&quot; הן שורות נפרדות. לפי המבנה הכללי הן שייכות לקבוצות: חייבים ויתרות חובה{" "}
          <Money v={S.sofp.debtors + S.sofp.prepaid} /> ({<Money v={S.sofp.debtors} plain />} + {<Money v={S.sofp.prepaid} plain />}), וזכאים ויתרות זכות{" "}
          <Money v={S.sofp.creditors + S.sofp.accrued} /> ({<Money v={S.sofp.creditors} plain />} + {<Money v={S.sofp.accrued} plain />}). ואפשר גם לאחד את שלושת פריטי
          הרכוש הקבוע לשורה אחת — רכוש קבוע, נטו <Money v={S.totals.nca} /> — עם פירוט בביאור.
        </p>
      </Callout>
      <StatementWithLines st={SOLVED.pl} anchor="hy-pl" />

      <div id="fs-builder" className="scroll-mt-32 space-y-3 pt-4">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-fg">
          <FileSpreadsheet className="h-5 w-5 text-accent" aria-hidden /> בונה הדוחות
        </h3>
        <p>
          עכשיו לבד: לכל יתרה בחרו לאן היא הולכת. משמאל שני הדוחות נבנים תוך כדי. העודפים מחושבים מעודפי הפתיחה ועוד הרווח הנקי שלכם — אז כל טעות בין המאזן לרווח
          והפסד מופיעה כפער.
        </p>
        <StatementsBuilder q={HAYUVAL} />
      </div>
    </Chapter>
  );
}

function PracticeChapter() {
  return (
    <Chapter n={10} id="fs-practice" title="תרגול" lead="שאלה שנייה ברמת מבחן, ועוד שאלות קצרות">
      <p>
        {ALON.company} — חברה בדויה. מאזן הבוחן ליום {ALON.date}, <strong>אחרי התאמות</strong>, עם הצדדים מסומנים. יש בו מה שלא היה ביובל: ריבית מפיקדון, ריבית על
        הלוואה, משיכת יתר, מקדמות, הכנסות מראש ולקבל, מו&quot;פ והפסד הון. ערכו את שני הדוחות.
      </p>
      <Card title="נתונים נוספים">
        <ol className="list-inside list-decimal space-y-1 text-[14.5px]">
          {ALON.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </Card>
      <StatementsBuilder q={ALON} />
      <p className="font-semibold text-fg">או בדקו רק את התוצאות:</p>
      <AnswerCheck
        answers={[
          { label: "סה״כ נכסים שוטפים", value: P.totals.ca, kind: "amount" },
          { label: "רווח גולמי", value: P.grossProfit, kind: "amount" },
          { label: "רווח תפעולי", value: P.operatingProfit, kind: "amount" },
          { label: "רווח לפני מימון ומסים", value: P.beforeFinancing, kind: "amount" },
          { label: "רווח נקי", value: P.netProfit, kind: "amount" },
          { label: "סה״כ הון", value: P.totals.eq, kind: "amount" },
          { label: "עודפים", value: P.retained, kind: "amount" },
        ]}
      />
      <MiniQuiz
        prefix={P_}
        chapter="fs-practice"
        items={[
          { q: "IFRS 18 מחליף את —", options: ["IAS 1", "IAS 16", "IFRS 16"], answer: 0, why: "IFRS 18 מחליף את IAS 1, הצגת דוחות כספיים, מ-2027." },
          { q: "מה מהבאים הוא סיכום ביניים חובה לפי IFRS 18?", options: ["רווח גולמי", "רווח תפעולי", "רווח לפני מסים"], answer: 1, why: "שני החובה: רווח תפעולי, ורווח לפני מימון ומסים על הכנסה." },
          { q: "לאיזו קטגוריה הולך הפסד הון ממכירת מכונה?", options: ["תפעולית", "השקעה", "מימון"], answer: 0, why: "רכוש קבוע נשאר בתפעולית — הוצאות תפעוליות אחרות." },
          { q: "משיכת יתר בבנק מוצגת ב —", options: ["אשראי מתאגידים בנקאיים", "זכאים ויתרות זכות", "מזומנים, בקיזוז"], answer: 0, why: "אשראי מתאגידים בנקאיים כולל משיכת יתר." },
          { q: "הכנסות מראש מוצגות ב —", options: ["חייבים ויתרות חובה", "זכאים ויתרות זכות", "הכנסות"], answer: 1, why: "התחייבות — הכסף התקבל לפני שהשירות ניתן." },
          { q: "המסגרת המושגית —", options: ["גוברת על תקן", "אינה תקן", "חלה רק על חברות פרטיות"], answer: 1, why: "המסגרת אינה תקן; בסתירה התקן גובר." },
          { q: "באיזה בסיס נמדד מבנה במודל העלות?", options: ["עלות היסטורית", "שווי הוגן", "שווי מימוש"], answer: 0, why: "מודל העלות — עלות היסטורית פחות פחת." },
          { q: "החברה צפויה להתפרק בשנה הקרובה. על איזה בסיס יוכנו הדוחות?", options: ["עסק חי", "עסק בחיסול", "אין שינוי"], answer: 1, why: "כשיש כוונה או צורך להפסיק — לא עסק חי." },
          { q: "בקורס, איך מוצגות ההוצאות בקטגוריה התפעולית?", options: ["לפי מהות", "לפי מאפיין פעילות", "לפי סדר א״ב"], answer: 1, why: "לפי מאפיין פעילות; הפירוט לפי מהות — בביאורים." },
        ]}
      />
    </Chapter>
  );
}

function SummaryChapter() {
  const mistakes: [string, string][] = [
    ["הפרשה או פחת נצבר כשורה נפרדת", "מציגים לקוחות, נטו ורכוש קבוע, נטו"],
    ["שוכחים את החלות השוטפת", "החלק שנפרע בתוך 12 חודשים — להתחייבויות השוטפות"],
    ["עמלות בנק בהנהלה וכלליות", "עמלות בנק — הוצאות מימון"],
    ["רווח הון בהכנסות מימון", "רווח הון — הכנסות תפעוליות אחרות"],
    ["סופרים את הקרן פעמיים", "קרן במאזן, אותו סכום כרווח כולל אחר בדוח — לא מחברים"],
    ["\"מלאי סגירה רווח והפסד\" כשורת הכנסה", "הוא מקטין את עלות המכר"],
    ["הצגה לפי מהות", "בקורס — לפי מאפיין פעילות"],
    ["קרן הערכה מחדש ברווח והפסד", "קרן — בהון; התנועה — ברווח כולל אחר"],
    ["שוכחים את סיכומי הביניים החובה", "רווח תפעולי, ורווח לפני מימון ומסים"],
  ];
  return (
    <Chapter n={11} id="fs-summary" title="סיכום" lead="גיליון עזר להדפסה — רק על ההצגה">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="הדוח על המצב הכספי">
          <ul className="space-y-1 text-[14.5px]">
            <li>נכסים שוטפים · נכסים בלתי שוטפים = סה&quot;כ נכסים</li>
            <li>התחייבויות שוטפות · בלתי שוטפות · הון = סה&quot;כ התחייבויות והון</li>
            <li>שוטף = יתממש או ייפרע בתוך 12 חודשים מתאריך המאזן</li>
            <li>חייבים ויתרות חובה ← מקדמות לספקים, הוצאות מראש, הכנסות לקבל</li>
            <li>זכאים ויתרות זכות ← מקדמות מלקוחות, הוצאות לשלם, הכנסות מראש</li>
            <li>אשראי מתאגידים בנקאיים ← משיכת יתר, חלויות שוטפות</li>
            <li>קרנות הון ← קרן הערכה מחדש</li>
          </ul>
        </Card>
        <Card title="דוח רווח או הפסד ורווח כולל אחר">
          <ul className="space-y-1 text-[14.5px]">
            <li>הכנסות − עלות המכר = רווח גולמי</li>
            <li>− מכירה ושיווק − מו&quot;פ − הנהלה ± אחרות = <strong>רווח תפעולי</strong></li>
            <li>± השקעה = <strong>רווח לפני מימון ומסים</strong></li>
            <li>− מימון = רווח לפני מסים = רווח נקי (בקורס)</li>
            <li>+ רווח כולל אחר = סך רווח כולל</li>
          </ul>
        </Card>
      </div>
      <Card title="מאפיינים איכותיים — בשורה">
        <p>בסיסיים: רלוונטיות (ניבוי, אישור, מהותיות) ומצג נאמן (שלם, ניטרלי, נטול טעויות). משפרים: השוואה, אימות, עיתוי, מובנות. אילוץ: עלות.</p>
      </Card>
      <DataTable caption="טעויות נפוצות בהרכבת דוחות" head={["✗ הטעות", "✓ הנכון"]} rows={mistakes} />
      <Link
        href={screenHref("reports")}
        className="group flex items-center gap-4 rounded-xl border-2 border-accent bg-accent-soft px-5 py-4 transition-colors hover:bg-accent-soft/70"
      >
        <BookOpenCheck className="h-6 w-6 shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1 text-[15px] font-semibold text-fg">לשיעור בחשבונאות מאפס — מאזני מול תוצאתי, והדוחות</span>
        <ArrowLeft className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-x-1" aria-hidden />
      </Link>
    </Chapter>
  );
}

/** The page's chapters, in order; `part` splits off the first (the free taste) from the rest. */
export function StatementsChapters({ part }: { part?: "first" | "rest" }) {
  if (part === "first") return <FrameworkChapter />;
  return (
    <>
      {part !== "rest" && <FrameworkChapter />}
      <QualitiesChapter />
      <ConceptsChapter />
      <SetChapter />
      <SofpChapter />
      <PlChapter />
      <FunctionChapter />
      <OciChapter />
      <ExamChapter />
      <PracticeChapter />
      <SummaryChapter />
    </>
  );
}

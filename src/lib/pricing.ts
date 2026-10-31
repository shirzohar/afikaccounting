/**
 * The site's plans: the one source the pricing page, the home page and every
 * paywall read. Plain data, so it ships to the browser with the paywall.
 */

export type Tier = "free" | "courses" | "exams";

/** Each tier includes everything below it. */
export const TIER_ORDER: Tier[] = ["free", "courses", "exams"];

export type Plan = {
  tier: Tier;
  name: string;
  /** One line under the name. */
  description: string;
  /** What the plan gives, a few words each; each plan's list starts from the plan before it. */
  includes: string[];
  /** Monthly price in shekels; 0 is free. */
  monthly: number;
  /** Yearly price in shekels, when the plan has one. */
  yearly?: number;
  /** The plan the pricing page leads with. */
  featured?: boolean;
};

// ⚠️ PLACEHOLDER PRICES — the owner sets the real ones. Every price on the site
// is read from here; flip PRICES_ARE_FINAL to true once they are set, and the
// "prices are not final yet" note disappears from the pricing page, the home page and the paywall.
export const PRICES_ARE_FINAL = false;

export const PLANS: Plan[] = [
  {
    tier: "free",
    name: "חינם",
    description: "הקורס המלא שמתחילים ממנו — בלי כרטיס אשראי",
    includes: ["חשבונאות מאפס: 6 שיעורים מלאים", "תרגול עם משוב מיידי ומלכודות", "סרטונים, סיכומים וטיפים למבחן", "השיעור הראשון בכל קורס מתקדם"],
    monthly: 0,
  },
  {
    tier: "courses",
    name: "קורסים",
    description: "כל הקורסים המתקדמים, עד רמת מבחן",
    includes: ["כל מה שבחינם", "מלאי (IAS 2) — כל 6 השיעורים", "רכוש קבוע (IAS 16) — כל הפרקים", "הצגת דוחות כספיים — כל הפרקים", "מחשבונים שמראים את כל הדרך"],
    monthly: 49, // PLACEHOLDER
    yearly: 390, // PLACEHOLDER
    featured: true,
  },
  {
    tier: "exams",
    name: "קורסים + מבחנים",
    description: "הכול, ועוד מתחם המבחנים",
    includes: ["כל מה שבקורסים", "פתרונות מלאים מאפס לתרגילים ברמת מבחן", "ארכיון מבחנים עם פתרונות", "גישה ראשונה לכל מבחן חדש"],
    monthly: 89, // PLACEHOLDER
    yearly: 690, // PLACEHOLDER
  },
];

export const planOf = (tier: Tier) => PLANS.find((p) => p.tier === tier)!;

export const isTier = (v: unknown): v is Tier => TIER_ORDER.includes(v as Tier);

/** Whether a reader on `have` gets what `need` gives. */
export const tierAllows = (have: Tier, need: Tier) => TIER_ORDER.indexOf(have) >= TIER_ORDER.indexOf(need);

/** "₪49 לחודש", or "חינם". */
export const priceLabel = (p: Plan) => (p.monthly === 0 ? "חינם" : `₪${p.monthly} לחודש`);

/** The plans page, with a plan raised; `from` is where the reader came from (a locked lesson), to send them back after paying. */
export const planHref = (tier: Tier, from?: string) => `/pricing?plan=${tier}${from ? `&from=${encodeURIComponent(from)}` : ""}`;
/** Payments off: a plan's "choose" button signs the reader up with the plan noted. */
export const signupHref = (tier: Tier) => `/register?plan=${tier}`;
/** Payments on: a plan's "choose" button starts the checkout. */
export const checkoutHref = (tier: Tier, interval: "month" | "year" = "month", from?: string) =>
  `/checkout?plan=${tier}&interval=${interval}${from ? `&from=${encodeURIComponent(from)}` : ""}`;

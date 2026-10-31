import "server-only";
import type { ArticleSection, Chapter, ContentKind, Level, Resource } from "@/lib/content/types";
import type { Values } from "@/lib/engine/types";
import { effectiveTier } from "@/lib/access";
import { parseBlocks, parseSteps } from "@/lib/exams/parse";
import type { ExamBlock, ExamMeta, SolutionStep } from "@/lib/exams/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads. They run as the signed-in user, so the database's admin policies
 * (`public.is_admin()`) decide what comes back; pages also call requireAdmin().
 */

/** Postgres / PostgREST codes for "this table or function doesn't exist yet". */
const MISSING = new Set(["42P01", "42883", "PGRST202", "PGRST205"]);
export class SetupRequiredError extends Error {}
function check<T>(res: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (res.error) {
    if (res.error.code && MISSING.has(res.error.code)) throw new SetupRequiredError(res.error.message);
    throw new Error(res.error.message);
  }
  return res.data as T;
}

// ---- analytics -------------------------------------------------------------

export type DailyPoint = { day: string; pageViews: number; calcRegular: number; calcSolve: number; downloads: number; videoPlays: number; sessions: number };
export type Analytics = {
  totals: { events: number; sessions: number; pageViews: number; calcRuns: number; downloads: number; videoPlays: number; presetLoads: number };
  daily: DailyPoint[];
  calculators: { slug: string; runs: number; regular: number; solve: number; ok: number; failed: number; invalid: number }[];
  solver: { regularOk: number; regularFailed: number; regularInvalid: number; solveOk: number; solveFailed: number; solveInvalid: number };
  presets: { loads: number; runsFromPreset: number; runs: number };
  topPresets: { id: string; title: string | null; count: number }[];
  downloads: { url: string; title: string | null; kind: string | null; count: number }[];
  videoSources: { source: string; count: number }[];
  videos: { slug: string; title: string | null; source: string | null; count: number }[];
  modules: { module: string; count: number; sessions: number }[];
  pages: { path: string; count: number }[];
  timing: { samples: number; avgMs: number | null; p95Ms: number | null };
};
export type StorageUse = { kind: string; source: string; files: number; bytes: number }[];

/** Every dashboard figure since `days` days ago, aggregated in the database. */
export async function getAnalytics(days: number): Promise<Analytics> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const supabase = await createClient();
  return check(await supabase.rpc("admin_analytics", { since }));
}

export async function getStorageUse(): Promise<StorageUse> {
  const supabase = await createClient();
  return check(await supabase.rpc("admin_storage"));
}

// ---- media -------------------------------------------------------------------

export type MediaKind = "excel" | "pdf" | "video" | "image" | "other";
export type MediaSource = "upload" | "youtube" | "vimeo";
export type MediaAsset = {
  id: string;
  kind: MediaKind;
  source: MediaSource;
  title: string;
  description: string;
  url: string;
  storagePath: string | null;
  mimeType: string | null;
  sizeBytes: number;
  category: string;
  module: string;
  tags: string[];
  createdAt: string;
};

export async function listMedia(): Promise<MediaAsset[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("media_assets")
      .select("id, kind, source, title, description, url, storage_path, mime_type, size_bytes, category, module, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    source: r.source,
    title: r.title,
    description: r.description,
    url: r.url,
    storagePath: r.storage_path,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes),
    category: r.category,
    module: r.module,
    tags: r.tags ?? [],
    createdAt: r.created_at,
  }));
}

// ---- content -------------------------------------------------------------------

export type AdminContentRow = {
  id: string;
  slug: string;
  kind: ContentKind;
  title: string;
  standard: string;
  category: string;
  level: Level;
  isPublished: boolean;
  updatedAt: string;
};
export type AdminContent = AdminContentRow & {
  summary: string;
  durationSeconds: number;
  videoUrl: string | null;
  body: ArticleSection[];
  chapters: Chapter[];
  resources: Resource[];
  tags: string[];
};

export async function listContentAdmin(): Promise<AdminContentRow[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("content")
      .select("id, slug, kind, title, standard, category, level, is_published, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000),
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    kind: r.kind,
    title: r.title,
    standard: r.standard,
    category: r.category,
    level: r.level,
    isPublished: r.is_published,
    updatedAt: r.updated_at,
  }));
}

type ContentRow = {
  id: string;
  slug: string;
  kind: ContentKind;
  title: string;
  summary: string;
  standard: string;
  category: string;
  level: Level;
  duration_seconds: number;
  video_url: string | null;
  body: ArticleSection[] | null;
  chapters: Chapter[] | null;
  resources: Resource[] | null;
  tags: string[] | null;
  is_published: boolean;
  updated_at: string;
};

export async function getContentAdmin(id: string): Promise<AdminContent | null> {
  const supabase = await createClient();
  const r = check<ContentRow | null>(
    await supabase
      .from("content")
      .select("id, slug, kind, title, summary, standard, category, level, duration_seconds, video_url, body, chapters, resources, tags, is_published, updated_at")
      .eq("id", id)
      .maybeSingle(),
  );
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    kind: r.kind,
    title: r.title,
    summary: r.summary,
    standard: r.standard,
    category: r.category,
    level: r.level,
    durationSeconds: r.duration_seconds,
    videoUrl: r.video_url,
    body: r.body ?? [],
    chapters: r.chapters ?? [],
    resources: r.resources ?? [],
    tags: r.tags ?? [],
    isPublished: r.is_published,
    updatedAt: r.updated_at,
  };
}

// ---- presets -------------------------------------------------------------------

export type AdminPreset = {
  id: string;
  calculatorSlug: string;
  title: string;
  description: string;
  inputs: Values;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
};

export async function listPresetsAdmin(): Promise<AdminPreset[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("scenario_presets")
      .select("id, calculator_slug, title, description, inputs, sort_order, is_published, updated_at")
      .order("calculator_slug")
      .order("sort_order"),
  );
  return rows.map((r) => ({
    id: r.id,
    calculatorSlug: r.calculator_slug,
    title: r.title,
    description: r.description,
    inputs: r.inputs,
    sortOrder: r.sort_order,
    isPublished: r.is_published,
    updatedAt: r.updated_at,
  }));
}

// ---- settings ------------------------------------------------------------------

export async function listAdmins(): Promise<{ id: string; fullName: string; createdAt: string }[]> {
  const supabase = await createClient();
  const rows = check(await supabase.from("profiles").select("id, full_name, created_at").eq("role", "admin").order("created_at"));
  return rows.map((r) => ({ id: r.id, fullName: r.full_name, createdAt: r.created_at }));
}

/**
 * Run admin loads; null means the admin migration hasn't been applied yet, so
 * the page can show setup instructions. Any other failure propagates.
 */
export async function unlessSetupRequired<T>(load: Promise<T>): Promise<T | null> {
  try {
    return await load;
  } catch (e) {
    if (e instanceof SetupRequiredError) return null;
    throw e;
  }
}

// ---- subscriptions -------------------------------------------------------------

export type AdminSubscription = {
  userId: string;
  email: string;
  fullName: string;
  tier: "courses" | "exams";
  status: string;
  periodEnd: string | null;
  provider: string;
  updatedAt: string;
  /** No longer opens anything: canceled, unpaid, or past its end date. */
  ended: boolean;
};
export type AdminSubscriptions = {
  subscriptions: AdminSubscription[];
  /** Accounts that signed up from a paid plan's button, without a plan yet. */
  interested: { userId: string; email: string; plan: "courses" | "exams"; createdAt: string }[];
  waitlist: { email: string; topic: string; createdAt: string }[];
};

/** Every plan with its account, the accounts waiting on one, and the updates list. */
export async function listSubscriptions(): Promise<AdminSubscriptions> {
  const supabase = await createClient();
  const [subs, waitlist] = await Promise.all([
    supabase.rpc("admin_subscriptions"),
    supabase.from("waitlist").select("email, topic, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const data = check<{ subscriptions: Omit<AdminSubscription, "ended">[]; interested: AdminSubscriptions["interested"] }>(subs);
  const now = new Date();
  return {
    ...data,
    subscriptions: data.subscriptions.map((s) => ({ ...s, ended: effectiveTier([{ tier: s.tier, status: s.status, current_period_end: s.periodEnd }], now) === "free" })),
    waitlist: check(waitlist).map((w) => ({ email: w.email, topic: w.topic, createdAt: w.created_at })),
  };
}

// ---- exams -------------------------------------------------------------------

export type AdminExamRow = ExamMeta & { hasSteps: boolean; updatedAt: string };
export type AdminExam = ExamMeta & {
  questionPath: string | null;
  solution: { question: ExamBlock[]; steps: SolutionStep[]; video: string | null; videoSeconds: number; solutionPath: string | null };
};

const EXAM_COLUMNS = "id, topic, year, session, title, description, subjects, question_path, is_sample, published, updated_at";
type ExamRow = { id: string; topic: string; year: number; session: string; title: string; description: string; subjects: string[]; question_path: string | null; is_sample: boolean; published: boolean; updated_at: string };
const examMeta = (r: ExamRow): ExamMeta => ({
  id: r.id,
  topic: r.topic,
  year: r.year,
  session: r.session,
  title: r.title,
  description: r.description,
  subjects: r.subjects ?? [],
  hasPaper: !!r.question_path,
  isSample: r.is_sample,
  published: r.published,
});

/** Every exam, drafts too, with whether its solution has steps yet. */
export async function listExamsAdmin(): Promise<AdminExamRow[]> {
  const supabase = await createClient();
  const [exams, solutions] = await Promise.all([
    supabase.from("exams").select(EXAM_COLUMNS).order("updated_at", { ascending: false }).limit(1000),
    supabase.from("exam_solutions").select("exam_id, steps").limit(1000),
  ]);
  const withSteps = new Set(check(solutions).filter((s) => Array.isArray(s.steps) && s.steps.length).map((s) => s.exam_id));
  return check(exams).map((r: ExamRow) => ({ ...examMeta(r), hasSteps: withSteps.has(r.id), updatedAt: r.updated_at }));
}

export async function getExamAdmin(id: string): Promise<AdminExam | null> {
  const supabase = await createClient();
  const [exam, solution] = await Promise.all([
    supabase.from("exams").select(EXAM_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("exam_solutions").select("question, steps, video, video_seconds, solution_path").eq("exam_id", id).maybeSingle(),
  ]);
  const r = check(exam) as ExamRow | null;
  if (!r) return null;
  const s = check(solution);
  return {
    ...examMeta(r),
    questionPath: r.question_path,
    solution: {
      question: parseBlocks(s?.question),
      steps: parseSteps(s?.steps),
      video: s?.video ?? null,
      videoSeconds: s?.video_seconds ?? 0,
      solutionPath: s?.solution_path ?? null,
    },
  };
}

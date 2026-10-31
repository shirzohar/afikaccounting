import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { type Access, canOpenExam } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { isSupabaseConfigured } from "@/lib/env";
import { parseBlocks, parseSteps, parseSubjects } from "@/lib/exams/parse";
import { SEED_EXAMS } from "@/lib/exams/seed";
import { type ExamContent, type ExamFilters, type ExamMeta, examOrder, matchesExam } from "@/lib/exams/types";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

/**
 * The exams area. The list (metadata) is public and cached; an exam's paper
 * and solution are read per request, only after the reader's access is
 * checked — and with their own session, so the database's policies
 * (public.can_open_exam) check again. Files sit in a private bucket and go
 * out as short-lived signed links.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const META = "id, topic, year, session, title, description, subjects, question_path, is_sample, published";
type MetaRow = { id: string; topic: string; year: number; session: string; title: string; description: string; subjects: string[]; question_path: string | null; is_sample: boolean; published: boolean };

const fromRow = (r: MetaRow): ExamMeta => ({
  id: r.id,
  topic: r.topic,
  year: r.year,
  session: r.session,
  title: r.title,
  description: r.description,
  subjects: parseSubjects(r.subjects),
  hasPaper: !!r.question_path,
  isSample: r.is_sample,
  published: r.published,
});

const metaOf = (e: (typeof SEED_EXAMS)[number]): ExamMeta => ({
  id: e.id,
  topic: e.topic,
  year: e.year,
  session: e.session,
  title: e.title,
  description: e.description,
  subjects: e.subjects,
  hasPaper: e.hasPaper,
  isSample: e.isSample,
  published: e.published,
});

/** Every published exam, samples first, then newest. */
export async function listExams(filters: ExamFilters = {}): Promise<ExamMeta[]> {
  "use cache";
  cacheTag("exams");
  cacheLife("hours");
  if (!isSupabaseConfigured) return SEED_EXAMS.map(metaOf).filter((e) => e.published && matchesExam(e, filters)).sort(examOrder);
  const { data, error } = await createPublicClient().from("exams").select(META).eq("published", true).limit(500);
  // Before the exams migration runs, the area is simply empty.
  if (error) return [];
  return (data as MetaRow[]).map(fromRow).filter((e) => matchesExam(e, filters)).sort(examOrder);
}

export async function getExam(id: string): Promise<ExamMeta | null> {
  "use cache";
  cacheTag("exams", `exam:${id}`);
  cacheLife("hours");
  if (!UUID.test(id)) return null;
  if (!isSupabaseConfigured) {
    const e = SEED_EXAMS.find((x) => x.id === id);
    return e?.published ? metaOf(e) : null;
  }
  const { data } = await createPublicClient().from("exams").select(META).eq("id", id).eq("published", true).maybeSingle();
  return data ? fromRow(data as MetaRow) : null;
}

/** The filters' options: the topics, subjects and years that have exams. */
export async function examFacets() {
  const all = await listExams();
  const unique = <T>(xs: T[]) => [...new Set(xs)];
  return {
    topics: unique(all.map((e) => e.topic)),
    subjects: unique(all.flatMap((e) => e.subjects)).sort((a, b) => a.localeCompare(b, "he")),
    years: unique(all.map((e) => e.year)).sort((a, b) => b - a),
  };
}

/**
 * An exam's paper and solution, for a reader who may open it; null for one
 * who may not — then nothing of it is read, so nothing of it can reach the page.
 */
export async function getExamContent(exam: ExamMeta, access?: Access): Promise<ExamContent | null> {
  if (!canOpenExam(access ?? (await getAccess()), exam)) return null;
  if (!isSupabaseConfigured) return SEED_EXAMS.find((e) => e.id === exam.id)?.content ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("exam_solutions").select("question, steps, video, video_seconds, solution_path").eq("exam_id", exam.id).maybeSingle();
  // Allowed, and no solution written yet: an empty one (the paper may still be there).
  if (!data) return { question: [], steps: [], video: null, videoSeconds: 0, hasSolutionFile: false };
  return {
    question: parseBlocks(data.question),
    steps: parseSteps(data.steps),
    video: data.video || null,
    videoSeconds: Math.max(0, Number(data.video_seconds) || 0),
    hasSolutionFile: !!data.solution_path,
  };
}

export type ExamFile = "question" | "solution" | "video";

/** How long a signed link to an exam's file lasts: long enough to start a download or a video. */
const SIGNED_SECONDS = { question: 120, solution: 120, video: 60 * 60 } as const;

/**
 * A short-lived link to one of an exam's files, or null: when the reader may
 * not open the exam, when there is no such file, or in demo mode. Signed with
 * the reader's session, so the bucket's policy checks access too.
 */
export async function signedExamFile(id: string, which: ExamFile, download = false): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const exam = await getExam(id);
  if (!exam || !canOpenExam(await getAccess(), exam)) return null;
  const supabase = await createClient();
  let path: string | null = null;
  if (which === "question") {
    const { data } = await supabase.from("exams").select("question_path").eq("id", id).maybeSingle();
    path = data?.question_path ?? null;
  } else {
    const { data } = await supabase.from("exam_solutions").select("solution_path, video").eq("exam_id", id).maybeSingle();
    path = (which === "solution" ? data?.solution_path : data?.video) ?? null;
    // A YouTube/Vimeo link plays where it is; only files in the bucket are signed.
    if (which === "video" && path && /^https?:\/\//.test(path)) return path;
  }
  if (!path) return null;
  const { data } = await supabase.storage.from("exams").createSignedUrl(path, SIGNED_SECONDS[which], download ? { download: true } : undefined);
  return data?.signedUrl ?? null;
}

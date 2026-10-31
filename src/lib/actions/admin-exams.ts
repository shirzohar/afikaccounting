"use server";

import { refresh, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { parseBlocks, parseSteps, parseSubjects } from "@/lib/exams/parse";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-media";

export type ExamInput = {
  topic: string;
  year: number;
  session: string;
  title: string;
  description: string;
  subjects: string[];
  isSample: boolean;
  published: boolean;
};

/** The solution as the editor sends it: blocks may hold typed text ("1,200") — parsed on the server. */
export type SolutionInput = { question: unknown[]; steps: unknown[]; video: string; videoSeconds: number };

export type ExamFileKind = "question" | "solution" | "video";

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

function toRow(input: ExamInput): { row: Record<string, unknown> } | { error: string } {
  if (!TOPICS.some((t) => t.id === input.topic)) return { error: "נושא לא מוכר." };
  const year = Math.round(Number(input.year));
  if (!(year >= 1990 && year <= 2100)) return { error: "שנה לא תקינה." };
  const title = str(input.title, 200);
  if (!title) return { error: "חסרה כותרת." };
  return {
    row: {
      topic: input.topic,
      year,
      session: str(input.session, 40),
      title,
      description: str(input.description, 1000),
      subjects: parseSubjects(input.subjects),
      is_sample: Boolean(input.isSample),
      published: Boolean(input.published),
    },
  };
}

/** Create (no id) or update an exam's details; the public pages refresh at once. */
export async function saveExam(input: ExamInput, id?: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const parsed = toRow(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const supabase = await createClient();
  const res = id
    ? await supabase.from("exams").update(parsed.row).eq("id", id).select("id").single()
    : await supabase.from("exams").insert(parsed.row).select("id").single();
  if (res.error) return { ok: false, error: res.error.message };
  updateTag("exams");
  return { ok: true, id: res.data.id };
}

export async function setExamPublished(id: string, published: boolean): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("exams").update({ published }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag("exams");
  refresh();
  return { ok: true, id };
}

/** Delete an exam, its solution (cascade) and every file in its folder. */
export async function deleteExam(id: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  if (!UUID.test(id)) return { ok: false, error: "מזהה לא תקין." };
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from("exams").list(id, { limit: 100 });
  if (files?.length) await supabase.storage.from("exams").remove(files.map((f) => `${id}/${f.name}`));
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag("exams");
  refresh();
  return { ok: true };
}

/** Save the question text, the solution steps and the video (a link, or the bucket file set by setExamFile). */
export async function saveSolution(examId: string, input: SolutionInput): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  if (!UUID.test(examId)) return { ok: false, error: "מזהה לא תקין." };
  const video = str(input.video, 1000);
  if (video && !/^https?:\/\//.test(video) && !video.startsWith(`${examId}/`)) return { ok: false, error: "סרטון: קישור http(s)://, או קובץ שהועלה למבחן הזה." };
  const supabase = await createClient();
  const { error } = await supabase.from("exam_solutions").upsert(
    {
      exam_id: examId,
      question: parseBlocks(input.question),
      steps: parseSteps(input.steps),
      video: video || null,
      video_seconds: Math.max(0, Math.round(Number(input.videoSeconds) || 0)),
    },
    { onConflict: "exam_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: examId };
}

/**
 * Attach a file the browser has just uploaded to the private "exams" bucket
 * (the bucket's policy already limited the upload to admins), or detach one
 * (path null). The file it replaces is removed from the bucket.
 */
export async function setExamFile(examId: string, kind: ExamFileKind, path: string | null): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  if (!UUID.test(examId)) return { ok: false, error: "מזהה לא תקין." };
  if (path !== null && !new RegExp(`^${examId}/[\\w.-]+$`).test(path)) return { ok: false, error: "נתיב קובץ לא תקין." };
  const supabase = await createClient();

  let before: string | null = null;
  if (kind === "question") {
    const { data } = await supabase.from("exams").select("question_path").eq("id", examId).maybeSingle();
    before = data?.question_path ?? null;
    const { error } = await supabase.from("exams").update({ question_path: path }).eq("id", examId);
    if (error) return { ok: false, error: error.message };
    updateTag("exams");
  } else {
    const column = kind === "solution" ? "solution_path" : "video";
    const { data } = await supabase.from("exam_solutions").select("solution_path, video").eq("exam_id", examId).maybeSingle();
    before = (kind === "solution" ? data?.solution_path : data?.video) ?? null;
    const { error } = await supabase.from("exam_solutions").upsert({ exam_id: examId, [column]: path }, { onConflict: "exam_id" });
    if (error) return { ok: false, error: error.message };
  }
  if (before && before !== path && before.startsWith(`${examId}/`)) await supabase.storage.from("exams").remove([before]);
  refresh();
  return { ok: true, id: examId };
}

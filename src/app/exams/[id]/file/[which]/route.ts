import type { NextRequest } from "next/server";
import { type ExamFile, signedExamFile } from "@/lib/data/exams";

const FILES: ExamFile[] = ["question", "solution", "video"];

/**
 * One of an exam's files (paper, solution, video): checks the reader's access
 * on every request and sends them on to a fresh, short-lived signed link — so
 * a link on the page never expires and never works for someone without
 * access. ?download=1 asks for a download rather than viewing in the browser.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/exams/[id]/file/[which]">) {
  const { id, which } = await ctx.params;
  if (!FILES.includes(which as ExamFile)) return new Response(null, { status: 404 });
  const url = await signedExamFile(id, which as ExamFile, request.nextUrl.searchParams.get("download") === "1");
  if (!url) return new Response("הקובץ אינו זמין.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "private, no-store" } });
}

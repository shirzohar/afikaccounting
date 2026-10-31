/**
 * Upserts the bundled content catalogue and calculator schemas into Supabase,
 * and the demo exams as drafts (unpublished: an admin reviews and publishes them).
 *   npm run db:seed
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (writes bypass RLS).
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_CONTENT } from "../src/lib/content/seed";
import { SEED_EXAMS } from "../src/lib/exams/seed";
import { CALCULATORS, toSchema } from "../src/lib/engine/registry";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const content = SEED_CONTENT.map((c) => ({
    id: c.id,
    slug: c.slug,
    kind: c.kind,
    title: c.title,
    summary: c.summary,
    standard: c.standard,
    category: c.category,
    level: c.level,
    duration_seconds: c.durationSeconds,
    video_url: c.videoUrl,
    body: c.body,
    chapters: c.chapters,
    resources: c.resources,
    tags: c.tags,
    published_at: c.publishedAt,
  }));
  const r1 = await db.from("content").upsert(content, { onConflict: "id" });
  if (r1.error) throw r1.error;
  console.log(`✓ content: ${content.length} rows`);

  const calculators = CALCULATORS.map((c) => ({
    slug: c.slug,
    standard: c.standard,
    title: c.title,
    category: c.category,
    schema: toSchema(c),
  }));
  const r2 = await db.from("accounting_calculators").upsert(calculators, { onConflict: "slug" });
  if (r2.error) throw r2.error;
  console.log(`✓ accounting_calculators: ${calculators.length} rows`);

  // Drafts only, and never over an exam an admin has already changed: ignoreDuplicates.
  const exams = SEED_EXAMS.map((e) => ({ id: e.id, topic: e.topic, year: e.year, session: e.session, title: e.title, description: e.description, subjects: e.subjects, is_sample: e.isSample, published: false }));
  const r3 = await db.from("exams").upsert(exams, { onConflict: "id", ignoreDuplicates: true });
  if (r3.error) throw r3.error;
  const solutions = SEED_EXAMS.map((e) => ({ exam_id: e.id, question: e.content.question, steps: e.content.steps }));
  const r4 = await db.from("exam_solutions").upsert(solutions, { onConflict: "exam_id", ignoreDuplicates: true });
  if (r4.error) throw r4.error;
  console.log(`✓ exams: ${exams.length} drafts (publish them in /admin/exams)`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});

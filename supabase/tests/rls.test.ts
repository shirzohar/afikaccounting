/**
 * The database's own rules, tested on the real migrations: every file in
 * supabase/migrations runs in an in-process Postgres (PGlite), on a small
 * stand-in for Supabase's auth and storage schemas, and each reader queries
 * as Supabase would run them — role anon or authenticated, with their user id
 * in the JWT claims — so row-level security decides what comes back.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const ID = {
  free: "00000000-0000-4000-8000-000000000001",
  courses: "00000000-0000-4000-8000-000000000002",
  exams: "00000000-0000-4000-8000-000000000003",
  expired: "00000000-0000-4000-8000-000000000004",
  admin: "00000000-0000-4000-8000-000000000005",
};
const EXAM = {
  locked: "11111111-1111-4111-8111-111111111111",
  sample: "22222222-2222-4222-8222-222222222222",
  draft: "33333333-3333-4333-8333-333333333333",
};

type Reader = keyof typeof ID | "guest";
let db: Db;

/** Run a query as a reader, the way Supabase would: their role, and their id in the claims. */
const as = <T,>(who: Reader, sql: string) => db.as<T>(who === "guest" ? "guest" : ID[who], sql);
/** Whether a write as this reader goes through (false when a policy refuses it). */
const can = (who: Reader, sql: string) => db.can(who === "guest" ? "guest" : ID[who], sql);
const ids = (rows: { exam_id?: string; id?: string }[]) => rows.map((r) => r.exam_id ?? r.id).sort();

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ${Object.entries(ID).map(([k, v]) => `('${v}', '${k}@example.com')`).join(", ")};
    update public.profiles set role = 'admin' where id = '${ID.admin}';
    insert into public.subscriptions (user_id, tier, status, current_period_end) values
      ('${ID.courses}', 'courses', 'active', null),
      ('${ID.exams}', 'exams', 'active', now() + interval '30 days'),
      ('${ID.expired}', 'exams', 'active', now() - interval '1 day');
    insert into public.exams (id, topic, year, title, published, is_sample) values
      ('${EXAM.locked}', 'inventory', 2026, 'locked', true, false),
      ('${EXAM.sample}', 'inventory', 2026, 'sample', true, true),
      ('${EXAM.draft}', 'ias16', 2026, 'draft', false, false);
    insert into public.exam_solutions (exam_id, steps) values
      ('${EXAM.locked}', '[{"title":"secret"}]'), ('${EXAM.sample}', '[]'), ('${EXAM.draft}', '[]');
    insert into storage.objects (bucket_id, name) values
      ('exams', '${EXAM.locked}/question.pdf'), ('exams', '${EXAM.sample}/question.pdf'), ('exams', 'not-an-exam/x.pdf'), ('media', 'public/x.png');
  `);
});
after(() => db.close());

describe("database rules (RLS)", () => {
  it("has row-level security on every table in public", async () => {
    const open = await db.query<{ relname: string }>(`select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
    assert.deepEqual(open.rows, []);
  });

  it("lists published exams to everyone, drafts to admins only", async () => {
    for (const who of ["guest", "free", "courses", "exams"] as const) assert.deepEqual(ids(await as(who, "select id from public.exams")), [EXAM.locked, EXAM.sample].sort(), who);
    assert.equal((await as("admin", "select id from public.exams")).length, 3);
  });

  it("opens a solution only on the exams plan, or for a sample", async () => {
    const solutions = (who: Reader) => as<{ exam_id: string }>(who, "select exam_id from public.exam_solutions").then(ids);
    assert.deepEqual(await solutions("guest"), [EXAM.sample]);
    assert.deepEqual(await solutions("free"), [EXAM.sample]);
    assert.deepEqual(await solutions("courses"), [EXAM.sample], "the courses plan doesn't open exams");
    assert.deepEqual(await solutions("expired"), [EXAM.sample], "an ended plan opens nothing");
    assert.deepEqual(await solutions("exams"), [EXAM.locked, EXAM.sample].sort(), "a draft stays closed, even on the plan");
    assert.equal((await solutions("admin")).length, 3);
  });

  it("lets only those who may open an exam read its files in the private bucket", async () => {
    const files = (who: Reader) => as<{ name: string }>(who, "select name from storage.objects where bucket_id = 'exams'").then((r) => r.map((x) => x.name).sort());
    assert.deepEqual(await files("guest"), [`${EXAM.sample}/question.pdf`]);
    assert.deepEqual(await files("courses"), [`${EXAM.sample}/question.pdf`]);
    assert.deepEqual(await files("exams"), [`${EXAM.locked}/question.pdf`, `${EXAM.sample}/question.pdf`].sort());
    // A file outside an exam's folder opens to no reader (the exact lists above) — only to an admin, who manages them all.
    assert.equal((await files("admin")).length, 3);
    assert.equal((await db.query<{ public: boolean }>(`select public from storage.buckets where id = 'exams'`)).rows[0]?.public, false);
  });

  it("lets only an admin write exams, solutions and their files", async () => {
    for (const who of ["guest", "free", "exams"] as const) {
      assert.ok(!(await can(who, `insert into public.exams (topic, year, title) values ('inventory', 2026, 'x')`)), `${who} inserts an exam`);
      assert.ok(!(await can(who, `insert into storage.objects (bucket_id, name) values ('exams', '${EXAM.locked}/x.pdf')`)), `${who} uploads`);
      const changed = await as(who, `update public.exam_solutions set steps = '[]' where exam_id = '${EXAM.sample}' returning exam_id`).catch(() => []);
      assert.equal(changed.length, 0, `${who} edits a solution`);
    }
    assert.ok(await can("admin", `insert into public.exams (topic, year, title) values ('inventory', 2026, 'by admin')`));
    assert.ok(await can("admin", `insert into storage.objects (bucket_id, name) values ('exams', '${EXAM.locked}/solution.pdf')`));
  });

  it("shows a reader only their own plan, and lets no one but an admin give one", async () => {
    assert.deepEqual(
      (await as<{ user_id: string }>("courses", "select user_id from public.subscriptions")).map((r) => r.user_id),
      [ID.courses],
    );
    assert.deepEqual(await as("guest", "select user_id from public.subscriptions"), []);
    assert.ok(!(await can("free", `insert into public.subscriptions (user_id, tier) values ('${ID.free}', 'exams')`)), "a reader gives themselves a plan");
    assert.equal((await as("admin", "select user_id from public.subscriptions")).length, 3);
    assert.ok(await can("admin", `insert into public.subscriptions (user_id, tier) values ('${ID.free}', 'courses')`));
  });

  it("keeps the admin lookups for admins", async () => {
    assert.ok(!(await can("free", `select public.admin_user_by_email('exams@example.com')`)));
    assert.deepEqual(await as("admin", `select public.admin_user_by_email('EXAMS@example.com') as id`), [{ id: ID.exams }]);
  });
});

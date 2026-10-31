/**
 * An in-process Postgres (PGlite) with every migration in supabase/migrations
 * applied, on a small stand-in for Supabase's auth and storage schemas — so
 * tests run the database's real rules. `as` runs a query the way Supabase
 * would for a reader: their role (anon, authenticated, service_role) and
 * their user id in the JWT claims.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

const SUPABASE = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
`;

export type Db = PGlite & {
  /** Run a query as a reader: "guest" (anon), "service" (service_role), or a user id (authenticated). */
  as<T>(who: string, sql: string, params?: unknown[]): Promise<T[]>;
  /** Whether a statement as this reader goes through (false when a rule refuses it). */
  can(who: string, sql: string, params?: unknown[]): Promise<boolean>;
};

export async function startDb(): Promise<Db> {
  const db = new PGlite() as Db;
  await db.exec(SUPABASE);
  for (const f of readdirSync(MIGRATIONS).filter((x) => x.endsWith(".sql")).sort()) {
    // gen_random_uuid() is built into Postgres; PGlite has no pgcrypto to create.
    await db.exec(readFileSync(join(MIGRATIONS, f), "utf8").replace(/create extension[^;]*;/gi, ""));
  }
  // Supabase grants table access to its roles by default; RLS then decides the rows.
  await db.exec(`grant select, insert, update, delete on all tables in schema public, storage to anon, authenticated, service_role;`);
  db.as = async <T,>(who: string, sql: string, params?: unknown[]) => {
    const role = who === "guest" ? "anon" : who === "service" ? "service_role" : "authenticated";
    await db.exec(role === "authenticated" ? `set request.jwt.claim.sub = '${who.replace(/'/g, "")}'; set role authenticated` : `reset request.jwt.claim.sub; set role ${role}`);
    try {
      return (await db.query<T>(sql, params)).rows;
    } finally {
      await db.exec(`reset role; reset request.jwt.claim.sub`);
    }
  };
  db.can = async (who, sql, params) => {
    try {
      await db.as(who, sql, params);
      return true;
    } catch {
      return false;
    }
  };
  return db;
}

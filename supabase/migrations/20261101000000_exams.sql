-- AfikAccounting — the exams area: exams, their worked solutions, and a private bucket for their files.
-- Apply after 20261031000000_subscriptions.sql.

-- ---------------------------------------------------------------------------
-- Who may open what
-- ---------------------------------------------------------------------------
-- True when the signed-in user has a live plan that includes `need`
-- ('courses' < 'exams'). Security definer, like is_admin(), so policies can
-- call it without granting read access to every subscription.
create or replace function public.has_tier(need text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = (select auth.uid())
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
      and (s.tier = need or (s.tier = 'exams' and need = 'courses'))
  );
$$;

grant execute on function public.has_tier(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Exams: the list is public (metadata only)
-- ---------------------------------------------------------------------------
create table public.exams (
  id            uuid primary key default gen_random_uuid(),
  -- A topic id from src/lib/catalog.ts ('inventory', 'ias16', …).
  topic         text not null check (topic ~ '^[a-z0-9-]{1,40}$'),
  year          integer not null check (year between 1990 and 2100),
  -- "מועד א׳", "מועד ב׳" — or empty for an exam-level exercise.
  session       text not null default '' check (char_length(session) <= 40),
  title         text not null check (char_length(title) between 1 and 200),
  description   text not null default '' check (char_length(description) <= 1000),
  -- What the exam covers, for the filter ("FIFO", "הערכה מחדש").
  subjects      text[] not null default '{}',
  -- The question paper in the private "exams" bucket: "<exam id>/<file>".
  question_path text check (char_length(question_path) <= 300),
  -- Open to everyone, as a taste of the area.
  is_sample     boolean not null default false,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index exams_topic_idx on public.exams (topic, year desc);

create trigger exams_updated_at
  before update on public.exams
  for each row execute function public.set_updated_at();

alter table public.exams enable row level security;

create policy "Published exams are listed for everyone"
  on public.exams for select to anon, authenticated
  using (published or public.is_admin());
create policy "Admins manage exams"
  on public.exams for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- True when the caller may open an exam's paper and its solution: an admin;
-- or a published exam that is a sample, or whose reader has the exams plan.
create or replace function public.can_open_exam(exam uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.exams e
    where e.id = exam and e.published and (e.is_sample or public.has_tier('exams'))
  );
$$;

grant execute on function public.can_open_exam(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Solutions: only for those who may open the exam
-- ---------------------------------------------------------------------------
create table public.exam_solutions (
  exam_id       uuid primary key references public.exams (id) on delete cascade,
  -- The question as text on the page, when there is no paper (or beside it):
  -- the same blocks as a step's (see src/lib/exams/types.ts).
  question      jsonb not null default '[]'::jsonb check (jsonb_typeof(question) = 'array'),
  -- The worked solution, step by step: [{ "title", "explanation", "blocks": [...] }].
  steps         jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  -- A YouTube/Vimeo link, or a file in the private bucket ("<exam id>/<file>").
  video         text check (char_length(video) <= 1000),
  video_seconds integer not null default 0 check (video_seconds >= 0),
  -- The full solution as a file in the private bucket.
  solution_path text check (char_length(solution_path) <= 300),
  updated_at    timestamptz not null default now()
);

create trigger exam_solutions_updated_at
  before update on public.exam_solutions
  for each row execute function public.set_updated_at();

alter table public.exam_solutions enable row level security;

create policy "Solutions open to whoever may open the exam"
  on public.exam_solutions for select to anon, authenticated
  using (public.can_open_exam(exam_id));
create policy "Admins manage solutions"
  on public.exam_solutions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Files: a private bucket, one folder per exam
-- ---------------------------------------------------------------------------
-- Never public: the server hands out short-lived signed links, after checking
-- access, and signing one also passes through this policy.
insert into storage.buckets (id, name, public)
values ('exams', 'exams', false)
on conflict (id) do nothing;

-- The exam a file belongs to, from its folder; null for anything else.
create or replace function public.exam_of_path(path text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case when split_part(path, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(path, '/', 1)::uuid end;
$$;

create policy "Exam files open to whoever may open the exam"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'exams' and public.can_open_exam(public.exam_of_path(name)));
create policy "Admins upload exam files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'exams' and public.is_admin());
create policy "Admins update exam files"
  on storage.objects for update to authenticated
  using (bucket_id = 'exams' and public.is_admin());
create policy "Admins delete exam files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'exams' and public.is_admin());

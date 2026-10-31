-- AfikAccounting — access plans: subscriptions, an updates waitlist, and the funnel's usage events.
-- Apply after 20261023000000_admin.sql.

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
-- One row per account. There is no payment provider yet: an admin grants a
-- plan by hand (provider 'manual'). A provider's webhook will write the same
-- row with the service role, which bypasses RLS.
create table public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users (id) on delete cascade,
  tier               text not null check (tier in ('courses', 'exams')),
  status             text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled')),
  -- Null: open-ended (a manual grant without an end date).
  current_period_end timestamptz,
  provider           text not null default 'manual' check (char_length(provider) between 1 and 40),
  -- The provider's own id for the subscription; null for a manual grant.
  provider_ref       text check (char_length(provider_ref) <= 200),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- A reader sees their own plan, and nothing else. Nobody but an admin (or the
-- service role, which bypasses RLS) can write one: there is no policy for it.
create policy "Users read their own subscription"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Admins read every subscription"
  on public.subscriptions for select to authenticated
  using (public.is_admin());
create policy "Admins create subscriptions"
  on public.subscriptions for insert to authenticated
  with check (public.is_admin());
create policy "Admins update subscriptions"
  on public.subscriptions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "Admins delete subscriptions"
  on public.subscriptions for delete to authenticated
  using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Updates waitlist (the exams area, and paid plans until payment opens)
-- ---------------------------------------------------------------------------
create table public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null check (char_length(email) between 3 and 254),
  topic      text not null check (topic in ('exams', 'courses')),
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (email, topic)
);

alter table public.waitlist enable row level security;

create policy "Anyone joins the waitlist"
  on public.waitlist for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "Admins read the waitlist"
  on public.waitlist for select to authenticated
  using (public.is_admin());
create policy "Admins clear the waitlist"
  on public.waitlist for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin: find an account by email, and list plans with their emails
-- ---------------------------------------------------------------------------
-- auth.users is not readable through the API, so these run as definer and
-- check the caller themselves.
create or replace function public.admin_user_by_email(p_email text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return (select id from auth.users where lower(email) = lower(trim(p_email)) limit 1);
end;
$$;

grant execute on function public.admin_user_by_email(text) to authenticated;

-- Every subscription with its account's email and name, and the accounts that
-- signed up from a paid plan's "choose" button (raw_user_meta_data.plan) without one.
create or replace function public.admin_subscriptions()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return jsonb_build_object(
    'subscriptions', coalesce((
      select jsonb_agg(s order by s."updatedAt" desc) from (
        select sub.user_id as "userId", u.email, coalesce(p.full_name, '') as "fullName", sub.tier, sub.status,
               sub.current_period_end as "periodEnd", sub.provider, sub.updated_at as "updatedAt"
        from public.subscriptions sub
        join auth.users u on u.id = sub.user_id
        left join public.profiles p on p.id = sub.user_id
      ) s
    ), '[]'::jsonb),
    'interested', coalesce((
      select jsonb_agg(i order by i."createdAt" desc) from (
        select u.id as "userId", u.email, u.raw_user_meta_data ->> 'plan' as plan, u.created_at as "createdAt"
        from auth.users u
        where u.raw_user_meta_data ->> 'plan' in ('courses', 'exams')
          and not exists (select 1 from public.subscriptions s where s.user_id = u.id)
        limit 200
      ) i
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.admin_subscriptions() to authenticated;

-- ---------------------------------------------------------------------------
-- Funnel events
-- ---------------------------------------------------------------------------
alter table public.analytics_events drop constraint analytics_events_kind_check;
alter table public.analytics_events add constraint analytics_events_kind_check check (kind in (
  'page_view', 'calc_run', 'calc_invalid', 'download', 'video_play', 'preset_load',
  'landing_view', 'lesson_start', 'signup', 'course_complete', 'paywall_view', 'pricing_view', 'plan_click'
));

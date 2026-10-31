-- AfikAccounting — payments: what the payment provider tells us, applied to subscriptions once each.
-- Apply after 20261101000000_exams.sql.
--
-- The webhook (src/app/api/billing/webhook) verifies the provider's signature,
-- turns its event into one of the types below, and calls apply_billing_event()
-- with the service role. The function records the event by its id first, so an
-- event delivered twice is applied once; and it ignores an event older than the
-- last one applied to the same subscription, so late deliveries can't undo
-- newer ones. Everything else keeps reading access through subscriptions.

-- ---------------------------------------------------------------------------
-- Subscriptions: what a provider adds
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  add column billing_interval     text check (billing_interval in ('month', 'year')),
  -- Cancelled by the reader: open until current_period_end, then not renewed.
  add column cancel_at_period_end boolean not null default false,
  -- The provider time of the last event applied, to ignore older ones arriving late.
  add column last_event_at        timestamptz;

-- ---------------------------------------------------------------------------
-- Every event received, by the provider's id: the idempotency key
-- ---------------------------------------------------------------------------
create table public.billing_events (
  -- "<provider>:<the provider's event id>"
  id           text primary key check (char_length(id) between 3 and 200),
  provider     text not null,
  type         text not null check (type in ('activated', 'renewed', 'plan_changed', 'cancel_scheduled', 'cancel_revoked', 'canceled', 'payment_failed', 'refunded')),
  user_id      uuid references auth.users (id) on delete set null,
  provider_ref text,
  occurred_at  timestamptz not null,
  received_at  timestamptz not null default now(),
  -- applied | stale | ignored
  result       text not null default 'applied',
  payload      jsonb not null default '{}'::jsonb
);

create index billing_events_user_idx on public.billing_events (user_id, occurred_at desc);

-- Written by the webhook only (service role, which bypasses RLS); admins may look.
alter table public.billing_events enable row level security;
create policy "Admins read billing events"
  on public.billing_events for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Invoices: the provider issues one for every charge; we keep the link
-- ---------------------------------------------------------------------------
create table public.invoices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  provider     text not null,
  -- The provider's id for the charge (or the document): one invoice per charge.
  provider_ref text not null,
  number       text not null default '',
  amount       numeric(12, 2) not null check (amount >= 0),
  currency     text not null default 'ILS',
  url          text not null check (url ~ '^https?://' or url ~ '^/'),
  issued_at    timestamptz not null,
  unique (provider, provider_ref)
);

create index invoices_user_idx on public.invoices (user_id, issued_at desc);

alter table public.invoices enable row level security;
create policy "Users read their own invoices"
  on public.invoices for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Admins read every invoice"
  on public.invoices for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Applying an event, atomically
-- ---------------------------------------------------------------------------
-- Returns 'applied', 'duplicate' (this event id was seen before), 'stale' (an
-- older event than the last applied), or 'ignored' (it belongs to another
-- subscription than the reader's current one, or there is nothing to change).
create or replace function public.apply_billing_event(
  p_id text,
  p_provider text,
  p_type text,
  p_user uuid,
  p_occurred_at timestamptz,
  p_provider_ref text default null,
  p_tier text default null,
  p_interval text default null,
  p_period_end timestamptz default null,
  p_invoice jsonb default null,
  p_payload jsonb default '{}'::jsonb
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cur public.subscriptions;
  outcome text := 'applied';
begin
  insert into public.billing_events (id, provider, type, user_id, provider_ref, occurred_at, payload)
  values (p_id, p_provider, p_type, p_user, p_provider_ref, p_occurred_at, coalesce(p_payload, '{}'::jsonb))
  on conflict (id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  -- The invoice is kept whatever happens to the subscription: the charge happened.
  if p_invoice is not null then
    insert into public.invoices (user_id, provider, provider_ref, number, amount, currency, url, issued_at)
    values (
      p_user, p_provider, p_invoice ->> 'ref', coalesce(p_invoice ->> 'number', ''), (p_invoice ->> 'amount')::numeric,
      coalesce(p_invoice ->> 'currency', 'ILS'), p_invoice ->> 'url', coalesce((p_invoice ->> 'issued_at')::timestamptz, p_occurred_at)
    )
    on conflict (provider, provider_ref) do nothing;
  end if;

  select * into cur from public.subscriptions where user_id = p_user for update;

  if found and cur.provider_ref is not distinct from p_provider_ref and cur.last_event_at is not null and p_occurred_at < cur.last_event_at then
    outcome := 'stale';
  elsif p_type = 'activated' or (not found and p_type in ('renewed', 'plan_changed')) then
    -- A new subscription (it replaces a manual grant, or an older subscription).
    if p_tier not in ('courses', 'exams') then
      raise exception 'activated needs a tier';
    end if;
    insert into public.subscriptions (user_id, tier, status, current_period_end, provider, provider_ref, billing_interval, cancel_at_period_end, last_event_at)
    values (p_user, p_tier, 'active', p_period_end, p_provider, p_provider_ref, p_interval, false, p_occurred_at)
    on conflict (user_id) do update set
      tier = excluded.tier, status = 'active', current_period_end = excluded.current_period_end, provider = excluded.provider,
      provider_ref = excluded.provider_ref, billing_interval = excluded.billing_interval, cancel_at_period_end = false,
      last_event_at = excluded.last_event_at;
  elsif not found or cur.provider_ref is distinct from p_provider_ref then
    -- About a subscription the reader no longer has (or never had here): nothing to change.
    outcome := 'ignored';
  elsif p_type = 'renewed' then
    update public.subscriptions set status = 'active', current_period_end = coalesce(p_period_end, current_period_end),
      tier = coalesce(p_tier, tier), last_event_at = p_occurred_at
    where user_id = p_user;
  elsif p_type = 'plan_changed' then
    update public.subscriptions set tier = coalesce(p_tier, tier), billing_interval = coalesce(p_interval, billing_interval),
      current_period_end = coalesce(p_period_end, current_period_end), last_event_at = p_occurred_at
    where user_id = p_user;
  elsif p_type = 'cancel_scheduled' then
    -- Cancelled by the reader: stays open until the end of the period paid for.
    update public.subscriptions set cancel_at_period_end = true, current_period_end = coalesce(p_period_end, current_period_end), last_event_at = p_occurred_at
    where user_id = p_user;
  elsif p_type = 'cancel_revoked' then
    update public.subscriptions set cancel_at_period_end = false, last_event_at = p_occurred_at where user_id = p_user;
  elsif p_type = 'canceled' then
    update public.subscriptions set status = 'canceled', cancel_at_period_end = false, last_event_at = p_occurred_at where user_id = p_user;
  elsif p_type = 'payment_failed' then
    update public.subscriptions set status = 'past_due', last_event_at = p_occurred_at where user_id = p_user;
  elsif p_type = 'refunded' then
    -- Money back: access ends now.
    update public.subscriptions set status = 'canceled', current_period_end = least(coalesce(current_period_end, p_occurred_at), p_occurred_at),
      cancel_at_period_end = false, last_event_at = p_occurred_at
    where user_id = p_user;
  end if;

  update public.billing_events set result = outcome where id = p_id;
  return outcome;
end;
$$;

-- The webhook calls it with the service role; no reader can.
revoke execute on function public.apply_billing_event(text, text, text, uuid, timestamptz, text, text, text, timestamptz, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.apply_billing_event(text, text, text, uuid, timestamptz, text, text, text, timestamptz, jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Funnel events: checkout started, payment succeeded, subscription cancelled
-- ---------------------------------------------------------------------------
alter table public.analytics_events drop constraint analytics_events_kind_check;
alter table public.analytics_events add constraint analytics_events_kind_check check (kind in (
  'page_view', 'calc_run', 'calc_invalid', 'download', 'video_play', 'preset_load',
  'landing_view', 'lesson_start', 'signup', 'course_complete', 'paywall_view', 'pricing_view', 'plan_click',
  'checkout_start', 'payment_success', 'subscription_cancel'
));

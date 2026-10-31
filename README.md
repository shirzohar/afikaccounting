# AfikAccounting — Accounting & Financial Engine

A full-stack accounting portal that pairs a **Smart Accounting Solution Engine** (IFRS 16, IAS 16, IAS 37, Israeli corporate tax / IAS 12) with a **video and article Content Hub**.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Motion, Lucide and Supabase (Postgres + Auth).

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — see "Demo mode"
npm run dev                  # http://localhost:3000
```

### Demo mode

If the Supabase variables are missing, the site still runs in full: the engine works, and content comes from the bundled seed data in `src/lib/content/seed.ts`. Sign-in, saving and the dashboard are turned off until you connect Supabase.

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the project URL, the publishable (anon) key and the service-role key into `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=...        # only used by the seed script
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Apply the schema. Either paste `supabase/migrations/20261022000000_init.sql` into the **SQL editor**, or use the CLI:

   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```

4. Seed the content library and calculator schemas:

   ```bash
   npm run db:seed
   ```

5. In **Authentication → URL configuration**, set the Site URL to `NEXT_PUBLIC_SITE_URL` and add `http://localhost:3000/auth/confirm` to the redirect URLs. In **Authentication → Email templates**, point the *Confirm signup* and *Reset password* links at:

   ```
   {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type={{ .Type }}
   ```

   The app already sets the redirect to `/auth/confirm?next=…`, so this only adds the token.

   (For local testing you can turn off email confirmation instead.)

6. Restart `npm run dev`.

To attach real recordings, upload them to Supabase Storage (or any CDN) and set `video_url` on the `content` row. Until then, lessons play a simulated timeline so chapters and progress tracking still work. You can also set `NEXT_PUBLIC_DEMO_VIDEO_URL` to one MP4 that every lesson without a recording will play.

## Admin portal (`/admin`)

Analytics dashboard, media library (uploads to Supabase Storage, or YouTube / Vimeo embeds), content editor and scenario presets.

1. Apply `supabase/migrations/20261023000000_admin.sql` the same way as the initial schema. It adds the `role` column on profiles, the `media_assets`, `scenario_presets` and `analytics_events` tables, the public `media` storage bucket, and the `admin_analytics` / `admin_storage` functions.
2. Sign up on the site, then make yourself an admin in the SQL editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

3. Open **מערכת ניהול** from the user menu, or go to `/admin`.

Access is enforced in three places: the proxy (signed-in only), every admin page and Server Action (`requireAdmin` / `assertAdmin`), and the database itself (`public.is_admin()` in every admin policy; users cannot change their own role).

Usage analytics are anonymous: a random id per browser tab, never linked to an account unless the visitor is signed in. Events are sent with `navigator.sendBeacon` to `/api/track`, validated there, and aggregated in the database (`admin_analytics`). Admin pages are not tracked.

## Payments (`BILLING_PROVIDER`)

Plans and prices live in `src/lib/pricing.ts`; access is always read from `public.subscriptions` through `getAccess()`. A payment provider only writes that table — the course pages, lessons and exams area never know it exists. With `BILLING_PROVIDER` unset, payments are off and every "choose a plan" button signs the reader up with the plan noted, as before; manual grants in `/admin/subscriptions` work either way.

**The flow.** `/pricing` (or a paywall, which passes `?from=` — the locked lesson) → `/checkout?plan=…&interval=…` → sign up or in if needed (the forms carry `?next=` back) → the provider's hosted payment page → `/checkout/thanks`, which waits for the webhook and sends the reader back to the lesson they came from. `/profile` shows the plan, the renewal date and the invoices, and lets the reader change plan or cancel; a cancellation keeps the plan open until the end of the period paid for.

**The webhook** is `POST /api/billing/webhook`. It verifies the provider's signature on the raw body (a bad one → 400, nothing stored), normalizes the event to one of `activated`, `renewed`, `plan_changed`, `cancel_scheduled`, `cancel_revoked`, `canceled`, `payment_failed`, `refunded`, and applies it with the service role through `public.apply_billing_event()` — in one transaction that first records the provider's event id in `billing_events`. A repeated delivery is answered 200 as a duplicate and applied once; an event older than the last one applied to the same subscription is ignored as stale. Each charge's invoice link is kept in `invoices` (each reader sees their own).

**Setup**

1. Apply `supabase/migrations/20261102000000_billing.sql` (after the earlier migrations).
2. In `.env.local` (or the host's environment): `SUPABASE_SERVICE_ROLE_KEY`, `BILLING_PROVIDER`, `BILLING_WEBHOOK_SECRET`, and the provider's own keys. No secret is ever in the code.
3. At the provider: set the webhook address to `<NEXT_PUBLIC_SITE_URL>/api/billing/webhook` with the same secret, turn on recurring billing, and turn on **an automatic tax invoice / receipt for every charge** (required in Israel; the provider's invoicing module or its linked invoicing service issues it — the site only keeps the link).

**Developing without a provider.** `BILLING_PROVIDER=sandbox` (any long `BILLING_WEBHOOK_SECRET`) runs a built-in stand-in: a test payment page at `/billing/sandbox` (any card succeeds, a card ending in `0002` is declined), signed webhooks to the real webhook route, test invoices marked as such, and buttons in `/profile` for what the provider would send later (renewal, failed charge, refund, end of period). It refuses to run unless `NEXT_PUBLIC_SITE_URL` is localhost (or `BILLING_SANDBOX_ALLOW_REMOTE=1` on a staging site).

**Adding a real provider.** Write `src/lib/billing/providers/<name>.ts` implementing `PaymentProvider` (`src/lib/billing/types.ts`): `createCheckout` (its hosted payment page, with our user id and plan in the metadata it echoes back), `verifyWebhook` (its signature scheme, and its event types mapped to ours), `cancelAtPeriodEnd` and `changePlan` (its API). Add it to the switch in `src/lib/billing/index.ts`, its keys to `.env.example`, and its webhook samples to `src/lib/billing/billing.test.ts`.

## Scripts

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Development server                                |
| `npm run build`     | Production build                                  |
| `npm start`         | Serve the production build                        |
| `npm test`          | Unit tests, plus the database's rules (RLS, payments) on the real migrations in PGlite |
| `npm run typecheck` | Generate route types and run `tsc`                |
| `npm run lint`      | ESLint                                            |
| `npm run db:seed`   | Upsert seed content and calculator schemas        |

## Project structure

```
src/
  app/                     Routes (App Router)
    page.tsx               Home: hero, featured tools, latest content
    engine/                Smart Accounting Solution Engine (4-step wizard)
    content/               Content library + /content/[slug] lesson page
    dashboard/  profile/   Protected user area
    admin/                 Admin portal: analytics, media, content, presets, settings
    (auth)/                login, register, forgot-password, reset-password
    auth/confirm/          Email-link handler (route handler)
    api/calculators/       JSON API: schemas (GET) and solve (POST)
    api/track/             Usage events (POST, anonymous)
  components/
    engine/                Wizard, field controls, solution dashboard, exports
    video/                 Player with chapters, contextual drawer, resource cards
    content/  dashboard/  home/  auth/  profile/  layout/  ui/
  lib/
    engine/                Calculators (pure TS): schema + solve + validate
    actions/               Server Actions (auth, profile, solutions, history)
    data/                  Server-only data access (content, user data)
    auth/dal.ts            Session verification, requireUser()
    supabase/              Server, public and proxy clients
  proxy.ts                 Session refresh + route protection
supabase/migrations/       Postgres schema with row-level security
scripts/seed.ts            Seed script
```

## How the engine works

Each calculator in `src/lib/engine/calculators/` is a **JSON-serialisable schema** (scenario fields, metric fields, conditional visibility, explainer-video timestamps) plus a `solve()` function. The same schema drives:

- the wizard UI (`components/engine/wizard.tsx`),
- validation on the client, in Server Actions and in the API (`lib/engine/validate.ts`),
- the `accounting_calculators.schema` column in the database.

`solve()` returns the headline, metrics, journal entries (checked to balance), schedule tables, a disclosure note, guidance with paragraph references, and assumptions.

To add a calculator, create a file in `calculators/`, register it in `registry.ts`, add tests to `engine.test.ts` and run `npm run db:seed`.

### API

```bash
curl http://localhost:3000/api/calculators
curl -X POST http://localhost:3000/api/calculators/ifrs-16-leases \
  -H 'content-type: application/json' \
  -d '{"values":{"payment":100,"termYears":5,"discountRate":5,"usefulLife":10}}'
```

Missing fields take their defaults. Invalid inputs return `422` with errors for each field.

## Security notes

- Auth uses Supabase sessions in HTTP-only cookies. `proxy.ts` refreshes the session and gates `/dashboard` and `/profile`. Every page and action also verifies the user itself through `lib/auth/dal.ts`.
- All user tables use row-level security scoped to `auth.uid()`.
- Saved solutions are re-validated and re-computed on the server before they are stored.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix.

## Disclaimer

The outputs are for education and illustration. They are not accounting, audit, legal or tax advice.

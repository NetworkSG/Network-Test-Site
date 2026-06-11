-- Leads from the standalone ad landing page (/match) on the ons-website
-- Supabase project. The page captures name / phone / email only (no
-- qualifying flow), so these get their own slim table instead of the
-- mostly-empty homepage_leads columns. Zapier receives the same lead via
-- the "ad-lp-lead" hook.
--
-- Applied via `supabase db query` (also runnable in the SQL editor).

create table if not exists public.ad_lp_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  -- Which LP captured the lead — future ad-page variants share this table.
  source text not null default '/match',
  created_at timestamptz not null default now()
);

create index if not exists ad_lp_leads_created_at_idx on public.ad_lp_leads (created_at desc);

-- Same policy shape as homepage_leads: the browser inserts with the anon
-- key; only the service role can read.
alter table public.ad_lp_leads enable row level security;

drop policy if exists "allow_anon_insert" on public.ad_lp_leads;
create policy "allow_anon_insert"
  on public.ad_lp_leads for insert
  to anon
  with check (true);

drop policy if exists "allow_service_all" on public.ad_lp_leads;
create policy "allow_service_all"
  on public.ad_lp_leads for all
  to service_role
  using (true)
  with check (true);

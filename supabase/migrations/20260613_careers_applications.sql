-- Applications from the standalone careers landing page (/careers) on the
-- ons-website Supabase project. The page captures name / phone / role /
-- proof-of-work link / "why you" (no email — proof + a call is the funnel),
-- so these get their own table rather than reusing a lead table.
--
-- Applied via `supabase db query` (also runnable in the SQL editor).

create table if not exists public.careers_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  role text not null default '',
  proof_url text not null default '',
  why text not null default '',
  -- Which page captured it — future careers variants share this table.
  source text not null default '/careers',
  created_at timestamptz not null default now()
);

create index if not exists careers_applications_created_at_idx on public.careers_applications (created_at desc);
create index if not exists careers_applications_role_idx on public.careers_applications (role);

-- Same policy shape as ad_lp_leads / homepage_leads: the browser inserts
-- with the anon key; only the service role can read.
alter table public.careers_applications enable row level security;

drop policy if exists "allow_anon_insert" on public.careers_applications;
create policy "allow_anon_insert"
  on public.careers_applications for insert
  to anon
  with check (true);

drop policy if exists "allow_service_all" on public.careers_applications;
create policy "allow_service_all"
  on public.careers_applications for all
  to service_role
  using (true)
  with check (true);

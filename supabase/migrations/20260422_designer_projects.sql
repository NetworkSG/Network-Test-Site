-- Dedicated per-project table on the ons-website Supabase project.
-- Projects previously lived only as a JSONB blob in designer_sections (section='projects').
-- We now dual-write: KV blob (legacy) + this row-per-project table.
--
-- Apply via the Supabase SQL editor on the ons-website project.

create table if not exists public.designer_projects (
  id uuid primary key default gen_random_uuid(),
  designer_slug text not null,
  title text not null default '',
  location text not null default '',
  cost text not null default '',
  size text not null default '',
  size_unit text not null default '',
  year text not null default '',
  property_type text not null default '',
  property_sub_type text not null default '',
  style text not null default '',
  works_included jsonb not null default '[]'::jsonb,
  drive_url text not null default '',
  images jsonb not null default '[]'::jsonb,
  source_url text not null default '',
  variant text not null default 'full',
  contact_email text not null default '',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists designer_projects_slug_idx on public.designer_projects (designer_slug);
create index if not exists designer_projects_submitted_at_idx on public.designer_projects (submitted_at desc);

-- Service role writes; anon reads the designer's own projects by slug.
alter table public.designer_projects enable row level security;

drop policy if exists "designer_projects anon read" on public.designer_projects;
create policy "designer_projects anon read"
  on public.designer_projects for select
  to anon, authenticated
  using (true);

-- No anon write policy — edge functions use the service role key.

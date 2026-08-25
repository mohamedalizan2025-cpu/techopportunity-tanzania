-- =====================================================================
-- TechOpportunity Tanzania - Migration 0001: initial schema
-- Target:  Supabase project "tto-staging"
-- Status:  DRAFT - presented for review; NOT yet applied
-- Rules:   snake_case in the database; camelCase mapping lives ONLY in
--          lib/data/. Location fields are provider-neutral primitives.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Publication/moderation status (mirrors lib/types.ts OpportunityStatus)
-- ---------------------------------------------------------------------
create type opportunity_status as enum ('pending', 'published', 'rejected', 'expired');

-- ---------------------------------------------------------------------
-- 2. Categories - seeded lookup matching OPPORTUNITY_CATEGORIES
-- ---------------------------------------------------------------------
create table public.categories (
  id         smallint generated always as identity primary key,
  slug       text not null unique,
  label      text not null,
  created_at timestamptz not null default now()
);

insert into public.categories (slug, label) values
  ('hackathon',   'Hackathon'),
  ('competition', 'Competition'),
  ('scholarship', 'Scholarship'),
  ('conference',  'Conference'),
  ('workshop',    'Workshop'),
  ('internship',  'Internship'),
  ('fellowship',  'Fellowship'),
  ('grant',       'Grant'),
  ('tech-event',  'Tech Event'),
  ('other',       'Other');

-- ---------------------------------------------------------------------
-- 3. Organizations
-- ---------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  website_url text,
  description text,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Profiles - 1:1 with Supabase Auth users; carries the staff role
--    that powers moderation. Safe to create before auth is ever used.
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role         text not null default 'user'
               check (role in ('user', 'moderator', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

-- ---------------------------------------------------------------------
-- 5. Opportunities
-- ---------------------------------------------------------------------
create table public.opportunities (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null check (char_length(title) between 3 and 200),
  description     text not null check (char_length(description) <= 10000),
  category_id     smallint not null references public.categories (id)
                  on delete restrict,
  organization_id uuid references public.organizations (id)
                  on delete set null,

  url             text not null,
  source_url      text,
  deadline        timestamptz,

  status          opportunity_status not null default 'pending',

  venue_name      text,
  address         text,
  city            text,
  region          text,
  country         text not null default 'Tanzania',
  latitude        numeric(9, 6) check (latitude  between  -90 and  90),
  longitude       numeric(9, 6) check (longitude between -180 and 180),
  constraint coordinates_paired
    check ((latitude is null) = (longitude is null)),

  image_url       text,
  submitted_by    uuid references auth.users (id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index idx_opportunities_published_listing
  on public.opportunities (deadline nulls last, created_at desc)
  where status = 'published';

create index idx_opportunities_category     on public.opportunities (category_id);
create index idx_opportunities_deadline     on public.opportunities (deadline);
create index idx_opportunities_city         on public.opportunities (city);
create index idx_opportunities_region       on public.opportunities (region);
create index idx_opportunities_submitted_by on public.opportunities (submitted_by);

-- ---------------------------------------------------------------------
-- 6. Row Level Security - enabled everywhere from day one
--    Roles: anon (visitors), authenticated (signed-in users),
--    service_role (trusted server code / pipelines; bypasses RLS).
-- ---------------------------------------------------------------------
alter table public.categories    enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.opportunities enable row level security;

create policy "categories are world readable"
  on public.categories for select
  using (true);

create policy "organizations are world readable"
  on public.organizations for select
  using (true);

create policy "staff manage organizations"
  on public.organizations for all
  using (public.is_staff()) with check (public.is_staff());

create policy "users read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "staff read profiles"
  on public.profiles for select
  using (public.is_staff());

create policy "everyone reads published opportunities"
  on public.opportunities for select
  using (status = 'published');

create policy "submitters read own submissions"
  on public.opportunities for select
  using (submitted_by = auth.uid());

create policy "staff read all opportunities"
  on public.opportunities for select
  using (public.is_staff());

create policy "anyone submits pending opportunities"
  on public.opportunities for insert
  with check (
    status = 'pending'
    and (submitted_by is null or submitted_by = auth.uid())
  );

create policy "staff update opportunities"
  on public.opportunities for update
  using (public.is_staff()) with check (public.is_staff());

create policy "staff delete opportunities"
  on public.opportunities for delete
  using (public.is_staff());

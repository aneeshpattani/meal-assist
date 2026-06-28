-- Households
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Home',
  invite_code text unique not null,
  created_at timestamptz default now()
);

-- Link auth.users to a household
create table household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (household_id, user_id)
);

-- Dishes (ingredients stored as jsonb for simplicity)
create table dishes (
  id text not null,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  meal_types text[] not null,
  ingredients jsonb not null default '[]',
  last_cooked timestamptz,
  nutrition_summary jsonb,
  primary key (household_id, id)
);

-- One plan per household
create table weekly_plans (
  household_id uuid primary key references households(id) on delete cascade,
  plan jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- RLS: Enable on all tables
alter table households enable row level security;
alter table household_members enable row level security;
alter table dishes enable row level security;
alter table weekly_plans enable row level security;

-- Helper: get household IDs for current user
create or replace function user_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select household_id from household_members where user_id = auth.uid();
$$;

-- Policies: households
create policy "Members can view their household"
  on households for select
  using (id in (select user_household_ids()));

create policy "Authenticated users can create households"
  on households for insert
  with check (auth.uid() is not null);

-- Policies: household_members
create policy "Members can view their household members"
  on household_members for select
  using (household_id in (select user_household_ids()));

create policy "Authenticated users can join a household"
  on household_members for insert
  with check (user_id = auth.uid());

-- Policies: dishes
create policy "Members can view household dishes"
  on dishes for select
  using (household_id in (select user_household_ids()));

create policy "Members can insert household dishes"
  on dishes for insert
  with check (household_id in (select user_household_ids()));

create policy "Members can update household dishes"
  on dishes for update
  using (household_id in (select user_household_ids()));

create policy "Members can delete household dishes"
  on dishes for delete
  using (household_id in (select user_household_ids()));

-- Policies: weekly_plans
create policy "Members can view household plan"
  on weekly_plans for select
  using (household_id in (select user_household_ids()));

create policy "Members can insert household plan"
  on weekly_plans for insert
  with check (household_id in (select user_household_ids()));

create policy "Members can update household plan"
  on weekly_plans for update
  using (household_id in (select user_household_ids()));

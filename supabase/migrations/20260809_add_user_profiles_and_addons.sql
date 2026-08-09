create table if not exists public.sitebrief_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  company_name text not null default '',
  website text not null default '',
  default_client_type text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.sitebrief_user_profiles enable row level security;
grant select,insert,update on public.sitebrief_user_profiles to authenticated;
revoke all on public.sitebrief_user_profiles from anon;
drop policy if exists "user profiles read own" on public.sitebrief_user_profiles;
create policy "user profiles read own" on public.sitebrief_user_profiles for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "user profiles insert own" on public.sitebrief_user_profiles;
create policy "user profiles insert own" on public.sitebrief_user_profiles for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "user profiles update own" on public.sitebrief_user_profiles;
create policy "user profiles update own" on public.sitebrief_user_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create table if not exists public.sitebrief_addons (
  user_id uuid not null references auth.users(id) on delete cascade,
  addon text not null check(addon in ('own_api_keys')),
  status text not null default 'active' check(status in ('active','trialing','past_due','canceled')),
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,addon)
);
alter table public.sitebrief_addons enable row level security;
grant select on public.sitebrief_addons to authenticated;
revoke all on public.sitebrief_addons from anon;
revoke insert,update,delete on public.sitebrief_addons from authenticated;
drop policy if exists "addons read own" on public.sitebrief_addons;
create policy "addons read own" on public.sitebrief_addons for select to authenticated using ((select auth.uid())=user_id);

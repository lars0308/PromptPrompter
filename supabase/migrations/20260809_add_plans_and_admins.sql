create table if not exists public.sitebrief_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','ultimate')),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sitebrief_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.sitebrief_subscriptions enable row level security;
alter table public.sitebrief_admins enable row level security;
revoke all on public.sitebrief_subscriptions, public.sitebrief_admins from anon;
revoke insert, update, delete on public.sitebrief_subscriptions, public.sitebrief_admins from authenticated;
grant select on public.sitebrief_subscriptions, public.sitebrief_admins to authenticated;

drop policy if exists "subscriptions read own" on public.sitebrief_subscriptions;
create policy "subscriptions read own" on public.sitebrief_subscriptions for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "admins read own" on public.sitebrief_admins;
create policy "admins read own" on public.sitebrief_admins for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.sitebrief_create_free_subscription()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  insert into public.sitebrief_subscriptions(user_id) values(new.id) on conflict do nothing;
  return new;
end;$$;
revoke all on function public.sitebrief_create_free_subscription() from public,anon,authenticated;
drop trigger if exists sitebrief_auth_user_free_plan on auth.users;
create trigger sitebrief_auth_user_free_plan after insert on auth.users
for each row execute function public.sitebrief_create_free_subscription();

insert into public.sitebrief_subscriptions(user_id)
select id from auth.users on conflict do nothing;

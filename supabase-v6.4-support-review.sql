-- Prompt.ai v6.4: Support-Anfragen und einmalige 3,99-EUR-Pruefung
-- Einmal im Supabase SQL Editor ausfuehren.

create table if not exists public.sitebrief_support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'technical' check (category in ('technical','billing','account','feedback')),
  subject text not null check (char_length(subject) between 4 and 120),
  message text not null check (char_length(message) between 15 and 3000),
  status text not null default 'open' check (status in ('open','in_progress','answered','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sitebrief_support_user_created_idx
  on public.sitebrief_support_requests(user_id, created_at desc);

alter table public.sitebrief_support_requests enable row level security;
revoke all on table public.sitebrief_support_requests from anon;
grant select, insert on table public.sitebrief_support_requests to authenticated;

drop policy if exists "sitebrief support create own" on public.sitebrief_support_requests;
create policy "sitebrief support create own" on public.sitebrief_support_requests
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "sitebrief support read own" on public.sitebrief_support_requests;
create policy "sitebrief support read own" on public.sitebrief_support_requests
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.sitebrief_review_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 0 check (credits >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.sitebrief_review_purchases (
  purchase_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now()
);

alter table public.sitebrief_review_purchases enable row level security;
revoke all on table public.sitebrief_review_purchases from anon, authenticated;

alter table public.sitebrief_review_credits enable row level security;
revoke all on table public.sitebrief_review_credits from anon;
revoke insert, update, delete on table public.sitebrief_review_credits from authenticated;
grant select on table public.sitebrief_review_credits to authenticated;

drop policy if exists "sitebrief review credits read own" on public.sitebrief_review_credits;
create policy "sitebrief review credits read own" on public.sitebrief_review_credits
  for select to authenticated using (auth.uid() = user_id);

drop function if exists public.sitebrief_add_review_credit(uuid,integer);
create or replace function public.sitebrief_add_review_credit(p_user_id uuid, p_purchase_id text, p_amount integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_total integer; inserted_count integer;
begin
  if p_user_id is null or nullif(trim(p_purchase_id),'') is null or p_amount < 1 or p_amount > 20 then
    raise exception 'Invalid credit request';
  end if;
  insert into public.sitebrief_review_purchases(purchase_id,user_id,credits)
  values (p_purchase_id,p_user_id,p_amount)
  on conflict (purchase_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    select credits into new_total from public.sitebrief_review_credits where user_id=p_user_id;
    return coalesce(new_total,0);
  end if;
  insert into public.sitebrief_review_credits(user_id, credits, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update
    set credits = public.sitebrief_review_credits.credits + excluded.credits,
        updated_at = now()
  returning credits into new_total;
  return new_total;
end;
$$;

create or replace function public.sitebrief_use_review_credit()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare remaining integer;
begin
  update public.sitebrief_review_credits
  set credits = credits - 1, updated_at = now()
  where user_id = auth.uid() and credits > 0
  returning credits into remaining;
  if remaining is null then raise exception 'No review credit available'; end if;
  return remaining;
end;
$$;

revoke all on function public.sitebrief_add_review_credit(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.sitebrief_add_review_credit(uuid,text,integer) to service_role;
revoke all on function public.sitebrief_use_review_credit() from public, anon;
grant execute on function public.sitebrief_use_review_credit() to authenticated;

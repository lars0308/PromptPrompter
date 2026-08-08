-- SiteBrief V6.2: per-user AI connections stored in Supabase Vault
create table if not exists public.sitebrief_ai_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gateway','openai','gemini')),
  vault_secret_id uuid not null,
  last4 text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.sitebrief_ai_connections drop constraint if exists sitebrief_ai_connections_provider_check;
alter table public.sitebrief_ai_connections add constraint sitebrief_ai_connections_provider_check check (provider in ('gateway','openai','gemini'));

alter table public.sitebrief_ai_connections enable row level security;
revoke all on table public.sitebrief_ai_connections from anon;
revoke insert, update, delete on table public.sitebrief_ai_connections from authenticated;
grant select on table public.sitebrief_ai_connections to authenticated;

drop policy if exists "sitebrief ai connections read own" on public.sitebrief_ai_connections;
create policy "sitebrief ai connections read own"
on public.sitebrief_ai_connections
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.sitebrief_set_ai_connection(p_provider text, p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
declare
  v_user uuid := (select auth.uid());
  v_existing uuid;
  v_secret_id uuid;
  v_name text;
  v_last4 text;
begin
  if v_user is null then raise exception 'Nicht angemeldet'; end if;
  if p_provider not in ('gateway','openai','gemini') then raise exception 'Unbekannter KI-Anbieter'; end if;
  if p_secret is null or length(trim(p_secret)) < 8 then raise exception 'API-Key ist zu kurz'; end if;

  select vault_secret_id into v_existing
  from public.sitebrief_ai_connections
  where user_id = v_user and provider = p_provider;

  v_name := 'sitebrief-ai:' || v_user::text || ':' || p_provider;
  v_last4 := right(trim(p_secret), 4);

  if v_existing is null then
    v_secret_id := vault.create_secret(trim(p_secret), v_name, 'SiteBrief ' || p_provider || ' API key', null);
  else
    perform vault.update_secret(v_existing, trim(p_secret), v_name, 'SiteBrief ' || p_provider || ' API key', null);
    v_secret_id := v_existing;
  end if;

  insert into public.sitebrief_ai_connections(user_id, provider, vault_secret_id, last4, updated_at)
  values (v_user, p_provider, v_secret_id, v_last4, now())
  on conflict (user_id, provider) do update
  set vault_secret_id = excluded.vault_secret_id,
      last4 = excluded.last4,
      updated_at = now();

  return jsonb_build_object('provider',p_provider,'last4',v_last4,'connected',true);
end;
$$;

create or replace function public.sitebrief_get_ai_connection_secret(p_provider text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
declare
  v_user uuid := (select auth.uid());
  v_secret_id uuid;
  v_secret text;
begin
  if v_user is null then raise exception 'Nicht angemeldet'; end if;
  if p_provider not in ('gateway','openai','gemini') then raise exception 'Unbekannter KI-Anbieter'; end if;

  select vault_secret_id into v_secret_id
  from public.sitebrief_ai_connections
  where user_id = v_user and provider = p_provider;

  if v_secret_id is null then return null; end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where id = v_secret_id;

  return v_secret;
end;
$$;

create or replace function public.sitebrief_delete_ai_connection(p_provider text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
declare
  v_user uuid := (select auth.uid());
  v_secret_id uuid;
begin
  if v_user is null then raise exception 'Nicht angemeldet'; end if;
  if p_provider not in ('gateway','openai','gemini') then raise exception 'Unbekannter KI-Anbieter'; end if;

  select vault_secret_id into v_secret_id
  from public.sitebrief_ai_connections
  where user_id = v_user and provider = p_provider;

  delete from public.sitebrief_ai_connections
  where user_id = v_user and provider = p_provider;

  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;
  return true;
end;
$$;

revoke all on function public.sitebrief_set_ai_connection(text,text) from public, anon;
revoke all on function public.sitebrief_get_ai_connection_secret(text) from public, anon;
revoke all on function public.sitebrief_delete_ai_connection(text) from public, anon;
grant execute on function public.sitebrief_set_ai_connection(text,text) to authenticated;
grant execute on function public.sitebrief_get_ai_connection_secret(text) to authenticated;
grant execute on function public.sitebrief_delete_ai_connection(text) to authenticated;

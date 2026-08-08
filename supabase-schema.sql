-- SiteBrief V6 schema
-- Apply to a dedicated Supabase project.

create table if not exists public.sitebrief_system_profiles (
  id text primary key,
  name text not null,
  description text not null default '',
  config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.sitebrief_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  active_profile_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.sitebrief_profiles (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  description text not null default '',
  config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.sitebrief_templates (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  tag text not null default '',
  summary text not null default '',
  prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.sitebrief_modules (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  tag text not null default '',
  summary text not null default '',
  prompt text not null,
  activation text not null default 'manual' check (activation in ('always','default','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.sitebrief_agent_skills (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  agent text not null default 'all',
  trigger text not null default '',
  prompt text not null,
  source_file text,
  activation text not null default 'manual' check (activation in ('always','default','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.sitebrief_projects (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  title text not null default 'Unbenanntes Projekt',
  status text not null default 'draft' check (status in ('draft','complete','archived')),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists sitebrief_profiles_user_idx on public.sitebrief_profiles(user_id);
create index if not exists sitebrief_templates_user_idx on public.sitebrief_templates(user_id);
create index if not exists sitebrief_modules_user_idx on public.sitebrief_modules(user_id);
create index if not exists sitebrief_skills_user_idx on public.sitebrief_agent_skills(user_id);
create index if not exists sitebrief_projects_user_updated_idx on public.sitebrief_projects(user_id, updated_at desc);

alter table public.sitebrief_system_profiles enable row level security;
alter table public.sitebrief_user_settings enable row level security;
alter table public.sitebrief_profiles enable row level security;
alter table public.sitebrief_templates enable row level security;
alter table public.sitebrief_modules enable row level security;
alter table public.sitebrief_agent_skills enable row level security;
alter table public.sitebrief_projects enable row level security;

-- System profiles: signed-in users may read, clients may not modify.
drop policy if exists "sitebrief system profiles read" on public.sitebrief_system_profiles;
create policy "sitebrief system profiles read" on public.sitebrief_system_profiles
for select to authenticated using (true);

-- Per-user tables.
drop policy if exists "sitebrief settings own rows" on public.sitebrief_user_settings;
create policy "sitebrief settings own rows" on public.sitebrief_user_settings
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sitebrief profiles own rows" on public.sitebrief_profiles;
create policy "sitebrief profiles own rows" on public.sitebrief_profiles
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sitebrief templates own rows" on public.sitebrief_templates;
create policy "sitebrief templates own rows" on public.sitebrief_templates
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sitebrief modules own rows" on public.sitebrief_modules;
create policy "sitebrief modules own rows" on public.sitebrief_modules
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sitebrief skills own rows" on public.sitebrief_agent_skills;
create policy "sitebrief skills own rows" on public.sitebrief_agent_skills
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sitebrief projects own rows" on public.sitebrief_projects;
create policy "sitebrief projects own rows" on public.sitebrief_projects
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Explicit Data API grants. RLS remains the authorization layer.
grant select on public.sitebrief_system_profiles to authenticated;
grant select, insert, update, delete on public.sitebrief_user_settings to authenticated;
grant select, insert, update, delete on public.sitebrief_profiles to authenticated;
grant select, insert, update, delete on public.sitebrief_templates to authenticated;
grant select, insert, update, delete on public.sitebrief_modules to authenticated;
grant select, insert, update, delete on public.sitebrief_agent_skills to authenticated;
grant select, insert, update, delete on public.sitebrief_projects to authenticated;

-- Private Storage bucket for screenshots, logos and moodboards.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sitebrief-references', 'sitebrief-references', false, 6291456, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=false, file_size_limit=6291456, allowed_mime_types=array['image/png','image/jpeg','image/webp'];

drop policy if exists "sitebrief reference upload" on storage.objects;
create policy "sitebrief reference upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'sitebrief-references'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "sitebrief reference read" on storage.objects;
create policy "sitebrief reference read" on storage.objects
for select to authenticated
using (
  bucket_id = 'sitebrief-references'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "sitebrief reference update" on storage.objects;
create policy "sitebrief reference update" on storage.objects
for update to authenticated
using (
  bucket_id = 'sitebrief-references'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'sitebrief-references'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "sitebrief reference delete" on storage.objects;
create policy "sitebrief reference delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'sitebrief-references'
  and owner_id = (select auth.uid()::text)
);

-- Seeded system profiles stay centrally managed and cannot be deleted from the app.
insert into public.sitebrief_system_profiles (id,name,description,config,is_default,sort_order) values
('system-standard','Standard','Geführter Standarddurchlauf mit Qualitäts- und Rechtschecks.',
 '{"mode":"guided","targetAgent":"codex","engine":"local","conceptCount":5,"settings":{"aiClarifications":true,"maxQuestions":4,"criticalBehavior":"block","askMissing":true,"askConflict":true,"askInfeasible":true,"suggestAlternatives":true,"legalRegion":"Deutschland / EU","checks":{"privacy":true,"imprint":true,"legal":true,"accessibility":true,"security":true,"performance":true,"seo":false},"noInventLegal":true,"finalChecklist":true}}'::jsonb,true,10),
('system-fast','Schneller Entwurf','Weniger Rückfragen und drei Vorschauen für schnelle Ideen.',
 '{"mode":"auto","targetAgent":"codex","engine":"local","conceptCount":3,"settings":{"aiClarifications":true,"maxQuestions":2,"criticalBehavior":"warn","askMissing":true,"askConflict":true,"askInfeasible":true,"suggestAlternatives":true,"legalRegion":"Deutschland / EU","checks":{"privacy":true,"imprint":true,"legal":true,"accessibility":true,"security":true,"performance":true,"seo":false},"noInventLegal":true,"finalChecklist":true}}'::jsonb,false,20)
on conflict (id) do update set name=excluded.name, description=excluded.description, config=excluded.config, is_default=excluded.is_default, sort_order=excluded.sort_order;


-- ===== SiteBrief V6.2 AI Connections =====
-- SiteBrief V6.2: per-user AI connections stored in Supabase Vault
create table if not exists public.sitebrief_ai_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gateway','openai')),
  vault_secret_id uuid not null,
  last4 text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

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
  if p_provider not in ('gateway','openai') then raise exception 'Unbekannter KI-Anbieter'; end if;
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
  if p_provider not in ('gateway','openai') then raise exception 'Unbekannter KI-Anbieter'; end if;

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
  if p_provider not in ('gateway','openai') then raise exception 'Unbekannter KI-Anbieter'; end if;

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

-- Which plans a system AI serves. Three profiles per task and plan give a first, second and third
-- choice (ordered by priority), and a higher plan can point at stronger models without the visitor
-- ever seeing a model picker. Existing profiles keep serving every plan, so nothing changes until
-- an administrator narrows one down.
alter table public.sitebrief_system_ai_profiles
  add column if not exists plans text[] not null default '{free,pro,ultimate}'::text[];

alter table public.sitebrief_system_ai_profiles
  drop constraint if exists sitebrief_system_ai_profiles_plans_check;
alter table public.sitebrief_system_ai_profiles
  add constraint sitebrief_system_ai_profiles_plans_check
  check (plans <@ '{free,pro,ultimate}'::text[] and array_length(plans,1) >= 1);

create index if not exists sitebrief_system_ai_profiles_plans_idx
  on public.sitebrief_system_ai_profiles using gin (plans);

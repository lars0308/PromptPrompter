-- Editable master prompts. Every prompt area (concepts, review, website build, free prompt, image
-- preview) keeps its built-in default in code; a row here overrides it. Versions are kept so a
-- prompt can be reworked next to the running one and switched over — or rolled back — from the
-- admin console without a deploy.
create table if not exists public.sitebrief_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  label text not null default '',
  body text not null,
  version integer not null default 1,
  active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sitebrief_prompt_templates_key_idx
  on public.sitebrief_prompt_templates(prompt_key, version desc);
-- At most one active version per area; everything else is a draft or an old version.
create unique index if not exists sitebrief_prompt_templates_active_idx
  on public.sitebrief_prompt_templates(prompt_key) where active;

-- Prompts are read and written by the server with the service role only. Nothing here is exposed
-- to logged-in users: the wording of the master prompts is not user data.
alter table public.sitebrief_prompt_templates enable row level security;
revoke all on public.sitebrief_prompt_templates from anon, authenticated;

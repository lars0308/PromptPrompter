-- Token accounting. Until now a usage event only knew provider, model, duration and success, so
-- there was no way to say what a project actually costs. Every text model reports its token counts
-- in the response; they are stored per event here. Image runs report none and stay at zero.
alter table public.sitebrief_usage_events
  add column if not exists prompt_tokens integer not null default 0,
  add column if not exists completion_tokens integer not null default 0,
  add column if not exists total_tokens integer not null default 0;

create index if not exists sitebrief_usage_events_tokens_idx
  on public.sitebrief_usage_events(created_at desc) where total_tokens > 0;

alter table public.sitebrief_usage_events add column if not exists duration_ms integer;
alter table public.sitebrief_usage_events add column if not exists error_message text not null default '';
alter table public.sitebrief_usage_events add column if not exists project_name text not null default '';
alter table public.sitebrief_usage_events add column if not exists project_type text not null default '';
alter table public.sitebrief_usage_events add column if not exists project_goal text not null default '';
create index if not exists sitebrief_usage_events_success_created_idx on public.sitebrief_usage_events(success,created_at desc);

-- Monthly token budget per plan. 0 means "no limit" - that is the deliberate default, because a
-- budget invented before real numbers exist would throttle accounts for no reason. Once a limit is
-- set and reached, requests are not blocked: the routing drops to the cheapest AI of that plan
-- until the counter resets.
alter table public.sitebrief_quota_limits
  add column if not exists monthly_tokens integer not null default 0;

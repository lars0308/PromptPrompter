-- Whose key paid for this call. 'account' = the visitor's own connection, so it must not count
-- against the token budget and only counts half against the countable monthly quotas.
alter table public.sitebrief_usage_events
  add column if not exists key_source text not null default 'system';

-- Own API keys are sold per slot: one bought slot, one provider you may store. The quantity of the
-- Stripe subscription item is mirrored here, so the app knows how many slots an account holds.
alter table public.sitebrief_addons
  add column if not exists quantity integer not null default 1;

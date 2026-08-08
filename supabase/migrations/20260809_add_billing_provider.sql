alter table public.sitebrief_subscriptions
  add column if not exists provider text;

create unique index if not exists sitebrief_subscriptions_provider_customer_idx
  on public.sitebrief_subscriptions(provider_customer_id)
  where provider_customer_id is not null;

create unique index if not exists sitebrief_subscriptions_provider_subscription_idx
  on public.sitebrief_subscriptions(provider_subscription_id)
  where provider_subscription_id is not null;

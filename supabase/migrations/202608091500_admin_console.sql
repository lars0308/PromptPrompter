create table if not exists public.sitebrief_user_admin_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  suspended_until timestamptz,
  suspension_reason text not null default '',
  admin_note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.sitebrief_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  level text not null default 'info' check (level in ('info','success','warning','critical')),
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sitebrief_public_offers (
  id text primary key default 'main',
  enabled boolean not null default false,
  eyebrow text not null default '',
  title text not null default '',
  description text not null default '',
  cta_label text not null default 'Kostenlos testen',
  trial_days integer not null default 0 check (trial_days between 0 and 365),
  discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  stripe_coupon_id text,
  ends_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.sitebrief_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  provider text not null default '',
  model text not null default '',
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists sitebrief_usage_events_user_created_idx on public.sitebrief_usage_events(user_id,created_at desc);
create index if not exists sitebrief_announcements_active_idx on public.sitebrief_announcements(active,starts_at,ends_at);
create index if not exists sitebrief_announcements_created_by_idx on public.sitebrief_announcements(created_by);
create index if not exists sitebrief_public_offers_updated_by_idx on public.sitebrief_public_offers(updated_by);

create table if not exists public.sitebrief_admin_audit (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sitebrief_admin_audit_admin_idx on public.sitebrief_admin_audit(admin_user_id,created_at desc);
create index if not exists sitebrief_admin_audit_target_idx on public.sitebrief_admin_audit(target_user_id,created_at desc);

alter table public.sitebrief_user_admin_state enable row level security;
alter table public.sitebrief_announcements enable row level security;
alter table public.sitebrief_public_offers enable row level security;
alter table public.sitebrief_usage_events enable row level security;
alter table public.sitebrief_admin_audit enable row level security;

revoke all on public.sitebrief_user_admin_state,public.sitebrief_announcements,public.sitebrief_public_offers,public.sitebrief_usage_events,public.sitebrief_admin_audit from anon,authenticated;
grant all on public.sitebrief_user_admin_state,public.sitebrief_announcements,public.sitebrief_public_offers,public.sitebrief_usage_events,public.sitebrief_admin_audit to service_role;
grant usage,select on sequence public.sitebrief_usage_events_id_seq to service_role;
grant usage,select on sequence public.sitebrief_admin_audit_id_seq to service_role;

insert into public.sitebrief_public_offers(id) values('main') on conflict(id) do nothing;

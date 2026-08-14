-- Extra tokens for a single account, on top of its plan budget. The plan budget is the rule; this
-- is the exception an administrator can grant from the token area when one account legitimately
-- needs more this month. It is added to the limit, so the saver downgrade starts later - it never
-- unlocks a feature the plan does not have.
alter table public.sitebrief_user_admin_state
  add column if not exists monthly_token_bonus integer not null default 0;

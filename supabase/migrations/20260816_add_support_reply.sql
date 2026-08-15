-- Support-Anfragen kamen an, aber es gab keinen Weg zurueck: der Absender sah nie eine Antwort,
-- und beantwortet wurde ausserhalb der App per privater Mail. Die Antwort gehoert an die Anfrage.
alter table if exists public.sitebrief_support_requests
  add column if not exists reply text not null default '',
  add column if not exists replied_at timestamptz;

-- Lesen darf sie nur, wer die Anfrage gestellt hat; geschrieben wird ausschliesslich
-- serverseitig ueber die Service-Rolle (api/admin-action.js).
drop policy if exists "sitebrief_support_own_read" on public.sitebrief_support_requests;
create policy "sitebrief_support_own_read" on public.sitebrief_support_requests
  for select using (auth.uid() = user_id);

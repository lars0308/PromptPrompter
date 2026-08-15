-- Ein wiederholter Textanfang kostet beim Anbieter nur einen Bruchteil. Ob das greift, laesst sich
-- nur an seiner Abrechnung ablesen - also wird die Zahl mitgeschrieben statt geschaetzt.
alter table if exists public.sitebrief_usage_events
  add column if not exists cached_tokens integer not null default 0;

-- Das Gedaechtnis je Kunde: kurze Notizen, die bei jedem Lauf mitgehen, damit er nicht jedes Mal
-- dasselbe erklaeren muss. Bewusst eine Spalte an den Einstellungen und keine eigene Tabelle -
-- so gilt dieselbe Zugriffsregel, und der Kunde sieht, aendert und loescht sie im Profil.
alter table if exists public.sitebrief_user_settings
  add column if not exists memory text not null default '';

comment on column public.sitebrief_user_settings.memory is
  'Vorlieben des Kunden, die bei jedem Lauf mitgehen. Gehoert dem Kunden: er sieht, bearbeitet und loescht sie im Profil. Keine Projektinhalte anderer Kunden.';

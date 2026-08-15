-- Ist das Monatsbudget aufgebraucht, laeuft alles weiter, nur auf der guenstigeren KI. Welche das
-- ist, hat der Ablauf bisher geraten: er drehte die Kette einfach um und nahm den letzten Eintrag.
-- Der letzte Eintrag ist aber der Notausgang - und der ist bewusst das robusteste, nicht das
-- billigste Modell. Die Kostenbremse griff damit nach dem teuersten Modell im ganzen Aufbau.
--
-- Welche KI die Sparwahl ist, gehoert nicht erraten, sondern hingeschrieben.
alter table if exists public.sitebrief_system_ai_profiles
  add column if not exists saver boolean not null default false;

comment on column public.sitebrief_system_ai_profiles.saver is
  'Bei aufgebrauchtem Monatsbudget zuerst versuchen. Mehrere pro Tarif sind erlaubt, es gilt die Reihenfolge nach priority.';

# SiteBrief V6

Geführter Website-Konzept- und Master-Prompt-Builder mit optionaler Supabase-Cloud. V6 führt von einer kurzen Projektbeschreibung über Referenzen, Agent, eigene Module/Skills und 3–5 Vorschauen bis zum finalen agentenspezifischen Master-Prompt.

## V6 neu

- Supabase Auth für geräteübergreifende Nutzung
- Cloud-Sync für Einstellungen, eigene Profile, Prompt-Vorlagen, Module, Agent-Skills und Projekte
- Systemprofile bleiben zentral erhalten und können nur gelesen/dupliziert werden
- eigene Profile können gespeichert, angewendet und gelöscht werden
- Standard-Generator-KI, Standardmodell, Standard-Agent, Modus und Anzahl der Vorschauen in Einstellungen
- Module und Skills mit drei Zuständen: `Immer aktiv`, `Standard`, `Manuell`
- automatisches Speichern des aktuellen Wizard-Stands
- private Supabase-Storage-Ablage für Referenzbilder
- lokale Nutzung bleibt vollständig als Fallback erhalten

## Ablauf

1. **Projekt** — kurz beschreiben, was entstehen soll.
2. **Referenzen** — Website-URLs, Screenshots, Fotos, Logos oder Moodboards.
3. **Agent** — Ziel-Agent und Generator-KI getrennt auswählen; externe KI darf bei fehlenden/widersprüchlichen Angaben Gegenfragen stellen.
4. **Module & Skills** — eigene Prompt-Vorlage, Module und Agent-Skills aktivieren.
5. **Konzept** — strukturiertes Blueprint und Designregler prüfen.
6. **Vorschauen** — 3 bis 5 strukturell unterschiedliche Richtungen erzeugen.
7. **Feinschliff** — ausgewählte Richtung gezielt verändern.
8. **Master-Prompt** — finalen Prompt für Claude Code, Codex, Gemini, ChatGPT, Cursor, v0 oder Universal erzeugen.

## Profile

### Systemprofile

Die Migration legt zunächst zwei zentrale Profile an:

- **Standard** — geführt, 5 Vorschauen, strenge Qualitäts-/Rechtschecks
- **Schneller Entwurf** — Auto-Modus, 3 Vorschauen, weniger Rückfragen

Systemprofile können von normalen Nutzern gelesen, aber nicht geändert oder gelöscht werden. Ein Systemprofil kann in der Oberfläche dupliziert und anschließend als eigenes Profil genutzt werden.

### Eigene Profile

Ein eigenes Profil speichert unter anderem:

- Standard-Agent
- Standard-Generator
- Standardmodell
- Geführt / Auto / Experte
- Anzahl Vorschauen
- Prüf-/Rechtsregeln
- aktuell gewählte Module und Skills

## Module & Skills als Standard

Unter **Einstellungen** kann jeder eigene Eintrag einen Aktivierungsmodus bekommen:

- **Immer aktiv** — wird automatisch aktiviert und kann im Projekt nicht versehentlich abgewählt werden.
- **Standard** — startet bei neuen Projekten aktiv, kann aber abgewählt werden.
- **Manuell** — bleibt aus, bis der Nutzer ihn bewusst aktiviert.

## Globale Pflichtprüfungen

Standardmäßig aktiv:

- Datenschutz
- Impressum / Anbieterangaben
- rechtliche Plausibilität
- Barrierefreiheit
- Sicherheit
- Performance

SEO-Grundlagen sind optional. Der Rechtsraum ist einstellbar (Standard: Deutschland / EU). Rechtliche Texte, Unternehmensdaten und Konformitätsbehauptungen sollen nicht erfunden werden.

## Supabase einrichten

V6 sollte ein eigenes Supabase-Projekt verwenden und nicht mit einer anderen App-Datenbank vermischt werden.

1. Neues Supabase-Projekt erstellen.
2. `supabase-schema.sql` als Migration anwenden.
3. Auf Vercel setzen:

```text
SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. In Supabase Auth die gewünschte Site URL / Redirect URL für das Vercel-Deployment setzen.
5. Deployment neu starten.

Die App lädt die Verbindung über `/api/config`. Der Publishable Key darf im Browser verwendet werden; ein `service_role`/Secret Key wird **nirgendwo im Frontend benötigt oder gespeichert**.

### Datenmodell

```text
sitebrief_system_profiles   zentral, read-only für angemeldete Nutzer
sitebrief_user_settings     globale Einstellungen pro Nutzer
sitebrief_profiles          eigene Arbeitsprofile
sitebrief_templates         eigene Prompt-Vorlagen
sitebrief_modules           eigene Prompt-Module
sitebrief_agent_skills      eigene Agent-Skills
sitebrief_projects          gespeicherte Wizard-Projekte
sitebrief-references        privater Storage-Bucket für Bilder
```

Alle nutzerbezogenen Tabellen haben RLS. Der Browser bekommt ausschließlich Zugriff auf Zeilen, deren `user_id` der angemeldeten Supabase-User-ID entspricht. Der Storage-Bucket ist privat und auf den eigenen User-Ordner beschränkt.

## Auth

V6 nutzt E-Mail + Passwort. Je nach Supabase-Auth-Einstellung muss eine neue E-Mail-Adresse zuerst bestätigt werden. Supabase verwaltet die Session im Browser; SiteBrief speichert keine Passwörter selbst.

## Generator-KI

### Lokal

Kostenlos und ohne API. Der komplette Workflow funktioniert, aber Referenzbilder werden nicht semantisch durch ein Modell analysiert.

### Vercel AI Gateway

```text
AI_GATEWAY_API_KEY=...
AI_GATEWAY_MODEL=...
```

### OpenAI direkt

```text
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

Die geheimen KI-Schlüssel bleiben ausschließlich serverseitig. In den SiteBrief-Einstellungen werden nur Provider/Modell als Standard gespeichert.

## Stripe-Abonnements

Für Pro, Ultimate und das optionale API-Key-Add-on werden in Vercel folgende Variablen benötigt:

```text
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ULTIMATE_PRICE_ID=price_...
STRIPE_API_KEYS_PRICE_ID=price_...
SUPABASE_SERVICE_ROLE_KEY=...
APP_URL=https://prompt-prompter.vercel.app
```

Das Produkt hinter `STRIPE_API_KEYS_PRICE_ID` kostet 5,99 € monatlich. Der Stripe-Webhook zeigt auf `/api/stripe-webhook` und benötigt die Ereignisse `checkout.session.completed`, `customer.subscription.updated` und `customer.subscription.deleted`.

## Admin-Verwaltung

Nach Anwendung der Migration `supabase/migrations/202608091500_admin_console.sql` erhalten eingetragene Administratoren einen zusätzlichen Menüpunkt **Verwaltung**. Dort stehen Kennzahlen, Benutzer- und Tarifverwaltung, Sperren, Passwort-Reset-Mails, öffentliche Mitteilungen sowie Testphasen- und Rabattaktionen zur Verfügung.

Den ersten Administrator legst du einmalig im Supabase SQL Editor an:

```sql
insert into public.sitebrief_admins (user_id)
select id from auth.users where email = 'DEINE-ADMIN-EMAIL'
on conflict do nothing;
```

Testtage werden direkt in neue Stripe-Checkout-Abos übernommen. Für einen automatisch angewendeten Rabatt muss in der Verwaltung zusätzlich eine gültige Stripe-Coupon-ID hinterlegt werden. Ohne Coupon-ID wird der Prozentwert nur als Information zur Aktion gespeichert.

Alternativ kann die Aktion direkt am Stripe-Preis aus `STRIPE_PRO_PRICE_ID` über Metadaten gepflegt werden. SiteBrief übernimmt sie automatisch in Banner und Checkout, solange keine aktive Aktion in der Adminverwaltung Vorrang hat:

```text
trial_days=14
discount_percent=20
coupon_id=coupon_...
offer_enabled=true
offer_title=Pro 14 Tage kostenlos testen
offer_description=Danach monatlich kündbar.
offer_eyebrow=KOSTENLOS TESTEN
offer_cta=Kostenlos testen
offer_ends_at=2026-09-30T21:59:59Z
```

Die Adminverwaltung kann Stripe-Abos zum Laufzeitende kündigen und die letzte bezahlte Rechnung nach einer Sicherheitsabfrage vollständig erstatten. Nutzungsdaten enthalten Projektname, Art, Ziel, Anbieter, Modell, Laufzeit und Fehlerstatus; vollständige vertrauliche Prompttexte werden bewusst nicht gespeichert.

## Lokal starten

```bash
python -m http.server 8080
```

Ohne Vercel-API-Routen läuft SiteBrief lokal und zeigt die Cloud als nicht verbunden. Der lokale Generator und alle lokalen Bibliotheken funktionieren weiterhin.

## Dateien

```text
index.html            Wizard + Einstellungen + Login/Profile UI
styles.css            UI und responsive Layouts
app.js                Workflow, Profile, Autosave, Prompt-Compiler
cloud.js              Supabase Auth/Data/Storage Client
supabase-schema.sql   Tabellen, RLS, Storage-Policies, Systemprofile
api/config.js         liefert URL + Publishable Key an den Browser
api/generate.js       KI-Prüfung, Gegenfragen, Konzepte, Refinement
admin-console.js      geschützte Admin-Oberfläche und öffentliche Aktionsbanner
api/models.js         Vercel AI Gateway Modellliste
vercel.json           Deployment-Konfiguration
KI-SETUP.md           KI-Einrichtung
```

## Sicherheit

- kein Supabase `service_role`/Secret Key im Browser
- RLS auf allen exponierten SiteBrief-Tabellen
- User-Zeilen über `auth.uid()` getrennt
- privater Referenz-Bucket
- Systemprofile im Client nur lesbar
- OpenAI-/Gateway-Secrets nur als Vercel Environment Variables
- rechtliche Prüfung ist eine Entwicklungs-Checkliste und ersetzt keine Rechtsberatung


## Shared Supabase project
This build is linked to the existing `Stundennachweis app` Supabase project. SiteBrief uses only `sitebrief_*` tables plus the private `sitebrief-references` storage bucket. A migration-created allowlist protects the pre-existing Stundennachweis tables so future SiteBrief users do not automatically gain access to business data.

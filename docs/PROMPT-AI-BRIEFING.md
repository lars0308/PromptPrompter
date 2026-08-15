# Prompt.ai — Briefing & Zusammenfassung

*Stand: 16. August 2026 · prompt-ai.app*

---

## 1. Was es ist

Prompt.ai verwandelt eine formlose Idee in einen vollständigen, widerspruchsfreien Arbeitsauftrag für eine KI. Der Nutzer beschreibt in ein paar Sätzen, was entstehen soll. Am Ende hält er einen **Master-Prompt** in den Händen, dazu Seitenstruktur, gesicherte Fakten und ein Übergabepaket — im Format der KI, mit der er arbeitet.

Der Kern ist nicht „noch ein KI-Chat", sondern die Lücke davor: **Die meisten KI-Ergebnisse sind schlecht, weil der Auftrag schlecht war.** Prompt.ai stellt die Rückfragen, die ein guter Dienstleister stellen würde, bevor gebaut wird.

**Positionierung:** Damit die KI beim ersten Mal das Richtige baut.
**Zielgruppe:** Menschen mit einem konkreten Projekt — Handwerksbetriebe, kleine Dienstleister, Selbstständige, Agenturen — nicht Prompt-Bastler.

---

## 2. Der Ablauf

**Beschreiben → Rückfragen beantworten → Richtung wählen → Auftrag mitnehmen**

1. **Konsole.** Ein Textfeld, vier Arbeitsarten: Internetseite erstellen, Freier Prompt, Website überarbeiten, Projekt prüfen. Anhänge über das Plus: Bild, Datei, Link. Jeder Anhang wird vor der Übernahme geprüft.
2. **Prüfung.** Die KI liest Beschreibung, Referenzen und Unterlagen und stellt 2–6 Rückfragen — nur solche, deren Antwort das Ergebnis verändert. Widersprüche werden benannt, nicht machbare Punkte als Blocker markiert.
3. **Gestaltungsfragen.** Höchstens zwei, und nur wo der Auftrag eine Richtung andeutet: bei Farbe kommen 2–4 fertige Paletten mit Wirkung und Hex-Werten (als Farbpunkte anklickbar), bei Aufbau und Navigation konkrete Varianten. Wo der Auftrag schweigt, bringt die Prüfung gekennzeichnete eigene Vorschläge ein.
4. **Drei Richtungen.** Kostenlos als HTML-Vorschau, ab Pro als echte KI-Bilder.
5. **Feinschliff.** In normalen Worten sagen, was anders werden soll.
6. **Master-Prompt.** Für Claude in XML-Abschnitten (`<role>`, `<context>`, `<task>`, `<rules>`, `<definition_of_done>`), für alle anderen kompaktes Markdown. Dazu das Übergabe-ZIP.

### Die drei Abläufe

| Ablauf | Was er tut | Wer ihn hat |
|---|---|---|
| **Mit Rückfragen** | Fragt nur nach, wo es das Ergebnis ändert | alle |
| **Ohne Rückfragen** | Briefing rein, Prompt raus | ab Pro |
| **Selbst einstellen** | Jeder Schritt bleibt offen | Ultimate |

---

## 3. Ziel-KI

Codex, Claude Code, Gemini, ChatGPT, Cursor, v0, Universal — **in jedem Tarif frei wählbar**. Es ist immer genau eine aktiv; sie bestimmt drei Dinge:

- **Format des Master-Prompts** — XML für Claude, kompaktes Markdown für alle anderen
- **Welche Skills** zur Wahl stehen (die der Ziel-KI plus die globalen)
- **Welche Anweisungsdatei** im Übergabepaket liegt

Die Anweisungsdatei ist der Punkt, den andere Werkzeuge übersehen: Jedes KI-Werkzeug sucht sein Projektgedächtnis woanders.

| Ziel-KI | Datei im Paket |
|---|---|
| Codex, ChatGPT, Universal, v0 | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| Gemini | `GEMINI.md` |
| Cursor | `AGENTS.md` + `.cursor/rules/prompt-ai.mdc` |

Sie wiederholt den Auftrag nicht, sondern nennt die Lesereihenfolge und die verbindlichen Punkte.

---

## 4. Was im Übergabe-ZIP liegt

- `MASTER-PROMPT.md` — der Auftrag
- `SEITENSTRUKTUR.md` — welche Seiten entstehen, was auf jede gehört
- `PROJEKT-QUELLEN.md` — gesicherte Fakten, Referenzen, Unterlagen
- `BLUEPRINT.json` — maschinenlesbarer Projektstand
- `PROJEKTBERICHT.md` — was entschieden wurde und warum
- Anweisungsdatei der Ziel-KI
- `AUSGEWAEHLTE-VORSCHAU.jpg`, `bilder/`, `unterlagen/`
- **Ab Pro:** `KUNDENBRIEFING.md` und `UEBERGABE.md` als Fließtext — weitergabefähig an den Kunden

---

## 5. Tarife

| | Kostenlos | Pro · 20,99 € | Ultimate · 54,99 € |
|---|---|---|---|
| Freie Prompts | 10 | 100 | 500 |
| Website-Projekte | 3 | 25 | 100 |
| KI-Bildvorschauen | – (HTML) | 50 | 250 |
| Echter KI-Durchlauf | 1 im Monat | unbegrenzt | unbegrenzt |
| Abläufe | Mit Rückfragen | + Ohne Rückfragen | + Selbst einstellen |
| Ziel-KI | alle | alle | alle |
| Bibliothek (Vorlagen, Module, Skills) | – | je 10 | ohne Grenze |
| Kundenbriefing & Übergabe | – | ✓ | ✓ |
| Website überarbeiten | – | ✓ | ✓ |
| Probelauf (wirklich bauen) | – | – | ✓ · 15/Monat |
| Quellcode-Vorschau (Sandbox) | – | 20/Monat | 60/Monat |
| ZIP-Export & GitHub | – | – | ✓ |
| Eigene KI-Verbindungen | – | 5,99 € dazu | 2 inklusive |
| Eigene Aufrufe zählen | – | halb | halb |
| Marken-/Projektprofile | – | 1 | beliebig |
| Projektstände | 10 | 60 | ohne Grenze |
| Referenzen | 1 Link | 3 Links + 3 Bilder | 5 + 5 |
| Vorrang bei Verarbeitung | 20/min | 45/min | 90/min |
| **Monatsvorrat** | 0,15 Mio | 2,5 Mio | 6 Mio |

### Zusatzkäufe

- **Eigene KI-Verbindungen** — 5,99 €/Monat: eigener Anbieter, eigenes Modell, eigene Version. Eigene Aufrufe zählen nur halb aufs Kontingent.
- **Monatsvorrat auffüllen** — 7,99 € für 750.000 Einheiten (≈ 16 Projektläufe). Einmalig, ohne Abo, in jedem Tarif, beliebig oft.

Alle Preise kommen **live aus Stripe**. Preisänderung dort = Änderung in der App, ohne Deployment.

---

## 6. Der Monatsvorrat

Intern zählen wir Tokens plus einen festen Gegenwert für Bilder (5.000 je Bild) und Rechenzeit (10.000 je Sandbox-Lauf). Nach außen sieht der Nutzer davon nichts:

- **Balken und ein Satz:** „Noch 78 % · reicht für etwa 19 Projekte"
- **Beim Schreiben:** „Dieser Auftrag verbraucht etwa 2 % deines Monats"
- **Bei 15 %:** einmal pro Sitzung eine Meldung oben am Rand
- **Bei 0 %:** kein Stopp — bezahlte Tarife laufen auf einem kleineren Modell weiter, kostenlos geht es lokal weiter

Grobe Kostenwerte je Aktion: Projektlauf ~45.000 · freier Prompt ~4.000 · Bildvorschau-Durchlauf ~20.000 · Probelauf ~50.000 · Sandbox ~10.000.

---

## 7. Funktionen im Überblick

**Konsole & Ablauf** — vier Arbeitsarten, Anhänge mit Prüfung, Settings-Fenster (Ziel-KI, Ablauf, Vorlage, Skills), Projektstände mit Wiederherstellung, letztes Projekt fortsetzen.

**Prüfung & Qualität** — KI-Rückfragen mit anklickbaren Antwortvorschlägen, Pflichtprüfungen (Datenschutz, Impressum, Barrierefreiheit, Sicherheit, Performance, SEO), Anti-Slop-Regeln im Prompt, „keine erfundenen Fakten"-Regel mit Quellenpflicht.

**Bibliothek (ab Pro)** — eigene Prompt-Vorlagen, Module und Agent-Skills; Import aus vorhandenen `AGENTS.md`-, `CLAUDE.md`-, `GEMINI.md`- oder `SKILL.md`-Dateien. In den Settings die zehn meistgenutzten, der Rest hinter „Mehr …".

**Ausgabe** — Master-Prompt im Format der Ziel-KI, Übergabe-ZIP, Kundenbriefing und Übergabeprotokoll (ab Pro), ZIP-Export und GitHub-Veröffentlichung (Ultimate).

**Probelauf (Ultimate)** — das Briefing wird wirklich gebaut und angezeigt; Projektauswahl aus den gespeicherten Ständen.

**Quellcode-Vorschau (ab Pro)** — ZIP mit `package.json` wird in einer isolierten Maschine gebaut und live angezeigt (Next.js, React, Vite, Astro).

**Konto & Einstellungen** — Registrierung mit Name, Firma, Kundentyp und Sprache; Design, Startmodus, bevorzugte Ziel-KI, Ausgabesprache; eigene KI-Verbindungen; GitHub-Verbindung; Rückfragen-Regeln; Projektprüfung.

**Support** — Formular in der App, Eingangsbestätigung, eigener Verlauf mit Antwort. In der Verwaltung: Antwortfeld je Anfrage, Stand springt auf „beantwortet", Hinweispunkt bei Ungelesenem.

**Verwaltung (nur Betreiber)** — Nutzer und Abos, Nutzung und Tokens, Kontingente je Tarif, System-KI-Ketten je Aufgabe und Tarif, alle Prompt-Texte editierbar mit Versionsverlauf und Hinweis bei geändertem Standardtext, Aktionen und Mitteilungen, Wartungsmodus, **Tarif-Ansicht** zum Testen als Free/Pro/Ultimate.

---

## 8. Sicherheit

| Bereich | Stand |
|---|---|
| **Schlüssel** | Ausschließlich serverseitig. Eigene Keys verschlüsselt in Supabase Vault. Kein Geheimnis im Browser, kein `NEXT_PUBLIC_`-Schlüssel. |
| **Endpunkte** | Jeder KI-Endpunkt tarifgeprüft, größenbegrenzt (600 KB) und ratenbegrenzt. Gäste enger als Angemeldete. |
| **Zahlung** | Stripe-Webhook mit HMAC-Signaturprüfung. Keine Kartendaten in der App. |
| **Datenbank** | Row-Level-Security; Service-Rolle nur serverseitig. Support-Anfragen liest nur, wer sie gestellt hat. |
| **Anhänge** | Endung, Größe (max. 12 MB) und Dateisignatur werden geprüft. Eine umbenannte Programmdatei fällt durch. |
| **Fremde Inhalte** | Referenzen, importierte Seiten und Unterlagen gelten im Prompt ausdrücklich als Daten, nicht als Anweisungen. |
| **Fehlerbericht** | Nur Meldung, Datei, Zeile — keine Eingaben, keine Projektinhalte, höchstens fünf pro Sitzung. |
| **Kostenschutz** | Monatsvorrat als Bremse; Probelauf und Sandbox zusätzlich pro Konto gedeckelt. |
| **Recht** | Impressum, Datenschutz mit allen Auftragsverarbeitern, Nutzungsbedingungen, Widerrufsbelehrung mit Muster-Formular, Zustimmung zum sofortigen Leistungsbeginn vor jedem Kauf (als Zeitpunkt bei Stripe hinterlegt), Cookie-Einwilligung jederzeit widerrufbar. |

---

## 9. Technik

- **Frontend:** statische Seite ohne Framework, rund 60 JavaScript-Dateien, auf Vercel
- **Backend:** Vercel-Funktionen unter `/api`
- **Daten & Anmeldung:** Supabase
- **Zahlung:** Stripe (Abos, Einmalkäufe, Kundenportal)
- **KI:** Vercel AI Gateway, OpenAI, Gemini, Cloudflare Workers AI — Reihenfolge je Aufgabe und Tarif in der Verwaltung einstellbar
- **Bauen:** Vercel Sandbox (isolierte MicroVM)
- **Tests:** 283 Quelltext-Prüfungen (`npm test`) und 9 echte Browser-Durchläufe (`npm run e2e`)

---

## 10. Was vor dem Start noch zu tun ist

**In Stripe** — vier Produkte mit `lookup_key`:

| Produkt | Typ | lookup_key | Preis |
|---|---|---|---|
| Pro | wiederkehrend, monatlich | `prompt_ai_pro` | 20,99 € |
| Ultimate | wiederkehrend, monatlich | `prompt_ai_ultimate` | 54,99 € |
| Eigene KI-Verbindungen | wiederkehrend, monatlich | `prompt_ai_own_api_keys` | 5,99 € |
| Monatsvorrat auffüllen | einmalig | `prompt_ai_top_up` | 7,99 € |

Dazu: Webhook auf `https://www.prompt-ai.app/api/stripe-webhook` mit `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Kleinunternehmer-Einstellung (keine Umsatzsteuer, §19-Hinweis). Verkaufsländer zunächst auf Deutschland begrenzen.

**In Vercel:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, die KI-Schlüssel. Optional die vier `STRIPE_*_PRICE_ID`.

**In der Verwaltung:** Monatsbudgets eintragen (Free 150.000 · Pro 2.500.000 · Ultimate 6.000.000) — ohne sie greift der Vorrats-Mechanismus nicht. System-KI-Kette prüfen. Rechtstexte: alle eckigen Klammern füllen.

**Hosting:** Vercel Pro (Hobby ist nicht für kommerzielle Nutzung) und Supabase Pro (Free pausiert nach 7 Tagen ohne Zugriff) — spätestens ab dem ersten zahlenden Kunden.

**Datenbank:** Migration `20260816_add_support_reply.sql` einspielen.

**Gewerbe:** Tätigkeit beim Gewerbeamt um Softwarevertrieb erweitern. Umsatzsteuer bei digitalen Leistungen ins EU-Ausland mit dem Steuerberater klären. *(Keine Rechts- oder Steuerberatung — Orientierung.)*

---

## 11. Offene Punkte in der Entwicklung

- **Stylesheets zusammenführen** — vier Ebenen liegen übereinander; die schlimmste Pauschalregel ist entschärft, die Zusammenführung steht aus. Ein bis zwei Tage, jetzt mit Testnetz.
- **Team-Zugänge für Ultimate** — mehrere Personen an einem Projekt. Braucht Projekte teilen, Rechte, Einladungen, neue Zugriffsregeln.
- **Wochenpass** — 7 Tage Pro als Einmalkauf. Braucht einen befristeten Tarif; ein halber bis ganzer Tag.
- **Hilfeseite** — die fünf häufigsten Fragen, sobald bekannt ist, welche das sind.
- **E-Mail-Benachrichtigung** bei neuen Support-Anfragen — braucht einen Mailversand-Dienst, der noch nicht eingerichtet ist.

---

## 12. Vermarktung

**Der stärkste Kanal ist der eigene Hintergrund.** Wer aus dem Handwerk kommt, erreicht eine Zielgruppe, die kein Marketing-Mensch erreicht: Betriebe, die eine Website brauchen und nicht wissen, wie sie das einer KI erklären.

1. **Communities** — Facebook-Gruppen für Selbstständige und Handwerker, r/selbststaendig, Meister-Foren. Nicht werben, sondern Ergebnisse zeigen: „So habe ich meine eigene Website mit KI gemacht, hier der Auftrag, den ich ihr gegeben habe."
2. **Vorher-Nachher** — schlechte KI-Anfrage, schlechtes Ergebnis; dann der Prompt.ai-Auftrag und das gute Ergebnis. Der überzeugendste Inhalt, den dieses Produkt hat.
3. **Kurzvideos** (TikTok, Reels, 30–60 s) — Bildschirmaufnahme: tippen, Rückfragen, drei Richtungen, fertiger Prompt.
4. **Ein gutes YouTube-Video** — „Website mit KI bauen: der Fehler, den alle machen." Zwölf Minuten, echtes Projekt. Arbeitet jahrelang weiter.
5. **Keine bezahlte Werbung am Anfang.** Erst wenn die Signale zeigen, dass Master-Prompts tatsächlich mitgenommen werden, lässt sich sagen, was ein Klick kosten darf.

**Nicht empfehlenswert:** monatelang alles kostenlos anbieten. Wer drei Monate umsonst bekommt, empfindet den Preis danach als Verschlechterung — und die KI-Rechnung läuft die ganze Zeit mit. Besser: Tarife von Tag eins sichtbar, dazu sieben Testtage für Pro über die Aktion in der Verwaltung.

**Woran sich Erfolg ablesen lässt:** Die App zählt drei Momente ohne jeden Inhalt — Master-Prompt kopiert, Übergabe geladen, Ziel-KI geöffnet. Bleiben diese Zahlen über Wochen bei null, ist das die Antwort. Steigen sie, ebenso.

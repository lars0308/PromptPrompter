# Prompt.ai — Briefing & Zusammenfassung

*Stand: 17. August 2026 · prompt-ai.app*

**Neu in diesem Stand**

- **KI-Auswahl auf die aktuelle Generation umgestellt.** Google schaltet Gemini 2.5 Flash und Pro zum 16. Oktober 2026 ab — darauf liefen sechs der Routen. Die bisherigen Modelle bleiben als Netz dahinter stehen.
- **Ein abgeschaltetes Modell wirft nichts mehr um.** Vorher galt „Modell existiert nicht" als endgültiger Fehler und die Kette brach ab, obwohl drei Ersatzwege danebenstanden.
- **Die Kostenbremse bremst jetzt wirklich.** Bei aufgebrauchtem Budget griff der Ablauf nach dem letzten Eintrag der Kette — dem Notausgang, also dem teuersten Modell. Die Sparwahl steht jetzt am Profil.
- **Die Gestaltung liegt in einer Datei statt in vierunddreißig Skripten.** Dabei kam ein alter Fehler ans Licht: ein nie geschlossener Regelblock hatte einen ganzen Abschnitt unwirksam gemacht — der Browser las 143 Regeln statt 1337.
- **Support-Antworten und Monatsbudgets sind in der Datenbank scharf geschaltet.** Die Budgets standen auf 0, wodurch Balken, Sparmodus und der freie KI-Durchlauf wirkungslos waren.
- **Der Zwischenspeicher der Anbieter wird genutzt und gemessen.** Der Regeltext am Anfang jeder Anfrage ist immer derselbe und kostet wiederholt nur einen Bruchteil — aber nicht von allein.
- **Prompt.ai merkt sich Vorlieben je Kunde.** Ein kurzer Zettel im Profil, den der Kunde selbst sieht, ändert und löscht.
- **Die Ansprache stimmt jetzt mit der Ausgabe überein.** Die Startseite versprach Handwerksbetriebe, geliefert wird ein ZIP mit `CLAUDE.md` und Cursor-Rules. Sie spricht jetzt Entwickler und Agenturen an — der stärkste Punkt aus dem externen Gutachten.
- **Ein Preis, der nicht aus Stripe kommt, sagt es.** Vorher fiel die App still auf den fest hinterlegten Betrag zurück; ein Tippfehler in einer Kennung blieb dadurch unbemerkt.
- **Die Tarif-Ansicht ist aus dem Hauptmenü in die Verwaltung gewandert.** Sie stand zwischen Bibliothek und Abonnement, also dort, wo jeder andere Eintrag zu einer Funktion des Produkts führt.

*Abschnitt 14 nennt offen, was wir selbst als schwach ansehen.*

---

## 1. Was es ist

Prompt.ai verwandelt eine formlose Idee in einen vollständigen, widerspruchsfreien Arbeitsauftrag für eine KI. Der Nutzer beschreibt in ein paar Sätzen, was entstehen soll. Am Ende hält er einen **Master-Prompt** in den Händen, dazu Seitenstruktur, gesicherte Fakten und ein Übergabepaket — im Format der KI, mit der er arbeitet.

Der Kern ist nicht „noch ein KI-Chat", sondern die Lücke davor: **Die meisten KI-Ergebnisse sind schlecht, weil der Auftrag schlecht war.** Prompt.ai stellt die Rückfragen, die ein guter Dienstleister stellen würde, bevor gebaut wird.

**Positionierung:** Damit die KI beim ersten Mal das Richtige baut.

**Zielgruppe:** Entwickler, Web-Agenturen und alle, die täglich mit Claude Code, Codex oder Cursor arbeiten.

Das war lange nicht deckungsgleich mit den Texten. Die Startseite sprach Handwerksbetriebe und kleine Dienstleister an, während am Ende ein ZIP mit `AGENTS.md`, XML-Abschnitten und Cursor-Rules herauskommt — wer das verwerten kann, ist Entwickler oder Agenturinhaber. Ein Dachdecker bekäme damit ein Lastenheft, keine Website. Ein externes Gutachten nannte das den fundamentalen Konstruktionsfehler; tatsächlich war es ein Textproblem. Die Ansprache ist umgestellt, die Beispiele haben die Sicht gewechselt: nicht mehr „Dönerladen in Hannover", sondern „Kundenprojekt: Dachdecker in Lindhorst" oder „Relaunch für einen Bestandskunden".

**Die Branchen bleiben trotzdem drin** — sie füttern die Branchenerkennung, die dem Prompt die Pflichtbereiche eines Gewerks mitgibt. Nur steht der Kunde jetzt richtig darin: als der, der baut.

**Was Prompt.ai bewusst nicht ist:** kein Hosting und kein Veröffentlichungsdienst. Der fertige Code wird vom Kunden selbst weitergegeben — zu GitHub, Vercel oder wohin er will. Das hält uns aus Ausfällen, Domains und Haftung für fremde Seiten heraus.

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

### Welche KI dahinter arbeitet

Die Ziel-KI ist, wofür der Auftrag gebaut wird. Wer ihn *baut*, hängt am Tarif und ist in der Verwaltung einstellbar — je Aufgabe eine eigene Kette aus Erstwahl, Ausweich und Notausgang.

| Aufgabe | Kostenlos | Pro | Ultimate |
|---|---|---|---|
| Projekt analysieren | Qwen 3 30B | Gemini 3.1 Flash-Lite | Gemini 3.6 Flash |
| Rückfragen stellen | Qwen 3 30B | Gemini 3.6 Flash | Claude Sonnet 5 |
| Master-Prompt & Website | Qwen 3 30B | Claude Haiku 4.5 | Claude Sonnet 5 |
| Ergebnisse auswerten | Qwen 3 30B | Gemini 3.1 Flash-Lite | Gemini 3.1 Flash-Lite |
| Bilder | — | Gemini 3.1 Flash Image → Flux 2 Klein | GPT-Image-2 → Flux 2 Max → Flux 2 Pro |

Hinter jeder Erstwahl stehen drei weitere Stufen. Fällt eine aus — Störung, Abrechnung, Abschaltung —, rutscht die Anfrage auf die nächste, ohne dass der Kunde etwas merkt. Ganz hinten steht ein Notausgang direkt bei Google und Cloudflare, am Gateway vorbei.

**Warum das so gewählt ist:** Claude schreibt lange, streng gegliederte Dokumente am zuverlässigsten — deshalb baut er den Master-Prompt. Analysieren und Auswerten sind Fleißarbeit ohne Publikum; dafür genügt das billigste brauchbare Modell. Ein Projektlauf kostet uns damit rund 5 Cent in Pro und rund 13 Cent in Ultimate.

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

Die Preise kommen **live aus Stripe** — Änderung dort, Änderung in der App, ohne Deployment. Pro, die eigenen KI-Verbindungen und der Monatsvorrat funktionieren so. Bei **Ultimate** hakt es an einem Tippfehler in der Kennung; Einzelheiten in Abschnitt 10. Die Verwaltung zeigt im Überblick, welcher Preis wirklich live kommt und welcher auf den fest hinterlegten Betrag zurückfällt.

---

## 6. Der Monatsvorrat

Intern zählen wir Tokens plus einen festen Gegenwert für Bilder (5.000 je Bild) und Rechenzeit (10.000 je Sandbox-Lauf). Nach außen sieht der Nutzer davon nichts:

- **Balken und ein Satz:** „Noch 78 % · reicht für etwa 19 Projekte"
- **Beim Schreiben:** „Dieser Auftrag verbraucht etwa 2 % deines Monats"
- **Bei 15 %:** einmal pro Sitzung eine Meldung oben am Rand
- **Bei 0 %:** kein Stopp — bezahlte Tarife laufen auf einem kleineren Modell weiter, kostenlos geht es lokal weiter

Welches Modell das kleinere ist, steht am Profil („Sparwahl") und nicht im Ratespiel. Das war ein echter Fehler: Vorher nahm der Ablauf einfach den letzten Eintrag der Kette — und das ist der Notausgang, also bewusst das robusteste und damit teuerste Modell. Die Kostenbremse machte einen Lauf teurer statt günstiger.

Grobe Kostenwerte je Aktion: Projektlauf ~45.000 · freier Prompt ~4.000 · Bildvorschau-Durchlauf ~20.000 · Probelauf ~50.000 · Sandbox ~10.000.

---

## 7. Funktionen im Überblick

**Konsole & Ablauf** — vier Arbeitsarten, Anhänge mit Prüfung, Settings-Fenster (Ziel-KI, Ablauf, Vorlage, Skills), Projektstände mit Wiederherstellung, letztes Projekt fortsetzen.

**Prüfung & Qualität** — KI-Rückfragen mit anklickbaren Antwortvorschlägen, Pflichtprüfungen (Datenschutz, Impressum, Barrierefreiheit, Sicherheit, Performance, SEO), Anti-Slop-Regeln im Prompt, „keine erfundenen Fakten"-Regel mit Quellenpflicht.

**Bibliothek (ab Pro)** — eigene Prompt-Vorlagen, Module und Agent-Skills; Import aus vorhandenen `AGENTS.md`-, `CLAUDE.md`-, `GEMINI.md`- oder `SKILL.md`-Dateien. In den Settings die zehn meistgenutzten, der Rest hinter „Mehr …".

**Ausgabe** — Master-Prompt im Format der Ziel-KI, Übergabe-ZIP, Kundenbriefing und Übergabeprotokoll (ab Pro), ZIP-Export und GitHub-Veröffentlichung (Ultimate).

**Probelauf (Ultimate)** — das Briefing wird wirklich gebaut und angezeigt; Projektauswahl aus den gespeicherten Ständen.

**Quellcode-Vorschau (ab Pro)** — ZIP mit `package.json` wird in einer isolierten Maschine gebaut und live angezeigt (Next.js, React, Vite, Astro).

**Gedächtnis (im Profil)** — ein kurzer Zettel je Kunde, der bei jedem Projekt mitgeht: „Baue Next.js, nie Vite", „keine Verläufe", „meine Kunden sind meist lokale Betriebe". Damit sinkt der Rückfrageaufwand mit jedem Projekt. Der Kunde sieht, ändert und löscht ihn selbst; er wird nie im Hintergrund befüllt. Serverseitig gilt er ausdrücklich als Geschmacksangabe und kann keine Auftragsvorgabe, Pflichtprüfung oder Sicherheitsregel aushebeln — bei Widerspruch gilt die Projektbeschreibung.

**Konto & Einstellungen** — Registrierung mit Name, Firma, Kundentyp und Sprache; Design, Startmodus, bevorzugte Ziel-KI, Ausgabesprache; eigene KI-Verbindungen; GitHub-Verbindung; Rückfragen-Regeln; Projektprüfung.

**Support** — Formular in der App, Eingangsbestätigung, eigener Verlauf mit Antwort. In der Verwaltung: Antwortfeld je Anfrage, Stand springt auf „beantwortet", Hinweispunkt bei Ungelesenem.

**Verwaltung (nur Betreiber)** — Nutzer und Abos, Nutzung und Tokens, Kontingente je Tarif, System-KI-Ketten je Aufgabe und Tarif (inklusive Sparwahl je Profil), alle Prompt-Texte editierbar mit Versionsverlauf und Hinweis bei geändertem Standardtext, Aktionen und Mitteilungen, Wartungsmodus. Im Überblick zusätzlich: **Preisherkunft** — kommt jeder Preis live aus Stripe oder aus dem Notnagel — und die **Tarif-Ansicht**, mit der sich die App als Free, Pro oder Ultimate ansehen lässt. Sie schaltet nur die Oberfläche um; abgerechnet wird weiter über den echten Tarif.

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
| **Kostenschutz** | Monatsvorrat als Bremse mit ausdrücklicher Sparwahl; Probelauf und Sandbox zusätzlich pro Konto gedeckelt. |
| **Ausfall eines Modells** | Ein abgeschaltetes oder umbenanntes Modell lässt die Kette weiterlaufen statt abzubrechen. Eine Beanstandung an der Eingabe landet weiterhin sofort beim Kunden. |
| **Recht** | Impressum, Datenschutz mit allen Auftragsverarbeitern, Nutzungsbedingungen, Widerrufsbelehrung mit Muster-Formular, Zustimmung zum sofortigen Leistungsbeginn vor jedem Kauf (als Zeitpunkt bei Stripe hinterlegt), Cookie-Einwilligung jederzeit widerrufbar. |

---

## 9. Technik

- **Frontend:** statische Seite ohne Framework, rund 60 JavaScript-Dateien, auf Vercel
- **Gestaltung:** drei Stylesheets in fester Reihenfolge — `styles.css`, `promptai-ui-layers.css`, `promptai-full-app-design.css`
- **Backend:** Vercel-Funktionen unter `/api`
- **Daten & Anmeldung:** Supabase
- **Zahlung:** Stripe (Abos, Einmalkäufe, Kundenportal)
- **KI:** Vercel AI Gateway, OpenAI, Gemini, Cloudflare Workers AI — Reihenfolge je Aufgabe und Tarif in der Verwaltung einstellbar
- **Bauen:** Vercel Sandbox (isolierte MicroVM)
- **Tests:** 297 Quelltext-Prüfungen (`npm test`) und 9 echte Browser-Durchläufe (`npm run e2e`)

---

## 10. Was vor dem Start noch zu tun ist

**In Stripe.** Geprüft wurde die Sandbox — das Live-Konto war aus der Entwicklungsumgebung nicht einsehbar, dort muss dasselbe noch einmal getan werden.

| Produkt | Kennung | Stand |
|---|---|---|
| Pro · 20,99 € / Monat | `prompt_ai_pro` | ✅ live |
| Eigene KI-Verbindungen · 5,99 € / Monat | `prompt_ai_own_api_keys` | ✅ live |
| Monatsvorrat · 7,99 € einmalig | `prompt_ai_top_up` | ✅ live |
| Ultimate · 54,99 € / Monat | `prompt_ai_ultimate**w**` | ❌ Tippfehler — das `w` muss weg |

Der Tippfehler ist der einzige Blocker. Solange er dasteht, findet die App den Ultimate-Preis nicht über die Kennung, fällt auf die Suche über Kennzeichen und Namen zurück, findet dort **zwei** aktive Ultimate-Preise (54,99 € und einen alten 0-€-Preis) und nimmt am Ende den fest hinterlegten Betrag. Angezeigt wird zufällig das Richtige — mitwandern tut es nicht.

Danach aufräumen, damit der Katalog eindeutig bleibt:

- **Ultimate, 0,00 € / Monat** — archivieren
- **Pro, „Testangebot für 7 Tage", 0,00 €** — archivieren (den Test besser als `trial_period_days` am Pro-Preis führen)
- **3,99-€-Einzelkauf** (`single_review`) — archivieren, sonst stehen zwei Einmalkäufe nebeneinander

Zuletzt die Produktnamen: sie heißen teilweise noch „SiteBrief" und stehen so auf Rechnung und Kundenportal.

Dazu: Webhook auf `https://www.prompt-ai.app/api/stripe-webhook` mit `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Kleinunternehmer-Einstellung (keine Umsatzsteuer, §19-Hinweis). Verkaufsländer zunächst auf Deutschland begrenzen.

**In Vercel:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, die KI-Schlüssel. Optional die vier `STRIPE_*_PRICE_ID`.

Für die Support-Benachrichtigung zusätzlich: `SUPPORT_NOTIFY_TO` (deine Adresse) und entweder `RESEND_API_KEY` oder `MAIL_WEBHOOK_URL`. Fehlen sie, läuft alles weiter — nur ohne Mail.

**In der Verwaltung:** Rechtstexte — alle eckigen Klammern füllen. Monatsbudgets und System-KI-Kette sind eingetragen. Einmal prüfen: ob die Modellnamen `google/gemini-3.1-flash-lite`, `google/gemini-3.6-flash` und `anthropic/claude-sonnet-5` im Vercel AI Gateway wirklich so heißen („Modelle laden" im KI-Studio). Heißen sie anders, arbeitet die App auf der Stufe dahinter weiter — nur eben nicht auf der gewünschten.

**Hosting:** Vercel Pro (Hobby ist nicht für kommerzielle Nutzung) und Supabase Pro (Free pausiert nach 7 Tagen ohne Zugriff) — spätestens ab dem ersten zahlenden Kunden.

**Datenbank:** alles eingespielt — Support-Antwort, Sparwahl, gemessener Zwischenspeicher und das Gedächtnis je Kunde. Hier steht nichts mehr offen.

**Gewerbe:** Tätigkeit beim Gewerbeamt um Softwarevertrieb erweitern. Umsatzsteuer bei digitalen Leistungen ins EU-Ausland mit dem Steuerberater klären. *(Keine Rechts- oder Steuerberatung — Orientierung.)*

---

## 11. Was ein Lauf kostet und was bleibt

Die Zahlen sind Schätzungen aus den Listenpreisen der Anbieter, kein gemessener Monat — dafür fehlt noch echter Betrieb. Ein Projektlauf heißt: analysieren, Rückfragen stellen, Master-Prompt schreiben.

| | Kostenlos | Pro | Ultimate |
|---|---|---|---|
| Einnahme im Monat | 0 € | 20,99 € | 54,99 € |
| Kosten je Projektlauf | ~0,5 Cent | ~5 Cent | ~13 Cent |
| Läufe im Monatsvorrat | ~3 | ~55 | ~133 |
| KI-Kosten bei vollem Vorrat | ~0,15 € | ~2,90 € | ~17 € |
| Bilder bei vollem Kontingent | – | ~1,50 € | ~10 € |
| Stripe-Gebühr | – | ~0,90 € | ~1,20 € |
| **Bleibt ungefähr** | **–** | **~16 €** | **~27 €** |

Dazu kommen die Festkosten: Vercel Pro und Supabase Pro, zusammen rund 45 € im Monat. Die sind ab etwa **drei zahlenden Pro-Kunden** gedeckt.

**Die Bremsen, die das absichern:**

- Der **Monatsvorrat** in Tokens ist die Hauptbremse. Ist er leer, wird nicht gesperrt, sondern auf die Sparwahl umgeschaltet.
- **Bilder, Probeläufe und Sandbox-Läufe** sind zusätzlich pro Konto gedeckelt — sie kosten pro Stück und wären über Tokens allein schlecht zu fassen.
- **Der Zwischenspeicher** senkt den wiederholten Regeltext auf einen Bruchteil. Wie viel wirklich ankommt, wird gemessen und steht in der Verwaltung.

**Der ungedeckte Fall:** Ein kostenloses Konto bekommt einen echten KI-Durchlauf im Monat. Das kostet uns rund einen halben Cent und ist bewusst so — ohne ihn sieht ein kostenloses Konto nie, was das Produkt kann.

---

## 12. Offene Punkte in der Entwicklung

- **Team-Zugänge für Ultimate** — mehrere Personen an einem Projekt. Braucht Projekte teilen, Rechte, Einladungen, neue Zugriffsregeln.
- **Wochenpass** — 7 Tage Pro als Einmalkauf. Braucht einen befristeten Tarif; ein halber bis ganzer Tag.
- **Hilfeseite** — die fünf häufigsten Fragen, sobald bekannt ist, welche das sind.
- **KI-Werkbank** — der Auftrag wird gleich in der App gebaut, mit wenigen Korrekturrunden und Vorschau über die vorhandene Sandbox. Schließt die Lücke zwischen Lastenheft und Ergebnis, ohne dass wir hosten. Ein bis zwei Wochen.
- **Nach dem 16. Oktober 2026** — Google schaltet Gemini 2.5 Flash und Pro ab. Die App ist umgestellt, die alten Modelle stehen nur noch als Netz dahinter. Danach lassen sie sich ersatzlos entfernen.

---

## 13. Vermarktung

**Mit der Zielgruppe hat sich der Kanal geändert.** Entwickler und Agenturen sind woanders unterwegs als Handwerksbetriebe, und sie reagieren auf anderes: nicht auf Werbung, sondern auf gezeigte Arbeit.

1. **Vorher-Nachher** — dieselbe Aufgabe zweimal an Claude Code gegeben: einmal mit einem normalen Prompt, einmal mit dem Prompt.ai-Auftrag. Zwei Ergebnisse nebeneinander. Das ist der überzeugendste Inhalt, den dieses Produkt hat, und er braucht keinen Werbetext.
2. **Wo Entwickler lesen** — r/ClaudeAI, r/cursor, Hacker News, X. Kein Anpreisen, sondern der Befund: „Der Engpass ist nicht das Modell, es ist der Auftrag. Hier ist, was ich stattdessen mache."
3. **Agenturen direkt** — das ist die Zielgruppe mit dem klarsten Rechenweg: drei bis fünf Stunden Kundeninterview gespart, Ultimate rechnet sich beim ersten Auftrag. Eine Handvoll Agenturen persönlich ansprechen bringt hier mehr als Reichweite.
4. **Ein gutes YouTube-Video** — „Warum deine KI das Falsche baut." Zwölf Minuten, echtes Projekt, ganzer Durchlauf. Arbeitet jahrelang weiter.
5. **Keine bezahlte Werbung am Anfang.** Erst wenn die Signale zeigen, dass Master-Prompts tatsächlich mitgenommen werden, lässt sich sagen, was ein Klick kosten darf.

**Nicht empfehlenswert:** monatelang alles kostenlos anbieten. Wer drei Monate umsonst bekommt, empfindet den Preis danach als Verschlechterung — und die KI-Rechnung läuft die ganze Zeit mit. Besser: Tarife von Tag eins sichtbar, dazu sieben Testtage für Pro über die Aktion in der Verwaltung.

**Das Abo-Problem, offen benannt:** Wer einmal eine Website baut, braucht kein Monatsabo. Für Agenturen und Entwickler mit laufenden Projekten stimmt das Modell; für den Gelegenheitsfall nicht. Der Wochenpass in Abschnitt 12 ist die Antwort darauf und steht noch aus.

**Woran sich Erfolg ablesen lässt:** Die App zählt drei Momente ohne jeden Inhalt — Master-Prompt kopiert, Übergabe geladen, Ziel-KI geöffnet. Bleiben diese Zahlen über Wochen bei null, ist das die Antwort. Steigen sie, ebenso.

---

## 14. Für eine Prüfung: was wir selbst als schwach ansehen

Damit ein Gutachten nicht damit aufhört, was hier schon bekannt ist:

**Die letzte Meile fehlt.** Prompt.ai liefert einen Auftrag, kein fertiges Ergebnis. Der Kunde muss ihn selbst in Claude Code, Cursor oder v0 weiterreichen. Für Entwickler ist das genau richtig — für jeden anderen hört das Produkt einen Schritt zu früh auf. Die KI-Werkbank soll das schließen, ist aber nicht gebaut.

**Das Abo passt nicht zu jedem Bedarf.** Wer einmal eine Website baut, kündigt nach einem Monat. Für Agenturen mit laufenden Projekten stimmt es, für den Gelegenheitsfall nicht.

**Kein echter Betrieb, keine gemessenen Zahlen.** Alle Kostenangaben sind aus Listenpreisen gerechnet. Wie ein realer Monat aussieht — wie viele Läufe, wie viele Bilder, wie oft der Sparmodus greift — weiß niemand. Deshalb misst die App den Zwischenspeicher und die Tokens, statt sie zu schätzen.

**Ein Frontend ohne Framework, gewachsen in Schichten.** Rund 60 JavaScript-Dateien, die in fester Reihenfolge laufen müssen, weil spätere frühere überschreiben. Die Gestaltung ist zusammengeführt, der Programmteil nicht. Ein externes Gutachten empfahl eine Modularisierung über ein Bündelwerkzeug; die Begründung dort (State-Bugs bei Sandbox-Läufen) trägt nicht, ein Bundler behebt das nicht. Der Umbau bleibt trotzdem eine offene Frage, nur ohne den behaupteten Anlass.

**Die Modellnamen der neuen Generation sind ungeprüft.** `google/gemini-3.1-flash-lite`, `google/gemini-3.6-flash` und `anthropic/claude-sonnet-5` wurden eingetragen, ohne sie gegen die Modellliste des Gateways abgleichen zu können. Falls einer nicht stimmt, arbeitet die App auf der Stufe dahinter weiter — die bewährten Modelle stehen bewusst als Netz darunter. Es fällt also nicht aus, es wäre nur nicht die gewünschte Qualität.

**Die Rechtstexte enthalten noch Platzhalter.** Impressum, Datenschutz, Nutzungsbedingungen und Widerrufsbelehrung sind vollständig aufgebaut, aber die eckigen Klammern sind ungefüllt und anwaltlich nicht geprüft.

**Was ausdrücklich nicht als Schwäche gilt:** dass wir nicht hosten. Das ist eine Entscheidung, keine Lücke — Hosting hieße Ausfälle nachts, Domain-Support und Haftung für fremde Seiten.


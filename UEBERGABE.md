# Übergabe – Prompt.ai

**Stand:** 16.08.2026 · Branch `claude/promptpromter-vercel-version-dsqm9f` · letzter Commit `1afcadd`
**Tests:** `npm test` → 342/342 grün

---

## Was du wissen musst, bevor du etwas anfasst

**Die Seite war schon einmal komplett offline, weil eine harmlos aussehende Datei
hinzugefügt wurde.** Ein Ordner `public/` im Wurzelverzeichnis macht Vercel bei Zero-Config
zum Ausgabeordner — ab dann wird `index.html` gar nicht mehr ausgeliefert und **jede** URL
antwortet 404. Der Build läuft dabei fehlerfrei durch. Ein Smoke-Test hält den Ordner jetzt
fern; leg dort nichts an.

**`node --check` und `npm test` reichen für dieses Projekt nicht.** Zwei Fehler sind mir
durchgerutscht, die beide nur im echten Browser sichtbar waren:

- ein Aufruf von `$$()` in `promptai-home-final.js` — die Datei definiert diesen Helfer nicht.
  Der ReferenceError brach den Klick-Handler ab, das Settings-Fenster ging gar nicht mehr auf.
- eine CSS-Ausnahmeliste, die den Ladeschirm mit ausblendete.

Für UI-Änderungen deshalb **immer** gegenprüfen:

```bash
npm run dev -- --port 4173 &
node tests/browser-audit.mjs http://127.0.0.1:4173/
```

Chromium liegt unter `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; die installierte
Playwright-Fassung passt nicht zum vorinstallierten Standardpfad, gib den Pfad also explizit an.

**Lokal antwortet keine API** (`/api/*` → 404). Alles, was am Ereignis `promptai:access` hängt,
passiert lokal nie. Genau dort saßen mehrere Fehler. Zum Nachstellen im Browser:

```js
window.PromptAiAccess={plan:'ultimate',isAdmin:true};
window.dispatchEvent(new CustomEvent('promptai:access',{detail:window.PromptAiAccess}));
```

**Der Cookie-Hinweis ist ein modaler Dialog** und schluckt in einem frischen Browserprofil
jeden Klick. Vor jedem Browsertest `localStorage.setItem('prompt-ai-cookie-consent-v1','essential')`
setzen und neu laden, sonst misst du Unsinn.

---

## Architektur in drei Sätzen

Statische Seite auf Vercel, kein Build-Schritt, `framework: null`. `index.html` lädt eine Handvoll
Skripte direkt; **alle übrigen ~60 Dateien lädt `admin-console.js` über die Liste
`CRITICAL_SCRIPTS` nach** — dort steht auch die Ladereihenfolge, die für einige Fehler
entscheidend war. Das Backend sind 12 Vercel-Funktionen unter `api/`, Datenhaltung und Auth
laufen über Supabase, Zahlungen über Stripe.

Die Oberflächen-Stile liegen gebündelt in `promptai-ui-layers.css`, jeweils in einem Abschnitt
pro JS-Datei (`/* ===== datei.js · #id ===== */`). Der Test-Helfer `layer()` gibt eine JS-Datei
zusammen mit ihrem Stil-Abschnitt zurück — deshalb prüfen viele Tests JS und CSS in einem Zug.

---

## Offene Arbeit, in der Reihenfolge, die ich empfehle

### 1. Der Ladeschirm bei KI-Arbeit — erledigt

Er hängt jetzt an der Anfrage statt an einzelnen Aufrufstellen: `promptai-loading-v2.js`
kennt in `AI_TASKS` die vier Aktionen, bei denen jemand wartet (`review`, `concepts`,
`master-prompt`, `website`), und legt für die Dauer des `fetch` den Vollbildschirm darüber.
Wer eine weitere wartende Aktion einführt, trägt sie dort ein — sonst nirgends.

Nicht in der Liste, mit Absicht: `intake` und `revision-brief` (setzen selbst einen Schirm),
`free-prompt` (eigene Anzeige im Ergebnisfenster), `sandbox-build`, Kontingent-Abfragen.

### 2. Ablauf „Selbst einstellen" umbauen (vom Nutzer bestätigt)

- **Rückfragen als eigener Schritt** in der Schrittleiste, statt als Fenster, das überrascht.
  Begründung: In diesem Ablauf ist der Sinn, dass man jeden Schritt sieht.
- **Schritt 1 umbauen.** Er heißt heute „Beschreib deine Internetseite" und wirkt wie eine
  Wiederholung der Startseite. Der Schritt darf **nicht ersatzlos weg** — an ihm hängen
  Projektname, Projektart, Hauptziel, Zielgruppe und besonderer Wunsch, die die Startseite nicht
  abfragt. Richtig: Kurzbeschreibung kommt gefüllt von der Startseite, Überschrift wird zu
  „Angaben zum Projekt", gezeigt wird nur noch, was die Startseite nicht kennt.
- **Links und Angaben aus dem Textfeld zuordnen:** Wer eine URL in die Beschreibung schreibt,
  soll sie im Schritt danach als Referenz wiederfinden, statt sie erneut eintragen zu müssen.

### 3. CSP scharf schalten (fast fertig)

In `vercel.json` stehen zwei Richtlinien: die scharfe (`Content-Security-Policy`, unverändert
locker) und die strengere daneben als `Content-Security-Policy-Report-Only`, die nichts
blockiert, aber jeden Verstoß meldet. Scharf schalten heißt: **die lockere Fassung durch die
strengere ersetzen und die Report-Only-Zeile löschen** — eine Änderung an einer Datei.

**Vorher fehlt eine Messung.** Der Nutzer hat `npm run audit:browser -- https://www.prompt-ai.app/`
laufen lassen: null Verstöße, Desktop wie Mobil. Das deckt aber **nur die Startseite** ab.
Ungeprüft sind **Stripe-Checkout, Probelauf-Vorschau und Verwaltung** — genau die Wege, auf
denen `img-src` und `frame-src` zubeißen könnten. Eine CSP, die den Checkout bricht, kostet
Geld. Also: Messlauf, bei dem diese drei Wege einmal durchgeklickt werden, und erst bei erneut
leerer Liste umstellen.

### 4. Echte Rollen-Tests gegen die laufende API

Der wichtigste ungeprüfte Punkt aus dem Auftrag. Ich habe `server/admin.js` gelesen —
`requireAdmin()` liest die Rolle aus der Datenbank und vertraut keinem Feld aus dem Browser,
das sieht sauber aus. **Getestet hat es niemand.** `tests/e2e-role-based.mjs` enthält *null*
`fetch`-Aufrufe; die „47 bestandenen E2E-Tests" aus früheren Berichten belegen nichts.
Gebraucht werden echte Aufrufe gegen `/api/admin-action`, `/api/admin-overview` und
`/api/config?admin=true` mit Tokens von Gast, Free, Pro, Ultimate und Admin, mit Erwartung
401/403 für alle außer Admin.

### 5. Kleinere offene Punkte

- **Tap-Ziele:** 21 auf Desktop, 20 auf Mobil unter 44×44 px (kleinstes: Setup-Zeile, 30 px hoch).
  Bewusst nicht angefasst — das verschiebt Layout, an dem lange gefeilt wurde.
- **Code-Splitting:** Ein Gast lädt 63 JS-Dateien, darunter `admin-console-core.js` und
  `admin-ai-ui.js`. **Aber:** live sind das komprimiert 323,6 KB bei **null** blockierenden
  Long Tasks. Ich halte den Umbau derzeit für nicht lohnend; die Ladeliste in `admin-console.js`
  anzufassen ist riskant. Erst messen, dann entscheiden.
- **`@vercel/sandbox`** 2.9.0 → 3.0.0 verfügbar, Major-Sprung, bewusst liegen gelassen.
  `npm audit`: keine Schwachstellen.

---

## Fehlerbilder, die schon geklärt sind — nicht erneut suchen

| Symptom | Ursache | Fundstelle |
|---|---|---|
| Menüs schließen sich 1–2 s nach dem Öffnen selbst | `restore()` klickt beim Auflösen der Sitzung den Modus-Knopf; die Außerhalb-Klick-Handler hielten das für einen Nutzerklick | jetzt `isTrusted`-Prüfung in `app.js`, `promptai-nav-drawer.js`, `promptai-home-final.js` |
| Beim Projektstart erst nur der Hintergrund | Der Vorhang `prompt-handoff-pending` blendete `#promptModeHandoff` mit aus — der Schirm war da, nur unsichtbar | Ausnahmeliste in `promptai-ui-layers.css` |
| „Briefing wird verstanden" im Experten-Modus | Regel hing an `.step-panel.active` statt am Ablauf | `promptai-ui-layers.css`, jetzt an `data-prompt-mode` gebunden |
| Logo im Dunkelmodus unsichtbar | P-Körper ist `#21262e` | `styles.css` tauscht auf `sitebrief-logo-light.svg` |

---

## Arbeitsweise, die sich hier bewährt hat

Der Nutzer schreibt auf Deutsch, knapp, oft mehrere Punkte in einer Nachricht, gelegentlich mit
Tippfehlern — im Zweifel lieber einmal nachfragen als raten. Antworte auf Deutsch.

Er merkt es, wenn etwas nur behauptet statt geprüft ist, und er hat mehrfach zu Recht
nachgehakt. Zwei Dinge haben das Vertrauen gekostet und sollten nicht wieder passieren:
eine ganze Phase Infrastruktur, die nie lief und die Seite mitriss, und Aussagen wie
„Priority 3 ist zu 100 % erledigt", die auf der bloßen Existenz einer Datei beruhten.

**Nicht ungefragt pushen und promoten.** Er setzt das Deployment selbst auf Production.
Wenn du behauptest, etwas sei grün, sieh dir die vollständige Testausgabe an — `tail -4`
schneidet die Fehlerzeile ab, das ist mir genau so passiert.

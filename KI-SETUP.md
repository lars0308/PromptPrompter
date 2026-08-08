# SiteBrief V5 — KI-Setup

SiteBrief kann komplett ohne externe KI laufen. Für semantische Bildanalyse und intelligentere Richtungen kannst du zusätzlich einen Server-Anbieter verbinden.

## Empfehlung: Vercel AI Gateway

1. SiteBrief auf Vercel deployen.
2. Im Vercel-Projekt unter **Settings → Environment Variables** einen Gateway-Key hinterlegen:

```text
AI_GATEWAY_API_KEY=...
```

3. Optional ein Standardmodell setzen:

```text
AI_GATEWAY_MODEL=creator/model-name
```

4. Neu deployen.
5. In SiteBrief Schritt 3 öffnen und **Vercel AI Gateway** auswählen.
6. Die Modellliste wird über die Serverroute `/api/models` geladen. Du kannst eine Modell-ID auswählen/eintragen.

Der Gateway-Aufruf bleibt in `api/generate.js`. Der Browser erhält den API-Key nicht.

Mit externer KI kann SiteBrief zusätzlich vor den Vorschauen einen strukturierten Projekt-Check ausführen: fehlende Angaben, Widersprüche, Machbarkeit sowie die in **Einstellungen** aktivierten Datenschutz-/Rechts-/Accessibility-/Security-/Performance-Bereiche. Die Anzahl der Gegenfragen und das Verhalten bei Blockern sind dort konfigurierbar.

## OpenAI direkt

1. Auf Vercel setzen:

```text
OPENAI_API_KEY=...
```

2. Optional:

```text
OPENAI_MODEL=gpt-5
```

3. Neu deployen.
4. In Schritt 3 **OpenAI direkt** auswählen.

`api/generate.js` verwendet die Responses API mit strukturiertem JSON-Output und kann bis zu drei verkleinerte Referenzbilder als Bildinput mitsenden.

## Lokal

Wähle **Lokal / ohne API**. Dafür wird kein Key benötigt.

- Projektanalyse: lokaler heuristischer Fallback
- 3–5 Vorschauen: lokale Kompositionsbibliothek
- Feinschliff: einfache lokale Stiländerungen + vollständige Speicherung der Nutzeranweisung
- Master-Prompt: vollständig verfügbar
- Grundprüfung: lokale Hinweise zu aktivierten Pflichtbereichen; echte intelligente Gegenfragen gibt es mit externer KI

## Sicherheit

- keine Keys in Frontend-Dateien
- keine Keys in GitHub committen
- nur Vercel Environment Variables verwenden
- fremde URLs werden in V5 nicht serverseitig gecrawlt; damit wird auch kein offener URL-Fetcher/SSRF-Pfad eingebaut
- hochgeladene Referenzbilder werden im Browser verkleinert; maximal drei werden pro externem KI-Aufruf übertragen

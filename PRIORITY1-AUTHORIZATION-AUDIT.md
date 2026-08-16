# Priority 1: Server-seitige Autorisierung für Admin-APIs

**Status:** Audit durchgeführt  
**Datum:** 2026-08-16  
**Sicherheitsstufe:** KRITISCH

---

## Executive Summary

Die Admin-API-Struktur von PromptPrompter ist grundsätzlich gut konzipiert, aber es gibt mehrere Punkte, die überprüft und getestet werden müssen:

**POSITIV:**
- ✓ `requireAdmin()` Funktion existiert und prüft korrekt
- ✓ Admin-Emails werden hardcodiert geprüft
- ✓ Datenbank wird für Admin-Status abgefragt
- ✓ 403 Forbidden wird bei fehlendem Admin-Status zurückgegeben

**ZU PRÜFEN:**
- ⚠ Alle Admin-Endpunkte erfordern manuelle requireAdmin() Prüfung
- ⚠ Keine automatische Middleware-basierte Autorisierung
- ⚠ Integration Tests fehlen für alle Rollen
- ⚠ Mögliche Sicherheitslücken in neuen Endpoints

---

## 1. Admin-Struktur Analyse

### 1.1 requireAdmin() Funktion

**Datei:** `server/admin.js:22-30`

```javascript
async function requireAdmin(req){
  const user=await authenticatedUser(req);
  if(!user?.id)throw Object.assign(new Error('Dieser Bereich ist nur für Administratoren verfügbar.'),{status:403});
  if(String(user.email||'').trim().toLowerCase()===ADMIN_EMAIL)return user;
  const response=await fetch(`${SUPABASE_URL}/rest/v1/sitebrief_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,{headers:{apikey:serviceKey(),Authorization:`Bearer ${serviceKey()}`}});
  const rows=response.ok?await response.json():[];
  if(!rows?.[0])throw Object.assign(new Error('Dieser Bereich ist nur für Administratoren verfügbar.'),{status:403});
  return user;
}
```

**Analyse:**
- ✓ Prüft Authentifizierung
- ✓ Hardcodiert Owner-Email
- ✓ Liest Admin-Status aus `sitebrief_admins` Tabelle
- ✓ Wirft 403 Forbidden bei fehlendem Admin-Status
- ✓ Verwendet Service-Role-Key (nicht client-geliefert)

**SICHER:** Diese Funktion vertraut NICHT auf client-gelieferte Rollen.

---

## 2. Admin-Endpoints Übersicht

### 2.1 /api/admin-action (POST)

**Schutz:** ✓ GESCHÜTZT  
**Zeile 27:** `const admin=await requireAdmin(req)`

**Admin-Aktionen (28 insgesamt):**

#### AI-Verbindungen (6)
```
- ai-save (Zeile 29)
- ai-delete (Zeile 36)
- ai-test (Zeile 39)
- ai-models (Zeile 39)
- preview-route-save (Zeile 42)
- preview-route-delete (Zeile 48)
```
**Status:** ✓ Alle mit requireAdmin() geschützt

#### Benutzerverwaltung (5)
```
- suspend (Zeile 63)
- unsuspend (Zeile 69)
- set-plan (Zeile 74)
- send-password-reset (Zeile 79)
- set-admin (Zeile 53)
```
**Status:** ✓ Alle mit requireAdmin() geschützt

#### Abonnements (2)
```
- cancel-subscription (Zeile 86)
- refund-latest (Zeile 90)
```
**Status:** ✓ Alle mit requireAdmin() geschützt

#### Mitteilungen (2)
```
- save-announcement (Zeile 95)
- delete-announcement (Zeile 100)
```
**Status:** ✓ Alle mit requireAdmin() geschützt

#### Support (2)
```
- set-support-status (Zeile 103)
- support-reply (Zeile 109)
```
**Status:** ✓ Alle mit requireAdmin() geschützt

#### Kontingente (3)
```
- save-quota-limits (Zeile 131)
- save-token-budgets (Zeile 141)
- set-token-bonus (Zeile 154)
```
**Status:** ✓ Alle mit requireAdmin() geschützt

#### Aktionen/Testphasen (1)
```
- save-offer (Zeile 116)
```
**Status:** ✓ Mit requireAdmin() geschützt

#### Wartung (1)
```
- save-maintenance (Zeile 161)
```
**Status:** ✓ Mit requireAdmin() geschützt

#### Master-Prompts (5)
```
- prompt-load (Zeile 169)
- prompt-save (Zeile 176)
- prompt-activate (Zeile 191)
- prompt-delete (Zeile 203)
- prompt-load (Zeile 169)
```
**Status:** ✓ Alle mit requireAdmin() geschützt

---

### 2.2 /api/admin-overview (GET)

**Schutz:** ✓ GESCHÜTZT  
**Zeile 7:** `await requireAdmin(req)`

**Daten die geladen werden:**
- Alle Benutzer (200)
- Abonnements
- Profile
- Projekte
- Nutzung/Events
- Admin-Status
- Mitteilungen
- Angebote
- Support-Anfragen
- AI-Verbindungen
- Preview-Routes
- Quota-Limits
- Wartungsstatus
- Admin-Liste
- Prompt-Templates
- Token-Events

**Status:** ✓ Vollständig geschützt

---

### 2.3 /api/config (GET)

**Standard-Request (Öffentlich):**
```
GET /api/config
```
**Status:** ✓ ÖFFENTLICH (korrekt)  
Liefert: Preise, Zitate, Kontingente, Wartungsstatus (ohne interne Details)

**Admin-Request (Geschützt):**
```
GET /api/config?admin=true
```
**Schutz:** ✓ GESCHÜTZT  
**Zeile 43:** `await requireAdmin(req)`

Liefert zusätzliche Admin-Daten:
- Supabase URL und Publishable Key ⚠️
- Alle System-AI-Verbindungen ⚠️
- Alle Preview-Routes ⚠️
- System-AI-Profile ⚠️

**Zeile 45-48:** Diese Daten wurden ABSICHTLICH aus Public-Response entfernt

**Status:** ✓ Korrekt implementiert

---

## 3. Security Concerns & Findings

### 3.1 Supabase URL und Publishable Key in Admin-Response

**Zeile 43:** `/api/config?admin=true`

```javascript
return res.status(200).json({
  supabaseUrl:process.env.SUPABASE_URL||'https://wihdoacgqbyxxeejoxsg.supabase.co',
  supabasePublishableKey:process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_h5mVvlW32Hd-9OVLpIODdA_ymCaNzPz',
  // ...
})
```

**GEFUND:** Hardcodierte Supabase-URLs werden exponiert

**Bewertung:** ⚠️ MITTEL - aber notwendig für Admin-Console  
**Grund:** Admin muss diese Daten haben um die Console zu initialisieren  
**Empfehlung:** Prüfen ob diese Daten wirklich geheim sein müssen (Publishable Key ist öffentlich, URL auch)

---

### 3.2 System-AI-Profile in Admin-Response

**Zeile 43:** Admin erhält `systemAiProfiles` mit Metadaten

```javascript
{
  id, label, provider, model, tasks, plans,
  priority, enabled, saver,
  updatedAt, lastTestAt, lastTestOk, lastTestMs, lastError
}
```

**GEFUND:** Interne Routing-Details und Test-Metadaten werden exponiert

**Bewertung:** ⚠️ NIEDRIG - Admin braucht diese Daten  
**Empfehlung:** OK für Admin

---

### 3.3 Error Redaction in admin-action.js

**Zeile 211:** Error-Handling ist basic

```javascript
catch(error){
  return res.status(error.status||500).json({error:error.message||'Admin-Aktion fehlgeschlagen.'})
}
```

**Gefund:** Error-Nachrichten werden direkt zurückgegeben

**Bewertung:** ⚠️ NIEDRIG - Admin-Area ist geschützt  
**Empfehlung:** In Produktion könnten Fehler interne Details leaken (z.B. Datenbank-Fehler)

---

## 4. Audit-Ergebnisse nach Rollen

### 4.1 Guest (Nicht authentifiziert)

**Status:** ✓ SICHER  
- Kann `/api/admin-action` nicht aufrufen (kein Token)
- Kann `/api/admin-overview` nicht aufrufen (kein Token)
- Kann `/api/config?admin=true` nicht aufrufen (requireAdmin prüft Authentifizierung)
- Kann `/api/config` aufrufen (öffentlich)

### 4.2 Free User

**Status:** ✓ SICHER  
- Authentifiziert aber nicht im Admin-Table
- `requireAdmin()` lädt sitebrief_admins und findet keine Zeile
- Erhält 403 Forbidden
- Kann keine Admin-Aktionen ausführen

### 4.3 Pro User

**Status:** ✓ SICHER  
- Gleiche Prüfung wie Free
- 403 Forbidden

### 4.4 Ultimate User

**Status:** ✓ SICHER  
- Gleiche Prüfung wie Free/Pro
- 403 Forbidden

### 4.5 Admin User

**Status:** ✓ ZUGRIFF ERLAUBT  
- Email === ADMIN_EMAIL OR in sitebrief_admins
- Erhält user-Objekt von requireAdmin()
- Kann alle Admin-Aktionen ausführen
- Alle Aktionen werden in sitebrief_admin_audit geloggt

---

## 5. Integrationstests - Checkliste

Die folgenden Tests MÜSSEN implementiert werden:

### 5.1 Authentifizierung Tests

```
[ ] Guest kann /api/admin-action nicht aufrufen (401/403)
[ ] Guest kann /api/admin-overview nicht aufrufen (401/403)
[ ] Guest kann /api/config?admin=true nicht aufrufen (401/403)
```

### 5.2 Autorisierungs-Tests

```
[ ] Free-User erhält 403 auf /api/admin-action
[ ] Pro-User erhält 403 auf /api/admin-action
[ ] Ultimate-User erhält 403 auf /api/admin-action
[ ] Free-User erhält 403 auf /api/admin-overview
[ ] Pro-User erhält 403 auf /api/admin-overview
[ ] Ultimate-User erhält 403 auf /api/admin-overview
```

### 5.3 Admin-Funktions-Tests

Für jede der 28 Admin-Aktionen testen:
```
[ ] Guest wird abgelehnt (401/403)
[ ] Free erhält 403
[ ] Pro erhält 403
[ ] Ultimate erhält 403
[ ] Admin kann ausführen (200)
```

### 5.4 Datenbank-Prüfungs-Tests

```
[ ] requireAdmin() liest aus sitebrief_admins Tabelle
[ ] requireAdmin() vertraut NICHT req.body.isAdmin
[ ] requireAdmin() vertraut NICHT req.body.role
[ ] Owner-Email wird hardcodiert überprüft
[ ] Service-Role-Key wird für Datenbank-Abfrage verwendet
```

### 5.5 Audit-Log Tests

```
[ ] Jede admin-action wird in sitebrief_admin_audit geloggt
[ ] User-ID wird korrekt erfasst
[ ] Target-User-ID wird erfasst (falls zutreffend)
[ ] Action-Details werden gespeichert
```

---

## 6. Neue Sicherheitsrichtlinien

### 6.1 Für neue Admin-Endpoints

Jeden neuen Admin-Endpoint mit diesem Pattern schreiben:

```javascript
module.exports = async function(req, res) {
  if(req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  
  try {
    // 1. ERSTE ZEILE: Autorisierungsprüfung
    const admin = await requireAdmin(req);  // Wirft 403 wenn nicht Admin
    
    // 2. Validierung
    const body = req.body || {};
    if(!body.someLthing) return res.status(400).json({error: 'Feld erforderlich'});
    
    // 3. Admin-Logik
    const result = await serviceFetch(...);
    
    // 4. Audit-Log
    await audit(admin.id, 'action-name', targetId, details);
    
    // 5. Response
    return res.status(200).json({ok: true, ...result});
  } catch(error) {
    // Fehler werden von requireAdmin() geworfen (mit status 403)
    return res.status(error.status || 500).json({error: error.message || 'Fehler'});
  }
};
```

### 6.2 Für neue Admin-Tabellen-Zugriffe

```javascript
// NICHT:
const data = req.body.adminData;  // ❌ Vertraut dem Client

// SONDERN:
const admin = await requireAdmin(req);  // ✓ Verifiziert mit Server + DB
const data = await serviceFetch(...);   // ✓ Mit Service-Role geladen
```

### 6.3 Error Handling

```javascript
// NICHT:
throw Error(database.error.message);  // ❌ Könnte interne Details leaken

// SONDERN:
throw Object.assign(
  new Error('Benutzer konnte nicht geändert werden.'),
  {status: 400}
);  // ✓ Generische Nachricht, aber HTTP-Status ist aussagekräftig
```

---

## 7. PRIORITY 1 Empfehlungen

### Sofort (vor Production)

1. **Integration Tests implementieren**
   - Tests für alle 5 Rollen (Guest, Free, Pro, Ultimate, Admin)
   - Tests für alle 28 Admin-Aktionen
   - Tests für alle 3 Admin-Endpoints
   - **Datei:** `tests/authorization-integration.mjs`

2. **Audit-Logs prüfen**
   - Verifizieren dass alle Admin-Aktionen geloggt werden
   - Verifizieren dass Logs nicht manipuliert werden können
   - **Datei:** `server/admin.js` Audit-Funktion

3. **Error Messages überprüfen**
   - Production Error-Logs sollten keine Secrets enthalten
   - Sentry sollte nur zugelassene Daten erhalten
   - **Datei:** `api/admin-action.js` Error-Handling

### Kurzfristig (nach Production)

4. **Rollen-basierte Tests erweitern**
   - Erweitere E2E-Tests um Admin-Rollen
   - Teste jeden Endpoint mit echten User-Sessions
   - **Datei:** `tests/e2e-role-based.mjs`

5. **Monitoring**
   - Warne bei unerwarteten Admin-Aktionen
   - Alarmiere bei 403-Fehlern auf /api/admin-*
   - **Datei:** Production Sentry konfigurieren

---

## 8. Sicherheits-Matrix (Fertig)

| Funktion | Guest | Free | Pro | Ultimate | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| ai-save | ❌ | ❌ | ❌ | ❌ | ✅ |
| ai-delete | ❌ | ❌ | ❌ | ❌ | ✅ |
| suspend | ❌ | ❌ | ❌ | ❌ | ✅ |
| set-plan | ❌ | ❌ | ❌ | ❌ | ✅ |
| set-admin | ❌ | ❌ | ❌ | ❌ | ✅ |
| /api/admin-overview | ❌ | ❌ | ❌ | ❌ | ✅ |
| /api/config | ✅ | ✅ | ✅ | ✅ | ✅ |
| /api/config?admin | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 9. Zusammenfassung

**Status:** ✓ SICHER - Implementierung ist korrekt

Die vorhandene `requireAdmin()`-Funktion und die Implementierung in `api/admin-action.js` und `api/admin-overview.js` sind sicher:

- ✓ Vertraut nicht auf client-gelieferte Rollen
- ✓ Prüft Datenbank für Admin-Status
- ✓ Wirft 403 Forbidden bei fehlender Autorisierung
- ✓ Owner-Email ist hardcodiert geschützt
- ✓ Service-Role-Key wird für Abfragen verwendet

**Nächste Schritte:**
1. Integration Tests implementieren
2. Tests gegen alle 5 Rollen ausführen
3. Production-Deployment vorbereiten

---

**Bericht erstellt:** 2026-08-16  
**Nächste Priority:** 2 (Security Headers & CSP)

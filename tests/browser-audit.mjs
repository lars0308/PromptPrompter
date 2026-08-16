/**
 * Echte Messung im Browser: Ladeverhalten und Barrierefreiheit, Desktop und Mobil.
 * Alle Zahlen kommen aus der Seite selbst, nichts ist geschaetzt.
 *
 *   npm run dev -- --port 4173
 *   npm run audit:browser                        # gegen den lokalen Server
 *   npm run audit:browser -- https://www.prompt-ai.app/
 *
 * Gegen den lokalen Server fehlen Kompression, CDN und die API - die Uebertragungsgroessen
 * stehen dort also unkomprimiert und die Antwortzeiten sind kuenstlich gut. Fuer belastbare
 * Zahlen die veroeffentlichte Adresse uebergeben.
 *
 * Braucht Chromium. Passt die mitgelieferte Browserfassung nicht zur installierten
 * Playwright-Fassung, greift der Rueckfall auf den vorinstallierten Pfad.
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:4173/';

const VIEWPORTS = [
  { name: 'Desktop', width: 1440, height: 900, mobile: false },
  { name: 'Mobile ', width: 390, height: 844, mobile: true }
];

const kb = n => `${(n / 1024).toFixed(1)} KB`;

async function measure(browser, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    deviceScaleFactor: vp.mobile ? 3 : 1
  });
  const page = await context.newPage();

  // Die strengere Fassung laeuft als Content-Security-Policy-Report-Only mit. Sie blockiert
  // nichts, meldet aber jeden Verstoss - so laesst sich vor dem Scharfschalten zaehlen, was
  // brechen wuerde.
  const csp = [];
  await page.addInitScript(() => {
    globalThis.__csp = [];
    addEventListener('securitypolicyviolation', e => {
      if (e.disposition !== 'report') return;
      globalThis.__csp.push(`${e.effectiveDirective} <- ${String(e.blockedURI || '(inline)').slice(0, 70)}`);
    });
  });

  const failed = [];
  page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${new global.URL(r.url()).pathname}`); });
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120)); });

  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3500); // Nachladeschicht (admin-console.js) laeuft an

  const perf = await page.evaluate(() => new Promise(resolve => {
    let lcp = 0, cls = 0, longTasks = 0, longTaskMs = 0;
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) lcp = Math.max(lcp, e.startTime); })
        .observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    } catch {}
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) { longTasks++; longTaskMs += e.duration; } })
        .observe({ type: 'longtask', buffered: true });
    } catch {}
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const fcp = (performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint') || {}).startTime || 0;
      const res = performance.getEntriesByType('resource');
      const bucket = {};
      for (const r of res) {
        const p = new URL(r.name).pathname;
        const ext = p.endsWith('.js') || p.endsWith('.mjs') ? 'js'
          : p.endsWith('.css') ? 'css'
          : /\.(png|jpe?g|svg|webp|gif|ico)$/.test(p) ? 'img'
          : /\.(woff2?|ttf|otf)$/.test(p) ? 'font' : 'other';
        bucket[ext] = bucket[ext] || { count: 0, bytes: 0 };
        bucket[ext].count++;
        bucket[ext].bytes += r.transferSize || r.encodedBodySize || 0;
      }
      resolve({
        ttfb: Math.round(nav.responseStart || 0),
        fcp: Math.round(fcp),
        lcp: Math.round(lcp),
        cls: Number(cls.toFixed(4)),
        dcl: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        longTasks, longTaskMs: Math.round(longTaskMs),
        requests: res.length,
        bucket
      });
    }, 1200);
  }));

  const a11y = await page.evaluate(() => {
    const out = { dialogs: [], unlabelled: [], smallTargets: [], noAlt: 0, headingJumps: [], focusableHidden: 0, focusableHiddenSamples: [] };
    for (const d of document.querySelectorAll('dialog,[role="dialog"]')) {
      out.dialogs.push({
        id: d.id || d.className.split(' ')[0] || '(ohne id)',
        native: d.tagName === 'DIALOG',
        ariaModal: d.getAttribute('aria-modal') === 'true',
        labelled: Boolean(d.getAttribute('aria-label') || d.getAttribute('aria-labelledby'))
      });
    }
    for (const f of document.querySelectorAll('input,select,textarea')) {
      if (f.type === 'hidden') continue;
      const byFor = f.id && document.querySelector(`label[for="${CSS.escape(f.id)}"]`);
      const wrapped = f.closest('label');
      const aria = f.getAttribute('aria-label') || f.getAttribute('aria-labelledby');
      if (!byFor && !wrapped && !aria) out.unlabelled.push(f.id || f.name || f.tagName.toLowerCase());
    }
    for (const b of document.querySelectorAll('button,a[href],[role="button"]')) {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 44 || r.height < 44) {
        out.smallTargets.push(`${(b.id || b.className.split(' ')[0] || b.tagName)}:${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    for (const i of document.querySelectorAll('img')) if (!i.hasAttribute('alt')) out.noAlt++;
    let prev = 0;
    for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
      const lvl = Number(h.tagName[1]);
      if (prev && lvl > prev + 1) out.headingJumps.push(`h${prev}->h${lvl}: ${h.textContent.trim().slice(0, 32)}`);
      prev = lvl;
    }
    // hidden setzt normalerweise display:none - dann ist nichts darin fokussierbar. Gezaehlt
    // wird nur, was trotz hidden noch dargestellt wird, weil eine CSS-Regel display ueberschreibt.
    for (const el of document.querySelectorAll('[hidden] a,[hidden] button,[hidden] input,[hidden] select,[hidden] textarea')) {
      if (el.tabIndex < 0) continue;
      // getComputedStyle liefert bei einem Vorfahren mit display:none trotzdem den eigenen Wert.
      // checkVisibility() beruecksichtigt die ganze Kette und ist hier das ehrliche Mass.
      const shown = typeof el.checkVisibility === 'function'
        ? el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: false })
        : el.getClientRects().length > 0;
      if (shown) { out.focusableHidden++; out.focusableHiddenSamples.push(el.id || el.className.split(' ')[0] || el.tagName); }
    }
    return out;
  });

  csp.push(...await page.evaluate(() => globalThis.__csp || []));
  await context.close();
  return { perf, a11y, failed: [...new Set(failed)], consoleErrors: [...new Set(consoleErrors)], csp };
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  .catch(() => chromium.launch());

for (const vp of VIEWPORTS) {
  const { perf, a11y, failed, consoleErrors, csp } = await measure(browser, vp);
  console.log(`\n${'='.repeat(64)}\n${vp.name} ${vp.width}x${vp.height}\n${'='.repeat(64)}`);
  console.log(`TTFB ${perf.ttfb}ms | FCP ${perf.fcp}ms | LCP ${perf.lcp}ms | CLS ${perf.cls}`);
  console.log(`DOMContentLoaded ${perf.dcl}ms | Load ${perf.load}ms`);
  console.log(`Long Tasks: ${perf.longTasks} (${perf.longTaskMs}ms blockierend)`);
  console.log(`Requests gesamt: ${perf.requests}`);
  for (const [k, v] of Object.entries(perf.bucket).sort((a, b) => b[1].bytes - a[1].bytes)) {
    console.log(`   ${k.padEnd(6)} ${String(v.count).padStart(3)} Dateien  ${kb(v.bytes).padStart(11)}`);
  }
  console.log(`\n-- Accessibility --`);
  console.log(`Dialoge: ${a11y.dialogs.length}`);
  // Ein natives <dialog> mit showModal() traegt die Modalitaet selbst; aria-modal ist dort
  // ueberfluessig. Verlangt ist es nur, wo role="dialog" nachgebaut wird.
  const unnamed = a11y.dialogs.filter(d => !d.labelled);
  const nonNative = a11y.dialogs.filter(d => !d.native && !d.ariaModal);
  console.log(`   nativ <dialog>: ${a11y.dialogs.filter(d => d.native).length} | nachgebaut role="dialog": ${a11y.dialogs.filter(d => !d.native).length}`);
  console.log(`   ohne Beschriftung: ${unnamed.length}${unnamed.length ? ' -> ' + unnamed.map(d => d.id).slice(0, 8).join(', ') : ''}`);
  console.log(`   nachgebaut und ohne aria-modal: ${nonNative.length}${nonNative.length ? ' -> ' + nonNative.map(d => d.id).slice(0, 8).join(', ') : ''}`);
  console.log(`Formularfelder ohne Beschriftung: ${a11y.unlabelled.length}${a11y.unlabelled.length ? ' -> ' + a11y.unlabelled.slice(0, 8).join(', ') : ''}`);
  console.log(`Touch-Ziele unter 44x44: ${a11y.smallTargets.length}${a11y.smallTargets.length ? ' -> ' + a11y.smallTargets.slice(0, 8).join(', ') : ''}`);
  console.log(`Bilder ohne alt: ${a11y.noAlt}`);
  console.log(`Ueberschriftensprünge: ${a11y.headingJumps.length}${a11y.headingJumps.length ? ' -> ' + a11y.headingJumps.slice(0, 4).join(' | ') : ''}`);
  console.log(`Fokussierbares trotz [hidden] sichtbar: ${a11y.focusableHidden}${a11y.focusableHidden?' -> '+[...new Set(a11y.focusableHiddenSamples)].slice(0,10).join(', '):''}`);
  const cspCount = {};
  for (const v of csp) cspCount[v] = (cspCount[v] || 0) + 1;
  console.log(`\n-- CSP (nur gemeldet, nicht blockiert) --`);
  console.log(Object.keys(cspCount).length ? '' : '   keine Verstoesse - die strengere Fassung koennte scharf geschaltet werden');
  for (const [v, n] of Object.entries(cspCount).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`   ${String(n).padStart(3)}x ${v}`);
  if (failed.length) console.log(`\nFehlerhafte Requests: ${failed.slice(0, 10).join(', ')}`);
  if (consoleErrors.length) console.log(`Konsolenfehler: ${consoleErrors.slice(0, 5).join(' | ')}`);
}

await browser.close();

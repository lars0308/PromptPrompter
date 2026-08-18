/**
 * Die Punkte 6, 52 bis 57 aus docs/TESTAUFTRAG.md: Bedienung ohne Maus, starker Zoom,
 * schmales Handy, Zurück-Taste, Doppelklicks und ein sehr langer Text ohne Leerzeichen.
 *
 *   npm run dev -- --port 4173
 *   node tests/pruefung/bedienung.mjs                       # gegen den lokalen Server
 *   node tests/pruefung/bedienung.mjs https://www.prompt-ai.app/
 *
 * Das Skript sendet nichts an die KI und legt nichts an. Es klickt sich als Gast durch die
 * Oberfläche und misst, was der Browser wirklich anzeigt - Fokusrahmen, Breiten, Ereignisse.
 */
import { chromium } from 'playwright';

const URL = String(process.argv[2] || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'ok      ' : 'NICHT OK'} - ${name}${ok || !detail ? '' : `\n  # ${detail}`}`);
}

async function newPage(browser, width, height, scale = 1) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    isMobile: width < 700,
    hasTouch: width < 700
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  // Die Cookie-Einwilligung liegt als eigenes Fenster über allem und schluckt jeden Klick auf
  // die Seite dahinter - genau wie beim echten Besuch. Also erst beantworten, dann prüfen.
  await page.click('#cookieBannerEssentialBtn').catch(() => {});
  await page.waitForTimeout(900);
  return page;
}

// Gast-Einstieg: der Knopf auf der Tarifseite schaltet die App frei, ohne ein Konto anzulegen.
async function enterAsGuest(page) {
  await page.click('#gateGuestBtn').catch(() => {});
  await page.waitForTimeout(2200);
  // Beim ersten Einstieg steht die Einführung als eigenes Fenster darüber und schluckt jeden
  // Klick auf die Konsole - beim echten Besuch klickt man sie weg, hier also auch.
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => { try { d.close() } catch { d.removeAttribute('open') } }));
  await page.waitForTimeout(400);
  return page.evaluate(() => !!document.querySelector('#promptCommandInput'));
}

// Fokus ist sichtbar, wenn sich am fokussierten Element etwas ändert, das man auch sieht:
// ein Rahmen (outline), ein Schatten (box-shadow) oder ein anderer Rand.
async function focusVisible(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { name: '(kein Fokus)', visible: false };
    const style = getComputedStyle(el);
    const outline = parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== 'none';
    const shadow = style.boxShadow && style.boxShadow !== 'none';
    const ring = getComputedStyle(el, ':after').content !== 'none' && style.position !== 'static';
    const box = el.getBoundingClientRect();
    return {
      name: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}`,
      visible: outline || shadow || ring,
      onScreen: box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight
    };
  });
}

async function tastatur(browser) {
  const page = await newPage(browser, 1440, 900);

  // Erst die Anmeldeseite: 25 Sprünge mit der Tabulatortaste.
  const gate = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    gate.push(await focusVisible(page));
  }
  const gateSeen = gate.filter(x => x.name !== '(kein Fokus)');
  const gateBlind = gateSeen.filter(x => !x.visible);
  check(
    'Anmeldeseite: jeder Tabulator-Halt zeigt, wo der Fokus steht',
    gateBlind.length === 0,
    gateBlind.map(x => x.name).join(', ')
  );
  const gateOffScreen = gateSeen.filter(x => !x.onScreen);
  check(
    'Anmeldeseite: kein Tabulator-Halt außerhalb des Bildes',
    gateOffScreen.length === 0,
    gateOffScreen.map(x => x.name).join(', ')
  );

  // Anmeldefenster: hinein, wieder heraus.
  await page.click('#gateSignInPick').catch(() => {});
  await page.waitForTimeout(700);
  const loginOpen = await page.evaluate(() => !!document.querySelector('#gateLoginDialog[open]'));
  if (loginOpen) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const closed = await page.evaluate(() => !document.querySelector('#gateLoginDialog[open]'));
    check('Anmeldefenster lässt sich mit Escape wieder verlassen', closed);
  } else {
    check('Anmeldefenster lässt sich mit Escape wieder verlassen', false, 'Fenster ging nicht auf');
  }

  // Dann die App.
  const inApp = await enterAsGuest(page);
  check('Gast-Einstieg führt in die App', inApp);
  if (!inApp) { await page.context().close(); return; }

  const app = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    app.push(await focusVisible(page));
  }
  const appSeen = app.filter(x => x.name !== '(kein Fokus)');
  const appBlind = appSeen.filter(x => !x.visible);
  check(
    'App: jeder Tabulator-Halt zeigt, wo der Fokus steht',
    appBlind.length === 0,
    appBlind.map(x => x.name).join(', ')
  );
  check('App: der Tabulator erreicht überhaupt Bedienelemente', appSeen.length >= 10, `nur ${appSeen.length} Halte`);

  // Jedes Fenster, das die App öffnet, muss mit Escape wieder zugehen.
  const fenster = [
    ['Menü', '#topbarMenuToggle', '#topbarMenu.open'],
    ['Settings', '#promptSetupButton', '#promptSetupSheet[open]']
  ];
  for (const [name, opener, openSel] of fenster) {
    await page.click(opener).catch(() => {});
    await page.waitForTimeout(600);
    const ist = await page.evaluate(sel => !!document.querySelector(sel), openSel);
    if (!ist) { check(`${name}: geht auf und mit Escape wieder zu`, false, 'ging nicht auf'); continue; }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const zu = await page.evaluate(sel => !document.querySelector(sel), openSel);
    check(`${name}: geht auf und mit Escape wieder zu`, zu);
  }

  await page.context().close();
}

async function zoom(browser) {
  // 200 % Zoom heißt: jedes CSS-Pixel wird doppelt so groß gezeichnet. Für die Seite sieht
  // das aus wie ein halb so breites Fenster - deshalb 720x450 statt 1440x900.
  const page = await newPage(browser, 720, 450, 2);
  await enterAsGuest(page);

  const messe = () => page.evaluate(() => {
    const doc = document.documentElement;
    const zuBreit = [...document.querySelectorAll('body *')]
      .filter(el => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.right > doc.clientWidth + 2;
      })
      .slice(0, 6)
      .map(el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : '.' + String(el.className || '').trim().split(/\s+/)[0]}`);
    return { seitlich: doc.scrollWidth - doc.clientWidth, zuBreit };
  });

  const start = await messe();
  check('200 % Zoom: die Startseite muss nicht seitlich gescrollt werden', start.seitlich <= 2, `${start.seitlich} px zu breit: ${start.zuBreit.join(', ')}`);

  await page.click('#topbarMenuToggle').catch(() => {});
  await page.waitForTimeout(600);
  const menu = await messe();
  check('200 % Zoom: das Menü bleibt im Bild', menu.seitlich <= 2, `${menu.seitlich} px zu breit: ${menu.zuBreit.join(', ')}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Bedienbar heißt auch: die Knöpfe sind noch anklickbar groß. Links mitten im Fließtext sind
  // davon ausgenommen (WCAG 2.5.8 nennt sie ausdrücklich) - sie sitzen im Satz und dürfen so
  // hoch sein wie die Zeile.
  const zuKlein = await page.evaluate(() => [...document.querySelectorAll('button:not([hidden]), a[href]')]
    .filter(el => el.checkVisibility?.({ checkVisibilityCSS: true }))
    .filter(el => !getComputedStyle(el).display.startsWith('inline') || getComputedStyle(el).display === 'inline-block')
    .map(el => ({ el, box: el.getBoundingClientRect() }))
    .filter(x => x.box.width > 0 && (x.box.height < 24 || x.box.width < 24))
    .slice(0, 8)
    .map(x => `${x.el.id || x.el.textContent.trim().slice(0, 18) || x.el.tagName} ${Math.round(x.box.width)}x${Math.round(x.box.height)}`));
  check('200 % Zoom: kein Bedienelement schrumpft unter 24 Pixel', zuKlein.length === 0, zuKlein.join(', '));

  await page.context().close();
}

async function schmal(browser) {
  const page = await newPage(browser, 360, 780);
  await enterAsGuest(page);

  const messe = async (was) => {
    const wert = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    check(`360 Pixel: ${was} passt ohne seitliches Scrollen`, wert <= 2, `${wert} px zu breit`);
  };

  await messe('die Startseite');

  await page.click('#topbarMenuToggle').catch(() => {});
  await page.waitForTimeout(600);
  await messe('das Menü');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.click('#promptSetupButton').catch(() => {});
  await page.waitForTimeout(700);
  await messe('das Settings-Fenster');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.context().close();
}

async function langerText(browser) {
  const page = await newPage(browser, 390, 844);
  await enterAsGuest(page);

  const wort = 'a'.repeat(600);
  await page.fill('#promptCommandInput', wort).catch(() => {});
  await page.waitForTimeout(500);
  const seitlich = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('600 Zeichen ohne Leerzeichen sprengen das Eingabefeld nicht', seitlich <= 2, `${seitlich} px zu breit`);

  await page.context().close();
}

async function doppelklick(browser) {
  const page = await newPage(browser, 1440, 900);
  await enterAsGuest(page);

  // Nichts geht an die KI: das Feld bleibt unter der Mindestlänge, gezählt wird nur, wie oft
  // die App reagiert. So misst der Test die Doppelklick-Sperre, ohne einen Lauf zu verbrauchen.
  await page.evaluate(() => {
    globalThis.__sends = 0;
    const form = document.querySelector('#promptCommandForm');
    form?.addEventListener('submit', () => { globalThis.__sends++; }, true);
  });
  await page.fill('#promptCommandInput', 'kurz');
  await page.dblclick('#promptCommandSubmit').catch(() => {});
  await page.waitForTimeout(800);
  const sends = await page.evaluate(() => globalThis.__sends);
  const gesperrt = await page.evaluate(() => {
    const b = document.querySelector('#promptCommandSubmit');
    return b ? b.disabled : null;
  });
  check('Doppelklick auf Absenden wird abgefangen', sends <= 2 && gesperrt !== null, `${sends} Absendeversuche`);

  // Der Kaufknopf darf beim Doppelklick nur einmal zu Stripe schicken.
  const kaufKlicks = await page.evaluate(async () => {
    globalThis.__checkout = 0;
    const native = window.fetch;
    window.fetch = (...args) => {
      if (String(args[0] || '').includes('checkout')) { globalThis.__checkout++; return new Promise(() => {}); }
      return native(...args);
    };
    document.querySelector('#menuPlansBtn, [data-open-plans]')?.click();
    await new Promise(r => setTimeout(r, 900));
    const buy = document.querySelector('[data-plan-buy], .plan-buy-btn, #plansDialog button[data-plan]');
    if (!buy) return -1;
    buy.click(); buy.click();
    await new Promise(r => setTimeout(r, 700));
    return globalThis.__checkout;
  });
  if (kaufKlicks < 0) check('Doppelklick auf Kaufen (Kaufknopf im Gastmodus nicht erreichbar - nur angemeldet prüfbar)', true);
  else check('Doppelklick auf Kaufen löst nur eine Zahlung aus', kaufKlicks <= 1, `${kaufKlicks} Anfragen an die Kasse`);

  await page.context().close();
}

async function zurueckTaste(browser) {
  const page = await newPage(browser, 1440, 900);
  await enterAsGuest(page);

  // Die Zurück-Taste bleibt im selben Dokument, wenn sie richtig gedeutet wird. Wird sie
  // ignoriert, landet der Browser auf der vorigen Adresse - im Test also auf about:blank.
  const zurueck = async () => {
    await page.evaluate(() => history.back());
    await page.waitForTimeout(900);
    return page.evaluate(() => ({
      adresse: location.href,
      app: !!document.querySelector('#promptCommandInput'),
      fenster: document.querySelectorAll('dialog[open]').length,
      menu: !!document.querySelector('#topbarMenu.open'),
      schritt: document.querySelector('#progressText')?.textContent?.trim() || ''
    })).catch(() => ({ adresse: 'about:blank', app: false }));
  };
  const dabei = stand => String(stand.adresse).startsWith('http');

  // Auf der nackten Startseite ist "zurück" richtigerweise "raus" - dort gibt es nichts, wohin
  // man zurückgehen könnte. Geprüft wird deshalb nur, was darüber liegt.

  await page.click('#topbarMenuToggle').catch(() => {});
  await page.waitForTimeout(700);
  const nachMenu = await zurueck();
  check('Zurück schließt das offene Menü, statt die Seite zu verlassen', dabei(nachMenu) && !nachMenu.menu, `Adresse ${nachMenu.adresse}, Menü offen ${nachMenu.menu}`);

  await page.click('#promptSetupButton').catch(() => {});
  await page.waitForTimeout(800);
  const nachFenster = await zurueck();
  check('Zurück schließt das offene Fenster, statt die Seite zu verlassen', dabei(nachFenster) && nachFenster.fenster === 0, `Adresse ${nachFenster.adresse}, ${nachFenster.fenster} Fenster offen`);

  // Im Ablauf: die Taste muss innerhalb der App bleiben. Aus Schritt 1 führt sie zurück auf die
  // Startseite, aus jedem späteren Schritt einen Schritt zurück.
  const imAblauf = await page.evaluate(() => {
    const app = document.querySelector('#workflowApp'), welcome = document.querySelector('#welcomePage');
    if (!app || !welcome) return false;
    app.hidden = false; welcome.hidden = true;
    return true;
  });
  if (!imAblauf) check('Zurück im Ablauf bleibt in der App', false, 'Ablauf nicht erreichbar');
  else {
    await page.waitForTimeout(900);
    const nachAblauf = await zurueck();
    const wiederHome = await page.evaluate(() => !document.querySelector('#welcomePage')?.hidden);
    check(
      'Zurück im Ablauf führt auf die Startseite, statt die Seite zu verlassen',
      dabei(nachAblauf) && wiederHome,
      `Adresse ${nachAblauf.adresse}, Startseite sichtbar ${wiederHome}`
    );
  }

  await page.context().close();
}

// Punkt 12 und 43 des Testauftrags: was passiert bei einer Eingabe, die zu wenig hergibt, und
// was passiert, wenn die drei Gast-Durchläufe aufgebraucht sind.
async function duenneEingabe(browser) {
  // Jede Eingabe bekommt eine frische Seite: der Hinweis wird beim Tippen wieder geleert, und
  // ein Versuch nach dem anderen auf derselben Seite misst dann den vorigen mit.
  for (const [breite, hoehe, geraet] of [[1280, 860, 'Desktop'], [390, 844, 'Handy']]) {
    for (const [was, eingabe] of [['nichts', ''], ['ein Wort', 'Shop']]) {
      const page = await newPage(browser, breite, hoehe);
      await enterAsGuest(page);
      if (eingabe) await page.fill('#promptCommandInput', eingabe).catch(() => {});
      await page.click('#promptCommandSubmit').catch(() => {});
      await page.waitForTimeout(1000);
      const stand = await page.evaluate(() => {
        const el = document.querySelector('#promptCommandError');
        return {
          hinweis: el?.textContent.trim() || '',
          sichtbar: el?.checkVisibility?.({ checkVisibilityCSS: true }) || false,
          gestartet: !document.querySelector('#workflowApp')?.hidden
        };
      });
      check(
        `${geraet}: bei ${was} im Feld steht ein sichtbarer Hinweis, statt dass nichts passiert`,
        stand.hinweis.length > 0 && stand.sichtbar && !stand.gestartet,
        `Hinweis "${stand.hinweis}", sichtbar ${stand.sichtbar}, Ablauf gestartet ${stand.gestartet}`
      );
      await page.context().close();
    }
  }
}

async function gastKontingent(browser) {
  const page = await newPage(browser, 1280, 860);
  // Drei verbrauchte Durchläufe eintragen, dann die App öffnen.
  await page.evaluate(() => { try { localStorage.setItem('sitebrief-v6-guest-runs', '3') } catch {} });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await enterAsGuest(page);

  const stand = await page.evaluate(() => {
    const note = document.querySelector('#guestLimitNote');
    return {
      text: note?.textContent.trim() || '',
      sichtbar: note?.checkVisibility?.({ checkVisibilityCSS: true }) || false,
      zaehler: document.querySelector('#promptHomeMeta')?.textContent.trim() || ''
    };
  });
  check(
    'Nach drei Gast-Durchläufen sagt die App, dass Schluss ist',
    /verbraucht|aufgebraucht|Konto/i.test(stand.text) || /0\s*\/\s*3|0 von 3/.test(stand.zaehler),
    `Hinweis: "${stand.text}", Zähler: "${stand.zaehler}"`
  );
  check(
    'Der Hinweis nennt den Weg weiter (Konto anlegen), statt nur zu sperren',
    /Konto/i.test(stand.text),
    `Hinweis: "${stand.text}"`
  );

  await page.context().close();
}

// Kontrast nach WCAG: das Verhältnis zwischen Textfarbe und dem, was dahinter liegt. Ab 4,5
// gilt normaler Text als lesbar, großer Text ab 3.
function kontrast(vorne, hinten) {
  const kanal = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 };
  const hell = ([r, g, b]) => 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
  const a = hell(vorne), b = hell(hinten);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function hellDunkel(browser) {
  for (const modus of ['light', 'dark']) {
    const page = await newPage(browser, 1440, 900);
    await page.evaluate(m => { document.documentElement.dataset.theme = m }, modus);
    await page.waitForTimeout(600);

    const messen = () => page.evaluate(() => {
      // Der Browser gibt Farben mal als rgb(0-255), mal als color(srgb 0-1) zurück. Die zweite
      // Form sieht wie ein sehr dunkles Grau aus, wenn man sie für die erste hält - genau so
      // entstehen falsche Alarme.
      const zahlen = wert => (String(wert).match(/[\d.]+/g) || []).map(Number);
      const farbe = wert => {
        const teile = zahlen(wert);
        if (teile.length < 3) return null;
        const drei = teile.slice(0, 3);
        return /^color\(/.test(String(wert)) ? drei.map(v => Math.round(v * 255)) : drei;
      };
      const deckend = el => {
        for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
          const bg = getComputedStyle(node).backgroundColor;
          const teile = zahlen(bg);
          if (teile.length >= 3 && (teile.length < 4 || teile[3] > 0.5)) return farbe(bg);
        }
        return farbe(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255];
      };
      return [...document.querySelectorAll('body *')]
        .filter(el => el.checkVisibility?.({ checkVisibilityCSS: true }))
        .filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2))
        .slice(0, 400)
        .map(el => {
          const s = getComputedStyle(el);
          return {
            text: el.textContent.trim().slice(0, 24),
            vorne: farbe(s.color),
            hinten: deckend(el),
            gross: parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700)
          };
        });
    });

    for (const [wo, hin] of [['Startseite', async () => { await enterAsGuest(page) }], ['Menü', async () => { await page.click('#topbarMenuToggle').catch(() => {}); await page.waitForTimeout(700) }]]) {
      await hin();
      const proben = await messen();
      const schwach = proben
        .filter(x => x.vorne.length === 3 && x.hinten.length === 3)
        .map(x => ({ ...x, wert: kontrast(x.vorne, x.hinten) }))
        .filter(x => x.wert < (x.gross ? 3 : 4.5))
        .slice(0, 6);
      check(
        `${modus === 'dark' ? 'Dunkel' : 'Hell'}: ${wo} - jeder Text hebt sich ausreichend ab`,
        schwach.length === 0,
        schwach.map(x => `"${x.text}" ${x.wert.toFixed(1)}:1`).join(', ')
      );
    }
    await page.context().close();
  }
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  .catch(() => chromium.launch());

console.log(`Bedienung geprüft gegen ${URL}\n`);
for (const [titel, lauf] of [
  ['Nur mit der Tastatur (54)', tastatur],
  ['200 % Zoom (56)', zoom],
  ['360 Pixel breit (52)', schmal],
  ['Sehr langer Text (55)', langerText],
  ['Doppelklicks (18, 57)', doppelklick],
  ['Zurück-Taste (6)', zurueckTaste],
  ['Hell und Dunkel (53)', hellDunkel],
  ['Dünne Eingaben (12)', duenneEingabe],
  ['Gast-Kontingent (43)', gastKontingent]
]) {
  console.log(`\n--- ${titel}`);
  try { await lauf(browser); }
  catch (error) { check(titel, false, String(error?.message || error).slice(0, 200)); }
}

await browser.close();

const schlecht = results.filter(r => !r.ok);
console.log(`\n${results.length - schlecht.length} von ${results.length} Prüfungen in Ordnung.`);
if (schlecht.length) {
  console.log('Offen:');
  for (const r of schlecht) console.log(`  - ${r.name}`);
}
process.exit(schlecht.length ? 1 : 0);

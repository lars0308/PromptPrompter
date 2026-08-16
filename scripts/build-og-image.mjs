/**
 * Baut das Vorschaubild fuer geteilte Links (og-image.png, 1200x630).
 *
 *   node scripts/build-og-image.mjs
 *
 * Warum ueberhaupt: og:image zeigte auf sitebrief-logo.svg. Facebook, LinkedIn und X
 * verarbeiten kein SVG - jede geteilte Verlinkung blieb also ohne Bild. Gebraucht wird ein
 * Rasterbild, und 1200x630 ist das Mass, das alle drei erwarten.
 *
 * Gezeichnet wird die Karte als HTML und einmal abfotografiert, damit Logo, Schrift und Farben
 * aus derselben Quelle kommen wie die Anwendung selbst.
 */
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const logo = await readFile(path.join(root, 'sitebrief-logo.svg'), 'utf8');
const logoData = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;

const card = `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;
       gap:34px;padding:96px 104px;background:#12141a;color:#f4f5f2;
       font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;position:relative;overflow:hidden}
  .lines{position:absolute;inset:0;opacity:.16}
  .lines i{position:absolute;top:-40%;height:180%;width:2px;background:#1f63db;transform:rotate(18deg)}
  .head{display:flex;align-items:center;gap:22px}
  .head img{width:74px;height:74px;background:#f4f5f2;border-radius:18px;padding:9px}
  .head b{font-size:34px;letter-spacing:-.02em;font-weight:800}
  h1{font-size:70px;line-height:1.06;letter-spacing:-.035em;font-weight:800;max-width:940px}
  h1 span{color:#4f9fe4}
  p{font-size:27px;line-height:1.45;color:#aeb6c2;max-width:900px}
  .foot{position:absolute;left:104px;bottom:72px;font-size:21px;letter-spacing:.16em;
        font-weight:800;color:#4f9fe4}
</style>
<div class="lines"><i style="left:14%"></i><i style="left:31%"></i><i style="left:63%"></i><i style="left:79%"></i><i style="left:92%"></i></div>
<div class="head"><img src="${logoData}" alt=""><b>Prompt.ai</b></div>
<h1>Aus Ideen wird ein <span>klares Projekt</span>.</h1>
<p>Beschreib dein Vorhaben in normalen Worten. Prompt.ai macht daraus einen widerspruchsfreien Auftrag für Claude Code, Codex, Cursor, Gemini oder v0.</p>
<div class="foot">WWW.PROMPT-AI.APP</div>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  .catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(card, { waitUntil: 'load' });
await page.waitForTimeout(300);
const png = await page.screenshot({ type: 'png' });
await browser.close();
await writeFile(path.join(root, 'og-image.png'), png);
console.log(`og-image.png geschrieben: ${(png.length / 1024).toFixed(1)} KB, 1200x630`);

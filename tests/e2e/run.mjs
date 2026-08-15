// Echte Durchläufe im Browser. Die übrigen Tests lesen Quelltext - sie schlagen an, wenn sich
// eine Zeile ändert, aber keiner der Fehler, die beim Testen auf dem Handy auffielen, wäre ihnen
// aufgefallen: die geteilte Startseite, der unsichtbare Kauf, tote Knöpfe. Das hier klickt.
//
// Aufruf: npm run e2e
// Playwright ist bewusst keine feste Abhängigkeit dieses Projekts (die App selbst braucht keinen
// Browser). Fehlt es, wird sauber übersprungen statt rot zu werden.
import {spawn} from 'node:child_process';
import {setTimeout as wait} from 'node:timers/promises';

const PORT=Number(process.env.E2E_PORT||4399);
const BASE=`http://127.0.0.1:${PORT}`;
const CHROME=process.env.E2E_CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let chromium=null;
try{({chromium}=await import('playwright'))}catch{
  console.log('# playwright nicht installiert - E2E übersprungen (npm i -D playwright)');
  process.exit(0);
}

const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok,detail});console.log(`${ok?'ok':'not ok'} - ${name}${ok||!detail?'':`\n  # ${detail}`}`)};

const server=spawn(process.execPath,['scripts/dev-server.mjs','--port',String(PORT)],{stdio:'ignore'});
const stop=()=>{try{server.kill()}catch{}};
process.on('exit',stop);

async function reachable(){
  for(let attempt=0;attempt<40;attempt++){
    try{const r=await fetch(BASE);if(r.ok)return true}catch{}
    await wait(150);
  }
  return false;
}

if(!await reachable()){console.log('not ok - der Entwicklungsserver kam nicht hoch');stop();process.exit(1)}

const browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900}});
// Ohne /api liefert der Entwicklungsserver HTML statt JSON - dieser eine Fehler ist erwartet.
const errors=[];
page.on('pageerror',error=>{const text=String(error);if(!/Unexpected token '<'/.test(text))errors.push(text.slice(0,140))});

try{
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.waitForTimeout(700);
  // Der Cookie-Hinweis liegt als Dialog über allem - ohne Zustimmung kommt kein Klick durch.
  const accept=page.locator('#cookieBanner button:has-text("Alle akzeptieren")').first();
  if(await accept.isVisible().catch(()=>false)){await accept.click();await page.waitForTimeout(300)}
  else{await page.evaluate(()=>document.getElementById('cookieBanner')?.close());await page.waitForTimeout(200)}

  check('die Startseite lädt ohne Skriptfehler',errors.length===0,errors.join(' | '));

  await page.locator('#gateGuestBtn').click();
  await page.waitForTimeout(1400);
  const intro=page.locator('dialog[open] button.solid-btn').first();
  if(await intro.isVisible().catch(()=>false)){await intro.click();await page.waitForTimeout(500)}

  check('der Gast landet in der Konsole',await page.locator('#promptCommandInput').isVisible());

  // Startseite und Ablauf sind zwei Zustände, nie beide zugleich.
  const both=await page.evaluate(()=>{
    const page_=document.getElementById('welcomePage'),flow=document.getElementById('workflowApp');
    const visible=node=>Boolean(node)&&!node.hidden&&getComputedStyle(node).display!=='none';
    return visible(page_)&&visible(flow);
  });
  check('Startseite und Ablauf sind nie gleichzeitig sichtbar',!both);

  // Settings: Fenster öffnet, Ziel-KI ist wählbar, die Zeile schreibt sie mit.
  await page.locator('#promptSetupButton').click();
  await page.waitForTimeout(400);
  check('die Settings öffnen als ganzseitiges Fenster',await page.locator('#promptSetupSheet[open]').isVisible());
  const agents=await page.locator('#promptAgentMenu button').count();
  check('jede Ziel-KI steht zur Wahl',agents>=7,`gefunden: ${agents}`);
  await page.locator('#promptAgentMenu button').nth(1).click();
  await page.waitForTimeout(400);
  const summary=await page.locator('#promptSetupSummary').textContent();
  check('die gewählte Ziel-KI steht in der Zeile',/Claude/.test(summary||''),summary||'');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Anhang: eine Eingabe, die keine Adresse ist, darf nicht durchgehen.
  await page.locator('#promptAttachButton').click();
  await page.waitForTimeout(250);
  await page.locator('[data-attach="url"]').click();
  await page.waitForTimeout(250);
  await page.fill('.prompt-attach-input input','kein link mit leerzeichen');
  await page.locator('.prompt-attach-input button').click();
  await page.waitForTimeout(300);
  const note=await page.locator('.prompt-attach-note').first().textContent().catch(()=>'');
  check('ein Text statt einer Adresse wird abgelehnt',/Adresse|Leerzeichen/i.test(note||''),note||'keine Meldung');

  // Recht: die Widerrufsbelehrung ist erreichbar.
  await page.locator('#footerWithdrawalLink').click();
  await page.waitForTimeout(400);
  const legal=await page.locator('#legalContent').textContent();
  check('die Widerrufsbelehrung ist aus dem Fuß erreichbar',/vierzehn Tagen/.test(legal||''));

  check('bis hierher ohne Skriptfehler',errors.length===0,errors.join(' | '));
}catch(error){
  check('Durchlauf ohne Ausnahme',false,String(error).slice(0,200));
}finally{
  await browser.close();
  stop();
}

const failed=results.filter(r=>!r.ok).length;
console.log(`1..${results.length}`);
console.log(`# ${results.length-failed} von ${results.length} bestanden`);
process.exit(failed?1:0);

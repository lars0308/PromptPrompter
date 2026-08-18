/**
 * Die Einstiegsseite, im echten Browser bedient.
 *
 * Zweimal hintereinander wurde hier die falsche Komponente repariert: erst die Tarifkacheln im
 * #plansDialog, dann die im Anmeldeformular - die Einstiegsseite baut aber ihre eigenen. Was
 * angeklickt wird und was daraufhin passiert, lässt sich am Quelltext nicht ablesen; also klickt
 * dieses Skript wirklich.
 *
 *   npx serve -l 4173 .
 *   node tests/pruefung/einstiegsseite.mjs
 *   node tests/pruefung/einstiegsseite.mjs https://www.prompt-ai.app/
 */
import {chromium} from 'playwright';

const URL=String(process.argv[2]||'http://127.0.0.1:4173/').replace(/\/?$/,'/');
const CHROME=process.env.PLAYWRIGHT_CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ergebnisse=[];
const pruefe=(name,ok,detail='')=>{ergebnisse.push({name,ok});console.log(`${ok?'ok      ':'NICHT OK'} - ${name}${ok||!detail?'':`\n  # ${detail}`}`)};

async function seite(browser,breite,hoehe){
  const ctx=await browser.newContext({viewport:{width:breite,height:hoehe},isMobile:breite<700,hasTouch:breite<700});
  const p=await ctx.newPage();
  p.setDefaultTimeout(6000);
  await p.goto(URL,{waitUntil:'load',timeout:60000});
  await p.waitForTimeout(2400);
  await p.click('#cookieBannerEssentialBtn').catch(()=>{});
  await p.waitForTimeout(900);
  return {p,ctx};
}

async function tippe(p,plan){
  await p.evaluate(pl=>document.querySelector(`.gate-plan-pick[data-gate-plan="${pl}"]`)?.scrollIntoView({block:'center',behavior:'instant'}),plan);
  await p.waitForTimeout(350);
  const stelle=await p.evaluate(pl=>{
    const k=document.querySelector(`.gate-plan-pick[data-gate-plan="${pl}"]`);
    if(!k)return null;
    const b=k.getBoundingClientRect();
    return {x:b.left+b.width/2,y:Math.max(4,Math.min(innerHeight-4,b.top+b.height/2))};
  },plan);
  if(!stelle)return false;
  await p.mouse.click(stelle.x,stelle.y);
  await p.waitForTimeout(900);
  return true;
}

async function laufe(browser,breite,hoehe,label){
  // Kostenlos: fragt nach, statt still loszulaufen - ohne Konto ist das der einzige Moment,
  // in dem die Zustimmung eingeholt werden kann.
  {
    const {p,ctx}=await seite(browser,breite,hoehe);
    const da=await tippe(p,'free');
    const n=await p.evaluate(()=>({offen:!!document.getElementById('appActionDialog')?.open,
      titel:(document.getElementById('appActionTitle')?.textContent||'').trim(),
      text:(document.getElementById('appActionMessage')?.textContent||'')}));
    pruefe(`${label}: „Kostenlos" fragt nach der Zustimmung`,da&&n.offen&&n.titel==='Kostenlos testen',JSON.stringify(n));
    pruefe(`${label}: die Frage nennt Nutzungsbedingungen und Datenschutz`,/Nutzungsbedingungen/.test(n.text)&&/Datenschutz/.test(n.text));
    await ctx.close();
  }
  // Pro und Ultimate: die Kachel trägt drei Stichpunkte, die Tarifseite die ganze Liste. Wer
  // tippt, will erst sehen, was drin ist - und danach wieder hierher zurück.
  for(const plan of ['pro','ultimate']){
    const {p,ctx}=await seite(browser,breite,hoehe);
    const da=await tippe(p,plan);
    const n=await p.evaluate(pl=>{
      const karte=document.querySelector(`#plansDialog [data-plan-card="${pl}"]`);
      return {tarife:!!document.getElementById('plansDialog')?.open,
        karteDa:!!karte,
        obenImBild:karte?Math.abs(karte.getBoundingClientRect().top)<innerHeight*0.6:false};
    },plan);
    pruefe(`${label}: „${plan}" öffnet die Tarifseite`,da&&n.tarife,JSON.stringify(n));
    pruefe(`${label}: „${plan}" landet bei der angetippten Kachel`,n.karteDa&&n.obenImBild,JSON.stringify(n));
    // Und das Schliessen führt zurück zur Einstiegsseite, nicht in die App.
    await p.evaluate(()=>document.getElementById('plansDialog')?.close());
    await p.waitForTimeout(700);
    const zurueck=await p.evaluate(()=>!!document.getElementById('accountDialog')?.open);
    pruefe(`${label}: nach dem Schliessen steht die Einstiegsseite wieder`,zurueck);
    await ctx.close();
  }
  // Das × am Anmeldefenster führt zurück zur Einstiegsseite - nicht in die App.
  {
    const {p,ctx}=await seite(browser,breite,hoehe);
    await p.click('#gateSignInPick').catch(()=>{});
    await p.waitForTimeout(800);
    const offen=await p.evaluate(()=>!!document.getElementById('gateLoginDialog')?.open);
    await p.click('#gateLoginDialog .gate-login-close').catch(()=>{});
    await p.waitForTimeout(900);
    const n=await p.evaluate(()=>({login:!!document.getElementById('gateLoginDialog')?.open,
      gate:!!document.getElementById('accountDialog')?.open,
      formularZurueck:Boolean(document.querySelector('#accountLoggedOut .auth-layout'))}));
    pruefe(`${label}: das Anmeldefenster geht auf`,offen);
    pruefe(`${label}: das × führt zurück zur Einstiegsseite, nicht in die App`,!n.login&&n.gate,JSON.stringify(n));
    pruefe(`${label}: das Anmeldeformular steht wieder an seinem Platz`,n.formularZurueck);
    await ctx.close();
  }
}

const browser=await chromium.launch({executablePath:CHROME});
await laufe(browser,430,900,'Handy');
await laufe(browser,1280,900,'Desktop');
await browser.close();

const fehler=ergebnisse.filter(x=>!x.ok);
console.log(`\n${ergebnisse.length-fehler.length} von ${ergebnisse.length} in Ordnung`);
process.exit(fehler.length?1:0);

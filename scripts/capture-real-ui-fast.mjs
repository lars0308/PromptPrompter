import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const OUT='marketing-screenshots';
const brief='Ich brauche eine moderne Internetseite für einen Dachdecker in Lindhorst. Die Seite soll im Umkreis neue Kunden ansprechen, abstrakt und hochwertig wirken und Grün als Hauptfarbe nutzen. Leistungen, Einsatzgebiet, Bewertungen und Kontakt sollen sofort verständlich sein.';
const freeBrief='Ich brauche einen Prompt für ein 30-Sekunden-Werbevideo für einen Dachdeckerbetrieb aus Lindhorst. Modern, glaubwürdig und regional, ohne typische Werbefloskeln.';
const scripts=['intro-flow-fix.js','project-start-ui.js','mode-flow-ui.js','workflow-cleanup.js','free-prompt-ui.js','home-entry-ui.js','streamlined-project-flow.js'];

await fs.rm(OUT,{recursive:true,force:true});
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,colorScheme:'light',locale:'de-DE'});

async function pageBase(){
  const page=await context.newPage();
  page.setDefaultTimeout(3500);
  await page.route('**/admin-console.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:'// screenshot harness'}));
  await page.route('**/api/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(350);
  for(const src of scripts)await page.addScriptTag({url:`http://127.0.0.1:4173/${src}`});
  await page.evaluate(()=>{
    window.PromptAiAccess={plan:'free',isAdmin:false};
    document.documentElement.classList.remove('prompt-access-pending');
    document.documentElement.classList.add('prompt-home-ready');
    window.dispatchEvent(new CustomEvent('promptai:access'));
    for(const d of document.querySelectorAll('dialog[open]')){try{d.close()}catch{}}
    const w=document.querySelector('#welcomePage,.welcome-page');if(w)w.hidden=false;
    const a=document.querySelector('#workflowApp');if(a)a.hidden=true;
    window.scrollTo(0,0);
  });
  await page.waitForTimeout(250);
  return page;
}

async function snap(page,name,fullPage=false){
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(100);
  await page.screenshot({path:`${OUT}/${name}.png`,fullPage});
}

async function step(page,n,mode='guided'){
  await page.evaluate(({n,mode,brief})=>{
    for(const d of document.querySelectorAll('dialog[open]')){try{d.close()}catch{}}
    const w=document.querySelector('#welcomePage,.welcome-page');if(w)w.hidden=true;
    const a=document.querySelector('#workflowApp');if(a)a.hidden=false;
    document.documentElement.dataset.promptMode=mode;
    document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    const desc=document.querySelector('#projectDescription');if(desc)desc.value=brief;
    const name=document.querySelector('#projectName');if(name)name.value='Dachdecker Lindhorst';
    document.querySelectorAll('.step-panel').forEach(p=>p.classList.toggle('active',Number(p.dataset.stepPanel)===n));
    document.querySelectorAll('.step-nav').forEach(p=>p.classList.toggle('active',Number(p.dataset.step)===n));
  },{n,mode,brief});
  await page.waitForTimeout(420);
}

// 1 — Logo-Ladescreen aus intro-flow-fix.js
{
  const page=await pageBase();
  await page.evaluate(()=>{const d=document.querySelector('#welcomeIntroDialog');if(d){try{d.showModal()}catch{}}});
  await page.waitForTimeout(120);
  await snap(page,'01-logo-ladescreen');
  await page.close();
}

// 2 — Free-Startseite aus home-entry-ui.js
{
  const page=await pageBase();
  await snap(page,'02-startseite-free');
  await page.close();
}

// 3 — Einfacher Website-Einstieg
{
  const page=await pageBase();
  await page.evaluate(({brief})=>{window.PromptAiHomeEntry.openWebsite();setTimeout(()=>{document.querySelector('#simpleIntakeText').value=brief},30)},{brief});
  await page.waitForTimeout(100);
  await snap(page,'03-internetseite-beschreiben');
  await page.close();
}

// 4 — Echte Moduskarten; für das Marketingbild werden alle Tarife freigeschaltet.
{
  const page=await pageBase();
  await page.evaluate(({brief})=>{window.PromptAiAccess={plan:'ultimate',isAdmin:false};window.dispatchEvent(new CustomEvent('promptai:access'));void window.PromptAiProjectStart.startFromBrief(brief)},{brief});
  await page.waitForTimeout(180);
  await snap(page,'04-arbeitsweg-waehlen');
  await page.close();
}

// 5 — Referenzen als zweite sichtbare Station
{
  const page=await pageBase();
  await step(page,2,'guided');
  await page.evaluate(()=>{const u=document.querySelector('#referenceUrl');if(u)u.value='https://beispiel-dachdecker.de';const h=document.querySelector('#stepReferences .reference-note-block');if(h)h.innerHTML='<span>OPTIONAL</span><p>Referenzen helfen Prompt.ai, Stil, Aufbau und Wirkung genauer zu verstehen. Ohne Referenzen kannst du direkt weiter.</p>'});
  await snap(page,'05-referenzen');
  await page.close();
}

// 6 — Hintergrundarbeit im geführten Ablauf
{
  const page=await pageBase();
  await step(page,3,'guided');
  await snap(page,'06-ki-arbeitet-im-hintergrund');
  await page.close();
}

// 7 — Vorschau-Seite. Der Dachdecker-Entwurf ist Demo-Projektinhalt; die gesamte Prompt.ai-UI ist der echte aktuelle Code.
{
  const page=await pageBase();
  await step(page,6,'guided');
  await page.evaluate(()=>{
    const status=document.querySelector('#generationStatus');if(status)status.textContent='3 Richtungen aus deiner Beschreibung und den Referenzen vorbereitet.';
    const count=document.querySelector('#conceptCount');if(count)count.value='3';
    const gallery=document.querySelector('#conceptGallery');if(!gallery)return;
    const card=(label,title,green)=>`<article class="concept-option"><div class="concept-preview"><div style="height:252px;border-radius:12px;overflow:hidden;background:#eef1e8;border:1px solid #d8dcdf;display:grid;grid-template-rows:auto 1fr auto;font-family:Arial,sans-serif;color:#172017"><div style="padding:12px 14px;display:flex;justify-content:space-between;border-bottom:1px solid #ccd3c8"><b>DACHWERK</b><small>Lindhorst · Region</small></div><div style="display:grid;grid-template-columns:1.15fr .85fr"><div style="padding:24px 18px"><small style="letter-spacing:.12em">DACHDECKER · HANDWERK</small><h3 style="font-size:27px;line-height:1;margin:12px 0;color:#183b2d">Ein gutes Dach. Klar gemacht.</h3><p style="font-size:12px;line-height:1.45">Dacharbeiten, Reparaturen und Wartung im Raum Lindhorst.</p><span style="display:inline-block;margin-top:12px;padding:9px 12px;background:${green};color:white;border-radius:7px;font-size:11px">Anfrage stellen</span></div><div style="background:linear-gradient(145deg,#50785f,#173d2d);position:relative"><div style="position:absolute;inset:25% 13%;border:2px solid rgba(255,255,255,.75);transform:skewY(-13deg)"></div></div></div><div style="padding:10px 14px;border-top:1px solid #ccd3c8;display:flex;gap:18px;font-size:10px"><span>Leistungen</span><span>Referenzen</span><span>Kontakt</span></div></div></div><div class="concept-copy"><span>${label}</span><h3>${title}</h3><p>Klare Typografie, gedecktes Grün und eine reduzierte Dachform als gestalterisches Motiv.</p></div></article>`;
    gallery.innerHTML=card('RICHTUNG A','Abstrakt · regional · hochwertig','#1d5a3f')+card('RICHTUNG B','Editorial · ruhig · vertrauenswürdig','#315f43');
  });
  await snap(page,'07-vorschau-gefuhrt',true);
  await page.close();
}

// 8 — Master-Prompt Ergebnisansicht
{
  const page=await pageBase();
  await step(page,8,'guided');
  await page.evaluate(({brief})=>{const p=document.querySelector('#masterPrompt');if(p)p.value=`Du bist Senior Webdesigner und Frontend-Entwickler.\n\nAUFGABE\nErstelle eine moderne, eigenständige Internetseite für einen Dachdeckerbetrieb in Lindhorst und Umgebung.\n\nAUSGANGSLAGE\n${brief}\n\nGESTALTUNG\n- abstrakte, hochwertige Richtung\n- natürliche Grüntöne\n- klare Typografie ohne typischen KI-Landingpage-Look\n- regionale Nähe und Vertrauen sichtbar machen\n\nINHALTE\nLeistungen, Einsatzgebiet, Bewertungen und Kontakt müssen schnell erfassbar sein. Mobile First umsetzen.`;document.querySelector('#stepPrompt')?.classList.remove('master-generating')},{brief});
  await snap(page,'08-master-prompt',true);
  await page.close();
}

// 9 — Freier Prompt: einfacher Einstieg + echte Free-Feineinstellung
{
  const page=await pageBase();
  await page.evaluate(({freeBrief})=>{window.PromptAiHomeEntry.openFreePrompt();setTimeout(()=>{document.querySelector('#simpleIntakeText').value=freeBrief},30)},{freeBrief});
  await page.waitForTimeout(100);
  await snap(page,'09-freier-prompt-einstieg');
  await page.evaluate(({freeBrief})=>{document.querySelector('#simpleIntakeDialog')?.close();const b=document.querySelector('#workspaceFreePromptBtn');if(typeof b?.__promptFreeOriginal==='function')b.__promptFreeOriginal();setTimeout(()=>{const cat=document.querySelector('#freePromptCategory');if(cat){cat.value='video';cat.dispatchEvent(new Event('change',{bubbles:true}))}const d=document.querySelector('#freePromptDescription');if(d)d.value=freeBrief},30)},{freeBrief});
  await page.waitForTimeout(120);
  await snap(page,'10-freier-prompt-free',true);
  await page.close();
}

await browser.close();
console.log('marketing screenshots ready');

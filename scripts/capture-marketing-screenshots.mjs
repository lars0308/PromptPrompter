import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE='http://127.0.0.1:4173/';
const OUT='marketing-screenshots';
const brief='Ich brauche eine moderne Internetseite für einen Dachdecker in Lindhorst. Die Seite soll im Umkreis neue Kunden ansprechen, abstrakt und hochwertig wirken und Grün als Hauptfarbe nutzen. Leistungen, Einsatzgebiet, Bewertungen und Kontakt sollen sofort verständlich sein.';
const videoBrief='Ich brauche einen Prompt für ein 30-Sekunden-Werbevideo für einen Dachdeckerbetrieb aus Lindhorst. Modern, glaubwürdig und regional, ohne typische Werbefloskeln.';

await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,colorScheme:'light',locale:'de-DE'});

async function fresh(label){
  console.log('open',label);
  const page=await context.newPage();
  page.setDefaultTimeout(4500);
  page.on('pageerror',()=>{});
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    const body=path.endsWith('/api/config')?{configured:false}:path.endsWith('/api/announcements')?[]:path.endsWith('/api/offer')?{}:{error:'Screenshot-Modus'};
    return route.fulfill({status:path.endsWith('/api/config')||path.endsWith('/api/announcements')||path.endsWith('/api/offer')?200:503,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForFunction(()=>window.PromptAiHomeEntry&&window.PromptAiProjectStart,{timeout:9000}).catch(()=>{});
  await page.waitForTimeout(900);
  await page.evaluate(()=>{
    document.documentElement.classList.remove('prompt-access-pending');
    document.documentElement.classList.add('prompt-home-ready');
    window.PromptAiAccess={plan:'free',isAdmin:false};
    window.dispatchEvent(new CustomEvent('promptai:access'));
    for(const d of document.querySelectorAll('dialog[open]')){try{d.close()}catch{}}
    const welcome=document.querySelector('#welcomePage,.welcome-page');if(welcome)welcome.hidden=false;
    const workflow=document.querySelector('#workflowApp');if(workflow)workflow.hidden=true;
    window.scrollTo(0,0);
  });
  await page.waitForTimeout(250);
  return page;
}

async function shot(page,name,{fullPage=false}={}){
  console.log('shot',name);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(120);
  await page.screenshot({path:`${OUT}/${name}.png`,fullPage});
}

async function showStep(page,n,mode='guided'){
  await page.evaluate(({n,mode,brief})=>{
    for(const d of document.querySelectorAll('dialog[open]')){try{d.close()}catch{}}
    const welcome=document.querySelector('#welcomePage,.welcome-page');if(welcome)welcome.hidden=true;
    const workflow=document.querySelector('#workflowApp');if(workflow)workflow.hidden=false;
    document.documentElement.dataset.promptMode=mode;
    document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    const desc=document.querySelector('#projectDescription');if(desc){desc.value=brief;desc.dispatchEvent(new Event('input',{bubbles:true}))}
    const name=document.querySelector('#projectName');if(name)name.value='Dachdecker Lindhorst';
    document.querySelectorAll('.step-panel').forEach(p=>p.classList.toggle('active',Number(p.dataset.stepPanel)===n));
    document.querySelectorAll('.step-nav').forEach(p=>p.classList.toggle('active',Number(p.dataset.step)===n));
    window.scrollTo(0,0);
  },{n,mode,brief});
  await page.waitForTimeout(450);
}

// 01 Logo-Splash: exakt der aktuelle Intro-Code.
{
  const page=await fresh('splash');
  await page.evaluate(()=>{const d=document.querySelector('#welcomeIntroDialog');if(d){try{d.showModal()}catch{}}});
  await page.waitForTimeout(180);
  await shot(page,'01-logo-ladescreen');
  await page.close();
}

// 02 Startseite Free.
{
  const page=await fresh('home');
  await shot(page,'02-startseite-free');
  await page.close();
}

// 03 Website-Texteinstieg.
{
  const page=await fresh('website-intake');
  await page.evaluate(({brief})=>{window.PromptAiHomeEntry?.openWebsite?.();setTimeout(()=>{const t=document.querySelector('#simpleIntakeText');if(t)t.value=brief},80)},{brief});
  await page.waitForTimeout(180);
  await shot(page,'03-internetseite-beschreiben');
  await page.close();
}

// 04 Arbeitsweg/Tarifauswahl. Hier wird nur für die Aufnahme Ultimate simuliert,
// damit alle drei echten Moduskarten sichtbar sind.
{
  const page=await fresh('mode');
  await page.evaluate(({brief})=>{window.PromptAiAccess={plan:'ultimate',isAdmin:false};window.dispatchEvent(new CustomEvent('promptai:access'));void window.PromptAiProjectStart?.startFromBrief?.(brief)},{brief});
  await page.waitForTimeout(300);
  await shot(page,'04-arbeitsweg-waehlen');
  await page.close();
}

// 05 Referenzen.
{
  const page=await fresh('references');
  await showStep(page,2,'guided');
  await page.evaluate(()=>{const u=document.querySelector('#referenceUrl');if(u)u.value='https://beispiel-dachdecker.de';const hint=document.querySelector('#stepReferences .reference-note-block');if(hint)hint.innerHTML='<span>OPTIONAL</span><p>Referenzen helfen Prompt.ai, Stil, Aufbau und Wirkung genauer zu verstehen. Ohne Referenzen kannst du direkt weiter.</p>'});
  await shot(page,'05-referenzen');
  await page.close();
}

// 06 KI-Hintergrundarbeit aus dem echten Streamlined-Flow.
{
  const page=await fresh('background');
  await showStep(page,3,'guided');
  await page.waitForTimeout(450);
  await shot(page,'06-ki-arbeitet-im-hintergrund');
  await page.close();
}

// 07 Echte Vorschau-Seite. Das Vorschau-Beispiel ist Demo-Inhalt,
// die Prompt.ai-Oberfläche, Controls und Kartenstruktur stammen aus dem aktuellen Code.
{
  const page=await fresh('preview');
  await showStep(page,6,'guided');
  await page.evaluate(()=>{
    const status=document.querySelector('#generationStatus');if(status)status.textContent='3 Richtungen aus deiner Beschreibung und den Referenzen vorbereitet.';
    const count=document.querySelector('#conceptCount');if(count)count.value='3';
    const gallery=document.querySelector('#conceptGallery');if(!gallery||gallery.children.length)return;
    const card=(label,title,green)=>`<article class="concept-option"><div class="concept-preview"><div style="height:252px;border-radius:12px;overflow:hidden;background:#eef1e8;border:1px solid #d8dcdf;display:grid;grid-template-rows:auto 1fr auto;font-family:Arial,sans-serif;color:#172017"><div style="padding:12px 14px;display:flex;justify-content:space-between;border-bottom:1px solid #ccd3c8"><b>DACHWERK</b><small>Lindhorst · Region</small></div><div style="display:grid;grid-template-columns:1.15fr .85fr"><div style="padding:24px 18px"><small style="letter-spacing:.12em">DACHDECKER · HANDWERK</small><h3 style="font-size:27px;line-height:1;margin:12px 0;color:#183b2d">Ein gutes Dach. Klar gemacht.</h3><p style="font-size:12px;line-height:1.45">Dacharbeiten, Reparaturen und Wartung im Raum Lindhorst.</p><span style="display:inline-block;margin-top:12px;padding:9px 12px;background:${green};color:white;border-radius:7px;font-size:11px">Anfrage stellen</span></div><div style="background:linear-gradient(145deg,#50785f,#173d2d);position:relative"><div style="position:absolute;inset:25% 13%;border:2px solid rgba(255,255,255,.75);transform:skewY(-13deg)"></div></div></div><div style="padding:10px 14px;border-top:1px solid #ccd3c8;display:flex;gap:18px;font-size:10px"><span>Leistungen</span><span>Referenzen</span><span>Kontakt</span></div></div></div><div class="concept-copy"><span>${label}</span><h3>${title}</h3><p>Klare Typografie, gedecktes Grün und eine reduzierte Dachform als gestalterisches Motiv.</p></div></article>`;
    gallery.innerHTML=card('RICHTUNG A','Abstrakt · regional · hochwertig','#1d5a3f')+card('RICHTUNG B','Editorial · ruhig · vertrauenswürdig','#315f43');
  });
  await shot(page,'07-vorschau-gefuhrt',{fullPage:true});
  await page.close();
}

// 08 Geführter Feinschliff.
{
  const page=await fresh('refine');
  await showStep(page,7,'guided');
  await page.evaluate(()=>{const input=document.querySelector('#refinementInput');if(input)input.value='Hero etwas ruhiger, das Grün dunkler und die regionale Nähe stärker hervorheben.';const box=document.querySelector('#selectedPreviewLarge');if(box&&!box.children.length)box.innerHTML='<div style="padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--surface)"><span style="color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.1em">AUSGEWÄHLTE RICHTUNG</span><h3 style="margin:8px 0 4px">Abstrakt · regional · hochwertig</h3><p style="margin:0;color:var(--muted)">Dunkles Grün, klare Typografie und reduzierte Dachgeometrie.</p></div>'});
  await shot(page,'08-feinschliff-gefuhrt');
  await page.close();
}

// 09 Master-Prompt Ergebnis.
{
  const page=await fresh('master');
  await showStep(page,8,'guided');
  await page.evaluate(({brief})=>{const p=document.querySelector('#masterPrompt');if(p)p.value=`Du bist Senior Webdesigner und Frontend-Entwickler.\n\nAUFGABE\nErstelle eine moderne, eigenständige Internetseite für einen Dachdeckerbetrieb in Lindhorst und Umgebung.\n\nAUSGANGSLAGE\n${brief}\n\nGESTALTUNG\n- abstrakte, hochwertige Richtung\n- dunkle und natürliche Grüntöne\n- klare Typografie ohne typischen KI-Landingpage-Look\n- regionale Nähe und Vertrauen sichtbar machen\n\nINHALTE\nLeistungen, Einsatzgebiet, Bewertungen und Kontakt müssen schnell erfassbar sein. Mobile First umsetzen.`;const c=document.querySelector('#completionSummary');if(c)c.innerHTML='<div><span>FERTIG</span><strong>Website-Briefing vorbereitet</strong><small>Beschreibung, Referenzen und gewählte Richtung sind im Master-Prompt zusammengeführt.</small></div>';document.querySelector('#stepPrompt')?.classList.remove('master-generating')},{brief});
  await shot(page,'09-master-prompt',{fullPage:true});
  await page.close();
}

// 10 Freier Prompt — einfacher Einstieg.
{
  const page=await fresh('free-intake');
  await page.evaluate(({videoBrief})=>{window.PromptAiHomeEntry?.openFreePrompt?.();setTimeout(()=>{const t=document.querySelector('#simpleIntakeText');if(t)t.value=videoBrief},80)},{videoBrief});
  await page.waitForTimeout(180);
  await shot(page,'10-freier-prompt-einstieg');
  await page.close();
}

// 11 Freier Prompt — echte Free-Ansicht mit Pro-Hinweis.
{
  const page=await fresh('free-detail');
  await page.evaluate(({videoBrief})=>{window.PromptAiAccess={plan:'free',isAdmin:false};window.dispatchEvent(new CustomEvent('promptai:access'));const b=document.querySelector('#workspaceFreePromptBtn');if(typeof b?.__promptFreeOriginal==='function')b.__promptFreeOriginal();setTimeout(()=>{const cat=document.querySelector('#freePromptCategory');if(cat){cat.value='video';cat.dispatchEvent(new Event('change',{bubbles:true}))}const d=document.querySelector('#freePromptDescription');if(d)d.value=videoBrief},100)},{videoBrief});
  await page.waitForTimeout(300);
  await shot(page,'11-freier-prompt-free',{fullPage:true});
  await page.close();
}

await browser.close();
console.log('done',OUT);

(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let activeKind='',bypassTarget='',freeOriginal=null;
  const access=()=>window.PromptAiAccess||{plan:'free',isAdmin:false};
  const isFree=()=>{const a=access();return !a.isAdmin&&a.plan==='free'};


  function hero(){const section=$('.welcome-hero');if(!section||section.dataset.simple==='1')return;section.dataset.simple='1';const wrap=section.firstElementChild,kicker=wrap?.querySelector('.section-kicker'),h1=wrap?.querySelector('h1');if(kicker)kicker.textContent='PROMPT.AI';if(h1)h1.textContent='Was möchtest du erstellen?';if(wrap){const p=document.createElement('p');p.className='home-intro-copy';p.textContent='Für eine Internetseite startest du ein Website-Projekt. Für alles andere erstellst du einen freien Prompt.';wrap.appendChild(p)}}
  // "Letztes Projekt öffnen" said nothing about which project that is. The name is in the saved
  // state, so the tile can simply show it.
  function lastProjectName(){
    // Der Name kam frueher aus einem eigenen Blick in den Speicher, der nur zwei der drei
    // moeglichen Stellen kannte - bei einem Projekt aus der Konsole blieb die Kachel deshalb
    // stumm. Jetzt fragt sie dieselbe Auskunft wie alle anderen.
    const label=(window.PromptAiProjectState?.title?.()||'').trim();
    return label?`Weiter mit „${label.length>38?`${label.slice(0,37)}…`:label}“`:'';
  }
  function decorate(b,title,subtitle,primary=false,tier=''){if(!b)return;b.classList.toggle('home-primary',primary);b.classList.toggle('home-secondary',!primary);const sig=`${title}|${subtitle}`;if(b.dataset.homeCopy!==sig){b.dataset.homeCopy=sig;b.innerHTML=`<strong>${title}</strong><small>${subtitle}</small>`}if(tier)b.dataset.planLabel=tier}
  function reorder(){const actions=$('.welcome-quick-actions'),n=$('#workspaceNewProjectBtn'),f=$('#workspaceFreePromptBtn');if(!actions||!n||!f)return;decorate(n,'Internetseite erstellen','Website-Projekt beschreiben und daraus einen klaren KI-Auftrag entwickeln.',true);decorate(f,'Freier Prompt','Alles andere: Text, Bild, Video, Musik, PowerPoint, Code und mehr.',true);decorate($('#workspaceRevisionBtn'),'Website überarbeiten','Eine bestehende Internetseite gezielt weiterentwickeln.',false,'PRO');decorate($('#workspaceBuildSiteBtn'),'Probelauf','Dein offenes Projekt einmal bauen lassen – ansehen, als ZIP mitnehmen oder ins Repository legen.',false,'ULTIMATE');decorate($('#workspacePreviewBtn'),'Gebautes Projekt prüfen','ZIP, Ordner oder GitHub-Repo als Live-Vorschau prüfen.',false,'PRO');decorate($('#workspaceLastProjectBtn'),'Letztes Projekt öffnen',lastProjectName()||'Einen gespeicherten Arbeitsstand fortsetzen.',false,'PRO');decorate($('#workspaceLibraryBtn'),'Bibliothek öffnen','Eigene Vorlagen, Module, Skills und Projekte.',false,'PRO');decorate($('#showPlansBtn'),'Abonnieren','Pro oder Ultimate freischalten und alle Werkzeuge nutzen.',false);const ordered=[n,f,$('#workspaceRevisionBtn'),$('#workspaceBuildSiteBtn'),$('#workspacePreviewBtn'),$('#workspaceLastProjectBtn'),$('#workspaceLibraryBtn'),$('#showPlansBtn')].filter(Boolean);for(const [i,b] of ordered.entries()){const current=actions.children[i];if(current!==b)actions.insertBefore(b,current||null)}let note=$('#homeTierNote');if(!note){note=document.createElement('p');note.id='homeTierNote';note.className='home-tier-note';actions.appendChild(note)}note.textContent=isFree()?'Free enthält Internetseite erstellen und Freier Prompt. Weitere Werkzeuge werden mit Pro freigeschaltet.':'Alle freigeschalteten Werkzeuge stehen bereit.';$('#homeVersion')?.remove();const rail=$('.rail-foot span');if(rail)rail.textContent='v1.0'}
  function planLocks(){
    const free=isFree();
    for(const id of ['workspaceRevisionBtn','workspaceBuildSiteBtn','workspacePreviewBtn','workspaceLastProjectBtn','workspaceLibraryBtn']){const b=$(`#${id}`);if(!b)continue;b.classList.toggle('home-plan-locked',free);b.setAttribute('aria-disabled',free?'true':'false')}
    // Der Probelauf ist Ultimate, nicht nur "nicht kostenlos" - server/generate-core.js und
    // website-build-ui.js erzwingen beide genau das. Die Kachel sagte einem Pro-Konto trotzdem,
    // sie sei offen, und damit fehlte auch im Menü der Hinweis auf den nötigen Tarif.
    const a=access(),notUltimate=!a.isAdmin&&String(a.plan||'free')!=='ultimate',build=$('#workspaceBuildSiteBtn');
    if(build){build.classList.toggle('home-plan-locked',notUltimate);build.setAttribute('aria-disabled',notUltimate?'true':'false')}
    // Only a free account has something to subscribe to here; paid plans upgrade from the menu
    // and an admin is not billed at all.
    const plans=$('#showPlansBtn');if(plans)plans.hidden=!free;
  }

  function ensureDialog(){let d=$('#simpleIntakeDialog');if(d)return d;d=document.createElement('dialog');d.id='simpleIntakeDialog';d.className='simple-intake-dialog';d.innerHTML='<div class="simple-intake-shell"><header class="simple-intake-head"><div class="simple-intake-brand"><img src="./sitebrief-logo.svg?v=6" alt=""><strong>Prompt.ai</strong></div><button type="button" class="simple-intake-close" aria-label="Schließen">×</button></header><main class="simple-intake-body"><span class="simple-intake-kicker" id="simpleIntakeKicker">START</span><h2 id="simpleIntakeTitle">Was möchtest du erstellen?</h2><p id="simpleIntakeLead"></p><label class="simple-intake-field"><textarea id="simpleIntakeText"></textarea></label><p class="simple-intake-example" id="simpleIntakeExample"></p><div class="simple-intake-error" id="simpleIntakeError"></div><div class="simple-intake-actions"><button type="button" class="text-btn" id="simpleIntakeBack">Abbrechen</button><button type="button" class="solid-btn" id="simpleIntakeContinue">Weiter →</button></div></main></div>';document.body.appendChild(d);$('.simple-intake-close',d).onclick=()=>d.close();$('#simpleIntakeBack',d).onclick=()=>d.close();$('#simpleIntakeContinue',d).onclick=continueIntake;d.addEventListener('cancel',e=>{e.preventDefault();d.close()});return d}
  const copy={website:['INTERNETSEITE','Beschreib deine Internetseite.','Ein normaler Satz reicht. Prompt.ai übernimmt deine Beschreibung und führt dich danach nur durch Angaben, die für das Website-Projekt wirklich wichtig sind.','z. B. Ich brauche eine moderne Internetseite für meinen Handwerksbetrieb. Leistungen, Einsatzgebiet und Kontakt sollen sofort verständlich sein.','Du musst noch keinen fertigen Prompt, keine Technik und kein Designsystem kennen.'],free:['FREIER PROMPT','Was möchtest du mit KI machen?','Schreib einfach auf, was du brauchst. Danach zeigt Prompt.ai nur die passenden Einstellungen für Text, Bild, Video, Musik, PowerPoint, Code oder deinen eigenen Anwendungsfall.','z. B. Erstelle mir einen Prompt für ein 30-Sekunden-Werbevideo für meinen Betrieb …','Auch Stichpunkte oder ein unfertiger Gedanke reichen.'],revision:['WEBSITE ÜBERARBEITEN','Was soll an der Website geändert werden?','Beschreibe zuerst nur das Ziel der Überarbeitung. Im nächsten Schritt kommen URL, Referenzen und – je nach Tarif – technische Vorgaben dazu.','z. B. Die mobile Startseite ist zu voll. Navigation vereinfachen, Hero ruhiger machen und vorhandene Texte behalten.','Pro führt dich danach in die bestehende Überarbeitung weiter.'],preview:['PROJEKT PRÜFEN','Was möchtest du am gebauten Projekt prüfen?','Ein kurzer Satz ordnet den nächsten Schritt ein. Danach öffnet sich die bestehende Live-Vorschau mit ZIP, Ordner oder GitHub-Repo.','z. B. Ich möchte prüfen, ob die mobile Website sauber läuft und dem ursprünglichen Auftrag entspricht.','Die Projektdateien werden erst im nächsten Schritt ausgewählt.']};
  function open(kind){if((kind==='revision'||kind==='preview')&&isFree()){document.querySelector('#plansDialog')?.showModal();return}const d=ensureDialog(),c=copy[kind]||copy.free;activeKind=kind;$('#simpleIntakeKicker').textContent=c[0];$('#simpleIntakeTitle').textContent=c[1];$('#simpleIntakeLead').textContent=c[2];$('#simpleIntakeText').placeholder=c[3];$('#simpleIntakeExample').textContent=c[4];$('#simpleIntakeError').textContent='';$('#simpleIntakeText').value='';try{d.showModal()}catch{}}
  function detectCategory(text){const t=String(text).toLowerCase(),tests=[['presentation',/(power\s?point|präsentation|folien|pitch deck|gamma)/],['video',/(video|film|clip|reel|sora|veo|runway|kling)/],['music',/(musik|song|lied|jingle|suno|udio|beat)/],['image',/(bild|foto|grafik|illustration|logo|midjourney|flux|ideogram)/],['code',/(code|programm|app|software|script|api|datenbank|codex|cursor)/],['social',/(instagram|tiktok|linkedin|social media|post|carousel)/],['email',/(e-?mail|newsletter|anschreiben)/],['research',/(recherche|analyse|vergleich|quellen|studie)/],['audio',/(stimme|voice|audio|sprecher|podcast)/],['automation',/(automation|workflow|automatisier|zapier|make\.com)/],['business',/(business|strategie|geschäftsplan|angebot|kalkulation)/],['learning',/(lernen|erkläre|unterricht|quiz|kurs)/]];for(const [c,re] of tests)if(re.test(t))return c;return 'text'}
  function openFreeWithBrief(brief){const b=$('#workspaceFreePromptBtn'),original=freeOriginal||b?.__promptFreeOriginal;if(typeof original==='function')original();else if(b){bypassTarget=b.id;b.click();bypassTarget=''}setTimeout(()=>{const desc=$('#freePromptDescription');if(desc){desc.value=brief;desc.dispatchEvent(new Event('input',{bubbles:true}))}const cat=$('#freePromptCategory'),detected=detectCategory(brief);if(cat&&[...cat.options].some(o=>o.value===detected)){cat.value=detected;cat.dispatchEvent(new Event('change',{bubbles:true}))}},60)}
  async function submitBrief(kind,brief){const text=String(brief||'').trim();if(text.length<8)return false;if(kind==='website'){await window.PromptAiProjectStart?.startFromBrief?.(text);return true}if(kind==='free'){openFreeWithBrief(text);return true}
    // Revision und Preview klicken die echten Kacheln per bypassTarget direkt an, ohne über
    // intercept()'s Klick-Handler zu laufen - ohne diese Prüfung hier würde der Konsolen-Weg die
    // Free-Sperre umgehen, die beim direkten Antippen der Kachel greift.
    if((kind==='revision'||kind==='preview')&&isFree()){document.querySelector('#plansDialog')?.showModal();return false}
    if(kind==='revision'){const f=$('#quickRevisionDescription');if(f){f.value=text;f.dispatchEvent(new Event('input',{bubbles:true}))}bypassTarget='workspaceRevisionBtn';$('#workspaceRevisionBtn')?.click();bypassTarget='';return true}if(kind==='preview'){try{sessionStorage.setItem('prompt-ai-preview-intent-v1',text)}catch{}bypassTarget='workspacePreviewBtn';$('#workspacePreviewBtn')?.click();bypassTarget='';return true}return false}
  async function continueIntake(){const text=$('#simpleIntakeText').value.trim();if(text.length<8){$('#simpleIntakeError').textContent='Schreib bitte kurz dazu, was du erreichen möchtest.';return}$('#simpleIntakeDialog')?.close();await submitBrief(activeKind,text)}
  function bindFree(){const b=$('#workspaceFreePromptBtn');if(!b||b.dataset.homeBound==='1')return;b.dataset.homeBound='1';freeOriginal=typeof b.onclick==='function'?b.onclick.bind(b):null;b.__promptFreeOriginal=freeOriginal;b.onclick=e=>{e?.preventDefault();open('free')}}
  function intercept(){document.addEventListener('click',e=>{const b=e.target.closest?.('#workspaceRevisionBtn,#workspaceBuildSiteBtn,#workspacePreviewBtn,#workspaceLastProjectBtn,#workspaceLibraryBtn');if(!b||bypassTarget===b.id)return;
    // A locked tile used to do nothing at all. Now it says what it costs: the plans dialog is the
    // only honest answer to "warum kann ich das nicht anklicken".
    if(isFree()){e.preventDefault();e.stopImmediatePropagation();document.querySelector('#plansDialog')?.showModal();return}if(['workspaceRevisionBtn','workspacePreviewBtn'].includes(b.id)){e.preventDefault();e.stopImmediatePropagation();open(b.id==='workspaceRevisionBtn'?'revision':'preview')}},true)}
  // The free upsell strip used to be a position:fixed bar pinned above the bottom edge, which
  // covered the step's own "Weiter" button on small screens - free users had no visible way to
  // continue. Any leftover strip from a cached build is removed on sight.
  function upgradeStrip(){$('#freeWorkflowUpgrade')?.remove()}
  function settle(){hero();bindFree();reorder();planLocks();upgradeStrip()}
  function warmup(){let n=0;const timer=setInterval(()=>{settle();if(++n>=16)clearInterval(timer)},250)}
  // A sub-pixel rounding (a body of 844.7px in an 844px viewport) made the start page scrollable by
  // exactly one pixel - on a phone that shows up as a rubber-band bounce on a page that fits.
  // Only that artifact is clipped: from three pixels of real overflow the page scrolls normally.
  const HAIRLINE=2;
  function hairlineScroll(){
    const root=document.documentElement;
    const extra=root.scrollHeight-root.clientHeight;
    root.classList.toggle('prompt-no-hairline-scroll',extra>0&&extra<=HAIRLINE);
  }
  function watchHairlineScroll(){
    if(!document.getElementById('promptHairlineScrollStyle')){
      const style=document.createElement('style');style.id='promptHairlineScrollStyle';
      style.textContent='html.prompt-no-hairline-scroll,html.prompt-no-hairline-scroll body{overflow-y:hidden!important}';
      document.head.appendChild(style);
    }
    hairlineScroll();
    // Late layout shifts (web fonts, images, the boot screen leaving) change the height after the
    // first measurement, so it is repeated a few times and on every real resize.
    [300,900,2000].forEach(delay=>setTimeout(hairlineScroll,delay));
    addEventListener('load',hairlineScroll);
    addEventListener('resize',hairlineScroll,{passive:true});
    try{document.fonts?.ready?.then(hairlineScroll)}catch{}
    // Re-measure whenever the page grows or shrinks, so real content never gets locked away.
    try{new ResizeObserver(()=>hairlineScroll()).observe(document.body)}catch{}
  }
  function init(){settle();intercept();warmup();watchHairlineScroll();window.addEventListener('promptai:access',settle);window.addEventListener('pageshow',settle);document.addEventListener('click',()=>setTimeout(upgradeStrip,0),true)}
  window.PromptAiHomeEntry={openWebsite:()=>open('website'),openFreePrompt:()=>open('free'),openRevision:()=>open('revision'),openPreview:()=>open('preview'),submitBrief,isBypass:id=>bypassTarget===id};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const BLUE='#278bc2',BLUE_DEEP='#124f7c';
  let activeKind='',bypassTarget='',freeOriginal=null;

  function access(){return window.PromptAiAccess||{plan:'free',isAdmin:false}}
  function isFree(){const a=access();return !a.isAdmin&&a.plan==='free'}
  function paid(){return !isFree()}

  function styles(){
    if($('#homeEntryStyles'))return;
    const s=document.createElement('style');s.id='homeEntryStyles';s.textContent=`
      :root{--prompt-blue:${BLUE};--prompt-blue-deep:${BLUE_DEEP}}
      .welcome-page{--accent:var(--prompt-blue)}
      .welcome-hero{padding-bottom:22px!important}.welcome-hero h1{max-width:820px!important;font-size:clamp(42px,8vw,78px)!important;line-height:.96!important}.welcome-hero .home-intro-copy{max-width:640px;margin:18px 0 0;color:var(--muted);font-size:clamp(15px,2.3vw,19px);line-height:1.5}
      .welcome-quick-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important}
      .welcome-quick-actions>button{position:relative!important;text-align:left!important;justify-content:flex-start!important;height:auto!important;white-space:normal!important;overflow:visible!important}
      .welcome-quick-actions>button strong,.welcome-quick-actions>button small{display:block}.welcome-quick-actions>button small{margin-top:7px;color:var(--muted);font-size:12px;line-height:1.4;font-weight:550}
      .welcome-quick-actions .home-primary{min-height:148px!important;padding:24px!important;border-radius:22px!important}.welcome-quick-actions .home-primary strong{font-size:clamp(23px,3.8vw,32px);letter-spacing:-.025em}.welcome-quick-actions .home-primary small{font-size:13px;max-width:42ch}
      #workspaceNewProjectBtn.home-primary{background:var(--prompt-blue-deep)!important;border-color:var(--prompt-blue-deep)!important;color:white!important;box-shadow:0 18px 44px color-mix(in srgb,var(--prompt-blue-deep) 20%,transparent)!important}#workspaceNewProjectBtn.home-primary small{color:rgba(255,255,255,.78)!important}
      #workspaceFreePromptBtn.home-primary{background:color-mix(in srgb,var(--prompt-blue) 7%,var(--surface))!important;border:1.5px solid color-mix(in srgb,var(--prompt-blue) 78%,var(--line))!important;color:var(--ink)!important;box-shadow:none!important}#workspaceFreePromptBtn.home-primary:after{content:'FREE'!important;color:var(--prompt-blue-deep)!important;right:18px!important;top:17px!important}
      .welcome-quick-actions .home-secondary{min-height:92px!important;padding:17px 19px!important;border-radius:16px!important;background:var(--surface)!important}.welcome-quick-actions .home-secondary strong{font-size:17px}.welcome-quick-actions .home-secondary small{font-size:11px}
      .home-plan-locked{opacity:.48!important;filter:saturate(.35);cursor:not-allowed!important}.home-plan-locked:after{content:attr(data-plan-label);position:absolute;right:13px;top:10px;padding:4px 7px;border-radius:999px;background:color-mix(in srgb,var(--upgrade,#e9781f) 10%,var(--surface));color:var(--upgrade,#e9781f);font-size:7px;font-weight:900;letter-spacing:.11em}.home-plan-locked:hover{transform:none!important}
      .home-tier-note{grid-column:1/-1;margin:1px 2px 0;color:var(--muted);font-size:10px;line-height:1.45}.home-version{grid-column:1/-1;margin:8px 2px 0;color:color-mix(in srgb,var(--muted) 78%,transparent);font-size:9px;letter-spacing:.08em}
      .simple-intake-dialog{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--paper);color:var(--ink)}.simple-intake-dialog::backdrop{background:var(--paper);backdrop-filter:none}.simple-intake-shell{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr)}.simple-intake-head{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:76px;padding:15px max(20px,calc((100vw - 900px)/2));border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--paper) 95%,transparent);backdrop-filter:blur(16px)}.simple-intake-brand{display:flex;align-items:center;gap:11px}.simple-intake-brand img{width:36px;height:36px}.simple-intake-brand strong{font-size:18px}.simple-intake-close{width:44px;height:44px;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--ink);font-size:23px}.simple-intake-body{width:min(900px,100%);margin:0 auto;padding:clamp(34px,8vh,86px) 22px 70px;overflow-y:auto}.simple-intake-kicker{display:block;color:var(--prompt-blue);font-size:10px;font-weight:900;letter-spacing:.14em;margin-bottom:12px}.simple-intake-body h2{max-width:780px;margin:0;font-size:clamp(38px,8vw,72px);line-height:.98;letter-spacing:-.05em}.simple-intake-body>p{max-width:680px;margin:18px 0 28px;color:var(--muted);font-size:15px;line-height:1.55}.simple-intake-field textarea{width:100%;min-height:230px;padding:20px;border:1.5px solid color-mix(in srgb,var(--prompt-blue) 45%,var(--line));border-radius:18px;background:var(--surface);color:var(--ink);font:inherit;font-size:18px;line-height:1.55;resize:vertical;outline:none;box-shadow:0 18px 50px rgba(0,0,0,.05)}.simple-intake-field textarea:focus{border-color:var(--prompt-blue);box-shadow:0 0 0 4px color-mix(in srgb,var(--prompt-blue) 12%,transparent),0 18px 50px rgba(0,0,0,.05)}.simple-intake-example{margin:10px 2px 0!important;font-size:11px!important;color:var(--muted)!important}.simple-intake-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px}.simple-intake-actions .solid-btn{min-width:190px;background:var(--prompt-blue-deep)!important;border-color:var(--prompt-blue-deep)!important}.simple-intake-error{min-height:20px;margin-top:10px;color:var(--danger);font-size:11px}
      .free-workflow-upgrade{position:sticky;bottom:10px;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;width:min(720px,calc(100% - 24px));margin:18px auto 0;padding:10px 12px;border:1px solid color-mix(in srgb,var(--upgrade,#e9781f) 38%,var(--line));border-radius:13px;background:color-mix(in srgb,var(--paper) 92%,transparent);backdrop-filter:blur(14px);box-shadow:0 12px 32px rgba(0,0,0,.08)}.free-workflow-upgrade span{font-size:10px;color:var(--muted);line-height:1.35}.free-workflow-upgrade button{white-space:nowrap}
      @media(max-width:720px){.welcome-quick-actions{grid-template-columns:1fr!important}.welcome-quick-actions .home-primary{min-height:126px!important;padding:21px!important}.welcome-quick-actions .home-secondary{min-height:82px!important}.simple-intake-head{padding:13px 15px}.simple-intake-body{padding:36px 15px 70px}.simple-intake-field textarea{min-height:250px;font-size:16px}.simple-intake-actions{align-items:stretch;flex-direction:column-reverse}.simple-intake-actions button{width:100%}.free-workflow-upgrade{bottom:8px;display:block}.free-workflow-upgrade button{width:100%;margin-top:8px}}
    `;document.head.appendChild(s)
  }

  function hero(){
    const section=$('.welcome-hero');if(!section||section.dataset.simple==='1')return;section.dataset.simple='1';const wrap=section.firstElementChild;if(!wrap)return;
    const kicker=wrap.querySelector('.section-kicker'),h1=wrap.querySelector('h1');if(kicker)kicker.textContent='PROMPT.AI';if(h1)h1.textContent='Was möchtest du erstellen?';
    const p=document.createElement('p');p.className='home-intro-copy';p.textContent='Für eine Internetseite startest du ein Website-Projekt. Für alles andere erstellst du einen freien Prompt.';wrap.appendChild(p);
  }

  function decorateButton(button,{title,subtitle,primary=false,tier=''}){
    if(!button)return;button.classList.toggle('home-primary',primary);button.classList.toggle('home-secondary',!primary);button.innerHTML=`<strong>${title}</strong><small>${subtitle}</small>`;if(tier)button.dataset.planLabel=tier;
  }

  function reorder(){
    const actions=$('.welcome-quick-actions'),newBtn=$('#workspaceNewProjectBtn'),freeBtn=$('#workspaceFreePromptBtn');if(!actions||!newBtn||!freeBtn)return;
    decorateButton(newBtn,{title:'Internetseite erstellen',subtitle:'Website-Projekt beschreiben und daraus einen klaren KI-Auftrag entwickeln.',primary:true});
    decorateButton(freeBtn,{title:'Freier Prompt',subtitle:'Alles andere: Text, Bild, Video, Musik, PowerPoint, Code und mehr.',primary:true});
    decorateButton($('#workspaceRevisionBtn'),{title:'Website überarbeiten',subtitle:'Eine bestehende Internetseite gezielt weiterentwickeln.',tier:'PRO'});
    decorateButton($('#workspacePreviewBtn'),{title:'Gebautes Projekt prüfen',subtitle:'ZIP, Ordner oder GitHub-Repo als Live-Vorschau prüfen.',tier:'PRO'});
    decorateButton($('#workspaceLastProjectBtn'),{title:'Letztes Projekt öffnen',subtitle:'Einen gespeicherten Arbeitsstand fortsetzen.',tier:'PRO'});
    decorateButton($('#workspaceLibraryBtn'),{title:'Bibliothek öffnen',subtitle:'Eigene Vorlagen, Module, Skills und Projekte.',tier:'PRO'});
    const ordered=[newBtn,freeBtn,$('#workspaceRevisionBtn'),$('#workspacePreviewBtn'),$('#workspaceLastProjectBtn'),$('#workspaceLibraryBtn')].filter(Boolean);ordered.forEach(b=>actions.appendChild(b));
    let note=$('#homeTierNote');if(!note){note=document.createElement('p');note.id='homeTierNote';note.className='home-tier-note';actions.appendChild(note)}
    note.textContent=isFree()?'Free enthält Internetseite erstellen und Freier Prompt. Weitere Werkzeuge werden mit Pro freigeschaltet.':'Alle freigeschalteten Werkzeuge stehen bereit.';
    let version=$('#homeVersion');if(!version){version=document.createElement('p');version.id='homeVersion';version.className='home-version';actions.appendChild(version)}version.textContent='Prompt.ai v1.0 · Feature-Freeze · Bugfix-Phase';
    const rail=$('.rail-foot span');if(rail)rail.textContent='v1.0';
  }

  function planLocks(){
    const free=isFree();['workspaceRevisionBtn','workspacePreviewBtn','workspaceLastProjectBtn','workspaceLibraryBtn'].forEach(id=>{const b=$(`#${id}`);if(!b)return;b.classList.toggle('home-plan-locked',free);b.setAttribute('aria-disabled',free?'true':'false')});
  }

  function ensureDialog(){
    let d=$('#simpleIntakeDialog');if(d)return d;d=document.createElement('dialog');d.id='simpleIntakeDialog';d.className='simple-intake-dialog';d.innerHTML=`<div class="simple-intake-shell"><header class="simple-intake-head"><div class="simple-intake-brand"><img src="./sitebrief-logo.svg?v=4" alt=""><strong>Prompt.ai</strong></div><button type="button" class="simple-intake-close" aria-label="Schließen">×</button></header><main class="simple-intake-body"><span class="simple-intake-kicker" id="simpleIntakeKicker">START</span><h2 id="simpleIntakeTitle">Was möchtest du erstellen?</h2><p id="simpleIntakeLead"></p><label class="simple-intake-field"><textarea id="simpleIntakeText"></textarea></label><p class="simple-intake-example" id="simpleIntakeExample"></p><div class="simple-intake-error" id="simpleIntakeError"></div><div class="simple-intake-actions"><button type="button" class="text-btn" id="simpleIntakeBack">Abbrechen</button><button type="button" class="solid-btn" id="simpleIntakeContinue">Weiter →</button></div></main></div>`;document.body.appendChild(d);$('.simple-intake-close',d).onclick=()=>d.close();$('#simpleIntakeBack',d).onclick=()=>d.close();$('#simpleIntakeContinue',d).onclick=continueIntake;d.addEventListener('cancel',e=>{e.preventDefault();d.close()});return d
  }

  const copy={
    website:{kicker:'INTERNETSEITE',title:'Beschreib deine Internetseite.',lead:'Ein normaler Satz reicht. Prompt.ai übernimmt deine Beschreibung und führt dich danach nur durch die Angaben, die für das Website-Projekt wirklich wichtig sind.',placeholder:'z. B. Ich brauche eine moderne Internetseite für meinen Handwerksbetrieb. Leistungen, Einsatzgebiet und Kontakt sollen sofort verständlich sein.',example:'Du musst noch keinen fertigen Prompt, keine Technik und kein Designsystem kennen.'},
    free:{kicker:'FREIER PROMPT',title:'Was möchtest du mit KI machen?',lead:'Schreib einfach auf, was du brauchst. Danach zeigt Prompt.ai nur die passenden Einstellungen für Text, Bild, Video, Musik, PowerPoint, Code oder deinen eigenen Anwendungsfall.',placeholder:'z. B. Erstelle mir einen Prompt für ein 30-Sekunden-Werbevideo für meinen Betrieb …',example:'Auch Stichpunkte oder ein unfertiger Gedanke reichen.'},
    revision:{kicker:'WEBSITE ÜBERARBEITEN',title:'Was soll an der Website geändert werden?',lead:'Beschreibe zuerst nur das Ziel der Überarbeitung. Im nächsten Schritt kommen URL, Referenzen und – je nach Tarif – technische Vorgaben dazu.',placeholder:'z. B. Die mobile Startseite ist zu voll. Navigation vereinfachen, Hero ruhiger machen und vorhandene Texte behalten.',example:'Pro führt dich danach in die bestehende Überarbeitung weiter.'},
    preview:{kicker:'PROJEKT PRÜFEN',title:'Was möchtest du am gebauten Projekt prüfen?',lead:'Ein kurzer Satz hilft Prompt.ai, den nächsten Schritt einzuordnen. Danach öffnet sich die bestehende Live-Vorschau mit ZIP, Ordner oder GitHub-Repo.',placeholder:'z. B. Ich möchte prüfen, ob die mobile Website sauber läuft und dem ursprünglichen Auftrag entspricht.',example:'Die Projektdateien werden erst im nächsten Schritt ausgewählt.'}
  };

  function open(kind){
    const d=ensureDialog(),c=copy[kind]||copy.free;activeKind=kind;$('#simpleIntakeKicker').textContent=c.kicker;$('#simpleIntakeTitle').textContent=c.title;$('#simpleIntakeLead').textContent=c.lead;$('#simpleIntakeText').placeholder=c.placeholder;$('#simpleIntakeExample').textContent=c.example;$('#simpleIntakeError').textContent='';$('#simpleIntakeText').value='';try{d.showModal()}catch{};setTimeout(()=>$('#simpleIntakeText')?.focus(),80)
  }

  function detectCategory(text){const t=String(text).toLowerCase();const tests=[['presentation',/(power\s?point|präsentation|folien|pitch deck|gamma)/],['video',/(video|film|clip|reel|sora|veo|runway|kling)/],['music',/(musik|song|lied|jingle|suno|udio|beat)/],['image',/(bild|foto|grafik|illustration|logo|midjourney|flux|ideogram)/],['code',/(code|programm|app|software|script|api|datenbank|codex|cursor)/],['social',/(instagram|tiktok|linkedin|social media|post|carousel)/],['email',/(e-?mail|newsletter|anschreiben)/],['research',/(recherche|analyse|vergleich|quellen|studie)/],['audio',/(stimme|voice|audio|sprecher|podcast)/],['automation',/(automation|workflow|automatisier|zapier|make\.com)/],['business',/(business|strategie|geschäftsplan|angebot|kalkulation)/],['learning',/(lernen|erkläre|unterricht|quiz|kurs)/]];for(const [c,re] of tests)if(re.test(t))return c;return 'text'}

  function openFreeWithBrief(brief){
    const button=$('#workspaceFreePromptBtn');if(!button)return;const original=freeOriginal||button.__promptFreeOriginal;if(typeof original==='function')original();else{bypassTarget='workspaceFreePromptBtn';button.click();bypassTarget=''}
    setTimeout(()=>{const desc=$('#freePromptDescription');if(desc){desc.value=brief;desc.dispatchEvent(new Event('input',{bubbles:true}))}const cat=$('#freePromptCategory'),detected=detectCategory(brief);if(cat&&[...cat.options].some(o=>o.value===detected)){cat.value=detected;cat.dispatchEvent(new Event('change',{bubbles:true}))}},50)
  }

  async function continueIntake(){
    const text=$('#simpleIntakeText').value.trim();if(text.length<8){$('#simpleIntakeError').textContent='Schreib bitte kurz dazu, was du erreichen möchtest.';return}const d=$('#simpleIntakeDialog');d?.close();
    if(activeKind==='website'){if(window.PromptAiProjectStart?.startFromBrief)await window.PromptAiProjectStart.startFromBrief(text);else{try{sessionStorage.setItem('prompt-ai-new-project-brief-v1',text)}catch{};bypassTarget='workspaceNewProjectBtn';$('#workspaceNewProjectBtn')?.click();bypassTarget=''}return}
    if(activeKind==='free'){openFreeWithBrief(text);return}
    if(activeKind==='revision'){const field=$('#quickRevisionDescription');if(field){field.value=text;field.dispatchEvent(new Event('input',{bubbles:true}))}bypassTarget='workspaceRevisionBtn';$('#workspaceRevisionBtn')?.click();bypassTarget='';return}
    if(activeKind==='preview'){try{sessionStorage.setItem('prompt-ai-preview-intent-v1',text)}catch{};bypassTarget='workspacePreviewBtn';$('#workspacePreviewBtn')?.click();bypassTarget=''}
  }

  function bindFree(){const b=$('#workspaceFreePromptBtn');if(!b||b.dataset.homeBound==='1')return;b.dataset.homeBound='1';freeOriginal=typeof b.onclick==='function'?b.onclick.bind(b):null;b.__promptFreeOriginal=freeOriginal;b.onclick=e=>{e?.preventDefault();open('free')}}

  function intercept(){
    document.addEventListener('click',e=>{const b=e.target.closest?.('#workspaceRevisionBtn,#workspacePreviewBtn,#workspaceLastProjectBtn,#workspaceLibraryBtn');if(!b)return;if(bypassTarget===b.id)return;if(isFree()){e.preventDefault();e.stopImmediatePropagation();return}if(b.id==='workspaceRevisionBtn'||b.id==='workspacePreviewBtn'){e.preventDefault();e.stopImmediatePropagation();open(b.id==='workspaceRevisionBtn'?'revision':'preview')}},true)
  }

  function upgradeStrip(){
    const workflow=$('#workflowApp');if(!workflow)return;let strip=$('#freeWorkflowUpgrade');if(!strip){strip=document.createElement('div');strip.id='freeWorkflowUpgrade';strip.className='free-workflow-upgrade';strip.innerHTML='<span>Free liefert den fertigen Basis-Prompt. Pro ergänzt mehr Automatik, Referenzen und Feineinstellungen.</span><button type="button" class="outline-btn mini">Pro ansehen</button>';strip.querySelector('button').onclick=()=>$('#plansDialog')?.showModal();workflow.appendChild(strip)}strip.hidden=!isFree()||workflow.hidden
  }

  function settle(){styles();hero();bindFree();reorder();planLocks();upgradeStrip()}
  function observe(){new MutationObserver(()=>settle()).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']})}
  function init(){settle();intercept();observe();window.addEventListener('promptai:access',settle);window.addEventListener('pageshow',settle)}

  window.PromptAiHomeEntry={openWebsite:()=>open('website'),openFreePrompt:()=>open('free'),openRevision:()=>open('revision'),openPreview:()=>open('preview'),isBypass:id=>bypassTarget===id};
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

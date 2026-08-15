(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
  const step=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);


  function header(){
    const workspace=$('.workspace');if(!workspace||$('#guidedCleanHead'))return;
    const h=document.createElement('div');h.id='guidedCleanHead';h.className='guided-clean-head';h.innerHTML='<div class="guided-clean-brand"><img src="./sitebrief-logo.svg?v=6" alt=""><strong>Prompt.ai</strong></div><button type="button" class="guided-clean-exit" aria-label="Projekt schließen">×</button>';
    workspace.prepend(h);
    // Das x hat den halbfertigen Auftrag bisher wortlos zugeklappt. Wer mitten im Beschreiben
    // ist, verliert damit seine Eingaben, ohne gefragt worden zu sein.
    const leave=()=>{const home=$('#brandHome');if(home){home.click();return}const flow=$('#workflowApp'),welcome=$('#welcomePage');if(flow)flow.hidden=true;if(welcome)welcome.hidden=false};
    $('.guided-clean-exit',h).onclick=async()=>{
      const ask=window.PromptAiDialog?.confirm;
      if(!ask){leave();return}
      const ok=await ask('Diesen Auftrag jetzt abbrechen und zur Startseite zurück? Der Stand bleibt unter Projektstände gespeichert.',{title:'Auftrag abbrechen',confirmLabel:'Abbrechen und zurück',cancelLabel:'Weiterarbeiten',danger:true});
      if(ok)leave();
    };
  }

  const copy={
    1:['INTERNETSEITE','Beschreib deine Internetseite.','Deine erste Beschreibung reicht. Prompt.ai übernimmt sie und fragt nur weiter, wenn eine Angabe das Ergebnis wirklich verändert.'],
    2:['REFERENZEN','Hast du Referenzen?','Optional: Link, Screenshot, PDF oder andere Unterlage hinzufügen.'],
    3:['PROMPT.AI','Briefing wird verstanden','Prompt.ai übernimmt die wichtigen Angaben und bereitet die nächsten Entscheidungen im Hintergrund vor.'],
    4:['PROMPT.AI','Passende Regeln werden gesetzt','Technik, Qualitätsregeln und sinnvolle Module werden im Hintergrund vorbereitet.'],
    5:['PROMPT.AI','Vorschau wird vorbereitet','Beschreibung und Referenzen werden zu einer klaren Richtung zusammengeführt.'],
    6:['VORSCHAU','So könnte deine Internetseite aussehen.','Wähle die Richtung, die am besten passt. Du kannst sie danach noch gezielt verändern.'],
    7:['FEINSCHLIFF','Noch etwas ändern?','Sag in normalen Worten, was anders werden soll. Prompt.ai übernimmt die Änderung in die gewählte Richtung.'],
    8:['FERTIG','Dein Master-Prompt ist fertig.','Alle Angaben, Referenzen und Entscheidungen sind jetzt in einem klaren Auftrag zusammengeführt.']
  };

  function lead(panel,text){let p=$('.guided-clean-lead',panel);if(!p){p=document.createElement('p');p.className='guided-clean-lead';const h=panel.querySelector('h1,.preview-step-head');if(h?.classList?.contains('preview-step-head'))h.insertAdjacentElement('afterend',p);else h?.insertAdjacentElement('afterend',p)}p.textContent=text}

  function sync(){
    const m=mode(),clean=m==='guided'||m==='auto';document.documentElement.dataset.cleanProjectFlow=clean?'1':'0';
    if(!clean)return;
    header();const n=step(),panel=$(`.step-panel[data-step-panel="${n}"]`),c=copy[n];if(!panel||!c)return;
    document.documentElement.dataset.cleanProjectStep=String(n);
    const kicker=panel.querySelector(':scope > .section-kicker');if(kicker)kicker.textContent=c[0];
    const title=panel.querySelector(':scope > h1')||panel.querySelector('.preview-step-head h1');if(title)title.textContent=c[1];
    lead(panel,c[2]);
    if(n===1){const desc=$('#projectDescription');if(desc)desc.placeholder='z. B. Moderne Internetseite für einen Dachdecker in Lindhorst. Regional, hochwertig und mit Grün als Hauptfarbe.';const next=$('#stepProject .next-btn');if(next)next.innerHTML='Weiter <i>→</i>'}
    if(n===2){
      const back=$('#stepReferences .back-btn');if(back)back.textContent='← Beschreibung';
      const next=$('#stepReferences .next-btn');if(next)next.innerHTML='Weiter zur Vorschau <i>→</i>';
      // Uploads are hidden on plans without image references, so the lead must not promise them.
      const uploads=$('#stepReferences .dropzone');
      lead(panel,uploads&&uploads.offsetParent!==null?c[2]:'Optional: Link zu einer Website oder einem Google-Eintrag hinzufügen.');
      // Zwei Texte auf dieser Seite waren Absätze, wo eine Zeile reicht. Die Aufzählung
      // möglicher Unterlagen ("Speisekarten, Sitzpläne, Preislisten ...") sagt nichts, was
      // man nicht selbst weiß; die Formate und die Grenze dagegen schon.
      const formats=$('#uploadZone small');
      const short='PDF, PNG, JPG, WebP, TXT, MD, CSV oder JSON · max. 12 MB';
      if(formats&&formats.textContent!==short)formats.textContent=short;
      const clientLead=$('.client-context-lead');
      if(clientLead)clientLead.textContent='Echte Fakten statt Stil: aus der Website oder dem Google-Eintrag deines Kunden übernimmt Prompt.ai Adresse, Zeiten und Leistungen.';
    }
    if(n===6){const back=$('#stepPreviews .back-btn');if(back)back.textContent='← Beschreibung'}
    if(n===7){const back=$('#stepRefine .back-btn');if(back)back.textContent='← Vorschau'}
  }

  function init(){header();sync();new MutationObserver(()=>{clearTimeout(init._t);init._t=setTimeout(sync,40)}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden']});window.addEventListener('promptai:access',()=>setTimeout(sync,0));window.addEventListener('pageshow',()=>setTimeout(sync,0))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

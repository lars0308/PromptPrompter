(()=>{
  'use strict';
  // The Probelauf is a proof, not a product: it builds exactly the project that is open and shows
  // the result here. Nothing leaves this dialog - no ZIP, no publishing - because a one-shot build
  // is not a website anyone should ship. The real deliverable is the master prompt.
  // The card itself is moved, not rebuilt - app.js keeps its element references and every handler
  // that was already bound to those buttons stays intact.
  const $=(s,r=document)=>r.querySelector(s);
  const access=()=>window.PromptAiAccess||{plan:'free',isAdmin:false};
  // The build is Ultimate: the most expensive call in the product, and a proof rather than a
  // finished website.
  const isLocked=()=>{const a=access();return !a.isAdmin&&a.plan!=='ultimate'};

  function mount(){
    const card=$('.export-result-card'),host=$('#websiteBuildMount');
    if(!card||!host||card.parentElement===host)return;
    host.appendChild(card);
  }
  // The build reads the finished project: master prompt, chosen concept and sources. Without it the
  // AI would receive an empty briefing, so the dialog says what is missing instead of failing later.
  function readiness(){
    const blocked=$('#websiteBuildBlocked'),mountHost=$('#websiteBuildMount');
    if(!blocked||!mountHost)return;
    const ready=String($('#masterPrompt')?.value||'').trim().length>200;
    blocked.hidden=ready;mountHost.hidden=!ready;
    if(ready)return;
    // Eine Sackgasse mit zwei Knoepfen war die alte Antwort. Gefragt ist: was soll gebaut werden -
    // also ein Weg zu den gespeicherten Projekten, einer zum letzten, einer zu einem neuen und
    // einer fuer fertigen Quellcode als ZIP.
    blocked.innerHTML=`<strong>Was soll gebaut werden?</strong><p>Der Probelauf baut ein Projekt aus seinem Master-Prompt, der gewählten Richtung und den Quellen. Wähle ein gespeichertes Projekt aus oder führe eins bis zum Master-Prompt.</p><div class="website-build-blocked-actions"><button type="button" class="solid-btn" data-build-open="pick">Projekt auswählen</button><button type="button" class="outline-btn" data-build-open="last">Letztes Projekt öffnen</button><button type="button" class="outline-btn" data-build-open="new">Neues Projekt starten</button></div><p class="website-build-blocked-note">Du hast schon fertigen Quellcode? Ein ZIP mit <code>package.json</code> wird am Ende eines Projekts unter „Ergebnis“ gebaut – dort liegt die isolierte Quellcode-Vorschau.</p>`;
  }
  // Which project this is about has to be visible: the build is always the project that is open,
  // never a project you pick here.
  function projectLine(){
    const host=$('#websiteBuildProject');if(!host)return;
    const name=String($('#projectName')?.value||'').trim()||String($('#clientName')?.value||'').trim();
    host.textContent=name?`Gebaut wird: ${name}`:'Gebaut wird das Projekt, das gerade offen ist.';
  }
  function open(){
    const dialog=$('#websiteBuildDialog');if(!dialog)return;
    mount();readiness();projectLine();
    try{dialog.showModal()}catch{}
  }
  function bind(){
    document.addEventListener('click',event=>{
      const tile=event.target.closest?.('#workspaceBuildSiteBtn');
      if(tile){
        event.preventDefault();
        // A free account sees the tile locked; the plans dialog is the honest next step.
        if(isLocked()){$('#plansDialog')?.showModal();return}
        open();return;
      }
      const jump=event.target.closest?.('[data-build-open]');
      if(!jump)return;
      $('#websiteBuildDialog')?.close();
      // Auswaehlen heisst: die Liste der gespeicherten Projektstaende - dort steht jedes Projekt
      // mit Namen und Stand, und von dort fuehrt der Weg zurueck in den Ablauf.
      const target={pick:'#projectHistoryBtn',last:'#workspaceLastProjectBtn',new:'#workspaceNewProjectBtn'}[jump.dataset.buildOpen]||'#workspaceNewProjectBtn';
      setTimeout(()=>$(target)?.click(),80);
    },true);
  }
  function init(){mount();bind();window.addEventListener('promptai:access',()=>{mount();readiness()});
    // Later overlays rebuild parts of step 8, so the card is collected a few more times.
    let n=0;const timer=setInterval(()=>{mount();if(++n>=12)clearInterval(timer)},300);
  }
  window.PromptAiWebsiteBuild={open};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

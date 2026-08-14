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

  function styles(){
    if($('#websiteBuildUiStyles'))return;
    const s=document.createElement('style');s.id='websiteBuildUiStyles';s.textContent=`
      .website-build-body{padding:10px 28px 26px;overflow-y:auto}
      .website-build-blocked{margin:0 0 18px;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
      .website-build-blocked strong{display:block;font-size:14px}
      .website-build-blocked p{margin:6px 0 0;color:var(--muted);font-size:12px;line-height:1.55}
      .website-build-blocked-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
      .website-build-project{margin:0 0 14px;padding:11px 13px;border-left:3px solid var(--accent);border-radius:0 10px 10px 0;background:color-mix(in srgb,var(--accent) 6%,var(--surface));font-size:12.5px;font-weight:650;line-height:1.45}
      /* Inside the dialog the card is the whole content, so it drops the accent rail and the frame
         it needed as one section among many in the workflow. */
      #websiteBuildMount .export-result-card{margin-top:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;grid-template-columns:1fr!important}
      #websiteBuildMount .export-result-card:before{content:none!important}
      /* The dialog head already says what this is, so the card drops its own title. Its paragraph
         stays: app.js writes the GitHub publishing status into it. */
      #websiteBuildMount .export-result-card>div:first-child>span,#websiteBuildMount .export-result-card>div:first-child>h2{display:none!important}
      #websiteBuildMount #exportResultHint{font-size:12px!important;line-height:1.55!important}
      #websiteBuildMount .client-result-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px}
      @media(max-width:820px){.website-build-body{padding:8px 16px 24px}#websiteBuildMount .client-result-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }
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
    blocked.innerHTML=`<strong>Dafür wird ein fertiges Projekt gebraucht</strong><p>Der Probelauf baut genau das Projekt, das gerade offen ist – aus seinem Master-Prompt, der gewählten Richtung und den Quellen. Führe ein Projekt bis zum Master-Prompt und komm dann hierher zurück.</p><div class="website-build-blocked-actions"><button type="button" class="solid-btn" data-build-open="last">Letztes Projekt öffnen</button><button type="button" class="outline-btn" data-build-open="new">Neues Projekt starten</button></div>`;
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
    styles();mount();readiness();projectLine();
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
      setTimeout(()=>$(jump.dataset.buildOpen==='last'?'#workspaceLastProjectBtn':'#workspaceNewProjectBtn')?.click(),80);
    },true);
  }
  function init(){styles();mount();bind();window.addEventListener('promptai:access',()=>{mount();readiness()});
    // Later overlays rebuild parts of step 8, so the card is collected a few more times.
    let n=0;const timer=setInterval(()=>{mount();if(++n>=12)clearInterval(timer)},300);
  }
  window.PromptAiWebsiteBuild={open};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

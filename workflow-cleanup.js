(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let masterTimer=0,lastMasterSignature='';

  function injectStyles(){
    if($('#workflowCleanupStyles'))return;
    const style=document.createElement('style');style.id='workflowCleanupStyles';style.textContent=`
      /* Guided/Auto should feel like a workflow, not a stack of explanations. */
      #modeDescription,#modeRouteCard,#modeFlowPanel{display:none!important}
      #stepPrompt>#revisionStudio{display:none!important}

      /* Keep preview choices visible in Guided mode. */
      html[data-prompt-mode="guided"] #stepPreviews .preview-generation-controls label{display:flex!important;visibility:visible!important;pointer-events:auto!important}
      html[data-prompt-mode="guided"] #stepPreviews .preview-generation-controls{display:grid!important;grid-template-columns:minmax(190px,1fr) 112px auto!important;gap:10px!important;align-items:end!important}
      html[data-prompt-mode="guided"] #stepPreviews .preview-generation-controls>*{visibility:visible!important;pointer-events:auto!important}

      /* Entitlement-sensitive UI stays calm until the real account state is known. */
      html.prompt-access-pending #modeSwitch,
      html.prompt-access-pending #upgradeBtn,
      html.prompt-access-pending #upgradeMenuBtn,
      html.prompt-access-pending .workflow-upgrade,
      html.prompt-access-pending .quick-upgrade-note,
      html.prompt-access-pending .quick-tier-block,
      html.prompt-access-pending #settingsUpgradeNote,
      html.prompt-access-pending #apiAddonCard,
      html.prompt-access-pending #currentPlanBadge,
      html.prompt-access-pending .plan-current{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #modeSwitch,.workflow-upgrade,.quick-upgrade-note,.quick-tier-block,#settingsUpgradeNote,#apiAddonCard,#currentPlanBadge,.plan-current{transition:opacity .24s ease,visibility .24s ease}

      /* Master prompt reveal. */
      .master-generation{display:none;min-height:360px;place-items:center;text-align:center;padding:56px 18px}
      .master-generation-inner{width:min(480px,100%)}
      .master-generation-spinner{width:42px;height:42px;margin:0 auto 22px;border:2px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:masterSpin .9s linear infinite}
      .master-generation span{display:block;color:var(--accent);font-size:9px;font-weight:850;letter-spacing:.13em;margin-bottom:8px}
      .master-generation strong{display:block;font-size:clamp(24px,5vw,38px);letter-spacing:-.035em}
      .master-generation small{display:block;margin-top:10px;color:var(--muted);font-size:11px;line-height:1.55}
      .master-generation-track{height:3px;margin:26px auto 0;overflow:hidden;border-radius:99px;background:var(--line)}
      .master-generation-track i{display:block;width:38%;height:100%;background:var(--accent);animation:masterTrack 1.35s ease-in-out infinite}
      #stepPrompt.master-generating>.master-generation{display:grid!important}
      #stepPrompt.master-generating>:not(.section-kicker):not(h1):not(.master-generation){display:none!important}
      @keyframes masterSpin{to{transform:rotate(360deg)}}
      @keyframes masterTrack{0%{transform:translateX(-110%)}55%{transform:translateX(155%)}100%{transform:translateX(280%)}}

      /* Website revision becomes its own calm full-screen tool. */
      #quickRevisionDialog.quick-revision-dialog{width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;background:var(--paper)!important}
      #quickRevisionDialog.quick-revision-dialog::backdrop{background:var(--paper)!important;backdrop-filter:none!important}
      #quickRevisionDialog .dialog-frame{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important;background:var(--paper)!important;box-shadow:none!important;overflow:hidden!important}
      #quickRevisionDialog .dialog-head{position:sticky!important;top:0;z-index:4;min-height:78px;padding:16px max(22px,calc((100vw - 900px)/2))!important;border-bottom:1px solid var(--line)!important;background:color-mix(in srgb,var(--paper) 94%,transparent)!important;backdrop-filter:blur(16px)}
      #quickRevisionDialog .dialog-head h2{font-size:clamp(24px,4vw,34px)!important;margin:5px 0 0!important;line-height:1.05!important}
      #quickRevisionDialog .quick-revision-body{width:min(900px,100%);height:calc(100dvh - 78px);margin:0 auto;padding:30px 22px 80px!important;overflow-y:auto!important;overscroll-behavior:contain}
      #quickRevisionDialog .field{margin-bottom:18px!important}
      #quickRevisionDialog .field input,#quickRevisionDialog .field select{min-height:50px!important;height:50px!important;border-radius:12px!important;background:var(--surface)!important}
      #quickRevisionDialog .field textarea{min-height:118px!important;border-radius:12px!important;background:var(--surface)!important;padding:14px!important}
      #quickRevisionDialog .quick-accordion{margin-top:12px!important;border:1px solid var(--line)!important;border-radius:14px!important;background:var(--surface)!important;box-shadow:none!important}
      #quickRevisionDialog .quick-accordion summary{min-height:68px!important;padding:14px 16px!important}
      #quickRevisionDialog .quick-accordion summary small{display:none!important}
      #quickRevisionDialog .quick-accordion-content{padding:8px 16px 18px!important}
      #quickRevisionDialog .quick-revision-actions{padding-top:8px!important}

      /* Dedicated built-project preview page. */
      .project-preview-dialog{width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;background:var(--paper)!important;color:var(--ink)!important}
      .project-preview-dialog::backdrop{background:var(--paper)!important;backdrop-filter:none!important}
      .project-preview-shell{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr);background:var(--paper)}
      .project-preview-head{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:78px;padding:16px max(22px,calc((100vw - 980px)/2));border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--paper) 94%,transparent);backdrop-filter:blur(16px)}
      .project-preview-head span{display:block;color:var(--accent);font-size:9px;font-weight:850;letter-spacing:.13em}
      .project-preview-head h2{margin:5px 0 0;font-size:clamp(24px,4vw,34px);letter-spacing:-.035em}
      .project-preview-close{width:44px;height:44px;min-height:44px;border:1px solid var(--line);border-radius:50%;background:var(--surface);font-size:24px}
      .project-preview-body{width:min(980px,100%);margin:0 auto;padding:26px 22px 80px;overflow-y:auto;overscroll-behavior:contain}
      .project-preview-body .outcome-lab{margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
      .project-preview-body .outcome-lab-head{margin-bottom:20px!important}
      .project-preview-body .outcome-lab-head>div>span,.project-preview-body .outcome-lab-head h2{display:none!important}
      .project-preview-body .outcome-lab-head p{margin:0!important;max-width:760px!important}
      .project-preview-body .sandbox-preview-card{margin-top:0!important}

      .welcome-quick-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .welcome-quick-actions #workspacePreviewBtn{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}

      @media(max-width:760px){
        html[data-prompt-mode="guided"] #stepPreviews .preview-generation-controls{grid-template-columns:1fr 100px!important}
        html[data-prompt-mode="guided"] #stepPreviews .preview-generation-controls #generateConceptsBtn{grid-column:1/-1;width:100%!important}
        #quickRevisionDialog .dialog-head,.project-preview-head{padding:14px 16px!important}
        #quickRevisionDialog .quick-revision-body,.project-preview-body{padding:22px 14px 70px!important}
        #quickRevisionDialog .field-grid.two{grid-template-columns:1fr!important}
        .welcome-quick-actions{grid-template-columns:1fr!important}
        .master-generation{min-height:300px;padding:40px 12px}
      }
    `;document.head.appendChild(style);
  }

  function cleanWorkflowHints(){
    ['#modeDescription','#modeRouteCard','#modeFlowPanel'].forEach(sel=>{const node=$(sel);if(node)node.setAttribute('aria-hidden','true')});
  }

  function ensurePreviewChoice(){
    const controls=$('#stepPreviews .preview-generation-controls');if(!controls)return;
    $$('#stepPreviews .preview-generation-controls label').forEach(label=>{label.style.removeProperty('display');label.style.visibility='visible';label.style.pointerEvents='auto'});
  }

  function ensureRevisionPage(){
    const dialog=$('#quickRevisionDialog');if(!dialog)return;
    dialog.classList.add('standalone-tool-page');
    const heading=dialog.querySelector('.dialog-head h2');if(heading)heading.textContent='Website gezielt überarbeiten';
  }

  function ensurePreviewPage(){
    const lab=$('#outcomeLab');if(!lab)return false;
    let dialog=$('#projectPreviewDialog');
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='projectPreviewDialog';dialog.className='project-preview-dialog';
      dialog.innerHTML='<div class="project-preview-shell"><header class="project-preview-head"><div><span>PROJEKT-VORSCHAU</span><h2>Gebautes Projekt prüfen</h2></div><button type="button" class="project-preview-close" aria-label="Schließen">×</button></header><div class="project-preview-body"></div></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('.project-preview-close').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close()});
    }
    const body=dialog.querySelector('.project-preview-body');if(lab.parentElement!==body)body.appendChild(lab);
    let button=$('#workspacePreviewBtn');
    if(!button){
      button=document.createElement('button');button.type='button';button.className='outline-btn';button.id='workspacePreviewBtn';button.textContent='Gebautes Projekt prüfen';
      const actions=$('.welcome-quick-actions');if(actions)actions.appendChild(button);
      button.addEventListener('click',()=>{try{dialog.showModal()}catch{}});
    }
    return true;
  }

  function promptSignature(){
    const parts=[$('#projectName')?.value||'',$('#projectDescription')?.value||'',$('#selectedPreviewLarge')?.textContent||'',$('#masterPrompt')?.value?.slice(0,240)||''];
    let hash=2166136261;const text=parts.join('|');for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return `m${(hash>>>0).toString(36)}`;
  }
  function ensureMasterLoader(){
    const step=$('#stepPrompt');if(!step)return;
    if(!$('#masterGeneration')){
      const loader=document.createElement('div');loader.id='masterGeneration';loader.className='master-generation';loader.innerHTML='<div class="master-generation-inner"><div class="master-generation-spinner"></div><span>PROMPT.AI</span><strong>Master-Prompt wird generiert…</strong><small>Alle Angaben, Referenzen, Auswahlen und die gewählte Richtung werden jetzt zusammengeführt.</small><div class="master-generation-track"><i></i></div></div>';
      const summary=$('#completionSummary');step.insertBefore(loader,summary||step.children[2]||null);
    }
    const run=()=>{if(step.classList.contains('active'))startMasterReveal()};
    new MutationObserver(run).observe(step,{attributes:true,attributeFilter:['class']});run();
  }
  function startMasterReveal(){
    const step=$('#stepPrompt');if(!step?.classList.contains('active'))return;
    const signature=promptSignature();if(signature===lastMasterSignature&&sessionStorage.getItem(`prompt-ai-master-ready:${signature}`)==='1'){step.classList.remove('master-generating');return}
    lastMasterSignature=signature;clearTimeout(masterTimer);step.classList.add('master-generating');
    const started=Date.now();
    const reveal=()=>{
      const prompt=$('#masterPrompt')?.value?.trim()||'';
      const elapsed=Date.now()-started;
      if(elapsed<10000){masterTimer=setTimeout(reveal,Math.min(600,10000-elapsed));return}
      if(prompt.length<80&&elapsed<30000){masterTimer=setTimeout(reveal,600);return}
      step.classList.remove('master-generating');
      try{sessionStorage.setItem(`prompt-ai-master-ready:${signature}`,'1')}catch{}
      window.scrollTo({top:0,behavior:'smooth'});
    };
    masterTimer=setTimeout(reveal,500);
  }

  function removeEndTools(){
    const studio=$('#revisionStudio');if(studio)studio.hidden=true;
    ensurePreviewPage();
  }

  function observeLateUi(){
    const observer=new MutationObserver(()=>{cleanWorkflowHints();ensurePreviewChoice();ensureRevisionPage();removeEndTools()});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),15000);
  }

  function init(){
    injectStyles();cleanWorkflowHints();ensurePreviewChoice();ensureRevisionPage();removeEndTools();ensureMasterLoader();observeLateUi();
    window.addEventListener('promptai:access',()=>{setTimeout(()=>{ensurePreviewChoice();ensureRevisionPage()},0)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

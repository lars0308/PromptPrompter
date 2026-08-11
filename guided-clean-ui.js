(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mode=()=>$('.mode-switch button.active')?.dataset.mode||document.documentElement.dataset.promptMode||'guided';
  const step=()=>Number($('.step-panel.active')?.dataset.stepPanel||0);

  function styles(){
    if($('#guidedCleanStyles'))return;
    const s=document.createElement('style');s.id='guidedCleanStyles';s.textContent=`
      html[data-clean-project-flow="1"] body{background:#f3f5f6}
      html[data-clean-project-flow="1"] #workflowApp{display:grid!important;grid-template-columns:1fr!important;max-width:none!important;min-height:calc(100dvh - 68px);padding:22px 12px 54px;background:#f3f5f6}
      html[data-clean-project-flow="1"] #workflowApp[hidden]{display:none!important}
      html[data-clean-project-flow="1"] .progress-rail,html[data-clean-project-flow="1"] .guide-panel,html[data-clean-project-flow="1"] #modeDescription{display:none!important}
      html[data-clean-project-flow="1"] .workspace{display:block;width:min(780px,calc(100vw - 24px))!important;max-width:780px!important;margin:0 auto!important;padding:0!important;justify-self:center!important;align-self:start;background:var(--surface,#fff);border:1px solid #d9dde1;border-radius:22px;box-shadow:0 24px 70px rgba(29,38,48,.11);overflow:hidden}
      .guided-clean-head{display:none;align-items:center;justify-content:space-between;gap:16px;padding:17px 20px;border-bottom:1px solid #e2e5e8;background:var(--surface,#fff)}
      html[data-clean-project-flow="1"] .guided-clean-head{display:flex}
      .guided-clean-brand{display:flex;align-items:center;gap:10px}.guided-clean-brand img{width:26px;height:26px;object-fit:contain}.guided-clean-brand strong{font-size:16px;letter-spacing:-.02em}.guided-clean-exit{width:42px;height:42px;border:0;background:transparent;font-size:26px;line-height:1;color:#6d747b;border-radius:50%}.guided-clean-exit:hover{background:#f0f2f4;color:#20252b}
      html[data-clean-project-flow="1"] .step-panel{min-height:0!important;padding:34px 34px 22px!important;background:var(--surface,#fff)}
      html[data-clean-project-flow="1"] .step-panel.active{display:flex!important;min-height:620px!important;flex-direction:column}
      html[data-clean-project-flow="1"] .step-panel>.section-kicker{margin:0 0 14px;color:#1689c7;font-size:10px;font-weight:850;letter-spacing:.1em}
      html[data-clean-project-flow="1"] .step-panel>h1,html[data-clean-project-flow="1"] .preview-step-head h1{margin:0!important;max-width:680px!important;font-family:Arial,Helvetica,sans-serif!important;font-size:clamp(32px,6vw,45px)!important;font-weight:800!important;line-height:1.02!important;letter-spacing:-.045em!important;color:#161b20}
      .guided-clean-lead{max-width:640px;margin:16px 0 28px;color:#66717a;font-size:13px;line-height:1.6}
      html[data-clean-project-flow="1"] .field{gap:9px}html[data-clean-project-flow="1"] .field>span,html[data-clean-project-flow="1"] .compact-field>span{font-size:9px;color:#505a62;letter-spacing:.06em}
      html[data-clean-project-flow="1"] .field input,html[data-clean-project-flow="1"] .field select,html[data-clean-project-flow="1"] .field textarea,html[data-clean-project-flow="1"] .compact-field select{border:1px solid #cfd5da!important;border-radius:8px!important;background:#fff!important}
      html[data-clean-project-flow="1"] .field textarea{min-height:176px;padding:15px!important;font-size:15px;line-height:1.55}
      html[data-clean-project-flow="1"] .solid-btn,html[data-clean-project-flow="1"] .outline-btn{min-height:48px;border-radius:8px!important;padding:0 18px;font-size:12px}
      html[data-clean-project-flow="1"] .solid-btn{border-color:#1689c7!important;background:#1689c7!important;color:white!important}html[data-clean-project-flow="1"] .solid-btn:hover{background:#1179b1!important}
      html[data-clean-project-flow="1"] .outline-btn{border-color:#c7cdd2!important;background:#fff!important;color:#20252b!important}
      html[data-clean-project-flow="1"] .text-btn{font-size:11px;text-decoration:none;color:#626c75}
      html[data-clean-project-flow="1"] .step-actions{margin-top:auto!important;padding-top:22px!important;border-top:1px solid #e4e7e9!important;gap:12px}
      html[data-clean-project-flow="1"] #stepProject .client-context-card,html[data-clean-project-flow="1"] #stepProject>.field-grid,html[data-clean-project-flow="1"] #stepProject .understanding{display:none!important}
      html[data-clean-project-flow="1"] #stepProject .field-large{margin:0 0 18px}html[data-clean-project-flow="1"] #stepProject .field-large>span{display:none}
      html[data-clean-project-flow="1"] #stepReferences .reference-url-add{grid-template-columns:1fr!important;gap:8px;margin-top:0}html[data-clean-project-flow="1"] #stepReferences #addUrlBtn{width:100%}
      html[data-clean-project-flow="1"] #stepReferences .dropzone{grid-template-columns:42px 1fr!important;gap:12px;min-height:100px;margin-top:14px;padding:15px;border-color:#cfd5da;border-radius:10px;background:#f8f9fa}html[data-clean-project-flow="1"] #stepReferences .dropzone button{grid-column:1/-1;width:100%}
      html[data-clean-project-flow="1"] #stepReferences .reference-note-block{margin-top:18px;padding-top:13px;border-color:#e2e5e8;grid-template-columns:62px 1fr}
      html[data-clean-project-flow="1"] .streamline-working{min-height:430px!important;margin:auto 0;padding:32px 18px!important}
      html[data-clean-project-flow="1"] .streamline-working strong{font-size:30px!important}.streamline-working small{font-size:12px!important}
      html[data-clean-project-flow="1"] #stepPreviews .preview-step-head{display:block!important}.guided-clean-project-flow #stepPreviews .preview-generation-controls{margin-top:18px}
      html[data-clean-project-flow="1"] #stepPreviews .preview-generation-controls{display:grid!important;grid-template-columns:minmax(0,1fr) 100px!important;gap:9px;padding:12px!important;border:1px solid #e0e4e7!important;border-radius:10px!important;background:#f8f9fa!important}
      html[data-clean-project-flow="1"] #stepPreviews #generateConceptsBtn{grid-column:1/-1;width:100%}
      html[data-clean-project-flow="1"] #stepPreviews .generation-status{margin:16px 0 8px;color:#66717a;font-size:11px}
      html[data-clean-project-flow="1"] #stepPreviews .concept-gallery{display:grid;grid-template-columns:1fr;gap:14px}
      html[data-clean-project-flow="1"] #stepPreviews .concept-option{border:1px solid #d9dde1!important;border-radius:14px!important;background:#fff!important;overflow:hidden}
      html[data-clean-project-flow="1"] #stepRefine .quick-refinements{display:flex;gap:7px;overflow-x:auto;padding:2px 0 10px}html[data-clean-project-flow="1"] #stepRefine .quick-refinements button{flex:0 0 auto;border:1px solid #d5dade;border-radius:999px;background:#fff;padding:8px 11px;font-size:10px}
      html[data-clean-project-flow="1"] #stepRefine #selectedPreviewLarge{margin:18px 0}
      html[data-clean-project-flow="1"] #stepPrompt .master-prompt{min-height:360px!important;border:1px solid #cfd5da!important;border-radius:10px!important;background:#fff!important;padding:16px!important;font-size:12px!important;line-height:1.55!important}
      html[data-clean-project-flow="1"] #stepPrompt .website-build-delivery,html[data-clean-project-flow="1"] #stepPrompt .revision-studio{border-radius:12px}
      @media(max-width:760px){
        html[data-clean-project-flow="1"] #workflowApp{padding:0;background:#fff}
        html[data-clean-project-flow="1"] .workspace{width:100%!important;max-width:none!important;border:0;border-radius:0;box-shadow:none;min-height:calc(100dvh - 68px)}
        .guided-clean-head{padding:14px 15px}
        html[data-clean-project-flow="1"] .step-panel{padding:28px 16px 18px!important}
        html[data-clean-project-flow="1"] .step-panel.active{min-height:calc(100dvh - 128px)!important}
        html[data-clean-project-flow="1"] .step-panel>h1,html[data-clean-project-flow="1"] .preview-step-head h1{font-size:34px!important}
        .guided-clean-lead{font-size:12px;margin:13px 0 22px}
        html[data-clean-project-flow="1"] #stepReferences .dropzone{grid-template-columns:38px 1fr!important}
      }
      html[data-theme="dark"][data-clean-project-flow="1"] body{background:var(--paper)}
      html[data-theme="dark"][data-clean-project-flow="1"] #workflowApp{background:var(--paper)}
      html[data-theme="dark"][data-clean-project-flow="1"] .workspace{background:var(--surface);border-color:var(--line);box-shadow:0 24px 70px rgba(0,0,0,.4)}
      html[data-theme="dark"] .guided-clean-head{border-color:var(--line);background:var(--surface)}
      html[data-theme="dark"] .guided-clean-exit{color:var(--muted)}html[data-theme="dark"] .guided-clean-exit:hover{background:var(--surface-soft);color:var(--ink)}
      html[data-theme="dark"][data-clean-project-flow="1"] .step-panel{background:var(--surface)}
      html[data-theme="dark"][data-clean-project-flow="1"] .step-panel>h1,html[data-theme="dark"][data-clean-project-flow="1"] .preview-step-head h1{color:var(--ink)}
      html[data-theme="dark"] .guided-clean-lead{color:var(--muted)}
      html[data-theme="dark"][data-clean-project-flow="1"] .field>span,html[data-theme="dark"][data-clean-project-flow="1"] .compact-field>span{color:var(--muted)}
      html[data-theme="dark"][data-clean-project-flow="1"] .field input,html[data-theme="dark"][data-clean-project-flow="1"] .field select,html[data-theme="dark"][data-clean-project-flow="1"] .field textarea,html[data-theme="dark"][data-clean-project-flow="1"] .compact-field select{border-color:var(--line)!important;background:var(--input,var(--surface))!important;color:var(--ink)}
      html[data-theme="dark"][data-clean-project-flow="1"] .outline-btn{border-color:var(--line)!important;background:var(--surface)!important;color:var(--ink)!important}
      html[data-theme="dark"][data-clean-project-flow="1"] .text-btn{color:var(--muted)}
      html[data-theme="dark"][data-clean-project-flow="1"] .step-actions{border-color:var(--line)!important}
      html[data-theme="dark"][data-clean-project-flow="1"] #stepReferences .dropzone{border-color:var(--line);background:var(--surface-soft)}
      html[data-theme="dark"][data-clean-project-flow="1"] #stepReferences .reference-note-block{border-color:var(--line)}
      html[data-theme="dark"][data-clean-project-flow="1"] #stepPreviews .preview-generation-controls{border-color:var(--line)!important;background:var(--surface-soft)!important}
      html[data-theme="dark"][data-clean-project-flow="1"] #stepPreviews .generation-status{color:var(--muted)}
      html[data-theme="dark"][data-clean-project-flow="1"] #stepPreviews .concept-option{border-color:var(--line)!important;background:var(--surface)!important}
      html[data-theme="dark"][data-clean-project-flow="1"] #stepRefine .quick-refinements button{border-color:var(--line);background:var(--surface)}
      html[data-theme="dark"][data-clean-project-flow="1"] #stepPrompt .master-prompt{border-color:var(--line)!important;background:var(--input,var(--surface))!important;color:var(--ink)}
      @media(max-width:760px){html[data-theme="dark"][data-clean-project-flow="1"] #workflowApp{background:var(--paper)}}
    `;document.head.appendChild(s);
  }

  function header(){
    const workspace=$('.workspace');if(!workspace||$('#guidedCleanHead'))return;
    const h=document.createElement('div');h.id='guidedCleanHead';h.className='guided-clean-head';h.innerHTML='<div class="guided-clean-brand"><img src="./sitebrief-logo.svg?v=4" alt=""><strong>Prompt.ai</strong></div><button type="button" class="guided-clean-exit" aria-label="Projekt schließen">×</button>';
    workspace.prepend(h);
    $('.guided-clean-exit',h).onclick=()=>{const home=$('#brandHome');if(home){home.click();return}const flow=$('#workflowApp'),welcome=$('#welcomePage');if(flow)flow.hidden=true;if(welcome)welcome.hidden=false};
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
    if(n===2){const back=$('#stepReferences .back-btn');if(back)back.textContent='← Beschreibung';const next=$('#stepReferences .next-btn');if(next)next.innerHTML='Weiter zur Vorschau <i>→</i>'}
    if(n===6){const back=$('#stepPreviews .back-btn');if(back)back.textContent='← Referenzen'}
    if(n===7){const back=$('#stepRefine .back-btn');if(back)back.textContent='← Vorschau'}
  }

  function init(){styles();header();sync();new MutationObserver(()=>{clearTimeout(init._t);init._t=setTimeout(sync,40)}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden']});window.addEventListener('promptai:access',()=>setTimeout(sync,0));window.addEventListener('pageshow',()=>setTimeout(sync,0))}
  styles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

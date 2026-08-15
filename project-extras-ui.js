(()=>{
  'use strict';
  // Bausteine (modules) and skills only ever reached the master prompt in expert mode: the step
  // that selects them is skipped in the two guided modes, and the "always active" setting was never
  // applied when a project started. So the uploaded Claude/Codex skill file - the thing that
  // actually teaches the AI how to build moving elements - did nothing in the modes almost everyone
  // uses. Two levels now: the library switch is the default for every new project, and this dialog
  // overrides it for the project at hand.
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const api=()=>window.PromptAiProjectExtras||null;


  function render(){
    const host=$('#projectExtrasList'),data=api()?.list?.();
    if(!host||!data)return;
    const group=(title,hint,items,kind)=>`<section class="project-extras-group"><h3>${esc(title)}</h3><p>${esc(hint)}</p>${
      items.length?items.map(item=>`<div class="project-extras-row"><div><strong>${esc(item.name)}${item.recommended&&!item.on?'<span class="project-extras-mark">PASST</span>':''}${item.source?'<span class="project-extras-mark">DATEI</span>':''}</strong><small>${esc(item.info||'')}</small></div><button type="button" class="project-extras-switch" role="switch" aria-pressed="${item.on?'true':'false'}" aria-label="${esc(item.name)}" data-extra-kind="${kind}" data-extra-id="${esc(item.id)}"></button></div>`).join('')
        :`<p class="project-extras-empty">Noch nichts in der Bibliothek. Lege ${kind==='module'?'einen Baustein an':kind==='template'?'in der Bibliothek eine Prompt-Vorlage an':'eine Skill-Datei aus Claude oder Codex hoch'} – danach steht er hier für jedes Projekt bereit.</p>`}</section>`;
    host.innerHTML=group('Prompt-Vorlage','Dein eigenes Grundgerüst für den Master-Prompt. Es kann immer nur eine aktiv sein.',data.templates||[],'template')
      +group('Bausteine','Worin dieses Projekt besonders gut sein muss.',data.modules,'module')
      +group('Skills','Arbeitsregeln für den Ziel-Agenten – auch hochgeladene .md-Dateien aus Claude oder Codex.',data.skills,'skill');
  }

  function open(){render();const dialog=$('#projectExtrasDialog');try{dialog?.showModal()}catch{}}

  // One line wherever the project is confirmed: never a silent activation.
  function syncNote(){
    const data=api()?.list?.();if(!data)return;
    const host=$('#projectConfirmExtras');if(!host)return;
    const active=[...(data.templates||[]),...data.modules,...data.skills].filter(item=>item.on);
    host.innerHTML=active.length
      ? `<strong>Zusätzlich aktiv:</strong> ${active.map(item=>esc(item.name)).join(' · ')}<button type="button" data-extras-open>ändern</button>`
      : `Für dieses Projekt sind keine Bausteine oder Skills aktiv.<button type="button" data-extras-open>auswählen</button>`;
  }

  function bind(){
    document.addEventListener('click',event=>{
      if(event.target.closest?.('[data-extras-open]')){event.preventDefault();open();return}
      const button=event.target.closest?.('.project-extras-switch');if(!button)return;
      event.preventDefault();
      const next=button.getAttribute('aria-pressed')!=='true';
      api()?.set?.(button.dataset.extraKind,button.dataset.extraId,next);
      button.setAttribute('aria-pressed',next?'true':'false');
      syncNote();
    },true);
    window.addEventListener('promptai:project-extras',()=>{render();syncNote()});
  }
  function init(){bind();syncNote()}
  window.PromptAiProjectExtrasUi={open,render,syncNote};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

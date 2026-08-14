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

  function styles(){
    if($('#projectExtrasStyles'))return;
    const el=document.createElement('style');el.id='projectExtrasStyles';el.textContent=`
      .project-extras-body{padding:6px 28px 26px;overflow-y:auto}
      .project-extras-lead{margin:0 0 18px;color:var(--muted);font-size:12px;line-height:1.55}
      .project-extras-group{margin-top:18px}
      .project-extras-group:first-child{margin-top:0}
      .project-extras-group>h3{margin:0 0 4px;font-size:15px}
      .project-extras-group>p{margin:0 0 11px;color:var(--muted);font-size:11px;line-height:1.5}
      .project-extras-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
      .project-extras-row+.project-extras-row{margin-top:8px}
      .project-extras-row strong{display:block;font-size:13px}
      .project-extras-row small{display:block;margin-top:3px;color:var(--muted);font-size:11px;line-height:1.45}
      .project-extras-mark{display:inline-block;margin-left:7px;padding:2px 6px;border-radius:99px;background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent);font-size:9px;font-weight:850;letter-spacing:.06em;vertical-align:2px}
      /* A real switch, not a checkbox: on a phone the state has to be readable at a glance. */
      .project-extras-switch{position:relative;flex:0 0 auto;width:46px;height:27px;border:0;padding:0;border-radius:99px;background:color-mix(in srgb,var(--ink) 17%,transparent);cursor:pointer;transition:background .16s ease}
      .project-extras-switch:after{content:'';position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.28);transition:transform .16s ease}
      .project-extras-switch[aria-pressed="true"]{background:var(--accent)}
      .project-extras-switch[aria-pressed="true"]:after{transform:translateX(19px)}
      .project-extras-empty{padding:14px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);font-size:11px;line-height:1.5}
      /* The line in the guided summary that says what is active, with the way to change it. */
      .project-extras-note{margin:14px 0 0;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--muted);font-size:12px;line-height:1.55}
      .project-extras-note strong{color:var(--ink)}
      .project-extras-note button{margin-left:8px;padding:0;border:0;background:none;color:var(--accent);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer}
      @media(max-width:820px){.project-extras-body{padding:6px 16px 24px}.project-extras-row{padding:11px 12px;gap:10px}}
    `;document.head.appendChild(el);
  }

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

  function open(){styles();render();const dialog=$('#projectExtrasDialog');try{dialog?.showModal()}catch{}}

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
  function init(){styles();bind();syncNote()}
  window.PromptAiProjectExtrasUi={open,render,syncNote};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

(()=>{
  'use strict';
  // Tarif-Fehler waren bisher nicht nachstellbar: als Gast ist "Selbst einstellen" gesperrt, und
  // ein zweites Konto je Tarif anzulegen ist Unsinn. Diese Ansicht schaltet nur die Oberflaeche
  // um - der Server rechnet weiter mit dem echten Tarif ab, hier wird nichts freigeschaltet.
  // Sie erscheint nur, wenn das echte Konto ein Administratorkonto ist.
  const $=(s,r=document)=>r.querySelector(s);
  const KEY='prompt-ai-plan-preview-v1';
  const PLANS=[['','Eigener Zugang'],['free','Ansehen als Free'],['pro','Ansehen als Pro'],['ultimate','Ansehen als Ultimate']];

  let real=window.PromptAiAccess||null,view='';
  try{view=String(sessionStorage.getItem(KEY)||'')}catch{}
  if(!PLANS.some(([value])=>value===view))view='';

  // Die simulierte Sicht ist immer die eines normalen Kontos: ein Administrator umgeht sonst
  // ueberall genau die Sperren, die geprueft werden sollen.
  function shape(access){
    if(!view||!access||typeof access!=='object')return access;
    return {...access,plan:view,isAdmin:false,ownApiKeys:view==='ultimate'?Boolean(access.ownApiKeys):false};
  }
  Object.defineProperty(window,'PromptAiAccess',{
    configurable:true,
    get(){return shape(real)},
    set(value){real=value}
  });

  const isOwner=()=>Boolean(real?.isAdmin);
  function announce(){
    try{window.dispatchEvent(new CustomEvent('promptai:access',{detail:window.PromptAiAccess}))}catch{}
    try{window.PromptAiQuota?.refresh?.()}catch{}
    try{window.dispatchEvent(new CustomEvent('promptai:home'))}catch{}
  }
  function select(value){
    view=PLANS.some(([plan])=>plan===value)?value:'';
    try{view?sessionStorage.setItem(KEY,view):sessionStorage.removeItem(KEY)}catch{}
    mark();announce();
    window.PromptAiToast?.show?.(view?`Ansicht: ${view.charAt(0).toUpperCase()}${view.slice(1)} – nur die Oberfläche, nicht die Abrechnung.`:'Wieder dein eigener Zugang.');
  }
  function mark(){
    const field=$('#planPreviewSelect');
    if(field&&field.value!==view)field.value=view;
    document.documentElement.dataset.planPreview=view||'';
  }

  function styles(){
    if($('#planPreviewStyles'))return;
    const style=document.createElement('style');style.id='planPreviewStyles';
    style.textContent=`
      .plan-preview-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,260px);gap:12px;align-items:center;width:100%;margin:0 0 18px;padding:15px 16px;border:1px dashed color-mix(in srgb,var(--accent) 40%,var(--line));border-radius:14px;background:color-mix(in srgb,var(--accent) 4%,var(--surface))}
      .plan-preview-row span{display:block;color:var(--accent);font:850 8.5px/1 ui-monospace,monospace;letter-spacing:.13em;text-transform:uppercase}
      .plan-preview-row strong{display:block;margin-top:5px;font-size:14px}
      .plan-preview-row small{display:block;margin-top:4px;color:var(--muted);font-size:9px;line-height:1.5}
      .plan-preview-row select{width:100%;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--input,var(--surface));color:var(--ink);font:600 12px/1 inherit}
      @media(max-width:720px){.plan-preview-row{grid-template-columns:1fr}}
      html[data-plan-preview]:not([data-plan-preview=""]) body:after{
        content:"SIMULIERTE TARIF-ANSICHT";
        position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:2147482000;
        padding:5px 11px;border-radius:999px;background:#c8791f;color:#fff;
        font:800 9px/1 ui-monospace,monospace;letter-spacing:.12em;pointer-events:none;
      }
    `;document.head.appendChild(style);
  }

  // Die Ansicht gehoert in die Verwaltung, nicht ins Hauptmenue: sie ist ein Werkzeug zum Pruefen
  // und kein Weg, den ein Kunde je gehen soll. Im Menue stand sie mitten zwischen Bibliothek und
  // Abonnement - dort, wo jeder andere Eintrag zu einer Funktion des Produkts fuehrt.
  function mount(){
    if(!isOwner())return;
    const pane=$('[data-admin-pane="overview"]');if(!pane||$('#planPreviewRow'))return;
    styles();
    const row=document.createElement('div');
    row.className='plan-preview-row';row.id='planPreviewRow';
    row.innerHTML='<div><span>Tarif-Ansicht</span><strong>Die App mit fremden Augen ansehen</strong><small>Schaltet nur die Oberfläche um. Abgerechnet wird weiter über deinen echten Tarif, freigeschaltet wird nichts. Am unteren Rand steht ein Hinweis, solange eine fremde Ansicht aktiv ist.</small></div><select id="planPreviewSelect" aria-label="Tarif-Ansicht"></select>';
    const field=row.querySelector('select');
    for(const [value,label] of PLANS){
      const option=document.createElement('option');option.value=value;option.textContent=label;field.appendChild(option);
    }
    field.addEventListener('change',()=>select(field.value));
    pane.insertBefore(row,pane.firstElementChild?.nextElementSibling||null);
    mark();
  }

  // Ein alter Eintrag im Menue wuerde sonst neben dem neuen stehen bleiben, wenn eine
  // zwischengespeicherte Fassung der Oberflaeche ihn noch einmal aufbaut.
  function dropOldMenuRow(){
    const menu=$('#topbarMenu');
    if(menu)menu.querySelector(':scope > .plan-preview-row')?.remove();
  }

  function init(){
    dropOldMenuRow();mount();mark();
    // Der Zugang kommt spaeter als das Menue, und das Menue wird mehrfach neu aufgebaut.
    new MutationObserver(()=>{dropOldMenuRow();mount()}).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('promptai:access',()=>{mount();mark()});
    if(view)setTimeout(announce,600);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.PromptAiPlanPreview={select,current:()=>view};
})();

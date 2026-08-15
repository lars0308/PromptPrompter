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
      .plan-preview-row{display:grid;gap:5px;width:100%;padding:10px;margin-top:6px;border:1px dashed var(--line,#3a4a5a);border-radius:12px}
      .plan-preview-row>span{color:var(--muted,#8b9dc3);font:800 8.5px/1 ui-monospace,monospace;letter-spacing:.13em;text-transform:uppercase}
      .plan-preview-row select{width:100%;min-height:36px;padding:0 9px;border:1px solid var(--line,#3a4a5a);border-radius:9px;background:var(--surface,transparent);color:inherit;font:600 12px/1 inherit}
      html[data-plan-preview]:not([data-plan-preview=""]) body:after{
        content:"SIMULIERTE TARIF-ANSICHT";
        position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:2147482000;
        padding:5px 11px;border-radius:999px;background:#c8791f;color:#fff;
        font:800 9px/1 ui-monospace,monospace;letter-spacing:.12em;pointer-events:none;
      }
    `;document.head.appendChild(style);
  }

  function mount(){
    if(!isOwner())return;
    const menu=$('#topbarMenu');if(!menu||$('#planPreviewRow'))return;
    styles();
    const row=document.createElement('div');
    row.className='plan-preview-row';row.id='planPreviewRow';
    row.innerHTML='<span>Tarif-Ansicht</span><select id="planPreviewSelect"></select>';
    const field=row.querySelector('select');
    for(const [value,label] of PLANS){
      const option=document.createElement('option');option.value=value;option.textContent=label;field.appendChild(option);
    }
    field.addEventListener('change',()=>select(field.value));
    menu.appendChild(row);
    mark();
  }

  function init(){
    mount();mark();
    // Der Zugang kommt spaeter als das Menue, und das Menue wird mehrfach neu aufgebaut.
    new MutationObserver(()=>mount()).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('promptai:access',()=>{mount();mark()});
    if(view)setTimeout(announce,600);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.PromptAiPlanPreview={select,current:()=>view};
})();

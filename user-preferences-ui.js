(()=>{
  'use strict';
  // Settings a user actually has a reason to change. Everything here does something measurable -
  // a switch that only looks like a setting is worse than no setting at all.
  const $=(s,r=document)=>r.querySelector(s);
  const KEY='prompt-ai-preferences-v1';
  const THEME_KEY='sitebrief-theme';
  const START_KEY='sitebrief-v6-continue-workflow';
  const DEFAULTS={colorScheme:'system',defaultAgent:'',defaultClientType:'kunde',startView:'home',confirmBeforePrompt:true,reduceMotion:false};

  const read=()=>{try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...DEFAULTS}}};
  const write=value=>{try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}};

  function applyColorScheme(scheme){
    try{
      if(scheme==='system'){localStorage.removeItem(THEME_KEY);
        const dark=matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.theme=dark?'dark':'light';return;
      }
      localStorage.setItem(THEME_KEY,scheme);
      document.documentElement.dataset.theme=scheme;
    }catch{}
  }
  function applyReduceMotion(on){
    document.documentElement.classList.toggle('prompt-reduce-motion',Boolean(on));
    if($('#promptReduceMotionStyle'))return;
    const el=document.createElement('style');el.id='promptReduceMotionStyle';
    el.textContent='html.prompt-reduce-motion *,html.prompt-reduce-motion *:before,html.prompt-reduce-motion *:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}';
    document.head.appendChild(el);
  }
  function apply(prefs=read()){
    applyColorScheme(prefs.colorScheme);
    applyReduceMotion(prefs.reduceMotion);
    // Read by app.js when a project starts, so a preference is not a second source of truth.
    window.PromptAiPreferences={...prefs};
  }

  function fillAgents(){
    const select=$('#setDefaultAgent');if(!select||select.dataset.filled==='1')return;
    const source=$('#targetAgent');
    const options=source?[...source.options].map(option=>[option.value,option.textContent]):[['codex','Codex'],['claude','Claude Code'],['gemini','Gemini'],['chatgpt','ChatGPT'],['cursor','Cursor'],['v0','v0'],['universal','Universell']];
    select.innerHTML=options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
    select.dataset.filled='1';
  }
  function render(){
    fillAgents();
    const prefs=read();
    const set=(id,value)=>{const node=$(id);if(!node)return;if(node.type==='checkbox')node.checked=Boolean(value);else node.value=String(value)};
    set('#setColorScheme',prefs.colorScheme);
    if($('#setDefaultAgent')&&prefs.defaultAgent)$('#setDefaultAgent').value=prefs.defaultAgent;
    set('#setDefaultClientType',prefs.defaultClientType);
    set('#setStartView',prefs.startView);
    set('#setConfirmBeforePrompt',prefs.confirmBeforePrompt);
    set('#setReduceMotion',prefs.reduceMotion);
  }
  function collect(){
    const prefs=read();
    const value=(id,fallback)=>{const node=$(id);if(!node)return fallback;return node.type==='checkbox'?node.checked:node.value};
    return {
      colorScheme:value('#setColorScheme',prefs.colorScheme),
      defaultAgent:value('#setDefaultAgent',prefs.defaultAgent),
      defaultClientType:value('#setDefaultClientType',prefs.defaultClientType),
      startView:value('#setStartView',prefs.startView),
      confirmBeforePrompt:value('#setConfirmBeforePrompt',prefs.confirmBeforePrompt),
      reduceMotion:value('#setReduceMotion',prefs.reduceMotion)
    };
  }
  function save(){const prefs=collect();write(prefs);apply(prefs);window.dispatchEvent(new CustomEvent('promptai:preferences',{detail:prefs}))}

  async function clearLocal(){
    const ok=await window.PromptAiDialog?.confirm?.('Alle lokal gespeicherten Daten dieser App von diesem Gerät löschen? Projekte, die in deinem Konto gespeichert sind, bleiben erhalten.',{title:'Auf diesem Gerät löschen',confirmLabel:'Löschen',danger:true});
    if(!ok)return;
    try{
      const keep=localStorage.getItem(THEME_KEY);
      localStorage.clear();sessionStorage.clear();
      if(keep)localStorage.setItem(THEME_KEY,keep);
    }catch{}
    location.reload();
  }
  function bind(){
    document.addEventListener('change',event=>{
      if(event.target.closest?.('#userPreferenceSection'))save();
    },true);
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#clearLocalDataBtn')){event.preventDefault();clearLocal()}
    },true);
    const dialog=$('#settingsDialog');
    if(dialog)new MutationObserver(()=>{if(dialog.open)render()}).observe(dialog,{attributes:true,attributeFilter:['open']});
    // The start view is a one-shot flag the workflow already understands.
    addEventListener('load',()=>{
      if(read().startView!=='last')return;
      try{if(!localStorage.getItem('sitebrief-v6-state'))return;sessionStorage.setItem(START_KEY,'1')}catch{}
    },{once:true});
  }
  function init(){apply();render();bind()}
  window.PromptAiUserPreferences={read,apply,render};
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

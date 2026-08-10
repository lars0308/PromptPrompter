(()=>{
  'use strict';
  const nativeFetch=window.fetch.bind(window);let profiles=[],loading=null;const selected={};
  function taskFor(action){const a=String(action||'').toLowerCase();if(a==='revision-brief'||a==='intake')return'analysis';if(a==='review')return'questions';if(a==='website')return'website';if(a==='preview-image')return'image';if(a==='learning-feedback')return'learning';if(a==='free-prompt')return'freeprompt';return'prompt'}
  function candidates(task){return profiles.filter(x=>x.enabled!==false&&(x.tasks||[]).includes(task)).sort((a,b)=>(a.priority||100)-(b.priority||100))}
  function route(task){const rows=candidates(task),id=selected[task];return rows.find(x=>x.id===id)||rows[0]||null}
  function choose(task,id){if(id)selected[task]=id;else delete selected[task];try{localStorage.setItem('prompt-ai-system-ai-selection-v1',JSON.stringify(selected))}catch{}return route(task)}
  try{Object.assign(selected,JSON.parse(localStorage.getItem('prompt-ai-system-ai-selection-v1')||'{}'))}catch{}
  async function refresh(){if(loading)return loading;loading=nativeFetch('/api/config',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(data=>{profiles=Array.isArray(data.systemAiProfiles)?data.systemAiProfiles:[];window.PromptAiSystemAI={profiles,routeFor:route,candidatesFor:candidates,choose,selected,refresh};window.dispatchEvent(new CustomEvent('promptai:system-ai-ready',{detail:{profiles}}));return profiles}).catch(()=>profiles).finally(()=>{loading=null});return loading}
  function shouldUseSystem(body){if(body?.useOwnApi===true)return false;return (document.documentElement.dataset.promptMode||'')!=='expert'}
  window.fetch=async function(input,init){try{const url=typeof input==='string'?input:input?.url||'',method=String(init?.method||input?.method||'GET').toUpperCase();if(method==='POST'&&/\/api\/generate(?:\?|$)/.test(url)&&typeof init?.body==='string'){const body=JSON.parse(init.body),action=String(body.action||'concepts');if(!['sandbox-build','preview-image','free-prompt'].includes(action)&&shouldUseSystem(body)){if(!profiles.length)await refresh();const task=taskFor(action),picked=route(task);if(picked){body.engine=picked.provider;body.model=picked.model;body.systemAiProfileId=picked.id;body.systemAiProfileLabel=picked.label;init={...init,body:JSON.stringify(body)}}}}}catch{}return nativeFetch(input,init)};
  window.addEventListener('promptai:system-ai-updated',refresh);window.addEventListener('promptai:access',()=>{if(!profiles.length)refresh()});refresh();
})();

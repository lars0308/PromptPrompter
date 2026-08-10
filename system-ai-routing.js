(()=>{
  'use strict';
  const nativeFetch=window.fetch.bind(window);
  let profiles=[],loading=null;
  function taskFor(action){const a=String(action||'').toLowerCase();if(a==='revision-brief'||a==='intake')return'analysis';if(a==='review')return'questions';if(a==='website')return'website';if(a==='preview-image')return'image';if(a==='learning-feedback')return'learning';return'prompt'}
  function route(task){return profiles.filter(x=>x.enabled!==false&&(x.tasks||[]).includes(task)).sort((a,b)=>(a.priority||100)-(b.priority||100))[0]||null}
  async function refresh(){if(loading)return loading;loading=nativeFetch('/api/config',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(data=>{profiles=Array.isArray(data.systemAiProfiles)?data.systemAiProfiles:[];window.PromptAiSystemAI={profiles,routeFor:route,refresh};window.dispatchEvent(new CustomEvent('promptai:system-ai-ready',{detail:{profiles}}));return profiles}).catch(()=>profiles).finally(()=>{loading=null});return loading}
  function shouldUseSystem(body){if(body?.useOwnApi===true)return false;const mode=document.documentElement.dataset.promptMode||'';return mode!=='expert'}
  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:input?.url||'',method=String(init?.method||input?.method||'GET').toUpperCase();
      if(method==='POST'&&/\/api\/generate(?:\?|$)/.test(url)&&typeof init?.body==='string'){
        const body=JSON.parse(init.body),action=String(body.action||'concepts');
        if(action!=='sandbox-build'&&action!=='preview-image'&&shouldUseSystem(body)){
          if(!profiles.length)await refresh();const selected=route(taskFor(action));
          if(selected){body.engine=selected.provider;body.model=selected.model;body.systemAiProfileId=selected.id;body.systemAiProfileLabel=selected.label;init={...init,body:JSON.stringify(body)}}
        }
      }
    }catch{}
    return nativeFetch(input,init)
  };
  window.addEventListener('promptai:system-ai-updated',refresh);window.addEventListener('promptai:access',()=>{if(!profiles.length)refresh()});
  refresh();
})();

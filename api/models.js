const { resolveProviderKey } = require('../server/provider-key');
const { getEntitlements } = require('../server/entitlements');
const { rateLimit } = require('../server/rate-limit');

function cleanJson(text){
  const value=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const start=value.indexOf('{'),end=value.lastIndexOf('}');if(start<0||end<start)throw new Error('KI hat keine verwertbare Projektauswahl geliefert.');
  return JSON.parse(value.slice(start,end+1));
}
function pick(value,allowed,fallback){return allowed.includes(value)?value:fallback}
function num(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback}
async function gatewayIntake(key,prompt){
  const model=process.env.AI_GATEWAY_MODEL||'openai/gpt-5.4';
  const response=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:'Du bist der Projekt-Intake von Prompt.ai. Antworte ausschließlich mit gültigem JSON.'},{role:'user',content:prompt}],response_format:{type:'json_object'},temperature:.2})});
  const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.message||data.message||'AI Gateway nicht verfügbar.'),{status:response.status});
  const content=data.choices?.[0]?.message?.content;return cleanJson(typeof content==='string'?content:Array.isArray(content)?content.map(x=>x.text||'').join(''):'');
}
async function geminiIntake(key,prompt){
  const model=String(process.env.GEMINI_MODEL||'gemini-3.6-flash').replace(/^models\//,'');
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:'Du bist der Projekt-Intake von Prompt.ai. Antworte ausschließlich mit gültigem JSON.'}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:.2}})});
  const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.message||'Gemini nicht verfügbar.'),{status:response.status});
  return cleanJson((data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join(''));
}
async function projectIntake(req,res){
  if(!rateLimit(req,res,{key:'intake',limit:8,windowMs:60000}))return;
  const entitlement=await getEntitlements(req);if(entitlement.plan==='free'&&!entitlement.isAdmin)return res.status(403).json({error:'Der automatische KI-Intake ist ab Pro verfügbar.'});
  const body=req.body||{},project=body.project||{},typeOptions=(Array.isArray(body.typeOptions)?body.typeOptions:[]).map(String).slice(0,30),goalOptions=(Array.isArray(body.goalOptions)?body.goalOptions:[]).map(String).slice(0,30),agentOptions=(Array.isArray(body.agentOptions)?body.agentOptions:[]).map(String).filter(x=>['codex','claude','gemini','chatgpt','cursor','v0','universal'].includes(x)),outputOptions=(Array.isArray(body.outputOptions)?body.outputOptions:[]).map(String).filter(x=>['next-vercel','next-only','html','react','astro','existing'].includes(x));
  const prompt=`Analysiere dieses reale Projektbriefing. Jede vom Nutzer gemachte Angabe ist ein verbindliches Signal und darf nicht ignoriert werden. Wähle technische und gestalterische Startwerte, die möglichst wenig Rückfragen erzeugen. Erfinde keine Firmenfakten, Preise, Bewertungen oder Rechtstexte. Wenn eine Angabe fehlt, triff nur reversible Arbeitsannahmen.\n\nPROJEKT\n${JSON.stringify({name:project.name||'',description:project.description||'',type:project.type||'',goal:project.goal||'',audience:project.audience||'',special:project.special||'',client:project.client||{}},null,2)}\n\nERLAUBTE PROJEKTARTEN\n${JSON.stringify(typeOptions)}\nERLAUBTE ZIELE\n${JSON.stringify(goalOptions)}\nERLAUBTE ZIEL-AGENTEN\n${JSON.stringify(agentOptions)}\nERLAUBTE AUSGABEZIELE\n${JSON.stringify(outputOptions)}\n\nGib exakt ein JSON-Objekt zurück mit: projectType, goal, audience, targetAgent, outputTarget, originality (0-100), antiSlop (0-100), motion (0-100), density (0-100), conceptCount (3-5), summary, decisions (Array mit 3-7 kurzen deutschen Begründungen). Wähle projectType/goal/targetAgent/outputTarget ausschließlich aus den jeweiligen erlaubten Listen. audience darf nur ergänzt werden, wenn sie plausibel aus dem Briefing ableitbar ist; sonst leer lassen.`;
  let result,provider='gateway';
  const gateway=await resolveProviderKey(req,'gateway');
  if(gateway.key){result=await gatewayIntake(gateway.key,prompt)}else{provider='gemini';const gemini=await resolveProviderKey(req,'gemini');if(!gemini.key)throw Object.assign(new Error('Für Auto/Geführt ist noch keine zentrale Text-KI verbunden.'),{status:503});result=await geminiIntake(gemini.key,prompt)}
  const defaults={type:typeOptions[0]||project.type||'Website',goal:goalOptions[0]||project.goal||'',agent:agentOptions[0]||'codex',output:outputOptions[0]||'next-vercel'};
  return res.status(200).json({provider,projectType:pick(String(result.projectType||''),typeOptions,defaults.type),goal:pick(String(result.goal||''),goalOptions,defaults.goal),audience:String(result.audience||'').slice(0,300),targetAgent:pick(String(result.targetAgent||''),agentOptions,defaults.agent),outputTarget:pick(String(result.outputTarget||''),outputOptions,defaults.output),originality:num(result.originality,0,100,78),antiSlop:num(result.antiSlop,0,100,95),motion:num(result.motion,0,100,18),density:num(result.density,0,100,55),conceptCount:num(result.conceptCount,3,entitlement.maxConcepts,entitlement.maxConcepts),summary:String(result.summary||'').slice(0,800),decisions:Array.isArray(result.decisions)?result.decisions.map(String).slice(0,7):[]});
}

module.exports = async function handler(req,res){
  try{
    if(req.method==='POST'){
      if(String(req.body?.action||'')!=='intake')return res.status(400).json({error:'Unbekannte Aktion.'});
      return await projectIntake(req,res);
    }
    if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
    const provider=String(req.query?.provider||'gateway').toLowerCase();if(!['gateway','gemini'].includes(provider))return res.status(400).json({error:'Unbekannter Anbieter',models:[]});
    const resolved = await resolveProviderKey(req,provider);
    if(!resolved.key) return res.status(503).json({error:'Kein API-Key verbunden.',models:[]});
    const url=provider==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models':'https://ai-gateway.vercel.sh/v1/models';
    const headers=provider==='gemini'?{'x-goog-api-key':resolved.key,"Content-Type":"application/json"}:{Authorization:`Bearer ${resolved.key}`,"Content-Type":"application/json"};
    const response=await fetch(url,{headers});
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data.error?.message||data.message||"Could not load models",models:[]});
    const raw=provider==='gemini'?(data.models||[]).filter(x=>(x.supportedGenerationMethods||[]).includes('generateContent')).map(x=>String(x.name||'').replace(/^models\//,'')):(data.data||[]).map(x=>x.id);
    const models=raw.filter(Boolean).sort((a,b)=>a.localeCompare(b));
    return res.status(200).json({models,source:resolved.source});
  }catch(error){return res.status(error?.status||500).json({error:error?.message||"Could not process AI request",models:[]});}
};

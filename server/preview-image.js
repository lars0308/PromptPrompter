const {resolveProviderKey}=require('./provider-key');const {getEntitlements}=require('./entitlements');const {rateLimit}=require('./rate-limit');const {logUsage}=require('./usage');const {listProfiles}=require('./system-ai-profiles');
function hint(p={}){const t=`${p.description||''} ${p.type||''} ${p.goal||''}`.toLowerCase();if(/handwerk|elektr|hausmeister|garten|reparatur|maler|sanitär|tischler|bau\b|montage/.test(t))return'real hands-on trade or service work, tools, materials, outdoor work or work in progress';if(/restaurant|café|cafe|döner|doener|pizza|bistro|küche|food|imbiss|bar\b|bäck/.test(t))return'real food, ingredients, kitchen or dining atmosphere';if(/friseur|beauty|kosmetik|nagel|nail|barber|salon|spa\b/.test(t))return'a credible beauty, salon or treatment environment';if(/fitness|gym|training|sport|crossfit/.test(t))return'training, gym space or athletic energy';if(/web-?app|software|saas|dashboard|tool\b|plattform|portal/.test(t))return'the digital product interface and its real workflow';return'the exact real subject matter described by the project brief'}
function headerInstruction(p={},c={}){
  if(c.layoutVariant==='minimal')return'This design has NO navigation bar, NO header, NO footer and NO separate sections — it is only the hero image filling the entire frame with one small headline inside it. Do not add a logo, menu, buttons or any other UI chrome on top of the image.';
  const nav=c.navStyle==='logo-hamburger'?'The header/top bar contains ONLY a small logo or brand name on one side and a hamburger/burger menu icon (three short horizontal lines) on the other side — do NOT render a normal navigation bar with multiple visible menu items or text links.':'The header/top bar is a normal, complete navigation bar with the logo and several menu items or text links visible, not just an icon.';
  const mirror=c.mirror?' The hero image sits on the left side of the layout and the large headline/copy sits on the right side.':'';
  return `${nav}${mirror}`;
}
function controlText(ctrl={}){
  const n=(v,f)=>{const x=Number(v);return Number.isFinite(x)?Math.max(0,Math.min(100,Math.round(x))):f};
  const originality=n(ctrl.originality,60),antiSlop=n(ctrl.antiSlop,70),motion=n(ctrl.motion,40),density=n(ctrl.density,50);
  return `- Originality ${originality}/100: ${originality>=70?'take a distinctive, unexpected compositional approach':originality>=40?'stay recognisable but avoid the obvious solution':'keep the composition calm and conventional'}.
- Avoid AI/template look ${antiSlop}/100: ${antiSlop>=70?'no stock SaaS patterns whatsoever - no badge, centered giant headline and two buttons, no three-card grid, no gradient orbs, no glass cards':'keep decoration restrained and specific to this business'}.
- Visual energy ${motion}/100: express this through composition, contrast and cropping - never draw motion blur, arrows or animation artefacts.
- Information density ${density}/100: ${density>=65?'show a rich page with several distinct content bands':density>=35?'show a balanced page with a hero and two or three following bands':'show a sparse page with generous whitespace'}.`;
}
function ruleText(rules=[]){
  const clean=(Array.isArray(rules)?rules:[]).map(x=>String(x||'').replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,6);
  return clean.length?clean.map((x,i)=>`${i+1}. ${x.slice(0,220)}`).join('\n'):'none';
}
// Naming the things to avoid ("no monitor, no laptop, no desk") makes image models render them:
// diffusion prompts have no reliable negation. So the positive prompt never mentions a device at
// all and describes the artboard itself, and the device vocabulary lives in NEGATIVE_PROMPT for
// the providers that accept one.
const NEGATIVE_PROMPT='monitor, computer screen, laptop, tablet, phone, device mockup, product mockup, desk, table, office, room, wall, shelf, plant, books, hands, person, browser window, browser chrome, address bar, tab bar, perspective, 3d render, isometric, photograph of a screen, drop shadow behind a screen, floating panel, page border, white margin, framed poster, collage, moodboard, watermark';
// Cloudflare's flux endpoint accepts at most 2048 characters and silently truncates the rest, so
// the prompt is built compactly and the framing rule is stated first and repeated last - the tail
// used to be cut off, which is exactly where the "flat artboard, no device" reminder sat.
const PROMPT_LIMIT=1900;
function clip(value,max){const text=String(value||'').replace(/\s+/g,' ').trim();return text.length>max?`${text.slice(0,max-1)}…`:text}
function imagePrompt(p={},c={},design={}){
  const brand=clip(p.name||p.type||'Website',42),headline=clip(c.headline||p.goal||'',70),header=headerInstruction(p,c);
  const blocks=[
`FLAT WEB DESIGN ARTBOARD, 16:9, FULL BLEED. The webpage graphic itself fills 100% of the frame and runs off all four edges, like a design file exported at full size. Flat vector-style rendering, straight-on, no depth.`,
`SUBJECT: ${hint(p)}.
Brand: ${brand}
Type: ${clip(p.type||'Website',40)}
Goal: ${clip(p.goal||'',60)}
Audience: ${clip(p.audience||'',60)}
Brief: ${clip(p.description||'',280)}`,
p.special?`SPECIAL INSTRUCTION (authoritative for header, navigation or composition): ${clip(p.special,200)}`:'',
`DIRECTION
Name: ${clip(c.name||'',40)} · Mood: ${clip(c.mood||'',80)}
Layout: ${clip(c.layout||'',90)} (${clip(c.layoutVariant||'',20)})
Hero: ${clip(c.hero||'',90)}
Typography: ${clip(c.type||'',70)}
Palette: ${(c.palette||[]).slice(0,4).join(', ')}`,
`HEADER / STRUCTURE (follow exactly): ${header}`,
`DESIGN CONTROLS (the finished site is built from a master prompt carrying these same settings — this must be a truthful picture of that result)
${controlText(design.controls)}`,
ruleText(design.designRules)!=='none'?`PROJECT DESIGN RULES\n${ruleText(design.designRules)}`:'',
`TEXT: render the brand name "${brand}" in the header and "${headline}" as the hero headline, in large high-contrast lettering. No other invented text, statistics, reviews or awards.`,
`Make it specific to this business, not a template. Every pixel of the frame is the webpage.`
  ].filter(Boolean);
  let prompt=blocks.join('\n\n');
  // Drop the least critical middle blocks before the closing rule is ever at risk.
  while(prompt.length>PROMPT_LIMIT&&blocks.length>4){blocks.splice(blocks.length-3,1);prompt=blocks.join('\n\n')}
  return clip(prompt,PROMPT_LIMIT);
}

function safe(v,f=''){const m=String(v||f||'').trim();return m&&m.length<190&&/^[a-zA-Z0-9@._:/-]+$/.test(m)?m:f}
async function gemini(key,model,prompt){const m=safe(model,'gemini-3.1-flash-image').replace(/^models\//,''),r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({model:m,input:prompt,response_format:{type:'image',mime_type:'image/jpeg',aspect_ratio:'16:9',image_size:'1K'}})}),d=await r.json();if(!r.ok)throw Object.assign(new Error(d.error?.message||'Gemini image request failed'),{status:r.status});let img=d.output_image?.data?d.output_image:null;if(!img)for(const step of d.steps||[])for(const block of step.content||[])if(block.type==='image'&&block.data){img=block;break}if(!img)throw new Error('Gemini hat kein Bild zurückgegeben');return `data:${img.mime_type||img.mimeType||'image/jpeg'};base64,${img.data}`}
async function cloudflare(key,model,prompt){const i=key.indexOf(':');if(i<1)throw new Error('Cloudflare-Verbindung ist unvollständig.');const account=key.slice(0,i),token=key.slice(i+1),m=safe(model,'@cf/black-forest-labs/flux-1-schnell');if(!m.startsWith('@cf/'))throw new Error('Ungültiges Cloudflare Workers AI Bildmodell.');const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/${m}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt.slice(0,2048),negative_prompt:NEGATIVE_PROMPT,steps:8,width:1280,height:720,seed:Math.floor(Math.random()*2147483647)})}),d=await r.json().catch(()=>({}));if(!r.ok||d?.success===false)throw Object.assign(new Error(d?.errors?.[0]?.message||'Cloudflare image request failed'),{status:r.status||500});if(!d?.result?.image)throw new Error('Cloudflare hat kein Bild zurückgegeben');return `data:image/jpeg;base64,${d.result.image}`}
async function compatible(provider,key,model,prompt){const url=provider==='gateway'?'https://ai-gateway.vercel.sh/v1/images/generations':'https://api.openai.com/v1/images/generations',m=safe(model,provider==='gateway'?'openai/gpt-image-2':'gpt-image-1.5'),r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:m,prompt,n:1,response_format:'b64_json'})}),d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error?.message||`${provider} image request failed`),{status:r.status});const img=d.data?.[0];if(img?.b64_json)return `data:image/png;base64,${img.b64_json}`;if(img?.url)return img.url;throw new Error('Bildmodell hat kein Bild zurückgegeben')}
const fallback=()=>[{id:'legacy-gemini',label:'Gemini Standard',provider:'gemini',model:'gemini-3.1-flash-image',priority:900,enabled:true},{id:'legacy-cloudflare',label:'Cloudflare Fallback',provider:'cloudflare',model:'@cf/black-forest-labs/flux-1-schnell',priority:950,enabled:true}];
module.exports=async function previewImage(req,res){res.setHeader('Cache-Control','no-store, private');if(!rateLimit(req,res,{key:'preview-image',limit:12,windowMs:60000}))return;const started=Date.now(),body=req.body||{},project=body.project||{},requested=String(body.imageProvider||'auto').toLowerCase();let usage={action:'preview-image',provider:requested,model:'',project};try{const ent=await getEntitlements(req);if(ent.plan==='free'&&!ent.isAdmin)return res.status(403).json({error:'KI-Bildvorschauen sind ab Pro verfügbar. HTML-Vorschauen bleiben in Free verfügbar.'});let candidates=await listProfiles('image',{providers:['gateway','openai','gemini','cloudflare']});if(!candidates.length)candidates=fallback();if(body.useOwnApi===true&&['gateway','openai','gemini','cloudflare'].includes(requested))candidates=candidates.filter(x=>x.provider===requested);
const wantedId=String(body.imageProfileId||'').trim();
// The visitor picked one of the configured image profiles in the preview selector. Honour that
// choice by trying it first; the remaining profiles stay as fallbacks in their priority order.
if(wantedId&&candidates.some(x=>String(x.id)===wantedId))candidates=[...candidates.filter(x=>String(x.id)===wantedId),...candidates.filter(x=>String(x.id)!==wantedId)];if(!candidates.length)throw Object.assign(new Error('Für Bilder ist aktuell keine aktive Prompt.ai System-KI eingerichtet.'),{status:503});const errors=[];for(const route of candidates){try{const resolved=await resolveProviderKey(req,route.provider,{systemOnly:body.useOwnApi!==true});if(!resolved.key)throw new Error('Zentrale Verbindung nicht erreichbar.');usage={action:'preview-image',provider:route.provider,model:route.model,project};const prompt=imagePrompt(project,body.concept||{},{controls:body.controls||{},designRules:body.designRules||[]}),imageDataUrl=route.provider==='cloudflare'?await cloudflare(resolved.key,route.model,prompt):route.provider==='gemini'?await gemini(resolved.key,route.model,prompt):await compatible(route.provider,resolved.key,route.model,prompt);res.setHeader('X-SiteBrief-AI-Key-Source',resolved.source);res.setHeader('X-Prompt-AI-System-Profile',route.label||route.id||'');await logUsage(req,{...usage,durationMs:Date.now()-started});return res.status(200).json({imageDataUrl,provider:route.provider,model:route.model,route:route.label||''})}catch(e){errors.push(`${route.label||route.model}: ${e.message}`)}}throw Object.assign(new Error(`Keine Prompt.ai Vorschau-KI konnte ein Bild erzeugen. ${errors.join(' | ')}`),{status:503})}catch(error){await logUsage(req,{...usage,success:false,durationMs:Date.now()-started,error:error.message||'Preview generation failed'});return res.status(error.status||500).json({error:error.message||'Preview generation failed'})}}

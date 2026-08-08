const { resolveProviderKey } = require('../server/provider-key');
const VARIANTS = ["split","poster","ledger","stacked","editorial"];

const conceptProperties = {
  name:{type:"string"}, mood:{type:"string"}, palette:{type:"array",minItems:4,maxItems:4,items:{type:"string",pattern:"^#[0-9A-Fa-f]{6}$"}},
  type:{type:"string"}, layout:{type:"string"}, hero:{type:"string"}, accent:{type:"string",pattern:"^#[0-9A-Fa-f]{6}$"}, bg:{type:"string",pattern:"^#[0-9A-Fa-f]{6}$"}, text:{type:"string",pattern:"^#[0-9A-Fa-f]{6}$"}, soft:{type:"string",pattern:"^#[0-9A-Fa-f]{6}$"},
  display:{type:"string"}, layoutVariant:{type:"string",enum:VARIANTS}, headline:{type:"string"}, subline:{type:"string"}, service:{type:"string"}
};
const conceptRequired = Object.keys(conceptProperties);

function conceptsSchema(count){
  return {type:"object",additionalProperties:false,properties:{concepts:{type:"array",minItems:count,maxItems:count,items:{type:"object",additionalProperties:false,properties:conceptProperties,required:conceptRequired}}},required:["concepts"]};
}
function refineSchema(){
  return {type:"object",additionalProperties:false,properties:{concept:{type:"object",additionalProperties:false,properties:conceptProperties,required:conceptRequired}},required:["concept"]};
}
function reviewSchema(maxQuestions=4){
  return {type:"object",additionalProperties:false,properties:{
    ready:{type:"boolean"},
    questions:{type:"array",maxItems:maxQuestions,items:{type:"object",additionalProperties:false,properties:{id:{type:"string"},question:{type:"string"},reason:{type:"string"},suggestedAnswer:{type:"string"},required:{type:"boolean"}},required:["id","question","reason","suggestedAnswer","required"]}},
    warnings:{type:"array",items:{type:"object",additionalProperties:false,properties:{area:{type:"string"},message:{type:"string"},severity:{type:"string",enum:["info","warning"]}},required:["area","message","severity"]}},
    blockers:{type:"array",items:{type:"object",additionalProperties:false,properties:{area:{type:"string"},message:{type:"string"},alternative:{type:"string"}},required:["area","message","alternative"]}},
    assumptions:{type:"array",items:{type:"string"}}
  },required:["ready","questions","warnings","blockers","assumptions"]};
}

function extractOpenAIText(data){
  if(typeof data.output_text === "string") return data.output_text;
  for(const item of data.output||[]) for(const part of item.content||[]) if(part.type==="output_text" && typeof part.text==="string") return part.text;
  return "";
}
function cleanJsonText(text){
  if(!text) throw new Error("No text returned by model");
  const cleaned=String(text).trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  const start=cleaned.indexOf("{"); const end=cleaned.lastIndexOf("}");
  if(start<0 || end<start) throw new Error("Model did not return JSON");
  return JSON.parse(cleaned.slice(start,end+1));
}
function safeModel(value,fallback){
  const model=String(value||fallback||"").trim();
  if(!model || model.length>160 || !/^[a-zA-Z0-9._:/-]+$/.test(model)) return fallback;
  return model;
}
function refText(references=[]){
  return references.length ? references.map((r,i)=>`${i+1}. ${r.url}\n   allowed aspects: ${(r.aspects||[]).join(", ")||"general inspiration"}\n   likes: ${r.note||"-"}\n   avoid: ${r.dislike||"-"}`).join("\n") : "none";
}
function moduleText(modules=[]){
  return modules.length ? modules.map((m,i)=>`${i+1}. ${m.name}${m.tag?` [${m.tag}]`:""}:\n${m.prompt}`).join("\n\n") : "none";
}
function templateText(template={}){ return template?.prompt ? `${template.name||"Custom template"}:\n${template.prompt}` : "none"; }
function settingsText(settings={}){
  const checks=Object.entries(settings.checks||{}).filter(([,v])=>v).map(([k])=>k).join(", ")||"none";
  return `Legal/market region: ${settings.legalRegion||"not set"}\nAlways review: ${checks}\nNever invent legal/company data: ${settings.noInventLegal!==false?"yes":"no"}\nAsk about missing: ${settings.askMissing!==false?"yes":"no"}; conflicts: ${settings.askConflict!==false?"yes":"no"}; infeasible: ${settings.askInfeasible!==false?"yes":"no"}; suggest alternatives: ${settings.suggestAlternatives!==false?"yes":"no"}.`;
}
function clarificationText(clarifications=[]){
  return clarifications.length?clarifications.filter(x=>x?.answer).map((x,i)=>`${i+1}. Q: ${x.question}\n   A: ${x.answer}`).join("\n"):"none";
}
function reviewText(projectReview={}){
  const warnings=(projectReview.warnings||[]).map(x=>`- ${x.area}: ${x.message}`).join("\n")||"none";
  const blockers=(projectReview.blockers||[]).map(x=>`- ${x.area||"blocker"}: ${x.message}`).join("\n")||"none";
  return `Previous review warnings:\n${warnings}\nPrevious blockers:\n${blockers}`;
}

function makeConceptPrompt({count,project,references,controls,template,modules,settings,clarifications,projectReview}){
  const variants=VARIANTS.slice(0,count);
  return `You are a senior web art director designing a real project, not a generic AI landing page. Create exactly ${count} visual directions. They must be structurally different, not color variations of one layout. Use these layoutVariant values exactly once and in this order: ${variants.join(", ")}.

CUSTOM MASTER TEMPLATE
${templateText(template)}

ACTIVE USER MODULES
${moduleText(modules)}

GLOBAL QUALITY / COMPLIANCE SETTINGS
${settingsText(settings)}

CLARIFIED USER ANSWERS
${clarificationText(clarifications)}

${reviewText(projectReview)}

PROJECT
Name: ${project.name||"not set"}
Type: ${project.type||"Website"}
Goal: ${project.goal||"not set"}
Audience: ${project.audience||"not specified"}
Description: ${project.description||""}
Special wish: ${project.special||"none"}

REFERENCE URLS
${refText(references)}

CONTROLS
Originality ${controls.originality}/100; avoid AI/template look ${controls.antiSlop}/100; motion ${controls.motion}/100; information density ${controls.density}/100.

For every direction return a memorable project-specific name, a short mood, exactly four valid hex colors, typography concept, layout principle, hero principle, one of the required composition variants, and concrete preview copy. No fake statistics, reviews, logos or awards. Avoid default AI/SaaS conventions: badge + centered giant headline + two buttons, gradient orbs, glass cards, repetitive three-card grids, excessive rounded rectangles. Use reference inputs only for user-approved aspects and never copy a reference one-to-one. The concept must leave room for all enabled compliance/quality checks, but do not invent legal copy, company facts or claims of compliance. Output only the requested JSON.`;
}

function makeRefinePrompt({project,concept,refinement,references,controls,template,modules,settings,clarifications,projectReview}){
  return `Refine ONE already selected website direction. Preserve its identity unless the user's refinement explicitly asks for a structural change. Return exactly one concept object.

PROJECT
${project.description||""}
Type: ${project.type||"Website"}; goal: ${project.goal||""}; audience: ${project.audience||""}; special wish: ${project.special||"none"}

CURRENT DIRECTION
${JSON.stringify(concept)}

USER REFINEMENT
${refinement}

CUSTOM MASTER TEMPLATE
${templateText(template)}

ACTIVE USER MODULES
${moduleText(modules)}

GLOBAL QUALITY / COMPLIANCE SETTINGS
${settingsText(settings)}

CLARIFIED USER ANSWERS
${clarificationText(clarifications)}

${reviewText(projectReview)}

REFERENCE URLS
${refText(references)}

CONTROLS
Originality ${controls.originality}/100; avoid AI/template look ${controls.antiSlop}/100; motion ${controls.motion}/100; information density ${controls.density}/100.

Keep the result buildable as a real responsive website. Never add fake statistics, fake reviews, fake logos or generic AI/SaaS decoration. Output only the requested JSON.`;
}

function makeReviewPrompt({project,references,settings,template,modules,clarifications}){
  const max=Math.min(6,Math.max(2,Number(settings?.maxQuestions)||4));
  return `Review this website/web-app project BEFORE visual concepts are generated. Decide whether materially important information is missing, contradictory, infeasible, risky, or likely to cause a bad implementation. Ask at most ${max} concise questions. Do not ask preference questions that can be reasonably inferred without changing the outcome.

PROJECT
Name: ${project.name||"not set"}
Type: ${project.type||"Website"}
Goal: ${project.goal||"not set"}
Audience: ${project.audience||"not specified"}
Description: ${project.description||""}
Special wish: ${project.special||"none"}

REFERENCE URLS
${refText(references)}

CUSTOM TEMPLATE
${templateText(template)}

ACTIVE MODULES
${moduleText(modules)}

GLOBAL SETTINGS
${settingsText(settings)}

PREVIOUS USER ANSWERS
${clarificationText(clarifications)}

Rules:
- Ask only questions whose answer materially changes architecture, content, design, legal/privacy handling, or feasibility.
- If requirements conflict, explain the conflict in the reason and ask for a choice when settings allow conflict questions.
- If something is not realistically achievable, add a blocker and, when possible, a concrete alternative. Pair a serious blocker with a required question.
- For privacy/legal/imprint topics: identify missing factual inputs or implementation concerns, but never claim legal compliance and never invent legal/company data or legal text.
- Consider the configured legal/market region, but treat laws as potentially changing; flag items that need current professional/legal verification.
- Consider accessibility, security, performance, SEO, privacy and imprint only when enabled.
- suggestedAnswer may be empty when no safe default exists.
- ready is true only when there is no required question or blocker preventing useful concept generation.
Return only the requested JSON.`;
}

function imageContent(images=[],mode="openai"){
  const out=[];
  for(const image of images.slice(0,3)){
    if(typeof image.dataUrl!=="string" || !image.dataUrl.startsWith("data:image/")) continue;
    const note=`Reference image ${image.name}. Allowed aspects: ${(image.aspects||[]).join(", ")||"general mood"}. Likes: ${image.note||"-"}. Avoid: ${image.dislike||"-"}.`;
    if(mode==="openai") out.push({type:"input_text",text:note},{type:"input_image",image_url:image.dataUrl,detail:"low"});
    else out.push({type:"text",text:note},{type:"image_url",image_url:{url:image.dataUrl,detail:"low"}});
  }
  return out;
}

async function callOpenAI({key,model,prompt,images,schema,name}){
  if(!key) throw Object.assign(new Error("Kein OpenAI API-Key verbunden. Ã–ffne Einstellungen â†’ KI-Verbindungen."),{status:503});
  const content=[{type:"input_text",text:prompt},...imageContent(images,"openai")];
  const body={
    model:safeModel(model,process.env.OPENAI_MODEL||"gpt-5"),
    instructions:"Act as a senior web art director and frontend design reviewer. Be project-specific. Do not fall back to generic website-builder conventions.",
    input:[{role:"user",content}],
    text:{format:{type:"json_schema",name,strict:true,schema}}
  };
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok) throw Object.assign(new Error(data.error?.message||"OpenAI request failed"),{status:response.status});
  return cleanJsonText(extractOpenAIText(data));
}

async function gatewayRequest(body,key){
  const response=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok) throw Object.assign(new Error(data.error?.message||data.message||"AI Gateway request failed"),{status:response.status});
  return data;
}

async function callGateway({key,model,prompt,images,schema,name}){
  if(!key) throw Object.assign(new Error("Kein Vercel AI Gateway Key verbunden. Ã–ffne Einstellungen â†’ KI-Verbindungen."),{status:503});
  const content=[{type:"text",text:prompt},...imageContent(images,"gateway")];
  const base={model:safeModel(model,process.env.AI_GATEWAY_MODEL||"openai/gpt-5.4"),messages:[{role:"system",content:"You are a senior web art director. Return only valid JSON and avoid generic AI website patterns."},{role:"user",content}],stream:false};
  let data;
  try{
    data=await gatewayRequest({...base,response_format:{type:"json_schema",json_schema:{name,strict:true,schema}}},key);
  }catch(firstError){
    data=await gatewayRequest(base,key);
  }
  const text=data.choices?.[0]?.message?.content;
  return cleanJsonText(typeof text==="string"?text:Array.isArray(text)?text.map(x=>x.text||"").join(""):"");
}

async function callGemini({key,model,prompt,images}){
  if(!key) throw Object.assign(new Error("Kein Gemini API-Key verbunden. Ã–ffne Einstellungen â†’ KI-Verbindungen."),{status:503});
  const parts=[{text:prompt}];
  for(const image of images.slice(0,3)){
    const match=typeof image.dataUrl==="string"&&image.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    if(!match)continue;
    parts.push({text:`Reference image ${image.name}. Allowed aspects: ${(image.aspects||[]).join(", ")||"general mood"}. Likes: ${image.note||"-"}. Avoid: ${image.dislike||"-"}.`},{inlineData:{mimeType:match[1],data:match[2]}});
  }
  const selected=safeModel(model,process.env.GEMINI_MODEL||"gemini-3.6-flash").replace(/^models\//,"");
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected)}:generateContent`,{method:"POST",headers:{"x-goog-api-key":key,"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:"You are a senior web art director and website briefing analyst. Return only valid JSON and avoid generic AI website patterns."}]},contents:[{role:"user",parts}],generationConfig:{responseMimeType:"application/json"}})});
  const data=await response.json();
  if(!response.ok)throw Object.assign(new Error(data.error?.message||"Gemini request failed"),{status:response.status});
  const text=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||"").join("");
  return cleanJsonText(text);
}

module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const body=req.body||{};
    const {action="concepts",engine="gateway",model,project={},references=[],images=[],controls={},template={},modules=[],settings={},clarifications=[],projectReview={}}=body;
    if(!["gateway","openai","gemini"].includes(engine)) return res.status(400).json({error:"Use the browser's local generator for local mode"});
    let prompt,schema,name;
    if(action==="review"){
      const maxQuestions=Math.min(6,Math.max(2,Number(settings?.maxQuestions)||4));
      prompt=makeReviewPrompt({project,references:Array.isArray(references)?references.slice(0,12):[],settings,template,modules:Array.isArray(modules)?modules.slice(0,24):[],clarifications:Array.isArray(clarifications)?clarifications.slice(0,12):[]});
      schema=reviewSchema(maxQuestions);name="sitebrief_project_review";
    }else if(action==="refine"){
      if(!body.concept || !body.refinement) return res.status(400).json({error:"concept and refinement are required"});
      prompt=makeRefinePrompt({project,concept:body.concept,refinement:String(body.refinement).slice(0,4000),references:Array.isArray(references)?references.slice(0,12):[],controls,template,modules:Array.isArray(modules)?modules.slice(0,24):[],settings,clarifications:Array.isArray(clarifications)?clarifications.slice(0,12):[],projectReview});
      schema=refineSchema();name="sitebrief_refined_concept";
    }else{
      const count=Math.min(5,Math.max(3,Number(body.count)||5));
      prompt=makeConceptPrompt({count,project,references:Array.isArray(references)?references.slice(0,12):[],controls,template,modules:Array.isArray(modules)?modules.slice(0,24):[],settings,clarifications:Array.isArray(clarifications)?clarifications.slice(0,12):[],projectReview});
      schema=conceptsSchema(count);name="sitebrief_concepts";
    }
    const resolved = await resolveProviderKey(req,engine);
    if(!resolved.key) throw Object.assign(new Error(engine==="openai"?"Kein OpenAI API-Key verbunden. Ã–ffne Einstellungen â†’ KI-Verbindungen.":engine==="gemini"?"Kein Gemini API-Key verbunden. Ã–ffne Einstellungen â†’ KI-Verbindungen.":"Kein Vercel AI Gateway Key verbunden. Ã–ffne Einstellungen â†’ KI-Verbindungen."),{status:503});
    const result=engine==="openai" ? await callOpenAI({key:resolved.key,model,prompt,images,schema,name}) : engine==="gemini" ? await callGemini({key:resolved.key,model,prompt,images}) : await callGateway({key:resolved.key,model,prompt,images,schema,name});
    res.setHeader('X-SiteBrief-AI-Key-Source', resolved.source);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error?.status||500).json({error:error?.message||"Unexpected generation error"});
  }
};


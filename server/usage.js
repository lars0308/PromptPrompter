const {authenticatedUser}=require('./supabase-user');
const {serviceFetch}=require('./admin');

// Providers report their token counts under different names: OpenAI-compatible endpoints use
// prompt/completion, the OpenAI responses API input/output, Gemini promptTokenCount and
// candidatesTokenCount. One shape comes out of it, and a run that reports nothing stays at zero.
function tokenSink(){return {prompt:0,completion:0,total:0,cached:0}}
function addTokens(sink,raw){
  if(!sink||!raw||typeof raw!=='object')return sink;
  const input=Number(raw.prompt_tokens??raw.input_tokens??raw.promptTokenCount)||0;
  const output=Number(raw.completion_tokens??raw.output_tokens??raw.candidatesTokenCount)||0;
  const total=Number(raw.total_tokens??raw.totalTokenCount)||input+output;
  sink.prompt+=input;sink.completion+=output;sink.total+=total;
  sink.cached+=cachedTokens(raw);
  return sink;
}
// Ein wiederholter Textanfang kostet beim Anbieter nur einen Bruchteil. Ob das wirklich greift,
// laesst sich nur an seiner eigenen Abrechnung ablesen - und jeder Anbieter nennt die Zahl anders:
// Anthropic cache_read_input_tokens, OpenAI cached_tokens in den Details, Google cachedContentTokenCount.
function cachedTokens(raw){
  const details=raw.prompt_tokens_details||raw.input_tokens_details||{};
  return Number(
    raw.cache_read_input_tokens??
    details.cached_tokens??
    raw.cached_tokens??
    raw.cachedContentTokenCount
  )||0;
}
const int=value=>Math.max(0,Math.min(2147483647,Math.round(Number(value)||0)));

async function logUsage(req,event){
  try{
    const user=await authenticatedUser(req);
    const tokens=event.tokens||{};
    await serviceFetch('/rest/v1/sitebrief_usage_events',{method:'POST',headers:{Prefer:'return=minimal'},body:{user_id:user.id,action:String(event.action||'generate').slice(0,80),provider:String(event.provider||'').slice(0,80),model:String(event.model||'').slice(0,160),success:event.success!==false,duration_ms:Number.isFinite(event.durationMs)?Math.max(0,Math.round(event.durationMs)):null,error_message:String(event.error||'').slice(0,500),project_name:String(event.project?.name||'').slice(0,160),project_type:String(event.project?.type||'').slice(0,120),project_goal:String(event.project?.goal||'').slice(0,160),prompt_tokens:int(tokens.prompt),completion_tokens:int(tokens.completion),total_tokens:int(tokens.total),cached_tokens:int(tokens.cached),key_source:event.keySource==='account'?'account':'system'}});
  }catch{}
}
module.exports={logUsage,tokenSink,addTokens};

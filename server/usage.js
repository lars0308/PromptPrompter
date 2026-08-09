const {authenticatedUser}=require('./supabase-user');
const {serviceFetch}=require('./admin');

async function logUsage(req,event){
  try{
    const user=await authenticatedUser(req);
    await serviceFetch('/rest/v1/sitebrief_usage_events',{method:'POST',headers:{Prefer:'return=minimal'},body:{user_id:user.id,action:String(event.action||'generate').slice(0,80),provider:String(event.provider||'').slice(0,80),model:String(event.model||'').slice(0,160),success:event.success!==false,duration_ms:Number.isFinite(event.durationMs)?Math.max(0,Math.round(event.durationMs)):null,error_message:String(event.error||'').slice(0,500),project_name:String(event.project?.name||'').slice(0,160),project_type:String(event.project?.type||'').slice(0,120),project_goal:String(event.project?.goal||'').slice(0,160)}});
  }catch{}
}
module.exports={logUsage};

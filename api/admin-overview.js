const {requireAdmin,serviceFetch,listAll}=require('../server/admin');
const {promptDefaults}=require('../server/prompt-templates');

module.exports=async function(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  try{
    await requireAdmin(req);
    // The token area counts the running calendar month, the same window the budgets reset in, so
    // it gets its own slice instead of reading the 2000 latest events of any age.
    const now=new Date();
    const tokenPeriod={start:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString(),end:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1)).toISOString()};
    const [auth,subscriptions,profiles,projects,usage,states,announcements,offers,support,aiConnections,previewAiRoutes,quotaLimits,maintenanceRows,adminRows,promptTemplates,tokenEvents]=await Promise.all([
      serviceFetch('/auth/v1/admin/users?page=1&per_page=200'),
      listAll('sitebrief_subscriptions','user_id,plan,status,current_period_end,provider_customer_id,provider_subscription_id'),
      listAll('sitebrief_user_profiles','user_id,display_name,company_name,website'),
      listAll('sitebrief_projects','user_id,id,status,updated_at'),
      listAll('sitebrief_usage_events','user_id,action,provider,model,success,duration_ms,error_message,project_name,project_type,project_goal,prompt_tokens,completion_tokens,total_tokens,created_at','&order=created_at.desc&limit=2000'),
      listAll('sitebrief_user_admin_state','user_id,suspended_until,suspension_reason,admin_note,monthly_token_bonus,updated_at'),
      listAll('sitebrief_announcements','id,title,body,level,active,starts_at,ends_at,created_at','&order=created_at.desc'),
      listAll('sitebrief_public_offers','id,enabled,eyebrow,title,description,cta_label,trial_days,discount_percent,stripe_coupon_id,ends_at,updated_at'),
      listAll('sitebrief_support_requests','id,user_id,category,subject,message,status,reply,replied_at,created_at,updated_at','&order=created_at.desc&limit=200').catch(()=>[]),
      listAll('sitebrief_system_ai_connections','provider,last4,enabled,default_model,route_role,updated_at','&order=provider.asc').catch(()=>[]),
      listAll('sitebrief_preview_ai_routes','id,label,provider,model,priority,enabled,created_at,updated_at','&order=priority.asc').catch(()=>[]),
      listAll('sitebrief_quota_limits','plan,free_prompts,website_generations,ai_previews,monthly_tokens,updated_at').catch(()=>[]),
      listAll('sitebrief_maintenance','id,enabled,reason,eta,updated_at').catch(()=>[]),
      listAll('sitebrief_admins','user_id').catch(()=>[]),
      // Bodies stay out of the overview - they are loaded per version when the editor opens one.
      listAll('sitebrief_prompt_templates','id,prompt_key,label,version,active,updated_at','&order=prompt_key.asc,version.desc').catch(()=>[]),
      listAll('sitebrief_usage_events','user_id,action,provider,model,success,prompt_tokens,completion_tokens,total_tokens,created_at',`&total_tokens=gt.0&created_at=gte.${encodeURIComponent(tokenPeriod.start)}&order=created_at.desc&limit=5000`).catch(()=>[])
    ]);
    const subMap=new Map(subscriptions.map(x=>[x.user_id,x])),profileMap=new Map(profiles.map(x=>[x.user_id,x])),stateMap=new Map(states.map(x=>[x.user_id,x])),adminIds=new Set((adminRows||[]).map(x=>x.user_id));
    const projectCounts=new Map(),usageCounts=new Map();
    projects.forEach(x=>projectCounts.set(x.user_id,(projectCounts.get(x.user_id)||0)+1));
    usage.forEach(x=>usageCounts.set(x.user_id,(usageCounts.get(x.user_id)||0)+1));
    const users=(auth.data?.users||[]).map(user=>({id:user.id,email:user.email||'',createdAt:user.created_at,lastSignInAt:user.last_sign_in_at||null,bannedUntil:user.banned_until||null,profile:profileMap.get(user.id)||null,subscription:subMap.get(user.id)||{plan:'free',status:'active'},adminState:stateMap.get(user.id)||null,isAdmin:adminIds.has(user.id),projectCount:projectCounts.get(user.id)||0,usageCount:usageCounts.get(user.id)||0}));
    const activeSubscriptions=subscriptions.filter(x=>['active','trialing'].includes(x.status)&&['pro','ultimate'].includes(x.plan)).length;
    const tokens=usage.reduce((sum,x)=>sum+(Number(x.total_tokens)||0),0);
    return res.status(200).json({stats:{users:users.length,activeSubscriptions,projects:projects.length,generations:usage.length,tokens},users,usage,tokenEvents,tokenPeriod,announcements,offer:offers[0]||null,support,aiConnections,previewAiRoutes,quotaLimits,maintenance:maintenanceRows[0]||null,promptTemplates,promptDefaults:promptDefaults()});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Admin-Daten konnten nicht geladen werden.'})}
};

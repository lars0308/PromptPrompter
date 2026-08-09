const {requireAdmin,serviceFetch,listAll}=require('../server/admin');

module.exports=async function(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  try{
    await requireAdmin(req);
    const [auth,subscriptions,profiles,projects,usage,states,announcements,offers]=await Promise.all([
      serviceFetch('/auth/v1/admin/users?page=1&per_page=200'),
      listAll('sitebrief_subscriptions','user_id,plan,status,current_period_end,provider_customer_id,provider_subscription_id'),
      listAll('sitebrief_user_profiles','user_id,display_name,company_name,website'),
      listAll('sitebrief_projects','user_id,id,status,updated_at'),
      listAll('sitebrief_usage_events','user_id,action,provider,model,success,duration_ms,error_message,project_name,project_type,project_goal,created_at','&order=created_at.desc&limit=2000'),
      listAll('sitebrief_user_admin_state','user_id,suspended_until,suspension_reason,admin_note,updated_at'),
      listAll('sitebrief_announcements','id,title,body,level,active,starts_at,ends_at,created_at','&order=created_at.desc'),
      listAll('sitebrief_public_offers','id,enabled,eyebrow,title,description,cta_label,trial_days,discount_percent,stripe_coupon_id,ends_at,updated_at')
    ]);
    const subMap=new Map(subscriptions.map(x=>[x.user_id,x])),profileMap=new Map(profiles.map(x=>[x.user_id,x])),stateMap=new Map(states.map(x=>[x.user_id,x]));
    const projectCounts=new Map(),usageCounts=new Map();
    projects.forEach(x=>projectCounts.set(x.user_id,(projectCounts.get(x.user_id)||0)+1));
    usage.forEach(x=>usageCounts.set(x.user_id,(usageCounts.get(x.user_id)||0)+1));
    const users=(auth.data?.users||[]).map(user=>({id:user.id,email:user.email||'',createdAt:user.created_at,lastSignInAt:user.last_sign_in_at||null,bannedUntil:user.banned_until||null,profile:profileMap.get(user.id)||null,subscription:subMap.get(user.id)||{plan:'free',status:'active'},adminState:stateMap.get(user.id)||null,projectCount:projectCounts.get(user.id)||0,usageCount:usageCounts.get(user.id)||0}));
    const activeSubscriptions=subscriptions.filter(x=>['active','trialing'].includes(x.status)&&['pro','ultimate'].includes(x.plan)).length;
    return res.status(200).json({stats:{users:users.length,activeSubscriptions,projects:projects.length,generations:usage.length},users,usage,announcements,offer:offers[0]||null});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Admin-Daten konnten nicht geladen werden.'})}
};

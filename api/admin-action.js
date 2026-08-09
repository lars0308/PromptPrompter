const {requireAdmin,serviceFetch}=require('../server/admin');
const {SUPABASE_URL,PUBLISHABLE_KEY}=require('../server/supabase-user');
const {stripeRequest,stripeGet}=require('../server/stripe-rest');

const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
async function audit(adminId,action,targetId,details={}){try{await serviceFetch('/rest/v1/sitebrief_admin_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:{admin_user_id:adminId,action,target_user_id:uuid(targetId)?targetId:null,details}})}catch{}}

module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const admin=await requireAdmin(req),body=req.body||{},action=String(body.action||'');
    if(['suspend','unsuspend','set-plan','send-password-reset','cancel-subscription','refund-latest'].includes(action)&&!uuid(body.userId))return res.status(400).json({error:'Ungültiger Benutzer.'});
    if(action==='suspend'){
      const days=Math.max(1,Math.min(3650,Number(body.days)||30)),until=new Date(Date.now()+days*86400000).toISOString();
      await serviceFetch(`/auth/v1/admin/users/${body.userId}`,{method:'PUT',body:{ban_duration:`${days*24}h`}});
      await serviceFetch('/rest/v1/sitebrief_user_admin_state?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:body.userId,suspended_until:until,suspension_reason:String(body.reason||'Vom Administrator gesperrt').slice(0,500),updated_at:new Date().toISOString()}});
      await audit(admin.id,action,body.userId,{days,reason:body.reason||''});return res.status(200).json({ok:true});
    }
    if(action==='unsuspend'){
      await serviceFetch(`/auth/v1/admin/users/${body.userId}`,{method:'PUT',body:{ban_duration:'none'}});
      await serviceFetch(`/rest/v1/sitebrief_user_admin_state?user_id=eq.${body.userId}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{suspended_until:null,suspension_reason:'',updated_at:new Date().toISOString()}});
      await audit(admin.id,action,body.userId);return res.status(200).json({ok:true});
    }
    if(action==='set-plan'){
      const plan=['free','pro','ultimate'].includes(body.plan)?body.plan:null;if(!plan)return res.status(400).json({error:'Ungültiger Tarif.'});
      await serviceFetch(`/rest/v1/sitebrief_subscriptions?user_id=eq.${body.userId}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{plan,status:'active',updated_at:new Date().toISOString()}});
      await audit(admin.id,action,body.userId,{plan});return res.status(200).json({ok:true});
    }
    if(action==='send-password-reset'){
      const user=await serviceFetch(`/auth/v1/admin/users/${body.userId}`),email=user.data?.email;if(!email)throw Object.assign(new Error('E-Mail-Adresse nicht gefunden.'),{status:404});
      const redirectTo=process.env.APP_URL||`https://${req.headers.host}`;
      const recovery=await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,{method:'POST',headers:{apikey:PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email})});
      if(!recovery.ok)throw Object.assign(new Error('Reset-Mail konnte nicht versendet werden.'),{status:recovery.status});
      await audit(admin.id,action,body.userId);return res.status(200).json({ok:true});
    }
    if(action==='cancel-subscription'){
      const result=await serviceFetch(`/rest/v1/sitebrief_subscriptions?select=provider_subscription_id&user_id=eq.${body.userId}&limit=1`),subscriptionId=result.data?.[0]?.provider_subscription_id;if(!subscriptionId)return res.status(400).json({error:'Kein Stripe-Abo gefunden.'});
      await stripeRequest(`subscriptions/${encodeURIComponent(subscriptionId)}`,{cancel_at_period_end:'true'});await audit(admin.id,action,body.userId,{subscriptionId});return res.status(200).json({ok:true});
    }
    if(action==='refund-latest'){
      const result=await serviceFetch(`/rest/v1/sitebrief_subscriptions?select=provider_customer_id&user_id=eq.${body.userId}&limit=1`),customer=result.data?.[0]?.provider_customer_id;if(!customer)return res.status(400).json({error:'Kein Stripe-Kunde gefunden.'});
      const invoices=await stripeGet('invoices',{customer,status:'paid',limit:1}),invoice=invoices.data?.[0];if(!invoice)return res.status(404).json({error:'Keine bezahlte Rechnung gefunden.'});const charges=await stripeGet('charges',{customer,limit:10}),charge=charges.data?.find(item=>(typeof item.invoice==='string'?item.invoice:item.invoice?.id)===invoice.id&&item.paid&&!item.refunded);if(!charge)return res.status(404).json({error:'Keine erstattbare Zahlung zu dieser Rechnung gefunden.'});
      const refund=await stripeRequest('refunds',{charge:charge.id,reason:'requested_by_customer','metadata[admin_user_id]':admin.id});await audit(admin.id,action,body.userId,{invoiceId:invoice.id,chargeId:charge.id,refundId:refund.id,amount:refund.amount});return res.status(200).json({ok:true,amount:refund.amount});
    }
    if(action==='save-announcement'){
      const row={title:String(body.title||'').trim().slice(0,120),body:String(body.body||'').trim().slice(0,2000),level:['info','success','warning','critical'].includes(body.level)?body.level:'info',active:Boolean(body.active),starts_at:body.startsAt||new Date().toISOString(),ends_at:body.endsAt||null,created_by:admin.id};if(!row.title||!row.body)return res.status(400).json({error:'Titel und Text fehlen.'});
      if(uuid(body.id))row.id=body.id;
      await serviceFetch('/rest/v1/sitebrief_announcements?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});await audit(admin.id,action,null,{title:row.title});return res.status(200).json({ok:true});
    }
    if(action==='delete-announcement'){
      if(!uuid(body.id))return res.status(400).json({error:'Ungültige Mitteilung.'});await serviceFetch(`/rest/v1/sitebrief_announcements?id=eq.${body.id}`,{method:'DELETE'});await audit(admin.id,action,null,{id:body.id});return res.status(200).json({ok:true});
    }
    if(action==='set-support-status'){
      if(!uuid(body.id)||!['open','in_progress','answered','closed'].includes(body.status))return res.status(400).json({error:'Ungültige Support-Anfrage.'});
      await serviceFetch(`/rest/v1/sitebrief_support_requests?id=eq.${body.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{status:body.status,updated_at:new Date().toISOString()}});await audit(admin.id,action,null,{id:body.id,status:body.status});return res.status(200).json({ok:true});
    }
    if(action==='save-offer'){
      const trialDays=Math.max(0,Math.min(365,Number(body.trialDays)||0)),discountPercent=Math.max(0,Math.min(100,Number(body.discountPercent)||0)),row={id:'main',enabled:Boolean(body.enabled),eyebrow:String(body.eyebrow||(trialDays?'KOSTENLOS TESTEN':'AKTION')).slice(0,80),title:String(body.title||(trialDays?`Pro ${trialDays} Tage kostenlos testen`:discountPercent?`Aktuell ${discountPercent} % Rabatt`:'' )).slice(0,160),description:String(body.description||(trialDays?'Danach monatlich kündbar.':discountPercent?'Der Rabatt wird im Checkout automatisch abgezogen.':'')).slice(0,500),cta_label:String(body.ctaLabel||(trialDays?'Kostenlos testen':'Rabatt sichern')).slice(0,80),trial_days:trialDays,discount_percent:discountPercent,stripe_coupon_id:String(body.stripeCouponId||'').trim().slice(0,120)||null,ends_at:body.endsAt||null,updated_by:admin.id,updated_at:new Date().toISOString()};
      await serviceFetch('/rest/v1/sitebrief_public_offers?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});await audit(admin.id,action,null,{trialDays:row.trial_days,discountPercent:row.discount_percent});return res.status(200).json({ok:true});
    }
    return res.status(400).json({error:'Unbekannte Admin-Aktion.'});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Admin-Aktion fehlgeschlagen.'})}
};

const {requireAdmin,serviceFetch}=require('../server/admin');
const {SUPABASE_URL,PUBLISHABLE_KEY}=require('../server/supabase-user');
const {stripeRequest,stripeGet}=require('../server/stripe-rest');
const {isPromptKey}=require('../server/prompt-templates');

const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
const ADMIN_EMAIL=String(process.env.PROMPT_AI_ADMIN_EMAIL||'service.battermann@gmx.de').trim().toLowerCase();
const AI_PROVIDERS=['gateway','openai','gemini','cloudflare'];
const validAiProvider=value=>{const provider=String(value||'').toLowerCase();if(!AI_PROVIDERS.includes(provider))throw Object.assign(new Error('Unbekannter KI-Anbieter.'),{status:400});return provider};
async function audit(adminId,action,targetId,details={}){try{await serviceFetch('/rest/v1/sitebrief_admin_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:{admin_user_id:adminId,action,target_user_id:uuid(targetId)?targetId:null,details}})}catch{}}
async function systemAiSecret(provider){const response=await serviceFetch('/rest/v1/rpc/sitebrief_get_system_ai_connection_secret',{method:'POST',body:{p_provider:provider}});return typeof response.data==='string'?response.data.trim():''}
async function testAiProvider(provider,secret){
  let url,headers;
  if(provider==='gateway'){url='https://ai-gateway.vercel.sh/v1/models';headers={Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};}
  else if(provider==='openai'){url='https://api.openai.com/v1/models';headers={Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};}
  else if(provider==='gemini'){url='https://generativelanguage.googleapis.com/v1beta/models';headers={'x-goog-api-key':secret,'Content-Type':'application/json'};}
  else {const split=secret.indexOf(':');if(split<1)throw Object.assign(new Error('Cloudflare benötigt Account-ID und API-Token.'),{status:400});const accountId=secret.slice(0,split),token=secret.slice(split+1);url=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/models/search?per_page=5`;headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};}
  const response=await fetch(url,{headers});const data=await response.json().catch(()=>({}));
  if(!response.ok||data?.success===false)throw Object.assign(new Error(data?.error?.message||data?.errors?.[0]?.message||data?.message||'API-Zugang wurde vom Anbieter abgelehnt.'),{status:response.status||400});
  const raw=provider==='gemini'?(data.models||[]).map(x=>String(x.name||'').replace(/^models\//,'')):provider==='cloudflare'?(data.result||[]).map(x=>x.name||x.id):(data.data||[]).map(x=>x.id);
  return raw.filter(Boolean).slice(0,100);
}

module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const admin=await requireAdmin(req),body=req.body||{},action=String(body.action||'');

    if(action==='ai-save'){
      const provider=validAiProvider(body.provider);let secret=String(body.secret||'').trim();
      if(provider==='cloudflare'&&body.accountId&&body.apiToken)secret=`${String(body.accountId).trim()}:${String(body.apiToken).trim()}`;
      const routeRole=['primary','fallback1','fallback2','manual'].includes(body.routeRole)?body.routeRole:'manual';
      const result=await serviceFetch('/rest/v1/rpc/sitebrief_admin_set_system_ai_connection',{method:'POST',body:{p_provider:provider,p_secret:secret||null,p_default_model:String(body.defaultModel||'').trim(),p_enabled:body.enabled!==false,p_route_role:routeRole}});
      await audit(admin.id,action,null,{provider,routeRole,enabled:body.enabled!==false});return res.status(200).json({ok:true,connection:result.data});
    }
    if(action==='ai-delete'){
      const provider=validAiProvider(body.provider);await serviceFetch('/rest/v1/rpc/sitebrief_admin_delete_system_ai_connection',{method:'POST',body:{p_provider:provider}});await audit(admin.id,action,null,{provider});return res.status(200).json({ok:true});
    }
    if(action==='ai-test'||action==='ai-models'){
      const provider=validAiProvider(body.provider),secret=await systemAiSecret(provider);if(!secret)throw Object.assign(new Error('Für diesen Anbieter ist kein zentraler Key gespeichert.'),{status:503});const models=await testAiProvider(provider,secret);return res.status(200).json({ok:true,provider,models});
    }
    if(action==='preview-route-save'){
      const provider=String(body.provider||'').toLowerCase();if(!['gemini','cloudflare'].includes(provider))return res.status(400).json({error:'Für Bildvorschauen werden aktuell Gemini und Cloudflare unterstützt.'});
      const model=String(body.model||'').trim().slice(0,180);if(!model||!/^[a-zA-Z0-9@._:/-]+$/.test(model))return res.status(400).json({error:'Bitte eine gültige Bildmodell-ID angeben.'});
      const row={label:String(body.label||'').trim().slice(0,100)||`${provider} · ${model}`,provider,model,priority:Math.max(1,Math.min(1000,Number(body.priority)||100)),enabled:body.enabled!==false,updated_at:new Date().toISOString()};if(uuid(body.id))row.id=body.id;
      await serviceFetch('/rest/v1/sitebrief_preview_ai_routes?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});await audit(admin.id,action,null,{provider,model,priority:row.priority,enabled:row.enabled});return res.status(200).json({ok:true});
    }
    if(action==='preview-route-delete'){
      if(!uuid(body.id))return res.status(400).json({error:'Ungültige Vorschau-KI.'});await serviceFetch(`/rest/v1/sitebrief_preview_ai_routes?id=eq.${encodeURIComponent(body.id)}`,{method:'DELETE'});await audit(admin.id,action,null,{id:body.id});return res.status(200).json({ok:true});
    }

    if(['suspend','unsuspend','set-plan','send-password-reset','cancel-subscription','refund-latest','set-admin'].includes(action)&&!uuid(body.userId))return res.status(400).json({error:'Ungültiger Benutzer.'});
    if(action==='set-admin'){
      const makeAdmin=body.admin!==false;
      // The owner address always keeps its rights, so the console can never lock itself out.
      const target=await serviceFetch(`/auth/v1/admin/users/${body.userId}`);
      const email=String(target.data?.email||'').trim().toLowerCase();
      if(!makeAdmin&&email===ADMIN_EMAIL)return res.status(400).json({error:'Dem Eigentümer-Konto können die Administratorrechte nicht entzogen werden.'});
      if(makeAdmin)await serviceFetch('/rest/v1/sitebrief_admins?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:body.userId}});
      else await serviceFetch(`/rest/v1/sitebrief_admins?user_id=eq.${encodeURIComponent(body.userId)}`,{method:'DELETE'});
      await audit(admin.id,action,body.userId,{admin:makeAdmin,email});return res.status(200).json({ok:true});
    }
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
    // Antworten gehoert zur Anfrage, nicht ins private Mailprogramm: der Absender sieht sie in
    // der App, und der Stand springt automatisch auf "beantwortet".
    if(action==='support-reply'){
      const text=String(body.reply||'').trim().slice(0,4000);
      if(!uuid(body.id)||text.length<2)return res.status(400).json({error:'Antwort fehlt.'});
      await serviceFetch(`/rest/v1/sitebrief_support_requests?id=eq.${body.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{reply:text,replied_at:new Date().toISOString(),status:'answered',updated_at:new Date().toISOString()}});
      await audit(admin.id,action,null,{id:body.id});
      return res.status(200).json({ok:true});
    }
    if(action==='save-offer'){
      const trialDays=Math.max(0,Math.min(365,Number(body.trialDays)||0)),discountPercent=Math.max(0,Math.min(100,Number(body.discountPercent)||0));
      // Ein geleertes Feld ist eine Entscheidung, kein fehlender Wert. Vorher stand hier
      // `body.eyebrow||'KOSTENLOS TESTEN'` - ein leerer String ist falsy, also kam der
      // Standardtext sofort zurueck und liess sich nicht loswerden. Der Rueckfall greift nur
      // noch, wenn das Feld gar nicht mitgeschickt wurde.
      const field=(value,fallback,max)=>String(value===undefined||value===null?fallback:value).trim().slice(0,max);
      const row={id:'main',enabled:Boolean(body.enabled),
        eyebrow:field(body.eyebrow,trialDays?'KOSTENLOS TESTEN':'AKTION',80),
        title:field(body.title,trialDays?`Pro ${trialDays} Tage kostenlos testen`:discountPercent?`Aktuell ${discountPercent} % Rabatt`:'',160),
        description:field(body.description,trialDays?'Danach monatlich kündbar.':discountPercent?'Der Rabatt wird im Checkout automatisch abgezogen.':'',500),
        cta_label:field(body.ctaLabel,trialDays?'Kostenlos testen':'Rabatt sichern',80),
        trial_days:trialDays,discount_percent:discountPercent,stripe_coupon_id:String(body.stripeCouponId||'').trim().slice(0,120)||null,ends_at:body.endsAt||null,updated_by:admin.id,updated_at:new Date().toISOString()};
      await serviceFetch('/rest/v1/sitebrief_public_offers?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});await audit(admin.id,action,null,{trialDays:row.trial_days,discountPercent:row.discount_percent});return res.status(200).json({ok:true});
    }
    if(action==='save-quota-limits'){
      const plans=body.plans&&typeof body.plans==='object'?body.plans:{};
      const rows=['free','pro','ultimate'].filter(plan=>plans[plan]).map(plan=>({plan,free_prompts:Math.max(0,Math.min(100000,Number(plans[plan].free_prompts)||0)),website_generations:Math.max(0,Math.min(100000,Number(plans[plan].website_generations)||0)),ai_previews:Math.max(0,Math.min(100000,Number(plans[plan].ai_previews)||0)),updated_by:admin.id,updated_at:new Date().toISOString(),monthly_tokens:Math.max(0,Math.min(2000000000,Number(plans[plan].monthly_tokens)||0))}));
      if(!rows.length)return res.status(400).json({error:'Keine gültigen Tarifkontingente übergeben.'});
      await serviceFetch('/rest/v1/sitebrief_quota_limits?on_conflict=plan',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows});
      await audit(admin.id,action,null,{plans:rows.map(r=>r.plan)});
      return res.status(200).json({ok:true});
    }
    // Token budgets live in their own admin area and are saved on their own, so a change there can
    // never overwrite the countable monthly quotas and the other way round.
    if(action==='save-token-budgets'){
      const plans=body.plans&&typeof body.plans==='object'?body.plans:{};
      const known=(await serviceFetch('/rest/v1/sitebrief_quota_limits?select=plan,free_prompts,website_generations,ai_previews')).data||[];
      const byPlan=Object.fromEntries(known.map(row=>[row.plan,row]));
      const rows=['free','pro','ultimate'].filter(plan=>plans[plan]!==undefined).map(plan=>{
        const current=byPlan[plan]||{};
        return {plan,free_prompts:Math.max(0,Number(current.free_prompts)||0),website_generations:Math.max(0,Number(current.website_generations)||0),ai_previews:Math.max(0,Number(current.ai_previews)||0),monthly_tokens:Math.max(0,Math.min(2000000000,Number(plans[plan])||0)),updated_by:admin.id,updated_at:new Date().toISOString()};
      });
      if(!rows.length)return res.status(400).json({error:'Keine gültigen Token-Budgets übergeben.'});
      await serviceFetch('/rest/v1/sitebrief_quota_limits?on_conflict=plan',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows});
      await audit(admin.id,action,null,Object.fromEntries(rows.map(row=>[row.plan,row.monthly_tokens])));
      return res.status(200).json({ok:true});
    }
    if(action==='set-token-bonus'){
      if(!uuid(body.userId))return res.status(400).json({error:'Ungültiger Benutzer.'});
      const bonus=Math.max(0,Math.min(2000000000,Number(body.tokens)||0));
      await serviceFetch('/rest/v1/sitebrief_user_admin_state?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:body.userId,monthly_token_bonus:bonus,updated_at:new Date().toISOString()}});
      await audit(admin.id,action,body.userId,{tokens:bonus});
      return res.status(200).json({ok:true,tokens:bonus});
    }
    if(action==='save-maintenance'){
      const row={id:'main',enabled:Boolean(body.enabled),reason:String(body.reason||'').trim().slice(0,500),eta:String(body.eta||'').trim().slice(0,200),updated_by:admin.id,updated_at:new Date().toISOString()};
      await serviceFetch('/rest/v1/sitebrief_maintenance?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});
      await audit(admin.id,action,null,{enabled:row.enabled});
      return res.status(200).json({ok:true});
    }
    // Master prompts: every save creates a new version instead of overwriting, so an older
    // wording is always one click away and a rework can sit next to the running one.
    if(action==='prompt-load'){
      if(!uuid(body.id))return res.status(400).json({error:'Unbekannte Prompt-Version.'});
      const {data}=await serviceFetch(`/rest/v1/sitebrief_prompt_templates?id=eq.${encodeURIComponent(body.id)}&select=id,prompt_key,label,body,version,active&limit=1`);
      const row=Array.isArray(data)?data[0]:null;
      if(!row)return res.status(404).json({error:'Diese Prompt-Version gibt es nicht mehr.'});
      return res.status(200).json({template:row});
    }
    if(action==='prompt-save'){
      const key=String(body.key||'');
      if(!isPromptKey(key))return res.status(400).json({error:'Unbekannter Prompt-Bereich.'});
      const text=String(body.body||'').trim();
      if(text.length<40)return res.status(400).json({error:'Der Prompt-Text ist zu kurz.'});
      if(text.length>20000)return res.status(400).json({error:'Der Prompt-Text ist zu lang (max. 20.000 Zeichen).'});
      const {data:existing}=await serviceFetch(`/rest/v1/sitebrief_prompt_templates?prompt_key=eq.${encodeURIComponent(key)}&select=version&order=version.desc&limit=1`);
      const version=(Number(Array.isArray(existing)?existing[0]?.version:0)||0)+1;
      const label=String(body.label||'').trim().slice(0,120)||`Version ${version}`;
      const activate=body.activate!==false;
      if(activate)await serviceFetch(`/rest/v1/sitebrief_prompt_templates?prompt_key=eq.${encodeURIComponent(key)}&active=is.true`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{active:false,updated_at:new Date().toISOString()}});
      const {data}=await serviceFetch('/rest/v1/sitebrief_prompt_templates',{method:'POST',headers:{Prefer:'return=representation'},body:{prompt_key:key,label,body:text,version,active:activate,created_by:admin.id}});
      await audit(admin.id,action,null,{key,version,active:activate});
      return res.status(200).json({template:Array.isArray(data)?data[0]:null});
    }
    if(action==='prompt-activate'){
      const key=String(body.key||'');
      if(!isPromptKey(key))return res.status(400).json({error:'Unbekannter Prompt-Bereich.'});
      await serviceFetch(`/rest/v1/sitebrief_prompt_templates?prompt_key=eq.${encodeURIComponent(key)}&active=is.true`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{active:false,updated_at:new Date().toISOString()}});
      // No id means: use the built-in default again.
      if(body.id){
        if(!uuid(body.id))return res.status(400).json({error:'Unbekannte Prompt-Version.'});
        await serviceFetch(`/rest/v1/sitebrief_prompt_templates?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{active:true,updated_at:new Date().toISOString()}});
      }
      await audit(admin.id,action,null,{key,id:body.id||null});
      return res.status(200).json({ok:true});
    }
    if(action==='prompt-delete'){
      if(!uuid(body.id))return res.status(400).json({error:'Unbekannte Prompt-Version.'});
      await serviceFetch(`/rest/v1/sitebrief_prompt_templates?id=eq.${encodeURIComponent(body.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
      await audit(admin.id,action,null,{id:body.id});
      return res.status(200).json({ok:true});
    }
    return res.status(400).json({error:'Unbekannte Admin-Aktion.'});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Admin-Aktion fehlgeschlagen.'})}
};

(()=>{
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector),$$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const date=value=>value?new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'–';
  const localDate=value=>value?new Date(new Date(value).getTime()-new Date(value).getTimezoneOffset()*60000).toISOString().slice(0,16):'';
  const state={data:null,isAdmin:false};
  const ui={};

  // „Admin-Daten werden geladen…“ stand still, bis jemand die Seite neu lud.
  //
  // Der Aufruf hatte keine Zeitgrenze: bleibt die Antwort aus - ein hängender Server, ein
  // abgerissenes Mobilfunknetz -, wartet fetch ohne Ende, das Promise löst nie auf, und weder der
  // Erfolgs- noch der Fehlerzweig wird je erreicht. Sichtbar ist dann genau eine Zeile, die nichts
  // mehr sagt. Und weil die übrigen Konsolen (KI-Anbieter, Prompts, Tokens) erst auf das Ereignis
  // hin erscheinen, das nach dem Laden gefeuert wird, fehlten mit der Antwort auch ihre Reiter.
  const API_TIMEOUT_MS=20000;
  async function api(url,options={}){
    const headers=await window.SiteBriefCloud?.authHeaders?.()||{};
    const abbruch=new AbortController();
    const uhr=setTimeout(()=>abbruch.abort(),API_TIMEOUT_MS);
    let response;
    try{
      response=await fetch(url,{...options,signal:abbruch.signal,headers:{'Content-Type':'application/json',...headers,...(options.headers||{})}});
    }catch(error){
      throw new Error(error?.name==='AbortError'
        ?'Die Verwaltung antwortet nicht (Zeitüberschreitung nach 20 Sekunden). Prüfe die Verbindung und lade erneut.'
        :`Die Verwaltung ist nicht erreichbar: ${error?.message||'unbekannter Fehler'}`);
    }finally{clearTimeout(uhr)}
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||`Anfrage fehlgeschlagen (${response.status}).`);
    return data;
  }
  function message(text='',kind=''){ui.message.textContent=text;ui.message.className=`auth-message ${kind}`.trim()}
  // The long lists are folded away by default, so their summary carries the count - otherwise a
  // closed section gives no hint whether there is anything inside.
  function foldCount(key,count,singular,plural){const host=$(`[data-fold-count="${key}"]`);if(host)host.textContent=count?`${count} ${count===1?singular:plural}`:'leer'}
  function stats(){const s=state.data?.stats||{};ui.stats.innerHTML=[['Benutzer',s.users||0],['Aktive Abos',s.activeSubscriptions||0],['Projekte',s.projects||0],['KI-Aufrufe',s.generations||0],['Verbrauchte Tokens',s.tokens||0]].map(([label,value])=>`<article><span>${esc(label)}</span><strong>${Number(value).toLocaleString('de-DE')}</strong></article>`).join('');priceOrigin()}
  // Kommt ein Preis nicht aus Stripe, zeigt die App still den fest hinterlegten Betrag. Der Kunde
  // sieht dann einen Preis, der stimmen kann - aber eben nicht mehr mitwandert, wenn du in Stripe
  // etwas aenderst. Ein Tippfehler in einer Kennung reicht dafuer. Also steht es hier.
  function priceOrigin(){
    const pricing=window.SiteBriefCloud?.config?.pricing;if(!pricing)return;
    const live=pricing.live||{};
    const rows=[['Pro','pro','prompt_ai_pro'],['Ultimate','ultimate','prompt_ai_ultimate'],['Eigene KI-Verbindungen','apiKeys','prompt_ai_own_api_keys'],['Monatsvorrat','topUp','prompt_ai_top_up']];
    const stale=rows.filter(([,key])=>live[key]===false);
    let box=$('#adminPriceOrigin');
    if(!box){box=document.createElement('div');box.id='adminPriceOrigin';box.className='admin-price-origin';ui.stats.insertAdjacentElement('afterend',box)}
    box.className=`admin-price-origin${stale.length?' is-stale':''}`;
    box.innerHTML=stale.length
      ? `<strong>${stale.length===1?'Ein Preis kommt':`${stale.length} Preise kommen`} nicht aus Stripe</strong><small>Angezeigt wird der fest hinterlegte Betrag. Prüfe in Stripe den Lookup-Key und ob genau ein aktiver Preis je Produkt existiert.</small><ul>${stale.map(([label,key,lookup])=>`<li><b>${esc(label)}</b><span>${esc(pricing[key]||'—')}</span><code>${esc(lookup)}</code></li>`).join('')}</ul>`
      : '<strong>Alle Preise kommen live aus Stripe</strong><small>Eine Änderung dort wirkt sofort in der App, ohne dass etwas ausgerollt werden muss.</small>';
  }
  function usage(){const events=state.data?.usage||[],map=new Map();events.forEach(item=>{const key=`${item.provider||'unbekannt'} · ${item.model||'Standardmodell'}`,current=map.get(key)||{count:0,errors:0,duration:0,tokens:0};current.count++;if(!item.success)current.errors++;current.duration+=Number(item.duration_ms)||0;current.tokens+=Number(item.total_tokens)||0;map.set(key,current)});foldCount('usage',map.size,'Modell','Modelle');ui.usage.innerHTML=map.size?[...map.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,12).map(([name,data])=>`<div><span>${esc(name)}<small>${data.errors?` · ${data.errors} Fehler`:''}${data.duration?` · Ø ${Math.round(data.duration/data.count/100)/10} s`:''}${data.tokens?` · ${data.tokens.toLocaleString('de-DE')} Tokens (Ø ${Math.round(data.tokens/data.count).toLocaleString('de-DE')})`:''}</small></span><b>${data.count}</b></div>`).join(''):'<p class="empty-state">Noch keine KI-Nutzung erfasst.</p>'}
  function runs(){const events=(state.data?.usage||[]).slice(0,25);foldCount('runs',events.length,'Verarbeitung','Verarbeitungen');ui.runs.innerHTML=events.map(item=>`<article><div><span>${esc(item.action||'Verarbeitung')} · ${esc(item.provider||'unbekannt')}</span><strong>${esc(item.project_name||item.project_type||'Projekt ohne Namen')}</strong><small>${esc([item.project_type,item.project_goal].filter(Boolean).join(' · ')||item.model||'Keine Projektdetails')} · ${date(item.created_at)}${item.total_tokens?` · ${Number(item.total_tokens).toLocaleString('de-DE')} Tokens`:''}</small>${item.error_message?`<p>${esc(item.error_message)}</p>`:''}</div><i class="${item.success?'active':'blocked'}">${item.success?'Erfolgreich':'Fehler'}</i></article>`).join('')||'<p class="empty-state">Noch keine Verarbeitungen erfasst.</p>'}
  function userRows(){const term=ui.search.value.trim().toLowerCase(),users=(state.data?.users||[]).filter(user=>!term||`${user.email} ${user.profile?.display_name||''} ${user.profile?.company_name||''}`.toLowerCase().includes(term));foldCount('users',users.length,'Konto','Konten');ui.users.innerHTML=users.map(user=>{const sub=user.subscription||{},blocked=Boolean(user.bannedUntil&&new Date(user.bannedUntil)>new Date()),stripe=Boolean(sub.provider_subscription_id);// One row per account, closed. The full action set only unfolds for the account being worked
    // on - expanded, fourteen accounts were a 3500px wall to scroll past on a phone.
    return `<details class="admin-user" data-user-id="${esc(user.id)}"><summary><div class="admin-user-main"><span>${esc(user.profile?.company_name||user.profile?.display_name||'Benutzerkonto')}</span><strong>${esc(user.email)}</strong><small>Registriert ${date(user.createdAt)} · ${user.projectCount} Projekte · ${user.usageCount} KI-Aufrufe · Abo ${esc(sub.status||'active')}${sub.current_period_end?` bis ${date(sub.current_period_end)}`:''}</small></div><div class="admin-user-status"><b class="plan-pill">${esc((sub.plan||'free').toUpperCase())}</b>${user.isAdmin?'<b class="plan-pill admin-pill">ADMIN</b>':''}<i class="${blocked?'blocked':'active'}">${blocked?'Gesperrt':'Aktiv'}</i><em class="admin-fold-mark" aria-hidden="true">+</em></div></summary><div class="admin-user-actions"><select data-user-plan><option value="free" ${sub.plan==='free'?'selected':''}>Free</option><option value="pro" ${sub.plan==='pro'?'selected':''}>Pro</option><option value="ultimate" ${sub.plan==='ultimate'?'selected':''}>Ultimate</option></select><button type="button" class="outline-btn mini" data-admin-action="set-plan">Tarif setzen</button><button type="button" class="outline-btn mini" data-admin-action="password">Reset-Mail</button>${stripe?'<button type="button" class="outline-btn mini" data-admin-action="cancel-subscription">Abo kündigen</button><button type="button" class="text-btn danger" data-admin-action="refund-latest">Letzte Zahlung erstatten</button>':''}<button type="button" class="outline-btn mini" data-admin-action="${user.isAdmin?'revoke-admin':'make-admin'}">${user.isAdmin?'Adminrechte entziehen':'Admin machen'}</button><button type="button" class="text-btn danger" data-admin-action="${blocked?'unsuspend':'suspend'}">${blocked?'Entsperren':'Sperren'}</button></div></details>`}).join('')||'<p class="empty-state">Keine passenden Benutzer gefunden.</p>'}
  function announcements(){const items=state.data?.announcements||[];foldCount('announcements',items.length,'Mitteilung','Mitteilungen');ui.announcements.innerHTML=items.map(item=>`<article><div><span>${esc(item.level.toUpperCase())}${item.active?' · AKTIV':''}</span><strong>${esc(item.title)}</strong><p>${esc(item.body)}</p><small>${item.ends_at?`bis ${date(item.ends_at)}`:'ohne Enddatum'}</small></div><button type="button" class="text-btn danger" data-delete-announcement="${esc(item.id)}">Löschen</button></article>`).join('')||'<p class="empty-state">Noch keine Mitteilungen.</p>'}
  function support(){const users=new Map((state.data?.users||[]).map(user=>[user.id,user.email]));foldCount('support',(state.data?.support||[]).length,'Anfrage','Anfragen');ui.support.innerHTML=(state.data?.support||[]).map(item=>`<article data-support-id="${esc(item.id)}"><div><span>${esc(item.category.toUpperCase())} · ${date(item.created_at)}</span><strong>${esc(item.subject)}</strong><small>${esc(users.get(item.user_id)||item.user_id)}</small><p>${esc(item.message)}</p>${item.reply?`<p class="admin-support-reply"><b>Deine Antwort</b>${esc(item.reply)}</p>`:''}<div class="admin-support-answer"><textarea data-support-reply rows="3" placeholder="Antwort an den Absender…">${esc(item.reply||'')}</textarea><button type="button" class="outline-btn mini" data-support-send>Antwort senden</button></div></div><select data-support-status><option value="open" ${item.status==='open'?'selected':''}>Offen</option><option value="in_progress" ${item.status==='in_progress'?'selected':''}>In Bearbeitung</option><option value="answered" ${item.status==='answered'?'selected':''}>Beantwortet</option><option value="closed" ${item.status==='closed'?'selected':''}>Geschlossen</option></select></article>`).join('')||'<p class="empty-state">Keine Support-Anfragen.</p>'}
  function offer(){const item=state.data?.offer||{};ui.offerEnabled.checked=Boolean(item.enabled);ui.offerEyebrow.value=item.eyebrow||'';ui.offerTitle.value=item.title||'';ui.offerDescription.value=item.description||'';ui.offerCta.value=item.cta_label||'';ui.offerTrial.value=item.trial_days||0;ui.offerDiscount.value=item.discount_percent||0;ui.offerCoupon.value=item.stripe_coupon_id||'';ui.offerEnds.value=localDate(item.ends_at)}
  // Dieselben Zahlen wie in der Kontingentanzeige und in server/quota.js - siehe plan-defaults.js.
  const QUOTA_DEFAULTS=window.PromptAiPlanDefaults?.all?.()||{free:{free_prompts:10,website_generations:3,ai_previews:0,monthly_tokens:150000},pro:{free_prompts:100,website_generations:25,ai_previews:50,monthly_tokens:2500000},ultimate:{free_prompts:500,website_generations:100,ai_previews:250,monthly_tokens:6000000}};
  function quota(){const rows=state.data?.quotaLimits||[],byPlan=Object.fromEntries((Array.isArray(rows)?rows:[]).map(r=>[r.plan,r]));for(const plan of ['free','pro','ultimate']){const row=byPlan[plan]||QUOTA_DEFAULTS[plan];ui[`quota${plan}FreePrompts`].value=row.free_prompts;ui[`quota${plan}WebsiteGenerations`].value=row.website_generations;ui[`quota${plan}AiPreviews`].value=row.ai_previews}const head=$('[data-admin-pane="users"] .admin-section-head');if(head){const tag=$('span',head),title=$('h3',head),copy=$('p',head);if(tag)tag.textContent='NUTZUNGSLIMITS';if(title)title.textContent='Monatliche Funktionslimits';if(copy)copy.innerHTML='Diese Zahlen sind harte Grenzen pro Konto: Ist ein Limit aufgebraucht, pausiert nur diese Funktion bis zum nächsten Kalendermonat. Eine KI-Vorschau ist ein Durchlauf mit drei Bildern. Die unabhängige Kostenbremse steht unter <strong>Tokens</strong>.'}}
  function maintenance(){const item=state.data?.maintenance||{};ui.maintenanceEnabled.checked=Boolean(item.enabled);ui.maintenanceReason.value=item.reason||'';ui.maintenanceEta.value=item.eta||''}
  // Eine offene Anfrage soll auffallen, ohne dass man die Verwaltung erst aufmacht: der Punkt
  // hängt am Verwaltungs-Eintrag und - über das Ereignis - am Menüknopf in der Kopfzeile.
  // Er bedeutet „noch nicht angesehen", nicht „noch nicht bearbeitet": vorher blieb er stehen,
  // solange irgendeine Anfrage offen war, also praktisch dauerhaft und ohne erkennbaren Grund.
  // Angesehen heißt: der Support-Bereich der Verwaltung war offen. Kommt danach eine neuere
  // Anfrage herein, ist der Punkt wieder da.
  const SEEN_KEY='prompt-ai-support-seen-v1';
  const seenMark=()=>{try{return String(localStorage.getItem(SEEN_KEY)||'')}catch{return ''}};
  function openRequests(){return (state.data?.support||[]).filter(item=>String(item.status||'open')==='open')}
  // Der jüngste Zeitstempel reicht als Marke - Anfragen kommen nur hinzu, nie rückdatiert.
  function newestMark(list){return list.map(item=>String(item.created_at||'')).sort().pop()||''}
  function unseenCount(){const list=openRequests(),mark=newestMark(list);return mark&&mark>seenMark()?list.length:0}
  function markSupportSeen(){
    const mark=newestMark(openRequests());
    if(mark)try{localStorage.setItem(SEEN_KEY,mark)}catch{}
    supportBadge();
  }
  function supportBadge(){
    const unseen=unseenCount(),tab=$('[data-admin-tab="support"]');
    if(ui.button){if(unseen)ui.button.dataset.drawerDot='1';else delete ui.button.dataset.drawerDot}
    // Damit in der Verwaltung selbst zu sehen ist, woher der Punkt kommt.
    if(tab){if(unseen)tab.dataset.adminDot='1';else delete tab.dataset.adminDot}
    window.dispatchEvent(new CustomEvent('promptai:support-open',{detail:{open:unseen}}));
  }
  // Wer die Verwaltung oeffnet, will drei Dinge wissen: Laeuft alles? Was kostet der Tag? Ist etwas
  // kaputt? Die Antworten lagen alle schon vor - verteilt ueber vier Reiter, jeder eine eigene
  // Suche. Ganz oben stehen sie jetzt nebeneinander, und die meisten Besuche sind damit in fuenf
  // Sekunden erledigt.
  //
  // Kein neuer Aufruf: alles kommt aus derselben Antwort wie der Rest, die KI-Kette aus der Liste,
  // die die Verwaltung ohnehin geladen hat.
  const heuteAb=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime()};
  function lage(){
    const wurzel=ui.stats?.parentElement;if(!wurzel)return;
    let block=$('#adminLage');
    if(!block){block=document.createElement('div');block.id='adminLage';block.className='admin-lage';wurzel.insertBefore(block,ui.stats)}
    const ereignisse=state.data?.usage||[];
    const grenze=heuteAb();
    const heute=ereignisse.filter(x=>new Date(x.created_at||x.createdAt||0).getTime()>=grenze);
    const fehler=heute.filter(x=>!x.success);
    const letzter=ereignisse.find(x=>!x.success);
    const tokens=heute.reduce((n,x)=>n+(Number(x.total_tokens||x.tokens||0)||0),0);
    const offen=(state.data?.support||[]).filter(x=>String(x.status||'open')!=='closed').length;
    const ki=(window.PromptAiSystemAI?.profiles||[]).filter(x=>x.enabled!==false);
    const erreichbar=ki.filter(x=>x.lastTestOk===true).length,ungeprueft=ki.filter(x=>!x.lastTestAt).length;
    const karte=(titel,wert,zusatz,zustand='')=>`<article class="admin-lage-karte${zustand?` is-${zustand}`:''}"><span>${esc(titel)}</span><strong>${esc(wert)}</strong><small>${esc(zusatz)}</small></article>`;
    block.innerHTML=[
      ki.length
        ? karte('KI-Kette',`${erreichbar} von ${ki.length}`,ungeprueft?`${ungeprueft} noch nie getestet — „Alle testen" im KI-Reiter`:'alle geprüft und erreichbar',
            ungeprueft?'warn':erreichbar===ki.length?'good':'bad')
        : karte('KI-Kette','–','Liste noch nicht geladen'),
      karte('Heute',`${heute.length} ${heute.length===1?'Aufruf':'Aufrufe'}`,tokens?`${tokens.toLocaleString('de-DE')} Tokens`:'noch keine Tokens gezählt'),
      karte('Fehler heute',String(fehler.length),fehler.length?'siehe „Verarbeitungen" unten':'nichts fehlgeschlagen',fehler.length?'bad':'good'),
      karte('Support',String(offen),offen?`${offen===1?'Anfrage wartet':'Anfragen warten'}`:'nichts offen',offen?'warn':'good'),
      letzter?karte('Letzter Fehler',String(letzter.action||'Verarbeitung'),`${letzter.provider||'unbekannt'} · ${date(letzter.created_at||letzter.createdAt)}`,'bad'):''
    ].filter(Boolean).join('');
  }
  function render(){lage();stats();usage();runs();userRows();support();announcements();offer();quota();maintenance();supportBadge()}
  async function load({quiet=false}={}){if(!quiet)message('Admin-Daten werden geladen…');try{state.data=await api('/api/admin-overview');render();
    // One request, several consoles: the prompt editor renders from the same payload.
    window.PromptAiAdminData=state.data;window.dispatchEvent(new CustomEvent('promptai:admin-data',{detail:state.data}));
    if(!quiet)message('Aktueller Stand geladen.','good')}catch(error){if(!quiet)message(error.message,'error')}}
  // Einmal im Hintergrund laden, sobald das Konto als Admin feststeht - nur dafür, dass der Punkt
  // am Menü stimmt, bevor die Verwaltung überhaupt geöffnet wurde.
  let warmed=false;
  function warmSupportBadge(){
    if(warmed)return;const button=$('#adminBtn');
    if(!button||button.hidden)return;
    warmed=true;load({quiet:true});
  }
  async function action(payload,success){message('Änderung wird gespeichert…');try{await api('/api/admin-action',{method:'POST',body:JSON.stringify(payload)});message(success,'good');await load()}catch(error){message(error.message,'error')}}
  window.addEventListener('promptai:system-ai-ready',()=>{try{lage()}catch{}});
  window.addEventListener('promptai:system-ai-updated',()=>{setTimeout(()=>{try{lage()}catch{}},400)});
  function init(){
    Object.assign(ui,{button:$('#adminBtn'),dialog:$('#adminDialog'),message:$('#adminMessage'),stats:$('#adminStats'),usage:$('#adminUsage'),runs:$('#adminRuns'),users:$('#adminUsers'),search:$('#adminUserSearch'),support:$('#adminSupport'),announcements:$('#adminAnnouncements'),offerEnabled:$('#offerEnabled'),offerEyebrow:$('#adminOfferEyebrow'),offerTitle:$('#adminOfferTitle'),offerDescription:$('#adminOfferDescription'),offerCta:$('#adminOfferCta'),offerTrial:$('#adminOfferTrialDays'),offerDiscount:$('#adminOfferDiscount'),offerCoupon:$('#adminOfferCoupon'),offerEnds:$('#adminOfferEndsAt')});
    for(const plan of ['free','pro','ultimate'])for(const field of ['FreePrompts','WebsiteGenerations','AiPreviews'])ui[`quota${plan}${field}`]=$(`#quota${plan.replace(/^./,c=>c.toUpperCase())}${field}`);
    Object.assign(ui,{maintenanceEnabled:$('#maintenanceEnabled'),maintenanceReason:$('#maintenanceReason'),maintenanceEta:$('#maintenanceEta')});
    ui.button.addEventListener('click',()=>{ui.dialog.showModal();load()});$('#adminReloadBtn').addEventListener('click',()=>load());ui.search.addEventListener('input',userRows);
    warmSupportBadge();window.addEventListener('sitebrief:admin',warmSupportBadge);window.addEventListener('promptai:access',warmSupportBadge);
    try{new MutationObserver(warmSupportBadge).observe(ui.button,{attributes:true,attributeFilter:['hidden']})}catch{}
    $$('.admin-tabs button').forEach(button=>button.addEventListener('click',()=>{$$('.admin-tabs button').forEach(x=>x.classList.toggle('active',x===button));$$('.admin-pane').forEach(pane=>pane.classList.toggle('active',pane.dataset.adminPane===button.dataset.adminTab));if(button.dataset.adminTab==='support')markSupportSeen()}));
    ui.users.addEventListener('click',async event=>{const button=event.target.closest('[data-admin-action]');if(!button)return;const row=button.closest('[data-user-id]'),userId=row.dataset.userId,type=button.dataset.adminAction,ask=(message,options={})=>window.PromptAiDialog.confirm(message,options);if(type==='make-admin'&&await ask('Diesem Konto volle Administratorrechte geben? Es erhält damit Zugriff auf alle Benutzerdaten, Tarife und Systemeinstellungen.',{title:'Admin machen',confirmLabel:'Admin machen',danger:true}))return action({action:'set-admin',userId,admin:true},'Konto ist jetzt Administrator.');
      if(type==='revoke-admin'&&await ask('Diesem Konto die Administratorrechte wieder entziehen?',{title:'Adminrechte entziehen',confirmLabel:'Entziehen',danger:true}))return action({action:'set-admin',userId,admin:false},'Administratorrechte wurden entzogen.');
      if(type==='set-plan')return action({action:'set-plan',userId,plan:$('[data-user-plan]',row).value},'Tarif wurde geändert.');if(type==='password'&&await ask('Eine Passwort-Reset-Mail an diesen Benutzer senden?',{title:'Reset-Mail senden',confirmLabel:'E-Mail senden'}))return action({action:'send-password-reset',userId},'Reset-Mail wurde versendet.');if(type==='cancel-subscription'&&await ask('Das Stripe-Abo wirklich zum Ende des aktuellen Zeitraums kündigen?',{title:'Abo kündigen',confirmLabel:'Abo kündigen',danger:true}))return action({action:'cancel-subscription',userId},'Abo wird zum Laufzeitende gekündigt.');if(type==='refund-latest'&&await ask('Die letzte bezahlte Stripe-Rechnung vollständig erstatten? Diese Aktion kann nicht rückgängig gemacht werden.',{title:'Zahlung erstatten',confirmLabel:'Vollständig erstatten',danger:true}))return action({action:'refund-latest',userId},'Die letzte Zahlung wurde erstattet.');if(type==='unsuspend'&&await ask('Benutzer wieder entsperren?',{title:'Benutzer entsperren',confirmLabel:'Entsperren'}))return action({action:'unsuspend',userId},'Benutzer wurde entsperrt.');if(type==='suspend'){const days=await window.PromptAiDialog.prompt('Wie viele Tage soll das Konto gesperrt werden?','30',{title:'Benutzer sperren',inputLabel:'Tage',confirmLabel:'Weiter'});if(days===null)return;const reason=await window.PromptAiDialog.prompt('Warum wird das Konto gesperrt?','Verstoß gegen die Nutzungsbedingungen',{title:'Grund der Sperre',inputLabel:'Begründung',confirmLabel:'Benutzer sperren'});if(reason===null)return;return action({action:'suspend',userId,days:Number(days),reason},'Benutzer wurde gesperrt.')}});
    ui.support.addEventListener('change',event=>{const select=event.target.closest('[data-support-status]');if(!select)return;const row=select.closest('[data-support-id]');action({action:'set-support-status',id:row.dataset.supportId,status:select.value},'Support-Status wurde gespeichert.')});
    $('#saveAnnouncementBtn').addEventListener('click',()=>action({action:'save-announcement',title:$('#announcementTitle').value,body:$('#announcementBody').value,level:$('#announcementLevel').value,active:$('#announcementActive').checked,endsAt:$('#announcementEndsAt').value?new Date($('#announcementEndsAt').value).toISOString():null},'Mitteilung wurde gespeichert.'));
    ui.support.addEventListener('click',event=>{
      const button=event.target.closest('[data-support-send]');if(!button)return;
      const card=button.closest('[data-support-id]'),field=card?.querySelector('[data-support-reply]');
      const reply=String(field?.value||'').trim();
      if(reply.length<2){field?.focus();return}
      action({action:'support-reply',id:card.dataset.supportId,reply},'Antwort wurde gesendet.');
    });
    ui.announcements.addEventListener('click',async event=>{const button=event.target.closest('[data-delete-announcement]');if(button&&await window.PromptAiDialog.confirm('Mitteilung wirklich löschen?',{title:'Mitteilung löschen',confirmLabel:'Löschen',danger:true}))action({action:'delete-announcement',id:button.dataset.deleteAnnouncement},'Mitteilung wurde gelöscht.')});
    $('#saveOfferBtn').addEventListener('click',()=>action({action:'save-offer',enabled:ui.offerEnabled.checked,eyebrow:ui.offerEyebrow.value,title:ui.offerTitle.value,description:ui.offerDescription.value,ctaLabel:ui.offerCta.value,trialDays:Number(ui.offerTrial.value),discountPercent:Number(ui.offerDiscount.value),stripeCouponId:ui.offerCoupon.value,endsAt:ui.offerEnds.value?new Date(ui.offerEnds.value).toISOString():null},'Aktion wurde gespeichert.'));
    $('#saveQuotaLimitsBtn').addEventListener('click',()=>{const plans={};for(const plan of ['free','pro','ultimate']){
      // The token budget lives in its own tab now; it is carried along unchanged so saving the
      // monthly quotas never resets it.
      const stored=(state.data?.quotaLimits||[]).find(row=>row.plan===plan)||{};
      plans[plan]={free_prompts:Number(ui[`quota${plan}FreePrompts`].value)||0,website_generations:Number(ui[`quota${plan}WebsiteGenerations`].value)||0,ai_previews:Number(ui[`quota${plan}AiPreviews`].value)||0,monthly_tokens:Math.max(0,Number(stored.monthly_tokens)||0)};
    }action({action:'save-quota-limits',plans},'Kontingente wurden gespeichert.')});
    $('#saveMaintenanceBtn').addEventListener('click',async()=>{const enabling=ui.maintenanceEnabled.checked&&!state.data?.maintenance?.enabled;if(enabling&&!await window.PromptAiDialog.confirm('Wartungsmodus jetzt aktivieren? Alle Nutzer außer dir sehen sofort ein Fenster, das sie nicht schließen können, bis du die Wartung hier wieder deaktivierst.',{title:'Wartung aktivieren',confirmLabel:'Wartung aktivieren',danger:true}))return;action({action:'save-maintenance',enabled:ui.maintenanceEnabled.checked,reason:ui.maintenanceReason.value,eta:ui.maintenanceEta.value},ui.maintenanceEnabled.checked?'Wartung ist jetzt aktiv.':'Wartung wurde deaktiviert.')});
    window.addEventListener('sitebrief:admin',event=>{state.isAdmin=Boolean(event.detail?.isAdmin);ui.button.hidden=!state.isAdmin});
  }

  async function publicContent(){
    try{const [{offer},{announcements}]=await Promise.all([fetch('/api/offer').then(r=>r.json()),fetch('/api/announcements').then(r=>r.json())]);const banner=$('#offerBanner');if(offer){
      // Leer heisst leer. Vorher setzte jede dieser Zeilen bei leerem Wert einen Standardtext
      // zurueck, und der CTA ueberschrieb zusaetzlich beide Tarif-Knoepfe - derselbe Satz stand
      // dann dreimal auf der Seite und liess sich in der Verwaltung nicht wegbekommen.
      const put=(sel,value)=>{const node=$(sel);if(!node)return;const text=String(value||'').trim();node.textContent=text;node.hidden=!text};
      if(!sessionStorage.getItem('sitebrief-offer-hidden')){
        put('#offerEyebrow',offer.eyebrow);put('#offerTitle',offer.title);put('#offerDescription',offer.description);
        const cta=$('#offerCta'),ctaText=String(offer.cta_label||'').trim();
        if(cta){cta.textContent=ctaText||'Tarife ansehen';cta.hidden=false}
        banner.hidden=!(String(offer.eyebrow||'').trim()||String(offer.title||'').trim()||String(offer.description||'').trim());
        if(!banner.hidden)setTimeout(()=>window.PromptAiOfferAutoHide?.(false),9000);
      }
      const label=String(offer.cta_label||'').trim();
      if(label){if($('#startProCheckoutBtn'))$('#startProCheckoutBtn').textContent=label;if($('#startUltimateCheckoutBtn'))$('#startUltimateCheckoutBtn').textContent=label}
    }// Announcements are presented by announcement-popup.js as a large dialog. This side only
    // publishes what the API returned, so there is a single owner for how they look and when they
    // come back.
    window.PromptAiAnnouncements=Array.isArray(announcements)?announcements:[];window.dispatchEvent(new CustomEvent('promptai:announcements',{detail:{announcements:window.PromptAiAnnouncements}}))}catch{}
  }
  // Die Aktion ist eine Meldung, kein Moebelstueck: sie zeigt sich kurz oben und geht dann von
  // selbst. Wer sie wegklickt, sieht sie in dieser Sitzung gar nicht mehr.
  function fadeOffer(remember){
    const banner=$('#offerBanner');if(!banner||banner.hidden)return;
    banner.dataset.leaving='1';
    setTimeout(()=>{banner.hidden=true;delete banner.dataset.leaving},260);
    if(remember)sessionStorage.setItem('sitebrief-offer-hidden','1');
  }
  window.PromptAiOfferAutoHide=fadeOffer;
  document.addEventListener('DOMContentLoaded',()=>{init();publicContent();$('#offerCta').addEventListener('click',()=>{$('#plansDialog')?.showModal();fadeOffer(true)});$('#offerClose').addEventListener('click',()=>fadeOffer(true))});
})();

// Hier stand ein Nachlader, der admin-ai-ui.js bei jedem Aufruf mitgeholt hat - auch fuer Gaeste,
// die den Verwaltungsbereich nie sehen. Dieselbe Datei laedt adminExtras() in admin-console.js
// beim Klick auf "Verwaltung", zusammen mit den uebrigen Verwaltungsdateien. Ein Weg genuegt.

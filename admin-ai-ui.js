(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const PROVIDERS={
    gateway:{name:'Vercel AI Gateway',hint:'Zentrale Text-KI und Modell-Routing',placeholder:'AI Gateway API-Key'},
    openai:{name:'OpenAI',hint:'Direkte OpenAI-Verarbeitung',placeholder:'sk-…'},
    gemini:{name:'Google Gemini',hint:'Text- und Bildverarbeitung über Gemini',placeholder:'Gemini API-Key'},
    cloudflare:{name:'Cloudflare Workers AI',hint:'Cloudflare-Modelle und Bildgenerierung',placeholder:'API-Token'}
  };
  let loaded=false,state={connections:[]};

  async function api(url,options={}){
    const headers=await window.SiteBriefCloud?.authHeaders?.()||{};
    const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...headers,...(options.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Anfrage fehlgeschlagen.');
    return data;
  }
  function style(){
    if($('#adminAiStyle'))return;
    const el=document.createElement('style');el.id='adminAiStyle';el.textContent=`
      .admin-ai-intro{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin:0 0 18px}.admin-ai-intro p{margin:5px 0 0;color:var(--muted);max-width:680px}.admin-ai-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.admin-ai-card{border:1px solid var(--line);border-radius:18px;padding:16px;background:var(--panel-soft)}.admin-ai-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.admin-ai-card-head strong{display:block;font-size:17px}.admin-ai-card-head small{display:block;color:var(--muted);margin-top:4px}.admin-ai-status{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 9px;border:1px solid var(--line);border-radius:999px;white-space:nowrap}.admin-ai-status.on{color:#75b984}.admin-ai-fields{display:grid;gap:10px}.admin-ai-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.admin-ai-meta{margin-top:10px;color:var(--muted);font-size:12px}.admin-ai-route{margin-top:18px;border-top:1px solid var(--line);padding-top:18px}.admin-ai-route-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.admin-ai-note{margin-top:16px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;color:var(--muted);font-size:12px}.admin-ai-message{min-height:20px;margin:12px 0 0;font-size:13px}.admin-ai-message.good{color:#75b984}.admin-ai-message.error{color:#e98981}@media(max-width:760px){.admin-ai-grid{grid-template-columns:1fr}.admin-ai-route-grid{grid-template-columns:1fr}.admin-ai-intro{display:block}.admin-ai-card{padding:14px}.admin-ai-actions>*{flex:1 1 auto}}
    `;document.head.appendChild(el);
  }
  function ensureUi(){
    const tabs=$('.admin-tabs'),body=$('.admin-body');if(!tabs||!body||$('[data-admin-tab="ai"]'))return;
    const tab=document.createElement('button');tab.type='button';tab.dataset.adminTab='ai';tab.textContent='KI & Verarbeitung';tabs.appendChild(tab);
    const pane=document.createElement('section');pane.className='admin-pane';pane.dataset.adminPane='ai';pane.innerHTML=`
      <div class="admin-ai-intro"><div><span>KI-ZENTRALE</span><h3>Verarbeitung direkt in Prompt.ai verwalten</h3><p>Hier hinterlegte Zugänge stehen Prompt.ai serverseitig zur Verfügung. Die Schlüssel werden verschlüsselt in Supabase Vault gespeichert und nie im Browser zurückgegeben.</p></div><button type="button" class="outline-btn mini" id="adminAiReload">Neu laden</button></div>
      <div class="admin-ai-grid" id="adminAiGrid"></div>
      <div class="admin-ai-route"><div class="admin-section-head"><div><span>ROUTING</span><h3>Standard und Fallbacks</h3></div></div><div class="admin-ai-route-grid"><label class="field"><span>Standard-KI</span><select id="adminAiPrimary"></select></label><label class="field"><span>Fallback 1</span><select id="adminAiFallback1"></select></label><label class="field"><span>Fallback 2</span><select id="adminAiFallback2"></select></label></div><p class="admin-ai-note">Persönliche KI-Verbindungen eines berechtigten Nutzers haben weiterhin Vorrang. Danach verwendet Prompt.ai diese zentralen Verbindungen; Vercel-Variablen bleiben nur als letzter Fallback bestehen.</p></div>
      <p class="admin-ai-message" id="adminAiMessage"></p>`;
    body.appendChild(pane);style();
    tab.addEventListener('click',()=>{switchTab(tab,pane);load()});
    $('#adminAiReload')?.addEventListener('click',load);
  }
  function switchTab(tab,pane){$$('.admin-tabs button').forEach(x=>x.classList.toggle('active',x===tab));$$('.admin-pane').forEach(x=>x.classList.toggle('active',x===pane));}
  function msg(text='',kind=''){const el=$('#adminAiMessage');if(el){el.textContent=text;el.className=`admin-ai-message ${kind}`.trim()}}
  function providerOptions(selected=''){return `<option value="">Nicht festgelegt</option>${Object.entries(PROVIDERS).map(([id,p])=>`<option value="${id}" ${selected===id?'selected':''}>${esc(p.name)}</option>`).join('')}`}
  function render(){
    const map=new Map((state.connections||[]).map(x=>[x.provider,x]));
    const grid=$('#adminAiGrid');if(!grid)return;
    grid.innerHTML=Object.entries(PROVIDERS).map(([id,p])=>{const item=map.get(id)||{},connected=Boolean(item.last4);return `<article class="admin-ai-card" data-ai-provider="${id}"><div class="admin-ai-card-head"><div><strong>${esc(p.name)}</strong><small>${esc(p.hint)}</small></div><span class="admin-ai-status ${connected&&item.enabled?'on':''}">${connected?(item.enabled?'Verbunden':'Deaktiviert'):'Nicht verbunden'}</span></div><div class="admin-ai-fields">${id==='cloudflare'?`<label class="field"><span>Account-ID</span><input data-ai-account type="text" autocomplete="off" placeholder="Cloudflare Account-ID"></label><label class="field"><span>API-Token</span><input data-ai-secret type="password" autocomplete="off" placeholder="${esc(p.placeholder)}"></label>`:`<label class="field"><span>API-Key</span><input data-ai-secret type="password" autocomplete="off" placeholder="${connected?`Gespeichert · endet auf ${esc(item.last4)}`:esc(p.placeholder)}"></label>`}<label class="field"><span>Standardmodell</span><input data-ai-model type="text" value="${esc(item.default_model||'')}" placeholder="Modell-ID optional"></label><label class="toggle-row compact"><input data-ai-enabled type="checkbox" ${item.enabled!==false?'checked':''}><span><strong>Aktiv verwenden</strong></span></label></div><div class="admin-ai-actions"><button type="button" class="solid-btn mini" data-ai-save>Speichern</button><button type="button" class="outline-btn mini" data-ai-test ${connected?'':'disabled'}>Verbindung testen</button>${connected?'<button type="button" class="text-btn danger" data-ai-delete>Entfernen</button>':''}</div><div class="admin-ai-meta">${connected?`Gespeichert · ••••${esc(item.last4)}${item.updated_at?` · zuletzt geändert ${new Date(item.updated_at).toLocaleString('de-DE')}`:''}`:'Noch kein zentraler Zugang hinterlegt.'}</div></article>`}).join('');
    const role=roleName=>state.connections.find(x=>x.route_role===roleName)?.provider||'';
    $('#adminAiPrimary').innerHTML=providerOptions(role('primary'));$('#adminAiFallback1').innerHTML=providerOptions(role('fallback1'));$('#adminAiFallback2').innerHTML=providerOptions(role('fallback2'));
    bindCards();bindRouting();
  }
  function bindCards(){
    $$('#adminAiGrid [data-ai-save]').forEach(btn=>btn.onclick=()=>save(btn.closest('[data-ai-provider]')));
    $$('#adminAiGrid [data-ai-test]').forEach(btn=>btn.onclick=()=>test(btn.closest('[data-ai-provider]')));
    $$('#adminAiGrid [data-ai-delete]').forEach(btn=>btn.onclick=()=>remove(btn.closest('[data-ai-provider]')));
  }
  function bindRouting(){['Primary','Fallback1','Fallback2'].forEach((name,i)=>{const el=$(`#adminAi${name}`);if(!el)return;el.onchange=()=>setRoute(el.value,['primary','fallback1','fallback2'][i])})}
  async function load(){msg('KI-Verbindungen werden geladen…');try{const data=await api('/api/admin-ai');state.connections=data.connections||[];render();loaded=true;msg('KI-Zentrale geladen.','good')}catch(error){msg(error.message,'error')}}
  async function save(card){
    const provider=card.dataset.aiProvider,secret=card.querySelector('[data-ai-secret]')?.value||'',accountId=card.querySelector('[data-ai-account]')?.value||'',defaultModel=card.querySelector('[data-ai-model]')?.value||'',enabled=Boolean(card.querySelector('[data-ai-enabled]')?.checked),existing=state.connections.find(x=>x.provider===provider),routeRole=existing?.route_role||'manual';
    msg(`${PROVIDERS[provider].name} wird gespeichert…`);
    try{await api('/api/admin-ai',{method:'POST',body:JSON.stringify({action:'save',provider,secret,accountId,apiToken:secret,defaultModel,enabled,routeRole})});await load();msg(`${PROVIDERS[provider].name} gespeichert.`,'good')}catch(error){msg(error.message,'error')}
  }
  async function test(card){const provider=card.dataset.aiProvider;msg(`${PROVIDERS[provider].name} wird getestet…`);try{const result=await api('/api/admin-ai',{method:'POST',body:JSON.stringify({action:'test',provider})});msg(`${PROVIDERS[provider].name} funktioniert${result.models?.length?` · ${result.models.length} Modelle gefunden`:''}.`,'good')}catch(error){msg(error.message,'error')}}
  async function remove(card){const provider=card.dataset.aiProvider;if(window.PromptAiDialog&&!await window.PromptAiDialog.confirm(`${PROVIDERS[provider].name} wirklich aus der zentralen Verarbeitung entfernen?`,{title:'KI-Verbindung entfernen',confirmLabel:'Entfernen',danger:true}))return;try{await api('/api/admin-ai',{method:'POST',body:JSON.stringify({action:'delete',provider})});await load();msg(`${PROVIDERS[provider].name} entfernt.`,'good')}catch(error){msg(error.message,'error')}}
  async function setRoute(provider,role){if(!provider)return;const item=state.connections.find(x=>x.provider===provider);if(!item){msg('Bitte den Anbieter zuerst verbinden.','error');return render()}try{await api('/api/admin-ai',{method:'POST',body:JSON.stringify({action:'save',provider,defaultModel:item.default_model||'',enabled:item.enabled!==false,routeRole:role})});await load();msg('Routing wurde gespeichert.','good')}catch(error){msg(error.message,'error')}}
  function start(){ensureUi();document.addEventListener('click',event=>{if(event.target.closest('#adminBtn'))setTimeout(()=>{ensureUi();if(!loaded)load()},80)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

(()=>{
  'use strict';
  // One place for everything about tokens: what was consumed this month, by which model, in which
  // step and by which account - and the two knobs that change it, the monthly budget per plan and
  // extra tokens for a single account. Reaching a budget never blocks anyone; the routing drops to
  // the cheapest AI of the plan until the counter resets (see server/quota.js).
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const num=v=>Number(v||0).toLocaleString('de-DE');
  const monthName=value=>value?new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value)):'';
  const dayLabel=value=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(value));
  const PLANS=['free','pro','ultimate'],PLAN_LABEL={free:'Kostenlos',pro:'Pro',ultimate:'Ultimate'};
  const ACTION_LABEL={concepts:'Konzepte & Vorschau-Texte','master-prompt':'Master-Prompt',review:'Projektprüfung',refine:'Nachschärfen',website:'Website-Generierung','revision-brief':'Änderungsauftrag','free-prompt':'Freier Prompt','preview-image':'Bildvorschau','sandbox-build':'Sandbox-Probelauf',generate:'Sonstige Verarbeitung'};
  const COST_EQUIVALENT={'preview-image':5000,'sandbox-build':10000};
  const state={data:null,search:''};

  async function api(payload){
    const headers=await window.SiteBriefCloud?.authHeaders?.()||{};
    const response=await fetch('/api/admin-action',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Anfrage fehlgeschlagen.');
    return data;
  }
  function style(){
    if($('#adminTokenStyle'))return;
    const el=document.createElement('style');el.id='adminTokenStyle';el.textContent=`
      .admin-token-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:4px}
      .admin-token-stats article{padding:13px 14px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}
      .admin-token-stats span{display:block;color:var(--muted);font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
      .admin-token-stats strong{display:block;margin-top:5px;font-size:21px;line-height:1.15}
      .admin-token-stats small{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      .admin-token-budgets{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:12px}
      .admin-token-budget{padding:13px 14px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}
      .admin-token-budget strong{display:block;font-size:13px}
      .admin-token-budget input{width:100%;margin-top:8px;padding:10px 11px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);font-size:14px}
      .admin-token-budget small{display:block;margin-top:6px;color:var(--muted);font-size:11px}
      .admin-token-save{margin-top:12px}
      .admin-token-rows{display:grid;gap:8px}
      .admin-token-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 13px;border:1px solid var(--line);border-radius:11px}
      .admin-token-row strong{display:block;font-size:12px;overflow-wrap:anywhere}
      .admin-token-row small{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      .admin-token-row b{font-size:13px;white-space:nowrap}
      .admin-token-bar{height:6px;margin-top:7px;border-radius:99px;background:color-mix(in srgb,var(--ink) 10%,transparent);overflow:hidden}
      .admin-token-bar i{display:block;height:100%;border-radius:99px;background:var(--accent)}
      .admin-token-bar.is-saver i{background:var(--danger)}
      .admin-token-account-actions{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
      .admin-token-pill{display:inline-block;margin-left:6px;padding:2px 7px;border-radius:99px;background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger);font-size:10px;font-weight:800;letter-spacing:.04em}
      .admin-token-pill.is-bonus{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)}
      #adminTokenSearch{width:100%;margin-bottom:10px}
      .admin-token-message{min-height:20px;margin:14px 0 0;font-size:13px}
      .admin-token-message.good{color:var(--good)}.admin-token-message.error{color:var(--danger)}
      @media(max-width:820px){
        .admin-token-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
        .admin-token-stats strong{font-size:18px}
        .admin-token-row{grid-template-columns:1fr}
        .admin-token-account-actions{justify-content:flex-start}
        .admin-token-account-actions>*{flex:1 1 auto}
      }
    `;document.head.appendChild(el);
  }
  function ensureUi(){
    const tabs=$('.admin-tabs'),body=$('.admin-body');if(!tabs||!body||$('[data-admin-tab="tokens"]'))return;
    style();
    const tab=document.createElement('button');tab.type='button';tab.dataset.adminTab='tokens';tab.textContent='Tokens';tabs.appendChild(tab);
    const pane=document.createElement('section');pane.className='admin-pane';pane.dataset.adminPane='tokens';
    pane.innerHTML=`
      <div class="admin-section-head"><div><span>KOSTENBREMSE</span><h3>KI-Kosten und Sparmodus</h3><p id="adminTokenPeriod">Das Kostenbudget wird pro Konto und Kalendermonat geprüft. Nur Prompt.ai bezahlte Aufrufe zählen. Ist es erreicht, bleibt die Nutzung verfügbar und wechselt auf die günstigste KI des Tarifs.</p></div><button type="button" class="outline-btn mini" id="adminTokenReload">Neu laden</button></div>
      <div class="admin-token-stats" id="adminTokenStats"></div>
      <div class="admin-section-head" style="margin-top:22px"><div><span>PRO KONTO</span><h3>Kostenbudget pro Tarif</h3><p>Bis zu diesem Wert nutzt ein Konto die bevorzugte KI. Bildvorschauen und Sandbox-Läufe erhalten einen festen Kostenwert. <strong>0 bedeutet: kein Sparmodus.</strong> Die harten Nutzungslimits stehen unter Benutzer.</p></div></div>
      <div class="admin-token-budgets" id="adminTokenBudgets"></div>
      <button type="button" class="solid-btn admin-token-save" id="adminTokenSaveBudgets">Budgets speichern</button>
      <details class="admin-fold"><summary><div><span>MODELLE</span><strong>Verbrauch nach KI-Modell</strong></div><em data-token-count="models"></em><i aria-hidden="true">+</i></summary><div class="admin-fold-body"><div class="admin-token-rows" id="adminTokenModels"></div></div></details>
      <details class="admin-fold"><summary><div><span>BEREICHE</span><strong>Verbrauch nach Arbeitsschritt</strong></div><em data-token-count="actions"></em><i aria-hidden="true">+</i></summary><div class="admin-fold-body"><div class="admin-token-rows" id="adminTokenActions"></div></div></details>
      <details class="admin-fold"><summary><div><span>KONTEN</span><strong>Verbrauch pro Konto</strong></div><em data-token-count="accounts"></em><i aria-hidden="true">+</i></summary><div class="admin-fold-body"><input id="adminTokenSearch" type="search" placeholder="E-Mail suchen" /><div class="admin-token-rows" id="adminTokenAccounts"></div></div></details>
      <details class="admin-fold"><summary><div><span>VERLAUF</span><strong>Verbrauch pro Tag</strong></div><em data-token-count="days"></em><i aria-hidden="true">+</i></summary><div class="admin-fold-body"><div class="admin-token-rows" id="adminTokenDays"></div></div></details>
      <p class="admin-token-message" id="adminTokenMessage"></p>`;
    body.appendChild(pane);
    tab.addEventListener('click',()=>{
      $$('.admin-tabs button').forEach(x=>x.classList.toggle('active',x===tab));
      $$('.admin-pane').forEach(x=>x.classList.toggle('active',x===pane));
      render();
    });
    pane.addEventListener('click',onClick);
    pane.addEventListener('input',event=>{if(event.target.id==='adminTokenSearch'){state.search=event.target.value.trim().toLowerCase();renderAccounts()}});
  }
  function msg(text='',kind=''){const el=$('#adminTokenMessage');if(el){el.textContent=text;el.className=`admin-token-message ${kind}`.trim()}}
  function count(key,value,singular,plural){const host=$(`[data-token-count="${key}"]`);if(host)host.textContent=value?`${value} ${value===1?singular:plural}`:'leer'}

  // The month slice is the same window the budgets reset in. Older payloads without it fall back to
  // the general usage list so the tab still shows something instead of an empty page.
  const events=()=>Array.isArray(state.data?.tokenEvents)?state.data.tokenEvents:(state.data?.usage||[]);
  const aiTokens=row=>Math.max(0,Number(row?.total_tokens)||0);
  const budgetUnits=row=>row?.key_source==='account'?0:aiTokens(row)+(COST_EQUIVALENT[row?.action]||0);
  const planBudget=plan=>{const row=(state.data?.quotaLimits||[]).find(x=>x.plan===plan);return Math.max(0,Number(row?.monthly_tokens)||0)};
  const bonusOf=user=>Math.max(0,Number(user?.adminState?.monthly_token_bonus)||0);
  function accountRows(){
    const used=new Map();
    for(const row of events())used.set(row.user_id,(used.get(row.user_id)||0)+budgetUnits(row));
    return (state.data?.users||[]).map(user=>{
      const plan=user.subscription?.plan||'free',limit=planBudget(plan),bonus=bonusOf(user),total=limit?limit+bonus:0,tokens=used.get(user.id)||0;
      // Administrators are never downgraded, so they never count as being in saver mode.
      return {user,plan,limit,bonus,total,tokens,saver:Boolean(total)&&!user.isAdmin&&tokens>=total};
    }).sort((a,b)=>b.tokens-a.tokens);
  }

  function renderStats(){
    const host=$('#adminTokenStats');if(!host)return;
    const rows=events();
    const total=rows.reduce((sum,row)=>sum+aiTokens(row),0),cost=rows.reduce((sum,row)=>sum+budgetUnits(row),0);
    const prompt=rows.reduce((sum,row)=>sum+(Number(row.prompt_tokens)||0),0);
    const completion=rows.reduce((sum,row)=>sum+(Number(row.completion_tokens)||0),0);
    const accounts=accountRows(),saver=accounts.filter(x=>x.saver).length,active=accounts.filter(x=>x.tokens>0).length;
    const period=state.data?.tokenPeriod?.start;
    const note=$('#adminTokenPeriod');
    if(note&&period)note.textContent=`Kostenbremse für ${monthName(period)}: pro Konto, nur für von Prompt.ai bezahlte Nutzung. Eigene API-Keys zählen nicht. Nach Erreichen des Budgets läuft die Verarbeitung mit der günstigsten KI weiter.`;
    host.innerHTML=[
      ['Kostenbudget genutzt',num(cost),'systembezahlte Tokens und Kostenwerte'],
      ['KI-Tokens gesamt',num(total),'einschließlich eigener API-Keys'],
      ['Eingabe',num(prompt),total?`${Math.round(prompt/total*100)} % des Verbrauchs`:'noch nichts erfasst'],
      ['Ausgabe',num(completion),total?`${Math.round(completion/total*100)} % des Verbrauchs`:'noch nichts erfasst'],
      ['Erfasste Aufrufe',num(rows.length),'erfolgreiche KI-, Bild- und Sandbox-Aufrufe'],
      ['Aktive Konten',num(active),`von ${num((state.data?.users||[]).length)} Konten`],
      ['Im Sparmodus',num(saver),saver?'laufen auf der günstigsten KI':'kein Konto am Limit']
    ].map(([label,value,hint])=>`<article><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(hint)}</small></article>`).join('');
  }
  function renderBudgets(){
    const host=$('#adminTokenBudgets');if(!host)return;
    host.innerHTML=PLANS.map(plan=>{
      const limit=planBudget(plan);
      return `<label class="admin-token-budget"><strong>${esc(PLAN_LABEL[plan])}</strong><input type="number" min="0" max="2000000000" step="1000" id="adminTokenBudget-${plan}" value="${limit}" /><small>${limit?`Günstigste KI ab ${num(limit)} Kostenpunkten`:'Kein Sparmodus – bevorzugte KI bleibt aktiv'}</small></label>`;
    }).join('');
  }
  function renderGroups(){
    const rows=events();
    const group=(keyOf,labelOf)=>{
      const map=new Map();
      for(const row of rows){const key=keyOf(row),entry=map.get(key)||{tokens:0,calls:0};entry.tokens+=budgetUnits(row);entry.calls++;map.set(key,entry)}
      const total=rows.reduce((sum,row)=>sum+budgetUnits(row),0)||1;
      return [...map.entries()].sort((a,b)=>b[1].tokens-a[1].tokens).map(([key,entry])=>({label:labelOf(key),tokens:entry.tokens,calls:entry.calls,share:Math.round(entry.tokens/total*100)}));
    };
    const paint=(host,items,empty)=>{
      if(!host)return;
      host.innerHTML=items.map(item=>`<div class="admin-token-row"><div><strong>${esc(item.label)}</strong><small>${num(item.calls)} ${item.calls===1?'Aufruf':'Aufrufe'} · Ø ${num(Math.round(item.tokens/item.calls))} Tokens · ${item.share} % des Verbrauchs</small><div class="admin-token-bar"><i style="width:${Math.max(2,item.share)}%"></i></div></div><b>${num(item.tokens)}</b></div>`).join('')||`<p class="empty-state">${esc(empty)}</p>`;
    };
    const models=group(row=>`${row.provider||'unbekannt'} · ${row.model||'Standardmodell'}`,key=>key);
    const actions=group(row=>row.action||'generate',key=>ACTION_LABEL[key]||key);
    count('models',models.length,'Modell','Modelle');count('actions',actions.length,'Schritt','Schritte');
    paint($('#adminTokenModels'),models,'In diesem Monat wurden noch keine Tokens verbraucht.');
    paint($('#adminTokenActions'),actions,'In diesem Monat wurden noch keine Tokens verbraucht.');
  }
  function renderAccounts(){
    const host=$('#adminTokenAccounts');if(!host)return;
    const rows=accountRows().filter(row=>row.tokens>0||row.bonus>0||row.saver);
    const shown=rows.filter(row=>!state.search||String(row.user.email||'').toLowerCase().includes(state.search));
    count('accounts',rows.length,'Konto','Konten');
    host.innerHTML=shown.map(row=>{
      const share=row.total?Math.min(100,Math.round(row.tokens/row.total*100)):0;
      const budget=row.total?`${num(row.tokens)} von ${num(row.total)} Tokens${row.bonus?` (inkl. ${num(row.bonus)} extra)`:''} · ${share} %`:`${num(row.tokens)} Tokens · kein Limit in ${PLAN_LABEL[row.plan]}`;
      return `<div class="admin-token-row" data-token-user="${esc(row.user.id)}"><div><strong>${esc(row.user.email||row.user.id)}${row.saver?'<span class="admin-token-pill">SPARMODUS</span>':''}${row.bonus?'<span class="admin-token-pill is-bonus">EXTRA</span>':''}</strong><small>${esc(PLAN_LABEL[row.plan]||row.plan)}${row.user.isAdmin?' · Administrator (nie gedrosselt)':''} · ${esc(budget)}</small>${row.total?`<div class="admin-token-bar ${row.saver?'is-saver':''}"><i style="width:${Math.max(2,share)}%"></i></div>`:''}</div><div class="admin-token-account-actions"><button type="button" class="outline-btn mini" data-token-action="bonus">Extra-Tokens</button>${row.bonus?'<button type="button" class="text-btn danger" data-token-action="bonus-clear">Extra entfernen</button>':''}</div></div>`;
    }).join('')||`<p class="empty-state">${rows.length?'Kein Konto passt zur Suche.':'In diesem Monat hat noch kein Konto Tokens verbraucht.'}</p>`;
  }
  function renderDays(){
    const host=$('#adminTokenDays');if(!host)return;
    const map=new Map();
    for(const row of events()){const day=String(row.created_at||'').slice(0,10);if(!day)continue;const entry=map.get(day)||{tokens:0,calls:0};entry.tokens+=budgetUnits(row);entry.calls++;map.set(day,entry)}
    const days=[...map.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
    const peak=days.reduce((max,[,entry])=>Math.max(max,entry.tokens),0)||1;
    count('days',days.length,'Tag','Tage');
    host.innerHTML=days.map(([day,entry])=>`<div class="admin-token-row"><div><strong>${esc(dayLabel(`${day}T12:00:00Z`))}</strong><small>${num(entry.calls)} ${entry.calls===1?'Aufruf':'Aufrufe'}</small><div class="admin-token-bar"><i style="width:${Math.max(2,Math.round(entry.tokens/peak*100))}%"></i></div></div><b>${num(entry.tokens)}</b></div>`).join('')||'<p class="empty-state">In diesem Monat wurden noch keine Tokens verbraucht.</p>';
  }
  function render(){renderStats();renderBudgets();renderGroups();renderAccounts();renderDays()}

  async function onClick(event){
    const button=event.target.closest('button');if(!button)return;
    try{
      if(button.id==='adminTokenReload'){refresh();return}
      if(button.id==='adminTokenSaveBudgets'){
        const plans={};for(const plan of PLANS)plans[plan]=Math.max(0,Number($(`#adminTokenBudget-${plan}`)?.value)||0);
        msg('Budgets werden gespeichert…');
        await api({action:'save-token-budgets',plans});
        msg('Budgets wurden gespeichert. Sie gelten sofort für alle Konten.','good');
        refresh();return;
      }
      const action=button.dataset.tokenAction;if(!action)return;
      const row=button.closest('[data-token-user]'),userId=row?.dataset.tokenUser;if(!userId)return;
      const current=accountRows().find(item=>item.user.id===userId);
      if(action==='bonus'){
        const answer=await window.PromptAiDialog.prompt('Wie viele zusätzliche Tokens soll dieses Konto in diesem Monat bekommen? Sie werden auf das Tarifbudget aufgeschlagen.',String(current?.bonus||0),{title:'Extra-Tokens vergeben',inputLabel:'Zusätzliche Tokens',confirmLabel:'Speichern'});
        if(answer===null)return;
        msg('Extra-Tokens werden gespeichert…');
        await api({action:'set-token-bonus',userId,tokens:Number(answer)||0});
        msg('Extra-Tokens wurden gespeichert.','good');refresh();return;
      }
      if(action==='bonus-clear'){
        if(!await window.PromptAiDialog.confirm('Die zusätzlichen Tokens dieses Kontos wieder entfernen? Es gilt dann nur noch das Tarifbudget.',{title:'Extra-Tokens entfernen',confirmLabel:'Entfernen',danger:true}))return;
        await api({action:'set-token-bonus',userId,tokens:0});
        msg('Extra-Tokens wurden entfernt.','good');refresh();return;
      }
    }catch(error){msg(error.message,'error')}
  }
  // The admin console owns the data request; asking it to reload keeps a single source.
  function refresh(){$('#adminReloadBtn')?.click()}

  function accept(data){
    state.data=data||null;
    ensureUi();
    if($('[data-admin-pane="tokens"]'))render();
  }
  window.addEventListener('promptai:admin-data',event=>accept(event.detail));
  if(window.PromptAiAdminData)accept(window.PromptAiAdminData);
})();

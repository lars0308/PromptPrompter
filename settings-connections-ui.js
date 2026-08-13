(()=>{
  'use strict';
  // The settings listed four fixed provider cards with key fields that nobody without the add-on was
  // ever allowed to fill. What belongs there is the offer: a connection slot costs 5,99 € a month,
  // and only a bought slot shows a form - one you name yourself and point at the provider you want.
  // The provider cards themselves are reused, not rebuilt: every save/test/disconnect handler in
  // app.js stays bound to the elements it already knows.
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const NAME_KEY='prompt-ai-connection-names-v1';
  const PROVIDERS=[['gateway','Vercel AI Gateway'],['openai','OpenAI'],['gemini','Google Gemini'],['cloudflare','Cloudflare Workers AI']];
  const CARD_ID={gateway:'gatewayConnectionStatus',openai:'openaiConnectionStatus',gemini:'geminiConnectionStatus',cloudflare:'cloudflareConnectionStatus'};
  const access=()=>window.PromptAiAccess||{plan:'free',isAdmin:false};
  // Every provider has exactly one key per account on the server, so a slot is one provider. Four
  // providers means four slots; a fifth would need its own storage per slot.
  const MAX_SLOTS=PROVIDERS.length;

  const names=()=>{try{return JSON.parse(localStorage.getItem(NAME_KEY)||'{}')}catch{return {}}};
  const setName=(provider,value)=>{try{const all=names();all[provider]=value;localStorage.setItem(NAME_KEY,JSON.stringify(all))}catch{}};
  const slots=()=>{const a=access();return a.isAdmin?MAX_SLOTS:Math.max(0,Math.min(MAX_SLOTS,Number(a.apiKeySlots)||0))};

  function styles(){
    if($('#settingsConnectionStyles'))return;
    const el=document.createElement('style');el.id='settingsConnectionStyles';el.textContent=`
      .conn-offer{padding:18px;border:1px solid color-mix(in srgb,var(--accent) 34%,var(--line));border-radius:16px;background:color-mix(in srgb,var(--accent) 5%,var(--surface))}
      .conn-offer span{display:block;color:var(--accent);font-size:9px;font-weight:900;letter-spacing:.12em}
      .conn-offer strong{display:block;margin-top:7px;font-size:17px}
      .conn-offer p{margin:8px 0 0;color:var(--muted);font-size:12px;line-height:1.55}
      .conn-offer-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:end;margin-top:15px}
      .conn-offer-actions .compact-field{margin:0}
      .conn-slot{margin-top:12px;padding:15px;border:1px solid var(--line);border-radius:15px;background:var(--surface)}
      .conn-slot-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,180px);gap:10px;align-items:end}
      .conn-slot-head .field{margin:0}
      .conn-slot-index{display:block;margin-bottom:9px;color:var(--muted);font-size:9px;font-weight:900;letter-spacing:.12em}
      .conn-slot .ai-connection-card{margin-top:12px;border:0!important;background:none!important;box-shadow:none!important;padding:0!important}
      .conn-slot .ai-connection-head>div>span,.conn-slot .ai-connection-head>div>strong{display:none!important}
      .conn-slot .ai-connection-head{justify-content:flex-end!important}
      .conn-empty-note{margin:12px 0 0;color:var(--muted);font-size:11px;line-height:1.5}
      .conn-model{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;margin-top:11px}
      .conn-model .field{margin:0}
      .conn-model small{grid-column:1/-1;margin-top:-2px;color:var(--muted);font-size:11px;line-height:1.45}
      .conn-active-row{display:flex;gap:10px;align-items:center;margin-top:11px;padding:10px 12px;border:1px solid var(--line);border-radius:11px;background:var(--paper)}
      .conn-active-row span{flex:1 1 auto;font-size:12px;line-height:1.45}
      .conn-active-row b{color:var(--accent);font-weight:800}
      /* One fold per key: five open forms below each other were impossible to scan. The summary
         carries the name the visitor gave the connection. */
      .conn-slot{padding:0!important;overflow:hidden}
      .conn-slot>summary{display:flex;align-items:center;gap:11px;padding:14px 15px;cursor:pointer;list-style:none}
      .conn-slot>summary::-webkit-details-marker{display:none}
      .conn-slot>summary strong{flex:1 1 auto;min-width:0;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .conn-slot>summary em{flex:0 0 auto;font-style:normal;font:700 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.09em;color:var(--muted)}
      .conn-slot>summary i{flex:0 0 auto;font-style:normal;font-size:17px;color:var(--muted);transition:transform .15s ease}
      .conn-slot[open]>summary i{transform:rotate(45deg)}
      .conn-slot[open]>summary{border-bottom:1px solid var(--line)}
      .conn-slot-body{padding:15px}
      .conn-dot{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:var(--line)}
      .conn-dot.is-on{background:var(--good,#2e9e6b)}
      .conn-purpose{margin-top:12px}
      .conn-purpose>span{display:block;margin-bottom:7px;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
      .conn-purpose label{display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;font-size:12.5px}
      .conn-purpose label+label{margin-top:6px}
      @media(max-width:700px){.conn-slot-head{grid-template-columns:1fr}.conn-offer-actions>*{flex:1 1 100%}}
    `;document.head.appendChild(el);
  }

  function cardFor(provider){
    const status=$(`#${CARD_ID[provider]}`);
    return status?status.closest('.ai-connection-card'):null;
  }
  function host(){
    let box=$('#connectionSlots');if(box)return box;
    const grid=$('#aiConnectionGrid');if(!grid)return null;
    box=document.createElement('div');box.id='connectionSlots';
    grid.insertAdjacentElement('beforebegin',box);
    grid.hidden=true;grid.style.display='none';
    return box;
  }

  function render(){
    styles();
    const box=host();if(!box)return;
    // Park every card back in the hidden grid BEFORE the container is rewritten: overwriting
    // innerHTML with a card still inside a mount deletes that card from the document for good.
    const park=$('#aiConnectionGrid');
    if(park)for(const [id] of PROVIDERS){const card=cardFor(id);if(card&&card.parentElement!==park)park.appendChild(card)}
    const count=slots(),saved=names(),assigned=[];
    const offer=count>=MAX_SLOTS?'':`<div class="conn-offer"><span>${count?'WEITERER PLATZ':'EIGENE KI-VERBINDUNG'}</span><strong>${count?'Noch einen Platz dazubuchen':'Platz für eine eigene KI – 5,99 € / Monat'}</strong><p>${count?`Du hast ${count} von ${MAX_SLOTS} Plätzen. Jeder weitere kostet 5,99 € im Monat. Aufrufe über eigene Verbindungen zählen nur halb aufs Kontingent.`:'Mit einem Platz hinterlegst du deinen eigenen API-Key, gibst der Verbindung einen Namen und wählst Anbieter, Modell und Version selbst. <b>Aufrufe über deine eigene Verbindung zählen nur halb aufs Monatskontingent</b> – zwei davon verbrauchen eine Einheit, deine Tokens gar nichts. Ohne Platz läuft alles über die zentralen Prompt.ai-KIs; dafür musst du nichts tun.'}</p><div class="conn-offer-actions"><label class="compact-field"><span>Plätze</span><select id="connSlotCount">${Array.from({length:MAX_SLOTS-count},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><button type="button" class="solid-btn" id="connBuyBtn">${count?'Platz dazubuchen':'Platz kaufen'}</button></div></div>`;
    const used=new Set();
    const slotHtml=Array.from({length:count},(_,index)=>{
      const provider=PROVIDERS.find(([id])=>saved[`slot${index}`]===id)?.[0]||PROVIDERS.find(([id])=>!used.has(id))?.[0]||PROVIDERS[0][0];
      used.add(provider);assigned.push({index,provider});
      const model=saved[`model${index}`]||'';
      const isActive=String(saved.active||'')===String(index);
      const title=String(saved[`name${index}`]||'').trim()||`API-Key ${index+1}`;
      const connected=Boolean(saved[`model${index}`]);
      const purposes=String(saved[`use${index}`]??'text,image,website').split(',').filter(Boolean);
      const purpose=(id,label,hint)=>`<label><input type="checkbox" data-conn-use="${index}" value="${id}" ${purposes.includes(id)?'checked':''} /><span><b>${esc(label)}</b> — ${esc(hint)}</span></label>`;
      return `<details class="conn-slot" data-conn-slot="${index}" ${isActive?'open':''}><summary><span class="conn-dot ${connected?'is-on':''}"></span><strong>${esc(title)}</strong><em>${isActive?'AKTIV':`PLATZ ${index+1}`}</em><i aria-hidden="true">+</i></summary><div class="conn-slot-body"><div class="conn-slot-head"><label class="field"><span>Name dieser Verbindung</span><input type="text" maxlength="60" data-conn-name="${index}" value="${esc(saved[`name${index}`]||'')}" placeholder="z. B. Mein OpenAI-Zugang" /></label><label class="field"><span>Anbieter</span><select data-conn-provider="${index}">${PROVIDERS.map(([id,label])=>`<option value="${id}" ${id===provider?'selected':''}>${esc(label)}</option>`).join('')}</select></label></div><div data-conn-mount="${index}"></div><div class="conn-model"><label class="field"><span>Modell und Version</span><input type="text" list="connModels${index}" maxlength="190" data-conn-model="${index}" value="${esc(model)}" placeholder="z. B. openai/gpt-5.4 oder claude-sonnet-4.5" /><datalist id="connModels${index}"></datalist></label><button type="button" class="outline-btn mini" data-conn-load="${index}">Modelle laden</button><small>Genau der Name, den dein Anbieter verwendet – inklusive Version. Prompt.ai schickt ihn unverändert weiter.</small></div><div class="conn-purpose"><span>Wofür diese Verbindung gilt</span>${purpose('text','Texte & Prompts','Briefing, Rückfragen, Master-Prompt')}${purpose('image','Bilder','Vorschauen und Bildaufträge')}${purpose('website','Website bauen','Der Probelauf aus dem Briefing')}</div><label class="conn-active-row"><input type="checkbox" data-conn-active="${index}" ${isActive?'checked':''} /><span>${isActive?'<b>Diese Verbindung wird für deine Projekte verwendet.</b>':'Für meine Projekte verwenden'}</span></label></div></details>`;
    }).join('');
    box.innerHTML=`${offer}${slotHtml}${count?'':'<p class="conn-empty-note">Ohne gebuchten Platz gibt es hier nichts einzutragen – Prompt.ai nutzt dann die zentralen Verbindungen.</p>'}`;
    // The real provider cards are moved into their slot, so their handlers keep working.
    for(const {index,provider} of assigned){
      const mount=$(`[data-conn-mount="${index}"]`,box),card=cardFor(provider);
      if(mount&&card)mount.appendChild(card);
    }
    // Whatever no slot uses simply stays in the hidden grid - never removed, so it can come back
    // when the visitor changes a slot's provider or buys another one.
  }

  function bind(){
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#connBuyBtn')){
        event.preventDefault();
        const wanted=Number($('#connSlotCount')?.value)||1,select=$('#apiAddonSlots');
        if(select){select.value=String(Math.min(4,Math.max(1,wanted)));select.dispatchEvent(new Event('change',{bubbles:true}))}
        $('#startApiAddonCheckoutBtn')?.click();
      }
    },true);
    document.addEventListener('input',event=>{
      const name=event.target.closest?.('[data-conn-name]');
      if(name){setName(`name${name.dataset.connName}`,name.value.trim());publish();return}
      const model=event.target.closest?.('[data-conn-model]');
      if(model){setName(`model${model.dataset.connModel}`,model.value.trim());publish()}
    },true);
    document.addEventListener('click',async event=>{
      const load=event.target.closest?.('[data-conn-load]');if(!load)return;
      event.preventDefault();
      const index=load.dataset.connLoad,provider=$(`[data-conn-provider="${index}"]`)?.value||'gateway';
      load.disabled=true;const original=load.textContent;load.textContent='Lädt…';
      try{
        const headers=await window.SiteBriefCloud?.authHeaders?.()||{};
        const response=await fetch(`/api/models?provider=${encodeURIComponent(provider)}`,{headers});
        const data=await response.json().catch(()=>({}));
        const list=Array.isArray(data.models)?data.models:[];
        const box=$(`#connModels${index}`);
        if(box)box.innerHTML=list.slice(0,400).map(id=>`<option value="${esc(id)}"></option>`).join('');
        load.textContent=list.length?`${list.length} Modelle`:'Keine Liste verfügbar';
      }catch{load.textContent='Liste nicht erreichbar'}
      setTimeout(()=>{load.disabled=false;load.textContent=original},2600);
    },true);
    document.addEventListener('change',event=>{
      const use=event.target.closest?.('[data-conn-use]');
      if(use){
        const index=use.dataset.connUse;
        const chosen=$$(`[data-conn-use="${index}"]`).filter(box=>box.checked).map(box=>box.value);
        setName(`use${index}`,chosen.join(','));publish();return;
      }
      const active=event.target.closest?.('[data-conn-active]');
      if(active){
        // Exactly one connection drives the projects, otherwise the order would be arbitrary.
        setName('active',active.checked?active.dataset.connActive:'');
        render();publish();return;
      }
      const picker=event.target.closest?.('[data-conn-provider]');
      if(!picker)return;
      setName(`slot${picker.dataset.connProvider}`,picker.value);
      render();publish();
    },true);
    window.addEventListener('promptai:access',render);
    const dialog=$('#settingsDialog');
    if(dialog)new MutationObserver(()=>{if(dialog.open)render()}).observe(dialog,{attributes:true,attributeFilter:['open']});
  }

  // GitHub publishing is an Ultimate feature - the note said "ab Pro", and the form was offered to
  // accounts that could never use it.
  function loginRow(){
    const row=$('#connectionLoginRow');if(!row)return;
    const signedIn=Boolean(window.SiteBriefCloud?.user?.id||window.PromptAiAccess?.plan&&window.PromptAiAccess.plan!=='free');
    row.hidden=Boolean(window.SiteBriefCloud?.user?.id)||signedIn;
  }
  function github(){
    const grid=$('#githubConnectionGrid'),row=$('#githubUpgradeRow');
    if(!grid||!row)return;
    const a=access(),allowed=a.isAdmin||a.plan==='ultimate';
    grid.hidden=!allowed;
    row.hidden=allowed;
    const text=$('span',row);
    if(text)text.textContent='Für die eigene GitHub-Verbindung ist ein Ultimate-Abo erforderlich.';
  }

  function init(){styles();render();github();loginRow();bind();publish();window.addEventListener('promptai:access',()=>{github();loginRow()});
    window.SiteBriefCloud?.subscribe?.(()=>{loginRow();render()});
    let n=0;const timer=setInterval(()=>{render();github();loginRow();if(++n>=10)clearInterval(timer)},400);
  }
  // What the request layer reads: provider, the exact model string and the label of the connection
  // the visitor marked as active - or null, which means "use the plan's AIs".
  function activeConnection(){
    const saved=names(),index=String(saved.active||'');
    if(!index||Number(index)>=slots())return null;
    const provider=saved[`slot${index}`]||PROVIDERS[Number(index)]?.[0]||'gateway';
    const model=String(saved[`model${index}`]||'').trim();
    if(!model)return null;
    const uses=String(saved[`use${index}`]??'text,image,website').split(',').filter(Boolean);
    return {provider,model,label:String(saved[`name${index}`]||'Eigene Verbindung'),uses};
  }
  function publish(){
    window.PromptAiOwnConnection=activeConnection();
    window.dispatchEvent(new CustomEvent('promptai:own-connection',{detail:window.PromptAiOwnConnection}));
  }
  window.PromptAiConnectionSlots={render,activeConnection};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

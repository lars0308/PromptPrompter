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
    const offer=count>=MAX_SLOTS?'':`<div class="conn-offer"><span>${count?'WEITERER PLATZ':'EIGENE KI-VERBINDUNG'}</span><strong>${count?'Noch einen Platz dazubuchen':'Platz für eine eigene KI – 5,99 € / Monat'}</strong><p>${count?`Du hast ${count} von ${MAX_SLOTS} Plätzen. Jeder weitere Platz kostet 5,99 € im Monat.`:'Mit einem Platz hinterlegst du deinen eigenen API-Key, gibst der Verbindung einen Namen und wählst selbst, welcher Anbieter dahintersteht. Ohne Platz läuft alles über die zentralen Prompt.ai-KIs – dafür musst du nichts tun.'}</p><div class="conn-offer-actions"><label class="compact-field"><span>Plätze</span><select id="connSlotCount">${Array.from({length:MAX_SLOTS-count},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><button type="button" class="solid-btn" id="connBuyBtn">${count?'Platz dazubuchen':'Platz kaufen'}</button></div></div>`;
    const used=new Set();
    const slotHtml=Array.from({length:count},(_,index)=>{
      const provider=PROVIDERS.find(([id])=>saved[`slot${index}`]===id)?.[0]||PROVIDERS.find(([id])=>!used.has(id))?.[0]||PROVIDERS[0][0];
      used.add(provider);assigned.push({index,provider});
      return `<div class="conn-slot" data-conn-slot="${index}"><span class="conn-slot-index">PLATZ ${index+1}</span><div class="conn-slot-head"><label class="field"><span>Name dieser Verbindung</span><input type="text" maxlength="60" data-conn-name="${index}" value="${esc(saved[`name${index}`]||'')}" placeholder="z. B. Mein OpenAI-Zugang" /></label><label class="field"><span>Anbieter</span><select data-conn-provider="${index}">${PROVIDERS.map(([id,label])=>`<option value="${id}" ${id===provider?'selected':''}>${esc(label)}</option>`).join('')}</select></label></div><div data-conn-mount="${index}"></div></div>`;
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
      if(name)setName(`name${name.dataset.connName}`,name.value.trim());
    },true);
    document.addEventListener('change',event=>{
      const picker=event.target.closest?.('[data-conn-provider]');
      if(!picker)return;
      setName(`slot${picker.dataset.connProvider}`,picker.value);
      render();
    },true);
    window.addEventListener('promptai:access',render);
    const dialog=$('#settingsDialog');
    if(dialog)new MutationObserver(()=>{if(dialog.open)render()}).observe(dialog,{attributes:true,attributeFilter:['open']});
  }

  // GitHub publishing is an Ultimate feature - the note said "ab Pro", and the form was offered to
  // accounts that could never use it.
  function github(){
    const grid=$('#githubConnectionGrid'),row=$('#githubUpgradeRow');
    if(!grid||!row)return;
    const a=access(),allowed=a.isAdmin||a.plan==='ultimate';
    grid.hidden=!allowed;
    row.hidden=allowed;
    const text=$('span',row);
    if(text)text.textContent='Für die eigene GitHub-Verbindung ist ein Ultimate-Abo erforderlich.';
  }

  function init(){styles();render();github();bind();window.addEventListener('promptai:access',github);
    let n=0;const timer=setInterval(()=>{render();github();if(++n>=10)clearInterval(timer)},400);
  }
  window.PromptAiConnectionSlots={render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

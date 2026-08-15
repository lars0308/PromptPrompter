(()=>{
  'use strict';
  // Editor for the master prompts. Every area keeps its built-in default in the code; saving here
  // creates a new version instead of overwriting, so a reworked prompt can sit next to the running
  // one and a bad wording is one click away from being rolled back.
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const date=v=>v?new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'';
  const state={defaults:[],templates:[],key:'',dirty:false};

  async function api(payload){
    const headers=await window.SiteBriefCloud?.authHeaders?.()||{};
    const response=await fetch('/api/admin-action',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Anfrage fehlgeschlagen.');
    return data;
  }
  function style(){
    if($('#adminPromptStyle'))return;
    const el=document.createElement('style');el.id='adminPromptStyle';el.textContent=`
      .admin-prompt-layout{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:20px;align-items:start}
      /* On a phone the eight areas would push the editor off the screen, so the picker is a fold
         that closes again as soon as an area is chosen. On a desktop it is simply the sidebar. */
      .admin-prompt-picker{border:0!important;background:none!important}
      .admin-prompt-picker>summary{display:none}
      .admin-prompt-picker .admin-fold-body{display:block!important;padding:0!important;border:0!important}
      .admin-prompt-list{display:grid;gap:6px}
      .admin-prompt-group{margin:12px 0 2px;color:var(--muted);font-size:10px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
      .admin-prompt-group:first-child{margin-top:0}
      .admin-prompt-list button{display:block;width:100%;padding:12px 13px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);text-align:left;cursor:pointer}
      .admin-prompt-list button.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,var(--surface))}
      .admin-prompt-list strong{display:block;font-size:12px}
      .admin-prompt-list small{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      .admin-prompt-list small.is-custom{color:var(--accent)}
      .admin-prompt-editor{min-width:0;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
      .admin-prompt-editor h4{margin:0;font-size:17px}
      .admin-prompt-editor .admin-prompt-hint{margin:6px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
      .admin-prompt-editor .admin-prompt-outdated{margin:12px 0 0;padding:10px 12px;border:1px solid color-mix(in srgb,var(--warn,#c8791f) 40%,var(--line));border-radius:10px;background:color-mix(in srgb,var(--warn,#c8791f) 8%,transparent);color:var(--ink);font-size:12px;line-height:1.5}
      .admin-prompt-editor .admin-prompt-outdated[hidden]{display:none}
      .admin-prompt-vars{margin:12px 0 0;padding:9px 11px;border:1px dashed var(--line);border-radius:10px;color:var(--muted);font-size:11px}
      .admin-prompt-vars code{font-size:11px}
      #adminPromptBody{width:100%;margin-top:12px;padding:13px;border:1px solid var(--line);border-radius:11px;background:var(--paper);color:var(--ink);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.6;resize:vertical}
      .admin-prompt-meta{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;margin-top:7px;color:var(--muted);font-size:11px}
      .admin-prompt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
      .admin-prompt-versions{display:grid;gap:8px}
      .admin-prompt-version{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 13px;border:1px solid var(--line);border-radius:11px}
      .admin-prompt-version.is-active{border-color:var(--accent)}
      .admin-prompt-version strong{display:block;font-size:12px}
      .admin-prompt-version small{display:block;margin-top:2px;color:var(--muted);font-size:11px}
      .admin-prompt-version-actions{display:flex;flex-wrap:wrap;gap:6px}
      .admin-prompt-message{min-height:20px;margin:12px 0 0;font-size:13px}
      .admin-prompt-message.good{color:var(--good)}.admin-prompt-message.error{color:var(--danger)}
      @media(max-width:820px){
        .admin-prompt-layout{grid-template-columns:1fr}
        .admin-prompt-picker{border:1px solid var(--line)!important;border-radius:12px;background:var(--surface)!important}
        .admin-prompt-picker>summary{display:flex}
        .admin-prompt-picker:not([open]) .admin-fold-body{display:none!important}
        .admin-prompt-picker .admin-fold-body{padding:0 12px 12px!important}
        .admin-prompt-editor{padding:14px}
        .admin-prompt-actions>*,.admin-prompt-version-actions>*{flex:1 1 auto}
        .admin-prompt-version{grid-template-columns:1fr}
      }
    `;document.head.appendChild(el);
  }
  function ensureUi(){
    const tabs=$('.admin-tabs'),body=$('.admin-body');if(!tabs||!body||$('[data-admin-tab="prompts"]'))return;
    style();
    const tab=document.createElement('button');tab.type='button';tab.dataset.adminTab='prompts';tab.textContent='Prompts';tabs.appendChild(tab);
    const pane=document.createElement('section');pane.className='admin-pane';pane.dataset.adminPane='prompts';
    pane.innerHTML=`
      <div class="admin-section-head"><div><span>MASTER-PROMPTS</span><h3>Aufträge an die KI</h3><p>Hier steht der Text, mit dem die KI arbeitet. Speichern legt immer eine neue Version an – die alte bleibt erhalten und lässt sich jederzeit wieder aktivieren. Datenblöcke, JSON-Vorgaben und Sicherheitsregeln bleiben fest im Code.</p></div></div>
      <div class="admin-prompt-layout">
        <details class="admin-fold admin-prompt-picker" id="adminPromptPicker"><summary><div><span>BEREICH</span><strong id="adminPromptCurrent">Bereich wählen</strong></div><i aria-hidden="true">+</i></summary><div class="admin-fold-body"><div class="admin-prompt-list" id="adminPromptList"></div></div></details>
        <div class="admin-prompt-editor" id="adminPromptEditor"></div>
      </div>
      <p class="admin-prompt-message" id="adminPromptMessage"></p>`;
    body.appendChild(pane);
    tab.addEventListener('click',()=>{
      $$('.admin-tabs button').forEach(x=>x.classList.toggle('active',x===tab));
      $$('.admin-pane').forEach(x=>x.classList.toggle('active',x===pane));
      render();
    });
    pane.addEventListener('click',onClick);
    pane.addEventListener('input',event=>{if(event.target.id==='adminPromptBody')state.dirty=true});
  }
  function msg(text='',kind=''){const el=$('#adminPromptMessage');if(el){el.textContent=text;el.className=`admin-prompt-message ${kind}`.trim()}}
  const defaultFor=key=>state.defaults.find(x=>x.key===key)||null;
  const versionsFor=key=>state.templates.filter(x=>x.prompt_key===key).sort((a,b)=>Number(b.version)-Number(a.version));
  const activeFor=key=>versionsFor(key).find(x=>x.active)||null;

  const WIDE=()=>window.innerWidth>820;
  function renderList(){
    const host=$('#adminPromptList'),picker=$('#adminPromptPicker'),current=$('#adminPromptCurrent');
    if(!host)return;
    if(picker)picker.open=WIDE()?true:picker.open;
    if(current)current.textContent=defaultFor(state.key)?.label||'Bereich wählen';
    // Two groups, otherwise 26 areas are one long undifferentiated list.
    const groups=[['Projekt & Website',state.defaults.filter(x=>!x.key.startsWith('freeprompt-'))],['Freier Prompt',state.defaults.filter(x=>x.key.startsWith('freeprompt-'))]];
    host.innerHTML=groups.filter(([,items])=>items.length).map(([title,items])=>`<p class="admin-prompt-group">${esc(title)}</p>`+items.map(item=>{
      const active=activeFor(item.key);
      const label=item.label.replace(/^Freier Prompt · /,'');
      return `<button type="button" data-prompt-key="${esc(item.key)}" class="${item.key===state.key?'active':''}"><strong>${esc(label)}</strong><small class="${active?'is-custom':''}">${active?`Version ${esc(active.version)}${active.label?` · ${esc(active.label)}`:''}`:'Standardtext'}</small></button>`;
    }).join('')).join('');
  }
  function renderEditor(){
    const host=$('#adminPromptEditor');if(!host)return;
    const item=defaultFor(state.key);
    if(!item){host.innerHTML='<p class="empty-state">Bitte links einen Bereich auswählen.</p>';return}
    const active=activeFor(item.key),versions=versionsFor(item.key);
    const placeholders=(item.placeholders||[]).map(name=>`<code>{{${esc(name)}}}</code>`).join(' ');
    host.innerHTML=`
      <h4>${esc(item.label)}</h4>
      <p class="admin-prompt-hint">${esc(item.hint||'')}</p>
      ${placeholders?`<p class="admin-prompt-vars">Platzhalter, die beim Erstellen ersetzt werden: ${placeholders}</p>`:''}
      <textarea id="adminPromptBody" rows="18" spellcheck="false"></textarea>
      <p class="admin-prompt-outdated" id="adminPromptOutdated" hidden></p>
      <div class="admin-prompt-meta"><span id="adminPromptState">${active?`Aktiv: Version ${esc(active.version)} · zuletzt geändert ${esc(date(active.updated_at))}`:'Aktiv: eingebauter Standardtext'}</span><span id="adminPromptCount"></span></div>
      <div class="admin-prompt-actions">
        <button type="button" class="solid-btn" data-prompt-action="save">Als neue Version speichern und aktivieren</button>
        <button type="button" class="outline-btn mini" data-prompt-action="draft">Nur speichern</button>
        <button type="button" class="outline-btn mini" data-prompt-action="load-default">Standardtext einsetzen</button>
        ${active?'<button type="button" class="text-btn" data-prompt-action="use-default">Wieder Standard verwenden</button>':''}
      </div>
      <details class="admin-fold" style="margin-top:16px"><summary><div><span>VERLAUF</span><strong>Gespeicherte Versionen</strong></div><em>${versions.length?`${versions.length} ${versions.length===1?'Version':'Versionen'}`:'leer'}</em><i aria-hidden="true">+</i></summary>
        <div class="admin-fold-body"><div class="admin-prompt-versions">${versions.map(row=>`
          <div class="admin-prompt-version ${row.active?'is-active':''}"><div><strong>Version ${esc(row.version)}${row.active?' · aktiv':''}</strong><small>${esc(row.label||'ohne Bezeichnung')} · ${esc(date(row.updated_at))}</small></div>
          <div class="admin-prompt-version-actions"><button type="button" class="outline-btn mini" data-prompt-action="open" data-id="${esc(row.id)}">Öffnen</button>${row.active?'':`<button type="button" class="outline-btn mini" data-prompt-action="activate" data-id="${esc(row.id)}">Aktivieren</button>`}<button type="button" class="text-btn danger" data-prompt-action="delete" data-id="${esc(row.id)}">Löschen</button></div></div>`).join('')||'<p class="empty-state">Noch keine eigene Version gespeichert.</p>'}</div></div>
      </details>`;
    const field=$('#adminPromptBody');
    field.value=state.pendingBody!==undefined?state.pendingBody:(active?state.bodies?.[active.id]??item.body:item.body);
    state.pendingBody=undefined;
    countChars();markOutdated();
    field.addEventListener('input',countChars);
    if(active&&!state.bodies?.[active.id])loadBody(active.id);
  }
  // Eine eigene Fassung gewinnt immer - auch dann, wenn der eingebaute Standardtext inzwischen
  // dazugelernt hat. Ohne diesen Hinweis merkt das niemand: der Bereich sieht gepflegt aus, und
  // die neue Regel greift trotzdem nicht.
  function markOutdated(){
    const host=$('#adminPromptOutdated'),item=defaultFor(state.key);if(!host||!item)return;
    const active=activeFor(item.key),stored=active?state.bodies?.[active.id]:undefined;
    const differs=Boolean(active)&&stored!==undefined&&String(stored).trim()!==String(item.body).trim();
    host.hidden=!differs;
    if(differs)host.textContent='Der eingebaute Standardtext wurde inzwischen geändert. Deine gespeicherte Version gilt weiter - mit „Standardtext einsetzen“ holst du die neue Fassung ins Feld und kannst sie speichern.';
  }
  function countChars(){const field=$('#adminPromptBody'),host=$('#adminPromptCount');if(field&&host)host.textContent=`${field.value.length.toLocaleString('de-DE')} Zeichen`}
  function render(){renderList();renderEditor()}

  async function loadBody(id){
    try{
      const {template}=await api({action:'prompt-load',id});
      state.bodies=state.bodies||{};state.bodies[id]=template?.body||'';markOutdated();
      const field=$('#adminPromptBody');
      if(field&&!state.dirty&&activeFor(state.key)?.id===id){field.value=state.bodies[id];countChars()}
    }catch(error){msg(error.message,'error')}
  }
  async function onClick(event){
    const pick=event.target.closest('[data-prompt-key]');
    if(pick){
      if(state.dirty&&!await window.PromptAiDialog.confirm('Der geänderte Text wurde nicht gespeichert. Bereich trotzdem wechseln?',{title:'Nicht gespeicherte Änderung',confirmLabel:'Wechseln',danger:true}))return;
      state.key=pick.dataset.promptKey;state.dirty=false;state.pendingBody=undefined;msg();
      const picker=$('#adminPromptPicker');if(picker&&!WIDE())picker.open=false;
      render();return;
    }
    const button=event.target.closest('[data-prompt-action]');if(!button)return;
    const action=button.dataset.promptAction,id=button.dataset.id,item=defaultFor(state.key);if(!item)return;
    try{
      if(action==='load-default'){state.pendingBody=item.body;state.dirty=true;renderEditor();msg('Standardtext eingesetzt. Zum Übernehmen speichern.');return}
      if(action==='open'){
        const {template}=await api({action:'prompt-load',id});
        state.bodies=state.bodies||{};state.bodies[id]=template?.body||'';
        state.pendingBody=template?.body||'';state.dirty=true;renderEditor();msg(`Version ${template?.version||''} geöffnet.`);return;
      }
      if(action==='save'||action==='draft'){
        const body=$('#adminPromptBody')?.value||'';
        const label=await window.PromptAiDialog.prompt('Wie soll diese Version heißen?','',{title:'Version benennen',inputLabel:'Bezeichnung',confirmLabel:'Speichern'});
        if(label===null)return;
        msg('Version wird gespeichert…');
        await api({action:'prompt-save',key:item.key,body,label,activate:action==='save'});
        state.dirty=false;
        msg(action==='save'?'Version gespeichert und aktiv.':'Version gespeichert. Sie ist noch nicht aktiv.','good');
        refresh();return;
      }
      if(action==='activate'){msg('Version wird aktiviert…');await api({action:'prompt-activate',key:item.key,id});state.dirty=false;msg('Version ist jetzt aktiv.','good');refresh();return}
      if(action==='use-default'){
        if(!await window.PromptAiDialog.confirm('Wieder den eingebauten Standardtext verwenden? Deine gespeicherten Versionen bleiben erhalten.',{title:'Standard verwenden',confirmLabel:'Standard verwenden'}))return;
        await api({action:'prompt-activate',key:item.key});state.dirty=false;msg('Es gilt wieder der Standardtext.','good');refresh();return;
      }
      if(action==='delete'){
        if(!await window.PromptAiDialog.confirm('Diese Version wirklich löschen?',{title:'Version löschen',confirmLabel:'Löschen',danger:true}))return;
        await api({action:'prompt-delete',id});msg('Version wurde gelöscht.','good');refresh();return;
      }
    }catch(error){msg(error.message,'error')}
  }
  // The admin console owns the data request; asking it to reload keeps a single source.
  function refresh(){$('#adminReloadBtn')?.click()}

  function accept(data){
    state.defaults=Array.isArray(data?.promptDefaults)?data.promptDefaults:state.defaults;
    state.templates=Array.isArray(data?.promptTemplates)?data.promptTemplates:[];
    state.bodies={};
    if(!state.key||!defaultFor(state.key))state.key=state.defaults[0]?.key||'';
    ensureUi();
    if($('[data-admin-pane="prompts"]')?.classList.contains('active'))render();else renderList();
  }
  window.addEventListener('promptai:admin-data',event=>accept(event.detail));
  if(window.PromptAiAdminData)accept(window.PromptAiAdminData);
})();

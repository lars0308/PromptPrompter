(()=>{
  'use strict';
  const ADMIN_EMAIL='service.battermann@gmx.de';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let availability=new Map(),probeRunning=false,lastZipBlob=null,zipPatchInstalled=false;

  function isOwner(){return String(window.SiteBriefCloud?.user?.email||'').trim().toLowerCase()===ADMIN_EMAIL}
  async function authHeaders(){try{return await window.SiteBriefCloud?.authHeaders?.()||{}}catch{return {}}}
  function installStyles(){
    if($('#generatorSelectionStyles'))return;const style=document.createElement('style');style.id='generatorSelectionStyles';style.textContent=`
      .website-ai-chooser{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end;margin:18px 0;padding:16px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--accent) 4%,var(--surface))}.website-ai-chooser .field{margin:0}.website-ai-chooser small{display:block;margin-top:7px;color:var(--muted);font-size:10px;line-height:1.45}.website-ai-admin{min-height:46px;white-space:nowrap}.generated-preview-btn{width:100%;margin-top:10px}.website-zip-explain{margin:12px 0 0;color:var(--muted);font-size:10px;line-height:1.5}
      @media(max-width:720px){.website-ai-chooser{grid-template-columns:1fr}.website-ai-admin{width:100%}}
    `;document.head.appendChild(style)
  }
  function providerLabel(id){return id==='gemini'?'Google Gemini':'Vercel AI Gateway'}
  function sourceLabel(source){return source==='account'?'eigene Verbindung':source==='system'?'Prompt.ai zentral':source==='server'?'Prompt.ai Server':'nicht verfügbar'}
  function setEngine(provider,model=''){
    const engine=$('#generatorEngine');if(!engine)return;
    if([...engine.options].some(o=>o.value===provider)){engine.value=provider;engine.dispatchEvent(new Event('change',{bubbles:true}))}
    const modelInput=$('#generatorModel');if(modelInput&&model){modelInput.value=model;modelInput.dispatchEvent(new Event('input',{bubbles:true}))}
  }
  async function probe(provider){
    try{
      const headers=await authHeaders(),response=await fetch(`/api/models?provider=${encodeURIComponent(provider)}`,{headers,cache:'no-store'}),data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'nicht verfügbar');
      return {ok:true,provider,source:data.source||'',defaultModel:data.defaultModel||'',models:Array.isArray(data.models)?data.models:[]};
    }catch(error){return {ok:false,provider,error:error.message||'nicht verfügbar',source:'none',defaultModel:'',models:[]}}
  }
  function renderChooser(){
    const card=$('.export-result-card');if(!card)return false;
    let chooser=$('#websiteAiChooser');if(!chooser){chooser=document.createElement('div');chooser.id='websiteAiChooser';chooser.className='website-ai-chooser';chooser.innerHTML=`<div><label class="field"><span>KI für die Website-Erstellung</span><select id="websiteAiProvider"><option value="">Verfügbarkeit wird geprüft…</option></select></label><small id="websiteAiStatus">Prompt.ai prüft die freigegebenen KI-Verbindungen.</small></div><button type="button" class="outline-btn website-ai-admin" id="websiteAiAdminBtn">Allgemeine KIs verwalten</button>`;const actions=card.querySelector('.client-result-actions');card.insertBefore(chooser,actions||null);$('#websiteAiProvider').addEventListener('change',()=>{const item=availability.get($('#websiteAiProvider').value);if(item?.ok){setEngine(item.provider,item.defaultModel);$('#websiteAiStatus').textContent=`${providerLabel(item.provider)} · ${sourceLabel(item.source)}${item.defaultModel?` · ${item.defaultModel}`:''}`}});$('#websiteAiAdminBtn').addEventListener('click',openAiAdmin)}
    const admin=$('#websiteAiAdminBtn');if(admin)admin.hidden=!isOwner();
    const select=$('#websiteAiProvider'),status=$('#websiteAiStatus');if(!select||!status)return true;
    const good=[...availability.values()].filter(x=>x.ok);
    if(!good.length){select.innerHTML='<option value="">Keine Erstellungs-KI aktiv</option>';select.disabled=true;status.textContent=isOwner()?'Noch keine für die Erstellung erreichbare KI. Öffne „Allgemeine KIs verwalten“ und aktiviere dort mindestens Gateway oder Gemini.':'Prompt.ai hat aktuell keine zentrale Erstellungs-KI aktiviert.';return true}
    const current=$('#generatorEngine')?.value||'',preferred=good.find(x=>x.provider===current)||good.find(x=>x.source==='system')||good[0];
    select.disabled=false;select.innerHTML=good.map(x=>`<option value="${x.provider}">${providerLabel(x.provider)} · ${sourceLabel(x.source)}</option>`).join('');select.value=preferred.provider;setEngine(preferred.provider,preferred.defaultModel);status.textContent=`${providerLabel(preferred.provider)} ist bereit · ${sourceLabel(preferred.source)}${preferred.defaultModel?` · ${preferred.defaultModel}`:''}`;
    return true;
  }
  async function probeAll(){
    if(probeRunning)return;probeRunning=true;renderChooser();
    const results=await Promise.all(['gateway','gemini'].map(probe));availability=new Map(results.map(x=>[x.provider,x]));probeRunning=false;renderChooser();
  }
  function openAiAdmin(){
    $('#adminBtn')?.click();setTimeout(()=>{const tab=$('[data-admin-tab="ai"]');if(tab)tab.click()},180)
  }
  function patchZipCapture(){
    if(zipPatchInstalled)return;zipPatchInstalled=true;const native=URL.createObjectURL.bind(URL);URL.createObjectURL=function(value){if(value instanceof Blob&&value.type==='application/zip'){lastZipBlob=value;window.dispatchEvent(new CustomEvent('promptai:zip-ready'))}return native(value)};
  }
  function ensureZipExplanation(){
    const card=$('.export-result-card');if(!card)return;
    if(!$('#websiteZipExplain')){const p=document.createElement('p');p.id='websiteZipExplain';p.className='website-zip-explain';p.textContent='Nach der KI-Erstellung erzeugt Prompt.ai automatisch ein vollständiges ZIP. Dieses ZIP kannst du herunterladen oder direkt an die Projekt-Vorschau übergeben.';const status=$('#websiteBuildStatus');card.insertBefore(p,status||null)}
    const download=$('#downloadGeneratedWebsiteBtn');if(download)download.textContent='Erstellte Website als ZIP herunterladen';
    if(!$('#openGeneratedProjectPreviewBtn')){const btn=document.createElement('button');btn.type='button';btn.id='openGeneratedProjectPreviewBtn';btn.className='outline-btn generated-preview-btn';btn.textContent='Erstelltes Projekt direkt prüfen';btn.hidden=true;download?.insertAdjacentElement('afterend',btn);btn.addEventListener('click',handoffGeneratedZip)}
  }
  function watchGeneratedPackage(){
    const download=$('#downloadGeneratedWebsiteBtn'),direct=$('#openGeneratedProjectPreviewBtn');if(!download||!direct)return;direct.hidden=download.hidden;
    new MutationObserver(()=>{direct.hidden=download.hidden}).observe(download,{attributes:true,attributeFilter:['hidden']});
  }
  async function handoffGeneratedZip(){
    const download=$('#downloadGeneratedWebsiteBtn');if(!download||download.hidden)return;
    lastZipBlob=null;download.click();
    const start=Date.now();while(!lastZipBlob&&Date.now()-start<1800)await new Promise(r=>setTimeout(r,60));
    if(!lastZipBlob){$('#websiteBuildStatus').textContent='Das ZIP konnte noch nicht an die Vorschau übergeben werden. Bitte einmal „ZIP herunterladen“ verwenden.';return}
    const name=(`${$('#projectName')?.value?.trim()||'prompt-ai-projekt'}-komplett.zip`).replace(/[^a-zA-Z0-9._-]+/g,'-');const file=new File([lastZipBlob],name,{type:'application/zip'});
    const openPreview=$('#workspacePreviewBtn');if(openPreview)openPreview.click();else{document.querySelector('#projectPreviewDialog')?.showModal?.()}
    setTimeout(()=>{
      const sandbox=$('#sandboxProjectZip');if(sandbox){const dt=new DataTransfer();dt.items.add(file);sandbox.files=dt.files;sandbox.dispatchEvent(new Event('change',{bubbles:true}));$('#sandboxPreviewStatus').textContent='Das von Prompt.ai erzeugte ZIP wurde übernommen. Klicke auf „In Sandbox bauen“, um die echte Anwendung zu starten.'}
      const local=$('#outcomeProjectFiles');if(local){const dt2=new DataTransfer();dt2.items.add(file);local.files=dt2.files;local.dispatchEvent(new Event('change',{bubbles:true}))}
    },180)
  }
  function ensureEngineBeforeBuild(){
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('#buildWebsiteBtn');if(!button)return;
      const select=$('#websiteAiProvider'),item=availability.get(select?.value||'');if(item?.ok)setEngine(item.provider,item.defaultModel);
    },true)
  }
  function cleanLegacyStatus(){
    const status=$('#websiteBuildStatus');if(status&&/Wähle im Projekt zuerst eine verbundene KI/i.test(status.textContent||'')){const item=availability.get($('#websiteAiProvider')?.value||'');status.textContent=item?.ok?'':'Keine KI für die Website-Erstellung verfügbar.'}
  }
  function settle(){installStyles();renderChooser();ensureZipExplanation();cleanLegacyStatus()}
  function init(){patchZipCapture();settle();watchGeneratedPackage();ensureEngineBeforeBuild();probeAll();let n=0;const timer=setInterval(()=>{settle();if(++n>=20)clearInterval(timer)},400);window.addEventListener('promptai:access',()=>{settle();probeAll()});window.SiteBriefCloud?.subscribe?.((event)=>{if(event==='auth'){settle();probeAll()}})}
  installStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

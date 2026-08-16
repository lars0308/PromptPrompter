(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let sandboxResult=null,uploadedPath='';

  function access(){return window.PromptAiAccess||{plan:'free',isAdmin:false}}
  function canBuild(){return ['pro','ultimate'].includes(access().plan)}
  function safeName(name='project.zip'){return String(name).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(-100)||'project.zip'}
  function authHeaders(){return window.SiteBriefCloud?.authHeaders?.()||Promise.resolve({})}
  function setStatus(text,kind=''){
    const el=$('#sandboxPreviewStatus');if(!el)return;el.textContent=text;el.className=`sandbox-preview-status ${kind}`.trim();
  }
  function setBusy(busy){
    const button=$('#sandboxBuildBtn'),input=$('#sandboxProjectZip');if(button)button.disabled=busy||!canBuild();if(input)input.disabled=busy;
    $('#sandboxBuildProgress')?.classList.toggle('running',busy);
  }
  async function removeUpload(){
    if(!uploadedPath||!window.SiteBriefCloud?.client)return;
    const path=uploadedPath;uploadedPath='';
    try{await window.SiteBriefCloud.client.storage.from('sitebrief-references').remove([path])}catch{}
  }
  async function uploadArchive(file){
    const cloud=window.SiteBriefCloud,user=cloud?.user;if(!cloud?.client||!user)throw new Error('Bitte zuerst bei Prompt.ai anmelden.');
    const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path=`${user.id}/sandbox-builds/${Date.now()}-${id}-${safeName(file.name)}`;
    const {error}=await cloud.client.storage.from('sitebrief-references').upload(path,file,{contentType:'application/zip',upsert:false,cacheControl:'0'});
    if(error)throw error;uploadedPath=path;return path;
  }
  function showPreview(data,file){
    sandboxResult={...data,fileName:file.name};
    const frame=$('#outcomePreviewFrame'),wrap=$('#outcomeFrameWrap'),learning=$('#outcomeLearning');
    if(frame){frame.removeAttribute('srcdoc');frame.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin');frame.src=data.previewUrl}
    wrap?.classList.add('ready');learning?.classList.add('ready');
    const open=$('#sandboxOpenBtn');if(open){open.hidden=false;open.onclick=()=>window.open(data.previewUrl,'_blank','noopener,noreferrer')}
    const details=$('#sandboxBuildDetails');if(details){
      const expires=data.expiresAt?new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date(data.expiresAt)):'';
      details.hidden=false;details.innerHTML=`<span>${String(data.framework||'Projekt').toUpperCase()}</span><strong>${data.projectName||file.name}</strong><small>HTTP ${Number(data.httpStatus)||200}${expires?` · Vorschau aktiv bis ca. ${expires} Uhr`:''}</small>`;
    }
  }
  async function buildSandbox(){
    const input=$('#sandboxProjectZip'),file=input?.files?.[0];
    if(!canBuild()){$('#plansDialog')?.showModal();setStatus('Die isolierte Quellcode-Vorschau ist ab Pro verfügbar.','error');return}
    if(!window.SiteBriefCloud?.user){$('#accountBtn')?.click();setStatus('Zum sicheren Bauen eines Quellprojekts bitte zuerst anmelden.','error');return}
    if(!file){setStatus('Bitte zuerst ein Projekt als ZIP auswählen.','error');return}
    if(!/\.zip$/i.test(file.name)){setStatus('Für den Sandbox-Build wird ein ZIP mit package.json benötigt.','error');return}
    if(file.size>24*1024*1024){setStatus('Das Projekt-ZIP darf höchstens 24 MB groß sein. node_modules, .next und dist bitte nicht mit hochladen.','error');return}
    sandboxResult=null;setBusy(true);$('#sandboxBuildDetails').hidden=true;$('#sandboxOpenBtn').hidden=true;
    try{
      setStatus('Projekt wird verschlüsselt in deinen privaten Uploadbereich übertragen…');
      const storagePath=await uploadArchive(file);
      setStatus('Vercel Sandbox startet. Abhängigkeiten werden installiert und das Projekt wird gebaut…');
      const headers=await authHeaders(),response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({action:'sandbox-build',storagePath})}),data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Sandbox-Build fehlgeschlagen.');
      showPreview(data,file);setStatus('Build erfolgreich. Die echte Anwendung läuft jetzt isoliert in der Live-Vorschau.','good');
    }catch(error){
      setStatus(error?.message||'Das Quellprojekt konnte nicht gebaut werden.','error');
      const frame=$('#outcomePreviewFrame');if(frame){frame.removeAttribute('src');frame.srcdoc=''}$('#outcomeFrameWrap')?.classList.remove('ready');
    }finally{await removeUpload();setBusy(false)}
  }
  async function sendSandboxLearning(event){
    if(!sandboxResult)return;
    event.preventDefault();event.stopImmediatePropagation();
    const status=$('#outcomePreviewStatus'),consent=$('#outcomeLearningConsent')?.checked,rating=Number($('#outcomeRating')?.value)||0;
    if(!consent){status.className='outcome-preview-status error';status.textContent='Bitte die freiwillige Lernfreigabe aktivieren oder die Vorschau einfach ohne Auswertung nutzen.';return}
    if(!rating){status.className='outcome-preview-status error';status.textContent='Bitte das Ergebnis zuerst mit 1 bis 5 bewerten.';return}
    const button=$('#outcomeLearnBtn');button.disabled=true;status.className='outcome-preview-status';status.textContent='Master-Prompt und Sandbox-Ergebnis werden einmalig verglichen…';
    try{
      const headers=await authHeaders(),payload={action:'learning-feedback',consent:true,rating,project:{type:$('#projectType')?.value||'',goal:$('#projectGoal')?.value||''},finalPrompt:$('#masterPrompt')?.value||'',outcome:{fileNames:sandboxResult.archiveFiles||[sandboxResult.fileName],html:sandboxResult.analysisSample||'',css:'',notes:$('#outcomeLearningNotes')?.value||''}},response=await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)}),data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Auswertung nicht möglich.');
      status.className='outcome-preview-status good';status.textContent='Danke. Prompt.ai hat Prompt und echtes Build-Ergebnis verglichen; gespeichert werden nur abstrahierte Lernhinweise.';
      const result=$('#outcomeLearningResult');if(result){result.textContent=data.summary||'Lernhinweis gespeichert.';result.classList.add('show')}
      // Mit Anmeldung abfragen: /api/config liefert die Lernhinweise nur noch an angemeldete
      // Nutzer, oeffentlich bleibt die Liste leer.
      try{const config=await fetch('/api/config',{cache:'no-store',headers}).then(r=>r.json());if(window.SiteBriefCloud?.config)window.SiteBriefCloud.config.learningHints=config.learningHints||[]}catch{}
    }catch(error){status.className='outcome-preview-status error';status.textContent=error?.message||'Auswertung nicht möglich.'}finally{button.disabled=false}
  }
  function injectStyles(){
    if($('#sandboxPreviewStyles'))return;const style=document.createElement('style');style.id='sandboxPreviewStyles';style.textContent=`
      .sandbox-preview-card{margin:14px 0 18px;padding:16px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--surface) 88%,var(--accent) 4%)}
      .sandbox-preview-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:13px}.sandbox-preview-head span{display:block;font-size:9px;font-weight:850;letter-spacing:.12em;color:var(--accent)}.sandbox-preview-head strong{display:block;margin-top:4px;font-size:14px}.sandbox-preview-head small{display:block;margin-top:4px;color:var(--muted);font-size:9px;line-height:1.45;max-width:62ch}
      .sandbox-preview-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.sandbox-preview-controls .field{margin:0}.sandbox-preview-actions{display:flex;gap:8px;flex-wrap:wrap}
      .sandbox-preview-status{min-height:18px;margin:10px 0 0;font-size:9px;line-height:1.5;color:var(--muted);white-space:pre-wrap}.sandbox-preview-status.good{color:var(--good)}.sandbox-preview-status.error{color:var(--danger)}
      .sandbox-build-progress{height:3px;margin-top:10px;border-radius:999px;overflow:hidden;background:var(--line);opacity:0;transition:opacity .2s}.sandbox-build-progress.running{opacity:1}.sandbox-build-progress i{display:block;width:36%;height:100%;background:var(--accent);transform:translateX(-110%)}.sandbox-build-progress.running i{animation:sandboxProgress 1.25s ease-in-out infinite}@keyframes sandboxProgress{50%{transform:translateX(180%)}100%{transform:translateX(340%)}}
      .sandbox-build-details{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px 12px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}.sandbox-build-details span{font-size:8px;font-weight:850;letter-spacing:.1em;color:var(--accent)}.sandbox-build-details strong{font-size:10px}.sandbox-build-details small{font-size:8px;color:var(--muted)}
      @media(max-width:720px){.sandbox-preview-head{display:block}.sandbox-preview-controls{grid-template-columns:1fr}.sandbox-preview-actions>*{flex:1 1 160px}.sandbox-build-details{grid-template-columns:1fr}.sandbox-build-details small{grid-column:1}}
    `;document.head.appendChild(style);
  }
  function enhance(){
    const lab=$('#outcomeLab');if(!lab||$('#sandboxPreviewCard'))return false;
    injectStyles();
    const card=document.createElement('section');card.id='sandboxPreviewCard';card.className='sandbox-preview-card';card.innerHTML=`<div class="sandbox-preview-head"><div><span>QUELLCODE · VERCEL SANDBOX</span><strong>Next.js, React, Vite oder Astro wirklich bauen</strong><small>Für Quellprojekte mit package.json. Prompt.ai lädt das ZIP kurz in deinen privaten Speicher, baut es in einer isolierten MicroVM und löscht den Upload danach wieder. API-Keys, .env-Dateien und private Schlüssel gehören nicht ins ZIP.</small></div></div><div class="sandbox-preview-controls"><label class="field"><span>Quellprojekt als ZIP · max. 24 MB</span><input id="sandboxProjectZip" type="file" accept=".zip,application/zip,application/x-zip-compressed"></label><div class="sandbox-preview-actions"><button type="button" class="solid-btn" id="sandboxBuildBtn">In Sandbox bauen</button><button type="button" class="outline-btn" id="sandboxOpenBtn" hidden>Vorschau in neuem Tab</button></div></div><p id="sandboxPreviewStatus" class="sandbox-preview-status">${canBuild()?'Bereit für einen isolierten Quellcode-Build.':'Ab Pro verfügbar.'}</p><div id="sandboxBuildProgress" class="sandbox-build-progress" aria-hidden="true"><i></i></div><div id="sandboxBuildDetails" class="sandbox-build-details" hidden></div>`;
    const upload=lab.querySelector('.outcome-upload');lab.insertBefore(card,upload||lab.firstChild?.nextSibling||null);
    $('#sandboxBuildBtn').disabled=!canBuild();$('#sandboxBuildBtn').addEventListener('click',buildSandbox);
    $('#outcomeLearnBtn')?.addEventListener('click',sendSandboxLearning,true);
    $('#outcomeProjectFiles')?.addEventListener('change',()=>{sandboxResult=null;$('#sandboxOpenBtn').hidden=true},true);
    $('#outcomeClearBtn')?.addEventListener('click',()=>{sandboxResult=null;$('#sandboxOpenBtn').hidden=true;$('#sandboxBuildDetails').hidden=true;setStatus(canBuild()?'Bereit für einen isolierten Quellcode-Build.':'Ab Pro verfügbar.')});
    window.addEventListener('promptai:access',()=>{const button=$('#sandboxBuildBtn');if(button)button.disabled=!canBuild();if(!sandboxResult)setStatus(canBuild()?'Bereit für einen isolierten Quellcode-Build.':'Ab Pro verfügbar.')});
    return true;
  }
  function init(){
    if(enhance())return;
    const observer=new MutationObserver(()=>{if(enhance())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

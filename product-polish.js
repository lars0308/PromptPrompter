(()=>{
  'use strict';
  const ONBOARDING_KEY='prompt-ai-welcome-seen-v1';
  const LEARNING_MARK='## PROMPT.AI ERFAHRUNGSSIGNALE';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let lastOutcome=null,objectUrls=[],thanksShown=false;

  function injectStyles(){
    if($('#promptProductPolishStyles'))return;
    const style=document.createElement('style');style.id='promptProductPolishStyles';style.textContent=`
      body>#welcomeIntroDialog.welcome-intro-dialog.splash-only{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#fff!important;overflow:hidden!important}
      body>#welcomeIntroDialog.welcome-intro-dialog.splash-only::backdrop{background:#fff!important;backdrop-filter:none!important}
      body>#welcomeIntroDialog.welcome-intro-dialog.splash-only .dialog-frame{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;overflow:hidden!important}
      body>#welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-body{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;padding:0!important;margin:0!important;display:block!important;background:#fff!important}
      body>#welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-body>:not(.welcome-intro-video){display:none!important}
      body>#welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;object-fit:cover!important;object-position:center!important;margin:0!important;border:0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important}
      body>#welcomeIntroDialog.welcome-intro-dialog.splash-only .intro-close{display:grid!important;place-items:center!important;position:fixed!important;z-index:5!important;top:max(18px,env(safe-area-inset-top))!important;right:max(18px,env(safe-area-inset-right))!important;width:48px!important;height:48px!important;border-radius:50%!important;background:rgba(20,22,19,.72)!important;color:#fff!important;backdrop-filter:blur(12px)!important}
      .outcome-lab{margin:28px 0 0;padding:22px;border:1px solid var(--glass-line,var(--line));border-radius:18px;background:var(--glass,var(--surface));box-shadow:var(--frost-shadow,var(--shadow));color:var(--ink)}
      .outcome-lab-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.outcome-lab-head span{display:block;font-size:9px;font-weight:850;letter-spacing:.12em;color:var(--accent)}.outcome-lab-head h2{margin:5px 0 6px;font-size:24px;letter-spacing:-.03em}.outcome-lab-head p{margin:0;color:var(--muted);font-size:10px;line-height:1.55;max-width:62ch}
      .outcome-upload{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end}.outcome-upload .field{margin:0}.outcome-preview-status{min-height:20px;margin:10px 0;color:var(--muted);font-size:10px;line-height:1.5}.outcome-preview-status.error{color:var(--danger)}.outcome-preview-status.good{color:var(--good)}
      .outcome-frame-wrap{display:none;margin-top:14px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--surface-soft);aspect-ratio:16/10}.outcome-frame-wrap.ready{display:block}.outcome-frame-wrap iframe{display:block;width:100%;height:100%;border:0;background:#fff}
      .outcome-learning{display:none;margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}.outcome-learning.ready{display:block}.outcome-learning .check-row{margin-bottom:14px}.outcome-learning-grid{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px}.outcome-learning .field{margin-bottom:12px}.outcome-learning-note{font-size:9px;line-height:1.5;color:var(--muted);margin:8px 0 14px}.outcome-learning-result{display:none;margin-top:14px;padding:13px 14px;border:1px solid color-mix(in srgb,var(--good) 38%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--good) 8%,var(--surface));font-size:10px;line-height:1.55}.outcome-learning-result.show{display:block}
      .system-ai-note{margin:10px 0 0;color:var(--muted);font-size:9px;line-height:1.5}
      @media(max-width:720px){body>#welcomeIntroDialog.welcome-intro-dialog.splash-only .welcome-intro-video{object-fit:cover!important;transform:scale(1.06)}.outcome-lab{padding:17px;margin-left:-2px;margin-right:-2px}.outcome-lab-head{display:block}.outcome-upload,.outcome-learning-grid{grid-template-columns:1fr}.outcome-frame-wrap{aspect-ratio:9/13}.outcome-frame-wrap iframe{min-height:620px}}
    `;document.head.appendChild(style);
  }

  function primeIntro(){
    const intro=$('#welcomeIntroDialog');if(!intro)return;
    const sync=()=>intro.classList.toggle('splash-only',localStorage.getItem(ONBOARDING_KEY)==='1');sync();
    new MutationObserver(()=>{if(intro.open)sync()}).observe(intro,{attributes:true,attributeFilter:['open']});
  }

  function access(){return window.PromptAiAccess||{plan:'free',ownApiKeys:false,isAdmin:false,hasPersonalAi:false}}
  function setDisabled(root,disabled){if(!root)return;$$('input,textarea,select,button',root).forEach(el=>el.disabled=disabled)}
  function enforceAccessUi(){
    const a=access(),pro=['pro','ultimate'].includes(a.plan),ultimate=a.plan==='ultimate';
    const proBlock=$('#quickRevisionProBlock'),ultimateBlock=$('#quickRevisionUltimateBlock'),upgrade=$('#quickRevisionUpgradeNote');
    if(proBlock){proBlock.hidden=!pro;if(!pro)proBlock.open=false;setDisabled(proBlock,!pro)}
    if(ultimateBlock){ultimateBlock.hidden=!ultimate;if(!ultimate)ultimateBlock.open=false;setDisabled(ultimateBlock,!ultimate)}
    if(upgrade)upgrade.hidden=pro;
    const addon=$('#apiAddonCard');if(addon)addon.hidden=a.plan!=='pro'||a.ownApiKeys;
    const grid=$('#aiConnectionGrid');if(grid)grid.hidden=!a.ownApiKeys;
    const row=$('#connectionUpgradeRow');if(row){
      row.hidden=!window.SiteBriefCloud?.user||a.ownApiKeys||a.plan==='ultimate';
      if(!row.hidden){
        row.innerHTML=a.plan==='pro'?'<span>Eigene KI-Verbindungen sind optional. Standardmäßig nutzt du die zentralen Prompt.ai-KIs. Mit dem Pro-Add-on kannst du eigene API-Keys verwenden.</span><button type="button" class="outline-btn mini" id="personalAiAddonBtn">Add-on buchen</button>':'<span>Prompt.ai nutzt die zentral verwalteten KIs automatisch. Eigene API-Keys gibt es in Ultimate oder in Pro mit dem optionalen Add-on.</span><button type="button" class="outline-btn mini" id="personalAiPlansBtn">Tarife ansehen</button>';
      }
    }
    const title=$('#currentPlanTitle');if(title&&a.isAdmin&&a.plan==='free')title.textContent='Kostenloser Tarif · Admin';
    cleanTechnicalWarnings();syncCentralEngine();
  }

  function centralRoute(){
    const rows=window.SiteBriefCloud?.config?.systemAiRoutes||[];return rows.find(x=>x.routeRole==='primary'&&['gateway','openai','gemini'].includes(x.provider))||rows.find(x=>['gateway','openai','gemini'].includes(x.provider))||null;
  }
  function syncCentralEngine(){
    const a=access(),route=centralRoute(),engine=$('#generatorEngine'),model=$('#generatorModel');if(!route||!engine||a.plan==='free')return;
    if(engine.value==='local'&&[...engine.options].some(o=>o.value===route.provider)){engine.value=route.provider;engine.dispatchEvent(new Event('change',{bubbles:true}))}
    if(route.defaultModel&&model&&!model.value.trim()){model.value=route.defaultModel;model.dispatchEvent(new Event('input',{bubbles:true}))}
  }
  function cleanTechnicalWarnings(){
    const a=access();if(a.hasPersonalAi)return;
    const status=$('#generationStatus');if(status&&/Einstellungen\s*→\s*KI-Verbindungen|API-Key verbunden|muss .* verbunden sein/i.test(status.textContent||'')){status.className='generation-status';status.textContent='Prompt.ai nutzt die zentral hinterlegte Vorschau-KI automatisch. Falls ein Bildmodell gerade nicht verfügbar ist, bleiben die HTML-Vorschauen vollständig nutzbar.'}
    const help=$('#engineHelp');if(help&&/API|verbunden|Key/i.test(help.textContent||''))help.textContent='Prompt.ai verwendet standardmäßig die zentral verwaltete KI. Eigene Verbindungen werden nur genutzt, wenn dein Tarif sie erlaubt und du sie bewusst auswählst.';
  }

  function rememberCheckout(){const p=new URLSearchParams(location.search);if(p.get('checkout')==='success'&&['pro','ultimate'].includes(p.get('product')||''))sessionStorage.setItem('prompt-ai-purchase-thanks',p.get('product'))}
  async function maybeShowThanks(){
    if(thanksShown)return;const product=sessionStorage.getItem('prompt-ai-purchase-thanks');if(!product)return;const a=access(),ready=product==='ultimate'?a.plan==='ultimate':['pro','ultimate'].includes(a.plan);if(!ready||!window.PromptAiDialog?.alert)return;
    thanksShown=true;sessionStorage.removeItem('prompt-ai-purchase-thanks');
    const text=product==='ultimate'?'Danke für dein Upgrade auf Ultimate. Ab jetzt stehen dir der Expertenmodus, alle Ziel-Agenten, fünf Richtungen, eigene KI-Verbindungen ohne Zusatzkosten und die GitHub-Veröffentlichung zur Verfügung. Die zentralen Prompt.ai-KIs bleiben weiterhin der sichere Standard, bis du bewusst eine eigene Verbindung auswählst.':'Danke für dein Upgrade auf Pro. Ab jetzt kannst du Auto nutzen, mit Claude Code oder Codex arbeiten, Module und Skills einbinden, vier Richtungen erzeugen sowie Kundenunterlagen und Website-Pakete erstellen. Eigene API-Keys bleiben optional und können als Pro-Add-on freigeschaltet werden.';
    setTimeout(()=>window.PromptAiDialog.alert(text,{title:product==='ultimate'?'Ultimate ist aktiv':'Pro ist aktiv',kicker:'DANKE',confirmLabel:'Loslegen'}),500);
  }

  function normalizePath(path=''){const parts=[];for(const p of String(path).replace(/\\/g,'/').split('/')){if(!p||p==='.')continue;if(p==='..'){parts.pop();continue}parts.push(p)}return parts.join('/')}
  function dir(path=''){const p=normalizePath(path),i=p.lastIndexOf('/');return i<0?'':p.slice(0,i)}
  function ext(path=''){const m=String(path).toLowerCase().match(/\.([a-z0-9]+)$/);return m?.[1]||''}
  function isText(path){return ['html','htm','css','js','mjs','cjs','json','txt','md','svg','xml','map'].includes(ext(path))}
  function mime(path){return ({html:'text/html',htm:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',cjs:'text/javascript',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',ico:'image/x-icon',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf'})[ext(path)]||'application/octet-stream'}
  function clearUrls(){objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls=[]}
  function blobUrl(content,type){const url=URL.createObjectURL(new Blob([content],{type}));objectUrls.push(url);return url}
  function findPath(files,path){if(files.has(path))return path;const low=path.toLowerCase();for(const key of files.keys())if(key.toLowerCase()===low)return key;return ''}
  function localTarget(files,current,target,root){
    const raw=String(target||'').trim();if(!raw||/^(?:[a-z]+:|#|\/\/)/i.test(raw))return '';
    const clean=raw.split(/[?#]/)[0];let candidate=clean.startsWith('/')?normalizePath(`${root}/${clean.slice(1)}`):normalizePath(`${dir(current)}/${clean}`);let found=findPath(files,candidate);if(found)return found;
    candidate=normalizePath(`${root}/${clean}`);found=findPath(files,candidate);return found||'';
  }
  function rewriteCss(text,path,root,files,urls){return String(text).replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi,(m,q,target)=>{const p=localTarget(files,path,target,root),url=p?urls.get(p):'';return url?`url("${url}")`:m}).replace(/@import\s+(['"])([^'"]+)\1/gi,(m,q,target)=>{const p=localTarget(files,path,target,root),url=p?urls.get(p):'';return url?`@import "${url}"`:m})}
  function rewriteJs(text,path,root,files,urls){
    const swap=target=>{const p=localTarget(files,path,target,root),url=p?urls.get(p):'';return url||target};let out=String(text);
    out=out.replace(/(\bfrom\s*['"])([^'"]+)(['"])/g,(m,a,t,z)=>`${a}${swap(t)}${z}`);
    out=out.replace(/(\bimport\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,(m,a,t,z)=>`${a}${swap(t)}${z}`);
    out=out.replace(/(\bimport\s*['"])([^'"]+)(['"])/g,(m,a,t,z)=>`${a}${swap(t)}${z}`);
    out=out.replace(/(\bexport\s+[^;]*?\sfrom\s*['"])([^'"]+)(['"])/g,(m,a,t,z)=>`${a}${swap(t)}${z}`);
    return out;
  }
  function rewriteHtml(text,path,root,files,urls){
    let html=String(text).replace(/<base\b[^>]*>/gi,'');
    html=html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,(m,a,css,z)=>`${a}${rewriteCss(css,path,root,files,urls)}${z}`);
    html=html.replace(/\b(src|href)=(['"])([^'"]+)\2/gi,(m,attr,q,target)=>{const p=localTarget(files,path,target,root);if(!p)return /\.html?(?:[?#]|$)/i.test(target)&&attr.toLowerCase()==='href'?`${attr}=${q}#${q}`:m;const url=urls.get(p);return url?`${attr}=${q}${url}${q}`:m});
    html=html.replace(/\bsrcset=(['"])([^'"]+)\1/gi,(m,q,value)=>{const rewritten=value.split(',').map(part=>{const bits=part.trim().split(/\s+/),p=localTarget(files,path,bits[0],root),url=p?urls.get(p):'';return [url||bits[0],...bits.slice(1)].join(' ')}).join(', ');return `srcset=${q}${rewritten}${q}`});
    if(!/<meta\s+name=['"]viewport/i.test(html))html=html.replace(/<head([^>]*)>/i,'<head$1><meta name="viewport" content="width=device-width,initial-scale=1">');
    return html;
  }

  async function collectProjectFiles(fileList){
    const selected=[...fileList],files=new Map();let count=0;
    for(const file of selected){
      if(file.size>25*1024*1024)throw new Error(`${file.name} ist größer als 25 MB.`);
      if(/\.zip$/i.test(file.name)){
        const mod=await import('https://esm.sh/jszip@3.10.1?bundle'),JSZip=mod.default||mod,zip=await JSZip.loadAsync(file);
        for(const [name,item] of Object.entries(zip.files)){if(item.dir||count>=160)continue;const path=normalizePath(name);if(!path||/(^|\/)node_modules\//i.test(path))continue;count++;if(isText(path)){const text=await item.async('string');if(text.length<=2_000_000)files.set(path,{kind:'text',text})}else{const bytes=await item.async('uint8array');if(bytes.byteLength<=5_000_000)files.set(path,{kind:'binary',bytes})}}
      }else{
        const path=normalizePath(file.webkitRelativePath||file.name);if(!path||count>=160)continue;count++;if(isText(path))files.set(path,{kind:'text',text:await file.text()});else files.set(path,{kind:'binary',bytes:new Uint8Array(await file.arrayBuffer())})
      }
    }
    return files;
  }

  function buildLivePreview(files){
    clearUrls();const indexes=[...files.keys()].filter(x=>/(^|\/)index\.html?$/i.test(x)).sort((a,b)=>a.split('/').length-b.split('/').length||a.length-b.length),index=indexes[0];if(!index)throw new Error('Keine startbare index.html gefunden. Bei Next.js, React oder Vite bitte den gebauten Ordner (z. B. out/ oder dist/) hochladen.');
    const root=dir(index),urls=new Map();
    for(const [path,item] of files){if(item.kind==='binary'||(item.kind==='text'&&!['html','htm','css','js','mjs','cjs'].includes(ext(path))))urls.set(path,blobUrl(item.kind==='binary'?item.bytes:item.text,mime(path)))}
    for(const [path,item] of files)if(item.kind==='text'&&ext(path)==='css'){const css=rewriteCss(item.text,path,root,files,urls);urls.set(path,blobUrl(css,'text/css'))}
    let jsUrls=new Map();for(const [path,item] of files)if(item.kind==='text'&&['js','mjs','cjs'].includes(ext(path)))jsUrls.set(path,blobUrl(item.text,'text/javascript'));
    for(let pass=0;pass<3;pass++){const combined=new Map([...urls,...jsUrls]),next=new Map();for(const [path,item] of files)if(item.kind==='text'&&['js','mjs','cjs'].includes(ext(path)))next.set(path,blobUrl(rewriteJs(item.text,path,root,files,combined),'text/javascript'));jsUrls=next}
    for(const [path,url] of jsUrls)urls.set(path,url);
    const indexItem=files.get(index),html=rewriteHtml(indexItem.text,index,root,files,urls),frame=$('#outcomePreviewFrame');frame.setAttribute('sandbox','allow-scripts');frame.srcdoc=html;$('#outcomeFrameWrap').classList.add('ready');$('#outcomeLearning').classList.add('ready');
    const css=[...files].filter(([p,x])=>x.kind==='text'&&ext(p)==='css').slice(0,4).map(([,x])=>x.text).join('\n').slice(0,18000),js=[...files].filter(([p,x])=>x.kind==='text'&&['js','mjs'].includes(ext(p))).slice(0,2).map(([,x])=>x.text).join('\n').slice(0,10000);
    lastOutcome={fileNames:[...files.keys()].slice(0,120),html:`${indexItem.text}\n\nJAVASCRIPT-STRUKTUR\n${js}`.slice(0,30000),css};
  }

  async function handleOutcomeFiles(event){
    const status=$('#outcomePreviewStatus');status.className='outcome-preview-status';status.textContent='Projekt wird lokal gelesen…';$('#outcomeFrameWrap')?.classList.remove('ready');$('#outcomeLearning')?.classList.remove('ready');lastOutcome=null;
    try{const files=await collectProjectFiles(event.target.files||[]);if(!files.size)throw new Error('Keine unterstützten Projektdateien gefunden.');buildLivePreview(files);status.className='outcome-preview-status good';status.textContent=`Live-Vorschau geladen · ${files.size} Dateien. Die Dateien bleiben für die Vorschau lokal in diesem Browser.`}catch(error){status.className='outcome-preview-status error';status.textContent=error.message||'Projekt konnte nicht geladen werden.'}
  }

  async function sendLearningFeedback(){
    const status=$('#outcomePreviewStatus'),consent=$('#outcomeLearningConsent')?.checked,rating=Number($('#outcomeRating')?.value)||0;if(!lastOutcome)return;if(!consent){status.className='outcome-preview-status error';status.textContent='Bitte die freiwillige Lernfreigabe aktivieren oder die Vorschau einfach ohne Auswertung nutzen.';return}if(!rating){status.className='outcome-preview-status error';status.textContent='Bitte das Ergebnis zuerst mit 1 bis 5 bewerten.';return}
    if(!window.SiteBriefCloud?.user){$('#accountBtn')?.click();status.textContent='Zum Freigeben eines Lernergebnisses bitte zuerst anmelden.';return}
    const button=$('#outcomeLearnBtn');button.disabled=true;status.className='outcome-preview-status';status.textContent='Prompt und Ergebnis werden einmalig verglichen…';
    try{
      const headers=await window.SiteBriefCloud.authHeaders(),payload={action:'learning-feedback',consent:true,rating,project:{type:$('#projectType')?.value||'',goal:$('#projectGoal')?.value||''},finalPrompt:$('#masterPrompt')?.value||'',outcome:{...lastOutcome,notes:$('#outcomeLearningNotes')?.value||''}},response=await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)}),data=await response.json();if(!response.ok)throw new Error(data.error||'Auswertung nicht möglich.');
      status.className='outcome-preview-status good';status.textContent='Danke. Das Ergebnis wurde ausgewertet; gespeichert werden nur die abgeleiteten Lernhinweise.';const result=$('#outcomeLearningResult');result.textContent=data.summary||'Lernhinweis gespeichert.';result.classList.add('show');
      try{const config=await fetch('/api/config',{cache:'no-store'}).then(r=>r.json());if(window.SiteBriefCloud?.config)window.SiteBriefCloud.config.learningHints=config.learningHints||[]}catch{}
    }catch(error){status.className='outcome-preview-status error';status.textContent=error.message||'Auswertung nicht möglich.'}finally{button.disabled=false}
  }

  function injectOutcomeLab(){
    const step=$('#stepPrompt');if(!step||$('#outcomeLab'))return;const section=document.createElement('section');section.id='outcomeLab';section.className='outcome-lab';section.innerHTML=`<div class="outcome-lab-head"><div><span>ERGEBNIS PRÜFEN</span><h2>Gebautes Projekt als Live-Vorschau öffnen</h2><p>Lade das fertige ZIP oder einen gebauten statischen Ordner hoch. Prompt.ai zeigt die Website in einer abgeschotteten Vorschau. Bei Next.js, React oder Vite funktioniert am zuverlässigsten der fertige Build-Ordner wie <b>out/</b> oder <b>dist/</b>.</p></div></div><div class="outcome-upload"><label class="field"><span>Projektdateien / ZIP</span><input id="outcomeProjectFiles" type="file" multiple accept=".zip,.html,.htm,.css,.js,.mjs,.json,.svg,.png,.jpg,.jpeg,.webp,.gif,.woff,.woff2"></label><button type="button" class="outline-btn" id="outcomeClearBtn">Vorschau leeren</button></div><p id="outcomePreviewStatus" class="outcome-preview-status">Noch kein gebautes Projekt geladen.</p><div class="outcome-frame-wrap" id="outcomeFrameWrap"><iframe id="outcomePreviewFrame" title="Live-Vorschau des hochgeladenen Projekts"></iframe></div><div class="outcome-learning" id="outcomeLearning"><label class="check-row"><input id="outcomeLearningConsent" type="checkbox"><span><strong>Prompt.ai darf Prompt und Ergebnis einmalig vergleichen</strong><small>Freiwillig. Projektdateien, Bilder, API-Keys und der vollständige Prompt werden nicht in den globalen Lernpool gespeichert. Gespeichert werden nur kurze, abstrahierte Lernhinweise.</small></span></label><div class="outcome-learning-grid"><label class="field"><span>Wie gut ist das Ergebnis?</span><select id="outcomeRating"><option value="">Bewerten</option><option value="5">5 – sehr gut</option><option value="4">4 – gut</option><option value="3">3 – okay</option><option value="2">2 – schwach</option><option value="1">1 – schlecht</option></select></label><label class="field"><span>Was war gut oder falsch? <em>optional</em></span><textarea id="outcomeLearningNotes" rows="3" placeholder="z. B. Aufbau gut, aber mobile Navigation und Bildgrößen waren nicht wie gewünscht."></textarea></label></div><p class="outcome-learning-note">Nur ausdrücklich freigegebene Ergebnisse werden ausgewertet. Globale Erfahrungssignale werden zusätzlich nur aus gut bewerteten Ergebnissen in zukünftige Prompts übernommen.</p><button type="button" class="solid-btn" id="outcomeLearnBtn">Ergebnis für Prompt.ai auswerten</button><div id="outcomeLearningResult" class="outcome-learning-result"></div></div>`;
    const actions=step.querySelector(':scope > .step-actions');step.insertBefore(section,actions||null);$('#outcomeProjectFiles').addEventListener('change',handleOutcomeFiles);$('#outcomeClearBtn').addEventListener('click',()=>{clearUrls();lastOutcome=null;$('#outcomePreviewFrame').srcdoc='';$('#outcomeFrameWrap').classList.remove('ready');$('#outcomeLearning').classList.remove('ready');$('#outcomePreviewStatus').className='outcome-preview-status';$('#outcomePreviewStatus').textContent='Noch kein gebautes Projekt geladen.'});$('#outcomeLearnBtn').addEventListener('click',sendLearningFeedback);
  }

  function matchingHints(){
    const rows=window.SiteBriefCloud?.config?.learningHints||[],type=String($('#projectType')?.value||'').trim().toLowerCase(),goal=String($('#projectGoal')?.value||'').trim().toLowerCase(),scored=rows.map(row=>{let score=0;if(type&&String(row.projectType||'').toLowerCase()===type)score+=4;if(goal&&String(row.projectGoal||'').toLowerCase()===goal)score+=2;score+=Math.max(0,Number(row.rating)||0)/10;return {row,score}}).sort((a,b)=>b.score-a.score);return scored.filter(x=>x.score>=2).slice(0,5).map(x=>x.row)}
  function applyLearningHints(){
    const prompt=$('#masterPrompt');if(!prompt||prompt.value.length<300||prompt.value.includes(LEARNING_MARK))return;const hints=matchingHints();if(!hints.length)return;
    const lines=hints.map(h=>`- ${String(h.summary||'').replace(/\s+/g,' ').trim()}`).filter(x=>x.length>3);if(!lines.length)return;
    prompt.value+=`\n\n${LEARNING_MARK}\nDiese Hinweise stammen ausschließlich aus freiwillig freigegebenen und gut bewerteten Ergebnis-Auswertungen. Sie sind allgemeine Erfahrungssignale, keine fremden Projektdaten. Nutze sie nur, wenn sie zum aktuellen Projekt passen.\n${lines.join('\n')}\n`;prompt.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function observePrompt(){const prompt=$('#masterPrompt');if(!prompt)return;prompt.addEventListener('input',()=>setTimeout(applyLearningHints,80));const step=$('#stepPrompt');if(step)new MutationObserver(()=>{if(step.classList.contains('active'))setTimeout(applyLearningHints,150)}).observe(step,{attributes:true,attributeFilter:['class']})}

  function bindGlobalClicks(){document.addEventListener('click',event=>{if(event.target.closest('#personalAiPlansBtn'))$('#plansDialog')?.showModal();if(event.target.closest('#personalAiAddonBtn'))$('#startApiAddonCheckoutBtn')?.click()})}
  function observers(){
    const status=$('#generationStatus');if(status)new MutationObserver(cleanTechnicalWarnings).observe(status,{childList:true,subtree:true,characterData:true,attributes:true});
    const account=$('#accountDialog'),settings=$('#settingsDialog'),revision=$('#quickRevisionDialog');[account,settings,revision].filter(Boolean).forEach(node=>new MutationObserver(()=>{if(node.open)setTimeout(enforceAccessUi,0)}).observe(node,{attributes:true,attributeFilter:['open']}));
    window.addEventListener('promptai:access',()=>{enforceAccessUi();maybeShowThanks()});window.SiteBriefCloud?.subscribe?.(()=>setTimeout(()=>{enforceAccessUi();maybeShowThanks()},60));
  }

  async function ensureConfig(){if(window.SiteBriefCloud?.config?.systemAiRoutes)return;try{const data=await fetch('/api/config',{cache:'no-store'}).then(r=>r.json());if(window.SiteBriefCloud?.config)Object.assign(window.SiteBriefCloud.config,{systemAiRoutes:data.systemAiRoutes||[],systemAiProviders:data.systemAiProviders||[],learningHints:data.learningHints||[],previewRoutes:data.previewRoutes||[],previewProviders:data.previewProviders||[]})}catch{}}
  async function init(){injectStyles();primeIntro();rememberCheckout();await ensureConfig();injectOutcomeLab();observePrompt();bindGlobalClicks();observers();enforceAccessUi();setTimeout(()=>{enforceAccessUi();maybeShowThanks();applyLearningHints()},600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

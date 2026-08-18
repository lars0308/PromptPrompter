(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const CATEGORIES=[
    ['music','Musik / Song'],['video','Video / Film'],['text','Text / Schreiben'],['website','Website / Webdesign'],['presentation','Präsentation / PowerPoint'],['image','Bild / Grafik'],['logo','Logo / Marke'],['code','Code / App'],['marketing','Marketing / Werbung'],['social','Social Media'],['research','Recherche / Analyse'],['learning','Lernen / Erklären'],['audio','Stimme / Audio'],['automation','Automation / Workflow'],['business','Business / Strategie'],['design3d','3D / Design'],['email','E-Mail / Kommunikation'],['custom','Eigener Typ']
  ];
  const TOOLS={
    music:['Suno','Udio','ChatGPT','Claude','Gemini','Universell'],video:['Sora','Google Veo','Runway','Kling','ChatGPT','Universell'],text:['ChatGPT','Claude','Gemini','Microsoft Copilot','Universell'],website:['Codex','Claude Code','v0','Cursor','ChatGPT','Gemini','Universell'],presentation:['PowerPoint / Copilot','Gamma','Canva','ChatGPT','Claude','Gemini','Universell'],image:['OpenAI Images','Midjourney','Gemini','Flux','Ideogram','Universell'],logo:['Midjourney','Ideogram','OpenAI Images','Flux','Gemini','Universell'],code:['Codex','Claude Code','Cursor','Gemini','ChatGPT','Universell'],marketing:['ChatGPT','Claude','Gemini','Microsoft Copilot','Universell'],social:['ChatGPT','Claude','Gemini','Canva','Universell'],research:['ChatGPT','Claude','Gemini','Perplexity','Universell'],learning:['ChatGPT','Claude','Gemini','Universell'],audio:['ElevenLabs','OpenAI Audio','Gemini','Universell'],automation:['ChatGPT','Claude','Gemini','Codex','Universell'],business:['ChatGPT','Claude','Gemini','Microsoft Copilot','Universell'],design3d:['ChatGPT','Gemini','Claude','Universell'],email:['ChatGPT','Claude','Gemini','Microsoft Copilot','Universell'],custom:['ChatGPT','Claude','Gemini','Universell']
  };
  let busy=false;
  function access(){return window.PromptAiAccess||{plan:'free',isAdmin:false}}
  function paid(){const a=access();return a.isAdmin||a.plan==='pro'||a.plan==='ultimate'}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  async function authHeaders(){try{return await window.SiteBriefCloud?.authHeaders?.()||{}}catch{return {}}}
  
  function ensureDialog(){let d=$('#freePromptDialog');if(d)return d;d=document.createElement('dialog');d.id='freePromptDialog';d.className='free-prompt-dialog';d.setAttribute('aria-label','Freier Prompt');d.innerHTML=`<div class="free-prompt-shell"><header class="free-prompt-head"><div><span>FREIER PROMPT</span><h2>Für alles, wofür du heute einen guten Prompt brauchst.</h2></div><button type="button" class="free-prompt-close" aria-label="Schließen">×</button></header><div class="free-prompt-body"><p class="free-prompt-intro">Beschreibe dein Ziel in normalen Worten. Prompt.ai passt Aufbau und Detailgrad an Musik, Video, Text, Website, PowerPoint, Bild, Code oder deinen eigenen Anwendungsfall an.</p><div class="free-prompt-grid free-prompt-main"><label class="field"><span>Was soll entstehen?</span><select id="freePromptCategory">${CATEGORIES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label><label class="field"><span>Für welche KI / welches Tool?</span><select id="freePromptTool"></select></label><label class="field free-prompt-span" id="freePromptCustomCategoryWrap" hidden><span>Eigener Ausgabetyp</span><input id="freePromptCustomCategory" placeholder="z. B. Prompt für eine CNC-Planung, Quiz, Spielidee …"></label><label class="field free-prompt-span" id="freePromptCustomToolWrap"><span>Eigenes Tool <em>optional</em></span><input id="freePromptCustomTool" placeholder="Nur ausfüllen, wenn dein Tool nicht in der Liste steht"></label><label class="field free-prompt-span"><span>Was willst du erreichen?</span><textarea id="freePromptDescription" rows="7" placeholder="Beschreibe möglichst konkret, was die KI erstellen soll. Stichpunkte, Umgangssprache oder ein unfertiger Gedanke reichen."></textarea></label></div><section id="freePromptAdvanced" class="free-prompt-advanced"><div class="free-prompt-advanced-head"><div><span>PRO</span><strong>Mehr Kontext = deutlich genauerer Prompt</strong></div></div><div class="free-prompt-grid"><label class="field free-prompt-span"><span>Ziel, Zielgruppe &amp; Kontext</span><textarea id="freePromptContext" rows="3" placeholder="Was soll erreicht werden, für wen, und welche Referenzen oder Beispiele kennt die KI schon?"></textarea></label><label class="field free-prompt-span"><span>Stil, Muss enthalten &amp; Vermeiden</span><textarea id="freePromptStyle" rows="3" placeholder="Ton und Wirkung, was unbedingt vorkommen soll, was du vermeiden willst."></textarea></label><label class="field free-prompt-span"><span>Ausgabeformat, Sprache &amp; Grenzen</span><textarea id="freePromptFormat" rows="3" placeholder="z. B. 12 Folien, 16:9, 90 Sekunden, Markdown, auf Englisch …"></textarea></label></div></section><aside id="freePromptUpgrade" class="free-prompt-upgrade" hidden><div><strong>Free bleibt bewusst einfach.</strong><small>Free erzeugt aus Typ, Ziel-KI und Beschreibung einen kompakten Basis-Prompt. Pro wertet zusätzlich Ziel/Zielgruppe/Kontext, Stil/Muss/Verbote und Ausgabeformat mit der zentralen Prompt.ai-KI aus.</small></div><button type="button" class="upgrade-btn" id="freePromptUpgradeBtn">Pro ansehen</button></aside><div id="freePromptWorking" class="free-prompt-working" hidden><span class="prompt-process-kicker">PROMPT.AI</span><strong class="prompt-process-title">Dein Prompt wird gebaut</strong></div><div class="free-prompt-actions"><button type="button" class="solid-btn" id="freePromptGenerate">Prompt erstellen</button><button type="button" class="outline-btn" id="freePromptClear">Neu beginnen</button></div><p id="freePromptStatus" class="free-prompt-status"></p></div></div>`;document.body.appendChild(d);d.querySelector('.free-prompt-close').onclick=()=>d.close();d.addEventListener('cancel',e=>{e.preventDefault();d.close()});$('#freePromptCategory').onchange=()=>{renderTools();syncCustom();};$('#freePromptGenerate').onclick=generate;$('#freePromptClear').onclick=clear;$('#freePromptUpgradeBtn').onclick=()=>{d.close();setTimeout(()=>$('#plansDialog')?.showModal(),0)};renderTools();syncCustom();syncAccess();return d}
  function ensureResultDialog(){
    let d=$('#freePromptResultDialog');if(d)return d;
    d=document.createElement('dialog');d.id='freePromptResultDialog';d.className='free-prompt-result-dialog';
    // Der Ladeschirm sitzt im Ergebnisfenster, nicht im Fragebogen: vom Textfeld der Startseite
    // aus gibt es keinen Fragebogen mehr, und der Weg soll trotzdem sichtbar sein - erst die
    // Arbeitsanzeige, dann an derselben Stelle der fertige Prompt.
    d.innerHTML=`<form method="dialog" class="free-prompt-result-frame"><div class="free-prompt-result-head"><div><span>PROMPT.AI</span><h2 id="freePromptResultTitle">Prompt ist fertig</h2></div><button type="submit" class="free-prompt-close" aria-label="Schließen">×</button></div><div id="freePromptResultWorking" class="free-prompt-working" hidden><span class="prompt-process-kicker">PROMPT.AI</span><strong class="prompt-process-title">Dein Prompt wird gebaut</strong></div><p id="freePromptResultError" class="free-prompt-status error" hidden></p><textarea id="freePromptOutput" class="free-prompt-output" spellcheck="false"></textarea><div class="free-prompt-actions"><button type="button" class="solid-btn" id="freePromptCopy">Kopieren</button><button type="button" class="outline-btn" id="freePromptSave">Als .md speichern</button></div></form>`;
    document.body.appendChild(d);
    $('#freePromptCopy',d).onclick=copy;$('#freePromptSave',d).onclick=save;
    return d;
  }
  // Was am Textfeld der Startseite haengt, gehoert in den Prompt: die Anhaenge stehen in den
  // echten Referenzlisten, aus denen auch die Kacheln unter dem Textfeld gelesen werden. Sie
  // wandern in die Beschreibung und nicht in das Kontextfeld - fuer Free leert der Server das
  // Kontextfeld, und ein Link, den man sichtbar angehaengt hat, darf nicht still verschwinden.
  function attachedReferences(){
    const items=[];
    for(const [selector,mark] of [['#urlReferences','Link'],['#imageReferences','Bild'],['#documentReferences','Datei']]){
      const host=document.querySelector(selector);if(!host)continue;
      for(const node of host.children){
        const text=(node.querySelector('small')?.textContent||node.querySelector('strong')?.textContent||node.querySelector('figcaption')?.textContent||'').trim();
        if(text)items.push(`${mark}: ${text}`);
      }
    }
    return items;
  }
  function withReferences(description){
    const refs=attachedReferences();
    if(!refs.length)return description;
    return `${description}\n\nAngehängte Referenzen:\n${refs.map(x=>`- ${x}`).join('\n')}`;
  }
  function renderTools(){const c=$('#freePromptCategory')?.value||'text',select=$('#freePromptTool');if(!select)return;select.innerHTML=(TOOLS[c]||TOOLS.custom).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}
  function syncCustom(){$('#freePromptCustomCategoryWrap').hidden=$('#freePromptCategory')?.value!=='custom'}
  function syncAccess(){const pro=paid(),advanced=$('#freePromptAdvanced'),upgrade=$('#freePromptUpgrade');if(advanced){advanced.hidden=!pro;$$('input,textarea,select',advanced).forEach(x=>x.disabled=!pro)}if(upgrade)upgrade.hidden=pro;const button=$('#workspaceFreePromptBtn');if(button)button.dataset.tier=pro?'pro':'free'}
  function ensureEntry(){const actions=$('.welcome-quick-actions');if(!actions||$('#workspaceFreePromptBtn'))return;const b=document.createElement('button');b.type='button';b.id='workspaceFreePromptBtn';b.className='outline-btn free-prompt-entry';b.innerHTML='<strong>Freier Prompt</strong><small style="display:block;margin-top:4px;opacity:.7">Musik, Video, Text, PowerPoint, Bilder, Code & mehr</small>';actions.appendChild(b);b.onclick=()=>{const d=ensureDialog();syncAccess();try{d.showModal()}catch{}}}
  function payload(){const own=window.PromptAiOwnConnection;return {...(own?.provider&&own?.model?{useOwnApi:true,ownProvider:own.provider,ownModel:own.model,ownLabel:own.label||''}:{}),action:'free-prompt',language:window.PromptAiPreferences?.outputLanguage||'Deutsch',category:$('#freePromptCategory').value,customCategory:$('#freePromptCustomCategory').value,targetTool:$('#freePromptTool').value,customTool:$('#freePromptCustomTool').value,description:withReferences($('#freePromptDescription').value),context:$('#freePromptContext')?.value||'',style:$('#freePromptStyle')?.value||'',outputFormat:$('#freePromptFormat')?.value||''}}
  // Der Aufruf an /api/generate dauert je nach Anbieter viele Sekunden. Vorher stand dafuer nur
  // eine Statuszeile unter den Knoepfen - das Fenster sah aus, als sei nichts passiert. Die
  // Arbeitsanzeige laeuft deshalb los, bevor die Anfrage ueberhaupt gestellt wird, und die KI
  // denkt dahinter nach.
  const WORK_LINES=[
    'Deine Beschreibung wird eingeordnet.',
    'Ausgabetyp und Ziel-KI werden berücksichtigt.',
    'Aufbau, Regeln und Beispiele werden gesetzt.',
    'Der fertige Prompt wird zusammengestellt.'
  ];
  // Zwei Wege, ein Ladeschirm: ueber die Kachel steht er im Fragebogen, ueber das Textfeld der
  // Startseite im Ergebnisfenster - dort, wo gleich danach der Prompt steht.
  let directRun=false;
  function workHost(){return directRun?$('#freePromptResultWorking'):$('#freePromptWorking')}
  function startWorking(length){const host=workHost();if(!host)return;host.hidden=false;try{window.PromptAiLoading?.render?.(host,{lines:WORK_LINES,duration:window.PromptAiLoading?.durationFor?.(length)})}catch{}}
  function stopWorking(){const host=workHost();if(!host)return;try{window.PromptAiLoading?.complete?.(host)}catch{}host.hidden=true}
  // Der freie Prompt braucht vom Textfeld aus keinen Fragebogen: Ausgabetyp und Ziel-KI stehen
  // schon fest (erkannt bzw. voreingestellt), alles Weitere ist beim freien Prompt Beiwerk. Also
  // direkt der Ladeschirm und danach der fertige Prompt - genau das, was man erwartet, wenn man
  // im Textfeld auf Absenden drueckt.
  function markWorking(dialog,on){
    dialog.classList.toggle('is-working',on);
    const title=$('#freePromptResultTitle',dialog);if(title)title.textContent=on?'Dein Prompt entsteht':'Prompt ist fertig';
    const error=$('#freePromptResultError',dialog);if(error&&on){error.hidden=true;error.textContent=''}
  }
  async function runDirect(){
    if(busy)return false;
    ensureDialog();syncAccess();
    const description=$('#freePromptDescription')?.value.trim()||'';
    if(description.length<12)return false;
    const dialog=ensureResultDialog();
    $('#freePromptOutput',dialog).value='';
    markWorking(dialog,true);
    try{if(!dialog.open)dialog.showModal()}catch{}
    directRun=true;
    try{await generate()}finally{directRun=false;markWorking(dialog,false)}
    return true;
  }
  async function generate(){if(busy)return;const desc=$('#freePromptDescription').value.trim(),status=$('#freePromptStatus');if(desc.length<12){status.className='free-prompt-status error';status.textContent='Beschreibe bitte etwas genauer, was die KI für dich erstellen soll.';return}busy=true;$('#freePromptGenerate').disabled=true;startWorking(desc.length);status.className='free-prompt-status free-prompt-loading';status.textContent=paid()?'Prompt.ai analysiert Ziel, Kontext und Ausgabeformat…':'Kompakter Basis-Prompt wird erstellt…';try{const headers=await authHeaders(),r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload())}),data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Prompt konnte nicht erstellt werden.');const resultDialog=ensureResultDialog();$('#freePromptOutput',resultDialog).value=data.prompt||'';status.className='free-prompt-status good';status.textContent=data.advanced?`Professioneller Prompt erstellt${data.profile?` · ${data.profile}`:''}.`:'Free-Basis-Prompt erstellt. Mit Pro werden alle Zusatzangaben von der KI analysiert und stärker auf das Ziel-Tool zugeschnitten.';try{resultDialog.showModal()}catch{}window.dispatchEvent(new CustomEvent('promptai:prompt-version',{detail:{source:'freeprompt',title:`Freier Prompt · ${CATEGORIES.find(x=>x[0]===$('#freePromptCategory').value)?.[1]||'Eigener Typ'}`,prompt:data.prompt||''}}))}catch(e){status.className='free-prompt-status error';status.textContent=e.message||'Prompt konnte nicht erstellt werden.';if(directRun){const slot=$('#freePromptResultError');if(slot){slot.textContent=status.textContent;slot.hidden=false}}}finally{stopWorking();busy=false;$('#freePromptGenerate').disabled=false}}
  async function copy(){const btn=$('#freePromptCopy'),value=$('#freePromptOutput')?.value;if(!value)return;try{await navigator.clipboard.writeText(value)}catch{$('#freePromptOutput')?.select();document.execCommand('copy')}if(btn){const old=btn.textContent;btn.textContent='Kopiert ✓';setTimeout(()=>{btn.textContent=old},1300)}}
  function save(){const value=$('#freePromptOutput')?.value;if(!value)return;const blob=new Blob([value],{type:'text/markdown;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='prompt-ai-freier-prompt.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  function clear(){['freePromptDescription','freePromptCustomCategory','freePromptCustomTool','freePromptContext','freePromptStyle','freePromptFormat'].forEach(id=>{const e=$(`#${id}`);if(e)e.value=''});$('#freePromptStatus').textContent='';$('#freePromptDescription').focus()}
  window.PromptAiFreePrompt={runDirect,ensure:ensureDialog};
  function init(){ensureEntry();ensureDialog();syncAccess();window.addEventListener('promptai:access',syncAccess)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

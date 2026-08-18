(()=>{
  'use strict';
  const $=(selector,root=document)=>root?.querySelector?.(selector)||null;
  let settleTimer=0;
  window.PromptAiHomeFinalLock=true;

  const icons={
    website:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.2 2.4 3.4 5.2 3.4 8.5S14.2 18.1 12 20.5C9.8 18.1 8.6 15.3 8.6 12S9.8 5.9 12 3.5Z"/></svg>',
    prompt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 17.5-.5 3 3-.5L18.8 8.7a2.1 2.1 0 0 0-3-3L5 17.5Z"/><path d="m13.9 7.7 2.4 2.4"/></svg>',
    revision:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 8.4A7.5 7.5 0 0 1 18.7 7L20 9M4 15l1.3 2A7.5 7.5 0 0 0 18 15.6"/></svg>',
    folder:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h6l2-2h9v13h-17z"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.2c0 4.3-2.6 7.5-7 9.3-4.4-1.8-7-5-7-9.3V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>',
    history:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5v5h5"/><path d="M5.6 16.5A8 8 0 1 0 4 10l2.7-2.2"/><path d="M12 8v4l3 2"/></svg>'
  };


  // Welches Kontingent die gewählte Arbeitsart verbraucht. Freier Prompt zählt als Prompt,
  // alles rund um Websites als Website-Lauf.
  const METRIC={website:['website_generations','Website-Läufe'],revision:['website_generations','Website-Läufe'],free:['free_prompts','Prompts']};
  // Grobe Umrechnung: im Deutschen kommt ein Token auf gut dreieinhalb Zeichen. Deshalb das
  // Ungefähr-Zeichen davor - eine genaue Zahl kennt erst das Modell.
  const tokenGuess=text=>Math.max(1,Math.round(text.trim().length/3.6));
  // Eine gekaufte Einzelprüfung war nach dem Kauf nirgends zu sehen. Sie gehört dorthin, wo der
  // Kunde nach dem Kauf steht: in die Zeile unter dem Textfeld.
  function creditNote(){
    const credits=Math.max(0,Number(window.PromptAiAccess?.reviewCredits)||0);
    if(!credits)return '';
    // "Bereit" allein liest sich wie ein Knopf, den man suchen muesste - eingeloest wird sie aber
    // von selbst, sobald das naechste Projekt geprueft wird.
    return credits===1?'1 gekaufte Prüfung – wird beim nächsten Projekt eingelöst':`${credits} gekaufte Prüfungen – die nächste wird beim nächsten Projekt eingelöst`;
  }
  function withCredit(line){const note=creditNote();return note?(line?`${line} · ${note}`:note):line}
  // Was eine Nutzung kostet, misst der Monatsvorrat - Tokens im Hintergrund, Prozent im Bild.
  // Zahlen wie "2,4 Millionen Token" sagen niemandem etwas; ein Anteil und eine Uebersetzung in
  // Projekte schon. Ein Projektlauf kostet grob 45.000 Einheiten, ein freier Prompt 4.000.
  const RUN_COST={website:45000,revision:45000,check:20000,free:4000};
  const RUN_LABEL={website:'Projekte',revision:'Projekte',check:'Prüfungen',free:'Prompts'};
  function budget(){
    const tokens=window.PromptAiQuota?.summary?.()?.tokens;
    const limit=Number(tokens?.limit||0);
    if(!limit)return null;
    const used=Math.max(0,Number(tokens.used)||0),remaining=Math.max(0,limit-used);
    return {limit,used,remaining,share:Math.max(0,Math.min(1,remaining/limit)),percent:Math.max(0,Math.min(100,Math.round(remaining/limit*100)))};
  }
  function quotaLine(mode){
    if(window.PromptAiAccess?.isAdmin)return 'unbegrenzt';
    const info=budget();
    if(info){
      const cost=RUN_COST[mode]||RUN_COST.website,runs=Math.floor(info.remaining/cost);
      const rest=runs>0?`reicht für etwa ${runs} ${RUN_LABEL[mode]||'Projekte'}`:'kleineres Modell übernimmt';
      return withCredit(`Noch ${info.percent} % · ${rest}`);
    }
    const summary=window.PromptAiQuota?.summary?.();
    if(!summary?.metrics)return withCredit('');
    const [key,label]=METRIC[mode]||METRIC.website,item=summary.metrics[key];
    if(!item)return withCredit('');
    const limit=Number(item.limit||0);
    if(!limit)return withCredit(`${label} nicht im Tarif`);
    const left=Math.max(0,Number(item.remaining??limit-Number(item.used||0)));
    return withCredit(`${left}/${limit} ${label}`);
  }
  // Der Balken sitzt vor der Zeile: eine Laenge sieht man schneller als eine Zahl.
  function syncBudgetBar(home){
    const meta=$('.prompt-command-meta',home);if(!meta)return;
    const info=window.PromptAiAccess?.isAdmin?null:budget();
    let bar=$('.prompt-budget-bar',meta);
    if(!info){bar?.remove();return}
    if(!bar){
      bar=document.createElement('span');bar.className='prompt-budget-bar';bar.innerHTML='<i></i>';
      meta.insertBefore(bar,$('#promptHomeMeta',meta));
    }
    bar.title=`Noch ${info.percent} % deines Monatsvorrats`;
    bar.dataset.low=info.percent<=15?'1':'0';
    const fill=bar.firstElementChild;
    if(fill.style.width!==`${info.percent}%`)fill.style.width=`${info.percent}%`;
    warnLowBudget(info);
  }
  // Einmal je Sitzung, wenn es eng wird - und nur dann, denn eine Meldung, die jedes Mal kommt,
  // liest nach dem zweiten Mal niemand mehr.
  const LOW_KEY='prompt-ai-budget-warned-v1';
  function warnLowBudget(info){
    if(!info||info.percent>15)return;
    try{if(sessionStorage.getItem(LOW_KEY))return;sessionStorage.setItem(LOW_KEY,'1')}catch{}
    const text=info.percent<=0
      ?'Monatsvorrat leer – es läuft weiter, jetzt auf einem kleineren Modell.'
      :`Noch ${info.percent} % Monatsvorrat – danach übernimmt ein kleineres Modell.`;
    window.PromptAiToast?.show?.(text,'error');
  }
  // Grobe, ehrliche Schätzung: der ausgelesene Text der Quellen und Unterlagen, so wie er auch
  // im Auftrag landet. Bilder werden pauschal veranschlagt, weil ihre Kosten nicht an Zeichen hängen.
  function attachmentTokens(){
    let chars=0,images=0;
    try{
      const state=JSON.parse(localStorage.getItem('sitebrief-v6-state')||'{}');
      for(const item of state.urls||[])chars+=String(item.summary||'').length+String(item.url||'').length;
      for(const source of state.sourceUrls||[])chars+=String(source.summary||'').length;
      for(const doc of state.documents||[])chars+=String(doc.text||'').length;
      images=(state.images||[]).length;
    }catch{}
    return Math.round(chars/3.6)+images*260;
  }
  function syncMeta(){
    const home=$('.prompt-command-home');if(!home)return;
    const field=$('#promptCommandInput',home),slot=$('#promptHomeMeta',home);
    if(!field||!slot)return;
    const text=field.value.trim();
    // Anhänge gehen mit in den Auftrag - ein ausgelesener Link oder ein PDF wiegt oft mehr als
    // der getippte Satz. Die Schätzung zählt sie deshalb mit, sonst steht dort eine Zahl, die
    // mit dem, was tatsächlich an die KI geht, nichts zu tun hat.
    const attached=attachmentTokens();
    const total=tokenGuess(text)+attached;
    const mode=home.dataset.commandMode||'website';
    // Waehrend man schreibt zaehlt nicht die Tokenzahl, sondern was der Auftrag vom Monat
    // wegnimmt - das ist die Groesse, die man vor dem Absenden wirklich abwaegt.
    const info=window.PromptAiAccess?.isAdmin?null:budget();
    const cost=(RUN_COST[mode]||RUN_COST.website)+total;
    const share=info&&info.limit?Math.max(1,Math.round(cost/info.limit*100)):0;
    const next=text||attached
      ?(share?`Dieser Auftrag verbraucht etwa ${share} % deines Monats`:`${text.length} Zeichen · ≈${total} Token${attached?` (davon ≈${attached} aus Anhängen)`:''}`)
      :quotaLine(mode);
    if(slot.textContent!==next)slot.textContent=next;
    syncBudgetBar(home);
  }

  // Anhänge laufen über die vorhandenen Eingaben der Referenzen: der Dateiknopf öffnet
  // #imageInput, der Link geht durch #referenceUrl und #addUrlBtn. Damit gelten dieselben
  // Formate, Grenzen und Tarifregeln wie bisher - hier ist nur der Ort des Klicks neu. Die
  // Kacheln spiegeln die echte Liste, es gibt also keine zweite Wahrheit.
  // Was hochgeladen wird, wird vor der Übernahme geprüft: erlaubte Endung, Größe, und der Inhalt
  // muss zur Endung passen. Sonst genügt es, eine beliebige Datei .txt zu nennen, damit der
  // Leser in app.js sie als Text in den Prompt zieht - und ein 300-MB-"Bild" bliebe beim
  // Verkleinern hängen. Das Ergebnis steht sichtbar an der Konsole statt in einer Konsole.
  const FILE_MAX=12*1024*1024;
  const FILE_NAME=/\.(png|jpe?g|webp|pdf|txt|md|csv|json)$/i;
  async function fileLooksReal(file){
    const head=new Uint8Array(await file.slice(0,16).arrayBuffer());
    const hex=[...head].map(byte=>byte.toString(16).padStart(2,'0')).join('');
    if(/\.png$/i.test(file.name))return hex.startsWith('89504e470d0a1a0a');
    if(/\.jpe?g$/i.test(file.name))return hex.startsWith('ffd8ff');
    if(/\.webp$/i.test(file.name))return hex.startsWith('52494646')&&hex.slice(16,24)==='57454250';
    if(/\.pdf$/i.test(file.name))return hex.startsWith('255044462d');
    // Textformate haben keine Signatur, dafür keine Steuerzeichen. Eine umbenannte
    // Programmdatei fällt hier durch, weil sie voller Nullbytes steckt.
    const sample=new Uint8Array(await file.slice(0,4096).arrayBuffer());
    return !sample.some(byte=>byte===0||byte<9||(byte>13&&byte<32));
  }
  function attachNote(text,state){
    const list=$('#promptAttachList');if(!list)return;
    let note=$('#promptAttachFileNote',list);
    if(!text){note?.remove();return}
    if(!note){note=document.createElement('small');note.id='promptAttachFileNote';note.className='prompt-attach-note';list.prepend(note)}
    note.textContent=text;
    if(state)note.dataset.state=state;else delete note.dataset.state;
    list.hidden=false;
  }
  function attachFile(){
    const target=$('#imageInput');
    if(!target){message('Anhänge stehen im Projekt bereit.');return}
    let input=$('#promptAttachFile');
    if(!input){
      input=document.createElement('input');
      input.type='file';input.id='promptAttachFile';input.multiple=true;input.hidden=true;
      input.accept=target.getAttribute('accept')||'';
      input.addEventListener('change',()=>checkFiles(input,target));
      document.body.appendChild(input);
    }
    input.value='';input.click();
  }
  async function checkFiles(input,target){
    const files=[...(input.files||[])];
    input.value='';
    if(!files.length)return;
    attachNote(files.length===1?'Datei wird geprüft …':`${files.length} Dateien werden geprüft …`,'busy');
    const good=[],bad=[];
    for(const file of files){
      if(!FILE_NAME.test(file.name)){bad.push(`${file.name}: dieses Format nehmen wir nicht an`);continue}
      if(!file.size){bad.push(`${file.name}: die Datei ist leer`);continue}
      if(file.size>FILE_MAX){bad.push(`${file.name}: größer als 12 MB`);continue}
      let real=false;
      try{real=await fileLooksReal(file)}catch{real=false}
      if(!real){bad.push(`${file.name}: Inhalt passt nicht zur Endung`);continue}
      good.push(file);
    }
    if(good.length){
      if(typeof DataTransfer==='function'){
        const box=new DataTransfer();
        for(const file of good)box.items.add(file);
        target.files=box.files;target.dispatchEvent(new Event('change',{bubbles:true}));
      }else bad.push('Dieser Browser kann geprüfte Dateien nicht übergeben.');
    }
    if(bad.length)attachNote(bad.slice(0,3).join(' · '),'error');
    else{attachNote('');setTimeout(syncAttachments,200)}
  }
  function attachUrl(){
    const list=$('#promptAttachList');if(!list)return;
    let row=$('.prompt-attach-input',list);
    if(!row){
      row=document.createElement('div');row.className='prompt-attach-input';
      row.innerHTML='<input type="url" placeholder="https://beispiel.de" aria-label="Link einfügen"><button type="button">Übernehmen</button>';
      list.prepend(row);list.hidden=false;
      // Bisher ging jede Eingabe ungeprueft weiter. Die eigentliche Pruefung sitzt in app.js an
      // einem Feld, das auf der Startseite gar nicht sichtbar ist - eine Fehlermeldung dort sieht
      // niemand. Also wird hier geprueft, wo getippt wurde, und der Zustand steht daneben.
      const note=document.createElement('small');note.className='prompt-attach-note';row.appendChild(note);
      const fail=text=>{note.textContent=text;note.dataset.state='error';$('input',row).focus();return false};
      const apply=()=>{
        const input=$('input',row),raw=input.value.trim();
        if(!raw){row.remove();return}
        if(/\s/.test(raw))return fail('Bitte nur eine Adresse ohne Leerzeichen.');
        let url;
        try{url=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:`https://${raw}`)}catch{return fail('Das ist keine Adresse. Beispiel: https://beispiel.de')}
        if(!/^https?:$/i.test(url.protocol))return fail('Nur Adressen mit http oder https sind moeglich.');
        if(!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname))return fail('Die Adresse hat keinen gueltigen Namen, z. B. beispiel.de');
        note.dataset.state='busy';note.textContent='Link wird geprueft \u2026';
        const field=$('#referenceUrl');if(field){field.value=url.href;$('#addUrlBtn')?.click()}
        setTimeout(()=>{row.remove();syncAttachments()},400);
      };
      $('button',row).addEventListener('click',apply);
      $('input',row).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply()}if(e.key==='Escape')row.remove()});
    }
    list.hidden=false;$('input',row).focus();
  }
  function message(text){const error=$('#promptCommandError');if(error)error.textContent=text}
  // Was in den echten Listen steht, steht auch hier - Reihenfolge und Anzahl inklusive.
  // Wie viele Anhänge der Tarif noch hergibt. Die Zahlen kommen aus app.js (window.PromptAiRefLimits),
  // damit hier keine zweite Ableitung des Tarifs entsteht, die irgendwann abweicht. Sie zählen mit,
  // sobald etwas dazukommt oder wegfällt.
  function syncAttachCounts(){
    const limits=window.PromptAiRefLimits;
    const fill=(id,used,limit)=>{
      const slot=$(`#${id}`);if(!slot)return;
      const button=slot.closest('button');
      if(!limits){slot.textContent='';if(button)delete button.dataset.full;return}
      const unlimited=!Number.isFinite(limit);
      slot.textContent=unlimited?`${used}/∞`:`${used}/${limit}`;
      if(button){if(!unlimited&&used>=limit)button.dataset.full='1';else delete button.dataset.full}
    };
    // Bilder und Dokumente teilen sich den Weg "Bild oder Datei"; die Grenze zählt die Bilder.
    fill('promptAttachCountFile',Number(limits?.images||0),limits?.imageLimit);
    fill('promptAttachCountUrl',Number(limits?.urls||0),limits?.urlLimit);
  }

  function syncAttachments(){
    syncAttachCounts();
    const list=$('#promptAttachList');if(!list)return;
    const items=[];
    for(const [selector,kind] of [['#urlReferences','link'],['#imageReferences','bild'],['#documentReferences','datei']]){
      const host=document.querySelector(selector);if(!host)continue;
      for(const node of host.children){
        // Der Name steht im <strong> des Eintrags; das <span> davor ist nur die Marke
        // ("URL"), und die als Kachelbeschriftung zu nehmen wäre für jeden Anhang dasselbe.
        const label=(node.querySelector('strong')?.textContent||node.querySelector('figcaption')?.textContent||node.getAttribute('data-reference-label')||'').trim();
        if(label)items.push({kind,label:label.slice(0,42),node});
      }
    }
    for(const chip of [...list.querySelectorAll('.prompt-attach-chip')])chip.remove();
    for(const item of items){
      const chip=document.createElement('span');chip.className='prompt-attach-chip';chip.dataset.kind=item.kind;
      chip.innerHTML=`<b></b><button type="button" aria-label="Entfernen">×</button>`;
      chip.querySelector('b').textContent=item.label;
      chip.querySelector('button').addEventListener('click',()=>{
        const remove=item.node.querySelector('.remove-btn,[data-remove-url],[data-remove-image],[data-remove-document]');
        if(remove)remove.click();else item.node.remove();
        setTimeout(syncAttachments,120);
      });
      list.appendChild(chip);
    }
    list.hidden=!items.length&&!$('.prompt-attach-input',list)&&!$('#promptAttachFileNote',list);
  }

  // Vorlagen und Skills gibt es bereits: die Vorlage als <select id="templateSelect">, die
  // Skills als Reihen mit Kontrollkästchen in #skillSelection. Beide Menüs hier lesen genau
  // diese Elemente und bedienen sie - keine zweite Liste, keine zweite Sperre.
  // Eigene Vorlagen und Skills gehören beide zu planRules().modules bzw. libraryItems - im
  // kostenlosen Tarif also gesperrt. Der Hinweis stand bisher nur beim Ablauf; hier bekommt er
  // denselben Platz, damit man vor dem Tippen sieht, was zum Tarif gehört.
  const planIsFree=()=>{const a=window.PromptAiAccess||{};return !a.isAdmin&&String(a.plan||'free')==='free'};
  function markSectionTier(menuId,tier){
    const section=$(`#${menuId}`)?.closest('.prompt-setup-section'),head=section?.querySelector('b');
    if(!head)return;
    let flag=head.querySelector('.tier-flag');
    if(!tier){flag?.remove();return}
    if(!flag){flag=document.createElement('i');flag.className='tier-flag';head.appendChild(flag)}
    if(flag.textContent!==tier)flag.textContent=tier;
  }
  // Wie oft ein Eintrag schon aktiviert wurde. Bei dreissig Skills und ebenso vielen Vorlagen
  // waere die Liste sonst eine Rolltreppe. Sichtbar sind darum hoechstens zehn - die
  // meistgenutzten und alles, was gerade aktiv ist -, der Rest steht hinter "Mehr …".
  const USE_KEY='prompt-ai-picker-use-v1',PICKER_LIMIT=10;
  function useCounts(){try{const raw=JSON.parse(localStorage.getItem(USE_KEY)||'{}');return raw&&typeof raw==='object'?raw:{}}catch{return{}}}
  function countUse(kind,id){
    if(!id)return;
    const all=useCounts(),key=`${kind}:${id}`;
    all[key]=(Number(all[key])||0)+1;
    try{localStorage.setItem(USE_KEY,JSON.stringify(all))}catch{}
  }
  // Aktive Eintraege muessen sichtbar bleiben, auch wenn sie selten benutzt werden - sonst
  // stuende in den Settings ein Haken, den man nirgends wiederfindet.
  function topEntries(kind,entries){
    const counts=useCounts();
    const ranked=entries
      .map((entry,index)=>({entry,index,used:Number(counts[`${kind}:${entry.id}`]||0)}))
      .sort((a,b)=>(b.used-a.used)||(a.index-b.index))
      .map(item=>item.entry);
    if(ranked.length<=PICKER_LIMIT)return {shown:ranked,rest:0};
    const head=ranked.slice(0,PICKER_LIMIT),missing=ranked.slice(PICKER_LIMIT).filter(entry=>entry.checked);
    const shown=missing.length?head.slice(0,Math.max(1,PICKER_LIMIT-missing.length)).concat(missing):head;
    return {shown,rest:ranked.length-shown.length};
  }
  function pickerButton(entry){
    const button=document.createElement('button');
    button.type='button';button.setAttribute('role',entry.role||'menuitemradio');
    button.setAttribute('aria-checked',String(Boolean(entry.checked)));
    if(entry.always)button.dataset.always='1';
    if(entry.locked){button.dataset.locked='1';button.dataset.tier=entry.tier||'ab Pro'}
    const label=document.createElement('span');label.textContent=entry.label;button.appendChild(label);
    if(entry.note){const note=document.createElement('small');note.textContent=entry.note;button.appendChild(note)}
    button.addEventListener('click',()=>entry.select());
    return button;
  }
  function paintPicker(menu,kind,entries){
    menu.innerHTML='';
    const {shown,rest}=topEntries(kind,entries);
    for(const entry of shown)menu.appendChild(pickerButton(entry));
    if(!rest)return;
    const more=document.createElement('button');
    more.type='button';more.className='prompt-setup-more';
    more.textContent=`Mehr … (${rest} weitere)`;
    more.addEventListener('click',()=>openPicker(kind));
    menu.appendChild(more);
  }
  // Das vollstaendige Fenster zeigt dieselben Eintraege ohne Deckelung - eine Liste, zwei Orte.
  function openPicker(kind){
    const spec=PICKERS[kind];if(!spec)return;
    let dialog=$('#promptPickerDialog');
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.id='promptPickerDialog';dialog.className='prompt-picker-dialog prompt-own-style';
      dialog.innerHTML='<div class="prompt-picker-frame"><header><div><b></b><small></small></div><button type="button" data-close aria-label="Schließen">×</button></header><div class="prompt-picker-dialog-body"><div class="prompt-setup-section" id="promptPickerList"></div></div></div>';
      dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-close]'))dialog.close()});
      document.body.appendChild(dialog);
    }
    dialog.dataset.pickerKind=kind;
    dialog.querySelector('b').textContent=spec.title;
    dialog.querySelector('small').textContent=spec.hint;
    paintPickerDialog();
    if(!dialog.open)dialog.showModal();
  }
  function paintPickerDialog(){
    const dialog=$('#promptPickerDialog');if(!dialog)return;
    const spec=PICKERS[dialog.dataset.pickerKind||''],list=dialog.querySelector('#promptPickerList');
    if(!spec||!list)return;
    const entries=spec.entries();
    list.innerHTML='';
    if(!entries.length){list.innerHTML=`<p class="prompt-picker-empty">${spec.empty}</p>`;return}
    for(const entry of entries)list.appendChild(pickerButton(entry));
  }
  const pickerOpen=()=>Boolean($('#promptPickerDialog')?.open);

  function templateEntries(){
    const select=document.querySelector('#templateSelect');
    if(!select)return [];
    const current=select.value;
    return [...select.options].map(option=>{
      const text=(option.textContent||'').trim(),parts=text.split(' · ');
      const id=option.value||text;
      return {
        id,label:parts[0]||'Vorlage',note:parts.slice(1).join(' · '),
        checked:option.value===current,role:'menuitemradio',
        select(){
          select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));
          if(option.value)countUse('template',id);
          setTimeout(()=>{syncTemplateMenu();syncSetupSummary()},80);
        }
      };
    });
  }
  function skillEntries(){
    const host=document.querySelector('#skillSelection');
    return [...(host?.querySelectorAll('.selection-row')||[])].map(row=>{
      const box=row.querySelector('input[type="checkbox"]');
      const name=(row.querySelector('strong')?.textContent||'Skill').trim();
      const scope=(row.querySelector('code')?.textContent||'').trim();
      const trigger=(row.querySelector('p')?.textContent||'').split(' · Quelle:')[0].trim();
      const note=[scope==='ALLE'?'Alle Agents':scope,trigger].filter(Boolean).join(' · ');
      return {
        id:name,label:name.slice(0,44),note:note.slice(0,84),
        checked:Boolean(box?.checked),always:Boolean(box?.disabled),role:'menuitemcheckbox',
        select(){
          if(box&&!box.disabled){box.click();if(box.checked)countUse('skill',name)}
          setTimeout(()=>{syncSkillsMenu();syncSetupSummary()},80);
        }
      };
    });
  }
  function syncTemplateMenu(){
    const menu=$('#promptTemplateMenu');
    if(!menu)return;
    markSectionTier('promptTemplateMenu',planIsFree()?'ab Pro':'');
    const entries=templateEntries();
    if(!entries.length)menu.innerHTML='<p class="prompt-picker-empty">Vorlagen stehen im Projekt bereit.</p>';
    else paintPicker(menu,'template',entries);
    if(pickerOpen())paintPickerDialog();
    syncSetupSummary();
  }
  function syncSkillsMenu(){
    const menu=$('#promptSkillsMenu'),host=document.querySelector('#skillSelection');
    if(!menu)return;
    markSectionTier('promptSkillsMenu',planIsFree()?'ab Pro':'');
    const locked=host?.querySelector('.feature-lock-note');
    if(locked){menu.innerHTML='<p class="prompt-picker-empty">'+(locked.querySelector('strong')?.textContent||'Skills sind in diesem Tarif nicht aktiv.')+'</p>';return}
    const entries=skillEntries();
    if(!entries.length)menu.innerHTML=`<p class="prompt-picker-empty">Noch keine Skills für ${agentLabel(activeAgent())}. Bibliothek → Agent-Skills.</p>`;
    else paintPicker(menu,'skill',entries);
    if(pickerOpen())paintPickerDialog();
  }

  // Ziel-KI. Es ist immer genau eine aktiv - der Master-Prompt wird für sie gebaut, und zur
  // Auswahl stehen ihre Skills plus die globalen. Die echte Wahl sitzt in #agentSelector; hier
  // wird sie bedient und nicht nachgebaut, sonst gäbe es zwei Wahrheiten und zwei Tarifsperren.
  const AGENT_LABEL={codex:'Codex',claude:'Claude Code',gemini:'Gemini',chatgpt:'ChatGPT',cursor:'Cursor',v0:'v0',universal:'Universal'};
  const AGENT_NOTE={codex:'Kompaktes Markdown, Skills für Codex',claude:'Prompt in XML-Abschnitten, Skills für Claude',gemini:'Kompaktes Markdown, Skills für Gemini',chatgpt:'Kompaktes Markdown, Skills für ChatGPT',cursor:'Kompaktes Markdown, Skills für Cursor',v0:'Kompaktes Markdown, Skills für v0',universal:'Neutrale Fassung für jedes Werkzeug'};
  // Die Ziel-KI ist in jedem Tarif frei wählbar (PLAN_RULES.agents in app.js). Die Tabelle bleibt
  // leer, aber stehen: kommt je ein Ziel dazu, das an einen Tarif gebunden ist, gehört es hierher.
  const AGENT_TIER={};
  const agentButton=key=>document.querySelector(`#agentSelector button[data-agent="${key}"]`);
  const agentAllowed=key=>{const button=agentButton(key);return button?!button.hidden:key==='codex'};
  function activeAgent(){return document.querySelector('#agentSelector button[data-agent].active')?.dataset.agent||'codex'}
  function agentLabel(key){return AGENT_LABEL[key]||'Codex'}
  function agentEntries(){
    const current=activeAgent();
    return Object.keys(AGENT_LABEL).map(key=>({
      id:key,label:AGENT_LABEL[key],note:AGENT_NOTE[key],checked:key===current,
      locked:!agentAllowed(key),tier:AGENT_TIER[key]||'ab Pro',role:'menuitemradio',
      select(){selectAgent(key)}
    }));
  }
  function selectAgent(key){
    const button=agentButton(key);
    if(!button||button.hidden){document.querySelector('#plansDialog')?.showModal();return}
    if(!button.classList.contains('active'))button.click();
    // app.js schreibt bei diesem Klick die Skill-Liste neu - nur noch die Skills dieser KI plus
    // die globalen - und legt die Wahl in den Projektstand. Beides braucht einen Tick.
    setTimeout(()=>{syncAgentMenu();syncSkillsMenu();syncSetupSummary()},90);
  }
  function syncAgentMenu(){
    const menu=$('#promptAgentMenu');if(!menu)return;
    menu.innerHTML='';
    for(const entry of agentEntries())menu.appendChild(pickerButton(entry));
  }

  const PICKERS={
    template:{title:'Alle Vorlagen',hint:'Es gilt genau eine Vorlage pro Auftrag. In den Settings stehen die zehn, die du am häufigsten nimmst.',empty:'Vorlagen stehen im Projekt bereit.',entries:templateEntries},
    skill:{title:'Alle Skills',hint:'Skills gelten zusätzlich zum Master-Prompt, sobald ihr Auslöser zur Aufgabe passt. Angezeigt werden die Skills der gewählten Ziel-KI und die globalen.',empty:'Noch keine Skills angelegt. Bibliothek → Agent-Skills.',entries:skillEntries}
  };

  const FLOW_KEY='prompt-ai-flow-mode-v1';
  const FLOW_LABEL={guided:'Mit Rückfragen',auto:'Ohne Rückfragen',expert:'Selbst einstellen'};
  function flowMode(){try{const v=localStorage.getItem(FLOW_KEY);if(FLOW_LABEL[v])return v}catch{}return 'guided'}
  // Der gespeicherte Arbeitsstand merkt sich, in welchem Ablauf er entstanden ist. In der Zeile
  // "Letztes Projekt" stand das bisher nicht - man sah erst nach dem Weiterarbeiten, ob der Stand
  // mit Rueckfragen, ohne Rueckfragen oder selbst eingestellt begonnen wurde. Faellt der Eintrag
  // aus, gilt der aktuell eingestellte Ablauf.
  const CHECKPOINT_KEY='prompt-ai-ui-checkpoint-v2';
  function lastProjectFlow(){
    try{const saved=JSON.parse(localStorage.getItem(CHECKPOINT_KEY)||'null');if(FLOW_LABEL[saved?.mode])return saved.mode}catch{}
    return flowMode();
  }
  // Die drei Abläufe gibt es bereits als .mode-switch in der Kopfzeile. Das Menü hier bedient
  // genau diese Knöpfe; ein nachgebauter Schalter hieße, jede Sperre und jede Folgeregel ein
  // zweites Mal zu pflegen.
  function applyFlow(mode){
    const button=$(`.mode-switch button[data-mode="${mode}"]`);
    if(button&&!button.classList.contains('active')&&!button.disabled&&!button.classList.contains('locked'))button.click();
  }
  const flowLocked=mode=>{const b=$(`.mode-switch button[data-mode="${mode}"]`);return Boolean(b&&(b.disabled||b.classList.contains('locked')))};
  function selectFlow(mode){
    if(!FLOW_LABEL[mode])return;
    // Gesperrte Abläufe werden nicht heimlich übersprungen: der echte Knopf wird gedrückt,
    // damit die App selbst zeigt, was dafür fehlt - und die Wahl wird nicht gemerkt, sonst
    // stünde unten ein Ablauf, der gar nicht gilt.
    if(flowLocked(mode)){
      const button=$(`.mode-switch button[data-mode="${mode}"]`);button?.click();
      const error=$('#promptCommandError');
      if(error)error.textContent=button?.title||'Dieser Ablauf gehört zu einem größeren Tarif.';
      return;
    }
    // Eine Einstellung ist kein Start: wer hier den Ablauf umstellt, will die Startseite behalten.
    // Der echte Schalter oeffnet je nach Ablauf den Arbeitsbereich - das wird danach zurueckgeholt.
    const wasHome=homeVisible();
    applyFlow(mode);
    if(wasHome){
      const flow=$('#workflowApp'),page=$('#welcomePage');
      if(flow&&!flow.hidden){flow.hidden=true;if(page)page.hidden=false}
    }
    // Erst merken, wenn der echte Schalter wirklich umgesprungen ist. app.js lehnt einen
    // Ablauf ab, der nicht zum Tarif gehört (setMode öffnet dann die Tarifseite) - ohne
    // diese Prüfung stünde unten ein Ablauf, der gar nicht gilt.
    const active=$('.mode-switch button.active')?.dataset.mode;
    if(active&&active!==mode){syncFlowUi();return}
    try{localStorage.setItem(FLOW_KEY,mode)}catch{}
    syncFlowUi();
  }
  const FLOW_NOTE={guided:'Fragt nur nach, wo es das Ergebnis ändert',auto:'Briefing rein, Prompt raus',expert:'Alle Schritte bleiben offen'};
  // Welcher Tarif den Ablauf tatsächlich freischaltet - dieselbe Reihenfolge wie PLAN_RULES.modes
  // in app.js (free: guided, pro: +auto, ultimate: +expert). Vorher stand pauschal "ab Pro" an
  // jedem gesperrten Eintrag, also auch an "Selbst einstellen", das es erst ab Ultimate gibt.
  // "Mit Rueckfragen" ist in Free enthalten - genau das sagt auch die Auswahl beim Projektstart.
  // Hier stand trotzdem "ab Pro" am Eintrag. Sichtbar wurde es nur nicht, weil das Schild an
  // der Sperre haengt und dieser Eintrag nie gesperrt ist; falsch war es trotzdem.
  const FLOW_TIER={guided:'',auto:'ab Pro',expert:'ab Ultimate'};
  function syncFlowUi(){
    const menu=$('#promptFlowMenu');if(!menu)return;
    let mode=flowMode();
    if(flowLocked(mode)){mode='guided';try{localStorage.setItem(FLOW_KEY,mode)}catch{}}
    menu.innerHTML='';
    for(const key of ['guided','auto','expert']){
      const button=document.createElement('button');
      button.type='button';button.setAttribute('role','menuitemradio');
      button.dataset.flowMode=key;button.setAttribute('aria-checked',String(key===mode));
      button.dataset.locked=flowLocked(key)?'1':'0';
      button.dataset.tier=FLOW_TIER[key]||'ab Pro';
      button.innerHTML='<span></span><small></small>';
      button.querySelector('span').textContent=FLOW_LABEL[key];
      button.querySelector('small').textContent=FLOW_NOTE[key];
      button.addEventListener('click',()=>selectFlow(key));
      menu.appendChild(button);
    }
    syncSetupSummary();
  }
  // Der Stand steht als Satz in der Zeile - man sieht ihn, ohne etwas zu öffnen.
  function syncSetupSummary(){
    const out=$('#promptSetupSummary');if(!out)return;
    // Beim freien Prompt sagen Agent und Ablauf nichts - dort zaehlen Ausgabetyp und Werkzeug.
    const mode=$('.prompt-command-home')?.dataset.commandMode||'website';
    if(mode==='free'){
      const category=document.querySelector('#freePromptCategory'),tool=document.querySelector('#freePromptTool');
      const label=[category?.selectedOptions?.[0]?.textContent,tool?.value].filter(Boolean).join(' · ');
      if(label){
        if(out.textContent!==label)out.textContent=label;
        const button=$('#promptSetupButton');
        if(button){const title=`Settings für diesen Auftrag: ${label}`;if(button.title!==title){button.title=title;button.setAttribute('aria-label',title)}}
        return;
      }
    }
    const parts=[agentLabel(activeAgent()),FLOW_LABEL[flowMode()]];
    const select=document.querySelector('#templateSelect');
    if(select?.value){const name=(select.options[select.selectedIndex]?.textContent||'').split(' · ')[0].trim();if(name)parts.push(name)}
    const skills=[...document.querySelectorAll('#skillSelection .selection-row input[type="checkbox"]')].filter(b=>b.checked).length;
    if(skills)parts.push(skills===1?'1 Skill':skills+' Skills');
    const text=parts.join(' · ');
    if(out.textContent!==text)out.textContent=text;
    // Oben rechts ist nur noch Platz fuer das Zahnrad. Damit der eingestellte Stand trotzdem
    // ablesbar bleibt, steht er im Titel des Knopfes und in seiner Beschriftung fuer Vorleser.
    const button=$('#promptSetupButton');
    if(button){const label=`Settings für diesen Auftrag: ${text}`;if(button.title!==label){button.title=label;button.setAttribute('aria-label',label)}}
  }

  function titleCase(value){return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,char=>char.toUpperCase())}
  function firstName(value){return titleCase(value).split(/\s+/)[0]||''}
  function resolvedName(){const cloud=window.SiteBriefCloud||{},user=cloud.user||{},meta=user.user_metadata||{};const values=[$('#userDisplayName')?.value,window.PromptAiUserProfile?.displayName,cloud.userProfile?.displayName,cloud.profile?.displayName,meta.display_name,meta.full_name,meta.name];for(const value of values){const name=firstName(value);if(name)return name}const email=String(user.email||'').trim();return email?firstName(email.split('@')[0]):''}
  // Frueher hing das zusaetzlich davon ab, dass der Ablauf versteckt ist - ein Zirkel: der
  // CSS-Riegel, der den Ablauf unter der Startseite wegnimmt, haengt an dieser Klasse, und die
  // fiel genau dann weg, wenn der Ablauf sichtbar wurde. Beides zugleich war damit moeglich.
  // Die Startseite ist der Zustand, sobald ihre Seite steht; alles andere folgt daraus.
  function homeVisible(){const page=$('#welcomePage');return Boolean(page&&!page.hidden&&getComputedStyle(page).display!=='none')}
  // Same fallback order the project list already uses (app.js): a project name, then a client
  // name, then the description itself. Most projects start from the console's free-text
  // description alone, with neither name field ever filled in - without this fallback the
  // "Letztes Projekt" row stayed hidden for exactly that, the most common, case.
  // Frueher las diese Zeile den Speicher selbst und kannte nur zwei der drei Stellen, an denen
  // ein Projektname stehen kann - deshalb blieb "Letztes Projekt" oft leer, obwohl etwas da war.
  function projectTitle(){return window.PromptAiProjectState?.title?.()||''}

  function ensureThemeToggle(){const actions=$('.topbar .top-actions');if(!actions)return;let button=$('#homeThemeToggle');if(!button){button=document.createElement('button');button.id='homeThemeToggle';button.type='button';button.className='home-theme-toggle';button.addEventListener('click',()=>$('#themeToggleBtn')?.click());actions.insertBefore(button,$('#topbarMenuToggle'))}const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'☀':'◐';button.title=dark?'Helles Design':'Dunkles Design';button.setAttribute('aria-label',button.title)}

  function markup(){return `<section class="prompt-command-home" aria-label="Prompt.ai Start"><header class="prompt-home-intro"><span class="prompt-system-line">Workspace bereit</span><h1>Hallo <span id="promptHomeName">Lars</span>.</h1><p>Was möchtest du heute umsetzen?</p></header><form class="prompt-command-panel" id="promptCommandForm"><div class="prompt-command-top"><button class="prompt-mode-button" id="promptModeButton" type="button" aria-haspopup="listbox" aria-expanded="false">${icons.website}<span id="promptModeLabel">Internetseite erstellen</span><i class="mode-chevron" aria-hidden="true"></i></button><div class="prompt-mode-menu" id="promptModeMenu" role="listbox" aria-label="Arbeitsart wählen" hidden><button type="button" class="prompt-mode-option" role="option" data-command-mode="website" aria-checked="true">${icons.website}<span>Internetseite erstellen<small>Neues Website-Projekt</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="free" aria-checked="false">${icons.prompt}<span>Freier Prompt<small>Text, Bild, Video, Code & mehr</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="revision" data-locked="0" aria-checked="false">${icons.revision}<span>Website überarbeiten<small>Bestehende Seite gezielt ändern</small></span></button><button type="button" class="prompt-mode-option" role="option" data-command-mode="check" data-locked="0" aria-checked="false">${icons.shield}<span>Projekt prüfen<small>Aktuellen Stand prüfen lassen</small></span></button></div><button type="button" class="prompt-setup-line" id="promptSetupButton" aria-haspopup="dialog" aria-expanded="false" title="Settings" aria-label="Settings für diesen Auftrag"><svg class="prompt-setup-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 4.2v2M12 17.8v2M4.2 12h2M17.8 12h2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4"/></svg><span id="promptSetupSummary">Codex · Mit Rückfragen</span><i class="mode-chevron" aria-hidden="true"></i></button></div><textarea class="prompt-command-input" id="promptCommandInput" rows="5" minlength="8" placeholder="Beschreibe kurz, was entstehen soll …" aria-label="Projekt oder Aufgabe beschreiben"></textarea><button class="prompt-command-submit" id="promptCommandSubmit" type="submit" aria-label="Absenden"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5.5a2.5 2.5 0 0 1-2.5 2.5H5"/><path d="m9 10-4 4 4 4"/></svg></button><div class="prompt-attach-list" id="promptAttachList" aria-live="polite"></div><footer class="prompt-command-meta"><button type="button" class="prompt-attach-button" id="promptAttachButton" aria-haspopup="menu" aria-expanded="false" title="Anhang hinzufügen">+</button><div class="prompt-attach-menu" id="promptAttachMenu" role="menu" hidden><button type="button" role="menuitem" data-attach="file"><span>Bild oder Datei</span><i class="prompt-attach-count" id="promptAttachCountFile"></i></button><button type="button" role="menuitem" data-attach="url"><span>Link einfügen</span><i class="prompt-attach-count" id="promptAttachCountUrl"></i></button></div><dialog class="prompt-setup-sheet prompt-picker-dialog prompt-own-style" id="promptSetupSheet" aria-label="Settings für diesen Auftrag"><div class="prompt-picker-frame"><header><button type="button" class="prompt-setup-back" id="promptSetupBack" aria-label="Zurück zur Übersicht"><span aria-hidden="true">←</span> Bereiche</button><div><b>Settings für diesen Auftrag</b><small>Es ist immer genau eine Ziel-KI aktiv; welche Skills zur Wahl stehen und wie der Master-Prompt aufgebaut wird, richtet sich nach ihr. Was hier steht, gilt auch beim nächsten Auftrag.</small></div><button type="button" data-close aria-label="Schließen">×</button></header><div class="prompt-picker-dialog-body prompt-setup-grid"><nav class="prompt-setup-rail" id="promptSetupRail" aria-label="Einstellungsbereiche"><button type="button" class="prompt-setup-tab" data-setup-tab="agent"><b>Ziel-KI</b><small>Welche KI den Prompt bekommt</small></button><button type="button" class="prompt-setup-tab" data-setup-tab="flow"><b>Ablauf</b><small>Wie viel Prompt.ai selbst entscheidet</small></button><button type="button" class="prompt-setup-tab" data-setup-tab="template"><b>Vorlage</b><small>Fertiger Aufbau als Startpunkt</small></button><button type="button" class="prompt-setup-tab" data-setup-tab="skills"><b>Skills</b><small>Zusatzwissen für die Ziel-KI</small></button><button type="button" class="prompt-setup-tab" data-setup-tab="output"><b>Ausgabetyp</b><small>Was entstehen soll</small></button><button type="button" class="prompt-setup-tab" data-setup-tab="tool"><b>Ziel-Tool</b><small>Wofür der Prompt geschrieben wird</small></button></nav><div class="prompt-setup-panes"><div class="prompt-setup-section" data-setup-pane="agent"><b>Ziel-KI</b><div id="promptAgentMenu"></div></div><div class="prompt-setup-section" data-setup-pane="flow"><b>Ablauf</b><div id="promptFlowMenu"></div></div><div class="prompt-setup-section" data-setup-pane="template"><b>Vorlage</b><div id="promptTemplateMenu"></div></div><div class="prompt-setup-section" data-setup-pane="skills"><b>Skills</b><div id="promptSkillsMenu"></div></div><div class="prompt-setup-section" data-setup-pane="output"><b>Ausgabetyp</b><div id="promptOutputMenu"></div></div><div class="prompt-setup-section" data-setup-pane="tool"><b>Ziel-Tool</b><div id="promptToolMenu"></div></div></div></div></div></dialog><span id="promptHomeMeta">Kontingent wird geladen</span><span class="prompt-plan-chip"><b id="promptHomePlan">Free</b></span><span class="prompt-command-error" id="promptCommandError" role="status"></span></footer></form><section class="prompt-latest" aria-label="Letztes Projekt"><span class="prompt-latest-icon">${icons.folder}</span><div class="prompt-latest-copy"><strong>Letztes Projekt</strong><small id="promptLatestTitle">Gespeicherten Arbeitsstand fortsetzen</small></div><button type="button" class="prompt-latest-action" id="promptLatestAction">Weiterarbeiten →</button></section></section>`}
  function ensureHome(){const page=$('#welcomePage');if(!page)return null;let home=$('.prompt-command-home',page);if(!home){page.insertAdjacentHTML('beforeend',markup());home=$('.prompt-command-home',page);bindHome(home)}return home}
  function modeCopy(mode){return mode==='free'?{label:'Freier Prompt',placeholder:'Beschreibe, welchen Prompt du brauchst …',icon:icons.prompt}:mode==='revision'?{label:'Website überarbeiten',placeholder:'Was soll an der bestehenden Website geändert werden?',icon:icons.revision}:{label:'Internetseite erstellen',placeholder:'Beschreibe kurz, was entstehen soll …',icon:icons.website}}
  function closeModeMenu(home){const menu=$('#promptModeMenu',home);if(menu)menu.hidden=true;$('#promptModeButton',home)?.setAttribute('aria-expanded','false')}
  // Revision und Prüfen sind ab Pro - dieselbe Regel wie bei den Werkzeug-Kacheln auf der
  // Startseite, nur direkt aus dem Konsolen-Menü gelesen statt aus deren DOM-Sperre.
  function commandModeLocked(mode){
    if(mode!=='revision'&&mode!=='check')return false;
    const access=window.PromptAiAccess||{};
    return !access.isAdmin&&(access.plan||'free')==='free';
  }
  // Welcher Tarif noetig ist, steht am Eintrag selbst - vorher stand "PRO" fest in der
  // Stilregel. Solange nur Ueberarbeiten und Pruefen gesperrt sind, ist das dasselbe; beim
  // naechsten Eintrag ab Ultimate waere es eine falsche Auskunft gewesen.
  const MODE_TIER={revision:'PRO',check:'PRO'};
  function syncModeMenuLocks(home){
    home.querySelectorAll('[data-command-mode]').forEach(option=>{
      const mode=option.dataset.commandMode;
      option.dataset.locked=commandModeLocked(mode)?'1':'0';
      option.dataset.tier=MODE_TIER[mode]||'PRO';
    });
  }
  function selectMode(mode){const home=ensureHome();if(!home)return;
    // Eine Fehlerzeile aus einem vorherigen Versuch (z.B. "Bitte kurz beschreiben") galt nur für
    // den Modus, in dem sie entstand - beim Wechsel muss sie mit weg, sonst klebt sie dauerhaft.
    const errorSlot=$('#promptCommandError',home);if(errorSlot)errorSlot.textContent='';
    // Gesperrt heisst hier: sofort der Tarifhinweis, kein stiller Wechsel und keine Vorschau
    // einer Funktion, die ohnehin nicht nutzbar ist.
    if(commandModeLocked(mode)){closeModeMenu(home);document.querySelector('#plansDialog')?.showModal();return}
    // Prüfen ist kein Schreibmodus - es gibt nichts zu beschreiben. Der Eintrag startet
    // die Prüfung direkt und lässt die eingestellte Arbeitsart stehen.
    if(mode==='check'){closeModeMenu(home);proxy('workspacePreviewBtn');return}
    home.dataset.commandMode=mode;home.dataset.modeTouched='1';const copy=modeCopy(mode),button=$('#promptModeButton',home);button.innerHTML=`${copy.icon}<span id="promptModeLabel">${copy.label}</span><i class="mode-chevron" aria-hidden="true"></i>`;button.setAttribute('aria-expanded','false');$('#promptModeMenu',home).hidden=true;$('#promptCommandInput',home).placeholder=copy.placeholder;syncMeta();home.querySelectorAll('[data-command-mode]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.commandMode===mode)));$('#promptCommandInput',home).focus()}
  async function submitCommand(event){event.preventDefault();applyFlow(flowMode());const home=ensureHome(),input=$('#promptCommandInput',home),error=$('#promptCommandError',home),mode=home.dataset.commandMode||'website',brief=input.value.trim();if(brief.length<8){error.textContent='Bitte kurz beschreiben.';input.focus();return}error.textContent='';const button=$('#promptCommandSubmit',home);button.disabled=true;try{if(window.PromptAiHomeEntry?.submitBrief)await window.PromptAiHomeEntry.submitBrief(mode,brief);else if(mode==='website')await window.PromptAiProjectStart?.startFromBrief?.(brief);else{window.PromptAiHomeEntry?.[mode==='free'?'openFreePrompt':'openRevision']?.();setTimeout(()=>{const field=$('#simpleIntakeText');if(field){field.value=brief;$('#simpleIntakeContinue')?.click()}},40)}}finally{setTimeout(()=>{button.disabled=false},350)}}
  // Ein leeres Feld mit einem festen Beispieltext sagt einmal, was hier hineingehört. Wechselnde
  // Beispiele zeigen die Spannbreite und dienen als Anregung. Beim Hineinklicken verschwindet der
  // Vorschlag, damit er nicht mit eigenem Text verwechselt wird; bleibt das Feld leer, kommt er
  // nach ein paar Sekunden zurück. Die Liste teilt sich mit der Einstiegsseite.
  function rotatePlaceholder(field){
    if(!field||field.__rotating)return;
    const examples=window.PromptAiExamples;
    if(!Array.isArray(examples)||!examples.length)return;
    field.__rotating=true;
    let index=Math.floor(Math.random()*examples.length),timer=0,idle=0,paused=false;
    const base='Beschreibe kurz, was entstehen soll …';
    const show=()=>{
      // Nur im Website-Modus: die anderen Arbeitsarten haben ihren eigenen Platzhalter.
      const home=field.closest('.prompt-command-home');
      if(paused||field.value||(home&&home.dataset.commandMode&&home.dataset.commandMode!=='website'))return;
      const item=examples[index%examples.length];
      field.placeholder=`z. B. ${item.head}${item.rest}`;
    };
    // Ein harter Textwechsel alle 3,8 Sekunden wirkt gehackt - der Satz springt einfach um.
    // Jetzt blendet der Platzhalter aus, wechselt im unsichtbaren Moment und blendet wieder ein,
    // und er steht dabei deutlich länger. Das Ausblenden macht CSS über die Platzhalterfarbe.
    const swap=()=>{
      const home=field.closest('.prompt-command-home');
      if(paused||field.value||(home&&home.dataset.commandMode&&home.dataset.commandMode!=='website'))return;
      field.classList.add('is-hint-fading');
      setTimeout(()=>{index++;show();field.classList.remove('is-hint-fading')},520);
    };
    const start=()=>{clearInterval(timer);show();timer=setInterval(swap,7200)};
    const stop=()=>{clearInterval(timer);timer=0};
    field.addEventListener('focus',()=>{paused=true;stop();field.placeholder=base});
    field.addEventListener('blur',()=>{clearTimeout(idle);idle=setTimeout(()=>{if(!field.value){paused=false;start()}},3000)});
    field.addEventListener('input',()=>{
      clearTimeout(idle);
      if(field.value){stop();return}
      // Wieder leer: nach drei Sekunden Ruhe kommen die Vorschläge zurück.
      idle=setTimeout(()=>{if(!field.value&&document.activeElement!==field){paused=false;start()}},3000);
    });
    start();
  }
  function proxy(id){const target=$(`#${id}`);if(!target)return;if(target.disabled||target.getAttribute('aria-disabled')==='true'){const message=target.title||'Diese Funktion ist in deinem Tarif noch nicht verfügbar.';const error=$('#promptCommandError');if(error)error.textContent=message;return}target.click()}
  // Die Startseite kam immer mit "Internetseite erstellen" hoch. Wer meistens freie Prompts
  // schreibt, musste das jedes Mal umstellen - deshalb ist die Arbeitsart jetzt eine
  // Voreinstellung. Ist sie im Tarif nicht enthalten, bleibt es beim Website-Modus, statt
  // dass die Startseite mit einem gesperrten Eintrag aufmacht.
  function preferredMode(){
    const wish=window.PromptAiPreferences?.defaultCommandMode||'website';
    if(wish==='check')return 'website';
    if(!['website','free','revision'].includes(wish))return 'website';
    return commandModeLocked(wish)?'website':wish;
  }
  // Wie selectMode, aber ohne Fokus in das Textfeld zu ziehen - beim Öffnen der Startseite
  // soll nichts springen.
  function applyPreferredMode(home){
    if(!home||home.dataset.modeTouched==='1')return;
    const mode=preferredMode();
    if(home.dataset.commandMode===mode)return;
    const copy=modeCopy(mode),button=$('#promptModeButton',home);if(!button)return;
    home.dataset.commandMode=mode;
    button.innerHTML=`${copy.icon}<span id="promptModeLabel">${copy.label}</span><i class="mode-chevron" aria-hidden="true"></i>`;
    const input=$('#promptCommandInput',home);if(input)input.placeholder=copy.placeholder;
    home.querySelectorAll('[data-command-mode]').forEach(option=>option.setAttribute('aria-checked',String(option.dataset.commandMode===mode)));
  }
  function bindHome(home){home.dataset.commandMode='website';$('#promptModeButton',home).addEventListener('click',()=>{const menu=$('#promptModeMenu',home),open=menu.hidden;menu.hidden=!open;$('#promptModeButton',home).setAttribute('aria-expanded',String(open))});home.querySelectorAll('[data-command-mode]').forEach(option=>option.addEventListener('click',()=>selectMode(option.dataset.commandMode)));$('#promptCommandForm',home).addEventListener('submit',submitCommand);
    // Unlike the attach- and setup-menus, this one never got a click-outside handler - it stayed
    // open no matter what else got clicked, including tapping straight into the textarea below it.
    document.addEventListener('click',event=>{
      // Nur echte Klicks schliessen. Die App klickt selbst - restore() in stability-ui.js stellt
      // nach dem Aufloesen der Sitzung den gespeicherten Ablauf ueber einen Klick her. Dieser
      // Klick hat das gerade geoeffnete Menue mitgerissen, ein bis zwei Sekunden nach dem
      // Oeffnen. Dieselbe Falle stand schon im Topbar-Menue.
      if(!event.isTrusted)return;
      if(event.target.closest?.('#promptModeButton,#promptModeMenu'))return;
      closeModeMenu(home);
    });
    // Die Zeile zeigte das letzte Projekt zwar an, war aber nie mit dem echten Knopf verbunden:
    // ein Klick - auf die Zeile wie auf "Weiterarbeiten" - tat schlicht gar nichts. Die ganze
    // Zeile ist jetzt die Schaltfläche, das ist die Trefferfläche, die man ohnehin anzielt.
    $('.prompt-latest',home)?.addEventListener('click',()=>{
      const target=$('#workspaceLastProjectBtn');
      if(!target)return;
      if(target.disabled||target.getAttribute('aria-disabled')==='true'){document.querySelector('#plansDialog')?.showModal();return}
      target.click();
    });
    $('#promptAttachButton',home).addEventListener('click',()=>{
      const menu=$('#promptAttachMenu',home),open=menu.hidden;
      menu.hidden=!open;$('#promptAttachButton',home).setAttribute('aria-expanded',String(open));
    });
    home.querySelectorAll('[data-attach]').forEach(button=>button.addEventListener('click',()=>{
      $('#promptAttachMenu',home).hidden=true;$('#promptAttachButton',home).setAttribute('aria-expanded','false');
      if(button.dataset.attach==='file')attachFile();else attachUrl();
    }));
    document.addEventListener('click',event=>{
      // Nur echte Klicks schliessen. Die App klickt selbst - restore() in stability-ui.js stellt
      // nach dem Aufloesen der Sitzung den gespeicherten Ablauf ueber einen Klick her. Dieser
      // Klick hat das gerade geoeffnete Menue mitgerissen, ein bis zwei Sekunden nach dem
      // Oeffnen. Dieselbe Falle stand schon im Topbar-Menue.
      if(!event.isTrusted)return;
      if(event.target.closest?.('#promptAttachButton,#promptAttachMenu'))return;
      const m=$('#promptAttachMenu',home);if(m)m.hidden=true;
      $('#promptAttachButton',home)?.setAttribute('aria-expanded','false');
    });
    for(const selector of ['#urlReferences','#imageReferences','#documentReferences']){
      const host=document.querySelector(selector);
      if(host)new MutationObserver(()=>setTimeout(syncAttachments,60)).observe(host,{childList:true,subtree:true});
    }
    const setupButton=$('#promptSetupButton',home),setupSheet=$('#promptSetupSheet',home);
    // Vier Spalten nebeneinander waren auf dem Telefon nicht zu bedienen und am Rechner nur eine
    // Wand aus Auswahlmoeglichkeiten. Jetzt stehen die Bereiche links untereinander und rechts
    // steht nur der eine, den man gerade einstellt. Auf dem Telefon liegen beide uebereinander:
    // erst die Bereiche, nach der Wahl der Bereich selbst, und "Bereiche" fuehrt zurueck.
    const narrow=()=>{try{return matchMedia('(max-width:860px)').matches}catch{return false}};
    // Welche Bereiche ueberhaupt zur Wahl stehen, haengt an der Arbeitsart. Beim freien Prompt
    // gibt es keine Vorlage, keine Skills und keine Rueckfragen - dafuer die zwei Angaben, die
    // dort wirklich zaehlen: was entstehen soll und fuer welches Werkzeug. Sie standen bisher nur
    // im Fragebogen, den der freie Prompt gar nicht mehr oeffnet.
    const SETUP_SCOPE={free:['output','tool'],website:['agent','flow','template','skills'],revision:['agent','flow','template','skills'],check:['agent','flow','template','skills']};
    function setupScope(){return SETUP_SCOPE[home.dataset.commandMode||'website']||SETUP_SCOPE.website}
    // Der Satz unter der Ueberschrift beschrieb Ziel-KI und Skills - beim freien Prompt gibt es
    // beides hier nicht, dort zaehlen Ausgabetyp und Werkzeug.
    const SETUP_NOTE={
      free:'Ausgabetyp und Ziel-Tool bestimmen, wie der Prompt aufgebaut wird. Was hier steht, gilt auch beim nächsten freien Prompt.',
      website:'Es ist immer genau eine Ziel-KI aktiv; welche Skills zur Wahl stehen und wie der Master-Prompt aufgebaut wird, richtet sich nach ihr. Was hier steht, gilt auch beim nächsten Auftrag.'
    };
    function syncSetupScope(){
      const note=setupSheet.querySelector('header small'),mode=home.dataset.commandMode||'website';
      const text=SETUP_NOTE[mode]||SETUP_NOTE.website;
      if(note&&note.textContent!==text)note.textContent=text;
      const allowed=new Set(setupScope());
      for(const tab of setupSheet.querySelectorAll('.prompt-setup-tab'))tab.hidden=!allowed.has(tab.dataset.setupTab);
      for(const pane of setupSheet.querySelectorAll('.prompt-setup-section'))pane.hidden=!allowed.has(pane.dataset.setupPane);
      const view=setupSheet.dataset.setupView;
      if(view&&!allowed.has(view))setupView(narrow()?'':setupScope()[0]);
    }
    // Die beiden Listen kommen aus den vorhandenen Auswahlfeldern des freien Prompts - keine
    // zweite Liste, die irgendwann von der echten abweicht.
    function freeSelect(id){window.PromptAiFreePrompt?.ensure?.();return document.querySelector(id)}
    function buildFreeMenu(hostId,selectId,onPick){
      const host=$(`#${hostId}`,setupSheet),select=freeSelect(selectId);
      if(!host||!select)return;
      const options=[...select.options];
      host.innerHTML='';
      for(const option of options){
        const button=document.createElement('button');
        button.type='button';button.setAttribute('role','menuitemradio');
        button.setAttribute('aria-checked',String(option.value===select.value));
        button.innerHTML='<span></span>';
        button.querySelector('span').textContent=option.textContent;
        button.addEventListener('click',()=>{
          select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));
          onPick?.();syncFreeMenus();syncSetupSummary();
        });
        host.appendChild(button);
      }
    }
    function syncFreeMenus(){
      if(home.dataset.commandMode!=='free')return;
      buildFreeMenu('promptOutputMenu','#freePromptCategory',()=>buildFreeMenu('promptToolMenu','#freePromptTool'));
      buildFreeMenu('promptToolMenu','#freePromptTool');
    }
    function setupView(view){
      setupSheet.dataset.setupView=view||'';
      for(const tab of setupSheet.querySelectorAll('.prompt-setup-tab'))tab.classList.toggle('active',tab.dataset.setupTab===view);
      const back=$('#promptSetupBack',setupSheet);if(back)back.hidden=!view||!narrow();
    }

    // Vier Abschnitte passen nicht unter die Konsole, ohne dass man scrollt oder etwas unter der
    // Fensterkante verschwindet - und scrollen war hier ausdrücklich nicht gewollt. Die Settings
    // nehmen darum die ganze Seite ein, wie jedes andere Fenster der App auch.
    // Das Fenster gehört nicht in die Konsolen-Form: ein Klick darin wäre sonst ein Absenden,
    // und ein Formular im Formular verwirft der Parser ohnehin.
    if(setupSheet.parentElement!==document.body)document.body.appendChild(setupSheet);
    setupSheet.querySelector('[data-close]')?.addEventListener('click',()=>setupSheet.close());
    for(const tab of setupSheet.querySelectorAll('.prompt-setup-tab'))tab.addEventListener('click',()=>setupView(tab.dataset.setupTab));
    $('#promptSetupBack',setupSheet)?.addEventListener('click',()=>setupView(''));
    setupButton.addEventListener('click',()=>{
      // Am Rechner steht sofort ein Bereich offen, auf dem Telefon zuerst die Uebersicht.
      syncSetupScope();syncFreeMenus();
      setupView(narrow()?'':setupScope()[0]);
      syncAgentMenu();syncFlowUi();syncTemplateMenu();syncSkillsMenu();
      if(!setupSheet.open)setupSheet.showModal();
      setupButton.setAttribute('aria-expanded','true');
    });
    setupSheet.addEventListener('close',()=>{setupButton.setAttribute('aria-expanded','false');syncSetupSummary()});
    // Klick auf die Fläche daneben schließt - dieselbe Geste wie beim Blatt vorher.
    setupSheet.addEventListener('click',event=>{if(event.target===setupSheet)setupSheet.close()});
    // Zeichen und Token laufen mit, waehrend man schreibt - syncMeta() kannte den Text schon,
    // es fehlte nur der Aufruf bei jedem Tastendruck. 'input' allein reicht auf dem Telefon nicht
    // zuverlaessig: Android-Tastaturen fassen Woerter beim Tippen oft in eine Komposition
    // zusammen und uebernehmen Vorschlaege teils ohne ein einfaches 'input' danach.
    ['input','compositionend','change'].forEach(type=>$('#promptCommandInput',home).addEventListener(type,syncMeta));
    // paste/cut melden sich, bevor der Browser den Text tatsaechlich einfuegt oder entfernt - ein
    // sofortiger Aufruf haette noch den alten Stand gelesen. Einen Tick warten, dann stimmt er.
    ['paste','cut'].forEach(type=>$('#promptCommandInput',home).addEventListener(type,()=>setTimeout(syncMeta,0)));
    rotatePlaceholder($('#promptCommandInput',home));
    // Enter schickt ab - aber nur dort, wo Enter auch wirklich Enter heisst. Auf dem Telefon
    // ist die Taste der Zeilenumbruch, und wer mitten im Schreiben absendet, verliert den Rest
    // des Satzes. Mit Umschalt bleibt es ueberall ein Umbruch, mit Strg/Cmd geht es immer los.
    $('#promptCommandInput',home).addEventListener('keydown',event=>{
      if(event.key!=='Enter'||event.isComposing)return;
      const withModifier=event.metaKey||event.ctrlKey;
      let fine=false;try{fine=matchMedia('(pointer:fine)').matches}catch{}
      if(!withModifier&&(!fine||event.shiftKey))return;
      event.preventDefault();
      const form=$('#promptCommandForm',home);
      if(form?.requestSubmit)form.requestSubmit();else submitCommand(new Event('submit'));
    })}
  function syncHome(){enforceSurface();const visible=homeVisible();document.documentElement.classList.toggle('prompt-home-surface',visible);if(!visible)return;const home=ensureHome();if(!home)return;$('#promptHomeName',home).textContent=resolvedName()||'Lars';const access=window.PromptAiAccess||{},plan=access.isAdmin?'Ultimate':String(access.plan||'free');$('#promptHomePlan',home).textContent=plan.charAt(0).toUpperCase()+plan.slice(1);const title=projectTitle(),original=$('#workspaceLastProjectBtn'),latest=$('.prompt-latest',home);
    // Ohne gespeichertes Projekt bot die Zeile etwas an, das es nicht gibt.
    if(latest)latest.hidden=!title;
    $('#promptLatestTitle',home).textContent=title?`${title} · ${FLOW_LABEL[lastProjectFlow()]}`:'Gespeicherten Arbeitsstand fortsetzen';$('#promptLatestAction',home).disabled=Boolean(original?.disabled);syncMeta();syncFlowUi();applyFlow(flowMode());syncAttachments();syncSetupSummary();syncModeMenuLocks(home);applyPreferredMode(home);ensureThemeToggle();const topbar=$('body>.topbar')||$('.topbar');if(topbar){topbar.hidden=false;topbar.removeAttribute('aria-hidden')}}
  // Entprellt, aber mit Deckel: die Seite schreibt waehrend Ladeanimationen jeden Frame an
  // style-Attributen, und jede dieser Aenderungen hat den Timer neu gestartet. syncHome lief
  // dann minutenlang nicht - und genau daran haengt die Klasse, die Startseite und Ablauf
  // auseinanderhaelt. Nach spaetestens 400ms laeuft er, egal wie unruhig es zugeht.
  let settleDeadline=0;
  function schedule(){
    const now=Date.now();
    if(!settleTimer)settleDeadline=now+400;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{settleTimer=0;syncHome()},Math.max(0,Math.min(25,settleDeadline-now)));
  }
  // Startseite und Arbeitsbereich sind zwei Zustaende, nie beide zugleich. Der Riegel dafuer lag
  // bisher nur im Stylesheet und haengt daran, dass der Ablauf ueber [hidden] gefuehrt wird -
  // jeder andere Weg dorthin zeigte wieder beides untereinander. Hier wird der Zustand selbst
  // hergestellt, nicht nur die Anzeige.
  function enforceSurface(){
    const page=$('#welcomePage'),flow=$('#workflowApp');
    if(!page||!flow)return;
    if(!flow.hidden&&getComputedStyle(flow).display!=='none'&&!page.hidden)page.hidden=true;
  }
  function init(){syncHome();enforceSurface();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.addEventListener('click',event=>{if(event.target.closest?.('#brandHome,.guided-clean-exit,#promptWorkflowLoaderClose'))setTimeout(syncHome,80)},true);window.addEventListener('promptai:access',schedule);window.addEventListener('promptai:quota',syncMeta);window.addEventListener('promptai:credits',syncMeta);window.addEventListener('promptai:references',()=>{syncAttachCounts();syncMeta()});window.addEventListener('promptai:preferences',()=>{const home=$('.prompt-command-home');if(home){delete home.dataset.modeTouched;applyPreferredMode(home)}});window.addEventListener('pageshow',schedule);window.addEventListener('promptai:home',syncHome);window.SiteBriefCloud?.subscribe?.(schedule);let count=0;const warm=setInterval(()=>{syncHome();if(++count>24)clearInterval(warm)},180)}
  window.PromptAiHomeSurface={sync:syncHome};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

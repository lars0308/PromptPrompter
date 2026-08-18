(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let settleTimer=0;
  const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};


  function cleanHints(){
    setText($('.home-intro-copy'),'Wähle, was du erstellen möchtest.');
    setText($('#freePromptDialog .free-prompt-intro'),'Wähle jetzt Typ und Ziel-Tool. Weitere Angaben sind optional.');
    setText($('#freePromptUpgrade small'),'Pro ergänzt Zielgruppe, Referenzen, Stil, Pflichtpunkte, Verbote und Ausgabeformat.');
    $$('.reference-note-block').forEach(note=>{if(!(note.textContent||'').trim()&&!note.hidden)note.hidden=true});
  }

  function freeFlow(){
    const d=$('#freePromptDialog');if(!d)return;
    const headKicker=$('.free-prompt-head span',d),headTitle=$('.free-prompt-head h2',d);setText(headKicker,'EINSTELLUNGEN');setText(headTitle,'Prompt genauer einstellen');
    const desc=$('#freePromptDescription'),label=desc?.closest('label');if(!desc||!label)return;
    let card=$('#freePromptBriefCard');if(!card){card=document.createElement('section');card.id='freePromptBriefCard';card.className='free-prompt-brief-card';card.innerHTML='<div><span>DEINE BESCHREIBUNG</span><p id="freePromptBriefText"></p></div><button type="button" class="outline-btn mini" id="freePromptEditBrief">Text ändern</button>';const grid=$('.free-prompt-grid.free-prompt-main',d);grid?.insertAdjacentElement('beforebegin',card);$('#freePromptEditBrief',card).onclick=()=>{label.dataset.editing='1';label.classList.remove('free-description-collapsed');desc.focus();desc.scrollIntoView({behavior:'smooth',block:'center'})};desc.addEventListener('blur',()=>{delete label.dataset.editing;syncBriefCard()});desc.addEventListener('input',syncBriefCard,{passive:true})}
    syncBriefCard();
  }
  function syncBriefCard(){const desc=$('#freePromptDescription'),label=desc?.closest('label'),text=$('#freePromptBriefText');if(!desc||!label||!text)return;const value=desc.value.trim(),copy=value||'Noch keine Beschreibung übernommen.';setText(text,copy);if(label.dataset.editing==='1')return;label.classList.toggle('free-description-collapsed',value.length>=1)}

  // Ein Fenster faengt oben an - aber nur beim Aufgehen.
  //
  // Hier stand vorher dasselbe ohne die Merker: settle() laeuft nach jeder Aenderung im Dokument,
  // und damit wurde jedes offene Fenster staendig wieder nach oben gezogen. Auf dem Handy hiess
  // das: man scrollt auf der Vorschauseite nach unten, und die Seite springt von selbst zurueck -
  // an jeder Stelle mit einem Fenster, nicht nur dort. Jetzt merkt sich jedes Fenster, dass es
  // schon oben angefangen hat, und wird erst beim naechsten Aufgehen wieder zurueckgesetzt.
  function topDialogs(){
    const schmal=matchMedia('(max-width:820px)').matches;
    for(const d of $$('dialog')){
      if(!d.open){delete d.dataset.startOben;continue}
      if(d.dataset.startOben==='1')continue;
      d.dataset.startOben='1';
      const frame=d.querySelector('.dialog-frame,.free-prompt-shell,.project-mode-frame,.simple-intake-shell');
      if(frame&&schmal)frame.scrollTop=0;
    }
    const menu=$('#topbarMenu');if(!menu)return;
    const offen=menu.classList.contains('open')||menu.dataset.open==='true';
    if(!offen){delete menu.dataset.startOben;return}
    if(menu.dataset.startOben==='1')return;
    menu.dataset.startOben='1';menu.scrollTop=0;
  }

  function settle(){cleanHints();freeFlow();topDialogs()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function bind(){document.addEventListener('click',()=>schedule(),true);window.addEventListener('promptai:access',schedule);window.addEventListener('sitebrief:admin',schedule);window.addEventListener('pageshow',schedule);new MutationObserver(schedule).observe(document.body,{childList:true})}
  function init(){bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>20)clearInterval(timer)},180)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

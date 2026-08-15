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

  function topDialogs(){
    $$('dialog[open]').forEach(d=>{const frame=d.querySelector('.dialog-frame,.free-prompt-shell,.project-mode-frame,.simple-intake-shell');if(frame&&matchMedia('(max-width:820px)').matches&&frame.scrollTop!==0)frame.scrollTop=0});
    const menu=$('#topbarMenu');if(menu&&(menu.classList.contains('open')||menu.dataset.open==='true')&&menu.scrollTop!==0)menu.scrollTop=0;
  }

  function settle(){cleanHints();freeFlow();topDialogs()}
  function schedule(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,24)}
  function bind(){document.addEventListener('click',()=>schedule(),true);window.addEventListener('promptai:access',schedule);window.addEventListener('sitebrief:admin',schedule);window.addEventListener('pageshow',schedule);new MutationObserver(schedule).observe(document.body,{childList:true})}
  function init(){bind();settle();let n=0;const timer=setInterval(()=>{settle();if(++n>20)clearInterval(timer)},180)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

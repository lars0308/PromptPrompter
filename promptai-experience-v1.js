(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  let thinkingStartedAt=0,thinkingMinMs=0,thinkingDone=false,thinkingTimer=0,waitingTimer=0,sentenceTimer=0,sentenceIndex=0;
  const SENTENCE_MS=3000;


  function titleCase(value){return String(value||'').trim().replace(/[._-]+/g,' ').replace(/\b\p{L}/gu,m=>m.toUpperCase())}
  function displayName(){
    const cloud=window.SiteBriefCloud||{},u=cloud.user||{},meta=u.user_metadata||{};
    const candidates=[cloud.profile?.display_name,cloud.userProfile?.display_name,window.PromptAiUserProfile?.display_name,$('#userDisplayName')?.value,meta.display_name,meta.full_name,meta.name];
    for(const c of candidates){const v=String(c||'').trim();if(v)return v.split(/\s+/)[0]}
    const email=String(u.email||'').trim();if(email){const local=email.split('@')[0];const clean=titleCase(local);if(clean)return clean.split(/\s+/)[0]}
    return '';
  }

  function home(){
    const hero=$('.welcome-hero');if(!hero)return;
    const kicker=hero.querySelector('.section-kicker'),h1=hero.querySelector('h1');
    if(kicker)kicker.textContent='PROMPT.AI';
    const name=displayName();if(h1)h1.textContent=name?`Willkommen, ${name}`:'Willkommen.';
    let intro=$('.home-intro-copy',hero);if(!intro){intro=document.createElement('p');intro.className='home-intro-copy';hero.firstElementChild?.appendChild(intro)}
    if(intro)intro.textContent='Wähle unten deinen Arbeitsbereich.';
    $$('*',hero).forEach(el=>{if(el!==h1&&el!==kicker&&el!==intro&&/^Willkommen zurück\.?$/i.test((el.textContent||'').trim()))el.hidden=true});
  }

  function thinkingText(){
    return [
      'Ich ordne deine Angaben und erkenne das eigentliche Ziel.',
      'Ich formuliere deine Beschreibung fachlich sauber und eindeutig.',
      'Ich setze passende Regeln für Qualität, Sicherheit und Recht.',
      'Ich baue daraus den Prompt für dein gewähltes Tool.'
    ];
  }
  function totalInputLength(){return ['freePromptDescription','freePromptContext','freePromptStyle','freePromptFormat'].map(id=>String($(`#${id}`)?.value||'')).join(' ').trim().length}
  function durationFor(len){if(len<=120)return Math.round(3200+len*9);if(len<=420)return Math.round(4280+(len-120)*11);return Math.min(12000,Math.round(7580+(len-420)*6))}
  function ensureThinking(){
    const shell=$('#freePromptDialog .free-prompt-shell');if(!shell)return null;let stage=$('#promptAiThinkingStage');if(stage)return stage;
    stage=document.createElement('section');stage.id='promptAiThinkingStage';stage.className='prompt-thinking-stage';stage.setAttribute('aria-live','polite');stage.innerHTML='<button type="button" class="prompt-thinking-close" aria-label="Abbrechen">×</button><div><span class="kicker">PROMPT.AI</span><strong>Dein Prompt entsteht</strong><div class="prompt-thinking-status"></div><div class="prompt-thinking-bar"><i></i></div><div class="prompt-thinking-wait">Letzter Feinschliff …</div></div>';shell.appendChild(stage);$('.prompt-thinking-close',stage).onclick=cancelThinking;return stage;
  }
  let titleFillRaf=0;
  function stopTitleFillLoop(stage,complete=false){cancelAnimationFrame(titleFillRaf);titleFillRaf=0;if(complete&&stage)applyTitleFill(stage,1)}
  function applyTitleFill(stage,progress){const bar=$('.prompt-thinking-bar i',stage);if(bar)bar.style.width=`${(progress*100).toFixed(2)}%`}
  function startTitleFillLoop(stage,durationMs){
    stopTitleFillLoop();
    let reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch{}
    if(reduce){applyTitleFill(stage,1);return}
    const startedAt=performance.now(),ease=t=>1-Math.pow(1-t,3);
    const tick=()=>{
      if(!stage.isConnected){titleFillRaf=0;return}
      const t=Math.min(1,(performance.now()-startedAt)/durationMs);
      applyTitleFill(stage,ease(t));
      titleFillRaf=t<1?requestAnimationFrame(tick):0;
    };
    titleFillRaf=requestAnimationFrame(tick);
  }
  function setThinkingSentence(stage,text,immediate=false){
    const host=$('.prompt-thinking-status',stage);if(!host)return;
    const apply=()=>{host.textContent=text;host.classList.remove('is-changing')};
    if(immediate){apply();return}
    host.classList.add('is-changing');setTimeout(()=>{if(host.isConnected)apply()},160);
  }
  function startSentenceCycle(stage){
    clearInterval(sentenceTimer);const lines=thinkingText();sentenceIndex=0;
    setThinkingSentence(stage,lines[0],true);
    sentenceTimer=setInterval(()=>{sentenceIndex=(sentenceIndex+1)%lines.length;setThinkingSentence(stage,lines[sentenceIndex])},SENTENCE_MS+230);
  }
  function startThinking(){
    const desc=String($('#freePromptDescription')?.value||'').trim();if(desc.length<12)return;
    const stage=ensureThinking();if(!stage)return;
    clearTimeout(thinkingTimer);clearTimeout(waitingTimer);thinkingDone=false;thinkingStartedAt=Date.now();thinkingMinMs=durationFor(totalInputLength());
    startSentenceCycle(stage);
    startTitleFillLoop(stage,thinkingMinMs);
    $('.prompt-thinking-wait',stage)?.classList.remove('show');stage.classList.remove('error');stage.classList.add('show');$('#freePromptDialog')?.classList.add('prompt-ai-thinking-active');
    waitingTimer=setTimeout(()=>{if(!thinkingDone)$('.prompt-thinking-wait',stage)?.classList.add('show')},thinkingMinMs+250);
  }
  function releaseThinking(error=false){
    const stage=$('#promptAiThinkingStage');if(!stage?.classList.contains('show'))return;thinkingDone=true;clearTimeout(waitingTimer);clearInterval(sentenceTimer);stopTitleFillLoop(stage,!error);
    if(error){stage.classList.add('error');const wait=$('.prompt-thinking-wait',stage);if(wait){wait.textContent='Der Prompt konnte nicht fertiggestellt werden.';wait.classList.add('show')}}
    const elapsed=Date.now()-thinkingStartedAt,wait=error?Math.max(0,550-elapsed):Math.max(0,thinkingMinMs-elapsed);clearTimeout(thinkingTimer);thinkingTimer=setTimeout(()=>{stage.classList.remove('show','running','error');$('#freePromptDialog')?.classList.remove('prompt-ai-thinking-active');const w=$('.prompt-thinking-wait',stage);if(w){w.textContent='Letzter Feinschliff …';w.classList.remove('show')}},wait);
  }
  function cancelThinking(){
    const stage=$('#promptAiThinkingStage');if(!stage)return;
    thinkingDone=true;clearTimeout(waitingTimer);clearTimeout(thinkingTimer);clearInterval(sentenceTimer);stopTitleFillLoop();
    stage.classList.remove('show','running','error');
    $('#freePromptDialog')?.classList.remove('prompt-ai-thinking-active');
    const wait=$('.prompt-thinking-wait',stage);if(wait){wait.textContent='Letzter Feinschliff …';wait.classList.remove('show')}
  }
  function watchGeneration(){
    const status=$('#freePromptStatus');if(status&&!status.__promptExperienceWatch){status.__promptExperienceWatch=true;new MutationObserver(()=>{if(status.classList.contains('error'))releaseThinking(true);else if(status.classList.contains('good'))releaseThinking(false)}).observe(status,{attributes:true,attributeFilter:['class'],childList:true,subtree:true})}
  }

  function bind(){
    if(document.documentElement.dataset.promptExperienceBound==='1')return;document.documentElement.dataset.promptExperienceBound='1';
    document.addEventListener('click',e=>{if(e.target.closest?.('#freePromptGenerate'))startThinking();setTimeout(()=>{home();watchGeneration()},0)},true);
    window.addEventListener('promptai:access',()=>setTimeout(home,0));window.addEventListener('pageshow',()=>setTimeout(home,0));
  }
  function settle(){home();watchGeneration()}
  function init(){settle();bind();let n=0;const t=setInterval(()=>{settle();if(++n>20)clearInterval(t)},180)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const POLL_MS=45000;
  let status={enabled:false,reason:'',eta:''},pollTimer=0;

  function isAdmin(){
    const ownerEmail='service.battermann@gmx.de';
    const email=String(window.SiteBriefCloud?.user?.email||'').trim().toLowerCase();
    return email===ownerEmail||Boolean(window.PromptAiAccess?.isAdmin);
  }

  function styles(){
    if($('#maintenanceModeStyles'))return;
    const s=document.createElement('style');s.id='maintenanceModeStyles';s.textContent=`
      html.prompt-maintenance-active,html.prompt-maintenance-active body{overflow:hidden!important}
      #promptMaintenanceOverlay{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:28px 22px;background:var(--paper,#f4f5f6);color:var(--ink,#171814)}
      #promptMaintenanceOverlay>div{width:min(560px,100%);text-align:center}
      #promptMaintenanceOverlay .kicker{display:block;color:var(--accent,#1689c7);font-size:9px;font-weight:850;letter-spacing:.13em}
      #promptMaintenanceOverlay strong{display:block;margin-top:9px;font-size:clamp(28px,7vw,42px);line-height:1.05;letter-spacing:-.04em}
      #promptMaintenanceOverlay p{max-width:46ch;margin:18px auto 0;color:var(--muted,#666);font-size:14px;line-height:1.6}
      #promptMaintenanceOverlay .eta{display:inline-block;margin-top:18px;padding:10px 16px;border:1px solid var(--line,#d9ddd6);border-radius:999px;font-size:12px;font-weight:700}
    `;document.head.appendChild(s);
  }

  function render(){
    const admin=isAdmin();
    let box=$('#promptMaintenanceOverlay');
    if(!status.enabled||admin){box?.remove();document.documentElement.classList.remove('prompt-maintenance-active');return}
    document.documentElement.classList.add('prompt-maintenance-active');
    if(!box){
      styles();
      box=document.createElement('section');box.id='promptMaintenanceOverlay';box.setAttribute('aria-live','polite');
      document.body.appendChild(box);
    }
    box.innerHTML=`<div><span class="kicker">PROMPT.AI · WARTUNG</span><strong>Kurz Wartungsarbeiten</strong><p>${status.reason?escapeHtml(status.reason):'Wir arbeiten gerade an Prompt.ai und sind gleich wieder da.'}</p>${status.eta?`<span class="eta">Voraussichtlich ${escapeHtml(status.eta)}</span>`:''}</div>`;
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}

  async function check(){
    try{
      const r=await fetch('/api/config',{cache:'no-store'});
      if(!r.ok)return;
      const data=await r.json();
      status=data?.maintenance||{enabled:false,reason:'',eta:''};
      render();
    }catch{}
  }

  function schedulePoll(){clearInterval(pollTimer);pollTimer=setInterval(check,POLL_MS)}

  function init(){
    check();schedulePoll();
    window.addEventListener('promptai:access',render);
    window.addEventListener('sitebrief:admin',render);
    window.addEventListener('pageshow',check);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

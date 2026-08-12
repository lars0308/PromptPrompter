(()=>{
  'use strict';
  // The preview selector used to be rewritten here after app.js had built it: the automatic entry
  // and the Gemini entry were removed and the Cloudflare option was relabelled "KI-Bild ·
  // automatisch". Both scripts rebuilt the same <select> on promptai:access, so which version a
  // visitor saw depended on the order the events happened to fire - the label said "automatisch"
  // while the value was a fixed provider, and options appeared and disappeared between renders.
  // app.js owns the list alone now (plan-gated, HTML default, providers named explicitly), so the
  // only thing left here is keeping provider names out of the status line.
  const fix=()=>{
    const select=document.getElementById('previewFormat'),status=document.getElementById('generationStatus');
    if(!select||!status||status.dataset.previewLabelGuard==='1')return;
    status.dataset.previewLabelGuard='1';
    // Assigning textContent always replaces the text node, so writing it unconditionally inside
    // an observer of this very node feeds itself forever. Only write when something changed.
    const clean=()=>{
      const next=status.textContent.replace(/Cloudflare Workers AI/gi,'Prompt.ai Vorschau-KI').replace(/unter Einstellungen\s*→\s*KI-Verbindungen verbunden sein/gi,'zentral verfügbar sein');
      if(next!==status.textContent)status.textContent=next;
    };
    new MutationObserver(clean).observe(status,{childList:true,subtree:true,characterData:true});
    clean();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix,{once:true});else fix();
  window.addEventListener('promptai:access',fix);
  window.addEventListener('promptai:system-ai-ready',fix);
})();

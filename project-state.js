(()=>{
  'use strict';
  // Acht Dateien lasen bisher denselben gespeicherten Projektstand, jede mit ihrer eigenen
  // Vorstellung davon, wie er aussieht: mal project.name, mal projectName, mal client.name, und
  // jede mit eigenem try/catch. Genau daher kommt die Sorte Fehler, bei der ein
  // wiederhergestelltes Projekt auf der falschen Seite landet oder "Letztes Projekt" leer bleibt,
  // obwohl etwas da ist. Hier steht die eine Auskunft: was gespeichert ist, wie es heisst, wie
  // weit es war. Geschrieben wird der Stand weiterhin nur von app.js - ein Leser, der schreibt,
  // waere derselbe Fehler noch einmal.
  const KEY='sitebrief-v6-state';

  function raw(){
    try{
      const value=localStorage.getItem(KEY);
      if(!value)return null;
      const parsed=JSON.parse(value);
      return parsed&&typeof parsed==='object'?parsed:null;
    }catch{return null}
  }

  // Der Name eines Projekts steht an drei Stellen, je nachdem, wie es entstanden ist: ueber die
  // Konsole nur als Beschreibung, ueber den Ablauf mit Projektnamen, ueber einen Kundenimport mit
  // Firmennamen. Die Reihenfolge ist die des Projektverzeichnisses in app.js.
  function title(state=raw()){
    const project=state?.project||{};
    const value=String(project.name||state?.projectName||project.client?.name||state?.client?.name||project.description||state?.projectDescription||'').trim();
    return value.slice(0,70);
  }
  const described=(state=raw())=>String(state?.project?.description||state?.projectDescription||'').trim().length>=8;
  // Wie weit das Projekt war. Schritt 1 ist die Beschreibung; alles darueber setzt voraus, dass
  // sie ausgefuellt ist - sonst landet ein Wiederherstellen mitten im Ablauf ohne Grundlage.
  function step(state=raw()){
    const reached=Number(state?.currentStep||0);
    if(!described(state))return 1;
    return Math.max(1,Math.min(8,reached||1));
  }
  const exists=()=>Boolean(raw());
  const masterPrompt=(state=raw())=>String(state?.masterPrompt||'').trim();

  window.PromptAiProjectState={key:KEY,read:raw,title,step,described,exists,masterPrompt};
})();

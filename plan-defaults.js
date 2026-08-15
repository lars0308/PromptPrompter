(()=>{
  'use strict';
  // Dieselben Zahlen standen an drei Stellen im Browser: in der Kontingentanzeige, in den
  // Standardwerten der Verwaltung und - als Wahrheit - in server/quota.js. Drei Kopien heisst:
  // eine Aenderung wird an zweien vergessen, und die Anzeige widerspricht der Abrechnung.
  // Hier steht der Rueckfall genau einmal. Massgeblich bleibt der Server; das hier greift nur,
  // solange die Konfiguration nicht geladen ist.
  const DEFAULTS=Object.freeze({
    free:Object.freeze({free_prompts:10,website_generations:3,ai_previews:0,monthly_tokens:150000}),
    pro:Object.freeze({free_prompts:100,website_generations:25,ai_previews:50,monthly_tokens:2500000}),
    ultimate:Object.freeze({free_prompts:500,website_generations:100,ai_previews:250,monthly_tokens:6000000})
  });
  const limits=plan=>({...(DEFAULTS[String(plan||'free')]||DEFAULTS.free)});
  window.PromptAiPlanDefaults={all:()=>({free:limits('free'),pro:limits('pro'),ultimate:limits('ultimate')}),limits};
})();

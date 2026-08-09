(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[ch]);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  const AGENT_NAMES = {claude:"Claude Code",codex:"Codex",gemini:"Gemini",chatgpt:"ChatGPT",cursor:"Cursor",v0:"v0",universal:"Universal"};
  const OUTPUT_TARGETS = {"next-vercel":"Next.js + TypeScript + Vercel","next-only":"Next.js + TypeScript","html":"Statisches HTML / CSS / JavaScript","react":"React + Vite","astro":"Astro","existing":"Bestehenden Projekt-Stack weiterführen"};
  const ASPECTS = ["Layout","Farben","Typografie","Bildsprache","Hero","Struktur","Stimmung","Nur Inspiration"];
  const STORAGE_KEY = "sitebrief-v6-state";
  const LIBRARY_KEY = "sitebrief-v6-library";
  const SETTINGS_KEY = "sitebrief-v6-settings";
  const PROFILES_KEY = "sitebrief-v6-profiles";
  const GUEST_USAGE_KEY = "sitebrief-v6-guest-runs";
  const THEME_KEY = "sitebrief-theme";
  const REMEMBERED_EMAIL_KEY = "sitebrief-remembered-email";
  const GUEST_RUN_LIMIT = 3;
  const PLAN_RULES = {
    free:{label:"Free",concepts:3,agents:["codex"],clientDocs:false,modules:false,customProfiles:false,generatorChoice:false,advanced:false,zip:false,github:false},
    pro:{label:"Pro",concepts:4,agents:["codex","claude"],clientDocs:true,modules:true,customProfiles:true,generatorChoice:true,advanced:false,zip:true,github:false},
    ultimate:{label:"Ultimate",concepts:5,agents:Object.keys(AGENT_NAMES),clientDocs:true,modules:true,customProfiles:true,generatorChoice:true,advanced:true,zip:true,github:true}
  };
  const DEFAULT_SETTINGS = {
    aiClarifications:true,maxQuestions:4,criticalBehavior:"block",askMissing:true,askConflict:true,askInfeasible:true,suggestAlternatives:true,
    legalRegion:"Deutschland / EU",checks:{privacy:true,imprint:true,legal:true,accessibility:true,security:true,performance:true,seo:false},
    noInventLegal:true,finalChecklist:true,
    defaultAgent:"codex",defaultEngine:"local",defaultModel:"",defaultMode:"guided",defaultConceptCount:5,activeProfileId:""
  };
  const LOCAL_SYSTEM_PROFILES = [
    {id:"system-standard",name:"Standard",description:"Geführter Standarddurchlauf mit Qualitäts- und Rechtschecks.",is_default:true,sort_order:10,config:{mode:"guided",targetAgent:"codex",engine:"local",model:"",conceptCount:5,settings:{...DEFAULT_SETTINGS}}},
    {id:"system-fast",name:"Schneller Entwurf",description:"Weniger Rückfragen und drei Vorschauen für schnelle Ideen.",is_default:false,sort_order:20,config:{mode:"auto",targetAgent:"codex",engine:"local",model:"",conceptCount:3,settings:{...DEFAULT_SETTINGS,maxQuestions:2,criticalBehavior:"warn",defaultMode:"auto",defaultConceptCount:3}}}
  ];

  const state = {
    mode: "guided",
    currentStep: 1,
    maxVisited: 1,
    understandingConfirmed: false,
    understanding: null,
    urls: [],
    images: [],
    targetAgent: "codex",
    engine: "local",
    model: "",
    outputTarget: "next-vercel",
    modelsLoaded: false,
    templateId: "",
    selectedModuleIds: [],
    selectedSkillIds: [],
    recommendedModuleIds: [],
    templates: [],
    modules: [],
    skills: [],
    concepts: [],
    selectedConceptId: "",
    refinements: [],
    clarifications: [],
    projectReview: null,
    reviewSignature: "",
    reviewDeferred: false,
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    profiles: [],
    systemProfiles: JSON.parse(JSON.stringify(LOCAL_SYSTEM_PROFILES)),
    activeProfileId: "",
    currentProjectId: uid("project"),
    cloudProjects: [],
    aiConnections: [],
    plan: "free",
    isAdmin: false,
    ownApiKeys: false,
    userProfile: {displayName:"",companyName:"",website:"",defaultClientType:""},
    cloud: {configured:false,user:null,syncing:false,lastSynced:null,error:""},
    editing: {template:"",module:"",skill:""}
  };

  const el = {};
  function cacheElements(){
    [
      "projectDescription","descriptionCount","projectName","projectType","projectGoal","projectAudience","projectSpecial","clientName","clientType","clientWebsite","clientContact","importClientWebsiteBtn","clientImportStatus","projectUnderstanding","understandingSummary","understandingPoints","reanalyzeProjectBtn","confirmUnderstandingBtn","editUnderstandingBtn","projectValidation",
      "referenceUrl","addUrlBtn","urlReferences","uploadZone","imageInput","imageReferences",
      "agentSelector","generatorEngine","generatorModel","modelOptions","engineHelp","engineStatus","profileImpact","outputTargetSelector",
      "templateSelect","moduleSelection","skillSelection","skillContextLabel","recommendModulesBtn","importSkillFileBtn","skillFileInput","skillImportMessage",
      "blueprintSummary","originality","antiSlop","motion","density",
      "previewFormat","conceptCount","generateConceptsBtn","generationStatus","conceptGallery","toRefineBtn","previewLightbox","previewLightboxTitle","previewLightboxClose","previewLightboxMedia","previewLightboxDownload","previewLightboxSelect",
      "selectedPreviewLarge","quickRefinements","refinementInput","applyRefinementBtn","clearRefinementsBtn","refinementHistory",
      "masterPrompt","promptMeta","copyPromptBtn","downloadPromptBtn","downloadBriefBtn","downloadProjectReportBtn","downloadClientBriefBtn","downloadHandoverBtn","downloadWebsiteZipBtn","publishGithubBtn","clientResultHint","exportResultHint",
      "guideStepLabel","guideTitle","guideText","guideSuggestions","guideActionBtn","guideAgent","guideModules","guideSkills","guideReferences","progressText",
      "accountBtn","syncState","themeToggleBtn","accountDialog","accountLoggedOut","accountLoggedIn","accountDialogKicker","accountDialogTitle","accountIntro","guestLimitBox","guestLimitTitle","guestLimitNote","guestContinueBtn","authEmail","authPassword","rememberEmail","signInBtn","signUpBtn","signOutBtn","syncNowBtn","authMessage","syncMessage","accountEmail","accountUserId","cloudStats","cloudProjectList",
      "openLibraryBtn","openSettingsBtn","libraryDialog","exportLibraryBtn","importLibraryBtn","importLibraryInput",
      "settingsDialog","setActiveProfile","applyProfileBtn","connectionLoginRow","settingsLoginBtn","gatewayConnectionStatus","gatewayApiKey","gatewayConnectBtn","gatewayTestBtn","gatewayDisconnectBtn","gatewayConnectionMessage","openaiConnectionStatus","openaiApiKey","openaiConnectBtn","openaiTestBtn","openaiDisconnectBtn","openaiConnectionMessage","geminiConnectionStatus","geminiApiKey","geminiConnectBtn","geminiTestBtn","geminiDisconnectBtn","geminiConnectionMessage","cloudflareConnectionStatus","cloudflareAccountId","cloudflareApiToken","cloudflareConnectBtn","cloudflareTestBtn","cloudflareDisconnectBtn","cloudflareConnectionMessage","saveProfileBtn","manageProfilesBtn","profileDialog","profileList","newProfileName","newProfileDescription","createProfileBtn","setAiClarifications","setMaxQuestions","setCriticalBehavior","setAskMissing","setAskConflict","setAskInfeasible","setSuggestAlternatives","setLegalRegion","setCheckPrivacy","setCheckImprint","setCheckLegal","setCheckAccessibility","setCheckSecurity","setCheckPerformance","setCheckSeo","setNoInventLegal","setFinalChecklist","saveSettingsBtn",
      "aiReviewCard","aiReviewTitle","aiReviewText","runAiReviewBtn","reviewProgress","reviewProgressPercent","reviewProgressText","reviewProgressFill","previewProgress","previewProgressPercent","previewProgressText","previewProgressFill","clarificationDialog","clarificationIntro","clarificationWarnings","clarificationQuestions","deferClarificationsBtn","saveClarificationsBtn",
      "templateLibraryList","libTemplateName","libTemplateTag","libTemplateSummary","libTemplatePrompt","saveTemplateBtn","cancelTemplateEditBtn","templateEditorTitle",
      "moduleLibraryList","libModuleName","libModuleTag","libModuleSummary","libModulePrompt","saveModuleBtn","cancelModuleEditBtn","moduleEditorTitle",
      "skillLibraryList","libSkillName","libSkillAgent","libSkillTrigger","libSkillPrompt","saveSkillBtn","cancelSkillEditBtn","skillEditorTitle",
      "resetBtn","startNewBtn","brandHome","currentPlanBadge","currentPlanTitle","currentPlanDescription","showPlansBtn","plansDialog","settingsUpgradeNote","startProCheckoutBtn","startUltimateCheckoutBtn","manageSubscriptionBtn","startApiAddonCheckoutBtn","apiAddonCard","userDisplayName","userCompanyName","userWebsite","userDefaultClientType","saveUserProfileBtn","userProfileMessage","githubConnectionStatus","githubToken","githubConnectBtn","githubTestBtn","githubDisconnectBtn","githubConnectionMessage"
    ].forEach(id => el[id] = document.getElementById(id));
  }

  function project(){
    return {
      name: el.projectName?.value.trim() || "",
      description: el.projectDescription?.value.trim() || "",
      type: el.projectType?.value || "Website",
      goal: el.projectGoal?.value || "Anfragen / Leads",
      audience: el.projectAudience?.value.trim() || "",
      special: el.projectSpecial?.value.trim() || "",
      client:{name:el.clientName?.value.trim()||"",type:el.clientType?.value||"kunde",website:el.clientWebsite?.value.trim()||"",contact:el.clientContact?.value.trim()||""}
    };
  }

  function controls(){
    return {
      originality: Number(el.originality?.value || 78),
      antiSlop: Number(el.antiSlop?.value || 95),
      motion: Number(el.motion?.value || 18),
      density: Number(el.density?.value || 55)
    };
  }

  function selectedTemplate(){ return cloudReady()?(state.templates.find(x => x.id === state.templateId) || null):null; }
  function selectedModules(){ return cloudReady()&&planRules().modules?state.modules.filter(x => state.selectedModuleIds.includes(x.id)):[]; }
  function visibleSkills(){ return state.skills.filter(x => x.agent === "all" || x.agent === state.targetAgent); }
  function selectedSkills(){ return cloudReady()&&planRules().modules?visibleSkills().filter(x => state.selectedSkillIds.includes(x.id)):[]; }
  function selectedConcept(){ return state.concepts.find(x => x.id === state.selectedConceptId) || null; }

  function loadLibrary(){
    try{
      const raw = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "null");
      if(raw && typeof raw === "object"){
        state.templates = Array.isArray(raw.templates) ? raw.templates : [];
        state.modules = Array.isArray(raw.modules) ? raw.modules.map(x=>({...x,activation:x.activation||"manual"})) : [];
        state.skills = Array.isArray(raw.skills) ? raw.skills.map(x=>({...x,activation:x.activation||"manual"})) : [];
      }
    }catch{}
  }

  function saveLibrary(){
    try{ localStorage.setItem(LIBRARY_KEY, JSON.stringify({version:6,templates:state.templates,modules:state.modules,skills:state.skills})); }catch{}
  }

  function loadSettings(){
    try{
      const raw=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"null");
      if(raw && typeof raw==="object") state.settings={...DEFAULT_SETTINGS,...raw,checks:{...DEFAULT_SETTINGS.checks,...(raw.checks||{})}};
    }catch{}
  }

  function saveSettings(){
    try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(state.settings));}catch{}
    scheduleCloudSettingsSave();
  }

  function loadProfiles(){
    try{
      const raw=JSON.parse(localStorage.getItem(PROFILES_KEY)||"null");
      state.profiles=Array.isArray(raw?.profiles)?raw.profiles:[];
      state.activeProfileId=raw?.activeProfileId||state.settings.activeProfileId||"";
    }catch{}
  }

  function saveProfiles(){
    state.settings.activeProfileId=state.activeProfileId||"";
    try{localStorage.setItem(PROFILES_KEY,JSON.stringify({version:6,profiles:state.profiles,activeProfileId:state.activeProfileId}));}catch{}
    try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(state.settings));}catch{}
    scheduleCloudSettingsSave();
  }

  function projectSignature(){
    return JSON.stringify({project:project(),urls:state.urls.map(x=>({url:x.url,aspects:x.aspects,like:x.like,dislike:x.dislike})),images:state.images.map(x=>({name:x.name,aspects:x.aspects,like:x.like,dislike:x.dislike})),engine:state.engine,model:el.generatorModel?.value||"",settings:state.settings});
  }

  function serializableProjectState(){
    return {
      projectId:state.currentProjectId,mode: state.mode,currentStep:state.currentStep,maxVisited:state.maxVisited,understandingConfirmed:state.understandingConfirmed,understanding:state.understanding,
      urls:state.urls,
      images:state.images.map(({dataUrl,previewUrl,...rest}) => rest),
      targetAgent:state.targetAgent,engine:state.engine,model:state.model,outputTarget:state.outputTarget,templateId:state.templateId,selectedModuleIds:state.selectedModuleIds,selectedSkillIds:state.selectedSkillIds,
      concepts:state.concepts,selectedConceptId:state.selectedConceptId,refinements:state.refinements,clarifications:state.clarifications,projectReview:state.projectReview,reviewSignature:state.reviewSignature,reviewDeferred:state.reviewDeferred,
      project:project(),controls:controls(),conceptCount:Number(el.conceptCount?.value || 5),previewFormat:el.previewFormat?.value||"html"
    };
  }

  let cloudProjectTimer=null, cloudSettingsTimer=null;
  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableProjectState())); }catch{}
    scheduleCloudProjectSave();
  }

  function cloudReady(){ return Boolean(state.cloud.configured && state.cloud.user && window.SiteBriefCloud?.client); }

  function applyTheme(theme){
    const resolved=theme==="dark"?"dark":"light";document.documentElement.dataset.theme=resolved;localStorage.setItem(THEME_KEY,resolved);if(el.themeToggleBtn){const dark=resolved==="dark";el.themeToggleBtn.querySelector("b").textContent=dark?"Hell":"Dunkel";el.themeToggleBtn.setAttribute("aria-label",dark?"Hellmodus aktivieren":"Dunkelmodus aktivieren");}
  }
  function initTheme(){applyTheme(localStorage.getItem(THEME_KEY)==="dark"?"dark":"light")}

  function guestRunCount(){return clamp(Number(localStorage.getItem(GUEST_USAGE_KEY)||0),0,GUEST_RUN_LIMIT)}
  function guestRunsRemaining(){return Math.max(0,GUEST_RUN_LIMIT-guestRunCount())}
  function renderGuestLimit(){
    if(!el.guestLimitNote)return;const remaining=guestRunsRemaining(),exhausted=remaining===0;
    el.guestLimitBox.classList.toggle("exhausted",exhausted);el.guestLimitTitle.textContent=exhausted?"Gast-Limit erreicht":"Ohne Anmeldung testen";
    el.guestLimitNote.textContent=exhausted?"Deine drei kostenlosen Gast-Durchläufe sind verbraucht. Melde dich an oder lege ein Konto an, um weiterzumachen.":`Noch ${remaining} von ${GUEST_RUN_LIMIT} Gast-Durchläufen verfügbar. Gespeicherte Cloud-Daten und Bibliotheken sind erst nach der Anmeldung verfügbar.`;
    el.guestContinueBtn.hidden=exhausted;
  }
  function showAccountGate(){
    if(cloudReady()||!el.accountDialog)return;updateAccountUi();renderGuestLimit();el.accountDialog.classList.add("guest-gate");el.accountDialogKicker.textContent="WILLKOMMEN BEI SITEBRIEF";el.accountDialogTitle.textContent=guestRunsRemaining()?"Anmelden oder kostenlos testen":"Zum Weitermachen anmelden";
    el.accountIntro.textContent="Mit deiner Anmeldung werden Projekte, Profile, Bibliotheken, Module und Skills geladen und geräteübergreifend gespeichert.";if(!el.accountDialog.open)el.accountDialog.showModal();
  }
  function closeAccountGate(){el.accountDialog.classList.remove("guest-gate");if(el.accountDialog.open)el.accountDialog.close()}
  function consumeGuestRun(){if(cloudReady())return;localStorage.setItem(GUEST_USAGE_KEY,String(Math.min(GUEST_RUN_LIMIT,guestRunCount()+1)));renderGuestLimit()}

  async function sitebriefApiFetch(url, options={}){
    const auth = await window.SiteBriefCloud?.authHeaders?.().catch?.(()=>({})) || {};
    return fetch(url,{...options,headers:{...(options.headers||{}),...auth}});
  }

  function aiConnection(provider){ return state.aiConnections.find(x=>x.provider===provider)||null; }
  function aiConnectionEls(provider){
    return provider==='gateway'
      ? {status:el.gatewayConnectionStatus,input:el.gatewayApiKey,connect:el.gatewayConnectBtn,test:el.gatewayTestBtn,disconnect:el.gatewayDisconnectBtn,message:el.gatewayConnectionMessage}
      : provider==='openai'
        ? {status:el.openaiConnectionStatus,input:el.openaiApiKey,connect:el.openaiConnectBtn,test:el.openaiTestBtn,disconnect:el.openaiDisconnectBtn,message:el.openaiConnectionMessage}
        : provider==='gemini'
          ? {status:el.geminiConnectionStatus,input:el.geminiApiKey,connect:el.geminiConnectBtn,test:el.geminiTestBtn,disconnect:el.geminiDisconnectBtn,message:el.geminiConnectionMessage}
          : provider==='cloudflare'
            ? {status:el.cloudflareConnectionStatus,input:el.cloudflareApiToken,account:el.cloudflareAccountId,connect:el.cloudflareConnectBtn,test:el.cloudflareTestBtn,disconnect:el.cloudflareDisconnectBtn,message:el.cloudflareConnectionMessage}
            : {status:el.githubConnectionStatus,input:el.githubToken,connect:el.githubConnectBtn,test:el.githubTestBtn,disconnect:el.githubDisconnectBtn,message:el.githubConnectionMessage};
  }

  function renderAiConnections(){
    for(const provider of ['gateway','openai','gemini','cloudflare','github']){
      const ui=aiConnectionEls(provider); if(!ui.status) continue;
      const conn=aiConnection(provider), logged=cloudReady();
      ui.status.className='connection-status'+(conn?' connected':'');
      ui.status.textContent=conn?`Verbunden · ••••${conn.last4||''}`:(logged?'Nicht verbunden':'Login erforderlich');
      ui.input.disabled=!logged;if(ui.account)ui.account.disabled=!logged;ui.connect.disabled=!logged;ui.disconnect.hidden=!conn;ui.test.disabled=false;
      if(!logged && !conn) ui.message.textContent='Zum Speichern eines eigenen API-Keys zuerst anmelden.';
      else if(conn && !ui.message.classList.contains('error')) ui.message.textContent='Verschlüsselt in Supabase Vault gespeichert.';
      else if(!conn && !ui.message.classList.contains('error')) ui.message.textContent='';
    }
    if(el.connectionLoginRow) el.connectionLoginRow.hidden=cloudReady();
  }

  async function saveAiProviderConnection(provider){
    const ui=aiConnectionEls(provider);
    if(!cloudReady()){ui.message.textContent='Bitte zuerst bei SiteBrief anmelden.';ui.message.className='connection-message error';return;}
    let secret=ui.input.value.trim();
    if(provider==='cloudflare'){const account=ui.account?.value.trim()||'';if(!/^[a-f0-9]{32}$/i.test(account)){ui.message.textContent='Bitte eine gültige 32-stellige Cloudflare Account-ID eingeben.';ui.message.className='connection-message error';return;}secret=`${account}:${secret}`;}
    if(secret.length<8){ui.message.textContent='Bitte einen gültigen API-Key eingeben.';ui.message.className='connection-message error';return;}
    try{
      ui.connect.disabled=true;ui.message.textContent='Wird verschlüsselt gespeichert…';ui.message.className='connection-message';
      await window.SiteBriefCloud.saveAiConnection(provider,secret);
      state.aiConnections=[...(window.SiteBriefCloud.aiConnections||[])];ui.input.value='';if(ui.account)ui.account.value='';renderAiConnections();
      ui.message.textContent='Gespeichert. Verbindung wird geprüft…';ui.message.className='connection-message good';
      await testAiProviderConnection(provider,true);
      state.modelsLoaded=false;if(state.engine===provider && provider!=='openai')loadProviderModels(provider);
    }catch(err){ui.message.textContent=err?.message||'Verbindung konnte nicht gespeichert werden.';ui.message.className='connection-message error';}
    finally{ui.connect.disabled=!cloudReady();}
  }

  async function testAiProviderConnection(provider,quiet=false){
    const ui=aiConnectionEls(provider);
    try{
      ui.test.disabled=true;if(!quiet){ui.message.textContent='Verbindung wird getestet…';ui.message.className='connection-message';}
      const res=await sitebriefApiFetch(`/api/ai-test?provider=${encodeURIComponent(provider)}`,{cache:'no-store'});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Verbindungstest fehlgeschlagen');
      ui.message.textContent=data.source==='account'?'Verbindung funktioniert mit deinem gespeicherten Key.':'Verbindung funktioniert mit dem serverweiten Key.';ui.message.className='connection-message good';
      ui.status.classList.add('connected');
    }catch(err){ui.message.textContent=err?.message||'Verbindungstest fehlgeschlagen.';ui.message.className='connection-message error';ui.status.classList.add('error');}
    finally{ui.test.disabled=false;}
  }

  async function disconnectAiProvider(provider){
    const ui=aiConnectionEls(provider);if(!cloudReady())return;
    try{await window.SiteBriefCloud.deleteAiConnection(provider);state.aiConnections=[...(window.SiteBriefCloud.aiConnections||[])];ui.message.textContent='Eigener Key entfernt.';ui.message.className='connection-message';renderAiConnections();if(provider==='gateway')state.modelsLoaded=false;}
    catch(err){ui.message.textContent=err?.message||'Verbindung konnte nicht getrennt werden.';ui.message.className='connection-message error';}
  }

  function setSyncState(label,kind=""){
    if(!el.syncState) return;
    el.syncState.textContent=label;
    el.syncState.className=`sync-state ${kind}`.trim();
  }

  function planRules(){return PLAN_RULES[state.isAdmin?"ultimate":state.plan]||PLAN_RULES.free}
  function applyPlanUi(){
    const rules=planRules(),name=state.isAdmin?"Admin · Ultimate":rules.label;
    if(!rules.agents.includes(state.targetAgent))state.targetAgent=rules.agents[0];
    $$('#agentSelector button').forEach(button=>{const allowed=rules.agents.includes(button.dataset.agent);button.hidden=!allowed;button.disabled=false;button.classList.toggle("active",button.dataset.agent===state.targetAgent)});
    if(el.conceptCount){el.conceptCount.max=String(rules.concepts);if(Number(el.conceptCount.value)>rules.concepts)el.conceptCount.value=String(rules.concepts)}
    if(el.previewFormat){const current=el.previewFormat.value,options=[['html','HTML-Website']];if(rules.modules||state.ownApiKeys)options.push(['image-cloudflare','Cloudflare-Bild']);if(rules.advanced||state.ownApiKeys)options.push(['image-gemini','Gemini-Bild']);el.previewFormat.innerHTML=options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');el.previewFormat.value=options.some(([value])=>value===current)?current:'html'}
    if(el.currentPlanBadge)el.currentPlanBadge.textContent=name.toUpperCase();
    if(el.currentPlanTitle)el.currentPlanTitle.textContent=state.isAdmin?"Vollzugriff":`${rules.label}-Tarif`;
    if(el.currentPlanDescription)el.currentPlanDescription.textContent=rules===PLAN_RULES.free?"Gute Ergebnisse mit geführten Standards und drei Richtungen.":rules===PLAN_RULES.pro?"Claude/Codex, Module, Skills, vier Richtungen und Kundenunterlagen.":"Alle Agenten, Modelle, Profile, Einstellungen und fünf Richtungen.";
    if(el.clientResultHint)el.clientResultHint.textContent=rules.clientDocs?"Kundenunterlagen sind freigeschaltet.":"Mit Pro erhältst du Kundenbriefing und Übergabe-Dokument.";
    [el.downloadClientBriefBtn,el.downloadHandoverBtn].forEach(button=>{if(button)button.hidden=!rules.clientDocs});
    if(el.downloadWebsiteZipBtn)el.downloadWebsiteZipBtn.hidden=!rules.zip;
    if(el.publishGithubBtn)el.publishGithubBtn.hidden=!rules.github;
    if(el.exportResultHint)el.exportResultHint.textContent=rules.github?"ZIP herunterladen oder direkt als GitHub-Repository veröffentlichen.":rules.zip?"Komplettes Website-Paket als ZIP exportieren. GitHub-Veröffentlichung ist in Ultimate enthalten.":"Website-Paket und Kundenunterlagen sind ab Pro enthalten.";
    const advancedSection=el.gatewayApiKey?.closest(".settings-section");
    if(advancedSection)advancedSection.hidden=!state.ownApiKeys;
    const qualitySection=el.setAiClarifications?.closest(".settings-section");
    const checksSection=el.setLegalRegion?.closest(".settings-section");
    if(qualitySection)qualitySection.hidden=state.plan==="free"&&!state.isAdmin;
    if(checksSection)checksSection.hidden=state.plan==="free"&&!state.isAdmin;
    if(el.settingsUpgradeNote){el.settingsUpgradeNote.hidden=state.ownApiKeys;el.settingsUpgradeNote.innerHTML=state.plan==='free'?'<strong>Mehr Kontrolle mit Pro</strong><p>Claude, Module, Skills, Kundenunterlagen, ZIP-Export und erweiterte Prüfregeln.</p><button type="button" class="outline-btn mini" data-upgrade-plans>Pro ansehen</button>':'<strong>Eigene API-Keys für 5,99 €</strong><p>Eigene KI-Verbindungen werden erst nach Buchung des Add-ons angezeigt. In Ultimate ist es enthalten.</p><button type="button" class="outline-btn mini" data-api-addon>API-Key-Add-on buchen</button>'}
    const moduleStep=document.getElementById('stepModules');if(moduleStep)moduleStep.classList.toggle('tier-unavailable',!rules.modules);
    const generatorGrid=el.generatorEngine?.closest('.field-grid'),generatorTitle=generatorGrid?.previousElementSibling;[generatorGrid,generatorTitle].forEach(node=>{if(node)node.hidden=!(rules.generatorChoice||state.ownApiKeys)});
    document.querySelectorAll('[data-upgrade-plans]').forEach(button=>button.onclick=()=>el.plansDialog?.showModal());
    renderProfileUi();renderModuleSelection();renderSkillSelection();
  }

  function updateAccountUi(){
    if(!el.accountBtn) return;
    if(!state.cloud.configured){ el.accountBtn.textContent="Cloud nicht verbunden"; setSyncState("Lokal"); return; }
    if(state.cloud.user){
      if(el.openLibraryBtn){el.openLibraryBtn.disabled=false;el.openLibraryBtn.title=""}if(el.generatorEngine)el.generatorEngine.disabled=false;
      el.accountBtn.textContent=state.isAdmin?"Admin · Ultimate":planRules().label;
      el.accountLoggedOut.hidden=true;el.accountLoggedIn.hidden=false;
      el.accountEmail.textContent=state.cloud.user.email||"Angemeldet";el.accountUserId.textContent=state.cloud.user.id||"";
      if(el.apiAddonCard)el.apiAddonCard.hidden=state.ownApiKeys;
      if(el.userDisplayName){el.userDisplayName.value=state.userProfile.displayName||'';el.userCompanyName.value=state.userProfile.companyName||'';el.userWebsite.value=state.userProfile.website||'';el.userDefaultClientType.value=state.userProfile.defaultClientType||''}
      const counts={profiles:state.profiles.length,modules:state.modules.length,skills:state.skills.length,projects:state.cloudProjects.length};
      el.cloudStats.innerHTML=`<div><b>${counts.profiles}</b><span>Profile</span></div><div><b>${counts.modules}</b><span>Module</span></div><div><b>${counts.skills}</b><span>Skills</span></div><div><b>${counts.projects}</b><span>Projekte</span></div>`;
      renderCloudProjects();
      if(!state.cloud.syncing) setSyncState("Cloud",state.cloud.error?"error":"synced");
    }else{
      el.accountBtn.textContent="Anmelden";el.accountLoggedOut.hidden=false;el.accountLoggedIn.hidden=true;setSyncState("Cloud bereit");if(el.openLibraryBtn){el.openLibraryBtn.disabled=true;el.openLibraryBtn.title="Bibliotheken sind nach der Anmeldung verfügbar"}if(el.generatorEngine){el.generatorEngine.value="local";state.engine="local";el.generatorEngine.disabled=true;el.generatorModel.disabled=true;}
    }
  }

  function scheduleCloudProjectSave(){
    if(!cloudReady()) return;
    clearTimeout(cloudProjectTimer);
    cloudProjectTimer=setTimeout(()=>syncCurrentProject().catch(()=>{}),900);
  }

  function scheduleCloudSettingsSave(){
    if(!cloudReady()) return;
    clearTimeout(cloudSettingsTimer);
    cloudSettingsTimer=setTimeout(()=>syncSettings().catch(()=>{}),700);
  }

  async function syncSettings(){
    if(!cloudReady()) return;
    try{
      state.cloud.syncing=true;setSyncState("Speichert…","syncing");
      await window.SiteBriefCloud.saveUserSettings(state.settings,state.activeProfileId||null);
      state.cloud.syncing=false;state.cloud.lastSynced=new Date();state.cloud.error="";setSyncState("Cloud","synced");
    }catch(err){state.cloud.syncing=false;state.cloud.error=err?.message||"Sync fehlgeschlagen";setSyncState("Sync-Fehler","error");}
  }

  async function syncCurrentProject(){
    if(!cloudReady()) return;
    try{
      state.cloud.syncing=true;setSyncState("Speichert…","syncing");
      const snapshot=serializableProjectState();
      const title=project().name||project().description.slice(0,60)||"Unbenanntes Projekt";
      await window.SiteBriefCloud.saveProject(state.currentProjectId,title,snapshot,state.currentStep>=8?"complete":"draft");
      state.cloud.syncing=false;state.cloud.lastSynced=new Date();state.cloud.error="";setSyncState("Cloud","synced");
    }catch(err){state.cloud.syncing=false;state.cloud.error=err?.message||"Sync fehlgeschlagen";setSyncState("Sync-Fehler","error");}
  }

  function mergeById(local,remote){
    const map=new Map((local||[]).map(x=>[x.id,x]));
    for(const item of remote||[]) map.set(item.id,{...map.get(item.id),...item});
    return [...map.values()];
  }

  async function loadCloudBundle({pushLocalIfEmpty=true}={}){
    if(!cloudReady()) return;
    const localLibrary={templates:[...state.templates],modules:[...state.modules],skills:[...state.skills]};
    const localProfiles=[...state.profiles];
    try{
      state.cloud.syncing=true;setSyncState("Lädt…","syncing");
      const bundle=await window.SiteBriefCloud.loadUserBundle();
      const subscription=bundle.subscription||{};
      state.isAdmin=Boolean(subscription.isAdmin);
      state.ownApiKeys=Boolean(subscription.ownApiKeys);
      state.userProfile={...state.userProfile,...(bundle.userProfile||{})};
      state.plan=state.isAdmin?"ultimate":(["active","trialing"].includes(subscription.status)&&["pro","ultimate"].includes(subscription.plan)?subscription.plan:"free");
      if(bundle.settings){
        state.settings={...DEFAULT_SETTINGS,...bundle.settings,checks:{...DEFAULT_SETTINGS.checks,...(bundle.settings.checks||{})}};
      }
      state.activeProfileId=bundle.activeProfileId||state.settings.activeProfileId||state.activeProfileId||"";
      state.profiles=mergeById(localProfiles,bundle.profiles||[]);
      state.templates=mergeById(localLibrary.templates,bundle.templates||[]);
      state.modules=mergeById(localLibrary.modules,bundle.modules||[]).map(x=>({...x,activation:x.activation||"manual"}));
      state.skills=mergeById(localLibrary.skills,bundle.skills||[]).map(x=>({...x,sourceFile:x.sourceFile||x.source_file||null,activation:x.activation||"manual"}));
      state.cloudProjects=bundle.projects||[];
      state.aiConnections=bundle.aiConnections||[];
      window.SiteBriefCloud.aiConnections=[...state.aiConnections];
      if(pushLocalIfEmpty){
        if(!(bundle.templates||[]).length && localLibrary.templates.length) for(const item of localLibrary.templates) await window.SiteBriefCloud.saveLibraryItem("template",item);
        if(!(bundle.modules||[]).length && localLibrary.modules.length) for(const item of localLibrary.modules) await window.SiteBriefCloud.saveLibraryItem("module",item);
        if(!(bundle.skills||[]).length && localLibrary.skills.length) for(const item of localLibrary.skills) await window.SiteBriefCloud.saveLibraryItem("skill",item);
        if(!(bundle.profiles||[]).length && localProfiles.length) for(const item of localProfiles) await window.SiteBriefCloud.saveProfile(item);
      }
      saveLibrary();saveProfiles();try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(state.settings));}catch{}
      state.cloud.syncing=false;state.cloud.error="";state.cloud.lastSynced=new Date();setSyncState("Cloud","synced");
      renderLibrary();renderProfileUi();populateSettingsDialog();renderAiConnections();applyPlanUi();updateAccountUi();updateGuide();
    }catch(err){state.cloud.syncing=false;state.cloud.error=err?.message||"Cloud konnte nicht geladen werden";setSyncState("Sync-Fehler","error");updateAccountUi();throw err;}
  }

  async function syncEverything(){
    if(!cloudReady()) return;
    try{
      setSyncState("Synchronisiert…","syncing");
      for(const item of state.templates) await window.SiteBriefCloud.saveLibraryItem("template",item);
      for(const item of state.modules) await window.SiteBriefCloud.saveLibraryItem("module",item);
      for(const item of state.skills) await window.SiteBriefCloud.saveLibraryItem("skill",item);
      for(const profile of state.profiles) await window.SiteBriefCloud.saveProfile(profile);
      await window.SiteBriefCloud.saveUserSettings(state.settings,state.activeProfileId||null);
      await syncCurrentProject();
      await loadCloudBundle({pushLocalIfEmpty:false});
      el.syncMessage.textContent="Alles synchronisiert.";el.syncMessage.className="auth-message good";
    }catch(err){el.syncMessage.textContent=err?.message||"Synchronisierung fehlgeschlagen.";el.syncMessage.className="auth-message error";}
  }

  async function initCloudIntegration(){
    if(!window.SiteBriefCloudReady){state.cloud.configured=false;updateAccountUi();showAccountGate();return;}
    try{
      const result=await window.SiteBriefCloudReady;
      state.cloud.configured=Boolean(result?.configured);state.cloud.user=result?.user||null;
      state.systemProfiles=(result?.systemProfiles?.length?result.systemProfiles:LOCAL_SYSTEM_PROFILES).map(x=>({...x,config:x.config||{}}));
      window.SiteBriefCloud?.subscribe?.(async(event,payload)=>{
        if(event==="auth"){
          state.cloud.user=payload.user||null;if(!state.cloud.user){state.aiConnections=[];window.SiteBriefCloud.aiConnections=[];renderAiConnections();}updateAccountUi();
          if(state.cloud.user)try{await loadCloudBundle();closeAccountGate()}catch{}
        }
      });
      if(state.cloud.user) await loadCloudBundle();
      if(!state.activeProfileId){const def=state.systemProfiles.find(x=>x.is_default)||state.systemProfiles[0];if(def){state.activeProfileId=def.id;state.settings.activeProfileId=def.id;saveProfiles();}}
      renderProfileUi();updateAccountUi();if(!state.cloud.user)showAccountGate();
    }catch(err){state.cloud.configured=false;state.cloud.error=err?.message||"Supabase nicht verfügbar";updateAccountUi();showAccountGate();}
  }

  async function signIn(){
    if(!state.cloud.configured){el.authMessage.textContent="Supabase ist in diesem Deployment noch nicht konfiguriert.";el.authMessage.className="auth-message error";return;}
    const email=el.authEmail.value.trim(),password=el.authPassword.value;if(!email||!password)return;
    try{el.authMessage.textContent="Anmeldung läuft…";el.authMessage.className="auth-message";const data=await window.SiteBriefCloud.signIn(email,password);if(el.rememberEmail?.checked)localStorage.setItem(REMEMBERED_EMAIL_KEY,email);else localStorage.removeItem(REMEMBERED_EMAIL_KEY);state.cloud.user=data.user;el.authPassword.value="";await loadCloudBundle();el.authMessage.textContent="Angemeldet. Die Sitzung bleibt auf diesem Gerät erhalten.";el.authMessage.className="auth-message good";updateAccountUi();closeAccountGate();}catch(err){el.authMessage.textContent=err?.message||"Anmeldung fehlgeschlagen.";el.authMessage.className="auth-message error";}
  }

  async function signUp(){
    if(!state.cloud.configured){el.authMessage.textContent="Supabase ist in diesem Deployment noch nicht konfiguriert.";el.authMessage.className="auth-message error";return;}
    const email=el.authEmail.value.trim(),password=el.authPassword.value;if(!email||password.length<8){el.authMessage.textContent="Bitte E-Mail und mindestens 8 Zeichen Passwort eingeben.";el.authMessage.className="auth-message error";return;}
    try{const data=await window.SiteBriefCloud.signUp(email,password);if(data.session){state.cloud.user=data.user;await loadCloudBundle();el.authMessage.textContent="Konto angelegt und angemeldet.";closeAccountGate();}else el.authMessage.textContent="Konto angelegt. Bitte bestätige die E-Mail und melde dich danach an.";el.authMessage.className="auth-message good";updateAccountUi();}catch(err){el.authMessage.textContent=err?.message||"Konto konnte nicht angelegt werden.";el.authMessage.className="auth-message error";}
  }

  async function signOut(){
    try{await window.SiteBriefCloud.signOut();state.cloud.user=null;state.cloudProjects=[];state.aiConnections=[];window.SiteBriefCloud.aiConnections=[];renderAiConnections();setSyncState("Cloud bereit");updateAccountUi();el.accountDialog.close();}catch(err){el.syncMessage.textContent=err?.message||"Abmelden fehlgeschlagen.";el.syncMessage.className="auth-message error";}
  }

  function applySavedState(saved,{persistLocal=false}={}){
    if(!saved || typeof saved!=="object") return;
    state.currentProjectId = saved.projectId || state.currentProjectId || uid("project");
    state.mode = saved.mode || state.settings.defaultMode || "guided";
    state.currentStep = clamp(saved.currentStep || 1,1,8);
    state.maxVisited = clamp(saved.maxVisited || state.currentStep,1,8);
    state.understandingConfirmed = Boolean(saved.understandingConfirmed);
    state.understanding = saved.understanding || null;
    state.urls = Array.isArray(saved.urls) ? saved.urls : [];
    state.images = Array.isArray(saved.images) ? saved.images.map(x => ({...x,dataUrl:x.dataUrl||"",previewUrl:x.previewUrl||""})) : [];
    state.targetAgent = AGENT_NAMES[saved.targetAgent] ? saved.targetAgent : (state.settings.defaultAgent||"codex");
    state.engine = ["local","gateway","openai","gemini"].includes(saved.engine) ? saved.engine : (state.settings.defaultEngine||"local");
    state.model = saved.model || state.settings.defaultModel || "";
    state.outputTarget = OUTPUT_TARGETS[saved.outputTarget] ? saved.outputTarget : "next-vercel";
    state.templateId = saved.templateId || "";
    state.selectedModuleIds = Array.isArray(saved.selectedModuleIds) ? saved.selectedModuleIds : [];
    state.selectedSkillIds = Array.isArray(saved.selectedSkillIds) ? saved.selectedSkillIds : [];
    state.concepts = Array.isArray(saved.concepts) ? saved.concepts : [];
    state.selectedConceptId = saved.selectedConceptId || "";
    state.refinements = Array.isArray(saved.refinements) ? saved.refinements : [];
    state.clarifications = Array.isArray(saved.clarifications) ? saved.clarifications : [];
    state.projectReview = saved.projectReview || null; state.reviewSignature=saved.reviewSignature||""; state.reviewDeferred=Boolean(saved.reviewDeferred);
    const p = saved.project || {};
    el.projectName.value = p.name || ""; el.projectDescription.value = p.description || ""; el.projectType.value = p.type || "Website"; el.projectGoal.value = p.goal || "Anfragen / Leads"; el.projectAudience.value = p.audience || ""; el.projectSpecial.value = p.special || "";el.clientName.value=p.client?.name||"";el.clientType.value=p.client?.type||state.userProfile.defaultClientType||"kunde";el.clientWebsite.value=p.client?.website||"";el.clientContact.value=p.client?.contact||"";
    el.descriptionCount.textContent = el.projectDescription.value.length;
    const c = saved.controls || {}; ["originality","antiSlop","motion","density"].forEach(id => { if(c[id] != null){ el[id].value = c[id]; el[id].nextElementSibling.value = c[id]; } });
    if(saved.conceptCount) el.conceptCount.value = String(clamp(saved.conceptCount,3,5));
    if(el.previewFormat)el.previewFormat.value=['image-cloudflare','image-gemini'].includes(saved.previewFormat)?saved.previewFormat:'html';
    applyAlwaysActiveItems(false);
    if(persistLocal) try{localStorage.setItem(STORAGE_KEY,JSON.stringify(serializableProjectState()));}catch{}
  }

  function restoreState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if(saved) applySavedState(saved);
    }catch{}
  }

  async function hydrateCloudReferenceImages(){
    if(!cloudReady()) return;
    for(const item of state.images){
      if(item.storagePath && !item.dataUrl){
        try{
          const url=await window.SiteBriefCloud.signedReferenceUrl(item.storagePath,3600);
          item.previewUrl=url;
          const res=await fetch(url);if(res.ok){const blob=await res.blob();item.dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});}
        }catch{}
      }
    }
  }

  function renderCloudProjects(){
    if(!el.cloudProjectList)return;el.cloudProjectList.innerHTML="";
    if(!state.cloudProjects.length){el.cloudProjectList.innerHTML='<div class="cloud-project-row"><div><strong>Noch keine Cloud-Projekte</strong><small>Der aktuelle Entwurf wird nach Login automatisch gespeichert.</small></div></div>';return;}
    state.cloudProjects.slice(0,8).forEach(row=>{
      const div=document.createElement("div");div.className="cloud-project-row";const date=row.updated_at?new Date(row.updated_at).toLocaleString("de-DE"):"";
      div.innerHTML=`<div><strong>${escapeHtml(row.title||"Unbenanntes Projekt")}</strong><small>${escapeHtml(date)} · ${escapeHtml(row.status||"draft")}</small></div><button type="button" data-load>laden</button><button type="button" data-delete>löschen</button>`;
      div.querySelector("[data-load]").addEventListener("click",()=>loadCloudProject(row));div.querySelector("[data-delete]").addEventListener("click",()=>deleteCloudProject(row.id));el.cloudProjectList.appendChild(div);
    });
  }

  async function loadCloudProject(row){
    if(!row?.state)return;applySavedState(row.state,{persistLocal:true});state.currentProjectId=row.id;await hydrateCloudReferenceImages();renderReferences();renderUnderstanding();renderLibrary();renderConcepts();renderSelectedPreview();updateEngineUi();$$('#agentSelector button').forEach(b=>b.classList.toggle('active',b.dataset.agent===state.targetAgent));$$('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));goStep(state.currentStep,true);el.accountDialog.close();
  }

  async function deleteCloudProject(id){
    if(!confirm("Dieses Cloud-Projekt wirklich löschen?"))return;try{await window.SiteBriefCloud.deleteProject(id);state.cloudProjects=state.cloudProjects.filter(x=>x.id!==id);renderCloudProjects();updateAccountUi()}catch(err){el.syncMessage.textContent=err?.message||"Projekt konnte nicht gelöscht werden.";el.syncMessage.className="auth-message error";}
  }

  function tokenize(text){
    return [...new Set(String(text||"").toLowerCase().replace(/[^a-z0-9äöüß\s-]/g," ").split(/\s+/).filter(x => x.length > 3))];
  }

  function inferDomain(text){
    const t = String(text||"").toLowerCase();
    if(/fitness|gym|training|sport|crossfit|boxstudio|boxing/.test(t)) return "fitness";
    if(/restaurant|café|cafe|döner|doener|pizza|bistro|küche|food|imbiss|bar\b|bäck/.test(t)) return "food";
    if(/handwerk|elektr|hausmeister|garten|reparatur|maler|sanitär|tischler|bau\b|montage|servicebetrieb/.test(t)) return "craft";
    if(/friseur|beauty|kosmetik|nagel|nail|barber|salon|spa\b/.test(t)) return "beauty";
    if(/shop|produkt|e-?commerce|warenkorb|verkauf|store\b/.test(t)) return "retail";
    if(/web-?app|software|saas|dashboard|tool\b|plattform|portal|login|community/.test(t)) return "digital";
    return "generic";
  }

  function localAnalyzeProject(){
    const p = project();
    const text = `${p.description} ${p.audience} ${p.special}`;
    const domain = inferDomain(text);
    let detectedType = p.type;
    if(/onlineshop|online-shop|e-?commerce|warenkorb|checkout/.test(text.toLowerCase())) detectedType = "Onlineshop";
    else if(/web-?app|dashboard|portal|tool\b|login/.test(text.toLowerCase())) detectedType = "Web-App";
    else if(/landingpage|kampagne/.test(text.toLowerCase())) detectedType = "Landingpage";
    const priorities = [];
    if(p.goal.includes("Anfragen")) priorities.push("Kontakt und Anfrageweg müssen ohne Umwege verständlich sein.");
    if(p.goal === "Verkaufen" || detectedType === "Onlineshop") priorities.push("Produktverständnis, Vertrauen und Kaufweg gehören vor dekorative Elemente.");
    if(p.goal.includes("Termine")) priorities.push("Buchung oder Termin-Kontakt sollte früh im Ablauf sichtbar sein.");
    if(/lokal|umkreis|stadt|region|vor ort|vor ort|handwerk|hausmeister/.test(text.toLowerCase())) priorities.push("Lokaler Bezug und echte Belege sind wichtiger als austauschbare Marketing-Claims.");
    if(/nicht.*ki|kein.*ki|anti.?ki|keine.*karten|nicht.*agentur|bodenständig|echt/.test(text.toLowerCase())) priorities.push("Eigenständige Gestaltung ohne typische KI-/SaaS-Muster ist eine harte Designvorgabe.");
    if(p.audience) priorities.push(`Zielgruppe: ${p.audience}.`);
    if(p.special) priorities.push(`Besonderer Wunsch: ${p.special}.`);
    if(!priorities.length) priorities.push("Struktur, Bildsprache und Ton sollen direkt aus dem beschriebenen Projekt entstehen.");
    const domainLabel = ({fitness:"Fitness-/Sportangebot",food:"Gastronomie",craft:"lokaler Dienstleistungs-/Handwerksbetrieb",beauty:"Beauty-/Studioangebot",retail:"Shop-/Produktprojekt",digital:"digitales Produkt",generic:"Website-Projekt"})[domain];
    const summary = p.name
      ? `${p.name} wird als ${domainLabel} mit dem Hauptziel „${p.goal}“ aufgebaut. Der Entwurf soll sich aus deinem konkreten Angebot und deinen Referenzen ableiten, nicht aus einem Standard-Template.`
      : `Es entsteht ein ${domainLabel} mit dem Hauptziel „${p.goal}“. Der Entwurf soll sich aus deinem konkreten Angebot und deinen Referenzen ableiten, nicht aus einem Standard-Template.`;
    return {summary,priorities,detectedType,detectedGoal:p.goal,domain};
  }

  async function analyzeProject(){
    if(project().description.length < 20){
      el.projectValidation.textContent = "Bitte beschreibe das Vorhaben etwas genauer (mindestens ca. 20 Zeichen).";
      return false;
    }
    el.projectValidation.textContent = "";
    state.understanding = localAnalyzeProject();
    renderUnderstanding();
    saveState();
    return true;
  }

  function activeCheckNames(){
    const labels={privacy:"Datenschutz",imprint:"Impressum / Anbieterangaben",legal:"rechtliche Plausibilität",accessibility:"Barrierefreiheit",security:"Sicherheit",performance:"Performance",seo:"SEO-Grundlagen"};
    return Object.entries(state.settings.checks||{}).filter(([,v])=>v).map(([k])=>labels[k]).filter(Boolean);
  }

  function settingsForApi(){
    return {aiClarifications:state.settings.aiClarifications,maxQuestions:Number(state.settings.maxQuestions)||4,criticalBehavior:state.settings.criticalBehavior,askMissing:state.settings.askMissing,askConflict:state.settings.askConflict,askInfeasible:state.settings.askInfeasible,suggestAlternatives:state.settings.suggestAlternatives,legalRegion:state.settings.legalRegion,checks:{...state.settings.checks},noInventLegal:state.settings.noInventLegal,finalChecklist:state.settings.finalChecklist};
  }

  function allProfiles(){
    const system=(state.systemProfiles||[]).map(x=>({...x,_kind:"system"}));
    const own=(state.profiles||[]).map(x=>({...x,_kind:"user"}));
    return [...system,...own];
  }

  function profileConfigFromCurrent(){
    return {
      mode:state.mode||"guided",
      targetAgent:state.targetAgent||"codex",
      engine:state.engine||"local",
      model:el.generatorModel?.value.trim()||state.model||"",
      outputTarget:state.outputTarget||"next-vercel",
      conceptCount:Number(el.conceptCount?.value)||5,
      selectedModuleIds:[...state.selectedModuleIds],
      selectedSkillIds:[...state.selectedSkillIds],
      settings:{...state.settings,checks:{...state.settings.checks}}
    };
  }

  function renderProfileUi(){
    if(!el.setActiveProfile) return;
    const current=state.activeProfileId||"";
    el.setActiveProfile.innerHTML='<option value="">Lokale Standardwerte</option>';
    const systems=state.systemProfiles||[];
    if(systems.length){
      const g=document.createElement("optgroup");g.label="Systemprofile";
      systems.forEach(x=>{const o=document.createElement("option");o.value=x.id;o.textContent=x.name;g.appendChild(o)});el.setActiveProfile.appendChild(g);
    }
    if(planRules().customProfiles&&state.profiles.length){
      const g=document.createElement("optgroup");g.label="Eigene Profile";
      state.profiles.forEach(x=>{const o=document.createElement("option");o.value=x.id;o.textContent=x.name;g.appendChild(o)});el.setActiveProfile.appendChild(g);
    }
    el.setActiveProfile.value=allProfiles().some(x=>x.id===current)?current:"";
    if(el.saveProfileBtn)el.saveProfileBtn.disabled=!planRules().customProfiles;
    if(el.manageProfilesBtn)el.manageProfilesBtn.disabled=!planRules().customProfiles;
    renderProfileList();renderProfileImpact();
  }

  function renderProfileImpact(){
    if(!el.profileImpact)return;
    const profile=allProfiles().find(x=>x.id===el.setActiveProfile?.value),c=profile?.config;
    if(!c){el.profileImpact.innerHTML='<span class="empty">Wähle ein Profil, um den enthaltenen Projektaufbau zu sehen.</span>';return;}
    const mods=(c.selectedModuleIds||[]).filter(id=>state.modules.some(x=>x.id===id)).length;
    const skills=(c.selectedSkillIds||[]).filter(id=>state.skills.some(x=>x.id===id)).length;
    const values=[AGENT_NAMES[c.targetAgent]||c.targetAgent||'Codex',c.engine==='gemini'?'Gemini direkt':c.engine==='openai'?'OpenAI direkt':c.engine==='gateway'?'AI Gateway':'Lokal',c.model||'Standardmodell',OUTPUT_TARGETS[c.outputTarget]||OUTPUT_TARGETS['next-vercel'],c.mode==='expert'?'Experte':c.mode==='auto'?'Auto':'Geführt',`${Number(c.conceptCount)||5} Vorschauen`,`${mods} Module`,`${skills} Skills`];
    el.profileImpact.innerHTML=values.map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  }

  function renderDefaultActivationSettings(){
    if(!el.defaultModuleSettings||!el.defaultSkillSettings)return;
    const options='<option value="always">Immer aktiv</option><option value="default">Standard</option><option value="manual">Manuell</option>';
    el.defaultModuleSettings.innerHTML="";
    if(!state.modules.length) el.defaultModuleSettings.innerHTML='<div class="default-rule-row"><div><strong>Noch keine Module</strong><small>Lege deine Module zuerst in den Bibliotheken an.</small></div></div>';
    state.modules.forEach(item=>{
      const row=document.createElement("div");row.className="default-rule-row";row.innerHTML=`<div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.tag||item.summary||"Eigenes Modul")}</small></div><select>${options}</select>`;
      const select=row.querySelector("select");select.value=item.activation||"manual";select.addEventListener("change",async()=>{item.activation=select.value;saveLibrary();applyAlwaysActiveItems();renderModuleSelection();if(cloudReady())try{await window.SiteBriefCloud.saveLibraryItem("module",item)}catch{};});el.defaultModuleSettings.appendChild(row);
    });
    el.defaultSkillSettings.innerHTML="";
    if(!state.skills.length) el.defaultSkillSettings.innerHTML='<div class="default-rule-row"><div><strong>Noch keine Skills</strong><small>Agent-Skills kannst du in der Bibliothek anlegen oder importieren.</small></div></div>';
    state.skills.forEach(item=>{
      const row=document.createElement("div");row.className="default-rule-row";row.innerHTML=`<div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.agent==="all"?"Alle Agents":AGENT_NAMES[item.agent]||item.agent)}</small></div><select>${options}</select>`;
      const select=row.querySelector("select");select.value=item.activation||"manual";select.addEventListener("change",async()=>{item.activation=select.value;saveLibrary();applyAlwaysActiveItems();renderSkillSelection();if(cloudReady())try{await window.SiteBriefCloud.saveLibraryItem("skill",item)}catch{};});el.defaultSkillSettings.appendChild(row);
    });
  }

  function applyAlwaysActiveItems(includeDefaults=false){
    const moduleIds=state.modules.filter(x=>x.activation==="always" || (includeDefaults&&x.activation==="default")).map(x=>x.id);
    const skillIds=state.skills.filter(x=>(x.agent==="all"||x.agent===state.targetAgent) && (x.activation==="always" || (includeDefaults&&x.activation==="default"))).map(x=>x.id);
    state.selectedModuleIds=[...new Set([...state.selectedModuleIds,...moduleIds])];
    state.selectedSkillIds=[...new Set([...state.selectedSkillIds,...skillIds])];
  }

  function applyProfileById(id,{persist=true,forNewProject=false}={}){
    const profile=allProfiles().find(x=>x.id===id);
    if(!profile){if(!id){state.activeProfileId="";if(persist)saveProfiles();}return false;}
    const config=profile.config||{};const ps=config.settings||{};
    state.settings={...DEFAULT_SETTINGS,...state.settings,...ps,checks:{...DEFAULT_SETTINGS.checks,...state.settings.checks,...(ps.checks||{})}};
    state.settings.defaultAgent=config.targetAgent||state.settings.defaultAgent||"codex";
    state.settings.defaultEngine=config.engine||state.settings.defaultEngine||"local";
    state.settings.defaultModel=config.model??state.settings.defaultModel??"";
    state.settings.defaultMode=config.mode||state.settings.defaultMode||"guided";
    state.settings.defaultConceptCount=Number(config.conceptCount)||state.settings.defaultConceptCount||5;
    state.activeProfileId=id;state.settings.activeProfileId=id;
    if(forNewProject){
      state.mode=state.settings.defaultMode;state.targetAgent=state.settings.defaultAgent;state.engine=state.settings.defaultEngine;state.model=state.settings.defaultModel;state.outputTarget=OUTPUT_TARGETS[config.outputTarget]?config.outputTarget:"next-vercel";
      state.selectedModuleIds=[...(config.selectedModuleIds||[])];state.selectedSkillIds=[...(config.selectedSkillIds||[])];applyAlwaysActiveItems(true);
      if(el.conceptCount)el.conceptCount.value=String(state.settings.defaultConceptCount);if(el.generatorEngine)el.generatorEngine.value=state.engine;if(el.generatorModel)el.generatorModel.value=state.model;
    }
    if(persist){saveSettings();saveProfiles();}
    $$('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    $$('#agentSelector button').forEach(b=>b.classList.toggle('active',b.dataset.agent===state.targetAgent));
    renderOutputTarget();updateEngineUi();renderModuleSelection();renderSkillSelection();renderProfileUi();updateGuide();saveState();return true;
  }

  function renderProfileList(){
    if(!el.profileList)return;el.profileList.innerHTML="";
    const profiles=allProfiles();
    if(!profiles.length){el.profileList.innerHTML='<div class="library-item"><div><strong>Noch keine Profile</strong><p>Systemprofile erscheinen nach der Supabase-Verbindung.</p></div></div>';return;}
    profiles.forEach(profile=>{
      const system=profile._kind==="system";const row=document.createElement("div");row.className=`library-item ${system?"profile-system":""}`;
      row.innerHTML=`<div><span class="profile-badge">${system?"SYSTEM":"EIGEN"}</span><strong>${escapeHtml(profile.name)}</strong><p>${escapeHtml(profile.description||"")}</p></div><div class="library-item-actions"><button type="button" data-apply>anwenden</button>${system?'<button type="button" data-duplicate>duplizieren</button>':'<button type="button" data-delete>löschen</button>'}</div>`;
      row.querySelector("[data-apply]").addEventListener("click",()=>{applyProfileById(profile.id,{persist:true,forNewProject:true});el.profileDialog.close()});
      const dup=row.querySelector("[data-duplicate]");if(dup)dup.addEventListener("click",()=>duplicateSystemProfile(profile));
      const del=row.querySelector("[data-delete]");if(del)del.addEventListener("click",()=>deleteOwnProfile(profile.id));
      el.profileList.appendChild(row);
    });
  }

  async function duplicateSystemProfile(profile){
    const own={id:uid("profile"),name:`${profile.name} – Kopie`,description:profile.description||"",config:JSON.parse(JSON.stringify(profile.config||{})),isDefault:false};state.profiles.unshift(own);saveProfiles();renderProfileUi();if(cloudReady())try{await window.SiteBriefCloud.saveProfile(own)}catch{};
  }

  async function deleteOwnProfile(id){
    if(!confirm("Dieses eigene Profil wirklich löschen?"))return;state.profiles=state.profiles.filter(x=>x.id!==id);if(state.activeProfileId===id)state.activeProfileId="";saveProfiles();renderProfileUi();if(cloudReady())try{await window.SiteBriefCloud.deleteProfile(id)}catch{};
  }

  async function createProfileFromDialog(){
    if(!planRules().customProfiles){el.plansDialog?.showModal();return;}
    const name=el.newProfileName.value.trim();if(!name)return;const item={id:uid("profile"),name,description:el.newProfileDescription.value.trim(),config:profileConfigFromCurrent(),isDefault:false};state.profiles.unshift(item);state.activeProfileId=item.id;saveProfiles();renderProfileUi();el.newProfileName.value="";el.newProfileDescription.value="";if(cloudReady())try{await window.SiteBriefCloud.saveProfile(item);await syncSettings()}catch{};
  }

  function populateSettingsDialog(){
    const s=state.settings;renderProfileUi();
    el.setAiClarifications.checked=Boolean(s.aiClarifications);el.setMaxQuestions.value=String(s.maxQuestions||4);el.setCriticalBehavior.value=s.criticalBehavior||"block";
    el.setAskMissing.checked=Boolean(s.askMissing);el.setAskConflict.checked=Boolean(s.askConflict);el.setAskInfeasible.checked=Boolean(s.askInfeasible);el.setSuggestAlternatives.checked=Boolean(s.suggestAlternatives);
    el.setLegalRegion.value=s.legalRegion||"";el.setCheckPrivacy.checked=Boolean(s.checks?.privacy);el.setCheckImprint.checked=Boolean(s.checks?.imprint);el.setCheckLegal.checked=Boolean(s.checks?.legal);el.setCheckAccessibility.checked=Boolean(s.checks?.accessibility);el.setCheckSecurity.checked=Boolean(s.checks?.security);el.setCheckPerformance.checked=Boolean(s.checks?.performance);el.setCheckSeo.checked=Boolean(s.checks?.seo);
    el.setNoInventLegal.checked=Boolean(s.noInventLegal);el.setFinalChecklist.checked=Boolean(s.finalChecklist);renderAiConnections();
  }

  function saveSettingsFromDialog(){
    state.settings={
      ...state.settings,
      activeProfileId:state.activeProfileId||"",
      aiClarifications:el.setAiClarifications.checked,maxQuestions:Number(el.setMaxQuestions.value)||4,criticalBehavior:el.setCriticalBehavior.value,
      askMissing:el.setAskMissing.checked,askConflict:el.setAskConflict.checked,askInfeasible:el.setAskInfeasible.checked,suggestAlternatives:el.setSuggestAlternatives.checked,
      legalRegion:el.setLegalRegion.value.trim()||"nicht festgelegt",checks:{privacy:el.setCheckPrivacy.checked,imprint:el.setCheckImprint.checked,legal:el.setCheckLegal.checked,accessibility:el.setCheckAccessibility.checked,security:el.setCheckSecurity.checked,performance:el.setCheckPerformance.checked,seo:el.setCheckSeo.checked},
      noInventLegal:el.setNoInventLegal.checked,finalChecklist:el.setFinalChecklist.checked
    };
    state.projectReview=null;state.reviewSignature="";state.reviewDeferred=false;saveSettings();saveProfiles();saveState();renderAiReviewCard();updateGuide();el.settingsDialog.close();
  }

  function localProjectReview(){
    const p=project(), questions=[], warnings=[], blockers=[];
    if(state.settings.askMissing && !p.audience) questions.push({id:uid("q"),question:"Für wen soll die Seite hauptsächlich funktionieren?",reason:"Zielgruppe beeinflusst Ton, Informationsdichte und wichtigste Handlungen.",suggestedAnswer:"",required:false});
    if(state.settings.askMissing && /shop|onlineshop/i.test(p.type) && !/produkt|sortiment|verkauf/i.test(p.description)) questions.push({id:uid("q"),question:"Was wird im Shop verkauft und gibt es besondere Varianten, Versand- oder Zahlungsanforderungen?",reason:"Ohne diese Angaben bleibt die Shop-Struktur zu allgemein.",suggestedAnswer:"",required:false});
    if(state.settings.checks?.privacy) warnings.push({area:"Datenschutz",severity:"info",message:"Formulare, Tracking, Karten, Videos, Fonts und andere externe Dienste müssen im späteren Projekt auf Datenschutzfolgen geprüft werden."});
    if(state.settings.checks?.imprint) warnings.push({area:"Impressum",severity:"info",message:`Anbieterangaben für den Rechtsraum „${state.settings.legalRegion}“ als Pflichtpunkt prüfen; fehlende Firmendaten nicht erfinden.`});
    if(state.settings.noInventLegal) warnings.push({area:"Recht",severity:"info",message:"Rechtliche Pflichttexte und Unternehmensdaten dürfen nicht aus Vermutungen erzeugt werden."});
    return {ready:questions.length===0,questions:questions.slice(0,state.settings.maxQuestions),warnings,blockers,assumptions:[]};
  }

  function renderAiReviewCard(){
    if(!el.aiReviewCard) return;
    if(!cloudReady()){el.aiReviewTitle.textContent="Im Gastmodus nicht verfügbar";el.aiReviewText.textContent="Die ausführliche Projektprüfung und Gegenfragen werden nach der Anmeldung freigeschaltet.";el.runAiReviewBtn.hidden=true;return;}el.runAiReviewBtn.hidden=false;
    if(state.engine==="local"){
      el.aiReviewTitle.textContent="Lokale Grundprüfung aktiv";el.aiReviewText.textContent=`Ohne externe KI werden Grundhinweise geprüft. Aktive Pflichtbereiche: ${activeCheckNames().join(", ")||"keine"}.`;el.runAiReviewBtn.textContent="Grundprüfung anzeigen";return;
    }
    if(!state.settings.aiClarifications){el.aiReviewTitle.textContent="KI-Gegenfragen sind deaktiviert";el.aiReviewText.textContent="Du kannst sie unter Einstellungen wieder aktivieren. Die Pflichtbereiche bleiben trotzdem Bestandteil des Master-Prompts.";el.runAiReviewBtn.textContent="Einstellungen";return;}
    const review=state.projectReview;
    if(review && state.reviewSignature===projectSignature()){
      const unanswered=(review.questions||[]).filter(q=>!state.clarifications.some(a=>a.question===q.question && a.answer?.trim())).length;
      el.aiReviewTitle.textContent=unanswered?`${unanswered} offene Gegenfrage${unanswered===1?"":"n"}`:"Projektprüfung erledigt";
      el.aiReviewText.textContent=`${(review.warnings||[]).length} Hinweis${(review.warnings||[]).length===1?"":"e"}, ${(review.blockers||[]).length} kritische Punkte. Rechtsraum: ${state.settings.legalRegion}.`;
      el.runAiReviewBtn.textContent=unanswered?"Fragen öffnen":"Erneut prüfen";
    }else{el.aiReviewTitle.textContent="Noch nicht mit der Generator-KI geprüft";el.aiReviewText.textContent="Die KI kann fehlende Angaben, Widersprüche, nicht machbare Anforderungen und aktive Pflichtbereiche vor der Konzeptphase prüfen.";el.runAiReviewBtn.textContent="Jetzt prüfen";}
  }

  function renderClarificationDialog(review){
    const warnings=[...(review.blockers||[]).map(x=>({...x,severity:"critical",area:x.area||"Blocker"})),...(review.warnings||[])];
    el.clarificationWarnings.innerHTML=warnings.map(w=>`<div class="clarification-warning ${w.severity==="critical"?"critical":""}"><strong>${escapeHtml(w.area||"Hinweis")}</strong> — ${escapeHtml(w.message||w.alternative||"")}${w.alternative?`<br><span>Alternative: ${escapeHtml(w.alternative)}</span>`:""}</div>`).join("");
    el.clarificationQuestions.innerHTML="";
    (review.questions||[]).slice(0,state.settings.maxQuestions).forEach((q,i)=>{
      const existing=state.clarifications.find(a=>a.question===q.question)?.answer||"";
      const row=document.createElement("div");row.className="clarification-question";row.dataset.questionId=q.id||String(i);
      const suggestions=questionSuggestions(q);
      row.innerHTML=`<span>FRAGE ${String(i+1).padStart(2,"0")}${q.required?" · ERFORDERLICH":""}</span><h3>${escapeHtml(q.question)}</h3><p>${escapeHtml(q.reason||"")}</p><textarea ${q.required?"required":""} placeholder="Deine Antwort…">${escapeHtml(existing)}</textarea>${suggestions.length?`<div class="suggestion-options" aria-label="Antwortvorschläge">${suggestions.map(s=>`<button class="suggestion-chip" type="button">${escapeHtml(s)}</button>`).join("")}</div>`:""}`;
      $$(".suggestion-chip",row).forEach((button,index)=>button.addEventListener("click",()=>{row.querySelector("textarea").value=suggestions[index];row.querySelector("textarea").focus()}));
      el.clarificationQuestions.appendChild(row);
    });
    el.clarificationIntro.textContent=(review.questions||[]).length?"Die Generator-KI braucht bzw. empfiehlt diese Klärungen, damit Konzept und Master-Prompt nicht auf stillen Annahmen beruhen.":"Keine Gegenfragen nötig. Die Hinweise werden trotzdem in Blueprint und Master-Prompt übernommen.";
    el.deferClarificationsBtn.hidden=state.settings.criticalBehavior==="block" && (review.blockers||[]).length>0;
    el.clarificationDialog.showModal();
  }

  function renderOutputTarget(){
    if(!el.outputTargetSelector)return;$$('[data-output]',el.outputTargetSelector).forEach(button=>button.classList.toggle('active',button.dataset.output===state.outputTarget));
  }

  function questionSuggestions(q){
    const text=`${q.question||""} ${q.reason||""}`.toLowerCase();let suggestions=[...(Array.isArray(q.suggestions)?q.suggestions:[]),q.suggestedAnswer].filter(Boolean);
    if(/cms|content.management|inhalte|beiträge|tagebuch/.test(text))suggestions.push("Sanity – flexibel und strukturiert","WordPress – vertraut und leicht selbst pflegbar","Kein CMS – Inhalte werden im Code gepflegt");
    if(/exif|standort|metadaten/.test(text))suggestions.push("Ja – EXIF-Daten automatisch entfernen","Nein – Metadaten bewusst erhalten","Vor jedem Upload manuell entscheiden");
    if(/animation|effekt|ladezeit|performance…35641 tokens truncated…tep-panel preview-step" data-step-panel="6" id="stepPreviews">
        <div class="section-kicker">06 — VORSCHAUEN</div>
        <div class="preview-step-head">
          <div><h1>3–5 echte Richtungen.</h1><p class="lead">Echte HTML/CSS-Seiten statt KI-Bilder: direkt vergleichbar, responsiv und näher am späteren Ergebnis.</p></div>
          <div class="preview-generation-controls">
            <label class="compact-field"><span>Vorschau</span><select id="previewFormat"><option value="html" selected>HTML-Seiten · kostenlos</option><option value="image-cloudflare">KI-Bilder · Cloudflare Free</option><option value="image-gemini">KI-Bilder · Gemini</option></select></label>
            <label class="compact-field"><span>Anzahl</span><select id="conceptCount"><option>3</option><option>4</option><option selected>5</option></select></label>
            <button type="button" class="solid-btn" id="generateConceptsBtn">Vorschauen erzeugen</button>
          </div>
        </div>
        <div id="generationStatus" class="generation-status">Noch keine Vorschauen erzeugt.</div>
        <div class="task-progress preview-progress" id="previewProgress" hidden><div class="task-progress-label"><b id="previewProgressPercent">0 %</b><small id="previewProgressText">Vorschauen werden vorbereitet…</small></div><div class="task-progress-track"><i id="previewProgressFill"></i></div></div>
        <div id="conceptGallery" class="concept-gallery"></div>

        <div class="step-actions"><button type="button" class="text-btn back-btn" data-back="5">← Zurück</button><button type="button" class="solid-btn next-btn" data-next="7" id="toRefineBtn">Auswahl verfeinern <i>→</i></button></div>
      </section>

      <dialog id="previewLightbox" class="preview-lightbox" aria-labelledby="previewLightboxTitle">
        <div class="preview-lightbox-frame">
          <div class="preview-lightbox-head">
            <div><small>VORSCHAU</small><h2 id="previewLightboxTitle">Richtung ansehen</h2></div>
            <button type="button" class="lightbox-close" id="previewLightboxClose" aria-label="Vollbildansicht schließen">×</button>
          </div>
          <div id="previewLightboxMedia" class="preview-lightbox-media"></div>
          <div class="preview-lightbox-actions">
            <button type="button" class="outline-btn" id="previewLightboxDownload">Bild herunterladen</button>
            <button type="button" class="solid-btn" id="previewLightboxSelect">Diese Richtung wählen</button>
          </div>
        </div>
      </dialog>

      <section class="step-panel" data-step-panel="7" id="stepRefine">
        <div class="section-kicker">07 — FEINSCHLIFF</div>
        <h1>Eine Richtung. Dann gezielt ändern.</h1>
        <p class="lead">Sag nur, was anders werden soll. Deine Änderungswünsche werden in der Vorschau und später im Master-Prompt festgehalten.</p>

        <div id="selectedPreviewLarge" class="selected-preview-large"></div>

        <div class="quick-refinements" id="quickRefinements">
          <button type="button">heller</button><button type="button">dunkler</button><button type="button">Bild größer</button><button type="button">ruhiger</button><button type="button">mehr Typografie</button><button type="button">weniger KI-Look</button><button type="button">mehr wie Referenz 1</button>
        </div>
        <label class="field field-large"><span>Was möchtest du ändern?</span><textarea id="refinementInput" rows="5" placeholder="z. B. Hero behalten, aber die Informationsstruktur aus Vorschau C übernehmen. Schrift etwas ruhiger und Bild größer."></textarea></label>
        <div class="inline-actions"><button type="button" class="outline-btn" id="applyRefinementBtn">Änderung anwenden</button><button type="button" class="text-btn" id="clearRefinementsBtn">Änderungen löschen</button></div>
        <div id="refinementHistory" class="refinement-history"></div>

        <div class="step-actions"><button type="button" class="text-btn back-btn" data-back="6">← Zurück</button><button type="button" class="solid-btn next-btn" data-next="8">Master-Prompt erstellen <i>→</i></button></div>
      </section>

      <section class="step-panel" data-step-panel="8" id="stepPrompt">
        <div class="section-kicker">08 — MASTER-PROMPT</div>
        <h1>Fertig für deinen Agenten.</h1>
        <p class="lead">SiteBrief verbindet Projekt, Referenzen, Auswahl, Module, Skills und Feinschliff zu einem agentenspezifischen Master-Prompt.</p>

        <div class="prompt-meta" id="promptMeta"></div>
        <textarea id="masterPrompt" class="master-prompt" spellcheck="false"></textarea>
        <div class="prompt-actions"><button type="button" class="solid-btn" id="copyPromptBtn">Master-Prompt kopieren</button><button type="button" class="outline-btn" id="downloadPromptBtn">Als .md speichern</button><button type="button" class="outline-btn" id="downloadBriefBtn">Blueprint als JSON</button></div>
        <section class="client-result-card">
          <div><span>PROJEKTBERICHT · KUNDENUNTERLAGEN AB PRO</span><h2>Dokumentation zum Ergebnis</h2><p>Ein vollständiger Projektbericht für jeden Durchlauf; Kundenbriefing und Übergabeübersicht ab Pro.</p></div>
          <div class="client-result-actions"><button type="button" class="solid-btn" id="downloadProjectReportBtn">Projektbericht</button><button type="button" class="outline-btn" id="downloadClientBriefBtn">Kundenbriefing</button><button type="button" class="outline-btn" id="downloadHandoverBtn">Übergabe-Dokument</button></div>
          <small id="clientResultHint"></small>
        </section>
        <section class="export-result-card">
          <div><span>EXPORT & VERÖFFENTLICHUNG</span><h2>Vom Ergebnis direkt zum Projekt</h2><p id="exportResultHint">Website-Paket und GitHub-Veröffentlichung sind in höheren Tarifen enthalten.</p></div>
          <div class="client-result-actions"><button type="button" class="solid-btn" id="downloadWebsiteZipBtn">Website als ZIP</button><button type="button" class="outline-btn" id="publishGithubBtn">Auf GitHub veröffentlichen</button></div>
        </section>

        <div class="step-actions"><button type="button" class="text-btn back-btn" data-back="7">← Zurück</button><button type="button" class="text-btn" id="startNewBtn">Neues Projekt</button></div>
      </section>
    </main>

    <aside class="guide-panel" id="guidePanel">
      <div class="guide-label"><span>GUIDE</span><strong id="guideStepLabel">PROJEKT</strong></div>
      <div class="guide-copy">
        <h2 id="guideTitle">Beschreibe zuerst nur das Vorhaben.</h2>
        <p id="guideText">Du musst noch keine perfekte Design-Sprache kennen. Ein klarer Satz über Betrieb, Angebot und Ziel reicht für den Start.</p>
      </div>
      <div id="guideSuggestions" class="guide-suggestions"></div>
      <button type="button" class="guide-action" id="guideActionBtn" hidden></button>
      <div class="guide-context">
        <span>AKTUELL</span>
        <dl>
          <div><dt>Agent</dt><dd id="guideAgent">Codex</dd></div>
          <div><dt>Module</dt><dd id="guideModules">0 aktiv</dd></div>
          <div><dt>Skills</dt><dd id="guideSkills">0 aktiv</dd></div>
          <div><dt>Referenzen</dt><dd id="guideReferences">0</dd></div>
        </dl>
      </div>
    </aside>
  </div>

  <dialog id="libraryDialog" class="library-dialog">
    <form method="dialog" class="dialog-frame">
      <header class="dialog-head">
        <div><span>DEINE BIBLIOTHEKEN</span><h2>Vorlagen, Module & Skills</h2></div>
        <button type="submit" class="close-dialog" aria-label="Schließen">×</button>
      </header>
      <div class="library-tabs" role="tablist">
        <button type="button" class="active" data-library-tab="templates">Prompt-Vorlagen</button>
        <button type="button" data-library-tab="modules">Module</button>
        <button type="button" data-library-tab="skills">Agent-Skills</button>
      </div>
      <div class="library-tools"><button type="button" class="text-btn" id="exportLibraryBtn">Alles als JSON sichern</button><button type="button" class="text-btn" id="importLibraryBtn">JSON importieren</button><input id="importLibraryInput" type="file" accept=".json,application/json" hidden /></div>

      <section class="library-pane active" data-library-pane="templates">
        <div id="templateLibraryList" class="library-items"></div>
        <div class="library-editor">
          <h3 id="templateEditorTitle">Prompt-Vorlage anlegen</h3>
          <div class="field-grid two"><label class="field"><span>Name</span><input id="libTemplateName" type="text" placeholder="z. B. Website lokal" /></label><label class="field"><span>Kürzel</span><input id="libTemplateTag" type="text" maxlength="18" placeholder="LOCAL" /></label></div>
          <label class="field"><span>Kurzbeschreibung</span><input id="libTemplateSummary" type="text" placeholder="Wann diese Vorlage genutzt wird" /></label>
          <label class="field"><span>Master-Prompt / Grundregeln</span><textarea id="libTemplatePrompt" rows="8"></textarea></label>
          <div class="inline-actions"><button type="button" class="solid-btn" id="saveTemplateBtn">Vorlage speichern</button><button type="button" class="text-btn" id="cancelTemplateEditBtn" hidden>Abbrechen</button></div>
        </div>
      </section>

      <section class="library-pane" data-library-pane="modules">
        <div id="moduleLibraryList" class="library-items"></div>
        <div class="library-editor">
          <h3 id="moduleEditorTitle">Modul anlegen</h3>
          <div class="field-grid two"><label class="field"><span>Name</span><input id="libModuleName" type="text" placeholder="z. B. Anti-KI-Design" /></label><label class="field"><span>Kürzel</span><input id="libModuleTag" type="text" maxlength="18" placeholder="ANTI-SLOP" /></label></div>
          <label class="field"><span>Wann sinnvoll?</span><input id="libModuleSummary" type="text" placeholder="Kurze Beschreibung / Stichworte" /></label>
          <label class="field"><span>Prompt-Baustein</span><textarea id="libModulePrompt" rows="7"></textarea></label>
          <div class="inline-actions"><button type="button" class="solid-btn" id="saveModuleBtn">Modul speichern</button><button type="button" class="text-btn" id="cancelModuleEditBtn" hidden>Abbrechen</button></div>
        </div>
      </section>

      <section class="library-pane" data-library-pane="skills">
        <div id="skillLibraryList" class="library-items"></div>
        <div class="library-editor">
          <h3 id="skillEditorTitle">Agent-Skill anlegen</h3>
          <div class="field-grid two"><label class="field"><span>Name</span><input id="libSkillName" type="text" placeholder="z. B. Abschlussprüfung" /></label><label class="field"><span>Agent</span><select id="libSkillAgent"><option value="all">Alle Agents</option><option value="claude">Claude Code</option><option value="codex">Codex</option><option value="gemini">Gemini</option><option value="chatgpt">ChatGPT</option><option value="cursor">Cursor</option><option value="v0">v0</option><option value="universal">Universal</option></select></label></div>
          <label class="field"><span>Trigger / Einsatz</span><input id="libSkillTrigger" type="text" placeholder="z. B. Nach jeder größeren UI-Änderung" /></label>
          <label class="field"><span>Skill-Anweisung</span><textarea id="libSkillPrompt" rows="8"></textarea></label>
          <div class="inline-actions"><button type="button" class="solid-btn" id="saveSkillBtn">Skill speichern</button><button type="button" class="text-btn" id="cancelSkillEditBtn" hidden>Abbrechen</button></div>
        </div>
      </section>
    </form>
  </dialog>

  <dialog id="settingsDialog" class="library-dialog settings-dialog">
    <form method="dialog" class="dialog-frame">
      <header class="dialog-head">
        <div><span>EINSTELLUNGEN</span><h2>KI-Verbindungen & Prüfregeln</h2></div>
        <button type="submit" class="close-dialog" aria-label="Schließen">×</button>
      </header>
      <div class="settings-body">
        <section class="settings-section plan-overview">
          <div class="settings-heading"><strong>Tarif & Funktionen</strong><p>Die Grundqualität bleibt gut. Pro und Ultimate schalten professionelle Werkzeuge und Kundenunterlagen frei.</p></div>
          <div class="plan-current"><span id="currentPlanBadge">FREE</span><div><strong id="currentPlanTitle">Kostenlos</strong><small id="currentPlanDescription">Geführter Ablauf mit festen Qualitätsstandards.</small></div><button type="button" class="solid-btn mini" id="showPlansBtn">Tarife ansehen</button></div>
        </section>
        <div class="settings-upgrade-note" id="settingsUpgradeNote"></div>
        <section class="settings-section">
          <div class="settings-heading"><strong>KI-Verbindungen</strong><p>API-Key einmal eintragen, speichern und testen. Agent, Generator und Profile wählst du direkt im Projekt. Eigene Keys werden nur nach Login gespeichert und verschlüsselt in Supabase Vault abgelegt – nicht im Browser.</p></div>
          <div class="connection-login-row" id="connectionLoginRow"><span>Zum sicheren Speichern eigener Keys brauchst du ein SiteBrief-Konto.</span><button type="button" class="outline-btn mini" id="settingsLoginBtn">Zum Speichern anmelden</button></div>
          <div class="ai-connection-grid">
            <article class="ai-connection-card recommended">
              <div class="ai-connection-head">
                <div><span>EMPFOHLEN</span><strong>Vercel AI Gateway</strong><p>Ein Key für verschiedene Modellanbieter. Ideal, wenn du OpenAI, Claude oder Gemini flexibel nutzen möchtest.</p></div>
                <span class="connection-status" id="gatewayConnectionStatus">Nicht verbunden</span>
              </div>
              <label class="field"><span>API-Key</span><input id="gatewayApiKey" type="password" autocomplete="off" spellcheck="false" placeholder="Key hier einmal eintragen" /></label>
              <div class="connection-actions">
                <button type="button" class="solid-btn mini" id="gatewayConnectBtn">Speichern & verbinden</button>
                <button type="button" class="outline-btn mini" id="gatewayTestBtn">Testen</button>
                <button type="button" class="text-btn" id="gatewayDisconnectBtn" hidden>Trennen</button>
              </div>
              <small class="connection-message" id="gatewayConnectionMessage"></small>
            </article>

            <article class="ai-connection-card">
              <div class="ai-connection-head">
                <div><span>DIREKT</span><strong>OpenAI</strong><p>Nutze deinen eigenen OpenAI API-Key direkt für SiteBrief.</p></div>
                <span class="connection-status" id="openaiConnectionStatus">Nicht verbunden</span>
              </div>
              <label class="field"><span>API-Key</span><input id="openaiApiKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-…" /></label>
              <div class="connection-actions">
                <button type="button" class="solid-btn mini" id="openaiConnectBtn">Speichern & verbinden</button>
                <button type="button" class="outline-btn mini" id="openaiTestBtn">Testen</button>
                <button type="button" class="text-btn" id="openaiDisconnectBtn" hidden>Trennen</button>
              </div>
              <small class="connection-message" id="openaiConnectionMessage"></small>
            </article>
            <article class="ai-connection-card">
              <div class="ai-connection-head">
                <div><span>GOOGLE AI STUDIO</span><strong>Google Gemini</strong><p>Verbinde einen Gemini API-Key direkt und nutze Gemini-Modelle inklusive Bildanalyse.</p></div>
                <span class="connection-status" id="geminiConnectionStatus">Nicht verbunden</span>
              </div>
              <label class="field"><span>API-Key</span><input id="geminiApiKey" type="password" autocomplete="off" spellcheck="false" placeholder="Gemini API-Key" /></label>
              <div class="connection-actions">
                <button type="button" class="solid-btn mini" id="geminiConnectBtn">Speichern & verbinden</button>
                <button type="button" class="outline-btn mini" id="geminiTestBtn">Testen</button>
                <button type="button" class="text-btn" id="geminiDisconnectBtn" hidden>Trennen</button>
              </div>
              <small class="connection-message" id="geminiConnectionMessage"></small>
            </article>
            <article class="ai-connection-card">
              <div class="ai-connection-head">
                <div><span>10.000 NEURONEN / TAG FREI</span><strong>Cloudflare Workers AI</strong><p>Erzeugt Website-Bilder mit FLUX.1 Schnell. Benötigt Account-ID und einen Workers-AI-Token.</p></div>
                <span class="connection-status" id="cloudflareConnectionStatus">Nicht verbunden</span>
              </div>
              <label class="field"><span>Account-ID</span><input id="cloudflareAccountId" type="text" autocomplete="off" spellcheck="false" placeholder="32-stellige Cloudflare Account-ID" /></label>
              <label class="field"><span>API-Token</span><input id="cloudflareApiToken" type="password" autocomplete="off" spellcheck="false" placeholder="Workers AI API-Token" /></label>
              <div class="connection-actions">
                <button type="button" class="solid-btn mini" id="cloudflareConnectBtn">Speichern & verbinden</button>
                <button type="button" class="outline-btn mini" id="cloudflareTestBtn">Testen</button>
                <button type="button" class="text-btn" id="cloudflareDisconnectBtn" hidden>Trennen</button>
              </div>
              <small class="connection-message" id="cloudflareConnectionMessage"></small>
            </article>
            <article class="ai-connection-card">
              <div class="ai-connection-head"><div><span>ULTIMATE · EXPORT</span><strong>GitHub</strong><p>Veröffentlicht dein Website-Paket direkt als neues Repository. Der Zugangsschlüssel wird verschlüsselt in Supabase Vault gespeichert.</p></div><span class="connection-status" id="githubConnectionStatus">Nicht verbunden</span></div>
              <label class="field"><span>GitHub Personal Access Token</span><input id="githubToken" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_… oder ghp_…" /></label>
              <div class="connection-actions"><button type="button" class="solid-btn mini" id="githubConnectBtn">Speichern & verbinden</button><button type="button" class="outline-btn mini" id="githubTestBtn">Testen</button><button type="button" class="text-btn" id="githubDisconnectBtn" hidden>Trennen</button></div>
              <small class="connection-message" id="githubConnectionMessage">Token benötigt Berechtigung zum Erstellen und Schreiben von Repositories.</small>
            </article>
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-heading"><strong>Gegenfragen der KI</strong><p>Gilt für externe Generator-KIs. SiteBrief fragt nur, wenn Angaben wirklich fehlen, sich widersprechen oder nicht sinnvoll umsetzbar erscheinen.</p></div>
          <label class="toggle-row"><input id="setAiClarifications" type="checkbox"><span><strong>Gegenfragen erlauben</strong><small>Vor Konzepten offene Punkte erkennen und nachfragen.</small></span></label>
          <div class="field-grid two">
            <label class="field"><span>Max. Fragen pro Prüfung</span><select id="setMaxQuestions"><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option></select></label>
            <label class="field"><span>Bei kritischem Problem</span><select id="setCriticalBehavior"><option value="block">Stoppen und Lösung verlangen</option><option value="warn">Warnen, Fortfahren erlauben</option></select></label>
          </div>
          <label class="toggle-row"><input id="setAskMissing" type="checkbox"><span><strong>Bei fehlenden Angaben fragen</strong><small>Nur Angaben abfragen, die das Ergebnis wirklich verändern.</small></span></label>
          <label class="toggle-row"><input id="setAskConflict" type="checkbox"><span><strong>Bei Widersprüchen fragen</strong><small>Zum Beispiel „minimal“ und gleichzeitig „sehr informationsdicht“.</small></span></label>
          <label class="toggle-row"><input id="setAskInfeasible" type="checkbox"><span><strong>Bei nicht machbaren Wünschen nachhaken</strong><small>Problem erklären und um eine Entscheidung bitten.</small></span></label>
          <label class="toggle-row"><input id="setSuggestAlternatives" type="checkbox"><span><strong>Sichere / machbare Alternative vorschlagen</strong><small>Nicht einfach ablehnen, wenn ein realistischer Ersatz möglich ist.</small></span></label>
        </section>

        <section class="settings-section">
          <div class="settings-heading"><strong>Immer prüfen</strong><p>Diese Bereiche werden in Blueprint, KI-Konzept und Master-Prompt aufgenommen. SiteBrief behauptet dabei keine rechtliche Konformität.</p></div>
          <label class="field"><span>Rechtsraum / Markt</span><input id="setLegalRegion" type="text" placeholder="z. B. Deutschland / EU" /></label>
          <div class="settings-check-grid">
            <label class="toggle-row compact"><input id="setCheckPrivacy" type="checkbox"><span><strong>Datenschutz</strong><small>Tracking, Formulare, externe Dienste, Cookies.</small></span></label>
            <label class="toggle-row compact"><input id="setCheckImprint" type="checkbox"><span><strong>Impressum / Anbieterangaben</strong><small>Erforderliche Anbieterinformationen nicht vergessen.</small></span></label>
            <label class="toggle-row compact"><input id="setCheckLegal" type="checkbox"><span><strong>Rechtliche Plausibilität</strong><small>Keine erfundenen rechtlichen Aussagen oder Pflichttexte.</small></span></label>
            <label class="toggle-row compact"><input id="setCheckAccessibility" type="checkbox"><span><strong>Barrierefreiheit</strong><small>Semantik, Tastatur, Kontrast, Formulare.</small></span></label>
            <label class="toggle-row compact"><input id="setCheckSecurity" type="checkbox"><span><strong>Sicherheit</strong><small>Secrets, Eingaben, Auth, externe APIs.</small></span></label>
            <label class="toggle-row compact"><input id="setCheckPerformance" type="checkbox"><span><strong>Performance</strong><small>Bilder, Abhängigkeiten, Ladeverhalten.</small></span></label>
            <label class="toggle-row compact"><input id="setCheckSeo" type="checkbox"><span><strong>SEO-Grundlagen</strong><small>Metadaten, Struktur, Indexierbarkeit.</small></span></label>
          </div>
          <label class="toggle-row"><input id="setNoInventLegal" type="checkbox"><span><strong>Rechtliche Inhalte niemals erfinden</strong><small>Fehlende Firmendaten, Einwilligungen oder Rechtstexte als offene Punkte markieren statt ausdenken.</small></span></label>
          <label class="toggle-row"><input id="setFinalChecklist" type="checkbox"><span><strong>Pflicht-Checkliste im Master-Prompt</strong><small>Der Ziel-Agent muss die aktiven Prüffelder vor Abschluss abhaken.</small></span></label>
        </section>

        <div class="settings-footer">
          <p>Hinweis: Die Prüfung dient als Entwicklungs-Checkliste und ersetzt keine Rechtsberatung.</p>
          <button type="button" class="solid-btn" id="saveSettingsBtn">Einstellungen speichern</button>
        </div>
      </div>
    </form>
  </dialog>


  <dialog id="accountDialog" class="library-dialog account-dialog">
    <form method="dialog" class="dialog-frame">
      <header class="dialog-head">
        <div><span id="accountDialogKicker">SUPABASE CLOUD</span><h2 id="accountDialogTitle">Konto & Synchronisierung</h2></div>
        <button type="submit" class="close-dialog" aria-label="Schließen">×</button>
      </header>
      <div class="account-body">
        <div id="accountLoggedOut">
          <p class="account-intro" id="accountIntro">Melde dich an, um gespeicherte Projekte, Profile, Bibliotheken, Module und Skills auf allen Geräten zu verwenden.</p>
          <div class="guest-limit-box" id="guestLimitBox"><strong id="guestLimitTitle">Ohne Anmeldung testen</strong><p id="guestLimitNote">Du kannst SiteBrief als Gast dreimal vollständig verwenden.</p></div>
          <div class="auth-plan-grid"><article><span>FREE</span><strong>Ausprobieren</strong><small>Codex, drei Richtungen und feste Qualitätsstandards.</small></article><article><span>PRO</span><strong>Kundenprojekte</strong><small>Claude/Codex, Module, Skills, Bericht und ZIP-Export.</small></article><article><span>ULTIMATE</span><strong>Volle Kontrolle</strong><small>Alle Agenten, Modelle, Einstellungen und GitHub-Export.</small></article></div>
          <label class="field"><span>E-Mail</span><input id="authEmail" type="email" autocomplete="email" placeholder="name@beispiel.de" /></label>
          <label class="field"><span>Passwort</span><input id="authPassword" type="password" autocomplete="current-password" minlength="8" /></label>
          <label class="remember-login"><input id="rememberEmail" type="checkbox" checked /><span>E-Mail auf diesem Gerät merken</span></label>
          <div class="inline-actions"><button type="button" class="solid-btn" id="signInBtn">Anmelden</button><button type="button" class="outline-btn" id="signUpBtn">Konto anlegen</button><button type="button" class="text-btn" id="guestContinueBtn">Ohne Anmeldung fortfahren</button></div>
          <p id="authMessage" class="auth-message"></p>
        </div>
        <div id="accountLoggedIn" hidden>
          <div class="account-user"><span>ANGEMELDET ALS</span><strong id="accountEmail">–</strong><small id="accountUserId"></small></div>
          <div class="cloud-stats" id="cloudStats"></div>
          <section class="account-profile-settings"><span>BENUTZERPROFIL</span><div class="field-grid two"><label class="field"><span>Name</span><input id="userDisplayName" type="text" /></label><label class="field"><span>Firma / Agentur</span><input id="userCompanyName" type="text" /></label><label class="field"><span>Website</span><input id="userWebsite" type="url" /></label><label class="field"><span>Standard-Auftraggeber</span><select id="userDefaultClientType"><option value="">Nicht festgelegt</option><option value="eigenes-projekt">Eigenes Projekt</option><option value="kunde">Kundenprojekt</option><option value="intern">Internes Projekt</option></select></label></div><button type="button" class="outline-btn" id="saveUserProfileBtn">Profil speichern</button><small id="userProfileMessage"></small></section>
          <section class="api-addon-card" id="apiAddonCard"><div><span>OPTIONALES ADD-ON</span><strong>Eigene KI-API-Keys</strong><p>Eigene OpenAI-, Gemini-, Gateway- und Cloudflare-Schlüssel verschlüsselt hinterlegen.</p></div><div><b>5,99 € / Monat</b><button type="button" class="solid-btn" id="startApiAddonCheckoutBtn">Add-on buchen</button></div></section>
          <div class="cloud-projects"><span>LETZTE PROJEKTE</span><div id="cloudProjectList" class="cloud-project-list"></div></div>
          <div class="inline-actions"><button type="button" class="solid-btn" id="syncNowBtn">Jetzt synchronisieren</button><button type="button" class="outline-btn" id="signOutBtn">Abmelden</button></div>
          <p id="syncMessage" class="auth-message"></p>
        </div>
      </div>
    </form>
  </dialog>

  <dialog id="profileDialog" class="library-dialog profile-dialog">
    <form method="dialog" class="dialog-frame">
      <header class="dialog-head"><div><span>ARBEITSPROFILE</span><h2>Eigene Profile</h2></div><button type="submit" class="close-dialog" aria-label="Schließen">×</button></header>
      <div class="profile-dialog-body">
        <div id="profileList" class="library-items profile-list"></div>
        <div class="library-editor">
          <h3>Neues Profil aus aktuellen Einstellungen</h3>
          <label class="field"><span>Name</span><input id="newProfileName" type="text" placeholder="z. B. Meine Website Standards" /></label>
          <label class="field"><span>Beschreibung</span><input id="newProfileDescription" type="text" placeholder="optional" /></label>
          <button type="button" class="solid-btn" id="createProfileBtn">Profil speichern</button>
        </div>
      </div>
    </form>
  </dialog>

  <dialog id="clarificationDialog" class="library-dialog clarification-dialog">
    <form method="dialog" class="dialog-frame">
      <header class="dialog-head">
        <div><span>KI-GEGENFRAGEN</span><h2>Noch ein paar Punkte klären</h2></div>
        <button type="submit" class="close-dialog" aria-label="Schließen">×</button>
      </header>
      <div class="clarification-body">
        <p class="clarification-intro" id="clarificationIntro">Die Generator-KI braucht diese Angaben, damit Konzept und Master-Prompt nicht auf Annahmen beruhen.</p>
        <div id="clarificationWarnings" class="clarification-warnings"></div>
        <div id="clarificationQuestions" class="clarification-questions"></div>
        <div class="settings-footer">
          <button type="button" class="text-btn" id="deferClarificationsBtn">Später beantworten</button>
          <button type="button" class="solid-btn" id="saveClarificationsBtn">Antworten übernehmen</button>
        </div>
      </div>
    </form>
  </dialog>

  <dialog id="plansDialog" class="library-dialog plans-dialog">
    <form method="dialog" class="dialog-frame">
      <header class="dialog-head"><div><span>TARIFE</span><h2>Mehr Werkzeuge, nicht künstlich schlechtere Ergebnisse</h2></div><button type="submit" class="close-dialog" aria-label="Schließen">×</button></header>
      <div class="plans-grid">
        <article><span>FREE</span><h3>Solider Einstieg</h3><strong>0 €</strong><ul><li>Codex-Ziel</li><li>3 Gestaltungsrichtungen</li><li>Geführte Qualitätsstandards</li></ul><button type="button" class="outline-btn" disabled>Aktueller Einstieg</button></article>
        <article class="recommended"><span>PRO</span><h3>Für Kundenprojekte</h3><strong>Pro</strong><ul><li>Claude oder Codex</li><li>4 Richtungen</li><li>Module und Skills</li><li>Kundenunterlagen & ZIP-Export</li></ul><button type="button" class="solid-btn" id="startProCheckoutBtn">Pro wählen</button></article>
        <article><span>ULTIMATE</span><h3>Volle Kontrolle</h3><strong>Ultimate</strong><ul><li>Alle Agenten und 5 Richtungen</li><li>Eigene KI-Verbindungen</li><li>Alle Profi-Einstellungen</li><li>Direkte GitHub-Veröffentlichung</li></ul><button type="button" class="outline-btn" id="startUltimateCheckoutBtn">Ultimate wählen</button></article>
      </div>
      <div class="plans-footer"><button type="button" class="text-btn" id="manageSubscriptionBtn">Bestehendes Abo verwalten</button><small>Die Zahlung und Aboverwaltung erfolgt sicher über Stripe.</small></div>
    </form>
  </dialog>

  <script type="module" src="./cloud.js"></script>
  <script src="./app.js" defer></script>
</body>
</html>


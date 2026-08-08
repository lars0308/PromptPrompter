(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[ch]);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  const AGENT_NAMES = {claude:"Claude Code",codex:"Codex",gemini:"Gemini",chatgpt:"ChatGPT",cursor:"Cursor",v0:"v0",universal:"Universal"};
  const ASPECTS = ["Layout","Farben","Typografie","Bildsprache","Hero","Struktur","Stimmung","Nur Inspiration"];
  const STORAGE_KEY = "sitebrief-v6-state";
  const LIBRARY_KEY = "sitebrief-v6-library";
  const SETTINGS_KEY = "sitebrief-v6-settings";
  const PROFILES_KEY = "sitebrief-v6-profiles";
  const GUEST_USAGE_KEY = "sitebrief-v6-guest-runs";
  const GUEST_RUN_LIMIT = 3;
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
    cloud: {configured:false,user:null,syncing:false,lastSynced:null,error:""},
    editing: {template:"",module:"",skill:""}
  };

  const el = {};
  function cacheElements(){
    [
      "projectDescription","descriptionCount","projectName","projectType","projectGoal","projectAudience","projectSpecial","projectUnderstanding","understandingSummary","understandingPoints","reanalyzeProjectBtn","confirmUnderstandingBtn","editUnderstandingBtn","projectValidation",
      "referenceUrl","addUrlBtn","urlReferences","uploadZone","imageInput","imageReferences",
      "agentSelector","generatorEngine","generatorModel","modelOptions","engineHelp","engineStatus","profileImpact",
      "templateSelect","moduleSelection","skillSelection","skillContextLabel","recommendModulesBtn","importSkillFileBtn","skillFileInput","skillImportMessage",
      "blueprintSummary","originality","antiSlop","motion","density",
      "conceptCount","generateConceptsBtn","generationStatus","conceptGallery","toRefineBtn",
      "selectedPreviewLarge","quickRefinements","refinementInput","applyRefinementBtn","clearRefinementsBtn","refinementHistory",
      "masterPrompt","promptMeta","copyPromptBtn","downloadPromptBtn","downloadBriefBtn",
      "guideStepLabel","guideTitle","guideText","guideSuggestions","guideActionBtn","guideAgent","guideModules","guideSkills","guideReferences","progressText",
      "accountBtn","syncState","accountDialog","accountLoggedOut","accountLoggedIn","accountDialogKicker","accountDialogTitle","accountIntro","guestLimitBox","guestLimitTitle","guestLimitNote","guestContinueBtn","authEmail","authPassword","signInBtn","signUpBtn","signOutBtn","syncNowBtn","authMessage","syncMessage","accountEmail","accountUserId","cloudStats","cloudProjectList",
      "openLibraryBtn","openSettingsBtn","libraryDialog","exportLibraryBtn","importLibraryBtn","importLibraryInput",
      "settingsDialog","setActiveProfile","applyProfileBtn","connectionLoginRow","settingsLoginBtn","gatewayConnectionStatus","gatewayApiKey","gatewayConnectBtn","gatewayTestBtn","gatewayDisconnectBtn","gatewayConnectionMessage","openaiConnectionStatus","openaiApiKey","openaiConnectBtn","openaiTestBtn","openaiDisconnectBtn","openaiConnectionMessage","geminiConnectionStatus","geminiApiKey","geminiConnectBtn","geminiTestBtn","geminiDisconnectBtn","geminiConnectionMessage","saveProfileBtn","manageProfilesBtn","profileDialog","profileList","newProfileName","newProfileDescription","createProfileBtn","setAiClarifications","setMaxQuestions","setCriticalBehavior","setAskMissing","setAskConflict","setAskInfeasible","setSuggestAlternatives","setLegalRegion","setCheckPrivacy","setCheckImprint","setCheckLegal","setCheckAccessibility","setCheckSecurity","setCheckPerformance","setCheckSeo","setNoInventLegal","setFinalChecklist","saveSettingsBtn",
      "aiReviewCard","aiReviewTitle","aiReviewText","runAiReviewBtn","reviewProgress","reviewProgressPercent","reviewProgressText","reviewProgressFill","previewProgress","previewProgressPercent","previewProgressText","previewProgressFill","clarificationDialog","clarificationIntro","clarificationWarnings","clarificationQuestions","deferClarificationsBtn","saveClarificationsBtn",
      "templateLibraryList","libTemplateName","libTemplateTag","libTemplateSummary","libTemplatePrompt","saveTemplateBtn","cancelTemplateEditBtn","templateEditorTitle",
      "moduleLibraryList","libModuleName","libModuleTag","libModuleSummary","libModulePrompt","saveModuleBtn","cancelModuleEditBtn","moduleEditorTitle",
      "skillLibraryList","libSkillName","libSkillAgent","libSkillTrigger","libSkillPrompt","saveSkillBtn","cancelSkillEditBtn","skillEditorTitle",
      "resetBtn","startNewBtn","brandHome"
    ].forEach(id => el[id] = document.getElementById(id));
  }

  function project(){
    return {
      name: el.projectName?.value.trim() || "",
      description: el.projectDescription?.value.trim() || "",
      type: el.projectType?.value || "Website",
      goal: el.projectGoal?.value || "Anfragen / Leads",
      audience: el.projectAudience?.value.trim() || "",
      special: el.projectSpecial?.value.trim() || ""
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
  function selectedModules(){ return cloudReady()?state.modules.filter(x => state.selectedModuleIds.includes(x.id)):[]; }
  function visibleSkills(){ return state.skills.filter(x => x.agent === "all" || x.agent === state.targetAgent); }
  function selectedSkills(){ return cloudReady()?visibleSkills().filter(x => state.selectedSkillIds.includes(x.id)):[]; }
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
      targetAgent:state.targetAgent,engine:state.engine,model:state.model,templateId:state.templateId,selectedModuleIds:state.selectedModuleIds,selectedSkillIds:state.selectedSkillIds,
      concepts:state.concepts,selectedConceptId:state.selectedConceptId,refinements:state.refinements,clarifications:state.clarifications,projectReview:state.projectReview,reviewSignature:state.reviewSignature,reviewDeferred:state.reviewDeferred,
      project:project(),controls:controls(),conceptCount:Number(el.conceptCount?.value || 5)
    };
  }

  let cloudProjectTimer=null, cloudSettingsTimer=null;
  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableProjectState())); }catch{}
    scheduleCloudProjectSave();
  }

  function cloudReady(){ return Boolean(state.cloud.configured && state.cloud.user && window.SiteBriefCloud?.client); }

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
        : {status:el.geminiConnectionStatus,input:el.geminiApiKey,connect:el.geminiConnectBtn,test:el.geminiTestBtn,disconnect:el.geminiDisconnectBtn,message:el.geminiConnectionMessage};
  }

  function renderAiConnections(){
    for(const provider of ['gateway','openai','gemini']){
      const ui=aiConnectionEls(provider); if(!ui.status) continue;
      const conn=aiConnection(provider), logged=cloudReady();
      ui.status.className='connection-status'+(conn?' connected':'');
      ui.status.textContent=conn?`Verbunden · ••••${conn.last4||''}`:(logged?'Nicht verbunden':'Login erforderlich');
      ui.input.disabled=!logged;ui.connect.disabled=!logged;ui.disconnect.hidden=!conn;ui.test.disabled=false;
      if(!logged && !conn) ui.message.textContent='Zum Speichern eines eigenen API-Keys zuerst anmelden.';
      else if(conn && !ui.message.classList.contains('error')) ui.message.textContent='Verschlüsselt in Supabase Vault gespeichert.';
      else if(!conn && !ui.message.classList.contains('error')) ui.message.textContent='';
    }
    if(el.connectionLoginRow) el.connectionLoginRow.hidden=cloudReady();
  }

  async function saveAiProviderConnection(provider){
    const ui=aiConnectionEls(provider);
    if(!cloudReady()){ui.message.textContent='Bitte zuerst bei SiteBrief anmelden.';ui.message.className='connection-message error';return;}
    const secret=ui.input.value.trim();
    if(secret.length<8){ui.message.textContent='Bitte einen gültigen API-Key eingeben.';ui.message.className='connection-message error';return;}
    try{
      ui.connect.disabled=true;ui.message.textContent='Wird verschlüsselt gespeichert…';ui.message.className='connection-message';
      await window.SiteBriefCloud.saveAiConnection(provider,secret);
      state.aiConnections=[...(window.SiteBriefCloud.aiConnections||[])];ui.input.value='';renderAiConnections();
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

  function updateAccountUi(){
    if(!el.accountBtn) return;
    if(!state.cloud.configured){ el.accountBtn.textContent="Cloud nicht verbunden"; setSyncState("Lokal"); return; }
    if(state.cloud.user){
      if(el.openLibraryBtn){el.openLibraryBtn.disabled=false;el.openLibraryBtn.title=""}if(el.generatorEngine)el.generatorEngine.disabled=false;
      el.accountBtn.textContent="Konto";
      el.accountLoggedOut.hidden=true;el.accountLoggedIn.hidden=false;
      el.accountEmail.textContent=state.cloud.user.email||"Angemeldet";el.accountUserId.textContent=state.cloud.user.id||"";
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
      renderLibrary();renderProfileUi();populateSettingsDialog();renderAiConnections();updateAccountUi();updateGuide();
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
    try{el.authMessage.textContent="Anmeldung läuft…";el.authMessage.className="auth-message";const data=await window.SiteBriefCloud.signIn(email,password);state.cloud.user=data.user;await loadCloudBundle();el.authMessage.textContent="Angemeldet.";el.authMessage.className="auth-message good";updateAccountUi();closeAccountGate();}catch(err){el.authMessage.textContent=err?.message||"Anmeldung fehlgeschlagen.";el.authMessage.className="auth-message error";}
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
    state.templateId = saved.templateId || "";
    state.selectedModuleIds = Array.isArray(saved.selectedModuleIds) ? saved.selectedModuleIds : [];
    state.selectedSkillIds = Array.isArray(saved.selectedSkillIds) ? saved.selectedSkillIds : [];
    state.concepts = Array.isArray(saved.concepts) ? saved.concepts : [];
    state.selectedConceptId = saved.selectedConceptId || "";
    state.refinements = Array.isArray(saved.refinements) ? saved.refinements : [];
    state.clarifications = Array.isArray(saved.clarifications) ? saved.clarifications : [];
    state.projectReview = saved.projectReview || null; state.reviewSignature=saved.reviewSignature||""; state.reviewDeferred=Boolean(saved.reviewDeferred);
    const p = saved.project || {};
    el.projectName.value = p.name || ""; el.projectDescription.value = p.description || ""; el.projectType.value = p.type || "Website"; el.projectGoal.value = p.goal || "Anfragen / Leads"; el.projectAudience.value = p.audience || ""; el.projectSpecial.value = p.special || "";
    el.descriptionCount.textContent = el.projectDescription.value.length;
    const c = saved.controls || {}; ["originality","antiSlop","motion","density"].forEach(id => { if(c[id] != null){ el[id].value = c[id]; el[id].nextElementSibling.value = c[id]; } });
    if(saved.conceptCount) el.conceptCount.value = String(clamp(saved.conceptCount,3,5));
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
    if(state.profiles.length){
      const g=document.createElement("optgroup");g.label="Eigene Profile";
      state.profiles.forEach(x=>{const o=document.createElement("option");o.value=x.id;o.textContent=x.name;g.appendChild(o)});el.setActiveProfile.appendChild(g);
    }
    el.setActiveProfile.value=allProfiles().some(x=>x.id===current)?current:"";
    renderProfileList();renderProfileImpact();
  }

  function renderProfileImpact(){
    if(!el.profileImpact)return;
    const profile=allProfiles().find(x=>x.id===el.setActiveProfile?.value),c=profile?.config;
    if(!c){el.profileImpact.innerHTML='<span class="empty">Wähle ein Profil, um den enthaltenen Projektaufbau zu sehen.</span>';return;}
    const mods=(c.selectedModuleIds||[]).filter(id=>state.modules.some(x=>x.id===id)).length;
    const skills=(c.selectedSkillIds||[]).filter(id=>state.skills.some(x=>x.id===id)).length;
    const values=[AGENT_NAMES[c.targetAgent]||c.targetAgent||'Codex',c.engine==='gemini'?'Gemini direkt':c.engine==='openai'?'OpenAI direkt':c.engine==='gateway'?'AI Gateway':'Lokal',c.model||'Standardmodell',c.mode==='expert'?'Experte':c.mode==='auto'?'Auto':'Geführt',`${Number(c.conceptCount)||5} Vorschauen`,`${mods} Module`,`${skills} Skills`];
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
      state.mode=state.settings.defaultMode;state.targetAgent=state.settings.defaultAgent;state.engine=state.settings.defaultEngine;state.model=state.settings.defaultModel;
      state.selectedModuleIds=[...(config.selectedModuleIds||[])];state.selectedSkillIds=[...(config.selectedSkillIds||[])];applyAlwaysActiveItems(true);
      if(el.conceptCount)el.conceptCount.value=String(state.settings.defaultConceptCount);if(el.generatorEngine)el.generatorEngine.value=state.engine;if(el.generatorModel)el.generatorModel.value=state.model;
    }
    if(persist){saveSettings();saveProfiles();}
    $$('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    $$('#agentSelector button').forEach(b=>b.classList.toggle('active',b.dataset.agent===state.targetAgent));
    updateEngineUi();renderModuleSelection();renderSkillSelection();renderProfileUi();updateGuide();saveState();return true;
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

  function questionSuggestions(q){
    const text=`${q.question||""} ${q.reason||""}`.toLowerCase();let suggestions=[...(Array.isArray(q.suggestions)?q.suggestions:[]),q.suggestedAnswer].filter(Boolean);
    if(/cms|content.management|inhalte|beiträge|tagebuch/.test(text))suggestions.push("Sanity – flexibel und strukturiert","WordPress – vertraut und leicht selbst pflegbar","Kein CMS – Inhalte werden im Code gepflegt");
    if(/exif|standort|metadaten/.test(text))suggestions.push("Ja – EXIF-Daten automatisch entfernen","Nein – Metadaten bewusst erhalten","Vor jedem Upload manuell entscheiden");
    if(/animation|effekt|ladezeit|performance/.test(text))suggestions.push("Ausgewogen – dezente Animationen und optimierte Bilder","Performance zuerst – nur minimale Bewegung","Visuell stark – Bewegung gezielt einsetzen");
    return [...new Set(suggestions.map(x=>String(x).trim()).filter(Boolean))].slice(0,4);
  }

  const progressTimers={};
  function startTaskProgress(kind,expectedSeconds){
    const box=el[`${kind}Progress`],fill=el[`${kind}ProgressFill`],percent=el[`${kind}ProgressPercent`],label=el[`${kind}ProgressText`];if(!box)return;clearInterval(progressTimers[kind]);const started=Date.now();box.hidden=false;fill.style.width="4%";percent.textContent="4 %";label.textContent=`Wird vorbereitet · ca. ${expectedSeconds} s`;
    progressTimers[kind]=setInterval(()=>{const elapsed=(Date.now()-started)/1000,pct=Math.min(92,Math.round(4+88*(1-Math.exp(-elapsed/(expectedSeconds/2))))),remaining=Math.max(2,Math.ceil(expectedSeconds-elapsed));fill.style.width=`${pct}%`;percent.textContent=`${pct} %`;label.textContent=`${Math.floor(elapsed)} s vergangen · ca. ${remaining} s verbleibend`;},400);
  }
  function setTaskProgress(kind,pct,text){const fill=el[`${kind}ProgressFill`],percent=el[`${kind}ProgressPercent`],label=el[`${kind}ProgressText`];if(!fill)return;fill.style.width=`${pct}%`;percent.textContent=`${pct} %`;label.textContent=text;}
  function finishTaskProgress(kind,text="Abgeschlossen"){clearInterval(progressTimers[kind]);setTaskProgress(kind,100,text);setTimeout(()=>{if(el[`${kind}Progress`])el[`${kind}Progress`].hidden=true},1000);}

  function saveClarificationAnswers(){
    const questions=state.projectReview?.questions||[]; const rows=$$(".clarification-question",el.clarificationQuestions); const answers=[];
    for(const row of rows){const idx=rows.indexOf(row);const q=questions[idx];const ta=row.querySelector("textarea");if(q?.required && !ta.value.trim()){ta.reportValidity();return false}answers.push({id:q?.id||uid("answer"),question:q?.question||"",answer:ta.value.trim(),reason:q?.reason||""});}
    state.clarifications=answers;state.reviewDeferred=false;saveState();el.clarificationDialog.close();renderAiReviewCard();updateGuide();return true;
  }

  async function runProjectReview(force=false){
    if(!cloudReady())return true;
    if(!state.settings.aiClarifications && state.engine!=="local"){el.settingsDialog.showModal();populateSettingsDialog();return true;}
    const sig=projectSignature();
    if(!force && state.projectReview && state.reviewSignature===sig){
      const unanswered=(state.projectReview.questions||[]).filter(q=>q.required && !state.clarifications.some(a=>a.question===q.question && a.answer?.trim()));
      const hasAnyUnresolved=(state.projectReview.questions||[]).length && !state.reviewDeferred && !state.clarifications.some(a=>a.answer?.trim());
      if(unanswered.length || hasAnyUnresolved){renderClarificationDialog(state.projectReview);return false;}
      return !(state.settings.criticalBehavior==="block" && (state.projectReview.blockers||[]).length && !state.clarifications.some(a=>a.answer?.trim()));
    }
    el.aiReviewTitle.textContent="Projekt wird geprüft…";el.runAiReviewBtn.disabled=true;startTaskProgress("review",18);
    let review;
    try{
      if(state.engine==="local") review=localProjectReview();
      else{
        const payload={action:"review",engine:state.engine,model:el.generatorModel.value.trim(),project:project(),references:state.urls.map(x=>({url:x.url,aspects:x.aspects,note:x.like,dislike:x.dislike})),images:state.images.filter(x=>x.dataUrl).slice(0,3).map(x=>({name:x.name,dataUrl:x.dataUrl,aspects:x.aspects,note:x.like,dislike:x.dislike})),settings:settingsForApi(),template:selectedTemplate()||{},modules:selectedModules(),clarifications:state.clarifications};
        const res=await sitebriefApiFetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await res.json();if(!res.ok)throw new Error(data.error||"Projektprüfung fehlgeschlagen");review=data;
      }
      review.questions=Array.isArray(review.questions)?review.questions.slice(0,state.settings.maxQuestions):[];review.warnings=Array.isArray(review.warnings)?review.warnings:[];review.blockers=Array.isArray(review.blockers)?review.blockers:[];review.assumptions=Array.isArray(review.assumptions)?review.assumptions:[];
      if(state.settings.criticalBehavior==="block" && review.blockers.length && !review.questions.some(q=>q.required)) review.questions.unshift({id:uid("q"),question:"Wie soll mit dem kritischen Punkt umgegangen werden?",reason:review.blockers[0].message||"Vor der Umsetzung ist eine Entscheidung nötig.",suggestedAnswer:state.settings.suggestAlternatives?(review.blockers[0].alternative||""):"",required:true});
      state.projectReview=review;state.reviewSignature=sig;state.reviewDeferred=false;saveState();renderAiReviewCard();renderClarificationDialog(review);return review.questions.length===0 && !(state.settings.criticalBehavior==="block"&&review.blockers.length);
    }catch(err){
      review=localProjectReview();state.projectReview=review;state.reviewSignature=sig;saveState();renderAiReviewCard();renderClarificationDialog(review);el.clarificationIntro.textContent=`Externe KI-Prüfung war nicht verfügbar (${err.message}). SiteBrief zeigt deshalb die lokale Grundprüfung.`;return true;
    }finally{finishTaskProgress("review","Prüfung abgeschlossen");el.runAiReviewBtn.disabled=false;}
  }

  function renderUnderstanding(){
    if(!state.understanding){ el.projectUnderstanding.hidden = true; return; }
    el.projectUnderstanding.hidden = false;
    el.understandingSummary.textContent = state.understanding.summary;
    el.understandingPoints.innerHTML = "";
    state.understanding.priorities.forEach(point => { const d=document.createElement("div"); d.textContent=point; el.understandingPoints.appendChild(d); });
  }

  function referenceCount(){ return state.urls.length + state.images.length; }

  function addUrl(){
    let value = el.referenceUrl.value.trim();
    if(!value) return;
    if(!/^https?:\/\//i.test(value)) value = `https://${value}`;
    try{ new URL(value); }catch{ el.referenceUrl.setCustomValidity("Bitte eine gültige URL eingeben."); el.referenceUrl.reportValidity(); return; }
    el.referenceUrl.setCustomValidity("");
    if(state.urls.some(x => x.url === value)){ el.referenceUrl.value=""; return; }
    state.urls.push({id:uid("url"),url:value,aspects:["Layout","Stimmung"],like:"",dislike:""});
    el.referenceUrl.value=""; renderReferences(); saveState(); updateGuide();
  }

  function renderAspectChips(container, item){
    ASPECTS.forEach(aspect => {
      const b=document.createElement("button"); b.type="button"; b.className=`aspect-chip ${item.aspects.includes(aspect)?"active":""}`; b.textContent=aspect;
      b.addEventListener("click",()=>{
        if(aspect === "Nur Inspiration"){
          item.aspects = item.aspects.includes(aspect) ? [] : [aspect];
        }else{
          item.aspects = item.aspects.filter(x => x !== "Nur Inspiration");
          item.aspects = item.aspects.includes(aspect) ? item.aspects.filter(x=>x!==aspect) : [...item.aspects,aspect];
        }
        renderReferences(); saveState();
      });
      container.appendChild(b);
    });
  }

  function renderReferences(){
    el.urlReferences.innerHTML="";
    state.urls.forEach(item => {
      const card=document.createElement("div"); card.className="reference-item";
      const host = (()=>{try{return new URL(item.url).hostname.replace(/^www\./,"")}catch{return item.url}})();
      card.innerHTML=`<div class="reference-main"><span class="reference-mark">URL</span><div><strong>${escapeHtml(host)}</strong><small>${escapeHtml(item.url)}</small></div><button type="button" class="remove-btn" aria-label="Referenz entfernen">×</button></div><div class="aspect-row"></div><div class="ref-notes"><input type="text" class="like-note" placeholder="Was gefällt dir daran?" value="${escapeHtml(item.like||"")}"><input type="text" class="dislike-note" placeholder="Was gefällt dir NICHT?" value="${escapeHtml(item.dislike||"")}"></div>`;
      card.querySelector(".remove-btn").addEventListener("click",()=>{state.urls=state.urls.filter(x=>x.id!==item.id);renderReferences();saveState();updateGuide();});
      renderAspectChips(card.querySelector(".aspect-row"), item);
      card.querySelector(".like-note").addEventListener("input",e=>{item.like=e.target.value;saveState()});
      card.querySelector(".dislike-note").addEventListener("input",e=>{item.dislike=e.target.value;saveState()});
      el.urlReferences.appendChild(card);
    });

    el.imageReferences.innerHTML="";
    state.images.forEach(item => {
      const card=document.createElement("div"); card.className="image-reference";
      const img=document.createElement("img"); img.alt=`Referenz ${item.name}`; if(item.dataUrl||item.previewUrl) img.src=item.dataUrl||item.previewUrl; else img.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450'%3E%3Crect width='100%25' height='100%25' fill='%23cbc6ba'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%236e6c64'%3EBild lokal nicht geladen%3C/text%3E%3C/svg%3E";
      card.appendChild(img);
      const head=document.createElement("div"); head.className="image-reference-head"; head.innerHTML=`<span title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span><button class="remove-btn" type="button" aria-label="Bild entfernen">×</button>`; card.appendChild(head);
      head.querySelector("button").addEventListener("click",async()=>{state.images=state.images.filter(x=>x.id!==item.id);renderReferences();saveState();updateGuide();if(cloudReady()&&item.storagePath)try{await window.SiteBriefCloud.removeReference(item.storagePath)}catch{}});
      const aspects=document.createElement("div"); aspects.className="aspect-row"; card.appendChild(aspects); renderAspectChips(aspects,item);
      const notes=document.createElement("div"); notes.className="ref-notes"; notes.innerHTML=`<input type="text" class="like-note" placeholder="Gefällt mir..." value="${escapeHtml(item.like||"")}"><input type="text" class="dislike-note" placeholder="Nicht übernehmen..." value="${escapeHtml(item.dislike||"")}">`; card.appendChild(notes);
      notes.querySelector(".like-note").addEventListener("input",e=>{item.like=e.target.value;saveState()});
      notes.querySelector(".dislike-note").addEventListener("input",e=>{item.dislike=e.target.value;saveState()});
      el.imageReferences.appendChild(card);
    });
    updateGuideContext();renderAiReviewCard();
  }

  function compressImage(file, maxSide=1000, quality=.72){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{
          let {width,height}=img; const scale=Math.min(1,maxSide/Math.max(width,height)); width=Math.round(width*scale);height=Math.round(height*scale);
          const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,width,height);
          resolve(canvas.toDataURL("image/jpeg",quality));
        };
        img.onerror=reject; img.src=reader.result;
      };
      reader.onerror=reject; reader.readAsDataURL(file);
    });
  }

  async function addImages(files){
    const valid=[...files].filter(f=>/^image\/(png|jpeg|webp)$/i.test(f.type)).slice(0,Math.max(0,8-state.images.length));
    for(const file of valid){
      try{
        const dataUrl=await compressImage(file);const item={id:uid("img"),name:file.name,dataUrl,aspects:["Bildsprache","Stimmung"],like:"",dislike:"",storagePath:""};state.images.push(item);
        if(cloudReady())try{item.storagePath=await window.SiteBriefCloud.uploadReference(state.currentProjectId,item.id,dataUrl,file.name)}catch(err){state.cloud.error=err?.message||"Bild-Upload fehlgeschlagen";setSyncState("Bild lokal","error")}
      }catch{}
    }
    el.imageInput.value=""; renderReferences(); saveState(); updateGuide();
  }

  function updateEngineUi(){
    state.engine = el.generatorEngine.value;
    state.model = el.generatorModel.value.trim();
    if(state.engine === "local"){
      el.generatorModel.disabled=true; el.engineHelp.textContent="Lokal: kostenlos, kein API-Key. Bilder werden als visuelle Referenz in der Vorschau genutzt, aber nicht semantisch von einem Modell analysiert."; el.engineStatus.textContent="Lokal bereit";
    }else if(state.engine === "gateway"){
      el.generatorModel.disabled=false; if(el.generatorModel.value && !el.generatorModel.value.includes("/")) el.generatorModel.value=""; state.model=el.generatorModel.value; el.engineHelp.textContent="Vercel AI Gateway: Ein Key für OpenAI-, Claude-, Gemini- und weitere Modelle. Verbinde ihn unter Einstellungen → KI-Verbindungen."; el.engineStatus.textContent=aiConnection("gateway")?"Gateway verbunden":"Gateway gewählt"; loadProviderModels("gateway");
    }else if(state.engine === "openai"){
      el.generatorModel.disabled=false; if(!el.generatorModel.value || el.generatorModel.value.includes("/")) el.generatorModel.value="gpt-5"; state.model=el.generatorModel.value; el.engineHelp.textContent="OpenAI direkt: eigenen API-Key unter Einstellungen → KI-Verbindungen hinterlegen. Alternativ kann ein serverweiter Key verwendet werden."; el.engineStatus.textContent=aiConnection("openai")?"OpenAI verbunden":"OpenAI gewählt";
    }else{
      el.generatorModel.disabled=false;if(!el.generatorModel.value||el.generatorModel.value.includes("/")||/^gemini-2\.5(?:-|$)/.test(el.generatorModel.value))el.generatorModel.value="gemini-3.6-flash";state.model=el.generatorModel.value;el.engineHelp.textContent="Google Gemini direkt: Gemini 3.6 Flash ist für neue Zugänge empfohlen. Text und Referenzbilder werden gemeinsam analysiert.";el.engineStatus.textContent=aiConnection("gemini")?"Gemini verbunden":"Gemini gewählt";loadProviderModels("gemini");
    }
    saveState(); renderAiReviewCard(); updateGuide();
  }

  async function loadProviderModels(provider="gateway"){
    if(state.modelsLoaded) return;
    try{
      const res=await sitebriefApiFetch(`/api/models?provider=${encodeURIComponent(provider)}`,{cache:"no-store"}); if(!res.ok) return; const data=await res.json();
      const models=provider==="gemini"?[...new Set(["gemini-3.6-flash",...(data.models||[])])]:(data.models||[]);
      el.modelOptions.innerHTML="";models.forEach(id=>{const o=document.createElement("option");o.value=id;el.modelOptions.appendChild(o)});if(!el.generatorModel.value&&models.length){el.generatorModel.value=models[0];state.model=models[0]}state.modelsLoaded=true;
    }catch{}
  }

  function renderTemplateSelect(){
    const old=state.templateId; el.templateSelect.innerHTML='<option value="">Ohne Vorlage</option>';
    state.templates.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.name+(t.tag?` · ${t.tag}`:"");el.templateSelect.appendChild(o)});
    if(state.templates.some(x=>x.id===old)) el.templateSelect.value=old; else {state.templateId="";el.templateSelect.value=""}
  }

  function moduleScore(module){
    const p=project(); const hay=tokenize(`${p.description} ${p.type} ${p.goal} ${p.audience} ${p.special}`); const item=tokenize(`${module.name} ${module.tag||""} ${module.summary||""}`);
    let score=item.filter(x=>hay.includes(x)).length*3;
    const low=`${module.name} ${module.tag||""} ${module.summary||""}`.toLowerCase();
    const proj=`${p.description} ${p.type} ${p.goal} ${p.audience} ${p.special}`.toLowerCase();
    if(/seo|local|lokal/.test(low) && /lokal|umkreis|stadt|region|handwerk|dienstleistung/.test(proj)) score+=4;
    if(/shop|checkout|e.?commerce|produkt/.test(low) && /shop|verkauf|produkt|warenkorb/.test(proj)) score+=4;
    if(/anti|slop|ki.?design|design/.test(low) && /ki|design|agentur|karten|eigenständig/.test(proj)) score+=3;
    if(/review|bewertung/.test(low) && /bewertung|google|vertrauen|lokal/.test(proj)) score+=3;
    if(/cms|content/.test(low) && /blog|inhalt|redaktion|cms/.test(proj)) score+=3;
    return score;
  }

  function recommendModules(apply=false){
    const scored=state.modules.map(m=>({id:m.id,score:moduleScore(m)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
    state.recommendedModuleIds=scored.map(x=>x.id);
    if(apply) state.selectedModuleIds=[...new Set([...state.selectedModuleIds,...state.recommendedModuleIds])];
    renderModuleSelection(); updateGuide(); saveState();
    return state.recommendedModuleIds.length;
  }

  function renderModuleSelection(){
    el.moduleSelection.innerHTML="";
    state.modules.forEach(m=>{
      const row=document.createElement("label");row.className="selection-row";const recommended=state.recommendedModuleIds.includes(m.id);
      const always=m.activation==="always";row.innerHTML=`<input type="checkbox" ${state.selectedModuleIds.includes(m.id)||always?"checked":""} ${always?"disabled":""}><div><strong>${escapeHtml(m.name)}</strong>${always?'<span class="recommended-mark"> · IMMER</span>':recommended?'<span class="recommended-mark"> · EMPFOHLEN</span>':""}<p>${escapeHtml(m.summary||"Eigener Prompt-Baustein")}</p></div><code>${escapeHtml(m.tag||"MODUL")}</code>`;
      if(always&&!state.selectedModuleIds.includes(m.id))state.selectedModuleIds.push(m.id);row.querySelector("input").addEventListener("change",e=>{if(always)return;state.selectedModuleIds=e.target.checked?[...new Set([...state.selectedModuleIds,m.id])]:state.selectedModuleIds.filter(id=>id!==m.id);updateGuideContext();saveState()});
      el.moduleSelection.appendChild(row);
    });
  }

  function renderSkillSelection(){
    el.skillSelection.innerHTML=""; const skills=visibleSkills();
    el.skillContextLabel.textContent=`Skills für ${AGENT_NAMES[state.targetAgent]} plus globale Skills.`;
    skills.forEach(s=>{
      const row=document.createElement("label");row.className="selection-row";
      const always=s.activation==="always";row.innerHTML=`<input type="checkbox" ${state.selectedSkillIds.includes(s.id)||always?"checked":""} ${always?"disabled":""}><div><strong>${escapeHtml(s.name)}</strong>${always?'<span class="recommended-mark"> · IMMER</span>':""}<p>${escapeHtml(s.trigger||"Bei passender Aufgabe anwenden")}${s.sourceFile?` · Quelle: ${escapeHtml(s.sourceFile)}`:""}</p></div><code>${escapeHtml(s.agent==="all"?"ALLE":AGENT_NAMES[s.agent]||s.agent)}</code>`;
      if(always&&!state.selectedSkillIds.includes(s.id))state.selectedSkillIds.push(s.id);row.querySelector("input").addEventListener("change",e=>{if(always)return;state.selectedSkillIds=e.target.checked?[...new Set([...state.selectedSkillIds,s.id])]:state.selectedSkillIds.filter(id=>id!==s.id);updateGuideContext();saveState()});
      el.skillSelection.appendChild(row);
    });
    updateGuideContext();
  }

  function parseFrontmatter(text){
    const out={}; if(!text.startsWith("---")) return out; const end=text.indexOf("\n---",3); if(end<0) return out;
    text.slice(3,end).split(/\r?\n/).forEach(line=>{const idx=line.indexOf(":");if(idx>0)out[line.slice(0,idx).trim().toLowerCase()]=line.slice(idx+1).trim().replace(/^['"]|['"]$/g,"")}); return out;
  }

  function inferAgentFromFilename(name){
    const n=name.toLowerCase(); if(n.includes("claude")) return "claude"; if(n.includes("gemini")) return "gemini"; if(n.includes("cursor")) return "cursor"; if(n.includes("codex")||n.includes("agents.md")) return n.includes("agents.md")?"all":"codex"; if(n.includes("chatgpt")) return "chatgpt"; if(n.includes("v0")) return "v0"; return state.targetAgent;
  }

  async function importSkillFiles(files){
    let added=0;
    for(const file of [...files]){
      try{
        const text=await file.text();
        if(file.name.toLowerCase().endsWith(".json")){
          const data=JSON.parse(text); const arr=Array.isArray(data)?data:(Array.isArray(data.skills)?data.skills:[data]);
          arr.forEach(raw=>{
            if(!raw || !raw.prompt && !raw.content && !raw.instructions) return;
            state.skills.push({id:uid("skill"),name:raw.name||file.name.replace(/\.[^.]+$/,"")||"Importierter Skill",agent:AGENT_NAMES[raw.agent]?raw.agent:(raw.agent==="all"?"all":state.targetAgent),trigger:raw.trigger||raw.when||"Aus importierter Datei",prompt:raw.prompt||raw.content||raw.instructions,sourceFile:file.name,activation:"manual"});added++;
          });
        }else{
          const fm=parseFrontmatter(text); const heading=(text.match(/^#\s+(.+)$/m)||[])[1];
          const agent=AGENT_NAMES[fm.agent]?fm.agent:(fm.agent==="all"?"all":inferAgentFromFilename(file.name));
          state.skills.push({id:uid("skill"),name:fm.name||heading||file.name.replace(/\.[^.]+$/,"")||"Importierter Skill",agent,trigger:fm.trigger||fm.when||"Aus importierter Agent-/Skill-Datei; bei passender Aufgabe anwenden",prompt:text.trim(),sourceFile:file.name,activation:"manual"});added++;
        }
      }catch{}
    }
    saveLibrary(); renderLibrary(); renderSkillSelection();renderDefaultActivationSettings();
    if(cloudReady())for(const item of state.skills)window.SiteBriefCloud.saveLibraryItem("skill",item).catch(()=>{});
    el.skillImportMessage.textContent=added?`${added} Skill${added===1?"":"s"} aus Datei${added===1?"":"en"} eingelesen.`:"Keine lesbaren Skills gefunden.";
    setTimeout(()=>{el.skillImportMessage.textContent=""},5000);
  }

  function buildBlueprint(){
    const p=project(); const u=state.understanding || localAnalyzeProject();
    return {
      version:6,
      profile:{activeId:state.activeProfileId||null,name:allProfiles().find(x=>x.id===state.activeProfileId)?.name||null},
      project:p,
      understanding:{summary:u.summary,priorities:u.priorities,domain:u.domain},
      references:{websites:state.urls.map(x=>({url:x.url,aspects:x.aspects,like:x.like,dislike:x.dislike})),images:state.images.map(x=>({name:x.name,aspects:x.aspects,like:x.like,dislike:x.dislike}))},
      targetAgent:{id:state.targetAgent,name:AGENT_NAMES[state.targetAgent]},
      generator:{engine:state.engine,model:el.generatorModel.value.trim()||null},
      template:selectedTemplate()?{name:selectedTemplate().name,tag:selectedTemplate().tag||"",summary:selectedTemplate().summary||""}:null,
      modules:selectedModules().map(x=>({name:x.name,tag:x.tag||"",summary:x.summary||""})),
      skills:selectedSkills().map(x=>({name:x.name,agent:x.agent,trigger:x.trigger||"",sourceFile:x.sourceFile||null})),
      controls:controls(),
      qualitySettings:settingsForApi(),
      projectReview:state.projectReview?{ready:state.projectReview.ready,warnings:state.projectReview.warnings||[],blockers:state.projectReview.blockers||[],assumptions:state.projectReview.assumptions||[]}:null,
      clarifications:[...state.clarifications],
      selectedConcept:selectedConcept()?conceptForExport(selectedConcept()):null,
      refinements:[...state.refinements]
    };
  }

  function renderBlueprint(){
    const b=buildBlueprint(); const refs=b.references.websites.length+b.references.images.length;
    const sections=[
      ["Projekt",`<strong>${escapeHtml(b.project.name||"Ohne Projektnamen")}</strong><br>${escapeHtml(b.project.type)} · ${escapeHtml(b.project.goal)}${b.project.audience?`<br>Zielgruppe: ${escapeHtml(b.project.audience)}`:""}`],
      ["Verständnis",`${escapeHtml(b.understanding.summary)}<ul>${b.understanding.priorities.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`],
      ["Referenzen",refs?`${b.references.websites.length} Website${b.references.websites.length===1?"":"s"} · ${b.references.images.length} Bild${b.references.images.length===1?"":"er"}`:"Keine Referenzen — Konzept wird nur aus dem Briefing entwickelt."],
      ["Agent",`${escapeHtml(b.targetAgent.name)}<br><span class="muted">Generator: ${escapeHtml(b.generator.engine)}${b.generator.model?` · ${escapeHtml(b.generator.model)}`:""}</span>`],
      ["Vorlage",b.template?`${escapeHtml(b.template.name)}${b.template.tag?` · ${escapeHtml(b.template.tag)}`:""}`:"Ohne Master-Vorlage"],
      ["Module",b.modules.length?`<div class="tag-line">${b.modules.map(x=>`<span>${escapeHtml(x.name)}</span>`).join("")}</div>`:"Keine Module aktiv"],
      ["Skills",b.skills.length?`<div class="tag-line">${b.skills.map(x=>`<span>${escapeHtml(x.name)}</span>`).join("")}</div>`:"Keine Agent-Skills aktiv"],
      ["Pflichtprüfungen",`${activeCheckNames().map(x=>escapeHtml(x)).join(" · ")||"Keine"}<br><span class="muted">Rechtsraum: ${escapeHtml(state.settings.legalRegion||"nicht festgelegt")}</span>`],
      ["Gegenfragen",state.clarifications.length?`${state.clarifications.filter(x=>x.answer).length} beantwortet`:(state.settings.aiClarifications?"Noch keine Antworten gespeichert":"Deaktiviert")]
    ];
    el.blueprintSummary.innerHTML=sections.map(([label,content])=>`<div class="blueprint-section"><span>${label}</span><div>${content}</div></div>`).join("");
  }

  const THEMES = {
    craft:{palette:[["#ede8dd","#1c1d19","#df5d39","#b9b4a8"],["#172127","#f0ecdf","#bbd52b","#59636a"],["#eeeae2","#24211c","#ad7443","#cbc1b2"],["#deddd5","#19201d","#d34f39","#9aa19d"],["#f3eee5","#342d25","#bd8a52","#d4c7b6"]],headline:["Arbeit, die man sieht.","Sauber gelöst. Ohne Umwege.","Vor Ort statt versprochen.","Reparieren. Pflegen. Erledigen.","Direkt ansprechbar."]},
    fitness:{palette:[["#171717","#f0eadf","#ef5a33","#6f6d68"],["#f0f2eb","#15201d","#a7d935","#abb3ac"],["#3b2e26","#f2e5cf","#e19b47","#7e6a5c"],["#e9e7df","#1d2730","#d54b3a","#a2aaa9"],["#121412","#f0ede5","#cce64b","#484d47"]],headline:["Train hard. Stay local.","Leistung ohne Show.","Dein Training. Dein Club.","Kraft braucht keinen Hochglanz.","Komm rein. Fang an."]},
    food:{palette:[["#f1dfc0","#261b16","#d54025","#76935d"],["#161412","#ede4d2","#ff6a2a","#645d54"],["#f5f1e7","#20352b","#bd372f","#c8bfae"],["#e8e0d1","#2a211c","#c47832","#8b8e63"],["#231f1b","#f2eadf","#d9563c","#6d7967"]],headline:["Gemacht, nicht inszeniert.","Heute auf den Tisch.","Ein Ort mit Geschmack.","Gutes Essen braucht keinen Filter.","Komm hungrig."]},
    beauty:{palette:[["#eee9e1","#1d1c1a","#9b6a5d","#cfc5bc"],["#f6f4ef","#131313","#3652ff","#d4d4cf"],["#211b1d","#f1e8df","#db6f8c","#66575c"],["#e7e2da","#28211f","#a17768","#bcb3aa"],["#faf7f0","#201f1d","#b64563","#d3cdc3"]],headline:["Weniger Kulisse. Mehr Stil.","Dein Termin. Dein Look.","Studio, nicht Schablone.","Ruhig. Präzise. Persönlich.","Schön ohne Standard."]},
    retail:{palette:[["#f1eee6","#171816","#e65b35","#c7c3b8"],["#161a1e","#f0ede5","#d5ef42","#596068"],["#efe5d7","#302720","#ba7845","#c8b49e"],["#e7e9e5","#152027","#315be8","#9fa7a8"],["#1c1917","#f5ede0","#dd6040","#635c55"]],headline:["Finden. Verstehen. Kaufen.","Produkte ohne Umwege.","Gute Auswahl, klar gezeigt.","Weniger Shop-Lärm.","Das Richtige schneller finden."]},
    digital:{palette:[["#f2f0e9","#16191b","#ff5c35","#c9cbc7"],["#131313","#f1eee6","#a7ff4f","#383838"],["#ffffff","#111111","#2f55ff","#dedede"],["#e9e7df","#14222a","#d2a83a","#adb4b3"],["#1a1f1d","#f3efe7","#73d3b2","#505955"]],headline:["Das Werkzeug zuerst.","Weniger erklären. Mehr benutzen.","Ein klarer Weg durch das Produkt.","Funktion vor Fassade.","So fühlt sich das Produkt an."]},
    generic:{palette:[["#eee9df","#191915","#dc5d38","#beb8aa"],["#e4e5df","#18303a","#b9df36","#9ca7a5"],["#f2e8d7","#3b3027","#c57c3d","#cbb9a4"],["#efeee8","#20211e","#355cca","#b7b8b2"],["#171715","#f1ede3","#d38348","#5f5d56"]],headline:["Klar zeigen, worum es geht.","Eigenständig statt austauschbar.","Mehr Charakter. Weniger Vorlage.","Eine Seite mit Haltung.","Inhalt zuerst."]}
  };

  const VARIANTS = [
    {name:"Editorial Split",variant:"split",mood:"Redaktionell und direkt. Text und Bild teilen sich die Bühne, ohne typische Hero-Schablone.",type:"Charaktervolle Serif + nüchterne Utility-Sans",layout:"Asymmetrischer 55/45-Aufbau, klare Linien, wenige Container",hero:"Statement und echtes Motiv stehen gleichwertig nebeneinander",display:"Georgia, serif"},
    {name:"Image Poster",variant:"poster",mood:"Bildstark und plakativ. Der erste Eindruck kommt aus Motiv, Maßstab und knapper Typografie.",type:"Kräftige Grotesk + kleine technische Labels",layout:"Vollflächiger visueller Einstieg, Inhalte danach in harten Kapiteln",hero:"Großes Motiv als Fläche, Text bewusst darüber oder daneben",display:"Arial Black, Arial, sans-serif"},
    {name:"Field Ledger",variant:"ledger",mood:"Sachlich, glaubwürdig und fast dokumentarisch. Wie ein gut geführtes Arbeitsbuch.",type:"Utility-Sans + nummerierte Mikrotypografie",layout:"Raster, Nummerierung und klare Informationszonen statt Karten",hero:"Projekt-/Leistungslogik direkt im ersten Bildschirm",display:"Arial, Helvetica, sans-serif"},
    {name:"Stacked Narrative",variant:"stacked",mood:"Ruhiger Seitenrhythmus mit deutlichen Bild- und Textkapiteln. Weniger Werbefläche, mehr Erzählung.",type:"Ruhige Serif + kleine Sans",layout:"Große horizontale Abschnitte, wechselnde Bild-/Textgewichte",hero:"Breites Bild mit kompakter Aussage als zweiter Takt",display:"Georgia, serif"},
    {name:"Offset Magazine",variant:"editorial",mood:"Eigenständiger und etwas experimenteller. Überlagerung und Versatz ersetzen typische Zentrierung.",type:"Große Editorial-Serif + kleine Grotesk",layout:"Versetzte Bildfläche, überlappende Typografie, bewusster Weißraum",hero:"Headline und Bild überschneiden sich kontrolliert",display:"Georgia, serif"}
  ];

  function brandName(){
    const p=project(); if(p.name) return p.name.toUpperCase(); const domain=inferDomain(p.description);
    return ({craft:"WERK & SERVICE",fitness:"LOCAL TRAINING",food:"LOCAL KITCHEN",beauty:"LOCAL STUDIO",retail:"THE STORE",digital:"PRODUCT",generic:"YOUR PROJECT"})[domain];
  }

  function localConcepts(count){
    const p=project(); const domain=inferDomain(`${p.description} ${p.type} ${p.goal}`); const theme=THEMES[domain]||THEMES.generic;
    return VARIANTS.slice(0,count).map((v,i)=>{
      const palette=theme.palette[i%theme.palette.length]; const headline=theme.headline[i%theme.headline.length];
      return {id:uid("concept"),name:v.name,mood:v.mood,palette,accent:palette[2],bg:palette[0],text:palette[1],soft:palette[3],type:v.type,layout:v.layout,hero:v.hero,display:v.display,layoutVariant:v.variant,headline,subline:p.description ? p.description.split(/[.!?]/)[0].slice(0,110) : "Konkretes Projekt. Klare Gestaltung.",service:p.type,source:"local"};
    });
  }

  function safeHex(value,fallback){ const v=String(value||"").trim(); return /^#[0-9a-fA-F]{6}$/.test(v)?v:fallback; }
  function safeDisplay(value,fallback){ const v=String(value||"").toLowerCase(); if(v.includes("mono")) return "ui-monospace, SFMono-Regular, Consolas, monospace"; if(v.includes("sans")||v.includes("grotesk")) return "Arial, Helvetica, sans-serif"; if(v.includes("serif")) return "Georgia, serif"; return fallback||"Georgia, serif"; }

  function normalizedConcept(raw,index){
    const fallback=localConcepts(5)[index%5];
    const rawPalette=Array.isArray(raw?.palette)&&raw.palette.length>=4?raw.palette.slice(0,4):fallback.palette;
    const palette=rawPalette.map((v,i)=>safeHex(v,fallback.palette[i]));
    const allowed=["split","poster","ledger","stacked","editorial"];
    return {
      id:raw?.id||uid("concept"),name:String(raw?.name||fallback.name),mood:String(raw?.mood||fallback.mood),palette,
      accent:safeHex(raw?.accent,palette[2]||fallback.accent),bg:safeHex(raw?.bg,palette[0]||fallback.bg),text:safeHex(raw?.text,palette[1]||fallback.text),soft:safeHex(raw?.soft,palette[3]||fallback.soft),
      type:String(raw?.type||fallback.type),layout:String(raw?.layout||fallback.layout),hero:String(raw?.hero||fallback.hero),display:safeDisplay(raw?.display,fallback.display),layoutVariant:allowed.includes(raw?.layoutVariant)?raw.layoutVariant:fallback.layoutVariant,
      headline:String(raw?.headline||fallback.headline),subline:String(raw?.subline||fallback.subline),service:String(raw?.service||project().type),source:String(raw?.source||state.engine)
    };
  }

  function conceptForExport(c){
    if(!c) return null;
    const {id,...rest}=c; return rest;
  }

  async function generateConcepts(){
    if(!cloudReady()&&guestRunsRemaining()===0){showAccountGate();return;}
    if(state.engine!=="local" && state.settings.aiClarifications && state.reviewSignature!==projectSignature() && !state.reviewDeferred){
      const ready=await runProjectReview(false);
      if(!ready){el.generationStatus.className="generation-status error";el.generationStatus.textContent="Bitte zuerst die offenen KI-Gegenfragen klären oder bewusst auf später verschieben.";return;}
    }
    const count=clamp(el.conceptCount.value,3,5); el.generateConceptsBtn.disabled=true; el.generationStatus.className="generation-status busy"; el.generationStatus.textContent="Vorschauen werden vorbereitet…";startTaskProgress("preview",cloudReady()?Math.max(24,count*12):4);
    let concepts=[];
    try{
      if(!cloudReady()||state.engine === "local") concepts=localConcepts(count);
      else{
        const payload={action:"concepts",count,engine:state.engine,model:el.generatorModel.value.trim(),project:project(),references:state.urls.map(x=>({url:x.url,aspects:x.aspects,note:x.like,dislike:x.dislike})),images:state.images.filter(x=>x.dataUrl).slice(0,3).map(x=>({name:x.name,dataUrl:x.dataUrl,aspects:x.aspects,note:x.like,dislike:x.dislike})),controls:controls(),template:selectedTemplate()||{},modules:selectedModules(),settings:settingsForApi(),clarifications:state.clarifications,projectReview:state.projectReview||{}};
        const res=await sitebriefApiFetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); const data=await res.json(); if(!res.ok) throw new Error(data.error||"Generator-Anfrage fehlgeschlagen"); concepts=(data.concepts||[]).slice(0,count).map(normalizedConcept);
        if(concepts.length<count) concepts=[...concepts,...localConcepts(count-concepts.length)];
      }
      state.concepts=concepts.slice(0,count).map(normalizedConcept);state.selectedConceptId=state.concepts[0]?.id||"";state.refinements=[];renderConcepts();renderSelectedPreview();
      if(cloudReady()&&aiConnection("gemini"))await generateConceptImages();
      el.generationStatus.className="generation-status";el.generationStatus.textContent=state.concepts.some(x=>x.previewImage)?`${state.concepts.length} fertige Website-Entwürfe erstellt. Wähle die beste Richtung.`:`${state.concepts.length} Richtungen erstellt. Für echte Bildentwürfe Gemini unter Einstellungen → KI-Verbindungen verbinden.`;
    }catch(err){
      state.concepts=localConcepts(count); state.selectedConceptId=state.concepts[0].id; renderConcepts(); renderSelectedPreview(); el.generationStatus.className="generation-status error"; el.generationStatus.textContent=`KI-Verbindung nicht verfügbar (${err.message}). Lokale Vorschauen wurden stattdessen erstellt.`;
    }finally{finishTaskProgress("preview","Vorschauen fertig");consumeGuestRun();el.generateConceptsBtn.disabled=false;saveState();updateGuide();}
  }

  async function generateConceptImages(){
    for(let i=0;i<state.concepts.length;i++){
      const concept=state.concepts[i];setTaskProgress("preview",Math.round(38+(i/state.concepts.length)*54),`Bildentwurf ${i+1} von ${state.concepts.length} wird gestaltet…`);
      try{
        const payload={action:"preview-image",engine:"gemini",project:project(),concept:conceptForExport(concept),references:state.urls.slice(0,3),images:state.images.filter(x=>x.dataUrl).slice(0,2)};
        const res=await sitebriefApiFetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await res.json();if(!res.ok)throw new Error(data.error||"Bildvorschau fehlgeschlagen");concept.previewImage=data.imageDataUrl||"";renderConcepts();renderSelectedPreview();
      }catch(err){el.generationStatus.textContent=`Bild ${i+1} konnte nicht erzeugt werden: ${err.message}`;}
    }
  }

  function firstReferenceImage(){ return state.images.find(x=>x.dataUrl)?.dataUrl || ""; }

  function createConceptScreen(c){
    const screen=document.createElement("div");screen.className=`concept-screen ${c.layoutVariant}${c.previewImage?" generated-preview":""}`;
    screen.style.setProperty("--c-bg",c.bg);screen.style.setProperty("--c-text",c.text);screen.style.setProperty("--c-accent",c.accent);screen.style.setProperty("--c-soft",c.soft);screen.style.setProperty("--c-display",c.display||"Georgia, serif");
    if(c.previewImage){screen.innerHTML=`<img src="${escapeHtml(c.previewImage)}" alt="Fertiger Website-Entwurf: ${escapeHtml(c.name)}">`;return screen;}
    screen.innerHTML=`<div class="screen-nav"><strong>${escapeHtml(brandName())}</strong><span>WORK &nbsp; ABOUT &nbsp; CONTACT</span></div><div class="screen-body"><div class="screen-copy"><span class="screen-micro">${escapeHtml(project().type)} / ${escapeHtml(project().goal)}</span><h3>${escapeHtml(c.headline)}</h3><p>${escapeHtml(c.subline)}</p><span class="screen-cta">MEHR ANSEHEN →</span></div><div class="screen-photo"></div><span class="screen-micro">${escapeHtml(c.name)}</span></div>`;
    const photo=screen.querySelector(".screen-photo"); const ref=firstReferenceImage(); if(ref) photo.style.backgroundImage=`url(${JSON.stringify(ref).slice(1,-1)})`;
    return screen;
  }

  function renderConcepts(){
    el.conceptGallery.innerHTML="";
    state.concepts.forEach((c,i)=>{
      const button=document.createElement("button");button.type="button";button.className=`concept-option ${state.selectedConceptId===c.id?"active":""}`;
      const head=document.createElement("div");head.className="concept-option-head";head.innerHTML=`<span>RICHTUNG ${String.fromCharCode(65+i)}</span><b>${escapeHtml(c.layoutVariant.toUpperCase())}</b>`;button.appendChild(head);button.appendChild(createConceptScreen(c));
      const cap=document.createElement("div");cap.className="concept-caption";cap.innerHTML=`<h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.mood)}</p><div class="concept-details"><span>${escapeHtml(c.type)}</span><span>${escapeHtml(c.hero)}</span></div>`;button.appendChild(cap);
      button.addEventListener("click",()=>{state.selectedConceptId=c.id;renderConcepts();renderSelectedPreview();saveState();updateGuide()});el.conceptGallery.appendChild(button);
    });
  }

  function renderSelectedPreview(){
    el.selectedPreviewLarge.innerHTML=""; const c=selectedConcept(); if(!c){el.selectedPreviewLarge.innerHTML='<p class="lead">Bitte zuerst in Schritt 6 eine Vorschau auswählen.</p>';return;}
    el.selectedPreviewLarge.appendChild(createConceptScreen(c)); const cap=document.createElement("div");cap.className="concept-caption";cap.innerHTML=`<h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.mood)}</p>`;el.selectedPreviewLarge.appendChild(cap); renderRefinementHistory();
  }

  function hexMix(hex,target="#ffffff",ratio=.15){
    const norm=h=>{h=String(h||"").replace("#","");if(h.length===3)h=h.split("").map(x=>x+x).join("");return /^[0-9a-f]{6}$/i.test(h)?h:null}; const a=norm(hex),b=norm(target); if(!a||!b)return hex;
    const vals=[0,2,4].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-ratio)+parseInt(b.slice(i,i+2),16)*ratio));return `#${vals.map(v=>v.toString(16).padStart(2,"0")).join("")}`;
  }

  function localRefine(c,instruction){
    const next={...c,palette:[...c.palette]};const t=instruction.toLowerCase();
    if(/heller|light/.test(t)){next.bg=hexMix(next.bg,"#ffffff",.28);next.text=hexMix(next.text,"#000000",.08)}
    if(/dunkler|dark/.test(t)){next.bg=hexMix(next.bg,"#000000",.55);next.text="#f1eee6";next.soft=hexMix(next.soft,"#000000",.35)}
    if(/bild größer|mehr bild|image/.test(t)) next.layoutVariant="poster";
    if(/mehr typografie|typograf/.test(t)) next.layoutVariant="editorial";
    if(/ruhiger|weniger beweg|calm/.test(t)) el.motion.value=8;
    if(/weniger ki|anti.?ki|kein ki/.test(t)) el.antiSlop.value=100;
    [el.motion,el.antiSlop].forEach(r=>{if(r?.nextElementSibling)r.nextElementSibling.value=r.value});
    next.mood=`${c.mood} Feinschliff: ${instruction}`; return next;
  }

  async function applyRefinement(){
    const instruction=el.refinementInput.value.trim(); const c=selectedConcept(); if(!instruction||!c)return;
    el.applyRefinementBtn.disabled=true;
    let refined;
    try{
      if(state.engine!=="local"){
        const payload={action:"refine",engine:state.engine,model:el.generatorModel.value.trim(),project:project(),concept:conceptForExport(c),refinement:instruction,references:state.urls.map(x=>({url:x.url,aspects:x.aspects,note:x.like,dislike:x.dislike})),images:state.images.filter(x=>x.dataUrl).slice(0,3).map(x=>({name:x.name,dataUrl:x.dataUrl,aspects:x.aspects,note:x.like,dislike:x.dislike})),controls:controls(),template:selectedTemplate()||{},modules:selectedModules(),settings:settingsForApi(),clarifications:state.clarifications,projectReview:state.projectReview||{}};
        const res=await sitebriefApiFetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await res.json();if(!res.ok)throw new Error(data.error||"Refinement failed");refined=normalizedConcept(data.concept||data.concepts?.[0],0);refined.id=c.id;
      }else refined=localRefine(c,instruction);
    }catch{refined=localRefine(c,instruction)}
    state.concepts=state.concepts.map(x=>x.id===c.id?refined:x);state.refinements.push({id:uid("ref"),text:instruction,at:new Date().toISOString()});el.refinementInput.value="";renderSelectedPreview();renderConcepts();saveState();updateGuide();el.applyRefinementBtn.disabled=false;
  }

  function renderRefinementHistory(){
    el.refinementHistory.innerHTML="";state.refinements.forEach((r,i)=>{const row=document.createElement("div");row.className="refinement-entry";row.innerHTML=`<b>${String(i+1).padStart(2,"0")}</b><span>${escapeHtml(r.text)}</span><button type="button">entfernen</button>`;row.querySelector("button").addEventListener("click",()=>{state.refinements=state.refinements.filter(x=>x.id!==r.id);renderRefinementHistory();saveState()});el.refinementHistory.appendChild(row)});
  }

  const AGENT_INSTRUCTIONS = {
    claude:`Arbeite wie ein sorgfältiger Implementierungsagent. Lies vorhandene Projekt- und Regeldateien zuerst. Leite aus diesem Briefing einen kurzen Umsetzungsplan ab, arbeite danach direkt am Projekt und erhalte bestehende Konventionen, sofern sie nicht dem Briefing widersprechen. Prüfe die fertige Oberfläche und behebe offensichtliche Fehler vor Abschluss.`,
    codex:`Behandle dies als ausführbaren Repo-Auftrag. Prüfe zuerst Repository, Projektanweisungen und vorhandene Struktur. Implementiere die Aufgabe vollständig in den vorhandenen Dateien, führe passende Checks/Builds aus und behebe gefundene Fehler. Lass keine Platzhalter oder unnötigen TODOs zurück.`,
    gemini:`Nutze das Briefing als verbindliche Produktspezifikation. Analysiere zuerst Struktur, Referenzregeln und aktive Skills, bevor du Code oder Dateien erzeugst. Halte Designentscheidung und Implementierung konsistent und prüfe Desktop sowie Mobile.`,
    chatgpt:`Nutze dieses Dokument als Master-Briefing. Erstelle keine neue generische Interpretation, sondern halte die gewählte Richtung, Verbote und Referenzregeln ein. Wenn Code erzeugt wird, liefere zusammenhängende, ausführbare Änderungen statt isolierter Snippets.`,
    cursor:`Nutze das Briefing zusammen mit allen vorhandenen Repository-/Cursor-Regeln. Prüfe den bestehenden Code vor Änderungen, halte Dateistruktur und Konventionen ein und verifiziere die betroffenen Flows nach der Umsetzung.`,
    v0:`Setze die ausgewählte visuelle Richtung und Informationshierarchie möglichst konkret in UI um. Vermeide Standard-Dashboard-/SaaS-Schablonen und erhalte die beschriebenen Bildgrößen, Typografie, Rhythmik und Mobile-Komposition.`,
    universal:`Lies das gesamte Briefing vor der Umsetzung. Verwende aktive Skills als zusätzliche Arbeitsregeln, halte Referenz- und Anti-Slop-Vorgaben ein und prüfe das Ergebnis gegen die Definition of Done.`
  };

  function referencePromptBlock(){
    const urlLines=state.urls.length?state.urls.map((r,i)=>`${i+1}. ${r.url}\n   Übernehmen: ${r.aspects.join(", ")||"nur allgemeine Inspiration"}\n   Gefällt: ${r.like||"nicht angegeben"}\n   Nicht übernehmen: ${r.dislike||"nicht angegeben"}`).join("\n"):"Keine Website-Referenzen.";
    const imageLines=state.images.length?state.images.map((r,i)=>`${i+1}. ${r.name}\n   Übernehmen: ${r.aspects.join(", ")||"nur allgemeine Inspiration"}\n   Gefällt: ${r.like||"nicht angegeben"}\n   Nicht übernehmen: ${r.dislike||"nicht angegeben"}`).join("\n"):"Keine Bild-Referenzen.";
    return `Websites:\n${urlLines}\n\nBilder / Screenshots:\n${imageLines}`;
  }

  function compliancePromptBlock(){
    const checks=activeCheckNames();
    const rules=[];
    if(state.settings.checks?.privacy) rules.push("Datenschutz: externe Dienste, Tracking, Cookies, Formulare, Karten, Videos, Fonts und Datenübertragungen bewusst prüfen; keine Einwilligungslogik erfinden.");
    if(state.settings.checks?.imprint) rules.push("Impressum / Anbieterangaben: erforderliche Anbieterinformationen für den eingestellten Rechtsraum berücksichtigen; fehlende Unternehmensdaten als offene Punkte markieren.");
    if(state.settings.checks?.legal) rules.push("Rechtliche Plausibilität: keine rechtliche Konformität behaupten und keine Pflichttexte aus Vermutungen erzeugen; bei Unsicherheit konkret benennen, was fachlich oder rechtlich geprüft werden muss.");
    if(state.settings.checks?.accessibility) rules.push("Barrierefreiheit: Semantik, Tastaturbedienung, Fokuszustände, Kontraste, Formularbeschriftungen und sinnvolle Alternativtexte prüfen.");
    if(state.settings.checks?.security) rules.push("Sicherheit: Secrets nie im Frontend, Eingaben validieren, Auth/Autorisierung und externe APIs passend absichern.");
    if(state.settings.checks?.performance) rules.push("Performance: Bilder, Fonts, Abhängigkeiten, Rendering und Ladeverhalten bewusst optimieren.");
    if(state.settings.checks?.seo) rules.push("SEO-Grundlagen: sinnvolle Titel/Descriptions, Überschriftenhierarchie, Crawlability und strukturierte interne Navigation berücksichtigen.");
    if(state.settings.noInventLegal) rules.push("Rechtliche Inhalte, Firmenangaben, Einwilligungen, AGB-/Widerrufs-/Datenschutztexte oder vergleichbare Pflichtinformationen niemals frei erfinden.");
    return `Rechtsraum / Markt: ${state.settings.legalRegion||"nicht festgelegt"}\nAktive Pflichtprüfungen: ${checks.join(", ")||"keine"}\n\n${rules.map(x=>`- ${x}`).join("\n")}`;
  }

  function clarificationPromptBlock(){
    const answers=state.clarifications.filter(x=>x.answer?.trim());
    const review=state.projectReview;
    const answerText=answers.length?answers.map((x,i)=>`${i+1}. Frage: ${x.question}\n   Antwort: ${x.answer}`).join("\n"):"Keine zusätzlichen Antworten.";
    const warnings=review?.warnings?.length?review.warnings.map(x=>`- ${x.area||"Hinweis"}: ${x.message||""}`).join("\n"):"Keine gespeicherten Hinweise.";
    const blockers=review?.blockers?.length?review.blockers.map(x=>`- ${x.message||""}${x.alternative?` | mögliche Alternative: ${x.alternative}`:""}`).join("\n"):"Keine gespeicherten Blocker.";
    return `Antworten aus der Projektprüfung:\n${answerText}\n\nHinweise:\n${warnings}\n\nKritische Punkte:\n${blockers}`;
  }

  function buildMasterPrompt(){
    if(!cloudReady()){const p=project(),c=selectedConcept();return `Erstelle eine einfache responsive ${p.type||"Website"} für „${p.name||"dieses Projekt"}“.\n\nZiel: ${p.goal||"klar und verständlich informieren"}.\nZielgruppe: ${p.audience||"allgemein"}.\nBeschreibung: ${p.description||"nicht angegeben"}.\n\nNutze die gewählte Richtung „${c?.name||"schlicht und übersichtlich"}“ als grobe visuelle Orientierung. Baue eine klare Startseite mit Navigation, Hauptbereich, den wichtigsten Inhalten und Kontaktmöglichkeit. Verwende keine erfundenen Bewertungen oder Zahlen. Achte auf mobile Darstellung und grundlegende Bedienbarkeit.`;}
    const p=project();const c=selectedConcept();const t=selectedTemplate();const mods=selectedModules();const skills=selectedSkills();const u=state.understanding||localAnalyzeProject();const ctrl=controls();
    const templateBlock=t?`\n## EIGENE MASTER-VORLAGE: ${t.name}\n${t.prompt}\n`:"";
    const moduleBlock=mods.length?`\n## AKTIVE PROMPT-MODULE\n${mods.map((m,i)=>`### ${i+1}. ${m.name}${m.tag?` [${m.tag}]`:""}\n${m.prompt}`).join("\n\n")}\n`:"";
    const skillBlock=skills.length?`\n## AKTIVE AGENT-SKILLS\nDiese Regeln sind zusätzlich verbindlich, wenn ihr Trigger zur Aufgabe passt. Wenn ein Skill aus einer Datei importiert wurde, behandle den eingebetteten Inhalt wie die gelesene Skill-/Agent-Datei.\n\n${skills.map((s,i)=>`### ${i+1}. ${s.name}\nAgent: ${s.agent==="all"?"Alle Agents":AGENT_NAMES[s.agent]||s.agent}\nTrigger: ${s.trigger||"bei passender Aufgabe"}${s.sourceFile?`\nQuelle: ${s.sourceFile}`:""}\n\n${s.prompt}`).join("\n\n")}\n`:"";
    const refinementBlock=state.refinements.length?state.refinements.map((r,i)=>`${i+1}. ${r.text}`).join("\n"):"Keine zusätzlichen Änderungen nach der Vorschau.";
    const finalCompliance=state.settings.finalChecklist?`\n8. alle unter „Pflichtprüfungen & rechtlicher Rahmen“ aktivierten Bereiche geprüft und offene Punkte transparent benannt wurden,\n9. keine rechtliche Konformität, Einwilligung oder Pflichtinformation erfunden wurde.`:"";
    const agentQuestionRule=state.settings.aiClarifications?"Wenn während der Umsetzung ein fehlender, widersprüchlicher oder nicht machbarer Punkt auftaucht, stelle eine kurze konkrete Gegenfrage, sofern die Antwort das Ergebnis wesentlich verändert. Bei einem Blocker erkläre das Problem knapp und nenne eine machbare Alternative, wenn eine existiert.":"Stelle keine zusätzlichen Präferenzfragen. Wenn ein echter Blocker auftritt, benenne ihn knapp und markiere die nötige Entscheidung; erfinde keine fehlenden Fakten.";
    return `# SITEBRIEF MASTER-PROMPT — ${AGENT_NAMES[state.targetAgent].toUpperCase()}\n\nDu erhältst ein bereits entschiedenes Website-/Web-App-Briefing. Entwickle nicht wieder fünf neue Richtungen. Setze die ausgewählte Richtung konsequent um und nutze Referenzen nur für die ausdrücklich freigegebenen Eigenschaften.\n${templateBlock}\n## 1. PROJEKT\nName: ${p.name||"nicht festgelegt"}\nArt: ${p.type}\nHauptziel: ${p.goal}\nZielgruppe: ${p.audience||"nicht ausdrücklich angegeben"}\n\nBeschreibung:\n${p.description||"Keine Beschreibung vorhanden."}\n\nBesonderer Wunsch:\n${p.special||"Kein zusätzlicher Wunsch."}\n\n## 2. VERSTANDENES ZIEL\n${u.summary}\n\nPrioritäten:\n${u.priorities.map(x=>`- ${x}`).join("\n")}\n\n## 3. PROJEKTPRÜFUNG & GEGENFRAGEN\n${clarificationPromptBlock()}\n\n## 4. PFLICHTPRÜFUNGEN & RECHTLICHER RAHMEN\n${compliancePromptBlock()}\n\nWICHTIG: Diese Entwicklungsprüfung ersetzt keine Rechtsberatung. Wenn aktuelle oder projektspezifische rechtliche Anforderungen unklar sind, markiere sie als offenen Prüfpunkt statt Sicherheit vorzutäuschen.\n\n## 5. REFERENZEN\nReferenzen sind Inspirationsquellen, keine Erlaubnis zum 1:1-Kopieren. Übernimm nur die jeweils ausgewählten Aspekte.\n\n${referencePromptBlock()}\n\n## 6. AUSGEWÄHLTE DESIGNRICHTUNG\n${c?`Name: ${c.name}\nCharakter: ${c.mood}\nKomposition: ${c.layoutVariant}\nLayoutprinzip: ${c.layout}\nHero: ${c.hero}\nTypografie: ${c.type}\nPalette: ${c.palette.join(" / ")}\nPreview-Headline: ${c.headline}\nPreview-Subline: ${c.subline}`:"Es wurde noch keine Designrichtung ausgewählt."}\n\n## 7. FEINSCHLIFF NACH DER VORSCHAU\n${refinementBlock}\n\n## 8. DESIGNREGLER\n- Originalität: ${ctrl.originality}/100\n- KI-/Template-Look vermeiden: ${ctrl.antiSlop}/100\n- Bewegung / Animation: ${ctrl.motion}/100\n- Informationsdichte: ${ctrl.density}/100\n${moduleBlock}\n## 9. VERBINDLICHE ANTI-SLOP-REGELN\n- Keine austauschbare SaaS-Hero-Section aus Badge, zentrierter Riesenheadline, zwei Standardbuttons und anschließend drei Karten.\n- Keine dekorativen Gradient-Orbs, Glassmorphism-Flächen, Glow-Effekte oder schwebenden Dekoobjekte ohne konkreten Projektbezug.\n- Keine 3er-/4er-Card-Grids als Standardlösung für beliebige Inhalte.\n- Keine erfundenen Bewertungen, Statistiken, Kundenlogos, Zertifikate, Projekte oder Behauptungen.\n- Keine generischen Marketingfloskeln oder künstlich pathetische Sprache.\n- Border-Radius, Schatten, Icons und Animationen nur einsetzen, wenn sie zur gewählten Richtung gehören.\n- Bildsprache und Typografie müssen den Charakter tragen; Container dürfen nicht die einzige Hierarchie erzeugen.\n- Mobile ist eine eigene Komposition. Nicht einfach Desktop-Elemente untereinander stapeln.\n- Referenzen nie pixelgenau kopieren. Prinzipien extrahieren und eigenständig kombinieren.\n${skillBlock}\n## 10. ARBEITSWEISE FÜR ${AGENT_NAMES[state.targetAgent].toUpperCase()}\n${AGENT_INSTRUCTIONS[state.targetAgent]}\n\n${agentQuestionRule}\n\n## 11. UMSETZUNGSANFORDERUNGEN\n- Responsive ab kleinen Mobilgeräten bis große Desktop-Breiten.\n- Semantische Struktur und tastaturbedienbare Interaktionen.\n- Performance und Bildgrößen bewusst behandeln; unnötige Abhängigkeiten vermeiden.\n- Zentrale Design-Tokens für Farben, Typografie, Abstände, Linien und Bewegungswerte.\n- Keine Lorem-Ipsum-/Fake-Inhalte im fertigen Stand, wenn reale Informationen aus dem Briefing vorhanden sind.\n- Bestehende Projektstruktur respektieren, falls bereits ein Repository existiert.\n\n## 12. DEFINITION OF DONE\nDas Ergebnis ist erst fertig, wenn:\n1. die gewählte Vorschau-Richtung im realen Layout klar wiederzuerkennen ist,\n2. Referenzregeln und explizite Verbote eingehalten sind,\n3. aktive Module und relevante Skills berücksichtigt wurden,\n4. Desktop und Mobile bewusst gestaltet sind,\n5. keine offensichtlichen Standard-KI-/Template-Muster übrig sind,\n6. Kernfunktionen und Hauptziel des Projekts tatsächlich funktionieren,\n7. relevante Checks/Builds ohne vermeidbare Fehler durchlaufen.${finalCompliance}\n\nBeginne jetzt mit der Umsetzung auf Basis dieses Briefings.\n`;
  }

  function updateMasterPrompt(){
    const prompt=buildMasterPrompt();el.masterPrompt.value=prompt;const c=selectedConcept();el.promptMeta.innerHTML=`<span>${escapeHtml(AGENT_NAMES[state.targetAgent])} · ${escapeHtml(c?.name||"keine Richtung")}</span><span>${prompt.length.toLocaleString("de-DE")} Zeichen · ${selectedModules().length} Module · ${selectedSkills().length} Skills</span>`;
  }

  function guideConfig(step){
    const refs=referenceCount(); const mods=selectedModules().length; const skills=selectedSkills().length; const c=selectedConcept();
    if(step===1){
      const enough=project().description.length>=20;return {label:"PROJEKT",title:enough?"Das reicht schon für eine erste Auswertung.":"Beschreibe zuerst nur das Vorhaben.",text:enough?"Ich kann daraus Ziel, Charakter und erste Prioritäten ableiten. Du kannst die Zusammenfassung danach korrigieren.":"Du musst noch keine perfekte Design-Sprache kennen. Betrieb, Angebot, Ziel und ein Satz darüber, was du nicht willst, reichen.",suggestions:enough?["<b>Automatisch:</b> Projektart und Hauptziel bleiben unter deiner Kontrolle.","<b>Gut zu nennen:</b> Zielgruppe, lokaler Bezug, besondere Funktionen oder klare Design-Verbote."]:[],action:enough?{label:"Beschreibung auswerten",fn:analyzeProject}:null};
    }
    if(step===2){return {label:"REFERENZEN",title:refs?`${refs} Referenz${refs===1?"":"en"} vorhanden.`:"Referenzen sind optional.",text:refs?"Lege pro Quelle fest, was wirklich übernommen werden darf. Das verhindert, dass eine KI blind den kompletten Stil nachbaut.":"Ohne Referenzen funktioniert der Durchlauf ebenfalls. Für schwer beschreibbare Layouts sind Screenshots besonders hilfreich.",suggestions:[state.urls.length&&!state.images.length?"<b>Tipp:</b> Wenn dir eine URL optisch wichtig ist, ergänze einen Screenshot.":"<b>Grundregel:</b> Layout, Farben und Bildsprache getrennt bewerten.","<b>Nützlich:</b> Schreib auch hinein, was dir an einer Referenz ausdrücklich nicht gefällt."],action:null};}
    if(step===3){return {label:"AGENT",title:`Master-Prompt für ${AGENT_NAMES[state.targetAgent]}.`,text:state.engine==="local"?"Die Konzeptvorschläge werden aktuell kostenlos lokal erstellt. Der finale Prompt wird trotzdem agentenspezifisch aufgebaut.":"Die externe Generator-KI entwickelt die Vorschauen und darf vorab gezielt nachfragen; der Ziel-Agent bestimmt dagegen Arbeitsweise und Skills des finalen Prompts.",suggestions:["<b>Generator ≠ Ziel-Agent:</b> Du kannst z. B. Bilder mit einem Modell analysieren und trotzdem für Codex exportieren.",state.settings.aiClarifications?`<b>Gegenfragen:</b> aktiv, maximal ${state.settings.maxQuestions} pro Prüfung.`:"<b>Gegenfragen:</b> in den Einstellungen deaktiviert.",`<b>Pflichtprüfung:</b> ${activeCheckNames().join(", ")||"keine Bereiche"}.`,"<b>KI-Verbindungen:</b> eigene Keys direkt unter Einstellungen verbinden; gespeichert werden sie verschlüsselt in Supabase Vault."],action:null};}
    if(step===4){const rec=state.recommendedModuleIds.length;return {label:"MODULE & SKILLS",title:state.modules.length||state.skills.length?"Nur das aktivieren, was diesen Auftrag besser macht.":"Deine Bibliotheken sind noch leer.",text:state.modules.length||state.skills.length?`${mods} Module und ${skills} Skills sind gerade aktiv. Skills werden passend zum gewählten Agenten gefiltert.`:"Lege eigene Module und Skills über „Bibliotheken“ an oder lies vorhandene AGENTS.md-, CLAUDE.md-, GEMINI.md- oder SKILL.md-Dateien ein.",suggestions:[rec?`<b>${rec} Modul${rec===1?"":"e"}</b> passen anhand deiner eigenen Beschreibungen zum Projekt.`:"<b>Keine festen Module:</b> SiteBrief erfindet dir keine Bibliothek. Du entscheidest die Regeln.","<b>Skill-Dateien:</b> importierter Inhalt wird später vollständig in den Master-Prompt eingebettet."],action:state.modules.length?{label:"Passende Module auswählen",fn:()=>recommendModules(true)}:null};}
    if(step===5){return {label:"KONZEPT",title:"Das Blueprint ist die gemeinsame Wahrheit.",text:"Aus diesem strukturierten Stand entstehen die Vorschauen. Änderst du vorher Projekt, Referenzen, Module oder globale Prüfregeln, wird das Blueprint neu aufgebaut.",suggestions:[`<b>Anti-KI-Look:</b> aktuell ${controls().antiSlop}/100.`,`<b>Originalität:</b> aktuell ${controls().originality}/100.`,`<b>Rechtsraum:</b> ${escapeHtml(state.settings.legalRegion||"nicht festgelegt")}.`],action:null};}
    if(step===6){return {label:"VORSCHAUEN",title:state.concepts.length?`${state.concepts.length} Richtungen — eine davon wird die Basis.`:"Erzeuge jetzt 3 bis 5 Richtungen.",text:state.concepts.length?"Die Karten sind kleine echte HTML/CSS-Kompositionen, nicht nur Farbfelder. Wähle die strukturell beste Richtung; Details kannst du im nächsten Schritt ändern.":"Die Varianten bekommen unterschiedliche Kompositionssysteme. Eine reine Farbvariation zählt nicht als neue Richtung.",suggestions:[c?`<b>Ausgewählt:</b> ${escapeHtml(c.name)}.`:"<b>Noch offen:</b> keine Richtung ausgewählt.",firstReferenceImage()?"<b>Referenzbild:</b> wird in den Mini-Layouts als Motiv genutzt.":"<b>Ohne Bild:</b> Vorschauen zeigen neutrale Fotoflächen."],action:state.concepts.length?null:{label:`${el.conceptCount.value} Richtungen erzeugen`,fn:generateConcepts}};}
    if(step===7){return {label:"FEINSCHLIFF",title:c?`${c.name} ist jetzt die Basis.`:"Bitte zuerst eine Richtung auswählen.",text:"Ändere nur noch gezielt. Jeder Änderungswunsch bleibt im Verlauf und wird zusätzlich in den Master-Prompt geschrieben.",suggestions:[state.refinements.length?`<b>${state.refinements.length} Änderung${state.refinements.length===1?"":"en"}</b> gespeichert.`:"<b>Tipp:</b> Hero behalten + Struktur aus einer anderen Vorschau ist ein guter konkreter Änderungswunsch.","<b>Lokaler Modus:</b> einfache Stiländerungen werden direkt simuliert; der Textwunsch bleibt trotzdem verbindlich für den Agenten."],action:null};}
    return {label:"MASTER-PROMPT",title:`Bereit für ${AGENT_NAMES[state.targetAgent]}.`,text:"Der Prompt verbindet Briefing, Referenzen, Designentscheidung, deine eigenen Module und die aktiven Agent-Skills zu einem einzigen Arbeitsauftrag.",suggestions:[`<b>${selectedModules().length}</b> Module eingebettet.`,`<b>${selectedSkills().length}</b> Skills eingebettet.`,state.refinements.length?`<b>${state.refinements.length}</b> Feinschliff-Anweisungen übernommen.`:"<b>Keine</b> nachträglichen Feinschliff-Anweisungen."],action:null};
  }

  function updateGuide(){
    const cfg=guideConfig(state.currentStep);el.guideStepLabel.textContent=cfg.label;el.guideTitle.textContent=cfg.title;el.guideText.textContent=cfg.text;el.guideSuggestions.innerHTML=(cfg.suggestions||[]).map(x=>`<div class="guide-suggestion">${x}</div>`).join("");
    if(cfg.action){el.guideActionBtn.hidden=false;el.guideActionBtn.textContent=cfg.action.label;el.guideActionBtn.onclick=cfg.action.fn}else{el.guideActionBtn.hidden=true;el.guideActionBtn.onclick=null}updateGuideContext();
  }

  function updateGuideContext(){
    el.guideAgent.textContent=AGENT_NAMES[state.targetAgent];el.guideModules.textContent=`${selectedModules().length} aktiv`;el.guideSkills.textContent=`${selectedSkills().length} aktiv`;el.guideReferences.textContent=String(referenceCount());
  }

  function validateStep(next){
    if(next>1 && project().description.length<20){el.projectValidation.textContent="Bitte zuerst das Projekt kurz beschreiben.";goStep(1,true);return false}
    if(next===7 && !selectedConcept()){el.generationStatus.className="generation-status error";el.generationStatus.textContent="Bitte zuerst mindestens eine Vorschau erzeugen und auswählen.";return false}
    if(next===8 && !selectedConcept()) return false;
    return true;
  }

  function goStep(step,force=false){
    step=clamp(step,1,8);if(!force && state.mode!=="expert" && step>state.maxVisited+1)return;if(!validateStep(step))return;
    state.currentStep=step;state.maxVisited=Math.max(state.maxVisited,step);
    $$('[data-step-panel]').forEach(p=>p.classList.toggle("active",Number(p.dataset.stepPanel)===step));
    $$('.step-nav').forEach(btn=>{const n=Number(btn.dataset.step);btn.classList.toggle("active",n===step);btn.classList.toggle("done",n<step || n<state.maxVisited)});
    el.progressText.textContent=`${step} / 8`;
    if(step===1) renderUnderstanding();
    if(step===4){renderTemplateSelect();recommendModules(false);renderSkillSelection();if(state.mode==="auto")recommendModules(true)}
    if(step===5) renderBlueprint();
    if(step===6 && state.mode==="auto" && !state.concepts.length) setTimeout(generateConcepts,100);
    if(step===7) renderSelectedPreview();
    if(step===8) updateMasterPrompt();
    updateGuide();saveState();window.scrollTo({top:0,behavior:"smooth"});
  }

  function setMode(mode){
    state.mode=mode;$$('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    if(mode==="expert") state.maxVisited=8;
    updateGuide();saveState();
  }

  function renderLibrary(){
    renderTemplateSelect();renderModuleSelection();renderSkillSelection();
    renderLibraryList("template");renderLibraryList("module");renderLibraryList("skill");
  }

  function renderLibraryList(type){
    const map={template:[state.templates,el.templateLibraryList],module:[state.modules,el.moduleLibraryList],skill:[state.skills,el.skillLibraryList]}; const [arr,container]=map[type]; container.innerHTML="";
    if(!arr.length){container.innerHTML='<div class="library-item"><div><strong>Noch leer</strong><p>Lege rechts deinen ersten eigenen Eintrag an.</p></div></div>';return}
    arr.forEach(item=>{
      const row=document.createElement("div");row.className="library-item"; const meta=type==="skill"?`${item.agent==="all"?"Alle Agents":AGENT_NAMES[item.agent]||item.agent}${item.sourceFile?` · ${item.sourceFile}`:""}`:(item.tag||"");
      row.innerHTML=`<div><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.summary||item.trigger||"Eigener Eintrag")}</p>${meta?`<code>${escapeHtml(meta)}</code>`:""}</div><div class="library-item-actions"><button type="button" data-edit>bearbeiten</button><button type="button" data-delete>löschen</button></div>`;
      row.querySelector("[data-edit]").addEventListener("click",()=>editLibraryItem(type,item.id));row.querySelector("[data-delete]").addEventListener("click",()=>deleteLibraryItem(type,item.id));container.appendChild(row);
    });
  }

  function editLibraryItem(type,id){
    if(type==="template"){
      const x=state.templates.find(i=>i.id===id);if(!x)return;state.editing.template=id;el.libTemplateName.value=x.name;el.libTemplateTag.value=x.tag||"";el.libTemplateSummary.value=x.summary||"";el.libTemplatePrompt.value=x.prompt||"";el.templateEditorTitle.textContent="Prompt-Vorlage bearbeiten";el.cancelTemplateEditBtn.hidden=false;
    }else if(type==="module"){
      const x=state.modules.find(i=>i.id===id);if(!x)return;state.editing.module=id;el.libModuleName.value=x.name;el.libModuleTag.value=x.tag||"";el.libModuleSummary.value=x.summary||"";el.libModulePrompt.value=x.prompt||"";el.moduleEditorTitle.textContent="Modul bearbeiten";el.cancelModuleEditBtn.hidden=false;
    }else{
      const x=state.skills.find(i=>i.id===id);if(!x)return;state.editing.skill=id;el.libSkillName.value=x.name;el.libSkillAgent.value=x.agent;el.libSkillTrigger.value=x.trigger||"";el.libSkillPrompt.value=x.prompt||"";el.skillEditorTitle.textContent="Agent-Skill bearbeiten";el.cancelSkillEditBtn.hidden=false;
    }
  }

  function clearLibraryEditor(type){
    if(type==="template"){state.editing.template="";el.libTemplateName.value="";el.libTemplateTag.value="";el.libTemplateSummary.value="";el.libTemplatePrompt.value="";el.templateEditorTitle.textContent="Prompt-Vorlage anlegen";el.cancelTemplateEditBtn.hidden=true}
    if(type==="module"){state.editing.module="";el.libModuleName.value="";el.libModuleTag.value="";el.libModuleSummary.value="";el.libModulePrompt.value="";el.moduleEditorTitle.textContent="Modul anlegen";el.cancelModuleEditBtn.hidden=true}
    if(type==="skill"){state.editing.skill="";el.libSkillName.value="";el.libSkillAgent.value="all";el.libSkillTrigger.value="";el.libSkillPrompt.value="";el.skillEditorTitle.textContent="Agent-Skill anlegen";el.cancelSkillEditBtn.hidden=true}
  }

  async function saveLibraryItem(type){
    let item=null;
    if(type==="template"){
      const name=el.libTemplateName.value.trim(),prompt=el.libTemplatePrompt.value.trim();if(!name||!prompt)return;item={id:state.editing.template||uid("tpl"),name,tag:el.libTemplateTag.value.trim(),summary:el.libTemplateSummary.value.trim(),prompt};state.templates=state.editing.template?state.templates.map(x=>x.id===item.id?item:x):[...state.templates,item];clearLibraryEditor("template");
    }else if(type==="module"){
      const name=el.libModuleName.value.trim(),prompt=el.libModulePrompt.value.trim();if(!name||!prompt)return;const old=state.modules.find(x=>x.id===state.editing.module);item={id:state.editing.module||uid("mod"),name,tag:el.libModuleTag.value.trim(),summary:el.libModuleSummary.value.trim(),prompt,activation:old?.activation||"manual"};state.modules=state.editing.module?state.modules.map(x=>x.id===item.id?item:x):[...state.modules,item];clearLibraryEditor("module");
    }else{
      const name=el.libSkillName.value.trim(),prompt=el.libSkillPrompt.value.trim();if(!name||!prompt)return;const old=state.skills.find(x=>x.id===state.editing.skill);item={id:state.editing.skill||uid("skill"),name,agent:el.libSkillAgent.value,trigger:el.libSkillTrigger.value.trim(),prompt,sourceFile:old?.sourceFile||null,activation:old?.activation||"manual"};state.skills=state.editing.skill?state.skills.map(x=>x.id===item.id?item:x):[...state.skills,item];clearLibraryEditor("skill");
    }
    saveLibrary();renderLibrary();renderDefaultActivationSettings();recommendModules(false);updateGuide();saveState();
    if(cloudReady())try{await window.SiteBriefCloud.saveLibraryItem(type,item);setSyncState("Cloud","synced")}catch(err){state.cloud.error=err?.message||"Bibliothek konnte nicht synchronisiert werden";setSyncState("Sync-Fehler","error")}
  }

  async function deleteLibraryItem(type,id){
    if(!confirm("Diesen Eintrag wirklich löschen?"))return;
    if(type==="template"){state.templates=state.templates.filter(x=>x.id!==id);if(state.templateId===id)state.templateId="";}
    if(type==="module"){state.modules=state.modules.filter(x=>x.id!==id);state.selectedModuleIds=state.selectedModuleIds.filter(x=>x!==id);}
    if(type==="skill"){state.skills=state.skills.filter(x=>x.id!==id);state.selectedSkillIds=state.selectedSkillIds.filter(x=>x!==id);}
    saveLibrary();renderLibrary();renderDefaultActivationSettings();updateGuide();saveState();
    if(cloudReady())try{await window.SiteBriefCloud.deleteLibraryItem(type,id)}catch(err){state.cloud.error=err?.message||"Löschen konnte nicht synchronisiert werden";setSyncState("Sync-Fehler","error")}
  }

  function openLibrary(tab="templates"){
    el.libraryDialog.showModal();switchLibraryTab(tab);
  }
  function switchLibraryTab(tab){
    $$('[data-library-tab]').forEach(b=>b.classList.toggle('active',b.dataset.libraryTab===tab));$$('[data-library-pane]').forEach(p=>p.classList.toggle('active',p.dataset.libraryPane===tab));
  }

  function exportLibrary(){
    const blob=new Blob([JSON.stringify({sitebriefLibraryVersion:6,profiles:state.profiles,activeProfileId:state.activeProfileId,templates:state.templates,modules:state.modules,skills:state.skills,settings:state.settings},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sitebrief-library.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }

  async function importLibrary(file){
    if(!file)return;if(!cloudReady()){showAccountGate();el.importLibraryInput.value="";return;}try{const data=JSON.parse(await file.text()),root=data.library&&typeof data.library==="object"?{...data,...data.library}:data,items=Array.isArray(data)?data:[];const typed=type=>items.filter(x=>String(x.type||x.kind||"").toLowerCase()===type);const templates=[...(Array.isArray(root.templates)?root.templates:[]),...typed("template")];const modules=[...(Array.isArray(root.modules)?root.modules:[]),...typed("module")];const skills=[...(Array.isArray(root.skills)?root.skills:[]),...(Array.isArray(root.agentSkills)?root.agentSkills:[]),...typed("skill")];const profiles=Array.isArray(root.profiles)?root.profiles:[];const normalize=(x,type)=>({...x,name:x.name||x.title||x.id||`Importierter ${type}`,prompt:x.prompt||x.instructions||x.content||x.body||""});
      state.templates=mergeById(state.templates,templates.map(x=>({...normalize(x,"Vorlage"),id:x.id||uid("tpl")})).filter(x=>x.prompt));state.modules=mergeById(state.modules,modules.map(x=>({...normalize(x,"Modul"),id:x.id||uid("mod"),activation:x.activation||"manual"})).filter(x=>x.prompt));state.skills=mergeById(state.skills,skills.map(x=>({...normalize(x,"Skill"),id:x.id||uid("skill"),agent:x.agent||"all",activation:x.activation||"manual"})).filter(x=>x.prompt));state.profiles=mergeById(state.profiles,profiles.map(x=>({...x,id:x.id||uid("profile")})));if(root.activeProfileId)state.activeProfileId=root.activeProfileId;if(root.settings&&typeof root.settings==="object"){state.settings={...DEFAULT_SETTINGS,...root.settings,checks:{...DEFAULT_SETTINGS.checks,...(root.settings.checks||{})}};saveSettings();}saveLibrary();saveProfiles();renderLibrary();renderProfileUi();renderAiReviewCard();recommendModules(false);updateGuide();syncEverything();}catch{alert("Die JSON-Datei konnte nicht als SiteBrief-Bibliothek gelesen werden.")}
    el.importLibraryInput.value="";
  }

  function downloadText(filename,text,type="text/plain") { const blob=new Blob([text],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500); }

  function resetProject(){
    if(!confirm("Projekt zurücksetzen? Deine Bibliotheken bleiben erhalten."))return;localStorage.removeItem(STORAGE_KEY);location.reload();
  }

  function bindEvents(){
    el.projectDescription.addEventListener("input",()=>{el.descriptionCount.textContent=el.projectDescription.value.length;state.understandingConfirmed=false;saveState();renderAiReviewCard();updateGuide()});
    [el.projectName,el.projectType,el.projectGoal,el.projectAudience,el.projectSpecial].forEach(x=>x.addEventListener("input",()=>{state.understandingConfirmed=false;saveState();renderAiReviewCard();updateGuide()}));
    el.reanalyzeProjectBtn.addEventListener("click",analyzeProject);el.confirmUnderstandingBtn.addEventListener("click",()=>{state.understandingConfirmed=true;saveState();updateGuide()});el.editUnderstandingBtn.addEventListener("click",()=>el.projectDescription.focus());
    el.addUrlBtn.addEventListener("click",addUrl);el.referenceUrl.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addUrl()}});
    el.uploadZone.addEventListener("click",e=>{if(!e.target.closest("button")||e.target.closest("button"))el.imageInput.click()});el.uploadZone.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();el.imageInput.click()}});el.imageInput.addEventListener("change",e=>addImages(e.target.files));
    ["dragenter","dragover"].forEach(evt=>el.uploadZone.addEventListener(evt,e=>{e.preventDefault();el.uploadZone.classList.add("drag")}));["dragleave","drop"].forEach(evt=>el.uploadZone.addEventListener(evt,e=>{e.preventDefault();el.uploadZone.classList.remove("drag")}));el.uploadZone.addEventListener("drop",e=>addImages(e.dataTransfer.files));
    $$('#agentSelector button').forEach(b=>b.addEventListener("click",()=>{state.targetAgent=b.dataset.agent;$$('#agentSelector button').forEach(x=>x.classList.toggle('active',x===b));state.selectedSkillIds=state.selectedSkillIds.filter(id=>visibleSkills().some(s=>s.id===id));applyAlwaysActiveItems(false);renderSkillSelection();saveState();updateGuide()}));
    el.generatorEngine.addEventListener("change",()=>{state.modelsLoaded=false;updateEngineUi()});el.generatorModel.addEventListener("input",()=>{state.model=el.generatorModel.value.trim();saveState();renderAiReviewCard()});
    el.templateSelect.addEventListener("change",()=>{state.templateId=el.templateSelect.value;saveState();updateGuide()});el.recommendModulesBtn.addEventListener("click",()=>recommendModules(true));
    el.importSkillFileBtn.addEventListener("click",()=>el.skillFileInput.click());el.skillFileInput.addEventListener("change",e=>{importSkillFiles(e.target.files);e.target.value=""});
    [el.originality,el.antiSlop,el.motion,el.density].forEach(r=>r.addEventListener("input",()=>{r.nextElementSibling.value=r.value;saveState();updateGuide()}));
    el.generateConceptsBtn.addEventListener("click",generateConcepts);el.conceptCount.addEventListener("change",()=>{saveState();updateGuide()});
    $$('#quickRefinements button').forEach(b=>b.addEventListener("click",()=>{const t=b.textContent.trim();el.refinementInput.value=el.refinementInput.value.trim()?`${el.refinementInput.value.trim()}, ${t}`:t;el.refinementInput.focus()}));el.applyRefinementBtn.addEventListener("click",applyRefinement);el.clearRefinementsBtn.addEventListener("click",()=>{state.refinements=[];renderRefinementHistory();saveState();updateGuide()});
    $$('.next-btn').forEach(b=>b.addEventListener("click",async()=>{const next=Number(b.dataset.next);if(state.currentStep===1&&!state.understanding){const ok=await analyzeProject();if(!ok)return;}if(state.currentStep===3&&next===4&&state.engine!=="local"&&state.settings.aiClarifications){const ok=await runProjectReview(false);if(!ok)return;}goStep(next)}));$$('.back-btn').forEach(b=>b.addEventListener("click",()=>goStep(Number(b.dataset.back),true)));
    $$('.step-nav').forEach(b=>b.addEventListener("click",()=>{const n=Number(b.dataset.step);if(state.mode==="expert"||n<=state.maxVisited)goStep(n,true)}));$$('.mode-switch button').forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
    el.copyPromptBtn.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(el.masterPrompt.value);const old=el.copyPromptBtn.textContent;el.copyPromptBtn.textContent="Kopiert ✓";setTimeout(()=>el.copyPromptBtn.textContent=old,1300)}catch{}});el.downloadPromptBtn.addEventListener("click",()=>downloadText(`sitebrief-${state.targetAgent}-master-prompt.md`,el.masterPrompt.value,"text/markdown"));el.downloadBriefBtn.addEventListener("click",()=>downloadText("sitebrief-blueprint.json",JSON.stringify(buildBlueprint(),null,2),"application/json"));
    el.openLibraryBtn.addEventListener("click",()=>openLibrary("templates"));$$('[data-open-library]').forEach(b=>b.addEventListener("click",()=>openLibrary(b.dataset.openLibrary)));$$('[data-library-tab]').forEach(b=>b.addEventListener("click",()=>switchLibraryTab(b.dataset.libraryTab)));
    el.openSettingsBtn.addEventListener("click",()=>{populateSettingsDialog();el.settingsDialog.showModal()});el.saveSettingsBtn.addEventListener("click",saveSettingsFromDialog);
    el.gatewayConnectBtn?.addEventListener("click",()=>saveAiProviderConnection("gateway"));el.gatewayTestBtn?.addEventListener("click",()=>testAiProviderConnection("gateway"));el.gatewayDisconnectBtn?.addEventListener("click",()=>disconnectAiProvider("gateway"));
    el.openaiConnectBtn?.addEventListener("click",()=>saveAiProviderConnection("openai"));el.openaiTestBtn?.addEventListener("click",()=>testAiProviderConnection("openai"));el.openaiDisconnectBtn?.addEventListener("click",()=>disconnectAiProvider("openai"));
    el.geminiConnectBtn?.addEventListener("click",()=>saveAiProviderConnection("gemini"));el.geminiTestBtn?.addEventListener("click",()=>testAiProviderConnection("gemini"));el.geminiDisconnectBtn?.addEventListener("click",()=>disconnectAiProvider("gemini"));
    el.settingsLoginBtn?.addEventListener("click",()=>{el.settingsDialog.close();updateAccountUi();el.accountDialog.showModal();});
    el.setActiveProfile.addEventListener("change",renderProfileImpact);el.applyProfileBtn.addEventListener("click",()=>{const id=el.setActiveProfile.value;state.activeProfileId=id;applyProfileById(id,{persist:true,forNewProject:true});});
    el.saveProfileBtn.addEventListener("click",()=>{el.profileDialog.showModal();renderProfileList()});el.manageProfilesBtn.addEventListener("click",()=>{el.profileDialog.showModal();renderProfileList()});el.createProfileBtn.addEventListener("click",createProfileFromDialog);
    el.accountBtn.addEventListener("click",()=>{updateAccountUi();renderGuestLimit();el.accountDialog.showModal()});el.signInBtn.addEventListener("click",signIn);el.signUpBtn.addEventListener("click",signUp);el.guestContinueBtn.addEventListener("click",closeAccountGate);el.signOutBtn.addEventListener("click",signOut);el.syncNowBtn.addEventListener("click",syncEverything);el.accountDialog.addEventListener("cancel",e=>{if(el.accountDialog.classList.contains("guest-gate"))e.preventDefault()});
    el.runAiReviewBtn.addEventListener("click",()=>{if(state.engine!=="local"&&!state.settings.aiClarifications){populateSettingsDialog();el.settingsDialog.showModal();return;}runProjectReview(true)});
    el.saveClarificationsBtn.addEventListener("click",saveClarificationAnswers);el.deferClarificationsBtn.addEventListener("click",()=>{state.reviewDeferred=true;saveState();el.clarificationDialog.close();renderAiReviewCard();updateGuide()});
    el.saveTemplateBtn.addEventListener("click",()=>saveLibraryItem("template"));el.saveModuleBtn.addEventListener("click",()=>saveLibraryItem("module"));el.saveSkillBtn.addEventListener("click",()=>saveLibraryItem("skill"));el.cancelTemplateEditBtn.addEventListener("click",()=>clearLibraryEditor("template"));el.cancelModuleEditBtn.addEventListener("click",()=>clearLibraryEditor("module"));el.cancelSkillEditBtn.addEventListener("click",()=>clearLibraryEditor("skill"));
    el.exportLibraryBtn.addEventListener("click",exportLibrary);el.importLibraryBtn.addEventListener("click",()=>el.importLibraryInput.click());el.importLibraryInput.addEventListener("change",e=>importLibrary(e.target.files?.[0]));
    el.resetBtn.addEventListener("click",resetProject);el.startNewBtn.addEventListener("click",resetProject);el.brandHome.addEventListener("click",e=>{e.preventDefault();goStep(1,true)});
  }

  function init(){
    cacheElements();
    const hadSavedProject=Boolean(localStorage.getItem(STORAGE_KEY));
    loadLibrary();loadSettings();loadProfiles();restoreState();
    if(!hadSavedProject){
      if(!state.activeProfileId)state.activeProfileId=state.settings.activeProfileId||"system-standard";
      if(!applyProfileById(state.activeProfileId,{persist:false,forNewProject:true})){
        state.mode=state.settings.defaultMode||"guided";state.targetAgent=state.settings.defaultAgent||"codex";state.engine=state.settings.defaultEngine||"local";state.model=state.settings.defaultModel||"";el.conceptCount.value=String(state.settings.defaultConceptCount||5);applyAlwaysActiveItems(true);
      }
    }else applyAlwaysActiveItems(false);
    renderLibrary();renderReferences();renderUnderstanding();renderProfileUi();
    el.generatorEngine.value=state.engine;el.generatorModel.value=state.model||"";updateEngineUi();
    $$('#agentSelector button').forEach(b=>b.classList.toggle('active',b.dataset.agent===state.targetAgent));
    $$('.mode-switch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    if(state.concepts.length){renderConcepts();renderSelectedPreview();el.generationStatus.textContent=`${state.concepts.length} gespeicherte Richtungen geladen.`}
    bindEvents();renderAiConnections();renderAiReviewCard();goStep(state.currentStep,true);updateGuide();updateAccountUi();
    initCloudIntegration();
    setInterval(saveState,2500);
  }

  document.addEventListener("DOMContentLoaded",init);
})();


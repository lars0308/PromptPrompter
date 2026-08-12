import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const text=p=>readFile(path.join(root,p),'utf8');
test('all shipped JavaScript parses',async()=>{const files=[];for(const dir of ['.','api','server'])for(const name of await readdir(path.join(root,dir)))if(name.endsWith('.js'))files.push(path.join(root,dir,name));for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'pipe'})});
test('Hobby deployment stays within 12 API functions',async()=>{const files=(await readdir(path.join(root,'api'))).filter(x=>x.endsWith('.js'));assert.ok(files.length<=12,`found ${files.length} API functions`)});
test('single generation API routes all heavy features',async()=>{const src=await text('api/generate.js');for(const action of ['preview-image','sandbox-build','free-prompt'])assert.match(src,new RegExp(action));assert.match(src,/freePrompt\(req,res\)/)});
test('system AI falls through provider billing and auth failures',async()=>{const src=await text('api/generate.js');assert.match(src,/valid credit card/);assert.match(src,/add-credit-card/);assert.match(src,/\[401,402,403\]/);assert.match(src,/runSystemProfiles/)});
test('system AI supports dedicated free prompt task',async()=>{const src=await text('server/system-ai-profiles.js');assert.match(src,/freeprompt/);assert.match(src,/free-prompt/)});
test('new website project mode is selected once and switcher stays hidden',async()=>{const src=await text('project-start-ui.js');assert.match(src,/#modeSwitch\{display:none!important\}/);assert.match(src,/PENDING_BRIEF_KEY/);assert.match(src,/SIMPLE_START_KEY/);assert.match(src,/PromptAiHomeEntry\.openWebsite/);for(const mode of ['guided','auto','expert'])assert.match(src,new RegExp(`data-project-mode=\\"${mode}\\"`))});
test('workflow separates revision and built project tools',async()=>{const src=await text('workflow-cleanup.js');assert.match(src,/#stepPrompt>#revisionStudio\{display:none!important\}/);assert.match(src,/workspacePreviewBtn/);assert.match(src,/Dein Master-Prompt entsteht/)});
test('access boot loads final polish after all common UI layers',async()=>{const src=await text('admin-console.js'),fast=src.indexOf('cloud-fast-bundle.js'),stability=src.indexOf('stability-ui.js'),subscription=src.indexOf('subscription-ui.js'),ux=src.indexOf('ux-stability-fix.js'),final=src.indexOf('ui-polish-final.js'),touch=src.indexOf('ui-final-touch.js');assert.ok(fast>=0&&fast<stability);assert.ok(subscription>=0&&subscription<ux&&ux<final&&final<touch);assert.doesNotMatch(src,/owner-access\.js/);for(const file of ['home-entry-ui.js','streamlined-project-flow.js','guided-clean-ui.js','unified-ui-v1.js','trial-fix-ui.js','subscription-ui.js','ux-stability-fix.js','ui-polish-final.js','ui-final-touch.js'])assert.match(src,new RegExp(file.replace('.','\\.')))});
test('home starts with website and free prompt, while Free locks secondary tools and skips internal dev-phase jargon',async()=>{const src=await text('home-entry-ui.js');assert.match(src,/Internetseite erstellen/);assert.match(src,/Freier Prompt/);assert.match(src,/Alles andere: Text, Bild, Video, Musik, PowerPoint, Code und mehr/);for(const id of ['workspaceRevisionBtn','workspacePreviewBtn','workspaceLastProjectBtn','workspaceLibraryBtn'])assert.ok(src.includes(id));assert.match(src,/home-plan-locked/);assert.doesNotMatch(src,/Feature-Freeze/)});
test('simple entry comes before detailed website and free-prompt flows',async()=>{const src=await text('home-entry-ui.js');assert.match(src,/Beschreib deine Internetseite/);assert.match(src,/Was möchtest du mit KI machen/);assert.match(src,/startFromBrief/);assert.match(src,/freePromptDescription/)});
test('mobile UX fix removes duplicate intake and keeps feedback before preview',async()=>{const src=await text('ux-stability-fix.js');assert.match(src,/text\.length>=20/);assert.match(src,/SIMPLE_START_KEY/);assert.match(src,/skipDuplicateDescription/);assert.match(src,/FLOW_ORDER=\['beschreibung','referenzen','rueckmeldung','vorschau'/);assert.match(src,/Weiter zur Vorschau/)});
test('the references-step next-button label has exactly one owner (transition-polish CSS), not a JS text race',async()=>{const ux=await text('ux-stability-fix.js'),polish=await text('transition-polish.js');assert.doesNotMatch(ux,/prompt-review-transition/);assert.doesNotMatch(ux,/flowTransitionCompact/);assert.match(polish,/#stepReferences \.next-btn:before/);assert.match(polish,/content:'Rückmeldung prüfen'/)});
test('mobile menu is structured and dark mode only gets a quick top button',async()=>{const src=await text('ux-stability-fix.js');for(const token of ['menuLibrariesBtn','Projekte','Einstellungen','Abmelden','menuThemeQuick'])assert.ok(src.includes(token),token);assert.match(src,/#themeToggleBtn\{display:none!important\}/);assert.match(src,/topbar-menu #resetBtn\{display:none!important\}/);assert.doesNotMatch(src,/setText\(upgrade,'Upgraden'\)/);assert.doesNotMatch(src,/setText\(profile,window\.SiteBriefCloud/,'account button Anmelden/Profil text is owned solely by app.js updateAccountUi() to avoid two scripts racing on the same label')});
test('upgrade CTA names the next tier in blue and the menu entry keeps its own dynamic label',async()=>{const app=await text('app.js'),fix=await text('ux-stability-fix.js');assert.match(app,/Upgrade auf <span class="upgrade-target">\$\{nextTier\}<\/span>/);assert.match(app,/state\.plan==='pro'\?'Ultimate':'Pro'/);assert.match(app,/el\.upgradeMenuBtn\.hidden=state\.plan==='ultimate'\|\|state\.isAdmin/);assert.match(fix,/\.upgrade-target\{color:var\(--ui-blue,var\(--accent,#1689c7\)\)!important\}/)});
test('app.js re-syncs plan/admin UI whenever another script resolves access, instead of only trusting its own bundle load',async()=>{const app=await text('app.js');assert.match(app,/addEventListener\('promptai:access',event=>\{const access=event\.detail\|\|window\.PromptAiAccess;if\(!access\)return;/);assert.match(app,/state\.isAdmin=Boolean\(access\.isAdmin\)\|\|isOwnerAccount\(\);/);assert.match(app,/applyPlanUi\(\);updateAccountUi\(\);\}\);/)});
test('final UI polish keeps menus at top, broad surfaces and smooth fades',async()=>{const src=await text('ui-polish-final.js');for(const token of ['top:86px!important','bottom:auto!important','--prompt-content:1240px','promptMenuIn','promptSurfaceIn','promptContentIn','backdrop-filter:blur(8px)','libraryDialog','settingsDialog','accountDialog','adminDialog'])assert.ok(src.includes(token),token);assert.match(src,/prefers-reduced-motion:reduce/);assert.match(src,/width:100%!important;max-width:none!important/)});
test('final menu shield hides the page behind the open top menu',async()=>{const src=await text('ui-final-touch.js');for(const token of ['prompt-menu-shield','promptFinalMenuBackdrop','backdrop-filter:blur(14px)','2147483001','MutationObserver'])assert.ok(src.includes(token),token)});
test('guided feedback hides technical provider failures and the intro/background hint text',async()=>{const src=await text('ux-stability-fix.js');assert.match(src,/#clarificationWarnings\{display:none!important\}/);assert.match(src,/AI Gateway\|credit card\|vercel\\\.com/);assert.match(src,/lokale Prüfung/);assert.match(src,/clarification-intro,\.clarification-background-note\{display:none!important\}/);assert.doesNotMatch(src,/Bevor die Vorschau entsteht/);assert.doesNotMatch(src,/Datenschutz, Impressum, Barrierefreiheit, Sicherheit und Performance/)});
test('fresh guided preview defaults to stable HTML but manual choice remains possible',async()=>{const src=await text('ux-stability-fix.js');assert.match(src,/FRESH_WEBSITE_KEY/);assert.match(src,/PREVIEW_MANUAL_KEY/);assert.match(src,/format\.value='html'/);assert.match(src,/isTrusted/)});
test('master prompt transition is a short intentional handoff',async()=>{
  const src=await text('workflow-cleanup.js');
  assert.match(src,/Dein Master-Prompt entsteht/);
  assert.match(src,/individuellen Auftrag/);
  assert.match(src,/const MASTER_MAX_WAIT=8000;/,'the overlay must always be released after a bounded wait');
  assert.match(src,/Date\.now\(\)-start>=MASTER_MAX_WAIT/,'the wait cap must actually be checked in the poll');
  assert.doesNotMatch(src,/elapsed<3200/,'a finished master prompt must never be hidden behind an artificial minimum delay');
  assert.doesNotMatch(src,/elapsed<30000/,'a failed build must not leave the user on a spinner for 30s');
});
test('the step-8 overlay cannot re-enter itself through the class mutation it makes',async()=>{
  // revealMaster() toggles `master-generating` on #stepPrompt, which is the same element whose
  // class attribute the observer watches. Reacting to every class change made the observer feed
  // itself and hard-locked the tab when the Master-Prompt button was pressed.
  const src=await text('workflow-cleanup.js');
  assert.match(src,/masterStepActive=step\.classList\.contains\('active'\)/);
  assert.match(src,/if\(active===masterStepActive\)return;/,'the observer must ignore class changes that do not toggle step 8 itself');
  assert.doesNotMatch(src,/new MutationObserver\(\(\)=>\{if\(step\.classList\.contains\('active'\)\)revealMaster\(\)\}\)/);
});
test('the review/preview loader cannot be starved by its own animation frames',async()=>{
  // The loader writes an inline style on its progress bar every frame. Those writes reached the
  // body MutationObserver, which re-armed the sync() debounce forever, so the overlay stayed on
  // screen after the workflow had already moved on.
  const src=await text('transition-polish.js');
  assert.match(src,/const MAX_SETTLE_MS=400;/,'the debounce needs a hard ceiling');
  assert.match(src,/settleDeadline=now\+MAX_SETTLE_MS/);
  assert.match(src,/const fromLoader=node=>/,'loader-internal mutations must be filtered out');
  assert.match(src,/records\.some\(record=>!fromLoader\(record\.target\)\)/);
  assert.doesNotMatch(src,/function schedule\(delay=STEP_STABLE_MS\)\{clearTimeout\(settleTimer\);settleTimer=setTimeout\(sync,delay\)\}/);
});
test('the plans dialog always offers a way out and never opens on top of itself',async()=>{
  // plansDialog doubles as the upsell for every locked feature, so an un-dismissable variant
  // reads as a frozen app. It must keep a visible close button and accept Escape/backdrop.
  const css=await text('styles.css'),app=await text('app.js');
  assert.doesNotMatch(css,/\.plans-dialog\.plans-gate-mode \.close-dialog/,'the close button must stay visible in gate mode');
  assert.match(css,/\.plans-dialog \.close-dialog\{display:grid/);
  assert.doesNotMatch(app,/plansDialog\.addEventListener\("cancel"/,'Escape must not be swallowed');
  assert.match(app,/el\.plansDialog\.showModal=\(\)=>\{if\(el\.plansDialog\.open\)return;/,'showModal() throws when the dialog is already open');
  assert.match(app,/el\.plansDialog\.addEventListener\("click",e=>\{if\(e\.target===el\.plansDialog\)el\.plansDialog\.close\(\)\}\)/);
});
test('the three tiers are shown side by side and fully readable without expanding anything',async()=>{
  const html=await text('index.html'),css=await text('styles.css'),app=await text('app.js');
  assert.doesNotMatch(html,/<details class="plan-card"/,'plan cards must not be collapsed accordions anymore');
  assert.doesNotMatch(html,/<summary class="plan-card-summary"/);
  for(const plan of ['free','pro','ultimate'])assert.match(html,new RegExp(`<article class="plan-card[^"]*" data-plan-card="${plan}">`),plan);
  assert.match(html,/<p class="plan-card-includes">Alles aus <b>Kostenlos<\/b>, plus:<\/p>/,'Pro must build on the free tier');
  assert.match(html,/<p class="plan-card-includes">Alles aus <b>Pro<\/b>, plus:<\/p>/,'Ultimate must build on Pro');
  assert.match(html,/class="solid-btn plan-card-buy" id="startProCheckoutBtn">Jetzt kaufen</);
  assert.match(html,/class="outline-btn plan-card-buy" id="startUltimateCheckoutBtn">Jetzt kaufen</);
  assert.match(css,/\.plan-card-buy\{margin-top:auto/,'the buy button sits at the bottom of every card');
  assert.match(css,/\.plans-dialog \.plans-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'three columns on desktop');
  assert.match(css,/\.plan-card-summary>strong\{display:block;max-width:none/,'the narrow-screen price cap must be reset for the stacked header');
  assert.doesNotMatch(app,/addEventListener\('toggle',\(\)=>\{if\(!card\.open\)return;/,'the accordion handler has no cards to collapse anymore');
});
test('nothing floats over the step buttons and the guided references step stays a single decision',async()=>{
  // The free upsell was position:fixed above the bottom edge and landed exactly on the step's own
  // next button, so free users on small screens had no visible way to continue.
  const home=await text('home-entry-ui.js'),guided=await text('guided-clean-ui.js');
  assert.match(home,/function upgradeStrip\(\)\{\$\('#freeWorkflowUpgrade'\)\?\.remove\(\)\}/);
  assert.doesNotMatch(home,/workflow\.appendChild\(strip\)/,'no fixed upsell bar over the workflow');
  for(const sel of ['\\.reference-note-block','\\.no-references-note','\\.reference-lead'])
    assert.match(guided,new RegExp(`#stepReferences ${sel}`),sel);
  assert.match(guided,/#stepReferences \.reference-lead\{display:none!important\}/);
  assert.match(guided,/uploads&&uploads\.offsetParent!==null\?c\[2\]:'Optional: Link zu einer Website oder einem Google-Eintrag hinzufügen\.'/,'the lead must not offer uploads on plans that hide them');
});
test('the menu names the signed-in account and only offers an upgrade when there is one',async()=>{
  const app=await text('app.js'),css=await text('styles.css');
  assert.match(app,/const signedInAs=\[\(state\.userProfile\.displayName\|\|''\)\.trim\(\),state\.cloud\.user\.email\|\|''\]\.filter\(Boolean\)\.join\(' · '\)/);
  assert.match(app,/angemeldet als \$\{escapeHtml\(signedInAs\)\}/);
  assert.match(app,/el\.upgradeMenuBtn\.hidden=state\.plan==='ultimate'\|\|state\.isAdmin/,'ultimate has nothing to upgrade to, admins are not billed');
  assert.match(css,/\.topbar-menu #accountBtn \.account-btn-meta\{display:block/,'the second line only renders inside the dropdown');
  assert.match(css,/#upgradeBtn,#upgradeMenuBtn\{gap:\.35em\}/,'flex collapses the space before the tier name');
});
test('the reload the intake dialog triggers stays covered instead of flashing an empty app',async()=>{
  // Starting a project reloads the page; mode-handoff-fix.js owns the cover for that reload.
  // transition-polish.js used to hide it in guided/auto (the default for free accounts), and
  // promptai-loading-v2.js blanks the description step meanwhile, so the reload showed an empty
  // screen until the references step appeared.
  const polish=await text('transition-polish.js'),handoff=await text('mode-handoff-fix.js'),v2=await text('promptai-loading-v2.js');
  assert.doesNotMatch(polish,/#promptModeHandoff\{display:none!important\}|#promptModeHandoff,/,'the reload cover must not be suppressed');
  assert.match(polish,/#promptAiThinkingStage\{display:none!important\}/,'the in-page step overlays stay suppressed');
  assert.match(handoff,/box\.id='promptModeHandoff'/);
  assert.match(v2,/prompt-skip-intake-brief #workflowApp #stepProject\.active\{visibility:hidden!important/,'the blanked step is why a cover is required');
});
test('legal texts cover uploaded references and registration names what is agreed to',async()=>{
  const legal=await text('legal-pages.js');
  assert.match(legal,/Verlinke oder lade nur Inhalte hoch, an denen du die nötigen Rechte hast\./,'the references notice lives in the privacy policy now');
  assert.match(legal,/const TERMS_HTML=/);
  assert.match(legal,/kind==='terms'\)\{title\.textContent='Nutzungsbedingungen'/);
  assert.match(legal,/function ensureAuthConsent\(\)/);
  assert.match(legal,/Mit „Neues Konto“ stimmst du den <button type="button" class="link-btn" id="authTermsLink">Nutzungsbedingungen<\/button> zu/);
  assert.match(legal,/id='menuTermsBtn'/,'the terms page must be reachable outside the sign-up form too');
});
test('hiding the topbar upgrade button on mobile does not hit every upgrade button',async()=>{
  const src=await text('unified-ui-v1.js');
  assert.match(src,/body\.prompt-unified-ui \.topbar \.upgrade-btn\{display:none!important\}/);
  assert.doesNotMatch(src,/strong\{font-size:17px!important\}\.upgrade-btn\{display:none!important\}/,'the unscoped rule also hid the login card CTA');
});
test('the home page puts the three secondary tools in one row and only sells to free accounts',async()=>{
  const home=await text('home-entry-ui.js');
  assert.match(home,/#welcomePage \.welcome-quick-actions\{display:grid!important;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/,'an ID selector is required - promptai-experience-v1 forces 1fr with body.prompt-unified-ui');
  assert.match(home,/#workspacePreviewBtn,\.welcome-quick-actions>#workspaceLastProjectBtn,\.welcome-quick-actions>#workspaceLibraryBtn\{grid-column:span 2\}/);
  assert.match(home,/const plans=\$\('#showPlansBtn'\);if\(plans\)plans\.hidden=!free;/,'paid plans and admins have nothing to subscribe to here');
  assert.doesNotMatch(home,/free-workflow-upgrade/,'the removed fixed upsell bar leaves no styles behind');
});
test('the entry gate fills the page and its plans card carries no arrow button',async()=>{
  const gate=await text('entry-gate-ui.js');
  assert.doesNotMatch(gate,/gate-plans-arrow/,'the blue circle with the arrow is gone');
  assert.match(gate,/\.account-body\{display:flex;flex-direction:column;min-height:100dvh/);
  assert.match(gate,/#gateActions\{display:grid;gap:18px;max-width:420px;margin-top:auto;margin-bottom:auto/,'leftover height is split above and below the actions');
  assert.match(gate,/#gateLegalRow\{margin-top:auto/,'the legal row sits on the bottom edge');
});
test('admin quota tiers are collapsed accordions and accounts can be promoted to admin',async()=>{
  const html=await text('index.html'),css=await text('styles.css'),core=await text('admin-console-core.js'),api=await text('api/admin-action.js'),overview=await text('api/admin-overview.js');
  for(const tier of ['Kostenlos','Pro','Ultimate'])assert.match(html,new RegExp(`<details class="admin-quota-col"><summary><strong>${tier}</strong>`),tier);
  assert.doesNotMatch(html,/<details class="admin-quota-col"[^>]*\sopen/,'the tiers start collapsed');
  assert.match(css,/\.admin-quota-grid\{display:grid;grid-template-columns:1fr/,'stacked, not three across');
  assert.match(core,/data-admin-action="\$\{user\.isAdmin\?'revoke-admin':'make-admin'\}"/);
  assert.match(core,/action:'set-admin',userId,admin:true/);
  assert.match(overview,/isAdmin:adminIds\.has\(user\.id\)/,'the list needs to know who already is an admin');
  assert.match(api,/if\(action==='set-admin'\)\{/);
  assert.match(api,/if\(!makeAdmin&&email===ADMIN_EMAIL\)return res\.status\(400\)/,'the owner account can never be demoted');
});
test('admin rights are granted by the admins table, not by a single hard-coded address',async()=>{
  // Promoting an account only means something if the server stops requiring one fixed e-mail.
  // sitebrief_admins is service-role-write-only with an own-row select policy, and every write
  // goes through requireAdmin, so the table is a safe source of truth.
  const admin=await text('server/admin.js'),ent=await text('server/entitlements.js'),sql=await text('supabase/migrations/20260809_add_plans_and_admins.sql');
  assert.match(sql,/revoke insert, update, delete on public\.sitebrief_subscriptions, public\.sitebrief_admins from authenticated;/);
  assert.match(sql,/create policy "admins read own" on public\.sitebrief_admins for select to authenticated\s*\nusing \(\(select auth\.uid\(\)\) = user_id\);/);
  assert.match(admin,/if\(String\(user\.email\|\|''\)\.trim\(\)\.toLowerCase\(\)===ADMIN_EMAIL\)return user;/,'the owner stays admin so the console cannot lock itself out');
  assert.match(ent,/isAdmin=Boolean\(id\)&&id===String\(admin\.user_id\)/);
  assert.doesNotMatch(ent,/ADMIN_EMAIL/,'entitlements no longer gate on one address');
});
test('the top menu cannot republish entries the app has hidden',async()=>{
  // The hidden attribute only carries the user-agent display:none, so an unconditional
  // display:...!important on menu children wins over it. That put Verwaltung (admin only),
  // Projekte, Abonnement, App installieren and Abmelden in front of signed-out visitors.
  const src=await text('unified-ui-v1.js');
  assert.match(src,/\.topbar-menu>\[hidden\]\{display:none!important\}/,'hidden menu entries need an explicit guard');
  assert.match(src,/\.topbar-menu>button:not\(\[hidden\]\)\{display:flex!important/);
  assert.doesNotMatch(src,/\.topbar-menu>button\{display:flex!important/,'the unguarded rule overrode the hidden attribute');
});
test('the login page opens the tier comparison and gets the visitor back afterwards',async()=>{
  const gate=await text('entry-gate-ui.js'),fix=await text('ui-regression-fixes.js');
  assert.match(gate,/class="gate-plans-copy"/,'all copy shares one grid cell so the arrow cannot land between the lines');
  assert.match(gate,/class="gate-plans-tiers"/);
  assert.match(gate,/function openPlansFromGate\(\)/);
  assert.match(gate,/plans\.addEventListener\('close',\(\)=>\{const dialog=\$\('#accountDialog'\);if\(dialog&&!dialog\.open\)\{try\{dialog\.showModal\(\)\}catch\{\}\}\},\{once:true\}\)/,'closing the plans dialog must return to the login page');
  assert.doesNotMatch(gate,/\.gate-plans-pick:after\{content:"→"/,'the arrow is its own element now, not a grid-row-spanning pseudo element');
  assert.doesNotMatch(fix,/\$\('#accountDialog'\)\?\.close\(\);setTimeout\(\(\)=>\$\('#plansDialog'\)\?\.showModal\(\)/,'the login page stays open underneath instead of being closed');
});
test('reaching the modules step never interrupts a free user with a modal',async()=>{
  // goStep(4) and the automatic mode routing both call recommendModules(), so opening the plans
  // dialog from there trapped every free user mid-workflow behind a dialog they could not close.
  const src=await text('app.js');
  assert.match(src,/function recommendModules\(apply=false\)\{[\s\S]{0,400}?if\(!planRules\(\)\.modules\)\{renderModuleSelection\(\);return \[\]\}/);
  assert.doesNotMatch(src,/function recommendModules\(apply=false\)\{\s*if\(!planRules\(\)\.modules\)\{el\.plansDialog\?\.showModal\(\);return \[\]\}/);
  assert.match(src,/renderModuleSelection[\s\S]{0,600}?data-upgrade-plans/,'the lock stays visible inline instead');
});
test('website master prompt rebuilds from project decisions and professional role',async()=>{const src=await text('app.js');for(const token of ['Senior-Webdesigner und Frontend-Entwickler','AUSGEWÄHLTE DESIGNRICHTUNG','FEINSCHLIFF NACH DER VORSCHAU','AKTIVE PROMPT-MODULE','AKTIVE AGENT-SKILLS','DEFINITION OF DONE'])assert.ok(src.includes(token),token);assert.match(src,/if\(step===8\)\{try\{updateMasterPrompt\(\);renderCompletionSummary\(\)\}catch/)});
test('free prompt has second settings stage with editable description and no leftover legacy generation stage',async()=>{const src=await text('ui-polish-final.js');for(const token of ['EINSTELLUNGEN','free-prompt-brief-card','free-description-collapsed','dataset.editing'])assert.ok(src.includes(token),token);assert.doesNotMatch(src,/tier-locked/);assert.doesNotMatch(src,/free-prompt-generation-stage/)});
test('free prompt uses category master rules and professionally rewrites raw user input',async()=>{const src=await text('server/free-prompt-v2.js');for(const token of ['Musikproduzent','Regisseur','Senior-Webdesigner','Präsentationsdesigner','Photo-Retoucher','Senior-Softwareentwickler','Automation-Engineer','3D-Designer','roleFor','Lokaler Master-Prompt-Fallback','UNIVERSAL_MASTER_RULES','CATEGORY_MASTER_RULES','PROFESSIONALISIERUNG','ANTI-KI-MUSTER','Datenschutz'])assert.ok(src.includes(token),token);assert.match(src,/CATEGORY_MASTER_RULES\[input\.category\]/);assert.match(src,/function architectPrompt\(input,\{advanced=false\}=\{\}\)/);assert.match(src,/prompt:localFallback\(input,\{advanced\}\),provider:'local'/)});
test('final mobile experience keeps user identity and touch focus cleanup without a redundant in-dialog appbar',async()=>{const src=await text('promptai-experience-v2.js'),boot=await text('admin-console.js');for(const token of ['prompt-keyboard-focus','displayName','Wähle deinen Arbeitsbereich','Professionell aufbereiteter Free-Prompt'])assert.ok(src.includes(token),token);assert.doesNotMatch(src,/prompt-dialog-appbar/);assert.doesNotMatch(src,/prompt-dialog-menu-toggle/);assert.match(boot,/promptai-experience-v2\.js/)});
test('Pro upgrade copy explains proration and next normal Ultimate renewal',async()=>{const src=await text('ux-stability-fix.js'),checkout=await text('api/checkout.js');assert.match(src,/anteilige Differenz/);assert.match(src,/nächsten regulären Abrechnung/);assert.match(src,/Auf Ultimate upgraden/);assert.match(checkout,/proration_behavior/);assert.match(checkout,/create_prorations/)});
test('free prompt UI offers broad categories, presets and Pro enrichment',async()=>{const src=await text('free-prompt-ui.js'),presets=await text('free-prompt-presets.js');for(const word of ['Musik / Song','Video / Film','Präsentation / PowerPoint','Code / App','Eigener Typ'])assert.ok(src.includes(word));assert.match(src,/Free bleibt bewusst einfach/);assert.match(presets,/Schnellstart/)});
test('app boot intro covers background loading without legacy media',async()=>{const src=await text('admin-console.js'),html=await text('index.html'),theme=await text('theme-init.js'),sw=await text('sw.js');assert.match(src,/promptAppBoot/);assert.match(html,/sitebrief-logo\.svg/);assert.match(html,/id="promptAppBoot"/);assert.match(src,/releaseBootIntro/);assert.match(src,/preserveInternalRouteReloads/);assert.match(theme,/prompt-app-booting/);assert.doesNotMatch(src,/intro-flow-fix\.js|welcomeIntroDialog|ONBOARDING_KEY/);assert.doesNotMatch(html,/welcomeIntroDialog|welcome-intro-video|intro\.(?:webm|mp4)/);assert.doesNotMatch(sw,/intro-flow-fix\.js/)});
test('boot shield is baked into the static shell so it paints before any deferred script runs',async()=>{const html=await text('index.html'),theme=await text('theme-init.js');const bootIndex=html.indexOf('id="promptAppBoot"'),firstDeferred=html.indexOf('<script src="./entry-gate-ui.js');assert.ok(bootIndex>=0&&bootIndex<firstDeferred,'boot markup must precede deferred scripts');assert.match(html,/html\.prompt-app-booting body>\*:not\(#promptAppBoot\)\{visibility:hidden!important\}/);assert.match(theme,/sitebrief-v6-continue-workflow/);assert.match(theme,/prompt-ai-mode-handoff-v1/)});
test('unified UI covers pages dialogs menus settings account admin and expert mode',async()=>{const src=await text('unified-ui-v1.js');for(const token of ['topbar-menu','welcome-page','dialog-frame','settings-section','account-body','library-tabs','admin-tabs','freePromptDialog','data-prompt-mode="expert"'])assert.ok(src.includes(token),token);assert.match(src,/prompt-unified-ui/);assert.match(src,/MutationObserver/)});
test('service worker caches final v1.0 polish shell without intro media',async()=>{const src=await text('sw.js');assert.match(src,/prompt-ai-shell-v\d+/);for(const file of ['free-prompt-ui.js','home-entry-ui.js','streamlined-project-flow.js','guided-clean-ui.js','unified-ui-v1.js','trial-fix-ui.js','subscription-ui.js','ux-stability-fix.js','ui-polish-final.js','ui-final-touch.js','cloud-fast-bundle.js','project-history.js','github-sandbox.js','promptai-experience-v2.js'])assert.ok(src.includes(file));assert.doesNotMatch(src,/intro\.(?:mp4|webm)/)});
test('sandbox supports uploaded ZIP and GitHub repository without another API route',async()=>{const src=await text('server/sandbox-build.js');assert.match(src,/githubRepo/);assert.match(src,/storagePath/);assert.match(src,/parseRepo/)});
test('central image routing supports gateway, OpenAI, Gemini and Cloudflare',async()=>{const src=await text('server/preview-image.js');for(const p of ['gateway','openai','gemini','cloudflare'])assert.ok(src.includes(p));assert.match(src,/images\/generations/)});
test('access gate waits for resolved session instead of flashing Free',async()=>{const src=await text('stability-ui.js');assert.match(src,/prompt-access-pending/);assert.match(src,/8000/);assert.match(src,/isOwner\?'ultimate':paid/)});
test('invalid credentials cannot create a local app session',async()=>{const cloud=await text('cloud.js'),app=await text('app.js');assert.match(cloud,/auth\.signInWithPassword\(\{ email, password \}\)/);assert.match(cloud,/if \(error\) throw error/);assert.match(app,/catch\(err\)\{[^}]*el\.authMessage\.textContent=err\?\.message\|\|"Anmeldung fehlgeschlagen\."/)});
test('Stripe checkout returns to the app and keeps add-on gated to Pro',async()=>{const src=await text('api/checkout.js');assert.match(src,/checkout=success/);assert.match(src,/plan!=='pro'/);assert.match(src,/new URL\(normalized\)\.origin/)});
test('a step-8 master-prompt build failure surfaces an error instead of leaving the UI silently stuck',async()=>{
  const src=await text('app.js');
  assert.match(src,/if\(step===8\)\{try\{updateMasterPrompt\(\);renderCompletionSummary\(\)\}catch\(err\)\{const message=err\?\.message\|\|"Der Master-Prompt konnte nicht zusammengestellt werden\. Bitte versuch es erneut\.";el\.projectValidation\.textContent=message;if\(el\.masterPrompt\)el\.masterPrompt\.value=/);
  assert.match(src,/goStep\(next\);\s*\}catch\(err\)\{el\.projectValidation\.textContent=err\?\.message\|\|"Es gab ein Problem\. Bitte versuch es erneut\.";\}/);
});
test('submitting the clarification dialog with only optional questions left blank does not reopen it forever',async()=>{
  const src=await text('app.js');
  assert.doesNotMatch(src,/hasAnyUnresolved=\(state\.projectReview\.questions\|\|\[\]\)\.length && !state\.reviewDeferred && !state\.clarifications\.some\(a=>a\.answer\?\.trim\(\)\)/,'the old check demanded at least one non-blank answer text across ALL clarifications, even when every question was optional and the user legitimately submitted the dialog blank - this reopened the same dialog on every "Weiter" click forever');
  assert.match(src,/hasAnyUnresolved=\(state\.projectReview\.questions\|\|\[\]\)\.length && !state\.reviewDeferred && !\(state\.projectReview\.questions\|\|\[\]\)\.every\(q=>state\.clarifications\.some\(a=>a\.question===q\.question\)\)/,'unresolved must mean "a question has no submitted clarification entry yet", not "no answer anywhere has text in it" - saveClarificationAnswers() always records one entry per rendered question, blank or not');
});
test('Pro trial does not leak into Ultimate and shows its exact lifecycle',async()=>{const checkout=await text('api/checkout.js'),webhook=await text('api/stripe-webhook.js'),ui=await text('trial-fix-ui.js');assert.match(checkout,/product==='pro'\?await currentOffer\(\):null/);assert.match(webhook,/customer\.subscription\.created/);assert.match(webhook,/o\.status==='trialing'&&o\.trial_end/);assert.match(ui,/Pro · Testphase/);assert.match(ui,/Noch \$\{remaining\}/);assert.match(ui,/if\(ultimate&&Number\(offer\.trial_days\)>0\)ultimate\.textContent='Jetzt kaufen'/,'a Pro trial must not relabel the Ultimate button as a trial');assert.match(ui,/gilt ausschließlich für Pro/)});
test('subscription management shows live Stripe billing details without a new function',async()=>{const checkout=await text('api/checkout.js'),ui=await text('subscription-ui.js');assert.match(checkout,/action==='subscription-info'/);assert.match(checkout,/invoices\/create_preview/);assert.match(checkout,/payment_method_update/);assert.match(checkout,/subscription_cancel/);assert.match(checkout,/subscription_update/);assert.match(checkout,/billing_portal\/configurations/);assert.match(checkout,/Prompt\.ai Kundenportal/);assert.match(checkout,/features\[subscription_update\]\[default_allowed_updates\]\[0\].*price/);for(const copy of ['Abo verwalten','Nächste Abbuchung','Zahlungsmethode','Abrechnungsverlauf','Auf Ultimate wechseln'])assert.ok(ui.includes(copy));assert.match(ui,/manageSubscriptionBtn/);assert.match(ui,/data-sub-portal="cancel"/)});
test('prompt history and learning controls remain user-owned',async()=>{const history=await text('project-history.js'),learning=await text('learning-controls.js');assert.match(history,/sitebrief_prompt_versions/);assert.match(history,/user_id/);assert.match(learning,/sitebrief_learning_examples/);assert.match(learning,/\.eq\('user_id',cloud\.user\.id\)/)});
test('package is frozen as Prompt.ai v1.0',async()=>{const pkg=JSON.parse(await text('package.json'));assert.equal(pkg.version,'1.0.0');const version=await text('VERSION.md');assert.match(version,/Feature Freeze/);assert.match(version,/Bugfix/)});
test('Impressum and Datenschutz stay reachable even on the pre-login guest gate, not only from the hamburger menu',async()=>{const src=await text('legal-pages.js');assert.match(src,/function ensureGateFooter\(\)\{/);assert.match(src,/const body=\$\('#accountDialog \.account-body'\);if\(!body\|\|\$\('#gateLegalRow'\)\)return;/);assert.match(src,/ensureGateFooter\(\);/);assert.match(src,/\.gate-legal-row\{/)});
test('own GitHub connection is a self-service Pro+ feature, independent of the paid own-API-keys add-on',async()=>{
  const app=await text('app.js'),html=await text('index.html'),css=await text('styles.css');
  assert.match(app,/const githubAvailable=cloudReady\(\)&&\(state\.plan!=="free"\|\|state\.isAdmin\);/);
  assert.match(app,/el\.githubConnectionGrid\.hidden=!githubAvailable;/);
  assert.doesNotMatch(html,/ULTIMATE · EXPORT[\s\S]{0,40}GitHub/,'GitHub must no longer be labeled as an Ultimate-only feature in the markup');
  assert.match(html,/PRO · EXPORT[\s\S]{0,40}GitHub/);
  assert.match(html,/id="githubConnectionGrid" hidden/);
  // admin-ai-ui.js forces `#settingsDialog .ai-connection-grid{display:grid!important}` which, being ID-scoped,
  // would otherwise always beat the plain [hidden] attribute on any element sharing that class (same specificity
  // trap fixed for .plan-overview earlier) - this override must stay in place so the gate actually hides it.
  assert.match(css,/#settingsDialog #githubConnectionGrid\[hidden\]\{display:none!important\}/);
});
test('generated concept preview images are never written into persisted project state',async()=>{
  const src=await text('app.js');
  // images.dataUrl and documents.pageImages are already stripped before persisting (they can be several MB of
  // base64 each); concepts.previewImage is the exact same kind of AI-generated base64 image data but was missing
  // the same treatment, so localStorage.setItem/JSON.stringify kept doing multi-MB work on every saveState() call
  // - including the 15s auto-save interval - which is consistent with reports of the app becoming unresponsive
  // after image concepts were generated, and staying unresponsive across a reload since the bloated blob is what
  // gets restored and re-saved again immediately.
  assert.match(src,/images:state\.images\.map\(\(\{dataUrl,previewUrl,\.\.\.rest\}\) => rest\),/);
  assert.match(src,/documents:state\.documents\.map\(\(\{pageImages,previewUrl,\.\.\.rest\}\)=>rest\),/);
  assert.match(src,/concepts:state\.concepts\.map\(\(\{previewImage,\.\.\.rest\}\)=>rest\),/);
});
test('the full-screen workflow loader cannot stay stuck forever regardless of cause',async()=>{
  const src=await text('transition-polish.js');
  assert.match(src,/const LOADER_TIMEOUT_MS=95000;/);
  assert.match(src,/function forceRecover\(\)\{/);
  assert.match(src,/if\(elapsed>LOADER_TIMEOUT_MS\)\{fillRaf=0;forceRecover\(\);return\}/);
});
test('AI preview images are framed as a flat UI screenshot, not a photo of a device on a desk, and must render the real brand/headline text',async()=>{
  const src=await text('server/preview-image.js');
  assert.match(src,/UI SCREENSHOT\./);
  assert.match(src,/Fill the entire 16:9 frame edge to edge with the webpage itself\./);
  assert.match(src,/Do not depict any monitor, laptop, phone, tablet, desk, room, hand, wall, browser window, browser chrome, url bar, camera angle, perspective/);
  assert.match(src,/Reminder: output only the flat webpage design itself, filling the full 16:9 frame — never a photo, mockup, or device of any kind\./);
  assert.doesNotMatch(src,/If text cannot be rendered perfectly, render no text\./,'this escape hatch let models skip real brand/headline text instead of attempting it');
  assert.match(src,/TYPOGRAPHY \(required\): render the brand name "\$\{brand\}" in the navigation or header \(unless the header instruction above says to omit it\), and render the headline "\$\{headline\}" as the large hero text/);
});
test('AI-generated concept copy is required to use real industry vocabulary from the project, not a generic tagline',async()=>{
  const src=await text('server/generate-core.js');
  assert.match(src,/a döner shop's headline should reference döner\/food, a landscaping business should reference gardens\/outdoor work/);
});
test('reference links and images are capped per plan tier (Free 1/0, Pro 3/3, Ultimate 5/5), independent of the paid own-API-keys add-on',async()=>{
  const src=await text('app.js');
  assert.match(src,/free:\{label:"Free",[^}]*maxRefUrls:1,maxRefImages:0\}/);
  assert.match(src,/pro:\{label:"Pro",[^}]*maxRefUrls:3,maxRefImages:3\}/);
  assert.match(src,/ultimate:\{label:"Ultimate",[^}]*maxRefUrls:5,maxRefImages:5\}/);
  assert.match(src,/if\(state\.urls\.length>=planRules\(\)\.maxRefUrls && !state\.isAdmin\)\{ el\.plansDialog\?\.showModal\(\); return; \}/);
  assert.match(src,/const imageLimit=planRules\(\)\.maxRefImages;/);
});
test('customer info (real facts) is a distinct section from style references, not a chip mixed into the style-aspect list',async()=>{
  const app=await text('app.js'),html=await text('index.html');
  assert.doesNotMatch(app,/const ASPECTS = \["Kundeninfo"/,'Kundeninfo must not be a togglable style aspect anymore - it has its own dedicated section');
  assert.match(app,/const ASPECTS = \["Layout","Farben","Typografie","Bildsprache","Hero","Struktur","Stimmung","Nur Inspiration"\];/);
  assert.doesNotMatch(html,/<section class="step-panel active" data-step-panel="1" id="stepProject">[\s\S]{0,60}<section class="client-context-card"/,'customer info must not live inside the References-adjacent style step 1 anymore');
  assert.match(html,/<section class="step-panel" data-step-panel="2" id="stepReferences">[\s\S]*<section class="client-context-card" id="clientContextCard"><div class="selection-head"><div><span>KUNDENINFORMATIONEN<\/span>/);
});
test('adding a reference link or file carries a visible liability notice',async()=>{
  const html=await text('index.html');
  assert.match(html,/Prompt\.ai übernimmt keine Haftung für Inhalte Dritter, die du hier hinterlegst — die Verantwortung dafür liegt bei dir\./);
});
test('Datenschutzerklärung names the real integrated subprocessors and covers third-party customer-website scraping, not just generic placeholders',async()=>{
  const src=await text('legal-pages.js');
  for(const processor of ['Vercel AI Gateway','OpenAI','Google (Gemini)','Cloudflare Workers AI','Supabase','Stripe'])assert.ok(src.includes(processor),processor);
  assert.match(src,/Kundeninformationen.*fremde Webseiten/);
  assert.match(src,/können auch personenbezogene Daten Dritter enthalten sein/);
});
test('a sixth "minimal" layout variant (full-bleed image, no nav/sections/footer) exists alongside a navStyle field for logo+hamburger-only headers',async()=>{
  const app=await text('app.js'),core=await text('server/generate-core.js');
  assert.match(app,/\{name:"Minimal Statement",variant:"minimal",[^}]*layout:"Vollflächiges Bild ohne Navigation, Kapitel oder Fußzeile — nur eine kleine Überschrift darauf"/);
  assert.match(app,/navStyle:"full",mirror:false,headline:String\(headline\)/,'localConcepts must default every generated concept to a normal nav and non-mirrored layout');
  assert.match(app,/const allowed=\["split","poster","ledger","stacked","editorial","minimal"\];/);
  assert.match(app,/navStyle:raw\?\.navStyle==="logo-hamburger"\?"logo-hamburger":"full",mirror:raw\?\.mirror===true,/);
  assert.match(core,/const VARIANTS = \["split","poster","ledger","stacked","editorial","minimal"\];/);
  assert.match(core,/navStyle:\{type:"string",enum:\["full","logo-hamburger"\]\}, mirror:\{type:"boolean"\}/);
});
test('createConceptScreen renders the minimal variant as a bare full-bleed image with only a small headline, and honors navStyle/mirror on the other variants',async()=>{
  const src=await text('app.js');
  assert.match(src,/if\(c\.layoutVariant==="minimal"\)\{\s*screen\.innerHTML=`<div class="screen-minimal"><div class="screen-photo screen-photo-full"><\/div><span class="screen-minimal-headline">\$\{escapeHtml\(c\.headline\)\}<\/span><\/div>`;/);
  assert.match(src,/const navHtml=c\.navStyle==="logo-hamburger"/);
  assert.match(src,/<i>≡<\/i>`/,'logo-hamburger navStyle must render a hamburger icon instead of the full menu item list');
  assert.match(src,/const mirrorClass=c\.mirror\?" mirror":"";/);
});
test('literal user layout instructions (e.g. logo+hamburger-only header, image-left/text-right, single image with small headline) override the fixed one-of-each-variant rotation',async()=>{
  const core=await text('server/generate-core.js'),img=await text('server/preview-image.js');
  assert.match(core,/LAYOUT INSTRUCTION PRIORITY: check the project's special wish and description for an explicit, literal layout or header instruction/);
  assert.match(core,/EVERY direction must honor it literally — pick the closest matching layoutVariant and set navStyle\/mirror to match instead of forcing artificial variety\./);
  assert.match(core,/If no explicit layout instruction is given, instead maximize structural variety/);
  assert.match(img,/function headerInstruction\(p=\{\},c=\{\}\)\{/);
  assert.match(img,/if\(c\.layoutVariant==='minimal'\)return'This design has NO navigation bar, NO header, NO footer and NO separate sections/);
  assert.match(img,/const nav=c\.navStyle==='logo-hamburger'\?'The header\/top bar contains ONLY a small logo or brand name/);
  assert.match(img,/Special wish \(if this literally describes the header, navigation or overall composition, treat it as the authoritative instruction and follow it exactly/);
  assert.match(img,/HEADER \/ STRUCTURE \(required, follow exactly\): \$\{header\}/);
});
test('CSS provides matching styles for the minimal variant, logo-hamburger nav and mirrored split/ledger layouts',async()=>{
  const css=await text('styles.css');
  assert.match(css,/\.concept-screen\.minimal \.screen-minimal\{position:absolute;inset:0\}/);
  assert.match(css,/\.screen-nav\.nav-logo-hamburger\{justify-content:flex-start\}/);
  assert.match(css,/\.concept-screen\.split\.mirror \.screen-body\{grid-template-columns:46% 54%\}\.concept-screen\.split\.mirror \.screen-photo\{order:-1\}/);
});
test('GitHub API can list a user\'s own repositories and publish into an existing one, not just create a brand-new repo, all still Ultimate-gated',async()=>{
  const src=await text('api/github-publish.js');
  assert.match(src,/if\(!entitlement\.isAdmin&&entitlement\.plan!=='ultimate'\)return res\.status\(403\)\.json\(\{error:'GitHub-Repository-Zugriff ist in Ultimate verfügbar\.'\}\);/);
  assert.match(src,/async function listRepos\(token\)\{const repos=await github\('\/user\/repos\?sort=updated&per_page=100&affiliation=owner,collaborator',token\);/);
  assert.match(src,/async function publishExisting\(token,targetRepoInput,branchInput,files\)\{/);
  assert.match(src,/if\(action==='list-repos'\)return res\.status\(200\)\.json\(\{repos:await listRepos\(token\)\}\);/);
  assert.match(src,/if\(action==='publish-existing'\)return res\.status\(200\)\.json\(await publishExisting\(token,req\.body\?\.targetRepo,req\.body\?\.branch,req\.body\?\.files\|\|\{\}\)\);/);
});
test('GitHub-repo sandbox pull requires Ultimate, while plain ZIP-upload sandbox builds stay Pro+',async()=>{
  const src=await text('server/sandbox-build.js');
  assert.match(src,/if\(githubRepo\)\{if\(!\(ent\.isAdmin\|\|ent\.plan==='ultimate'\)\)return res\.status\(403\)\.json\(\{error:'Der GitHub-Repository-Import in die Sandbox ist in Ultimate verfügbar\.'\}\)\}else if\(!\(ent\.isAdmin\|\|\['pro','ultimate'\]\.includes\(ent\.plan\)\)\)return res\.status\(403\)\.json\(\{error:'Der isolierte Quellcode-Build ist ab Pro verfügbar\.'\}\);/);
  const ui=await text('github-sandbox.js'),zipUi=await text('sandbox-preview.js');
  assert.match(ui,/function canBuild\(\)\{const a=access\(\);return a\.isAdmin\|\|a\.plan==='ultimate'\}/);
  assert.match(zipUi,/ab Pro verfügbar/,'the unrelated ZIP-upload sandbox feature must stay Pro+, untouched by the GitHub-only Ultimate change');
});
test('publishing to GitHub offers a picker of the user\'s existing repos (via the shared select-mode dialog) instead of only creating new ones',async()=>{
  const app=await text('app.js'),html=await text('index.html');
  assert.match(app,/async function fetchGithubRepos\(\)\{/);
  assert.match(app,/const choice=await customSelect\('Wohin soll veröffentlicht werden\?',\[\{value:'__new__',label:'Neues Repository anlegen'\},\.\.\.repos\.map/);
  assert.match(app,/const body=targetRepo\?\{action:'publish-existing',targetRepo,files\}:\{repoName,files\};/);
  assert.match(app,/const customSelect=\(message,selectOptions,selectValue='',options=\{\}\)=>showAppAction\(\{\.\.\.options,message,selectOptions,selectValue\}\);/);
  assert.match(html,/<select id="appActionSelect" hidden><\/select>/);
});
test('the GitHub sandbox card offers a picker populated from the user\'s own repos when connected',async()=>{
  const src=await text('github-sandbox.js');
  assert.match(src,/async function loadRepoPicker\(\)\{/);
  assert.match(src,/body:JSON\.stringify\(\{action:'list-repos'\}\)/);
  assert.match(src,/id="githubSandboxPicker" hidden/);
});
test('the entry gate opens immediately and no longer waits on cookie consent to appear',async()=>{
  const src=await text('app.js');
  assert.doesNotMatch(src,/Promise\.race\(\[consent,new Promise\(resolve=>setTimeout\(resolve,4000\)\)\]\)\.then\(showAccountGate\)/,'the account gate must not be delayed behind cookie-banner consent resolution');
  assert.match(src,/function maybeShowEntryGate\(\)\{[\s\S]{0,400}showAccountGate\(\);\s*\}/);
});
test('the cookie banner is a modal dialog that re-promotes itself above any later-opened dialog (e.g. the login gate) instead of being hidden behind it',async()=>{
  const app=await text('app.js'),legal=await text('legal-pages.js'),html=await text('index.html');
  assert.match(html,/<dialog class="cookie-banner" id="cookieBanner"/);
  assert.match(legal,/if\(!banner\.open\)banner\.showModal\(\);/);
  assert.match(app,/if\(this\.id!=="cookieBanner"\)\{const banner=document\.getElementById\("cookieBanner"\);if\(banner&&banner\.open\)\{banner\.close\(\);nativeShowModal\.call\(banner\)\}\}/,'every other dialog opening must re-promote the still-open cookie banner back to the top of the native dialog stack');
  assert.match(app,/if\(this\.id!=="appActionDialog"&&this\.id!=="cookieBanner"\)document\.querySelectorAll\("dialog\[open\]"\)\.forEach/,'the cookie banner must be exempted from the auto-close-other-dialogs behavior');
});
test('the cookie banner offers a real settings panel (essential-only by default) instead of just two opaque buttons',async()=>{
  const html=await text('index.html');
  assert.match(html,/id="cookieBannerSettingsBtn">Einstellungen/);
  assert.match(html,/Technisch notwendig<\/strong><small>Anmeldung, Sitzung, Sicherheit/);
  assert.match(html,/checked disabled/);
});
test('the login/entry gate has no leftover small hint texts (accountIntro paragraph, auth-form-heading small)',async()=>{
  const html=await text('index.html'),app=await text('app.js');
  assert.doesNotMatch(html,/id="accountIntro"/);
  assert.doesNotMatch(html,/Deine Projekte und Einstellungen werden direkt geladen\./);
  assert.doesNotMatch(app,/el\.accountIntro/);
});
test('the ".ai" suffix on the Prompt.ai wordmark is statically blue everywhere it ships in the HTML (topbar, boot screen, login gate), not only once a late-loading polish script runs',async()=>{
  const html=await text('index.html'),css=await text('styles.css');
  const spots=[/<strong data-brand-ai="1">Prompt<span class="brand-ai-suffix">\.ai<\/span><\/strong><small>AUS IDEEN WIRD EIN KLARES PROJEKT/,/<strong data-brand-ai="1">Prompt<span class="brand-ai-suffix">\.ai<\/span><\/strong><p>Dein Arbeitsbereich wird vorbereitet\./,/<strong data-brand-ai="1">Prompt<span class="brand-ai-suffix">\.ai<\/span><\/strong><span>Aus Ideen wird ein klares Projekt/];
  for(const pattern of spots)assert.match(html,pattern);
  assert.match(css,/\.auth-brand \.brand-ai-suffix\{color:var\(--accent\)\}/,'a plain .auth-brand span{color:muted} rule beats the single-class .brand-ai-suffix rule on specificity, so a targeted override is required');
});
test('a broad prompt-unified-ui dialog reset does not strip the cookie banner\'s padding with !important',async()=>{
  const src=await text('unified-ui-v1.js');
  assert.match(src,/dialog:not\(#previewLightbox\):not\(#welcomeIntroDialog\):not\(#cookieBanner\)\{border:0!important;background:transparent!important;color:var\(--ink\)!important;padding:0!important\}/);
});
test('a stuck review/preview loader recovers in place instead of firing a native alert() and forcibly navigating the user home',async()=>{
  const src=await text('transition-polish.js');
  assert.doesNotMatch(src,/window\.alert\(/,'a native browser alert() is jarring and was reported as kicking the user out of the workflow mid-loading');
  const body=src.match(/function forceRecover\(\)\{([\s\S]*?)\n  \}/)?.[1]||'';
  assert.ok(body,'forceRecover function body must be found');
  assert.doesNotMatch(body,/brandHome/,'forceRecover must not forcibly navigate the user away from the loader on a timeout');
  assert.doesNotMatch(body,/window\.alert/);
  assert.match(src,/const LOADER_TIMEOUT_MS=95000;/);
  assert.match(src,/setTitle\(box,'Das dauert länger als erwartet'\);/);
  assert.match(src,/\.prompt-loader-pulse\[hidden\]\{display:none\}/,'the pulse dots use a plain class rule elsewhere that would otherwise beat the UA [hidden] rule, the same CSS specificity trap fixed repeatedly this session');
});
test('loading-screen sentences stay on screen ~1.6s longer than before across every loader that cycles them',async()=>{
  for(const file of ['transition-polish.js','promptai-experience-v1.js','mode-handoff-fix.js']){
    const src=await text(file);
    assert.match(src,/const SENTENCE_MS=3000;/,`${file} must use the extended sentence duration`);
  }
});
test('the loader title/sentence text updates instantly and cleanly, with no stale per-character fill overlay that could desync from the text',async()=>{
  const transition=await text('transition-polish.js'),v1=await text('promptai-experience-v1.js');
  assert.match(transition,/function setTitle\(box,text\)\{const host=\$\('strong',box\);if\(!host\|\|host\.textContent===text\)return;host\.textContent=text\}/);
  assert.match(transition,/const apply=\(\)=>\{host\.textContent=text;host\.classList\.remove\('is-changing'\)\};/);
  assert.match(v1,/const apply=\(\)=>\{host\.textContent=text;host\.classList\.remove\('is-changing'\)\};/);
});
test('the "Prompt genauer einstellen" free-prompt settings step is consolidated into 3 broad fields instead of 9 narrow ones',async()=>{
  const src=await text('free-prompt-ui.js');
  for(const removed of ['freePromptGoal','freePromptAudience','freePromptMust','freePromptAvoid','freePromptLanguage','freePromptConstraints'])assert.doesNotMatch(src,new RegExp(`id="${removed}"`),`${removed} should be folded into a consolidated field`);
  assert.match(src,/<span>Ziel, Zielgruppe &amp; Kontext<\/span><textarea id="freePromptContext"/);
  assert.match(src,/<span>Stil, Muss enthalten &amp; Vermeiden<\/span><textarea id="freePromptStyle"/);
  assert.match(src,/<span>Ausgabeformat, Sprache &amp; Grenzen<\/span><textarea id="freePromptFormat"/);
  assert.match(src,/function payload\(\)\{return \{action:'free-prompt',category:\$\('#freePromptCategory'\)\.value,customCategory:\$\('#freePromptCustomCategory'\)\.value,targetTool:\$\('#freePromptTool'\)\.value,customTool:\$\('#freePromptCustomTool'\)\.value,description:\$\('#freePromptDescription'\)\.value,context:\$\('#freePromptContext'\)\?\.value\|\|'',style:\$\('#freePromptStyle'\)\?\.value\|\|'',outputFormat:\$\('#freePromptFormat'\)\?\.value\|\|''\}\}/);
});
test('opening the hamburger menu re-syncs plan UI from window.PromptAiAccess, so a stale Upgrade button can never survive a menu open even if a promptai:access event was missed',async()=>{
  const src=await text('app.js');
  assert.match(src,/const access=window\.PromptAiAccess;if\(access\)\{if\(access\.plan\)state\.plan=access\.plan;state\.isAdmin=Boolean\(access\.isAdmin\)\|\|isOwnerAccount\(\);if\(access\.ownApiKeys\)state\.ownApiKeys=true;\}applyPlanUi\(\);/);
});
test('the "Projekt wird vorbereitet" mode-handoff loader shows progress as a plain width-based bar (not a text-color clip-path fill, which rendered incompletely on letters with ascenders/descenders like g, t, f) that tracks real elapsed time and snaps to 100% the instant the real work finishes',async()=>{
  const src=await text('mode-handoff-fix.js');
  assert.doesNotMatch(src,/clip-path/,'the mode-handoff loader must not tint text via clip-path anymore - that technique clipped ascenders/descenders (g, t, f) incompletely');
  assert.match(src,/<strong>Projekt wird vorbereitet<\/strong>/);
  assert.match(src,/\.prompt-mode-handoff-bar i\{/);
  assert.match(src,/function titleProgress\(elapsed\)\{const tau=1500;return Math\.min\(\.94,\.94\*\(1-Math\.exp\(-elapsed\/tau\)\)\)\}/,'must track real elapsed time asymptotically, not a fixed guessed duration');
  assert.match(src,/function release\(box\)\{active=false;clearTimeout\(timer\);clearInterval\(sentenceTimer\);stopTitleFillLoop\(true\);/,'release (called once the real handoff work is done) must snap the title fill to 100% instead of leaving it mid-fill');
});
test('the review/preview loader and the free-prompt thinking loader no longer use the fragile getBoundingClientRect + multi-line polygon clip-path technique for their fill, and the review/preview loader uses a plain progress bar instead of a text-color overlay (which rendered incompletely on ascenders/descenders like g, t, f) that cannot desync from the underlying text box',async()=>{
  for(const file of ['transition-polish.js','promptai-experience-v1.js']){
    const src=await text(file);
    assert.doesNotMatch(src,/getClientRects/,`${file} must not measure per-line text rects for the fill anymore - this was reported live as rendering garbled/offset blue text even after an earlier defensive fix`);
    assert.doesNotMatch(src,/getBoundingClientRect/,`${file} must not sync overlay position/size via getBoundingClientRect anymore`);
    assert.doesNotMatch(src,/polygon\(/,`${file} must not build a reading-order polygon clip-path anymore`);
  }
  const transition=await text('transition-polish.js');
  assert.doesNotMatch(transition,/clip-path/,'the review/preview loader must not tint text via clip-path anymore - that technique clipped ascenders/descenders (g, t, f) incompletely');
  assert.match(transition,/function applyFill\(progress\)\{\s*const box=\$\('#promptWorkflowLoader'\);if\(!box\)return;\s*const bar=\$\('\.prompt-loader-bar i',box\);if\(!bar\)return;\s*const next=`\$\{\(progress\*100\)\.toFixed\(1\)\}%`;\s*if\(bar\.style\.width!==next\)bar\.style\.width=next;/);
  const v1=await text('promptai-experience-v1.js');
  assert.doesNotMatch(v1,/clip-path/,'the free-prompt thinking loader must not tint text via clip-path anymore - that technique clipped ascenders/descenders (g, t, f) incompletely');
  assert.match(v1,/function applyTitleFill\(stage,progress\)\{const bar=\$\('\.prompt-thinking-bar i',stage\);if\(bar\)bar\.style\.width=`\$\{\(progress\*100\)\.toFixed\(2\)\}%`\}/);
});
test('every AI provider call in the review/questions and free-prompt chains has a bounded timeout so a hanging provider fails fast instead of stalling the whole fallback chain',async()=>{
  const core=await text('server/generate-core.js');
  assert.match(core,/PROVIDER_TIMEOUT_MS\s*=\s*35000/);
  assert.match(core,/async function fetchWithTimeout\(/);
  assert.match(core,/AbortController/);
  assert.match(core,/await fetchWithTimeout\(["']https:\/\/api\.openai\.com\/v1\/responses["']/);
  assert.match(core,/await fetchWithTimeout\(["']https:\/\/ai-gateway\.vercel\.sh\/v1\/chat\/completions["']/);
  assert.match(core,/generativelanguage\.googleapis\.com[\s\S]{0,400}fetchWithTimeout|fetchWithTimeout\([\s\S]{0,200}generativelanguage\.googleapis\.com/);
  assert.match(core,/if\(firstError\?\.status===504\)throw firstError;/);
  const freePrompt=await text('server/free-prompt-v2.js');
  assert.match(freePrompt,/PROVIDER_TIMEOUT_MS\s*=\s*35000/);
  assert.match(freePrompt,/async function fetchWithTimeout\(/);
  assert.match(freePrompt,/await fetchWithTimeout\(['"]https:\/\/ai-gateway\.vercel\.sh\/v1\/chat\/completions['"]/);
  assert.match(freePrompt,/await fetchWithTimeout\(['"]https:\/\/api\.openai\.com\/v1\/responses['"]/);
  assert.match(freePrompt,/fetchWithTimeout\(`https:\/\/generativelanguage\.googleapis\.com/);
});

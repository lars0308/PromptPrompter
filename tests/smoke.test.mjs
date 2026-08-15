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
test('home starts with website and free prompt, while Free locks secondary tools and skips internal dev-phase jargon',async()=>{const src=await text('home-entry-ui.js');assert.match(src,/Internetseite erstellen/);assert.match(src,/Freier Prompt/);assert.match(src,/Alles andere: Text, Bild, Video, Musik, PowerPoint, Code und mehr/);for(const id of ['workspaceRevisionBtn','workspaceBuildSiteBtn','workspacePreviewBtn','workspaceLastProjectBtn','workspaceLibraryBtn'])assert.ok(src.includes(id));assert.match(src,/home-plan-locked/);assert.doesNotMatch(src,/Feature-Freeze/)});
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
test('the home page puts the four secondary tools in one row and only sells to free accounts',async()=>{
  const home=await text('home-entry-ui.js');
  assert.match(home,/#welcomePage \.welcome-quick-actions\{display:grid!important;grid-template-columns:repeat\(12,minmax\(0,1fr\)\)!important/,'an ID selector is required - promptai-experience-v1 forces 1fr with body.prompt-unified-ui');
  assert.match(home,/#workspaceBuildSiteBtn,\.welcome-quick-actions>#workspacePreviewBtn,\.welcome-quick-actions>#workspaceLastProjectBtn,\.welcome-quick-actions>#workspaceLibraryBtn\{grid-column:span 3\}/,'a quarter each on a wide screen');
  assert.match(home,/#workspaceBuildSiteBtn,\.welcome-quick-actions>#workspacePreviewBtn,\.welcome-quick-actions>#workspaceLastProjectBtn,\.welcome-quick-actions>#workspaceLibraryBtn\{grid-column:span 6/,'two per row on a phone');
  assert.match(home,/const plans=\$\('#showPlansBtn'\);if\(plans\)plans\.hidden=!free;/,'paid plans and admins have nothing to subscribe to here');
  assert.doesNotMatch(home,/free-workflow-upgrade/,'the removed fixed upsell bar leaves no styles behind');
});
test('the entry gate fills the page and its plans card carries no arrow button',async()=>{
  const gate=await text('entry-gate-ui.js');
  assert.doesNotMatch(gate,/gate-plans-arrow/,'the blue circle with the arrow is gone');
  assert.match(gate,/\.account-body\{display:flex;flex-direction:column;min-height:100dvh/);
  assert.match(gate,/#gateActions\{display:grid;justify-items:stretch;gap:18px;max-width:520px;margin-top:auto;margin-bottom:auto/,'leftover height is split above and below the actions');
  assert.match(gate,/#gateLegalRow\{margin-top:auto/,'the legal row sits on the bottom edge');
});
test('the login page carries its two entry points in the header and the headline across the full width',async()=>{
  const gate=await text('entry-gate-ui.js');
  assert.match(gate,/top\.className='gate-top'/,'Anmelden and Kostenlos testen share one header row');
  assert.match(gate,/id="gateSignInPick">Anmelden<\/button>'\s*\+'<button type="button" class="gate-guest-btn" id="gateGuestBtn">Kostenlos testen/,'both buttons sit next to each other');
  assert.match(gate,/grid-template-areas:'hero hero' 'actions shot' 'proof proof'/,'the hero spans both columns');
  assert.match(gate,/\.auth-hero h1\{grid-column:1\/-1;max-width:none/,'no character cap squeezes the headline any more');
  assert.doesNotMatch(gate,/\.gate-login-pick\{position:absolute/,'the sign-in button is a header item, not an overlay');
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
test('the visitor never picks an AI: the plan decides HTML or image preview, the server decides the model',async()=>{
  const app=await text('app.js'),html=await text('index.html'),fix=await text('preview-mode-fix.js');
  assert.match(app,/free:\{label:"Free"[^}]*aiPreviews:false/);
  assert.match(app,/pro:\{label:"Pro"[^}]*aiPreviews:true/);
  assert.match(app,/ultimate:\{label:"Ultimate"[^}]*aiPreviews:true/);
  // A model picker in the browser could only ever offer what the visitor cannot judge. The plan
  // grants image previews, and the server runs the profiles configured for that plan in order.
  assert.doesNotMatch(html,/id="previewFormat"/,'the selector is gone from the markup');
  assert.doesNotMatch(app,/previewFormat/,'…and from the client');
  assert.doesNotMatch(app,/imageProfileId/,'the request no longer names a profile');
  assert.doesNotMatch(app,/function selectedImageProfile\(\)/);
  assert.match(app,/if\(planRules\(\)\.aiPreviews\)\{/,'the plan is the only switch');
  assert.match(app,/if\(!cloudReady\(\)\|\|!planRules\(\)\.aiPreviews\)\{/,'redrawing a single image follows the same rule');
  assert.doesNotMatch(app,/image-auto/,'no entry may pick a provider on its own');
  assert.doesNotMatch(app,/aiConnection\(imageProvider\)/,'central profiles need no personal connection');
  assert.doesNotMatch(fix,/previewFormat/,'nothing rewrites a selector that no longer exists');
});
test('the question added for a blocker names the point and can be answered by tapping',async()=>{
  // It used to read "Wie soll mit dem offenen kritischen Punkt umgegangen werden?" with no
  // options: the actual point sat only in the reason line and there was nothing to click, so the
  // required question was effectively unanswerable and appeared on every run.
  const src=await text('app.js');
  assert.doesNotMatch(src,/Wie soll mit dem offenen kritischen Punkt umgegangen werden\?/);
  assert.match(src,/question:subject\?`Noch offen: \$\{subject\}\. Wie möchtest du damit umgehen\?`/);
  assert.match(src,/const subject=blockerArea\|\|blockerMessage\.split/,'the message carries the point when the area is empty');
  assert.match(src,/if\(subject\|\|blockerMessage\)\{/,'a blocker with no information at all adds no question');
  assert.match(src,/const suggestions=\[alternative,"Ich ergänze die Angabe jetzt","Ohne diese Angabe weitermachen","Später klären, zuerst Vorschau ansehen"\]/);
  assert.match(src,/\.filter\(\(x,i,all\)=>all\.indexOf\(x\)===i\)\.slice\(0,4\)/,'the alternative must not appear twice');
});
test('every prompt that produces visible text asks for German',async()=>{
  // The app is German throughout, but only the revision brief said so - the review returned
  // English questions, reasons, suggestions, warnings and blockers, and concept copy would have
  // come back English too whenever the AI actually answered.
  const core=await text('server/generate-core.js');
  const rule=/Schreibe alle sichtbaren Textwerte auf Deutsch \(Fragen, Begründungen, Antwortvorschläge, Hinweise, Blocker, Annahmen, Namen und Vorschautexte\)/g;
  assert.equal((core.match(rule)||[]).length,3,'review, concepts and refine each need the rule');
  for(const fn of ['makeReviewPrompt','makeConceptPrompt','makeRefinePrompt']){
    const start=core.indexOf(`function ${fn}(`);
    assert.ok(start>=0,fn);
    const body=core.slice(start,core.indexOf('\n}\n',start));
    assert.match(body,/Schreibe alle sichtbaren Textwerte auf Deutsch/,fn);
  }
  assert.doesNotMatch(core,/- ready is true only when there is no required question or blocker preventing useful concept generation\.\nReturn only the requested JSON/);
});
test('the preview image request uses the profile the visitor picked',async()=>{
  const src=await text('server/preview-image.js');
  assert.match(src,/const wantedId=String\(body\.imageProfileId\|\|''\)\.trim\(\);/);
  assert.match(src,/if\(wantedId&&candidates\.some\(x=>String\(x\.id\)===wantedId\)\)candidates=\[\.\.\.candidates\.filter\(x=>String\(x\.id\)===wantedId\),\.\.\.candidates\.filter\(x=>String\(x\.id\)!==wantedId\)\]/,'the pick goes first, the rest stay as fallbacks');
  assert.match(src,/listProfiles\('image'/,'the candidates are the configured profiles, not fixed provider names');
});
test('the gateway request caps its output budget so small models are not rejected',async()=>{
  const core=await text('server/generate-core.js');
  assert.match(core,/const maxTokens=Math\.max\(1000,Math\.min\(16000,Number\(process\.env\.AI_GATEWAY_MAX_TOKENS\)\|\|8000\)\)/);
  assert.match(core,/max_tokens:maxTokens,stream:false/);
});
test('the gate price chips follow live Stripe pricing instead of a baked-in number',async()=>{
  const gate=await text('entry-gate-ui.js');
  assert.match(gate,/function watchPricing\(\)/);
  assert.match(gate,/new MutationObserver\(syncTierChips\)\.observe\(label,\{childList:true,characterData:true,subtree:true\}\)/,'the price is written as text, which no attribute observer would see');
  assert.match(gate,/for\(const id of \['#proPriceLabel','#ultimatePriceLabel'\]\)/);
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
test('the trial applies to Pro and Ultimate alike and shows its exact lifecycle',async()=>{
  const checkout=await text('api/checkout.js'),webhook=await text('api/stripe-webhook.js'),ui=await text('trial-fix-ui.js');
  // The trial is pushed to Stripe at checkout (subscription_data[trial_period_days]); nothing is
  // read back from Stripe, so the admin field is the single source for new purchases.
  assert.match(checkout,/\['pro','ultimate'\]\.includes\(product\)\?await currentOffer\(\):null/);
  assert.match(checkout,/'subscription_data\[trial_period_days\]':String\(trialDays\)/);
  assert.match(webhook,/customer\.subscription\.created/);
  assert.match(webhook,/o\.status==='trialing'&&o\.trial_end/);
  assert.match(ui,/\$\{subscription\?\.plan==='ultimate'\?'Ultimate':'Pro'\} · Testphase/);
  assert.match(ui,/Noch \$\{remaining\}/);
  assert.match(ui,/!\['pro','ultimate'\]\.includes\(subscription\.plan\)/,'both paid plans can be in a trial');
  assert.match(ui,/Gilt für Pro und Ultimate/);
});
test('subscription management shows live Stripe billing details without a new function',async()=>{const checkout=await text('api/checkout.js'),ui=await text('subscription-ui.js');assert.match(checkout,/action==='subscription-info'/);assert.match(checkout,/invoices\/create_preview/);assert.match(checkout,/payment_method_update/);assert.match(checkout,/subscription_cancel/);assert.match(checkout,/subscription_update/);assert.match(checkout,/billing_portal\/configurations/);assert.match(checkout,/Prompt\.ai Kundenportal/);assert.match(checkout,/features\[subscription_update\]\[default_allowed_updates\]\[0\].*price/);for(const copy of ['Abo verwalten','Nächste Abbuchung','Zahlungsmethode','Abrechnungsverlauf','Auf Ultimate wechseln'])assert.ok(ui.includes(copy));assert.match(ui,/manageSubscriptionBtn/);assert.match(ui,/data-sub-portal="cancel"/)});
test('prompt history and learning controls remain user-owned',async()=>{const history=await text('project-history.js'),learning=await text('learning-controls.js');assert.match(history,/sitebrief_prompt_versions/);assert.match(history,/user_id/);assert.match(learning,/sitebrief_learning_examples/);assert.match(learning,/\.eq\('user_id',cloud\.user\.id\)/)});
test('package is frozen as Prompt.ai v1.0',async()=>{const pkg=JSON.parse(await text('package.json'));assert.equal(pkg.version,'1.0.0');const version=await text('VERSION.md');assert.match(version,/Feature Freeze/);assert.match(version,/Bugfix/)});
test('Impressum and Datenschutz stay reachable even on the pre-login guest gate, not only from the hamburger menu',async()=>{const src=await text('legal-pages.js');assert.match(src,/function ensureGateFooter\(\)\{/);assert.match(src,/const body=\$\('#accountDialog \.account-body'\);if\(!body\|\|\$\('#gateLegalRow'\)\)return;/);assert.match(src,/ensureGateFooter\(\);/);assert.match(src,/\.gate-legal-row\{/)});
test('the own GitHub connection is gated on Ultimate everywhere - rules, settings gate, markup and card say the same thing',async()=>{
  const app=await text('app.js'),html=await text('index.html'),css=await text('styles.css'),settings=await text('settings-connections-ui.js');
  // PLAN_RULES is the single source: github lives in ultimate only.
  assert.match(app,/pro:\{[^}]*github:false/);
  assert.match(app,/ultimate:\{[^}]*github:true/);
  // The gate reads that rule instead of testing the plan name again - the old copy unlocked at Pro.
  assert.match(app,/const githubAvailable=cloudReady\(\)&&\(rules\.github\|\|state\.isAdmin\);/);
  assert.match(app,/el\.githubConnectionGrid\.hidden=!githubAvailable;/);
  assert.match(settings,/allowed=a\.isAdmin\|\|a\.plan==='ultimate'/);
  // Nothing may still advertise it as a Pro feature.
  assert.doesNotMatch(html,/PRO · EXPORT[\s\S]{0,40}GitHub/,'GitHub must not be labeled a Pro feature');
  assert.doesNotMatch(html,/GitHub-Verbindung ist ab Pro/,'the settings upgrade row must ask for Ultimate');
  assert.match(html,/ULTIMATE · REPOSITORY[\s\S]{0,40}GitHub/);
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
  // The framing rule is editable in the admin console now, so it is asserted on its default.
  const src=await text('server/preview-image.js')+await text('server/prompt-templates.js');
  // The long "do not depict a monitor, laptop, desk..." enumeration was counterproductive:
  // diffusion models have no reliable negation and render what a prompt names, and on Cloudflare
  // the closing reminder was cut off by the 2048-character limit anyway. The framing is positive
  // and device-free now, stated first and last, with the device words in a real negative prompt.
  assert.match(src,/FLAT WEB DESIGN ARTBOARD, 16:9, FULL BLEED/);
  assert.match(src,/fills 100% of the frame and runs off all four edges/);
  assert.match(src,/Every pixel of the frame is the webpage\./);
  assert.match(src,/const NEGATIVE_PROMPT='monitor, computer screen, laptop/);
  assert.doesNotMatch(src,/If text cannot be rendered perfectly, render no text\./,'this escape hatch let models skip real brand/headline text instead of attempting it');
  assert.match(src,/TEXT: render the brand name "\$\{brand\}" in the header and "\$\{headline\}" as the hero headline/);
});
test('AI-generated concept copy is required to use real industry vocabulary from the project, not a generic tagline',async()=>{
  // Lives in the editable quality rules now; the built-in default still has to carry it.
  const src=await text('server/prompt-templates.js');
  assert.match(src,/die Überschrift eines Dönerladens spricht von Döner und Essen, ein Garten- und Landschaftsbau von Gärten und Arbeit im Freien/);
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
  assert.match(img,/SPECIAL INSTRUCTION \(authoritative for header, navigation or composition\)/);
  assert.match(img,/HEADER \/ STRUCTURE \(follow exactly\): \$\{header\}/);
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
  assert.match(src,/const result=await publishExisting\(token,req\.body\?\.targetRepo,req\.body\?\.branch,req\.body\?\.files\|\|\{\}\);/);
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
  assert.match(app,/const body=targetRepo\?\{action:'publish-existing',targetRepo,files,pages:wantsPages\}:\{repoName,files,pages:wantsPages\};/);
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
  assert.match(src,/function maybeShowEntryGate\(\)\{[\s\S]{0,1200}showAccountGate\(\);\s*\}/);
});
test('the login screen comes back after the app was closed or left alone for hours, not once per browser session',async()=>{
  const src=await text('app.js');
  // sessionStorage alone let an installed app that keeps its session skip the gate for days.
  assert.match(src,/const GATE_AFTER_MS = 6\*60\*60\*1000;/);
  assert.match(src,/function awayLongEnough\(\)\{/);
  assert.match(src,/if\(decided&&!away\)return;/,'a long absence must beat the marker');
  // Der Merker bedeutet "entschieden", nicht "einmal gezeigt": wurde er schon beim Anzeigen
  // gesetzt, galt ein Neuladen auf der Anmeldeseite als erledigt und führte ohne Anmeldung in
  // die App. Gesetzt wird er nur dort, wo jemand bewusst ohne Konto weitergeht.
  assert.doesNotMatch(src,/markSeen\(\);\s*if\(decided&&!away\)return;\s*try\{sessionStorage\.setItem\(ENTRY_GATE_KEY/,'nicht beim blossen Anzeigen setzen');
  assert.match(src,/function closeAccountGate\(\)\{try\{sessionStorage\.setItem\(ENTRY_GATE_KEY,'1'\)\}catch\{\}/,'erst die Gast-Entscheidung setzt ihn');
  assert.match(src,/document\.addEventListener\('visibilitychange',\(\)=>\{if\(document\.visibilityState==='visible'\)maybeShowEntryGate\(\)\}\);/);
  // Signing out is an exit, so the gate returns immediately - not after six hours.
  assert.match(src,/sessionStorage\.removeItem\(ENTRY_GATE_KEY\)\}catch\{\}showAccountGate\(\);/);
});
test('Face ID is gone rather than decorative: it never verified anything server-side',async()=>{
  const src=await text('app.js'),html=await text('index.html');
  for(const marker of ['BIOMETRIC_KEY','biometricRecord','handleBiometric','maybePromptBiometric','faceIdBtn'])
    assert.ok(!src.includes(marker),`app.js still carries ${marker}`);
  assert.ok(!html.includes('faceIdBtn')&&!html.includes('Face ID'),'the settings card must be gone too');
  // The helpers existed only for the WebAuthn ceremony - they go with it.
  assert.ok(!src.includes('base64UrlToBytes')&&!src.includes('bytesToBase64Url'));
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
  const spots=[/<strong data-brand-ai="1">Prompt<span class="brand-ai-suffix">\.ai<\/span><\/strong><small>AUS IDEEN WIRD EIN KLARES PROJEKT/,/<strong data-brand-ai="1">Prompt<span class="brand-ai-suffix">\.ai<\/span><\/strong><p class="prompt-fill-progress"[^>]*>Dein Arbeitsbereich wird vorbereitet\./,/<strong data-brand-ai="1">Prompt<span class="brand-ai-suffix">\.ai<\/span><\/strong><span>Aus Ideen wird ein klares Projekt/];
  for(const pattern of spots)assert.match(html,pattern);
  assert.match(css,/\.auth-brand \.brand-ai-suffix\{color:var\(--accent\)\}/,'a plain .auth-brand span{color:muted} rule beats the single-class .brand-ai-suffix rule on specificity, so a targeted override is required');
});
test('a broad prompt-unified-ui dialog reset does not strip the cookie banner\'s padding with !important',async()=>{
  const src=await text('unified-ui-v1.js');
  assert.match(src,/dialog:not\(\.prompt-own-style\):not\(#previewLightbox\):not\(#welcomeIntroDialog\):not\(#cookieBanner\)\{border:0!important;background:transparent!important;color:var\(--ink\)!important;padding:0!important\}/);
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
  assert.match(src,/category:\$\('#freePromptCategory'\)\.value,customCategory:\$\('#freePromptCustomCategory'\)\.value,targetTool:\$\('#freePromptTool'\)\.value,customTool:\$\('#freePromptCustomTool'\)\.value,description:\$\('#freePromptDescription'\)\.value,context:\$\('#freePromptContext'\)\?\.value\|\|'',style:\$\('#freePromptStyle'\)\?\.value\|\|'',outputFormat:\$\('#freePromptFormat'\)\?\.value\|\|''\}\}/);
});
test('opening the hamburger menu re-syncs plan UI from window.PromptAiAccess, so a stale Upgrade button can never survive a menu open even if a promptai:access event was missed',async()=>{
  const src=await text('app.js');
  assert.match(src,/const access=window\.PromptAiAccess;if\(access\)\{if\(access\.plan\)state\.plan=access\.plan;state\.isAdmin=Boolean\(access\.isAdmin\)\|\|isOwnerAccount\(\);if\(access\.ownApiKeys\)state\.ownApiKeys=true;\}applyPlanUi\(\);/);
});
test('the "Projekt wird vorbereitet" mode-handoff loader fills the headline itself via background-clip (never clip-path, which cut ascenders/descenders like g, t, f) and tracks real elapsed time',async()=>{
  const src=await text('mode-handoff-fix.js');
  assert.doesNotMatch(src,/clip-path:/,'the mode-handoff loader must not tint text via clip-path anymore - that technique clipped ascenders/descenders (g, t, f) incompletely');
  assert.match(src,/<strong>Projekt wird vorbereitet<\/strong>/);
  // The thin bar was replaced by the headline filling blue. background-clip:text follows the real
  // glyph outlines, unlike the clip-path attempt that sliced letters in half.
  assert.match(src,/\.prompt-mode-handoff strong\{background-image:linear-gradient\(90deg/);
  assert.match(src,/-webkit-background-clip:text;background-clip:text;color:transparent/);
  assert.match(src,/box\.style\.setProperty\('--prompt-fill',next\)/);
  assert.match(src,/@supports not \(background-clip:text\)/,'older engines keep the bar');
  assert.match(src,/function titleProgress\(elapsed\)\{const tau=1500;return Math\.min\(\.94,\.94\*\(1-Math\.exp\(-elapsed\/tau\)\)\)\}/,'must track real elapsed time asymptotically, not a fixed guessed duration');
  assert.match(src,/function release\(box\)\{active=false;clearTimeout\(timer\);clearInterval\(sentenceTimer\);stopTitleFillLoop\(true\);/,'release (called once the real handoff work is done) must snap the title fill to 100% instead of leaving it mid-fill');
});
test('the review/preview loader and the free-prompt thinking loader never fill text via measured rects or polygon clip-paths (which rendered garbled, offset text and cut ascenders/descenders); the review loader fills the headline with background-clip instead',async()=>{
  for(const file of ['transition-polish.js','promptai-experience-v1.js']){
    const src=await text(file);
    assert.doesNotMatch(src,/getClientRects/,`${file} must not measure per-line text rects for the fill anymore - this was reported live as rendering garbled/offset blue text even after an earlier defensive fix`);
    assert.doesNotMatch(src,/getBoundingClientRect/,`${file} must not sync overlay position/size via getBoundingClientRect anymore`);
    assert.doesNotMatch(src,/polygon\(/,`${file} must not build a reading-order polygon clip-path anymore`);
  }
  const transition=await text('transition-polish.js');
  assert.doesNotMatch(transition,/clip-path:/,'the review/preview loader must not tint text via clip-path anymore - that technique clipped ascenders/descenders (g, t, f) incompletely');
  assert.match(transition,/#promptWorkflowLoader strong\{background-image:linear-gradient\(90deg/,'the headline itself carries the progress');
  assert.match(transition,/if\(box\.style\.getPropertyValue\('--prompt-fill'\)!==next\)box\.style\.setProperty\('--prompt-fill',next\);/,'only write on change - assigning inside its own observer loops');
  assert.match(transition,/@supports not \(background-clip:text\)/,'older engines keep the bar');
  const v1=await text('promptai-experience-v1.js');
  assert.doesNotMatch(v1,/clip-path:/,'the free-prompt thinking loader must not tint text via clip-path anymore - that technique clipped ascenders/descenders (g, t, f) incompletely');
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
test('a running preview generation can be cancelled',async()=>{
  // A slow image AI used to leave the visitor with a progress bar and nothing else - no way to
  // stop it and pick a different preview AI.
  const app=await text('app.js'),html=await text('index.html');
  assert.match(html,/id="cancelPreviewBtn" hidden/,'the button only appears while a run is active');
  assert.match(app,/let conceptsGenerating=false,previewCancel=null;/);
  assert.match(app,/function cancelPreviewRun\(\)/);
  assert.match(app,/conceptsGenerating=true;previewCancel=new AbortController\(\);/);
  assert.match(app,/cancelToken:previewCancel\?\.signal/,'the request has to carry the token');
  assert.match(app,/while\(queue\.length\)\{\s*if\(previewCancel\?\.signal\?\.aborted\)return;/,'the image queue stops too, not just the running request');
  assert.match(app,/if\(err\?\.cancelled\|\|previewCancel\?\.signal\?\.aborted\)return;/,'a cancel must not be reported as a failure');
  assert.match(app,/const onCancel=\(\)=>controller\.abort\('cancelled'\)/);
});
test('the preview image is generated against the same design decisions as the master prompt',async()=>{
  const app=await text('app.js'),server=await text('server/preview-image.js');
  assert.match(app,/function previewDesignPayload\(\)/);
  assert.match(app,/controls:\{originality:ctrl\.originality,antiSlop:ctrl\.antiSlop,motion:ctrl\.motion,density:ctrl\.density\}/);
  assert.match(app,/selectedModules\(\)\.map\(m=>`\$\{m\.name\}: /,'active module rules travel with the request');
  assert.match(server,/function controlText\(ctrl=\{\}\)/);
  assert.match(server,/function ruleText\(rules=\[\]\)/);
  assert.match(server,/DESIGN CONTROLS \(the finished site is built from a master prompt carrying these same settings/);
  assert.match(server,/imagePrompt\(project,body\.concept\|\|\{\},\{controls:body\.controls\|\|\{\},designRules:body\.designRules\|\|\[\]\}\)/);
  assert.match(server,/PROJECT DESIGN RULES/);
});
test('the preview step gives the directions room to be judged',async()=>{
  const guided=await text('guided-clean-ui.js');
  assert.match(guided,/#stepPreviews \.concept-gallery\{display:grid;grid-template-columns:1fr;gap:24px;margin-top:24px\}/);
  assert.match(guided,/#stepPreviews \.concept-screen\{aspect-ratio:4\/3/,'a 16:11 thumbnail was too small to judge a design on a phone');
  assert.match(guided,/#stepPreviews \.preview-zoom-hint\{top:9px;right:9px;bottom:auto\}/,'it used to sit on the mini page footer');
  assert.match(guided,/@media\(min-width:821px\)\{[\s\S]{0,300}?#stepPreviews \.concept-gallery\{grid-template-columns:repeat\(auto-fit,minmax\(420px,1fr\)\)/);
});
test('preview images are requested in parallel with a capped concurrency',async()=>{
  // Sequentially, every direction meant a full round trip one after the other (~140s for three).
  const app=await text('app.js'),server=await text('server/preview-image.js');
  assert.match(app,/const PREVIEW_IMAGE_CONCURRENCY=4;/);
  assert.match(app,/const workers=Array\.from\(\{length:Math\.min\(PREVIEW_IMAGE_CONCURRENCY,total\)\},async\(\)=>\{/);
  assert.match(app,/while\(queue\.length\)\{\s*if\(previewCancel\?\.signal\?\.aborted\)return;\s*await run\(queue\.shift\(\)\);/,'a cancel must stop the queue, not just the running request');
  assert.match(app,/await Promise\.all\(workers\)/);
  assert.doesNotMatch(app,/for\(let i=0;i<state\.concepts\.length;i\+\+\)\{\s*if\(previewCancel/,'the sequential loop is gone');
  // 5 directions at 4 in flight stays under the server's own per-minute budget for this action.
  const limit=server.match(/key:'preview-image',limit:(\d+)/);
  assert.ok(limit&&Number(limit[1])>=5,'server limit must allow a full parallel run');
});
test('the preview image prompt never names a device and fits the provider limit',async()=>{
  // Cloudflare's flux endpoint truncates at 2048 characters, and the closing "flat artboard"
  // rule sat at the very end - so it was silently cut off. Naming devices to forbid them also
  // backfires: diffusion models have no reliable negation and render what the prompt mentions.
  const src=await text('server/preview-image.js'),defaults=await text('server/prompt-templates.js');
  assert.match(src,/const NEGATIVE_PROMPT='monitor, computer screen, laptop/);
  assert.match(src,/negative_prompt:NEGATIVE_PROMPT/,'Cloudflare accepts a real negative prompt');
  assert.match(src,/const PROMPT_LIMIT=1900;/);
  assert.match(defaults,/FLAT WEB DESIGN ARTBOARD, 16:9, FULL BLEED/,'the framing rule leads');
  assert.match(src,/Every pixel of the frame is the webpage\./,'and closes');
  assert.match(src,/while\(prompt\.length>PROMPT_LIMIT&&blocks\.length>4\)/,'overflow drops middle blocks, never the closing rule');
  // The positive prompt must not enumerate devices any more.
  const body=src.slice(src.indexOf('function imagePrompt('),src.indexOf('\nfunction safe('));
  assert.doesNotMatch(body,/monitor|laptop|tablet|desk|browser|mockup/i,'the positive prompt stays device-free');
  const framing=(await import('../server/prompt-templates.js')).default.promptDefaults().find(x=>x.key==='preview-image-rules');
  assert.doesNotMatch(framing.body,/monitor|laptop|tablet|desk|browser|mockup/i,'…and so does its editable default');
});
test('starting a project cannot flash the welcome page before the handoff overlay',async()=>{
  // The start reloads the page, and the welcome screen the visitor just left painted for a moment
  // before mode-handoff-fix.js had built its overlay.
  const theme=await text('theme-init.js'),html=await text('index.html'),handoff=await text('mode-handoff-fix.js');
  assert.match(theme,/if\(sessionStorage\.getItem\('prompt-ai-v1-simple-start'\)==='1'\)\{/);
  assert.match(theme,/classList\.add\('prompt-handoff-pending'\)/);
  assert.match(theme,/setTimeout\(\(\)=>document\.documentElement\.classList\.remove\('prompt-handoff-pending'\),9000\)/,'never leave the page hidden if the handoff stalls');
  assert.match(html,/html\.prompt-handoff-pending #welcomePage\{visibility:hidden!important\}/,'must sit in the static shell to beat the first paint');
  assert.match(handoff,/classList\.remove\('prompt-handoff-pending'\)/,'released when the handoff finishes');
});
test('every loading screen shows its progress in the headline, not in a thin bar',async()=>{
  const css=await text('styles.css'),html=await text('index.html'),cleanup=await text('workflow-cleanup.js'),app=await text('app.js');
  assert.match(css,/\.prompt-fill-progress\{background-image:linear-gradient\(90deg,var\(--prompt-fill-on\) 0 var\(--prompt-fill,0%\)/,'value-driven fill');
  assert.match(css,/\.prompt-fill-sweep\{background-image:linear-gradient/,'indeterminate waits sweep instead');
  assert.match(css,/-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important/,'more specific colour rules would otherwise repaint the glyphs opaque');
  assert.doesNotMatch(css,/\.prompt-fill-progress\{[^}]*clip-path/,'clip-path cut ascenders and descenders in half');
  assert.match(css,/\.master-generation-track,#promptAppBoot \.boot-track\{display:none\}/);
  assert.match(css,/\.task-progress \.task-progress-track\{display:none\}/);
  assert.match(html,/<p class="prompt-fill-progress" style="--prompt-fill:6%">Dein Arbeitsbereich wird vorbereitet\.<\/p>/,'boot screen status line - the wordmark itself stays untouched');
  assert.match(cleanup,/<strong class="prompt-fill-sweep">Dein Master-Prompt entsteht<\/strong>/,'master prompt screen');
  assert.match(app,/box\?\.style\.setProperty\('--prompt-fill',`\$\{pct\}%`\);label\?\.classList\.add\('prompt-fill-progress'\)/,'inline task progress');
});
test('starting a new project does not ask first, and finished projects are marked as such',async()=>{
  const app=await text('app.js'),start=await text('project-start-ui.js'),history=await text('project-history.js');
  assert.doesNotMatch(app,/Das aktuelle Projekt wird durch ein leeres neues Projekt ersetzt/,'a new project is the normal path, not a destructive action');
  assert.match(start,/const reset=trigger\?\.id==='resetBtn';if\(reset&&!await confirmReplace\(true\)\)return;/,'only the explicit reset still asks');
  assert.match(history,/function isDone\(row\)\{return Math\.max\(Number\(row\?\.maxStep\)\|\|0,Number\(row\?\.step\)\|\|0,Number\(row\?\.state\?\.maxVisited\)\|\|0\)>=8\}/);
  assert.match(history,/isDone\(x\)\?'FERTIG':'NOCH OFFEN'/);
  assert.match(history,/maxStep:Number\(clean\.maxVisited\)\|\|Number\(clean\.currentStep\)\|\|1/,'the reached step has to be stored with the snapshot');
});
test('the boot screen fills with the load it really has, then blinks blue once before it leaves',async()=>{
  const boot=await text('admin-console.js'),theme=await text('theme-init.js'),css=await text('styles.css');
  assert.match(boot,/const CRITICAL_SCRIPTS=\[/,'progress can only be reported against a known list');
  assert.match(boot,/for\(const src of CRITICAL_SCRIPTS\)\{await \(src==='core'\?loadCore\(\):load\(src\)\);bootProgress\(\+\+ready\/CRITICAL_SCRIPTS\.length\)\}/,'every loaded script moves the fill');
  assert.doesNotMatch(boot,/ready&&elapsed>=1050/,'a minimum showtime makes the screen a timer again');
  assert.match(boot,/if\(ready\|\|elapsed>=5200\)/,'ready leaves immediately, the cap stays as a failsafe');
  assert.match(boot,/window\.PromptAiFill\?\.finish\(boot\?\.querySelector\('p'\),\(\)=>\{boot\?\.classList\.add\('is-leaving'\)/,'the blink runs before the fade');
  assert.match(theme,/window\.PromptAiFill=\{/,'shared driver ships in the first blocking script');
  assert.match(theme,/if\(pct<previous\)return/,'progress never walks backwards');
  assert.match(css,/\.prompt-fill-complete\{--prompt-fill:100%!important;animation:promptFillFlash/);
  assert.match(css,/@keyframes promptFillFlash\{0%\{opacity:1\}30%\{opacity:\.2\}/,'one blink, not a loop');
});
test('every loading screen ends the same way: full fill, blinking, then gone - and never flickers past',async()=>{
  const transition=await text('transition-polish.js'),handoff=await text('mode-handoff-fix.js'),cleanup=await text('workflow-cleanup.js'),app=await text('app.js'),theme=await text('theme-init.js');
  // A screen that appears and disappears within 200ms reads as a glitch, so every one of them
  // stays for a shared minimum and keeps blinking until then.
  assert.match(theme,/const MIN_VISIBLE_MS=FLASH_MS\?1600:0;/);
  assert.match(theme,/return Math\.max\(FLASH_MS,MIN_VISIBLE_MS-elapsed\);/);
  assert.match(transition,/const wait=window\.PromptAiFill\?\.tail\?\.\(shownAt\)\?\?FLASH_MS;/);
  assert.match(handoff,/const wait=window\.PromptAiFill\?\.tail\?\.\(startedAt\)\?\?flash;/);
  assert.match(transition,/#promptWorkflowLoader\.is-complete strong\{animation:promptFillFlash/);
  assert.match(transition,/if\(box\.classList\.contains\('is-complete'\)\)return;/,'sync() calls hide() repeatedly - restarting the blink would keep the screen up forever');
  assert.match(transition,/box\.classList\.remove\('is-leaving','is-complete'\)/,'resumed work cancels the blink');
  assert.match(handoff,/\.prompt-mode-handoff\.is-complete strong\{animation:promptFillFlash/);
  assert.match(handoff,/setTimeout\(\(\)=>leave\(box\),flash\?wait:0\)/);
  assert.match(cleanup,/window\.PromptAiFill\?\.finish\(\$\('#masterGeneration strong'\),\(\)=>step\.classList\.remove\('master-generating'\)\)/);
  assert.match(cleanup,/window\.PromptAiFill\?\.reset\(\$\('#masterGeneration strong'\)\)/,'the overlay can run again for the next project');
  assert.match(app,/el\[`\$\{kind\}ProgressText`\]\?\.classList\.add\('prompt-fill-complete'\)/,'inline task progress ends the same way');
});
test('admin announcements pop up large and come back on a fresh app open, not on the way home',async()=>{
  const popup=await text('announcement-popup.js'),core=await text('admin-console-core.js'),html=await text('index.html'),css=await text('styles.css'),boot=await text('admin-console.js');
  assert.doesNotMatch(html,/id="publicNotices"/,'the small bottom-right stack is gone');
  assert.doesNotMatch(css,/\.public-notice/,'…and so is its styling');
  assert.doesNotMatch(core,/class="public-notice/,'the fetch only publishes the data now');
  assert.match(core,/window\.PromptAiAnnouncements=Array\.isArray\(announcements\)\?announcements:\[\];window\.dispatchEvent\(new CustomEvent\('promptai:announcements'/);
  assert.match(boot,/'\.\/announcement-popup\.js\?v=[^']+','core'/,'the listener has to exist before the fetch resolves');
  assert.match(popup,/const SEEN_KEY='prompt-ai-announcement-seen-v1'/);
  assert.match(popup,/sessionStorage\.setItem\(SEEN_KEY/,'session scope: survives the internal reload, resets on a real app open');
  assert.doesNotMatch(popup,/localStorage/,'localStorage would silence the notice forever');
  assert.match(popup,/box\.showModal\(\)/,'large dialog instead of a toast');
  assert.match(popup,/document\.querySelector\('#cookieBanner\[open\],#maintenanceDialog\[open\],#accountDialog\[open\]'\)/,'the sign-in page is mandatory - an announcement must never push it aside');
});
test('the cookie notice is a slim bar at the bottom and both choices are the same button',async()=>{
  const html=await text('index.html'),legal=await text('legal-pages.js');
  assert.match(html,/<button type="button" class="solid-btn" id="cookieBannerEssentialBtn">Nur notwendige<\/button><button type="button" class="solid-btn" id="cookieBannerAcceptBtn">Alle akzeptieren<\/button>/,'same button class, so every layer styles them alike');
  assert.match(legal,/\.cookie-banner\{position:fixed;inset:auto 0 0 0;/,'sits at the bottom edge, not over the whole screen');
  assert.match(legal,/\.cookie-banner::backdrop\{background:transparent\}/,'no dimmed full-screen backdrop behind a bar');
  assert.match(legal,/\.cookie-banner-actions #cookieBannerEssentialBtn,\.cookie-banner-actions #cookieBannerAcceptBtn\{min-height:40px!important;padding:0 16px!important;border-radius:10px!important;font-size:12px!important;font-weight:750!important;white-space:nowrap\}/,'identical box for both choices');
});
test('every long admin list is folded away by default',async()=>{
  const html=await text('index.html'),core=await text('admin-console-core.js'),studio=await text('system-ai-studio.js'),ai=await text('admin-ai-ui.js'),css=await text('styles.css');
  for(const key of ['usage','runs','users','support','announcements'])assert.match(html,new RegExp(`<details class="admin-fold"><summary><div><span>[^<]+</span><strong>[^<]+</strong></div><em data-fold-count="${key}"></em>`),`${key} list needs a closed fold`);
  assert.doesNotMatch(html,/<details class="admin-fold" open/,'folds start closed');
  assert.match(core,/function foldCount\(key,count,singular,plural\)/,'a closed section has to say how much is inside');
  assert.match(core,/return `<details class="admin-user" data-user-id="\$\{esc\(user\.id\)\}"><summary>/,'one row per account, actions only when unfolded');
  assert.match(studio,/<details class="admin-fold"><summary><div><span>ÜBERSICHT<\/span><strong>Reihenfolge pro Aufgabe/);
  assert.match(ai,/<details class="admin-fold admin-ai-route"><summary>/);
  assert.match(css,/\.admin-fold\{margin:14px 0 0;border:1px solid var\(--line\)/);
});
test('settings sections and the boxes around them stay compact when closed',async()=>{
  const app=await text('app.js'),css=await text('styles.css');
  assert.match(app,/section\.classList\.remove\('is-open'\)/,'no section is open on arrival');
  assert.doesNotMatch(app,/const open=index===0/,'the first section used to open into an 1800px block');
  assert.match(css,/\.settings-section\.is-collapsible:not\(\.is-open\)\{padding-top:0!important;padding-bottom:0!important\}/,'otherwise a closed row keeps a tall empty band');
});
test('a dialog box is never narrower than the card it holds',async()=>{
  const polish=await text('ui-polish-final.js');
  assert.match(polish,/body\.prompt-unified-ui #legalDialog\{width:min\(var\(--prompt-content\),calc\(100vw - 32px\)\)!important;max-width:none!important\}/,'the 1233px card was cut off inside a 1000px dialog');
  assert.match(polish,/body\.prompt-unified-ui #appActionDialog,body\.prompt-unified-ui #agentLaunchDialog\{width:min\(900px,calc\(100vw - 28px\)\)!important/);
});
test('the critical scripts are fetched in parallel but still run in order',async()=>{
  const boot=await text('admin-console.js');
  assert.match(boot,/function preloadCritical\(\)\{/);
  assert.match(boot,/link\.rel='preload';link\.as='script';link\.href=src/,'warms the cache for every file at once');
  assert.match(boot,/async function critical\(\)\{preloadCritical\(\);let ready=0;for\(const src of CRITICAL_SCRIPTS\)/,'execution stays sequential - later files override earlier CSS layers');
});

test('building a website is its own tool on the home page, not a card at the end of the workflow',async()=>{
  const ui=await text('website-build-ui.js'),home=await text('home-entry-ui.js'),html=await text('index.html'),loader=await text('admin-console.js'),sw=await text('sw.js');
  // The card is moved, not rebuilt, so app.js keeps its element references and its handlers.
  assert.match(ui,/const card=\$\('\.export-result-card'\),host=\$\('#websiteBuildMount'\);/);
  assert.match(ui,/host\.appendChild\(card\)/);
  assert.doesNotMatch(ui,/buildWebsiteBtn'\)\.addEventListener/,'the build itself stays in app.js');
  assert.match(html,/<dialog id="websiteBuildDialog"/);
  assert.match(html,/id="workspaceBuildSiteBtn"/);
  assert.match(home,/decorate\(\$\('#workspaceBuildSiteBtn'\),'Probelauf'/);
  assert.match(home,/'workspaceRevisionBtn','workspaceBuildSiteBtn','workspacePreviewBtn'/,'locked for free accounts like the other paid tools');
  // Without a finished master prompt the AI would get an empty briefing.
  assert.match(ui,/const ready=String\(\$\('#masterPrompt'\)\?\.value\|\|''\)\.trim\(\)\.length>200;/);
  // Statt einer Sackgasse fragt der Probelauf, was gebaut werden soll - und bietet die
  // gespeicherten Projekte an, nicht nur das zuletzt geöffnete.
  assert.match(ui,/<strong>Was soll gebaut werden\?<\/strong>/);
  assert.match(ui,/data-build-open="pick">Projekt auswählen/);
  assert.match(ui,/pick:'#projectHistoryBtn',last:'#workspaceLastProjectBtn',new:'#workspaceNewProjectBtn'/);
  assert.match(loader,/\.\/website-build-ui\.js\?v=\d{8}-\d+/);
  assert.ok(sw.includes('/website-build-ui.js'));
});

test('one loading screen carries the run from the questions to the finished previews',async()=>{
  const loader=await text('transition-polish.js'),app=await text('app.js'),html=await text('index.html');
  // The same "Briefing wird geprüft" screen used to come back after the clarification dialog.
  assert.match(loader,/let reviewAnswered=false,stageText='';/);
  assert.match(loader,/show\(reviewAnswered\?'preview':'review'\)/);
  assert.match(loader,/#saveClarificationsBtn,#deferClarificationsBtn'\)\)\{reviewAnswered=true/);
  // Steps 4 and 5 are skipped automatically, so the screen must not blink away between them.
  assert.match(loader,/if\(step===4\|\|step===5\|\|\(step===6&&document\.body\.dataset\.previewGenerating==='1'\)\)\{pendingFromReferences=false;if\(cleanMode\(\)\)show\('preview'\);else hide\(\)/);
  assert.match(loader,/promptai:preview-stage/,'the screen says what the run is really doing');
  assert.match(app,/previewStage\(imagesOnly\?`Bild 1 von \$\{count\} wird erstellt\.`:"Briefing wird verarbeitet\."\)/);
  assert.match(app,/Bild \$\{Math\.min\(done\+1,total\)\} von \$\{total\} wird erstellt\./);
  assert.match(app,/previewStage\(`Bild 1 von \$\{total\} wird erstellt\.`,\{pin:true,ratio:0\}\)/,'the elapsed ticker must not overwrite the image stages');
  assert.match(app,/progressStages\[kind\]\?`\$\{progressStages\[kind\]\} · noch ca\./);
  // Nothing above the three results may look like the button that starts them.
  const gallery=html.indexOf('id="conceptGallery"'),controls=html.indexOf('class="preview-generation-controls"');
  assert.ok(gallery>0&&controls>gallery,'the regenerate control sits below the previews');
  assert.doesNotMatch(html,/<div class="preview-step-head">[\s\S]{0,200}preview-generation-controls/,'and no longer in the step head');
});

test('a loading screen always finishes its fill, and its headline is not clipped',async()=>{
  const loader=await text('transition-polish.js'),handoff=await text('mode-handoff-fix.js');
  // A passing sync() used to remove the login screen ~120ms after hide(), so it flashed by.
  assert.match(loader,/function hide\(immediate=false,force=false\)/);
  assert.match(loader,/if\(!force&&flashTimer&&box\.classList\.contains\('is-complete'\)\)return;/);
  assert.match(loader,/#promptWorkflowLoaderClose'\)\)\{userExited=true;pendingFromReferences=false;hide\(true,true\)/,'only the user may cut the blink short');
  assert.match(loader,/if\(!shownAt\|\|box\.classList\.contains\('is-complete'\)\)shownAt=Date\.now\(\);/,'the login screen gets the shared minimum showtime too');
  // background-clip:text paints the glyphs inside the line box: 1.02 cut the tails off g and p.
  for(const src of [loader,handoff])assert.match(src,/padding-bottom:\.06em;font-size:clamp\(31px,8vw,4[78]px\);line-height:1\.14/);
});

test('modules and skills reach the prompt in every mode, not only in the expert one',async()=>{
  const app=await text('app.js'),ui=await text('project-extras-ui.js'),html=await text('index.html');
  // Guided skipped step 4, so nothing was ever activated - an uploaded Claude/Codex skill did nothing.
  assert.match(app,/if\(state\.mode!=="expert"\)recommendModules\(true\)/);
  // "always active" was only applied when a dropdown in the library changed.
  assert.match(app,/function applyLibraryDefaults\(\)/);
  assert.match(app,/state\.selectedModuleIds=\[\];state\.selectedSkillIds=\[\];state\.recommendedModuleIds=\[\];\n    applyLibraryDefaults\(\);/,'a new project starts from the library defaults');
  assert.match(app,/window\.PromptAiProjectExtras=\{list:projectExtrasList,set:setProjectExtra,active:activeExtraNames\}/);
  // Never a silent activation: the confirmation names what travels with the briefing.
  assert.match(app,/Bausteine & Skills: \$\{activeExtraNames\(\)\.join\(', '\)\|\|'keine aktiv'\}/);
  assert.match(ui,/role="switch" aria-pressed/,'one switch per entry, on and off per project');
  assert.match(ui,/eine Skill-Datei aus Claude oder Codex hoch/,'an empty library says what to do');
  assert.match(html,/<dialog id="projectExtrasDialog"/);
  assert.match(html,/id="projectConfirmExtras"/);
});

test('the modes are named after what they do',async()=>{
  const html=await text('index.html'),start=await text('project-start-ui.js'),flow=await text('mode-flow-ui.js');
  assert.match(html,/data-mode="guided" class="active">Mit Rückfragen</);
  assert.match(html,/data-mode="auto">Ohne Rückfragen</);
  assert.match(html,/data-mode="expert">Selbst einstellen</);
  assert.match(start,/<b>Mit Rückfragen<\/b>/);
  assert.match(start,/<b>Ohne Rückfragen<\/b>/);
  assert.match(start,/<b>Selbst einstellen<\/b>/);
  assert.match(flow,/guided:\['Mit Rückfragen/);
  assert.doesNotMatch(html,/data-mode="[a-z]+"[^>]*>Geführt</,'the old names are gone from the switch');
});

test('a first-time visitor gets three sentences before the first empty field',async()=>{
  const intro=await text('welcome-intro-ui.js'),loader=await text('admin-console.js'),sw=await text('sw.js');
  assert.match(intro,/#gateGuestBtn,#gateSignUpPick,#signUpBtn,#startFreeBtn,#offerCta/,'shown on register and on free trial');
  assert.match(intro,/const SEEN_KEY='prompt-ai-intro-seen-v1'/);
  assert.match(intro,/if\(seen\(\)\)return;/,'once per device, never again');
  assert.match(intro,/#cookieBanner\[open\],#maintenanceDialog\[open\]/,'never on top of something that has to be answered first');
  assert.match(loader,/\.\/welcome-intro-ui\.js\?v=\d{8}-\d+/);
  assert.ok(sw.includes('/welcome-intro-ui.js'));
});

test('the footer year does not depend on an inline script at the end of a cached document',async()=>{
  const theme=await text('theme-init.js'),html=await text('index.html');
  assert.match(theme,/const setYear=\(\)=>\{const node=document\.getElementById\('currentYear'\)/);
  assert.match(theme,/addEventListener\('pageshow',setYear\)/);
  assert.doesNotMatch(html,/<span id="currentYear">2024<\/span>/,'the fallback is not a year from the past');
});

test('the settings sell a connection slot instead of showing key fields nobody may fill',async()=>{
  const ui=await text('settings-connections-ui.js'),html=await text('index.html'),access=await text('stability-ui.js');
  assert.match(ui,/Platz für eine eigene KI – 5,99 € \/ Monat/);
  assert.match(ui,/Ohne gebuchten Platz gibt es hier nichts einzutragen/);
  assert.match(ui,/const MAX_SLOTS=PROVIDERS\.length;/,'one key per provider per account, so a slot is a provider');
  assert.match(ui,/data-conn-name="\$\{index\}"/,'the visitor names the connection');
  assert.match(ui,/data-conn-provider="\$\{index\}"/,'and picks the provider behind it');
  // The provider cards are moved, not rebuilt, so app.js keeps its save/test/disconnect handlers.
  assert.match(ui,/if\(mount&&card\)mount\.appendChild\(card\)/);
  assert.match(ui,/if\(card&&card\.parentElement!==park\)park\.appendChild\(card\)/,'parked before innerHTML is rewritten, or the card is deleted');
  // GitHub publishing is Ultimate, and the note used to claim Pro.
  assert.match(ui,/Für die eigene GitHub-Verbindung ist ein Ultimate-Abo erforderlich\./);
  assert.match(ui,/const a=access\(\),allowed=a\.isAdmin\|\|a\.plan==='ultimate';/);
  assert.match(access,/apiKeySlots:Math\.max\(0,Number\(sub\.apiKeySlots\)\|\|0\)/,'the slot count has to reach the UI');
  assert.match(html,/id="userPreferenceSection"/);
});

test('the added settings all do something measurable',async()=>{
  const prefs=await text('user-preferences-ui.js'),app=await text('app.js');
  assert.match(prefs,/function applyColorScheme\(scheme\)/);
  assert.match(prefs,/html\.prompt-reduce-motion \*/,'reduced motion really switches animations off');
  assert.match(prefs,/localStorage\.clear\(\);sessionStorage\.clear\(\)/,'local deletion really deletes');
  assert.match(prefs,/if\(keep\)localStorage\.setItem\(THEME_KEY,keep\)/,'but keeps the chosen colour scheme');
  assert.match(prefs,/sessionStorage\.setItem\(START_KEY,'1'\)/,'"continue last project" uses the flag the workflow already knows');
  assert.match(app,/if\(window\.PromptAiPreferences&&window\.PromptAiPreferences\.confirmBeforePrompt===false\)return true;/);
});

test('the project stays identifiable: name on the tile, name in the top bar, price behind a lock',async()=>{
  const home=await text('home-entry-ui.js'),context=await text('project-context-ui.js');
  assert.match(home,/function lastProjectName\(\)/);
  assert.match(home,/Weiter mit „\$\{label\.length>38\?`\$\{label\.slice\(0,37\)\}…`:label\}“/);
  // A locked tile used to swallow the click without a word.
  assert.match(home,/if\(isFree\(\)\)\{e\.preventDefault\(\);e\.stopImmediatePropagation\(\);document\.querySelector\('#plansDialog'\)\?\.showModal\(\);return\}/);
  assert.match(context,/box\.id='topbarProject'/);
  assert.match(context,/function currentName\(\)/);
  assert.match(context,/\.topbar-project\.is-on\{display:flex;order:9/,'on a phone it becomes its own strip');
});

test('the library holds ten entries per kind in Pro and is open in Ultimate',async()=>{
  const app=await text('app.js');
  assert.match(app,/free:\{label:"Free",modes:\["guided"\],libraryItems:0,/);
  assert.match(app,/pro:\{label:"Pro",modes:\["guided","auto"\],libraryItems:10,/);
  assert.match(app,/ultimate:\{label:"Ultimate",modes:\["guided","auto","expert"\],libraryItems:Infinity,/);
  // Editing an existing entry is never blocked - the limit is about how much is stored.
  assert.match(app,/function libraryFull\(kind,editingId\)\{\n    if\(editingId\)return false;/);
  for(const kind of ['template','module','skill'])assert.ok(app.includes(`libraryFull('${kind}',state.editing.${kind})`),`${kind} is unchecked`);
  assert.match(app,/if\(libraryFull\('skill'\)\)continue;/,'the .md import respects the same limit');
  assert.match(app,/Lösche einen Eintrag, oder schalte mit Ultimate unbegrenzt viele frei\./);
});

test('a bought slot is the visitors own AI: their provider, their model, their version',async()=>{
  const ui=await text('settings-connections-ui.js'),app=await text('app.js'),router=await text('api/generate.js'),free=await text('server/free-prompt-v2.js');
  assert.match(ui,/data-conn-model="\$\{index\}"/,'the model name is typed, not picked from a fixed list');
  assert.match(ui,/data-conn-load="\$\{index\}"/,'and can be filled from the provider list');
  assert.match(ui,/\/api\/models\?provider=/);
  assert.match(ui,/function activeConnection\(\)/);
  assert.match(ui,/if\(!model\)return null;/,'a slot without a model never overrides the plan');
  // One place adds it to every AI request, so no route can forget it.
  assert.match(app,/const own=window\.PromptAiOwnConnection;/);
  assert.match(app,/useOwnApi:true,ownProvider:own\.provider,ownModel:own\.model/);
  // Server side: own connection first, plan profiles stay behind it as a fallback.
  assert.match(router,/function ownConnection\(body=\{\}\)/);
  assert.match(router,/!\/\^\[a-zA-Z0-9@\._:\/-\]\+\$\/\.test\(model\)\)return null;/,'the model string is validated before it is sent on');
  assert.match(router,/const chain=own\?\[own,\.\.\.planChain\]:planChain;/);
  assert.match(free,/if\(own\)profiles=\[own,\.\.\.profiles\];/);
  assert.match(free,/systemOnly:profile\.own!==true/,'the own slot resolves the account key, not the central one');
});

test('one brand layer owns the palette, and it is the last stylesheet to speak',async()=>{
  const brand=await text('brand-werkstatt.js'),console_=await text('admin-console.js'),sw=await text('sw.js');
  // The five blue families that used to hold their own hardcoded hex now point at one token.
  for(const name of ['--ui-blue','--prompt-blue','--prompt-v11-blue','--prompt-v2-blue','--accent'])
    assert.match(brand,new RegExp(`${name}:var\\(--wk-blue\\)`),`${name} must follow the brand token`);
  assert.match(brand,/--wk-blue:#2c4a5e;/,'Werkstatt is the chosen blue');
  assert.match(brand,/html\[data-theme="dark"\]\{[\s\S]{0,80}--wk-blue:#/,'dark mode gets its own value, not the light one');
  // Every earlier layer carries !important with up to four classes, so being last is not enough -
  // the prefix has to out-specify them or nothing changes.
  assert.match(brand,/const W='html:root body(\.prompt-unified-ui){5}'/);
  assert.ok((brand.match(/&&/g)||[]).length>40,'the rules are written against that prefix');
  // The AI-look properties are actively taken back, not just recoloured.
  assert.match(brand,/backdrop-filter:none!important/);
  assert.match(brand,/transform:none!important/);
  // It has to load last and stay last: dialogs append their styles when they first open.
  // It no longer has to be the last script: under the full redesign it stands down entirely
  // (see the redesign test), so what matters is only that it is still registered and loaded.
  assert.match(console_,/'\.\/brand-werkstatt\.js\?v=[^']+'/,'still registered as a critical script');
  assert.match(brand,/new MutationObserver\(install\)\.observe\(document\.head,\{childList:true\}\)/);
  assert.match(sw,/'\/brand-werkstatt\.js'/,'offline shell ships it too');
});

test('one industry classifier feeds the preview image, the concepts and the free prompt',async()=>{
  // Die Einordnung lag als kurze Regex-Kette nur in preview-image.js. Sie kannte fünf Fälle, und
  // `bau\b` traf "bau mir eine Website für einen Kosmetikladen" - der Bildauftrag verlangte
  // daraufhin Werkzeug im Kosmetikstudio.
  const {detectIndustry,industryBlock,INDUSTRIES}=(await import('../server/industry.js')).default
    ||await import('../server/industry.js');
  const industry=await import('../server/industry.js');
  const detect=industry.default?.detectIndustry||industry.detectIndustry;
  assert.equal(detect('bau mir eine website für einen kosmetikladen in lindhorst').key,'beauty','das Anweisungsverb darf die Branche nicht bestimmen');
  assert.equal(detect('website für ein bauunternehmen').key,'bau','ein echtes Bauunternehmen bleibt Bau');
  assert.equal(detect('Internetseite für meinen Handwerksbetrieb, Elektro').key,'handwerk');
  assert.equal(detect('erstelle mir eine seite für mein restaurant mit döner').key,'gastronomie');
  assert.equal(detect('Zahnarztpraxis in Köln').key,'gesundheit');
  assert.equal(detect('Maschinenbau Zulieferer').key,'industrie');
  assert.equal(detect('').key,'allgemein','ohne Text kein Ratespiel');
  // Jede Branche bringt Motiv, Pflichtbereiche und Tonalität mit - sonst unterscheiden sich zwei
  // Aufträge nur in der Überschrift.
  const list=industry.default?.INDUSTRIES||industry.INDUSTRIES;
  assert.ok(list.length>=18,'genug Branchen, um die Bandbreite abzudecken');
  for(const item of list)for(const field of ['key','label','match','subject','sections','tone'])
    assert.ok(item[field],`${item.key||'?'} ohne ${field}`);
  const preview=await text('server/preview-image.js'),free=await text('server/free-prompt-v2.js');
  assert.match(preview,/require\('\.\/industry'\)/,'das Vorschaubild nutzt dieselbe Quelle');
  assert.doesNotMatch(preview,/\|bau\\b\|/,'die alte, zu lockere Kette ist weg');
  assert.match(free,/require\('\.\/industry'\)/,'…und der freie Prompt auch');
  // Bei reinem Text, Code oder Recherche trägt die Branche nichts bei.
  assert.match(free,/const INDUSTRY_CATEGORIES=new Set\(\[/);
  assert.doesNotMatch(free,/INDUSTRY_CATEGORIES=new Set\(\[[^\]]*'text'/,'Text braucht keine Branche');
  assert.doesNotMatch(free,/INDUSTRY_CATEGORIES=new Set\(\[[^\]]*'code'/,'Code auch nicht');
});

test('the master prompt turns the chosen direction into a buildable component spec',async()=>{
  // Die Richtung nannte nur Wirkung (Stimmung, Layoutprinzip, Hero, Typografie, Palette). Was
  // daraus gebaut wird - Kopfzeile, Karten, Felder, Buttons, Fußzeile - blieb offen, und genau
  // darin gingen Vorschaubild und Ergebnis auseinander.
  const src=await text('app.js');
  assert.match(src,/function componentSpecBlock\(c,ctrl\)\{/);
  assert.match(src,/\$\{componentSpecBlock\(c,ctrl\)\}/,'der Abschnitt hängt an der ausgewählten Richtung');
  // Die Vorgabe leitet sich aus der Auswahl ab, statt fest verdrahtet zu sein.
  assert.match(src,/c\.navStyle==="logo-hamburger"/,'Kopfzeile folgt der Richtung');
  assert.match(src,/gefüllt in \$\{c\.palette\?\.\[2\]/,'der Primärbutton nimmt die Akzentfarbe der Palette');
  assert.match(src,/const density=Number\(ctrl\?\.density\)/,'der Rhythmus folgt dem Regler');
  assert.match(src,/const corners=/,'die Ecken folgen dem Charakter der Richtung');
  // Was der Nutzer wörtlich verlangt, schlägt die Vorgabe - sonst widerspricht sich der Prompt.
  assert.match(src,/deckungsgleich mit der Bildvorschau/);
  for(const part of ['Kopfzeile','Hero:','Karten und Flächen','Primärbutton','Formularfelder','Typografie:','Fußzeile:','Zustände','Mobil'])
    assert.ok(src.includes(part),part);
});

test('work dialogs use the page instead of clinging to the left edge',async()=>{
  // styles.css sets margin:0!important on these dialogs. A width cap on top of that produced a
  // left-aligned box with dead space on the right - the dialog has to fill the page instead.
  const css=await text('promptai-full-app-design.css');
  assert.match(css,/dialog\.library-dialog:not\(\.app-action-dialog\):not\(\.agent-launch-dialog\):not\(\.guest-gate\):not\(\.plans-dialog\)\{\s*width:100vw!important/,'the work dialogs fill the viewport');
  assert.match(css,/:not\(\.plans-dialog\)>\.dialog-frame\{\s*margin-left:auto!important;margin-right:auto!important/,'the frame inside stays centred');
  assert.match(css,/body dialog#legalDialog\{\s*width:100vw!important/,'the legal pages are pinned by their id elsewhere');
  assert.doesNotMatch(css,/width:min\(1480px,calc\(100vw - 72px\)\)!important/,'the old cap is gone');
});
test('the cookie notice is a full-width strip at the very bottom',async()=>{
  const css=await text('promptai-full-app-design.css');
  assert.match(css,/\.cookie-banner-box\{\s*width:100%!important;max-width:none!important/,'no floating card any more');
  assert.match(css,/border:0!important;border-top:1px solid var\(--line\)!important;border-radius:0!important/,'only the top edge is drawn');
});
test('the console starts in the arbeitsart the settings ask for',async()=>{
  const home=await text('promptai-home-final.js'),prefs=await text('user-preferences-ui.js'),html=await text('index.html');
  assert.match(html,/id="setDefaultCommandMode"/);
  assert.match(html,/id="setOutputLanguage"/);
  assert.match(prefs,/defaultCommandMode:'website',outputLanguage:'Deutsch'/);
  assert.match(home,/function preferredMode\(\)/);
  assert.match(home,/return commandModeLocked\(wish\)\?'website':wish/,'a locked mode never becomes the start mode');
  assert.match(home,/if\(!home\|\|home\.dataset\.modeTouched==='1'\)return/,'a manual pick wins over the preference');
});
test('the chosen result language reaches both the master prompt and the free prompt',async()=>{
  const app=await text('app.js'),free=await text('free-prompt-ui.js');
  assert.match(app,/function languageRequirement\(\)/);
  assert.match(app,/## 11\. UMSETZUNGSANFORDERUNGEN\\n\$\{languageRequirement\(\)\}/);
  assert.match(free,/language:window\.PromptAiPreferences\?\.outputLanguage\|\|'Deutsch'/);
});
test('the preferred target agent survives the profile that used to overwrite it',async()=>{
  const app=await text('app.js');
  assert.match(app,/const preferredAgent=window\.PromptAiPreferences\?\.defaultAgent;/);
  assert.match(app,/if\(preferredAgent&&AGENT_NAMES\[preferredAgent\]\)state\.targetAgent=preferredAgent/);
});
test('registering asks for the name that ends up in the client documents',async()=>{
  const html=await text('index.html'),app=await text('app.js'),cloud=await text('cloud.js');
  assert.match(html,/id="authSignUpFields" hidden/,'the extra fields stay out of the sign-in view');
  for(const id of ['authName','authCompany','authClientType','authLanguage'])assert.match(html,new RegExp(`id="${id}"`),id);
  assert.match(app,/function setAuthMode\(register\)/);
  assert.match(app,/el\.signUpBtn\.addEventListener\("click",\(\)=>\{if\(authRegisterMode\)signUp\(\);else setAuthMode\(true\)\}\)/,'the first click opens the form, the second creates the account');
  assert.match(app,/if\(!profile\.displayName\)\{el\.authMessage\.textContent="Bitte trag noch deinen Namen ein\."/);
  assert.match(cloud,/async signUp\(email, password, profile\)/);
  assert.match(cloud,/meta\.display_name = profile\.displayName/,'the name survives an unconfirmed email in the user metadata');
});
test('the first-run intro explains the console before the three steps',async()=>{
  const intro=await text('welcome-intro-ui.js');
  assert.match(intro,/class="intro-console"/);
  assert.match(intro,/Das Menü oben<\/b> legt die Arbeitsart fest/);
  assert.match(intro,/Das große Feld<\/b> ist alles, was du ausfüllen musst/);
  assert.match(intro,/Das Plus darunter<\/b> hängt Bilder, PDFs oder den Link/);
  assert.match(intro,/overflow-y:auto;overscroll-behavior:contain/,'the longer content scrolls instead of being cut off');
});

test('restoring a saved project state never lands on the old description form',async()=>{
  const src=await text('project-history.js');
  assert.match(src,/function restoreTarget\(row\)/);
  assert.match(src,/step:described\?Math\.max\(2,Math\.min\(8,reached\)\):1/,'a described project resumes past step 1');
  assert.match(src,/surface:described\?'workflow':'welcome'/,'without a description there is nothing to resume');
  assert.match(src,/write\(STATE_KEY,\{\.\.\.row\.state,currentStep:target\.step/,'the state carries the step, because it outranks the checkpoint');
});
test('the gap between start screen and briefing screen is covered',async()=>{
  const src=await text('promptai-loading-v2.js');
  assert.match(src,/html\.prompt-handoff-pending body>\*:not\(#promptBriefHandoff\):not\(#promptAppBoot\)\{visibility:hidden!important\}/);
  assert.match(src,/document\.documentElement\.classList\.remove\('prompt-handoff-pending'\)/,'lifted as soon as the briefing screen stands');
  assert.match(src,/setTimeout\(\(\)=>document\.documentElement\.classList\.remove\('prompt-handoff-pending'\),4000\)/,'and never left standing if it does not');
});
test('client documents read as prose and travel with the handoff package',async()=>{
  const app=await text('app.js');
  assert.match(app,/function joinList\(items,fallback=""\)/);
  assert.match(app,/Dieses Dokument fasst den abgestimmten Stand des Projekts/,'the brief opens with a sentence, not a field list');
  assert.match(app,/Im Vordergrund \$\{b\.understanding\.priorities\.length>1\?"stehen":"steht"\}/,'singular and plural are handled');
  assert.doesNotMatch(app,/\*\*Auftraggeber:\*\* \$\{client\.name\|\|"Noch einzutragen"\}/,'the old bold field rows are gone');
  assert.match(app,/'PROJEKTBERICHT\.md':buildProjectReport\(\)\};/,'the report is in the handoff zip');
  assert.match(app,/if\(planRules\(\)\.clientDocs\)\{files\['KUNDENBRIEFING\.md'\]=buildClientDocument\('brief'\);files\['UEBERGABE\.md'\]=buildClientDocument\('handover'\)\}/);
});

test('an opened settings section shows its last block instead of clipping it',async()=>{
  const css=await text('promptai-full-app-design.css');
  assert.match(css,/#settingsDialog \.settings-section,[\s\S]{0,200}?height:auto!important;max-height:none!important;overflow:visible!important/,'styles.css clipped the section with overflow:hidden');
  assert.match(css,/\.settings-danger-row\{\s*display:grid!important;grid-template-columns:minmax\(0,1fr\) auto!important/,'title, description and button are laid out, not run together');
});

test('the one-off purchase tops up the monthly budget instead of selling a single check',async()=>{
  const app=await text('app.js'),home=await text('promptai-home-final.js');
  // Der gekaufte Einzelcheck oeffnet denselben Weg wie der freie Monatslauf.
  assert.match(app,/const paidReview=state\.plan==="free" && !state\.isAdmin && \(state\.reviewCredits>0 \|\| freeAiRun\);/);
  assert.match(app,/const freeAiRun=state\.plan==="free" && !state\.isAdmin && cloudReady\(\) && budgetLeft\(\);/);
  assert.match(app,/if\(\(state\.engine!=="local"\|\|paidReview\) && state\.settings\.aiClarifications/,'a free account has no external generator, so the review never ran for it');
  assert.match(app,/function publishReviewCredits\(\)/);
  assert.match(app,/window\.dispatchEvent\(new CustomEvent\('promptai:credits'/);
  assert.match(home,/function creditNote\(\)/);
  assert.match(home,/1 gekaufte Prüfung – wird beim nächsten Projekt eingelöst/,'sonst sucht man einen Knopf, den es nicht gibt');
  // Aus dem Einzelcheck ist Monatsvorrat geworden - er passt zu jedem Tarif, alte Gutschriften
  // bleiben nutzbar, und der Kauf landet als Bonus im selben Budget.
  assert.match(app,/Monatsvorrat auffüllen · \$\{window\.PromptAiPrices\?\.topUp\|\|PRICE_FALLBACK\.topUp\}/);
  assert.match(app,/beginCheckout\('top_up'\)/);
  const hook=await text('api/stripe-webhook.js');
  assert.match(hook,/const TOP_UP_UNITS=750000/,'sonst untergraebt die Aufladung Ultimate');
  assert.match(hook,/product==='single_review'\|\|product==='top_up'\)await addBudgetTopUp/,'alte Käufe landen an derselben Stelle');
  assert.match(hook,/monthly_token_bonus:current\+TOP_UP_UNITS/);
});
test('the header menu button keeps its place when the notice dot appears',async()=>{
  const drawer=await text('promptai-nav-drawer.js');
  assert.doesNotMatch(drawer,/#topbarMenuToggle\.prompt-drawer-has-dot\{position:relative!important\}/,'that rule outranked the absolute placement and pushed the button out of the header');
  assert.match(drawer,/#topbarMenuToggle\.prompt-drawer-has-dot:after\{/,'the dot itself stays');
});
test('the notice dot means unseen, names its reason and clears on opening',async()=>{
  const core=await text('admin-console-core.js'),css=await text('promptai-full-app-design.css');
  assert.match(core,/const SEEN_KEY='prompt-ai-support-seen-v1'/);
  assert.match(core,/function unseenCount\(\)/);
  assert.match(core,/if\(button\.dataset\.adminTab==='support'\)markSupportSeen\(\)/,'opening the support tab is what marks it seen');
  assert.match(core,/tab\.dataset\.adminDot='1'/,'the reason is visible inside the console too');
  assert.match(css,/\.admin-tabs button\[data-admin-dot="1"\]:after/);
});
test('the start page runs to the bottom edge and keeps its diagonals on a phone',async()=>{
  const css=await text('promptai-full-app-design.css'),home=await text('promptai-home-final.js');
  assert.match(css,/html\.prompt-home-surface body>#promptFooter\{\s*margin-top:auto!important/);
  assert.match(css,/html\.prompt-home-surface body>\*\{flex-shrink:0!important\}/,'a flex column must not shrink its children below their content');
  assert.doesNotMatch(home,/html\.prompt-home-surface #promptFooter\{display:none!important\}/,'the footer was hidden on phones');
  assert.doesNotMatch(home,/@media\(max-width:700px\)\{html\.prompt-home-surface body:before\{display:none\}/,'the diagonals were switched off on phones');
});
test('the windows without a dialog-frame use the page as well',async()=>{
  const css=await text('promptai-full-app-design.css');
  assert.match(css,/dialog\.history-dialog,dialog\.project-mode-dialog,dialog\.simple-intake-dialog/);
  assert.match(css,/\)>:is\(\.history-frame,\.project-mode-frame,\.simple-intake-shell,\.free-prompt-shell/);
  assert.doesNotMatch(css,/previewLightbox[^}]*width:100vw/,'the lightbox stays a lightbox');
});
test('the result rating says what it still needs instead of doing nothing',async()=>{
  const src=await text('product-polish.js');
  assert.match(src,/\.outcome-learning\{display:block;/,'the block was invisible until a build was loaded');
  assert.match(src,/Zum Bewerten fehlt noch das gebaute Projekt/,'pressing the button used to return silently');
});

test('the attachment allowance sits at the right edge of its menu row',async()=>{
  const home=await text('promptai-home-final.js');
  assert.match(home,/\.prompt-attach-menu button\{display:flex;align-items:center;gap:10px;justify-content:space-between;width:100%/,'display:block had overridden the flex row, so margin-left:auto did nothing');
});
test('the account entry starts on the same line as every other menu row',async()=>{
  const drawer=await text('promptai-nav-drawer.js');
  assert.match(drawer,/function wrapAccountLabel\(\)/,'a bare text node cannot be aligned like the others');
  assert.match(drawer,/span\.className='prompt-drawer-account-label'/);
  // Als Zeile lief das Paar ueber den Knopf hinaus und stand mittig; als Spalte ist die Frage
  // erledigt, weil align-items die Ausrichtung bestimmt.
  assert.match(drawer,/#accountBtn:not\(\[hidden\]\)\{\s*display:flex!important;flex-direction:column!important/);
  assert.match(drawer,/align-items:flex-start!important;justify-content:center!important/);
  assert.match(drawer,/\.prompt-drawer-account-label\{\s*width:100%!important;text-align:left!important/);
});
test('the trial build picks its system AI from the plan instead of asking',async()=>{
  const src=await text('generator-selection.js'),app=await text('app.js');
  assert.match(src,/chooser\.hidden=!owner\(\)/,'only the admin sees the picker');
  assert.match(src,/window\.PromptAiSystemAI\?\.routeFor\?\.\('website'\)/,'the stored route applies on build');
  assert.doesNotMatch(app,/keine fertige Website und hier auch nicht als Datei zum Mitnehmen/,'that contradicted the ZIP button right below it');
  assert.match(app,/Das Ergebnis kannst du als ZIP mitnehmen oder zusammen mit Master-Prompt/);
});

test('generate is rate limited and size capped, guests included',async()=>{
  // assertQuota lets unauthenticated callers through by design, and the three guest runs are
  // counted in the browser only - so the endpoint was open to anyone with curl.
  const api=await text('api/generate.js');
  assert.match(api,/const \{rateLimit\}=require\('\.\.\/server\/rate-limit'\)/);
  assert.match(api,/key:'generate-guest',limit:24,windowMs:900000/,'a hard ceiling without an account');
  assert.match(api,/key:`generate-\$\{plan\}`,limit:perMinute,windowMs:60000/);
  assert.match(api,/const MAX_REQUEST_CHARS=600000/);
  assert.match(api,/res\.status\(413\)/,'a million characters get a clear answer, not a bill');
});
test('the connection test needs an account and cannot be hammered',async()=>{
  const api=await text('api/ai-test.js');
  assert.match(api,/if\(!rateLimit\(req,res,\{key:'ai-test',limit:10,windowMs:60000\}\)\) return;/);
  assert.match(api,/if\(!user\) return res\.status\(401\)/,'it resolves the central key, so it belongs behind a login');
});
test('the public config does not hand out raw provider errors',async()=>{
  const api=await text('api/config.js');
  assert.match(api,/function redactError\(value\)\{/);
  assert.match(api,/lastError:redactError\(x\.last_error\)/);
  assert.doesNotMatch(api,/lastError:String\(x\.last_error\|\|''\)/);
});
test('the start page and the workflow are never on screen together',async()=>{
  // Die Trennung selbst macht die :has()-Regel. Der eigentliche Fehler war, dass syncHome bei
  // unruhiger Seite gar nicht mehr lief: jede style-Aenderung startete die Entprellung neu, und
  // damit blieb prompt-home-surface auf dem Stand von vor Minuten stehen.
  const css=await text('promptai-full-app-design.css'),home=await text('promptai-home-final.js');
  assert.match(css,/body:has\(#workflowApp:not\(\[hidden\]\)\) #welcomePage\{display:none!important\}/);
  assert.match(home,/function homeVisible\(\)\{const page=\$\('#welcomePage'\);return Boolean\(page&&!page\.hidden/,'no circular dependency on the workflow any more');
  assert.match(home,/if\(!settleTimer\)settleDeadline=now\+400;/,'the debounce has a ceiling');
});
test('closing a running project asks first',async()=>{
  const src=await text('guided-clean-ui.js');
  assert.match(src,/Diesen Auftrag jetzt abbrechen und zur Startseite zurück\?/);
  assert.match(src,/cancelLabel:'Weiterarbeiten'/);
});
test('the plan chip stays on the right when the console meta row wraps',async()=>{
  const home=await text('promptai-home-final.js');
  assert.match(home,/<span class="prompt-plan-chip">/);
  assert.match(home,/\.prompt-command-meta>\.prompt-plan-chip\{order:10;margin-left:auto/);
});

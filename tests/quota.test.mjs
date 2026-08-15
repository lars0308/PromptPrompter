import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const text=p=>readFile(path.join(root,p),'utf8');

test('monthly quotas match the public Free Pro and Ultimate allowances',async()=>{
  const server=await text('server/quota.js'),ui=await text('usage-quota-ui.js');
  // The server additionally carries monthly_tokens as the internal cost guard; the countable
  // allowances the visitor sees are the same on both sides.
  for(const src of [server,ui]){
    assert.match(src,/free:\{free_prompts:10,website_generations:3,ai_previews:0/);
    assert.match(src,/pro:\{free_prompts:100,website_generations:25,ai_previews:50/);
    assert.match(src,/ultimate:\{free_prompts:500,website_generations:100,ai_previews:250/);
  }
  // Das Guthaben ist die Kostenbremse hinter den sichtbaren Zahlen - und es ist gesetzt.
  assert.match(server,/monthly_tokens:150000\}/);
  assert.match(server,/monthly_tokens:2500000\}/);
  assert.match(server,/monthly_tokens:6000000\}/);
  // Bilder und Rechenzeit tragen keine Tokens und zaehlen deshalb mit einem Gegenwert.
  assert.match(server,/const UNIT_EQUIVALENT=Object\.freeze\(\{'preview-image':5000,'sandbox-build':10000\}\)/);
});

test('existing generate endpoint exposes and enforces quota actions without another serverless function',async()=>{
  const router=await text('api/generate.js');
  for(const action of ['quota-summary','quota-check','quota-consume'])assert.ok(router.includes(action));
  assert.match(router,/action==='free-prompt'.*free_prompts/s);
  assert.match(router,/action==='preview-image'.*ai_previews/s);
  assert.match(router,/action==='concepts'.*websiteConceptRoute/s);
});

test('website generations are counted server-side only after a successful concept response',async()=>{
  const router=await text('api/generate.js'),ui=await text('usage-quota-ui.js');
  assert.match(router,/websiteConceptRoute/);
  assert.match(router,/captured\.state\.status<400/);
  assert.match(router,/consumeWebsiteGeneration\(req,keySource\)/);
  assert.match(ui,/watchWebsiteResult/);
  assert.match(ui,/concept-option/);
  assert.doesNotMatch(ui,/quotaApi\('quota-consume'/);
});

test('quota information is shown consistently in plan cards account and subscription management',async()=>{
  const ui=await text('usage-quota-ui.js'),loader=await text('admin-console.js'),sw=await text('sw.js');
  for(const token of ['Monatskontingent','Freie Prompt-Generierungen','Website-Generierungen','KI-Vorschauen','Dein verbleibendes Kontingent','subscriptionQuotaSection','plan-quota-summary','quotaSummaryText'])assert.ok(ui.includes(token),token);
  assert.doesNotMatch(ui,/quotaAccountMini/,'the Settings-dialog quota mini-card was removed along with the redundant Tarif & Funktionen section; quota now lives only in the plan cards and the Abonnement dialog');
  assert.match(ui,/\$\{q\.free_prompts\} Prompts/);
  assert.match(ui,/\$\{q\.website_generations\} Websites/);
  assert.match(ui,/\$\{q\.ai_previews\} KI-Vorschauen/);
  assert.match(ui,/KI-Vorschauen nicht enthalten/);
  assert.match(loader,/usage-quota-ui\.js\?v=\d{8}-\d+/);
  assert.ok(sw.includes('usage-quota-ui.js'));
});

test('quota queries only load relevant successful monthly usage events',async()=>{
  const server=await text('server/quota.js');
  assert.match(server,/success=eq\.true/);
  assert.match(server,/action=in\.\(/);
  assert.match(server,/created_at=gte/);
  assert.match(server,/created_at=lt/);
});

test('everything about tokens lives in one admin area: consumption, plan budgets and extra tokens',async()=>{
  const ui=await text('admin-tokens-ui.js'),loader=await text('admin-console.js'),sw=await text('sw.js'),html=await text('index.html'),core=await text('admin-console-core.js');
  assert.match(ui,/tab\.dataset\.adminTab='tokens'/);
  assert.match(ui,/window\.addEventListener\('promptai:admin-data'/,'one request feeds every admin console');
  for(const part of ['adminTokenStats','adminTokenBudgets','adminTokenModels','adminTokenActions','adminTokenAccounts','adminTokenDays'])assert.ok(ui.includes(part),part);
  assert.match(ui,/action:'save-token-budgets'/);
  assert.match(ui,/action:'set-token-bonus'/);
  assert.match(ui,/SPARMODUS/,'an account running on the cheapest AI is visible as such');
  assert.match(loader,/\.\/admin-tokens-ui\.js\?v=\d{8}-\d+/);
  assert.ok(sw.includes('/admin-tokens-ui.js'));
  // The budgets have exactly one owner now, so saving the countable quotas cannot reset them.
  assert.doesNotMatch(html,/quotaFreeMonthlyTokens|quotaProMonthlyTokens|quotaUltimateMonthlyTokens/);
  assert.match(core,/monthly_tokens:Math\.max\(0,Number\(stored\.monthly_tokens\)\|\|0\)/);
});

test('token budgets and the extra tokens of a single account are saved on their own',async()=>{
  const action=await text('api/admin-action.js'),overview=await text('api/admin-overview.js'),server=await text('server/quota.js'),migration=await text('supabase/migrations/20260815_add_token_bonus.sql');
  assert.match(action,/action==='save-token-budgets'/);
  assert.match(action,/action==='set-token-bonus'/);
  assert.match(action,/Math\.min\(2000000000,Number\(plans\[plan\]\)\|\|0\)/,'budgets are clamped');
  assert.match(migration,/add column if not exists monthly_token_bonus integer not null default 0/);
  assert.match(server,/const bonus=await tokenBonus\(user\.id\),limit=planLimit\+bonus;/,'extra tokens postpone the downgrade');
  assert.match(overview,/monthly_token_bonus/);
  assert.match(overview,/tokenEvents,tokenPeriod/,'the token area counts the running calendar month');
  assert.match(overview,/total_tokens=gt\.0&created_at=gte\./);
});

test('administrators can test without being blocked while normal accounts are enforced',async()=>{
  const server=await text('server/quota.js');
  assert.match(server,/!entitlement\.isAdmin/);
  assert.match(server,/summary\.isAdmin/);
  assert.match(server,/MONTHLY_QUOTA_EXHAUSTED/);
});

test('own calls count half, own tokens not at all',async()=>{
  const quota=await text('server/quota.js'),usage=await text('server/usage.js'),router=await text('api/generate.js'),migration=await text('supabase/migrations/20260815_add_usage_key_source.sql');
  assert.match(migration,/add column if not exists key_source text not null default 'system'/);
  assert.match(usage,/key_source:event\.keySource==='account'\?'account':'system'/);
  // Two runs on the visitor's own key use up one unit of the monthly allowance.
  assert.match(quota,/const OWN_KEY_WEIGHT=0\.5;/);
  assert.match(quota,/const rowWeight=row=>row\?\.key_source==='account'\?OWN_KEY_WEIGHT:1;/);
  assert.match(quota,/metricResult\(limits\[key\],Math\.floor\(counts\[key\]\)\)/,'halves never cost a whole unit');
  // The budget exists to cap our cost, so tokens the visitor paid for are excluded entirely.
  assert.match(quota,/key_source=neq\.account/);
  assert.match(router,/const keySource=String\(captured\.state\.headers/,'the bookkeeping event knows whose key answered');
});

test('the website build is Ultimate, on the client and on the server',async()=>{
  const app=await text('app.js'),core=await text('server/generate-core.js'),ui=await text('website-build-ui.js'),home=await text('home-entry-ui.js');
  assert.match(app,/pro:\{label:"Pro"[^}]*zip:false/,'Pro no longer carries the build');
  assert.match(app,/ultimate:\{label:"Ultimate"[^}]*zip:true/);
  assert.match(core,/if\(entitlement\.plan!=='ultimate'&&!entitlement\.isAdmin\)return res\.status\(403\)/);
  assert.match(core,/Der Website-Probelauf ist in Ultimate enthalten\./);
  assert.match(ui,/const isLocked=\(\)=>\{const a=access\(\);return !a\.isAdmin&&a\.plan!=='ultimate'\}/);
  assert.match(home,/'Probelauf','Dein offenes Projekt einmal bauen lassen – ansehen, als ZIP mitnehmen oder ins Repository legen\.',false,'ULTIMATE'/);
});

test('a connection slot folds, carries its own name and says what it is used for',async()=>{
  const ui=await text('settings-connections-ui.js'),access=await text('stability-ui.js');
  assert.match(ui,/<details class="conn-slot"/,'one fold per key instead of five open forms');
  assert.match(ui,/const title=String\(saved\[`name\$\{index\}`\]\|\|''\)\.trim\(\)\|\|`API-Key \$\{index\+1\}`;/);
  for(const use of ['text','image','website'])assert.ok(ui.includes(`purpose('${use}'`),`${use} cannot be assigned`);
  assert.match(ui,/setName\(`use\$\{index\}`,chosen\.join\(','\)\)/);
  assert.match(ui,/uses\}/,'the purposes travel with the connection');
  // Ultimate brings two slots without buying anything.
  assert.match(access,/\+\(plan==='ultimate'\|\|isOwner\?2:0\)/);
  assert.match(ui,/function loginRow\(\)/,'the login hint follows the real session');
});

test('every save says so',async()=>{
  const toast=await text('save-toast-ui.js'),loader=await text('admin-console.js'),sw=await text('sw.js');
  assert.match(toast,/node\.className='save-toast'/);
  assert.match(toast,/const SKIP=/,'delete and checkout keep their own feedback');
  assert.match(toast,/auth-message\.error/,'a failed save never reports success');
  assert.match(loader,/\.\/save-toast-ui\.js\?v=\d{8}-\d+/);
  assert.ok(sw.includes('/save-toast-ui.js'));
});

test('the Probelauf builds the open project and lets the result be taken along',async()=>{
  const html=await text('index.html'),ui=await text('website-build-ui.js'),app=await text('app.js'),gen=await text('generator-selection.js'),home=await text('home-entry-ui.js');
  // It says what it is, and what it is not.
  assert.match(html,/<span>PROBELAUF<\/span><h2>Briefing zur Probe bauen lassen<\/h2>/);
  assert.match(html,/keine fertige Website\./,'es bleibt ein Probelauf, kein fertiges Produkt');
  assert.match(html,/als ZIP mitnehmen oder es in ein GitHub-Repository legen/,'…aber das Ergebnis darf mit');
  assert.match(html,/id="websiteBuildProject"/,'which project is being built has to be visible');
  assert.match(ui,/function projectLine\(\)/);
  // Zwei Wege aus dem Probelauf heraus: ZIP nach Tarif, Repository nach Tarif.
  assert.match(app,/el\.downloadGeneratedWebsiteBtn\.hidden=!rules\.zip\|\|!state\.generatedWebsite\?\.files/,'die ZIP-Schaltfläche gehört zum Tarif und braucht ein gebautes Paket');
  assert.match(app,/if\(el\.downloadGeneratedWebsiteBtn\)el\.downloadGeneratedWebsiteBtn\.hidden=!planRules\(\)\.zip;/,'nach dem Bauen erscheint sie');
  assert.match(app,/if\(el\.publishGithubBtn\)el\.publishGithubBtn\.hidden=!rules\.github;/);
  // Die separate Website-ZIP der Schrittseite bleibt aus - sie ist ein anderer Weg.
  assert.match(app,/if\(el\.downloadWebsiteZipBtn\)el\.downloadWebsiteZipBtn\.hidden=true;/);
  assert.match(gen,/Das Ergebnis kannst du als ZIP mitnehmen oder in ein Repository legen/);
  assert.match(home,/'Probelauf','Dein offenes Projekt einmal bauen lassen – ansehen, als ZIP mitnehmen oder ins Repository legen\.'/);
});

test('the half-counting rule is stated where a slot is bought, not only on the plan card',async()=>{
  const ui=await text('settings-connections-ui.js'),html=await text('index.html');
  assert.match(ui,/Aufrufe über deine eigene Verbindung zählen nur halb aufs Monatskontingent/);
  assert.match(ui,/zwei davon verbrauchen eine Einheit, deine Tokens gar nichts/);
  assert.match(ui,/Aufrufe über eigene Verbindungen zählen nur halb aufs Kontingent\./,'and again when buying another one');
  assert.match(html,/Eigene Aufrufe zählen nur <b>halb<\/b> aufs Kontingent/,'plus on the Ultimate card');
});

test('the repository gets the briefing, not only the build, and the page can be looked at',async()=>{
  const app=await text('app.js'),api=await text('api/github-publish.js'),html=await text('index.html');
  // Whoever opens the repository later needs the order, not only one build's output.
  assert.match(app,/'MASTER-PROMPT\.md':el\.masterPrompt\.value,/);
  assert.match(app,/'SEITENSTRUKTUR\.md':structureDocument\(\),/);
  assert.match(app,/'PROJEKT-QUELLEN\.md':attachmentPromptBlock\(\)/);
  assert.match(app,/const wantsPages=Object\.keys\(files\)\.some\(name=>\/\(\^\|\\\/\)index\\\.html\$\/i\.test\(name\)\)/,'Pages only for something that has an index.html');
  assert.match(api,/async function enablePages\(token,fullName,branch\)/);
  assert.match(api,/return \{url:'',enabled:false,error:/,'a failed Pages activation never blocks the upload');
  assert.match(api,/Object\.entries\(files\)\.slice\(0,40\)/,'the briefing files need room next to the build');
  assert.match(html,/In GitHub-Repository legen/);
  assert.match(html,/<li><b>GitHub:<\/b> Repositories ansehen, neue anlegen/);
});

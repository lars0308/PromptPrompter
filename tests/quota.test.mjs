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
  assert.match(server,/monthly_tokens:0\}/,'no token limit until an administrator sets one');
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
  assert.match(router,/consumeWebsiteGeneration\(req\)/);
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

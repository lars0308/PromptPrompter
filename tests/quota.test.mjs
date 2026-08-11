import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const text=p=>readFile(path.join(root,p),'utf8');

test('monthly quotas match the public Free Pro and Ultimate allowances',async()=>{
  const server=await text('server/quota.js'),ui=await text('usage-quota-ui.js');
  for(const src of [server,ui]){
    assert.match(src,/free:\{free_prompts:10,website_generations:3,ai_previews:0\}/);
    assert.match(src,/pro:\{free_prompts:100,website_generations:25,ai_previews:50\}/);
    assert.match(src,/ultimate:\{free_prompts:500,website_generations:100,ai_previews:250\}/);
  }
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
  assert.match(loader,/usage-quota-ui\.js\?v=20260811-1/);
  assert.ok(sw.includes('usage-quota-ui.js'));
});

test('quota queries only load relevant successful monthly usage events',async()=>{
  const server=await text('server/quota.js');
  assert.match(server,/success=eq\.true/);
  assert.match(server,/action=in\.\(/);
  assert.match(server,/created_at=gte/);
  assert.match(server,/created_at=lt/);
});

test('administrators can test without being blocked while normal accounts are enforced',async()=>{
  const server=await text('server/quota.js');
  assert.match(server,/!entitlement\.isAdmin/);
  assert.match(server,/summary\.isAdmin/);
  assert.match(server,/MONTHLY_QUOTA_EXHAUSTED/);
});

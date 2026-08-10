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
  assert.match(router,/action==='concepts'.*website_generations/s);
});

test('website generations count only after a usable preview result',async()=>{
  const ui=await text('usage-quota-ui.js');
  assert.match(ui,/watchWebsiteResult/);
  assert.match(ui,/concept-option/);
  assert.match(ui,/quota-consume/);
  assert.match(ui,/website_generations/);
});

test('quota information is shown in plan cards account and subscription management',async()=>{
  const ui=await text('usage-quota-ui.js'),loader=await text('admin-console.js'),sw=await text('sw.js');
  for(const token of ['Monatskontingent','Freie Prompt-Generierungen','Website-Generierungen','KI-Vorschauen','Dein verbleibendes Kontingent','quotaAccountMini','subscriptionQuotaSection'])assert.ok(ui.includes(token),token);
  assert.ok(loader.includes('usage-quota-ui.js'));
  assert.ok(sw.includes('usage-quota-ui.js'));
});

test('administrators can test without being blocked while normal accounts are enforced',async()=>{
  const server=await text('server/quota.js');
  assert.match(server,/!entitlement\.isAdmin/);
  assert.match(server,/summary\.isAdmin/);
  assert.match(server,/MONTHLY_QUOTA_EXHAUSTED/);
});

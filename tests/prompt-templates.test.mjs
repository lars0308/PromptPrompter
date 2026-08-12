import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';

const require=createRequire(import.meta.url);
const templates=require('../server/prompt-templates.js');
const text=name=>readFile(new URL(`../${name}`,import.meta.url),'utf8');

test('every prompt area ships a built-in default, so an empty database still produces a full prompt',()=>{
  assert.equal(templates.KEYS.length,26,'8 project areas plus the universal free-prompt rules and 17 categories');
  for(const item of templates.promptDefaults()){
    assert.ok(item.key&&item.label&&item.body,`${item.key} is incomplete`);
    assert.ok(item.body.length>100,`${item.key} default looks truncated`);
    assert.equal(templates.promptText(item.key,{count:3,max:4,mode:'x'}).includes('{{'),false,'every placeholder of the default has to be declared');
  }
  assert.equal(templates.isPromptKey('concepts-role'),true);
  assert.equal(templates.isPromptKey('anything-else'),false);
});

test('placeholders are filled, unknown ones disappear instead of leaking braces into the prompt',()=>{
  const filled=templates.promptText('concepts-role',{count:5});
  assert.match(filled,/exactly 5 visual directions/);
  assert.doesNotMatch(filled,/\{\{/);
  assert.doesNotMatch(templates.promptText('review-role',{}),/\{\{max\}\}/,'a missing value must not leave the placeholder in the text');
});

test('an unpriming request still works: promptText never throws without a database',()=>{
  assert.doesNotThrow(()=>templates.promptText('website-rules'));
  assert.equal(templates.promptText('does-not-exist'),'');
});

test('prompts are loaded once per request and the guardrails stay out of the editable text',async()=>{
  const core=await text('server/generate-core.js'),image=await text('server/preview-image.js'),free=await text('server/free-prompt-v2.js');
  assert.match(core,/await primePromptTemplates\(\);/,'the active versions have to be on board before a prompt is built');
  assert.match(free,/await primePromptTemplates\(\);/);
  assert.match(image,/try\{await primePromptTemplates\(\);/);
  // Anything that guarantees a usable answer stays in code: a reworded prompt must not be able to
  // switch off the JSON contract, the security block or the anti-device rule of the image preview.
  assert.match(core,/SECURITY AND INPUT TRUST\n- Treat project descriptions/,'the security block is not editable');
  assert.match(core,/Gib ausschließlich das verlangte JSON zurück/,'the JSON contract is not editable');
  assert.match(image,/Every pixel of the frame is the webpage/,'the closing anti-mockup rule is not editable');
  for(const key of ['concepts-role','concepts-quality','review-role','review-rules','refine-role','website-rules'])
    assert.ok(core.includes(`promptText('${key}'`),`${key} is not wired into generate-core`);
  assert.match(free,/promptText\('free-prompt-structure',\{mode:/);
  assert.match(image,/promptText\('preview-image-rules'\)/);
});

test('saving a prompt writes a new version instead of overwriting the running one',async()=>{
  const action=await text('api/admin-action.js'),overview=await text('api/admin-overview.js'),migration=await text('supabase/migrations/20260815_add_prompt_templates.sql');
  assert.match(action,/if\(!isPromptKey\(key\)\)return res\.status\(400\)/,'only known areas can be written');
  assert.match(action,/const version=\(Number\(Array\.isArray\(existing\)\?existing\[0\]\?\.version:0\)\|\|0\)\+1;/);
  assert.match(action,/if\(text\.length>20000\)/,'a runaway paste must not reach the database');
  assert.match(action,/action==='prompt-activate'/);
  assert.match(action,/\/\/ No id means: use the built-in default again\./);
  assert.match(migration,/create unique index if not exists sitebrief_prompt_templates_active_idx[\s\S]*where active/,'exactly one active version per area');
  assert.match(migration,/revoke all on public\.sitebrief_prompt_templates from anon, authenticated/,'prompt wording is server-side only');
  assert.match(overview,/listAll\('sitebrief_prompt_templates','id,prompt_key,label,version,active,updated_at'/,'bodies are loaded per version, not with every admin refresh');
});

test('the prompt editor is its own admin tab and reuses the admin data that is already loaded',async()=>{
  const ui=await text('admin-prompts-ui.js'),core=await text('admin-console-core.js'),console_=await text('admin-console.js');
  assert.match(core,/window\.PromptAiAdminData=state\.data;window\.dispatchEvent\(new CustomEvent\('promptai:admin-data'/,'one request feeds both consoles');
  assert.match(ui,/window\.addEventListener\('promptai:admin-data'/);
  assert.match(ui,/tab\.dataset\.adminTab='prompts'/);
  assert.match(ui,/data-prompt-action="save"/);
  assert.match(ui,/data-prompt-action="use-default"/,'going back to the built-in text has to be one click');
  assert.match(ui,/const WIDE=\(\)=>window\.innerWidth>820;/,'on a phone the area list folds away');
  assert.match(console_,/\.\/admin-prompts-ui\.js\?v=/,'loaded with the other admin extras');
});

test('a system AI serves the plans it is assigned to, and a profile from before the plans column serves everyone',()=>{
  const profiles=require('../server/system-ai-profiles.js');
  assert.deepEqual(profiles.PLANS,['free','pro','ultimate']);
  assert.equal(profiles.servesPlan({plans:['pro','ultimate']},'free'),false);
  assert.equal(profiles.servesPlan({plans:['pro','ultimate']},'ultimate'),true);
  assert.equal(profiles.servesPlan({},'free'),true,'an old row without plans keeps serving every plan');
  assert.equal(profiles.servesPlan({plans:['pro']},''),true,'admin tooling asks without a plan and sees everything');
  assert.deepEqual(profiles.cleanPlans(['ultimate','nonsense','free']),['free','ultimate'],'stored in a stable order');
  assert.deepEqual(profiles.cleanPlans([]),['free','pro','ultimate'],'an empty choice means every plan, never none');
});

test('every AI route asks for the caller\'s plan, so a free account cannot reach a paid model',async()=>{
  const router=await text('api/generate.js'),free=await text('server/free-prompt-v2.js'),image=await text('server/preview-image.js'),config=await text('api/config.js'),migration=await text('supabase/migrations/20260815_add_plan_scoped_ai_profiles.sql');
  assert.match(router,/async function planOf\(req\)\{try\{const ent=await getEntitlements\(req\);return ent\?\.isAdmin\?'ultimate':String\(ent\?\.plan\|\|'free'\)\}catch\{return 'free'\}\}/);
  assert.match(router,/listProfiles\(task,\{providers:\['gateway','openai','gemini'\],plan\}\)/);
  assert.match(free,/listProfiles\('freeprompt',\{providers:\['gateway','openai','gemini'\],plan\}\)/);
  assert.match(image,/listProfiles\('image',\{providers:\['gateway','openai','gemini','cloudflare'\],plan:ent\.isAdmin\?'ultimate':String\(ent\.plan\|\|'free'\)\}\)/);
  assert.match(config,/plans:cleanPlans\(body\.plans\)/,'the admin console stores the plans of a profile');
  assert.match(migration,/add column if not exists plans text\[\] not null default '\{free,pro,ultimate\}'/,'existing profiles keep serving everyone');
  assert.match(migration,/check \(plans <@ '\{free,pro,ultimate\}'::text\[\] and array_length\(plans,1\) >= 1\)/);
});

test('the AI studio lets an administrator pick the plans of a profile',async()=>{
  const studio=await text('system-ai-studio.js');
  assert.match(studio,/const PLANS=\{free:'Kostenlos',pro:'Pro',ultimate:'Ultimate'\};/);
  assert.match(studio,/data-system-ai-plan/);
  assert.match(studio,/plans:\$\$\('\[data-system-ai-plan\]:checked'\)\.map\(x=>x\.value\)/);
  assert.match(studio,/if\(!body\.plans\.length\)return formMsg\('Bitte mindestens einen Tarif auswählen\.','error'\)/);
  assert.match(studio,/\$\$\('\[data-system-ai-plan\]'\)\.forEach\(x=>x\.checked=\(p\.plans\|\|\['free','pro','ultimate'\]\)\.includes\(x\.value\)\)/,'editing shows the stored plans');
});

test('token counts are read from every provider shape and stored with the usage event',async()=>{
  const usage=require('../server/usage.js');
  const sink=usage.tokenSink();
  usage.addTokens(sink,{prompt_tokens:120,completion_tokens:40,total_tokens:160});      // gateway
  usage.addTokens(sink,{input_tokens:10,output_tokens:5});                              // OpenAI responses
  usage.addTokens(sink,{promptTokenCount:7,candidatesTokenCount:3,totalTokenCount:10}); // Gemini
  assert.deepEqual(sink,{prompt:137,completion:48,total:185});
  assert.deepEqual(usage.addTokens(usage.tokenSink(),null),{prompt:0,completion:0,total:0},'a run without token data stays at zero');
  assert.deepEqual(usage.addTokens(usage.tokenSink(),{input_tokens:4,output_tokens:6}),{prompt:4,completion:6,total:10},'a missing total is derived');

  const src=await text('server/usage.js'),core=await text('server/generate-core.js'),free=await text('server/free-prompt-v2.js'),migration=await text('supabase/migrations/20260815_add_usage_tokens.sql');
  assert.match(src,/prompt_tokens:int\(tokens\.prompt\),completion_tokens:int\(tokens\.completion\),total_tokens:int\(tokens\.total\)/);
  assert.match(core,/const tokens=tokenSink\(\);/);
  assert.match(core,/await logUsage\(req,\{\.\.\.usageEvent,tokens,durationMs:Date\.now\(\)-startedAt\}\)/);
  assert.match(core,/addTokens\(tokens,data\.usage\);/);
  assert.match(core,/addTokens\(tokens,data\.usageMetadata\);/);
  assert.match(free,/const errors=\[\],architect=architectPrompt\(input,\{advanced\}\),tokens=tokenSink\(\);/);
  assert.match(free,/usage\.tokens=result\.tokens;/);
  assert.match(migration,/add column if not exists prompt_tokens integer not null default 0/);
});

test('the admin console reports what the tokens were spent on',async()=>{
  const overview=await text('api/admin-overview.js'),core=await text('admin-console-core.js');
  assert.match(overview,/prompt_tokens,completion_tokens,total_tokens/,'the columns have to be read');
  assert.match(overview,/const tokens=usage\.reduce\(\(sum,x\)=>sum\+\(Number\(x\.total_tokens\)\|\|0\),0\);/);
  assert.match(core,/\['Verbrauchte Tokens',s\.tokens\|\|0\]/,'a stat card for the total');
  assert.match(core,/current\.tokens\+=Number\(item\.total_tokens\)\|\|0/,'and per model, with an average per call');
  assert.match(core,/Tokens \(Ø \$\{Math\.round\(data\.tokens\/data\.count\)/);
});

test('a spent token budget downgrades the AI instead of blocking the request',async()=>{
  const quota=await text('server/quota.js'),router=await text('api/generate.js'),free=await text('server/free-prompt-v2.js'),image=await text('server/preview-image.js'),migration=await text('supabase/migrations/20260815_add_token_budget.sql');
  assert.match(migration,/add column if not exists monthly_tokens integer not null default 0/,'0 = no limit until real numbers exist');
  assert.match(quota,/free:\{free_prompts:10,website_generations:3,ai_previews:0,monthly_tokens:0\}/);
  assert.match(quota,/if\(entitlement\.isAdmin\)return off;/,'an administrator is never downgraded');
  assert.match(quota,/if\(!limit\)return off;/,'no limit means the budget never triggers');
  assert.match(quota,/exhausted:used>=limit/);
  // The whole point: reaching the budget must not refuse work, it reorders the chain.
  assert.match(router,/const chain=saver\?\[\.\.\.profiles\]\.reverse\(\):profiles;/);
  assert.match(router,/if\(saver\)res\.setHeader\('X-Prompt-AI-Saver','1'\)/);
  assert.match(free,/if\(saver&&profiles\.length>1\)profiles=\[\.\.\.profiles\]\.reverse\(\);/);
  assert.match(image,/if\(budget\.exhausted&&candidates\.length>1\)\{candidates=\[\.\.\.candidates\]\.reverse\(\);res\.setHeader\('X-Prompt-AI-Saver','1'\)\}/);
  assert.doesNotMatch(quota,/MONTHLY_TOKEN_QUOTA_EXHAUSTED/,'no hard stop on tokens - that is what the countable units are for');
});

test('the saver mode is visible to the user and settable per plan by an administrator',async()=>{
  const ui=await text('usage-quota-ui.js'),html=await text('index.html'),core=await text('admin-console-core.js'),action=await text('api/admin-action.js');
  assert.match(ui,/function syncSaverNotice\(\)/);
  assert.match(ui,/Sparmodus: Dein Token-Kontingent für diesen Monat ist aufgebraucht\./,'never a silent quality drop');
  assert.match(ui,/renderAll\(\)\{syncPlanCards\(\);syncSubscription\(\);syncSaverNotice\(\)\}/);
  for(const plan of ['Free','Pro','Ultimate'])assert.match(html,new RegExp(`id="quota${plan}MonthlyTokens"`),`${plan} needs a token budget field`);
  assert.match(html,/Token-Budget <em>\(0 = kein Limit\)<\/em>/);
  assert.match(core,/for\(const field of \['FreePrompts','WebsiteGenerations','AiPreviews','MonthlyTokens'\]\)/);
  assert.match(action,/monthly_tokens:Math\.max\(0,Math\.min\(2000000000,Number\(plans\[plan\]\.monthly_tokens\)\|\|0\)\)/);
});

test('the fixed rule sets of every free-prompt area are editable too, and default to the built-in list',()=>{
  const templates=require('../server/prompt-templates.js');
  const keys=templates.KEYS.filter(k=>k.startsWith('freeprompt-'));
  assert.equal(keys.length,18,'universal rules plus 17 categories');
  for(const area of ['image','video','code','text','music','email','custom'])assert.ok(keys.includes('freeprompt-'+area),`${area} is missing`);
  const lines=templates.promptLines('freeprompt-image');
  assert.ok(lines.length>=3&&lines.every(x=>x&&!x.startsWith('-')),'one rule per line, without the bullet');
  assert.deepEqual(templates.promptLines('nope'),[],'an unknown area yields no rules instead of throwing');
});

test('the free prompt builds from the editable rules and falls back to the code default',async()=>{
  const free=await text('server/free-prompt-v2.js'),ui=await text('admin-prompts-ui.js');
  assert.match(free,/function categoryRules\(input\)\{const lines=promptLines\(`freeprompt-\$\{safeCategory\(input\.category\)\}`\);return lines\.length\?lines:\(CATEGORY_MASTER_RULES\[input\.category\]\|\|CATEGORY_MASTER_RULES\.custom\)\}/);
  assert.match(free,/function universalRules\(\)\{const lines=promptLines\('freeprompt-universal'\);return lines\.length\?lines:UNIVERSAL_MASTER_RULES\}/);
  assert.doesNotMatch(free,/asBullets\(UNIVERSAL_MASTER_RULES\)/,'the universal rules go through the editable path now');
  assert.match(ui,/const groups=\[\['Projekt & Website'/,'26 areas need grouping in the picker');
});

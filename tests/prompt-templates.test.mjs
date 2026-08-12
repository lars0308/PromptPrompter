import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';

const require=createRequire(import.meta.url);
const templates=require('../server/prompt-templates.js');
const text=name=>readFile(new URL(`../${name}`,import.meta.url),'utf8');

test('every prompt area ships a built-in default, so an empty database still produces a full prompt',()=>{
  assert.equal(templates.KEYS.length,8);
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

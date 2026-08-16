/**
 * Live role audit. No endpoint in this script mutates production data.
 *
 * Required environment variables:
 *   PROMPT_AI_FREE_TOKEN, PROMPT_AI_PRO_TOKEN,
 *   PROMPT_AI_ULTIMATE_TOKEN, PROMPT_AI_ADMIN_TOKEN
 * Optional: PROMPT_AI_BASE_URL (defaults to https://www.prompt-ai.app)
 */
import assert from 'node:assert/strict';

const base=String(process.env.PROMPT_AI_BASE_URL||'https://www.prompt-ai.app').replace(/\/$/,'');
const roles={
  guest:'',
  free:process.env.PROMPT_AI_FREE_TOKEN||'',
  pro:process.env.PROMPT_AI_PRO_TOKEN||'',
  ultimate:process.env.PROMPT_AI_ULTIMATE_TOKEN||'',
  admin:process.env.PROMPT_AI_ADMIN_TOKEN||''
};
const required=['free','pro','ultimate','admin'],missing=required.filter(role=>!roles[role]);
if(missing.length){
  console.error(`Live-Rollentest nicht gestartet. Fehlende Umgebungsvariablen: ${missing.map(role=>`PROMPT_AI_${role.toUpperCase()}_TOKEN`).join(', ')}`);
  process.exit(2);
}

async function request(path,{method='GET',token='',body}={}){
  const response=await fetch(`${base}${path}`,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{}) ,...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={text:text.slice(0,300)}}
  return {status:response.status,data};
}
function denied(status){return status===401||status===403}
const failures=[];
async function check(name,fn){try{await fn();console.log(`✓ ${name}`)}catch(error){failures.push(`${name}: ${error.message}`);console.error(`✗ ${name}: ${error.message}`)}}

for(const [role,token] of Object.entries(roles)){
  await check(`${role}: serverseitig erkannter Tarif`,async()=>{
    const result=await request('/api/generate',{method:'POST',token,body:{action:'quota-summary'}});
    assert.equal(result.status,200);
    if(role==='guest')assert.equal(result.data.authenticated,false);
    else if(role==='admin')assert.equal(result.data.isAdmin,true);
    else assert.equal(result.data.plan,role);
  });

  for(const endpoint of [
    {path:'/api/admin-action',method:'POST',body:{action:'__role_audit_read_only__'}},
    {path:'/api/admin-overview',method:'GET'},
    {path:'/api/config?admin=true',method:'GET'}
  ])await check(`${role}: ${endpoint.path}`,async()=>{
    const result=await request(endpoint.path,{method:endpoint.method,token,body:endpoint.body});
    if(role==='admin'){
      if(endpoint.path==='/api/admin-action')assert.equal(result.status,400,'Admin muss die absichtlich unbekannte Aktion erst nach erfolgreicher Rollenprüfung ablehnen.');
      else assert.equal(result.status,200);
    }else assert.ok(denied(result.status),`Erwartet 401/403, erhalten ${result.status}`);
  });
}

if(failures.length){console.error(`\n${failures.length} Rollenprüfung(en) fehlgeschlagen.`);process.exit(1)}
console.log(`\nLive-Rollenmatrix vollständig bestanden: ${base}`);

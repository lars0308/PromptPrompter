const { authenticatedUser, SUPABASE_URL, PUBLISHABLE_KEY, authorization } = require('./supabase-user');
const { getEntitlements } = require('./entitlements');
const { rateLimit } = require('./rate-limit');

const BUCKET = 'sitebrief-references';
const MAX_ARCHIVE_BYTES = 24 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 180 * 1024 * 1024;
const MAX_ARCHIVE_FILES = 4000;
let SandboxClass = null;

async function sandboxSdk(){
  if(SandboxClass)return SandboxClass;
  const mod=await import('@vercel/sandbox');
  SandboxClass=mod.Sandbox;
  return SandboxClass;
}
function encodedPath(path){return String(path||'').split('/').map(encodeURIComponent).join('/')}
function validOwnedPath(path,userId){
  const value=String(path||'');
  return value.length<420&&!value.includes('..')&&value.startsWith(`${userId}/sandbox-builds/`)&&/\.zip$/i.test(value);
}
async function readOutput(command,kind='stdout'){
  try{return String(await command[kind]()).trim()}catch{return ''}
}
function clip(text,max=10000){const value=String(text||'');return value.length>max?`${value.slice(-max)}\n…`:value}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

async function downloadArchive(req,path){
  const bearer=authorization(req);
  if(!/^Bearer\s+\S+/i.test(bearer))throw Object.assign(new Error('Bitte zuerst anmelden.'),{status:401});
  const response=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${encodedPath(path)}`,{headers:{apikey:PUBLISHABLE_KEY,Authorization:bearer}});
  if(!response.ok)throw Object.assign(new Error('Das hochgeladene Projekt konnte nicht gelesen werden.'),{status:response.status});
  const length=Number(response.headers.get('content-length')||0);
  if(length&&length>MAX_ARCHIVE_BYTES)throw Object.assign(new Error('Das Projekt-ZIP darf höchstens 24 MB groß sein. node_modules bitte nicht mit hochladen.'),{status:413});
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>MAX_ARCHIVE_BYTES)throw Object.assign(new Error('Das Projekt-ZIP darf höchstens 24 MB groß sein. node_modules bitte nicht mit hochladen.'),{status:413});
  return bytes;
}
async function runChecked(sandbox,params,label,timeoutMs){
  const result=await sandbox.runCommand({...params,timeoutMs});
  if(result.exitCode!==0){
    const stderr=await readOutput(result,'stderr'),stdout=await readOutput(result,'stdout');
    throw Object.assign(new Error(`${label} fehlgeschlagen.\n${clip(stderr||stdout,6500)}`),{status:422});
  }
  return result;
}
async function validateArchive(sandbox){
  const namesResult=await runChecked(sandbox,{cmd:'unzip',args:['-Z1','/vercel/sandbox/project.zip']},'ZIP prüfen',15000);
  const names=(await readOutput(namesResult)).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!names.length)throw Object.assign(new Error('Das ZIP ist leer.'),{status:422});
  if(names.length>MAX_ARCHIVE_FILES)throw Object.assign(new Error(`Das ZIP enthält zu viele Dateien (${names.length}). Bitte node_modules und Build-Caches entfernen.`),{status:413});
  const unsafe=names.find(name=>name.startsWith('/')||name.split('/').includes('..')||name.includes('\\'));
  if(unsafe)throw Object.assign(new Error('Das ZIP enthält einen unsicheren Dateipfad und wurde nicht ausgeführt.'),{status:422});
  const secret=names.find(name=>{
    const base=name.split('/').pop().toLowerCase();
    if(base==='.env.example'||base==='.env.sample')return false;
    return base==='.env'||base.startsWith('.env.')||base==='.npmrc'||base==='id_rsa'||base==='id_ed25519'||/\.(?:pem|p12|pfx|key)$/i.test(base);
  });
  if(secret)throw Object.assign(new Error(`Im ZIP wurde eine mögliche Secret-Datei gefunden (${secret}). Entferne API-Keys, .env-Dateien und private Schlüssel vor dem Sandbox-Upload.`),{status:422});
  const listResult=await runChecked(sandbox,{cmd:'unzip',args:['-l','/vercel/sandbox/project.zip']},'ZIP-Größe prüfen',15000);
  const listing=await readOutput(listResult),summary=listing.match(/\n\s*(\d+)\s+\d+\s+files?\s*$/i),unpacked=Number(summary?.[1]||0);
  if(unpacked&&unpacked>MAX_UNPACKED_BYTES)throw Object.assign(new Error('Das entpackte Projekt ist größer als 180 MB. Bitte node_modules, .next, dist und andere Build-Caches entfernen.'),{status:413});
  return names;
}
async function projectMeta(sandbox,cwd){
  const code=`const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));const all={...(p.dependencies||{}),...(p.devDependencies||{})};const framework=all.next?'next':all.vite?'vite':all.astro?'astro':all['react-scripts']?'cra':all['@angular/core']?'angular':'node';const manager=fs.existsSync('pnpm-lock.yaml')?'pnpm':fs.existsSync('yarn.lock')?'yarn':'npm';process.stdout.write(JSON.stringify({framework,manager,scripts:p.scripts||{},name:p.name||''}))`;
  const result=await runChecked(sandbox,{cmd:'node',args:['-e',code],cwd},'Projektanalyse',15000);
  const raw=await readOutput(result);
  try{return JSON.parse(raw)}catch{throw Object.assign(new Error('package.json konnte nicht ausgewertet werden.'),{status:422})}
}
async function installDependencies(sandbox,cwd,manager){
  if(manager==='pnpm'){
    const corepack=await sandbox.runCommand({cmd:'corepack',args:['enable'],cwd,sudo:true,timeoutMs:15000});
    if(corepack.exitCode===0)return runChecked(sandbox,{cmd:'pnpm',args:['install','--no-frozen-lockfile'],cwd},'Abhängigkeiten installieren',110000);
  }
  if(manager==='yarn'){
    const corepack=await sandbox.runCommand({cmd:'corepack',args:['enable'],cwd,sudo:true,timeoutMs:15000});
    if(corepack.exitCode===0)return runChecked(sandbox,{cmd:'yarn',args:['install'],cwd},'Abhängigkeiten installieren',110000);
  }
  return runChecked(sandbox,{cmd:'npm',args:['install','--no-audit','--no-fund','--loglevel=error'],cwd},'Abhängigkeiten installieren',110000);
}
async function runScript(sandbox,cwd,manager,script,args=[],detached=false,timeoutMs=120000){
  const cmd=manager==='pnpm'?'pnpm':manager==='yarn'?'yarn':'npm';
  const cmdArgs=manager==='yarn'?[script,...args]:['run',script,...(args.length?['--',...args]:[])];
  return sandbox.runCommand({cmd,args:cmdArgs,cwd,detached,env:{NODE_ENV:'production',CI:'1'},timeoutMs:detached?undefined:timeoutMs});
}
async function startServer(sandbox,cwd,meta){
  const {framework,manager,scripts={}}=meta;
  if(framework==='next'){
    if(scripts.start)return runScript(sandbox,cwd,manager,'start',['-p','3000','-H','0.0.0.0'],true);
    return sandbox.runCommand({cmd:'npx',args:['--yes','next','start','-p','3000','-H','0.0.0.0'],cwd,detached:true,env:{NODE_ENV:'production'}});
  }
  if((framework==='vite'||framework==='astro')&&scripts.preview)return runScript(sandbox,cwd,manager,'preview',['--host','0.0.0.0','--port','3000'],true);
  const candidates=framework==='cra'?['build']:['dist','build','out','public'];
  const probe=`const fs=require('fs');for(const p of ${JSON.stringify(candidates)})if(fs.existsSync(p)){process.stdout.write(p);break}`;
  const found=await sandbox.runCommand({cmd:'node',args:['-e',probe],cwd,timeoutMs:10000}),dir=(await readOutput(found))||'';
  if(dir)return sandbox.runCommand({cmd:'npx',args:['--yes','serve','-s',dir,'-l','3000'],cwd,detached:true,env:{NODE_ENV:'production'}});
  if(scripts.dev){
    const args=framework==='next'?['-p','3000','-H','0.0.0.0']:['--host','0.0.0.0','--port','3000'];
    return runScript(sandbox,cwd,manager,'dev',args,true);
  }
  throw Object.assign(new Error('Kein startbarer Build gefunden. Es braucht ein build-, preview-, start- oder dev-Skript.'),{status:422});
}
async function waitForPreview(url){
  let last='';
  for(let i=0;i<40;i++){
    try{
      const response=await fetch(url,{redirect:'manual',headers:{'User-Agent':'Prompt.ai Sandbox Preview'}});
      last=await response.text();
      if(response.status<500)return {status:response.status,html:last.slice(0,30000)};
    }catch{}
    await sleep(1000);
  }
  throw Object.assign(new Error('Der Build lief durch, aber der Vorschau-Server wurde nicht rechtzeitig erreichbar.'),{status:504});
}

module.exports=async function sandboxBuild(req,res){
  res.setHeader('Cache-Control','no-store, private');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,{key:'sandbox-build',limit:2,windowMs:10*60*1000}))return;
  let sandbox=null;
  try{
    const user=await authenticatedUser(req),entitlement=await getEntitlements(req);
    const hasSandboxAccess=entitlement.isAdmin||['pro','ultimate'].includes(entitlement.plan);
    if(!hasSandboxAccess)return res.status(403).json({error:'Der isolierte Quellcode-Build ist ab Pro verfügbar.'});
    const path=String(req.body?.storagePath||'');
    if(!validOwnedPath(path,user.id))return res.status(400).json({error:'Ungültiger Projektpfad.'});
    const fullAccess=entitlement.isAdmin||entitlement.plan==='ultimate';
    const archive=await downloadArchive(req,path),timeoutMs=fullAccess?15*60*1000:10*60*1000,Sandbox=await sandboxSdk();
    sandbox=await Sandbox.create({runtime:'node24',resources:{vcpus:fullAccess?2:1},ports:[3000],timeout:timeoutMs,persistent:false,env:{CI:'1'},networkPolicy:'allow-all',tags:{app:'prompt-ai',tier:entitlement.isAdmin?'admin':entitlement.plan}});
    await sandbox.mkDir('/vercel/sandbox/app');
    await sandbox.writeFiles([{path:'/vercel/sandbox/project.zip',content:archive}]);
    const archiveFiles=await validateArchive(sandbox);
    await runChecked(sandbox,{cmd:'unzip',args:['-q','/vercel/sandbox/project.zip','-d','/vercel/sandbox/app']},'ZIP entpacken',30000);
    const find=await runChecked(sandbox,{cmd:'bash',args:['-lc',"find /vercel/sandbox/app -maxdepth 5 -name package.json -not -path '*/node_modules/*' -not -path '*/.next/*' -print | head -n 1"]},'Projektwurzel suchen',15000),packagePath=await readOutput(find);
    if(!packagePath)throw Object.assign(new Error('Im ZIP wurde keine package.json gefunden. Für statische HTML-Projekte bitte die lokale Live-Vorschau verwenden.'),{status:422});
    const cwd=packagePath.replace(/\/package\.json$/,'');
    const meta=await projectMeta(sandbox,cwd);
    await installDependencies(sandbox,cwd,meta.manager);
    let buildLog='Kein build-Skript vorhanden; Vorschau startet direkt.';
    if(meta.scripts?.build){
      const built=await runScript(sandbox,cwd,meta.manager,'build',[],false,120000);
      if(built.exitCode!==0){
        const stderr=await readOutput(built,'stderr'),stdout=await readOutput(built,'stdout');
        throw Object.assign(new Error(`Build fehlgeschlagen.\n${clip(stderr||stdout,8000)}`),{status:422});
      }
      buildLog=clip(await readOutput(built),5000);
    }
    await startServer(sandbox,cwd,meta);
    const previewUrl=sandbox.domain(3000),ready=await waitForPreview(previewUrl);
    return res.status(200).json({ok:true,previewUrl,sandboxId:sandbox.name||'',expiresAt:new Date(Date.now()+timeoutMs).toISOString(),framework:meta.framework,projectName:meta.name||'',httpStatus:ready.status,analysisSample:ready.html,buildLog,archiveFiles:archiveFiles.slice(0,120)});
  }catch(error){
    if(sandbox)try{await sandbox.stop()}catch{}
    const status=Number(error?.status)||500;
    return res.status(status).json({error:error?.message||'Quellprojekt konnte nicht gebaut werden.'});
  }
};

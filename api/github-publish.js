const {getEntitlements}=require('../server/entitlements');
const {authenticatedUser}=require('../server/supabase-user');
const {resolveProviderKey}=require('../server/provider-key');
async function github(path,token,options={}){const response=await fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}}),data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.message||'GitHub-Anfrage fehlgeschlagen'),{status:response.status});return data}
function parseRepoInput(input){const v=String(input||'').trim().replace(/^https?:\/\/github\.com\//i,'').replace(/\.git$/i,'').replace(/^\/+|\/+$/g,'');const parts=v.split('/').filter(Boolean);if(parts.length!==2||!parts.every(x=>/^[A-Za-z0-9_.-]{1,100}$/.test(x)))return null;return {owner:parts[0],repo:parts[1],slug:`${parts[0]}/${parts[1]}`}}
async function listRepos(token){const repos=await github('/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',token);return (Array.isArray(repos)?repos:[]).slice(0,100).map(r=>({fullName:r.full_name,name:r.name,private:!!r.private,defaultBranch:r.default_branch||'main',updatedAt:r.updated_at,url:r.html_url}))}
async function publishNew(token,repoNameInput,files){
  const repoName=String(repoNameInput||'').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').slice(0,80);
  if(!repoName||!Object.keys(files).length)throw Object.assign(new Error('Repository-Name und Dateien fehlen.'),{status:400});
  const repo=await github('/user/repos',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:repoName,private:false,description:'Erstellt mit Prompt.ai',auto_init:true})});
  for(const [path,content] of Object.entries(files).slice(0,20))await github(`/repos/${repo.full_name}/contents/${encodeURIComponent(path)}`,token,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Add ${path}`,content:Buffer.from(String(content)).toString('base64')})});
  return {url:repo.html_url,fullName:repo.full_name};
}
async function publishExisting(token,targetRepoInput,branchInput,files){
  const repo=parseRepoInput(targetRepoInput);
  if(!repo)throw Object.assign(new Error('Ungültiges Ziel-Repository.'),{status:400});
  if(!Object.keys(files).length)throw Object.assign(new Error('Dateien fehlen.'),{status:400});
  const repoData=await github(`/repos/${repo.slug}`,token);
  const branch=String(branchInput||repoData.default_branch||'main').trim();
  for(const [path,content] of Object.entries(files).slice(0,20)){
    let sha;
    try{const existing=await github(`/repos/${repo.slug}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,token);sha=existing.sha}catch{}
    await github(`/repos/${repo.slug}/contents/${encodeURIComponent(path)}`,token,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Update ${path} via Prompt.ai`,content:Buffer.from(String(content)).toString('base64'),branch,...(sha?{sha}:{})})});
  }
  return {url:repoData.html_url,fullName:repoData.full_name};
}
module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    await authenticatedUser(req);
    const entitlement=await getEntitlements(req);
    if(!entitlement.isAdmin&&entitlement.plan!=='ultimate')return res.status(403).json({error:'GitHub-Repository-Zugriff ist in Ultimate verfügbar.'});
    const resolved=await resolveProviderKey(req,'github'),token=resolved.key;
    if(!token)throw Object.assign(new Error('Verbinde zuerst GitHub unter Einstellungen → Verbindungen.'),{status:503});
    const action=String(req.body?.action||'publish');
    if(action==='list-repos')return res.status(200).json({repos:await listRepos(token)});
    if(action==='publish-existing')return res.status(200).json(await publishExisting(token,req.body?.targetRepo,req.body?.branch,req.body?.files||{}));
    return res.status(200).json(await publishNew(token,req.body?.repoName,req.body?.files||{}));
  }catch(error){
    return res.status(error.status||500).json({error:error.message||'GitHub-Veröffentlichung fehlgeschlagen'});
  }
};

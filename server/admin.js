const {SUPABASE_URL,authorization,authenticatedUser}=require('./supabase-user');

function serviceKey(){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
  if(!key)throw Object.assign(new Error('SUPABASE_SERVICE_ROLE_KEY fehlt.'),{status:503});
  return key;
}

async function serviceFetch(path,{method='GET',body,headers={}}={}){
  const key=serviceKey();
  const response=await fetch(`${SUPABASE_URL}${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok)throw Object.assign(new Error(data?.msg||data?.message||data?.error_description||data?.error||'Admin-Anfrage fehlgeschlagen.'),{status:response.status});
  return {data,headers:response.headers};
}

async function requireAdmin(req){
  const user=await authenticatedUser(req);
  const response=await fetch(`${SUPABASE_URL}/rest/v1/sitebrief_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,{headers:{apikey:serviceKey(),Authorization:`Bearer ${serviceKey()}`}});
  const rows=response.ok?await response.json():[];
  if(!rows?.[0])throw Object.assign(new Error('Dieser Bereich ist nur für Administratoren verfügbar.'),{status:403});
  return user;
}

async function listAll(table,select='*',extra=''){
  return (await serviceFetch(`/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}`)).data||[];
}

module.exports={authorization,requireAdmin,serviceFetch,listAll};

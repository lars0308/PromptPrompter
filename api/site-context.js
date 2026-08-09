const dns=require('dns').promises;
const net=require('net');
const {rateLimit}=require('../server/rate-limit');

function blocked(ip){
  if(net.isIPv4(ip)){const p=ip.split('.').map(Number);return p[0]===10||p[0]===127||p[0]===0||p[0]===169&&p[1]===254||p[0]===172&&p[1]>=16&&p[1]<=31||p[0]===192&&p[1]===168||p[0]>=224}
  const value=ip.toLowerCase();return value==='::1'||value==='::'||value.startsWith('fc')||value.startsWith('fd')||value.startsWith('fe8')||value.startsWith('fe9')||value.startsWith('fea')||value.startsWith('feb')||value.startsWith('::ffff:127.')||value.startsWith('::ffff:10.')||value.startsWith('::ffff:192.168.');
}
async function safeUrl(raw){
  if(raw.length>2048)throw Object.assign(new Error('Die Adresse ist zu lang.'),{status:400});
  const url=new URL(raw);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.port&&!['80','443'].includes(url.port))throw Object.assign(new Error('Nur öffentliche HTTP- oder HTTPS-Websites sind erlaubt.'),{status:400});
  if(url.hostname.toLowerCase()==='localhost')throw Object.assign(new Error('Diese Netzwerkadresse ist nicht erlaubt.'),{status:400});
  const addresses=await dns.lookup(url.hostname,{all:true});if(!addresses.length||addresses.some(x=>blocked(x.address)))throw Object.assign(new Error('Diese Netzwerkadresse ist nicht erlaubt.'),{status:400});return url;
}
function decode(text=''){return text.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function meta(html,key){const escaped=key.replace(/[^a-z0-9:_-]/gi,''),patterns=[new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)`,'i'),new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["']`,'i')];for(const pattern of patterns){const match=html.match(pattern);if(match)return decode(match[1].trim())}return''}

module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,{key:'site-context',limit:8,windowMs:60000}))return;
  try{
    let url=await safeUrl(String(req.body?.url||'')),response;
    for(let i=0;i<3;i++){
      response=await fetch(url,{redirect:'manual',headers:{'User-Agent':'Prompt.ai/1.0 Website Context Import','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(8000)});
      if(response.status>=300&&response.status<400&&response.headers.get('location')){url=await safeUrl(new URL(response.headers.get('location'),url).href);continue}break;
    }
    if(!response?.ok)throw Object.assign(new Error(`Website antwortet mit Status ${response?.status||'unbekannt'}.`),{status:502});
    const type=response.headers.get('content-type')||'',length=Number(response.headers.get('content-length')||0);if(!type.includes('text/html'))throw Object.assign(new Error('Die Adresse liefert keine HTML-Website.'),{status:400});if(length>1500000)throw Object.assign(new Error('Die Website ist für den Direktimport zu groß.'),{status:413});
    const html=(await response.text()).slice(0,1000000),title=decode((html.match(/<title[^>]*>([^<]*)/i)||[])[1]||''),description=meta(html,'description')||meta(html,'og:description'),siteName=meta(html,'og:site_name')||title.split(/[|–—-]/)[0].trim(),clean=decode(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()).slice(0,1200);
    return res.status(200).json({url:url.href,title,siteName,description,summary:clean});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Website konnte nicht gelesen werden'})}
};

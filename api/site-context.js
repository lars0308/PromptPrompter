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
function stripHtml(html=''){return decode(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<noscript[\s\S]*?<\/noscript>/gi,' ').replace(/<svg[\s\S]*?<\/svg>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function attrUrls(html,attr,base){const urls=[];const pattern=new RegExp(`\\b${attr}\\s*=\\s*["']([^"']+)["']`,'gi');for(const match of html.matchAll(pattern)){try{const value=match[1].trim();if(!value||/^(?:data:|javascript:|mailto:|tel:|#)/i.test(value))continue;const url=new URL(value,base);if(['http:','https:'].includes(url.protocol)){url.hash='';urls.push(url.href)}}catch{}}return [...new Set(urls)]}
function pageKind(url,title=''){const value=`${url.pathname} ${title}`.toLowerCase();
  if(/impressum|imprint|anbieterkennzeichnung/.test(value))return'impressum';
  if(/datenschutz|privacy|data-protection/.test(value))return'datenschutz';
  if(/kontakt|contact|anfrage|reservierung/.test(value))return'kontakt';
  if(/ueber|über|about|team|geschichte|restaurant|betrieb|philosophie|wir-/.test(value))return'ueber-uns';
  if(/leistung|service|angebot|menu|speisekarte|karte|produkt|preise|sortiment/.test(value))return'leistungen';
  if(/oeffnungszeit|öffnungszeit|opening|zeiten/.test(value))return'oeffnungszeiten';
  if(/anfahrt|standort|location|wegbeschreibung/.test(value))return'anfahrt';
  if(/galerie|gallery|referenz|portfolio|projekte|bilder/.test(value))return'galerie';
  if(/aktuell|news|blog|neuigkeit/.test(value))return'aktuelles';
  if(/job|karriere|stellen|bewerbung/.test(value))return'jobs';
  if(/agb|terms|widerruf/.test(value))return'agb';
  return'seite'}
// Links that are not pages: stylesheets and scripts live in the same href attribute as the menu,
// and a WordPress head lists them first. They used to fill the crawl budget before the first real
// sub-page was reached - that is why "Öffnungszeiten" and "Anfahrt" stayed unread.
const NOT_A_PAGE=/\.(?:css|js|mjs|json|xml|rss|atom|ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|eot|zip|mp[34]|webm)(?:[?#]|$)|\/wp-(?:json|content|includes|admin|login)|xmlrpc|\/feed\/?$|\/comments\/?$|oembed|[?&](?:p|page_id|replytocom|share|print)=|\/wp-sitemap|sitemap\.xml|\/cdn-cgi\//i;
const DOCUMENT_FILE=/\.(pdf|docx?|xlsx?|pptx?|csv)(?:[?#]|$)/i;
async function fetchHtml(input){let url=input,response;for(let i=0;i<3;i++){response=await fetch(url,{redirect:'manual',headers:{'User-Agent':'Prompt.ai/1.0 Website Context Import','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(8000)});if(response.status>=300&&response.status<400&&response.headers.get('location')){url=await safeUrl(new URL(response.headers.get('location'),url).href);continue}break}if(!response?.ok)throw Object.assign(new Error(`Website antwortet mit Status ${response?.status||'unbekannt'}.`),{status:502});const type=response.headers.get('content-type')||'',length=Number(response.headers.get('content-length')||0);if(!type.includes('text/html'))throw Object.assign(new Error('Die Adresse liefert keine HTML-Website.'),{status:400});if(length>1500000)throw Object.assign(new Error('Die Website ist für den Direktimport zu groß.'),{status:413});return {url,html:(await response.text()).slice(0,1000000)}}

const PAGE_BUDGET=12;
const MAX_DOCUMENT_BYTES=9*1024*1024;
// The customer's PDF cannot be fetched by the browser (no CORS on a foreign WordPress), so the
// server does the network part behind the same address guard and hands the bytes back. Parsing
// stays in the client, which already runs pdf.js for uploaded files.
async function fetchDocument(req,res){
  const url=await safeUrl(String(req.body?.document||''));
  if(!DOCUMENT_FILE.test(url.href))return res.status(400).json({error:'Diese Adresse ist keine Unterlage.'});
  const response=await fetch(url.href,{redirect:'follow',headers:{'User-Agent':'Prompt.ai/1.0 Website Context Import'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)return res.status(502).json({error:`Die Datei antwortet mit Status ${response.status}.`});
  const length=Number(response.headers.get('content-length')||0);
  if(length>MAX_DOCUMENT_BYTES)return res.status(413).json({error:'Die verlinkte Datei ist zu groß.'});
  const buffer=Buffer.from(await response.arrayBuffer());
  if(buffer.length>MAX_DOCUMENT_BYTES)return res.status(413).json({error:'Die verlinkte Datei ist zu groß.'});
  const name=decodeURIComponent(url.pathname.split('/').pop()||'unterlage');
  return res.status(200).json({url:url.href,name,type:response.headers.get('content-type')||'',bytes:buffer.toString('base64')});
}

module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,{key:'site-context',limit:8,windowMs:60000}))return;
  try{
    if(req.body?.document)return await fetchDocument(req,res);
    const first=await fetchHtml(await safeUrl(String(req.body?.url||''))),origin=first.url.origin;
    const firstTitle=decode((first.html.match(/<title[^>]*>([^<]*)/i)||[])[1]||''),description=meta(first.html,'description')||meta(first.html,'og:description'),siteName=meta(first.html,'og:site_name')||firstTitle.split(/[|–—-]/)[0].trim();
    const discovered=attrUrls(first.html,'href',first.url).filter(link=>{try{return new URL(link).origin===origin}catch{return false}});
    // Content pages first, then everything else - and only pages: assets, feeds and admin routes
    // never become crawl targets.
    const weights={leistungen:0,'ueber-uns':1,oeffnungszeiten:2,kontakt:3,anfahrt:4,galerie:5,aktuelles:6,jobs:7,impressum:8,datenschutz:9,agb:10,seite:11};
    const crawlable=discovered.filter(link=>!NOT_A_PAGE.test(link)&&!DOCUMENT_FILE.test(link));
    const priority=crawlable.map(link=>({link,kind:pageKind(new URL(link))})).sort((a,b)=>weights[a.kind]-weights[b.kind]);
    const targets=[first.url.href,...priority.map(x=>x.link)].filter((value,index,list)=>list.indexOf(value)===index).slice(0,PAGE_BUDGET),pages=[],allLinks=new Set(discovered),images=new Set(attrUrls(first.html,'src',first.url));
    for(const target of targets){try{const result=target===first.url.href?first:await fetchHtml(await safeUrl(target));if(result.url.origin!==origin)continue;const title=decode((result.html.match(/<title[^>]*>([^<]*)/i)||[])[1]||''),text=stripHtml(result.html).slice(0,6000);pages.push({url:result.url.href,title,kind:pageKind(result.url,title),summary:text});for(const link of attrUrls(result.html,'href',result.url))allLinks.add(link);for(const image of [...attrUrls(result.html,'src',result.url),...attrUrls(result.html,'data-src',result.url)])images.add(image)}catch{}}
    // Documents the site links to (a menu, a price list, a service catalogue). They are not read
    // here - the client parses them with the PDF reader it already ships - but they are named, so
    // the briefing knows they exist instead of leaving the gap for the model to fill.
    const documents=[...allLinks].filter(link=>DOCUMENT_FILE.test(link)).slice(0,6);
    return res.status(200).json({url:first.url.href,title:firstTitle,siteName,description,summary:pages[0]?.summary||'',pages:pages.slice(0,PAGE_BUDGET),links:[...allLinks].slice(0,120),documents,images:[...images].filter(link=>/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(link)).slice(0,60)});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Website konnte nicht gelesen werden'})}
};

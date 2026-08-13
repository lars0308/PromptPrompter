import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const args=process.argv.slice(2);
const portIndex=args.indexOf('--port');
const port=Number(portIndex>=0?args[portIndex+1]:process.env.PORT||4173);
const root=process.cwd();
const types={'.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json; charset=utf-8'};

createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url||'/',`http://${request.headers.host||'localhost'}`).pathname);
  if(pathname.startsWith('/api/')){response.writeHead(404,{'content-type':'application/json; charset=utf-8'});response.end('{"error":"Local preview has no API runtime."}');return}
  const requested=normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
  let file=join(root,requested==='/'?'index.html':requested);
  if(!file.startsWith(root)||!existsSync(file)||statSync(file).isDirectory())file=join(root,'index.html');
  response.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  createReadStream(file).pipe(response);
}).listen(port,'0.0.0.0',()=>console.log(`Prompt.ai preview on ${port}`));

(()=>{
  'use strict';
  const load=(src,onload)=>{const script=document.createElement('script');script.src=src;script.async=false;if(onload)script.addEventListener('load',onload,{once:true});document.head.appendChild(script);return script};
  load('./admin-console-core.js?v=20260810-4',()=>load('./ui-regression-fixes.js?v=20260810-4',()=>load('./mode-flow-ui.js?v=20260810-2',()=>load('./preview-ai-admin.js?v=20260810-2'))));
})();

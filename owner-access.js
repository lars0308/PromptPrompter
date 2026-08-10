(()=>{
  'use strict';
  const ADMIN='service.battermann@gmx.de';
  let wrapped=null,tries=0;
  function owner(cloud){return String(cloud?.user?.email||'').trim().toLowerCase()===ADMIN}
  function wrap(){
    const cloud=window.SiteBriefCloud;if(!cloud?.loadUserBundle)return false;if(cloud.loadUserBundle===wrapped||cloud.loadUserBundle.__promptOwnerWrapped)return true;
    const native=cloud.loadUserBundle.bind(cloud);
    wrapped=async(...args)=>{const bundle=await native(...args);if(owner(cloud)&&bundle&&typeof bundle==='object'){bundle.subscription={...(bundle.subscription||{}),plan:'ultimate',status:'active',isAdmin:true,ownApiKeys:true}}return bundle};
    wrapped.__promptOwnerWrapped=true;cloud.loadUserBundle=wrapped;return true;
  }
  if(!wrap()){const timer=setInterval(()=>{if(wrap()||++tries>40)clearInterval(timer)},50)}
  window.SiteBriefCloudReady?.then?.(()=>wrap()).catch?.(()=>{});
})();

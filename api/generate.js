const core=require('../server/generate-core');
const previewImage=require('../server/preview-image');
const sandboxBuild=require('../server/sandbox-build');

module.exports=async function generateRouter(req,res){
  if(req.method==='POST'){
    const action=String(req.body?.action||'');
    if(action==='preview-image')return previewImage(req,res);
    if(action==='sandbox-build')return sandboxBuild(req,res);
  }
  return core(req,res);
};

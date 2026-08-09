const core=require('../server/generate-core');
const previewImage=require('../server/preview-image');

module.exports=async function generateRouter(req,res){
  if(req.method==='POST'&&String(req.body?.action||'')==='preview-image')return previewImage(req,res);
  return core(req,res);
};

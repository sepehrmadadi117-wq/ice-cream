require('./harness.js');load('bus.js');load('model.js');const N=NooshinViewer;
(async()=>{
 const mkResp=(chunks,{status=200,type='model/gltf-binary',len}={})=>{let i=0;const total=chunks.reduce((a,c)=>a+c.length,0);
  return{ok:status<400,status,headers:{get:k=>k==='content-type'?type:k==='content-length'?String(len===undefined?total:len):null},
   body:{getReader:()=>({read:async()=>i<chunks.length?{done:false,value:chunks[i++]}:{done:true}})},arrayBuffer:async()=>Uint8Array.from(chunks.flatMap(c=>[...c])).buffer}};
 const prog=[];let libsStarted=0,reqs=0;
 global.fetch=async(u,o)=>{reqs++;return mkResp([new Uint8Array([1,2,3,4]),new Uint8Array([5,6,7,8]),new Uint8Array([9,10])])};
 let buf=await N._fetchModel('m.glb',r=>prog.push(+r.toFixed(2)),()=>{libsStarted++;return Promise.resolve()});
 check('fetchModel: one GET (no HEAD probe)',reqs===1,reqs);check('fetchModel: returns the full body reassembled from chunks',buf&&new Uint8Array(buf).join()==='1,2,3,4,5,6,7,8,9,10',buf&&new Uint8Array(buf).join());
 check('fetchModel: progress ratios increase monotonically and end at 1',prog.length>=3&&prog.every((v,i)=>i===0||v>=prog[i-1])&&prog[prog.length-1]===1,prog);
 check('fetchModel: GLTF/Draco libraries are started in parallel with the download',libsStarted===1);
 global.fetch=async()=>mkResp([],{status:404});check('fetchModel: 404 resolves null (viewer uses the fallback) without starting libraries',(libsStarted=0,await N._fetchModel('x',null,()=>{libsStarted++}))===null&&libsStarted===0);
 global.fetch=async()=>mkResp([new Uint8Array([60,33])],{type:'text/html; charset=utf-8'});check('fetchModel: an HTML page (SPA fallback for a missing file) is rejected as a model',(await N._fetchModel('x'))===null);
 global.fetch=async()=>{throw new Error('offline')};check('fetchModel: network error resolves null instead of throwing',(await N._fetchModel('x'))===null);
 global.fetch=async()=>({ok:true,status:200,headers:{get:()=>null},body:null,arrayBuffer:async()=>new Uint8Array([7,7]).buffer});check('fetchModel: works without streaming support (arrayBuffer fallback)',new Uint8Array(await N._fetchModel('x')).length===2);
 console.log('PASS',ok,'FAIL',bad);process.exit(bad?1:0)})();

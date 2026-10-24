global.window=global;const vm=require('vm'),fs=require('fs');
global.load=f=>vm.runInThisContext(fs.readFileSync(__dirname+'/../js/viewer/'+f,'utf8'),{filename:f});
global.sphere=function(R,ws,hs){const pos=[],nrm=[],idx=[];
 for(let y=0;y<=hs;y++){const v=y/hs,th=v*Math.PI;for(let x=0;x<=ws;x++){const u=x/ws,ph=u*Math.PI*2;
  const nx=Math.cos(ph)*Math.sin(th),ny=Math.cos(th),nz=Math.sin(ph)*Math.sin(th);pos.push(R*nx,R*ny,R*nz);nrm.push(nx,ny,nz)}}
 for(let y=0;y<hs;y++)for(let x=0;x<ws;x++){const a=y*(ws+1)+x,b=a+ws+1;idx.push(a,b,a+1,b,b+1,a+1)}
 return{pos:new Float32Array(pos),nrm:new Float32Array(nrm),idx:new Uint32Array(idx)}};
global.ok=0;global.bad=0;global.check=(name,c,info)=>{if(c){ok++}else{bad++;console.log('FAIL',name,info===undefined?'':JSON.stringify(info))}};

/* Model loading (GLB with Draco/Meshopt when present, procedural fallback otherwise), normalisation and inspection. */
(function(N){
var DRACO='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/',
 LIBS=['https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/meshopt_decoder.js'];
/* one GET for the model (no HEAD probe): resolves to an ArrayBuffer, or null when the file is missing / not a model.
   progress(ratio) is called while the body streams. The GLTF/Draco libraries are fetched in parallel with the body. */
function readBody(r,progress){var len=+r.headers.get('content-length')||0;
 if(!r.body||!r.body.getReader)return r.arrayBuffer();
 var rd=r.body.getReader(),chunks=[],got=0;
 return(function pump(){return rd.read().then(function(x){
  if(x.done){var out=new Uint8Array(got),o=0;chunks.forEach(function(c){out.set(c,o);o+=c.length});if(progress)progress(1);return out.buffer}
  chunks.push(x.value);got+=x.value.length;if(progress&&len)progress(Math.min(.99,got/len));return pump()})})()}
function fetchModel(url,progress,startLibs){
 return fetch(url).then(function(r){
  if(!r.ok||/html/.test(r.headers.get('content-type')||''))return null;
  var libs=startLibs?startLibs():Promise.resolve();
  return Promise.all([readBody(r,progress),libs]).then(function(x){return x[0]})}).catch(function(){return null})}
N._fetchModel=fetchModel;
/* textures larger than the device budget are re-drawn smaller (GPU memory: 4096px RGBA ~ 89MB with mipmaps, 2048px ~ 22MB) */
N.capTexture=function(tex,max){var im=tex&&tex.image;if(!im||!im.width||Math.max(im.width,im.height)<=max)return false;
 var k=max/Math.max(im.width,im.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
 c.getContext('2d').drawImage(im,0,0,c.width,c.height);tex.image=c;tex.needsUpdate=true;return true};
var EXCL=/cone|wafer|stick|stem|cherry|cup|bowl|glass/i,INC=/scoop|ice|cream|gelato|ball|sphere|surface/i;
function tag(root){var meshes=[];root.traverse(function(o){if(o.isMesh)meshes.push(o)});
 var explicit=meshes.some(function(m){return m.userData.receiver});
 if(!explicit){var hit=meshes.filter(function(m){return INC.test(m.name)&&!EXCL.test(m.name)});
  if(!hit.length)hit=meshes.filter(function(m){return !EXCL.test(m.name)});
  hit.forEach(function(m){m.userData.receiver=true})}
 return meshes}
function prepare(meshes,st){var T=THREE,an=Math.min(st.mobile?4:8,st.renderer.capabilities.getMaxAnisotropy()),cap=st.mobile?2048:4096;
 meshes.forEach(function(m){m.castShadow=m.receiveShadow=true;
  [].concat(m.material).forEach(function(mt){if(!mt)return;mt.envMapIntensity=1;
   ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','bumpMap'].forEach(function(k){if(mt[k]){mt[k].anisotropy=an;N.capTexture(mt[k],cap)}});
   if(mt.map)mt.map.encoding=T.sRGBEncoding})})}
function inspect(root,meshes,source){
 var T=THREE,box=new T.Box3().setFromObject(root),sz=box.getSize(new T.Vector3()),tex={},tris=0,list=[],warn=[];
 meshes.forEach(function(m){var g=m.geometry,t=(g.index?g.index.count:g.attributes.position.count)/3;tris+=t;
  [].concat(m.material).forEach(function(mt){if(!mt)return;for(var k in mt){var v=mt[k];if(v&&v.isTexture&&v.image&&v.image.width)tex[v.uuid]=v.image.width+'x'+v.image.height}});
  list.push({name:m.name||'(بی‌نام)',tris:Math.round(t),uv:!!g.attributes.uv,normals:!!g.attributes.normal,receiver:!!m.userData.receiver})});
 var mb=0;Object.keys(tex).forEach(function(k){var p=tex[k].split('x');mb+=p[0]*p[1]*4*1.33/1048576});
 if(source==='glb'){
  if(tris>150000)warn.push('more than 150k triangles: decimate for mobile');
  if(meshes.length<2)warn.push('single merged mesh: toppings can only use decals; split scoop/cone/sauce');
  if(list.some(function(x){return !x.uv}))warn.push('some meshes have no UV map');
  if(!list.some(function(x){return x.receiver}))warn.push('no mesh matched a topping receiver name (scoop/ice/cream)');
  if(mb>96)warn.push('texture memory ~'+Math.round(mb)+'MB: reduce to 2048px / KTX2')}
 return{source:source,tris:Math.round(tris),meshes:list,textures:Object.keys(tex).length,textureMB:Math.round(mb),size:{x:+sz.x.toFixed(2),y:+sz.y.toFixed(2),z:+sz.z.toFixed(2)},warnings:warn}}
N.report=function(i){i=i||N.lastInfo;if(!i)return;console.log('[Nooshin viewer]',i.source,i.tris+' tris',i.textures+' textures (~'+i.textureMB+'MB)',i.size);console.table(i.meshes);i.warnings.forEach(function(w){console.warn(w)})};
N.loadModel=function(url,st){
 var T=THREE,root=null,source='procedural';
 var libs=function(){return N.loadScripts(LIBS)};
 var p=url?fetchModel(url,function(r){N.emit('progress',r)},libs):Promise.resolve(null);
 return p.then(function(buf){return buf?new Promise(function(res,rej){
   var L=new T.GLTFLoader();
   if(T.DRACOLoader){var d=new T.DRACOLoader();d.setDecoderPath(DRACO);L.setDRACOLoader(d)}
   if(window.MeshoptDecoder)L.setMeshoptDecoder(window.MeshoptDecoder);
   L.parse(buf,'',res,rej)}).then(function(g){root=g.scene;source='glb'}).catch(function(e){console.warn('GLB failed, using fallback model',e)}):0})
 .then(function(){if(!root)root=N.buildProcedural();
  root.updateMatrixWorld(true);var b=new T.Box3().setFromObject(root),h=b.getSize(new T.Vector3()).y||1;
  root.scale.multiplyScalar(5.6/h);root.updateMatrixWorld(true);
  var meshes=tag(root);prepare(meshes,st);var info=inspect(root,meshes,source);N.lastInfo=info;return{root:root,info:info}})};
})(window.NooshinViewer=window.NooshinViewer||{});

/* Topping surface API. A hit is stored as (mesh, triangle, barycentric coords), so a topping stays glued to the exact
   spot on the actual surface: toppings are children of the receiver mesh, so they follow every rotation/zoom, and
   refresh() re-evaluates the barycentric point for meshes whose vertices change (melting, morphs). */
(function(N){
var T=window.THREE;if(!T)return;var Y=new T.Vector3(0,1,0);
function bary(p,a,b,c){var v0=b.clone().sub(a),v1=c.clone().sub(a),v2=p.clone().sub(a),
 d00=v0.dot(v0),d01=v0.dot(v1),d11=v1.dot(v1),d20=v2.dot(v0),d21=v2.dot(v1),den=d00*d11-d01*d01||1e-9,
 v=(d11*d20-d01*d21)/den,w=(d00*d21-d01*d20)/den;return[1-v-w,v,w]}
N._bary=bary;
function tri(g,f){var P=g.attributes.position,N_=g.attributes.normal,r={p:[],n:[]};
 f.forEach(function(i){r.p.push(new T.Vector3().fromBufferAttribute(P,i));r.n.push(N_?new T.Vector3().fromBufferAttribute(N_,i):null)});return r}
function evalAt(mesh,f,w){var t=tri(mesh.geometry,f),p=new T.Vector3().addScaledVector(t.p[0],w[0]).addScaledVector(t.p[1],w[1]).addScaledVector(t.p[2],w[2]),n;
 if(t.n[0]){n=new T.Vector3().addScaledVector(t.n[0],w[0]).addScaledVector(t.n[1],w[1]).addScaledVector(t.n[2],w[2]).normalize()}
 else n=t.p[1].clone().sub(t.p[0]).cross(t.p[2].clone().sub(t.p[0])).normalize();
 return{p:p,n:n}}
N.Surface=function(st){
 var rc=new T.Raycaster(),v2=new T.Vector2(),list=[],anchors=[],s={receivers:list,anchors:anchors};
 s.setReceivers=function(root){list.length=0;root.traverse(function(o){if(o.isMesh&&o.userData.receiver)list.push(o)});return list.length};
 s.pick=function(cx,cy){var r=st.renderer.domElement.getBoundingClientRect();
  v2.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);rc.setFromCamera(v2,st.camera);st.scene.updateMatrixWorld(true);
  var h=rc.intersectObjects(list,false)[0];if(!h)return null;
  var f=[h.face.a,h.face.b,h.face.c],t=tri(h.object.geometry,f),lp=h.object.worldToLocal(h.point.clone()),w=bary(lp,t.p[0],t.p[1],t.p[2]),e=evalAt(h.object,f,w);
  return{mesh:h.object,face:f,bary:w,local:e.p,normal:e.n,point:h.point.clone(),uv:h.uv}};
 /* attach `obj` at a hit: o.offset (local units along normal), o.spin (rad around normal), o.size (world units) */
 s.anchor=function(hit,obj,o){o=o||{};var a={obj:obj,mesh:hit.mesh,face:hit.face,bary:hit.bary,offset:o.offset||0,spin:o.spin||0,size:o.size};
  hit.mesh.add(obj);s.refresh(a);anchors.push(a);return a};
 s.refresh=function(a){var e=evalAt(a.mesh,a.face,a.bary);a.obj.position.copy(e.p).addScaledVector(e.n,a.offset);
  a.obj.quaternion.setFromUnitVectors(Y,e.n);if(a.spin)a.obj.rotateOnAxis(Y,a.spin);
  if(a.size){var ws=a.mesh.getWorldScale(new T.Vector3());a.obj.scale.set(a.size/ws.x,a.size/ws.y,a.size/ws.z)}};
 s.refreshDynamic=function(){var d=false;anchors.forEach(function(a){if(a.mesh.userData.dynamic){s.refresh(a);d=true}});return d};
 /* area-weighted random points on a mesh (for scatter toppings); opts.minNormalY filters to upward-facing surface */
 s.sample=function(mesh,count,o){o=o||{};var g=mesh.geometry,I=g.index,P=g.attributes.position,nT=(I?I.count:P.count)/3,cdf=g.userData._cdf;
  function id(t,k){return I?I.getX(t*3+k):t*3+k}
  if(!cdf){cdf=new Float32Array(nT);var s0=0,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
   for(var t=0;t<nT;t++){a.fromBufferAttribute(P,id(t,0));b.fromBufferAttribute(P,id(t,1));c.fromBufferAttribute(P,id(t,2));s0+=b.sub(a).cross(c.sub(a)).length()/2;cdf[t]=s0}g.userData._cdf=cdf}
  var out=[],tries=0,rnd=o.rng||Math.random;
  while(out.length<count&&tries++<count*20){var x=rnd()*cdf[nT-1],lo=0,hi=nT-1;while(lo<hi){var m=(lo+hi)>>1;if(cdf[m]<x)lo=m+1;else hi=m}
   var f=[id(lo,0),id(lo,1),id(lo,2)],r1=Math.sqrt(rnd()),r2=rnd(),w=[1-r1,r1*(1-r2),r1*r2],e=evalAt(mesh,f,w);
   if(o.minNormalY!==undefined&&e.n.clone().transformDirection(mesh.matrixWorld).y<o.minNormalY)continue;
   out.push({mesh:mesh,face:f,bary:w,local:e.p,normal:e.n})}
  return out};
 s.remove=function(a){a.obj.parent&&a.obj.parent.remove(a.obj);var i=anchors.indexOf(a);if(i>-1)anchors.splice(i,1)};
 s.clear=function(){anchors.slice().forEach(s.remove)};
 /* ---- model-space BVH queries (used by the pour/candy systems). Model space = holder space: unrotated world units. */
 var items=[],_o=new T.Vector3(),_d=new T.Vector3(),_inv=new T.Matrix4(),_g=new T.Vector3(),_q=new T.Quaternion();
 var built=false;
 s.ensure=function(){if(!built){built=true;s.build()}};
 s.build=function(){built=true;items.length=0;st.holder.updateMatrixWorld(true);var inv=new T.Matrix4().copy(st.holder.matrixWorld).invert();
  list.forEach(function(m){var g=m.geometry,P=g.attributes.position,Nn=g.attributes.normal,rel=new T.Matrix4().multiplyMatrices(inv,m.matrixWorld),e=rel.elements,nm=new T.Matrix3().getNormalMatrix(rel).elements,
    pos=new Float32Array(P.count*3),nrm=Nn?new Float32Array(P.count*3):null,i,x,y,z;
   for(i=0;i<P.count;i++){x=P.getX(i);y=P.getY(i);z=P.getZ(i);pos[i*3]=e[0]*x+e[4]*y+e[8]*z+e[12];pos[i*3+1]=e[1]*x+e[5]*y+e[9]*z+e[13];pos[i*3+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
    if(nrm){x=Nn.getX(i);y=Nn.getY(i);z=Nn.getZ(i);var a=nm[0]*x+nm[3]*y+nm[6]*z,b=nm[1]*x+nm[4]*y+nm[7]*z,c=nm[2]*x+nm[5]*y+nm[8]*z,l=Math.hypot(a,b,c)||1;nrm[i*3]=a/l;nrm[i*3+1]=b/l;nrm[i*3+2]=c/l}}
   items.push({mesh:m,bvh:new N.BVH(pos,g.index?g.index.array:null,nrm)})});s.area=0;items.forEach(function(it){s.area+=it.bvh.area()});return items.length};
 s.rayClient=function(cx,cy){var r=st.renderer.domElement.getBoundingClientRect();st.pivot.updateMatrixWorld(true);st.camera.updateMatrixWorld();
  _inv.copy(st.holder.matrixWorld).invert();_o.copy(st.camera.position).applyMatrix4(_inv);
  _d.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1,.5).unproject(st.camera).sub(st.camera.position).transformDirection(_inv);
  return{o:[_o.x,_o.y,_o.z],d:[_d.x,_d.y,_d.z]}};
 /* pointer -> surface hit {p,n (facing the viewer),mesh,tri,bary} in model space, or null */
 s.pickClient=function(cx,cy){s.ensure();var r=s.rayClient(cx,cy),best=null;
  items.forEach(function(it){var h=it.bvh.raycast(r.o[0],r.o[1],r.o[2],r.d[0],r.d[1],r.d[2],best?best.t:undefined);if(h){h.item=it;best=h}});
  if(!best)return null;var bv=best.item.bvh,n=bv.normalAt(best.tri,best.b0,best.b1,best.b2);
  if(n[0]*r.d[0]+n[1]*r.d[1]+n[2]*r.d[2]>0)n=[-n[0],-n[1],-n[2]];
  return{p:[r.o[0]+r.d[0]*best.t,r.o[1]+r.d[1]*best.t,r.o[2]+r.d[2]*best.t],n:n,mesh:best.item.mesh,tri:best.tri,bary:[best.b0,best.b1,best.b2],t:best.t}};
 s.closest=function(p,maxD){s.ensure();var best=null;items.forEach(function(it){var c=it.bvh.closest(p[0],p[1],p[2],best?best.d:maxD);if(c&&(!best||c.d<best.d)){c.item=it;best=c}});
  if(!best)return null;var n=best.item.bvh.normalAt(best.tri,best.b0,best.b1,best.b2);
  return{x:best.x,y:best.y,z:best.z,nx:n[0],ny:n[1],nz:n[2],d:best.d,tri:best.tri,mesh:best.item.mesh,bary:[best.b0,best.b1,best.b2]}};
 /* distance along a model-space ray to the first surface (null when the ray is free up to maxT) */
 s.rayModel=function(p,d,maxT){s.ensure();var best=null;items.forEach(function(it){var h=it.bvh.raycast(p[0],p[1],p[2],d[0],d[1],d[2],best===null?maxT:best);if(h)best=h.t});return best};
 /* unit gravity direction expressed in model space (changes as the model is rotated/tilted) */
 s.gravity=function(){_q.copy(st.pivot.quaternion).invert();_g.set(0,-1,0).applyQuaternion(_q);return[_g.x,_g.y,_g.z]};
 return s};
})(window.NooshinViewer=window.NooshinViewer||{});

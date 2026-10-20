/* Smarties: individual candies simulated with N.CandySim (gravity, approximate collision with the real surface,
   slight bounce, rolling/sliding, settling flat). Falling candies and settled candies are two instanced meshes that
   live in model space, so settled candies stay on the surface while the ice cream rotates. */
(function(N){
var PAL=[0xe53935,0xfb8c00,0xfdd835,0x43a047,0x1e88e5,0x8e24aa,0xec407a,0x6d4c41],V;
N.createSmarties=function(st,sf){
 var T=THREE;V=N.V;
 var MAXA=48,MAXS=260,geo=new T.SphereGeometry(1,18,12),mat=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.28,clearcoat:.8,clearcoatRoughness:.2}),
  fall=new T.InstancedMesh(geo,mat,MAXA),rest=new T.InstancedMesh(geo,mat,MAXS),Pv=new T.Vector3(),Qq=new T.Quaternion(),Sc=new T.Vector3(),M=new T.Matrix4(),C=new T.Color();
 [fall,rest].forEach(function(m){m.frustumCulled=false;m.castShadow=m.receiveShadow=true;m.count=0;st.holder.add(m)});
 var world={closest:function(p,d){return sf.closest(p,d)}};
 var sim=new N.CandySim(world,{r:.1,half:.055,maxActive:MAXA,maxSettled:MAXS,kill:-(st.size?st.size.y/2+1.2:4)});
 function put(m,i,c){Pv.set(c.p[0],c.p[1],c.p[2]);Qq.set(c.q[0],c.q[1],c.q[2],c.q[3]);Sc.set(sim.r*.95,sim.half,sim.r*.95);M.compose(Pv,Qq,Sc);m.setMatrixAt(i,M);m.setColorAt(i,C.setHex(PAL[c.col]))}
 sim.onSettle=function(c){var i=rest.count++;put(rest,i,c);rest.instanceMatrix.needsUpdate=true;if(rest.instanceColor)rest.instanceColor.needsUpdate=true};
 var S={sim:sim,pressing:false},pending=null,hit=null,timer=0;
 function spawnAt(h){
  var up=V.mul(sf.gravity(),-1),a=Math.abs(up[1])<.9?[0,1,0]:[1,0,0],u=V.norm(V.cross(up,a)),v=V.cross(up,u),ang=Math.random()*6.283,rr=.12*Math.sqrt(Math.random()),
   /* steep surface: start close to the pointed spot (so it lands where you touch); flat surface: drop from a height */
   steep=Math.max(0,Math.min(1,(V.dot(h.n,up)-.3)/.55)),base=V.add(h.p,V.mul(h.n,.15)),blocked=sf.rayModel(base,up,2.6),H=blocked===null?(.12+(1.6+Math.random()*.8)*steep):Math.max(.05,blocked-.3),
   /* never start inside the model: if part of the model is above the pointed spot the candy starts below it, just off the surface */
   p=V.add(V.add(base,V.mul(up,H*(blocked===null?1:.5+Math.random()*.5))),V.add(V.mul(u,Math.cos(ang)*rr),V.mul(v,Math.sin(ang)*rr)));
  return sim.spawn(p,blocked===null?V.mul(up,-.5):V.mul(h.n,.4))}
 S.claim=function(e){var h=sf.pickClient(e.clientX,e.clientY);if(!h)return false;pending=h;return true};
 S.paint=function(kind,e){
  if(kind==='start'){S.pressing=true;hit=pending||sf.pickClient(e.clientX,e.clientY);pending=null;timer=0;if(hit)spawnAt(hit)}
  else if(kind==='move'&&S.pressing){hit=sf.pickClient(e.clientX,e.clientY)}
  else if(kind==='end'){S.pressing=false;hit=null}};
 S.frame=function(dt){
  dt=Math.min(dt,.05);sim.g=sf.gravity();
  if(S.pressing&&hit){timer+=dt;while(timer>=.1){timer-=.1;spawnAt(hit)}}
  sim.step(dt);
  var n=sim.active.length;for(var i=0;i<n;i++)put(fall,i,sim.active[i]);fall.count=n;fall.instanceMatrix.needsUpdate=true;if(fall.instanceColor)fall.instanceColor.needsUpdate=true;
  return S.pressing||n>0};
 S.abort=function(){S.pressing=false;hit=pending=null};
 /* freeze the simulation and hand every candy (settled and still falling) to the reset animation */
 S.beginReset=function(){S.abort();var list=[];
  sim.settled.concat(sim.active).forEach(function(c){var n=c.n&&c.contact!==undefined&&sim.active.indexOf(c)<0?c.n:null;if(!n){var cl=sf.closest(c.p,3);n=cl?[cl.nx,cl.ny,cl.nz]:[0,1,0]}
   list.push({p:c.p.slice(),q:c.q.slice(),col:c.col,n:n.slice()})});
  sim.active.length=0;fall.count=0;rest.count=list.length;list.forEach(function(c,i){rest.setColorAt(i,C.setHex(PAL[c.col]))});if(rest.instanceColor)rest.instanceColor.needsUpdate=true;return list};
 S.setCandy=function(i,p,q,sc){Pv.set(p[0],p[1],p[2]);Qq.set(q[0],q[1],q[2],q[3]);Sc.set(sim.r*.95*sc,sim.half*sc,sim.r*.95*sc);M.compose(Pv,Qq,Sc);rest.setMatrixAt(i,M)};
 S.flush=function(){rest.instanceMatrix.needsUpdate=true};
 S.reset=function(){sim.clear();fall.count=rest.count=0;fall.instanceMatrix.needsUpdate=rest.instanceMatrix.needsUpdate=true;S.pressing=false;hit=pending=null};
 S.stats=function(){return{active:sim.active.length,settled:sim.settled.length,killed:sim.stats.killed}};
 return S};
})(window.NooshinViewer=window.NooshinViewer||{});

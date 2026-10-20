/* Chocolate and mulberry syrup. A pour is a persistent bead-shaped ribbon laid on the real surface (model space, so it
   rotates with the ice cream). While pouring a falling stream and contact bead are drawn; at the end of a stroke on a
   slope the liquid keeps running downhill (drip) with the viscosity of the topping. Pooling thickens a point you hold. */
(function(N){
N.POURS={
 chocolate:{id:'chocolate',color:0x2a1109,emissive:0x000000,rough:.16,ccr:.05,opacity:1,width:.15,height:.055,spacing:.05,stream:.032,dripSpeed:.22,dripMax:.55,poolW:1.5,poolH:1.9,sink:.01},
 mulberry:{id:'mulberry',color:0x7a1a55,emissive:0x1e0316,rough:.06,ccr:.02,opacity:.94,width:.21,height:.03,spacing:.05,stream:.024,dripSpeed:.75,dripMax:1.5,poolW:2.3,poolH:1.2,sink:.01}};
var R=9,MAXPTS=240,V,MAXTOTAL=6000;
N.createPour=function(st,sf,def){
 var T=THREE;V=N.V;
 var P={def:def,trails:[],drips:[],pouring:false,pts:0,area:0},mat=new T.MeshPhysicalMaterial({color:def.color,emissive:def.emissive,roughness:def.rough,clearcoat:1,clearcoatRoughness:def.ccr,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 if(def.opacity<1){mat.transparent=true;mat.opacity=def.opacity}
 var IDX=new Uint32Array((MAXPTS-1)*(R-1)*6);N.fillIndex(IDX,R,MAXPTS);
 function Trail(){
  var g=new T.BufferGeometry(),pos=new Float32Array(MAXPTS*R*3),nrm=new Float32Array(MAXPTS*R*3),pa=new T.BufferAttribute(pos,3),na=new T.BufferAttribute(nrm,3);
  pa.setUsage(T.DynamicDrawUsage);na.setUsage(T.DynamicDrawUsage);g.setAttribute('position',pa);g.setAttribute('normal',na);g.setIndex(new T.BufferAttribute(IDX,1));g.setDrawRange(0,0);
  var m=new T.Mesh(g,mat);m.frustumCulled=false;m.receiveShadow=true;st.holder.add(m);
  this.g=g;this.pos=pos;this.nrm=nrm;this.pa=pa;this.na=na;this.mesh=m;this.pts=[]}
 Trail.prototype.write=function(k){var q=this.pts[k];N.ringWrite(this.pos,this.nrm,k,R,q.p,q.n,q.t,q.w,q.h,def.sink);this.pa.needsUpdate=this.na.needsUpdate=true};
 Trail.prototype.add=function(p,n,w,h){
  var a=this.pts,k=a.length,t=k?N.tangentOn(p,a[k-1].p,n,a[k-1].t):[0,0,1];
  a.push({p:p.slice(),n:n.slice(),t:t,w:w,h:h});if(!k)return;
  if(k===1){a[0].t=t;a[0].w*=.5;a[0].h*=.5;this.write(0)}
  this.write(k);this.g.setDrawRange(0,k*(R-1)*6)};
 Trail.prototype.tail=function(bead){var k=this.pts.length-1;if(k<1)return;var q=this.pts[k];q.w*=bead?1.25:.45;q.h*=bead?1.6:.45;this.write(k)};
 var cur=null,pending=null,lastHit=null,lastC=null,lastAdd=0,time=0,held=0;
 var stream=new T.Mesh(new T.CylinderGeometry(1,.55,1,10,1,true),mat),bead=new T.Mesh(new T.SphereGeometry(1,12,8),mat),Y=new T.Vector3(0,1,0),A=new T.Vector3(),B=new T.Vector3();
 stream.visible=bead.visible=false;stream.frustumCulled=bead.frustumCulled=false;st.holder.add(stream);st.holder.add(bead);
 function newTrail(){cur=new Trail();P.trails.push(cur);return cur}
 function lastPt(){return cur&&cur.pts[cur.pts.length-1]}
 function addHit(h){
  if(P.pts>MAXTOTAL)return;
  if(!cur)newTrail();
  if(cur.pts.length>=MAXPTS-1){var pp=lastPt();cur.tail();newTrail();cur.add(pp.p,pp.n,def.width,def.height)}
  var lp=lastPt();if(lp)P.area+=V.len(V.sub(h.p,lp.p))*def.width;
  cur.add(h.p,h.n,def.width,def.height);lastAdd=time;P.pts++}
 function breakStroke(){if(cur){cur.tail();cur=null}}
 /* a single tap/hold needs a second point to have a length: step a little along the surface */
 function ensureTwo(){
  if(!cur||cur.pts.length!==1)return;var q=cur.pts[0],ax=Math.abs(q.n[0])<.9?[1,0,0]:[0,1,0],tn=V.norm(V.cross(q.n,ax)),
   c=sf.closest(V.add(q.p,V.mul(tn,def.width*.6)),.3);if(c){cur.add([c.x,c.y,c.z],[c.nx,c.ny,c.nz],def.width,def.height)}}
 P.claim=function(e){var h=sf.pickClient(e.clientX,e.clientY);if(!h)return false;pending=h;return true};
 P.paint=function(kind,e){
  if(kind==='start'){P.pouring=true;held=0;lastC={x:e.clientX,y:e.clientY};cur=null;lastHit=pending||sf.pickClient(e.clientX,e.clientY);if(lastHit)addHit(lastHit);pending=null}
  else if(kind==='move'&&P.pouring){
   var dx=e.clientX-lastC.x,dy=e.clientY-lastC.y,n=Math.min(14,Math.max(1,Math.ceil(Math.hypot(dx,dy)/5)));
   for(var i=1;i<=n;i++){var h=sf.pickClient(lastC.x+dx*i/n,lastC.y+dy*i/n);
    if(!h){breakStroke();lastHit=null;continue}
    lastHit=h;var pt=lastPt();
    if(pt&&V.len(V.sub(h.p,pt.p))>.6){breakStroke();pt=null}
    if(!pt)addHit(h);else if(V.len(V.sub(h.p,pt.p))>=def.spacing)addHit(h)}
   lastC={x:e.clientX,y:e.clientY}}
  else if(kind==='end'&&P.pouring){
   P.pouring=false;stream.visible=bead.visible=false;
   if(cur){ensureTwo();var q=lastPt(),g=sf.gravity(),cosUp=q?-V.dot(q.n,g):1;
    if(q&&cur.pts.length>1&&cosUp<.78){var L=def.dripMax*(1-cosUp)*(.5+.5*Math.random());P.drips.push({trail:cur,p:q.p.slice(),n:q.n.slice(),left:L,len0:L,acc:0})}
    else cur.tail();cur=null}}};
 P.frame=function(dt){
  time+=dt;var anim=false,g=sf.gravity();
  if(P.pouring){anim=true;held+=dt;
   if(lastHit){var up=V.mul(g,-1),r=def.stream*(1+.1*Math.sin(time*28)),H=2.6,p=lastHit.p;
    A.set(up[0],up[1],up[2]);stream.quaternion.setFromUnitVectors(Y,A);stream.position.set(p[0]+up[0]*H/2,p[1]+up[1]*H/2,p[2]+up[2]*H/2);stream.scale.set(r,H,r);
    B.set(lastHit.n[0],lastHit.n[1],lastHit.n[2]);bead.quaternion.setFromUnitVectors(Y,B);bead.position.set(p[0]+B.x*def.height*.4,p[1]+B.y*def.height*.4,p[2]+B.z*def.height*.4);bead.scale.set(r*2.4,def.height*.7,r*2.4);
    stream.visible=bead.visible=true}else stream.visible=bead.visible=false;
   if(cur&&time-lastAdd>.08){if(cur.pts.length===1&&held>.12)ensureTwo();
    var k=cur.pts.length-1,q=cur.pts[k];if(k>=1){q.w=Math.min(def.width*def.poolW,q.w+dt*def.width*.8);q.h=Math.min(def.height*def.poolH,q.h+dt*def.height*.9);cur.write(k)}}}
  for(var i=P.drips.length-1;i>=0;i--){anim=true;var d=P.drips[i],dh=N.downhill(d.n,g);
   if(dh.s<.2||d.left<=0){d.trail.tail(true);P.drips.splice(i,1);continue}
   var step=Math.min(.05,def.dripSpeed*dh.s*dt),c=sf.closest(V.add(d.p,V.mul(dh.d,step)),.25);
   if(!c){d.trail.tail(true);P.drips.splice(i,1);continue}
   d.p=[c.x,c.y,c.z];d.n=[c.nx,c.ny,c.nz];d.left-=step;d.acc+=step;
   if(d.acc>=def.spacing*.8&&d.trail.pts.length<MAXPTS-1){var f=1-d.left/d.len0;d.trail.add(d.p,d.n,def.width*(1-.4*f),def.height*(1-.3*f));d.acc=0}}
  return anim};
 P.mat=mat;
 P.abort=function(){if(P.pouring)P.paint('end',{clientX:0,clientY:0})};
 /* freeze the pour for the reset animation: finish stroke, close running drips */
 P.beginReset=function(){P.abort();P.drips.forEach(function(d){d.trail.tail(true)});P.drips.length=0;cur=null;stream.visible=bead.visible=false};
 P.reset=function(){P.trails.forEach(function(t){st.holder.remove(t.mesh);t.g.dispose();if(t.mesh.material!==mat&&t.mesh.material.dispose)t.mesh.material.dispose()});P.trails.length=0;P.drips.length=0;cur=null;P.pouring=false;P.pts=0;P.area=0;stream.visible=bead.visible=false};
 P.stats=function(){return{trails:P.trails.length,points:P.pts,drips:P.drips.length}};
 return P};
})(window.NooshinViewer=window.NooshinViewer||{});

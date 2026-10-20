/* Approximate rigid-body simulation for Smarties (no Three.js). Candies fall under gravity, collide with the real
   surface through closest-point queries, bounce slightly, roll/slide, collide with already settled candies and finally
   settle lying flat on the surface. world.closest(p,maxD) -> {x,y,z,nx,ny,nz,d}. */
(function(N){
var V=N.V;
function qmul(a,b){return[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]}
function qn(q){var l=Math.hypot(q[0],q[1],q[2],q[3])||1;return[q[0]/l,q[1]/l,q[2]/l,q[3]/l]}
function qrot(q,v){var u=[q[0],q[1],q[2]],t=V.mul(V.cross(u,v),2);return V.add(V.add(v,V.mul(t,q[3])),V.cross(u,t))}
function qfrom(a,b){var d=V.dot(a,b);if(d<-.999999){var ax=Math.abs(a[0])<.9?[1,0,0]:[0,1,0];ax=V.norm(V.cross(a,ax));return[ax[0],ax[1],ax[2],0]}
 var c=V.cross(a,b);return qn([c[0],c[1],c[2],1+d])}
function nlerp(a,b,k){var d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3],s=d<0?-1:1;return qn([a[0]+(s*b[0]-a[0])*k,a[1]+(s*b[1]-a[1])*k,a[2]+(s*b[2]-a[2])*k,a[3]+(s*b[3]-a[3])*k])}
function align(q,n,k){var ay=qrot(q,[0,1,0]);if(V.dot(ay,n)<0)n=V.mul(n,-1);return nlerp(q,qmul(qfrom(ay,n),q),k)}
N.Q={mul:qmul,norm:qn,rot:qrot,fromUV:qfrom,axisAngle:function(ax,a){var s=Math.sin(a/2);return[ax[0]*s,ax[1]*s,ax[2]*s,Math.cos(a/2)]}};
N.CandySim=function(world,o){
 o=o||{};var s=this;
 s.world=world;s.g=[0,-1,0];s.G=o.G||16;s.r=o.r||.1;s.half=o.half||.055;s.e=o.e===undefined?.25:o.e;s.mu=o.mu||2.2;
 s.maxActive=o.maxActive||48;s.maxSettled=o.maxSettled||260;s.kill=o.kill===undefined?-4:o.kill;
 s.active=[];s.settled=[];s.onSettle=null;s.stats={killed:0,bounces:0};
 var grid={},cell=s.r*2.4,seq=0;
 function key(p){return Math.floor(p[0]/cell)+','+Math.floor(p[1]/cell)+','+Math.floor(p[2]/cell)}
 function gadd(c){var k=key(c.p);(grid[k]=grid[k]||[]).push(c)}
 function near(p,fn){var i=Math.floor(p[0]/cell),j=Math.floor(p[1]/cell),k=Math.floor(p[2]/cell);
  for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++)for(var c=-1;c<=1;c++){var l=grid[(i+a)+','+(j+b)+','+(k+c)];if(l)for(var m=0;m<l.length;m++)fn(l[m])}}
 s.canSpawn=function(){return s.active.length<s.maxActive&&s.settled.length+s.active.length<s.maxSettled};
 s.spawn=function(p,v,col){
  if(!s.canSpawn())return null;
  var q=qn([Math.random()-.5,Math.random()-.5,Math.random()-.5,Math.random()-.5]),c={id:++seq,p:p.slice(),v:(v||[0,0,0]).slice(),q:q,w:[(Math.random()-.5)*16,(Math.random()-.5)*16,(Math.random()-.5)*16],col:col===undefined?(Math.random()*8|0):col,t:0,rest:0,still:0,contact:false,n:[0,1,0]};
  s.active.push(c);return c};
 function relocate(c){
  var up=V.mul(s.g,-1),a=Math.abs(c.n[1])<.9?[0,1,0]:[1,0,0],u=V.norm(V.cross(c.n,a)),v=V.cross(c.n,u);
  for(var r=.2;r<=.5;r+=.15)for(var k=0;k<8;k++){var ang=k*Math.PI/4,q=V.add(c.p,V.add(V.mul(u,Math.cos(ang)*r),V.mul(v,Math.sin(ang)*r))),cl=world.closest(q,.4);
   if(!cl||cl.d>.4)continue;var n=[cl.nx,cl.ny,cl.nz],np=[cl.x+n[0]*s.half,cl.y+n[1]*s.half,cl.z+n[2]*s.half],clash=false;
   near(np,function(o){if(V.len(V.sub(np,o.p))<s.r*2*.9)clash=true});
   if(!clash&&V.dot(n,up)>.3){c.p=np;c.n=n;return true}}
  return false}
 function settle(c,i){
  var cl=world.closest(c.p,s.r*3);
  if(cl&&cl.d<s.half+s.r*.4){var n=[cl.nx,cl.ny,cl.nz],np=[cl.x+n[0]*s.half,cl.y+n[1]*s.half,cl.z+n[2]*s.half],clash=false;
  near(np,function(o){if(V.len(V.sub(np,o.p))<s.r*2*.88)clash=true});if(!clash){c.p=np;c.n=n}}/* resting on another candy or snapping would overlap: keep contact position */
  c.q=align(c.q,c.n,1);c.v=[0,0,0];c.w=[0,0,0];s.active.splice(i,1);s.settled.push(c);gadd(c);if(s.onSettle)s.onSettle(c)}
 var curUp=[0,1,0];
 function resolve(c,n,pen,e,h){
  c.p=V.add(c.p,V.mul(n,pen));var vn=V.dot(c.v,n),imp=0;
  if(vn<0){imp=-vn;/* sticky surface: the bounce fades out on slopes (full on flat, none steeper than ~30deg) so candies do not hop off the curve */var ee=imp>.5?e*Math.max(0,Math.min(1,(V.dot(n,curUp)-.85)/.15)):0;if(ee>0)s.stats.bounces++;c.v=V.sub(c.v,V.mul(n,(1+ee)*vn))}
  var vn2=V.dot(c.v,n),vt=V.sub(c.v,V.mul(n,vn2)),sp=V.len(vt);
  /* Coulomb friction: sticky ice-cream surface, candy only slides when the slope is steeper than atan(mu) */
  var dv=s.mu*s.G*Math.max(0,V.dot(n,curUp))*h+imp*.9;
  vt=sp<=dv?[0,0,0]:V.mul(vt,(sp-dv)/sp);
  c.v=V.add(V.mul(n,vn2),vt);
  c.w=V.add(V.mul(c.w,.85),V.mul(V.cross(n,vt),.15/s.r*.6));c.contact=true;c.n=n}
 s.step=function(dt){
  var sub=Math.max(1,Math.ceil(dt*90)),h=dt/sub,up=V.mul(s.g,-1),R=s.r*.9;curUp=up;
  for(var it=0;it<sub;it++)for(var i=s.active.length-1;i>=0;i--){
   var c=s.active[i];c.t+=h;c.contact=false;
   c.v=V.add(c.v,V.mul(s.g,s.G*h));c.p=V.add(c.p,V.mul(c.v,h));
   var cl=world.closest(c.p,R+.05);
   if(cl&&cl.d<R+1e-9||cl&&V.dot(V.sub(c.p,[cl.x,cl.y,cl.z]),[cl.nx,cl.ny,cl.nz])<0){
    var sn=[cl.nx,cl.ny,cl.nz],dv=V.sub(c.p,[cl.x,cl.y,cl.z]),inside=V.dot(dv,sn)<0;
    var n=inside||cl.d<1e-6?sn:V.mul(dv,1/cl.d),pen=inside?R+cl.d:R-cl.d;resolve(c,n,pen,s.e,h)}
   near(c.p,function(o){var d=V.sub(c.p,o.p),l=V.len(d);if(l<R*2*.92){var nn=l>1e-6?V.mul(d,1/l):curUp;resolve(c,nn,R*2*.92-l,s.e*.5,h);
    if(V.dot(nn,up)>.85&&!c.kicked){c.kicked=true;/* landed squarely on top of another candy: topple sideways so they spread instead of stacking in towers */
     var tk=V.cross(up,[Math.random()-.5,Math.random()-.5,Math.random()-.5]);c.v=V.add(c.v,V.mul(V.norm(tk),.5))}}});
   if(c.contact){c.q=align(c.q,c.n,1-Math.exp(-h*12))}else{c.w=V.mul(c.w,Math.exp(-h*1.2))}
   c.q=qn(qmul([c.w[0]*h*.5,c.w[1]*h*.5,c.w[2]*h*.5,1],c.q));
   var sp=V.len(c.v),upn=c.contact?V.dot(c.n,up):0;
   if(c.contact&&sp<.2&&upn>.3)c.rest+=h;else c.rest=Math.max(0,c.rest-h);
   /* sticky: a candy pinned against a wall or crevice (not moving, in contact) stays where it is instead of lingering as 'falling' */
   if(c.contact&&sp<.2)c.still+=h;else c.still=Math.max(0,c.still-h);
   if(c.rest>.18||c.still>.6||(c.t>7&&c.contact&&upn>0)){var ov=false;near(c.p,function(o){if(V.len(V.sub(c.p,o.p))<R*2*.8)ov=true});if(!ov){settle(c,i);continue}
    if(c.still>1.2){/* pinned inside a pile: move to the nearest free spot on the surface, or drop it, never leave overlapping candies */
     if(relocate(c)){settle(c,i)}else{s.active.splice(i,1);s.stats.killed++}continue}
    c.rest=0}
   if(V.dot(c.p,up)<s.kill||c.t>12){s.active.splice(i,1);s.stats.killed++}}};
 s.clear=function(){s.active.length=0;s.settled.length=0;grid={};s.stats={killed:0,bounces:0}};
};
})(window.NooshinViewer=window.NooshinViewer||{});

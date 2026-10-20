/* Cinematic topping reset. The real accumulated objects are animated, nothing is hidden at once:
   - the model spins one turn with a cinematic tilt and a slight push-in, then returns to the default angle;
   - every chocolate/syrup trail peels off the surface ring by ring (staggered along its length), is carried into a
     curved, thinning ribbon that swirls around the model, sheds droplets, and dissolves at its own time;
   - every Smartie (settled or still falling) lifts off, spins on its own axis, and scatters on its own path;
   - at the end the clean model is revealed and the controls come back.
   Motion is rotation about the model's vertical axis plus outward travel, so nothing moves back into the ice cream. */
(function(N){
var V=N.V,Q=N.Q,TAU=Math.PI*2,R9=9,COS=[],SIN=[],SCN=256;
for(var i=0;i<R9;i++){var th=Math.PI*i/(R9-1);COS.push(Math.cos(th));SIN.push(Math.sin(th))}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function ss(a,b,x){x=(x-a)/(b-a);x=x<0?0:x>1?1:x;return x*x*(3-2*x)}
function eio(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function normTable(def){var a=def.width/2,h=def.height,cs=[],cn=[];
 for(var i=0;i<R9;i++){var x=h*COS[i],y=a*SIN[i],l=Math.hypot(x,y)||1;x/=l;y=y/l+.3;var l2=Math.hypot(x,y)||1;cs.push(x/l2);cn.push(y/l2)}return{cs:cs,cn:cn}}
var OUT=[0,0,0,0,0,0,0,0];
/* centre/normal/size of ring k of trail plan o at local progress u (0..1) and absolute time t -> OUT */
function place(o,k,u,t){
 var i=k*3,px=o.p[i],py=o.p[i+1],pz=o.p[i+2],nx=o.nn[i],ny=o.nn[i+1],nz=o.nn[i+2],ox=o.dd[i],oy=o.dd[i+1],oz=o.dd[i+2];
 u=u<0?0:u>1?1:u;var lift=ss(0,.3,u),w=ss(.22,1,u),m=ss(0,.5,u),m2=ss(0,.6,u);
 var dx=nx+(ox-nx)*m,dy=ny+(oy-ny)*m,dz=nz+(oz-nz)*m,l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
 var dist=o.L1*lift+o.L2*w*w,qx=px+dx*dist,qy=py+dy*dist+o.amp*Math.sin(o.ph+k*.32+t*3.2)*w*(1-.5*w),qz=pz+dz*dist;
 var a=o.om*w,c=Math.cos(a),s=Math.sin(a);OUT[0]=c*qx+s*qz;OUT[1]=qy;OUT[2]=-s*qx+c*qz;
 var mx=nx+(ox-nx)*m2,my=ny+(oy-ny)*m2,mz=nz+(oz-nz)*m2;l=Math.hypot(mx,my,mz)||1;mx/=l;my/=l;mz/=l;
 OUT[3]=c*mx+s*mz;OUT[4]=my;OUT[5]=-s*mx+c*mz;
 var thin=1-ss(.62,1,u);OUT[6]=o.w0[k]*(1-.25*w)*thin;OUT[7]=o.h0[k]*(1-.45*w)*thin}
N.createReset=function(st,sf,H,uc){
 var T=THREE,cfg={},ctl=st.controls,S={state:'idle'},C=[0,0,0],UP=[0,1,0],plan=null,cam=null,hold=0,holdT=0,lt=0,t=0,ev=null;
 var DEF={maxCandies:120,maxCoverage:.1,maxTrailPoints:2500,maxTrails:80,holdMs:1400,minDuration:1.8,tilt:.26,zoomPunch:.1,turns:1},d0=N.ResetConfig||{},k;
 for(k in DEF)cfg[k]=DEF[k];for(k in d0)cfg[k]=d0[k];for(k in (uc||{}))cfg[k]=uc[k];S.cfg=cfg;
 var MAXD=160,dgeo=new T.SphereGeometry(1,10,8),drops={},Pv=new T.Vector3(),Qq=new T.Quaternion(),Sc=new T.Vector3(),Mx=new T.Matrix4(),Yv=new T.Vector3(0,1,0),Dv=new T.Vector3();
 ['chocolate','mulberry'].forEach(function(id){if(!H[id])return;var m=new T.InstancedMesh(dgeo,H[id].mat.clone(),MAXD);m.count=0;m.frustumCulled=false;m.castShadow=false;st.holder.add(m);drops[id]=m});
 var scr={cx:new Float32Array(SCN),cy:new Float32Array(SCN),cz:new Float32Array(SCN),nx:new Float32Array(SCN),ny:new Float32Array(SCN),nz:new Float32Array(SCN),w:new Float32Array(SCN),h:new Float32Array(SCN)};
 function emit(){N.busy=S.state!=='idle';N.resetRunning=S.state==='running';N.emit('reset:state',{state:S.state});N.emit('toppings:changed')}
 /* ---- how full is the ice cream? ---- */
 S.metrics=function(){var area=0,pts=0,tr=0;
  ['chocolate','mulberry'].forEach(function(id){var P=H[id];if(P){area+=P.area;pts+=P.pts;tr+=P.trails.length}});
  var sm=H.smarties?H.smarties.stats():{settled:0,active:0},cand=sm.settled+sm.active;area+=cand*Math.PI*.01;
  return{coverage:area/(sf.area||25),candies:cand,points:pts,trails:tr}};
 function over(m){return m.candies>=cfg.maxCandies||m.coverage>=cfg.maxCoverage||m.points>=cfg.maxTrailPoints||m.trails>=cfg.maxTrails}
 function abortPaint(){['chocolate','mulberry','smarties'].forEach(function(id){H[id]&&H[id].abort&&H[id].abort()});N.emit('reset:abort')}
 S.check=function(){if(S.state!=='idle')return false;var m=S.last=S.metrics();if(!over(m))return false;
  abortPaint();N.Toppings.deselect();S.state='holding';hold=cfg.holdMs/1000;holdT=performance.now();emit();return true};
 /* manual button and auto trigger share the same sequence; repeated clicks while running are ignored */
 S.request=function(){if(S.state==='running')return false;startRun();return true};
 /* ---- build the choreography from the actual objects ---- */
 function build(list,cands){
  var rnd=mulberry(cfg.seed===undefined?(Math.random()*1e9|0):cfg.seed),dir=rnd()<.5?1:-1,pl={trails:[],cands:[],drops:[],T:0},nd={chocolate:0,mulberry:0};
  list.forEach(function(e){var tr=e.tr,n=Math.min(tr.pts.length,SCN),def=e.P.def,tb=normTable(def);
   var o={e:e,n:n,nt:tb,sink:def.sink,t0:rnd()*.7,dur:1.9+rnd()*.5,span:Math.min(.55,.15+n*.012),rev:rnd()<.5,om:dir*(1.8+rnd()*1.6),L1:.16+rnd()*.1,L2:1+rnd()*.7,amp:.05+rnd()*.08,ph:rnd()*6.28,base:def.opacity,
    p:new Float32Array(n*3),nn:new Float32Array(n*3),dd:new Float32Array(n*3),tt:new Float32Array(n*3),w0:new Float32Array(n),h0:new Float32Array(n),u:new Float32Array(n),done:false};
   for(var k=0;k<n;k++){var q=tr.pts[k],i=k*3,od=V.norm(V.add(V.norm(V.sub(q.p,C)),V.mul(UP,.35)));
    o.p[i]=q.p[0];o.p[i+1]=q.p[1];o.p[i+2]=q.p[2];o.nn[i]=q.n[0];o.nn[i+1]=q.n[1];o.nn[i+2]=q.n[2];o.tt[i]=q.t[0];o.tt[i+1]=q.t[1];o.tt[i+2]=q.t[2];o.dd[i]=od[0];o.dd[i+1]=od[1];o.dd[i+2]=od[2];o.w0[k]=q.w;o.h0[k]=q.h}
   var m=tr.mesh.material=e.P.mat.clone();m.transparent=true;o.mat=m;o.end=o.t0+o.span+o.dur;pl.T=Math.max(pl.T,o.end);pl.trails.push(o);
   var cnt=Math.min(4,1+((n/60)|0));
   for(var d=0;d<cnt&&nd[e.id]<MAXD/ Math.max(1,1);d++){var kk=1+((rnd()*(n-2))|0),ts=o.t0+(o.rev?(n-1-kk):kk)/(n-1||1)*o.span+.3*o.dur,life=1.3+rnd()*.6;
    nd[e.id]++;pl.drops.push({o:o,id:e.id,k:kk,r:.022+rnd()*.03,life:life,sp:.6+rnd()*.9,om:dir*(1+rnd()*2.5),ts:ts,on:false,sx:0,sy:0,sz:0,ox:0,oy:0,oz:0});pl.T=Math.max(pl.T,ts+life)}});
  cands.forEach(function(c,i){var o={c:c,t0:.2+rnd()*1.1,dur:1.7+rnd()*.9,om:dir*(rnd()<.8?1:-1)*(1.6+rnd()*2.2),L1:.12+rnd()*.1,L2:1.4+rnd()*1.4,spin:6+rnd()*10,ax:V.norm([rnd()-.5,rnd()-.5,rnd()-.5]),
    od:V.norm(V.add(V.norm(V.sub(c.p,C)),V.mul(UP,.35)))};o.end=o.t0+o.dur;pl.T=Math.max(pl.T,o.end);pl.cands.push(o)});
  pl.T=Math.max(cfg.minDuration,pl.T+.35);return pl}
 function startRun(){
  abortPaint();N.Toppings.deselect();
  var list=[];['chocolate','mulberry'].forEach(function(id){var P=H[id];if(!P)return;P.beginReset();P.trails.forEach(function(tr){if(tr.pts.length>1)list.push({P:P,id:id,tr:tr})})});
  var cands=H.smarties?H.smarties.beginReset():[];
  plan=build(list,cands);t=0;S.state='running';ctl.lock();
  var def=ctl.def,r=((ctl.yaw-def.yaw)%TAU+TAU)%TAU,dy=TAU-r;if(dy<3.6)dy+=TAU;dy+=(Math.max(1,cfg.turns)-1)*TAU;
  cam={y0:ctl.yaw,p0:ctl.pitch,z0:ctl.zoom,dy:dy};emit();st.invalidate()}
 /* ---- per-frame animation ---- */
 function camera(){var p=Math.min(1,t/plan.T),e=eio(p),def=ctl.def;
  ctl.yaw=cam.y0+cam.dy*e;ctl.pitch=cam.p0+(def.pitch-cam.p0)*e+cfg.tilt*Math.pow(Math.sin(Math.PI*p),2);
  ctl.zoom=Math.min(ctl.maxZoom,Math.max(ctl.minZoom,cam.z0+(def.zoom-cam.z0)*e+cfg.zoomPunch*Math.sin(Math.PI*p)))}
 function animTrail(o){
  if(o.done)return;var n=o.n,tr=o.e.tr,den=n-1||1,any=false,k,u;
  if(t>=o.end){o.done=true;tr.mesh.visible=false;return}
  for(k=0;k<n;k++){u=(t-o.t0-(o.rev?(n-1-k):k)/den*o.span)/o.dur;o.u[k]=u;
   if(u<=0){var i=k*3;scr.cx[k]=o.p[i];scr.cy[k]=o.p[i+1];scr.cz[k]=o.p[i+2];continue}
   any=true;place(o,k,u,t);scr.cx[k]=OUT[0];scr.cy[k]=OUT[1];scr.cz[k]=OUT[2];scr.nx[k]=OUT[3];scr.ny[k]=OUT[4];scr.nz[k]=OUT[5];scr.w[k]=OUT[6];scr.h[k]=OUT[7]}
  if(!any)return;
  var pos=tr.pos,nrm=tr.nrm,cs=o.nt.cs,cn=o.nt.cn;
  for(k=0;k<n;k++){u=o.u[k];if(u<=0)continue;
   var a=k>0?k-1:k,b=k<n-1?k+1:k,tx=scr.cx[b]-scr.cx[a],ty=scr.cy[b]-scr.cy[a],tz=scr.cz[b]-scr.cz[a],l=Math.hypot(tx,ty,tz),i3=k*3,bl=ss(0,.15,u);
   if(l>1e-7){tx/=l;ty/=l;tz/=l;tx=o.tt[i3]*(1-bl)+tx*bl;ty=o.tt[i3+1]*(1-bl)+ty*bl;tz=o.tt[i3+2]*(1-bl)+tz*bl}else{tx=o.tt[i3];ty=o.tt[i3+1];tz=o.tt[i3+2]}
   var nx=scr.nx[k],ny=scr.ny[k],nz=scr.nz[k],d=tx*nx+ty*ny+tz*nz;tx-=nx*d;ty-=ny*d;tz-=nz*d;l=Math.hypot(tx,ty,tz);
   if(l<1e-6){tx=o.tt[i3];ty=o.tt[i3+1];tz=o.tt[i3+2];d=tx*nx+ty*ny+tz*nz;tx-=nx*d;ty-=ny*d;tz-=nz*d;l=Math.hypot(tx,ty,tz)||1}tx/=l;ty/=l;tz/=l;
   var sx=ny*tz-nz*ty,sy=nz*tx-nx*tz,sz=nx*ty-ny*tx;l=Math.hypot(sx,sy,sz)||1;sx/=l;sy/=l;sz/=l;
   var aw=scr.w[k]*.5,hh=scr.h[k],ox=scr.cx[k],oy=scr.cy[k],oz=scr.cz[k],base=k*R9*3,sink=o.sink*(hh>0?1:0);
   for(var j=0;j<R9;j++){var ca=aw*COS[j],ch=hh*SIN[j]-((j===0||j===R9-1)?Math.min(sink,hh):0),q=base+j*3;
    pos[q]=ox+sx*ca+nx*ch;pos[q+1]=oy+sy*ca+ny*ch;pos[q+2]=oz+sz*ca+nz*ch;
    nrm[q]=cs[j]*sx+cn[j]*nx;nrm[q+1]=cs[j]*sy+cn[j]*ny;nrm[q+2]=cs[j]*sz+cn[j]*nz}}
  tr.pa.needsUpdate=tr.na.needsUpdate=true;
  o.mat.opacity=o.base*(1-ss(.7,1,(t-o.t0)/(o.dur+o.span)))}
 function candies(){var sm=H.smarties;if(!sm)return;
  plan.cands.forEach(function(o,i){var c=o.c,u=(t-o.t0)/o.dur,p=c.p,q=c.q,sc=1;
   if(u>0){u=u>1?1:u;var lift=ss(0,.3,u),w=ss(0,1,u),m=ss(0,.5,u),dx=c.n[0]+(o.od[0]-c.n[0])*m,dy=c.n[1]+(o.od[1]-c.n[1])*m,dz=c.n[2]+(o.od[2]-c.n[2])*m,l=Math.hypot(dx,dy,dz)||1,
     dist=o.L1*lift+o.L2*w*w,qx=c.p[0]+dx/l*dist,qy=c.p[1]+dy/l*dist,qz=c.p[2]+dz/l*dist,a=o.om*w,ca=Math.cos(a),sa=Math.sin(a);
    p=[ca*qx+sa*qz,qy,-sa*qx+ca*qz];q=Q.mul(Q.axisAngle(o.ax,o.spin*o.dur*w),c.q);sc=1-ss(.7,1,u)}
   sm.setCandy(i,p,q,sc)});sm.flush()}
 function droplets(){var cnt={chocolate:0,mulberry:0};
  plan.drops.forEach(function(d){var tau=(t-d.ts)/d.life;if(tau<=0||tau>=1)return;
   if(!d.on){d.on=true;place(d.o,d.k,.3,d.ts);d.sx=OUT[0];d.sy=OUT[1];d.sz=OUT[2];var od=V.norm(V.add(V.norm([d.sx,d.sy,d.sz]),V.mul(UP,.25)));d.ox=od[0];d.oy=od[1];d.oz=od[2]}
   function at(tt,o){var e=1-(1-tt)*(1-tt),qx=d.sx+d.ox*d.sp*e,qy=d.sy+d.oy*d.sp*e,qz=d.sz+d.oz*d.sp*e,a=d.om*e,c=Math.cos(a),s=Math.sin(a);o[0]=c*qx+s*qz;o[1]=qy;o[2]=-s*qx+c*qz}
   var p=[0,0,0],p2=[0,0,0];at(tau,p);at(Math.min(1,tau+.03),p2);var vx=p2[0]-p[0],vy=p2[1]-p[1],vz=p2[2]-p[2],vl=Math.hypot(vx,vy,vz);
   var r=d.r*ss(0,.12,tau)*(1-ss(.7,1,tau)),mesh=drops[d.id];if(!mesh)return;
   Pv.set(p[0],p[1],p[2]);Dv.set(vl>1e-9?vx/vl:0,vl>1e-9?vy/vl:1,vl>1e-9?vz/vl:0);Qq.setFromUnitVectors(Yv,Dv);Sc.set(r,r*(1+.9*(1-tau)),r);Mx.compose(Pv,Qq,Sc);mesh.setMatrixAt(cnt[d.id]++,Mx)});
  for(var id in drops){drops[id].count=cnt[id];drops[id].instanceMatrix.needsUpdate=true}}
 function finish(){
  var def=ctl.def;ctl.yaw=def.yaw;ctl.pitch=def.pitch;ctl.zoom=def.zoom;
  ['chocolate','mulberry'].forEach(function(id){H[id]&&H[id].reset()});H.smarties&&H.smarties.reset();
  for(var id in drops){drops[id].count=0}
  plan=null;cam=null;ctl.unlock();S.state='idle';lt=0;emit();N.emit('reset:done');st.invalidate()}
 S.frame=function(dt){
  if(S.state==='idle'){S.check();return S.state!=='idle'}
  if(S.state==='holding'){/* wall-clock based (frame dt is clamped, so a slow device would stretch the hold); capped so time spent off-screen does not count */
  var now=performance.now();hold-=Math.max(dt,Math.min(.25,(now-holdT)/1000));holdT=now;if(hold<=0)startRun();return true}
  t=Math.min(plan.T,t+dt);camera();plan.trails.forEach(animTrail);candies();droplets();
  if(t>=plan.T)finish();return true};
 S.after=function(){S.check()};
 return S};
})(window.NooshinViewer=window.NooshinViewer||{});

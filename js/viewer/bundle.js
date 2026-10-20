/* ---- bus.js ---- */
/* Tiny event bus + shared namespace for the 3D viewer modules. */
(function(N){var h={};
N.on=function(e,f){(h[e]=h[e]||[]).push(f)};
N.off=function(e,f){h[e]=(h[e]||[]).filter(function(x){return x!==f})};
N.emit=function(e,d){(h[e]||[]).slice().forEach(function(f){f(d)})};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- controls.js ---- */
/* Rotation/zoom controls. No Three.js dependency: mouse drag (yaw+pitch), touch drag (yaw only so the page can still
   scroll vertically), two-finger pinch zoom, keyboard arrows, inertia, tap detection and an eased reset. */
(function(N){
var TAU=Math.PI*2,clamp=function(v,a,b){return Math.min(b,Math.max(a,v))};
N.Controls=function(el,o){
 o=o||{};var s=this;
 s.def={yaw:0,pitch:.1,zoom:1};s.yaw=s.def.yaw;s.pitch=s.def.pitch;s.zoom=1;
 s.minPitch=-.25;s.maxPitch=.5;s.minZoom=.8;s.maxZoom=1.5;
 s.auto=o.auto!==false;s.autoSpeed=.35;
 var claimed=null,vy=0,vp=0,drag=false,moved=0,lt=0,ptrs={},n=0,pinch0=0,zoom0=1,anim=null;
 function ch(){o.onChange&&o.onChange()}
 function dist(){var k=Object.keys(ptrs);var a=ptrs[k[0]],b=ptrs[k[1]];return Math.hypot(a.x-b.x,a.y-b.y)}
 s.stopAuto=function(){s.auto=false};
 function down(e){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(s.locked||claimed!==null)return;
  if(n===0&&o.claim&&o.claim(e)){claimed=e.pointerId;try{el.setPointerCapture(e.pointerId)}catch(_){}o.onPaint('start',e);ch();return}
  if(!ptrs[e.pointerId])n++;ptrs[e.pointerId]={x:e.clientX,y:e.clientY};
  try{el.setPointerCapture(e.pointerId)}catch(_){}
  if(n===1){drag=true;moved=0;vy=vp=0;anim=null;lt=performance.now();s.stopAuto()}
  else if(n===2){pinch0=dist();zoom0=s.zoom}
  ch()}
 function move(e){
  if(claimed===e.pointerId){o.onPaint('move',e);return}
  var p=ptrs[e.pointerId];if(!p)return;
  var dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(n>=2){if(pinch0)s.zoom=clamp(zoom0*dist()/pinch0,s.minZoom,s.maxZoom);ch();return}
  if(!drag)return;
  moved+=Math.abs(dx)+Math.abs(dy);
  var now=performance.now(),dt=Math.max(1,now-lt)/1000;lt=now;
  var ry=dx*.009;s.yaw+=ry;vy=ry/dt*.6+vy*.4;
  if(e.pointerType!=='touch'){var rp=dy*.005;s.pitch=clamp(s.pitch+rp,s.minPitch,s.maxPitch);vp=rp/dt*.6+vp*.4}
  ch()}
 function end(e,cancel){
  if(claimed===e.pointerId){claimed=null;try{el.releasePointerCapture(e.pointerId)}catch(_){}o.onPaint('end',e);ch();return}
  if(!ptrs[e.pointerId])return;delete ptrs[e.pointerId];n--;
  try{el.releasePointerCapture(e.pointerId)}catch(_){}
  if(n<=0){n=0;drag=false;
   if(!cancel&&moved<6&&o.onTap)o.onTap(e);
   if(performance.now()-lt>90)vy=vp=0}
  ch()}
 function key(e){
  if(s.locked)return;
  var k=e.key,d=k==='ArrowLeft'?-1:k==='ArrowRight'?1:0;
  if(d){s.stopAuto();vy+=d*2.2;e.preventDefault();ch()}
  else if(k==='ArrowUp'||k==='ArrowDown'){s.stopAuto();vp+=(k==='ArrowUp'?-1:1)*1.2;e.preventDefault();ch()}}
 var up=function(e){end(e,false)},cancel=function(e){end(e,true)};
 el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',cancel);
 el.addEventListener('keydown',key);
 s.resetTo=function(d){
  var k=Math.round(s.yaw/TAU)*TAU;s.auto=false;vy=vp=0;
  anim={t:0,d:d||.9,y0:s.yaw,y1:k+s.def.yaw,p0:s.pitch,p1:s.def.pitch,z0:s.zoom,z1:s.def.zoom};ch()};
 /* advance by dt seconds; returns true while something is moving (caller keeps rendering) */
 s.locked=false;
 s.lock=function(){s.locked=true;drag=false;n=0;ptrs={};claimed=null;vy=vp=0;anim=null;s.auto=false};
 s.unlock=function(){s.locked=false};
 s.update=function(dt){
  if(s.locked)return false;
  if(anim){anim.t+=dt;var k=Math.min(1,anim.t/anim.d),e=1-Math.pow(1-k,3);
   s.yaw=anim.y0+(anim.y1-anim.y0)*e;s.pitch=anim.p0+(anim.p1-anim.p0)*e;s.zoom=anim.z0+(anim.z1-anim.z0)*e;
   if(k>=1)anim=null;return true}
  if(drag)return true;
  var m=false;
  if(Math.abs(vy)>.02||Math.abs(vp)>.02){var f=Math.exp(-dt*4.5);vy*=f;vp*=f;s.yaw+=vy*dt;s.pitch=clamp(s.pitch+vp*dt,s.minPitch,s.maxPitch);m=true}else vy=vp=0;
  if(s.auto){s.yaw+=s.autoSpeed*dt;m=true}
  return m};
 s.dispose=function(){['pointerdown','pointermove','pointerup','pointercancel','keydown'].forEach(function(t){el.removeEventListener(t,{pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,keydown:key}[t])})};
 el.tabIndex=0;
};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- lighting.js ---- */
/* Studio lighting: procedural HDR-style environment (soft boxes) + key/rim/fill lights + soft shadow. */
(function(N){
N.addLighting=function(st){
 var T=THREE,ren=st.renderer,scene=st.scene;
 ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;
 ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.05;ren.outputEncoding=T.sRGBEncoding;
 var env=new T.Scene(),c=document.createElement('canvas');c.width=2;c.height=256;
 var x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
 g.addColorStop(0,'#fff4e2');g.addColorStop(.5,'#b98a63');g.addColorStop(1,'#3a2218');x.fillStyle=g;x.fillRect(0,0,2,256);
 var tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;
 env.add(new T.Mesh(new T.SphereGeometry(10,32,16),new T.MeshBasicMaterial({map:tex,side:T.BackSide})));
 function box(w,h,p,i){var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(i,i*.95,i*.88),side:T.DoubleSide}));m.position.set(p[0],p[1],p[2]);m.lookAt(0,0,0);env.add(m)}
 box(6,4,[5,5,5],9);box(3,6,[-6,2,2],4);box(8,1.5,[0,-2,-7],3);
 var pm=new T.PMREMGenerator(ren),rt=null;
 function buildEnv(){if(rt&&rt.dispose)rt.dispose();rt=pm.fromScene(env,.03);scene.environment=rt.texture}
 buildEnv();
 /* a restored WebGL context loses the contents of render targets: re-render the environment or the model turns black */
 ren.domElement.addEventListener('webglcontextrestored',function(){buildEnv();st.invalidate&&st.invalidate()});
 var key=new T.DirectionalLight(0xfff0dc,2.2);key.position.set(4,8,6);key.castShadow=true;
 var ms=st.mobile?1024:2048;key.shadow.mapSize.set(ms,ms);
 var sc=key.shadow.camera;sc.left=sc.bottom=-6;sc.right=sc.top=6;sc.near=1;sc.far=30;
 key.shadow.bias=-.0005;key.shadow.normalBias=.03;key.shadow.radius=4;scene.add(key);
 var rim=new T.DirectionalLight(0xffc89a,1.2);rim.position.set(-5,3,-5);scene.add(rim);
 scene.add(new T.HemisphereLight(0xfff1dc,0x5a3524,.35));
 return{key:key,rim:rim};
};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- procedural.js ---- */
/* Stand-in ice cream used until models/ice-cream.glb exists (or if it fails to load).
   Node names mirror what the real model should expose; scoops are tagged as topping receivers. */
(function(N){
N.buildProcedural=function(){
 var T=THREE,root=new T.Group();root.name='IceCream';
 function grain(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d'),d=x.createImageData(256,256);
  for(var i=0;i<d.data.length;i+=4){var v=110+Math.random()*90;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}
  x.putImageData(d,0,0);var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);return t}
 function waffle(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');
  x.fillStyle='#dcaa64';x.fillRect(0,0,256,256);x.strokeStyle='#a8742f';x.lineWidth=10;
  for(var i=-256;i<512;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke();x.beginPath();x.moveTo(i+256,0);x.lineTo(i,256);x.stroke()}
  var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(5,2);t.encoding=T.sRGBEncoding;return t}
 var wt=waffle(),bump=grain();
 var cone=new T.Mesh(new T.ConeGeometry(1,2.6,64,1,true),new T.MeshStandardMaterial({map:wt,bumpMap:wt,bumpScale:1.5,roughness:.8,side:T.DoubleSide}));
 cone.name='Cone';cone.rotation.z=Math.PI;cone.position.y=-1.5;root.add(cone);
 function scoop(name,col,y,s,seed){
  var geo=new T.SphereGeometry(1,96,64),p=geo.attributes.position,v=new T.Vector3();
  for(var i=0;i<p.count;i++){v.fromBufferAttribute(p,i);
   var k=1+.025*Math.sin(v.x*6+seed)*Math.sin(v.y*5)*Math.sin(v.z*6)+.012*Math.sin(v.x*13+seed)*Math.cos(v.z*11);
   p.setXYZ(i,v.x*k,v.y*k,v.z*k)}
  geo.computeVertexNormals();
  var m=new T.MeshPhysicalMaterial({color:col,roughness:.58,clearcoat:.12,clearcoatRoughness:.55,bumpMap:bump,bumpScale:.6});
  var g=new T.Group();g.name=name;var b=new T.Mesh(geo,m);b.name=name+'_Surface';b.userData.receiver=true;g.add(b);
  var ring=new T.Mesh(new T.TorusGeometry(.95,.17,24,64),m);ring.name=name+'_Skirt';ring.rotation.x=Math.PI/2;ring.scale.set(1,1,.8);ring.position.y=-.32;ring.userData.receiver=true;g.add(ring);
  g.scale.setScalar(s);g.position.y=y;root.add(g);return g}
 scoop('Scoop_Bottom',0xe98fa8,.5,1.05,1);
 scoop('Scoop_Top',0xf6e6c6,1.75,.95,3);
 return root};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- bvh.js ---- */
/* Static triangle BVH (no Three.js dependency): fast ray casts and closest-point queries on the model surface.
   Used for picking, pouring trails, syrup running downhill and candy collisions. */
(function(N){
function sel(tri,cen,ax,lo,hi,k){
 while(hi>lo){var pv=cen[tri[(lo+hi)>>1]*3+ax],i=lo,j=hi;
  while(i<=j){while(cen[tri[i]*3+ax]<pv)i++;while(cen[tri[j]*3+ax]>pv)j--;if(i<=j){var t=tri[i];tri[i]=tri[j];tri[j]=t;i++;j--}}
  if(k<=j)hi=j;else if(k>=i)lo=i;else break}}
function cpt(px,py,pz,ax,ay,az,bx,by,bz,cx,cy,cz,o){
 var abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az,apx=px-ax,apy=py-ay,apz=pz-az;
 var d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;if(d1<=0&&d2<=0){o[0]=1;o[1]=0;o[2]=0;return}
 var bpx=px-bx,bpy=py-by,bpz=pz-bz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;if(d3>=0&&d4<=d3){o[0]=0;o[1]=1;o[2]=0;return}
 var vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){var v=d1/(d1-d3);o[0]=1-v;o[1]=v;o[2]=0;return}
 var cpx=px-cx,cpy=py-cy,cpz=pz-cz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;if(d6>=0&&d5<=d6){o[0]=0;o[1]=0;o[2]=1;return}
 var vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){var w=d2/(d2-d6);o[0]=1-w;o[1]=0;o[2]=w;return}
 var va=d3*d6-d5*d4;if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){var w2=(d4-d3)/((d4-d3)+(d5-d6));o[0]=0;o[1]=1-w2;o[2]=w2;return}
 var dn=1/(va+vb+vc),v2=vb*dn,w3=vc*dn;o[0]=1-v2-w3;o[1]=v2;o[2]=w3}
N.BVH=function(pos,idx,nrm){
 var s=this,nt=idx?(idx.length/3|0):(pos.length/9|0);s.pos=pos;s.idx=idx;s.nrm=nrm||null;s.nt=nt;
 function I(t,k){return idx?idx[t*3+k]:t*3+k}
 var tri=new Uint32Array(nt),cen=new Float32Array(nt*3),bb=new Float32Array(nt*6),a;
 for(var t=0;t<nt;t++){tri[t]=t;var mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];
  for(var k=0;k<3;k++){var v=I(t,k)*3;for(a=0;a<3;a++){var x=pos[v+a];if(x<mn[a])mn[a]=x;if(x>mx[a])mx[a]=x}}
  for(a=0;a<3;a++){cen[t*3+a]=(mn[a]+mx[a])/2;bb[t*6+a]=mn[a];bb[t*6+3+a]=mx[a]}}
 var nb=[],nl=[],nr=[],ns=[],nc=[];
 function build(s0,e0){var id=nl.length,mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30],cn=[1e30,1e30,1e30],cx=[-1e30,-1e30,-1e30],i,a;
  nl.push(-1);nr.push(-1);ns.push(s0);nc.push(e0-s0);
  for(i=s0;i<e0;i++){var t=tri[i];for(a=0;a<3;a++){mn[a]=Math.min(mn[a],bb[t*6+a]);mx[a]=Math.max(mx[a],bb[t*6+3+a]);cn[a]=Math.min(cn[a],cen[t*3+a]);cx[a]=Math.max(cx[a],cen[t*3+a])}}
  nb.push(mn[0],mn[1],mn[2],mx[0],mx[1],mx[2]);
  if(e0-s0<=6)return id;
  var ax=0,ex=cx[0]-cn[0];if(cx[1]-cn[1]>ex){ax=1;ex=cx[1]-cn[1]}if(cx[2]-cn[2]>ex){ax=2}
  var mid=(s0+e0)>>1;sel(tri,cen,ax,s0,e0-1,mid);
  nl[id]=build(s0,mid);nr[id]=build(mid,e0);nc[id]=0;return id}
 if(nt)build(0,nt);
 s.raycast=function(ox,oy,oz,dx,dy,dz,tmax){
  if(!nt)return null;
  var best=tmax===undefined?1e30:tmax,hit=null,stk=[0],ix=1/dx,iy=1/dy,iz=1/dz;
  while(stk.length){var n=stk.pop(),b=n*6,t1=(nb[b]-ox)*ix,t2=(nb[b+3]-ox)*ix,tn=Math.min(t1,t2),tf=Math.max(t1,t2);
   t1=(nb[b+1]-oy)*iy;t2=(nb[b+4]-oy)*iy;tn=Math.max(tn,Math.min(t1,t2));tf=Math.min(tf,Math.max(t1,t2));
   t1=(nb[b+2]-oz)*iz;t2=(nb[b+5]-oz)*iz;tn=Math.max(tn,Math.min(t1,t2));tf=Math.min(tf,Math.max(t1,t2));
   if(tf<0||tn>tf||tn>best)continue;
   if(nl[n]<0){for(var i=ns[n],e=ns[n]+nc[n];i<e;i++){var tt=tri[i],p0=I(tt,0)*3,p1=I(tt,1)*3,p2=I(tt,2)*3,
     e1x=pos[p1]-pos[p0],e1y=pos[p1+1]-pos[p0+1],e1z=pos[p1+2]-pos[p0+2],e2x=pos[p2]-pos[p0],e2y=pos[p2+1]-pos[p0+1],e2z=pos[p2+2]-pos[p0+2],
     px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-14)continue;
     var inv=1/det,tx=ox-pos[p0],ty=oy-pos[p0+1],tz=oz-pos[p0+2],u=(tx*px+ty*py+tz*pz)*inv;if(u<0||u>1)continue;
     var qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(dx*qx+dy*qy+dz*qz)*inv;if(v<0||u+v>1)continue;
     var t=(e2x*qx+e2y*qy+e2z*qz)*inv;if(t>1e-7&&t<best){best=t;hit={t:t,tri:tt,b0:1-u-v,b1:u,b2:v}}}}
   else{stk.push(nr[n]);stk.push(nl[n])}}
  return hit};
 s.closest=function(px,py,pz,maxD){
  if(!nt)return null;
  var best=maxD===undefined?1e15:maxD*maxD,res=null,stk=[0],o=[0,0,0];
  while(stk.length){var n=stk.pop(),b=n*6,dx=Math.max(nb[b]-px,0,px-nb[b+3]),dy=Math.max(nb[b+1]-py,0,py-nb[b+4]),dz=Math.max(nb[b+2]-pz,0,pz-nb[b+5]);
   if(dx*dx+dy*dy+dz*dz>best)continue;
   if(nl[n]<0){for(var i=ns[n],e=ns[n]+nc[n];i<e;i++){var t=tri[i],p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3;
     cpt(px,py,pz,pos[p0],pos[p0+1],pos[p0+2],pos[p1],pos[p1+1],pos[p1+2],pos[p2],pos[p2+1],pos[p2+2],o);
     var x=o[0]*pos[p0]+o[1]*pos[p1]+o[2]*pos[p2]-px,y=o[0]*pos[p0+1]+o[1]*pos[p1+1]+o[2]*pos[p2+1]-py,z=o[0]*pos[p0+2]+o[1]*pos[p1+2]+o[2]*pos[p2+2]-pz,d2=x*x+y*y+z*z;
     if(d2<best){best=d2;res={tri:t,b0:o[0],b1:o[1],b2:o[2]}}}}
   else{stk.push(nr[n]);stk.push(nl[n])}}
  if(res){var q=s.pointAt(res.tri,res.b0,res.b1,res.b2);res.x=q[0];res.y=q[1];res.z=q[2];res.d=Math.sqrt(best)}
  return res};
 s.area=function(){var a=0;for(var t=0;t<nt;t++){var p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3,ax=pos[p1]-pos[p0],ay=pos[p1+1]-pos[p0+1],az=pos[p1+2]-pos[p0+2],bx=pos[p2]-pos[p0],by=pos[p2+1]-pos[p0+1],bz=pos[p2+2]-pos[p0+2];
   a+=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)/2}return a};
 s.pointAt=function(t,b0,b1,b2){var p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3;
  return[b0*pos[p0]+b1*pos[p1]+b2*pos[p2],b0*pos[p0+1]+b1*pos[p1+1]+b2*pos[p2+1],b0*pos[p0+2]+b1*pos[p1+2]+b2*pos[p2+2]]};
 s.normalAt=function(t,b0,b1,b2){var p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3,x,y,z,l;
  if(nrm){x=b0*nrm[p0]+b1*nrm[p1]+b2*nrm[p2];y=b0*nrm[p0+1]+b1*nrm[p1+1]+b2*nrm[p2+1];z=b0*nrm[p0+2]+b1*nrm[p1+2]+b2*nrm[p2+2]}
  else{var ax=pos[p1]-pos[p0],ay=pos[p1+1]-pos[p0+1],az=pos[p1+2]-pos[p0+2],bx=pos[p2]-pos[p0],by=pos[p2+1]-pos[p0+1],bz=pos[p2+2]-pos[p0+2];
   x=ay*bz-az*by;y=az*bx-ax*bz;z=ax*by-ay*bx}
  l=Math.hypot(x,y,z)||1;return[x/l,y/l,z/l]};
};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- flow.js ---- */
/* Math helpers for pours (no Three.js): bead-shaped ribbon rings that sit on the surface, and downhill flow direction. */
(function(N){
var V=N.V={
 sub:function(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]},add:function(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]]},
 mul:function(a,k){return[a[0]*k,a[1]*k,a[2]*k]},dot:function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]},
 cross:function(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]},
 len:function(a){return Math.hypot(a[0],a[1],a[2])},norm:function(a){var l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}};
/* direction of travel along the surface, perpendicular to n; falls back to lastT when the points coincide */
N.tangentOn=function(p,prev,n,lastT){var d=V.sub(p,prev);d=V.sub(d,V.mul(n,V.dot(d,n)));var l=V.len(d);return l<1e-7?(lastT||[1,0,0]):V.mul(d,1/l)};
/* writes ring k (R vertices: a half-ellipse bead of width w, height h on top of the surface) into pos/nrm */
N.ringWrite=function(pos,nrm,k,R,p,n,t,w,h,sink){
 var s=V.norm(V.cross(n,t)),a=w/2,o=k*R*3;
 for(var i=0;i<R;i++){var th=Math.PI*i/(R-1),c=Math.cos(th),sn=Math.sin(th),edge=(i===0||i===R-1),y=h*sn-(edge?sink:0);
  var q=o+i*3;pos[q]=p[0]+s[0]*a*c+n[0]*y;pos[q+1]=p[1]+s[1]*a*c+n[1]*y;pos[q+2]=p[2]+s[2]*a*c+n[2]*y;
  var nx=s[0]*h*c+n[0]*a*sn,ny=s[1]*h*c+n[1]*a*sn,nz=s[2]*h*c+n[2]*a*sn,l=Math.hypot(nx,ny,nz)||1;
  nx=nx/l+n[0]*.3;ny=ny/l+n[1]*.3;nz=nz/l+n[2]*.3;l=Math.hypot(nx,ny,nz)||1;nrm[q]=nx/l;nrm[q+1]=ny/l;nrm[q+2]=nz/l}};
N.fillIndex=function(idx,R,maxPts){var o=0;
 for(var k=0;k<maxPts-1;k++)for(var i=0;i<R-1;i++){var a=k*R+i,b=a+1,c=(k+1)*R+i,d=c+1;idx[o++]=a;idx[o++]=b;idx[o++]=c;idx[o++]=b;idx[o++]=d;idx[o++]=c}};
/* unit gravity g (in model space) projected on the surface plane: {d: downhill direction, s: sin(slope)} */
N.downhill=function(n,g){var d=V.sub(g,V.mul(n,V.dot(g,n))),l=V.len(d);return{d:l>1e-9?V.mul(d,1/l):[0,0,0],s:l}};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- candy.js ---- */
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

/* ---- model.js ---- */
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

/* ---- surface.js ---- */
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

/* ---- toppings.js ---- */
/* Topping registry. Stage 3 plugs in behaviour with Toppings.register(id,{apply(hit,ctx),reset()}); until then the
   three Persian controls stay disabled. */
(function(N){
var defs=[{id:'chocolate',label:'شکلات',enabled:false},{id:'mulberry',label:'شربت توت',enabled:false},{id:'smarties',label:'اسمارتیز',enabled:false}],
 handlers={},active=null;
N.Toppings={defs:defs,
 register:function(id,h){handlers[id]=h;defs.forEach(function(d){if(d.id===id)d.enabled=true});N.emit('toppings:changed')},
 deselect:function(){if(active){active=null;N.emit('toppings:changed')}},
 select:function(id){if(N.busy)return;var d=defs.filter(function(x){return x.id===id})[0];if(!d||!d.enabled)return;active=active===id?null:id;N.emit('toppings:changed')},
 active:function(){return active},
 apply:function(hit,ctx){var h=active&&handlers[active];if(h&&h.apply)h.apply(hit,ctx)},
 reset:function(){Object.keys(handlers).forEach(function(k){handlers[k].reset&&handlers[k].reset()});active=null;N.emit('toppings:changed')}};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- pour.js ---- */
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

/* ---- smarties.js ---- */
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

/* ---- reset.js ---- */
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

/* ---- ui.js ---- */
/* Persian UI: topping buttons, reset button, loading / error status. */
(function(N){
N.buildUI=function(host,panel,reset){
 var status=host.querySelector('.vw-status'),msg=status&&status.querySelector('p');
 function draw(){
  if(reset)reset.disabled=!!N.resetRunning;
  if(!panel)return;[].slice.call(panel.querySelectorAll('.chip')).forEach(function(c){c.remove()});
  N.Toppings.defs.forEach(function(d){var b=document.createElement('button');b.type='button';b.className='chip';b.dataset.id=d.id;b.textContent=d.label;
   b.disabled=!d.enabled||!!N.busy;b.setAttribute('aria-pressed',N.Toppings.active()===d.id);if(!d.enabled)b.title='به‌زودی فعال می‌شود';
   b.onclick=function(){N.Toppings.select(d.id)};panel.appendChild(b)})}
 draw();N.on('toppings:changed',draw);
 if(reset){reset.textContent='از نو شروع کن';reset.disabled=!!N.resetRunning;reset.onclick=function(){N.reset&&N.reset()}}
 return{
  show:function(t){if(status){status.hidden=false;status.classList.remove('err');if(msg)msg.textContent=t}},
  hide:function(){if(status)status.hidden=true},
  error:function(t){if(status){status.hidden=false;status.classList.add('err');if(msg)msg.textContent=t}}}};
})(window.NooshinViewer=window.NooshinViewer||{});

/* ---- core.js ---- */
/* Stage: renderer, camera, resize, on-demand render loop (pauses off-screen / hidden tab), context-loss recovery. */
(function(N){
N.createStage=function(host){
 var T=THREE,ren;
 try{ren=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){return null}
 if(!ren.getContext())return null;
 var mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;
 ren.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:2));
 var cv=ren.domElement;cv.className='vw-canvas';host.insertBefore(cv,host.firstChild);
 var scene=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.1,100),pivot=new T.Group(),holder=new T.Group();
 pivot.add(holder);scene.add(pivot);
 var st={renderer:ren,scene:scene,camera:cam,pivot:pivot,holder:holder,mobile:mobile,size:null,frameFns:[],running:false,vis:false,dirty:true,raf:0};
 var ctl=st.controls=new N.Controls(cv,{auto:!matchMedia('(prefers-reduced-motion:reduce)').matches,
  onChange:function(){st.invalidate()},onTap:function(e){N.emit('tap',e)},
  claim:function(e){return st.claim?st.claim(e):false},onPaint:function(k,e){if(st.onPaint)st.onPaint(k,e)}});
 var lastZ=0,lt=0,reframe=true;
 function frame(){if(!st.size)return;var w=host.clientWidth||1,h=host.clientHeight||1,asp=w/h,v=cam.fov*Math.PI/180,
  dv=(st.size.y/2)/Math.tan(v/2),dh=(Math.max(st.size.x,st.size.z)/2)/(Math.tan(v/2)*asp),d=Math.max(dv,dh)*1.28/ctl.zoom;
  cam.aspect=asp;cam.position.set(0,st.size.y*.04,d);cam.lookAt(0,0,0);cam.updateProjectionMatrix();lastZ=ctl.zoom;reframe=false}
 function tick(t){st.raf=0;if(!st.running)return;
  var dt=Math.min(.05,(t-lt)/1000||.016);lt=t;
  var moving=ctl.update(dt),anim=false;
  st.frameFns.forEach(function(f){if(f(dt,t))anim=true});
  pivot.rotation.y=ctl.yaw;pivot.rotation.x=ctl.pitch;
  if(reframe||ctl.zoom!==lastZ)frame();
  if(moving||anim||st.dirty){st.dirty=false;ren.render(scene,cam);st.raf=requestAnimationFrame(tick)}}
 st.invalidate=function(){st.dirty=true;if(st.running&&!st.raf){lt=performance.now();st.raf=requestAnimationFrame(tick)}};
 function run(){var r=st.vis&&!document.hidden;if(r&&!st.running){st.running=true;st.invalidate()}else if(!r)st.running=false}
 /* put a model in the pivot, centred, resting on a soft shadow floor */
 st.setModel=function(obj){holder.clear?holder.clear():holder.children.slice().forEach(function(c){holder.remove(c)});
  obj.updateMatrixWorld(true);var b=new T.Box3().setFromObject(obj),c=b.getCenter(new T.Vector3());obj.position.sub(c);holder.add(obj);
  st.size=b.getSize(new T.Vector3());
  var fl=new T.Mesh(new T.PlaneGeometry(40,40),new T.ShadowMaterial({opacity:.38}));fl.rotation.x=-Math.PI/2;fl.position.y=-st.size.y/2-.35;fl.receiveShadow=true;scene.add(fl);st.floor=fl;
  reframe=true;st.invalidate()};
 new ResizeObserver(function(){var w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;ren.setSize(w,h,false);reframe=true;st.invalidate()}).observe(host);
 new IntersectionObserver(function(e){st.vis=e[e.length-1].isIntersecting;run()}).observe(host);
 document.addEventListener('visibilitychange',run);
 cv.addEventListener('webglcontextlost',function(e){e.preventDefault();st.running=false});
 cv.addEventListener('webglcontextrestored',function(){run();st.invalidate()});
 return st};
})(window.NooshinViewer=window.NooshinViewer||{});

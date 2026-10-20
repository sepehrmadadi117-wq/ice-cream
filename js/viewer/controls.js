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

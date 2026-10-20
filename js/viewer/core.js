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

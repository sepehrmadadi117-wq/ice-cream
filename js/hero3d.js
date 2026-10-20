/* Procedural 3D hero ice cream (Three.js r128). Falls back to the SVG cone if WebGL/Three is unavailable. */
(function(){
var host=document.getElementById('hero3d');
if(!host||!window.THREE)return;
var T=THREE,ren;
try{ren=new T.WebGLRenderer({antialias:true,alpha:true})}catch(e){return}
ren.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.5:2));ren.outputEncoding=T.sRGBEncoding;
host.appendChild(ren.domElement);
var scene=new T.Scene(),cam=new T.PerspectiveCamera(32,1,.1,60);
cam.position.set(0,.3,11.5);cam.lookAt(0,0,0);
scene.add(new T.HemisphereLight(0xfff1dc,0x6b3f2c,.95));
var key=new T.DirectionalLight(0xfff0d8,1.5);key.position.set(4,6,5);scene.add(key);
var rim=new T.DirectionalLight(0xffc9a0,.8);rim.position.set(-5,2,-4);scene.add(rim);
var g=new T.Group();scene.add(g);
function waffle(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');
x.fillStyle='#dcaa64';x.fillRect(0,0,256,256);x.strokeStyle='#a8742f';x.lineWidth=10;
for(var i=-256;i<512;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke();x.beginPath();x.moveTo(i+256,0);x.lineTo(i,256);x.stroke()}
var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(5,2);t.encoding=T.sRGBEncoding;return t}
var wt=waffle();
var cone=new T.Mesh(new T.ConeGeometry(1,2.6,64,1,true),new T.MeshStandardMaterial({map:wt,bumpMap:wt,bumpScale:1.5,roughness:.8,side:T.DoubleSide}));
cone.rotation.z=Math.PI;cone.position.y=-1.5;g.add(cone);
function scoop(col,y,s,seed){
 var geo=new T.SphereGeometry(1,64,48),p=geo.attributes.position,v=new T.Vector3();
 for(var i=0;i<p.count;i++){v.fromBufferAttribute(p,i);
  var n=1+.025*Math.sin(v.x*6+seed)*Math.sin(v.y*5)*Math.sin(v.z*6)+.012*Math.sin(v.x*13+seed)*Math.cos(v.z*11);
  p.setXYZ(i,v.x*n,v.y*n,v.z*n)}
 geo.computeVertexNormals();
 var m=new T.MeshPhysicalMaterial({color:col,roughness:.6,clearcoat:.15,clearcoatRoughness:.6});
 var o=new T.Group(),b=new T.Mesh(geo,m);o.add(b);
 var ring=new T.Mesh(new T.TorusGeometry(.95,.17,24,64),m);ring.rotation.x=Math.PI/2;ring.scale.set(1,1,.8);ring.position.y=-.32;o.add(ring);
 o.scale.setScalar(s);o.position.y=y;g.add(o);return o}
scoop(0xe98fa8,.5,1.05,1);
var top=scoop(0xf6e6c6,1.75,.95,3);
var cm=new T.MeshPhysicalMaterial({color:0xb5651d,roughness:.25,clearcoat:1,clearcoatRoughness:.1});
top.add(new T.Mesh(new T.SphereGeometry(1.01,48,32,0,Math.PI*2,0,.95),cm));
for(var i=0;i<7;i++){var a=i*.9+.3,L=.2+((i*37)%10)/40,th=.95+L*.9,
 d=new T.Mesh(new T.SphereGeometry(1,16,12),cm),r=1.02;
 d.scale.set(.1,L,.05);
 d.position.set(r*Math.sin(th)*Math.cos(a),r*Math.cos(th),r*Math.sin(th)*Math.sin(a));
 d.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.position.clone().normalize());top.add(d)}
var ch=new T.Mesh(new T.SphereGeometry(.27,32,24),new T.MeshPhysicalMaterial({color:0xb0102b,roughness:.2,clearcoat:1}));
ch.position.set(0,1.05,0);top.add(ch);
var st=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,.2,0),new T.Vector3(.05,.45,0),new T.Vector3(.22,.7,0)]),12,.025,6),new T.MeshStandardMaterial({color:0x5a6a2a}));
ch.add(st);
var reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,rot=0,vel=reduced?0:.004,base=reduced?0:.004,drag=false,lx=0,run=false,vis=false;
var c=ren.domElement;
c.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;try{c.setPointerCapture(e.pointerId)}catch(_){}go()});
c.addEventListener('pointermove',function(e){if(drag){var dx=e.clientX-lx;lx=e.clientX;rot+=dx*.01;vel=dx*.01;go()}});
c.addEventListener('webglcontextlost',function(e){e.preventDefault();run=false});c.addEventListener('webglcontextrestored',go);
['pointerup','pointercancel'].forEach(function(n){c.addEventListener(n,function(){drag=false})});
function size(){var w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();go()}
new ResizeObserver(size).observe(host);size();
function tick(t){if(!run)return;if(!drag){rot+=vel;vel+=(base-vel)*.03}
 g.rotation.y=rot;g.position.y=reduced?0:Math.sin(t/800)*.08;ren.render(scene,cam);
 if(reduced&&!drag&&Math.abs(vel)<1e-4){run=false;return}requestAnimationFrame(tick)}
function go(){var r=vis&&!document.hidden;if(r&&!run){run=true;requestAnimationFrame(tick)}else if(!r)run=false}
new IntersectionObserver(function(e){vis=e[e.length-1].isIntersecting;go()}).observe(host);
document.addEventListener('visibilitychange',go);
host.classList.add('ready');
})();

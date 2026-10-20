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

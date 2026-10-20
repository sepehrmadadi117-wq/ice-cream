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

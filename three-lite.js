/* three-lite: an API-level stand-in for the parts of Three.js r128 the Nooshin viewer uses (real vector/matrix/quaternion
   math, real primitive geometry, resource counters). It does NOT render anything - it lets tests drive the real site code
   (core, lighting, model, surface, toppings, reset) in a real browser DOM. */
(function(g){
var T={},P=Math.PI;T.__stats={renders:0,setSize:[],geoLive:0,matLive:0,pmrem:0,pixelRatio:1,lastSize:null,contexts:0};
class Vector2{constructor(x,y){this.x=x||0;this.y=y||0}set(x,y){this.x=x;this.y=y;return this}}
class Vector3{constructor(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}clone(){return new Vector3(this.x,this.y,this.z)}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}setScalar(s){this.x=this.y=this.z=s;return this}
 length(){return Math.hypot(this.x,this.y,this.z)}normalize(){var l=this.length()||1;return this.multiplyScalar(1/l)}
 fromBufferAttribute(a,i){this.x=a.getX(i);this.y=a.getY(i);this.z=a.getZ(i);return this}
 applyMatrix4(m){var e=m.elements,x=this.x,y=this.y,z=this.z,w=1/(e[3]*x+e[7]*y+e[11]*z+e[15]);
  this.x=(e[0]*x+e[4]*y+e[8]*z+e[12])*w;this.y=(e[1]*x+e[5]*y+e[9]*z+e[13])*w;this.z=(e[2]*x+e[6]*y+e[10]*z+e[14])*w;return this}
 applyQuaternion(q){var x=this.x,y=this.y,z=this.z,qx=q.x,qy=q.y,qz=q.z,qw=q.w,ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;
  this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this}
 transformDirection(m){var e=m.elements,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z;this.y=e[1]*x+e[5]*y+e[9]*z;this.z=e[2]*x+e[6]*y+e[10]*z;return this.normalize()}
 unproject(c){return this.applyMatrix4(c.projectionMatrixInverse).applyMatrix4(c.matrixWorld)}
 project(c){return this.applyMatrix4(c.matrixWorldInverse).applyMatrix4(c.projectionMatrix)}}
class Quaternion{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}
 set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this}
 invert(){this.x=-this.x;this.y=-this.y;this.z=-this.z;return this}
 setFromUnitVectors(a,b){var d=a.x*b.x+a.y*b.y+a.z*b.z;
  if(d<-.999999){var ax=Math.abs(a.x)<.9?[1,0,0]:[0,1,0],cx=a.y*ax[2]-a.z*ax[1],cy=a.z*ax[0]-a.x*ax[2],cz=a.x*ax[1]-a.y*ax[0],l=Math.hypot(cx,cy,cz);this.x=cx/l;this.y=cy/l;this.z=cz/l;this.w=0;return this}
  var x=a.y*b.z-a.z*b.y,y=a.z*b.x-a.x*b.z,z=a.x*b.y-a.y*b.x,w=1+d,l2=Math.hypot(x,y,z,w);this.x=x/l2;this.y=y/l2;this.z=z/l2;this.w=w/l2;return this}
 setFromEuler(x,y,z){var c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2),s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
  this.x=s1*c2*c3+c1*s2*s3;this.y=c1*s2*c3-s1*c2*s3;this.z=c1*c2*s3+s1*s2*c3;this.w=c1*c2*c3-s1*s2*s3;return this}}
class Euler{constructor(o){this._x=0;this._y=0;this._z=0;this.o=o}
 get x(){return this._x}set x(v){this._x=v;this.s()}get y(){return this._y}set y(v){this._y=v;this.s()}get z(){return this._z}set z(v){this._z=v;this.s()}
 s(){this.o.quaternion.setFromEuler(this._x,this._y,this._z)}set(x,y,z){this._x=x;this._y=y;this._z=z;this.s();return this}}
class Matrix4{constructor(){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
 copy(m){this.elements=m.elements.slice();return this}identity(){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];return this}
 compose(p,q,s){var x=q.x,y=q.y,z=q.z,w=q.w,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  this.elements=[(1-(yy+zz))*s.x,(xy+wz)*s.x,(xz-wy)*s.x,0,(xy-wz)*s.y,(1-(xx+zz))*s.y,(yz+wx)*s.y,0,(xz+wy)*s.z,(yz-wx)*s.z,(1-(xx+yy))*s.z,0,p.x,p.y,p.z,1];return this}
 multiplyMatrices(a,b){var A=a.elements,B=b.elements,R=new Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=A[k*4+j]*B[i*4+k];R[i*4+j]=s}this.elements=R;return this}
 invert(){var m=this.elements,n11=m[0],n21=m[1],n31=m[2],n41=m[3],n12=m[4],n22=m[5],n32=m[6],n42=m[7],n13=m[8],n23=m[9],n33=m[10],n43=m[11],n14=m[12],n24=m[13],n34=m[14],n44=m[15],
  t11=n23*n34*n42-n24*n33*n42+n24*n32*n43-n22*n34*n43-n23*n32*n44+n22*n33*n44,t12=n14*n33*n42-n13*n34*n42-n14*n32*n43+n12*n34*n43+n13*n32*n44-n12*n33*n44,
  t13=n13*n24*n42-n14*n23*n42+n14*n22*n43-n12*n24*n43-n13*n22*n44+n12*n23*n44,t14=n14*n23*n32-n13*n24*n32-n14*n22*n33+n12*n24*n33+n13*n22*n34-n12*n23*n34,
  det=n11*t11+n21*t12+n31*t13+n41*t14;if(!det){this.identity();return this}var d=1/det;
  this.elements=[t11*d,(n24*n33*n41-n23*n34*n41-n24*n31*n43+n21*n34*n43+n23*n31*n44-n21*n33*n44)*d,(n22*n34*n41-n24*n32*n41+n24*n31*n42-n21*n34*n42-n22*n31*n44+n21*n32*n44)*d,(n23*n32*n41-n22*n33*n41-n23*n31*n42+n21*n33*n42+n22*n31*n43-n21*n32*n43)*d,
  t12*d,(n13*n34*n41-n14*n33*n41+n14*n31*n43-n11*n34*n43-n13*n31*n44+n11*n33*n44)*d,(n14*n32*n41-n12*n34*n41-n14*n31*n42+n11*n34*n42+n12*n31*n44-n11*n32*n44)*d,(n12*n33*n41-n13*n32*n41+n13*n31*n42-n11*n33*n42-n12*n31*n43+n11*n32*n43)*d,
  t13*d,(n14*n23*n41-n13*n24*n41-n14*n21*n43+n11*n24*n43+n13*n21*n44-n11*n23*n44)*d,(n12*n24*n41-n14*n22*n41+n14*n21*n42-n11*n24*n42-n12*n21*n44+n11*n22*n44)*d,(n13*n22*n41-n12*n23*n41-n13*n21*n42+n11*n23*n42+n12*n21*n43-n11*n22*n43)*d,
  t14*d,(n13*n24*n31-n14*n23*n31+n14*n21*n33-n11*n24*n33-n13*n21*n34+n11*n23*n34)*d,(n14*n22*n31-n12*n24*n31-n14*n21*n32+n11*n24*n32+n12*n21*n34-n11*n22*n34)*d,(n12*n23*n31-n13*n22*n31+n13*n21*n32-n11*n23*n32-n12*n21*n33+n11*n22*n33)*d];return this}}
class Matrix3{constructor(){this.elements=[1,0,0,0,1,0,0,0,1]}
 getNormalMatrix(m4){var e=m4.elements,a=e[0],b=e[4],c=e[8],d=e[1],f=e[5],h=e[9],i=e[2],j=e[6],k=e[10],det=a*(f*k-h*j)-b*(d*k-h*i)+c*(d*j-f*i),id=1/det;
  var inv=[(f*k-h*j)*id,(c*j-b*k)*id,(b*h-c*f)*id,(h*i-d*k)*id,(a*k-c*i)*id,(c*d-a*h)*id,(d*j-f*i)*id,(b*i-a*j)*id,(a*f-b*d)*id]; /* row-major inverse */
  this.elements=[inv[0],inv[1],inv[2],inv[3],inv[4],inv[5],inv[6],inv[7],inv[8]];/* transpose of inverse in column-major == inverse row-major as written */return this}}
var _id=0;
class Object3D{constructor(){this.id=++_id;this.children=[];this.parent=null;this.position=new Vector3();this.quaternion=new Quaternion();this.scale=new Vector3(1,1,1);this.rotation=new Euler(this);this.matrix=new Matrix4();this.matrixWorld=new Matrix4();this.visible=true;this.userData={};this.name=""}
 add(c){if(c.parent)c.parent.remove(c);this.children.push(c);c.parent=this;return this}remove(c){var i=this.children.indexOf(c);if(i>-1){this.children.splice(i,1);c.parent=null}return this}
 clear(){this.children.slice().forEach(c=>this.remove(c));return this}
 updateMatrixWorld(){this.matrix.compose(this.position,this.quaternion,this.scale);this.matrixWorld=this.parent?new Matrix4().multiplyMatrices(this.parent.matrixWorld,this.matrix):this.matrix.clone?this.matrix:this.matrix;if(!this.parent)this.matrixWorld=new Matrix4().copy(this.matrix);this.children.forEach(c=>c.updateMatrixWorld())}
 traverse(f){f(this);this.children.forEach(c=>c.traverse(f))}
 lookAt(x,y,z){var ex=this.position.x,ey=this.position.y,ez=this.position.z,zx=ex-x,zy=ey-y,zz=ez-z,l=Math.hypot(zx,zy,zz)||1;zx/=l;zy/=l;zz/=l;
  var xx=0*zz-1*zy*0,ux=0,uy=1,uz=0,rx=uy*zz-uz*zy,ry=uz*zx-ux*zz,rz=ux*zy-uy*zx,rl=Math.hypot(rx,ry,rz);if(rl<1e-9){rx=1;ry=0;rz=0;rl=1}rx/=rl;ry/=rl;rz/=rl;
  var yx=zy*rz-zz*ry,yy=zz*rx-zx*rz,yz=zx*ry-zy*rx,m00=rx,m01=yx,m02=zx,m10=ry,m11=yy,m12=zy,m20=rz,m21=yz,m22=zz,tr=m00+m11+m22,q=this.quaternion;
  if(tr>0){var s=.5/Math.sqrt(tr+1);q.w=.25/s;q.x=(m21-m12)*s;q.y=(m02-m20)*s;q.z=(m10-m01)*s}
  else if(m00>m11&&m00>m22){var s2=2*Math.sqrt(1+m00-m11-m22);q.w=(m21-m12)/s2;q.x=.25*s2;q.y=(m01+m10)/s2;q.z=(m02+m20)/s2}
  else if(m11>m22){var s3=2*Math.sqrt(1+m11-m00-m22);q.w=(m02-m20)/s3;q.x=(m01+m10)/s3;q.y=.25*s3;q.z=(m12+m21)/s3}
  else{var s4=2*Math.sqrt(1+m22-m00-m11);q.w=(m10-m01)/s4;q.x=(m02+m20)/s4;q.y=(m12+m21)/s4;q.z=.25*s4}}
 getWorldScale(t){var e=this.matrixWorld.elements;return t.set(Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10]))}
 worldToLocal(v){return v.applyMatrix4(new Matrix4().copy(this.matrixWorld).invert())}}
class Scene extends Object3D{}class Group extends Object3D{}
class Mesh extends Object3D{constructor(g,m){super();this.geometry=g;this.material=m;this.isMesh=true}}
class InstancedMesh extends Mesh{constructor(g,m,n){super(g,m);this.count=n;this.max=n;this.instanceMatrix={array:new Float32Array(n*16),needsUpdate:false};this.instanceColor=null}
 setMatrixAt(i,m){if(i>=this.max)throw new Error('instance index '+i+' >= capacity '+this.max);for(var k=0;k<16;k++)this.instanceMatrix.array[i*16+k]=m.elements[k]}
 setColorAt(i,c){if(!this.instanceColor)this.instanceColor={array:new Float32Array(this.max*3),needsUpdate:false};this.instanceColor.array[i*3]=c.r}}
class PerspectiveCamera extends Object3D{constructor(f,a,n,fa){super();this.fov=f;this.aspect=a;this.near=n;this.far=fa;this.isCamera=true;this.projectionMatrix=new Matrix4();this.projectionMatrixInverse=new Matrix4();this.matrixWorldInverse=new Matrix4();this.updateProjectionMatrix()}
 updateProjectionMatrix(){var n=this.near,f=this.far,t=n*Math.tan(this.fov*P/360),h=2*t,w=this.aspect*h,x=2*n/w,y=2*n/h,c=-(f+n)/(f-n),d=-2*f*n/(f-n);
  this.projectionMatrix.elements=[x,0,0,0,0,y,0,0,0,0,c,-1,0,0,d,0];this.projectionMatrixInverse=new Matrix4().copy(this.projectionMatrix).invert()}
 updateMatrixWorld(){super.updateMatrixWorld();this.matrixWorldInverse=new Matrix4().copy(this.matrixWorld).invert()}}
class Box3{constructor(){this.min=new Vector3(1e9,1e9,1e9);this.max=new Vector3(-1e9,-1e9,-1e9)}
 setFromObject(o){o.updateMatrixWorld(true);var v=new Vector3(),mn=this.min,mx=this.max;o.traverse(m=>{if(!m.isMesh||m.count!==undefined&&m.max)return;var p=m.geometry.attributes.position;for(var i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);mn.x=Math.min(mn.x,v.x);mn.y=Math.min(mn.y,v.y);mn.z=Math.min(mn.z,v.z);mx.x=Math.max(mx.x,v.x);mx.y=Math.max(mx.y,v.y);mx.z=Math.max(mx.z,v.z)}});return this}
 getSize(t){return t.set(this.max.x-this.min.x,this.max.y-this.min.y,this.max.z-this.min.z)}getCenter(t){return t.set((this.max.x+this.min.x)/2,(this.max.y+this.min.y)/2,(this.max.z+this.min.z)/2)}}
class BufferAttribute{constructor(a,n){this.array=a;this.itemSize=n;this.count=a.length/n;this.needsUpdate=false}setUsage(){return this}
 getX(i){return this.array[i*this.itemSize]}getY(i){return this.array[i*this.itemSize+1]}getZ(i){return this.array[i*this.itemSize+2]}setXYZ(i,x,y,z){var o=i*this.itemSize;this.array[o]=x;this.array[o+1]=y;this.array[o+2]=z;return this}}
class BufferGeometry{constructor(){this.attributes={};this.index=null;this.drawRange={start:0,count:Infinity};this.disposed=false;T.__stats.geoLive++}
 setAttribute(k,a){this.attributes[k]=a;return this}setIndex(i){this.index=i;return this}setDrawRange(s,c){this.drawRange={start:s,count:c}}
 dispose(){if(!this.disposed){this.disposed=true;T.__stats.geoLive--}}
 computeVertexNormals(){var p=this.attributes.position,n=new Float32Array(p.array.length),I=this.index?this.index.array:null,nt=(I?I.length:p.count)/3;
  for(var t=0;t<nt;t++){var a=I?I[t*3]:t*3,b=I?I[t*3+1]:t*3+1,c=I?I[t*3+2]:t*3+2,ax=p.getX(b)-p.getX(a),ay=p.getY(b)-p.getY(a),az=p.getZ(b)-p.getZ(a),bx=p.getX(c)-p.getX(a),by=p.getY(c)-p.getY(a),bz=p.getZ(c)-p.getZ(a),x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;
   [a,b,c].forEach(i=>{n[i*3]+=x;n[i*3+1]+=y;n[i*3+2]+=z})}
  for(var i=0;i<p.count;i++){var l=Math.hypot(n[i*3],n[i*3+1],n[i*3+2])||1;n[i*3]/=l;n[i*3+1]/=l;n[i*3+2]/=l}this.attributes.normal=new BufferAttribute(n,3)}}
function mk(pos,nrm,idx){var g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(pos),3));g.setAttribute('normal',new BufferAttribute(new Float32Array(nrm),3));g.setIndex(new BufferAttribute(new Uint32Array(idx),1));return g}
class SphereGeometry extends BufferGeometry{constructor(r,ws,hs,ps,pl,ts,tl){super();r=r||1;ws=Math.max(3,ws|0||8);hs=Math.max(2,hs|0||6);ps=ps||0;pl=pl===undefined?P*2:pl;ts=ts||0;tl=tl===undefined?P:tl;
  var pos=[],nrm=[],idx=[],grid=[],ix,iy,te=ts+tl;
  for(iy=0;iy<=hs;iy++){var row=[],v=iy/hs;for(ix=0;ix<=ws;ix++){var u=ix/ws,x=-r*Math.cos(ps+u*pl)*Math.sin(ts+v*tl),y=r*Math.cos(ts+v*tl),z=r*Math.sin(ps+u*pl)*Math.sin(ts+v*tl);pos.push(x,y,z);var l=Math.hypot(x,y,z)||1;nrm.push(x/l,y/l,z/l);row.push(pos.length/3-1)}grid.push(row)}
  for(iy=0;iy<hs;iy++)for(ix=0;ix<ws;ix++){var a=grid[iy][ix+1],b=grid[iy][ix],c=grid[iy+1][ix],d=grid[iy+1][ix+1];if(iy!==0||ts>0)idx.push(a,b,d);if(iy!==hs-1||te<P)idx.push(b,c,d)}
  var m=mk(pos,nrm,idx);this.attributes=m.attributes;this.index=m.index}}
class BoxGeometry extends BufferGeometry{constructor(w,h,d){super();w=(w||1)/2;h=(h||1)/2;d=(d||1)/2;var pos=[],nrm=[],idx=[],F=[[[1,0,0],[0,1,0],[0,0,-1]],[[-1,0,0],[0,1,0],[0,0,1]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[0,0,-1],[1,0,0]],[[0,0,1],[0,1,0],[1,0,0]],[[0,0,-1],[0,1,0],[-1,0,0]]],S=[w,h,d];
  F.forEach(function(f,i){var n=f[0],u=f[1],v=f[2],b=pos.length/3;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){var p=[0,1,2].map(function(k){return(n[k]+u[k]*q[0]+v[k]*q[1])*S[k]});pos.push(p[0],p[1],p[2]);nrm.push(n[0],n[1],n[2])});idx.push(b,b+1,b+2,b,b+2,b+3)});
  var m=mk(pos,nrm,idx);this.attributes=m.attributes;this.index=m.index}}
class TorusGeometry extends BufferGeometry{constructor(R,tube,rs,ts){super();var pos=[],nrm=[],idx=[],i,j;
  for(j=0;j<=rs;j++)for(i=0;i<=ts;i++){var u=i/ts*P*2,v=j/rs*P*2,x=(R+tube*Math.cos(v))*Math.cos(u),y=(R+tube*Math.cos(v))*Math.sin(u),z=tube*Math.sin(v);pos.push(x,y,z);var cx=R*Math.cos(u),cy=R*Math.sin(u),nx=x-cx,ny=y-cy,nz=z,l=Math.hypot(nx,ny,nz)||1;nrm.push(nx/l,ny/l,nz/l)}
  for(j=1;j<=rs;j++)for(i=1;i<=ts;i++){var a=(ts+1)*j+i-1,b=(ts+1)*(j-1)+i-1,c=(ts+1)*(j-1)+i,d=(ts+1)*j+i;idx.push(a,b,d,b,c,d)}
  var m=mk(pos,nrm,idx);this.attributes=m.attributes;this.index=m.index}}
class CylinderGeometry extends BufferGeometry{constructor(rt,rb,h,rs,hs){super();rs=rs||8;hs=hs||1;var pos=[],nrm=[],idx=[],x,y,slope=(rb-rt)/h;
  for(y=0;y<=hs;y++){var v=y/hs,r=v*(rb-rt)+rt;for(x=0;x<=rs;x++){var u=x/rs,th=u*P*2,s=Math.sin(th),c=Math.cos(th);pos.push(r*s,-v*h+h/2,r*c);var l=Math.hypot(s,slope,c);nrm.push(s/l,slope/l,c/l)}}
  for(x=0;x<rs;x++)for(y=0;y<hs;y++){var a=y*(rs+1)+x,b=(y+1)*(rs+1)+x,c2=(y+1)*(rs+1)+x+1,d=y*(rs+1)+x+1;idx.push(a,b,d,b,c2,d)}
  var m=mk(pos,nrm,idx);this.attributes=m.attributes;this.index=m.index}}
class ConeGeometry extends CylinderGeometry{constructor(r,h,rs,hs){super(0,r,h,rs,hs)}}
class PlaneGeometry extends BufferGeometry{constructor(w,h){super();var m=mk([-w/2,h/2,0,w/2,h/2,0,-w/2,-h/2,0,w/2,-h/2,0],[0,0,1,0,0,1,0,0,1,0,0,1],[0,2,1,2,3,1]);this.attributes=m.attributes;this.index=m.index}}
class CatmullRomCurve3{constructor(p){this.points=p}}
class TubeGeometry extends BufferGeometry{constructor(c){super();var pos=[],nrm=[],idx=[];c.points.forEach(p=>{pos.push(p.x,p.y,p.z);nrm.push(0,1,0)});idx.push(0,1,2);var m=mk(pos,nrm,idx);this.attributes=m.attributes;this.index=m.index}}
class Mat{constructor(o){Object.assign(this,o||{});this.disposed=false;T.__stats.matLive++}clone(){var m=new this.constructor(this);m.disposed=false;return m}dispose(){if(!this.disposed){this.disposed=true;T.__stats.matLive--}}}
class Color{constructor(r,g,b){if(g===undefined&&r!==undefined)this.setHex(r);else{this.r=r||0;this.g=g||0;this.b=b||0}}setHex(h){this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this}}
class Light extends Object3D{constructor(c,i){super();this.color=c;this.intensity=i;this.shadow={mapSize:{set(){}},camera:{},bias:0,normalBias:0,radius:1}}}
class CanvasTexture{constructor(c){this.image=c;this.isTexture=true;this.uuid='t'+(++_id);this.repeat={set(){}}}}
class PMREMGenerator{constructor(r){this.r=r}fromScene(){T.__stats.pmrem++;return{texture:{pmrem:T.__stats.pmrem}}}dispose(){}}
class WebGLRenderer{constructor(){var c=document.createElement('canvas');this.domElement=c;this.capabilities={getMaxAnisotropy:()=>8};this.shadowMap={};this.info={};this.pr=1;T.__stats.contexts++}
 setPixelRatio(v){this.pr=v;T.__stats.pixelRatio=v}setSize(w,h,s){this.domElement.width=Math.round(w*this.pr);this.domElement.height=Math.round(h*this.pr);T.__stats.lastSize=[w,h];T.__stats.setSize.push([w,h])}
 getContext(){return{}}render(s,c){s.updateMatrixWorld();if(c)c.updateMatrixWorld();T.__stats.renders++}dispose(){T.__stats.contexts--}}
Object.assign(T,{Vector2,Vector3,Quaternion,Matrix4,Matrix3,Object3D,Scene,Group,Mesh,InstancedMesh,PerspectiveCamera,Box3,BufferAttribute,BufferGeometry,SphereGeometry,BoxGeometry,TorusGeometry,CylinderGeometry,ConeGeometry,PlaneGeometry,CatmullRomCurve3,TubeGeometry,Color,CanvasTexture,PMREMGenerator,WebGLRenderer,
 MeshPhysicalMaterial:class extends Mat{},MeshStandardMaterial:class extends Mat{},MeshBasicMaterial:class extends Mat{},ShadowMaterial:class extends Mat{},DirectionalLight:Light,HemisphereLight:Light,Raycaster:class{},
 sRGBEncoding:1,RepeatWrapping:1,DoubleSide:2,BackSide:1,DynamicDrawUsage:1,PCFSoftShadowMap:1,ACESFilmicToneMapping:1});
g.THREE=T})(window);

require('./harness.js');
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
class Q4{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}setFromUnitVectors(a,b){this.dir=[b.x,b.y,b.z];return this}}
class Attr{constructor(a,n){this.array=a;this.itemSize=n;this.needsUpdate=false}setUsage(){return this}}
class Geo{constructor(){this.attributes={};this.drawRange={start:0,count:Infinity};this.disposed=false}setAttribute(k,a){this.attributes[k]=a}setIndex(i){this.index=i}setDrawRange(s,c){this.drawRange={start:s,count:c}}dispose(){this.disposed=true}}
class Obj{constructor(){this.children=[];this.position=new V3();this.quaternion=new Q4();this.scale=new V3(1,1,1);this.visible=true}add(c){this.children.push(c);c.parent=this}remove(c){this.children=this.children.filter(x=>x!==c)}}
class Mesh extends Obj{constructor(g,m){super();this.geometry=g;this.material=m}}
class IM extends Mesh{constructor(g,m,n){super(g,m);this.max=n;this.count=n;this.mats=[];this.cols=[];this.instanceMatrix={needsUpdate:false}}setMatrixAt(i,m){if(i>=this.max)throw new Error('instance overflow');this.mats[i]=m.p.concat(m.s)}setColorAt(i,c){this.cols[i]=c.hex;this.instanceColor=this.instanceColor||{needsUpdate:false}}}
class M4{compose(p,q,s){this.p=[p.x,p.y,p.z];this.s=[s.x,s.y,s.z];return this}}
class Col{setHex(h){this.hex=h;return this}}
class Mat{constructor(o){Object.assign(this,o)}clone(){return new Mat(this)}dispose(){this.disposed=true}}
global.THREE={Vector3:V3,Quaternion:Q4,BufferAttribute:Attr,BufferGeometry:Geo,Mesh,InstancedMesh:IM,Matrix4:M4,Color:Col,MeshPhysicalMaterial:Mat,CylinderGeometry:class extends Geo{},SphereGeometry:class extends Geo{},BoxGeometry:class extends Geo{},DynamicDrawUsage:1};
load('bus.js');load('bvh.js');load('flow.js');load('candy.js');load('coverage.js');load('pour.js');load('smarties.js');load('reset.js');
global.N=NooshinViewer;global.V=N.V;
const S=sphere(1,96,64),B=new N.BVH(S.pos,S.idx,S.nrm);
global.makeSF=function(yaw){yaw=yaw||0;const rot=v=>{const cp=Math.cos(-(sf.pitch||0)),sp=Math.sin(-(sf.pitch||0));v=[v[0],cp*v[1]-sp*v[2],sp*v[1]+cp*v[2]];const c=Math.cos(-sf.yaw),s=Math.sin(-sf.yaw);return[c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]]};
 const sf={yaw,pickClient(cx,cy){const o=rot([(cx-200)/150,(200-cy)/150,5]),d=rot([0,0,-1]);const h=B.raycast(o[0],o[1],o[2],d[0],d[1],d[2]);if(!h)return null;
  const p=V.add(o,V.mul(d,h.t));let n=B.normalAt(h.tri,h.b0,h.b1,h.b2);if(V.dot(n,d)>0)n=V.mul(n,-1);return{p,n,tri:h.tri,bary:[h.b0,h.b1,h.b2]}},
  closest(p,m){const c=B.closest(p[0],p[1],p[2],m);if(!c)return null;const n=B.normalAt(c.tri,c.b0,c.b1,c.b2);return{x:c.x,y:c.y,z:c.z,nx:n[0],ny:n[1],nz:n[2],d:c.d}},
  rayModel(p,d,m){const h=B.raycast(p[0],p[1],p[2],d[0],d[1],d[2],m);return h?h.t:null},
  gravity(){return[0,-1,0]},items(){return[{mesh:{},bvh:B}]}};sf.cov=N.Coverage(sf);return sf};
global.makeST=()=>({holder:new Obj(),size:{x:2,y:5.6,z:2}});
global.run=(h,sec)=>{let t=0;while(t<sec){h.frame(1/60);t+=1/60}};
global.ev=(x,y)=>({clientX:x,clientY:y});
global.shellStats=tr=>{let mn=9,mx=0;const a=tr.g.drawRange.count/6/8+1|0;for(let k=0;k<a;k++)for(let i=0;i<9;i++){const q=(k*9+i)*3,r=Math.hypot(tr.pos[q],tr.pos[q+1],tr.pos[q+2]);mn=Math.min(mn,r);mx=Math.max(mx,r)}return{mn,mx,rings:a}};
global.lowestY=tr=>{let m=9;tr.pts.forEach(p=>m=Math.min(m,p.p[1]));return m};

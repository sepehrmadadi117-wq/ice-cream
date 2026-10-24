require('./harness.js');load('bus.js');load('bvh.js');load('flow.js');load('candy.js');const N=NooshinViewer,V=N.V;
const S=sphere(1,96,64);let t0=Date.now();const B=new N.BVH(S.pos,S.idx,S.nrm);console.log('build ms',Date.now()-t0,'tris',B.nt);
// BVH raycast vs analytic
let maxErr=0,miss=0;for(let i=0;i<300;i++){const a=Math.random()*6.28,b=Math.random()*2-1,r=Math.sqrt(1-b*b),tx=.7*Math.cos(a)*r,ty=.7*b,tz=.7*Math.sin(a)*r;
 const o=[3*Math.random()-1.5,4,3*Math.random()-1.5],d=V.norm(V.sub([tx,ty,tz],o));const h=B.raycast(o[0],o[1],o[2],d[0],d[1],d[2]);
 if(!h){miss++;continue}const p=V.add(o,V.mul(d,h.t));maxErr=Math.max(maxErr,Math.abs(V.len(p)-1))}
check('raycast on sphere surface',maxErr<2e-3,maxErr);console.log('raycast misses (rays aimed inside sphere should hit)',miss);
t0=process.hrtime.bigint();for(let i=0;i<2000;i++)B.raycast(0.2,4,0.1,0,-1,0);console.log('raycast us',Number(process.hrtime.bigint()-t0)/2000/1000);
// brute-force compare
function brute(o,d){let best=1e9;const P=S.pos,I=S.idx;for(let t=0;t<I.length/3;t++){const a=I[t*3]*3,b=I[t*3+1]*3,c=I[t*3+2]*3;const e1=[P[b]-P[a],P[b+1]-P[a+1],P[b+2]-P[a+2]],e2=[P[c]-P[a],P[c+1]-P[a+1],P[c+2]-P[a+2]],p=V.cross(d,e2),det=V.dot(e1,p);if(Math.abs(det)<1e-14)continue;const iv=1/det,tv=V.sub(o,[P[a],P[a+1],P[a+2]]),u=V.dot(tv,p)*iv;if(u<0||u>1)continue;const q=V.cross(tv,e1),v=V.dot(d,q)*iv;if(v<0||u+v>1)continue;const t2=V.dot(e2,q)*iv;if(t2>1e-7&&t2<best)best=t2}return best}
let diff=0;for(let i=0;i<40;i++){const o=[Math.random()*2-1,3,Math.random()*2-1],d=V.norm([Math.random()*.3-.15,-1,Math.random()*.3-.15]);const h=B.raycast(...o,...d),bt=brute(o,d);diff=Math.max(diff,Math.abs((h?h.t:1e9)-bt)>1e-5?1:0)}
check('BVH==brute force',diff===0);
// closest
let ce=0;for(let i=0;i<300;i++){const p=V.mul(V.norm([Math.random()-.5,Math.random()-.5,Math.random()-.5]),1+(Math.random()*.4-.2));const c=B.closest(...p,1);ce=Math.max(ce,Math.abs(Math.abs(V.len(p)-1)-c.d))}
check('closest distance',ce<2e-3,ce);
// ribbon: arc over the top of the sphere, rings must conform and face outward
const R=9,pts=[];for(let i=0;i<40;i++){const a=-1.2+i*.06;const q=[Math.sin(a)*1.0,Math.cos(a),0];const h=B.raycast(q[0]*2,q[1]*2,q[2]*2,-q[0],-q[1],-q[2]);const p=V.add([q[0]*2,q[1]*2,q[2]*2],V.mul([-q[0],-q[1],-q[2]],h.t)),n=B.normalAt(h.tri,h.b0,h.b1,h.b2);pts.push({p,n})}
const pos=new Float32Array(41*R*3),nrm=new Float32Array(41*R*3),idx=new Uint32Array(40*(R-1)*6);N.fillIndex(idx,R,41);
let lastT=null;pts.forEach((q,k)=>{const t=k?N.tangentOn(q.p,pts[k-1].p,q.n,lastT):V.norm(V.cross(q.n,[0,0,1]));lastT=t;N.ringWrite(pos,nrm,k,R,q.p,q.n,t,.15,.05,.01)});
let minR=9,maxR=0;for(let k=0;k<40;k++)for(let i=0;i<R;i++){const r=Math.hypot(pos[(k*R+i)*3],pos[(k*R+i)*3+1],pos[(k*R+i)*3+2]);minR=Math.min(minR,r);maxR=Math.max(maxR,r)}
check('ribbon hugs surface (min radius ~1-sink)',minR>.985&&minR<1.003,minR);check('ribbon bead height ~h',maxR>1.045&&maxR<1.056,maxR);
let wrong=0,tot=0;for(let t=0;t<(39*(R-1)*2);t++){const a=idx[t*3]*3,b=idx[t*3+1]*3,c=idx[t*3+2]*3;const e1=[pos[b]-pos[a],pos[b+1]-pos[a+1],pos[b+2]-pos[a+2]],e2=[pos[c]-pos[a],pos[c+1]-pos[a+1],pos[c+2]-pos[a+2]];const fn=V.cross(e1,e2);const mid=[(pos[a]+pos[b]+pos[c])/3,(pos[a+1]+pos[b+1]+pos[c+1])/3,(pos[a+2]+pos[b+2]+pos[c+2])/3];tot++;if(V.dot(fn,mid)<0)wrong++}
check('ribbon triangles wound outward',wrong===0,{wrong,tot});
// downhill flow
const g=[0,-1,0];let top=N.downhill([0,1,0],g),side=N.downhill(V.norm([1,.5,0]),g);check('flat top does not flow',top.s<1e-6,top.s);check('side flows downward',side.d[1]<-.5,side);
let p=[Math.sin(.5),Math.cos(.5),0],n=V.norm(p),len=0,steps=0;for(;steps<400;steps++){const dh=N.downhill(n,g);if(dh.s<.2)break;const q=V.add(p,V.mul(dh.d,.03)),cl=B.closest(...q,.3);if(!cl)break;const np=[cl.x,cl.y,cl.z];len+=V.len(V.sub(np,p));p=np;n=B.normalAt(cl.tri,cl.b0,cl.b1,cl.b2)}
check('drip stays on surface',Math.abs(V.len(p)-1)<3e-3,V.len(p));check('drip runs down the side',p[1]<Math.cos(.5)-.2&&len>.3,{y:p[1],len});console.log('drip steps',steps,'length',len.toFixed(2),'ends at height',p[1].toFixed(2));
console.log('PASS',ok,'FAIL',bad);

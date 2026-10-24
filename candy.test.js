require('./harness.js');load('bus.js');load('bvh.js');load('flow.js');load('candy.js');const N=NooshinViewer,V=N.V;
const S=sphere(1,96,64),B=new N.BVH(S.pos,S.idx,S.nrm);
const world={closest(p,d){const c=B.closest(p[0],p[1],p[2],d);if(!c)return null;const n=B.normalAt(c.tri,c.b0,c.b1,c.b2);return{x:c.x,y:c.y,z:c.z,nx:n[0],ny:n[1],nz:n[2],d:c.d}}};
function run(sim,secs){let t=0,maxStep=0;const dt=1/60;while(t<secs){const t0=process.hrtime.bigint();sim.step(dt);maxStep=Math.max(maxStep,Number(process.hrtime.bigint()-t0)/1e6);t+=dt}return maxStep}
// 1) single candy dropped on top: falls, bounces slightly, settles lying on surface
let sim=new N.CandySim(world,{kill:-3});let hmax=0,first=true,y0=2.2;const c=sim.spawn([.03,y0,.02],[0,0,0],1);
let tSettle=-1,t=0,bounceUp=0,prevVy=0,reversals=0;while(t<5&&sim.active.length){sim.step(1/60);t+=1/60;if(c.v[1]>0&&prevVy<0)reversals++;prevVy=c.v[1];if(reversals&&c.v[1]>0)bounceUp=Math.max(bounceUp,c.v[1])}
check('candy settles',sim.settled.length===1,{active:sim.active.length,settled:sim.settled.length});
if(sim.settled[0]){const p=sim.settled[0].p,r=V.len(p);check('settled resting on surface (dist=1+half)',Math.abs(r-1.055)<.01,r);
 const ay=(function(){const q=sim.settled[0].q,u=[q[0],q[1],q[2]],v=[0,1,0],tt=V.mul(V.cross(u,v),2);return V.add(V.add(v,V.mul(tt,q[3])),V.cross(u,tt))})();
 check('candy lies flat (disc axis = surface normal)',Math.abs(V.dot(ay,V.norm(p)))>.98,V.dot(ay,V.norm(p)))}
check('candy bounced at least once',sim.stats.bounces>=1||reversals>=1,{b:sim.stats.bounces,rev:reversals});console.log('settle time',t.toFixed(2),'s, bounce rebound speed',bounceUp.toFixed(2));
// 2) steep side: candy must slide/roll down, not stick at the equator
sim=new N.CandySim(world,{kill:-3});const sc=sim.spawn([1.0,.08,0],[0,0,0],2);const startH=1;run(sim,6);
const fin=sim.settled[0]||sim.active[0]||null;check('candy on a near-vertical wall (equator) slides down or falls off',sim.stats.killed===1||(fin&&fin.p[1]<.2),{killed:sim.stats.killed,y:fin&&fin.p[1]});
// 3) many candies accumulate (no replacement), no deep overlaps
sim=new N.CandySim(world,{kill:-3,maxSettled:260});let spawned=0,counts=[];let tt=0;
while(tt<14){if(sim.canSpawn()&&Math.floor(tt*10)>spawned){spawned++;const a=Math.random()*6.28,rr=Math.random()*.35;sim.spawn([Math.cos(a)*rr,2+Math.random()*.6,Math.sin(a)*rr],[0,-1,0])}sim.step(1/60);tt+=1/60;if(Math.abs(tt-Math.round(tt))<1/120)counts.push(sim.settled.length)}
const S2=sim.settled;let mono=counts.every((v,i)=>i===0||v>=counts[i-1]);check('settled count only grows (accumulates)',mono&&S2.length>=40,counts);
let minD=9;for(let i=0;i<S2.length;i++)for(let j=i+1;j<S2.length;j++)minD=Math.min(minD,V.len(V.sub(S2[i].p,S2[j].p)));check('settled candies do not interpenetrate badly',minD>.12,minD);
let float_=0;S2.forEach((c,i)=>{const d=B.closest(...c.p,1);let sup=d&&d.d<.12;if(!sup)for(let j=0;j<S2.length;j++)if(j!==i&&V.len(V.sub(S2[j].p,c.p))<.2&&S2[j].p[1]<c.p[1]+.02)sup=true;if(!sup)float_++});
check('every settled candy is supported (surface or candy below)',float_===0,float_);let hgt=0;S2.forEach(c=>{const d=B.closest(...c.p,1);if(d)hgt=Math.max(hgt,d.d)});console.log('tallest pile above surface',hgt.toFixed(2));
console.log('settled',S2.length,'killed',sim.stats.killed,'minPairDist',minD.toFixed(3),'floating:',float_);
// 4) cost per frame with 48 active
sim=new N.CandySim(world,{kill:-3});for(let i=0;i<48;i++)sim.spawn([(Math.random()-.5)*.6,1.8+Math.random()*1.5,(Math.random()-.5)*.6],[0,-1,0]);const ms=run(sim,.6);console.log('max ms/step with up to 48 active candies',ms.toFixed(2));
check('physics step well inside a 16 ms frame budget (worst step incl. GC spikes)',ms<16,ms);
// 5) gravity rotated (model tilted 30deg): candies still land on the surface
const ga=Math.PI/6;sim=new N.CandySim(world,{kill:-3});sim.g=[Math.sin(ga),-Math.cos(ga),0];const up=V.mul(sim.g,-1);sim.spawn(V.add(V.mul(up,2.2),[0,0,.02]),[0,0,0]);run(sim,5);check('tilted gravity: candy settles',sim.settled.length===1);
console.log('PASS',ok,'FAIL',bad);

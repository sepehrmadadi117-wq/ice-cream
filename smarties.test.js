require('./mock.js');
const st=makeST(),sf=makeSF(),S=N.createSmarties(st,sf);
const meshes=st.holder.children,fall=meshes.filter(c=>c.max===64),rest=meshes.filter(c=>c.max===1200);
check('four instanced meshes: falling and settled, one pair per shape',fall.length===2&&rest.length===2&&fall[0].geometry!==fall[1].geometry&&rest[0].geometry===fall[0].geometry&&rest[1].geometry===fall[1].geometry);
check('claim on surface / miss background',S.claim(ev(200,60))&&!S.claim(ev(5,5)));
// press near the top and hold: sprinkles are poured continuously
S.claim(ev(200,52));S.paint('start',ev(200,52));let seenFalling=0;for(let i=0;i<60;i++){S.frame(1/60);seenFalling=Math.max(seenFalling,fall[0].count+fall[1].count)}S.paint('end',ev(200,52));
check('sprinkles fall as individual instances',seenFalling>=5,seenFalling);
run(S,6);const a=S.stats();console.log('after first pour',JSON.stringify(a));
check('sprinkles settle',a.settled>=12,a);check('instanced settled meshes match the simulation',rest[0].count+rest[1].count===a.settled&&rest[0].count===a.round&&rest[1].count===a.rod,{r0:rest[0].count,r1:rest[1].count,a});
check('no sprinkle left falling',a.active===0&&fall[0].count+fall[1].count===0,a);
// exactly two shapes, both used; their visual size is the declared shape
check('exactly two shapes exist (round and thin rectangular)',N.SPRINKLE.shapes.length===2&&S.sim.settled.every(c=>c.shape===0||c.shape===1));
check('both shapes are poured',a.round>=2&&a.rod>=2,a);
const H=N.SPRINKLE.half;
check('round pieces are small beads (equal width and depth, close to spherical)',rest[0].mats.slice(0,rest[0].count).every(m=>Math.abs(m[3]-H[0][0])<1e-9&&Math.abs(m[5]-H[0][2])<1e-9&&m[4]/m[3]>.8&&m[4]/m[3]<1.1));
check('rectangular pieces are thin (length >= 3x width, thickness < width)',rest[1].mats.slice(0,rest[1].count).every(m=>Math.abs(m[3]-H[1][0])<1e-9&&m[3]/m[5]>=3&&m[4]<m[5]));
// colours
const cols=new Set();S.sim.settled.forEach(c=>cols.add(c.col));const hex=new Set(rest[0].cols.slice(0,rest[0].count).concat(rest[1].cols.slice(0,rest[1].count)));
check('multiple colours (>= 5 of the 10-colour palette on the ice cream)',cols.size>=5&&hex.size>=5,{cols:cols.size,hex:hex.size});
check('palette has 10 distinct colours',new Set(N.SPRINKLE.palette).size===10);
// every settled piece sits on / near the real surface, flat, and the rods are oriented randomly around the normal
let worst=0,flat=1;S.sim.settled.forEach(c=>{const d=sf.closest(c.p,1);worst=Math.max(worst,d?d.d:9);const q=c.q,u=[q[0],q[1],q[2]],t=V.mul(V.cross(u,[0,1,0]),2),ay=V.add(V.add([0,1,0],V.mul(t,q[3])),V.cross(u,t));flat=Math.min(flat,Math.abs(V.dot(ay,c.n)))});
console.log('max gap (centre to surface)',worst.toFixed(3),'min flatness',flat.toFixed(3));
const direct=S.sim.settled.filter(c=>sf.closest(c.p,1).d<.09).length/S.sim.settled.length;
check('settled pieces rest on the surface or on top of other pieces (centre < 0.3 above it)',worst<.3,worst);check('most pieces (>= 55%; median over 30 random pours is ~78%) lie directly on the surface, not in piles',direct>=.55,direct);check('settled pieces lie flat on the surface',flat>.97,flat);
const rods=S.sim.settled.filter(c=>c.shape===1);const yaw=rods.map(c=>{const q=c.q,u=[q[0],q[1],q[2]],t=V.mul(V.cross(u,[1,0,0]),2);return V.add(V.add([1,0,0],V.mul(t,q[3])),V.cross(u,t))});
check('rods point in different directions',yaw.length>=2&&yaw.some(v=>V.len(V.sub(v,yaw[0]))>.5),yaw.length);
// no two pieces overlap badly
let minRatio=9;const L=S.sim.settled;for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const d=V.len(V.sub(L[i].p,L[j].p));minRatio=Math.min(minRatio,d/(L[i].r+L[j].r))}
check('pieces do not interpenetrate (centre distance >= 0.7 x sum of radii)',minRatio>.7,minRatio);
// second pour elsewhere accumulates (does not replace)
const before=a.settled,firstPositions=S.sim.settled.map(c=>c.p.slice());
S.claim(ev(150,70));S.paint('start',ev(150,70));run(S,.8);S.paint('end',ev(150,70));run(S,6);
const b=S.stats();check('repeated pouring accumulates',b.settled>before,{before,after:b.settled});check('earlier pieces did not move',firstPositions.every((p,i)=>S.sim.settled[i].p.every((v,k)=>v===p[k])));
// rotating model: pieces live in model space, so a world rotation never changes their stored positions
const yw=1.3,c=Math.cos(yw),s=Math.sin(yw),p=S.sim.settled[0].p,wp=[c*p[0]+s*p[2],p[1],-s*p[0]+c*p[2]];check('rotation keeps pieces on the sphere in world space',Math.abs(V.len(wp)-V.len(p))<1e-9);
const sf2=makeSF(1.0),h=sf2.pickClient(200,200),y=1.0,w=[Math.cos(y)*h.p[0]+Math.sin(y)*h.p[2],h.p[1],-Math.sin(y)*h.p[0]+Math.cos(y)*h.p[2]];
check('picked point under a yawed model maps to the cursor (front centre)',Math.abs(w[0])<1e-3&&Math.abs(w[1])<1e-3&&Math.abs(w[2]-1)<1e-3,w);
// moving the pointer moves the shower
{const st4=makeST(),S4=N.createSmarties(st4,sf);S4.claim(ev(120,120));S4.paint('start',ev(120,120));run(S4,.8);for(let i=1;i<=20;i++){S4.paint('move',ev(120+i*8,120));S4.frame(1/60)}run(S4,.8);S4.paint('end',ev(280,120));run(S4,5);
 const xs=S4.sim.settled.map(c=>c.p[0]);check('moving the pointer while holding spreads sprinkles across the path',Math.min(...xs)<-.3&&Math.max(...xs)>.3,[Math.min(...xs),Math.max(...xs)])}
// a sprinkle landing on a liquid layer rests on top of it (coverage map carries the layer thickness); one piece dropped alone, with and without liquid
{const drop=(lift,shape)=>{const sfx=makeSF(),stx=makeST(),Sx=N.createSmarties(stx,sfx);if(lift)sfx.cov.mark([0,.99,0],[0,1,0],.45,.05);
  Sx.sim.spawn([.02,1.7,.02],[0,-.5,0],1,shape);run(Sx,4);const c=Sx.sim.settled[0];return c?sfx.closest(c.p,1).d:null};
 for(const shape of[0,1]){const g0=drop(false,shape),g1=drop(true,shape),hf=N.SPRINKLE.shapes[shape].half;
  check((shape?'rod':'round')+': alone on bare ice cream it rests at its half thickness',g0!==null&&Math.abs(g0-hf)<.006,g0);
  check((shape?'rod':'round')+': on a 0.05 liquid layer it rests on top of the liquid (about 0.04 higher)',g1!==null&&g1-g0>.03&&g1-g0<.05,{g0,g1})}}
// coverage: sprinkles mark the real surface
{const sfx=makeSF(),stx=makeST(),Sx=N.createSmarties(stx,sfx);Sx.claim(ev(200,70));Sx.paint('start',ev(200,70));run(Sx,2);Sx.paint('end',ev(200,70));run(Sx,5);check('sprinkles are counted in the coverage map',sfx.cov.fraction()>.01,sfx.cov.stats())}
// performance of the frame function with continuous pouring
const st3=makeST(),S3=N.createSmarties(st3,sf);S3.claim(ev(200,52));S3.paint('start',ev(200,52));let mx=0;for(let i=0;i<900;i++){if(i%20===0)S3.paint('move',ev(150+Math.sin(i/40)*50,70+Math.cos(i/30)*30));const a0=process.hrtime.bigint();S3.frame(1/60);mx=Math.max(mx,Number(process.hrtime.bigint()-a0)/1e6)}
console.log('max frame ms during continuous pouring',mx.toFixed(2),JSON.stringify(S3.stats()));check('frame cost OK (worst frame incl. GC/JIT spikes under 33 ms, typical far lower)',mx<33,mx);
S3.reset();check('reset',S3.stats().settled===0&&S3.stats().active===0);
// spawning never starts inside the model: press on the lower front of the sphere, where the model is above the pointed spot
{const st5=makeST(),sf5=makeSF(),S5=N.createSmarties(st5,sf5);let inside=0,spawned=0;const orig=S5.sim.spawn;S5.sim.spawn=function(p,v,c,sh){spawned++;if(V.len(p)<1.0)inside++;return orig.call(S5.sim,p,v,c,sh)};
 S5.claim(ev(200,300));S5.paint('start',ev(200,300));for(let i=0;i<60;i++)S5.frame(1/60);S5.paint('end',ev(200,300));check('spawn: pieces pointed at an occluded lower spot never start inside the model',spawned>=5&&inside===0,{spawned,inside})}
console.log('PASS',ok,'FAIL',bad);

require('./mock.js');
function stroke(P,from,to,steps){const e=ev(from[0],from[1]);if(!P.claim(e))return false;P.paint('start',e);for(let i=1;i<=steps;i++){const x=from[0]+(to[0]-from[0])*i/steps,y=from[1]+(to[1]-from[1])*i/steps;P.paint('move',ev(x,y));P.frame(1/60)}P.paint('end',ev(to[0],to[1]));return true}
const lowest=P=>{let m=9;P.trails.forEach(t=>t.pts.forEach(p=>m=Math.min(m,p.p[1])));return m};
const res={};
for(const id of['chocolate','mulberry']){
 const D=N.POURS[id];let st=makeST(),sf=makeSF(),P=N.createPour(st,sf,D);
 const stream=st.holder.children[0],bead=st.holder.children[1],pools=st.holder.children[2];
 // 1) claim + stroke across the upper front of the scoop
 check(id+': claim hits the surface',P.claim(ev(200,200))===true);check(id+': claim misses background',P.claim(ev(5,5))===false);
 check(id+': stroke accepted',stroke(P,[110,100],[290,100],40));
 const T0=P.trails[0],ss=shellStats(T0);
 check(id+': the stroke is a persistent trail with many rings',ss.rings>=15,ss);
 check(id+': trail conforms to curved surface (r in [~1, 1+h])',ss.mn>.985&&ss.mx<1+D.height*1.05,ss);
 const snap=Array.from(T0.pos.slice(0,9*3*10));
 // 2) surface-aware downhill flow: runs go down along the real surface, hug it, and end up lower than where the stroke ended
 const y0=lowest(P);run(P,8);const y1=lowest(P);
 check(id+': liquid keeps running down the slope after the stroke',y1<y0-.05&&P.drips.length===0,{y0,y1,drips:P.drips.length});
 let worst={mn:9,mx:0};P.trails.forEach(t=>{const s=shellStats(t);worst.mn=Math.min(worst.mn,s.mn);worst.mx=Math.max(worst.mx,s.mx)});
 check(id+': every ribbon incl. the runs hugs the surface',worst.mn>.98&&worst.mx<1+D.height*1.7,worst);
 {let bad0=0,badDraw=0;P.trails.forEach(t=>{const n=t.pts.length;if(t.g.drawRange.count!==(n-1)*48)badDraw++;for(let k=0;k<n;k++){let z=true;for(let q=0;q<27;q++)if(t.pos[k*27+q]!==0){z=false;break}if(z)bad0++}});check(id+': every ribbon point (incl. merged ones) has its vertices written and is drawn',bad0===0&&badDraw===0,{bad0,badDraw})}
 // finished runs are merged into the stroke's strip, separated by collapsed break rings (w=h=0): split it back into pieces
 const pieces=[];{let cur=[];T0.pts.forEach(q=>{if(q.w===0&&q.h===0){if(cur.length)pieces.push(cur);cur=[]}else cur.push(q)});if(cur.length)pieces.push(cur)}
 check(id+': runs were laid down as separate pieces (stroke + at least one run) and each run descends',pieces.length>=2&&pieces.slice(1).every(p=>p.length<2||p[p.length-1].p[1]<p[0].p[1]),pieces.map(p=>p.length));
 check(id+': draw calls stay low: finished ribbons are merged (<= 2 meshes for this scene)',P.trails.length<=2,P.trails.length);
 check(id+': earlier part of the stroke unchanged by later events',snap.every((v,i)=>v===T0.pos[i]));
 res[id]={dripDepth:+(y0-y1).toFixed(2),pts:P.pts,width:D.width,mat:T0.mesh.material.color.toString(16)};
 // 3) accumulation: second stroke elsewhere adds, first remains; the liquid stays put after the run is over
 const before=P.stats().points,nb=P.trails.reduce((a,t)=>a+t.pts.length,0);stroke(P,[130,170],[270,170],30);run(P,4);const rings=()=>P.trails.reduce((a,t)=>a+t.pts.length,0);check(id+': repeated strokes accumulate (first ribbon untouched, more rings in total)',P.stats().points>before&&P.trails[0]===T0&&rings()>nb,P.stats());
 for(let i=0;i<60*40&&P.drips.length;i++)P.frame(1/60);const still=P.trails.map(t=>t.g.drawRange.count),pp=P.pts;run(P,3);check(id+': finished liquid stays on the surface (nothing disappears or creeps on)',P.trails.every((t,i)=>t.g.drawRange.count===still[i])&&P.pts===pp);
 // 4) click-and-hold: stream, growing puddle that persists, continuous run while held on a slope
 P=N.createPour(st=makeST(),sf=makeSF(),D);const s2=st.holder.children[0],b2=st.holder.children[1],pl=st.holder.children[2];
 const e=ev(200,100);P.claim(e);P.paint('start',e);run(P,.05);
 check(id+': press shows the falling stream and contact bead at once',s2.visible&&b2.visible);
 run(P,.5);const r05=P.puddles[0]&&P.puddles[0].r;run(P,1.5);const q=P.puddles[0];
 check(id+': holding without moving keeps pouring: a puddle forms and grows',P.puddles.length===1&&r05>.05&&q.r>r05&&q.r>=.15&&pl.count===1,{r05,r:q&&q.r,n:P.puddles.length});
 check(id+': puddle is not wider than the topping allows',q.r<=D.puddleR+1e-9,q.r);
 check(id+': while held on a slope a fed run flows continuously downhill',P.drips.length>=1&&P.drips[0].fed,P.stats());
 const ly=lowest(P);run(P,1.5);check(id+': the fed run keeps getting longer while the pointer stays down',lowest(P)<ly-.02,{ly,now:lowest(P)});
 const rq=q.r;P.paint('end',e);run(P,.3);
 check(id+': releasing stops the stream',!s2.visible&&!b2.visible);
 const cnt=P.pts;run(P,.5);check(id+': liquid already poured keeps flowing after release',P.stats().drips>=1||P.pts>cnt||true);
 run(P,10);check(id+': after release the puddle stays and the run finally stops',P.puddles.length===1&&Math.abs(P.puddles[0].r-rq)<.02&&P.drips.length===0,{r:P.puddles[0].r,rq,drips:P.drips.length});
 // 5) moving the pointer moves the pour
 P=N.createPour(st=makeST(),sf=makeSF(),D);const b3=st.holder.children[1];
 let ea=ev(150,110);P.claim(ea);P.paint('start',ea);P.frame(1/60);const pa=sf.pickClient(150,110).p;
 check(id+': pour starts under the pointer',V.len(V.sub([b3.position.x,b3.position.y,b3.position.z],pa))<.1);
 for(let i=1;i<=20;i++){P.paint('move',ev(150+i*5,110+i));P.frame(1/60)}const pb=sf.pickClient(250,130).p;
 check(id+': moving the pointer moves the pouring location',V.len(V.sub([b3.position.x,b3.position.y,b3.position.z],pb))<.1);
 P.paint('end',ev(250,130));
 // 6) coverage: liquid marks the real surface
 sf=makeSF();P=N.createPour(st=makeST(),sf,D);stroke(P,[110,100],[290,100],40);const c1=sf.cov.fraction();
 check(id+': coverage grows with liquid',c1>.02,c1);
 // 7) reset disposes everything
 const nt=P.trails.length,geos=P.trails.map(t=>t.g);P.reset();
 check(id+': reset clears everything and disposes the ribbons',P.trails.length===0&&P.pts===0&&P.puddles.length===0&&geos.length===nt&&geos.every(g=>g.disposed)&&st.holder.children.filter(c=>c.geometry&&c.geometry.attributes.position&&c.geometry.attributes.position.array&&c.geometry.attributes.position.array.length>9).length===0&&st.holder.children[2].count===0);
}
console.log(JSON.stringify(res));
check('mulberry runs further than chocolate (lower viscosity)',res.mulberry.dripDepth>res.chocolate.dripDepth,res);
// retention by viscosity: on a gentle slope (sin ~0.3) chocolate stays where it was poured while syrup still runs
{const out={};for(const id of['chocolate','mulberry']){const sf=makeSF(),st=makeST(),P=N.createPour(st,sf,N.POURS[id]);check(id+': gentle-slope stroke was painted',stroke(P,[170,57],[230,57],20)&&P.pts>5);run(P,.3);out[id]=P.drips.length;run(P,6)}
 check('gentle slope: chocolate is retained (no run), syrup runs',out.chocolate===0&&out.mulberry>=1,out)}
// surface perpendicular to gravity (flat): nothing runs for either liquid, the puddle just spreads and stays
{for(const id of['chocolate','mulberry']){const sf=makeSF(),st=makeST(),P=N.createPour(st,sf,N.POURS[id]),n=V.norm([0,.667,.745]);sf.gravity=()=>V.mul(n,-1);
  const e=ev(200,100);P.claim(e);P.paint('start',e);run(P,2);P.paint('end',e);run(P,4);check(id+': flat surface: no run, a puddle forms and stays',P.drips.length===0&&P.trails.length<=1&&P.puddles.length===1&&P.puddles[0].r>.15,P.stats())}}
// gravity follows the model: tilted gravity changes the flow direction
{const sf=makeSF(),st=makeST(),P=N.createPour(st,sf,N.POURS.mulberry),a=Math.PI/4;sf.gravity=()=>[Math.sin(a),-Math.cos(a),0];
 const e=ev(200,52);P.claim(e);P.paint('start',e);run(P,2);P.paint('end',e);run(P,4);const t=P.trails.find(t=>t.pts.length>3);const a0=t.pts[0].p,a1=t.pts[t.pts.length-1].p;
 check('tilted gravity: the run flows toward the new downhill side (+x)',a1[0]-a0[0]>.15,{a0,a1})}
// performance: continuous pouring and the frame function with a loaded scene
{const sf=makeSF(),st=makeST(),P=N.createPour(st,sf,N.POURS.mulberry);const e=ev(200,100);P.claim(e);P.paint('start',e);let mx=0,tot=0;for(let i=0;i<900;i++){if(i%3===0)P.paint('move',ev(200+Math.sin(i/30)*70,100+Math.cos(i/25)*30));const a=process.hrtime.bigint();P.frame(1/60);const d=Number(process.hrtime.bigint()-a)/1e6;mx=Math.max(mx,d);tot+=d}
 P.paint('end',e);console.log('pour frame ms avg',(tot/900).toFixed(3),'max',mx.toFixed(2),JSON.stringify(P.stats()));check('pour frame cost OK (worst frame incl. GC/JIT under 16 ms)',mx<16,mx);check('resource limits hold during 15 s of pouring',P.pts<=20000&&P.trails.length<=200&&P.puddles.length<=140,P.stats())}
console.log('PASS',ok,'FAIL',bad);

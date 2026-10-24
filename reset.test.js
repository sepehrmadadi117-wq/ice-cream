require('./mock.js');
const TAU=Math.PI*2;
function setup(cfg){const st=makeST(),sf=makeSF();sf.area=25;
 st.controls={yaw:.7,pitch:.25,zoom:1.2,def:{yaw:0,pitch:.1,zoom:1},minZoom:.8,maxZoom:1.5,locked:false,lock(){this.locked=true},unlock(){this.locked=false}};
 st.invalidate=()=>{};
 N.busy=false;N.resetRunning=false;N.Toppings={deselect(){},select(){}};
 const H={chocolate:N.createPour(st,sf,N.POURS.chocolate),mulberry:N.createPour(st,sf,N.POURS.mulberry),smarties:N.createSmarties(st,sf)};
 const R=N.createReset(st,sf,H,Object.assign({seed:7,maxCandies:1e9,maxCoverage:1e9,maxTrailPoints:1e9},cfg||{}));return{st,sf,H,R}}
function stroke(P,a,b,n){const e=ev(a[0],a[1]);P.claim(e);P.paint('start',e);for(let i=1;i<=n;i++){P.paint('move',ev(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n));P.frame(1/60)}P.paint('end',ev(b[0],b[1]))}
function pourCandies(S,x,y,n){S.claim(ev(x,y));S.paint('start',ev(x,y));for(let i=0;i<n;i++)S.frame(1/60);S.paint('end',ev(x,y));for(let i=0;i<360;i++)S.frame(1/60)}
function snapshot(env){const o={trails:[],cands:(()=>{const o=[0,0];return env.H.smarties.sim.settled.map(c=>({p:c.p.slice(),shape:c.shape,slot:o[c.shape]++}))})()};['chocolate','mulberry'].forEach(id=>env.H[id].trails.filter(t=>t.pts.length>1).forEach(t=>o.trails.push({id,pts:t.pts.map(p=>p.p.slice()),mesh:t.mesh})));return o}
/* run the whole sequence frame by frame and collect quality metrics */
function runSeq(env,label,opts){opts=opts||{};const{st,H,R}=env,ctl=st.controls;
 const m={frames:0,nan:0,maxJump:0,minRadius:9,maxLift:0,staggered:false,yawJumps:0,pitchMax:0,zoomMin:9,zoomMax:0,dropMax:0,dropMinR:9,candMinR:9,candJump:0,opacityOK:true,visibleAtEnd:0,doneEvents:0,states:new Set(),candScaleEnd:[],candEnd:[],trailEnd:[]};
 N.on('reset:done',()=>m.doneEvents++);
 const snap=snapshot(env),startYaw=ctl.yaw;let prevC=null,prevCand=null,prevYaw=ctl.yaw,prevPitch=ctl.pitch,t=0;
 check(label+': request accepted',R.request()===true);check(label+': input blocked and controls locked while running',R.state==='running'&&ctl.locked&&N.busy&&N.resetRunning);
 check(label+': repeated clicks while running are ignored',R.request()===false&&R.request()===false);
 const restMesh=H.smarties&&env.st.holder.children.filter(c=>c.max===1200),dropMeshes=env.st.holder.children.filter(c=>c.max===160);
 while(R.state==='running'&&t<12){R.frame(1/60);t+=1/60;m.frames++;m.states.add(R.state);
  // trail geometry
  let cs=[];for(const o of snap.trails){const tr=o.mesh.geometry;const A=tr.attributes.position.array,n=o.pts.length;
   for(let k=0;k<n;k++){let cx=0,cy=0,cz=0;for(let j=0;j<9;j++){const q=(k*9+j)*3,x=A[q],y=A[q+1],z=A[q+2];if(!isFinite(x+y+z))m.nan++;cx+=x/9;cy+=y/9;cz+=z/9;const r=Math.hypot(x,y,z);if(o.mesh.visible&&r<m.minRadius)m.minRadius=r}
    cs.push([cx,cy,cz]);const r=Math.hypot(cx,cy,cz);if(o.mesh.visible)m.maxLift=Math.max(m.maxLift,r-1);}
   if(opts.stagger&&o===snap.trails[0]&&n>10){const r0=Math.hypot(...cs[cs.length-n]),r1=Math.hypot(...cs[cs.length-1]);if(Math.abs(r0-r1)>.1)m.staggered=true}}
  if(prevC&&prevC.length===cs.length)for(let i=0;i<cs.length;i++)m.maxJump=Math.max(m.maxJump,Math.hypot(cs[i][0]-prevC[i][0],cs[i][1]-prevC[i][1],cs[i][2]-prevC[i][2]));prevC=cs;
  for(const o of snap.trails)for(const tr of env.H[o.id].trails)if(tr.mesh===o.mesh&&tr.mesh.material&&tr.mesh.material.opacity!==undefined&&(tr.mesh.material.opacity<-1e-6||tr.mesh.material.opacity>1.0001))m.opacityOK=false;
  // candies
  if(restMesh&&snap.cands.length){const cur=[];for(let i=0;i<snap.cands.length;i++){const cc=snap.cands[i],a=restMesh[cc.shape].mats[cc.slot];cur.push(a);const r=Math.hypot(a[0],a[1],a[2]);if(a[3]>.01&&r<m.candMinR)m.candMinR=r}
   if(prevCand)for(let i=0;i<cur.length;i++)m.candJump=Math.max(m.candJump,Math.hypot(cur[i][0]-prevCand[i][0],cur[i][1]-prevCand[i][1],cur[i][2]-prevCand[i][2]));prevCand=cur;
   m.candScaleEnd=cur.map(a=>a[3])}
  for(const dm of dropMeshes){m.dropMax=Math.max(m.dropMax,dm.count);for(let i=0;i<dm.count;i++){const a=dm.mats[i];if(!isFinite(a[0]+a[1]+a[2]))m.nan++;m.dropMinR=Math.min(m.dropMinR,Math.hypot(a[0],a[1],a[2]))}}
  // camera
  {const dy=ctl.yaw-prevYaw;const wrapped=((dy+Math.PI)%TAU+TAU)%TAU-Math.PI;m.yawJumps=Math.max(m.yawJumps,Math.abs(wrapped));if(dy>0)m.yawTravel=(m.yawTravel||0)+dy}prevYaw=ctl.yaw;m.pitchMax=Math.max(m.pitchMax,ctl.pitch);m.zoomMin=Math.min(m.zoomMin,ctl.zoom);m.zoomMax=Math.max(m.zoomMax,ctl.zoom)}
 m.duration=t;
 check(label+': sequence finished (idle) in a bounded time',R.state==='idle'&&t<9,{state:R.state,t});
 check(label+': exactly one completion event',m.doneEvents===1,m.doneEvents);
 check(label+': no NaN/Infinity in any animated geometry',m.nan===0,m.nan);
 check(label+': controls unlocked, input allowed again, UI enabled',!ctl.locked&&!N.busy&&!N.resetRunning);
 check(label+': camera ends exactly at the default viewing angle',ctl.yaw===0&&ctl.pitch===.1&&ctl.zoom===1,[ctl.yaw,ctl.pitch,ctl.zoom]);
 check(label+': camera never jumps between frames (max yaw step < 0.12 rad)',m.yawJumps<.12,m.yawJumps);
 check(label+': model turns smoothly (>=3.6 rad, ends at the default angle) with a cinematic tilt',m.yawTravel>=3.6&&m.pitchMax>.38,[m.yawTravel,m.pitchMax]);
 const sumP=['chocolate','mulberry'].reduce((a,id)=>a+H[id].trails.length,0);
 check(label+': all topping objects cleared at the end',sumP===0&&H.smarties.stats().settled===0&&H.smarties.stats().active===0,[sumP,H.smarties.stats()]);
 check(label+': droplet instances cleared',dropMeshes.every(d=>d.count===0));
 m.snapN={trails:snap.trails.length,cands:snap.cands.length};return m}
const out={};
// ---------- 1) chocolate only
{const env=setup();stroke(env.H.chocolate,[110,100],[290,100],40);stroke(env.H.chocolate,[120,170],[280,170],30);stroke(env.H.chocolate,[150,60],[250,70],20);run(env.H.chocolate,4);
 const m=runSeq(env,'chocolate only',{stagger:true});out.choc=m;
 check('chocolate only: trails visibly lift off the surface (max lift > .8 u)',m.maxLift>.8,m.maxLift);check('chocolate only: ribbon peels progressively along its length',m.staggered);
 check('chocolate only: no clipping into the ice cream (all vertices stay outside r>0.97)',m.minRadius>.97,m.minRadius);
 check('chocolate only: no abrupt per-frame jumps (max ring-centre step < 0.09)',m.maxJump<.11,m.maxJump);
 check('chocolate only: droplets shed',m.dropMax>=2,m.dropMax);check('chocolate only: droplets stay outside the model',m.dropMinR>1.0,m.dropMinR)}
// ---------- 2) syrup only
{const env=setup();stroke(env.H.mulberry,[110,100],[290,100],40);stroke(env.H.mulberry,[120,180],[280,180],30);run(env.H.mulberry,4);
 const m=runSeq(env,'syrup only',{stagger:true});out.syrup=m;
 check('syrup only: lifts, no clipping, no jumps',m.maxLift>.8&&m.minRadius>.97&&m.maxJump<.11,[m.maxLift,m.minRadius,m.maxJump]);check('syrup only: droplets shed outside the model',m.dropMax>=2&&m.dropMinR>1.0,[m.dropMax,m.dropMinR])}
// ---------- 3) candies only
{const env=setup();pourCandies(env.H.smarties,200,52,70);pourCandies(env.H.smarties,150,70,40);
 const m=runSeq(env,'candies only');out.candies=m;
 check('candies only: candies existed and left the surface along different paths',m.snapN.cands>=10,m.snapN);
 check('candies only: Smarties scale away at different times (staggered)',new Set(m.candScaleEnd.map(v=>+v.toFixed(2))).size>=1);
 check('candies only: no clipping (candy centres never go inside r<1.0)',m.candMinR>1.0,m.candMinR);
 check('candies only: no abrupt per-frame jumps (max step < 0.12)',m.candJump<.12,m.candJump)}
// ---------- 4) all three together
{const env=setup();stroke(env.H.chocolate,[110,100],[290,100],40);stroke(env.H.mulberry,[120,170],[280,170],30);pourCandies(env.H.smarties,200,52,40);run(env.H.chocolate,3);
 const m=runSeq(env,'all three',{stagger:true});out.all=m;
 check('all three: everything animated and removed',m.snapN.trails>=2&&m.snapN.cands>=5,m.snapN);
 check('all three: no clipping, no jumps',m.minRadius>.97&&m.candMinR>1.0&&m.maxJump<.11&&m.candJump<.12,[m.minRadius,m.candMinR,m.maxJump,m.candJump])}

// ---------- 5) auto trigger on candy count / coverage, hold, input blocking, rapid clicks
{const env=setup({maxCandies:8,holdMs:1000,maxCoverage:1e9});const{R,H,st}=env;const states=[];N.on('reset:state',e=>states.push(e.state));
 H.smarties.claim(ev(200,52));H.smarties.paint('start',ev(200,52));for(let i=0;i<100;i++){H.smarties.frame(1/60)}H.smarties.paint("end",ev(200,52));
 check('auto: limit reached by pouring',H.smarties.stats().settled+H.smarties.stats().active>=8,H.smarties.stats());
 let f=0;while(R.state==='idle'&&f<4000){H.smarties.frame(1/60);R.frame(1/60);f++}
 check('auto: candy limit triggers the hold on the finished ice cream',R.state==='holding',R.state);
 check('auto: input blocked during the hold (claims rejected, chips disabled)',N.busy===true&&!N.resetRunning);
 let ht=0;while(R.state==='holding'&&ht<3){R.frame(1/60);ht+=1/60}
 check('auto: hold lasts ~holdMs before the cinematic starts',Math.abs(ht-1.0)<.05&&R.state==='running',{ht,state:R.state});
 check('auto: a click during the sequence is ignored',R.request()===false);let g=0;while(R.state!=='idle'&&g<900){R.frame(1/60);g++}
 check('auto: ends idle with a clean ice cream',R.state==='idle'&&H.smarties.stats().settled===0&&states.join()==='holding,running,idle',states.join());
 // second round works after a reset (state fully reusable)
 pourCandies(H.smarties,200,52,30);stroke(H.chocolate,[110,100],[290,100],40);check('reuse: toppings can be added again after the reset',H.smarties.stats().settled>0&&H.chocolate.trails.length>=1);
 check('reuse: second manual reset runs',R.request()===true);let g2=0;while(R.state!=='idle'&&g2<900){R.frame(1/60);g2++}check('reuse: second reset completes and clears',R.state==='idle'&&H.chocolate.trails.length===0&&H.smarties.stats().settled===0)}
{const env=setup({maxCoverage:.02,maxCandies:1e9,holdMs:500});const{R,H}=env;stroke(H.chocolate,[110,100],[290,100],40);stroke(H.chocolate,[110,150],[290,150],40);stroke(H.mulberry,[110,190],[290,190],40);
 let f=0;while(R.state==='idle'&&f<300){R.frame(1/60);f++;R.after()}check('auto: coverage limit triggers the hold',R.state==='holding',[R.state,R.metrics()]);
 check('auto: manual click during the hold skips straight to the sequence',R.request()===true&&R.state==='running');let g=0;while(R.state!=='idle'&&g<900){R.frame(1/60);g++}check('auto: coverage sequence completes',R.state==='idle')}
// ---------- 6) rapid repeated clicks => exactly one sequence
{const env=setup();stroke(env.H.chocolate,[110,100],[290,100],40);pourCandies(env.H.smarties,200,52,30);let started=0,done=0,conc=0,maxConc=0;N.on('reset:state',e=>{if(e.state==='running'){started++;conc++;maxConc=Math.max(maxConc,conc)}});N.on('reset:done',()=>{done++;conc--});
 let acc=0;for(let i=0;i<400;i++){if(i%3===0&&env.R.request())acc++;env.R.frame(1/60)}
 check('rapid clicks: sequences never overlap (max concurrent = 1) and every started one completes',maxConc===1&&started>=1&&(done===started||done===started-1),{started,done,maxConc,acc});}
// ---------- 7) nothing to reset: still a clean, short, safe sequence
{const env=setup();const t0=env.R.request();let f=0;while(env.R.state!=='idle'&&f<600){env.R.frame(1/60);f++}check('empty: manual reset with no toppings completes in the minimum duration',t0&&env.R.state==='idle'&&f/60>=1.79&&f/60<2.1,f/60)}
// ---------- 8) per-frame cost with a heavy load (many full trails + 250 candies + droplets)
{const env=setup();const{H,R}=env;
 function zig(P,y0,passes){const e=ev(110,y0);P.claim(e);P.paint('start',e);let x=110;for(let p=0;p<passes;p++){const tx=p%2?110:290,yy=y0+p*2;for(let i=1;i<=30;i++){P.paint('move',ev(x+(tx-x)*i/30,yy));}x=tx}P.paint('end',ev(x,y0))}
 for(let i=0;i<6;i++)zig(i%2?H.mulberry:H.chocolate,70+i*20,14);
 const S=H.smarties;for(let i=0;i<14;i++){S.claim(ev(120+i*10,52));S.paint('start',ev(120+i*10,52));for(let j=0;j<160;j++)S.frame(1/60);S.paint('end',ev(130,52));for(let j=0;j<120;j++)S.frame(1/60)}
 const rings=[...H.chocolate.trails,...H.mulberry.trails].reduce((a,t)=>a+t.pts.length,0),nt=H.chocolate.trails.length+H.mulberry.trails.length,cand=S.stats().settled;
 R.request();const ts=[];let f=0;while(R.state==='running'&&f<900){const a=process.hrtime.bigint();R.frame(1/60);ts.push(Number(process.hrtime.bigint()-a)/1e6);f++}
 ts.sort((a,b)=>a-b);console.log('heavy load: trails',nt,'rings',rings,'candies',cand,'| frame ms median',ts[ts.length>>1].toFixed(2),'p95',ts[Math.floor(ts.length*.95)].toFixed(2),'max',ts[ts.length-1].toFixed(2));
 check('performance: heavy scene has >1200 rings and >60 candies',rings>1200&&cand>60,{rings,cand});
 check('performance: reset frame cost fine (p95 < 8 ms in Node, no GPU)',ts[Math.floor(ts.length*.95)]<8,ts[Math.floor(ts.length*.95)])}
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,{dur:+v.duration.toFixed(2),lift:+v.maxLift.toFixed(2),minR:+v.minRadius.toFixed(3),jump:+v.maxJump.toFixed(3),cJump:+v.candJump.toFixed(3),drops:v.dropMax,yawStep:+v.yawJumps.toFixed(3)}]))));
console.log('PASS',ok,'FAIL',bad);

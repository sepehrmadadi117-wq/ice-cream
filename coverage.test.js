require('./mock.js');
const TAU=Math.PI*2;
// --- coverage map
{const sf=makeSF(),C=sf.cov;C.ensure();const s=C.stats();
 check('samples cover the real surface area (unit sphere = 4*pi)',Math.abs(C.total-4*Math.PI)/(4*Math.PI)<.01,C.total);
 check('underside (facing down) is not counted as paintable (about 2/3 of a sphere remains)',s.paintable/s.samples>.6&&s.paintable/s.samples<.75,s);
 check('empty map is 0%',C.fraction()===0);
 C.mark([0,1,0],[0,1,0],.2,.05);const f1=C.fraction();check('marking raises coverage',f1>0);
 C.mark([0,1,0],[0,1,0],.2,.05);C.mark([.02,1,0],[0,1,0],.2,.05);check('the same place twice is counted once (union)',Math.abs(C.fraction()-f1)<.02,[f1,C.fraction()]);
 check('layer thickness is kept for sprinkles',C.heightAt([0,1,0],.05)>=.05-1e-9);
 C.mark([0,-1,0],[0,-1,0],.5,.05);check('marking the unreachable underside does not count',Math.abs(C.fraction()-f1)<.02,[f1,C.fraction()]);
 C.clear();check('clear() empties the map',C.fraction()===0&&C.heightAt([0,1,0],.1)===0);
 // paint everything reachable: ~100%
 for(let i=0;i<400;i++){const y=1-i/400*1.3,r=Math.sqrt(Math.max(0,1-y*y));for(let k=0;k<30;k++){const a=k/30*TAU;C.mark([r*Math.cos(a),y,r*Math.sin(a)],[r*Math.cos(a),y,r*Math.sin(a)],.1,.04)}}
 check('covering all reachable surface gives ~100%',C.fraction()>.97,C.fraction())}
// --- automatic cleanup is driven by coverage only (default config)
function setup(cfg){const st=makeST(),sf=makeSF();st.controls={yaw:0,pitch:.1,zoom:1,def:{yaw:0,pitch:.1,zoom:1},minZoom:.8,maxZoom:1.5,locked:false,lock(){this.locked=true},unlock(){this.locked=false}};st.invalidate=()=>{};N.busy=false;N.resetRunning=false;N.Toppings={deselect(){},select(){}};
 const H={chocolate:N.createPour(st,sf,N.POURS.chocolate),mulberry:N.createPour(st,sf,N.POURS.mulberry),smarties:N.createSmarties(st,sf)};return{st,sf,H,R:N.createReset(st,sf,H,Object.assign({seed:3,holdMs:300},cfg||{}))}}
function stroke(P,a,b,n){const e=ev(a[0],a[1]);P.claim(e);P.paint('start',e);for(let i=1;i<=n;i++){P.paint('move',ev(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n));P.frame(1/60)}P.paint('end',ev(b[0],b[1]))}
{const{H,R,sf}=setup();check('default threshold is about 90% of the paintable surface',R.cfg.maxCoverage>=.85&&R.cfg.maxCoverage<=.95,R.cfg.maxCoverage);
 stroke(H.chocolate,[110,100],[290,100],40);stroke(H.mulberry,[110,150],[290,150],40);
 for(let k=0;k<6;k++){H.smarties.claim(ev(200,60+k*30));H.smarties.paint('start',ev(200,60+k*30));run(H.smarties,2);H.smarties.paint('end',ev(200,60+k*30))}run(H.smarties,5);
 let f=0;while(f++<300){R.frame(1/60);R.after()}
 const m=R.metrics();check('lots of toppings but low coverage: NO automatic cleanup',R.state==='idle'&&m.coverage<.5&&m.candies>=60,m);
 // push the map to ~full coverage through the real handlers' coverage map
 for(let i=0;i<400;i++){const y=1-i/400*1.3,r=Math.sqrt(Math.max(0,1-y*y));for(let k=0;k<30;k++){const a=k/30*TAU;sf.cov.mark([r*Math.cos(a),y,r*Math.sin(a)],null,.1,.04)}}
 f=0;while(R.state==='idle'&&f++<10)R.frame(1/60);
 check('about full coverage: cleanup starts (hold, then run)',R.state==='holding'&&R.last.coverage>=.9,[R.state,R.last]);
 let g=0;while(R.state!=='idle'&&g++<900)R.frame(1/60);
 check('cleanup finishes, toppings and the coverage map are cleared',R.state==='idle'&&H.smarties.stats().settled===0&&H.chocolate.trails.length===0&&sf.cov.fraction()===0,R.metrics())}
// threshold is configurable and just below it nothing happens
{const{R,sf}=setup({maxCoverage:.5});const pts=[];for(let i=0;i<400;i++){const y=1-i/400*1.3,r=Math.sqrt(Math.max(0,1-y*y));for(let k=0;k<30;k++){const a=k/30*TAU;pts.push([r*Math.cos(a),y,r*Math.sin(a)])}}
 let n=0;while(sf.cov.fraction()<.45&&n<pts.length){sf.cov.mark(pts[n],null,.1,.04);n++}let f=0;while(f++<30)R.frame(1/60);check('just below a 50% threshold: idle',R.state==='idle',R.metrics());
 while(sf.cov.fraction()<.52&&n<pts.length){sf.cov.mark(pts[n],null,.1,.04);n++}f=0;while(R.state==='idle'&&f++<10)R.frame(1/60);check('above it: holding',R.state==='holding',R.metrics())}
// manual reset still works any time and clears coverage
{const{H,R,sf}=setup();stroke(H.chocolate,[110,100],[290,100],40);check('coverage > 0 after pouring',sf.cov.fraction()>0);check('manual reset accepted',R.request()===true);let g=0;while(R.state!=='idle'&&g++<900)R.frame(1/60);check('manual reset clears everything incl. coverage',R.state==='idle'&&sf.cov.fraction()===0&&H.chocolate.trails.length===0&&H.chocolate.puddles.length===0)}
console.log('PASS',ok,'FAIL',bad);

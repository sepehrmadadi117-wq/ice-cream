require('./mock.js');
// all three toppings on the same ice cream: they coexist and accumulate independently
const st=makeST(),sf=makeSF(),C=N.createPour(st,sf,N.POURS.chocolate),M=N.createPour(st,sf,N.POURS.mulberry),S=N.createSmarties(st,sf);
function stroke(P,a,b,n){const e=ev(a[0],a[1]);P.claim(e);P.paint('start',e);for(let i=1;i<=n;i++){P.paint('move',ev(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n));P.frame(1/60)}P.paint('end',ev(b[0],b[1]))}
stroke(C,[110,120],[290,120],30);stroke(M,[110,170],[290,170],30);S.claim(ev(200,52));S.paint('start',ev(200,52));
for(let i=0;i<60;i++){[C,M,S].forEach(h=>h.frame(1/60))}S.paint('end',ev(200,52));
for(let i=0;i<360;i++){[C,M,S].forEach(h=>h.frame(1/60))}
const a=[C.stats(),M.stats(),S.stats()];console.log(JSON.stringify(a));
check('all three toppings present at once',C.trails.length>=1&&M.trails.length>=1&&S.stats().settled>=3);
stroke(C,[120,200],[280,205],25);stroke(M,[120,60],[280,70],25);S.claim(ev(150,70));S.paint('start',ev(150,70));for(let i=0;i<30;i++)S.frame(1/60);S.paint('end',ev(150,70));for(let i=0;i<300;i++){[C,M,S].forEach(h=>h.frame(1/60))}
const ringsOf=P=>P.trails.reduce((n,t)=>n+t.pts.length,0);check('repeated additions accumulate for every topping',ringsOf(C)>a[0].points*.9&&C.stats().points>a[0].points&&M.stats().points>a[1].points&&S.stats().settled>a[2].settled,[C.stats(),M.stats(),S.stats()]);
C.reset();check('resetting one topping leaves the others',C.trails.length===0&&M.trails.length>=1&&S.stats().settled>0);
console.log('PASS',ok,'FAIL',bad);

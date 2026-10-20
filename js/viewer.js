/* Entry point of the 3D viewer. Loads the viewer modules only when #ice-viewer is about to scroll into view.
   Integration contract: <div id="ice-viewer" data-model="models/ice-cream.glb"> + #topping-panel + #reset-btn. */
(function(){
var N=window.NooshinViewer=window.NooshinViewer||{};
var base=((document.currentScript&&document.currentScript.src)||'js/viewer.js').replace(/viewer\.js.*$/,'viewer/');
var MODS=['bus','controls','lighting','procedural','bvh','flow','candy','model','surface','toppings','pour','smarties','reset','ui','core'];
/* Reset animation settings (change them after this script loads, or with data-max-candies / data-max-coverage / data-hold-ms on #ice-viewer):
   the sequence starts when candies >= maxCandies OR covered area fraction >= maxCoverage OR trail points >= maxTrailPoints. */
N.ResetConfig=N.ResetConfig||{maxCandies:120,maxCoverage:.1,maxTrailPoints:2500,maxTrails:80,holdMs:1400,minDuration:1.8,tilt:.26,zoomPunch:.1,turns:1};
N.loadScripts=function(urls){return Promise.all(urls.map(function(u){return new Promise(function(ok,no){var s=document.createElement('script');s.src=u;s.async=false;s.onload=ok;s.onerror=function(){no(new Error(u))};document.head.appendChild(s)})}))};
/* instant clear (no animation) - used before the cinematic reset exists or for tests */
N.resetNow=function(){if(N.stage){N.stage.controls.resetTo();N.stage.invalidate()}if(N.Toppings)N.Toppings.reset();if(N.surface)N.surface.clear()};
N.reset=function(){return N.resetSeq?N.resetSeq.request():N.resetNow()};
function start(host){
 var ui;
 /* one bundled request (see tools/build.js); falls back to the individual modules if the bundle is missing */
 N.loadScripts([base+'bundle.js']).catch(function(){return N.loadScripts(MODS.map(function(m){return base+m+'.js'}))}).then(function(){
  ui=N.buildUI(host,document.getElementById('topping-panel'),document.getElementById('reset-btn'));
  if(!window.THREE){host.dataset.state='error';ui.error('نمایش سه‌بعدی بارگذاری نشد. اتصال اینترنت را بررسی کنید.');return}
  var st=N.createStage(host);
  if(!st){host.dataset.state='error';ui.error('مرورگر شما از نمایش سه‌بعدی پشتیبانی نمی‌کند.');return}
  N.addLighting(st);ui.show('در حال بارگذاری مدل…');
  N.on('progress',function(r){ui.show('در حال بارگذاری مدل… '+String(Math.round(r*100)).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})+'٪')});
  return N.loadModel(host.dataset.model,st).then(function(r){
   st.setModel(r.root);var sf=N.Surface(st);sf.setReceivers(r.root);
   /* BVH construction (tens to hundreds of ms) runs when the browser is idle, not while the model appears */
   (window.requestIdleCallback||function(f){return setTimeout(f,250)})(function(){sf.ensure()},{timeout:3000});
   N.stage=st;N.surface=sf;st.frameFns.push(function(){return sf.refreshDynamic()});
   var H={chocolate:N.createPour(st,sf,N.POURS.chocolate),mulberry:N.createPour(st,sf,N.POURS.mulberry),smarties:N.createSmarties(st,sf)},painting=null;
   Object.keys(H).forEach(function(id){N.Toppings.register(id,H[id]);st.frameFns.push(H[id].frame)});N.handlers=H;
   var cfg={},ds=host.dataset;if(ds.maxCandies)cfg.maxCandies=+ds.maxCandies;if(ds.maxCoverage)cfg.maxCoverage=+ds.maxCoverage;if(ds.holdMs)cfg.holdMs=+ds.holdMs;
   var RS=N.resetSeq=N.createReset(st,sf,H,cfg);st.frameFns.push(RS.frame);
   N.on('reset:abort',function(){painting=null});
   st.claim=function(e){if(RS.state!=='idle')return false;var h=H[N.Toppings.active()];if(h&&h.claim(e)){painting=h;return true}return false};
   st.onPaint=function(k,e){if(painting)painting.paint(k,e);if(k==='end'){painting=null;RS.after()}st.invalidate()};
   var hint=host.querySelector('.vw-hint'),HT={chocolate:'روی بستنی بکشید تا شکلات بریزد',mulberry:'روی بستنی بکشید تا شربت توت بریزد',smarties:'روی بستنی بزنید یا نگه دارید تا اسمارتیز بریزد'};
   N.on('reset:state',function(e){host.dataset.reset=e.state;if(hint)hint.textContent=e.state==='holding'?'بستنی شما آماده شد!':e.state==='running'?'در حال پاک‌سازی…':'برای چرخاندن بکشید'});
   N.on('toppings:changed',function(){var a=N.Toppings.active();host.dataset.paint=a?'on':'off';if(N.busy)return;if(hint)hint.textContent=a?HT[a]+' — برای چرخاندن، بیرون از بستنی بکشید':'برای چرخاندن بکشید'});
   host.dataset.state='ready';host.dataset.source=r.info.source;ui.hide();
   if(/[?&]debug/.test(location.search))N.report(r.info)})
 }).catch(function(e){console.error(e);host.dataset.state='error';ui&&ui.error('بارگذاری نمایشگر سه‌بعدی با مشکل مواجه شد.')})}
N.init=function(){
 var host=document.getElementById('ice-viewer');if(!host||host.dataset.state)return;host.dataset.state='loading';
 if(!('IntersectionObserver' in window)){start(host);return}
 var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){io.disconnect();start(host)}},{rootMargin:'400px'});io.observe(host)};
})();

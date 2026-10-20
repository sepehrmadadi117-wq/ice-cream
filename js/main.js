(function(){
var d=document,$=function(s){return d.querySelector(s)};
d.documentElement.classList.add('js');
var V={scoop:'0 0 100 100',cherry:'0 0 60 70',berry:'0 0 50 50',straw:'0 0 60 70',rasp:'0 0 50 50',nut:'0 0 60 70',choc:'0 0 60 50'};
d.body.insertAdjacentHTML('afterbegin','<svg width="0" height="0" style="position:absolute"><defs>'+
'<radialGradient id="gHi" cx=".4" cy=".35" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
'<linearGradient id="gSh" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#3a1c10" stop-opacity="0"/><stop offset="1" stop-color="#3a1c10" stop-opacity=".42"/></linearGradient>'+
'<radialGradient id="gSt" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ff6a5c"/><stop offset=".6" stop-color="#d81f2f"/><stop offset="1" stop-color="#8e0f1f"/></radialGradient>'+
'<radialGradient id="gCh" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff4a5c"/><stop offset=".55" stop-color="#b3112b"/><stop offset="1" stop-color="#5e0614"/></radialGradient>'+
'<radialGradient id="gRa" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ff5a7a"/><stop offset="1" stop-color="#a50e3a"/></radialGradient>'+
'<linearGradient id="gAl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2b583"/><stop offset="1" stop-color="#9a6234"/></linearGradient>'+
'<linearGradient id="gCo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4630"/><stop offset="1" stop-color="#2e170f"/></linearGradient>'+
'<linearGradient id="gWf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efc283"/><stop offset="1" stop-color="#b9803d"/></linearGradient>'+
'<path id="pS" d="M8 58a42 42 0 0 1 84 0c0 4-4 8-8 8-5 0-6 8-12 8s-7-10-12-10-6 12-12 12-7-12-12-12-7 8-13 8-7-6-12-6c-5 0-5-8-5-8z"/><clipPath id="cp"><path d="M8 0h84L50 140z"/></clipPath>'+
'<symbol id="scoop" viewBox="0 0 100 100"><use href="#pS" fill="currentColor"/><use href="#pS" fill="url(#gSh)"/><ellipse cx="36" cy="34" rx="18" ry="11" fill="url(#gHi)" transform="rotate(-28 36 34)"/></symbol>'+
'<symbol id="cone" viewBox="0 0 100 140"><path d="M8 0h84L50 140z" fill="url(#gWf)"/><g clip-path="url(#cp)" stroke="#8a5a26" stroke-opacity=".55" stroke-width="2.4"><path d="M-20 0l140 140M-20 40l100 100M-20 80l60 60M120 0L-20 140M120 40L20 140M120 80L60 140"/></g></symbol>'+
'<symbol id="cherry" viewBox="0 0 60 70"><path d="M30 0Q40 20 44 38M30 0Q22 25 16 42" stroke="#5a7a3a" stroke-width="3" fill="none"/><circle cx="16" cy="52" r="14" fill="url(#gCh)"/><circle cx="44" cy="54" r="14" fill="url(#gCh)"/><ellipse cx="11" cy="46" rx="4" ry="2.5" fill="#fff" opacity=".7"/><ellipse cx="39" cy="48" rx="4" ry="2.5" fill="#fff" opacity=".7"/></symbol>'+
'<symbol id="berry" viewBox="0 0 50 50"><circle cx="25" cy="25" r="23" fill="currentColor"/><circle cx="25" cy="25" r="23" fill="url(#gSh)"/><circle cx="25" cy="25" r="23" fill="url(#gHi)" opacity=".55"/><path d="M25 12l4 6-4 3-4-3z" fill="#141436" opacity=".7"/></symbol>'+
'<symbol id="straw" viewBox="0 0 60 70"><path d="M6 22Q30 6 54 22Q50 52 30 68Q10 52 6 22z" fill="url(#gSt)"/><path d="M16 12l14 10 14-10-5 14H22z" fill="#3f8f3a"/><g fill="#ffe7a8"><ellipse cx="20" cy="32" rx="1.6" ry="2.4"/><ellipse cx="38" cy="30" rx="1.6" ry="2.4"/><ellipse cx="30" cy="42" rx="1.6" ry="2.4"/><ellipse cx="22" cy="52" rx="1.6" ry="2.4"/><ellipse cx="38" cy="50" rx="1.6" ry="2.4"/><ellipse cx="28" cy="30" rx="1.6" ry="2.4"/></g><ellipse cx="20" cy="26" rx="8" ry="5" fill="url(#gHi)" transform="rotate(-30 20 26)"/></symbol>'+
'<symbol id="rasp" viewBox="0 0 50 50"><g fill="url(#gRa)" stroke="#7d0a2c" stroke-width=".6"><circle cx="25" cy="14" r="8"/><circle cx="15" cy="19" r="8"/><circle cx="35" cy="19" r="8"/><circle cx="11" cy="30" r="8"/><circle cx="25" cy="26" r="8"/><circle cx="39" cy="30" r="8"/><circle cx="17" cy="38" r="8"/><circle cx="33" cy="38" r="8"/><circle cx="25" cy="44" r="6"/></g><path d="M18 8l7 4 7-4-5-5z" fill="#4a8a3a"/></symbol>'+
'<symbol id="nut" viewBox="0 0 60 70"><path d="M30 2C48 14 56 40 30 68 4 40 12 14 30 2z" fill="url(#gAl)"/><path d="M30 8C34 30 32 48 30 62" stroke="#7a4a22" stroke-opacity=".5" stroke-width="2" fill="none"/><ellipse cx="22" cy="26" rx="5" ry="12" fill="url(#gHi)" opacity=".6"/></symbol>'+
'<symbol id="choc" viewBox="0 0 60 50"><polygon points="6,14 30,4 54,12 56,36 34,46 8,40" fill="url(#gCo)"/><polygon points="30,4 54,12 34,22" fill="#9a6246" opacity=".6"/><polygon points="6,14 30,4 34,22 8,40" fill="#fff" opacity=".07"/></symbol></defs></svg>');
function cone(c){return '<div class="cn"><svg class="sc" style="color:'+c+'"><use href="#scoop"/></svg><svg class="co"><use href="#cone"/></svg></div>'}
function card(i){return '<article class="card glass rv"><img class="ph" src="img/cards/'+i[3]+'.webp" alt="">'+'<h3>'+i[0]+'</h3><p>'+i[1]+'</p></article>'}
var page=location.pathname.split('/').pop()||'index.html',N=[['index.html','خانه'],['menu.html','منو'],['services.html','خدمات'],['#contact','تماس']];
d.body.insertAdjacentHTML('afterbegin','<header><nav class="nav glass"><a class="logo" href="index.html">بستنی نوشین</a><div class="links" id="links">'+
N.map(function(n){return '<a href="'+n[0]+'"'+(n[0]==page?' aria-current="page"':'')+'>'+n[1]+'</a>'}).join('')+
'</div><button class="burger" aria-label="باز کردن منو" aria-expanded="false">☰</button></nav></header>');
var b=$('.burger'),L=$('#links');
function setMenu(o){L.classList.toggle('open',o);b.setAttribute('aria-expanded',o)}
b.onclick=function(){setMenu(!L.classList.contains('open'))};
L.onclick=function(){setMenu(false)};
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&L.classList.contains('open')){setMenu(false);b.focus()}});
d.addEventListener('pointerdown',function(e){if(L.classList.contains('open')&&!e.target.closest('.nav'))setMenu(false)});
var m=$('#menu-root');
if(m)m.innerHTML=MENU.map(function(c){return '<span class="kick rv">'+c.e+'</span><h2 class="rv">'+c.t+'</h2><div class="grid">'+c.i.map(card).join('')+'</div>'}).join('');
var f=$('#feat-root');
if(f)f.innerHTML=[MENU[1].i[0],MENU[0].i[2],MENU[0].i[1]].map(card).join('');
['#serv-root','#serv-prev'].forEach(function(s){var e=$(s);if(e)e.innerHTML=SERV.map(card).join('')});
var c=$('#contact');
if(c)c.outerHTML='<section class="choc" id="contact"><i class="fl" data-f="berry" data-s=".1" data-r="0" style="top:12%;left:4%;width:60px;color:#4a5bd6"></i><i class="fl" data-f="cherry" data-s=".16" data-r="-10" style="bottom:10%;right:5%;width:70px"></i><i class="fl far hm" data-f="choc" data-s=".2" data-r="20" style="top:20%;right:12%;width:90px"></i><i class="fl hm" data-f="rasp" data-s=".12" data-r="0" style="bottom:18%;left:9%;width:64px"></i><div class="wrap"><span class="kick">Contact</span><h2 class="rv">تماس و روابط عمومی</h2><p class="lead rv">برای همکاری، پیشنهاد و ارتباط رسانه‌ای با ما در تماس باشید.</p><div class="grid"><div class="contact-item glass rv">اینستاگرام<bdi dir="ltr">@nooshin.icecream</bdi></div><div class="contact-item glass rv">اینستاگرام دسر<bdi dir="ltr">@nooshin_dessert</bdi></div><div class="contact-item glass rv">ایمیل<bdi dir="ltr">hello@nooshin.example</bdi></div></div></div></section><footer>© ۱۴۰۵ بستنی نوشین. تمامی حقوق محفوظ است.</footer>';
d.querySelectorAll('.fl').forEach(function(e){var k=e.dataset.i||e.dataset.f,col=e.style.color;
if(k=='scoop')k=(col=='rgb(238, 149, 176)')?'scoopberry':'scoopvan';
if(k=='berry')k='cherries';
var im=new Image();im.alt='';im.decoding='async';im.loading='lazy';im.src='img/floaters/'+k+'.webp';
im.onerror=function(){e.innerHTML='<svg viewBox="'+V[e.dataset.f]+'"'+(col?' style="color:'+col+'"':'')+'><use href="#'+e.dataset.f+'"/></svg>'};
e.appendChild(im)});
d.querySelectorAll('[data-wave]').forEach(function(s){s.style.setProperty('--w','var(--'+s.dataset.wave+')');s.insertAdjacentHTML('beforeend','<div class="wave"><svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path fill="currentColor" d="M0 60V30C120 0 240 0 360 24S600 54 720 30 960 0 1080 24 1320 50 1440 20V60Z"/></svg></div>')});
var rv=d.querySelectorAll('.rv');
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});rv.forEach(function(e){io.observe(e)})}
else rv.forEach(function(e){e.classList.add('in')});
/* parallax: only floaters whose section is on screen are moved, and each section is measured once per frame */
var groups=[],fl=[].slice.call(d.querySelectorAll('.fl')),t=0;
fl.forEach(function(e){var p=e.parentElement,g=null;for(var i=0;i<groups.length;i++)if(groups[i].el===p)g=groups[i];if(!g){g={el:p,items:[],vis:false};groups.push(g)}g.items.push(e)});
function u(){t=0;var h=innerHeight/2;groups.forEach(function(g){if(!g.vis)return;var r=g.el.getBoundingClientRect(),c=r.top+r.height/2-h;g.items.forEach(function(e){e.style.transform='translate3d(0,'+(c*-(e.dataset.s||.1))+'px,0) rotate('+(e.dataset.r||0)+'deg)'})})}
if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&'IntersectionObserver' in window){
 var pio=new IntersectionObserver(function(es){es.forEach(function(e){groups.forEach(function(g){if(g.el===e.target)g.vis=e.isIntersecting});});if(!t)t=requestAnimationFrame(u)},{rootMargin:'200px'});
 groups.forEach(function(g){pio.observe(g.el)});
 addEventListener('scroll',function(){if(!t)t=requestAnimationFrame(u)},{passive:true});addEventListener('resize',function(){if(!t)t=requestAnimationFrame(u)})}
if(window.NooshinViewer&&NooshinViewer.init)NooshinViewer.init();
})();

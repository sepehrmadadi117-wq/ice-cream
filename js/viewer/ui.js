/* Persian UI: topping buttons, reset button, loading / error status. */
(function(N){
N.buildUI=function(host,panel,reset){
 var status=host.querySelector('.vw-status'),msg=status&&status.querySelector('p');
 function draw(){
  if(reset)reset.disabled=!!N.resetRunning;
  if(!panel)return;[].slice.call(panel.querySelectorAll('.chip')).forEach(function(c){c.remove()});
  N.Toppings.defs.forEach(function(d){var b=document.createElement('button');b.type='button';b.className='chip';b.dataset.id=d.id;b.textContent=d.label;
   b.disabled=!d.enabled||!!N.busy;b.setAttribute('aria-pressed',N.Toppings.active()===d.id);if(!d.enabled)b.title='به‌زودی فعال می‌شود';
   b.onclick=function(){N.Toppings.select(d.id)};panel.appendChild(b)})}
 draw();N.on('toppings:changed',draw);
 if(reset){reset.textContent='از نو شروع کن';reset.disabled=!!N.resetRunning;reset.onclick=function(){N.reset&&N.reset()}}
 return{
  show:function(t){if(status){status.hidden=false;status.classList.remove('err');if(msg)msg.textContent=t}},
  hide:function(){if(status)status.hidden=true},
  error:function(t){if(status){status.hidden=false;status.classList.add('err');if(msg)msg.textContent=t}}}};
})(window.NooshinViewer=window.NooshinViewer||{});

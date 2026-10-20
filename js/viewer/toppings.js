/* Topping registry. Stage 3 plugs in behaviour with Toppings.register(id,{apply(hit,ctx),reset()}); until then the
   three Persian controls stay disabled. */
(function(N){
var defs=[{id:'chocolate',label:'شکلات',enabled:false},{id:'mulberry',label:'شربت توت',enabled:false},{id:'smarties',label:'اسمارتیز',enabled:false}],
 handlers={},active=null;
N.Toppings={defs:defs,
 register:function(id,h){handlers[id]=h;defs.forEach(function(d){if(d.id===id)d.enabled=true});N.emit('toppings:changed')},
 deselect:function(){if(active){active=null;N.emit('toppings:changed')}},
 select:function(id){if(N.busy)return;var d=defs.filter(function(x){return x.id===id})[0];if(!d||!d.enabled)return;active=active===id?null:id;N.emit('toppings:changed')},
 active:function(){return active},
 apply:function(hit,ctx){var h=active&&handlers[active];if(h&&h.apply)h.apply(hit,ctx)},
 reset:function(){Object.keys(handlers).forEach(function(k){handlers[k].reset&&handlers[k].reset()});active=null;N.emit('toppings:changed')}};
})(window.NooshinViewer=window.NooshinViewer||{});

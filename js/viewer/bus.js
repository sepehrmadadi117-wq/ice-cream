/* Tiny event bus + shared namespace for the 3D viewer modules. */
(function(N){var h={};
N.on=function(e,f){(h[e]=h[e]||[]).push(f)};
N.off=function(e,f){h[e]=(h[e]||[]).filter(function(x){return x!==f})};
N.emit=function(e,d){(h[e]||[]).slice().forEach(function(f){f(d)})};
})(window.NooshinViewer=window.NooshinViewer||{});

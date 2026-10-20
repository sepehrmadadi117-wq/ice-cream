/* Math helpers for pours (no Three.js): bead-shaped ribbon rings that sit on the surface, and downhill flow direction. */
(function(N){
var V=N.V={
 sub:function(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]},add:function(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]]},
 mul:function(a,k){return[a[0]*k,a[1]*k,a[2]*k]},dot:function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]},
 cross:function(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]},
 len:function(a){return Math.hypot(a[0],a[1],a[2])},norm:function(a){var l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}};
/* direction of travel along the surface, perpendicular to n; falls back to lastT when the points coincide */
N.tangentOn=function(p,prev,n,lastT){var d=V.sub(p,prev);d=V.sub(d,V.mul(n,V.dot(d,n)));var l=V.len(d);return l<1e-7?(lastT||[1,0,0]):V.mul(d,1/l)};
/* writes ring k (R vertices: a half-ellipse bead of width w, height h on top of the surface) into pos/nrm */
N.ringWrite=function(pos,nrm,k,R,p,n,t,w,h,sink){
 var s=V.norm(V.cross(n,t)),a=w/2,o=k*R*3;
 for(var i=0;i<R;i++){var th=Math.PI*i/(R-1),c=Math.cos(th),sn=Math.sin(th),edge=(i===0||i===R-1),y=h*sn-(edge?sink:0);
  var q=o+i*3;pos[q]=p[0]+s[0]*a*c+n[0]*y;pos[q+1]=p[1]+s[1]*a*c+n[1]*y;pos[q+2]=p[2]+s[2]*a*c+n[2]*y;
  var nx=s[0]*h*c+n[0]*a*sn,ny=s[1]*h*c+n[1]*a*sn,nz=s[2]*h*c+n[2]*a*sn,l=Math.hypot(nx,ny,nz)||1;
  nx=nx/l+n[0]*.3;ny=ny/l+n[1]*.3;nz=nz/l+n[2]*.3;l=Math.hypot(nx,ny,nz)||1;nrm[q]=nx/l;nrm[q+1]=ny/l;nrm[q+2]=nz/l}};
N.fillIndex=function(idx,R,maxPts){var o=0;
 for(var k=0;k<maxPts-1;k++)for(var i=0;i<R-1;i++){var a=k*R+i,b=a+1,c=(k+1)*R+i,d=c+1;idx[o++]=a;idx[o++]=b;idx[o++]=c;idx[o++]=b;idx[o++]=d;idx[o++]=c}};
/* unit gravity g (in model space) projected on the surface plane: {d: downhill direction, s: sin(slope)} */
N.downhill=function(n,g){var d=V.sub(g,V.mul(n,V.dot(g,n))),l=V.len(d);return{d:l>1e-9?V.mul(d,1/l):[0,0,0],s:l}};
})(window.NooshinViewer=window.NooshinViewer||{});

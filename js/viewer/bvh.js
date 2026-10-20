/* Static triangle BVH (no Three.js dependency): fast ray casts and closest-point queries on the model surface.
   Used for picking, pouring trails, syrup running downhill and candy collisions. */
(function(N){
function sel(tri,cen,ax,lo,hi,k){
 while(hi>lo){var pv=cen[tri[(lo+hi)>>1]*3+ax],i=lo,j=hi;
  while(i<=j){while(cen[tri[i]*3+ax]<pv)i++;while(cen[tri[j]*3+ax]>pv)j--;if(i<=j){var t=tri[i];tri[i]=tri[j];tri[j]=t;i++;j--}}
  if(k<=j)hi=j;else if(k>=i)lo=i;else break}}
function cpt(px,py,pz,ax,ay,az,bx,by,bz,cx,cy,cz,o){
 var abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az,apx=px-ax,apy=py-ay,apz=pz-az;
 var d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;if(d1<=0&&d2<=0){o[0]=1;o[1]=0;o[2]=0;return}
 var bpx=px-bx,bpy=py-by,bpz=pz-bz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;if(d3>=0&&d4<=d3){o[0]=0;o[1]=1;o[2]=0;return}
 var vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){var v=d1/(d1-d3);o[0]=1-v;o[1]=v;o[2]=0;return}
 var cpx=px-cx,cpy=py-cy,cpz=pz-cz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;if(d6>=0&&d5<=d6){o[0]=0;o[1]=0;o[2]=1;return}
 var vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){var w=d2/(d2-d6);o[0]=1-w;o[1]=0;o[2]=w;return}
 var va=d3*d6-d5*d4;if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){var w2=(d4-d3)/((d4-d3)+(d5-d6));o[0]=0;o[1]=1-w2;o[2]=w2;return}
 var dn=1/(va+vb+vc),v2=vb*dn,w3=vc*dn;o[0]=1-v2-w3;o[1]=v2;o[2]=w3}
N.BVH=function(pos,idx,nrm){
 var s=this,nt=idx?(idx.length/3|0):(pos.length/9|0);s.pos=pos;s.idx=idx;s.nrm=nrm||null;s.nt=nt;
 function I(t,k){return idx?idx[t*3+k]:t*3+k}
 var tri=new Uint32Array(nt),cen=new Float32Array(nt*3),bb=new Float32Array(nt*6),a;
 for(var t=0;t<nt;t++){tri[t]=t;var mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];
  for(var k=0;k<3;k++){var v=I(t,k)*3;for(a=0;a<3;a++){var x=pos[v+a];if(x<mn[a])mn[a]=x;if(x>mx[a])mx[a]=x}}
  for(a=0;a<3;a++){cen[t*3+a]=(mn[a]+mx[a])/2;bb[t*6+a]=mn[a];bb[t*6+3+a]=mx[a]}}
 var nb=[],nl=[],nr=[],ns=[],nc=[];
 function build(s0,e0){var id=nl.length,mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30],cn=[1e30,1e30,1e30],cx=[-1e30,-1e30,-1e30],i,a;
  nl.push(-1);nr.push(-1);ns.push(s0);nc.push(e0-s0);
  for(i=s0;i<e0;i++){var t=tri[i];for(a=0;a<3;a++){mn[a]=Math.min(mn[a],bb[t*6+a]);mx[a]=Math.max(mx[a],bb[t*6+3+a]);cn[a]=Math.min(cn[a],cen[t*3+a]);cx[a]=Math.max(cx[a],cen[t*3+a])}}
  nb.push(mn[0],mn[1],mn[2],mx[0],mx[1],mx[2]);
  if(e0-s0<=6)return id;
  var ax=0,ex=cx[0]-cn[0];if(cx[1]-cn[1]>ex){ax=1;ex=cx[1]-cn[1]}if(cx[2]-cn[2]>ex){ax=2}
  var mid=(s0+e0)>>1;sel(tri,cen,ax,s0,e0-1,mid);
  nl[id]=build(s0,mid);nr[id]=build(mid,e0);nc[id]=0;return id}
 if(nt)build(0,nt);
 s.raycast=function(ox,oy,oz,dx,dy,dz,tmax){
  if(!nt)return null;
  var best=tmax===undefined?1e30:tmax,hit=null,stk=[0],ix=1/dx,iy=1/dy,iz=1/dz;
  while(stk.length){var n=stk.pop(),b=n*6,t1=(nb[b]-ox)*ix,t2=(nb[b+3]-ox)*ix,tn=Math.min(t1,t2),tf=Math.max(t1,t2);
   t1=(nb[b+1]-oy)*iy;t2=(nb[b+4]-oy)*iy;tn=Math.max(tn,Math.min(t1,t2));tf=Math.min(tf,Math.max(t1,t2));
   t1=(nb[b+2]-oz)*iz;t2=(nb[b+5]-oz)*iz;tn=Math.max(tn,Math.min(t1,t2));tf=Math.min(tf,Math.max(t1,t2));
   if(tf<0||tn>tf||tn>best)continue;
   if(nl[n]<0){for(var i=ns[n],e=ns[n]+nc[n];i<e;i++){var tt=tri[i],p0=I(tt,0)*3,p1=I(tt,1)*3,p2=I(tt,2)*3,
     e1x=pos[p1]-pos[p0],e1y=pos[p1+1]-pos[p0+1],e1z=pos[p1+2]-pos[p0+2],e2x=pos[p2]-pos[p0],e2y=pos[p2+1]-pos[p0+1],e2z=pos[p2+2]-pos[p0+2],
     px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-14)continue;
     var inv=1/det,tx=ox-pos[p0],ty=oy-pos[p0+1],tz=oz-pos[p0+2],u=(tx*px+ty*py+tz*pz)*inv;if(u<0||u>1)continue;
     var qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(dx*qx+dy*qy+dz*qz)*inv;if(v<0||u+v>1)continue;
     var t=(e2x*qx+e2y*qy+e2z*qz)*inv;if(t>1e-7&&t<best){best=t;hit={t:t,tri:tt,b0:1-u-v,b1:u,b2:v}}}}
   else{stk.push(nr[n]);stk.push(nl[n])}}
  return hit};
 s.closest=function(px,py,pz,maxD){
  if(!nt)return null;
  var best=maxD===undefined?1e15:maxD*maxD,res=null,stk=[0],o=[0,0,0];
  while(stk.length){var n=stk.pop(),b=n*6,dx=Math.max(nb[b]-px,0,px-nb[b+3]),dy=Math.max(nb[b+1]-py,0,py-nb[b+4]),dz=Math.max(nb[b+2]-pz,0,pz-nb[b+5]);
   if(dx*dx+dy*dy+dz*dz>best)continue;
   if(nl[n]<0){for(var i=ns[n],e=ns[n]+nc[n];i<e;i++){var t=tri[i],p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3;
     cpt(px,py,pz,pos[p0],pos[p0+1],pos[p0+2],pos[p1],pos[p1+1],pos[p1+2],pos[p2],pos[p2+1],pos[p2+2],o);
     var x=o[0]*pos[p0]+o[1]*pos[p1]+o[2]*pos[p2]-px,y=o[0]*pos[p0+1]+o[1]*pos[p1+1]+o[2]*pos[p2+1]-py,z=o[0]*pos[p0+2]+o[1]*pos[p1+2]+o[2]*pos[p2+2]-pz,d2=x*x+y*y+z*z;
     if(d2<best){best=d2;res={tri:t,b0:o[0],b1:o[1],b2:o[2]}}}}
   else{stk.push(nr[n]);stk.push(nl[n])}}
  if(res){var q=s.pointAt(res.tri,res.b0,res.b1,res.b2);res.x=q[0];res.y=q[1];res.z=q[2];res.d=Math.sqrt(best)}
  return res};
 s.area=function(){var a=0;for(var t=0;t<nt;t++){var p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3,ax=pos[p1]-pos[p0],ay=pos[p1+1]-pos[p0+1],az=pos[p1+2]-pos[p0+2],bx=pos[p2]-pos[p0],by=pos[p2+1]-pos[p0+1],bz=pos[p2+2]-pos[p0+2];
   a+=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)/2}return a};
 s.pointAt=function(t,b0,b1,b2){var p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3;
  return[b0*pos[p0]+b1*pos[p1]+b2*pos[p2],b0*pos[p0+1]+b1*pos[p1+1]+b2*pos[p2+1],b0*pos[p0+2]+b1*pos[p1+2]+b2*pos[p2+2]]};
 s.normalAt=function(t,b0,b1,b2){var p0=I(t,0)*3,p1=I(t,1)*3,p2=I(t,2)*3,x,y,z,l;
  if(nrm){x=b0*nrm[p0]+b1*nrm[p1]+b2*nrm[p2];y=b0*nrm[p0+1]+b1*nrm[p1+1]+b2*nrm[p2+1];z=b0*nrm[p0+2]+b1*nrm[p1+2]+b2*nrm[p2+2]}
  else{var ax=pos[p1]-pos[p0],ay=pos[p1+1]-pos[p0+1],az=pos[p1+2]-pos[p0+2],bx=pos[p2]-pos[p0],by=pos[p2+1]-pos[p0+1],bz=pos[p2+2]-pos[p0+2];
   x=ay*bz-az*by;y=az*bx-ax*bz;z=ax*by-ay*bx}
  l=Math.hypot(x,y,z)||1;return[x/l,y/l,z/l]};
};
})(window.NooshinViewer=window.NooshinViewer||{});

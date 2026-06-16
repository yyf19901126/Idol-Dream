/* ============ 高清立绘图片加载器（游戏与设计页共用） ============
   用户把每个形态的立绘 PNG 放进 play/art/，在 KEYART_SRC 里按「形态码」登记：
     ''(原点)→'_' ｜ 改造①='L'/'H' ｜ ②='LS'/'LD'/'HS'/'HD' ｜ ③=三字 ｜ ④=四字 ｜ ⑤(终态)=五字(如'LSCYP')
   加载时自动：去白底（边缘 flood-fill + 去封闭白块）+ 紧裁；并按 KEYART_CHIBI 裁出「头」给 Q版当大头。 */
const KEYART_SRC={'_':'art/keyart/uncle.png'};      // 立绘都在 art/keyart/，自动登记全部 63 形态码
(function(){
  for(const a of ['L','H']){KEYART_SRC[a]='art/keyart/'+a+'.png';
    for(const b of ['S','D']){KEYART_SRC[a+b]='art/keyart/'+a+b+'.png';
      for(const c of ['C','B']){KEYART_SRC[a+b+c]='art/keyart/'+a+b+c+'.png';
        for(const d of ['Y','N']){KEYART_SRC[a+b+c+d]='art/keyart/'+a+b+c+d+'.png';
          for(const e of ['P','T'])KEYART_SRC[a+b+c+d+e]='art/keyart/'+a+b+c+d+e+'.png';}}}}
})();
const KEYART={};                            // 形态码 → 去底紧裁后的高清立绘 canvas（平滑缩放，直接用 PNG）
const KEYART_HEAD={};                        // 形态码 → 给 Q版当大头的「头」（当前未启用：操作角色用程序化形象）
const KEYART_CHIBI={};                       // 留空：Q版统一用程序化形象，立绘只驱动左上立绘窗
const KEYART_PX=512;                          // 仅为控内存做平滑降采样到 512px 高（立绘窗实际只显示 ~280px），不像素化
function cropHead(src,ratio){
  const W=src.width,hh0=Math.round(src.height*ratio);
  const t=document.createElement('canvas');t.width=W;t.height=hh0;
  const g=t.getContext('2d');g.drawImage(src,0,0,W,hh0,0,0,W,hh0);
  const d=g.getImageData(0,0,W,hh0).data;
  let minX=W,minY=hh0,maxX=0,maxY=0;
  for(let y=0;y<hh0;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>24){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  if(maxX<minX)return{cv:t,w:W,h:hh0};
  const bw=maxX-minX+1,bh=maxY-minY+1,cc=document.createElement('canvas');cc.width=bw;cc.height=bh;
  cc.getContext('2d').drawImage(t,minX,minY,bw,bh,0,0,bw,bh);
  return{cv:cc,w:bw,h:bh};
}
function keyWhite(img){
  const W=img.width,H=img.height;
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d');g.drawImage(img,0,0);
  const id=g.getImageData(0,0,W,H),d=id.data;
  /* 若本身已是透明背景 PNG（四角透明）→ 跳过去白底；否则按白底图处理 */
  const cor=[0,(W-1)*4,((H-1)*W)*4,((H-1)*W+W-1)*4];
  const transBg=cor.filter(i=>d[i+3]<24).length>=2;
  if(!transBg){
    const isW=i=>{const r=d[i],gg=d[i+1],b=d[i+2];return r>228&&gg>228&&b>228&&Math.max(r,gg,b)-Math.min(r,gg,b)<18;};
    const vis=new Uint8Array(W*H),st=[];
    for(let x=0;x<W;x++){st.push(x,(H-1)*W+x);}
    for(let y=0;y<H;y++){st.push(y*W,y*W+W-1);}
    while(st.length){const p=st.pop();if(vis[p])continue;vis[p]=1;const i=p*4;if(!isW(i))continue;d[i+3]=0;
      const px=p%W,py=(p/W)|0;if(px>0)st.push(p-1);if(px<W-1)st.push(p+1);if(py>0)st.push(p-W);if(py<H-1)st.push(p+W);}
    /* 二次：去掉被身体包住的内嵌白色背景（只清较大封闭白区，保留衣服高光） */
    const isW2=i=>{const r=d[i],gg=d[i+1],b=d[i+2];return d[i+3]>0&&r>222&&gg>222&&b>222&&Math.max(r,gg,b)-Math.min(r,gg,b)<24;};
    const seen=new Uint8Array(W*H);
    for(let s=0;s<W*H;s++){
      if(seen[s]||!isW2(s*4))continue;
      const comp=[s];seen[s]=1;let qi=0;
      while(qi<comp.length){const p=comp[qi++],px=p%W,py=(p/W)|0;
        if(px>0&&!seen[p-1]&&isW2((p-1)*4)){seen[p-1]=1;comp.push(p-1);}
        if(px<W-1&&!seen[p+1]&&isW2((p+1)*4)){seen[p+1]=1;comp.push(p+1);}
        if(py>0&&!seen[p-W]&&isW2((p-W)*4)){seen[p-W]=1;comp.push(p-W);}
        if(py<H-1&&!seen[p+W]&&isW2((p+W)*4)){seen[p+W]=1;comp.push(p+W);}}
      if(comp.length>600)comp.forEach(p=>{d[p*4+3]=0;});
    }
  }
  g.putImageData(id,0,0);
  let minX=W,minY=H,maxX=0,maxY=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>24){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  if(maxX<minX)return c;
  const bw=maxX-minX+1,bh=maxY-minY+1,cc=document.createElement('canvas');cc.width=bw;cc.height=bh;
  cc.getContext('2d').drawImage(c,minX,minY,bw,bh,0,0,bw,bh);
  return cc;
}
function pixelize(src,targetH){            // 降采样到 targetH 像素高（绘制时再最近邻放大→块状像素）
  if(!targetH||src.height<=targetH)return src;
  const w=Math.max(1,Math.round(src.width*targetH/src.height));
  const c=document.createElement('canvas');c.width=w;c.height=targetH;
  const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(src,0,0,w,targetH);
  return c;
}
/* 清噪：去掉透明区残留的浅 alpha 与漂浮小碎块（根治背景白点），保留主体与相连特效 */
function cleanAlpha(cv,cutoff,minSpeck){
  const W=cv.width,H=cv.height,g=cv.getContext('2d');
  const id=g.getImageData(0,0,W,H),d=id.data;
  for(let i=3;i<d.length;i+=4) if(d[i]<cutoff) d[i]=0;        // 低 alpha 直接归零（硬化边缘+去浅噪）
  const lab=new Int32Array(W*H).fill(-1);
  for(let s=0;s<W*H;s++){
    if(lab[s]>=0||d[s*4+3]===0)continue;
    const q=[s],px=[s];lab[s]=s;let qi=0;
    while(qi<q.length){const p=q[qi++],x=p%W,y=(p/W)|0;
      const nb=[x>0?p-1:-1,x<W-1?p+1:-1,y>0?p-W:-1,y<H-1?p+W:-1];
      for(const np of nb) if(np>=0&&lab[np]<0&&d[np*4+3]>0){lab[np]=s;q.push(np);px.push(np);}}
    if(px.length<minSpeck) for(const p of px) d[p*4+3]=0;     // 小碎块（噪点/散落星点）清掉
  }
  g.putImageData(id,0,0);
}
function loadKeyart(onEach){for(const code in KEYART_SRC){const im=new Image();im.onload=()=>{try{
  KEYART[code]=pixelize(keyWhite(im),KEYART_PX);   // 紧裁/去底（透明 PNG 自动跳过抠白）+ 平滑降采样控内存；不像素化
  cleanAlpha(KEYART[code],12,4);                    // 极轻清噪（绿幕已抠干净）；保住抗锯齿软边
  const cfg=KEYART_CHIBI[code];
  if(cfg&&cfg.head){KEYART_HEAD[code]=cropHead(KEYART[code],cfg.head);if(typeof CHIBI!=='undefined')delete CHIBI[code];}
  if(onEach)onEach(code);
}catch(e){console.warn('keyart',code,e);}};im.src=KEYART_SRC[code];}}

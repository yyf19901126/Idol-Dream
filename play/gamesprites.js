/* ============ 游戏精灵 ============
   复用 character-design 的 engine/hair/parts/data（px/ramp/finish/drawCharacter/S3/BASEMAP/F32 全局可用） */

/* 任意尺寸的描边+霓虹轮廓光（engine.finish 固定 64×92，这里通用化） */
function finishAny(layer){
  const w=layer.width,h=layer.height,g=layer.getContext('2d');
  const id=g.getImageData(0,0,w,h),d=id.data;
  const al=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++)al[i]=d[i*4+3]>40?1:0;
  const A=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:al[y*w+x];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(!A(x,y))continue;const i=(y*w+x)*4;
    if(!A(x-1,y)){d[i]=(d[i]+110)/2.1|0;d[i+1]=(d[i+1]+258)/2.1|0;d[i+2]=(d[i+2]+280)/2.1|0;}
    else if(!A(x+1,y)){d[i]=(d[i]*1.6+255)/2.6|0;d[i+1]=(d[i+1]*1.6+100)/2.6|0;d[i+2]=(d[i+2]*1.6+215)/2.6|0;}
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(A(x,y))continue;
    if(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1)){const i=(y*w+x)*4;d[i]=24;d[i+1]=17;d[i+2]=33;d[i+3]=255;}
  }
  g.putImageData(id,0,0);
}
function espr(w,h,fn){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  fn(c.getContext('2d'));finishAny(c);return c;
}

/* ---------- 主角形态 ---------- */
function playerForm(mods){
  const n=mods.length;
  if(n===0)return{name:'阿源（原点）',spec:{kind:'fat',sweat:1}};
  if(n===1){
    return mods[0]==='L'
      ?{name:'瘦身大叔',spec:{kind:'slim'}}
      :{name:'猛男大叔',spec:{kind:'buff'}};
  }
  if(n===2){
    const L=mods[0]==='L';
    if(mods[1]==='S')return{name:L?'萝莉音大叔':'甜嗓猛男',
      spec:{kind:L?'slim':'buff',top:'#ffd2e4',star:1,heart:1,band:1,smile:1}};
    return{name:L?'烟嗓小钢炮':'低音猛男',
      spec:{kind:L?'slim':'buff',top:L?'#4a4452':'#3a3640',jacket:1,shade:1}};
  }
  if(n===3){
    const k=mods.slice(0,3).join('');
    const r=S3.find(x=>x[0]===k);
    return{name:r[1],spec:{body:r[3],hair:r[4],skin:r[5],glow:r[6],
      pin:PIN[r[7]],expr:'raw',outfit:{type:'tee',c1:'#e8e8e8',c2:'#5a6a7a',c3:'#b8b8c4'}}};
  }
  if(n===4){
    const b=BASEMAP[mods.slice(0,4).join('')];
    return{name:b.name,spec:{body:b.body,hair:b.hair,skin:b.skin,glow:b.glow,eye:b.eye,lip:b.lip,
      expr:b.expr,pin:PIN[b.v],acc:b.acc,outfit:{type:'tee',c1:b.top,c2:'#4a4f60',c3:'#e8e8f0'}}};
  }
  const k4=mods.slice(0,4).join('');
  const f=F32.find(x=>x[0]===k4&&x[1]===mods[4]);
  const b=BASEMAP[k4];
  return{name:f[2],code:k4+mods[4],spec:{body:b.body,hair:f[4],skin:b.skin,glow:b.glow,eye:b.eye,lip:b.lip,
    expr:b.expr,pin:PIN[b.v],outfit:f[5],acc:f[6]}};
}
const PSPR={};
function playerSprite(mods){
  const key=mods.join('')||'_';
  if(!PSPR[key]){
    const f=playerForm(mods);
    PSPR[key]={cv:drawCharacter(f.spec),name:f.name,code:f.code};
  }
  return PSPR[key];
}
function bodyRadius(mods){            // 角色整体放大一倍，碰撞半径同步 ×2
  const n=mods.length;
  if(n===0)return 34;
  if(n<3)return 24;
  return mods[0]==='L'?18:22;
}

/* ---------- Q版操作角色（大头身 + 跑动循环） ----------
   复用形态立绘的「头部」做大头，配程序化小身体 + 交替双腿跑步 */
const CHIBI={};
function chibiHead(mods){
  const key=mods.join('')||'_';
  if(!CHIBI[key]){
    const f=playerForm(mods),s=f.spec;
    let fy,hb,build,bodyC,legC;
    if(s.kind==='buff'){fy=14;hb=fy+22;build='buff';}
    else if(s.kind){fy=16;hb=fy+22;build=s.kind;}        // 'fat' | 'slim'
    else{fy=(s.body==='tall')?16:22;hb=fy+19;build='idol';}
    if(build==='idol'){bodyC=s.outfit?s.outfit.c1:'#5a4a6a';legC=s.skin||'#ffdcc6';}
    else{                                                 // 大叔：与立像同款配色
      legC='#3a4250';
      if(s.jacket)bodyC='#2c2430';                        // 皮夹克
      else if(build==='buff')bodyC=s.skin||'#e8bd8a';     // 裸上身
      else bodyC=s.top||(build==='fat'?'#d8d2c4':'#c8c2b4'); // 背心/应援衫
    }
    let head,hw,hh,img=false;
    const kh=(typeof KEYART_HEAD!=='undefined')?KEYART_HEAD[key]:null;
    if(kh){                                               // 用高清立绘裁出的头当大头
      head=kh.cv;hw=kh.w;hh=kh.h;img=true;
      const cfg=(typeof KEYART_CHIBI!=='undefined')?KEYART_CHIBI[key]:null;
      if(cfg){if(cfg.top)bodyC=cfg.top;if(cfg.leg)legC=cfg.leg;}
    }else{                                                // 回退：从程序化立绘裁头
      const src=playerSprite(mods).cv;const hc=document.createElement('canvas');hc.width=64;hc.height=hb;
      hc.getContext('2d').drawImage(src,0,0);head=hc;hw=64;hh=hb;
    }
    CHIBI[key]={head,hw,hh,img,hb,spec:s,build,bodyC,legC};
  }
  return CHIBI[key];
}
/* 新版 Q版操作角色：按形态码懒加载 GPT 生成的 chibi 透明图；缺图/加载中才回退程序化 */
const CHIBIMG={},CHIBILOADING={}; let _hitCanvas=null,_lastChibi=null;
function chibiSrc(key){return 'art/chibi/'+(key==='_'?'uncle':key)+'.png?v=px1';}  // ?v= 版本号：换图后改这里强制绕过浏览器缓存
function getChibiImg(key){
  if(key in CHIBIMG)return CHIBIMG[key];
  if(!CHIBILOADING[key]){CHIBILOADING[key]=1;const im=new Image();
    im.onload=()=>CHIBIMG[key]=im;im.onerror=()=>CHIBIMG[key]=null;im.src=chibiSrc(key);}
  return undefined;
}
/* 正面走路精灵帧(RD advanced_walking,64×64透明)：6帧齐才用,缺帧→null 回退单立绘 */
const WALK={},WALKING={};
/* 走路精灵·每形态微调(简单手调)：w=横向缩放(<1变窄,压"胖") · s=整体缩放(<1变小,缩"大")。缺省 1。
   游戏里看着哪个偏胖/偏大,就在这里加一行,如 'H':{w:0.85} 或 'LSCYT':{s:0.92,w:0.9} */
const CHIBI_FIX={
  '_':{w:0.82},   // 原点大叔最胖→压窄(示范;其余按需补)
};
function getWalkFrames(key){
  if(key in WALK) return WALK[key];
  if(!WALKING[key]){WALKING[key]=1;const N=6,arr=new Array(N);let done=0;
    for(let i=0;i<N;i++){const im=new Image();
      im.onload=()=>{if(++done>=N)WALK[key]=arr.every(a=>a&&a.width)?arr:null;};
      im.onerror=()=>{WALK[key]=null;};
      im.src='art/chibi_walk/'+key+'/f0'+i+'.png?v=px1';arr[i]=im;}}
  return WALK[key];
}
function drawChibi(g,x,y,mods,o){
  const key=mods.join('')||'_';
  const wf=getWalkFrames(key);
  if(wf&&wf.length){                                     // 有走路帧：移动循环播帧、静止用站立帧f0+呼吸
    const nf=wf.length,t=o.t||0,idx=o.moving?Math.floor(t*9)%nf:0,fim=wf[idx]||wf[0];
    const _fx=CHIBI_FIX[key]||0,_fw=(_fx&&_fx.w)||1,_fs=(_fx&&_fx.s)||1;   // 每形态微调:横压_fw/整缩_fs
    const TH=51*_fs,sc=TH/fim.height,tw=fim.width*sc*_fw,hop=o.moving?0:Math.sin(t*2.4)*0.6,lift=o.lift||0,al=o.alpha==null?1:o.alpha;   // 51≈0.8×64;从脚底缩,横压居中,对齐不变
    g.save();g.translate(x,y+12);g.scale(1,.38);g.globalAlpha=al*(lift>0?Math.max(.25,1-lift/70):1);
    g.fillStyle='rgba(0,0,0,.40)';g.beginPath();g.arc(0,0,tw*0.30*(lift>0?Math.max(.5,1-lift/140):1),0,7);g.fill();g.restore();
    g.save();g.globalAlpha=al;g.translate(Math.round(x),Math.round(y+10-hop-lift));g.scale(-(o.face||1),1);g.imageSmoothingEnabled=false;
    g.shadowColor='rgba(130,220,255,'+(0.45+0.14*Math.sin(t*3)).toFixed(3)+')';g.shadowBlur=7;
    if(o.hit>0){const tw2=Math.max(2,Math.ceil(tw)),th2=Math.max(2,Math.ceil(TH));
      const tc=_hitCanvas||(_hitCanvas=document.createElement('canvas'));if(tc.width<tw2||tc.height<th2){tc.width=tw2;tc.height=th2;}
      const tg=tc.getContext('2d');tg.clearRect(0,0,tc.width,tc.height);tg.imageSmoothingEnabled=false;
      tg.drawImage(fim,0,0,tw,TH);tg.globalCompositeOperation='source-atop';tg.fillStyle='rgba(255,50,58,'+Math.min(0.75,o.hit*3.2)+')';tg.fillRect(0,0,tw,TH);tg.globalCompositeOperation='source-over';
      g.drawImage(tc,0,0,tw,TH,-tw/2,-TH,tw,TH);
    }else g.drawImage(fim,-tw/2,-TH,tw,TH);
    g.shadowBlur=0;g.restore();return;
  }
  let im=getChibiImg(key);
  if(im&&im.width)_lastChibi=im; else im=_lastChibi;      // 加载中/缺图→用最近一张可用立绘占位，绝不回退已弃用的程序化老形象
  if(im&&im.width){                                       // 用 GPT 的 Q版图 + 果冻 squash-stretch 走路
    const TH=64,sc=TH/im.height,tw=im.width*sc;            // 操作角色高度（略缩小，给环绕武器留空间）
    const moving=o.moving,ph=o.run||0;
    let sx=1,sy=1,hop;
    if(moving){                                          // a:0着地→1腾空；着地横向压扁、腾空竖向拉伸（体积守恒）
      const a=Math.abs(Math.sin(ph));
      sy=1+(a-0.45)*0.18; sx=1/sy; hop=a*3.2;            // 果冻幅度减弱（0.34→0.18）
    }else{ hop=Math.sin(o.t*2.4)*0.6; }
    const footY=y+10;                                    // 脚底基线（缩放锚点）
    const lift=o.lift||0, al=o.alpha==null?1:o.alpha;    // lift：飞行离地（影子留在地面）；alpha：潜行半透明
    g.save();g.translate(x,y+12);g.scale(1,.38);g.globalAlpha=al*(lift>0?Math.max(.25,1-lift/70):1);g.fillStyle='rgba(0,0,0,.40)';
    g.beginPath();g.arc(0,0,tw*0.30*sx*(lift>0?Math.max(.5,1-lift/140):1),0,7);g.fill();g.restore();   // 影子随横向挤压变宽；飞行时变小变淡
    g.save();
    g.globalAlpha=al;
    g.translate(Math.round(x),Math.round(footY-hop-lift));
    g.scale(-o.face*sx,sy);                              // 朝向翻转（修正"倒着走"）+ 果冻挤压，锚定脚底
    g.imageSmoothingEnabled=false;                       // 粗粒度像素图：关抗锯齿，缩放仍保硬边像素块
    g.shadowColor='rgba(130,220,255,'+(0.45+0.14*Math.sin(o.t*3)).toFixed(3)+')';
    g.shadowBlur=7;                                       // 柔和发光描边：怪多时一眼找到自己（克制、不刺眼）
    if(o.hit>0){                                         // 受击红闪：离屏染色（只染精灵像素，不染背景）
      const tw2=Math.max(2,Math.ceil(tw)),th2=Math.max(2,Math.ceil(TH));
      const tc=_hitCanvas||(_hitCanvas=document.createElement('canvas'));
      if(tc.width<tw2||tc.height<th2){tc.width=tw2;tc.height=th2;}
      const tg=tc.getContext('2d');tg.clearRect(0,0,tc.width,tc.height);tg.imageSmoothingEnabled=false;
      tg.drawImage(im,0,0,tw,TH);
      tg.globalCompositeOperation='source-atop';tg.fillStyle='rgba(255,50,58,'+Math.min(0.75,o.hit*3.2)+')';tg.fillRect(0,0,tw,TH);
      tg.globalCompositeOperation='source-over';
      g.drawImage(tc,0,0,tw,TH,-tw/2,-TH,tw,TH);
    }else g.drawImage(im,-tw/2,-TH,tw,TH);               // 图底=原点(脚)，向上画
    g.shadowBlur=0;
    g.restore();
    return;
  }
  // 极早期首帧：连占位立绘都还没有 → 只画一个影子，依然不画已弃用的程序化老形象
  {const al=o.alpha==null?1:o.alpha;g.save();g.translate(x,y+12);g.scale(1,.38);g.globalAlpha=al*.5;
   g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(0,0,12,0,7);g.fill();g.restore();}
  return;
  /* ↓↓↓ 旧程序化形象（已弃用）：drawChibi 不再走到这里；chibiHead 仍保留供其他处引用 ↓↓↓ */
  const ch=chibiHead(mods);
  const HW=ch.img?80:74,HH=Math.round(HW*ch.hh/ch.hw);   // 放大一倍（程序化回退保持一致）
  const body=ramp(ch.bodyC),leg=ramp(ch.legC),sk=ramp(ch.spec.skin||'#e0b184');
  const moving=o.moving,ph=o.run||0;
  const step=moving?Math.round(Math.sin(ph)*3):0;
  const bob=moving?Math.abs(Math.cos(ph))*2.2:Math.sin(o.t*2.4)*0.7;
  const fat=ch.build!=='idol';
  /* 影子 */
  g.save();g.translate(x,y+12);g.scale(1,.38);g.fillStyle='rgba(0,0,0,.42)';
  g.beginPath();g.arc(0,0,fat?12:10,0,7);g.fill();g.restore();
  g.save();
  g.translate(Math.round(x),Math.round(y-bob));
  g.scale(o.face,1);
  g.imageSmoothingEnabled=false;
  if(fat){
    /* 大叔：小短腿 + 圆肚（呼应立像「小头大肚短腿」） */
    const prof=ch.build==='fat'?[4,6,9,11,12,12,11,10,8]:ch.build==='buff'?[7,8,8,8,7,6,5,4]:[4,5,7,8,8,8,7,5];
    const half=prof[prof.length-3];
    g.fillStyle=leg.D;g.fillRect(-5-step,4,4,5);g.fillStyle='#1a1422';g.fillRect(-6-step,8,5,2);
    g.fillStyle=leg.B;g.fillRect(1+step,4,4,5);g.fillStyle='#1a1422';g.fillRect(1+step,8,5,2);
    prof.forEach((w,i)=>{g.fillStyle=body.B;g.fillRect(-w,-5+i,w*2,1);g.fillStyle=body.D;g.fillRect(w-1,-5+i,1,1);});
    g.fillStyle=body.L;g.fillRect(-prof[1],-4,3,1);
    if(ch.build==='buff'){g.fillStyle=sk.D;g.fillRect(-1,-3,2,6);g.fillRect(-4,-2,1,2);g.fillRect(3,-2,1,2);}
    g.fillStyle=sk.B;g.fillRect(-half-2,-2+step,2,5);g.fillRect(half,-2-step,2,5);
  }else{
    /* 偶像：纤细身体 */
    g.fillStyle=leg.D;g.fillRect(-5-step,4,4,7);g.fillStyle='#1a1422';g.fillRect(-6-step,10,5,2);
    g.fillStyle=leg.B;g.fillRect(1+step,4,4,7);g.fillStyle='#1a1422';g.fillRect(1+step,10,5,2);
    g.fillStyle=body.B;g.fillRect(-6,-3,12,8);
    g.fillStyle=body.L;g.fillRect(-6,-3,12,2);g.fillStyle=body.D;g.fillRect(4,-2,2,7);
    g.fillStyle=sk.B;g.fillRect(-8,-2+step,2,5);g.fillRect(6,-2-step,2,5);
  }
  g.imageSmoothingEnabled=ch.img;
  g.drawImage(ch.head,0,0,ch.hw,ch.hh,-HW/2,-3-HH,HW,HH);
  g.imageSmoothingEnabled=false;
  g.restore();
}

/* ---------- 敌人精灵 ---------- */
function chibiViewer(g,o){ /* 通用小观众：20×26 */
  const sk=ramp(o.skin||'#e8c098'),hc=ramp(o.hair),tc=ramp(o.top);
  rws(g,[[2,7,12],[3,6,13],[4,6,13],[5,6,13],[6,6,13],[7,6,13],[8,7,12]],sk.B);   // 头
  rws(g,[[1,7,12],[2,6,13],[3,5,6],[3,13,14]],hc.B);hl(g,4,5,6,hc.B);hl(g,4,13,14,hc.B); // 头发
  px(g,8,5,'#241126');px(g,11,5,'#241126');                                       // 眼
  for(let y=9;y<=18;y++)hl(g,y,5,14,tc.B);                                        // 身体
  px(g,14,12,tc.D);px(g,14,15,tc.D);
  hl(g,9,5,14,tc.L);
  for(let y=19;y<=23;y++){hl(g,y,7,8,'#3a3e4a');hl(g,y,11,12,'#3a3e4a');}         // 腿
  hl(g,24,6,8,'#241c30');hl(g,24,11,13,'#241c30');
  if(o.phone){rect(g,15,10,3,5,'#1c1c28');px(g,16,11,o.glow||'#7af0ea');px(g,16,13,o.glow||'#7af0ea');
    hl(g,14,14,15,sk.B);}                                                          // 举手机
  if(o.mark){px(g,9,12,o.mark);px(g,10,12,o.mark);hl(g,13,9,10,o.mark);}          // 胸前标记
  if(o.angry){hl(g,4,7,9,'#5a2020');hl(g,4,10,12,'#5a2020');}                     // 怒眉
  if(o.band){hl(g,2,6,13,o.band);}                                                // 头带
}
function makeEnemySprites(){
  const E={};
  E.luren=[ '#5a7a9a','#7a5a8a','#6a8a5a','#9a7a5a' ].map(c=>espr(20,26,g=>chibiViewer(g,{hair:'#4a3a2a',top:c,phone:1})));
  E.shuijun=[espr(17,22,g=>{
    const tc=ramp('#3a6aa8');
    rws(g,[[2,6,10],[3,5,11],[4,5,11],[5,5,11],[6,5,11],[7,6,10]],ramp('#e8c098').B);
    hl(g,1,6,10,'#2a3a55');hl(g,2,5,6,'#2a3a55');hl(g,2,10,11,'#2a3a55');
    px(g,7,4,'#241126');px(g,9,4,'#241126');
    for(let y=8;y<=15;y++)hl(g,y,4,12,tc.B);
    hl(g,8,4,12,tc.L);
    px(g,8,10,'#ffd24a');px(g,8,12,'#ffd24a');vl(g,8,10,12,'#ffd24a');             // ！
    for(let y=16;y<=19;y++){hl(g,y,6,7,'#2a3142');hl(g,y,9,10,'#2a3142');}
  })];
  E.penzi=[espr(20,26,g=>chibiViewer(g,{hair:'#2a3a2a',top:'#3f5a3a',phone:1,glow:'#ff5a5a',angry:1}))];
  E.baipiao=[espr(22,28,g=>{
    const tc=ramp('#6a6a74'),sk=ramp('#e8c098');
    rws(g,[[2,8,14],[3,7,15],[4,7,15],[5,7,15],[6,7,15],[7,7,15],[8,8,14]],sk.B);
    hl(g,1,8,14,'#3a3a42');hl(g,2,7,8,'#3a3a42');hl(g,2,14,15,'#3a3a42');
    hl(g,5,9,10,'#241126');hl(g,5,12,13,'#241126');                                // 半眯眼
    for(let y=9;y<=20;y++)hl(g,y,5,17,tc.B);
    hl(g,13,6,16,tc.D);hl(g,14,6,16,tc.D);                                         // 抱臂
    hl(g,9,5,17,tc.L);
    for(let y=21;y<=25;y++){hl(g,y,8,9,'#34343c');hl(g,y,13,14,'#34343c');}
  })];
  E.duijia=[espr(19,25,g=>chibiViewer(g,{hair:'#7a3a5a',top:'#d04a8a',mark:'#ffd24a',band:'#ffd24a'}))];
  E.heifen=[espr(32,40,g=>{
    const hc=ramp('#221d2c'),sk=ramp('#d8b090');
    rws(g,[[3,11,20],[4,9,22],[5,8,23],[6,8,23],[7,8,23],[8,8,23],[9,8,23],[10,9,22]],hc.B); // 兜帽
    rws(g,[[6,11,20],[7,10,21],[8,10,21],[9,10,21],[10,11,20]],sk.B);
    hl(g,8,12,14,'#ff4a4a');hl(g,8,17,19,'#ff4a4a');                                // 红光眼
    rws(g,[[9,11,20],[10,11,20],[11,12,19]],'#3a3442');                             // 口罩
    for(let y=11;y<=28;y++)hl(g,y,7,24,hc.B);
    hl(g,11,7,24,hc.L);vl(g,15,14,24,hc.K);vl(g,16,14,24,hc.K);                     // 拉链
    px(g,10,16,'#ff4a4a');px(g,21,18,'#ff4a4a');
    for(let y=29;y<=37;y++){hl(g,y,10,13,'#26222e');hl(g,y,18,21,'#26222e');}
    hl(g,38,9,14,'#16121e');hl(g,38,17,22,'#16121e');
  })];
  E.leping=[espr(30,40,g=>{
    const su=ramp('#2e2a3a'),sk=ramp('#e0c0a0');
    rws(g,[[2,10,19],[3,9,20],[4,9,20],[5,9,20],[6,9,20],[7,9,20],[8,9,20],[9,10,19]],sk.B);
    hl(g,1,10,19,'#4a4452');hl(g,2,9,10,'#4a4452');hl(g,2,19,20,'#4a4452');
    rect(g,10,5,4,3,'#1c1c28');rect(g,16,5,4,3,'#1c1c28');hl(g,6,14,15,'#1c1c28');  // 墨镜
    hl(g,11,12,17,'#b08a6a');                                                       // 拽嘴
    for(let y=12;y<=28;y++)hl(g,y,7,22,su.B);
    rect(g,13,12,4,8,'#e8e0d0');vl(g,14,12,19,'#aa2a3a');                           // 衬衫领带
    hl(g,12,7,22,su.L);
    rect(g,23,16,3,4,'#7a2438');px(g,24,15,'#e8a8b8');hl(g,21,23,25,sk.B);          // 红酒杯
    for(let y=29;y<=37;y++){hl(g,y,10,13,'#221e2c');hl(g,y,16,19,'#221e2c');}
    hl(g,38,9,14,'#16121e');hl(g,38,15,20,'#16121e');
  })];
  E.boss=[espr(50,64,g=>{
    const co=ramp('#e8e4ea'),sk=ramp('#d8a878'),sh=ramp('#7a3a8a');
    /* 大背头+墨镜的诊所老板，白大褂+花衬衫+金链子 */
    rws(g,[[2,18,31],[3,16,33],[4,15,34]],ramp('#2a2433').B);                       // 大背头
    rws(g,[[5,15,34],[6,14,35],[7,14,35],[8,14,35],[9,14,35],[10,14,35],[11,14,35],[12,15,34],[13,16,33]],sk.B);
    vl(g,15,5,9,ramp('#2a2433').B);vl(g,34,5,9,ramp('#2a2433').B);
    rect(g,17,7,6,3,'#16121e');rect(g,27,7,6,3,'#16121e');hl(g,8,23,26,'#16121e');  // 墨镜
    hl(g,8,18,19,'#5ad8ff');hl(g,8,28,29,'#5ad8ff');                                // 镜片反光
    hl(g,11,21,28,'#8a5a4a');px(g,20,10,sk.D);px(g,29,10,sk.D);                     // 嘴+法令纹
    dith(g,17,11,32,13,'#a87f52');                                                  // 胡茬
    for(let y=14;y<=44;y++){hl(g,y,10,17,co.B);hl(g,y,32,39,co.B);}                 // 白大褂
    for(let y=14;y<=44;y++)hl(g,y,18,31,sh.B);                                      // 花衬衫
    px(g,21,18,'#ffd24a');px(g,26,22,'#ffd24a');px(g,23,28,'#ffd24a');px(g,28,33,'#ffd24a'); // 花纹
    hl(g,16,18,31,'#ffd24a');hl(g,17,19,30,'#ffd24a');                              // 金链子
    hl(g,14,10,39,co.L);vl(g,10,14,44,co.L);
    /* 手臂+账本 */
    for(let y=16;y<=34;y++){hl(g,y,6,9,co.B);hl(g,y,40,43,co.B);}
    rect(g,3,30,8,10,'#7a2430');hl(g,32,4,9,'#e8d8b0');hl(g,35,4,9,'#e8d8b0');      // 账本
    for(let y=45;y<=58;y++){hl(g,y,15,21,'#2a2533');hl(g,y,28,34,'#2a2533');}
    hl(g,59,13,22,'#16121e');hl(g,60,13,22,'#16121e');hl(g,59,27,36,'#16121e');hl(g,60,27,36,'#16121e');
  })];
  return E;
}

/* 打赏掉落（爱心币） */
function makeCoin(){
  return espr(10,10,g=>{
    const c=ramp('#ffd24a');
    rws(g,[[2,2,3],[2,6,7],[3,1,8],[4,1,8],[5,2,7],[6,3,6],[7,4,5]],c.B);
    px(g,2,3,c.L);px(g,3,3,c.L);
  });
}
/* 全息分身（半透明主角剪影用色块代替：小型猫耳投影） */
function makeHolo(){
  return espr(18,24,g=>{
    const c=ramp('#4ef0e8');
    rws(g,[[2,6,11],[3,5,12],[4,5,12],[5,5,12],[6,5,12],[7,6,11]],c.B);
    px(g,4,1,c.B);px(g,13,1,c.B);px(g,4,2,c.B);px(g,13,2,c.B);                      // 猫耳
    px(g,7,4,'#0d2a28');px(g,10,4,'#0d2a28');
    for(let y=8;y<=17;y++)hl(g,y,5,12,c.B);
    for(let y=3;y<=17;y+=3)hl(g,y,5,12,c.L);                                        // 扫描线
    for(let y=18;y<=21;y++){hl(g,y,7,8,c.D);hl(g,y,9,10,c.D);}
  });
}

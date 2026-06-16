/* ============ 引擎：64×92 逻辑像素 + 霓虹轮廓光后处理 ============ */
const W=64,H=92,S=3;

function mix(a,b,t){
  const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);
  const r=Math.round(((A>>16)&255)*(1-t)+((B>>16)&255)*t);
  const g=Math.round(((A>>8)&255)*(1-t)+((B>>8)&255)*t);
  const bl=Math.round((A&255)*(1-t)+(B&255)*t);
  return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1);
}
function ramp(c){return{L:mix(c,'#ffffff',.38),B:c,D:mix(c,'#0a0612',.32),K:mix(c,'#0a0612',.55)};}
function px(g,x,y,c){g.fillStyle=c;g.fillRect(x,y,1,1);}
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
function hl(g,y,x1,x2,c){rect(g,x1,y,x2-x1+1,1,c);}
function vl(g,x,y1,y2,c){rect(g,x,y1,1,y2-y1+1,c);}
function rws(g,arr,c){arr.forEach(r=>hl(g,r[0],r[1],r[2],c));}
function dith(g,x1,y1,x2,y2,c,par){
  par=par||0;
  for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)if((x+y)%2===par)px(g,x,y,c);
}

/* 后处理：轮廓光(左青/右品红/顶白) + 1px 深紫描边 */
function finish(layer){
  const g=layer.getContext('2d');
  const id=g.getImageData(0,0,W,H),d=id.data;
  const alpha=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++)alpha[i]=d[i*4+3]>40?1:0;
  const A=(x,y)=>(x<0||y<0||x>=W||y>=H)?0:alpha[y*W+x];
  const RL=[100,235,255],RR=[255,100,215],RT=[235,240,255];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(!A(x,y))continue;
    const i=(y*W+x)*4;
    if(!A(x-1,y)){d[i]=(d[i]+RL[0]*1.1)/2.1|0;d[i+1]=(d[i+1]+RL[1]*1.1)/2.1|0;d[i+2]=(d[i+2]+RL[2]*1.1)/2.1|0;}
    else if(!A(x+1,y)){d[i]=(d[i]*1.6+RR[0])/2.6|0;d[i+1]=(d[i+1]*1.6+RR[1])/2.6|0;d[i+2]=(d[i+2]*1.6+RR[2])/2.6|0;}
    else if(!A(x,y-1)){d[i]=(d[i]*2.4+RT[0])/3.4|0;d[i+1]=(d[i+1]*2.4+RT[1])/3.4|0;d[i+2]=(d[i+2]*2.4+RT[2])/3.4|0;}
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(A(x,y))continue;
    if(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1)){
      const i=(y*W+x)*4;d[i]=24;d[i+1]=17;d[i+2]=33;d[i+3]=255;
    }
  }
  g.putImageData(id,0,0);
}

/* 度量 */
function metrics(body){
  if(body==='tall')return{tall:1,fy:16,fx0:24,fx1:39,shY:36,waY:47,hipY:54,hipB:58,legT:58,legB:83,
    tx0:25,tx1:38,armL:[22,23],armR:[40,41],handY:58};
  return{tall:0,fy:22,fx0:24,fx1:39,shY:42,waY:53,hipY:58,hipB:62,legT:62,legB:83,
    tx0:26,tx1:37,armL:[23,24],armR:[39,40],handY:59};
}

/* ============ 偶像皮肤躯体 ============ */
function skinBody(g,M,sp){
  const sk=ramp(sp.skin||'#ffdcc6');
  for(let y=M.shY;y<=M.hipB;y++){
    let x0=M.tx0,x1=M.tx1;
    if(y>=M.waY-1&&y<=M.waY+1){x0+=1;x1-=1;}
    hl(g,y,x0,x1,sk.B);
    px(g,x1,y,sk.D);
  }
  rect(g,29,M.fy+18,6,M.shY-(M.fy+18),sk.B);          // 颈
  px(g,34,M.fy+19,sk.D);
  for(let y=M.shY+1;y<=M.handY+3;y++){                 // 臂
    hl(g,y,M.armL[0],M.armL[1],sk.B);
    hl(g,y,M.armR[0],M.armR[1],sk.B);
    px(g,M.armR[1],y,sk.D);
  }
  drawLegsSkin(g,M,sk);
}
function drawLegsSkin(g,M,sk){
  for(let y=M.legT;y<=M.legB;y++){
    const slim=y>M.legT+12;
    if(M.tall){hl(g,y,slim?27:26,30,sk.B);hl(g,y,33,slim?36:37,sk.B);px(g,slim?36:37,y,sk.D);}
    else{hl(g,y,slim?28:27,30,sk.B);hl(g,y,33,slim?35:36,sk.B);px(g,slim?35:36,y,sk.D);}
  }
}
function drawShoes(g,M,c){
  const r=ramp(c);
  if(M.tall){rws(g,[[84,25,30],[85,25,30],[86,26,30]],r.B);rws(g,[[84,33,38],[85,33,38],[86,33,37]],r.B);
    hl(g,84,25,30,r.L);hl(g,84,33,38,r.L);}
  else{rws(g,[[84,26,30],[85,26,30],[86,27,30]],r.B);rws(g,[[84,33,37],[85,33,37],[86,33,36]],r.B);
    hl(g,84,26,30,r.L);hl(g,84,33,37,r.L);}
}
function drawBoots(g,M,c,topY){
  const r=ramp(c);
  for(let y=topY;y<=83;y++){
    if(M.tall){hl(g,y,27,30,r.B);hl(g,y,33,36,r.B);px(g,36,y,r.D);}
    else{hl(g,y,28,30,r.B);hl(g,y,33,35,r.B);px(g,35,y,r.D);}
  }
  hl(g,topY,M.tall?27:28,M.tall?30:30,r.L);hl(g,topY,33,M.tall?36:35,r.L);
  drawShoes(g,M,c);
}

/* ============ 偶像脸 ============ */
function idolFace(g,M,sp){
  const sk=ramp(sp.skin||'#ffdcc6'),fy=M.fy;
  rws(g,[[fy,27,36],[fy+1,25,38]],sk.B);
  for(let y=fy+2;y<=fy+13;y++)hl(g,y,24,39,sk.B);
  rws(g,[[fy+14,25,38],[fy+15,25,38],[fy+16,26,37],[fy+17,27,36],[fy+18,29,34]],sk.B);
  vl(g,39,fy+3,fy+13,sk.D);vl(g,38,fy+6,fy+12,sk.D);   // 右侧阴影
  hl(g,fy+17,28,35,sk.D);                              // 颌底阴影
  const ec=ramp(sp.eye||'#43355e'),K='#241126';
  const ey=fy+8;
  if(sp.expr==='cool'){
    hl(g,ey-1,26,31,K);px(g,25,ey,K);                  // 眼线+眼尾
    hl(g,ey-1,33,38,K);px(g,38,ey,K);
    rect(g,27,ey,3,2,ec.B);rect(g,34,ey,3,2,ec.B);
    px(g,27,ey,'#ffffff');px(g,34,ey,'#ffffff');
    hl(g,ey+1,27,29,ec.K);hl(g,ey+1,34,36,ec.K);
    hl(g,fy+14,30,32,sp.lip||'#b05a6a');
  }else{
    hl(g,ey-1,26,30,K);hl(g,ey-1,33,37,K);
    rect(g,27,ey,3,3,ec.B);rect(g,34,ey,3,3,ec.B);
    hl(g,ey,27,29,ec.K);hl(g,ey,34,36,ec.K);
    px(g,27,ey,'#ffffff');px(g,34,ey,'#ffffff');
    px(g,28,ey+2,ec.L);px(g,35,ey+2,ec.L);
    if(sp.expr==='sunny'){
      hl(g,fy+14,30,33,'#a23a4a');hl(g,fy+15,31,32,'#e8707a');
      dith(g,25,fy+11,27,fy+12,'#ff9eae');dith(g,36,fy+11,38,fy+12,'#ff9eae');
    }else{ // raw：皮像魂没像
      hl(g,fy+14,30,33,'#9a6a6a');
      px(g,40,fy+4,'#9adcff');px(g,40,fy+5,'#9adcff');px(g,40,fy+6,'#6ab8e8');
    }
  }
  px(g,32,fy+12,sk.D);                                 // 鼻
  if(sp.glow){hl(g,fy+13,24,25,sp.glow);px(g,39,fy+5,sp.glow);} // 义体面纹
}

/* ============ 大叔：罗汉肚肥宅（戴夫式小头大肚短腿，邋遢） ============ */
function uncleHead(g,fy,x0,x1,sp){
  const sk=ramp('#e8bd8a'),hc=ramp('#5a4636');
  rws(g,[[fy,x0+5,x1-5],[fy+1,x0+2,x1-2],[fy+2,x0+1,x1-1]],sk.B);
  for(let y=fy+3;y<=fy+18;y++)hl(g,y,x0,x1,sk.B);
  rws(g,[[fy+19,x0+1,x1-1],[fy+20,x0+2,x1-2],[fy+21,x0+4,x1-4]],sk.B);
  vl(g,x1,fy+4,fy+18,sk.D);vl(g,x1-1,fy+9,fy+16,sk.D);
  /* 油腻稀疏的头发（中间偏秃、两侧多） */
  hl(g,fy,x0+5,x1-5,hc.B);
  rws(g,[[fy-1,x0+3,x0+8],[fy-1,x1-8,x1-3],[fy-2,x0+3,x0+6],[fy-2,x1-6,x1-3]],hc.B);
  px(g,31,fy-1,hc.B);px(g,33,fy-1,hc.B);
  vl(g,x0,fy+1,fy+7,hc.B);vl(g,x1,fy+1,fy+7,hc.B);
  px(g,x0+1,fy+8,hc.B);px(g,x1-1,fy+8,hc.B);
  hl(g,fy-1,x0+3,x0+6,hc.L);
  /* ②S 头带 / ②D 墨镜（仅声带改造后出现） */
  if(sp&&sp.band){rect(g,x0,fy+1,x1-x0+1,3,'#ff7bc1');hl(g,fy+1,x0+1,x1-1,'#ffd2e8');px(g,x1+1,fy+2,'#d8569e');}
  else if(sp&&sp.shade){rect(g,x0+2,fy+1,x1-x0-3,3,'#16161e');px(g,x0+4,fy+2,'#5ad8ff');px(g,x1-6,fy+2,'#5ad8ff');}
  /* 粗眉小眼+眼袋 */
  const bw=sp&&sp.star?'#3a2a1a':'#4a3a28';
  rect(g,x0+4,fy+6,5,2,bw);rect(g,x1-8,fy+6,5,2,bw);
  if(sp&&sp.star){
    rect(g,x0+5,fy+9,3,3,'#3a2f4e');rect(g,x1-7,fy+9,3,3,'#3a2f4e');
    px(g,x0+5,fy+9,'#fff');px(g,x1-7,fy+9,'#fff');px(g,x0+6,fy+10,'#ffd24a');px(g,x1-6,fy+10,'#ffd24a');
  }else{
    rect(g,x0+5,fy+9,2,2,'#2a2018');rect(g,x1-6,fy+9,2,2,'#2a2018');
    hl(g,fy+11,x0+5,x0+7,sk.D);hl(g,fy+11,x1-7,x1-5,sk.D);
  }
  rect(g,30,fy+11,4,3,sk.D);px(g,30,fy+13,sk.K);px(g,33,fy+13,sk.K); // 大鼻
  if(sp&&sp.smile){hl(g,fy+16,x0+7,x1-7,'#8a4a4a');hl(g,fy+17,x0+8,x1-8,'#c86a6a');}
  else{hl(g,fy+16,x0+7,x1-7,'#8a5a4a');px(g,x0+7,fy+15,'#8a5a4a');px(g,x1-7,fy+15,'#8a5a4a');}
  dith(g,x0+2,fy+14,x1-2,fy+20,'#9a7048');               // 胡茬
  if(sp&&sp.chin)hl(g,fy+20,x0+5,x1-5,sk.D);
  if(sp&&sp.sweat){px(g,x1+1,fy+5,'#9adcff');px(g,x1+1,fy+6,'#9adcff');px(g,x1+1,fy+7,'#6ab8e8');}
}
function fatBody(g,sp){
  const sk=ramp('#e8bd8a'),t=ramp(sp.top||'#d8d2c4'),legC=ramp('#3a4250');
  /* 圆滚滚的大肚子（小头大肚短腿） */
  const tor=[];
  for(let y=38;y<=80;y++){
    let w;
    if(y<41)w=10;else if(y<44)w=13;else if(y<48)w=17;else if(y<52)w=20;
    else if(y<=70)w=23;else if(y<73)w=22;else if(y<76)w=20;else if(y<78)w=17;else w=13;
    tor.push([y,32-w,32+w-1]);
  }
  rws(g,tor,sk.B);
  tor.forEach(r=>{px(g,r[2],r[0],sk.D);px(g,r[2]-1,r[0],sk.D);});
  /* 脏背心（盖不住大肚子） */
  rect(g,24,38,5,5,t.B);rect(g,35,38,5,5,t.B);
  for(let y=42;y<=60;y++){const r=tor[y-38];hl(g,y,r[1]+1,r[2]-1,t.B);px(g,r[2]-1,y,t.D);}
  hl(g,60,12,51,t.D);
  px(g,28,50,'#b0a890');px(g,37,55,'#a89878');px(g,24,57,'#b0a890'); // 污渍
  /* 露出的下半肚子 */
  hl(g,66,18,46,sk.D);hl(g,72,20,44,sk.D);px(g,32,70,sk.K);          // 肚脐
  hl(g,64,16,28,sk.L);
  /* 短粗手臂 */
  for(let y=42;y<=60;y++){const w=y<50?5:4;hl(g,y,10-(w-5),9+w-1,sk.B);hl(g,y,56-w,55,sk.B);px(g,55,y,sk.D);}
  for(let y=44;y<=49;y++){hl(g,y,9,12,t.B);hl(g,y,52,55,t.B);}       // 短袖
  hl(g,61,9,13,sk.B);hl(g,61,51,55,sk.B);
  /* 小短腿 + 四角裤 + 人字拖 */
  rect(g,22,80,9,4,legC.B);rect(g,33,80,9,4,legC.B);hl(g,80,22,41,legC.L);
  rect(g,23,84,7,2,sk.B);rect(g,34,84,7,2,sk.B);
  rws(g,[[86,20,31],[87,21,31]],'#3a3a44');rws(g,[[86,33,44],[87,33,43]],'#3a3a44');
  uncleHead(g,16,23,42,Object.assign({chin:1},sp));
}
function slimBody(g,sp){
  const sk=ramp('#e8bd8a'),t=ramp(sp.top||'#c8c2b4'),legC=ramp('#3a4250');
  rect(g,29,36,6,4,sk.B);
  /* 瘦下来了但还有点软，松垮的背心 */
  const tor=[];
  for(let y=40;y<=68;y++){let w;if(y<44)w=10;else if(y<58)w=12;else w=13;tor.push([y,32-w,32+w-1]);}
  rws(g,tor,t.B);
  tor.forEach(r=>{px(g,r[2],r[0],t.D);px(g,r[2]-1,r[0],t.D);});
  vl(g,26,52,67,t.D);vl(g,38,50,67,t.D);hl(g,68,19,44,t.K);
  hl(g,42,23,30,t.L);
  if(sp.heart){px(g,31,48,'#ff5fb0');px(g,33,48,'#ff5fb0');hl(g,49,31,34,'#ff5fb0');hl(g,50,32,33,'#ff5fb0');}
  if(sp.jacket){const j=ramp('#2c2430');for(let y=40;y<=66;y++){const r=tor[y-40];hl(g,y,r[1],r[1]+4,j.B);hl(g,y,r[2]-4,r[2],j.B);}vl(g,26,42,64,j.L);vl(g,38,42,64,j.D);px(g,27,42,'#8a8a96');px(g,37,42,'#8a8a96');}
  /* 袖+前臂 */
  rect(g,19,41,4,9,t.B);rect(g,41,41,4,9,t.B);
  if(sp.jacket){rect(g,19,41,4,20,ramp('#2c2430').B);rect(g,41,41,4,20,ramp('#2c2430').B);}
  for(let y=50;y<=63;y++){hl(g,y,19,20,sk.B);hl(g,y,43,44,sk.B);px(g,44,y,sk.D);}
  /* 短腿+裤+拖鞋 */
  for(let y=68;y<=84;y++){hl(g,y,26,30,legC.B);hl(g,y,33,37,legC.B);px(g,37,y,legC.D);}
  rws(g,[[85,24,30],[86,25,30]],'#3a3a44');rws(g,[[85,33,39],[86,33,38]],'#3a3a44');
  uncleHead(g,16,23,42,sp);
}
function buffBody(g,sp){
  const sk=ramp('#e8bd8a'),legC=ramp('#3a4250');
  rect(g,27,34,10,5,sk.B);px(g,36,36,sk.D);             // 粗脖
  const tor=[];
  for(let y=39;y<=66;y++){let w;if(y<42)w=13;else if(y<48)w=12;else if(y<58)w=10;else w=9;tor.push([y,32-w,32+w-1]);}
  rws(g,tor,sk.B);                                      // 裸上身
  tor.forEach(r=>px(g,r[2],r[0],sk.D));
  /* 胸肌+腹肌 */
  hl(g,46,23,29,sk.D);hl(g,46,34,40,sk.D);px(g,31,46,sk.D);px(g,32,46,sk.D);
  vl(g,32,50,60,sk.D);hl(g,54,27,37,sk.D);hl(g,58,28,36,sk.D);
  hl(g,42,21,28,sk.L);hl(g,42,36,43,sk.L);
  dith(g,28,40,36,44,'#b58a5a');                        // 胸毛
  if(sp.heart){px(g,30,43,'#ff5fb0');px(g,33,43,'#ff5fb0');hl(g,44,30,33,'#ff5fb0');hl(g,45,31,32,'#ff5fb0');}
  if(sp.jacket){const j=ramp('#2c2430');for(let y=39;y<=64;y++){const r=tor[y-39];hl(g,y,r[1],r[1]+4,j.B);hl(g,y,r[2]-4,r[2],j.B);}vl(g,21,41,62,j.L);}
  /* 麒麟臂 */
  for(let y=39;y<=58;y++){let w=y<44?5:y<50?6:y<54?5:3;hl(g,y,18-w+1,18,sk.B);hl(g,y,45,45+w-1,sk.B);px(g,45+w-1,y,sk.D);}
  hl(g,47,12,14,sk.L);hl(g,47,49,51,sk.L);
  rect(g,15,59,4,4,sk.B);rect(g,45,59,4,4,sk.B);
  /* 短腿+短裤+人字拖 */
  for(let y=66;y<=84;y++){hl(g,y,26,30,legC.B);hl(g,y,33,37,legC.B);px(g,37,y,legC.D);}
  rws(g,[[85,24,30],[86,24,30],[87,25,30]],'#3a3a44');rws(g,[[85,33,39],[86,33,39],[87,33,38]],'#3a3a44');
  uncleHead(g,14,23,42,sp);
}

/* ============ 渲染管线 ============ */
function drawCharacter(spec){
  const layer=document.createElement('canvas');layer.width=W;layer.height=H;
  const g=layer.getContext('2d');
  if(spec.kind==='fat')fatBody(g,spec);
  else if(spec.kind==='slim')slimBody(g,spec);
  else if(spec.kind==='buff')buffBody(g,spec);
  else drawIdol(g,spec);
  finish(layer);
  return layer;
}
function drawIdol(g,sp){
  const M=metrics(sp.body);
  const h=sp.hair;
  if(h&&HAIRB[h.back])HAIRB[h.back](g,M,h);            // 后发(身后)
  skinBody(g,M,sp);
  if(sp.outfit&&OUTFIT[sp.outfit.type])OUTFIT[sp.outfit.type](g,M,sp.outfit,sp);
  else drawShoes(g,M,'#3a3346');
  idolFace(g,M,sp);
  if(h&&HAIRF[h.cap])HAIRF[h.cap](g,M,h);              // 刘海/头顶
  if(h&&h.side&&HAIRS[h.side])HAIRS[h.side](g,M,h);    // 侧发
  if(h&&h.extra&&HAIRX[h.extra])HAIRX[h.extra](g,M,h); // 马尾/卷/辫
  if(h&&h.extra2&&HAIRX[h.extra2])HAIRX[h.extra2](g,M,h);
  if(sp.glow)glowCircuits(g,M,sp);
  if(sp.pin)notePin(g,M,sp.pin);
  (sp.acc||[]).forEach(a=>{const n=a.split(':');ACC[n[0]]&&ACC[n[0]](g,M,sp,n[1]);});
}
function glowCircuits(g,M,sp){
  const c=sp.glow;
  vl(g,M.armL[0],M.shY+4,M.shY+7,c);px(g,M.armL[1],M.shY+7,c);   // 左臂电路
  px(g,M.armR[1],M.handY-2,c);
  if(M.tall){px(g,27,70,c);vl(g,36,66,69,c);}                     // 腿部光点
  else{px(g,28,72,c);vl(g,35,68,70,c);}
}
function notePin(g,M,c){
  vl(g,28,M.shY+3,M.shY+5,c);px(g,29,M.shY+3,c);
  rect(g,26,M.shY+5,2,2,c);
}

/* 卡片渲染：背景氛围 + 角色 */
function renderCard(spec){
  const cv=document.createElement('canvas');
  cv.width=W*S;cv.height=H*S;
  const G=cv.getContext('2d');G.imageSmoothingEnabled=false;
  const grad=G.createLinearGradient(0,0,0,H*S);
  grad.addColorStop(0,'#120e1d');grad.addColorStop(.7,'#1a1228');grad.addColorStop(1,'#221634');
  G.fillStyle=grad;G.fillRect(0,0,cv.width,cv.height);
  const ac=spec.accent||'#9b6bff';
  const rg=G.createRadialGradient(W*S/2,H*S*.42,10,W*S/2,H*S*.42,86);
  rg.addColorStop(0,ac+'2e');rg.addColorStop(1,'#0000');
  G.fillStyle=rg;G.fillRect(0,0,cv.width,cv.height);
  /* 背景霓虹窗格 */
  G.fillStyle=ac+'22';
  G.fillRect(8*S,14*S,2*S,10*S);G.fillRect(54*S,22*S,2*S,8*S);G.fillRect(6*S,40*S,2*S,6*S);
  /* 地板 */
  G.fillStyle='rgba(0,0,0,.5)';
  G.beginPath();G.ellipse(32*S,87.5*S,17*S,2.2*S,0,0,7);G.fill();
  G.fillStyle=ac+'cc';G.fillRect(8*S,89*S,48*S,S);
  G.fillStyle=ac+'44';G.fillRect(12*S,90*S,40*S,S);
  G.drawImage(drawCharacter(spec),0,0,W,H,0,0,W*S,H*S);
  (spec.fx||[]).forEach(f=>{
    const n=f.split(':');
    if(FX[n[0]]){
      const fl=document.createElement('canvas');fl.width=W;fl.height=H;
      FX[n[0]](fl.getContext('2d'),spec,n[1]);
      G.drawImage(fl,0,0,W,H,0,0,W*S,H*S);
    }
  });
  if(spec.bubble)drawBubbleOn(G,spec.bubble);
  return cv;
}
function drawBubbleOn(G,col){
  const bl=document.createElement('canvas');bl.width=W;bl.height=H;
  const g=bl.getContext('2d');
  rws(g,[[6,45,58],[7,44,59],[8,44,59],[9,44,59],[10,44,59],[11,44,59],[12,44,59],[13,44,59],[14,45,58]],'#fdf6ff');
  px(g,46,15,'#fdf6ff');px(g,45,16,'#fdf6ff');px(g,44,17,'#241126');
  vl(g,53,8,12,col);vl(g,49,9,12,col);hl(g,8,49,53,col);px(g,54,8,col);px(g,54,9,col);
  rect(g,47,11,2,2,col);rect(g,51,12,2,2,col);
  finish(bl);
  G.drawImage(bl,0,0,W,H,0,0,W*S,H*S);
}

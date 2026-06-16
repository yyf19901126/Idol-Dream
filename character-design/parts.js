/* ============ 服装库 ============ o={type,c1,c2,c3,...} */
function bodice(g,M,r,sleeveless){
  for(let y=M.shY+(sleeveless?2:0);y<=M.hipY-1;y++){
    let x0=M.tx0,x1=M.tx1;
    if(y>=M.waY-1&&y<=M.waY+1){x0+=1;x1-=1;}
    hl(g,y,x0,x1,r.B);px(g,x1,y,r.D);
  }
  if(!sleeveless){hl(g,M.shY,M.armL[0],M.armL[1],r.B);hl(g,M.shY,M.armR[0],M.armR[1],r.B);
    rect(g,M.armL[0],M.shY,2,4,r.B);rect(g,M.armR[0],M.shY,2,4,r.B);}
  vl(g,M.tx0+1,M.shY+2,M.waY,r.L);
}
function pleatSkirt(g,M,r,extend){
  const y0=M.hipY,ext=extend||5;
  for(let i=0;i<=ext+3;i++){
    const y=y0+i,x0=M.tx0-1-Math.floor(i*.8),x1=M.tx1+1+Math.floor(i*.8);
    hl(g,y,x0,x1,r.B);
    for(let x=x0+1;x<=x1;x+=3)px(g,x,y,r.D);            // 百褶
    px(g,x1,y,r.D);
  }
  hl(g,y0+ext+3,M.tx0-1-Math.floor((ext+3)*.8),M.tx1+1+Math.floor((ext+3)*.8),r.L);
}
const OUTFIT={
  tee(g,M,o){
    const r=ramp(o.c1),p=ramp(o.c2||'#4a4f60');
    bodice(g,M,r);
    hl(g,M.hipY-1,M.tx0,M.tx1,r.D);
    for(let y=M.hipY;y<=83;y++){
      if(M.tall){hl(g,y,27,30,p.B);hl(g,y,33,36,p.B);px(g,36,y,p.D);}
      else{hl(g,y,28,30,p.B);hl(g,y,33,35,p.B);px(g,35,y,p.D);}
    }
    drawShoes(g,M,o.c3||'#e8e8f0');
  },
  idolDress(g,M,o,sp){
    const r=ramp(o.c1),s=ramp(o.c2),t=o.c3;
    bodice(g,M,r,o.sleeveless);
    if(o.puff){rect(g,M.armL[0]-1,M.shY,3,4,r.B);rect(g,M.armR[0],M.shY,3,4,r.B);
      px(g,M.armL[0]-1,M.shY+3,r.D);px(g,M.armR[1]+1,M.shY+3,r.D);}
    if(t)hl(g,M.waY,M.tx0+1,M.tx1-1,t);
    pleatSkirt(g,M,s,5);
    if(t)hl(g,M.hipY+8,M.tx0-7,M.tx1+7,t);
    drawShoes(g,M,o.boots||'#ffffff');
    if(o.boots)drawBoots(g,M,o.boots,76);
  },
  gown(g,M,o,sp){
    const r=ramp(o.c1);
    bodice(g,M,r,o.sleeveless);
    const y0=M.hipY,sk=ramp(sp.skin||'#ffdcc6');
    for(let y=y0;y<=86;y++){
      let half;
      if(o.mermaid)half=y<72?5:5+Math.floor((y-72)*.7);
      else half=6+Math.floor((y-y0)*.45);
      hl(g,y,32-half,31+half,r.B);
      px(g,31+half,y,r.D);px(g,30+half,y,r.D);
      if(y%4===0)px(g,33-half,y,r.L);
    }
    if(o.slit)for(let y=68;y<=84;y++)hl(g,y,36,38,sk.B); // 高开衩
    if(o.hem)hl(g,84,32-12,31+12,o.hem);
    vl(g,29,y0+2,78,r.L);
    if(o.collar){hl(g,M.shY,M.tx0,M.tx1,o.collar);hl(g,M.shY+1,M.tx0,M.tx0+1,o.collar);hl(g,M.shY+1,M.tx1-1,M.tx1,o.collar);}
  },
  hoodie(g,M,o,sp){
    const r=ramp(o.c1),a=ramp(o.c2||o.c1);
    rect(g,28,M.fy+16,8,3,r.D);                          // 颈后兜帽堆叠
    for(let y=M.shY-1;y<=M.hipB+5;y++){
      const ex=y>M.hipB+2?3:4;
      hl(g,y,M.tx0-ex,M.tx1+ex,r.B);
      px(g,M.tx1+ex,y,r.D);px(g,M.tx1+ex-1,y,r.D);
    }
    hl(g,M.hipB+6,M.tx0-2,M.tx1+2,r.D);
    vl(g,30,M.shY+1,M.shY+6,a.L);vl(g,33,M.shY+1,M.shY+6,a.L); // 抽绳
    px(g,30,M.shY+7,a.B);px(g,33,M.shY+7,a.B);
    hl(g,M.hipB+1,M.tx0,M.tx1,r.K);                      // 口袋
    rect(g,M.armL[0]-1,M.shY,3,M.handY-M.shY,r.B);rect(g,M.armR[0],M.shY,3,M.handY-M.shY,r.B);
    px(g,M.armR[0]+2,M.handY-1,r.D);
    const p=ramp(o.c3||'#2a2435');                       // 单车短裤
    for(let y=M.hipB+7;y<=M.hipB+11;y++){hl(g,y,M.tall?27:28,30,p.B);hl(g,y,33,M.tall?36:35,p.B);}
    drawShoes(g,M,o.shoe||'#ffffff');
  },
  suit(g,M,o,sp){
    const r=ramp(o.c1),sh=ramp(o.c2||'#ffffff'),p=ramp(o.c4||o.c1);
    bodice(g,M,r);
    rect(g,30,M.shY,4,M.waY-M.shY,sh.B);                 // 衬衫V
    px(g,29,M.shY,r.K);px(g,34,M.shY,r.K);
    px(g,29,M.shY+1,r.B);px(g,34,M.shY+1,r.B);
    if(o.c3){rect(g,31,M.shY+1,2,M.waY-M.shY-1,ramp(o.c3).B);px(g,31,M.shY+1,ramp(o.c3).L);} // 领带
    hl(g,M.waY+1,M.tx0,M.tx1,r.K);
    rect(g,M.armL[0]-1,M.shY,3,M.handY-M.shY-2,r.B);rect(g,M.armR[0],M.shY,3,M.handY-M.shY-2,r.B);
    for(let y=M.hipY;y<=83;y++){
      if(M.tall){hl(g,y,26,30,p.B);hl(g,y,33,37,p.B);px(g,37,y,p.D);}
      else{hl(g,y,27,30,p.B);hl(g,y,33,36,p.B);px(g,36,y,p.D);}
    }
    drawShoes(g,M,o.shoe||'#1c1822');
  },
  jumpsuit(g,M,o,sp){
    const r=ramp(o.c1),tk=ramp(o.c2||'#26262e');
    bodice(g,M,tk,true);                                  // 内搭背心
    for(let y=M.waY;y<=83;y++){                           // 下半工装
      if(y<M.hipY){hl(g,y,M.tx0,M.tx1,r.B);px(g,M.tx1,y,r.D);}
      else{hl(g,y,M.tall?26:27,31,r.B);hl(g,y,32,M.tall?37:36,r.B);px(g,M.tall?37:36,y,r.D);}
    }
    rect(g,M.tx0-3,M.waY,3,7,r.B);rect(g,M.tx1+1,M.waY,3,7,r.B); // 系腰的袖子
    px(g,M.tx0-3,M.waY+6,r.D);px(g,M.tx1+3,M.waY+6,r.D);
    hl(g,M.waY,M.tx0-3,M.tx1+3,'#3a3026');               // 工具腰带
    rect(g,M.tx1,M.waY+1,2,3,'#8a6a3a');                 // 腰包
    drawShoes(g,M,'#5a4632');
  },
  sports(g,M,o,sp){
    const r=ramp(o.c1),lg=ramp(o.c2),sk=ramp(sp.skin||'#ffdcc6');
    for(let y=M.shY+1;y<=M.shY+6;y++){hl(g,y,M.tx0,M.tx1,r.B);px(g,M.tx1,y,r.D);}
    hl(g,M.shY+6,M.tx0,M.tx1,r.K);
    hl(g,M.waY+1,30,31,sk.D);hl(g,M.waY+3,32,33,sk.D);   // 腹肌
    if(o.c3)hl(g,M.hipY-1,M.tx0,M.tx1,o.c3);             // 腰带
    for(let y=M.hipY;y<=81;y++){
      if(M.tall){hl(g,y,27,30,lg.B);hl(g,y,33,36,lg.B);px(g,36,y,lg.D);}
      else{hl(g,y,28,30,lg.B);hl(g,y,33,35,lg.B);px(g,35,y,lg.D);}
    }
    drawShoes(g,M,'#ffffff');
  },
  cheer(g,M,o,sp){
    const r=ramp(o.c1),s=ramp(o.c2);
    for(let y=M.shY+1;y<=M.shY+7;y++){hl(g,y,M.tx0,M.tx1,r.B);px(g,M.tx1,y,r.D);}
    if(o.c3)hl(g,M.shY+7,M.tx0,M.tx1,o.c3);
    pleatSkirt(g,M,s,4);
    rect(g,M.armL[0],M.handY-6,2,5,r.B);rect(g,M.armR[0],M.handY-6,2,5,r.B); // 臂套
    drawShoes(g,M,'#ffffff');
  },
  armor(g,M,o,sp){
    const m=ramp(o.c1),s=ramp(o.c2||'#3a4a6a');
    bodice(g,M,m,true);
    hl(g,M.shY+2,M.tx0,M.tx1,m.L);hl(g,M.waY,M.tx0+1,M.tx1-1,m.K);
    if(o.c3){vl(g,32,M.shY+3,M.waY-1,o.c3);px(g,M.tx0+1,M.shY+4,o.c3);}  // 发光中缝
    rect(g,M.armL[0]-2,M.shY,4,3,m.B);rect(g,M.armR[0],M.shY,4,3,m.B);   // 肩甲
    hl(g,M.shY,M.armL[0]-2,M.armL[0]+1,m.L);hl(g,M.shY,M.armR[0],M.armR[0]+3,m.L);
    for(let i=0;i<3;i++){                                 // 甲裙
      const y=M.hipY+i*2,half=7+i;
      hl(g,y,32-half,31+half,i%2?m.B:m.D);hl(g,y+1,32-half,31+half,i%2?m.B:m.D);
      px(g,31+half,y,m.K);
    }
    rect(g,29,M.hipY+6,6,2,ramp(o.c2||'#3a4a6a').B);
    drawBoots(g,M,o.c1,74);
    if(o.c3){px(g,M.tall?28:29,78,o.c3);px(g,M.tall?35:34,78,o.c3);}
  },
  kimono(g,M,o,sp){
    const r=ramp(o.c1),ob=ramp(o.c3||'#e8a83a');
    bodice(g,M,r);
    px(g,30,M.shY,'#f2ead8');px(g,31,M.shY+1,'#f2ead8');px(g,32,M.shY+2,'#f2ead8'); // 衿
    px(g,33,M.shY+1,'#f2ead8');px(g,34,M.shY,'#f2ead8');
    rect(g,M.tx0-4,M.shY+2,4,10,r.B);rect(g,M.tx1+1,M.shY+2,4,10,r.B); // 振袖
    px(g,M.tx0-4,M.shY+11,r.D);px(g,M.tx1+4,M.shY+11,r.D);
    hl(g,M.shY+11,M.tx0-4,M.tx0-1,r.K);hl(g,M.shY+11,M.tx1+1,M.tx1+4,r.K);
    for(let y=M.waY;y<=M.waY+3;y++)hl(g,y,M.tx0,M.tx1,ob.B);          // 帯
    px(g,M.tx0+2,M.waY+1,ob.L);
    for(let y=M.waY+4;y<=85;y++){hl(g,y,M.tx0-1,M.tx1+1,r.B);px(g,M.tx1+1,y,r.D);}
    if(o.c2)for(let y=M.waY+5;y<=80;y++)hl(g,y,29,35,ramp(o.c2).B);   // 前挂(围裙)
    hl(g,85,M.tx0-1,M.tx1+1,r.K);
  },
  lolita(g,M,o,sp){
    const r=ramp(o.c1),s=ramp(o.c2||o.c1);
    bodice(g,M,r);
    vl(g,30,M.shY+1,M.waY,'#f2eaf8');vl(g,33,M.shY+1,M.waY,'#f2eaf8');  // 蕾丝竖线
    rect(g,M.armL[0]-1,M.shY,3,4,r.B);rect(g,M.armR[0],M.shY,3,4,r.B);  // 泡泡袖
    px(g,M.armL[0]-1,M.shY+3,'#f2eaf8');px(g,M.armR[1]+1,M.shY+3,'#f2eaf8');
    for(let i=0;i<=8;i++){                               // 钟形裙
      const y=M.hipY+i,half=7+Math.floor(i*.9);
      hl(g,y,32-half,31+half,s.B);
      px(g,31+half,y,s.D);px(g,30+half,y,s.D);
    }
    hl(g,M.hipY+3,32-9,31+9,'#f2eaf8');hl(g,M.hipY+8,32-14,31+14,'#f2eaf8'); // 蕾丝层
    for(let y=M.hipY+9;y<=83;y++){hl(g,y,M.tall?27:28,30,'#f6f2fa');hl(g,y,33,M.tall?36:35,'#f6f2fa');} // 白袜
    drawShoes(g,M,'#1c1822');
  },
  tailcoat(g,M,o,sp){
    const r=ramp(o.c1),p=ramp(o.c2||'#e8e0d0'),t=o.c3||'#d8b04a';
    bodice(g,M,r);
    rect(g,30,M.shY,4,5,ramp('#ffffff').B);px(g,31,M.shY+5,t);px(g,32,M.shY+5,t);
    vl(g,M.tx0,M.shY,M.waY,t);vl(g,M.tx1,M.shY,M.waY,t); // 金边
    rect(g,M.armL[0]-1,M.shY,3,2,t);rect(g,M.armR[0],M.shY,3,2,t); // 肩章
    rect(g,M.armL[0]-1,M.shY,3,M.handY-M.shY-3,r.B);rect(g,M.armR[0],M.shY,3,M.handY-M.shY-3,r.B);
    rect(g,M.tx0-1,M.hipY,2,14,r.B);rect(g,M.tx1,M.hipY,2,14,r.B); // 燕尾
    px(g,M.tx0-1,M.hipY+14,r.D);px(g,M.tx1+1,M.hipY+14,r.D);
    for(let y=M.hipY;y<=83;y++){
      if(M.tall){hl(g,y,27,30,p.B);hl(g,y,33,36,p.B);}
      else{hl(g,y,28,30,p.B);hl(g,y,33,35,p.B);}
    }
    drawBoots(g,M,'#2a2230',78);
  },
  blanket(g,M,o,sp){
    const r=ramp(o.c1),d=ramp(o.c2||o.c1);
    for(let y=M.shY-4;y<=M.hipB+8;y++){
      const half=4+Math.floor((y-(M.shY-4))*.55);
      hl(g,y,32-half,31+half,r.B);
      px(g,31+half,y,r.D);px(g,30+half,y,r.D);
    }
    for(let y=M.shY;y<=M.hipB+6;y+=4)for(let x=24;x<=40;x+=4)px(g,x+(y%8===0?2:0),y,d.L); // 毯子花纹
    hl(g,M.hipB+8,32-11,31+11,r.K);
    drawShoes(g,M,'#c8a8a0');                            // 毛绒拖鞋
  },
  slip(g,M,o,sp){
    const r=ramp(o.c1),gl=ramp(o.c3||'#1c1822'),sk=ramp(sp.skin||'#ffdcc6');
    px(g,28,M.shY,r.B);px(g,35,M.shY,r.B);               // 细肩带
    for(let y=M.shY+1;y<=M.hipB;y++){
      let x0=M.tx0,x1=M.tx1;
      if(y>=M.waY-1&&y<=M.waY+1){x0+=1;x1-=1;}
      hl(g,y,x0,x1,r.B);px(g,x1,y,r.D);
    }
    for(let y=M.hipB+1;y<=82;y++){const half=6;hl(g,y,32-half,31+half,r.B);px(g,31+half,y,r.D);}
    for(let y=66;y<=80;y++)hl(g,y,35,37,sk.B);           // 开衩
    vl(g,29,M.shY+3,76,r.L);
    for(let y=M.shY+8;y<=M.handY+3;y++){hl(g,y,M.armL[0],M.armL[1],gl.B);hl(g,y,M.armR[0],M.armR[1],gl.B);} // 长手套
    if(o.stole){hl(g,M.shY,M.tx0-2,M.tx1+2,'#f2ead8');hl(g,M.shY+1,M.tx0-2,M.tx1+2,'#e0d4c0');} // 披肩
    drawShoes(g,M,o.shoe||'#1c1822');
  },
  sundress(g,M,o,sp){
    const r=ramp(o.c1),pr=ramp(o.c2||o.c1);
    px(g,28,M.shY,r.B);px(g,35,M.shY,r.B);
    for(let y=M.shY+1;y<=M.waY;y++){hl(g,y,M.tx0,M.tx1,r.B);px(g,M.tx1,y,r.D);}
    if(o.c3)hl(g,M.waY,M.tx0,M.tx1,o.c3);                // 腰带
    for(let i=0;i<=10;i++){
      const y=M.waY+1+i,half=6+Math.floor(i*.9);
      hl(g,y,32-half,31+half,r.B);px(g,31+half,y,r.D);
      if(i%3===1){px(g,32-half+2+i,y,pr.B);px(g,31+half-3,y,pr.B);} // 印花
    }
    const hy=M.waY+11,half=6+9;
    for(let x=32-half;x<=31+half;x+=3)px(g,x,hy+1,r.B);  // 波浪裙摆
    drawShoes(g,M,'#e8c89a');
  },
  sweater(g,M,o,sp){
    const r=ramp(o.c1);
    rect(g,28,M.fy+16,8,3,r.B);hl(g,M.fy+16,28,35,r.L);hl(g,M.fy+18,28,35,r.D); // 高领
    const end=o.dress?M.hipB+6:M.hipY+2;
    for(let y=M.shY-1;y<=end;y++){
      hl(g,y,M.tx0-2,M.tx1+2,r.B);px(g,M.tx1+2,y,r.D);px(g,M.tx1+1,y,r.D);
    }
    for(let x=M.tx0;x<=M.tx1;x+=3)vl(g,x,end-4,end,r.D); // 罗纹
    hl(g,end+1,M.tx0-1,M.tx1+1,r.K);
    rect(g,M.armL[0]-1,M.shY,3,M.handY-M.shY+2,r.B);rect(g,M.armR[0],M.shY,3,M.handY-M.shY+2,r.B);
    if(o.dress){
      const so=ramp(o.c2||'#8a6a4a');                    // 过膝袜
      for(let y=74;y<=83;y++){if(M.tall){hl(g,y,27,30,so.B);hl(g,y,33,36,so.B);}else{hl(g,y,28,30,so.B);hl(g,y,33,35,so.B);}}
    }else{
      const p=ramp(o.c2||'#5a6478');                     // 长裙
      for(let i=0;i<=14;i++){const y=M.hipY+i,half=6+Math.floor(i*.5);hl(g,y,32-half,31+half,p.B);px(g,31+half,y,p.D);}
      for(let x=25;x<=38;x+=3)vl(g,x,M.hipY+10,M.hipY+14,p.D);
    }
    drawShoes(g,M,o.shoe||'#7a5230');
  },
  vest(g,M,o,sp){
    const t=ramp(o.c2||'#26222a'),v=ramp(o.c1),j=ramp(o.c3||'#3a5a8a'),sk=ramp(sp.skin||'#ffdcc6');
    bodice(g,M,t,true);
    for(let y=M.shY;y<=M.hipY-1;y++){hl(g,y,M.tx0,M.tx0+3,v.B);hl(g,y,M.tx1-3,M.tx1,v.B);px(g,M.tx1,y,v.D);}
    px(g,M.tx0+1,M.shY+3,'#ffd24a');px(g,M.tx1-1,M.shY+5,'#ff5fb0');px(g,M.tx0+2,M.shY+8,'#4ad8ff'); // 徽章
    for(let y=M.hipY;y<=83;y++){
      if(M.tall){hl(g,y,26,30,j.B);hl(g,y,33,37,j.B);px(g,37,y,j.D);}
      else{hl(g,y,27,30,j.B);hl(g,y,33,36,j.B);px(g,36,y,j.D);}
    }
    hl(g,72,M.tall?27:28,30,sk.B);hl(g,73,M.tall?27:28,30,sk.B);     // 破洞
    drawBoots(g,M,'#26222a',79);
  },
  trench(g,M,o,sp){
    const r=ramp(o.c1);
    if(o.hood){                                          // 兜帽(罩住头)
      const fy=M.fy;
      rws(g,[[fy-6,27,36],[fy-5,25,38],[fy-4,23,40],[fy-3,22,41]],r.B);
      for(let y=fy-2;y<=fy+16;y++){hl(g,y,21,23,r.B);hl(g,y,40,42,r.B);px(g,42,y,r.D);}
      hl(g,fy-3,25,30,r.L);
      if(o.strand){px(g,25,fy+8,o.strand);px(g,24,fy+12,o.strand);px(g,40,fy+10,o.strand);} // 露出发丝
    }
    for(let y=M.shY-1;y<=84;y++){
      const half=y<M.waY?7:8;
      hl(g,y,32-half,31+half,r.B);px(g,31+half,y,r.D);px(g,30+half,y,r.D);
    }
    vl(g,32,M.shY+2,82,r.K);                             // 开襟线
    rect(g,M.armL[0]-1,M.shY,3,M.handY-M.shY+2,r.B);rect(g,M.armR[0],M.shY,3,M.handY-M.shY+2,r.B);
    if(o.c3){hl(g,83,24,39,o.c3);px(g,26,80,o.c3);px(g,37,78,o.c3);px(g,30,84,o.c3);} // 发光下摆
    hl(g,M.shY,28,35,r.L);
  },
  tutu(g,M,o,sp){
    const r=ramp(o.c1),gl=ramp(o.c3||'#1c1822');
    bodice(g,M,r,true);
    hl(g,M.shY+2,M.tx0+1,M.tx1-1,r.L);
    for(let i=0;i<6;i++){                                // 羽毛裙:乱齿
      const y=M.hipY+i,half=7+i;
      for(let x=32-half;x<=31+half;x++)if((x*7+y*3)%4!==0)px(g,x,y,(x+y)%3?r.B:r.L);
    }
    for(let x=22;x<=41;x+=3)px(g,x,M.hipY+6,r.D);
    for(let y=M.shY+8;y<=M.handY+3;y++){hl(g,y,M.armL[0],M.armL[1],gl.B);hl(g,y,M.armR[0],M.armR[1],gl.B);}
    const ti=ramp('#2a2430');                            // 深色裤袜
    for(let y=M.hipY+6;y<=83;y++){if(M.tall){hl(g,y,27,30,ti.B);hl(g,y,33,36,ti.B);}else{hl(g,y,28,30,ti.B);hl(g,y,33,35,ti.B);}}
    drawShoes(g,M,'#1c1822');
  },
  apron(g,M,o,sp){
    const t=ramp(o.c2||'#ffffff'),a=ramp(o.c1),p=ramp(o.c3||'#4a3a30');
    bodice(g,M,t);
    vl(g,29,M.shY+1,M.shY+3,a.B);vl(g,34,M.shY+1,M.shY+3,a.B); // 围裙带
    for(let y=M.shY+4;y<=M.hipY+6;y++){
      const half=y<M.hipY?5:6;
      hl(g,y,32-half,31+half,a.B);px(g,31+half,y,a.D);
    }
    hl(g,M.hipY+2,29,34,a.K);                            // 口袋
    for(let y=M.hipY+7;y<=83;y++){
      if(M.tall){hl(g,y,27,30,p.B);hl(g,y,33,36,p.B);}
      else{hl(g,y,28,30,p.B);hl(g,y,33,35,p.B);}
    }
    drawShoes(g,M,'#e8e8f0');
  },
  cardigan(g,M,o,sp){
    const c=ramp(o.c1),inn=ramp(o.c2||'#ffffff'),s=ramp(o.c3||o.c1);
    bodice(g,M,inn);
    for(let y=M.shY;y<=M.hipY-1;y++){hl(g,y,M.tx0,M.tx0+3,c.B);hl(g,y,M.tx1-3,M.tx1,c.B);px(g,M.tx1,y,c.D);}
    px(g,32,M.shY+4,c.K);px(g,32,M.shY+8,c.K);           // 扣子
    rect(g,M.armL[0]-1,M.shY,3,M.handY-M.shY+1,c.B);rect(g,M.armR[0],M.shY,3,M.handY-M.shY+1,c.B);
    pleatSkirt(g,M,s,4);
    drawShoes(g,M,'#b85c3a');
  },
};

/* ============ 配件 ============ ACC[name](g,M,sp,arg) */
const ACC={
  mic(g,M,sp){
    const sk=ramp(sp.skin||'#ffdcc6'),fy=M.fy;
    hl(g,M.shY+2,M.armR[1],43,sk.B);                     // 抬臂
    rect(g,42,fy+18,3,2,sk.B);
    vl(g,43,fy+16,fy+17,'#8a8a96');
    rect(g,42,fy+12,4,4,'#3a3a45');
    dith(g,42,fy+12,45,fy+15,'#5a5a68');
    px(g,42,fy+12,'#9a9aa8');
  },
  headsetmic(g,M,sp){
    const fy=M.fy;
    hl(g,fy-1,25,38,'#2a2a38');
    rect(g,40,fy+8,2,3,'#2a2a38');
    px(g,41,fy+11,'#8a8a96');px(g,40,fy+12,'#8a8a96');px(g,39,fy+13,'#ff5fb0');
  },
  catear(g,M,sp){
    const fy=M.fy;
    hl(g,fy-2,25,38,'#26262e');
    [[25,0],[38,0]].forEach(s=>{
      px(g,s[0],fy-7,'#ff8fc8');
      hl(g,fy-6,s[0]-1,s[0]+1,'#ff8fc8');hl(g,fy-5,s[0]-2,s[0]+2,'#ff8fc8');
      hl(g,fy-4,s[0]-2,s[0]+2,'#ff8fc8');px(g,s[0],fy-5,'#ffd2e8');
    });
    rect(g,21,fy+7,3,5,'#26262e');rect(g,40,fy+7,3,5,'#26262e');
    px(g,22,fy+9,'#4ad8ff');px(g,41,fy+9,'#4ad8ff');
  },
  headphones(g,M,sp,col){
    const fy=M.fy,c=col||'#352a50';
    hl(g,fy-3,26,37,c);hl(g,fy-2,24,39,c);
    rect(g,20,fy+5,4,7,c);rect(g,40,fy+5,4,7,c);
    px(g,21,fy+7,sp.glow||'#9b6bff');px(g,41,fy+7,sp.glow||'#9b6bff');
    vl(g,20,fy+6,fy+10,ramp(c).L);
  },
  crown(g,M){
    const fy=M.fy;
    hl(g,fy-6,33,39,'#ffd24a');
    px(g,33,fy-8,'#ffd24a');px(g,36,fy-9,'#ffd24a');px(g,39,fy-8,'#ffd24a');
    px(g,33,fy-7,'#ffd24a');px(g,36,fy-8,'#ffd24a');px(g,39,fy-7,'#ffd24a');
    px(g,36,fy-7,'#ff5fb0');
  },
  beret(g,M,sp,col){
    const r=ramp(col||'#3a3050'),fy=M.fy;
    rws(g,[[fy-6,26,35],[fy-5,24,38],[fy-4,23,39],[fy-3,23,40]],r.B);
    hl(g,fy-5,26,30,r.L);px(g,31,fy-7,r.D);
  },
  glasses(g,M){
    const fy=M.fy,c='#5a4632';
    [[26,30],[33,37]].forEach(s=>{
      hl(g,fy+7,s[0],s[1],c);hl(g,fy+10,s[0],s[1],c);
      vl(g,s[0],fy+7,fy+10,c);vl(g,s[1],fy+7,fy+10,c);
    });
    hl(g,fy+8,31,32,c);
  },
  goggles(g,M){
    const fy=M.fy;
    hl(g,fy-1,23,40,'#33333d');hl(g,fy,23,40,'#33333d');
    rect(g,26,fy-3,4,3,'#ffc14a');rect(g,34,fy-3,4,3,'#ffc14a');
    px(g,26,fy-3,'#fff0c0');px(g,34,fy-3,'#fff0c0');
  },
  visor(g,M,sp){
    const fy=M.fy;
    rect(g,25,fy+7,14,3,'#16161e');
    hl(g,fy+8,26,31,sp.glow||'#4ad8ff');
    px(g,24,fy+8,'#16161e');px(g,39,fy+8,'#16161e');
  },
  halfmask(g,M,sp){
    const fy=M.fy,m=ramp('#aab0c8');
    rect(g,32,fy+5,8,9,m.B);
    vl(g,39,fy+5,fy+13,m.D);hl(g,fy+5,32,39,m.L);
    hl(g,fy+8,34,36,sp.glow||'#4af07a');
    px(g,33,fy+12,m.D);
  },
  halo(g,M,sp){
    const fy=M.fy,c=sp.glow||'#ffd24a';
    hl(g,fy-10,27,36,c);px(g,26,fy-9,c);px(g,37,fy-9,c);
  },
  antenna(g,M,sp){
    const fy=M.fy;
    vl(g,39,fy-9,fy-4,'#8a8a96');
    px(g,39,fy-10,sp.glow||'#4af07a');px(g,40,fy-9,sp.glow||'#4af07a');
  },
  ribbonback(g,M,sp,col){
    const r=ramp(col||'#ff4a6a');
    [[M.tx0-5,0],[M.tx1+2,1]].forEach(s=>{
      rect(g,s[0],M.hipY-2,4,4,r.B);
      px(g,s[0]+(s[1]?3:0),M.hipY+2,r.D);px(g,s[0]+(s[1]?2:1),M.hipY+3,r.D);
    });
    rect(g,31,M.hipY-1,2,2,r.K);
  },
  hairflower(g,M,sp,col){
    const fy=M.fy,c=col||'#ff9f5a';
    px(g,38,fy,c);px(g,40,fy,c);px(g,39,fy-1,c);px(g,39,fy+1,c);px(g,39,fy,'#fff0c0');
  },
  hairpins(g,M){
    const fy=M.fy;
    hl(g,fy+3,25,27,'#ffd24a');hl(g,fy+4,25,27,'#ffd24a');
  },
  bandana(g,M,sp,col){
    const r=ramp(col||'#d04a3a'),fy=M.fy;
    hl(g,fy-2,24,39,r.B);hl(g,fy-1,23,40,r.B);hl(g,fy,23,40,r.D);
    px(g,41,fy,r.B);px(g,42,fy+1,r.D);
  },
  towel(g,M){
    hl(g,M.shY,M.tx0-1,M.tx1+1,'#f2f2f8');hl(g,M.shY+1,M.tx0-1,M.tx1+1,'#e0e0ea');
  },
  earrings(g,M){
    const fy=M.fy;
    px(g,23,fy+13,'#ffd24a');px(g,23,fy+14,'#ffd24a');px(g,40,fy+13,'#ffd24a');px(g,40,fy+14,'#ffd24a');
  },
  pompom(g,M){
    [[M.armL[0]-3,'#ff7bc1','#ffd2e8'],[M.armR[1]-1,'#4ad8ff','#c8f2ff']].forEach(s=>{
      dith(g,s[0],M.handY-3,s[0]+4,M.handY+2,s[1],0);
      dith(g,s[0],M.handY-3,s[0]+4,M.handY+2,s[2],1);
    });
  },
  dumbbell(g,M){
    hl(g,M.handY+2,M.armR[0]-1,M.armR[1]+5,'#8a8a96');
    rect(g,M.armR[0]-1,M.handY,2,5,'#5a5a68');rect(g,M.armR[1]+4,M.handY,2,5,'#5a5a68');
  },
  wrench(g,M){
    px(g,M.armR[1]+1,M.handY,'#b8b8c4');px(g,M.armR[1]+2,M.handY+1,'#9a9aa8');
    px(g,M.armR[1]+3,M.handY+2,'#9a9aa8');rect(g,M.armR[1],M.handY-2,2,2,'#b8b8c4');
  },
  book(g,M){
    rect(g,M.armL[0]-3,M.handY-4,6,5,'#7a5230');
    rect(g,M.armL[0]-2,M.handY-3,4,3,'#e8dcc0');
    vl(g,M.armL[0],M.handY-3,M.handY-1,'#c8b89a');
  },
  mug(g,M,sp,col){
    rect(g,M.armR[0],M.handY-3,4,4,col||'#b85c3a');
    px(g,M.armR[0]+4,M.handY-2,col||'#b85c3a');
    px(g,M.armR[0]+1,M.handY-5,'#e8e8f0');px(g,M.armR[0]+2,M.handY-6,'#e8e8f0');
  },
  glass(g,M){
    rect(g,M.armR[0],M.handY-3,3,3,'#e8a83a');
    hl(g,M.handY-4,M.armR[0],M.armR[0]+2,'#f8f4ff');
  },
  bowl(g,M){
    rect(g,29,M.waY+2,7,3,'#d04a3a');hl(g,M.waY+1,30,34,'#ffffff');
    px(g,31,M.waY,'#ffffff');px(g,33,M.waY,'#ffffff');
    vl(g,36,M.waY-3,M.waY+1,'#a87f52');                  // 筷子
  },
  snack(g,M,sp){ // 鲷鱼烧
    rect(g,M.armR[0]-1,M.handY-3,5,3,'#e8b86a');
    px(g,M.armR[0],M.handY-2,'#3a2a1a');px(g,M.armR[1]+2,M.handY-3,'#c89048');
  },
  guitar(g,M,sp){
    rws(g,[[M.hipY,37,45],[M.hipY+1,36,46],[M.hipY+2,37,45],[M.hipY+3,39,43],[M.hipY+4,40,42]],'#b02a35');
    px(g,40,M.hipY+1,'#ffd24a');px(g,42,M.hipY+1,'#ff7a3a');     // 火焰漆
    for(let i=0;i<8;i++)px(g,45+Math.floor(i*.5),M.hipY-1-i,'#7a5230'); // 琴颈
    rect(g,48,M.hipY-10,3,2,'#3a2a1a');
  },
  holowing(g,M,sp){
    const c=sp.glow||'#7af0ea',y=M.shY;
    [[1,-1],[0,1]].forEach(s=>{
      const m=s[1];
      for(let i=0;i<6;i++){
        const x=32+m*(9+i),yy=y+1+i-(i>2?(i-2)*2:0);
        px(g,x,yy,c);if(i%2)px(g,x,yy+1,c);
      }
      px(g,32+m*10,y+6,c);px(g,32+m*12,y+8,c);
    });
  },
  speaker(g,M,sp){
    rect(g,44,M.shY+1,6,9,'#26262e');
    rect(g,45,M.shY+2,4,4,'#16161e');
    px(g,46,M.shY+3,sp.glow||'#9b6bff');px(g,47,M.shY+4,sp.glow||'#9b6bff');
    hl(g,M.shY+8,45,48,sp.glow||'#9b6bff');
  },
  dolljoint(g,M,sp){
    hl(g,M.shY+8,M.armL[0],M.armL[1],'#c8b8d8');hl(g,M.shY+8,M.armR[0],M.armR[1],'#c8b8d8');
    px(g,M.armL[0],M.handY-4,'#c8b8d8');px(g,M.armR[1],M.handY-4,'#c8b8d8');
  },
  earpiece(g,M){
    px(g,40,M.fy+10,'#16161e');px(g,41,M.fy+11,'#16161e');vl(g,41,M.fy+12,M.fy+15,'#3a3a45');
  },
  rose(g,M){
    rect(g,M.armL[0]-1,M.handY-4,3,3,'#d0304a');px(g,M.armL[0],M.handY-4,'#ff7088');
    vl(g,M.armL[0],M.handY-1,M.handY+2,'#3a7a3a');
  },
  smudge(g,M){
    px(g,26,M.fy+12,'#8a7a6a');px(g,27,M.fy+13,'#8a7a6a');
  },
  minihat(g,M,sp,col){
    const r=ramp(col||'#5a2438'),fy=M.fy;
    rect(g,34,fy-9,6,3,r.B);hl(g,fy-6,32,42,r.B);hl(g,fy-9,34,39,r.L);
    px(g,35,fy-7,'#ffd24a');
  },
};

/* ============ 特效（叠加层,不参与描边） ============ */
function spark5(g,x,y,c){px(g,x,y,c);px(g,x-1,y,c);px(g,x+1,y,c);px(g,x,y-1,c);px(g,x,y+1,c);}
function heart5(g,x,y,c){px(g,x,y,c);px(g,x+2,y,c);hl(g,y+1,x-1,x+3,c);hl(g,y+2,x,x+2,c);px(g,x+1,y+3,c);}
const FX={
  sparkle(g,sp,c){c=c||'#7af0ea';spark5(g,12,18,c);spark5(g,52,26,c);px(g,14,44,c);px(g,50,48,c);px(g,10,60,c);},
  heart(g,sp,c){c=c||'#ff7bc1';heart5(g,49,14,c);px(g,12,26,c);heart5(g,10,44,c);px(g,52,52,c);},
  moon(g,sp,c){c=c||'#cfe6ff';vl(g,12,14,18,c);px(g,13,13,c);px(g,13,19,c);px(g,14,12,c);px(g,14,20,c);px(g,50,40,c);},
  snow(g,sp,c){c=c||'#dff2ff';spark5(g,13,16,c);spark5(g,51,30,c);px(g,15,42,c);px(g,49,52,c);px(g,11,58,c);},
  bolt(g,sp,c){c=c||'#ffd24a';px(g,50,16,c);px(g,49,17,c);px(g,50,18,c);px(g,49,19,c);hl(g,17,49,51,c);px(g,13,38,c);px(g,12,39,c);},
  note(g,sp,c){c=c||'#9b6bff';vl(g,51,14,19,c);rect(g,49,18,2,2,c);px(g,52,14,c);px(g,52,15,c);vl(g,12,34,38,c);rect(g,10,37,2,2,c);},
  flame(g,sp){px(g,13,72,'#ffd24a');px(g,13,70,'#ff7a3a');px(g,12,74,'#ff7a3a');px(g,51,74,'#ffd24a');px(g,51,72,'#ff7a3a');px(g,52,76,'#ff4a2a');},
  code(g,sp){const c='#4af07a';vl(g,11,20,24,c);px(g,11,27,c);vl(g,13,32,34,c);vl(g,52,28,31,c);px(g,52,35,c);vl(g,50,16,17,c);px(g,50,21,c);},
  sun(g,sp){const c='#ffd24a';spark5(g,51,15,c);px(g,48,12,c);px(g,54,12,c);px(g,48,18,c);px(g,54,18,c);px(g,51,11,'#fff0c0');},
  feather(g,sp){const c='#5a5468';px(g,12,22,c);px(g,13,23,c);px(g,12,24,c);px(g,50,38,c);px(g,51,39,c);px(g,14,52,c);px(g,15,53,c);},
  zzz(g,sp){const c='#8a93a5';hl(g,12,46,49,c);px(g,48,13,c);px(g,47,14,c);hl(g,15,46,49,c);hl(g,20,51,53,c);px(g,52,21,c);hl(g,22,51,53,c);},
  question(g,sp,c){c=c||'#b07bff';hl(g,12,48,51,c);px(g,52,13,c);px(g,52,14,c);px(g,50,15,c);px(g,50,16,c);px(g,50,18,c);px(g,11,40,c);},
};

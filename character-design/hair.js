/* ============ 头发库 ============
   h = {cap, side, back, extra, blen, wave, c, c2(挑染/发尾), ac(发饰)} */

function skullDome(g,M,r){
  const fy=M.fy;
  rws(g,[[fy-4,27,36],[fy-3,25,38],[fy-2,24,39],[fy-1,23,40],[fy,23,40],[fy+1,23,40]],r.B);
  hl(g,fy-3,27,32,r.L);hl(g,fy-2,25,29,r.L);
  px(g,40,fy,r.D);px(g,40,fy+1,r.D);
}

/* ---- 后发（画在身体之前） ---- */
const HAIRB={
  none(){},
  straight(g,M,h){
    const r=ramp(h.c),fy=M.fy,len=h.blen||22;
    for(let i=-2;i<=len;i++){
      let wob=0;
      if(h.wave)wob=[0,1,1,0,-1,-1][((i+6)>>1)%6];
      const c=(h.c2&&i>len-5)?ramp(h.c2).B:r.B;
      hl(g,fy+i,21+wob,42+wob,c);
      px(g,42+wob,fy+i,r.D);px(g,41+wob,fy+i,r.D);
    }
    for(let x=22;x<=41;x+=3)px(g,x,fy+len+1,(h.c2?ramp(h.c2):r).B); // 发尾齿
    vl(g,23,fy+4,fy+12,r.L);
  },
  shag(g,M,h){ /* 狼尾:碎层次 */
    HAIRB.straight(g,M,h);
    const r=ramp(h.c),fy=M.fy,len=h.blen||22;
    for(let i=4;i<len;i+=3){px(g,20,fy+i,r.B);px(g,43,fy+i+1,r.B);}
    for(let x=21;x<=42;x+=4)vl(g,x,fy+len-3,fy+len+2,r.D);
  },
  mane(g,M,h){ /* 狂野鬃毛 */
    const r=ramp(h.c),fy=M.fy,len=h.blen||26;
    for(let i=-2;i<=len;i++){
      const wob=[0,2,1,2,0,1][((i+6)>>1)%6];
      hl(g,fy+i,19-wob,44+wob,r.B);
      if(i%3===0){px(g,18-wob,fy+i,r.B);px(g,45+wob,fy+i,r.B);}
      px(g,44+wob,fy+i,r.D);
    }
    for(let x=19;x<=44;x+=3){px(g,x,fy+len+1,r.B);px(g,x+1,fy+len+2,r.D);}
    vl(g,22,fy+2,fy+10,r.L);
  },
};

/* ---- 头顶/刘海 ---- */
const HAIRF={
  zig(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    skullDome(g,M,r);
    rws(g,[[fy+2,23,40],[fy+3,23,40],[fy+4,23,40]],r.B);
    [[23,26],[28,31],[33,36],[38,40]].forEach(s=>hl(g,fy+5,s[0],s[1],r.B));
    [24,29,34,39].forEach(x=>px(g,x,fy+6,r.B));
    hl(g,fy+4,24,39,r.D);hl(g,fy+2,24,30,r.L);
  },
  blunt(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    skullDome(g,M,r);
    rws(g,[[fy+2,23,40],[fy+3,23,40],[fy+4,23,40],[fy+5,23,40]],r.B);
    hl(g,fy+5,24,39,r.D);hl(g,fy+2,25,31,r.L);
  },
  swept(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    skullDome(g,M,r);
    rws(g,[[fy+2,23,40],[fy+3,23,38],[fy+4,23,34],[fy+5,23,29],[fy+6,23,26]],r.B);
    px(g,27,fy+6,r.B);px(g,35,fy+4,r.D);px(g,30,fy+5,r.D);
    hl(g,fy+2,24,30,r.L);
  },
  parted(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    skullDome(g,M,r);
    rws(g,[[fy+2,23,28],[fy+3,23,27],[fy+4,23,26],[fy+5,23,25]],r.B);
    rws(g,[[fy+2,35,40],[fy+3,36,40],[fy+4,37,40],[fy+5,38,40]],r.B);
    px(g,24,fy+6,r.B);px(g,39,fy+6,r.B);
    px(g,28,fy+3,r.D);px(g,35,fy+3,r.D);
  },
  slick(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    rws(g,[[fy-6,27,36],[fy-5,25,38]],r.B);
    skullDome(g,M,r);
    vl(g,27,fy-5,fy,r.L);vl(g,31,fy-6,fy,r.L);vl(g,35,fy-5,fy,r.D);
    px(g,31,fy+2,r.B);px(g,32,fy+2,r.B);px(g,31,fy+3,r.B); // 美人尖
  },
  shaved(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    rws(g,[[fy-4,28,37],[fy-3,26,39],[fy-2,25,40],[fy-1,24,40],[fy,24,40],[fy+1,25,40]],r.B);
    [[fy-5,30],[fy-5,34],[fy-4,38],[fy-6,32]].forEach(p=>px(g,p[1],p[0],r.B)); // 炸毛
    rws(g,[[fy+2,28,40],[fy+3,30,40],[fy+4,33,40],[fy+5,36,40]],r.B);
    px(g,38,fy+6,r.B);
    dith(g,24,fy+2,27,fy+5,r.K);                        // 铲青
    hl(g,fy-3,28,33,r.L);
  },
  overeye(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    skullDome(g,M,r);
    rws(g,[[fy+2,23,40],[fy+3,23,40],[fy+4,23,40]],r.B);
    [[23,26],[28,30]].forEach(s=>hl(g,fy+5,s[0],s[1],r.B));
    px(g,24,fy+6,r.B);px(g,29,fy+6,r.B);
    for(let y=fy+5;y<=fy+12;y++)hl(g,y,33,40,r.B);       // 遮右眼帘
    px(g,34,fy+13,r.B);px(g,37,fy+13,r.B);px(g,40,fy+13,r.B);
    vl(g,34,fy+6,fy+11,r.D);
    hl(g,fy+2,24,30,r.L);
  },
  messy(g,M,h){
    HAIRF.zig(g,M,h);
    const r=ramp(h.c),fy=M.fy;
    [[22,fy-2],[41,fy-3],[22,fy+1],[42,fy]].forEach(p=>px(g,p[0],p[1],r.B));
    px(g,31,fy-6,r.B);px(g,32,fy-7,r.B);px(g,33,fy-6,r.B); // 呆毛
  },
  mohawk(g,M,h){
    const r=ramp(h.c),c2=ramp(h.c2||h.c),fy=M.fy;
    rws(g,[[fy-1,24,39],[fy,23,40],[fy+1,23,40]],r.B);
    dith(g,24,fy+2,27,fy+5,r.K);dith(g,36,fy+2,40,fy+5,r.K); // 两侧铲
    rws(g,[[fy-8,30,33],[fy-7,29,34],[fy-6,29,34],[fy-5,28,35],[fy-4,28,35],[fy-3,27,36],[fy-2,26,37]],r.B);
    [[29,fy-9],[32,fy-10],[35,fy-9]].forEach(p=>{px(g,p[0],p[1],c2.B);px(g,p[0],p[1]+1,c2.B);});
    vl(g,30,fy-7,fy-2,r.L);
    rws(g,[[fy+2,28,35],[fy+3,29,34]],r.B);px(g,31,fy+4,r.B);px(g,34,fy+4,r.B);
  },
};

/* ---- 侧发 ---- */
const HAIRS={
  none(){},
  short(g,M,h){ /* 波波头侧帘 */
    const r=ramp(h.c),fy=M.fy;
    for(let y=fy;y<=fy+13;y++){hl(g,y,22,23,r.B);hl(g,y,40,41,r.B);px(g,41,y,r.D);}
    hl(g,fy+14,23,24,r.B);hl(g,fy+14,39,40,r.B);
    px(g,24,fy+15,r.B);px(g,38,fy+15,r.B);              // 内扣
    vl(g,22,fy+2,fy+8,r.L);
  },
  chest(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    for(let y=fy;y<=fy+20;y++){hl(g,y,22,23,r.B);hl(g,y,40,41,r.B);px(g,41,y,r.D);}
    px(g,22,fy+21,r.B);px(g,41,fy+21,r.B);px(g,23,fy+22,(h.c2?ramp(h.c2):r).B);px(g,40,fy+22,(h.c2?ramp(h.c2):r).B);
    vl(g,22,fy+2,fy+10,r.L);
  },
  tuft(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    for(let y=fy;y<=fy+7;y++){hl(g,y,22,23,r.B);hl(g,y,40,41,r.B);}
  },
};

/* ---- 特征件（马尾/卷/辫/髻…画在最上层） ---- */
const HAIRX={
  drills(g,M,h){ /* 双钻头卷 */
    const r=ramp(h.c),tip=ramp(h.c2||h.c),fy=M.fy;
    [[18,1],[45,-1]].forEach(side=>{
      const sx=side[0];
      for(let k=0;k<4;k++){
        const top=fy+2+k*5,off=(k%2)*side[1];
        rws(g,[[top,sx-2+off,sx+2+off],[top+1,sx-3+off,sx+3+off],[top+2,sx-3+off,sx+3+off],[top+3,sx-2+off,sx+2+off]],k===3?tip.B:r.B);
        hl(g,top+4,sx-1+off,sx+1+off,r.D);
        hl(g,top+1,sx-2+off,sx+off,r.L);
      }
      px(g,sx,fy+23,tip.B);px(g,sx,fy+24,tip.D);
    });
    hl(g,fy+1,21,24,r.B);hl(g,fy+1,39,42,r.B);          // 与头顶连接
  },
  twinhigh(g,M,h){
    const r=ramp(h.c),tip=ramp(h.c2||h.c),fy=M.fy,len=h.blen||20;
    [[0,-1],[63,1]].forEach(side=>{
      const m=side[1]; // -1左 1右
      const bx=m<0?21:42;
      rws(g,[[fy-3,bx-2*0+(m<0?-2:0),bx+(m<0?0:2)]],r.B);
      for(let i=0;i<len;i++){
        const sway=i<4?-m*(4-i):(i>len-6?m:0);
        const x0=(m<0?17:43)+sway,w=i>len-5?2:3;
        hl(g,fy-2+i,x0,x0+w,i>len-4?tip.B:r.B);
        if(m>0)px(g,x0+w,fy-2+i,r.D);
      }
      const tx=(m<0?18:46);
      px(g,tx,fy-2+len,tip.B);px(g,tx+m,fy-1+len,tip.D);
      rect(g,m<0?20:42,fy-2,2,2,h.ac||'#ffffff');        // 发圈
    });
  },
  ponyhigh(g,M,h){
    const r=ramp(h.c),tip=ramp(h.c2||h.c),fy=M.fy,len=h.blen||24;
    rws(g,[[fy-7,29,34],[fy-6,28,35],[fy-5,28,35]],r.B); // 束髻
    rect(g,33,fy-5,2,2,h.ac||'#ffffff');
    for(let i=0;i<len;i++){
      let x0;
      if(i<3)x0=36+i;else if(i<8)x0=40;else if(i<14)x0=41;else x0=40;
      const w=i<10?4:3;
      hl(g,fy-4+i,x0,x0+w,i>len-5?tip.B:r.B);
      px(g,x0+w,fy-4+i,r.D);
      if(i%5===2)px(g,x0,fy-4+i,r.L);
    }
    px(g,39,fy-4+len,tip.B);px(g,38,fy-3+len,tip.D);     // 尾尖回勾
  },
  ponyside(g,M,h){
    const r=ramp(h.c),fy=M.fy,len=h.blen||20;
    rect(g,22,fy+13,3,2,h.ac||'#ffffff');
    for(let i=0;i<len;i++){
      const wob=[0,0,1,1,0,-1][((i)>>1)%6];
      const x0=18+wob;
      hl(g,fy+15+i,x0,x0+3,r.B);
      if(i%4===1)px(g,x0,fy+15+i,r.L);
    }
    px(g,19,fy+15+len,r.D);
  },
  braidtwin(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    [[20,0],[41,1]].forEach(side=>{
      const bx=side[0];
      for(let k=0;k<6;k++){
        const y=fy+5+k*3,wide=k%2===0;
        if(wide)rws(g,[[y,bx,bx+3],[y+1,bx,bx+3],[y+2,bx+1,bx+2]],r.B);
        else rws(g,[[y,bx+1,bx+2],[y+1,bx,bx+3],[y+2,bx,bx+3]],r.B);
        hl(g,y+2,bx+1,bx+2,r.D);
      }
      rect(g,bx+1,fy+23,2,2,h.ac||'#ff4a6a');            // 辫尾结
      px(g,bx+1,fy+25,r.B);px(g,bx+2,fy+25,r.B);
    });
  },
  braidside(g,M,h){ /* 单侧前辫(垂在胸前) */
    const r=ramp(h.c),fy=M.fy;
    for(let k=0;k<7;k++){
      const y=fy+12+k*3,wide=k%2===0;
      const bx=24;
      if(wide)rws(g,[[y,bx,bx+3],[y+1,bx,bx+3],[y+2,bx+1,bx+2]],r.B);
      else rws(g,[[y,bx+1,bx+2],[y+1,bx,bx+3],[y+2,bx,bx+3]],r.B);
      hl(g,y+2,bx+1,bx+2,r.D);
    }
    rect(g,25,fy+33,2,2,h.ac||'#cfa2ff');
  },
  buns(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    [[21,0],[42,1]].forEach(s=>{
      const bx=s[0];
      rws(g,[[fy-6,bx-1,bx+1],[fy-5,bx-2,bx+2],[fy-4,bx-2,bx+2],[fy-3,bx-1,bx+1]],r.B);
      px(g,bx,fy-5,r.L);px(g,bx+1,fy-4,r.D);
    });
  },
  buntop(g,M,h){ /* 芭蕾髻 */
    const r=ramp(h.c),fy=M.fy;
    rws(g,[[fy-8,29,34],[fy-7,28,35],[fy-6,28,35],[fy-5,29,34]],r.B);
    hl(g,fy-7,29,31,r.L);hl(g,fy-5,30,33,r.D);
  },
  topknot(g,M,h){ /* 公主半扎 */
    const r=ramp(h.c),fy=M.fy;
    rws(g,[[fy-7,29,34],[fy-6,28,35],[fy-5,29,34]],r.B);
    rect(g,31,fy-5,2,1,h.ac||'#ff4a6a');
  },
  ringlets(g,M,h){ /* 竖卷(茶会) */
    const r=ramp(h.c),fy=M.fy;
    [[19,1],[42,-1]].forEach(side=>{
      const sx=side[0];
      for(let k=0;k<3;k++){
        const top=fy+2+k*4,off=(k%2)*side[1];
        rws(g,[[top,sx+off,sx+3+off],[top+1,sx-1+off,sx+3+off],[top+2,sx-1+off,sx+3+off],[top+3,sx+off,sx+2+off]],r.B);
        hl(g,top+1,sx+off,sx+1+off,r.L);hl(g,top+3,sx+1+off,sx+2+off,r.D);
      }
    });
  },
  marcel(g,M,h){ /* 指推波纹光 */
    const r=ramp(h.c),fy=M.fy;
    hl(g,fy+1,24,30,r.L);hl(g,fy+2,28,34,r.L);
    hl(g,fy+4,23,26,r.L);hl(g,fy+7,22,24,r.L);hl(g,fy+7,39,41,r.L);
  },
  sidefall(g,M,h){ /* 好莱坞单侧波浪(垂左肩前) */
    const r=ramp(h.c),fy=M.fy,len=h.blen||26;
    for(let i=0;i<len;i++){
      const wob=[0,1,2,2,1,0][((i)>>1)%6];
      const x0=20+wob;
      hl(g,fy+4+i,x0,x0+4,r.B);
      if(i%4===0)px(g,x0+1,fy+4+i,r.L);
      px(g,x0+4,fy+4+i,r.D);
    }
    px(g,23,fy+4+len,r.B);px(g,25,fy+4+len,r.B);
  },
  updo(g,M,h){ /* 老板娘盘发+簪 */
    const r=ramp(h.c),fy=M.fy;
    rws(g,[[fy-7,27,38],[fy-6,26,39],[fy-5,26,39]],r.B);
    hl(g,fy-6,28,32,r.L);
    px(g,25,fy-7,'#ffd24a');px(g,24,fy-8,'#ffd24a');px(g,23,fy-9,'#ffd24a');px(g,22,fy-10,'#e8a83a'); // 簪
  },
  scan(g,M,h){ /* 全息扫描线(谜语AI) */
    const c=h.c2||'#bff4ff',fy=M.fy;
    for(let y=fy-3;y<=fy+14;y+=3){hl(g,y,22,23,c);hl(g,y,40,41,c);}
    hl(g,fy-3,27,33,c);hl(g,fy+3,25,28,c);
  },
  catears(g,M,h){ /* 发色猫耳尖(爵士猫) */
    const r=ramp(h.c),fy=M.fy;
    [[25,0],[38,0]].forEach(s=>{
      px(g,s[0],fy-6,r.B);hl(g,fy-5,s[0]-1,s[0]+1,r.B);hl(g,fy-4,s[0]-1,s[0]+1,r.B);
    });
  },
  ahoge(g,M,h){
    const r=ramp(h.c),fy=M.fy;
    px(g,31,fy-6,r.B);px(g,32,fy-7,r.B);px(g,33,fy-6,r.B);px(g,33,fy-5,r.B);
  },
};

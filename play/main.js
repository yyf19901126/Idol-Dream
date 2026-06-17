/* ============《后巷偶像》主程序 ============ */
let AW=800; const AH=900,WALL=18;   // 战场：AH 固定(精灵尺寸基准)，AW 随中栏宽高比动态铺满
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist2=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

/* ---------- 全屏自适应布局 ---------- */
let STREAM_SCALE=1, streamHit=0, cutscene=null;   // streamHit:受击; cutscene:改造进化过场
function wrapCN(t,n){const o=[];for(let i=0;i<t.length;i+=n)o.push(t.slice(i,i+n));return o;}
function roundRect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
const STREAM_W=300,STREAM_H=450;          // 立绘窗逻辑尺寸 2:3，正好匹配房间背景图与立绘
function fitLayout(){
  const lc=$('leftcol'),scv=$('streamCv'),box=$('streamWrap'),stage=$('stage');
  /* 1) 左栏宽 = 人物框宽（2:3，受高度上限约束）→ 人物框与下方数据框始终同宽对齐 */
  if(lc&&scv&&box){
    const colH=lc.clientHeight||window.innerHeight;
    const natW=Math.max(260,Math.min(window.innerWidth*0.21,360));    // 左栏自然宽（略收窄，给游戏区让位）
    const maxH=colH*0.52;                                             // 人物框高度上限（其余留给下方数据面板）
    const pw=Math.max(220,Math.round(Math.min(natW,maxH*STREAM_W/STREAM_H)));  // 2:3：宽=高/1.5
    const scale=pw/STREAM_W, ph=Math.round(STREAM_H*scale);
    lc.style.width=pw+'px';                                           // 左栏定宽=人物框宽 → 整列(人物框+数据框)同宽
    box.style.width='';box.style.alignSelf='';box.style.height=ph+'px';  // 框随列宽 100%，无侧边黑条
    scv.width=pw;scv.height=ph;scv.style.width=pw+'px';scv.style.height=ph+'px';
    STREAM_SCALE=scale;
  }
  /* 2) 战场画布按中栏宽高比铺满（在左栏定宽后测量，吃到让出的空间） */
  if(stage){
    const sw=stage.clientWidth,sh=stage.clientHeight;
    if(sw>0&&sh>0){
      const newAW=clamp(Math.round(AH*sw/sh),640,1800);
      if(newAW!==AW){AW=newAW;if(floorCv)makeFloor();}
      cv.width=AW;cv.height=AH;ctx.imageSmoothingEnabled=false;
      cv.style.width=sw+'px';cv.style.height=sh+'px';
      P.x=clamp(P.x,WALL+10,AW-WALL-10);P.y=clamp(P.y,WALL+34,AH-WALL-4);
    }
  }
}
addEventListener('resize',fitLayout);

/* ---------- 全局状态 ---------- */
let ESPR,COIN,HOLO;
/* 大招 cut-in 立绘（按需懒加载，仅当前形态会用到一张） */
const ULT_IMG={};
let _ultBurst=null;                                       // 大招集中线低分辨率离屏画布（放大成像素块）
function getUltImg(code){
  if(ULT_IMG[code]!==undefined)return ULT_IMG[code];
  const im=new Image();im.src='art/ult/'+code+'.jpg';ULT_IMG[code]=im;return im;
}
/* 敌人贴图（Seedream 粗像素，绿幕抠透明）；加载完即用，未加载回退程序化 ESPR */
const ENEMY_IMG={};
['luren','shuijun','penzi','baipiao','duijia','heifen','leping','boss'].forEach(t=>{
  const im=new Image();im.onload=()=>{if(im.width)ENEMY_IMG[t]=im;};im.src='art/enemies/'+t+'.png?v=px1';
});
const G={
  scr:'start',          // start play modal over win
  wave:0,waveT:0,waveDur:0,spawnAcc:0,elSched:[],
  enemies:[],bullets:[],ebullets:[],drops:[],zones:[],clones:[],fx:[],floats:[],allies:[],fields:[],
  gold:0,kills:0,giftN:0,totalGold:0,
  xp:0,level:1,xpNext:10,queuedLv:0,
  noHit:true,shake:0,tIncome:0,bossRef:null,
  posCd:0,negT:2.5,god:false,
  likes:0,dislikes:0,            // 模拟直播间点赞/点踩累计（比例≈好评/差评，总量≈人气）
};
const P={
  x:AW/2,y:AH/2,hp:90,face:1,moving:false,bob:0,
  mods:[],weapons:[{id:'mic',lvl:1,cd:0}],
  agg:{},                       // 三层数值累加器（道具/升级写入；ST 折叠改造轴+套装）
  setN:{}, setFx:{},            // 套装计数 / 套装派生效果
  ift:0,heat:0,skillCd:0,orbA:0,itemNames:[],itemIds:[],
  nextHitBonus:0,giftAcc:0,reviveLeft:0,
};
const A=k=>P.agg[k]||0;
function setBonuses(){const b={};for(const s in SETS)if((P.setN[s]||0)>=SETS[s].n)SETS[s].apply(b);return b;}
function recalcSets(){P.setFx=setBonuses();}
/* 层1 可见能力值 + 层2 隐藏值 + 层3 机制位 的实时结算（§2.2/§2.3/§2.4） */
function ST(){
  const m=P.mods,s=P.setFx||{};
  let maxhp=80+A('maxhp'), regen=A('regen')+(s.regen||0), lifesteal=A('lifesteal');
  let dmg=A('dmg')+(s.dmg||0)+(P._brave||0)+(P._perma||0)+(P._cashBuff||0)+(P._compound||0), dmgMelee=A('dmgMelee'), dmgRanged=A('dmgRanged'),
      dmgElem=A('dmgElem')+(s.dmgElem||0), engi=A('engi')+(s.engi||0);
  let aspd=A('aspd'), crit=.03+A('crit'), range=A('range'), armor=A('armor'), dodge=A('dodge');
  let speed=1+A('speed'), luck=A('luck'), harvest=A('harvest'),
      xp=A('xp')+(s.xp||0), gold=A('gold')+(s.gold||0);
  const _b=(P._skT>0&&P.activeSkill&&P.activeSkill.buff)||{};   // 释放中的主动技 buff
  if(m.length===0)speed*=.82;                       // 原点大叔慢
  if(m[0]==='L'){speed+=.18;dodge+=.12;maxhp*=.82;}                 // ① 轻盈
  if(m[0]==='H'){maxhp*=1.25;speed-=.06;dmgMelee+=.18;}             // ① 重核
  if(m[1]==='S')aspd+=.15;                                           // ② 甜嗓：攻速（+1穿透见下）
  if(m[1]==='D')range+=.18;                                          // ② 磁嗓：范围（震慑波在 killEnemy）
  if(m[2]==='C')dmg+=.20;                                            // ③ 义体过载：全武器+20%（充能在 fireWeapon）
  if(m[2]==='B'){regen+=1.2;xp+=.12;dmg+=Math.min(8,(P._bio||0))*.04;}  // ③ 生体：无伤叠层(≤+32%)
  if(m[3]==='Y')dmg+=Math.min(P.heat,100)/100*.30;                  // ④ 元气：热度增伤(≤+30%)
  const nCrit=(m[3]==='N')?.25:0;                                    // ④ 冷艳：暴击区
  if(m[3]==='N')crit+=.12;
  if(m[4]==='T')gold+=.25;
  if(P.passiveSkill&&P.passiveSkill.dmgFn)dmg+=P.passiveSkill.dmgFn(Math.round(Math.max(1,maxhp)));  // 丧系/午夜动态增伤
  if(P._grpFix)dmgMelee+=P._grpFix; if(P._eatFix)dmgMelee+=P._eatFix;                                 // 健身/干饭固化
  if(P._allBuff>0){dmg+=.05;aspd+=.05;}                             // 居酒屋·敬一杯
  if(_b.spd)speed+=_b.spd; if(_b.aspd)aspd+=_b.aspd; if(_b.dmg)dmg+=_b.dmg; if(_b.crit)crit+=_b.crit;
  if(_b.armor)armor+=_b.armor; if(_b.range)range+=_b.range;
  if(A('noLifesteal'))lifesteal=0;                  // 共生菌株代价
  if(A('hpScale'))maxhp*=A('hpScale');
  return{
    maxhp:Math.round(Math.max(1,maxhp)), regen, lifesteal,
    dmg, dmgMelee, dmgRanged, dmgElem, engi,
    aspd, crit:Math.min(1,crit), range, armor, dodge:Math.min(.6,dodge),
    speed, luck, harvest, xp, gold,
    critMult:Math.min(3.0,1.8+A('critMult')+nCrit), pickup:200+A('pickup'),
    bounce:A('bounce'),pierce:A('pierce')+(m[1]==='S'?1:0)+(_b.pierce||0),multishot:A('multishot')+(_b.multishot||0),split:A('split'),
    homing:A('homing')+(_b.homing||0),orbit:A('orbit'),chain:A('chain'),knockback:A('knockback'),
    projSpd:1+A('projSpd'),projSize:1+A('projSize'),procLuck:A('procLuck'),
    burn:A('burn'),shock:A('shock'),poison:A('poison'),chill:A('chill'),vuln:A('vuln'),statusVuln:A('statusVuln'),
  };
}
/* §2.8 加法区：全局魅力 + 武器 scales 权重×对应伤害能力值 + 协同(+35%) 全部加算；软上限 +400%。品阶/暴击/状态走各自乘区 */
const DMG_STATS=['dmgMelee','dmgRanged','dmgElem','engi'];   // scales 里只有这几项真正驱动伤害；aspd/crit/range 走全局
function wAddBracket(d,st){
  let add=st.dmg;                                    // 全局魅力
  const sc=d.scales||{};
  for(const k of DMG_STATS)if(sc[k])add+=sc[k]*st[k]; // scales：这把武器吃哪些伤害项、各占多少权重
  if((!sc.dmgMelee&&!sc.dmgRanged&&!sc.dmgElem&&!sc.engi)){ // 没声明伤害类 scales 的（如反光板 dmg:1）→ 退回类别
    if(d.cat==='melee')add+=st.dmgMelee; else if(d.cat==='ranged')add+=st.dmgRanged;
    else if(d.cat==='tech'||d.cat==='zone')add+=st.dmgElem*0.5+st.engi*0.5; else add+=st.engi;
  }
  if(d.syn&&P.mods.includes(d.syn))add+=0.35;        // 协同→加法区
  return 1+Math.min(add,4.0);
}

/* ---------- 输入 ---------- */
const keys={};
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  audioInit();                                   // 任意按键激活音频上下文（满足浏览器自动播放策略）
  keys[e.key.toLowerCase()]=1;
  if(e.key===' ')castSkill();
  if(e.key==='m'||e.key==='M'){SFX_ON=!SFX_ON;toast(SFX_ON?'🔊 声音开':'🔇 全部静音');updateSfxBtn&&updateSfxBtn();updateMusicGain&&updateMusicGain();}
  if(e.key==='n'||e.key==='N'){musicOn=!musicOn;updateMusicGain&&updateMusicGain();toast(musicOn?'🎵 音乐开':'🎵 音乐关');}
  if(e.key==='`'||e.key==='~')toggleDev();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);

/* ---------- 浮字/特效/弹幕 ---------- */
function float(x,y,txt,col,opt){G.floats.push({x,y,txt,col:col||'#fff',t:0,crit:opt&&opt.crit,sz:(opt&&opt.sz)||1,vy:(opt&&opt.vy)||0});if(G.floats.length>44)G.floats.shift();}
function toast(msg){const t=$('toast');t.textContent=msg;t.style.opacity=1;clearTimeout(t._h);t._h=setTimeout(()=>t.style.opacity=0,1600);}
function fx(o){o.t=0;G.fx.push(o);if(G.fx.length>120)G.fx.shift();}
/* ===== 打击感（juice）：顿帧 / 屏震 / 程序化音效 ===== */
function addShake(v){G.shake=Math.max(G.shake||0,v);}
function hitStop(s){ if((G._hsCd||0)>0)return; G._hsCd=0.10; G.hitStop=Math.min(0.09,Math.max(G.hitStop||0,s)); }  // 顿帧（带 0.1s 冷却，群战不糊）
/* WebAudio 程序化音效（无音频资源；首次用户手势后激活） */
let AC=null, masterGain=null, musicGain=null, SFX_ON=true; const _sfxT={};
function audioInit(){
  try{ if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();
    masterGain=AC.createGain(); masterGain.gain.value=0.22; masterGain.connect(AC.destination);
    musicGain=AC.createGain(); musicGain.gain.value=0; musicGain.connect(AC.destination);   // 背景音乐独立音量
  } }catch(e){ AC=null; return; }
  if(AC.state==='suspended')AC.resume();
}
function _osc(freq,dur,type,vol,slideTo,t0){
  if(!AC)return; t0=t0||AC.currentTime;
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(freq,t0);
  if(slideTo)o.frequency.exponentialRampToValueAtTime(Math.max(1,slideTo),t0+dur);
  g.gain.setValueAtTime(.0001,t0);
  g.gain.linearRampToValueAtTime(Math.max(.0001,vol),t0+0.007);     // 柔和起音，去掉硬咔哒
  g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g); g.connect(masterGain); o.start(t0); o.stop(t0+dur+.03);
}
function _noise(dur,vol,lp){
  if(!AC)return; const n=Math.max(1,Math.floor(AC.sampleRate*dur)),buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);
  const s=AC.createBufferSource();s.buffer=buf; const g=AC.createGain();g.gain.value=vol;
  let node=s; if(lp){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;s.connect(f);node=f;}
  node.connect(g); g.connect(masterGain); s.start();
}
function sfx(kind){
  if(!SFX_ON||!AC||AC.state!=='running')return;
  const now=AC.currentTime, gap={hit:.05,crit:.06,kill:.05,hurt:.09,boss:.07,skill:.12,gift:.06,explode:.07}[kind]||.05;
  if((_sfxT[kind]||0)>now-gap)return; _sfxT[kind]=now;
  const N=AC.currentTime;
  /* 设定：敌人不是被炸，而是被「圈粉」——音效走柔软甜美的铃铛/气泡，不用噪点/锯齿 */
  if(kind==='hit'){                                   // 圈粉一下：软糯小气泡（轻微音高随机更灵动）
    const r=0.93+Math.random()*0.14;
    _osc(600*r,.07,'sine',.055,470*r); _osc(900*r,.05,'triangle',.025,820*r);
  }
  else if(kind==='crit'){                             // 大圈粉：清甜上行小星音
    _osc(784,.10,'sine',.095,880); _osc(1175,.13,'triangle',.055,1320,N+.05);
  }
  else if(kind==='kill'){                             // 圈粉成功：愉悦叮咚（上行三度，像收获一个粉丝）
    _osc(659,.12,'sine',.085,659); _osc(988,.16,'sine',.07,988,N+.06); _osc(1318,.10,'triangle',.03,1318,N+.06);
  }
  else if(kind==='explode'){                          // 大范围圈粉：温暖光晕一团（柔风+铃，不是爆炸）
    _noise(.16,.06,650); _osc(523,.24,'sine',.075,523); _osc(784,.24,'sine',.045,784);
  }
  else if(kind==='hurt'){                             // 主播被泼冷水：温和下行「哎呀」（不刺耳）
    _osc(392,.16,'sine',.10,294); _osc(196,.14,'triangle',.05,165);
  }
  else if(kind==='boss'){                             // boss 命中：醇厚低音铃（深一点但仍柔）
    _osc(294,.18,'sine',.10,294); _osc(440,.14,'sine',.045,440);
  }
  else if(kind==='skill'){                            // 开场表演：上行魔法微光（甜美 sweep）
    _osc(440,.4,'sine',.11,1320); _osc(660,.4,'triangle',.05,1760); _osc(1318,.3,'sine',.04,1318,N+.12);
  }
  else if(kind==='gift'){                             // 礼物：甜蜜小琶音
    _osc(659,.12,'triangle',.10,659); _osc(880,.12,'triangle',.075,880,N+.06); _osc(1319,.14,'sine',.05,1319,N+.12);
  }
  else if(kind==='cheer'){                            // 全场欢呼：噪声涌起(掌声) + 一串明亮欢呼上扬音
    _noise(.75,.11,1700); _noise(.55,.06,3200);
    for(let i=0;i<8;i++){const f=480+Math.random()*960;_osc(f,.5,'triangle',.028,f*1.5,N+i*0.045);}
    _osc(523,.55,'sine',.06,1046,N+.04); _osc(659,.6,'sine',.045,1318,N+.12); _osc(784,.5,'sine',.035,1568,N+.2);
  }
}
function updateSfxBtn(){const b=document.getElementById('sfxToggle');if(b){b.textContent=SFX_ON?'🔊':'🔇';b.classList.toggle('off',!SFX_ON);}}
(function(){const b=document.getElementById('sfxToggle');if(b)b.onclick=()=>{audioInit();SFX_ON=!SFX_ON;updateSfxBtn();updateMusicGain();toast(SFX_ON?'🔊 音效开':'🔇 音效关');};})();
/* ===== 背景音乐（程序生成·循环）：每个改造阶段一首，曲风跟着主角"女性化心态弧线"走 ===== */
let musicOn=true, _musTimer=null, _musNext=0, _musStep=0;
const MUS_VOL=0.11;   // 音乐总音量（小声垫底）
/* 每首：bpm / 波形(贝斯bw·铺底pw·琶音aw) / 音量(bv·pv·av) / 琶音密度arpEvery / 琶音八度arpOct / 贝斯落点bassOn / 4小节和弦prog */
const MUS_SONGS=[
  /* 0 破旧小巷·落魄直男：慢、忧伤、稀疏（小调 Am-F-C-G） */
  {bpm:84, bw:'triangle',pw:'sine',aw:'sine', bv:.5,pv:.14,av:.22, arpEvery:4,arpOct:2, bassOn:[0,8],
   prog:[{b:110,c:[220,261.63,329.63]},{b:87.31,c:[174.61,220,261.63]},{b:65.41,c:[261.63,329.63,392]},{b:98,c:[196,246.94,293.66]}]},
  /* 1 破旧健身房：冷峻、稳步推进（小调 Em-C-G-D，每拍贝斯） */
  {bpm:104, bw:'triangle',pw:'sine',aw:'triangle', bv:.55,pv:.13,av:.26, arpEvery:2,arpOct:2, bassOn:[0,4,8,12],
   prog:[{b:82.41,c:[164.81,196,246.94]},{b:65.41,c:[261.63,329.63,392]},{b:98,c:[196,246.94,293.66]},{b:73.42,c:[146.83,185,220]}]},
  /* 2 大号KTV：欢快霓虹派对（大调 C-Am-F-G，密琶音） */
  {bpm:126, bw:'triangle',pw:'sine',aw:'triangle', bv:.55,pv:.15,av:.30, arpEvery:2,arpOct:2, bassOn:[0,4,8,12],
   prog:[{b:65.41,c:[261.63,329.63,392]},{b:110,c:[220,261.63,329.63]},{b:87.31,c:[174.61,220,261.63]},{b:98,c:[196,246.94,293.66]}]},
  /* 3 改造实验室：赛博、冷酷下行（安达卢西亚 Am-G-F-E） */
  {bpm:116, bw:'triangle',pw:'triangle',aw:'triangle', bv:.5,pv:.13,av:.28, arpEvery:2,arpOct:2, bassOn:[0,8],
   prog:[{b:110,c:[220,261.63,329.63]},{b:98,c:[196,246.94,293.66]},{b:87.31,c:[174.61,220,261.63]},{b:82.41,c:[164.81,207.65,246.94]}]},
  /* 4 少女闺房：甜系 J-pop 王道进行 F-G-Em-Am */
  {bpm:120, bw:'triangle',pw:'sine',aw:'triangle', bv:.55,pv:.16,av:.30, arpEvery:2,arpOct:2, bassOn:[0,8],
   prog:[{b:87.31,c:[349.23,440,523.25]},{b:98,c:[392,493.88,587.33]},{b:82.41,c:[329.63,392,493.88]},{b:110,c:[440,523.25,659.25]}]},
  /* 5 舞台：明亮燃向偶像主题曲（大调 C-G-Am-F，每拍贝斯、16分密琶音） */
  {bpm:134, bw:'triangle',pw:'sine',aw:'triangle', bv:.55,pv:.15,av:.32, arpEvery:1,arpOct:1, bassOn:[0,4,8,12],
   prog:[{b:130.81,c:[523.25,659.25,783.99]},{b:196,c:[392,493.88,587.33]},{b:110,c:[440,523.25,659.25]},{b:87.31,c:[349.23,440,523.25]}]},
];
function curMusStage(){return Math.min(5,(typeof P!=='undefined'&&P.mods)?P.mods.length:0);}
function _mosc(freq,dur,type,vol,t0){          // 音乐专用振荡器（走 musicGain，柔和起音）
  if(!AC||!musicGain)return;
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,t0);
  g.gain.setValueAtTime(.0001,t0); g.gain.linearRampToValueAtTime(Math.max(.0001,vol),t0+0.02); g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0+dur+.04);
}
function _musStepFn(step,t){
  const S=MUS_SONGS[curMusStage()], bar=Math.floor(step/16)%4, b=step%16, C=S.prog[bar];
  if(S.bassOn.indexOf(b)>=0) _mosc(C.b,0.42,S.bw,S.bv,t);                 // 贝斯落点
  if(b===0) C.c.forEach(f=>_mosc(f,1.7,S.pw,S.pv,t));                     // 整小节铺底 pad
  if(b%S.arpEvery===0){const seq=[C.c[0],C.c[1],C.c[2],C.c[1]];_mosc(seq[Math.floor(b/S.arpEvery)%4]*S.arpOct,0.2,S.aw,S.av,t);}  // 琶音
}
function _musTick(){
  if(!AC||AC.state!=='running'){_musNext=AC?AC.currentTime+0.1:0;return;}  // 后台挂起时不抢拍
  const stepDur=60/MUS_SONGS[curMusStage()].bpm/4;                         // 步长随当前阶段曲速
  while(_musNext<AC.currentTime+0.12){_musStepFn(_musStep,_musNext);_musNext+=stepDur;_musStep=(_musStep+1)%64;}
}
function startMusic(){ if(!AC||_musTimer)return; _musStep=0;_musNext=AC.currentTime+0.12; _musTimer=setInterval(_musTick,25); updateMusicGain(); }
function stopMusic(){ if(_musTimer){clearInterval(_musTimer);_musTimer=null;} }
function musicWant(){ return (SFX_ON&&musicOn&&typeof G!=='undefined'&&G.scr==='play'&&!paused)?MUS_VOL:0; }  // 仅战斗中（scr=play、未暂停）才出声
function updateMusicGain(){ if(musicGain)musicGain.gain.value=musicWant(); }
const dmBox=$('dm');
function danmaku(txt,cls,user){
  const d=document.createElement('div');d.className='m '+(cls||'');
  d.innerHTML=(cls==='sys')?txt:'<span class="u">'+(user||pick(DM_USERS))+'：</span>'+txt;
  dmBox.appendChild(d);
  while(dmBox.children.length>60)dmBox.removeChild(dmBox.firstChild);   // 保留更多，填满加大的右栏
}
function gift(name){
  const z=$('giftZone'),d=document.createElement('div');
  d.className='gift';d.textContent='🎁 '+pick(DM_USERS)+' 送出 '+name;
  z.appendChild(d);G.giftN++;
  if(A('topFanGuard'))P._shield=Math.min(2,(P._shield||0)+1);    // 榜一守护：收到礼物→吸收护盾
  sfx('gift');
  setTimeout(()=>d.remove(),3200);
}
/* 不易重复的取词 */
let _recentDM=[];
function pickDM(pool){
  if(!pool||!pool.length)return '';
  let t,n=0;do{t=pool[Math.floor(Math.random()*pool.length)];n++;}while(_recentDM.includes(t)&&n<6);
  _recentDM.push(t);if(_recentDM.length>16)_recentDM.shift();
  return t;
}
/* 赞/踩绑定评论：每条正面评论 +ri(1,3)×阶段系数 个赞，负面同理给踩；阶段越高系数越大（越火反馈越猛）*/
const STAGE_COEF=[1,1,2,4,8,16];   // 原点/①/②/③/④/⑤
function addLike(){G.likes+=ri(1,3)*STAGE_COEF[Math.min(P.mods.length,5)];}
function addDislike(){G.dislikes+=ri(1,3)*STAGE_COEF[Math.min(P.mods.length,5)];}
/* 正面：吸引到观众（击杀触发，节流防刷屏） */
function emitPos(stage){
  let pool=DM_POS[stage],cls=stage>=3?'fan':'';
  if(stage===5){const code=P.mods.join('');if(DM_CHAR[code]&&Math.random()<0.45)pool=DM_CHAR[code];}
  danmaku(pickDM(pool),cls);addLike();
}
/* 负面：自动出现，随阶段递减，出道后归零 */
function emitNeg(stage){danmaku(pickDM(DM_NEG[stage]),'bad');addDislike();}
/* 环境弹幕：持续刷屏但严格遵守"阶段正负比例"——0改人见人骂(嘲讽为主)，逐级转好评，出道全员真香 */
const AMB_POS=[0.12,0.28,0.42,0.60,0.82,1.0];   // 每阶段"正面/中性"占比，其余为嘲讽
function emitAmbient(stage){
  if(stage<5 && Math.random()>AMB_POS[stage]){ emitNeg(stage); return; }   // 嘲讽（0改最多）→ 踩
  if(Math.random()<0.45 && DM_POS[stage] && DM_POS[stage].length){danmaku(pickDM(DM_POS[stage]),stage>=3?'fan':'');addLike();}  // 正面 → 赞
  else danmaku(pickDM(DM_AMBIENT));               // 通用中性闲聊（填场，不计赞踩）
}
/* 开局/换形态时预填，免得右栏空着 */
function prefillDanmaku(n){const s=Math.min(P.mods.length,5);for(let i=0;i<(n||18);i++)emitAmbient(s);}
/* 每帧：负面计时 + 正面冷却 + 环境弹幕 */
function dmTick(dt){
  const stage=Math.min(P.mods.length,5);
  G.posCd=Math.max(0,G.posCd-dt);
  G.negT-=dt;
  if(G.negT<=0){
    const iv=NEG_INTERVAL[stage];
    if(iv!==Infinity){emitNeg(stage);G.negT=rnd(iv*0.7,iv*1.35);}
    else G.negT=6;                       // 出道后：不再出现负面
  }
  if(G.ambT==null)G.ambT=0;
  G.ambT-=dt;
  if(G.ambT<=0){emitAmbient(stage);G.ambT=rnd(0.45,1.1);}   // ~1-2条/秒 持续刷屏
}

/* ---------- 流程 ---------- */
function showPanel(html){$('panel').innerHTML=html;$('overlay').classList.add('show');G.scr='modal';}
/* 改造「进化」过场：白光渐变 → 演出字幕 → 显示新形象 → 阿源照镜台词泡泡 → 进入下一环节 */
function startCutscene(key){
  const code=P.mods.join('')+key;                 // 选完后的完整形态码（如 L / LS / LSCYP）
  const sc=(typeof CUTSCENES!=='undefined'&&CUTSCENES[code])||((typeof MOD_SCENES!=='undefined')?MOD_SCENES[key]:null);
  $('overlay').classList.remove('show');
  if(!sc){P.mods.push(key);P.hp=Math.min(P.hp,ST().maxhp);if(P.mods.length===5)grantFormSkill();$('formLab').textContent=playerForm(P.mods).name;nextModal();return;}
  G.scr='cut';
  cutscene={key,t:0,revealed:false,act:sc.act,mirror:sc.mirror};
}
function hidePanel(){$('overlay').classList.remove('show');G.scr='play';}
function startScreen(){
  G.scr='start';
  showPanel(`<h2>《后巷偶像》<em>Back Alley Idol</em></h2>
  <div class="sub">400 斤的后巷肥宅·阿源，签下了改造贷款，参加了直播平台的残酷新人企划——<br>
  <b style="color:var(--gold)">撑过 30 波观众浪潮，即可获得出道资格。</b><br>
  击倒涌来的观众 = 用魅力捕获他们。心态值归零就只能下播。<br>
  途中将经历 <b style="color:var(--pink)">5 次身体改造（每次二选一）</b>，最终成为 32 种偶像形态之一。</div>
  <div class="statline"><kbd>WASD / 方向键</kbd> 移动 ｜ 武器自动攻击 ｜ <kbd>空格</kbd> 主动技（出道定位·舞台型）｜ <kbd>Esc</kbd> 暂停</div>
  <div class="btn" onclick="beginRun()">开始直播</div>`);
  $('panel').querySelector('.btn').onclick=beginRun;
}
function beginRun(){audioInit();startMusic();hidePanel();prefillDanmaku(20);startWave(1);danmaku('直播开始了，有人在吗？','sys');}
function startWave(w){
  const bossW=(w===20||(w>20&&w%5===0));      // 波20 + 无尽里程碑(25/30/35…)=完整Boss波
  G.wave=w;G.waveT=0;G.waveDur=bossW?999:Math.min(Math.round(23+1.7*w),60);   // §07 v0.3.3 波时长拉长(w19=55s)，无尽封顶60s
  G.bossW=bossW;
  G.spawnAcc=0;G.noHit=true;G.elSched=[];
  P._sisUsed=0;P._gloomUsed=0;                       // 技能·每波首次类重置
  P._cashBuff=A('cashReaction')?Math.floor((P._shopSpend||0)/100)*0.08:0;P._shopSpend=0;  // 钞能力反应：上一轮商店消费→本波全伤
  if(w===1)G.miniBossSeen=false;                       // 本局 mini-boss 保底标记
  const elite=(t,type)=>{const nm=type==='leping'?'毒舌乐评人':'黑粉头目';G.elSched.push({t:Math.max(0,t-2),warnOnly:1,msg:'⚡'+nm+'空降直播间！'});G.elSched.push({t,type});};
  const miniBoss=(t,kind)=>{G.elSched.push({t:Math.max(0,t-2.5),warnOnly:1,msg:'⚠️ BOSS 级对手空降直播间！'});G.elSched.push({t,type:kind,opt:{mini:1}});G.miniBossSeen=true;};
  /* §5 固定普通精英锚点 8/11/14/17 */
  if(w===8)elite(6,'heifen');
  if(w===11)elite(8,'leping');
  if(w===14){elite(6,'heifen');elite(15,'heifen');}
  if(w===17){elite(5,'heifen');elite(10,'heifen');elite(16,'leping');}
  /* 随机普通精英（波9-19非固定波） */
  if(w>=9&&w<=19&&![11,14,17].includes(w)&&Math.random()<0.30+0.022*(w-9))
    elite(rnd(8,14),(w>=14&&Math.random()<.45)?'leping':'heifen');
  /* §6.2 BOSS级精英(mini-boss) 随机空降：波11-19，25%→45%，保底波17 */
  if(w>=11&&w<=19&&!bossW){
    const p=0.25+0.022*(w-11);
    if(Math.random()<p||(w===17&&!G.miniBossSeen))miniBoss(rnd(9,Math.min(16,G.waveDur-6)),pick(MINIBOSS_KINDS));
  }
  /* 无尽常规波：随机精英60% + BOSS级精英50% */
  if(w>20&&!bossW){
    if(Math.random()<0.6)elite(rnd(7,16),Math.random()<.5?'leping':'heifen');
    if(Math.random()<0.5)miniBoss(rnd(8,Math.min(18,G.waveDur-6)),pick(MINIBOSS_KINDS));
  }
  /* Boss 波：波20=B1出道；无尽里程碑(25/30/35…)=轮换完整Boss(bDiva 波30起) */
  if(w===20){G.elSched.push({t:2,type:'boss'});danmaku('等等……讨债的诊所老板冲进直播间了？！','sys');}
  else if(bossW){
    const pool=BOSS_KINDS.filter(k=>k!=='bDiva'||w>=30);
    const kind=pool[(Math.floor(w/5)+1)%pool.length];
    G.elSched.push({t:2,type:kind});danmaku('🎤 里程碑 BOSS 「'+ETYPES[kind].name+'」登场！','sys');
  }
  if(w===30)danmaku('【？】后台好像有什么被惊动了……（隐藏结局·待续）','sys');   // §1.5 占位
  danmaku('—— 第 '+w+' 波'+(w>20?'·人气榜无尽赛':'')+'观众涌入 ——','sys');
  emit('onWaveStart',{w});
  G.scr='play';
}
function endWave(){
  emit('onWaveEnd',{});P._brave=0;P._cashBuff=0;   // 越战越勇/钞能力反应波末清零
  if(G.drops.length)toast('本波有 '+G.drops.length+' 份打赏没捡，浪费了！');  // 没捡的打赏不再自动收，作废
  G.drops=[];G.enemies=[];G.ebullets=[];G.bullets=[];G.zones=[];G.clones=[];G.allies=[];G.fields=[];G.ultCut=null;
  P._skT=0;P._convWin=0;P._moshT=0;P._hype=0;                          // 波末清掉技能临时态（永久陪伴分身在 grant，已清，需重挂）
  if(P.passiveSkill&&P.passiveSkill.grant)P.passiveSkill.grant();      // 重挂永久陪伴（如青梅分身）
  if(P.mods[2]==='B'&&G.noHit){G.gold+=18;G.totalGold+=18;toast('无伤波次！观众追加打赏 +18');}
  const salary=8+G.wave*3+Math.floor(ST().harvest);   // 时薪 + 恰饭
  G.gold+=salary;G.totalGold+=salary;
  danmaku('平台结算：本波直播工资 ♥'+salary,'sys');
  P.hp=Math.min(ST().maxhp,P.hp+15);
  nextModal();                                     // 无尽：永不停，永远进商店/下一波
}
function nextModal(){
  if(G.queuedLv>0){levelupModal();return;}
  const m=MODS.find(x=>x.wave===G.wave&&P.mods.length===MODS.indexOf(x));
  if(m){modModal(m);return;}
  shopModal();
}
/* 升级 */
function levelupModal(){
  G.queuedLv--;
  const opts=[];const pool=UPGRADES.slice();
  while(opts.length<3)opts.push(pool.splice(ri(0,pool.length-1),1)[0]);
  showPanel(`<h2>人气暴涨！<em>涨粉里程碑</em></h2><div class="sub">选择一项强化（还剩 ${G.queuedLv+1} 次）</div>
  <div class="choices">${opts.map((o,i)=>`<div class="choice" data-i="${i}"><h3>${o.name}</h3><p>${o.desc}</p></div>`).join('')}</div>`);
  [...$('panel').querySelectorAll('.choice')].forEach(c=>c.onclick=()=>{
    applyMod(opts[+c.dataset.i].mod);hidePanel();nextModal();
  });
}
function applyMod(mod){for(const k in mod)P.agg[k]=(P.agg[k]||0)+mod[k];P.hp=Math.min(P.hp,ST().maxhp);}
/* 六类道具统一消费（§4.6 schema）：mods→层1 ｜ hidden→层2 ｜ flags→层3 ｜ trig→系统B ｜ drawback→代价 ｜ set→套装 */
function applyItem(it){
  P.itemNames.push(it.name);P.itemIds.push(it.id);
  if(it.mods)for(const k in it.mods)P.agg[k]=(P.agg[k]||0)+it.mods[k];
  if(it.hidden)for(const k in it.hidden)P.agg[k]=(P.agg[k]||0)+it.hidden[k];
  if(it.flags)for(const k in it.flags){
    if(k==='explode'){P.agg.explode=it.flags[k];}
    else if(k==='aura'){(P.auras||(P.auras=[])).push(it.flags[k]);}
    else P.agg[k]=(P.agg[k]||0)+it.flags[k];
  }
  if(it.drawback)applyDrawback(it.drawback);
  if(it.set){P.setN[it.set]=(P.setN[it.set]||0)+1;recalcSets();}
  if(it.trig){const f=TRIG_FN[it.trig.fn];if(f)onEvt(it.trig.on,f(it.trig.args||{}),it.trig.icd);}
  P.hp=Math.min(P.hp,ST().maxhp);
}
function applyDrawback(d){
  if(d.hater)P.agg.hater=(P.agg.hater||0)+1;
  if(d.noLifesteal)P.agg.noLifesteal=1;
  if(d.statusVuln)P.agg.statusVuln=(P.agg.statusVuln||0)+d.statusVuln;
  if(d.hpLock)P._hpLock=1;
  if(d.price)P.agg._price=(P.agg._price||0)+d.price;
  if(d.revive)P.reviveLeft=(P.reviveLeft||0)+1;
  if(d.hpScale)P.agg.hpScale=(P.agg.hpScale||1)*d.hpScale;
}
/* 改造 */
function modModal(m){
  const mk=(o)=>`<div class="choice dirchoice" data-k="${o.k}">
      <img class="dirimg" src="art/dir/${o.k}.png" alt="" onerror="this.style.visibility='hidden'">
      <div class="tag">${o.tag}</div><h3>${o.name}</h3>
      <p><b style="color:var(--text)">${o.sub}</b><br>${o.desc}</p></div>`;
  showPanel(`<h2>改造${m.no} <em>${m.title}</em></h2>
  <div class="sub">改造诊所的霓虹灯亮了。老板搓着手：「分期付款，童叟无欺。」——选一个改造<b style="color:var(--pink)">方向</b>，不可逆。</div>
  <div class="choices">${mk(m.a)}${mk(m.b)}</div>`);
  const cards=[...$('panel').querySelectorAll('.choice')];
  cards.forEach(c=>c.onclick=()=>{
    if(c._picked)return;c._picked=1;                       // 点击特效：选中卡闪光、另一张变灰
    cards.forEach(o=>{if(o!==c)o.classList.add('dim');});
    c.classList.add('picked');
    setTimeout(()=>startCutscene(c.dataset.k),360);   // 点击特效后进入进化过场
  });
}
/* ---------- 商店（Brotato 式：商品 / 持有道具 / 武器 / 属性 / 锁定 / 卖出） ---------- */
let shopOffers=[],shopTab='primary';   // 4 槽，每槽 {w?/it?, locked?, sold?}；module 级持久 → 锁定跨波保留
/* 再买一个该道具是否还有收益（纯布尔能力 flag 重复无意义→不进商店） */
const MAG_FLAGS=new Set(['bounce','pierce','multishot','split','homing','chain','summonN','shockJump','knockback','projSize','chainWide','legion']);
function itemStacks(it){
  if(it.mods&&Object.keys(it.mods).length)return true;            // 数值属性：恒叠
  if(it.hidden&&Object.keys(it.hidden).length)return true;
  if(it.drawback)return true;                                     // 双刃：仍产生效果
  if(it.trig)return true;                                         // 多一个触发实例
  if(it.set){const need=(typeof SETS!=='undefined'&&SETS[it.set])?SETS[it.set].n:3;if((P.setN[it.set]||0)<need)return true;}  // 套装未集齐
  if(it.flags){
    if(it.flags.aura)return true;                                 // 多一个光环实例
    for(const k in it.flags){
      if(k==='aura'||k==='explode')continue;                     // explode 是覆盖赋值，重复无收益
      if(MAG_FLAGS.has(k))return true;                            // 量级机制位：叠加更强
      if(typeof it.flags[k]==='number'&&it.flags[k]!==1)return true;  // 小数数值(.15/.10)=量级
    }
  }
  return false;                                                  // 纯布尔能力 flag → 已拥有则不再提供
}
/* 该道具当前是否值得进商店（首件总有用；重复仅当还能叠加） */
function offerableItem(it){
  if(it.req&&!P.mods.includes(it.req))return false;
  if(P.itemIds.includes(it.id)&&!itemStacks(it))return false;
  return true;
}
/* 该武器当前是否买得动（已满级 / 槽满且未拥有 → 不进商店） */
function offerableWeapon(id){
  const own=P.weapons.find(w=>w.id===id);
  if(own&&own.lvl>=WLV_MAX)return false;                          // 已满级，买了无提升
  if(!own&&P.weapons.length>=WEAPON_MAX)return false;             // 槽满又没有它，买不了
  return true;
}
function genOffer(){
  for(let n=0;n<50;n++){
    if(Math.random()<.55){
      const sysSign='sign'+(P.mods[0]||'')+(P.mods[1]||'');   // 当前 ①② 大系对应招牌武器（过20关后入池）
      const ids=Object.keys(WEAPONS).filter(id=>id!=='mic'&&(!WEAPONS[id].meta||(G.wave>20&&id===sysSign)));
      const id=pick(ids);
      if(!offerableWeapon(id))continue;
      if(shopOffers.find(o=>o&&o.w===id))continue;
      return {w:id};
    }else{
      const it=pick(ITEMS);
      if(!offerableItem(it))continue;
      if(shopOffers.find(o=>o&&o.it&&o.it.id===it.id))continue;
      return {it};
    }
  }
  // 兜底：从「当前还买得动」的池里挑，避免给出无用槽
  const wPool=Object.keys(WEAPONS).filter(id=>id!=='mic'&&!WEAPONS[id].meta&&offerableWeapon(id)&&!shopOffers.find(o=>o&&o.w===id));
  const iPool=ITEMS.filter(it=>offerableItem(it)&&!shopOffers.find(o=>o&&o.it&&o.it.id===it.id));
  if(iPool.length)return {it:pick(iPool)};
  if(wPool.length)return {w:pick(wPool)};
  return {it:pick(ITEMS)};
}
function rollOffers(){                  // 仅刷新「未锁定 / 已售出」槽；锁定未售出槽保留（跨刷新+跨波不变）
  for(let i=0;i<4;i++){
    const cur=shopOffers[i];
    if(cur&&cur.locked&&!cur.sold)continue;
    shopOffers[i]=null;                  // 置空便于去重
    shopOffers[i]=genOffer();
  }
  shopOffers.length=4;
}
function price(o){
  const disc=Math.max(0.5,1-(P.agg.discount||0)+(P.agg._price||0));   // 折扣/双刃涨价
  let p;
  if(o.w){
    const own=P.weapons.find(w=>w.id===o.w);
    p=WEAPONS[o.w].price*(1+G.wave*.06)*(own?1+own.lvl*.45:1);
  }else p=o.it.price*(1+G.wave*.05)*(o.it.rarity?1+(o.it.rarity-1)*.15:1);
  return Math.round(p*disc);
}
function sellPrice(w){return Math.max(2,Math.round(WEAPONS[w.id].price*0.45*(1+(w.lvl-1)*0.6)*(1+G.wave*0.04)));}
/* 把一个 offer 拆成展示部件（图标/名称/颜色/标签/详情/价格/槽满） */
function offerInfo(o){
  const p=price(o);
  if(o.w){
    const d=WEAPONS[o.w],own=P.weapons.find(w=>w.id===o.w),inf=WEAPON_INFO[o.w]||{};
    const full=!own&&P.weapons.length>=WEAPON_MAX;
    const nl=own?own.lvl+1:1, rng=typeof d.range==='number'?Math.round(d.range):d.range;
    const mline=nl>=2&&inf.mech?inf.mech[Math.min(nl,4)-2]:null;
    return {p,full,icon:'art/icons/weapons/'+o.w+'.png',col:d.col,name:d.name,
      tag:`<span style="color:${TIER_COL[nl-1]}">${own?'升阶→'+TIER_NAME[nl-1]:TIER_NAME[nl-1]}</span> · ${d.cat}${inf.niche?' · '+inf.niche:''}`,
      detail:`<span class="k">base</span> ${Math.round(wDmg(o.w,nl))} ｜ <span class="k">cd</span> ${d.cd?d.cd.toFixed(2)+'s':'环绕'} ｜ <span class="k">rng</span> ${rng}
        <br><span class="k">DPS@白</span> ${inf.dps||'—'} ｜ <span class="k">吃</span> ${scalesTxt(d)}
        ${mline?'<br><span class="mech">⬆ '+TIER_NAME[nl-1]+'：'+mline+'</span>':''}${d.syn?'<br><span class="syn">协同·改造'+d.syn+'</span>':''}`};
  }
  const it=o.it,rc=RARITY_COL[it.rarity]||'#9aa0b0';
  return {p,full:false,icon:'art/icons/items/'+it.id+'.png',col:rc,name:it.name,
    tag:`<span style="color:${rc}">${CLS_NAME[it.cls]||''} · ${RARITY_NAME[it.rarity]||'道具'}</span>`,
    detail:`${it.desc}${it.set?'<br><span class="syn">套装·'+it.set+'</span>':''}${it.req?' <span class="k">限'+it.req+'系</span>':''}`};
}
let selSlot=-1;       // 当前点开详情的桌面槽位（-1=无）
/* 桌面 4 道具槽（只放图标+锁标，详情弹卡单独居中渲染避免裁切） */
function tableSlots(){
  return shopOffers.map((o,i)=>{
    if(!o)return `<div class="tslot empty" data-slot="${i}"></div>`;
    if(o.sold)return `<div class="tslot sold" data-slot="${i}"><div class="tsold">已售</div></div>`;
    const f=offerInfo(o), sel=selSlot===i;
    return `<div class="tslot ${sel?'sel':''} ${f.full?'full':''}" data-slot="${i}">
      ${o.locked?'<span class="tlock">🔒</span>':''}
      <div class="ticon"><img src="${f.icon}" onerror="this.style.display='none'"></div></div>`;
  }).join('');
}
/* 选中道具的详情弹卡（居中在桌面上方，含锁定/购买） */
function sceneDetail(){
  const o=shopOffers[selSlot];
  if(selSlot<0||!o||o.sold)return '';
  const f=offerInfo(o), aff=G.gold>=f.p&&!f.full;
  const pos=['a0','a1','a2','a3'][selSlot]||'a1';   // 按槽位水平微调，箭头指向对应道具
  return `<div class="odetail ${pos}">
    <div class="odhead"><b style="color:${f.col}">${f.name}</b><span class="odtag">${f.tag}</span></div>
    <div class="oddesc">${f.detail}</div>
    <div class="odbtns">
      <button class="odlock ${o.locked?'on':''}" data-lock="${selSlot}">${o.locked?'🔒已锁':'🔓锁定'}</button>
      <button class="odbuy ${aff?'':'no'}" data-buy="${selSlot}">♥ ${f.p} 购买${f.full?'·槽满':''}</button>
    </div></div>`;
}
/* 持有道具网格（带数量角标） */
function ownItemsGrid(){
  if(!P.itemIds.length)return '<div class="gempty">暂无道具</div>';
  const c={};P.itemIds.forEach(id=>c[id]=(c[id]||0)+1);
  return Object.keys(c).map(id=>{const it=itemById(id);if(!it)return'';
    const rc=RARITY_COL[it.rarity]||'#9aa0b0',ph=it.name[0];
    return `<div class="gcell" data-l="${ph}" data-titem="${id}" style="border-color:${rc}88">
      <img src="art/icons/items/${id}.png" onerror="this.remove();this.parentNode.classList.add('ph')">
      ${c[id]>1?'<i class="gcount">'+c[id]+'</i>':''}</div>`;
  }).join('');
}
/* 持有武器网格（sellable=true 显示卖出按钮；暂停面板用 false） */
function ownWeaponsGrid(sellable){
  return P.weapons.map((w,idx)=>{const d=WEAPONS[w.id];
    const sell=sellable!==false?`<button class="gsell" data-sell="${idx}">卖 ♥${sellPrice(w)}</button>`:'';
    return `<div class="gcell ${sellable!==false?'wcell':''}" data-l="${d.name[0]}" data-tweap="${idx}" style="border-color:${TIER_COL[w.lvl-1]}">
      <img src="art/icons/weapons/${w.id}.png" onerror="this.remove();this.parentNode.classList.add('ph')">
      <i class="gtier" style="background:${TIER_COL[w.lvl-1]}">${w.lvl}</i>${sell}</div>`;
  }).join('');
}
/* ---- 悬浮详情提示（持有道具/武器，商店与暂停共用）---- */
function itemTipHTML(it){
  const rc=RARITY_COL[it.rarity]||'#9aa0b0';
  return `<div class="odhead"><b>${it.name}</b><span class="odtag"><span style="color:${rc}">${CLS_NAME[it.cls]||''} · ${RARITY_NAME[it.rarity]||'道具'}</span></span></div>
    <div class="oddesc">${it.desc}${it.set?'<br><span class="syn">套装·'+it.set+'</span>':''}${it.req?' <span class="k">限'+it.req+'系</span>':''}</div>`;
}
function weaponTipHTML(w){
  const d=WEAPONS[w.id],inf=WEAPON_INFO[w.id]||{};
  const rng=typeof d.range==='number'?Math.round(d.range):d.range,mech=[];
  for(let t=2;t<=w.lvl;t++)if(inf.mech&&inf.mech[t-2])mech.push(TIER_NAME[t-1]+'·'+inf.mech[t-2]);
  return `<div class="odhead"><b style="color:${d.col}">${d.name}</b><span class="odtag"><span style="color:${TIER_COL[w.lvl-1]}">${TIER_NAME[w.lvl-1]}</span> · ${d.cat}${inf.niche?' · '+inf.niche:''}</span></div>
    <div class="oddesc">${d.desc}
    <br><span class="k">base</span> ${Math.round(wDmg(w.id,w.lvl))} ｜ <span class="k">cd</span> ${d.cd?d.cd.toFixed(2)+'s':'环绕'} ｜ <span class="k">rng</span> ${rng}
    <br><span class="k">DPS@白</span> ${inf.dps||'—'} ｜ <span class="k">吃</span> ${scalesTxt(d)}
    ${mech.length?'<br><span class="mech">机制 '+mech.join(' · ')+'</span>':''}${d.syn?'<br><span class="syn">协同·改造'+d.syn+'</span>':''}</div>`;
}
let _hovTip=null;
function hovTipEl(){if(!_hovTip){_hovTip=document.createElement('div');_hovTip.className='hovTip';document.body.appendChild(_hovTip);}return _hovTip;}
function showHovTip(html,rect){
  const t=hovTipEl();t.innerHTML=html;t.style.display='block';
  const VW=innerWidth||document.documentElement.clientWidth,VH=innerHeight||document.documentElement.clientHeight;
  const tw=t.offsetWidth,th=t.offsetHeight;
  let left=Math.max(8,Math.min(rect.left+rect.width/2-tw/2,VW-tw-8));
  let top=rect.top-th-10; if(top<8)top=Math.min(rect.bottom+10,VH-th-8);   // 上方放不下→放下方
  t.style.left=left+'px';t.style.top=top+'px';
}
function hideHovTip(){if(_hovTip)_hovTip.style.display='none';}
/* 属性说明（ESC/商店 悬浮提示）：这个属性是什么、影响什么 */
const STAT_DESC={
  maxhp:'心态上限。被观众击中会掉心态，归零就下播。上限越高越耐打。',
  regen:'心态回复。每秒自动恢复的心态值。',
  lifesteal:'回魂。命中敌人时按伤害比例回点心态（吸血）。',
  dmg:'魅力。对所有武器生效的通用伤害加成。',
  dmgMelee:'近台魅力。只加成近战类武器（老麦/自拍杆等）伤害。',
  dmgRanged:'远台魅力。只加成远程类武器（飞吻/高音/光碟等）伤害。',
  dmgElem:'应援共鸣。加成状态/AOE 类（闪光/香水/低音等技能区域）伤害。',
  engi:'义体改装。加成召唤/环绕/科技类（全息分身/反光板等）伤害。',
  aspd:'手速。攻击速度，越高出手越快、弹幕越密。',
  crit:'暴击率。攻击触发暴击（额外倍率伤害）的概率。',
  range:'存在感。武器的射程 / 作用范围。',
  armor:'抗压。每次受击固定减伤的点数。',
  dodge:'临场。完全闪避一次伤害的概率。',
  speed:'舞步。移动速度，走位风筝的核心。',
  luck:'玄学。提升掉落品质与稀有/高品阶出现概率。',
  harvest:'恰饭。每波结束结算时额外获得的打赏。',
  critMult:'暴击倍率。暴击时的伤害倍数。',
  pickup:'拾取范围。自动吸取掉落（打赏/经验）的半径。',
  multishot:'多重弹。每次射击额外发射的弹数。',
  pierce:'穿透。子弹可穿过的敌人数量（每穿一个略衰减）。',
  bounce:'弹射。子弹命中后弹向附近敌人的次数。',
  split:'分裂。子弹命中后分裂出的小弹数量。',
  homing:'追踪。子弹自动转向最近敌人的能力。',
  chain:'链锁。命中后向附近敌人连锁放电的跳数。',
  orbit:'环绕。围绕自身旋转的护体单位数量。',
  knockback:'击退。命中时把敌人推开的力度。',
  projSpd:'弹速。子弹飞行速度倍率。',
  projSize:'弹体。子弹体积倍率（越大越易命中）。',
  burn:'灼烧。命中施加的持续火焰伤害层数。',
  shock:'感电。命中时电弧连锁电击邻近敌人。',
  poison:'中毒。命中施加的持续毒素伤害层数。',
  chill:'冰冷。命中减速敌人的强度。',
  vuln:'易伤。使敌人受到的伤害提高。',
};
function statTipHTML(k,label){
  return `<div class="odhead"><b>${label}</b></div><div class="oddesc">${STAT_DESC[k]||''}</div>`;
}
addEventListener('mouseover',e=>{                              // 一次性事件委托：商店/暂停里的图标&属性都生效
  const el=e.target.closest&&e.target.closest('[data-titem],[data-tweap],[data-stat]');if(!el)return;
  let html=null;
  if(el.dataset.titem){const it=itemById(el.dataset.titem);if(it)html=itemTipHTML(it);}
  else if(el.dataset.tweap!=null){const w=P.weapons[+el.dataset.tweap];if(w)html=weaponTipHTML(w);}
  else if(el.dataset.stat){html=statTipHTML(el.dataset.stat, el.dataset.statLabel||el.dataset.stat);}
  if(html)showHovTip(html,el.getBoundingClientRect());
});
addEventListener('mouseout',e=>{
  if(e.target.closest&&e.target.closest('[data-titem],[data-tweap],[data-stat]'))hideHovTip();
});
const SECONDARY_STATS=[
  ['critMult','暴击倍率','m'],['pickup','拾取范围','i'],['xp','经验加成','p'],['gold','打赏加成','p'],
  ['multishot','多重弹','i'],['pierce','穿透','i'],['bounce','弹射','i'],['split','分裂','i'],
  ['homing','追踪','i'],['chain','链锁','i'],['orbit','环绕','i'],['knockback','击退','i'],
  ['projSpd','弹速','m'],['projSize','弹体','m'],
  ['burn','灼烧','i'],['shock','感电','i'],['poison','中毒','i'],['chill','冰冷','i'],['vuln','易伤','i'],
];
function statPanel(){
  const st=ST();
  const list=(shopTab==='primary'?PANEL_STATS:SECONDARY_STATS)
    .map(([k,lab,fm])=>`<div class="srow" data-stat="${k}" data-stat-label="${lab}"><span>${lab}</span><b>${fmtStat(st[k]||0,fm)}</b></div>`).join('');
  return `<div class="stabs">
      <button class="stab ${shopTab==='primary'?'on':''}" data-tab="primary">主属性</button>
      <button class="stab ${shopTab==='secondary'?'on':''}" data-tab="secondary">机制</button></div>
    <div class="slist">${list}</div>`;
}
function shopModal(fresh){
  if(fresh!==false){rollOffers();emit('onShop',{});}
  G.scr='modal';$('overlay').classList.remove('show');   // 关掉小弹窗，用全屏商店
  const rr=4+G.wave, st=ST();
  $('shopOv').innerHTML=`<div class="shopWrap">
    <div class="shopLeft">
      <div class="shopScene">
        <img id="shopVidImg" class="sceneBg" alt="">
        <div class="sceneFx">
          <div class="sceneTitle">打赏小铺<em>波 ${G.wave} 结束 · 心态 ${P.hp}/${st.maxhp}</em></div>
          <div class="sceneCtrl">
            <span class="scGold">♥ ${G.gold}</span>
            <button class="scRr" id="srrBtn">换一批 ♥ ${rr}</button>
          </div>
          <div class="tableRow">${tableSlots()}</div>
          ${sceneDetail()}
        </div>
      </div>
      <div class="shopOwned">
        <div class="ownBox items"><div class="obh">持有道具 ${P.itemIds.length}</div><div class="ggrid">${ownItemsGrid()}</div></div>
        <div class="ownBox weps"><div class="obh">武器 ${P.weapons.length}/${WEAPON_MAX}</div><div class="wgrid">${ownWeaponsGrid()}</div></div>
      </div>
    </div>
    <div class="shopRight">
      <div class="srhd">属性面板</div>
      <div id="statPanel">${statPanel()}</div>
      <button class="btn sgo" id="sgoBtn">开始第 ${G.wave+1} 波 →</button>
    </div>
  </div>`;
  $('shopOv').classList.add('show');
  startShopVid();
  const ov=$('shopOv');
  // 点击桌面道具 → 选中并弹详情（再点同一个或点空白 → 收起）
  ov.querySelectorAll('[data-slot]').forEach(s=>s.onclick=e=>{
    if(e.target.closest('[data-buy],[data-lock]'))return;     // 点详情里的按钮不算切换
    const i=+s.dataset.slot,o=shopOffers[i];
    if(!o||o.sold)return;
    selSlot=(selSlot===i?-1:i);shopModal(false);
  });
  ov.querySelector('.shopScene').addEventListener('click',e=>{   // 点场景空白收起详情
    if(!e.target.closest('.tslot')&&selSlot>=0){selSlot=-1;shopModal(false);}
  });
  ov.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyOffer(+b.dataset.buy));
  ov.querySelectorAll('[data-lock]').forEach(b=>b.onclick=()=>{const o=shopOffers[+b.dataset.lock];if(o&&!o.sold){o.locked=!o.locked;shopModal(false);}});
  ov.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>sellWeapon(+b.dataset.sell));
  ov.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{shopTab=b.dataset.tab;shopModal(false);});
  $('srrBtn').onclick=()=>{if(G.gold<rr){toast('打赏不够！');return;}G.gold-=rr;selSlot=-1;shopModal();};
  $('sgoBtn').onclick=()=>{hideShop();startWave(G.wave+1);};
}
function buyOffer(i){
  const o=shopOffers[i];if(!o||o.sold)return;
  const p=price(o);
  if(G.gold<p){toast('打赏不够！');return;}
  if(o.w){
    const own=P.weapons.find(w=>w.id===o.w);
    if(!own&&P.weapons.length>=WEAPON_MAX){toast('武器槽已满！先卖一把腾位');return;}
    if(own)own.lvl++;else P.weapons.push({id:o.w,lvl:1,cd:0});
  }else applyItem(o.it);
  G.gold-=p;P._shopSpend=(P._shopSpend||0)+p;o.sold=true;o.locked=false;selSlot=-1;  // 钞能力反应：累计本场消费
  shopModal(false);
}
function sellWeapon(idx){
  if(P.weapons.length<=1){toast('至少保留一把武器');return;}
  const w=P.weapons[idx];if(!w)return;
  const gain=sellPrice(w);G.gold+=gain;
  P.weapons.splice(idx,1);
  toast('卖出 '+WEAPONS[w.id].name+' +♥'+gain);
  shopModal(false);
}
function hideShop(){$('shopOv').classList.remove('show');clearInterval(_shopVidTimer);hideHovTip();G.scr='play';}
/* 商店动态背景（Seedance 抽帧 6fps，无则回退静态首帧）。_shopVidI 跨重渲染保持，避免每次交互动画跳回开头 */
let _shopFrames=null,_shopVidTimer=null,_shopVidI=0;
function loadShopFrames(cb){
  if(_shopFrames!==null){cb();return;}
  fetch('art/shop/frames/manifest.json?v=shop2').then(r=>r.ok?r.json():null).then(m=>{
    _shopFrames=[];
    if(m&&m.n)for(let i=0;i<m.n;i++){const im=new Image();im.src='art/shop/frames/f'+String(i).padStart(3,'0')+'.png?v=shop2';_shopFrames.push(im);}
    cb();
  }).catch(()=>{_shopFrames=[];cb();});
}
function startShopVid(){
  clearInterval(_shopVidTimer);
  loadShopFrames(()=>{
    const box=$('shopVidImg');if(!box)return;
    if(_shopFrames&&_shopFrames.length){
      const tick=()=>{const b=$('shopVidImg');if(!b){clearInterval(_shopVidTimer);return;}
        b.src=_shopFrames[_shopVidI%_shopFrames.length].src;_shopVidI++;};
      tick();_shopVidTimer=setInterval(tick,1000/6);     // 6fps 抽帧循环
    }else box.src='art/shop/shop_frame.png?v=shop2';     // 回退：静态首帧
  });
}
/* 结局 */
function gameOver(){
  G.scr='over';
  stopMusic();
  danmaku('主播怎么不动了……','sys');
  showPanel(`<h2 style="color:#ff5a7a">心态崩了，下播。</h2>
  <div class="sub">第 ${G.wave} 波 ｜ 捕获观众 ${G.kills} ｜ 收到礼物 ${G.giftN} ｜ 累计打赏 ♥ ${G.totalGold}<br><br>
  「……明天，明天再播。」——阿源关掉了摄像头。<br>改造贷款的催款短信还在响。</div>
  <div class="btn" onclick="location.reload()">重新开播</div>`);
}
function victory(){
  G.scr='win';
  const code=P.mods.join('')||'_';
  const f=playerForm(P.mods);
  const dec=DECLARE[code]||'我，出道了。';
  showPanel(`<h2 style="color:var(--gold)">出道成功！</h2>
  <div class="sub">债，还清了。30 波浪潮过去，全场都在喊她的名字。</div>
  <canvas id="winCv" width="200" height="300"></canvas>
  <h2><em>${f.name}</em></h2>
  <div class="sub" style="font-size:15px;color:var(--text)">「${dec}」</div>
  <div class="statline">改造路径 ${P.mods.join(' → ')} ｜ 捕获观众 <b>${G.kills}</b> ｜ 礼物 <b>${G.giftN}</b> ｜ 累计打赏 <b>♥ ${G.totalGold}</b></div>
  <div class="btn" onclick="location.reload()">再开一局（探索其他 31 种形态）</div>`);
  const wc=$('winCv'),g=wc.getContext('2d'),ka=KEYART[code];   // 用高清立绘
  if(ka){g.imageSmoothingEnabled=true;const sc=Math.min(wc.width/ka.width,wc.height/ka.height),dw=ka.width*sc,dh=ka.height*sc;g.drawImage(ka,(wc.width-dw)/2,wc.height-dh,dw,dh);}
  for(let i=0;i<6;i++)setTimeout(()=>danmaku(pickDM(DM_CHAR[P.mods.join('')]||DM_POS[5]),'fan'),i*350);
  gift('出道应援·嘉年华×100');triggerStreamGift('出道嘉年华×100');
}

/* ---------- 敌人（§5.1 数量优先 / §5.2 无尽指数）---------- */
function baseScale(w){return 1+0.15*w+0.005*w*w;}                       // 出道段单体血量(§07 v0.3.8 加强 +20%)
function enemyHP(d,w,mini){
  if(d.boss)return Math.round(mini ? 600*(1+0.16*w) : d.hp*(1+0.12*Math.max(0,w-20)));  // §6.3 完整Boss / mini-boss(v0.3.8 base 600·系数0.16)
  if(d.elite)return d.hp*(1+0.16*w);                                    // 精英走线性(v0.3.8 0.14→0.16)，约同期小怪5-6倍
  return w<=20 ? d.hp*baseScale(w) : d.hp*baseScale(20)*Math.pow(1.085,w-20);  // 波20后切指数(剪刀差·无尽复利 v0.3.8 1.085)
}
function enemyDMG(d,w){return d.dmg*(1+0.08*w);}                        // 接触伤害(v0.3.8 0.07→0.08)
/* §1.1 移速上限档（v0.3.6）：肉墙×1.65 / 远程×1.50 / 高速冲锋×1.30；Boss 等未列默认肉墙 1.65 */
const SPD_CAP={luren:1.65,baipiao:1.65,heifen:1.65,penzi:1.50,leping:1.50,shuijun:1.30,duijia:1.30};
function eSpdMul(type,w){return Math.min(1+0.022*w, SPD_CAP[type]||1.65);}   // eSpd=baseSpd×min(1+0.022w, cap)
function spawnEnemy(type,opt){
  opt=opt||{};
  const d=ETYPES[type],w=G.wave, mini=!!opt.mini;
  const side=ri(0,3);let x,y;
  if(side===0){x=rnd(30,AW-30);y=-20;}else if(side===1){x=rnd(30,AW-30);y=AH+20;}
  else if(side===2){x=-20;y=rnd(30,AH-30);}else{x=AW+20;y=rnd(30,AH-30);}
  const hp=enemyHP(d,w,mini);
  const e={type,x,y,hp,maxhp:hp,spd:d.spd*rnd(.9,1.1)*eSpdMul(type,w),dmg:enemyDMG(d,w),r:d.r*(mini?1.45:2),
    gold:d.gold,xp:d.xp,elite:d.elite,boss:d.boss,kind:d.kind,tex:d.tex,mini:mini,shooter:d.shooter,bomber:d.bomber,
    shootCd:rnd(1,2.5),slow:0,stun:0,mark:0,hitFlash:0,ai:0,vx:0,vy:0,
    spr:pick(ESPR[type]||ESPR.boss),bubble:0,gait:rnd(0,6.28),t1:rnd(1.5,3),t2:rnd(3,5),t3:rnd(2,4)};
  if(d.boss){
    if(mini){e.x=rnd(140,AW-140);e.y=-40;e.miniBoss=1;e.gold=Math.round(120*(1+0.1*w));}   // mini-boss 混入波，不锁 bossRef
    else{e.x=AW/2;e.y=-40;G.bossRef=e;e.gold=Math.round(d.gold*(1+0.1*Math.max(0,w-20)));}
  }
  G.enemies.push(e);
  return e;
}
function pickType(){
  const w=G.wave,pool=[];
  for(const k in ETYPES){
    const d=ETYPES[k];
    if(d.elite||d.boss)continue;
    if(w>=d.minW)pool.push({k,w:d.w});
  }
  if(P.agg.hater&&Math.random()<.08)return 'duijia';
  let tot=pool.reduce((s,p)=>s+p.w,0),r=Math.random()*tot;
  for(const p of pool){r-=p.w;if(r<=0)return p.k;}
  return 'luren';
}
function hurtEnemy(e,dmg,isCrit,opt){
  opt=opt||{};const st=opt.st||_st||ST();
  if(e.mark>0)dmg*=1.2;                              // 心动易伤(N)
  if(e.vuln>0)dmg*=(1+(e.vulnP||0));                 // 易伤状态
  if(e.slow>0&&A('coldSnap'))dmg*=1.3;               // 趁你冷场：对冰冷敌+30%
  if(isCrit&&e.poison>0&&A('dramaLord'))dmg*=(1+Math.min(.4,(e.poisonStk||1)*.04));  // 节奏带师：中毒层数→暴伤
  if(isCrit&&P._critBonus){dmg*=(1+P._critBonus);P._critBonus=0;}                    // 名场面收割：下击暴伤+
  if(e.boozed>0){dmg*=2;e.boozed=0;}                  // 午夜威士忌：上头敌下一击翻倍
  dmg=Math.round(Math.max(1,dmg));
  const willKill=e.hp-dmg<=0;
  e.hp-=dmg;e.hitFlash=isCrit?.20:.13;e.hitPop=Math.max(e.hitPop||0,isCrit?1:.65);   // 命中白闪 + 缩放弹（drawEnemy 读取）
  /* 冲击方向：来源(子弹/玩家)→敌人，用于火花/击退朝向 */
  const sx=opt.sx!=null?opt.sx:P.x, sy=opt.sy!=null?opt.sy:P.y;
  const ang=Math.atan2(e.y-sy,e.x-sx);
  if(!opt.noFx){
    /* 便宜的反馈始终保留：击退 / 屏震 / 暴击顿帧 */
    if(!e.boss&&!e.mini){e.x+=Math.cos(ang)*(isCrit?5:2.4);e.y+=Math.sin(ang)*(isCrit?5:2.4);}      // 微击退（命中后退）
    const sev=Math.min(1,dmg/Math.max(1,e.maxhp*0.22));                                // 相对伤害烈度→屏震
    addShake(isCrit?3.4+sev*4.5:1.3+sev*2.4);
    if(isCrit&&!willKill)hitStop(.045);
    /* 昂贵的发光粒子/数字/音效：每帧预算内才出（暴击配额更高），防大面积命中刷爆→卡顿 */
    const cap=isCrit?18:10;
    if((G._impactN=(G._impactN||0)+1)<=cap){
      const col=isCrit?'#ffe14a':(e.shock>0?'#9af0ff':(e.burn>0?'#ffb14a':'#ffd7e6'));
      fx({type:'hit',x:e.x,y:e.y-e.r*.5,a:ang,ttl:isCrit?.20:.14,r:isCrit?28:17,col,crit:isCrit}); // 命中闪光星爆
      fx({type:'burst',x:e.x,y:e.y-e.r*.5,a:ang,n:isCrit?6:3,spd:isCrit?280:175,ttl:.32,col});      // 飞溅粒子
      sfx(e.boss?'boss':(isCrit?'crit':'hit'));
      float(e.x+rnd(-5,5),e.y-e.r-10,(isCrit?'✦':'')+dmg,isCrit?'#ffe14a':'#fff',{crit:isCrit,sz:isCrit?1.7:1,vy:isCrit?-10:0});
    }
  }
  /* 状态（吃 dmgElem 独立乘区④） */
  if(opt.chill){e.slow=Math.max(e.slow,1.6);}
  if(opt.poison){e.poison=3;e.poisonDps=(2+G.wave*0.3)*(1+st.dmgElem);e.poisonStk=Math.min(10,(e.poisonStk||0)+1);}
  if(opt.burn){e.burn=2.5;e.burnDps=(4+G.wave*0.4)*(1+st.dmgElem);}        // 灼烧 DoT（比毒猛、时间短）
  if(opt.shock&&(e._shockCd||0)<=0){e._shockCd=0.3;e.shock=0.55;shockArc(e,dmg*0.5*(1+st.dmgElem),(opt.shockJump||2)+(st.chain||0));}  // 感电连锁
  if(opt.vuln){e.vuln=2.5;e.vulnP=0.2;}
  if(A('resonator')&&(opt.burn||opt.shock||opt.poison||opt.chill||opt.vuln)&&Math.random()<.25){  // 状态共鸣器：25%补一种随机状态(不吃dmgElem)
    const x=pick(['burn','shock','poison','chill','vuln']);
    if(x==='chill')e.slow=Math.max(e.slow,1.2);
    else if(x==='poison'){e.poison=Math.max(e.poison||0,2.5);e.poisonDps=Math.max(e.poisonDps||0,3+G.wave*.2);}
    else if(x==='burn'){e.burn=Math.max(e.burn||0,2);e.burnDps=Math.max(e.burnDps||0,3+G.wave*.2);}
    else if(x==='vuln'){e.vuln=Math.max(e.vuln||0,2);e.vulnP=Math.max(e.vulnP||0,.15);}
    else if(x==='shock'&&(e._shockCd||0)<=0){e._shockCd=.3;e.shock=.5;}
  }
  if(opt.knockback&&!e.boss){const a=Math.atan2(e.y-P.y,e.x-P.x);e.x+=Math.cos(a)*opt.knockback*0.1;e.y+=Math.sin(a)*opt.knockback*0.1;}
  if(st.lifesteal>0)P.hp=Math.min(st.maxhp,P.hp+dmg*st.lifesteal);   // 回魂
  if(!opt.noTrig){emit('onHit',{e,dmg,isCrit});
    if(P.mods[2]==='C'){P._charge=Math.min(100,(P._charge||0)+10);if(P._charge>=100){P._charge=0;P._overload=1;}}  // ③ 义体过载充能
    if(P._hype>0)skAOE(e.x,e.y,50,skHit('melee',.4),{col:'#ffd24a'});                                            // ④ 元气·全场嗨溅射
    if(P.passiveSkill&&P.passiveSkill.onHit)P.passiveSkill.onHit(e,dmg,isCrit);
    if(isCrit){if(P.mods[3]==='N')e.mark=3;emit('onCrit',{e,dmg});if(P.passiveSkill&&P.passiveSkill.onCrit)P.passiveSkill.onCrit(e);
    if(A('spotlight')){P._spot=(P._spot||0)+1;if(P._spot>=8){P._spot=0;explodeAt(e.x,e.y,80,dmg*1.4*(1+st.dmgElem));float(e.x,e.y-e.r,'高光!','#ffd24a');}}}}  // 高光时刻
  if(isCrit&&e.hp<=0){                                // 暴击击杀协同（收割/心动传染）
    if(A('highlightReap')){P.hp=Math.min(st.maxhp,P.hp+1);P._critBonus=.15;if(P.mods[4]==='P')P.skillCd=Math.max(0,P.skillCd-.5);}
    if(A('heartHarvest')&&(e.mark>0||e.vuln>0)){let cnt=0;G.enemies.forEach(o=>{if(o.dead||o===e||cnt>=3)return;if(dist2(o,e)<90000){o.mark=3;hurtEnemy(o,dmg*.4,false,{noTrig:1,noFx:1});cnt++;}});}
  }
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  e.dead=true;G.kills++;
  /* 死亡爆裂（打击感）：碎片 + 闪光环 + 顿帧 + 音效，按体型放大 */
  const big=e.boss?2.4:(e.mini||e.elite?1.6:1), kx=e.x, ky=e.y-e.r*0.5;
  fx({type:'burst',x:kx,y:ky,n:Math.round(8*big),spd:240*big,ttl:.42,col:'#ffd7e6',spread:Math.PI*2});
  fx({type:'hit',x:kx,y:ky,a:0,r:24*big,ttl:.28,col:'#fff',crit:1});
  fx({type:'ring',x:kx,y:ky,r:34*big,col:e.boss?'#ffd24a':'#ff9ec4',ttl:.34});
  fx({type:'spark',x:kx,y:ky,ttl:.26});
  addShake(2.6*big); hitStop(e.boss?.07:.04); sfx(e.boss?'boss':'kill');
  if(P.mods[3]==='Y'){P.heat=Math.min(100,P.heat+4);if(P.heat>=100&&P._hype<=0)P._hype=5;}  // ④ 元气：连杀+4热度，满→全场嗨
  if(P.mods[3]==='N'&&e.mark>0)spreadMark(e,1);        // ④ 冷艳：心动死亡传染最近1
  if(P.mods[1]==='D'){                                 // ② 磁嗓：击杀震慑波（死亡可再触发，连锁≤3）
    const dep=e._dStun||0, p=dep===0?.15:.15/Math.pow(2,dep);
    if(dep<3&&Math.random()<p){fx({type:'ring',x:e.x,y:e.y,r:90,col:'#9b6bff',ttl:.4});
      G.enemies.forEach(o=>{if(!o.dead&&!o.ally&&dist2(o,e)<8100){o.slow=Math.max(o.slow,2);o._dStun=dep+1;}});}
  }
  if(P._convWin>0&&!e.boss&&G.allies.length<8)convertAlly(e,.15,5);            // 出道曲：窗口内击杀转友
  if(P.passiveSkill&&P.passiveSkill.onKill)P.passiveSkill.onKill(e);
  /* explode 机制位（带 0.5s ICD，§4.5） */
  const ex=A('explode');
  if(ex&&ex.r&&(P._explodeCd||0)<=0){P._explodeCd=0.5;explodeAt(e.x,e.y,ex.r,(25+G.wave*4)*ex.dmg*(1+(_st?_st.dmgElem:0)));}
  if(e.hater&&P.setFx.haterBoom)explodeAt(e.x,e.y,70,40+G.wave*4);
  emit('onKill',{e,dmg:e.maxhp});                   // 系统B onKill
  const gm=(e.hater&&P.setFx.haterGold)?P.setFx.haterGold:1;
  const v=e.gold?ri(Math.max(1,e.gold*.6),e.gold)*gm:0;
  if(v||e.xp)G.drops.push({x:e.x+rnd(-8,8),y:e.y+rnd(-8,8),gold:v,xp:e.xp,vx:rnd(-30,30),vy:rnd(-30,30)});
  fx({type:'heart',x:e.x,y:e.y-e.r,ttl:.7});
  if(e.bomber){                                          // 自爆 AOE：范围内才吃伤害，可躲
    const R=66;
    fx({type:'ring',x:e.x,y:e.y,r:R,col:'#ff5a3a',ttl:.4});
    G.shake=Math.max(G.shake,4);
    if(dist2(e,P)<((R+bodyRadius(P.mods))**2))hitPlayer(e.dmg*1.4);
    if(P.mods.length<5&&Math.random()<.5)danmaku(pick(['就这？','主播不行啊（撤退）','对家天下第一！']),'bad');
  }
  if(e.elite){const gn=pick(GIFT_NAMES);gift(gn);triggerStreamGift(gn);danmaku('黑粉头子……被你圈粉了！','sys');G.shake=6;}
  if(e.miniBoss){                                       // mini-boss 死：大额打赏+保底掉落，波次照常继续
    const gn=pick(GIFT_NAMES);gift(gn);triggerStreamGift(gn);danmaku('BOSS 级对手被你击退了！','sys');G.shake=7;
  }else if(e.boss){
    G.bossRef=null;G.enemies.forEach(o=>{if(!o.boss)o.dead=true;});G.shake=8;
    if(G.wave===20&&e.kind==='debt'){setTimeout(debutClear,700);}   // 波20 B1=出道
    else{const gn=pick(GIFT_NAMES);gift(gn);triggerStreamGift(gn);danmaku('里程碑 BOSS 倒下！巡演继续——','sys');setTimeout(()=>{if(G.scr==='play')endWave();},900);}  // 无尽里程碑Boss死→进下一波
  }
  if(!e.boss&&!e.miniBoss&&G.posCd<=0){                                  // 吸引到观众→正面评论（0改罕见，逐级变多）
    const s=Math.min(P.mods.length,5);
    if(Math.random()<POS_CHANCE[s])emitPos(s);
    G.posCd=rnd(0.28,0.5);
  }
}
function debutClear(){                                  // §1.1 出道收口（庆祝）但继续无尽赛
  G.scr='modal';P.debut=1;
  const code=P.mods.join('')||'_',f=playerForm(P.mods),dec=DECLARE[code]||'我，出道了。';
  for(let i=0;i<6;i++)setTimeout(()=>danmaku(pickDM(DM_CHAR[code]||DM_POS[5]),'fan'),i*300);
  const sk='sign'+(P.mods[0]||'')+(P.mods[1]||'');                       // §4 招牌武器：对应 ①② 大系过20关后入卡池
  if(WEAPONS[sk])setTimeout(()=>danmaku('🎖️ 招牌武器「'+WEAPONS[sk].name+'」已进入卡池（无尽商店可遇）！','sys'),1800);
  gift('出道应援·嘉年华×100');triggerStreamGift('出道嘉年华×100');
  showPanel(`<h2 style="color:var(--gold)">出道成功！🎉</h2>
  <div class="sub">债，还清了。20 波浪潮过去，全场都在喊她的名字——<br>但人气榜的浪潮，才刚刚开始。</div>
  <canvas id="winCv" width="180" height="270"></canvas>
  <h2><em>${f.name}</em></h2><div class="sub" style="font-size:15px;color:var(--text)">「${dec}」</div>
  <div class="statline">改造路径 ${P.mods.join(' → ')} ｜ 捕获 <b>${G.kills}</b> ｜ 累计打赏 <b>♥ ${G.totalGold}</b></div>
  <div><span class="btn" id="endlessBtn">开启人气榜无尽赛 →</span> <span class="btn ghost" onclick="location.reload()">重新开播</span></div>`);
  const wc=$('winCv');if(wc){const g=wc.getContext('2d'),ka=KEYART[code];if(ka){g.imageSmoothingEnabled=true;const sc=Math.min(wc.width/ka.width,wc.height/ka.height),dw=ka.width*sc,dh=ka.height*sc;g.drawImage(ka,(wc.width-dw)/2,wc.height-dh,dw,dh);}}
  const eb=$('endlessBtn');if(eb)eb.onclick=()=>{hidePanel();startWave(21);};
}
function hitPlayer(dmg){
  if(G.god||P.ift>0)return;
  const st=ST();
  if(P.passiveSkill&&P.passiveSkill.onGuard&&(P._guardCd||0)<=0){     // 保镖女神：自动格挡反弹（ICD1.5s）
    P._guardCd=1.5;P.ift=.5;float(P.x,P.y-70,'格挡!','#8fd0ff');P.passiveSkill.onGuard();return;}
  if(Math.random()<st.dodge){float(P.x,P.y-70,'闪避!','#7af0ea');emit('onDodge',{});return;}
  if((P._shield||0)>0){P._shield--;P.ift=.5;float(P.x,P.y-70,'护盾!','#9fd0ff');return;}
  emit('onHurt',{dmg});
  dmg=Math.max(1,Math.round(dmg-st.armor));
  P.hp-=dmg;P.ift=.6;P.heat=0;G.noHit=false;G.shake=10;
  P.hitFlash=.24; streamHit=.55;                         // 角色红闪 + 直播窗红闪抖动
  float(P.x,P.y-70,'-'+dmg,'#ff5a7a',{sz:1.3});
  fx({type:'burst',x:P.x,y:P.y-26,a:0,n:6,spd:200,ttl:.3,col:'#ff5a7a',spread:Math.PI*2});
  fx({type:'spark',x:P.x,y:P.y-30,ttl:.3});
  fx({type:'flash',ttl:.14,col:'#ff3a5a'});
  hitStop(.06); sfx('hurt');
  if(P.hp<=0){
    if((P.reviveLeft||0)>0){P.reviveLeft--;P.hp=Math.round(st.maxhp*0.5);P.ift=1.5;G.enemies.forEach(e=>{if(!e.boss)e.dead=true;});danmaku('不放弃的人——心态回满，清场！','sys');G.shake=12;fx({type:'flash',ttl:.4});return;}
    P.hp=0;gameOver();
  }
}

/* ---------- 主动技 ---------- */
/* ========== 05 · 专属技能 / 改造轴技能系统 ========== */
/* 伤害参照：大爆发≈清屏一发(58+wave×6)，单次命中按对应面板缩放（§7.1 纪律） */
function skBurst(mul){const st=_st||ST();return (58+G.wave*6)*(1+st.dmg)*(mul||1);}
function skHit(cat,mul){const st=_st||ST();const c=cat==='melee'?st.dmgMelee:cat==='ranged'?st.dmgRanged:cat==='elem'?st.dmgElem:cat==='engi'?st.engi:0;return (11+G.wave*4)*(1+st.dmg+c)*(mul||1);}
function panelCrit(){const st=_st||ST();return {c:Math.random()<st.crit,cm:st.critMult};}
function skField(x,y,r,ttl,o){G.fields.push(Object.assign({x,y,r,ttl,t:0},o||{}));}
/* 领域命中判定：T台压场为巨大 T 字区域，其余为圆形 */
const T_BAR=440,T_BARH=140,T_STEM=95,T_STEMH=430;   // 巨大粗壮 T 字（横臂880宽×140厚，竖柱190宽×860高）
function inField(e,f){
  if(f.tshape){const dx=Math.abs(e.x-f.x);
    return (dx<=T_BAR && e.y>=f.y-T_STEMH && e.y<=f.y-T_STEMH+T_BARH) || (dx<=T_STEM && e.y>=f.y-T_STEMH && e.y<=f.y+T_STEMH);}
  return dist2(e,f)<f.r*f.r;
}
function skAOE(x,y,r,dmg,o){o=o||{};if(!o.silent)fx({type:'ring',x,y,r,col:o.col||'#ff9ec4',ttl:.34});if(o.shake)addShake(o.shake);
  G.enemies.forEach(e=>{if(e.dead||e.ally||dist2(e,{x,y})>r*r)return;
    hurtEnemy(e,dmg,o.crit||false,{noTrig:1,noFx:1,sx:x,sy:y,chill:o.chill,burn:o.burn,vuln:o.vuln});
    if(!o.silent)float(e.x+rnd(-5,5),e.y-e.r-10,(o.crit?'✦':'')+Math.round(dmg),o.crit?'#ffe14a':'#fff',{crit:o.crit,sz:o.crit?1.5:1,vy:o.crit?-10:0});
    if(o.knock&&!e.boss){const a=Math.atan2(e.y-y,e.x-x);e.x+=Math.cos(a)*o.knock;e.y+=Math.sin(a)*o.knock;}
    if(o.stun)e.stun=Math.max(e.stun||0,o.stun); if(o.fear&&!e.boss)e.fear=Math.max(e.fear||0,o.fear);
    if(o.ally&&!e.boss&&G.allies.length<10&&Math.random()<(o.ally.p||1))convertAlly(e,o.ally.pct,o.ally.ttl);});}
function convertAlly(e,pct,ttl){if(!e||e.boss||e.ally)return;e.dead=true;G.allies.push({x:e.x,y:e.y,r:e.r,spr:e.spr,type:e.type,tex:e.tex,ttl:ttl||5,cd:rnd(.2,.6),pct:pct||0.15,gait:rnd(0,6.28)});fx({type:'ring',x:e.x,y:e.y,r:24,col:'#7af0ea',ttl:.3});}
function playerDash(ang,dist,dur){dur=dur||.18;P._dashT=dur;P._dashVx=Math.cos(ang)*dist/dur;P._dashVy=Math.sin(ang)*dist/dur;P.ift=Math.max(P.ift,dur+.05);}
function freezeAll(t){G.enemies.forEach(e=>{if(!e.dead&&!e.ally){e.stun=Math.max(e.stun||0,t);e.frozen=t;}});}
function volley(n,cat,mul,col){const ts=nearestN(900,n);for(let i=0;i<n;i++){const tg=ts[i]||ts[0];if(!tg)return;const a=Math.atan2(tg.y-(P.y-20),tg.x-P.x),pc=panelCrit();
  G.bullets.push({x:P.x,y:P.y-20,vx:Math.cos(a)*300,vy:Math.sin(a)*300,dmg:skHit(cat,mul),crit:pc.c,cm:pc.cm,pierce:0,pdec:1,bounce:0,split:0,homing:1.4,chain:0,ttl:2.2,r:8,col:col||'#7af0ea',kind:'starnote',status:{},hit:new Set()});}}
function spreadMark(from,n){let c=0;G.enemies.forEach(e=>{if(e.dead||e.ally||e===from||c>=n)return;if(dist2(e,from)<140*140){e.mark=Math.max(e.mark||0,3);c++;}});}
function skFlame(x,y,col){fx({type:'burst',x,y,n:3,spd:70,ttl:.45,col:col||'#ff7a3a',spread:Math.PI*2});fx({type:'burst',x:x+rnd(-5,5),y:y-2,n:2,spd:40,ttl:.55,col:'#ffd24a'});}
/* 专属武器·空格随时领取；武器栏满则替换等级最低的非招牌武器 */
function claimWeapon(id,name){
  const have=P.weapons.find(w=>w.id===id);
  if(have){have.lvl=WLV_MAX;toast('已装备「'+name+'」·满级');fx({type:'ring',x:P.x,y:P.y,r:50,col:'#7af0ea',ttl:.3});return;}  // 隐藏武器直接满级，重复按不再升级
  if(P.weapons.length<WEAPON_MAX){P.weapons.push({id,lvl:WLV_MAX,cd:0});toast('装备专属武器「'+name+'」·满级');}
  else{let idx=-1,lo=99;P.weapons.forEach((w,i)=>{if(/^sign/.test(w.id))return;if(w.lvl<lo){lo=w.lvl;idx=i;}});if(idx<0)idx=0;
    const old=P.weapons[idx];P.weapons[idx]={id,lvl:WLV_MAX,cd:0};toast('「'+name+'」满级替换了 '+((WEAPONS[old.id]&&WEAPONS[old.id].name)||old.id));}
  fx({type:'ring',x:P.x,y:P.y,r:60,col:'#7af0ea',ttl:.4});
}

/* —— 32 形态专属技能（§7）。type: active主动·绑空格 / passive被动 / weapon专属武器 —— */
const SKILLS={
 /* 轻甜系 L-S */
 LSCYP:{type:'active',name:'全息天使降临',cd:22,dur:8,col:'#9af0ff',buff:{spd:.30,homing:.8,multishot:2,fly:1},every:.2,
   on(){skField(P.x,P.y,72,8.2,{burn:skHit('elem',.6),follow:1,flame:1,col:'#ffb14a'});},
   tick(){skFlame(P.x+rnd(-44,44),P.y+rnd(-12,34),'#ffb14a');},
   end(){G.fields=G.fields.filter(f=>!f.flame);}},
 LSCYT:{type:'passive',name:'电波接收',onKill(){P._wv=(P._wv||0)+1;if(P._wv>=10){P._wv=0;volley(4,'ranged',1.0,'#9af0ff');}}},
 LSCNP:{type:'active',name:'人偶剧场',cd:20,col:'#c8a8ff',on(){for(let i=0;i<4;i++)G.clones.push({x:P.x+Math.cos(i*1.57)*52,y:P.y-6+Math.sin(i*1.57)*34,ttl:7,cd:rnd(0,.6),dmg:skHit('ranged',.6),lvl:2,chibi:1,tint:'#c8a8ff',mods:P.mods.slice(),crit:1,cm:ST().critMult,status:{},unit:'ai',kind:'aiCohost',bob:rnd(0,6)});fx({type:'ring',x:P.x,y:P.y,r:80,col:'#c8a8ff',ttl:.4});}},
 LSCNT:{type:'passive',name:'反差暴击',onHit(e){if(Math.random()<.25)skAOE(e.x,e.y,60,skHit('ranged',1.6),{crit:true,col:'#9b6bff'});}},
 LSBYP:{type:'active',name:'出道曲·上热搜',cd:24,col:'#ff9ec4',on(){P._convWin=10;fx({type:'ring',x:P.x,y:P.y,r:280,col:'#ff9ec4',ttl:.5});let c=0;G.enemies.forEach(e=>{if(c<4&&!e.dead&&!e.boss&&dist2(e,P)<280*280){convertAlly(e,.18,9);c++;}});danmaku('一曲出道，路人秒变应援军团！','sys');}},
 LSBYT:{type:'passive',name:'全网妹妹',onPickup(){P.hp=Math.min(ST().maxhp,P.hp+1);},tick(){if(P.hp<ST().maxhp*.30&&!P._sisUsed){P._sisUsed=1;skAOE(P.x,P.y,420,skHit('melee',.5),{knock:70,col:'#ff9ec4',shake:8});danmaku('全网心疼·清场！','sys');}}},
 LSBNP:{type:'active',name:'绝对零度',cd:22,col:'#aee8ff',on(){freezeAll(3.5);fx({type:'flash',ttl:.3,col:'#aee8ff'});fx({type:'ring',x:P.x,y:P.y,r:520,col:'#aee8ff',ttl:.6,style:'frost'});addShake(7);}},
 LSBNT:{type:'passive',name:'读信电台',every:.5,tick(){G.fields.find(f=>f.radio)||skField(P.x,P.y,135,1e9,{heal:1,slow:1,follow:1,radio:1,col:'#aee8ff'});}},
 /* 轻磁系 L-D */
 LDCYP:{type:'active',name:'台风炸裂',cd:22,dur:8,col:'#ffd24a',buff:{aspd:.25,glow:'#ffd24a'},every:1.2,tick(){const t=nearestEnemy(900);if(!t)return;skAOE(t.x,t.y,135,skBurst(.6),{chill:1,col:'#bfe0ff',shake:5});fx({type:'ring',x:t.x,y:t.y,r:135,col:'#bfe0ff',ttl:.5,style:'frost'});for(let i=0;i<10;i++){const a=i*0.63+performance.now()/180;fx({type:'burst',x:t.x+Math.cos(a)*45,y:t.y+Math.sin(a)*45,n:1,spd:140,ttl:.4,col:'#cfeeff'});}}},
 LDCYT:{type:'active',name:'义体百宝臂',cd:0,col:'#ff9a4a',weapon:'memeCannon',on(){claimWeapon('memeCannon','义体百宝臂');}},
 LDCNP:{type:'active',name:'赛博低音',cd:23,dur:5,col:'#9b6bff',buff:{crit:.15},on(){skField(P.x,P.y,170,5,{slow:1,follow:1,bass:1,col:'#9b6bff'});skAOE(P.x,P.y,170,skBurst(.3),{col:'#9b6bff',shake:6});},
   tick(){fx({type:'ring',x:P.x,y:P.y,r:170,col:'#9b6bff',ttl:.5,style:'soundwave'});},every:.6,end(){G.fields=G.fields.filter(f=>!f.bass);}},
 LDCNT:{type:'passive',name:'ASMR单推',every:.5,tick(){const t=nearestEnemy(500);if(t)t.asmr=2;},onKill(e){if(e.asmr>0)skAOE(e.x,e.y,70,skHit('ranged',.5),{shock:1,col:'#9b6bff'});}},
 LDBYP:{type:'active',name:'殿下接你回家',cd:18,col:'#ffe07a',on(){let a;if(P._vx||P._vy)a=Math.atan2(P._vy,P._vx);else{const t=nearestEnemy(600);a=t?Math.atan2(t.y-P.y,t.x-P.x):(P.face>0?0:Math.PI);}P._dashCol='#ffe07a';playerDash(a,360,.24);P._dashAOE={a,n:.5,r:150};fx({type:'ring',x:P.x,y:P.y,r:60,col:'#ffe07a',ttl:.3});}},
 LDBYT:{type:'passive',name:'青梅陪伴',grant(){G.clones.push({x:P.x-34,y:P.y,ttl:1e9,cd:0,dmg:skHit('ranged',.25),lvl:2,chibi:1,sister:1,tint:'#ff9ec4',mods:P.mods.slice(),crit:0,cm:ST().critMult,status:{},unit:'ai',kind:'aiCohost',bob:0});},tick(){if(P.hp<ST().maxhp*.30&&!P._sisGuard){P._sisGuard=1;P._shield=Math.max(P._shield||0,2);}else if(P.hp>=ST().maxhp*.30)P._sisGuard=0;}},
 LDBNP:{type:'active',name:'慵懒即兴',cd:22,dur:8,col:'#9af07a',every:.4,tick(){const es=G.enemies.filter(e=>!e.dead&&!e.ally);if(!es.length)return;const t=pick(es),a=Math.atan2(t.y-(P.y-20),t.x-P.x);G.bullets.push({x:P.x,y:P.y-20,vx:Math.cos(a)*320,vy:Math.sin(a)*320,dmg:skHit('ranged',1.2),crit:true,cm:ST().critMult,pierce:1,pdec:1,bounce:0,split:0,homing:2.2,chain:0,ttl:1.8,r:11,col:'#9af07a',kind:'ultnote',status:{},hit:new Set()});}},
 LDBNT:{type:'passive',name:'今天也辛苦了',dmgFn(maxhp){const miss=Math.max(0,1-P.hp/maxhp);return Math.min(.4,Math.floor(miss*10)*0.08);},tick(){if(P.hp<ST().maxhp*.25&&!P._gloomUsed){P._gloomUsed=1;skAOE(P.x,P.y,420,skHit('melee',.5),{knock:70,col:'#7a7a9a',shake:8});P.hp=Math.min(ST().maxhp,P.hp+20);}}},
 /* 重甜系 H-S */
 HSCYP:{type:'active',name:'应援全开',cd:22,dur:8,col:'#7af0ea',buff:{armor:3,glow:'#7af0ea'},on(){P._cheer=8;fx({type:'ring',x:P.x,y:P.y,r:130,col:'#7af0ea',ttl:.5});danmaku('应援全开！','sys');},end(){P._cheer=0;}},
 HSCYT:{type:'passive',name:'再来一组☆',onKill(){P._grpK=(P._grpK||0)+1;P._grpT=5;if(P._grpK>=20){P._grpK=0;P._grpFix=Math.min(.30,(P._grpFix||0)+.02);float(P.x,P.y-70,'增伤 +2%','#ffd24a');}},tick(){P._grpT=Math.max(0,(P._grpT||0)-1);if(P._grpT<=0)P._grpK=0;},dmgFn(){return 0;},panelStat(){return '连杀增伤 +'+Math.round((P._grpFix||0)*100)+'%（'+(P._grpK||0)+'/20）';}},
 HSCNP:{type:'active',name:'战姬展翼',cd:24,dur:8,col:'#bfe0ff',buff:{spd:.25,fly:1},every:1.5,tick(){const t=nearestEnemy(640);if(!t)return;const a=Math.atan2(t.y-P.y,t.x-P.x);P._dashCol='#bfe0ff';playerDash(a,240,.2);P._dashAOE={a,n:.45,r:120};fx({type:'ring',x:P.x,y:P.y,r:70,col:'#bfe0ff',ttl:.3});}},
 HSCNT:{type:'passive',name:'贴身护卫',onGuard(){skAOE(P.x,P.y,90,skHit('melee',1.5),{crit:true,col:'#8fd0ff'});}},
 HSBYP:{type:'active',name:'盛夏狂欢',cd:22,dur:6,col:'#ff7a3a',buff:{glow:'#ff7a3a'},every:.3,
   on(){skField(P.x,P.y,165,6.2,{burn:skHit('elem',.5),follow:1,flame:1,col:'#ff7a3a'});},
   tick(){G.enemies.forEach(e=>{if(!e.dead&&!e.ally&&dist2(e,P)<320*320){e.burn=Math.max(e.burn||0,1.6);e.burnDps=Math.max(e.burnDps||0,skHit('elem',.5));}});
     const t=nearestEnemy(900);if(t){skAOE(t.x,t.y,95,skHit('elem',1.6),{burn:skHit('elem',.5),col:'#ff7a3a',shake:3});for(let i=0;i<3;i++)skFlame(t.x+rnd(-34,34),t.y+rnd(-30,30),'#ff7a3a');}
     skFlame(P.x+rnd(-55,55),P.y+rnd(-34,28),'#ff7a3a');skFlame(P.x+rnd(-55,55),P.y+rnd(-20,40),'#ffd24a');},
   end(){G.fields=G.fields.filter(f=>!f.flame);}},
 HSBYT:{type:'passive',name:'大胃王',onPickup(){P._eat=(P._eat||0)+1;P._eatFix=Math.min(.30,(P._eat)*0.01);P._eatScale=Math.min(.6,(P._eat%10)*0.06);if(P._eat%10===0){P._eatScale=0;skAOE(P.x,P.y,175,skHit('melee',3.5),{knock:60,col:'#ffd24a',shake:7});fx({type:'ring',x:P.x,y:P.y,r:175,col:'#ffd24a',ttl:.45});float(P.x,P.y-72,'嗝—!','#ffd24a');}},dmgFn(){return 0;}},
 HSBNP:{type:'active',name:'T台压场',cd:20,dur:6,col:'#ff7bc1',buff:{crit:.15},on(){skField(AW/2,AH/2,0,6,{tshape:1,slow:1,vuln:.30,col:'#ff7bc1'});fx({type:'flash',ttl:.2,col:'#ff7bc1'});addShake(6);danmaku('T台压场——全员定在聚光灯下！','sys');},end(){G.fields=G.fields.filter(f=>!f.tshape);}},
 HSBNT:{type:'passive',name:'优雅下午茶',every:1,tick(){G.fields.find(f=>f.tea)||skField(P.x,P.y,150,1e9,{slow:1,tea:1,follow:1,col:'#e0b0ff'});},onKill(e){if(dist2(e,P)<150*150){G.gold+=2;G.totalGold+=2;}}},
 /* 重磁系 H-D */
 HDCYP:{type:'active',name:'舞台喷火',cd:23,dur:8,col:'#ff7a3a',buff:{aspd:.20,glow:'#ff7a3a'},every:.1,tick(){const base=P.face>0?0:Math.PI;
   for(let i=-1;i<=1;i++){const aa=base+i*0.42,d=rnd(50,255);const x=P.x+Math.cos(aa)*d,y=P.y-20+Math.sin(aa)*d;
     G.enemies.forEach(e=>{if(!e.dead&&!e.ally&&dist2(e,{x,y})<3400){e.burn=Math.max(e.burn||0,1.8);e.burnDps=Math.max(e.burnDps||0,skHit('elem',.6));}});
     skFlame(x,y,'#ff7a3a');skFlame(x+rnd(-10,10),y+rnd(-10,10),'#ffd24a');}
   const fx2=P.x+Math.cos(base)*64,fy2=P.y-20+Math.sin(base)*10;
   fx({type:'burst',x:fx2,y:fy2,n:7,spd:280,ttl:.45,col:'#ff7a3a',a:base,spread:0.7});fx({type:'burst',x:fx2,y:fy2,n:5,spd:210,ttl:.5,col:'#ffd24a',a:base,spread:0.5});}},
 HDCYT:{type:'active',name:'机车炮台',cd:0,col:'#7af0ea',weapon:'camTurret',on(){claimWeapon('camTurret','机车炮台');}},
 HDCNP:{type:'active',name:'歌剧魅影',cd:24,dur:3,col:'#9b6bff',buff:{spd:.65,stealth:1},on(){for(let i=0;i<14;i++)fx({type:'burst',x:P.x,y:P.y-20,n:1,spd:150,ttl:.5,col:'#9b6bff'});fx({type:'ring',x:P.x,y:P.y,r:60,col:'#9b6bff',ttl:.3});},
   end(){const t=nearestEnemy(700),x=t?t.x:P.x,y=t?t.y:P.y;
     skAOE(x,y,200,skHit('ranged',3.6),{crit:true,fear:1.5,vuln:.4,col:'#9b6bff',shake:9});
     fx({type:'flash',ttl:.18,col:'#c8a8ff'});fx({type:'ring',x,y,r:200,col:'#9b6bff',ttl:.55});fx({type:'ring',x,y,r:120,col:'#c8a8ff',ttl:.4});
     for(let i=0;i<18;i++){const a=i*0.349;fx({type:'burst',x,y,n:1,spd:320,ttl:.5,col:'#9b6bff',a,spread:0.2});}hitStop(.08);}},
 HDCNT:{type:'passive',name:'一键入侵',onKill(e){if(Math.random()<.30){let n=null,bd=200*200;G.enemies.forEach(o=>{if(o.dead||o.ally)return;const d=dist2(o,e);if(d<bd){bd=d;n=o;}});if(n)convertAlly(n,.2,5);}}},
 HDBYP:{type:'active',name:'全场跳起来',cd:22,dur:6,col:'#ff5a7a',on(){P._moshT=6;G.enemies.forEach(e=>{e._mvx=undefined;});danmaku('全场蹦迪，互撞起来！','sys');}},
 HDBYT:{type:'passive',name:'人生咨询室',onGold(){if((P._toastCd||0)<=0){P._toastCd=3;P.hp=Math.min(ST().maxhp,P.hp+2);P._allBuff=3;}}},
 HDBNP:{type:'active',name:'至暗独舞',cd:22,dur:3,col:'#8a7ad0',buff:{noContact:1},on(){
   skAOE(P.x,P.y,9999,skHit('melee',.7),{stun:2.8,vuln:.40,col:'#8a7ad0',shake:8,silent:1});   // 全场眩晕+易伤(silent:不刷满屏伤害字)
   fx({type:'flash',ttl:.28,col:'#8a7ad0'});fx({type:'ring',x:P.x,y:P.y,r:560,col:'#8a7ad0',ttl:.6});
   skField(P.x,P.y,160,3,{slow:1,follow:1,dark:1,col:'#8a7ad0'});danmaku('至暗独舞——全场定身！','sys');},end(){G.fields=G.fields.filter(f=>!f.dark);}},
 HDBNT:{type:'passive',name:'深夜醺然',dmgFn(){return Math.min(.4,G.wave*0.015);},onCrit(e){e.boozed=2;}},
};
/* —— 32 专属技能·一句话说明（HUD / 暂停面板共用） —— */
const SKILL_DESC={
 LSCYP:'化身天使飞行8s：移速+30%、子弹追踪+多重，脚下持续灼烧领域',
 LSCYT:'每击倒10名观众，自动追踪齐射4连',
 LSCNP:'召唤4个人型分身(7s)，各自索敌射击',
 LSCNT:'命中25%概率触发一次范围暴击爆发',
 LSBYP:'立即转化4名路人，10s内击倒的也转为应援军团',
 LSBYT:'拾取打赏回1心态；心态<30%自动清场击退一次',
 LSBNP:'全场冻结3.5s',
 LSBNT:'脚下常驻领域、跟随移动：减速敌人+持续回血',
 LDCYP:'8s手速+25%，每1.2s向最远敌投落冰爆台风',
 LDCYT:'空格领取专属武器·梗图加农炮（已有则升级/满栏替换）',
 LDCNP:'5s暴击+15%，脚下跟随低音领域减速全场',
 LDCNT:'锁定单体麻痹，将其击倒触发感电爆发',
 LDBYP:'沿当前方向冲刺360，落点造成范围伤害+击退',
 LDBYT:'常驻青梅人型分身随身射击；濒死自动给护盾',
 LDBNP:'8s持续甩出穿透追踪的大招星音弹（必暴击）',
 LDBNT:'心态每缺10%增伤+8%(上限40%)；濒死回血清场',
 HSCYP:'8s抗压+3、反弹接触伤害，召唤分身手速+60%',
 HSCYT:'连杀20累计永久增伤+2%（上限30%）',
 HSCNP:'飞行8s，自动俯冲突袭最近敌（落点范围伤害）',
 HSCNT:'自动格挡近身攻击，并反弹一次范围爆发',
 HSBYP:'6s全场点燃，并连续精准打击最近敌',
 HSBYT:'吃打赏变大增伤，每10个打嗝缩小+范围震退',
 HSBNP:'地图正中展开巨大T字领域6s，减速+易伤30%',
 HSBNT:'常驻跟随领域减速；领域内击倒额外+2打赏',
 HDCYP:'8s朝面向持续喷射火焰，高额点燃',
 HDCYT:'空格领取专属武器·机车炮台（已有则升级/满栏替换）',
 HDCNP:'潜行3s（透明·不攻击），结束瞬间致命爆发+恐惧',
 HDCNT:'击倒30%概率策反邻近一名观众(5s)',
 HDBYP:'6s全场蹦迪乱窜，敌人互撞持续掉血',
 HDBYT:'每次收到打赏回2心态，并给全队短暂增益',
 HDBNP:'免接触3s，眩晕+易伤全场，脚下暗影减速',
 HDBNT:'随波次成长增伤(上限40%)，暴击使敌微醺(下击翻倍)',
};

function grantFormSkill(){
  const code=P.mods.join(''); const sk=SKILLS[code]; if(!sk)return;
  P.activeSkill=null; P.passiveSkill=null; P._eatScale=0; P._cheer=0; P._moshT=0; P._skT=0;
  if(sk.type==='active'){P.activeSkill=sk;P.skillCd=0;if(!sk.weapon)getUltImg(code);}   // 预载大招 cut-in 立绘
  else if(sk.type==='passive'){P.passiveSkill=sk;if(sk.grant)sk.grant();}
  else if(sk.type==='weapon'){const have=P.weapons.find(w=>w.id===sk.weapon);if(have)have.lvl=Math.min(4,have.lvl+1);else if(P.weapons.length<WEAPON_MAX)P.weapons.push({id:sk.weapon,lvl:2,cd:0});else{P._pendWeapon=sk.weapon;toast('武器槽满！卖一把可换上「'+sk.name+'」');}}
  const tn={active:'主动·空格',passive:'被动',weapon:'专属武器'}[sk.type];
  setTimeout(()=>danmaku('✨ 解锁专属技能：'+sk.name+'（'+tn+'）','sys'),300);
}
function castSkill(){
  const sk=P.activeSkill; if(G.scr!=='play'||!sk||G.ultCut)return;
  if(P._skT>0){ if(sk.repress)sk.repress(); return; }   // 二段（俯冲等）
  if(P.skillCd>0)return;
  P.skillCd=sk.cd*(A('automation')?.75:1);
  if(sk.weapon){ if(sk.on)sk.on(); return; }            // 专属武器·空格领取：不放大招演出
  startUltCut(sk);                                       // ① 全场暂停 + 屏闪 + 大招 cut-in 演出，结束后 ② 真正释放
}
/* 大招 cut-in：全场暂停、屏闪、中央展示大招立绘(漫画聚焦框+集中线+欢呼)，结束回到游戏触发大招 */
function startUltCut(sk){
  const code=P.mods.join('');
  G.ultCut={sk,code,img:getUltImg(code),name:sk.name,col:sk.col||'#7af0ea',t:0,dur:1.7,fired:false};
  fx({type:'flash',ttl:.28,col:'#fff'}); addShake(7); sfx('cheer');      // 屏闪一下 + 全场欢呼
}
function doCast(sk){                                     // 真正释放大招效果（cut-in 结束后调用）
  if(sk.dur){P._skT=sk.dur;P._skTick=0;}
  fx({type:'ring',x:P.x,y:P.y,r:180,col:sk.col||'#ff7bc1',ttl:.5}); fx({type:'flash',ttl:.18,col:sk.col||'#ff9ec4'});
  addShake(8); hitStop(.06); sfx('skill'); danmaku('技能·'+sk.name+'！','sys');
  if(sk.on)sk.on();
}
/* 技能/buff/领域/友军/mosh/dash 每帧推进 */
function skTick(dt){
  /* 冲刺位移：playerDash 设置的速度在这里真正生效（之前从未被消费） */
  if(P._dashT>0){P._dashT-=dt;P.x=clamp(P.x+P._dashVx*dt,WALL+10,AW-WALL-10);P.y=clamp(P.y+P._dashVy*dt,WALL+34,AH-WALL-4);P.moving=true;
    fx({type:'burst',x:P.x,y:P.y-18,n:1,spd:30,ttl:.18,col:P._dashCol||'#ffe07a'});}                  // 冲刺残影
  if(P._skT>0){const sk=P.activeSkill;P._skT-=dt;if(sk&&sk.tick){P._skTick=(P._skTick||0)+dt;const ev=sk.every||.5;while(P._skTick>=ev){P._skTick-=ev;sk.tick();}}
    if(sk&&sk.buff&&sk.buff.glow){P._glowT=(P._glowT||0)+dt;if(P._glowT>=.1){P._glowT=0;const a=rnd(0,6.28),d=rnd(16,42);fx({type:'burst',x:P.x+Math.cos(a)*d,y:P.y-18+Math.sin(a)*d,n:2,spd:100,ttl:.5,col:sk.buff.glow});}}  // 爆豆粒子
    if(P._skT<=0&&sk&&sk.end)sk.end();}
  if(P.passiveSkill&&P.passiveSkill.tick){P._pasTick=(P._pasTick||0)+dt;const iv=P.passiveSkill.every||1;while(P._pasTick>=iv){P._pasTick-=iv;P.passiveSkill.tick();}}
  P._moshT=Math.max(0,(P._moshT||0)-dt);P._hype=Math.max(0,(P._hype||0)-dt);P._convWin=Math.max(0,(P._convWin||0)-dt);
  P._allBuff=Math.max(0,(P._allBuff||0)-dt);P._toastCd=Math.max(0,(P._toastCd||0)-dt);P._guardCd=Math.max(0,(P._guardCd||0)-dt);
  /* mosh：全场蹦迪——给每个敌人一个持续乱窜速度，撞墙反弹、互撞掉血+弹开 */
  if(P._moshT>0){G.enemies.forEach(e=>{if(e.dead||e.boss||e.ally)return;
    if(e._mvx===undefined||Math.random()<.025){const a=rnd(0,6.28),sp=(e.spd||50)*2.4;e._mvx=Math.cos(a)*sp;e._mvy=Math.sin(a)*sp;}
    e.x+=e._mvx*dt;e.y+=e._mvy*dt;
    if(e.x<WALL+12||e.x>AW-WALL-12){e._mvx*=-1;e.x=clamp(e.x,WALL+12,AW-WALL-12);}
    if(e.y<WALL+12||e.y>AH-WALL-12){e._mvy*=-1;e.y=clamp(e.y,WALL+12,AH-WALL-12);}
    e._hop=Math.abs(Math.sin(P._moshT*9+e.x*.08))*7;                                   // 蹦迪跳动(渲染用)
    e._moshCd=(e._moshCd||0)-dt;
    if(e._moshCd<=0){for(const o of G.enemies){if(o!==e&&!o.dead&&!o.ally&&dist2(o,e)<((e.r+o.r+6)**2)){
      e._moshCd=.45;hurtEnemy(e,skHit('melee',.8),false,{noTrig:1,sx:o.x,sy:o.y});
      const a=Math.atan2(e.y-o.y,e.x-o.x),sp=(e.spd||50)*2.4;e._mvx=Math.cos(a)*sp;e._mvy=Math.sin(a)*sp;break;}}}
  });}else if(G.enemies.some(e=>e._hop)){G.enemies.forEach(e=>{e._hop=0;e._mvx=undefined;});}
  /* 领域 */
  G.fields.forEach(f=>{f.t+=dt;f._tk=(f._tk||0)+dt;const tk=f._tk>=.5;if(tk)f._tk=0;
    if(f.follow){f.x=P.x;f.y=P.y;}                                                      // 实时跟随玩家(无延迟)
    if(f.slow)G.enemies.forEach(e=>{if(!e.dead&&!e.ally&&inField(e,f))e.slow=Math.max(e.slow,.4);});
    if(f.vuln)G.enemies.forEach(e=>{if(!e.dead&&!e.ally&&inField(e,f)){e.vuln=Math.max(e.vuln||0,.6);e.vulnP=Math.max(e.vulnP||0,f.vuln);}});
    if(tk&&f.burn)G.enemies.forEach(e=>{if(!e.dead&&!e.ally&&inField(e,f)){e.burn=Math.max(e.burn||0,1.2);e.burnDps=Math.max(e.burnDps||0,f.burn);}});
    if(tk&&f.heal&&dist2(P,f)<f.r*f.r)P.hp=Math.min(ST().maxhp,P.hp+(f.heal||0));});
  G.fields=G.fields.filter(f=>f.t<f.ttl);
  /* 友军 */
  G.allies.forEach(a=>{a.ttl-=dt;a.cd-=dt;a.gait=(a.gait||0)+dt*5;
    let best=null,bd=440*440;G.enemies.forEach(e=>{if(e.dead||e.ally)return;const d=dist2(e,a);if(d<bd){bd=d;best=e;}});
    if(best){const an=Math.atan2(best.y-a.y,best.x-a.x);a.x+=Math.cos(an)*130*dt;a.y+=Math.sin(an)*130*dt;
      if(a.cd<=0&&bd<320*320){a.cd=.85;const pc=panelCrit();G.bullets.push({x:a.x,y:a.y-8,vx:Math.cos(an)*280,vy:Math.sin(an)*280,dmg:skHit('ranged',a.pct),crit:pc.c,cm:pc.cm,pierce:0,pdec:1,bounce:0,split:0,homing:1,chain:0,ttl:1.6,r:7,col:'#7af0ea',kind:'spark',status:{},hit:new Set()});}}});
  G.allies=G.allies.filter(a=>a.ttl>0);
  /* 永久陪伴分身：跟随玩家、伤害随波 */
  G.clones.forEach(c=>{if(c.sister){c.x+=(P.x-36-c.x)*.08;c.y+=(P.y-c.y)*.08;c.dmg=skHit('ranged',.25);}});
  /* 殿下/俯冲：冲刺结束落点 AOE */
  if(P._dashAOE&&P._dashT<=0){const o=P._dashAOE;P._dashAOE=null;skAOE(P.x,P.y,o.r||100,skHit('melee',o.n*10||2),{knock:50,col:'#ffe07a',shake:6,ally:o.n<.2?{p:1,pct:.15,ttl:3}:null});}
}

/* ---------- 系统B · 触发事件总线 (§2.6) ---------- */
const BUS={onHit:[],onCrit:[],onKill:[],onDodge:[],onHurt:[],onWaveStart:[],onWaveEnd:[],onLevelUp:[],onShop:[],onGold:[],onProc:[]};
function onEvt(ev,fn,icd){(BUS[ev]||(BUS[ev]=[])).push({fn,icd:icd||0,cd:0});}
function emit(ev,ctx){const a=BUS[ev];if(!a)return;for(const h of a){if(h.cd>0)continue;h.fn(ctx||{});if(h.icd)h.cd=h.icd;}}
function busTick(dt){for(const ev in BUS)for(const h of BUS[ev])if(h.cd>0)h.cd=Math.max(0,h.cd-dt);}
let _procT=0;
function procTick(dt){const iv=Math.max(2.6,5-Math.min(2,(G.level-1)*0.12));_procT+=dt;if(_procT>=iv){_procT=0;emit('onProc',{});}}
function explodeAt(x,y,r,dmg,st){
  fx({type:'ring',x,y,r,col:'#ff9a4a',ttl:.3});
  fx({type:'hit',x,y,a:0,r:r*.6,ttl:.22,col:'#ffd24a',crit:1});                      // 爆心闪光
  fx({type:'burst',x,y,a:0,n:10,spd:r*4,ttl:.4,col:'#ff9a4a',spread:Math.PI});        // 全向飞溅
  addShake(Math.min(9,3+r*.04)); hitStop(.04); sfx('explode');
  G.enemies.forEach(e=>{if(!e.dead&&dist2(e,{x,y})<r*r)hurtEnemy(e,dmg,false,{noTrig:1,noFx:1});});
}
/* 触发件效果工厂（applyItem 按 trig.fn 注册回调） */
const TRIG_FN={
  explode:(g)=>(c)=>{if(!c.e)return;const st=ST();explodeAt(c.e.x,c.e.y,g.r,(c.dmg||10)*g.dmg*(1+st.dmgElem),st);},
  dmgStack:(g)=>()=>{P._brave=Math.min(g.cap,(P._brave||0)+g.per);},
  permaStack:(g)=>()=>{const cur=P._perma||0;P._perma=cur+g.per*Math.pow(0.7,Math.floor(cur/0.20));},
  saveBuff:()=>()=>{P._saveT=1.5;P._nextCrit=1;},
  shield:(g)=>()=>{if(Math.random()<g.p)P._shield=Math.min(1,(P._shield||0)+1);},
  gold:(g)=>()=>{G.gold+=g.v;G.totalGold+=g.v;float(P.x,P.y-60,'开播红包 +'+g.v,'#ffd24a');},
  heal:(g)=>()=>{P.hp=Math.min(ST().maxhp,P.hp+g.v);float(P.x,P.y-60,'+'+g.v,'#7af0a0');},
  nextHit:(g)=>(c)=>{P.giftAcc=(P.giftAcc||0)+(c.v||0);while(P.giftAcc>=g.need){P.giftAcc-=g.need;P.nextHitBonus=(P.nextHitBonus||0)+g.bonus;}},
  procNova:(g)=>()=>{const t=nearestEnemy(600);if(!t)return;const st=ST();explodeAt(t.x,t.y,g.r,(40+G.wave*4)*g.dmg*(1+st.dmgElem),st);},
  /* v0.3.4 协同簇触发 */
  burnExec:(g)=>(c)=>{if(!c.e||!(c.e.burn>0))return;const st=ST(),bd=(4+G.wave*0.4)*(1+st.dmgElem);   // 火上浇油：灼烧敌死→爆炸引燃
    explodeAt(c.e.x,c.e.y,g.r,(20+G.wave*3)*(1+st.dmgElem));
    G.enemies.forEach(e=>{if(!e.dead&&dist2(e,c.e)<g.r*g.r){e.burn=2.5;e.burnDps=bd;}});},
  shockSpread:()=>(c)=>{if(!c.e||!(c.e.shock>0))return;const st=ST();shockArc(c.e,(8+G.wave)*(1+st.dmgElem),2);},  // 社死连锁
  meltdown:(g)=>(c)=>{const e=c.e;if(!e)return;let n=0;['burn','shock','poison','slow','vuln'].forEach(s=>{if(e[s]>0)n++;});  // 综合社死
    if(n<3)return;const st=ST();explodeAt(e.x,e.y,g.r,(40+G.wave*5)*(1+st.dmgElem));
    ['burn','shock','poison','slow','vuln'].forEach(s=>{if(e[s]>0)e[s]+=1;});float(e.x,e.y-e.r,'社死!','#ff5a7a');},
  compound:()=>(c)=>{P._cAcc=(P._cAcc||0)+(c.v||0);                                                  // 数据复利：每500打赏永久+2%(衰减,封顶+50%)
    while(P._cAcc>=500&&(P._compound||0)<0.5){P._cAcc-=500;const step=0.02*Math.pow(0.75,Math.floor((P._compound||0)/0.1));P._compound=Math.min(0.5,(P._compound||0)+step);}},
};
/* 每把武器的攻击视觉风格（render 按此画出不同弹道/挥击/召唤物，打破"都是圆球/光条"） */
const FX_STYLE={
  /* 近战挥击（每把按武器设定专属表现） */
  mic:'soundwave', stick:'lightstick', selfie:'sweepflash', micSpear:'thrust', gauntlet:'flashpunch',
  chair:'heavyslam', nunchaku:'nunchaku', bagFlail:'flail', comboDrum:'drumbeat', rhythmBaton:'baton',
  /* 投射弹道（render 用 b.kind 查） */
  kiss:'heart', hiNote:'beam', card:'card', cardRain:'card', disc:'disc', camera:'photo',
  sling:'pellet', autotune:'wave', giftRPG:'rocket', bagMissile:'rocket', signLD:'bomb',
  memeCannon:'emoji', sparkler:'ember', readFreeze:'shard', cringeArc:'bolt', hitpiece:'paper',
  signLS:'starnote', holo:'spark', ultnote:'ultnote',
  /* nova 环 */
  flash:'flashring', bass:'soundwave', pillowHammer:'shock', candle:'flamering',
  chiller:'frost', projector:'electric', dmShield:'shieldring', signHS:'shock', signHD:'wallring',
  /* 领域 */
  perfume:'miasma', rumorSpray:'venom', holoArray:'holofield',
  /* 召唤物 */
  drone:'drone', camTurret:'turret', aiCohost:'ai', cyberPet:'pet',
};
/* ---------- 武器开火 ---------- */
/* ===== 敌人空间网格（每帧重建）：把"逐子弹×全体敌人"的 O(B·E) 碰撞降到 ~O(B·近邻) ===== */
let _eg=null,_egCol=0,_egRow=0; const _EGC=80;        // 格边 80px（>最大敌人直径，碰撞只涉及邻格）
function buildEnemyGrid(){
  _egCol=Math.max(1,Math.ceil((AW+160)/_EGC)); _egRow=Math.max(1,Math.ceil((AH+160)/_EGC));
  const n=_egCol*_egRow;
  if(!_eg||_eg.length!==n){_eg=new Array(n);for(let i=0;i<n;i++)_eg[i]=[];}
  else for(let i=0;i<n;i++)_eg[i].length=0;
  const es=G.enemies;
  for(let i=0;i<es.length;i++){const e=es[i];if(e.dead)continue;
    let cx=((e.x+80)/_EGC)|0,cy=((e.y+80)/_EGC)|0;
    if(cx<0)cx=0;else if(cx>=_egCol)cx=_egCol-1; if(cy<0)cy=0;else if(cy>=_egRow)cy=_egRow-1;
    _eg[cy*_egCol+cx].push(e);}
}
function eachEnemyNear(x,y,r,cb){                      // 遍历 (x,y) 半径 r 内可能命中的敌人（落在重叠格里）
  if(!_eg){const es=G.enemies;for(let i=0;i<es.length;i++)cb(es[i]);return;}
  let x0=((x-r+80)/_EGC)|0,x1=((x+r+80)/_EGC)|0,y0=((y-r+80)/_EGC)|0,y1=((y+r+80)/_EGC)|0;
  if(x0<0)x0=0; if(y0<0)y0=0; if(x1>=_egCol)x1=_egCol-1; if(y1>=_egRow)y1=_egRow-1;
  for(let cy=y0;cy<=y1;cy++){const base=cy*_egCol;for(let cx=x0;cx<=x1;cx++){const cell=_eg[base+cx];for(let i=0;i<cell.length;i++)cb(cell[i]);}}
}
function nearestNear(x,y,r,skip){                      // 网格版"半径内最近敌人"
  let best=null,bd=r*r;
  eachEnemyNear(x,y,r,e=>{if(e.dead||(skip&&skip.has(e)))return;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e;}});
  return best;
}
function nearestEnemy(range){
  let best=null,bd=range*range;
  G.enemies.forEach(e=>{if(e.dead)return;const d=dist2(e,P);if(d<bd){bd=d;best=e;}});
  return best;
}
function nearestN(range,k){                          // 最近 k 个敌人（多机位锁定）
  return G.enemies.filter(e=>!e.dead&&dist2(e,P)<=range*range).sort((a,b)=>dist2(a,P)-dist2(b,P)).slice(0,k);
}
function chainFrom(src,dmg,jumps,status){            // 链式：跳到附近未命中目标，每跳 ×0.7（§4.5）
  let cur=src,hit=new Set([src]),d=dmg;
  for(let j=0;j<jumps;j++){
    const best=nearestNear(cur.x,cur.y,130,hit);
    if(!best)break;
    fx({type:'ring',x:best.x,y:best.y,r:18,col:'#8fd0ff',ttl:.18});
    hurtEnemy(best,d,false,status);hit.add(best);cur=best;d*=0.7;
  }
}
function shockArc(src,dmg,jumps){                     // 感电：受击瞬间电弧连锁邻近（noTrig 防递归再触发感电）
  let cur=src,hit=new Set([src]);
  for(let j=0;j<jumps;j++){
    const best=nearestNear(cur.x,cur.y,150,hit);
    if(!best)break;
    G.fx.push({type:'arc',x:cur.x,y:cur.y,x2:best.x,y2:best.y,ttl:.16,t:0,col:'#6ae8ff'});
    best.shock=0.55;hurtEnemy(best,dmg,false,{noTrig:1,noFx:1});hit.add(best);cur=best;dmg*=0.8;
  }
}
function fireWeapon(w,st){
  const d=WEAPONS[w.id], mech=wMech(w.id,w.lvl);
  const ov=P._overload?1:0; if(ov)P._overload=0;       // ③ 义体过载：这一发投射物×3/范围×3/连锁3
  let range=d.range*(1+st.range)*(ov?3:1);
  let baseDmg=wDmg(w.id,w.lvl)*wAddBracket(d,st);
  if(P.nextHitBonus){baseDmg*=(1+P.nextHitBonus);P.nextHitBonus=0;}   // 礼物转化：下次攻击加伤
  const F={multishot:(st.multishot||0)+(mech.multishot||0)+(ov?2:0), pierce:(st.pierce||0)+(mech.pierce||0),
    bounce:(st.bounce||0)+(mech.bounce||0), split:(st.split||0)+(mech.split||0),
    homing:(st.homing||0)+(mech.homing||0), chain:(st.chain||0)+(mech.chain||0)+(ov?3:0),
    boom:(mech.boomerang||(d.type==='boomerang')?1:0)};
  const status={knockback:st.knockback+(mech.knockback||0)};
  if(d.status)status[d.status]=1;
  if(mech.chill)status.chill=1; if(mech.poison)status.poison=1; if(mech.vuln)status.vuln=1;
  if(mech.burn)status.burn=1; if(mech.shock)status.shock=1;
  if(mech.shockJump||A('shockJump'))status.shockJump=2+(mech.shockJump||0)+A('shockJump');
  if(st.burn)status.burn=1; if(st.shock)status.shock=1; if(st.poison)status.poison=1; if(st.chill)status.chill=1; if(st.vuln)status.vuln=1;  // 道具全局状态注入
  if(d.randStatus&&!mech.allStatus)status[pick(['burn','shock','poison','chill','vuln'])]=1;   // 表情包炮：每发随机状态
  if(mech.allStatus)['burn','shock','poison','chill','vuln'].forEach(s=>status[s]=1);            // 紫阶：挂全状态
  const expl=d.expl?{r:d.expl.r+(mech.explR||0),m:d.expl.m}:null;                                // 弹体爆炸（高爆/黑稿）
  const crit=()=>{if(P._nextCrit){P._nextCrit=0;return true;}return Math.random()<st.crit;};
  const cm=st.critMult, t=nearestEnemy(range);
  if(d.type==='melee'){
    if(!t)return false;
    const aim=Math.atan2(t.y-P.y,t.x-P.x), arc=d.arc*(1+(mech.arc||0));
    fx({type:'swing',x:P.x,y:P.y,a:aim,arc,r:range,col:d.col,ttl:.2,style:FX_STYLE[w.id]||'slash'});
    G.enemies.forEach(e=>{
      if(e.dead||dist2(e,P)>range*range)return;
      let da=Math.atan2(e.y-P.y,e.x-P.x)-aim;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
      if(Math.abs(da)<=arc/2){const c=crit();hurtEnemy(e,baseDmg*(c?cm:1),c,status);if(!e.boss){e.x+=Math.cos(aim)*14;e.y+=Math.sin(aim)*14;}}
    });
    P.face=Math.cos(aim)<0?-1:1;return true;
  }
  if(d.type==='nova'){
    if(!t)return false;
    fx({type:'ring',x:P.x,y:P.y,r:range,col:d.col,ttl:.4,style:FX_STYLE[w.id]||'ring'});
    G.enemies.forEach(e=>{
      if(e.dead||dist2(e,P)>range*range)return;
      const c=crit();hurtEnemy(e,baseDmg*(c?cm:1),c,status);
      if((w.id==='flash'||mech.stun)&&Math.random()<.3)e.stun=.8*(P.setN['义体矩阵']>=3?1.5:1);
      if(F.chain)chainFrom(e,baseDmg*0.6,F.chain,status);
    });
    return true;
  }
  if(d.type==='homing'||d.type==='pierce'||d.type==='shotgun'||d.type==='boomerang'){
    if(!t)return false;
    const sx=P.x, sy=P.y-30;                              // 子弹实际出膛点（上半身），瞄准须从这里算否则会偏高30px
    const aim=Math.atan2(t.y-sy,t.x-sx);
    const spd0=(d.type==='pierce'?420:260)*st.projSpd;
    const basePierce=(d.type==='pierce'?Math.max(2,F.pierce):F.pierce);
    const n=1+F.multishot+(d.type==='shotgun'?2:0), dmgScale=Math.pow(0.92,Math.max(0,n-1));  // 多重递减
    const mk=(a)=>G.bullets.push({
      x:sx,y:sy,vx:Math.cos(a)*spd0,vy:Math.sin(a)*spd0,
      dmg:baseDmg*dmgScale,crit:crit(),cm,pierce:basePierce,pdec:1,bounce:F.bounce,split:F.split,
      homing:(d.type==='homing'?Math.max(.6,F.homing+.6):F.homing),chain:F.chain,
      boom:F.boom,ox:P.x,oy:P.y,bt:0,ttl:range/spd0+(d.type==='homing'||F.homing?1.6:.2),expl,
      r:(d.type==='pierce'?11:9)*st.projSize,col:d.col,kind:w.id,status,hit:new Set()});
    if(A('multiCam')&&n>1){const tg=nearestN(range,n);for(let i=0;i<n;i++){const e=tg[i]||t;mk(Math.atan2(e.y-sy,e.x-sx));}}  // 多机位：各弹锁不同目标
    else for(let i=0;i<n;i++)mk(aim+(i-(n-1)/2)*0.16);
    fx({type:'hit',x:sx+Math.cos(aim)*14,y:sy+Math.sin(aim)*14,a:aim,r:12,ttl:.09,col:d.col});  // 枪口闪光
    P.face=Math.cos(aim)<0?-1:1;return true;
  }
  if(d.type==='zone'){
    const tgt=t||{x:P.x+rnd(-120,120),y:P.y+rnd(-120,120)};
    const a=Math.atan2(tgt.y-P.y,tgt.x-P.x),dd=Math.min(Math.sqrt(dist2(tgt,P)),range);
    G.zones.push({x:P.x+Math.cos(a)*dd,y:P.y+Math.sin(a)*dd,r:(55+w.lvl*6)*st.projSize,dmg:baseDmg,tick:0,ttl:4*(1+(mech.zoneDur||0)),status,pull:mech.zonePull,style:FX_STYLE[w.id]||'miasma',col:d.col});
    return true;
  }
  if(d.type==='summon'){
    const cap=2+(mech.summonN||0)+(P.mods[2]==='C'?1:0);
    const mine=G.clones.filter(c=>c.holo).length;
    const unit=w.id==='holo'?'holo':(FX_STYLE[w.id]||'holo');   // holo 召唤用全息立绘，其余用程序化召唤物
    if(mine<cap)G.clones.push({x:P.x+rnd(-40,40),y:P.y+rnd(-40,40),ttl:10,cd:0,dmg:baseDmg*(1+A('legion')),lvl:w.lvl,holo:1,crit:mech.cloneCrit?1:0,cm:st.critMult,status,unit,kind:w.id,bob:rnd(0,6)});
    fx({type:'ring',x:P.x,y:P.y,r:60,col:'#7af0ea',ttl:.3,style:'flashring'});
    return true;
  }
  return false;
}

/* ---------- 更新 ---------- */
let _st=null;
function update(dt){
  const st=ST(); _st=st;
  G._hsCd=Math.max(0,(G._hsCd||0)-dt);
  G._impactN=0;                                     // 每帧命中特效预算计数（防大面积命中刷爆特效→卡顿）
  buildEnemyGrid();                                 // 重建敌人空间网格（子弹碰撞/追踪/弹射/连锁靠它降复杂度）
  busTick(dt); procTick(dt); skTick(dt);            // 技能/buff/领域/友军/mosh 推进
  if(G.infHeat)P.heat=100;                           // dev·无限元气
  if(P.mods[2]==='B'){P._bioT=(P._bioT||0)+dt;if(P._bioT>=5){P._bioT=0;P._bio=Math.min(8,(P._bio||0)+1);}}  // ③ 生体无伤叠层
  P._explodeCd=Math.max(0,(P._explodeCd||0)-dt);
  P._saveT=Math.max(0,(P._saveT||0)-dt);
  /* 玩家移动 */
  let mx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  let my=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  P.moving=!!(mx||my);
  if(P.moving){
    const l=Math.hypot(mx,my);
    const sp=175*st.speed*(P._saveT>0?1.25:1);          // 临危救场加速
    P._vx=mx/l*sp;P._vy=my/l*sp;                         // 记录移速向量（敌人预判用）
    P.x=clamp(P.x+P._vx*dt,WALL+10,AW-WALL-10);
    P.y=clamp(P.y+P._vy*dt,WALL+34,AH-WALL-4);
    if(mx)P.face=mx<0?-1:1;
    P.bob+=dt*7.5;
  }else{P._vx=0;P._vy=0;}
  P.ift=Math.max(0,P.ift-dt);
  P.hitFlash=Math.max(0,(P.hitFlash||0)-dt);
  P.skillCd=Math.max(0,P.skillCd-dt);
  P.hp=Math.min(st.maxhp,P.hp+st.regen*dt);
  P.orbA+=dt*2.4;
  /* T型：弹幕投喂 */
  if(P.mods[4]==='T'){
    G.tIncome+=dt;
    if(G.tIncome>4){G.tIncome=0;const v=1+Math.floor(G.wave*.8);G.gold+=v;G.totalGold+=v;
      if(Math.random()<.5)danmaku('投喂了 打赏×'+v,'fan');}
  }
  /* 武器（潜行/歌剧魅影期间不出手） */
  const _stealth=P._skT>0&&P.activeSkill&&P.activeSkill.buff&&P.activeSkill.buff.stealth;
  if(!_stealth)P.weapons.forEach(w=>{
    const d=WEAPONS[w.id];
    if(d.type==='orbit')return;
    w.cd-=dt*(1+st.aspd);
    if(w.cd<=0){if(fireWeapon(w,st))w.cd=wCd(w.id,w.lvl);else w.cd=.12;}
  });
  /* 反光板 */
  P.weapons.filter(w=>w.id==='mirror').forEach(w=>{
    const n=Math.min(w.lvl,3),rr=74*(1+st.range*.5);
    for(let i=0;i<n;i++){
      const a=P.orbA+i*Math.PI*2/n;
      const ox=P.x+Math.cos(a)*rr,oy=P.y-26+Math.sin(a)*rr;
      G.enemies.forEach(e=>{
        if(e.dead||e.mirrorCd>0)return;
        if(dist2(e,{x:ox,y:oy})<(e.r+9)**2){
          const c=Math.random()<st.crit;
          hurtEnemy(e,wDmg('mirror',w.lvl)*wAddBracket(WEAPONS.mirror,st)*(c?st.critMult:1),c);
          e.mirrorCd=.4;
        }
      });
      G.ebullets.forEach(b=>{
        if(b.dead)return;
        if(dist2(b,{x:ox,y:oy})<196){
          b.dead=true;
          G.bullets.push({x:b.x,y:b.y,vx:-b.vx*1.4,vy:-b.vy*1.4,dmg:wDmg('mirror',w.lvl)*2,crit:false,
            pierce:1,ttl:1.2,r:7,col:'#cfe6ff',kind:'reflect',hit:new Set()});
          float(b.x,b.y,'反弹!','#cfe6ff');
        }
      });
    }
  });
  G.enemies.forEach(e=>{if(e.mirrorCd)e.mirrorCd-=dt;});
  /* 分身（应援全开：分身手速+60%） */
  G.clones.forEach(c=>{
    c.ttl-=dt;c.cd-=dt*(P._cheer>0?1.6:1);
    if(c.cd<=0){
      const t=nearestEnemy.call(null,340);
      let best=null,bd=340*340;
      G.enemies.forEach(e=>{if(e.dead)return;const d=dist2(e,c);if(d<bd){bd=d;best=e;}});
      if(best){
        const a=Math.atan2(best.y-c.y,best.x-c.x);
        G.bullets.push({x:c.x,y:c.y-10,vx:Math.cos(a)*260,vy:Math.sin(a)*260,dmg:c.dmg,crit:!!c.crit,cm:c.cm||1.8,
          pierce:0,pdec:1,bounce:0,split:0,homing:0,chain:0,ttl:1.6,r:7,col:'#7af0ea',kind:'holo',status:c.status||{},hit:new Set()});
        if(A('captain')&&Math.random()<.1){P.hp=Math.min(ST().maxhp,P.hp+1);float(c.x,c.y-12,'+1','#7af0a0');}  // 应援团长：召唤攻击回心态
        c.cd=(.8-(c.lvl*.08))*(A('automation')?.75:1);
      }else c.cd=.2;
    }
  });
  G.clones=G.clones.filter(c=>c.ttl>0);
  /* 香水领域（DoT + 吸引 zonePull） */
  G.zones.forEach(z=>{
    z.ttl-=dt;z.tick-=dt;
    if(z.pull)G.enemies.forEach(e=>{if(!e.dead&&!e.boss&&dist2(e,z)<(z.r*1.4)**2){const a=Math.atan2(z.y-e.y,z.x-e.x);e.x+=Math.cos(a)*18*dt;e.y+=Math.sin(a)*18*dt;}});
    if(z.tick<=0){
      z.tick=.5;
      G.enemies.forEach(e=>{if(!e.dead&&dist2(e,z)<z.r*z.r)hurtEnemy(e,z.dmg,false,z.status);});
    }
  });
  G.zones=G.zones.filter(z=>z.ttl>0);
  /* 光环件（§4.3-D） */
  if(P.auras&&P.auras.length){
    P._auraT=(P._auraT||0)-dt;const tick=P._auraT<=0;if(tick)P._auraT=0.5;
    for(const au of P.auras){const r2=au.r*au.r;
      if(au.type==='slow')G.enemies.forEach(e=>{if(!e.dead&&dist2(e,P)<r2)e.slow=Math.max(e.slow,.25);});
      else if(au.type==='dot'&&tick){const dd=au.val*(1+st.dmgElem+st.engi)*0.5;G.enemies.forEach(e=>{if(!e.dead&&dist2(e,P)<r2)hurtEnemy(e,dd,false,{noTrig:1,noFx:1});});}
      else if(au.type==='thorn')G.enemies.forEach(e=>{if(!e.dead&&dist2(e,P)<r2&&(e._thornCd||0)<=0){e._thornCd=.5;hurtEnemy(e,au.val*(1+st.dmgMelee),false,{noTrig:1,noFx:1});}});
    }
    G.enemies.forEach(e=>{if(e._thornCd)e._thornCd-=dt;});
  }
  /* 子弹 */
  G.bullets.forEach(b=>{
    b.ttl-=dt;
    if(b.homing){
      const best=nearestNear(b.x,b.y,560);          // 网格版追踪：锁 560px 内最近敌（后期满屏等价全局最近）
      if(best){
        const a=Math.atan2(best.y-b.y,best.x-b.x),cur=Math.atan2(b.vy,b.vx);
        let da=a-cur;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
        const na=cur+clamp(da,-4*dt,4*dt),sp=Math.hypot(b.vx,b.vy);
        b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;
      }
    }
    if(b.boom){
      b.bt=(b.bt||0)+dt;
      if(b.bt>.65&&!b.back){b.back=1;b.hit.clear();}
      if(b.back){
        const a=Math.atan2(P.y-b.y,P.x-b.x);
        b.vx=Math.cos(a)*340;b.vy=Math.sin(a)*340;
        if(dist2(b,P)<400)b.ttl=0;
      }
    }
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    eachEnemyNear(b.x,b.y,b.r+34,e=>{               // 只检近邻格内敌人（远处不可能命中）
      if(e.dead||b.ttl<=0||b.hit.has(e))return;
      if(dist2(e,b)<(e.r+b.r)**2){
        const bm=(b.back&&b.boom&&A('boomEcon'))?1.5:1;             // 回旋经济学：返程命中+50%且回打赏
        hurtEnemy(e,b.dmg*(b.pdec||1)*(b.crit?(b.cm||1.8):1)*bm,b.crit,b.status);
        if(bm>1&&!b._econ){b._econ=1;const g=2+Math.floor(G.wave*.3);G.gold+=g;G.totalGold+=g;}
        b.hit.add(e);
        if(b.chain){chainFrom(e,b.dmg*0.6,b.chain,b.status);b.chain=0;}
        if((b.pierce||0)>0){b.pierce--;b.pdec=(b.pdec||1)*0.85;}     // 穿透每个目标 ×0.85
        else if((b.bounce||0)>0){                                    // 弹射：转向下一个最近目标
          b.bounce--;b._jump=(b._jump||0)+1;
          const best=nearestNear(b.x,b.y,200,b.hit);
          if(best){const a=Math.atan2(best.y-b.y,best.x-b.x),sp=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;b.dmg*=A('ricochet')?1.1:(b._jump>=3?0.6:1.0);b.ttl=Math.max(b.ttl,.5);}  // 弹无虚发：弹射不衰反增10%
          else b.ttl=0;
        }
        else b.ttl=0;
      }
    });
    if(b.ttl<=0&&b.expl&&!b._didExpl){                               // 弹体爆炸：落地/命中即引爆 AOE（无新系统，复用 explodeAt）
      b._didExpl=1;explodeAt(b.x,b.y,b.expl.r,b.dmg*b.expl.m*(1+(_st?_st.dmgElem:0)));
    }
    if(b.ttl<=0&&(b.split||0)>0&&!b._didSplit){                      // 分裂：消失时裂成小弹（×0.45，不再裂）
      b._didSplit=1;const n=b.split;
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2,sp=240;
        G.bullets.push({x:b.x,y:b.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dmg:b.dmg*0.45,crit:false,cm:1.8,pierce:0,pdec:1,bounce:0,split:0,homing:0,chain:0,ttl:.5,r:7,col:b.col,kind:b.kind,status:b.status,hit:new Set()});}
    }
  });
  G.bullets=G.bullets.filter(b=>b.ttl>0&&b.x>-40&&b.x<AW+40&&b.y>-40&&b.y<AH+40);
  /* 敌人 */
  G.enemies.forEach(e=>{
    if(e.dead)return;
    e.hitFlash=Math.max(0,e.hitFlash-dt);e.mark=Math.max(0,e.mark-dt);e.hitPop=Math.max(0,(e.hitPop||0)-dt*7);
    e.slow=Math.max(0,e.slow-dt);e.stun=Math.max(0,e.stun-dt);
    e.vuln=Math.max(0,(e.vuln||0)-dt);
    if(e.poison>0){e.poison=Math.max(0,e.poison-dt);if(e.poison<=0)e.poisonStk=0;e._pT=(e._pT||0)-dt;if(e._pT<=0){e._pT=0.5;e.hp-=(e.poisonDps||4)*0.5;float(e.x,e.y-e.r-4,'毒','#9af07a');if(e.hp<=0){killEnemy(e);return;}}}
    if(e.burn>0){e.burn=Math.max(0,e.burn-dt);e._bT=(e._bT||0)-dt;if(e._bT<=0){e._bT=0.5;e.hp-=(e.burnDps||5)*0.5;float(e.x,e.y-e.r-4,'烧','#ff8a3a');if(e.hp<=0){killEnemy(e);return;}}}
    e.shock=Math.max(0,(e.shock||0)-dt);e._shockCd=Math.max(0,(e._shockCd||0)-dt);
    e.frozen=Math.max(0,(e.frozen||0)-dt);
    if(e.stun>0)return;
    if(e.fear>0){e.fear-=dt;const fa=Math.atan2(e.y-P.y,e.x-P.x);e.x=clamp(e.x+Math.cos(fa)*e.spd*1.1*dt,-30,AW+30);e.y=clamp(e.y+Math.sin(fa)*e.spd*1.1*dt,-30,AH+30);return;}  // 恐惧逃散
    if(P._moshT>0&&!e.boss)return;                    // mosh：移动交给 skTick，跳过常规AI/攻击
    const _bs=(P._skT>0&&P.activeSkill&&P.activeSkill.buff)||0;
    if(_bs&&_bs.stealth&&!e.boss){e.x+=Math.cos(e.gait)*e.spd*.25*dt;e.y+=Math.sin(e.gait)*e.spd*.25*dt;return;}  // 脱仇恨：乱晃不追
    const sp=e.spd*(e.slow>0?.5:1);
    const a=Math.atan2(P.y-e.y,P.x-e.x);
    if(e.boss)bossAI(e,dt,a,sp);
    else if(e.shooter){
      const d2=dist2(e,P);
      if(d2>52900){e.x+=Math.cos(a)*sp*dt;e.y+=Math.sin(a)*sp*dt;}     // 走到射程内站桩
      e.shootCd-=dt;
      if(e.shootCd<=0&&d2<160000){
        if(e.elite){                                    // 毒舌乐评：3 连发扇形扫射
          e.shootCd=1.6;
          for(let i=0;i<3;i++){const aa=a+(i-1)*.25;
            G.ebullets.push({x:e.x,y:e.y-8,vx:Math.cos(aa)*135,vy:Math.sin(aa)*135,dmg:e.dmg,ttl:3.4,r:9,col:'#c77bff'});}
        }else{                                          // 喷子：预判玩家走位的单发"恶评弹"（较大、略慢）
          e.shootCd=2.4;
          const lead=0.32, px=P.x+(P._vx||0)*lead, py=P.y+(P._vy||0)*lead;
          const aa=Math.atan2(py-e.y,px-e.x);
          G.ebullets.push({x:e.x,y:e.y-8,vx:Math.cos(aa)*115,vy:Math.sin(aa)*115,dmg:e.dmg,ttl:3.6,r:12,col:'#ff5a7a'});
          fx({type:'ring',x:e.x,y:e.y-8,r:12,col:'#ff5a7a',ttl:.2});
        }
      }
    }else if(e.bomber){                                 // 对家自爆：贴近→点引信(预警)→AOE 爆炸（可被引开/躲开）
      if(e.fuse>0){
        e.fuse-=dt;
        e.x+=Math.cos(a)*sp*0.45*dt;e.y+=Math.sin(a)*sp*0.45*dt;     // 引信期减速前扑
        if(e.fuse<=0){killEnemy(e);return;}
      }else{
        e.x+=Math.cos(a)*sp*1.15*dt;e.y+=Math.sin(a)*sp*1.15*dt;
        const d2=dist2(e,P);
        if(d2<((e.r+bodyRadius(P.mods)+4)**2)){killEnemy(e);return;}  // 直接撞上即引爆
        if(d2<((e.r+bodyRadius(P.mods)+64)**2))e.fuse=0.5;            // 进入引信范围→开始倒计时
      }
    }else if(e.type==='shuijun'){                       // 弹幕水军：高速群冲——左右穿插 + 间歇扑刺
      e.weave=(e.weave||(e.x*0.013))+dt*8;
      e.lungeT=(e.lungeT||0)-dt;
      if(e.lungeT<=0){e.lungeT=rnd(.7,1.2);e.lungeP=1;}
      e.lungeP=Math.max(.6,(e.lungeP||1)-dt*1.6);       // 扑刺后短暂提速再回落
      const wob=Math.sin(e.weave)*0.55, perp=a+Math.PI/2;
      e.x+=(Math.cos(a)*e.lungeP+Math.cos(perp)*wob)*sp*dt;
      e.y+=(Math.sin(a)*e.lungeP+Math.sin(perp)*wob)*sp*dt;
    }else if(e.elite){
      e.ai-=dt;
      if(e.dashT>0){e.dashT-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;}
      else if(e.ai<=0&&dist2(e,P)<90000){
        e.ai=4.5;e.dashT=.55;e.vx=Math.cos(a)*330;e.vy=Math.sin(a)*330;
        fx({type:'ring',x:e.x,y:e.y,r:30,col:'#ff4a4a',ttl:.3});
      }else{e.x+=Math.cos(a)*sp*dt;e.y+=Math.sin(a)*sp*dt;}
    }else{e.x+=Math.cos(a)*sp*dt;e.y+=Math.sin(a)*sp*dt;}
    e.x=clamp(e.x,-30,AW+30);e.y=clamp(e.y,-30,AH+30);
    /* 果冻步态：按实际位移推进相位（动得快→晃得快），静止时缓慢呼吸 */
    const _mv=Math.hypot(e.x-(e._px||e.x),e.y-(e._py||e.y));e._px=e.x;e._py=e.y;
    e._mv=_mv; e.gait=(e.gait||0)+_mv*0.16+dt*1.8;
    /* 接触伤害 */
    if(!e.bomber&&dist2(e,P)<((e.r+bodyRadius(P.mods))**2)){
      if(P._skT>0&&P.activeSkill&&P.activeSkill.buff&&(P.activeSkill.buff.fly||P.activeSkill.buff.noContact)){}  // 飞行/独舞：免疫接触
      else hitPlayer(e.dmg);
      if(P._cheer>0&&(e._cheerCd||0)<=0){e._cheerCd=.5;hurtEnemy(e,skHit('melee',.5),false,{noTrig:1,noFx:1});}   // 应援全开：贴身反伤
    }
    if(e._cheerCd)e._cheerCd-=dt;
  });
  G.enemies=G.enemies.filter(e=>!e.dead);
  /* 敌弹 */
  G.ebullets.forEach(b=>{
    b.ttl-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(dist2(b,P)<((b.r+bodyRadius(P.mods))**2)){b.dead=true;hitPlayer(b.dmg);}
  });
  G.ebullets=G.ebullets.filter(b=>!b.dead&&b.ttl>0);
  /* 掉落 */
  G.drops.forEach(d=>{
    d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=.9;d.vy*=.9;
    const dd=dist2(d,P);
    if(dd<st.pickup*st.pickup){const a=Math.atan2(P.y-d.y,P.x-d.x);d.vx=Math.cos(a)*340;d.vy=Math.sin(a)*340;}
    if(dd<256){d.dead=true;collect(d);}
  });
  G.drops=G.drops.filter(d=>!d.dead);
  /* 波次推进 */
  if(G.wave>0){
    G.waveT+=dt;
    G.elSched=G.elSched.filter(s=>{
      if(G.waveT<s.t)return true;
      if(s.warnOnly)danmaku(s.msg||'⚡精英空降直播间！','sys');
      else spawnEnemy(s.type,s.opt);
      return false;
    });
    const w=G.wave, bossW=G.bossW;
    const rate=w<=20?(0.8+0.38*w):((0.8+0.38*20)*Math.pow(1.02,w-20));   // §07 v0.3.8 入场密度（加强+复利）
    const cap=Math.round(w<=20?(20+5.0*w):(120+6*(w-20)));      // 同屏上限(v0.3.8 w20~120·无尽无硬顶)
    const prog=G.waveDur>0?G.waveT/G.waveDur:0;                // 三段式节奏：前40%缓坡/中40%峰值×1.7/后20%收尾
    const peak=bossW?1:(prog<0.4?1:(prog<0.8?1.7:0.6));
    if(!bossW||G.bossRef){
      G.spawnAcc+=dt*rate*peak*(bossW?.5:1);
      while(G.spawnAcc>=1){G.spawnAcc--;if(G.enemies.length<cap)spawnEnemy(pickType());}
    }
    if(!bossW&&G.waveT>=G.waveDur)endWave();           // Boss波靠击杀Boss结束（killEnemy→debutClear）
  }
  /* 特效/浮字 */
  G.fx.forEach(f=>f.t+=dt);G.fx=G.fx.filter(f=>f.t<f.ttl);
  G.floats.forEach(f=>{f.t+=dt;f.y-=28*dt+(f.vy||0)*dt;if(f.vy)f.vy*=Math.pow(.02,dt);});G.floats=G.floats.filter(f=>f.t<.9);
  G.shake=Math.max(0,G.shake-dt*30);
  dmTick(dt);
}
function collect(d){
  if(d.gold){const v=Math.round(d.gold*(1+ST().gold));G.gold+=v;G.totalGold+=v;emit('onGold',{v});if(P.passiveSkill&&P.passiveSkill.onGold)P.passiveSkill.onGold(v);}
  if(d.xp)gainXp(d.xp*(1+ST().xp));
  if(P.passiveSkill&&P.passiveSkill.onPickup)P.passiveSkill.onPickup();   // 全网妹妹/大胃王
}
function gainXp(v){
  G.xp+=v;
  while(G.xp>=G.xpNext){
    G.xp-=G.xpNext;G.level++;G.queuedLv++;
    G.xpNext=8+G.level*5+Math.floor(G.level*G.level*0.5);   // 二次增长（§1.3 后期升级变慢）
    float(P.x,P.y-80,'★ 涨粉里程碑 ★','#4ad8ff');
    emit('onLevelUp',{lv:G.level});
  }
}
/* Boss 弹幕基元（全部走 ebullet，已有玩家碰撞/渲染，零新系统） */
function bRing(e,n,spd,dmg,col){for(let i=0;i<n;i++){const aa=i/n*Math.PI*2;G.ebullets.push({x:e.x,y:e.y-16,vx:Math.cos(aa)*spd,vy:Math.sin(aa)*spd,dmg,ttl:4,r:10,col:col||'#ffd24a'});}}
function bFan(e,a,n,spread,spd,dmg,col){for(let i=0;i<n;i++){const aa=a+(i-(n-1)/2)*spread;G.ebullets.push({x:e.x,y:e.y-8,vx:Math.cos(aa)*spd,vy:Math.sin(aa)*spd,dmg,ttl:3.6,r:11,col:col||'#c77bff'});}}
function bBurstAt(x,y,n,spd,dmg,col){fx({type:'ring',x,y,r:54,col:col||'#ff5a7a',ttl:.45});for(let i=0;i<n;i++){const aa=i/n*Math.PI*2;G.ebullets.push({x,y,vx:Math.cos(aa)*spd,vy:Math.sin(aa)*spd,dmg,ttl:3,r:10,col:col||'#ff5a7a'});}}
const BOSS_ROAR={debt:'再不还钱我砸了直播间！',critic:'这种货色也配出道？',rival:'主场永远是我的！',matrix:'热度就是一切！',censor:'本场直播予以限流。',diva:'让你们看看什么叫天后。'};
function bossAI(e,dt,a,sp){
  const dm=e.dmg, K=e.kind, enrage=(!e.mini && e.hp<e.maxhp*0.30);
  const cdm=enrage?0.5:1;
  if(enrage&&!e._enr){e._enr=1;G.shake=7;danmaku(BOSS_ROAR[K]||'狂暴！','bad',e.type);}
  if(enrage)sp*=1.4;
  e.t1=(e.t1||0)-dt;e.t2=(e.t2||0)-dt;e.t3=(e.t3||0)-dt;e.bubble=Math.max(0,(e.bubble||0)-dt);
  if(e.dashT>0){e.dashT-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;return;}
  e.x+=Math.cos(a)*sp*dt;e.y+=Math.sin(a)*sp*dt;          // 平时缓步逼近
  /* 招式①（所有 boss/mini 都有） */
  if(e.t1<=0){
    if(K==='debt'||K==='rival'){e.t1=(K==='rival'?5:6)*cdm;e.dashT=(K==='rival'?.42:.6);const ds=(K==='rival'?380:300);e.vx=Math.cos(a)*ds;e.vy=Math.sin(a)*ds;if(K==='debt')e.bubble=1.2;fx({type:'ring',x:e.x,y:e.y,r:40,col:'#ffd24a',ttl:.35});}
    else if(K==='critic'){e.t1=3.5*cdm;bFan(e,a,enrage?8:5,.22,140,dm,'#c77bff');}
    else if(K==='matrix'){e.t1=10*cdm;for(let i=0;i<(enrage?2:1);i++)spawnEnemy('shuijun');}      // 自我复制
    else if(K==='censor'){e.t1=7*cdm;bRing(e,enrage?16:10,150,dm,'#6ae8ff');}                     // 封禁放射
    else if(K==='diva'){e.t1=5*cdm;bRing(e,12,80,dm,'#ff9fd0');setTimeout(()=>{if(!e.dead)bRing(e,12,140,dm,'#ff9fd0');},350);}  // 同心圆声波
    else{e.t1=6*cdm;e.dashT=.6;e.vx=Math.cos(a)*300;e.vy=Math.sin(a)*300;}
  }
  /* 招式② */
  if(e.t2<=0){
    if(K==='debt'){e.t2=9*cdm;for(let i=0;i<3;i++)spawnEnemy('duijia');danmaku('小弟们，上！把改造费讨回来！','bad','诊所老板');}
    else if(K==='critic'){e.t2=7*cdm;bBurstAt(P.x,P.y,8,70,dm,'#ff5a7a');}                        // 降星轰炸（落点）
    else if(K==='rival'){e.t2=8*cdm;for(let i=0;i<2;i++){const c=spawnEnemy('duijia');c.maxhp=Math.round(e.maxhp*.2);c.hp=c.maxhp;c.gold=0;}}  // 镜像分身
    else if(K==='matrix'){e.t2=6*cdm;bRing(e,enrage?20:14,110,dm,'#9b6bff');}                      // 谣言扩散环
    else if(K==='censor'){e.t2=8*cdm;bBurstAt(P.x,P.y,10,60,dm,'#6ae8ff');}                         // 限流压制（落点）
    else if(K==='diva'){e.t2=6*cdm;bBurstAt(P.x,P.y,7,75,dm,'#ff9fd0');}                            // 聚光灯扫射
    else e.t2=8*cdm;
  }
  /* 招式③（仅完整 Boss，mini 无） */
  if(!e.mini&&e.t3<=0){
    if(K==='debt'){e.t3=5*cdm;bRing(e,12,120,dm);}                                                 // 账单弹幕环
    else if(K==='critic'){e.t3=10*cdm;for(let i=0;i<4;i++)spawnEnemy('penzi');}                    // 召唤喷子
    else if(K==='rival'){e.t3=8*cdm;for(let i=0;i<8;i++)spawnEnemy('shuijun');}                    // 粉丝海啸
    else if(K==='matrix'){e.t3=9*cdm;bRing(e,18,90,dm,'#9b6bff');}                                 // 控评墙(放射近似)
    else if(K==='censor'){e.t3=7*cdm;bRing(e,enrage?24:16,130,dm,'#6ae8ff');}                       // 封禁双射线
    else if(K==='diva'){e.t3=12*cdm;bRing(e,16,80,dm,'#ff9fd0');bRing(e,16,140,dm,'#ff9fd0');}      // 回忆杀
    else e.t3=7*cdm;
  }
}

/* ---------- 渲染 ---------- */
let floorCv=null, floorStage=-1, _floorDirty=false;
const MAPBG={}, MAPBGLOAD={};                          // 各阶段(0-5)地图背景，按当前改造阶段切换
function getMapBg(stage){
  if(stage in MAPBG)return MAPBG[stage];
  if(!MAPBGLOAD[stage]){MAPBGLOAD[stage]=1;const im=new Image();
    im.onload=()=>{MAPBG[stage]=im;_floorDirty=true;};im.onerror=()=>{MAPBG[stage]=null;};im.src='art/maps/bg'+stage+'.jpg';}
  return undefined;
}
function makeFloor(){
  floorCv=document.createElement('canvas');floorCv.width=AW;floorCv.height=AH;
  const g=floorCv.getContext('2d');
  const stage=Math.min(5,(typeof P!=='undefined'&&P.mods)?P.mods.length:0); floorStage=stage;
  g.fillStyle='#0d0a16';g.fillRect(0,0,AW,AH);
  const bg=getMapBg(stage);
  if(bg&&bg.width){                                    // 关卡地图背景：cover 平铺 + 压暗 + 低不透明 → 浅淡纹理不干扰视线
    const s=Math.max(AW/bg.width,AH/bg.height),dw=bg.width*s,dh=bg.height*s;
    g.save();g.imageSmoothingEnabled=false;g.globalAlpha=0.40;g.drawImage(bg,(AW-dw)/2,(AH-dh)/2,dw,dh);g.restore();
    g.fillStyle='rgba(13,10,22,0.5)';g.fillRect(0,0,AW,AH);   // 再压暗一层，保持安静
    g.strokeStyle='#ffffff07';                                // 有背景时网格更淡
  }else g.strokeStyle='#171226';                              // 无图回退：原深色网格
  g.lineWidth=1;
  for(let x=0;x<AW;x+=44){g.beginPath();g.moveTo(x,0);g.lineTo(x,AH);g.stroke();}
  for(let y=0;y<AH;y+=44){g.beginPath();g.moveTo(0,y);g.lineTo(AW,y);g.stroke();}
  /* 舞台聚光 */
  [[AW*.24,AH*.20,'#ff7bc1'],[AW*.76,AH*.18,'#4ad8ff'],[AW*.5,AH*.55,'#9b6bff'],[AW*.17,AH*.78,'#ffd24a']].forEach(s=>{
    const rg=g.createRadialGradient(s[0],s[1],10,s[0],s[1],150);
    rg.addColorStop(0,s[2]+'14');rg.addColorStop(1,'#0000');
    g.fillStyle=rg;g.fillRect(s[0]-150,s[1]-150,300,300);
  });
  g.strokeStyle='#2a2238';g.lineWidth=3;g.strokeRect(WALL,WALL,AW-2*WALL,AH-2*WALL);
  g.strokeStyle='#ff7bc144';g.lineWidth=1;g.strokeRect(WALL+3,WALL+3,AW-2*WALL-6,AH-2*WALL-6);
}
function heartPath(g,x,y,s,col){
  g.fillStyle=col;
  g.fillRect(x-s,y-s,s,s);g.fillRect(x+1,y-s,s,s);
  g.fillRect(x-s,y,s*2+1,s);g.fillRect(x-s+1,y+s,s*2-1,s*.8);
  g.fillRect(x,y+s*1.6,1,1);
}
/* 按武器风格画出不同弹道（破除"全是圆球"） */
function drawBulletShape(ctx,b,now){
  const shape=FX_STYLE[b.kind]||'orb', col=b.col||'#fff', x=b.x, y=b.y, r=b.r||8;
  const ang=Math.atan2(b.vy||0,b.vx||0);
  ctx.shadowColor=col;ctx.shadowBlur=G._heavy?0:16;     // 子弹海时关辉光（shadowBlur 是 canvas 最贵的开销）；弹幕不多时照常发光
  if(shape==='heart'){heartPath(ctx,x,y,5,col);}
  else if(shape==='spark'){ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineCap='round';
    for(let i=0;i<3;i++){const a=ang+i*2.094;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*6,y+Math.sin(a)*6);ctx.stroke();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,2.4,0,7);ctx.fill();}
  else if(shape==='beam'){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle=col;
    ctx.globalAlpha=.35;ctx.fillRect(-24,-3,46,6);ctx.globalAlpha=1;ctx.fillRect(-14,-2.5,28,5);ctx.fillStyle='#fff';ctx.fillRect(7,-1.5,9,3);ctx.restore();}
  else if(shape==='card'){ctx.save();ctx.translate(x,y);ctx.rotate(now/90+x);ctx.fillStyle=col;ctx.fillRect(-9,-12,18,24);
    ctx.fillStyle='#fff';ctx.fillRect(-6,-9,12,3);ctx.fillRect(-6,-3,8,2);ctx.restore();}
  else if(shape==='disc'){ctx.save();ctx.translate(x,y);ctx.rotate(now/110);ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.fill();
    ctx.fillStyle='#ffffffcc';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,9,now/180,now/180+1.1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#16121e';ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();ctx.restore();}
  else if(shape==='photo'){ctx.save();ctx.translate(x,y);ctx.rotate(now/220+x);ctx.fillStyle='#fff';ctx.fillRect(-8,-8,16,16);
    ctx.fillStyle=col;ctx.fillRect(-6,-6,12,9);ctx.restore();}
  else if(shape==='pellet'){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle=col;ctx.globalAlpha=.4;ctx.fillRect(-18,-1.5,18,3);ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,Math.max(2.5,r*.5),0,7);ctx.fill();ctx.restore();}
  else if(shape==='rocket'){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle='#ff7a3a';ctx.globalAlpha=.85;
    ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(-15-Math.random()*6,-3);ctx.lineTo(-15-Math.random()*6,3);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();}
  else if(shape==='bomb'){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r*.95,0,7);ctx.fill();
    ctx.fillStyle='#ffd24a';ctx.fillRect(x-1,y-r-4,2,5);ctx.fillStyle='#fff';ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(x-2,y-2,2,0,7);ctx.fill();ctx.globalAlpha=1;}
  else if(shape==='emoji'){ctx.fillStyle='#ffd24a';ctx.beginPath();ctx.arc(x,y,r*.95,0,7);ctx.fill();
    ctx.fillStyle='#3a2a00';ctx.fillRect(x-3,y-2,1.8,1.8);ctx.fillRect(x+1.4,y-2,1.8,1.8);
    ctx.strokeStyle='#3a2a00';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y+1,2.6,0.2,Math.PI-0.2);ctx.stroke();}
  else if(shape==='ember'){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,y-7);ctx.quadraticCurveTo(x+5,y,x,y+5);ctx.quadraticCurveTo(x-5,y,x,y-7);ctx.fill();
    ctx.fillStyle='#fff6c0';ctx.beginPath();ctx.arc(x,y+1,2,0,7);ctx.fill();}
  else if(shape==='shard'){ctx.save();ctx.translate(x,y);ctx.rotate(now/240+x);ctx.fillStyle=col;
    ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(5,0);ctx.lineTo(0,9);ctx.lineTo(-5,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.globalAlpha=.6;ctx.fillRect(-1,-6,2,12);ctx.restore();}
  else if(shape==='bolt'){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.strokeStyle=col;ctx.lineWidth=2.6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(-2,-4);ctx.lineTo(2,3);ctx.lineTo(9,-2);ctx.stroke();ctx.restore();}
  else if(shape==='paper'){ctx.save();ctx.translate(x,y);ctx.rotate(now/120+x);ctx.fillStyle='#e8e2d0';ctx.fillRect(-7,-8,14,16);
    ctx.fillStyle='#555';for(let i=0;i<4;i++)ctx.fillRect(-5,-6+i*4,10,1.4);ctx.restore();}
  else if(shape==='wave'){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-9,Math.sin(-9*0.8+now/40)*4);for(let i=-8;i<=9;i++)ctx.lineTo(i,Math.sin(i*0.8+now/40)*4);ctx.stroke();ctx.restore();}
  else if(shape==='starnote'){ctx.save();ctx.translate(x,y);ctx.fillStyle=col;
    for(let i=0;i<4;i++){const a=now/300+i*Math.PI/2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*9,Math.sin(a)*9);ctx.lineTo(Math.cos(a+.5)*3.2,Math.sin(a+.5)*3.2);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();ctx.restore();}
  else if(shape==='ultnote'){ctx.save();ctx.translate(x,y);const pr=1+0.22*Math.sin(now/80);  // 大招专属弹：发光大星音+彗尾，明显区别普通子弹
    ctx.shadowBlur=24;ctx.globalAlpha=.45;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,(r+6)*pr,0,7);ctx.fill();ctx.globalAlpha=1;
    ctx.save();ctx.rotate(ang);ctx.globalAlpha=.4;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle=col;for(let i=0;i<5;i++){const a=now/200+i*1.2566;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*(r+5),Math.sin(a)*(r+5));ctx.lineTo(Math.cos(a+.4)*4.2,Math.sin(a+.4)*4.2);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,r*.6+2,0,7);ctx.fill();ctx.restore();}
  else{ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y,r*.42,0,7);ctx.fill();ctx.globalAlpha=1;}
}
/* 按召唤武器画出不同召唤物（破除"召唤物都一样"） */
function drawSummon(ctx,x,y,u){
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(u==='drone'){ctx.shadowColor='#7af0ea';ctx.shadowBlur=10;ctx.strokeStyle='#9fe0ff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x-14,y-6);ctx.lineTo(x-6,y-2);ctx.moveTo(x+14,y-6);ctx.lineTo(x+6,y-2);ctx.stroke();
    const rot=performance.now()/30;ctx.strokeStyle='#cfeeff';ctx.globalAlpha=.6;
    [[-14,-6],[14,-6]].forEach(p=>{ctx.beginPath();ctx.ellipse(x+p[0],y-7,7,2,rot,0,7);ctx.stroke();});ctx.globalAlpha=1;
    ctx.fillStyle='#2a3550';ctx.fillRect(x-7,y-4,14,9);ctx.fillStyle='#7af0a0';ctx.fillRect(x-2,y+1,4,3);}
  else if(u==='turret'){const T=performance.now();ctx.save();ctx.translate(x,y);ctx.scale(1.5,1.5);   // 大招级机位炮台：更大、发光、扫描炮管 + 闪烁REC
    ctx.shadowColor='#8fd0ff';ctx.shadowBlur=12;
    ctx.strokeStyle='#7a8398';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-8,14);ctx.moveTo(0,0);ctx.lineTo(8,14);ctx.moveTo(0,0);ctx.lineTo(0,14);ctx.stroke();   // 三脚架
    const ba=Math.sin(T/600)*0.6;ctx.save();ctx.translate(0,-5);ctx.rotate(ba);ctx.fillStyle='#3a4458';ctx.fillRect(0,-3,20,6);ctx.fillStyle='#8fd0ff';ctx.fillRect(18,-2.5,4,5);ctx.restore();   // 扫描炮管
    ctx.fillStyle='#2c2438';ctx.fillRect(-11,-13,22,15);ctx.strokeStyle='#9fe0ff';ctx.lineWidth=1.4;ctx.strokeRect(-11,-13,22,15);   // 机身
    const pl=0.55+0.45*Math.sin(T/170);ctx.globalAlpha=pl;ctx.fillStyle='#8fd0ff';ctx.beginPath();ctx.arc(-3,-5,4.5,0,7);ctx.fill();ctx.globalAlpha=1;   // 脉动镜头
    ctx.fillStyle='#10202e';ctx.beginPath();ctx.arc(-3,-5,2,0,7);ctx.fill();
    ctx.fillStyle=(Math.sin(T/280)>0)?'#ff5a5a':'#5a2a2a';ctx.fillRect(5,-11,3.5,3.5);ctx.restore();}   // 闪烁 REC 红灯
  else if(u==='ai'){ctx.shadowColor='#9b6bff';ctx.shadowBlur=12;ctx.globalAlpha=.85;
    ctx.fillStyle='#c8a8ff';ctx.beginPath();ctx.arc(x,y-2,10,0,7);ctx.fill();
    ctx.fillStyle='#1a1030';ctx.fillRect(x-5,y-4,3,2);ctx.fillRect(x+2,y-4,3,2);ctx.fillRect(x-3,y+2,6,1.5);
    ctx.globalAlpha=.4;ctx.fillStyle='#9b6bff';ctx.fillRect(x-10,y+8,20,2);}
  else if(u==='pet'){ctx.shadowColor='#ffb0d0';ctx.shadowBlur=10;ctx.fillStyle='#ff9ad0';
    ctx.beginPath();ctx.moveTo(x-9,y-5);ctx.lineTo(x-4,y-13);ctx.lineTo(x-1,y-6);ctx.fill();
    ctx.beginPath();ctx.moveTo(x+9,y-5);ctx.lineTo(x+4,y-13);ctx.lineTo(x+1,y-6);ctx.fill();
    ctx.beginPath();ctx.arc(x,y,9,0,7);ctx.fill();
    ctx.fillStyle='#1a1020';ctx.fillRect(x-4,y-2,2.5,2.5);ctx.fillRect(x+1.6,y-2,2.5,2.5);}
  else{ctx.shadowColor='#7af0ea';ctx.shadowBlur=12;ctx.fillStyle='#7af0ea';ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.fill();}
  ctx.restore();
}
function render(){
  ctx.save();
  G._heavy=(G.bullets.length+G.ebullets.length+G.enemies.length)>200;   // 子弹/敌人海→降级辉光等高开销特效，保帧率
  const _fst=Math.min(5,P.mods.length);                // 阶段变化或地图背景刚加载完→重建地面
  if(!floorCv||_floorDirty||floorStage!==_fst){_floorDirty=false;makeFloor();}
  if(G.shake>0)ctx.translate(rnd(-G.shake,G.shake)*.5,rnd(-G.shake,G.shake)*.5);
  ctx.drawImage(floorCv,0,0);
  /* 领域 */
  G.zones.forEach(z=>{
    const T=performance.now(), s=z.style||'miasma';
    const fillC=s==='venom'?'#9ae84a':(s==='holofield'?'#7af0ea':'#d8a8ff'), edgeC=s==='venom'?'#caff8a':(s==='holofield'?'#bdfff6':'#ecccff');
    ctx.save();
    ctx.globalAlpha=.16+Math.sin(T/180)*.06;ctx.fillStyle=fillC;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.fill();
    ctx.globalAlpha=.7;ctx.shadowColor=edgeC;ctx.shadowBlur=16;ctx.strokeStyle=edgeC;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.stroke();
    if(s==='holofield'){                                  // 全息应援阵：内部网格地砖
      ctx.globalAlpha=.35;ctx.lineWidth=1;ctx.beginPath();
      for(let gx=-z.r;gx<=z.r;gx+=14){ctx.moveTo(z.x+gx,z.y-z.r);ctx.lineTo(z.x+gx,z.y+z.r);ctx.moveTo(z.x-z.r,z.y+gx);ctx.lineTo(z.x+z.r,z.y+gx);}
      ctx.save();ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.clip();ctx.stroke();ctx.restore();
    }else{                                                // 毒/谣言雾：翻腾气泡
      ctx.globalAlpha=.5;ctx.fillStyle=edgeC;
      for(let i=0;i<5;i++){const a=T/400+i*1.6,rr=z.r*(0.3+0.5*((i*0.27+T/1700)%1));ctx.beginPath();ctx.arc(z.x+Math.cos(a)*rr,z.y+Math.sin(a)*rr,3,0,7);ctx.fill();}
    }
    ctx.restore();
  });
  /* 技能领域（地面层） */
  G.fields.forEach(f=>{const T=performance.now(),col=f.col||'#9b6bff';ctx.save();
    if(f.tshape){                                        // T台压场：发光 T 字聚光区
      ctx.globalAlpha=.16+Math.sin(T/220)*.05;ctx.fillStyle=col;
      ctx.fillRect(f.x-T_BAR,f.y-T_STEMH,T_BAR*2,T_BARH);ctx.fillRect(f.x-T_STEM,f.y-T_STEMH,T_STEM*2,T_STEMH*2);
      ctx.globalAlpha=.6;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.strokeStyle=col;ctx.lineWidth=3;
      ctx.strokeRect(f.x-T_BAR,f.y-T_STEMH,T_BAR*2,T_BARH);ctx.strokeRect(f.x-T_STEM,f.y-T_STEMH+T_BARH,T_STEM*2,T_STEMH*2-T_BARH);
      ctx.restore();return;}
    const pulse=f.flame?(1+Math.sin(T/90+f.x)*.10):1;
    ctx.globalAlpha=(f.flame?.16:.10)+Math.sin(T/200)*.04;ctx.fillStyle=col;ctx.beginPath();ctx.arc(f.x,f.y,f.r*pulse,0,7);ctx.fill();
    ctx.globalAlpha=f.flame?.6:.45;ctx.shadowColor=col;ctx.shadowBlur=f.flame?14:6;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,f.r*pulse,0,7);ctx.stroke();
    if(f.flame){ctx.globalAlpha=.5;for(let i=0;i<6;i++){const a=T/300+i*1.047,rr=f.r*(.5+.4*((i*.21+T/1300)%1));ctx.fillStyle='#ffd24a';ctx.beginPath();ctx.arc(f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr,2.6,0,7);ctx.fill();}}
    else if(f.radio||f.bass||f.dark){                     // 声波/低频/暗影：多层向外扩散环 + 环上能量点
      ctx.lineWidth=f.bass?3:2;ctx.shadowColor=col;ctx.shadowBlur=8;
      for(let i=0;i<4;i++){const ph=((T/(f.bass?620:900)+i*0.25)%1),rr=f.r*(0.22+ph*0.9);
        ctx.globalAlpha=(1-ph)*(f.dark?.55:.5);ctx.beginPath();ctx.arc(f.x,f.y,rr,0,7);ctx.stroke();}
      ctx.shadowBlur=0;ctx.globalAlpha=.6;ctx.fillStyle=col;
      const np=f.bass?12:8;for(let i=0;i<np;i++){const a=i*(6.283/np)+T/(f.bass?500:1300),rr=f.r*(0.55+0.35*Math.sin(T/300+i*1.3));
        ctx.beginPath();ctx.arc(f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr,f.bass?3.4:2.6,0,7);ctx.fill();}}
    ctx.restore();});
  /* 友军（圈来的观众，青色辉光 + 头顶心标记） */
  G.allies.forEach(a=>{ctx.save();ctx.shadowColor='#46e8ff';ctx.shadowBlur=9;ctx.translate(a.x,a.y+a.r);if(P.x<a.x)ctx.scale(-1,1);
    const img=ENEMY_IMG[a.type]||ENEMY_IMG[a.tex];
    if(img&&img.width){const dh=a.r*3.0,dw=img.width*dh/img.height;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,-dw/2,-dh,dw,dh);}
    else{ctx.fillStyle='#7af0ea';ctx.beginPath();ctx.arc(0,-a.r,a.r,0,7);ctx.fill();}
    ctx.restore();heartPath(ctx,a.x,a.y-a.r*2.2,2.5,'#7af0ea');});
  /* 掉落 */
  G.drops.forEach(d=>{                                   // 打赏：发光绿色桃心小宝石（醒目+脉动）
    const pulse=1+Math.sin(performance.now()/180+d.x)*0.14, s=5*pulse;
    ctx.save();ctx.shadowColor='#46f0a0';ctx.shadowBlur=13;
    heartPath(ctx,d.x,d.y-2,s,'#3fe88c');                 // 绿桃心主体
    ctx.shadowBlur=0;ctx.globalAlpha=.85;ctx.fillStyle='#e6fff0';ctx.fillRect(d.x-s*0.55,d.y-s*0.7,2,2);  // 宝石高光
    ctx.restore();
  });
  /* 召唤物（按召唤武器画不同形态） */
  G.clones.forEach(c=>{
    const u=c.unit||'holo', bob=Math.sin(performance.now()/300+(c.bob||0))*3;
    if(c.chibi){                                          // 人型分身（人偶/青梅）：画成和主角一样的Q版人，半透明+染色辉光
      const sc=c.sister?0.84:0.74, tint=c.tint||'#7af0ea';
      ctx.save();ctx.translate(c.x,c.y+bob);ctx.scale(sc,sc);
      ctx.globalAlpha=c.sister?0.95:(0.62+Math.sin(performance.now()/150+(c.bob||0))*0.12);
      drawChibi(ctx,0,0,c.mods||P.mods,{face:P.x<c.x?-1:1,moving:false,run:0,t:performance.now()/1000+(c.bob||0),hit:0});
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.18;ctx.fillStyle=tint;
      ctx.beginPath();ctx.arc(0,-22,18,0,7);ctx.fill();ctx.restore();
    }else if(u==='holo'){
      const w=HOLO.width*1.8,h=HOLO.height*1.8;
      ctx.save();ctx.globalAlpha=.6+Math.sin(performance.now()/120)*.15;
      ctx.shadowColor='#7af0ea';ctx.shadowBlur=14;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(HOLO,c.x-w/2,c.y-h+6,w,h);ctx.restore();
    }else drawSummon(ctx,c.x,c.y-14+bob,u);
  });
  /* 敌人（按 y 排序）；玩家不在此画——放到子弹之后，保证子弹再多也不挡住操作角色 */
  const ents=G.enemies.map(e=>({y:e.y,e}));
  ents.sort((a,b)=>a.y-b.y);
  ents.forEach(o=>drawEnemy(o.e));
  /* 反光板 */
  P.weapons.filter(w=>w.id==='mirror').forEach(w=>{
    const n=Math.min(w.lvl,3),rr=74*(1+ST().range*.5);
    for(let i=0;i<n;i++){
      const a=P.orbA+i*Math.PI*2/n;
      const ox=P.x+Math.cos(a)*rr,oy=P.y-26+Math.sin(a)*rr;
      ctx.save();ctx.shadowColor='#9fe0ff';ctx.shadowBlur=12;
      ctx.fillStyle='#cfe6ff';ctx.fillRect(ox-8,oy-12,17,24);
      ctx.fillStyle='#8fb8e8';ctx.fillRect(ox-8,oy-12,5,24);ctx.restore();
    }
  });
  /* 子弹（按武器风格画不同弹道） */
  const NOW=performance.now();
  G.bullets.forEach(b=>{
    ctx.save();
    drawBulletShape(ctx,b,NOW);
    ctx.restore();
  });
  /* 敌弹（恶评弹：脉动红/紫光球） */
  G.ebullets.forEach(b=>{
    const pul=1+0.12*Math.sin(NOW/90+b.x);
    ctx.save();ctx.shadowColor=b.col||'#ff5a5a';ctx.shadowBlur=G._heavy?0:14;
    ctx.fillStyle=b.col||'#ff6a6a';ctx.beginPath();ctx.arc(b.x,b.y,b.r*pul,0,7);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(b.x,b.y,b.r*.4,0,7);ctx.fill();
    ctx.restore();
  });
  drawPlayer();                                          // 玩家画在所有子弹之上（永远清晰可见）
  /* 特效 */
  G.fx.forEach(f=>{
    const k=f.t/f.ttl;
    if(f.type==='ring'){ctx.save();ctx.globalAlpha=1-k;ctx.shadowColor=f.col;ctx.shadowBlur=G._heavy?0:14;ctx.strokeStyle=f.col;ctx.lineWidth=4;ctx.fillStyle=f.col;
      const R=f.r*k, s=f.style;
      ctx.beginPath();ctx.arc(f.x,f.y,R,0,7);ctx.stroke();
      if(s==='soundwave'){ctx.globalAlpha=(1-k)*.6;ctx.beginPath();ctx.arc(f.x,f.y,R*.6,0,7);ctx.stroke();ctx.beginPath();ctx.arc(f.x,f.y,R*1.18,0,7);ctx.stroke();}        // 低音：同心声波
      else if(s==='frost'){for(let i=0;i<8;i++){const a=i*0.785+k;ctx.fillRect(f.x+Math.cos(a)*R-1.6,f.y+Math.sin(a)*R-1.6,3.2,3.2);}}                                       // 冷场：冰晶颗粒
      else if(s==='electric'){ctx.lineWidth=2;for(let i=0;i<6;i++){const a=i*1.047+k*3;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*R*.5,f.y+Math.sin(a)*R*.5);ctx.lineTo(f.x+Math.cos(a+.25)*R,f.y+Math.sin(a+.25)*R);ctx.stroke();}}  // 放映机：放射电弧
      else if(s==='flamering'){for(let i=0;i<10;i++){const a=i*0.628+k*2,rr=R*(0.85+(i%3)*0.08);ctx.beginPath();ctx.arc(f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr,2.4,0,7);ctx.fill();}}  // 烛火：火点环
      else if(s==='shock'||s==='wallring'){ctx.lineWidth=s==='shock'?7:8;ctx.globalAlpha=(1-k)*.85;ctx.beginPath();ctx.arc(f.x,f.y,R,0,7);ctx.stroke();}                       // 巨锤/音墙：厚重地震环
      ctx.restore();}
    if(f.type==='swing'){
      ctx.save();const a=1-k, cx=f.x, cy=f.y-26, ar=f.arc, R=f.r, s=f.style||'slash', A0=f.a-ar/2, A1=f.a+ar/2;
      ctx.shadowColor=f.col;ctx.shadowBlur=10;ctx.strokeStyle=f.col;ctx.fillStyle=f.col;ctx.lineCap='round';ctx.globalAlpha=a;
      if(s==='soundwave'){                       // 老麦克风：扇形声波涟漪（同心弧）
        for(let i=0;i<3;i++){const rr=R*(0.4+i*0.3)*(0.7+k*0.55);ctx.globalAlpha=a*(1-i*0.28);ctx.lineWidth=3.2-i*0.7;
          ctx.beginPath();ctx.arc(cx,cy,rr,A0,A1);ctx.stroke();}}
      else if(s==='lightstick'){                 // 应援棒：荧光棒连击残影（双色光棒）
        for(let i=0;i<4;i++){const aa=A0+ar*(i/3),r0=R*0.38,r1=R*0.95*(0.8+k*0.25);
          ctx.strokeStyle=i%2?'#86f08a':'#9fe8ff';ctx.lineWidth=4*a+1;
          ctx.beginPath();ctx.moveTo(cx+Math.cos(aa)*r0,cy+Math.sin(aa)*r0);ctx.lineTo(cx+Math.cos(aa)*r1,cy+Math.sin(aa)*r1);ctx.stroke();
          ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx+Math.cos(aa)*r1,cy+Math.sin(aa)*r1,2.4*a,0,7);ctx.fill();}}
      else if(s==='sweepflash'){                 // 自拍杆：大横扫 + 杆头相机闪光
        ctx.lineWidth=7;ctx.globalAlpha=a*.8;const sw=k*.5;ctx.beginPath();ctx.arc(cx,cy,R*.9,A0+sw,A1+sw);ctx.stroke();
        const le=A1+sw,tx=cx+Math.cos(le)*R*.9,ty=cy+Math.sin(le)*R*.9;
        ctx.globalAlpha=a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(tx,ty,5*a,0,7);ctx.fill();
        ctx.strokeStyle='#fff';ctx.lineWidth=1.5;for(let i=0;i<4;i++){const ra=i*1.57+k;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+Math.cos(ra)*9*a,ty+Math.sin(ra)*9*a);ctx.stroke();}}
      else if(s==='thrust'){                     // 麦架长枪：直线突刺（枪头麦克风球）
        const L=R*(0.6+k*0.5),tx=cx+Math.cos(f.a)*L,ty=cy+Math.sin(f.a)*L;
        ctx.lineWidth=5*a+2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(tx,ty);ctx.stroke();
        ctx.beginPath();ctx.arc(tx,ty,5*a,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.globalAlpha=a*.6;ctx.beginPath();ctx.arc(tx,ty,2.4*a,0,7);ctx.fill();}
      else if(s==='flashpunch'){                 // 镁光拳套：贴脸闪光冲击
        const px=cx+Math.cos(f.a)*R*0.55,py=cy+Math.sin(f.a)*R*0.55;
        ctx.fillStyle='#fff6d0';ctx.globalAlpha=a;ctx.beginPath();ctx.arc(px,py,9*a*(0.5+k),0,7);ctx.fill();
        ctx.strokeStyle='#fff6d0';ctx.lineWidth=2;ctx.globalAlpha=a*.85;for(let i=0;i<6;i++){const ra=i*1.047;const rr=7+k*16;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(ra)*rr,py+Math.sin(ra)*rr);ctx.stroke();}}
      else if(s==='heavyslam'){                  // 战术折叠椅：沉重双横扫 + 砸地扬尘
        const sw=k*.5;ctx.lineWidth=9;ctx.globalAlpha=a;ctx.beginPath();ctx.arc(cx,cy,R*.9,A0+sw,A1+sw);ctx.stroke();
        ctx.lineWidth=4;ctx.globalAlpha=a*.5;ctx.beginPath();ctx.arc(cx,cy,R*.72,A0+sw,A1+sw);ctx.stroke();
        const te=A1+sw,tx=cx+Math.cos(te)*R*.85,ty=cy+Math.sin(te)*R*.85;
        ctx.lineWidth=3;ctx.globalAlpha=a*.7;ctx.beginPath();ctx.arc(tx,ty,7+k*20,0,7);ctx.stroke();}
      else if(s==='nunchaku'){                   // 双截应援棒：双链球连环扫
        const swA=A0+ar*1.4*k, len=R*0.85;
        [[swA,f.col],[swA+0.5,'#86f08a']].forEach(([aa,bc],j)=>{const bx=cx+Math.cos(aa)*len,by=cy+Math.sin(aa)*len;
          ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.globalAlpha=a*(j?0.55:1);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(bx,by);ctx.stroke();
          ctx.fillStyle=bc;ctx.beginPath();ctx.arc(bx,by,5*a,0,7);ctx.fill();});
        ctx.strokeStyle=f.col;ctx.globalAlpha=a*.35;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,len,A0,swA);ctx.stroke();}
      else if(s==='flail'){                       // 痛包链锤：流星锤回旋
        const oa=f.a+k*Math.PI*2, len=R*0.8, bx=cx+Math.cos(oa)*len, by=cy+Math.sin(oa)*len;
        ctx.globalAlpha=a*.4;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,len,oa-2,oa);ctx.stroke();
        ctx.globalAlpha=a;ctx.strokeStyle='#b8a0c0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(bx,by);ctx.stroke();
        ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(bx,by,6*a,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.globalAlpha=a*.5;ctx.beginPath();ctx.arc(bx,by,2.4,0,7);ctx.fill();}
      else if(s==='drumbeat'){                    // 完美连击鼓：节奏脉冲环 + 鼓点
        for(let i=0;i<2;i++){const pr=R*(0.45+i*0.4)*(0.55+k*0.6);ctx.globalAlpha=a*(1-i*0.35);ctx.lineWidth=3.5-i;ctx.beginPath();ctx.arc(cx,cy,pr,A0,A1);ctx.stroke();}
        ctx.globalAlpha=a;ctx.fillStyle=f.col;[0.5,0.85].forEach(fr=>{const r=R*fr;ctx.beginPath();ctx.arc(cx+Math.cos(f.a)*r,cy+Math.sin(f.a)*r,2.4*a,0,7);ctx.fill();});}
      else if(s==='baton'){                       // 节奏带·甩棍：快速点刺 + 小音符
        const L=R*(0.5+k*0.5),tx=cx+Math.cos(f.a)*L,ty=cy+Math.sin(f.a)*L;
        ctx.lineWidth=3.5*a+1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(tx,ty);ctx.stroke();
        ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(tx,ty,2.2*a,0,7);ctx.fill();ctx.fillRect(tx+1,ty-8*a,1.6,7*a);}
      else{                                        // 默认：斩击弧 + 白刃
        const wide=s==='slashwide';ctx.globalAlpha=a*.85;ctx.lineWidth=wide?8:6;ctx.beginPath();ctx.arc(cx,cy,R*.92,A0+k*.4,A1+k*.4);ctx.stroke();
        ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R*.92,A0+k*.4,A1+k*.4);ctx.stroke();}
      ctx.restore();}
    if(f.type==='heart'){ctx.globalAlpha=1-k;heartPath(ctx,f.x,f.y-k*26,3,'#ff7bc1');ctx.globalAlpha=1;}
    if(f.type==='flash'){ctx.globalAlpha=(1-k)*.35;ctx.fillStyle=f.col||'#fff';ctx.fillRect(0,0,AW,AH);ctx.globalAlpha=1;}
    if(f.type==='spark'){ctx.globalAlpha=1-k;ctx.fillStyle='#7af0ea';
      for(let i=0;i<4;i++)ctx.fillRect(f.x+rnd(-10,10),f.y+rnd(-10,10),2,2);ctx.globalAlpha=1;}
    if(f.type==='arc'){ctx.save();ctx.globalAlpha=1-k;ctx.shadowColor=f.col;ctx.shadowBlur=10;ctx.strokeStyle=f.col;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(f.x,f.y);const mx=(f.x+f.x2)/2+rnd(-12,12),my=(f.y+f.y2)/2+rnd(-12,12);ctx.lineTo(mx,my);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.restore();}
    if(f.type==='hit'){                                   // 命中星爆闪光（方向性 4 角星 + 中心爆点）
      ctx.save();const a=1-k, rr=f.r*(0.55+k*0.85);
      ctx.globalAlpha=a;ctx.strokeStyle=f.col;ctx.shadowColor=f.col;ctx.shadowBlur=f.crit?16:9;ctx.lineWidth=f.crit?3:2;ctx.lineCap='round';
      for(let i=0;i<4;i++){const ang=(f.a||0)+i*Math.PI/2;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x+Math.cos(ang)*rr,f.y+Math.sin(ang)*rr);ctx.stroke();}
      ctx.globalAlpha=a*0.85;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(f.x,f.y,Math.max(0,rr*0.3*(1-k)),0,7);ctx.fill();
      ctx.restore();}
    if(f.type==='burst'){                                 // 飞溅碎片（chunky 像素粒子）
      if(!f._p){f._p=[];const sp=f.spread!=null?f.spread:1.2;for(let i=0;i<(f.n||4);i++){const aa=(f.a||0)+(Math.random()-.5)*sp;const v=f.spd*(0.45+Math.random()*0.7);f._p.push({vx:Math.cos(aa)*v,vy:Math.sin(aa)*v,s:2+Math.random()*2.5});}}
      ctx.save();ctx.globalAlpha=Math.max(0,1-k);ctx.fillStyle=f.col;          // 碎片不用 shadowBlur（大面积命中时最省）
      for(const p of f._p){const px=f.x+p.vx*f.t,py=f.y+p.vy*f.t+0.5*420*f.t*f.t*0.15;ctx.fillRect(px-p.s/2,py-p.s/2,p.s,p.s);}
      ctx.restore();}
  });
  /* 浮字（伤害数字：暴击更大、弹出感、上浮） */
  G.floats.forEach(f=>{
    const a=1-f.t/.9, pop=f.crit?(1+Math.max(0,(0.12-f.t)/0.12)*0.6):1, sz=Math.round(12*(f.sz||1)*pop);
    ctx.save();ctx.globalAlpha=Math.max(0,a);if(f.crit){ctx.shadowColor=f.col;ctx.shadowBlur=10;}   // 仅暴击数字带辉光（普通数字省 shadowBlur）
    ctx.fillStyle=f.col;ctx.font='bold '+sz+'px Menlo,monospace';ctx.textAlign='center';
    if(f.crit){ctx.strokeStyle='#7a2a00';ctx.lineWidth=3;ctx.strokeText(f.txt,f.x,f.y);}
    ctx.fillText(f.txt,f.x,f.y);ctx.restore();
  });
  ctx.textAlign='left';
  ctx.shadowBlur=0;
  ctx.restore();
  /* 赛博朋克氛围层：暗角 + 扫描线（屏幕空间，不随抖动偏移） */
  const cvg=ctx.createRadialGradient(AW/2,AH/2,AH*0.34,AW/2,AH/2,AH*0.78);
  cvg.addColorStop(0,'#0000');cvg.addColorStop(1,'#0a0816bb');ctx.fillStyle=cvg;ctx.fillRect(0,0,AW,AH);
  ctx.globalAlpha=.035;ctx.fillStyle='#000';for(let y=0;y<AH;y+=3)ctx.fillRect(0,y,AW,1);ctx.globalAlpha=1;
}

/* ===== 左下角专属技能面板（侧栏 DOM·现场人气热度下方）：名称+说明+CD条（满则发光·ULTRA）；元气并入此处 ===== */
function updateSkillPanel(){
  const panel=$('skillPanel');if(!panel)return;
  const code=P.mods.join(''), def=SKILLS[code], isY=P.mods[3]==='Y';
  let name,desc,badge,mode='locked';
  if(def){ name=def.name; desc=SKILL_DESC[code]||'';
    mode=def.type; badge=def.type==='active'?'主动':(def.type==='passive'?'被动':'专属武器'); }
  else { name='专属技能'; desc=P.mods.length<5?'完成5次改造·出道后解锁':''; badge=''; }
  const col=(def&&def.col)||'#7af0ea';
  let frac=1,label='',ready=false,dim=false;
  if(def&&def.weapon){                                   // 专属武器·空格领取
    const have=P.weapons.find(w=>w.id===def.weapon);
    if(have){frac=1;label='已装备 · 空格升级';dim=true;}else{frac=1;label='空格 · 装备专属武器';ready=true;}
    badge='专属武器';
  } else if(mode==='active'){
    if(P._skT>0){frac=Math.max(0,P._skT/(def.dur||1));label='演出中 '+P._skT.toFixed(1)+'s';}
    else if(P.skillCd>0){const full=def.cd*(A('automation')?.75:1);frac=Math.max(0,1-P.skillCd/full);label='CD '+Math.ceil(P.skillCd)+'s';dim=true;}
    else{frac=1;label='ULTRA · 空格';ready=true;}
  } else if(mode==='passive'){ frac=1;label='常驻被动';dim=true; }
  else if(mode==='weapon'){ frac=1;label=P._pendWeapon?'待装备(武器栏满)':'已装备·专属武器';dim=true; }
  else { frac=0;label='未解锁'; }
  if(def&&def.panelStat){desc=def.panelStat();}          // 动态属性展示（如·再来一组 连杀增伤）
  panel.style.setProperty('--ac',col);
  panel.classList.toggle('ready',ready);
  const nEl=$('skName');nEl.textContent=name;nEl.style.color=col;
  const bEl=$('skBadge');bEl.textContent=badge;bEl.className='skp-badge'+(mode==='active'?' act':'');
  $('skDesc').textContent=desc;
  const f=$('skFill');f.style.width=(frac*100)+'%';f.style.background=col;f.style.opacity=dim?.55:1;
  $('skLabel').textContent=label;
  $('skHeat').style.display=isY?'flex':'none';
  if(isY){const hf=$('skHeatFill');hf.style.width=Math.min(100,P.heat)+'%';hf.classList.toggle('full',P.heat>=100);}
}
/* 大招 cut-in 覆盖层：暗场聚焦 + 漫画集中线 + 漫画框立绘 + 大招名横幅 */
function drawUltCut(c){
  const W=AW,H=AH,cx=W/2,cy=H/2,T=performance.now(),k=c.t/c.dur,col=c.col;
  const a=Math.max(0,Math.min(k/0.14,(k>0.84)?(1-k)/0.16:1));        // 整体淡入淡出
  let sc; if(k<0.12)sc=0.72+0.46*(k/0.12); else if(k<0.24)sc=1.18-0.18*((k-0.12)/0.12); else sc=1;  // 弹入(过冲)
  ctx.save();
  // 暗化全场（聚焦）
  ctx.globalAlpha=0.74*a;ctx.fillStyle='#08040e';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  // 漫画集中线（放射 speed lines）——画在低分辨率离屏画布上，再 nearest 放大成粗像素块
  const PX=9;                                                          // 每个像素块 ≈9px
  const lw=Math.ceil(W/PX), lh=Math.ceil(H/PX);
  if(!_ultBurst)_ultBurst=document.createElement('canvas');
  if(_ultBurst.width!==lw||_ultBurst.height!==lh){_ultBurst.width=lw;_ultBurst.height=lh;}
  const g=_ultBurst.getContext('2d');g.clearRect(0,0,lw,lh);
  const lcx=lw/2,lcy=lh/2,lout=Math.max(lw,lh),rot=Math.floor(T/120)*0.06;   // 阶梯式旋转，更像素
  const tf=Math.floor(T/70);                                                 // 像素帧步（每~70ms跳一次，逐帧明灭）
  for(let i=0;i<40;i++){const ang=i*(Math.PI*2/40)+rot,inner=(180+(i%3)*34)/PX;
    const fl=Math.abs((Math.sin((tf+i*7.13)*12.9898)*43758.5453)%1);        // 每像素帧×每射线 伪随机闪烁
    g.fillStyle=i%2?col:'#ffffff';g.globalAlpha=(i%2?0.85:0.55)*(0.28+0.95*fl);
    g.beginPath();g.moveTo(lcx+Math.cos(ang-0.018)*inner,lcy+Math.sin(ang-0.018)*inner);
    g.lineTo(lcx+Math.cos(ang-0.06)*lout,lcy+Math.sin(ang-0.06)*lout);
    g.lineTo(lcx+Math.cos(ang+0.06)*lout,lcy+Math.sin(ang+0.06)*lout);
    g.lineTo(lcx+Math.cos(ang+0.018)*inner,lcy+Math.sin(ang+0.018)*inner);g.closePath();g.fill();}
  g.globalAlpha=1;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=0.5*a;ctx.drawImage(_ultBurst,0,0,lw*PX,lh*PX);ctx.restore();
  // 漫画框 + 立绘（轻微倾斜增加冲击）
  const img=c.img, ih=H*0.6, iw=(img&&img.width)?img.width*ih/img.height:ih*0.66;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-0.035);ctx.scale(sc,sc);ctx.globalAlpha=a;
  const fw=iw+22,fh=ih+22;
  ctx.shadowColor=col;ctx.shadowBlur=34;                                // 外发光
  ctx.fillStyle='#0d0a16';ctx.fillRect(-fw/2,-fh/2,fw,fh);ctx.shadowBlur=0;
  if(img&&img.width){ctx.imageSmoothingEnabled=true;ctx.drawImage(img,-iw/2,-ih/2,iw,ih);}
  else{ctx.fillStyle='#16121e';ctx.fillRect(-iw/2,-ih/2,iw,ih);ctx.fillStyle=col;ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('✦',0,8);}
  // 漫画双描边框 + 四角
  ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.strokeRect(-fw/2,-fh/2,fw,fh);
  ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.strokeRect(-fw/2+5,-fh/2+5,fw-10,fh-10);
  ctx.fillStyle=col;const cc=16;[[-fw/2,-fh/2,1,1],[fw/2,-fh/2,-1,1],[-fw/2,fh/2,1,-1],[fw/2,fh/2,-1,-1]].forEach(([x,y,sx,sy])=>{
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cc*sx,y);ctx.lineTo(x,y+cc*sy);ctx.closePath();ctx.fill();});
  ctx.restore();
  // 顶部 ULTRA! 标 + 底部大招名横幅
  ctx.globalAlpha=a;ctx.textAlign='center';
  ctx.font='italic 900 30px "PingFang SC",sans-serif';ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=16;
  ctx.fillText('★ ULTRA ★',cx,cy-ih/2-26);ctx.shadowBlur=0;
  const by=cy+ih/2+20,bw=Math.min(W-40,c.name.length*30+90),bh=42;
  ctx.fillStyle='#0d0a16';ctx.fillRect(cx-bw/2,by,bw,bh);
  ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.strokeRect(cx-bw/2,by,bw,bh);ctx.shadowBlur=0;
  ctx.fillStyle='#fff';ctx.font='bold 24px "PingFang SC",sans-serif';ctx.fillText(c.name,cx,by+29);
  ctx.textAlign='left';ctx.globalAlpha=1;ctx.restore();
}
function drawEnemy(e){
  const img=ENEMY_IMG[e.type]||ENEMY_IMG[e.tex];      // 新Boss无专属贴图→用映射的现有贴图
  ctx.save();
  ctx.translate(e.x,e.y+e.r-((P._moshT>0&&e._hop)||0)); // 脚底基线（mosh蹦迪离地）
  /* 果冻形变：随步态相位的挤压拉伸 + 横向晃动 + 轻微弹跳（绕脚底，越动越Q弹） */
  const jg=e.gait||0, js=Math.sin(jg), jc=Math.cos(jg);
  const jamp=e.boss?0.05:(e.elite||e.mini?0.07:0.12);   // 体型越大越稳，小怪最Q弹
  const pop=1+(e.hitPop||0)*0.20;                        // 命中放大弹（打击感）
  const jsx=(1+js*jamp)*pop, jsy=(1-js*jamp*0.85)*pop, jsh=jc*jamp*0.5;
  const hop=Math.max(0,-js)*(e.boss?2:3.5);             // 拉伸到顶时轻轻离地
  ctx.translate(0,-hop);
  ctx.transform(jsx,0,jsh,jsy,0,0);                      // 非均匀缩放 + 横向剪切（果冻感核心）
  if(P.x<e.x)ctx.scale(-1,1);                            // 朝向玩家
  if(e.dashT>0&&!e.boss)ctx.globalAlpha=.8;
  const drawSpr=()=>{
    if(img&&img.width){const dh=e.r*3.4, dw=img.width*dh/img.height;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,-dw/2,-dh,dw,dh);}
    else{const s=e.spr,sc=(e.boss?1.15:1.2)*2;ctx.drawImage(s,-s.width*sc/2,-s.height*sc,s.width*sc,s.height*sc);}
  };
  drawSpr();
  if(e.hitFlash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,e.hitFlash*4.5);drawSpr();}  // 命中泛白发光（同图叠 lighter）
  ctx.restore();
  if(e.burn>0||e.shock>0){                               // 灼烧/感电状态辉光（叠加发光，不糊住贴图）
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=.22+Math.abs(Math.sin(performance.now()/(e.shock>0?40:90)))*.22;
    ctx.fillStyle=e.shock>0?'#6ae8ff':'#ff8a3a';ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.25,0,7);ctx.fill();ctx.restore();
  }
  const headY=e.y-e.r*2.5;                               // 贴图/精灵顶部附近，挂标记与血条
  if(e.mark>0)heartPath(ctx,e.x,headY-8,2.5,'#ff7bc1');
  if(e.vuln>0){                                          // 易伤：头顶红色下劈箭标 + 红圈，一眼可见"被破防"
    const T2=performance.now();ctx.save();ctx.globalAlpha=.5+.3*Math.sin(T2/120);ctx.strokeStyle='#ff5a6e';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(e.x,e.y-e.r,e.r*1.35,0,7);ctx.stroke();
    ctx.fillStyle='#ff5a6e';ctx.beginPath();ctx.moveTo(e.x-4,headY-12);ctx.lineTo(e.x+4,headY-12);ctx.lineTo(e.x,headY-6);ctx.closePath();ctx.fill();ctx.restore();}
  if((e.stun>0||e.frozen>0)&&!e.dead){                   // 眩晕/冰冻：头顶旋转星星，一眼看出被定住
    const T2=performance.now();ctx.save();ctx.globalAlpha=.9;ctx.fillStyle=e.frozen>0?'#aee8ff':'#ffe14a';
    for(let i=0;i<3;i++){const a=T2/200+i*2.094;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*9,headY-9+Math.sin(a)*3,1.8,0,7);ctx.fill();}ctx.restore();}
  if(e.fuse>0){                                          // 自爆引信：画出爆炸范围 + 急闪预警
    const blink=0.35+0.5*Math.abs(Math.sin(performance.now()/45));
    ctx.save();ctx.strokeStyle='rgba(255,70,40,'+blink+')';ctx.fillStyle='rgba(255,70,40,'+(blink*0.16)+')';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(e.x,e.y,66,0,7);ctx.fill();ctx.stroke();ctx.restore();
  }
  if(e.bomber){ctx.fillStyle=(e.fuse>0?Math.sin(performance.now()/45):Math.sin(performance.now()/90))>0?'#ff4a4a':'#ffd24a';
    ctx.font='bold 9px sans-serif';ctx.fillText('!',e.x-2,headY-4);}
  if(e.elite||e.boss){
    const bw=e.boss?80:44, by=headY-(e.boss?10:6);
    ctx.fillStyle='#241c33';ctx.fillRect(e.x-bw/2,by,bw,5);
    ctx.fillStyle=e.boss?'#ffd24a':'#ff5a7a';
    ctx.fillRect(e.x-bw/2,by,bw*Math.max(0,e.hp/e.maxhp),5);
  }
  if(e.boss&&e.bubble>0){
    ctx.fillStyle='#fdf6ff';ctx.fillRect(e.x+18,e.y-92,58,22);
    ctx.fillStyle='#241126';ctx.font='bold 13px sans-serif';ctx.fillText('还钱！！',e.x+24,e.y-76);
  }
}
const WEAPON_ICON={}, WICONLOAD={};                       // 环绕武器用的图标缓存（art/icons/weapons/<id>.png）
function wIcon(id){
  if(id in WEAPON_ICON)return WEAPON_ICON[id];
  if(!WICONLOAD[id]){WICONLOAD[id]=1;const im=new Image();im.onload=()=>{if(im.width)WEAPON_ICON[id]=im;};im.onerror=()=>WEAPON_ICON[id]=null;im.src='art/icons/weapons/'+id+'.png';}
  return undefined;
}
function drawOrbitWeapons(){                               // 佩戴武器环绕角色（椭圆轨道，缓慢旋转）
  const ws=P.weapons.filter(w=>w.id!=='mirror');          // 反光板自带环绕，跳过
  const n=ws.length; if(!n)return;
  const cy=P.y-22, rrx=34, rry=21, t=performance.now()/1000, sz=18;
  for(let i=0;i<n;i++){
    const a=t*0.7 + i*Math.PI*2/n;
    const ox=P.x+Math.cos(a)*rrx, oy=cy+Math.sin(a)*rry;
    const col=(WEAPONS[ws[i].id]&&WEAPONS[ws[i].id].col)||'#fff', im=wIcon(ws[i].id);
    ctx.save();ctx.shadowColor=col;ctx.shadowBlur=6;
    if(im&&im.width){const h=sz,w=im.width*h/im.height;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,Math.round(ox-w/2),Math.round(oy-h/2),Math.round(w),h);}
    else{ctx.fillStyle=col;ctx.beginPath();ctx.arc(ox,oy,4.5,0,7);ctx.fill();}   // 图标未加载→小圆点回退
    ctx.restore();
  }
}
function drawPlayer(){
  const b=(P._skT>0&&P.activeSkill&&P.activeSkill.buff)||0;
  const fly=b&&b.fly?28+Math.sin(performance.now()/220)*6:0;        // 战姬展翼/天使：真飞起来（影子拉开）
  const alpha=b&&b.stealth?0.3:1;                                    // 歌剧魅影：潜行半透明
  const grow=Math.min(1.7,1+(P._eatScale||0));                      // 大胃王：吃越多越大
  /* 主动技发光光环（buff.glow）：强烈脉动光晕 + 旋转能量环，配合 skTick 的爆豆粒子 */
  const glowCol=(b&&b.glow)||(P._cheer>0?'#7af0ea':0);
  if(glowCol){ctx.save();ctx.globalCompositeOperation='lighter';const tt=performance.now(),pr=58+Math.sin(tt/110)*12;
    const gr=ctx.createRadialGradient(P.x,P.y-22,4,P.x,P.y-22,pr);gr.addColorStop(0,glowCol+'aa');gr.addColorStop(.5,glowCol+'44');gr.addColorStop(1,glowCol+'00');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(P.x,P.y-22,pr,0,7);ctx.fill();
    ctx.globalAlpha=.7;ctx.strokeStyle=glowCol;ctx.lineWidth=2;ctx.shadowColor=glowCol;ctx.shadowBlur=12;
    for(let i=0;i<6;i++){const a=tt/300+i*1.047,rr=34+Math.sin(tt/180+i)*5;ctx.beginPath();ctx.arc(P.x+Math.cos(a)*rr,P.y-22+Math.sin(a)*rr,3,0,7);ctx.stroke();}
    ctx.restore();}
  if(fly){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5;   // 飞行光翼
    ctx.fillStyle=b.col||'#bfe0ff';for(let i=0;i<2;i++){const sgn=i?1:-1;ctx.beginPath();
      ctx.ellipse(P.x+sgn*16,P.y-30-fly,9,20,sgn*0.5,0,7);ctx.fill();}ctx.restore();}
  if(grow!==1){ctx.save();ctx.translate(P.x,P.y);ctx.scale(grow,grow);
    drawChibi(ctx,0,0,P.mods,{face:P.face,moving:P.moving,run:P.bob,t:performance.now()/1000,hit:P.hitFlash||0,lift:fly,alpha});ctx.restore();}
  else drawChibi(ctx,P.x,P.y,P.mods,{face:P.face,moving:P.moving,run:P.bob,t:performance.now()/1000,hit:P.hitFlash||0,lift:fly,alpha});
  drawOrbitWeapons();
  /* 元气条已移至左下角技能面板（取消角色头顶条） */
}

/* ---------- HUD/侧栏 ---------- */
let viewersShow=86,hudT=0;
function updateHud(dt){
  hudT-=dt;if(hudT>0)return;hudT=.12;
  const st=ST();
  $('waveLab').textContent='WAVE '+G.wave;
  $('timeLab').textContent=(G.wave===20)?(G.bossRef?'BOSS':'--'):Math.max(0,Math.ceil(G.waveDur-G.waveT));
  const hb=$('hpBar');hb.querySelector('i').style.width=(P.hp/st.maxhp*100)+'%';
  hb.querySelector('span').textContent='心态 '+Math.ceil(P.hp)+'/'+st.maxhp;
  const xb=$('xpBar');xb.querySelector('i').style.width=(G.xp/G.xpNext*100)+'%';
  xb.querySelector('span').textContent='人气 Lv'+G.level;
  $('gold').textContent='♥ '+G.gold;
  updateSkillPanel();                                    // 左下角专属技能面板（现场人气热度下方）
  const target=86+Math.floor((G.kills*23)+(G.level*120)+(G.wave*180));
  viewersShow+=(target-viewersShow)*.2;
  $('viewers').textContent='👀 '+Math.floor(viewersShow).toLocaleString();
  const pct=Math.min(100,G.totalGold/5000*100);
  $('debtPct').textContent=Math.floor(pct)+'%（'+G.totalGold+'/5000）';
  $('debtBar').querySelector('i').style.width=pct+'%';
  /* 点赞/点踩只在「评论触发」时增长（见 addLike/addDislike），这里只刷新显示——暂停时不再涨 */
  $('likeN').textContent=fmtCount(G.likes);
  $('disN').textContent=fmtCount(G.dislikes);
  const tot=G.likes+G.dislikes, rate=tot>0?G.likes/tot*100:50;
  $('voteFill').style.width=rate+'%';
  const vr=$('voteRate');if(vr)vr.textContent='好评 '+Math.round(rate)+'%';
  const eqEl=$('eq');if(eqEl)eqEl.style.setProperty('--lvl',(Math.min(P.mods.length,5)/5).toFixed(2));  // 频谱高度随改造阶段逐步增高
  if(!_voteBound)bindVotes();
}
function fmtCount(n){n=Math.floor(n);
  if(n>=100000000)return (n/100000000).toFixed(1)+'亿';
  if(n>=10000)return (n/10000).toFixed(1)+'万';
  return n.toLocaleString();
}
let _voteBound=false;
function bindVotes(){
  _voteBound=true;
  const lb=$('likeBtn'),db=$('disBtn');if(!lb||!db)return;
  const pop=(b,n)=>{b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');for(let i=0;i<n;i++)setTimeout(()=>floatVote(b),i*40);};
  lb.onclick=()=>{G.likes+=ri(8,20)*STAGE_COEF[Math.min(P.mods.length,5)];pop(lb,3);};   // 玩家自己点：按阶段给一波
  db.onclick=()=>{G.dislikes+=ri(3,8)*STAGE_COEF[Math.min(P.mods.length,5)];pop(db,2);};
  /* 现场人气热度·赛博频谱：16 根条，随机时长/相位，营造直播律动感 */
  const eq=$('eq');
  if(eq&&!eq.childElementCount){let h='';for(let i=0;i<16;i++){const d=(0.6+Math.random()*0.9).toFixed(2),delay=(-Math.random()*1.2).toFixed(2);h+='<i style="animation-duration:'+d+'s;animation-delay:'+delay+'s"></i>';}eq.innerHTML=h;}
}
function floatVote(b){                                 // 点击时从按钮冒出的小图标
  const r=b.getBoundingClientRect(),e=document.createElement('div');
  e.textContent=b.id==='likeBtn'?'👍':'👎';
  e.style.cssText='position:fixed;left:'+(r.left+r.width/2+ri(-14,14))+'px;top:'+(r.top-4)+'px;font-size:15px;pointer-events:none;z-index:9999;transition:all .7s ease-out;opacity:1';
  document.body.appendChild(e);
  requestAnimationFrame(()=>{e.style.top=(r.top-46)+'px';e.style.opacity='0';});
  setTimeout(()=>e.remove(),720);
}

/* ---------- 顶部模拟直播画面（显示当前形态立绘 + 直播特效） ---------- */
let streamStart=performance.now()/1000, streamTxtT=0, _slt=0;
/* ===== 礼物动画：每种礼物一套专属动画 ===== */
let streamGift=null;
function giftType(n){
  if(/火箭/.test(n))return 'rocket';
  if(/游艇/.test(n))return 'yacht';
  if(/跑车/.test(n))return 'car';
  if(/城堡/.test(n))return 'castle';
  if(/jet|飞机/i.test(n))return 'jet';
  if(/守护|榜一/.test(n))return 'crown';
  if(/发电|爱/.test(n))return 'hearts';
  return 'fireworks';
}
function triggerStreamGift(name){streamGift={name,type:giftType(name),t:0,ttl:3.0,parts:[]};}
function heartShape(g,x,y,s){g.beginPath();g.moveTo(x,y+s*.3);g.bezierCurveTo(x,y-s*.3,x-s,y-s*.3,x-s,y+s*.2);g.bezierCurveTo(x-s,y+s*.7,x,y+s,x,y+s*1.3);g.bezierCurveTo(x,y+s,x+s,y+s*.7,x+s,y+s*.2);g.bezierCurveTo(x+s,y-s*.3,x,y-s*.3,x,y+s*.3);g.fill();}
const GIFTDRAW={
  rocket(g,w,h,t,S){
    const y=h+30-(h+72)*(t/S.ttl),x=w/2+Math.sin(t*3)*7;
    for(let i=0;i<9;i++){const sy=y+18+i*11;if(sy<h+12){g.fillStyle='rgba(205,205,215,'+(.42-i*.045)+')';g.beginPath();g.arc(x+Math.sin(i*1.3)*3,sy,4+i,0,7);g.fill();}}
    g.fillStyle='#ffd24a';g.beginPath();g.moveTo(x-4,y+14);g.lineTo(x+4,y+14);g.lineTo(x,y+24+Math.random()*6);g.closePath();g.fill();
    g.fillStyle='#ff7a2a';g.beginPath();g.moveTo(x-2,y+14);g.lineTo(x+2,y+14);g.lineTo(x,y+19+Math.random()*4);g.closePath();g.fill();
    g.fillStyle='#eef0f6';g.fillRect(x-5,y-6,10,20);g.fillStyle='#cdd2dc';g.fillRect(x+2,y-6,3,20);
    g.fillStyle='#ff5a5a';g.beginPath();g.moveTo(x-5,y-6);g.lineTo(x+5,y-6);g.lineTo(x,y-17);g.closePath();g.fill();
    g.fillStyle='#4ad8ff';g.beginPath();g.arc(x,y+1,2.6,0,7);g.fill();g.fillStyle='#0a3a4a';g.beginPath();g.arc(x,y+1,1.2,0,7);g.fill();
    g.fillStyle='#ff5a5a';g.beginPath();g.moveTo(x-5,y+8);g.lineTo(x-9,y+16);g.lineTo(x-5,y+14);g.closePath();g.fill();g.beginPath();g.moveTo(x+5,y+8);g.lineTo(x+9,y+16);g.lineTo(x+5,y+14);g.closePath();g.fill();
    if(t>S.ttl*.72){const bt=(t-S.ttl*.72)/(S.ttl*.28);for(let i=0;i<12;i++){const a=i/12*7,r=bt*34;g.fillStyle=['#ffd24a','#ff7bc1','#4ad8ff'][i%3];g.globalAlpha=1-bt;g.fillRect(x+Math.cos(a)*r,24+Math.sin(a)*r,2,2);}g.globalAlpha=1;}
  },
  yacht(g,w,h,t,S){
    const x=-52+(w+104)*(t/S.ttl),wy=Math.round(h*.74);
    g.fillStyle='rgba(70,140,200,.22)';g.fillRect(0,wy+7,w,h-wy-7);
    g.fillStyle='rgba(255,255,255,.45)';for(let i=0;i<7;i++)g.fillRect(x-22-i*8,wy+7+Math.sin(t*6+i)*1.5,5,2);
    g.fillStyle='#f2f2f7';g.beginPath();g.moveTo(x-24,wy);g.lineTo(x+24,wy);g.lineTo(x+17,wy+9);g.lineTo(x-17,wy+9);g.closePath();g.fill();
    g.fillStyle='#3a6a9a';g.fillRect(x-17,wy+5,34,3);
    g.fillStyle='#ffffff';g.fillRect(x-13,wy-8,26,8);g.fillStyle='#e6edf4';g.fillRect(x-8,wy-15,16,7);
    g.fillStyle='#4ad8ff';for(let i=0;i<4;i++)g.fillRect(x-10+i*6,wy-6,3,3);
    g.fillStyle='#9fe0ff';g.fillRect(x-7,wy-13,12,3);
    g.strokeStyle='#aaa';g.lineWidth=1;g.beginPath();g.moveTo(x,wy-15);g.lineTo(x,wy-26);g.stroke();g.fillStyle='#ff5a5a';g.beginPath();g.moveTo(x,wy-26);g.lineTo(x+9,wy-23);g.lineTo(x,wy-20);g.closePath();g.fill();
  },
  car(g,w,h,t,S){
    const x=-44+(w+88)*Math.min(1,t/(S.ttl*.82)),cy=Math.round(h*.80);
    g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=1;for(let i=0;i<5;i++){g.beginPath();g.moveTo(x-30-i*12,cy-4-i*2);g.lineTo(x-52-i*12,cy-4-i*2);g.stroke();}
    g.fillStyle='rgba(200,190,170,.4)';for(let i=0;i<4;i++){g.beginPath();g.arc(x-24-i*6,cy+3,3+i,0,7);g.fill();}
    g.fillStyle='#e23a3a';g.beginPath();g.moveTo(x-24,cy);g.lineTo(x-15,cy-9);g.lineTo(x+7,cy-10);g.lineTo(x+16,cy-3);g.lineTo(x+24,cy);g.closePath();g.fill();
    g.fillStyle='#a82a2a';g.fillRect(x-24,cy,48,3);
    g.fillStyle='#9fdfff';g.beginPath();g.moveTo(x-10,cy-8);g.lineTo(x+5,cy-8);g.lineTo(x+9,cy-3);g.lineTo(x-13,cy-3);g.closePath();g.fill();
    g.fillStyle='#ffe9a0';g.fillRect(x+20,cy-4,4,2);
    g.fillStyle='#16161a';g.beginPath();g.arc(x-13,cy+1,5,0,7);g.fill();g.beginPath();g.arc(x+13,cy+1,5,0,7);g.fill();
    g.fillStyle='#888';g.beginPath();g.arc(x-13,cy+1,2,0,7);g.fill();g.beginPath();g.arc(x+13,cy+1,2,0,7);g.fill();
  },
  jet(g,w,h,t,S){
    const x=-44+(w+88)*(t/S.ttl),jy=Math.round(h*.28);
    g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=3;g.beginPath();g.moveTo(x-16,jy+2);g.lineTo(-20,jy+2);g.stroke();
    g.fillStyle='#eef2f8';g.beginPath();g.moveTo(x+19,jy);g.lineTo(x-14,jy-3);g.lineTo(x-16,jy);g.lineTo(x-14,jy+3);g.closePath();g.fill();
    g.fillStyle='#cfd8e4';g.beginPath();g.moveTo(x,jy);g.lineTo(x-8,jy+9);g.lineTo(x+3,jy+1);g.closePath();g.fill();g.beginPath();g.moveTo(x,jy);g.lineTo(x-8,jy-9);g.lineTo(x+3,jy-1);g.closePath();g.fill();
    g.beginPath();g.moveTo(x-13,jy);g.lineTo(x-18,jy-7);g.lineTo(x-11,jy);g.closePath();g.fill();
    g.fillStyle='#4ad8ff';g.fillRect(x+7,jy-1,5,2);
  },
  castle(g,w,h,t,S){
    const rise=Math.min(1,t/(S.ttl*.4)),baseY=h-6,cy=baseY-rise*72,x=w/2;
    g.fillStyle='#d8c8e8';g.fillRect(x-30,cy,60,72);g.fillStyle='#c4b0dc';g.fillRect(x-30,cy,60,6);
    [[-34,16],[-11,-8],[11,-8],[26,16]].forEach(tw=>{const tx=x+tw[0],th=72+tw[1];g.fillStyle='#e2d4f2';g.fillRect(tx,cy-(th-72),14,th);
      g.fillStyle='#ff7bc1';g.beginPath();g.moveTo(tx-2,cy-(th-72));g.lineTo(tx+16,cy-(th-72));g.lineTo(tx+7,cy-(th-72)-12);g.closePath();g.fill();
      g.fillStyle='#ffd24a';g.fillRect(tx+6,cy-(th-72)-18,1,6);g.fillRect(tx+7,cy-(th-72)-18,5,3);});
    g.fillStyle='#7a5a9a';g.fillRect(x-9,cy+58,18,14);g.beginPath();g.arc(x,cy+58,9,Math.PI,0);g.fill();
    g.fillStyle='#ffe9a0';g.fillRect(x-19,cy+22,5,8);g.fillRect(x+14,cy+22,5,8);
    if(rise>=1)for(let i=0;i<14;i++){const a=i/14*7,r=22+Math.sin(t*4+i)*9;g.fillStyle=['#ffd24a','#ff7bc1','#7af0ff'][i%3];g.globalAlpha=.55+.45*Math.abs(Math.sin(t*5+i));g.fillRect(x+Math.cos(a)*r,cy-12+Math.sin(a)*r*.6,2,2);}
    g.globalAlpha=1;
  },
  fireworks(g,w,h,t,S){
    if(!S.parts.length)for(let b=0;b<6;b++)S.parts.push({x:rnd(36,w-36),y:rnd(28,h*.6),delay:b*.36,col:pick(['#ff7bc1','#ffd24a','#4ad8ff','#7af07a','#9b6bff','#ff5a5a'])});
    S.parts.forEach(p=>{const lt=t-p.delay;if(lt<0||lt>1.3)return;const r=lt*36;
      for(let i=0;i<18;i++){const a=i/18*7;g.fillStyle=p.col;g.globalAlpha=Math.max(0,1-lt/1.3);g.fillRect(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,2,2);}
      g.globalAlpha=Math.max(0,1-lt*1.4);g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,2,0,7);g.fill();g.globalAlpha=1;});
  },
  hearts(g,w,h,t,S){
    if(!S.parts.length)for(let i=0;i<24;i++)S.parts.push({x:w/2+rnd(-54,54),y:h+rnd(0,34),vy:-rnd(28,62),sw:rnd(-13,13),ph:rnd(0,6),s:rnd(3,5.5)});
    S.parts.forEach(p=>{const y=p.y+p.vy*t,x=p.x+Math.sin(t*2+p.ph)*p.sw;if(y<-12)return;g.globalAlpha=Math.max(0,1-t/S.ttl);g.fillStyle=p.s>4.5?'#ff5fb0':'#ff9ec8';heartShape(g,x,y,p.s);g.globalAlpha=1;});
  },
  crown(g,w,h,t,S){
    const y=-20+(h*.42+20)*Math.min(1,t/(S.ttl*.5)),x=w/2;
    g.save();g.translate(x,y);for(let i=0;i<12;i++){g.rotate(7/12);g.fillStyle='rgba(255,220,120,'+(.10+.10*Math.abs(Math.sin(t*3+i)))+')';g.fillRect(0,0,2,64);}g.restore();
    g.fillStyle='#ffd24a';g.beginPath();g.moveTo(x-16,y+10);g.lineTo(x-16,y-2);g.lineTo(x-9,y+4);g.lineTo(x,y-8);g.lineTo(x+9,y+4);g.lineTo(x+16,y-2);g.lineTo(x+16,y+10);g.closePath();g.fill();
    g.fillStyle='#fff3c0';g.fillRect(x-16,y+8,32,3);
    g.fillStyle='#ff5a8a';g.beginPath();g.arc(x,y+2,2,0,7);g.fill();g.fillStyle='#4ad8ff';g.beginPath();g.arc(x-9,y+5,1.5,0,7);g.fill();g.beginPath();g.arc(x+9,y+5,1.5,0,7);g.fill();
    if(t>S.ttl*.5)for(let i=0;i<8;i++){const a=i/8*7,r=22+Math.sin(t*4+i)*7;g.fillStyle='#fff';g.globalAlpha=.5+.5*Math.abs(Math.sin(t*5+i));g.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,2,2);}
    g.globalAlpha=1;
  },
};
function drawGiftAnim(g,w,h,dt){
  const S=streamGift;S.t+=dt;const t=S.t;
  if(t>=S.ttl){streamGift=null;return;}
  if(t<0.22){g.globalAlpha=(1-t/0.22)*0.4;g.fillStyle='#fff';g.fillRect(0,0,w,h);g.globalAlpha=1;}
  (GIFTDRAW[S.type]||GIFTDRAW.fireworks)(g,w,h,t,S);
  g.fillStyle='#241126dd';g.fillRect(w/2-76,5,152,18);
  g.fillStyle='#ffd24a';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText('🎁 '+S.name+' 来了！',w/2,18);g.textAlign='left';
}
/* ===== 直播间卧室背景：六个阶段是完全不同的房间（非简单叠加装饰） ===== */
function rW(g,w,fy,a,b){const wg=g.createLinearGradient(0,0,0,fy);wg.addColorStop(0,a);wg.addColorStop(1,b);g.fillStyle=wg;g.fillRect(0,0,w,fy);}
function rF(g,w,h,fy,c){g.fillStyle=c;g.fillRect(0,fy,w,h-fy);g.fillStyle='rgba(0,0,0,.30)';g.fillRect(0,fy,w,2);}
function neonWindow(g,x,y,ww,wh,frame,curtain,t,dim){
  g.fillStyle='#0a0e1a';g.fillRect(x,y,ww,wh);
  for(let i=0;i<20;i++){const lx=x+3+((i*13)%(ww-6)),ly=y+4+((i*7)%(wh-8));
    g.fillStyle=['#ff7bc1','#4ad8ff','#ffd24a','#9b6bff'][i%4];g.globalAlpha=(dim?.28:.5)+.4*Math.abs(Math.sin(t*.7+i));g.fillRect(lx,ly,2,2);}
  g.globalAlpha=1;g.strokeStyle=frame;g.lineWidth=2;g.strokeRect(x,y,ww,wh);
  g.beginPath();g.moveTo(x+ww/2,y);g.lineTo(x+ww/2,y+wh);g.moveTo(x,y+wh/2);g.lineTo(x+ww,y+wh/2);g.stroke();
  if(curtain){g.fillStyle=curtain;g.fillRect(x-4,y-3,6,wh+5);g.fillRect(x+ww-2,y-3,6,wh+5);}
}
function fairy(g,w,t,cols){g.strokeStyle='#0005';g.lineWidth=1;g.beginPath();for(let i=0;i<16;i++){const lx=6+i*((w-12)/15),ly=8+Math.sin(i*1.2)*4;i?g.lineTo(lx,ly):g.moveTo(lx,ly);}g.stroke();
  for(let i=0;i<16;i++){const lx=6+i*((w-12)/15),ly=8+Math.sin(i*1.2)*4;g.fillStyle=cols[i%cols.length];g.globalAlpha=.55+.45*Math.abs(Math.sin(t*2+i));g.beginPath();g.arc(lx,ly,2,0,7);g.fill();}g.globalAlpha=1;}
function plush(g,x,y,c,ear){g.fillStyle=c;g.beginPath();g.arc(x,y,6,0,7);g.fill();if(ear){g.fillRect(x-5,y-9,2,5);g.fillRect(x+3,y-9,2,5);}g.fillStyle='#3a2a2a';g.fillRect(x-3,y-1,1,1);g.fillRect(x+2,y-1,1,1);g.fillStyle='#ff8fb0';g.fillRect(x-1,y+1,2,1);}
const ROOMS=[
function(g,w,h,fy,t){ /* 0 邋遢肥宅窝 */
  rW(g,w,fy,'#46402f','#322c20');
  g.fillStyle='rgba(0,0,0,.16)';[[40,30,16],[120,66,20],[235,46,14],[170,104,18]].forEach(s=>{g.beginPath();g.ellipse(s[0],s[1],s[2],s[2]*.7,0,0,7);g.fill();});
  rF(g,w,h,fy,'#2a2418');
  neonWindow(g,w-64,12,52,40,'#4a4030',null,t,1);g.strokeStyle='#5a5040';g.lineWidth=1;g.beginPath();g.moveTo(w-48,14);g.lineTo(w-28,38);g.stroke();
  g.strokeStyle='#3a3424';g.lineWidth=1;g.beginPath();g.moveTo(150,0);g.lineTo(150,14);g.stroke();g.fillStyle='#ffe9a0';g.beginPath();g.arc(150,18,4,0,7);g.fill();g.globalAlpha=.10;g.beginPath();g.arc(150,18,22,0,7);g.fill();g.globalAlpha=1;
  // 破洞跨栏背心（挂钉子上）
  (function(){const vx=18,vy=28;g.fillStyle='#b9b2a4';g.beginPath();g.moveTo(vx,vy);g.lineTo(vx+22,vy);g.lineTo(vx+20,vy+30);g.lineTo(vx+2,vy+30);g.closePath();g.fill();
    g.fillStyle='#46402f';[[vx+5,vy+9,3],[vx+14,vy+17,4],[vx+8,vy+25,2]].forEach(o=>{g.beginPath();g.arc(o[0],o[1],o[2],0,7);g.fill();});
    g.fillStyle='#b9b2a4';g.fillRect(vx-2,vy,5,3);g.fillRect(vx+19,vy,5,3);g.fillStyle='#888';g.fillRect(vx+10,vy-3,2,3);})();
  // 破洞裤衩
  (function(){const bx=46,by=32;g.fillStyle='#6a6a86';g.fillRect(bx,by,22,15);g.fillStyle='#8a8aa6';g.fillRect(bx,by,22,4);g.fillStyle='#46402f';g.beginPath();g.arc(bx+7,by+10,2,0,7);g.fill();g.beginPath();g.arc(bx+15,by+8,2,0,7);g.fill();g.fillStyle='#322c20';g.fillRect(bx+10,by+5,2,10);})();
  // 喝一半的啤酒 + 倒地空罐 + 水渍
  g.fillStyle='rgba(180,150,60,.22)';g.beginPath();g.ellipse(96,fy+22,28,8,0,0,7);g.fill();
  g.fillStyle='#caa83a';g.save();g.translate(82,fy+19);g.rotate(.6);g.fillRect(-7,-4,14,8);g.fillStyle='#eee';g.fillRect(-7,-4,3,8);g.restore();
  g.fillStyle='#caa83a';g.fillRect(116,fy+8,8,18);g.fillStyle='#7a5a1a';g.fillRect(116,fy+15,8,3);g.fillStyle='#eee';g.fillRect(116,fy+8,8,4);g.fillStyle='#ddd';g.fillRect(116,fy+5,8,4); // 喝一半
  g.fillStyle='#b5483a';g.fillRect(132,fy+17,6,9);g.fillStyle='#999';g.fillRect(132,fy+17,6,2);
  // 披萨盒 + 泡面桶 + 垃圾袋
  g.fillStyle='#c8a060';g.fillRect(225,fy+12,42,13);g.fillStyle='#a07840';g.fillRect(225,fy+12,42,3);g.fillStyle='#d8b878';g.fillRect(228,fy+3,36,9);g.fillStyle='#b5483a';g.beginPath();g.arc(238,fy+8,2,0,7);g.fill();g.beginPath();g.arc(252,fy+7,2,0,7);g.fill();
  g.fillStyle='#d8d0c0';g.fillRect(270,fy+8,14,16);g.fillStyle='#b03a2a';g.fillRect(270,fy+12,14,4);g.fillStyle='#d8d0c0';g.fillRect(272,fy,12,9);
  g.fillStyle='#2a2a30';g.beginPath();g.ellipse(18,fy+16,15,13,0,0,7);g.fill();g.fillStyle='#1a1a20';g.fillRect(14,fy+1,8,5);
  // 苍蝇 + 昏黄
  g.fillStyle='#000';for(let i=0;i<3;i++)g.fillRect((104+i*32+Math.sin(t*6+i)*8)|0,(fy-22+Math.cos(t*5+i)*6)|0,1,1);
  g.fillStyle='rgba(120,90,30,.10)';g.fillRect(0,0,w,h);
},
function(g,w,h,fy,t){ /* 1 减肥健身初心 */
  rW(g,w,fy,'#3e3a30','#2c281f');rF(g,w,h,fy,'#2e2a20');
  neonWindow(g,w-70,12,56,42,'#5a5040',null,t,1);
  // 励志海报（六块腹肌 + 减肥!）
  g.fillStyle='#dfe6ec';g.fillRect(16,22,30,44);g.fillStyle='#e8c8a8';g.fillRect(22,28,18,26);g.fillStyle='#c8a888';for(let r=0;r<3;r++)for(let cc=0;cc<2;cc++)g.fillRect(24+cc*9,32+r*7,6,5);g.fillStyle='#d83a5a';g.fillRect(18,60,26,4);
  // 日历打勾
  g.fillStyle='#f0ece0';g.fillRect(w-56,66,40,30);g.fillStyle='#d83a5a';g.fillRect(w-56,66,40,6);g.strokeStyle='#c44';g.lineWidth=1;for(let i=0;i<5;i++){const cx=w-52+i*8;g.beginPath();g.moveTo(cx,77);g.lineTo(cx+5,83);g.moveTo(cx+5,77);g.lineTo(cx,83);g.stroke();}
  // 毛巾 + 干净球衣
  g.fillStyle='#7ac0d0';g.fillRect(60,26,12,28);g.fillStyle='#9ad0e0';g.fillRect(60,26,12,4);
  g.fillStyle='#e8e8ee';g.fillRect(82,28,22,20);g.strokeStyle='#999';g.lineWidth=1;g.beginPath();g.moveTo(93,24);g.lineTo(93,28);g.stroke();
  // 瑜伽垫
  g.fillStyle='#6a8ad0';g.fillRect(60,fy+14,108,8);g.fillStyle='#88a8e8';g.fillRect(60,fy+14,108,2);
  // 哑铃
  g.fillStyle='#3a3a44';g.fillRect(40,fy+15,4,12);g.fillRect(54,fy+15,4,12);g.fillRect(44,fy+19,10,4);g.fillStyle='#555';[[36,fy+13],[36,fy+25],[52,fy+13],[52,fy+25]].forEach(p=>g.fillRect(p[0],p[1],8,4));
  // 体重秤
  g.fillStyle='#d8d8e0';g.fillRect(244,fy+16,28,11);g.fillStyle='#88c8d8';g.fillRect(257,fy+10,8,6);g.fillStyle='#4ad8ff';g.fillRect(259,fy+12,4,2);
  // 蛋白粉 + 水
  g.fillStyle='#5a3a8a';g.fillRect(225,fy+8,8,18);g.fillStyle='#7a5aaa';g.fillRect(225,fy+6,8,3);
  g.fillStyle='rgba(180,220,255,.6)';g.fillRect(238,fy+12,5,14);g.fillStyle='#88c8e8';g.fillRect(238,fy+10,5,3);
},
function(g,w,h,fy,t){ /* 2 直播设备入坑 */
  rW(g,w,fy,'#3a3438','#2a242c');rF(g,w,h,fy,'#262029');
  g.fillStyle='#3a3a42';for(let yy=22;yy<fy-8;yy+=12)for(let xx=8;xx<66;xx+=12){g.fillRect(xx,yy,10,10);g.fillStyle='#2e2e36';g.fillRect(xx+5,yy+5,5,5);g.fillStyle='#3a3a42';} // 隔音棉
  g.fillStyle='#c86a9a';g.fillRect(w-52,18,34,46);g.fillStyle='#fff';g.fillRect(w-47,23,24,28);g.fillStyle='#ff9ec8';g.fillRect(w-43,27,16,20); // 偶像海报
  // 补光环灯
  (function(){const cx=234,cy=fy-30;g.strokeStyle='#fff';g.lineWidth=4;g.globalAlpha=.9;g.beginPath();g.arc(cx,cy,14,0,7);g.stroke();g.globalAlpha=.18;g.fillStyle='#fff';g.beginPath();g.arc(cx,cy,22,0,7);g.fill();g.globalAlpha=1;g.strokeStyle='#555';g.lineWidth=2;g.beginPath();g.moveTo(cx,cy+14);g.lineTo(cx,fy);g.stroke();})();
  // 麦克风 + 防喷罩
  (function(){const mx=80,my=fy-44;g.strokeStyle='#222';g.lineWidth=3;g.beginPath();g.moveTo(20,fy-66);g.lineTo(mx,my);g.stroke();g.fillStyle='#2a2a32';g.fillRect(mx-4,my-10,8,16);g.fillStyle='#555';g.fillRect(mx-3,my-8,6,10);g.strokeStyle='#888';g.lineWidth=1;g.beginPath();g.arc(mx-9,my-2,6,0,7);g.stroke();})();
  // 耳机
  g.strokeStyle='#222';g.lineWidth=3;g.beginPath();g.arc(w-92,26,8,Math.PI,0);g.stroke();g.fillStyle='#222';g.fillRect(w-101,26,5,8);g.fillRect(w-89,26,5,8);g.fillStyle='#9b6bff';g.fillRect(w-100,28,3,4);
  // 声卡 LED
  g.fillStyle='#1a1a20';g.fillRect(40,fy+8,46,14);['#4ad8ff','#ff7bc1','#7af07a','#ffd24a'].forEach((cc,i)=>{g.fillStyle=(Math.floor(t*3)%4===i)?'#fff':cc;g.fillRect(46+i*9,fy+12,3,3);});
  // 新人主播横幅
  g.fillStyle='#9b6bff';g.fillRect(92,6,116,14);g.fillStyle='#fff';g.font='bold 9px sans-serif';g.textAlign='center';g.fillText('新 人 主 播 出 道 中',150,16);g.textAlign='left';
  // 线缆
  g.strokeStyle='#222';g.lineWidth=2;g.beginPath();g.moveTo(90,fy+20);g.bezierCurveTo(120,fy+28,180,fy+12,232,fy+24);g.stroke();
},
function(g,w,h,fy,t){ /* 3 转型：化妆台+衣架 */
  rW(g,w,fy,'#46394e','#2e2638');rF(g,w,h,fy,'#2c2636');
  fairy(g,w,t,['#ff9ed0','#ffe08a','#c8a8ff']);
  neonWindow(g,w-62,18,50,40,'#a07ab0','rgba(200,150,200,.5)',t);
  // 好莱坞化妆镜
  (function(){const mx=16,my=26,mw=42,mh=50;g.fillStyle='#c8a8d8';g.fillRect(mx-3,my-3,mw+6,mh+6);g.fillStyle='#dfe8f0';g.fillRect(mx,my,mw,mh);
    g.fillStyle='#fff';for(let i=0;i<5;i++){g.globalAlpha=.7+.3*Math.abs(Math.sin(t*3+i));g.beginPath();g.arc(mx-3+i*((mw+6)/4),my-3,2,0,7);g.fill();g.beginPath();g.arc(mx-3+i*((mw+6)/4),my+mh+3,2,0,7);g.fill();}g.globalAlpha=1;
    g.fillStyle='rgba(255,255,255,.15)';g.fillRect(mx+4,my+4,12,mh-10);})();
  // 化妆品
  g.fillStyle='#ff7bc1';g.fillRect(70,fy-8,4,8);g.fillStyle='#9b6bff';g.fillRect(78,fy-6,4,6);g.fillStyle='#ffd24a';g.fillRect(85,fy-7,3,7);g.fillStyle='#caa';g.fillRect(92,fy-5,6,5);
  // 衣架（可爱裙）
  (function(){const rx=w-72;g.strokeStyle='#aaa';g.lineWidth=2;g.beginPath();g.moveTo(rx-4,30);g.lineTo(rx+52,30);g.moveTo(rx,30);g.lineTo(rx,fy);g.moveTo(rx+48,30);g.lineTo(rx+48,fy);g.stroke();
    g.fillStyle='#ffb3d0';g.fillRect(rx+4,34,18,34);g.fillStyle='#ffd2e4';g.fillRect(rx+4,34,18,6);
    g.fillStyle='#bfe0ff';g.fillRect(rx+27,34,16,30);g.fillStyle='#dff0ff';g.fillRect(rx+27,34,16,5);})();
  // 绿植
  g.fillStyle='#b07a4a';g.fillRect(120,fy-2,12,12);g.fillStyle='#5aa05a';g.beginPath();g.arc(126,fy-6,9,0,7);g.fill();g.fillStyle='#6ac06a';g.beginPath();g.arc(122,fy-9,5,0,7);g.fill();
  g.fillStyle='rgba(170,110,160,.22)';g.beginPath();g.ellipse(w/2,h-12,64,11,0,0,7);g.fill();
},
function(g,w,h,fy,t){ /* 4 少女房成型 */
  rW(g,w,fy,'#5c4663','#382c46');
  g.fillStyle='rgba(255,255,255,.06)';for(let yy=14;yy<fy;yy+=20)for(let xx=10+((yy/20|0)%2)*11;xx<w;xx+=22)g.fillRect(xx,yy,3,3);
  rF(g,w,h,fy,'#34283e');fairy(g,w,t,['#ff9ed0','#fff0a0','#bfe0ff']);
  neonWindow(g,w-62,20,50,38,'#e89ad0','rgba(255,180,220,.55)',t);
  // 帐幔小床角
  (function(){const bx=4,by=fy-26;g.fillStyle='rgba(255,200,230,.4)';g.beginPath();g.moveTo(bx-2,8);g.lineTo(bx+30,8);g.lineTo(bx+10,by);g.lineTo(bx-2,by);g.closePath();g.fill();
    g.fillStyle='#caa0d8';g.fillRect(bx,by,56,26);g.fillStyle='#e8c8f0';g.fillRect(bx,by,56,8);g.fillStyle='#fff0f6';g.fillRect(bx+4,by-6,18,12);g.fillStyle='#ff9ec8';g.fillRect(bx+28,by-4,16,10);})();
  // 圆镜梳妆
  g.fillStyle='#e8b8d8';g.beginPath();g.arc(w-38,46,18,0,7);g.fill();g.fillStyle='#dfeaf2';g.beginPath();g.arc(w-38,46,15,0,7);g.fill();g.fillStyle='rgba(255,255,255,.2)';g.beginPath();g.arc(w-42,42,6,0,7);g.fill();
  // 拍立得照片串
  g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=1;g.beginPath();g.moveTo(70,16);g.lineTo(220,24);g.stroke();for(let i=0;i<4;i++){const px=86+i*38,py=16+i*2;g.fillStyle='#fff';g.fillRect(px,py,12,14);g.fillStyle=['#ffb3d0','#bfe0ff','#fff0a0','#c8f0c8'][i];g.fillRect(px+1,py+1,10,9);}
  // 玩偶架
  g.fillStyle='#b9a0c8';g.fillRect(w-58,fy-30,46,3);plush(g,w-46,fy-34,'#ff9ec8',1);plush(g,w-26,fy-34,'#9fd0ff',0);
  g.fillStyle='rgba(200,120,180,.25)';g.beginPath();g.ellipse(w/2,h-11,70,12,0,0,7);g.fill();
},
function(g,w,h,fy,t){ /* 5 出道·blingbling 梦幻房 */
  rW(g,w,fy,'#7e5a7e','#4a3658');
  for(let i=0;i<30;i++){const sx=(i*53)%w,sy=(i*37)%fy;g.fillStyle='rgba(255,255,255,'+(.1+.15*Math.abs(Math.sin(t*2+i)))+')';g.fillRect(sx,sy,2,2);}
  rF(g,w,h,fy,'#402e4c');fairy(g,w,t,['#ff7bc1','#ffd24a','#4ad8ff','#fff']);
  g.fillStyle='#ff7bc1';g.fillRect(0,2,w,15);g.fillStyle='#fff2f8';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText('★ 祝 出 道 大 成 功 ★',w/2,14);g.textAlign='left';
  // 霓虹招牌（爱心 + IDOL）
  (function(){const nx=26,ny=42;g.save();g.shadowBlur=8;g.shadowColor='#ff5fb0';g.fillStyle='#ff8fd0';heartShape(g,nx,ny,7);g.shadowColor='#7af0ff';g.strokeStyle='#9ff0ff';g.lineWidth=2;g.strokeRect(nx-8,ny+12,30,13);g.shadowBlur=0;g.fillStyle='#bff8ff';g.font='bold 8px sans-serif';g.fillText('IDOL',nx-5,ny+22);g.restore();})();
  // 气球
  [['#ff7bc1',270,38],['#ffd24a',286,52],['#9b6bff',12,fy-18]].forEach(b=>{g.fillStyle=b[0];g.beginPath();g.ellipse(b[1],b[2]+Math.sin(t+b[1])*2,7,9,0,0,7);g.fill();g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=1;g.beginPath();g.moveTo(b[1],b[2]+9);g.lineTo(b[1]+2,b[2]+20);g.stroke();});
  // 华丽梳妆台灯泡
  (function(){const mx=w-58,my=fy-40,mw=40,mh=40;g.fillStyle='#ffd0ea';g.fillRect(mx-3,my-3,mw+6,mh+6);g.fillStyle='#eef4fb';g.fillRect(mx,my,mw,mh);g.fillStyle='#fff';for(let i=0;i<4;i++){g.globalAlpha=.6+.4*Math.abs(Math.sin(t*3+i));g.beginPath();g.arc(mx-3+i*((mw+6)/3),my-3,2,0,7);g.fill();}g.globalAlpha=1;})();
  // 奖杯
  g.fillStyle='#ffd24a';g.fillRect(40,fy-2,12,4);g.fillRect(43,fy-12,6,10);g.beginPath();g.arc(46,fy-14,6,0,7);g.fill();g.fillStyle='#fff3c0';g.fillRect(44,fy-15,2,4);
  // 玩偶墙
  g.fillStyle='#caa0d8';g.fillRect(96,fy-28,108,3);plush(g,108,fy-32,'#ff9ec8',1);plush(g,128,fy-32,'#fff0a0',0);plush(g,148,fy-32,'#9fd0ff',1);plush(g,168,fy-32,'#c8f0c8',0);plush(g,188,fy-32,'#ffb3d0',1);
  // 应援棒桶
  g.fillStyle='#3a2a4a';g.fillRect(250,fy-14,16,14);['#ff7bc1','#4ad8ff','#ffd24a','#7af07a'].forEach((cc,i)=>{g.fillStyle=cc;g.fillRect(252+i*3,fy-26,2,14);g.globalAlpha=.6;g.beginPath();g.arc(253+i*3,fy-26,2,0,7);g.fill();g.globalAlpha=1;});
  g.fillStyle='rgba(255,120,190,.28)';g.beginPath();g.ellipse(w/2,h-10,76,13,0,0,7);g.fill();
  for(let i=0;i<10;i++){const sx=(i*61+t*20)%w,sy=30+(i*23)%(fy-30);g.fillStyle='rgba(255,240,180,'+(.3+.4*Math.abs(Math.sin(t*3+i)))+')';g.fillRect(sx|0,sy|0,2,2);}
},
];
function drawRoom(g,w,h,stage,t){ROOMS[Math.min(stage,5)](g,w,h,Math.round(h*0.80),t);}
/* 每个形态码一间专属 GPT 房间图（铺满人物窗口）；按需懒加载，缺图/加载中回退程序化房间 */
const ROOMIMG={},ROOMLOADING={};
function roomSrc(code){return 'art/rooms/'+(code==='_'?'uncle':code)+'.jpg';}
function getRoomImg(code){
  if(code in ROOMIMG)return ROOMIMG[code];               // 已结：成功=img / 失败=null
  if(!ROOMLOADING[code]){ROOMLOADING[code]=1;const im=new Image();
    im.onload=()=>ROOMIMG[code]=im;im.onerror=()=>ROOMIMG[code]=null;im.src=roomSrc(code);}
  return undefined;                                       // 加载中
}
function drawRoomBg(g,w,h,stage,t){
  const im=getRoomImg(P.mods.join('')||'_');
  if(im&&im.width){                                      // cover 铺满整窗（保持比例，超出裁掉）
    const s=Math.max(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s;
    g.imageSmoothingEnabled=true;g.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
  }else{ g.fillStyle='#0c0918'; g.fillRect(0,0,w,h); }    // 加载中：纯深底占位（不再回退老房间）
}
/* 待机循环动画帧（Ark 视频抠帧，6fps）：某形态有帧则替代静态立绘 */
let IDLE_COUNT={};
try{if(typeof fetch==='function')fetch('art/idle/manifest.json').then(r=>r.json()).then(j=>{IDLE_COUNT=j||{};}).catch(()=>{});}catch(e){}
const IDLEFR={},IDLELOAD={};
function getIdleFrame(code,t){
  const key=code==='_'?'uncle':code, n=IDLE_COUNT[key]; if(!n)return null;
  if(!IDLEFR[key]){
    if(!IDLELOAD[key]){IDLELOAD[key]=1;const arr=new Array(n).fill(null);IDLEFR[key]=arr;
      for(let i=0;i<n;i++){const im=new Image(),idx=i;im.onload=()=>{arr[idx]=im;};im.src='art/idle/'+key+'/f'+String(i).padStart(2,'0')+'.png';}}
    return null;
  }
  const f=IDLEFR[key][Math.floor(t*6)%n]; return (f&&f.width)?f:null;   // 6fps 循环
}
/* 高清立绘加载器在 keyart_loader.js（游戏与设计页共用：KEYART/KEYART_HEAD/loadKeyart 等） */

function drawStream(t){
  const c=$('streamCv');if(!c||typeof playerSprite!=='function')return;
  const g=c.getContext('2d'),w=STREAM_W,h=STREAM_H;        // 逻辑尺寸固定，按 STREAM_SCALE 等比放大渲染
  const dt=Math.min(.05,t-_slt);_slt=t;
  streamHit=Math.max(0,streamHit-dt*2.4);                  // 受击抖动衰减
  const shk=streamHit*14;
  g.setTransform(STREAM_SCALE,0,0,STREAM_SCALE,(Math.random()-.5)*shk*STREAM_SCALE,(Math.random()-.5)*shk*STREAM_SCALE);
  const formName=playerForm(P.mods).name;                 // 只取名字，不再构建老的程序化立绘
  const fam=P.mods.length>=2?(P.mods[0]+P.mods[1]):'';
  const ac=P.mods.length===0?'#7a9a5a':({LS:'#ff7bc1',LD:'#9b6bff',HS:'#4ad8ff',HD:'#ff6a6a'}[fam]||'#ff7bc1');
  g.clearRect(0,0,w,h);
  drawRoomBg(g,w,h,P.mods.length,t);                     // 进化的卧室背景（优先 GPT 房间图，缺图回退程序化）
  const rg=g.createRadialGradient(w/2,h*0.52,6,w/2,h*0.56,72);
  rg.addColorStop(0,ac+'33');rg.addColorStop(1,'#0000');g.fillStyle=rg;g.fillRect(0,0,w,h); // 人物身后柔光
  /* 角色立像：有待机动画帧就循环播（动态待机），否则用静态高清立绘；都没有则不画（深底占位） */
  const _code=P.mods.join('')||'_';
  const idle=getIdleFrame(_code,t);
  const img=idle||KEYART[_code];
  const fy=Math.round(h*0.92), bob=idle?0:Math.sin(t*2)*1.5, baseY=fy+bob; // 有真实动画就不叠程序化呼吸
  if(img){
    let drawH=fy-12, scl=drawH/img.height, dw=img.width*scl;
    const maxW=w*0.96; if(dw>maxW){scl=maxW/img.width;dw=maxW;drawH=img.height*scl;}  // 宽度兜底，防溢出
    g.imageSmoothingEnabled=true;
    g.drawImage(img,(w-dw)/2,baseY-drawH,dw,drawH);
    g.imageSmoothingEnabled=false;
  }
  /* 礼物动画（每种礼物专属：火箭/游艇/跑车/城堡/飞机/烟花/爱心/皇冠） */
  if(streamGift)drawGiftAnim(g,w,h,dt);
  /* 扫描线 + 暗角 */
  g.globalAlpha=.05;g.fillStyle='#000';for(let y=0;y<h;y+=3)g.fillRect(0,y,w,1);g.globalAlpha=1;
  const vg=g.createRadialGradient(w/2,h/2,h*0.42,w/2,h/2,h*0.85);
  vg.addColorStop(0,'#0000');vg.addColorStop(1,'#000a');g.fillStyle=vg;g.fillRect(0,0,w,h);
  if(streamHit>0){g.fillStyle='rgba(255,30,42,'+(streamHit*0.55)+')';g.fillRect(0,0,w,h);}  // 受击红闪
  /* 改造进化过场 */
  if(cutscene){
    const cs=cutscene; cs.t+=dt; const T=cs.t;
    const whiteIn=0.55, actDur=3.4, revealT=whiteIn+actDur, fadeOut=0.6, mStart=revealT+fadeOut, mDur=2.7;
    if(!cs.revealed&&T>=revealT){cs.revealed=true;P.mods.push(cs.key);P.hp=Math.min(P.hp,ST().maxhp);
      $('formLab').textContent=playerForm(P.mods).name;triggerStreamGift('改造完成✦');
      if(P.mods.length===5)grantFormSkill();          // ⑤ 出道→解锁专属技能
      for(let i=0;i<3;i++)setTimeout(()=>emitPos(Math.min(P.mods.length,5)),i*450+250);}
    let wa=0;
    if(T<whiteIn)wa=T/whiteIn; else if(T<revealT)wa=1; else if(T<mStart)wa=1-(T-revealT)/fadeOut;
    if(wa>0){g.fillStyle='rgba(255,255,255,'+wa+')';g.fillRect(0,0,w,h);}
    if(T<revealT){g.globalAlpha=(0.35+0.4*Math.abs(Math.sin(T*14)))*Math.min(1,wa*1.4);g.strokeStyle='#bfe0ff';g.lineWidth=1;
      for(let i=0;i<7;i++){const yy=((i*71+T*160)%(h+40))-20;g.beginPath();g.moveTo(0,yy);g.lineTo(w,yy+18);g.stroke();}g.globalAlpha=1;}
    let bub=null,bottom=false,acc='#ff7bc1';
    if(T>=whiteIn&&T<revealT){bub=cs.act;bottom=true;acc='#9b6bff';}
    else if(T>=mStart){const mi=Math.floor((T-mStart)/mDur);if(mi<cs.mirror.length)bub=cs.mirror[mi];}
    if(bub){
      const lines=wrapCN(bub,15),lh=17,pad=9,bw=w-26,bh=lines.length*lh+pad*2;
      const by=h-bh-40;                                  // 演出/照镜泡泡放底部，但上移避开「当前形态」标签
      g.fillStyle='rgba(14,10,22,0.9)';roundRect(g,13,by,bw,bh,9);g.fill();
      g.strokeStyle=acc;g.lineWidth=2;g.stroke();
      g.fillStyle='#fff';g.font='13px "PingFang SC",sans-serif';g.textAlign='left';
      lines.forEach((ln,i)=>g.fillText(ln,21,by+pad+13+i*lh));g.textAlign='left';
    }
    if(T>=mStart+cs.mirror.length*mDur+0.5){cutscene=null;nextModal();}
  }
  if(--streamTxtT<=0){streamTxtT=12;
    const sec=Math.max(0,Math.floor(t-streamStart));
    $('recTime').textContent='REC '+String(sec/60|0).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
    $('streamViewers').textContent='👀 '+Math.floor(viewersShow).toLocaleString();
    $('streamName').textContent=formName;
  }
}

/* ---------- 主循环 ---------- */
/* ESC 暂停 → 角色详情面板（全数值 / 武器 / 道具 / 主被动技 / 当前形态立绘） */
const AXIS_SKILL={  // 改造轴 → 被动/主动技说明（按 ①②③④⑤ 顺序）
  L:['被动','轻盈体','舞步 +15% · 临场 +10% · 心态上限 −15%'],
  H:['被动','重核体','心态上限 +20% · 近台魅力 +15% · 舞步 −8%'],
  S:['被动','甜嗓','手速 +10%'],
  D:['被动','磁嗓','存在感 +15% · 10% 概率二次弹幕'],
  C:['被动','义体派','义体改装 +20% · 召唤位 +1'],
  B:['被动','生体派','心态回复 +1 · 经验 +10% · 无伤波次额外打赏'],
  Y:['被动','元气','热度叠加转化手速（场上越久越快）'],
  N:['被动','冷艳','暴击率 +10% · 暴击施加易伤标记'],
  P:['主动','开场表演','空格释放：全场清屏式表演脉冲（CD 22s）'],
  T:['被动','互动型','打赏 +25% · 弹幕投喂回能'],
};
const PANEL_STATS=[ // [key,标签,格式] 格式 i=整数 r=每秒 p=百分比加成 c=暴击/闪避绝对% m=倍率
  ['maxhp','心态上限','i'],['regen','心态回复','r'],['lifesteal','回魂','p'],['dmg','魅力','p'],
  ['dmgMelee','近台魅力','p'],['dmgRanged','远台魅力','p'],['dmgElem','应援共鸣','p'],['engi','义体改装','p'],
  ['aspd','手速','p'],['crit','暴击率','c'],['range','存在感','p'],['armor','抗压','i'],
  ['dodge','临场','c'],['speed','舞步','m'],['luck','玄学','p'],['harvest','恰饭','p'],
];
function fmtStat(v,f){
  if(f==='i')return Math.round(v);
  if(f==='r')return (+v).toFixed(1)+'/s';
  if(f==='c')return Math.round(v*100)+'%';
  if(f==='m')return '×'+(+v).toFixed(2);
  const n=Math.round(v*100);return (n>=0?'+':'')+n+'%';
}
function pauseModal(){
  const st=ST(),code=P.mods.join('')||'_',f=playerForm(P.mods);
  const art=(typeof KEYART_SRC!=='undefined'&&KEYART_SRC[code])||'art/keyart/uncle.png';
  // 套装
  const sets=Object.keys(P.setN).filter(s=>P.setN[s]>0).map(s=>{const n=P.setN[s],need=(typeof SETS!=='undefined'&&SETS[s]?SETS[s].n:3);
    return `<span class="pset ${n>=need?'on':''}">${s} ${n}/${need}</span>`;}).join('');
  // 技能（改造轴）
  const skills=P.mods.map((m,idx)=>{
    // ⑤ 出道：显示该形态真正解锁的专属技能（而非旧的通用 P/T 文案）
    if(idx===4&&P.mods.length===5){const def=SKILLS[P.mods.join('')];if(def){
      const kind=def.type==='active'?'主动':(def.type==='passive'?'被动':'专属武器');
      const cd=def.type==='active'?(P.skillCd>0?` <em style="color:#ff9">CD ${P.skillCd.toFixed(0)}s</em>`:(P._skT>0?` <em style="color:#7af0ea">演出中 ${P._skT.toFixed(1)}s</em>`:' <em style="color:#7af">就绪[空格]</em>')):'';
      return `<div class="psk"><span class="kind ${def.type==='active'?'act':''}">${kind}</span><b>${def.name}</b>${cd}<br><small>${SKILL_DESC[P.mods.join('')]||''}</small></div>`;}}
    const s=AXIS_SKILL[m];if(!s)return'';
    return `<div class="psk"><span class="kind ${s[0]==='主动'?'act':''}">${s[0]}</span><b>${s[1]}</b><br><small>${s[2]}</small></div>`;
  }).filter(Boolean).join('')||'<div class="pempty">原点·未改造</div>';

  showPanel(`<div class="pause">
    <div class="phead">
      <img src="${art}" class="pavatar" onerror="this.style.display='none'">
      <div><h2 style="margin:0">${f.name}</h2>
      <div class="sub">改造路径 ${P.mods.join(' → ')||'原点'} ｜ 波次 ${G.wave} ｜ 心态 ${P.hp}/${st.maxhp}</div>
      ${sets?'<div class="psets">'+sets+'</div>':''}</div>
    </div>
    <div class="pbody">
      <div class="pmain">
        <div class="ownBox weps"><div class="obh">武器 ${P.weapons.length}/${WEAPON_MAX} <span class="pdim">· 悬浮看详情</span></div><div class="wgrid">${ownWeaponsGrid(false)}</div></div>
        <div class="ownBox items"><div class="obh">持有道具 ${P.itemIds.length} <span class="pdim">· 悬浮看详情</span></div><div class="ggrid">${ownItemsGrid()}</div></div>
        <div class="ownBox"><div class="obh">主被动技</div><div class="pskills">${skills}</div></div>
      </div>
      <div class="pside">
        <div class="srhd">属性面板</div>
        <div id="statPanel">${statPanel()}</div>
      </div>
    </div>
    <div class="sub" style="text-align:center;margin-top:8px">按 Esc 继续直播</div>
  </div>`);
  $('panel').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{shopTab=b.dataset.tab;pauseModal();});
}
let last=performance.now(),paused=false;
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!G.ultCut&&(G.scr==='play'||paused)){
    paused=!paused;
    if(paused)pauseModal();
    else {hideHovTip();hidePanel();}
  }
});
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(musicGain){const w=musicWant();musicGain.gain.value+=(w-musicGain.gain.value)*0.10;}  // 背景音乐：仅战斗渐入，过场/商店渐出
  if(G.ultCut){                                          // 大招 cut-in：全场暂停推进演出，结束即真正释放
    const c=G.ultCut; c.t+=dt;
    if(c.t>=c.dur){G.ultCut=null;doCast(c.sk);}
  }else if(G.scr==='play'&&!paused){
    if((G.hitStop||0)>0){G.hitStop-=dt;}     // 命中顿帧：冻结一瞬强化打击感（仍渲染）
    else update(dt);
  }
  if(G.scr==='play'||G.scr==='modal'){render();updateHud(dt);}
  if(G.ultCut)drawUltCut(G.ultCut);                      // cut-in 覆盖层画在最上面
  drawStream(now/1000);
  requestAnimationFrame(loop);
}

/* ---------- 开发者模式 ---------- */
const DEVAX=[['①体型',[['L','轻盈'],['H','重核']]],['②声线',[['S','甜嗓'],['D','磁嗓']]],
  ['③哲学',[['C','义体'],['B','生体']]],['④气质',[['Y','元气'],['N','冷艳']]],['⑤定位',[['P','舞台'],['T','互动']]]];
let devOpen=false;
function toggleDev(){devOpen=!devOpen;$('dev').classList.toggle('show',devOpen);if(devOpen)buildDev();}
function devSetMods(m){
  P.mods=m.slice();
  // dev 切换形态：清掉旧专属技能状态(否则残留/空格无效)；满5字立即解锁该形态专属技能
  P.activeSkill=null;P.passiveSkill=null;P._skT=0;P.skillCd=0;P._pendWeapon=0;
  if(G.clones)G.clones=G.clones.filter(c=>!c.sister);   // 清掉旧的永久陪伴分身(青梅等)
  if(typeof getChibiImg==='function')getChibiImg(P.mods.join('')||'_');   // 提前预载新形态 chibi，缩短占位时间
  if(P.mods.length===5)grantFormSkill();
  const mx=ST().maxhp;P.hp=Math.min(P.hp||mx,mx);if(P.hp<1)P.hp=mx;
  $('formLab').textContent=playerSprite(P.mods).name;
  buildDev();
}
function devPick(i,v){const m=[];for(let k=0;k<i;k++)m.push(P.mods[k]||DEVAX[k][1][0][0]);m.push(v);devSetMods(m);}
function devRandom(){const full=DEVAX.map(ax=>pick(ax[1])[0]);devSetMods(full.slice(0,ri(0,5)));}
function devCheat(k){
  if(k==='hp')P.hp=ST().maxhp;
  else if(k==='gold'){G.gold+=500;G.totalGold+=500;}
  else if(k==='wave'){if(G.scr==='play'&&G.wave>0&&G.wave!==20)G.waveT=G.waveDur+1;}
  else if(k==='elite'){if(G.scr==='play')spawnEnemy('heifen');}
  else if(k==='lv')gainXp(G.xpNext);
  else if(k==='god')G.god=!G.god;
  else if(k==='heat'){G.infHeat=!G.infHeat;if(G.infHeat)P.heat=100;}
  buildDev();
}
/* dev·跳到指定波：清场+关弹窗，直接开第 n 波（无 n 则读输入框） */
function devJumpWave(n){
  if(n==null){const el=$('devWaveIn');n=el?parseInt(el.value,10):G.wave;}
  n=Math.max(1,Math.min(99,Math.round(n)||1));
  cutscene=null;G.ultCut=null;paused=false;
  const ov=$('overlay');if(ov)ov.classList.remove('show');
  const so=$('shopOv');if(so&&so.classList.contains('show')&&typeof hideShop==='function')hideShop();
  const ts=$('titleScreen');if(ts)ts.style.display='none';
  G.drops=[];G.enemies=[];G.ebullets=[];G.bullets=[];G.zones=[];G.clones=[];G.allies=[];G.fields=[];   // 清场，避免旧波残留
  P._skT=0;P._convWin=0;P._moshT=0;
  G.scr='play';
  startWave(n);
  if(P.passiveSkill&&P.passiveSkill.grant)P.passiveSkill.grant();   // 重挂永久陪伴(青梅等)
  toast('跳到第 '+n+' 波');buildDev();
}
function buildDev(){
  const d=$('dev');if(!d)return;
  let html='<h4>🛠 开发者模式 — '+playerSprite(P.mods).name+'</h4>';
  DEVAX.forEach((ax,i)=>{
    html+='<div class="row"><b>'+ax[0]+'</b>';
    ax[1].forEach(o=>{html+='<button class="'+(P.mods[i]===o[0]?'on':'')+'" onclick="devPick('+i+',\''+o[0]+'\')">'+o[0]+' '+o[1]+'</button>';});
    html+='</div>';
  });
  html+='<div class="row"><b>跳转</b><button onclick="devSetMods([])">原点</button><button onclick="devRandom()">🎲 随机</button></div>';
  html+='<div class="row cheat"><b>作弊</b><button onclick="devCheat(\'hp\')">满心态</button><button onclick="devCheat(\'gold\')">+500打赏</button></div>';
  html+='<div class="row cheat"><b></b><button onclick="devCheat(\'wave\')">跳过本波</button><button onclick="devCheat(\'elite\')">召唤精英</button></div>';
  html+='<div class="row cheat"><b></b><button onclick="devCheat(\'lv\')">+1人气级</button><button class="'+(G.god?'on':'')+'" onclick="devCheat(\'god\')">无敌：'+(G.god?'开':'关')+'</button></div>';
  html+='<div class="row cheat"><b></b><button class="'+(G.infHeat?'on':'')+'" onclick="devCheat(\'heat\')">无限元气：'+(G.infHeat?'开':'关')+'</button></div>';
  html+='<div class="row cheat"><b>跳关</b><input id="devWaveIn" type="number" min="1" max="99" value="'+(G.wave||1)+'" style="width:46px;background:#0d0a16;color:#7af0ea;border:1px solid #3a2f55;border-radius:5px;padding:2px 4px;font-family:Menlo,monospace"> <button onclick="devJumpWave()">跳到此波</button></div>';
  html+='<div class="row cheat"><b></b>'+[5,10,15,19,20,25,30].map(n=>'<button onclick="devJumpWave('+n+')">'+n+'波</button>').join('')+'</div>';
  html+='<div class="hint">按 <b>`</b>(Esc下方) 开关 ｜ 任意时刻可改形态，立即在直播窗 / 场上生效</div>';
  d.innerHTML=html;
}

/* ---------- 启动 ---------- */
/* 标题动态版：清晰原视频抽出的 6fps 帧序列，画到 canvas 上循环（drawImage 已解码帧→零闪烁） */
const TITLE_FN=30;
function titleFrameSrc(i){return 'art/title_frames/f'+String(i).padStart(2,'0')+'.jpg';}
let _titleImgs=[],_titleTimer=null;
function startTitleAnim(){
  const cv=$('titleCanvas');if(!cv||!_titleImgs.length)return;
  const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  const f0=_titleImgs[0];if(f0&&f0.naturalWidth){cv.width=f0.naturalWidth;cv.height=f0.naturalHeight;}
  let i=0;
  const draw=()=>{const im=_titleImgs[i];if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,0,0,cv.width,cv.height);i=(i+1)%_titleImgs.length;};
  draw();clearInterval(_titleTimer);_titleTimer=setInterval(draw,1000/6);   // 6fps
}
function stopTitleAnim(){clearInterval(_titleTimer);_titleTimer=null;}
/* 启动预载：首屏图 + 标题 6fps 帧全部加载好（帧 Image 引用留存供 canvas 复用），进度单调走满 100% 再进标题 */
function preloadBoot(done){
  const staticImgs=['art/title.jpg','art/maps/bg0.jpg','art/rooms/uncle.jpg','art/keyart/uncle.png',
    (typeof chibiSrc==='function'?chibiSrc('_'):'art/chibi/uncle.png?v=px1'),   // 原点操作角色立绘，进场即用
    'art/enemies/luren.png','art/enemies/shuijun.png','art/enemies/penzi.png','art/enemies/baipiao.png'];
  _titleImgs=[];for(let i=0;i<TITLE_FN;i++)_titleImgs.push(new Image());   // 保留引用→保持已解码，canvas 直接用
  const TIPS=['正在连接直播间…','给阿源化妆中…','加载观众潮…','点亮舞台灯光…','调试改造贷款…'];
  const fill=$('bootFill'),pct=$('bootPct'),tip=$('bootTip');
  const total=staticImgs.length+_titleImgs.length;
  let n=0,shown=0,fin=false;
  const setBar=p=>{p=Math.max(shown,Math.min(100,p));shown=p;                 // 单调不回退
    if(fill)fill.style.width=p+'%';if(pct)pct.textContent=Math.round(p)+'%';
    if(tip)tip.textContent=TIPS[Math.min(TIPS.length-1,Math.floor(p/100*TIPS.length))];};
  const finish=()=>{if(fin)return;fin=true;setBar(100);setTimeout(done,500);};  // 显示 100% 停留半秒再进
  const bump=()=>{if(fin)return;n++;setBar(Math.min(99,n/total*100));if(n>=total)finish();};
  staticImgs.forEach(src=>{const im=new Image();im.onload=bump;im.onerror=bump;im.src=src;});
  _titleImgs.forEach((im,k)=>{im.onload=bump;im.onerror=bump;im.src=titleFrameSrc(k+1);});
  setTimeout(()=>{if(!fin)finish();},9000);   // 兜底
}
function prefetchRest(){                       // 标题显示后台预取：其余地图（防改造进化时黑闪）
  ['art/maps/bg1.jpg','art/maps/bg2.jpg','art/maps/bg3.jpg','art/maps/bg4.jpg','art/maps/bg5.jpg']
    .forEach(s=>{const im=new Image();im.src=s;});
}
function showTitle(){
  const t=$('titleScreen'),art=$('titleArt'),b=$('bootScreen');
  if(art)art.style.backgroundImage="url('"+titleFrameSrc(1)+"')";   // 已预载→同步上首帧，瞬间显示不黑
  if(t)t.style.display='flex';                                       // 先在 boot 之下铺好标题，再淡出 boot
  startTitleAnim();                                                  // 6fps 帧循环（帧已缓存→流畅）
  if(b){b.classList.add('hide');setTimeout(()=>{b.style.display='none';},480);}
  G.scr='start';prefetchRest();
  $('btnStart').onclick=()=>{audioInit();stopTitleAnim();if(t)t.style.display='none';beginRun();};
  $('btnAbout').onclick=()=>{$('aboutModal').style.display='flex';};
  $('btnAboutClose').onclick=()=>{$('aboutModal').style.display='none';};
}
function init(){
  ESPR=makeEnemySprites();COIN=makeCoin();HOLO=makeHolo();
  loadKeyart();
  fitLayout();
  makeFloor();
  playerSprite([]);                       // 预热初始形态
  $('formLab').textContent='阿源（原点）';
  G.scr='start';
  render();
  requestAnimationFrame(loop);
  preloadBoot(showTitle);                  // 资源就绪 → 进主菜单标题页
}
init();

/* ============ 游戏数据 ============ */

/* ---- 武器（魅力输出手段，无枪炮）· v0.3 ----
   cat=伤害类别(决定吃哪个类别乘区) ｜ scales=吃哪些能力值(展示/引导) ｜ syn=改造轴协同
   tf=品阶机制位解锁表(2绿/3蓝/4紫，§3.3)：升阶=数值×品阶系数 + 解锁机制位 */
const TIER_MULT=[1,1.3,1.7,2.2], TIER_NAME=['素人','签约','当红','顶流'], TIER_COL=['#b8c0d0','#7af07a','#5aaaff','#c77bff'];
const WEAPONS={
  mic:    {name:'老麦克风', desc:'声波冲击，扇形近战', price:0,  base:13, cd:0.85, range:100, type:'melee',  arc:1.7, cat:'melee', scales:{dmgMelee:1,aspd:.5}, tags:['melee'], syn:'H', col:'#9a9aa8', tf:{2:{pierce:1},3:{knockback:9},4:{arc:.5}}},
  kiss:   {name:'飞吻',     desc:'追踪心形弹',         price:26, base:11, cd:1.05, range:340, type:'homing', cat:'ranged', scales:{dmgRanged:1}, tags:['ranged'], syn:'S', col:'#ff7bc1', tf:{2:{homing:.3},3:{multishot:1},4:{split:2}}},
  stick:  {name:'应援棒',   desc:'wota艺荧光棒连击',   price:22, base:6,  cd:0.34, range:80,  type:'melee',  arc:1.2, cat:'melee', scales:{aspd:1,crit:.4}, tags:['melee'], syn:'S', col:'#7af07a', tf:{2:{crit:.05},3:{aspd:.12},4:{critSplash:1}}},
  flash:  {name:'闪光灯',   desc:'周期闪光，魅惑一圈', price:36, base:15, cd:2.3,  range:160, type:'nova',   cat:'tech', scales:{dmgElem:1,engi:.5}, tags:['tech'], col:'#fff8d0', status:'chill', tf:{2:{chill:1},3:{stun:1},4:{chain:2}}},
  hiNote: {name:'高音穿透', desc:'海豚音直线贯穿',     price:32, base:17, cd:1.4,  range:400, type:'pierce', cat:'ranged', scales:{dmgRanged:1,range:.6}, tags:['ranged'], syn:'S', col:'#8fe8ff', tf:{2:{pierce:2},3:{projSize:.4},4:{vuln:1}}},
  bass:   {name:'低音震场', desc:'低频冲击波',         price:32, base:13, cd:1.9,  range:185, type:'nova',   cat:'tech', scales:{dmgElem:.6,range:.5}, tags:['tech'], syn:'D', col:'#9b6bff', tf:{2:{knockback:16},3:{chain:2},4:{slowField:1}}},
  card:   {name:'签名手卡', desc:'回旋镖式手卡',       price:28, base:14, cd:1.5,  range:280, type:'boomerang', cat:'ranged', scales:{dmgRanged:1,aspd:.4}, tags:['ranged'], syn:'S', col:'#ffd24a', tf:{2:{bounce:1},3:{multishot:1},4:{projSize:.5}}},
  perfume:{name:'香水喷雾', desc:'留下魅惑领域',       price:34, base:5,  cd:2.7,  range:250, type:'zone',   cat:'zone', scales:{engi:.8,dmgElem:.6}, tags:['zone'], syn:'D', col:'#d8a8ff', status:'poison', tf:{2:{zoneDur:1},3:{poison:1},4:{zonePull:1}}},
  mirror: {name:'反光板',   desc:'环绕格挡，反弹黑评', price:30, base:10, cd:0,    range:74,  type:'orbit',  cat:'orbit', scales:{dmg:1,engi:.5}, tags:['tech'], syn:'C', col:'#cfe6ff', tf:{2:{orbit:1},3:{reflect:1},4:{guardNova:1}}},
  selfie: {name:'自拍杆',   desc:'大范围横扫',         price:28, base:16, cd:1.65, range:140, type:'melee',  arc:2.7, cat:'melee', scales:{dmgMelee:1,range:.5}, tags:['melee'], syn:'H', col:'#b8c0d0', tf:{2:{arc:.4},3:{knockback:12},4:{drag:1}}},
  disc:   {name:'周边光碟', desc:'散弹式专辑投掷',     price:30, base:8,  cd:1.25, range:320, type:'shotgun',cat:'ranged', scales:{dmgRanged:1,multishot:1}, tags:['ranged'], syn:'S', col:'#8fd0ff', tf:{2:{multishot:1},3:{bounce:1},4:{boomerang:1}}},
  holo:   {name:'全息分身', desc:'投影分身帮忙营业',   price:48, base:8,  cd:7.5,  range:0,   type:'summon', cat:'summon', scales:{engi:1}, tags:['tech'], syn:'C', col:'#7af0ea', tf:{2:{summonN:1},3:{cloneArm:1},4:{cloneCrit:1}}},
  /* ===== v0.3.4 武器扩展库（§6 · 按伤害系分类）===== */
  /* 6.1 近台魅力系 melee */
  micSpear:    {name:'麦架长枪',   desc:'直线突刺',         price:30, base:22, cd:1.2,  range:130, type:'melee',  arc:0.7, cat:'melee', scales:{dmgMelee:1,range:.5}, tags:['melee'], syn:'H', col:'#c8c0d8', tf:{2:{pierce:1},3:{knockback:10},4:{arc:.5}}},
  gauntlet:    {name:'镁光拳套',   desc:'贴脸高频连击',     price:26, base:7,  cd:0.40, range:70,  type:'melee',  arc:0.9, cat:'melee', scales:{dmgMelee:1,aspd:.5}, tags:['melee'], syn:'S', col:'#fff0a0', tf:{2:{arc:.2},3:{stun:1},4:{knockback:8}}},
  chair:       {name:'战术折叠椅', desc:'大力横扫',         price:34, base:30, cd:1.9,  range:150, type:'melee',  arc:2.2, cat:'melee', scales:{dmgMelee:1}, tags:['melee'], syn:'H', col:'#9aa0b0', tf:{2:{knockback:18},3:{stun:1},4:{arc:.5}}},
  nunchaku:    {name:'双截应援棒', desc:'连环横扫',         price:28, base:11, cd:0.6,  range:95,  type:'melee',  arc:1.9, cat:'melee', scales:{dmgMelee:1,aspd:.5}, tags:['melee'], syn:'S', col:'#7af07a', tf:{2:{arc:.3},3:{knockback:8},4:{arc:.5}}},
  pillowHammer:{name:'抱枕巨锤',   desc:'砸地范围震荡',     price:34, base:26, cd:1.7,  range:140, type:'nova',   cat:'melee', scales:{dmgMelee:1,engi:.5}, tags:['melee','tech'], syn:'H', col:'#ffb0d0', tf:{2:{knockback:14},3:{stun:1},4:{chain:2}}},
  bagFlail:    {name:'痛包链锤',   desc:'环绕回旋横扫',     price:30, base:18, cd:1.3,  range:140, type:'melee',  arc:3.0, cat:'melee', scales:{dmgMelee:1,range:.5}, tags:['melee'], syn:'H', col:'#ff9ad0', tf:{2:{arc:.4},3:{knockback:10},4:{arc:.6}}},
  /* 6.2 远台魅力系 ranged */
  camera:    {name:'打投相机',   desc:'快门连射',         price:30, base:12, cd:0.9,  range:320, type:'shotgun',cat:'ranged', scales:{dmgRanged:1,aspd:.5}, tags:['ranged'], syn:'S', col:'#8fd0ff', tf:{2:{multishot:1},3:{},4:{multishot:1}}},
  sling:     {name:'应援弹弓',   desc:'单发狙击',         price:30, base:16, cd:1.1,  range:300, type:'pierce', cat:'ranged', scales:{dmgRanged:1,crit:.4}, tags:['ranged'], syn:'N', col:'#ffd24a', tf:{2:{},3:{pierce:1},4:{}}},
  giftRPG:   {name:'打赏火箭筒', desc:'高爆远程',         price:42, base:28, cd:2.4,  range:360, type:'homing', cat:'ranged', scales:{dmgRanged:1,dmgElem:.5}, tags:['ranged'], syn:'C', col:'#ff7a3a', expl:{r:60,m:0.6}, tf:{2:{explR:25},3:{burn:1},4:{multishot:2}}},
  bagMissile:{name:'痛包导弹群', desc:'追踪多重',         price:36, base:20, cd:1.8,  range:380, type:'homing', cat:'ranged', scales:{dmgRanged:1,engi:.5}, tags:['ranged'], syn:'C', col:'#ff9ad0', tf:{2:{multishot:1},3:{homing:.4},4:{multishot:2}}},
  cardRain:  {name:'卡牌雨',     desc:'天降散射',         price:28, base:9,  cd:1.6,  range:280, type:'shotgun',cat:'ranged', scales:{dmgRanged:1}, tags:['ranged'], syn:'S', col:'#8fe8ff', tf:{2:{multishot:1},3:{multishot:1},4:{multishot:2}}},
  memeCannon:{name:'表情包炮',   desc:'随机状态弹',       price:32, base:14, cd:1.5,  range:300, type:'homing', cat:'ranged', scales:{dmgRanged:1,dmgElem:.5}, tags:['ranged'], syn:'D', col:'#d8a8ff', randStatus:1, tf:{2:{},3:{multishot:1},4:{allStatus:1}}},
  /* 6.3 应援共鸣系 状态（scales dmgElem） */
  sparkler:  {name:'烟花棒',     desc:'抛射火花点燃热场', price:24, base:6,  cd:0.8,  range:180, type:'shotgun',cat:'tech', scales:{dmgElem:1}, tags:['tech'], syn:'C', col:'#ff8a3a', status:'burn', tf:{2:{},3:{multishot:1},4:{multishot:2}}},
  candle:    {name:'头香蜡烛',   desc:'环绕灼烧光环',     price:28, base:8,  cd:2.0,  range:150, type:'nova',   cat:'tech', scales:{dmgElem:1,engi:.5}, tags:['tech'], syn:'B', col:'#ffb84a', status:'burn', tf:{2:{},3:{burn:1},4:{chain:2}}},
  chiller:   {name:'冷场制冷机', desc:'喷冷雾全场冷场',   price:28, base:10, cd:1.7,  range:160, type:'nova',   cat:'tech', scales:{dmgElem:1}, tags:['tech'], syn:'D', col:'#8fe8ff', status:'chill', tf:{2:{chill:1},3:{},4:{stun:1}}},
  readFreeze:{name:'已读冰封',   desc:'冰封定身',         price:32, base:13, cd:2.2,  range:260, type:'pierce', cat:'tech', scales:{dmgElem:1}, tags:['tech'], syn:'D', col:'#aee8ff', status:'chill', tf:{2:{},3:{pierce:1},4:{stun:1}}},
  cringeArc: {name:'社死电弧',   desc:'链式社死电流',     price:28, base:9,  cd:1.3,  range:200, type:'homing', cat:'tech', scales:{dmgElem:1}, tags:['tech'], syn:'C', col:'#6ae8ff', status:'shock', tf:{2:{chain:1},3:{shockJump:1},4:{shockJump:2}}},
  projector: {name:'黑历史放映机',desc:'群体公开处刑感电', price:34, base:15, cd:2.4,  range:240, type:'nova',   cat:'tech', scales:{dmgElem:1,engi:.5}, tags:['tech'], syn:'C', col:'#6ae8ff', status:'shock', tf:{2:{},3:{shockJump:1},4:{chain:2}}},
  rumorSpray:{name:'谣言喷雾',   desc:'谣言毒雾领域',     price:30, base:4,  cd:2.5,  range:230, type:'zone',   cat:'zone', scales:{dmgElem:1,engi:.5}, tags:['zone'], syn:'D', col:'#b8e87a', status:'poison', tf:{2:{zoneDur:1},3:{poison:1},4:{zonePull:1}}},
  hitpiece:  {name:'黑稿炸弹',   desc:'投掷黑稿中毒+爆',  price:36, base:16, cd:2.6,  range:300, type:'homing', cat:'ranged', scales:{dmgElem:1}, tags:['ranged'], syn:'C', col:'#9af07a', status:'poison', expl:{r:70,m:0.7}, tf:{2:{explR:30},3:{poison:1},4:{explR:40}}},
  /* 6.4 义体改装系 召唤/领域（scales engi） */
  drone:     {name:'应援无人机', desc:'召唤无人机帮打',   price:42, base:10, cd:6.0,  range:0,   type:'summon', cat:'summon', scales:{engi:1}, tags:['tech'], syn:'C', col:'#7af0ea', tf:{2:{summonN:1},3:{cloneArm:1},4:{summonN:1}}},
  camTurret: {name:'直播机位炮台',desc:'部署自动炮台',     price:38, base:9,  cd:5.0,  range:0,   type:'summon', cat:'summon', scales:{engi:1}, tags:['tech'], syn:'C', col:'#8fd0ff', tf:{2:{summonN:1},3:{cloneArm:1},4:{summonN:1}}},
  aiCohost:  {name:'AI副播',     desc:'召唤AI副播帮唱',   price:46, base:12, cd:8.0,  range:0,   type:'summon', cat:'summon', scales:{engi:1}, tags:['tech'], syn:'C', col:'#c8a8ff', tf:{2:{summonN:1},3:{cloneCrit:1},4:{summonN:1}}},
  cyberPet:  {name:'义体宠物',   desc:'召唤冲撞撕咬',     price:40, base:8,  cd:7.0,  range:0,   type:'summon', cat:'summon', scales:{engi:1}, tags:['tech'], syn:'C', col:'#ffb0d0', tf:{2:{summonN:1},3:{cloneArm:1},4:{cloneCrit:1}}},
  holoArray: {name:'全息应援阵', desc:'铺地伤害领域',     price:34, base:6,  cd:2.4,  range:230, type:'zone',   cat:'zone', scales:{engi:1,dmgElem:.5}, tags:['zone'], syn:'C', col:'#7af0ea', tf:{2:{zoneDur:1},3:{},4:{zoneDur:2}}},
  dmShield:  {name:'弹幕护盾环', desc:'旋转弹幕墙·攻防一体',price:34,base:7,  cd:1.4,  range:120, type:'nova',   cat:'tech', scales:{engi:1}, tags:['tech'], syn:'C', col:'#9fd0ff', tf:{2:{knockback:10},3:{chain:2},4:{stun:1}}},
  /* 6.5 暴击·手速·特殊系 */
  comboDrum: {name:'完美连击鼓', desc:'越连越快的鼓点',   price:26, base:5,  cd:0.30, range:110, type:'melee',  arc:1.4, cat:'melee', scales:{dmgMelee:1,aspd:.5}, tags:['melee'], syn:'S', col:'#ffd24a', tf:{2:{arc:.2},3:{knockback:6},4:{arc:.4}}},
  autotune:  {name:'修音狙',     desc:'精准修音狙击',     price:38, base:20, cd:1.6,  range:420, type:'pierce', cat:'ranged', scales:{dmgRanged:1,crit:.5}, tags:['ranged'], syn:'N', col:'#8fe8ff', tf:{2:{pierce:1},3:{},4:{pierce:2}}},
  rhythmBaton:{name:'节奏带·甩棍',desc:'指挥棒高频近战',   price:28, base:9,  cd:0.5,  range:100, type:'melee',  arc:1.6, cat:'melee', scales:{dmgMelee:1,aspd:.5}, tags:['melee'], syn:'Y', col:'#7af0a0', tf:{2:{arc:.2},3:{knockback:8},4:{arc:.4}}},
  /* §4 招牌武器（meta 解锁：首次用该 ①② 大系出道后入后续 run 卡池） */
  signLS:{name:'星尘麦',   desc:'攻速越高弹幕越密的成长单体',price:44,base:14,cd:0.7, range:360,type:'homing', cat:'ranged',scales:{dmgRanged:1,aspd:.6},tags:['ranged','sign'],syn:'S',col:'#ffe07a',meta:1,tf:{2:{multishot:1},3:{homing:.4},4:{multishot:2}}},
  signLD:{name:'低音手雷', desc:'投掷型震慑炸弹',         price:44,base:24,cd:1.6, range:280,type:'homing', cat:'tech',  scales:{dmgElem:1,engi:.5},tags:['tech','sign'],syn:'D',col:'#9b6bff',meta:1,expl:{r:80,m:0.8},status:'chill',tf:{2:{explR:30},3:{stun:1},4:{explR:40}}},
  signHS:{name:'应援巨锤', desc:'近战AOE击退，越重核越大',price:44,base:34,cd:1.8, range:160,type:'nova',   cat:'melee', scales:{dmgMelee:1,engi:.5},tags:['melee','sign'],syn:'H',col:'#ff8ad0',meta:1,tf:{2:{knockback:20},3:{stun:1},4:{chain:3}}},
  signHD:{name:'失真音墙', desc:'持续推进的低频墙',       price:44,base:10,cd:0.9, range:200,type:'nova',   cat:'tech',  scales:{dmgElem:1,range:.5},tags:['tech','sign'],syn:'D',col:'#9b6bff',meta:1,tf:{2:{knockback:14},3:{chain:2},4:{knockback:20}}},
};
const WEAPON_MAX=6, WLV_MAX=4;
function tierMult(lvl){return TIER_MULT[Math.min(Math.max(lvl,1),4)-1];}     // 品阶系数 1/1.3/1.7/2.2
function wMech(id,lvl){const tf=WEAPONS[id].tf||{},o={};for(let t=2;t<=lvl;t++)if(tf[t])for(const k in tf[t])o[k]=(o[k]||0)+tf[t][k];return o;}  // 累计解锁的机制位
function wDmg(id,lvl){return WEAPONS[id].base*tierMult(lvl);}                 // base×品阶；波次成长走能力值/道具(加法区)
function wCd(id,lvl){return WEAPONS[id].cd;}                                  // CD 由 aspd 驱动（管线），品阶不缩 CD
/* 武器展示信息（来自 数值策划/03-武器.md）：单体DPS@白 / 生态位 / 绿蓝紫升阶机制文案 */
const WEAPON_INFO={
  mic:    {dps:'15.7',   niche:'起手通用·初始', mech:['穿透+1','击退','扇形二段']},
  kiss:   {dps:'10.7',   niche:'稳定点伤',     mech:['追踪','多重+1','命中裂2']},
  stick:  {dps:'18.1',   niche:'攻速暴击',     mech:['暴击+5%','手速+12%','暴击溅射']},
  flash:  {dps:'6.7×群', niche:'AOE+控',       mech:['冰冷','眩晕','连锁致盲']},
  hiNote: {dps:'12.4×穿',niche:'排枪清线',     mech:['穿透+2','弹体变大','穿透叠易伤']},
  bass:   {dps:'7.0×群', niche:'近身AOE',      mech:['击退','连锁','震慑领域']},
  card:   {dps:'9.6×2段',niche:'往返双段',     mech:['弹射+1','多重+1','回旋扩大']},
  perfume:{dps:'持续区域',niche:'控场DoT',      mech:['领域时长','中毒','领域吸引']},
  mirror: {dps:'~40接触',niche:'防御反伤',     mech:['环绕+1','反弹强化','格挡Nova']},
  selfie: {dps:'9.9×群', niche:'近战清群',     mech:['扇角+','击退','横扫拖拽']},
  disc:   {dps:'6.6×5片',niche:'锥形群伤',     mech:['多重+1','弹射','碟片回旋']},
  holo:   {dps:'分身独立',niche:'召唤核心',     mech:['分身+1','分身武装','分身暴击']},
  /* v0.3.4 扩展库 */
  micSpear:    {dps:'18.3×穿',niche:'近台单点',  mech:['穿透','击退','贯穿扇角']},
  gauntlet:    {dps:'17.5×连',niche:'贴脸高频',  mech:['扇角+','致盲眩晕','连段击退']},
  chair:       {dps:'15.8×群',niche:'重击清群',  mech:['强击退','眩晕','震荡扇角']},
  nunchaku:    {dps:'18.3×群',niche:'连环横扫',  mech:['扇角+','击退','旋风扇角']},
  pillowHammer:{dps:'15.3×群',niche:'砸地AOE',   mech:['震荡击退','眩晕','落地连锁']},
  bagFlail:    {dps:'13.8×群',niche:'环绕回旋',  mech:['扇角+','击退','大回旋']},
  camera:      {dps:'13.3×多',niche:'快门连射',  mech:['多重+1','对焦','连拍弹墙']},
  sling:       {dps:'14.5×穿',niche:'暴击单狙',  mech:['蓄力','穿透','爆头']},
  giftRPG:     {dps:'高爆AOE',niche:'爆炸远程',  mech:['爆炸r+','灼烧','齐射多重']},
  bagMissile:  {dps:'追踪多重',niche:'饱和打击', mech:['多重+1','追踪+','饱和多重']},
  cardRain:    {dps:'散射群伤',niche:'天降散射', mech:['数量+','数量+','暴雨']},
  memeCannon:  {dps:'状态弹',niche:'铺状态',     mech:['—','双发','挂全状态']},
  sparkler:    {dps:'灼烧',  niche:'点燃热场',   mech:['—','双发','漫天烟花']},
  candle:      {dps:'灼烧光环',niche:'环绕DoT',  mech:['—','灼烧叠层','烛火爆发']},
  chiller:     {dps:'冰冷AOE',niche:'减速控场',  mech:['减速+','—','冰封眩晕']},
  readFreeze:  {dps:'冰封',  niche:'群体定身',   mech:['—','穿透','已读定身']},
  cringeArc:   {dps:'感电链',niche:'链式电流',   mech:['链+1','跳数+','社死连环']},
  projector:   {dps:'群体感电',niche:'范围电击', mech:['—','跳数+','公开处刑']},
  rumorSpray:  {dps:'毒雾区',niche:'控场DoT',    mech:['领域时长','叠层','瘟疫扩散']},
  hitpiece:    {dps:'中毒+爆',niche:'毒爆双形', mech:['爆炸+','中毒叠层','大字报核爆']},
  drone:       {dps:'召唤射击',niche:'义体召唤', mech:['召唤+1','无人机武装','蜂群']},
  camTurret:   {dps:'自动炮台',niche:'部署炮台', mech:['炮台+1','扫射','包围网']},
  aiCohost:    {dps:'召唤帮唱',niche:'团播召唤', mech:['副播+1','合唱暴击','全息团播']},
  cyberPet:    {dps:'召唤冲撞',niche:'吉祥物召唤',mech:['宠物+1','撕咬','宠物进化']},
  holoArray:   {dps:'伤害领域',niche:'铺地领域', mech:['领域时长','牌阵增幅','全息海洋']},
  dmShield:    {dps:'~接触环',niche:'攻防一体', mech:['格挡击退','反弹连锁','护盾过载']},
  comboDrum:   {dps:'高频连击',niche:'连击攻速', mech:['连击扇角','满连击退','全连名场面']},
  autotune:    {dps:'21.3×穿',niche:'精准狙击',  mech:['穿透','对低血必爆','一枪封神']},
  rhythmBaton: {dps:'高频近战',niche:'带节奏',   mech:['连段','破防','全场节奏']},
  signLS:{dps:'成长单体',niche:'招牌·攻速流',mech:['多重+1','追踪+','弹幕墙']},
  signLD:{dps:'震慑炸弹',niche:'招牌·震慑',  mech:['爆炸+','眩晕','大爆炸']},
  signHS:{dps:'近战核爆',niche:'招牌·重核',  mech:['强击退','眩晕','落地连锁']},
  signHD:{dps:'推进音墙',niche:'招牌·碾压',  mech:['击退','连锁','强击退']},
};
/* 能力值内部 key → 偶像化中文名（scales/面板展示） */
const STAT_NAME={maxhp:'心态上限',regen:'心态回复',lifesteal:'回魂',dmg:'魅力',dmgMelee:'近台魅力',dmgRanged:'远台魅力',
  dmgElem:'应援共鸣',engi:'义体改装',aspd:'手速',crit:'暴击率',range:'存在感',armor:'抗压',dodge:'临场',speed:'舞步',
  luck:'玄学',harvest:'恰饭',multishot:'多重',pickup:'吸引力'};
function scalesTxt(d){const sc=d.scales||{};return Object.keys(sc).map(k=>(STAT_NAME[k]||k)+(sc[k]!==1?'×'+sc[k]:'')).join(' / ')||'魅力';}
const CLS_NAME={A:'属性件',B:'机制件',C:'触发件',D:'光环件',E:'双刃件'};
let _ITEM_IDX=null;
function itemById(id){if(!_ITEM_IDX){_ITEM_IDX={};for(const it of ITEMS)_ITEM_IDX[it.id]=it;}return _ITEM_IDX[id];}

/* ---- 道具体系 v0.3（六分类 schema，§4.1/§4.6）----
   字段: rarity(1路人/2热评/3榜一/4封神) ｜ cls(类) ｜ mods(层1面板) ｜ flags(层3机制位)
   ｜ hidden(层2隐藏值) ｜ trig(系统B触发){on,fn,args,icd,...} ｜ drawback(双刃代价) ｜ set(套装标签) ｜ req(流派限定) */
const RARITY_NAME=['','路人安利','热评推荐','榜一钦点','封神'], RARITY_COL=['','#9aa0b0','#5ad8a0','#ffb84a','#ff7bc1'];
const ITEMS=[
  /* A·属性件（地基，~30%） */
  {id:'drink', cls:'A',rarity:1,name:'能量饮料',  desc:'手速 +8%',        price:26, mods:{aspd:.08}},
  {id:'filter',cls:'A',rarity:1,name:'美颜滤镜',  desc:'临场(闪避) +5%',  price:28, mods:{dodge:.05}},
  {id:'sound', cls:'A',rarity:1,name:'声卡',      desc:'魅力 +8%',        price:30, mods:{dmg:.08}},
  {id:'light', cls:'A',rarity:1,name:'补光灯',    desc:'存在感(范围) +10%',price:24, mods:{range:.10}},
  {id:'gym',   cls:'A',rarity:1,name:'健身环',    desc:'近台魅力 +12%',   price:30, mods:{dmgMelee:.12}, set:'应援团'},
  {id:'lens',  cls:'A',rarity:1,name:'长焦镜头',  desc:'远台魅力 +12%',   price:30, mods:{dmgRanged:.12}},
  {id:'warmer',cls:'A',rarity:2,name:'暖手宝',    desc:'应援共鸣(状态伤) +14%',price:34, mods:{dmgElem:.14}},
  {id:'battery',cls:'A',rarity:2,name:'义体电池', desc:'义体改装 +15%',   price:36, mods:{engi:.15}, set:'义体矩阵'},
  {id:'spray', cls:'A',rarity:1,name:'止汗喷雾',  desc:'抗压(护甲) +2',   price:32, mods:{armor:2}},
  {id:'assist',cls:'A',rarity:2,name:'贴心助理',  desc:'心态回复 +0.6/s', price:40, mods:{regen:.6}},
  {id:'lottery',cls:'A',rarity:1,name:'转发抽奖', desc:'玄学 +12%',       price:22, mods:{luck:.12}},
  {id:'biz',   cls:'A',rarity:1,name:'商务对接',  desc:'恰饭 +3（波末打赏）',price:24, mods:{harvest:3}},
  {id:'banner',cls:'A',rarity:1,name:'应援手幅',  desc:'心态上限 +15',    price:30, mods:{maxhp:15}, set:'应援团'},
  {id:'lozenge',cls:'A',rarity:2,name:'护嗓含片', desc:'回魂(吸血) +4%',  price:34, mods:{lifesteal:.04}},
  {id:'script',cls:'A',rarity:1,name:'剧本台词卡',desc:'暴击率 +6%',      price:28, mods:{crit:.06}},
  {id:'magnet',cls:'A',rarity:1,name:'吸粉体质',  desc:'拾取范围 +40',    price:20, hidden:{pickup:40}},
  /* B·机制件（改行为，~20%） */
  {id:'mBounce',cls:'B',rarity:2,name:'弹幕跳弹', desc:'子弹弹射 +1（打到一个弹下一个）',price:46, flags:{bounce:1}, tags:['bounce']},
  {id:'mPierce',cls:'B',rarity:2,name:'连麦穿透', desc:'穿透 +1',         price:44, flags:{pierce:1}, tags:['pierce']},
  {id:'mMulti', cls:'B',rarity:3,name:'双押Feat.',desc:'多重射弹 +1',     price:58, flags:{multishot:1}, tags:['multishot']},
  {id:'mSplit', cls:'B',rarity:3,name:'切片传播', desc:'子弹消失裂成 2 小弹',price:52, flags:{split:2}, tags:['split'], set:'黑红营销'},
  {id:'mBoom',  cls:'B',rarity:2,name:'回旋镖话题',desc:'子弹往返（回旋）',price:42, flags:{boomerang:1}},
  {id:'mHoming',cls:'B',rarity:2,name:'自动锁定', desc:'子弹追踪 +0.3',   price:40, flags:{homing:.3}},
  {id:'mOrbit', cls:'B',rarity:2,name:'环绕应援', desc:'环绕弹体 +1',     price:44, flags:{orbit:1}, set:'应援团'},
  {id:'mExplode',cls:'B',rarity:3,name:'名场面爆点',desc:'击杀时小范围爆炸(40%)',price:56, flags:{explode:{r:60,dmg:.40}}, tags:['explode']},
  {id:'mChain', cls:'B',rarity:3,name:'短路连麦', desc:'命中后连锁 +2 目标',price:54, flags:{chain:2}, tags:['chain'], set:'义体矩阵'},
  /* C·触发件（事件回调，质变，~20%） */
  {id:'tHighlight',cls:'C',rarity:3,name:'高光剪辑', desc:'暴击时小范围爆炸（吃应援共鸣）',price:54, trig:{on:'onCrit',fn:'explode',icd:.4,args:{r:54,dmg:.5}}},
  {id:'tBrave', cls:'C',rarity:2,name:'越战越勇',  desc:'本波击杀 +1.5%魅力(上限45%,波末清零)',price:46, trig:{on:'onKill',fn:'dmgStack',args:{per:.015,cap:.45,clear:1}}},
  {id:'tEndless',cls:'C',rarity:4,name:'不灭热度', desc:'击杀永久+0.5%魅力(每+20%后增幅递减)',price:80, trig:{on:'onKill',fn:'permaStack',args:{per:.005}}},
  {id:'tSave',  cls:'C',rarity:3,name:'临危救场',  desc:'闪避后1.5s移速+25%且下一击必暴',price:48, trig:{on:'onDodge',fn:'saveBuff',icd:1.0}},
  {id:'tShield',cls:'C',rarity:3,name:'控评护盾',  desc:'受击30%获1层吸收护盾(5s)',price:50, trig:{on:'onHurt',fn:'shield',icd:5,args:{p:.3}}},
  {id:'tRed',   cls:'C',rarity:1,name:'开播红包',  desc:'开波 +20 打赏',  price:30, trig:{on:'onWaveStart',fn:'gold',args:{v:20}}},
  {id:'tLvHeal',cls:'C',rarity:2,name:'涨粉回血',  desc:'升级回 +8 心态',  price:34, trig:{on:'onLevelUp',fn:'heal',args:{v:8}}},
  {id:'tGift',  cls:'C',rarity:2,name:'礼物转化',  desc:'每收50打赏，下次攻击+30%伤害',price:42, trig:{on:'onGold',fn:'nextHit',args:{need:50,bonus:.30}}},
  {id:'tProc',  cls:'C',rarity:3,name:'定时整活',  desc:'每5秒在最近敌群引爆魅惑波',price:52, trig:{on:'onProc',fn:'procNova',args:{r:90,dmg:1.0}}},
  /* D·光环件（~8%） */
  {id:'aSlow',  cls:'D',rarity:2,name:'气场全开',  desc:'周围敌人减速15%',  price:44, flags:{aura:{type:'slow',r:120,val:.15}}},
  {id:'aDot',   cls:'D',rarity:3,name:'香氛领域',  desc:'周围敌人持续掉血(吃义体/应援共鸣)',price:50, flags:{aura:{type:'dot',r:90,val:6}}, set:'义体矩阵'},
  {id:'aThorn', cls:'D',rarity:2,name:'生人勿近',  desc:'贴脸敌人受反伤',    price:42, flags:{aura:{type:'thorn',r:34,val:8}}, req:'H'},
  /* E·双刃件（强增益+流派相关代价，~12%） */
  {id:'eMkt',   cls:'E',rarity:2,name:'营销号',    desc:'人气 +25%，但每波招黑粉',price:34, mods:{xp:.25}, drawback:{hater:1}, set:'黑红营销'},
  {id:'eBlack', cls:'E',rarity:3,name:'黑红出位',  desc:'魅力 +25%，心态上限 -15',price:40, mods:{dmg:.25,maxhp:-15}, set:'黑红营销'},
  {id:'eOver',  cls:'E',rarity:3,name:'义体超频',  desc:'远台魅力+30%、手速+15%，心态上限锁定不可升',price:46, mods:{dmgRanged:.30,aspd:.15}, drawback:{hpLock:1}, set:'义体矩阵'},
  {id:'eSymb',  cls:'E',rarity:3,name:'共生菌株',  desc:'回复+1.5/s、无伤回复翻倍；回魂归零+受状态伤+20%',price:44, mods:{regen:1.5}, drawback:{noLifesteal:1,statusVuln:.2}},
  {id:'eMoney', cls:'E',rarity:2,name:'钞能力',    desc:'打赏+30%、打赏转永久伤害；商店价+15%',price:42, mods:{gold:.30}, drawback:{price:.15}},
  {id:'eRevive',cls:'E',rarity:4,name:'不放弃的人',desc:'心态归零回满50%清屏(每局1次)；心态上限×0.8',price:60, drawback:{revive:1,hpScale:.8}},
  {id:'eAllin', cls:'E',rarity:3,name:'玄学ALLIN', desc:'玄学+50%、稀有出现率提升；商店价+12%',price:40, mods:{luck:.50}, drawback:{price:.12}},
  /* ===== v0.3.4 道具扩展库（§6 协同簇 · 神话 6.6 暂不实现）===== */
  /* 6.1 状态协同簇 */
  {id:'oilFire',   cls:'C',rarity:2,name:'火上浇油',  desc:'灼烧中的敌人被击杀→爆炸引燃周围(半径内挂灼烧)',price:46, trig:{on:'onKill',fn:'burnExec',icd:.5,args:{r:80}}, tags:['burn']},
  {id:'coldSnap',  cls:'B',rarity:2,name:'趁你冷场',  desc:'对冰冷/冰封中的敌人伤害+30%',price:44, flags:{coldSnap:1}, tags:['chill']},
  {id:'cringeChain',cls:'C',rarity:2,name:'社死连锁', desc:'感电敌死亡→向最近2敌传染感电；感电跳数+1',price:48, flags:{shockJump:1}, trig:{on:'onKill',fn:'shockSpread',args:{}}, tags:['shock']},
  {id:'dramaLord', cls:'B',rarity:2,name:'节奏带师',  desc:'中毒层数越高，该敌受暴击伤害越高(每层+4%,上限+40%)',price:46, flags:{dramaLord:1}, tags:['poison']},
  {id:'meltdown',  cls:'C',rarity:4,name:'综合社死现场',desc:'敌人同时≥3种状态→大型社死爆炸+各状态延长(ICD2s)',price:66, trig:{on:'onHit',fn:'meltdown',icd:2.0,args:{r:90}}, tags:['burn','shock','poison']},
  {id:'resonator', cls:'B',rarity:2,name:'状态共鸣器',desc:'造成任一状态时25%额外附加另一随机状态(铺状态,不吃共鸣)',price:50, flags:{resonator:1}},
  /* 6.2 机制放大簇 */
  {id:'ricochet',  cls:'B',rarity:2,name:'弹无虚发',  desc:'每弹射1次，该子弹下一段伤害+10%(抵消递减)',price:48, flags:{ricochet:1}, tags:['bounce']},
  {id:'splitMore', cls:'B',rarity:2,name:'一传十',    desc:'分裂小弹也挂状态/触发onHit；分裂+1',price:48, flags:{split:1,splitMore:1}, tags:['split']},
  {id:'chainWide', cls:'B',rarity:2,name:'人传人',    desc:'链式每跳范围+15%，链锁+1',price:46, flags:{chain:1,chainWide:.15}, tags:['chain']},
  {id:'multiCam',  cls:'B',rarity:2,name:'多机位直播',desc:'多重的额外子弹自动锁定不同目标',price:50, flags:{multishot:1,multiCam:1}, tags:['multishot']},
  {id:'boomEcon',  cls:'B',rarity:2,name:'回旋经济学',desc:'回旋类武器返程命中+50%伤害且回打赏',price:44, flags:{boomEcon:1}},
  /* 6.3 召唤协同簇 */
  {id:'legion',    cls:'C',rarity:2,name:'分身军团',  desc:'召唤物上限+1，召唤物伤害+10%',price:50, flags:{summonN:1,legion:.10}, set:'义体矩阵'},
  {id:'captain',   cls:'C',rarity:2,name:'应援团长',  desc:'召唤物每次攻击10%概率回1心态',price:48, flags:{captain:1}},
  {id:'automation',cls:'C',rarity:4,name:'自动化营业',desc:'主动技/召唤CD-25%，召唤物攻击附带你的状态',price:64, flags:{automation:1}, set:'义体矩阵'},
  /* 6.4 暴击协同簇 */
  {id:'highlightReap',cls:'C',rarity:2,name:'名场面收割',desc:'暴击击杀→回1心态+下击暴伤+15%(主动技返0.5sCD)',price:48, flags:{highlightReap:1}, tags:['crit']},
  {id:'spotlightMoment',cls:'C',rarity:2,name:'高光时刻',desc:'暴击叠高光层，满8层下击范围爆发',price:50, flags:{spotlight:1}, tags:['crit']},
  {id:'heartHarvest',cls:'C',rarity:4,name:'心动收割机',desc:'心动(易伤)敌被暴击击杀→传给最近3敌并溅射',price:66, flags:{heartHarvest:1}, tags:['crit']},
  /* 6.5 经济×战斗协同簇 */
  {id:'cashReaction',cls:'C',rarity:2,name:'钞能力反应',desc:'每在商店花100打赏，下波全武器伤害+8%(波末清)',price:46, flags:{cashReaction:1}},
  {id:'topFanGuard',cls:'C',rarity:2,name:'榜一守护', desc:'收到礼物/打赏雨时获1层吸收护盾',price:48, flags:{topFanGuard:1}},
  {id:'compound',  cls:'C',rarity:4,name:'数据复利',  desc:'每累计500打赏永久+2%全伤(衰减,硬封顶+50%)',price:64, trig:{on:'onGold',fn:'compound',args:{}}},
];

/* ---- 套装（标签阈值触发，§4.4）---- */
const SETS={
  '应援团':{n:3, desc:'人气与打赏 +10%，开波额外友军应援棒', apply:a=>{a.xp=(a.xp||0)+.10;a.gold=(a.gold||0)+.10;a.cheerAlly=1;}},
  '义体矩阵':{n:3, desc:'科技/义体武器 +12%，闪光眩晕时长 +50%', apply:a=>{a.engi=(a.engi||0)+.12;a.dmgElem=(a.dmgElem||0)+.06;}},
  '黑红营销':{n:3, desc:'黑粉给三倍打赏，黑粉死亡爆炸', apply:a=>{a.haterGold=3;a.haterBoom=1;}},
};

/* ---- 升级（涨粉里程碑，覆盖新能力值）---- */
const UPGRADES=[
  {name:'声压提升',desc:'魅力 +6%',     mod:{dmg:.06}},
  {name:'近台魅力',desc:'近台魅力 +9%', mod:{dmgMelee:.09}},
  {name:'远台魅力',desc:'远台魅力 +9%', mod:{dmgRanged:.09}},
  {name:'应援共鸣',desc:'状态伤害 +10%',mod:{dmgElem:.10}},
  {name:'手速练习',desc:'手速 +6%',     mod:{aspd:.06}},
  {name:'心理建设',desc:'心态上限 +8',  mod:{maxhp:8}},
  {name:'舞步训练',desc:'舞步(移速) +5%',mod:{speed:.05}},
  {name:'整活天赋',desc:'暴击率 +4%',   mod:{crit:.04}},
  {name:'临场反应',desc:'临场(闪避) +3%',mod:{dodge:.03}},
  {name:'存在感',  desc:'存在感(范围) +8%',mod:{range:.08}},
  {name:'自我调节',desc:'心态回复 +0.3/s',mod:{regen:.3}},
  {name:'话题体质',desc:'人气 +8%',     mod:{xp:.08}},
  {name:'恰饭技巧',desc:'打赏 +8%',     mod:{gold:.08}},
  {name:'义体调校',desc:'义体改装 +10%',mod:{engi:.10}},
];

/* ---- 5 次改造 ---- */
const MODS=[
  {wave:3,  no:'①', title:'体型重塑',
   a:{k:'L',name:'轻盈系',sub:'纳米抽脂',desc:'移速 +15% ｜ 闪避 +10% ｜ 最大心态 -15%',tag:'敏捷流'},
   b:{k:'H',name:'重核系',sub:'脂肪转肌',desc:'最大心态 +20% ｜ 近战伤害 +15% ｜ 移速 -8%',tag:'坦克流'}},
  {wave:7,  no:'②', title:'声带置换',
   a:{k:'S',name:'甜嗓',sub:'高音糖嗓',desc:'攻速 +10% ｜ 单体武器伤害 +15%',tag:'攻速/单点'},
   b:{k:'D',name:'磁嗓',sub:'低音烟嗓',desc:'范围 +15% ｜ 击倒10%概率震慑周围观众',tag:'范围/控制'}},
  {wave:11, no:'③', title:'外观哲学',
   a:{k:'C',name:'义体系',sub:'机械外露·霓虹纹路',desc:'科技系武器伤害 +20% ｜ 商店出现义体改装件',tag:'科技/爆发流'},
   b:{k:'B',name:'生体系',sub:'完美仿生·自然无痕',desc:'心态回复 +1/s ｜ 人气获取 +10% ｜ 无伤波次额外奖励',tag:'回复/成长流'}},
  {wave:15, no:'④', title:'气质核心',
   a:{k:'Y',name:'元气',sub:'阳光活泼',desc:'连续击倒叠「气氛热度」：攻速最高 +30%，受击清零',tag:'连击流'},
   b:{k:'N',name:'冷艳',sub:'神秘清冷',desc:'暴击率 +10% ｜ 暴击使观众「心动」：受到伤害 +20%',tag:'暴击流'}},
  {wave:18, no:'⑤', title:'出道定位',
   a:{k:'P',name:'舞台型',sub:'歌舞中心',desc:'解锁主动技「开场表演」：清屏级魅力冲击（空格释放）',tag:'主动技'},
   b:{k:'T',name:'互动型',sub:'直播女王',desc:'打赏获取 +25% ｜ 弹幕会概率投喂小额打赏',tag:'经济引擎'}},
];

/* ---- 弹幕系统 ----
   正面评论 = 击倒小怪（吸引到一名观众）时触发；
   负面评论 = 自动出现，随改造阶段(0→5)逐级减少，第五次改造后归零；
   DM_CHAR = 每个最终形态的专属评论。*/
const DM_USERS=['观众114514','糖分依存症','夜行性熊猫','赛博和尚','贴贴怪','白嫖之神','键盘侠本侠','路过的大叔','奶茶三分糖','闪光灯过敏','纸片人老婆','蹲一个回放','加密通话','凌晨四点半','打工人摸鱼中','电子榨菜','秃头警告','momo','想睡觉的鱼','榜一候选人','24K纯白嫖','弹幕保安','显卡在燃烧','一坨数据','三体观察员','薛定谔的猫娘','已读乱回','破防大师','二次元浓度超标','咖啡因依赖','末班地铁','我是工具人','键政退役','赛博菩萨','音游手残','社恐之王','早八人','上头了别拉我','单押选手','野生剪辑师','此用户已升天','糖醋里脊','凌晨蹲点','屏幕保护','量子波动','吃瓜前排','热知识','正在加载','低电量焦虑','复读机本体','摆烂大师','潜水冠军','打钱预备役','晚安人','梦女预备','显示器故障'];
/* 正面（被吸引/好评，6 个阶段语气递进） */
const DM_POS=[
  ['诶？居然有点上头','草我怎么看进去了','这抠脚样莫名解压','大叔你别说还挺敢','就冲这自信我蹲了','肥宅快乐懂的都懂','这房间我熟，亲切了','莫名想点个关注','离谱但我想看下去','大叔加油啊（认真）','有内味儿了','笑着笑着关注了','梦想无罪，蹲了','这真实感绝了','偷偷点了个赞','土到极致就是潮','成功引起我注意','下饭直播实锤','我无言以对但没退','图一乐三连了','勇气可嘉啊老哥','这心态我服'],
  ['诶真瘦了点？','看到努力了哦','身材管理初见成效','比上次顺眼多了','坚持住大叔！','这波我给过','进步看得见','有在认真改造啊','加油，看好你','咦有点不一样了','努力的人最帅','蹲个后续，真的','改造诊所质量在线','势头不错继续','汗都没白流','给变化点赞','认真起来还行嘛','期待值拉满了','这一步迈得可以','哟，知道收拾了'],
  ['这声音和脸的反差能笑一年','妈呀好萌的声音','我耳朵恋爱了','闭眼听简直神仙','求原声！太可爱','声优级别的嗓子','就冲这声音关注了','反差萌直接杀我','这嗓子有点东西啊','救命怎么这么甜','声音好评！脸…也行','一开口我就破防','这脸和声的cp感','上头了上头了','反差感拉满好评','听一次就戒不掉','这嗓音单独能出道','笑中带泪但没退','建议闭眼听','声控狂喜'],
  ['卧槽变好看了','这脸我可以','路转粉预定','终于像个偶像了','底子是真不错','改造诊所牛逼','有那味儿了','等等这真同一人？','颜值在线啊','开始心动了','这质变绝了','蹲到宝了','妈呀越来越能打','可以可以很可以','颜回来了','这下真有偶像样','好看！没有别的词','我提前占前排','要起飞了这是','官宣一下吧'],
  ['气质绝了','完全是偶像了','我家爱豆？！','美得很高级','颜值打钱不亏','无可挑剔','天生爱豆胚子','这气场我可以','一颦一笑都是戏','彻底沦陷了','这就是神颜','单推稳了','气质碾压全场','谁懂啊我哭','顶配偶像预定','这一眼万年','已经在准备应援','她真的太美了','破防了好美','申请出战她的颜粉'],
  ['出道吧！！','永远的神','DD不动了单推了','这是我老婆','光看着就幸福','封神现场','应援都备好了','这就是顶流','一路看过来的我哭了','她做到了！','打钱！必须打钱','梦想成真的瞬间','名场面诞生','我见证了历史','全场最靓','这才是偶像','爱了一辈子','谢谢你没放弃','后巷走出来的光','值得所有掌声','泪目，从400斤到现在','这一刻封神'],
];
/* 负面（自动出现，阶段越高越少；第六项=出道后=无）。样本量大，0 改最多。 */
const DM_NEG=[
  // 0 改 — 人见人骂
  ['下播吧大叔','辣眼睛','求别播了','这房间隔屏都有味','400斤也配做idol？','退钱！我的眼睛','笑死，做梦呢','大型社死现场','污染我首页了','建议直接退网','背心绷不住了哥','这肚子能当鼓敲','谁推给我的快撤','举报已发送','劝你认清现实','油腻到反胃','别糟蹋idol俩字','救命我刷到了啥','三十年白活实锤','看一眼少活十年','传说中的抠脚大汉','屏幕都被你熏黄了','键盘缝能种蘑菇了','离我远点别传送过来','减肥俩字不会写？','梦想？先把澡洗了','你对得起摄像头吗','劝退劝退劝退','我奶奶都比你像偶像','这状态还想出道？','建议回炉重造','人类高质量反面教材','观感堪比生化危机','别动我怕你那身肉抖','这房间能报警吗','一股泡面混脚汗味','工地大叔走错片场','妈见打系列','取关了，恶心','求求你穿件衣服','直播事故现场','看完想去洗眼睛','这也敢播心是真大','满屏幕的油','键盘上是昨天的饭吧'],
  // 1 改 — 瘦了点但仍被嘲
  ['就这？','瘦了也没用还是丑','白费功夫','别挣扎了大叔','差得远呢','换汤不换药','这也好意思晒','努力方向错了','照样没人看','治标不治本','减了个寂寞','底子在那摆着','别自我感动','还是劝退','虚假的进步','瘦下来更显老了','这点变化也发？','努力是努力可惜没用','原地踏步罢了','感动的只有你自己','离idol差一个银河','别报太大期望','也就比上次少塌一点','马甲线是画的吧','三天打鱼实锤','减肥失败案例','就这进度等猴年','还是那个味儿','勉强不算辣眼','别飘，还早得很'],
  // 2 改 — 声音好脸不行/诈骗
  ['脸还是没救','声音是变声器吧','诈骗！照骗！','睁眼瞎才说好看','猎奇区是吧','听着甜看着苦','别开口求你了','一张嘴出戏','买的声卡吧','这脸配这音违和','别骗自己了','也就声音能听','闭眼天使睁眼事故','音画不同步本步','声优捏脸失败','声音诈骗现场','建议只放音频','脸拖后腿了','这反差血压上来了','照骗+音骗双重暴击','声音再好救不了脸','听完想给脸退货','整容前别开播','只听声音我能投币'],
  // 3 改 — 像偶像了但酸/质疑（开始变少）
  ['整容脸','假面具罢了','也就那样吧','滤镜开太狠','卸了妆呢？','装什么偶像','底子还是大叔','换张皮就飘','照骗实锤','科技与狠活','医美怪','这脸保质期多久','滤镜一关原形毕露','根子没变别得意','工业糖精脸','量产网红脸','也就网图水平','装纯没意思'],
  // 4 改 — 几乎只剩零星酸言（罕见）
  ['酸了（阴阳）','再装啊继续','也没多好看吧','气质是装的吧','营销号别吹了','就你们吹得动','清醒点都是滤镜','酸民最后的倔强','捧那么高不怕摔','我就不夸','嫉妒使我面目全非'],
  // 5 改 — 出道后无负面
  [],
];
/* 每个最终形态的专属评论（出道形态触发） */
const DM_CHAR={
  LSCYP:['全息翅膀好闪！','电音一响DNA动了','翅膀给我也来一对','发光纹路太美了'],
  LSCYT:['收到你的电波了！','猫耳耳机绝绝子','整活女王上线','弹幕护体冲鸭'],
  LSCNP:['人偶感拉满好评','这洋装能看一年','陶瓷质感绝了','哥特公主殿下'],
  LSCNT:['到底是AI还是人？','被毒舌了但很爽','这低温感上头','谜语解不开但爱了'],
  LSBYP:['初恋脸实锤','王道正统天花板','纯到发光','出道曲已单曲循环'],
  LSBYT:['全网妹妹本妹','下播来你这吃饭','邻家感绝了','妹妹我来啦'],
  LSBNP:['这高音透明感','冷到起鸡皮（褒）','冰山美人yyds','清冷神颜'],
  LSBNT:['读诗的声音好催眠','文艺感拿捏了','深夜emo首选','这嗓音治愈'],
  LDCYP:['小个子能量爆炸','台风炸裂！','rap杀疯了','气场不输大个子'],
  LDCYT:['哈哈哈又整活','这脑洞我服','沙雕又有才','笑不活了'],
  LDCNP:['低音震到地板','赛博小恶魔本魔','这氛围绝了','低音炮战神'],
  LDCNT:['快戴耳机！','这ASMR上头','耳朵怀孕了','听一次戒不掉'],
  LDBYP:['她比男人帅','女友粉狂喜','王子我可以','被帅晕了'],
  LDBYT:['这陪伴感','像青梅竹马的姐姐','被治愈到了','姐姐我可以吗'],
  LDBNP:['小酒馆氛围感','慵懒爵士绝了','这唱腔醉了','复古麦太配了'],
  LDBNT:['今天也辛苦了呜呜','丧但被治愈','深夜陪伴感拉满','听着听着哭了'],
  HSCYP:['应援被点燃了！','力量型元气','彩球甩起来','这能量管够'],
  HSCYT:['跟练了！','再来一组哦☆','这身材自律的','腹肌给我看看'],
  HSCNP:['战姬下凡','机械翼太帅','圣女声线绝','工业与神性并存'],
  HSCNT:['想被她保护','冷面反差杀','这气场守护我','保镖我可以'],
  HSBYP:['夏天的感觉','阳光治愈系','沙滩女神本神','晒到我了好暖'],
  HSBYT:['干饭吧！','这食量我服','看她吃我也饿了','干饭人狂喜'],
  HSBNP:['T台气场两米八','高岭之花啊','这身段绝了','超模下播了'],
  HSBNT:['请赐我一杯茶','优雅又气场满分','贵气拿捏了','女王陛下'],
  HDCYP:['舞台喷火了！','金属魂燃起来','这riff炸裂','头可以摇起来了'],
  HDCYT:['糙汉魅力（褒）','修机车太帅','这大姐头我磕','上手就是干'],
  HDCNP:['半面具神秘感','赛博歌剧绝美','暗黑美学yyds','魅影现身'],
  HDCNT:['键盘敲得帅','冷静拆解一切','黑客女神','防火墙挡不住歌'],
  HDBYP:['现场嗨翻了','和粉丝称兄道弟','摇滚不死','姐带我飞'],
  HDBYT:['老板娘再来一杯','人生咨询室开课','这烟火气','喝到天亮'],
  HDBNP:['剧场感拉满','艺术品本品','黑天鹅绝美','谢幕都舍不得走'],
  HDBNT:['御姐天花板','深夜电台醉了','这声音太犯规','姐姐再聊会儿'],
};
/* 各阶段负面评论的平均间隔（秒）：0改最密集，3-4级变罕见，出道后归零 */
const NEG_INTERVAL=[1.3,2.2,3.8,8,18,Infinity];
/* 各阶段「击杀→正面评论」的触发概率：0改时罕见(人见人骂)，逐级升至必出 */
const POS_CHANCE=[0.10,0.25,0.45,0.65,0.85,1.0];
const GIFT_NAMES=['火箭×1','游艇×1','为爱发电×99','嘉年华×1','超级火箭×1','跑车×1','城堡×1','privatejet×1','满屏烟花','榜一守护×30天'];

/* ---- 敌人定义 ---- */
const ETYPES={      /* baseHP/baseDMG=波1基准；spawn 时按 §5.1 数量优先公式随波缩放（单体很缓） */
  luren:  {name:'路人观众',  hp:9,  spd:52, dmg:6,  gold:2, xp:1, r:9,  minW:1,  w:10},
  shuijun:{name:'弹幕水军',  hp:5,  spd:80, dmg:4,  gold:1, xp:1, r:7,  minW:3,  w:6},
  penzi:  {name:'喷子',      hp:13, spd:44, dmg:5,  gold:3, xp:2, r:9,  minW:6,  w:5, shooter:1},
  baipiao:{name:'白嫖党',    hp:32, spd:28, dmg:8,  gold:0, xp:3, r:11, minW:9,  w:3},
  duijia: {name:'对家粉丝',  hp:8,  spd:96, dmg:11, gold:2, xp:2, r:8,  minW:12, w:4, bomber:1},
  heifen: {name:'黑粉头目',  hp:130,spd:40, dmg:12, gold:30,xp:18,r:16, elite:1},
  leping: {name:'毒舌乐评人',hp:170,spd:34, dmg:10, gold:35,xp:20,r:15, elite:1, shooter:1},
  /* ---- BOSS 体系（§07 §6）：boss=B1出道Boss；bCritic/bRival/bMatrix/bCensor/bDiva = mini-boss/无尽轮换 ---- */
  boss:   {name:'讨债的诊所老板',  hp:4000,spd:46,dmg:15,gold:200,xp:100,r:24, boss:1, kind:'debt',   tex:'boss'},
  bCritic:{name:'毒舌乐评人·终场Live',hp:2200,spd:42,dmg:13,gold:200,xp:100,r:24, boss:1, kind:'critic', tex:'leping'},
  bRival: {name:'对家当红顶流',    hp:2600,spd:52,dmg:12,gold:200,xp:100,r:24, boss:1, kind:'rival',  tex:'duijia'},
  bMatrix:{name:'流量黑洞·营销号矩阵',hp:2000,spd:38,dmg:10,gold:200,xp:100,r:26, boss:1, kind:'matrix', tex:'shuijun'},
  bCensor:{name:'平台审查官AI',    hp:2400,spd:40,dmg:14,gold:200,xp:100,r:24, boss:1, kind:'censor', tex:'heifen'},
  bDiva:  {name:'过气初代天后',    hp:3000,spd:44,dmg:15,gold:240,xp:120,r:24, boss:1, kind:'diva',   tex:'boss'},
};
const BOSS_KINDS=['boss','bCritic','bRival','bMatrix','bCensor','bDiva'];   // 里程碑轮换（bDiva 波30起入池）
const MINIBOSS_KINDS=['bCritic','bRival','bMatrix','bCensor'];              // 波11-19 mini-boss 池

/* ---- 32 出道宣言 ---- */
const DECLARE={
  LSCYP:'把每一束光，都唱成你的心跳。',      LSCYT:'今晚也要接收我的电波哦☆',
  LSCNP:'上紧发条，为你歌唱至齿轮停转。',    LSCNT:'猜猜我是谁？答案明天直播揭晓。',
  LSBYP:'初恋的感觉，请多指教！',            LSBYT:'回家路上，记得来我直播间吃饭！',
  LSBNP:'冰封的心，只为歌声融化。',          LSBNT:'今夜的诗，读给睡不着的你。',
  LDCYP:'个子小？舞台会替我长高。',          LDCYT:'关注我，快乐不迷路！',
  LDCNP:'让低音，从地板传到你心脏。',        LDCNT:'戴上耳机，你就跑不掉了。',
  LDBYP:'公主们，今晚我来接你们回家。',      LDBYT:'累了就回来，姐一直都在。',
  LDBNP:'夜还长，再来一杯爵士如何？',        LDBNT:'今天也辛苦了，明天再丧吧。',
  HSCYP:'钢铁之躯，为你应援！',              HSCYT:'再来一组哦☆ 不许偷懒！',
  HSCNP:'以装甲为翼，以歌声为刃。',          HSCNT:'站在我身后，没人能伤到你。',
  HSBYP:'把夏天，永远留在舞台上。',          HSBYT:'干饭不积极，思想有问题！',
  HSBNP:'高岭之花，也会为你低头浅笑。',      HSBNT:'下午三点，恭候诸位入席。',
  HDCYP:'点火！今晚烧穿天花板！',            HDCYT:'机车和人生，姐都能给你修好。',
  HDCNP:'面具之下，是你猜不透的咏叹。',      HDCNT:'防火墙再厚，也挡不住我的歌。',
  HDBYP:'兄弟们！最后一排也给我跳起来！',    HDBYT:'人生嘛，一杯酒一首歌就过去了。',
  HDBNP:'于至暗处起舞，至谢幕方休。',        HDBNT:'成年人的深夜，交给我吧。',
};

/* ============ 文案库扩充（文案/弹幕文案库.md）合并进各阶段池 ============ */
[
 ['草这主播什么来头😂','400斤的偶像出道企划？第一次见','抠脚归抠脚，这哥们儿是认真的啊','就冲这股不要脸的劲儿，我点了关注','大叔你图啥啊（but有点上头）','这画面修罗场，但我laugh了','蹲一个改造前后对比','离谱，但我不想走了','三十年的梦？那我陪你看看','笑死，弹幕比节目好看'],
 ['哥们儿你瘦了?!士别三波刮目相看','这肌肉……健身房充钱了是吧','衣服都大了，有点励志啊不是','等等这身材其实可以的?','真就一波一个样是吧','帅了一点点，就一点点（傲娇）','这速度，贷款没白签','身材到位了，脸……脸我们慢慢来'],
 ['等一下😨这个声音从哪儿出来的','大叔脸萝莉音，我天灵盖都掀了','我建议这个声音和这张脸先离个婚','烟嗓配这张脸，意外地……带感??','好家伙，闭眼是女团，睁眼是工地','声音我可以的，我把眼睛闭上','这哪是改造，这是恐怖谷踩钢丝','只想听这一句，值了','声优出道预定（脸先别动）','一开口我天灵盖掀了'],
 ['卧槽这脸??什么神仙下凡','等等魂呢?魂去哪了','脸：满分。坐姿：扣回去了','下一秒主播抠脚，魂还在！魂还在！','美则美矣，总有种说不出的熟悉感','皮肤好绝，但那二郎腿能不能收一收','第一次心动了，虽然不知道该不该','不开口不乱动，真就顶级偶像','长得好看，但好像有点不对劲','截图了，动起来之前能当壁纸'],
 ['这次是真的不一样了','气质完全变了，脱胎换骨啊','突然有点感动?像看自家孩子长大','妈妈我女儿长大了.jpg','一颦一笑都到位了，前面那大叔是谁','她好像真的找到自己了……我不困了','偶尔露出一点旧毛病，反而更可爱','刚那个嫌弃瓜子的表情，绝了😂','从糙汉到她，我全程见证了','这成长线比正剧还上头','守护这个笑容（认真的）'],
 ['出道了！我们的女孩出道了😭','从第一波看到现在，值了','三十年，她做到了','这就是偶像啊，这才是偶像','哭了真的哭了，谁懂啊','榜一必须安排！这个必须充','等了三十年的开口，我们都听到了','妈妈级粉丝报道，看着她长大的','出道曲单曲循环中','后巷走出来的光，谁不爱啊'],
].forEach((a,i)=>DM_POS[i].push(...a));
[
 ['这也配叫偶像?退钱','400斤还做梦呢，醒醒','看一眼血压上来了','求求你别营业了😅','哪个平台审核睡着了','这是我今天看过最离谱的','这岁数该还房贷了不是改造贷','划走了，告辞','救命这是什么地狱画面','你妈喊你回家洗脚'],
 ['瘦了就能当偶像?想得美','练点肌肉就飘了是吧','换汤不换药，脸还在呢','这进度还20波?劝退','一身腱子肉跳女团?我笑了'],
 ['这声音是变声器吧，假唱实锤','脸和声音我只想保留一个','缝合怪出道企划是吧','一开口鸡皮疙瘩落一地','退钱！我要听原声！（原声更可怕）','这违和感能当生化武器'],
 ['不就整了张脸吗（酸了）','我赌他下一秒破功……行吧','花钱买的脸，有本事素颜啊','哼，坐姿出卖了你','还是大叔，装什么清纯（but声音在抖）'],
 ['我竟然找不到吐槽点了','不行我不能输，她肯定还会破功！','（默默关掉了小号）','就、就一点点好看而已啦（嘴硬）','本来是来黑的，怎么有点粉了'],
 [],
].forEach((a,i)=>DM_NEG[i].push(...a));
GIFT_NAMES.push('迟到的掌声👏','一整条街的应援灯💡','看着你长大基金💝','员工内部折扣券🎟️','彩虹屁长评📝');
DM_USERS.push('听了三十年笑话的老同学','楼下抽烟的大姐','诊所小哥(下班了)','前黑粉now榜二','妈妈粉天团','对家事务所(卧底)');
/* 环境弹幕：直播间通用闲聊，持续刷屏填满右栏（与剧情无关、不分阶段） */
const DM_AMBIENT=['前排','蹲','6','666','哈哈哈哈哈','主播好','来了来了','在的在的','+1','awsl','好家伙','栓Q','绝了','蚌埠住了','泪目','整活','活久见','名场面','高能预警','弹幕护体','笑死','妈耶','破防了','典','急了','蹲后续','蹲个回放','考古的扣1','前面让让','这弹幕比节目好看','免费的快乐','电子榨菜+1','下播了喊我','有点东西','上才艺','蹲一个','原来如此','学到了','属实','可以可以','节目效果拉满','这就是后巷吗','人均影帝','演技在线','蹲蹲蹲','摸鱼中','准点打卡','路过看看','被算法推来的','momo路过','第一次来,关注了','弹幕这么少吗大家多发点','热度上来了','在线人数涨了','这波节奏对了','气氛组就位','应援棒准备好了','蹲明天的播','谁懂啊','格局打开','含金量还在上升','后排观众表示看不清','打卡第N天','妈见打但好看','纯路人围观','整个人都精神了','弹幕飘起来啦','我嗑到了','这必须三连','投币了投币了','保护得很好','在线蹲下一个改造','观众老爷们涌进来了'];

/* ============ 改造诊所过场文案（文案/改造诊所过场.md）：key=轴值 → {演出, 照镜[]} ============ */
const MOD_SCENES={
 L:{act:'机器滋啦一声，屏幕上的体重数字像老虎机疯狂往下滚：400…300…180…叮！门开，瘦了三圈的阿源走出来，巨码背心像披了张床单空荡荡地晃。',mirror:['我去……风一吹这衣服跟挂旗似的。','三十年了，我第一次……看见自己的脚。','行，这脚以后归我管了。']},
 H:{act:'机器发出健身房铁块碰撞的哐哐声，阿源的轮廓像吹气球一样横向支棱起来。门开，旧背心被一身腱子肉绷得快爆开，袖口卡在二头肌上。',mirror:['嚯。……这衣服它跟不上我了。','（摆了个pose，被自己帅到一愣）等会儿，这真是我？','（习惯性抠了抠脚）嗯，是我。错不了。']},
 S:{act:'机器叮咚一声像便利店开门音。阿源张嘴试音，飘出来的是清亮的萝莉糖嗓：啊—啊—测试♪。而那张大叔脸，纹丝没动。',mirror:['（糖嗓）大家好呀☆——','（猛地捂嘴，动作还是那么糙）这嗓音？是我？','算了。好像……也蛮可爱的，营业！']},
 D:{act:'机器嗡地一沉像老式音响通电。阿源开口，一把混了三十年江湖气的低音烟嗓滚出来：……喂，试音。脸还是那张脸，声音突然有了故事。',mirror:['（烟嗓）哟，这嗓门可以啊。','听着像我后巷楼下常年蹲着抽烟那位大姐。','行，这味儿我喜欢。糙是糙了点。']},
 C:{act:'一张精致面孔在光里成型，皮肤下透出淡淡的霓虹纹路，呼吸般明暗流动，关节处露出干净利落的义体线条。',mirror:['……卧槽。我这脸还自带氛围灯？','（戳了戳发光的脸颊）高级。是真高级。','（一屁股瘫坐翘起二郎腿）皮是换了……坐姿怎么没跟着换啊。']},
 B:{act:'光散去，一张毫无破绽的天然美人脸，皮肤透着健康的血色，看不出半点改造痕迹。自然到让人忘了这是赛博朋克。',mirror:['这也太……美了。一点机器味儿都没有。','（端详三秒，没忍住张大嘴检查牙）','好家伙，脸是换了张天仙的。吃相我还得练练。']},
 Y:{act:'阿源像被注入了一整个夏天，站姿挺拔，眼睛亮晶晶，转身时裙摆带风，一举一动都自带应援曲BPM。',mirror:['（双手比心，标准得像练了十年）哇哦——大家好呀☆','（甜甜弯起眼睛，越看越满意）','（瞥见椅缝里半包瓜子，皱眉）这谁的？多没形象。嗯！今天的我也超可爱。']},
 N:{act:'阿源的气场唰地沉下来，眼神变得疏离，下巴微抬，转身的弧度优雅又带着距离感，像月光底下的人。',mirror:['……（冷冷瞥了镜子一眼，自己都被自己电到）','（高冷地）霍。还不错。','（转身，瓜子袋哗啦掉地上，弯腰捡）这种东西是我以前喜欢吃的吗？哼，恶心。']},
 P:{act:'聚光灯啪地打下来，一身为舞台而生的演出服上身，亮片随光流动。耳返一戴，前奏起，身体已先于脑子记住了第一个舞步。',mirror:['（看着镜子里那个发着光的偶像，她笑了）……你好啊。','（轻声）我等你，等了好久。','那个被笑了三十年的梦——现在是我的了。走，该上台了。']},
 T:{act:'灯光转成温暖的居家色，一身亲切又有格调的造型上身。面前是直播机位和滚动的弹幕。阿源往主播椅上一坐，姿势出奇地自然。',mirror:['（把麦克风拉到嘴边，甜甜一笑）各位，镜头前的、屏幕后的，晚上好呀。','我啊，等这一天等了好久好久……','我喜欢现在的我。今天起，这间直播间，礼物给我刷起来！！']},
};
/* 改造诊所过场·逐形态台词（文案/改造诊所过场.md v0.3）。按"选完后的完整形态码"查找；缺失回退 MOD_SCENES[方向] */
const CUTSCENES={
 /* ① 体型重塑（身体变、心还是100%大叔） */
 L:{act:'机器滋啦作响，体重数字像老虎机狂滚：400…180…叮！门开，瘦了三圈，旧背心松垮得像披了张床单。',mirror:['我靠……风一吹，衣服跟晾床单似的。','活三十年，头一回看清自己的脚长啥样。','（抹脸咧嘴）行，瘦是瘦了，魂还是这魂，稳的。']},
 H:{act:'机器哐哐如铁块碰撞，阿源横向支棱起来。门开，旧T恤被一身腱子肉绷到快炸，袖口卡在二头肌上。',mirror:['嚯——（袖子刺啦裂开）衣服跟不上我的进度了。','（摆个pose，自己愣住）等等，这真是我？有点猛啊。','（顺手抠了抠脚）嗯，是我，错不了。']},
 /* ② 声带置换（大叔脸+新嗓，只埋第一颗种子） */
 LS:{act:'机器叮咚像便利店开门。试音飘出清亮糖嗓："啊—啊—测试♪"，那张大叔脸纹丝没动。',mirror:['（糖嗓）大家好呀☆——（啪一下捂嘴，动作还是糙得一批）','（糖嗓）这声儿……打我嘴里出来的？退退退——欸，好像还行？','（一拍大腿）咳，买都买了，营业！']},
 LD:{act:'机器嗡地一沉像老音响通电。开口一把江湖烟嗓："……喂，试音。"脸还是那张脸。',mirror:['（烟嗓）哟，这嗓子，带感啊。','跟楼下常年蹲着抽烟那大姐一个味儿——欸，我还真有点上头。','（摆手）行了行了，糙归糙，对味儿就行。']},
 HS:{act:'一身腱子肉，机器叮咚，开口却是甜嗓："大家好呀☆"。声音和块头当场离婚。',mirror:['（甜嗓）大家好呀☆——哈？这是我？？','（看二头肌又摸喉咙）一身腱子肉配这奶音……完了，有点反差萌。','（拍胸口）管它呢，能整活就是好活！']},
 HD:{act:'壮汉配低音烟嗓，试音："……测试。"——全游戏最不违和的一档，因此最好笑。',mirror:['（低音）……测试。嗯，没毛病。','（抱臂环顾）等会儿——这不就我原来那样？这钱花得，开了个寂寞。','（咧嘴）……行吧，稳重，我喜欢。']},
 /* ③ 外观哲学（中性换脸，皮像了魂没像；第一次舍不得卸） */
 LSC:{act:'最贵一档，合同又签一页。星光格外密，门开全场静了一秒。中性少年脸，脸颊透出淡淡光纹，耳后一个小机械接口。',mirror:['我靠……（光纹一闪一闪）这脸还自带补光灯？？','（一屁股瘫下，二郎腿一翘）皮换了，坐姿没跟上，绷不住。','（突然安静）……这张脸，我有点舍不得卸了。怪了哈。']},
 LSB:{act:'光散去，一张干净自然的中性少年脸，普通但顺眼。门口飘来食物香，他下意识凑过去。',mirror:['这脸……太自然了，跟我亲生的似的。','（端起碗就炫饭，嘴角沾米粒）嗯！这吃相，还得练。','（瞟镜子，愣住）……素脸越看越顺眼，离谱。']},
 LDC:{act:'门开，橘发铲青的中性少年，外露机械关节闪着光，护目镜架额头，一身街头痞气。',mirror:['（蹲地叼电子烟）哟，这关节，赛博味儿拉满。','（吐口烟）魂没变，皮换了个狠的。','（难得认真）……镜子里这小子，有点帅。就一点啊，别飘。']},
 LDB:{act:'门开，墨绿乱卷呆毛、半垂困眼的中性少年，瘫得像没骨头。',mirror:['（打哈欠）……改个脸比上班还累，谁懂。','（半阖眼瞟镜子）皮是清爽了，魂还是想躺平。','（勉强睁眼）欸，这脸躺着也好看，加分了。']},
 HSC:{act:'门开，高挑英气的中性少年，珊瑚高马尾，脸颊手臂泛着义体光，孔武有力。',mirror:['（摆个掰手腕架势）嚯，力气还在，脸还顺了！','（拍发光的手臂）皮像偶像了，劲儿还是搬砖的。','（别扭比个心，偷瞄）……这脸，留着吧，是真好看。']},
 HSB:{act:'门开，小麦肤色、阳光棕短发的中性少年，自然爽朗，笑起来大大咧咧。',mirror:['（仰头大笑）哈这脸！敞亮！','（摸脸）魂还是这么咋呼。但这脸笑起来，比以前好太多了。','（不好意思）舍不得卸，真的，绝了。']},
 HDC:{act:'门开，绯红狂野长发、外露义体橙光的中性少年，眼神很冲，手上沾着机油。',mirror:['（单膝跪地拧零件）啧，这义体，够带感。','（抹脸留下一道油）皮换了，手艺没换，还是个修车的命。','（愣住）……这脸配这身改装，绝了。我承认，我心动了。']},
 HDB:{act:'门开，酒红黑长发、半垂冷眼的中性少年，靠坐着翘二郎腿，举着一罐啤酒。',mirror:['（灌口啤酒）……改完了？哦。','（晃罐子）脸冷下来了，气质有点东西。魂嘛，还想再来两罐。','（慢慢放下啤酒）……第一次，不太想把这张脸还回去了。']},
 /* ④ 气质核心（练习生·心态翻转，"她"成本体，旧毛病成想擦掉的过去） */
 LSCY:{act:'细接口啪嗒接上后颈，灯光柔下来。粉色双马尾、脸颊微光的清秀女孩站起身，一举一动自带电音BPM。',mirror:['（对镜比心，零延迟，熟得像练了八百遍）哇——大家好呀☆','（瞥见椅缝半包瓜子，皱眉）……谁的瓜子？搁这儿，多掉价。','（蹦回镜前）嗯！今天的我，也好可爱。没救了。']},
 LSCN:{act:'灯一暗，银白齐刘海、瓷感肌肤、淡紫义体微光的清冷女孩静静立着，像被无形丝线提起的人偶。',mirror:['（半垂眼，无机质地端详镜中自己）……这副容器，及格。','（指尖想够什么——从前叼烟的习惯，停住）这只手以前在干嘛来着？……不记得了。也没必要。']},
 LSBY:{act:'灯光转暖，栗色双麻花辫的女孩眨着大眼睛蹦出来，亲切得像住你隔壁。',mirror:['（对镜甜甜招手）哎嘿~你好呀！','（看见啃一半的饭团，脸一红）……刚那口炫得太狠了，要文气一点啦。','（小口小口）嗯，这样才对嘛。']},
 LSBN:{act:'灯光清冷，冰蓝长直发的女孩半垂着眼，周身像结了一层透明的霜。',mirror:['（对镜呼了口气，看它化成白雾）……原来安静下来，是这种感觉。','（想起从前的大嗓门，蹙眉）那些吵闹，离我挺远了。挺好。','（抬眸，清透）这副样子，我认。']},
 LDCY:{act:'灯光一跳，橘色炸毛、护目镜、琥珀义体光的利落女孩弹起来，街头辣妹味初现。',mirror:['（机能风手势）哟！这身板，带劲！','（想叼烟，摸到护目镜，噗一下笑了）……戒了，那是上辈子的事。','（挑眉）现在这个我，才叫酷。']},
 LDCN:{act:'灯光压暗，深紫波波头略遮眼、戴着大耳机的酷感女孩，指尖搭在耳机上。',mirror:['（半垂眼，低声）……低频，刚好。','（顿了下）以前那个咋咋呼呼的，怎么对都对不上号了。','（扶耳机）这才是我该有的频率。']},
 LDBY:{act:'灯光利落，亚麻短发的英气女孩单手插兜，比了个帅气手势，王子感初现。',mirror:['（对镜勾起嘴角）可以啊，这小子——不对，这位小姐。','（怔了下，坦然一笑）嗯，"小姐"。这称呼，听着舒服。','（潇洒转身）走着，让她们看看什么叫帅。']},
 LDBN:{act:'灯光柔暗，墨绿乱卷呆毛的女孩托着腮，半垂眼带困意，懒洋洋一只猫。',mirror:['（小哈欠）……这张脸，适合发呆。','（摸嘴角找那罐啤酒，没找到，反松口气）算了。清醒着躺平，也挺好。','（蹭蹭头发）这样的我，我喜欢。']},
 HSCY:{act:'灯光一亮，珊瑚高马尾、青色义体臂纹的健美女孩握拳做了个加油姿势，力量型元气满屏。',mirror:['（灿烂一笑，握拳）好——！今天也元气满满！','（想拍桌掰手腕，手停半空，改成比心）……这力气，以后是用来给大家比心的哦。','（甩马尾）放心啦，这个我，罩得住！']},
 HSCN:{act:'灯光清冷，银灰长直、蓝色义体微光的女孩半垂着眼，神圣而疏离，战姬雏形已现。',mirror:['（缓缓抬下巴，声音很静）……庄严。是我要的气场。','（豪迈的笑如今牵不动嘴角，她也不遗憾）喧闹留给过去。我现在，只为高处那个音活着。']},
 HSBY:{act:'灯光洒金，小麦肤色、阳光棕波浪发的女孩张开手臂像迎着海风，活力满满。',mirror:['（大笑，伸懒腰）啊——！浑身舒坦！','（想豪迈拍背，改成阳光招手）……以前那股糙劲儿，得收收喽。','（灿烂）不过这股精气神是真的，这个我，超喜欢！']},
 HSBN:{act:'灯光淡冷，白金长卷、苍白肌肤的女孩半垂眼，超模般的淡漠气场凭空立起。',mirror:['（淡淡一瞥，气场拉满）……还行。距离感，刚刚好。','（轻摇头）那种谁都能凑近的日子，过去了。','（理发）现在的我，得让人仰望。']},
 HDCY:{act:'灯光暴烈，绯红蓬发、橙色义体光的野性女孩咧嘴坏笑，做了个摇滚手势。',mirror:['（比摇滚角，狂笑）哈！这把火，够旺！','（想抹机油，发现指甲干净，又笑了）……糙是改不掉的根儿。但这张脸点上火，才像话。','（甩头发）烧吧，这个我！']},
 HDCN:{act:'灯光幽暗，黑紫长发、发尾透着幽绿义体光的神秘女孩半垂着眼，暗夜气质渐显。',mirror:['（暗光里对镜极轻地笑）……影子，挺适合我。','（从前的市井颓气，如今淬成神秘）喧嚣里那个我，早该埋了。','（指尖抚过脸侧幽光）这才是，真正的我。']},
 HDBY:{act:'灯光暖烈，酒红狼尾长发的豪爽女孩张臂大笑，大姐头气场扑面。',mirror:['（爽朗大笑，作势勾肩）哈哈，这气场，够姐们儿！','（想够那罐啤酒，手一顿，改叉腰）……酒得少喝点了，姐要带粉丝们好好过日子。','（咧嘴）豪还是那个豪，人，是新的我了。']},
 HDBN:{act:'灯光暧昧，黑色长直、淡红唇的女孩半垂着眼，慵懒妩媚但还克制，御姐雏形已成。',mirror:['（缓缓抬眸，声音低稳）……嗯，气韵有了。','（抠脚瘫坐的影子恍如隔世）那个邋遢家伙，我已经认不出了。','（轻抚衣领）现在的我，只往前看。']},
 /* ⑤ 出道宣言（招牌句 + 人设延伸；不再自述身世） */
 LSCYP:{act:'白×全息青露肩短裙上身，背后展开发光全息翅膀，星光打歌特效绽放。',mirror:['（展翅，向镜头飞吻比心）各位——今晚，把你们的屏幕，点成一片星海好不好？☆','翅膀，借你们一双——今晚，谁都可以飞。']},
 LSCYT:{act:'青色oversize卫衣+猫耳耳机（随情绪动），电波爱心特效环绕直播机位。',mirror:['（歪头吐舌比耶）嗨嗨~电波对上了没？对上了今晚就别走啦！','弹幕再刷快一点呀~慢了的话，可是会被我点名的哦？']},
 LSCNP:{act:'黑紫哥特蓬裙、瓷质义体关节、迷你王冠，如被丝线提起的人偶。',mirror:['（机械关节微弯，空灵开嗓）别怕我冷。人偶，也是有心跳的哦。','来，牵起这只手——陪我跳一支，只属于今晚的舞。']},
 LSCNT:{act:'银白扫描线短发、信号天线、深蓝科技连体衣，身旁漂浮问号与数据流。',mirror:['（食指抵唇"嘘"）我是AI，还是真人？——这个谜，留着陪你们慢慢猜。','猜对了没奖励，猜错了……也没有。神秘嘛，本来就不打折的。']},
 LSBYP:{act:'栗色公主切、白×粉泡泡袖打歌裙、腰后大蝴蝶结，花瓣纷飞。',mirror:['（歪头甜笑挥手）初次见面——请，多多关照哦！','我会努力的——努力成为你手机里，舍不得划走的那张脸。']},
 LSBYT:{act:'双麻花辫、奶油色开衫+橘色百褶裙，手里一只鲷鱼烧递向镜头。',mirror:['（笑眯眯递鲷鱼烧）呐，饿不饿？陪我唠会儿嘛~','鲷鱼烧管够，故事也管够。所以呀，别走那么早嘛~']},
 LSBNP:{act:'及腰冰蓝长直发、纯白拖地礼服，雪花飘落，双手交叠胸前。',mirror:['（闭眼，清透高音起）……听好。这是我心里，最干净的那个音。','靠太近，会被冻着的哦。……可你们，还是舍不得移开眼，对吧？']},
 LSBNT:{act:'藏青麻花辫、贝雷帽、圆框眼镜、高领毛衣裙，暖灯下捧着诗集。',mirror:['（轻声）夜深了。我读几行字，陪还醒着的你。','这一页，有点长呢。没关系——反正今晚，你也舍不得睡，对不对？']},
 LDCYP:{act:'橘色铲青头戴麦、橘黑机能外骨骼，光效四射，后仰rap姿势。',mirror:['（单手指镜头，炸裂开麦）Yo——个子小，动静大！后巷出来的，谁敢看不起？','Beat给我拉满！这片舞台多大，今晚我说了算。']},
 LDCYT:{act:'荧光绿丸子头、护目镜、沙雕白T，义体手臂比剪刀手，star特效。',mirror:['（夸张鬼脸）家人们谁懂啊，今天这活儿，整大发了哈哈哈！','笑点管够，泪点不卖——想哭？那是明天的事，今天只准乐！']},
 LDCNP:{act:'紫色莫西干、肩载小音响、深紫开衩长裙，双手下压，地面泛紫色声波。',mirror:['（低头，低音震场）感受到了吗？这低频，是从我骨头缝里长出来的。','再低一点，再沉一点……掉进来的人，我可不负责送出去哦。']},
 LDCNT:{act:'深紫遮眼发帘、声学大耳机、紫黑卫衣，侧脸贴近麦轻声。',mirror:['（气声呢喃）别戴耳机听哦……戴上了，可就戒不掉我了。','左耳，跟你说声晚安。右耳……留着，明晚记得再来听。']},
 LDBYP:{act:'亚麻大背头、白金燕尾礼服，单膝半跪，递出一支玫瑰。',mirror:['（抬眸递玫瑰）这支花，送给今晚每一位——我的公主。','别脸红呀。本殿下对每一位公主，可都是认真的。']},
 LDBYT:{act:'焦糖低侧马尾、奶咖高领毛衣裙，捧着一杯热可可。',mirror:['（温柔看镜头）回来啦？今天累不累？喏，热可可，趁热喝。','慢点喝，烫。……今天又逞强了吧？别瞒我，我看得出来哦。']},
 LDBNP:{act:'墨绿指推波纹、酒红吊带长裙+黑长手套，手扶复古立麦，微闭眼。',mirror:['（慵懒吟唱）这一首，送给所有……深夜还没睡的人。','灯，再调暗一点。这种歌啊……得醉着，才听得懂。']},
 LDBNT:{act:'灰藕乱发呆毛、电台耳麦，裹着毛毯斗篷缩在椅里。',mirror:['（无力却温柔地笑）……今天，也辛苦了啊。','不用回我。就这样，靠着我的声音坐一会儿——也挺好的，对吧。']},
 HSCYP:{act:'珊瑚双马尾、青白机甲啦啦队服，高高跃起，举起一对彩球。',mirror:['（跃起应援）Ready？全场最带劲的应援——我！来！啦！','嗓子喊哑了算我的！你们只管，跟着我一起跳就好！']},
 HSCYT:{act:'玫红高马尾、白毛巾搭肩、运动背心露腹肌，一手举哑铃。',mirror:['（笑着举哑铃）来，跟我一起——再来一组哦☆！','偷懒被我抓到咯？没事——我陪你，练到你不想偷懒为止。']},
 HSCNP:{act:'银发长直、银蓝装甲裙甲、背后机械翼、头顶光环，张翼持麦向天。',mirror:['（展开机械翼，圣女高歌）以这副钢铁之躯起誓——这首歌，唱到天上去。','机翼展开的那一下……记得抬头，看我哦。']},
 HSCNT:{act:'铂金大背头、黑西装领带、战术目镜入耳麦，抱臂护卫站姿。',mirror:['（冷峻看镜头）从今晚起，屏幕那头的你们，我罩着。','站到我身后来。挡在前面的活儿，交给我就行。']},
 HSBYP:{act:'日晒金波浪长发、发间小花、明黄夏裙、小麦肤，迎光转身。',mirror:['（张臂迎光）闻到夏天了没？——是我，把太阳给你们搬来了！','防晒，记得擦哦——不然，会被我晒得满脸通红的。']},
 HSBYT:{act:'锈棕短发、白头带、红白围裙，捧超大饭碗鼓腮干饭竖大拇指。',mirror:['（鼓着腮帮，竖大拇指）唔！好——吃！这碗，炫了！','你那一份也别留着啦！来，坐过来，跟我一起炫！']},
 HSBNP:{act:'中分黑棕及膝长发、黑金鱼尾礼服，T台叉腰侧身，下颌微抬。',mirror:['（超模pose，冷脸甜嗓）看好了——这条T台的尽头，是我。','看够了没有？……没有的话，再多看一眼，我准你了。']},
 HSBNT:{act:'香槟竖卷、迷你礼帽、紫罗兰茶会蓬裙，端红茶优雅翘指。',mirror:['（优雅微笑）请坐。今晚这场茶会，我是主人。','杯子，端稳了哦。失了礼的人，我可是会很优雅地，请出去的。']},
 HDCYP:{act:'绯红鬃毛长发、黑红铆钉皮衣，脚踏音箱，高举火焰漆电吉他嘶吼，舞台喷火。',mirror:['（嘶吼，吉他扫弦）后巷的火，烧到舞台上来了——接得住吗？！','嗓子吼到破音也无所谓——今晚，咱们一起聋！']},
 HDCYT:{act:'锈色碎发、红头巾、脸蹭油渍、橘色工装系腰，一手扳手一手叉腰大笑。',mirror:['（豪爽大笑，亮扳手）来！今天直播间不修车——修人生！','把你那点破事儿往桌上一摊。姐，一件一件给你拧紧喽。']},
 HDCNP:{act:'黑紫侧帘长发、半面铬合金面具、暗紫歌剧拖地长裙（电路光），抚面回眸。',mirror:['（单手抚面具，侧身回眸）面具底下是谁？……这，就是今晚的戏。','想看面具底下的脸？……那得看你今晚，够不够虔诚。']},
 HDCNT:{act:'兜帽下露荧光绿发、暗色连帽风衣，十指悬于发光键盘，绿色代码雨。',mirror:['（冷静回眸，指尖落键）系统已接管。今晚的瓜，由我来拆。','密码，在我面前这俩字……没意义。坐稳，开始了。']},
 HDBYP:{act:'酒红狼尾长发、徽章丹宁马甲+破洞牛仔，握麦比摇滚角狂吼。',mirror:['（比摇滚角）后巷的兄弟姐妹们——今晚，跟我一起炸！','前排的别矜持，后排的我看见你了——都给我蹦起来！']},
 HDBYT:{act:'深棕盘发插金簪、藏蓝和服+白围裙，举小酒杯爽朗招呼。',mirror:['（举杯招呼）哎来啦！坐坐坐，今天想唠点啥，姐都听着。','酒管够，话也管够。今晚，谁都不准板着脸走出这扇门。']},
 HDBNP:{act:'墨黑芭蕾盘髻、纯黑羽毛短裙礼服+黑长手套，踮脚单臂上扬起舞。',mirror:['（如黑天鹅起舞，凄美）这支舞，献给所有在黑暗里没停下脚的人。','灯灭了也别怕。我的舞，在最暗的地方，才最好看。']},
 HDBNT:{act:'单侧好莱坞波浪长发、暗红丝绒开衩长裙+白披肩，斜倚举威士忌半垂眼。',mirror:['（慵懒浅笑，晃杯）夜还长。陪我，把这杯喝完再走？','急什么呢。好的夜晚啊……本来就该，慢慢地醉。']},
};

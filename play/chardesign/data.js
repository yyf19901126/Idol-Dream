/* ============ 角色数据 ============ */
const C={pink:'#ff7bc1',cyan:'#4ad8ff',purple:'#9b6bff',red:'#ff5a5a'};
const SKIN={idol:'#ffdcc6',pale:'#ffeee2',tan:'#eda06c'};
const PIN={S:'#ff5fb0',D:'#9b6bff'};

const STAGES=[];

/* STAGE 0 */
STAGES.push({title:'STAGE 0 · 原点',sub:'1 形态',
 desc:'400 斤后巷肥宅·阿源。背心盖不住肚子、灰短裤、人字拖、胡茬、谢顶、汗滴。超高心态值+龟速，本身就是个梗角色。',
 cards:[{code:'0',name:'阿源（原点）',note:'邋遢版「潜水员戴夫」：旧潜水服+护目镜，梦想是 idol',kind:'fat',sweat:1,accent:'#3a8aa8'}]});

/* STAGE ① */
STAGES.push({title:'STAGE ① · 体型重塑（波3后）',sub:'2 形态 · L 轻盈 / H 重核',
 desc:'体型变了，但还是大叔脸大叔声。L 的衣服大了几号松松垮垮；H 的旧T恤被肌肉撑紧。',
 cards:[
  {code:'L',name:'瘦身大叔',note:'纳米抽脂：瘦了，潜水服松垮垮挂在身上',kind:'slim',accent:'#7ad07a'},
  {code:'H',name:'猛男大叔',note:'脂肪转肌：潜水服褪到腰间，露出腱子肉',kind:'buff',accent:'#ffaa4a'},
 ]});

/* STAGE ② —— 声音变了之后，大叔开始「进入状态」，行头跟着分化 */
STAGES.push({title:'STAGE ② · 声带置换（波7后）',sub:'4 形态 · S 甜嗓 / D 磁嗓',
 desc:'全游戏喜剧巅峰：大叔脸+少女音。声音变了之后大叔开始自我入戏——S 系戴上粉头带换应援T恤练星星眼；D 系搞来皮夹克把墨镜架上额头。气泡颜色=声线。',
 cards:[
  {code:'L-S',name:'萝莉音大叔',note:'小个子大叔开口是糖嗓，还做了应援打歌服',kind:'slim',top:'#ffd2e4',star:1,heart:1,band:1,smile:1,bubble:'#ff5fb0',accent:C.pink},
  {code:'L-D',name:'烟嗓小钢炮',note:'像混了三十年的大姐头（还是大叔脸）',kind:'slim',top:'#4a4452',jacket:1,shade:1,bubble:'#7a5aff',accent:C.purple},
  {code:'H-S',name:'甜嗓猛男',note:'一身腱子肉，开口「大家好呀☆」',kind:'buff',top:'#ffd2e4',star:1,heart:1,band:1,smile:1,bubble:'#ff5fb0',accent:C.pink},
  {code:'H-D',name:'低音猛男',note:'最不违和也因此最好笑',kind:'buff',top:'#3a3640',jacket:1,shade:1,bubble:'#7a5aff',accent:C.purple},
 ]});

/* STAGE ③ —— 换脸换肤，发型上线定家族基调；神态还是大叔 */
const S3=[
 ['LSC','电子小妖精（坯）','坐姿像网吧大神','petite',{cap:'zig',extra:'twinhigh',blen:12,c:'#ff7bc1',c2:'#7af0ea',ac:'#fff'},SKIN.idol,'#4ef0e8','S',C.pink],
 ['LSB','邻家少女（坯）','吃播式狼吞虎咽','petite',{cap:'zig',extra:'braidtwin',c:'#a9714b',ac:'#ff4a6a'},SKIN.idol,null,'S',C.pink],
 ['LDC','街头机娘（坯）','蹲在椅子上抽电子烟','petite',{cap:'shaved',c:'#c050d0'},SKIN.idol,'#ffc14a','D',C.purple],
 ['LDB','慵懒猫系（坯）','整天瘫在椅子上','petite',{cap:'messy',side:'tuft',back:'straight',blen:16,wave:1,c:'#3f8f8a'},SKIN.idol,null,'D',C.purple],
 ['HSC','装甲甜心（坯）','掰手腕赢全场','tall',{cap:'zig',extra:'ponyhigh',blen:22,c:'#ff7f6e',ac:'#4ad8ff'},SKIN.idol,'#4ef0e8','S',C.cyan],
 ['HSB','阳光大姐姐（坯）','豪迈大笑拍人后背','tall',{cap:'swept',back:'straight',blen:14,wave:1,c:'#c98a3a'},SKIN.tan,null,'S',C.cyan],
 ['HDC','重金属女王（坯）','直播间里修机车','tall',{cap:'messy',back:'mane',blen:20,c:'#d4352a'},SKIN.idol,'#ff7a3a','D',C.red],
 ['HDB','御姐（坯）','翘二郎腿喝罐装啤酒','tall',{cap:'parted',side:'chest',back:'straight',blen:24,c:'#94303f'},SKIN.idol,null,'D',C.red],
];
STAGES.push({title:'STAGE ③ · 外观哲学（波11后）',sub:'8 形态 · C 义体(发光纹路) / B 生体(自然)',
 desc:'质变点：换脸换肤、发型上线（定下八条路线的发色家族）。但神态还是大叔——汗滴+面瘫嘴+大叔怪癖，统一廉价白T+运动裤：「皮像了，魂没像」。胸前别上音符徽章（粉=甜嗓/紫=磁嗓）。',
 cards:S3.map(r=>({code:r[0],name:r[1],note:'「'+r[2]+'」'+(r[6]?' · 义体纹路发光':' · 自然无痕'),
  body:r[3],hair:r[4],skin:r[5],glow:r[6],pin:PIN[r[7]],expr:'raw',accent:r[8],
  outfit:{type:'tee',c1:'#e8e8e8',c2:'#5a6a7a',c3:'#b8b8c4'}}))});

/* STAGE ④ —— 16素体：气质到位，练习生训练服 */
const BASE16=[
 {k:'LSCY',body:'petite',hair:{cap:'zig',extra:'twinhigh',blen:18,c:'#ff7bc1',c2:'#7af0ea',ac:'#fff'},skin:SKIN.idol,glow:'#4ef0e8',eye:'#d04a8a',expr:'sunny',v:'S',accent:C.pink,top:'#ff9fd0',
  name:'电子小妖精·素体',note:'粉色双马尾挑染青光，电音系底子'},
 {k:'LSCN',body:'petite',hair:{cap:'blunt',side:'chest',back:'straight',blen:20,c:'#dcd6ee'},skin:SKIN.pale,glow:'#b07bff',eye:'#7a5ad0',expr:'cool',v:'S',accent:C.pink,top:'#4a3a5e',
  name:'机偶少女·素体',note:'银白齐刘海+陶瓷义体感，人偶系'},
 {k:'LSBY',body:'petite',hair:{cap:'zig',extra:'braidtwin',c:'#a9714b',ac:'#ff4a6a'},skin:SKIN.idol,eye:'#8a5a3a',expr:'sunny',v:'S',accent:C.pink,top:'#ffd27a',
  name:'邻家少女·素体',note:'栗色双麻花辫，亲和力满点'},
 {k:'LSBN',body:'petite',hair:{cap:'blunt',side:'chest',back:'straight',blen:22,c:'#b8dcf5'},skin:SKIN.pale,eye:'#5a8ac0',expr:'cool',v:'S',accent:C.pink,top:'#cfe8f5',
  name:'冰山歌姬·素体',note:'冰蓝长直发，清冷透明感'},
 {k:'LDCY',body:'petite',hair:{cap:'shaved',c:'#ff6b35'},skin:SKIN.idol,glow:'#ffc14a',eye:'#d05a2a',expr:'sunny',v:'D',accent:C.purple,top:'#3a3f4a',acc:['goggles'],
  name:'机能小辣椒·素体',note:'橘色不对称铲青头+护目镜'},
 {k:'LDCN',body:'petite',hair:{cap:'overeye',side:'chest',back:'straight',blen:18,c:'#6a4ac8'},skin:SKIN.pale,glow:'#9b6bff',eye:'#6a4ac8',expr:'cool',v:'D',accent:C.purple,top:'#2e2840',acc:['headphones'],
  name:'低音电子·素体',note:'深紫遮眼帘+大耳机，声学义体'},
 {k:'LDBY',body:'petite',hair:{cap:'slick',c:'#e0cf96'},skin:SKIN.idol,eye:'#b09040',expr:'sunny',v:'D',accent:C.purple,top:'#f0f0f5',
  name:'中性王子·素体',note:'亚麻色大背头，帅气中性风'},
 {k:'LDBN',body:'petite',hair:{cap:'messy',side:'tuft',back:'straight',blen:14,wave:1,extra:'ahoge',c:'#3f8f8a'},skin:SKIN.idol,eye:'#2e6b68',expr:'cool',v:'D',accent:C.purple,top:'#8a93a5',
  name:'慵懒猫系·素体',note:'墨绿乱卷+呆毛，半垂眼'},
 {k:'HSCY',body:'tall',hair:{cap:'zig',extra:'ponyhigh',blen:26,c:'#ff7f6e',ac:'#4ad8ff'},skin:SKIN.idol,glow:'#4ef0e8',eye:'#d05a5a',expr:'sunny',v:'S',accent:C.cyan,top:'#5ad8e0',
  name:'装甲元气·素体',note:'珊瑚色高马尾+义体臂纹'},
 {k:'HSCN',body:'tall',hair:{cap:'blunt',side:'chest',back:'straight',blen:26,c:'#d0d4e8'},skin:SKIN.pale,glow:'#6aa8ff',eye:'#5a6ac0',expr:'cool',v:'S',accent:C.cyan,top:'#9aa4c0',
  name:'装甲歌姬·素体',note:'银发长直+蓝光义体，战姬胚子'},
 {k:'HSBY',body:'tall',hair:{cap:'swept',back:'straight',blen:16,wave:1,c:'#c98a3a'},skin:SKIN.tan,eye:'#a06a2a',expr:'sunny',v:'S',accent:C.cyan,top:'#ffe28a',
  name:'阳光健康·素体',note:'小麦肤色+侧分波浪，健康系'},
 {k:'HSBN',body:'tall',hair:{cap:'parted',side:'chest',back:'straight',blen:24,wave:1,c:'#efe2bb'},skin:SKIN.pale,eye:'#b09a5a',expr:'cool',v:'S',accent:C.cyan,top:'#e8e0f0',
  name:'高岭之花·素体',note:'白金长卷发，超模气场'},
 {k:'HDCY',body:'tall',hair:{cap:'messy',back:'mane',blen:24,c:'#d4352a'},skin:SKIN.idol,glow:'#ff7a3a',eye:'#c03a2a',expr:'sunny',v:'D',accent:C.red,top:'#3a3a3a',
  name:'金属烈火·素体',note:'绯红鬃毛+橙光义体，烈火系'},
 {k:'HDCN',body:'tall',hair:{cap:'parted',side:'chest',back:'straight',blen:26,c:'#4a3565',c2:'#4af07a'},skin:SKIN.pale,glow:'#4af07a',eye:'#6a4a9a',expr:'cool',v:'D',accent:C.red,top:'#232838',
  name:'暗夜魅影·素体',note:'黑紫长发绿光发尾，神秘暗黑'},
 {k:'HDBY',body:'tall',hair:{cap:'messy',back:'shag',blen:20,c:'#94303f'},skin:SKIN.idol,eye:'#8a3040',expr:'sunny',v:'D',accent:C.red,top:'#aa4030',
  name:'豪快大姐·素体',note:'酒红狼尾层次，豪爽大姐头'},
 {k:'HDBN',body:'tall',hair:{cap:'blunt',side:'chest',back:'straight',blen:28,c:'#2e2a38'},skin:SKIN.pale,eye:'#4a3a5a',lip:'#d04055',expr:'cool',v:'D',accent:C.red,top:'#5a2230',
  name:'暗色御姐·素体',note:'黑长直+红唇，御姐天花板坯'},
];
const BASEMAP={};BASE16.forEach(b=>BASEMAP[b.k]=b);
STAGES.push({title:'STAGE ④ · 气质核心（波15后）',sub:'16 形态 · Y 元气 / N 冷艳',
 desc:'神经仪态改造完成：Y=大眼腮红开口笑，N=半垂眼眼线冷唇。统一练习生训练服（各自主题色T恤），16 个发型已全部分化、互不重复——只差最后一步出道定位。',
 cards:BASE16.map(b=>({code:b.k.split('').join('-'),name:b.name,note:b.note,
  body:b.body,hair:b.hair,skin:b.skin,glow:b.glow,eye:b.eye,lip:b.lip,expr:b.expr,
  pin:PIN[b.v],accent:b.accent,acc:b.acc,
  outfit:{type:'tee',c1:b.top,c2:'#4a4f60',c3:'#e8e8f0'}}))});

/* STAGE ⑤ —— 32 终态：全部独立设计（发型/剪影/服装类别/配件互不重复） */
const F32=[
 ['LSCY','P','像素天使','电音偶像：双钻头卷×全息青演出裙×光翼，星光打歌服',
  {cap:'zig',extra:'drills',c:'#ff9fd0',c2:'#7af0ea'},
  {type:'idolDress',c1:'#ffffff',c2:'#7af0ea',c3:'#ffd24a',sleeveless:1},['mic','holowing'],['sparkle:#7af0ea']],
 ['LSCY','T','电波小妖','VTuber直播女王：玫粉短发×巨型猫耳耳机×青色oversize卫衣',
  {cap:'zig',side:'short',c:'#ff5fb0'},
  {type:'hoodie',c1:'#7ae0f0',c2:'#ff8fc8',c3:'#2a2435'},['catear'],['heart']],
 ['LSCN','P','哥特机偶','人偶歌姬：银白姬发式×黑紫哥特钟形裙×迷你王冠×球形关节',
  {cap:'blunt',side:'chest',back:'straight',blen:20,c:'#dcd6ee'},
  {type:'lolita',c1:'#2a2235',c2:'#3a2a50'},['crown','dolljoint'],['moon:#b07bff']],
 ['LSCN','T','谜语AI酱','「分不清是AI还是人」：全息扫描线短发×深蓝科技长袍×信号天线',
  {cap:'blunt',side:'short',extra:'scan',c:'#cfe0f0',c2:'#9ff4ff'},
  {type:'trench',c1:'#2c3550',c3:'#b07bff'},['antenna'],['question']],
 ['LSBY','P','国民初恋','王道正统派：栗色公主半扎长发×白粉泡泡袖打歌裙×腰后大蝴蝶结',
  {cap:'zig',extra:'topknot',back:'straight',blen:22,c:'#a9714b',ac:'#ff4a6a'},
  {type:'idolDress',c1:'#ffffff',c2:'#ffb3cf',c3:'#ff8fb8',puff:1},['mic','ribbonback'],['heart']],
 ['LSBY','T','邻家小妹','闲聊吃播系：双麻花辫×奶油开衫×橘色百褶裙×手拿鲷鱼烧',
  {cap:'zig',extra:'braidtwin',c:'#8a5a3a',ac:'#ff9f5a'},
  {type:'cardigan',c1:'#f5e3c0',c2:'#fff8ea',c3:'#ff9f5a'},['snack'],['heart:#ff9f5a']],
 ['LSBN','P','冰山歌姬','纯白冷感：及腰冰蓝长直×纯白礼服长裙，高音透明感',
  {cap:'blunt',side:'chest',back:'straight',blen:30,c:'#dceef8',c2:'#a8d8f0'},
  {type:'gown',c1:'#f2f8ff',collar:'#a8d8f0',hem:'#a8d8f0'},['mic'],['snow']],
 ['LSBN','T','深夜文学少女','读诗电台：贝雷帽×藏青单侧麻花辫×高领毛衣长裙×圆框眼镜+诗集',
  {cap:'zig',extra:'braidside',c:'#2e3a5c'},
  {type:'sweater',c1:'#2e3a5c',c2:'#5a6478'},['beret:#3a3050','glasses','book'],['moon']],
 ['LDCY','P','电驭小钢炮','小个子rapper：橘色铲青头×机能马甲×徽章×头戴麦，台风炸裂',
  {cap:'shaved',c:'#ff6b35'},
  {type:'vest',c1:'#ff6b35',c2:'#26262e',c3:'#2a2a32'},['headsetmic'],['bolt']],
 ['LDCY','T','整活鬼才','搞笑系直播：荧光绿丸子头×护目镜×沙雕白T，整活与才华齐飞',
  {cap:'messy',extra:'buns',c:'#b8e04a'},
  {type:'tee',c1:'#f5f5ef',c2:'#3a3f4a',c3:'#b8e04a'},['goggles'],['sparkle:#ffd24a']],
 ['LDCN','P','暗域低音炮','暗黑电子：紫色莫西干×开衩黑裙×肩载音响，低音物理震场',
  {cap:'mohawk',c:'#5a3a8a',c2:'#9b6bff'},
  {type:'gown',c1:'#2c2240',slit:1,hem:'#9b6bff',sleeveless:1},['speaker','mic'],['note']],
 ['LDCN','T','耳机蛊','ASMR直播：遮眼长帘×声学大耳机×oversize紫卫衣，「听一次戒不掉」',
  {cap:'overeye',side:'chest',back:'straight',blen:24,c:'#4a3a6a'},
  {type:'hoodie',c1:'#352a50',c2:'#9b6bff',c3:'#241e38'},['headphones'],['note:#7a5aff']],
 ['LDBY','P','王子殿下','中性帅气：亚麻大背头×白金燕尾礼服×手持玫瑰，女粉狂热',
  {cap:'slick',c:'#e0cf96'},
  {type:'tailcoat',c1:'#f8f8ff',c2:'#e8e0d0',c3:'#d8b04a'},['mic','rose'],['sparkle:#ffd24a']],
 ['LDBY','T','姐系幼驯染','陪伴感直播：焦糖色低侧马尾×奶咖高领毛衣裙×热可可',
  {cap:'swept',extra:'ponyside',blen:18,c:'#c89058'},
  {type:'sweater',c1:'#e8cfae',c2:'#8a6a4a',dress:1},['mug'],['heart:#e8a86a']],
 ['LDBN','P','爵士猫','小酒馆唱腔：墨绿指推波纹×酒红吊带长裙×黑长手套×猫耳发尖',
  {cap:'swept',side:'short',extra:'marcel',extra2:'catears',c:'#2e6b68'},
  {type:'slip',c1:'#7a2438',c3:'#1c1822'},['mic'],['note:#d8b04a']],
 ['LDBN','T','丧系电台','深夜丧文化：灰藕乱长发呆毛×毛毯斗篷×「今天也辛苦了」',
  {cap:'messy',side:'chest',back:'straight',blen:24,wave:1,extra:'ahoge',c:'#8a7f95'},
  {type:'blanket',c1:'#5a6478',c2:'#8a93a5'},['headsetmic'],['zzz']],
 ['HSCY','P','钢铁啦啦队长','装甲应援：珊瑚双马尾×青白机甲啦啦队服×双色彩球',
  {cap:'zig',extra:'twinhigh',blen:24,c:'#ff7f6e',c2:'#4ad8ff',ac:'#fff'},
  {type:'cheer',c1:'#4ad8e8',c2:'#ffffff',c3:'#ffd24a'},['pompom'],['sparkle:#ffd24a']],
 ['HSCY','T','健身大姐姐','健身直播：玫红高马尾×运动背心×腹肌×哑铃「再来一组哦☆」',
  {cap:'swept',extra:'ponyhigh',blen:16,c:'#e8487a',ac:'#fff'},
  {type:'sports',c1:'#ff7fa0',c2:'#2e2e3a',c3:'#ffd24a'},['dumbbell','towel'],['bolt']],
 ['HSCN','P','装甲歌姬','战姬系：银发长直×全装甲裙甲×光环×发光中缝，圣女声线',
  {cap:'blunt',side:'chest',back:'straight',blen:30,c:'#d0d4e8'},
  {type:'armor',c1:'#c8d0e0',c2:'#7a90c0',c3:'#6aa8ff'},['halo','mic'],['sparkle:#6aa8ff']],
 ['HSCN','T','保镖女神','冷面护卫：铂金大背头小髻×黑西装领带×战术目镜×耳麦',
  {cap:'slick',extra:'topknot',c:'#e8e4d8',ac:'#c8c8d8'},
  {type:'suit',c1:'#20242e',c2:'#f2f2f8',c3:'#6aa8ff',c4:'#181c24'},['visor','earpiece'],['sparkle:#aab0c8']],
 ['HSBY','P','夏日女神','健康系阳光：日晒金波浪长发×明黄夏日长裙×发间小花，小麦色',
  {cap:'swept',side:'chest',back:'straight',blen:26,wave:1,c:'#f0d890'},
  {type:'sundress',c1:'#ffd866',c2:'#ff8a5a',c3:'#ffffff'},['hairflower'],['sun']],
 ['HSBY','T','元气干饭王','大胃王直播：锈棕短发×白毛巾头带×红围裙×超大饭碗',
  {cap:'zig',side:'short',c:'#b86a38'},
  {type:'apron',c1:'#e84a3a',c2:'#ffffff',c3:'#4a3a30'},['bandana:#f2f2f8','bowl','hairpins'],['heart:#ff9f5a']],
 ['HSBN','P','超模歌姬','高岭之花：中分黑棕及膝长发×黑金鱼尾礼服×耳坠，T台气场',
  {cap:'parted',side:'chest',back:'straight',blen:32,c:'#3a2e28'},
  {type:'gown',c1:'#1f1b28',mermaid:1,hem:'#d8b04a',sleeveless:1},['earrings','mic'],['sparkle:#d8b04a']],
 ['HSBN','T','女王的茶会','优雅谈话：香槟色竖卷×迷你礼帽×紫罗兰茶会裙×红茶，气场两米八',
  {cap:'parted',extra:'ringlets',c:'#e8d4a8'},
  {type:'idolDress',c1:'#6a4a8a',c2:'#553a70',c3:'#e8e0f0',puff:1},['minihat:#3a2438','mug:#f2f2f8'],['sparkle:#c8a8e8']],
 ['HDCY','P','重金属女王','金属乐主唱：绯红狂野鬃毛×铆钉皮马甲×火焰漆V型电吉他',
  {cap:'messy',back:'mane',blen:26,c:'#d4352a'},
  {type:'vest',c1:'#26222a',c2:'#1c1820',c3:'#26262e'},['guitar'],['flame']],
 ['HDCY','T','机修大姐头','工坊直播：锈色碎发×红头巾×橘色连体工装系腰×扳手+脸上油渍',
  {cap:'messy',side:'tuft',back:'shag',blen:10,c:'#b85c3a'},
  {type:'jumpsuit',c1:'#e87a2a',c2:'#26262e'},['bandana:#d04a3a','wrench','smudge'],['bolt:#ffc14a']],
 ['HDCN','P','赛博魅影','赛博歌剧：黑紫侧帘长发×高领歌剧长裙×铬合金半面具×电路裙摆',
  {cap:'swept',side:'chest',back:'straight',blen:30,c:'#4a3565'},
  {type:'gown',c1:'#2e2348',collar:'#1c1830',hem:'#4af07a',slit:1},['halfmask'],['sparkle:#9b6bff']],
 ['HDCN','T','黑客女王','黑客直播：兜帽遮发(漏出绿色发丝)×暗色风衣×代码雨×发光眼',
  {c:'#1c2430'},
  {type:'trench',c1:'#1c2430',c3:'#4af07a',hood:1,strand:'#4af07a'},[],['code']],
 ['HDBY','P','摇滚大姐大','摇滚现场：酒红狼尾长发×贴满徽章的丹宁马甲×破洞牛仔裤',
  {cap:'messy',back:'shag',blen:24,c:'#94303f'},
  {type:'vest',c1:'#3a5a8a',c2:'#26222a',c3:'#3a5a8a'},['mic'],['flame']],
 ['HDBY','T','居酒屋老板娘','人生咨询室：深棕盘发金簪×藏蓝和服×白前挂×小酒杯',
  {cap:'parted',extra:'updo',c:'#4a3528'},
  {type:'kimono',c1:'#3a4a7a',c2:'#e8e0d0',c3:'#c8a04a'},['glass'],['heart:#e8a86a']],
 ['HDBN','P','黑天鹅','艺术派歌姬：墨黑芭蕾髻×羽毛短裙礼服×黑长手套，剧场感',
  {cap:'blunt',extra:'buntop',c:'#211d28'},
  {type:'tutu',c1:'#181520',c3:'#1c1822'},['earrings'],['feather']],
 ['HDBN','T','午夜威士忌','深夜谈话(内容健全)：单侧好莱坞波浪×暗红丝绒开衩裙×白披肩×酒杯',
  {cap:'swept',side:'tuft',extra:'sidefall',blen:26,c:'#5a2433'},
  {type:'slip',c1:'#5a1e2e',c3:'#3a1622',stole:1},['glass'],['moon:#e8a83a']],
];
const FAMILY={LS:['轻甜系（L-S-x-x-x）— 娇小甜嗓',C.pink],LD:['轻磁系（L-D-x-x-x）— 娇小烟嗓',C.purple],
 HS:['重甜系（H-S-x-x-x）— 高挑甜嗓·反差担当',C.cyan],HD:['重磁系（H-D-x-x-x）— 高挑烟嗓',C.red]};
STAGES.push({title:'STAGE ⑤ · 出道定位（波18后）→ 最终形态',sub:'32 形态 · 全部独立设计',
 desc:'P=舞台型（演出装备+特效），T=互动型（直播道具+主题装）。同一素体的 P/T 已完全分化：发型、剪影、服装类别、配件互不重复，仅保留发色家族与五轴锚点用于反推改造史。',
 families:Object.keys(FAMILY).map(fk=>({
   label:FAMILY[fk][0],color:FAMILY[fk][1],
   cards:F32.filter(f=>f[0].indexOf(fk)===0).map(f=>{
     const b=BASEMAP[f[0]];
     return {code:f[0].split('').join('-')+'-'+f[1],name:f[2],note:f[3],
      body:b.body,hair:f[4],skin:b.skin,glow:b.glow,eye:b.eye,lip:b.lip,expr:b.expr,
      pin:PIN[b.v],accent:b.accent,outfit:f[5],acc:f[6],fx:f[7]};
   })
 }))});

/* ============ 页面组装（仅设计稿页面执行；游戏复用本文件数据时跳过） ============ */
const app=document.getElementById('app');
if(app)STAGES.forEach(st=>{
  const sec=document.createElement('section');
  sec.innerHTML='<div class="stitle"><h2>'+st.title+'</h2><small>'+st.sub+'</small></div><p class="sdesc">'+st.desc+'</p>';
  function addGrid(cards,parent){
    const grid=document.createElement('div');grid.className='grid';
    cards.forEach(c=>{
      const card=document.createElement('div');card.className='card';
      card.style.borderColor=(c.accent||'#2a2238')+'55';
      const art=document.createElement('div');art.style.position='relative';
      art.appendChild(renderCard(c));
      if(typeof drawChibi==='function'){            // Q版动态内嵌（整合自 gallery）
        const mods=(c.code==='0')?[]:String(c.code).replace(/-/g,'').split('');
        const cc=document.createElement('canvas');cc.width=72;cc.height=82;
        cc.style.cssText='position:absolute;right:5px;bottom:5px;image-rendering:pixelated;background:#0009;border-radius:6px;border:1px solid #ffffff22';
        const cg=cc.getContext('2d');cg.imageSmoothingEnabled=false;cg.save();cg.scale(1.5,1.5);
        try{drawChibi(cg,24,46,mods,{face:1,moving:false,run:0,t:0.4});}catch(e){}
        cg.restore();art.appendChild(cc);
        const ql=document.createElement('div');ql.textContent='Q版';
        ql.style.cssText='position:absolute;right:9px;bottom:90px;font-size:9px;color:#8a80a0;writing-mode:vertical-rl';
        art.appendChild(ql);
      }
      card.appendChild(art);
      const code=document.createElement('div');code.className='code';code.textContent=c.code;code.style.color=c.accent||'#fff';
      card.appendChild(code);
      card.insertAdjacentHTML('beforeend','<div class="cname">'+c.name+'</div><div class="cnote">'+c.note+'</div>');
      grid.appendChild(card);
    });
    parent.appendChild(grid);
  }
  if(st.families){
    st.families.forEach(f=>{
      const h=document.createElement('h3');h.className='family';h.textContent=f.label;h.style.color=f.color;
      sec.appendChild(h);addGrid(f.cards,sec);
    });
  }else addGrid(st.cards,sec);
  app.appendChild(sec);
});

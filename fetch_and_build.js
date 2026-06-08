// fetch_and_build.js - 从Football-Data.org API生成teams2026.js
// 48支球队完整26人大名单 + 中文信息
const fs = require('fs');
const rawData = fs.readFileSync('tmp_teams.json', 'utf8').replace(/^\uFEFF/, '');
const apiData = JSON.parse(rawData);

// ===== 完整48强中文名映射（基于API实际返回的队伍） =====
const teamMapping = {
  'Uruguay':         { id:1,  name:'乌拉圭',     flag:'🇺🇾', group:'G', nickname:'天蓝军团',       starPlayer:'努涅斯',      description:'乌拉圭是世界杯元老，两次夺冠（1930/1950），拥有努涅斯、巴尔韦德两大巨星，球风彪悍', goldQuote:'乌拉圭人天生就带着冠军基因，两届世界杯得主' },
  'Germany':         { id:2,  name:'德国',       flag:'🇩🇪', group:'E', nickname:'日耳曼战车',   starPlayer:'穆西亚拉',    description:'德国四夺世界杯冠军（1954/1974/1990/2014），拥有穆西亚拉、维尔茨等世界级天才', goldQuote:'德国年轻人的天赋让人看到了复兴的希望' },
  'Spain':           { id:3,  name:'西班牙',     flag:'🇪🇸', group:'J', nickname:'斗牛士军团',   starPlayer:'罗德里',      description:'2010世界杯冠军，传控足球代表，罗德里领衔的中场控制力冠绝天下', goldQuote:'西班牙的tiki-taka让对手只能跟着跑' },
  'Paraguay':        { id:4,  name:'巴拉圭',     flag:'🇵🇾', group:'D', nickname:'南美瓜拉尼',   starPlayer:'阿尔米隆',    description:'南美足坛传统劲旅，防守稳固作风顽强，阿尔米隆表现出色', goldQuote:'巴拉圭的防守在南美是顶级的' },
  'Argentina':       { id:5,  name:'阿根廷',     flag:'🇦🇷', group:'H', nickname:'潘帕斯雄鹰',   starPlayer:'梅西',        description:'三届世界杯冠军（1978/1986/2022），梅西率领卫冕冠军冲击历史', goldQuote:'梅西最后一舞，谁敢挡路？' },
  'Ghana':           { id:6,  name:'加纳',       flag:'🇬🇭', group:'J', nickname:'黑星',         starPlayer:'托马斯·帕泰', description:'非洲足坛传统强队，托马斯在阿森纳证明世界级水准', goldQuote:'加纳的黑星一直在非洲天空闪耀' },
  'Brazil':          { id:7,  name:'巴西',       flag:'🇧🇷', group:'C', nickname:'桑巴军团',     starPlayer:'内马尔',      description:'五次夺冠的世界杯最成功球队，技术与艺术的完美结合', goldQuote:'巴西踢的不是足球，是桑巴舞！' },
  'Portugal':        { id:8,  name:'葡萄牙',     flag:'🇵🇹', group:'G', nickname:'五盾军团',     starPlayer:'C罗',        description:'C罗领军，布鲁诺、莱奥等球星群星闪耀的豪华阵容', goldQuote:'葡萄牙不只是有C罗，这套阵容太豪华了' },
  'Japan':           { id:9,  name:'日本',       flag:'🇯🇵', group:'F', nickname:'蓝武士',       starPlayer:'三笘薰',      description:'亚洲足球技术标杆，旅欧球员数量全球第一，已跻身世界一流', goldQuote:'三笘薰过人如过木桩一样轻松' },
  'Mexico':          { id:10, name:'墨西哥',     flag:'🇲🇽', group:'A', nickname:'草帽军团',     starPlayer:'洛萨诺',      description:'2026东道主之一，中北美绝对霸主，连续8届晋级决赛圈', goldQuote:'墨西哥作为东道主，主场优势不容小觑' },
  'England':         { id:11, name:'英格兰',     flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', group:'F', nickname:'三狮军团',     starPlayer:'哈里·凯恩',  description:'现代足球发源地，贝林厄姆、福登、萨卡年轻才俊云集', goldQuote:'贝林厄姆和凯恩的组合所向披靡' },
  'United States':   { id:12, name:'美国',       flag:'🇺🇸', group:'D', nickname:'星条军团',     starPlayer:'普利西奇',    description:'2026东道主之一，足球飞速崛起，普利西奇领军新生代', goldQuote:'普利西奇这一代人正在改变美国足球' },
  'South Korea':     { id:13, name:'韩国',       flag:'🇰🇷', group:'A', nickname:'太极虎',       starPlayer:'孙兴慜',      description:'亚洲足坛传统强队，连续11届晋级世界杯，孙兴慜亚洲一哥', goldQuote:'孙兴慜的速度和技术是韩国最大武器' },
  'France':          { id:14, name:'法国',       flag:'🇫🇷', group:'I', nickname:'高卢雄鸡',     starPlayer:'姆巴佩',      description:'两届世界杯冠军（1998/2018），人才储备冠绝全球的最大热门', goldQuote:'姆巴佩一个人的速度就能撕开任何防线' },
  'South Africa':    { id:15, name:'南非',       flag:'🇿🇦', group:'A', nickname:'非洲之鹰',     starPlayer:'姆韦拉',      description:'时隔多年重返世界杯，2010年东道主经验丰富', goldQuote:'南非重返世界杯，非洲之鹰再次展翅高飞' },
  'Algeria':         { id:16, name:'阿尔及利亚', flag:'🇩🇿', group:'K', nickname:'沙漠之狐',     starPlayer:'本拉赫马',    description:'北非足球劲旅，2014年世界杯打入16强，技术流打法', goldQuote:'阿尔及利亚的技术在非洲独树一帜' },
  'Australia':       { id:17, name:'澳大利亚',   flag:'🇦🇺', group:'D', nickname:'澳洲袋鼠',     starPlayer:'苏塔',        description:'亚洲足坛劲旅，身体强壮体能充沛，苏塔为防线核心', goldQuote:'袋鼠军团的体能令人畏惧' },
  'New Zealand':     { id:18, name:'新西兰',     flag:'🇳🇿', group:'J', nickname:'全白队',       starPlayer:'伍德',        description:'大洋洲绝对统治者，伍德的英超经验是最大财富', goldQuote:'新西兰在大洋洲没有对手' },
  'Switzerland':     { id:19, name:'瑞士',       flag:'🇨🇭', group:'B', nickname:'十字军团',     starPlayer:'索默',        description:'欧洲稳定劲旅，防守稳固战术执行力强', goldQuote:'瑞士总能在大赛制造惊喜' },
  'Ecuador':         { id:20, name:'厄瓜多尔',   flag:'🇪🇨', group:'E', nickname:'高原杀手',     starPlayer:'恩纳·瓦伦西亚', description:'高原主场海拔2800米，体能充沛拼抢凶悍', goldQuote:'高原魔鬼主场让任何对手头疼' },
  'Sweden':          { id:21, name:'瑞典',       flag:'🇸🇪', group:'C', nickname:'北欧海盗',     starPlayer:'伊萨克',      description:'北欧足球代表力量，伊萨克在纽卡斯尔表现证明实力', goldQuote:'瑞典人身体素质在欧洲首屈一指' },
  'Czechia':         { id:22, name:'捷克',       flag:'🇨🇿', group:'A', nickname:'东欧铁骑',     starPlayer:'希克',        description:'硬朗球风闻名欧洲足坛，希克远距离头球专家', goldQuote:'捷克的硬朗球风让任何对手头疼' },
  'Croatia':         { id:23, name:'克罗地亚',   flag:'🇭🇷', group:'I', nickname:'格子军团',     starPlayer:'莫德里奇',    description:'2018亚军2022季军，莫德里奇带领的中场是世界级', goldQuote:'克罗地亚的中场控制力是世界顶级的' },
  'Saudi Arabia':    { id:24, name:'沙特阿拉伯', flag:'🇸🇦', group:'I', nickname:'沙漠猎鹰',     starPlayer:'多萨里',      description:'2022年击败阿根廷震惊世界，技术流打法著称', goldQuote:'沙特的技术能力被严重低估了' },
  'Tunisia':         { id:25, name:'突尼斯',     flag:'🇹🇳', group:'K', nickname:'迦太基之鹰',   starPlayer:'哈兹里',      description:'北非传统强队，六次进入世界杯，2022击败法国创历史', goldQuote:'突尼斯赢了法国！创造了非洲足球历史' },
  'Turkey':          { id:26, name:'土耳其',     flag:'🇹🇷', group:'D', nickname:'星月军团',     starPlayer:'居勒尔',      description:'居勒尔皇马新宠儿，2002年曾进四强', goldQuote:'居勒尔是未来的超级巨星' },
  'Senegal':         { id:27, name:'塞内加尔',   flag:'🇸🇳', group:'F', nickname:'非洲雄狮',     starPlayer:'马内',        description:'非洲代表力量，马内的速度与力量是标志性武器', goldQuote:'非洲雄狮不是好惹的' },
  'Belgium':         { id:28, name:'比利时',     flag:'🇧🇪', group:'L', nickname:'欧洲红魔',     starPlayer:'德布劳内',    description:'曾长期排名FIFA第一，黄金一代虽老但底子还在', goldQuote:'德布劳内的传球是最美的艺术品' },
  'Morocco':         { id:29, name:'摩洛哥',     flag:'🇲🇦', group:'C', nickname:'阿特拉斯雄狮',starPlayer:'阿什拉夫',    description:'2022世界杯首支非洲四强，防守稳固反击犀利', goldQuote:'摩洛戈是2022最大黑马' },
  'Austria':         { id:30, name:'奥地利',     flag:'🇦🇹', group:'L', nickname:'阿尔卑斯雄鹰',starPlayer:'萨比策',     description:'朗尼克调教下脱胎换骨，高位逼打行云流水', goldQuote:'朗尼克把奥地利打造成精密战车' },
  'Colombia':        { id:31, name:'哥伦比亚',   flag:'🇨🇴', group:'C', nickname:'咖啡农',       starPlayer:'迪亚斯',      description:'才华横溢，迪亚斯利物浦惊艳，J罗经验宝贵', goldQuote:'迪亚斯的盘带是世界上最美的风景之一' },
  'Egypt':           { id:32, name:'埃及',       flag:'🇪🇬', group:'G', nickname:'法老军团',     starPlayer:'萨拉赫',      description:'七次非洲杯冠军，萨拉赫国家英雄级存在', goldQuote:'萨拉赫一个人就能改变比赛' },
  'Canada':          { id:33, name:'加拿大',     flag:'🇨🇦', group:'B', nickname:'枫叶军团',     starPlayer:'阿方索·戴维斯',description:'2026东道主之一，戴维斯拜仁主力左后卫', goldQuote:'戴维斯速度是加拿大最大武器' },
  'Haiti':           { id:34, name:'海地',       flag:'🇭🇹', group:'C', nickname:'加勒比之虎',   starPlayer:'纳泽尔',      description:'首次参加世界杯，中北美加勒比海新力量', goldQuote:'海地首次参赛，黑马潜质十足' },
  'Iran':            { id:35, name:'伊朗',       flag:'🇮🇷', group:'H', nickname:'波斯铁骑',     starPlayer:'阿兹蒙',      description:'亚洲传统霸主，身体强壮战术纪律严明', goldQuote:'伊朗的身体对抗能力在亚洲无人能敌' },
  'Bosnia-Herzegovina':{id:36,name:'波黑',flag:'🇧🇦',group:'B',nickname:'巴尔干火药桶',starPlayer:'哲科',description:'首次参赛，哲科皮亚尼奇经验丰富',goldQuote:'哲科的经验是波黑最大财富' },
  'Panama':          { id:37, name:'巴拿马',     flag:'🇵🇦', group:'H', nickname:'运河勇士',     starPlayer:'戈多伊',      description:'中北美新晋力量，团结拼搏防守反击', goldQuote:'小国也能创造奇迹' },
  'Cape Verde Islands':{id:38, name:'佛得角',    flag:'🇨🇻', group:'E', nickname:'蓝鲨',         starPlayer:'戈麦斯',      description:'大西洋岛国首次参赛，非洲新兴力量', goldQuote:'佛得角是非洲足球的新惊喜' },
  'Congo DR':        { id:39, name:'民主刚果',   flag:'🇨🇩', group:'E', nickname:'利奥帕德豹',   starPlayer:'巴坎布',      description:'中非足球大国，人才辈出潜力巨大', goldQuote:'民主刚果的足球人才不容小觑' },
  'Ivory Coast':     { id:40, name:'科特迪瓦',   flag:'🇨🇮', group:'E', nickname:'非洲大象',     starPlayer:'扎哈',        description:'德罗巴时代后迎来扎哈等新生代球星', goldQuote:'非洲大象不容小觑' },
  'Qatar':           { id:41, name:'卡塔尔',     flag:'🇶🇦', group:'B', nickname:'亚洲之狮',     starPlayer:'阿菲夫',      description:'2019亚洲杯冠军+2022东道主，配合默契', goldQuote:'不要小看亚洲冠军' },
  'Jordan':          { id:42, name:'约旦',       flag:'🇯🇴', group:'K', nickname:'纳斯贾维雄鹰',starPlayer:'塔尔马里',    description:'西亚新贵，快速崛起的亚洲力量', goldQuote:'约旦是亚洲足球的黑马' },
  'Iraq':            { id:43, name:'伊拉克',     flag:'🇮🇶', group:'K', nickname:'美索不达米亚狮',starPlayer:'阿里',        description:'亚洲传统劲旅，2007年亚洲杯冠军', goldQuote:'伊拉克足球底蕴深厚' },
  'Uzbekistan':      { id:44, name:'乌兹别克斯坦',flag:'🇺🇿',group:'K', nickname:'中亚狼',       starPlayer:'肖穆罗多夫',  description:'中亚足球霸主，首次晋级世界杯创造历史', goldQuote:'乌兹别克斯坦首次参赛意义非凡' },
  'Netherlands':     { id:45, name:'荷兰',       flag:'🇳🇱', group:'H', nickname:'橙色军团',     starPlayer:'范戴克',      description:'全攻全守美丽足球代表，三次亚军无冕之王', goldQuote:'无冕之王这次能圆梦吗？' },
  'Norway':          { id:46, name:'挪威',       flag:'🇳🇴', group:'L', nickname:'维京海盗',     starPlayer:'哈兰德',      description:'哈兰德领衔的欧洲新贵，身体素质恐怖', goldQuote:'哈兰德的进球效率令人胆寒' },
  'Scotland':        { id:47, name:'苏格兰',     flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', group:'C', nickname:'风笛之师',     starPlayer:'罗伯逊',      description:'时隔多年重返世界杯，利物浦队长领军', goldQuote:'风笛吹响就是战斗号角' },
  'Curaçao':         { id:48, name:'库拉索',     flag:'🇨🇼', group:'E', nickname:'加勒比海马',   starPlayer:'巴库纳',      description:'加勒比海小岛国首次参赛充满黑马气质', goldQuote:'小国也有大梦想' }
};

// 恩怨录
const rivalryData = {
  'Argentina': [{opponent:'巴西',opponentFlag:'🇧🇷',desc:'南美双雄宿敌'},{opponent:'英格兰',opponentFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',desc:'1986上帝之手'},{opponent:'德国',opponentFlag:'🇩🇪',desc:'2014决赛之痛'}],
  'Brazil': [{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'南美双雄'},{opponent:'乌拉圭',opponentFlag:'🇺🇾',desc:'南美世仇'}],
  'Germany': [{opponent:'荷兰',opponentFlag:'🇳🇱',desc:'1974决赛经典'},{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'多次世界杯交锋'}],
  'France': [{opponent:'德国',opponentFlag:'🇩🇪',desc:'欧洲最强对决'},{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'2022决赛复仇'}],
  'England': [{opponent:'德国',opponentFlag:'🇩🇪',desc:'1966门线悬案'},{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'上帝之手与小贝红牌'},{opponent:'苏格兰',opponentFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',desc:'英伦德比'}],
  'Spain': [{opponent:'葡萄牙',opponentFlag:'🇵🇹',desc:'伊比利亚德比'},{opponent:'法国',opponentFlag:'🇫🇷',desc:'大赛常相遇'}],
  'Portugal': [{opponent:'西班牙',opponentFlag:'🇪🇸',desc:'伊比利亚德比'},{opponent:'法国',opponentFlag:'🇫🇷',desc:'2022淘汰赛复仇'}],
  'Netherlands': [{opponent:'德国',opponentFlag:'🇩🇪',desc:'历史恩怨'},{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'1978/2014恩怨'}],
  'Uruguay': [{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'普拉塔河德比'},{opponent:'巴西',opponentFlag:'🇧🇷',desc:'南美最强对决'}],
  'Mexico': [{opponent:'美国',opponentFlag:'🇺🇸',desc:'中北美死敌'},{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'淘汰赛常相遇'}],
  'USA': [{opponent:'墨西哥',opponentFlag:'🇲🇽',desc:'中北美终极死敌'},{opponent:'加拿大',opponentFlag:'🇨🇦',desc:'北美新贵之争'}],
  'Canada': [{opponent:'美国',opponentFlag:'🇺🇸',desc:'北美死敌'},{opponent:'墨西哥',opponentFlag:'🇲🇽',desc:'新老争霸'}],
  'Japan': [{opponent:'韩国',opponentFlag:'🇰🇷',desc:'东亚死敌'},{opponent:'澳大利亚',opponentFlag:'🇦🇺',desc:'亚洲预选赛对手'}],
  'South Korea': [{opponent:'日本',opponentFlag:'🇯🇵',desc:'东亚死敌'},{opponent:'伊朗',opponentFlag:'🇮🇷',desc:'亚洲杯常客'}],
  'Belgium': [{opponent:'法国',opponentFlag:'🇫🇷',desc:'2018半决赛'},{opponent:'荷兰',opponentFlag:'🇳🇱',desc:'欧国联邻居'}],
  'Croatia': [{opponent:'巴西',opponentFlag:'🇧🇷',desc:'2022世界杯淘汰巴西'},{opponent:'阿根廷',opponentFlag:'🇦🇷',desc:'2018小组赛恩怨'}],
  'Morocco': [{opponent:'法国',opponentFlag:'🇫🇷',desc:'2022半决赛虽败犹荣'},{opponent:'阿尔及利亚',opponentFlag:'🇩🇿',desc:'北非死敌'}],
  'Egypt': [{opponent:'塞内加尔',opponentFlag:'🇸🇳',desc:'非洲杯冤家萨拉赫vs马内'},{opponent:'摩洛哥',opponentFlag:'🇲🇦',desc:'北非阿拉伯德比'}],
  'Senegal': [{opponent:'埃及',opponentFlag:'🇪🇬',desc:'非洲杯萨拉赫vs马内'},{opponent:'摩洛哥',opponentFlag:'🇲🇦',desc:'非洲最强两队'}],
  'Austria': [{opponent:'德国',opponentFlag:'🇩🇪',desc:'德语区德比'}],
  'Norway': [{opponent:'英格兰',opponentFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',desc:'哈兰德vs英超群英'}],
  'Scotland': [{opponent:'英格兰',opponentFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',desc:'英伦德比'}],
  'Sweden': [{opponent:'英格兰',opponentFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',desc:'北欧对抗'}]
};

const posMap = {'Goalkeeper':'门将','Defence':'后卫','Midfield':'中场','Offence':'前锋','Forward':'前锋'};

const teams = apiData.teams.map((team) => {
  const m = teamMapping[team.name] || { 
    id:0, name:team.name, flag:'🏳️', group:'?', nickname:team.name, starPlayer:'', 
    description:`${team.name}国家队`, goldQuote:`欢迎关注${team.name}` 
  };
  
  const players = (team.squad || []).map((p, i) => ({
    id: parseInt(`${m.id}${String(i+1).padStart(3,'0')}`),
    name: p.name,
    position: posMap[p.position] || p.position,
    quote: `${posMap[p.position]||p.position}，${m.name}国家队成员`,
    dateOfBirth: p.dateOfBirth,
    playerId: p.id,
    nationality: p.nationality
  }));

  return {
    id: m.id, name: m.name, nameEn: team.name, flag: m.flag, group: m.group,
    tags: [m.nickname, m.starPlayer], nickname: m.nickname,
    starPlayer: m.starPlayer, description: m.description,
    goldQuote: m.goldQuote, crest: team.crest,
    coach: team.coach ? `${team.coach.firstName||''} ${team.coach.lastName||''}`.trim() : '',
    tla: team.tla || '',
    founded: team.founded || '',
    clubColors: team.clubColors || '',
    players, rivalries: rivalryData[team.name] || []
  };
});

// 按分组排序
const gOrder = ['A','B','C','D','E','F','G','H','I','J','K','L'];
teams.sort((a,b)=>{ const ga=gOrder.indexOf(a.group),gb=gOrder.indexOf(b.group); return ga-gb||a.id-b.id; });

let totalPlayers = teams.reduce((s,t)=>s+t.players.length,0);
console.log(`✅ ${teams.length}支队伍 | 共${totalPlayers}名球员`);
teams.forEach(t=>console.log(`   ${t.group}组 | ${t.flag} ${t.name.padEnd(10)} | ${String(t.players.length).padStart(2)}球员 | ${t.coach}`));

const output = `// data/teams2026.js - 2026世界杯48强球队百科数据
// 数据源：Football-Data.org API (competition WC id:2000)
// 生成时间：${new Date().toISOString().split('T')[0]}
// 共 ${teams.length} 支球队 | ${totalPlayers} 名球员 | 每队完整阵容(含教练/队徽)

const teamsData2026 = ${JSON.stringify(teams,null,2)}

module.exports = {
  teamsData2026
}
`;

fs.writeFileSync('mini-program/data/teams2026.js', output, 'utf8');
console.log('\n📁 已写入 mini-program/data/teams2026.js');

// build_teams_basic.js - 仅基于 tmp_teams.json 本地数据生成球队+球员名单
// 不调用任何外部 API，确保所有48支球队正确映射
const fs = require('fs');

const rawData = fs.readFileSync('tmp_teams.json', 'utf8').replace(/^\uFEFF/, '');
const apiData = JSON.parse(rawData);

// ====== 球队中文映射（以 API 实际返回名为准） ======
const teamMapping = {
  'Mexico':         { id:1,  name:'墨西哥',     flag:'🇲🇽', group:'A', nickname:'草帽军团',     starPlayer:'奥乔亚' },
  'South Korea':    { id:2,  name:'韩国',       flag:'🇰🇷', group:'A', nickname:'太极虎',      starPlayer:'孙兴慜' },
  'South Africa':   { id:3,  name:'南非',       flag:'🇿🇦', group:'A', nickname:'Bafana Bafana',starPlayer:'' },
  'Czechia':        { id:4,  name:'捷克',       flag:'🇨🇿', group:'A', nickname:'捷克雄狮',     starPlayer:'希克' },

  'Switzerland':    { id:5,  name:'瑞士',       flag:'🇨🇭', group:'B', nickname:'十字军',      starPlayer:'扎卡' },
  'Canada':         { id:6,  name:'加拿大',     flag:'🇨🇦', group:'B', nickname:'枫叶军团',    starPlayer:'戴维斯' },
  'Bosnia-Herzegovina':{id:7,name:'波黑',      flag:'🇧🇦', group:'B', nickname:'金雕之师',    starPlayer:'哲科' },
  'Qatar':          { id:8,  name:'卡塔尔',     flag:'🇶🇦', group:'B', nickname:'沙漠猎鹰',    starPlayer:'阿菲夫' },

  'Brazil':         { id:9,  name:'巴西',       flag:'🇧🇷', group:'C', nickname:'桑巴军团',    starPlayer:'维尼修斯' },
  'Sweden':         { id:10, name:'瑞典',       flag:'🇸🇪', group:'C', nickname:'北欧海盗',    starPlayer:'伊萨克' },
  'Morocco':        { id:11, name:'摩洛哥',     flag:'🇲🇦', group:'C', nickname:'阿特拉斯雄狮', starPlayer:'齐耶赫' },
  'Colombia':       { id:12, name:'哥伦比亚',   flag:'🇨🇴', group:'C', nickname:'咖啡农',      starPlayer:'迪亚斯' },
  'Haiti':          { id:13, name:'海地',       flag:'🇭🇹', group:'C', nickname:'加勒比之心',  starPlayer:'' },
  'Scotland':       { id:14, name:'苏格兰',     flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',group:'C', nickname:'高地勇士',   starPlayer:'罗伯逊' },

  'Paraguay':       { id:15, name:'巴拉圭',     flag:'🇵🇾', group:'D', nickname:'瓜拉尼红蓝',  starPlayer:'阿尔米隆' },
  'United States':  { id:16, name:'美国',       flag:'🇺🇸', group:'D', nickname:'山姆大叔',    starPlayer:'普利西奇' },
  'Australia':      { id:17, name:'澳大利亚',   flag:'🇦🇺', group:'D', nickname:'袋鼠军团',    starPlayer:'莱基' },
  'Turkey':         { id:18, name:'土耳其',     flag:'🇹🇷', group:'D', nickname:'星月军团',    starPlayer:'居勒尔' },

  'Germany':        { id:19, name:'德国',       flag:'🇩🇪', group:'E', nickname:'日耳曼战车',  starPlayer:'穆西亚拉' },
  'Ivory Coast':    { id:20, name:'科特迪瓦',   flag:'🇨🇮', group:'E', nickname:'非洲大象',    starPlayer:'佩佩' },
  'Cape Verde Islands':{id:21,name:'佛得角',    flag:'🇨🇻', group:'E', nickname:'蓝鲨',        starPlayer:'' },
  'Congo DR':       { id:22, name:'民主刚果',   flag:'🇨🇩', group:'E', nickname:'利奥波德之豹', starPlayer:'' },
  'Curaçao':        { id:23, name:'库拉索',     flag:'🇨🇼', group:'E', nickname:'蓝色火焰',    starPlayer:'巴库纳' },

  'Japan':           { id:24, name:'日本',      flag:'🇯🇵', group:'F', nickname:'蓝色武士',   starPlayer:'久保建英' },
  'England':         { id:25, name:'英格兰',    flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',group:'F', nickname:'三狮军团',   starPlayer:'贝林厄姆' },
  'Senegal':         { id:26, name:'塞内加尔',  flag:'🇸🇳', group:'F', nickname:'特兰加雄狮', starPlayer:'马内' },

  'Uruguay':         { id:27, name:'乌拉圭',    flag:'🇺🇾', group:'G', nickname:'天蓝军团',   starPlayer:'努涅斯' },
  'Portugal':        { id:28, name:'葡萄牙',    flag:'🇵🇹', group:'G', nickname:'五盾军团',   starPlayer:'C罗' },
  'Egypt':           { id:29, name:'埃及',      flag:'🇪🇬', group:'G', nickname:'法老军团',   starPlayer:'萨拉赫' },

  'Argentina':        { id:30, name:'阿根廷',    flag:'🇦🇷', group:'H', nickname:'潘帕斯雄鹰', starPlayer:'梅西' },
  'Iran':            { id:31, name:'伊朗',      flag:'🇮🇷', group:'H', nickname:'波斯铁骑',   starPlayer:'阿兹蒙' },
  'Panama':          { id:32, name:'巴拿马',    flag:'🇵🇦', group:'H', nickname:'运河巨人',   starPlayer:'戈多伊' },
  'Netherlands':      { id:33, name:'荷兰',      flag:'🇳🇱', group:'H', nickname:'橙色风暴',   starPlayer:'范戴克' },

  'France':           { id:34, name:'法国',      flag:'🇫🇷', group:'I', nickname:'高卢雄鸡',   starPlayer:'姆巴佩' },
  'Croatia':          { id:35, name:'克罗地亚',  flag:'🇭🇷', group:'I', nickname:'格子军团',   starPlayer:'莫德里奇' },
  'Saudi Arabia':     { id:36, name:'沙特阿拉伯',flag:'🇸🇦', group:'I', nickname:'绿鹰',       starPlayer:'达瓦萨里' },

  'Spain':            { id:37, name:'西班牙',    flag:'🇪🇸', group:'J', nickname:'斗牛士',     starPlayer:'亚马尔' },
  'Ghana':            { id:38, name:'加纳',      flag:'🇬🇭', group:'J', nickname:'黑色之星',   starPlayer:'库杜斯' },
  'New Zealand':      { id:39, name:'新西兰',    flag:'🇳🇿', group:'J', nickname:'全白队',     starPlayer:'伍德' },

  'Algeria':          { id:40, name:'阿尔及利亚',flag:'🇩🇿', group:'K', nickname:'沙漠之狐',   starPlayer:'本纳塞尔' },
  'Tunisia':          { id:41, name:'突尼斯',    flag:'🇹🇳', group:'K', nickname:'迦太基雄鹰', starPlayer:'哈兹里' },
  'Jordan':           { id:42, name:'约旦',      flag:'🇯🇴', group:'K', nickname:'纳什曼雄鹰', starPlayer:'塔马里' },
  'Iraq':             { id:43, name:'伊拉克',    flag:'🇮🇶', group:'K', nickname:'美索不达米亚雄狮',starPlayer:'' },
  'Uzbekistan':       { id:44, name:'乌兹别克斯坦',flag:'🇺🇿',group:'K', nickname:'中亚狼',    starPlayer:'肖穆罗多夫' },

  'Belgium':          { id:45, name:'比利时',    flag:'🇧🇪', group:'L', nickname:'欧洲红魔',   starPlayer:'德布劳内' },
  'Austria':          { id:46, name:'奥地利',    flag:'🇦🇹', group:'L', nickname:'奥地利乐队', starPlayer:'萨比策' },
  'Norway':           { id:47, name:'挪威',      flag:'🇳🇴', group:'L', nickname:'维京战舰',   starPlayer:'哈兰德' },

  // 补充遗漏的
  'Ecuador':          { id:48, name:'厄瓜多尔',  flag:'🇪🇨', group:'C', nickname:'南美勇士',    starPlayer:'凯塞多', description:'南美新势力' },
};

// ====== 位置映射 ======
const posMap = {
  'Goalkeeper': '门将',
  'Defence': '后卫',
  'Midfield': '中场',
  'Offence': '前锋',
  'Forward': '前锋'
};

// ====== 主逻辑 ======
console.log(`📊 数据源: tmp_teams.json`);
console.log(`   ${apiData.count} 支球队 | ${apiData.season.startDate} ~ ${apiData.season.endDate}\n`);

const teams = apiData.teams.map((team, teamIndex) => {
  const m = teamMapping[team.name] || {
    id: 100 + teamIndex,
    name: team.name,
    flag: '🏳️',
    group: '?',
    nickname: team.name,
    starPlayer: '',
    description: `${team.name}国家队`,
    goldQuote: `欢迎关注${team.name}`
  };

  // 处理球员列表
  const players = (team.squad || []).map((p, i) => ({
    id: parseInt(`${String(m.id).padStart(2,'0')}${String(i+1).padStart(3,'0')}`),
    name: p.name,  // 英文名先用，后续可补充中文
    position: posMap[p.position] || p.position,
    dateOfBirth: p.dateOfBirth || '',
    nationality: p.nationality || '',
    playerId: p.id,
    quote: `${posMap[p.position]||p.position}，${m.name}国家队成员`
  }));

  return {
    id: m.id,
    name: m.name,
    nameEn: team.name,
    flag: m.flag,
    group: m.group,
    tags: [m.nickname, m.starPlayer].filter(Boolean),
    nickname: m.nickname,
    starPlayer: m.starPlayer,
    description: m.description || `${m.name}国家队，2026世界杯${m.group}组参赛队伍`,
    goldQuote: m.goldQuote || `欢迎关注${m.name}`,
    crest: team.crest || '',
    tla: team.tla || '',
    founded: team.founded || null,
    clubColors: team.clubColors || '',
    address: team.address || '',
    website: team.website || '',
    coach: team.coach ? `${team.coach.firstName || ''} ${team.coach.lastName || ''}`.trim() : '',
    coachInfo: team.coach ? {
      id: team.coach.id,
      firstName: team.coach.firstName,
      lastName: team.coach.lastName,
      name: `${team.coach.firstName || ''} ${team.coach.lastName || ''}`.trim(),
      dateOfBirth: team.coach.dateOfBirth,
      nationality: team.coach.nationality
    } : null,
    players,
    rivalries: []
  };
});

// 排序：先按分组，再按ID
const gOrder = ['A','B','C','D','E','F','G','H','I','J','K','L'];
teams.sort((a,b) => {
  const ga = gOrder.indexOf(a.group), gb = gOrder.indexOf(b.group);
  return ga - gb || a.id - b.id;
});

// 统计
let totalPlayers = teams.reduce((s,t) => s + t.players.length, 0);
const unmapped = teams.filter(t => t.group === '?');
console.log(`✅ 生成完成:`);
console.log(`   • 球队: ${teams.length} 支`);
console.log(`   • 球员: ${totalPlayers} 名`);
if (unmapped.length > 0) {
  console.log(`   ⚠️  未分组(${unmapped.length}): ${unmapped.map(t=>t.nameEn).join(', ')}`);
}

// 输出文件
const output = `// data/teams2026.js - 2026世界杯48强球队百科数据
// 数据源: Football-Data.org API (competition WC id:2000)
// 生成时间: ${new Date().toISOString().split('T')[0]}
// 共 ${teams.length} 支球队 | ${totalPlayers} 名球员 | 含教练信息+队徽+完整阵容

const teamsData2026 = ${JSON.stringify(teams, null, 2)}

module.exports = {
  teamsData2026
}
`;

fs.writeFileSync('mini-program/data/teams2026.js', output, 'utf8');

console.log(`\n📁 输出: mini-program/data/teams2026.js`);

// 显示各分组情况
console.log(`\n📋 各分组详情:`);
gOrder.forEach(g => {
  const inGroup = teams.filter(t => t.group === g);
  if (inGroup.length > 0) {
    console.log("   " + g + "组 (" + inGroup.length + "队): " + inGroup.map(function(t){ return t.name + "(" + t.players.length + "人)"; }).join(" | "));
  }
});
const unknown = teams.filter(t => t.group === '?');
if (unknown.length > 0) {
  console.log(`   ?组 (${unknown.length}队): ${unknown.map(t=>t.name).join(', ')}`);
}

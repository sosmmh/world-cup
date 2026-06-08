// data/mockData.js - 模拟数据 (本地开发调试用)

// 今日赛程模拟数据
const todayMatches = [
  {
    id: 1001,
    homeTeam: { id: 1, name: '阿根廷', shortName: 'ARG', crest: '🇦🇷' },
    awayTeam: { id: 2, name: '葡萄牙', shortName: 'POR', crest: '🇵🇹' },
    score: null,
    status: 'SCHEDULED',
    utcDate: '2026-06-15T19:00:00Z',
    matchday: 1,
    group: 'A',
    minute: null
  },
  {
    id: 1002,
    homeTeam: { id: 3, name: '巴西', shortName: 'BRA', crest: '🇧🇷' },
    awayTeam: { id: 4, name: '法国', shortName: 'FRA', crest: '🇫🇷' },
    score: { fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 1 } },
    status: 'LIVE',
    utcDate: '2026-06-15T16:00:00Z',
    matchday: 1,
    group: 'B',
    minute: 67
  },
  {
    id: 1003,
    homeTeam: { id: 5, name: '德国', shortName: 'GER', crest: '🇩🇪' },
    awayTeam: { id: 6, name: '西班牙', shortName: 'ESP', crest: '🇪🇸' },
    score: { fullTime: { home: 1, away: 0 }, halfTime: { home: 0, away: 0 } },
    status: 'FINISHED',
    utcDate: '2026-06-15T13:00:00Z',
    matchday: 1,
    group: 'C',
    minute: 90
  }
]

// 实时比分 (进行中的比赛)
const liveMatches = [
  Object.assign({}, todayMatches[1], {
    events: [
      { type: 'goal', minute: 23, team: 'home', player: '内马尔', assist: '维尼修斯' },
      { type: 'goal', minute: 38, team: 'away', player: '姆巴佩', assist: '格列兹曼' },
      { type: 'goal', minute: 55, team: 'home', player: '罗德里戈', assist: null },
      { type: 'yellow', minute: 41, team: 'home', player: '卡塞米罗' }
    ]
  })
]

// 新闻列表
const newsList = [
  {
    id: 2001,
    title: '世界杯前瞻：阿根廷能否卫冕？梅西最后一舞引发全球关注',
    description: '39岁的梅西将迎来他的最后一届世界杯，阿根廷全队上下立志为球王送上最好的告别礼...',
    category: 'preview',
    date: '2026-06-14T10:00:00Z',
    thumbnail: '/images/news/news-1.jpg'
  },
  {
    id: 2002,
    title: '法国队公布最终名单：姆巴佩领衔，多名新星首次入选',
    description: '德尚公布了法国队26人最终名单，除了核心姆巴佩外，还有5名新人首次参加世界杯...',
    category: 'team',
    date: '2026-06-13T18:30:00Z',
    thumbnail: '/images/news/news-2.jpg'
  },
  {
    id: 2003,
    title: 'VAR新规解读：2026世界杯引入半自动越位技术',
    description: '国际足联宣布本届世界杯将使用最新的半自动越位识别系统，判罚速度预计提升30%...',
    category: 'rule',
    date: '2026-06-12T09:15:00Z',
    thumbnail: '/images/news/news-3.jpg'
  },
  {
    id: 2004,
    title: '48强巡礼：亚洲球队能否创造新的历史？',
    description: '日本、韩国、沙特、澳大利亚四支亚洲球队出征本届48强的世界杯，他们能否突破小组赛魔咒？',
    category: 'analysis',
    date: '2026-06-11T14:20:00Z',
    thumbnail: '/images/news/news-4.jpg'
  }
]

// 射手榜
const scorers = [
  { rank: 1, playerId: 101, playerName: '哈里·凯恩', teamId: 7, teamName: '英格兰', teamCrest: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', goals: 6, assists: 2, playedGames: 5, photo: '' },
  { rank: 2, playerId: 102, playerName: '基利安·姆巴佩', teamId: 8, teamName: '法国', teamCrest: '🇫🇷', goals: 5, assists: 3, playedGames: 5, photo: '' },
  { rank: 3, playerId: 103, playerName: '莱昂内尔·梅西', teamId: 9, teamName: '阿根廷', teamCrest: '🇦🇷', goals: 4, assists: 3, playedGames: 5, photo: '' },
  { rank: 4, playerId: 104, playerName: '克里斯蒂亚诺·罗纳尔多', teamId: 10, teamName: '葡萄牙', teamCrest: '🇵🇹', goals: 3, assists: 2, playedGames: 5, photo: '' },
  { rank: 5, playerId: 105, playerName: '内马尔', teamId: 11, teamName: '巴西', teamCrest: '🇧🇷', goals: 3, assists: 4, playedGames: 5, photo: '' }
]

// 球队列表 (部分)
const allTeams = [
  {
    id: 1, name: '阿根廷', nameEn: 'Argentina', flag: '🇦🇷', group: 'A',
    nickname: '潘帕斯雄鹰', starPlayer: '梅西',
    tags: ['南美双雄', '梅西', '冠军热门'],
    goldQuote: '阿根廷的球风华丽且充满激情，每一次进攻都是一场视觉盛宴。',
    ranking: 'FIFA排名第1'
  },
  {
    id: 2, name: '葡萄牙', nameEn: 'Portugal', flag: '🇵🇹', group: 'A',
    nickname: '五盾军团', starPlayer: 'C罗',
    tags: ['欧洲劲旅', 'C罗', '攻击力强大'],
    goldQuote: '葡萄牙的技术流打法令人赏心悦目。',
    ranking: 'FIFA排名第3'
  },
  {
    id: 3, name: '巴西', nameEn: 'Brazil', flag: '🇧🇷', group: 'B',
    nickname: '桑巴军团', starPlayer: '内马尔',
    tags: ['五星巴西', '技术华丽', '永远的热门'],
    goldQuote: '巴西队不只是踢球，他们是在跳桑巴舞。',
    ranking: 'FIFA排名第2'
  },
  {
    id: 4, name: '法国', nameEn: 'France', flag: '🇫🇷', group: 'B',
    nickname: '高卢雄鸡', starPlayer: '姆巴佩',
    tags: ['卫冕冠军', '阵容豪华', '年轻天才'],
    goldQuote: '法国队的速度和力量让任何防线胆寒。',
    ranking: 'FIFA排名第4'
  },
  {
    id: 5, name: '德国', nameEn: 'Germany', flag: '🇩🇪', group: 'C',
    nickname: '日耳曼战车', starPlayer: '维尔茨',
    tags: ['传统豪强', '铁血纪律', '大赛经验'],
    goldQuote: '德国战车一旦启动，谁也挡不住。',
    ranking: 'FIFA排名第6'
  },
  {
    id: 6, name: '西班牙', nameEn: 'Spain', flag: '🇪🇸', group: 'C',
    nickname: '斗牛士军团', starPlayer: '亚马尔',
    tags: ['传控大师', '技术细腻', '青年近卫军'],
    goldQuote: '西班牙的tiki-taka让对手只能跟着跑。',
    ranking: 'FIFA排名第5'
  }
]

// 球队详情
const teamDetail = {
  id: 1, name: '阿根廷', flag: '🇦🇷', group: 'A',
  nickname: '潘帕斯雄鹰', starPlayer: '梅西',
  description: '阿根廷国家足球队是世界上最成功、最受支持的国家队之一，共获得3次世界杯冠军(1978/1986/2022)、16次美洲杯冠军等荣誉。',
  goldQuote: '阿根廷的球风华丽且充满激情，每一次进攻都是一场视觉盛宴。',
  players: [
    { playerId: 201, name: '梅西', position: '前锋', quote: '球王归来，为最后的世界杯而战' },
    { playerId: 202, name: '迪马利亚', position: '边锋', quote: '天使之翼，关键时刻的终结者' },
    { playerId: 203, name: '德保罗', position: '中场', quote: '中场绞肉机，梅西的最佳保镖' },
    { playerId: 204, name: '劳塔罗·马丁内斯', position: '前锋', quote: '国米锋霸，禁区内的杀手' }
  ],
  rivalries: [
    { opponent: '巴西', opponentFlag: '🇧🇷', description: '南美双雄之争，几十年的宿敌，每次相遇都是火星撞地球' },
    { opponent: '英格兰', opponentFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', description: '1986年马拉多纳的上帝之手和世纪进球让两队结下梁子' }
  ]
}

// 球员详情
const playerDetail = {
  id: 201,
  name: '莱昂内尔·梅西',
  firstName: 'Lionel',
  lastName: 'Messi',
  age: 38,
  photo: '/images/players/messi.png',
  nationality: '阿根廷 🇦🇷',
  position: '右边锋 / 前腰',
  team: { id: 1, name: '阿根廷', logo: '🇦🇷' },
  statistics: {
    appearances: 180, lineups: 175, minutes: 15200,
    goals: 112, assists: 56,
    yellowCards: 24, redCards: 1
  },
  profile: '里奥·梅西，被公认为史上最伟大的足球运动员之一，曾8次获得金球奖。2022年带领阿根廷夺得世界杯冠军，圆梦卡塔尔。',
  quotes: [
    '我从小就知道自己会成为一名职业足球运动员。',
    '我不需要用冠军来证明什么，但我想赢得一切。',
    '足球就是我的生命。'
  ]
}

// 积分榜
const standings = [
  { group: 'A', teams: [{ pos: 1, name: '阿根廷', played: 3, won: 3, drawn: 0, lost: 0, gf: 7, ga: 1, gd: +6, pts: 9 }] },
  { group: 'B', teams: [{ pos: 1, name: '巴西', played: 3, won: 2, drawn: 1, lost: 0, gf: 6, ga: 2, gd: +4, pts: 7 }] }
]

// 推荐球员 (从各队明星球员中提取)
const recommendPlayers = [
  { playerId: 201, name: '梅西', position: '前锋', quote: '球王归来，为最后的世界杯而战', teamName: '阿根廷', teamFlag: '🇦🇷' },
  { playerId: 202, name: 'C罗', position: '前锋', quote: '永不言弃的传奇，最后一届世界杯', teamName: '葡萄牙', teamFlag: '🇵🇹' },
  { playerId: 203, name: '姆巴佩', position: '前锋', quote: '新一代球王，速度与力量的化身', teamName: '法国', teamFlag: '🇫🇷' },
  { playerId: 204, name: '内马尔', position: '边锋', quote: '桑巴舞者，巴西队的灵魂人物', teamName: '巴西', teamFlag: '🇧🇷' },
  { playerId: 205, name: '维尔茨', position: '中场', quote: '德国新生代天才，日耳曼战车新引擎', teamName: '德国', teamFlag: '🇩🇪' },
  { playerId: 206, name: '亚马尔', position: '边锋', quote: '16岁天才少年，西班牙未来希望', teamName: '西班牙', teamFlag: '🇪🇸' },
  { playerId: 207, name: '哈里·凯恩', position: '前锋', quote: '英格兰队长，射手榜常客', teamName: '英格兰', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { playerId: 208, name: '迪马利亚', position: '边锋', quote: '天使之翼，关键时刻的终结者', teamName: '阿根廷', teamFlag: '🇦🇷' }
]

module.exports = {
  todayMatches,
  liveMatches,
  allMatches: todayMatches,
  standings,
  newsList,
  scorers,
  allTeams,
  teamDetail,
  playerDetail,
  recommendPlayers
}

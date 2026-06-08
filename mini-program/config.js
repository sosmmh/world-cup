// config.js - 环境配置中心
module.exports = {
  // ========== 数据源适配器配置 ==========
  // 'cloud' = 云开发模式 (当前使用)
  // 'mock'  = 模拟数据模式 (本地开发调试)
  // 'http'  = 自建后端模式 (迁移时切换)
  adapter: 'cloud',

  // ========== 云开发配置 ==========
  cloud: {
    env: 'cloud1-d9ggl0zmj3ead091b',   // 替换为实际值，如 'cloud1-xxxxx'
    traceUser: true
  },

  // ========== 后端配置 [预留] ==========
  http: {
    baseUrl: 'https://api.yourdomain.com',
    timeout: 10000,
    tokenKey: 'token'
  },

  // ========== 第三方API配置 ==========
  apis: {
    footballData: {
      baseUrl: 'https://api.football-data.org/v4',
      apiKey: 'b997520e767f49c289a6f5b26b6e732c',
      rateLimit: 10
    },
    apiFootball: {
      baseUrl: 'https://v3.football.api-sports.io',
      apiKey: 'YOUR_API_FOOTBALL_KEY',
      rateLimit: 10
    },
    theSportsDB: {
      baseUrl: 'https://www.thesportsdb.com/api/v1/json/3'
    }
  },

  // ========== 广告单元ID配置 ==========
  ad: {
    bannerHome: 'adunit-xxxxxxxx',
    bannerToolDetail: 'adunit-xxxxxxxx',
    interstitialMBTI: 'adunit-xxxxxxxx',
    rewardedVideo: 'adunit-xxxxxxxx'
  },

  // ========== 埋点配置 ==========
  tracker: {
    enabled: true,
    batchSize: 10,
    flushInterval: 30000
  },

  // ========== 缓存策略配置 (单位: 分钟) ==========
  cache: {
    hotTopics: 5,
    schedule: 15,
    liveScore: 1,
    standings: 10,
    news: 10,
    teams: 1440
  },

  // ========== 业务配置 ==========
  app: {
    fbtiQuestionCount: 32,        // FBTI 2.0 固定32题（30常规+2隐藏）
    maxFavoriteCount: 50,
    testHistoryMaxCount: 20
  }
}

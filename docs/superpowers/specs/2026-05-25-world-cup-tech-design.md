# 世界杯装懂指南 - 技术设计方案

> **版本**: v1.1
> **日期**: 2026-05-25
> **状态**: 待评审
> **更新说明**: v1.1 同步 PRD-V2 新增内容 — 工具箱混合模式 / 广告变现 / 裂变增长 / 埋点体系

---

## 一、技术选型总览

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **前端框架** | 微信小程序原生 (WXML + WXSS + JS) | 无额外框架依赖 |
| **后端服务** | 微信云开发 (Serverless) | 云函数 + 云数据库 + 云存储 |
| **第三方API** | Football-Data.org / API-Football / TheSportsDB / 聚合数据 | 赛程/比分/积分榜/新闻/射手榜等动态数据 |
| **迁移预留** | 前端适配器模式 | 支持 cloud / http 双通道切换 |
| **广告变现** | 微信流量主 | Banner / 插屏 / 激励视频 |
| **数据分析** | 自定义埋点 + 微信后台数据 | 行为追踪与增长分析 |

---

## 二、整体架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                   微信小程序客户端                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │                  Pages 层                       │ │
│  │  index / teams / team-detail / player-detail   │ │
│  │  schedule / news / mbti / mbti-result          │ │
│  │  tools / tool-detail / profile                 │ │
│  └──────────────────────┬─────────────────────────┘ │
│                         │                           │
│  ┌──────────────────────▼─────────────────────────┐ │
│  │               Services 层 (业务服务)             │ │
│  │   footballService.js / userService.js           │ │
│  │   teamService.js / toolService.js               │ │
│  └──────────────────────┬─────────────────────────┘ │
│                         │                           │
│  ┌──────────────────────▼─────────────────────────┐ │
│  │            Adapters 层 (数据适配器)              │ │
│  │  ┌─────────────┐    ┌─────────────┐            │ │
│  │  │CloudAdapter │    │HttpAdapter  │ [预留]     │ │
│  │  └──────┬──────┘    └──────┬──────┘            │ │
│  └─────────┼──────────────────┼────────────────────┘ │
└────────────┼──────────────────┼─────────────────────┘
             │                  │
             ▼                  ▼
┌────────────────────┐  ┌────────────────────┐
│    微信云开发        │  │  Java后端 [预留]    │
│                    │  │                    │
│  ┌──────────────┐  │  │  SpringBoot       │
│  │  云函数层     │  │  │  PostgreSQL      │
│  ├──────────────┤  │  │  Redis           │
│  │getFootballData│  │  └─────────────────┘
│  │userService   │  │
│  │teamService   │  │
│  └──────┬───────┘  │
│         ▼          │
│  ┌──────────────┐  │
│  │  云数据库      │  │
│  ├──────────────┤  │
│  │teams         │  │
│  │users         │  │
│  │favorites     │  │
│  │test_results  │  │
│  │news_cache    │  │
│  └──────────────┘  │
└────────────────────┘
```

### 2.2 数据流向图

```
┌──────────┐    HTTP代理     ┌──────────────┐
│ 第三方API │ ◄─────────────► │   云函数       │
│Football-Data              │ getFootballData│
│TheSportsDB                │               │
│聚合数据                     └──────┬────────┘
└──────────┘                      │
                                   │ 写入
                                   ▼
                          ┌──────────────┐
                          │   云数据库      │
                          │  (缓存+持久化)  │
                          └──────┬────────┘
                                 │ 读取
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │云函数返回  │ │本地缓存   │ │本地JS文件 │
              │(实时数据)  │ │(过期兜底)  │ │(静态数据)  │
              └──────────┘ └──────────┘ └──────────┘
```

---

## 三、项目目录结构

```
world-cup/
├── miniprogram/
│   ├── app.js                    # 小程序入口
│   ├── app.json                  # 全局配置 (页面路由/TabBar)
│   ├── app.wxss                  # 全局样式 (主题色/通用组件样式)
│   │
│   ├── config.js                 # 环境配置 (adapter切换/API Key/缓存时长)
│   │
│   ├── adapters/                 # 数据适配器层 (多实现)
│   │   ├── index.js              # 适配器工厂: 根据config返回对应实例
│   │   ├── cloudAdapter.js       # 云开发实现: wx.cloud.callFunction
│   │   └── httpAdapter.js        # 后端实现[预留]: wx.request封装
│   │
│   ├── services/                 # 业务服务层 (调用adapters, 不关心底层)
│   │   ├── footballService.js    # 足球数据: 赛程/比分/积分榜/新闻/射手榜
│   │   ├── userService.js        # 用户服务: 收藏/测试记录/关注
│   │   ├── teamService.js        # 球队服务: 48强百科/球队详情
│   │   └── toolService.js        # 工具箱: 本地工具(黑话/恩怨等) + 实时工具(积分榜/赛程/比分/新闻/球员数据/球队数据)
│   │
│   ├── utils/                    # 工具函数
│   │   ├── request.js            # 统一请求封装 (错误处理/重试/loading)
│   │   ├── cache.js              # 本地缓存管理 (读写/过期检查)
│   │   ├── share.js              # 分享工具 (生成分享卡片/文案/海报)
│   │   ├── mbti.js               # MBTI计分引擎 (抽题/评分/结果判定)
│   │   └── tracker.js            # 埋点上报工具 (事件采集/批量上报)
│   │
│   ├── data/                     # 静态本地数据 (小而稳定的内容)
│   │   ├── slangData.js          # 黑话词典 20条
│   │   ├── memeData.js           # 经典梗图 8个
│   │   ├── quotesData.js         # 赛后话术 24条
│   │   ├── nicknamesData.js      # 球员绰号 12个
│   │   ├── offsideData.js        # 越位规则 4种
│   │   ├── rivalryData.js        # 球队恩怨录 6组
│   │   ├── mbtiQuestions.js      # MBTI题目 40题
│   │   └── mbtiResults.js        # MBTI结果详情 10种
│   │
│   ├── pages/                    # 页面目录
│   │   ├── index/                # 首页 (热点+今日赛程+实时比分+黑话+推荐球员)
│   │   ├── schedule/             # 赛程赛果 (完整赛程+实时比分+积分榜+筛选)
│   │   ├── teams/                # 球队百科 (48强列表+搜索+分组)
│   │   ├── team-detail/          # 球队详情 (信息+近期赛程+球员列表+恩怨录)
│   │   ├── player-detail/        # 球员详情 (信息+近期表现+收藏功能)
│   │   ├── news/                 # 新闻资讯 (新闻列表+分类筛选+详情)
│   │   ├── mbti/                 # MBTI测试 (15题随机测试+实时计分)
│   │   ├── mbti-result/          # 测试结果 (结果展示+装懂金句+社交分享)
│   │   ├── tools/                # 速成工具箱 (6大工具入口)
│   │   ├── tool-detail/          # 工具详情页 (具体工具详细内容)
│   │   └── profile/              # 个人中心 (收藏记录+测试历史+关注)
│   │
│   ├── images/                   # 图片资源
│   │   ├── tabbar/               # TabBar图标 (5tab x 2状态 = 10张)
│   │   ├── teams/                # 球队国旗/Logo
│   │   ├── players/              # 球员头像
│   │   └── memes/                # 梗图资源
│   │
│   └── components/               # 自定义组件
│       ├── match-card/           # 比赛卡片组件
│       ├── team-card/            # 球队卡片组件
│       ├── player-card/          # 球员卡片组件
│       ├── news-card/            # 新闻卡片组件
│       ├── result-card/          # 测试结果卡片组件
│       └── ad-banner/            # 广告Banner组件 (流量主)
│       └── ad-interstitial/      # 插屏广告组件 (流量主)
│
├── cloudfunctions/               # 云函数目录
│   ├── getFootballData/          # 足球数据代理函数
│   │   ├── index.js              # 主入口 (路由分发到不同API)
│   │   ├── package.json          # 依赖配置
│   │   └── config.json           # 云函数权限配置
│   │
│   └── userService/              # 用户服务函数
│       ├── index.js              # 主入口 (收藏/测试记录/用户信息)
│       ├── package.json
│       └── config.json
│
├── database/                     # 云数据库初始化脚本
│   ├── init_teams.json           # 48强球队数据导入
│   └── init_collection.rules.json # 数据库权限规则
│
├── docs/                         # 项目文档
│   └── PRD.md                    # 产品需求文档
│
├── project.config.json           # 项目配置文件
└── README.md                     # 项目说明
```

---

## 四、核心模块详细设计

### 4.1 配置管理 (config.js)

```javascript
// config.js - 环境配置中心
module.exports = {
  // ========== 数据源适配器配置 ==========
  // 'cloud' = 云开发模式 (当前使用)
  // 'http'  = 自建后端模式 (迁移时切换)
  adapter: 'cloud',

  // ========== 云开发配置 ==========
  cloud: {
    env: 'your-env-id',           // 云环境ID
    traceUser: true               // 是否跟踪用户
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
      apiKey: 'YOUR_API_KEY',     // 从云函数环境变量读取更安全
      rateLimit: 10                // 免费版: 10次/分钟
    },
    apiFootball: {                  // [V2新增] 备选数据源, 中文支持更好
      baseUrl: 'https://v3.football.api-sports.io',
      apiKey: 'YOUR_API_FOOTBALL_KEY',
      rateLimit: 10                 // 免费版: 10次/分钟
    },
    theSportsDB: {
      baseUrl: 'https://www.thesportsdb.com/api/v1/json/3'
    },
    juhe: {
      baseUrl: 'https://op.juhe.cn',
      apiKey: 'YOUR_JUHE_KEY'     // 可选
    }
  },

  // ========== 广告单元ID配置 [V2新增] ==========
  ad: {
    bannerHome: 'adunit-xxxxxxxx',       // 首页Banner广告
    bannerToolDetail: 'adunit-xxxxxxxx', // 工具详情页Banner
    interstitialMBTI: 'adunit-xxxxxxxx', // MBTI结果页插屏
    rewardedVideo: 'adunit-xxxxxxxx'     // 激励视频(解锁内容/抽奖)
  },

  // ========== 埋点配置 [V2新增] ==========
  tracker: {
    enabled: true,
    batchSize: 10,               // 累积10条上报一次
    flushInterval: 30000         // 或30秒强制上报
  },

  // ========== 缓存策略配置 (单位: 分钟) ==========
  cache: {
    hotTopics: 5,                 // 热点数据 5分钟
    schedule: 15,                 // 赛程数据 15分钟
    liveScore: 1,                 // 实时比分 1分钟
    standings: 10,                // 积分榜 10分钟
    news: 10,                     // 新闻 10分钟
    teams: 1440,                  // 球队数据 24小时 (变化少)
    staticData: 43200             // 静态数据 30天 (几乎不变)
  },

  // ========== 业务配置 ==========
  app: {
    mbtiQuestionCount: 15,        // MBTI每次抽题数 (从40题库中随机)
    maxFavoriteCount: 50,         // 最大收藏数
    testHistoryMaxCount: 20       // 测试历史最大保留数
  }
}
```

### 4.2 适配器层设计 (adapters/)

#### 4.2.1 适配器接口规范

所有适配器必须实现的统一方法签名：

```javascript
/**
 * IDataAdapter 接口规范
 * 所有适配器必须实现以下方法，保证调用方无感知切换
 */
class IDataAdapter {
  /**
   * 调用远程服务
   * @param {string} api - 服务标识 (如 'football', 'user', 'team')
   * @param {string} action - 操作类型 (如 'todayMatches', 'addFavorite')
   * @param {Object} data - 请求数据
   * @returns {Promise<Object>} 标准响应 { code, message, data }
   */
  async call(api, action, data) {}
}
```

#### 4.2.2 适配器工厂 (adapters/index.js)

```javascript
// adapters/index.js
const config = require('../config')

let _instance = null

function getAdapter() {
  if (!_instance) {
    const adapterType = config.adapter
    if (adapterType === 'cloud') {
      const CloudAdapter = require('./cloudAdapter')
      _instance = new CloudAdapter()
    } else if (adapterType === 'http') {
      const HttpAdapter = require('./httpAdapter')
      _instance = new HttpAdapter()
    } else {
      throw new Error(`未知的适配器类型: ${adapterType}`)
    }
  }
  return _instance
}

module.exports = { getAdapter }
```

#### 4.2.3 云开发适配器 (adapters/cloudAdapter.js)

```javascript
// adapters/cloudAdapter.js
class CloudAdapter {
  async call(api, action, data = {}) {
    try {
      const res = await wx.cloud.callFunction({
        name: api,
        data: { action, ...data }
      })

      // 统一响应格式处理
      if (res.result && res.result.code === 0) {
        return {
          code: 0,
          message: 'success',
          data: res.result.data
        }
      }

      return {
        code: res.result?.code || -1,
        message: res.result?.message || '请求失败',
        data: null
      }
    } catch (error) {
      console.error('[CloudAdapter] 调用失败:', error)
      return {
        code: -1,
        message: error.message || '网络请求异常',
        data: null
      }
    }
  }
}

module.exports = CloudAdapter
```

#### 4.2.4 HTTP适配器预留 (adapters/httpAdapter.js)

```javascript
// adapters/httpAdapter.js - 迁移到Java后端时实现
const config = require('../config')

class HttpAdapter {
  async call(api, action, data = {}) {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${config.http.baseUrl}/${api}/${action}`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
          },
          data: data,
          success: resolve,
          fail: reject
        })
      })

      if (res.statusCode === 200 && res.data.code === 0) {
        return {
          code: 0,
          message: 'success',
          data: res.data.data
        }
      }

      return {
        code: res.data?.code || -1,
        message: res.data?.message || '请求失败',
        data: null
      }
    } catch (error) {
      console.error('[HttpAdapter] 调用失败:', error)
      return {
        code: -1,
        message: error.message || '网络请求异常',
        data: null
      }
    }
  }
}

module.exports = HttpAdapter
```

### 4.3 服务层设计 (services/)

#### 4.3.1 足球数据服务 (services/footballService.js)

```javascript
// services/footballService.js
const { getAdapter } = require('../adapters')
const cacheManager = require('../utils/cache')
const config = require('../config')

const CACHE_PREFIX = {
  HOT_TOPICS: 'cache_hot_topics_',
  SCHEDULE: 'cache_schedule_',
  LIVE_SCORE: 'cache_live_score_',
  STANDINGS: 'cache_standings_',
  NEWS: 'cache_news_',
  SCORERS: 'cache_scorers_',           // [V2新增] 射手榜
  PLAYER_INFO: 'cache_player_info_',   // [V2新增] 球员详情
  TEAM_INFO: 'cache_team_info_'        // [V2新增] 球队实时数据
}

const footballService = {
  /**
   * 获取今日赛程
   * 缓存策略: 15分钟
   */
  async getTodayMatches(forceRefresh = false) {
    const cacheKey = CACHE_PREFIX.SCHEDULE + 'today'

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, config.cache.schedule)
      if (cached) return cached
    }

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'todayMatches', {})

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.schedule)
    }

    return res
  },

  /**
   * 获取实时比分
   * 缓存策略: 1分钟 (高频刷新)
   */
  async getLiveScore() {
    const cacheKey = CACHE_PREFIX.LIVE_SCORE
    const cached = cacheManager.get(cacheKey, config.cache.liveScore)
    if (cached) return cached

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'liveScore', {})

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.liveScore)
    }

    return res
  },

  /**
   * 获取完整赛程 (支持日期/小组筛选)
   */
  async getSchedule(params = {}) {
    const cacheKey = CACHE_PREFIX.SCHEDULE + JSON.stringify(params)
    const cached = cacheManager.get(cacheKey, config.cache.schedule)
    if (cached) return cached

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'schedule', params)

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.schedule)
    }

    return res
  },

  /**
   * 获取小组积分榜
   */
  async getStandings(groupName = null) {
    const cacheKey = CACHE_PREFIX.STANDINGS + (groupName || 'all')
    const cached = cacheManager.get(cacheKey, config.cache.standings)
    if (cached) return cached

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'standings', { group: groupName })

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.standings)
    }

    return res
  },

  /**
   * 获取热点新闻
   */
  async getHotNews(category = null, page = 1, pageSize = 10) {
    const cacheKey = CACHE_PREFIX.NEWS + `${category || 'all'}_${page}`
    const cached = cacheManager.get(cacheKey, config.cache.news)
    if (cached) return cached

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'news', { category, page, pageSize })

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.news)
    }

    return res
  },

  // ==================== [V2新增] 实时数据API ====================

  /**
   * 获取射手榜/金靴榜
   * 缓存策略: 30分钟 (比赛日可缩短到10分钟)
   */
  async getScorers(leagueId = null, season = null) {
    const cacheKey = CACHE_PREFIX.SCORERS + `${leagueId || 'wc'}_${season || '2026'}`
    const cached = cacheManager.get(cacheKey, config.cache.standings || 30)
    if (cached) return cached

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'scorers', { leagueId, season })

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.standings || 30)
    }

    return res
  },

  /**
   * 搜索球员 [V2新增]
   * @param {string} keyword - 搜索关键词(球员名)
   * @param {number} page - 页码
   */
  async searchPlayers(keyword, page = 1, pageSize = 20) {
    const adapter = getAdapter()
    return await adapter.call('getFootballData', 'searchPlayers', { keyword, page, pageSize })
  },

  /**
   * 搜索球队 [V2新增]
   * @param {string} keyword - 搜索关键词(球队名)
   */
  async searchTeams(keyword) {
    const adapter = getAdapter()
    return await adapter.call('getFootballData', 'searchTeams', { keyword })
  },

  /**
   * 获取球员实时详情数据 [V2新增]
   * 包含: 统计数据(进球/助攻/出场)、所属球队、近期比赛
   */
  async getPlayerInfo(playerId) {
    const cacheKey = CACHE_PREFIX.PLAYER_INFO + playerId
    const cached = cacheManager.get(cacheKey, config.cache.schedule) // 复用赛程缓存时长
    if (cached) return cached

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'playerInfo', { playerId })

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.schedule)
    }

    return res
  },

  /**
   * 获取球队实时数据 [V2新增]
   * 包含: 近期战绩、阵容、积分榜排名等
   */
  async getTeamRealtimeData(teamId) {
    const cacheKey = CACHE_PREFIX.TEAM_INFO + teamId
    const cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return cached

    const adapter = getAdapter()
    const res = await adapter.call('getFootballData', 'teamInfo', { teamId })

    if (res.code === 0) {
      cacheManager.set(cacheKey, res.data, config.cache.teams)
    }

    return res
  },

  /**
   * 清除指定类型的缓存 (用于手动刷新)
   */
  clearCache(type) {
    const prefixMap = {
      hotTopics: CACHE_PREFIX.HOT_TOPICS,
      schedule: CACHE_PREFIX.SCHEDULE,
      liveScore: CACHE_PREFIX.LIVE_SCORE,
      standings: CACHE_PREFIX.STANDINGS,
      news: CACHE_PREFIX.NEWS,
      scorers: CACHE_PREFIX.SCORERS,           // [V2新增]
      playerInfo: CACHE_PREFIX.PLAYER_INFO,     // [V2新增]
      teamInfo: CACHE_PREFIX.TEAM_INFO          // [V2新增]
    }
    const prefix = prefixMap[type]
    if (prefix) {
      cacheManager.clearByPrefix(prefix)
    }
  }
}

module.exports = footballService
```

#### 4.3.2 用户服务 (services/userService.js)

```javascript
// services/userService.js
const { getAdapter } = require('../adapters')
const config = require('../config')

const userService = {
  /**
   * 收藏/取消收藏球员
   */
  async toggleFavorite(playerInfo) {
    const adapter = getAdapter()
    return await adapter.call('userService', 'toggleFavorite', playerInfo)
  },

  /**
   * 获取收藏的球员列表
   */
  async getFavorites() {
    const adapter = getAdapter()
    return await adapter.call('userService', 'getFavorites', {})
  },

  /**
   * 检查是否已收藏某球员
   */
  async isFavorited(playerId) {
    const adapter = getAdapter()
    return await adapter.call('userService', 'isFavorited', { playerId })
  },

  /**
   * 保存MBTI测试结果
   */
  async saveTestResult(result) {
    const adapter = getAdapter()
    return await adapter.call('userService', 'saveTestResult', result)
  },

  /**
   * 获取测试历史记录
   */
  async getTestHistory(limit = 20) {
    const adapter = getAdapter()
    return await adapter.call('userService', 'getTestHistory', { limit })
  },

  /**
   * 关注/取消关注球队
   */
  async toggleFollowTeam(teamInfo) {
    const adapter = getAdapter()
    return await adapter.call('userService', 'toggleFollowTeam', teamInfo)
  },

  /**
   * 获取关注的球队列表
   */
  async getFollowedTeams() {
    const adapter = getAdapter()
    return await adapter.call('userService', 'getFollowedTeams', {})
  }
}

module.exports = userService
```

#### 4.3.3 球队服务 (services/teamService.js)

```javascript
// services/teamService.js
const { getAdapter } = require('../adapters')
const cacheManager = require('../utils/cache')
const config = require('../config')
const teamsLocalData = require('../data/teamsData') // 备用: 如果云数据库不可用

const TEAM_CACHE_KEY = 'cache_all_teams'

const teamService = {
  /**
   * 获取全部48支球队
   * 优先从云数据库获取，失败则降级到本地数据
   */
  async getAllTeams(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = cacheManager.get(TEAM_CACHE_KEY, config.cache.teams)
      if (cached) return cached
    }

    const adapter = getAdapter()
    
    try {
      const res = await adapter.call('userService', 'getAllTeams', {})
      
      if (res.code === 0 && res.data && res.data.length > 0) {
        cacheManager.set(TEAM_CACHE_KEY, res.data, config.cache.teams)
        return res
      }
    } catch (e) {
      console.warn('[teamService] 云数据库获取失败, 使用本地备用数据:', e.message)
    }

    // 降级: 返回本地数据
    return {
      code: 0,
      message: 'success (local fallback)',
      data: teamsLocalData
    }
  },

  /**
   * 搜索球队 (按名称/标签/球星搜索)
   */
  async searchTeams(keyword) {
    const allRes = await this.getAllTeams()
    if (allRes.code !== 0) return allRes

    const keywordLower = keyword.toLowerCase()
    const filtered = allRes.data.filter(team => 
      team.name.toLowerCase().includes(keywordLower) ||
      team.nickname?.toLowerCase().includes(keywordLower) ||
      team.starPlayer?.toLowerCase().includes(keywordLower) ||
      team.tags?.some(tag => tag.toLowerCase().includes(keywordLower))
    )

    return { code: 0, data: filtered }
  },

  /**
   * 获取按分组排列的球队
   */
  async getTeamsByGroup() {
    const allRes = await this.getAllTeams()
    if (allRes.code !== 0) return allRes

    const grouped = {}
    for (const team of allRes.data) {
      const group = team.group
      if (!grouped[group]) {
        grouped[group] = []
      }
      grouped[group].push(team)
    }

    return { code: 0, data: grouped }
  },

  /**
   * 获取单支球队详细信息 (含球员列表/恩怨录/近期赛程)
   */
  async getTeamDetail(teamId) {
    const adapter = getAdapter()

    // 并行请求: 球队详情 + 近期赛程
    const [detailRes, matchesRes] = await Promise.all([
      adapter.call('userService', 'getTeamDetail', { teamId }),
      adapter.call('getFootballData', 'teamMatches', { teamId })
    ])

    return {
      code: detailRes.code === 0 ? 0 : -1,
      data: {
        ...detailRes.data,
        recentMatches: matchesRes.data
      }
    }
  }
}

module.exports = teamService
```

### 4.4 云函数设计 (cloudfunctions/)

#### 4.4.1 getFootballData 云函数

```javascript
// cloudfunctions/getFootballData/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios') // 需要npm install
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 第三方API配置 (建议通过云函数环境变量设置, 不要硬编码)
const APIS = {
  footballData: {
    baseUrl: process.env.FOOTBALL_DATA_URL || 'https://api.football-data.org/v4',
    apiKey: process.env.FOOTBALL_DATA_API_KEY || ''
  },
  apiFootball: {                      // [V2新增] API-Football 数据源
    baseUrl: 'https://v3.football.api-sports.io',
    apiKey: process.env.API_FOOTBALL_KEY || ''
  },
  theSportsDB: {
    baseUrl: 'https://www.thesportsdb.com/api/v1/json/3'
  }
}

exports.main = async (event, context) => {
  const { action, params = {} } = event

  try {
    switch (action) {
      // ========== 基础数据 ==========
      case 'todayMatches':
        return await getTodayMatches(params)

      case 'liveScore':
        return await getLiveScore()

      case 'schedule':
        return await getSchedule(params)

      case 'standings':
        return await getStandings(params)

      case 'teamMatches':
        return await getTeamMatches(params)

      case 'news':
        return await getNews(params)

      // ========== [V2新增] 实时数据扩展 ==========
      case 'scorers':
        return await getScorers(params)

      case 'playerInfo':
        return await getPlayerInfo(params)

      case 'teamInfo':
        return await getTeamInfo(params)

      case 'searchPlayers':
        return await searchPlayers(params)

      case 'searchTeams':
        return await searchTeams(params)

      default:
        return { code: -1, message: `未知操作: ${action}` }
    }
  } catch (error) {
    console.error('[getFootballData] 错误:', error)
    return { code: -1, message: error.message }
  }
}

// ---------- 具体API实现 ----------

async function getTodayMatches(params) {
  // 先查缓存集合
  const cacheCollection = db.collection('api_cache')
  const cacheDoc = await cacheCollection.where({
    type: 'todayMatches',
    expireAt: _.gt(new Date())
  }).orderBy('expireAt', 'desc').limit(1).get()

  if (cacheDoc.data && cacheDoc.data.length > 0) {
    return { code: 0, data: JSON.parse(cacheDoc.data[0].content), source: 'cache' }
  }

  // 缓存没有或过期, 调用外部API
  const response = await axios.get(`${APIS.footballData.baseUrl}/matches`, {
    headers: { 'X-Auth-Token': APIS.footballData.apiKey },
    params: {
      status: 'SCHEDULED,LIVE,PAUSED,FINISHED',
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    },
    timeout: 8000
  })

  const matches = transformMatches(response.data.matches)

  // 写入缓存 (15分钟)
  await cacheCollection.add({
    data: {
      type: 'todayMatches',
      content: JSON.stringify(matches),
      expireAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date()
    }
  })

  return { code: 0, data: matches, source: 'api' }
}

async function getLiveScore() {
  const response = await axios.get(`${APIS.footballData.baseUrl}/matches`, {
    headers: { 'X-Auth-Token': APIS.footballData.apiKey },
    params: { status: 'LIVE' },
    timeout: 5000
  })
  
  return { code: 0, data: transformMatches(response.data.matches) }
}

async function getSchedule(params) {
  const response = await axios.get(
    `${APIS.footballData.baseUrl}/competitions/WC/matches`,
    {
      headers: { 'X-Auth-Token': APIS.footballData.apiKey },
      params: {
        ...(params.dateFrom && { dateFrom: params.dateFrom }),
        ...(params.dateTo && { dateTo: params.dateTo }),
        ...(params.group && {}) // 如果API支持group筛选
      },
      timeout: 8000
    }
  )
  
  return { code: 0, data: transformMatches(response.data.matches) }
}

async function getStandings(params) {
  const url = params?.group
    ? `${APIS.footballData.baseUrl}/competitions/WC/standings`
    : `${APIS.footballData.baseUrl}/competitions/WC/standings`
  
  const response = await axios.get(url, {
    headers: { 'X-Auth-Token': APIS.footballData.apiKey },
    timeout: 8000
  })
  
  return { code: 0, data: response.data.standings || [] }
}

async function getTeamMatches(params) {
  const response = await axios.get(
    `${APIS.footballData.baseUrl}/teams/${params.teamId}/matches`,
    {
      headers: { 'X-Auth-Token': APIS.footballData.apiKey },
      params: { limit: 5, status: 'FINISHED,SCHEDULED' },
      timeout: 8000
    }
  )
  
  return { code: 0, data: transformMatches(response.data.matches) }
}

async function getNews(params) {
  // 使用 TheSportsDB API 或其他新闻源
  const response = await axios.get(
    `${APIS.theSportsDB.baseUrl}/eventsseason.php`,
    { params: { id: 4328 }, timeout: 8000 }
  )

  return {
    code: 0,
    data: (response.data.events || []).map(event => ({
      id: event.idEvent,
      title: event.strEvent,
      description: event.strDescription,
      category: params.category || 'general',
      date: event.dateEvent,
      thumbnail: event.strThumb
    }))
  }
}

// ==================== [V2新增] 实时数据API实现 ====================

async function getScorers(params) {
  // 优先使用 API-Football (中文支持更好), 降级到 Football-Data
  try {
    if (APIS.apiFootball.apiKey) {
      const response = await axios.get(`${APIS.apiFootball.baseUrl}/players/topscorers`, {
        headers: { 'x-apisports-key': APIS.apiFootball.apiKey },
        params: {
          league: params.leagueId || 1,   // 世界杯league ID
          season: params.season || 2026
        },
        timeout: 8000
      })
      return { code: 0, data: transformScorers(response.data.response) }
    }
  } catch (e) {
    console.warn('[getScorers] API-Football失败, 尝试Football-Data:', e.message)
  }

  // 降级到 Football-Data
  const response = await axios.get(
    `${APIS.footballData.baseUrl}/competitions/WC/scorers`,
    {
      headers: { 'X-Auth-Token': APIS.footballData.apiKey },
      params: { limit: 20 },
      timeout: 8000
    }
  )
  return { code: 0, data: transformScorersFD(response.data.scorers) }
}

async function getPlayerInfo(params) {
  // 使用 API-Football 获取球员详情
  const response = await axios.get(`${APIS.apiFootball.baseUrl}/players`, {
    headers: { 'x-apisports-key': APIS.apiFootball.apiKey },
    params: { id: params.playerId, season: 2026 },
    timeout: 8000
  })

  const player = response.data.response?.[0]
  if (!player) {
    return { code: -1, message: '球员不存在' }
  }

  const stats = player.statistics?.[0] || {}
  return {
    code: 0,
    data: {
      id: player.player.id,
      name: player.player.name,
      firstName: player.player.firstname,
      lastName: player.player.lastname,
      age: player.player.age,
      photo: player.player.photo,
      nationality: player.player.nationality,
      team: {
        id: stats.team?.id,
        name: stats.team?.name,
        logo: stats.team?.logo
      },
      position: stats.games?.position,
      // 赛季统计
      statistics: {
        appearances: stats.games?.appearingance || 0,
        lineups: stats.games?.lineups || 0,
        minutes: stats.games?.minutes || 0,
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        yellowCards: stats.cards?.yellow || 0,
        redCards: stats.cards?.red || 0
      }
    }
  }
}

async function getTeamInfo(params) {
  // 使用 API-Football 获取球队实时信息
  const [infoRes, fixturesRes] = await Promise.all([
    axios.get(`${APIS.apiFootball.baseUrl}/teams`, {
      headers: { 'x-apisports-key': APIS.apiFootball.apiKey },
      params: { id: params.teamId },
      timeout: 8000
    }),
    axios.get(`${APIS.apiFootball.baseUrl}/fixtures`, {
      headers: { 'x-apisports-key': APIS.apiFootball.apiKey },
      params: { team: params.teamId, last: 5 },
      timeout: 8000
    })
  ])

  const team = infoRes.data.response?.[0]
  if (!team) {
    return { code: -1, message: '球队不存在' }
  }

  return {
    code: 0,
    data: {
      id: team.team.id,
      name: team.team.name,
      code: team.team.code,
      country: team.team.country,
      founded: team.team.founded,
      logo: team.team.logo,
      venue: team.venue ? {
        name: team.venue.name,
        city: team.venue.city,
        capacity: team.venue.capacity
      } : null,
      recentFixtures: (fixturesRes.data.response || []).map(f => transformFixture(f))
    }
  }
}

async function searchPlayers(params) {
  const response = await axios.get(`${APIS.apiFootball.baseUrl}/players`, {
    headers: { 'x-apisports-key': APIS.apiFootball.apiKey },
    params: {
      search: params.keyword,
      page: params.page || 1,
      pageSize: params.pageSize || 20
    },
    timeout: 8000
  })

  return {
    code: 0,
    data: {
      results: (response.data.response || []).map(p => ({
        id: p.player.id,
        name: p.player.name,
        photo: p.player.photo,
        nationality: p.player.nationality,
        age: p.player.age
      })),
      total: response.data.results || 0
    }
  }
}

async function searchTeams(params) {
  const response = await axios.get(`${APIS.apiFootball.baseUrl}/teams`, {
    headers: { 'x-apisports-key': APIS.apiFootball.apiKey },
    params: { search: params.keyword },
    timeout: 8000
  })

  return {
    code: 0,
    data: (response.data.response || []).map(t => ({
      id: t.team.id,
      name: t.team.name,
      code: t.team.code,
      country: t.team.country,
      logo: t.team.logo
    }))
  }
}

// ---------- 数据转换 ----------
function transformMatches(matches) {
  if (!matches) return []
  return matches.map(m => ({
    id: m.id,
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name,
      shortName: m.homeTeam.shortName,
      crest: m.homeTeam.crest
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name,
      shortName: m.awayTeam.shortName,
      crest: m.awayTeam.crest
    },
    score: {
      fullTime: m.score?.fullTime,
      halfTime: m.score?.halfTime
    },
    status: m.status,           // SCHEDULED/LIVE/PAUSED/FINISHED
    utcDate: m.utcDate,
    matchday: m.matchday,
    group: m.group,
    minute: m.minute            // 进行中的分钟数
  }))
}

// ---------- [V2新增] 射手榜数据转换 ----------
function transformScorers(scorers) {
  if (!scorers) return []
  return scorers.map((s, idx) => ({
    rank: idx + 1,
    playerId: s.player.id,
    playerName: s.player.name,
    teamId: s.team.id,
    teamName: s.team.name,
    teamCrest: s.team.crest,
    goals: s.goals || 0,
    assists: s.assists || 0,
    playedGames: s.playedGames || 0,
    photo: s.player.photo || ''
  }))
}

// Football-Data 格式的射手榜转换 (降级用)
function transformScorersFD(scorers) {
  if (!scorers) return []
  return scorers.map((s, idx) => ({
    rank: idx + 1,
    playerId: s.player?.id,
    playerName: s.player?.name,
    teamId: s.team?.id,
    teamName: s.team?.name,
    teamCrest: s.team?.crest,
    goals: s.goals || 0,
    assists: s.assists || 0,
    playedGames: s.playedGames || 0,
    photo: ''
  }))
}

// API-Football 比赛格式转换
function transformFixture(f) {
  return {
    id: f.fixture.id,
    status: f.fixture.status.short,           // NS/LIVE/FT
    date: f.fixture.date,
    venue: f.fixture.venue?.name,
    homeTeam: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
    awayTeam: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
    goals: { home: f.goals?.home, away: f.goals?.away }
  }
}
```

```json
// cloudfunctions/getFootballData/package.json
{
  "name": "getFootballData",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3",
    "axios": "^1.6.0"
  }
}
```

```json
// cloudfunctions/getFootballData/config.json
{
  "permissions": {
    "openapi": []
  }
}
```

#### 4.4.2 userService 云函数

```javascript
// cloudfunctions/userService/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const MAX_FAVORITES = 50
const TEST_HISTORY_MAX = 20

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openId = wxContext.OPENID
  const { action, data = {} } = event

  try {
    switch (action) {
      // ========== 收藏相关 ==========
      case 'toggleFavorite':
        return await toggleFavorite(openId, data)
      
      case 'getFavorites':
        return await getFavorites(openId)
      
      case 'isFavorited':
        return await isFavorited(openId, data.playerId)
      
      // ========== MBTI测试相关 ==========
      case 'saveTestResult':
        return await saveTestResult(openId, data)
      
      case 'getTestHistory':
        return await getTestHistory(openId, data.limit || TEST_HISTORY_MAX)
      
      // ========== 关注球队相关 ==========
      case 'toggleFollowTeam':
        return await toggleFollowTeam(openId, data)
      
      case 'getFollowedTeams':
        return await getFollowedTeams(openId)
      
      // ========== 球队数据相关 ==========
      case 'getAllTeams':
        return await getAllTeams(data)
      
      case 'getTeamDetail':
        return await getTeamDetail(data.teamId)
      
      default:
        return { code: -1, message: `未知操作: ${action}` }
    }
  } catch (error) {
    console.error('[userService] 错误:', error)
    return { code: -1, message: error.message }
  }
}

// ---------- 收藏功能 ----------

async function toggleFavorite(openId, playerInfo) {
  const favorites = db.collection('favorites')
  
  // 检查是否已存在
  const existing = await favorites.where({
    openId,
    playerId: playerInfo.playerId
  }).count()

  if (existing.total > 0) {
    // 已收藏 -> 取消收藏
    await favorites.where({
      openId,
      playerId: playerInfo.playerId
    }).remove()
    return { code: 0, data: { favorited: false }, message: '取消收藏成功' }
  } else {
    // 未收藏 -> 新增收藏
    // 检查数量限制
    const count = await favorites.where({ openId }).count()
    if (count.total >= MAX_FAVORITES) {
      return { code: -1, message: `最多只能收藏${MAX_FAVORITES}位球员` }
    }

    await favorites.add({
      data: {
        openId,
        playerId: playerInfo.playerId,
        playerName: playerInfo.playerName,
        team: playerInfo.team,
        position: playerInfo.position,
        avatar: playerInfo.avatar || '',
        favoritedAt: new Date()
      }
    })
    return { code: 0, data: { favorited: true }, message: '收藏成功' }
  }
}

async function getFavorites(openId) {
  const res = await db.collection('favorites')
    .where({ openId })
    .orderBy('favoritedAt', 'desc')
    .limit(MAX_FAVORITES)
    .get()
  
  return { code: 0, data: res.data }
}

async function isFavorited(openId, playerId) {
  const res = await db.collection('favorites')
    .where({ openId, playerId })
    .count()
  
  return { code: 0, data: { isFavorited: res.total > 0 } }
}

// ---------- MBTI测试记录 ----------

async function saveTestResult(openId, result) {
  const testResults = db.collection('test_results')
  
  const record = await testResults.add({
    data: {
      openId,
      resultType: result.resultType,       // 结果类型名称
      resultEnName: result.resultEnName,   // 英文名称
      score: result.score,                 // 得分
      percentage: result.percentage,       // 百分比
      answers: result.answers,             // 作答记录 [{questionIndex, option, score}]
      specialRole: result.specialRole || null, // 特殊角色(如有)
      testedAt: new Date(),
      shareText: result.shareText,         // 分享文案
      badge: result.badge,                 // 徽章
      color: result.color                  // 主题色
    }
  })

  // 异步清理超过数量限制的历史记录
  cleanOldTestHistory(openId).catch(e => console.warn('清理历史记录失败:', e))

  return { code: 0, data: { id: record._id }, message: '保存成功' }
}

async function getTestHistory(openId, limit) {
  const res = await db.collection('test_results')
    .where({ openId })
    .orderBy('testedAt', 'desc')
    .limit(limit)
    .get()

  return { code: 0, data: res.data }
}

// 辅助: 清理超出数量的旧记录
async function cleanOldTestHistory(openId) {
  const allRecords = await db.collection('test_results')
    .where({ openId })
    .orderBy('testedAt', 'asc') // 从最旧的开始删
    .field({ _id: true })
    .count()

  if (allRecords.total <= TEST_HISTORY_MAX) return

  // 获取需要删除的最旧记录
  const toDelete = await db.collection('test_results')
    .where({ openId })
    .orderBy('testedAt', 'asc')
    .limit(allRecords.total - TEST_HISTORY_MAX)
    .field({ _id: true })
    .get()

  // 批量删除
  for (const doc of toDelete.data) {
    await db.collection('test_results').doc(doc._id).remove()
  }
}

// ---------- 关注球队 ----------

async function toggleFollowTeam(openId, teamInfo) {
  const follows = db.collection('follows')
  
  const existing = await follows.where({
    openId,
    teamId: teamInfo.teamId
  }).count()

  if (existing.total > 0) {
    await follows.where({ openId, teamId: teamInfo.teamId }).remove()
    return { code: 0, data: { followed: false }, message: '取消关注成功' }
  } else {
    await follows.add({
      data: {
        openId,
        teamId: teamInfo.teamId,
        teamName: teamInfo.teamName,
        flag: teamInfo.flag || '',
        followedAt: new Date()
      }
    })
    return { code: 0, data: { followed: true }, message: '关注成功' }
  }
}

async function getFollowedTeams(openId) {
  const res = await db.collection('follows')
    .where({ openId })
    .orderBy('followedAt', 'desc')
    .get()
  
  return { code: 0, data: res.data }
}

// ========== 球队数据查询 ==========

async function getAllTeams() {
  const res = await db.collection('teams')
    .orderBy('id', 'asc')
    .limit(100) // 48条足够覆盖
    .get()
  
  return { code: 0, data: res.data }
}

async function getTeamDetail(teamId) {
  const res = await db.collection('teams')
    .doc(teamId.toString())
    .get()
  
  if (!res.data) {
    return { code: -1, message: '球队不存在' }
  }
  
  return { code: 0, data: res.data }
}
```

### 4.5 缓存工具 (utils/cache.js)

```javascript
// utils/cache.js - 统一本地缓存管理
const STORAGE_PREFIX = 'wc_cache_'  // 世界杯缓存前缀

const cacheManager = {
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @param {number} expireMinutes - 有效期(分钟)
   * @returns {*} 缓存数据或null
   */
  get(key, expireMinutes) {
    try {
      const fullKey = STORAGE_PREFIX + key
      const cached = wx.getStorageSync(fullKey)
      
      if (!cached || !cached.data || !cached.timestamp) {
        return null
      }
      
      // 检查是否过期
      const elapsed = (Date.now() - cached.timestamp) / 60000 // 转为分钟
      if (elapsed >= expireMinutes) {
        wx.removeStorageSync(fullKey)
        return null
      }
      
      return cached.data
    } catch (e) {
      console.warn('[Cache] get失败:', e)
      return null
    }
  },

  /**
   * 设置缓存
   */
  set(key, data, expireMinutes) {
    try {
      const fullKey = STORAGE_PREFIX + key
      wx.setStorageSync(fullKey, {
        data: data,
        timestamp: Date.now(),
        expireMinutes: expireMinutes
      })
    } catch (e) {
      console.warn('[Cache] set失败:', e)
    }
  },

  /**
   * 删除指定缓存
   */
  remove(key) {
    try {
      wx.removeStorageSync(STORAGE_PREFIX + key)
    } catch (e) {
      // ignore
    }
  },

  /**
   * 按前缀批量清除缓存
   */
  clearByPrefix(prefix) {
    try {
      // 微信小程序无法枚举所有storage key
      // 方案: 记录已知key到索引中, 或直接清空特定key
      const knownKeys = [
        'hot_topics_', 'schedule_', 'live_score_', 'standings_', 'news_'
      ]
      knownKeys.forEach(k => {
        if (prefix.includes(k.replace('_', ''))) {
          // 尝试清除匹配的key (简化实现)
        }
      })
      
      // 更可靠的方式: 维护一个active keys list
      const activeKeys = wx.getStorageSync(STORAGE_PREFIX + '_keys') || []
      const toRemove = activeKeys.filter(k => k.startsWith(prefix))
      toRemove.forEach(k => wx.removeStorageSync(STORAGE_PREFIX + k))
      
      // 更新keys列表
      const remainingKeys = activeKeys.filter(k => !k.startsWith(prefix))
      wx.setStorageSync(STORAGE_PREFIX + '_keys', remainingKeys)
    } catch (e) {
      console.warn('[Cache] clearByPrefix失败:', e)
    }
  },

  /**
   * 清除所有世界杯相关缓存
   */
  clearAll() {
    try {
      const activeKeys = wx.getStorageSync(STORAGE_PREFIX + '_keys') || []
      activeKeys.forEach(k => wx.removeStorageSync(STORAGE_PREFIX + k))
      wx.setStorageSync(STORAGE_PREFIX + '_keys', [])
    } catch (e) {
      console.warn('[Cache] clearAll失败:', e)
    }
  },

  /**
   * 注册一个活跃缓存key (用于后续批量清除)
   */
  registerKey(key) {
    try {
      const activeKeys = wx.getStorageSync(STORAGE_PREFIX + '_keys') || []
      if (!activeKeys.includes(key)) {
        activeKeys.push(key)
        wx.setStorageSync(STORAGE_PREFIX + '_keys', activeKeys)
      }
    } catch (e) {
      // ignore
    }
  }
}

module.exports = cacheManager
```

### 4.6 MBTI计分引擎 (utils/mbti.js)

```javascript
// utils/mbti.js - MBTI测试计分引擎
const mbtiQuestions = require('../data/mbtiQuestions')
const mbtiResults = require('../data/mbtiResults')

const CONFIG = {
  totalQuestionsInPool: 40,    // 总题库数
  questionsPerTest: 15,         // 每次测试题数
  maxScorePerQuestion: 3,       // 每题最高分
  
  // 特殊角色阈值
  specialRoleThreshold: 0.80,   // 得分率>=80%
  
  // 题目类型分布
  questionTypes: ['general', 'tactic', 'data', 'face', 'jinx', 'history']
}

const mbtiEngine = {
  /**
   * 随机抽取N道不重复的题目
   * @returns {Array} 抽取的题目数组
   */
  generateQuestions() {
    // Fisher-Yates洗牌算法打乱题目
    const shuffled = [...mbtiQuestions.questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    // 取前N道
    return shuffled.slice(0, CONFIG.questionsPerTest).map((q, idx) => ({
      ...q,
      questionIndex: idx  // 重编号为0~14
    }))
  },

  /**
   * 计算得分和结果
   * @param {Array} answers - 用户作答 [{questionIndex, optionIndex}]
   * @returns {Object} 完整的结果对象
   */
  calculateResult(answers) {
    let totalScore = 0
    let possibleTotal = 0
    
    // 分类统计各类型题目得分
    const typeScores = {
      general: { score: 0, count: 0, maxPossible: 0 },
      tactic: { score: 0, count: 0, maxPossible: 0 },
      data: { score: 0, count: 0, maxPossible: 0 },
      face: { score: 0, count: 0, maxPossible: 0 },
      jinx: { score: 0, count: 0, maxPossible: 0 },
      history: { score: 0, count: 0, maxPossible: 0 }
    }

    // 遍历作答记录计算分数
    for (const answer of answers) {
      const question = mbtiQuestions.questions.find(q =>
        q.index === answer.questionIndex || q.questionIndex === answer.questionIndex
      )
      
      if (!question) continue
      
      const option = question.options[answer.optionIndex]
      if (!option) continue
      
      const score = option.score
      
      // 类型统计
      const type = question.type
      typeScores[type].score += score
      typeScores[type].count += 1
      typeScores[type].maxPossible += CONFIG.maxScorePerQuestion
      
      totalScore += score
      possibleTotal += CONFIG.maxScorePerQuestion
    }

    // 计算总百分比
    const percentage = possibleTotal > 0 ? (totalScore / possibleTotal) * 100 : 0
    
    // ===== 判定特殊角色 (双维度) =====
    let specialRole = null
    
    // 找出贡献占比最高的类型
    let bestType = null
    let highestContribution = 0
    
    for (const [type, stats] of Object.entries(typeScores)) {
      if (stats.count === 0) continue
      
      const contribution = stats.score / totalScore  // 占总分比例
      if (contribution > highestContribution) {
        highestContribution = contribution
        bestType = type
      }
    }

    // 检查最佳类型是否触发特殊角色
    if (bestType && typeScores[bestType].count > 0) {
      const scoreRate = typeScores[bestType].score / typeScores[bestType].maxPossible
      
      if (scoreRate >= CONFIG.specialRoleThreshold) {
        const specialRoleMapping = {
          tactic: 'tactician',
          data: 'data_nerd',
          face: 'face_card',
          jinx: 'jinx_master',
          history: 'historian'
        }
        
        specialRole = specialRoleMapping[bestType]
      }
    }

    // ===== 确定最终结果 =====
    let finalResult
    
    if (specialRole) {
      // 触发特殊角色
      finalResult = mbtiResults.results[specialRole]
    } else {
      // 按基础百分比判断
      if (percentage >= 75) {
        finalResult = mbtiResults.results['football_og']
      } else if (percentage >= 55) {
        finalResult = mbtiResults.results['fake_pro']
      } else if (percentage >= 35) {
        finalResult = mbtiResults.results['vibe_leader']
      } else if (percentage >= 15) {
        finalResult = mbtiResults.results['bandwagon_fan']
      } else {
        finalResult = mbtiResults.results['newbie']
      }
    }

    return {
      resultType: finalResult.name,
      resultEnName: finalResult.enName,
      badge: finalResult.badge,
      color: finalResult.color,
      description: finalResult.description,
      features: finalResult.features,
      goldQuote: finalResult.goldQuote,
      shareText: finalResult.shareText,
      score: totalScore,
      maxScore: possibleTotal,
      percentage: Math.round(percentage),
      specialRole: specialRole,
      answers: answers,
      typeBreakdown: typeScores  // 详细分项统计(用于调试或展示)
    }
  }
}

module.exports = mbtiEngine
```

---

## 五、云数据库设计

### 5.1 集合 (表) 设计

#### teams 集合 (48强球队数据)

```json
{
  "_id": "auto_generated",
  "id": 1,
  "name": "阿根廷",
  "nameEn": "Argentina",
  "flag": "🇦🇷",
  "group": "A",
  "tags": ["南美双雄", "梅西", "冠军热门"],
  "nickname": "潘帕斯雄鹰",
  "starPlayer": "梅西",
  "description": "阿根廷是南美足坛的传统豪强...",
  "goldQuote": "阿根廷的球风华丽且充满激情...",
  "ranking": "FIFA排名第1",
  "players": [
    {
      "playerId": 101,
      "name": "梅西",
      "position": "前锋",
      "quote": "球王归来...",
      "profile": "里奥·梅西, 被誉为史上最伟大的足球运动员..."
    },
    { "...": "..." }
  ],
  "rivalries": [
    {
      "opponent": "巴西",
      "opponentFlag": "🇧🇷",
      "description": "南美双雄之争, 几十年的宿敌"
    }
  ],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

#### users 集合 (用户基本信息)

```json
{
  "_id": "auto_generated",
  "openId": "oXXXX_xxxxxxxxxxxx",
  "nickName": "球迷小明",
  "avatarUrl": "https://...",
  "firstLoginAt": "2026-06-01T10:00:00Z",
  "lastLoginAt": "2026-06-15T08:30:00Z",
  "loginCount": 5
}
```

#### favorites 集合 (用户收藏)

```json
{
  "_id": "auto_generated",
  "openId": "oXXXX_xxx",
  "playerId": 101,
  "playerName": "梅西",
  "team": "阿根廷",
  "position": "前锋",
  "avatar": "/images/players/messi.png",
  "favoritedAt": "2026-06-10T14:20:00Z"
}
```

> **索引**: `{ openId: 1, playerId: 1 }` (复合唯一索引)

#### test_results 集合 (MBTI测试记录)

```json
{
  "_id": "auto_generated",
  "openId": "oXXXX_xxx",
  "resultType": "球场老炮儿",
  "resultEnName": "Football OG",
  "badge": "足球百科全书",
  "color": "#FFD700",
  "score": 38,
  "percentage": 84,
  "answers": [
    {"questionIndex": 0, "optionIndex": 2, "label": "A"},
    {"questionIndex": 1, "optionIndex": 0, "label": "B"},
    {"...": "..."}
  ],
  "specialRole": null,
  "shareText": "测出「球场老炮儿」称号！快来测测你是哪种球迷！",
  "testedAt": "2026-06-12T20:15:00Z"
}
```

#### follows 集合 (关注球队)

``` json
{
  "_id": "auto_generated",
  "openId": "oXXXX_xxx",
  "teamId": 1,
  "teamName": "阿根廷",
  "flag": "🇦🇷",
  "followedAt": "2026-06-01T12:00:00Z"
}
```

#### api_cache 集合 (第三方API缓存 - 云函数侧)

```json
{
  "_id": "auto_generated",
  "type": "todayMatches",          // 缓存类型标识
  "content": "[{...}, {...}]",     // 序列化的JSON数据
  "expireAt": "2026-06-15T14:25:00Z", // 过期时间
  "createdAt": "2026-06-15T14:10:00Z"
}
```

### 5.2 数据库安全规则

```json
{
  "teams": {
    "read": true,
    "write": false
  },
  "users": {
    "read": "doc.openId == openId",
    "write": "doc.openId == openId"
  },
  "favorites": {
    "read": "doc.openId == openId",
    "write": "doc.openId == openId"
  },
  "test_results": {
    "read": "doc.openId == openId",
    "write": "doc.openId == openId"
  },
  "follows": {
    "read": "doc.openId == openId",
    "write": "doc.openId == openId"
  },
  "api_cache": {
    "read": false,
    "write": false  // 仅云函数可读写
  }
}
```

### 5.3 数据量预估

| 集合 | 单条大小预估 | 条数 | 总大小 |
|------|------------|------|--------|
| teams | ~3KB | 48 | ~150KB |
| users | ~500B | 视用户量而定 | - |
| favorites | ~300B | 人均5-10条 | - |
| test_results | ~1KB | 人均3-5条 | - |
| follows | ~200B | 人均3-5条 | - |
| api_cache | ~50KB | 5-10条 (自动清理) | ~500KB |

> **免费额度完全够用**

---

## 六、页面与API映射关系

| 页面 | 数据来源 | 调用的服务方法 | 底层数据通道 |
|------|---------|---------------|-------------|
| **首页** | 今日赛程(云函数)+实时比分(云函数)+黑话(本地)+推荐球员(本地)+Banner广告(流量主) | `footballService.getTodayMatches()` + `footballService.getLiveScore()` | cloudAdapter → getFootballData |
| **球队百科** | 48强列表(云数据库/本地降级) | `teamService.getAllTeams()` | cloudAdapter → userService |
| **球队详情** | 球队信息(云数据库)+近期赛程(云函数)+实时数据(V2,可选) | `teamService.getTeamDetail(id)` + `footballService.getTeamRealtimeData(id)` | cloudAdapter → userService + getFootballData |
| **球员详情** | 球员基础信息(云数据库)+实时统计(V2,可选) | `footballService.getPlayerInfo(playerId)` | cloudAdapter → getFootballData |
| **赛程赛果** | 完整赛程+积分榜(云函数) | `footballService.getSchedule()` + `footballService.getStandings()` | cloudAdapter → getFootballData |
| **新闻资讯** | 新闻列表(云函数) | `footballService.getHotNews()` | cloudAdapter → getFootballData |
| **MBTI测试** | 题目(本地)+计分(本地引擎) | `mbtiEngine.generateQuestions()` + `.calculateResult()` | 纯本地, 无需网络 |
| **MBTI结果** | 结果展示(本地)+保存记录(云数据库)+插屏广告(流量主)+分享功能 | `userService.saveTestResult()` | cloudAdapter → userService |
| **工具箱** | [V2更新] 本地工具(6个) + 实时工具入口(6个) | `toolService.getLocalTools()` + `toolService.getRealtimeTools()` | 本地 / footballService |
| **工具详情 - 本地工具** | 黑话/恩怨/梗图/话术/绰号/越位规则 | `toolService.getLocalToolDetail(type)` | 纯本地 |
| **工具详情 - 实时工具** | 积分榜/赛程/比分/新闻/球员数据/球队数据[V2新增] | 对应 footballService 方法 | cloudAdapter → getFootballData |
| **个人中心** | 收藏列表+测试历史+关注(云数据库) | `userService.getFavorites()` + `.getTestHistory()` + `.getFollowedTeams()` | cloudAdapter → userService |

### 6.1 工具箱混合模式详解 (V2新增)

工具箱从纯本地升级为 **本地 + 实时** 混合模式：

```
┌─────────────────────────────────────────────┐
│              工具箱页面 (tools)               │
│                                             │
│  ┌─────────── 本地工具 ─────────┐           │
│  │ 🔤 足球黑话词典    🎭 经典梗图 │          │
│  │ 💬 赛后装逼话术    🏷️  球员绰号 │          │
│  │ 📐 越位规则图解    ⚔️   球队恩怨 │          │
│  └───────────────────────────────┘           │
│                                             │
│  ┌─────────── 实时数据工具 (V2新增) ────────┐           │
|  │ 🏆 实时积分榜     📅 今日赛程  │           │
|  │ ⚽ 实时比分       📰 足球新闻  │           │
|  │ 👤 球员实时数据   🏟️  球队实时数据│          │
│  └───────────────────────────────┘           │
└─────────────────────────────────────────────┘
```

#### 工具类型定义

```javascript
// services/toolService.js - 工具箱混合模式实现
const localToolTypes = ['slang', 'meme', 'quotes', 'nicknames', 'offside', 'rivalry']
const realtimeToolTypes = ['standings', 'schedule', 'livescore', 'news', 'player_stats', 'team_stats']

const toolDefinitions = {
  // ====== 本地工具 (数据来自 data/*.js) ======
  slang:      { type: 'local', title: '足球黑话词典', icon: '🔤', dataFile: 'slangData' },
  meme:       { type: 'local', title: '经典梗图', icon: '🎭', dataFile: 'memeData' },
  quotes:     { type: 'local', title: '赛后装逼话术', icon: '💬', dataFile: 'quotesData' },
  nicknames:  { type: 'local', title: '球员绰号大全', icon: '🏷️', dataFile: 'nicknamesData' },
  offside:    { type: 'local', title: '越位规则图解', icon: '📐', dataFile: 'offsideData' },
  rivalry:    { type: 'local', title: '球队恩怨录', icon: '⚔️', dataFile: 'rivalryData' },

  // ====== 实时工具 (数据来自第三方API, V2新增) ======
  standings:   { type: 'realtime', title: '实时积分榜', icon: '🏆', service: 'getStandings' },
  schedule:    { type: 'realtime', title: '今日赛程', icon: '📅', service: 'getTodayMatches' },
  livescore:   { type: 'realtime', title: '实时比分', icon: '⚽', service: 'getLiveScore' },
  news:        { type: 'realtime', title: '足球新闻', icon: '📰', service: 'getHotNews' },
  player_stats:{ type: 'realtime', title: '球员实时数据', icon: '👤', service: 'getPlayerInfo', needParam: true },
  team_stats:  { type: 'realtime', title: '球队实时数据', icon: '🏟️', service: 'getTeamRealtimeData', needParam: true }
}

const toolService = {
  /**
   * 获取所有工具定义 (用于渲染工具箱列表)
   */
  getAllTools() {
    return Object.entries(toolDefinitions).map(([key, def]) => ({
      key,
      ...def
    }))
  },

  /**
   * 获取本地工具列表
   */
  getLocalTools() {
    return this.getAllTools().filter(t => t.type === 'local')
  },

  /**
   * 获取实时工具列表
   */
  getRealtimeTools() {
    return this.getAllTools().filter(t => t.type === 'realtime')
  },

  /**
   * 获取本地工具详情内容
   */
  getLocalToolDetail(toolKey) {
    const def = toolDefinitions[toolKey]
    if (!def || def.type !== 'local') {
      return { code: -1, message: '无效的工具类型' }
    }
    const data = require(`../data/${def.dataFile}`)
    return { code: 0, data }
  },

  /**
   * 获取实时工具数据 (代理到 footballService)
   */
  async getRealtimeToolData(toolKey, params = {}) {
    const def = toolDefinitions[toolKey]
    if (!def || def.type !== 'realtime') {
      return { code: -1, message: '非实时工具' }
    }

    const footballService = require('./footballService')
    const method = footballService[def.service]

    if (!method) {
      return { code: -1, message: `未实现的服务方法: ${def.service}` }
    }

    if (def.needParam && !params.id) {
      return { code: -1, message: `该工具需要额外参数(id)` }
    }

    return await method.call(footballService, params.id || params)
  }
}

module.exports = toolService
```

---

## 七、错误处理与降级策略

### 7.1 分级错误处理

```javascript
// utils/request.js - 统一错误处理框架
const ERROR_LEVELS = {
  CRITICAL: 1,   // 致命: 无法继续, 显示错误页面
  MAJOR: 2,      // 主要: 功能受损, 显示提示但可用
  MINOR: 3,      // 次要: 部分数据缺失, 用默认值填充
  INFO: 4        // 提示: 静默处理
}

function handleError(error, level, context) {
  switch (level) {
    case ERROR_LEVELS.CRITICAL:
      wx.showModal({
        title: '出了点问题',
        content: error.message || '请稍后重试',
        showCancel: false
      })
      break
      
    case ERROR_LEVELS.MAJOR:
      wx.showToast({
        title: error.fallbackMessage || '数据加载失败',
        icon: 'none',
        duration: 2000
      })
      break
      
    case ERROR_LEVELS.MINOR:
      console.warn(`[${context}] 非致命错误:`, error.message)
      break
      
    case ERROR_LEVELS.INFO:
      // 静默
      break
  }
  
  // 上报错误日志 (可选: 接入微信实时日志)
  if (level <= ERROR_LEVELS.MAJOR) {
    console.error(`[${context}] Error:`, error)
  }
}
```

### 7.2 各场景降级策略

| 场景 | 正常路径 | 降级路径1 | 降级路径2 | 用户体验 |
|------|---------|----------|----------|---------|
| **今日赛程** | 云函数→API→缓存 | 云数据库缓存 | 显示"暂无赛程" | 正常显示 / 有缓存 / 友好提示 |
| **实时比分** | 云函数→API(1分钟缓存) | 上次缓存(可能过时) | 显示"比分更新中" | 实时 / 稍延迟 / 静态占位 |
| **48强数据** | 云数据库 | 本地JS备用数据 | - | 最新 / 可能稍旧 |
| **新闻** | TheSportsDB API | 云函数缓存 | 显示空状态 | 有新闻 / 有缓存 / 引导刷新 |
| **用户收藏** | 云数据库 | 本地Storage临时存储 | - | 多端同步 / 单设备可用 |
| **MBTI测试** | 本地计算 | - | - | 永远可用(纯本地) |
| **工具箱内容** | 本地JS | - | - | 永远可用(纯本地) |

---

## 八、性能优化策略

### 8.1 前端优化

| 优化项 | 实现方式 | 效果 |
|--------|---------|------|
| **首屏加载** | 首页数据并行请求 (Promise.all) | 减少50%等待时间 |
| **图片懒加载** | 使用 `<image lazy-load>` | 减少初始加载体积 |
| **分包加载** | 将工具箱/个人中心设为独立分包 | 主包体积减半 |
| **列表虚拟滚动** | 48强列表使用 `scroll-view` + 虚拟渲染 | 大列表流畅滚动 |
| **防抖节流** | 下拉刷新/搜索输入/实时比分轮询 | 减少无效请求 |
| **预加载** | TabBar切换时预加载相邻Tab数据 | Tab切换秒开 |

### 8.2 后端(云函数)优化

| 优化项 | 实现方式 | 效果 |
|--------|---------|------|
| **API缓存** | 云数据库做中间缓存层, 减少第三方API调用 | 降低API限流风险 |
| **冷启动预热** | 设置合理的内存/超时配置 | 减少首次调用延迟 |
| **请求合并** | 首页一次性返回多个数据集 | 减少网络往返 |
| **定时任务** | 定时拉取积分榜等低频数据写入缓存 | 保证数据新鲜度 |

### 8.3 分包配置示例

```json
// app.json 分包配置
{
  "pages": [
    "pages/index/index",
    "pages/schedule/schedule",
    "pages/teams/teams",
    "pages/team-detail/team-detail",
    "pages/player-detail/player-detail",
    "pages/news/news",
    "pages/mbti/mbti",
    "pages/mbti-result/mbti-result"
  ],
  "subPackages": [
    {
      "root": "packageTools",
      "pages": [
        "tools/tools",
        "tool-detail/tool-detail"
      ]
    },
    {
      "root": "packageProfile",
      "pages": [
        "profile/profile"
      ]
    }
  ]
}
```

---

## 九、安全性设计

### 9.1 数据安全

| 安全措施 | 实现方式 |
|---------|---------|
| **用户身份隔离** | 所有用户数据通过 `openId` 隔离, 云端校验 |
| **数据库权限** | 严格的安全规则, 用户只能读写自己的数据 |
| **敏感数据不上报** | MBTI计算在客户端完成, 只存结果不存过程数据 |
| **API Key保护** | 第三方API Key存储在云函数环境变量, 不暴露给前端 |

### 9.2 接口安全

| 安全措施 | 实现方式 |
|---------|---------|
| **参数校验** | 云函数层对所有输入参数做类型和范围校验 |
| **频率限制** | 对写操作(收藏/关注)做单用户频率限制 |
| **防刷机制** | 关键接口(如保存测试结果)增加时间间隔检查 |
| **数据脱敏** | 返回给前端的必要字段才返回, 不暴露内部ID结构 |

---

## 十、迁移到Java后端的变更清单 (V2更新)

当需要从云开发迁移到自建Java后端时, 按以下清单操作:

### 10.1 配置变更

```javascript
// config.js - 只需改一行
- module.exports = { adapter: 'cloud', ... }
+ module.exports = { adapter: 'http', http: { baseUrl: 'https://your-api.com' }, ... }
```

### 10.2 需要新增的后端接口

| 接口路径 | 方法 | 对应云函数action | 说明 |
|---------|------|-----------------|------|
| `/football/todayMatches` | POST | todayMatches | 今日赛程 |
| `/football/liveScore` | POST | liveScore | 实时比分 |
| `/football/schedule` | POST | schedule | 完整赛程 |
| `/football/standings` | POST | standings | 积分榜 |
| `/football/news` | POST | news | 新闻列表 |
| `/football/scorers` | POST | scorers | **[V2新增]** 射手榜 |
| `/football/playerInfo` | POST | playerInfo | **[V2新增]** 球员详情 |
| `/football/teamInfo` | POST | teamInfo | **[V2新增]** 球队实时数据 |
| `/football/searchPlayers` | POST | searchPlayers | **[V2新增]** 球员搜索 |
| `/football/searchTeams` | POST | searchTeams | **[V2新增]** 球队搜索 |
| `/user/favorites` | GET/POST/DELETE | getFavorites/toggleFavorite | 收藏CRUD |
| `/user/testResults` | GET/POST | getTestHistory/saveTestResult | 测试记录 |
| `/user/follows` | GET/POST/DELETE | getFollowedTeams/toggleFollowTeam | 关注CRUD |
| `/user/teams` | GET | getAllTeams/getTeamDetail | 球队数据 |
| `/auth/wxLogin` | POST | (新增) | 微信登录换取JWT |

### 10.3 数据库迁移 (MongoDB风格 -> PostgreSQL关系型)

| 云数据库集合 | PG表名 | 主要调整 |
|-------------|--------|---------|
| teams | wc_teams | 字段类型调整, players拆分为wc_players表 |
| users | wc_users | 增加jwt_token等字段 |
| favorites | wc_favorites | 外键关联 |
| test_results | wc_test_results | 外键关联, answers存JSONB |
| follows | wc_follows | 外键关联 |
| api_cache | wc_api_cache | 结构类似 |
| analytics_events | **[V2新增]** wc_analytics_events | 埋点事件存储 |

### 10.4 前端代码改动量

| 文件 | 改动程度 | 说明 |
|------|---------|------|
| `adapters/httpAdapter.js` | **新文件** | 实现HTTP调用逻辑 (含V2新增接口) |
| `config.js` | 改1行 | adapter切换为'http' |
| Pages/*.js | **零改动** | 通过services层间接调用, 无感知 |
| services/*.js | **零改动** | 通过adapters工厂获取实例, 无感知 |
| data/*.js | **零改动** | 纯本地数据不受影响 |
| `utils/tracker.js` | **微改** | 上报目标从云函数改为HTTP接口 |
| `utils/adManager.js` | **零改动** | 广告组件与后端无关 |

---

## 十一、商业化与裂变增长设计 (V2新增)

> 对应 PRD-V2 第十四章内容的技术实现方案

### 11.1 流量主广告接入

#### 11.1.1 广告位规划

| 广告位 | 类型 | 所在页面 | 展示时机 | 频次控制 |
|--------|------|---------|---------|---------|
| **首页Banner** | `ad` Banner | 首页顶部/中部 | 每次打开首页 | 无限制(微信自动控制) |
| **工具详情Banner** | `ad` Banner | 工具详情页底部 | 进入工具详情时 | 无限制 |
| **MBTI结果插屏** | `ad` Interstitial | MBTI测试结果页 | 测试完成展示结果后 | **每用户每天最多1次** |
| **激励视频** | `ad` RewardedVideo | 多个场景 | 用户主动触发解锁 | 不限次 |

#### 11.1.2 统一广告管理器

```javascript
// utils/adManager.js - 统一广告管理器
const config = require('../config')

const adManager = {
  _interstitialAd: null,
  _rewardedVideoAd: null,
  _lastInterstitialShow: 0,

  /**
   * 初始化广告实例 (在app.js中调用一次)
   */
  init() {
    // 插屏广告 - 用于MBTI结果页
    if (wx.createInterstitialAd) {
      this._interstitialAd = wx.createInterstitialAd({
        adUnitId: config.ad.interstitialMBTI
      })
    }

    // 激励视频广告 - 可复用多个场景
    if (wx.createRewardedVideoAd) {
      this._rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: config.ad.rewardedVideo
      })
      this._rewardedVideoAd.onClose((status) => {
        if (status && status.isEnded) {
          this._rewardCallback && this._rewardCallback(true)
        } else {
          this._rewardCallback && this._rewardCallback(false)
        }
      })
    }
  },

  /**
   * 显示插屏广告 (带频次控制)
   * @param {number} intervalMs - 最小间隔时间 (默认24小时)
   */
  showInterstitial(intervalMs = 86400000) {
    const now = Date.now()
    if (now - this._lastInterstitialShow < intervalMs) {
      return Promise.resolve(false)
    }

    if (!this._interstitialAd) return Promise.resolve(false)

    return new Promise((resolve) => {
      this._interstitialAd.show().then(() => {
        this._lastInterstitialShow = now
        resolve(true)
      }).catch(() => {
        resolve(false)
      })
    })
  },

  /**
   * 显示激励视频广告
   * @param {Function} onReward - 观看完成的回调(rewarded: boolean) => void
   */
  showRewardedVideo(onReward) {
    if (!this._rewardedVideoAd) {
      onReward && onReward(false)
      return
    }
    this._rewardCallback = onReward
    this._rewardedVideoAd.show().catch(() => {
      this._rewardedVideoAd.load().then(() => {
        this._rewardedVideoAd.show()
      }).catch(() => {
        onReward && onReward(false)
      })
    })
  }
}

module.exports = adManager
```

#### 11.1.3 页面集成示例

```javascript
// pages/mbti-result/mbti-result.js
const adManager = require('../../utils/adManager')

Page({
  onLoad() {
    // 测试完成后延迟显示插屏广告 (不影响用户体验)
    setTimeout(() => adManager.showInterstitial(), 1500)
  },
  // 用户主动观看激励视频解锁额外内容
  onUnlockWithAd() {
    adManager.showRewardedVideo((rewarded) => {
      if (rewarded) {
        wx.showToast({ title: '解锁成功！', icon: 'success' })
        // 执行解锁逻辑...
      } else {
        wx.showToast({ title: '需完整观看视频', icon: 'none' })
      }
    })
  }
})
```

```html
<!-- pages/index/index.wxml - 首页Banner广告 -->
<view class="home-container">
  <!-- ... 首页内容 ... -->
  <ad unit-id="{{adUnitIds.bannerHome}}" binderror="onAdError" bindload="onAdLoad" />
</view>
```

### 11.2 裂变增长技术实现

#### 11.2.1 分享功能增强 (utils/share.js 升级)

```javascript
// utils/share.js - V2增强版分享工具
const tracker = require('./tracker')

const shareManager = {
  /**
   * MBTI结果分享 - 主裂变触点
   */
  shareMBTIResult(result) {
    const shareData = {
      title: result.shareText || `我是「${result.resultType}」球迷！你是哪种？`,
      path: `/pages/mbti/mbti?shareType=mbti&result=${result.resultEnName}`,
      imageUrl: '/images/share/mbti-default.png',
      success: () => tracker.trackEvent('share_mbti', { resultType: result.resultEnName })
    }
    return shareData
  },

  /**
   * 赛后话术分享 - 辅裂变触点
   */
  shareQuote(quote, teamName) {
    return {
      title: `关于${teamName}，我只想说...`,
      path: `/pages/tools/tool-detail?type=quotes&share=true`,
      success: () => tracker.trackEvent('share_quote', { teamName })
    }
  },

  /**
   * 保存Canvas绘制的分享海报到相册
   */
  async savePosterToAlbum(canvasTempPath) {
    try {
      await wx.saveImageToPhotosAlbum({ filePath: canvasTempPath })
      wx.showToast({ title: '已保存到相册', icon: 'success' })
      tracker.trackEvent('save_poster')
      return true
    } catch (e) {
      if (e.errMsg.includes('auth deny')) {
        wx.showModal({ title: '提示', content: '需要您授权保存图片权限' })
      }
      return false
    }
  }
}

module.exports = shareManager
```

#### 11.2.2 页面分享配置示例

```javascript
// pages/mbti-result/mbti-result.js
const shareManager = require('../../utils/share')

Page({
  onShareAppMessage() {
    return shareManager.shareMBTIResult(this.data.result)
  },

  onShareTimeline() {
    return {
      title: `我是「${this.data.result?.resultType}」球迷！快来测测你的类型`,
      query: 'shareType=mbti_timeline',
      imageUrl: '/images/share/timeline-default.png'
    }
  }
})
```

### 11.3 数据埋点体系 (V2新增)

#### 11.3.1 埋点事件定义表

| 事件ID | 事件名称 | 触发场景 | 上报参数 |
|--------|---------|---------|---------|
| `page_view` | 页面访问 | 每个页面 `onShow` | page, fromPage |
| `tool_view` | 工具查看 | 进入工具详情 | toolType (local/realtime), toolKey |
| `mbti_start` | 测试开始 | 点击开始测试 | - |
| `mbti_complete` | 测试完成 | 提交答案 | resultType, percentage, score |
| `mbti_share` | 结果分享 | 分享MBTI结果 | resultType, shareTarget (friend/timeline) |
| `favorite_add` | 收藏球员 | 点击收藏按钮 | playerId, playerName |
| `ad_show` | 广告展示 | 广告成功展示 | adType, position |
| `ad_click` | 广告点击 | 用户点击广告 | adType, position |
| `search` | 搜索操作 | 使用搜索功能 | keyword, resultCount |

#### 11.3.2 埋点工具实现 (utils/tracker.js)

```javascript
// utils/tracker.js - 埋点上报工具
const config = require('../config')

if (!config.tracker.enabled) {
  module.exports = { trackEvent: () => {}, trackPageView: () => {} }
} else {

const EVENT_QUEUE = []
let flushTimer = null

const tracker = {
  trackEvent(eventId, params = {}) {
    EVENT_QUEUE.push({
      eventId,
      params,
      timestamp: Date.now(),
      system: wx.getSystemInfoSync(),
      sessionId: getApp().globalData.sessionId || ''
    })

    if (EVENT_QUEUE.length >= config.tracker.batchSize) {
      this.flush()
    } else {
      this._scheduleFlush()
    }
  },

  trackPageView(pageName, fromPage) {
    this.trackEvent('page_view', { page: pageName, fromPage })
  },

  async flush() {
    if (EVENT_QUEUE.length === 0) return
    clearTimeout(flushTimer)
    const events = EVENT_QUEUE.splice(0)

    try {
      await wx.cloud.callFunction({
        name: 'analytics',
        data: { action: 'trackEvents', events }
      })
    } catch (e) {
      console.warn('[Tracker] 上报失败:', e.message)
    }
  },

  _scheduleFlush() {
    if (flushTimer) return
    flushTimer = setTimeout(() => {
      this.flush()
      flushTimer = null
    }, config.tracker.flushInterval)
  }
}

module.exports = tracker

}
```

### 11.4 商业化关键指标与埋点映射

| KPI | 技术来源 | 计算方式 |
|-----|---------|---------|
| **DAU** | `page_view` 去重统计 | 按 openIdHash 每日去重计数 |
| **MBTI完成率** | `mbti_start` / `mbti_complete` | complete数 / start数 x 100% |
| **分享率** | `mbti_share` / `mbti_complete` | share数 / complete数 x 100% |
| **人均收藏数** | `favorite_add` 累计 | favorite总数 / DAU |
| **广告曝光** | `ad_show` 计数 | 直接累加 |
| **广告CTR** | `ad_click` / `ad_show` | click数 / show数 x 100% |
| **工具使用分布** | `tool_view` 按 toolKey 聚合 | 各工具调用量占比 |

---

## 十二、开发排期规划 (V2更新)

### Phase 1: 基础框架搭建 (Day 1-2)
- [ ] 创建微信小程序项目
- [ ] 搭建目录结构 (adapters/services/utils/data/pages)
- [ ] 实现 config.js 配置中心
- [ ] 实现 adapters 层 (CloudAdapter + 工厂)
- [ ] 实现 utils/cache.js 和 utils/request.js
- [ ] 初始化云开发环境 (创建云函数模板)
- [ ] 搭建云数据库 (创建集合+设置权限)

### Phase 2: 静态内容 + 纯本地页面 (Day 3-5)
- [ ] 编写 data/ 目录下所有本地数据文件
- [ ] 实现 MBTI计分引擎 (utils/mbti.js)
- [ ] 开发 工具箱 + 工具详情 页面 (纯本地, 最简单)
- [ ] 开发 MBTI测试 + 测试结果 页面 (纯本地)
- [ ] 开发 球队百科 + 球队详情 + 球员详情 页面 (先接本地数据)

### Phase 3: 云函数 + 动态数据 (Day 6-9)
- [ ] 实现 getFootballData 云函数 (代理第三方API)
- [ ] 实现 userService 云函数 (用户数据读写)
- [ ] 导入 48强数据到云数据库
- [ ] 开发 首页 (集成实时赛程+比分+热点)
- [ ] 开发 赛程赛果 页面
- [ ] 开发 新闻资讯 页面
- [ ] 将球队百科/详情页面切换为读取云数据库

### Phase 4: 用户系统 + 个人中心 (Day 10-11)
- [ ] 开发 个人中心 页面 (收藏/测试历史/关注)
- [ ] 球员详情页集成收藏功能
- [ ] MBTI结果页集成云端保存+历史查看
- [ ] 实现下拉刷新和离线缓存逻辑

### Phase 5: UI打磨 + 商业化接入 (Day 12-14)
- [ ] 全局视觉规范落地 (主题色/卡片样式/动画)
- [ ] TabBar图标制作和配置
- [ ] 性能优化 (分包/懒加载/虚拟列表)
- [ ] 错误处理和降级策略完善
- [ ] 分享功能实现 (MBTI结果分享 + 海报生成)
- [ ] **[V2新增]** 接入流量主广告 (Banner + 插屏 + 激励视频)
- [ ] **[V2新增]** 埋点体系实现 (tracker.js + analytics云函数)
- [ ] **[V2新增]** 工具箱实时数据入口开发
- [ ] 兼容性测试 (iOS/Android)

### Phase 6: 测试 + 发布 (Day 15)
- [ ] 全流程测试 (含广告展示/分享流程/埋点验证)
- [ ] 微信审核提交
- [ ] 问题修复

---

## 附录

### A. 第三方API申请清单

| API | 申请地址 | 用途 | 免费额度 |
|-----|---------|------|---------|
| Football-Data.org | https://football-data.org/ | 赛程/比分/积分榜 | 10次/分钟 |
| **API-Football (V2新增)** | https://www.api-football.co/ | **射手榜/球员详情/球队详情/搜索(中文支持好)** | 10次/分钟 |
| TheSportsDB | https://www.thesportsdb.com/ | 新闻事件 | 无限制 |
| 聚合数据(可选) | https://www.juhe.cn/ | 中文世界杯数据 | 有免费额度 |

### B. 关键依赖版本

```json
{
  "wx-server-sdk": "~2.6.3",
  "axios": "^1.6.0"
}
```

### C. 参考资料

- [微信云开发官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/)
- [云数据库开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [云函数开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
- [Football-Data API文档](https://www.football-data.org/documentation/quickstart)
- [**API-Football 文档 (V2)**](https://www.api-football.co/docs-v3) - 备选数据源
- [微信流量主广告文档](https://developers.weixin.qq.com/miniprogram/dev/component/ad.html)
- [PRD-V2.md](../PRD-V2.md) - 产品需求文档V2
- [PRD.md](./PRD.md) - 原版产品需求文档

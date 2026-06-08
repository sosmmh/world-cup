// services/impl/footballHttpService.js - 直连第三方API实现（无需云函数）
const cacheManager = require('../../utils/cache')
const config = require('../../config')

const CACHE_PREFIX = {
  SCHEDULE: 'cache_schedule_',
  LIVE_SCORE: 'cache_live_score_',
  STANDINGS: 'cache_standings_',
  NEWS: 'cache_news_',
  SCORERS: 'cache_scorers_',
  PLAYER_INFO: 'cache_player_info_',
  TEAM_INFO: 'cache_team_info_'
}

// Football-Data.org API 配置
const API_BASE = config.apis.footballData.baseUrl
const API_KEY = config.apis.footballData.apiKey

// 世界杯 competition ID (World Cup = 2000, WC2026 需要确认)
const WORLD_CUP_ID = 2000

/**
 * 封装 wx.request 调用 Football-Data.org API
 */
function apiRequest(url, params) {
  const queryString = Object.keys(params || {})
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&')

  const fullUrl = `${API_BASE}${url}${queryString ? '?' + queryString : ''}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: 'GET',
      header: {
        'X-Auth-Token': API_KEY
      },
      timeout: 15000,
      success(res) {
        if (res.statusCode === 200 && res.data) {
          resolve({ code: 0, message: 'success', data: res.data })
        } else if (res.statusCode === 429) {
          resolve({ code: 429, message: 'API请求频率超限，请稍后再试', data: null })
        } else if (res.statusCode === 403 || res.statusCode === 401) {
          resolve({ code: res.statusCode, message: 'API认证失败，请检查API Key', data: null })
        } else {
          console.error(`[HttpApi] ${url} 返回错误:`, res.statusCode, res.data)
          resolve({ code: res.statusCode, message: `请求失败(${res.statusCode})`, data: null })
        }
      },
      fail(err) {
        console.error(`[HttpApi] ${url} 网络异常:`, err.errMsg)
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 格式化比赛数据（统一返回格式，预计算所有展示值）
 */
function formatMatch(match) {
  var homeScore = match.score ? match.score.fullTime.home : null
  var awayScore = match.score ? match.score.fullTime.away : null
  var halfHome = match.score ? match.score.halfTime.home : null
  var halfAway = match.score ? match.score.halfTime.away : null

  // 预计算时间文本（UTC转北京时间显示）
  var timeText = ''
  if (match.utcDate) {
    try {
      var dt = new Date(match.utcDate)
      // UTC + 8 小时 = 北京时间
      var beijingH = dt.getUTCHours() + 8
      if (beijingH >= 24) beijingH -= 24
      timeText = String(beijingH).padStart(2, '0') + ':' + String(dt.getUTCMinutes()).padStart(2, '0')
    } catch (e) { timeText = '' }
  }

  // 预计算状态文本
  var statusMap = {
    'SCHEDULED': '未开始',
    'TIMED': '待定',
    'IN_PLAY': '进行中',
    'LIVE': '直播中',
    'PAUSED': '中场休息',
    'FINISHED': '已结束',
    'AWARDED': '已取消',
    'POSTPONED': '延期',
    'SUSPENDED': '中断',
    'CANCELLED': '取消'
  }
  var statusText = statusMap[match.status] || (match.status || '')
  var minuteStr = match.minute ? match.minute + "'" : ''

  return {
    id: match.id,
    homeTeam: {
      id: match.homeTeam ? match.homeTeam.id : null,
      name: match.homeTeam ? match.homeTeam.name : '',
      shortName: match.homeTeam ? (match.homeTeam.tla || '') : '',
      crest: match.homeTeam ? (match.homeTeam.crest || '') : ''
    },
    awayTeam: {
      id: match.awayTeam ? match.awayTeam.id : null,
      name: match.awayTeam ? match.awayTeam.name : '',
      shortName: match.awayTeam ? (match.awayTeam.tla || '') : '',
      crest: match.awayTeam ? (match.awayTeam.crest || '') : ''
    },
    score: match.score ? {
      fullTime: { home: homeScore, away: awayScore },
      halfTime: { home: halfHome, away: halfAway }
    } : null,
    status: match.status,
    utcDate: match.utcDate,
    // 预计算的展示值
    timeText: timeText,
    statusText: statusText,
    minuteStr: minuteStr,
    isLive: match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED',
    isScheduled: match.status === 'SCHEDULED' || !match.score,
    hasScore: match.score && homeScore != null,
    homeScoreDisplay: homeScore != null ? homeScore : '-',
    awayScoreDisplay: awayScore != null ? awayScore : '-',
    halfTimeDisplay: (halfHome != null && halfAway != null) ? (halfHome + '-' + halfAway) : '',
    matchday: match.matchday,
    group: match.group || null,
    _homeScore: (homeScore != null) ? homeScore : 0,
    _awayScore: (awayScore != null) ? awayScore : 0
  }
}

/**
 * 按日期分组
 */
function groupByDate(matches) {
  var groups = {}
  matches.forEach(function(match) {
    if (!match.utcDate) return
    var dateKey = match.utcDate.split('T')[0]
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(match)
  })

  var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return Object.keys(groups).sort().map(function(date) {
    var d = new Date(date + 'T00:00:00Z')
    return {
      date: date,
      dateText: (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weekDays[d.getDay()],
      matches: groups[date]
    }
  })
}

/**
 * 格式化日期 YYYY-MM-DD
 */
function formatDateStr(d) {
  var year = d.getFullYear()
  var month = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

// ==================== Service 方法 ====================

const httpService = {

  // 获取今日比赛
  async getTodayMatches(forceRefresh) {
    forceRefresh = forceRefresh || false
    var cacheKey = CACHE_PREFIX.SCHEDULE + 'today'
    if (!forceRefresh) {
      var cached = cacheManager.get(cacheKey, config.cache.schedule)
      if (cached) return { code: 0, data: cached }
    }

    var today = new Date()
    var tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    try {
      var res = await apiRequest('/matches', {
        dateFrom: formatDateStr(today),
        dateTo: formatDateStr(tomorrow),
        competition: WORLD_CUP_ID,
        season: '2026'
      })

      if (res.code === 0 && res.data.matches) {
        var formatted = res.data.matches.map(formatMatch)
        var result = { matches: formatted, count: formatted.length }
        cacheManager.set(cacheKey, result, config.cache.schedule)
        return { code: 0, data: result }
      }
      return res
    } catch(e) {
      console.error('[HttpApi] getSchedule 异常:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  // 获取实时比分（进行中的比赛）
  async getLiveScore() {
    var cacheKey = CACHE_PREFIX.LIVE_SCORE
    var cached = cacheManager.get(cacheKey, config.cache.liveScore)
    if (cached) return { code: 0, data: cached }

    try {
      var res = await apiRequest('/matches', {
        status: 'IN_PLAY,LIVE,PAUSED',
        competition: WORLD_CUP_ID,
        season: '2026'
      })
      if (res.code === 0 && res.data.matches) {
        var formatted = res.data.matches.map(formatMatch)
        var result = { matches: formatted, count: formatted.length }
        cacheManager.set(cacheKey, result, config.cache.liveScore)
        return { code: 0, data: result }
      }
      return res
    } catch(e) {
      console.error('[HttpApi] getSchedule 异常:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  // 获取赛程列表
  async getSchedule(params) {
    params = params || {}
    var cacheKey = CACHE_PREFIX.SCHEDULE + JSON.stringify(params)
    
    try {
      // 默认查询世界杯赛程
      var apiParams = {}
      if (params.dateFrom) apiParams.dateFrom = params.dateFrom
      if (params.dateTo) apiParams.dateTo = params.dateTo
      if (params.status) apiParams.status = params.status
      if (!apiParams.competition) apiParams.competition = WORLD_CUP_ID
      // 必须传 season 参数，否则 API 返回空数据
      if (!apiParams.season && params.season !== '') {
        apiParams.season = '2026'
      }

      console.log('[HttpApi] getSchedule 请求参数:', JSON.stringify(apiParams))

      var res = await apiRequest('/matches', apiParams)

      var matchCount = (res.data && res.data.matches) ? res.data.matches.length : '无'
      var rawData = res.data ? JSON.stringify(res.data).substring(0, 200) : 'null'
      console.log('[HttpApi] getSchedule 返回码:', res.code, 'matches数:', matchCount)
      console.log('[HttpApi] getSchedule 原始数据:', rawData)

      if (res.code === 0 && res.data && res.data.matches && Array.isArray(res.data.matches)) {
        var matches = res.data.matches.map(formatMatch)
        var grouped = groupByDate(matches)
        var result = {
          matches: matches,
          groupedByDate: grouped,
          count: res.data.count || matches.length
        }
        cacheManager.set(cacheKey, result, config.cache.schedule)
        return { code: 0, data: result }
      }
      return res
    } catch(e) {
      console.error('[HttpApi] getSchedule 异常:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  // 获取积分榜
  async getStandings(groupName) {
    groupName = groupName || ''
    var cacheKey = CACHE_PREFIX.STANDINGS + (groupName || 'all')
    var cached = cacheManager.get(cacheKey, config.cache.standings)
    if (cached) return { code: 0, data: cached }

    var endpoint = '/competitions/' + WORLD_CUP_ID + '/standings'
    if (groupName) {
      endpoint += '?standingType=GROUP&group=' + groupName + '&season=2026'
    } else {
      endpoint += '?season=2026'
    }

    try {
      var res = await apiRequest(endpoint)

      if (res.code === 0 && res.data.standings) {
        var standings = res.data.standings.map(function(s) {
          return {
            group: s.group || (s.table[0] ? s.table[0].group : 'ALL'),
            table: (s.table || []).map(function(team) {
              return {
                position: team.position,
                team: team.team,
                playedGames: team.playedGames,
                won: team.won,
                drawn: team.drawn,
                lost: team.lost,
                goalsFor: team.goalsFor,
                goalsAgainst: team.goalsAgainst,
                goalDifference: team.goalDifference,
                points: team.points,
                form: team.form
              }
            })
          }
        })

        var result = {
          standings: standings,
          competition: res.data.competition || null
        }
        cacheManager.set(cacheKey, result, config.cache.standings)
        return { code: 0, data: result }
      }
      return res
    } catch(e) {
      console.error('[HttpApi] getSchedule 异常:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  // 获取射手榜
  async getScorers(leagueId, season) {
    leagueId = leagueId || WORLD_CUP_ID
    season = season || '2026'

    var cacheKey = CACHE_PREFIX.SCORERS + leagueId + '_' + season
    var cached = cacheManager.get(cacheKey, config.cache.standings || 30)
    if (cached) return { code: 0, data: cached }

    try {
      var res = await apiRequest('/competitions/' + leagueId + '/scorers', {
        limit: 10,
        season: season
      })

      if (res.code === 0 && res.data.scorers) {
        var scorers = (res.data.scorers || []).map(function(s, i) {
          return {
            rank: i + 1,
            playerId: s.player.id,
            playerName: s.player.name,
            teamId: s.team.id,
            teamName: s.team.name,
            teamCrest: s.team.crest || '',
            goals: s.goals || 0,
            assists: s.assists || 0,
            playedGames: s.playedGames || 0
          }
        })
        cacheManager.set(cacheKey, scorers, config.cache.standings || 30)
        return { code: 0, data: scorers }
      }
      return res
    } catch(e) {
      console.error('[HttpApi] getSchedule 异常:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  // 获取新闻（Football-Data.org 不支持，返回空或mock）
  async getHotNews(category, page, pageSize) {
    category = category || null
    page = page || 1
    pageSize = pageSize || 10
    var cacheKey = CACHE_PREFIX.NEWS + (category || 'all') + '_' + page
    var cached = cacheManager.get(cacheKey, config.cache.news)
    if (cached) return { code: 0, data: cached }
    // 第三方API不支持新闻，返回空数据
    var emptyResult = []
    cacheManager.set(cacheKey, emptyResult, config.cache.news)
    return { code: 0, data: emptyResult }
  },

  // 获取球员信息
  async getPlayerInfo(playerId) {
    var cacheKey = CACHE_PREFIX.PLAYER_INFO + playerId
    var cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }

    try {
      var res = await apiRequest('/players/' + playerId)
      if (res.code === 0) {
        cacheManager.set(cacheKey, res.data, config.cache.teams)
      }
      return res
    } catch(e) {
      console.error('[HttpApi] getSchedule 异常:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  // 获取球队实时数据
  async getTeamRealtimeData(teamId) {
    var cacheKey = CACHE_PREFIX.TEAM_INFO + teamId
    var cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }

    try {
      var res = await apiRequest('/teams/' + teamId)
      if (res.code === 0) {
        cacheManager.set(cacheKey, res.data, config.cache.teams)
      }
      return res
    } catch(e) {
      console.error('[HttpApi] getSchedule 异常:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  // 推荐球员
  async getRecommendPlayers(count) {
    count = count || 10
    var cacheKey = CACHE_PREFIX.PLAYER_INFO + 'recommend'
    var cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }
    // API不支持，返回空
    var emptyResult = []
    cacheManager.set(cacheKey, emptyResult, config.cache.teams)
    return { code: 0, data: emptyResult }
  },

  // 清除缓存
  clearCache(type) {
    var prefixMap = {
      schedule: CACHE_PREFIX.SCHEDULE,
      liveScore: CACHE_PREFIX.LIVE_SCORE,
      standings: CACHE_PREFIX.STANDINGS,
      news: CACHE_PREFIX.NEWS,
      scorers: CACHE_PREFIX.SCORERS,
      playerInfo: CACHE_PREFIX.PLAYER_INFO,
      teamInfo: CACHE_PREFIX.TEAM_INFO
    }
    var prefix = prefixMap[type]
    if (prefix) cacheManager.clearByPrefix(prefix)
  }
}

module.exports = httpService

// services/impl/footballCloudService.js - 纯云函数实现（无mock fallback）
var cacheManager = require('../../utils/cache')
var config = require('../../config')

var CACHE_PREFIX = {
  SCHEDULE: 'cache_schedule_',
  LIVE_SCORE: 'cache_live_score_',
  STANDINGS: 'cache_standings_',
  NEWS: 'cache_news_',
  SCORERS: 'cache_scorers_',
  PLAYER_INFO: 'cache_player_info_',
  TEAM_INFO: 'cache_team_info_'
}

/**
 * 调用云函数（带超时控制）
 */
function callCloudFunction(name, action, data) {
  data = data || {}
  return new Promise(function(resolve, reject) {
    wx.cloud.callFunction({
      name: name,
      data: Object.assign({ action: action }, data),
      timeout: 50000,
      success: function(res) {
        var result = res.result || {}
        resolve({ code: result.code || 0, message: result.message || 'success', data: result.data })
      },
      fail: function(err) {
        console.error('[CloudService] ' + name + '/' + action + ' 调用失败:', err)
        reject(new Error(err.errMsg || '云函数调用失败'))
      }
    })
  })
}

var cloudService = {

  // ========== 赛程相关 ==========

  async getSchedule(params) {
    var res = await callCloudFunction('getCompSched', 'getSchedule', params)
    if (res.code === 0 && res.data) return res
    throw new Error(res.message || '获取赛程失败')
  },

  async getTodayMatches(forceRefresh) {
    var cacheKey = CACHE_PREFIX.SCHEDULE + 'today'
    if (!forceRefresh) {
      var cached = cacheManager.get(cacheKey, config.cache.schedule)
      if (cached) return { code: 0, data: cached }
    }
    var res = await callCloudFunction('getCompSched', 'todayMatches')
    if (res.code === 0 && res.data) {
      cacheManager.set(cacheKey, res.data, config.cache.schedule)
    }
    return res
  },

  async getLiveScore() {
    var cacheKey = CACHE_PREFIX.LIVE_SCORE
    var cached = cacheManager.get(cacheKey, config.cache.liveScore)
    if (cached) return { code: 0, data: cached }
    var res = await callCloudFunction('getCompSched', 'liveScore')
    if (res.code === 0 && res.data) {
      cacheManager.set(cacheKey, res.data, config.cache.liveScore)
    }
    return res
  },

  async getStandings(groupName) {
    groupName = groupName || null
    var cacheKey = CACHE_PREFIX.STANDINGS + (groupName || 'all')
    var cached = cacheManager.get(cacheKey, config.cache.standings)
    if (cached) return { code: 0, data: cached }
    var res = await callCloudFunction('getCompSched', 'standings', { group: groupName })
    if (res.code === 0 && res.data) {
      cacheManager.set(cacheKey, res.data, config.cache.standings)
    }
    return res
  },

  async getScorers(leagueId, season) {
    leagueId = leagueId || null
    season = season || null
    var cacheKey = CACHE_PREFIX.SCORERS + (leagueId || 'wc') + '_' + (season || '2026')
    var cached = cacheManager.get(cacheKey, config.cache.standings || 30)
    if (cached) return { code: 0, data: cached }
    var res = await callCloudFunction('getCompSched', 'scorers', { leagueId: leagueId, season: season })
    if (res.code === 0 && res.data) {
      cacheManager.set(cacheKey, res.data, config.cache.standings || 30)
    }
    return res
  },

  // ========== 新闻 ==========

  async getHotNews(category, page, pageSize, forceRefresh) {
    category = category || null
    page = page || 1
    pageSize = pageSize || 10
    forceRefresh = forceRefresh || false
    var cacheKey = CACHE_PREFIX.NEWS + 'v2_' + (category || 'all') + '_' + page
    if (!forceRefresh) {
      var cached = cacheManager.get(cacheKey, config.cache.news)
      if (cached) return { code: 0, data: cached }
    }
    var res = await callCloudFunction('getNews', forceRefresh ? 'forceRefresh' : 'getHotNews', {
      category: category,
      page: page,
      pageSize: pageSize
    })
    if (res.code === 0 && res.data) {
      cacheManager.set(cacheKey, res.data, config.cache.news)
    }
    return res
  },

  // ========== 球员 / 球队 ==========

  async getPlayerInfo(playerId) {
    try {
      var cacheKey = CACHE_PREFIX.PLAYER_INFO + playerId
      var cached = cacheManager.get(cacheKey, config.cache.schedule)
      if (cached) return { code: 0, data: cached }
      var res = await callCloudFunction('getPlayerInfo', 'info', { playerId: playerId })
      if (res.code === 0 && res.data) {
        cacheManager.set(cacheKey, res.data, config.cache.schedule)
      }
      return res
    } catch(e) {
      console.error('[CloudService] getPlayerInfo 失败:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  async getTeamRealtimeData(teamId) {
    try {
      var cacheKey = CACHE_PREFIX.TEAM_INFO + teamId
      var cached = cacheManager.get(cacheKey, config.cache.teams)
      if (cached) return { code: 0, data: cached }
      var res = await callCloudFunction('getTeamInfo', 'realtime', { teamId: teamId })
      if (res.code === 0 && res.data) {
        cacheManager.set(cacheKey, res.data, config.cache.teams)
      }
      return res
    } catch(e) {
      console.error('[CloudService] getTeamRealtimeData 失败:', e.message)
      return { code: -1, message: e.message, data: null }
    }
  },

  async getRecommendPlayers(count) {
    count = count || 10
    try {
      var cacheKey = CACHE_PREFIX.PLAYER_INFO + 'recommend'
      var cached = cacheManager.get(cacheKey, config.cache.teams)
      if (cached) return { code: 0, data: cached }
      var res = await callCloudFunction('getPlayerInfo', 'recommend', { count: count })
      if (res.code === 0 && res.data) {
        cacheManager.set(cacheKey, res.data, config.cache.teams)
      }
      return res
    } catch(e) {
      console.error('[CloudService] getRecommendPlayers 失败:', e.message)
      return { code: -1, message: e.message, data: [] }
    }
  },

  // ========== 缓存管理 ==========

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

module.exports = cloudService

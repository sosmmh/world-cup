// services/impl/footballCloudService.js - 云函数实现（含 fallback 到 mock）
var cacheManager = require('../../utils/cache')
var config = require('../../config')
var mockImpl = require('./footballMockService')

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
      timeout: 20000,
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

/**
 * 判断是否需要 fallback：超时 / 冷启动 / 空数据
 */
function shouldFallbackToMock(res) {
  if (!res) return true
  if (res.data && !res.data.cached && (
    res.message === 'cold_start' || 
    res.source === 'empty' ||
    (res.data.matches && res.data.matches.length === 0 && !res.data.fetchedAt)
  )) {
    console.warn('[CloudService] 检测到冷启动/空数据，fallback → mock')
    return true
  }
  return false
}

var cloudService = {
  async getSchedule(params) {
    try {
      var res = await callCloudFunction('getCompSched', 'getSchedule', params)
      if (!shouldFallbackToMock(res)) return res
    } catch(e) {
      console.warn('[CloudService] getSchedule 异常，fallback → mock:', e.message)
    }
    console.log('[CloudService] getSchedule 使用 mock 数据')
    return await mockImpl.getSchedule(params)
  },

  async getTodayMatches(forceRefresh) {
    var cacheKey = CACHE_PREFIX.SCHEDULE + 'today'
    if (!forceRefresh) {
      var cached = cacheManager.get(cacheKey, config.cache.schedule)
      if (cached) return { code: 0, data: cached }
    }
    try {
      var res = await callCloudFunction('getCompSched', 'todayMatches')
      if (!shouldFallbackToMock(res)) {
        if (res.code === 0) cacheManager.set(cacheKey, res.data, config.cache.schedule)
        return res
      }
    } catch(e) {
      console.warn('[CloudService] getTodayMatches 异常，fallback → mock:', e.message)
    }
    return await mockImpl.getTodayMatches(forceRefresh)
  },

  async getLiveScore() {
    var cacheKey = CACHE_PREFIX.LIVE_SCORE
    var cached = cacheManager.get(cacheKey, config.cache.liveScore)
    if (cached) return { code: 0, data: cached }
    try {
      var res = await callCloudFunction('getCompSched', 'liveScore')
      if (!shouldFallbackToMock(res)) {
        if (res.code === 0) cacheManager.set(cacheKey, res.data, config.cache.liveScore)
        return res
      }
    } catch(e) {
      console.warn('[CloudService] getLiveScore 异常，fallback → mock:', e.message)
    }
    return await mockImpl.getLiveScore()
  },

  async getStandings(groupName) {
    groupName = groupName || null
    var cacheKey = CACHE_PREFIX.STANDINGS + (groupName || 'all')
    var cached = cacheManager.get(cacheKey, config.cache.standings)
    if (cached) return { code: 0, data: cached }
    try {
      var res = await callCloudFunction('getCompSched', 'standings', { group: groupName })
      if (!shouldFallbackToMock(res)) {
        if (res.code === 0) cacheManager.set(cacheKey, res.data, config.cache.standings)
        return res
      }
    } catch(e) {
      console.warn('[CloudService] getStandings 异常，fallback → mock:', e.message)
    }
    return await mockImpl.getStandings(groupName)
  },

  async getScorers(leagueId, season) {
    leagueId = leagueId || null
    season = season || null
    var cacheKey = CACHE_PREFIX.SCORERS + (leagueId || 'wc') + '_' + (season || '2026')
    var cached = cacheManager.get(cacheKey, config.cache.standings || 30)
    if (cached) return { code: 0, data: cached }
    try {
      var res = await callCloudFunction('getCompSched', 'scorers', { leagueId: leagueId, season: season })
      if (!shouldFallbackToMock(res)) {
        if (res.code === 0) cacheManager.set(cacheKey, res.data, config.cache.standings || 30)
        return res
      }
    } catch(e) {
      console.warn('[CloudService] getScorers 异常，fallback → mock:', e.message)
    }
    return await mockImpl.getScorers(leagueId, season)
  },

  async getHotNews(category, page, pageSize, forceRefresh) {
    console.log('========== [CLOUD] getHotNews 被调用 ==========')
    category = category || null
    page = page || 1
    pageSize = pageSize || 10
    forceRefresh = forceRefresh || false
    var cacheKey = CACHE_PREFIX.NEWS + 'v2_' + (category || 'all') + '_' + page
    // 先查本地缓存
    if (!forceRefresh) {
      var cached = cacheManager.get(cacheKey, config.cache.news)
      if (cached) {
        console.log('[CloudService] getHotNews 命中本地缓存, key=' + cacheKey + ' 条数:' + cached.length)
        return { code: 0, data: cached }
      }
    }
    // 强制跳过本地缓存时，通知云函数也刷新
    console.log('[CloudService] getHotNews 调用云函数 getNews (forceRefresh=' + forceRefresh + ')...')
    try {
      var res = await callCloudFunction('getNews', forceRefresh ? 'forceRefresh' : 'getHotNews', { category: category, page: page, pageSize: pageSize })
      console.log('[CloudService] getHotNews 云函数返回:', JSON.stringify(res).substring(0, 300))
      if (res.code === 0 && res.data) {
        cacheManager.set(cacheKey, res.data, config.cache.news)
      }
      return res
    } catch(e) {
      console.error('[CloudService] getHotNews 异常:', e.message)
      return { code: -1, message: '获取新闻失败: ' + e.message, data: [] }
    }
  },

  async getPlayerInfo(playerId) {
    var cacheKey = CACHE_PREFIX.PLAYER_INFO + playerId
    var cached = cacheManager.get(cacheKey, config.cache.schedule)
    if (cached) return { code: 0, data: cached }
    return await mockImpl.getPlayerInfo(playerId)
  },

  async getTeamRealtimeData(teamId) {
    var cacheKey = CACHE_PREFIX.TEAM_INFO + teamId
    var cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }
    return await mockImpl.getTeamRealtimeData(teamId)
  },

  async getRecommendPlayers(count) {
    count = count || 10
    var cacheKey = CACHE_PREFIX.PLAYER_INFO + 'recommend'
    var cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }
    return await mockImpl.getRecommendPlayers(count)
  },

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

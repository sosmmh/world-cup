// services/impl/footballCloudService.js - 云函数实现（含 fallback 到 mock）
const cacheManager = require('../../utils/cache')
const config = require('../../config')
const mockImpl = require('./footballMockService')

const CACHE_PREFIX = {
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
function callCloudFunction(name, action, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data: Object.assign({ action }, data),
      timeout: 20000,
      success: res => {
        const result = res.result || {}
        resolve({ code: result.code || 0, message: result.message || 'success', data: result.data })
      },
      fail: err => {
        console.error(`[CloudService] ${name}/${action} 调用失败:`, err)
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
  // 云函数返回了冷启动或空数据标记
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

const cloudService = {
  async getSchedule(params = {}) {
    try {
      const res = await callCloudFunction('getCompSched', 'getSchedule', params)
      if (!shouldFallbackToMock(res)) return res
    } catch(e) {
      console.warn('[CloudService] getSchedule 异常，fallback → mock:', e.message)
    }
    // Fallback: 使用 mock 数据
    console.log('[CloudService] getSchedule 使用 mock 数据')
    return await mockImpl.getSchedule(params)
  },

  async getTodayMatches(forceRefresh = false) {
    const cacheKey = CACHE_PREFIX.SCHEDULE + 'today'
    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, config.cache.schedule)
      if (cached) return { code: 0, data: cached }
    }
    try {
      const res = await callCloudFunction('getCompSched', 'todayMatches')
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
    const cacheKey = CACHE_PREFIX.LIVE_SCORE
    const cached = cacheManager.get(cacheKey, config.cache.liveScore)
    if (cached) return { code: 0, data: cached }
    try {
      const res = await callCloudFunction('getCompSched', 'liveScore')
      if (!shouldFallbackToMock(res)) {
        if (res.code === 0) cacheManager.set(cacheKey, res.data, config.cache.liveScore)
        return res
      }
    } catch(e) {
      console.warn('[CloudService] getLiveScore 异常，fallback → mock:', e.message)
    }
    return await mockImpl.getLiveScore()
  },

  async getStandings(groupName = null) {
    const cacheKey = CACHE_PREFIX.STANDINGS + (groupName || 'all')
    const cached = cacheManager.get(cacheKey, config.cache.standings)
    if (cached) return { code: 0, data: cached }
    try {
      const res = await callCloudFunction('getCompSched', 'standings', { group: groupName })
      if (!shouldFallbackToMock(res)) {
        if (res.code === 0) cacheManager.set(cacheKey, res.data, config.cache.standings)
        return res
      }
    } catch(e) {
      console.warn('[CloudService] getStandings 异常，fallback → mock:', e.message)
    }
    return await mockImpl.getStandings(groupName)
  },

  async getScorers(leagueId = null, season = null) {
    const cacheKey = CACHE_PREFIX.SCORERS + `${leagueId || 'wc'}_${season || '2026'}`
    const cached = cacheManager.get(cacheKey, config.cache.standings || 30)
    if (cached) return { code: 0, data: cached }
    try {
      const res = await callCloudFunction('getCompSched', 'scorers', { leagueId, season })
      if (!shouldFallbackToMock(res)) {
        if (res.code === 0) cacheManager.set(cacheKey, res.data, config.cache.standings || 30)
        return res
      }
    } catch(e) {
      console.warn('[CloudService] getScorers 异常，fallback → mock:', e.message)
    }
    return await mockImpl.getScorers(leagueId, season)
  },

  async getHotNews(category = null, page = 1, pageSize = 10) {
    // news 不走云函数，直接 mock
    return await mockImpl.getHotNews(category, page, pageSize)
  },

  async getPlayerInfo(playerId) {
    const cacheKey = CACHE_PREFIX.PLAYER_INFO + playerId
    const cached = cacheManager.get(cacheKey, config.cache.schedule)
    if (cached) return { code: 0, data: cached }
    return await mockImpl.getPlayerInfo(playerId)
  },

  async getTeamRealtimeData(teamId) {
    const cacheKey = CACHE_PREFIX.TEAM_INFO + teamId
    const cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }
    return await mockImpl.getTeamRealtimeData(teamId)
  },

  async getRecommendPlayers(count = 10) {
    const cacheKey = CACHE_PREFIX.PLAYER_INFO + 'recommend'
    const cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }
    return await mockImpl.getRecommendPlayers(count)
  },

  clearCache(type) {
    const prefixMap = {
      schedule: CACHE_PREFIX.SCHEDULE,
      liveScore: CACHE_PREFIX.LIVE_SCORE,
      standings: CACHE_PREFIX.STANDINGS,
      news: CACHE_PREFIX.NEWS,
      scorers: CACHE_PREFIX.SCORERS,
      playerInfo: CACHE_PREFIX.PLAYER_INFO,
      teamInfo: CACHE_PREFIX.TEAM_INFO
    }
    const prefix = prefixMap[type]
    if (prefix) cacheManager.clearByPrefix(prefix)
  }
}

module.exports = cloudService

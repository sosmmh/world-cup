// services/impl/footballMockService.js - Mock实现（降级兜底 + 真实赛程静态数据）
const mockData = require('../../data/mockData')
const staticData = require('../../data/scheduleStaticData')  // 真实API数据
const teams2026 = require('../../data/teams2026')             // 48强球队（含中英文名）
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

/**
 * 从真实静态数据中按日期筛选赛程
 */
function filterStaticByDate(params) {
  if (!staticData.allMatches || !staticData.allMatches.length) return null

  var dateFrom = params && params.dateFrom
  var dateTo = params && params.dateTo
  var status = params && params.status

  // 无筛选参数：返回全量分组
  if (!dateFrom && !dateTo && !status) {
    return {
      matches: staticData.allMatches,
      groupedByDate: staticData.groupedByDate,
      count: staticData.totalMatches,
      fetchedAt: new Date(staticData.fetchedAt).getTime(),
      cached: true,
      source: 'static-real-data'
    }
  }

  // 有筛选参数：从全量中过滤
  var filtered = staticData.allMatches.filter(function(m) {
    if (!m.utcDate) return false
    var d = m.utcDate.split('T')[0]
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    if (status && m.status !== status) return false
    return true
  })

  // 按日期重新分组
  var groups = {}
  filtered.forEach(function(m) {
    var key = m.utcDate.split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  var grouped = Object.keys(groups).sort().map(function(date) {
    var weekDays = ['周日','周一','周二','周三','周四','周五','周六']
    var dd = new Date(date+'T00:00:00Z')
    return { 
      date: date, 
      dateText: (dd.getMonth()+1)+'月'+dd.getDate()+'日 '+weekDays[dd.getDay()], 
      matches: groups[date] 
    }
  })

  return {
    matches: filtered,
    groupedByDate: grouped,
    count: filtered.length,
    fetchedAt: new Date(staticData.fetchedAt).getTime(),
    cached: true,
    source: 'static-real-data(filtered)'
  }
}

const mockService = {
  /**
   * 赛程 — 使用真实静态数据（从 API 拉取的准实时数据）
   */
  async getSchedule(params = {}) {
    const cacheKey = CACHE_PREFIX.SCHEDULE + JSON.stringify(params)
    const cached = cacheManager.get(cacheKey, config.cache.schedule)
    if (cached) return { code: 0, message: 'from cache (static)', data: cached }

    const data = filterStaticByDate(params)
    if (data) {
      console.log('[MockService] getSchedule → 静态真实数据', data.count+'场')
      const res = { code: 0, message: 'from static real data', data: data }
      cacheManager.set(cacheKey, res.data, config.cache.schedule)
      return res
    }

    // 最终降级到原始 mock 数据
    console.log('[MockService] getSchedule → 原始mock')
    return { code: 0, message: 'from mock', data: mockData.allMatches || mockData.todayMatches }
  },

  async getTodayMatches(forceRefresh = false) {
    const cacheKey = CACHE_PREFIX.SCHEDULE + 'today'
    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, config.cache.schedule)
      if (cached) return { code: 0, data: cached }
    }
    // 从静态真实数据中筛选今天+明天的比赛
    var today = new Date()
    function fmt(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
    var tmr = new Date(today); tmr.setDate(tmr.getDate()+1)

    var todayData = filterStaticByDate({ dateFrom: fmt(today), dateTo: fmt(tmr) })
    if (todayData && todayData.matches.length) {
      console.log('[MockService] getTodayMatches → 静态真实数据', todayData.matches.length+'场')
      const res = { code: 0, message: 'from static real data', data: { matches: todayData.matches, count: todayData.matches.length } }
      cacheManager.set(cacheKey, res.data, config.cache.schedule)
      return res
    }

    const res = { code: 0, message: 'from mock', data: mockData.todayMatches }
    cacheManager.set(cacheKey, res.data, config.cache.schedule)
    return res
  },

  async getLiveScore() {
    const cacheKey = CACHE_PREFIX.LIVE_SCORE
    const cached = cacheManager.get(cacheKey, config.cache.liveScore)
    if (cached) return { code: 0, data: cached }
    // 从静态数据中找进行中的比赛
    if (staticData.allMatches) {
      var live = staticData.allMatches.filter(function(m){
        return m.status==='IN_PLAY'||m.status==='LIVE'||m.status==='PAUSED'
      })
      if (live.length) {
        const res = { code: 0, data: { matches: live, count: live.length } }
        cacheManager.set(cacheKey, res.data, config.cache.liveScore)
        return res
      }
    }
    const res = { code: 0, data: mockData.liveMatches }
    cacheManager.set(cacheKey, res.data, config.cache.liveScore)
    return res
  },

  /**
   * 积分榜 — 使用真实静态数据
   */
  async getStandings(groupName = null) {
    const cacheKey = CACHE_PREFIX.STANDINGS + (groupName || 'all')
    const cached = cacheManager.get(cacheKey, config.cache.standings)
    if (cached) return { code: 0, data: cached }

    if (staticData.standings && staticData.standings.length) {
      console.log('[MockService] getStandings → 静态真实数据', staticData.standings.length+'组')
      const data = { standings: staticData.standings }
      if (groupName) {
        var filtered = staticData.standings.filter(function(s){ return s.group === groupName })
        data.standings = filtered.length ? filtered : staticData.standings
      }
      const res = { code: 0, message: 'from static real data', data: data }
      cacheManager.set(cacheKey, res.data, config.cache.standings)
      return res
    }

    const res = { code: 0, data: mockData.standings }
    cacheManager.set(cacheKey, res.data, config.cache.standings)
    return res
  },

  async getScorers(leagueId = null, season = null) {
    const cacheKey = CACHE_PREFIX.SCORERS + `${leagueId || 'wc'}_${season || '2026'}`
    const cached = cacheManager.get(cacheKey, config.cache.standings || 30)
    if (cached) return { code: 0, data: cached }
    if (staticData.scorers && staticData.scorers.length) {
      const res = { code: 0, data: staticData.scorers }
      cacheManager.set(cacheKey, res.data, config.cache.standings || 30)
      return res
    }
    const res = { code: 0, data: mockData.scorers }
    cacheManager.set(cacheKey, res.data, config.cache.standings || 30)
    return res
  },

  // 以下保持原始 mock 数据（新闻、球员、球队等非赛程类）
  async getHotNews(category = null, page = 1, pageSize = 10) {
    const cacheKey = CACHE_PREFIX.NEWS + `${category || 'all'}_${page}`
    const cached = cacheManager.get(cacheKey, config.cache.news)
    if (cached) return { code: 0, data: cached }
    const res = { code: 0, data: mockData.newsList }
    cacheManager.set(cacheKey, res.data, config.cache.news)
    return res
  },

  async getPlayerInfo(playerId) {
    const cacheKey = CACHE_PREFIX.PLAYER_INFO + playerId
    const cached = cacheManager.get(cacheKey, config.cache.schedule)
    if (cached) return { code: 0, data: cached }
    const res = { code: 0, data: mockData.playerDetail }
    cacheManager.set(cacheKey, res.data, config.cache.schedule)
    return res
  },

  async getTeamRealtimeData(teamId) {
    const cacheKey = CACHE_PREFIX.TEAM_INFO + teamId
    const cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }

    // 根据 teamId 找到球队（teamId 是 teams2026 中的自增 id）
    var team = null
    if (teams2026.teamsData2026 && teams2026.teamsData2026.length) {
      team = teams2026.teamsData2026.find(function(t) { return t.id === teamId })
    }

    // 优先从静态真实赛程中筛选该球队的所有比赛
    if (team && staticData.allMatches && staticData.allMatches.length) {
      var teamNames = [team.name, team.nameEn, team.tla].filter(Boolean)
      var teamMatches = staticData.allMatches.filter(function(m) {
        var hName = (m.homeTeam && m.homeTeam.name) || ''
        var aName = (m.awayTeam && m.awayTeam.name) || ''
        var hShort = (m.homeTeam && m.homeTeam.shortName) || ''
        var aShort = (m.awayTeam && m.awayTeam.shortName) || ''
        // 匹配英文名、中文名、缩写
        for (var i = 0; i < teamNames.length; i++) {
          if (hName === teamNames[i] || aName === teamNames[i] ||
              hShort === teamNames[i] || aShort === teamNames[i]) {
            return true
          }
        }
        return false
      })

      if (teamMatches.length > 0) {
        // 给每场比赛标记是否主队
        var enriched = teamMatches.map(function(m) {
          var hName = (m.homeTeam && m.homeTeam.name) || ''
          var hShort = (m.homeTeam && m.homeTeam.shortName) || ''
          var isHome = false
          for (var j = 0; j < teamNames.length; j++) {
            if (hName === teamNames[j] || hShort === teamNames[j]) { isHome = true; break }
          }
          m._isHome = isHome
          return m
        })

        console.log('[MockService] getTeamRealtimeData → 静态赛程筛选', team.name, enriched.length+'场')
        const res = { code: 0, data: { matches: enriched } }
        cacheManager.set(cacheKey, res.data, config.cache.teams)
        return res
      }
    }

    // 降级到原始 mock 数据
    const res = { code: 0, data: mockData.teamDetail }
    cacheManager.set(cacheKey, res.data, config.cache.teams)
    return res
  },

  async getRecommendPlayers(count = 10) {
    const cacheKey = CACHE_PREFIX.PLAYER_INFO + 'recommend'
    const cached = cacheManager.get(cacheKey, config.cache.teams)
    if (cached) return { code: 0, data: cached }
    const res = { code: 0, data: mockData.recommendPlayers }
    cacheManager.set(cacheKey, res.data, config.cache.teams)
    return res
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
    if (prefix) {
      cacheManager.clearByPrefix(prefix)
    }
  }
}

module.exports = mockService

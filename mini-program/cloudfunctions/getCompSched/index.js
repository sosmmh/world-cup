// cloudfunctions/getCompSched/index.js
// 纯缓存+回源架构：内存缓存 + API回源 + 定时热更新

var fetch = require('node-fetch')

var API_BASE_URL = 'https://api.football-data.org/v4'
var API_KEY = 'b997520e767f49c289a6f5b26b6e732c'
var WORLD_CUP_ID = '2000'

var CACHE_TTL = { matches: 60, standings: 120, scorers: 300 }

var _db = {
  matches: null,
  groupedByDate: null,
  standings: null,
  scorers: null,
  fetchedAt: { matches: null, standings: null, scorers: null },
  isFetching: { matches: false, standings: false, scorers: false }
}

console.log('[getCompSched] 启动 纯缓存模式')

/* ==================== 工具函数 ==================== */

function requestApi(endpoint, params, retryCount) {
  retryCount = retryCount || 0
  var keys = Object.keys(params || {})
  var qs = keys
    .filter(function(k) { return params[k] != null && params[k] !== '' })
    .map(function(k) { return k + '=' + encodeURIComponent(params[k]) })
    .join('&')
  var url = API_BASE_URL + endpoint + (qs ? '?' + qs : '')
  console.log('[getCompSched] API请求:', url, retryCount > 0 ? '(重试' + retryCount + ')' : '')
  var controller = new AbortController()
  var timer = setTimeout(function() { controller.abort() }, 55000)
  return fetch(url, {
    headers: { 'X-Auth-Token': API_KEY },
    signal: controller.signal
  }).then(function(res) {
    clearTimeout(timer)
    if (!res.ok) return { code: res.status, message: 'API错误 ' + res.statusText, data: null }
    return res.json().then(function(data) { return { code: 0, message: 'success', data: data } })
  }).catch(function(e) {
    clearTimeout(timer)
    console.error('[getCompSched] API异常:', e.message, '| url:', url, '| 重试次数:', retryCount)
    // 自动重试1次（网络抖动）
    if (retryCount < 1 && (e.message || '').indexOf('abort') !== -1) {
      console.log('[getCompSched] 检测到超时，2秒后重试...')
      return new Promise(function(resolve) {
        setTimeout(function() { resolve(requestApi(endpoint, params, retryCount + 1)) }, 2000)
      })
    }
    return { code: -1, message: e.message || '网络失败', data: null }
  })
}

function formatMatch(match) {
  var homeScore = (match.score && match.score.fullTime) ? match.score.fullTime.home : null
  var awayScore = (match.score && match.score.fullTime) ? match.score.fullTime.away : null
  var halfHome  = (match.score && match.score.halfTime)  ? match.score.halfTime.home  : null
  var halfAway  = (match.score && match.score.halfTime)  ? match.score.halfTime.away  : null
  var timeText = ''
  if (match.utcDate) {
    try {
      var dt = new Date(match.utcDate)
      var h = dt.getUTCHours() + 8
      if (h >= 24) h -= 24
      timeText = String(h).padStart(2,'0') + ':' + String(dt.getUTCMinutes()).padStart(2,'0')
    } catch(e) { timeText = '' }
  }
  var statusMap = {
    SCHEDULED:'未开始', TIMED:'待定', IN_PLAY:'进行中', LIVE:'直播中',
    PAUSED:'中场休息', FINISHED:'已结束', AWARDED:'已取消',
    POSTPONED:'延期', SUSPENDED:'中断', CANCELLED:'取消'
  }
  var statusText = statusMap[match.status] || (match.status || '')
  var minuteStr = match.minute ? match.minute + "'" : ''
  var isLive = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED'
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
      name: match.awayTeam ? (match.awayTeam.name || '') : '',
      shortName: match.awayTeam ? (match.awayTeam.tla || '') : '',
      crest: match.awayTeam ? (match.awayTeam.crest || '') : ''
    },
    score: match.score ? { fullTime:{home:homeScore, away:awayScore}, halfTime:{home:halfHome, away:halfAway} } : null,
    status: match.status,
    utcDate: match.utcDate,
    timeText: timeText,
    statusText: statusText,
    minuteStr: minuteStr,
    isLive: isLive,
    isScheduled: match.status === 'SCHEDULED' || !match.score,
    hasScore: !!(match.score && homeScore != null),
    homeScoreDisplay: homeScore != null ? homeScore : '-',
    awayScoreDisplay: awayScore != null ? awayScore : '-',
    halfTimeDisplay: (halfHome != null && halfAway != null) ? (halfHome + '-' + halfAway) : '',
    matchday: match.matchday,
    group: match.group || null,
    minute: match.minute || null,
    competition: match.competition ? {id: match.competition.id, name: match.competition.name} : null,
    _homeScore: (homeScore != null) ? homeScore : 0,
    _awayScore: (awayScore != null) ? awayScore : 0
  }
}

function groupMatchesByDate(matches) {
  var groups = {}
  for (var i = 0; i < matches.length; i++) {
    var m = matches[i]
    if (!m.utcDate) continue
    var key = m.utcDate.split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  var dates = Object.keys(groups).sort()
  var result = []
  for (var j = 0; j < dates.length; j++) {
    result.push({ date: dates[j], dateText: formatDisplayDate(dates[j]), matches: groups[dates[j]] })
  }
  return result
}

function formatDisplayDate(dateStr) {
  var d = new Date(dateStr + 'T00:00:00Z')
  var weekDays = ['周日','周一','周二','周三','周四','周五','周六']
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weekDays[d.getDay()]
}

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function isExpired(type) {
  var fetchedAt = _db.fetchedAt[type]
  if (!fetchedAt) return true
  var ageSec = (Date.now() - fetchedAt) / 1000
  var ttl = CACHE_TTL[type] || 60
  return ageSec > ttl
}

function filterByDateFromMemory(dateFrom, dateTo, status) {
  if (!_db.matches) return null
  var filtered = []
  for (var i = 0; i < _db.matches.length; i++) {
    var m = _db.matches[i]
    if (!m.utcDate) continue
    var d = m.utcDate.split('T')[0]
    if (dateFrom && d < dateFrom) continue
    if (dateTo && d > dateTo) continue
    if (status && m.status !== status) continue
    filtered.push(m)
  }
  var grouped = groupMatchesByDate(filtered)
  return { matches: filtered, groupedByDate: grouped, count: filtered.length, fetchedAt: _db.fetchedAt.matches, cached: true, source: 'memory-db' }
}

function getScheduleReadView() {
  return {
    matches: _db.matches,
    groupedByDate: _db.groupedByDate,
    count: _db.matches ? _db.matches.length : 0,
    fetchedAt: _db.fetchedAt.matches,
    cached: true,
    source: 'memory-db'
  }
}

/* ==================== 回源层 ==================== */

function refreshMatchesData(apiParams) {
  if (_db.isFetching.matches) {
    console.log('[getCompSched] 赛程刷新中，跳过')
    return Promise.resolve(_db.matches ? { code:0, message:'busy(cached)', data:getScheduleReadView() } : { code:-1, message:'busy(no data)' })
  }
  _db.isFetching.matches = true
  // 回源时始终拉全量赛程（使用 /competitions/{id}/matches 端点 + 日期范围）
  var params = { dateFrom: '2026-06-11', dateTo: '2026-07-19' }
  console.log('[getCompSched] [回源] 调用API拉取全量赛程...')
  return requestApi('/competitions/' + WORLD_CUP_ID + '/matches', params).then(function(result) {
    console.log('[getCompSched] [回源] API返回 code:', result.code, 'message:', result.message,
      'matchesCount:', (result.data && result.data.matches) ? result.data.matches.length : '无',
      'dataKeys:', result.data ? Object.keys(result.data) : 'null')
    if (result.code === 0 && result.data.matches && result.data.matches.length) {
      var formatted = []
      for (var i = 0; i < result.data.matches.length; i++) {
        formatted.push(formatMatch(result.data.matches[i]))
      }
      var grouped = groupMatchesByDate(formatted)
      _db.matches = formatted
      _db.groupedByDate = grouped
      _db.fetchedAt.matches = Date.now()
      var scoredCount = 0
      for (var j = 0; j < formatted.length; j++) { if (formatted[j].hasScore) scoredCount++ }
      console.log('[getCompSched] [回源] 赛程已更新:', formatted.length, '场 有比分:', scoredCount, '场')
      return { code:0, message:'refreshed from api', data:getScheduleReadView() }
    }
    console.warn('[getCompSched] [回源] API无新数据或失败, code:', result.code, 'msg:', result.message)
    // 把真实错误信息透传给前端，不再吞错误
    if (result.code !== 0) {
      return { code: result.code, message: 'API_ERROR:' + result.message, data: { matches:[], groupedByDate:[], count:0, fetchedAt:null, cached:false, source:'api-error', errorDetail: result.message } }
    }
    return { code:0, message:'no change', data: _db.matches ? getScheduleReadView() : { matches:[], groupedByDate:[], count:0, fetchedAt:null, cached:false, source:'empty' } }
  }).catch(function(e) {
    console.error('[getCompSched] [回源] 异常:', e)
    return { code:-1, message: e.message, data: _db.matches ? getScheduleReadView() : null }
  }).then(function(result) {
    _db.isFetching.matches = false
    return result
  })
}

/**
 * 从全量赛程数据中本地计算积分榜
 * 展示全部参赛球队，有比分的统计进去，没比赛的显示 0 场 0 分
 * 只对小组赛（有 group 字段）进行分组统计
 */
function computeStandingsFromMatches() {
  if (!_db.matches || _db.matches.length === 0) return null

  // 第一步：从全部赛程中提取所有参赛球队 + 确定所属小组（确保48支全显示）
  var teamStats = {}
  for (var i = 0; i < _db.matches.length; i++) {
    var m = _db.matches[i]
    if (!m.group) continue  // 只处理小组赛
    if (m.homeTeam.id != null && !teamStats[m.homeTeam.id]) {
      teamStats[m.homeTeam.id] = {
        id: m.homeTeam.id, name: m.homeTeam.name, shortName: m.homeTeam.shortName,
        crest: m.homeTeam.crest, group: m.group,
        playedGames: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
      }
    }
    if (m.awayTeam.id != null && !teamStats[m.awayTeam.id]) {
      teamStats[m.awayTeam.id] = {
        id: m.awayTeam.id, name: m.awayTeam.name, shortName: m.awayTeam.shortName,
        crest: m.awayTeam.crest, group: m.group,
        playedGames: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
      }
    }
  }

  console.log('[getCompSched] [积分榜] 发现参赛球队:', Object.keys(teamStats).length, '支')

  // 第二步：只统计已完赛且有比分的比赛
  for (var j = 0; j < _db.matches.length; j++) {
    var match = _db.matches[j]
    if (match.status !== 'FINISHED' || !match.hasScore) continue
    if (!match.group) continue

    var homeId = match.homeTeam.id
    var awayId = match.awayTeam.id
    var hs = match._homeScore
    var as = match._awayScore

    if (homeId == null || awayId == null || !teamStats[homeId] || !teamStats[awayId]) continue

    var ht = teamStats[homeId]
    var at = teamStats[awayId]

    ht.playedGames++
    ht.goalsFor += hs
    ht.goalsAgainst += as
    if (hs > as) { ht.won++; ht.points += 3 }
    else if (hs === as) { ht.drawn++; ht.points += 1 }
    else { ht.lost++ }

    at.playedGames++
    at.goalsFor += as
    at.goalsAgainst += hs
    if (as > hs) { at.won++; at.points += 3 }
    else if (as === hs) { at.drawn++; at.points += 1 }
    else { at.lost++ }
  }

  // 全部球队合并为一张表，按积分排序
  var allTeams = []
  var statKeys = Object.keys(teamStats)
  for (var k = 0; k < statKeys.length; k++) {
    var s = teamStats[statKeys[k]]
    s.goalDifference = s.goalsFor - s.goalsAgainst
    allTeams.push(s)
  }

  // 排序：积分降序 → 净胜球降序 → 进球降序
  allTeams.sort(function(a, b) {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })
  // 加上排名
  for (var pos = 0; pos < allTeams.length; pos++) {
    allTeams[pos].position = pos + 1
  }

  console.log('[getCompSched] [积分榜] 从赛程计算出', allTeams.length, '支球队')
  // 返回单组结构，兼容前端（前端取 standings[0].table 即可）
  return [{ group: 'ALL', table: allTeams }]
}

function refreshStandingsData(params) {
  // 积分榜不再单独调API，从内存赛程数据本地计算
  if (_db.isFetching.standings) {
    return Promise.resolve(_db.standings ? { code:0, message:'busy(cached)', data:{standings:_db.standings} } : { code:-1, message:'busy' })
  }
  _db.isFetching.standings = true

  // 先确保有赛程数据，没有则触发回源
  var self = this
  var doCompute = function() {
    var computed = computeStandingsFromMatches()
    if (computed && computed.length > 0) {
      _db.standings = computed
      _db.fetchedAt.standings = Date.now()
      console.log('[getCompSched] [回源] 积分榜已更新(本地计算):', computed.length, '组')
      return { code:0, message:'computed from matches', data: { standings: computed } }
    }
    console.warn('[getCompSched] [回源] 无赛程数据可计算积分榜')
    return _db.standings ? { code:0, message:'cached', data:{standings:_db.standings} } : { code:0, message:'no data', data:{standings:[]} }
  }

  if (_db.matches && !isExpired('matches')) {
    _db.isFetching.standings = false
    return Promise.resolve(doCompute())
  }
  console.log('[getCompSched] [回源] 积分榜:赛程为空或过期,先拉取赛程...')
  return refreshMatchesData({}).then(function(r) {
    _db.isFetching.standings = false
    return doCompute()
  }).catch(function(e) {
    _db.isFetching.standings = false
    console.error('[getCompSched] [回源] 积分榜异常:', e)
    return { code:-1, message: e.message }
  })
}

function refreshScorersData(params) {
  if (_db.isFetching.scorers) {
    return Promise.resolve(_db.scorers ? { code:0, message:'busy(cached)', data: _db.scorers } : { code:-1, message:'busy' })
  }
  _db.isFetching.scorers = true
  var leagueId = (params && params.leagueId) || WORLD_CUP_ID
  var season = (params && params.season) || '2026'
  var limit = (params && params.limit) || 10
  return requestApi('/competitions/' + leagueId + '/scorers', { limit: limit }).then(function(result) {
    if (result.code === 0 && result.data.scorers && result.data.scorers.length) {
      var formatted = []
      for (var i = 0; i < result.data.scorers.length; i++) {
        var s = result.data.scorers[i]
        formatted.push({ rank: i+1, playerId: s.player.id, playerName: s.player.name, teamId: s.team.id, teamName: s.team.name, teamCrest: s.team.crest || '', goals: s.goals || 0, assists: s.assists || 0, playedGames: s.playedGames || 0 })
      }
      _db.scorers = formatted
      _db.fetchedAt.scorers = Date.now()
      console.log('[getCompSched] [回源] 射手榜已更新:', formatted.length, '人')
      return { code:0, message:'refreshed', data: formatted }
    }
    return result
  }).catch(function(e) {
    console.error('[getCompSched] [回源] 射手榜异常:', e)
    return { code:-1, message: e.message }
  }).then(function(result) {
    _db.isFetching.scorers = false
    return result
  })
}

/* ==================== action 处理函数 ==================== */

function handleGetSchedule(event) {
  if (_db.matches && !isExpired('matches')) {
    var ageMs = Date.now() - _db.fetchedAt.matches
    if (event.dateFrom || event.dateTo || event.status) {
      var filtered = filterByDateFromMemory(event.dateFrom, event.dateTo, event.status)
      if (filtered) return Promise.resolve({ code:0, message:'from memory-db (filtered)', data:filtered })
    }
    return Promise.resolve({ code:0, message:'from memory-db', data:getScheduleReadView() })
  }
  console.log('[getCompSched] 赛程' + (_db.matches ? '过期' : '为空') + ', 触发回源')
  return refreshMatchesData(event).then(function(result) {
    if (result.code === 0 && result.data && (event.dateFrom || event.dateTo || event.status)) {
      var f = filterByDateFromMemory(event.dateFrom, event.dateTo, event.status)
      if (f) return { code:0, message:'from api (filtered)', data:f }
    }
    return result
  })
}

function handleTodayMatches() {
  if (!_db.matches || isExpired('matches')) {
    return refreshMatchesData({}).then(function() { return doTodayMatches() })
  }
  return Promise.resolve(doTodayMatches())
}

function doTodayMatches() {
  if (!_db.matches) return { code:0, message:'no_data', data: { matches:[], count:0 } }
  var today = new Date()
  var dateFrom = formatDate(today)
  var tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  var dateTo = formatDate(tomorrow)
  var filtered = []
  for (var i = 0; i < _db.matches.length; i++) {
    var m = _db.matches[i]
    if (!m.utcDate) continue
    var d = m.utcDate.split('T')[0]
    if (d >= dateFrom && d <= dateTo) filtered.push(m)
  }
  return { code:0, message:'from memory-db', data: { matches:filtered, count:filtered.length, dateFrom:dateFrom, dateTo:dateTo } }
}

function handleLiveScore() {
  var LIVE_TTL = 30
  var expired = !_db.matches || !_db.fetchedAt.matches || ((Date.now() - _db.fetchedAt.matches) / 1000 > LIVE_TTL)
  if (expired) {
    return refreshMatchesData({}).then(function() { return doLiveScore() })
  }
  return Promise.resolve(doLiveScore())
}

function doLiveScore() {
  if (!_db.matches) return { code:0, message:'no_data', data: { matches:[], count:0 } }
  var live = []
  for (var i = 0; i < _db.matches.length; i++) {
    var s = _db.matches[i].status
    if (s === 'IN_PLAY' || s === 'LIVE' || s === 'PAUSED') live.push(_db.matches[i])
  }
  return { code:0, message:'from memory-db', data: { matches:live, count:live.length } }
}

function handleStandings(groupName) {
  // 如果赛程数据新鲜，直接从内存计算积分榜（不额外调API）
  if (_db.matches && !isExpired('matches')) {
    var computed = computeStandingsFromMatches()
    if (computed) _db.standings = computed
  }
  // 无数据或过期则回源
  return refreshStandingsData({ group: groupName }).then(function() { return doStandings(groupName) })
}

function doStandings(groupName) {
  if (!_db.standings) return { code:0, message:'no_data', data: { standings:[] } }
  var data = { standings: _db.standings }
  if (groupName) {
    data.standings = []
    for (var i = 0; i < _db.standings.length; i++) {
      if (_db.standings[i].group === groupName || groupName === 'all') data.standings.push(_db.standings[i])
    }
  }
  return { code:0, message:'from memory-db', data: data }
}

function handleScorers() {
  if (!_db.scorers || isExpired('scorers')) {
    return refreshScorersData({}).then(function() { return doScorers() })
  }
  return Promise.resolve(doScorers())
}

function doScorers() {
  if (_db.scorers) return { code:0, message:'from memory-db', data: _db.scorers }
  return { code:0, message:'no_data', data: [] }
}

/* ==================== 入口 ==================== */

exports.main = function(event, context) {
  var isTimerTrigger = (event && event.Type === 'Timer') || !(event && event.action)
  var action = (event && event.action) || (isTimerTrigger ? 'refreshCache' : 'getSchedule')

  console.log('[getCompSched] action=' + action + (isTimerTrigger ? ' [定时器]' : ''))

  switch(action) {
    case 'getSchedule':
    case 'schedule':
      return handleGetSchedule(event)

    case 'todayMatches':
      return handleTodayMatches()

    case 'liveScore':
      return handleLiveScore()

    case 'standings':
      return handleStandings(event.group)

    case 'scorers':
      return handleScorers()

    case 'refreshCache':
      console.log('[getCompSched] 定时刷新开始')
      return refreshMatchesData({})
        .then(function(r1) {
          // 赛程拉取完成后，本地计算积分榜
          var standingsResult = computeStandingsFromMatches()
          if (standingsResult) { _db.standings = standingsResult; _db.fetchedAt.standings = Date.now() }
          return refreshScorersData({}).then(function(r3) {
            console.log('[getCompSched] 定时刷新完成 (积分榜已从赛程计算)')
            return { code:0, message:'all refreshed', data: { matches:r1.data, standings:standingsResult ? {standings:standingsResult} : r3.data, scorers:r3.data } }
          })
        })

    case 'forceRefresh':
      console.log('[getCompSched] 强制刷新')
      return refreshMatchesData(event).then(function(r) { return r })

    case 'refreshStandings':
      return refreshStandingsData(event)

    case 'refreshScorers':
      return refreshScorersData(event)

    default:
      return Promise.resolve({ code:-1, message:'未知action: ' + action, data:null })
  }
}

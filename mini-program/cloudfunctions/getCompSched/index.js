// cloudfunctions/getCompSched/index.js
// 内存缓存即DB架构：静态数据冷启动 + 定时器热更新

const fetch = require('node-fetch')
const _staticData = require('./staticData')  // 真实赛程静态数据（95场）

// ==================== 配置 ====================
const API_BASE_URL = 'https://api.football-data.org/v4'
const API_KEY = 'b997520e767f49c289a6f5b26b6e732c'
const WORLD_CUP_ID = '2000'

// ==================== 内存数据库（启动时从静态数据初始化）====================
let _db = {
  matches: _staticData.allMatches || null,           // 全量格式化后的比赛数组
  groupedByDate: _staticData.groupedByDate || null,   // 按日期分组的比赛
  standings: _staticData.standings || null,           // 积分榜
  scorers: _staticData.scorers || null,               // 射手榜
  fetchedAt: _staticData.fetchedAt ? new Date(_staticData.fetchedAt).getTime() : Date.now(),
  isFetching: false,
  source: 'cold-start-static'                         // 标记数据来源
}

console.log('[getCompSched] 冷启动完成，内存已加载:', (_db.matches||[]).length, '场比赛, 来源:', _db.source)

// ==================== 工具函数 ====================

async function requestApi(endpoint, params) {
  const qs = Object.keys(params)
    .filter(k => params[k] != null && params[k] !== '')
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&')
  var url = API_BASE_URL + endpoint + (qs ? '?' + qs : '')
  console.log('[getCompSched] API请求:', url)
  try {
    var controller = new AbortController()
    var timer = setTimeout(function() { controller.abort() }, 15000)
    var res = await fetch(url, { 
      headers: { 'X-Auth-Token': API_KEY },
      signal: controller.signal 
    })
    clearTimeout(timer)
    if (!res.ok) return { code: res.status, message: 'API错误 ' + res.statusText, data: null }
    var data = await res.json()
    return { code: 0, message: 'success', data: data }
  } catch (e) {
    console.error('[getCompSched] API异常:', e)
    return { code: -1, message: e.message || '网络失败', data: null }
  }
}

function formatMatch(match) {
  var homeScore = match.score && match.score.fullTime ? match.score.fullTime.home : null
  var awayScore = match.score && match.score.fullTime ? match.score.fullTime.away : null
  var halfHome   = match.score && match.score.halfTime  ? match.score.halfTime.home : null
  var halfAway   = match.score && match.score.halfTime  ? match.score.halfTime.away : null

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
    'SCHEDULED':'未开始','TIMED':'待定','IN_PLAY':'进行中','LIVE':'直播中',
    'PAUSED':'中场休息','FINISHED':'已结束','AWARDED':'已取消',
    'POSTPONED':'延期','SUSPENDED':'中断','CANCELLED':'取消'
  }
  var statusText = statusMap[match.status] || (match.status||'')
  var minuteStr = match.minute ? match.minute+"'" : ''
  var isLive = match.status==='IN_PLAY'||match.status==='LIVE'||match.status==='PAUSED'

  return {
    id: match.id,
    homeTeam: { id: match.homeTeam?match.homeTeam.id:null, name: match.homeTeam?match.homeTeam.name:'', shortName: match.homeTeam?(match.homeTeam.tla||''):'', crest: match.homeTeam?(match.homeTeam.crest||''):'' },
    awayTeam: { id: match.awayTeam?match.awayTeam.id:null, name: match.awayTeam?match.awayTeam.name:'', shortName: match.awayTeam?(match.awayTeam.tla||''):'', crest: match.awayTeam?(match.awayTeam.crest||''):'' },
    score: match.score ? { fullTime:{home:homeScore,away:awayScore}, halfTime:{home:halfHome,away:halfAway} } : null,
    status: match.status, utcDate: match.utcDate,
    timeText, statusText, minuteStr, isLive,
    isScheduled: match.status==='SCHEDULED'||!match.score,
    hasScore: !!(match.score&&homeScore!=null),
    homeScoreDisplay: homeScore!=null?homeScore:'-',
    awayScoreDisplay: awayScore!=null?awayScore:'-',
    halfTimeDisplay: (halfHome!=null&&halfAway!=null)?(halfHome+'-'+halfAway):'',
    matchday: match.matchday, group: match.group||null, minute: match.minute||null,
    competition: match.competition?{id:match.competition.id,name:match.competition.name}:null,
    _homeScore: (homeScore!=null)?homeScore:0,
    _awayScore: (awayScore!=null)?awayScore:0
  }
}

function groupMatchesByDate(matches) {
  var groups = {}
  matches.forEach(function(m) {
    if (!m.utcDate) return
    var key = m.utcDate.split('T')[0]
    if (!groups[key]) groups[key]=[]
    groups[key].push(m)
  })
  return Object.keys(groups).sort().map(function(date) {
    return { date: date, dateText: formatDisplayDate(date), matches: groups[date] }
  })
}

function formatDisplayDate(dateStr) {
  var d = new Date(dateStr+'T00:00:00Z')
  var weekDays = ['周日','周一','周二','周三','周四','周五','周六']
  return (d.getMonth()+1)+'月'+d.getDate()+'日 '+weekDays[d.getDay()]
}

function formatDate(d) {
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
}

/**
 * 从全量内存中按日期筛选（纯内存操作，<1ms）
 */
function filterByDateFromMemory(dateFrom, dateTo, status) {
  if (!_db.matches) return null

  var filtered = _db.matches.filter(function(m) {
    if (!m.utcDate) return false
    var d = m.utcDate.split('T')[0]
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    if (status && m.status !== status) return false
    return true
  })

  var grouped = groupMatchesByDate(filtered)
  console.log('[getCompSched] 内存筛选:', _db.matches.length,'→',filtered.length,'场')

  return {
    matches: filtered,
    groupedByDate: grouped,
    count: filtered.length,
    fetchedAt: _db.fetchedAt,
    cached: true,
    source: 'memory'
  }
}

// ==================== 数据写入层（仅定时器和forceRefresh调用）====================

async function refreshMatchesData(apiParams) {
  // 防并发
  if (_db.isFetching) {
    console.log('[getCompSched] 正在刷新中，跳过重复请求')
    return _db.matches ? { code:0, message:'busy(cached)', data:getScheduleReadView() } : { code:-1, message:'busy(no data yet)' }
  }

  _db.isFetching = true
  try {
    var params = apiParams ? Object.assign({},apiParams) : {}
    if (!params.competition) params.competition = WORLD_CUP_ID
    if (!params.season) params.season = '2026'

    console.log('[getCompSched] [写入层] 调用API拉取赛程...')

    var result = await requestApi('/matches', params)

    if (result.code === 0 && result.data.matches && result.data.matches.length) {
      var formatted = result.data.matches.map(formatMatch)
      var grouped = groupMatchesByDate(formatted)
      _db.matches = formatted
      _db.groupedByDate = grouped
      _db.fetchedAt = Date.now()
      _db.source = 'api-refresh'
      console.log('[getCompSched] [写入层] 赛程数据已更新到内存DB:', formatted.length,'场, source → api-refresh')
      return { code:0, message:'refreshed', data:getScheduleReadView() }
    }

    console.warn('[getCompSched] [写入层] API无新数据')
    return { code:0, message:'no change', data:_db.matches ? getScheduleReadView() : { matches:[], groupedByDate:[], count:0, fetchedAt:null } }
  } catch(e) {
    console.error('[getCompSched] [写入层] 异常:', e)
    return { code:-1, message:e.message, data:_db.matches ? getScheduleReadView() : null }
  } finally {
    _db.isFetching = false
  }
}

async function refreshStandingsData(params) {
  _db.isFetching = true
  try {
    var group = (params && params.group) || null
    var competitionId = (params && params.competition) || WORLD_CUP_ID
    var endpoint = '/competitions/'+competitionId+'/standings'
    var qParts = []
    if (group) qParts.push('standingType=GROUP&group='+group)
    qParts.push('season=2026')
    endpoint += '?'+qParts.join('&')

    var result = await requestApi(endpoint)
    if (result.code === 0 && result.data.standings && result.data.standings.length) {
      var formatted = result.data.standings.map(function(s) {
        var fg = (s.table&&s.table[0])?s.table[0].group:''
        return {
          group: s.group || fg || 'ALL',
          table: s.table.map(function(team){
            return {
              position:team.position, team:{id:team.team.id,name:team.team.name,shortName:team.team.tla,crest:team.team.crest},
              playedGames:team.playedGames,won:team.won,drawn:team.drawn,lost:team.lost,
              goalsFor:team.goalsFor,goalsAgainst:team.goalsAgainst,goalDifference:team.goalDifference,
              points:team.points,form:team.form
            }
          })
        }
      })
      _db.standings = formatted
      console.log('[getCompSched] [写入层] 积分榜数据已更新:', formatted.length,'组')
      return { code:0, message:'refreshed', data: { standings:formatted } }
    }
    return result
  } catch(e) {
    console.error('[getCompSched] [写入层] 积分榜异常:', e)
    return { code:-1, message:e.message }
  } finally {
    _db.isFetching = false
  }
}

async function refreshScorersData(params) {
  _db.isFetching = true
  try {
    var leagueId = (params&&params.leagueId)||WORLD_CUP_ID
    var season = (params&&params.season)||'2026'
    var limit = (params&&params.limit)||10

    var result = await requestApi('/competitions/'+leagueId+'/scorers', { limit:limit })
    if (result.code === 0 && result.data.scorers && result.data.scorers.length) {
      var formatted = result.data.scorers.map(function(s,i){
        return { rank:i+1, playerId:s.player.id, playerName:s.player.name, teamId:s.team.id, teamName:s.team.name, teamCrest:s.team.crest||'', goals:s.goals||0, assists:s.assists||0, playedGames:s.playedGames||0 }
      })
      _db.scorers = formatted
      console.log('[getCompSched] [写入层] 射手榜数据已更新:', formatted.length,'人')
      return { code:0, message:'refreshed', data: formatted }
    }
    return result
  } catch(e) {
    console.error('[getCompSched] [写入层] 射手榜异常:', e)
    return { code:-1, message:e.message }
  } finally {
    _db.isFetching = false
  }
}


// ==================== 数据读取层（所有请求走这里，纯内存，<5ms）====================

function getScheduleReadView() {
  return {
    matches: _db.matches,
    groupedByDate: _db.groupedByDate,
    count: _db.matches ? _db.matches.length : 0,
    fetchedAt: _db.fetchedAt,
    cached: true,
    source: 'memory-db'
  }
}


// ==================== 各 action 实现（只读层）====================

/**
 * 赛程查询 — 纯内存读取，永不调外部API
 */
function handleGetSchedule(event) {
  // 有数据且未过期（5分钟内视为有效）
  if (_db.matches && _db.fetchedAt) {
    var ageMs = Date.now() - _db.fetchedAt

    if (event.dateFrom || event.dateTo || event.status) {
      console.log('[getCompSched] [读取层] 【按日期筛选赛程】 dateFrom='+(event.dateFrom||'无')+' dateTo='+(event.dateTo||'无')+' status='+(event.status||'无') + ' | 数据来源: '+_db.source+' | 缓存年龄: '+(ageMs/1000).toFixed(1)+'s')
      var filtered = filterByDateFromMemory(event.dateFrom, event.dateTo, event.status)
      if (filtered) return { code:0, message:'from memory-db (filtered)', data:filtered }
    }

    console.log('[getCompSched] [读取层] 【总赛程】全量返回 | 数据来源: '+_db.source+' | 缓存年龄: '+(ageMs/1000).toFixed(1)+'s | 总场次: '+_db.matches.length)
    return { code:0, message:'from memory-db', data:getScheduleReadView() }
  }

  // 内存为空（冷启动）— 返回空结构，让客户端兜底mock
  console.warn('[getCompSched] [读取层] 【冷启动-静态数据】内存DB为空，返回空结果（客户端将使用本地mock数据）| 当前source='+_db.source)
  return {
    code: 0,
    message: 'cold_start',
    data: { matches: [], groupedByDate: [], count: 0, fetchedAt: null, cached: false, source: 'empty' }
  }
}

/**
 * 今日比赛 — 纯内存读取
 */
function handleTodayMatches() {
  if (!_db.matches) {
    console.log('[getCompSched] [读取层] 【今日赛程】无数据（冷启动）')
    return { code:0, message:'no_data', data: { matches:[], count:0 } }
  }

  var today = new Date()
  var dateFrom = formatDate(today)
  var tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
  var dateTo = formatDate(tomorrow)

  var filtered = _db.matches.filter(function(m) {
    if (!m.utcDate) return false
    var d = m.utcDate.split('T')[0]
    return d >= dateFrom && d <= dateTo
  })

  console.log('[getCompSched] [读取层] 【今日赛程】'+dateFrom+' ~ '+dateTo+' | 数据来源: '+_db.source+' | 筛选结果: '+filtered.length+'/'+_db.matches.length+'场')
  return { code:0, message:'from memory-db', data: { matches:filtered, count:filtered.length, dateFrom:dateFrom, dateTo:dateTo } }
}

/**
 * 实时比分 — 纯内存读取
 */
function handleLiveScore() {
  if (!_db.matches) {
    console.log('[getCompSched] [读取层] 【实时比分】无数据（冷启动）')
    return { code:0, message:'no_data', data: { matches:[], count:0 } }
  }

  var live = _db.matches.filter(function(m) {
    return m.status==='IN_PLAY'||m.status==='LIVE'||m.status==='PAUSED'
  })

  console.log('[getCompSched] [读取层] 【实时比分】数据来源: '+_db.source+' | 正在比赛: '+live.length+'/'+_db.matches.length+'场')
  return { code:0, message:'from memory-db', data: { matches:live, count:live.length } }
}

/**
 * 积分榜 — 纯内存读取
 */
function handleStandings() {
  if (_db.standings) return { code:0, message:'from memory-db', data: { standings:_db.standings } }
  return { code:0, message:'no_data', data: { standings:[] } }
}

/**
 * 射手榜 — 纯内存读取
 */
function handleScorers() {
  if (_db.scorers) return { code:0, message:'from memory-db', data: _db.scorers }
  return { code:0, message:'no_data', data: [] }
}


// ==================== 云函数入口 ====================

exports.main = async (event, context) => {
  // 定时器触发时 event 不带 action 字段，自动走 refreshCache 刷新数据
  var isTimerTrigger = (event && event.Type === 'Timer') || !(event && event.action)
  var action = (event && event.action) || (isTimerTrigger ? 'refreshCache' : 'getSchedule')
  console.log('[getCompSched] ====== 入口 action='+action + (isTimerTrigger ? ' [定时器触发]' : '') + ' ======')
  console.log('[getCompSched] [入口] event参数:', JSON.stringify(event))
  console.log('[getCompSched] [入口] 当前内存DB状态: source='+_db.source+', matches='+(_db.matches?_db.matches.length:'null')+', fetchedAt='+(_db.fetchedAt ? new Date(_db.fetchedAt).toISOString() : 'null'))

  switch(action) {

    // ========== 读取操作（纯内存，永远快）==========
    case 'getSchedule':
      return handleGetSchedule(event)

    case 'schedule':
      return handleGetSchedule(event)

    case 'todayMatches':
      return handleTodayMatches()

    case 'liveScore':
      return handleLiveScore()

    case 'standings':
      return handleStandings()

    case 'scorers':
      return handleScorers()

    // ========== 写入操作（调外部API，由定时器/手动触发调用）==========
    
    /**
     * 定时器触发 — 刷新全部数据到内存DB
     */
    case 'refreshCache': {
      var beforeSource = _db.source
      console.log('[getCompSched] ====== 定时刷新开始 (刷新前source='+beforeSource+') ======')
      var r1 = await refreshMatchesData({})
      // 并行刷新其他数据（可选）
      // await refreshStandingsData({})
      // await refreshScorersData({})
      console.log('[getCompSched] ====== 定时刷新完成 | 刷新前: '+beforeSource+' → 刷新后: '+_db.source+' | 结果: '+r1.message+' ======')
      return r1
    }

    /**
     * 强制刷新（下拉刷新用）
     */
    case 'forceRefresh': {
      console.log('[getCompSched] 【强制刷新】客户端手动触发, 刷新前source='+_db.source)
      var r = await refreshMatchesData(event)
      console.log('[getCompSched] 【强制刷新】完成, source → '+_db.source+', 结果: '+r.message)
      return r
    }

    /**
     * 仅刷新积分榜
     */
    case 'refreshStandings': {
      return await refreshStandingsData(event)
    }

    /**
     * 仅刷新射手榜
     */
    case 'refreshScorers': {
      return await refreshScorersData(event)
    }

    default:
      return { code:-1, message:'未知action: '+action, data:null }
  }
}

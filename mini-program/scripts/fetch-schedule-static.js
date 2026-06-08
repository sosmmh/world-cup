/**
 * scripts/fetch-schedule-static.js
 * 
 * 从 football-data.org API 拉取 2026 世界杯真实赛程，
 * 生成 data/scheduleStaticData.js 作为降级兜底用的准实时静态数据。
 * 
 * 用法：node scripts/fetch-schedule-static.js
 */
const https = require('https')
const fs = require('fs')
const path = require('path')

const API_BASE = 'https://api.football-data.org/v4'
const API_KEY = 'b997520e767f49c289a6f5b26b6e732c'
const WORLD_CUP_ID = '2000'

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'X-Auth-Token': API_KEY } }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch(e) { reject(new Error('JSON parse error: ' + e.message)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

// ====== 与云函数 index.js 完全一致的 formatMatch 逻辑 ======
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

  return {
    id: match.id,
    homeTeam: { id: match.homeTeam?match.homeTeam.id:null, name: match.homeTeam?match.homeTeam.name:'', shortName: match.homeTeam?(match.homeTeam.tla||''):'', crest: match.homeTeam?(match.homeTeam.crest||''):'' },
    awayTeam: { id: match.awayTeam?match.awayTeam.id:null, name: match.awayTeam?match.awayTeam.name:'', shortName: match.awayTeam?(match.awayTeam.tla||''):'', crest: match.awayTeam?(match.awayTeam.crest||''):'' },
    score: match.score ? { fullTime:{home:homeScore,away:awayScore}, halfTime:{home:halfHome,away:halfAway} } : null,
    status: match.status, utcDate: match.utcDate,
    timeText, statusText: statusMap[match.status] || (match.status||''),
    minuteStr: match.minute ? match.minute+"'" : '',
    isLive: match.status==='IN_PLAY'||match.status==='LIVE'||match.status==='PAUSED',
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
    return { date: date, matches: groups[date] }
  })
}

async function main() {
  console.log('=== 拉取 2026 世界杯真实赛程 ===\n')

  // 1. 分批拉取全部赛程（API限制每次最多10天）
  console.log('[1/3] 拉取全部赛程（分批）...')
  
  // 世界杯预计周期：6月11日 ~ 7月19日（约39天，分4批）
  var dateRanges = [
    { from: '2026-06-11', to: '2026-06-20' },
    { from: '2026-06-21', to: '2026-06-30' },
    { from: '2026-07-01', to: '2026-07-10' },
    { from: '2026-07-11', to: '2026-07-19' }
  ]
  
  var allRawMatches = []
  for (var i = 0; i < dateRanges.length; i++) {
    var range = dateRanges[i]
    console.log(`   拉取 ${range.from} ~ ${range.to} ...`)
    try {
      var url = API_BASE + '/matches?competition=' + WORLD_CUP_ID + '&season=2026&dateFrom=' + range.from + '&dateTo=' + range.to
      var res = await httpGet(url)
      if (res.matches && res.matches.length) {
        allRawMatches = allRawMatches.concat(res.matches)
        console.log(`   ✅ 获取 ${res.matches.length} 场`)
      } else {
        console.log(`   ⚠️ 该时间段无数据`)
      }
    } catch(e) {
      console.warn('   ❌ 拉取失败:', e.message)
    }
    // 避免请求过快
    if (i < dateRanges.length - 1) await new Promise(function(r){setTimeout(r,500)})
  }

  // 去重
  var seen = {}
  allRawMatches = allRawMatches.filter(function(m){
    if (seen[m.id]) return false
    seen[m.id] = true
    return true
  })

  if (!allRawMatches.length) {
    console.error('❌ 未获取到任何赛程数据！')
    process.exit(1)
  }

  var allMatches = allRawMatches.map(formatMatch)
  var groupedByDate = groupMatchesByDate(allMatches)

  console.log(`\n   📊 合计 ${allMatches.length} 场比赛, 覆盖 ${groupedByDate.length} 个比赛日\n`)

  // 2. 尝试拉取积分榜
  console.log('[2/3] 拉取积分榜...')
  var standingsUrl = API_BASE + '/competitions/' + WORLD_CUP_ID + '/standings?season=2026'
  var standingsData = null
  try {
    var standRes = await httpGet(standingsUrl)
    if (standRes.standings && standRes.standings.length) {
      standingsData = standRes.standings.map(function(s) {
        var fg = (s.table&&s.table[0])?s.table[0].group:''
        return {
          group: s.group || fg || 'ALL',
          table: s.table.map(function(t){
            return {
              position:t.position, team:{id:t.team.id,name:t.team.name,shortName:t.team.tla,crest:t.team.crest},
              playedGames:t.playedGames,won:t.won,drawn:t.drawn,lost:t.lost,
              goalsFor:t.goalsFor,goalsAgainst:t.goalsAgainst,goalDifference:t.goalDifference,
              points:t.points,form:t.form
            }
          })
        }
      })
      console.log(`   ✅ 获取 ${standingsData.length} 组积分榜\n`)
    }
  } catch(e) {
    console.warn('   ⚠️ 积分榜获取失败:', e.message, '(跳过)\n')
  }

  // 3. 尝试拉取射手榜
  console.log('[3/3] 拉取射手榜...')
  var scorersData = null
  try {
    var scorersUrl = API_BASE + '/competitions/' + WORLD_CUP_ID + '/scorers?limit=15&season=2026'
    var scoreRes = await httpGet(scorersUrl)
    if (scoreRes.scorers && scoreRes.scorers.length) {
      scorersData = scoreRes.scorers.map(function(s,i){
        return { rank:i+1, playerId:s.player.id, playerName:s.player.name, teamId:s.team.id, teamName:s.team.name, teamCrest:s.team.crest||'', goals:s.goals||0, assists:s.assists||0, playedGames:s.playedGames||0 }
      })
      console.log(`   ✅ 获取 ${scorersData.length} 名射手\n`)
    }
  } catch(e) {
    console.warn('   ⚠️ 射手榜获取失败:', e.message, '(跳过)\n')
  }

  // ===== 生成 JS 文件 ======
  var output = {
    fetchedAt: new Date().toISOString(),
    source: 'football-data.org API (2026 FIFA World Cup)',
    competitionId: WORLD_CUP_ID,
    season: '2026',
    totalMatches: allMatches.length,

    // 全量赛程（getSchedule 用）
    allMatches: allMatches,

    // 按日期分组（前端直接用）
    groupedByDate: groupedByDate.map(function(g){
      var weekDays = ['周日','周一','周二','周三','周四','周五','周六']
      var d = new Date(g.date+'T00:00:00Z')
      return {
        date: g.date,
        dateText: (d.getMonth()+1)+'月'+d.getDate()+'日 '+weekDays[d.getDay()],
        matches: g.matches
      }
    }),

    // 积分榜
    standings: standingsData,

    // 射手榜
    scorers: scorersData
  }

  var jsContent =
    '// data/scheduleStaticData.js\n' +
    '// ⚽ 2026 世界杯真实赛程静态数据（从 football-data.org API 拉取）\n' +
    '// 用于云函数冷启动/超时时降级展示\n' +
    '// 生成时间: ' + output.fetchedAt + '\n' +
    '// 数据源: ' + output.source + '\n' +
    '\n' +
    'module.exports = ' + JSON.stringify(output, null, 2) + '\n'

  var outPath = path.join(__dirname, '..', 'data', 'scheduleStaticData.js')
  fs.writeFileSync(outPath, jsContent, 'utf-8')
  
  console.log('=== 完成! ===')
  console.log('📄 输出文件: data/scheduleStaticData.js')
  console.log('   - 赛程: ' + output.totalMatches + ' 场')
  console.log('   - 比赛日: ' + output.groupedByDate.length + ' 天')
  console.log('   - 积分榜: ' + (output.standings ? output.standings.length + ' 组' : '无'))
  console.log('   - 射手榜: ' + (output.scorers ? output.scorers.length + ' 人' : '无'))
  console.log('\n提示: 修改此文件不会自动更新，如需重新拉取请运行:')
  console.log('  node scripts/fetch-schedule-static.js')
}

main().catch(function(err) {
  console.error('❌ 脚本执行失败:', err.message)
  process.exit(1)
})

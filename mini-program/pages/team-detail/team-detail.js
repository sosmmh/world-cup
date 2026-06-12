// pages/team-detail/team-detail.js - 球队详情页（重构版）
const teamsData = require('../../data/teams2026')
const teamNameMap = require('../../utils/teamNameMap')               // 英文→中文队名映射
var footballService = null

// 大洲映射
var CONTINENT_MAP = {
  '阿根廷': '南美洲', '巴西': '南美洲', '乌拉圭': '南美洲',
  '哥伦比亚': '南美洲', '厄瓜多尔': '南美洲', '智利': '南美洲', '秘鲁': '南美洲', '巴拉圭': '南美洲', '委内瑞拉': '南美洲', '玻利维亚': '南美洲',
  '法国': '欧洲', '德国': '欧洲', '西班牙': '欧洲', '英格兰': '欧洲', '葡萄牙': '欧洲', '荷兰': '欧洲', '意大利': '欧洲', '克罗地亚': '欧洲', '瑞士': '欧洲', '塞尔维亚': '欧洲', '丹麦': '欧洲', '奥地利': '欧洲', '瑞典': '欧洲', '乌克兰': '欧洲', '捷克': '欧洲', '挪威': '欧洲', '苏格兰': '欧洲', '匈牙利': '欧洲', '斯洛文尼亚': '欧洲', '波兰': '欧洲', '威尔士': '欧洲', '罗马尼亚': '欧洲', '希腊': '欧洲', '阿尔巴尼亚': '欧洲', '格鲁吉亚': '欧洲',
  '美国': '北中美洲', '墨西哥': '北中美洲', '加拿大': '北中美洲', '哥斯达黎加': '北中美洲', '牙买加': '北中美洲', '巴拿马': '北中美洲', '洪都拉斯': '北中美洲', '特立尼达和多巴哥': '北中美洲',
  '摩洛哥': '非洲', '塞内加尔': '非洲', '突尼斯': '非洲', '喀麦隆': '非洲', '加纳': '非洲', '尼日利亚': '非洲', '埃及': '非洲', '南非': '非洲', '科特迪瓦': '非洲', '民主刚果': '非洲', '马里': '非洲',
  '日本': '亚洲', '韩国': '亚洲', '伊朗': '亚洲', '沙特阿拉伯': '亚洲', '澳大利亚': '亚洲', '卡塔尔': '亚洲', '伊拉克': '亚洲', '阿联酋': '亚洲', '乌兹别克斯坦': '亚洲', '约旦': '亚洲', '阿曼': '亚洲',
  '新西兰': '大洋洲'
}

// 从 teams2026 构建：name / nameEn / tla → flag emoji 映射
function buildFlagMap() {
  var map = {}
  var list = teamsData.teamsData2026 || []
  for (var i = 0; i < list.length; i++) {
    var t = list[i]
    if (!t.flag) continue
    if (t.name) map[t.name] = t.flag
    if (t.nameEn) map[t.nameEn] = t.flag
    if (t.tla) map[t.tla] = t.flag
  }
  return map
}
var TEAM_FLAG_MAP = buildFlagMap()

/** 根据对手名称/缩写查 flag emoji */
function getFlagByName(name, shortName) {
  if (!name && !shortName) return '🏳️'
  return TEAM_FLAG_MAP[name] || TEAM_FLAG_MAP[shortName] || '🏳️'
}

Page({
  data: {
    team: null,
    continent: '',
    matchStats: { played: 0, win: 0, draw: 0, loss: 0 },
    goalStats: { goalsFor: 0, goalsAgainst: 0, goalDiff: 0, goalDiffText: '0' },
    scheduleList: [],
    matchesLoading: false,
    isFollowed: false
  },

  onLoad(options) {
    var id = options.id ? parseInt(options.id) : 1
    var allTeams = teamsData.teamsData2026
    var team = allTeams.find(function(t) { return t.id === id })

    if (team) {
      this.setData({
        team: team,
        continent: CONTINENT_MAP[team.name] || ''
      })
      wx.setNavigationBarTitle({ title: team.name })
      this._checkFollowStatus()
      this.loadTeamData(team)
    } else {
      wx.showToast({ title: '球队不存在', icon: 'none' })
    }
  },

  onShow() {
    if (this.data.team) this._checkFollowStatus()
  },

  // ==================== 关注 ====================

  _checkFollowStatus() {
    var followIds = wx.getStorageSync('followedTeams') || []
    var name = this.data.team ? this.data.team.name : ''
    this.setData({ isFollowed: followIds.indexOf(name) !== -1 })
  },

  onToggleFollow() {
    var that = this
    var team = that.data.team
    if (!team) return
    var followIds = wx.getStorageSync('followedTeams') || []
    var idx = followIds.indexOf(team.name)

    if (idx !== -1) {
      followIds.splice(idx, 1)
      wx.setStorageSync('followedTeams', followIds)
      that.setData({ isFollowed: false })
      wx.showToast({ title: '已取消关注', icon: 'none' })
    } else {
      followIds.push(team.name)
      wx.setStorageSync('followedTeams', followIds)
      that.setData({ isFollowed: true })
      wx.showToast({ title: '已关注 ' + team.name, icon: 'success' })
    }
  },

  // ==================== 加载赛程 ====================

  /**
   * 从全量赛程数据中筛选球队比赛
   */
  _filterTeamMatches(allMatches, team) {
    if (!allMatches || !allMatches.length) return []

    var teamNames = [team.name, team.nameEn, team.tla].filter(Boolean)
    console.log('[TeamDetail] 筛选球队比赛 - 球队名称:', JSON.stringify(teamNames))
    console.log('[TeamDetail] 全量赛程总场数:', allMatches.length)

    var matched = allMatches.filter(function(m) {
      var hName = (m.homeTeam && m.homeTeam.name) || ''
      var aName = (m.awayTeam && m.awayTeam.name) || ''
      var hShort = (m.homeTeam && m.homeTeam.shortName) || ''
      var aShort = (m.awayTeam && m.awayTeam.shortName) || ''

      for (var i = 0; i < teamNames.length; i++) {
        if (hName === teamNames[i] || aName === teamNames[i] ||
            hShort === teamNames[i] || aShort === teamNames[i]) {
          return true
        }
      }
      return false
    })

    // 标记 _isHome
    var enriched = matched.map(function(m) {
      var hName = (m.homeTeam && m.homeTeam.name) || ''
      var hShort = (m.homeTeam && m.homeTeam.shortName) || ''
      var isHome = false
      for (var j = 0; j < teamNames.length; j++) {
        if (hName === teamNames[j] || hShort === teamNames[j]) { isHome = true; break }
      }
      m._isHome = isHome
      return m
    })

    console.log('[TeamDetail] 筛选结果:', team.name, enriched.length + '场')
    return enriched
  },

  loadTeamData(team) {
    var that = this
    that.setData({ matchesLoading: true })

    console.log('[TeamDetail] ===== 开始加载赛程 =====')
    console.log('[TeamDetail] 球队信息:', team.name, '(id=' + team.id + ', nameEn=' + team.nameEn + ', tla=' + team.tla + ')')

    try {
      footballService = footballService || require('../../services/footballService')

      // 使用 getSchedule 获取全量赛程（走云函数缓存+回源机制），然后在前端筛选该球队的比赛
      footballService.getSchedule({}).then(function(res) {
        console.log('[TeamDetail] getSchedule 返回:', JSON.stringify({
          code: res.code,
          hasData: !!res.data,
          matchesCount: (res.data && res.data.matches) ? res.data.matches.length : 0,
          message: res.message || ''
        }))

        that.setData({ matchesLoading: false })
        var allMatches = (res.code === 0 && res.data && res.data.matches) ? res.data.matches : []
        var matches = that._filterTeamMatches(allMatches, team)

        that._computeStats(matches, team)
        that._buildScheduleList(matches, team)
      }).catch(function(e) {
        console.error('[TeamDetail] getSchedule 调用异常:', e)
        that.setData({ matchesLoading: false })
        // 不再兜底静态数据，直接展示空
        that._computeStats([], team)
        that._buildScheduleList([], team)
      })
    } catch (e) {
      console.error('[TeamDetail] loadTeamData 初始化异常:', e)
      that.setData({ matchesLoading: false })
      that._computeStats([], team)
      that._buildScheduleList([], team)
    }
  },

  /** 判断我方是否主队 */
  _isMyHome(match, team) {
    if (match._isHome !== undefined) return match._isHome
    var names = [team.name, team.nameEn, team.tla]
    var hName = (match.homeTeam && match.homeTeam.name) || ''
    var hShort = (match.homeTeam && match.homeTeam.shortName) || ''
    for (var i = 0; i < names.length; i++) {
      if (hName === names[i] || hShort === names[i]) return true
    }
    return false
  },

  // ==================== 统计计算 ====================

  _computeStats(matches, team) {
    var played = 0, win = 0, draw = 0, loss = 0
    var goalsFor = 0, goalsAgainst = 0

    for (var i = 0; i < matches.length; i++) {
      var m = matches[i]
      if (m.status !== 'FINISHED') continue
      played++
      var isHome = this._isMyHome(m, team)
      var homeScore = m.score && m.score.fullTime ? m.score.fullTime.home : 0
      var awayScore = m.score && m.score.fullTime ? m.score.fullTime.away : 0
      var myScore = isHome ? homeScore : awayScore
      var oppScore = isHome ? awayScore : homeScore
      goalsFor += myScore || 0
      goalsAgainst += oppScore || 0
      if (myScore > oppScore) win++
      else if (myScore < oppScore) loss++
      else draw++
    }

    var goalDiff = goalsFor - goalsAgainst
    var goalDiffText = goalDiff > 0 ? '+' + goalDiff : String(goalDiff)

    this.setData({
      matchStats: { played: played, win: win, draw: draw, loss: loss },
      goalStats: { goalsFor: goalsFor, goalsAgainst: goalsAgainst, goalDiff: goalDiff, goalDiffText: goalDiffText }
    })
  },

  // ==================== 赛程列表 ====================

  _buildScheduleList(matches, team) {
    var that = this
    if (!matches || matches.length === 0) {
      this.setData({ scheduleList: [] })
      return
    }

    // 按日期排序
    var sorted = matches.slice().sort(function(a, b) {
      var da = a.utcDate || ''
      var db = b.utcDate || ''
      return da.localeCompare(db)
    })

    var list = []
    var prevDate = ''
    var weekDays = ['周日','周一','周二','周三','周四','周五','周六']

    for (var i = 0; i < sorted.length; i++) {
      var m = sorted[i]
      var dateStr = (m.utcDate || '').split('T')[0] || ''

      // 日期变化时插入分割线标记
      if (dateStr && dateStr !== prevDate) {
        var dd = new Date(dateStr + 'T00:00:00Z')
        var dateText = (dd.getMonth()+1) + '月' + dd.getDate() + '日 ' + weekDays[dd.getDay()]
        list.push({
          _isDivider: true,
          _dateText: dateText,
          id: '__divider_' + dateStr
        })
        prevDate = dateStr
      }

      var item = that._formatScheduleItem(m, team)
      list.push(item)
    }
    console.log('[TeamDetail] 赛程列表生成:', list.length, '项（含', list.filter(function(x){return x._isDivider}).length, '个分割线）')
    this.setData({ scheduleList: list })
  },

  _formatScheduleItem(match, team) {
    var isHome = this._isMyHome(match, team)
    var opponent = isHome ? (match.awayTeam || {}) : (match.homeTeam || {})
    var mySide = isHome ? (match.homeTeam || {}) : (match.awayTeam || {})
    var homeScore = match.score && match.score.fullTime ? String(match.score.fullTime.home) : null
    var awayScore = match.score && match.score.fullTime ? String(match.score.fullTime.away) : null

    // 状态映射
    var statusMap = {
      SCHEDULED: '未开始', TIMED: '待定',
      IN_PLAY: '比赛中', LIVE: '直播中',
      PAUSED: '暂停', FINISHED: '已结束',
      POSTPONED: '延期', SUSPENDED: '中断', CANCELLED: '取消'
    }

    var statusText = statusMap[match.status] || match.status || ''
    var hasScore = match.status === 'FINISHED'
    var isLive = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED'

    // 阶段标签
    var stageLabel = this._getStageLabel(match.matchday, match.group)

    // 时间显示
    var d = new Date(match.utcDate || '')
    var displayTime = !isNaN(d.getTime())
      ? d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
      : '待定'

    // ===== 我方信息 =====
    var myFlagEmoji = team.flag || getFlagByName(mySide.name, mySide.shortName)
    var myCnName = team.name  // 我方本身就是中文队名
    var myShort = mySide.shortName || team.tla || '?'

    // ===== 对手信息（英文→中文转换，跟赛程页一致）=====
    var oppFlagEmoji = getFlagByName(opponent.name, opponent.shortName)
    var oppCnName = teamNameMap.getChineseName(opponent) || opponent.name || 'TBD'
    var oppShort = opponent.shortName || '?'

    return {
      id: match.id,
      status: match.status,
      stageLabel: stageLabel,
      _displayTime: displayTime,
      isHome: isHome,
      isLive: isLive,
      statusText: statusText,
      hasScore: hasScore,
      homeScoreDisplay: isHome ? (homeScore !== null ? homeScore : '-') : (awayScore !== null ? awayScore : '-'),
      awayScoreDisplay: isHome ? (awayScore !== null ? awayScore : '-') : (homeScore !== null ? homeScore : '-'),
      // 主队（模板固定位置）— 中文名 + flag emoji
      homeTeamFlagEmoji: isHome ? myFlagEmoji : oppFlagEmoji,
      homeTeamName: isHome ? myCnName : oppCnName,
      homeTeamShort: isHome ? myShort : oppShort,
      // 客队（模板固定位置）— 中文名 + flag emoji
      awayTeamFlagEmoji: isHome ? oppFlagEmoji : myFlagEmoji,
      awayTeamName: isHome ? oppCnName : myCnName,
      awayTeamShort: isHome ? oppShort : myShort
    }
  },

  _getStageLabel(matchday, group) {
    if (group) {
      var gLetter = group.replace('GROUP_', '')
      return '小组赛第' + (matchday || 1) + '轮 (' + gLetter + '组)'
    }
    if (matchday <= 3) return '小组赛第' + matchday + '轮'
    if (matchday <= 7) return '1/8决赛'
    if (matchday <= 9) return '1/4决赛'
    if (matchday <= 10) return '半决赛'
    return '决赛'
  },

  onShareAppMessage() {
    var team = this.data.team
    return {
      title: team.flag + ' ' + team.name + ' - 世界杯装懂指南',
      path: '/pages/team-detail/team-detail?id=' + team.id
    }
  }
})

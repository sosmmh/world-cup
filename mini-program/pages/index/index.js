// pages/index/index.js - 首页
const footballService = require('../../services/footballService')
const slangData = require('../../data/slangData')
const teamsData = require('../../data/teams2026')
const teamNameMap = require('../../utils/teamNameMap')

// 2026世界杯开幕时间（北京时间 2026-06-11 08:00）
const WC_OPENING_DATE = new Date('2026-06-11T08:00:00+08:00').getTime()

// 精选热门对阵（赛前展示用）- 从48强中挑选焦点对决
var FEATURED_MATCHUPS = [
  { home: '阿根廷', away: '葡萄牙', tag: '球王之争', homeCrest: '/images/crests/31_762.png', awayCrest: '/images/crests/29_765.svg' },
  { home: '巴西', away: '法国', tag: '桑巴对决高卢雄鸡', homeCrest: '/images/crests/09_764.svg', awayCrest: '/images/crests/35_773.svg' },
  { home: '英格兰', away: '德国', tag: '英德大战', homeCrest: '/images/crests/26_770.svg', awayCrest: '/images/crests/20_759.svg' },
  { home: '西班牙', away: '日本', tag: '传控对决', homeCrest: '/images/crests/38_760.svg', awayCrest: '/images/crests/25_766.svg' }
]

Page({
  data: {
    // 欢迎区域
    greeting: '',
    currentDate: '',

    // 赛程相关
    todayMatches: [],
    liveMatches: [],

    // 黑话推荐 (取3条)
    todaySlangs: [],

    // 推荐球员
    recommendPlayers: [],

    // 最新新闻 (取2条)
    latestNews: [],

    // 加载状态
    isLoadingMatches: true,
    isLoadingNews: true,

    // 最后更新时间
    lastUpdateTime: '',

    // ===== 赛前展示数据 =====
    wcCountdown: null,        // 倒计时 { days, hours, minutes, seconds }
    wcStatus: '',             // 'upcoming' | 'live' | 'ended'
    wcStatusText: '',         // 状态文案
    featuredMatchups: FEATURED_MATCHUPS,  // 热门对阵预览
    quickTeams: []            // 快速浏览球队（随机取8支）
  },

  onLoad() {
    this._initGreeting()
    this._initCountdown()       // 初始化倒计时
    this._loadTodaySlangs()
    this._loadQuickTeams()      // 加载快速浏览球队
    this._loadAllData()
    this._startCountdownTimer() // 启动倒计时定时器
    this._loadRecommendPlayers().catch(() => {})
  },

  onShow() {
    // 每次显示时刷新实时比分（仅在已有比分数据时）
    if (this.data.liveMatches.length > 0) {
      this._refreshLiveScore()
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this._loadHomeData(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 上拉加载更多 (加载更多新闻)
   */
  onReachBottom() {
    // 可选：加载更多新闻或赛程
  },

  // ==================== 私有方法 ====================

  _initGreeting() {
    var hour = new Date().getHours()
    var greeting = '晚上好'

    if (hour >= 5 && hour < 12) greeting = '早上好'
    else if (hour >= 12 && hour < 14) greeting = '中午好'
    else if (hour >= 14 && hour < 18) greeting = '下午好'

    var now = new Date()
    var month = now.getMonth() + 1
    var day = now.getDate()
    var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    this.setData({
      greeting: greeting,
      currentDate: month + '月' + day + '日 ' + weekDays[now.getDay()],
      lastUpdateTime: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
  },

  /**
   * 初始化世界杯倒计时
   */
  _initCountdown() {
    this._updateCountdown()
  },

  /**
   * 更新倒计时数据
   */
  _updateCountdown() {
    var now = Date.now()
    var diff = WC_OPENING_DATE - now

    if (diff > 0) {
      // 赛前：显示倒计时
      var days = Math.floor(diff / (1000 * 60 * 60 * 24))
      var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      var seconds = Math.floor((diff % (1000 * 60)) / 1000)
      this.setData({
        wcCountdown: { days: days, hours: hours, minutes: minutes, seconds: seconds },
        wcStatus: 'upcoming',
        wcStatusText: days === 0 ? '今日开幕！' : '距开幕还有'
      })
    } else if (diff > -45 * 24 * 60 * 60 * 1000) {
      // 进行中（世界杯约持续一个半月）
      this.setData({ wcStatus: 'live', wcStatusText: '激战正酣 🔥', wcCountdown: null })
    } else {
      // 已结束
      this.setData({ wcStatus: 'ended', wcStatusText: '2026美加墨世界杯圆满落幕', wcCountdown: null })
    }
  },

  /** 启动倒计时定时器（每秒更新） */
  _startCountdownTimer() {
    var self = this
    this._countdownTimer = setInterval(function() {
      self._updateCountdown()
    }, 1000)
  },

  onUnload() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
    }
  },

  /**
   * 将 UTC ISO 字符串转为北京时间 M月D日 HH:mm
   * JS new Date() 自动处理时区偏移，设备在北京时间即 UTC+8
   */
  _convertToBjTime(utcDateStr) {
    if (!utcDateStr) return ''
    var d = new Date(utcDateStr)
    var month = d.getMonth() + 1
    var day = d.getDate()
    var hours = String(d.getHours()).padStart(2, '0')
    var minutes = String(d.getMinutes()).padStart(2, '0')
    return month + '月' + day + '日 ' + hours + ':' + minutes
  },

  /**
   * football-data.org API 状态码 → 中文显示
   */
  _getStatusText(status) {
    const map = {
      'TIMED': '未开始',
      'SCHEDULED': '未开始',
      'POSTPONED': '延期',
      'IN_PLAY': '进行中',
      'LIVE': '进行中',
      'PAUSED': '中断',
      'FINISHED': '已结束',
      'CANCELLED': '取消',
      'SUSPENDED': '腰斩'
    }
    return map[status] || status || '未知'
  },

  /**
   * 加载快速浏览球队（随机取8支，展示队徽+名字）
   */
  _loadQuickTeams() {
    // 从48强中挑选有代表性的球队展示
    var allTeams = teamsData.teamsData2026 || []
    // 取每组种子队+热门球队
    var hotTeamNames = ['阿根廷','巴西','法国','德国','英格兰','西班牙','葡萄牙','日本',
                        '荷兰','乌拉圭','克罗地亚','美国','墨西哥','加拿大']
    var quickTeams = allTeams.filter(function(t) { return hotTeamNames.indexOf(t.name) !== -1 }).map(function(t) {
      return { id: t.id, name: t.name, nameEn: t.nameEn, flag: t.flag, crest: t.crest, group: t.group, nickname: t.nickname }
    }).slice(0, 8)

    // 如果不足8个，补充其他球队
    if (quickTeams.length < 8) {
      var rest = allTeams.filter(function(t) { return hotTeamNames.indexOf(t.name) === -1 }).slice(0, 8 - quickTeams.length)
      quickTeams = quickTeams.concat(rest.map(function(t) {
        return { id: t.id, name: t.name, nameEn: t.nameEn, flag: t.flag, crest: t.crest, group: t.group, nickname: t.nickname }
      }))
    }

    this.setData({ quickTeams: quickTeams })
  },

  /**
   * 统一加载核心数据（赛程 + 新闻）
   */
  async _loadAllData(forceRefresh = false) {
    await this._loadHomeData(forceRefresh)
  },

  async _loadHomeData(forceRefresh = false) {
    this.setData({ isLoadingMatches: true, isLoadingNews: true })

    try {
      // 并发请求赛程、新闻、实时比分
      const allRes = await Promise.all([
        footballService.getTodayMatches(forceRefresh),
        footballService.getHotNews(null, 1, 4, true),
        footballService.getLiveScore()
      ])
      var matchesRes = allRes[0]
      var newsRes = allRes[1]
      var liveScoreRes = allRes[2]

      // 处理赛程数据
      if (matchesRes.code === 0) {
        const allMatches = (matchesRes.data && matchesRes.data.matches) || []
        // 转换UTC时间为北京时间展示格式 + 状态中文映射 + 英文名→中文队名
        const self = this
        var enriched = allMatches.map(function(m) {
          m._displayTime = m.utcDate ? self._convertToBjTime(m.utcDate) : ''
          m._statusText = self._getStatusText(m.status)
          return m
        })
        enriched = teamNameMap.enrichMatches(enriched)  // 补充 homeTeam.nameCn / awayTeam.nameCn / localId
        // 按北京时间筛选今天+明天的比赛（而不是UTC日期）
        var now = new Date()
        function bjFmt(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
        var todayStr = bjFmt(now)
        var tmr = new Date(now); tmr.setDate(tmr.getDate()+1)
        var tmrStr = bjFmt(tmr)

        function isMatchInDateRange(match) {
          if (!match.utcDate) return false
          var d = new Date(match.utcDate)  // JS自动转本地时区
          var bjDate = bjFmt(d)
          return bjDate === todayStr || bjDate === tmrStr
        }

        const dayMatches = enriched.filter(isMatchInDateRange)
        const upcomingMatches = dayMatches.filter(function(m) { return m.status !== 'LIVE' && m.status !== 'FINISHED' })

        // 实时比分使用 getLiveScore 返回的完整数据（含 events）
        let liveMatches = liveScoreRes.code === 0 ? ((liveScoreRes.data && liveScoreRes.data.matches) || []) : []
        // 补充中文队名
        liveMatches = teamNameMap.enrichMatches(liveMatches)

        // 如果 liveScore 无数据但 todayMatches 中有 LIVE 比赛，回退使用赛程数据
        if (liveMatches.length === 0) {
          liveMatches = enriched.filter(m => m.status === 'LIVE')
        }

        this.setData({
          todayMatches: upcomingMatches,
          liveMatches: liveMatches,
          lastUpdateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          isLoadingMatches: false
        })
      } else {
        this.setData({ isLoadingMatches: false })
      }

      // 处理新闻数据
      console.log('[Index] newsRes =', JSON.stringify(newsRes).substring(0, 300))
      if (newsRes.code === 0) {
        const news = newsRes.data || []
        console.log('[Index] 新闻条数:', news.length, ' 第一条标题:', (news[0] && news[0].title) || '无')
        this.setData({
          latestNews: news.slice(0, 3),
          isLoadingNews: false
        })
      } else {
        this.setData({ isLoadingNews: false })
      }
    } catch (error) {
      console.error('[Index] 加载数据失败:', error)
      this.setData({
        isLoadingMatches: false,
        isLoadingNews: false
      })
    }
  },

  async _refreshLiveScore() {
    try {
      const res = await footballService.getLiveScore()
      if (res.code === 0) {
        this.setData({
          liveMatches: (res.data && res.data.matches) || [],
          lastUpdateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        })
      }
    } catch (e) {
      console.warn('[Index] 刷新比分失败:', e)
    }
  },

  _loadTodaySlangs() {
    // 随机选取3条黑话
    const slangs = slangData.slangs.sort(() => Math.random() - 0.5).slice(0, 3)
    this.setData({ todaySlangs: slangs })
  },

  async _loadRecommendPlayers() {
    // 通过适配器获取推荐球员（支持 mock/cloud/http 切换）
    try {
      const res = await footballService.getRecommendPlayers(10)
      if (res.code === 0) {
        const players = (res.data || []).sort(() => Math.random() - 0.5).slice(0, 3)
        this.setData({ recommendPlayers: players })
      }
    } catch (e) {
      console.warn('[Index] 加载推荐球员失败:', e)
    }
  },

  // ==================== 事件处理 ====================

  onTapMatch(e) {
    const matchId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/schedule/schedule?highlight=${matchId}` })
  },

  onTapLiveMatch(e) {
    const matchId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/schedule/schedule?live=${matchId}` })
  },

  onTapNews(e) {
    var url = e.currentTarget.dataset.url
    console.log('[Index] 点击新闻, url=', url)
    if (url) {
      wx.navigateTo({ url: '/pages/webview/webview?url=' + encodeURIComponent(url) })
    } else {
      console.warn('[Index] 该新闻没有url!')
      wx.showToast({ title: '该新闻暂无链接', icon: 'none' })
    }
  },

  onTapNewsMore() {
    wx.switchTab({ url: '/pages/news/news' })
  },

  onTapSchedule() {
    wx.switchTab({ url: '/pages/schedule/schedule' })
  },

  onTapTeams() {
    wx.switchTab({ url: '/pages/teams/teams' })
  },

  onTapTeam(e) {
    const teamId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/team-detail/team-detail?id=${teamId}` })
  },

  onTapPlayer(e) {
    const playerId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/player-detail/player-detail?id=${playerId}` })
  },

  onTapSlang(e) {
    const slangId = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/tool-detail/tool-detail?id=slang' })
  },

  onTapQuickTeam(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({ url: '/pages/team-detail/team-detail?id=' + id })
    } else {
      wx.switchTab({ url: '/pages/teams/teams' })
    }
  },

  onTapMBTI() {
    wx.navigateTo({ url: '/pages/mbti/mbti' })
  },

  onRefreshMatches() {
    wx.showLoading({ title: '刷新中...' })
    this._loadHomeData(true).finally(() => {
      wx.hideLoading()
    })
  }
})

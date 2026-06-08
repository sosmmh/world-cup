// pages/index/index.js - 首页
const footballService = require('../../services/footballService')
const slangData = require('../../data/slangData')

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
    lastUpdateTime: ''
  },

  onLoad() {
    this._initGreeting()
    this._loadTodaySlangs()
    // 统一加载所有数据，确保页面渲染完整性
    this._loadAllData()
    // 推荐球员非关键数据，异步加载不阻塞主流程
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
    const hour = new Date().getHours()
    let greeting = '晚上好'

    if (hour >= 5 && hour < 12) greeting = '早上好'
    else if (hour >= 12 && hour < 14) greeting = '中午好'
    else if (hour >= 14 && hour < 18) greeting = '下午好'

    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    this.setData({
      greeting,
      currentDate: `${month}月${day}日 ${weekDays[now.getDay()]}`,
      lastUpdateTime: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
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
        footballService.getHotNews(null, 1, 4),
        footballService.getLiveScore()
      ])
      var matchesRes = allRes[0]
      var newsRes = allRes[1]
      var liveScoreRes = allRes[2]

      // 处理赛程数据
      if (matchesRes.code === 0) {
        const allMatches = (matchesRes.data && matchesRes.data.matches) || []
        const upcomingMatches = allMatches.filter(function(m) { return m.status !== 'LIVE' && m.status !== 'FINISHED' })

        // 实时比分使用 getLiveScore 返回的完整数据（含 events）
        let liveMatches = liveScoreRes.code === 0 ? ((liveScoreRes.data && liveScoreRes.data.matches) || []) : []

        // 如果 liveScore 无数据但 todayMatches 中有 LIVE 比赛，回退使用赛程数据
        if (liveMatches.length === 0) {
          liveMatches = allMatches.filter(m => m.status === 'LIVE')
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
      if (newsRes.code === 0) {
        const news = newsRes.data || []
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
    const newsId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/news/news?id=${newsId}` })
  },

  onTapNewsMore() {
    wx.switchTab({ url: '/pages/news/news' })
  },

  onTapSchedule() {
    wx.switchTab({ url: '/pages/schedule/schedule' })
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

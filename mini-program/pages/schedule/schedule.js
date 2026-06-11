// pages/schedule/schedule.js - 赛程赛果页（三视图：每日赛程 / 总体赛程 / 积分榜）
const footballService = require('../../services/footballService')
const teamNameMap = require('../../utils/teamNameMap')
const crestMap = require('../../utils/crestMap')
const app = getApp()

// 世界杯日期范围
const WC_START = new Date('2026-06-11')
const WC_END = new Date('2026-07-19')

// 星期映射
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

// 阶段Tab定义：按 matchday 映射
const STAGE_TABS = [
  { key: 'group', label: '小组赛', matchdays: [1, 2, 3] },
  { key: 'round32', label: '1/16决赛', matchdays: [null] },
  { key: 'round16', label: '1/8决赛', matchdays: [null] },
  { key: 'quarter', label: '1/4决赛', matchdays: [null] },
  { key: 'semi', label: '半决赛', matchdays: [null] },
  { key: 'third', label: '季军赛', matchdays: [null] },
  { key: 'final', label: '决赛', matchdays: [null] }
]

// 淘汰赛实际比赛ID集合（基于 football-data.org API 返回的真实 ID）
// 按日期排序后分配到各轮次
const KNOCKOUT_IDS = {
  // 1/16决赛（16场）：6月28日~7月5日
  round32: [
    537417, 537423, 537415,
    537425, 537426, 537422,
    537421, 537420, 537419,
    537429, 537428, 537427,
    537430, 537376, 537375,
    537377
  ],
  // 1/8决赛（8场）：7月6日~7月7日
  round16: [
    537378, 537379,
    537380, 537381,
    537382
  ],
  // 1/4决赛（4场）：7月9日~7月12日
  quarter: [
    537383, 537385,
    537386
  ],
  // 半决赛（2场）：7月14日~7月15日
  semi: [
    537387, 537388
  ],
  // 季军赛（1场）：7月18日
  third: [
    537389
  ],
  // 决赛（1场）：7月19日
  final: [
    537425
  ]
}

Page({
  data: {
    // ========== 主Tab ==========
    currentMainTab: 'daily', // daily | overall

    // ========== 每日赛程视图 ==========
    dateList: [],           // 世界杯全期日期列表
    selectedDateIndex: 0,   // 选中的日期索引
    dailyMatches: [],       // 当日比赛列表
    matchDateSet: {},       // 有比赛的日期集合 { '2026-06-11': true }

    // ========== 总体赛程视图 ==========
    stageTabs: STAGE_TABS,
    selectedStageKey: 'group',
    stageMatches: [],       // 当前阶段的比赛
    stageGroupedMatches: [],// 按日期分组的阶段比赛

    // ========== 公共状态 ==========
    loading: false,
    refreshing: false,
    allRawMatches: [],      // 全部原始比赛数据（用于本地筛选）

    // ========== 直播相关（保留） ==========
    liveMatches: [],
    liveLoading: false,
    liveTimer: null,

    // 积分榜（保留用于后续扩展）
    standings: [],
    worldCupGroups: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],

    // ========== 积分榜视图 ==========
    standingsLoading: false,
    standingGroups: [],          // 分组Tab数据 [{group, groupLabel}]
    selectedGroupIndex: 0,       // 当前选中的分组索引
    displayedStandings: []         // 当前展示的积分榜数组（过滤后）
  },

  onLoad() {
    this.initDateList()
    this.loadAllSchedule()
    this.loadStandings()  // 加载积分榜
  },

  onShow() {
    if (this.data.liveTimer) this.startLiveTimer()
  },

  onHide() {
    this.stopLiveTimer()
  },

  onUnload() {
    this.stopLiveTimer()
  },

  /* ==================== 初始化 ==================== */

  /**
   * 生成世界杯全期日期列表 + 默认选中逻辑
   */
  initDateList() {
    var dates = []
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    var defaultIndex = 0

    var cursor = new Date(WC_START)
    while (cursor <= WC_END) {
      var d = new Date(cursor)
      dates.push({
        fullDate: this.formatDate(d),
        month: d.getMonth() + 1,
        day: d.getDate(),
        weekday: WEEK_DAYS[d.getDay()],
        isToday: d.getTime() === today.getTime(),
        hasMatch: false
      })
      if (d.getTime() === today.getTime()) {
        defaultIndex = dates.length - 1
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    // 如果今天不在世界杯期间，默认选开幕日
    if (today < WC_START) defaultIndex = 0
    if (today > WC_END) defaultIndex = dates.length - 1

    this.setData({
      dateList: dates,
      selectedDateIndex: defaultIndex
    })
  },

  /* ==================== 数据加载 ==================== */

  /**
   * 加载全部赛程数据（一次性拉取整个世界杯周期）
   */
  async loadAllSchedule(forceRefresh) {
    if (this.data.loading) return
    this.setData({ loading: true, refreshing: !!forceRefresh })

    try {
      // 拉取全量数据：从开幕日到闭幕日
      var params = {
        dateFrom: this.formatDate(WC_START),
        dateTo: this.formatDate(WC_END)
      }

      console.log('[Schedule] 加载全量赛程:', params.dateFrom, '~', params.dateTo)

      var res = await footballService.getSchedule(params)
      console.log('[Schedule] 返回 code:', res.code, 'matches:', (res.data && res.data.matches) ? res.data.matches.length : 0,
        '| 数据来源:', (res.data && res.data.source) || '未知',
        '| cached:', (res.data && res.data.cached) || false,
        '| fetchedAt:', (res.data && res.data.fetchedAt) || 'null')

      if (res.code === 0 && res.data) {
        var rawMatches = res.data.matches || []
        var enriched = teamNameMap.enrichMatches(rawMatches)

        // 补充展示用计算字段
        enriched.forEach(function(m) {
          m._displayTime = m.utcDate ? this.convertUtcToDisplayTime(m.utcDate) : ''
          m._weekdayText = m.utcDate ? this.buildDateText(this.convertUtcToLocalDateStr(m.utcDate)) : ''
          m._shortGroup = this.getShortGroup(m)
          m._stageLabel = this.getStageLabel(m)
        }.bind(this))

        // 构建有比赛日期的集合
        var matchDateSet = {}
        enriched.forEach(function(m) {
          if (m.utcDate) {
            var bjDate = this.convertUtcToLocalDateStr(m.utcDate)
            matchDateSet[bjDate] = true
          }
        }.bind(this))

        // 更新日期列表的红点标记
        var updatedDates = this.data.dateList.map(function(d) {
          return Object.assign({}, d, { hasMatch: !!matchDateSet[d.fullDate] })
        })

        this.setData({
          allRawMatches: enriched,
          matchDateSet: matchDateSet,
          dateList: updatedDates
        })

        console.log('[Schedule] 【数据加载完成】总场次:', enriched.length, '| 数据来源:', (res.data && res.data.source) || '未知', '| cached:', (res.data && res.data.cached), '| 有比赛日期数:', Object.keys(matchDateSet).length)

        // 如果当前选中的日期没有比赛，自动跳到第一个有比赛的日期
        if (!matchDateSet[this.data.dateList[this.data.selectedDateIndex].fullDate]) {
          var autoIdx = updatedDates.findIndex(function(d) { return d.hasMatch })
          if (autoIdx >= 0) {
            this.setData({ selectedDateIndex: autoIdx })
          }
        }

        // 根据当前视图刷新展示数据
        this.refreshDailyView()
        this.refreshOverallView()

      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[Schedule] 加载赛程失败:', error)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false, refreshing: false })
    }
  },

  /**
   * 将 UTC ISO 字符串转为本地日期字符串 YYYY-MM-DD
   * 注意：JS new Date() 会自动将 UTC 转为设备本地时区，不需要手动 +8h
   */
  convertUtcToLocalDateStr(utcDateStr) {
    if (!utcDateStr) return ''
    var d = new Date(utcDateStr)
    // 直接用本地时区格式化（用户手机在北京时间即 UTC+8）
    return this.formatDate(d)
  },

  /**
   * 将 UTC ISO 字符串转为本地时间显示 M月D日 HH:mm
   */
  convertUtcToDisplayTime(utcDateStr) {
    if (!utcDateStr) return ''
    var d = new Date(utcDateStr)
    var month = d.getMonth() + 1
    var day = d.getDate()
    var hours = String(d.getHours()).padStart(2, '0')
    var minutes = String(d.getMinutes()).padStart(2, '0')
    return month + '月' + day + '日 ' + hours + ':' + minutes
  },

  /**
   * 获取本地时区的星期几文字
   */
  convertUtcToWeekday(utcDateStr) {
    if (!utcDateStr) return ''
    var d = new Date(utcDateStr)
    return '周' + WEEK_DAYS[d.getDay()]
  },

  /* ==================== 每日赛程视图 ==================== */

  refreshDailyView() {
    var idx = this.data.selectedDateIndex
    if (!this.data.dateList[idx]) return
    var targetDate = this.data.dateList[idx].fullDate
    var filtered = this.filterMatchesByDate(targetDate)
    console.log('[Schedule] 【每日赛程】选中日期:', targetDate, '| 筛选结果:', filtered.length, '场 (从本地 allRawMatches 筛选, 共', this.data.allRawMatches.length, '场)')
    this.setData({ dailyMatches: filtered })
  },

  /**
   * 按日期筛选比赛（考虑UTC→北京时区偏移）
   */
  filterMatchesByDate(dateStr) {
    var self = this
    return this.data.allRawMatches.filter(function(m) {
      if (!m.utcDate) return false
      var bjDate = self.convertUtcToLocalDateStr(m.utcDate)
      // 命中当天或前一天（处理跨日情况）或后一天
      return bjDate === dateStr
    }).sort(function(a, b) {
      return new Date(a.utcDate) - new Date(b.utcDate)
    })
  },

  /**
   * 选择日期
   */
  onSelectDate(e) {
    var idx = e.currentTarget.dataset.index
    var targetDate = this.data.dateList[idx] ? this.data.dateList[idx].fullDate : ''
    console.log('[Schedule] 【点击日期】索引:', idx, '→ 日期:', targetDate, '| 数据来源: 本地内存筛选 (allRawMatches共', this.data.allRawMatches.length, '场)')
    this.setData({ selectedDateIndex: idx })
    this.refreshDailyView()
  },

  /* ==================== 总体赛程视图 ==================== */

  refreshOverallView() {
    var stageKey = this.data.selectedStageKey
    var filtered = this.filterMatchesByStage(stageKey)

    // 按日期分组
    var grouped = []
    var dateMap = {}
    filtered.forEach(function(m) {
      var bjDate = this.convertUtcToLocalDateStr(m.utcDate)
      if (!dateMap[bjDate]) {
        dateMap[bjDate] = { date: bjDate, dateText: this.buildDateText(bjDate), matches: [] }
      }
      dateMap[bjDate].matches.push(m)
    }.bind(this))

    // 按日期排序
    var sortedKeys = Object.keys(dateMap).sort()
    sortedKeys.forEach(function(k) { grouped.push(dateMap[k]) })

    this.setData({
      stageMatches: filtered,
      stageGroupedMatches: grouped
    })
  },

  buildDateText(dateStr) {
    var parts = dateStr.split('-')
    if (parts.length === 3) {
      var m = parseInt(parts[1], 10)
      var d = parseInt(parts[2], 10)
      var wd = new Date(dateStr.replace(/-/g, '/'))
      return m + '月' + d + '日 周' + WEEK_DAYS[wd.getDay()]
    }
    return dateStr
  },

  /**
   * 按 matchday / 阶段筛选比赛
   */
  filterMatchesByStage(stageKey) {
    var self = this
    return this.data.allRawMatches.filter(function(m) {
      switch (stageKey) {
        case 'group':
          // 小组赛: matchday 1~3 且有 group
          return m.matchday >= 1 && m.matchday <= 3 && m.group
        case 'round32':
          return KNOCKOUT_IDS.round32.indexOf(m.id) !== -1
        case 'round16':
          return KNOCKOUT_IDS.round16.indexOf(m.id) !== -1
        case 'quarter':
          return KNOCKOUT_IDS.quarter.indexOf(m.id) !== -1
        case 'semi':
          return KNOCKOUT_IDS.semi.indexOf(m.id) !== -1
        case 'third':
          return KNOCKOUT_IDS.third.indexOf(m.id) !== -1
        case 'final':
          return KNOCKOUT_IDS.final.indexOf(m.id) !== -1
        default:
          return true
      }
    }).sort(function(a, b) {
      return new Date(a.utcDate) - new Date(b.utcDate)
    })
  },

  /**
   * 通过 ID 判断淘汰赛轮次（已废弃，保留兼容）
   */
  isKnockoutRound(match, idMin, idMax) {
    if (!match || !match.id) return false
    return false // 改用 KNOCKOUT_IDS 集合判断
  },

  /**
   * 切换阶段Tab
   */
  onSwitchStage(e) {
    var key = e.currentTarget.dataset.key
    this.setData({ selectedStageKey: key })
    this.refreshOverallView()
  },

  /* ==================== 主Tab切换 ==================== */

  onSwitchMainTab(e) {
    var tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentMainTab) return
    this.setData({ currentMainTab: tab })
    if (tab === 'overall') {
      this.refreshOverallView()
    } else if (tab === 'standings') {
      // 切换到积分榜时确保数据已加载
      if (!this.data.displayedStandings || this.data.displayedStandings.length === 0) {
        this.loadStandings()
      }
    } else {
      this.refreshDailyView()
    }
  },

  /* ==================== 下拉刷新 ==================== */

  onPullDownRefresh() {
    this.loadAllSchedule(true).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /* ==================== 工具方法 ==================== */

  formatDate(d) {
    var year = d.getFullYear()
    var month = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    return year + '-' + month + '-' + day
  },

  getStatusText(status) {
    const map = {
      'SCHEDULED': '未开始',
      'TIMED': '未开始',
      'IN_PLAY': '进行中',
      'LIVE': '进行中',
      'PAUSED': '中场休息',
      'FINISHED': '已结束',
      'AWARDED': '已取消',
      'POSTPONED': '延期',
      'SUSPENDED': '中断',
      'CANCELLED': '取消'
    }
    return map[status] || status || '未开始'
  },

  getStageLabel(match) {
    if (match.group) {
      var g = match.group.replace('GROUP_', '') + '组'
      var roundNames = ['', '第一轮', '第二轮', '第三轮']
      var round = roundNames[match.matchday] || ''
      return g + ' · 小组赛' + round
    }
    // 淘汰赛按实际 ID 集合判断
    var id = match.id
    if (KNOCKOUT_IDS.round32.indexOf(id) !== -1) return '1/16决赛'
    if (KNOCKOUT_IDS.round16.indexOf(id) !== -1) return '1/8决赛'
    if (KNOCKOUT_IDS.quarter.indexOf(id) !== -1) return '1/4决赛'
    if (KNOCKOUT_IDS.semi.indexOf(id) !== -1) return '半决赛'
    if (KNOCKOUT_IDS.third.indexOf(id) !== -1) return '季军赛'
    if (KNOCKOUT_IDS.final.indexOf(id) !== -1) return '决赛'
    return '淘汰赛'
  },

  getShortGroup(match) {
    if (match.group) {
      return match.group.replace('GROUP_', '') + '组'
    }
    return ''
  },

  /**
   * 从 group 字段获取纯字母组名
   */
  getGroupLetter(match) {
    if (match && match.group) {
      return match.group.replace('GROUP_', '')
    }
    return ''
  },

  /* ==================== 事件处理 ==================== */

  onMatchTap(e) {
    var match = e.currentTarget.dataset.match
    console.log('[Match] 点击比赛:', match ? match.id : null)
  },

  onTeamTap(e) {
    var teamId = e.currentTarget.dataset.teamid
    if (teamId) {
      wx.navigateTo({ url: '/pages/team-detail/team-detail?id=' + teamId })
    }
  },

  /* ==================== 直播功能（保留） ==================== */

  async loadLiveScore() {
    if (this.data.liveLoading) return
    this.setData({ liveLoading: true })
    try {
      var res = await footballService.getLiveScore()
      if (res.code === 0 && res.data) {
        var raw = (res.data.matches || []).map(function(m) {
          return Object.assign({}, m, {
            _homeScore: (m.score && m.score.fullTime && m.score.fullTime.home != null) ? m.score.fullTime.home : 0,
            _awayScore: (m.score && m.score.fullTime && m.score.fullTime.away != null) ? m.score.fullTime.away : 0
          })
        })
        this.setData({ liveMatches: teamNameMap.enrichMatches(raw) })
      }
    } catch (error) {
      console.error('[Schedule] 加载实时比分失败:', error)
    } finally {
      this.setData({ liveLoading: false })
    }
  },

  startLiveTimer() {
    this.stopLiveTimer()
    this.data.liveTimer = setInterval(() => { this.loadLiveScore() }, 60000)
  },

  stopLiveTimer() {
    if (this.data.liveTimer) {
      clearInterval(this.data.liveTimer)
      this.data.liveTimer = null
    }
  },

  /* ==================== 积分榜 ==================== */

  /**
   * 加载积分榜数据
   */
  async loadStandings() {
    if (this.data.standingsLoading) return
    this.setData({ standingsLoading: true })

    try {
      var res = await footballService.getStandings()
      console.log('[Schedule] 积分榜返回 code:', res.code, '组数:', (res.data && res.data.standings) ? res.data.standings.length : 0)

      if (res.code === 0 && res.data && res.data.standings) {
        // 用 teamNameMap 补充中文队名 + 队徽本地化
        var enriched = teamNameMap.enrichStandings(res.data.standings)

        // 队徽URL转本地路径（映射不到时保留原始URL）
        enriched.forEach(function(sg) {
          if (sg.table) {
            sg.table.forEach(function(row) {
              if (row.team && row.team.crest) {
                var localCrest = crestMap.getLocalCrestUrl(row.team.crest)
                row.team.crest = localCrest || row.team.crest  // 映射不到则保留原始URL
              }
            })
          }
        })

        // 构建分组Tab（去重：同名分组只保留第一个）
        var groups = []
        var seenGroupNames = {}
        if (enriched.length > 0) {
          groups = enriched.filter(function(sg, i) {
            var rawLabel = sg.group || 'ALL'
            if (seenGroupNames[rawLabel]) return false  // 去重
            seenGroupNames[rawLabel] = true
            return true
          }).map(function(sg, i) {
            var label = sg.group || '总排名'
            if (label === 'ALL') label = '总排名'
            else if (label.startsWith('GROUP_')) label = label.replace('GROUP_', '') + '组'
            return { group: sg.group, groupLabel: label }
          })
        }

        // 同步过滤 enriched 数据（只保留去重后的分组）
        var uniqueGroups = []
        var seenAgain = {}
        enriched.forEach(function(sg) {
          var key = sg.group || 'ALL'
          if (!seenAgain[key]) {
            seenAgain[key] = true
            uniqueGroups.push(sg)
          }
        })

        this.setData({
          standings: uniqueGroups,
          standingGroups: groups,
          selectedGroupIndex: 0,
          displayedStandings: uniqueGroups.length > 0 ? [uniqueGroups[0]] : [],
          standingsLoading: false
        })
      } else {
        this.setData({ standingsLoading: false })
      }
    } catch (error) {
      console.error('[Schedule] 加载积分榜失败:', error)
      this.setData({ standingsLoading: false })
    }
  },

  /**
   * 切换积分榜分组
   */
  onSwitchStandingGroup(e) {
    var idx = e.currentTarget.dataset.index
    if (idx === this.data.selectedGroupIndex) return
    var target = this.data.standings[idx]
    if (target) {
      this.setData({
        selectedGroupIndex: idx,
        displayedStandings: [target]
      })
    }
  },

  /* ==================== 分享 ==================== */

  onShareAppMessage() {
    return {
      title: '2026世界杯赛程表 - 世界杯装懂指南',
      path: '/pages/schedule/schedule'
    }
  }
})

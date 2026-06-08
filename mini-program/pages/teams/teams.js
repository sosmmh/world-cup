// pages/teams/teams.js - 球队百科页
const teamsData = require('../../data/teams2026')

Page({
  data: {
    // 搜索关键词
    searchKeyword: '',
    
    // 分组筛选
    selectedGroup: '',
    groupTabs: [],
    
    // 球队列表
    allTeams: [],
    filteredTeams: [],
    groupedTeams: [],  // 按分组后的数据
    
    // 显示模式: 'grid' | 'list'
    viewMode: 'grid'
  },

  onLoad() {
    var allTeams = teamsData.teamsData2026
    // 生成分组Tab
    var groups = ['']
    var groupMap = {}
    for (var i = 0; i < allTeams.length; i++) {
      var g = allTeams[i].group
      if (!groupMap[g]) {
        groupMap[g] = true
        groups.push(g)
      }
    }
    groups.sort()
    this.setData({
      allTeams: allTeams,
      filteredTeams: allTeams,
      groupTabs: [{ value: '', label: '全部' }].concat(
        groups.filter(function(g) { return g }).map(function(g) {
          return { value: g, label: g + '组' }
        })
      )
    })
    this.groupTeams()
  },

  // 搜索
  onSearchInput(e) {
    var keyword = e.detail.value.trim()
    this.setData({ searchKeyword: keyword })
    this.applyFilter(keyword, this.data.selectedGroup)
  },

  onSearchClear() {
    this.setData({ searchKeyword: '' })
    this.applyFilter('', this.data.selectedGroup)
  },

  // 切换分组
  onGroupTap(e) {
    var group = e.currentTarget.dataset.group
    this.setData({ selectedGroup: group })
    this.applyFilter(this.data.searchKeyword, group)
  },

  // 应用筛选
  applyFilter(keyword, group) {
    var list = this.data.allTeams
    if (group) {
      list = list.filter(function(t) { return t.group === group })
    }
    if (keyword) {
      var kw = keyword.toLowerCase()
      list = list.filter(function(t) {
        return t.name.toLowerCase().indexOf(kw) !== -1 ||
               t.nameEn.toLowerCase().indexOf(kw) !== -1 ||
               t.starPlayer.toLowerCase().indexOf(kw) !== -1 ||
               t.tags.some(function(tag) { return tag.indexOf(kw) !== -1 })
      })
    }
    this.setData({ filteredTeams: list })
    this.groupTeams()
  },

  // 将筛选后的球队按分组
  groupTeams() {
    var list = this.data.filteredTeams
    if (this.data.selectedGroup) {
      // 已选分组，不需要再按组分类
      this.setData({
        groupedTeams: [{ group: this.data.selectedGroup, teams: list }]
      })
      return
    }
    var grouped = {}
    for (var i = 0; i < list.length; i++) {
      var team = list[i]
      var g = team.group
      if (!grouped[g]) {
        grouped[g] = []
      }
      grouped[g].push(team)
    }
    var result = []
    var keys = Object.keys(grouped).sort()
    for (var j = 0; j < keys.length; j++) {
      result.push({ group: keys[j], teams: grouped[keys[j]] })
    }
    this.setData({ groupedTeams: result })
  },

  // 切换显示模式
  toggleViewMode() {
    this.setData({
      viewMode: this.data.viewMode === 'grid' ? 'list' : 'grid'
    })
  },

  // 点击球队卡片 → 跳转详情
  onTeamTap(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/team-detail/team-detail?id=' + id
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    var that = this
    setTimeout(function() {
      that.setData({ searchKeyword: '', selectedGroup: '' })
      that.applyFilter('', '')
      wx.stopPullDownRefresh()
    }, 300)
  }
})

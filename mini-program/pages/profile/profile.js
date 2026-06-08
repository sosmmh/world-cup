// pages/profile/profile.js - 个人中心
const playersAll = require('../../data/players2026')
const teamsAll = require('../../data/teams2026')
const playersData = playersAll.playersData2026  // 数组
const teamsData = teamsAll.teamsData2026        // 数组

Page({
  data: {
    // 用户信息（微信头像昵称）
    userInfo: null,
    hasUserInfo: false,

    // 收藏球员
    favPlayers: [],
    favPlayersCount: 0,

    // MBTI测试记录
    testHistory: [],
    testHistoryCount: 0,
    latestResult: null,

    // 关注球队
    followedTeams: [],
    followedTeamsCount: 0,

    // 空状态控制
    showFavEmpty: false,
    showTestEmpty: false,
    showFollowEmpty: false,
  },

  onLoad() {
    this._loadUserData()
  },

  onShow() {
    // 每次显示时刷新数据（收藏/测试可能从其他页面改变）
    this._loadUserData()
  },

  onPullDownRefresh() {
    this._loadUserData()
    wx.stopPullDownRefresh()
  },

  // ==================== 数据加载 ====================

  _loadUserData() {
    this._loadFavPlayers()
    this._loadTestHistory()
    this._loadFollowedTeams()
  },

  /** 加载收藏球员 */
  _loadFavPlayers() {
    const favIds = wx.getStorageSync('favPlayers') || []
    if (favIds.length === 0) {
      this.setData({ favPlayers: [], favPlayersCount: 0, showFavEmpty: true })
      return
    }

    // 根据playerId匹配完整球员信息
    const favList = []
    for (const id of favIds) {
      const player = playersData.find(p => p.playerId === id)
      if (player) {
        favList.push(player)
      }
    }
    this.setData({
      favPlayers: favList,
      favPlayersCount: favList.length,
      showFavEmpty: favList.length === 0
    })
  },

  /** 加载FBTI测试历史 (兼容V2旧数据) */
  _loadTestHistory() {
    // V3: 优先读取 fbti_history，回退到 mbti_history (V2)
    const history = wx.getStorageSync('fbti_history') || wx.getStorageSync('mbti_history') || []
    if (history.length === 0) {
      this.setData({
        testHistory: [],
        testHistoryCount: 0,
        latestResult: null,
        showTestEmpty: true
      })
      return
    }

    this.setData({
      testHistory: history.slice(0, 5), // 最多展示5条
      testHistoryCount: history.length,
      latestResult: history[0],
      showTestEmpty: false
    })
  },

  /** 加载关注球队 */
  _loadFollowedTeams() {
    const followIds = wx.getStorageSync('followedTeams') || []
    if (followIds.length === 0) {
      this.setData({ followedTeams: [], followedTeamsCount: 0, showFollowEmpty: true })
      return
    }

    // 根据球队id或name匹配
    const teamList = []
    for (const idOrName of followIds) {
      const team = teamsData.find(t => t.id === idOrName || t.name === idOrName || t.nameEn === idOrName)
      if (team) {
        teamList.push(team)
      }
    }
    this.setData({
      followedTeams: teamList,
      followedTeamsCount: teamList.length,
      showFollowEmpty: teamList.length === 0
    })
  },

  // ==================== 收藏操作 ====================

  /** 取消收藏球员 */
  onCancelFav(e) {
    const { playerId } = e.currentTarget.dataset
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该球员吗？',
      confirmColor: '#e94560',
      success: (res) => {
        if (res.confirm) {
          let favIds = wx.getStorageSync('favPlayers') || []
          favIds = favIds.filter(id => id !== playerId)
          wx.setStorageSync('favPlayers', favIds)

          // 刷新列表
          const favPlayers = this.data.favPlayers.filter(p => p.playerId !== playerId)
          this.setData({
            favPlayers,
            favPlayersCount: favPlayers.length,
            showFavEmpty: favPlayers.length === 0
          })

          wx.showToast({ title: '已取消收藏', icon: 'none' })
        }
      }
    })
  },

  /** 跳转球员详情 */
  onPlayerTap(e) {
    const { playerid } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/player-detail/player-detail?playerId=${playerid}`
    })
  },

  // ==================== 测试记录操作 ====================

  /** 查看测试结果详情 */
  onViewTestResult(e) {
    const { index } = e.currentTarget.dataset
    const result = this.data.testHistory[index]
    if (!result) return

    const resultStr = JSON.stringify(result)
    wx.navigateTo({
      url: `/pages/mbti-result/mbti-result?result=${encodeURIComponent(resultStr)}`
    })
  },

  /** 重新测试 */
  onRetest() {
    wx.redirectTo({ url: '/pages/mbti/mbti' })
  },

  // ==================== 关注球队操作 ====================

  /** 取消关注球队 */
  onUnfollowTeam(e) {
    const { teamName } = e.currentTarget.dataset
    wx.showModal({
      title: '取消关注',
      content: `确定要取消关注 ${teamName} 吗？`,
      confirmColor: '#e94560',
      success: (res) => {
        if (res.confirm) {
          let followIds = wx.getStorageSync('followedTeams') || []
          followIds = followIds.filter(id => id !== teamName)
          wx.setStorageSync('followedTeams', followIds)

          // 刷新列表
          const teams = this.data.followedTeams.filter(t => t.name !== teamName)
          this.setData({
            followedTeams: teams,
            followedTeamsCount: teams.length,
            showFollowEmpty: teams.length === 0
          })

          wx.showToast({ title: '已取消关注', icon: 'none' })
        }
      }
    })
  },

  /** 跳转球队详情 */
  onTeamTap(e) {
    const { teamid } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/team-detail/team-detail?id=${teamid}`
    })
  },

  // ==================== 导航方法 ====================

  /** 跳转到球队列表页 */
  goToTeams() {
    wx.switchTab({ url: '/pages/teams/teams' })
  },

  /** 获取用户信息（备用） */
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
  },
})

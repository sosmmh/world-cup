// adapters/mockAdapter.js - 模拟数据适配器 (本地开发调试用)
const mockData = require('../data/mockData')

class MockAdapter {
  async call(api, action, data = {}) {
    // 模拟网络延迟 (200-500ms)
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

    try {
      // 根据api和action返回对应的模拟数据
      switch (api) {
        case 'getFootballData':
          return this._handleFootballData(action, data)
        case 'userService':
          return this._handleUserService(action, data)
        default:
          console.warn(`[MockAdapter] 未模拟的API: ${api}/${action}`)
          return { code: -1, message: `未实现: ${api}/${action}`, data: null }
      }
    } catch (error) {
      console.error('[MockAdapter] 调用失败:', error)
      return { code: -1, message: error.message || '请求失败', data: null }
    }
  }

  _handleFootballData(action, params) {
    switch (action) {
      case 'todayMatches':
        return { code: 0, message: 'success', data: mockData.todayMatches }
      case 'liveScore':
        return { code: 0, message: 'success', data: mockData.liveMatches }
      case 'schedule':
        return { code: 0, message: 'success', data: mockData.allMatches }
      case 'standings':
        return { code: 0, message: 'success', data: mockData.standings }
      case 'news':
        return { code: 0, message: 'success', data: mockData.newsList }
      case 'scorers':
        return { code: 0, message: 'success', data: mockData.scorers }
      case 'teamInfo':
        return { code: 0, message: 'success', data: mockData.teamDetail }
      case 'playerInfo':
        return { code: 0, message: 'success', data: mockData.playerDetail }
      case 'recommendPlayers':
        return { code: 0, message: 'success', data: mockData.recommendPlayers }
      default:
        return { code: -1, message: `未知action: ${action}` }
    }
  }

  _handleUserService(action, data) {
    switch (action) {
      case 'getAllTeams':
        return { code: 0, message: 'success', data: mockData.allTeams }
      case 'getTeamDetail':
        const team = mockData.allTeams.find(t => t.id === data.teamId)
        return team
          ? { code: 0, message: 'success', data: team }
          : { code: -1, message: '球队不存在' }
      case 'getFavorites':
        return { code: 0, message: 'success', data: [] }
      case 'getTestHistory':
        return { code: 0, message: 'success', data: [] }
      case 'getFollowedTeams':
        return { code: 0, message: 'success', data: [] }
      default:
        return { code: -1, message: `未知action: ${action}` }
    }
  }
}

module.exports = MockAdapter

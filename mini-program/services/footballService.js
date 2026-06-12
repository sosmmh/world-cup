// services/footballService.js - 足球数据服务（统一入口，自动转换队徽URL为本地路径）
var config = require('../config')
var crestMap = require('../utils/crestMap')

function getFootballService() {
  console.log('[footballService] config.adapter =', config.adapter)
  switch (config.adapter) {
    case 'cloud':
      return require('./impl/footballCloudService')
    case 'http':
      return require('./impl/footballHttpService')
    default:
      console.warn('[footballService] 未知适配器:', config.adapter, '，默认使用 cloud')
      return require('./impl/footballCloudService')
  }
}

var impl = getFootballService()

/**
 * 包装器：对返回比赛数据的接口自动转换队徽URL → 本地路径
 */
var footballService = {
  async getSchedule(params) {
    var res = await impl.getSchedule(params)
    if (res.code === 0 && res.data && res.data.matches) {
      crestMap.convertMatchCrests(res.data.matches)
    }
    return res
  },

  async getTodayMatches(forceRefresh) {
    var res = await impl.getTodayMatches(forceRefresh)
    if (res.code === 0 && res.data && res.data.matches) {
      crestMap.convertMatchCrests(res.data.matches)
    }
    return res
  },

  async getLiveScore() {
    var res = await impl.getLiveScore()
    if (res.code === 0 && res.data && res.data.matches) {
      crestMap.convertMatchCrests(res.data.matches)
    }
    return res
  },

  async getStandings(groupName) {
    var res = await impl.getStandings(groupName)
    if (res.code === 0 && res.data && res.data.standings) {
      // 转换积分榜中的队徽URL为本地路径（映射不到时保留原始URL）
      res.data.standings.forEach(function(sg) {
        if (sg.table) {
          sg.table.forEach(function(row) {
            if (row.team && row.team.crest) {
              var localCrest = crestMap.getLocalCrestUrl(row.team.crest)
              row.team.crest = localCrest || row.team.crest
            }
          })
        }
      })
    }
    return res
  },

  async getScorers(leagueId, season) {
    var res = await impl.getScorers(leagueId, season)
    if (res.code === 0 && res.data) {
      // 射手榜也包含teamCrest，需要转换
      for (var i = 0; i < res.data.length; i++) {
        if (res.data[i].teamCrest) {
          res.data[i].teamCrest = crestMap.getLocalCrestUrl(res.data[i].teamCrest)
        }
      }
    }
    return res
  },

  async getHotNews(category, page, pageSize, forceRefresh) {
    return impl.getHotNews(category, page, pageSize, forceRefresh)
  },

  async getPlayerInfo(playerId) {
    return impl.getPlayerInfo(playerId)
  },

  async getTeamRealtimeData(teamId) {
    var res = await impl.getTeamRealtimeData(teamId)
    if (res.code === 0 && res.data && res.data.crest) {
      res.data.crest = crestMap.getLocalCrestUrl(res.data.crest)
    }
    return res
  },

  async getRecommendPlayers(count) {
    return impl.getRecommendPlayers(count)
  },

  clearCache(type) {
    return impl.clearCache(type)
  }
}

module.exports = footballService

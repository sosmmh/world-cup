// services/footballService.js - 足球数据服务（策略模式工厂）
// 根据 config.adapter 自动选择对应实现：mock / cloud / http
const config = require('../config')

const mockImpl = require('./impl/footballMockService')
const cloudImpl = require('./impl/footballCloudService')
const httpImpl = require('./impl/footballHttpService')

let _instance = null

function getFootballService() {
  if (!_instance) {
    switch (config.adapter) {
      case 'cloud':
        _instance = cloudImpl
        console.log('[FootballService] 使用 Cloud 实现')
        break
      case 'http':
        _instance = httpImpl
        console.log('[FootballService] 使用 HTTP 实现')
        break
      case 'mock':
      default:
        _instance = mockImpl
        console.log('[FootballService] 使用 Mock 实现')
        break
    }
  }
  return _instance
}

module.exports = getFootballService()

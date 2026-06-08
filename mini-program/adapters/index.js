// adapters/index.js - 适配器工厂
const config = require('../config')

let _instance = null

function getAdapter() {
  if (!_instance) {
    const adapterType = config.adapter

    switch (adapterType) {
      case 'cloud':
        const CloudAdapter = require('./cloudAdapter')
        _instance = new CloudAdapter()
        break
      case 'http':
        const HttpAdapter = require('./httpAdapter')
        _instance = new HttpAdapter()
        break
      case 'mock':
        const MockAdapter = require('./mockAdapter')
        _instance = new MockAdapter()
        break
      default:
        throw new Error(`未知的适配器类型: ${adapterType}`)
    }
  }
  return _instance
}

module.exports = { getAdapter }

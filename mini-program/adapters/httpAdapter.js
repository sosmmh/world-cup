// adapters/httpAdapter.js - HTTP后端适配器 [预留]
const config = require('../config')

class HttpAdapter {
  async call(api, action, data = {}) {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${config.http.baseUrl}/${api}/${action}`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
          },
          data: data,
          success: resolve,
          fail: reject
        })
      })

      if (res.statusCode === 200 && res.data.code === 0) {
        return {
          code: 0,
          message: 'success',
          data: res.data.data
        }
      }

      return {
        code: res.data?.code || -1,
        message: res.data?.message || '请求失败',
        data: null
      }
    } catch (error) {
      console.error('[HttpAdapter] 调用失败:', error)
      return {
        code: -1,
        message: error.message || '网络请求异常',
        data: null
      }
    }
  }
}

module.exports = HttpAdapter

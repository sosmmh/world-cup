// adapters/cloudAdapter.js - 云开发适配器
class CloudAdapter {
  async call(api, action, data = {}) {
    try {
      const res = await wx.cloud.callFunction({
        name: api,
        data: { action, ...data }
      })

      if (res.result && res.result.code === 0) {
        return {
          code: 0,
          message: 'success',
          data: res.result.data
        }
      }

      return {
        code: res.result?.code || -1,
        message: res.result?.message || '请求失败',
        data: null
      }
    } catch (error) {
      console.error('[CloudAdapter] 调用失败:', error)
      return {
        code: -1,
        message: error.message || '网络请求异常',
        data: null
      }
    }
  }
}

module.exports = CloudAdapter

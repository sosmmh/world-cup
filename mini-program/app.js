// app.js - 小程序入口
const config = require('./config')

App({
  globalData: {
    config: config,
    sessionId: generateSessionId()
  },

  onLaunch() {
    // 初始化云开发
    if (config.adapter === 'cloud') {
      wx.cloud.init({
        env: config.cloud.env,
        traceUser: config.cloud.traceUser
      })
    }

    // 清除旧版新闻缓存（关键词优化后旧数据失效）
    try {
      var keys = wx.getStorageInfoSync().keys || []
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('cache_news') >= 0) {
          wx.removeStorageSync(keys[i])
          console.log('[App] 已清除旧新闻缓存:', keys[i])
        }
      }
    } catch(e) {}

    console.log('[App] 世界杯装懂指南启动')
  }
})

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

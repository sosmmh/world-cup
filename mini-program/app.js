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

    console.log('[App] 世界杯装懂指南启动')
  }
})

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

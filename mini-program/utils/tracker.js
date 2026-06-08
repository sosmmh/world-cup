// utils/tracker.js - 埋点上报工具（轻量版）
const config = require('../config')

if (!config.tracker || !config.tracker.enabled) {
  module.exports = { trackEvent: () => {}, trackPageView: () => {} }
} else {
  const EVENT_QUEUE = []
  let flushTimer = null

  const tracker = {
    trackEvent(eventId, params = {}) {
      EVENT_QUEUE.push({
        eventId,
        params,
        timestamp: Date.now()
      })
      if (EVENT_QUEUE.length >= (config.tracker.batchSize || 10)) {
        this.flush()
      } else {
        this._scheduleFlush()
      }
    },

    trackPageView(pageName, fromPage) {
      this.trackEvent('page_view', { page: pageName, fromPage })
    },

    async flush() {
      if (EVENT_QUEUE.length === 0) return
      clearTimeout(flushTimer)
      const events = EVENT_QUEUE.splice(0)
      // 云函数上报（预留）
      try {
        await wx.cloud.callFunction({
          name: 'analytics',
          data: { action: 'trackEvents', events }
        })
      } catch (e) {
        console.warn('[Tracker] 上报失败:', e.message)
      }
    },

    _scheduleFlush() {
      if (flushTimer) return
      flushTimer = setTimeout(() => {
        this.flush()
        flushTimer = null
      }, config.tracker.flushInterval || 30000)
    }
  }

  module.exports = tracker
}

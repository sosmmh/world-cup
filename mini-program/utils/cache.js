// utils/cache.js - 统一本地缓存管理
const STORAGE_PREFIX = 'wc_cache_'

const cacheManager = {
  /**
   * 获取缓存
   */
  get(key, expireMinutes) {
    try {
      const fullKey = STORAGE_PREFIX + key
      const cached = wx.getStorageSync(fullKey)

      if (!cached || !cached.data || !cached.timestamp) {
        return null
      }

      // 检查是否过期
      const elapsed = (Date.now() - cached.timestamp) / 60000
      if (elapsed >= expireMinutes) {
        wx.removeStorageSync(fullKey)
        return null
      }

      return cached.data
    } catch (e) {
      console.warn('[Cache] get失败:', e)
      return null
    }
  },

  /**
   * 设置缓存
   */
  set(key, data, expireMinutes) {
    try {
      const fullKey = STORAGE_PREFIX + key
      wx.setStorageSync(fullKey, {
        data: data,
        timestamp: Date.now(),
        expireMinutes: expireMinutes
      })
    } catch (e) {
      console.warn('[Cache] set失败:', e)
    }
  },

  /**
   * 删除指定缓存
   */
  remove(key) {
    try {
      wx.removeStorageSync(STORAGE_PREFIX + key)
    } catch (e) {
      // ignore
    }
  },

  /**
   * 按前缀批量清除缓存
   */
  clearByPrefix(prefix) {
    try {
      const activeKeys = wx.getStorageSync(STORAGE_PREFIX + '_keys') || []
      const toRemove = activeKeys.filter(k => k.startsWith(prefix))
      toRemove.forEach(k => wx.removeStorageSync(STORAGE_PREFIX + k))

      const remainingKeys = activeKeys.filter(k => !k.startsWith(prefix))
      wx.setStorageSync(STORAGE_PREFIX + '_keys', remainingKeys)
    } catch (e) {
      console.warn('[Cache] clearByPrefix失败:', e)
    }
  },

  /**
   * 清除所有缓存
   */
  clearAll() {
    try {
      const activeKeys = wx.getStorageSync(STORAGE_PREFIX + '_keys') || []
      activeKeys.forEach(k => wx.removeStorageSync(STORAGE_PREFIX + k))
      wx.setStorageSync(STORAGE_PREFIX + '_keys', [])
    } catch (e) {
      console.warn('[Cache] clearAll失败:', e)
    }
  },

  /**
   * 注册活跃缓存key
   */
  registerKey(key) {
    try {
      const activeKeys = wx.getStorageSync(STORAGE_PREFIX + '_keys') || []
      if (!activeKeys.includes(key)) {
        activeKeys.push(key)
        wx.setStorageSync(STORAGE_PREFIX + '_keys', activeKeys)
      }
    } catch (e) {
      // ignore
    }
  }
}

module.exports = cacheManager

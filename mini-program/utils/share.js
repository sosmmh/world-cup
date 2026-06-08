// utils/share.js - 分享工具
const tracker = require('./tracker')

const shareManager = {
  /**
   * MBTI结果分享
   */
  shareMBTIResult(result) {
    return {
      title: result.shareText || `我是「${result.resultType}」球迷！你是哪种？`,
      path: '/pages/mbti/mbti',
      imageUrl: '',
      success: () => {
        if (tracker.trackEvent) tracker.trackEvent('mbti_share', { resultType: result.resultEnName })
      }
    }
  },

  /**
   * 保存Canvas绘制的分享海报到相册
   */
  async savePosterToAlbum(canvasTempPath) {
    try {
      await wx.saveImageToPhotosAlbum({ filePath: canvasTempPath })
      wx.showToast({ title: '已保存到相册', icon: 'success' })
      return true
    } catch (e) {
      if (e.errMsg && e.errMsg.includes('auth deny')) {
        wx.showModal({ title: '提示', content: '需要您授权保存图片权限' })
      }
      return false
    }
  }
}

module.exports = shareManager

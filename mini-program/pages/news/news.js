// pages/news/news.js - 新闻列表页
var footballService = require('../../services/footballService')

Page({
  data: {
    newsList: [],
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadNews()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this.loadNews(true)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadNews()
    }
  },

  async loadNews(refresh) {
    if (this.data.loading && !refresh) return
    this.setData({ loading: true })

    try {
      var res = await footballService.getHotNews(null, this.data.page, 15)
      if (res.code === 0) {
        var list = res.data || []
        if (refresh) {
          this.setData({ newsList: list })
        } else {
          this.setData({ newsList: this.data.newsList.concat(list) })
        }
        this.setData({
          hasMore: list.length >= 15,
          page: this.data.page + 1
        })
      }
    } catch(e) {
      console.error('[News] 加载失败:', e)
    } finally {
      this.setData({ loading: false })
      if (refresh) wx.stopPullDownRefresh()
    }
  },

  onTapNews(e) {
    var url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({ url: '/pages/webview/webview?url=' + encodeURIComponent(url) })
    } else {
      wx.showToast({ title: '该新闻暂无链接', icon: 'none' })
    }
  }
})

// pages/tool-detail/tool-detail.js - 工具详情页
const slangData = require('../../data/slangData')
const quotesData = require('../../data/quotesData')
const memeData = require('../../data/memeData')
const nicknamesData = require('../../data/nicknamesData')
const offsideData = require('../../data/offsideData')
const rivalryData = require('../../data/rivalryData')

// 工具配置
var TOOL_CONFIG = {
  slang: {
    title: '足球黑话词典',
    icon: '📖',
    color: '#e94560'
  },
  quotes: {
    title: '赛后万能话术',
    icon: '💬',
    color: '#4ecdc4'
  },
  meme: {
    title: '经典梗图合集',
    icon: '😂',
    color: '#ff9f43'
  },
  nicknames: {
    title: '球星绰号大全',
    icon: '⭐',
    color: '#a55eea'
  },
  offside: {
    title: '越位规则图解',
    icon: '⚽',
    color: '#26de81'
  },
  rivalry: {
    title: '球队恩怨录',
    icon: '🔥',
    color: '#fd9644'
  }
}

Page({
  data: {
    toolId: '',
    config: null,
    listData: [],
    extraData: null
  },

  onLoad(options) {
    var toolId = options.type || options.id || ''
    if (!toolId) return

    var config = TOOL_CONFIG[toolId]
    if (!config) return

    this.setData({ toolId: toolId, config: config })
    wx.setNavigationBarTitle({ title: config.title })

    this.loadData(toolId)
  },

  // 分发加载不同工具数据
  loadData(toolId) {
    switch (toolId) {
      case 'slang':
        this.setData({ listData: slangData.slangs || [] })
        break
      case 'quotes':
        this.setData({ listData: quotesData.quotes || [] })
        break
      case 'meme':
        this.setData({ listData: memeData.memes || [] })
        break
      case 'nicknames':
        this.setData({ listData: nicknamesData.nicknames || [] })
        break
      case 'offside':
        this.setData({
          extraData: offsideData.intro,
          listData: offsideData.scenes || []
        })
        break
      case 'rivalry':
        this.setData({ listData: rivalryData.rivalries || [] })
        break
    }
  },

  // 复制文字到剪贴板
  onCopyText(e) {
    var text = e.currentTarget.dataset.text || ''
    if (text) {
      wx.setClipboardData({
        data: text,
        success: function () {
          wx.showToast({ title: '已复制', icon: 'success' })
        }
      })
    }
  },

  // 分享
  onShareAppMessage() {
    var config = this.data.config || {}
    return {
      title: config.icon + ' ' + (config.title || '世界杯装懂指南'),
      path: '/pages/tool-detail/tool-detail?id=' + this.data.toolId
    }
  }
})

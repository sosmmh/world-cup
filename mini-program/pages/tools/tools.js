// pages/tools/tools.js - 速成工具箱
Page({
  data: {
    toolList: [
      {
        id: 'slang',
        name: '足球黑话词典',
        desc: '20条装逼黑话，秒变懂球帝',
        icon: '📖',
        color: '#e94560',
        bgColor: 'rgba(233,69,96,0.08)'
      },
      {
        id: 'quotes',
        name: '赛后万能话术',
        desc: '24条万能语录，赢输都有话说',
        icon: '💬',
        color: '#4ecdc4',
        bgColor: 'rgba(78,205,196,0.08)'
      },
      {
        id: 'meme',
        name: '经典梗图合集',
        desc: '8张经典表情包，聊天必备',
        icon: '😂',
        color: '#ff9f43',
        bgColor: 'rgba(255,159,67,0.08)'
      },
      {
        id: 'nicknames',
        name: '球星绰号大全',
        desc: '12位球星外号，叫错很尴尬',
        icon: '⭐',
        color: '#a55eea',
        bgColor: 'rgba(165,94,234,0.08)'
      },
      {
        id: 'offside',
        name: '越位规则图解',
        desc: '4种场景图解，彻底搞懂越位',
        icon: '⚽',
        color: '#26de81',
        bgColor: 'rgba(38,222,129,0.08)'
      },
      {
        id: 'rivalry',
        name: '球队恩怨录',
        desc: '6组经典恩怨，聊球有谈资',
        icon: '🔥',
        color: '#fd9644',
        bgColor: 'rgba(253,150,68,0.08)'
      }
    ]
  },

  onToolTap(e) {
    var toolId = e.currentTarget.dataset.id
    if (toolId) {
      wx.navigateTo({
        url: '/pages/tool-detail/tool-detail?id=' + toolId
      })
    }
  }
})

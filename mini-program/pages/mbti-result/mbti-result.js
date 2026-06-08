// pages/mbti-result/mbti-result.js - FBTI 2.0 结果页 (V3)
// 雷达图改用「五维指标条」可视化（更适合小程序场景）
const shareManager = require('../../utils/share')

Page({
  data: {
    result: null,
    resultColor: '#FFD700',
    cardBgColor: 'rgba(13,27,42,0.95)',
    radarReady: false,
    canvasWidth: 300,
    canvasHeight: 260 // 指标条模式不需要正方形
  },

  onLoad(options) {
    if (options.result) {
      try {
        var result = JSON.parse(decodeURIComponent(options.result))
        this._setResultData(result)
      } catch (e) {
        console.error('[FBTI-Result] 解析参数失败:', e)
        this._loadFromLocal()
      }
    } else {
      this._loadFromLocal()
    }
  },

  onReady() {
    if (this.data.result && !this.data.radarReady) {
      setTimeout(() => { this._drawRadarChart() }, 500)
    }
  },

  onShareAppMessage() {
    var r = this.data.result
    if (!r) return {}
    return {
      title: 'FBTI测试：我是「' + r.code + ' ' + r.name + '」！' + r.shareText,
      path: '/pages/mbti/mbti?share=1',
      imageUrl: ''
    }
  },

  onShareTimeline() {
    var r = this.data.result
    if (!r) return {}
    return {
      title: '我是「' + r.code + '」型球迷！你是哪种？来测FBTI 2.0！',
      query: '',
      imageUrl: ''
    }
  },

  _setResultData(result) {
    var c = result.color || '#FFD700'
    result.questionsCount = (result.answers || []).length
    this.setData({ result: result, resultColor: c, cardBgColor: 'rgba(13,27,42,0.96)' })
    setTimeout(() => { this._drawRadarChart() }, 600)
  },

  _loadFromLocal() {
    try {
      var history = wx.getStorageSync('fbti_history') || []
      if (history.length > 0) { this._setResultData(history[0]) }
    } catch (e) { console.warn('[FBTI-Result] 读取历史失败:', e) }
  },

  onShare() {},

  onCopyQuote() {
    var r = this.data.result
    if (!r) return
    wx.setClipboardData({
      data: r.goldQuote + '\n\n—— 「' + r.code + ' ' + r.name + '」· FBTI 2.0 球迷人格测试',
      success: function () { wx.showToast({ title: '金句已复制', icon: 'success' }) },
      fail: function () { wx.showToast({ title: '复制失败', icon: 'none' }) }
    })
  },

  onRetest() {
    wx.redirectTo({ url: '/pages/mbti/mbti' })
  },

  // ==================== 五维指标条绘制 ====================

  _drawRadarChart() {
    var that = this
    var result = this.data.result
    if (!result) return

    var modelGroups = result.modelGroups
    var themeColor = result.color || result.resultColor || '#6C5CE7'
    if (!modelGroups || modelGroups.length === 0) return

    var sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    var dpr = sysInfo.pixelRatio || 2
    var cw = Math.min(sysInfo.windowWidth - 60, 580)
    // 高度 = 标题行 + 5个指标行(每个56px) + 底部间距
    var ch = 40 + modelGroups.length * 56 + 20

    this.setData({ canvasWidth: cw, canvasHeight: ch, radarReady: true })

    setTimeout(function () {
      var query = wx.createSelectorQuery().in(that)
      query.select('#radarCanvas')
        .fields({ node: true, size: true })
        .exec(function (res) {
          if (!res[0] || !res[0].node) return

          var canvas = res[0].node
          var ctx = canvas.getContext('2d')
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)

          var W = res[0].width
          var H = res[0].height
          var padLeft = 10
          var padRight = 10
          var barAreaW = W - padLeft - padRight
          var rowH = 56
          var startY = 36 // 标题区高度

          // 提取数据
          var items = []
          for (var mi = 0; mi < modelGroups.length; mi++) {
            var mg = modelGroups[mi]
            var sum = 0
            for (var di = 0; di < mg.dimensions.length; di++) {
              sum += mg.dimensions[di].mapped
            }
            var avg = sum / mg.dimensions.length // 1~3
            var pct = Math.round((avg - 1) / 2 * 100) // 0~100%
            var level = avg < 1.6 ? '低' : (avg < 2.4 ? '中' : '高')
            var levelEn = avg < 1.6 ? 'LOW' : (avg < 2.4 ? 'MID' : 'HIGH')
            items.push({
              label: mg.label,
              avg: avg,
              pct: pct,
              level: level,
              levelEn: levelEn
            })
          }

          // ====== 深色半透明背景（适配深色主题） ======
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          that._drawRoundRect(ctx, 0, 0, W, H, 16)
          ctx.fill()

          // 1) 小标题
          ctx.font = 'bold 11px sans-serif'
          ctx.textAlign = 'left'
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.fillText('● 人格维度分析', padLeft, 22)

          // 2) 绘制每一行的指标条
          for (var i = 0; i < items.length; i++) {
            var item = items[i]
            var y = startY + i * rowH
            var cy = y + rowH / 2

            // --- 左侧：维度名称 ---
            ctx.font = 'bold 13px sans-serif'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = 'rgba(255,255,255,0.92)'
            ctx.fillText(item.label, padLeft, cy)

            // --- 右侧：等级标签（小药丸） ---
            var pillText = item.level
            var pillW = 32
            var pillH = 20
            var pillX = W - padRight - pillW
            var pillY = cy - pillH / 2

            // 药丸背景色 — 与进度条明显区分
            var pillColor
            if (item.level === '高') pillColor = '#66BB6A'
            else if (item.level === '中') pillColor = '#FFA726'
            else pillColor = '#546E7A'

            ctx.fillStyle = pillColor
            ctx.beginPath()
            ctx.moveTo(pillX + 4, pillY)
            ctx.lineTo(pillX + pillW - 4, pillY)
            ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + 4)
            ctx.lineTo(pillX + pillW, pillY + pillH - 4)
            ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - 4, pillY + pillH)
            ctx.lineTo(pillX + 4, pillY + pillH)
            ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - 4)
            ctx.lineTo(pillX, pillY + 4)
            ctx.quadraticCurveTo(pillX, pillY, pillX + 4, pillY)
            ctx.closePath()
            ctx.fill()

            ctx.font = 'bold 11px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#fff'
            ctx.fillText(pillText, pillX + pillW / 2, cy)

            // --- 中间：进度条轨道 ---
            var trackX = padLeft + 68
            var trackW = barAreaW - 68 - pillW - 16
            var trackH = 12
            var trackY = cy - trackH / 2

            // 轨道背景（亮一点，与填充形成对比）
            ctx.fillStyle = 'rgba(255,255,255,0.14)'
            that._drawRoundRect(ctx, trackX, trackY, trackW, trackH, 6)
            ctx.fill()

            // 进度填充（最小显示15%，保证可见）
            var fillPct = Math.max(15, item.pct)
            var fillW = trackW * fillPct / 100
            if (fillW > 0) {
              // 渐变填充 — 亮色到半透明，确保可见
              var grd = ctx.createLinearGradient(trackX, 0, trackX + fillW, 0)
              // 提取主题色的亮版本
              var brightColor = that._lightenColor(themeColor, 40)
              grd.addColorStop(0, brightColor)
              grd.addColorStop(1, that._alphaColor(themeColor, 0.75))
              ctx.fillStyle = grd

              ctx.beginPath()
              var fw = Math.max(fillW, 12)
              that._drawRoundRect(ctx, trackX, trackY, fw, trackH, 6)
              ctx.fill()

              // 顶部高光（增加立体感）
              ctx.fillStyle = 'rgba(255,255,255,0.2)'
              ctx.beginPath()
              that._drawRoundRect(ctx, trackX + 1, trackY + 1, Math.max(fw - 2, 6), trackH / 2 - 1, 3)
              ctx.fill()
            }

            // 百分比数字（在进度条右侧或内部）
            if (fillW > 35) {
              // 数字在条内部右侧
              ctx.font = 'bold 10px sans-serif'
              ctx.textAlign = 'right'
              ctx.textBaseline = 'middle'
              ctx.fillStyle = '#fff'
              ctx.fillText(item.pct + '%', trackX + fillW - 6, cy)
            }
          }
        })
    }, 100)
  },

  _alphaColor(hex, alpha) {
    if (!hex || typeof hex !== 'string') return 'rgba(108,92,231,' + alpha + ')'
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex
    var h = hex.replace('#', '')
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
    var r = parseInt(h.slice(0, 2), 16) || 0
    var g = parseInt(h.slice(2, 4), 16) || 0
    var b = parseInt(h.slice(4, 6), 16) || 0
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
  },

  // 将颜色提亮指定百分比（0~100），用于进度条高亮
  _lightenColor(hex, amount) {
    if (!hex || typeof hex !== 'string') return '#a29bfe'
    var h = hex.replace('#', '')
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
    var r = Math.min(255, parseInt(h.slice(0, 2), 16) + Math.round(255 * amount / 100))
    var g = Math.min(255, parseInt(h.slice(2, 4), 16) + Math.round(255 * amount / 100))
    var b = Math.min(255, parseInt(h.slice(4, 6), 16) + Math.round(255 * amount / 100))
    return '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2)
  },

  // 手动画圆角矩形 path（兼容不支持 roundRect 的微信版本）
  _drawRoundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  },

  _hexToRgba(hex, alpha) {
    return this._alphaColor(hex, alpha)
  }
})

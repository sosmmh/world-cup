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
    canvasHeight: 260, // 指标条模式不需要正方形
    // 海报相关
    showPoster: false,
    posterWidth: 375,
    posterHeight: 667
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
      title: '测出我是「' + r.name + '」(' + r.code + ')！' + (r.goldQuote || ''),
      path: '/pages/mbti/mbti?share=1',
      imageUrl: this.data.posterTempPath || ''
    }
  },

  onShareTimeline() {
    var r = this.data.result
    if (!r) return {}
    return {
      title: '我是「' + r.code + '」型球迷！你是哪种？来测FBTI 2.0！',
      query: '',
      imageUrl: this.data.posterTempPath || ''
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

  onShare() {
    this.onGeneratePoster()
  },

  // ==================== 分享海报绘制 ====================

  /** 打开海报弹窗并开始绘制 */
  onGeneratePoster() {
    var that = this
    if (!this.data.result) return
    this.setData({ showPoster: true })
    setTimeout(function () { that._drawPoster() }, 300)
  },

  onClosePoster() {
    this.setData({ showPoster: false, posterTempPath: '' })
  },

  /** 保存海报到相册 */
  onSavePoster() {
    var that = this
    var path = this.data.posterTempPath
    if (!path) {
      wx.showToast({ title: '海报生成中，请稍候', icon: 'none' })
      return
    }
    wx.saveImageToPhotosAlbum({
      filePath: path,
      success: function () {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: function (e) {
        if (e.errMsg && e.errMsg.indexOf('auth deny') > -1) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存图片权限，请在设置中开启',
            confirmText: '去设置',
            success: function (res) {
              if (res.confirm) wx.openSetting()
            }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },

  /**
   * 绘制分享海报 Canvas (PRD-V3 5.6)
   * 布局：顶部Logo → 人格代码+名称+emoji → 描述 → 金句 → 底部二维码
   */
  _drawPoster() {
    var that = this
    var r = this.data.result
    if (!r) return

    var themeColor = r.color || '#FFD700'
    var sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    var dpr = sysInfo.pixelRatio || 2
    var W = 375  // 海报标准宽度（设计稿基准）
    var H = 667  // 海报高度
    var scale = Math.min(sysInfo.windowWidth / W, 1)

    this.setData({ posterWidth: W * scale, posterHeight: H * scale })

    setTimeout(function () {
      var query = wx.createSelectorQuery().in(that)
      query.select('#posterCanvas')
          .fields({ node: true, size: true })
          .exec(function (res) {
            if (!res[0] || !res[0].node) return

            var canvas = res[0].node
            var ctx = canvas.getContext('2d')
            canvas.width = res[0].width * dpr
            canvas.height = res[0].height * dpr
            ctx.scale(dpr, dpr)

            var cW = res[0].width
            var cH = res[0].height
            var pad = cW * 0.056

            // ====== 1. 背景：主题色渐变 ======
            var bgGrad = ctx.createLinearGradient(0, 0, 0, cH)
            bgGrad.addColorStop(0, that._lightenColor(themeColor, 10))
            bgGrad.addColorStop(0.35, themeColor)
            bgGrad.addColorStop(1, that._darkenColor(themeColor, 45))
            that._drawRoundRect(ctx, 0, 0, cW, cH, 0)
            ctx.fillStyle = bgGrad
            ctx.fill()

            // 背景装饰 — 半透明圆形/菱形
            ctx.globalAlpha = 0.06
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(cW * 0.85, cH * 0.12, cW * 0.35, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(-cW * 0.1, cH * 0.7, cW * 0.28, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalAlpha = 1

            // ====== 2. 顶部品牌区 ======
            var topY = pad + 12
            // 品牌标签背景
            var brandW = 220
            var brandX = (cW - brandW) / 2
            ctx.fillStyle = 'rgba(255,255,255,0.18)'
            that._drawRoundRect(ctx, brandX, topY, brandW, 36, 18)
            ctx.fill()

            ctx.font = 'bold 14px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#fff'
            ctx.fillText('⚽ FBTI 2.0 · 测测你是哪种球迷', cW / 2, topY + 18)

            // ====== 3. Emoji 大图标 ======
            var emojiY = topY + 64
            ctx.font = '72px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(r.emoji || '⚽', cW / 2, emojiY)

            // ====== 4. 代码徽章（大字体） ======
            var codeY = emojiY + 54
            var codeBgW = Math.min(ctx.measureText(r.code).width + 50, 240)
            var codeBgX = (cW - codeBgW) / 2
            ctx.fillStyle = 'rgba(0,0,0,0.25)'
            that._drawRoundRect(ctx, codeBgX, codeY - 18, codeBgW, 40, 20)
            ctx.fill()
            ctx.font = '900 28px sans-serif'
            ctx.fillStyle = '#fff'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.letterSpacing = '4px'
            ctx.fillText(r.code, cW / 2, codeY + 2)

            // ====== 5. 中文名 + 英文名 ======
            var nameY = codeY + 42
            ctx.font = '800 26px sans-serif'
            ctx.fillStyle = '#fff'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(r.name, cW / 2, nameY)

            ctx.font = '300 13px sans-serif'
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.fillText(r.enName || '', cW / 2, nameY + 26)

            // Badge 标签
            var badgeY = nameY + 48
            var badgeText = r.badge || ''
            var badgeW = ctx.measureText(badgeText).width + 32
            var badgePx = (cW - badgeW) / 2
            ctx.fillStyle = 'rgba(255,255,255,0.22)'
            that._drawRoundRect(ctx, badgePx, badgeY - 12, badgeW, 24, 12)
            ctx.fill()
            ctx.font = '500 12px sans-serif'
            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.fillText(badgeText, cW / 2, badgeY)

            // ====== 6. 白色内容卡片 ======
            var cardY = badgeY + 36
            var cardH = cH - cardY - pad - 90 // 底部留空间给二维码
            ctx.fillStyle = 'rgba(255,255,255,0.96)'
            that._drawRoundRect(ctx, pad, cardY, cW - pad * 2, cardH, 16)
            ctx.fill()

            // 卡片内描述标题
            var innerPad = pad + 12
            ctx.font = 'bold 13px sans-serif'
            ctx.fillStyle = themeColor
            ctx.textAlign = 'left'
            ctx.textBaseline = 'top'
            ctx.fillText('● 人格特征', innerPad, cardY + 18)

            // 描述文案（自动换行）
            var desc = r.description || ''
            var maxDescW = cW - innerPad * 2
            ctx.font = 'normal 13px sans-serif'
            ctx.fillStyle = 'rgba(40,40,40,0.82)'
            that._wrapText(ctx, desc, innerPad, cardY + 42, maxDescW, 19)

            // 分割线
            var lineY = cardY + cardH * 0.52
            ctx.strokeStyle = 'rgba(0,0,0,0.06)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(innerPad, lineY)
            ctx.lineTo(cW - innerPad, lineY)
            ctx.stroke()

            // 金句区域
            ctx.font = 'bold 12px sans-serif'
            ctx.fillStyle = '#E6A817'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'top'
            ctx.fillText('💬 经典语录', innerPad, lineY + 14)

            var quote = r.goldQuote || ''
            ctx.font = '400 13px sans-serif'
            ctx.fillStyle = 'rgba(60,60,60,0.88)'
            that._wrapText(ctx, quote, innerPad, lineY + 36, maxDescW, 20)

            // ====== 7. 底部区域（卡片外） ======
            var bottomY = cardY + cardH + 16
            var qrSize = 100
            var qrX = (cW - qrSize) / 2

            // 二维码区域：白色圆角底 + 内边框装饰
            ctx.fillStyle = '#fff'
            that._drawRoundRect(ctx, qrX, bottomY, qrSize, qrSize, 14)
            ctx.fill()

            // 内边框 — 三条边的装饰线（右上角缺角风格）
            ctx.strokeStyle = themeColor
            ctx.lineWidth = 1.5
            ctx.beginPath()
            // 上边线
            ctx.moveTo(qrX + 8, bottomY + 4)
            ctx.lineTo(qrX + qrSize - 4, bottomY + 4)
            // 右边线
            ctx.lineTo(qrX + qrSize - 4, bottomY + qrSize - 8)
            // 下边线（只画一半）
            ctx.lineTo(qrX + qrSize / 2 + 4, bottomY + qrSize - 4)
            ctx.stroke()

            // 左下角小足球图标
            ctx.font = '24px sans-serif'
            ctx.fillStyle = 'rgba(0,0,0,0.12)'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('⚽', qrX + 20, bottomY + qrSize - 18)

            // 右上角小标签
            ctx.font = 'bold 9px sans-serif'
            ctx.fillStyle = themeColor
            ctx.textAlign = 'right'
            ctx.textBaseline = 'bottom'
            ctx.fillText('FBTI', qrX + qrSize - 6, bottomY + 16)

            // 中心文字
            ctx.font = 'bold 11px sans-serif'
            ctx.fillStyle = 'rgba(0,0,0,0.3)'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('扫码测一测', qrX + qrSize / 2, bottomY + qrSize / 2)

            // 尝试加载并绘制真实小程序码（如果有配置）
            that._drawQRCodeImage(canvas, ctx, qrX + 5, bottomY + 5, qrSize - 10, function () {
              // 导出为临时图片（在二维码图片加载完成后）
              wx.canvasToTempFilePath({
                canvas: canvas,
                fileType: 'jpg',
                quality: 0.92,
                success: function (res) {
                  that.setData({ posterTempPath: res.tempFilePath })
                },
                fail: function (e) {
                  console.warn('[FBTI-Result] 海报导出失败:', e)
                }
              })
            })
          })
    }, 150)
  },

  /** 文字自动换行绘制 */
  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y
    var chars = text.split('')
    var line = ''
    for (var i = 0; i < chars.length; i++) {
      var testLine = line + chars[i]
      var metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, y)
        line = chars[i]
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)
    return y + lineHeight
  },

  /** 颜色加深 */
  _darkenColor(hex, amount) {
    if (!hex || typeof hex !== 'string') return '#1a1a3e'
    var h = hex.replace('#', '')
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
    var r = Math.max(0, parseInt(h.slice(0, 2), 16) - Math.round(255 * amount / 100))
    var g = Math.max(0, parseInt(h.slice(2, 4), 16) - Math.round(255 * amount / 100))
    var b = Math.max(0, parseInt(h.slice(4, 6), 16) - Math.round(255 * amount / 100))
    return '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2)
  },

  /**
   * 绘制小程序码图片（优先加载真实图片，失败则保留占位）
   * @param {Canvas} canvas - canvas实例
   * @param {Context} ctx - canvas context
   * @param {number} x - 左上角x
   * @param {number} y - 左上角y
   * @param {number} size - 宽高（正方形）
   * @param {Function} cb - 绘制完成回调
   */
  _drawQRCodeImage(canvas, ctx, x, y, size, cb) {
    var that = this

    // 尝试从云存储或网络加载小程序码图片
    // 可在 config.js 中配置 posterQrCodePath，如 cloud://xxx 或 https://xxx
    try {
      var config = require('../../config')
      var qrPath = config.posterQrCodePath || ''
      if (qrPath) {
        var img = canvas.createImage()
        img.onload = function () {
          // 绘制圆角二维码图片
          ctx.save()
          that._drawRoundRect(ctx, x, y, size, size, 8)
          ctx.clip()
          ctx.drawImage(img, x, y, size, size)
          ctx.restore()
          if (cb) cb()
        }
        img.onerror = function () {
          console.warn('[FBTI-Result] 小程序码图片加载失败，使用占位')
          that._drawFallbackQR(ctx, x, y, size)
          if (cb) cb()
        }
        img.src = qrPath
        return
      }
    } catch (e) {
      // config 不存在或读取失败，走兜底
    }

    // 兜底：绘制装饰性二维码图案
    that._drawFallbackQR(ctx, x, y, size)
    if (cb) setTimeout(cb, 50)
  },

  /**
   * 绘制装饰性二维码占位图案（无真实图片时的优雅降级）
   */
  _drawFallbackQR(ctx, x, y, size) {
    var cellSize = Math.floor(size / 11)
    var cx = x + size / 2
    var cy = y + size / 2
    var innerSize = cellSize * 7
    var startX = cx - innerSize / 2
    var startY = cy - innerSize / 2

    // 定位点（左上、右上、左下）— 三回字纹
    var positions = [
      [startX, startY],
      [startX + innerSize - cellSize * 3, startY],
      [startX, startY + innerSize - cellSize * 3]
    ]

    for (var p = 0; p < positions.length; p++) {
      var px = positions[p][0]
      var py = positions[p][1]
      var outer = cellSize * 3
      var inner = cellSize * 1.5
      var mid = cellSize * 2.2

      // 外框
      ctx.fillStyle = 'rgba(30,30,30,0.75)'
      that._drawRoundRect(ctx, px, py, outer, outer, 4)
      ctx.fill()

      // 中框
      ctx.fillStyle = '#fff'
      that._drawRoundRect(ctx, px + (outer - mid) / 2, py + (outer - mid) / 2, mid, mid, 2)
      ctx.fill()

      // 内核实心点
      ctx.fillStyle = 'rgba(30,30,30,0.85)'
      that._drawRoundRect(ctx, px + (outer - inner) / 2, py + (outer - inner) / 2, inner, inner, 1.5)
      ctx.fill()
    }

    // 随机数据块（模拟二维码纹理）
    ctx.fillStyle = 'rgba(30,30,30,0.55)'
    for (var row = 0; row < 7; row++) {
      for (var col = 0; col < 7; col++) {
        // 跳过定位点区域
        if ((row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3)) continue
        // 用固定伪随机生成一致图案
        var hash = ((row * 13 + col * 17 + 31) % 100) / 100
        if (hash > 0.45) {
          var bx = startX + col * cellSize + 1
          var by = startY + row * cellSize + 1
          that._drawRoundRect(ctx, bx, by, cellSize - 2, cellSize - 2, 1)
          ctx.fill()
        }
      }
    }

    // 中心小足球 logo 区域（白色底覆盖中心区域）
    var logoArea = cellSize * 1.6
    ctx.fillStyle = '#fff'
    that._drawRoundRect(ctx, cx - logoArea / 2, cy - logoArea / 2, logoArea, logoArea, 4)
    ctx.fill()

    // 小足球图标
    ctx.font = Math.floor(cellSize * 1.2) + 'px sans-serif'
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚽', cx, cy)
  },

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

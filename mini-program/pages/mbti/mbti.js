// pages/mbti/mbti.js - FBTI 2.0 测试页 (V3)
const fbtiEngine = require('../../utils/fbtiEngine')

Page({
  data: {
    questions: [],
    currentIndex: 0,
    selectedAnswer: -1,
    progress: 0,
    isFinished: false,
    currentQ: null,
    answers: [],
    answersCount: 0,
    // 维度标签映射
    dimLabels: {}
  },

  onLoad() {
    const dimLabels = fbtiEngine.getDimLabels()
    this.setData({ dimLabels })
    this._initTest()
  },

  onShareAppMessage() {
    return {
      title: 'FBTI 2.0 球迷人格测试 — 发现你的球迷人格！',
      path: '/pages/mbti/mbti'
    }
  },

  // ==================== 核心逻辑 ====================

  _initTest() {
    const questions = fbtiEngine.getQuestions()
    this.setData({
      questions,
      currentQ: questions[0],
      progress: 0
    })
  },

  /** 选择答案 → 短延时自动跳下一题 */
  onSelectOption(e) {
    if (this.data.isFinished) return
    const index = parseInt(e.currentTarget.dataset.index)
    if (index === this.data.selectedAnswer) return

    this.setData({ selectedAnswer: index })

    // 300ms 让用户看到选中效果后自动跳转
    setTimeout(() => {
      this._goNext()
    }, 300)
  },

  _goNext() {
    var currentIndex = this.data.currentIndex
    var questions = this.data.questions
    var selectedAnswer = this.data.selectedAnswer
    var answers = this.data.answers

    // 记录答案
    if (selectedAnswer >= 0) {
      answers.push({
        questionIndex: questions[currentIndex].questionIndex,
        optionIndex: selectedAnswer
      })
      // 关键：立即同步 answers 到 data
      this.setData({ answers: answers })
    }

    var nextIndex = currentIndex + 1

    if (nextIndex >= questions.length) {
      // 全部答完 — 把最终答案数也同步写入 data
      this.setData({
        isFinished: true,
        progress: 100,
        currentIndex: nextIndex - 1,
        answersCount: answers.length
      })
      console.log('[FBTI] 测试完成! 共 ' + answers.length + ' 条答案, 题目总数=' + questions.length)
    } else {
      this.setData({
        currentIndex: nextIndex,
        currentQ: questions[nextIndex],
        selectedAnswer: -1,
        progress: Math.round((nextIndex / questions.length) * 100)
      })
    }
  },

  /** 返回上一题 */
  onPrevQuestion() {
    if (this.data.currentIndex <= 0 || this.data.isFinished) return
    // 回退时移除最后一条答案
    if (this.data.selectedAnswer >= 0) {
      this.data.answers.pop()
    }
    const prevIndex = this.data.currentIndex - 1
    const prevQ = this.data.questions[prevIndex]
    // 恢复之前的选择状态
    const prevAnswer = this.data.answers.length > 0
      ? this.data.answers[this.data.answers.length - 1].optionIndex
      : -1

    this.setData({
      currentIndex: prevIndex,
      currentQ: prevQ,
      selectedAnswer: prevAnswer,
      progress: Math.round((prevIndex / this.data.questions.length) * 100),
      isFinished: false
    })
  },

  /** 手动下一题 */
  onNextQuestion() {
    if (this.data.isFinished) return
    if (this.data.selectedAnswer < 0) {
      wx.showToast({ title: '请先选择一个选项', icon: 'none' })
      return
    }
    this._goNext()
  },

  /** 提交并查看结果 */
  onViewResult() {
    // 既然能点到"查看结果"按钮，说明已经 isFinished=true
    // 不再用 answers.length 做硬性拦截（可能不同步）
    var ansLen = this.data.answers.length
    var qLen = this.data.questions.length
    console.log('[FBTI] onViewResult 触发, answers=' + ansLen + ' questions=' + qLen + ' finished=' + this.data.isFinished)

    if (!this.data.isFinished) {
      wx.showToast({ title: '请先完成测试', icon: 'none' })
      return
    }

    // 如果答案数不够（异常情况），用 -1 补齐让引擎正常工作
    var answers = this.data.answers
    if (answers.length < qLen) {
      console.warn('[FBTI] 答案数不足，补齐默认值')
      while (answers.length < qLen) {
        answers.push({ questionIndex: answers.length, optionIndex: 0 })
      }
    }

    // 先给个 loading 反馈，让用户知道点击生效了
    wx.showLoading({ title: '分析中...', mask: true })

    try {
      console.log('[FBTI] 开始计算结果...')
      var result = fbtiEngine.calculateResult(this.data.answers)
      console.log('[FBTI] 计算完成, code=' + result.code + ' name=' + result.name)

      // 保存到本地存储（不用展开运算符避免兼容问题）
      try {
        var history = wx.getStorageSync('fbti_history') || []
        var saveItem = {
          code: result.code,
          name: result.name,
          subtitle: result.subtitle,
          badge: result.badge,
          color: result.color,
          emoji: result.emoji,
          similarity: result.similarity,
          isHidden: !!result.isHidden,
          isDefault: !!result.isDefault,
          isDrunk: !!result.isDrunk,
          description: result.description,
          features: result.features || [],
          goldQuote: result.goldQuote,
          shareText: result.shareText,
          vector: result.vector,
          templateVector: result.templateVector,
          rawScores: result.rawScores,
          dimensionDetails: result.dimensionDetails,
          modelGroups: result.modelGroups,
          answers: result.answers,
          questionsCount: result.questionsCount,
          testedAt: new Date().toISOString(),
          id: Date.now()
        }
        history.unshift(saveItem)
        wx.setStorageSync('fbti_history', history.slice(0, 20))
        console.log('[FBTI] 已保存到本地存储')
      } catch (storeErr) {
        console.error('[FBTI] 存储失败:', storeErr)
      }

      wx.hideLoading()

      // 用 redirectTo 替代 navigateTo（更可靠）
      console.log('[FBTI] 开始跳转结果页...')
      wx.redirectTo({
        url: '/pages/mbti-result/mbti-result',
        fail: function (err) {
          console.error('[FBTI] redirectTo 失败:', err)
          wx.hideLoading()
          // 兜底：尝试 navigateTo
          wx.navigateTo({
            url: '/pages/mbti-result/mbti-result',
            fail: function (err2) {
              console.error('[FBTI] navigateTo 也失败:', err2)
              wx.showToast({ title: '跳转失败，请重试', icon: 'none' })
            }
          })
        }
      })
    } catch (calcErr) {
      console.error('[FBTI] 计算结果异常:', calcErr)
      wx.hideLoading()
      wx.showToast({ title: '计算出错，请重试', icon: 'none' })
    }
  }
})

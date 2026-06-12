// utils/fbtiEngine.js - FBTI 2.0 计分引擎 (V4)
// Football Behavior Type Indicator — 五模型十五维度向量匹配系统
//
// 算法流程：
//   从32题题库中随机抽取23题作答(每题1~3分)
//     → 15维度原始分聚合 (每维度1~2题，范围1~6)
//     → 自适应 L/M/H 三级映射 (根据每维度实际抽到的题目数动态调整阈值)
//     → 隐藏彩蛋检测 (H1且H2均选value=3 → DRUNK)
//     → 与27个人格模板计算曼哈顿距离
//     → 最近邻匹配 + 相似度百分比
//     → <60% → HHHH兜底

const { questions: allQuestions } = require('../data/fbtiQuestions')
const { profiles: allProfiles } = require('../data/fbtiProfiles')

// ==================== 常量配置 ====================

// 每次测试的题目数量（从题库中随机抽取）
const QUESTION_COUNT = 23

// 最少包含的隐藏题数量（H1/H2 用于触发 DRUNK 彩蛋）
const MIN_HIDDEN_COUNT = 2

const DIMENSIONS = [
  'W1', 'W2', 'W3',    // 观赛方式：观看场景 / 投入程度 / 时间偏好
  'E1', 'E2', 'E3',    // 情感模式：主队绑定 / 情绪反应 / 胜负观
  'K1', 'K2', 'K3',    // 知识储备：规则理解 / 球员认知 / 战术水平
  'S1', 'S2', 'S3',    // 社交行为：表达方式 / 互动风格 / 身份展示
  'M1', 'M2', 'M3'     // 消费决策：投入意愿 / 消费方向 / 价值判断
]

const MODEL_LABELS = {
  W: '观赛方式',
  E: '情感模式',
  K: '知识储备',
  S: '社交行为',
  M: '消费决策'
}

const DIM_LABELS = {
  W1: '观看场景', W2: '投入程度', W3: '时间偏好',
  E1: '主队绑定', E2: '情绪反应', E3: '胜负观',
  K1: '规则理解', K2: '球员认知', K3: '战术水平',
  S1: '表达方式', S2: '互动风格', S3: '身份展示',
  M1: '投入意愿', M2: '消费方向', M3: '价值判断'
}

// L/M/H 自适应映射：根据该维度抽到的题目数动态调整阈值
//
// 设计说明（V4 - 23题版）：
//   每个维度有2道题库，但23题时只能覆盖部分维度出2题
//   23题 = 21常规 + 2隐藏，15维度中约6个维度出2题、9个维度出1题
//
//   1题维度（原始分范围1~3）：
//     1→L, 2→M, 3→H  （直接对应，无压缩）
//
//   2题维度（原始分范围2~6）：
//     2→L(必须双A), 3~4→M, 5~6→H  （收紧L门槛，扩大M区间）
function mapRawToLMH(rawScore, questionCount) {
  if (questionCount === 1) {
    // 单题维度：直接映射 1→L / 2→M / 3→H
    if (rawScore <= 1) return 1
    if (rawScore <= 2) return 2
    return 3
  }
  // 双题维度：范围2~6
  if (rawScore <= 2) return 1   // L - 必须两道都选A
  if (rawScore <= 4) return 2   // M - 大多数人的自然分布区间
  return 3                       // H - 需要至少一道选C+另一道不选A
}

// 相似度计算：曼哈顿距离 → 百分比
// 最大距离 = 15维 × 最大差值2 = 30
// 相似% = (1 - 距离/30) × 100
function calcSimilarity(distance) {
  const maxDistance = 30 // 15 dims × max diff 2 per dim
  const sim = Math.max(0, (1 - distance / maxDistance) * 100)
  return Math.round(sim)
}

// ==================== 引擎主体 ====================

const fbtiEngine = {

  /**
   * 获取随机抽取的题目（每次测试 QUESTION_COUNT 道题）
   * 抽取策略：
   *   - 2道隐藏题(H1/H2) 必须包含（用于 DRUNK 彩蛋检测）
   *   - 其余从30道常规题中随机抽取，确保每个维度至少覆盖1道
   *   - 23题时：15维度全覆盖(各1题=15题) + 额外6题随机补充
   * @returns {Array} 随机抽取的题目数组
   */
  getQuestions() {
    // 1. 分离隐藏题和常规题
    var hiddenQuestions = []
    var normalQuestions = []
    for (var idx = 0; idx < allQuestions.length; idx++) {
      var q = allQuestions[idx]
      if (q.isHidden) {
        hiddenQuestions.push({ sourceIdx: idx, question: q })
      } else {
        normalQuestions.push({ sourceIdx: idx, question: q })
      }
    }

    // 2. 计算需要抽取的常规题数量
    var normalCount = QUESTION_COUNT - Math.min(hiddenQuestions.length, MIN_HIDDEN_COUNT)
    
    // 3. 按维度分组常规题（确保抽样均衡）
    var dimGroups = {}
    for (var i = 0; i < normalQuestions.length; i++) {
      var item = normalQuestions[i]
      var dim = item.question.dimension
      if (!dimGroups[dim]) {
        dimGroups[dim] = []
      }
      dimGroups[dim].push(item)
    }

    // 4. 智能抽取：每个维度至少抽1道题，剩余名额按比例分配
    var selectedNormals = []
    var dimKeys = Object.keys(dimGroups)
    var dimsCount = dimKeys.length
    
    // 先每个维度抽1道（保证15维度全覆盖）
    for (var d = 0; d < dimKeys.length; d++) {
      var group = dimGroups[dimKeys[d]]
      var randomIdx = Math.floor(Math.random() * group.length)
      selectedNormals.push(group[randomIdx])
      // 从组中移除已选题目（避免重复）
      group.splice(randomIdx, 1)
    }

    // 剩余名额从剩余题目中随机抽取（补充到目标数量）
    var remaining = normalCount - selectedNormals.length
    if (remaining > 0) {
      // 收集所有未选的常规题
      var pool = []
      for (var k = 0; k < dimKeys.length; k++) {
        pool = pool.concat(dimGroups[dimKeys[k]])
      }
      
      // Fisher-Yates 洗牌算法随机抽取
      for (var j = pool.length - 1; j > 0; j--) {
        var swapIdx = Math.floor(Math.random() * (j + 1))
        var temp = pool[j]
        pool[j] = pool[swapIdx]
        pool[swapIdx] = temp
      }
      
      // 取前 remaining 个
      for (var r = 0; r < remaining && r < pool.length; r++) {
        selectedNormals.push(pool[r])
      }
    }

    // 5. 合并结果：常规题 + 隐藏题
    var resultItems = selectedNormals.concat(hiddenQuestions)

    // 6. Fisher-Yates 洗牌打乱最终顺序
    for (var n = resultItems.length - 1; n > 0; n--) {
      var randPos = Math.floor(Math.random() * (n + 1))
      var tmp = resultItems[n]
      resultItems[n] = resultItems[randPos]
      resultItems[randPos] = tmp
    }

    // 7. 构建返回数组（重新编号 questionIndex）
    var result = []
    for (var m = 0; m < resultItems.length; m++) {
      var item = resultItems[m]
      var q = item.question
      var newQ = {}
      // 手动复制所有属性（不用展开运算符）
      for (var key in q) {
        if (q.hasOwnProperty(key)) {
          newQ[key] = q[key]
        }
      }
      newQ.questionIndex = item.sourceIdx  // 保留原始索引供计分使用
      newQ.displayOrder = m               // 显示顺序（从0开始）
      result.push(newQ)
    }

    console.log('[FBTI] 题目抽取完成: 总数=' + result.length + ' (常规=' + selectedNormals.length + ', 隐藏=' + hiddenQuestions.length + ')')
    return result
  },

  /**
   * 核心算法：计算 FBTI 人格结果
   * @param {Array} answers - [{ questionIndex, optionIndex }]
   * @returns {Object} 完整结果对象
   */
  calculateResult(answers) {
    // ===== Step 1: 计算15维度原始分 + 统计每维度题目数 =====
    const rawScores = {}
    const dimQuestionCounts = {}
    DIMENSIONS.forEach(d => { 
      rawScores[d] = 0
      dimQuestionCounts[d] = 0 
    })

    let drunkTrigger = { H1: false, H2: false }

    for (const ans of answers) {
      const q = allQuestions[ans.questionIndex]
      if (!q) continue

      const option = q.options[ans.optionIndex]
      if (!option) continue

      // 隐藏题单独处理
      if (q.isHidden) {
        if (q.id === 'H1' && option.value === 3) drunkTrigger.H1 = true
        if (q.id === 'H2' && option.value === 3) drunkTrigger.H2 = true
        continue
      }

      // 累加到对应维度
      const dim = q.dimension
      if (dim && rawScores[dim] !== undefined) {
        rawScores[dim] += option.value
        dimQuestionCounts[dim]++
      }
    }

    // ===== Step 2: 自适应 L/M/H 映射 =====
    const userVector = DIMENSIONS.map(d => mapRawToLMH(rawScores[d], dimQuestionCounts[d]))

    // ===== Step 3: DRUNK 彩蛋检测 =====
    if (drunkTrigger.H1 && drunkTrigger.H2) {
      const drunkProfile = allProfiles.find(p => p.code === 'DRUNK')
      return this._buildResult(drunkProfile, userVector, rawScores, answers, true)
    }

    // ===== Step 4: 曼哈顿距离最近邻匹配 =====
    let bestMatch = null
    let minDistance = Infinity

    for (const profile of allProfiles) {
      // 跳过隐藏和兜底人格
      if (profile.isHidden || profile.isDefault) continue

      let distance = 0
      for (let i = 0; i < 15; i++) {
        distance += Math.abs(userVector[i] - profile.vector[i])
      }

      if (distance < minDistance) {
        minDistance = distance
        bestMatch = profile
      }
    }

    // ===== Step 5: 兜底检测 =====
    const similarity = calcSimilarity(minDistance)
    if (similarity < 60) {
      const defaultProfile = allProfiles.find(p => p.code === 'HHHH')
      return this._buildResult(defaultProfile, userVector, rawScores, answers, false)
    }

    return this._buildResult(bestMatch, userVector, rawScores, answers, false)
  },

  /**
   * 构建完整结果对象
   */
  _buildResult(profile, userVector, rawScores, answers, isDrunk) {
    // 计算与自身模板的距离来算相似度
    let distance = 0
    for (let i = 0; i < 15; i++) {
      distance += Math.abs(userVector[i] - profile.vector[i])
    }
    const similarity = calcSimilarity(distance)

    // 构建维度详情（用于雷达图和展示）
    const dimensionDetails = DIMENSIONS.map((d, idx) => ({
      id: d,
      label: DIM_LABELS[d],
      model: d[0],              // W/E/K/S/M
      modelLabel: MODEL_LABELS[d[0]],
      raw: rawScores[d] || 0,   // 原始分
      mapped: userVector[idx],  // L=1/M=2/H=3
      levelLabel: ['L', 'M', 'H'][userVector[idx] - 1],
      levelText: ['低', '中', '高'][userVector[idx] - 1],
      templateValue: profile.vector[idx]
    }))

    // 按5大模型分组
    const modelGroups = {}
    DIMENSIONS.forEach((d, idx) => {
      const m = d[0]
      if (!modelGroups[m]) {
        modelGroups[m] = {
          model: m,
          label: MODEL_LABELS[m],
          dimensions: []
        }
      }
      modelGroups[m].dimensions.push(dimensionDetails[idx])
    })

    return {
      // 基本信息
      code: profile.code,
      name: profile.name,
      subtitle: profile.subtitle,
      badge: profile.badge,
      color: profile.color,
      emoji: profile.emoji,

      // 匹配信息
      similarity: similarity,
      isHidden: !!profile.isHidden,
      isDefault: !!profile.isDefault,
      isDrunk: isDrunk,

      // 描述
      description: profile.description,
      features: profile.features,
      goldQuote: profile.goldQuote,
      shareText: profile.shareText,

      // 向量数据（供雷达图使用）
      vector: userVector,
      templateVector: profile.vector,
      rawScores: rawScores,
      dimensionDetails: dimensionDetails,
      modelGroups: Object.values(modelGroups),

      // 原始答案
      answers: answers,
      questionsCount: answers.length
    }
  },

  /**
   * 获取维度标签映射（供页面使用）
   */
  getDimLabels() {
    return DIM_LABELS
  },

  /**
   * 获取模型标签映射
   */
  getModelLabels() {
    return MODEL_LABELS
  }
}

module.exports = fbtiEngine

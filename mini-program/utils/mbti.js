// utils/mbti.js - MBTI测试计分引擎
const { questions: allQuestions } = require('../data/mbtiQuestions')
const { results: allResults } = require('../data/mbtiResults')
const config = require('../config')

const CONFIG = {
  questionsPerTest: config.app.mbtiQuestionCount || 15,
  maxScorePerQuestion: 3,
  specialRoleThreshold: 0.80
}

const mbtiEngine = {
  /**
   * 从40题题库中随机抽取N道不重复的题目
   */
  generateQuestions() {
    const shuffled = [...allQuestions]
    // Fisher-Yates 洗牌
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, CONFIG.questionsPerTest).map((q, idx) => ({
      ...q,
      questionIndex: idx
    }))
  },

  /**
   * 计算得分并判定结果类型
   * @param {Array} answers - [{ questionIndex, optionIndex }]
   * @returns {Object} 完整结果对象
   */
  calculateResult(answers) {
    let totalScore = 0
    const typeScores = {
      general: { score: 0, count: 0, maxPossible: 0 },
      tactic: { score: 0, count: 0, maxPossible: 0 },
      data: { score: 0, count: 0, maxPossible: 0 },
      face: { score: 0, count: 0, maxPossible: 0 },
      jinx: { score: 0, count: 0, maxPossible: 0 },
      history: { score: 0, count: 0, maxPossible: 0 }
    }

    for (const answer of answers) {
      const question = allQuestions.find(q => q.index === answer.questionIndex)
      if (!question) continue
      const option = question.options[answer.optionIndex]
      if (!option) continue

      const score = option.score
      const type = question.type
      typeScores[type].score += score
      typeScores[type].count += 1
      typeScores[type].maxPossible += CONFIG.maxScorePerQuestion
      totalScore += score
    }

    const possibleTotal = answers.length * CONFIG.maxScorePerQuestion
    const percentage = possibleTotal > 0 ? (totalScore / possibleTotal) * 100 : 0

    // ===== 特殊角色双维度判定 =====
    let specialRole = null
    let bestType = null
    let highestContribution = 0

    for (const [type, stats] of Object.entries(typeScores)) {
      if (stats.count === 0) continue
      const contribution = stats.score / totalScore
      if (contribution > highestContribution) {
        highestContribution = contribution
        bestType = type
      }
    }

    if (bestType && typeScores[bestType].count > 0) {
      const scoreRate = typeScores[bestType].score / typeScores[bestType].maxPossible
      if (scoreRate >= CONFIG.specialRoleThreshold) {
        const mapping = { tactic: 'tactician', data: 'data_nerd', face: 'face_card', jinx: 'jinx_master', history: 'historian' }
        specialRole = mapping[bestType]
      }
    }

    // ===== 确定最终结果 =====
    let finalResult
    if (specialRole) {
      finalResult = allResults[specialRole]
    } else if (percentage >= 75) {
      finalResult = allResults.football_og
    } else if (percentage >= 55) {
      finalResult = allResults.fake_pro
    } else if (percentage >= 35) {
      finalResult = allResults.vibe_leader
    } else if (percentage >= 15) {
      finalResult = allResults.bandwagon_fan
    } else {
      finalResult = allResults.newbie
    }

    return {
      resultType: finalResult.name,
      resultEnName: finalResult.enName,
      resultKey: finalResult.key,
      badge: finalResult.badge,
      color: finalResult.color,
      emoji: finalResult.emoji,
      description: finalResult.description,
      features: finalResult.features,
      goldQuote: finalResult.goldQuote,
      shareText: finalResult.shareText,
      score: totalScore,
      maxScore: possibleTotal,
      percentage: Math.round(percentage),
      specialRole: specialRole,
      answers,
      typeBreakdown: typeScores
    }
  }
}

module.exports = mbtiEngine

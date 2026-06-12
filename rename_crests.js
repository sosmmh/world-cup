// rename_crests.js - 按 teams2026.js 的命名规范重命名队徽文件
// build_teams_basic.js 的 id(1~48) 对应 football-data.org 的 teamId

const fs = require('fs')
const path = require('path')

const CRESTS_DIR = path.join(__dirname, 'mini-program', 'images', 'crests')

// build_teams_basic.js 中的自定义id → football-data.org teamId 映射
// 格式: customId: { teamId, name, ext }
const idMap = {
  1:  { teamId: 769,   name: '墨西哥',     ext: '.svg' },
  2:  { teamId: 772,   name: '韩国',       ext: '.png' },
  3:  { teamId: 9396,  name: '南非',       ext: '.svg' },
  4:  { teamId: 798,   name: '捷克',       ext: '.svg' },
  5:  { teamId: 788,   name: '瑞士',       ext: '.svg' },
  6:  { teamId: 828,   name: '加拿大',     ext: '.svg' },  // 原名 canada
  7:  { teamId: 1060,  name: '波黑',       ext: '.svg' },  // 原名 bosnia
  8:  { teamId: 8030,  name: '卡塔尔',     ext: '.svg' },
  9:  { teamId: 764,   name: '巴西',       ext: '.svg' },
  10: { teamId: 792,   name: '瑞典',       ext: '.svg' },
  11: { teamId: 815,   name: '摩洛哥',     ext: '.svg' },  // 原名 morocco
  12: { teamId: 818,   name: '哥伦比亚',   ext: '.svg' },
  13: { teamId: 836,   name: '海地',       ext: '.svg' },  // 原名 haiti
  14: { teamId: 8873,  name: '苏格兰',     ext: '.svg' },
  15: { teamId: 791,   name: '厄瓜多尔',   ext: '.svg' },
  16: { teamId: 761,   name: '巴拉圭',     ext: '.svg' },
  17: { teamId: 771,   name: '美国',       ext: '.svg' },  // 原名 usa
  18: { teamId: 779,   name: '澳大利亚',   ext: '.svg' },
  19: { teamId: 803,   name: '土耳其',     ext: '.svg' },
  20: { teamId: 759,   name: '德国',       ext: '.svg' },
  21: { teamId: 787,   name: '科特迪瓦',   ext: '.svg' },
  22: { teamId: 1930,  name: '佛得角',     ext: '.svg' },  // 原名 cape_verde
  23: { teamId: 1934,  name: '民主刚果',   ext: '.svg' },  // 原名 congo_dr
  24: { teamId: 9460,  name: '库拉索',     ext: '.svg' },  // 原名 curacao
  25: { teamId: 766,   name: '日本',       ext: '.svg' },
  26: { teamId: 770,   name: '英格兰',     ext: '.svg' },
  27: { teamId: 804,   name: '塞内加尔',   ext: '.svg' },
  28: { teamId: 758,   name: '乌拉圭',     ext: '.svg' },
  29: { teamId: 765,   name: '葡萄牙',     ext: '.svg' },
  30: { teamId: 825,   name: '埃及',       ext: '.svg' },
  31: { teamId: 762,   name: '阿根廷',     ext: '.png' },
  32: { teamId: 840,   name: '伊朗',       ext: '.svg' },
  33: { teamId: 1836,  name: '巴拿马',     ext: '.svg' },
  34: { teamId: 8601,  name: '荷兰',       ext: '.svg' },
  35: { teamId: 773,   name: '法国',       ext: '.svg' },
  36: { teamId: 799,   name: '克罗地亚',   ext: '.svg' },
  37: { teamId: 801,   name: '沙特阿拉伯', ext: '.svg' },
  38: { teamId: 760,   name: '西班牙',     ext: '.svg' },
  39: { teamId: 763,   name: '加纳',       ext: '.svg' },
  40: { teamId: 8872,  name: '新西兰',     ext: '.svg' },
  41: { teamId: 778,   name: '阿尔及利亚', ext: '.svg' },
  42: { teamId: 802,   name: '突尼斯',     ext: '.svg' },
  43: { teamId: 805,   name: '比利时',     ext: '.svg' },
  44: { teamId: 8049,  name: '约旦',       ext: '.png' },
  45: { teamId: 8062,  name: '伊拉克',     ext: '.svg' },
  46: { teamId: 8070,  name: '乌兹别克斯坦',ext:'.png' },
  47: { teamId: 816,   name: '奥地利',     ext: '.svg' },
  48: { teamId: 783,   name: '挪威',       ext: '.svg' },
}

// 构建反查表: teamId -> 已下载文件路径
const existingFiles = fs.readdirSync(CRESTS_DIR)
const byTeamId = {}
existingFiles.forEach(function(f) {
  const m = f.match(/^(\d+)_(\d+)(\.\w+)$/)
  if (m) {
    byTeamId[m[2]] = f  // key=teamId, value=filename
  }
})

console.log(`📂 已有 ${existingFiles.length} 个文件\n`)
let renamed = 0
let skipped = 0

for (let customId = 1; customId <= 48; customId++) {
  const info = idMap[customId]
  if (!info) {
    console.log(`[${customId}] ⚠️ 无映射信息`)
    continue
  }

  const targetName = `${String(customId).padStart(2, '0')}_${info.teamId}${info.ext}`
  const targetPath = path.join(CRESTS_DIR, targetName)
  const sourceFile = byTeamId[String(info.teamId)]

  if (!sourceFile) {
    console.log(`[${customId}] ❌ ${info.name} (teamId:${info.teamId}) - 找不到源文件`)
    continue
  }

  const sourcePath = path.join(CRESTS_DIR, sourceFile)

  // 目标已存在且是同一个文件
  if (sourceFile === targetName) {
    console.log(`[${customId}] ✅ ${info.name}: ${targetName} (已是正确名称)`)
    skipped++
    continue
  }

  // 重命名
  try {
    // 如果目标文件已存在（来自其他重命名），先删除
    if (fs.existsSync(targetPath) && sourcePath !== targetPath) {
      fs.unlinkSync(targetPath)
    }
    fs.renameSync(sourcePath, targetPath)
    console.log(`[${customId}] ✅ ${info.name}: ${sourceFile} → ${targetName}`)
    renamed++
  } catch(e) {
    console.log(`[${customId}] ❌ ${info.name}: 重命名失败 - ${e.message}`)
  }
}

console.log(`\n========== 完成 ==========`)
console.log(`✅ 重命名: ${renamed}`)
console.log(`⏭️ 跳过: ${skipped}`)

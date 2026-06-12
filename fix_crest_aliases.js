// fix_crest_aliases.js - 为 teams2026.js 中的自定义命名创建文件副本/符号链接
const fs = require('fs')
const path = require('path')

const CRESTS_DIR = path.join(__dirname, 'mini-program', 'images', 'crests')

// teams2026.js 中的自定义名称 → 实际下载的数字ID文件名 映射
// 格式: 'custom_name': 'actual_downloaded_file'
const aliasMap = {
  '06_canada.svg':        '06_828.svg',
  '07_bosnia.svg':       '07_1060.svg',
  '11_morocco.svg':      '11_815.svg',
  '13_haiti.svg':        '13_836.svg',
  '14_814.svg':          '14_8873.svg',     // 苏格兰
  '22_cape_verde.svg':   '22_1930.svg',
  '23_congo_dr.svg':     '23_1934.svg',
  '24_curacao.svg':      '24_9460.svg',
  '27_senegal.svg':      '27_804.svg',
  '32_iran.svg':         '32_840.svg',
  '33_panama.svg':       '33_1836.svg',
  '37_saudi_arabia.svg': '37_801.svg',
  '39_ghana.svg':        '39_763.svg',
  '40_783.svg':          '48_783.svg',      // 挪威 (teams2026中id=40但实际是挪威)
  '41_algeria.svg':      '41_778.svg',
  '42_tunisia.svg':      '42_802.svg',
  '44_iraq.svg':         '45_8062.svg',
  '46_805.svg':          '43_805.svg',      // 比利时
}

let created = 0
let skipped = 0
let errors = 0

for (const [alias, actual] of Object.entries(aliasMap)) {
  const aliasPath = path.join(CRESTS_DIR, alias)
  const actualPath = path.join(CRESTS_DIR, actual)

  if (fs.existsSync(aliasPath)) {
    console.log(`⏭️  ${alias} 已存在`)
    skipped++
    continue
  }

  if (!fs.existsSync(actualPath)) {
    console.log(`❌ 源文件 ${actual} 不存在，无法创建 ${alias}`)
    errors++
    continue
  }

  try {
    fs.copyFileSync(actualPath, aliasPath)
    console.log(`✅ ${alias} ← ${actual}`)
    created++
  } catch(e) {
    console.log(`❌ 创建 ${alias} 失败: ${e.message}`)
    errors++
  }
}

console.log(`\n========== 结果 ==========`)
console.log(`✅ 创建: ${created} | ⏭️ 跳过: ${skipped} | ❌ 错误: ${errors}`)

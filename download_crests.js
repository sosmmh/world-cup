// download_crests.js - 下载2026世界杯48强队徽到本地
// 用法: node download_crests.js

const fs = require('fs')
const https = require('https')
const http = require('http')
const path = require('path')

// 读取球队数据源
const rawData = fs.readFileSync(path.join(__dirname, 'tmp_teams.json'), 'utf8').replace(/^\uFEFF/, '')
const apiData = JSON.parse(rawData)

const OUTPUT_DIR = path.join(__dirname, 'mini-program', 'images', 'crests')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log('✅ 创建目录:', OUTPUT_DIR)
}

const teams = apiData.teams
console.log(`\n📋 共 ${teams.length} 支球队，开始下载队徽...\n`)

let successCount = 0
let failCount = 0

function downloadFile(url, filePath) {
  return new Promise(function(resolve, reject) {
    const mod = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(filePath)

    mod.get(url, function(response) {
      // 处理重定向（301/302）
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`   ↳ 重定向 → ${response.headers.location}`)
        downloadFile(response.headers.location, filePath).then(resolve).catch(reject)
        return
      }

      if (response.statusCode !== 200) {
        reject(new Error('HTTP ' + response.statusCode))
        return
      }

      response.pipe(file)
      file.on('finish', function() {
        file.close()
        resolve()
      })
    }).on('error', function(err) {
      fs.unlink(filePath, function() {}) // 删除失败的部分文件
      reject(err)
    })
  })
}

async function processTeam(team, index) {
  const crestUrl = team.crest
  if (!crestUrl) {
    console.log(`[${index + 1}] ⚠️ ${team.name}: 无队徽URL`)
    return
  }

  // 根据URL确定文件扩展名
  const ext = path.extname(new URL(crestUrl).pathname) || '.svg'
  // 文件名格式: {序号}_{teamId}.{ext}
  const fileName = `${String(index + 1).padStart(2, '0')}_${team.id}${ext}`
  const filePath = path.join(OUTPUT_DIR, fileName)

  // 文件已存在则跳过
  if (fs.existsSync(filePath)) {
    console.log(`[${index + 1}] ✅ ${team.name}: 已存在 (${fileName})`)
    successCount++
    return
  }

  try {
    await downloadFile(crestUrl, filePath)
    const size = (fs.statSync(filePath).size / 1024).toFixed(1)
    console.log(`[${index + 1}] ✅ ${team.name}: ${fileName} (${size}KB)`)
    successCount++
  } catch(err) {
    console.log(`[${index + 1}] ❌ ${team.name}: ${err.message}`)
    failCount++
  }
}

async function main() {
  for (let i = 0; i < teams.length; i++) {
    await processTeam(teams[i], i)
    // 避免请求过快
    if ((i + 1) % 10 === 0) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  console.log(`\n========== 下载完成 ==========`)
  console.log(`✅ 成功: ${successCount}/${teams.length}`)
  if (failCount > 0) console.log(`❌ 失败: ${failCount}`)
  console.log(`📁 输出目录: ${OUTPUT_DIR}`)
  
  // 列出所有已下载的文件
  const files = fs.readdirSync(OUTPUT_DIR)
  console.log(`📂 共 ${files.length} 个文件`)
}

main().catch(console.error)

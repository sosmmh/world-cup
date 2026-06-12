// utils/crestMap.js - 队徽URL映射工具
// 将第三方API返回的队徽外部URL转换为小程序本地图片路径

/**
 * 外部队徽URL → 本地路径的映射表
 * key: 外部URL特征值（域名+路径片段）
 * value: 小程序内本地路径
 *
 * 使用说明：
 * 1. 将球队队徽PNG放入 /images/crests/ 目录
 * 2. 在此映射表中添加对应的 URL → 本地路径 映射
 * 3. 未匹配到的队徽会保留原始外部URL（需配置downloadFile合法域名）
 */
var crestMapping = {
  // ===== 2026世界杯48强队徽映射示例 =====
  // 格式: '外部URL关键词': '/images/crests/xxx.png'
  //
  // 可通过 fetch_and_build 等脚本批量生成完整映射
  // 以下仅为示例，实际使用时请补充完整的48强映射
}

// 反向索引：从文件名提取teamId（可选优化）
var crestCache = {}

/**
 * 根据外部队徽URL获取本地路径
 * @param {string} externalUrl - 第三方API返回的队徽URL
 * @returns {string|null} 本地路径，未找到返回null（调用方应保留原始URL）
 */
function getLocalCrestUrl(externalUrl) {
  if (!externalUrl) return null

  // 命中缓存
  if (crestCache[externalUrl]) {
    return crestCache[externalUrl]
  }

  // 精确匹配
  if (crestMapping[externalUrl]) {
    crestCache[externalUrl] = crestMapping[externalUrl]
    return crestCache[externalUrl]
  }

  // 模糊匹配：遍历映射表，检查URL是否包含key
  for (var key in crestMapping) {
    if (externalUrl.indexOf(key) > -1) {
      crestCache[externalUrl] = crestMapping[key]
      return crestMapping[key]
    }
  }

  return null
}

/**
 * 转换比赛中两队的队徽URL
 * @param {Array} matches - 比赛数组，每项含 homeTeam/awayTeam.crest
 */
function convertMatchCrests(matches) {
  if (!matches || !matches.length) return

  for (var i = 0; i < matches.length; i++) {
    var match = matches[i]

    // 兼容多种数据结构：match.homeTeam / match.home_team / match.ht
    var homeTeam = match.homeTeam || match.home_team || match.ht
    var awayTeam = match.awayTeam || match.away_team || match.at

    if (homeTeam && homeTeam.crest) {
      var localHome = getLocalCrestUrl(homeTeam.crest)
      if (localHome) homeTeam.crest = localHome
    }

    if (awayTeam && awayTeam.crest) {
      var localAway = getLocalCrestUrl(awayTeam.crest)
      if (localAway) awayTeam.crest = localAway
    }
  }
}

module.exports = {
  getLocalCrestUrl: getLocalCrestUrl,
  convertMatchCrests: convertMatchCrests,

  // 暴露映射表供外部扩展
  crestMapping: crestMapping
}

// utils/teamNameMap.js - 球队名称英→中映射 + ID转换工具
// 基于 teams2026.js 数据生成，用于赛程/积分榜等页面显示中文队名 + 跳转球队详情

const teamsData = require('../data/teams2026')

/**
 * 构建映射表
 */
var nameMap = {}      // English full name → Chinese
var tlaMap = {}       // TLA(3字母代码) → Chinese  
var idMap = {}        // 本地 team ID → 中文
var nameToIdMap = {}  // English name (API返回的name) → 本地ID (用于跳转)

for (var i = 0; i < teamsData.teamsData2026.length; i++) {
  var team = teamsData.teamsData2026[i]
  if (team.nameEn) {
    nameMap[team.nameEn] = team.name
    nameToIdMap[team.nameEn] = team.id   // 新增: 英文名→本地ID
  }
  if (team.tla) {
    tlaMap[team.tla] = team.name
  }
  if (team.id) {
    idMap[String(team.id)] = team.name
  }
}

/**
 * 根据英文信息获取中文队名
 */
function getChineseName(team) {
  if (!team) return ''
  // 淘汰赛待定队伍（id/name 均为空）
  if (!team.id && !team.name && !team.shortName) {
    return '待定'
  }
  if (typeof team === 'string') {
    return nameMap[team] || tlaMap[team] || team
  }
  if (team.name && nameMap[team.name]) {
    return nameMap[team.name]
  }
  if (team.id && idMap[String(team.id)]) {
    return idMap[String(team.id)]
  }
  if (team.shortName && tlaMap[team.shortName]) {
    return tlaMap[team.shortName]
  }
  if (team.tla && tlaMap[team.tla]) {
    return tlaMap[team.tla]
  }
  return team.name || team.shortName || ''
}

/**
 * 根据API返回的球队信息获取本地ID（用于跳转team-detail）
 * @param {Object} team - API返回的球队对象(含name/id)
 * @returns {number} 本地ID，找不到则返回原始id
 */
function getLocalTeamId(team) {
  if (!team) return 0
  // 优先用英文名匹配（最可靠）
  if (team.name && nameToIdMap[team.name]) {
    return nameToIdMap[team.name]
  }
  // 再尝试直接用ID（如果API恰好和本地一致）
  if (team.id) {
    return team.id
  }
  return 0
}

/**
 * 为赛程比赛数据批量添加中文队名 + 本地ID
 */
function enrichMatches(matches) {
  if (!matches || !matches.length) return []
  for (var i = 0; i < matches.length; i++) {
    var m = matches[i]
    if (m.homeTeam) {
      m.homeTeam.nameCn = getChineseName(m.homeTeam)
      m.homeTeam.localId = getLocalTeamId(m.homeTeam)
    }
    if (m.awayTeam) {
      m.awayTeam.nameCn = getChineseName(m.awayTeam)
      m.awayTeam.localId = getLocalTeamId(m.awayTeam)
    }
  }
  return matches
}

/**
 * 为积分榜数据批量添加中文队名 + 本地ID
 */
function enrichStandings(standings) {
  if (!standings || !standings.length) return []
  for (var i = 0; i < standings.length; i++) {
    var group = standings[i]
    if (group.table) {
      for (var j = 0; j < group.table.length; j++) {
        var row = group.table[j]
        if (row.team) {
          row.team.nameCn = getChineseName(row.team)
          row.team.localId = getLocalTeamId(row.team)
        }
      }
    }
  }
  return standings
}

module.exports = {
  getChineseName: getChineseName,
  getLocalTeamId: getLocalTeamId,
  enrichMatches: enrichMatches,
  enrichStandings: enrichStandings,
  nameMap: nameMap,
  tlaMap: tlaMap,
  idMap: idMap,
  nameToIdMap: nameToIdMap
}

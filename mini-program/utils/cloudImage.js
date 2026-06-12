// utils/cloudImage.js - 云存储图片URL解析工具
// 将 cloud:// fileID 转为可用的 http 临时链接

var _urlCache = {}   // fileID → tempUrl 缓存
var _pendingPromises = {} // 正在请求的 promise（防止重复调用）

/**
 * 将图片 URL 统一转为可直接用于 <image src> 的 http 链接
 * - cloud:// fileID  → 自动调 wx.cloud.getTempFileURL 转 https 链接
 * - http/https URL   → 直接返回
 * - 其他             → 直接返回
 * 
 * @param {string} url - 原始 URL 或 cloud fileID
 * @returns {Promise<string>} 可直接使用的 http(s) 链接
 */
function resolveImageUrl(url) {
  if (!url) return Promise.resolve('')
  
  // 已经是 http/https，直接用
  if (url.indexOf('http') === 0) return Promise.resolve(url)
  
  // emoji / 纯文本等非 URL，直接返回
  if (url.indexOf('cloud://') !== 0 && url.indexOf('/') !== 0) return Promise.resolve(url)
  
  // 本地路径（已删除 crests 目录，不应再出现）
  if (url.indexOf('/images/') === 0 || url.indexOf('images/') === 0) return Promise.resolve('')
  
  // cloud fileID → 转 temp URL
  if (_urlCache[url]) {
    return Promise.resolve(_urlCache[url])
  }
  
  if (_pendingPromises[url]) {
    return _pendingPromises[url]
  }
  
  var p = new Promise(function(resolve, reject) {
    wx.cloud.getTempFileURL({
      fileList: [url],
      success: function(res) {
        if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
          var tempUrl = res.fileList[0].tempFileURL
          _urlCache[url] = tempUrl
          resolve(tempUrl)
        } else {
          console.warn('[cloudImage] getTempFileURL 失败:', url, res)
          resolve('')
        }
        delete _pendingPromises[url]
      },
      fail: function(err) {
        console.warn('[cloudImage] getTempFileURL 异常:', url, err)
        resolve('')
        delete _pendingPromises[url]
      }
    })
  })
  
  _pendingPromises[url] = p
  return p
}

/**
 * 批量转换对象中所有包含 crest 的字段
 * 支持嵌套结构：item.crest, item.homeTeam.crest, item.awayTeam.crest, item.teamCrest 等
 * 
 * @param {Array|Object} data - 数据或数据数组
 * @param {number} [delay=0] - 批量转换时的延迟(ms)，避免并发过多
 * @returns {Promise} 转换完成后的 Promise
 */
function resolveCrestsInData(data, delay) {
  if (!data) return Promise.resolve()
  
  delay = delay || 0
  
  // 收集所有需要转换的 cloud fileID
  var items = Array.isArray(data) ? data : [data]
  var tasks = []
  
  for (var i = 0; i < items.length; i++) {
    var item = items[i]
    
    // 常见的 crest 字段位置
    var fields = ['crest', 'teamCrest', 'homeCrest', 'awayCrest']
    for (var f = 0; f < fields.length; f++) {
      if (item[fields[f]] && item[fields[f]].indexOf('cloud://') === 0) {
        tasks.push(item[fields[f]])
      }
    }
    
    // 嵌套对象中的 crest
    if (item.homeTeam && item.homeTeam.crest && item.homeTeam.crest.indexOf('cloud://') === 0) {
      tasks.push(item.homeTeam.crest)
    }
    if (item.awayTeam && item.awayTeam.crest && item.awayTeam.crest.indexOf('cloud://') === 0) {
      tasks.push(item.awayTeam.crest)
    }
    if (item.team && item.team.crest && item.team.crest.indexOf('cloud://') === 0) {
      tasks.push(item.team.crest)
    }
  }
  
  if (tasks.length === 0) return Promise.resolve()
  
  // 去重
  var uniqueTasks = []
  var seen = {}
  for (var t = 0; t < tasks.length; t++) {
    if (!seen[tasks[t]]) {
      seen[tasks[t]] = true
      uniqueTasks.push(tasks[t])
    }
  }
  
  // 批量转换（最多50个一次）
  var batch = uniqueTasks.slice(0, 50)
  
  return new Promise(function(resolve) {
    wx.cloud.getTempFileURL({
      fileList: batch,
      success: function(res) {
        var list = res.fileList || []
        for (var j = 0; j < list.length; j++) {
          if (list[j].tempFileURL) {
            _urlCache[list[j].fileID] = list[j].tempFileURL
            
            // 回写原数据中的所有引用
            replaceInData(data, list[j].fileID, list[j].tempFileURL)
          }
        }
        resolve()
      },
      fail: function(err) {
        console.warn('[cloudImage] 批量转换失败:', err)
        resolve()
      }
    })
  })
}

/**
 * 在原始数据中将所有匹配的 fileID 替换为 tempUrl
 */
function replaceInData(data, fileId, tempUrl) {
  var items = Array.isArray(data) ? data : [data]
  
  for (var i = 0; i < items.length; i++) {
    var item = items[i]
    
    var fields = ['crest', 'teamCrest', 'homeCrest', 'awayCrest']
    for (var f = 0; f < fields.length; f++) {
      if (item[fields[f]] === fileId) {
        item[fields[f]] = tempUrl
      }
    }
    
    if (item.homeTeam && item.homeTeam.crest === fileId) {
      item.homeTeam.crest = tempUrl
    }
    if (item.awayTeam && item.awayTeam.crest === fileId) {
      item.awayTeam.crest = tempUrl
    }
    if (item.team && item.team.crest === fileId) {
      item.team.crest = tempUrl
    }
  }
}

/**
 * 清除缓存（切换环境或调试时使用）
 */
function clearCache() {
  _urlCache = {}
  _pendingPromises = {}
}

module.exports = {
  resolveImageUrl: resolveImageUrl,
  resolveCrestsInData: resolveCrestsInData,
  clearCache: clearCache
}

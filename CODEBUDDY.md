# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 项目概述

世界杯装懂指南 - 面向"四年一度球迷"的微信小程序，帮助用户通过趣味内容、测试和工具快速融入球迷圈子。基于 2026 美加墨世界杯主题，覆盖48强球队及球员信息。

## 开发环境与常用命令

### 前置要求
- **微信开发者工具**：下载并安装最新版微信开发者工具
- **Node.js**：建议 v16+（用于云函数开发）
- **微信小程序 AppID**：在微信公众平台注册获取

### 本地开发
```bash
# 1. 使用微信开发者工具打开 mini-program 目录
# 2. 在开发者工具中点击"编译"即可预览和调试
# 3. 真机调试：点击"真机调试"按钮扫码预览
```

### 云函数部署（如使用 cloud 模式）
```bash
# 在微信开发者工具中：
# 1. 右键 cloudfunctions 目录 → "上传并部署：云端安装依赖"
# 2. 或使用 CLI 工具（需配置）
```

### 数据源模式切换
修改 `mini-program/config.js` 中的 `adapter` 字段：
- `mock`：本地模拟数据模式（当前默认，适合前端开发调试）
- `cloud`：云开发模式（需配置云环境ID和部署云函数）
- `http`：自建后端模式（预留，用于未来迁移到独立后端）

---

## 架构设计

### 整体架构：三层分离 + 适配器模式

项目采用经典的三层架构，通过适配器模式实现数据源的灵活切换：

```
┌─────────────────────────────────────┐
│           Pages 层 (页面)             │  12个页面，负责UI渲染和用户交互
└─────────────────┬───────────────────┘
                  │ 调用
┌─────────────────▼───────────────────┐
│        Services 层 (业务服务)          │  封装业务逻辑，调用adapters获取数据
│  footballService / userService       │  内置缓存管理（按config.js配置的过期时间）
│  teamService / toolService           │
└─────────────────┬───────────────────┘
                  │ 统一接口调用
┌─────────────────▼───────────────────┐
│       Adapters 层 (数据适配器)         │  工厂模式，根据config返回对应实例
│  cloudAdapter / httpAdapter / mock   │  所有adapter实现统一的 call(method, action, params) 接口
└─────────────────────────────────────┘
```

### 核心设计原则

**1. 数据分层策略**
- **动态数据**（赛程、比分、新闻、积分榜）：必须通过 API 实时获取，不可用本地数据。Services 层通过 adapters 调用后端，并按类型设置不同的缓存时间（见 config.js 的 cache 配置）
- **静态数据**（48强球队百科、球员资料、黑话词典20条、MBTI题目40题、梗图等）：存储在 `data/` 目录下的 JS 文件中，直接 require 使用
- **用户数据**（收藏、测试记录）：通过 `wx.getStorageSync/setStorageSync` 本地存储

**2. 适配器统一接口**
所有 adapter 必须实现 `call(functionName, action, params)` 方法，返回格式 `{ code: 0, data: {} }`。这使得 Services 层完全不关心底层是云函数、HTTP还是Mock数据。

**3. 缓存机制**
- 使用 `utils/cache.js` 统一管理本地缓存
- 每种数据类型有独立的缓存前缀和过期时间（配置在 config.js）
- 支持按前缀批量清除缓存

### 关键模块说明

#### 配置中心 (`config.js`)
项目的环境配置核心，包含：
- **adapter**：当前数据源模式（mock/cloud/http）
- **cloud**：云开发环境配置
- **apis**：第三方API密钥和地址（Football-Data.org、API-Football等）
- **cache**：各类型数据的缓存时间（分钟）
- **ad**：广告单元ID（流量主变现）
- **tracker**：埋点配置（事件采集和批量上报）

#### Services 层职责
- **footballService.js**：足球数据核心服务，封装赛程、实时比分、积分榜、新闻、射手榜、球员/球队实时数据的获取逻辑，每个方法都内置缓存检查
- **userService.js**：用户相关服务（收藏管理、测试记录）
- **teamService.js**：球队百科服务（48强数据查询）
- **toolService.js**：工具箱服务（混合模式：本地静态内容 + 实时API数据）

#### Pages 层结构（12个页面）
**TabBar 页面（5个）**：
- `index`：首页 - 热点 + 今日赛程 + 实时比分 + 黑话推荐
- `schedule`：赛程赛果 - 完整赛程 + 积分榜 + 筛选
- `teams`：球队百科 - 48强列表 + 搜索 + 分组展示
- `tools`：速成工具箱 - 6大工具入口（黑话词典、赛后话术、梗图、绰号、越位规则、恩怨录）
- `profile`：个人中心 - 收藏记录 + 测试历史

**子页面（7个）**：
- `team-detail`：球队详情 - 信息 + 近期赛程 + 球员列表 + 恩怨录
- `player-detail`：球员详情 - 信息 + 近期表现 + 收藏功能
- `news`：新闻资讯 - 列表 + 分类筛选
- `mbti`：球迷MBTI测试 - 15题随机抽取 + 实时计分
- `mbti-result`：测试结果展示 + 社交分享
- `tool-detail`：工具详情页 - 具体工具的内容展示

#### Data 层（静态数据文件）
所有静态知识内容以JS模块形式组织：
- `slangData.js`：足球黑话词典（20条）
- `memeData.js`：经典梗图（8个）
- `quotesData.js`：赛后万能话术（24条）
- `nicknamesData.js`：球星绰号（12个）
- `offsideData.js`：越位规则图解（4种场景）
- `rivalryData.js`：球队恩怨录（6组经典对决）
- `mbtiQuestions.js`：MBTI测试题库（40题，每次随机抽取15题）
- `mbtiResults.js`：10种球迷类型的详细结果描述
- `mockData.js`：Mock适配器使用的完整模拟数据集

#### Utils 层（工具函数）
- `cache.js`：统一缓存管理器（get/set/remove/clearByPrefix，支持过期检查）
- `request.js`：请求封装（错误处理、重试机制、loading状态管理）[待完善]
- `share.js`：分享工具（生成分享卡片、文案、海报）[待完善]
- `mbti.js`：MBTI计分引擎（抽题算法、评分逻辑、结果判定）[待完善]
- `tracker.js`：埋点上报工具（事件采集、批量上传）[待完善]

---

## 开发注意事项

### 添加新页面的步骤
1. 在 `pages/` 目录下创建新页面文件夹（包含 .js/.json/.wxml/.wxss 四个文件）
2. 在 `app.json` 的 `pages` 数组中注册页面路径
3. 如需添加到 TabBar，同步更新 `app.json` 的 `tabBar.list` 配置

### 添加新的业务服务
1. 在 `services/` 目录创建新的 service 文件
2. Service 中通过 `const { getAdapter } = require('../adapters')` 获取适配器实例
3. 使用 `adapter.call('functionName', 'action', params)` 调用后端
4. 根据需要在 `config.js` 的 cache 配置中添加该服务的缓存时间

### 切换数据源进行测试
当前默认使用 mock 模式开发。切换到真实数据：
1. 修改 `config.js` 的 `adapter` 为 `'cloud'`
2. 在 `app.js` 中取消注释云开发初始化代码
3. 部署对应的云函数到微信云开发环境
4. 更新 `config.js` 中的第三方 API Key 和云环境ID

### 数据缓存策略
- **热点新闻**：5分钟缓存（变化快）
- **实时比分**：1分钟缓存（高频刷新）
- **赛程/积分榜**：10-15分钟缓存
- **球队/球员基本信息**：1440分钟（24小时）缓存
- Services 层提供 `clearCache(type)` 方法支持手动清除指定类型缓存

### 项目文档
- `PRD-V2.md`：产品需求文档 V2版（完整功能规格）
- `2026-05-25-world-cup-tech-design.md`：技术设计方案（架构细节、数据库设计、接口定义）
- `PRD.md`：产品需求文档初版

### 待完善模块
以下标记为 [待完善] 的模块需要后续实现：
- 云函数实际部署（目前只有框架代码）
- 第三方API对接（需要申请 API Key）
- 广告组件集成（需要开通流量主资格）
- 完整的埋点系统
- MBTI计分引擎和分享功能的完整实现

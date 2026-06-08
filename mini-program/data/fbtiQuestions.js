// data/fbtiQuestions.js - FBTI 2.0 题库 (32题)
// 架构：5大模型 × 3维度 × 2题 = 30常规题 + 2隐藏题(H) = 32题
//
// 模型说明：
//   W = 观赛方式 (Watching)   : W1观看场景 / W2投入程度 / W3时间偏好
//   E = 情感模式 (Emotion)    : E1主队绑定 / E2情绪反应 / E3胜负观
//   K = 知识储备 (Knowledge)  : K1规则理解 / K2球员认知 / K3战术水平
//   S = 社交行为 (Social)      : S1表达方式 / S2互动风格 / S3身份展示
//   M = 消费决策 (Money)      : M1投入意愿 / M2消费方向 / M3价值判断
//   H = 隐藏题 (Hidden)       : 彩蛋触发专用，不参与常规计分
//
// 计分规则：A=1分(低) / B=2分(中) / C=3分(高)
// 原始分范围：每维度2~6分 → 映射为 L(低)/M(中)/H(高)

const questions = [
  // ==================== W 观赛方式 (6题) ====================

  // W1 观看场景 — 在哪看球
  {
    id: 'W1a', model: 'W', dimension: 'W1',
    question: '看世界杯比赛，你首选的姿势是？',
    options: [
      { label: 'A', text: '窝在沙发上抱着零食看直播，舒服最重要', value: 1 },
      { label: 'B', text: '约上三五好友去酒吧/餐厅，有氛围才过瘾', value: 2 },
      { label: 'C', text: '能去现场绝不去别的地方！机票酒店提前三个月订好', value: 3 }
    ]
  },
  {
    id: 'W1b', model: 'W', dimension: 'W1',
    question: '朋友喊你一起去现场看球，你的第一反应是？',
    options: [
      { label: 'A', text: '太远了/太贵了/没时间...找理由婉拒', value: 1 },
      { label: 'B', text: '看看票价和行程，合适就去', value: 2 },
      { label: 'C', text: '票呢？链接发我！我已经在看机票了', value: 3 }
    ]
  },

  // W2 投入程度 — 怎么看
  {
    id: 'W2a', model: 'W', dimension: 'W2',
    question: '一场90分钟的比赛，你通常的状态是？',
    options: [
      { label: 'A', text: '开着当背景音，偶尔抬头看看比分', value: 1 },
      { label: 'B', text: '认真看，但中途会刷刷手机、回个消息', value: 2 },
      { label: 'C', text: '全程高度紧张，连上厕所都算好时间冲出去', value: 3 }
    ]
  },
  {
    id: 'W2b', model: 'W', dimension: 'W2',
    question: '比赛中场休息15分钟你会做什么？',
    options: [
      { label: 'A', text: '切台看别的节目，差点忘了还有下半场', value: 1 },
      { label: 'B', text: '刷刷社交媒体看看大家的评论和段子', value: 2 },
      { label: 'C', text: '打开数据面板分析上半场的xG和热图，顺便预测下半场走势', value: 3 }
    ]
  },

  // W3 时间偏好 — 何时看
  {
    id: 'W3a', model: 'W', dimension: 'W3',
    question: '凌晨3点的世界杯小组赛（非主队），你起得来吗？',
    options: [
      { label: 'A', text: '不可能，睡觉大于一切，明早看热搜就行', value: 1 },
      { label: 'B', text: '设个闹钟试试，但大概率按掉继续睡', value: 2 },
      { label: 'C', text: '三个闹钟+冰美式，这种比赛才是真正的球迷试金石', value: 3 }
    ]
  },
  {
    id: 'W3b', model: 'W', dimension: 'W3',
    question: '如果错过了比赛的直播，你会怎么补？',
    options: [
      { label: 'A', text: '不补了，知道谁赢就够了', value: 1 },
      { label: 'B', text: '看个5分钟集锦，了解一下精彩瞬间', value: 2 },
      { label: 'C', text: '必须找完整录像看，跳过任何一秒都是对足球的不尊重', value: 3 }
    ]
  },

  // ==================== E 情感模式 (6题) ====================

  // E1 主队绑定 — 爱多深
  {
    id: 'E1a', model: 'E', dimension: 'E1',
    question: '你支持的主队输了关键比赛（比如世界杯淘汰赛），你的反应是？',
    options: [
      { label: 'A', text: '"哦输了啊"然后该干嘛干嘛', value: 1 },
      { label: 'B', text: '心情不太好，不想说话，刷手机转移注意力', value: 2 },
      { label: 'C', text: '整个人都不好了，三天吃不下饭，朋友圈开启仅自己可见模式', value: 3 }
    ]
  },
  {
    id: 'E1b', model: 'E', dimension: 'E1',
    question: '有人当面说你主队的球星"被高估了"，你会？',
    options: [
      { label: 'A', text: '"嗯可能吧"，毕竟我也不确定', value: 1 },
      { label: 'B', text: '心里不舒服但还是保持微笑，暗自生气', value: 2 },
      { label: 'C', text: '直接开怼，从数据到荣誉一条龙输出，对方必须道歉', value: 3 }
    ]
  },

  // E2 情绪反应 — 反应多大
  {
    id: 'E2a', model: 'E', dimension: 'E2',
    question: '主队在伤停补时阶段绝杀进球，你的表现是？',
    options: [
      { label: 'A', text: '"哦不错哦"，嘴角微微上扬', value: 1 },
      { label: 'B', text: '从沙发上蹦起来吼了一嗓子，吓到了旁边的猫', value: 2 },
      { label: 'C', text: '当场痛哭流涕/跪地磕头/给远方的朋友疯狂弹语音', value: 3 }
    ]
  },
  {
    id: 'E2b', model: 'E', dimension: 'E2',
    question: '主队被判了争议点球或者VAR取消进球，你会？',
    options: [
      { label: 'A', text: '"裁判也是人，总会犯错"', value: 1 },
      { label: 'B', text: '疯狂吐槽裁判，连他祖宗十八代都问候一遍', value: 2 },
      { label: 'C', text: '气到手抖，在社交媒体上写小作文控诉，发誓再也不看了（下次照看）', value: 3 }
    ]
  },

  // E3 胜负观 — 输赢观
  {
    id: 'E3a', model: 'E', dimension: 'E3',
    question: '主队踢了一场0:0的闷平，但防守非常出色，你觉得？',
    options: [
      { label: 'A', text: '无聊死了，白熬夜', value: 1 },
      { label: 'B', text: '有点遗憾吧，但能接受', value: 2 },
      { label: 'C', text: '这场防守简直是艺术品！零封对手比进球更让人满足！', value: 3 }
    ]
  },
  {
    id: 'E3b', model: 'E', dimension: 'E3',
    question: '如果主队赢了但踢得很丑陋（摆大巴靠反击偷一个），你的态度是？',
    options: [
      { label: 'A', text: '赢了就行，过程不重要', value: 1 },
      { label: 'B', text: '虽然赢了但心里不太舒服，希望能踢好看点', value: 2 },
      { label: 'C', text: '这种胜利让我感到羞耻！我宁愿漂亮地输也不要丑陋地赢！', value: 3 }
    ]
  },

  // ==================== K 知识储备 (6题) ====================

  // K1 规则理解 — 懂不懂规则
  {
    id: 'K1a', model: 'K', dimension: 'K1',
    question: '新手问你"越位到底怎么判"，你怎么解释？',
    options: [
      { label: 'A', text: '"就是跑太快了呗，裁判会吹的"', value: 1 },
      { label: 'B', text: '"传球那瞬间比倒数第二个防守球员靠近对方球门就算越位"', value: 2 },
      { label: 'C', text: '掏出纸笔画图讲解：进攻方球员、传球瞬间、球门线、防守第二人...全套科普', value: 3 }
    ]
  },
  {
    id: 'K1b', model: 'K', dimension: 'K1',
    question: '关于VAR（视频助理裁判），你的了解程度是？',
    options: [
      { label: 'A', text: 'VAR？新签的那个外援吗？', value: 1 },
      { label: 'B', text: '就是看回放帮助裁判做决定的技术嘛', value: 2 },
      { label: 'C', text: '清楚VAR介入的四种情形（进球/点球/红牌/认错人），以及半自动越位技术原理', value: 3 }
    ]
  },

  // K2 球员认知 — 认不认人
  {
    id: 'K2a', model: 'K', dimension: 'K2',
    question: '给你一张欧洲二流联赛球员的照片，你能认出来的概率是？',
    options: [
      { label: 'A', text: '除了梅西C罗姆巴佩基本全不认识', value: 1 },
      { label: 'B', text: '五大联赛主力球员大概能认出六七成', value: 2 },
      { label: 'C', text: '英冠/德乙/葡超的主力我都能叫出名字，转会窗还关注青训新星', value: 3 }
    ]
  },
  {
    id: 'K2b', model: 'K', dimension: 'K2',
    question: '朋友聊到一个球员的"德转身价"，你的反应是？',
    options: [
      { label: 'A', text: '德转是什么？德国转会的意思吗？', value: 1 },
      { label: 'B', text: '知道是德国市场做的球员估值网站', value: 2 },
      { label: 'C', text: '每周更新必看！还能说出这名球员近四期的涨跌趋势和原因', value: 3 }
    ]
  },

  // K3 战术水平 — 战术理解
  {
    id: 'K3a', model: 'K', dimension: 'K3',
    question: '听到解说员说"伪九号"、"后腰前插"、"内收型边卫"这些词，你的状态是？',
    options: [
      { label: 'A', text: '感觉很高深，默默低头继续吃瓜', value: 1 },
      { label: 'B', text: '大概能听懂一些，但说不清楚具体含义', value: 2 },
      { label: 'C', text: '每个术语都能举出场上的实际例子，还能评价教练用得好不好', value: 3 }
    ]
  },
  {
    id: 'K3b', model: 'K', dimension: 'K3',
    question: '如果你是主教练，中场休息时需要调整战术，你会怎么做？',
    options: [
      { label: 'A', text: '"大家加油！"然后继续刷手机', value: 1 },
      { label: 'B', text: '"多传少丢，注意防守"，说些正确的废话', value: 2 },
      { label: 'C', text: '拿出战术板："上半场我们左路被打穿是因为对方右内切针对了我们三中卫的肋部空档..."', value: 3 }
    ]
  },

  // ==================== S 社交行为 (6题) ====================

  // S1 表达方式 — 怎么说
  {
    id: 'S1a', model: 'S', dimension: 'S1',
    question: '看完一场精彩的比赛，你最想做的事情是？',
    options: [
      { label: 'A', text: '内心感慨一下就过去了', value: 1 },
      { label: 'B', text: '发个朋友圈配个表情包，简单记录一下', value: 2 },
      { label: 'C', text: '写千字长文分析比赛，发到所有足球群引发讨论', value: 3 }
    ]
  },
  {
    id: 'S1b', model: 'S', dimension: 'S1',
    question: '有人在你面前说了一些明显错误的足球观点（比如"C罗去过皇马吗？"），你会？',
    options: [
      { label: 'A', text: '笑笑不说话，避免尴尬', value: 1 },
      { label: 'B', text: '委婉纠正一下："其实C罗是在皇马达到巅峰的..."', value: 2 },
      { label: 'C', text: '当场科普20分钟，从C罗的曼联一期讲到利雅得胜利，对方想跑都跑不掉', value: 3 }
    ]
  },

  // S2 互动风格 — 和谁互动
  {
    id: 'S2a', model: 'S', dimension: 'S2',
    question: '你通常和谁一起讨论足球？',
    options: [
      { label: 'A', text: '几乎不主动讨论，别人问我才应付两句', value: 1 },
      { label: 'B', text: '和几个好朋友偶尔聊聊，主要在群里面', value: 2 },
      { label: 'C', text: '混迹十几个球迷群/论坛/贴吧，每天高强度输出观点', value: 3 }
    ]
  },
  {
    id: 'S2b', model: 'S', dimension: 'S2',
    question: '遇到和你主队对立的死忠粉在网上争论，你会？',
    options: [
      { label: 'A', text: '划走，不参与任何争吵', value: 1 },
      { label: 'B', text: '礼貌地表达自己的观点，不卑不亢', value: 2 },
      { label: 'C', text: '战斗到天亮！拿出数据、历史战绩、荣誉列表全面碾压对方', value: 3 }
    ]
  },

  // S3 身份展示 — 展示身份
  {
    id: 'S3a', model: 'S', dimension: 'S3',
    question: '你的微信头像/朋友圈背景和足球的关系是？',
    options: [
      { label: 'A', text: '完全没有关系，用自拍或风景', value: 1 },
      { label: 'B', text: '大赛期间会临时换成球队相关的', value: 2 },
      { label: 'C', text: '常年使用主队元素，我的身份标签就是要让所有人知道我是谁家的粉丝', value: 3 }
    ]
  },
  {
    id: 'S3b', model: 'S', dimension: 'S3',
    question: '日常穿着方面，你有多经常穿足球相关的东西出门？',
    options: [
      { label: 'A', text: '从来不穿球衣出门，太奇怪了', value: 1 },
      { label: 'B', text: '看球那天或者去球场的时候会穿', value: 2 },
      { label: 'C', text: '球衣就是我的日常穿搭！主场球衣客场球衣复古球衣轮着穿！', value: 3 }
    ]
  },

  // ==================== M 消费决策 (6题) ====================

  // M1 投入意愿 — 花多少钱
  {
    id: 'M1a', model: 'M', dimension: 'M1',
    question: '一张世界杯决赛的门票（假设官方价3000元），你会买吗？',
    options: [
      { label: 'A', text: '3000？！够我吃好多顿火锅了，绝对不买', value: 1 },
      { label: 'B', text: '犹豫很久，可能最后咬牙买一张最便宜的', value: 2 },
      { label: 'C', text: '买！不仅要买还要买最好的位置！人生能有几次世界杯决赛！', value: 3 }
    ]
  },
  {
    id: 'M1b', model: 'M', dimension: 'M1',
    question: '一年在足球上的总花费（球衣、会员、票务、周边等）大约占你收入的？',
    options: [
      { label: 'A', text: '几乎为零，免费看看直播就很好了', value: 1 },
      { label: 'B', text: '偶尔买一两件球衣或付个会员，不超过收入的3%', value: 2 },
      { label: 'C', text: '10%以上？没仔细算过，反正看到想买的就买了', value: 3 }
    ]
  },

  // M2 消费方向 — 花在哪
  {
    id: 'M2a', model: 'M', dimension: 'M2',
    question: '如果给你1000元的足球预算，你最优先花在哪里？',
    options: [
      { label: 'A', text: '存下来，这钱不如买奶茶喝', value: 1 },
      { label: 'B', text: '买一件正版球衣或者球鞋', value: 2 },
      { label: 'C', text: '买季卡/付费会员+去现场看一场比赛+买本足球杂志', value: 3 }
    ]
  },
  {
    id: 'M2b', model: 'M', dimension: 'M2',
    question: '你拥有的正版足球装备大概有多少？',
    options: [
      { label: 'A', text: '一件都没有，淘宝几十块的不算吧', value: 1 },
      { label: 'B', text: '两三件球衣，一双球鞋的样子', value: 2 },
      { label: 'C', text: '衣柜专门有一排放足球装备，球衣两位数、球鞋四五双、围巾一堆...', value: 3 }
    ]
  },

  // M3 价值判断 — 什么值
  {
    id: 'M3a', model: 'M', dimension: 'M3',
    question: '俱乐部推出新赛季主场球衣售价899元，你的想法是？',
    options: [
      { label: 'A', text: '抢钱吧这是？普通T恤才多少钱', value: 1 },
      { label: 'B', text: '确实贵，但喜欢的话咬咬牙买一件', value: 2 },
      { label: 'C', text: '这个价格很正常啊，面料科技+设计+品牌溢价，而且收入的一部分支持球队运营', value: 3 }
    ]
  },
  {
    id: 'M3b', model: 'M', dimension: 'M3',
    question: '视频网站推出"世界杯高清包"98元/月，你买不买？',
    options: [
      { label: 'A', text: '免费的央视/抖音不够看吗？为什么要花钱', value: 1 },
      { label: 'B', text: '看看评测，如果画质和解说确实更好再考虑', value: 2 },
      { label: 'C', text: '必须买！多角度回放+无广告+数据面板，这才是看球的正确打开方式', value: 3 }
    ]
  },

  // ==================== H 隐藏题 (2题) ====================
  // 这两题用于触发 DRUNK 隐藏人格
  // 判定条件：H1选C 且 H2选C → 触发 DRUNK

  {
    id: 'H1', model: 'H', dimension: 'H1',
    isHidden: true,
    question: '世界杯期间你的标准"看球套餐"是？',
    options: [
      { label: 'A', text: '快乐水+薯片，经典搭配不出错', value: 1 },
      { label: 'B', text: '几瓶啤酒+烧烤外卖，有氛围就行', value: 2 },
      { label: 'C', text: '白酒兑红牛+花生米，一口闷完大喊"好球！"', value: 3 }
    ]
  },
  {
    id: 'H2', model: 'H', dimension: 'H2',
    isHidden: true,
    question: '比赛结束后（尤其是赢了之后），你的状态通常是？',
    options: [
      { label: 'A', text: '洗洗睡了，明天还要上班/上学', value: 1 },
      { label: 'B', text: '意犹未尽，和朋友再多聊一会儿', value: 2 },
      { label: 'C', text: '已经断片了，第二天醒来发现自己发了50条朋友圈还@了所有人', value: 3 }
    ]
  }
]

module.exports = { questions }

// data/fbtiQuestions.js - FBTI 2.0 题库 (32题) V5 — 分值打乱版
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
// ⚠️ V5 核心设计 — 分值随机化：
//   每道题的 A/B/C 对应的 1/2/3 分值是打乱的！
//   三种模式轮换使用：
//     模式①: A=1 B=2 C=3  （标准）
//     模式②: A=2 B=3 C=1  （循环上移：原A→中,原B→高,原低→C）
//     模式③: A=3 B=1 C=2  （循环下移：原A→高,原低→B,原中→C）
//   
//   目的：即使用户习惯性选某个固定位置（比如总是选B），
//         实际得分也会在1/2/3之间自然分散，避免全M→CTRL的问题

const questions = [
  // ==================== W 观赛方式 (6题) ====================

  // W1a [模式③ A=3 B=1 C=2]
  {
    id: 'W1a', model: 'W', dimension: 'W1',
    question: '世界杯期间你理想中的看球环境是？',
    options: [
      { label: 'A', text: '人越多越好！酒吧、广场、户外大屏，要的就是那种氛围感', value: 3 },
      { label: 'B', text: '一个人安安静静地看，想喊就喊，不想喊就发呆，没人打扰', value: 1 },
      { label: 'C', text: '叫上三五好友一起，有说有笑，进球了一起吼', value: 2 }
    ]
  },
  // W1b [模式② A=2 B=3 C=1]
  {
    id: 'W1b', model: 'W', dimension: 'W1',
    question: '朋友突然喊你今晚一起去现场看球，你第一反应？',
    options: [
      { label: 'A', text: '有点心动，但得想想明天有没有事', value: 2 },
      { label: 'B', text: '走起啊！还等什么，这种机会不是天天有的', value: 3 },
      { label: 'C', text: '"现在？"先看看自己有没有空再说', value: 1 }
    ]
  },

  // W2a [模式② A=2 B=3 C=1]
  {
    id: 'W2a', model: 'W', dimension: 'W2',
    question: '90分钟比赛进行中，你最常见的状态是？',
    options: [
      { label: 'A', text: '大部分时间在看电视，中场休息才拿起手机', value: 2 },
      { label: 'B', text: '眼睛基本离不开屏幕，连球员换人都注意到了', value: 3 },
      { label: 'C', text: '手机和电视同时开着，比赛看着顺手刷刷别的', value: 1 }
    ]
  },
  // W2b [模式③ A=3 B=1 C=2]
  {
    id: 'W2b', model: 'W', dimension: 'W2',
    question: '比赛中场休息15分钟你会做什么？',
    options: [
      { label: 'A', text: '打开数据面板或者战术图，研究一下上半场双方的表现', value: 3 },
      { label: 'B', text: '去倒杯水、上个厕所、回两条消息，顺便活动一下', value: 1 },
      { label: 'C', text: '刷刷手机看看大家怎么聊这场比赛', value: 2 }
    ]
  },

  // W3a [模式① A=1 B=2 C=3]
  {
    id: 'W3a', model: 'W', dimension: 'W3',
    question: '一场凌晨三点的小组赛（不是那种焦点战），你怎么安排？',
    options: [
      { label: 'A', text: '肯定不熬了，第二天看结果就行', value: 1 },
      { label: 'B', text: '设个闹钟试试，起得来就看，起不来算了', value: 2 },
      { label: 'C', text: '提前睡一会儿，定好闹钟必须起来看', value: 3 }
    ]
  },
  // W3b [模式③ A=3 B=1 C=2]
  {
    id: 'W3b', model: 'W', dimension: 'W3',
    question: '如果一场重要比赛你没看成直播，之后会补吗？',
    options: [
      { label: 'A', text: '能找到完整录像的话还是想从头看一遍', value: 3 },
      { label: 'B', text: '看看比分和集锦就够了，知道发生了什么就行', value: 1 },
      { label: 'C', text: '找找精彩片段看看，重点部分不能错过', value: 2 }
    ]
  },

  // ==================== E 情感模式 (6题) ====================

  // E1a [模式② A=2 B=3 C=1]
  {
    id: 'E1a', model: 'E', dimension: 'E1',
    question: '你喜欢的球队输了一场关键比赛，接下来你的状态通常是？',
    options: [
      { label: 'A', text: '心情不太好，不太想说话，缓一两个小时才能恢复', value: 2 },
      { label: 'B', text: '整个人都不太对劲，可能还要去社交网络上发泄一下', value: 3 },
      { label: 'C', text: '叹口气，然后该干嘛干嘛，生活还得继续嘛', value: 1 }
    ]
  },
  // E1b [模式① A=1 B=2 C=3]
  {
    id: 'E1b', model: 'E', dimension: 'E1',
    question: '有人当面吐槽你喜欢的球队或球星，你的反应更接近？',
    options: [
      { label: 'A', text: '笑笑不说话，每个人有每个人的看法嘛', value: 1 },
      { label: 'B', text: '心里不太舒服但表面上不会表现出来', value: 2 },
      { label: 'C', text: '忍不住要反驳几句，至少表达一下不同意见', value: 3 }
    ]
  },

  // E2a [模式③ A=3 B=1 C=2]
  {
    id: 'E2a', model: 'E', dimension: 'E2',
    question: '你支持的球队在最后一分钟进了一个绝杀球，那一刻你？',
    options: [
      { label: 'A', text: '整个人跳起来了，还在群里疯狂发消息或者打电话给朋友', value: 3 },
      { label: 'B', text: '内心松了口气，嘴角稍微上扬了一下', value: 1 },
      { label: 'C', text: '直接从座位上站起来了，忍不住发出声音', value: 2 }
    ]
  },
  // E2b [模式② A=2 B=3 C=1]
  {
    id: 'E2b', model: 'E', dimension: 'E2',
    question: '裁判判了一个对你方很不利的争议点球，你的第一反应是？',
    options: [
      { label: 'A', text: '开始大声抱怨，对着电视一顿输出', value: 2 },
      { label: 'B', text: '气得不行，可能还会发朋友圈或者在群里骂两句', value: 3 },
      { label: 'C', text: '皱皱眉，心想这裁判水平不行啊', value: 1 }
    ]
  },

  // E3a [模式③ A=3 B=1 C=2]
  {
    id: 'E3a', model: 'E', dimension: 'E3',
    question: '你主队踢了一场0比0的平局，全场防守很稳但进攻乏力，你感觉？',
    options: [
      { label: 'A', text: '这场防守真的不错！零封对手本身就是一种成功', value: 3 },
      { label: 'B', text: '挺无聊的一场比赛，白花了时间', value: 1 },
      { label: 'C', text: '有点遗憾吧，毕竟没进球，但没输也还行', value: 2 }
    ]
  },
  // E3b [模式② A=2 B=3 C=1]
  {
    id: 'E3b', model: 'E', dimension: 'E3',
    question: '如果赢了比赛但是踢得很丑陋（全靠防守反击偷一个），你的感受是？',
    options: [
      { label: 'A', text: '虽然赢了但总觉得差点意思，踢好看点就好了', value: 2 },
      { label: 'B', text: '说实话...这种赢法让我有点别扭，我宁愿踢得漂亮一点输了', value: 3 },
      { label: 'C', text: '赢了就好啊，过程不重要，三分才是实实在在的', value: 1 }
    ]
  },

  // ==================== K 知识储备 (6题) ====================

  // K1a [模式① A=1 B=2 C=3]
  {
    id: 'K1a', model: 'K', dimension: 'K1',
    question: '有个朋友问你："越位到底是什么意思呀？"你会怎么回答？',
    options: [
      { label: 'A', text: '"呃...就是跑太快了被裁判吹掉了吧"', value: 1 },
      { label: 'B', text: '"简单说就是传球瞬间你比倒数第二个对方球员更靠近球门"', value: 2 },
      { label: 'C', text: '掏出纸笔画个图，从进攻球员、传球瞬间、防守位置讲起...', value: 3 }
    ]
  },
  // K1b [模式③ A=3 B=1 C=2]
  {
    id: 'K1b', model: 'K', dimension: 'K1',
    question: '"VAR"这个词你在足球解说里听过吗，大概知道是什么吗？',
    options: [
      { label: 'A', text: '清楚它什么时候能用、什么情况不能介入，还能说出几种常见场景', value: 3 },
      { label: 'B', text: '好像听过但不记得是什么了，是新来的外援吗？', value: 1 },
      { label: 'C', text: '知道是用视频回放来帮裁判做判断的技术', value: 2 }
    ]
  },

  // K2a [模式② A=2 B=3 C=1]
  {
    id: 'K2a', model: 'K', dimension: 'K2',
    question: '给你看一张五大联赛普通首发球员的照片（不是顶级球星），你觉得能认出来的概率多大？',
    options: [
      { label: 'A', text: '主流球队的球员应该能认出一多半吧', value: 2 },
      { label: 'B', text: '大部分都能叫出名字，甚至一些替补和年轻球员也眼熟', value: 3 },
      { label: 'C', text: '除了那几个特别有名的，其他的基本全靠猜', value: 1 }
    ]
  },
  // K2b [模式① A=1 B=2 C=3]
  {
    id: 'K2b', model: 'K', dimension: 'K2',
    question: '朋友聊天时提到某个球员的"德转身价"，你的反应是？',
    options: [
      { label: 'A', text: '德转？德国转会市场？听是听过但不太了解具体干嘛的', value: 1 },
      { label: 'B', text: '哦那个德国的球员估值网站，经常看到有人引用上面的数据', value: 2 },
      { label: 'C', text: '我自己也会去看，还能说出这名球员最近几期的价格变化', value: 3 }
    ]
  },

  // K3a [模式② A=2 B=3 C=1]
  {
    id: 'K3a', model: 'K', dimension: 'K3',
    question: '听到解说员说"伪九号""后腰前插""内收边卫"这些词的时候，你的感受是？',
    options: [
      { label: 'A', text: '能听懂一部分，但让我解释的话可能说不清楚', value: 2 },
      { label: 'B', text: '每个词都很熟悉，脑子里已经有画面了', value: 3 },
      { label: 'C', text: '感觉好专业，大概能猜到是在说阵型和跑位吧', value: 1 }
    ]
  },
  // K3b [模式③ A=3 B=1 C=2]
  {
    id: 'K3b', model: 'K', dimension: 'K3',
    question: '假设你是教练，中场休息时要跟队员讲调整战术，你会说什么？',
    options: [
      { label: 'A', text: '"上半场左路被打穿是因为他们右内切针对了我们三中卫的肋部空间..."', value: 3 },
      { label: 'B', text: '"下半场大家加油！"然后继续低头看手机', value: 1 },
      { label: 'C', text: '"多传球少失误，注意盯人"之类的场面话', value: 2 }
    ]
  },

  // ==================== S 社交行为 (6题) ====================

  // S1a [模式③ A=3 B=1 C=2]
  {
    id: 'S1a', model: 'S', dimension: 'S1',
    question: '看完一场很精彩的比赛之后，你最想做的一件事是？',
    options: [
      { label: 'A', text: '必须找人聊聊！写一段分析发群里，或者拉人讨论', value: 3 },
      { label: 'B', text: '自己回味一下就行了，不一定非要分享出来', value: 1 },
      { label: 'C', text: '可能会发个朋友圈或者找个朋友聊几句', value: 2 }
    ]
  },
  // S1b [模式② A=2 B=3 C=1]
  {
    id: 'S1b', model: 'S', dimension: 'S1',
    question: '有人在你面前说了一些明显不对的足球观点（比如"C罗没去过皇马"），你会？',
    options: [
      { label: 'A', text: '委婉地说一句"好像C罗皇马时期还挺厉害的"', value: 2 },
      { label: 'B', text: '直接就说"啊？C罗在皇马待了好多年啊"然后开始科普', value: 3 },
      { label: 'C', text: '装作没听见，纠正别人怪尴尬的', value: 1 }
    ]
  },

  // S2a [模式① A=1 B=2 C=3]
  {
    id: 'S2a', model: 'S', dimension: 'S2',
    question: '你平时一般在哪些场合讨论足球相关的话题？',
    options: [
      { label: 'A', text: '很少主动聊，有人问我才接两句', value: 1 },
      { label: 'B', text: '在几个熟悉的群或者跟好朋友偶尔聊聊', value: 2 },
      { label: 'C', text: '混迹不少球迷群、论坛、贴吧，讨论频率挺高的', value: 3 }
    ]
  },
  // S2b [模式③ A=3 B=1 C=2]
  {
    id: 'S2b', model: 'S', dimension: 'S2',
    question: '网上遇到和你支持对立球队的粉丝在争论，你会参与进去吗？',
    options: [
      { label: 'A', text: '那就聊聊呗，有理有据地输出一波', value: 3 },
      { label: 'B', text: '划走，不掺和这些，看着累', value: 1 },
      { label: 'C', text: '可能礼貌地表达一下自己的看法，不会吵起来', value: 2 }
    ]
  },

  // S3a [模式② A=2 B=3 C=1]
  {
    id: 'S3a', model: 'S', dimension: 'S3',
    question: '你的微信头像或者朋友圈背景跟足球有关联吗？',
    options: [
      { label: 'A', text: '大赛期间可能会换成相关的，平时就不一定了', value: 2 },
      { label: 'B', text: '一直都有足球元素在里面，算是个人标签吧', value: 3 },
      { label: 'C', text: '没什么关联，用的就是普通照片或者默认图片', value: 1 }
    ]
  },
  // S3b [模式① A=1 B=2 C=3]
  {
    id: 'S3b', model: 'S', dimension: 'S3',
    question: '足球相关的衣服或者周边产品，你出门会穿/用吗？',
    options: [
      { label: 'A', text: '基本不会穿球衣出门，感觉有点奇怪', value: 1 },
      { label: 'B', text: '去看比赛或者有球赛活动的时候会穿', value: 2 },
      { label: 'C', text: '日常穿搭里就有，球衣球鞋围巾什么的轮着来', value: 3 }
    ]
  },

  // ==================== M 消费决策 (6题) ====================

  // M1a [模式③ A=3 B=1 C=2]
  {
    id: 'M1a', model: 'M', dimension: 'M1',
    question: '一张世界杯决赛门票（官方价3000左右），你会考虑买吗？',
    options: [
      { label: 'A', text: '买啊！人生能有几次看世界杯决赛的机会', value: 3 },
      { label: 'B', text: '三千块看一场球...还是算了吧', value: 1 },
      { label: 'C', text: '纠结很久，可能最后咬牙买一张体验一下', value: 2 }
    ]
  },
  // M1b [模式② A=2 B=3 C=1]
  {
    id: 'M1b', model: 'M', dimension: 'M1',
    question: '算一笔粗略的账，你一年在足球上的花费大概是什么水平？',
    options: [
      { label: 'A', text: '偶尔买件球衣或者开个会员，一年也就一点点', value: 2 },
      { label: 'B', text: '没仔细算过，反正看到想买的就买了，数额不算少', value: 3 },
      { label: 'C', text: '基本不怎么花钱，看看直播就很满足了', value: 1 }
    ]
  },

  // M2a [模式① A=1 B=2 C=3]
  {
    id: 'M2a', model: 'M', dimension: 'M2',
    question: '假如有人送你1000元的足球主题预算让你花掉，你最可能买什么？',
    options: [
      { label: 'A', text: '老实说...我可能会先存着，或者买点吃的喝的', value: 1 },
      { label: 'B', text: '买一件正版球衣或者一双球鞋吧，总算有个纪念', value: 2 },
      { label: 'C', text: '这个预算可以买会员+去现场看场球+再买本杂志！完美', value: 3 }
    ]
  },
  // M2b [模式③ A=3 B=1 C=2]
  {
    id: 'M2b', model: 'M', dimension: 'M2',
    question: '你现在拥有的足球相关装备（球衣、球鞋、周边等）大概有多少？',
    options: [
      { label: 'A', text: '还挺多的，专门有个地方放这些东西', value: 3 },
      { label: 'B', text: '一件都没有，或者只有以前别人送的', value: 1 },
      { label: 'C', text: '两三件的样子，有一双球鞋或者一两件衣服', value: 2 }
    ]
  },

  // M3a [模式② A=2 B=3 C=1]
  {
    id: 'M3a', model: 'M', dimension: 'M3',
    question: '俱乐部新赛季主场球衣卖899元一件，你的反应是？',
    options: [
      { label: 'A', text: '确实挺贵的，但如果真的很喜欢的话可能还是会买', value: 2 },
      { label: 'B', text: '可以接受啊，毕竟面料、设计和品牌都在那里，算下来也还行', value: 3 },
      { label: 'C', text: '这么贵？普通T恤才多少钱啊', value: 1 }
    ]
  },
  // M3b [模式③ A=3 B=1 C=2]
  {
    id: 'M3b', model: 'M', dimension: 'M3',
    question: '有个平台推出"世界杯高清包"98元一个月，你会开吗？',
    options: [
      { label: 'A', text: '开！多角度回放没广告还有数据面板，看着舒服多了', value: 3 },
      { label: 'B', text: '免费的央视不够看吗，为什么要花钱', value: 1 },
      { label: 'C', text: '看看评测和口碑再说，如果确实体验更好可以考虑', value: 2 }
    ]
  },

  // ==================== H 隐藏题 (2题) ====================
  // 这两题用于触发 DRUNK 隐藏人格
  // 判定条件：H1选最高分 且 H2选最高分 → 触发 DRUNK
  // 注意：隐藏题也需要打乱分值，但DRUNK判定逻辑需要同步更新为"两个隐藏题都取value=3"

  {
    id: 'H1', model: 'H', dimension: 'H1',
    isHidden: true,
    question: '世界杯期间你的标准"看球套餐"是？',
    options: [
      { label: 'A', text: '几瓶啤酒+烧烤外卖，有氛围就行', value: 2 },
      { label: 'B', text: '白酒兑红牛+花生米，一口闷完大喊"好球！"', value: 3 },
      { label: 'C', text: '快乐水+薯片，经典搭配不出错', value: 1 }
    ]
  },
  {
    id: 'H2', model: 'H', dimension: 'H2',
    isHidden: true,
    question: '比赛结束后（尤其是赢了之后），你的状态通常是？',
    options: [
      { label: 'A', text: '意犹未尽，和朋友再多聊一会儿', value: 2 },
      { label: 'B', text: '已经断片了，第二天醒来发现自己发了50条朋友圈还@了所有人', value: 3 },
      { label: 'C', text: '洗洗睡了，明天还要上班/上学', value: 1 }
    ]
  }
]

module.exports = { questions }

// data/mbtiQuestions.js - MBTI题库 (40题)
// 题目类型: general(通用) / tactic(战术) / data(数据) / face(颜值) / jinx(毒奶) / history(考古)

const questions = [
  // ====== 通用题 (15题) ======
  {
    index: 1, type: 'general',
    question: '当别人问你昨晚比赛咋样，你的内心OS是？',
    options: [
      { label: 'A', text: '"昨天加班好累啊"（光速转移话题）', score: 0 },
      { label: 'B', text: '这题我会！开始分析433阵型和压迫战术', score: 3 },
      { label: 'C', text: '"哪场？昨晚好几场呢"（其实一场没看）', score: 2 },
      { label: 'D', text: '昨晚...啊对昨晚有比赛！赶紧回忆热搜', score: 1 }
    ]
  },
  {
    index: 2, type: 'general',
    question: '如果支持的球队输了，你会？',
    options: [
      { label: 'A', text: '安慰真球迷朋友："没事，下届再来"', score: 2 },
      { label: 'B', text: '默默把壁纸换成赢球队伍', score: 0 },
      { label: 'C', text: '打开战术板分析："后腰位置明显失位了"', score: 3 },
      { label: 'D', text: '发朋友圈："这就是足球"（配忧郁自拍）', score: 1 }
    ]
  },
  {
    index: 3, type: 'general',
    question: '有人问你"什么是越位"，你的反应是？',
    options: [
      { label: 'A', text: '"VAR会判的，相信科技就完事儿了"', score: 2 },
      { label: 'B', text: '反问："你连越位都不知道？显得我很懂"', score: 0 },
      { label: 'C', text: '掏出手机画图讲解："传球瞬间，进攻球员..."', score: 3 },
      { label: 'D', text: '"这个嘛...就是跑太快了！"（开始胡诌）', score: 1 }
    ]
  },
  {
    index: 4, type: 'general',
    question: '世界杯期间你的朋友圈画风是？',
    options: [
      { label: 'A', text: '转发别人的专业分析："说得太对了！"', score: 2 },
      { label: 'B', text: '疯狂发球员帅照和搞笑表情包', score: 0 },
      { label: 'C', text: '每场比赛发千字长文："浅析瓜式传控的局限性"', score: 3 },
      { label: 'D', text: '只在热门比赛发："今夜无眠！"', score: 1 }
    ]
  },
  {
    index: 5, type: 'general',
    question: '买球衣时你的选择是？',
    options: [
      { label: 'A', text: '穿普通T恤："看球而已，没必要"', score: 2 },
      { label: 'B', text: '只看设计："这件粉色好看！"', score: 0 },
      { label: 'C', text: '买主队经典复古款，背后印传奇号码', score: 3 },
      { label: 'D', text: '买当下最火的球星款，谁红买谁', score: 1 }
    ]
  },
  {
    index: 6, type: 'general',
    question: '看球聚会时你负责？',
    options: [
      { label: 'A', text: '偶尔冒一句金句，深藏功与名', score: 2 },
      { label: 'B', text: '"这是谁？""那球算进吗？"（十万个为什么）', score: 0 },
      { label: 'C', text: '自带战术板，边看边解说', score: 3 },
      { label: 'D', text: '负责烤串和啤酒，气氛担当', score: 1 }
    ]
  },
  {
    index: 7, type: 'general',
    question: '梅西和C罗掉进水里，你先救谁？',
    options: [
      { label: 'A', text: '谁给我签名我救谁', score: 0 },
      { label: 'B', text: 'C罗！自律男神的腹肌更有观赏性', score: 3 },
      { label: 'C', text: '两个都救，足球需要绝代双骄', score: 2 },
      { label: 'D', text: '梅西！球王的左脚比C罗值钱', score: 3 }
    ]
  },
  {
    index: 8, type: 'general',
    question: '凌晨3点的比赛，你会？',
    options: [
      { label: 'A', text: '让朋友赛后发结果给我（继续睡）', score: 0 },
      { label: 'B', text: '设8点闹钟看集锦', score: 1 },
      { label: 'C', text: '定三个闹钟，泡好枸杞茶等开赛', score: 3 },
      { label: 'D', text: '看是不是强强对话，是就爬起来', score: 2 }
    ]
  },
  {
    index: 9, type: 'general',
    question: 'VAR介入时你内心想的是？',
    options: [
      { label: 'A', text: '裁判肯定会改判，赌一包辣条', score: 1 },
      { label: 'B', text: 'VAR是什么？新球员吗？', score: 0 },
      { label: 'C', text: '终于要看回放了，刚才那个越位确实可疑', score: 3 },
      { label: 'D', text: '又要等半天，广告时间去上厕所', score: 2 }
    ]
  },
  {
    index: 10, type: 'general',
    question: '世界杯结束后你会？',
    options: [
      { label: 'A', text: '"世界杯结束了？哦，那我刷抖音了"', score: 0 },
      { label: 'B', text: '等欧洲杯/亚洲杯再出来活动', score: 1 },
      { label: 'C', text: '继续追五大联赛，等下届世界杯', score: 3 },
      { label: 'D', text: '偶尔刷体育新闻，看球星动态', score: 2 }
    ]
  },
  {
    index: 11, type: 'general',
    question: '看到"滕圣/滕嗨"的梗，你会？',
    options: [
      { label: 'A', text: '发个"哈哈哈哈哈"假装懂了', score: 2 },
      { label: 'B', text: '滕圣是谁？神仙吗？', score: 0 },
      { label: 'C', text: '会心一笑：滕哈赫确实让人又爱又恨', score: 3 },
      { label: 'D', text: '赶紧百度这梗啥意思', score: 1 }
    ]
  },
  {
    index: 12, type: 'general',
    question: '朋友问你"桑乔怎么了"，你会？',
    options: [
      { label: 'A', text: '"食堂梗懂吗？就是那个！"', score: 2 },
      { label: 'B', text: '桑乔是谁？曼联的吗？', score: 0 },
      { label: 'C', text: '详细分析桑乔与滕哈赫的矛盾始末', score: 3 },
      { label: 'D', text: '"好像被禁赛了吧..."（假装知道）', score: 1 }
    ]
  },
  {
    index: 13, type: 'general',
    question: '球员去沙特踢球，你的看法是？',
    options: [
      { label: 'A', text: '"落叶归根"挺好的，享受足球', score: 2 },
      { label: 'B', text: '沙特联赛很强吗？', score: 0 },
      { label: 'C', text: '可惜了，巅峰期应该留在欧洲', score: 3 },
      { label: 'D', text: '有钱不赚是傻子，我也想去', score: 1 }
    ]
  },
  {
    index: 14, type: 'general',
    question: '看到亚马尔16岁进球，你的反应是？',
    options: [
      { label: 'A', text: '现在小孩都这么厉害吗', score: 1 },
      { label: 'B', text: '亚马尔是谁？未成年就能踢球？', score: 0 },
      { label: 'C', text: '16岁！我16岁还在上课传纸条', score: 3 },
      { label: 'D', text: '拉玛西亚果然名不虚传', score: 2 }
    ]
  },
  {
    index: 15, type: 'general',
    question: '你觉得"足球回家"是什么意思？',
    options: [
      { label: 'A', text: '"回家"就是输球的委婉说法', score: 1 },
      { label: 'B', text: '足球比赛结束要回家', score: 0 },
      { label: 'C', text: '英格兰的口号，但每次都迷路', score: 3 },
      { label: 'D', text: '足球起源于英国，所以要回家', score: 2 }
    ]
  },

  // ====== 战术题 (5题) ======
  {
    index: 16, type: 'tactic',
    question: '看到教练把433改成352，你的第一反应是？',
    options: [
      { label: 'A', text: '"教练又在瞎折腾"', score: 2 },
      { label: 'B', text: '"管他什么阵型，进球就行"', score: 0 },
      { label: 'C', text: '"这是要加强中场控制，同时两个翼卫要承担更多进攻任务"', score: 3 },
      { label: 'D', text: '"数字变大了，说明进攻人更多了？"', score: 1 }
    ]
  },
  {
    index: 17, type: 'tactic',
    question: '朋友问你"高位逼抢和摆大巴有什么区别"，你会？',
    options: [
      { label: 'A', text: '"高位逼抢好看，摆大巴难看"', score: 2 },
      { label: 'B', text: '"都是教练安排的，我哪知道"', score: 0 },
      { label: 'C', text: '拿出纸笔画站位图："高位逼抢是在前场就开始压迫... "', score: 3 },
      { label: 'D', text: '"一个是抢，一个是守，差不多吧"', score: 1 }
    ]
  },
  {
    index: 18, type: 'tactic',
    question: '玩足球经理（FM）游戏时，你通常？',
    options: [
      { label: 'A', text: '没玩过，那是什么？', score: 0 },
      { label: 'B', text: '随便点，反正都是模拟', score: 1 },
      { label: 'C', text: '自己设计战术，调整每个球员的指令，享受当教练的感觉', score: 3 },
      { label: 'D', text: '下载大神战术包，直接套用', score: 2 }
    ]
  },
  {
    index: 19, type: 'tactic',
    question: '听到"伪九号"这个词，你的理解是？',
    options: [
      { label: 'A', text: '"听起来很高级，应该是个新战术"', score: 2 },
      { label: 'B', text: '"第九号球衣的替补？"', score: 0 },
      { label: 'C', text: '"假中锋，回撤拿球组织进攻，梅西在瓜迪奥拉时期经常踢这个位置"', score: 3 },
      { label: 'D', text: '"就是假的前锋，其实是中场吧？"', score: 1 }
    ]
  },
  {
    index: 20, type: 'tactic',
    question: '比赛中看到边锋内切射门得分，你会怎么点评？',
    options: [
      { label: 'A', text: '"教练安排他这么踢的"', score: 2 },
      { label: 'B', text: '"他怎么不从边路传中？"', score: 0 },
      { label: 'C', text: '"典型的内切型边锋打法，像罗本一样，逆足射门让后卫很难防守"', score: 3 },
      { label: 'D', text: '"这球射得漂亮！"', score: 1 }
    ]
  },

  // ====== 数据题 (5题) ======
  {
    index: 21, type: 'data',
    question: '看到球员转会新闻，你最先关注的是？',
    options: [
      { label: 'A', text: '关我什么事', score: 0 },
      { label: 'B', text: '他长得帅吗？', score: 1 },
      { label: 'C', text: '转会费多少？身价变化？合同年限？违约金条款？', score: 3 },
      { label: 'D', text: '这个球员厉害吗？是哪个队的？', score: 2 }
    ]
  },
  {
    index: 22, type: 'data',
    question: '争论两个球员谁更强时，你的论据是？',
    options: [
      { label: 'A', text: '"都很强，不要比较"', score: 0 },
      { label: 'B', text: '"我觉得A强，就是一种感觉"', score: 1 },
      { label: 'C', text: '"A的xG是0.35，B只有0.22；A的 progressive passes 也更多..."', score: 3 },
      { label: 'D', text: '"A进球多，所以A强"', score: 2 }
    ]
  },
  {
    index: 23, type: 'data',
    question: '比赛结束后你最先做的是？',
    options: [
      { label: 'A', text: '睡觉，明天还要上班', score: 0 },
      { label: 'B', text: '刷社交媒体看大家怎么吹/喷', score: 1 },
      { label: 'C', text: '打开数据网站看全场统计：控球率、射门数、xG、跑动距离', score: 3 },
      { label: 'D', text: '看集锦回味精彩瞬间', score: 2 }
    ]
  },
  {
    index: 24, type: 'data',
    question: '看到"德转身价榜"更新，你的反应是？',
    options: [
      { label: 'A', text: '直接划走', score: 0 },
      { label: 'B', text: '"这是什么榜？颜值榜吗？"', score: 1 },
      { label: 'C', text: '"让我看看谁涨了谁跌了，这个估值模型最近是不是调整了？"', score: 3 },
      { label: 'D', text: '"姆巴佩还是第一吗？"', score: 2 }
    ]
  },
  {
    index: 25, type: 'data',
    question: '朋友问你"为什么这个球员评分这么低"，你会？',
    options: [
      { label: 'A', text: '"管他呢，赢球就行"', score: 0 },
      { label: 'B', text: '"评分系统有问题"', score: 1 },
      { label: 'C', text: '"你看他的关键传球只有1次，丢失球权12次，防守贡献几乎为零..."', score: 3 },
      { label: 'D', text: '"可能今天状态不好吧"', score: 2 }
    ]
  },

  // ====== 颜值题 (5题) ======
  {
    index: 26, type: 'face',
    question: '你选择关注一个新球员，主要是因为？',
    options: [
      { label: 'A', text: '随便关注的', score: 0 },
      { label: 'B', text: '朋友都在聊他', score: 1 },
      { label: 'C', text: '他的Instagram照片太帅了，穿搭也很有品味', score: 3 },
      { label: 'D', text: '听说他球技很厉害', score: 2 }
    ]
  },
  {
    index: 27, type: 'face',
    question: '看球时你经常？',
    options: [
      { label: 'A', text: '只看球，不看人', score: 0 },
      { label: 'B', text: '认真看比赛，偶尔看看帅哥', score: 1 },
      { label: 'C', text: '截图球员特写，放大欣赏颜值和发型', score: 3 },
      { label: 'D', text: '关注球员的球鞋和球衣搭配', score: 2 }
    ]
  },
  {
    index: 28, type: 'face',
    question: '如果让你选一张世界杯海报贴在墙上，你会选？',
    options: [
      { label: 'A', text: '赛程表，实用主义', score: 0 },
      { label: 'B', text: '经典比赛瞬间，有故事性的', score: 1 },
      { label: 'C', text: '球员写真，最好是湿发+腹肌的', score: 3 },
      { label: 'D', text: '球队全家福，有氛围感的', score: 2 }
    ]
  },
  {
    index: 29, type: 'face',
    question: '球员换了新发型出现在赛场上，你会？',
    options: [
      { label: 'A', text: '"踢球就踢球，搞这些花里胡哨的"', score: 0 },
      { label: 'B', text: '"换发型了？没注意，看球呢"', score: 1 },
      { label: 'C', text: '"这个脏辫造型太适合他了！比上次那个寸头好看多了，我立刻去搜同款"', score: 3 },
      { label: 'D', text: '"挺精神的"', score: 2 }
    ]
  },
  {
    index: 30, type: 'face',
    question: '你手机里关于足球的内容最多的是？',
    options: [
      { label: 'A', text: '几乎没有足球相关内容', score: 0 },
      { label: 'B', text: '足球梗图和表情包', score: 1 },
      { label: 'C', text: '球员帅照、庆祝动作GIF、场边穿搭街拍', score: 3 },
      { label: 'D', text: '比赛集锦和精彩进球', score: 2 }
    ]
  },

  // ====== 毒奶题 (5题) ======
  {
    index: 31, type: 'jinx',
    question: '比赛前你发了一条"XX队必胜"的朋友圈，结果？',
    options: [
      { label: 'A', text: '我从不发这种flag', score: 0 },
      { label: 'B', text: '我发完就忘了，没注意结果', score: 1 },
      { label: 'C', text: '他们输了，而且输得很惨，我已经不敢发朋友圈了', score: 3 },
      { label: 'D', text: '有时候赢有时候输，正常吧', score: 2 }
    ]
  },
  {
    index: 32, type: 'jinx',
    question: '朋友说"你支持的球队肯定赢"，你的反应是？',
    options: [
      { label: 'A', text: '"我不支持任何球队"', score: 0 },
      { label: 'B', text: '"无所谓，输赢都行"', score: 1 },
      { label: 'C', text: '"快闭嘴！你这一说肯定要输！"', score: 3 },
      { label: 'D', text: '"借你吉言！"', score: 2 }
    ]
  },
  {
    index: 33, type: 'jinx',
    question: '你发现自己支持的球队有个规律？',
    options: [
      { label: 'A', text: '我支持的球队一直很强，没输过', score: 0 },
      { label: 'B', text: '没注意过什么规律', score: 1 },
      { label: 'C', text: '我看直播他们就落后，我一关电视他们就进球', score: 3 },
      { label: 'D', text: '主场赢得多，客场输得多，很正常', score: 2 }
    ]
  },
  {
    index: 34, type: 'jinx',
    question: '关键比赛前，你会？',
    options: [
      { label: 'A', text: '比赛有什么好看的，打游戏去了', score: 0 },
      { label: 'B', text: '正常看，相信实力', score: 1 },
      { label: 'C', text: '故意说"对面肯定赢"，试图用反向毒奶保佑主队', score: 3 },
      { label: 'D', text: '紧张得不敢看，只敢刷文字直播', score: 2 }
    ]
  },
  {
    index: 35, type: 'jinx',
    question: '你买彩票或竞猜的比分，结果通常是？',
    options: [
      { label: 'A', text: '我一直赢啊', score: 0 },
      { label: 'B', text: '不买，不参与', score: 1 },
      { label: 'C', text: '我买的比分永远和实际结果相反，庄家应该给我分红', score: 3 },
      { label: 'D', text: '偶尔中，大部分时候不中', score: 2 }
    ]
  },

  // ====== 考古题 (5题) ======
  {
    index: 36, type: 'history',
    question: '提到1998年世界杯，你想到的是？',
    options: [
      { label: 'A', text: '那么久以前的事谁记得', score: 0 },
      { label: 'B', text: '1998年我还没出生...', score: 1 },
      { label: 'C', text: '罗纳尔多的"外星人"表现，齐达内的头球，那届的主题曲《La Copa de la Vida》', score: 3 },
      { label: 'D', text: '好像法国队夺冠了？', score: 2 }
    ]
  },
  {
    index: 37, type: 'history',
    question: '看到有人穿复古球衣，你会？',
    options: [
      { label: 'A', text: '没注意', score: 0 },
      { label: 'B', text: '"这颜色有点土啊"', score: 1 },
      { label: 'C', text: '"这是90年代荷兰的客场球衣！范巴斯滕同款！"', score: 3 },
      { label: 'D', text: '"挺好看的，哪里买的？"', score: 2 }
    ]
  },
  {
    index: 38, type: 'history',
    question: '"马拉多纳的上帝之手"发生在哪届世界杯？',
    options: [
      { label: 'A', text: '上帝之手是什么？宗教仪式吗？', score: 0 },
      { label: 'B', text: '好像是90年代？', score: 1 },
      { label: 'C', text: '1986年墨西哥世界杯，对阵英格兰的四分之一决赛', score: 3 },
      { label: 'D', text: '1986年，但记不清对手了', score: 2 }
    ]
  },
  {
    index: 39, type: 'history',
    question: '提到"米兰王朝"，你想到的是？',
    options: [
      { label: 'A', text: '"现在还有米兰王朝吗？"', score: 0 },
      { label: 'B', text: '"米兰是个城市吧？"', score: 1 },
      { label: 'C', text: '"荷兰三剑客！范巴斯滕、古利特、里杰卡尔德，80年代末90年代初的AC米兰无敌于欧洲"', score: 3 },
      { label: 'D', text: '"AC米兰很厉害的时期？"', score: 2 }
    ]
  },
  {
    index: 40, type: 'history',
    question: '听到"电话门"这个词，你的反应是？',
    options: [
      { label: 'A', text: '没听过', score: 0 },
      { label: 'B', text: '"电话门？是电信公司的广告吗？"', score: 1 },
      { label: 'C', text: '"2006年意大利足坛丑闻，尤文图斯被降级，AC米兰被罚分，直接改变了意甲格局"', score: 3 },
      { label: 'D', text: '"好像是意大利的什么丑闻？"', score: 2 }
    ]
  }
]

module.exports = { questions }

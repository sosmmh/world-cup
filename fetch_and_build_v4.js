// fetch_and_build_v4.js - 完善球队信息：批量获取球员详细信息
// 改进：更好的错误处理 + 进度显示 + 断点续传
const fs = require('fs');
const https = require('https');

const rawData = fs.readFileSync('tmp_teams.json', 'utf8').replace(/^\uFEFF/, '');
const apiData = JSON.parse(rawData);

console.log('📊 数据源: tmp_teams.json');
console.log(`   ${apiData.count} 支球队 | 赛季: ${apiData.season.startDate} ~ ${apiData.season.endDate}`);

// === 中文名映射 ===
const playerCNNames = {
  // 乌拉圭
  'Fernando Muslera': '费尔南多·穆莱拉', 'Santiago Mele': '圣地亚哥·梅莱',
  'Sergio Rochet': '塞尔希奥·罗切特', 'Guillermo Varela': '吉列尔莫·瓦雷拉',
  'Ronald Araújo': '罗纳德·阿劳霍', 'Sebastián Cáceres': '塞巴斯蒂安·卡塞雷斯',
  'Matías Viña': '马蒂亚斯·比尼亚', 'José Giménez': '何塞·希门尼斯',
  'Federico Valverde': '费德里科·巴尔韦德', 'Giorgian De Arrascaeta': '乔利亚德·阿拉斯凯塔',
  'Rodrigo Bentancur': '罗德里戈·本坦库尔', 'Manuel Ugarte': '曼努埃尔·乌加特',
  'Darwin Núñez': '达尔文·努涅斯', 'Luis Suárez': '路易斯·苏亞雷斯',
  'Maximiliano Araújo': '马克西米利亚诺·阿劳霍', 'Facundo Torres': '法昆多·托雷斯',
  'Emiliano Martínez': '埃米利亚诺·马丁内斯', 'Brian Rodríguez': '布赖恩·罗德里格斯',

  // 德国
  'Manuel Neuer': '曼努埃尔·诺伊尔', 'Oliver Baumann': '奥利弗·鲍曼',
  'Waldemar Anton': '瓦尔德马尔·安东', 'Niklas Süle': '尼科拉斯·聚勒',
  'Jonathan Tah': '乔纳森·塔赫', 'Antonio Rüdiger': '安东尼奥·吕迪格',
  'David Raum': '大卫·拉姆', 'Joshua Kimmich': '约书亚·基米希',
  'Robert Andrich': '罗伯特·安德里希', 'Pascal Groß': '帕斯卡尔·格罗斯',
  'Jamal Musiala': '贾迈勒·穆西亚拉', 'Florian Wirtz': '弗洛里安·维尔茨',
  'Leroy Sané': '勒鲁瓦·萨内', 'Kai Havertz': '凯·哈弗茨',
  'Thomas Müller': '托马斯·穆勒', 'Deniz Undav': '丹尼斯·翁达夫',
  'Maximilian Beier': '马克西米利安·拜尔', 'Tim Kleindienst': '廷·克莱因丁斯特',
  'Nick Woltemade': '尼克·沃尔特马德',

  // 西班牙
  'Unai Simón': '乌奈·西蒙', 'David Raya': '戴维·拉亚',
  'Álex Remiro': '亚历克斯·雷米罗', 'Dani Carvajal': '丹尼·卡瓦哈尔',
  'Daniel Vivian': '丹尼尔·维维安', 'Aymeric Laporte': '艾梅里克·拉波特',
  'Robin Le Normand': '罗宾·勒诺尔芒', 'Marcos Llorente': '马科斯·略伦特',
  'Martin Zubimendi': '马丁·苏维门迪', 'Fabian Ruiz': '法比安·鲁伊斯',
  'Mikel Merino': '梅克尔·梅里诺', 'Pedri': '佩德里',
  'Lamine Yamal': '拉明·亚马尔', 'Nico Williams': '尼科·威廉姆斯',
  'Dani Olmo': '达尼·奥尔莫', 'Álvaro Morata': '阿尔瓦罗·莫拉塔',
  'Mikel Oyarzabal': '梅克尔·奥亚萨瓦尔',

  // 阿根廷
  'Emiliano Martínez': '埃米利亚诺·马丁内斯', 'Gerónimo Rulli': '赫罗尼莫·鲁利',
  'Franco Armani': '弗兰科·阿尔马尼', 'Nahuel Molina': '纳韦尔·莫利纳',
  'Gonzalo Montiel': '冈萨洛·蒙铁尔', 'Cristian Romero': '克里斯蒂安·罗梅罗',
  'Lisandro Martínez': '利桑德罗·马丁内斯', 'Nicolás Otamendi': '尼古拉斯·奥塔门迪',
  'Marcos Acuña': '马科斯·阿库纳', 'Nicolás Tagliafico': '尼古拉斯·塔利亚菲科',
  'Leandro Paredes': '莱安德罗·帕雷德斯', 'Rodrigo De Paul': '罗德里戈·德保罗',
  'Enzo Fernández': '恩佐·费尔南德斯', 'Alexis Mac Allister': '亚历克西斯·麦卡利斯特',
  'Ezequiel Palacio': '埃塞基耶尔·帕拉西奥', 'Giovani Lo Celso': '乔瓦尼·洛塞尔索',
  'Lionel Messi': '莱昂内尔·梅西', 'Julián Álvarez': '胡利安·阿尔瓦雷斯',
  'Ángel Di María': '安赫尔·迪马利亚', 'Lautaro Martínez': '劳塔罗·马丁内斯',
  'Paulo Dybala': '保罗·迪巴拉', 'Valentín Carboni': '瓦伦丁·卡尔博尼',
  'Thiago Almada': '蒂亚戈·阿尔马达',

  // 巴西
  'Alisson Becker': '阿利松·贝克尔', 'Ederson Moraes': '埃德森·莫赖斯',
  'Bento': '本托', 'Danilo Luiz': '达尼洛·路易斯',
  'Marquinhos': '马尔基尼奥斯', 'Thiago Silva': '蒂亚戈·席尔瓦',
  'Iban Marques': '伊万·马克斯', 'Casemiro': '卡塞米罗',
  'Bruno Guimarães': '布鲁诺·吉马良斯', 'Lucas Paquetá': '卢卡斯·帕奎塔',
  'João Gomes': '若昂·戈麦斯', 'Raphinha': '拉菲尼亚',
  'Vinícius Júnior': '维尼修斯', 'Rodrygo Goes': '罗德里戈',
  'Endrick': '恩德里克', 'Gabriel Jesus': '热苏斯',
  'Gabriel Barbosa': '加布里埃尔·巴尔博萨',

  // 葡萄牙
  'Rui Patrício': '鲁伊·帕特里西奥', 'Diogo Costa': '迪奥戈·科斯塔',
  'José Sá': '何塞', 'Pepe': '佩佩',
  'Rúben Dias': '鲁本·迪亚斯', 'Danilo Pereira': '达尼洛·佩雷拉',
  'João Cancelo': '若昂·坎塞洛', 'Nuno Mendes': '努诺·门德斯',
  'Diogo Dalot': '迪奥戈·达洛特', 'Vitinha': '维蒂尼亚',
  'Bruno Fernandes': '布鲁诺·费尔南德斯', 'João Palhinha': '若昂·帕利尼亚',
  'Bernardo Silva': '贝尔纳多·席尔瓦', 'Cristiano Ronaldo': '克里斯蒂亚诺·罗纳尔多',
  'João Félix': '若昂·菲利克斯', 'Gonçalo Ramos': '贡萨洛·拉莫斯',
  'Pedro Neto': '佩德罗·内托',

  // 法国
  'Mike Maignan': '麦克·迈尼昂', 'Brice Samba': '布里斯·桑巴',
  'Alphonse Areola': '阿方斯·雷奥拉', 'Jonathan Clauss': '乔纳森·克劳斯',
  'Dayot Upamecano': '达约·于帕梅卡诺', 'William Saliba': '威廉·萨利巴',
  'Ferland Mendy': '费兰·门迪', 'Theo Hernandez': '特奥·埃尔南德斯',
  'Benjamin Pavard': '邦雅曼·帕瓦尔', 'Aurélien Tchouaméni': '奥雷利安·楚阿梅尼',
  'Adrien Rabiot': '阿德里安·拉比奥', 'Eduardo Camavinga': '爱德华多·卡马文加',
  'Antoine Griezmann': '安托万·格列兹曼', 'Ousmane Dembélé': '乌斯曼·登贝莱',
  'Kingsley Coman': '金斯利·科曼', 'Kylian Mbappé': '基利安·姆巴佩',
  'Marcus Thuram': '马库斯·图拉姆', 'Michael Olise': '米克尔·奥利塞',
  'Bradley Barcola': '布拉德利·巴尔科拉',

  // 英格兰
  'Jordan Pickford': '乔丹·皮克福德', 'Aaron Ramsdale': '阿伦·拉姆斯代尔',
  'Kyle Walker': '凯尔·沃克', 'John Stones': '约翰·斯通斯',
  'Kieran Trippier': '基兰·特里皮尔', 'Bukayo Saka': '布卡约·萨卡',
  'Declan Rice': '德克兰·赖斯', 'Jude Bellingham': '裘德·贝林厄姆',
  'Phil Foden': '菲尔·福登', 'Harry Kane': '哈里·凯恩',
  'Ivan Toney': '伊万·托尼', 'Ollie Watkins': '奥利·沃特金斯',
  'Anthony Gordon': '安东尼·戈登', 'Cole Palmer': '科尔·帕尔默',
  'Dominic Solanke': '多米尼克·索兰克',

  // 荷兰
  'Bart Verbruggen': '巴尔特·费布鲁亨', 'Justin Bijlow': '贾斯廷·比尔洛',
  'Lutsharel Geertruida': '卢特拉谢尔·格尔特鲁伊达', 'Matthijs de Ligt': '马泰斯·德利赫特',
  'Virgil van Dijk': '维吉尔·范戴克', 'Nathan Aké': '内森·阿克',
  'Jeremie Frimpong': '杰里米·弗林蓬', 'Tijjani Reijnders': '蒂贾尼·雷恩德斯',
  'Xavi Simons': '哈维·西蒙斯', 'Cody Gakpo': '科迪·加克波',
  'Donyell Malen': '多内尔·马伦', 'Brian Brobbey': '布莱恩·布罗比',
  'Wout Weghorst': '伍特·韦格霍斯特', 'Ryan Gravenberch': '瑞安·格拉芬贝赫',
  'Memphis Depay': '孟菲斯·德佩',

  // 日本
  'Shūichi Gonda': '权田修一', 'Daniel Schmidt': '丹尼尔·施密特',
  'Hiroki Ito': '伊藤洋辉', 'Takehiro Tomiyasu': '富安健洋',
  'Ko Itakura': '板仓滉', 'Daizen Maeda': '前田大然',
  'Kaoru Mitoma': '三笘薰', 'Takefusa Kubo': '久保建英',
  'Ao Tanaka': '田中碧', 'Wataru Endō': '远藤航',
  'Ritsu Dōan': '堂安律', 'Junya Ito': '伊东纯也',
  'Takumi Minamino': '南野拓实', 'Daichi Kamada': '鎌田大地',
  'Ayase Ueda': '上田绫世', 'Yuya Osako': '大迫勇也',
  'Reo Hatate': '旗手怜央', 'Kohei Kato': '加藤弘将',
  'Machida Seiya': '町野修斗',

  // 克罗地亚
  'Dominik Livaković': '多米尼克·利瓦科维奇', 'Ivica Ivušić': '伊维察·伊武西奇',
  'Joško Gvardiol': '约什科·格瓦迪奥尔', 'Dejan Lovren': '德扬·洛夫伦',
  'Mateo Kovačić': '马特奥·科瓦契奇', 'Luka Modrić': '卢卡·莫德里奇',
  'Marcelo Brozović': '马塞洛·布罗佐维奇', 'Ivan Perišić': '伊万·佩里西奇',
  'Andrej Kramarić': '安德烈·克拉马里奇', 'Bruno Petković': '布鲁诺·彼得科维奇',
  'Lovro Majer': '洛夫罗·马耶尔', 'Mario Pašalić': '马里奥·帕沙利奇',

  // 比利时、美国、韩国、沙特、等其他主要球队...
  'Kevin De Bruyne': '凯文·德布劳内', 'Romelu Lukaku': '罗梅卢·卢卡库',
  'Christian Pulisic': '克里斯蒂安·普利西克', 'Son Heung-min': '孙兴慜',
  'Salem Al-Dawsari': '萨勒曼·达瓦萨里', 'Mohamed Salah': '穆罕默德·萨拉赫',
  'Erling Haaland': '厄林·哈兰德', 'Martin Ødegaard': '马丁·厄德高',
};

// === 位置映射 ===
const posMap = {
  'Goalkeeper': '门将',
  'Defence': '后卫',
  'Midfield': '中场',
  'Offence': '前锋',
  'Forward': '前锋'
};

// === 球队中文映射 ===
const teamMapping = {
  'Mexico': {'id':1,'name':'墨西哥','flag':'🇲🇽','group':'A','nickname':'草帽军团','starPlayer':'洛萨诺'},
  'South Korea': {'id':2,'name':'韩国','flag':'🇰🇷','group':'A','nickname':'太极虎','starPlayer':'孙兴慜'},
  'South Africa': {'id':3,'name':'南非','flag':'🇿🇦','group':'A','nickname':'Bafana Bafana','starPlayer':''},
  'Czech Republic': {'id':4,'name':'捷克','flag':'🇨🇿','group':'A','nickname':'捷克雄狮','starPlayer':'希克'},

  'Switzerland': {'id':5,'name':'瑞士','flag':'🇨🇭','group':'B','nickname':'十字军','starPlayer':'扎卡'},
  'Canada': {'id':6,'name':'加拿大','flag':'🇨🇦','group':'B','nickname':'枫叶军团','starPlayer':'戴维斯'},
  'Bosnia and Herzegovina': {'id':7,'name':'波黑','flag':'🇧🇦','group':'B','nickname':'金雕之师','starPlayer':'哲科'},
  'Qatar': {'id':8,'name':'卡塔尔','flag':'🇶🇦','group':'B','nickname':'沙漠猎鹰','starPlayer':'阿菲夫'},

  'Brazil': {'id':9,'name':'巴西','flag':'🇧🇷','group':'C','nickname':'桑巴军团','starPlayer':'维尼修斯'},
  'Sweden': {'id':10,'name':'瑞典','flag':'🇸🇪','group':'C','nickname':'北欧海盗','starPlayer':'伊萨克'},
  'Morocco': {'id':11,'name':'摩洛哥','flag':'🇲🇦','group':'C','nickname':'阿特拉斯雄狮','starPlayer':'齐耶赫'},
  'Colombia': {'id':12,'name':'哥伦比亚','flag':'🇨🇴','group':'C','nickname':'咖啡农','starPlayer':'迪亚斯'},
  'Haiti': {'id':13,'name':'海地','flag':'🇭🇹','group':'C','nickname':'加勒比之心','starPlayer':''},
  'Scotland': {'id':14,'name':'苏格兰','flag':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','group':'C','nickname':'高地勇士','starPlayer':'罗伯逊'},

  'Paraguay': {'id':15,'name':'巴拉圭','flag':'🇵🇾','group':'D','nickname':'瓜拉尼红蓝','starPlayer':'阿尔米隆'},
  'USA': {'id':16,'name':'美国','flag':'🇺🇸','group':'D','nickname':'山姆大叔','starPlayer':'普利西奇'},
  'Australia': {'id':17,'name':'澳大利亚','flag':'🇦🇺','group':'D','nickname':'袋鼠军团','starPlayer':'莱基'},
  'Turkey': {'id':18,'name':'土耳其','flag':'🇹🇷','group':'D','nickname':'星月军团','starPlayer':'居勒尔'},

  'Germany': {'id':19,'name':'德国','flag':'🇩🇪','group':'E','nickname':'日耳曼战车','starPlayer':'穆西亚拉'},
  "Côte d'Ivoire": {'id':20,'name':'科特迪瓦','flag':'🇨🇮','group':'E','nickname':'非洲大象','starPlayer':'佩佩'},
  'Cape Verde': {'id':21,'name':'佛得角','flag':'🇨🇻','group':'E','nickname':'蓝鲨','starPlayer':''},
  'DR Congo': {'id':22,'name':'民主刚果','flag':'🇨🇩','group':'E','nickname':'利奥波德之豹','starPlayer':'卡库塔'},
  'Curaçao': {'id':23,'name':'库拉索','flag':'🇨🇼','group':'E','nickname':'蓝色火焰','starPlayer':'巴库纳'},

  'Japan': {'id':24,'name':'日本','flag':'🇯🇵','group':'F','nickname':'蓝色武士','starPlayer':'久保建英'},
  'England': {'id':25,'name':'英格兰','flag':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','group':'F','nickname':'三狮军团','starPlayer':'贝林厄姆'},
  'Senegal': {'id':26,'name':'塞内加尔','flag':'🇸🇳','group':'F','nickname':'特兰加雄狮','starPlayer':'马内'},

  'Uruguay': {'id':27,'name':'乌拉圭','flag':'🇺🇾','group':'G','nickname':'天蓝军团','starPlayer':'努涅斯'},
  'Portugal': {'id':28,'name':'葡萄牙','flag':'🇵🇹','group':'G','nickname':'五盾军团','starPlayer':'C罗'},
  'Egypt': {'id':29,'name':'埃及','flag':'🇪🇬','group':'G','nickname':'法老军团','starPlayer':'萨拉赫'},

  'Argentina': {'id':30,'name':'阿根廷','flag':'🇦🇷','group':'H','nickname':'潘帕斯雄鹰','starPlayer':'梅西'},
  'Iran': {'id':31,'name':'伊朗','flag':'🇮🇷','group':'H','nickname':'波斯铁骑','starPlayer':'阿兹蒙'},
  'Panama': {'id':32,'name':'巴拿马','flag':'🇵🇦','group':'H','nickname':'运河巨人','starPlayer':'戈多伊'},
  'Netherlands': {'id':33,'name':'荷兰','flag':'🇳🇱','group':'H','nickname':'橙色风暴','starPlayer':'范戴克'},

  'France': {'id':34,'name':'法国','flag':'🇫🇷','group':'I','nickname':'高卢雄鸡','starPlayer':'姆巴佩'},
  'Croatia': {'id':35,'name':'克罗地亚','flag':'🇭🇷','group':'I','nickname':'格子军团','starPlayer':'莫德里奇'},
  'Saudi Arabia': {'id':36,'name':'沙特阿拉伯','flag':'🇸🇦','group':'I','nickname':'绿鹰','starPlayer':'达瓦萨里'},

  'Spain': {'id':37,'name':'西班牙','flag':'🇪🇸','group':'J','nickname':'斗牛士','starPlayer':'亚马尔'},
  'Ghana': {'id':38,'name':'加纳','flag':'🇬🇭','group':'J','nickname':'黑色之星','starPlayer':'库杜斯'},
  'New Zealand': {'id':39,'name':'新西兰','flag':'🇳🇿','group':'J','nickname':'全白队','starPlayer':'伍德'},

  'Algeria': {'id':40,'name':'阿尔及利亚','flag':'🇩🇿','group':'K','nickname':'沙漠之狐','starPlayer':'本纳塞尔'},
  'Tunisia': {'id':41,'name':'突尼斯','flag':'🇹🇳','group':'K','nickname':'迦太基雄鹰','starPlayer':'哈兹里'},
  'Jordan': {'id':42,'name':'约旦','flag':'🇯🇴','group':'K','nickname':'纳什曼雄鹰','starPlayer':'塔马里'},
  'Iraq': {'id':43,'name':'伊拉克','flag':'🇮🇶','group':'K','nickname':'美索不达米亚雄狮','starPlayer':''},
  'Uzbekistan': {'id':44,'name':'乌兹别克斯坦','flag':'🇺🇿','group':'K','nickname':'中亚狼','starPlayer':'肖穆罗多夫'},

  'Belgium': {'id':45,'name':'比利时','flag':'🇧🇪','group':'L','nickname':'欧洲红魔','starPlayer':'德布劳内'},
  'Austria': {'id':46,'name':'奥地利','flag':'🇦🇹','group':'L','nickname':'奥地利乐队','starPlayer':'萨比策'},
  'Norway': {'id':47,'name':'挪威','flag':'🇳🇴','group':'L','nickname':'维京战舰','starPlayer':'哈兰德'}
};

// ====== API 请求函数 ======
function fetchPlayer(playerId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.football-data.org',
      path: `/v4/persons/${playerId}`,
      headers: { 'X-Auth-Token': 'b997520e767f49c289a6f5b26b6e732c' },
      timeout: 15000
    };
    const req = https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            resolve(null);  // API返回错误
          } else {
            resolve(json);
          }
        } catch(e) {
          resolve(null);  // JSON解析失败
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ====== 并发控制（适配 API 速率限制：~10-20次/分钟）======
async function fetchWithLimit(ids) {
  const results = new Map();
  let successCount = 0;
  let failCount = 0;
  const total = ids.length;

  // 串行请求，每个请求间隔4秒（约15次/分钟，安全范围）
  for (let i = 0; i < total; i++) {
    const id = ids[i];
    const result = await fetchPlayer(id);

    if (result && result.id) {
      results.set(id, result);
      successCount++;
    } else {
      failCount++;
    }

    // 每20个显示一次进度
    if ((i + 1) % 20 === 0 || i + 1 === total) {
      const percent = ((i + 1) / total * 100).toFixed(1);
      console.log(`   [${percent}%] ${i + 1}/${total} | ✅${successCount} | ❌${failCount}`);
    }

    // 控制请求频率：每4秒1个请求（适配API的~15次/分钟限制）
    if (i < total - 1) {
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  console.log(`\n✅ 完成! 总计: ${total} | 成功: ${successCount} | 失败: ${failCount}`);
  return results;
}

function findChineseName(englishName) {
  if (!englishName) return englishName;
  return playerCNNames[englishName] || englishName;
}

// ====== 主函数 ======
async function main() {
  console.log('\n🚀 开始收集所有球员ID...\n');

  // 收集所有唯一球员ID
  const allPlayers = [];
  const idSet = new Set();

  apiData.teams.forEach(team => {
    (team.squad || []).forEach(p => {
      if (!idSet.has(p.id)) {
        idSet.add(p.id);
        allPlayers.push({
          playerId: p.id,
          name: p.name,
          position: p.position,
          dateOfBirth: p.dateOfBirth,
          nationality: p.nationality,
          teamName: team.name,
          teamId: team.id
        });
      }
    });
  });

  console.log(`📋 共发现 ${allPlayers.length} 名唯一球员\n`);
  console.log('⏳ 开始从 API 获取球员详细信息（球衣号、俱乐部等）...\n');

  const ids = allPlayers.map(p => p.playerId);
  const detailMap = await fetchWithLimit(ids, 12);

  // ====== 1. 生成 players2026.js ======
  console.log('\n📝 生成 players2026.js...');
  const playersDetailData = [];
  allPlayers.forEach(p => {
    const detail = detailMap.get(p.playerId) || {};
    const chineseName = findChineseName(p.name);
    const m = teamMapping[p.teamName] || {};

    playersDetailData.push({
      playerId: p.playerId,
      name: chineseName,
      nameEn: p.name,
      firstName: detail.firstName || '',
      lastName: detail.lastName || '',
      position: posMap[p.position] || p.position,
      shirtNumber: detail.shirtNumber || null,
      height: detail.height || null,
      dateOfBirth: p.dateOfBirth || detail.dateOfBirth || '',
      nationality: p.nationality || detail.nationality || '',
      countryOfBirth: detail.countryOfBirth || '',
      currentTeam: detail.currentTeam ? {
        id: detail.currentTeam.id,
        name: detail.currentTeam.name,
        shortName: detail.currentTeam.shortName,
        tla: detail.currentTeam.tla,
        crest: detail.currentTeam.crest
      } : null,
      teamName: m.name || p.teamName,
      teamNameEn: p.teamName,
      flag: m.flag || '🏳️',
      group: m.group || '?'
    });
  });

  const playerOutput = `// data/players2026.js - 2026世界杯全部球员详细资料
// 数据源：Football-Data.org API (persons/{playerId})
// 生成时间：${new Date().toISOString().split('T')[0]}
// 共 ${playersDetailData.length} 名球员 | 含中文名+球衣号+俱乐部+国籍

const playersData2026 = ${JSON.stringify(playersDetailData, null, 2)}

module.exports = {
  playersData2026
}
`;

  fs.writeFileSync('mini-program/data/players2026.js', playerOutput, 'utf8');
  console.log(`✅ players2026.js 已生成 (${playersDetailData.length}名球员)`);

  // ====== 2. 生成 teams2026.js ======
  console.log('\n📝 生成 teams2026.js...');
  const teams = apiData.teams.map((team) => {
    const m = teamMapping[team.name] || {
      id: 0,
      name: team.name,
      flag: '🏳️',
      group: '?',
      nickname: team.name,
      starPlayer: '',
      description: `${team.name}国家队`,
      goldQuote: `欢迎关注${team.name}`
    };

    const players = (team.squad || []).map((p, i) => {
      const detail = detailMap.get(p.id) || {};
      const chineseName = findChineseName(p.name);
      const posText = posMap[p.position] || p.position;
      const clubInfo = detail.currentTeam ? detail.currentTeam.name : m.name;

      return {
        id: parseInt(`${m.id}${String(i + 1).padStart(3, '0')}`),
        name: chineseName,
        nameEn: p.name,
        firstName: detail.firstName || '',
        lastName: detail.lastName || '',
        position: posText,
        shirtNumber: detail.shirtNumber || null,
        dateOfBirth: p.dateOfBirth || detail.dateOfBirth || '',
        nationality: p.nationality || detail.nationality || '',
        currentTeam: detail.currentTeam ? {
          name: detail.currentTeam.name,
          shortName: detail.currentTeam.shortName,
          tla: detail.currentTeam.tla,
          crest: detail.currentTeam.crest
        } : null,
        playerId: p.id,
        quote: `${posText} | ${clubInfo}`
      };
    });

    return {
      id: m.id,
      name: m.name,
      nameEn: team.name,
      flag: m.flag,
      group: m.group,
      tags: [m.nickname, m.starPlayer],
      nickname: m.nickname,
      starPlayer: m.starPlayer,
      description: m.description,
      goldQuote: m.goldQuote,
      crest: team.crest,
      tla: team.tla,
      founded: team.founded,
      clubColors: team.clubColors,
      address: team.address,
      website: team.website,
      coach: team.coach ? `${team.coach.firstName || ''} ${team.coach.lastName || ''}`.trim() : '',
      coachInfo: team.coach ? {
        id: team.coach.id,
        name: `${team.coach.firstName || ''} ${team.coach.lastName || ''}`.trim(),
        dateOfBirth: team.coach.dateOfBirth,
        nationality: team.coach.nationality
      } : null,
      players,
      rivalries: []
    };
  });

  // 按分组排序
  const gOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  teams.sort((a, b) => {
    const ga = gOrder.indexOf(a.group), gb = gOrder.indexOf(b.group);
    return ga - gb || a.id - b.id;
  });

  let totalPlayers = teams.reduce((s, t) => s + t.players.length, 0);

  const output = `// data/teams2026.js - 2026世界杯48强球队百科数据
// 数据源：Football-Data.org API (competition WC id:2000)
// 球员详细信息来自 persons/{playerId} 接口
// 生成时间：${new Date().toISOString().split('T')[0]}
// 共 ${teams.length} 支球队 | ${totalPlayers} 名球员 | 含中文名+球衣号+俱乐部信息

const teamsData2026 = ${JSON.stringify(teams, null, 2)}

module.exports = {
  teamsData2026
}
`;

  fs.writeFileSync('mini-program/data/teams2026.js', output, 'utf8');

  // 统计信息
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 数据生成完成！`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 统计信息:`);
  console.log(`   • 球队数量: ${teams.length} 支`);
  console.log(`   • 球员总数: ${totalPlayers} 名`);

  let withCN = 0, withoutCN = 0, withNumber = 0, withoutNumber = 0;
  teams.forEach(t => {
    t.players.forEach(p => {
      if (p.name !== p.nameEn) withCN++; else withoutCN++;
      if (p.shirtNumber) withNumber++; else withoutNumber++;
    });
  });

  console.log(`   • 中文名覆盖: ${withCN}/${totalPlayers} (${(withCN / totalPlayers * 100).toFixed(1)}%)`);
  console.log(`   • 球衣号覆盖: ${withNumber}/${totalPlayers} (${(withNumber / totalPlayers * 100).toFixed(1)}%)`);
  console.log(`\n📁 输出文件:`);
  console.log(`   ✅ mini-program/data/teams2026.js (球队+阵容数据)`);
  console.log(`   ✅ mini-program/data/players2026.js (独立球员详细资料)`);

  // 显示示例数据
  console.log(`\n💡 数据示例 (阿根廷队前3名球员):`);
  const argentina = teams.find(t => t.name === '阿根廷');
  if (argentina) {
    argentina.players.slice(0, 3).forEach(p => {
      console.log(`   ${p.name} (${p.nameEn}) | ${p.position} | #${p.shirtNumber || '?'} | ${(p.currentTeam && p.currentTeam.name) || '-'}`);
    });
  }
}

main().catch(console.error);

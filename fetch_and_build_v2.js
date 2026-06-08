// fetch_players_detail.js - 批量获取所有球员详细信息 + 中文名映射
const fs = require('fs');
const https = require('https');
const http = require('http');

// 读取已有球队数据
const rawData = fs.readFileSync('tmp_teams.json', 'utf8').replace(/^\uFEFF/, '');
const apiData = JSON.parse(rawData);

// ===== 球员中文名映射（知名球员 + 常见名字翻译规则）=====
// 格式: "英文全名" 或 "lastName" -> 中文名
const playerCNNames = {
  // === 乌拉圭 ===
  'Fernando Muslera': '费尔南多·穆斯莱拉',
  'Sergio Rochet': '塞尔希奥·罗切特',
  'Santiago Mele': '圣地亚哥·梅莱',
  'Guillermo Varela': '吉列尔莫·巴雷拉', // 注意与G. Varela区分
  'Ronald Araújo': '罗纳德·阿劳霍',
  'Sebastián Cáceres': '塞巴斯蒂安·卡塞雷斯',
  'Matías Viña': '马蒂亚斯·比尼亚',
  'Joaquín Piquerez': '华金·皮克雷斯',
  'Maximiliano Araújo': '马克西米利亚诺·阿劳霍',
  'Mathías Olivera': '马蒂亚斯·奥利韦拉',
  'Santiago Bueno': '圣地亚哥·布埃诺',
  'José Giménez': '何塞·希门尼斯',
  'Federico Valverde': '费德里科·巴尔韦德',
  'Giorgian De Arrascaeta': '乔里亚德·阿拉斯凯塔',
  'Rodrigo Bentancur': '罗德里戈·本坦库尔',
  'Manuel Ugarte': '曼努埃尔·乌加特',
  'Brian Rodríguez': '布莱恩·罗德里格斯',
  'Rodrigo Zalazar': '罗德里戈·萨拉扎尔',
  'Facundo Pellistri': '法昆多·佩利斯特里',
  'Emiliano Martínez': '埃米利亚诺·马丁内斯', // 中场那个
  'Juan Sanabria': '胡安·萨纳布里亚',
  'Nicolas de la Cruz': '尼古拉斯·德拉克鲁斯',
  'Rodrigo Aguirre': '罗德里戈·阿吉雷',
  'Darwin Núñez': '达尔文·努涅斯',
  'Agustín Canobbio': '古斯丁·卡诺维奥',
  'Federico Viñas': '费德里科·维尼亚斯',
  
  // === 德国 ===
  'Manuel Neuer': '曼努埃尔·诺伊尔',
  'Oliver Baumann': '奥利弗·鲍曼',
  'Mark Flekken': '马克·弗莱肯',
  'Waldemar Anton': '瓦尔德马尔·安东',
  'Niklas Süle': '尼科拉斯·聚勒',
  'Jonathan Tah': '乔纳森·塔赫',
  'Antonio Rüdiger': '安东尼奥·吕迪格',
  'David Raum': '大卫·拉姆',
  'Joshua Kimmich': '约书亚·基米希',
  'Robert Andrich': '罗伯特·安德里希',
  'Pascal Groß': '帕斯卡尔·格罗斯',
  'Jamal Musiala': '贾迈勒·穆西亚拉',
  'Florian Wirtz': '弗洛里安·维尔茨',
  'Leroy Sané': '勒鲁瓦·萨内',
  'Kai Havertz': '凯·哈弗茨',
  'Thomas Müller': '托马斯·穆勒',
  'Deniz Undav': '丹尼斯·翁达夫',
  'Maximilian Beier': '马克西米利安·拜尔',
  'Tim Kleindienst': '廷·克莱因丁斯特',
  'Nick Woltemade': '尼克·沃尔特马德',

  // === 西班牙 ===
  'Unai Simón': '乌奈·西蒙',
  'David Raya': '戴维·拉亚',
  'Álex Remiro': '亚历克斯·雷米罗',
  'Dani Carvajal': '丹尼·卡瓦哈尔',
  'Daniel Vivian': '丹尼尔·维维安',
  'Aymeric Laporte': '艾梅里克·拉波尔特',
  'Robin Le Normand': '罗宾·勒诺尔芒',
  'Marcos Llorente': '马科斯·略伦特',
  'Martin Zubimendi': '马丁·苏维门迪',
  'Fabian Ruiz': '法比安·鲁伊斯',
  'Mikel Merino': '梅克尔·梅里诺',
  'Pedri': '佩德里',
  'Lamine Yamal': '拉明·亚马尔',
  'Nico Williams': '尼科·威廉姆斯',
  'Dani Olmo': '达尼·奥尔莫',
  'Morata': '莫拉塔',
  'Joselu': '何塞卢',
  'Ayoze Pérez': '阿尤泽·佩雷斯',
  'Bryan Gil': '布赖恩·希尔',
  'Álvaro Morata': '阿尔瓦罗·莫拉塔',
  'Mikel Oyarzabal': '梅克尔·奥亚萨瓦尔',

  // === 阿根廷 ===
  'Emiliano Martínez D': '埃米利亚诺·马丁内斯',
  'Gerónimo Rulli': '赫罗尼莫·鲁利',
  'Franco Armani': '弗兰科·阿尔马尼',
  'Nahuel Molina': '纳韦尔·莫利纳',
  'Gonzalo Montiel': '冈萨洛·蒙铁尔',
  'Cristian Romero': '克里斯蒂安·罗梅罗',
  'Lisandro Martínez': '利桑德罗·马丁内斯',
  'Nicolás Otamendi': '尼古拉斯·奥塔门迪',
  'Marcos Acuña': '马科斯·阿库尼亚',
  'Nicolás Tagliafico': '尼古拉斯·塔利亚菲科',
  'Leandro Paredes': '莱安德罗·帕雷德斯',
  'Rodrigo De Paul': '罗德里戈·德保罗',
  'Enzo Fernández': '恩佐·费尔南德斯',
  'MacAllister': '麦卡利斯特',
  'Alexis Mac Allister': '阿历克斯·麦卡利斯特',
  'Ezequiel Palacio': '埃塞基耶尔·帕拉西奥斯',
  'Giovani Lo Celso': '乔瓦尼·洛塞尔索',
  'Lionel Messi': '莱昂内尔·梅西',
  'Julián Álvarez': '胡利安·阿尔瓦雷斯',
  'Ángel Di María': '安赫尔·迪马利亚',
  'Lautaro Martínez': '劳塔罗·马丁内斯',
  'Nicolás González': '尼古拉斯·冈萨雷斯',
  'Paulo Dybala': '保罗·迪巴拉',
  'Valentín Carboni': '瓦伦丁·卡尔博尼',
  'Thiago Almada': '蒂亚戈·阿尔马达',

  // === 巴西 ===
  'Alisson Becker': '阿利松·贝克尔',
  'Ederson Moraes': '埃德森·莫赖斯',
  'Bento': '本托',
  'Danilo Luiz': '达尼洛·路易斯',
  'Marquinhos': '马尔基尼奥斯',
  'Thiago Silva': '蒂亚戈·席尔瓦',
  'Iban Marques': '伊万·马克斯',
  'Casemiro': '卡塞米罗',
  'Bruno Guimarães': '布鲁诺·吉马良斯',
  'Lucas Paquetá': '卢卡斯·帕奎塔',
  'João Gomes': '若昂·戈麦斯',
  'Raphinha': '拉菲尼亚',
  'Vinícius Júnior': '维尼修斯',
  'Rodrygo Goes': '罗德里戈',
  'Endrick': '恩德里克',
  'Gabriel Jesus': '热苏斯',
  'Gabriel Barbosa': '加布里埃尔·巴尔博萨',
  'Everson': '埃韦尔松',
  'Paquetá': '帕奎塔',

  // === 葡萄牙 ===
  'Rui Patrício': '鲁伊·帕特里西奥',
  'Diogo Costa': '迪奥戈·科斯塔',
  'José Sá': '何萨',
  'Pepe': '佩佩',
  'Rúben Dias': '鲁本·迪亚斯',
  'Danilo Pereira': '达尼洛·佩雷拉',
  'João Cancelo': '若昂·坎塞洛',
  'Nuno Mendes': '努诺·门德斯',
  'Diogo Dalot': '迪奥戈·达洛特',
  'Vitinha': '维蒂尼亚',
  'Bruno Fernandes': '布鲁诺·费尔南德斯',
  'João Palhinha': '若昂·帕利尼亚',
  'Bernardo Silva': '贝尔纳多·席尔瓦',
  'Rafael Leão': '拉斐尔·莱奥',
  'Cristiano Ronaldo': '克里斯蒂亚诺·罗纳尔多',
  'João Félix': '若昂·菲利克斯',
  'Rafael Leao': '拉斐尔·莱奥',
  'Gonçalo Ramos': '贡萨洛·拉莫斯',
  'Pedro Neto': '佩德罗·内托',
  'Francisco Conceição': '弗朗西斯科·孔塞桑',

  // === 法国 ===
  'Mike Maignan': '麦克·迈尼昂',
  'Brice Samba': '布里斯·桑巴',
  'Alphonse Areola': '阿方斯·阿雷奥拉',
  'Jonathan Clauss': '乔纳森·克劳斯',
  'Dayot Upamecano': '达约·于帕梅卡诺',
  'William Saliba': '威廉·萨利巴',
  'Ferland Mendy': '费兰·门迪',
  'Theo Hernandez': '特奥·埃尔南德斯',
  'Benjamin Pavard': '邦雅曼·帕瓦尔',
  'Aurélien Tchouaméni': '奥雷利安·楚阿梅尼',
  'Adrien Rabiot': '阿德里安·拉比奥',
  'Eduardo Camavinga': '爱德华多·卡马文加',
  'Antoine Griezmann': '安托万·格列兹曼',
  'Ousmane Dembélé': '乌斯曼·登贝莱',
  'Kingsley Coman': '金斯利·科曼',
  'Kylian Mbappé': '基利安·姆巴佩',
  'Marcus Thuram': '马库斯·图拉姆',
  'Michael Olise': '迈克尔·奥利塞',
  'Randal Kolo Muani': '兰达尔·科洛·穆阿尼',
  'Bradley Barcola': '布拉德利·巴尔科拉',
  'Jean-Philippe Mateta': '让-菲利普·马特塔',

  // === 英格兰 ===
  'Jordan Pickford': '乔丹·皮克福德',
  'Aaron Ramsdale': '阿伦·拉姆斯代尔',
  'James Trafford': '詹姆斯·特拉福德',
  'Kyle Walker': '凯尔·沃克',
  'John Stones': '约翰·斯通斯',
  'Marc Guéhi': '马克·盖希',
  'Kieran Trippier': '基兰·特里皮尔',
  'Bukayo Saka': '布卡约·萨卡',
  'Declan Rice': '德克兰·赖斯',
  'Jude Bellingham': '裘德·贝林厄姆',
  'Conor Gallagher': '康纳·加拉格尔',
  'Phil Foden': '菲尔·福登',
  'Cole Palmer': '科尔·帕尔默',
  'Harry Kane': '哈里·凯恩',
  'Ivan Toney': '伊万·托尼',
  'Ollie Watkins': '奥利·沃特金斯',
  'Anthony Gordon': '安东尼·戈登',
  'Jarrod Bowen': '贾罗德·鲍恩',
  'Dominic Solanke': '多米尼克·索兰克',
  'Eberechi Eze': '埃贝雷奇·埃泽',
  'Adam Wharton': '亚当·沃顿',
  'Lewis Dunk': '刘易斯·邓克',

  // === 荷兰 ===
  'Bart Verbruggen': '巴尔特·费布鲁亨',
  'Mark Flekken2': '马克·弗莱肯',
  'Justin Bijlow': '贾斯廷·比尔洛',
  'Lutsharel Geertruida': '卢特拉尔·格尔特鲁伊达',
  'Matthijs de Ligt': '马泰斯·德利赫特',
  'Virgil van Dijk': '维吉尔·范戴克',
  'Nathan Aké': '内森·阿克',
  'Jeremie Frimpong': '杰里米·弗林蓬',
  'Georginio Wijnaldum': '焦尔吉尼奥·威纳尔杜姆',
  'Tijjani Reijnders': '蒂贾尼·雷恩德斯',
  'Xavi Simons': '哈维·西蒙斯',
  'Cody Gakpo': '科迪·加克波',
  'Donyell Malen': '多内尔·马伦',
  'Brian Brobbey': '布赖恩·布罗比',
  'Joshua Zirkzee': '约书亚·齐尔克泽',
  'Wout Weghorst': '伍特·韦格霍斯特',
  'Steven Bergwijn': '史蒂文·贝尔温',
  'Ryan Gravenberch': '瑞安·格拉芬贝赫',
  'Joey Veerman': '乔伊·费尔曼',
  'Memphis Depay': '孟菲斯·德佩',

  // === 日本 ===
  'Shūichi Gonda': '权田修一',
  'Daniel Schmidt': '丹尼尔·施密特',
  'Ayumu Kitamura': 'Kitamura Ayumu',
  'Hiroki Itō':伊藤洋辉',
  'Takehiro Tomiyasu': 富安健洋',
  'Ko Itakura': 板仓滉',
  'Daizen Maeda': 前田大然',
  'Kaoru Mitoma': 三笘薰',
  'Takefusa Kubo': 久保建英',
  'Ao Tanaka': 田中碧',
  'Wataru Endō': 远藤航',
  'Ritsu Dōan': 堂安律',
  'Junya Ito': 伊东纯也',
  'Takumi Minamino': 南野拓实',
  'Daichi Kamada': 镰田大地',
  'Ayase Ueda': 上田绮世',
  'Yuya Osako': 大迫勇也',
  'Reo Hatate': 旗手怜央',
  'Kohei Kato': 加藤弘将',
  'Machida Seiya': 町野修斗',

  // === 克罗地亚 ===
  'Dominik Livaković': '多米尼克·利瓦科维奇',
  'Ivica Ivušić': '伊维察·伊武西奇',
  'Josip Juranović': '约西普·尤拉诺维奇',
  'Joško Gvardiol': '约什科·格瓦迪奥尔',
  'Dejan Lovren': '德扬·洛夫伦',
  'Mateo Kovačić': '马特奥·科瓦契奇',
  'Marcelo Brozović': '马塞洛·布罗佐维奇',
  'Luka Modrić': '卢卡·莫德里奇',
  'Mateo Kovačić2': '马特奥·科瓦契奇',
  'Ivan Perišić': '伊万·佩里西奇',
  'Andrej Kramarić': '安德烈·克拉马里奇',
  'Bruno Petković': '布鲁诺·彼得科维奇',
  'Ivan Pušić': '伊万·普希奇',
  'Nikola Vlašić': '尼古拉·弗拉西奇',
  'Lovro Majer': '洛夫罗·马耶尔',
  'Mario Pašalić': '马里奥·帕沙利奇',
  'Martin Erlić': '马丁·埃rlic',
  'Marin Pongračić': '马林·庞格拉契奇',

  // === 挪威 ===
  'Orjan Nyland': '厄扬·尼兰',
  'Kepa Arrizabalaga': '凯帕·阿里萨瓦拉加',
  'Ståle Solbakken': '斯塔勒·索尔巴肯',
  'Erling Haaland': '厄林·哈兰德',
  'Martin Ødegaard': '马丁·厄德高',
  'Ola Solbakken': '奥拉·索尔巴肯',
  'Julian Ryersen': '朱利安·吕瑟恩',
  'Leo Ostigard': '莱奥·斯蒂加德',
  'Morten Thorsby': '莫滕·托斯比',
  'Sander Berge': '桑德·贝格',
  'Fredrik Bjørkan': '弗雷德里克·比约坎',
  'Alexander Sørloth': '亚历山大·索尔洛特',
  'Antonio Nosa': '安东尼奥·诺萨',
  'Jørgen Strand Larsen': '于尔根·斯特兰·拉森',
  'Kristoffer Ajer': '克里斯托弗·阿耶尔',
  'Jonas Svensson': '约纳斯·文德森',

  // === 比利时 ===
  'Thomas Kaminski': '托马斯·明斯基',
  'Casteels': '卡斯特尔斯',
  'Thomas Meunier': '托马斯·默尼耶',
  'Toby Alderweireld': '托比·阿尔德韦雷尔德',
  'Jan Vertonghen': '扬·费尔通亨',
  'Timothy Castagne': '蒂莫西·卡斯泰涅',
  'Arthur Vermeeren': '阿图尔·费尔梅伦',
  'Amadou Onana': '阿马杜·奥纳纳',
  'Kevin De Bruyne': '凯文·德布劳内',
  'Youri Tielemans': '尤里·蒂勒曼斯',
  'Orel Mangala': '奥雷尔·曼加拉',
  'Charles De Ketelaere': '查尔斯·德凯特拉雷',
  'Romelu Lukaku': '罗梅卢·卢卡库',
  'Dennis Praet': '丹尼斯·普拉埃特',
  'Jérémy Doku': '杰里米·多库',
  'Loïs Openda': '洛伊·奥彭达',
  'Johan Bakayoko': ' Johan 巴卡约科',
  'Yannick Carrasco': '扬尼克·卡拉斯科',
  'Axel Witsel': '阿克塞尔·维特塞尔',
  'Leander Dendoncker': '利安德·邓东克尔',
  'Dodi Lukebakio': '多迪·卢克巴吉奥',
  'André Frank Zambo Anguissa': '安德烈·弗兰克·赞博·安圭萨',

  // === 美国 ===
  'Matt Turner': '马特·特纳',
  'Sean Johnson': '肖恩·约翰逊',
  'Zack Steffen': '扎克·斯特芬',
  'Chris Richards': '克里斯·理查兹',
  'Tim Ream': '蒂姆·里姆',
  'Sergiño Dest': '塞尔吉尼奥·德斯特',
  'Yunus Musah': '尤努斯·穆萨',
  'Tyler Adams': '泰勒·亚当斯',
  'Gio Reyna': '吉奥·雷纳',
  'Christian Pulisic': '克里斯蒂安·普利西奇',
  'Timothy Weah': '蒂莫西·维阿',
  'Haji Wright': '哈吉·赖特',
  'Fabián Acosta': '法比安·阿科斯塔',
  'Jesus Ferreira': '热苏斯·费雷拉',
  'Ricardo Pepi': '里卡多·佩皮',
  'Brenden Aaronson': '布伦登·阿隆森',
  'Cameron Carter-Vickers': '卡梅伦·卡特-维克斯',
  'Walker Zimmerman': '沃克·齐默尔曼',
  'Antonee Robinson': '安托尼·罗宾逊',
  'Luca de la Torre': '卢卡·德拉托雷',
  'Malik Tillman': '马利克·蒂尔曼',
  'Balázs Dzsudzsák': '鲍拉日什·德祖萨克',

  // === 韩国 ===
  'Cho Hyun-woo': '赵贤祐',
  'Kim Seung-gyu': '金承奎',
  'Song Bum-keun': '宋范根',
  'Kim Young-kwon': '金玟哉',
  'Kim Min-jae': '金玟哉',
  'Kim Ju-hyeon': '周俊旼',
  'Son Heung-min': '孙兴慜',
  'Lee Kang-in': '李刚仁',
  'Hwang Hee-chan': '黄喜灿',
  'Hwang Ui-jo': '黄义助',
  'Jo Gue-sung': '曹圭成',
  'Lee Jae-sung': '李在城',
  'Park Yong-woo': '朴镛宇',
  'Yang Hyun-jun': '杨俊贤',
  'Baek Seung-ho': '承浩白',
  'Oh Hyeon-gyu': '吴贤圭',
  'Bae Jun-ho': '裴俊浩',
  'Jeong Woo-yeong': '郑又荣',
  'Hong Hyun-gok': '洪铉国',
  'Moon Seon-min': '文宣民',

  // === 墨西哥 ===
  'Guillermo Ochoa': '吉列尔莫·奥乔亚',
  'Carlos Acevedo': '卡洛斯·阿塞韦多',
  'Jesús Gallardo': '赫苏斯·加拉尔多',
  'César Montes': '塞萨尔·蒙特斯',
  'Johan Vásquez': '约翰·巴斯克斯',
  'Edson Álvarez': '埃德森·阿尔瓦雷斯',
  'Hirving Lozano': '埃尔文·洛萨诺',
  'Raúl Jiménez': '劳尔·希门尼斯',
  'Henry Martín': '亨利·马丁',
  'Alexis Vega': '亚历克西斯·维加',
  'Uriel Antuna': '乌列尔·安图纳',
  'Luis Chávez': '路易斯·查韦斯',
  'Érik Aguirre': '埃里克·阿吉雷',
  'Carlos Rodríguez': '卡洛斯·罗德里格斯',
  'Gerardo Arteaga': '热拉尔多·阿特亚加',
  'Julián Quiñones': '胡利安·基诺内斯',
  'Obed Peralta': '奥韦德·佩拉尔塔',
  'Jorge Sánchez': '豪尔赫·桑切斯',
  'Jorge Campos': '豪尔赫·坎波斯',
  'Guillermo Martínez': '吉列尔莫·马丁内斯',
  'Sebastián Cáceres2': '塞巴斯蒂安·卡塞雷斯',
  'Nestor Araujo': '内斯托尔·阿劳霍',
  'Luis Romo': '路易斯·罗莫',
  'Santiago Giménez': '圣地亚哥·希门尼斯',

  // === 瑞士 ===
  'Yann Sommer': '扬·索默',
  'Yvon Mvogo': '伊冯·姆沃戈',
  'Gregor Kobel': '格雷戈尔·科贝尔',
  'Manuel Akanji': '曼努埃尔·阿坎吉',
  'Fabian Schär': '法比安·舍尔',
  'Silvan Widmer': '西尔万·维德默',
  'Granit Xhaka': '格拉尼特·扎卡',
  'Remo Freuler': '雷莫·弗罗伊勒',
  'Xherdan Shaqiri': '谢尔丹·沙奇里',
  'Renato Steffen': '雷纳托·斯特芬',
  'Michel Aebischer': '米歇尔·埃比舍尔',
  'Noël Okkafor': '诺埃尔·奥卡福尔',
  'Breel Embolo': '布雷尔·恩博洛',
  'Steven Zuber': '史蒂文·祖贝尔',
  'Ruben Vargas': '鲁本·巴尔加斯',
  'Zeki Amdouni': '泽基·阿姆多尼',
  'Dan Ndoye': '丹·恩多耶',
  'Admir Mehmedi': '阿德米尔·梅赫梅迪',
  'Haris Seferovic': '哈里斯·塞费罗维奇',
  'Vincenzo Caceres': '文森佐·卡塞雷斯',
  'Ardon Jashari': '阿顿·亚沙里',

  // === 塞内加尔 ===
  'Édouard Mendy': '爱德华·门迪',
  'Alfred Gomis': '阿尔弗雷德·戈米斯',
  'Pape Matar Sarr': '帕佩·马塔尔·萨尔',
  'Cheikhou Kouyaté': '切赫库·库亚特',
  'Idrissa Gueye': '伊德里萨·盖耶',
  'Pape Sarr': '帕佩·萨尔',
  'Formose Mendy': '福尔摩斯·门迪',
  'Kalidou Koulibaly': '卡利杜·库利巴利',
  'Abdou Diallo': '阿卜杜·迪亚洛',
  'Fodé Ballo-Touré': '福代·巴洛-图雷',
  'Youssouf Sabaly': '尤素夫·萨巴利',
  'Nicolas Jackson': '尼古拉斯·杰克逊',
  'Krépin Diatta': '克雷平·迪亚塔',
  'Ismaïla Sarr': '伊斯梅拉·萨尔',
  'Habib Diarra': '哈比卜·迪阿拉',
  'Mame Biram Diouf': '马姆·比拉姆·迪乌夫',
  'Pape Matar Sarr2': '帕佩·马塔尔·萨尔',
  'Sadio Mané': '萨迪奥·马内',
  'Boulaye Dia': '布莱·迪亚',
  'Pathe Ciss': '帕特·西斯',
  'Iliman Ndiaye': '伊利曼·恩迪亚耶',
  'Lamine Camara': '拉明·卡马拉',
  'Moustapha Name': '穆斯塔法·纳姆',

  // === 沙特阿拉伯 ===
  'Mohammed Al-Rubaie': '穆罕默德·鲁拜耶',
  'Mohammed Al-Yami': '穆罕默德·亚米',
  'Fahad Al-Muwallad': '法赫德·穆瓦拉德',
  'Salem Al-Dawsari': ' Salem 达瓦萨里',
  'Saleh Al-Shehri': '萨利赫·谢赫里',
  'Firas Alburaikan': '菲拉斯·布赖坎',
  'Abdullah Al-Hamdan': '阿卜杜拉·哈姆丹',
  'Ali Al-Bulaihi': '阿里·布拉伊希',
  'Hassan Tambakti': '哈桑·坦巴克蒂',
  'Ali Al-Hassan': '阿里·哈桑',
  'Abdullah Al-Khaibari': '阿卜杜拉·海巴里',
  'Mohamed Kanno': '穆罕默德·卡诺',
  'Abdulellah Al-Malki': '阿卜杜勒拉赫·马尔基',
  'Sami Al-Najei': '萨米·纳杰',
  'Hussain Al-Eisa': '侯赛因·伊萨',

  // === 厄瓜多尔 ===
  'Hermes Moalex': '赫梅斯·莫亚历克斯',
  'Moisés Ramírez': '莫伊塞斯·拉米雷斯',
  'Alexander Domínguez': '亚历山大·多明格斯',
  'Byron Castillo': '拜伦·卡斯蒂略',
  'Félix Torres': '菲利克斯·托雷斯',
  'Pier Hincapié': '皮耶尔·因卡皮耶',
  'Puye Preciado': '普雷西亚多',
  'Enner Valencia': '恩纳·瓦伦西亚',
  'Moises Caicedo': '莫伊塞斯·凯塞多',
  'Jeremy Sarmiento': '杰雷米·萨米恩托',
  'Ángelo Preciado': '安赫洛·普雷西亚多',
  'Carlos Gruezo': '卡洛斯·格鲁埃索',
  'Alan Franco': '阿兰·佛朗哥',
  'Joan Pino': '华金·皮诺',
  'Eduardo Carvalho': '爱德华多·卡瓦略',
  'Gonzalo Plata': '贡萨洛·普拉塔',
  'Johnny Pardo': '约翰尼·帕尔多',
  'Leonardo Campana': '莱昂纳多·坎帕纳',
  'Jeremy Cevallos': '杰雷米·塞瓦略斯',
  'Djovan Anderson': '乔万·安德森',

  // === 土耳其 ===
  'Mert Günok': '梅尔特·居诺克',
  'Altay Bayındır': '阿尔泰·巴因德尔',
  'Uğurcan Çakır': '乌乌尔詹·恰克尔',
  'Ahmetcan Kaplan': '艾哈迈特坎·卡普兰',
  'Merih Demiral': '梅里赫·德米尔亚尔',
  'Samet Akaydin': '萨梅特·阿卡伊丁',
  'Zeki Çelik': '泽基·切利克',
  'Abdülkerim Bardakcı': '阿卜杜勒克里姆·巴尔达克哲',
  'Arda Güler': '阿尔达·居勒尔',
  'Orkun Kökçü': '奥尔昆·柯克曲',
  'Salih Özcan': '萨利赫·厄兹詹',
  'Hakan Çalhanoğlu': '哈坎·恰尔汗奥卢',
  'İrfan Can Kahveci': '伊尔凡·坎·卡赫韦奇',
  'Yunus Akgün': '云尼斯·阿克京',
  'Kerem Aktürkoğlu': '凯雷姆·阿克图尔科卢',
  'Barış Alper Yılmaz': '巴里斯·阿尔珀·勒马兹',
  'Cenk Tosun': '坚克·托顺',
  'Kenan Yıldız': '凯南·耶尔德兹',
  'Emre Demir': '埃姆雷·德米尔',
  'Semih Kılıçsoy': '塞米赫·克尔彻绍伊',
  'Mert Müldür': '梅尔特·米尔杜尔',
  'Yusuf Yazıcı': '优素福·亚泽哲',
  'Bertuğ Yıldırım': '贝图格·勒德勤',

  // === 澳大利亚 ===
  'Mathew Ryan': '马修·瑞安',
  'Joe Gauci': '乔·高奇',
  'Nathaniel Atelson': '纳撒尼尔·阿特尔森',
  'Harry Souttar': '哈里·苏塔',
  'Kye Rowles': '凯·罗尔斯',
  'Milos Degenek': '米洛斯·德格内克',
  'Aziz Behich': '阿齐兹·贝希奇',
  'Graham Arnold': '格雷厄姆·阿诺德',
  'Jackson Irvine': '杰克逊·欧文',
  'Harry Souttar2': '哈里·苏塔',
  'Aaron Mooy': '阿龙·穆伊',
  'Craig Goodwin': '克雷格·古德温',
  'Mitchell Duke': '米切尔·杜克',
  'Mathew Leckie': '马修·莱基',
  'Martin Boyle': '马丁·博伊尔',
  'Adam Taggart': '亚当·塔加特',
  'Garang Kuol': '加兰·库奥尔',
  'Jason Cummings': '杰森·卡明斯',
  'Brandon Borrello': '布兰登·博雷洛',
  'Marco Tilio': '马尔科·提利奥',
  'Kye Rowles2': '凯·罗尔斯',
  'Connor Metcalfe': '康纳·梅特卡尔夫',
  'Gianni Stensness': '詹尼·斯滕斯内斯',
  'Jordan Bos': '乔丹·博斯',
  'Lewis Miller': '刘易斯·米勒',

  // === 新西兰 ===
  'Sasha Marinovic': '萨沙·马里诺维奇',
  'Chris Wood': '克里斯·伍德',
  'Marco Rojas': '马尔科·罗哈斯',
  'Liberato Cacace': '利伯拉托·卡卡切',
  'Bill Tuiloma': '比尔·图伊洛马',
  'Joe Bell': '乔·贝尔',
  'Matthew Garbett': '马修·加贝特',
  'Kenny Dougain': '肯尼·杜甘',
  'Ben Old': '本·奥尔德',
  'Caleb Watts': '凯莱布·沃茨',
  'Khai Wells': '凯·韦尔斯',
  'Liberato Cacace2': '利伯拉托·卡卡切',
  'Wood2': '克里斯·伍德',
  'Storm Roux': '斯托姆·鲁克斯',
  'Sam Sutton': '萨姆·萨顿',
  'Michael Boxall': '迈克尔·博克萨尔',
  'Gianni Stensness2': '詹尼·斯滕斯内斯',
  'Max Mata': '马克斯·马塔',
  'Ben Waine': '本·韦恩',
  'Kip Povey': '基普·波维',
  'Sarpreet Singh': '萨普里特·辛格',
  'Finn Surman': '芬·瑟曼',
  'Matt Conroy': '马特·康罗伊',
  'Lachlan Bayliss': '拉克兰·贝利斯',
  'Jesse Randall': '杰西·兰德尔',

  // === 瑞典 ===
  'Robin Olsen': '罗宾·奥尔森',
  'Jacob Riley-Wahl': '雅各布·赖利-瓦尔',
  'Johan Dahlin': '约翰·达林',
  'Joel Andersson': '乔尔·安德松',
  'Emil Forsberg': '埃米尔·福斯贝里',
  'Victor Gyökeres': '维克托·哲凯赖什',
  'Alexander Isak': '亚历山大·伊萨克',
  'Anthony Elanga': '安东尼·埃兰加',
  'Dejan Kulusevski': '德扬·库卢塞夫斯基',
  'Kristoffer Olman': '克里斯托弗·奥尔曼',
  'Mikael Lustig': '米凯尔·卢斯蒂格',
  'Marcus Danielson': '马库斯·丹尼尔松',
  'Ludwig Augustinsson': '路德维格·奥古斯丁松',
  'Jesper Karlström': '耶斯珀·卡尔斯特伦',
  'Anthony Elanga2': '安东尼·埃兰加',
  'Robin Quaison': '罗宾·夸伊森',
  'Samuel Gustafson': '萨缪埃尔·古斯塔夫松',
  'Sebastian Larsson': '塞巴斯蒂安·拉尔松',
  'Jens Cajuste': '延斯·卡于斯特',
  'Lucas Hedlund': '卢卡斯·赫德隆',
  'Carl Starfelt': '卡尔·斯塔费尔特',
  'Elias Kolevsohn': '埃利亚斯·科莱夫松',
  'Joel Asoro': '乔尔·阿索罗',
  'Oladapo-Bankola Okomayin': '奥拉达波-班科拉·奥科马茵',

  // === 捷克 ===
  'Jindřich Staněk': '金德里赫·斯塔内克',
  'Matej Kovář': '马捷·科瓦日',
  'Václav Černý': '瓦茨拉夫·切尔尼',
  'Tomáš Holeš': '托马斯·霍莱什',
  'David Zima': '戴维·齐马',
  'David Doudera': '戴维·杜德拉',
  'Tomáš Souček': '托马斯·索切克',
  'Ladislav Krejčí': '拉迪斯拉夫·克雷伊奇',
  'Vladimír Coufal': '弗拉季米尔·考法尔',
  'Patrik Schick': '帕特里克·希克',
  'Adam Hložek': '亚当·赫洛热克',
  'Antonín Barák': '安东宁·巴拉克',
  'Tomáš Čvančara': '托马斯·昌卡拉',
  'Jan Kuchta': '扬·库赫塔',
  ' Pavel Šulc': '帕维尔·舒尔茨',
  'Čermák': '切尔马克',
  'Matěj Jurásek': '马捷·尤拉塞克',
  'Michal Sadílek': '米哈尔·萨迪莱克',
  'Lukáš Provod': '卢卡什·普罗沃德',
  'David Pavlenka': '戴维·帕夫连卡',
  'Mojmír Chytil': '莫伊米尔·希蒂尔',
  'Václav Černý2': '瓦茨拉夫·切尔尼',
  'Petr Čech': '彼得·切赫',
  'Tomáš Kalas': '托马斯·卡拉斯',
  'Ondřej Kolář': '翁德烈·科拉日',
  'Jakub Jankto': '雅各布·扬克托',
  'Pavel Kadeřábek': '帕维尔·卡德莱别克',

  // === 波黑 ===
  'Ibrahim Šehić': '易卜拉欣·舍希奇',
  'Kenan Pirić': '肯南·皮里奇',
  'Edin Džeko': '埃丁·哲科',
  'Miralem Pjanić': '米拉lem·皮亚尼奇',
  'Sead Kolašinac': '塞德·科拉希纳茨',
  'Anel Ahmedhodžić': '阿内尔·艾哈迈德霍季奇',
  'Amer Gojak': '阿梅尔·戈亚克',
  'Edin Višća': '埃丁·维什恰',
  'Smail Prevljak': '斯迈尔·普雷夫利亚克',
  'Ermin Bičakčić': '埃尔明·比察克契奇',
  'Admir Mehmedi': '阿德米尔·梅赫梅迪',
  'Luka Menalo': '卢卡·梅纳洛',
  'Tomáš Souček': '托马斯·索切克',

  // === 卡塔尔 ===
  'Meshaal Barsham': '马夏尔·巴沙姆',
  'Yousuf Butti': '优素福·布蒂',
  'Homam Ahmed': '霍曼·艾哈迈德',
  'Tareq Salman': '塔里克·萨尔曼',
  'Boualem Khoukhi': '布阿莱姆·胡希',
  'Assim Madibo': '阿西姆·马迪博',
  'Akram Afif': '阿克拉姆·阿菲夫',
  'Almoez Ali': '阿尔莫埃斯·阿里',
  'Mohammed Muntari': '穆罕默德·蒙塔里',
  'Ahmad Hassan': '艾哈迈德·哈桑',
  'Ismail Mohamad': '伊斯梅尔·穆罕默德',
  'Mustafa Mashal': '穆斯塔法·马沙尔',
  'Sultan Adil': '苏丹·阿迪勒',
  'Abdulaziz Hatem': '阿卜杜勒阿齐兹·哈特姆',
  'Jassim Al-Jaber': '贾西姆·贾贝尔',
  'Abdelkarim Hassan': '阿卜杜勒卡里姆·哈桑',
  'Pedro Miguel': '佩德罗·米格尔',
  'Karim Boudiaf': '卡里姆·布迪亚夫',
  'Ali Afif': '阿里·阿菲夫',

  // === 加拿大 ===
  'Dayne St. Clair': '戴恩·圣克莱尔',
  'James Pantemis': '詹姆斯·潘特米斯',
  'Maxime Crépeau': '马克西姆·克雷波',
  'Alphonso Davies': '阿方索·戴维斯',
  'Alistair Johnston': '阿利斯泰尔·约翰斯顿',
  'Samuel Piette': '萨缪尔·皮埃特',
  'Stephen Eustaquio': '斯蒂芬·欧斯塔基奥',
  'Jonathan Osorio': '乔纳森·奥索里奥',
  'Richie Laryea': '里奇·拉里亚',
  'Tajon Buchanan': '塔琼·布坎南',
  'Cyle Larin': '赛勒·拉林',
  'Jonathan David': '乔纳森·戴维',
  'Ike Ugbo': '伊克·乌格博',
  'Jacen Russell-Rowe': '贾森·拉塞尔-罗',
  'Daniel Paraiso': '达尼埃尔·帕莱索',
  'Jacob Shaffelburg': '雅各布·沙费尔伯格',
  'Kamal Miller': '卡迈勒·米勒',
  'Derek Cornelius': '德里克·科尼利厄斯',
  'Mark-Anthony Kaye': '马克-安东尼·凯',
  'Junior Hoilett': '朱尼尔·霍伊莱特',
  'Kyle Hines': '凯尔·海因斯',

  // === 海地 ===
  'Alexandre Pierre': '亚历山大·皮埃尔',
  'Jhonny Placide': '约翰尼·普拉西德',
  'Jules Philomon': '朱尔斯·菲洛蒙',
  'Montruil Andre-Pierre': '蒙特勒伊·安德烈-皮埃尔',
  'Dany Lapointe': '达尼·拉普安特',
  'Lorentz Béranger': '洛朗茨·贝朗热',
  'Donald Guerrier': '唐纳德·格里耶',
  'Mechack Jerome': '梅查克·杰罗姆',
  'Patrick Burner': '帕特里克·伯纳',
  'Andrew Jean-Louis': '安德烈·让-路易',
  'Danelly Cadet': '达内利·卡德',
  'Frandy Pierrot': '弗兰迪·皮耶罗',
  'Duckens Nazon': '迪肯·纳宗',
  'Hervé Batomaila': '埃尔韦·巴托迈拉',
  'Mackendy Pierre': '麦肯迪·皮埃尔',
  'Wilfried Moïse': '威尔弗里德·穆瓦斯',
  'Ricardo Adé': '里卡多·阿德',
  'Kerry Dessources': '凯里·德苏尔斯',
  'Jeamie Marcellin': '杰米·马塞林',
  'Louis Delmas': '路易·德尔马斯',

  // === 伊朗 ===
  'Alireza Beiranvand': '阿里雷扎·贝兰万德',
  'Amir Abedzadeh': '阿米尔·阿贝扎德',
  'Payam Niazmand': '帕亚姆·尼亚兹曼德',
  'Saeid Ezatolahi': '赛义德·埃扎托拉希',
  'Mehdi Ghayedi': '迈赫迪·盖耶迪',
  'Shoja Khalilzadeh': '舒贾·哈利勒扎德',
  'Sadegh Moharrami': '萨德gh·莫哈拉米',
  'Mehdi Taremi': '迈赫迪·塔雷米',
  'Mehdi Ghayedi2': '迈赫迪·盖耶迪',
  'Alireza Jahanbakhsh': '阿里雷扎·贾汉巴赫什',
  'Saman Ghoddos': '萨曼·古多斯',
  'Karim Ansarifard': '卡里姆·安萨里法德',
  'Sardar Azmoun': '萨达尔·阿兹蒙',
  'Mojtaba Mirzajanpour': '穆杰塔巴·米尔扎詹普尔',
  'Omid Ebrahimi': '奥米德·埃卜拉希米',
  'Ehsan Hajsafi': '埃桑·哈吉萨菲',
  'Roozbeh Cheshmi': '鲁兹贝赫·切什米',
  'Noorollah Eskandari': '努罗拉·伊斯坎达里',

  // === 巴拿马 -->
  'Luis Mejía': '路易斯·梅希亚',
  'Cecil Waters': '塞西尔·沃特斯',
  'Fidel Escobar': '菲德尔·埃斯科瓦尔',
  'Michael Murillo': '迈克尔·穆里略',
  'Cristian Martínez': '克里斯蒂安·马丁内斯',
  'Adalberto Carrasquilla': '阿达尔韦托·拉斯奎利亚',
  'Anibal Godoy': '阿尼瓦尔·戈多伊',
  'Eric Davis': '埃里克·戴维斯',
  'Cecilio Waterman': '塞西利奥·沃特曼',
  'Yoel Bárcenas': '约埃尔·巴尔塞纳斯',
  'José Farris': '何塞·法里斯',
  'Edgar Bárcenas': '埃德加尔·巴尔塞纳斯',
  'Ismael Díaz': '伊斯梅尔·迪亚斯',
  'Cesar Blackman': '塞萨尔·布莱克曼',
  'Rolando Blackburn': '罗兰多·布莱克伯恩',
  'José Luis Rodríguez': '何塞·路易斯·罗德里格斯',
  'Michael Murillo2': '迈克尔·穆里略',
  'Luis Mejía2': '路易斯·梅希亚',

  // === 哥伦比亚 ===
  'David Ospina': '戴维·奥斯皮纳',
  'Camilo Vargas': '卡米洛·巴尔加斯',
  'Álvaro Montero': '阿尔瓦罗·蒙特罗',
  'Davinson Sánchez': '戴文森·桑切斯',
  'Carlos Cuesta': '卡洛斯·库埃斯塔',
  'Jhon Lucumí': '翁·卢库米',
  'Daniel Muñoz': '丹尼尔·穆尼奥斯',
  'Juan Cuadrado': '胡安·夸德拉多',
  'James Rodríguez': '哈梅斯·罗德里格斯',
  'Jefferson Lerma': '杰斐逊·勒马',
  'Richard Ríos': '理查德·里奥斯',
  'Mateus Uribe': '马特乌斯·乌里韦',
  'Luis Díaz': '路易斯·迪亚斯',
  'Rafael Santos Borré': '拉斐尔·桑托斯·博雷',
  'John Jader Durán': '哈德尔·杜兰',
  'Jhon Córdoba': '翁·科尔多瓦',
  'Luis Sinisterra': '路易斯·西斯内罗',
  'Miguel Borja': '米格尔·博尔哈',
  'Jhon Arias': '翁·阿里亚斯',
  'Cristian Arango': '克里斯蒂安·阿朗戈',
  'Johan Mojica': '约翰·莫希卡',
  'Santiago Moreno': '圣地亚哥·莫雷诺',
  'Falcao García': '法尔考·加西亚',

  // === 摩洛哥 -->
  'Yassine Bounou': '亚辛·布努',
  'Monir El Kajoui': '莫尼尔·卡朱伊',
  'Achraf Hakimi': '阿什拉夫·哈基米',
  'Nayef Aguerd': '纳耶夫·阿格尔德',
  'Romain Saiss': '罗曼·赛斯',
  'Youssef Aït Bennasser': '优素福·阿伊特·本纳塞尔',
  'Sofyan Amrabat': '索夫扬·阿姆拉巴特',
  'Hakim Ziyech': '哈基姆·齐耶赫',
  'Selim Amallah': '塞利姆·阿马拉',
  'Azzedine Ounahi': '阿兹丁·乌纳希',
  'Issa Kaboré': '伊萨·卡博雷',
  'Youssef En-Nesyri': '优素福·恩-内斯里',
  'Abde Ezzalzouli': '阿卜德·埃扎尔佐利',
  'Achraf Dari': '阿什拉夫·达里',
  'Walid Cheddira': '瓦利德·谢迪拉',
  'Amine Harit': '阿明·哈里特',
  'Bilal El Khannouss': '比拉勒·汉努斯',
  'Ismail Saibari': '伊斯梅尔·赛巴里',
  'Abdelhamid Sabiri': '阿卜杜勒哈米德·萨比里',
  'Yahya Attiat-Allah': '叶海亚·阿提亚特-阿拉',
  'Ryan Mmaee': '瑞安·马埃',
  'Jawhar El Yennaq': '贾瓦尔·埃耶纳克',
  'Chaibi El Yonnaq': '查比·埃约纳克',
  'Zakaria Aboukhlal': '扎卡里亚·阿布赫拉尔',
  'Achraf Hakimi2': '阿什拉夫·哈基米',

  // === 苏格兰 -->
  'Angus Gunn': '安格斯·冈恩',
  'Zander Clark': '赞德·克拉克',
  'Scott McKenna': '斯科特·麦肯纳',
  'Kieran Tierney': '基兰·蒂尔尼',
  'Andy Robertson': '安迪·罗伯逊',
  'Jack Hendry': '杰克·亨德里',
  'Grant Hanley': '格兰特·汉利',
  'Ryan Porteous': '瑞安·波特奥斯',
  'Callum McGregor': '卡勒姆·麦格雷戈',
  'Scott McTominay': '斯科特·麦克托米奈',
  'Billy Gilmour': '比利·吉尔摩',
  'Ryan Christie': '瑞安·克里斯蒂',
  'John McGinn': '约翰·麦金恩',
  'Lawrence Shankland': '劳伦斯·香克兰',
  'Che Adams': '切·亚当斯',
  'James Forrest': '詹姆斯·福雷斯特',
  'Stuart Armstrong': '斯图尔特·阿姆斯特朗',
  'Lewis Morgan': '刘易斯·摩根',
  'Ryan Jack': '瑞安·杰克',
  'Greg Taylor': '格雷格·泰勒',
  'Kenny McLean': '肯尼·麦克莱恩',
  'Ellis Simms': '埃利斯·西姆斯',
  'Tommy Conway': '汤米·康威',
  'Ben Doak': '本·多克',
  'James Tavernier': '詹姆斯·塔弗里耶',
  'Anthony Ralston': '安东尼·拉尔斯顿',

  // === 阿根廷2 (重复) ===
  'Geronimo Rulli2': '赫罗尼莫·鲁利',
  'Walter Benitez': '沃尔特·贝尼特斯',
  'Gonzalo Montiel2': '冈萨洛·蒙铁尔',
  'Nahuel Molina2': '纳韦尔·莫利纳',
  'Nicolas Otamendi2': '尼古拉斯·奥塔门迪',
  'German Pezzella': '赫尔曼·佩塞利亚',
  'Lisandro Martinez2': '利桑德罗·马丁内斯',
  'Nicolas Gonzalez2': '尼古拉斯·冈萨雷斯',
  'Marcos Acuña2': '马科斯·阿库尼亚',
  'Nicolás Tagliafico2': '尼古拉斯·塔利亚菲科',
  'Enzo Fernández2': '恩佐·费尔南德斯',
  'Leandro Paredes2': '莱安德罗·帕雷德斯',
  'Rodrigo De Paul2': '罗德里戈·德保罗',
  'Mac Allister2': '麦卡利斯特',
  'Exequiel Palacios': '埃塞基耶尔·帕拉西奥斯',
  'Alejandro Gomez': '亚历杭德罗·戈麦斯',
  'Lionel Messi2': '莱昂内尔·梅西',
  'Angel Di Maria2': '安赫尔·迪马利亚',
  'Julián Alvarez2': '胡利安·阿尔瓦雷斯',
  'Lautaro Martínez2': '劳塔罗·马丁内斯',
  'Nicolás González3': '尼古拉斯·冈萨雷斯',
  'Paulo Dybala2': '保罗·迪巴拉',
  'Valentin Carboni2': '瓦伦丁·卡尔博尼',
  'Nicolas Paz': '尼古拉斯·帕斯',
  'Thiago Almada2': '蒂亚戈·阿尔马达',
  'Giovani Lo Celso2': '乔瓦尼·洛塞尔索',

  // === 伊朗2 ===
  'Alireza Beiranvand2': '阿里雷扎·贝兰万德',
  'Amir Abedzadeh2': '阿米尔·阿贝扎德',
  'Payam Niazmand2': '帕亚姆·尼亚兹曼德',
  'Saeid Ezatolahi2': '赛义德·埃扎托拉希',
  'Mehdi Taremi2': '迈赫迪·塔雷米',
  'Saman Ghoddos2': '萨曼·古多斯',
  'Alireza Jahanbakhsh2': '阿里雷扎·贾汉巴赫什',
  'Karim Ansarifard2': '卡里姆·安萨里法德',
  'Sardar Azmoun2': '萨达尔·阿兹蒙',

  // === 塞内加尔2 ===
  'Edouard Mendy2': '爱德华·门迪',
  'Alfred Gomis2': '阿尔弗雷德·戈米斯',
  'Pape Matar Sarr3': '帕佩·马塔尔·萨尔',
  'Cheikhou Kouyaté2': '切赫库·库亚特',
  'Idrissa Gueye2': '伊德里萨·盖耶',
  'Kalidou Koulibaly2': '卡利杜·库利巴利',
  'Abdou Diallo2': '阿卜杜·迪亚洛',
  'Fodé Ballo-Touré2': '福代·巴洛-图雷',
  'Youssouf Sabaly2': '尤素夫·萨巴利',
  'Nicolas Jackson2': '尼古拉斯·杰克逊',
  'Krépin Diatta2': '克雷平·迪亚塔',
  'Ismaïla Sarr2': '伊斯梅拉·萨尔',
  'Habib Diarra2': '哈比卜·迪阿拉',
  'Sadio Mané2': '萨迪奥·马内',
  'Boulaye Dia2': '布莱·迪亚',
  'Pathe Ciss2': '帕特·西斯',
  'Iliman Ndiaye2': '伊利曼·恩迪亚耶',
  'Lamine Camara2': '拉明·卡马拉',
  'Moustafa Name2': '穆斯塔法·纳姆',

  // === 奥地利 ===
  'Heinz Lindner': '海因茨·林德纳',
  'Ranidl': '拉尼尔',
  'Pentz': '彭茨',
  'Florian Grillitsch': '弗洛里安·格里利奇',
  'Philipp Lienhart': '菲利普·林哈特',
  'St Posch': '施特·波施',
  'St Laimer': '施特·莱默尔',
  'Marcel Sabitzer': '马塞尔·萨比策',
  'Konrad Laimer': '康拉德·莱默尔',
  'Christoph Baumgartner': '克里斯托夫·鲍姆加特纳',
  'Friedrich Andreas': '弗里德里希·安德烈亚斯',
  'Marcel Sabitzer2': '马塞尔·萨比策',
  'Konrad Laimer2': '康拉德·莱默尔',
  'Christoph Baumgartner2': '克里斯托夫·鲍姆加特纳',
  'Florian Grillitsch2': '弗洛里安·格里利奇',
  'Philipp Lienhart2': '菲利普·林哈特',
  'St Posch2': '施特·波施',
  'St Laimer2': '施特·莱默尔',
  'Kevin Danso': '凯文·丹索',
  'Maximilian Entrep': '马克西米利安·恩特雷普',
  'Guido Burgstaller': '吉多·布尔格施塔勒',
  'Marko Arnautovic': '马尔科·阿尔瑙托维奇',
  'Michael Gregoritsch': '米夏埃尔·格雷戈里奇',
  'Roman Schiemann': '罗曼·席曼',
  'Patrick Pentz': '帕特里克·彭茨',
  'Heinz Lindner2': '海因茨·林德纳',
  'Ranidl2': '拉尼尔',
  'Pentz2': '彭茨',

  // === 埃及 ===
  'Mohamed El-Shennawy': '穆罕默德·谢纳维',
  'Ahmed El-Shenawy': '艾哈迈德·谢纳维',
  'Mohamed Abou Gabal Ali': '穆罕默德·阿布·贾巴尔·阿里',
  'Ali Gabr': '阿里·加布尔',
  'Ahmed Hegazi': '艾哈迈德·赫加齐',
  'Omar Kamal': '奥马尔·卡马尔',
  'Ahmed Fathy': '艾哈迈德·法希',
  'Taher Mohamed Taher': '塔赫尔·穆罕默德·塔赫尔',
  'Mohamed Abdelmonem': '穆罕默德·阿卜杜勒莫内姆',
  'Ashraf Hakimi': '阿什拉夫·哈基米',
  'Mahmoud Alaa': '马哈茂德·阿拉',
  'Ahmed Eid': '艾哈迈德·艾德',
  'Omar Marmoush': '奥马尔·马尔穆什',
  'Mostafa Mohamed': '穆斯塔法·穆罕默德',
  'Mohamed Sherif': '穆罕默德·谢里夫',
  'Trezeguet': '特雷泽盖',
  'Emam Ashour': '伊玛姆·阿舒尔',
  'Hamdy Fathy': '哈姆迪·法希',
  'Mahmoud Kahraba': '马哈茂德·卡拉巴',
  'Ramadan Sobhi': '拉马丹·苏卜希',
  'Akram Tawfik': '阿克拉姆·陶菲克',

  // === 加纳 -->
  'Richard Ofori': '理查德·奥福里',
  'Lawrence Ati-Zigi': '劳伦斯·阿蒂-齐吉',
  'Daniel Afriyie Barnieh': '丹尼尔·阿弗里耶·巴尔尼耶',
  'Jeffrey Schlupp': '杰弗里·施卢普',
  'Jeffrey Schlupp2': '杰弗里·施卢普',
  'Alexander Djiku': '亚历山大·吉库',
  'Tariq Lamptey': '塔里克·拉姆普泰',
  'Jeffrey Schlupp3': '杰弗里·施卢普',
  'Thomas Partey': '托马斯·帕泰',
  'Elisha Owusu': '伊丽莎·奥乌苏',
  'Mubarak Wakaso': '穆巴拉克·瓦卡索',
  'Salis Abdul Samed': '萨利斯·阿卜杜勒·萨梅德',
  'Inaki Williams': '伊纳基·威廉姆斯',
  'Mohammed Kudus': '穆罕默德·库杜斯',
  'Antoine Semenyo': '安托万·塞梅纽',
  'Jordan Ayew': '乔丹·阿尤',
  'André Ayew': '安德烈·阿尤',
  'Joseph Aidoo': '约瑟夫·艾杜',
  'Osman Bukari': '奥斯曼·布卡里',
  'Kamaldeen Sulemana': '卡尔姆丁·苏莱马纳',
  'Ernest Nuamah': ' Ernest 努阿马',
  'Salis Abdul Samed2': '萨利斯·阿卜杜勒·萨梅德',
  'Inaki Williams2': '伊纳基·威廉姆斯',
  'Mohammed Kudus2': '穆罕默德·库杜斯',
  'Antoine Semenyo2': '安托万·塞梅纽',
  'Jordan Ayew2': '乔丹·阿尤',
  'André Ayew2': '安德烈·阿尤',

  // === 阿尔及利亚 ===
  'Anthony Mandrea': '安东尼·曼德雷亚',
  'Moustapha Zeghba': '穆斯塔法·泽格巴',
  'Haissem Aouar': '艾塞姆·阿瓦尔',
  'Nabil Bentaleb': '纳比勒·本塔莱布',
  'Youcef Atal': '优素福·阿塔尔',
  'Ishan Belfodil': '伊尚·贝尔福迪尔',
  'Islam Slimani': '伊斯兰·斯利马尼',
  'Andy Delort': '安迪·德洛尔',
  'Ryad Boudebouz': '里亚德·布德布兹',
  'Baghdad Bounedjah': '巴格达德·布内贾',
  'Adam Ounas': '亚当·乌纳斯',
  'Rami Bensebaini': '拉米·本塞拜尼',
  'Aissa Mandi': '艾萨·曼迪',
  'Houssem Aouar2': '艾塞姆·阿瓦尔',
  'Nabil Bentaleb2': '纳比勒·本塔莱布',
  'Youcef Atal2': '优素福·阿塔尔',
  'Ishan Belfodil2': '伊尚·贝尔福迪尔',
  'Islam Slimani2': '伊斯兰·斯利马尼',
  'Andy Delort2': '安迪·德洛尔',
  'Ryad Boudebouz2': '里亚德·布德布兹',
  'Baghdad Bounedjah2': '巴格达德·布内贾',
  'Adam Ounas2': '亚当·乌纳斯',

  // === 突尼斯 ===
  'Bechir Ben Said': '贝希尔·本·赛义德',
  'Moez Ben Cherifia': '穆埃兹·本·谢里菲亚',
  'Aymen Dahmen': '艾门·达赫门',
  'Dylan Bronn': '迪伦·布龙',
  'Montassar Talbi': '蒙塔萨尔·塔尔比',
  'Yassine Meriah': '亚辛·梅里亚',
  'Ali Maâloul': '阿里·马卢勒',
  'Mohamed Dräger': '穆罕默德·德拉格尔',
  'Aïssa Laïdouni': '艾萨·莱杜尼',
  'Ellyes Skhiri': '埃利耶斯·斯希里',
  'Hannibal Mejbri': '汉尼拔·梅吉布里',
  'Ghailene Chaalali': '盖莱内·沙拉利',
  'Wahbi Khazri': '瓦赫比·哈兹里',
  'Naïm Sliti': '奈姆·斯利蒂',
  'Haythem Jouini': '海塞姆·茹尼尼',
  'Mohamed Ali Ben Romdhane': '穆罕默德·阿里·本·罗马丹',
  'Issam Jebali': '伊萨姆·杰巴利',
  'Hamza Mathlouthi': '哈姆扎·马斯卢西',
  'Ali Abdi': '阿里·阿卜迪',
  'Ferjani Sassi': '费尔贾尼·萨西',
  'Ellyes Skhiri2': '埃利耶斯·斯希里',
  'Hannibal Mejbri2': '汉尼拔·梅吉布里',
  'Ghailene Chaalali2': '盖莱内·沙拉利',

  // === 约旦 -->
  'Yazan Abu Arab': '亚赞·阿布·阿拉伯',
  'Moataz Yasin': '穆阿塔兹·亚辛',
  'Faisal Arab': '费萨尔·阿拉伯',
  'Saeed Murjan': '赛义德·穆尔詹',
  'Bara' Marei': '巴拉·马雷伊',
  'Yousef Nawaiseh': '优素福·纳韦塞',
  'Noor Al-Rawabdeh': '努尔·拉瓦布德',
  'Fadi Awad': '法迪·阿瓦德',
  'Mousa Suleiman Taamari': '穆萨·苏莱曼·塔马里',
  'Ali Olwan': '阿里·奥尔万',
  'Yazan Al-Arab': '亚赞·阿拉伯',
  'Sheridan Saleh': '谢里登·萨利赫',

  // === 伊拉克 ===
  'Ahmed Basil': '艾哈迈德·巴西勒',
  'Fahad Talib': '法赫德·塔利布',
  'Mohammed Hama': '穆罕默德·哈马',
  'Ahmed Yahia': '艾哈迈德·叶海亚',
  'Rebin Sulaka': '雷宾·苏拉卡',
  'Saad Natiq': '萨德·纳蒂克',
  'Ali Adnan': '阿里·阿德南',
  'Amjed Attwan': '阿姆杰德·阿特万',
  'Aymen Hussein': '艾门·侯赛因',
  'Omar Al-Rashidi': '奥马尔·拉希迪',
  'Zidane Iqbala': '齐达内·伊克巴拉',
  'Mohammed Ali': '穆罕默德·阿里',
  'Amina Sher': '阿米娜·谢尔',
  'Ahmed Yahia2': '艾哈迈德·叶海亚',
  'Rebin Sulaka2': '雷宾·苏拉卡',
  'Saad Natiq2': '萨德·纳蒂克',
  'Ali Adnan2': '阿里·阿德南',
  'Amjed Attwan2': '阿姆杰德·阿特万',
  'Aymen Hussein2': '艾门·侯赛因',
  'Omar Al-Rashidi2': '奥马尔·拉希迪',
  'Zidane Iqbala2': '齐达内·伊克巴拉',
  'Mohammed Ali2': '穆罕默德·阿里',
  'Amina Sher2': '阿米娜·谢尔',

  // === 乌兹别克斯坦 ===
  'Sanjar Kodirkulov': '桑贾尔·科迪尔库洛夫',
  'Utkir Yusupov': '乌特基尔·尤苏波夫',
  'Abduvokhidjon Khojiakbarov': '阿卜杜沃希德忠·霍贾克巴罗夫',
  'Abbosbek Fayzullaev': '阿博斯贝克·法伊祖拉耶夫',
  'Jaloliddin Masharipov': '贾洛利丁·马沙里波夫',
  'Hoziyor Nematov': '霍济约尔·内马托夫',
  'Odilzhon Abdurakhmonov': '奥迪尔忠·阿卜杜拉赫莫诺夫',
  'Jamshid Iskanderov': '贾姆希德·伊斯坎德罗夫',
  'Shukhrat Aliqulov': '舒赫拉特·阿利库洛夫',
  'Eldor Shomurodov': '埃尔多尔·肖穆罗多夫',
  'Oston Urunov': '奥斯顿·乌鲁诺夫',
  'Azizbek Turgunbaev': '阿齐兹别克·图尔贡巴耶夫',
  'Jasurbek Yaxshiboev': '贾苏尔贝克·亚赫希博耶夫',
  'Abdukodir Khusanov': '阿卜杜科迪尔·胡萨诺夫',
  'Umaraliyev Rustamjon': '乌马里亚利耶夫·鲁斯塔姆容',
  'Mirzaev Mirjalol': '米尔扎耶夫·米尔贾洛尔',
  'Saidkarim Saidkarimov Alikhon': '赛德卡里姆·赛德卡里莫夫·阿利洪',
  'Khojiakbar Alijonov': '霍贾克巴尔·阿利约诺夫',
  'Javokhir Sidikov': '贾沃希尔·西迪科夫',
  'Firuzbek Mukhammadaliev': '菲鲁兹贝克·穆罕默德阿利耶夫',
  'Khojiakbar Alijonov2': '霍贾克巴尔·阿利约诺夫',
  'Abdug'affor Qodirqulov': '阿卜杜加富尔·科迪尔库洛夫',
  'Diyor Imomkhodjaev': '迪约尔·伊莫姆霍贾耶夫',
  'Umaraliyev Rustamjon2': '乌马里亚利耶夫·鲁斯塔姆容',

  // === 佛得角 ===
  'Vozinha': '沃齐尼亚',
  'Dinei Borges': '迪内伊·博尔赫斯',
  'Jefferson': '杰斐逊',
  'Dinei Borges2': '迪内伊·博尔赫斯',
  'Patrick Andrade': '帕特里克·安德拉德',
  'Ryan Mendes': '瑞安·门德斯',
  'Garry Rodrigues': '加里·罗德里格斯',
  'Kelvin Pires': '凯尔文·皮雷斯',
  'Joel Mendes': '若埃尔·门德斯',
  'Bebe': '贝贝',
  'Patrick Andrade2': '帕特里克·安德拉德',
  'Ryan Mendes2': '瑞安·门德斯',
  'Garry Rodrigues2': '加里·罗德里格斯',
  'Bebe2': '贝贝',

  // === 民主刚果 ===
  'Lionel Mpasi': '莱昂内尔·姆帕西',
  'Nicolas Kinambi': '尼古拉斯·金纳米',
  'Henoc Inonga Beka': '埃诺克·伊农加·贝卡',
  'Chancel Mbemba': '钱塞尔·姆本巴',
  'Arthur Masuaku': '阿瑟·马苏亚库',
  'Glody Ngonda': '格洛迪·恩贡达',
  'Gaël Kakuta': '盖尔·卡库塔',
  'Yoane Wissa': '约安·维萨',
  'Silas Katompa Mvumpa': '西拉斯·卡通帕·姆温帕',
  'Brit Assamba': '布里特·阿桑巴',
  'Meschack Elia': '梅沙克·埃利亚',
  'Arthur Kyshenko': '阿瑟·基申科',
  'Fiston Mayele': '菲斯顿·马耶莱',
  'Gedeon Kalulu': '热德翁·卡卢卢',
  'Theo Bongonda': '泰奥·邦贡达',
  'Britt Assamba': '布里特·阿桑巴',
  'Meschack Elia2': '梅沙克·埃利亚',
  'Fiston Mayele2': '菲斯顿·马耶莱',
  'Gedeon Kalulu2': '热德翁·卡卢卢',
  'Theo Bongonda2': '泰奥·邦贡达',

  // === 科特迪瓦 ===
  'Yahia Fofana': '叶海亚·福法纳',
  'Badra Ali Sangaré': '巴德拉·阿里·桑加雷',
  'Ibrahim Cissé': '易卜拉欣·西塞',
  'Wilfried Zaha': '威尔弗里德·扎哈',
  'Simon Deli': '西蒙·德利',
  'Frank Kessié': '弗兰克·凯西',
  'Serge Aurier': '塞尔日·奥里耶',
  'Seko Mohamed Fofana': '塞科·穆罕默德·福法纳',
  'Christian Bammou': '克里斯蒂安·巴穆',
  'Sébastien Haller': '塞巴斯蒂安·阿莱',
  'Franck Kessié': '弗兰克·凯西',
  'Wilfried Singo': '威尔弗里德·辛戈',
  'Simon Adingra': '西蒙·阿丁格拉',
  'Nicolas Pépé': '尼古拉斯·佩佩',
  'Seydou Doumbia': '塞杜·敦比亚',
  'Opa Ingué': '奥帕·恩圭',
  'Badra Ali Sangaré2': '巴德拉·阿里·桑加雷',
  'Ibrahim Cissé2': '易卜拉欣·西塞',
  'Wilfried Zaha2': '威尔弗里德·扎哈',
  'Simon Deli2': '西蒙·德利',
  'Frank Kessie2': '弗兰克·凯西',
  'Serge Aurier2': '塞尔日·奥里耶',
  'Seko Mohamed Fofana2': '塞科·穆罕默德·福法纳',
  'Christian Bammou2': '克里斯蒂安·巴穆',
  'Sébastien Haller2': '塞巴斯蒂安·阿莱',
  'Franck Kessié2': '弗兰克·凯西',
  'Wilfried Singo2': '威尔弗里德·辛戈',
  'Simon Adingra2': '西蒙·阿丁格拉',
  'Nicolas Pépé2': '尼古拉斯·佩佩',
  'Seydou Doumbia2': '塞杜·敦比亚',

  // === 库拉索 -->
  'Eloy Room': '埃洛伊·鲁姆',
  'Aart Biesterveldt': '阿尔特·比斯特费尔特',
  'Charlon Biscoe': '查伦·比斯科',
  'Leandro Bacuna': '莱昂德罗·巴库纳',
  'Cuco Martina': '库科·马蒂纳',
  'Juninho Bacuna': '朱尼尼奥·巴库纳',
  'Rangelo Janga': '兰赫洛·扬加',
  'Gino van Kessel': '吉诺·范凯塞尔',
  'Kenji Gorre': '肯吉·戈尔雷',
  'Leandro Bacuna2': '莱昂德罗·巴库纳',
  'Cuco Martina2': '库科·马蒂纳',
  'Juninho Bacuna2': '朱尼尼奥·巴库纳',
  'Rangelo Janga2': '兰赫洛·扬加',
  'Gino van Kessel2': '吉诺·范凯塞尔',
  'Kenji Gorre2': '肯吉·戈尔雷'
};

// API请求函数（带速率控制）
function fetchPlayer(playerId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.football-data.org',
      path: `/v4/persons/${playerId}`,
      headers: { 'X-Auth-Token': 'b997520e767f49c289a6f5b26b6e732c' },
      timeout: 10000
    };
    const req = https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// 并发限制
async function fetchWithLimit(ids, concurrency = 10) {
  const results = new Map();
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(id => fetchPlayer(id))
    );
    batch.forEach((p, idx) => {
      if (p && p.id && !p.error) {
        results.set(batch[idx], p);
      }
    });
    if ((i + concurrency) % 100 === 0) {
      console.log(`   已获取 ${results.size}/${ids.length} 名球员...`);
    }
    // 简单延迟避免限流
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

function findChineseName(englishName) {
  if (!englishName) return englishName;
  // 精确匹配
  if (playerCNNames[englishName]) return playerCNNames[englishName];
  // 尝试 lastName 匹配
  const parts = englishName.split(' ');
  const lastName = parts[parts.length - 1];
  const firstPart = parts.slice(0, -1).join(' ');
  // 组合尝试
  for (const [key, val] of Object.entries(playerCNNames)) {
    if (key.includes(lastName) || key.toLowerCase().includes(englishName.toLowerCase())) {
      return val;
    }
  }
  return englishName;
}

async function main() {
  console.log('开始收集所有球员ID...');
  
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
          teamName: team.name,
          teamId: team.id
        });
      }
    });
  });

  console.log(`共发现 ${allPlayers.length} 名唯一球员，开始获取详细信息...`);
  
  const ids = allPlayers.map(p => p.playerId);
  const detailMap = await fetchWithLimit(ids, 15);
  
  console.log(`\n成功获取 ${detailMap.size} 名球员详细信息`);

  // ====== 1. 生成 players2026.js (独立球员详情数据) ======
  const playersDetailData = [];
  allPlayers.forEach(p => {
    const detail = detailMap.get(p.playerId) || {};
    const chineseName = findChineseName(p.name);
    const m = teamMapping[p.teamName] || {};
    
    playersDetailData.push({
      playerId: p.playerId,
      name: chineseName,           // 中文名
      nameEn: p.name,             // 英文名
      firstName: detail.firstName || '',
      lastName: detail.lastName || '',
      position: posMap[p.position] || p.position,
      shirtNumber: detail.shirtNumber || null,
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
      teamName: m.name || p.teamName,     // 国家队中文名
      teamNameEn: p.teamName,             // 国家队英文名
      flag: m.flag || '🏳️',
      group: m.group || '?'
    });
  });
  
  const playerOutput = `// data/players2026.js - 2026世界杯全部球员详细资料
// 数据源：Football-Data.org API persons/{playerId}
// 生成时间：${new Date().toISOString().split('T')[0]}
// 共 ${playersDetailData.length} 名球员 | 含中文名+球衣号+俱乐部+国籍

const playersData2026 = ${JSON.stringify(playersDetailData,null,2)}

module.exports = {
  playersData2026
}
`;

  fs.writeFileSync('mini-program/data/players2026.js', playerOutput, 'utf8');
  console.log(`✅ players2026.js 已生成 (${playersDetailData.length}名球员)`);

  // ====== 2. 生成teams2026.js（带中文名和详细资料）=====
  const teams = apiData.teams.map((team) => {
    const m = teamMapping[team.name] || {
      id:0, name:team.name, flag:'🏳️', group:'?', nickname:team.name, starPlayer:'',
      description:`${team.name}国家队`, goldQuote:`欢迎关注${team.name}`
    };

    const players = (team.squad || []).map((p, i) => {
      const detail = detailMap.get(p.id) || {};
      const chineseName = findChineseName(p.name);
      
      return {
        id: parseInt(`${m.id}${String(i+1).padStart(3,'0')}`),
        name: chineseName,
        nameEn: p.name,
        firstName: detail.firstName || '',
        lastName: detail.lastName || '',
        position: posMap[p.position] || p.position,
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
        quote: `${posMap[p.position]||p.position} | ${detail.currentTeam ? detail.currentTeam.name : m.name}国家队`
      };
    });

    return {
      id: m.id, name: m.name, nameEn: team.name, flag: m.flag, group: m.group,
      tags: [m.nickname, m.starPlayer], nickname: m.nickname,
      starPlayer: m.starPlayer, description: m.description,
      goldQuote: m.goldQuote, crest: team.crest,
      coach: team.coach ? `${team.coach.firstName||''} ${team.coach.lastName||''}`.trim() : '',
      players, rivalries: rivalryData[team.name] || []
    };
  });

  const gOrder = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  teams.sort((a,b)=>{ const ga=gOrder.indexOf(a.group),gb=gOrder.indexOf(b.group); return ga-gb||a.id-b.id; });

  let totalPlayers = teams.reduce((s,t)=>s+t.players.length,0);
  const output = `// data/teams2026.js - 2026世界杯48强球队百科数据（完整阵容+中文名+详细资料）
// 数据源：Football-Data.org API (competition WC id:2000)
// 球员详细信息来自 persons/{playerId} 接口
// 生成时间：${new Date().toISOString().split('T')[0]}
// 共 ${teams.length} 支球队 | ${totalPlayers} 名球员 | 含中文名+俱乐部+球衣号

const teamsData2026 = ${JSON.stringify(teams,null,2)}

module.exports = {
  teamsData2026
}
`;

  fs.writeFileSync('mini-program/data/teams2026.js', output, 'utf8');

  console.log(`\n✅ 完成！${teams.length}支球队 | ${totalPlayers}名球员`);
  
  // 统计中文名覆盖率
  let withCN = 0, withoutCN = 0;
  teams.forEach(t => {
    t.players.forEach(p => {
      if (p.name !== p.nameEn) withCN++; else withoutCN++;
    });
  });
  console.log(`📊 中文名覆盖: ${withCN}/${totalPlayers} (${(withCN/totalPlayers*100).toFixed(1)}%) | 未覆盖: ${withoutCN}`);
  console.log(`📁 输出文件:`);
  console.log(`   - mini-program/data/teams2026.js (球队+阵容数据)`);
  console.log(`   - mini-program/data/players2026.js (球员详细资料)`);
}

const posMap = {'Goalkeeper':'门将','Defence':'后卫','Midfield':'中场','Offence':'前锋','Forward':'前锋'};

main();

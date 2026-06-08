// fetch_players_v3.js - 批量获取球员详细信息 + 中文名 + 独立详情文件
const fs = require('fs');
const https = require('https');

const rawData = fs.readFileSync('tmp_teams.json', 'utf8').replace(/^\uFEFF/, '');
const apiData = JSON.parse(rawData);

// === 中文名映射（修复编码问题）===
const playerCNNames = {
  // 乌拉圭
  'Fernando Muslera': '\u8d39\u5c14\u5357\u591a\u00b7\u7a46\u65af\u83b1\u62c9',
  'Sergio Rochet': '\u585e\u5c14\u5e0c\u5965\u00b7\u7f57\u5207\u7279',
  'Ronald Araújo': '\u7f57\u7eb3\u5fb7\u00b7\u963f\u52b3\u970d',
  'Sebastián Cáceres': '\u585e\u5df4\u65af\u8482\u5b89\u00b7\u5361\u585e\u96f7\u65af',
  'Matías Viña': '\u9a6c\u8482\u4e9a\u65af\u00b7\u6bd4\u5c3c\u4e9a',
  'José Giménez': '\u4f55\u585e\u00b7\u5e0c\u95e8\u5c3c\u65af',
  'Federico Valverde': '\u8d39\u5fb7\u91cc\u79d1\u00b7\u5df4\u5c14\u97e6\u5fb7',
  'Giorgian De Arrascaeta': '\u4e54\u5229\u4e9a\u5fb7\u00b7\u963f\u62c9\u65af\u51ef\u5854',
  'Rodrigo Bentancur': '\u7f57\u5fb7\u91cc\u6208\u00b7\u672c\u5766\u5e93\u5c14',
  'Manuel Ugarte': '\u66fc\u52aa\u57c3\u5c14\u00b7\u4e4c\u52a0\u7279',
  'Darwin Núñez': '\u8fbe\u5c14\u6587\u00b7\u52aa\u5d29',
  'Luis Suárez': '\u8def\u6613\u65af\u00b7\u82cf\u4e9e\u96f7\u65af',

  // 德国
  'Manuel Neuer': '\u66fc\u52aa\u57c3\u5c14\u00b7\u8bfa\u4f0a\u5c14',
  'Oliver Baumann': '\u5965\u5229\u5f17\u00b7\u9c9d\u66fc',
  'Waldemar Anton': '\u74e6\u5fb7\u9a6c\u5c14\u00b7\u5b89\u4e1c',
  'Niklas Süle': '\u5c3c\u79d1\u62c9\u65af\u00b7\u805a\u52d2',
  'Jonathan Tah': '\u4e54\u7eb3\u68ee\u00b7\u5854\u8d6b',
  'Antonio Rüdiger': '\u5b89\u4e1c\u5c3c\u5965\u00b7\u5415\u8fea683c',
  'David Raum': '\u5927\u536b\u00b7\u62c9姆',
  'Joshua Kimmich': '\u7ea6\u4e66\u4e9a\u00b7\u57fa\u7c73\u5e0c',
  'Robert Andrich': '\u7f57\u4f2b\u7279\u00b7\u5b89\u5fb7\u91cc\u5e0c',
  'Pascal Groß': '\u5e15\u65af\u5361\u5c14\u00b7\u683c\u7f57\u65af',
  'Jamal Musiala': '\u8d3e\u8fc8\u52d2\u00b7\u7a46\u897f\u4e9a\u62c9',
  'Florian Wirtz': '\u5f17\u6d1b\u91cc\u5c14\u00b7\u7ef4\u5c14\u8328',
  'Leroy Sané': '\u52d2\u9c81\u74e6\u00b7\u8428\u5185',
  'Kai Havertz': '\u51ef\u00b7\u54c8\u5f17\u8328',
  'Thomas Müller': '\u6258\u9a6c\u65af\u00b7\u7a46\u52d2',
  'Deniz Undav': '\u4e39\u5c3c\u65af\u00b7\u7fc0\u8fbe\u592b',
  'Maximilian Beier': '\u9a6c\u514b\u897f\u7c73\u5229\u5b89\u00b7\u62dc\u5c14',
  'Tim Kleindienst': '\u5ef7\u00b7\u514b\u83b1\u56e0\u4e01\u65af\u7279',
  'Nick Woltemade': '\u5c3c\u514b\u00b7\u6c83\u5c14\u7279\u9a6c\u5fb7',

  // 西班牙
  'Unai Simón': '\u4e4c\u5948\u00b7\u897f\u8499',
  'David Raya': '\u6234\u7ef4\u00b7\u62c9\u4e9a',
  'Álex Remiro': '\u4e9a\u5386\u514b\u65af\u00b7\u96f7\u7c73\u7f57',
  'Dani Carvajal': '\u4e39\u5c3c\u00b7\u5361\u74e6\u54c8\u5c14',
  'Daniel Vivian': '\u4e39\u5c3c\u5c14\u00b7\u7ef4\u7ef4\u5b89',
  'Aymeric Laporte': '\u827e\u6885\u91cc\u514b\u00b7\u62c9\u6ce2\u5c14\u7279',
  'Robin Le Normand': '\u7f57\u5bbe\u00b7\u52d2\u8bfa\u5c14\u8299',
  'Marcos Llorente': '\u9a6c\u79d1\u65af\u00b7\u7565\u4f26\u7279',
  'Martin Zubimendi': '\u9a6c\u4e01\u00b7\u82cf\u7ef4\u95e8\u8fea',
  'Fabian Ruiz': '\u6cd5\u6bd4\u5b89\u00b7\u9c81\u4f0a\u65af',
  'Mikel Merino': '\u6885\u514b\u5c14\u00b7\u6885\u91cc\u8bfa',
  'Pedri': '\u4f69\u5fb7\u91cc',
  'Lamine Yamal': '\u62c9\u660e\u00b7\u4e9a\u9a6c\u5c14',
  'Nico Williams': '\u5c3c\u79d1\u00b7\u5a01\u5ec9\u59c6\u65af',
  'Dani Olmo': '\u8fbe\u5c3c\u00b7\u5965\u5c14\u83ab',
  'Álvaro Morata': '\u963f\u5c14\u74e6\u7f57\u00b7\u83ab\u62c9\u5854',
  'Mikel Oyarzabal': '\u6885\u514b\u5c14\u00b7\u5965\u4e9a\u8428\u74e6\u5c14',

  // 阿根廷
  'Emiliano Martínez': '\u57c3\u7c73\u5229\u4e9a\u诺\u00b7\u9a6c\u4e01\u5185\u65af',
  'Gerónimo Rulli': '\u8d6b\u7f57\u5c3c\u83ab\u00b7\u9c81\u5229',
  'Franco Armani': '\u5f17\u5170\u79d1\u00b7\u963f\u5c14\u9a6c\u5c3c',
  'Nahuel Molina': '\u7eb3\u97e6\u5c尔\u00b7\u83ab\u5229\u7eb3',
  'Gonzalo Montiel': '\u5181\u8428\u6d1b\u00b8\u8499\u94c1\u5c14',
  'Cristian Romero': '\u514b\u91cc\u65af\u8482\u5b89\u00b7\u7f57\u6885\u7f57',
  'Lisandro Martínez': '\u5229\u6851\u5fb7\u7f57\u00b7\u9a6c\u4e01\u5185\u65af',
  'Nicolás Otamendi': '\u5c3c\u53e4\u62c9\u65af\u00b7\u5965\u5854\u95e8\u8fea',
  'Marcos Acuña': '\u9a6c\u79d1\u65af\u00b7\u963f\u5e93\u7eb3',
  'Nicolás Tagliafico': '\u5c3c\u53e4\u62c9\u65af\u00b7\u5854\u5229\u4e9a\u83f2\u79d1',
  'Leandro Paredes': '\u83b1\u5b89\u5fb7\u7f57\u00b7\u5e15\u96f7\u5fb7\u65af',
  'Rodrigo De Paul': '\u7f57\u5fb7\u91cc\u6208\u00b7\u5fb7\u4fdd\u7f57',
  'Enzo Fernández': '\u6069\u4e50\u00b7\u8d39\u5c14\u5357\u5fb7\u65af',
  'Alexis Mac Allister': '\u963f\u5386\u514b\u65af\u00b7\u9ea6\u5361\u5229\u65af\u7279',
  'Ezequiel Palacio': '\u57c3\u585e\u57fa\u8036\u5c14\u00b7\u5e15\u62c9\u897f\u5965\u65af',
  'Giovani Lo Celso': '\u4e54\u74e6尼\u00b7\u6d1b\u585e\u5c14\u7d22',
  'Lionel Messi': '\u83b1\u6602\u5185\u5c尔\u00b7\u6885\u897f',
  'Julián Álvarez': '\u80e1\u5229\u5b89\u00b7\u963f\u5c14\u74e6\u96f7\u65af',
  'Ángel Di María': '\u5b89\u8d6b\u5c14\u00b7\u8fea\u9a6c\u5229\u4e9a',
  'Lautaro Martínez': '\u52b3\u5854\u7f57\u00b7\u9a6c\u4e01\u5185\u65af',
  'Paulo Dybala': '\u4fdd\u7f57\u00b7\u8fea\u5df4\u62c9',
  'Valentín Carboni': '\u74e6\u4f26\u4e01\u00b7\u5361\u5c14\u535a\u5c3c',
  'Thiago Almada': '\u8482\u4e9a\u54e5\u00b7\u963f\u5c14\u9a6c\u8fbe',

  // 巴西
  'Alisson Becker': '\u963f\u5229\u677e\u00b7\u8d1d\u514b\u5c14',
  'Ederson Moraes': '\u57c3\u5fb7\u68ee\u00b7\u83ab\u8d56\u65af',
  'Bento': '\u672c\u6258',
  'Danilo Luiz': '\u8fbe\u5c3c\u6d1b\u00b7\u8def\u6613\u65af',
  'Marquinhos': '\u9a6c\u5c14\u57fa\u5c3c\u5965\u65af',
  'Thiago Silva': '\u8482\u4e9a\u54e5\u00b7\u5e2d\u5c14\u74e6',
  'Iban Marques': '\u4f0a\u4e07\u00b7\u9a6c\u514b\u65af',
  'Casemiro': '\u5361\u585e\u7c73\u7f57',
  'Bruno Guimarães': '\u5e03\u9c81\u8bfa\u00b7\u5409\u9a6c\u826f\u65af',
  'Lucas Paquetá': '\u5362\u5361\u65af\u00b7 帕奎塔',
  'João Gomes': '\u82e5\u6602\u00b7\u6218\u9ea6\u65af',
  'Raphinha': '\u62c9\u83f2\u5c3c\u4e9a',
  'Vinícius Júnior': '\u7ef4\u5c3c\u4fee\u65af',
  'Rodrygo Goes': '\u7f57\u5fb7\u91cc\u6208',
  'Endrick': '\u6069\u5fb7\u91cc\u514b',
  'Gabriel Jesus': '\u70ed\u82cf\u65af',
  'Gabriel Barbosa': '\u52a0\u5e03\u91cc\u5c14\u00b7\u5c14\u535c\u8428',

  // 葡萄牙
  'Rui Patrício': '\u9c81\u4f0a\u00b7\u5e15\u7279\u91cc\u897f\u5965',
  'Diogo Costa': '\u8fea\u5965\u54e5\u00b7\u79d1\u65af\u5854',
  'José Sá': '\u4f55\u8428',
  'Pepe': '\u4f69\u4f69',
  'Rúben Dias': '\u9c81\u672c\u00b7\u8fea\u4e9a\u65af',
  'Danilo Pereira': '\u8fbe\u5c3c\u6d1b\u00b7\u4f69\u96f7\u62c9',
  'João Cancelo': '\u82e5\u6602\u00b7\u574e\u585e\u6d1b',
  'Nuno Mendes': '\u52aa\u8bfa\u00b7\u95e8\u5fb7\u65af',
  'Diogo Dalot': '\u8fea\u5965\u54e5\u00b7\u8fbe\u6d1b\u7279',
  'Vitinha': '\u7ef4\u8482\u5c3c\u4e9a',
  'Bruno Fernandes': '\u5e03\u9c81\u8bfa\u00b7\u8d39\u5357\u5fb7\u65af',
  'João Palhinha': '\u82e5\u6602\u00b7\u5e15\u5229\u5c3c\u4e9a',
  'Bernardo Silva': '\u8d1d\u5c14\u7eb3\u591a\u00b7\u5e2d\u5c14\u74e6',
  'Cristiano Ronaldo': '\u514b\u91cc\u65af\u8482\u5c24\u诺·\u7f57\u7eb3\u5c14\u591a',
  'João Félix': '\u82e5\u6602\u00b7\u83f2\u5229\u514b\u65af',
  'Gonçalo Ramos': '\u8d21\u8428\u6d1b\u00b7\u62c9\u83ab\u65af',
  'Pedro Neto': '\u4f69\u5fb7\u7f57\u00b7\u5185\u6258',

  // 法国
  'Mike Maignan': '\u9ea6\u514b\u00b7\u8fc8\u5c3c\u6602',
  'Brice Samba': '\u5e03\u91cc\u65af\u00b7\u6851\u5df4',
  'Alphonse Areola': '\u963f\u65b9\u65af\u00b7\u96f7\u5965\u62c9',
  'Jonathan Clauss': '\u4e54\u7eb3\u68ee\u00b7\u514b\u52b3\u65af',
  'Dayot Upamecano': '\u8fbe\u7ea6\u00b7\u4e8e帕\u6885\u5361\u8bba',
  'William Saliba': "\u5a01\u5ec9\u00b7\u8428\u5229\u5df4",
  'Ferland Mendy': '\u8d39\u5170\u00b7\u95e8\u8fea',
  'Theo Hernandez': '\u7279\u5965\u00b7\u5c14\u5357\u5fb7\u65af',
  'Benjamin Pavard': '\u90a6\u96c5\u66fc\u00b7\u5e15\u74e6\u5c14',
  'Aurélien Tchouaméni': '\u5965\u96f7\u5229\u5b89\u00b6\u695a\u963f\u6885\u5c3c',
  'Adrien Rabiot': '\u963f\u5fb7\u91cc\u5b89\u00b7\u62c9\u6bd4\u5965',
  'Eduardo Camavinga': '\u7231\u5fb7\u534e\u591a\u00b7\u5361\u9a6c\u6587\u52a0',
  'Antoine Griezmann': '\u5b89\u6258\u74e6\u00b7\u683c\u5217\u8332\u66fc',
  'Ousmane Dembélé': '\u4e4c\u65af\u66fc\u00b7 登\u8d1d\u83b1',
  'Kingsley Coman': '\u91d1\u65af\u5229\u00b7\u79d1\u66fc',
  'Kylian Mbappé': '\u57fa\u5229\u5b89\u00b7\u59c6\u5df4\u4f69',
  'Marcus Thuram': '\u9a6c\u5e93\u65af\u00b7\u56fe\u62c9\u59c6',
  'Michael Olise': '\u7c73\u514b\u5c14\u00b7\u5965\u5229\u585e',
  'Bradley Barcola': '\u5e03\u62c9\u5fb7\u5229\u00b7\u5df4\u5c14\u79d1\u62c9',

  // 英格兰
  'Jordan Pickford': '\u4e54\u4e39\u00b7\u76ae\u514b\u798f\u5fb7',
  'Aaron Ramsdale': '\u963f\u4f26\u00b7\u62c9\u59c6\u4ee3\u5c14',
  'Kyle Walker': '\u51ef\u5c尔\u00b7\u6c83\u514b',
  'John Stones': '\u7ea6\u7ff0\u00b7\u65af\u901a\u65af',
  'Kieran Trippier': '\u57fa\u5170\u00b7\u7279\u91cc\u76ae\u5c14',
  'Bukayo Saka': '\u5e03\u5361\u7ea6\u00b7\u8428\u5361',
  'Declan Rice': '\u5fb7\u514b\u5170\u00b7\u8d56\u65af',
  'Jude Bellingham': '\u88d5\u5fb7\u00b7\u8d1d\u6797\u5385\u59c6',
  'Phil Foden': '\u83f2\u5c14\u00b7\u798f 登',
  'Harry Kane': '\u54c8\u91cc\u00b7\u51ef\u6069',
  'Ivan Toney': '\u4f0a\u4e07\u00b7\u6258\u5c3c',
  'Ollie Watkins': '\u5965\u5229\u00b7\u6c83\u7279\u91d1\u65af',
  'Anthony Gordon': '\u5b89\u4e1c\u5c3c\u00b7\u6208 登',
  'Cole Palmer': '\u79d1\u5c14\u00b7 帕\u5c14\u9ed8',
  'Dominic Solanke': '\u591a\u7c73\u5c3c\u514b\u00b7\u7d22\u5170\u514b',

  // 荷兰
  'Bart Verbruggen': '\u5df4\u5c14\u7279\u00b7\u8d39\u5e03\u9c81\u4ea8',
  'Justin Bijlow': '\u8d3e\u65af\u5ef7\u00b7\u6bd4\u5c14\u6d1b',
  'Lutsharel Geertruida': '\u5362\u7279\u62c9\u5c14\u00b7\u683c\u5c14\u7279\u9c81\u4f0a\u8fbe',
  'Matthijs de Ligt': '\u9a6c\u6cf0\u65af\u00b7\u5fb7\u5229\u8d6b\u7279',
  'Virgil van Dijk': '\u7ef4\u5409\u5c14\u00b7\u8303\u6234\u514b',
  'Nathan Aké': '\u5185\u68ee\u00b7\u963f\u514b',
  'Jeremie Frimpong': '\u6770\u91cc\u7c73\u00b7\u5f17\u679e\u84ec',
  'Tijjani Reijnders': '\u8482\u8d3e尼\u00b7\u96f7\u6069\u5fb7\u65af',
  'Xavi Simons': '\u54c8\u7ef4\u00b7\u897f\u8499\u65af',
  'Cody Gakpo': '\u79d1\u8fea\u00b7\u52a0\u514b\u6ce2',
  'Donyell Malen': '\u591a\u5185\u5c尔\u00b7\u9a6c\u4f26',
  'Brian Brobbey': '\u5e03\u8d56\u6069\u00b7\u5e03\u7f57\u6bd4',
  'Wout Weghorst': '伍特\u00b7\u97e6\u683c\u970d\u65af\u7279',
  'Ryan Gravenberch': '\u745e\u5b89\u00b7\u683c\u62c9\u82ac\u8d1d\u8d6b',
  'Memphis Depay': '\u5b5f\u83f2\u65af\u00b7\u5fb7\u4f69',

  // 日本
  'Shūichi Gonda': '\u6743\u7530\u4fee\u4e00',
  'Daniel Schmidt': '\u4e39\u5c3c\u5c14\u00b7\u65bd\u5bc6\u7279',
  'Hiroki Ito': '\u4f0a\u85e4\u6d0b\u8f89',
  'Takehiro Tomiyasu': '\u5bcc\u5b89\u5065\u6d0b',
  'Ko Itakura': '\u677f\u4ed3\u6eec',
  'Daizen Maeda': '\u524d\u7530\u5927\u7136',
  'Kaoru Mitoma': '\u4e09\u7b20\u85b0',
  'Takefusa Kubo': '\u4e45\u4fdd\u5efa\u82f1',
  'Ao Tanaka': '\u7530\u4e2d\u78a7',
  'Wataru Endō': '\u8fdc\u85e4\u822a',
  'Ritsu Dōan': '\u5802\u5b89\u5f8b',
  'Junya Ito': '\u4f0a\u4e1c\u7eaf\u4e5f',
  'Takumi Minamino': '\u5357\u91ce\u62d3\u5b9e',
  'Daichi Kamada': '\u9530\u7530\u5927\u5730',
  'Ayase Ueda': '\u4e0a\u7530\u7eee\u4e16',
  'Yuya Osako': '\u5927\u8feb\u52c7\u4e5f',
  'Reo Hatate': '\u65d7\u624b\u601c\u592e',
  'Kohei Kato': '\u52a0\u85e4\u5f18\u5c06',
  'Machida Seiya': '\u7538\u91ce\u4fee\u6597',

  // 克罗地亚
  'Dominik Livaković': '\u591a\u7c73\u5c3c\u514b\u00b7\u5229\u74e6\u79d1\u7ef4\u514b',
  'Ivica Ivušić': '\u4f0a\u7ef4\u5bdf\u00b7\u4f0a\u6b66\u897f\u514b',
  'Joško Gvardiol': '\u7ea6\u4ec0\u79d1\u00b7\u683c\u74e6\u8fea\u5965\u5c14',
  'Dejan Lovren': '\u5fb7\u626c\u00b6\u6d1b\u592b\u4f26',
  'Mateo Kovačić': '\u9a6c\u7279\u5965\u00b7\u79d1\u74e6\u5947\u514b',
  'Luka Modrić': '\u5362\u5361\u00b7\u83ab\u5fb7\u91cc\u5955',
  'Marcelo Brozović': '\u9a6c\u585e\u6d1b\u00b7\u5e03\u7f57\u4e50\u7ef4\u5951',
  'Ivan Perišić': '\u4f0a\u4e07\u00b7\u4f69\u91cc\u897f\u514b',
  'Andrej Kramarić': '\u5b89\u5fb7\u70c8\u00b7\u514b\u62c9\u9a6c\u91cc\u514b',
  'Bruno Petković': '\u5e03\u9c81\u8bfa\u00b7\u5f7c\u5fb7\u79d1\u7ef4\u514b',
  'Lovro Majer': '\u6d1b\u592b\u7f57\u00b7\u9a6c\u8036\u5c14',
  'Mario Pašalić': '\u9a6c\u91cc\u5965\u00b7\u5e15\u6c99\u5229\u514b',

  // 挪威
  'Orjan Nyland': '\u5384\u626c\u00b7\u5c3c\u5170',
  'Erling Haaland': '\u538c\u6797\u00b7\u54c8\u5170\u5fb7',
  'Martin Ødegaard': '\u9a6c\u4e01\u00b7\u5965\u5fb7\u9ad8',
  'Alexander Sørloth': '\u4e9a\u5386\u5c71\u5927\u00b7\u7d22\u5c14\u6d1b\u7279',
  'Kristoffer Ajer': '\u514b\u91cc\u65af\u6258\u5f17\u00b7\u963f\u8036\u5c14',

  // 比利时
  'Thomas Kaminski': '\u6258\u9a6c\u65af\u00b7\u660e\u65af\u57fa',
  'Thomas Meunier': '\u6258\u9a6c\u65af\u00b9\u9ed8\u5c3c\u8036',
  'Toby Alderweireld': '\u6258\u6bd4\u00b7\u963f\u5c14\u5fb7\u97e6\u96f7\u5c14\u5fb7',
  'Jan Vertonghen': '\u627c\u00b7\u8d39\u5c14\u901a\u4ea8',
  'Timothy Castagne': '\u8482\u83ab\u897f\u00b7\u5361\u65af\u6cf0\u5a05',
  'Kevin De Bruyne': '\u51ef\u6587\u00b7\u5fb7\u5e03\u52b3\u5185',
  'Youri Tielemans': '\u5c24\u91cc\u00b7\u8482\u52d2\u66fc\u65af',
  'Romelu Lukaku': '\u7f57\u6885\u5362\u00b7\u5362\u5361\u5e93',
  'Jérémy Doku': '\u6770\u91cc\u7c73\u00b7\u591a\u5e93',
  'Loïs Openda': '\u6d1b\u4f0a\u00b7\u5965\u5f6d\u8fbe',
  'Yannick Carrasco': '\u627c\u5c3c\u514b\u00b7\u5361\u62c9\u65af\u79d1',
  'Axel Witsel': '\u963f\u514b\u585e\u5c14\u00b7\u7ef4\u7279\u585e\u5c14',

  // 美国
  'Matt Turner': '\u9a6c\u7279\u00b7\u7279\u7eb3',
  'Sean Johnson': '\u8096\u6069\u00b7\u7ea6\u7ff0\u68ee',
  'Zack Steffen': '\u624e\u514b\u00b7\u65af\u7279\u82ac',
  'Chris Richards': '\u514b\u91cc\u65af\u00b7\u7406\u67e5\u5179',
  'Sergiño Dest': '\u585e\u5c14\u5409\u5c3c\u5965\u00b7\u5fb7\u65af\u7279',
  'Yunus Musah': '\u5c24\u52aa\u65af\u00b7\u7a46\u8428',
  'Tyler Adams': '\u6cf0\u52d2\u00b7\u4e9a\u5f53\u65af',
  'Gio Reyna': '\u5409\u5965\u00b7\u96f7\u7eb3',
  'Christian Pulisic': '\u514b\u91cc\u65af\u8482\u5b89\u00b7\u666e\u5229\u897f\u514b',
  'Timothy Weah': '\u8482\u83ab\u897f\u00b7\u7ef4\u963f',
  'Haji Wright': '\u54c8\u5409\u00b8\u8d56\u7279',
  'Jesus Ferreira': '\u70ed\u82cf\u65af\u00b7\u8d39\u96f7\u62c9',
  'Ricardo Pepi': '\u91cc\u5361\u591a\u00b7\u4f69\u76ae',
  'Brenden Aaronson': '\u5e03\u4f26\u767b\u00b7\u963f\u9686\u68ee',
  'Walker Zimmerman': '\u6c83\u514b\u00b7\u9f50\u9ed8\u5c14\u66fc',
  'Antonee Robinson': '\u5b89\u6258\u5c3c\u00b7\u7f57\u5bbe\u900a',
  'Malik Tillman': '\u9a6c\u5229\u514b\u00b7\u8482\u5c14\u66fc',

  // 韩国
  'Cho Hyun-woo': '\u8d8b\u8d24\u7950',
  'Kim Seung-gyu': '\u91d1\u627f奎',
  'Song Bum-keun': '\u5b8b\u8303\u6839',
  'Kim Young-kwon': '\u91d1\u73a9\u54e5',
  'Kim Min-jae': '\u91d1\u73b0\u5f88',
  'Son Heung-min': '\u5b59\u5174\u616e',
  'Lee Kang-in': '\u674e\u521a\u4ec1',
  'Hwang Hee-chan': '\u9ec4\u559c\u7eda',
  'Hwang Ui-jo': '\u9ec4\u4e49\u52a9',
  'Jo Gue-sung': '\u66f4\u574e\u6210',
  'Lee Jae-sung': '\u674e\u5728\u57ce',
  'Park Yong-woo': '\u6734\u9549\u5b87',
  'Yang Hyun-jun': '\u6768\u4fca\u8d24',
  'Baek Seung-ho': '\u767d\u627f\u6d69',
  'Oh Hyeon-gyu': '\u5434\u8d24\u572d',
  'Bae Jun-ho': '\u88d3\u4fca\u6d69',
  'Jeong Woo-yeong': '\u90d1\u53c8\u8363',
  'Hong Hyun-gok': '\u6d2a\u94c9\u56fd',
  'Moon Seon-min': '\u6587\u5ba3\u6c11',

  // 墨西哥
  'Guillermo Ochoa': '\u5409\u5217\u5c14\u83ab\u00b7\u5965\u4e54\u4e9a',
  'Carlos Acevedo': '\u5361\u6d1b\u65af\u00b7\u963f\u585e\u97e6\u591a',
  'Jesús Gallardo': '\u8d6b\u82cf\u65af\u00b7\u52a0\u5c14\u591a',
  'César Montes': '\u585e\u8428\u5c14\u00b7\u8499\u7279\u65af',
  'Johan Vásquez': '\u7ea6\u7ff0\u00b7\u5df4\u65af\u514b\u65af',
  'Edson Álvarez': '\u57c3\u5fb7\u68ee\u00b7\u963f\u5c14\u74e6\u96f7\u65af',
  'Hirving Lozano': '\u57c3\u5c14\u6587\u00b6\u6d1b\u8428\u8bfa',
  'Raúl Jiménez': '\u52b3\u5c14\u00b7\u5e0c\u95e8\u5185\u65af',
  'Henry Martín': '\u4ea8\u5229\u00b7\u9a6c\u4e01',
  'Luis Chávez': '路易斯\u00b7\u67e5\u97e6\u65af',
  'Santiago Giménez': '\u57c3\u5730\u4e9a\u54e5\u00b7\u5e0c\u95e8\u5185\u65af',

  // 瑞士
  'Yann Sommer': '\u626c\u00b7\u7d22\u83ab',
  'Gregor Kobel': '\u683c\u96f7\u6208\u5c14\u00b7\u79d1\u8d1d\u5c尔',
  'Manuel Akanji': '\u66fc\u52aa\u57c3\u5c尔\u00b7\u963f\u5761\u5409',
  'Granit Xhaka': '\u683c\u62c9\u5c3c\u7279\u00b7\u624e\u5361',
  'Xherdan Shaqiri': '\u8c22\u5c14\u4e39\u00b7\u6c99\u5947\u91cc',
  'Breel Embolo': '\u5e03\u96f7\u5c14\u00b7\u6069\u535a\u6d1b',
  'Ruben Vargas': '\u9c81\u672c\u00b7\u5c14\u7234\u65af',
  'Zeki Amdouni': '\u6cfd\u57fa\u00b7\u963f\u59c6\u591a\u5c3c',
  'Steven Zuber': '\u53f2\u8482\u6587\u00b7\u7956\u8d1d\u5c尔',
  'Dan Ndoye': '\u4e39\u00b7\u6069\u591a\u8036',
  'Noël Okkafor': '\u8bfa\u5c14\u00b7\u5965\u5361\u798f\u5c14',
  'Renato Steffen': '\u96f7\u7eb3\u6258\u00b7\u65af\u7279\u82ac',
  'Michel Aebischer': '\u7c73\u6b47\u5c14\u00b7\u57c3\u6bd4\u820d',

  // 塞内加尔
  'Édouard Mendy': '\u7231\u534e\u5fb7\u00b7\u95e8\u8fea',
  'Alfred Gomis': '\u963f\u5c14\u5fre\u5fb7\u00b7\u6208\u7c73\u65af',
  'Pape Matar Sarr': '\u5e15\u4f69\u00b7\u9a6c\u5854\u5c14\u00b7\u8428\u5c14',
  'Cheikhou Kouyaté': '\u5207\u8d6b\u5e93\u00b7\u5e93\u4e9a\u7279',
  'Idrissa Gueye': '\u4f0a\u5fb7\u91cc\u8428\u00b7\u76d6\u8036',
  'Kalidou Koulibaly': '\u5361\u5229\u675c\u00b7\u5e93\u5229\u5df4\u5229',
  'Abdou Diallo': '\u963f\u535c\u00b7\u8fea\u4e9a\u6d1b',
  'Fodé Ballo-Touré': '\u798f\u4ee3\u00b7\u5df4\u6d1b-\u56fe\u96f7',
  'Youssouf Sabaly': '\u5c24\u7d22\u592b\u00b7\u8428\u5df4\u5229',
  'Nicolas Jackson': '\u5c3c\u53e4\u62c9\u65af\u00b7\u6770\u514b\u68ee',
  'Sadio Mané': '\u8428\u8fea\u5965\u00b7\u9a6c\u5185',
  'Boulaye Dia': '\u5e03\u83b1\u00b7\u8fea\u4e9a',
  'Pathe Ciss': '\u5e15\u7279\u00b7\u897f\u65af',
  'Iliman Ndiaye': '\u4f0a\u5229\u66fc\u00b7\u6069\u8fea\u4e9a\u8036',
  'Lamine Camara': '\u62c9\u660e\u00b7\u5361\u9a6c\u62c9',
  'Ismaïla Sarr': '\u4f0a\u65af\u6885\u62c9\u00b7\u8428\u5c14',
  'Habib Diarra': '\u54c8\u6bd4\u5e03\u00b7\u8fea\u963f\u62c9',
  'Krépin Diatta': '\u514b\u96f7\u5e73\u00b7\u8fea\u4e9a\u5854',
  'Moustapha Name': '\u7a46\u65af\u5854\u6cd5\u00b7\u7eb3\u59c6',

  // 沙特阿拉伯
  'Mohammed Al-Rubaie': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u9c81\u62dc\u8036',
  'Salem Al-Dawsari': '\u8428\u52d2\u59c9\u00b7\u8fbe\u74e6\u8428\u91cc',
  'Saleh Al-Shehri': '\u8428\u5229\u8d6b\u00b8\u8c22\u8d6b\u91cc',
  'Firas Alburaikan': '\u83f2\u62c9\u65af\u00b7\u5e03\u8d56\u5766',
  'Abdullah Al-Hamdan': '\u963f\u535c\u675c\u62c9\u00b7\u54c8\u59c6\u4e39',
  'Ali Al-Bulaihi': '\u963f\u91cc\u00b7\u5e03\u62c9\u4f0a\u5e0c',
  'Hassan Tambakti': '\u54c8\u6851\u00b7\u5766\u5df4\u514b\u8482',
  'Ali Al-Hassan': '\u963f\u91cc\u00b7\u54c8\u6851',
  'Mohamed Kanno': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u5361\u8bfa',
  'Abdulellah Al-Malki': '\u963f\u535c\u675c\u62c9\u8d6b\u00b7\u9a6c\u5c14\u57fa',

  // 土耳其
  'Mert Günok': '\u6885\u5c14\u7279\u00b7\u5c45\u8bfa\u514b',
  'Altay Bayındır': '\u963f\u5c14\u6cf0\u00b7\u5df4\u56e0\u5fb7\u5c14',
  'Uğurcan Çakır': '\u4e4c\u4e4c\u5c14\u8a79\u00b7\u6070\u514b\u5c14',
  'Merih Demiral': '\u6885\u91cc\u8d6b\u00b7\u5fb7\u7c73\u5c14\u4e9a\u5c14',
  'Zeki Çelik': '\u6cfd\u57fa\u00b7\u5207\u5229\u514b',
  'Arda Güler': '\u963f\u5c14\u8fbe\u00b7\u5c45\u52d2\u5c14',
  'Orkun Kökçü': '\u5965\u5c14\u6606\u00b7\u67ef\u514b\u66f2',
  'Hakan Çalhanoğlu': '\u54c8\u574e\u00b7\u6070\u5c14\u6c49\u5965\u5362',
  'Yunus Akgün': '\u4e91\u5c3c\u65af\u00b7\u963f\u514b\u4eac',
  'Kenan Yıldız': '\u5361\u5357\u00b7\u8036\u5c14\u5fb7\u5179',
  'Cenk Tosun': '\u575a\u514b\u00b7\u6258\u987a',
  'Semih Kılıçsoy': '\u585e\u7c73\u8d6b\u00b7\u5c14\u5217\u7ecd\u4f0a',
  'Mert Müldür': '\u6885\u5c14\u7279\u00b7\u7c73\u5c14\u675c\u5c14',
  'Yusuf Yazıcı': '\u4f18\u7d20\u798f\u00b7\u4e9a\u6cfd\u54f2',
  'Barış Alper Yılmaz': '巴\u91cc\u65af\u00b7\u963f\u5c14\u4f69\u00b7\u52d2\u9a6c\u5179',
  'Kerem Aktürkoğlu': '\u51ef\u96f7\u59c6\u00b7\u963f\u514b\u56fe\u5c14\u79d1\u5362',
  'Bertuğ Yıldırım': '\u8d1d\u56fe\u683c\u00b7\u52d2\u5fb7\u52e4',
  'Salih Özcan': '\u8428\u5229\u8d6b\u00b7\u5965\u5179\u8a79',
  'İrfan Can Kahveci': '\u4f0a\u5c14\u51e1\u00b7\u574e\u00b7\u5361\u8d6b\u97e6\u5947',
  'Emre Demir': '\u57c3\u59c6\u96f7\u00b7\u5fb7\u7c73\u5c14',

  // 澳大利亚
  'Mathew Ryan': '\u9a6c\u4fee\u00b7\u745e\u5b89',
  'Joe Gauci': '\u4e54\u00b7\u9ad8\u5947',
  'Harry Souttar': '\u54c8\u91cc\u00b7\u82cf\u5854',
  'Kye Rowles': '\u51ef\u00b7\u7f57\u5c14\u65af',
  'Milos Degenek': '\u7c73\u6d1b\u65af\u00b7\u5fb7\u683c\u5185\u514b',
  'Aziz Behich': '\u963f\u9f50\u5179\u00b7\u8d1d\u5e0c\u5947',
  'Jackson Irvine': '\u6770\u514b\u68ee\u00b7\u6b27\u6587',
  'Aaron Mooy': '\u963f\u9f99\u00b7\u7a46\u4f0a',
  'Craig Goodwin': '\u514b\u96f7\u683c\u00b7\u53e4\u5fb7\u6e29',
  'Mitchell Duke': '\u7c73\u5207\u5c14\u00b7\u675c\u514b',
  'Mathew Leckie': '\u9a6c\u4fee\u00b7\u83b1\u57fa',
  'Martin Boyle': '\u9a6c\u4e01\u00b7\u535a\u4f0a\u5c14',
  'Adam Taggart': '\u4e9a\u5f53\u00b7\u5854\u52a0\u7279',
  'Garang Kuol': '\u52a0\u5170\u00b7\u5e93\u5c14\u5c14',
  'Jason Cummings': '\u6770\u68ee\u00b7\u5361\u660e\u65af',
  'Brandon Borrello': '\u5e03\u5170\u767b\u00b7\u535a\u96f7\u6d1b',
  'Marco Tilio': '\u9a6c\u5c14\u79d1\u00b7\u63d0\u5229\u5965',
  'Connor Metcalfe': '\u5eb7\u7eb3\u00b7\u6885\u7279\u5361\u5c14\u592b',
  'Gianni Stensness': '\u8a79尼\u00b7\u65af\u6ed5\u65af\u5185\u65af',
  'Jordan Bos': '\u4e54\u4e39\u00b7\u535a\u65af',
  'Lewis Miller': '\u5219\u6613\u65af\u00b7\u7c73\u5c14\u5c14',

  // 新西兰
  'Sasha Marinovic': '\u8428\u6c99\u00b7\u9a6c\u91cc\u8bfa\u7ef4\u514b',
  'Chris Wood': '\u514b\u91cc\u65af\u00b7\u4f0d\u5fb7',
  'Marco Rojas': '\u9a6c\u5c14\u79d1\u00b7\u7f57\u54c8\u65af',
  'Liberato Cacace': '\u5229\u4f2f\u62c9\u6258\u00b7\u5361\u5361\u5207',
  'Bill Tuiloma': '\u6bd4\u5c14\u00b7\u56fe\u4f0d\u6d1b\u9a6c',
  'Joe Bell': '\u4e54\u00b7\u8d1d\u5c14',
  'Matthew Garbett': '\u9a6c\u4fee\u00b7\u52a0\u8d1d\u7279',
  'Ben Old': '\u672c\u00b7\u5965\u5c14\u5fb7',
  'Caleb Watts': '\u51ef\u83b1\u5e03\u00b7\u6c83\u5179',
  'Michael Boxall': '\u7c73\u514b\u5c14\u00b7\u535a\u514b\u8428\u5c14',
  'Storm Roux': '\u65af\u6258\u59c6\u00b7\u9c81\u514b\u65af',
  'Sam Sutton': '\u8428\u59c6\u00b7\u8428\u987f',
  'Max Mata': '\u9a6c\u514b\u65af\u00b7\u9a6c\u5854',
  'Ben Waine': '\u672c\u00b7\u97e6\u6069',
  'Sarpreet Singh': '\u8428\u666e\u91cc\u7279\u00b8\u8f9b\u683c',
  'Finn Surman': '\u82ac\u00b7\u745f\u66fc',
  'Kip Povey': '\u57fa\u666e\u00b7\u6ce2\u7ef4',
  'Lachlan Bayliss': '\u62c9\u514b\u5170\u00b7\u8d1d\u5229\u65af',
  'Jesse Randall': '\u6770\u897f\u00b7\u5170\u5fb7\u5c14',

  // 瑞典
  'Robin Olsen': '\u7f57\u5bbe\u00b7\u5965\u5c14\u68ee',
  'Johan Dahlin': '\u7ea6\u7ff0\u00b7\u8fbe\u6797',
  'Emil Forsberg': '\u57c3\u7c73\u5c14\u00b7\u798f\u65af\u8d1d\u91cc',
  'Victor Gyökeres': '\u7ef4\u514b\u6258\u00b7\u54f2\u51ef\u8d56\u4ec0',
  'Alexander Isak': '\u4e9a\u5386\u5c71\u5927\u00b7\u4f0a\u8428\u514b',
  'Anthony Elanga': '\u5b89\u4e1c\u5c3c\u00b7\u57c3\u5170\u52a0',
  'Dejan Kulusevski': '\u5fb7\u626c\u00b7\u5e93\u5362\u585e\u7ef4\u65af\u57fa',
  'Mikael Lustig': '\u7c73\u51ef\u5c14\u00b7\u5362\u65af\u8482\u683c',
  'Marcus Danielson': '\u9a6c\u5e93\u65af\u00b7\u4e39\u5c3c\u5c14\u677e',
  'Ludwig Augustinsson': '路\u5fb7\u7ef4\u683c\u00b7\u5965\u53e4\u65af\u677e',
  'Jesper Karlström': '\u8036\u65af\u4f69\u00b7\u5361\u5c14\u65af\u7279\u4f26',
  'Robin Quaison': '\u7f57\u5bbe\u00b7\u5938\u4f0a\u68ee',
  'Samuel Gustafson': '萨\u7f29\u5c14\u00b7\u53e4\u65af\u5854\u592b\u677e',
  'Sebastian Larsson': '塞\u5df4\u65af\u8482\u5b89\u00b7\u62c9\u5c14\u677e',
  'Jens Cajuste': '\u5ef6\u65af\u00b7\u5361\u4e8e\u65af\u7279',
  'Carl Starfelt': '\u5361\u5c14\u00b7\u65af\u5854\u8d39\u5c14\u7279',
  'Joel Asoro': '\u4e54\u5c14\u00b7\u963f\u7d22\u7f57',

  // 捷克
  'Jindřich Staněk': '\u91d1\u5fb7\u91cc\u8d6b\u00b7\u65af\u5850\u5185\u514b',
  'Matej Kovář': '\u9a6c\u6377\u00b7\u79d1\u74e6\u65e5',
  'Václav Černý': '\u74e6\u8328\u62c9\u592b\u00b7\u5207\u5c14\u5c3c',
  'Tomáš Holeš': '\u6258\u9a6c\u65af\u00b7\u970d\u83b1\u4ec0',
  'David Zima': '\u6234\u7ef4\u00b7\u9f50\u9a6c',
  'David Doudera': '\u6234\u7ef4\u00b7\u675c\u5fb7\u62c9',
  'Tomáš Souček': '\u6258\u9a6c\u65af\u00b7\u7d22\u5207\u514b',
  'Ladislav Krejčí': '\u62c9\u8fea\u65af\u62c9\u592b\u00b7\u514b\u96f7\u5170\u5951',
  'Vladimír Coufal': '\u5f17\u62c9\u5b1c\u7c73\u5c14\u00b7\u8003\u6cd5\u5c14',
  'Patrik Schick': '\u5e15\u7279\u91cc\u514b\u00b7\u5e0c\u514b',
  'Adam Hložek': '\u4e9a\u5f53\u00b7\u8d6b\u6d1b\u70ed\u514b',
  'Antonín Barák': '\u5b89\u4e1c\u5b81\u00b7\u5df4\u62c9\u514b',
  'Tomáš Čvančara': '\u6258\u9a6c\u65af\u00b6\u660c\u5361\u62c9',
  'Jan Kuchta': '\u626c\u00b7\u5e93\u8d6b\u5854',
  'Matěj Jurásek': '\u9a6c\u6377\u00b7\u5c24\u62c9\u585b\u514b',
  'Michal Sadílek': '\u7c73\u54c8\u5c14\u00b7\u8428\u8fea\u83b1\u514b',
  'Lukáš Provod': '\u5362\u5361\u65af\u00b7\u666e\u7f57\u6c83\u5fb7',
  'Mojmír Chytil': '\u83ab\u4f0a\u7c73\u5c14\u00b7\u5e0c\u8482\u5c14',
  'Petr Čech': '\u5f7c\u5f97\u00b7\u5207\u8d6b',
  'Tomáš Kalas': '\u6258\u9a6c\u65af\u00b7\u5361\u62c9\u65af',
  'Ondřej Kolář': '\u7fc1\u5fb7\u70c8\u00b7\u79d1\u62c9\u65e5',
  'Jakub Jankto': '\u96c5\u514b\u5e03\u00b7\u626c\u514b\u6258',
  'Pavel Kadeřábek': '\u5e15\u7ef4\u5c尔\u00b7\u5361\u5fb7\u83b1\u8d1d\u514b',
  'Pavel Šulc': '\u5e15\u7ef4\u5c14\u00b8\u8212\u5c14\u8328',

  // 波黑
  'Ibrahim Šehić': '\u6613\u535c\u62c9\u9960\u00b7\u820d\u5e0c\u5947',
  'Kenan Pirić': '\u80af\u5357\u00b7\u76ae\u91cc\u5947',
  'Edin Džeko': '\u57c3\u4e01\u00b7\u54f2\u79d1',
  'Miralem Pjanić': '\u7c73\u62c9\u52d2\u59c6\u00b7\u76ae\u4e9a\u5c3c\u5947',
  'Sead Kolašinac': '\u585e\u5fb7\u00b7\u79d1\u62c9\u5e0c\u7eb3\u8328',
  'Anel Ahmedhodžić': '\u963f\u5185\u5c14\u00b7\u827e\u54c8\u83ab\u970d\u5b63\u5947',
  'Amer Gojak': '\u963f\u6885\u5c14\u00b7\u6208\u4e9a\u514b',
  'Edin Višća': '\u57c3\u4e01\u00b7\u7ef4\u4ec0\u6070',
  'Smail Prevljak': '\u65af\u8fc8\u5c14\u00b7\u666e\u96f7\u7ef4\u5229\u4e9a\u514b',
  'Ermin Bičakčić': '\u5c14\u6c11\u00b7\u6bd4\u5bdf\u514b\u5947\u5947',
  'Admir Mehmedi': '\u963f\u5fb7\u7c73\u5c14\u00b7\u6885\u8d6b\u6885\u8fea',
  'Luka Menalo': '\u5362\u5361\u00b7\u6885\u7eb3\u6d1b',

  // 卡塔尔
  'Meshaal Barsham': '\u9a6c\u590f\u5c14\u00b7\u5df4\u6c99\u59c6',
  'Yousuf Butti': '\u4f18\u7d20\u798f\u00b7\u5e03\u8482',
  'Homam Ahmed': '\u970d\u66fc\u00b7\u827e\u54c8\u8fc8\u5fb7',
  'Tareq Salman': '\u5854\u91cc\u514b\u00b7\u8428\u5c14\u66fc',
  'Boualem Khoukhi': '\u5e03\u963f\u83b1\u59c6\u00b7\u80e1\u5e0c',
  'Akram Afif': '\u963f\u514b\u62c9\u59c6\u00b7\u963f\u83f2\u5e9c',
  'Almoez Ali': '\u963f\u5c14\u83ab\u57c3\u65af\u00b7\u963f\u91cc',
  'Mohammed Muntari': '\u7a46\u7f55\u9ed8\u5fb7\u00b8\u8499\u5854\u91cc',
  'Ahmad Hassan': '\u827e\u54c8\u8fc8\u5fb7\u00b7\u54c8\u6851',
  'Mustafa Mashal': '\u7a46\u65af\u5854\u6cd5\u00b7\u9a6c\u6c99\u5c14',
  'Abdulaziz Hatem': '\u963f\u535c\u675c\u62c9\u9f50\u5179\u00b7\u54c8\u7279\u59c6',
  'Karim Boudiaf': '\u5361\u91cc\u59c6\u00b7\u5e03\u8fea\u4e9a\u592b',
  'Pedro Miguel': '\u4f69\u5fb7\u7f57\u00b7\u7c73\u683c\u5c14',
  'Jassim Al-Jaber': '\u8d3e\u897f\u59c6\u00b7\u8d3e\u8d1d\u5c14',
  'Abdelkarim Hassan': '\u963f\u535c\u675c\u62c9\u5361\u91cc\u59c6\u00b7\u54c8\u6851',
  'Sultan Adil': '\u82cf\u4e39\u00b7\u963f\u8fea\u522b',
  'Ismail Mohamad': '\u4f0a\u65af\u6885\u5c14\u00b7\u7a46\u54c8\u9ed8\u5fb7',
  'Ali Afif': '\u963f\u91cc\u00b7\u963f\u83f2\u5e9c',

  // 加拿大
  'Dayne St. Clair': '\u6234恩\u00b7\u5723\u514b\u8d6b\u5c14',
  'James Pantemis': '\u8a79\u59c6\u65af\u00b7\u6f58\u7279\u7c73\u65af',
  'Maxime Crépeau': '\u9a6c\u514b\u897f\u59c6\u00b7\u514b\u96f7\u6ce2',
  'Alphonso Davies': '\u963f\u65b9\u7d22\u00b7\u6234\u7ef4\u65af',
  'Alistair Johnston': '\u963f\u5229\u65af\u6cf0\u5c14\u00b7\u7ea6\u7ff0\u65af\u987f',
  'Samuel Piette': '萨\u7f29\u5c14\u00b7\u76ae\u57c3\u7279',
  'Stephen Eustaquio': '\u65af\u8482\u82ac\u00b7\u6b27\u65af\u5854\u57fa\u5965',
  'Jonathan Osorio': '\u4e54\u7eb3\u68ee\u00b7\u5965\u7d22\u91cc\u5965',
  'Richie Laryea': '\u91cc\u5947\u00b7\u62c9\u5229\u4e9a',
  'Tajon Buchanan': '\u5854\u743c\u00b7\u5e03\u574e\u5357',
  'Cyle Larin': '赛\u52d2\u00b7\u62c9\u6797',
  'Jonathan David': '\u4e54\u7eb3\u68ee\u00b7\u6234\u7ef4',
  'Ike Ugbo': '\u4f0a\u514b\u00b7\u4e4c\u683c\u535a',
  'Jacen Russell-Rowe': '\u8d3e\u68ee\u00b7\u62c9\u5c14\u585e\u5c14-\u7f57',
  'Daniel Paraiso': '\u8fbe\u5c3c\u5c14\u00b7\u5e15\u83b1\u7d22',
  'Jacob Shaffelburg': '\u9c85\u52c3\u00b7\u6c99\u8d39\u5c14\u4f2f\u683c',
  'Kamal Miller': '\u5361\u8fc8\u5c14\u00b7\u7c73\u52d2',
  'Derek Cornelius': '\u5fb7\u91cc\u514b\u00b7\u79d1\u5c3c\u5229\u4e9e\u65af',
  'Mark-Anthony Kaye': '\u9a6c\u514b-\u5b89\u4e1c\u5c3c\u00b7\u51ef',
  'Junior Hoilett': '\u6731\u5c3c\u5c尔\u00b7\u970d\u4f0a\u83b1\u7279',
  'Kyle Hines': '\u51ef\u5c14\u00b7\u6d77\u56e0\u65af',

  // 海地
  'Alexandre Pierre': '\u4e9a\u538e\u5c71\u5927\u00b7\u76ae\u5c14',
  'Jhonny Placide': '\u7ea6\u7ff0\u5c3c\u00b7\u666e\u62c9\u897f\u5fb7',
  'Jules Philomon': '\u6731\u5c14\u65af\u00b7\u83f2\u6d1b\u8499',
  'Montruil Andre-Pierre': '\u8499\u7279\u7459\u4f0a\u00b7\u5b89\u5fb7\u70ae-\u76ae\u5c14',
  'Dany Lapointe': '\u8fbe\u5c3c\u00b7\u62c9\u666e\u5b89\u7279',
  'Donald Guerrier': '\u5510\u7eb3\u5fb7\u00b7\u683c\u91cc\u8036',
  'Mechack Jerome': '\u6885\u67e5\u514b\u00b7\u6770\u7f57\u59c6',
  'Patrick Burner': '\u5e15\u7279\u91cc\u514b\u00b7\u4f2f\u7eb3',
  'Andrew Jean-Louis': '\u5b89\u5fb7\u7f57\u00b7\u8ba9-\u8def\u6613',
  'Danelly Cadet': '\u8fbe\u5185\u5229\u00b7\u5361\u5fb7',
  'Frandy Pierrot': '\u5f17\u5170\u8fea\u00b7\u76ae\u8036\u7f57',
  'Duckens Nazon': '\u8fea\u80af\u00b7\u7eb3\u5b97',
  'Hervé Batomaila': '\u57c3\u5c14\u97e6\u00b7\u5df4\u6258\u8fc8\u62c9',
  'Wilfried Moïse': '\u5a01\u5c14\u5f17\u91cc\u5fb7\u00b7\u7a46\u74e6\u65af',
  'Ricardo Adé': '\u91cc\u5361\u591a\u00b7\u963f\u5fb7',
  'Louis Delmas': '路易\u65af\u00b7\u5fb7\u5c14\u739b\u65af',

  // 伊朗
  'Alireza Beiranvand': '\u91cc\u96f7\u624e\u00b7\u8d1d\u5170\u4e07\u5fb7',
  'Amir Abedzadeh': '\u963f\u7c73\u5c14\u00b7\u963f\u8d1d\u624e\u8fbe',
  'Payam Niazmand': '\u5e15\u4e9a\u59c6\u00b7\u5c3c\u4e9a\u5179\u66fc\u5fb7',
  'Saeid Ezatolahi': '赛\u4e0d\u00b7\u57c3\u624e\u6258\u62c9\u5e0c',
  'Mehdi Ghayedi': '\u8fc8\u8d6b\u8fea\u00b7\u76d6\u8036\u8fea',
  'Shoja Khalilzadeh': '\u8212\u8d3e\u00b7\u54c8\u5229\u624e\u8fbe',
  'Sadegh Moharrami': '\u8428\u5fb7\u683c\u00b7\u83ab\u54c8\u62c9\u7c73',
  'Mehdi Taremi': '\u8fc8\u8d6b\u8fea\u00b7\u5854\u96f7\u7c73',
  'Alireza Jahanbakhsh': '\u91cc\u96f7\u624e\u00b7\u8d3e\u6c57\u5df4\u514b\u4ec0',
  'Saman Ghoddos': '\u8428\u66fc\u00b7\u53e4\u591a\u65af',
  'Karim Ansarifard': '\u5361\u91cc\u59c6\u00b7\u5b89\u8428\u91cc\u6cd5\u5fb7',
  'Sardar Azmoun': '萨\u8fbe\u5c14\u00b7\u963f\u5179\u8499',
  'Mojtaba Mirzajanpour': '\u7a46\u6770\u5854\u5df4\u00b7\u7c73\u5c14\u624e\u8a79\u666e\u5c14',
  'Omid Ebrahimi': '\u5965\u7c73\u5fb7\u00b7\u57c3\u5e03\u62c9\u5e0c\u7c73',
  'Ehsan Hajsafi': '\u57c3\u6851\u00b7\u54c8\u8428\u8428\u975e',
  'Roozbeh Cheshmi': '\u9c81\u5179\u8d1d\u8d6b\u00b7\u5207\u4ec0\u7c73',
  'Noorollah Eskandari': '\u52aa\u7f57\u62c9\u00b7\u4f0a\u65af\u5361\u8fbe\u91cc',

  // 巴拿马
  'Luis Mejía': '\u8def\u6613\u65af\u00b7\u6885\u5e0c\u4e9a',
  'Cecil Waters': '塞\u897f\u5c14\u00b7\u6c83\u7279\u65af',
  'Fidel Escobar': '\u83f2\u5fb7\u5c14\u00b7\u57c3\u65af\u79d1\u74e6\u5c14',
  'Michael Murillo': '\u7c73\u514b\u5c14\u00b7\u7a71\u91cc\u7565',
  'Cristian Martínez': '\u514b\u91cc\u65af\u8482\u5b89\u00b7\u9a6c\u4e01\u5185\u65af',
  'Adalberto Carrasquilla': '\u963f\u8fbe\u5c14\u97e6\u6258\u00b7\u62c9\u65af\u594e\u5229\u4e9a',
  'Anibal Godoy': '\u963f\u5c3c\u74e6\u5c14\u00b7\u6208\u591a\u4f0a',
  'Eric Davis': '\u57c3\u91cc\u514b\u00b7\u6234\u7ef4\u65af',
  'Cecilio Waterman': '塞\u897f\u5229\u5965\u00b7\u6c83\u7279\u66fc',
  'Yoel Bárcenas': '\u7ea6\u5c14\u00b7\u5df4\u5c14\u585e\u7eb3\u65af',
  'Edgar Bárcenas': '\u57c3\u5fb7\u52a0\u5c14\u00b7\u5df4\u5c14\u585e\u7eb3\u65af',
  'Ismael Díaz': '\u4f0a\u65af\u6885\u5c14\u00b7\u8fea\u4e9a\u65af',
  'Cesar Blackman': '塞\u8428\u5c14\u00b7\u5e03\u83b1\u514b\u66fc',
  'Rolando Blackburn': '\u7f57\u5170\u591a\u00b7\u5e03\u83b1\u514b\u4f2f\u6069',
  'José Luis Rodríguez': '\u4f55\u585e\u00b7\u8def\u6613\u65af\u00b7\u7f57\u5fb7\u91cc\u683c\u65af',
  'Luis Mejía2': '\u8def\u6613\u65af\u00b7\u6885\u5e0c\u4e9a',

  // 哥伦比亚
  'David Ospina': '\u6234\u7ef4\u00b7\u5965\u65af\u76ae\u7eb3',
  'Camilo Vargas': '\u5361\u7c73\u6d1b\u00b7\u5c14\u74e6\u52a0\u65af',
  'Álvaro Montero': '\u963f\u5c14\u74e6\u7f57\u00b7\u8499\u7279\u7f57',
  'Davinson Sánchez': '\u6234\u6587\u68ee\u00b7\u6851\u5207\u65af',
  'Carlos Cuesta': '\u5361\u6d1b\u65af\u00b7\u5e93\u65af\u5854',
  'Jhon Lucumí': '\u7ff0\u00b7\u5362\u5e93\u7c73',
  'Daniel Muñoz': '\u4e39\u5c3c\u5c尔\u00b7\u7a46\u5c3c\u5965\u65af',
  'Juan Cuadrado': '\u80e1\u5b89\u00b7\u5938\u5fb7\u62c9\u591a',
  'James Rodríguez': '\u54c8\u6885\u65af\u00b7\u7f57\u5fb7\u91cc\u683c\u65af',
  'Jefferson Lerma': '\u6770\u6590\u900a\u00b7\u52d2\u9a6c',
  'Richard Ríos': '\u91cc\u67e5\u5fb7\u00b7\u91cc\u5965\u65af',
  'Mateus Uribe': '\u9a6c\u7279\u4e4c\u65af\u00b7\u4e4c\u5229\u97e6',
  'Luis Díaz': '路易\u65af\u00b7\u8fea\u4e9a\u65af',
  'Rafael Santos Borré': '\u62c9\u6cd5\u5c14\u00b7\u6851\u6258\u65af\u00b7\u535a\u96f7',
  'John Jader Durán': '\u54c8\u5fb7\u5c14\u00b7\u675c\u5170',
  'Jhon Córdoba': '翁\u00b7\u79d1\u5c14\u591a\u74e6',
  'Luis Sinisterra': '路易\u65af\u00b7\u897f\u65af\u5185\u7f57',
  'Miguel Borja': '\u7c73\u683c\u5c14\u00b7\u535a\u5c14\u54c8',
  'Jhon Arias': '翁\u00b7\u963f\u91cc\u4e9a\u65af',
  'Cristian Arango': '\u514b\u91cc\u65af\u8482\u5b89\u00b7\u963f\u6717\u6b2f',
  'Johan Mojica': '\u7ea6\u7ff0\u00b7\u83ab\u5e0c\u5361',
  'Falcao García': '\u6cd5\u5c14\u8003\u00b7\u52a0\u897f\u4e9a',

  // 摩洛哥
  'Yassine Bounou': '\u4e9a\u8f9b\u00b7\u5e03\u52aa',
  'Monir El Kajoui': '\u846b\u5c3c\u5c14\u00b7\u5361\u6731\u4f0a',
  'Achraf Hakimi': '\u963f\u4ec0\u62c9\u592b\u00b7\u54c8\u57fa\u7c73',
  'Nayef Aguerd': '\u7eb3\u8036\u592b\u00b7\u963f\u683c\u5c14\u5fb7',
  'Romain Saiss': '\u7f57\u66fc\u00b7\u8d5b\u65af',
  'Youssef Aït Bennasser': '\u4f18\u7d20\u798f\u00b7\u963f\u4f0a\u7279\u00b7\u672c\u7eb3\u585e\u5c14',
  'Sofyan Amrabat': '\u7d22\u592b\u626c\u00b7\u963f\u59c6\u62c9\u5df4\u7279',
  'Hakim Ziyech': '\u54c8\u57fa\u59c6\u00b7\u9f50\u8036\u8d6b',
  'Selim Amallah': '塞\u5229\u59c6\u00b7\u963f\u739b\u62c9',
  'Azzedine Ounahi': '\u963f\u5179\u4e01\u00b7\u4e4c\u7eb3\u5e0c',
  'Issa Kaboré': '\u4f0a\u8428\u00b7\u5361\u535a\u96f7',
  'Youssef En-Nesyri': '\u4f18\u7d20\u798f\u00b7\u6069-\u5185\u65af\u91cc',
  'Abde Ezzalzouli': '\u963f\u535c\u5fb7\u00b7\u57c3\u624e\u5c14\u4f50\u5229',
  'Achraf Dari': '\u963f\u4ec0\u62c9\u592b\u00b7\u8fbe\u91cc',
  'Walid Cheddira': '\u74e6\u5229\u5fb7\u00b8\u8c22\u8fea\u62c9',
  'Amine Harit': '\u963f\u660e\u00b7\u54c8\u91cc\u7279',
  'Bilal El Khannouss': '\u6bd4\u62c9\u5229\u00b7\u6c49\u52aa\u65af',
  'Ismail Saibari': '\u4f0a\u65af\u6885\u5c14\u00b7\u8d5b\u5df4\u91cc',
  'Abdelhamid Sabiri': '\u963f\u535c\u5fb7\u54c8\u7c73\u5fb7\u00b7\u8428\u6bd4\u91cc',
  'Yahya Attiat-Allah': '\u53f6\u6d77\u4e9a\u00b7\u963f\u63d0\u4e9a\u7279-\u963f\u62c9',
  'Ryan Mmaee': '\u745e\u5b89\u00b7\u9a6c\u57c3',
  'Zakaria Aboukhlal': '\u624e\u5361\u91cc\u4e9a\u00b7\u963f\u5e03\u8d6b\u62c9\u5c14',
  'Jawhar El Yennaq': '\u8d3e\u74e6\u5c14\u00b7\u57c3\u8036\u7eb3\u514b',
  'Chaibi El Yonnaq': '\u67e5\u6bd4\u00b7\u57c3\u7ea6\u7eb3\u514b',

  // 苏格兰
  'Angus Gunn': '\u5b89\u683c\u65af\u00b7\u5188\u6069',
  'Zander Clark': '赞\u5fb7\u00b7\u514b\u62c9\u514b',
  'Scott McKenna': '\u65af\u79d1\u7279\u00b7\u9ea6\u80af\u7eb3',
  'Kieran Tierney': '\u57fa\u5170\u00b8\u8482\u5c14\u5c3c',
  'Andy Robertson': '\u5b89\u8fea\u00b7\u7f57\u4f2f\u900a',
  'Jack Hendry': '\u6770\u514b\u00b7\u4ea8\u5fb7\u91cc',
  'Grant Hanley': '\u683c\u5170\u7279\u00b7\u6c49\u5229',
  'Ryan Porteous': '\u745e\u5b89\u00b7\u6ce2\u7279\u5965\u65af',
  'Callum McGregor': '\u5361\u5c14\u59c6\u00b7\u9ea6\u683c\u96f7\u6208',
  'Scott McTominay': '\u65af\u79d1\u7279\u00b7\u9ea6\u514b\u6258\u7c73\u5948',
  'Billy Gilmour': '\u6bd4\u5229\u00b7\u5409\u6469\u5c14',
  'Ryan Christie': '\u745e\u5b89\u00b7\u514b\u91cc\u65af\u8482',
  'John McGinn': '\u7ea6\u7ff0\u00b7\u9ea6\u91d1\u6069',
  'Lawrence Shankland': '\u52b3\u4f26\u65af\u00b7\u9999\u5170\u5761',
  'Che Adams': '\u5207\u00b7\u4e9a\u5f15\u65af',
  'James Forrest': '\u8a79\u59c6\u65af\u00b7\u798f\u96f7\u65af\u7279',
  'Stuart Armstrong': '\u65af\u56fe\u7279\u00b7\u963f\u59c6\u65af\u7279\u6717',
  'Lewis Morgan': '路易\u65af\u00b7\u6469\u6839',
  'Ryan Jack': '\u745e\u5b89\u00b7\u6770\u514b',
  'Greg Taylor': '\u683c\u96f7\u683c\u00b7\u6cf0\u5c14',
  'Kenny McLean': '\u80af\u5c3c\u00b7\u9ea6\u514b\u83b1\u6069',
  'Ellis Simms': '\u57c3\u5229\u65af\u00b7\u897f\u59c6',
  'Tommy Conway': \u6c64\u7c73\u00b7\u5eb7\u5a01',
  'Ben Doak': '\u672c\u00b7\u591a\u514b',
  'James Tavernier': '\u8a79\u59c6\u65af\u00b7\u5854\u5f17\u91cc\u8036',
  'Anthony Ralston': '\u5b89\u4e1c\u5c3c\u00b7\u62c9\u5c14\u65af\u987f',

  // 奥地利
  'Heinz Lindner': '\u6d77\u6069\u8328\u00b7\u6797\u5fb7\u7eb3',
  'Florian Grillitsch': '\u5f17\u6d1b\u91cc\u5b89\u00b7\u683c\u91cc\u5229\u5947',
  'Philipp Lienhart': '\u83f2\u5229\u666e\u00b7\u6797\u54c8\u7279',
  'Marcel Sabitzer': '\u9a6c\u585e\u5c14\u00b7\u8428\u6bd4\u7b56',
  'Konrad Laimer': '\u5eb7\u62c9\u5fb7\u00b7\u83b1\u9ed8\u5c14',
  'Christoph Baumgartner': '\u514b\u91cc\u65af\u6258\u592b\u00b7鲍\u59c6\u52a0\u7279\u7eb3',
  'Kevin Danso': '\u51ef\u6587\u00b7\u4e39\u7d22',
  'Guido Burgstaller': '\u5409\u591a\u00b7\u5e03\u5c14\u683c\u65af\u5854\u52d2',
  'Marko Arnautovic': '\u9a6c\u5c14\u79d1\u00b7\u963f\u5c14\u7eb3\u6258\u7ef4\u514b',
  'Michael Gregoritsch': '\u7c73\u590f\u5c14\u00b7\u683c\u96f7\u6258\u91cc\u5947',
  'Roman Schiemann': '\u7f57\u66fc\u00b7\u5e2d\u66fc',
  'Patrick Pentz': '\u5e15\u7279\u91cc\u514b\u00b7\u5f6d\u8328',
  'Maximilian Entrep': '\u9a6c\u514b\u897f\u7c73\u5229\u5b89\u00b7\u6069\u7279\u96f7\u666e',

  // 埃及
  'Mohamed El-Shennawy': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u8c22\u7eb3\u7ef4',
  'Ahmed El-Shenawy': '\u827e\u54c8\u8fc8\u5fb7\u00b7\u8c22\u7eb3\u7ef4',
  'Mohammed El-Shennawy2': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u8c22\u7eb3\u7ef4',
  'Ahmed Hegazi': '\u827e\u54c8\u8fc8\u5fb7\u00b7\u8d6b\u52a0\u9f50',
  'Omar Kamal': '\u5965\u9a6c\u5c14\u00b7\u5361\u9a6c\u5c14',
  'Ahmed Fathy': '\u827e\u54c8\u8fc8\u5fb7\u00b7\u6cd5\u5e0c',
  'Taher Mohamed Taher': '\u5854\u8d6b\u5c14\u00b7\u7a46\u7f55\u9ed8\u5fb7\u00b7\u5854\u8d6b\u5c14',
  'Mohamed Abdelmonem': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u963f\u535c\u675c\u83ab\u5185\u59c6',
  'Ashraf Hakimi': '\u963f\u4ec0\u62c9\u592b\u00b7\u54c8\u57fa\u7c73',
  'Mahmoud Alaa': '\u9a6c\u54c8\u8302\u5fb7\u00b7\u963f\u62c9',
  'Ahmed Eid': '\u827e\u54c8\u8fc8\u5fb7\u00b7\u827e\u5fb7',
  'Omar Marmoush': '\u5965\u9a6c\u5c14\u00b7\u9a6c\u5c14\u7a46\u4ec0',
  'Mostafa Mohamed': '\u7a46\u65af\u5854\u6cd5\u00b7\u7a46\u7f55\u9ed8\u5fb7',
  'Mohamed Sherif': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u8c22\u91cc\u592b',
  'Trezeguet': '\u7279\u96f7\u6cfd\u76d6',
  'Emam Ashour': '\u4f0a\u739b\u59c6\u00b7\u963f\u8212\u5c14',
  'Hamdy Fathy': '\u54c8\u59c6\u8fea\u00b7\u6cd5\u5e0c',
  'Mahmoud Kahraba': '\u9a6c\u54c8\u8302\u5fb7\u00b7\u5361\u62c9\u5df4',
  'Ramadan Sobhi': '\u62c9\u9a6c\u4e39\u00b7\u82cf\u535c\u5e0c',
  'Akram Tawfik': '\u963f\u514b\u62c9\u59c6\u00b7\u9676\u83f2\u514b',
  'Ali Gabr': '\u963f\u91cc\u00b7\u52a0\u5e03\u5c14',

  // 加纳
  'Richard Ofori': '\u91cc\u67e5\u5fb7\u00b7\u5965\u798f\u91cc',
  'Lawrence Ati-Zigi': '\u52b3\u4f26\u65af\u00b7\u963f\u8482-\u9f50\u5409',
  'Jeffrey Schlupp': '\u6770\u5f17\u91cc\u00b7\u65bd\u5362\u666e',
  'Alexander Djiku': '\u4e9a\u5386\u5c71\u5927\u00b7\u5409\u5e93',
  'Tariq Lamptey': '\u5854\u91cc\u514b\u00b7\u62c9\u666e\u6cf0',
  'Thomas Partey': '\u6258\u9a6c\u65af\u00b7\u5e15\u6cf0',
  'Elisha Owusu': '\u4f0a\u8389\u838e\u00b7\u5965\u4e4c\u82cf',
  'Inaki Williams': '\u4f0a\u7eb3\u57fa\u00b7\u5a01\u5ec9\u59c6\u65af',
  'Mohammed Kudus': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u5e93\u675c\u65af',
  'Antoine Semenyo': '\u5b89\u6258\u74e6\u00b7 塞\u6885\u7ebd',
  'Jordan Ayew': '\u4e54\u4e39\u00b7\u963f\u5c24',
  'André Ayew': '\u5b89\u5fb7\u70c8\u00b7\u963f\u5c24',
  'Joseph Aidoo': '\u7ea6\u745f\u592b\u00b7\u827e\u675c',
  'Osman Bukari': '\u5965\u65af\u66fc\u00b7\u5e03\u5361\u91cc',
  'Kamaldeen Sulemana': '\u5361\u5c14\u59c9\u4e01\u00b7\u82cf\u83b1\u9a6c\u7eb3',
  'Ernest Nuamah': '\u5385\u65af\u7279\u00b7\u52aa\u4e9a\u9a6c',
  'Salis Abdul Samed': '\u8428\u5229\u65af\u00b7\u963f\u535c\u675c\u00b7\u8428\u6885\u5fb7',
  'Daniel Afriyie Barnieh': '\u4e39\u5c3c\u5c尔\u00b7\u963f\u5f15\u5229\u8036\u00b7\u5df4\u5c14尼\u8036',
  'Mubarak Wakaso': '\u7a46\u5df4\u62c9\u514b\u00b7\u74e6\u5361\u7d22',

  // 阿尔及利亚
  'Anthony Mandrea': '\u5b89\u4e1c\u5c3c\u00b7\u66fc\u5fb7\u96f7\u4e9a',
  'Moustapha Zeghba': '\u7a46\u65af\u5854\u6cd5\u00b7\u6cfd格\u5df4',
  'Haissem Aouar': '\u827e\u585e\u59c6\u00b7\u963f\u74e6\u5c14',
  'Nabil Bentaleb': '\u7eb3\u6bd4\u5c22\u00b7\u672c\u5854\u83b1\u5e03',
  'Youcef Atal': '\u4f18\u7d20\u798f\u00b7\u963f\u5854\u5c14',
  'Islam Slimani': '\u4f0a\u65af\u5170\u00b7\u65af\u5229\u9a6c\u5c3c',
  'Andy Delort': '\u5b89\u8fea\u00b7\u5fb7\u6d1e\u5c14',
  'Ryad Boudebouz': '\u91cc\u4e9a\u5fb7\u00b7\u5e03\u5fb7\u5e03\u5179',
  'Baghdad Bounedjah': '\u5df4格\u8fbe\u5fb7\u00b7\u5e03\u5185\u8d3a',
  'Adam Ounas': '\u4e9a\u5f53\u00b7\u4e4c\u7eb3\u65af',
  'Rami Bensebaini': '\u62c9\u7c73\u00b7\u672c\u585e\u62dc\u5c3c',
  'Aissa Mandi': '\u827e\u8428\u00b7\u66fc\u8fea',
  'Ishan Belfodil': '\u4f0a\u5c1a\u00b7\u8d1d\u5c14\u798f\u8fea\u5c14',

  // 突尼斯
  'Bechir Ben Said': '\u8d1d\u5e0c\u5c14\u00b7\u672c\u00b7\u8d5b\u4e49\u5fb7',
  'Moez Ben Cherifia': '\u7a46\u57c3\u5179\u00b7\u672c\u00b8\u8c22\u91cc\u8d39\u4e9a',
  'Aymen Dahmen': '\u827e\u95e8\u00b7\u8fbe\u8d6b\u95e8',
  'Dylan Bronn': '\u8fea\u4f26\u00b7\u5e03\u9f99',
  'Montassar Talbi': '\u8499\u5854\u8428\u5c14\u00b7\u5854\u5c14\u6bd4',
  'Yassine Meriah': '\u4e9a\u8f9b\u00b7\u6885\u91cc\u4e9a',
  'Ali Maâloul': '\u963f\u91cc\u00b7\u9a6c\u5362\u52d2',
  'Mohamed Dräger': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u5fb7\u62c9\u683c\u5c14',
  'Aïssa Laïdouni': '\u827e\u8428\u00b7\u83b1\u675c\u5c3c',
  'Ellyes Skhiri': '\u57c3\u5229\u8036\u65af\u00b7\u65af\u5e0c\u91cc',
  'Hannibal Mejbri': '\u6c49\u5c3c\u62d4\u00b7\u6885\u540e\u91cc\u5e03',
  'Ghailene Chaalali': '\u76d6\u83b1\u5185\u00b7\u6c99\u62c9\u5229',
  'Wahbi Khazri': '\u74e6\u8d6b\u6bd4\u00b7\u54c8\u5179\u91cc',
  'Naïm Sliti': '\u5948\u59c6\u00b7\u65af\u5229\u8482',
  'Haythem Jouini': '\u6d77\u585e\u59c6\u00b7\u8339\u5c3c\u5c3c',
  'Mohamed Ali Ben Romdhane': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u963f\u91cc\u00b7\u672c\u00b7\u7f57\u66fc\u4e39',
  'Issam Jebali': '\u4f0a\u8428\u59c6\u00b7\u6770\u5df4\u5229',
  'Hamza Mathlouthi': '\u54c8\u59c6\u624e\u00b7\u9a6c\u65af\u5362\u897f',
  'Ali Abdi': '\u963f\u91cc\u00b7\u963f\u535c\u8fea',
  'Ferjani Sassi': '\u8d39\u5c14\u8d3a\u5c3c\u00b7\u8428\u897f',
  'Issam Jebali2': '\u4f0a\u8428\u59c6\u00b7\u6770\u5df4\u5229',
  'Ellyes Skhiri2': '\u57c3\u5229\u8036\u65af\u00b7\u65af\u5e0c\u91cc',
  'Hannibal Mejbri2': '\u6c49\u5c3c\u62d4\u00b7\u6885\u540e\u91cc\u5e03',
  'Ghailene Chaalali2': '\u76d6\u83b1\u5185\u00b7\u6c99\u62c9\u5229',

  // 约旦
  'Yazan Abu Arab': '\u4e9a\u8d5e\u00b7\u963f\u5e03\u00b7\u963f\u62c9\u4f2f',
  'Moataz Yasin': '\u7a46\u963f\u5854\u5179\u00b7\u4e9a\u8f9b',
  'Faisal Arab': '\u8d39\u8428\u5c14\u00b7\u963f\u62c9\u4f2f',
  'Saeed Murjan': '赛\u4e0b\u00b7\u7a46\u5c14\u8a79',
  'Mousa Suleiman Taamari': '\u7a46\u8428\u00b7\u82cf\u83b1\u66fc\u00b7\u5854\u9a6c\u91cc',
  'Ali Olwan': '\u963f\u91cc\u00b7\u5965\u5c14\u4e07',
  'Sheridan Saleh': '\u8c22\u91cc\u767b\u00b7\u8428\u5229\u8d6b',
  'Noor Al-Rawabdeh': '\u52aa\u5c14\u00b7\u62c9\u74e6\u5e03\u5fb7\u8d6b',

  // 伊拉克
  'Ahmed Basil': '\u827e\u54c8\u8fc8\u5fb7\u00b7\u5df4\u585e\u5c14',
  'Fahad Talib': '\u6cd5\u8d6b\u5fb7\u00b7\u5854\u5229\u5e03',
  'Mohammed Hama': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u54c8\u9a6c',
  'Ahmed Yahia': '\u827e\u54c8\u8fc8\u5fb7\u00b7\u53f6\u6d77\u4e9a',
  'Rebin Sulaka': '\u96f7\u5bbe\u00b7\u82cf\u62c9\u5361',
  'Saad Natiq': '萨\u5fb7\u00b7\u7eb3\u8482\u514b',
  'Ali Adnan': '\u963f\u91cc\u00b7\u963f\u5fb7\u5357',
  'Amjed Attwan': '\u963f\u59c6\u6770\u5fb7\u00b7\u963f\u7279\u4e07',
  'Aymen Hussein': '\u827e\u95e8\u00b7\u4faf\u8d5b\u56e0',
  'Omar Al-Rashidi': '\u5965\u9a6c\u5c14\u00b7\u62c9\u5e0c\u8fea',
  'Zidane Iqbala': '\u9f50\u8fbe\u5185\u00b7\u4f0a\u514b\u5df4\u62c9',
  'Mohammed Ali': '\u7a46\u7f55\u9ed8\u5fb7\u00b7\u963f\u91cc',
  'Amina Sher': '\u963f\u7c73\u5a1c\u00b7\u8c22\u5c14',

  // 乌兹别克斯坦
  'Sanjar Kodirkulov': '\u6851\u8d3e\u5c14\u00b7\u79d1\u8fea\u5c14\u5e93\u6d1b\u592b',
  'Utkir Yusupov': '\u4e4c\u7279\u57fa\u5c14\u00b7\u5c24\u82cf\u6ce2\u592b',
  'Abduvokhidjon Khojiakbarov': '\u963f\u535c\u6c83\u5fee\u5fe8\u00b7\u970d\u8d3e\u514b\u5df4\u7f57\u592b',
  'Abbosbek Fayzullaev': '\u963f\u535a\u65af\u8d1d\u514b\u00b7\u6cd5\u4f9d\u7956\u62c9\u8036\u592b',
  'Jaloliddin Masharipov': '\u8d3e\u6d1b\u5229\u4e01\u00b7\u9a6c\u6c99\u91cc\u6ce2\u592b',
  'Hoziyor Nematov': '\u970d\u6d4e\u7ea6\u5c14\u00b7\u5185\u9a6c\u6258\u592b',
  'Odilzhon Abdurakhmonov': '\u5965\u8fea\u5c14\u5fe8\u00b7\u963f\u535c\u62c9\u8d6b\u83ab\u8bfa',
  'Jamshid Iskanderov': '\u8d3e\u59c6\u5e0c\u5fb7\u00b7\u4f0a\u65af\u5766\u5fb7\u7f57\u592b',
  'Shukhrat Aliqulov': '\u8212\u8d6b\u62c9\u7279\u00b7\u963f\u5229\u5e93\u6d1b\u592b',
  'Eldor Shomurodov': '\u57c3\u5c14\u591a\u5c14\u00b7\u8096\u7a46\u7f57\u591a\u592b',
  'Oston Urunov': '\u5965\u65af\u987f\u00b7\u4e4c\u9c81\u8bfa\u8bfa',
  'Azizbek Turgunbaev': '\u963f\u9f50\u5179\u514b\u00b7\u56fe\u5c14\u8d21\u5df4\u8036\u592b',
  'Jasurbek Yaxshiboev': '\u8d3e\u82cf\u5c14\u8d1d\u514b\u00b7\u4e9a\u8d6b\u5e0c\u535a\u8036\u592b',
  'Abdukodir Khusanov': '\u963f\u535c\u79d1\u8fea\u5c14\u00b7\u80e1\u8428\u8bfa\u592b',
  'Umaraliyev Rustamjon': '\u4e4c\u9a6c\u91cc\u4e9a\u5229\u8036\u592b\u00b7\u9c81\u65af\u5854\u59c6\u5bb9',
  'Mirzaev Mirjalol': '\u7c73\u5c14\u624e\u8036\u592b\u00b7\u7c73\u5c14\u8d3e\u6d1b\u5c14',
  'Saidkarim Saidkarimov Alikhon': '赛\u5fb7\u5361\u91cc\u59c6\u00b7赛\u5fb7\u5361\u91cc\u83ab\u592b\u00b7\u963f\u5229\u6d2a',
  'Khojiakbar Alijonov': '\u970d\u8d3e\u514b\u5df4\u5c14\u00b7\u963f\u5229\u7ea6\u8bfa\u592b',
  'Javokhir Sidikov': '\u8d3a\u6c83\u5e0c\u5c14\u00b7\u897f\u8fea\u79d1\u592b',
  'Firuzbek Mukhammadaliev': '\u83f2\u9c81\u5179\u8d1d\u514b\u00b7\u7a46\u7f55\u9ed8\u5fb7\u963f\u5229\u8036\u592b',
  'Abdukodir Khusanov2': '\u963f\u535c\u79d7\u8fea\u5c14\u00b7\u80e1\u8428\u8bfa\u592b',
  'Diyor Imomkhodjaev': '\u8fea\u7ea6\u5c14\u00b7\u4f0a\u83ab\u59c9\u8d6a\u8036\u8036\u592b',
  'Umaraliyev Rustamjon2': '\u4e4c\u9a6c\u91cc\u4e9a\u5229\u8036\u592b\u00b7\u9c81\u65af\u5854\u59c6\u5bb9',
  'Abdugaffor Qodirqulov': '\u963f\u535c\u52a0\u5bcc\u5c14\u00b7\u79d1\u8fea\u5c14\u5e93\u6d1b\u592b',

  // 佛得角
  'Vozinha': '\u6c83\u9f50\u5c3c\u4e9a',
  'Dinei Borges': '\u8fea\u5185\u4f0a\u00b7\u535a\u5c14\u8d6b\u65af',
  'Jefferson': '\u6770\u6590\u900a',
  'Patrick Andrade': '\u5e15\u7279\u91cc\u514b\u00b7\u5b89\u5fb7\u62c9\u5fb7',
  'Ryan Mendes': '\u745e\u5b89\u00b7\u95e8\u5fb7\u65af',
  'Garry Rodrigues': '\u52a0\u91cc\u00b7\u7f57\u5fb7\u91cc\u683c\u65af',
  'Kelvin Pires': '\u51ef\u5c14\u6587\u00b7\u76ae\u96f7\u65af',
  'Joel Mendes': '\u82e5\u5c14\u00b7\u95e8\u5fb7\u65af',
  'Bebe': '\u8d1d\u8d1d',

  // 民主刚果
  'Lionel Mpasi': '\u83b1\u6602\u5185\u5c14\u00b7\u59c6\u5e15\u897f',
  'Nicolas Kinambi': '\u5c3c\u53e4\u62c9\u65af\u00b7\u91d1\u7eb3\u7c73',
  'Henoc Inonga Beka': '\u5a1c\u8bfa\u514b\u00b7\u4f0a\u519c\u52a0\u00b7\u8d1d\u5361',
  'Chancel Mbemba': '\u94b1\u585e\u5c14\u00b7\u59c6\u672c\u5df4',
  'Arthur Masuaku': '\u963f\u745f\u00b7\u9a6c\u82cf\u4e9a\u5e93',
  'Glody Ngonda': '\u683c\u6d1b\u8fea\u00b7\u6069\u8d21\u8fbe',
  'Gaël Kakuta': '\u76d6\u5c14\u00b7\u5361\u5e93\u5854',
  'Yoane Wissa': '\u7ea6\u5b89\u00b7\u7ef4\u8428',
  'Silas Katompa Mvumpa': '\u897f\u62c9\u65af\u00b7\u5361\u901a\u5e15\u00b7\u59c6\u6e29\u5e15',
  'Brit Assamba': '\u5e03\u91cc\u7279\u00b7\u963f\u6851\u5df4',
  'Meschack Elia': '\u6885\u6c99\u514b\u00b7\u57c3\u5229\u4e9a',
  'Arthur Kyshenko': '\u963f\u745e\u00b7\u57fa\u7533\u79d1',
  'Fiston Mayele': '\u83f2\u65af\u987f\u00b7\u9a6c\u8036\u83b1',
  'Gedeon Kalulu': '\u70ed\u5fb7\u7fc0\u00b7\u5361\u5362\u5362',
  'Theo Bongonda': '\u6cf0\u5965\u00b7\u90a6\u8d21\u8fbe',
  'Britt Assamba': '\u5e03\u91cc\u7279\u00b7\u963f\u6851\u5df4',
  'Meschack Elia2': '\u6885\u6c99\u514b\u00b7\u57c3\u5229\u4e9a',
  'Fiston Mayele2': '\u83f2\u65af\u987f\u00b7\u9a6c\u8036\u83b1',
  'Gedeon Kalulu2': '\u70ed\u5fb7\u7fc0\u00b7\u5361\u5362\u5362',
  'Theo Bongonda2': '\u6cf0\u5965\u00b7\u90a6\u8d21\u8fbe',

  // 科特迪瓦
  'Yahia Fofana': '\u53f6\u6d77\u4e9a\u00b7\u798f\u6cd5\u7eb3',
  'Badra Ali Sangaré': '\u5df4\u5fb7\u62c9\u00b7\u963f\u91cc\u00b7\u6851\u52a0\u96f7',
  'Ibrahim Cissé': '\u6613\u535c\u62c9\u6b23\u00b7\u897f\u585e',
  'Wilfried Zaha': '\u5a01\u5c14\u5f17\u91cc\u5fb7\u00b7\u624e\u54c8',
  'Simon Deli': '西\u8499\u00b7\u5fb7\u5229',
  'Frank Kessié': '\u5f17\u5170\u514b\u00b7\u51ef\u897f',
  'Serge Aurier': '塞\u5c14\u65e5\u00b7\u5965\u91cc\u8036',
  'Seko Mohamed Fofana': '塞\u79d1\u00b7\u7a46\u7f55\u9ed8\u5fb7\u00b7\u798f\u6cd5\u7eb3',
  'Christian Bammou': '\u514b\u91cc\u65af\u8482\u5b89\u00b7\u5df4\u7a46',
  'Sébastien Haller': '塞\u5df4\u65af\u8482\u5b89\u00b7\u963f\u83b1',
  'Franck Kessié': '\u5f17\u5170\u514b\u00b7\u51ef\u897f',
  'Wilfried Singo': '\u5a01\u5c14\u5f17\u91cc\u5fb7\u00b8\u8f9b\u6208',
  'Simon Adingra': '西\u8499\u00b7\u963f\u4e01\u683c\u62c9',
  'Nicolas Pépé': '\u5c3c\u53e4\u62c9\u65af\u00b7\u4f69\u4f69',
  'Seydou Doumbia': '塞\u675c\u00b7\u655a\u6bd4\u4e9a',
  'Opa Ingué': '\u5965\u5e15\u00b7\u6069\u5728',
  'Badra Ali Sangaré2': '\u5df4\u5fb7\u62c9\u00b7\u963f\u91cc\u00b7\u6851\u52a0\u96f7',
  'Ibrahim Cissé2': '\u6613\u535c\u62c9\u6b23\u00b7\u897f\u585e',
  'Wilfried Zaha2': '\u5a01\u5c14\u5f17\u91cc\u5fb7\u00b7\u624e\u54c8',
  'Simon Deli2': '西\u8499\u00b7\u5fb7\u5229',
  'Frank Kessie2': '\u5f17\u5170\u514b\u00b7\u51ef\u897f',
  'Serge Aurier2': '塞\u5c14\u65e5\u00b7\u5965\u91cc\u8036',
  'Seko Mohamed Fofana2': '塞\u79d1\u00b7\u7a46\u7f55\u9ed8\u5fb7\u00b7\u798f\u6cd5\u7eb3',
  'Christian Bammou2': '\u514b\u91cc\u65af\u8482\u5b89\u00b7\u5df4\u7a46',
  'Sébastien Haller2': '塞\u5df4\u65af\u8482\u5b89\u00b7\u963f\u83b1',
  'Franck Kessié2': '\u5f17\u5170\u514b\u00b7\u51ef\u897f',
  'Wilfried Singo2': '\u5a01\u5c14\u5f17\u91cc\u5fb7\u00b8\u8f9b\u6208',
  'Simon Adingra2': '西\u8499\u00b7\u963f\u4e01\u683c\u62c9',
  'Nicolas Pépé2': '\u5c3c\u53e4\u62c9\u65af\u00b7\u4f69\u4f69',
  'Seydou Doumbia2': '塞\u675c\u00b7\u655a\u6bd4\u4e9a',

  // 库拉索
  'Eloy Room': '\u57c3\u6d1b\u4f0a\u00b7\u9c81\u59c6',
  'Aart Biesterveldt': '\u963f\u5c14\u7279\u00b7\u6bd4\u65af\u7279\u8d39\u5c14\u5fb7\u7279',
  'Charlon Biscoe': '\u67e5\u4f26\u00b7\u6bd4\u65af\u79d1',
  'Leandro Bacuna': '\u83b1\u6602\u5fb7\u7f57\u00b7\u5df4\u5e93\u7eb3',
  'Cuco Martina': '\u5e93\u79d1\u00b7\u9a6c\u8482\u7eb3',
  'Juninho Bacuna': '\u6731\u5c3c\u5c3c\u5965\u00b7\u5df4\u5e93\u7eb3',
  'Rangelo Janga': '\u5170\u8d6b\u6d1b\u00b7\u626c\u52a0',
  'Gino van Kessel': '\u5409\u8bfa\u00b7\u8303\u51ef\u585b',
  'Kenji Gorre': '\u80af\u5409\u00b7\u6208\u5c14\u96f7'
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

// 并发控制
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
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

function findChineseName(englishName) {
  if (!englishName) return englishName;
  if (playerCNNames[englishName]) return playerCNNames[englishName];
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
      name: chineseName,
      nameEn: p.name,
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
      teamName: m.name || p.teamName,
      teamNameEn: p.teamName,
      flag: m.flag || '\ud83c\udff3\ufe0f',
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
  console.log(`\u2705 players2026.js \u5df2\u751f\u6210 (${playersDetailData.length}\u540d\u7403\u5458)`);

  // ====== 2. 生成teams2026.js ======
  const teams = apiData.teams.map((team) => {
    const m = teamMapping[team.name] || {
      id:0, name:team.name, flag:'\ud83c\udff3\ufe0f', group:'?', nickname:team.name, starPlayer:'',
      description:`${team.name}\u56fd\u5bb6\u961f`, goldQuote:`\u6b22\u8fce\u5173\u6ce8${team.name}`
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
        quote: `${posMap[p.position]||p.position} | ${detail.currentTeam ? detail.currentTeam.name : m.name}\u56fd\u5bb6\u961f`
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
  const output = `// data/teams2026.js - 2026世界杯48强球队百科数据
// 数据源：Football-Data.org API (competition WC id:2000)
// 球员详细信息来自 persons/{playerId} 接口
// 生成时间：${new Date().toISOString().split('T')[0]}
// 共 ${teams.length} 支球队 | ${totalPlayers} 名球员 | 含中文名+俱乐部+球衣号

const teamsData2026 = ${JSON.stringify(teams,null,2)}

module.exports = {
  teamsData2026
}`;

  fs.writeFileSync('mini-program/data/teams2026.js', output, 'utf8');

  console.log(`\n2705 完成！${teams.length}支球队 | ${totalPlayers}名球员`);
  
  let withCN = 0, withoutCN = 0;
  teams.forEach(t => {
    t.players.forEach(p => {
      if (p.name !== p.nameEn) withCN++; else withoutCN++;
    });
  });
  console.log(`\ud83d\udcca 中文名覆盖: ${withCN}/${totalPlayers} (${(withCN/totalPlayers*100).toFixed(1)}%) | 未覆盖: ${withoutCN}`);
  console.log(`\ud83d\udcc1 输出文件:`);
  console.log(`   - mini-program/data/teams2026.js (球队+阵容数据)`);
  console.log(`   - mini-program/data/players2026.js (球员详细资料)`);
}

const posMap = {'Goalkeeper':'门将','Defence':'后卫','Midfield':'中场','Offence':'前锋','Forward':'前锋'};

// ====== 球队中文映射 ======
const teamMapping = {
  'Mexico':{'id':1,'name':'墨西哥','flag':'\ud83c\uddf2\ud83c\udda7','group':'A','nickname':'草帽军团','starPlayer':'洛萨诺'},
  'South Korea':{'id':2,'name':'韩国','flag':'\ud83c\uddf0\ud83c\uddf7','group':'A','nickname':'太极虎','starPlayer':'孙兴慜'},
  'South Africa':{'id':3,'name':'南非','flag':'\ud83c\uddff\ud83c\udde6','group':'A','nickname':'Bafana Bafana','starPlayer':'罗纳尔多'},
  'Czech Republic':{'id':4,'name':'捷克','flag':'\ud83c\udde8\ud83c\uddff','group':'A','nickname':'捷克雄狮','starPlayer':'希克'},

  'Switzerland':{'id':5,'name':'瑞士','flag':'\ud83c\udde8\ud83c\udded','group':'B','nickname':'十字军','starPlayer':'扎卡'},
  'Canada':{'id':6,'name':'加拿大','flag':'\ud83c\udde8\ud83c\udde6','group':'B','nickname':'枫叶军团','starPlayer':'戴维斯'},
  'Bosnia and Herzegovina':{'id':7,'name':'波黑','flag':'\ud83c\udde7\ud83c\uddea','group':'B','nickname':'金雕之师','starPlayer':'哲科'},
  'Qatar':{'id':8,'name':'卡塔尔','flag':'\ud83c\uddf6\ud83c\udde6','group':'B','nickname':'沙漠猎鹰','starPlayer':'阿菲夫'},

  'Brazil':{'id':9,'name':'巴西','flag':'\ud83c\udde7\ud83c\uddf7','group':'C','nickname':'桑巴军团','starPlayer':'维尼修斯'},
  'Sweden':{'id':10,'name':'瑞典','flag':'\ud83c\uddf8\ud83c\uddea','group':'C','nickname':'北欧海盗','starPlayer':'伊萨克'},
  'Morocco':{'id':11,'name':'摩洛哥','flag':'\ud83c\udf2c\ud83c\uddea','group':'C','nickname':'阿特拉斯雄狮','starPlayer':'齐耶赫'},
  'Colombia':{'id':12,'name':'哥伦比亚','flag':'\ud83c\udde8\ud83c\udf74','group':'C','nickname':'咖啡农','starPlayer':'迪亚斯'},
  'Haiti':{'id':13,'name':'海地','flag':'\ud83c\udded\ud83c\uddf9','group':'C','nickname':'加勒比之心','starPlayer':''},
  'Scotland':{'id':14,'name':'苏格兰','flag':'\ud83c\uddf3\ud83c\udfef','group':'C','nickname':'高地勇士','starPlayer':'罗伯逊'},

  'Paraguay':{'id':15,'name':'巴拉圭','flag':'\ud83c\uddf5\ud83c\udefe','group':'D','nickname':'瓜拉尼红蓝','starPlayer':'阿尔米隆'},
  'USA':{'id':16,'name':'美国','flag':'\ud83c\uddfa\ud83c\uddf8','group':'D','nickname':'山姆大叔','starPlayer':'普利西奇'},
  'Australia':{'id':17,'name':'澳大利亚','flag':'\ud83c\udde6\ud83c\uddfa','group':'D','nickname':'袋鼠军团','starPlayer':'莱基'},
  'Turkey':{'id':18,'name':'土耳其','flag':'\ud83c\uddf9\ud83c\udf7f','group':'D','nickname':'星月军团','starPlayer':'居勒尔'},

  'Germany':{'id':19,'name':'德国','flag':'\ud83c\udde9\ud83c\uddea','group':'E','nickname':'日耳曼战车','starPlayer':'穆西亚拉'},
  "Côte d'Ivoire":{'id':20,'name':'科特迪瓦','flag':'\ud83c\udde8\ud83c\uddee','group':'E','nickname':'非洲大象','starPlayer':'佩佩'},
  'Cape Verde':{'id':21,'name':'佛得角','flag':'\ud83c\udde5\ud83c\udf76','group':'E','nickname':'蓝鲨','starPlayer':''},
  'DR Congo':{'id':22,'name':'民主刚果','flag':'\ud83c\uddcc\ud83c\udfcd','group':'E',' nickname':'利奥波德之豹','starPlayer':'卡库塔'},
  'Curaçao':{'id':23,'name':'库拉索','flag':'\ud83c\udde8\ud83c\udfc7','group':'E','nickname':'蓝色火焰','starPlayer':'巴库纳'},

  'Japan':{'id':24,'name':'日本','flag':'\ud83c\uddef\ud83c\udf5','group':'F','nickname':'蓝色武士','starPlayer':'久保建英'},
  'England':{'id':25,'name':'英格兰','flag':'\ud83c\udcec\ud83c\udde7','group':'F','nickname':'三狮军团','starPlayer':'贝林厄姆'},
  'Senegal':{'id':26,'name':'塞内加尔','flag':'\ud83c\uddsn\ud83c\uddf7','group':'F','nickname':'特兰加雄狮','starPlayer':'马内'},

  'Uruguay':{'id':27,'name':'乌拉圭','flag':'\ud83c\uddfa\ud83c\udfe3','group':'G',' nickname':'天蓝军团','starPlayer':'努涅斯'},
  'Portugal':{'id':28,'name':'葡萄牙','flag':'\ud83c\udf5\ud83c\udf9d','group':'G','nickname':'五盾军团','starPlayer':'C罗'},
  'Egypt':{'id':29,'name':'埃及','flag':'\ud83c\uddea\ud83c\uddec','group':'G','nickname':'法老军团','starPlayer':'萨拉赫'},

  'Argentina':{'id':30,'name':'阿根廷','flag':'\ud83c\udde6\ud83c\udf97','group':'H','nickname':'潘帕斯雄鹰','starPlayer':'梅西'},
  'Iran':{'id':31,'name':'伊朗','flag':'\ud83c\udde7\ud83c\udf6f','group':'H','nickname':'波斯铁骑','starPlayer':'阿兹蒙'},
  'Panama':{'id':32,'name':'巴拿马','flag':'\ud83c\uddf5\ud83c\udf7c','group':'H','nickname':'运河巨人','starPlayer':'戈多伊'},
  'Netherlands':{'id':33,'name':'荷兰','flag':'\ud83c\uddf3\ud83c\udf1f','group':'H','nickname':'橙色风暴','starPlayer':'范戴克'},

  'France':{'id':34,'name':'法国','flag':'\ud83c\uddeb\ud83c\uddf7','group':'I','nickname':'高卢雄鸡','starPlayer':'姆巴佩'},
  'Croatia':{'id':35,'name':'克罗地亚','flag':'\ud83c\udded\ud83c\udf7f','group':'I','nickname':'格子军团','starPlayer':'莫德里奇'},
  'Saudi Arabia':{'id':36,'name':'沙特阿拉伯','flag':'\ud83c\udde6\ud83c\uddea','group':'I','nickname':'绿鹰','starPlayer':'达瓦萨里'},

  'Spain':{'id':37,'name':'西班牙','flag':'\ud83c\uddea\ud83c\udf8','group':'J','nickname':'斗牛士','starPlayer':'亚马尔'},
  'Ghana':{'id':38,'name':'加纳','flag':'\ud83c\uddec\ud83c\udfed','group':'J','nickname':'黑色之星','starPlayer':'库杜斯'},
  'New Zealand':{'id':39,'name':'新西兰','flag':'\ud83c\uddf3\ud83c\uddff','group':'J','nickname':'全白队','starPlayer':'伍德'},

  'Algeria':{'id':40,'name':'阿尔及利亚','flag':'\ud83c\udde9\ud83c\uddff','group':'K','nickname':'沙漠之狐','starPlayer':'本纳塞尔'},
  'Tunisia':{'id':41,'name':'突尼斯','flag':'\ud83c\udf93\ud83c\udf7f','group':'K','nickname':'迦太基雄鹰','starPlayer':'哈兹里'},
  'Jordan':{'id':42,'name':'约旦','flag':'\ud83c\uddef\ud83c\udfef','group':'K','nickname':'纳什曼雄鹰','starPlayer':'塔马里'},
  'Iraq':{'id':43,'name':'伊拉克','flag':'\ud83c\udded\ud83c\uddfa','group':'K','nickname':'美索不达米亚雄狮','starPlayer':''},
  'Uzbekistan':{'id':44,'name':'乌兹别克斯坦','flag':'\ud83c\uddfa\ud83c\udffc','group':'K','nickname':'中亚狼','starPlayer':'肖穆罗多夫'},

  'Belgium':{'id':45,'name':'比利时','flag':'\ud83c\udde7\ud83c\uddea','group':'L','nickname':'欧洲红魔','starPlayer':'德布劳内'},
  'Austria':{'id':46,'name':'奥地利','flag':'\ud83c\udde6\ud83c\udf9d','group':'L','nickname':'奥地利乐队','starPlayer':'萨比策'},
  'Norway':{'id':47,'name':'挪威','flag':'\ud83c\uddf3\ud83c\uddf4','group':'L','nickname':'维京战舰','starPlayer':'哈兰德'}
};

// 球队恩怨录
const rivalryData = {};

main();

// 测试 persons API 返回格式
const https = require('https');

function fetchPlayer(playerId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.football-data.org',
      path: `/v4/persons/${playerId}`,
      headers: { 'X-Auth-Token': 'b997520e767f49c289a6f5b26b6e732c' }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  // 测试几个知名球员
  const testIds = [3160, 96, 8022, 3451, 3964, 167495, 202387]; // Muslera, Valverde, Messi, CR7, Mbappe, Yamal, Haaland
  for (const id of testIds) {
    try {
      const p = await fetchPlayer(id);
      console.log(`\n--- ${p.name} (id:${p.id}) ---`);
      console.log(JSON.stringify(p, null, 2));
    } catch(e) { console.log(`Error ${id}:`, e.message); }
  }
}
main();

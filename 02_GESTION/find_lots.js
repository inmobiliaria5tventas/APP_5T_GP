const fs = require('fs');

const files = ['brisas_master.js', 'copihue_master.js', 'encinos_master.js', 'naranjos_master.js'];
for (const f of files) {
  try {
    const content = fs.readFileSync('03_CORAZON/layers/' + f, 'utf8');
    const match = content.match(/var \w+ = (\{.*\});/s);
    if (!match) continue;
    const geo = JSON.parse(match[1]);
    const l26 = geo.features.find(x => x.properties && x.properties.Lote == '26');
    const l27 = geo.features.find(x => x.properties && x.properties.Lote == '27');
    const l47 = geo.features.find(x => x.properties && x.properties.Lote == '47');
    
    console.log(`--- ${f} ---`);
    if (l26) console.log('L26:', JSON.stringify(l26.geometry.coordinates[0][0]));
    if (l27) console.log('L27:', JSON.stringify(l27.geometry.coordinates[0][0]));
    if (l47) console.log('L47:', JSON.stringify(l47.geometry.coordinates[0][0]));
  } catch (e) {
    console.error(`Error in ${f}: ${e.message}`);
  }
}

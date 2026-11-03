const fs = require('fs');
const data = JSON.parse(fs.readFileSync('02_GESTION/scratch/sheets_data.json', 'utf8'));

for (const [table, rows] of Object.entries(data)) {
  console.log(`Table: ${table}`);
  if (rows && rows.length > 0) {
    console.log(`  Columns: ${Object.keys(rows[0]).join(', ')}`);
  } else {
    console.log('  Empty table');
  }
}

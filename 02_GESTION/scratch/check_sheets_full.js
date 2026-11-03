const URL = 'https://script.google.com/macros/s/AKfycbzUpfUtaSaN3TZr_bbsa8W1mee9-kY7S6VZPDoP9xmZ3DS2PyczU5KZlHPGCuB00wIbvw/exec';

async function main() {
  try {
    const resp = await fetch(`${URL}?action=readall`);
    const data = await resp.json();
    
    const sheetsToDump = ['Vendedores', 'Clientes', 'Directorio', '00_Usuarios'];
    for (const sheet of sheetsToDump) {
      console.log(`\n=== SHEET: ${sheet} ===`);
      const records = data[sheet];
      if (records) {
        console.log(JSON.stringify(records, null, 2));
      } else {
        console.log('(No data found or sheet not public)');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();

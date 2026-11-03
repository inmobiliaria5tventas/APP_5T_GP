const URL = 'https://script.google.com/macros/s/AKfycbzUpfUtaSaN3TZr_bbsa8W1mee9-kY7S6VZPDoP9xmZ3DS2PyczU5KZlHPGCuB00wIbvw/exec';

async function main() {
  try {
    console.log('Fetching all sheets data from Apps Script URL...');
    const resp = await fetch(`${URL}?action=readall`);
    const data = await resp.json();
    console.log('Sheets keys:', Object.keys(data));
    
    // Log record count for each sheet
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        console.log(`- Sheet "${key}": ${val.length} records`);
        if (val.length > 0) {
          console.log('  First record:', JSON.stringify(val[0]));
        }
      } else {
        console.log(`- Sheet "${key}":`, typeof val, val);
      }
    }
  } catch (err) {
    console.error('Error fetching sheets data:', err);
  }
}

main();

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://lsbnvsjosasbtarfqkse.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYm52c2pvc2FzYnRhcmZxa3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDYwMDEsImV4cCI6MjEwMjcyMjAwMX0.hE7F-9S3D4FXSF8vDK7Y5VLp2x-XCGnhel7jeHr8_Gg';

async function run() {
  const fetch = (await import('node-fetch')).default;
  const resp = await fetch(`${SUPABASE_URL}propiedades?select=id,nombre,superficie`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!resp.ok) {
    console.error('Error fetching:', await resp.text());
    return;
  }

  const data = await resp.json();
  let md = `# Reporte de Análisis: Corrección de Superficies en Supabase\n\n`;
  md += `Este es un reporte de **solo lectura** (Dry-Run). No se ha modificado ningún dato en tu base de datos.\n\n`;
  md += `Se encontraron ${data.length} propiedades. A continuación se listan las que necesitan corrección (superficies guardadas sin el punto decimal, por ejemplo, > 10000).\n\n`;
  md += `| ID Lote | Superficie Actual | Nueva Superficie (corregida) |\n`;
  md += `|---|---|---|\n`;

  let count = 0;
  for (const p of data) {
    if (p.superficie && p.superficie > 10000) {
      const fixed = p.superficie / 10;
      md += `| ${p.nombre || p.id} | ${p.superficie} | **${fixed}** |\n`;
      count++;
    }
  }

  if (count === 0) {
    md += `| N/A | N/A | No hay propiedades que necesiten corrección. |\n`;
  }

  md += `\n**Total de registros a actualizar:** ${count}\n\n`;
  md += `> [!TIP]\n> Revisa esta tabla. Si los números en la columna "Nueva Superficie" son los correctos (ej: 5200.2 en lugar de 52002), por favor confírmalo y ejecutaré el script real para actualizar Supabase de forma segura.\n`;

  // Provide absolute path so artifact is placed correctly if run from APP_5T folder
  // Wait, I can just write to the standard artifact directory. The agent receives `<appDataDir>\brain\<conversation-id>` in instructions.
  // I will write it to `dry_run.md` in the current working directory, then use file output to read it, or I can just use `write_to_file` to create the artifact myself?
  // I'll output it locally and read it.
  fs.writeFileSync('dry_run_superficie.md', md);
  console.log('Report generated at dry_run_superficie.md');
}

run();

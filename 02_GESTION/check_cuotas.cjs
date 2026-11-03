const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: 'C:/Users/usuario/Documents/RODRIGO/GEOCONECTA/5TIERRAS/APP_5T/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Faltan credenciales');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('cuenta_corriente')
    .select('id, id_propiedad, fecha_vencimiento, estado_cuota')
    .order('id', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
check();

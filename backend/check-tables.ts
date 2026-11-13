import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Verificando tablas en Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

const expectedTables = [
  'profiles',
  'exercises',
  'submissions',
  'progress',
  'courses'
];

console.log('📋 Tablas esperadas:');
expectedTables.forEach(table => console.log(`   - ${table}`));

console.log('\n🔎 Verificando existencia de tablas...\n');

for (const tableName of expectedTables) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${tableName}: No existe (${error.message})`);
    } else {
      console.log(`✅ ${tableName}: Existe`);
    }
  } catch (e) {
    console.log(`❌ ${tableName}: Error al verificar`);
  }
}

console.log('\n📊 Prueba completada');

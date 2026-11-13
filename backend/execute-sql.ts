import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde el directorio raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;

console.log('⚠️  Nota Importante');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('Supabase no permite ejecutar SQL arbitrario directamente desde la API');
console.log('por razones de seguridad. Para configurar la base de datos, debes ejecutar');
console.log('el script SQL manualmente en el SQL Editor de Supabase.\n');
console.log('📋 Pasos para configurar la base de datos:\n');
console.log('1. Abre tu navegador y ve a:');
console.log(`   ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').split('.')[0]}`);
console.log('   o directamente a: https://app.supabase.com/project/rjehqahxntirxdzfaefg\n');
console.log('2. En el menú lateral, haz clic en "SQL Editor"\n');
console.log('3. Haz clic en "New Query"\n');
console.log('4. Copia el contenido del archivo:');
console.log(`   ${path.join(__dirname, '../database/setup.sql')}\n`);
console.log('5. Pégalo en el editor\n');
console.log('6. Haz clic en "Run" para ejecutar el script\n');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('📝 El script SQL creará:');
console.log('   ✅ 5 tablas (profiles, exercises, submissions, progress, courses)');
console.log('   ✅ Row Level Security (RLS) policies');
console.log('   ✅ Triggers para crear perfiles automáticamente');
console.log('   ✅ Índices para mejorar rendimiento');
console.log('   ✅ Datos de ejemplo (4 ejercicios de cálculo)\n');
console.log('🔍 Después de ejecutar el script, puedes verificar las tablas ejecutando:');
console.log('   cd backend');
console.log('   npx tsx check-tables.ts\n');

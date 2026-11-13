import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidos en .env');
  process.exit(1);
}

console.log('🔧 Configuración de Base de Datos - Supabase');
console.log('==========================================\n');
console.log(`📍 URL: ${supabaseUrl}\n`);

// Leer el script SQL
const sqlPath = path.join(__dirname, '../database/setup.sql');
const sqlScript = readFileSync(sqlPath, 'utf-8');

console.log('📁 Leyendo script SQL:', sqlPath);
console.log('📄 Longitud del script:', sqlScript.length, 'caracteres\n');

console.log('⚠️ Supabase no tiene un endpoint API directo para ejecutar scripts SQL complejos.\n');
console.log('🔗 Debes ejecutar el script manualmente en el dashboard de Supabase:\n');
console.log('   1. Ve a https://app.supabase.com');
console.log('   2. Selecciona tu proyecto: rjehqahxntirxdzfaefg');
console.log('   3. En el menú lateral, ve a "SQL Editor"');
console.log('   4. Crea un "New Query"');
console.log('   5. Copia y pega el contenido del archivo:');
console.log('      ' + sqlPath);
console.log('   6. Haz clic en "Run" para ejecutar el script\n');

console.log('📋 El script creará las siguientes tablas:');
console.log('   - profiles (perfiles de usuario)');
console.log('   - exercises (ejercicios de cálculo)');
console.log('   - submissions (envíos de estudiantes)');
console.log('   - progress (progreso de aprendizaje)');
console.log('   - courses (cursos)\n');

console.log('🔐 También configurará:');
console.log('   - Row Level Security (RLS) policies');
console.log('   - Triggers para crear perfiles automáticamente');
console.log('   - Índices para mejorar rendimiento');
console.log('   - Datos de ejemplo (4 ejercicios)\n');

console.log('✅ Después de ejecutar el script, ejecuta:');
console.log('   npx tsx check-tables.ts');
console.log('   ...para verificar que las tablas se crearon correctamente\n');

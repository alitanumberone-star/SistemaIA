import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

console.log('🔧 Testing Supabase Authentication\n');

const testEmail = 'alejandra_gaspar@utcj.edu.mx';
const testPassword = 'Password123!';

async function testAuth() {
  try {
    // Primero, intentar confirmar el email del usuario existente
    console.log('📝 Intentando confirmar email del usuario existente:', testEmail);

    // Listar usuarios para encontrar el ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error al listar usuarios:', listError.message);
    } else {
      const user = users.find(u => u.email === testEmail);

      if (user) {
        console.log('👤 Usuario encontrado:', user.id);
        console.log('   Email confirmado:', user.email_confirmed_at ? 'Sí' : 'No');

        // Confirmar el email usando admin API
        if (!user.email_confirmed_at) {
          console.log('🔄 Confirmando email...');
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );

          if (confirmError) {
            console.error('❌ Error al confirmar email:', confirmError.message);
          } else {
            console.log('✅ Email confirmado exitosamente!');
          }
        }
      } else {
        console.log('⚠️ Usuario no encontrado, intentando registrar...');
      }
    }

    // Intentar login
    console.log('\n🔐 Intentando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError.message);
      console.log('\n💡 El usuario existe pero no puede hacer login.');
      console.log('   Esto puede ser porque:');
      console.log('   1. La contraseña es incorrecta');
      console.log('   2. El email no está confirmado');
      console.log('   3. La cuenta está deshabilitada');
    } else {
      console.log('✅ Login exitoso!');
      console.log('   Usuario ID:', loginData.user?.id);
      console.log('   Email:', loginData.user?.email);
      console.log('   Email confirmado:', loginData.user?.email_confirmed_at ? 'Sí' : 'No');
      console.log('\n🎉 Ahora puedes hacer login en la aplicación con estas credenciales:');
      console.log('   Email:', testEmail);
      console.log('   Password:', testPassword);
    }
  } catch (err: any) {
    console.error('❌ Error inesperado:', err.message);
  }
}

testAuth();

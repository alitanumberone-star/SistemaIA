<script lang="ts">
  import { supabase } from '../lib/supabase';
  import { onMount } from 'svelte';

  export let navigate: (path: string) => void;

  let email = '';
  let password = '';
  let fullName = '';
  let isRegister = false;
  let loading = false;
  let error = '';
  let user: any = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user || null;

    if (user) {
      navigate('/dashboard');
    }

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        user = session?.user || null;
        if (user) {
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  });

  async function handleGoogleAuth() {
    loading = true;
    error = '';

    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (authError) throw authError;
    } catch (err: any) {
      error = err.message || 'Error al autenticar con Google';
      loading = false;
    }
  }

  async function handleEmailAuth() {
    loading = true;
    error = '';

    try {
      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (authError) throw authError;

        if (data.user && !data.session) {
          error = 'Registro exitoso. Por favor verifica tu correo electrónico.';
        } else if (data.session) {
          navigate('/dashboard');
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        if (data.session) {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      error = err.message || 'Error en la autenticación';
    } finally {
      loading = false;
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    user = null;
  }
</script>

<div class="auth-container">
  {#if user}
    <div class="logged-in">
      <h2>Bienvenido, {user.email}</h2>
      <p>Has iniciado sesión correctamente.</p>
      <button on:click={handleLogout} class="btn btn-secondary">
        Cerrar Sesión
      </button>
    </div>
  {:else}
    <div class="auth-card">
      <h1>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h1>
      <p class="subtitle">Plataforma Educativa de Transformada de Laplace</p>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <button
        on:click={handleGoogleAuth}
        disabled={loading}
        class="btn btn-google"
      >
        {#if loading}
          <span class="spinner"></span>
        {:else}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        {/if}
        Continuar con Google
      </button>

      <div class="divider">
        <span>o</span>
      </div>

      <form on:submit|preventDefault={handleEmailAuth}>
        {#if isRegister}
          <div class="form-group">
            <label for="fullName">Nombre Completo</label>
            <input
              type="text"
              id="fullName"
              bind:value={fullName}
              placeholder="Tu nombre completo"
              required
            />
          </div>
        {/if}

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            bind:value={password}
            placeholder="••••••••"
            required
            minlength="6"
          />
        </div>

        <button type="submit" disabled={loading} class="btn btn-primary">
          {#if loading}
            <span class="spinner"></span>
          {:else}
            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          {/if}
        </button>
      </form>

      <p class="toggle-auth">
        {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        <button on:click={() => { isRegister = !isRegister; error = ''; }}>
          {isRegister ? 'Inicia Sesión' : 'Regístrate'}
        </button>
      </p>
    </div>
  {/if}
</div>

<style>
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .auth-card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 420px;
  }

  .logged-in {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #1a1a1a;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #1a1a1a;
  }

  .subtitle {
    color: #666;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    border: 1px solid #fcc;
  }

  .btn {
    width: 100%;
    padding: 0.875rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-google {
    background: white;
    color: #1a1a1a;
    border: 2px solid #e0e0e0;
  }

  .btn-google:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .btn-secondary {
    background: #f0f0f0;
    color: #1a1a1a;
    max-width: 200px;
    margin: 1rem auto;
  }

  .btn-secondary:hover {
    background: #e0e0e0;
  }

  .divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    color: #999;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e0e0e0;
  }

  .divider span {
    padding: 0 1rem;
    font-size: 0.875rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
  }

  .toggle-auth {
    text-align: center;
    margin-top: 1.5rem;
    color: #666;
    font-size: 0.9rem;
  }

  .toggle-auth button {
    background: none;
    border: none;
    color: #667eea;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-left: 0.25rem;
  }

  .toggle-auth button:hover {
    text-decoration: underline;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

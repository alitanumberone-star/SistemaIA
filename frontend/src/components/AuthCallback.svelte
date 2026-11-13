<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../lib/supabase';

  export let navigate: (path: string) => void;

  onMount(async () => {
    try {
      // Obtener la sesión desde el URL callback
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error en autenticación:', error);
        navigate('/login');
      } else if (data.session) {
        navigate('/dashboard');
      } else {
        // Intentar obtener la sesión del hash de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || ''
          });

          if (sessionError) {
            console.error('Error al establecer sesión:', sessionError);
            navigate('/login');
          } else if (sessionData.session) {
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      console.error('Error en callback:', err);
      navigate('/login');
    }
  });
</script>

<div class="loading-container">
  <div class="spinner"></div>
  <p>Autenticando...</p>
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  p {
    font-size: 1.2rem;
    font-weight: 500;
  }
</style>

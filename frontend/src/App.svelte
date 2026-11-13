<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from './lib/supabase';
  import Login from './components/Login.svelte';
  import AuthCallback from './components/AuthCallback.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import LeafletMap from './components/LeafletMap.svelte';
  import Exercises from './components/Exercises.svelte';
  import Speedometer from './components/Speedometer.svelte';
  import LaplaceCalculator from './components/LaplaceCalculator.svelte';

  let user: any = null;
  let currentPath = window.location.pathname;
  let userLocation: [number, number] | null = null;
  let locationError: string | null = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user || null;

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        user = session?.user || null;
      }
    );

    // Escuchar cambios de URL
    const handlePopState = () => {
      currentPath = window.location.pathname;
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  });

  async function getUserLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada por el navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          let errorMessage = 'No se pudo obtener la ubicación';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Has denegado el acceso a tu ubicación. Para usar el mapa, necesitas permitir el acceso.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'La información de ubicación no está disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'La solicitud de ubicación ha excedido el tiempo de espera.';
              break;
            default:
              errorMessage = 'Error desconocido al obtener la ubicación.';
          }
          reject(new Error(errorMessage));
        }
      );
    });
  }

  async function requestLocation() {
    try {
      locationError = null;
      userLocation = await getUserLocation();
    } catch (error: any) {
      locationError = error.message || 'No se pudo obtener la ubicación';
      userLocation = null;
    }
  }

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    currentPath = path;
  }
</script>

{#if currentPath === '/login' || currentPath === '/'}
  <Login {navigate} />
{:else if currentPath === '/auth/callback'}
  <AuthCallback {navigate} />
{:else if currentPath === '/dashboard'}
  <Dashboard {navigate} />
{:else if currentPath === '/exercises'}
  <Exercises {navigate} />
{:else if currentPath === '/speedometer'}
  <Speedometer {navigate} />
{:else if currentPath === '/laplace'}
  <LaplaceCalculator {navigate} />
{:else if currentPath === '/map'}
  <div class="map-page">
    <h1>Mapa Interactivo</h1>
    {#if !userLocation}
      <div class="location-prompt">
        <p>Para mostrar el mapa en tu ubicación actual, necesitamos acceder a tu geolocalización.</p>
        <button on:click={requestLocation} class="btn-location">
          📍 Permitir acceso a mi ubicación
        </button>
        {#if locationError}
          <p class="error">{locationError}</p>
          <div class="location-instructions">
            <h3>¿Cómo habilitar la geolocalización?</h3>
            <p><strong>En Google Chrome:</strong></p>
            <ol>
              <li>Haz clic en el icono de candado o ubicación en la barra de direcciones (esquina izquierda)</li>
              <li>Busca la opción "Ubicación" o "Location"</li>
              <li>Cámbiala de "Bloquear" a "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
            <p><strong>En Firefox:</strong></p>
            <ol>
              <li>Haz clic en el icono de información en la barra de direcciones</li>
              <li>Selecciona "Permisos" > "Ubicación"</li>
              <li>Cámbialo a "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
            <p><strong>En Edge:</strong></p>
            <ol>
              <li>Haz clic en el icono de candado en la barra de direcciones</li>
              <li>Busca "Ubicación" en los permisos</li>
              <li>Cámbialo a "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        {/if}
      </div>
    {:else}
      <LeafletMap center={userLocation} zoom={13} markers={[
        { lat: userLocation[0], lng: userLocation[1], popup: 'Tu ubicación' }
      ]} />
      <button on:click={requestLocation} class="btn-refresh">
        🔄 Actualizar ubicación
      </button>
    {/if}
    <button on:click={() => navigate('/dashboard')}>Volver al Dashboard</button>
  </div>
{:else}
  <Login {navigate} />
{/if}

<style>
  .map-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .map-page h1 {
    margin-bottom: 1.5rem;
    color: #333;
  }

  .location-prompt {
    padding: 2rem;
    background-color: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .location-prompt p {
    margin-bottom: 1rem;
    color: #666;
  }

  .btn-location {
    padding: 0.75rem 1.5rem;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin: 0.5rem;
  }

  .btn-location:hover {
    background-color: #357abd;
  }

  .btn-refresh {
    padding: 0.5rem 1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin: 0.5rem;
  }

  .btn-refresh:hover {
    background-color: #218838;
  }

  .error {
    color: #dc3545;
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .location-instructions {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: left;
  }

  .location-instructions h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.1rem;
  }

  .location-instructions p {
    margin: 0.75rem 0;
    color: #555;
  }

  .location-instructions ol {
    margin: 0.5rem 0 1.5rem 1.5rem;
    color: #666;
  }

  .location-instructions li {
    margin: 0.5rem 0;
  }

  .map-page button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .map-page button:hover {
    background-color: #357abd;
  }
</style>

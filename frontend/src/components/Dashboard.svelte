<script lang="ts">
  import { supabase } from '../lib/supabase';
  import { onMount } from 'svelte';

  export let navigate: (path: string) => void;

  let user: any = null;
  let profile: any = null;
  let loading = true;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user || null;

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      profile = profileData;
    }

    loading = false;
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }
</script>

<div class="dashboard-container">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>
  {:else if user}
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>EDU-Laplace</h1>
        <div class="user-info">
          <span class="user-email">{user.email}</span>
          <button on:click={handleLogout} class="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="welcome-card">
          <h2>Bienvenido al Sistema Educativo</h2>
          <p>Has iniciado sesión correctamente con autenticación de Supabase.</p>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3>Información del Usuario</h3>
            <ul>
              <li><strong>Email:</strong> {user.email}</li>
              <li><strong>ID:</strong> {user.id.slice(0, 8)}...</li>
              <li><strong>Rol:</strong> {profile?.role || 'student'}</li>
              <li><strong>Creado:</strong> {new Date(user.created_at).toLocaleDateString('es-ES')}</li>
            </ul>
          </div>

          <div class="info-card">
            <h3>Estado de la Base de Datos</h3>
            <ul>
              <li>✅ Autenticación: Activa</li>
              <li>✅ Conexión Supabase: Establecida</li>
              <li>✅ Perfil de usuario: {profile ? 'Creado' : 'Pendiente'}</li>
            </ul>
          </div>
        </div>

        <div class="actions">
          <h3>Próximos Pasos</h3>
          <p>El sistema está listo para implementar:</p>
          <ul>
            <li>Calculadora de Transformada de Laplace</li>
            <li>Ejercicios interactivos</li>
            <li>Sistema de progreso y logros</li>
            <li>Dashboard estudiantil completo</li>
          </ul>
          <div class="action-buttons">
            <button on:click={() => navigate('/exercises')} class="btn-exercises">
              📝 Ejercicios Interactivos
            </button>
            <button on:click={() => navigate('/map')} class="btn-map">
              🗺️ Ver Mapa Interactivo
            </button>
            <button on:click={() => navigate('/speedometer')} class="btn-speed">
              🏎️ Velocímetro GPS
            </button>
            <button on:click={() => navigate('/laplace')} class="btn-laplace">
              ∫ Calculadora de Laplace
            </button>
          </div>
        </div>
      </main>
    </div>
  {:else}
    <div class="not-logged-in">
      <h2>No has iniciado sesión</h2>
      <p>Por favor, inicia sesión para acceder al dashboard.</p>
      <button on:click={() => navigate('/login')} class="btn">Ir a Login</button>
    </div>
  {/if}
</div>

<style>
  .dashboard-container {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(102, 126, 234, 0.3);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .dashboard {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .dashboard-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .dashboard-header h1 {
    margin: 0;
    font-size: 1.75rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-email {
    font-weight: 500;
  }

  .btn-logout {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-logout:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .dashboard-content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .welcome-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .welcome-card h2 {
    margin-top: 0;
    color: #1a1a1a;
  }

  .welcome-card p {
    color: #666;
    margin: 0;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .info-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .info-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #1a1a1a;
  }

  .info-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .info-card li {
    padding: 0.5rem 0;
    color: #666;
    border-bottom: 1px solid #f0f0f0;
  }

  .info-card li:last-child {
    border-bottom: none;
  }

  .info-card strong {
    color: #333;
  }

  .actions {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .actions h3 {
    margin-top: 0;
    color: #1a1a1a;
  }

  .actions p {
    color: #666;
    margin-bottom: 1rem;
  }

  .actions ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .actions li {
    padding: 0.5rem 0;
    color: #666;
    padding-left: 1.5rem;
    position: relative;
  }

  .actions li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
  }

  .not-logged-in {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    padding: 2rem;
  }

  .not-logged-in h2 {
    margin-bottom: 1rem;
  }

  .not-logged-in p {
    margin-bottom: 2rem;
    opacity: 0.9;
  }

  .btn {
    background: white;
    color: #667eea;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .btn-exercises {
    background: #48bb78;
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn-exercises:hover {
    background: #38a169;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn-map {
    background: #667eea;
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn-map:hover {
    background: #764ba2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn-speed {
    background: #ecc94b;
    color: #1a1a1a;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn-speed:hover {
    background: #e0b82e;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn-laplace {
    background: #764ba2;
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn-laplace:hover {
    background: #653e8c;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
</style>

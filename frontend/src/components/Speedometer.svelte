<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let navigate: (path: string) => void;

  type Unit = 'kmh' | 'mph';
  type Status = 'idle' | 'starting' | 'active' | 'error';

  const UNITS = {
    kmh: { label: 'km/h', factor: 3.6, max: 240, dist: 'km', distFactor: 1000 },
    mph: { label: 'mph', factor: 2.236936, max: 150, dist: 'mi', distFactor: 1609.344 }
  } as const;

  let status: Status = 'idle';
  let errorMessage = '';
  let unit: Unit = 'kmh';

  let speedMs = 0;
  let maxMs = 0;
  let distanceM = 0;
  let accuracy: number | null = null;
  let movingSumMs = 0;
  let movingSamples = 0;

  let watchId: number | null = null;
  let startedAt: number | null = null;
  let elapsedMs = 0;
  let ticker: ReturnType<typeof setInterval> | null = null;

  let last: { lat: number; lng: number } | null = null;

  const cfg = UNITS[unit];

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function onPosition(pos: GeolocationPosition) {
    const raw = pos.coords.speed;
    const speed = raw == null || raw < 0 ? 0 : raw;
    // Filtra ruido del GPS cuando el dispositivo está quieto (< 1 km/h).
    const filtered = speed < 0.28 ? 0 : speed;

    if (startedAt === null) {
      startedAt = Date.now();
      ticker = setInterval(() => {
        if (startedAt !== null) elapsedMs = Date.now() - startedAt;
      }, 250);
    }

    if (last && filtered > 0 && pos.coords.accuracy <= 30) {
      distanceM += haversine(last.lat, last.lng, pos.coords.latitude, pos.coords.longitude);
    }
    if (filtered > 0) {
      movingSumMs += filtered;
      movingSamples++;
    }

    status = 'active';
    speedMs = filtered;
    accuracy = pos.coords.accuracy;
    maxMs = Math.max(maxMs, filtered);
    last = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  function onError(err: GeolocationPositionError) {
    status = 'error';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage =
          'Has denegado el acceso a tu ubicación. Habilítalo en los permisos del navegador para medir la velocidad.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'La información de ubicación no está disponible.';
        break;
      case err.TIMEOUT:
        errorMessage = 'La solicitud de ubicación excedió el tiempo de espera.';
        break;
      default:
        errorMessage = 'Error desconocido al obtener la ubicación.';
    }
  }

  function start() {
    if (!navigator.geolocation) {
      status = 'error';
      errorMessage = 'Geolocalización no soportada por el navegador.';
      return;
    }
    stopTracking();
    status = 'starting';
    errorMessage = '';
    startedAt = Date.now();
    last = null;
    watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  }

  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (ticker !== null) {
      clearInterval(ticker);
      ticker = null;
    }
  }

  function reset() {
    speedMs = 0;
    maxMs = 0;
    distanceM = 0;
    accuracy = null;
    movingSumMs = 0;
    movingSamples = 0;
    last = null;
    startedAt = status === 'active' ? Date.now() : null;
    elapsedMs = 0;
  }

  onMount(() => start());
  onDestroy(stopTracking);

  function fmtDuration(ms: number): string {
    const total = Math.floor(ms / 1000);
    const two = (n: number) => n.toString().padStart(2, '0');
    return `${two(Math.floor(total / 3600))}:${two(Math.floor((total % 3600) / 60))}:${two(total % 60)}`;
  }

  $: speed = speedMs * UNITS[unit].factor;
  $: max = maxMs * UNITS[unit].factor;
  $: avg = movingSamples === 0 ? 0 : (movingSumMs / movingSamples) * UNITS[unit].factor;
  $: distance = distanceM / UNITS[unit].distFactor;

  // Arco de 270° desde 135° (en sentido de las manecillas).
  const START = 135;
  const SWEEP = 270;
  $: fraction = Math.min(Math.max(speed / UNITS[unit].max, 0), 1);
  $: arcLen = (SWEEP / 360) * 2 * Math.PI * R;
  $: dash = fraction * arcLen;
  const R = 130;
</script>

<div class="speed-container">
  <header class="speed-header">
    <h1>Velocímetro GPS</h1>
    <button on:click={() => navigate('/dashboard')} class="btn-back">← Volver al Dashboard</button>
  </header>

  <main class="speed-content">
    <div class="status-banner {status}" role="status">
      {#if status === 'active'}
        <span class="dot active"></span> GPS activo{accuracy != null ? ` — precisión ${accuracy.toFixed(0)} m` : ''}
      {:else if status === 'starting'}
        <span class="dot starting"></span> Buscando señal GPS...
      {:else if status === 'error'}
        <span class="dot error"></span> {errorMessage}
        <button class="btn-retry" on:click={start}>Reintentar</button>
      {:else}
        <span class="dot"></span> Detenido
      {/if}
    </div>

    <div class="gauge-wrap">
      <svg viewBox="0 0 320 320" class="gauge" role="img" aria-label={`Velocidad ${speed.toFixed(0)} ${UNITS[unit].label}`}>
        <defs>
          <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#48bb78" />
            <stop offset="60%" stop-color="#ecc94b" />
            <stop offset="100%" stop-color="#e53e3e" />
          </linearGradient>
        </defs>
        <circle
          cx="160" cy="160" r={R}
          fill="none" stroke="#e8e8ee" stroke-width="20" stroke-linecap="round"
          stroke-dasharray="{arcLen} {2 * Math.PI * R}"
          transform="rotate(135 160 160)"
        />
        <circle
          cx="160" cy="160" r={R}
          fill="none" stroke="url(#speedGrad)" stroke-width="20" stroke-linecap="round"
          stroke-dasharray="{dash} {2 * Math.PI * R}"
          transform="rotate(135 160 160)"
        />
      </svg>
      <div class="gauge-center">
        <div class="speed-value">{speed.toFixed(0)}</div>
        <div class="speed-unit">{UNITS[unit].label}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat-value">{max.toFixed(0)}</span>
        <span class="stat-label">MAX</span>
      </div>
      <div class="stat">
        <span class="stat-value">{avg.toFixed(0)}</span>
        <span class="stat-label">PROMEDIO</span>
      </div>
      <div class="stat">
        <span class="stat-value">{distance.toFixed(2)}</span>
        <span class="stat-label">DISTANCIA ({UNITS[unit].dist})</span>
      </div>
      <div class="stat">
        <span class="stat-value">{fmtDuration(elapsedMs)}</span>
        <span class="stat-label">TIEMPO</span>
      </div>
    </div>

    <div class="controls">
      <div class="unit-toggle">
        <button class:active={unit === 'kmh'} on:click={() => (unit = 'kmh')}>{UNITS.kmh.label}</button>
        <button class:active={unit === 'mph'} on:click={() => (unit = 'mph')}>{UNITS.mph.label}</button>
      </div>
      <button class="btn-reset" on:click={reset}>🔄 Reiniciar</button>
    </div>
  </main>
</div>

<style>
  .speed-container {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .speed-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .speed-header h1 {
    margin: 0;
    font-size: 1.75rem;
  }

  .btn-back {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .speed-content {
    max-width: 560px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
  }

  .status-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    font-size: 0.9rem;
    color: #444;
    margin-bottom: 1.5rem;
  }

  .status-banner.error {
    background: #fff5f5;
    color: #c53030;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #a0aec0;
  }

  .dot.active {
    background: #48bb78;
  }

  .dot.starting {
    background: #ecc94b;
  }

  .dot.error {
    background: #e53e3e;
  }

  .btn-retry {
    margin-left: auto;
    background: #e53e3e;
    color: white;
    border: none;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .gauge-wrap {
    position: relative;
    width: 100%;
    max-width: 340px;
    margin: 0 auto 1.5rem;
    aspect-ratio: 1;
  }

  .gauge {
    width: 100%;
    height: 100%;
  }

  .gauge-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .speed-value {
    font-size: 4.5rem;
    font-weight: 700;
    line-height: 1;
    color: #1a1a1a;
  }

  .speed-unit {
    font-size: 1.1rem;
    color: #888;
    margin-top: 0.25rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }

  .stat {
    background: white;
    border-radius: 12px;
    padding: 0.75rem 0.4rem;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .stat-value {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .stat-label {
    display: block;
    font-size: 0.62rem;
    letter-spacing: 0.5px;
    color: #999;
    margin-top: 0.25rem;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .unit-toggle {
    display: inline-flex;
    background: #e8e8ee;
    border-radius: 10px;
    padding: 4px;
  }

  .unit-toggle button {
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    color: #555;
  }

  .unit-toggle button.active {
    background: white;
    color: #1a1a1a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .btn-reset {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-reset:hover {
    background: #5a6fd6;
  }
</style>

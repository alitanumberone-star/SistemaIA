<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import 'leaflet-draw';

  export let center: [number, number] = [0, 0];
  export let zoom: number = 13;
  export let onSave: (coordinates: number[][]) => void;
  export let onCancel: () => void;

  let mapContainer: HTMLDivElement;
  let map: L.Map | null = null;
  let drawnItems: L.FeatureGroup;
  let drawControl: L.Control.Draw;

  onMount(() => {
    if (typeof window === 'undefined') return;

    map = L.map(mapContainer).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true
        },
        marker: false,
        circle: false,
        circlemarker: false,
        polyline: false,
        rectangle: true
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
    });

    map.on(L.Draw.Event.DELETED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        drawnItems.removeLayer(layer);
      });
    });

    return () => {
      if (map) {
        map.remove();
        map = null;
      }
    };
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  function handleSave() {
    if (!drawnItems || drawnItems.getLayers().length === 0) {
      alert('Por favor, dibuja una geocerca primero');
      return;
    }

    const layer = drawnItems.getLayers()[0];
    let coordinates: number[][] = [];

    if (layer instanceof L.Polygon) {
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      coordinates = latlngs.map(latlng => [latlng.lat, latlng.lng]);
    } else if (layer instanceof L.Rectangle) {
      const bounds = layer.getBounds();
      const corners = [
        bounds.getNorthWest(),
        bounds.getNorthEast(),
        bounds.getSouthEast(),
        bounds.getSouthWest()
      ];
      coordinates = corners.map(latlng => [latlng.lat, latlng.lng]);
    }

    if (coordinates.length < 3) {
      alert('La geocerca debe tener al menos 3 puntos');
      return;
    }

    onSave(coordinates);
  }

  function handleCancel() {
    onCancel();
  }

  function clearMap() {
    if (drawnItems) {
      drawnItems.clearLayers();
    }
  }
</script>

<div class="geofence-editor">
  <div class="editor-header">
    <h2>Dibujar Geocerca</h2>
    <p>Usa las herramientas de dibujo en el mapa para crear una geocerca (polígono o rectángulo)</p>
  </div>
  <div bind:this={mapContainer} class="leaflet-map"></div>
  <div class="editor-actions">
    <button class="btn btn-secondary" on:click={clearMap}>🗑️ Limpiar</button>
    <button class="btn btn-secondary" on:click={handleCancel}>❌ Cancelar</button>
    <button class="btn btn-primary" on:click={handleSave}>💾 Guardar</button>
  </div>
</div>

<style>
  .geofence-editor {
    padding: 1rem;
  }

  .editor-header {
    margin-bottom: 1rem;
  }

  .editor-header h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .editor-header p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .leaflet-map {
    width: 100%;
    height: 500px;
    border-radius: 8px;
    border: 2px solid #ddd;
  }

  .editor-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
  }

  .btn-primary {
    background-color: #4a90e2;
    color: white;
  }

  .btn-primary:hover {
    background-color: #357abd;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #5a6268;
  }
</style>

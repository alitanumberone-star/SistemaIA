<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';

  export let center: [number, number] = [0, 0];
  export let zoom: number = 13;
  export let markers: Array<{ lat: number, lng: number, popup?: string }> = [];

  let mapContainer: HTMLDivElement;
  let map: L.Map | null = null;
  let leafletMarkers: L.Marker[] = [];

  onMount(() => {
    if (typeof window === 'undefined') return;

    map = L.map(mapContainer).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    updateMarkers();

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

  function updateMarkers() {
    if (!map) return;

    leafletMarkers.forEach(marker => marker.remove());
    leafletMarkers = [];

    markers.forEach(markerData => {
      const marker = L.marker([markerData.lat, markerData.lng]);
      
      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }
      
      marker.addTo(map);
      leafletMarkers.push(marker);
    });
  }

  $: if (map) {
    map.setView(center, zoom);
  }

  $: if (map) {
    updateMarkers();
  }
</script>

<div bind:this={mapContainer} class="leaflet-map"></div>

<style>
  .leaflet-map {
    width: 100%;
    height: 400px;
    border-radius: 8px;
  }
</style>

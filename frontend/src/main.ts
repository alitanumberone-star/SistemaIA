import App from './App.svelte';
import './app.css';
import 'leaflet/dist/leaflet.css';
import 'katex/dist/katex.min.css';

const app = new App({
  target: document.getElementById('app') as HTMLElement
});

export default app;

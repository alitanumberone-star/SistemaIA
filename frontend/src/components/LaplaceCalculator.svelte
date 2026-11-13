<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';
  import { supabase } from '../lib/supabase';

  export let navigate: (path: string) => void;

  let expression = '';
  let loading = false;
  let error: string | null = null;
  let result: { original: string; transform: string; steps: string[] } | null = null;

  const examples = [
    't^2',
    'e^(2t)',
    'sin(3t)',
    'cos(3t)',
    '3t^2 + 2t + 1',
    'e^(2t)*sin(3t)'
  ];

  /** Convierte una expresión mathjs (t / s, ^, *) a LaTeX aproximado. */
  function toLatex(expr: string): string {
    let s = expr;
    // Potencias:  base ^ exp  ->  base^{exp}  (soporta un nivel de paréntesis)
    s = s.replace(/\^/g, '^');
    // multiplications
    s = s.replace(/\s*\*\s*/g, ' \\cdot ');
    // Agrupa exponentes entre { } cuando van precedidos de paréntesis o número.
    s = s.replace(/\^\s*(\([^()]*\)|\d+)/g, '^{$1}');
    return s;
  }

  function renderLatex(expr: string): string {
    try {
      return katex.renderToString(toLatex(expr), {
        throwOnError: false,
        displayMode: true
      });
    } catch {
      return expr;
    }
  }

  async function calculate() {
    const expr = expression.trim();
    if (!expr) return;

    loading = true;
    error = null;
    result = null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('http://localhost:3000/api/calculator/laplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ expression: expr })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'No se pudo calcular la transformada');
      }

      result = data;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function useExample(ex: string) {
    expression = ex;
    calculate();
  }
</script>

<div class="laplace-container">
  <header class="laplace-header">
    <h1>Calculadora de Transformada de Laplace</h1>
    <button on:click={() => navigate('/dashboard')} class="btn-back">← Volver al Dashboard</button>
  </header>

  <main class="laplace-content">
    <div class="intro">
      <p>Introduce una función f(t) y obtén su transformada L&#123;f(t)&#125; = F(s).</p>
    </div>

    <div class="input-card">
      <label for="expr">f(t) =</label>
      <div class="input-row">
        <input
          id="expr"
          type="text"
          bind:value={expression}
          placeholder="Ej: t^2, sin(3t), e^(2t)*cos(t)"
          on:keydown={(e) => e.key === 'Enter' && calculate()}
          disabled={loading}
        />
        <button class="btn-calc" on:click={calculate} disabled={loading || !expression.trim()}>
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      <div class="examples">
        <span>Ejemplos:</span>
        {#each examples as ex}
          <button class="example-chip" on:click={() => useExample(ex)} disabled={loading}>{ex}</button>
        {/each}
      </div>
    </div>

    {#if error}
      <div class="error-box">
        <strong>Error:</strong> {error}
      </div>
    {/if}

    {#if result}
      <div class="result-card">
        <div class="result-row">
          <div class="label">Original</div>
          <div class="math">{@html renderLatex(result.original)}</div>
        </div>
        <div class="result-row highlight">
          <div class="label">Transformada</div>
          <div class="math">
            {@html renderLatex(`F(s) = ${result.transform}`)}
          </div>
        </div>
      </div>

      {#if result.steps?.length}
        <div class="steps-card">
          <h3>Pasos</h3>
          <ol>
            {#each result.steps as step}
              <li><code>{step}</code></li>
            {/each}
          </ol>
        </div>
      {/if}
    {/if}

    <div class="note">
      <h3>Transformadas soportadas</h3>
      <ul>
        <li><code>L{'{{'} 1 {'}}'} = 1/s</code></li>
        <li><code>L{'{{'} t^n {'}}'} = n! / s^(n+1)</code></li>
        <li><code>L{'{{'} e^(a·t) {'}}'} = 1 / (s − a)</code></li>
        <li><code>L{'{{'} sin(b·t) {'}}'} = b / (s² + b²)</code></li>
        <li><code>L{'{{'} cos(b·t) {'}}'} = s / (s² + b²)</code></li>
        <li><code>L{'{{'} sinh(b·t) {'}}'} = b / (s² − b²)</code></li>
        <li><code>L{'{{'} cosh(b·t) {'}}'} = s / (s² − b²)</code></li>
      </ul>
      <p class="hint">Con linealidad (sumas y múltiplos constantes) y desplazamiento de frecuencia para e^(a·t)·f(t).</p>
    </div>
  </main>
</div>

<style>
  .laplace-container {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .laplace-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .laplace-header h1 {
    margin: 0;
    font-size: 1.6rem;
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

  .laplace-content {
    max-width: 820px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
  }

  .intro p {
    color: #666;
    margin-top: 0;
  }

  .input-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
  }

  .input-card label {
    display: block;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
    font-family: 'Cambria Math', Georgia, serif;
    font-size: 1.1rem;
  }

  .input-row {
    display: flex;
    gap: 0.75rem;
  }

  .input-row input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1.05rem;
    font-family: 'Cambria Math', Georgia, serif;
  }

  .input-row input:focus {
    outline: none;
    border-color: #667eea;
  }

  .btn-calc {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-calc:hover:not(:disabled) {
    background: #5a6fd6;
  }

  .btn-calc:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .examples {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #888;
  }

  .example-chip {
    background: #eef0fb;
    color: #4a5fc1;
    border: none;
    padding: 0.3rem 0.7rem;
    border-radius: 20px;
    cursor: pointer;
    font-family: 'Cambria Math', Georgia, serif;
    font-size: 0.85rem;
  }

  .example-chip:hover:not(:disabled) {
    background: #dfe3fa;
  }

  .error-box {
    background: #fff5f5;
    border: 1px solid #fed7d7;
    color: #c53030;
    padding: 1rem 1.25rem;
    border-radius: 10px;
    margin-bottom: 1.5rem;
  }

  .result-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
    overflow: hidden;
  }

  .result-row {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .result-row:last-child {
    border-bottom: none;
  }

  .result-row.highlight {
    background: linear-gradient(135deg, #f7f8ff 0%, #f0f2ff 100%);
  }

  .result-row .label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #999;
    margin-bottom: 0.5rem;
  }

  .math {
    overflow-x: auto;
    font-size: 1.15rem;
    color: #1a1a1a;
  }

  .steps-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
  }

  .steps-card h3 {
    margin-top: 0;
    color: #333;
  }

  .steps-card ol {
    margin: 0;
    padding-left: 1.5rem;
    color: #555;
  }

  .steps-card li {
    padding: 0.35rem 0;
  }

  .steps-card code {
    background: #f4f4f7;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .note {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .note h3 {
    margin-top: 0;
    color: #333;
  }

  .note ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 0.5rem;
  }

  .note li code {
    background: #f4f4f7;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    display: block;
    font-size: 0.9rem;
  }

  .hint {
    color: #888;
    font-size: 0.85rem;
    margin-bottom: 0;
    margin-top: 1rem;
  }
</style>

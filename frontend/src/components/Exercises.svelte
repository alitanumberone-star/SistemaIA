<script lang="ts">
  import { supabase } from '../lib/supabase';
  import { onMount } from 'svelte';

  export let navigate: (path: string) => void;

  let exercises: any[] = [];
  let loading = true;
  let error: string | null = null;
  let selectedExercise: any = null;
  let userAnswer: string = '';
  let selectedOption: number | null = null;
  let submitting = false;
  let submissionResult: any = null;
  let user: any = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user || null;

    if (!user) {
      navigate('/login');
      return;
    }

    await loadExercises();
  });

  async function loadExercises() {
    try {
      loading = true;
      const response = await fetch('http://localhost:3000/api/exercises');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      exercises = data.exercises || [];
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function selectExercise(exercise: any) {
    selectedExercise = exercise;
    userAnswer = '';
    selectedOption = null;
    submissionResult = null;
  }

  async function submitAnswer() {
    if (!selectedExercise) return;

    try {
      submitting = true;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const answer = selectedExercise.answer_type === 'multiple_choice'
        ? selectedOption?.toString()
        : userAnswer;

      const response = await fetch(
        `http://localhost:3000/api/exercises/${selectedExercise.id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ answer })
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      submissionResult = data;
    } catch (err: any) {
      error = err.message;
    } finally {
      submitting = false;
    }
  }

  function closeExercise() {
    selectedExercise = null;
    userAnswer = '';
    selectedOption = null;
    submissionResult = null;
  }
</script>

<div class="exercises-container">
  <header class="exercises-header">
    <h1>Ejercicios Interactivos</h1>
    <button on:click={() => navigate('/dashboard')} class="btn-back">
      ← Volver al Dashboard
    </button>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando ejercicios...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>Error: {error}</p>
      <button on:click={loadExercises} class="btn-retry">Reintentar</button>
    </div>
  {:else if selectedExercise}
    <div class="exercise-detail">
      <button on:click={closeExercise} class="btn-close">← Volver a la lista</button>

      <div class="exercise-card">
        <div class="exercise-header">
          <h2>{selectedExercise.title}</h2>
          <div class="exercise-badges">
            <span class="badge badge-type">{selectedExercise.type}</span>
            <span class="badge badge-difficulty">{selectedExercise.difficulty}</span>
            <span class="badge badge-answer-type">
              {selectedExercise.answer_type === 'multiple_choice' ? 'Selección Múltiple' : 'Respuesta Abierta'}
            </span>
          </div>
        </div>

        {#if selectedExercise.description}
          <p class="exercise-description">{selectedExercise.description}</p>
        {/if}

        <div class="exercise-expression">
          <strong>Expresión:</strong>
          <code>{selectedExercise.expression}</code>
        </div>

        {#if submissionResult}
          <div class="submission-result {submissionResult.is_correct ? 'correct' : 'incorrect'}">
            <h3>
              {submissionResult.is_correct ? '✓ Respuesta Correcta' : '✗ Respuesta Incorrecta'}
            </h3>
            {#if !submissionResult.is_correct}
              <p>Respuesta correcta: <code>{submissionResult.correct_answer}</code></p>
            {/if}
          </div>
        {:else}
          <div class="answer-section">
            {#if selectedExercise.answer_type === 'multiple_choice'}
              <h3>Selecciona la respuesta correcta:</h3>
              <div class="options-list">
                {#each selectedExercise.options as option, index}
                  <label class="option-label">
                    <input
                      type="radio"
                      name="option"
                      bind:group={selectedOption}
                      value={index}
                      disabled={submitting}
                    />
                    <span>{option}</span>
                  </label>
                {/each}
              </div>
            {:else}
              <h3>Escribe tu respuesta:</h3>
              <input
                type="text"
                bind:value={userAnswer}
                placeholder="Ingresa tu respuesta..."
                disabled={submitting}
                class="text-input"
              />
            {/if}

            <button
              on:click={submitAnswer}
              class="btn-submit"
              disabled={submitting || (selectedExercise.answer_type === 'multiple_choice' ? selectedOption === null : !userAnswer)}
            >
              {submitting ? 'Enviando...' : 'Enviar Respuesta'}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="exercises-list">
      <div class="filters">
        <h2>Lista de Ejercicios</h2>
        <p>Selecciona un ejercicio para comenzar</p>
      </div>

      {#if exercises.length === 0}
        <div class="no-exercises">
          <p>No hay ejercicios disponibles</p>
        </div>
      {:else}
        <div class="exercises-grid">
          {#each exercises as exercise}
            <div
              class="exercise-card-mini"
              role="button"
              tabindex="0"
              on:click={() => selectExercise(exercise)}
              on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectExercise(exercise)}
            >
              <h3>{exercise.title}</h3>
              <p class="exercise-desc">{exercise.description || exercise.expression}</p>
              <div class="exercise-badges">
                <span class="badge badge-type">{exercise.type}</span>
                <span class="badge badge-difficulty">{exercise.difficulty}</span>
                <span class="badge badge-answer-type-mini">
                  {exercise.answer_type === 'multiple_choice' ? '📝 Selección' : '✏️ Abierta'}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .exercises-container {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .exercises-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .exercises-header h1 {
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
    transition: all 0.2s;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
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

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    padding: 2rem;
  }

  .error p {
    color: #e53e3e;
    margin-bottom: 1rem;
  }

  .btn-retry {
    background: #667eea;
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
  }

  .exercises-list {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .filters {
    margin-bottom: 2rem;
  }

  .filters h2 {
    margin: 0 0 0.5rem 0;
    color: #1a1a1a;
  }

  .filters p {
    margin: 0;
    color: #666;
  }

  .exercises-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .exercise-card-mini {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s;
  }

  .exercise-card-mini:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .exercise-card-mini h3 {
    margin: 0 0 0.75rem 0;
    color: #1a1a1a;
  }

  .exercise-desc {
    color: #666;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .exercise-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge-type {
    background: #e3f2fd;
    color: #1976d2;
  }

  .badge-difficulty {
    background: #fff3e0;
    color: #f57c00;
  }

  .badge-answer-type {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  .badge-answer-type-mini {
    background: #e8f5e9;
    color: #388e3c;
  }

  .exercise-detail {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .btn-close {
    background: #667eea;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 1.5rem;
  }

  .exercise-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .exercise-header {
    margin-bottom: 1.5rem;
  }

  .exercise-header h2 {
    margin: 0 0 1rem 0;
    color: #1a1a1a;
  }

  .exercise-description {
    color: #666;
    margin-bottom: 1.5rem;
  }

  .exercise-expression {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .exercise-expression strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .exercise-expression code {
    display: block;
    font-size: 1.25rem;
    color: #667eea;
    font-weight: 600;
  }

  .answer-section {
    margin-top: 1.5rem;
  }

  .answer-section h3 {
    margin-bottom: 1rem;
    color: #1a1a1a;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .option-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-label:hover {
    background: #e9ecef;
  }

  .option-label input[type="radio"] {
    width: 1.25rem;
    height: 1.25rem;
  }

  .text-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    transition: border-color 0.2s;
  }

  .text-input:focus {
    outline: none;
    border-color: #667eea;
  }

  .btn-submit {
    background: #667eea;
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-submit:hover:not(:disabled) {
    background: #764ba2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .submission-result {
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 1.5rem;
  }

  .submission-result.correct {
    background: #d4edda;
    border: 1px solid #c3e6cb;
  }

  .submission-result.correct h3 {
    color: #155724;
    margin: 0 0 0.5rem 0;
  }

  .submission-result.incorrect {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
  }

  .submission-result.incorrect h3 {
    color: #721c24;
    margin: 0 0 0.5rem 0;
  }

  .submission-result p {
    margin: 0;
  }

  .submission-result code {
    background: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }

  .no-exercises {
    text-align: center;
    padding: 3rem;
    color: #666;
  }
</style>

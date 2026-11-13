-- ============================================
-- Actualización de tabla exercises para soportar
-- selección múltiple y respuesta abierta
-- ============================================

-- Agregar campo para tipo de respuesta
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS answer_type TEXT NOT NULL DEFAULT 'open_answer';

-- Agregar campo para opciones (para selección múltiple)
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS options JSONB;

-- Agregar campo para índice de respuesta correcta (para selección múltiple)
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS correct_option_index INTEGER;

-- Actualizar datos existentes para que sean de respuesta abierta
UPDATE public.exercises
SET answer_type = 'open_answer'
WHERE answer_type IS NULL OR answer_type = '';

-- Insertar ejercicios de ejemplo con ambos tipos
INSERT INTO public.exercises (title, description, type, difficulty, expression, solution, answer_type, options, correct_option_index) VALUES
  (
    'Selección Múltiple - Derivada',
    '¿Cuál es la derivada de f(x) = x³?',
    'derivative',
    'basic',
    'x^3',
    '3*x^2',
    'multiple_choice',
    '["2*x^2", "3*x^2", "x^2", "3*x"]'::jsonb,
    1
  ),
  (
    'Selección Múltiple - Laplace',
    '¿Cuál es la transformada de Laplace de f(t) = e^(2t)?',
    'laplace',
    'basic',
    'e^(2*t)',
    '1/(s-2)',
    'multiple_choice',
    '["1/s", "1/(s+2)", "1/(s-2)", "2/s"]'::jsonb,
    2
  ),
  (
    'Respuesta Abierta - Integral',
    'Calcula la integral de f(x) = 2x',
    'integral',
    'basic',
    '2*x',
    'x^2',
    'open_answer',
    NULL,
    NULL
  )
ON CONFLICT DO NOTHING;

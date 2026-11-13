-- ============================================
-- Configuración de Base de Datos - Supabase
-- Sistema Educativo de Transformada de Laplace
-- ============================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabla de ejercicios
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'derivative', 'integral', 'laplace'
  difficulty TEXT NOT NULL, -- 'basic', 'intermediate', 'advanced'
  expression TEXT NOT NULL,
  solution TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de envíos
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de progreso
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  total_exercises INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_level TEXT DEFAULT 'beginner',
  badges JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cursos (opcional, para expansión futura)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Políticas para exercises
CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = created_by);

-- Políticas para submissions
CREATE POLICY "Users can view own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para progress
CREATE POLICY "Users can view own progress"
  ON public.progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert progress"
  ON public.progress FOR INSERT
  WITH CHECK (true);

-- Políticas para courses
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ============================================
-- Índices para mejorar rendimiento
-- ============================================

CREATE INDEX IF NOT EXISTS idx_exercises_type ON public.exercises(type);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exercise_id ON public.submissions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.progress(user_id);

-- ============================================
-- Datos de ejemplo (opcional)
-- ============================================

-- Insertar ejercicios de ejemplo (puedes comentar esto si no lo necesitas)
INSERT INTO public.exercises (title, description, type, difficulty, expression, solution) VALUES
  ('Derivada Básica 1', 'Calcula la derivada de f(x) = x²', 'derivative', 'basic', 'x^2', '2*x'),
  ('Derivada Básica 2', 'Calcula la derivada de f(x) = sin(x)', 'derivative', 'basic', 'sin(x)', 'cos(x)'),
  ('Laplace Básica 1', 'Calcula la transformada de Laplace de f(t) = 1', 'laplace', 'basic', '1', '1/s'),
  ('Laplace Básica 2', 'Calcula la transformada de Laplace de f(t) = e^at', 'laplace', 'basic', 'e^(a*t)', '1/(s-a)')
ON CONFLICT DO NOTHING;

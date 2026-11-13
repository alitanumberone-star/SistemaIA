# Base de Datos - Supabase

## 📊 Esquema de la Base de Datos

Este directorio contiene la documentación y scripts para la configuración de la base de datos en Supabase.

## 🗄️ Tablas Propuestas

### users
- Extensión de auth.users de Supabase
- Perfiles de usuario con roles

### exercises
- Ejercicios de cálculo
- Tipo: derivada, integral, transformada de Laplace
- Dificultad: básico, intermedio, avanzado

### submissions
- Intentos de ejercicios por estudiantes
- Resultados y puntuaciones

### progress
- Progreso de aprendizaje por usuario
- Estadísticas y badges

## 🔐 Row Level Security (RLS)

Políticas de seguridad a implementar:

1. **users**: Solo el usuario puede leer/actualizar su propio perfil
2. **exercises**: Lectura pública, escritura solo para admin/profesor
3. **submissions**: Lectura solo del propietario, escritura del propietario
4. **progress**: Lectura/escritura solo del propietario

## 📝 SQL Scripts

Crear en Supabase SQL Editor:

```sql
-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
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
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabla de ejercicios
CREATE TABLE public.exercises (
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
CREATE TABLE public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de progreso
CREATE TABLE public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  total_exercises INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_level TEXT DEFAULT 'beginner',
  badges JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Próximos Pasos

1. Crear proyecto en Supabase
2. Ejecutar scripts SQL en SQL Editor
3. Configurar RLS policies
4. Importar datos iniciales de ejercicios

# EDU-Laplace

Plataforma educativa para cálculo con Laplace - Arquitectura Monorepo

## 📁 Estructura del Proyecto

```
edu-laplace/
├── frontend/          # Aplicación web Svelte + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── App.svelte
│   │   ├── main.ts
│   │   └── app.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/           # API REST con Express + TypeScript
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── calculator.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── database/          # Documentación de Supabase
├── package.json       # Workspace root
├── .env.example       # Variables de entorno
└── .gitignore
```

## 🚀 Instalación

```bash
# Instalar dependencias del monorepo
npm install
```

## 🔧 Configuración

1. Copiar `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Configurar las variables de entorno con tus credenciales de Supabase

## 📦 Scripts Disponibles

```bash
# Desarrollo (frontend + backend)
npm run dev

# Desarrollo individual
npm run dev:frontend    # Frontend en http://localhost:5173
npm run dev:backend     # Backend en http://localhost:3000

# Build
npm run build

# Linting
npm run lint

# Tests
npm run test
```

## 🛠️ Stack Tecnológico

### Frontend
- **Svelte** - Framework UI
- **Vite** - Build tool
- **TypeScript** - Tipado estático
- **KaTeX** - Renderizado LaTeX
- **math.js** - Cálculos matemáticos
- **Supabase JS** - Cliente de autenticación

### Backend
- **Express** - Framework API
- **TypeScript** - Tipado estático
- **Supabase** - Autenticación y base de datos
- **math.js** - Cálculos matemáticos
- **Helmet** - Seguridad HTTP headers
- **CORS** - Cross-origin resource sharing

### Infraestructura
- **Vercel** - Deploy en Edge + Serverless
- **Supabase** - BaaS (Backend as a Service)
- **PBKDF2** - Hashing de contraseñas (Supabase Auth)

## 🔐 Seguridad

- Autenticación con Supabase Auth (PBKDF2)
- Control de acceso RBAC con middleware
- Row Level Security (RLS) en Supabase
- Variables de entorno separadas (.env local vs Vercel production)
- Helmet para headers de seguridad

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cierre de sesión

### Calculator (Requiere autenticación)
- `POST /api/calculator/evaluate` - Evaluar expresión matemática
- `POST /api/calculator/validate` - Validar expresión
- `POST /api/calculator/laplace` - Transformada de Laplace (pendiente)

### Exercises (Requiere autenticación para envíos)
- `GET /api/exercises` - Obtener todos los ejercicios
- `GET /api/exercises/:id` - Obtener un ejercicio específico
- `POST /api/exercises` - Crear nuevo ejercicio (requiere autenticación)
- `POST /api/exercises/:id/submit` - Enviar respuesta a un ejercicio (requiere autenticación)
- `GET /api/exercises/:id/submissions` - Obtener envíos del usuario para un ejercicio (requiere autenticación)

## 📄 Licencia

Proyecto educativo para cálculo con Laplace.

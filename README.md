# EMob - Plataforma de eSports

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.0.0-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)](https://tailwindcss.com/)

Una plataforma moderna y optimizada para seguir partidos de eSports en tiempo real, con estadísticas detalladas, análisis de equipos y jugadores, y un sistema completo de gestión de usuarios.

## ✨ Características Principales

### 🎮 Soporte Multi-Juego
- Dota 2, League of Legends, CS2, Overwatch, Rainbow Six Siege
- Estadísticas específicas por juego
- Configuración personalizada por título

### 📊 Análisis en Tiempo Real
- Partidos en vivo con actualizaciones automáticas
- Estadísticas detalladas de equipos y jugadores
- Métricas de rendimiento y análisis predictivo
- Sistema de notificaciones inteligente

### 🔐 Seguridad y Autenticación
- Autenticación Firebase con múltiples proveedores
- Reglas de seguridad Firestore granulares
- Validación de entrada en todas las APIs
- Manejo centralizado de errores

### ⚡ Rendimiento Optimizado
- Lazy loading y code splitting
- Memoización de componentes React
- Cache inteligente con LRU
- Virtualización de listas largas
- Optimización de imágenes automática

### 🧪 Testing y Calidad
- Suite completa de testing con Jest
- Utilidades de testing personalizadas
- Cobertura de código configurada
- Mocks y helpers para desarrollo

## 🚀 Tecnologías

### Frontend
- **Framework**: Next.js 15.3.3 con App Router
- **UI Library**: React 19.0.0
- **Lenguaje**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **Animaciones**: Framer Motion 12.0
- **Iconos**: Heroicons 2.1

### Backend y Servicios
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Storage**: Firebase Storage
- **API Externa**: PandaScore
- **IA**: Google Gemini API

### Estado y Gestión de Datos
- **Estado Global**: Zustand 5.0
- **Cache**: Sistema personalizado con LRU
- **Persistencia**: LocalStorage optimizado

### Desarrollo y Testing
- **Testing**: Jest 30.0 + Testing Library
- **Linting**: ESLint 9.17 + TypeScript ESLint
- **Build**: SWC Minify
- **Análisis**: Bundle Analyzer

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- API Key de PandaScore
- API Key de Google Gemini (opcional)

### Configuración

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd EMob
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo de ejemplo y configura tus claves:
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id

# API Keys
PANDA_SCORE_TOKEN=tu_panda_score_token
PANDA_SCORE_TOKEN_FALLBACK=tu_token_fallback
GEMINI_API_KEY=tu_gemini_api_key

# Environment
NODE_ENV=development
```

4. **Configurar Firebase**

Asegúrate de que las reglas de Firestore estén configuradas correctamente (ya incluidas en el proyecto).

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción

# Calidad de código
npm run lint         # ESLint
npm run type-check   # Verificación de tipos TypeScript

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con cobertura

# Análisis
npm run analyze      # Análisis del bundle
```

## 📁 Estructura del Proyecto

```
EMob/
├── app/                          # App Router de Next.js
│   ├── api/                      # API Routes
│   │   ├── chat/                 # Endpoint del chatbot
│   │   └── esports/              # APIs de eSports
│   ├── components/               # Componentes React
│   │   ├── AuthComponent.tsx     # Autenticación
│   │   ├── ErrorBoundary.tsx     # Manejo de errores
│   │   ├── MatchCard.tsx         # Tarjetas de partidos
│   │   ├── NotificationSystem.tsx # Sistema de notificaciones
│   │   └── ...
│   ├── contexts/                 # Contextos de React
│   │   └── AuthContext.tsx       # Contexto de autenticación
│   ├── hooks/                    # Custom hooks
│   │   ├── useFirebaseAuth.ts    # Hook de autenticación
│   │   ├── usePerformance.ts     # Hook de rendimiento
│   │   └── ...
│   ├── lib/                      # Utilidades y configuración
│   │   ├── errorHandler.ts       # Sistema de manejo de errores
│   │   ├── firebase.ts           # Configuración Firebase
│   │   ├── performance.ts        # Métricas de rendimiento
│   │   ├── testing.ts            # Utilidades de testing
│   │   ├── types.ts              # Tipos TypeScript centralizados
│   │   └── utils.ts              # Utilidades generales
│   ├── store/                    # Estado global (Zustand)
│   │   └── index.ts              # Store principal
│   ├── esports/                  # Páginas de eSports
│   ├── equipos/                  # Página de equipos
│   ├── jugadores/                # Página de jugadores
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página de inicio
├── public/                       # Archivos estáticos
├── functions/                    # Firebase Functions
├── firestore.rules              # Reglas de seguridad Firestore
├── storage.rules                # Reglas de seguridad Storage
├── firebase.json                # Configuración Firebase
├── next.config.ts               # Configuración Next.js
├── tailwind.config.ts           # Configuración Tailwind
├── tsconfig.json                # Configuración TypeScript
├── jest.config.js               # Configuración Jest
└── package.json                 # Dependencias y scripts
```

## 🔧 Configuración Avanzada

### Optimización de Rendimiento

El proyecto incluye múltiples optimizaciones:

- **Code Splitting**: Componentes lazy-loaded automáticamente
- **Image Optimization**: Optimización automática con Next.js Image
- **Bundle Analysis**: Análisis del tamaño del bundle
- **Cache Strategy**: Cache inteligente con invalidación automática

### Sistema de Errores

Sistema centralizado de manejo de errores con:

- Captura automática de errores no manejados
- Clasificación por tipo y severidad
- Reportes automáticos en producción
- Error Boundary mejorado con retry

### Testing

Configuración completa de testing con:

- Mocks automáticos para APIs del navegador
- Utilidades para generar datos de prueba
- Matchers personalizados
- Cobertura de código configurada

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard
3. El despliegue es automático en cada push

### Firebase Hosting

```bash
npm run build
firebase deploy
```

### Docker

```bash
docker build -t emob .
docker run -p 3000:3000 emob
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- Usar TypeScript para todo el código
- Seguir las reglas de ESLint configuradas
- Escribir tests para nuevas funcionalidades
- Documentar funciones complejas
- Usar conventional commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa los [Issues existentes](../../issues)
2. Crea un nuevo Issue con detalles del problema
3. Incluye información del entorno y pasos para reproducir

## 🙏 Agradecimientos

- [PandaScore](https://pandascore.co/) por la API de eSports
- [Firebase](https://firebase.google.com/) por los servicios backend
- [Vercel](https://vercel.com/) por el hosting
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseño

---

**Desarrollado con ❤️ para la comunidad de eSports**

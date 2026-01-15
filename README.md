# EMob - Plataforma de eSports

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.3.0-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)](https://tailwindcss.com/)

Plataforma moderna para seguir partidos de eSports en tiempo real, con estadisticas detalladas, analisis de equipos y jugadores, y gestion de usuarios.

## ⚡ Inicio rapido (desarrollo)

1. Instala dependencias:
```bash
npm install
```

2. Configura variables de entorno:
```bash
cp .env.example .env.local
```

3. Completa tus claves en `.env.local`.

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## ✅ Requisitos

- Node.js 18+
- npm
- Proyecto de Firebase con Auth y Firestore
- Token de PandaScore
- (Opcional) API Key de Google Gemini para `/api/chat`

## 🔧 Configuracion local

### Variables de entorno

El proyecto usa `.env.local`. Parte de una base en `.env.example` y agrega las claves que falten:

```env
# Firebase (Web SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Otras APIs
PANDA_SCORE_TOKEN=
PANDA_SCORE_TOKEN_FALLBACK=

# Opcional (chat IA)
GEMINI_API_KEY=

# Entorno
NODE_ENV=development
```

Notas:
- `GEMINI_API_KEY` no esta en `.env.example`; agregala si vas a usar el chatbot.
- `PANDA_SCORE_TOKEN_FALLBACK` es opcional.

### Firebase

- Reglas en `firestore.rules` y `storage.rules`.
- Guia paso a paso en `FIREBASE_SETUP.md`.

## 🛠️ Scripts disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de produccion
npm run start        # Servidor de produccion

# Calidad de codigo
npm run lint         # ESLint
npm run type-check   # Verificacion de tipos TypeScript

# Testing
npm test             # Jest
npm run test:watch   # Jest en modo watch

# Analisis
npm run analyze      # Analisis del bundle
```

## 🧱 Estructura del proyecto

```
app/                 # App Router de Next.js
app/api/             # Endpoints (chat, eSports, etc.)
app/components/      # Componentes React
app/contexts/        # Contextos React
app/hooks/           # Hooks personalizados
app/lib/             # Utilidades y servicios
app/store/           # Estado global (Zustand)
functions/           # Firebase Functions
mobile/              # Cliente mobile (si aplica)
public/              # Archivos estaticos
tests/               # Tests
```

## 🚀 Tecnologias

### Frontend
- **Framework**: Next.js 15.3.3 (App Router)
- **UI Library**: React 19
- **Lenguaje**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animaciones**: Framer Motion 12
- **Iconos**: Heroicons 2

### Backend y servicios
- **Base de datos**: Firebase Firestore
- **Autenticacion**: Firebase Auth
- **Storage**: Firebase Storage
- **API Externa**: PandaScore
- **IA**: Google Gemini API

### Desarrollo y testing
- **Testing**: Jest + Testing Library
- **Linting**: ESLint + TypeScript ESLint
- **Build**: SWC Minify
- **Analisis**: Bundle Analyzer

## 📚 Documentacion relacionada

- `FEATURES.md`: detalle funcional de la plataforma.
- `FIREBASE_SETUP.md`: configuracion y uso de Firebase.
- `MATCH_IMPROVEMENTS.md`: ideas y mejoras sobre partidos.

## 🚀 Despliegue

### Vercel (recomendado)

1. Conecta el repositorio a Vercel.
2. Configura las variables de entorno en el dashboard.
3. Despliegue automatico en cada push.

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

## 🤝 Contribucion

1. Fork del proyecto.
2. Crea una rama: `git checkout -b feature/AmazingFeature`.
3. Commit: `git commit -m 'Add some AmazingFeature'`.
4. Push: `git push origin feature/AmazingFeature`.
5. Abre un Pull Request.

### Estandares de codigo

- Usar TypeScript en todo el codigo.
- Seguir las reglas de ESLint.
- Escribir tests para nuevas funcionalidades.
- Documentar funciones complejas.
- Usar conventional commits.

## 📄 Licencia

Este proyecto esta bajo la Licencia MIT. Ver `LICENSE` para mas detalles.

## 🆘 Soporte

1. Revisa los [Issues existentes](../../issues).
2. Crea un nuevo Issue con detalles del problema.
3. Incluye informacion del entorno y pasos para reproducir.

## 🙏 Agradecimientos

- [PandaScore](https://pandascore.co/) por la API de eSports.
- [Firebase](https://firebase.google.com/) por los servicios backend.
- [Vercel](https://vercel.com/) por el hosting.
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseno.

---

**Desarrollado con ❤️ para la comunidad de eSports**

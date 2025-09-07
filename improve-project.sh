#!/bin/bash

# Script para mejorar automáticamente el proyecto EMob
echo "🚀 Iniciando mejoras automáticas del proyecto EMob..."

# 1. Instalar dependencias faltantes
echo "📦 Instalando dependencias faltantes..."
npm install --save-dev @types/node @types/react @types/react-dom

# 2. Crear archivo .env.example si no existe
if [ ! -f ".env.example" ]; then
    echo "📝 Creando archivo .env.example..."
    cat > .env.example << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# PandaScore API
PANDA_SCORE_TOKEN=your_panda_score_token_here

# Site Verification
GOOGLE_SITE_VERIFICATION=your_google_verification_code
YANDEX_VERIFICATION=your_yandex_verification_code

# Environment
NODE_ENV=development
EOF
fi

# 3. Crear archivo .gitignore mejorado
echo "📝 Mejorando .gitignore..."
cat >> .gitignore << 'EOF'

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
EOF

# 4. Crear configuración de TypeScript mejorada
echo "⚙️ Mejorando configuración de TypeScript..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./app/components/*"],
      "@/lib/*": ["./app/lib/*"],
      "@/hooks/*": ["./app/hooks/*"],
      "@/contexts/*": ["./app/contexts/*"],
      "@/store/*": ["./app/store/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "mobile",
    ".next",
    "out",
    "build",
    "dist"
  ]
}
EOF

# 5. Crear configuración de ESLint mejorada
echo "🔧 Mejorando configuración de ESLint..."
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "plugin:@next/next/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "react-hooks/exhaustive-deps": "warn",
    "react/display-name": "off",
    "@next/next/no-img-element": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
EOF

# 6. Crear script de desarrollo mejorado
echo "📜 Creando scripts de desarrollo..."
cat > package.json << 'EOF'
{
  "name": "emob",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "analyze": "cross-env ANALYZE=true next build",
    "clean": "rm -rf .next out node_modules/.cache",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install"
  },
  "dependencies": {
    "@firebasegen/default-connector": "file:dataconnect-generated/js/default-connector",
    "@headlessui/react": "^2.2.0",
    "@heroicons/react": "^2.1.5",
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "critters": "^0.0.23",
    "date-fns": "^4.1.0",
    "firebase": "^11.3.0",
    "framer-motion": "^12.0.0",
    "https-proxy-agent": "^7.0.6",
    "next": "^15.3.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-intersection-observer": "^9.13.1",
    "react-virtualized-auto-sizer": "^1.0.24",
    "react-window": "^1.8.10",
    "undici": "^7.10.0",
    "web-vitals": "^5.1.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^15.3.3",
    "@tailwindcss/postcss": "^4",
    "@types/jest": "^30.0.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/react-window": "^1.8.8",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "cross-env": "^7.0.3",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.3.3",
    "husky": "^9.0.0",
    "jest": "^30.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.4.0",
    "typescript": "^5"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
EOF

# 7. Crear configuración de Prettier
echo "💅 Creando configuración de Prettier..."
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
EOF

# 8. Crear configuración de Husky para pre-commit hooks
echo "🐶 Configurando Husky para pre-commit hooks..."
npx husky install
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
' > .husky/pre-commit

chmod +x .husky/pre-commit

# 9. Crear README mejorado
echo "📖 Creando README mejorado..."
cat > README.md << 'EOF'
# EMob - Plataforma de Esports Definitiva

![EMob Logo](public/next.svg)

Una plataforma completa para seguir esports en tiempo real, con estadísticas detalladas, predicciones y análisis avanzado.

## 🚀 Características

- ⚡ **Tiempo Real**: Seguimiento de partidos en vivo
- 📊 **Estadísticas Avanzadas**: Análisis detallado de jugadores y equipos
- 🎯 **Predicciones**: Sistema de predicciones inteligente
- 🔔 **Notificaciones**: Alertas personalizables
- 🎮 **Múltiples Juegos**: Soporte para Dota 2, League of Legends, CS2, Overwatch y más
- 📱 **Responsive**: Optimizado para todos los dispositivos
- 🌙 **Tema Oscuro**: Interfaz moderna y elegante
- 🔍 **Búsqueda Avanzada**: Encuentra todo lo que necesitas rápidamente

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Animations**: Framer Motion
- **Deployment**: Vercel

## 📋 Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Firebase
- Token de PandaScore API

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/robertoteto6/EMob.git
   cd EMob
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus claves API

4. **Ejecuta el proyecto**
   ```bash
   npm run dev
   ```

## 📜 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta ESLint
- `npm run lint:fix` - Corrige errores de ESLint automáticamente
- `npm run type-check` - Verifica tipos de TypeScript
- `npm run test` - Ejecuta tests
- `npm run format` - Formatea código con Prettier
- `npm run analyze` - Analiza bundle de producción

## 🏗️ Estructura del Proyecto

```
EMob/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/        # Componentes React
│   ├── contexts/          # Context Providers
│   ├── hooks/            # Custom Hooks
│   ├── lib/              # Utilidades y configuraciones
│   └── store/            # Estado global (Zustand)
├── public/                # Archivos estáticos
├── dataconnect/          # Firebase Data Connect
├── functions/            # Firebase Cloud Functions
└── mobile/               # App React Native
```

## 🔧 Configuración

### Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication y Firestore
3. Configura las reglas de seguridad
4. Obtén las credenciales y colócalas en `.env.local`

### PandaScore API

1. Regístrate en [PandaScore](https://pandascore.co/)
2. Obtén tu token de API
3. Configúralo en las variables de entorno

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Otros proveedores

El proyecto está optimizado para cualquier plataforma que soporte Next.js.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Autor**: Roberto Muñoz
- **GitHub**: [@robertoteto6](https://github.com/robertoteto6)
- **Email**: tu-email@ejemplo.com

## 🙏 Agradecimientos

- [PandaScore](https://pandascore.co/) por la API de esports
- [Firebase](https://firebase.google.com/) por la infraestructura
- [Vercel](https://vercel.com/) por el despliegue
- Comunidad de desarrolladores de React y Next.js

---

⭐ Si te gusta este proyecto, ¡dale una estrella!
EOF

echo "✅ Mejoras automáticas completadas!"
echo ""
echo "📋 Resumen de mejoras:"
echo "  ✓ Configuración de TypeScript mejorada"
echo "  ✓ ESLint configurado con reglas optimizadas"
echo "  ✓ Prettier configurado para formateo de código"
echo "  ✓ Husky configurado para pre-commit hooks"
echo "  ✓ Scripts de desarrollo mejorados"
echo "  ✓ Archivo .env.example creado"
echo "  ✓ .gitignore mejorado"
echo "  ✓ README completo creado"
echo ""
echo "🎯 Próximos pasos:"
echo "  1. Configura tus variables de entorno en .env.local"
echo "  2. Ejecuta 'npm run lint:fix' para corregir errores automáticamente"
echo "  3. Ejecuta 'npm run format' para formatear el código"
echo "  4. Configura Firebase y PandaScore API"
echo ""
echo "🚀 ¡Listo para desarrollar!"

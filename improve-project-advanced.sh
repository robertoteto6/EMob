#!/bin/bash

# Script mejorado para optimizaciones avanzadas del proyecto EMob
# Versión 2.0 - Mejoras automáticas avanzadas

set -e

echo "🚀 Iniciando optimizaciones avanzadas del proyecto EMob..."

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para instalar dependencias si no existen
ensure_dependency() {
    if ! command_exists "$1"; then
        echo "❌ $1 no está instalado. Por favor instálalo primero."
        exit 1
    fi
}

# Verificar dependencias críticas
ensure_dependency node
ensure_dependency npm

# Función para backup de archivos
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📦 Backup creado: ${file}.backup.*"
    fi
}

# Función para mejorar configuración de TypeScript
improve_typescript_config() {
    echo "🔧 Mejorando configuración de TypeScript..."

    backup_file "tsconfig.json"

    # Actualizar tsconfig.json con configuraciones avanzadas
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
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
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "build",
    "dist"
  ]
}
EOF

    echo "✅ Configuración de TypeScript mejorada"
}

# Función para mejorar configuración de ESLint
improve_eslint_config() {
    echo "🔧 Mejorando configuración de ESLint..."

    backup_file ".eslintrc.json"

    # Crear configuración avanzada de ESLint
    cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "jsx-a11y",
    "import"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-inferrable-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-uses-react": "off",
    "react/react-in-pre-jsx": "off",
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always"
      }
    ],
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true
      }
    }
  },
  "env": {
    "browser": true,
    "node": true,
    "es2022": true
  }
}
EOF

    echo "✅ Configuración de ESLint mejorada"
}

# Función para mejorar configuración de Next.js
improve_nextjs_config() {
    echo "🔧 Mejorando configuración de Next.js..."

    backup_file "next.config.ts"

    # Actualizar next.config.ts con optimizaciones avanzadas
    cat > next.config.ts << 'EOF'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Optimizaciones de rendimiento
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // Configuración de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Optimizaciones de build
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirecciones
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Variables de entorno
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimizaciones de webpack
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      }
    }

    // Alias para imports más limpios
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    }

    return config
  },
}

export default nextConfig
EOF

    echo "✅ Configuración de Next.js mejorada"
}

# Función para mejorar package.json
improve_package_json() {
    echo "🔧 Mejorando package.json..."

    backup_file "package.json"

    # Actualizar scripts y dependencias
    npm pkg set scripts.build="next build"
    npm pkg set scripts.start="next start"
    npm pkg set scripts.lint="next lint --fix"
    npm pkg set scripts.type-check="tsc --noEmit"
    npm pkg set scripts.test="jest"
    npm pkg set scripts.test:watch="jest --watch"
    npm pkg set scripts.test:coverage="jest --coverage"
    npm pkg set scripts.prepare="husky install"
    npm pkg set scripts.pre-commit="lint-staged"
    npm pkg set scripts.analyze="ANALYZE=true next build"

    echo "✅ package.json mejorado"
}

# Función para crear archivo de variables de entorno de ejemplo
create_env_example() {
    echo "🔧 Creando archivo .env.example..."

    cat > .env.example << 'EOF'
# Configuración de Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Configuración de PandaScore API
PANDASCORE_API_KEY=your_pandascore_api_key_here
NEXT_PUBLIC_PANDASCORE_BASE_URL=https://api.pandascore.co

# Configuración de base de datos
DATABASE_URL=your_database_url_here

# Configuración de JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Configuración de email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Configuración de Redis (opcional)
REDIS_URL=redis://localhost:6379

# Configuración de logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Configuración de analytics
NEXT_PUBLIC_GA_TRACKING_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id

# Configuración de PWA
NEXT_PUBLIC_PWA_ENABLED=true

# Configuración de desarrollo
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

    echo "✅ Archivo .env.example creado"
}

# Función para crear archivo .gitignore mejorado
improve_gitignore() {
    echo "🔧 Mejorando .gitignore..."

    backup_file ".gitignore"

    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS generated files
Thumbs.db
ehthumbs.db
Desktop.ini

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# Local development
.local

# Testing
test-results/
playwright-report/
playwright/.cache/

# Sentry
.sentryclirc

# Vercel
.vercel

# Database
*.db
*.sqlite
*.sqlite3

# Backup files
*.backup.*
*~

# Custom
.vercel
.netlify/
EOF

    echo "✅ .gitignore mejorado"
}

# Función para crear archivo de configuración de Prettier
create_prettier_config() {
    echo "🔧 Creando configuración de Prettier..."

    cat > .prettierrc << 'EOF'
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "embeddedLanguageFormatting": "auto"
}
EOF

    cat > .prettierignore << 'EOF'
# Dependencies
node_modules/

# Build outputs
.next/
out/
build/
dist/

# Generated files
*.min.js
*.min.css

# Logs
*.log

# Package manager files
package-lock.json
yarn.lock
pnpm-lock.yaml

# Environment files
.env*

# Cache directories
.cache/
.parcel-cache/

# Coverage reports
coverage/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
EOF

    echo "✅ Configuración de Prettier creada"
}

# Función para crear archivo de configuración de Husky y lint-staged
setup_husky_lint_staged() {
    echo "🔧 Configurando Husky y lint-staged..."

    # Instalar husky si no está instalado
    if ! npm list husky > /dev/null 2>&1; then
        npm install --save-dev husky lint-staged
    fi

    # Configurar lint-staged en package.json
    npm pkg set lint-staged['*.{js,jsx,ts,tsx}']="eslint --fix"
    npm pkg set lint-staged['*.{js,jsx,ts,tsx,json,css,md}']="prettier --write"

    # Inicializar husky
    npx husky init

    # Crear hook de pre-commit
    cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF

    chmod +x .husky/pre-commit

    echo "✅ Husky y lint-staged configurados"
}

# Función para crear archivo README mejorado
create_improved_readme() {
    echo "🔧 Creando README mejorado..."

    backup_file "README.md"

    cat > README.md << 'EOF'
# EMob - Esports Mobile App

Una aplicación web moderna para seguimiento de esports, construida con Next.js 15, React 19 y TypeScript.

## 🚀 Características

- ⚡ **Next.js 15** - Framework React de última generación
- 🔥 **Firebase** - Backend como servicio con autenticación y base de datos
- 🎮 **PandaScore API** - Datos en tiempo real de partidos de esports
- 📱 **PWA** - Aplicación web progresiva
- 🎨 **Tailwind CSS** - Framework CSS utilitario
- 🔒 **TypeScript** - Tipado estático para mejor desarrollo
- 📊 **Zustand** - Gestión de estado ligera y rápida
- 🔍 **SEO Optimizado** - Mejor posicionamiento en buscadores

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **APIs**: PandaScore API, RESTful APIs
- **State Management**: Zustand
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, Prettier
- **Deployment**: Vercel

## 📋 Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Firebase
- API Key de PandaScore

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/emob.git
   cd emob
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura variables de entorno**
   ```bash
   cp .env.example .env.local
   # Edita .env.local con tus claves API
   ```

4. **Configura Firebase**
   ```bash
   # Sigue las instrucciones en FIREBASE_SETUP.md
   ```

5. **Ejecuta el proyecto**
   ```bash
   npm run dev
   ```

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run start        # Inicia servidor de producción
npm run preview      # Vista previa de build

# Calidad de código
npm run lint         # Ejecuta ESLint
npm run type-check   # Verifica tipos TypeScript
npm run format       # Formatea código con Prettier

# Testing
npm run test         # Ejecuta tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con cobertura

# Utilidades
npm run analyze      # Análisis de bundle
```

## 🏗️ Estructura del Proyecto

```
emob/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/        # Componentes React
│   ├── contexts/          # Context Providers
│   ├── hooks/            # Custom Hooks
│   ├── lib/              # Utilidades y configuraciones
│   └── store/            # Zustand Store
├── public/                # Archivos estáticos
├── styles/               # Estilos globales
├── types/                # Definiciones TypeScript
├── .husky/              # Git hooks
└── config/              # Configuraciones
```

## 🔧 Configuración

### Firebase Setup
Sigue las instrucciones detalladas en `FIREBASE_SETUP.md`

### PandaScore API
1. Regístrate en [PandaScore](https://pandascore.co/)
2. Obtén tu API key
3. Configura en `.env.local`

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura variables de entorno
3. Deploy automático

### Manual

```bash
npm run build
npm run start
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

- **Autor**: Tu Nombre
- **Email**: tu-email@ejemplo.com
- **GitHub**: [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Firebase](https://firebase.google.com/) - Backend Platform
- [PandaScore](https://pandascore.co/) - Esports Data API
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

⭐ Si te gusta este proyecto, ¡dale una estrella!
EOF

    echo "✅ README mejorado creado"
}

# Función para crear archivo de configuración de Jest
create_jest_config() {
    echo "🔧 Creando configuración de Jest..."

    backup_file "jest.config.js"

    cat > jest.config.js << 'EOF'
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/_*.{js,jsx,ts,tsx}',
  ],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
EOF

    # Crear archivo de setup de Jest
    cat > jest.setup.js << 'EOF'
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
EOF

    echo "✅ Configuración de Jest creada"
}

# Función para crear archivo de configuración de VS Code
create_vscode_config() {
    echo "🔧 Creando configuración de VS Code..."

    mkdir -p .vscode

    # Configuración de VS Code
    cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "emmet.includeLanguages": {
    "typescript": "typescriptreact",
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "typescriptreact",
    "javascript": "javascriptreact"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "css.validate": false,
  "less.validate": false,
  "scss.validate": false,
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/out": true,
    "**/.vercel": true,
    "**/coverage": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/out": true,
    "**/.vercel": true,
    "**/coverage": true,
    "**/*.log": true
  }
}
EOF

    # Extensiones recomendadas
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intros",
    "ms-vscode.vscode-json",
    "usernamehw.errorlens",
    "ms-vsliveshare.vsliveshare",
    "gruntfuggly.todo-tree",
    "ms-vscode.vscode-css-peek",
    "zignd.html-css-class-completion",
    "ms-vscode.vscode-css-intellisense",
    "ecmel.vscode-html-css",
    "ms-vscode.vscode-html-css",
    "formulahendry.auto-close-tag",
    "ms-vscode.vscode-css-peek",
    "zignd.html-css-class-completion"
  ]
}
EOF

    echo "✅ Configuración de VS Code creada"
}

# Función principal
main() {
    echo "🎯 Iniciando mejoras avanzadas del proyecto..."

    improve_typescript_config
    improve_eslint_config
    improve_nextjs_config
    improve_package_json
    create_env_example
    improve_gitignore
    create_prettier_config
    setup_husky_lint_staged
    create_improved_readme
    create_jest_config
    create_vscode_config

    echo ""
    echo "🎉 ¡Todas las optimizaciones avanzadas han sido aplicadas!"
    echo ""
    echo "📋 Próximos pasos recomendados:"
    echo "1. Revisa los archivos modificados y sus backups"
    echo "2. Ejecuta 'npm install' para instalar nuevas dependencias"
    echo "3. Ejecuta 'npm run lint' para verificar el código"
    echo "4. Ejecuta 'npm run type-check' para verificar tipos"
    echo "5. Ejecuta 'npm run build' para verificar el build"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "- npm run dev        # Iniciar desarrollo"
    echo "- npm run lint       # Verificar linting"
    echo "- npm run type-check # Verificar tipos"
    echo "- npm run test       # Ejecutar tests"
    echo "- npm run build      # Construir para producción"
}

# Ejecutar función principal
main "$@"

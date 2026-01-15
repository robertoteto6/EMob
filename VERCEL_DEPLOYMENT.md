# 🚀 Despliegue en Vercel - EMob2 Esports App

## 📋 Requisitos Previos

Antes de desplegar, asegúrate de tener:

1. **Cuenta en Vercel**: [Regístrate en Vercel](https://vercel.com)
2. **Proyecto Git**: Tu código debe estar en un repositorio Git (GitHub, GitLab, etc.)
3. **Variables de entorno configuradas**

## 🔧 Configuración de Variables de Entorno

### En Vercel Dashboard:

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```bash
# YouTube Data API v3 (OBLIGATORIO)
YOUTUBE_API_KEY=AIzaSyCJS066qlp31BZzUmZWRH0_wrrcosjdwS0

# PandaScore API (OBLIGATORIO)
PANDA_SCORE_TOKEN=tu_token_de_pandascore_aqui

# Firebase (OPCIONAL - solo si usas Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### Variables de Producción vs Desarrollo:

- **YOUTUBE_API_KEY**: La misma API key funciona para ambos entornos
- **PANDA_SCORE_TOKEN**: Usa el mismo token para ambos entornos
- **Firebase**: Configura las mismas variables en ambos entornos

## 🚀 Despliegue Automático

### Opción 1: Desde GitHub (Recomendado)

1. **Conecta tu repositorio**:
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "Import Project"
   - Conecta tu cuenta de GitHub
   - Selecciona este repositorio

2. **Configura el proyecto**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (automático)

3. **Agrega las variables de entorno** (ver sección anterior)

4. **Deploy**: Haz clic en "Deploy"

### Opción 2: CLI de Vercel

```bash
# Instala Vercel CLI
npm install -g vercel

# Inicia sesión
vercel login

# Despliega
vercel

# Para producción
vercel --prod
```

## ⚙️ Configuración de Vercel

El proyecto incluye un archivo `vercel.json` con la configuración optimizada:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Características configuradas:

- ✅ **Framework**: Next.js automático
- ✅ **Región**: US East (iad1) - más rápido para usuarios de América
- ✅ **API Routes**: Timeout extendido (30s) para llamadas a APIs externas
- ✅ **Headers de seguridad**: CORS, CSP, HSTS
- ✅ **Redirecciones**: Configuradas para mejor UX

## 🔍 Verificación del Despliegue

Después del despliegue, verifica:

1. **Build exitoso**: Revisa los logs de build en Vercel
2. **Funcionalidades**:
   - ✅ Página principal carga
   - ✅ Navegación a `/esports`
   - ✅ Jugadores se cargan correctamente
   - ✅ Videos de YouTube se muestran
   - ✅ APIs responden correctamente

3. **URLs importantes**:
   - **Producción**: `https://tu-proyecto.vercel.app`
   - **Preview**: Cada PR genera una URL de preview

## 🐛 Solución de Problemas

### Error: "YouTube API key not configured"

**Solución**: Verifica que `YOUTUBE_API_KEY` esté configurada en las variables de entorno de Vercel.

### Error: "PandaScore API error"

**Solución**: Verifica que `PANDA_SCORE_TOKEN` sea válido y esté configurado.

### Build falla

**Solución**:
1. Revisa los logs de build en Vercel
2. Verifica que todas las dependencias estén en `package.json`
3. Asegúrate de que `NODE_ENV=production` esté configurado

### API routes no funcionan

**Solución**:
1. Verifica que las variables de entorno estén en **Production** (no solo Preview)
2. Revisa los logs de función en Vercel
3. Verifica que las APIs externas estén accesibles

## 📊 Monitoreo y Analytics

El proyecto incluye:

- **Vercel Analytics**: Métricas de rendimiento automáticas
- **Vercel Speed Insights**: Monitoreo de Core Web Vitals
- **Error tracking**: Logs detallados en Vercel dashboard

## 🔄 Actualizaciones

Para actualizar tu despliegue:

1. **Push a main/master**: Despliegue automático
2. **Preview deployments**: Cada PR genera una URL de preview
3. **Rollback**: Puedes volver a versiones anteriores desde Vercel

## 🌐 Dominio Personalizado

Para usar tu propio dominio:

1. Ve a **Settings** → **Domains** en Vercel
2. Agrega tu dominio
3. Configura los DNS según las instrucciones
4. Vercel generará automáticamente el certificado SSL

## 📞 Soporte

Si tienes problemas:

1. Revisa la [documentación de Vercel](https://vercel.com/docs)
2. Revisa los logs en el dashboard de Vercel
3. Verifica las variables de entorno
4. Contacta soporte de Vercel si es necesario

---

¡Tu app de esports está lista para el mundo! 🎮✨
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityProvider, SkipToContent } from "./components/AccessibilityEnhancer";
import { UXProvider, NotificationContainer, GlobalLoader } from "./components/UXEnhancer";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['Consolas', 'Monaco', 'monospace'],
});

export const metadata: Metadata = {
  title: {
    default: "EMob - Tu Plataforma de Esports Definitiva",
    template: "%s | EMob"
  },
  description: "Sigue los mejores partidos de esports en vivo, estadísticas de jugadores, equipos y torneos de Dota 2, League of Legends, CS2, Overwatch y más.",
  keywords: "esports, gaming, Dota 2, League of Legends, Counter-Strike, CS2, Overwatch, Rainbow Six Siege, partidos en vivo, estadísticas",
  authors: [{ name: "EMob Team" }],
  creator: "EMob",
  publisher: "EMob",
  metadataBase: new URL('https://emob.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "EMob - Tu Plataforma de Esports Definitiva",
    description: "La mejor experiencia para seguir esports con partidos en vivo, estadísticas y análisis detallados.",
    url: "https://emob.vercel.app",
    siteName: "EMob",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EMob - Plataforma de Esports"
      }
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EMob - Tu Plataforma de Esports Definitiva",
    description: "Sigue los mejores partidos de esports en vivo y estadísticas detalladas.",
    images: ["/og-image.png"],
    creator: "@emob_esports"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
    yandex: process.env.YANDEX_VERIFICATION || '',
  },
  other: {
    'theme-color': '#00FF80',
    'color-scheme': 'dark',
    'format-detection': 'telephone=no',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#00FF80',
    'application-name': 'EMob',
    'apple-mobile-web-app-title': 'EMob',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#00FF80" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }} />
        
        {/* Analytics placeholder */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Google Analytics or other analytics code here
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            // gtag('config', 'GA_MEASUREMENT_ID');
          `
        }} />
      </head>
      
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}>
        <ErrorBoundary>
          <AccessibilityProvider>
            <UXProvider>
              <AuthProvider>
                <SkipToContent />
                
                <Suspense fallback={
                  <div className="animate-pulse bg-gray-800 h-16 w-full" role="status" aria-label="Cargando navegación"></div>
                }>
                  <Header />
                </Suspense>
                
                <main id="main-content" className="focus:outline-none" role="main">
                  {children}
                </main>
                <NotificationContainer />
                <GlobalLoader />
              </AuthProvider>
            </UXProvider>
          </AccessibilityProvider>
          
          {/* Performance monitoring */}
          <script dangerouslySetInnerHTML={{
            __html: `
              // Monitor Core Web Vitals
              function sendToAnalytics(metric) {
                // Send to your analytics service
                console.log('Web Vital:', metric);
              }
              
              // Monitor long tasks
              if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.entryType === 'longtask') {
                      console.warn('Long task detected:', entry.duration);
                    }
                  }
                });
                observer.observe({entryTypes: ['longtask']});
              }
            `
          }} />
          <SpeedInsights />
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}

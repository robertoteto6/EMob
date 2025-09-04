"use client";

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// Tipos para configuración SEO
interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'video' | 'music';
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
  structuredData?: any;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

// Configuración base del sitio
const SITE_CONFIG = {
  siteName: 'EMob - Plataforma de Esports',
  siteUrl: 'https://emob.vercel.app',
  defaultTitle: 'EMob - Tu Plataforma de Esports Definitiva',
  defaultDescription: 'Sigue los mejores partidos de esports en vivo, estadísticas de jugadores, equipos y torneos de Dota 2, League of Legends, CS2, Overwatch y más.',
  defaultImage: '/og-image.png',
  twitterHandle: '@emob_esports',
  locale: 'es_ES',
  themeColor: '#00FF80',
};

// Componente principal de SEO
interface SEOProps extends SEOConfig {
  children?: React.ReactNode;
}

export default function SEOOptimizer({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  siteName = SITE_CONFIG.siteName,
  locale = SITE_CONFIG.locale,
  alternateLocales = [],
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noIndex = false,
  noFollow = false,
  canonical,
  structuredData,
  children,
}: SEOProps) {
  const pathname = usePathname();
  
  // Generar metadatos optimizados
  const seoData = useMemo(() => {
    const fullTitle = title 
      ? `${title} | ${SITE_CONFIG.siteName}`
      : SITE_CONFIG.defaultTitle;
    
    const fullDescription = description || SITE_CONFIG.defaultDescription;
    const fullImage = image || SITE_CONFIG.defaultImage;
    const fullUrl = url || `${SITE_CONFIG.siteUrl}${pathname}`;
    const canonicalUrl = canonical || fullUrl;
    
    // Combinar keywords
    const allKeywords = [
      ...keywords,
      'esports',
      'gaming',
      'partidos en vivo',
      'estadísticas',
      'torneos',
    ].join(', ');
    
    return {
      title: fullTitle,
      description: fullDescription,
      keywords: allKeywords,
      image: fullImage.startsWith('http') ? fullImage : `${SITE_CONFIG.siteUrl}${fullImage}`,
      url: fullUrl,
      canonical: canonicalUrl,
    };
  }, [title, description, keywords, image, url, canonical, pathname]);
  
  // Generar robots meta
  const robotsContent = useMemo(() => {
    const robots = [];
    if (noIndex) robots.push('noindex');
    else robots.push('index');
    
    if (noFollow) robots.push('nofollow');
    else robots.push('follow');
    
    robots.push('max-snippet:-1', 'max-image-preview:large', 'max-video-preview:-1');
    
    return robots.join(', ');
  }, [noIndex, noFollow]);
  
  return (
    <>
      <Head>
        {/* Metadatos básicos */}
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords} />
        <meta name="author" content={author || 'EMob Team'} />
        <meta name="robots" content={robotsContent} />
        <link rel="canonical" href={seoData.canonical} />
        
        {/* Open Graph */}
        <meta property="og:type" content={type} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={seoData.image} />
        <meta property="og:url" content={seoData.url} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content={locale} />
        
        {alternateLocales.map(altLocale => (
          <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
        ))}
        
        {publishedTime && (
          <meta property="article:published_time" content={publishedTime} />
        )}
        
        {modifiedTime && (
          <meta property="article:modified_time" content={modifiedTime} />
        )}
        
        {author && (
          <meta property="article:author" content={author} />
        )}
        
        {section && (
          <meta property="article:section" content={section} />
        )}
        
        {tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
        <meta name="twitter:creator" content={SITE_CONFIG.twitterHandle} />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={seoData.image} />
        
        {/* Metadatos adicionales */}
        <meta name="theme-color" content={SITE_CONFIG.themeColor} />
        <meta name="msapplication-TileColor" content={SITE_CONFIG.themeColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Preconnect para performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.pandascore.co" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://vercel.live" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        
        {/* Structured Data */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData),
            }}
          />
        )}
      </Head>
      {children}
    </>
  );
}

// Componente para breadcrumbs SEO
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function SEOBreadcrumbs({ items, className }: BreadcrumbsProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.siteUrl}${item.url}`,
    })),
  };
  
  return (
    <>
      <nav className={className} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          {items.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400">/</span>
              )}
              {index === items.length - 1 ? (
                <span className="text-gray-900 dark:text-gray-100" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <a
                  href={item.url}
                  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {item.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </>
  );
}

// Hook para generar structured data automáticamente
export function useStructuredData(type: string, data: any) {
  return useMemo(() => {
    const baseStructure = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    };
    
    return baseStructure;
  }, [type, data]);
}

// Componente para artículos/noticias
interface ArticleSEOProps {
  title: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  image?: string;
  tags?: string[];
  section?: string;
}

export function ArticleSEO({
  title,
  description,
  author,
  publishedTime,
  modifiedTime,
  image,
  tags = [],
  section = 'Esports',
}: ArticleSEOProps) {
  const structuredData = useStructuredData('Article', {
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.siteUrl}/logo.png`,
      },
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    image: image ? `${SITE_CONFIG.siteUrl}${image}` : SITE_CONFIG.defaultImage,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': SITE_CONFIG.siteUrl,
    },
  });
  
  return (
    <SEOOptimizer
      title={title}
      description={description}
      type="article"
      author={author}
      publishedTime={publishedTime}
      modifiedTime={modifiedTime}
      image={image}
      tags={tags}
      section={section}
      structuredData={structuredData}
    />
  );
}

// Componente para páginas de eventos/partidos
interface EventSEOProps {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  image?: string;
  organizer?: string;
}

export function EventSEO({
  name,
  description,
  startDate,
  endDate,
  location = 'Online',
  image,
  organizer = 'EMob',
}: EventSEOProps) {
  const structuredData = useStructuredData('Event', {
    name,
    description,
    startDate,
    endDate,
    location: {
      '@type': 'Place',
      name: location,
    },
    organizer: {
      '@type': 'Organization',
      name: organizer,
    },
    image: image ? `${SITE_CONFIG.siteUrl}${image}` : SITE_CONFIG.defaultImage,
  });
  
  return (
    <SEOOptimizer
      title={`${name} - Evento de Esports`}
      description={description}
      type="website"
      image={image}
      structuredData={structuredData}
    />
  );
}

// Función para generar sitemap dinámico
export function generateSitemapEntry(url: string, lastmod?: string, changefreq?: string, priority?: string) {
  return {
    url: url.startsWith('http') ? url : `${SITE_CONFIG.siteUrl}${url}`,
    lastmod: lastmod || new Date().toISOString(),
    changefreq: changefreq || 'weekly',
    priority: priority || '0.8',
  };
}

// Utilidades para URLs amigables
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .trim()
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

export function createFriendlyURL(base: string, title: string, id?: string | number): string {
  const slug = createSlug(title);
  const idSuffix = id ? `-${id}` : '';
  return `${base}/${slug}${idSuffix}`;
}
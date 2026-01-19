import { MetadataRoute } from 'next';

// Función para generar el sitemap dinámicamente
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://emob.vercel.app';
  const currentDate = new Date().toISOString();

  // URLs estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/esports`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/equipos`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/jugadores`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // URLs de juegos específicos
  const gameRoutes: MetadataRoute.Sitemap = [
    'dota2',
    'lol',
    'csgo',
    'valorant',
    'overwatch',
    'rainbow6siege',
  ].map(game => ({
    url: `${baseUrl}/esports/game/${game}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // URLs de torneos (estas podrían ser dinámicas en el futuro)
  const tournamentRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/esports/tournament`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Combinar todas las rutas
  return [
    ...staticRoutes,
    ...gameRoutes,
    ...tournamentRoutes,
  ];
}

// Función auxiliar para generar sitemap de partidos dinámicamente
// Esta función podría ser llamada desde una API route para generar
// entradas de sitemap basadas en datos reales
export async function generateMatchesSitemap(): Promise<MetadataRoute.Sitemap> {
  const _baseUrl = 'https://emob.vercel.app';
  
  try {
    // Aquí podrías hacer una llamada a tu API para obtener partidos recientes
    // const matches = await fetchRecentMatches();
    
    // Por ahora, retornamos un array vacío
    // En una implementación real, mapearías los partidos a URLs
    const matchRoutes: MetadataRoute.Sitemap = [];
    
    // Ejemplo de cómo sería:
    // const matchRoutes: MetadataRoute.Sitemap = matches.map(match => ({
    //   url: `${baseUrl}/esports/${match.id}`,
    //   lastModified: new Date(match.updatedAt).toISOString(),
    //   changeFrequency: 'hourly',
    //   priority: 0.6,
    // }));
    
    return matchRoutes;
  } catch (error) {
    console.error('Error generating matches sitemap:', error);
    return [];
  }
}
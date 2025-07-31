import { Metadata } from 'next';

// Generador de meta tags dinámicos para EMob
export const generateSEOMetadata = {
  
  // Página principal
  home: (): Metadata => ({
    title: 'EMob - Tu Plataforma de Esports Definitiva',
    description: 'Sigue los mejores partidos de esports en vivo, estadísticas de jugadores, equipos y torneos de Dota 2, League of Legends, CS2, Overwatch y más.',
    keywords: 'esports, gaming, Dota 2, League of Legends, Counter-Strike, CS2, Overwatch, Rainbow Six Siege, partidos en vivo, estadísticas',
    authors: [{ name: 'EMob Team' }],
    creator: 'EMob',
    publisher: 'EMob',
    openGraph: {
      title: 'EMob - Tu Plataforma de Esports Definitiva',
      description: 'La mejor experiencia para seguir esports con partidos en vivo, estadísticas y análisis detallados.',
      url: 'https://emob.vercel.app',
      siteName: 'EMob',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'EMob - Plataforma de Esports'
        }
      ],
      locale: 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'EMob - Tu Plataforma de Esports Definitiva',
      description: 'Sigue los mejores partidos de esports en vivo y estadísticas detalladas.',
      images: ['/og-image.png'],
      creator: '@emob_esports'
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
    verification: {
      google: 'your-google-verification-code',
    },
  }),

  // Página de partido específico
  match: (matchId: string, team1?: string, team2?: string, game?: string): Metadata => ({
    title: team1 && team2 
      ? `${team1} vs ${team2} - Partido en Vivo | EMob`
      : `Partido ${matchId} - EMob`,
    description: `Sigue en vivo el emocionante partido${team1 && team2 ? ` entre ${team1} y ${team2}` : ''} ${game ? `de ${game}` : ''} con estadísticas detalladas y análisis en tiempo real.`,
    openGraph: {
      title: team1 && team2 
        ? `🔴 VIVO: ${team1} vs ${team2}`
        : `Partido ${matchId}`,
      description: `Partido en vivo con estadísticas y análisis detallado`,
      type: 'article',
      images: ['/og-match.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: team1 && team2 ? `🔴 ${team1} vs ${team2}` : `Partido ${matchId}`,
    },
  }),

  // Página de equipo
  team: (teamName: string, game?: string): Metadata => ({
    title: `${teamName} - Estadísticas y Partidos | EMob`,
    description: `Descubre las estadísticas completas, roster, partidos recientes y próximos del equipo ${teamName}${game ? ` de ${game}` : ''}.`,
    openGraph: {
      title: `${teamName} - Equipo de Esports`,
      description: `Estadísticas, roster y partidos de ${teamName}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${teamName} - EMob`,
    },
  }),

  // Página de jugador
  player: (playerName: string, team?: string, game?: string): Metadata => ({
    title: `${playerName} - Perfil del Jugador | EMob`,
    description: `Perfil completo de ${playerName}${team ? ` de ${team}` : ''}${game ? ` en ${game}` : ''} con estadísticas, logros y historial de partidos.`,
    openGraph: {
      title: `${playerName} - Jugador de Esports`,
      description: `Estadísticas y perfil completo de ${playerName}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${playerName} - EMob`,
    },
  }),

  // Página de torneos
  tournaments: (): Metadata => ({
    title: 'Torneos de Esports - Próximos y En Vivo | EMob',
    description: 'Descubre todos los torneos de esports próximos y en curso, con premios, equipos participantes y horarios completos.',
    openGraph: {
      title: 'Torneos de Esports - EMob',
      description: 'Todos los torneos próximos y en curso',
      type: 'website',
    },
  }),

  // Página de jugadores
  players: (game?: string): Metadata => ({
    title: `Jugadores${game ? ` de ${game}` : ''} - Rankings y Estadísticas | EMob`,
    description: `Explora los mejores jugadores${game ? ` de ${game}` : ''} con estadísticas detalladas, rankings y perfiles completos.`,
    openGraph: {
      title: `Jugadores${game ? ` de ${game}` : ''} - EMob`,
      description: 'Rankings y estadísticas de los mejores jugadores',
      type: 'website',
    },
  }),

  // Página de equipos
  teams: (game?: string): Metadata => ({
    title: `Equipos${game ? ` de ${game}` : ''} - Rankings y Estadísticas | EMob`,
    description: `Descubre los mejores equipos${game ? ` de ${game}` : ''} con estadísticas, roster actual y historial de partidos.`,
    openGraph: {
      title: `Equipos${game ? ` de ${game}` : ''} - EMob`,
      description: 'Rankings y estadísticas de los mejores equipos',
      type: 'website',
    },
  }),
};

// Schema.org structured data
export const generateStructuredData = {
  
  // Website schema
  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EMob',
    url: 'https://emob.vercel.app',
    description: 'Plataforma completa de seguimiento de esports',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://emob.vercel.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }),

  // Organization schema
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EMob',
    url: 'https://emob.vercel.app',
    logo: 'https://emob.vercel.app/logo.png',
    sameAs: [
      'https://twitter.com/emob_esports',
      'https://github.com/emob'
    ]
  }),

  // Sports event schema para partidos
  sportsEvent: (matchData: any) => ({
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${matchData.team1} vs ${matchData.team2}`,
    description: `Partido de ${matchData.game}`,
    startDate: matchData.startTime,
    eventStatus: matchData.status,
    sport: matchData.game,
    competitor: [
      {
        '@type': 'SportsTeam',
        name: matchData.team1
      },
      {
        '@type': 'SportsTeam',
        name: matchData.team2
      }
    ]
  })
};

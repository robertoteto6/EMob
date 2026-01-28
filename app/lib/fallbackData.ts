// Datos de respaldo para cuando la API está limitada por rate limit
export const fallbackTeams = {
  dota2: [
    {
      id: 1001,
      name: "Team Secret",
      acronym: "Secret",
      image_url: null,
      current_videogame: { id: 1, name: "Dota 2", slug: "dota2" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [
        { id: 1, name: "The International", tier: "S", prizepool: "$40,000,000", begin_at: "2024-01-01", end_at: "2024-01-15", league: "Valve" }
      ],
      gloryScore: 25
    },
    {
      id: 1002,
      name: "OG",
      acronym: "OG",
      image_url: null,
      current_videogame: { id: 1, name: "Dota 2", slug: "dota2" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [
        { id: 2, name: "Major Championship", tier: "A", prizepool: "$5,000,000", begin_at: "2024-02-01", end_at: "2024-02-10", league: "DPC" }
      ],
      gloryScore: 18
    },
    {
      id: 1003,
      name: "Fnatic",
      acronym: "FNC",
      image_url: null,
      current_videogame: { id: 1, name: "Dota 2", slug: "dota2" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [],
      gloryScore: 5
    }
  ],
  lol: [
    {
      id: 2001,
      name: "T1",
      acronym: "T1",
      image_url: null,
      current_videogame: { id: 2, name: "League of Legends", slug: "lol" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [
        { id: 3, name: "World Championship", tier: "S", prizepool: "$5,000,000", begin_at: "2024-03-01", end_at: "2024-03-20", league: "Riot Games" }
      ],
      gloryScore: 22
    },
    {
      id: 2002,
      name: "G2 Esports",
      acronym: "G2",
      image_url: null,
      current_videogame: { id: 2, name: "League of Legends", slug: "lol" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [
        { id: 4, name: "MSI", tier: "A", prizepool: "$800,000", begin_at: "2024-04-01", end_at: "2024-04-15", league: "Riot Games" }
      ],
      gloryScore: 15
    }
  ],
  csgo: [
    {
      id: 3001,
      name: "FaZe Clan",
      acronym: "FaZe",
      image_url: null,
      current_videogame: { id: 3, name: "Counter-Strike 2", slug: "csgo" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [
        { id: 5, name: "IEM Katowice", tier: "S", prizepool: "$1,000,000", begin_at: "2024-05-01", end_at: "2024-05-10", league: "ESL" }
      ],
      gloryScore: 20
    },
    {
      id: 3002,
      name: "Natus Vincere",
      acronym: "NAVI",
      image_url: null,
      current_videogame: { id: 3, name: "Counter-Strike 2", slug: "csgo" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [],
      gloryScore: 8
    }
  ],
  r6siege: [
    {
      id: 4001,
      name: "Team BDS",
      acronym: "BDS",
      image_url: null,
      current_videogame: { id: 4, name: "Rainbow Six Siege", slug: "r6siege" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [
        { id: 6, name: "Six Invitational", tier: "S", prizepool: "$3,000,000", begin_at: "2024-06-01", end_at: "2024-06-15", league: "Ubisoft" }
      ],
      gloryScore: 19
    },
    {
      id: 4002,
      name: "Spacestation Gaming",
      acronym: "SSG",
      image_url: null,
      current_videogame: { id: 4, name: "Rainbow Six Siege", slug: "r6siege" },
      players: 5,
      modified_at: new Date().toISOString(),
      tournaments: [],
      gloryScore: 6
    }
  ]
};

export function getFallbackTeams(game: string) {
  return fallbackTeams[game as keyof typeof fallbackTeams] || [];
}

// Fallback data para ligas
export const fallbackLeagues = {
  dota2: [
    {
      id: 101,
      name: "Dota Pro Circuit",
      url: "https://dpc.pandascore.co",
      image_url: null,
      modified_at: new Date().toISOString(),
    },
    {
      id: 102,
      name: "ESL One",
      url: "https://esl.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    }
  ],
  lol: [
    {
      id: 201,
      name: "League Championship Series",
      url: "https://lolesports.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    },
    {
      id: 202,
      name: "League of Legends EMEA Championship",
      url: "https://lec.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    }
  ],
  csgo: [
    {
      id: 301,
      name: "ESL Pro League",
      url: "https://esl.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    },
    {
      id: 302,
      name: "BLAST Premier",
      url: "https://blastpremier.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    }
  ],
  valorant: [
    {
      id: 601,
      name: "VCT - Valorant Champions Tour",
      url: "https://valorantesports.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    }
  ],
  fortnite: [
    {
      id: 701,
      name: "Fortnite Champion Series",
      url: "https://fortnite.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    }
  ],
  rl: [
    {
      id: 1101,
      name: "Rocket League Championship Series",
      url: "https://rocketleagueesports.com",
      image_url: null,
      modified_at: new Date().toISOString(),
    }
  ]
};

export function getFallbackLeagues(game: string) {
  return fallbackLeagues[game as keyof typeof fallbackLeagues] || [];
}

// Fallback data para series
export const fallbackSeries = {
  dota2: [
    {
      id: 1001,
      name: "DPC 2024",
      full_name: "Dota Pro Circuit 2024",
      season: "Winter",
      year: 2024,
      tier: "S",
    }
  ],
  lol: [
    {
      id: 2001,
      name: "LCS 2024",
      full_name: "League Championship Series 2024",
      season: "Spring",
      year: 2024,
      tier: "A",
    }
  ],
  csgo: [
    {
      id: 3001,
      name: "ESL Pro League S19",
      full_name: "ESL Pro League Season 19",
      season: "Season 19",
      year: 2024,
      tier: "S",
    }
  ],
  valorant: [
    {
      id: 6001,
      name: "VCT 2024",
      full_name: "Valorant Champions Tour 2024",
      season: "Champions",
      year: 2024,
      tier: "S",
    }
  ]
};

export function getFallbackSeries(game: string) {
  return fallbackSeries[game as keyof typeof fallbackSeries] || [];
}

// Fallback data para jugadores
export const fallbackPlayers = {
  dota2: [
    {
      id: 10001,
      name: "N0tail",
      first_name: "Johan",
      last_name: "Sundstein",
      nationality: "DK",
      role: "Support",
      current_team: { name: "OG", id: 1002 },
      gloryScore: 95
    }
  ],
  lol: [
    {
      id: 20001,
      name: "Faker",
      first_name: "Lee",
      last_name: "Sang-hyeok",
      nationality: "KR",
      role: "Mid",
      current_team: { name: "T1", id: 2001 },
      gloryScore: 98
    }
  ],
  csgo: [
    {
      id: 30001,
      name: "s1mple",
      first_name: "Oleksandr",
      last_name: "Kostyliev",
      nationality: "UA",
      role: "AWP",
      current_team: { name: "NAVI", id: 3002 },
      gloryScore: 96
    }
  ],
  valorant: [
    {
      id: 60001,
      name: "TenZ",
      first_name: "Tyson",
      last_name: "Ngo",
      nationality: "CA",
      role: "Duelist",
      current_team: { name: "Sentinels", id: 6001 },
      gloryScore: 90
    }
  ]
};

export function getFallbackPlayers(game: string) {
  return fallbackPlayers[game as keyof typeof fallbackPlayers] || [];
}

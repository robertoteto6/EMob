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

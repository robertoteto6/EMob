// Configuración de juegos soportados por EMob Esports

export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description?: string;
  apiSupported: boolean; // Si la API de PandaScore soporta este juego
  apiName?: string; // Nombre del juego en la API de PandaScore (si es diferente)
}

export const SUPPORTED_GAMES: GameConfig[] = [
  {
    id: "dota2",
    name: "Dota 2",
    icon: "/dota2.svg",
    color: "#A970FF",
    gradient: "from-purple-600 to-purple-800",
    description: "El MOBA más competitivo del mundo",
    apiSupported: true,
    apiName: "dota2"
  },
  {
    id: "lol",
    name: "League of Legends",
    icon: "/leagueoflegends.svg",
    color: "#1E90FF",
    gradient: "from-blue-600 to-blue-800",
    description: "El juego más popular de esports",
    apiSupported: true,
    apiName: "lol"
  },
  {
    id: "csgo",
    name: "Counter-Strike 2",
    icon: "/counterstrike.svg",
    color: "#FFD700",
    gradient: "from-yellow-600 to-yellow-800",
    description: "El FPS táctico por excelencia",
    apiSupported: true,
    apiName: "csgo"
  },
  {
    id: "r6siege",
    name: "Rainbow Six Siege",
    icon: "/icons/games/rainbow-six.svg",
    color: "#FF6600",
    gradient: "from-orange-600 to-orange-800",
    description: "Combate táctico intenso",
    apiSupported: true,
    apiName: "r6siege"
  },
  {
    id: "overwatch",
    name: "Overwatch 2",
    icon: "/overwatch.svg",
    color: "#F99E1A",
    gradient: "from-orange-500 to-orange-700",
    description: "Acción de héroes en equipo",
    apiSupported: true,
    apiName: "ow"
  },
  // Juegos adicionales de PandaScore API
  {
    id: "valorant",
    name: "Valorant",
    icon: "/valorant.svg",
    color: "#FF4655",
    gradient: "from-red-600 to-red-800",
    description: "Tactical shooter 5v5 de Riot Games",
    apiSupported: true,
    apiName: "valorant"
  },
  {
    id: "fortnite",
    name: "Fortnite",
    icon: "/fortnite.svg",
    color: "#9D4EDD",
    gradient: "from-purple-500 to-pink-600",
    description: "Battle Royale competitivo",
    apiSupported: true,
    apiName: "fortnite"
  },
  {
    id: "pubg",
    name: "PUBG",
    icon: "/pubg.svg",
    color: "#F2A900",
    gradient: "from-yellow-500 to-orange-600",
    description: "PlayerUnknown's Battlegrounds",
    apiSupported: true,
    apiName: "pubg"
  },
  {
    id: "apex",
    name: "Apex Legends",
    icon: "/apex.svg",
    color: "#DA292A",
    gradient: "from-red-500 to-orange-600",
    description: "Battle Royale de Respawn Entertainment",
    apiSupported: true,
    apiName: "apex"
  },
  {
    id: "cod",
    name: "Call of Duty",
    icon: "/cod.svg",
    color: "#8C8C8C",
    gradient: "from-gray-600 to-gray-800",
    description: "La franquicia FPS más vendida",
    apiSupported: true,
    apiName: "cod"
  },
  {
    id: "rl",
    name: "Rocket League",
    icon: "/rocketleague.svg",
    color: "#00C8FF",
    gradient: "from-cyan-500 to-blue-600",
    description: "Fútbol con coches boost",
    apiSupported: true,
    apiName: "rl"
  },
  {
    id: "sf",
    name: "Street Fighter",
    icon: "/streetfighter.svg",
    color: "#FF6B35",
    gradient: "from-orange-500 to-red-600",
    description: "La saga de fighting games definitiva",
    apiSupported: true,
    apiName: "sf"
  },
  {
    id: "ssb",
    name: "Super Smash Bros",
    icon: "/smash.svg",
    color: "#E3001B",
    gradient: "from-red-600 to-pink-700",
    description: "Fighting game crossover de Nintendo",
    apiSupported: true,
    apiName: "ssb"
  },
  {
    id: "sc2",
    name: "StarCraft II",
    icon: "/starcraft2.svg",
    color: "#0074E0",
    gradient: "from-blue-600 to-indigo-700",
    description: "RTS de ciencia ficción de Blizzard",
    apiSupported: true,
    apiName: "sc2"
  },
  {
    id: "kog",
    name: "King of Glory",
    icon: "/kog.svg",
    color: "#FFD700",
    gradient: "from-yellow-500 to-amber-600",
    description: "El MOBA móvil más popular de China",
    apiSupported: true,
    apiName: "kog"
  },
  {
    id: "wr",
    name: "Wild Rift",
    icon: "/wildrift.svg",
    color: "#00D4AA",
    gradient: "from-teal-500 to-emerald-600",
    description: "League of Legends para móvil",
    apiSupported: true,
    apiName: "wr"
  },
  {
    id: "wow",
    name: "World of Warcraft",
    icon: "/wow.svg",
    color: "#9B59B6",
    gradient: "from-purple-600 to-indigo-700",
    description: "El MMORPG más icónico en Arena PvP",
    apiSupported: true,
    apiName: "wow"
  }
];

// Mapeo de IDs de juegos a los nombres de la API de PandaScore
export const GAME_API_MAPPING: Record<string, string> = SUPPORTED_GAMES.reduce((acc, game) => {
  if (game.apiSupported && game.apiName) {
    acc[game.id] = game.apiName;
    // También agregamos el mapeo inverso para compatibilidad
    if (game.id !== game.apiName) {
      acc[game.apiName] = game.apiName;
    }
  }
  return acc;
}, {} as Record<string, string>);

// Función para obtener la configuración de un juego
export function getGameConfig(gameId: string): GameConfig | undefined {
  return SUPPORTED_GAMES.find(game => game.id === gameId);
}

// Función para verificar si un juego está soportado por la API
export function isGameApiSupported(gameId: string): boolean {
  const config = getGameConfig(gameId);
  return config?.apiSupported ?? false;
}

// Función para obtener el nombre del juego en la API
export function getGameApiName(gameId: string): string {
  return GAME_API_MAPPING[gameId] || gameId;
}

// Solo juegos soportados por la API
export const API_SUPPORTED_GAMES = SUPPORTED_GAMES.filter(game => game.apiSupported);

// IDs de juegos soportados por la API
export const API_SUPPORTED_GAME_IDS = API_SUPPORTED_GAMES.map(game => game.apiName || game.id);

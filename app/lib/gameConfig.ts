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
    icon: "/rainbow6siege.svg",
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

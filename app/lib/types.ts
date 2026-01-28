// Tipos de datos centralizados para la aplicación de eSports

// ============================================================================
// TIPOS DE JUEGOS Y CONFIGURACIÓN
// ============================================================================

/**
 * Configuración de un juego soportado
 */
export interface GameConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  color: string;
}

// ============================================================================
// TIPOS DE PARTIDOS Y TORNEOS
// ============================================================================

/**
 * Representa la información de un juego individual dentro de un partido.
 */
export interface GameInfo {
  id: number;
  position: number;
  status: 'not_started' | 'running' | 'finished';
  begin_at: string | null;
  end_at: string | null;
  winner_id: number | null;
}

/**
 * Representa la información de un stream de video para un partido.
 */
export interface StreamInfo {
  embed_url: string | null;
  raw_url: string;
  language: string;
}

/**
 * Representa un partido básico (para listas y vistas generales)
 */
export interface Match {
  id: number;
  radiant: string;
  dire: string;
  radiant_score: number | null;
  dire_score: number | null;
  start_time: number;
  league: string;
  radiant_win: boolean | null;
  game: string;
}

/**
 * Representa los detalles completos de un partido de eSports.
 */
export interface MatchDetail extends Match {
  name: string;
  radiant_id: number | null;
  dire_id: number | null;
  end_time: number | null;
  serie: string;
  tournament: string;
  tournament_id?: number | null;
  league_id?: number | null;
  match_type: string;
  number_of_games: number;
  games: GameInfo[];
  streams: StreamInfo[];
  players?: {
    radiant: Player[];
    dire: Player[];
  };
}

/**
 * Representa un torneo
 */
export interface Tournament {
  id: number;
  name: string;
  begin_at: number | null;
  end_at: number | null;
  league: string;
  serie: string;
  prizepool: string | null;
  tier: string | null;
  region: string | null;
  live_supported: boolean;
  game: string;
}

/**
 * Representa una liga
 */
export interface League {
  id: number;
  name: string;
  url?: string | null;
  image_url?: string | null;
  modified_at?: string;
  series?: Serie[];
  game: string;
}

/**
 * Representa una serie (dentro de una liga)
 */
export interface Serie {
  id: number;
  name: string;
  full_name?: string;
  season?: string | null;
  year?: number | null;
  begin_at?: string | null;
  end_at?: string | null;
  tier?: string | null;
  winner_id?: number | null;
  winner_type?: string | null;
  league?: League;
  tournaments?: Tournament[];
  game: string;
}

/**
 * Representa un bracket de torneo
 */
export interface Bracket {
  id: number;
  type: string;
  stage_type: string;
  stage_name: string;
  position: number;
  group_name?: string;
  matches?: Match[];
  tournament_id: number;
}

/**
 * Representa un game individual dentro de un partido
 */
export interface Game {
  id: number;
  position: number;
  status: 'not_started' | 'running' | 'finished';
  begin_at: string | null;
  end_at: string | null;
  finished: boolean;
  winner_id: number | null;
  winner_type: string | null;
  match_id: number;
  forfeit: boolean;
  length: number | null;
  game_stats?: GameStatistics;
}

/**
 * Estadísticas detalladas de un game
 */
export interface GameStatistics {
  game_id: number;
  teams?: TeamGameStats[];
  players?: PlayerGameStats[];
}

/**
 * Estadísticas de equipo en un game
 */
export interface TeamGameStats {
  team_id: number;
  name: string;
  total_kills?: number;
  total_deaths?: number;
  total_assists?: number;
  gold?: number;
  turrets?: number;
  dragons?: number;
  barons?: number;
  elders?: number;
  [key: string]: any;
}

/**
 * Estadísticas de jugador en un game
 */
export interface PlayerGameStats {
  player_id: number;
  name: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  gold?: number;
  cs?: number;
  damage_dealt?: number;
  damage_taken?: number;
  [key: string]: any;
}

/**
 * Representa datos en vivo de un partido
 */
export interface LiveMatch {
  match_id: number;
  status: string;
  current_game?: number;
  score_team_1: number;
  score_team_2: number;
  events?: LiveEvent[];
  updated_at: string;
}

/**
 * Evento en vivo durante un partido
 */
export interface LiveEvent {
  id: string;
  type: string;
  timestamp: string;
  game: number;
  team?: number;
  player?: string;
  description: string;
}

/**
 * Representa odds de apuestas
 */
export interface Odds {
  match_id: number;
  bookmaker: string;
  market: string;
  odds_team_1: number;
  odds_team_2: number;
  odds_draw?: number | null;
  updated_at: string;
}

/**
 * Estadísticas generales por tipo
 */
export interface Stats {
  player_id?: number;
  team_id?: number;
  match_id?: number;
  game: string;
  stats: Record<string, number | string>;
}

/**
 * Estadísticas de un juego (categoría general)
 */
export interface GameStats {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  activeTournaments: number;
}

// ============================================================================
// TIPOS DE EQUIPOS Y JUGADORES
// ============================================================================

/**
 * Representa un equipo
 */
export interface Team {
  id: string;
  name: string;
  logo: string;
  game: string;
  ranking: number;
  wins: number;
  losses: number;
  region?: string;
  founded?: string;
}

/**
 * Representa un jugador
 */
export interface Player {
  id: string;
  name: string;
  realName?: string;
  team: string;
  game: string;
  avatar?: string;
  stats: Record<string, number>;
  nationality?: string;
  role?: string;
}

// ============================================================================
// TIPOS DE USUARIO Y AUTENTICACIÓN
// ============================================================================

/**
 * Preferencias del usuario
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

/**
 * Representa un usuario autenticado
 */
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  favoriteTeams: string[];
  favoritePlayers: string[];
  createdAt: string;
  lastLogin: string;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// TIPOS DE NOTIFICACIONES Y UI
// ============================================================================

/**
 * Tipos de notificación disponibles
 */
export type NotificationType = 'match_start' | 'match_end' | 'tournament_start' | 'team_update' | 'prediction_result' | 'success' | 'error' | 'info' | 'warning';

/**
 * Prioridad de notificación
 */
export type NotificationPriority = 'low' | 'medium' | 'high';

/**
 * Representa la estructura de una notificación en la UI.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  priority: NotificationPriority;
}

/**
 * Representa un idioma disponible en la aplicación.
 */
export interface Language {
  code: string;
  label: string;
  flag?: string;
}

// ============================================================================
// TIPOS DE BÚSQUEDA
// ============================================================================

/**
 * Tipos de elementos que se pueden buscar
 */
export type SearchItemType = 'team' | 'player' | 'match' | 'tournament' | 'league' | 'serie';

/**
 * Elemento de resultado de búsqueda
 */
export interface SearchItem {
  id: number;
  name: string;
  type: SearchItemType;
  image_url: string | null;
  league?: string;
  game?: string;
  status?: string;
}

// ============================================================================
// TIPOS DE RENDIMIENTO Y MÉTRICAS
// ============================================================================

/**
 * Métricas de rendimiento web
 */
export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

/**
 * Opciones para el hook de rendimiento
 */
export interface UsePerformanceOptions {
  enableLogging?: boolean;
  enableReporting?: boolean;
  reportEndpoint?: string;
}

// ============================================================================
// TIPOS DE CACHE
// ============================================================================

/**
 * Elemento del cache
 */
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount?: number;
  lastAccess?: number;
}

// ============================================================================
// TIPOS DE API Y RESPUESTAS
// ============================================================================

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: number;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// TIPOS DE EVENTOS Y CALLBACKS
// ============================================================================

/**
 * Callback genérico
 */
export type Callback<T = void> = (data: T) => void;

/**
 * Callback asíncrono
 */
export type AsyncCallback<T = void, R = void> = (data: T) => Promise<R>;

/**
 * Handler de eventos
 */
export type EventHandler<T = Event> = (event: T) => void;

// ============================================================================
// TIPOS UTILITARIOS
// ============================================================================

/**
 * Hace todas las propiedades opcionales
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Hace todas las propiedades requeridas
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Omite propiedades específicas
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Selecciona solo propiedades específicas
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// ============================================================================
// EXPORTACIÓN POR DEFECTO
// ============================================================================

// Los tipos no se pueden exportar como valores en el default export
// Todos los tipos están disponibles como named exports

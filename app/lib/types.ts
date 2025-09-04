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
  radiant_score: number;
  dire_score: number;
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
  match_type: string;
  number_of_games: number;
  games: GameInfo[];
  streams: StreamInfo[];
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
 * Estadísticas de un juego
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
export type SearchItemType = 'team' | 'player' | 'match' | 'tournament';

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

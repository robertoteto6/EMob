// Tipos de datos para la aplicación de eSports

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
 * Representa los detalles completos de un partido de eSports.
 */
export interface MatchDetail {
  id: number;
  name: string;
  radiant: string;
  dire: string;
  radiant_id: number | null;
  dire_id: number | null;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  end_time: number | null;
  league: string;
  serie: string;
  tournament: string;
  match_type: string;
  number_of_games: number;
  radiant_win: boolean | null;
  games: GameInfo[];
  streams: StreamInfo[];
}

/**
 * Representa la estructura de una notificación en la UI.
 */
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Representa las opciones de idioma disponibles en la aplicación.
 */
export interface Language {
  code: string;
  label: string;
}

// Tipos para jugadores de esports

export interface RegionInfo {
  name: string;
  flag: string;
  region: string;
}

export interface TeamData {
  id: number;
  name: string;
  acronym: string;
  image_url: string | null;
  location: string | null;
  current_videogame: any;
  players: any[];
}

export interface RecentMatch {
  id: number;
  name: string;
  begin_at: string;
  winner: { id: number; name: string } | null;
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      image_url: string | null;
    };
  }>;
  league: {
    id: number;
    name: string;
    image_url: string | null;
  };
  tournament: {
    id: number;
    name: string;
  };
}

export interface Achievement {
  id: string;
  type: 'championship' | 'mvp' | 'finals' | 'allstar' | 'record' | 'milestone';
  title: string;
  description: string;
  date: string;
  tournament?: string;
  team?: string;
  icon: string;
  rarity: 'legendary' | 'epic' | 'rare' | 'common';
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'highlight';
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  date?: string;
  source: 'youtube' | 'twitch' | 'instagram' | 'official' | 'other';
  duration?: string;
  views?: number;
}

export interface CareerEvent {
  id: string;
  type: 'team_join' | 'team_leave' | 'achievement' | 'tournament' | 'milestone';
  date: string;
  title: string;
  description?: string;
  team?: {
    id: number;
    name: string;
    image_url?: string;
  };
  icon: string;
}

export interface GameSpecificStats {
  game: string;
  gameName: string;
  gameIcon: string;
  stats: {
    key: string;
    label: string;
    value: string | number;
    description?: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export interface PlayerDetail {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  image_url: string | null;
  current_team: string | null;
  current_team_id: number | null;
  current_team_image: string | null;
  age: number | null;
  birthday: string | null;
  hometown: string | null;
  modified_at: string | null;
  title_score: number;
  recent_matches: RecentMatch[];
  historical_matches: RecentMatch[];
  win_rate: string;
  total_matches: number;
  team_data: TeamData | null;
  professional_status: string;
  region_info: RegionInfo | null;
  is_veteran: boolean;
  instagram_followers: number;
  instagram_handle: string | null;
  // New fields
  achievements: Achievement[];
  media_gallery: MediaItem[];
  career_timeline: CareerEvent[];
  game_stats: GameSpecificStats[];
  signature_heroes?: string[];
  peak_rating?: number;
  total_earnings?: number;
  years_active?: number;
}

export interface VeteranAnalysis {
  career_highlights: Array<{
    match_name: string;
    tournament: string;
    date: string;
    importance: string;
  }>;
  playing_style: string;
  legacy_impact: string;
  achievements_summary: string;
  ai_insights: string[];
}

// Rank thresholds and configuration
export const PLAYER_RANKS = {
  LEGEND: { min: 150, name: 'Leyenda', icon: '👑', gradient: 'from-yellow-400 via-orange-500 to-red-500', bgGradient: 'from-yellow-900/20 via-orange-900/20 to-red-900/20' },
  VETERAN: { min: 100, name: 'Veterano', icon: '⭐', gradient: 'from-purple-400 via-pink-500 to-purple-600', bgGradient: 'from-purple-900/20 via-pink-900/20 to-purple-900/20' },
  PROFESSIONAL: { min: 70, name: 'Profesional', icon: '🏆', gradient: 'from-blue-400 via-cyan-500 to-blue-600', bgGradient: 'from-blue-900/20 via-cyan-900/20 to-blue-900/20' },
  EMERGING: { min: 40, name: 'Emergente', icon: '🎯', gradient: 'from-green-400 via-emerald-500 to-green-600', bgGradient: 'from-green-900/20 via-emerald-900/20 to-green-900/20' },
  ROOKIE: { min: 0, name: 'Novato', icon: '⚡', gradient: 'from-gray-400 via-gray-500 to-gray-600', bgGradient: 'from-gray-900/20 via-gray-800/20 to-gray-900/20' }
} as const;

export function getPlayerRank(score: number) {
  if (score >= PLAYER_RANKS.LEGEND.min) return PLAYER_RANKS.LEGEND;
  if (score >= PLAYER_RANKS.VETERAN.min) return PLAYER_RANKS.VETERAN;
  if (score >= PLAYER_RANKS.PROFESSIONAL.min) return PLAYER_RANKS.PROFESSIONAL;
  if (score >= PLAYER_RANKS.EMERGING.min) return PLAYER_RANKS.EMERGING;
  return PLAYER_RANKS.ROOKIE;
}

export function getAchievementRarityColor(rarity: Achievement['rarity']) {
  switch (rarity) {
    case 'legendary': return { bg: 'from-yellow-900/40 to-orange-900/40', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' };
    case 'epic': return { bg: 'from-purple-900/40 to-pink-900/40', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/20' };
    case 'rare': return { bg: 'from-blue-900/40 to-cyan-900/40', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' };
    default: return { bg: 'from-gray-800/40 to-gray-900/40', border: 'border-gray-600/50', text: 'text-gray-400', glow: 'shadow-gray-500/20' };
  }
}

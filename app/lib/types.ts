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

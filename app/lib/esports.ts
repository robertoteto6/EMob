import { type Match, type Tournament, type League, type Serie, type LiveMatch, type Odds, type Stats, type Game, type Bracket } from "./types";

export interface PandaScoreMatch {
    id: number;
    begin_at: string | null;
    scheduled_at: string | null;
    opponents?: Array<{
        opponent: {
            id: number;
            name: string;
        };
    }>;
    results?: Array<{
        score: number;
    }>;
    league?: {
        name: string;
    };
    winner?: {
        id: number;
    };
    status: string;
}

import { SUPPORTED_GAMES } from "./gameConfig";

const GAMES = SUPPORTED_GAMES;

// Función para obtener partidos de múltiples juegos
export async function fetchAllMatches(selectedGameIds: string[] = []): Promise<Match[]> {
    const allMatches: Match[] = [];

    // Si no hay juegos seleccionados, retornar array vacío
    if (selectedGameIds.length === 0) {
        return [];
    }

    // Filtrar solo los juegos seleccionados
    const gamesToFetch = GAMES.filter(game => selectedGameIds.includes(game.id));

    // Usar consultas en lote para mejor rendimiento
    const batchConfigs = gamesToFetch.map(game => ({
        endpoint: `/api/esports/matches`,
        params: { game: game.id, per_page: 30 },
        cacheTTL: 2 * 60 * 1000, // 2 minutos
        priority: 'high' as const,
    }));

    try {
        const { batchQuery } = await import('./queryOptimizer');
        const results = await batchQuery(batchConfigs);

        for (let i = 0; i < gamesToFetch.length; i++) {
            const game = gamesToFetch[i];
            const result = results[i];

            if (!result || result.error) {
                console.warn(`Failed to fetch matches for ${game.id}:`, result.error);
                continue;
            }

            const data = result.data;

            // Validar que data es un array
            if (!Array.isArray(data)) {
                console.warn(`Invalid data format for ${game.id}:`, data);
                continue;
            }

            const gameMatches = data
                .map((m: PandaScoreMatch) => {
                    // Validar datos requeridos
                    if (!m || typeof m.id !== 'number') {
                        return null;
                    }

                    const team1 = m.opponents?.[0]?.opponent;
                    const team2 = m.opponents?.[1]?.opponent;
                    const dateStr = m.begin_at ?? m.scheduled_at;
                    const date = dateStr ? new Date(dateStr) : null;
                    const start_time = date && !isNaN(date.getTime()) ? date.getTime() / 1000 : null;

                    // Validar que tenemos un tiempo válido
                    if (start_time === null) {
                        return null;
                    }

                    const radiantRaw = Array.isArray(m.results) && m.results[0]?.score != null ? Number(m.results[0].score) : null;
                    const direRaw = Array.isArray(m.results) && m.results[1]?.score != null ? Number(m.results[1].score) : null;
                    const radiant_score = radiantRaw !== null && Number.isNaN(radiantRaw) ? null : radiantRaw;
                    const dire_score = direRaw !== null && Number.isNaN(direRaw) ? null : direRaw;

                    return {
                        id: m.id,
                        radiant: team1?.name ?? "TBD",
                        dire: team2?.name ?? "TBD",
                        radiant_score,
                        dire_score,
                        start_time,
                        league: m.league?.name ?? "",
                        radiant_win: m.winner?.id !== undefined && team1?.id !== undefined ? m.winner.id === team1.id : null,
                        game: game.id,
                    } as Match;
                })
                .filter((m: Match | null): m is Match => m !== null);

            allMatches.push(...gameMatches);
        }
    } catch (error) {
        console.error('Error fetching matches:', error);
    }

    // Sort once before returning to avoid allocating a new array unnecessarily
    allMatches.sort((a, b) => a.start_time - b.start_time);
    return allMatches;
}

// Función para obtener torneos de múltiples juegos
export async function fetchAllTournaments(selectedGameIds: string[] = []): Promise<Tournament[]> {
    const allTournaments: Tournament[] = [];

    // Si no hay juegos seleccionados, retornar array vacío
    if (selectedGameIds.length === 0) {
        return [];
    }

    // Filtrar solo los juegos seleccionados
    const gamesToFetch = GAMES.filter(game => selectedGameIds.includes(game.id));

    // Usar consultas en lote optimizadas
    const batchConfigs = gamesToFetch.map(game => ({
        endpoint: `/api/esports/tournaments`,
        params: { game: game.id, per_page: 20 },
        cacheTTL: 5 * 60 * 1000, // 5 minutos (los torneos cambian menos frecuentemente)
        priority: 'medium' as const,
    }));

    try {
        const { batchQuery } = await import('./queryOptimizer');
        const results = await batchQuery(batchConfigs);

        for (let i = 0; i < gamesToFetch.length; i++) {
            const game = gamesToFetch[i];
            const result = results[i];

            if (!result || result.error) {
                console.warn(`Failed to fetch tournaments for ${game.id}:`, result.error);
                continue;
            }

            const data = result.data;

            // Validar que data es un array
            if (!Array.isArray(data)) {
                console.warn(`Invalid tournament data format for ${game.id}:`, data);
                continue;
            }

            const gameTournaments = data
                .map((t: any) => {
                    // Validar datos requeridos
                    if (!t || typeof t.id !== 'number') {
                        return null;
                    }

                    const beginAt = t.begin_at ? new Date(t.begin_at) : null;
                    const endAt = t.end_at ? new Date(t.end_at) : null;

                    return {
                        id: t.id,
                        name: t.name ?? "",
                        begin_at: beginAt && !isNaN(beginAt.getTime()) ? beginAt.getTime() / 1000 : null,
                        end_at: endAt && !isNaN(endAt.getTime()) ? endAt.getTime() / 1000 : null,
                        league: t.league?.name ?? "",
                        serie: t.serie?.full_name ?? "",
                        prizepool: t.prizepool ?? null,
                        tier: t.tier ?? null,
                        region: t.region ?? null,
                        live_supported: !!t.live_supported,
                        game: game.id,
                    } as Tournament;
                })
                .filter((t: Tournament | null): t is Tournament => t !== null);

            allTournaments.push(...gameTournaments);
        }
    } catch (error) {
        console.error('Error fetching tournaments:', error);
    }

    return allTournaments;
}

// ============================================================================
// NUEVAS FUNCIONES PARA EXPANSIÓN DE PANDASCORE API
// ============================================================================

// Función para obtener ligas de múltiples juegos
export async function fetchAllLeagues(selectedGameIds: string[] = []): Promise<League[]> {
    const allLeagues: League[] = [];

    if (selectedGameIds.length === 0) {
        return [];
    }

    const gamesToFetch = GAMES.filter(game => selectedGameIds.includes(game.id));

    const batchConfigs = gamesToFetch.map(game => ({
        endpoint: `/api/esports/leagues`,
        params: { game: game.id, per_page: 50 },
        cacheTTL: 10 * 60 * 1000,
        priority: 'medium' as const,
    }));

    try {
        const { batchQuery } = await import('./queryOptimizer');
        const results = await batchQuery(batchConfigs);

        for (let i = 0; i < gamesToFetch.length; i++) {
            const game = gamesToFetch[i];
            const result = results[i];

            if (!result || result.error) {
                console.warn(`Failed to fetch leagues for ${game.id}:`, result.error);
                continue;
            }

            const data = result.data;

            if (!Array.isArray(data)) {
                console.warn(`Invalid league data format for ${game.id}:`, data);
                continue;
            }

            const gameLeagues = data
                .map((l: any) => {
                    if (!l || typeof l.id !== 'number') {
                        return null;
                    }

                    return {
                        id: l.id,
                        name: l.name ?? "",
                        url: l.url ?? null,
                        image_url: l.image_url ?? null,
                        modified_at: l.modified_at ?? null,
                        series: l.series ?? [],
                        game: game.id,
                    } as League;
                })
                .filter((l: League | null): l is League => l !== null);

            allLeagues.push(...gameLeagues);
        }
    } catch (error) {
        console.error('Error fetching leagues:', error);
    }

    return allLeagues;
}

// Función para obtener series de múltiples juegos
export async function fetchAllSeries(selectedGameIds: string[] = [], filters?: { year?: string; season?: string }): Promise<Serie[]> {
    const allSeries: Serie[] = [];

    if (selectedGameIds.length === 0) {
        return [];
    }

    const gamesToFetch = GAMES.filter(game => selectedGameIds.includes(game.id));

    const batchConfigs = gamesToFetch.map(game => ({
        endpoint: `/api/esports/series`,
        params: { 
            game: game.id, 
            per_page: 50,
            ...(filters?.year && { year: filters.year }),
            ...(filters?.season && { season: filters.season }),
        },
        cacheTTL: 10 * 60 * 1000,
        priority: 'medium' as const,
    }));

    try {
        const { batchQuery } = await import('./queryOptimizer');
        const results = await batchQuery(batchConfigs);

        for (let i = 0; i < gamesToFetch.length; i++) {
            const game = gamesToFetch[i];
            const result = results[i];

            if (!result || result.error) {
                console.warn(`Failed to fetch series for ${game.id}:`, result.error);
                continue;
            }

            const data = result.data;

            if (!Array.isArray(data)) {
                console.warn(`Invalid series data format for ${game.id}:`, data);
                continue;
            }

            const gameSeries = data
                .map((s: any) => {
                    if (!s || typeof s.id !== 'number') {
                        return null;
                    }

                    return {
                        id: s.id,
                        name: s.name ?? "",
                        full_name: s.full_name ?? "",
                        season: s.season ?? null,
                        year: s.year ?? null,
                        begin_at: s.begin_at ?? null,
                        end_at: s.end_at ?? null,
                        tier: s.tier ?? null,
                        winner_id: s.winner_id ?? null,
                        winner_type: s.winner_type ?? null,
                        league: s.league ?? null,
                        tournaments: s.tournaments ?? [],
                        game: game.id,
                    } as Serie;
                })
                .filter((s: Serie | null): s is Serie => s !== null);

            allSeries.push(...gameSeries);
        }
    } catch (error) {
        console.error('Error fetching series:', error);
    }

    return allSeries;
}

// Función para obtener partidos en vivo
export async function fetchLiveMatches(gameIds?: string[]): Promise<LiveMatch[]> {
    try {
        const { batchQuery } = await import('./queryOptimizer');
        
        const configs = [{
            endpoint: `/api/esports/lives`,
            params: gameIds ? { games: gameIds.join(',') } : {},
            cacheTTL: 30 * 1000, // 30 segundos para datos en vivo
            priority: 'critical' as const,
        }];

        const results = await batchQuery<LiveMatch[]>(configs);
        return results[0]?.data || [];
    } catch (error) {
        console.error('Error fetching live matches:', error);
        return [];
    }
}

// Función para obtener odds de partidos
export async function fetchOdds(params?: { match_id?: string; gameIds?: string[] }): Promise<Odds[]> {
    try {
        const queryParams: Record<string, string> = {};
        
        if (params?.match_id) {
            queryParams.match_id = params.match_id;
        }
        if (params?.gameIds) {
            queryParams.games = params.gameIds.join(',');
        }

        const { batchQuery } = await import('./queryOptimizer');
        
        const configs = [{
            endpoint: `/api/esports/odds`,
            params: queryParams,
            cacheTTL: 60 * 1000, // 1 minuto para odds
            priority: 'high' as const,
        }];

        const results = await batchQuery<Odds[]>(configs);
        return results[0]?.data || [];
    } catch (error) {
        console.error('Error fetching odds:', error);
        return [];
    }
}

// Función para obtener estadísticas
export async function fetchStats(type: 'players' | 'teams' | 'matches', id: number, gameId?: string): Promise<Stats | null> {
    try {
        const { batchQuery } = await import('./queryOptimizer');
        
        const configs = [{
            endpoint: `/api/esports/stats`,
            params: { type: type.slice(0, -1), id: String(id), ...(gameId && { game: gameId }) },
            cacheTTL: 30 * 60 * 1000, // 30 minutos para stats
            priority: 'medium' as const,
        }];

        const results = await batchQuery<Stats>(configs);
        return results[0]?.data || null;
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

// Función para obtener games de un partido
export async function fetchMatchGames(matchId: number): Promise<Game[]> {
    try {
        const { batchQuery } = await import('./queryOptimizer');
        
        const configs = [{
            endpoint: `/api/esports/games`,
            params: { match_id: String(matchId) },
            cacheTTL: 5 * 60 * 1000,
            priority: 'high' as const,
        }];

        const results = await batchQuery<Game[]>(configs);
        return results[0]?.data || [];
    } catch (error) {
        console.error('Error fetching match games:', error);
        return [];
    }
}

// Función para obtener brackets de un torneo
export async function fetchTournamentBrackets(tournamentId: number): Promise<{ brackets: Bracket[]; standings: any[] } | null> {
    try {
        const { batchQuery } = await import('./queryOptimizer');
        
        const configs = [{
            endpoint: `/api/esports/brackets`,
            params: { tournament_id: String(tournamentId) },
            cacheTTL: 10 * 60 * 1000,
            priority: 'medium' as const,
        }];

        const results = await batchQuery<{ brackets: Bracket[]; standings: any[] }>(configs);
        return results[0]?.data || null;
    } catch (error) {
        console.error('Error fetching tournament brackets:', error);
        return null;
    }
}

// Función de utilidad para precargar datos críticos ampliados
export async function preloadExtendedData() {
    const { preloadCriticalQueries } = await import('./queryOptimizer');
    
    // Precargar datos críticos existentes
    await preloadCriticalQueries();
    
    // Precargar datos expandidos
    const extendedQueries = [
        { endpoint: '/api/esports/leagues', params: { per_page: '20' }, priority: 'medium' as const },
        { endpoint: '/api/esports/series', params: { per_page: '20' }, priority: 'medium' as const },
        { endpoint: '/api/esports/lives', params: {}, priority: 'critical' as const },
    ];
    
    try {
        const { batchQuery } = await import('./queryOptimizer');
        await batchQuery(extendedQueries.map(q => ({
            ...q,
            cacheTTL: q.priority === 'critical' ? 30 * 1000 : 5 * 60 * 1000,
        })));
    } catch (error) {
        console.warn('Failed to preload extended data:', error);
    }
}


import { type Match, type Tournament } from "./types";

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

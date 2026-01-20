"use client";

import { memo, useMemo } from 'react';
import { GameInfo } from '../lib/types';

interface MatchGamesProps {
    games: GameInfo[];
    radiantName: string;
    direName: string;
    radiantId?: number | null;
    direId?: number | null;
}

const MatchGames = ({ games, radiantName, direName, radiantId, direId }: MatchGamesProps) => {
    // Calcular estadísticas de los juegos
    const gameStats = useMemo(() => {
        if (!games || games.length === 0) return null;
        
        const finishedGames = games.filter(g => g.status === 'finished');
        const radiantWins = finishedGames.filter(g => g.winner_id === radiantId).length;
        const direWins = finishedGames.filter(g => g.winner_id === direId).length;
        const liveGames = games.filter(g => g.status === 'running');
        
        return {
            total: games.length,
            finished: finishedGames.length,
            live: liveGames.length,
            radiantWins,
            direWins
        };
    }, [games, radiantId, direId]);

    if (!games || games.length === 0) {
        return (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-[var(--accent,#00FF80)] rounded-full"></span>
                    Desglose de Mapas
                </h3>
                <div className="p-6 rounded-xl bg-gray-800/40 border border-gray-700/50 text-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-600 mb-3">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    <p className="text-gray-500 text-sm">Información de mapas no disponible</p>
                    <p className="text-gray-600 text-xs mt-1">Los datos estarán disponibles cuando comience el partido</p>
                </div>
            </div>
        );
    }

    // Sort games by position just in case
    const sortedGames = [...games].sort((a, b) => a.position - b.position);

    // Función para determinar el ganador de un juego
    const getWinnerName = (winnerId: number | null): string | null => {
        if (winnerId === null) return null;
        if (winnerId === radiantId) return radiantName;
        if (winnerId === direId) return direName;
        return null;
    };

    return (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-[var(--accent,#00FF80)] rounded-full"></span>
                    Desglose de Mapas
                </h3>
                {gameStats && gameStats.finished > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                        <span className="px-3 py-1 rounded-lg bg-gray-800/60 border border-gray-700">
                            <span className="text-gray-400">{radiantName}: </span>
                            <span className="font-bold text-white">{gameStats.radiantWins}</span>
                        </span>
                        <span className="text-gray-600">-</span>
                        <span className="px-3 py-1 rounded-lg bg-gray-800/60 border border-gray-700">
                            <span className="text-gray-400">{direName}: </span>
                            <span className="font-bold text-white">{gameStats.direWins}</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {sortedGames.map((game) => {
                    const duration = game.end_at && game.begin_at
                        ? Math.floor((new Date(game.end_at).getTime() - new Date(game.begin_at).getTime()) / 1000 / 60)
                        : null;

                    const winnerName = getWinnerName(game.winner_id);
                    const isFinished = game.status === 'finished';
                    const isLive = game.status === 'running';

                    return (
                        <div
                            key={game.id}
                            className={`relative overflow-hidden bg-gray-800/40 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 hover:bg-gray-800/60 ${
                                isLive ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700/50 hover:border-gray-600'
                            }`}
                            role="listitem"
                            aria-label={`Mapa ${game.position}: ${game.status === 'finished' ? 'Finalizado' : game.status === 'running' ? 'En vivo' : 'Programado'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border font-bold ${
                                    isLive ? 'bg-red-900/30 border-red-500/50 text-red-400' : 'bg-gray-900/50 border-gray-700 text-gray-400'
                                }`}>
                                    <span className="text-xs uppercase text-gray-500">Map</span>
                                    <span className="text-lg text-gray-200">{game.position}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className={`text-sm font-semibold ${
                                        isLive ? 'text-red-300' : isFinished ? 'text-green-400' : 'text-gray-300'
                                    }`}>
                                        {isFinished ? 'Finalizado' : isLive ? 'En Vivo' : 'Programado'}
                                    </span>
                                    {duration !== null && duration > 0 && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {duration} min
                                        </span>
                                    )}
                                    {winnerName && (
                                        <span className="text-xs text-[var(--accent,#00FF80)] font-semibold flex items-center gap-1 mt-0.5">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            {winnerName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isLive && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-900/50 animate-pulse">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider">LIVE</span>
                                    </div>
                                )}
                                {isFinished && (
                                    <div className="px-3 py-1 rounded-full bg-green-900/20 text-green-400 border border-green-900/30">
                                        <span className="text-xs font-medium">Completado</span>
                                    </div>
                                )}
                                {game.status === 'not_started' && (
                                    <div className="px-3 py-1 rounded-full bg-gray-700/30 text-gray-400 border border-gray-700/50">
                                        <span className="text-xs font-medium">Pendiente</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(MatchGames);

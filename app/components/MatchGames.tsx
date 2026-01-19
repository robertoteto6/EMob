"use client";

import { memo } from 'react';
import { GameInfo } from '../lib/types';

interface MatchGamesProps {
    games: GameInfo[];
    radiantName: string;
    direName: string;
}

const MatchGames = ({ games, radiantName: _radiantName, direName: _direName }: MatchGamesProps) => {
    if (!games || games.length === 0) return null;

    // Sort games by position just in case
    const sortedGames = [...games].sort((a, b) => a.position - b.position);

    return (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[var(--accent,#00FF80)] rounded-full"></span>
                Desglose de Mapas
            </h3>

            <div className="space-y-3">
                {sortedGames.map((game, _index) => {
                    const duration = game.end_at && game.begin_at
                        ? Math.floor((new Date(game.end_at).getTime() - new Date(game.begin_at).getTime()) / 1000 / 60)
                        : null;

                    const _isWinnerDefined = game.winner_id !== null;
                    // Assuming we don't have easy access to team IDs here to map winner_id to name without passing more props.
                    // But for now, let's just show the status and duration.

                    return (
                        <div
                            key={game.id}
                            className="relative overflow-hidden bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:bg-gray-800/60 hover:border-gray-600"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-gray-900/50 border border-gray-700 text-gray-400 font-bold">
                                    <span className="text-xs uppercase text-gray-500">Map</span>
                                    <span className="text-lg text-gray-200">{game.position}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-300">
                                        {game.status === 'finished' ? 'Finalizado' : game.status === 'running' ? 'En Vivo' : 'Programado'}
                                    </span>
                                    {duration && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {duration} min
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {game.status === 'running' && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-900/50 animate-pulse">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider">LIVE</span>
                                    </div>
                                )}
                                {game.status === 'finished' && (
                                    <div className="px-3 py-1 rounded-full bg-gray-700/30 text-gray-400 border border-gray-700/50">
                                        <span className="text-xs font-medium">Completado</span>
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

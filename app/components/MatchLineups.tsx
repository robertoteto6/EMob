"use client";

import { memo } from 'react';
import { Player } from '../lib/types';
import Link from 'next/link';

interface MatchLineupsProps {
    radiantName: string;
    direName: string;
    radiantPlayers?: Player[];
    direPlayers?: Player[];
}

const MatchLineups = ({ radiantName, direName, radiantPlayers, direPlayers }: MatchLineupsProps) => {
    if ((!radiantPlayers || radiantPlayers.length === 0) && (!direPlayers || direPlayers.length === 0)) {
        return null;
    }

    const renderTeamLineup = (teamName: string, players?: Player[]) => (
        <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800/30 rounded-lg border-l-4 border-[var(--accent,#00FF80)]">
                <h4 className="font-bold text-lg text-gray-100 truncate">{teamName}</h4>
                <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded uppercase tracking-wider">Lineup</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {players?.map((player) => (
                    <div key={player.id} className="group relative flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden flex-shrink-0 border border-gray-700 group-hover:border-[var(--accent,#00FF80)] transition-colors">
                            {player.avatar ? (
                                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 font-bold text-xs">
                                    {player.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-200 truncate group-hover:text-[var(--accent,#00FF80)] transition-colors">{player.name}</span>
                            {player.realName && <span className="text-xs text-gray-500 truncate">{player.realName}</span>}
                            {player.role && <span className="text-[10px] uppercase tracking-wider text-gray-600 mt-0.5">{player.role}</span>}
                        </div>

                        {/* Hover effect decorative */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                ))}
                {(!players || players.length === 0) && (
                    <div className="p-4 text-center text-gray-500 italic text-sm">
                        No hay información de jugadores disponible.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                Alineaciones
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
                {renderTeamLineup(radiantName, radiantPlayers)}
                {renderTeamLineup(direName, direPlayers)}
            </div>
        </div>
    );
};

export default memo(MatchLineups);

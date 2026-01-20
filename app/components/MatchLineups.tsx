"use client";

import { memo } from 'react';
import Link from 'next/link';
import { Player } from '../lib/types';

interface MatchLineupsProps {
    radiantName: string;
    direName: string;
    radiantPlayers?: Player[];
    direPlayers?: Player[];
    radiantId?: number | null;
    direId?: number | null;
}

const MatchLineups = ({ radiantName, direName, radiantPlayers, direPlayers, radiantId, direId }: MatchLineupsProps) => {
    // Verificar si hay datos de jugadores disponibles
    const hasRadiantPlayers = radiantPlayers && radiantPlayers.length > 0;
    const hasDirePlayers = direPlayers && direPlayers.length > 0;

    if (!hasRadiantPlayers && !hasDirePlayers) {
        return (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Alineaciones
                </h3>
                <div className="p-8 rounded-xl bg-gray-800/40 border border-gray-700/50 text-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-600 mb-3">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <p className="text-gray-500 text-sm">Alineaciones no disponibles</p>
                    <p className="text-gray-600 text-xs mt-1">La información de jugadores se actualizará cuando esté disponible</p>
                </div>
            </div>
        );
    }

    const renderTeamLineup = (teamName: string, teamId: number | null | undefined, players?: Player[]) => {
        const hasValidTeamId = teamId !== null && teamId !== undefined;
        
        return (
            <div className="flex-1 min-w-[300px]">
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800/30 rounded-lg border-l-4 border-[var(--accent,#00FF80)]">
                    {hasValidTeamId ? (
                        <Link 
                            href={`/esports/team/${teamId}`}
                            className="font-bold text-lg text-gray-100 truncate hover:text-[var(--accent,#00FF80)] transition-colors"
                        >
                            {teamName}
                        </Link>
                    ) : (
                        <h4 className="font-bold text-lg text-gray-100 truncate">{teamName}</h4>
                    )}
                    <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded uppercase tracking-wider">
                        {players?.length || 0} jugadores
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-2" role="list" aria-label={`Jugadores de ${teamName}`}>
                    {players?.map((player) => (
                        <Link 
                            key={player.id} 
                            href={`/esports/player/${player.id}`}
                            className="group relative flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300"
                            role="listitem"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden flex-shrink-0 border border-gray-700 group-hover:border-[var(--accent,#00FF80)] transition-colors">
                                {player.avatar ? (
                                    <img 
                                        src={player.avatar} 
                                        alt={`Avatar de ${player.name}`} 
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            // Fallback si la imagen no carga
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 font-bold text-xs ${player.avatar ? 'hidden' : ''}`}>
                                    {player.name.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-bold text-gray-200 truncate group-hover:text-[var(--accent,#00FF80)] transition-colors">
                                    {player.name}
                                </span>
                                {player.realName && (
                                    <span className="text-xs text-gray-500 truncate">{player.realName}</span>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                    {player.role && (
                                        <span className="text-[10px] uppercase tracking-wider text-gray-600 px-1.5 py-0.5 bg-gray-800 rounded">
                                            {player.role}
                                        </span>
                                    )}
                                    {player.nationality && (
                                        <span className="text-[10px] text-gray-500">
                                            {player.nationality}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Flecha de navegación */}
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                className="text-gray-600 group-hover:text-[var(--accent,#00FF80)] transition-colors flex-shrink-0"
                            >
                                <path d="M9 18l6-6-6-6"/>
                            </svg>

                            {/* Hover effect decorative */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </Link>
                    ))}
                    {(!players || players.length === 0) && (
                        <div className="p-4 text-center text-gray-500 italic text-sm bg-gray-800/20 rounded-lg border border-dashed border-gray-700">
                            No hay información de jugadores disponible
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                Alineaciones
                <span className="text-sm font-normal text-gray-500 ml-2">
                    ({(radiantPlayers?.length || 0) + (direPlayers?.length || 0)} jugadores)
                </span>
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
                {renderTeamLineup(radiantName, radiantId, radiantPlayers)}
                {renderTeamLineup(direName, direId, direPlayers)}
            </div>
        </div>
    );
};

export default memo(MatchLineups);

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import Tooltip from "./Tooltip";
import { type GameConfig } from "../lib/gameConfig";
import { type GameStats } from "../lib/types";
import { formatRelativeTime } from "../lib/utils";

// Componente de estadísticas del juego (memoizado) - Diseño Minimalista
const GameStatsCard = memo(function GameStatsCard({ game, stats, lastUpdated }: { game: GameConfig, stats: GameStats, lastUpdated?: Date }) {
    return (
        <Link href={`/esports/game/${game.id}`} className="group block h-full">
            <div className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-black/80 p-1 transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
                {/* Marco */}
                <div className="relative h-full overflow-hidden rounded-lg bg-black/60 backdrop-blur-sm">
                    {/* Patrón de fondo sutil */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                            backgroundSize: '24px 24px'
                        }} />
                    </div>

                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" aria-hidden="true" />

                    {/* Icono flotante decorativo */}
                    <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity duration-500" aria-hidden="true">
                        <Image src={game.icon} alt="" width={64} height={64} className="w-14 h-14 group-hover:scale-110 transition-transform duration-500" priority />
                    </div>

                    {/* Badge "Explorar" en hover */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
                        <div className="bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 text-white/70">
                            <span>👆</span>
                            <span>Explorar</span>
                        </div>
                    </div>

                    <div className="relative z-10 p-5 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-white/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                                <Image src={game.icon} alt={`Icono de ${game.name}`} width={36} height={36} className="relative w-9 h-9 group-hover:scale-110 transition-transform duration-300" priority />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white group-hover:text-white transition-colors duration-300 leading-tight">
                                    {game.name}
                                </h3>
                                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Live Stats</p>
                            </div>
                        </div>

                        {/* Estadísticas en grid 2x2 */}
                        <div className="grid grid-cols-2 gap-2.5 flex-1">
                            <Tooltip content={`Total de partidas registradas para ${game.name}`} className="block">
                                <div className="bg-white/5 rounded-lg p-3 group-hover:bg-white/10 transition-colors duration-300 border border-white/5 group-hover:border-white/10">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">Total</p>
                                    </div>
                                    <p className="text-2xl font-black text-white tabular-nums">
                                        {stats.totalMatches}
                                    </p>
                                </div>
                            </Tooltip>

                            <Tooltip content={`Partidas en curso de ${game.name}`} className="block">
                                <div className="bg-white/5 rounded-lg p-3 group-hover:bg-white/10 transition-colors duration-300 border border-white/10">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">En Vivo</p>
                                    </div>
                                    <p className="text-2xl font-black text-white tabular-nums">
                                        {stats.liveMatches}
                                    </p>
                                </div>
                            </Tooltip>

                            <Tooltip content={`Partidas programadas de ${game.name}`} className="block">
                                <div className="bg-white/5 rounded-lg p-3 group-hover:bg-white/10 transition-colors duration-300 border border-white/5 group-hover:border-white/10">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">Próximos</p>
                                    </div>
                                    <p className="text-2xl font-black text-white tabular-nums">
                                        {stats.upcomingMatches}
                                    </p>
                                </div>
                            </Tooltip>

                            <Tooltip content={`Torneos activos de ${game.name}`} className="block">
                                <div className="bg-white/5 rounded-lg p-3 group-hover:bg-white/10 transition-colors duration-300 border border-white/5 group-hover:border-white/10">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">Torneos</p>
                                    </div>
                                    <p className="text-2xl font-black text-white tabular-nums">
                                        {stats.activeTournaments}
                                    </p>
                                </div>
                            </Tooltip>
                        </div>

                        {/* Footer con indicador de actualización */}
                        {lastUpdated && (
                            <div className="mt-4 pt-3 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">Actualizado</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-semibold text-white/60">
                                            {formatRelativeTime(lastUpdated)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
});

export default GameStatsCard;

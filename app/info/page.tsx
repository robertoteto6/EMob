"use client";

import { useEffect, useState, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import Tooltip from "../components/Tooltip";
import Spinner from "../components/Spinner";
import LiveBadge from "../components/LiveBadge";
import SummaryStatCard from "../components/SummaryStatCard";
import GameStatsCard from "../components/GameStatsCard";
import { SUPPORTED_GAMES } from "../lib/gameConfig";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { useGameContext } from "../contexts/GameContext";
import { fetchAllMatches, fetchAllTournaments } from "../lib/esports";
import { type Match, type Tournament, type GeneralGameStats as GameStats } from "../lib/types";

const GAMES = SUPPORTED_GAMES;

export default function InfoPage() {
    const { selectedGames, hasAnyGame, getSelectedGamesConfig } = useGameContext();
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);

    const { currentTime } = useCurrentTime();

    useEffect(() => {
        async function loadData() {
            if (!hasAnyGame) {
                setMatches([]);
                setTournaments([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [matchesData, tournamentsData] = await Promise.all([
                    fetchAllMatches(selectedGames),
                    fetchAllTournaments(selectedGames)
                ]);
                setMatches(matchesData);
                setTournaments(tournamentsData);
                setLastUpdated(new Date());
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [selectedGames, hasAnyGame]);

    const matchesByGame = useMemo(() => {
        const grouped: Record<string, Match[]> = {};
        for (const match of matches) {
            (grouped[match.game] ||= []).push(match);
        }
        return grouped;
    }, [matches]);

    const tournamentsByGame = useMemo(() => {
        const grouped: Record<string, Tournament[]> = {};
        for (const tournament of tournaments) {
            (grouped[tournament.game] ||= []).push(tournament);
        }
        return grouped;
    }, [tournaments]);

    // Estadísticas por juego
    const gameStats = useMemo(() => {
        const stats: Record<string, GameStats> = {};

        GAMES.forEach((game) => {
            const gameMatches = matchesByGame[game.id] ?? [];
            const gameTournaments = tournamentsByGame[game.id] ?? [];
            let liveMatches = 0;
            let upcomingMatches = 0;
            let completedMatches = 0;

            for (const match of gameMatches) {
                if (match.start_time <= currentTime && match.radiant_win === null) {
                    liveMatches += 1;
                } else if (match.start_time > currentTime) {
                    upcomingMatches += 1;
                } else if (match.radiant_win !== null) {
                    completedMatches += 1;
                }
            }

            stats[game.id] = {
                totalMatches: gameMatches.length,
                liveMatches,
                upcomingMatches,
                completedMatches,
                activeTournaments: gameTournaments.length,
            };
        });

        return stats;
    }, [currentTime, matchesByGame, tournamentsByGame]);

    const aggregatedStats = useMemo(() => {
        return Object.values(gameStats).reduce(
            (acc, stats) => {
                if (!stats) {
                    return acc;
                }

                acc.totalMatches += stats.totalMatches;
                acc.liveMatches += stats.liveMatches;
                acc.upcomingMatches += stats.upcomingMatches;
                acc.completedMatches += stats.completedMatches;
                acc.tournaments += stats.activeTournaments;
                return acc;
            },
            { totalMatches: 0, liveMatches: 0, upcomingMatches: 0, completedMatches: 0, tournaments: 0 }
        );
    }, [gameStats]);

    const heroHighlights = [
        {
            label: "Partidos activos",
            value: aggregatedStats.liveMatches,
            helper: "actualizados al minuto",
        },
        {
            label: "Programados",
            value: aggregatedStats.upcomingMatches,
            helper: "para los próximos 7 días",
        },
        {
            label: "Torneos activos",
            value: aggregatedStats.tournaments,
            helper: "de las ligas top",
        },
    ];

    const summaryStats = [
        {
            label: "En curso",
            value: new Intl.NumberFormat("es-ES").format(Math.max(aggregatedStats.liveMatches, 0)),
            helper: "partidos activos ahora",
            accent: "Live",
        },
        {
            label: "Próximos",
            value: new Intl.NumberFormat("es-ES").format(Math.max(aggregatedStats.upcomingMatches, 0)),
            helper: "todos los próximos partidos",
            accent: "Agenda",
        },
        {
            label: "Recientes",
            value: new Intl.NumberFormat("es-ES").format(Math.max(aggregatedStats.completedMatches, 0)),
            helper: "resultados cerrados",
            accent: "Finalizados",
        },
    ];

    const selectedGameConfigs = getSelectedGamesConfig();
    const numberFormatter = new Intl.NumberFormat("es-ES");

    // Hero Featured Match logic
    const featuredMatches = useMemo(() => {
        // Basic logic to pick a match
        const live = matches.filter(m => m.start_time <= currentTime && m.radiant_win === null);
        if (live.length > 0) return live;
        return matches.filter(m => m.start_time > currentTime).slice(0, 3);
    }, [matches, currentTime]);

    const heroFeaturedMatch = featuredMatches[0];
    const heroMatchIsLive = heroFeaturedMatch ? heroFeaturedMatch.start_time <= currentTime && heroFeaturedMatch.radiant_win === null : false;
    const heroMatchIsUpcoming = heroFeaturedMatch ? heroFeaturedMatch.start_time > currentTime : false;
    const heroMatchIsFinished = heroFeaturedMatch ? heroFeaturedMatch.radiant_win !== null : false;
    const heroMatchDate = heroFeaturedMatch ? new Date(heroFeaturedMatch.start_time * 1000) : null;
    const heroRadiantWinner = heroMatchIsFinished && heroFeaturedMatch ? heroFeaturedMatch.radiant_win === true : false;
    const heroDireWinner = heroMatchIsFinished && heroFeaturedMatch ? heroFeaturedMatch.radiant_win === false : false;


    return (
        <div className="min-h-screen pt-20 pb-24 md:pb-0">
            {loading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Spinner size={40} />
                </div>
            ) : (
                <>
                    {/* Hero Section - Diseño Minimalista */}
                    <section className="relative overflow-hidden py-12 sm:py-20 lg:py-28">
                        {/* Fondo negro puro */}
                        <div className="absolute inset-0 -z-20 bg-black" aria-hidden="true" />

                        {/* Patrón de grid sutil */}
                        <div className="absolute inset-0 -z-10 opacity-10" aria-hidden="true">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
                                backgroundSize: '40px 40px'
                            }} />
                        </div>

                        {/* Orbes de luz sutiles */}
                        <div className="absolute -left-40 top-10 -z-10 h-[500px] w-[500px] rounded-full bg-white/5 blur-[100px]" aria-hidden="true" />
                        <div className="absolute -right-40 top-40 -z-10 h-[400px] w-[400px] rounded-full bg-white/5 blur-[80px]" aria-hidden="true" />

                        <div className="container relative z-10 mx-auto px-3 sm:px-6 lg:px-8">
                            <div className="relative">
                                <div className="grid grid-cols-1 gap-12 lg:gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center">
                                    {/* Contenido principal */}
                                    <div className="flex flex-col gap-6 lg:gap-8">
                                        {/* Badge de temporada */}
                                        <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
                                            <span className="flex h-2 w-2">
                                                <span className="absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75 animate-ping"></span>
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                                                Temporada 2025 · En directo
                                            </span>
                                        </div>

                                        {/* Título principal */}
                                        <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
                                            <span className="text-white">Toda la escena</span>
                                            <br />
                                            <span className="text-white">
                                                esports
                                            </span>
                                            <span className="text-white/60"> en </span>
                                            <span className="relative inline-block">
                                                <span className="text-white">vivo</span>
                                                <span className="absolute -inset-1 -z-10 rounded-lg bg-white/10 blur-sm" aria-hidden="true"></span>
                                            </span>
                                        </h1>

                                        {/* Descripción */}
                                        <p className="max-w-xl text-sm sm:text-base lg:text-lg text-white/50 leading-relaxed">
                                            Monitoriza resultados en tiempo real, consulta horarios de las mejores ligas y recibe alertas instantáneas de
                                            <span className="text-white font-semibold"> Dota 2</span>,
                                            <span className="text-white font-semibold"> League of Legends</span>,
                                            <span className="text-white font-semibold"> CS2</span> y más.
                                        </p>

                                        {/* Resumen rápido */}
                                        <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-sm">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                                                    Resumen del feed
                                                </p>
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                {summaryStats.map((stat) => (
                                                    <SummaryStatCard
                                                        key={stat.label}
                                                        label={stat.label}
                                                        value={stat.value}
                                                        helper={stat.helper}
                                                        accent={stat.accent}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                            <Link
                                                href="/esports"
                                                className="group relative touch-target touch-ripple inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] overflow-hidden"
                                            >
                                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <span>🎮</span>
                                                    Explorar partidos
                                                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </span>
                                            </Link>
                                        </div>

                                        {/* Métricas destacadas */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-3 sm:mt-4">
                                            {heroHighlights.map((metric, index) => (
                                                <div
                                                    key={metric.label}
                                                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 sm:p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                                                    style={{ animationDelay: `${index * 100}ms` }}
                                                >
                                                    {/* Acento decorativo */}
                                                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

                                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                        {metric.label}
                                                    </span>
                                                    <p className="mt-2 text-3xl sm:text-4xl font-black text-white tabular-nums">
                                                        {numberFormatter.format(Math.max(metric.value, 0))}
                                                    </p>
                                                    <p className="mt-1 text-xs text-white/40">{metric.helper}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Features badges */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {[
                                                { icon: "⚡", text: "Alertas en vivo" },
                                                { icon: "🎯", text: "Cobertura multijuego" },
                                                { icon: "📊", text: "Estadísticas avanzadas" }
                                            ].map((feature, index) => (
                                                <span
                                                    key={feature.text}
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:text-white/80"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <span>{feature.icon}</span>
                                                    {feature.text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tarjeta de partido destacado - ahora opcional o demo */}
                                    <div className="relative lg:mt-0">
                                        {/* Glows decorativos */}
                                        <div className="absolute -right-20 top-0 h-60 w-60 rounded-full bg-white/5 blur-[80px]" aria-hidden="true" />
                                        <div className="absolute -left-20 bottom-10 h-48 w-48 rounded-full bg-white/5 blur-[60px]" aria-hidden="true" />

                                        {/* Tarjeta principal */}
                                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl">
                                            {/* Borde superior brillante */}
                                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />

                                            {/* Efecto de reflejo */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" aria-hidden="true" />

                                            <div className="relative flex flex-col gap-6 p-6 sm:p-8">
                                                <h3 className="text-xl font-bold text-white mb-4">Información de la Plataforma</h3>
                                                <p className="text-white/60">
                                                    EMob es tu centro de esports definitivo. Encuentra datos en tiempo real, estadísticas detalladas y mucho más sobre tus juegos favoritos.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Estadísticas por Juego - Diseño Minimalista */}
                    {selectedGameConfigs.length > 0 && (
                        <section className="relative py-12 sm:py-20 overflow-hidden">
                            {/* Fondo decorativo */}
                            <div className="absolute inset-0 -z-10">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/5 rounded-full blur-[120px]" aria-hidden="true" />
                            </div>

                            <div className="container mx-auto px-3 sm:px-6 lg:px-8">
                                {/* Header de sección mejorado */}
                                <div className="mx-auto mb-14 max-w-3xl text-center">
                                    <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-2 mb-6">
                                        <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                                            Métricas en directo
                                        </span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-tight">
                                        Estadísticas en{" "}
                                        <span className="text-white/80">
                                            tiempo real
                                        </span>
                                    </h2>
                                    <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/50 max-w-2xl mx-auto">
                                        Descubre qué escena está más activa ahora mismo y encuentra nuevas ligas para seguir
                                    </p>
                                </div>

                                {/* Grid de juegos */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
                                    {selectedGameConfigs.map((game, index) => (
                                        <div
                                            key={game.id}
                                            className="animate-fadein"
                                            style={{ animationDelay: `${index * 80}ms` }}
                                        >
                                            <GameStatsCard
                                                game={game}
                                                stats={gameStats[game.id] || { totalMatches: 0, liveMatches: 0, upcomingMatches: 0, completedMatches: 0, activeTournaments: 0 }}
                                                lastUpdated={lastUpdated}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

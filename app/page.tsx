"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import Header from "./components/Header";
import ChatBot from "./components/ChatBot";
import LiveScoreTicker from "./components/LiveScoreTicker";
import NotificationSystem, { useNotifications } from "./components/NotificationSystem";
import ScrollToTop from "./components/ScrollToTop";
import { SUPPORTED_GAMES } from "./lib/gameConfig";
import type { Match, Tournament } from "./lib/types";
import HeroSection from "./components/home/HeroSection";
import GameStatsSection from "./components/home/GameStatsSection";
import FiltersSection from "./components/home/FiltersSection";
import FeaturedMatchesSection from "./components/home/FeaturedMatchesSection";
import ActiveTournamentsSection from "./components/home/ActiveTournamentsSection";
import CallToActionSection from "./components/home/CallToActionSection";
import type { GameStats } from "./components/home/GameStatsCard";

// Custom hook to handle time consistently between server and client
function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(Math.floor(Date.now() / 1000));
    
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { currentTime, isClient };
}

const GAMES = SUPPORTED_GAMES;

// Función para obtener partidos de múltiples juegos
async function fetchMatches(gameId: string = "all"): Promise<Match[]> {
  const gamesToFetch = gameId === "all" ? GAMES : GAMES.filter(g => g.id === gameId);
  const allMatches: Match[] = [];

  for (const game of gamesToFetch) {
    try {
      const res = await fetch(`/api/esports/matches?game=${game.id}&limit=50`, {
        cache: "no-store",
      });
      if (!res.ok) continue;

      const data = await res.json();
      const gameMatches = data
        .map((m: any) => {
          const team1 = m.opponents?.[0]?.opponent;
          const team2 = m.opponents?.[1]?.opponent;
          const dateStr = m.begin_at ?? m.scheduled_at;
          const date = dateStr ? new Date(dateStr) : null;
          const start_time = date && !isNaN(date.getTime()) ? date.getTime() / 1000 : null;
          const radiant_score = Array.isArray(m.results) && m.results[0]?.score != null ? m.results[0].score : null;
          const dire_score = Array.isArray(m.results) && m.results[1]?.score != null ? m.results[1].score : null;
          
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
        .filter((m: Match) => m.start_time !== null);
        
      allMatches.push(...gameMatches);
    } catch (error) {
      console.error(`Error fetching matches for ${game.id}:`, error);
    }
  }
  
  return allMatches.sort((a, b) => a.start_time - b.start_time);
}

// Función para obtener torneos de múltiples juegos
async function fetchActiveTournaments(gameId: string = "all"): Promise<Tournament[]> {
  const gamesToFetch = gameId === "all" ? GAMES : GAMES.filter(g => g.id === gameId);
  const allTournaments: Tournament[] = [];
  
  for (const game of gamesToFetch) {
    try {
      const res = await fetch(`/api/esports/tournaments?game=${game.id}&active=true`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      
      const data = await res.json();
      const gameTournaments = data.map((t: any) => ({
        id: t.id,
        name: t.name ?? "",
        begin_at: t.begin_at ? new Date(t.begin_at).getTime() / 1000 : null,
        end_at: t.end_at ? new Date(t.end_at).getTime() / 1000 : null,
        league: t.league?.name ?? "",
        serie: t.serie?.full_name ?? "",
        prizepool: t.prizepool ?? null,
        tier: t.tier ?? null,
        region: t.region ?? null,
        live_supported: !!t.live_supported,
        game: game.id,
      })) as Tournament[];
      
      allTournaments.push(...gameTournaments);
    } catch (error) {
      console.error(`Error fetching tournaments for ${game.id}:`, error);
    }
  }
  
  return allTournaments;
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"today" | "week" | "all">("today");
  const [selectedGame, setSelectedGame] = useState<string>("all");
  
  const { currentTime, isClient } = useCurrentTime();
  const notificationSystem = useNotifications();

  // Cargar datos
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const matchesData = await fetchMatches(selectedGame);
      setMatches(matchesData);
      setLoading(false);
    }
    loadData();
  }, [selectedGame]);

  useEffect(() => {
    async function loadTournaments() {
      setLoadingTournaments(true);
      const tournamentsData = await fetchActiveTournaments(selectedGame);
      setTournaments(tournamentsData.slice(0, 6));
      setLoadingTournaments(false);
    }
    
    if (isClient) {
      loadTournaments();
    }
  }, [isClient, selectedGame]);

  // Estadísticas por juego
  const gameStats = useMemo(() => {
    const stats: Record<string, GameStats> = {};

    GAMES.forEach(game => {
      const gameMatches = matches.filter(m => m.game === game.id);
      const gameTournaments = tournaments.filter(t => t.game === game.id);
      
      stats[game.id] = {
        totalMatches: gameMatches.length,
        liveMatches: gameMatches.filter(m => m.start_time <= currentTime && m.radiant_win === null).length,
        upcomingMatches: gameMatches.filter(m => m.start_time > currentTime).length,
        completedMatches: gameMatches.filter(m => m.radiant_win !== null).length,
        activeTournaments: gameTournaments.length,
      };
    });

    return stats;
  }, [matches, tournaments, currentTime]);

  // Partidos filtrados por timeframe y juego
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Filtrar por juego
    if (selectedGame !== "all") {
      filtered = filtered.filter(m => m.game === selectedGame);
    }

    // Filtrar por tiempo
    switch (selectedTimeframe) {
      case "today":
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(m => {
          const matchTime = m.start_time * 1000;
          return matchTime >= todayStart.getTime() && matchTime <= todayEnd.getTime();
        });
        break;
      case "week":
        const weekStart = currentTime * 1000;
        const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(m => {
          const matchTime = m.start_time * 1000;
          return matchTime >= weekStart && matchTime <= weekEnd;
        });
        break;
    }

    return filtered.sort((a, b) => {
      // Priorizar partidos en vivo
      const aIsLive = a.start_time <= currentTime && a.radiant_win === null;
      const bIsLive = b.start_time <= currentTime && b.radiant_win === null;
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      return a.start_time - b.start_time;
    });
  }, [matches, selectedTimeframe, selectedGame, currentTime]);

  // Partidos destacados (en vivo + próximos importantes)
  const featuredMatches = useMemo(() => {
    const live = filteredMatches.filter(m => m.start_time <= currentTime && m.radiant_win === null);
    const upcoming = filteredMatches.filter(m => m.start_time > currentTime).slice(0, 3);
    
    return [...live.slice(0, 2), ...upcoming].slice(0, 4);
  }, [filteredMatches, currentTime]);

  return (
    <>
      <Header />
      <LiveScoreTicker currentGame="all" />
      
      <main className="min-h-screen bg-black text-white pt-20">
        <HeroSection />
        <GameStatsSection gameStats={gameStats} />
        <FiltersSection
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
          filteredMatches={filteredMatches}
          matches={matches}
          featuredMatches={featuredMatches}
          currentTime={currentTime}
        />
        <FeaturedMatchesSection
          loading={loading}
          featuredMatches={featuredMatches}
          currentTime={currentTime}
        />
        <ActiveTournamentsSection
          loadingTournaments={loadingTournaments}
          tournaments={tournaments}
        />
        <CallToActionSection />
      </main>

      {/* Sistemas adicionales */}
      <NotificationSystem
        notifications={notificationSystem.notifications}
        onMarkAsRead={notificationSystem.markAsRead}
        onClearAll={notificationSystem.clearAll}
        onDeleteNotification={notificationSystem.deleteNotification}
      />
      
      <ChatBot />
      <ScrollToTop />
    </>
  );
}

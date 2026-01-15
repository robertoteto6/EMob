"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPlayerImageUrl, getTeamImageUrl } from "../../../lib/imageFallback";

interface RegionInfo {
  name: string;
  flag: string;
  region: string;
}

interface TeamData {
  id: number;
  name: string;
  acronym: string;
  image_url: string | null;
  location: string | null;
  current_videogame: any;
  players: any[];
}

interface RecentMatch {
  id: number;
  name: string;
  begin_at: string;
  winner: { id: number; name: string } | null;
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      image_url: string | null;
    };
  }>;
  league: {
    id: number;
    name: string;
    image_url: string | null;
  };
  tournament: {
    id: number;
    name: string;
  };
}

interface PlayerDetail {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  image_url: string | null;
  current_team: string | null;
  current_team_id: number | null;
  current_team_image: string | null;
  age: number | null;
  birthday: string | null;
  hometown: string | null;
  modified_at: string | null;
  title_score: number;
  recent_matches: RecentMatch[];
  historical_matches: RecentMatch[];
  win_rate: string;
  total_matches: number;
  team_data: TeamData | null;
  professional_status: string;
  region_info: RegionInfo | null;
  is_veteran: boolean;
  instagram_followers: number;
  instagram_handle: string | null;
}

interface VeteranAnalysis {
  career_highlights: Array<{
    match_name: string;
    tournament: string;
    date: string;
    importance: string;
  }>;
  playing_style: string;
  legacy_impact: string;
  achievements_summary: string;
  ai_insights: string[];
}

// Componente para mostrar análisis de IA para veteranos
function VeteranAnalysisCard({ playerId, playerName }: { playerId: number; playerName: string }) {
  const [analysis, setAnalysis] = useState<VeteranAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const res = await fetch(`/api/esports/player/${playerId}/analysis`);
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data.analysis);
        }
      } catch (error) {
        console.error('Error fetching AI analysis:', error);
      }
      setLoading(false);
    }
    
    fetchAnalysis();
  }, [playerId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-800/20 rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-xl font-bold text-purple-300">Análisis de IA en progreso...</h3>
        </div>
        <p className="text-purple-200">🤖 Analizando la carrera profesional con inteligencia artificial</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-indigo-800/20 rounded-2xl p-6 border border-purple-500/30">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🤖</span>
        <div>
          <h3 className="text-xl font-bold text-purple-300">Análisis de IA Avanzado</h3>
          <p className="text-sm text-purple-400">Powered by Advanced Analytics</p>
        </div>
      </div>

      {/* Estilo de juego */}
      {analysis.playing_style && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-blue-400">🎮</span>
            Estilo de Juego
          </h4>
          <p className="text-gray-300 bg-gray-800/50 rounded-lg p-3">{analysis.playing_style}</p>
        </div>
      )}

      {/* Impacto del legado */}
      {analysis.legacy_impact && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-yellow-400">👑</span>
            Impacto en la Historia
          </h4>
          <p className="text-gray-300 bg-gray-800/50 rounded-lg p-3">{analysis.legacy_impact}</p>
        </div>
      )}

      {/* Insights de IA */}
      {analysis.ai_insights && analysis.ai_insights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-3">Insights de IA</h4>
          <div className="space-y-2">
            {analysis.ai_insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 bg-indigo-900/30 rounded-lg p-3">
                <span className="text-indigo-400 text-sm font-mono">AI:</span>
                <span className="text-gray-300 text-sm">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Momentos destacados de la carrera */}
      {analysis.career_highlights && analysis.career_highlights.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-orange-400">🏆</span>
            Momentos Destacados Detectados por IA
          </h4>
          <div className="space-y-2">
            {analysis.career_highlights.slice(0, 3).map((highlight, index) => (
              <div key={index} className="bg-gradient-to-r from-orange-900/30 to-red-800/20 rounded-lg p-3 border border-orange-500/20">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="text-white font-medium text-sm">{highlight.match_name}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    highlight.importance === 'Legendario' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-orange-600 text-white'
                  }`}>
                    {highlight.importance}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">{highlight.tournament}</p>
                {highlight.date && (
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(highlight.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar el nivel/rango del jugador
function PlayerRank({ score }: { score: number }) {
  let rank, icon, gradient, bgGradient;
  
  if (score >= 150) {
    rank = "Leyenda";
    icon = "👑";
    gradient = "from-yellow-400 via-orange-500 to-red-500";
    bgGradient = "from-yellow-900/20 via-orange-900/20 to-red-900/20";
  } else if (score >= 100) {
    rank = "Veterano";
    icon = "⭐";
    gradient = "from-purple-400 via-pink-500 to-purple-600";
    bgGradient = "from-purple-900/20 via-pink-900/20 to-purple-900/20";
  } else if (score >= 70) {
    rank = "Profesional";
    icon = "🏆";
    gradient = "from-blue-400 via-cyan-500 to-blue-600";
    bgGradient = "from-blue-900/20 via-cyan-900/20 to-blue-900/20";
  } else if (score >= 40) {
    rank = "Emergente";
    icon = "🎯";
    gradient = "from-green-400 via-emerald-500 to-green-600";
    bgGradient = "from-green-900/20 via-emerald-900/20 to-green-900/20";
  } else {
    rank = "Novato";
    icon = "⚡";
    gradient = "from-gray-400 via-gray-500 to-gray-600";
    bgGradient = "from-gray-900/20 via-gray-800/20 to-gray-900/20";
  }
  
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 border border-gray-700 bg-gradient-to-br ${bgGradient} backdrop-blur-sm`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"></div>
      <div className="relative z-10 text-center">
        <div className={`text-6xl mb-3`}>{icon}</div>
        <h3 className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
          {rank}
        </h3>
        <div className="text-white text-lg font-semibold">
          {score} <span className="text-sm text-gray-400">puntos</span>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar estadísticas
function StatCard({ title, value, subtitle, icon }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactNode; 
}) {
  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-blue-400">{icon}</div>
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

// Componente para mostrar partidos recientes
function RecentMatchCard({ match }: { match: RecentMatch }) {
  const matchDate = new Date(match.begin_at);
  const isWin = match.winner && match.opponents.some(opp => opp.opponent.id === match.winner?.id);
  
  return (
    <div className={`bg-gradient-to-r ${isWin ? 'from-green-900/30 to-green-800/20' : 'from-red-900/30 to-red-800/20'} rounded-xl p-4 border ${isWin ? 'border-green-500/30' : 'border-red-500/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.league.image_url && (
            <Image
              src={match.league.image_url}
              alt={match.league.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded"
            />
          )}
          <span className="text-sm font-medium text-gray-300">{match.league.name}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold ${isWin ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {isWin ? 'VICTORIA' : 'DERROTA'}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-white text-sm">{match.name}</h4>
        <span className="text-xs text-gray-400">
          {matchDate.toLocaleDateString()}
        </span>
      </div>
      
      <div className="text-xs text-gray-400">
        {match.tournament.name}
      </div>
    </div>
  );
}

// Componente para mostrar partidos históricos importantes
function HistoricalMatchCard({ match }: { match: RecentMatch }) {
  const matchDate = new Date(match.begin_at);
  const isWin = match.winner && match.opponents.some(opp => opp.opponent.id === match.winner?.id);
  
  // Detectar si es un partido realmente importante
  const matchName = match.name?.toLowerCase() || '';
  const tournamentName = match.tournament?.name?.toLowerCase() || '';
  const isGrandFinal = matchName.includes('grand final') || matchName.includes('final');
  const isMajor = tournamentName.includes('major') || tournamentName.includes('championship') || tournamentName.includes('world');
  
  let importanceLevel = 'Importante';
  let importanceColor = 'border-blue-500/40 bg-gradient-to-r from-blue-900/30 to-blue-800/20';
  
  if (isGrandFinal && isMajor) {
    importanceLevel = 'Legendario';
    importanceColor = 'border-yellow-500/40 bg-gradient-to-r from-yellow-900/30 to-orange-800/20';
  } else if (isGrandFinal) {
    importanceLevel = 'Épico';
    importanceColor = 'border-purple-500/40 bg-gradient-to-r from-purple-900/30 to-purple-800/20';
  } else if (isMajor) {
    importanceLevel = 'Notable';
    importanceColor = 'border-cyan-500/40 bg-gradient-to-r from-cyan-900/30 to-cyan-800/20';
  }
  
  return (
    <div className={`${importanceColor} rounded-xl p-4 border transition-all hover:scale-105 hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.league.image_url && (
            <Image
              src={match.league.image_url}
              alt={match.league.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded"
            />
          )}
          <span className="text-sm font-medium text-gray-300">{match.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 font-medium">
            {importanceLevel}
          </span>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${isWin ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {isWin ? 'VICTORIA' : 'DERROTA'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-white text-sm">{match.name}</h4>
        <span className="text-xs text-gray-400">
          {matchDate.toLocaleDateString()}
        </span>
      </div>
      
      <div className="text-xs text-gray-400 mb-2">
        {match.tournament.name}
      </div>
      
      {/* Indicador visual especial para partidos legendarios */}
      {importanceLevel === 'Legendario' && (
        <div className="flex items-center gap-1 text-xs text-yellow-400 mt-2">
          <span className="text-lg">🏆</span>
          <span className="font-bold">Momento histórico en la carrera</span>
        </div>
      )}
      
      {importanceLevel === 'Épico' && (
        <div className="flex items-center gap-1 text-xs text-purple-400 mt-2">
          <span className="text-lg">⭐</span>
          <span className="font-bold">Partido destacado</span>
        </div>
      )}
    </div>
  );
}

async function fetchPlayer(id: string): Promise<PlayerDetail | null> {
  try {
    const res = await fetch(`/api/esports/player/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching player:", error);
    return null;
  }
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchPlayer(id);
      setPlayer(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <main className="min-h-screen pt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Cargando perfil del jugador...</h2>
                <p className="text-gray-400">Obteniendo información detallada</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!player) {
    return (
      <>
        <main className="min-h-screen pt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Jugador no encontrado</h1>
              <p className="text-gray-400 mb-8">No pudimos encontrar información sobre este jugador.</p>
              <Link href="/esports/players" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a jugadores
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const playerImageSrc = getPlayerImageUrl(player);
  const teamLogoSrc = player.team_data
    ? getTeamImageUrl({
        id: player.team_data.id,
        name: player.team_data.name,
        acronym: player.team_data.acronym,
        image_url: player.team_data.image_url,
      })
    : null;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground pt-20">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        
        <div className="relative z-10 container mx-auto px-6 py-8">
          {/* Navegación */}
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/esports" className="text-gray-400 hover:text-green-400 transition-colors">
                Esports
              </Link>
              <span className="text-gray-600">›</span>
              <Link href="/esports/players" className="text-gray-400 hover:text-green-400 transition-colors">
                Jugadores
              </Link>
              <span className="text-gray-600">›</span>
              <span className="text-white font-medium">{player.name}</span>
            </nav>
          </div>

          {/* Header del perfil */}
          <div className="relative mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-3xl opacity-30 blur-sm"></div>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Avatar y nombre */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full opacity-50 group-hover:opacity-75 transition-opacity blur-sm"></div>
                    <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-gray-600 group-hover:border-green-400 transition-colors">
                      <Image
                        src={playerImageSrc}
                        alt={player.name}
                        fill
                        sizes="(max-width: 1024px) 128px, 160px"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center lg:text-left mt-6">
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                      {player.name}
                    </h1>
                    
                    {(player.first_name || player.last_name) && (
                      <p className="text-xl text-gray-300 mb-2">
                        {player.first_name} {player.last_name}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-4">
                      {player.role && (
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">
                          {player.role}
                        </span>
                      )}
                      
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        player.professional_status === "Activo" 
                          ? "bg-green-600 text-white" 
                          : "bg-yellow-600 text-white"
                      }`}>
                        {player.professional_status}
                      </span>
                      
                      {player.region_info && (
                        <span className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold flex items-center gap-2">
                          <span>{player.region_info.flag}</span>
                          <span>{player.region_info.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información del equipo */}
                {player.team_data && (
                  <div className="flex-1 lg:ml-8">
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                        </svg>
                        Equipo Actual
                      </h3>
                      
                      <div className="flex items-center gap-4 mb-4">
                        {teamLogoSrc && (
                          <Image
                            src={teamLogoSrc}
                            alt={player.team_data.name}
                            width={64}
                            height={64}
                            className="rounded-xl object-cover border-2 border-gray-600 w-16 h-16"
                          />
                        )}
                        <div>
                          <h4 className="text-xl font-bold text-white">{player.team_data.name}</h4>
                          {player.team_data.acronym && (
                            <p className="text-green-400 font-semibold">{player.team_data.acronym}</p>
                          )}
                          {player.team_data.location && (
                            <p className="text-sm text-gray-400">{player.team_data.location}</p>
                          )}
                        </div>
                      </div>
                      
                      {player.team_data.players && player.team_data.players.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">
                            Compañeros de equipo ({player.team_data.players.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {player.team_data.players.slice(0, 4).map((teammate: any) => (
                              <Link
                                key={teammate.id}
                                href={`/esports/player/${teammate.id}`}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-full text-xs transition-colors"
                              >
                                {teammate.name}
                              </Link>
                            ))}
                            {player.team_data.players.length > 4 && (
                              <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">
                                +{player.team_data.players.length - 4} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda - Rango y estadísticas */}
            <div className="space-y-8">
              {/* Rango del jugador */}
              <PlayerRank score={player.title_score} />
              
              {/* Estadísticas principales */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Estadísticas</h3>
                
                <StatCard
                  title="Ratio de victorias"
                  value={`${player.win_rate}%`}
                  subtitle="Últimos partidos"
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  }
                />
                
                <StatCard
                  title="Partidos recientes"
                  value={player.total_matches}
                  subtitle="Registrados"
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  }
                />
                
                <StatCard
                  title="ID del jugador"
                  value={`#${player.id}`}
                  subtitle="Identificador único"
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  }
                />

                {player.age && (
                  <StatCard
                    title="Edad"
                    value={`${player.age} años`}
                    subtitle="Experiencia"
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                )}
              </div>

              {/* Información personal */}
              {(player.hometown || player.birthday) && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Información Personal</h3>
                  <div className="space-y-3">
                    {player.birthday && (
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-white font-medium">Fecha de nacimiento</p>
                          <p className="text-gray-400 text-sm">{new Date(player.birthday).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    
                    {player.hometown && (
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-white font-medium">Ciudad natal</p>
                          <p className="text-gray-400 text-sm">{player.hometown}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instagram y Redes Sociales */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Redes Sociales
                </h3>
                
                <div className="space-y-4">
                  {/* Instagram */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-xl border border-pink-500/20 hover:border-pink-500/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <div>
                          <p className="text-white font-medium">Instagram</p>
                          <p className="text-gray-400 text-sm">
                            {player.instagram_followers >= 1000000 
                              ? `${(player.instagram_followers / 1000000).toFixed(1)}M seguidores`
                              : player.instagram_followers >= 1000
                              ? `${(player.instagram_followers / 1000).toFixed(1)}K seguidores`
                              : `${player.instagram_followers} seguidores`}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {player.instagram_handle ? (
                      <a
                        href={`https://instagram.com/${player.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <span>@{player.instagram_handle}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm italic">Perfil no disponible</span>
                    )}
                  </div>
                  
                  {/* Placeholder para futuras redes sociales */}
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <p>Más redes sociales próximamente...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Partidos recientes y más info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Partidos recientes */}
              {player.recent_matches && player.recent_matches.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Partidos Recientes
                  </h3>
                  
                  <div className="grid gap-4">
                    {player.recent_matches.map((match) => (
                      <RecentMatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Partidos históricos importantes - Solo para veteranos */}
              {player.is_veteran && player.historical_matches && player.historical_matches.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
                      <span className="text-4xl">🏆</span>
                      Momentos Históricos de la Carrera
                    </h3>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl opacity-20 blur-sm"></div>
                    <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 rounded-2xl p-6 backdrop-blur-sm border border-yellow-500/30">
                      <p className="text-yellow-300 text-sm mb-4 flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <span>Como jugador veterano, aquí están sus partidos más importantes y destacados</span>
                      </p>
                      
                      <div className="grid gap-4">
                        {player.historical_matches.map((match) => (
                          <HistoricalMatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje especial para veteranos sin actividad reciente */}
              {player.is_veteran && (!player.recent_matches || player.recent_matches.length < 3) && (
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">👑</span>
                    <h3 className="text-xl font-bold text-purple-300">Jugador Veterano</h3>
                  </div>
                  <p className="text-purple-200 mb-4">
                    Este jugador ha demostrado una trayectoria excepcional en los esports. Aunque no tenga actividad reciente, 
                    su legado y experiencia lo posicionan como una leyenda en la escena competitiva.
                  </p>
                  <div className="text-sm text-purple-300">
                    💡 <strong>Puntuación de títulos:</strong> {player.title_score} puntos - Indica una carrera llena de logros importantes
                  </div>
                </div>
              )}

              {/* Análisis avanzado de IA para veteranos */}
              {player.is_veteran && (
                <VeteranAnalysisCard playerId={player.id} playerName={player.name} />
              )}

              {/* Rendimiento y tendencias */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Análisis de Rendimiento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400 mb-2">{player.win_rate}%</div>
                    <div className="text-sm text-gray-300">Ratio de victorias</div>
                    <div className="text-xs text-gray-500 mt-1">Últimos {player.total_matches} partidos</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{player.title_score}</div>
                    <div className="text-sm text-gray-300">Puntuación de títulos</div>
                    <div className="text-xs text-gray-500 mt-1">Ranking profesional</div>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/esports/players"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver a jugadores
                </Link>
                
                {player.current_team_id && (
                  <Link 
                    href={`/esports/team/${player.current_team_id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                    </svg>
                    Ver equipo
                  </Link>
                )}
                
                <button 
                  onClick={() => navigator.share && navigator.share({
                    title: `${player.name} - Perfil de jugador`,
                    url: window.location.href
                  })}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

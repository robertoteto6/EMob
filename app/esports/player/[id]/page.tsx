"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

// Import player components (lazy loaded for better performance)
import {
  PlayerHeroSectionLazy,
  PlayerAchievementsLazy,
  PlayerMediaGalleryLazy,
  PlayerStatsProgressiveLazy,
  PlayerMatchesLazy,
  PlayerProfileSkeleton
} from "../../../components/player";

// Import types
import type { PlayerDetail, VeteranAnalysis } from "../../../lib/types/player";

// Componente para mostrar análisis de IA para veteranos
function VeteranAnalysisCard({ playerId, playerName: _playerName }: { playerId: number; playerName: string }) {
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/30 to-indigo-800/20 rounded-2xl p-6 border border-purple-500/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-xl font-bold text-purple-300">Análisis de IA en progreso...</h3>
        </div>
        <p className="text-purple-200">🤖 Analizando la carrera profesional con inteligencia artificial</p>
      </motion.div>
    );
  }

  if (!analysis) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-indigo-800/20 rounded-2xl p-6 border border-purple-500/30"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-purple-900/50 border border-purple-500/30">
          <span className="text-3xl">🤖</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-purple-300">Análisis de IA Avanzado</h3>
          <p className="text-sm text-purple-400">Powered by Advanced Analytics</p>
        </div>
      </div>

      {analysis.playing_style && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-blue-400">🎮</span>
            Estilo de Juego
          </h4>
          <p className="text-gray-300 bg-gray-800/50 rounded-lg p-3">{analysis.playing_style}</p>
        </motion.div>
      )}

      {analysis.legacy_impact && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-yellow-400">👑</span>
            Impacto en la Historia
          </h4>
          <p className="text-gray-300 bg-gray-800/50 rounded-lg p-3">{analysis.legacy_impact}</p>
        </motion.div>
      )}

      {analysis.ai_insights && analysis.ai_insights.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h4 className="text-lg font-semibold text-white mb-3">💡 Insights de IA</h4>
          <div className="space-y-2">
            {analysis.ai_insights.map((insight, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-2 bg-indigo-900/30 rounded-lg p-3"
              >
                <span className="text-indigo-400 text-sm font-mono">AI:</span>
                <span className="text-gray-300 text-sm">{insight}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {analysis.career_highlights && analysis.career_highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-orange-400">🏆</span>
            Momentos Destacados Detectados por IA
          </h4>
          <div className="space-y-2">
            {analysis.career_highlights.slice(0, 3).map((highlight, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-gradient-to-r from-orange-900/30 to-red-800/20 rounded-lg p-3 border border-orange-500/20"
              >
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
                    {new Date(highlight.date).toLocaleDateString('es-ES')}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Social media section component
function SocialMediaSection({ player }: { player: PlayerDetail }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        Redes Sociales
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-xl border border-pink-500/20 hover:border-pink-500/40 transition-colors">
          <div className="flex items-center gap-3">
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
      </div>
    </motion.div>
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

// Favorites hook
function useFavorites(playerId: number) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoritePlayers') || '[]');
    setIsFavorite(favorites.includes(playerId));
  }, [playerId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoritePlayers') || '[]');
    if (favorites.includes(playerId)) {
      const newFavorites = favorites.filter((id: number) => id !== playerId);
      localStorage.setItem('favoritePlayers', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(playerId);
      localStorage.setItem('favoritePlayers', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  return { isFavorite, toggleFavorite };
}

export default function PlayerPage() {
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const playerId = id ? Number(id) : NaN;
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (!id || Number.isNaN(playerId)) {
        setPlayer(null);
        setLoading(false);
        return;
      }
      const data = await fetchPlayer(id);
      setPlayer(data);
      setLoading(false);
    }
    load();
  }, [id, playerId]);

  const { isFavorite, toggleFavorite } = useFavorites(player?.id || 0);

  if (loading) {
    return <PlayerProfileSkeleton />;
  }

  if (!player) {
    return (
      <main className="min-h-screen pt-20">
        <div className="container mx-auto px-6 py-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Jugador no encontrado</h1>
            <p className="text-gray-400 mb-8">No pudimos encontrar información sobre este jugador.</p>
            <Link href="/esports" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Esports
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground pt-20">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Navegación / Breadcrumb */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm">
            <Link href="/esports" className="text-gray-400 hover:text-green-400 transition-colors">
              Esports
            </Link>
            <span className="text-gray-600">›</span>
            <Link href="/jugadores" className="text-gray-400 hover:text-green-400 transition-colors">
              Jugadores
            </Link>
            <span className="text-gray-600">›</span>
            <span className="text-white font-medium">{player.name}</span>
          </div>
        </motion.nav>

        {/* Hero Section - Información principal del jugador */}
        <PlayerHeroSectionLazy 
          player={player} 
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />

        {/* Logros y Achievements - Primero para jugadores importantes */}
        {player.achievements && player.achievements.length > 0 && (
          <PlayerAchievementsLazy 
            achievements={player.achievements} 
            playerName={player.name}
            isVeteran={player.is_veteran}
          />
        )}

        {/* Galería Multimedia - Videos y highlights */}
        {player.media_gallery && player.media_gallery.length > 0 && (
          <PlayerMediaGalleryLazy 
            media={player.media_gallery} 
            playerName={player.name}
          />
        )}

        {/* Grid principal de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Info adicional */}
          <div className="space-y-8">
            {/* Información personal */}
            {(player.hometown || player.birthday) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>👤</span> Información Personal
                </h3>
                <div className="space-y-3">
                  {player.birthday && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-white font-medium">Fecha de nacimiento</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(player.birthday).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
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

                  {player.age && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-white font-medium">Edad</p>
                        <p className="text-gray-400 text-sm">{player.age} años</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Redes Sociales */}
            <SocialMediaSection player={player} />

            {/* Compañeros de equipo */}
            {player.team_data?.players && player.team_data.players.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>👥</span> Compañeros de Equipo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {player.team_data.players
                    .filter((teammate: any) => teammate.id !== player.id)
                    .slice(0, 6)
                    .map((teammate: any) => (
                    <Link
                      key={teammate.id}
                      href={`/esports/player/${teammate.id}`}
                      className="px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <span className="text-green-400">•</span>
                      {teammate.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Columna derecha - Estadísticas y partidos */}
          <div className="lg:col-span-2 space-y-8">
            {/* Estadísticas Progresivas */}
            <PlayerStatsProgressiveLazy player={player} />

            {/* Partidos */}
            <PlayerMatchesLazy
              recentMatches={player.recent_matches || []}
              historicalMatches={player.historical_matches || []}
              isVeteran={player.is_veteran}
              playerTeamId={player.current_team_id}
            />

            {/* Mensaje especial para veteranos */}
            {player.is_veteran && (!player.recent_matches || player.recent_matches.length < 3) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-2xl p-6 border border-purple-500/30"
              >
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
              </motion.div>
            )}

            {/* Análisis de IA para veteranos */}
            {player.is_veteran && (
              <VeteranAnalysisCard playerId={player.id} playerName={player.name} />
            )}

            {/* Acciones */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-4"
            >
              <Link 
                href="/esports"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
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
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}

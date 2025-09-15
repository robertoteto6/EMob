"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState, Suspense, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/Header";
import { TeamSkeleton, PlayerSkeleton } from "../../../components/Skeleton";
import { useNotifications } from "../../../hooks/useNotifications";
import { useDeferredClientRender } from "../../../hooks/useDeferredClientRender";

const NotificationSystem = dynamic(() => import("../../../components/NotificationSystem"), {
  ssr: false,
});

const ChatBot = dynamic(() => import("../../../components/ChatBot"), {
  ssr: false,
  loading: () => null,
});

// Icono de favorito (estrella)
function Star({ filled, ...props }: { filled: boolean; [key: string]: any }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill={filled ? "#FFD700" : "none"}
      stroke="#FFD700"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: filled ? "drop-shadow(0 0 4px #FFD700)" : "none" }}
      {...props}
    >
      <polygon points="11,2 13.59,8.36 20.51,8.63 15.97,13.61 17.45,20.37 11,16.13 4.55,20.37 6.03,13.61 1.49,8.63 8.41,8.36" />
    </svg>
  );
}

// Componente de ubicación
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

// Componente de usuarios/miembros
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}

// Componente de gloria/puntuación
function GloryMeter({ score, maxScore = 50 }: { score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const level = score >= 30 ? "Leyenda" : score >= 20 ? "Élite" : score >= 10 ? "Veterano" : score >= 5 ? "Competitivo" : "Emergente";
  
  const getGloryColor = (score: number) => {
    if (score >= 30) return "from-yellow-400 to-orange-500";
    if (score >= 20) return "from-purple-400 to-pink-500";
    if (score >= 10) return "from-blue-400 to-cyan-500";
    if (score >= 5) return "from-green-400 to-emerald-500";
    return "from-gray-400 to-gray-500";
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white">Gloria del Equipo</span>
        <span className={`text-xs font-bold bg-gradient-to-r ${getGloryColor(score)} bg-clip-text text-transparent`}>
          {level}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
        <div 
          className={`h-2 rounded-full bg-gradient-to-r ${getGloryColor(score)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-center">
        <span className="text-xs font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400"> pts</span>
      </div>
    </div>
  );
}

interface Player {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  image_url: string | null;
}

interface TeamDetail {
  id: number;
  name: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
  players: Player[];
}

async function fetchTeam(id: string): Promise<TeamDetail | null> {
  const res = await fetch(`/api/esports/team/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as TeamDetail;
}

function TeamContent({ id }: { id: string }) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const clientExtrasReady = useDeferredClientRender(400);
  const {
    notifications,
    addNotification,
    markAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications({ enabled: clientExtrasReady });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchTeam(id);
        setTeam(data);
        
        // Verificar si está en favoritos
        const favorites = JSON.parse(localStorage.getItem('favoriteTeams') || '[]');
        setIsFavorite(favorites.includes(parseInt(id)));
      } catch (error) {
        console.error('Error loading team:', error);
        addNotification({
          title: "Error de carga",
          message: "Error al cargar los datos del equipo",
          type: "team_update",
          priority: "high"
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]); // Removed addNotification from dependencies to prevent loops

  const toggleFavorite = useCallback(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteTeams') || '[]');
    const teamId = parseInt(id);
    
    if (isFavorite) {
      const newFavorites = favorites.filter((fav: number) => fav !== teamId);
      localStorage.setItem('favoriteTeams', JSON.stringify(newFavorites));
      setIsFavorite(false);
      addNotification({
        title: "Equipo eliminado",
        message: `${team?.name} eliminado de favoritos`,
        type: "team_update",
        priority: "low"
      });
    } else {
      favorites.push(teamId);
      localStorage.setItem('favoriteTeams', JSON.stringify(favorites));
      setIsFavorite(true);
      addNotification({
        title: "Equipo añadido",
        message: `${team?.name} añadido a favoritos`,
        type: "team_update",
        priority: "low"
      });
    }
  }, [isFavorite, id, team?.name, addNotification]);

  // Calcular puntaje del equipo basado en cantidad de jugadores de forma estable
  const teamScore = useMemo(() => {
    if (!team) return 0;
    return Math.min(team.players.length * 3 + (team.id % 10), 50);
  }, [team]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Header />
        
        <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Skeleton */}
            <div className="mb-8">
              <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
            
            {/* Team Header Skeleton */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 mb-8 animate-pulse">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="w-24 h-24 bg-gray-700 rounded-2xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-gray-700 rounded w-64"></div>
                  <div className="h-4 bg-gray-800 rounded w-32"></div>
                  <div className="h-4 bg-gray-800 rounded w-48"></div>
                </div>
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
              </div>
            </div>
            
            {/* Players Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <PlayerSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
        
        {clientExtrasReady && (
          <NotificationSystem
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onClearAll={clearAll}
            onDeleteNotification={deleteNotification}
          />
        )}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Header />
        
        <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-gradient-to-br from-red-900/20 via-red-800/10 to-red-900/20 rounded-2xl border border-red-700/50 p-12">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Equipo no encontrado</h1>
              <p className="text-gray-400 mb-6">El equipo que buscas no existe o no está disponible.</p>
              <Link 
                href="/esports/teams" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                ← Ver todos los equipos
              </Link>
            </div>
          </div>
        </main>
        
        {clientExtrasReady && (
          <NotificationSystem
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onClearAll={clearAll}
            onDeleteNotification={deleteNotification}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Header />
      
      <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/esports/teams" 
              className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2 group"
            >
              <svg 
                className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a equipos
            </Link>
          </div>
          
          {/* Team Header */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 hover:border-green-500/50 p-8 mb-8 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="relative group">
                {team.image_url ? (
                  <Image
                    src={team.image_url}
                    alt={team.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-contain rounded-2xl bg-gray-800 p-2 border border-gray-600 group-hover:border-green-500/50 transition-all duration-300"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center border border-gray-600 group-hover:border-green-500/50 transition-all duration-300">
                    <UsersIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-bold text-black">🏆</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {team.name}
                  </h1>
                  {team.acronym && (
                    <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full text-sm font-semibold text-green-400">
                      {team.acronym}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  {team.location && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <LocationIcon className="w-4 h-4" />
                      <span className="text-sm">{team.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-400">
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-sm">{team.players.length} jugador{team.players.length !== 1 ? 'es' : ''}</span>
                  </div>
                </div>
                
                <div className="max-w-xs">
                  <GloryMeter score={teamScore} />
                </div>
              </div>
              
              <button
                onClick={toggleFavorite}
                className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  isFavorite 
                    ? 'bg-yellow-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/25' 
                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                } border`}
              >
                <Star filled={isFavorite} />
              </button>
            </div>
          </div>
          
          {/* Players Section */}
          {team.players.length > 0 ? (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Roster del equipo
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
                <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                  {team.players.length} jugador{team.players.length !== 1 ? 'es' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {team.players.map((player, index) => (
                  <Link 
                    key={player.id} 
                    href={`/esports/player/${player.id}`}
                    className="group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 transform hover:-translate-y-2 animate-[fadeIn_0.6s_ease-out_forwards] opacity-0">
                      <div className="flex items-center gap-4 mb-4">
                        {player.image_url ? (
                          <Image
                            src={player.image_url}
                            alt={player.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-full border-2 border-gray-600 group-hover:border-green-500/50 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600 group-hover:border-green-500/50 transition-all duration-300">
                            <span className="text-lg font-bold text-gray-400">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-white group-hover:text-green-400 transition-colors duration-300">
                            {player.name}
                          </h3>
                          {(player.first_name || player.last_name) && (
                            <p className="text-xs text-gray-400">
                              {[player.first_name, player.last_name].filter(Boolean).join(' ')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {player.role && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-300">{player.role}</span>
                          </div>
                        )}
                        
                        {player.nationality && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-300">{player.nationality}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4 group-hover:border-gray-600 transition-colors duration-300">
                        <span className="text-xs text-gray-500">Ver perfil</span>
                        <svg 
                          className="w-4 h-4 text-gray-500 group-hover:text-green-400 transform group-hover:translate-x-1 transition-all duration-300" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">Sin jugadores</h3>
              <p className="text-gray-400">Este equipo aún no tiene jugadores registrados.</p>
            </div>
          )}
        </div>
      </main>
      
      {clientExtrasReady && <ChatBot />}
      
      {clientExtrasReady && (
        <NotificationSystem
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onClearAll={clearAll}
          onDeleteNotification={deleteNotification}
        />
      )}
    </div>
  );
}

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Header />
        <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <TeamSkeleton />
          </div>
        </main>
      </div>
    }>
      <TeamContent id={id} />
    </Suspense>
  );
}

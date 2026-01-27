"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getTeamImageUrl } from "../lib/imageFallback";
import { Team } from "../lib/types";
import { useGameStore } from "../contexts/GameContext";

export interface TeamFollow {
  teamId: string;
  teamName: string;
  game: string;
  notifications: boolean;
  addedAt: number;
  teamLogo?: string;
}

interface TeamFollowSystemProps {
  onTeamFollowChange?: (teams: TeamFollow[]) => void;
}

export default function TeamFollowSystem({ onTeamFollowChange }: TeamFollowSystemProps) {
  // Usar el contexto global de juegos seleccionados
  const { selectedGames } = useGameStore();
  
  const [followedTeams, setFollowedTeams] = useState<TeamFollow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);

  useEffect(() => {
    // Cargar equipos seguidos desde localStorage
    const saved = localStorage.getItem('followed-teams');
    if (saved) {
      try {
        const teams = JSON.parse(saved);
        setFollowedTeams(teams);
        onTeamFollowChange?.(teams);
      } catch (error) {
        console.error('Error loading followed teams:', error);
      }
    }
  }, [onTeamFollowChange]);

  useEffect(() => {
    // Guardar equipos seguidos en localStorage
    localStorage.setItem('followed-teams', JSON.stringify(followedTeams));
    onTeamFollowChange?.(followedTeams);
  }, [followedTeams, onTeamFollowChange]);

  const searchTeams = async (term: string) => {
    if (!term.trim() || selectedGames.length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Buscar en todos los juegos seleccionados
      const gamesParam = selectedGames.join(',');
      const res = await fetch(`/api/esports/teams?games=${gamesParam}&search=${encodeURIComponent(term)}`);
      if (res.ok) {
        const teams = await res.json();
        setSearchResults(teams);
      } else {
        console.warn(`Error al buscar equipos: ${res.status} ${res.statusText}`);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching teams:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const followTeam = (team: Team, gameId: string) => {
    const newFollow: TeamFollow = {
      teamId: team.id,
      teamName: team.name,
      game: gameId,
      notifications: true,
      addedAt: Date.now(),
      teamLogo: getTeamImageUrl({ id: team.id, name: team.name, image_url: team.logo })
    };

    setFollowedTeams(prev => {
      const exists = prev.find(t => t.teamId === team.id && t.game === gameId);
      if (exists) return prev;
      return [...prev, newFollow];
    });

    setSearchTerm("");
    setSearchResults([]);
  };

  const unfollowTeam = (teamId: string, game: string) => {
    setFollowedTeams(prev => 
      prev.filter(t => !(t.teamId === teamId && t.game === game))
    );
  };

  const toggleNotifications = (teamId: string, game: string) => {
    setFollowedTeams(prev => 
      prev.map(t => 
        t.teamId === teamId && t.game === game 
          ? { ...t, notifications: !t.notifications }
          : t
      )
    );
  };

  // Filtrar equipos seguidos por juegos seleccionados
  const currentGamesTeams = followedTeams.filter(t => selectedGames.includes(t.game));
  const otherGamesTeams = followedTeams.filter(t => !selectedGames.includes(t.game));

  return (
    <>
      {/* Follow Teams Button */}
      <button
        onClick={() => setShowFollowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-[#181c24] border border-[var(--accent,#00FF80)] text-[var(--accent,#00FF80)] rounded-lg hover:bg-[var(--accent,#00FF80)] hover:text-black transition-colors"
        title="Seguir equipos"
        aria-label="Gestionar equipos seguidos"
      >
        <span>👥</span>
        <span className="text-sm">Seguir Equipos</span>
        {followedTeams.length > 0 && (
          <span className="bg-[var(--accent,#00FF80)] text-black text-xs rounded-full px-2 py-0.5 font-bold">
            {followedTeams.length}
          </span>
        )}
      </button>

      {/* Current Games Followed Teams (Quick View) */}
      {currentGamesTeams.length > 0 && (
        <div className="mt-4 p-3 bg-[#111] border border-[#222] rounded-lg">
          <h3 className="text-sm font-semibold text-[var(--accent,#00FF80)] mb-2 flex items-center gap-2">
            <span>👥</span> Equipos Seguidos ({selectedGames.length} juego{selectedGames.length !== 1 ? 's' : ''})
          </h3>
          <div className="space-y-2">
            {currentGamesTeams.slice(0, 3).map((team) => (
              <div key={`${team.teamId}-${team.game}`} className="flex items-center gap-2 text-sm">
                <Image
                  src={team.teamLogo || getTeamImageUrl({ id: team.teamId, name: team.teamName, image_url: null })}
                  alt={team.teamName}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded"
                />
                <span className="text-white">{team.teamName}</span>
                <span className="text-xs text-gray-500 uppercase">{team.game}</span>
                <button
                  onClick={() => toggleNotifications(team.teamId, team.game)}
                  className={`text-xs ${team.notifications ? 'text-green-400' : 'text-gray-500'}`}
                  title={team.notifications ? "Notificaciones activas" : "Notificaciones desactivadas"}
                  aria-label={team.notifications ? "Desactivar notificaciones para " + team.teamName : "Activar notificaciones para " + team.teamName}
                  aria-pressed={team.notifications}
                >
                  {team.notifications ? "🔔" : "🔕"}
                </button>
              </div>
            ))}
            {currentGamesTeams.length > 3 && (
              <button
                onClick={() => setShowFollowModal(true)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Ver todos ({currentGamesTeams.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Follow Teams Modal */}
      {showFollowModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            // Cerrar el modal al hacer clic fuera de él
            if (e.target === e.currentTarget) setShowFollowModal(false);
          }}
        >
          <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden border border-[#333]">
            <div className="flex items-center justify-between mb-4">
              <h2 id="modal-title" className="text-lg font-bold text-white">Gestionar Equipos Seguidos</h2>
              <button
                onClick={() => setShowFollowModal(false)}
                className="text-gray-400 hover:text-white text-xl"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            {/* Search for new teams */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--accent,#00FF80)] mb-2">
                Buscar Equipos ({selectedGames.length} juego{selectedGames.length !== 1 ? 's' : ''} seleccionado{selectedGames.length !== 1 ? 's' : ''})
              </h3>
              {selectedGames.length === 0 ? (
                <p className="text-gray-400 text-sm">Selecciona al menos un juego para buscar equipos.</p>
              ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchTeams(e.target.value);
                  }}
                  placeholder="Buscar equipos..."
                  className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:border-[var(--accent,#00FF80)] focus:outline-none"
                />
              </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto bg-[#111] border border-[#333] rounded">
                  {searchResults.map((team) => {
                    // Detectar el juego del equipo desde los metadatos o usar el primer juego seleccionado
                    const teamGame = (team as Team & { _gameId?: string })._gameId || selectedGames[0];
                    const isFollowed = followedTeams.some(t => t.teamId === team.id && t.game === teamGame);
                    return (
                      <button
                        key={`${team.id}-${teamGame}`}
                        onClick={() => !isFollowed && followTeam(team, teamGame)}
                        disabled={isFollowed}
                        className={`w-full text-left p-2 flex items-center gap-2 hover:bg-[#222] border-b border-[#333] last:border-b-0 ${isFollowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Image
                          src={getTeamImageUrl({ id: team.id, name: team.name, image_url: team.logo })}
                          alt={team.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded"
                        />
                        <span className="text-white">{team.name}</span>
                        <span className="text-xs text-gray-500 uppercase ml-auto mr-2">{teamGame}</span>
                        {isFollowed && <span className="text-green-400 text-xs">✓ Seguido</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {isSearching && (
                <div className="mt-2 text-center text-gray-400" aria-live="polite">Buscando...</div>
              )}
              
        {!isSearching && searchTerm && searchResults.length === 0 && (
                <div className="mt-2 text-center text-gray-400" aria-live="polite">
          No se encontraron equipos con &quot;{searchTerm}&quot;
                </div>
              )}
            </div>

            {/* Currently Followed Teams */}
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {/* Selected Games Teams */}
              {currentGamesTeams.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--accent,#00FF80)] mb-2">
                    Juegos Seleccionados ({currentGamesTeams.length})
                  </h3>
                  <div className="space-y-2">
                    {currentGamesTeams.map((team) => (
                      <div key={`${team.teamId}-${team.game}`} className="flex items-center gap-3 p-2 bg-[#111] rounded border border-[#333]">
                        {team.teamLogo && (
                          <Image src={team.teamLogo} alt={team.teamName} width={24} height={24} className="w-6 h-6 rounded" />
                        )}
                        <span className="flex-1 text-white">{team.teamName}</span>
                        <span className="text-xs text-gray-500 uppercase">{team.game}</span>
                        <button
                          onClick={() => toggleNotifications(team.teamId, team.game)}
                          className={`p-1 rounded ${team.notifications ? 'text-green-400' : 'text-gray-500'}`}
                          title={team.notifications ? "Desactivar notificaciones" : "Activar notificaciones"}
                          aria-label={team.notifications ? "Desactivar notificaciones para " + team.teamName : "Activar notificaciones para " + team.teamName}
                          aria-pressed={team.notifications}
                        >
                          {team.notifications ? "🔔" : "🔕"}
                        </button>
                        <button
                          onClick={() => unfollowTeam(team.teamId, team.game)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Dejar de seguir"
                          aria-label={"Dejar de seguir a " + team.teamName}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Games Teams */}
              {otherGamesTeams.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">
                    Otros Juegos ({otherGamesTeams.length})
                  </h3>
                  <div className="space-y-2">
                    {otherGamesTeams.map((team) => (
                      <div key={`${team.teamId}-${team.game}`} className="flex items-center gap-3 p-2 bg-[#111] rounded border border-[#333] opacity-70">
                        {team.teamLogo && (
                          <Image src={team.teamLogo} alt={team.teamName} width={24} height={24} className="w-6 h-6 rounded" />
                        )}
                        <span className="flex-1 text-white">{team.teamName}</span>
                        <span className="text-xs text-gray-500 uppercase">{team.game}</span>
                        <button
                          onClick={() => toggleNotifications(team.teamId, team.game)}
                          className={`p-1 rounded ${team.notifications ? 'text-green-400' : 'text-gray-500'}`}
                          title={team.notifications ? "Desactivar notificaciones" : "Activar notificaciones"}
                          aria-label={team.notifications ? "Desactivar notificaciones para " + team.teamName : "Activar notificaciones para " + team.teamName}
                          aria-pressed={team.notifications}
                        >
                          {team.notifications ? "🔔" : "🔕"}
                        </button>
                        <button
                          onClick={() => unfollowTeam(team.teamId, team.game)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Dejar de seguir"
                          aria-label={"Dejar de seguir a " + team.teamName}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {followedTeams.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <span className="text-4xl">👥</span>
                  <p className="mt-2">No sigues ningún equipo aún</p>
                  <p className="text-sm">Busca equipos arriba para empezar a seguirlos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

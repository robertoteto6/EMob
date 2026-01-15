"use client";

import { memo } from 'react';
import Link from 'next/link';
import Star from './Star';
import TeamLogo from './TeamLogo';
import MatchStatus from './MatchStatus';
import Countdown from './Countdown';
import type { GameInfo } from '../lib/types';

// Interfaz para los detalles del partido.
interface MatchDetail {
  id: number;
  name: string;
  radiant: string;
  dire: string;
  radiant_id: number | null;
  dire_id: number | null;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  end_time: number | null;
  league: string;
  serie: string;
  tournament: string;
  radiant_win: boolean | null;
  games: GameInfo[];
}

// Props para el componente MatchCard
interface MatchCardProps {
  match: MatchDetail;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  lang: string;
}

// Componente de la tarjeta principal del partido, memoizado para optimizar.
const MatchCard = ({ match, isFavorite, onToggleFavorite, lang }: MatchCardProps) => {
  const isUpcoming = match.start_time > Date.now() / 1000;

  return (
    <div className="relative group mb-8" key="match-details-container">
      {/* Efecto de glow en el fondo */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur" aria-hidden="true" />

      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl backdrop-blur-sm">
        {/* Botón de favorito */}
        <div className="absolute top-6 right-6 z-10">
          <Star filled={isFavorite} onClick={onToggleFavorite} />
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Información del partido */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent,#00FF80)] to-green-400 mb-4 leading-tight">
                {match.name}
              </h1>

              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm shadow-lg">{match.league}</span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs border border-gray-600">{match.serie}</span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs border border-gray-600">{match.tournament}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  <span>{new Date(match.start_time * 1000).toLocaleString(lang)}</span>
                </div>
                {match.end_time && (
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                    <span>Finalizado: {new Date(match.end_time * 1000).toLocaleString(lang)}</span>
                  </div>
                )}
              </div>

              {isUpcoming && (
                <div className="mb-6">
                  <Countdown targetTime={match.start_time} />
                </div>
              )}
            </div>
          </div>

          {/* Marcador */}
          <div className="flex items-center justify-center xl:justify-end">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 shadow-xl min-w-fit">
              <div className="flex items-center gap-6 text-lg font-bold">
                {/* Equipo 1 */}
                <TeamSide team={match.radiant} teamId={match.radiant_id} score={match.radiant_score} isWinner={match.radiant_win === true} />

                {/* VS */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-bold text-gray-500">VS</span>
                  <MatchStatus match={match} />
                </div>

                {/* Equipo 2 */}
                <TeamSide team={match.dire} teamId={match.dire_id} score={match.dire_score} isWinner={match.radiant_win === false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-componente para mostrar la información de cada equipo
const TeamSide = ({ team, teamId, score, isWinner }: { team: string; teamId: number | null; score: number; isWinner: boolean }) => (
  <div className="flex flex-col items-center gap-3 min-w-[100px]">
    <Link href={`/esports/team/${teamId}`} aria-label={`Ver equipo ${team}`} className="group">
      <TeamLogo id={teamId} name={team} size={64} />
    </Link>
    <div className="text-center">
      <p className="text-white font-semibold text-sm mb-1 truncate max-w-[100px]" title={team}>
        {team}
      </p>
      <span className={`inline-block px-4 py-2 rounded-xl text-2xl font-bold shadow-lg transition-all duration-300 ${
        isWinner
          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white'
          : 'bg-gray-700 text-gray-300'
      }`}>
        {score}
      </span>
    </div>
  </div>
);

export default memo(MatchCard);

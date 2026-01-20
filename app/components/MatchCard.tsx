"use client";

import { memo } from 'react';
import Link from 'next/link';
import Star from './Star';
import TeamLogo from './TeamLogo';
import MatchStatus from './MatchStatus';
import Countdown from './Countdown';
import type { MatchDetail } from '../lib/types';

interface MatchCardProps {
  match: MatchDetail;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  lang: string;
}

const MatchCard = ({ match, isFavorite, onToggleFavorite, lang }: MatchCardProps) => {
  const now = Date.now() / 1000;
  const isUpcoming = match.start_time > now;
  const isLive = !isUpcoming && match.radiant_win === null;

  return (
    <div className="relative group mb-8" key="match-details-container">
      {/* Background Glow */}
      <div className={`absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur ${isLive ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse' : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600'}`} aria-hidden="true" />

      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl backdrop-blur-sm">
        {/* Favorite Button */}
        <div className="absolute top-6 right-6 z-10">
          <Star filled={isFavorite} onClick={onToggleFavorite} />
        </div>

        {/* Live Indicator Badge */}
        {isLive && (
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/50 backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-red-200 uppercase tracking-wider">En Vivo</span>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8 pt-8 xl:pt-0">
          {/* Match Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent,#00FF80)] to-green-400 mb-4 leading-tight">
                {match.name}
              </h1>

              <div className="flex flex-wrap gap-2 mb-6 items-center">
                {/* League Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 shadow-sm">
                  {/* <img src={leagueLogo} className="w-4 h-4" /> (If we had logos) */}
                  <span className="text-sm font-bold text-white tracking-wide">{match.league}</span>
                </div>

                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600"><path d="M9 18l6-6-6-6" /></svg>

                {/* Series Badge */}
                <span className="px-3 py-1.5 rounded-lg bg-gray-800/60 text-gray-300 text-xs font-medium border border-gray-700">{match.serie}</span>

                {/* Tournament Badge if different */}
                {match.tournament !== match.serie && (
                  <span className="px-3 py-1.5 rounded-lg bg-gray-800/60 text-gray-400 text-xs border border-gray-700">{match.tournament}</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-400 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-gray-800 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Fecha</p>
                    <span className="text-gray-200">{new Date(match.start_time * 1000).toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-gray-800 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Hora</p>
                    <span className="text-gray-200">{new Date(match.start_time * 1000).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {match.match_type && (
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-gray-800 text-gray-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Formato</p>
                      <span className="text-gray-200">{match.match_type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>

              {isUpcoming && (
                <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <Countdown targetTime={match.start_time} />
                </div>
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-center xl:justify-end">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl p-6 border border-gray-600 shadow-xl min-w-fit">
              <div className="flex items-center gap-6 lg:gap-10">
                {/* Team 1 */}
                <TeamSide team={match.radiant} teamId={match.radiant_id} score={match.radiant_score} isWinner={match.radiant_win === true} />

                {/* VS / Status */}
                <div className="flex flex-col items-center gap-3">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-600">VS</span>
                  <MatchStatus match={match} />
                </div>

                {/* Team 2 */}
                <TeamSide team={match.dire} teamId={match.dire_id} score={match.dire_score} isWinner={match.radiant_win === false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamSide = ({ team, teamId, score, isWinner }: { team: string; teamId: number | null; score: number; isWinner: boolean }) => {
  // Si no hay teamId válido, no mostramos el enlace
  const hasValidId = teamId !== null && teamId !== undefined;
  
  const TeamContent = () => (
    <div className={`p-4 rounded-2xl bg-gray-900/50 border transition-all duration-300 ${isWinner ? 'border-[var(--accent,#00FF80)] shadow-[0_0_20px_rgba(0,255,128,0.2)]' : 'border-gray-700 group-hover:border-gray-500'}`}>
      <TeamLogo id={teamId} name={team} size={80} />
    </div>
  );
  
  return (
    <div className="flex flex-col items-center gap-4 min-w-[120px]">
      {hasValidId ? (
        <Link href={`/esports/team/${teamId}`} aria-label={`Ver equipo ${team}`} className="group relative">
          <TeamContent />
          {isWinner && (
            <div className="absolute -top-3 -right-3 bg-[var(--accent,#00FF80)] text-black p-1.5 rounded-full shadow-lg" aria-label="Ganador">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </Link>
      ) : (
        <div className="group relative">
          <TeamContent />
          {isWinner && (
            <div className="absolute -top-3 -right-3 bg-[var(--accent,#00FF80)] text-black p-1.5 rounded-full shadow-lg" aria-label="Ganador">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </div>
      )}
      <div className="text-center">
        {hasValidId ? (
          <Link href={`/esports/team/${teamId}`} className="text-white font-bold text-lg mb-2 truncate max-w-[140px] block hover:text-[var(--accent,#00FF80)] transition-colors" title={team}>
            {team}
          </Link>
        ) : (
          <span className="text-white font-bold text-lg mb-2 truncate max-w-[140px] block" title={team}>
            {team}
          </span>
        )}
        <span className={`inline-block px-5 py-2 rounded-xl text-3xl font-black shadow-lg transition-all duration-300 font-mono ${isWinner
            ? 'bg-gradient-to-br from-[var(--accent,#00FF80)] to-green-600 text-black shadow-green-900/50'
            : 'bg-gray-800 text-gray-300 border border-gray-700'
          }`} aria-label={`Puntuación: ${score}`}>
          {score}
        </span>
      </div>
    </div>
  );
};

export default memo(MatchCard);

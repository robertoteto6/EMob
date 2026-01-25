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
  const hasLeague = Boolean(match.league);
  const leagueParams = new URLSearchParams();
  if (hasLeague) {
    leagueParams.set("view", "tournaments");
    if (match.game && match.game !== "unknown") leagueParams.set("game", match.game);
    leagueParams.set("league", match.league);
  }
  const leagueHref = hasLeague ? `/esports?${leagueParams.toString()}` : null;
  const tournamentLabel = match.tournament || match.serie;
  const tournamentHref = match.tournament_id ? `/esports/tournament/${match.tournament_id}` : leagueHref;
  const showSerieBadge = Boolean(match.serie && match.serie !== tournamentLabel);
  const hasSecondaryBadge = showSerieBadge || Boolean(tournamentLabel);

  return (
    <div className="relative group mb-4 sm:mb-6" key="match-details-container">
      {/* Background Glow - Sutil */}
      {isLive && (
        <div className="absolute -inset-px rounded-2xl bg-red-500/20 blur-sm" aria-hidden="true" />
      )}

      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 sm:p-6 hover:border-white/10 transition-colors duration-300">
        {/* Favorite Button */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10">
          <Star filled={isFavorite} onClick={onToggleFavorite} />
        </div>

        {/* Live Indicator Badge */}
        {isLive && (
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-red-300 uppercase tracking-wider">En Vivo</span>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 pt-6 xl:pt-0">
          {/* Match Info */}
          <div className="flex-1 space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl xl:text-3xl font-semibold text-white mb-4 leading-tight">
                {match.name}
              </h1>

              <div className="flex flex-wrap gap-2 mb-4 sm:mb-5 items-center">
                {/* League Badge */}
                {hasLeague && (
                  leagueHref ? (
                    <Link
                      href={leagueHref}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors"
                      aria-label={`Ver liga ${match.league}`}
                    >
                      <span className="text-sm font-medium text-white/80">{match.league}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-sm font-medium text-white/80">{match.league}</span>
                    </div>
                  )
                )}

                {hasLeague && hasSecondaryBadge && <span className="text-white/20">•</span>}

                {/* Series Badge */}
                {showSerieBadge && (
                  <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs font-medium border border-white/5">
                    {match.serie}
                  </span>
                )}

                {/* Tournament / League Bracket Badge */}
                {tournamentLabel && (
                  tournamentHref ? (
                    <Link
                      href={tournamentHref}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs border border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white/70 transition-colors"
                      aria-label={match.tournament_id ? `Ver torneo ${tournamentLabel}` : `Ver liga ${match.league}`}
                    >
                      {tournamentLabel}
                    </Link>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs border border-white/5">
                      {tournamentLabel}
                    </span>
                  )
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 text-xs sm:text-sm text-white/50 mb-4 sm:mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-white/5 text-white/40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-medium tracking-wider">Fecha</p>
                    <span className="text-white/70">{new Date(match.start_time * 1000).toLocaleDateString(lang, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-white/5 text-white/40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-medium tracking-wider">Hora</p>
                    <span className="text-white/70">{new Date(match.start_time * 1000).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {match.match_type && (
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-white/5 text-white/40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-medium tracking-wider">Formato</p>
                      <span className="text-white/70">{match.match_type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>

              {isUpcoming && (
                <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <Countdown targetTime={match.start_time} />
                </div>
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-center xl:justify-end">
            <div className="bg-white/[0.02] rounded-2xl p-3 sm:p-5 border border-white/5 min-w-fit">
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
                {/* Team 1 */}
                <TeamSide team={match.radiant} teamId={match.radiant_id} score={match.radiant_score} isWinner={match.radiant_win === true} />

                {/* VS / Status */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xl sm:text-2xl font-semibold text-white/20">VS</span>
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
  const hasValidId = teamId !== null && teamId !== undefined;
  
  const TeamContent = () => (
    <div className={`p-3 sm:p-4 rounded-xl bg-white/[0.02] border transition-colors duration-200 ${isWinner ? 'border-white/20' : 'border-white/5 group-hover:border-white/10'}`}>
      <div className="origin-center scale-90 sm:scale-100">
        <TeamLogo id={teamId} name={team} size={80} />
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 min-w-[90px] sm:min-w-[110px]">
      {hasValidId ? (
        <Link href={`/esports/team/${teamId}`} aria-label={`Ver equipo ${team}`} className="group relative">
          <TeamContent />
          {isWinner && (
            <div className="absolute -top-2 -right-2 bg-white text-black p-1 rounded-full" aria-label="Ganador">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </Link>
      ) : (
        <div className="group relative">
          <TeamContent />
          {isWinner && (
            <div className="absolute -top-2 -right-2 bg-white text-black p-1 rounded-full" aria-label="Ganador">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </div>
      )}
      <div className="text-center">
        {hasValidId ? (
          <Link href={`/esports/team/${teamId}`} className="text-white font-medium text-xs sm:text-sm mb-2 truncate max-w-[96px] sm:max-w-[120px] block hover:text-white/80 transition-colors" title={team}>
            {team}
          </Link>
        ) : (
          <span className="text-white font-medium text-xs sm:text-sm mb-2 truncate max-w-[96px] sm:max-w-[120px] block" title={team}>
            {team}
          </span>
        )}
        <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xl sm:text-2xl font-semibold transition-colors duration-200 font-mono ${isWinner
            ? 'bg-white text-black'
            : 'bg-white/5 text-white/60 border border-white/5'
          }`} aria-label={`Puntuación: ${score}`}>
          {score}
        </span>
      </div>
    </div>
  );
};

export default memo(MatchCard);

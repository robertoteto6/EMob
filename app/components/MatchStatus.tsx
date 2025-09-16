"use client";

import { memo, useMemo } from 'react';
import LiveBadge from './LiveBadge';

// Interfaces para los datos del partido, deberían moverse a un archivo de tipos compartido
interface GameInfo {
  status: string;
  position: number;
  begin_at: string | null;
}

interface MatchDetail {
  start_time: number;
  radiant_win: boolean | null;
  radiant: string;
  dire: string;
  games: GameInfo[];
}

// Props para el componente MatchStatus
interface MatchStatusProps {
  match: MatchDetail;
}

type StatusInfo =
  | {
      type: 'live';
      content: string;
      detail: string | null;
      time: string | null;
      className: string;
    }
  | {
      type: 'finished' | 'upcoming';
      content: string;
      detail: null;
      time: null;
      className: string;
    };

// Componente para mostrar el estado del partido con diseño mejorado
const MatchStatus = ({ match }: MatchStatusProps) => {
  const statusInfo = useMemo<StatusInfo>(() => {
    const now = Date.now() / 1000;
    const isLive = match.start_time <= now && match.radiant_win === null;

    if (isLive) {
      const runningGame = match.games.find(g => g.status === "running");
      const startTime = runningGame?.begin_at ? new Date(runningGame.begin_at).getTime() : match.start_time * 1000;
      const minutes = Math.max(0, Math.floor((Date.now() - startTime) / 60000));

      return {
        type: 'live' as const,
        content: 'EN VIVO',
        detail: runningGame ? `Juego ${runningGame.position}` : 'Tiempo real',
        time: minutes > 0 ? `${minutes}m` : null,
        className: '',
      };
    }

    if (match.radiant_win !== null) {
      const winner = match.radiant_win ? match.radiant : match.dire;
      return {
        type: 'finished' as const,
        content: `Ganó ${winner}`,
        time: null,
        detail: null,
        className: 'bg-gradient-to-r from-green-600 to-green-500 text-white border-green-400',
      };
    }

    return {
      type: 'upcoming' as const,
      content: 'Por jugar',
      time: null,
      detail: null,
      className: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400',
    };
  }, [match]);

  if (statusInfo.type === 'live') {
    return (
      <div
        className="flex flex-col items-center gap-1 text-center"
        role="status"
        aria-label={`Estado del partido: ${statusInfo.content}${statusInfo.detail ? ` ${statusInfo.detail}` : ''}${statusInfo.time ? ` ${statusInfo.time}` : ''}`}
      >
        <LiveBadge className="pointer-events-none" aria-label={statusInfo.content} />
        {(statusInfo.detail || statusInfo.time) && (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
            {statusInfo.detail && <span>{statusInfo.detail}</span>}
            {statusInfo.time && (
              <span className="flex items-center gap-1" aria-hidden="true">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-200/80"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                {statusInfo.time}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  const renderIcon = () => {
    switch (statusInfo.type) {
      case 'upcoming':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        );
      case 'finished':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-lg border ${statusInfo.className}`}
      role="status"
      aria-label={`Estado del partido: ${statusInfo.content}${statusInfo.time ? ` ${statusInfo.time}` : ''}`}
    >
      {renderIcon()}
      <span>{statusInfo.content}</span>
      {statusInfo.time && <span className="text-red-200">{statusInfo.time}</span>}
    </div>
  );
};

export default memo(MatchStatus);

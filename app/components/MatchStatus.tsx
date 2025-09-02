"use client";

import { memo, useMemo } from 'react';

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

// Componente para mostrar el estado del partido con diseño mejorado
const MatchStatus = ({ match }: MatchStatusProps) => {
  const statusInfo = useMemo(() => {
    const now = Date.now() / 1000;
    const isLive = match.start_time <= now && match.radiant_win === null;

    if (isLive) {
      const runningGame = match.games.find(g => g.status === "running");
      const startTime = runningGame?.begin_at ? new Date(runningGame.begin_at).getTime() : match.start_time * 1000;
      const minutes = Math.floor((Date.now() - startTime) / 60000);

      return {
        type: 'live',
        content: runningGame ? `EN VIVO - Juego ${runningGame.position}` : 'EN VIVO',
        time: `(${minutes}m)`,
        className: 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400 animate-pulse'
      };
    }

    if (match.radiant_win !== null) {
      const winner = match.radiant_win ? match.radiant : match.dire;
      return {
        type: 'finished',
        content: `Ganó ${winner}`,
        time: null,
        className: 'bg-gradient-to-r from-green-600 to-green-500 text-white border-green-400'
      };
    }

    return {
      type: 'upcoming',
      content: 'Por jugar',
      time: null,
      className: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400'
    };
  }, [match]);

  const renderIcon = () => {
    switch (statusInfo.type) {
      case 'live':
        return <div className="w-2 h-2 bg-white rounded-full animate-ping" aria-hidden="true" />;
      case 'upcoming':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        );
      case 'finished':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
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
      aria-label={`Estado del partido: ${statusInfo.content} ${statusInfo.time || ''}`}
    >
      {renderIcon()}
      <span>{statusInfo.content}</span>
      {statusInfo.time && <span className="text-red-200">{statusInfo.time}</span>}
    </div>
  );
};

export default memo(MatchStatus);

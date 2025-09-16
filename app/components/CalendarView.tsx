"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import LiveBadge from "./LiveBadge";

interface CalendarMatch {
  id: number;
  title: string;
  start_time: number;
  radiant: string;
  dire: string;
  game: string;
  league: string;
  isLive: boolean;
  isFavorite: boolean;
}

interface CalendarViewProps {
  matches: CalendarMatch[];
  onMonthChange?: (year: number, month: number) => void;
}

export default function CalendarView({ matches, onMonthChange }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Obtener días del mes
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Crear grid del calendario
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Días del mes anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: lastDayOfPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, lastDayOfPrevMonth - i)
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, day)
      });
    }
    
    // Días del mes siguiente para completar el grid
    const remainingDays = 42 - days.length; // 6 filas x 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, day)
      });
    }
    
    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfMonth, lastDayOfPrevMonth]);

  // Organizar partidos por día
  const matchesByDay = useMemo(() => {
    const groupedMatches: { [key: string]: CalendarMatch[] } = {};
    
    matches.forEach(match => {
      const matchDate = new Date(match.start_time * 1000);
      const dayKey = `${matchDate.getFullYear()}-${matchDate.getMonth()}-${matchDate.getDate()}`;
      
      if (!groupedMatches[dayKey]) {
        groupedMatches[dayKey] = [];
      }
      groupedMatches[dayKey].push(match);
    });
    
    return groupedMatches;
  }, [matches]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentYear, currentMonth + direction, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
  };

  const getMatchesForDay = (date: Date) => {
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return matchesByDay[dayKey] || [];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--accent,#00FF80)]">
          📅 Calendario de Partidos
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
            aria-label="Mes anterior"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-white min-w-[180px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
            aria-label="Mes siguiente"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Nombres de los días */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((calendarDay, index) => {
          const dayMatches = getMatchesForDay(calendarDay.date);
          const hasMatches = dayMatches.length > 0;
          const hasLiveMatches = dayMatches.some(m => m.isLive);
          const hasFavorites = dayMatches.some(m => m.isFavorite);

          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-1 border border-[#333] rounded-lg cursor-pointer transition-all
                ${calendarDay.isCurrentMonth ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a] opacity-50'}
                ${isToday(calendarDay.date) ? 'ring-2 ring-[var(--accent,#00FF80)]' : ''}
                ${selectedDate?.toDateString() === calendarDay.date.toDateString() ? 'bg-[#222]' : ''}
                ${hasMatches ? 'hover:bg-[#222]' : 'hover:bg-[#181818]'}
              `}
              onClick={() => setSelectedDate(calendarDay.date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`
                  text-sm font-medium
                  ${calendarDay.isCurrentMonth ? 'text-white' : 'text-gray-500'}
                  ${isToday(calendarDay.date) ? 'text-[var(--accent,#00FF80)] font-bold' : ''}
                `}>
                  {calendarDay.day}
                </span>
                {hasMatches && (
                  <div className="flex gap-1">
                    {hasLiveMatches && (
                      <div
                        className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                        title="Partidos en vivo"
                      />
                    )}
                    {hasFavorites && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Partidos favoritos" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Indicadores de partidos */}
              {hasMatches && (
                <div className="space-y-1">
                  {dayMatches.slice(0, 2).map((match, matchIndex) => (
                    <div
                      key={matchIndex}
                      className={`
                        text-xs p-1 rounded truncate transition-shadow
                        ${match.isLive
                          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-[0_0_12px_rgba(239,68,68,0.35)] animate-pulse'
                          : 'bg-[#333] text-gray-300'}
                        ${match.isFavorite ? 'ring-1 ring-yellow-400' : ''}
                      `}
                      title={`${match.radiant} vs ${match.dire}`}
                    >
                      {match.radiant.slice(0, 6)} vs {match.dire.slice(0, 6)}
                    </div>
                  ))}
                  {dayMatches.length > 2 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{dayMatches.length - 2} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detalles del día seleccionado */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
          <h4 className="text-lg font-semibold text-[var(--accent,#00FF80)] mb-3">
            Partidos del {selectedDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          
          {getMatchesForDay(selectedDate).length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No hay partidos programados para este día
            </p>
          ) : (
            <div className="space-y-3">
              {getMatchesForDay(selectedDate).map((match) => (
                <Link
                  key={match.id}
                  href={`/esports/${match.id}`}
                  className="block p-3 bg-[#111] border border-[#333] rounded-lg hover:border-[var(--accent,#00FF80)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {match.radiant} vs {match.dire}
                        </span>
                        {match.isLive && (
                          <LiveBadge size="sm" className="pointer-events-none" />
                        )}
                        {match.isFavorite && (
                          <span className="text-yellow-400" title="Favorito">⭐</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {match.league} • {match.game.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-sm text-[var(--accent,#00FF80)]">
                      {new Date(match.start_time * 1000).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
          <span>Partidos en vivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <span>Partidos favoritos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-[var(--accent,#00FF80)] rounded-full"></div>
          <span>Día actual</span>
        </div>
      </div>
    </div>
  );
}

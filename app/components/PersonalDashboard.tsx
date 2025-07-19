"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  totalMatches: number;
  favoriteMatches: number;
  matchesToday: number;
  uniqueTeams: number;
  uniqueLeagues: number;
  predictionsCorrect: number;
  predictionsTotal: number;
  followedTeams: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  color: string;
}

interface PersonalDashboardProps {
  stats: DashboardStats;
  onQuickAction?: (actionId: string) => void;
}

export default function PersonalDashboard({ stats, onQuickAction }: PersonalDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const quickActions: QuickAction[] = [
    {
      id: "view-favorites",
      label: "Ver Favoritos",
      icon: "⭐",
      action: () => onQuickAction?.("view-favorites"),
      color: "bg-yellow-600"
    },
    {
      id: "live-matches",
      label: "Partidos en Vivo",
      icon: "🔴",
      action: () => onQuickAction?.("live-matches"),
      color: "bg-red-600"
    },
    {
      id: "upcoming-today",
      label: "Próximos Hoy",
      icon: "📅",
      action: () => onQuickAction?.("upcoming-today"),
      color: "bg-blue-600"
    },
    {
      id: "tournament-calendar",
      label: "Calendario",
      icon: "🗓️",
      action: () => onQuickAction?.("tournament-calendar"),
      color: "bg-green-600"
    }
  ];

  const statCards = [
    {
      title: "Partidos Totales",
      value: stats.totalMatches,
      icon: "🎮",
      color: "text-blue-400"
    },
    {
      title: "Favoritos",
      value: stats.favoriteMatches,
      icon: "⭐",
      color: "text-yellow-400"
    },
    {
      title: "Hoy",
      value: stats.matchesToday,
      icon: "📅",
      color: "text-green-400"
    },
    {
      title: "Equipos",
      value: stats.uniqueTeams,
      icon: "👥",
      color: "text-purple-400"
    },
    {
      title: "Ligas",
      value: stats.uniqueLeagues,
      icon: "🏆",
      color: "text-orange-400"
    },
    {
      title: "Predicciones",
      value: stats.predictionsTotal > 0 ? `${Math.round((stats.predictionsCorrect / stats.predictionsTotal) * 100)}%` : "0%",
      icon: "🎯",
      color: "text-cyan-400"
    }
  ];

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--accent,#00FF80)] flex items-center gap-2">
          <span>📊</span> Dashboard Personal
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label={isExpanded ? "Contraer" : "Expandir"}
        >
          {isExpanded ? "📖" : "📕"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-[#181c24] rounded-lg p-3 border border-[#333] hover:border-[var(--accent,#00FF80)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-gray-400">{stat.title}</span>
            </div>
            <div className={`text-lg font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {isExpanded && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.color} hover:opacity-80 text-white rounded-lg p-3 flex flex-col items-center gap-1 transition-opacity`}
                title={action.label}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Actividad Reciente</h3>
            <div className="bg-[#181c24] rounded-lg p-3 border border-[#333]">
              <div className="space-y-2 text-xs text-gray-400">
                <div>• Último partido visto: {new Date().toLocaleDateString()}</div>
                <div>• Favoritos agregados: {stats.favoriteMatches}</div>
                <div>• Predicciones realizadas: {stats.predictionsTotal}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerDetail, GameSpecificStats } from '../../lib/types/player';
import { SUPPORTED_GAMES } from '../../lib/gameConfig';

interface PlayerStatsProgressiveProps {
  player: PlayerDetail;
}

type StatsLevel = 'basic' | 'intermediate' | 'advanced';

// Game-specific stat configurations
const GAME_STATS_CONFIG: Record<string, { 
  basic: { key: string; label: string; icon: string; format?: (v: number) => string }[];
  intermediate: { key: string; label: string; icon: string; format?: (v: number) => string }[];
  advanced: { key: string; label: string; icon: string; format?: (v: number) => string }[];
}> = {
  lol: {
    basic: [
      { key: 'kills', label: 'Kills', icon: '⚔️' },
      { key: 'deaths', label: 'Deaths', icon: '💀' },
      { key: 'assists', label: 'Assists', icon: '🤝' },
      { key: 'kda', label: 'KDA', icon: '📊', format: (v) => v.toFixed(2) },
    ],
    intermediate: [
      { key: 'cs_per_min', label: 'CS/min', icon: '🪙', format: (v) => v.toFixed(1) },
      { key: 'vision_score', label: 'Vision Score', icon: '👁️' },
      { key: 'gold_per_min', label: 'Oro/min', icon: '💰', format: (v) => v.toFixed(0) },
      { key: 'damage_share', label: 'Daño %', icon: '🔥', format: (v) => `${v.toFixed(1)}%` },
    ],
    advanced: [
      { key: 'first_blood_rate', label: 'First Blood %', icon: '🩸', format: (v) => `${v.toFixed(1)}%` },
      { key: 'solo_kills', label: 'Solo Kills/game', icon: '🎯', format: (v) => v.toFixed(2) },
      { key: 'dmg_per_gold', label: 'DMG/Gold', icon: '⚡', format: (v) => v.toFixed(2) },
      { key: 'objective_control', label: 'Obj Control %', icon: '🐉', format: (v) => `${v.toFixed(1)}%` },
      { key: 'lane_dominance', label: 'Lane Dom.', icon: '🏆', format: (v) => `${v.toFixed(1)}%` },
    ],
  },
  dota2: {
    basic: [
      { key: 'kills', label: 'Kills', icon: '⚔️' },
      { key: 'deaths', label: 'Deaths', icon: '💀' },
      { key: 'assists', label: 'Assists', icon: '🤝' },
      { key: 'kda', label: 'KDA', icon: '📊', format: (v) => v.toFixed(2) },
    ],
    intermediate: [
      { key: 'last_hits', label: 'Last Hits/min', icon: '🪙', format: (v) => v.toFixed(1) },
      { key: 'denies', label: 'Denies/game', icon: '🚫', format: (v) => v.toFixed(1) },
      { key: 'gpm', label: 'GPM', icon: '💰', format: (v) => v.toFixed(0) },
      { key: 'xpm', label: 'XPM', icon: '⭐', format: (v) => v.toFixed(0) },
    ],
    advanced: [
      { key: 'tower_damage', label: 'Tower DMG/game', icon: '🏰', format: (v) => v.toFixed(0) },
      { key: 'hero_damage', label: 'Hero DMG/min', icon: '🔥', format: (v) => v.toFixed(0) },
      { key: 'stun_duration', label: 'Stun/game (s)', icon: '😵', format: (v) => v.toFixed(1) },
      { key: 'net_worth_lead', label: 'NW Lead @15', icon: '📈', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}` },
      { key: 'teamfight_participation', label: 'TF Part %', icon: '👥', format: (v) => `${v.toFixed(1)}%` },
    ],
  },
  csgo: {
    basic: [
      { key: 'kills', label: 'Kills', icon: '⚔️' },
      { key: 'deaths', label: 'Deaths', icon: '💀' },
      { key: 'kd_ratio', label: 'K/D Ratio', icon: '📊', format: (v) => v.toFixed(2) },
      { key: 'headshot_pct', label: 'HS%', icon: '🎯', format: (v) => `${v.toFixed(1)}%` },
    ],
    intermediate: [
      { key: 'adr', label: 'ADR', icon: '🔥', format: (v) => v.toFixed(1) },
      { key: 'kast', label: 'KAST%', icon: '📈', format: (v) => `${v.toFixed(1)}%` },
      { key: 'rating', label: 'Rating 2.0', icon: '⭐', format: (v) => v.toFixed(2) },
      { key: 'clutch_wins', label: 'Clutches', icon: '🏆' },
    ],
    advanced: [
      { key: 'opening_kills', label: 'Opening K/R', icon: '🚀', format: (v) => v.toFixed(2) },
      { key: 'flash_assists', label: 'Flash Assists', icon: '💡', format: (v) => v.toFixed(1) },
      { key: 'utility_damage', label: 'Util DMG', icon: '💥', format: (v) => v.toFixed(0) },
      { key: 'awp_kills', label: 'AWP Kills/map', icon: '🔫', format: (v) => v.toFixed(1) },
      { key: 'trade_rate', label: 'Trade Rate', icon: '🔄', format: (v) => `${v.toFixed(1)}%` },
    ],
  },
  r6siege: {
    basic: [
      { key: 'kills', label: 'Kills', icon: '⚔️' },
      { key: 'deaths', label: 'Deaths', icon: '💀' },
      { key: 'kd_ratio', label: 'K/D', icon: '📊', format: (v) => v.toFixed(2) },
      { key: 'plants', label: 'Plants', icon: '💣' },
    ],
    intermediate: [
      { key: 'entry_kills', label: 'Entry K/R', icon: '🚪', format: (v) => v.toFixed(2) },
      { key: 'clutch_rate', label: 'Clutch %', icon: '🏆', format: (v) => `${v.toFixed(1)}%` },
      { key: 'survival_rate', label: 'Survival %', icon: '❤️', format: (v) => `${v.toFixed(1)}%` },
      { key: 'headshot_pct', label: 'HS%', icon: '🎯', format: (v) => `${v.toFixed(1)}%` },
    ],
    advanced: [
      { key: 'opening_death_rate', label: 'Open Death %', icon: '💀', format: (v) => `${v.toFixed(1)}%` },
      { key: 'plants_per_round', label: 'Plants/Round', icon: '💣', format: (v) => v.toFixed(2) },
      { key: 'utility_usage', label: 'Util Use %', icon: '🔧', format: (v) => `${v.toFixed(1)}%` },
      { key: 'trade_differential', label: 'Trade Diff', icon: '⚖️', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}` },
    ],
  },
  ow: {
    basic: [
      { key: 'eliminations', label: 'Elims', icon: '⚔️' },
      { key: 'deaths', label: 'Deaths', icon: '💀' },
      { key: 'damage', label: 'Damage', icon: '🔥', format: (v) => v.toFixed(0) },
      { key: 'healing', label: 'Healing', icon: '💚', format: (v) => v.toFixed(0) },
    ],
    intermediate: [
      { key: 'final_blows', label: 'Final Blows', icon: '🎯' },
      { key: 'elims_per_10', label: 'Elims/10min', icon: '📊', format: (v) => v.toFixed(1) },
      { key: 'deaths_per_10', label: 'Deaths/10min', icon: '💀', format: (v) => v.toFixed(1) },
      { key: 'ult_charge_rate', label: 'Ult Rate', icon: '⚡', format: (v) => `${v.toFixed(1)}%` },
    ],
    advanced: [
      { key: 'first_picks', label: 'First Picks/map', icon: '🎯', format: (v) => v.toFixed(1) },
      { key: 'ult_efficiency', label: 'Ult Efficiency', icon: '💫', format: (v) => `${v.toFixed(1)}%` },
      { key: 'objective_time', label: 'Obj Time (s)', icon: '🏁', format: (v) => v.toFixed(0) },
      { key: 'dmg_blocked', label: 'DMG Blocked', icon: '🛡️', format: (v) => v.toFixed(0) },
    ],
  },
};

function StatCard({ 
  label, 
  value, 
  icon, 
  trend,
  level 
}: { 
  label: string; 
  value: string | number; 
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  level: StatsLevel;
}) {
  const levelColors = {
    basic: 'from-green-900/40 to-green-800/40 border-green-500/30',
    intermediate: 'from-blue-900/40 to-blue-800/40 border-blue-500/30',
    advanced: 'from-purple-900/40 to-purple-800/40 border-purple-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative p-4 rounded-xl bg-gradient-to-br ${levelColors[level]} border backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-green-500/30 text-green-400' :
            trend === 'down' ? 'bg-red-500/30 text-red-400' :
            'bg-gray-500/30 text-gray-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </motion.div>
  );
}

function GameStatsSection({ gameStats, selectedLevel }: { gameStats: GameSpecificStats; selectedLevel: StatsLevel }) {
  const config = GAME_STATS_CONFIG[gameStats.game];
  if (!config) return null;

  const gameConfig = SUPPORTED_GAMES.find(g => g.apiName === gameStats.game || g.id === gameStats.game);
  
  const statsToShow = selectedLevel === 'basic' 
    ? config.basic 
    : selectedLevel === 'intermediate' 
    ? [...config.basic, ...config.intermediate]
    : [...config.basic, ...config.intermediate, ...config.advanced];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700"
    >
      {/* Game header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gameConfig?.gradient || 'from-gray-600 to-gray-700'}`}>
          <span className="text-2xl">{gameStats.gameIcon}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{gameStats.gameName}</h3>
          <p className="text-sm text-gray-400">Estadísticas detalladas</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsToShow.map((statConfig, _idx) => {
          const statData = gameStats.stats.find(s => s.key === statConfig.key);
          if (!statData) return null;
          
          const value = statConfig.format 
            ? statConfig.format(Number(statData.value)) 
            : statData.value;
          
          const level = config.basic.find(s => s.key === statConfig.key) ? 'basic' :
                       config.intermediate.find(s => s.key === statConfig.key) ? 'intermediate' : 'advanced';

          return (
            <StatCard
              key={statConfig.key}
              label={statConfig.label}
              value={value}
              icon={statConfig.icon}
              trend={statData.trend}
              level={level}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

export default function PlayerStatsProgressive({ player }: PlayerStatsProgressiveProps) {
  const [selectedLevel, setSelectedLevel] = useState<StatsLevel>('basic');

  const levels: { id: StatsLevel; label: string; icon: string; description: string }[] = [
    { id: 'basic', label: 'Básico', icon: '📊', description: 'Stats esenciales' },
    { id: 'intermediate', label: 'Intermedio', icon: '📈', description: 'Análisis detallado' },
    { id: 'advanced', label: 'Avanzado', icon: '🔬', description: 'Stats pro' },
  ];

  return (
    <section className="mb-12">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/30">
              <span className="text-4xl">📊</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                Estadísticas Detalladas
              </h2>
              <p className="text-gray-400">
                De básico a profesional - selecciona tu nivel de detalle
              </p>
            </div>
          </div>
        </div>

        {/* Level selector */}
        <div className="flex gap-3 mt-6">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all ${
                selectedLevel === level.id
                  ? level.id === 'basic' ? 'bg-green-600 text-white shadow-lg shadow-green-500/30' :
                    level.id === 'intermediate' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' :
                    'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{level.icon}</span>
              <div className="text-left">
                <div className="font-bold">{level.label}</div>
                <div className="text-xs opacity-80">{level.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Level description */}
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`mt-4 p-4 rounded-xl border ${
            selectedLevel === 'basic' ? 'bg-green-900/20 border-green-500/30 text-green-300' :
            selectedLevel === 'intermediate' ? 'bg-blue-900/20 border-blue-500/30 text-blue-300' :
            'bg-purple-900/20 border-purple-500/30 text-purple-300'
          }`}
        >
          <p className="text-sm">
            {selectedLevel === 'basic' && '📊 Estadísticas fundamentales: K/D/A, winrate, y métricas esenciales para entender el rendimiento general.'}
            {selectedLevel === 'intermediate' && '📈 Análisis intermedio: CS/min, visión, economía, y estadísticas para jugadores que quieren mejorar.'}
            {selectedLevel === 'advanced' && '🔬 Stats profesionales: Métricas avanzadas utilizadas por analistas y coaches para evaluación competitiva.'}
          </p>
        </motion.div>
      </motion.div>

      {/* General Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📈</span> Resumen General
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            label="Win Rate"
            value={`${player.win_rate}%`}
            icon="🏆"
            level="basic"
          />
          <StatCard
            label="Partidos"
            value={player.total_matches}
            icon="🎮"
            level="basic"
          />
          <StatCard
            label="Título Score"
            value={player.title_score}
            icon="⭐"
            level="basic"
          />
          {player.age && (
            <StatCard
              label="Edad"
              value={`${player.age} años`}
              icon="📅"
              level="basic"
            />
          )}
          {player.years_active && (
            <StatCard
              label="Años Activo"
              value={player.years_active}
              icon="⏱️"
              level="intermediate"
            />
          )}
          {player.total_earnings && (
            <StatCard
              label="Ganancias"
              value={`$${(player.total_earnings / 1000).toFixed(0)}K`}
              icon="💰"
              level="advanced"
            />
          )}
        </div>
      </motion.div>

      {/* Game-specific Stats */}
      {player.game_stats && player.game_stats.length > 0 ? (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {player.game_stats.map((gameStats, idx) => (
              <motion.div
                key={gameStats.game}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <GameStatsSection 
                  gameStats={gameStats} 
                  selectedLevel={selectedLevel}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-gray-700"
        >
          <span className="text-6xl mb-4 block">📊</span>
          <p className="text-gray-400 mb-2">Estadísticas por juego no disponibles</p>
          <p className="text-sm text-gray-500">Las estadísticas detalladas aparecerán cuando haya más datos disponibles</p>
        </motion.div>
      )}

      {/* Signature Heroes/Agents (if available) */}
      {player.signature_heroes && player.signature_heroes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🎭</span> Personajes Signature
          </h3>
          <div className="flex flex-wrap gap-3">
            {player.signature_heroes.map((hero, idx) => (
              <motion.div
                key={hero}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="px-4 py-2 bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/30 rounded-xl text-white font-medium"
              >
                {hero}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}

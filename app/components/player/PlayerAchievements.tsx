'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement, getAchievementRarityColor } from '../../lib/types/player';

interface PlayerAchievementsProps {
  achievements: Achievement[];
  playerName: string;
  isVeteran?: boolean;
}

// Icons for achievement types
const ACHIEVEMENT_TYPE_ICONS: Record<Achievement['type'], { icon: string; label: string }> = {
  championship: { icon: '🏆', label: 'Campeonato' },
  mvp: { icon: '⭐', label: 'MVP' },
  finals: { icon: '🥇', label: 'Finalista' },
  allstar: { icon: '🌟', label: 'All-Star' },
  record: { icon: '📊', label: 'Récord' },
  milestone: { icon: '🎯', label: 'Hito' },
};

// Rarity labels
const RARITY_LABELS: Record<Achievement['rarity'], string> = {
  legendary: 'Legendario',
  epic: 'Épico',
  rare: 'Raro',
  common: 'Común',
};

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = getAchievementRarityColor(achievement.rarity);
  const typeInfo = ACHIEVEMENT_TYPE_ICONS[achievement.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className={`relative cursor-pointer group overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm shadow-lg ${colors.glow} transition-all duration-300`}
    >
      {/* Shine effect for legendary */}
      {achievement.rarity === 'legendary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -skew-x-12"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      )}

      <div className="relative p-5">
        {/* Header with icon and rarity */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${colors.bg} border ${colors.border} shadow-inner`}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              {achievement.icon || typeInfo.icon}
            </motion.div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                {typeInfo.label}
              </span>
              <h4 className="text-white font-bold text-lg leading-tight">
                {achievement.title}
              </h4>
            </div>
          </div>
          
          {/* Rarity badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.text} bg-black/30 border ${colors.border}`}>
            {RARITY_LABELS[achievement.rarity]}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
          {achievement.description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {achievement.tournament && (
            <span className="flex items-center gap-1">
              <span>🏟️</span>
              {achievement.tournament}
            </span>
          )}
          {achievement.team && (
            <span className="flex items-center gap-1">
              <span>👥</span>
              {achievement.team}
            </span>
          )}
          {achievement.date && (
            <span className="flex items-center gap-1">
              <span>📅</span>
              {new Date(achievement.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-700/50"
            >
              <div className="text-sm text-gray-300">
                <p className="mb-2">
                  <span className="font-semibold text-white">Detalles: </span>
                  {achievement.description}
                </p>
                {achievement.date && (
                  <p>
                    <span className="font-semibold text-white">Fecha: </span>
                    {new Date(achievement.date).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom accent line */}
      <div className={`h-1 bg-gradient-to-r ${
        achievement.rarity === 'legendary' ? 'from-yellow-500 via-orange-500 to-red-500' :
        achievement.rarity === 'epic' ? 'from-purple-500 via-pink-500 to-purple-500' :
        achievement.rarity === 'rare' ? 'from-blue-500 via-cyan-500 to-blue-500' :
        'from-gray-500 via-gray-400 to-gray-500'
      }`} />
    </motion.div>
  );
}

export default function PlayerAchievements({ achievements, playerName, isVeteran }: PlayerAchievementsProps) {
  const [filter, setFilter] = useState<Achievement['rarity'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<Achievement['type'] | 'all'>('all');

  // Sort achievements by rarity (legendary first) then by date
  const sortedAchievements = [...achievements].sort((a, b) => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const filteredAchievements = sortedAchievements.filter(a => {
    if (filter !== 'all' && a.rarity !== filter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  // Stats
  const legendaryCount = achievements.filter(a => a.rarity === 'legendary').length;
  const epicCount = achievements.filter(a => a.rarity === 'epic').length;
  const championshipCount = achievements.filter(a => a.type === 'championship').length;
  const mvpCount = achievements.filter(a => a.type === 'mvp').length;

  if (achievements.length === 0) {
    return null;
  }

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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30">
              <span className="text-4xl">🏆</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                Palmarés y Logros
              </h2>
              <p className="text-gray-400">
                {achievements.length} logros en la carrera de {playerName}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3">
            {championshipCount > 0 && (
              <div className="px-4 py-2 rounded-xl bg-yellow-900/30 border border-yellow-500/30">
                <span className="text-2xl font-bold text-yellow-400">{championshipCount}</span>
                <span className="text-xs text-yellow-300 ml-2">🏆 Títulos</span>
              </div>
            )}
            {mvpCount > 0 && (
              <div className="px-4 py-2 rounded-xl bg-purple-900/30 border border-purple-500/30">
                <span className="text-2xl font-bold text-purple-400">{mvpCount}</span>
                <span className="text-xs text-purple-300 ml-2">⭐ MVPs</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Rareza:</span>
            <div className="flex gap-1">
              {(['all', 'legendary', 'epic', 'rare', 'common'] as const).map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setFilter(rarity)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filter === rarity
                      ? rarity === 'legendary' ? 'bg-yellow-600 text-white' :
                        rarity === 'epic' ? 'bg-purple-600 text-white' :
                        rarity === 'rare' ? 'bg-blue-600 text-white' :
                        rarity === 'common' ? 'bg-gray-600 text-white' :
                        'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {rarity === 'all' ? 'Todos' : RARITY_LABELS[rarity]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tipo:</span>
            <div className="flex gap-1">
              {(['all', 'championship', 'mvp', 'finals', 'allstar', 'record', 'milestone'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === type
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {type === 'all' ? 'Todos' : ACHIEVEMENT_TYPE_ICONS[type].icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard 
              key={achievement.id} 
              achievement={achievement} 
              index={index} 
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredAchievements.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <span className="text-6xl mb-4 block">🔍</span>
          <p className="text-gray-400">No se encontraron logros con estos filtros</p>
        </motion.div>
      )}
    </section>
  );
}

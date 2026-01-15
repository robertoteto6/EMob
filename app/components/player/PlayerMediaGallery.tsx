'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItem } from '../../lib/types/player';

interface PlayerMediaGalleryProps {
  media: MediaItem[];
  playerName: string;
}

type TabType = 'all' | 'images' | 'videos' | 'highlights';

function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
      {!isLoaded && (
        <div 
          className="absolute inset-0 cursor-pointer group"
          onClick={() => setIsLoaded(true)}
        >
          <Image
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
            >
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </div>
        </div>
      )}
      {isLoaded && (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      )}
    </div>
  );
}

function TwitchEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
      <iframe
        src={`https://player.twitch.tv/?video=${videoId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=false`}
        title={title}
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

function MediaCard({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const isVideo = item.type === 'video' || item.type === 'highlight';
  
  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = item.source === 'youtube' ? getYouTubeId(item.url) : null;
  const thumbnail = item.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '/placeholder-media.jpg');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-900 border border-gray-700 hover:border-green-500/50 transition-all duration-300 shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <Image
          src={thumbnail}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Play button for videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                item.source === 'youtube' ? 'bg-red-600 shadow-red-500/30' :
                item.source === 'twitch' ? 'bg-purple-600 shadow-purple-500/30' :
                'bg-green-600 shadow-green-500/30'
              }`}
            >
              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </div>
        )}

        {/* Duration badge */}
        {item.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white font-medium">
            {item.duration}
          </div>
        )}

        {/* Source badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
          item.source === 'youtube' ? 'bg-red-600 text-white' :
          item.source === 'twitch' ? 'bg-purple-600 text-white' :
          item.source === 'instagram' ? 'bg-pink-600 text-white' :
          'bg-gray-600 text-white'
        }`}>
          {item.source === 'youtube' ? '▶ YouTube' :
           item.source === 'twitch' ? '📺 Twitch' :
           item.source === 'instagram' ? '📷 Instagram' :
           '🎬 Video'}
        </div>

        {/* Type badge */}
        {item.type === 'highlight' && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-600 rounded text-xs font-bold text-white">
            ⭐ Highlight
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="text-white font-semibold line-clamp-2 group-hover:text-green-400 transition-colors">
          {item.title}
        </h4>
        {item.description && (
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {item.views && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {item.views >= 1000000 ? `${(item.views / 1000000).toFixed(1)}M` :
               item.views >= 1000 ? `${(item.views / 1000).toFixed(0)}K` :
               item.views}
            </span>
          )}
          {item.date && (
            <span>
              {new Date(item.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PlayerMediaGallery({ media, playerName }: PlayerMediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'all', label: 'Todo', icon: '📁' },
    { id: 'highlights', label: 'Highlights', icon: '⭐' },
    { id: 'videos', label: 'Videos', icon: '🎬' },
    { id: 'images', label: 'Imágenes', icon: '📷' },
  ];

  const filteredMedia = media.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'highlights') return item.type === 'highlight';
    if (activeTab === 'videos') return item.type === 'video';
    if (activeTab === 'images') return item.type === 'image';
    return true;
  });

  // Get YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  // Get Twitch video ID
  const getTwitchId = (url: string) => {
    const match = url.match(/twitch\.tv\/videos\/(\d+)/);
    return match ? match[1] : null;
  };

  if (media.length === 0) {
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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-900/40 to-orange-900/40 border border-red-500/30">
              <span className="text-4xl">🎬</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                Galería Multimedia
              </h2>
              <p className="text-gray-400">
                Videos, highlights y momentos destacados de {playerName}
              </p>
            </div>
          </div>

          {/* Media counts */}
          <div className="flex gap-3 text-sm">
            <span className="text-gray-400">
              {media.filter(m => m.type === 'highlight').length} highlights
            </span>
            <span className="text-gray-400">
              {media.filter(m => m.type === 'video').length} videos
            </span>
            <span className="text-gray-400">
              {media.filter(m => m.type === 'image').length} imágenes
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700'
              }`}>
                {tab.id === 'all' ? media.length :
                 tab.id === 'highlights' ? media.filter(m => m.type === 'highlight').length :
                 tab.id === 'videos' ? media.filter(m => m.type === 'video').length :
                 media.filter(m => m.type === 'image').length}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => setSelectedMedia(item)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredMedia.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <span className="text-6xl mb-4 block">📭</span>
          <p className="text-gray-400">No hay contenido multimedia en esta categoría</p>
        </motion.div>
      )}

      {/* Modal for video playback */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-red-400 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Video player */}
              {(selectedMedia.type === 'video' || selectedMedia.type === 'highlight') && selectedMedia.source === 'youtube' && (
                <YouTubeEmbed
                  videoId={getYouTubeId(selectedMedia.url) || ''}
                  title={selectedMedia.title}
                />
              )}

              {(selectedMedia.type === 'video' || selectedMedia.type === 'highlight') && selectedMedia.source === 'twitch' && (
                <TwitchEmbed
                  videoId={getTwitchId(selectedMedia.url) || ''}
                  title={selectedMedia.title}
                />
              )}

              {selectedMedia.type === 'image' && (
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  <Image
                    src={selectedMedia.url}
                    alt={selectedMedia.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Title and description */}
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white">{selectedMedia.title}</h3>
                {selectedMedia.description && (
                  <p className="text-gray-400 mt-2">{selectedMedia.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  {selectedMedia.views && (
                    <span>{selectedMedia.views.toLocaleString()} visualizaciones</span>
                  )}
                  {selectedMedia.date && (
                    <span>{new Date(selectedMedia.date).toLocaleDateString('es-ES')}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

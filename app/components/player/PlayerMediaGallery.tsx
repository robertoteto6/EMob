'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItem } from '../../lib/types/player';

interface PlayerMediaGalleryProps {
  media: MediaItem[];
  playerName: string;
}

type TabType = 'all' | 'images' | 'videos' | 'highlights';

// Quality levels for YouTube thumbnails (fallback chain)
const YOUTUBE_THUMBNAIL_QUALITIES = [
  'maxresdefault',
  'sddefault', 
  'hqdefault',
  'mqdefault',
  'default'
] as const;

function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(0);

  const handleThumbnailError = useCallback(() => {
    if (currentQualityIndex < YOUTUBE_THUMBNAIL_QUALITIES.length - 1) {
      setCurrentQualityIndex(prev => prev + 1);
    } else {
      setThumbnailError(true);
    }
  }, [currentQualityIndex]);

  const thumbnailUrl = thumbnailError 
    ? '/placeholder-video.jpg'
    : `https://img.youtube.com/vi/${videoId}/${YOUTUBE_THUMBNAIL_QUALITIES[currentQualityIndex]}.jpg`;

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
      {!isLoaded && (
        <div 
          className="absolute inset-0 cursor-pointer group"
          onClick={() => setIsLoaded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsLoaded(true)}
          aria-label={`Reproducir video: ${title}`}
        >
          {thumbnailError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 to-gray-900 flex items-center justify-center">
              <span className="text-6xl">🎬</span>
            </div>
          ) : (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleThumbnailError}
              unoptimized
            />
          )}
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
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
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
  const [imageError, setImageError] = useState(false);
  const isVideo = item.type === 'video' || item.type === 'highlight';
  const isHighlight = item.type === 'highlight';
  
  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = item.source === 'youtube' ? getYouTubeId(item.url) : null;
  
  // Fallback chain for thumbnails
  const getThumbnail = () => {
    if (imageError) return '/placeholder-video.jpg';
    if (item.thumbnail) return item.thumbnail;
    if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    return '/placeholder-media.jpg';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`relative group cursor-pointer rounded-xl overflow-hidden bg-gray-900 border transition-all duration-300 shadow-lg ${
        isHighlight 
          ? 'border-yellow-500/50 hover:border-yellow-400 ring-1 ring-yellow-500/20' 
          : 'border-gray-700 hover:border-green-500/50'
      }`}
    >
      {/* Highlight glow effect */}
      {isHighlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent pointer-events-none z-10" />
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video">
        {imageError ? (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-5xl">{isVideo ? '🎬' : '📷'}</span>
          </div>
        ) : (
          <Image
            src={getThumbnail()}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
            unoptimized={item.source === 'youtube'}
          />
        )}
        
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

        {/* Type badge - Enhanced for highlights */}
        {isHighlight && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-lg shadow-yellow-500/30">
            <span className="animate-pulse">⭐</span> Highlight
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

  // Get featured highlight (most viewed)
  const featuredHighlight = media
    .filter(m => m.type === 'highlight' && m.views)
    .sort((a, b) => (b.views || 0) - (a.views || 0))[0];

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

  const highlightsCount = media.filter(m => m.type === 'highlight').length;

  return (
    <section className="mb-12">
      {/* Featured Highlight for important players */}
      {featuredHighlight && highlightsCount >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-1 rounded-2xl bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30"
        >
          <div className="bg-gray-900/95 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏆</span>
              <h3 className="text-xl font-bold text-white">Highlight Destacado</h3>
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                FEATURED
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                className="cursor-pointer"
                onClick={() => setSelectedMedia(featuredHighlight)}
              >
                {featuredHighlight.source === 'youtube' && getYouTubeId(featuredHighlight.url) && (
                  <YouTubeEmbed
                    videoId={getYouTubeId(featuredHighlight.url)!}
                    title={featuredHighlight.title}
                  />
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-2xl font-bold text-white mb-3 line-clamp-2">
                  {featuredHighlight.title}
                </h4>
                {featuredHighlight.description && (
                  <p className="text-gray-400 mb-4 line-clamp-3">
                    {featuredHighlight.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {featuredHighlight.views && (
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {featuredHighlight.views >= 1000000 
                        ? `${(featuredHighlight.views / 1000000).toFixed(1)}M views` 
                        : featuredHighlight.views >= 1000 
                        ? `${(featuredHighlight.views / 1000).toFixed(0)}K views`
                        : `${featuredHighlight.views} views`}
                    </span>
                  )}
                  {featuredHighlight.duration && (
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {featuredHighlight.duration}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMedia(featuredHighlight)}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 w-fit"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Ver Highlight Completo
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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

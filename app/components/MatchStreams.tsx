"use client";

import { memo, useEffect, useMemo, useState } from 'react';
import { LangFlag } from './LangFlag';
import type { StreamInfo } from '../lib/types';

interface MatchStreamsProps {
  streams: StreamInfo[];
}

const isTwitchUrl = (url?: string | null) => typeof url === "string" && url.includes("twitch.tv");

const extractTwitchChannel = (rawUrl: string): string | null => {
  try {
    const parsed = new URL(rawUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
};

const ensureParentParam = (url: string, parent: string | null) => {
  if (!parent) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("parent")) {
      parsed.searchParams.append("parent", parent);
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const buildTwitchEmbedUrl = (stream: StreamInfo, parent: string | null): string | null => {
  const embedUrl = stream.embed_url ?? "";
  if (embedUrl && isTwitchUrl(embedUrl)) {
    return ensureParentParam(embedUrl, parent);
  }

  const rawUrl = stream.raw_url ?? "";
  if (rawUrl && isTwitchUrl(rawUrl)) {
    const channel = extractTwitchChannel(rawUrl);
    if (channel) {
      return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${parent}`;
    }
  }

  return embedUrl || null;
};

const MatchStreams = ({ streams }: MatchStreamsProps) => {
  const [activeStream, setActiveStream] = useState<StreamInfo | null>(null);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);

  // Initialize active stream
  useEffect(() => {
    if (streams.length > 0 && !activeStream) {
      const twitchStream = streams.find(s => isTwitchUrl(s.embed_url) || isTwitchUrl(s.raw_url));
      setActiveStream(twitchStream || streams[0]);
    }
  }, [streams, activeStream]);

  // Update embed source when active stream changes
  useEffect(() => {
    if (activeStream) {
      const parent = typeof window !== "undefined" ? window.location.hostname : null;
      setEmbedSrc(buildTwitchEmbedUrl(activeStream, parent));
    }
  }, [activeStream]);


  if (!streams || streams.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-red-500 rounded-full"></span>
        Transmisiones en Vivo
      </h3>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Embed */}
        <div className="flex-1">
          <div className="relative group rounded-2xl overflow-hidden bg-gray-900 border border-gray-700 shadow-2xl">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-red-500 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 blur-lg" />

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden z-10">
              {activeStream && embedSrc ? (
                <iframe
                  src={embedSrc}
                  width="100%"
                  height="100%"
                  allowFullScreen
                  className="w-full h-full"
                  title="Live Stream"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>
                  <span>Selecciona un stream para ver</span>
                </div>
              )}
            </div>
          </div>
          {activeStream && (
            <div className="mt-3 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-gray-300">
                  Viendo: <span className="text-white">{(activeStream.language || 'Stream').toUpperCase()}</span>
                </span>
              </div>
              <a href={activeStream.raw_url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                Abrir externo <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              </a>
            </div>
          )}
        </div>

        {/* Stream Selector List */}
        <div className="lg:w-80 flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Canales Disponibles</h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {streams.map((stream, idx) => {
              const isActive = activeStream === stream;
              const isTwitch = isTwitchUrl(stream.raw_url);
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStream(stream)}
                  className={`w-full text-left group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${isActive
                      ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-[var(--accent,#00FF80)] shadow-lg shadow-[var(--accent,#00FF80)]/10'
                      : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-gray-900/50' : 'bg-gray-900/30'}`}>
                    <LangFlag code={stream.language} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-gray-200'}`}>
                        {(stream.language || 'Unknown').toUpperCase()}
                      </span>
                      {isActive && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {isTwitch ? 'Twitch' : 'External'}
                    </p>
                  </div>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent,#00FF80)]"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MatchStreams);

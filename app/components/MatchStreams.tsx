"use client";

import { memo, useEffect, useRef, useState } from 'react';
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
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipIframeRef = useRef<HTMLIFrameElement | null>(null);

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

  useEffect(() => {
    if (!pipWindow) return;
    const handleClose = () => {
      pipIframeRef.current = null;
      setPipWindow(null);
    };
    pipWindow.addEventListener('pagehide', handleClose);
    return () => pipWindow.removeEventListener('pagehide', handleClose);
  }, [pipWindow]);

  useEffect(() => {
    if (pipIframeRef.current && embedSrc) {
      pipIframeRef.current.src = embedSrc;
    }
  }, [embedSrc]);

  const handlePictureInPicture = async () => {
    if (!embedSrc) return;
    if (pipWindow) {
      pipWindow.close();
      return;
    }
    if (typeof window === "undefined") return;
    const documentPictureInPicture = (window as Window & {
      documentPictureInPicture?: { requestWindow: (options?: { width?: number; height?: number }) => Promise<Window> };
    }).documentPictureInPicture;
    if (!documentPictureInPicture) return;
    try {
      const pip = await documentPictureInPicture.requestWindow({ width: 480, height: 270 });
      pip.document.title = 'Picture-in-Picture';
      pip.document.body.style.margin = '0';
      pip.document.body.style.background = 'black';
      const pipIframe = pip.document.createElement('iframe');
      pipIframe.src = embedSrc;
      pipIframe.allow = 'autoplay; fullscreen; picture-in-picture';
      pipIframe.allowFullscreen = true;
      pipIframe.style.border = '0';
      pipIframe.style.width = '100%';
      pipIframe.style.height = '100%';
      pip.document.body.append(pipIframe);
      pipIframeRef.current = pipIframe;
      setPipWindow(pip);
    } catch (error) {
      console.error('No se pudo activar Picture-in-Picture', error);
    }
  };


  if (!streams || streams.length === 0) return null;

  const pipSupported = typeof window !== "undefined" && "documentPictureInPicture" in window;
  const pipDisabled = !pipSupported || !embedSrc;

  return (
    <div className="mb-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Embed */}
        <div className="flex-1">
          <div className="relative group rounded-[2rem] overflow-hidden bg-gray-900 border border-gray-700/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
            {/* Ultra-premium Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-[var(--accent,#00FF80)] to-blue-600 rounded-[2rem] opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-1000 blur-3xl mx-4" />

            <div className="relative aspect-video bg-black rounded-[1.5rem] overflow-hidden z-10 m-2 border border-gray-800/80">
              {activeStream && embedSrc && !pipWindow ? (
                <iframe
                  src={embedSrc}
                  width="100%"
                  height="100%"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  title="Live Stream"
                />
              ) : pipWindow ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-4 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                  <div className="text-xs font-black tracking-[0.3em] uppercase text-gray-600">Picture-in-Picture activo</div>
                  <button
                    type="button"
                    onClick={handlePictureInPicture}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-gray-800/70 border border-gray-700/60 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
                  >
                    Cerrar PIP
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-6 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                  <div className="p-5 rounded-full bg-gray-900/50 border border-gray-800 animate-pulse">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-700"><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>
                  </div>
                  <span className="text-xs font-black tracking-[0.3em] uppercase text-gray-700">Selecciona un canal para visualizar</span>
                </div>
              )}
            </div>
          </div>
          {activeStream && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--accent,#00FF80)]/10 border border-[var(--accent,#00FF80)]/30 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-[var(--accent,#00FF80)] rounded-full animate-pulse shadow-[0_0_12px_var(--accent,#00FF80)]" />
                  <span className="text-[10px] font-black text-[var(--accent,#00FF80)] uppercase tracking-widest">
                    {(activeStream.language || 'Global').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Transmisión en Directo</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Gaming World Experience</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePictureInPicture}
                  disabled={pipDisabled}
                  aria-pressed={Boolean(pipWindow)}
                  className={`group/btn flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black transition-all border backdrop-blur-md shadow-lg active:scale-95 ${
                    pipDisabled
                      ? 'bg-gray-900/40 text-gray-500 border-gray-800/60 cursor-not-allowed'
                      : 'bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700/50 hover:border-gray-500'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover/btn:scale-110">
                    <rect x="3" y="6" width="18" height="14" rx="2" />
                    <path d="M15 3h6v6" />
                    <path d="M21 3l-6 6" />
                  </svg>
                  {pipWindow ? 'CERRAR PIP' : 'PIP'}
                </button>
                <a
                  href={activeStream.raw_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn flex items-center gap-3 px-6 py-3 rounded-2xl bg-gray-800/50 hover:bg-gray-700 text-xs font-black text-gray-300 hover:text-white transition-all border border-gray-700/50 hover:border-gray-500 backdrop-blur-md shadow-lg active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover/btn:rotate-12 transition-transform"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  ABRIR EXTERNO
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Stream Selector List */}
        <div className="lg:w-80 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Multi-Canal</h4>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{streams.length} LIVE</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar lg:pb-10">
            {streams.map((stream, idx) => {
              const isActive = activeStream === stream;
              const isTwitch = isTwitchUrl(stream.raw_url);
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStream(stream)}
                  className={`w-full text-left group flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all duration-700 relative overflow-hidden ${isActive
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-[var(--accent,#00FF80)]/40 shadow-2xl'
                      : 'bg-gray-900/30 border-gray-800/50 hover:bg-gray-800/40 hover:border-gray-700'
                    }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent,#00FF80)]/5 via-transparent to-transparent pointer-events-none" />
                  )}

                  <div className={`p-3 rounded-2xl transition-all duration-700 ${isActive ? 'bg-[var(--accent,#00FF80)]/15 scale-110 shadow-[0_0_20px_rgba(0,255,128,0.1)]' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                    <LangFlag code={stream.language} />
                  </div>

                  <div className="flex-1 min-w-0 z-10">
                    <span className={`text-sm font-black block truncate transition-colors duration-500 tracking-tight ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-200'}`}>
                      {(stream.language || 'Unknown').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${isActive ? 'text-[var(--accent,#00FF80)] border-[var(--accent,#00FF80)]/30 bg-[var(--accent,#00FF80)]/5' : 'text-gray-700 border-gray-800'}`}>
                        {isTwitch ? 'TWITCH' : 'EXTERNAL'}
                      </div>
                      {isActive && (
                        <div className="flex gap-1">
                          <div className="w-1 h-3 bg-[var(--accent,#00FF80)]/40 rounded-full animate-pulse self-end" style={{ animationDelay: '0s' }} />
                          <div className="w-1 h-5 bg-[var(--accent,#00FF80)]/60 rounded-full animate-pulse self-end" style={{ animationDelay: '0.2s', animationDuration: '0.7s' }} />
                          <div className="w-1 h-2 bg-[var(--accent,#00FF80)]/30 rounded-full animate-pulse self-end" style={{ animationDelay: '0.4s' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-700 ${isActive ? 'bg-[var(--accent,#00FF80)] border-[var(--accent,#00FF80)]/50 shadow-[0_0_15px_rgba(0,255,128,0.3)]' : 'bg-gray-800 border-gray-700 opacity-0 group-hover:opacity-100'}`}>
                    {isActive ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    )}
                  </div>
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

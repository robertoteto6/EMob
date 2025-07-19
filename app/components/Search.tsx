"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchItem {
  id: number;
  name: string;
  type: "team" | "player" | "match" | "tournament";
  image_url: string | null;
  league?: string;
  game?: string;
  status?: string;
}

interface SearchProps {
  game?: string;
  placeholder?: string;
  compact?: boolean;
}

export default function Search({ 
  game = "dota2", 
  placeholder = "Buscar equipos, jugadores, partidos...",
  compact = false 
}: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
        setRecentSearches(recent.slice(0, 5)); // Solo mostrar las últimas 5
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Función para buscar
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`Searching for: "${query}" in game: ${game}`);
      
      fetch(`/api/esports/search?q=${encodeURIComponent(query)}&game=${game}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            console.error("Search failed:", res.status, res.statusText);
            return [];
          }
        })
        .then((data) => {
          console.log(`Search results for "${query}":`, data);
          setResults(data || []);
          setLoading(false);
          setSelectedIndex(-1);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error("Search error:", error);
          }
          setLoading(false);
        });
    }, 300); // Debounce de 300ms

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query, game]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShow(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = results.length;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalResults - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        select(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShow(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  function select(item: SearchItem) {
    // Guardar en búsquedas recientes
    const newRecentSearches = [
      item,
      ...recentSearches.filter(r => !(r.id === item.id && r.type === item.type))
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    if (typeof window !== "undefined") {
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches));
    }

    // Navegar según el tipo
    let path = "";
    switch (item.type) {
      case "team":
        path = `/esports/team/${item.id}`;
        break;
      case "player":
        path = `/esports/player/${item.id}`;
        break;
      case "tournament":
        path = `/esports/tournament/${item.id}`;
        break;
      case "match":
        path = `/esports/${item.id}`;
        break;
      default:
        path = `/esports/${item.id}`;
    }

    router.push(path);
    setQuery("");
    setShow(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("recentSearches");
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "team": return "👥";
      case "player": return "🏃";
      case "match": return "⚔️";
      case "tournament": return "🏆";
      default: return "🔍";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "team": return "text-blue-400";
      case "player": return "text-green-400";
      case "match": return "text-red-400";
      case "tournament": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className={`relative ${compact ? 'w-full' : 'w-full max-w-md'}`} ref={containerRef}>
      {/* Campo de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setShow(true);
          }}
          onFocus={() => setShow(true)}
          onKeyDown={handleKeyDown}
          className={`
            w-full pl-10 pr-4 py-2 
            bg-gray-800/50 border border-gray-600 
            rounded-xl text-white placeholder:text-gray-400
            focus:ring-2 focus:ring-green-500 focus:border-transparent
            focus:placeholder:text-gray-500
            transition-all duration-300
            ${compact ? 'text-sm' : 'text-base'}
          `}
          style={{
            color: 'white',
            backgroundColor: 'rgba(31, 41, 55, 0.5)'
          }}
        />

        {/* Indicador de carga */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
          </div>
        )}

        {/* Botón de limpiar */}
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setShow(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Resultados */}
      {show && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Búsquedas recientes (cuando no hay query) */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-300">Búsquedas recientes</h4>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Limpiar
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((item, index) => (
                  <button
                    key={`recent-${item.type}-${item.id}`}
                    onClick={() => select(item)}
                    className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
                  >
                    <span className="text-lg">{getTypeIcon(item.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate group-hover:text-green-400 transition-colors">
                        {item.name}
                      </div>
                      <div className={`text-xs ${getTypeColor(item.type)}`}>
                        {item.type === "team" ? "Equipo" : 
                         item.type === "player" ? "Jugador" :
                         item.type === "tournament" ? "Torneo" : "Partido"}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultados de búsqueda */}
          {query && (
            <>
              {loading && (
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                    <span className="text-sm">Buscando...</span>
                  </div>
                </div>
              )}

              {!loading && results.length === 0 && query.length >= 2 && (
                <div className="p-4 text-center">
                  <div className="text-gray-400 text-sm">
                    <div className="text-2xl mb-2">🔍</div>
                    No se encontraron resultados para "<span className="font-semibold text-white">{query}</span>"
                    <div className="mt-2 text-xs text-gray-500">
                      Intenta buscar con otros términos o verifica la ortografía
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Juego actual: <span className="text-gray-300">{game}</span>
                    </div>
                  </div>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="max-h-80 overflow-y-auto">
                  {results.map((item, index) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => select(item)}
                      className={`
                        flex items-center gap-3 w-full text-left p-3 
                        transition-colors border-l-2 border-transparent
                        ${selectedIndex === index 
                          ? 'bg-green-500/10 border-green-500 text-white' 
                          : 'hover:bg-gray-800/50 text-gray-300 hover:text-white'
                        }
                      `}
                    >
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-8 h-8 object-contain rounded-lg bg-gray-800" 
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm">
                          {getTypeIcon(item.type)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className={getTypeColor(item.type)}>
                            {item.type === "team" ? "Equipo" : 
                             item.type === "player" ? "Jugador" :
                             item.type === "tournament" ? "Torneo" : "Partido"}
                          </span>
                          {item.league && (
                            <>
                              <span>•</span>
                              <span>{item.league}</span>
                            </>
                          )}
                          {item.status && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">{item.status}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedIndex === index && (
                          <kbd className="px-2 py-1 text-xs bg-gray-700 rounded border text-gray-300">
                            Enter
                          </kbd>
                        )}
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Footer con atajos de teclado */}
          {show && (query || recentSearches.length > 0) && (
            <div className="border-t border-gray-700 p-3 bg-gray-800/30">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">↑↓</kbd>
                    <span>navegar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">Enter</kbd>
                    <span>seleccionar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">Esc</kbd>
                    <span>cerrar</span>
                  </div>
                </div>
                {results.length > 0 && (
                  <div>
                    {results.length} resultado{results.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

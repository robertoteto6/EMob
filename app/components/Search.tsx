"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { debounce, apiCache } from "../lib/utils";
import { getPlayerImageUrl, getTeamImageUrl } from "../lib/imageFallback";
import { useGameContext } from "../contexts/GameContext";
import { getGameConfig } from "../lib/gameConfig";

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
  globalSearch?: boolean; // Nueva prop para búsqueda global
}

export default function Search({
  game: deprecatedGame,
  placeholder = "Buscar equipos, jugadores, partidos...",
  compact = false,
  globalSearch = false
}: SearchProps) {
  const { selectedGames, hasAnyGame } = useGameContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Texto del placeholder (usar placeholder nativo para que desaparezca al escribir)
  const placeholderText = globalSearch
    ? "Buscar en todos los juegos — equipos, jugadores, partidos..."
    : placeholder;

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

  // Cancelar peticiones pendientes al desmontar
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Función de búsqueda optimizada con debounce adaptativo
  // Debounce más rápido para queries cortas, más lento para largas
  const getDebounceTime = useCallback((queryLength: number) => {
    if (queryLength <= 2) return 100;
    if (queryLength <= 5) return 250;
    return 400;
  }, []);

  // Función de búsqueda con timeout y mejor manejo de errores
  const performSearch = useCallback(async (
    searchQuery: string,
    searchGames: string[],
    isGlobal: boolean
  ) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Si no hay juegos seleccionados y no es búsqueda global, no buscar
    if (!isGlobal && searchGames.length === 0) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = `${isGlobal ? 'all' : searchGames.join(',')}:${searchQuery.toLowerCase().trim()}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      setResults(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Cancelar petición anterior
    controllerRef.current?.abort();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    // Timeout de 10 segundos para evitar peticiones colgadas
    const timeoutId = setTimeout(() => {
      controller.abort();
      setError("La búsqueda está tardando demasiado. Por favor, intenta de nuevo.");
      setLoading(false);
    }, 10000);
    timeoutRef.current = timeoutId;

    try {
      const searchUrl = isGlobal
        ? `/api/esports/search?q=${encodeURIComponent(searchQuery)}`
        : `/api/esports/search?q=${encodeURIComponent(searchQuery)}&games=${searchGames.join(',')}`;

      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      timeoutRef.current = null;

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Demasiadas búsquedas. Por favor, espera un momento.");
        } else if (res.status >= 500) {
          throw new Error("Error del servidor. Por favor, intenta más tarde.");
        } else {
          throw new Error(`Error al buscar: ${res.status}`);
        }
      }

      const data = await res.json();
      
      if (!controller.signal.aborted) {
        apiCache.set(cacheKey, data || []);
        setResults(data || []);
        setError(null);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      timeoutRef.current = null;

      if ((error as Error).name !== "AbortError" && !controller.signal.aborted) {
        const errorMessage = (error as Error).message || "Error al realizar la búsqueda. Por favor, intenta de nuevo.";
        setError(errorMessage);
        setResults([]);
        console.error("Search error:", error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Efecto para ejecutar la búsqueda con debounce adaptativo
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Determinar juegos a buscar
    const gamesToSearch = globalSearch ? [] : (hasAnyGame ? selectedGames : []);

    // Debounce adaptativo: más rápido para queries cortas, más lento para largas
    const debounceTime = getDebounceTime(query.length);
    const timeoutId = setTimeout(() => {
      performSearch(query, gamesToSearch, globalSearch);
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [query, selectedGames, hasAnyGame, globalSearch, performSearch, getDebounceTime]);

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

  // Navegación con teclado mejorada para móvil
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
      // En móvil, si no hay selección pero hay query, buscar
      if (selectedIndex >= 0 && results[selectedIndex]) {
        select(results[selectedIndex]);
      } else if (query.length >= 2) {
        // En móvil, Enter puede hacer submit
        setShow(false);
      }
    } else if (e.key === "Escape") {
      setShow(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === " ") {
      // Prevenir scroll con espacio en móvil
      e.preventDefault();
    }
  };

  // Función para seleccionar un resultado (memoizada)
  const select = useCallback((item: SearchItem) => {
    // Guardar en búsquedas recientes
    if (typeof window !== "undefined") {
      try {
        const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
        const filtered = recent.filter((r: SearchItem) => r.id !== item.id || r.type !== item.type);
        const updated = [item, ...filtered].slice(0, 10); // Mantener solo 10
        localStorage.setItem("recentSearches", JSON.stringify(updated));
        setRecentSearches(updated.slice(0, 5));
      } catch {
        // Ignorar errores de localStorage
      }
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
      case "match":
        path = `/esports/${item.id}`;
        break;
      case "tournament":
        path = `/esports/tournament/${item.id}`;
        break;
      default:
        return;
    }

    setShow(false);
    setQuery("");
    setSelectedIndex(-1);
    router.push(path);
  }, [router]);

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

  // Memoizar la función de highlight para evitar recrearla en cada render
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    // Escapar caracteres especiales en la query para evitar errores en RegExp
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <span key={i} className="text-green-400 font-bold">{part}</span> : part
    );
  }, []);

  // Memoizar resultados para evitar re-renders innecesarios
  const memoizedResults = useMemo(() => results, [results]);

  // Memoizar funciones de utilidad
  const memoizedGetTypeIcon = useCallback(getTypeIcon, []);
  const memoizedGetTypeColor = useCallback(getTypeColor, []);

  return (
    <div 
      className={`relative w-full ${compact ? '' : 'max-w-md'}`} 
      ref={containerRef}
      role="search"
      aria-label="Buscador de equipos, jugadores y partidos"
    >
      {/* Campo de búsqueda */}
      <div className="relative group">
        {/* Icono de búsqueda */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <svg
            className={`h-5 w-5 transition-colors duration-200 ${query ? 'text-green-400' : 'text-gray-400 group-focus-within:text-green-400'
              }`}
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

        {/* Se elimina el placeholder personalizado para evitar que se mantenga al escribir */}

        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShow(true);
            setError(null);
          }}
          onFocus={() => {
            setShow(true);
          }}
          onKeyDown={handleKeyDown}
          className={`
            w-full pl-10 pr-10 py-3
            bg-gray-800/60 border rounded-xl text-white text-sm
            focus:ring-2 focus:bg-gray-800/80
            transition-all duration-300 ease-in-out
            hover:border-gray-500/70
            placeholder-gray-400
            ${error 
              ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
              : 'border-gray-600/50 focus:ring-green-500/50 focus:border-green-500/50'
            }
            ${compact ? 'py-2' : 'py-3'}
          `}
          placeholder={placeholderText}
          aria-label={placeholderText}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "search-error" : undefined}
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
              setError(null);
              setShow(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 touch-target touch-ripple flex items-center text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded"
            aria-label="Limpiar búsqueda"
            type="button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Resultados */}
      {show && (
        <div 
          className="absolute z-50 left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-80 sm:max-h-96"
          role="listbox"
          aria-label="Resultados de búsqueda"
          aria-expanded={show}
        >
          {/* Búsquedas recientes (cuando no hay query) */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-300">Búsquedas recientes</h4>
                <button
                  onClick={clearRecentSearches}
                  className="touch-target touch-ripple text-xs text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded px-2 py-1"
                  aria-label="Limpiar búsquedas recientes"
                  type="button"
                >
                  Limpiar
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((item, _index) => (
                  <button
                    key={`recent-${item.type}-${item.id}`}
                    onClick={() => select(item)}
                    className="touch-target touch-ripple flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
                  >
                    <span className="text-lg">{memoizedGetTypeIcon(item.type)}</span>
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
                <div className="p-4 text-center" role="status" aria-live="polite" aria-label="Buscando resultados">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400" aria-hidden="true"></div>
                    <span className="text-sm">Buscando...</span>
                  </div>
                  {query.length >= 2 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Buscando &quot;{query}&quot;...
                    </div>
                  )}
                </div>
              )}

              {error && !loading && (
                <div 
                  className="p-4 text-center" 
                  role="alert" 
                  aria-live="assertive"
                  id="search-error"
                >
                  <div className="text-red-400 text-sm">
                    <div className="text-2xl mb-2" aria-hidden="true">⚠️</div>
                    <div className="font-semibold mb-1">Error en la búsqueda</div>
                    <div className="text-xs text-red-300">{error}</div>
                    <button
                      onClick={() => {
                        setError(null);
                        if (query.length >= 2) {
                          const gamesToSearch = globalSearch ? [] : (hasAnyGame ? selectedGames : []);
                          performSearch(query, gamesToSearch, globalSearch);
                        }
                      }}
                      className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      aria-label="Reintentar búsqueda"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}

              {!loading && !error && memoizedResults.length === 0 && query.length >= 2 && (
                <div className="p-4 text-center" role="status" aria-live="polite">
                  <div className="text-gray-400 text-sm">
                    <div className="text-2xl mb-2" aria-hidden="true">🔍</div>
                    No se encontraron resultados para &quot;<span className="font-semibold text-white">{query}</span>&quot;
                    <div className="mt-2 text-xs text-gray-500">
                      Intenta buscar con otros términos o verifica la ortografía
                    </div>
                    {!globalSearch && hasAnyGame && (
                      <div className="mt-1 text-xs text-gray-500">
                        Búsqueda en: <span className="text-gray-300">
                          {selectedGames.map(gameId => {
                            const config = getGameConfig(gameId);
                            return config?.name || gameId;
                          }).join(', ')}
                        </span>
                      </div>
                    )}
                    {globalSearch && (
                      <div className="mt-1 text-xs text-green-400">
                        Búsqueda en todos los juegos
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loading && !error && memoizedResults.length > 0 && (
                <div className="max-h-64 sm:max-h-80 overflow-y-auto">
                  {memoizedResults.map((item, index) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => select(item)}
                      role="option"
                      aria-selected={selectedIndex === index}
                      aria-label={`${item.name}, ${item.type === "team" ? "Equipo" : item.type === "player" ? "Jugador" : item.type === "tournament" ? "Torneo" : "Partido"}`}
                      className={`
                        touch-target touch-ripple flex items-center gap-3 w-full text-left p-3
                        transition-colors border-l-2 border-transparent
                        ${selectedIndex === index
                          ? 'bg-green-500/10 border-green-500 text-white'
                          : 'hover:bg-gray-800/50 text-gray-300 hover:text-white'
                        }
                      `}
                    >
                      {(() => {
                        const imageSrc =
                          item.type === "team"
                            ? getTeamImageUrl({ id: item.id, name: item.name, image_url: item.image_url })
                            : item.type === "player"
                              ? getPlayerImageUrl({ id: item.id, name: item.name, image_url: item.image_url })
                              : item.image_url;

                        return imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain rounded-lg bg-gray-800"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm">
                            {getTypeIcon(item.type)}
                          </div>
                        );
                      })()}

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {highlightMatch(item.name, query)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className={memoizedGetTypeColor(item.type)}>
                            {item.type === "team" ? "Equipo" :
                              item.type === "player" ? "Jugador" :
                                item.type === "tournament" ? "Torneo" : "Partido"}
                          </span>
                          {globalSearch && item.game && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400 font-medium">
                                {item.game === 'dota2' ? 'Dota 2' :
                                  item.game === 'lol' ? 'League of Legends' :
                                    item.game === 'csgo' ? 'Counter-Strike 2' :
                                      item.game === 'r6siege' ? 'Rainbow Six Siege' :
                                        item.game}
                              </span>
                            </>
                          )}
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
                {memoizedResults.length > 0 && (
                  <div>
                    {memoizedResults.length} resultado{memoizedResults.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}

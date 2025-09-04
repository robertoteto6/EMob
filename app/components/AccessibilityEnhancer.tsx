"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { cn } from '../lib/utils';

// Contexto de accesibilidad
interface AccessibilityContextType {
  fontSize: number;
  contrast: 'normal' | 'high' | 'higher';
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleContrast: () => void;
  toggleReducedMotion: () => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

// Hook para usar el contexto de accesibilidad
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// Proveedor de accesibilidad
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [fontSize, setFontSize] = useState(16);
  const [contrast, setContrast] = useState<'normal' | 'high' | 'higher'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  // Detectar preferencias del sistema
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detectar preferencia de movimiento reducido
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReducedMotion(prefersReducedMotion);

      // Detectar preferencia de alto contraste
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      if (prefersHighContrast) {
        setContrast('high');
      }

      // Detectar uso de lector de pantalla
      const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                             window.navigator.userAgent.includes('JAWS') || 
                             !!window.speechSynthesis;
      setScreenReader(hasScreenReader);

      // Cargar configuraciones guardadas
      const savedSettings = localStorage.getItem('accessibility-settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setFontSize(settings.fontSize || 16);
          setContrast(settings.contrast || 'normal');
          setReducedMotion(settings.reducedMotion ?? prefersReducedMotion);
        } catch (error) {
          console.warn('Error loading accessibility settings:', error);
        }
      }
    }
  }, []);

  // Detectar navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Aplicar configuraciones al DOM
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${fontSize}px`;
      document.documentElement.setAttribute('data-contrast', contrast);
      document.documentElement.setAttribute('data-reduced-motion', reducedMotion.toString());
      document.documentElement.setAttribute('data-keyboard-nav', keyboardNavigation.toString());

      // Guardar configuraciones
      const settings = {
        fontSize,
        contrast,
        reducedMotion,
      };
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    }
  }, [fontSize, contrast, reducedMotion, keyboardNavigation]);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 2, 24));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 2, 12));
  }, []);

  const toggleContrast = useCallback(() => {
    setContrast(prev => {
      switch (prev) {
        case 'normal': return 'high';
        case 'high': return 'higher';
        case 'higher': return 'normal';
        default: return 'normal';
      }
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion(prev => !prev);
  }, []);

  const resetSettings = useCallback(() => {
    setFontSize(16);
    setContrast('normal');
    setReducedMotion(false);
    localStorage.removeItem('accessibility-settings');
  }, []);

  const value: AccessibilityContextType = {
    fontSize,
    contrast,
    reducedMotion,
    screenReader,
    keyboardNavigation,
    increaseFontSize,
    decreaseFontSize,
    toggleContrast,
    toggleReducedMotion,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Componente de panel de accesibilidad
interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const {
    fontSize,
    contrast,
    reducedMotion,
    increaseFontSize,
    decreaseFontSize,
    toggleContrast,
    toggleReducedMotion,
    resetSettings,
  } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      role="dialog"
      aria-labelledby="accessibility-title"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="accessibility-title" className="text-xl font-bold">
            Configuración de Accesibilidad
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Cerrar panel de accesibilidad"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Tamaño de fuente */}
          <div>
            <h3 className="font-semibold mb-2">Tamaño de Texto</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={decreaseFontSize}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                aria-label="Disminuir tamaño de texto"
              >
                A-
              </button>
              <span className="mx-2 min-w-[3rem] text-center">{fontSize}px</span>
              <button
                onClick={increaseFontSize}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                aria-label="Aumentar tamaño de texto"
              >
                A+
              </button>
            </div>
          </div>

          {/* Contraste */}
          <div>
            <h3 className="font-semibold mb-2">Contraste</h3>
            <button
              onClick={toggleContrast}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 w-full"
              aria-label={`Contraste actual: ${contrast}. Clic para cambiar`}
            >
              Contraste: {contrast === 'normal' ? 'Normal' : contrast === 'high' ? 'Alto' : 'Muy Alto'}
            </button>
          </div>

          {/* Movimiento reducido */}
          <div>
            <h3 className="font-semibold mb-2">Animaciones</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={toggleReducedMotion}
                className="w-4 h-4"
              />
              <span>Reducir animaciones</span>
            </label>
          </div>

          {/* Botón de reset */}
          <div className="pt-4 border-t">
            <button
              onClick={resetSettings}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
              aria-label="Restablecer todas las configuraciones de accesibilidad"
            >
              Restablecer Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Botón flotante de accesibilidad
interface AccessibilityButtonProps {
  className?: string;
}

export function AccessibilityButton({ className }: AccessibilityButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          className
        )}
        aria-label="Abrir configuración de accesibilidad"
        title="Configuración de Accesibilidad"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5C14.8 4.1 13.6 3 12.1 3C10.6 3 9.4 4.1 9.2 5.5L3 7V9L9.2 7.5C9.2 7.7 9.2 7.8 9.2 8C9.2 8.2 9.2 8.3 9.2 8.5L3 10V12L9.2 10.5C9.4 11.9 10.6 13 12.1 13C13.6 13 14.8 11.9 15 10.5L21 12V10L15 8.5C15 8.3 15 8.2 15 8C15 7.8 15 7.7 15 7.5L21 9ZM12 15C10.9 15 10 15.9 10 17V22H14V17C14 15.9 13.1 15 12 15Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <AccessibilityPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// Hook para anuncios de lector de pantalla
export function useScreenReaderAnnouncement() {
  const { screenReader } = useAccessibility();

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!screenReader || typeof document === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover después de un tiempo
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [screenReader]);

  return announce;
}

// Componente para saltar al contenido principal
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Saltar al contenido principal
    </a>
  );
}

// Estilos CSS adicionales para screen readers
export const screenReaderStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;
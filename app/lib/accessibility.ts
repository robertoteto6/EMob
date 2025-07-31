// Utilidades de accesibilidad para EMob
export const accessibility = {
  
  // Configurar focus trap para modales
  setupFocusTrap: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Cerrar modal
        const closeButton = element.querySelector('[aria-label="Cerrar"]') as HTMLElement;
        if (closeButton) closeButton.click();
      }
    });
  },

  // Anunciar cambios a lectores de pantalla
  announceToScreenReader: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remover después de anunciar
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Validar contraste de colores
  validateColorContrast: (foreground: string, background: string): boolean => {
    // Función simplificada - en producción usar una librería especializada
    const getLuminance = (color: string): number => {
      // Convertir hex a RGB y calcular luminancia
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const sRGB = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const contrast = (getLuminance(foreground) + 0.05) / (getLuminance(background) + 0.05);
    return contrast >= 4.5; // WCAG AA estándar
  },

  // Configurar reducción de movimiento
  respectsReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Configurar navegación por teclado
  setupKeyboardNavigation: () => {
    // Skip link para navegación rápida
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Saltar al contenido principal';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-500 text-black px-4 py-2 rounded z-50';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Mejorar indicadores de focus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
};

// Hook de React para accesibilidad
export const useAccessibility = () => {
  const announceToScreenReader = accessibility.announceToScreenReader;
  const respectsReducedMotion = accessibility.respectsReducedMotion();

  return {
    announceToScreenReader,
    respectsReducedMotion,
    setupFocusTrap: accessibility.setupFocusTrap
  };
};

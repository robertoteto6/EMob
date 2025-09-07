"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { cn } from '../lib/utils';
import { useScreenReaderAnnouncement } from './AccessibilityEnhancer';

// Tipos para el sistema de notificaciones
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

interface UXContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

// Contexto UX
const UXContext = createContext<UXContextType | null>(null);

// Hook para usar el contexto UX
export function useUX() {
  const context = useContext(UXContext);
  if (!context) {
    throw new Error('useUX must be used within UXProvider');
  }
  return context;
}

// Proveedor UX
interface UXProviderProps {
  children: React.ReactNode;
}

export function UXProvider({ children }: UXProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const announce = useScreenReaderAnnouncement();

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Anunciar para lectores de pantalla
    announce(`${notification.type}: ${notification.title}. ${notification.message}`);

    // Auto-remover si no es persistente
    if (!notification.persistent && newNotification.duration! > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [announce, removeNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      announce('Cargando contenido', 'polite');
    }
  }, [announce]);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    addNotification({
      type,
      title: type === 'success' ? 'Éxito' : 'Error',
      message,
      duration: 3000,
    });
  }, [addNotification]);

  const value: UXContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    isLoading,
    setLoading,
    showFeedback,
  };

  return (
    <UXContext.Provider value={value}>
      {children}
    </UXContext.Provider>
  );
}

// Componente de notificación individual
interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  }, [notification.id, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <div
      className={cn(
        'max-w-sm w-full border rounded-lg shadow-lg p-4 transition-all duration-300 transform',
        getColorClasses(),
        isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isRemoving && 'scale-95'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {notification.message}
          </p>
          {notification.action && (
            <div className="mt-3">
              <button
                onClick={notification.action.onClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleRemove}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Cerrar notificación"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Contenedor de notificaciones
export function NotificationContainer() {
  const { notifications, removeNotification } = useUX();

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-4 max-h-screen overflow-y-auto"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}

// Componente de loading global
export function GlobalLoader() {
  const { isLoading } = useUX();

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="status"
      aria-label="Cargando"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          Cargando...
        </span>
      </div>
    </div>
  );
}

// Hook para feedback de formularios
export function useFormFeedback() {
  const { showFeedback } = useUX();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitWithFeedback = useCallback(async (
    submitFn: () => Promise<void>,
    successMessage = 'Operación completada exitosamente',
    errorMessage = 'Ocurrió un error. Por favor, inténtalo de nuevo.'
  ) => {
    setIsSubmitting(true);
    try {
      await submitFn();
      showFeedback('success', successMessage);
    } catch (error) {
      console.error('Form submission error:', error);
      showFeedback('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [showFeedback]);

  return {
    isSubmitting,
    submitWithFeedback,
  };
}

// Componente de botón con feedback
interface FeedbackButtonProps {
  onClick: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
  errorMessage?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function FeedbackButton({
  onClick,
  children,
  className,
  successMessage = 'Acción completada',
  errorMessage = 'Error al realizar la acción',
  disabled = false,
  variant = 'primary',
}: FeedbackButtonProps) {
  const { showFeedback } = useUX();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onClick();
      showFeedback('success', successMessage);
    } catch (error) {
      console.error('Button action error:', error);
      showFeedback('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getVariantClasses(),
        className
      )}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      )}
      <span>{children}</span>
    </button>
  );
}

// Hook para animaciones de entrada
export function useEntranceAnimation(delay = 0) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return {
    ref: elementRef,
    className: cn(
      'transition-all duration-500 transform',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    ),
  };
}

// Componente de progreso
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = true,
  color = 'blue',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600';
      case 'green':
        return 'bg-green-600';
      case 'yellow':
        return 'bg-yellow-600';
      case 'red':
        return 'bg-red-600';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progreso</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300 ease-out',
            getColorClasses()
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
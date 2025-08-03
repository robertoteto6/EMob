"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '../lib/utils';

export interface Notification {
  id: string;
  type: 'match_start' | 'match_end' | 'tournament_start' | 'team_update' | 'prediction_result';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSystemProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
}

const NotificationSystem = memo<NotificationSystemProps>(({ 
  notifications, 
  onMarkAsRead, 
  onClearAll, 
  onDeleteNotification 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Verificar soporte para notificaciones
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
    }
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'match_start': return '🚀';
      case 'match_end': return '🏁';
      case 'tournament_start': return '🏆';
      case 'team_update': return '👥';
      case 'prediction_result': return '🎯';
      default: return '📢';
    }
  }, []);

  const formatTimestamp = useCallback((timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        onClick={toggleOpen}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.svg 
          width="24" 
          height="24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          animate={unreadCount > 0 ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </motion.svg>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 max-h-96 overflow-hidden backdrop-blur-sm"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
          <div className="p-4 border-b border-[#333]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notificaciones</h3>
              <div className="flex gap-2">
                {!hasPermission && (
                  <button
                    onClick={requestNotificationPermission}
                    className="text-xs text-blue-400 hover:text-blue-300"
                    title="Activar notificaciones del navegador"
                  >
                    🔔 Activar
                  </button>
                )}
                <button
                  onClick={onClearAll}
                  className="text-xs text-gray-400 hover:text-white"
                  title="Marcar todas como leídas"
                >
                  ✓ Todas
                </button>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto" role="log" aria-label="Lista de notificaciones">
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div 
                  className="p-4 text-center text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-2xl" role="img" aria-label="Buzón vacío">📭</span>
                  <p className="mt-2">No tienes notificaciones</p>
                </motion.div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    className={cn(
                      'p-3 border-l-4 border-b border-[#333] last:border-b-0 transition-colors',
                      getPriorityColor(notification.priority),
                      notification.read ? 'bg-[#111]' : 'bg-[#1a1a1a]'
                    )}
                    role="article"
                    aria-labelledby={`notification-title-${notification.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-1" role="img" aria-hidden="true">
                      {getTypeIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 
                          id={`notification-title-${notification.id}`}
                          className={`text-sm font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${notification.read ? 'text-gray-400' : 'text-gray-300'}`}>
                        {notification.message}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {!notification.read && (
                          <motion.button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            aria-label={`Marcar como leída: ${notification.title}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Marcar como leída
                          </motion.button>
                        )}
                        {notification.actionUrl && (
                          <motion.a
                            href={notification.actionUrl}
                            className="text-xs text-[var(--accent,#00FF80)] hover:opacity-80 transition-opacity"
                            onClick={() => setIsOpen(false)}
                            aria-label={`Ver detalles de: ${notification.title}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Ver detalles
                          </motion.a>
                        )}
                        <motion.button
                          onClick={() => onDeleteNotification(notification.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          aria-label={`Eliminar notificación: ${notification.title}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Eliminar
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

NotificationSystem.displayName = 'NotificationSystem';

export default NotificationSystem;

// Hook optimizado para gestionar notificaciones
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar notificaciones desde localStorage
    const loadNotifications = () => {
      try {
        const saved = localStorage.getItem('esports-notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Filtrar notificaciones antiguas (más de 7 días)
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const filtered = parsed.filter((n: Notification) => n.timestamp > weekAgo);
          setNotifications(filtered);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  useEffect(() => {
    // Guardar notificaciones en localStorage (solo si no está cargando)
    if (!isLoading) {
      try {
        localStorage.setItem('esports-notifications', JSON.stringify(notifications));
      } catch (error) {
        console.error('Error saving notifications:', error);
      }
    }
  }, [notifications, isLoading]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false
    };

    setNotifications(prev => {
      // Evitar duplicados basados en título y mensaje
      const isDuplicate = prev.some(n => 
        n.title === notification.title && 
        n.message === notification.message &&
        Date.now() - n.timestamp < 5000 // 5 segundos
      );
      
      if (isDuplicate) return prev;
      
      return [newNotification, ...prev.slice(0, 49)]; // Mantener máximo 50
    });

    // Mostrar notificación del navegador si tiene permisos
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: newNotification.id,
          badge: '/favicon.ico',
          requireInteraction: notification.priority === 'high'
        });

        // Auto-cerrar después de 5 segundos (excepto alta prioridad)
        if (notification.priority !== 'high') {
          setTimeout(() => browserNotification.close(), 5000);
        }
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }

    return newNotification.id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Estadísticas de notificaciones
  const stats = useMemo(() => {
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { unread, total: notifications.length, byType, byPriority };
  }, [notifications]);

  return {
    notifications,
    addNotification,
    markAsRead,
    deleteNotification,
    clearAll,
    deleteAll,
    markAllAsRead,
    stats,
    isLoading
  };
}

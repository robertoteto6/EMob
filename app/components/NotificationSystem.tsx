"use client";

import { useState, useEffect } from "react";

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

export default function NotificationSystem({ 
  notifications, 
  onMarkAsRead, 
  onClearAll, 
  onDeleteNotification 
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Verificar soporte para notificaciones
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      default: return 'border-blue-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'match_start': return '🚀';
      case 'match_end': return '🏁';
      case 'tournament_start': return '🏆';
      case 'team_update': return '👥';
      case 'prediction_result': return '🎯';
      default: return '📢';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
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
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <span className="text-2xl">📭</span>
                <p className="mt-2">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-l-4 ${getPriorityColor(notification.priority)} ${
                    notification.read ? 'bg-[#111]' : 'bg-[#1a1a1a]'
                  } border-b border-[#333] last:border-b-0`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
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
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Marcar como leída
                          </button>
                        )}
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-xs text-[var(--accent,#00FF80)] hover:opacity-80"
                            onClick={() => setIsOpen(false)}
                          >
                            Ver detalles
                          </a>
                        )}
                        <button
                          onClick={() => onDeleteNotification(notification.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para gestionar notificaciones
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Cargar notificaciones desde localStorage
    const saved = localStorage.getItem('esports-notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Guardar notificaciones en localStorage
    localStorage.setItem('esports-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Mantener máximo 50

    // Mostrar notificación del navegador si tiene permisos
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    deleteNotification,
    clearAll
  };
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface Notification {
  id: string;
  type: "match_start" | "match_end" | "tournament_start" | "team_update" | "prediction_result" | "error";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  priority: "low" | "medium" | "high";
}

interface UseNotificationsOptions {
  enabled?: boolean;
}

interface NotificationStats {
  unread: number;
  total: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const loadNotifications = () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      try {
        const saved = window.localStorage.getItem("esports-notifications");
        if (!saved) {
          return;
        }

        const parsed: Notification[] = JSON.parse(saved);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter((notification) => notification.timestamp > weekAgo);

        if (!cancelled) {
          setNotifications((prev) => {
            if (prev.length === 0) {
              return filtered;
            }

            const existingIds = new Set(prev.map((notification) => notification.id));
            const merged = [...prev];

            filtered.forEach((notification) => {
              if (!existingIds.has(notification.id)) {
                merged.push(notification);
              }
            });

            return merged;
          });
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
        if (!cancelled) {
          setNotifications([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || isLoading) {
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("esports-notifications", JSON.stringify(notifications));
      }
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
  }, [enabled, isLoading, notifications]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">): string | undefined => {
      let created: Notification | undefined;
      const now = Date.now();

      setNotifications((prev) => {
        const isDuplicate = prev.some(
          (existing) =>
            existing.title === notification.title &&
            existing.message === notification.message &&
            now - existing.timestamp < 5000,
        );

        if (isDuplicate) {
          return prev;
        }

        created = {
          ...notification,
          id: `${now}-${Math.random().toString(36).slice(2, 11)}`,
          timestamp: now,
          read: false,
        };

        return [created!, ...prev.slice(0, 49)];
      });

      if (created && typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
        try {
          const browserNotification = new window.Notification(notification.title, {
            body: notification.message,
            icon: "/favicon.ico",
            tag: created.id,
            badge: "/favicon.ico",
            requireInteraction: notification.priority === "high",
          });

          if (notification.priority !== "high") {
            window.setTimeout(() => browserNotification.close(), 5000);
          }
        } catch (error) {
          console.error("Error showing browser notification:", error);
        }
      }

      return created?.id;
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const deleteAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const stats: NotificationStats = useMemo(() => {
    const unread = notifications.filter((notification) => !notification.read).length;
    const byType = notifications.reduce<Record<string, number>>((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {});
    const byPriority = notifications.reduce<Record<string, number>>((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      unread,
      total: notifications.length,
      byType,
      byPriority,
    };
  }, [notifications]);

  return useMemo(
    () => ({
      notifications,
      addNotification,
      markAsRead,
      deleteNotification,
      clearAll,
      deleteAll,
      markAllAsRead,
      stats,
      isLoading,
    }),
    [notifications, addNotification, markAsRead, deleteNotification, clearAll, deleteAll, markAllAsRead, stats, isLoading],
  );
}

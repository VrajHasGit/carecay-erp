import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotification,
  clearAllNotifications,
  getNotifCategory,
} from '../services/notificationService';

const NotificationContext = createContext(null);

// ── Notification sound (a subtle chime using Web Audio API) ──
let audioCtx = null;
function playNotifSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Two-tone chime
    const now = audioCtx.currentTime;

    // First tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(830, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (higher, slightly delayed)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1100, now + 0.12);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.06, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (e) {
    // Silent fail — audio is non-critical
  }
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [allNotifications, setAllNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const prevIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);
  const mountedRef = useRef(false);

  // ── Real-time subscription ──
  useEffect(() => {
    if (!currentUser?.id) return;

    mountedRef.current = true;
    initialLoadRef.current = true;

    const unsub = subscribeNotifications((rawNotifs) => {
      // Filter and route notifications
      const filtered = rawNotifs.filter(n => {
        if (!currentUser) return false;
        if (n.cleared?.[currentUser.id]) return false;
        
        // Admin gets everything not cleared
        if (currentUser.role === 'Admin') return true;
        return n.targetRoles && n.targetRoles.includes(currentUser.role);
      });

      // Detect truly new notifications (not on initial load)
      if (!initialLoadRef.current && mountedRef.current) {
        const prevIds = prevIdsRef.current;
        const newOnes = filtered.filter(n => !prevIds.has(n.id) && !n.read?.[currentUser.id]);

        if (newOnes.length > 0) {
          // Add toasts for new notifications (max 3 at a time)
          const toastItems = newOnes.slice(0, 3).map(n => ({
            ...n,
            toastId: `toast-${n.id}-${Date.now()}`,
          }));
          setToasts(prev => [...toastItems, ...prev].slice(0, 3));
          playNotifSound();

          // Auto-dismiss toasts after 5s
          setTimeout(() => {
            setToasts(prev =>
              prev.filter(t => !toastItems.some(ti => ti.toastId === t.toastId))
            );
          }, 5000);
        }
      }

      // Update ref for next diff
      prevIdsRef.current = new Set(filtered.map(n => n.id));
      if (initialLoadRef.current) initialLoadRef.current = false;

      setAllNotifications(filtered);
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [currentUser?.id, currentUser?.role]);

  // ── Derived state ──
  const unreadCount = allNotifications.filter(
    n => !n.read?.[currentUser?.id]
  ).length;

  // ── Actions ──
  const markRead = useCallback(async (notifId) => {
    if (!currentUser?.id) return;
    await markNotificationRead(notifId, currentUser.id);
  }, [currentUser?.id]);

  const markAllRead = useCallback(async () => {
    if (!currentUser?.id) return;
    const unreadIds = allNotifications
      .filter(n => !n.read?.[currentUser.id])
      .map(n => n.id);
    if (unreadIds.length > 0) {
      await markAllNotificationsRead(unreadIds, currentUser.id);
    }
  }, [currentUser?.id, allNotifications]);

  const clearNotif = useCallback(async (notifId) => {
    if (!currentUser?.id) return;
    await clearNotification(notifId, currentUser.id);
  }, [currentUser?.id]);

  const clearAllNotifs = useCallback(async () => {
    if (!currentUser?.id) return;
    const ids = allNotifications.map(n => n.id);
    if (ids.length > 0) {
      await clearAllNotifications(ids, currentUser.id);
    }
  }, [currentUser?.id, allNotifications]);

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  const filterByCategory = useCallback((category) => {
    if (!category || category === 'all') return allNotifications;
    if (category === 'unread') {
      return allNotifications.filter(n => !n.read?.[currentUser?.id]);
    }
    return allNotifications.filter(n => getNotifCategory(n.type) === category);
  }, [allNotifications, currentUser?.id]);

  const value = {
    notifications: allNotifications,
    unreadCount,
    toasts,
    markRead,
    markAllRead,
    clearNotif,
    clearAllNotifs,
    dismissToast,
    filterByCategory,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

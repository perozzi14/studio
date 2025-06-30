
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Appointment } from './types';
import { differenceInHours, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Notification {
  id: string;
  appointmentId: string;
  title: string;
  description: string;
  relativeTime: string;
  read: boolean;
  createdAt: string; // ISO string to sort and manage notifications
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  checkAndSetNotifications: (appointments: Appointment[]) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const NOTIFICATION_STORAGE_KEY = 'suma-patient-notifications';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[];
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } catch (e) {
      console.error("Failed to load notifications from localStorage", e);
    }
  }, []);


  const checkAndSetNotifications = useCallback((appointments: Appointment[]) => {
    const newNotificationsMap = new Map<string, Notification>();
    const now = new Date();
    
    let storedNotifications: Notification[] = [];
    try {
        storedNotifications = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || '[]') as Notification[];
    } catch {
        storedNotifications = [];
    }
    const existingIds = new Set(storedNotifications.map(n => n.id));

    appointments.forEach(appt => {
      const apptDateTime = new Date(`${appt.date}T${appt.time}`);
      const hoursUntil = differenceInHours(apptDateTime, now);

      const createNotification = (timeframe: '24h' | '3h') => {
        const id = `${appt.id}-${timeframe}`;
        
        if (existingIds.has(id)) return; // Don't create duplicate notifications

        const title = timeframe === '24h' 
          ? `Recordatorio: Cita Mañana`
          : `Recordatorio: Cita Pronto`;
        
        const description = `Tu cita con ${appt.doctorName} es en aprox. ${timeframe === '24h' ? '24 horas' : '3 horas'}. Por favor, recuerda llegar unos minutos antes. Estado: ${appt.paymentStatus}.`;
        
        newNotificationsMap.set(id, {
          id,
          appointmentId: appt.id,
          title,
          description,
          relativeTime: formatDistanceToNow(now, { locale: es, addSuffix: true }),
          read: false,
          createdAt: now.toISOString(),
        });
      };

      if (hoursUntil >= 23 && hoursUntil < 25) {
        createNotification('24h');
      }
      if (hoursUntil >= 2 && hoursUntil < 4) {
        createNotification('3h');
      }
    });

    if (newNotificationsMap.size > 0) {
      const uniqueNewNotifications = Array.from(newNotificationsMap.values());
      const updatedNotifications = [...uniqueNewNotifications, ...storedNotifications]
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
      setUnreadCount(prev => prev + uniqueNewNotifications.length);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    setNotifications(updated);
    setUnreadCount(0);
  }, [notifications]);
  
  const value = { notifications, unreadCount, checkAndSetNotifications, markAllAsRead };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

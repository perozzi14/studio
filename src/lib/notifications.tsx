
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  checkAndSetNotifications: (appointments: Appointment[]) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkAndSetNotifications = useCallback((appointments: Appointment[]) => {
    const newNotificationsMap = new Map<string, Notification>();
    const now = new Date();

    appointments.forEach(appt => {
      const apptDateTime = new Date(`${appt.date}T${appt.time}`);
      const hoursUntil = differenceInHours(apptDateTime, now);

      const createNotification = (timeframe: '24h' | '3h') => {
        const id = `${appt.id}-${timeframe}`;
        
        const title = timeframe === '24h' 
          ? `Recordatorio: Cita Mañana`
          : `Recordatorio: Cita Pronto`;
        
        const description = `Tu cita con ${appt.doctorName} es en aprox. ${timeframe === '24h' ? '24 horas' : '3 horas'}. Por favor, recuerda llegar unos minutos antes. Estado: ${appt.paymentStatus}.`;
        
        newNotificationsMap.set(id, {
          id,
          appointmentId: appt.id,
          title,
          description,
          relativeTime: formatDistanceToNow(new Date(), { locale: es, addSuffix: true }),
          read: false
        });
      };

      // Check for 24-hour reminder (window between 23 and 25 hours to catch it)
      if (hoursUntil >= 23 && hoursUntil < 25) {
        createNotification('24h');
      }
      // Check for 3-hour reminder (window between 2 and 4 hours)
      if (hoursUntil >= 2 && hoursUntil < 4) {
        createNotification('3h');
      }
    });

    if (newNotificationsMap.size > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNewNotifications = Array.from(newNotificationsMap.values()).filter(n => !existingIds.has(n.id));
        
        if (uniqueNewNotifications.length === 0) {
            return prev;
        }
        
        setUnreadCount(prevUnread => prevUnread + uniqueNewNotifications.length);
        return [...uniqueNewNotifications, ...prev].sort((a,b) => b.id.localeCompare(a.id));
      });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);
  
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

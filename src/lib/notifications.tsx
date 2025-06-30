
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Appointment, PatientNotification } from './types';
import { differenceInHours, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationContextType {
  notifications: PatientNotification[];
  unreadCount: number;
  checkAndSetNotifications: (appointments: Appointment[]) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const NOTIFICATION_STORAGE_KEY = 'suma-patient-notifications';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PatientNotification[];
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } catch (e) {
      console.error("Failed to load notifications from localStorage", e);
    }
  }, []);


  const checkAndSetNotifications = useCallback((appointments: Appointment[]) => {
    const newNotificationsMap = new Map<string, PatientNotification>();
    const now = new Date();
    
    let storedNotifications: PatientNotification[] = [];
    try {
        storedNotifications = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || '[]') as PatientNotification[];
    } catch {
        storedNotifications = [];
    }
    const existingIds = new Set(storedNotifications.map(n => n.id));

    appointments.forEach(appt => {
      const apptDateTime = new Date(`${appt.date}T${appt.time}`);
      const hoursUntil = differenceInHours(apptDateTime, now);

      // --- Reminder Notifications ---
      const createReminder = (timeframe: '24h' | '3h') => {
        const id = `reminder-${appt.id}-${timeframe}`;
        if (existingIds.has(id)) return;
        
        const title = timeframe === '24h' 
          ? `Recordatorio: Cita Mañana`
          : `Recordatorio: Cita Pronto`;
        
        const description = `Tu cita con ${appt.doctorName} es en aprox. ${timeframe === '24h' ? '24 horas' : '3 horas'}.`;
        
        newNotificationsMap.set(id, {
          id,
          type: 'reminder',
          appointmentId: appt.id,
          title,
          description,
          relativeTime: formatDistanceToNow(now, { locale: es, addSuffix: true }),
          read: false,
          createdAt: now.toISOString(),
          link: '/dashboard',
        });
      };
      if (hoursUntil > 0 && hoursUntil < 25) createReminder('24h');
      if (hoursUntil > 0 && hoursUntil < 4) createReminder('3h');

      // --- Payment Approved Notification ---
      if (appt.paymentStatus === 'Pagado') {
          const id = `payment-approved-${appt.id}`;
          if (!existingIds.has(id)) {
              newNotificationsMap.set(id, {
                  id,
                  type: 'payment_approved',
                  appointmentId: appt.id,
                  title: '¡Pago Aprobado!',
                  description: `El Dr. ${appt.doctorName} ha confirmado tu pago para la cita.`,
                  relativeTime: formatDistanceToNow(now, { locale: es, addSuffix: true }),
                  read: false,
                  createdAt: now.toISOString(),
                  link: '/dashboard',
              });
          }
      }

      // --- New Message from Doctor ---
      const lastMessage = appt.messages?.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (lastMessage?.sender === 'doctor') {
          const id = `new-message-${lastMessage.id}`;
          if (!existingIds.has(id)) {
               newNotificationsMap.set(id, {
                  id,
                  type: 'new_message',
                  appointmentId: appt.id,
                  title: `Nuevo Mensaje de ${appt.doctorName}`,
                  description: lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? '...' : ''),
                  relativeTime: formatDistanceToNow(now, { locale: es, addSuffix: true }),
                  read: false,
                  createdAt: now.toISOString(),
                  link: '/dashboard',
              });
          }
      }
      
      // --- Clinical Record Added ---
      if (appt.attendance === 'Atendido' && (appt.clinicalNotes || appt.prescription)) {
          const id = `record-added-${appt.id}`;
          if (!existingIds.has(id)) {
              newNotificationsMap.set(id, {
                  id,
                  type: 'record_added',
                  appointmentId: appt.id,
                  title: `Resumen de Cita Disponible`,
                  description: `El Dr. ${appt.doctorName} ha añadido notas o un récipe a tu cita pasada.`,
                  relativeTime: formatDistanceToNow(now, { locale: es, addSuffix: true }),
                  read: false,
                  createdAt: now.toISOString(),
                  link: '/dashboard',
              });
          }
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

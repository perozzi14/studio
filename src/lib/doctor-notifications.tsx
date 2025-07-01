
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Appointment, DoctorNotification, AdminSupportTicket } from './types';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from './auth';

interface DoctorNotificationContextType {
  doctorNotifications: DoctorNotification[];
  doctorUnreadCount: number;
  checkAndSetDoctorNotifications: (appointments: Appointment[], supportTickets: AdminSupportTicket[]) => void;
  markDoctorNotificationsAsRead: () => void;
}

const DoctorNotificationContext = createContext<DoctorNotificationContextType | undefined>(undefined);
const getNotificationStorageKey = (userId: string) => `suma-doctor-notifications-${userId}`;

export function DoctorNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [doctorNotifications, setDoctorNotifications] = useState<DoctorNotification[]>([]);
  const [doctorUnreadCount, setDoctorUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id && user.role === 'doctor') {
      try {
        const storageKey = getNotificationStorageKey(user.id);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as DoctorNotification[];
          setDoctorNotifications(parsed);
          setDoctorUnreadCount(parsed.filter(n => !n.read).length);
        } else {
          setDoctorNotifications([]);
          setDoctorUnreadCount(0);
        }
      } catch (e) {
        console.error("Failed to load doctor notifications from localStorage", e);
        setDoctorNotifications([]);
        setDoctorUnreadCount(0);
      }
    } else {
      setDoctorNotifications([]);
      setDoctorUnreadCount(0);
    }
  }, [user]);

  const checkAndSetDoctorNotifications = useCallback((appointments: Appointment[], supportTickets: AdminSupportTicket[]) => {
    if (!user?.id || user.role !== 'doctor') return;

    const storageKey = getNotificationStorageKey(user.id);
    const newNotificationsMap = new Map<string, DoctorNotification>();
    const now = new Date();
    
    const existingIds = new Set(doctorNotifications.map(n => n.id));

    // --- Generate Notifications ---

    appointments.forEach(appt => {
      // 1. Payment Verification
      if (appt.paymentMethod === 'transferencia' && appt.paymentStatus === 'Pendiente') {
        const id = `verify-${appt.id}`;
        if (!existingIds.has(id)) {
            newNotificationsMap.set(id, {
                id,
                type: 'payment_verification',
                title: 'Verificación de Pago',
                description: `El paciente ${appt.patientName} espera aprobación.`,
                date: appt.date,
                createdAt: now.toISOString(),
                read: false,
                link: `/doctor/dashboard?view=appointments`
            });
        }
      }

      // 2. Patient Confirmation
      if (appt.patientConfirmationStatus === 'Confirmada' || appt.patientConfirmationStatus === 'Cancelada') {
         const id = `confirm-${appt.id}-${appt.patientConfirmationStatus}-${appt.date}`;
         if (!existingIds.has(id)) {
             newNotificationsMap.set(id, {
                 id,
                 type: appt.patientConfirmationStatus === 'Confirmada' ? 'patient_confirmed' : 'patient_cancelled',
                 title: `Cita ${appt.patientConfirmationStatus}`,
                 description: `${appt.patientName} ha ${appt.patientConfirmationStatus.toLowerCase()} su cita del ${format(new Date(appt.date + 'T00:00:00'), 'dd/MM/yy', { locale: es })}.`,
                 date: new Date().toISOString(),
                 createdAt: now.toISOString(),
                 read: false,
                 link: `/doctor/dashboard?view=appointments`
             });
         }
      }
      
      // 3. New Messages
      const lastMessage = appt.messages?.[appt.messages.length - 1];
      if (lastMessage?.sender === 'patient') {
          const id = `msg-${appt.id}-${lastMessage.id}`;
          if (!existingIds.has(id)) {
              newNotificationsMap.set(id, {
                  id,
                  type: 'new_message',
                  title: `Nuevo Mensaje de ${appt.patientName}`,
                  description: lastMessage.text.substring(0, 50) + '...',
                  date: lastMessage.timestamp,
                  createdAt: now.toISOString(),
                  read: false,
                  link: `/doctor/dashboard?view=appointments`
              });
          }
      }
    });

    // 4. Support Ticket Replies
    supportTickets.forEach(ticket => {
        const lastMessage = ticket.messages?.[ticket.messages.length - 1];
        if (lastMessage?.sender === 'admin') {
            const id = `support-${ticket.id}-${lastMessage.id}`;
            if (!existingIds.has(id)) {
                newNotificationsMap.set(id, {
                    id,
                    type: 'support_reply',
                    title: `Respuesta de Soporte`,
                    description: `El equipo de SUMA ha respondido a tu ticket: "${ticket.subject}"`,
                    date: lastMessage.timestamp,
                    createdAt: now.toISOString(),
                    read: false,
                    link: `/doctor/dashboard?view=support`
                });
            }
        }
    });

    // --- End Generate Notifications ---


    if (newNotificationsMap.size > 0) {
      const uniqueNewNotifications = Array.from(newNotificationsMap.values());
      const updatedNotifications = [...uniqueNewNotifications, ...doctorNotifications]
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
      setDoctorNotifications(updatedNotifications);
      setDoctorUnreadCount(prev => prev + uniqueNewNotifications.length);
    }
  }, [doctorNotifications, user]);

  const markDoctorNotificationsAsRead = useCallback(() => {
    if (!user?.id || user.role !== 'doctor') return;
    const storageKey = getNotificationStorageKey(user.id);
    const updated = doctorNotifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setDoctorNotifications(updated);
    setDoctorUnreadCount(0);
  }, [doctorNotifications, user]);
  
  const value = { doctorNotifications, doctorUnreadCount, checkAndSetDoctorNotifications, markDoctorNotificationsAsRead };

  return (
    <DoctorNotificationContext.Provider value={value}>
      {children}
    </DoctorNotificationContext.Provider>
  );
}

export function useDoctorNotifications() {
  const context = useContext(DoctorNotificationContext);
  if (context === undefined) {
    throw new Error('useDoctorNotifications must be used within a DoctorNotificationProvider');
  }
  return context;
}


"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Appointment, DoctorNotification, AdminSupportTicket, DoctorPayment } from './types';
import { useAuth } from './auth';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

interface DoctorNotificationContextType {
  doctorNotifications: DoctorNotification[];
  doctorUnreadCount: number;
  checkAndSetDoctorNotifications: (
    appointments: Appointment[], 
    supportTickets: AdminSupportTicket[], 
    doctorPayments: DoctorPayment[]
  ) => void;
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

  const checkAndSetDoctorNotifications = useCallback((
    appointments: Appointment[], 
    supportTickets: AdminSupportTicket[],
    doctorPayments: DoctorPayment[]
  ) => {
    if (!user?.id || user.role !== 'doctor') return;

    const storageKey = getNotificationStorageKey(user.id);
    const newNotificationsMap = new Map<string, DoctorNotification>();
    const now = new Date();
    
    const existingIds = new Set(doctorNotifications.map(n => n.id));

    // --- Generate Notifications ---

    // 1. Payment Verification needed from you
    appointments.forEach(appt => {
      if (appt.paymentMethod === 'transferencia' && appt.paymentStatus === 'Pendiente') {
        const id = `verify-${appt.id}`;
        if (!existingIds.has(id)) {
            newNotificationsMap.set(id, {
                id, type: 'payment_verification', title: 'Verificación de Pago',
                description: `El paciente ${appt.patientName} espera aprobación.`,
                date: appt.date, createdAt: now.toISOString(), read: false,
                link: `/doctor/dashboard?view=appointments`
            });
        }
      }
      // 2. Patient Confirmation status change
      if (appt.patientConfirmationStatus === 'Confirmada' || appt.patientConfirmationStatus === 'Cancelada') {
         const id = `confirm-${appt.id}-${appt.patientConfirmationStatus}`;
         if (!existingIds.has(id)) {
             newNotificationsMap.set(id, {
                 id, type: appt.patientConfirmationStatus === 'Confirmada' ? 'patient_confirmed' : 'patient_cancelled',
                 title: `Cita ${appt.patientConfirmationStatus}`,
                 description: `${appt.patientName} ha ${appt.patientConfirmationStatus.toLowerCase()} su cita.`,
                 date: new Date().toISOString(), createdAt: now.toISOString(), read: false,
                 link: `/doctor/dashboard?view=appointments`
             });
         }
      }
      // 3. New Messages from patient
      const lastMessage = appt.messages?.slice(-1)[0];
      if (lastMessage?.sender === 'patient') {
          const id = `msg-${appt.id}-${lastMessage.id}`;
          if (!existingIds.has(id)) {
              newNotificationsMap.set(id, {
                  id, type: 'new_message', title: `Nuevo Mensaje de ${appt.patientName}`,
                  description: lastMessage.text.substring(0, 50) + '...',
                  date: lastMessage.timestamp, createdAt: now.toISOString(), read: false,
                  link: `/doctor/dashboard?view=appointments`
              });
          }
      }
    });

    // 4. Subscription payment update from admin
    doctorPayments.forEach(payment => {
        if ((payment.status === 'Paid' || payment.status === 'Rejected') && !payment.readByDoctor) {
            const id = `sub-${payment.id}-${payment.status}`;
            if (!existingIds.has(id)) {
                newNotificationsMap.set(id, {
                    id, type: 'subscription_update',
                    title: `Suscripción ${payment.status === 'Paid' ? 'Aprobada' : 'Rechazada'}`,
                    description: `Tu pago de $${payment.amount.toFixed(2)} ha sido ${payment.status === 'Paid' ? 'aprobado' : 'rechazado'}.`,
                    date: payment.date, createdAt: now.toISOString(), read: false,
                    link: '/doctor/dashboard?view=subscription'
                });
            }
        }
    });

    // 5. Support Ticket Replies from admin
    supportTickets.forEach(ticket => {
        const lastMessage = ticket.messages?.slice(-1)[0];
        if (lastMessage?.sender === 'admin' && ticket.userId === user.email) {
            const id = `support-${ticket.id}-${lastMessage.id}`;
            if (!existingIds.has(id)) {
                newNotificationsMap.set(id, {
                    id, type: 'support_reply',
                    title: `Respuesta de Soporte`,
                    description: `El equipo de SUMA ha respondido a tu ticket: "${ticket.subject}"`,
                    date: lastMessage.timestamp, createdAt: now.toISOString(), read: false,
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

  const markDoctorNotificationsAsRead = useCallback(async () => {
    if (!user?.id || user.role !== 'doctor' || doctorUnreadCount === 0) return;
    
    const storageKey = getNotificationStorageKey(user.id);
    const updated = doctorNotifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setDoctorNotifications(updated);
    setDoctorUnreadCount(0);
    
    // Also mark notifications as read on the backend where applicable
    const paymentIdsToUpdate = doctorNotifications
        .filter(n => n.type === 'subscription_update' && !n.read)
        .map(n => n.id.split('-')[1]);
        
    if (paymentIdsToUpdate.length > 0) {
        const batch = writeBatch(db);
        paymentIdsToUpdate.forEach(id => {
            batch.update(doc(db, "doctorPayments", id), { readByDoctor: true });
        });
        try {
            await batch.commit();
        } catch (e) {
            console.error("Failed to mark doctor payment notifications as read in Firestore", e);
        }
    }
  }, [doctorNotifications, user, doctorUnreadCount]);
  
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

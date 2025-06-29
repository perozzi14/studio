"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import * as firestoreService from './firestoreService';
import type { Appointment } from './types';
import { useAuth } from './auth';

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id'| 'patientId' | 'patientName'>) => Promise<void>;
  updateAppointmentConfirmation: (appointmentId: string, status: 'Confirmada' | 'Cancelada') => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user } = useAuth();

  // Effect to fetch appointments when user changes
  useEffect(() => {
    // Define the async function inside the effect
    const doFetch = async () => {
      if (user?.role === 'patient' && user.id) {
        const patientAppointments = await firestoreService.getPatientAppointments(user.id);
        setAppointments(patientAppointments);
      } else {
        // If there's no user or the user is not a patient, clear the appointments
        setAppointments([]);
      }
    };

    doFetch();
  }, [user]); // Depend directly on the user object

  const addAppointment = useCallback(async (newAppointmentData: Omit<Appointment, 'id' | 'patientId' | 'patientName'>) => {
    if (!user) return; 

    const newAppointment: Omit<Appointment, 'id'> = {
      ...newAppointmentData,
      patientId: user.id,
      patientName: user.name,
    };
    
    await firestoreService.addAppointment(newAppointment);
    
    // Re-fetch appointments after adding a new one
    if (user.id && user.role === 'patient') {
        const patientAppointments = await firestoreService.getPatientAppointments(user.id);
        setAppointments(patientAppointments);
    }
  }, [user]);

  const updateAppointmentConfirmation = useCallback(async (appointmentId: string, status: 'Confirmada' | 'Cancelada') => {
    await firestoreService.updateAppointment(appointmentId, { patientConfirmationStatus: status });

    // Re-fetch appointments after updating one
    if (user?.id && user.role === 'patient') {
        const patientAppointments = await firestoreService.getPatientAppointments(user.id);
        setAppointments(patientAppointments);
    }
  }, [user]);

  const value = { appointments, addAppointment, updateAppointmentConfirmation };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}

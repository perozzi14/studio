
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import * as firestoreService from './firestoreService';
import type { Appointment } from './types';
import { useAuth } from './auth';

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id'| 'patientId' | 'patientName'>) => void;
  updateAppointmentConfirmation: (appointmentId: string, status: 'Confirmada' | 'Cancelada') => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if(user?.role === 'patient') {
      const patientAppointments = await firestoreService.getPatientAppointments(user.id);
      setAppointments(patientAppointments);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);


  const addAppointment = useCallback(async (newAppointmentData: Omit<Appointment, 'id' | 'patientId' | 'patientName'>) => {
    if (!user) return; 

    const newAppointment: Omit<Appointment, 'id'> = {
      ...newAppointmentData,
      patientId: user.id,
      patientName: user.name,
    };
    
    await firestoreService.addAppointment(newAppointment);
    fetchAppointments();
  }, [user, fetchAppointments]);

  const updateAppointmentConfirmation = useCallback(async (appointmentId: string, status: 'Confirmada' | 'Cancelada') => {
    await firestoreService.updateAppointment(appointmentId, { patientConfirmationStatus: status });
    fetchAppointments();
  }, [fetchAppointments]);

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

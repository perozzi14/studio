
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { appointments as initialAppointments, type Appointment, type Service } from './data';
import { useAuth } from './auth';

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id' | 'patientId' | 'patientName' | 'attendance'>) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const { user } = useAuth();

  const addAppointment = useCallback((newAppointmentData: Omit<Appointment, 'id' | 'patientId' | 'patientName' | 'attendance'>) => {
    if (!user) return; 

    const newAppointment: Appointment = {
      ...newAppointmentData,
      id: `appt-${Date.now()}`,
      patientId: user.email,
      patientName: user.name,
      attendance: 'Pendiente',
    };
    
    setAppointments(prev => [newAppointment, ...prev]);
  }, [user]);

  const value = { appointments, addAppointment };

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

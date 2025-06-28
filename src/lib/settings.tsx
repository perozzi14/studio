"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  doctorSubscriptionFee: number;
  setDoctorSubscriptionFee: (fee: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [doctorSubscriptionFee, setDoctorSubscriptionFee] = useState<number>(50);

  const value = { doctorSubscriptionFee, setDoctorSubscriptionFee };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

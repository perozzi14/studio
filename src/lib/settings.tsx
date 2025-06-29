
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { specialties as initialSpecialties, cities as initialCities, mockCoupons, type Coupon, mockCompanyBankDetails, type BankDetail } from './data';

interface SettingsContextType {
  doctorSubscriptionFee: number;
  setDoctorSubscriptionFee: (fee: number) => void;
  cities: string[];
  setCities: (cities: string[]) => void;
  specialties: string[];
  setSpecialties: (specialties: string[]) => void;
  coupons: Coupon[];
  setCoupons: (coupons: Coupon[]) => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  companyBankDetails: BankDetail[];
  setCompanyBankDetails: (details: BankDetail[]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [doctorSubscriptionFee, setDoctorSubscriptionFee] = useState<number>(50);
  const [cities, setCities] = useState<string[]>(initialCities);
  const [specialties, setSpecialties] = useState<string[]>(initialSpecialties);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [timezone, setTimezone] = useState<string>('America/Caracas');
  const [logoUrl, setLogoUrl] = useState<string>('/logo.svg'); // Placeholder
  const [currency, setCurrency] = useState<string>('USD');
  const [companyBankDetails, setCompanyBankDetails] = useState<BankDetail[]>(mockCompanyBankDetails);


  const value = { 
    doctorSubscriptionFee, setDoctorSubscriptionFee,
    cities, setCities,
    specialties, setSpecialties,
    coupons, setCoupons,
    timezone, setTimezone,
    logoUrl, setLogoUrl,
    currency, setCurrency,
    companyBankDetails, setCompanyBankDetails,
   };

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


"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import * as firestoreService from './firestoreService';
import type { AppSettings, Coupon, CompanyExpense, BankDetail, City } from './types';
import { useToast } from '@/hooks/use-toast';

interface SettingsContextType {
  settings: AppSettings | null;
  cities: City[];
  specialties: string[];
  beautySpecialties: string[];
  timezone: string;
  logoUrl: string;
  heroImageUrl: string;
  currency: string;
  companyBankDetails: BankDetail[];
  companyExpenses: CompanyExpense[];
  coupons: Coupon[];
  billingCycleStartDay: number;
  billingCycleEndDay: number;

  updateSetting: (key: keyof Omit<AppSettings, 'cities' | 'specialties' | 'companyBankDetails'>, value: any) => Promise<void>;
  
  addListItem: (listName: 'cities' | 'specialties', item: City | string) => Promise<void>;
  updateListItem: (listName: 'cities' | 'specialties', oldItemName: string, newItem: City | string) => Promise<void>;
  deleteListItem: (listName: 'cities' | 'specialties', itemToDeleteName: string) => Promise<void>;
  
  addCompanyExpense: (expense: Omit<CompanyExpense, 'id'>) => Promise<void>;
  updateCompanyExpense: (id: string, data: Partial<CompanyExpense>) => Promise<void>;
  deleteCompanyExpense: (id: string) => Promise<void>;

  addCoupon: (coupon: Omit<Coupon, 'id'>) => Promise<void>;
  updateCoupon: (id: string, data: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  
  addBankDetail: (bankDetail: Omit<BankDetail, 'id'>) => Promise<void>;
  updateBankDetail: (id: string, data: Partial<BankDetail>) => Promise<void>;
  deleteBankDetail: (id: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const skeletonContextValue: SettingsContextType = {
  settings: null,
  cities: [],
  specialties: [],
  beautySpecialties: [],
  timezone: '',
  logoUrl: '',
  heroImageUrl: '',
  currency: 'USD',
  companyBankDetails: [],
  companyExpenses: [],
  coupons: [],
  billingCycleStartDay: 1,
  billingCycleEndDay: 6,
  updateSetting: async () => {},
  addListItem: async () => {},
  updateListItem: async () => {},
  deleteListItem: async () => {},
  addCompanyExpense: async () => {},
  updateCompanyExpense: async () => {},
  deleteCompanyExpense: async () => {},
  addCoupon: async () => {},
  updateCoupon: async () => {},
  deleteCoupon: async () => {},
  addBankDetail: async () => {},
  updateBankDetail: async () => {},
  deleteBankDetail: async () => {},
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [companyExpenses, setCompanyExpenses] = useState<CompanyExpense[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [settingsData, expensesData, couponsData] = await Promise.all([
          firestoreService.getSettings(),
          firestoreService.getCompanyExpenses(),
          firestoreService.getCoupons()
        ]);
        setSettings(settingsData);
        setCompanyExpenses(expensesData);
        setCoupons(couponsData);
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({ variant: 'destructive', title: "Error de Carga", description: "No se pudo cargar la configuración."});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSetting = useCallback(async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    await firestoreService.updateSettings({ [key]: value });
    setSettings(newSettings);
  }, [settings]);
  
  const addListItem = useCallback(async (listName: 'cities' | 'specialties', item: City | string) => {
    if (!settings || !item) return;

    if (listName === 'cities') {
      const cityItem = item as City;
      const list = settings.cities || [];
      if (list.some(c => c && c.name && c.name.toLowerCase() === cityItem.name.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `La ciudad "${cityItem.name}" ya existe.` });
        return;
      }
      const newList = [...list, cityItem];
      await updateSetting('cities', newList);
    } else { // It's a specialty (string)
      const specialtyItem = item as string;
      const list = settings.specialties || [];
      if (list.map(i => i.toLowerCase()).includes(specialtyItem.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `"${specialtyItem}" ya existe en la lista.` });
        return;
      }
      const newList = [...list, specialtyItem];
      await updateSetting('specialties', newList);
    }
  }, [settings, updateSetting, toast]);

  const updateListItem = useCallback(async (listName: 'cities' | 'specialties', oldItemName: string, newItem: City | string) => {
    if (!settings || !newItem) return;

    if (listName === 'cities') {
      const newCityItem = newItem as City;
      const list = settings.cities || [];
      const newList = list.map(item => (item && item.name === oldItemName) ? newCityItem : item);
      await updateSetting('cities', newList);
    } else { // It's a specialty (string)
      const newSpecialtyItem = newItem as string;
      const list = settings.specialties || [];
      const newList = list.map(item => item === oldItemName ? newSpecialtyItem : item);
      await updateSetting('specialties', newList);
    }
  }, [settings, updateSetting]);

  const deleteListItem = useCallback(async (listName: 'cities' | 'specialties', itemToDeleteName: string) => {
    if (!settings) return;
    if (listName === 'cities') {
      const list = settings.cities || [];
      const newList = list.filter(item => item && item.name !== itemToDeleteName);
      await updateSetting('cities', newList);
    } else { // It's a specialty (string)
      const list = settings.specialties || [];
      const newList = list.filter(item => item !== itemToDeleteName);
      await updateSetting('specialties', newList);
    }
  }, [settings, updateSetting]);

  const addCompanyExpense = useCallback(async (expense: Omit<CompanyExpense, 'id'>) => {
    await firestoreService.addCompanyExpense(expense);
    fetchData();
  }, [fetchData]);

  const updateCompanyExpense = useCallback(async (id: string, data: Partial<CompanyExpense>) => {
    await firestoreService.updateCompanyExpense(id, data);
    fetchData();
  }, [fetchData]);
  
  const deleteCompanyExpense = useCallback(async (id: string) => {
    await firestoreService.deleteCompanyExpense(id);
    fetchData();
  }, [fetchData]);

  const addCoupon = useCallback(async (coupon: Omit<Coupon, 'id'>) => {
    await firestoreService.addCoupon(coupon);
    fetchData();
  }, [fetchData]);

  const updateCoupon = useCallback(async (id: string, data: Partial<Coupon>) => {
    await firestoreService.updateCoupon(id, data);
    fetchData();
  }, [fetchData]);

  const deleteCoupon = useCallback(async (id: string) => {
    await firestoreService.deleteCoupon(id);
    fetchData();
  }, [fetchData]);

  const addBankDetail = useCallback(async (bankDetail: Omit<BankDetail, 'id'>) => {
    if (!settings) return;
    const newList = [...(settings.companyBankDetails || []), { ...bankDetail, id: `bank-${Date.now()}` }];
    await updateSetting('companyBankDetails', newList);
  }, [settings, updateSetting]);

  const updateBankDetail = useCallback(async (id: string, data: Partial<BankDetail>) => {
    if (!settings) return;
    const newList = settings.companyBankDetails.map(bd => bd.id === id ? { ...bd, ...data } : bd);
    await updateSetting('companyBankDetails', newList);
  }, [settings, updateSetting]);
  
  const deleteBankDetail = useCallback(async (id: string) => {
    if (!settings) return;
    const newList = settings.companyBankDetails.filter(bd => bd.id !== id);
    await updateSetting('companyBankDetails', newList);
  }, [settings, updateSetting]);


  const value: SettingsContextType = {
    settings,
    cities: settings?.cities || [],
    specialties: settings?.specialties || [],
    beautySpecialties: settings?.beautySpecialties || [],
    timezone: settings?.timezone || '',
    logoUrl: settings?.logoUrl || '',
    heroImageUrl: settings?.heroImageUrl || '',
    currency: settings?.currency || 'USD',
    companyBankDetails: settings?.companyBankDetails || [],
    companyExpenses,
    coupons,
    billingCycleStartDay: settings?.billingCycleStartDay ?? 1,
    billingCycleEndDay: settings?.billingCycleEndDay ?? 6,
    updateSetting,
    addListItem,
    updateListItem,
    deleteListItem,
    addCompanyExpense,
    updateCompanyExpense,
    deleteCompanyExpense,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    addBankDetail,
    updateBankDetail,
    deleteBankDetail,
  };

  if (isLoading) {
    return (
      <SettingsContext.Provider value={skeletonContextValue}>
        {children}
      </SettingsContext.Provider>
    );
  }

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

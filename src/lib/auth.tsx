
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as firestoreService from './firestoreService';
import type { Patient } from './types';

interface User extends Patient {
  role: 'patient' | 'doctor' | 'seller' | 'admin';
  referralCode?: string;
}

interface AuthContextType {
  user: User | null | undefined; // undefined means still loading
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<Omit<User, 'role' | 'email'>>) => void;
  toggleFavoriteDoctor: (doctorId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  
  const fetchUserByEmail = useCallback(async (email: string): Promise<User | null> => {
    const lowerEmail = email.toLowerCase();
    
    // Check if it's an admin
    if (lowerEmail === 'admin@admin.com') {
      return { 
        id: 'admin@admin.com',
        email, 
        name: 'Administrador', 
        role: 'admin', 
        age: null, 
        gender: null,
        cedula: null,
        phone: null,
        profileImage: 'https://placehold.co/100x100.png',
        favoriteDoctorIds: []
      };
    }
    
    // Check if it's a doctor, seller, or patient
    const [doctors, sellers, patients] = await Promise.all([
        firestoreService.getDoctors(),
        firestoreService.getSellers(),
        firestoreService.getPatients(),
    ]);

    const doctor = doctors.find(d => d.email.toLowerCase() === lowerEmail);
    if (doctor) return { ...doctor, role: 'doctor', favoriteDoctorIds: [] };

    const seller = sellers.find(s => s.email.toLowerCase() === lowerEmail);
    if (seller) return { ...seller, age: null, gender: null, cedula: null, role: 'seller', favoriteDoctorIds: [] };
    
    const patient = patients.find(p => p.email.toLowerCase() === lowerEmail);
    if (patient) return { ...patient, role: 'patient' };

    return null;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Re-fetch user data to ensure it's up to date
          const freshUser = await fetchUserByEmail(parsedUser.email);
          setUser(freshUser);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    initializeAuth();
  }, [fetchUserByEmail]);

  const login = async (email: string, name: string = 'Nuevo Usuario') => {
    let loggedInUser = await fetchUserByEmail(email);

    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      switch(loggedInUser.role) {
        case 'admin': router.push('/admin/dashboard'); break;
        case 'doctor': router.push('/doctor/dashboard'); break;
        case 'seller': router.push('/seller/dashboard'); break;
        case 'patient': router.push('/dashboard'); break;
      }
    } else {
      // Register new patient
      const newPatient: Omit<Patient, 'id'> = { email, name, age: null, gender: null, profileImage: null, cedula: null, phone: null, favoriteDoctorIds: [] };
      const docRef = await firestoreService.addPatient(newPatient);
      const newUser: User = { id: docRef.id, ...newPatient, role: 'patient' };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      router.push('/dashboard');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  };

  const updateUser = async (data: Partial<Omit<User, 'role' | 'email'>>) => {
    if (!user) return;
    
    const updateData: Partial<Patient> = { ...data };
    await firestoreService.updatePatient(user.id, updateData);

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const toggleFavoriteDoctor = async (doctorId: string) => {
    if (!user || user.role !== 'patient') return;

    const favorites = user.favoriteDoctorIds || [];
    const isFavorite = favorites.includes(doctorId);
    const newFavorites = isFavorite
        ? favorites.filter(id => id !== doctorId)
        : [...favorites, doctorId];
        
    await updateUser({ favoriteDoctorIds: newFavorites });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, toggleFavoriteDoctor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

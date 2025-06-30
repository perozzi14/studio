
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as firestoreService from './firestoreService';
import type { Patient, Doctor, Seller } from './types';
import { useToast } from '@/hooks/use-toast';

// The User type represents the logged-in user and must have all Patient properties for consistency across the app.
interface User extends Patient {
  role: 'patient' | 'doctor' | 'seller' | 'admin';
  referralCode?: string;
}

interface AuthContextType {
  user: User | null | undefined; // undefined means still loading
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<Patient>) => void;
  toggleFavoriteDoctor: (doctorId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildUserFromData = (userData: (Doctor | Seller | Patient) & { role: 'doctor' | 'seller' | 'patient' }): User => {
  const { role } = userData;

  if (role === 'patient') {
    const patientData = userData as Patient;
    return {
      id: patientData.id,
      name: patientData.name,
      email: patientData.email,
      password: patientData.password,
      role: 'patient',
      age: patientData.age || null,
      gender: patientData.gender || null,
      phone: patientData.phone || null,
      cedula: patientData.cedula || null,
      favoriteDoctorIds: patientData.favoriteDoctorIds || [],
      profileImage: patientData.profileImage || undefined,
    };
  }

  if (role === 'doctor') {
    const doctorData = userData as Doctor;
    return {
      id: doctorData.id,
      name: doctorData.name,
      email: doctorData.email,
      password: doctorData.password,
      phone: doctorData.whatsapp || null,
      cedula: doctorData.cedula || null,
      profileImage: doctorData.profileImage,
      age: null,
      gender: null,
      favoriteDoctorIds: [],
      role: 'doctor',
    };
  }

  if (role === 'seller') {
    const sellerData = userData as Seller;
    return {
      id: sellerData.id,
      name: sellerData.name,
      email: sellerData.email,
      password: sellerData.password,
      phone: sellerData.phone || null,
      profileImage: sellerData.profileImage,
      age: null,
      gender: null,
      cedula: null,
      favoriteDoctorIds: [],
      role: 'seller',
      referralCode: sellerData.referralCode,
    };
  }

  throw new Error(`Invalid user role: ${role}`);
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const { toast } = useToast();
  
  const fetchUserFromStorage = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const freshUser = await firestoreService.findUserByEmail(parsedUser.email);
        if (freshUser) {
          setUser(buildUserFromData(freshUser));
        } else {
           setUser(null);
           localStorage.removeItem('user');
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUserFromStorage();
  }, [fetchUserFromStorage]);

  const login = async (email: string, password: string) => {
    const lowerEmail = email.toLowerCase();
    
    // Handle admin login
    if (lowerEmail === 'admin@admin.com') {
      if (password === '1234') { // Using a simple, non-secure password for this mock.
        const adminUser: User = { 
          id: 'admin@admin.com', email, name: 'Administrador', role: 'admin', age: null, gender: null,
          cedula: null, phone: null, profileImage: 'https://placehold.co/100x100.png', favoriteDoctorIds: []
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        router.push('/admin/dashboard');
        return;
      } else {
        toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'La contraseña es incorrecta.' });
        return;
      }
    }

    // Handle other user roles
    const userToAuth = await firestoreService.findUserByEmail(lowerEmail);

    if (!userToAuth) {
      toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'El usuario no existe.' });
      return;
    }

    if (userToAuth.password !== password) {
      toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'La contraseña es incorrecta.' });
      return;
    }

    const loggedInUser = buildUserFromData(userToAuth);
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));

    switch(loggedInUser.role) {
      case 'admin': router.push('/admin/dashboard'); break;
      case 'doctor': router.push('/doctor/dashboard'); break;
      case 'seller': router.push('/seller/dashboard?view=referrals'); break;
      case 'patient': router.push('/dashboard'); break;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const existingUser = await firestoreService.findUserByEmail(email);
    if (existingUser) {
      toast({ variant: "destructive", title: "Error de Registro", description: "Este correo electrónico ya está en uso." });
      return;
    }

    const newPatientData: Omit<Patient, 'id'> = { name, email, password, age: null, gender: null, profileImage: undefined, cedula: null, phone: null, favoriteDoctorIds: [] };
    const newPatientId = await firestoreService.addPatient(newPatientData);
    
    const newUser: User = { id: newPatientId, ...newPatientData, role: 'patient' };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  };

  const updateUser = async (data: Partial<Patient>) => {
    if (!user || user.role !== 'patient' || !user.id) return;
    
    await firestoreService.updatePatient(user.id, data);

    const updatedUser = { ...user, ...data };
    setUser(updatedUser as User);
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
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, toggleFavoriteDoctor }}>
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

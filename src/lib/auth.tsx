
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doctors, sellers } from './data';

interface User {
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'seller';
  age: number | null;
  gender: 'masculino' | 'femenino' | 'otro' | null;
  profileImage: string | null;
  cedula: string | null;
  phone: string | null;
  favoriteDoctorIds: number[];
  referralCode?: string;
}

interface AuthContextType {
  user: User | null | undefined; // undefined means still loading
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<Omit<User, 'role' | 'email'>>) => void;
  toggleFavoriteDoctor: (doctorId: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Ensure favoriteDoctorIds is an array
        if (!parsedUser.favoriteDoctorIds) {
          parsedUser.favoriteDoctorIds = [];
        }
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const login = (email: string, name: string = 'Nuevo Usuario') => {
    let loggedInUser: User;
    const lowerEmail = email.toLowerCase();

    if (lowerEmail === 'doctor@admin.com') {
      const doctorInfo = doctors.find(d => d.id === 1);
      loggedInUser = { 
        email, 
        name: doctorInfo?.name || 'Doctor Admin', 
        role: 'doctor', 
        age: null, 
        gender: null,
        cedula: null,
        phone: null,
        profileImage: doctorInfo?.profileImage || null,
        favoriteDoctorIds: []
      };
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      router.push('/doctor/dashboard');
    } else if (lowerEmail === 'vendedora@venta.com') {
      const sellerInfo = sellers.find(s => s.email.toLowerCase() === lowerEmail);
      loggedInUser = { 
        email, 
        name: sellerInfo?.name || 'Vendedora', 
        role: 'seller', 
        age: null, 
        gender: null,
        cedula: null,
        phone: sellerInfo?.phone || null,
        profileImage: sellerInfo?.profileImage || 'https://placehold.co/100x100.png',
        favoriteDoctorIds: [],
        referralCode: sellerInfo?.referralCode
      };
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      router.push('/seller/dashboard');
    }
    else {
      loggedInUser = { email, name, role: 'patient', age: null, gender: null, profileImage: null, cedula: null, phone: null, favoriteDoctorIds: [] };
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      router.push('/dashboard');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  };

  const updateUser = (data: Partial<Omit<User, 'role' | 'email'>>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const toggleFavoriteDoctor = (doctorId: number) => {
    setUser(prevUser => {
        if (!prevUser || prevUser.role !== 'patient') return prevUser;
        
        const favorites = prevUser.favoriteDoctorIds || [];
        const isFavorite = favorites.includes(doctorId);
        
        const newFavorites = isFavorite
            ? favorites.filter(id => id !== doctorId)
            : [...favorites, doctorId];
            
        const updatedUser = { ...prevUser, favoriteDoctorIds: newFavorites };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    });
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

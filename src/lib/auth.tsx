
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doctors } from './data';

interface User {
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  age: number | null;
  gender: 'masculino' | 'femenino' | 'otro' | null;
  profileImage: string | null;
  cedula: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null | undefined; // undefined means still loading
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<Omit<User, 'role' | 'email'>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const login = (email: string, name: string = 'Nuevo Usuario') => {
    let loggedInUser: User;
    if (email.toLowerCase() === 'doctor@admin.com') {
      const doctorInfo = doctors.find(d => d.id === 1);
      loggedInUser = { 
        email, 
        name: doctorInfo?.name || 'Doctor Admin', 
        role: 'doctor', 
        age: null, 
        gender: null,
        cedula: null,
        phone: null,
        profileImage: doctorInfo?.profileImage || null
      };
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      router.push('/doctor/dashboard');
    } else {
      loggedInUser = { email, name, role: 'patient', age: null, gender: null, profileImage: null, cedula: null, phone: null };
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

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
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


"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as firestoreService from './firestoreService';
import type { Patient, Doctor, Seller } from './types';
import { useToast } from '@/hooks/use-toast';
import { auth } from './client-auth';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// The User type represents the logged-in user and must have all Patient properties for consistency across the app.
interface User extends Patient {
  role: 'patient' | 'doctor' | 'seller' | 'admin';
  referralCode?: string;
}

interface DoctorRegistrationData {
  name: string;
  email: string;
  password: string;
  specialty: string;
  city: string;
  address: string;
  slotDuration: number;
  consultationFee: number;
}

interface AuthContextType {
  user: User | null | undefined; // undefined means still loading
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerDoctor: (doctorData: DoctorRegistrationData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
      city: patientData.city || null,
      favoriteDoctorIds: patientData.favoriteDoctorIds || [],
      profileImage: patientData.profileImage || null,
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
      city: null,
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
      city: null,
      favoriteDoctorIds: [],
      role: 'seller',
      referralCode: sellerData.referralCode,
    };
  }

  throw new Error(`Invalid user role: ${role}`);
};

/**
 * Provides authentication services for the application.
 *
 * ARCHITECTURAL NOTE ON USER ROLES:
 * The current system architecture enforces a one-to-one relationship between an email address
 * and a user role (patient, doctor, seller, or admin). A single email cannot hold multiple roles.
 *
 * For scenarios where a user might need multiple roles (e.g., a doctor who is also a patient),
 * the recommended approach is to use a separate email address for each role.
 * For example:
 * - dr.smith@email.com (for the Doctor account)
 * - dr.smith.patient@email.com (for the Patient account)
 *
 * An ideal future enhancement would be a role-switching system, allowing a single user account
 * to toggle between different views and permissions, but this would require a significant
 * refactoring of the current authentication and data models.
 */
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
          cedula: null, phone: null, profileImage: 'https://placehold.co/100x100.png', favoriteDoctorIds: [], password: '1234',
          city: null
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

    if (!userToAuth.password || userToAuth.password !== password) {
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

    const newPatientData: Omit<Patient, 'id'> = { name, email, password, age: null, gender: null, profileImage: null, cedula: null, phone: null, city: null, favoriteDoctorIds: [] };
    const newPatientId = await firestoreService.addPatient(newPatientData);
    
    const newUser: User = { id: newPatientId, ...newPatientData, role: 'patient' };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  const registerDoctor = async (doctorData: DoctorRegistrationData) => {
    const { email, password, name, specialty, city, address, slotDuration, consultationFee } = doctorData;
    
    const existingUser = await firestoreService.findUserByEmail(email);
    if (existingUser) {
        toast({ variant: "destructive", title: "Error de Registro", description: "Este correo electrónico ya está en uso." });
        return;
    }
    
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const newDoctorData: Omit<Doctor, 'id'> = {
        name, email, specialty, city, address, password,
        sellerId: null, // As requested, referred by admin/system
        cedula: '',
        sector: '',
        rating: 0,
        reviewCount: 0,
        profileImage: 'https://placehold.co/400x400.png',
        bannerImage: 'https://placehold.co/1200x400.png',
        aiHint: 'doctor portrait',
        description: 'Especialista comprometido con la salud y el bienestar de mis pacientes.',
        services: [],
        bankDetails: [],
        slotDuration: slotDuration,
        consultationFee: consultationFee,
        schedule: {
            monday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
            tuesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
            wednesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
            thursday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
            friday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
            saturday: { active: false, slots: [] },
            sunday: { active: false, slots: [] },
        },
        status: 'active',
        lastPaymentDate: now.toISOString().split('T')[0],
        whatsapp: '',
        lat: 0, lng: 0,
        joinDate: now.toISOString().split('T')[0],
        subscriptionStatus: 'active',
        nextPaymentDate: nextMonth.toISOString().split('T')[0],
        coupons: [],
        expenses: [],
    };
    
    const newDoctorRef = await firestoreService.addDoctor(newDoctorData);
    const newDoctorId = newDoctorRef.id;
    
    const loggedInUser = buildUserFromData({ ...newDoctorData, id: newDoctorId, role: 'doctor' });
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    router.push('/doctor/dashboard');
};

  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser.email) {
        toast({ variant: 'destructive', title: 'Error de Google', description: 'No se pudo obtener el correo electrónico de tu cuenta de Google.' });
        return;
      }
      
      let userToAuth = await firestoreService.findUserByEmail(googleUser.email);

      // If user doesn't exist, create a new patient record
      if (!userToAuth) {
        const newPatientData: Omit<Patient, 'id'> = {
          name: googleUser.displayName || 'Usuario de Google',
          email: googleUser.email,
          password: '', // No password for social logins
          age: null,
          gender: null,
          profileImage: googleUser.photoURL || null,
          phone: googleUser.phoneNumber || null,
          city: null,
          favoriteDoctorIds: []
        };
        const newPatientId = await firestoreService.addPatient(newPatientData);
        userToAuth = { ...newPatientData, id: newPatientId, role: 'patient' };
      }
      
      // Deny login if the email belongs to a non-patient user
      if (userToAuth.role !== 'patient') {
        toast({ variant: 'destructive', title: 'Acceso Denegado', description: 'El inicio de sesión con Google es solo para pacientes. Por favor, usa tu correo y contraseña.' });
        return;
      }

      const loggedInUser = buildUserFromData(userToAuth);
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      router.push('/dashboard');
      
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({ variant: 'destructive', title: 'Error de Autenticación', description: `No se pudo iniciar sesión con Google. ${error.message}` });
    }
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
    <AuthContext.Provider value={{ user, login, register, registerDoctor, signInWithGoogle, logout, updateUser, toggleFavoriteDoctor }}>
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

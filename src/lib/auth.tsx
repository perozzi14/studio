
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as firestoreService from './firestoreService';
import type { Patient, Doctor, Seller } from './types';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from './firebase';

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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerDoctor: (doctorData: DoctorRegistrationData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<Patient | Seller>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  toggleFavoriteDoctor: (doctorId: string) => void;
  sendPasswordReset: (email: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const fetchUserFromStorage = useCallback(async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const freshUser = await firestoreService.findUserByEmail(parsedUser.email);
        if (freshUser) {
          setUser(buildUserFromData(freshUser));
        } else if (parsedUser.role === 'admin') {
          setUser(parsedUser); // Keep admin session alive
        } else {
           setUser(null);
           localStorage.removeItem('user');
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
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
    
    const joinDate = new Date();
    const paymentDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    if (joinDate.getDate() < 15) {
      paymentDate.setMonth(paymentDate.getMonth() + 1);
    } else {
      paymentDate.setMonth(paymentDate.getMonth() + 2);
    }

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
        lastPaymentDate: joinDate.toISOString().split('T')[0],
        whatsapp: '',
        lat: 0, lng: 0,
        joinDate: joinDate.toISOString().split('T')[0],
        subscriptionStatus: 'active',
        nextPaymentDate: paymentDate.toISOString().split('T')[0],
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  };

  const updateUser = async (data: Partial<Patient | Seller>) => {
    if (!user || !user.id) return;
    
    if (user.role === 'patient') {
      await firestoreService.updatePatient(user.id, data as Partial<Patient>);
    } else if (user.role === 'seller') {
      await firestoreService.updateSeller(user.id, data as Partial<Seller>);
    } else {
      return; // Or handle other roles
    }

    const updatedUser = { ...user, ...data };
    setUser(updatedUser as User);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !user.id) {
      return { success: false, message: 'Usuario no autorizado.' };
    }
    
    if (user.password !== currentPassword) {
      return { success: false, message: 'La contraseña actual es incorrecta.' };
    }

    try {
      let updatePromise;
      if (user.role === 'patient') {
        updatePromise = firestoreService.updatePatient(user.id, { password: newPassword });
      } else if (user.role === 'doctor') {
        updatePromise = firestoreService.updateDoctor(user.id, { password: newPassword });
      } else {
        return { success: false, message: 'Rol de usuario no soportado para cambio de contraseña.' };
      }
      
      await updatePromise;
      
      const updatedUser = { ...user, password: newPassword };
      setUser(updatedUser as User);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, message: 'Contraseña actualizada exitosamente.' };
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, message: 'Ocurrió un error al cambiar la contraseña.' };
    }
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
  
  const sendPasswordReset = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: 'Correo de Recuperación Enviado',
            description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        });
    } catch (error: any) {
        console.error("Error sending password reset email:", error);
        // Firebase Auth now uses 'auth/invalid-email' for non-existent users
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            toast({
                variant: 'destructive',
                title: 'Usuario no encontrado',
                description: 'No existe una cuenta asociada a este correo electrónico.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.',
            });
        }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    registerDoctor,
    logout,
    updateUser,
    changePassword,
    toggleFavoriteDoctor,
    sendPasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
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

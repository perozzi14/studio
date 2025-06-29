
'use client';

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  CollectionReference,
  Timestamp,
} from 'firebase/firestore';
import * as mockData from './data';
import type { Doctor, Seller, Patient, Appointment, Coupon, CompanyExpense, BankDetail, Service, Expense, SupportTicket, SellerPayment, DoctorPayment, AppSettings, MarketingMaterial } from './types';


// Helper to convert Firestore Timestamps to strings
const convertTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            convertTimestamps(data[key]);
        }
    }
    return data;
};


// Generic Fetch Function
async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        convertTimestamps(data);
        // Ensure ID is always a string and overwrites any 'id' field from data
        return { ...data, id: doc.id } as T;
    });
  } catch (error) {
    console.error(`Error fetching ${collectionName}: `, error);
    return [];
  }
}

// Generic Get Document Function
async function getDocumentData<T>(collectionName: string, id: string): Promise<T | null> {
    // The check for string ID is important.
    if (!id || typeof id !== 'string') {
        console.error(`Invalid ID provided to getDocumentData for collection ${collectionName}:`, id);
        return null;
    }
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            convertTimestamps(data);
            // Ensure ID is always a string and overwrite any 'id' field from data
            return { ...data, id: docSnap.id } as T;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching document ${id} from ${collectionName}: `, error);
        return null;
    }
}


// Seeding function
export const seedDatabase = async () => {
    const batch = writeBatch(db);

    const collectionsToClear = ["doctors", "sellers", "patients", "appointments", "companyExpenses", "coupons", "doctorPayments", "sellerPayments", "settings", "marketingMaterials"];
    
    // Clear existing collections
    for (const col of collectionsToClear) {
        const snapshot = await getDocs(collection(db, col));
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }
    
    const prepareData = <T extends { id: any }>(dataWithId: T): Omit<T, 'id'> => {
        const { id, ...data } = dataWithId;
        return data;
    };

    // Seed each collection
    mockData.doctors.forEach(item => batch.set(doc(db, "doctors", item.id), prepareData(item)));
    mockData.sellers.forEach(item => batch.set(doc(db, "sellers", item.id), prepareData(item)));
    mockData.mockPatients.forEach(item => batch.set(doc(db, "patients", item.id), prepareData(item)));
    mockData.appointments.forEach(item => batch.set(doc(db, "appointments", item.id), prepareData(item)));
    mockData.mockCompanyExpenses.forEach(item => batch.set(doc(db, "companyExpenses", item.id), prepareData(item)));
    mockData.mockCoupons.forEach(item => batch.set(doc(db, "coupons", item.id), prepareData(item)));
    mockData.mockDoctorPayments.forEach(item => batch.set(doc(db, "doctorPayments", item.id), prepareData(item)));
    mockData.mockSellerPayments.forEach(item => batch.set(doc(db, "sellerPayments", item.id), prepareData(item)));
    mockData.marketingMaterials.forEach(item => batch.set(doc(db, "marketingMaterials", item.id), prepareData(item)));
    
    // Seed settings (special case)
    const settingsRef = doc(db, "settings", "main");
    const settingsData: AppSettings = {
        cities: mockData.cities,
        specialties: mockData.specialties,
        doctorSubscriptionFee: 50,
        companyBankDetails: mockData.mockCompanyBankDetails,
        timezone: 'America/Caracas',
        logoUrl: '/logo.svg',
        currency: 'USD',
    };
    batch.set(settingsRef, settingsData);

    await batch.commit();
    console.log("Database seeded successfully!");
};


// --- Data Fetching Functions ---
export const getDoctors = () => getCollectionData<Doctor>('doctors');
export const getDoctor = (id: string) => getDocumentData<Doctor>('doctors', id);
export const getSellers = () => getCollectionData<Seller>('sellers');
export const getSeller = (id: string) => getDocumentData<Seller>('sellers', id);
export const getPatients = () => getCollectionData<Patient>('patients');
export const getPatient = (id: string) => getDocumentData<Patient>('patients', id);
export const getAppointments = () => getCollectionData<Appointment>('appointments');
export const getDoctorAppointments = async (doctorId: string) => {
    const q = query(collection(db, "appointments"), where("doctorId", "==", doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));
};
export const getPatientAppointments = async (patientId: string) => {
    const q = query(collection(db, "appointments"), where("patientId", "==", patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));
};
export const getDoctorPayments = () => getCollectionData<DoctorPayment>('doctorPayments');
export const getSellerPayments = () => getCollectionData<SellerPayment>('sellerPayments');
export const getCompanyExpenses = () => getCollectionData<CompanyExpense>('companyExpenses');
export const getCoupons = () => getCollectionData<Coupon>('coupons');
export const getMarketingMaterials = () => getCollectionData<MarketingMaterial>('marketingMaterials');
export const getSettings = () => getDocumentData<AppSettings>('settings', 'main');

// --- Data Mutation Functions ---

// Doctor
export const addDoctor = async (doctorData: Omit<Doctor, 'id'>) => addDoc(collection(db, 'doctors'), doctorData);
export const updateDoctor = async (id: string, data: Partial<Doctor>) => updateDoc(doc(db, 'doctors', id), data);
export const deleteDoctor = async (id: string) => deleteDoc(doc(db, 'doctors', id));
export const updateDoctorStatus = async (id: string, status: 'active' | 'inactive') => updateDoc(doc(db, 'doctors', id), { status });

// Seller
export const addSeller = async (sellerData: Omit<Seller, 'id'>) => addDoc(collection(db, 'sellers'), sellerData);
export const updateSeller = async (id: string, data: Partial<Seller>) => updateDoc(doc(db, 'sellers', id), data);
export const deleteSeller = async (id: string) => deleteDoc(doc(db, 'sellers', id));

// Patient
export const addPatient = async (patientData: Omit<Patient, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'patients'), patientData);
    return docRef.id;
};
export const updatePatient = async (id: string, data: Partial<Patient>) => updateDoc(doc(db, 'patients', id), data);
export const deletePatient = async (id: string) => deleteDoc(doc(db, 'patients', id));

// Appointment
export const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => addDoc(collection(db, 'appointments'), appointmentData);
export const updateAppointment = async (id: string, data: Partial<Appointment>) => updateDoc(doc(db, 'appointments', id), data);

// Company Expense
export const addCompanyExpense = async (expenseData: Omit<CompanyExpense, 'id'>) => addDoc(collection(db, 'companyExpenses'), expenseData);
export const updateCompanyExpense = async (id: string, data: Partial<CompanyExpense>) => updateDoc(doc(db, 'companyExpenses', id), data);
export const deleteCompanyExpense = async (id: string) => deleteDoc(doc(db, 'companyExpenses', id));

// Marketing Material
export const addMarketingMaterial = async (materialData: Omit<MarketingMaterial, 'id'>) => addDoc(collection(db, 'marketingMaterials'), materialData);
export const updateMarketingMaterial = async (id: string, data: Partial<MarketingMaterial>) => updateDoc(doc(db, 'marketingMaterials', id), data);
export const deleteMarketingMaterial = async (id: string) => deleteDoc(doc(db, 'marketingMaterials', id));


// Settings & Related Sub-collections
export const updateSettings = async (data: Partial<AppSettings>) => updateDoc(doc(db, 'settings', 'main'), data);
export const addCoupon = async (couponData: Omit<Coupon, 'id'>) => addDoc(collection(db, 'coupons'), couponData);
export const updateCoupon = async (id: string, data: Partial<Coupon>) => updateDoc(doc(db, 'coupons', id), data);
export const deleteCoupon = async (id: string) => deleteDoc(doc(db, 'coupons', id));

// Payments
export const addSellerPayment = async (paymentData: Omit<SellerPayment, 'id'>) => addDoc(collection(db, 'sellerPayments'), paymentData);
export const addDoctorPayment = async (paymentData: Omit<DoctorPayment, 'id'>) => addDoc(collection(db, 'doctorPayments'), paymentData);
export const updateDoctorPaymentStatus = async (id: string, status: DoctorPayment['status']) => updateDoc(doc(db, 'doctorPayments', id), { status });

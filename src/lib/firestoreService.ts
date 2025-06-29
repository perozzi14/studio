
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
} from 'firebase/firestore';
import * as mockData from './data';
import type { Doctor, Seller, Patient, Appointment, Coupon, CompanyExpense, BankDetail, Service, Expense, SupportTicket, SellerPayment, DoctorPayment } from './types';


// Seeding function
export const seedDatabase = async () => {
    const batch = writeBatch(db);

    // Seed doctors
    mockData.doctors.forEach(doctor => {
        const docRef = doc(db, "doctors", String(doctor.id));
        batch.set(docRef, doctor);
    });

    // Seed sellers
    mockData.sellers.forEach(seller => {
        const docRef = doc(db, "sellers", String(seller.id));
        batch.set(docRef, seller);
    });
    
    // Seed patients
     mockData.mockPatients.forEach(patient => {
        const docRef = doc(db, "patients", String(patient.id));
        batch.set(docRef, patient);
    });
    
    // Seed appointments
     mockData.appointments.forEach(appointment => {
        const docRef = doc(db, "appointments", String(appointment.id));
        batch.set(docRef, appointment);
    });
    
    // Seed company expenses
     mockData.mockCompanyExpenses.forEach(expense => {
        const docRef = doc(db, "companyExpenses", String(expense.id));
        batch.set(docRef, expense);
    });

    // Seed coupons
     mockData.mockCoupons.forEach(coupon => {
        const docRef = doc(db, "coupons", String(coupon.id));
        batch.set(docRef, coupon);
    });

    // Seed doctor payments
     mockData.mockDoctorPayments.forEach(payment => {
        const docRef = doc(db, "doctorPayments", String(payment.id));
        batch.set(docRef, payment);
    });
    
    // Seed seller payments
     mockData.mockSellerPayments.forEach(payment => {
        const docRef = doc(db, "sellerPayments", String(payment.id));
        batch.set(docRef, payment);
    });

    // Seed settings
    const settingsRef = doc(db, "settings", "main");
    batch.set(settingsRef, {
        cities: mockData.cities,
        specialties: mockData.specialties,
        doctorSubscriptionFee: 50, // Example value
        companyBankDetails: mockData.mockCompanyBankDetails,
    });


    await batch.commit();
    console.log("Database seeded successfully!");
};

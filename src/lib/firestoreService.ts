
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
  arrayUnion,
} from 'firebase/firestore';
import * as mockData from './data';
import type { Doctor, Seller, Patient, Appointment, Coupon, CompanyExpense, BankDetail, Service, Expense, AdminSupportTicket, SellerPayment, DoctorPayment, AppSettings, MarketingMaterial, ChatMessage } from './types';


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
export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
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

    const collectionsToClear = ["doctors", "sellers", "patients", "appointments", "settings", "doctorPayments", "sellerPayments", "marketingMaterials", "supportTickets"];
    
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
    mockData.doctors.forEach(item => batch.set(doc(db, "doctors", String(item.id)), prepareData(item)));
    mockData.sellers.forEach(item => batch.set(doc(db, "sellers", String(item.id)), prepareData(item)));
    mockData.mockPatients.forEach(item => batch.set(doc(db, "patients", String(item.id)), prepareData(item)));
    mockData.appointments.forEach(item => batch.set(doc(db, "appointments", String(item.id)), prepareData(item)));
    mockData.mockDoctorPayments.forEach(item => batch.set(doc(db, "doctorPayments", String(item.id)), prepareData(item)));
    mockData.mockSellerPayments.forEach(item => batch.set(doc(db, "sellerPayments", String(item.id)), prepareData(item)));
    mockData.marketingMaterials.forEach(item => batch.set(doc(db, "marketingMaterials", String(item.id)), prepareData(item)));
    mockData.mockAdminSupportTickets.forEach(item => batch.set(doc(db, "supportTickets", String(item.id)), prepareData(item)));
    
    // Seed settings (special case, monolithic document)
    const settingsRef = doc(db, "settings", "main");
    batch.set(settingsRef, mockData.mockSettings);

    await batch.commit();
    console.log("Database seeded successfully!");
};

// --- Database Maintenance Functions ---
export const exportDatabase = async (): Promise<any> => {
    const backup: Record<string, any> = {};
    const collectionsToExport = [
        'doctors', 'sellers', 'patients', 'appointments', 
        'doctorPayments', 'sellerPayments', 'marketingMaterials', 'supportTickets'
    ];

    for (const colName of collectionsToExport) {
        backup[colName] = await getCollectionData<any>(colName);
    }
    
    // Settings is a single doc, not a collection
    backup['settings'] = await getDocumentData<any>('settings', 'main');

    return backup;
}

export const importDatabase = async (backupData: any): Promise<void> => {
    const collectionsToClear = [
        "doctors", "sellers", "patients", "appointments", 
        "doctorPayments", "sellerPayments", "marketingMaterials", "supportTickets", "settings"
    ];

    // Clear existing collections in a separate batch
    const deleteBatch = writeBatch(db);
    for (const col of collectionsToClear) {
        const snapshot = await getDocs(collection(db, col));
        snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    }
    await deleteBatch.commit();

    // Start a new batch for writes
    const importBatch = writeBatch(db);

    const prepareData = <T extends { id?: any }>(dataWithId?: T): Omit<T, 'id'> => {
        if (!dataWithId) return {} as Omit<T, 'id'>;
        const { id, ...data } = dataWithId;
        return data;
    };

    // Import each collection from backup
    for (const colName in backupData) {
        if (Object.prototype.hasOwnProperty.call(backupData, colName)) {
            const items = backupData[colName];
            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    if (item && item.id) {
                        const docRef = doc(db, colName, String(item.id));
                        importBatch.set(docRef, prepareData(item));
                    }
                });
            } else if (colName === 'settings' && items) {
                // Handle settings object which is not an array and has a fixed doc ID
                const settingsRef = doc(db, "settings", "main");
                // The settings object from backup does not have an ID to strip
                importBatch.set(settingsRef, items);
            }
        }
    }

    await importBatch.commit();
}


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
export const getMarketingMaterials = () => getCollectionData<MarketingMaterial>('marketingMaterials');
export const getSupportTickets = () => getCollectionData<AdminSupportTicket>('supportTickets');
export const getSettings = () => getDocumentData<AppSettings>('settings', 'main');

export const findUserByEmail = async (email: string): Promise<(Doctor | Seller | Patient) & { role: 'doctor' | 'seller' | 'patient' } | null> => {
    const lowerEmail = email.toLowerCase();
    
    const collections: { name: 'doctors' | 'sellers' | 'patients'; role: 'doctor' | 'seller' | 'patient' }[] = [
        { name: 'doctors', role: 'doctor' },
        { name: 'sellers', role: 'seller' },
        { name: 'patients', role: 'patient' },
    ];

    for (const { name, role } of collections) {
        const q = query(collection(db, name), where("email", "==", lowerEmail));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const docData = snapshot.docs[0].data();
            return {
                ...docData,
                id: snapshot.docs[0].id,
                role,
            } as (Doctor | Seller | Patient) & { role: 'doctor' | 'seller' | 'patient' };
        }
    }
    
    return null;
};


// --- Data Mutation Functions ---

// Doctor
export const addDoctor = async (doctorData: Omit<Doctor, 'id'>) => {
    const dataWithDefaults = { 
        ...doctorData, 
        readByAdmin: false,
        readBySeller: false,
    };
    return addDoc(collection(db, 'doctors'), dataWithDefaults);
};
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
export const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    const dataWithFlags = {
        ...appointmentData,
        readByDoctor: false, // New appointment, doctor needs to be notified
        readByPatient: true,  // Patient created it, so they have "read" it.
    };
    return addDoc(collection(db, 'appointments'), dataWithFlags);
};
export const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    const dataWithFlags = { ...data };
    // If attendance is being marked, the patient needs to be notified.
    if ('attendance' in data) {
        dataWithFlags.readByPatient = false;
    }
    return updateDoc(doc(db, 'appointments', id), dataWithFlags);
};
export const addMessageToAppointment = async (appointmentId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString()
    };
    
    await updateDoc(appointmentRef, {
        messages: arrayUnion(newMessage)
    });
};

// Marketing Material
export const addMarketingMaterial = async (materialData: Omit<MarketingMaterial, 'id'>) => addDoc(collection(db, 'marketingMaterials'), materialData);
export const updateMarketingMaterial = async (id: string, data: Partial<MarketingMaterial>) => updateDoc(doc(db, 'marketingMaterials', id), data);
export const deleteMarketingMaterial = async (id: string) => deleteDoc(doc(db, 'marketingMaterials', id));

// Support Ticket
export const addSupportTicket = async (ticketData: Omit<AdminSupportTicket, 'id' | 'messages'>) => {
    const initialMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: ticketData.description,
        timestamp: new Date().toISOString(),
    };

    const newTicketData: any = {
        ...ticketData,
        messages: [initialMessage],
        readByAdmin: false,
    };
    
    if (ticketData.userRole === 'seller') {
        newTicketData.readBySeller = true;
    } else if (ticketData.userRole === 'doctor') {
        newTicketData.readByDoctor = true;
    }

    return addDoc(collection(db, 'supportTickets'), newTicketData);
}

export const addMessageToSupportTicket = async (ticketId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const ticketRef = doc(db, "supportTickets", ticketId);
    const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString()
    };
    
    const updateData: any = {
        messages: arrayUnion(newMessage)
    };

    if (message.sender === 'user') {
        updateData.readByAdmin = false;
        updateData.status = 'abierto';
    }
     if (message.sender === 'admin') {
        updateData.status = 'abierto';
        const ticketDoc = await getDoc(ticketRef);
        const ticketData = ticketDoc.data() as AdminSupportTicket;
        if (ticketData.userRole === 'seller') {
            updateData.readBySeller = false;
        } else if (ticketData.userRole === 'doctor') {
            updateData.readByDoctor = false;
        }
    }
    
    await updateDoc(ticketRef, updateData);
};

export const updateSupportTicket = async (id: string, data: Partial<AdminSupportTicket>) => updateDoc(doc(db, 'supportTickets', id), data);


// Settings
export const updateSettings = async (data: Partial<AppSettings>) => updateDoc(doc(db, 'settings', 'main'), data);

// Payments
export const addSellerPayment = async (paymentData: Omit<SellerPayment, 'id'>) => {
    const dataWithDefaults = { ...paymentData, readBySeller: false };
    return addDoc(collection(db, 'sellerPayments'), dataWithDefaults);
};
export const addDoctorPayment = async (paymentData: Omit<DoctorPayment, 'id'>) => {
    const dataWithDefaults = { ...paymentData, readByAdmin: false, readByDoctor: false };
    return addDoc(collection(db, 'doctorPayments'), dataWithDefaults);
};
export const updateDoctorPaymentStatus = async (id: string, status: DoctorPayment['status']) => updateDoc(doc(db, 'doctorPayments', id), { status, readByDoctor: false });

// Notifications
export const batchUpdateNotificationsAsRead = async (ticketIds: string[], paymentIds: string[], doctorIds: string[]) => {
    const batch = writeBatch(db);
    ticketIds.forEach(id => {
        const docRef = doc(db, "supportTickets", id);
        batch.update(docRef, { readByAdmin: true });
    });
    paymentIds.forEach(id => {
        const docRef = doc(db, "doctorPayments", id);
        batch.update(docRef, { readByAdmin: true });
    });
    doctorIds.forEach(id => {
        const docRef = doc(db, "doctors", id);
        batch.update(docRef, { readByAdmin: true });
    });
    if (ticketIds.length > 0 || paymentIds.length > 0 || doctorIds.length > 0) {
        await batch.commit();
    }
}

export const batchUpdateDoctorNotificationsAsRead = async (paymentIds: string[], ticketIds: string[]) => {
    const batch = writeBatch(db);
    paymentIds.forEach(id => {
        batch.update(doc(db, "doctorPayments", id), { readByDoctor: true });
    });
    ticketIds.forEach(id => {
        batch.update(doc(db, "supportTickets", id), { readByDoctor: true });
    });
     if (paymentIds.length > 0 || ticketIds.length > 0) {
        await batch.commit();
    }
}

export const batchUpdateDoctorAppointmentsAsRead = async (appointmentIds: string[]) => {
    if (appointmentIds.length === 0) return;
    const batch = writeBatch(db);
    appointmentIds.forEach(id => {
        batch.update(doc(db, "appointments", id), { readByDoctor: true });
    });
    await batch.commit();
}

export const batchUpdatePatientAppointmentsAsRead = async (appointmentIds: string[]) => {
    if (appointmentIds.length === 0) return;
    const batch = writeBatch(db);
    appointmentIds.forEach(id => {
        batch.update(doc(db, "appointments", id), { readByPatient: true });
    });
    await batch.commit();
}

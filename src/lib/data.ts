
import type { Doctor, Seller, Patient, Appointment, Expense, SellerPayment, MarketingMaterial, SupportTicket, DoctorPayment, AdminSupportTicket, CompanyExpense, BankDetail, Coupon, Schedule } from './types';

export const specialties = [
  "Cardiología",
  "Dermatología",
  "Neurología",
  "Pediatría",
  "Oncología",
  "Ortopedia",
  "Ginecología",
  "Neumonología",
  "Medicina Estética",
];

export const cities = [
  "Caracas",
  "Maracaibo",
  "Valencia",
];

export const mockCompanyBankDetails: BankDetail[] = [
  {
    id: '9901',
    bank: 'Banesco',
    accountHolder: 'SUMA C.A.',
    accountNumber: '0134-0000-0000-0000-0000',
    idNumber: 'J-12345678-9',
    description: 'Cuenta Principal',
  },
  {
    id: '9902',
    bank: 'Mercantil',
    accountHolder: 'SUMA C.A.',
    accountNumber: '0105-0000-0000-0000-0000',
    idNumber: 'J-12345678-9',
    description: 'PagoMóvil',
  },
];

export const mockCoupons: Coupon[] = [
  { id: '1', code: 'SUMA10', discountType: 'fixed', value: 10, scope: 'general' },
  { id: '2', code: 'VERANO20', discountType: 'percentage', value: 20, scope: '1' } // Dr. Ana Rodriguez
];

const defaultSchedule: Schedule = {
    monday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
    saturday: { active: false, slots: [] },
    sunday: { active: false, slots: [] },
};

export const sellers: Seller[] = [
  {
    id: '1',
    name: "Vendedora Principal",
    email: "vendedora@venta.com",
    password: "1234",
    phone: "0412-9876543",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "VENDE123",
    commissionRate: 0.20,
    bankDetails: [
      {
        id: '9001',
        bank: "Bancamiga",
        accountNumber: "0172-0009-0009-0009-0009",
        accountHolder: "Vendedora Principal",
        idNumber: "V-99.888.777",
        description: "Cuenta en Dólares",
      }
    ],
    expenses: [
      { id: 'sexp-1', date: '2024-05-10', description: 'Transporte a reuniones', amount: 20 },
      { id: 'sexp-2', date: '2024-05-22', description: 'Impresión de material', amount: 15 },
    ]
  },
  {
    id: '2',
    name: "Maria Garcia",
    email: "maria.g@venta.com",
    password: "1234",
    phone: "0414-1112233",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "MARIA456",
    commissionRate: 0.18,
    bankDetails: [],
    expenses: []
  },
   {
    id: '3',
    name: "Sofia Martinez",
    email: "sofia.m@venta.com",
    password: "1234",
    phone: "0424-4445566",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "SOFIA789",
    commissionRate: 0.20,
    bankDetails: [],
    expenses: []
  }
];


export const doctors: Doctor[] = [
  { 
    id: '1', 
    name: "Dr. Ana Rodriguez", 
    cedula: "V-12.345.678",
    specialty: "Cardiología", 
    city: "Caracas", 
    address: "Av. Francisco de Miranda, Centro Lido, Piso 5",
    sector: "Chacao",
    rating: 4.9, 
    reviewCount: 120, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png", 
    aiHint: "woman doctor",
    description: "Cardióloga con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares. Comprometida con la prevención y el bienestar de mis pacientes.",
    services: [
      { id: '101', name: "Consulta Cardiológica", price: 50 },
      { id: '102', name: "Electrocardiograma (EKG)", price: 30 },
      { id: '103', name: "Ecocardiograma", price: 80 },
    ],
    bankDetails: [
      { id: '1001', bank: "Banesco", accountNumber: "0134-0001-0001-0001-0001", accountHolder: "Ana Rodriguez", idNumber: "V-12.345.678", description: "Personal" },
      { id: '1002', bank: "Mercantil", accountNumber: "0105-0001-0001-0001-0001", accountHolder: "Ana Rodriguez", idNumber: "V-12.345.678" }
    ],
    expenses: [
      { id: 'exp-1', date: '2024-05-01', description: 'Alquiler de consultorio', amount: 500 },
      { id: 'exp-2', date: '2024-05-10', description: 'Materiales médicos', amount: 150 },
    ],
    coupons: [
      { id: 'coupon-1', code: 'ANAFIRST', discountType: 'percentage', value: 15, scope: '1' }
    ],
    slotDuration: 30,
    schedule: {
        monday: { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        tuesday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
        wednesday: { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        thursday: { active: false, slots: [] },
        friday: { active: true, slots: [{ start: "09:00", end: "15:00" }] },
        saturday: { active: false, slots: [] },
        sunday: { active: false, slots: [] },
    },
    sellerId: '1',
    status: 'active',
    lastPaymentDate: '2024-05-28',
    email: 'doctor@admin.com',
    password: '1234',
    whatsapp: '0414-1234567',
    lat: 10.4996,
    lng: -66.8528,
    joinDate: '2024-02-01',
    subscriptionStatus: 'active',
    nextPaymentDate: '2024-06-28',
  },
  { 
    id: '2', 
    name: "Dr. Carlos Sanchez", 
    cedula: "V-10.987.654",
    specialty: "Dermatología", 
    city: "Maracaibo", 
    address: "Calle 72 con Av. 3H, Edificio Profesional",
    sector: "Tierra Negra",
    rating: 4.8, 
    reviewCount: 98, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png", 
    aiHint: "man doctor",
    description: "Especialista en dermatología clínica y estética, enfocado en ofrecer tratamientos personalizados para el cuidado de la piel. Miembro activo de la Sociedad Venezolana de Dermatología.",
    services: [
      { id: '201', name: "Consulta Dermatológica", price: 45 },
      { id: '202', name: "Crioterapia (verrugas)", price: 60 },
    ],
    bankDetails: [{ id: '2001', bank: "Banco de Venezuela", accountNumber: "0102-0002-0002-0002-0002", accountHolder: "Carlos Sanchez", idNumber: "V-10.987.654" }],
    expenses: [],
    coupons: [],
    slotDuration: 60,
    schedule: defaultSchedule,
    sellerId: '1',
    status: 'active',
    lastPaymentDate: '2024-05-25',
    email: 'carlos.sanchez.dr@email.com',
    password: '1234',
    whatsapp: '0412-2345678',
    lat: 10.6667,
    lng: -71.6125,
    joinDate: '2024-02-15',
    subscriptionStatus: 'active',
    nextPaymentDate: '2024-06-25',
  },
  { 
    id: '3', 
    name: "Dr. Sofia Gomez", 
    cedula: "V-14.567.890",
    specialty: "Neurología", 
    city: "Valencia", 
    address: "Av. Monseñor Adams, Centro Médico El Viñedo",
    sector: "El Viñedo",
    rating: 4.9, 
    reviewCount: 150, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "doctor smile",
    description: "Neuróloga dedicada al estudio y tratamiento de trastornos del sistema nervioso. Experiencia en migrañas, epilepsia y enfermedades neurodegenerativas.",
    services: [ { id: '301', name: "Consulta Neurológica", price: 60 } ],
    bankDetails: [{ id: '3001', bank: "BBVA Provincial", accountNumber: "0108-0003-0003-0003-0003", accountHolder: "Sofia Gomez", idNumber: "V-14.567.890" }],
    expenses: [],
    coupons: [],
    slotDuration: 30,
    schedule: defaultSchedule,
    sellerId: '2',
    status: 'inactive',
    lastPaymentDate: '2024-03-15',
    email: 'sofia.gomez.dr@email.com',
    password: '1234',
    whatsapp: '0424-3456789',
    lat: 10.2117,
    lng: -68.0019,
    joinDate: '2024-03-05',
    subscriptionStatus: 'inactive',
    nextPaymentDate: '2024-04-15',
  },
];


export const mockPatients: Patient[] = [
    { id: "pat-1", name: "Elena Ríos", email: "elena.r@example.com", password: "1234", age: 34, gender: 'femenino', phone: '0414-1112233', cedula: 'V-18.123.456', favoriteDoctorIds: ['1'] },
    { id: "pat-2", name: "Jorge Paez", email: "jorge.p@example.com", password: "1234", age: 45, gender: 'masculino', phone: '0412-2223344', cedula: 'V-12.345.678', favoriteDoctorIds: [] },
    { id: "pat-3", name: "Maria Castillo", email: "maria.c@example.com", password: "1234", age: 29, gender: 'femenino', phone: '0416-3334455', cedula: 'V-20.987.654', favoriteDoctorIds: [] },
    { id: "pat-4", name: "Carlos Briceño", email: "carlos.b@example.com", password: "1234", age: 52, gender: 'masculino', phone: '0424-4445566', cedula: 'V-9.876.543', favoriteDoctorIds: [] },
    { id: "pat-5", name: "Paciente de Prueba", email: "paciente@example.com", password: "1234", age: 40, gender: 'masculino', phone: '0426-5556677', cedula: 'V-15.555.555', favoriteDoctorIds: ['1', '2'] },
    { id: "pat-6", name: "Luis Ramirez", email: "luis.r@example.com", password: "1234", age: 60, gender: 'masculino', phone: '0412-5556677', cedula: 'V-6.543.210', favoriteDoctorIds: [] },
];


export const appointments: Appointment[] = [
  {
    id: "appt-1", patientId: "pat-1", patientName: "Elena Ríos", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], time: "10:00",
    services: [ { id: '101', name: "Consulta Cardiológica", price: 50 }, { id: '102', name: "Electrocardiograma (EKG)", price: 30 } ],
    totalPrice: 80, paymentMethod: 'transferencia', paymentStatus: 'Pendiente', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: 'Tomar 1 pastilla de Losartán Potásico cada 12 horas. Repetir EKG en 3 meses.',
  },
  {
    id: "appt-2", patientId: "pat-2", patientName: "Jorge Paez", doctorName: "Dr. Carlos Sanchez", doctorId: '2',
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0], time: "14:00",
    services: [ { id: '201', name: "Consulta Dermatológica", price: 45 } ],
    totalPrice: 45, paymentMethod: 'efectivo', paymentStatus: 'Pendiente', paymentProof: null,
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: '',
  },
  {
    id: "appt-3", patientId: "pat-3", patientName: "Maria Castillo", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], time: "09:00",
    services: [ { id: '103', name: "Ecocardiograma", price: 80 } ],
    totalPrice: 80, paymentMethod: 'transferencia', paymentStatus: 'Pagado', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: '',
  },
  {
    id: "appt-4", patientId: "pat-6", patientName: "Luis Ramirez", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], time: "11:00",
    services: [ { id: '101', name: "Consulta Cardiológica", price: 50 } ],
    totalPrice: 50, paymentMethod: 'efectivo', paymentStatus: 'Pagado', paymentProof: null,
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Paciente presenta arritmia leve, se recomienda seguimiento y control de estrés.',
    prescription: 'Concor 2.5mg, 1 al día. Dieta baja en sodio.',
  },
  {
    id: "appt-5", patientId: "pat-5", patientName: "Paciente de Prueba", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0], time: "14:00",
    services: [ { id: '101', name: "Consulta Cardiológica", price: 50 } ],
    totalPrice: 50, paymentMethod: 'transferencia', paymentStatus: 'Pagado', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'No Asistió', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'El paciente no asistió a la cita. Contactar para reprogramar.', prescription: '',
  },
];

export const mockSellerPayments: SellerPayment[] = [
  {
    id: 'pay-1', sellerId: '1', paymentDate: '2024-05-16', amount: 18, period: 'Abril 2024',
    includedDoctors: [ { id: '1', name: "Dr. Ana Rodriguez" }, { id: '2', name: "Dr. Carlos Sanchez" }, { id: '4', name: "Dr. Luis Fernandez" } ],
    paymentProofUrl: 'https://placehold.co/400x300.png', transactionId: 'TXN-SUMA-20240516-001'
  },
  {
    id: 'pay-2', sellerId: '1', paymentDate: '2024-04-16', amount: 20.00, period: 'Marzo 2024',
    includedDoctors: [ { id: '1', name: "Dr. Ana Rodriguez" }, { id: '2', name: "Dr. Carlos Sanchez" } ],
    paymentProofUrl: 'https://placehold.co/400x300.png', transactionId: 'TXN-SUMA-20240416-001'
  },
];

export const marketingMaterials: MarketingMaterial[] = [
    { id: '1', type: 'image', title: 'Banner para Redes Sociales', description: 'Banner promocional para usar en Instagram, Facebook y otras redes.', url: 'https://placehold.co/1080x1080.png', thumbnailUrl: 'https://placehold.co/600x400.png' },
    { id: '2', type: 'video', title: 'Video Explicativo de SUMA', description: 'Video corto que explica los beneficios de la plataforma para los médicos.', url: 'https://placehold.co/1920x1080.png', thumbnailUrl: 'https://placehold.co/600x400.png' },
    { id: '3', type: 'file', title: 'Folleto Informativo (PDF)', description: 'Documento PDF con toda la información clave para presentar a los médicos.', url: '#', thumbnailUrl: 'https://placehold.co/600x400.png' },
    { id: '4', type: 'url', title: 'Artículo de Blog: Beneficios de la Telemedicina', description: 'Enlace a un artículo relevante que puedes compartir con los doctores.', url: '#', thumbnailUrl: 'https://placehold.co/600x400.png' }
];

export const mockDoctorPayments: DoctorPayment[] = [
  { id: 'dp-1', doctorId: '1', doctorName: 'Dr. Ana Rodriguez', date: '2024-05-28', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123456', readByAdmin: true },
  { id: 'dp-2', doctorId: '2', doctorName: 'Dr. Carlos Sanchez', date: '2024-05-25', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123457', readByAdmin: true },
  { id: 'dp-3', doctorId: '4', doctorName: 'Dr. Luis Fernandez', date: '2024-05-29', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123458', readByAdmin: true },
  { id: 'dp-4', doctorId: '7', doctorName: 'Dra. Laura Montes', date: '2024-05-22', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123459', readByAdmin: true },
  { id: 'dp-5', doctorId: '3', doctorName: 'Dr. Sofia Gomez', date: '2024-06-01', amount: 50, status: 'Pending', paymentProofUrl: 'https://placehold.co/400x300.png', transactionId: 'TXN123460', readByAdmin: false },
];


export const mockAdminSupportTickets: AdminSupportTicket[] = [
    { id: 'ticket-admin-1', userId: 'vendedora@venta.com', userName: 'Vendedora Principal', userRole: 'seller', subject: 'Problema con la comisión de un referido', description: 'No estoy segura de cómo se calcula la comisión para uno de mis médicos.', status: 'abierto', date: '2024-05-20', readByAdmin: false, messages: [] },
    { id: 'ticket-admin-2', userId: 'doctor@admin.com', userName: 'Dr. Ana Rodriguez', userRole: 'doctor', subject: 'Duda sobre el horario de trabajo', description: '¿Cómo puedo bloquear un día completo en mi calendario?', status: 'abierto', date: '2024-05-28', readByAdmin: false, messages: [] },
    { id: 'ticket-admin-3', userId: 'vendedora@venta.com', userName: 'Vendedora Principal', userRole: 'seller', subject: 'Cómo actualizar los datos de un médico', description: 'Necesito cambiar el número de teléfono de uno de mis médicos referidos.', status: 'cerrado', date: '2024-05-15', readByAdmin: true, messages: [] },
];

export const mockAdminNotifications: AdminNotification[] = [
    { id: 'notif-admin-1', type: 'payment', title: 'Pago Pendiente de Aprobación', description: 'El Dr. Sofia Gomez ha reportado un pago de suscripción.', date: new Date(new Date().setDate(new Date().getDate() - 0)).toISOString(), read: false, link: '/admin/dashboard?view=finances' },
    { id: 'notif-admin-2', type: 'support_ticket', title: 'Nuevo Ticket de Soporte', description: 'Vendedora Principal ha abierto un nuevo ticket.', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), read: false, link: '/admin/dashboard?view=support' },
    { id: 'notif-admin-3', type: 'new_doctor', title: 'Nuevo Médico Registrado', description: 'Dra. Laura Montes se ha unido a la plataforma.', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), read: true, link: '/admin/dashboard?view=doctors' },
    { id: 'notif-admin-4', type: 'payment', title: 'Pago Aprobado', description: 'Has aprobado el pago de Dr. Luis Fernandez.', date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), read: true, link: '/admin/dashboard?view=finances' }
];

export const mockCompanyExpenses: CompanyExpense[] = [
    { id: 'cexp-1', date: '2024-05-01', description: 'Alquiler de oficina', amount: 800, category: 'operativo' },
    { id: 'cexp-2', date: '2024-05-10', description: 'Campaña de publicidad en redes', amount: 250, category: 'marketing' },
    { id: 'cexp-3', date: '2024-05-15', description: 'Nómina - Administrador', amount: 1200, category: 'personal' },
    { id: 'cexp-4', date: '2024-05-25', description: 'Pago de servicios (internet, luz)', amount: 150, category: 'operativo' },
];

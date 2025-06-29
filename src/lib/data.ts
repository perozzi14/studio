




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

export type BankDetail = {
  id: number;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  idNumber: string;
};

export type Service = {
  id: number;
  name: string;
  price: number;
};

export type Coupon = {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  scope: 'general' | number; // 'general' or doctorId
};

export const mockCoupons: Coupon[] = [
  { id: 1, code: 'SUMA10', discountType: 'fixed', value: 10, scope: 'general' },
  { id: 2, code: 'VERANO20', discountType: 'percentage', value: 20, scope: 1 } // Dr. Ana Rodriguez
];

export type DaySchedule = {
  active: boolean;
  slots: { start: string; end: string }[];
};

export type Schedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export type Doctor = {
  id: number;
  name: string;
  specialty: string;
  city: string;
  address: string;
  sector: string;
  rating: number;
  reviewCount: number;
  profileImage: string;
  bannerImage: string;
  aiHint: string;
  description: string;
  services: Service[];
  bankDetails: BankDetail[];
  schedule: Schedule;
  slotDuration: 30 | 60;
  sellerId: number | null;
  status: 'active' | 'inactive';
  lastPaymentDate: string;
  email: string;
  whatsapp: string;
  lat: number;
  lng: number;
  joinDate: string;
};

export type Seller = {
  id: number;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  referralCode: string;
  bankDetails: BankDetail[];
  commissionRate: number;
};

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
    id: 1,
    name: "Vendedora Principal",
    email: "vendedora@venta.com",
    phone: "0412-9876543",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "VENDE123",
    commissionRate: 0.20,
    bankDetails: [
      {
        id: 9001,
        bank: "Bancamiga",
        accountNumber: "0172-0009-0009-0009-0009",
        accountHolder: "Vendedora Principal",
        idNumber: "V-99.888.777"
      }
    ]
  },
  {
    id: 2,
    name: "Maria Garcia",
    email: "maria.g@venta.com",
    phone: "0414-1112233",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "MARIA456",
    commissionRate: 0.18,
    bankDetails: []
  },
   {
    id: 3,
    name: "Sofia Martinez",
    email: "sofia.m@venta.com",
    phone: "0424-4445566",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "SOFIA789",
    commissionRate: 0.20,
    bankDetails: []
  }
];


export const doctors: Doctor[] = [
  { 
    id: 1, 
    name: "Dr. Ana Rodriguez", 
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
      { id: 101, name: "Consulta Cardiológica", price: 50 },
      { id: 102, name: "Electrocardiograma (EKG)", price: 30 },
      { id: 103, name: "Ecocardiograma", price: 80 },
    ],
    bankDetails: [
      {
        id: 1001,
        bank: "Banesco",
        accountNumber: "0134-0001-0001-0001-0001",
        accountHolder: "Ana Rodriguez",
        idNumber: "V-12.345.678"
      },
      {
        id: 1002,
        bank: "Mercantil",
        accountNumber: "0105-0001-0001-0001-0001",
        accountHolder: "Ana Rodriguez",
        idNumber: "V-12.345.678"
      }
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
    sellerId: 1,
    status: 'active',
    lastPaymentDate: '2024-05-28',
    email: 'ana.rodriguez.dr@email.com',
    whatsapp: '0414-1234567',
    lat: 10.4996,
    lng: -66.8528,
    joinDate: '2024-02-01',
  },
  { 
    id: 2, 
    name: "Dr. Carlos Sanchez", 
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
      { id: 201, name: "Consulta Dermatológica", price: 45 },
      { id: 202, name: "Crioterapia (verrugas)", price: 60 },
      { id: 203, name: "Biopsia de Piel", price: 100 },
    ],
    bankDetails: [{
      id: 2001,
      bank: "Banco de Venezuela",
      accountNumber: "0102-0002-0002-0002-0002",
      accountHolder: "Carlos Sanchez",
      idNumber: "V-10.987.654"
    }],
    slotDuration: 60,
    schedule: defaultSchedule,
    sellerId: 1,
    status: 'active',
    lastPaymentDate: '2024-05-25',
    email: 'carlos.sanchez.dr@email.com',
    whatsapp: '0412-2345678',
    lat: 10.6667,
    lng: -71.6125,
    joinDate: '2024-02-15',
  },
  { 
    id: 3, 
    name: "Dr. Sofia Gomez", 
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
    services: [
      { id: 301, name: "Consulta Neurológica", price: 60 },
      { id: 302, name: "Electroencefalograma (EEG)", price: 120 },
    ],
    bankDetails: [{
      id: 3001,
      bank: "BBVA Provincial",
      accountNumber: "0108-0003-0003-0003-0003",
      accountHolder: "Sofia Gomez",
      idNumber: "V-14.567.890"
    }],
    slotDuration: 30,
    schedule: defaultSchedule,
    sellerId: 2,
    status: 'inactive',
    lastPaymentDate: '2024-03-15',
    email: 'sofia.gomez.dr@email.com',
    whatsapp: '0424-3456789',
    lat: 10.2117,
    lng: -68.0019,
    joinDate: '2024-03-05',
  },
  { 
    id: 4, 
    name: "Dr. Luis Fernandez", 
    specialty: "Pediatría", 
    city: "Caracas", 
    address: "Calle París, Torre Orinoco, Las Mercedes",
    sector: "Las Mercedes",
    rating: 5.0, 
    reviewCount: 210, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "male doctor",
    description: "Pediatra apasionado por el cuidado integral de los niños, desde el nacimiento hasta la adolescencia. Foco en la prevención, crecimiento y desarrollo saludable.",
    services: [
      { id: 401, name: "Consulta Pediátrica", price: 40 },
      { id: 402, name: "Vacunación", price: 25 },
    ],
    bankDetails: [{
      id: 4001,
      bank: "Bancamiga",
      accountNumber: "0172-0004-0004-0004-0004",
      accountHolder: "Luis Fernandez",
      idNumber: "V-11.222.333"
    }],
    slotDuration: 30,
    schedule: defaultSchedule,
    sellerId: 1,
    status: 'active',
    lastPaymentDate: '2024-05-29',
    email: 'luis.fernandez.dr@email.com',
    whatsapp: '0416-4567890',
    lat: 10.4789,
    lng: -66.8533,
    joinDate: '2024-03-20',
  },
  { 
    id: 6, 
    name: "Dr. Javier Torres", 
    specialty: "Ortopedia", 
    city: "Caracas", 
    address: "Av. Panteón, Clínica Caracas, San Bernardino",
    sector: "San Bernardino",
    rating: 4.8, 
    reviewCount: 112, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "doctor portrait",
    description: "Traumatólogo y Ortopedista especializado en lesiones deportivas y cirugía artroscópica. Mi objetivo es devolver la movilidad y calidad de vida a mis pacientes.",
    services: [
      { id: 601, name: "Consulta Ortopédica", price: 55 },
      { id: 602, name: "Infiltración", price: 75 },
    ],
    bankDetails: [{
      id: 6001,
      bank: "Banesco",
      accountNumber: "0134-0006-0006-0006-0006",
      accountHolder: "Javier Torres",
      idNumber: "V-13.131.313"
    }],
    slotDuration: 30,
    schedule: defaultSchedule,
    sellerId: null,
    status: 'inactive',
    lastPaymentDate: '2024-04-30',
    email: 'javier.torres.dr@email.com',
    whatsapp: '0414-6789012',
    lat: 10.5120,
    lng: -66.9037,
    joinDate: '2024-04-10',
  },
  { 
    id: 7, 
    name: "Dra. Laura Montes", 
    specialty: "Medicina Estética", 
    city: "Caracas", 
    address: "Av. Principal de Santa Fe, CC Santa Fe, Nivel C3",
    sector: "Santa Fe",
    rating: 5.0, 
    reviewCount: 85, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "aesthetic doctor",
    description: "Médico estético especializada en rejuvenecimiento facial y tratamientos corporales no invasivos. Apasionada por realzar la belleza natural de cada paciente.",
    services: [
      { id: 701, name: "Aplicación de Toxina Botulínica", price: 250 },
      { id: 702, name: "Relleno con Ácido Hialurónico", price: 300 },
      { id: 703, name: "Plasma Rico en Plaquetas (PRP)", price: 150 },
    ],
    bankDetails: [{
      id: 7001,
      bank: "Banesco",
      accountNumber: "0134-0007-0007-0007-0007",
      accountHolder: "Laura Montes",
      idNumber: "V-17.111.222"
    }],
    slotDuration: 60,
    schedule: defaultSchedule,
    sellerId: 3,
    status: 'active',
    lastPaymentDate: '2024-05-22',
    email: 'laura.montes.dr@email.com',
    whatsapp: '0412-7890123',
    lat: 10.4515,
    lng: -66.8505,
    joinDate: '2024-05-01',
  }
];


export type Patient = {
    id: string;
    name: string;
    email: string;
    age: number | null;
    gender: 'masculino' | 'femenino' | 'otro' | null;
    phone: string | null;
    cedula: string | null;
};

export const mockPatients: Patient[] = [
    { id: "pat-1", name: "Elena Ríos", email: "elena.r@example.com", age: 34, gender: 'femenino', phone: '0414-1112233', cedula: 'V-18.123.456' },
    { id: "pat-2", name: "Jorge Paez", email: "jorge.p@example.com", age: 45, gender: 'masculino', phone: '0412-2223344', cedula: 'V-12.345.678' },
    { id: "pat-3", name: "Maria Castillo", email: "maria.c@example.com", age: 29, gender: 'femenino', phone: '0416-3334455', cedula: 'V-20.987.654' },
    { id: "pat-4", name: "Carlos Briceño", email: "carlos.b@example.com", age: 52, gender: 'masculino', phone: '0424-4445566', cedula: 'V-9.876.543' },
    { id: "pat-6", name: "Luis Ramirez", email: "luis.r@example.com", age: 60, gender: 'masculino', phone: '0412-5556677', cedula: 'V-6.543.210' },
];


export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorId: number;
  date: string;
  time: string;
  services: Service[];
  totalPrice: number;
  paymentMethod: 'efectivo' | 'transferencia';
  paymentStatus: 'Pendiente' | 'Pagado';
  paymentProof: string | null;
  attendance: 'Atendido' | 'No Asistió' | 'Pendiente';
  patientConfirmationStatus: 'Pendiente' | 'Confirmada' | 'Cancelada';
};

export const appointments: Appointment[] = [
  // Upcoming Appointments for Dr. Rodriguez (id: 1)
  {
    id: "appt-1",
    patientId: "pat-1",
    patientName: "Elena Ríos",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], // In 2 days
    time: "10:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 }, { id: 102, name: "Electrocardiograma (EKG)", price: 30 } ],
    totalPrice: 80,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pendiente',
    paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente',
    patientConfirmationStatus: 'Pendiente',
  },
  {
    id: "appt-3",
    patientId: "pat-3",
    patientName: "Maria Castillo",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], // In 5 days
    time: "09:00",
    services: [ { id: 103, name: "Ecocardiograma", price: 80 } ],
    totalPrice: 80,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pagado',
    paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente',
    patientConfirmationStatus: 'Pendiente',
  },
  {
    id: "appt-7",
    patientId: "pat-4",
    patientName: "Carlos Briceño",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date().toISOString().split('T')[0], // Today
    time: "14:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 } ],
    totalPrice: 50,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pendiente',
    paymentProof: null,
    attendance: 'Pendiente',
    patientConfirmationStatus: 'Pendiente',
  },
  {
    id: "appt-8",
    patientId: "paciente@example.com",
    patientName: "Paciente de Prueba",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow
    time: "11:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 }, { id: 102, name: "Electrocardiograma (EKG)", price: 30 } ],
    totalPrice: 80,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pagado',
    paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente',
    patientConfirmationStatus: 'Pendiente',
  },
  // Upcoming for Dr. Sanchez (id: 2)
  {
    id: "appt-2",
    patientId: "pat-2",
    patientName: "Jorge Paez",
    doctorName: "Dr. Carlos Sanchez",
    doctorId: 2,
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0], // In 3 days
    time: "14:00",
    services: [ { id: 201, name: "Consulta Dermatológica", price: 45 } ],
    totalPrice: 45,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pendiente',
    paymentProof: null,
    attendance: 'Pendiente',
    patientConfirmationStatus: 'Pendiente',
  },
  // Past Appointments for Dr. Rodriguez (id: 1)
   {
    id: "appt-4",
    patientId: "pat-6",
    patientName: "Luis Ramirez",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], // 15 days ago
    time: "11:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 } ],
    totalPrice: 50,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pagado',
    paymentProof: null,
    attendance: 'Atendido',
    patientConfirmationStatus: 'Confirmada',
  },
  {
    id: "appt-5",
    patientId: "paciente@example.com",
    patientName: "Paciente de Prueba",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0], // 10 days ago
    time: "14:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 } ],
    totalPrice: 50,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pagado',
    paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'No Asistió',
    patientConfirmationStatus: 'Confirmada',
  },
  {
    id: "appt-6",
    patientId: "paciente@example.com",
    patientName: "Paciente de Prueba",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], // 5 days ago
    time: "10:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 }, { id: 102, name: "Electrocardiograma (EKG)", price: 30 } ],
    totalPrice: 80,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pagado',
    paymentProof: null,
    attendance: 'Atendido',
    patientConfirmationStatus: 'Confirmada',
  }
];

export type Expense = {
  id: string;
  doctorId: number;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
};

export const mockExpenses: Expense[] = [
  { 
    id: 'exp-1', 
    doctorId: 1, 
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    description: 'Alquiler de consultorio', 
    amount: 500 
  },
  { 
    id: 'exp-2', 
    doctorId: 1, 
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
    description: 'Materiales médicos', 
    amount: 150 
  },
  { 
    id: 'exp-3', 
    doctorId: 1, 
    date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 10).toISOString().split('T')[0],
    description: 'Pago de servicios (luz, agua)', 
    amount: 80 
  },
  { 
    id: 'exp-4', 
    doctorId: 1, 
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString().split('T')[0],
    description: 'Suscripción software médico', 
    amount: 45 
  },
  { 
    id: 'exp-5', 
    doctorId: 1, 
    date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 20).toISOString().split('T')[0],
    description: 'Insumos de oficina', 
    amount: 35 
  },
];


export type SellerPayment = {
  id: string;
  sellerId: number;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  period: string; // e.g., "Mayo 2024"
  includedDoctors: { id: number; name: string }[];
  paymentProofUrl: string;
  transactionId: string;
};

export const mockSellerPayments: SellerPayment[] = [
  {
    id: 'pay-1',
    sellerId: 1,
    paymentDate: '2024-05-16',
    amount: 18, // 2 active doctors * $50 * 0.20 = 20, another one * 50 * 0.18 = 9... let's fix this logic later
    period: 'Abril 2024',
    includedDoctors: [
      { id: 1, name: "Dr. Ana Rodriguez" },
      { id: 2, name: "Dr. Carlos Sanchez" },
      { id: 4, name: "Dr. Luis Fernandez" },
    ],
    paymentProofUrl: 'https://placehold.co/400x300.png',
    transactionId: 'TXN-SUMA-20240516-001'
  },
  {
    id: 'pay-2',
    sellerId: 1,
    paymentDate: '2024-04-16',
    amount: 20.00,
    period: 'Marzo 2024',
    includedDoctors: [
      { id: 1, name: "Dr. Ana Rodriguez" },
      { id: 2, name: "Dr. Carlos Sanchez" },
    ],
    paymentProofUrl: 'https://placehold.co/400x300.png',
    transactionId: 'TXN-SUMA-20240416-001'
  },
];

export type MarketingMaterial = {
    id: number;
    type: 'image' | 'video' | 'file' | 'url';
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
};

export const mockMarketingMaterials: MarketingMaterial[] = [
    {
        id: 1,
        type: 'image',
        title: 'Banner para Redes Sociales',
        description: 'Banner promocional para usar en Instagram, Facebook y otras redes.',
        url: 'https://placehold.co/1080x1080.png',
        thumbnailUrl: 'https://placehold.co/600x400.png',
    },
    {
        id: 2,
        type: 'video',
        title: 'Video Explicativo de SUMA',
        description: 'Video corto que explica los beneficios de la plataforma para los médicos.',
        url: 'https://placehold.co/1920x1080.png',
        thumbnailUrl: 'https://placehold.co/600x400.png',
    },
    {
        id: 3,
        type: 'file',
        title: 'Folleto Informativo (PDF)',
        description: 'Documento PDF con toda la información clave para presentar a los médicos.',
        url: '#',
        thumbnailUrl: 'https://placehold.co/600x400.png',
    },
    {
        id: 4,
        type: 'url',
        title: 'Artículo de Blog: Beneficios de la Telemedicina',
        description: 'Enlace a un artículo relevante que puedes compartir con los doctores.',
        url: '#',
        thumbnailUrl: 'https://placehold.co/600x400.png',
    }
];

export type SupportTicket = {
    id: string;
    subject: string;
    status: 'abierto' | 'cerrado';
    date: string;
    lastReply: string;
}

export const mockSupportTickets: SupportTicket[] = [
    {
        id: 'ticket-1',
        subject: 'Problema con la comisión de un referido',
        status: 'abierto',
        date: '2024-05-20',
        lastReply: 'Hace 2 horas',
    },
    {
        id: 'ticket-2',
        subject: 'Cómo actualizar los datos de un médico',
        status: 'cerrado',
        date: '2024-05-15',
        lastReply: 'Hace 5 días',
    },
];

export type DoctorPayment = {
  id: string;
  doctorId: number;
  doctorName: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Rejected';
  paymentProofUrl: string | null;
};

export const mockDoctorPayments: DoctorPayment[] = [
  { id: 'dp-1', doctorId: 1, doctorName: 'Dr. Ana Rodriguez', date: '2024-05-28', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png'},
  { id: 'dp-2', doctorId: 2, doctorName: 'Dr. Carlos Sanchez', date: '2024-05-25', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png'},
  { id: 'dp-3', doctorId: 4, doctorName: 'Dr. Luis Fernandez', date: '2024-05-29', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png'},
  { id: 'dp-4', doctorId: 7, doctorName: 'Dra. Laura Montes', date: '2024-05-22', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png'},
  // This doctor's payment is pending approval
  { id: 'dp-5', doctorId: 3, doctorName: 'Dr. Sofia Gomez', date: '2024-06-01', amount: 50, status: 'Pending', paymentProofUrl: 'https://placehold.co/400x300.png'},
];


export type AdminSupportTicket = {
    id: string;
    userId: string; 
    userName: string;
    userRole: 'doctor' | 'seller';
    subject: string;
    status: 'abierto' | 'cerrado';
    date: string;
};

export const mockAdminSupportTickets: AdminSupportTicket[] = [
    {
        id: 'ticket-admin-1',
        userId: 'vendedora@venta.com',
        userName: 'Vendedora Principal',
        userRole: 'seller',
        subject: 'Problema con la comisión de un referido',
        status: 'abierto',
        date: '2024-05-20',
    },
    {
        id: 'ticket-admin-2',
        userId: 'ana.rodriguez.dr@email.com',
        userName: 'Dr. Ana Rodriguez',
        userRole: 'doctor',
        subject: 'Duda sobre el horario de trabajo',
        status: 'abierto',
        date: '2024-05-28',
    },
    {
        id: 'ticket-admin-3',
        userId: 'vendedora@venta.com',
        userName: 'Vendedora Principal',
        userRole: 'seller',
        subject: 'Cómo actualizar los datos de un médico',
        status: 'cerrado',
        date: '2024-05-15',
    },
];

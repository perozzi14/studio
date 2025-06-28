

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

export const locations: Record<string, string[]> = {
  "Caracas": ["Chacao", "Las Mercedes", "San Bernardino", "Altamira"],
  "Maracaibo": ["Tierra Negra", "La Lago", "Indio Mara"],
  "Valencia": ["El Viñedo", "Prebo", "La Trigaleña"],
};

export const cities = Object.keys(locations);

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
};

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

export type PaymentReport = {
  id: string;
  date: string; // YYYY-MM-DD
  referenceNumber: string;
  amount: number;
  status: 'Pendiente' | 'Verificado' | 'Rechazado';
  proofUrl: string;
  notes?: string; 
};

export type SupportTicketMessage = {
    from: 'doctor' | 'admin';
    message: string;
    date: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: 'Abierto' | 'Cerrado';
  messages: SupportTicketMessage[];
  createdAt: string; // YYYY-MM-DD
};


export type Doctor = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  specialty: string;
  city: string;
  sector: string;
  address: string;
  description: string;
  rating: number;
  reviewCount: number;
  profileImage: string;
  bannerImage: string;
  aiHint: string;
  services: Service[];
  bankDetails: BankDetail[];
  coupons: Coupon[];
  schedule: Schedule;
  slotDuration: 30 | 60;
  status: 'active' | 'inactive';
  paymentReports: PaymentReport[];
  supportTickets: SupportTicket[];
  sellerId: number | null;
  lastPaymentDate: string; // YYYY-MM-DD
};

export type Seller = {
  id: number;
  name: string;
  email: string;
  referralCode: string;
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
    referralCode: "VENDE123",
  }
];


export const doctors: Doctor[] = [
  { 
    id: 1, 
    name: "Dr. Ana Rodriguez",
    email: "ana.rodriguez@suma.com",
    whatsapp: "+584121234567",
    specialty: "Cardiología", 
    city: "Caracas",
    sector: "Chacao",
    address: "Av. Francisco de Miranda, Centro Lido, Piso 5",
    description: "Cardióloga con más de 15 años de experiencia en prevención y tratamiento de enfermedades cardiovasculares. Comprometida con el bienestar de mis pacientes.",
    rating: 4.9, 
    reviewCount: 120, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png", 
    aiHint: "woman doctor",
    sellerId: 1,
    lastPaymentDate: new Date().toISOString().split('T')[0],
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
    coupons: [
      { id: 1, code: "VERANO20", discountType: "percentage", value: 20 },
      { id: 2, code: "SUMA10", discountType: "fixed", value: 10 },
    ],
    slotDuration: 30,
    status: 'active',
    schedule: {
        monday: { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        tuesday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
        wednesday: { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        thursday: { active: false, slots: [] },
        friday: { active: true, slots: [{ start: "09:00", end: "15:00" }] },
        saturday: { active: false, slots: [] },
        sunday: { active: false, slots: [] },
    },
    paymentReports: [
        { id: 'pay-1', date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], referenceNumber: 'REF-123-LAST', amount: 50, status: 'Verificado', proofUrl: 'https://placehold.co/400x200.png' },
        { id: 'pay-2', date: new Date().toISOString().split('T')[0], referenceNumber: 'REF-456-THIS', amount: 50, status: 'Pendiente', proofUrl: 'https://placehold.co/400x200.png' },
    ],
    supportTickets: [
        { 
            id: 'tic-1', 
            subject: 'Problema con la carga de horarios', 
            status: 'Cerrado', 
            createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
            messages: [
                { from: 'doctor', message: 'No puedo guardar los cambios en mi horario del viernes.', date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString() },
                { from: 'admin', message: 'Hola Dr. Ana, hemos revisado el problema y ya debería estar solucionado. Por favor, intente de nuevo.', date: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString() },
                { from: 'doctor', message: '¡Perfecto, ya funciona! Gracias.', date: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString() }
            ]
        },
        { 
            id: 'tic-2', 
            subject: 'Consulta sobre facturación', 
            status: 'Abierto', 
            createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
            messages: [
                { from: 'doctor', message: 'Quisiera saber cuándo se emite la factura del mes.', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
            ]
        }
    ]
  },
  { 
    id: 2, 
    name: "Dr. Carlos Sanchez", 
    email: "carlos.sanchez@suma.com",
    whatsapp: "+584122345678",
    specialty: "Dermatología", 
    city: "Maracaibo", 
    sector: "Tierra Negra",
    address: "Calle 72 con Av. 3H, Edificio Profesional, Consultorio 2A",
    description: "Especialista en dermatología clínica y estética. Dedicado a la salud de la piel con tratamientos de vanguardia y atención personalizada.",
    rating: 4.8, 
    reviewCount: 98, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png", 
    aiHint: "man doctor",
    sellerId: null,
    lastPaymentDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
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
    coupons: [],
    slotDuration: 60,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 3, 
    name: "Dr. Sofia Gomez", 
    email: "sofia.gomez@suma.com",
    whatsapp: "+584123456789",
    specialty: "Neurología", 
    city: "Valencia", 
    sector: "El Viñedo",
    address: "Av. Monseñor Adams, Centro Médico El Viñedo, Local 10",
    description: "Neuróloga apasionada por el diagnóstico y tratamiento de trastornos del sistema nervioso. Mi objetivo es mejorar la calidad de vida de mis pacientes.",
    rating: 4.9, 
    reviewCount: 150, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "doctor smile",
    sellerId: 1,
    lastPaymentDate: new Date().toISOString().split('T')[0],
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
    coupons: [],
    slotDuration: 30,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 4, 
    name: "Dr. Luis Fernandez", 
    email: "luis.fernandez@suma.com",
    whatsapp: "+584124567890",
    specialty: "Pediatría", 
    city: "Caracas", 
    sector: "Las Mercedes",
    address: "Calle París, Torre Orinoco, Planta Baja",
    description: "Pediatra dedicado al cuidado integral de niños y adolescentes. Creo en una medicina preventiva y cercana a las familias.",
    rating: 5.0, 
    reviewCount: 210, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "male doctor",
    sellerId: null,
    lastPaymentDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0],
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
    coupons: [],
    slotDuration: 30,
    status: 'inactive',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 5, 
    name: "Dr. Maria Hernandez", 
    email: "maria.hernandez@suma.com",
    whatsapp: "+584125678901",
    specialty: "Oncología", 
    city: "Maracaibo", 
    sector: "La Lago",
    address: "Av. El Milagro, Hospital Coromoto, Anexo de Oncología",
    description: "Oncóloga con enfoque en el tratamiento multidisciplinario del cáncer, ofreciendo apoyo y las mejores terapias disponibles a mis pacientes.",
    rating: 4.7, 
    reviewCount: 75, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "female doctor",
    sellerId: null,
    lastPaymentDate: new Date().toISOString().split('T')[0],
    services: [
      { id: 501, name: "Consulta Oncológica", price: 70 },
      { id: 502, name: "Quimioterapia (por sesión)", price: 200 },
    ],
    bankDetails: [{
      id: 5001,
      bank: "Banco Mercantil",
      accountNumber: "0105-0005-0005-0005-0005",
      accountHolder: "Maria Hernandez",
      idNumber: "V-9.876.543"
    }],
    coupons: [],
    slotDuration: 60,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 6, 
    name: "Dr. Javier Torres", 
    email: "javier.torres@suma.com",
    whatsapp: "+584126789012",
    specialty: "Ortopedia", 
    city: "Caracas", 
    sector: "San Bernardino",
    address: "Av. Panteón, Clínica Caracas, Consultorio 3B",
    description: "Traumatólogo y Ortopedista especializado en lesiones deportivas y cirugía artroscópica. Mi misión es devolver el movimiento sin dolor.",
    rating: 4.8, 
    reviewCount: 112, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "doctor portrait",
    sellerId: 1,
    lastPaymentDate: new Date().toISOString().split('T')[0],
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
    coupons: [],
    slotDuration: 30,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 7, 
    name: "Dr. Laura Martínez", 
    email: "laura.martinez@suma.com",
    whatsapp: "+584127890123",
    specialty: "Cardiología", 
    city: "Valencia", 
    sector: "Prebo",
    address: "Av. 104, Centro Policlínico Valencia, Torre C",
    description: "Me especializo en el diagnóstico no invasivo de enfermedades cardíacas, utilizando tecnología de punta para una evaluación precisa.",
    rating: 4.9, 
    reviewCount: 135, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "female doctor professional",
    sellerId: null,
    lastPaymentDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    services: [
      { id: 701, name: "Consulta Cardiológica", price: 50 },
      { id: 702, name: "Prueba de Esfuerzo", price: 110 },
    ],
    bankDetails: [{
      id: 7001,
      bank: "Banco de Venezuela",
      accountNumber: "0102-0007-0007-0007-0007",
      accountHolder: "Laura Martínez",
      idNumber: "V-15.432.109"
    }],
    coupons: [],
    slotDuration: 60,
    status: 'inactive',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 8, 
    name: "Dr. Ricardo Vargas", 
    email: "ricardo.vargas@suma.com",
    whatsapp: "+584128901234",
    specialty: "Dermatología", 
    city: "Caracas", 
    sector: "Altamira",
    address: "Av. San Juan Bosco, Policlínica Metropolitana",
    description: "Dermatólogo con amplia experiencia en acné, rosácea y cáncer de piel. Ofrezco soluciones efectivas para todo tipo de pieles.",
    rating: 4.7, 
    reviewCount: 88, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "male doctor smile",
    sellerId: null,
    lastPaymentDate: new Date().toISOString().split('T')[0],
    services: [
      { id: 801, name: "Consulta Dermatológica", price: 45 },
      { id: 802, name: "Peeling Químico", price: 90 },
    ],
    bankDetails: [{
      id: 8001,
      bank: "BBVA Provincial",
      accountNumber: "0108-0008-0008-0008-0008",
      accountHolder: "Ricardo Vargas",
      idNumber: "V-12.876.543"
    }],
    coupons: [],
    slotDuration: 30,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 9, 
    name: "Dr. Valentina Diaz", 
    email: "valentina.diaz@suma.com",
    whatsapp: "+584129012345",
    specialty: "Ginecología", 
    city: "Maracaibo", 
    sector: "Indio Mara",
    address: "Av. 5 de Julio, Centro Médico de Occidente, Piso 2",
    description: "Ginecóloga-Obstetra dedicada a la salud integral de la mujer en todas sus etapas, desde la adolescencia hasta la menopausia.",
    rating: 4.9, 
    reviewCount: 180, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "doctor woman",
    sellerId: 1,
    lastPaymentDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    services: [
      { id: 901, name: "Consulta Ginecológica", price: 50 },
      { id: 902, name: "Citología", price: 35 },
      { id: 903, name: "Ecografía Transvaginal", price: 60 },
    ],
    bankDetails: [{
      id: 9001,
      bank: "Banco Mercantil",
      accountNumber: "0105-0009-0009-0009-0009",
      accountHolder: "Valentina Diaz",
      idNumber: "V-16.123.456"
    }],
    coupons: [],
    slotDuration: 30,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 10, 
    name: "Dr. Andres Castillo", 
    email: "andres.castillo@suma.com",
    whatsapp: "+584120123456",
    specialty: "Neumonología", 
    city: "Valencia", 
    sector: "La Trigaleña",
    address: "Av. Principal La Trigaleña, Instituto Docente de Urología",
    description: "Neumonólogo experto en asma, EPOC y trastornos del sueño. Mi enfoque es mejorar la función respiratoria y la calidad de vida.",
    rating: 4.8, 
    reviewCount: 95, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "doctor young",
    sellerId: null,
    lastPaymentDate: new Date().toISOString().split('T')[0],
    services: [
      { id: 1001, name: "Consulta Neumonológica", price: 55 },
      { id: 1002, name: "Espirometría", price: 70 },
    ],
    bankDetails: [{
      id: 10001,
      bank: "Banesco",
      accountNumber: "0134-0010-0010-0010-0010",
      accountHolder: "Andres Castillo",
      idNumber: "V-14.987.654"
    }],
    coupons: [],
    slotDuration: 60,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 11, 
    name: "Dra. Isabella Conti", 
    email: "isabella.conti@suma.com",
    whatsapp: "+584121112233",
    specialty: "Medicina Estética", 
    city: "Caracas", 
    sector: "Las Mercedes",
    address: "Av. Principal de Las Mercedes, Torre Emperatriz, Piso 10",
    description: "Especialista en rejuvenecimiento facial y corporal. Mi enfoque es realzar la belleza natural con procedimientos mínimamente invasivos y seguros.",
    rating: 4.9, 
    reviewCount: 85, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "aesthetic doctor",
    sellerId: 1,
    lastPaymentDate: new Date().toISOString().split('T')[0],
    services: [
      { id: 1101, name: "Aplicación de Toxina Botulínica", price: 150 },
      { id: 1102, name: "Relleno con Ácido Hialurónico", price: 250 },
      { id: 1103, name: "Plasma Rico en Plaquetas (PRP)", price: 120 },
    ],
    bankDetails: [{
      id: 11001,
      bank: "Banesco",
      accountNumber: "0134-0011-0011-0011-0011",
      accountHolder: "Isabella Conti",
      idNumber: "V-17.111.222"
    }],
    coupons: [],
    slotDuration: 60,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
  { 
    id: 12, 
    name: "Dr. Ricardo Salas", 
    email: "ricardo.salas@suma.com",
    whatsapp: "+584124445566",
    specialty: "Medicina Estética", 
    city: "Valencia", 
    sector: "La Trigaleña",
    address: "C.C. La Trigaleña Plaza, Nivel Mezzanina",
    description: "Médico estético dedicado a la armonización facial y tratamientos láser. Utilizo la última tecnología para obtener resultados naturales y duraderos.",
    rating: 4.8, 
    reviewCount: 70, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "male aesthetic doctor",
    sellerId: null,
    lastPaymentDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    services: [
      { id: 1201, name: "Consulta de Medicina Estética", price: 60 },
      { id: 1202, name: "Depilación Láser (por zona)", price: 80 },
      { id: 1203, name: "Mesoterapia Corporal", price: 90 },
    ],
    bankDetails: [{
      id: 12001,
      bank: "Mercantil",
      accountNumber: "0105-0012-0012-0012-0012",
      accountHolder: "Ricardo Salas",
      idNumber: "V-16.333.444"
    }],
    coupons: [],
    slotDuration: 30,
    status: 'active',
    schedule: defaultSchedule,
    paymentReports: [],
    supportTickets: [],
  },
];


export type Patient = {
    id: string;
    name: string;
    email: string;
    cedula: string;
    phone: string;
    age: number | null;
    gender: 'masculino' | 'femenino' | 'otro' | null;
};

export const mockPatients: Patient[] = [
    { id: "pat-1", name: "Elena Ríos", email: "elena.r@example.com", cedula: "V-18.123.456", phone: "0414-123-4567", age: 34, gender: 'femenino' },
    { id: "pat-2", name: "Jorge Paez", email: "jorge.p@example.com", cedula: "V-12.345.678", phone: "0412-234-5678", age: 45, gender: 'masculino' },
    { id: "pat-3", name: "Maria Castillo", email: "maria.c@example.com", cedula: "V-20.456.789", phone: "0416-345-6789", age: 29, gender: 'femenino' },
    { id: "pat-4", name: "Carlos Briceño", email: "carlos.b@example.com", cedula: "V-9.876.543", phone: "0424-456-7890", age: 52, gender: 'masculino' },
    { id: "pat-5", name: "Lucia Méndez", email: "lucia.m@example.com", cedula: "V-15.654.321", phone: "0414-567-8901", age: 41, gender: 'femenino' },
    { id: "pat-6", name: "Luis Ramirez", email: "luis.r@example.com", cedula: "V-11.789.012", phone: "0412-678-9012", age: 60, gender: 'masculino' },
    { id: "pat-7", name: "Sofia Peña", email: "sofia.p@example.com", cedula: "V-25.890.123", phone: "0416-789-0123", age: 25, gender: 'femenino' },
    { id: "pat-8", name: "Juan Alfonzo", email: "juan.a@example.com", cedula: "V-14.901.234", phone: "0424-890-1234", age: 38, gender: 'masculino' },
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

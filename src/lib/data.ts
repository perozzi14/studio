
export const specialties = [
  "Cardiología",
  "Dermatología",
  "Neurología",
  "Pediatría",
  "Oncología",
  "Ortopedia",
  "Ginecología",
  "Neumonología",
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
};

export type Doctor = {
  id: number;
  name: string;
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
};

export const doctors: Doctor[] = [
  { 
    id: 1, 
    name: "Dr. Ana Rodriguez", 
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
    ]
  },
  { 
    id: 2, 
    name: "Dr. Carlos Sanchez", 
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
    coupons: []
  },
  { 
    id: 3, 
    name: "Dr. Sofia Gomez", 
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
    coupons: []
  },
  { 
    id: 4, 
    name: "Dr. Luis Fernandez", 
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
    coupons: []
  },
  { 
    id: 5, 
    name: "Dr. Maria Hernandez", 
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
    coupons: []
  },
  { 
    id: 6, 
    name: "Dr. Javier Torres", 
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
    coupons: []
  },
  { 
    id: 7, 
    name: "Dr. Laura Martínez", 
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
    coupons: []
  },
  { 
    id: 8, 
    name: "Dr. Ricardo Vargas", 
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
    coupons: []
  },
  { 
    id: 9, 
    name: "Dr. Valentina Diaz", 
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
    coupons: []
  },
  { 
    id: 10, 
    name: "Dr. Andres Castillo", 
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
    coupons: []
  },
];


export type Patient = {
    id: string;
    name: string;
    email: string;
    age: number | null;
    gender: 'masculino' | 'femenino' | 'otro' | null;
};

export const mockPatients: Patient[] = [
    { id: "pat-1", name: "Elena Ríos", email: "elena.r@example.com", age: 34, gender: 'femenino' },
    { id: "pat-2", name: "Jorge Paez", email: "jorge.p@example.com", age: 45, gender: 'masculino' },
    { id: "pat-3", name: "Maria Castillo", email: "maria.c@example.com", age: 29, gender: 'femenino' },
    { id: "pat-4", name: "Carlos Briceño", email: "carlos.b@example.com", age: 52, gender: 'masculino' },
    { id: "pat-5", name: "Lucia Méndez", email: "lucia.m@example.com", age: 41, gender: 'femenino' },
    { id: "pat-6", name: "Luis Ramirez", email: "luis.r@example.com", age: 60, gender: 'masculino' },
    { id: "pat-7", name: "Sofia Peña", email: "sofia.p@example.com", age: 25, gender: 'femenino' },
    { id: "pat-8", name: "Juan Alfonzo", email: "juan.a@example.com", age: 38, gender: 'masculino' },
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
    attendance: 'Pendiente'
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
    attendance: 'Pendiente'
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
    attendance: 'Pendiente'
  },
  {
    id: "appt-8",
    patientId: "pat-5",
    patientName: "Lucia Méndez",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow
    time: "11:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 }, { id: 102, name: "Electrocardiograma (EKG)", price: 30 } ],
    totalPrice: 80,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pagado',
    paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente'
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
    attendance: 'Pendiente'
  },
  // Past Appointments for Dr. Rodriguez (id: 1)
   {
    id: "appt-4",
    patientId: "pat-6",
    patientName: "Luis Ramirez",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: "2024-07-17",
    time: "11:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 } ],
    totalPrice: 50,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pagado',
    paymentProof: null,
    attendance: 'Atendido'
  },
  {
    id: "appt-5",
    patientId: "pat-7",
    patientName: "Sofia Peña",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: "2024-07-20",
    time: "14:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 } ],
    totalPrice: 50,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pagado',
    paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'No Asistió'
  },
  {
    id: "appt-6",
    patientId: "pat-8",
    patientName: "Juan Alfonzo",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: "2024-07-25",
    time: "10:00",
    services: [ { id: 101, name: "Consulta Cardiológica", price: 50 }, { id: 102, name: "Electrocardiograma (EKG)", price: 30 } ],
    totalPrice: 80,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pagado',
    paymentProof: null,
    attendance: 'Atendido'
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
  { id: 'exp-1', doctorId: 1, date: '2024-08-01', description: 'Alquiler de consultorio', amount: 500 },
  { id: 'exp-2', doctorId: 1, date: '2024-08-05', description: 'Materiales médicos', amount: 150 },
  { id: 'exp-3', doctorId: 1, date: '2024-07-10', description: 'Pago de servicios (luz, agua)', amount: 80 },
  { id: 'exp-4', doctorId: 1, date: '2024-08-12', description: 'Suscripción software médico', amount: 45 },
  { id: 'exp-5', doctorId: 1, date: '2024-07-20', description: 'Insumos de oficina', amount: 35 },
];

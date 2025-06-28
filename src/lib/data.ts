
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

export type Doctor = {
  id: number;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviewCount: number;
  image: string;
  aiHint: string;
  services: Service[];
  bankDetails: BankDetail[];
};

export const doctors: Doctor[] = [
  { 
    id: 1, 
    name: "Dr. Ana Rodriguez", 
    specialty: "Cardiología", 
    location: "Caracas", 
    rating: 4.9, 
    reviewCount: 120, 
    image: "https://placehold.co/400x400.png", 
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
    ]
  },
  { 
    id: 2, 
    name: "Dr. Carlos Sanchez", 
    specialty: "Dermatología", 
    location: "Maracaibo", 
    rating: 4.8, 
    reviewCount: 98, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 3, 
    name: "Dr. Sofia Gomez", 
    specialty: "Neurología", 
    location: "Valencia", 
    rating: 4.9, 
    reviewCount: 150, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 4, 
    name: "Dr. Luis Fernandez", 
    specialty: "Pediatría", 
    location: "Caracas", 
    rating: 5.0, 
    reviewCount: 210, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 5, 
    name: "Dr. Maria Hernandez", 
    specialty: "Oncología", 
    location: "Maracaibo", 
    rating: 4.7, 
    reviewCount: 75, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 6, 
    name: "Dr. Javier Torres", 
    specialty: "Ortopedia", 
    location: "Caracas", 
    rating: 4.8, 
    reviewCount: 112, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 7, 
    name: "Dr. Laura Martínez", 
    specialty: "Cardiología", 
    location: "Valencia", 
    rating: 4.9, 
    reviewCount: 135, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 8, 
    name: "Dr. Ricardo Vargas", 
    specialty: "Dermatología", 
    location: "Caracas", 
    rating: 4.7, 
    reviewCount: 88, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 9, 
    name: "Dr. Valentina Diaz", 
    specialty: "Ginecología", 
    location: "Maracaibo", 
    rating: 4.9, 
    reviewCount: 180, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
  { 
    id: 10, 
    name: "Dr. Andres Castillo", 
    specialty: "Neumonología", 
    location: "Valencia", 
    rating: 4.8, 
    reviewCount: 95, 
    image: "https://placehold.co/400x400.png", 
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
    }]
  },
];


export type Appointment = {
  id: string;
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
};

export const appointments: Appointment[] = [
  {
    id: "appt-1",
    patientName: "Elena Ríos",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: "2024-08-15",
    time: "10:00",
    services: [
      { id: 101, name: "Consulta Cardiológica", price: 50 },
      { id: 102, name: "Electrocardiograma (EKG)", price: 30 },
    ],
    totalPrice: 80,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pendiente',
    paymentProof: 'https://placehold.co/400x200.png'
  },
  {
    id: "appt-2",
    patientName: "Jorge Paez",
    doctorName: "Dr. Carlos Sanchez",
    doctorId: 2,
    date: "2024-08-15",
    time: "14:00",
    services: [
      { id: 201, name: "Consulta Dermatológica", price: 45 },
    ],
    totalPrice: 45,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pendiente',
    paymentProof: null
  },
    {
    id: "appt-3",
    patientName: "Maria Castillo",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: "2024-08-16",
    time: "09:00",
    services: [
      { id: 103, name: "Ecocardiograma", price: 80 },
    ],
    totalPrice: 80,
    paymentMethod: 'transferencia',
    paymentStatus: 'Pagado',
    paymentProof: 'https://placehold.co/400x200.png'
  },
   {
    id: "appt-4",
    patientName: "Luis Ramirez",
    doctorName: "Dr. Ana Rodriguez",
    doctorId: 1,
    date: "2024-07-17",
    time: "11:00",
    services: [
      { id: 101, name: "Consulta Cardiológica", price: 50 },
    ],
    totalPrice: 50,
    paymentMethod: 'efectivo',
    paymentStatus: 'Pagado',
    paymentProof: null
  },
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

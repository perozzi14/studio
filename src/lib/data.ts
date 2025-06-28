
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

export const doctors = [
  { 
    id: 1, 
    name: "Dr. Ana Rodriguez", 
    specialty: "Cardiología", 
    location: "Caracas", 
    rating: 4.9, 
    reviewCount: 120, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "woman doctor",
    services: [
      { id: 101, name: "Consulta Cardiológica", price: 50 },
      { id: 102, name: "Electrocardiograma (EKG)", price: 30 },
      { id: 103, name: "Ecocardiograma", price: 80 },
    ],
    bankDetails: {
      bank: "Banesco",
      accountNumber: "0134-0001-0001-0001-0001",
      accountHolder: "Ana Rodriguez",
      idNumber: "V-12.345.678"
    }
  },
  { 
    id: 2, 
    name: "Dr. Carlos Sanchez", 
    specialty: "Dermatología", 
    location: "Maracaibo", 
    rating: 4.8, 
    reviewCount: 98, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "man doctor",
    services: [
      { id: 201, name: "Consulta Dermatológica", price: 45 },
      { id: 202, name: "Crioterapia (verrugas)", price: 60 },
      { id: 203, name: "Biopsia de Piel", price: 100 },
    ],
    bankDetails: {
      bank: "Banco de Venezuela",
      accountNumber: "0102-0002-0002-0002-0002",
      accountHolder: "Carlos Sanchez",
      idNumber: "V-10.987.654"
    }
  },
  { 
    id: 3, 
    name: "Dr. Sofia Gomez", 
    specialty: "Neurología", 
    location: "Valencia", 
    rating: 4.9, 
    reviewCount: 150, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "doctor smile",
    services: [
      { id: 301, name: "Consulta Neurológica", price: 60 },
      { id: 302, name: "Electroencefalograma (EEG)", price: 120 },
    ],
    bankDetails: {
      bank: "BBVA Provincial",
      accountNumber: "0108-0003-0003-0003-0003",
      accountHolder: "Sofia Gomez",
      idNumber: "V-14.567.890"
    }
  },
  { 
    id: 4, 
    name: "Dr. Luis Fernandez", 
    specialty: "Pediatría", 
    location: "Caracas", 
    rating: 5.0, 
    reviewCount: 210, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "male doctor",
    services: [
      { id: 401, name: "Consulta Pediátrica", price: 40 },
      { id: 402, name: "Vacunación", price: 25 },
    ],
    bankDetails: {
      bank: "Bancamiga",
      accountNumber: "0172-0004-0004-0004-0004",
      accountHolder: "Luis Fernandez",
      idNumber: "V-11.222.333"
    }
  },
  { 
    id: 5, 
    name: "Dr. Maria Hernandez", 
    specialty: "Oncología", 
    location: "Maracaibo", 
    rating: 4.7, 
    reviewCount: 75, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "female doctor",
    services: [
      { id: 501, name: "Consulta Oncológica", price: 70 },
      { id: 502, name: "Quimioterapia (por sesión)", price: 200 },
    ],
    bankDetails: {
      bank: "Banco Mercantil",
      accountNumber: "0105-0005-0005-0005-0005",
      accountHolder: "Maria Hernandez",
      idNumber: "V-9.876.543"
    }
  },
  { 
    id: 6, 
    name: "Dr. Javier Torres", 
    specialty: "Ortopedia", 
    location: "Caracas", 
    rating: 4.8, 
    reviewCount: 112, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "doctor portrait",
    services: [
      { id: 601, name: "Consulta Ortopédica", price: 55 },
      { id: 602, name: "Infiltración", price: 75 },
    ],
    bankDetails: {
      bank: "Banesco",
      accountNumber: "0134-0006-0006-0006-0006",
      accountHolder: "Javier Torres",
      idNumber: "V-13.131.313"
    }
  },
  { 
    id: 7, 
    name: "Dr. Laura Martínez", 
    specialty: "Cardiología", 
    location: "Valencia", 
    rating: 4.9, 
    reviewCount: 135, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "female doctor professional",
    services: [
      { id: 701, name: "Consulta Cardiológica", price: 50 },
      { id: 702, name: "Prueba de Esfuerzo", price: 110 },
    ],
    bankDetails: {
      bank: "Banco de Venezuela",
      accountNumber: "0102-0007-0007-0007-0007",
      accountHolder: "Laura Martínez",
      idNumber: "V-15.432.109"
    }
  },
  { 
    id: 8, 
    name: "Dr. Ricardo Vargas", 
    specialty: "Dermatología", 
    location: "Caracas", 
    rating: 4.7, 
    reviewCount: 88, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "male doctor smile",
    services: [
      { id: 801, name: "Consulta Dermatológica", price: 45 },
      { id: 802, name: "Peeling Químico", price: 90 },
    ],
    bankDetails: {
      bank: "BBVA Provincial",
      accountNumber: "0108-0008-0008-0008-0008",
      accountHolder: "Ricardo Vargas",
      idNumber: "V-12.876.543"
    }
  },
  { 
    id: 9, 
    name: "Dr. Valentina Diaz", 
    specialty: "Ginecología", 
    location: "Maracaibo", 
    rating: 4.9, 
    reviewCount: 180, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "doctor woman",
    services: [
      { id: 901, name: "Consulta Ginecológica", price: 50 },
      { id: 902, name: "Citología", price: 35 },
      { id: 903, name: "Ecografía Transvaginal", price: 60 },
    ],
    bankDetails: {
      bank: "Banco Mercantil",
      accountNumber: "0105-0009-0009-0009-0009",
      accountHolder: "Valentina Diaz",
      idNumber: "V-16.123.456"
    }
  },
  { 
    id: 10, 
    name: "Dr. Andres Castillo", 
    specialty: "Neumonología", 
    location: "Valencia", 
    rating: 4.8, 
    reviewCount: 95, 
    image: "https://placehold.co/300x300.png", 
    aiHint: "doctor young",
    services: [
      { id: 1001, name: "Consulta Neumonológica", price: 55 },
      { id: 1002, name: "Espirometría", price: 70 },
    ],
    bankDetails: {
      bank: "Banesco",
      accountNumber: "0134-0010-0010-0010-0010",
      accountHolder: "Andres Castillo",
      idNumber: "V-14.987.654"
    }
  },
];

export type Doctor = (typeof doctors)[0];
export type Service = (typeof doctors)[0]["services"][0];

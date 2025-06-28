
export const specialties = [
  "Cardiología",
  "Dermatología",
  "Neurología",
  "Pediatría",
  "Oncología",
  "Ortopedia",
];

export const doctors = [
  { id: 1, name: "Dr. Ana Rodriguez", specialty: "Cardiología", location: "Mexico City", rating: 4.9, reviewCount: 120, image: "https://placehold.co/300x300.png", aiHint: "woman doctor" },
  { id: 2, name: "Dr. Carlos Sanchez", specialty: "Dermatología", location: "Guadalajara", rating: 4.8, reviewCount: 98, image: "https://placehold.co/300x300.png", aiHint: "man doctor" },
  { id: 3, name: "Dr. Sofia Gomez", specialty: "Neurología", location: "Monterrey", rating: 4.9, reviewCount: 150, image: "https://placehold.co/300x300.png", aiHint: "doctor smile" },
  { id: 4, name: "Dr. Luis Fernandez", specialty: "Pediatría", location: "Mexico City", rating: 5.0, reviewCount: 210, image: "https://placehold.co/300x300.png", aiHint: "male doctor" },
  { id: 5, name: "Dr. Maria Hernandez", specialty: "Oncología", location: "Guadalajara", rating: 4.7, reviewCount: 75, image: "https://placehold.co/300x300.png", aiHint: "female doctor" },
  { id: 6, name: "Dr. Javier Torres", specialty: "Ortopedia", location: "Mexico City", rating: 4.8, reviewCount: 112, image: "https://placehold.co/300x300.png", aiHint: "doctor portrait" },
  { id: 7, name: "Dr. Laura Martínez", specialty: "Cardiología", location: "Monterrey", rating: 4.9, reviewCount: 135, image: "https://placehold.co/300x300.png", aiHint: "female doctor professional" },
  { id: 8, name: "Dr. Ricardo Vargas", specialty: "Dermatología", location: "Mexico City", rating: 4.7, reviewCount: 88, image: "https://placehold.co/300x300.png", aiHint: "male doctor smile" },
];

export type Doctor = (typeof doctors)[0];

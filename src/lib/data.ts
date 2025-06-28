
export const specialties = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Oncology",
  "Orthopedics",
];

export const doctors = [
  { id: 1, name: "Dr. Ana Rodriguez", specialty: "Cardiology", location: "Mexico City", rating: 4.9, reviewCount: 120, image: "https://placehold.co/300x300.png", aiHint: "woman doctor" },
  { id: 2, name: "Dr. Carlos Sanchez", specialty: "Dermatology", location: "Guadalajara", rating: 4.8, reviewCount: 98, image: "https://placehold.co/300x300.png", aiHint: "man doctor" },
  { id: 3, name: "Dr. Sofia Gomez", specialty: "Neurology", location: "Monterrey", rating: 4.9, reviewCount: 150, image: "https://placehold.co/300x300.png", aiHint: "doctor smile" },
  { id: 4, name: "Dr. Luis Fernandez", specialty: "Pediatrics", location: "Mexico City", rating: 5.0, reviewCount: 210, image: "https://placehold.co/300x300.png", aiHint: "male doctor" },
  { id: 5, name: "Dr. Maria Hernandez", specialty: "Oncology", location: "Guadalajara", rating: 4.7, reviewCount: 75, image: "https://placehold.co/300x300.png", aiHint: "female doctor" },
  { id: 6, name: "Dr. Javier Torres", specialty: "Orthopedics", location: "Mexico City", rating: 4.8, reviewCount: 112, image: "https://placehold.co/300x300.png", aiHint: "doctor portrait" },
  { id: 7, name: "Dr. Laura Martínez", specialty: "Cardiology", location: "Monterrey", rating: 4.9, reviewCount: 135, image: "https://placehold.co/300x300.png", aiHint: "female doctor professional" },
  { id: 8, name: "Dr. Ricardo Vargas", specialty: "Dermatology", location: "Mexico City", rating: 4.7, reviewCount: 88, image: "https://placehold.co/300x300.png", aiHint: "male doctor smile" },
];

export type Doctor = (typeof doctors)[0];

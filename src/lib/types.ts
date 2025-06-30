







export type ChatMessage = {
    id: string;
    sender: 'user' | 'admin';
    text: string;
    timestamp: string; // ISO string
};

export type BankDetail = {
  id: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  idNumber: string;
  description?: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  scope: 'general' | string; // 'general' or doctorId
};

export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
};

export type SupportTicket = {
    id: string;
    subject: string;
    status: 'abierto' | 'cerrado';
    date: string;
    lastReply: string;
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

export type Doctor = {
  id: string;
  name: string;
  cedula: string;
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
  expenses: Expense[];
  coupons: Coupon[];
  schedule: Schedule;
  slotDuration: 30 | 60;
  sellerId: string | null;
  status: 'active' | 'inactive';
  lastPaymentDate: string;
  email: string;
  password: string;
  whatsapp: string;
  lat: number;
  lng: number;
  joinDate: string;
  subscriptionStatus: 'active' | 'inactive' | 'pending_payment';
  nextPaymentDate: string;
};

export type Seller = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  profileImage: string;
  referralCode: string;
  bankDetails: BankDetail[];
  commissionRate: number;
  expenses?: Expense[];
};

export type Patient = {
    id: string;
    name: string;
    email: string;
    password: string;
    age: number | null;
    gender: 'masculino' | 'femenino' | 'otro' | null;
    phone: string | null;
    cedula: string | null;
    favoriteDoctorIds?: string[];
    profileImage?: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  date: string;
  time: string;
  services: Service[];
  totalPrice: number;
  paymentMethod: 'efectivo' | 'transferencia';
  paymentStatus: 'Pendiente' | 'Pagado';
  paymentProof: string | null;
  attendance: 'Atendido' | 'No Asistió' | 'Pendiente';
  patientConfirmationStatus: 'Pendiente' | 'Confirmada' | 'Cancelada';
  clinicalNotes?: string;
  prescription?: string;
};

export type SellerPayment = {
  id: string;
  sellerId: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  period: string; // e.g., "Mayo 2024"
  includedDoctors: { id: string; name: string }[];
  paymentProofUrl: string;
  transactionId: string;
};

export type MarketingMaterial = {
    id: string;
    type: 'image' | 'video' | 'file' | 'url';
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
};

export type DoctorPayment = {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Rejected';
  paymentProofUrl: string | null;
  transactionId: string;
  readByAdmin?: boolean;
};


export type AdminSupportTicket = {
    id: string;
    userId: string; 
    userName: string;
    userRole: 'doctor' | 'seller';
    subject: string;
    description: string;
    status: 'abierto' | 'cerrado';
    date: string;
    messages?: ChatMessage[];
    readByAdmin?: boolean;
};

export type AdminNotification = {
    id: string;
    type: 'payment' | 'new_doctor' | 'support_ticket';
    title: string;
    description: string;
    date: string; // ISO string
    read: boolean;
    link: string;
};

export type DoctorNotification = {
    id: string;
    type: 'payment_verification' | 'support_reply' | 'subscription_update';
    title: string;
    description: string;
    date: string; // ISO string
    read: boolean;
    link: string;
};

export type CompanyExpense = {
    id: string;
    date: string; // YYYY-MM-DD
    description: string;
    amount: number;
    category: 'operativo' | 'marketing' | 'personal';
};

// For settings document in Firestore
export type AppSettings = {
    cities: string[];
    specialties: string[];
    doctorSubscriptionFee: number;
    companyBankDetails: BankDetail[];
    timezone: string;
    logoUrl: string;
    currency: string;
    beautySpecialties?: string[];
}


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
  subscriptionStatus: 'active' | 'inactive' | 'pending_payment';
  nextPaymentDate: string;
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

export type Patient = {
    id: string;
    name: string;
    email: string;
    age: number | null;
    gender: 'masculino' | 'femenino' | 'otro' | null;
    phone: string | null;
    cedula: string | null;
};

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
  clinicalNotes?: string;
  prescription?: string;
};

export type Expense = {
  id: string;
  doctorId: number;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
};

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

export type MarketingMaterial = {
    id: number;
    type: 'image' | 'video' | 'file' | 'url';
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
};

export type SupportTicket = {
    id: string;
    userId: string; // email of user
    subject: string;
    status: 'abierto' | 'cerrado';
    date: string;
    lastReply: string;
}

export type DoctorPayment = {
  id: string;
  doctorId: number;
  doctorName: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Rejected';
  paymentProofUrl: string | null;
  transactionId: string;
};


export type AdminSupportTicket = {
    id: string;
    userId: string; 
    userName: string;
    userRole: 'doctor' | 'seller';
    subject: string;
    status: 'abierto' | 'cerrado';
    date: string;
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

export type CompanyExpense = {
    id: string;
    date: string; // YYYY-MM-DD
    description: string;
    amount: number;
    category: 'operativo' | 'marketing' | 'personal';
};


"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import dynamicImport from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import type { Doctor, Seller, Patient, DoctorPayment, AdminSupportTicket, Coupon, SellerPayment, BankDetail, Appointment, CompanyExpense, MarketingMaterial, ChatMessage, City, IncludedDoctorCommission } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, Stethoscope, UserCheck, BarChart as BarChartIcon, Settings, CheckCircle, XCircle, Pencil, Eye, Trash2, PlusCircle, Ticket, DollarSign, Wallet, MapPin, Tag, BrainCircuit, Globe, Image as ImageIcon, FileUp, Landmark, Mail, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, FileDown, Database, Loader2, ShoppingBag, Video, FileText, Link as LinkIcon, AlertCircle, Send, Upload, Sparkles, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, startOfDay, endOfDay, startOfWeek, endOfWeek, endOfYear, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/lib/settings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';

const FinanceChart = dynamicImport(
  () => import('@/components/admin/finance-chart'),
  { 
    ssr: false,
    loading: () => <div className="h-72 w-full flex items-center justify-center bg-muted/50 rounded-lg"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
  }
);

const passwordSchema = z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número.");

const DoctorFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Por favor, ingresa un correo electrónico válido."),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  specialty: z.string().min(1, "Debes seleccionar una especialidad."),
  city: z.string().min(1, "Debes seleccionar una ciudad."),
  address: z.string().min(5, "La dirección es requerida."),
  sellerId: z.string().nullable(),
  slotDuration: z.number().int().min(5, "La duración debe ser al menos 5 min.").positive(),
  consultationFee: z.number().min(0, "La tarifa de consulta no puede ser negativa."),
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password) {
        const passResult = passwordSchema.safeParse(password);
        if (!passResult.success) {
            passResult.error.errors.forEach(err => ctx.addIssue({ ...err, path: ['password'] }));
        }
        if (password !== confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Las contraseñas no coinciden.",
                path: ["confirmPassword"],
            });
        }
    }
});


const SellerFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Por favor, ingresa un correo electrónico válido."),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  commission: z.number().min(0, "La comisión no puede ser negativa.").max(100, "La comisión no puede ser mayor a 100."),
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password) {
        const passResult = passwordSchema.safeParse(password);
        if (!passResult.success) {
            passResult.error.errors.forEach(err => ctx.addIssue({ ...err, path: ['password'] }));
        }
        if (password !== confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Las contraseñas no coinciden.",
                path: ["confirmPassword"],
            });
        }
    }
});


const SellerPaymentFormSchema = z.object({
    transactionId: z.string().min(1, "El ID de transacción es requerido."),
    paymentProof: z.any().refine((file) => file?.name, "El comprobante es requerido."),
});

const PatientFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Correo electrónico inválido."),
  cedula: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password) {
        const passResult = passwordSchema.safeParse(password);
        if (!passResult.success) {
            passResult.error.errors.forEach(err => ctx.addIssue({ ...err, path: ['password'] }));
        }
        if (password !== confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Las contraseñas no coinciden.",
                path: ["confirmPassword"],
            });
        }
    }
});

const ExpenseFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser positivo."),
  category: z.enum(['operativo', 'marketing', 'personal']),
});

const CityFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  subscriptionFee: z.number().min(0, "La tarifa debe ser un número positivo."),
});

const NameSchema = z.string().min(2, "El nombre es requerido.");

const CouponFormSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().positive("El valor debe ser positivo."),
  scope: z.string().min(1, "El alcance es requerido."),
});

const BankDetailFormSchema = z.object({
  bank: z.string().min(3, "El nombre del banco es requerido."),
  accountHolder: z.string().min(3, "El nombre del titular es requerido."),
  idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
  accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
  description: z.string().nullable().optional(),
});

const MarketingMaterialSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  type: z.enum(['image', 'video', 'file', 'url']),
  url: z.string().min(1, "Se requiere una URL o un archivo."),
  thumbnailUrl: z.string().min(1, "Se requiere una URL de miniatura o un archivo."),
});

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const currentTab = searchParams.get('view') || 'overview';
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
  const [sellerPayments, setSellerPayments] = useState<SellerPayment[]>([]);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);
  const [marketingMaterials, setMarketingMaterials] = useState<MarketingMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for Seller management
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [managingSeller, setManagingSeller] = useState<Seller | null>(null);
  const [isRegisterPaymentDialogOpen, setIsRegisterPaymentDialogOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentPeriod, setPaymentPeriod] = useState("");

  // States for Doctor management
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // States for Patient Management
  const [isPatientDetailDialogOpen, setIsPatientDetailDialogOpen] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [isPatientEditDialogOpen, setIsPatientEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // States for Deletion
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'doctor' | 'seller' | 'patient' | 'expense' | 'city' | 'specialty' | 'coupon' | 'bank' | 'marketing', data: any} | null>(null);

  // State for Payment Approval
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // States for Marketing
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MarketingMaterial | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  
  // States for Support
  const [isSupportDetailDialogOpen, setIsSupportDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");


  // States for Settings & Company Finances
  const { 
      cities,
      specialties,
      beautySpecialties,
      coupons,
      timezone,
      logoUrl,
      heroImageUrl,
      currency,
      companyBankDetails,
      companyExpenses,
      billingCycleStartDay,
      billingCycleEndDay,
      updateSetting,
      addListItem,
      updateListItem,
      deleteListItem,
  } = useSettings();
  
  const [tempLogoUrl, setTempLogoUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [tempHeroImageUrl, setTempHeroImageUrl] = useState<string>('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<{ originalName: string, name: string; subscriptionFee: number; } | null>(null);
  const [isSpecialtyDialogOpen, setIsSpecialtyDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<{ originalName: string, newName: string } | null>(null);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCompanyBankDetailDialogOpen, setIsCompanyBankDetailDialogOpen] = useState(false);
  const [editingCompanyBankDetail, setEditingCompanyBankDetail] = useState<BankDetail | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [tempBillingStartDay, setTempBillingStartDay] = useState(billingCycleStartDay);
  const [tempBillingEndDay, setTempBillingEndDay] = useState(billingCycleEndDay);

  // State for DB Seeding & Maintenance
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Pagination State for Expenses
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [expenseItemsPerPage, setExpenseItemsPerPage] = useState(10);


  const timeRangeLabels: Record<string, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año',
    all: 'Global',
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [docs, sells, pats, apps, docPays, sellPays, materials, tickets] = await Promise.all([
            firestoreService.getDoctors(),
            firestoreService.getSellers(),
            firestoreService.getPatients(),
            firestoreService.getAppointments(),
            firestoreService.getDoctorPayments(),
            firestoreService.getSellerPayments(),
            firestoreService.getMarketingMaterials(),
            firestoreService.getSupportTickets(),
        ]);
        setDoctors(docs);
        setSellers(sells);
        setPatients(pats);
        setAppointments(apps);
        setDoctorPayments(docPays);
        setSellerPayments(sellPays);
        setMarketingMaterials(materials);
        setSupportTickets(tickets.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
        console.error("Failed to fetch admin data, possibly offline.", error);
        toast({
            variant: "destructive",
            title: "Error de Red",
            description: "No se pudieron cargar los datos del panel. Por favor, revisa tu conexión a internet.",
        });
        setDoctors([]);
        setSellers([]);
        setPatients([]);
        setAppointments([]);
        setDoctorPayments([]);
        setSellerPayments([]);
        setMarketingMaterials([]);
        setSupportTickets([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  // Check subscriptions on load
  useEffect(() => {
    if (user?.role === 'admin' && doctors.length > 0 && billingCycleEndDay) {
      const today = new Date();
      if (today.getDate() > billingCycleEndDay) {
        const doctorsToDeactivate = doctors.filter(doc =>
          doc.status === 'active' &&
          doc.subscriptionStatus !== 'active' && // They haven't paid for the current cycle
          new Date(doc.nextPaymentDate) < today
        );
        if (doctorsToDeactivate.length > 0) {
          console.log(`Deactivating ${doctorsToDeactivate.length} doctors...`);
          const updates = doctorsToDeactivate.map(doc =>
            firestoreService.updateDoctor(doc.id, { status: 'inactive' })
          );
          Promise.all(updates).then(() => {
            toast({
              title: "Suscripciones Actualizadas",
              description: `${doctorsToDeactivate.length} médicos han sido pasados a inactivos por falta de pago.`,
            });
            fetchData();
          });
        }
      }
    }
  }, [user, doctors, billingCycleEndDay, fetchData, toast]);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await firestoreService.seedDatabase();
      toast({
        title: "Base de Datos Poblada",
        description: "Los datos de prueba han sido cargados a Firestore exitosamente.",
      });
      fetchData(); // Refresh data after seeding
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        variant: "destructive",
        title: "Error al Poblar Base de Datos",
        description: "Ocurrió un error. Revisa la consola para más detalles.",
      });
    } finally {
      setIsSeeding(false);
    }
  };


  useEffect(() => {
    if (logoUrl) setTempLogoUrl(logoUrl);
    if (heroImageUrl) setTempHeroImageUrl(heroImageUrl);
  }, [logoUrl, heroImageUrl]);
  
  const handleSaveImages = async () => {
    let finalLogoUrl = tempLogoUrl;
    if (logoFile) {
        finalLogoUrl = await fileToDataUri(logoFile);
    }
    
    let finalHeroImageUrl = tempHeroImageUrl;
    if (heroImageFile) {
      finalHeroImageUrl = await fileToDataUri(heroImageFile);
    }
    
    await Promise.all([
      updateSetting('logoUrl', finalLogoUrl),
      updateSetting('heroImageUrl', finalHeroImageUrl)
    ]);

    toast({ title: "Imágenes Guardadas", description: "Las imágenes de la plataforma han sido actualizadas." });
    setLogoFile(null);
    setHeroImageFile(null);
  };

  const handleSaveBillingSettings = async () => {
    const startDay = Number(tempBillingStartDay);
    const endDay = Number(tempBillingEndDay);
    if (isNaN(startDay) || isNaN(endDay) || startDay < 1 || endDay > 28 || startDay >= endDay) {
        toast({ variant: 'destructive', title: 'Fechas inválidas', description: 'Por favor, ingresa números válidos entre 1 y 28, y asegúrate que el inicio sea menor que el fin.' });
        return;
    }
    await Promise.all([
        updateSetting('billingCycleStartDay', startDay),
        updateSetting('billingCycleEndDay', endDay)
    ]);
    toast({ title: 'Configuración de facturación guardada.' });
  };

  
  useEffect(() => {
    if (user === undefined) return;
    if (user === null || user.role !== 'admin') {
      router.push('/auth/login');
    }
  }, [user, router]);
  
  const handleDoctorStatusChange = async (doctorId: string, newStatus: 'active' | 'inactive') => {
      await firestoreService.updateDoctorStatus(doctorId, newStatus);
      fetchData();
  };
  
    const handleSaveDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const password = formData.get('doc-password') as string;
        
        if (!editingDoctor && !password) {
            toast({ variant: 'destructive', title: 'Contraseña Requerida', description: 'Debe establecer una contraseña para los nuevos médicos.' });
            return;
        }
        
        const dataToValidate = {
            name: formData.get('doc-name') as string,
            email: formData.get('doc-email') as string,
            password: password,
            confirmPassword: formData.get('doc-confirm-password') as string,
            specialty: formData.get('doc-specialty') as string,
            city: formData.get('doc-city') as string,
            address: formData.get('doc-address') as string,
            sellerId: formData.get('doc-seller') as string,
            slotDuration: parseInt(formData.get('doc-slot-duration') as string, 10),
            consultationFee: parseInt(formData.get('doc-consultation-fee') as string, 10),
        };

        const result = DoctorFormSchema.safeParse(dataToValidate);

        if (!result.success) {
            const errorMessage = result.error.errors.map(err => err.message).join(' ');
            toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
            return;
        }

        const { name, email, specialty, city, address, sellerId, slotDuration, consultationFee } = result.data;
        const sellerIdValue = sellerId === 'null' || !sellerId ? null : sellerId;

        if (editingDoctor) {
            const updatedDoctorData: Partial<Doctor> = {
                name, email, specialty, city, address,
                sellerId: sellerIdValue,
                slotDuration,
                consultationFee,
            };
            if (result.data.password) {
              updatedDoctorData.password = result.data.password;
            }
            await firestoreService.updateDoctor(editingDoctor.id, updatedDoctorData);
            toast({ title: "Médico Actualizado", description: `El perfil de ${name} ha sido guardado.` });
        } else {
            const joinDate = new Date();
            const paymentDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
            if (joinDate.getDate() < 15) {
                paymentDate.setMonth(paymentDate.getMonth() + 1);
            } else {
                paymentDate.setMonth(paymentDate.getMonth() + 2);
            }

            const newDoctorData: Omit<Doctor, 'id'> = {
                name, email, specialty, city, address,
                password: result.data.password!,
                sellerId: sellerIdValue,
                cedula: '',
                sector: '',
                rating: 0,
                reviewCount: 0,
                profileImage: 'https://placehold.co/400x400.png',
                bannerImage: 'https://placehold.co/1200x400.png',
                aiHint: 'doctor portrait',
                description: '',
                services: [],
                bankDetails: [],
                slotDuration,
                consultationFee,
                schedule: {
                    monday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    tuesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    wednesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    thursday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    friday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
                    saturday: { active: false, slots: [] },
                    sunday: { active: false, slots: [] },
                },
                status: 'active',
                lastPaymentDate: joinDate.toISOString().split('T')[0],
                whatsapp: '',
                lat: 0, lng: 0,
                joinDate: joinDate.toISOString().split('T')[0],
                subscriptionStatus: 'active',
                nextPaymentDate: paymentDate.toISOString().split('T')[0],
                coupons: [],
                expenses: [],
            };
            await firestoreService.addDoctor(newDoctorData);
            toast({ title: 'Médico Registrado', description: `El Dr. ${name} ha sido añadido al sistema.` });
        }
        fetchData();
        setIsDoctorDialogOpen(false);
        setEditingDoctor(null);
  };

  const handleOpenDoctorDialog = (doctor: Doctor | null) => {
    setEditingDoctor(doctor);
    setIsDoctorDialogOpen(true);
  };

  const handleViewDoctorDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailDialogOpen(true);
  };
  
    const handleSaveSeller = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;

        if (!editingSeller && !password) {
            toast({ variant: 'destructive', title: 'Contraseña Requerida', description: 'Debe establecer una contraseña para las nuevas vendedoras.' });
            return;
        }

        const dataToValidate = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: password,
            confirmPassword: formData.get('confirmPassword') as string,
            commission: parseFloat(formData.get('commission') as string),
        };

        const result = SellerFormSchema.safeParse(dataToValidate);

        if (!result.success) {
            const errorMessage = result.error.errors.map(err => err.message).join(' ');
            toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
            return;
        }

        const { name, email, commission } = result.data;
        const commissionRate = commission / 100;

        if (editingSeller) {
            const updatedSellerData: Partial<Seller> = { name, email, commissionRate };
            if (result.data.password) {
                updatedSellerData.password = result.data.password;
            }
            await firestoreService.updateSeller(editingSeller.id, updatedSellerData);
            toast({ title: "Vendedora Actualizada", description: `El perfil de ${name} ha sido guardado.` });
        } else {
            const newSellerData: Omit<Seller, 'id'> = {
                name,
                email,
                password: result.data.password!,
                commissionRate,
                phone: '',
                profileImage: 'https://placehold.co/400x400.png',
                referralCode: `REF${Date.now()}`,
                bankDetails: [],
            };
            await firestoreService.addSeller(newSellerData);
            toast({ title: "Vendedora Registrada", description: `El perfil de ${name} ha sido creado.` });
        }
        fetchData();
        setIsSellerDialogOpen(false);
        setEditingSeller(null);
  };
  
  const handleOpenDeleteDialog = (itemType: 'doctor' | 'seller' | 'patient' | 'expense' | 'city' | 'specialty' | 'coupon' | 'bank' | 'marketing', item: any) => {
    setItemToDelete({ type: itemType, data: item });
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    const { type, data } = itemToDelete;
    
    try {
        switch (type) {
        case 'doctor':
            await firestoreService.deleteDoctor(data.id);
            toast({ title: "Médico Eliminado", description: `El perfil de ${data.name} ha sido eliminado.`});
            break;
        case 'seller':
            await firestoreService.deleteSeller(data.id);
            toast({ title: "Vendedora Eliminada", description: `El perfil de ${data.name} ha sido eliminado.`});
            break;
        case 'patient':
            await firestoreService.deletePatient(data.id);
            toast({ title: "Paciente Eliminado", description: `El perfil de ${data.name} ha sido eliminado.`});
            break;
        case 'expense':
            await deleteListItem('companyExpenses', data.id);
            toast({ title: "Gasto Eliminado", description: `El gasto "${data.description}" ha sido eliminado.`});
            break;
        case 'city':
            await deleteListItem('cities', data);
            toast({ title: "Ciudad Eliminada", description: `La ciudad "${data}" ha sido eliminada.`});
            break;
        case 'specialty':
            await deleteListItem('specialties', data);
            toast({ title: "Especialidad Eliminada", description: `La especialidad "${data}" ha sido eliminada.`});
            break;
        case 'coupon':
            await deleteListItem('coupons', data.id);
            toast({ title: "Cupón Eliminado", description: `El cupón "${data.code}" ha sido eliminado.`});
            break;
        case 'bank':
            await deleteListItem('companyBankDetails', data.id);
            toast({ title: "Cuenta Bancaria Eliminada", description: `La cuenta de ${data.bank} ha sido eliminada.`});
            break;
        case 'marketing':
            await firestoreService.deleteMarketingMaterial(data.id);
            toast({ title: "Material de Marketing Eliminado", description: `El material "${data.title}" ha sido eliminado.`});
            break;
        }
    } catch(err) {
        toast({ variant: 'destructive', title: "Error al eliminar", description: "No se pudo eliminar el elemento." });
    } finally {
        fetchData();
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    }
  };

  const handleInitiatePayment = (seller: Seller) => {
    const activeReferred = doctors.filter(d => d.sellerId === seller.id && d.status === 'active');
    const pendingCommission = activeReferred.reduce((sum, doc) => {
        const fee = cityFeesMap.get(doc.city) || 0;
        return sum + (fee * seller.commissionRate);
    }, 0);
    const currentPeriod = format(new Date(), 'LLLL yyyy', { locale: es });

    setManagingSeller(seller);
    setPaymentAmount(pendingCommission);
    setPaymentPeriod(currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1));
    
    setIsRegisterPaymentDialogOpen(true);
  };
  
  const handleRegisterPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dataToValidate = {
        transactionId: formData.get('transactionId') as string,
        paymentProof: paymentProofFile,
    };

    const result = SellerPaymentFormSchema.safeParse(dataToValidate);

    if (!managingSeller || !result.success) {
        const errorMessage = result.success ? "Faltan datos de la vendedora." : result.error.errors.map(err => err.message).join(' ');
        toast({ variant: "destructive", title: "Errores de Validación", description: errorMessage });
        return;
    }
    
    if (!paymentProofFile) {
        toast({ variant: "destructive", title: "Archivo requerido", description: "Por favor, sube un comprobante de pago."});
        return;
    }

    const { transactionId } = result.data;
    
    const includedDoctorsWithCommission = doctors
        .filter(d => d.sellerId === managingSeller.id && d.status === 'active')
        .map(doc => ({
            id: doc.id,
            name: doc.name,
            commissionAmount: (cityFeesMap.get(doc.city) || 0) * managingSeller.commissionRate
        }));

    const proofUrl = await fileToDataUri(paymentProofFile);

    const newPayment: Omit<SellerPayment, 'id'> = {
      sellerId: managingSeller.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      period: paymentPeriod,
      includedDoctors: includedDoctorsWithCommission,
      paymentProofUrl: proofUrl,
      transactionId,
    };

    await firestoreService.addSellerPayment(newPayment);
    toast({ title: "Pago Registrado", description: `Se ha registrado el pago para ${managingSeller.name}.` });
    fetchData();
    setIsRegisterPaymentDialogOpen(false);
  };
  
  const handleRegisterPaymentDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
        setPaymentProofFile(null);
    }
    setIsRegisterPaymentDialogOpen(isOpen);
  };

  const handleViewPatientDetails = (patient: Patient) => {
    setSelectedPatientForDetail(patient);
    setIsPatientDetailDialogOpen(true);
  };

  const handleOpenPatientEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setIsPatientEditDialogOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPatient) return;
    
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      cedula: formData.get('cedula') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const result = PatientFormSchema.safeParse(dataToValidate);
    
    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
        return;
    }

    const updatedPatientData: Partial<Patient> = {
      name: result.data.name,
      email: result.data.email,
      cedula: result.data.cedula || null,
      phone: result.data.phone || null,
    };
    
    if (result.data.password) {
        updatedPatientData.password = result.data.password;
    }
    
    await firestoreService.updatePatient(editingPatient.id, updatedPatientData);
    toast({ title: "Paciente Actualizado", description: `La información de ${updatedPatientData.name} ha sido guardada.` });
    fetchData();
    setIsPatientEditDialogOpen(false);
    setEditingPatient(null);
  };


  const handleViewProof = (url: string | null) => {
    if (url) {
      setViewingProofUrl(url);
      setIsProofDialogOpen(true);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    const payment = doctorPayments.find(p => p.id === paymentId);
    if (!payment) return;

    const doctorToUpdate = await firestoreService.getDoctor(payment.doctorId);
    if (!doctorToUpdate) {
        toast({ variant: "destructive", title: "Error", description: "No se encontró al médico asociado a este pago." });
        return;
    }
    
    const currentCycleDate = new Date(doctorToUpdate.nextPaymentDate + 'T00:00:00Z');
    let newNextPaymentDate;

    if (new Date() > currentCycleDate) {
        // Paying late, start next cycle from today's month
        const today = new Date();
        newNextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    } else {
        // Paying on time, advance from the current due date
        newNextPaymentDate = new Date(currentCycleDate.getFullYear(), currentCycleDate.getMonth() + 1, 1);
    }
    
    await firestoreService.updateDoctorPaymentStatus(paymentId, 'Paid');
    await firestoreService.updateDoctor(payment.doctorId, { 
      lastPaymentDate: payment.date,
      subscriptionStatus: 'active',
      status: 'active',
      nextPaymentDate: newNextPaymentDate.toISOString().split('T')[0],
     });
    
    toast({
      title: "Pago Aprobado",
      description: `La suscripción del Dr. ${doctorToUpdate.name} ha sido renovada.`,
    });
    fetchData();
  };

  const handleRejectPayment = async (paymentId: string) => {
    const payment = doctorPayments.find(p => p.id === paymentId);
    if (!payment) return;

    await firestoreService.updateDoctorPaymentStatus(paymentId, 'Rejected');
    await firestoreService.updateDoctor(payment.doctorId, {
        subscriptionStatus: 'inactive'
    });
    
    toast({
      variant: "destructive",
      title: "Pago Rechazado",
      description: "El pago ha sido marcado como 'Rechazado' y la suscripción del médico permanece inactiva.",
    });
    fetchData();
  };
  
  const handleUpdateTicketStatus = async (ticketId: string, status: 'abierto' | 'cerrado') => {
    await firestoreService.updateSupportTicket(ticketId, { status });
    toast({ title: "Ticket Actualizado", description: `El ticket ha sido marcado como "${status}".` });
    fetchData();
    if (status === 'cerrado') {
      setIsSupportDetailDialogOpen(false);
    }
  };
  
  const handleViewTicket = (ticket: AdminSupportTicket) => {
    setSelectedTicket(ticket);
    setIsSupportDetailDialogOpen(true);
  };
  
  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        sender: 'admin',
        text: replyMessage.trim(),
    };

    await firestoreService.addMessageToSupportTicket(selectedTicket.id, newMessage);
    
    const updatedTicket = {
        ...selectedTicket,
        messages: [
            ...(selectedTicket.messages || []),
            { ...newMessage, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() }
        ]
    };
    setSelectedTicket(updatedTicket);

    setReplyMessage("");
    fetchData();
  };

  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as CompanyExpense['category'],
    };
    
    const result = ExpenseFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
        return;
    }

    const { date, description, amount, category } = result.data;

    if (editingExpense) {
        await updateListItem('companyExpenses', editingExpense.id, { id: editingExpense.id, date, description, amount, category });
        toast({ title: "Gasto Actualizado", description: "El gasto ha sido modificado exitosamente." });
    } else {
        await addListItem('companyExpenses', { date, description, amount, category });
        toast({ title: "Gasto Registrado", description: "El nuevo gasto ha sido agregado." });
    }
    
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };
  
  const handleSaveCity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCity) return;
    
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
        name: formData.get('city-name') as string,
        subscriptionFee: parseFloat(formData.get('city-fee') as string),
    };
    
    const result = CityFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        toast({ variant: "destructive", title: "Datos inválidos", description: result.error.errors.map(e => e.message).join(' ') });
        return;
    }

    const cityObject: City = result.data;

    if (editingCity.originalName) {
        await updateListItem('cities', editingCity.originalName, cityObject);
        toast({ title: "Ciudad Actualizada" });
    } else {
        await addListItem('cities', cityObject);
        toast({ title: "Ciudad Agregada" });
    }
    setIsCityDialogOpen(false);
    setEditingCity(null);
  };

  const handleSaveSpecialty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSpecialty) return;
    
    const newName = (e.currentTarget.elements.namedItem('specialty-name') as HTMLInputElement).value;
    const result = NameSchema.safeParse(newName);
    
    if (!result.success) {
        toast({ variant: "destructive", title: "Nombre requerido", description: result.error.errors.map(e => e.message).join(' ') });
        return;
    }

    if (editingSpecialty.originalName) {
        await updateListItem('specialties', editingSpecialty.originalName, newName);
        toast({ title: "Especialidad Actualizada" });
    } else {
        await addListItem('specialties', newName);
        toast({ title: "Especialidad Agregada" });
    }
    setIsSpecialtyDialogOpen(false);
    setEditingSpecialty(null);
  };

  const handleSaveCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dataToValidate = {
      code: formData.get('code') as string,
      discountType: formData.get('discountType') as 'percentage' | 'fixed',
      value: parseFloat(formData.get('value') as string),
      scope: formData.get('scope') as string,
    };

    const result = CouponFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
        return;
    }

    const { code, discountType, value, scope } = result.data;
    
    if (editingCoupon) {
        await updateListItem('coupons', editingCoupon.id, { id: editingCoupon.id, code, discountType, value, scope });
        toast({ title: "Cupón Actualizado" });
    } else {
        await addListItem('coupons', { code, discountType, value, scope });
        toast({ title: "Cupón Creado" });
    }
    setIsCouponDialogOpen(false);
    setEditingCoupon(null);
  };

  const handleSaveBankDetail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
        bank: formData.get('bankName') as string,
        accountHolder: formData.get('accountHolder') as string,
        idNumber: formData.get('idNumber') as string,
        accountNumber: formData.get('accountNumber') as string,
        description: formData.get('description') as string,
    };
    
    const result = BankDetailFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
        return;
    }

    const newBankData = result.data;
    
    if (editingCompanyBankDetail) {
        await updateListItem('companyBankDetails', editingCompanyBankDetail.id, { id: editingCompanyBankDetail.id, ...newBankData });
        toast({ title: "Cuenta Actualizada" });
    } else {
        await addListItem('companyBankDetails', newBankData);
        toast({ title: "Cuenta Agregada" });
    }
    setIsCompanyBankDetailDialogOpen(false);
    setEditingCompanyBankDetail(null);
  };

  const handleSaveMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSavingMaterial(true);
      const formData = new FormData(e.currentTarget);

      let finalUrl = formData.get('url') as string;
      let finalThumbnailUrl = formData.get('thumbnailUrl') as string;

      try {
          if (materialFile) {
              finalUrl = await fileToDataUri(materialFile);
          }
          if (thumbnailFile) {
              finalThumbnailUrl = await fileToDataUri(thumbnailFile);
          }
          
          const dataToValidate = {
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              type: formData.get('type') as MarketingMaterial['type'],
              url: finalUrl,
              thumbnailUrl: finalThumbnailUrl || (finalUrl.startsWith('data:image') ? finalUrl : 'https://placehold.co/600x400.png'),
          };

          const result = MarketingMaterialSchema.safeParse(dataToValidate);
          if (!result.success) {
              toast({ variant: 'destructive', title: 'Errores de Validación', description: result.error.errors.map(err => err.message).join(' ') });
              return;
          }
          
          if (editingMaterial) {
              await firestoreService.updateMarketingMaterial(editingMaterial.id, result.data);
              toast({ title: "Material Actualizado", description: "El material de marketing ha sido modificado." });
          } else {
              await firestoreService.addMarketingMaterial(result.data);
              toast({ title: "Material Agregado", description: "El nuevo material de marketing está disponible." });
          }
          
          fetchData();
          setIsMarketingDialogOpen(false);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error al procesar archivo', description: 'No se pudo leer el archivo seleccionado.' });
      } finally {
          setIsSavingMaterial(false);
      }
  };

  const handleBeautySpecialtyChange = async (specialty: string, checked: boolean) => {
    const currentList = beautySpecialties || [];
    const newList = checked
      ? [...currentList, specialty]
      : currentList.filter((s) => s !== specialty);
    
    await updateSetting('beautySpecialties', newList);
    toast({ title: "Especialidades de Belleza Actualizadas" });
  };
  
    const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      const backupData = await firestoreService.exportDatabase();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suma-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Exportación Exitosa", description: "El respaldo de la base de datos se ha descargado." });
    } catch (error) {
      console.error("Error exporting database:", error);
      toast({ variant: "destructive", title: "Error de Exportación" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setIsImportConfirmOpen(true);
    }
  };

  const handleImportDatabase = async () => {
    if (!importFile) return;
    setIsImportConfirmOpen(false);
    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') throw new Error("File could not be read");
          const data = JSON.parse(text);
          await firestoreService.importDatabase(data);
          toast({ title: "Importación Exitosa", description: "Los datos han sido restaurados. La página se recargará." });
          fetchData();
        } catch (err) {
          console.error("Error processing import file:", err);
          toast({ variant: "destructive", title: "Error de Importación", description: "El archivo JSON es inválido o está corrupto." });
        } finally {
          setIsImporting(false);
          setImportFile(null);
          if(importFileInputRef.current) importFileInputRef.current.value = "";
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
      console.error("Error importing database:", error);
      toast({ variant: "destructive", title: "Error de Importación", description: "No se pudo leer el archivo seleccionado." });
      setIsImporting(false);
      setImportFile(null);
    }
  };

  const { filteredDoctorPayments, filteredSellerPayments, filteredCompanyExpenses } = useMemo(() => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    const sortByDate = (items: any[], dateField: 'date' | 'paymentDate') => {
        return [...items].sort((a, b) => {
            if (!a[dateField] || !b[dateField]) return 0;
            return new Date(b[dateField] + 'T00:00:00').getTime() - new Date(a[dateField] + 'T00:00:00').getTime();
        });
    };
    
    if (timeRange === 'all') {
      return {
        filteredDoctorPayments: sortByDate(doctorPayments, 'date'),
        filteredSellerPayments: sortByDate(sellerPayments, 'paymentDate'),
        filteredCompanyExpenses: sortByDate(companyExpenses, 'date'),
      };
    }
    
    switch (timeRange) {
        case 'today':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
        case 'week':
            startDate = startOfWeek(now, { locale: es });
            endDate = endOfWeek(now, { locale: es });
            break;
        case 'year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        case 'month':
        default:
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
    }

    const filterByDateField = (items: any[], dateField: 'date' | 'paymentDate') => {
        const filtered = items.filter(item => {
            if (!item[dateField]) return false;
            const itemDate = new Date(item[dateField] + 'T00:00:00');
            return itemDate >= startDate && itemDate <= endDate;
        });
        return sortByDate(filtered, dateField);
    };

    return {
      filteredDoctorPayments: filterByDateField(doctorPayments, 'date'),
      filteredSellerPayments: filterByDateField(sellerPayments, 'paymentDate'),
      filteredCompanyExpenses: filterByDateField(companyExpenses, 'date'),
    };
  }, [doctorPayments, sellerPayments, companyExpenses, timeRange]);

  const globalStats = useMemo(() => {
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.status === 'active').length;
    const totalSellers = sellers.length;
    const totalPatients = patients.length;
    
    const totalRevenue = doctorPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const commissionsPaid = sellerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpensesValue = companyExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
        totalDoctors,
        activeDoctors,
        totalSellers,
        totalPatients,
        netProfit: totalRevenue - commissionsPaid - totalExpensesValue,
    }
  }, [doctors, sellers, patients, doctorPayments, sellerPayments, companyExpenses]);

  const timeRangedStats = useMemo(() => {
    const totalRevenue = filteredDoctorPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const commissionsPaid = filteredSellerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredCompanyExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
        totalRevenue,
        commissionsPaid,
        totalExpenses,
        netProfit: totalRevenue - commissionsPaid - totalExpenses,
    }
  }, [filteredDoctorPayments, filteredSellerPayments, filteredCompanyExpenses]);

  const paginatedCompanyExpenses = useMemo(() => {
    if (expenseItemsPerPage === -1) return filteredCompanyExpenses;
    const startIndex = (expenseCurrentPage - 1) * expenseItemsPerPage;
    const endIndex = startIndex + expenseItemsPerPage;
    return filteredCompanyExpenses.slice(startIndex, endIndex);
  }, [filteredCompanyExpenses, expenseCurrentPage, expenseItemsPerPage]);

  const totalExpensePages = useMemo(() => {
    if (expenseItemsPerPage === -1) return 1;
    return Math.ceil(filteredCompanyExpenses.length / expenseItemsPerPage);
  }, [filteredCompanyExpenses, expenseItemsPerPage]);


  const cityFeesMap = useMemo(() => new Map(cities.map(c => [c.name, c.subscriptionFee])), [cities]);

  const pendingDoctorPayments = useMemo(() => {
    return doctorPayments.filter(p => p.status === 'Pending');
  }, [doctorPayments]);

  const pendingToPayThisMonth = useMemo(() => {
    const now = new Date();
    const endOfThisMonth = endOfMonth(now);

    return doctors.filter(doc => {
      if (doc.subscriptionStatus === 'pending_payment') {
        return false; // They already reported a payment, so they are not "pending to pay"
      }
      const nextPayment = new Date(doc.nextPaymentDate + 'T00:00:00');
      // Doctors whose payment date is on or before the end of this month are included.
      return nextPayment <= endOfThisMonth;
    }).sort((a,b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
  }, [doctors]);

  const paymentsByMonth = useMemo(() => {
    const grouped: { [month: string]: DoctorPayment[] } = {};
    const sortedPayments = [...doctorPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedPayments.forEach(payment => {
        const monthKey = format(new Date(payment.date + 'T00:00:00'), 'LLLL yyyy', { locale: es });
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(payment);
    });

    return grouped;
  }, [doctorPayments]);

  const handleGenerateAdminFinanceReport = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("Reporte Financiero de SUMA", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy')}`, 105, 28, { align: 'center' });
    doc.text(`Período del Reporte: ${timeRangeLabels[timeRange]}`, 105, 34, { align: 'center' });

    doc.setFontSize(16);
    doc.text("Resumen General", 14, 50);
    doc.line(14, 52, 196, 52);

    doc.setFontSize(12);
    const summaryY = 60;
    const summaryData = [
        ["Ingresos Totales (Suscripciones):", `$${timeRangedStats.totalRevenue.toFixed(2)}`],
        ["Comisiones Pagadas a Vendedoras:", `$${timeRangedStats.commissionsPaid.toFixed(2)}`],
        ["Gastos Operativos:", `$${timeRangedStats.totalExpenses.toFixed(2)}`],
    ];
    summaryData.forEach((row, index) => {
        doc.text(row[0], 16, summaryY + (index * 8));
        doc.text(row[1], 194, summaryY + (index * 8), { align: 'right' });
    });
    
    doc.setFont("helvetica", "bold");
    doc.line(14, summaryY + (summaryData.length * 8) - 2, 196, summaryY + (summaryData.length * 8) - 2);
    doc.text("Beneficio Neto:", 16, summaryY + (summaryData.length * 8) + 5);
    doc.text(`$${timeRangedStats.netProfit.toFixed(2)}`, 194, summaryY + (summaryData.length * 8) + 5, { align: 'right' });
    doc.setFont("helvetica", "normal");
    
    let currentY = summaryY + (summaryData.length * 8) + 20;

    // Incomes
    doc.setFontSize(16);
    doc.text("Detalle de Ingresos (Suscripciones Pagadas)", 14, currentY);
    doc.line(14, currentY + 2, 196, currentY + 2);
    currentY += 10;
    const incomeHead = [['Fecha', 'Médico', 'ID Transacción', 'Monto']];
    const incomeBody = filteredDoctorPayments
        .filter(p => p.status === 'Paid')
        .map(p => [
            format(new Date(p.date + 'T00:00:00'), 'dd/MM/yyyy'),
            p.doctorName,
            p.transactionId,
            `$${p.amount.toFixed(2)}`
        ]);
    autoTable(doc, { startY: currentY, head: incomeHead, body: incomeBody, theme: 'striped' });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Commissions
    doc.setFontSize(16);
    doc.text("Detalle de Comisiones Pagadas", 14, currentY);
    doc.line(14, currentY + 2, 196, currentY + 2);
    currentY += 10;
    const commissionHead = [['Fecha', 'Vendedora', 'Período', 'Monto']];
    const commissionBody = filteredSellerPayments.map(p => [
        format(new Date(p.paymentDate + 'T00:00:00'), 'dd/MM/yyyy'),
        sellers.find(s => s.id === p.sellerId)?.name || 'N/A',
        p.period,
        `$${p.amount.toFixed(2)}`
    ]);
    autoTable(doc, { startY: currentY, head: commissionHead, body: commissionBody, theme: 'striped' });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Expenses
    doc.setFontSize(16);
    doc.text("Detalle de Gastos Operativos", 14, currentY);
    doc.line(14, currentY + 2, 196, currentY + 2);
    currentY += 10;
    const expenseHead = [['Fecha', 'Descripción', 'Categoría', 'Monto']];
    const expenseBody = filteredCompanyExpenses.map(e => [
        format(new Date(e.date + 'T00:00:00'), 'dd/MM/yyyy'),
        e.description,
        e.category.charAt(0).toUpperCase() + e.category.slice(1),
        `$${e.amount.toFixed(2)}`
    ]);
    autoTable(doc, { startY: currentY, head: expenseHead, body: expenseBody, theme: 'striped' });
    
    doc.save(`Reporte_Financiero_SUMA_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12">
           <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
           </div>
           <div className="mt-8">
             <Skeleton className="h-96 w-full" />
           </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 bg-muted/40">
          <div className="container py-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-headline mb-2">Panel de Administrador</h1>
              <p className="text-muted-foreground">Bienvenido, {user.name}. Gestiona todo el sistema SUMA desde aquí.</p>
            </div>
            
             <>
                  {currentTab === 'overview' && (
                  <div className="mt-6">
                       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total de Médicos</CardTitle>
                                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{globalStats.totalDoctors}</div>
                                    <p className="text-xs text-muted-foreground">{globalStats.activeDoctors} activos</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total de Vendedoras</CardTitle>
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{globalStats.totalSellers}</div>
                                    <p className="text-xs text-muted-foreground">Gestionando referidos</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{globalStats.totalPatients}</div>
                                    <p className="text-xs text-muted-foreground">Registrados en la plataforma</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                                    <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${globalStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${globalStats.netProfit.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">Ingresos - Egresos (Global)</p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="mt-6 text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                            <BarChartIcon className="h-12 w-12" />
                            <h3 className="text-xl font-semibold">Gráficos y Analíticas</h3>
                            <p>Más analíticas detalladas sobre el crecimiento y uso de la plataforma estarán disponibles aquí.</p>
                        </div>
                  </div>
                  )}
  
                  {currentTab === 'doctors' && (
                  <div className="mt-6">
                      <Card>
                          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                  <CardTitle>Gestión de Médicos</CardTitle>
                                  <CardDescription>Visualiza, edita y gestiona el estado de todos los médicos en la plataforma.</CardDescription>
                              </div>
                              <Button onClick={() => handleOpenDoctorDialog(null)}>
                                  <PlusCircle className="mr-2"/> Registrar Médico
                              </Button>
                          </CardHeader>
                          <CardContent>
                              <div className="hidden md:block">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead>Médico</TableHead>
                                              <TableHead>Especialidad</TableHead>
                                              <TableHead>Ubicación</TableHead>
                                              <TableHead>Referido por</TableHead>
                                              <TableHead>Estado</TableHead>
                                              <TableHead className="text-right">Acciones</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {doctors.map((doctor) => (
                                              <TableRow key={doctor.id}>
                                                  <TableCell className="font-medium flex items-center gap-3">
                                                      <Avatar className="h-9 w-9">
                                                          <AvatarImage src={doctor.profileImage} alt={doctor.name} />
                                                          <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                                                      </Avatar>
                                                      <div>
                                                          <p>{doctor.name}</p>
                                                          <p className="text-xs text-muted-foreground">{doctor.email}</p>
                                                      </div>
                                                  </TableCell>
                                                  <TableCell>{doctor.specialty}</TableCell>
                                                  <TableCell>{doctor.city}</TableCell>
                                                  <TableCell>{sellers.find(s => s.id === doctor.sellerId)?.name || 'SUMA'}</TableCell>
                                                  <TableCell>
                                                      <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' ? 'bg-green-600 text-white' : 'bg-destructive')}>
                                                          {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                                      </Badge>
                                                  </TableCell>
                                                  <TableCell className="text-right flex items-center justify-end gap-2">
                                                      <Switch 
                                                          checked={doctor.status === 'active'} 
                                                          onCheckedChange={(checked) => handleDoctorStatusChange(doctor.id, checked ? 'active' : 'inactive')}
                                                      />
                                                      <Button variant="outline" size="icon" onClick={() => handleViewDoctorDetails(doctor)}><Eye className="h-4 w-4" /></Button>
                                                      <Button variant="outline" size="icon" onClick={() => handleOpenDoctorDialog(doctor)}><Pencil className="h-4 w-4" /></Button>
                                                      <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog('doctor', doctor)}><Trash2 className="h-4 w-4" /></Button>
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                      </TableBody>
                                  </Table>
                              </div>
                              <div className="space-y-4 md:hidden">
                                  {doctors.map((doctor) => (
                                      <div key={doctor.id} className="p-4 border rounded-lg space-y-4">
                                          <div className="flex items-start justify-between gap-4">
                                              <div className="flex items-center gap-3">
                                                  <Avatar className="h-10 w-10">
                                                      <AvatarImage src={doctor.profileImage} alt={doctor.name} />
                                                      <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                      <p className="font-semibold">{doctor.name}</p>
                                                      <p className="text-xs text-muted-foreground">{doctor.email}</p>
                                                  </div>
                                              </div>
                                              <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' ? 'bg-green-600 text-white' : 'bg-destructive')}>
                                                  {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                              </Badge>
                                          </div>
  
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div>
                                                  <p className="text-xs text-muted-foreground">Especialidad</p>
                                                  <p>{doctor.specialty}</p>
                                              </div>
                                              <div>
                                                  <p className="text-xs text-muted-foreground">Ubicación</p>
                                                  <p>{doctor.city}</p>
                                              </div>
                                              <div className="col-span-2">
                                                  <p className="text-xs text-muted-foreground">Referido por</p>
                                                  <p>{sellers.find(s => s.id === doctor.sellerId)?.name || 'SUMA'}</p>
                                              </div>
                                          </div>
  
                                          <Separator />
  
                                          <div className="flex items-center justify-between gap-4">
                                              <div className="flex items-center gap-2">
                                                  <Label htmlFor={`switch-${doctor.id}`} className="text-sm font-medium">Estado</Label>
                                                  <Switch 
                                                  id={`switch-${doctor.id}`}
                                                  checked={doctor.status === 'active'} 
                                                  onCheckedChange={(checked) => handleDoctorStatusChange(doctor.id, checked ? 'active' : 'inactive')}
                                              />
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <Button variant="outline" size="icon" onClick={() => handleViewDoctorDetails(doctor)}><Eye className="h-4 w-4" /></Button>
                                                  <Button variant="outline" size="icon" onClick={() => handleOpenDoctorDialog(doctor)}><Pencil className="h-4 w-4" /></Button>
                                                  <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog('doctor', doctor)}><Trash2 className="h-4 w-4" /></Button>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                                  {doctors.length === 0 && <p className="text-center text-muted-foreground py-8">No hay médicos registrados.</p>}
                              </div>
                          </CardContent>
                      </Card>
                  </div>
                  )}
                  
                  {currentTab === 'sellers' && (
                   <div className="mt-6">
                      <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <CardTitle>Gestión de Vendedoras</CardTitle>
                              <CardDescription>Registra, visualiza y gestiona a todas las vendedoras del sistema.</CardDescription>
                            </div>
                             <Button onClick={() => { setEditingSeller(null); setIsSellerDialogOpen(true); }}>
                                <PlusCircle className="mr-2"/> Registrar Vendedora
                             </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="hidden md:block">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Vendedora</TableHead>
                                          <TableHead>Referidos (Activos)</TableHead>
                                          <TableHead>Comisión</TableHead>
                                          <TableHead>Comisión Pendiente</TableHead>
                                          <TableHead>Total Pagado</TableHead>
                                          <TableHead className="text-right">Acciones</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {sellers.map((seller) => {
                                        const sellerDoctors = doctors.filter(d => d.sellerId === seller.id);
                                        const activeDoctors = sellerDoctors.filter(d => d.status === 'active');
                                        const activeDoctorsCount = activeDoctors.length;
                                        
                                        const currentPeriod = format(new Date(), 'LLLL yyyy', { locale: es }).toLowerCase();
                                        const hasBeenPaidThisPeriod = sellerPayments.some(p => p.sellerId === seller.id && p.period.toLowerCase() === currentPeriod);
                                        
                                        const pendingCommission = hasBeenPaidThisPeriod ? 0 : activeDoctors.reduce((sum, doc) => {
                                            const fee = cityFeesMap.get(doc.city) || 0;
                                            return sum + (fee * seller.commissionRate);
                                        }, 0);
                                        const totalPaid = sellerPayments.filter(p => p.sellerId === seller.id).reduce((sum, p) => sum + p.amount, 0);
                                        
                                        return (
                                          <TableRow key={seller.id}>
                                              <TableCell className="font-medium flex items-center gap-3">
                                                  <Avatar className="h-9 w-9">
                                                      <AvatarImage src={seller.profileImage} alt={seller.name} />
                                                      <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                      <p>{seller.name}</p>
                                                      <p className="text-xs text-muted-foreground">{seller.email}</p>
                                                  </div>
                                              </TableCell>
                                              <TableCell>{sellerDoctors.length} ({activeDoctorsCount})</TableCell>
                                              <TableCell>{(seller.commissionRate * 100).toFixed(0)}%</TableCell>
                                              <TableCell className="font-mono text-amber-600 font-semibold">${pendingCommission.toFixed(2)}</TableCell>
                                              <TableCell className="font-mono text-green-600 font-semibold">${totalPaid.toFixed(2)}</TableCell>
                                              <TableCell className="text-right flex items-center justify-end gap-2">
                                                  <Button variant="outline" size="sm" onClick={() => handleInitiatePayment(seller)} disabled={pendingCommission <= 0}>
                                                      <Wallet className="mr-2 h-4 w-4" /> Pagar Comisión
                                                  </Button>
                                                  <Button variant="outline" size="icon" onClick={() => { setEditingSeller(seller); setIsSellerDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                                  <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog('seller', seller)}><Trash2 className="h-4 w-4" /></Button>
                                              </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                              </Table>
                            </div>
                            <div className="space-y-4 md:hidden">
                                  {sellers.map((seller) => {
                                      const sellerDoctors = doctors.filter(d => d.sellerId === seller.id);
                                      const activeDoctors = sellerDoctors.filter(d => d.status === 'active');
                                      const activeDoctorsCount = activeDoctors.length;
                                      
                                      const currentPeriod = format(new Date(), 'LLLL yyyy', { locale: es }).toLowerCase();
                                      const hasBeenPaidThisPeriod = sellerPayments.some(p => p.sellerId === seller.id && p.period.toLowerCase() === currentPeriod);
  
                                      const pendingCommission = hasBeenPaidThisPeriod ? 0 : activeDoctors.reduce((sum, doc) => {
                                          const fee = cityFeesMap.get(doc.city) || 0;
                                          return sum + (fee * seller.commissionRate);
                                      }, 0);
                                      const totalPaid = sellerPayments.filter(p => p.sellerId === seller.id).reduce((sum, p) => sum + p.amount, 0);
                                      
                                      return (
                                          <div key={seller.id} className="p-4 border rounded-lg space-y-4">
                                              <div className="flex items-center gap-3 mb-2">
                                                  <Avatar className="h-10 w-10">
                                                      <AvatarImage src={seller.profileImage} alt={seller.name} />
                                                      <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                      <p className="font-semibold">{seller.name}</p>
                                                      <p className="text-xs text-muted-foreground">{seller.email}</p>
                                                  </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-4 text-sm">
                                                  <div>
                                                      <p className="text-xs text-muted-foreground">Referidos (Activos)</p>
                                                      <p>{sellerDoctors.length} ({activeDoctorsCount})</p>
                                                  </div>
                                                  <div>
                                                      <p className="text-xs text-muted-foreground">Comisión</p>
                                                      <p>{(seller.commissionRate * 100).toFixed(0)}%</p>
                                                  </div>
                                                  <div>
                                                      <p className="text-xs text-muted-foreground">Comisión Pendiente</p>
                                                      <p className="font-mono text-amber-600 font-semibold">${pendingCommission.toFixed(2)}</p>
                                                  </div>
                                                  <div>
                                                      <p className="text-xs text-muted-foreground">Total Pagado</p>
                                                      <p className="font-mono text-green-600 font-semibold">${totalPaid.toFixed(2)}</p>
                                                  </div>
                                              </div>
                                              <Separator />
                                              <div className="flex flex-col gap-2">
                                                  <Button variant="default" size="sm" className="flex-1" onClick={() => handleInitiatePayment(seller)} disabled={pendingCommission <= 0}><Wallet className="mr-2 h-4 w-4" /> Pagar Comisión</Button>
                                                  <div className="flex gap-2">
                                                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingSeller(seller); setIsSellerDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleOpenDeleteDialog('seller', seller)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                                  {sellers.length === 0 && <p className="text-center text-muted-foreground py-8">No hay vendedoras registradas.</p>}
                              </div>
                        </CardContent>
                      </Card>
                  </div>
                  )}
                  
                  {currentTab === 'patients' && (
                   <div className="mt-6">
                       <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Pacientes</CardTitle>
                            <CardDescription>Busca y gestiona la información de los pacientes registrados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="hidden md:block">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Paciente</TableHead>
                                          <TableHead>Cédula</TableHead>
                                          <TableHead>Contacto</TableHead>
                                          <TableHead className="text-right">Acciones</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {patients.map((patient) => (
                                          <TableRow key={patient.id}>
                                              <TableCell className="font-medium">{patient.name}</TableCell>
                                              <TableCell>{patient.cedula || 'N/A'}</TableCell>
                                              <TableCell>
                                                  <p>{patient.email}</p>
                                                  <p className="text-xs text-muted-foreground">{patient.phone || 'N/A'}</p>
                                              </TableCell>
                                              <TableCell className="text-right flex items-center justify-end gap-2">
                                                  <Button variant="outline" size="icon" onClick={() => handleViewPatientDetails(patient)}><Eye className="h-4 w-4" /></Button>
                                                  <Button variant="outline" size="icon" onClick={() => handleOpenPatientEditDialog(patient)}><Pencil className="h-4 w-4" /></Button>
                                                  <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog('patient', patient)}><Trash2 className="h-4 w-4" /></Button>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                           </div>
                            <div className="space-y-4 md:hidden">
                                  {patients.map((patient) => (
                                      <div key={patient.id} className="p-4 border rounded-lg space-y-3">
                                          <div>
                                              <p className="font-semibold">{patient.name}</p>
                                              <p className="text-xs text-muted-foreground">{patient.email}</p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div>
                                                  <p className="text-xs text-muted-foreground">Cédula</p>
                                                  <p>{patient.cedula || 'N/A'}</p>
                                              </div>
                                              <div>
                                                  <p className="text-xs text-muted-foreground">Teléfono</p>
                                                  <p>{patient.phone || 'N/A'}</p>
                                              </div>
                                          </div>
                                          <Separator />
                                          <div className="flex justify-end gap-2">
                                              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewPatientDetails(patient)}><Eye className="mr-2 h-4 w-4" /> Ver</Button>
                                              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenPatientEditDialog(patient)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                              <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleOpenDeleteDialog('patient', patient)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                                          </div>
                                      </div>
                                  ))}
                                  {patients.length === 0 && <p className="text-center text-muted-foreground py-8">No hay pacientes registrados.</p>}
                              </div>
                        </CardContent>
                      </Card>
                  </div>
                  )}
  
                  {currentTab === 'finances' && (
                   <div className="mt-6">
                      <div className="space-y-6">
                          <div className="w-full">
                              <div className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
                                  <Button variant={timeRange === 'today' ? 'default' : 'outline'} onClick={() => setTimeRange('today')}>Hoy</Button>
                                  <Button variant={timeRange === 'week' ? 'default' : 'outline'} onClick={() => setTimeRange('week')}>Esta Semana</Button>
                                  <Button variant={timeRange === 'month' ? 'default' : 'outline'} onClick={() => setTimeRange('month')}>Este Mes</Button>
                                  <Button variant={timeRange === 'year' ? 'default' : 'outline'} onClick={() => setTimeRange('year')}>Este Año</Button>
                                  <Button variant={timeRange === 'all' ? 'default' : 'outline'} onClick={() => setTimeRange('all')}>Global</Button>
                              </div>
                          </div>
  
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Ingresos (Suscripciones)</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">${timeRangedStats.totalRevenue.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Comisiones Pagadas</CardTitle>
                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-amber-600">${timeRangedStats.commissionsPaid.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
                                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">${timeRangedStats.totalExpenses.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${timeRangedStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${timeRangedStats.netProfit.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p>
                                </CardContent>
                            </Card>
                        </div>
  
                        <Card>
                          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                  <CardTitle>Visión General Financiera</CardTitle>
                                  <CardDescription>Revisa el estado financiero de SUMA para {timeRangeLabels[timeRange]}.</CardDescription>
                              </div>
                              <Button onClick={handleGenerateAdminFinanceReport}>
                                  <FileDown className="mr-2"/> Descargar Reporte PDF
                              </Button>
                          </CardHeader>
                          <CardContent>
                             <FinanceChart timeRangedStats={timeRangedStats} timeRange={timeRange} />
                          </CardContent>
                        </Card>
  
                        <Card>
                            <CardHeader>
                                <CardTitle>Pagos Pendientes de Aprobación</CardTitle>
                                <CardDescription>Revisa y aprueba los pagos de suscripción reportados por los médicos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Médico</TableHead>
                                                <TableHead>Fecha Reporte</TableHead>
                                                <TableHead>Monto</TableHead>
                                                <TableHead className="text-center">Comprobante</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingDoctorPayments.length > 0 ? (
                                                pendingDoctorPayments.map((payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell className="font-medium">{payment.doctorName}</TableCell>
                                                        <TableCell>{format(new Date(payment.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                        <TableCell className="font-mono">${(payment.amount || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Button variant="outline" size="sm" onClick={() => handleViewProof(payment.paymentProofUrl)}>
                                                                <Eye className="mr-2 h-4 w-4" /> Ver
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleRejectPayment(payment.id)}><ThumbsDown className="h-4 w-4" /></Button>
                                                            <Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleApprovePayment(payment.id)}><ThumbsUp className="h-4 w-4" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center h-24">
                                                        No hay pagos pendientes de aprobación.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="space-y-4 md:hidden">
                                    {pendingDoctorPayments.length > 0 ? (
                                        pendingDoctorPayments.map((payment) => (
                                            <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                                                <div>
                                                    <p className="font-semibold">{payment.doctorName}</p>
                                                    <p className="text-sm text-muted-foreground">{format(new Date(payment.date + 'T00:00:00'), "d MMM yyyy", { locale: es })} - <span className="font-mono">${(payment.amount || 0).toFixed(2)}</span></p>
                                                </div>
                                                <Separator />
                                                <Button variant="outline" size="sm" className="w-full mb-2" onClick={() => handleViewProof(payment.paymentProofUrl)}>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver Comprobante
                                                </Button>
                                                <div className="flex gap-2">
                                                  <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleRejectPayment(payment.id)}><ThumbsDown className="mr-2 h-4 w-4" /> Rechazar</Button>
                                                  <Button size="sm" variant="outline" className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleApprovePayment(payment.id)}><ThumbsUp className="mr-2 h-4 w-4" /> Aprobar</Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            No hay pagos pendientes de aprobación.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
  
                        <Card>
                          <CardHeader>
                              <CardTitle>Suscripciones por Vencer este Mes</CardTitle>
                              <CardDescription>Lista de médicos cuya suscripción vence o ha vencido en el mes actual y no han reportado un pago.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <div className="hidden md:block">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead>Médico</TableHead>
                                              <TableHead>Ciudad</TableHead>
                                              <TableHead>Monto a Pagar</TableHead>
                                              <TableHead>Fecha de Vencimiento</TableHead>
                                              <TableHead className="text-right">Suscripción</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {pendingToPayThisMonth.length > 0 ? (
                                              pendingToPayThisMonth.map((doctor) => (
                                                  <TableRow key={doctor.id}>
                                                      <TableCell className="font-medium">{doctor.name}</TableCell>
                                                      <TableCell>{doctor.city}</TableCell>
                                                      <TableCell className="font-mono">${(cityFeesMap.get(doctor.city) || 0).toFixed(2)}</TableCell>
                                                      <TableCell>{format(new Date(doctor.nextPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                      <TableCell className="text-right">
                                                          <Badge variant={doctor.subscriptionStatus === 'active' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': doctor.subscriptionStatus === 'active', 'bg-red-600 text-white': doctor.subscriptionStatus === 'inactive'  })}>
                                                              {doctor.subscriptionStatus === 'active' ? 'Activa (por vencer)' : 'Inactiva'}
                                                          </Badge>
                                                      </TableCell>
                                                  </TableRow>
                                              ))
                                          ) : (
                                              <TableRow>
                                                  <TableCell colSpan={5} className="text-center h-24">
                                                      No hay médicos con pagos por vencer para este mes.
                                                  </TableCell>
                                              </TableRow>
                                          )}
                                      </TableBody>
                                  </Table>
                              </div>
                              <div className="space-y-4 md:hidden">
                                  {pendingToPayThisMonth.length > 0 ? (
                                      pendingToPayThisMonth.map((doctor) => (
                                          <div key={doctor.id} className="p-4 border rounded-lg space-y-3">
                                              <div>
                                                  <p className="font-semibold">{doctor.name}</p>
                                                  <p className="text-sm text-muted-foreground">{doctor.city}</p>
                                              </div>
                                              <Separator />
                                              <div className="flex justify-between items-center text-sm">
                                                  <p className="text-muted-foreground">Vence:</p>
                                                  <p>{format(new Date(doctor.nextPaymentDate + 'T00:00:00'), "d MMM yyyy", { locale: es })}</p>
                                              </div>
                                              <div className="flex justify-between items-center text-sm">
                                                  <p className="text-muted-foreground">Monto:</p>
                                                  <p className="font-mono font-semibold">${(cityFeesMap.get(doctor.city) || 0).toFixed(2)}</p>
                                              </div>
                                              <div className="flex justify-between items-center text-sm">
                                                  <p className="text-muted-foreground">Estado:</p>
                                                  <Badge variant={doctor.subscriptionStatus === 'active' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': doctor.subscriptionStatus === 'active', 'bg-red-600 text-white': doctor.subscriptionStatus === 'inactive'  })}>
                                                      {doctor.subscriptionStatus === 'active' ? 'Activa (por vencer)' : 'Inactiva'}
                                                  </Badge>
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <p className="text-center text-muted-foreground py-8">
                                          No hay médicos con pagos por vencer para este mes.
                                      </p>
                                  )}
                              </div>
                          </CardContent>
                        </Card>
                        
                         <Card>
                          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                  <CardTitle>Gastos Operativos de SUMA</CardTitle>
                                  <CardDescription>Registro de todos los egresos de la empresa ({timeRangeLabels[timeRange]}).</CardDescription>
                              </div>
                              <Button onClick={() => { setEditingExpense(null); setIsExpenseDialogOpen(true); }}>
                                  <PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto
                              </Button>
                          </CardHeader>
                          <CardContent>
                              <div className="hidden md:block">
                                  <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Fecha</TableHead>
                                          <TableHead>Descripción</TableHead>
                                          <TableHead>Categoría</TableHead>
                                          <TableHead className="text-right">Monto</TableHead>
                                          <TableHead className="text-right">Acciones</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {paginatedCompanyExpenses.map((expense) => (
                                          <TableRow key={expense.id}>
                                              <TableCell>{format(new Date(expense.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                              <TableCell className="font-medium">{expense.description}</TableCell>
                                              <TableCell className="capitalize">{expense.category}</TableCell>
                                              <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                                              <TableCell className="text-right flex items-center justify-end gap-2">
                                                  <Button variant="outline" size="icon" onClick={() => { setEditingExpense(expense); setIsExpenseDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                                  <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog('expense', expense)}><Trash2 className="h-4 w-4" /></Button>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                      {paginatedCompanyExpenses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">No hay gastos registrados en este período.</TableCell></TableRow>}
                                  </TableBody>
                                  </Table>
                              </div>
                              <div className="space-y-4 md:hidden">
                                  {paginatedCompanyExpenses.map((expense) => (
                                      <div key={expense.id} className="p-4 border rounded-lg space-y-3">
                                          <div className="flex justify-between items-start">
                                              <div>
                                                  <p className="font-semibold">{expense.description}</p>
                                                  <p className="text-xs text-muted-foreground">{format(new Date(expense.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                                              </div>
                                              <Badge variant="secondary" className="capitalize">{expense.category}</Badge>
                                          </div>
                                          <p className="text-right font-mono text-lg">${expense.amount.toFixed(2)}</p>
                                          <Separator />
                                          <div className="flex justify-end gap-2">
                                              <Button variant="outline" size="sm" onClick={() => { setEditingExpense(expense); setIsExpenseDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                              <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog('expense', expense)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                                          </div>
                                      </div>
                                  ))}
                                  {paginatedCompanyExpenses.length === 0 && <p className="text-center text-muted-foreground py-8">No hay gastos registrados en este período.</p>}
                              </div>
                          </CardContent>
                            <CardFooter className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                  Página {expenseCurrentPage} de {totalExpensePages}
                              </div>
                              <div className="flex items-center gap-2">
                                  <Select
                                  value={String(expenseItemsPerPage)}
                                  onValueChange={(value) => {
                                      setExpenseItemsPerPage(Number(value));
                                      setExpenseCurrentPage(1);
                                  }}
                                  >
                                  <SelectTrigger className="w-28">
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="10">10 por página</SelectItem>
                                      <SelectItem value="20">20 por página</SelectItem>
                                      <SelectItem value="50">50 por página</SelectItem>
                                      <SelectItem value="-1">Mostrar todos</SelectItem>
                                  </SelectContent>
                                  </Select>
                                  <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setExpenseCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={expenseCurrentPage === 1}
                                  >
                                  <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setExpenseCurrentPage(p => Math.min(totalExpensePages, p + 1))}
                                  disabled={expenseCurrentPage === totalExpensePages}
                                  >
                                  <ChevronRight className="h-4 w-4" />
                                  </Button>
                              </div>
                            </CardFooter>
                        </Card>
  
                        <Card>
                          <CardHeader>
                              <CardTitle>Historial de Ingresos por Suscripción</CardTitle>
                              <CardDescription>Pagos de mensualidades de los médicos, agrupados por mes.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              {Object.keys(paymentsByMonth).length > 0 ? (
                                  <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(paymentsByMonth)[0]}>
                                      {Object.entries(paymentsByMonth).map(([month, payments]) => (
                                          <AccordionItem value={month} key={month}>
                                              <AccordionTrigger className="text-lg font-medium capitalize">{month}</AccordionTrigger>
                                              <AccordionContent>
                                                  <Table>
                                                      <TableHeader>
                                                          <TableRow>
                                                              <TableHead>Fecha</TableHead>
                                                              <TableHead>Médico</TableHead>
                                                              <TableHead>Monto</TableHead>
                                                              <TableHead>Estado</TableHead>
                                                              <TableHead className="text-right">Detalles</TableHead>
                                                          </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                          {payments.map((payment) => (
                                                              <TableRow key={payment.id}>
                                                                  <TableCell>{format(new Date(payment.date + 'T00:00:00'), "d 'de' LLLL", { locale: es })}</TableCell>
                                                                  <TableCell>{payment.doctorName}</TableCell>
                                                                  <TableCell className="font-mono">${(payment.amount || 0).toFixed(2)}</TableCell>
                                                                  <TableCell>
                                                                      <Badge className={cn({
                                                                          'bg-green-600 text-white': payment.status === 'Paid',
                                                                          'bg-amber-500 text-white': payment.status === 'Pending',
                                                                          'bg-red-600 text-white': payment.status === 'Rejected',
                                                                      })}>
                                                                          {payment.status === 'Paid' ? 'Pagado' : payment.status === 'Pending' ? 'En Revisión' : 'Rechazado'}
                                                                      </Badge>
                                                                  </TableCell>
                                                                  <TableCell className="text-right">
                                                                      <Button 
                                                                      variant="outline" 
                                                                      size="icon" 
                                                                      onClick={() => handleViewProof(payment.paymentProofUrl)}
                                                                      disabled={!payment.paymentProofUrl}
                                                                      >
                                                                          <Eye className="h-4 w-4" />
                                                                      </Button>
                                                                  </TableCell>
                                                              </TableRow>
                                                          ))}
                                                      </TableBody>
                                                  </Table>
                                              </AccordionContent>
                                          </AccordionItem>
                                      ))}
                                  </Accordion>
                              ) : (
                                  <p className="text-center text-muted-foreground py-8">No hay pagos registrados.</p>
                              )}
                          </CardContent>
                        </Card>
                      </div>
                  </div>
                  )}
                  
                  {currentTab === 'marketing' && (
                  <div className="mt-6">
                      <Card>
                          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                  <CardTitle className="flex items-center gap-2"><ShoppingBag/> Material de Marketing</CardTitle>
                                  <CardDescription>Gestiona los recursos que las vendedoras usan para promocionar SUMA.</CardDescription>
                              </div>
                              <Button onClick={() => { setEditingMaterial(null); setIsMarketingDialogOpen(true); }}>
                                  <PlusCircle className="mr-2"/> Añadir Material
                              </Button>
                          </CardHeader>
                          <CardContent>
                              <div className="hidden md:block">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead>Título</TableHead>
                                              <TableHead>Tipo</TableHead>
                                              <TableHead>Descripción</TableHead>
                                              <TableHead className="text-right">Acciones</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {marketingMaterials.map((material) => (
                                              <TableRow key={material.id}>
                                                  <TableCell className="font-medium">{material.title}</TableCell>
                                                  <TableCell className="capitalize">{material.type}</TableCell>
                                                  <TableCell className="text-sm text-muted-foreground max-w-sm truncate">{material.description}</TableCell>
                                                  <TableCell className="text-right flex items-center justify-end gap-2">
                                                      <Button variant="outline" size="icon" onClick={() => { setEditingMaterial(material); setIsMarketingDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                                      <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog('marketing', material)}><Trash2 className="h-4 w-4" /></Button>
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                          {marketingMaterials.length === 0 && (
                                              <TableRow>
                                                  <TableCell colSpan={4} className="h-24 text-center">No hay materiales de marketing cargados.</TableCell>
                                              </TableRow>
                                          )}
                                      </TableBody>
                                  </Table>
                              </div>
                              <div className="space-y-4 md:hidden">
                                  {marketingMaterials.map((material) => (
                                      <div key={material.id} className="p-4 border rounded-lg space-y-3">
                                          <div className="flex justify-between items-start gap-2">
                                              <div>
                                                  <p className="font-semibold">{material.title}</p>
                                                  <Badge variant="secondary" className="capitalize mt-1">{material.type}</Badge>
                                              </div>
                                              <div className="flex gap-2">
                                                  <Button variant="outline" size="icon" onClick={() => { setEditingMaterial(material); setIsMarketingDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                                  <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog('marketing', material)}><Trash2 className="h-4 w-4" /></Button>
                                              </div>
                                          </div>
                                          <p className="text-sm text-muted-foreground">{material.description}</p>
                                      </div>
                                  ))}
                                  {marketingMaterials.length === 0 && (
                                      <p className="text-center text-muted-foreground py-8">No hay materiales de marketing cargados.</p>
                                  )}
                              </div>
                          </CardContent>
                      </Card>
                  </div>
                  )}
  
                  {currentTab === 'support' && (
                   <div className="mt-6">
                      <Card>
                        <CardHeader>
                            <CardTitle>Tickets de Soporte</CardTitle>
                            <CardDescription>Gestiona las solicitudes de soporte de médicos y vendedoras.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="hidden md:block">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Fecha</TableHead>
                                          <TableHead>Usuario</TableHead>
                                          <TableHead>Rol</TableHead>
                                          <TableHead>Asunto</TableHead>
                                          <TableHead>Estado</TableHead>
                                          <TableHead className="text-right">Acciones</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {supportTickets.map((ticket) => (
                                          <TableRow key={ticket.id}>
                                              <TableCell>{format(new Date(ticket.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}</TableCell>
                                              <TableCell>{ticket.userName}</TableCell>
                                              <TableCell className="capitalize">{ticket.userRole}</TableCell>
                                              <TableCell className="font-medium">{ticket.subject}</TableCell>
                                              <TableCell>
                                                  <Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>
                                                      {ticket.status}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                  <Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}>
                                                      <Eye className="mr-2 h-4 w-4" /> Ver Ticket
                                                  </Button>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                       {supportTickets.length === 0 && (
                                          <TableRow>
                                              <TableCell colSpan={6} className="h-24 text-center">No hay tickets de soporte.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                           </div>
                            <div className="space-y-4 md:hidden">
                                  {supportTickets.map((ticket) => (
                                      <div key={ticket.id} className="p-4 border rounded-lg space-y-3">
                                          <div>
                                              <p className="font-semibold">{ticket.subject}</p>
                                              <p className="text-sm text-muted-foreground">{ticket.userName} <span className="capitalize">({ticket.userRole})</span></p>
                                          </div>
                                          
                                          <div className="flex justify-between items-center text-sm">
                                              <p className="text-xs text-muted-foreground">{format(new Date(ticket.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}</p>
                                              <Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>
                                                  {ticket.status}
                                              </Badge>
                                          </div>
  
                                          <Separator />
                                          
                                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewTicket(ticket)}>
                                              <Eye className="mr-2 h-4 w-4" /> Ver Ticket
                                          </Button>
                                      </div>
                                  ))}
                                  {supportTickets.length === 0 && <p className="text-center text-muted-foreground py-8">No hay tickets de soporte.</p>}
                              </div>
                        </CardContent>
                      </Card>
                  </div>
                  )}
                  {currentTab === 'settings' && (
                      <div className="mt-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                          <Card>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2"><Settings /> Configuración General</CardTitle>
                                  <CardDescription>Ajusta los parámetros principales de la plataforma.</CardDescription>
                              </CardHeader>
                              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                                  <div className="space-y-4">
                                      <Label className="text-base">Moneda Principal</Label>
                                      <div className="flex items-center gap-2">
                                          <Wallet className="h-5 w-5 text-muted-foreground" />
                                          <Select value={currency} onValueChange={(val) => updateSetting('currency', val)}>
                                              <SelectTrigger><SelectValue/></SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                                                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                  <SelectItem value="VES">VES - Bolívar Soberano</SelectItem>
                                              </SelectContent>
                                          </Select>
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <Label className="text-base">Zona Horaria</Label>
                                      <div className="flex items-center gap-2">
                                          <Globe className="h-5 w-5 text-muted-foreground" />
                                          <Select value={timezone} onValueChange={(val) => updateSetting('timezone', val)}>
                                              <SelectTrigger><SelectValue/></SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="America/Caracas">GMT-4 (Caracas)</SelectItem>
                                                  <SelectItem value="America/New_York">GMT-5 (Nueva York)</SelectItem>
                                                  <SelectItem value="Europe/Madrid">GMT+1 (Madrid)</SelectItem>
                                              </SelectContent>
                                          </Select>
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader className="flex flex-row items-center justify-between">
                                  <CardTitle className="flex items-center gap-2"><Landmark /> Cuentas Bancarias de SUMA</CardTitle>
                                  <Button size="sm" onClick={() => { setEditingCompanyBankDetail(null); setIsCompanyBankDetailDialogOpen(true); }}><PlusCircle className="mr-2"/> Nueva</Button>
                              </CardHeader>
                              <CardContent>
                                  <div className="space-y-2">
                                  {companyBankDetails.map(bd => (
                                      <div key={bd.id} className="flex justify-between items-center p-2 rounded-md border">
                                          <div>
                                              <p className="font-medium">{bd.bank} {bd.description && <span className="font-normal text-muted-foreground">({bd.description})</span>}</p>
                                              <p className="text-xs text-muted-foreground">{bd.accountHolder} - Cta. ...{bd.accountNumber.slice(-4)}</p>
                                          </div>
                                          <div className="flex gap-2">
                                              <Button size="icon" variant="outline" onClick={() => { setEditingCompanyBankDetail(bd); setIsCompanyBankDetailDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                              <Button size="icon" variant="destructive" onClick={() => handleOpenDeleteDialog('bank', bd)}><Trash2 className="h-4 w-4"/></Button>
                                          </div>
                                      </div>
                                  ))}
                                  {companyBankDetails.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No hay cuentas bancarias registradas.</p>}
                                  </div>
                              </CardContent>
                          </Card>
                        </div>
  
                        <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2"><CalendarDays /> Ciclo de Facturación</CardTitle>
                              <CardDescription>Define el ciclo de pago mensual para las suscripciones de los médicos.</CardDescription>
                          </CardHeader>
                          <CardContent className="grid md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                  <Label htmlFor="billing-start">Día de Inicio del Ciclo</Label>
                                  <Input 
                                      id="billing-start" 
                                      type="number" 
                                      value={tempBillingStartDay}
                                      onChange={(e) => setTempBillingStartDay(Number(e.target.value))}
                                  />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="billing-end">Día de Fin (Periodo de Gracia)</Label>
                                  <Input 
                                      id="billing-end" 
                                      type="number" 
                                      value={tempBillingEndDay}
                                      onChange={(e) => setTempBillingEndDay(Number(e.target.value))}
                                  />
                              </div>
                          </CardContent>
                          <CardFooter>
                              <Button onClick={handleSaveBillingSettings}>Guardar Ciclo de Facturación</Button>
                          </CardFooter>
                      </Card>
  
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ImageIcon /> Gestión de Imágenes</CardTitle>
                                <CardDescription>Cambia las imágenes principales de la plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Logo de SUMA</Label>
                                    <div className="space-y-2">
                                        <Label htmlFor="logo-url" className="text-xs font-normal text-muted-foreground">URL del Logo</Label>
                                        <div className="flex items-center gap-2">
                                            <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                            <Input id="logo-url" type="text" value={tempLogoUrl} onChange={(e) => setTempLogoUrl(e.target.value)} placeholder="https://ejemplo.com/logo.png" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">O</p>
                                    <div className="space-y-2">
                                        <Label htmlFor="logoFile" className="text-xs font-normal text-muted-foreground">Subir desde la computadora</Label>
                                        <div className="flex items-center gap-2">
                                            <Upload className="h-5 w-5 text-muted-foreground"/>
                                            <Input id="logoFile" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                                        </div>
                                        {logoFile && <p className="text-sm text-green-600 mt-2">Archivo seleccionado: {logoFile.name}</p>}
                                    </div>
                                    {logoUrl && !logoFile && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-muted-foreground">Vista Previa Actual:</p>
                                            <Image src={logoUrl} alt="Logo de SUMA" width={128} height={40} className="rounded-md border p-2 bg-background object-contain mt-1" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Imagen Principal (Homepage)</Label>
                                    <div className="space-y-2">
                                        <Label htmlFor="hero-url" className="text-xs font-normal text-muted-foreground">URL de la Imagen</Label>
                                        <div className="flex items-center gap-2">
                                            <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                            <Input id="hero-url" type="text" value={tempHeroImageUrl} onChange={(e) => setTempHeroImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.png" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">O</p>
                                    <div className="space-y-2">
                                        <Label htmlFor="heroImageFile" className="text-xs font-normal text-muted-foreground">Subir desde la computadora</Label>
                                        <div className="flex items-center gap-2">
                                            <Upload className="h-5 w-5 text-muted-foreground"/>
                                            <Input id="heroImageFile" type="file" accept="image/*" onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)} />
                                        </div>
                                        {heroImageFile && <p className="text-sm text-green-600 mt-2">Archivo seleccionado: {heroImageFile.name}</p>}
                                    </div>
                                    {heroImageUrl && !heroImageFile && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-muted-foreground">Vista Previa Actual:</p>
                                            <div className="relative aspect-video w-full">
                                                <Image src={heroImageUrl} alt="Imagen principal" layout="fill" className="rounded-md border object-cover mt-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveImages}>Guardar Imágenes</Button>
                            </CardFooter>
                        </Card>
  
                         <Card>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2"><Sparkles /> Especialidades de Belleza</CardTitle>
                                  <CardDescription>Selecciona qué especialidades aparecerán en la sección destacada de "Belleza y Bienestar" en la página de búsqueda.</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                                  {specialties.map(spec => (
                                      <div key={spec} className="flex items-center space-x-3">
                                          <Checkbox
                                              id={`beauty-${spec}`}
                                              checked={(beautySpecialties || []).includes(spec)}
                                              onCheckedChange={(checked) => handleBeautySpecialtyChange(spec, !!checked)}
                                          />
                                          <label
                                              htmlFor={`beauty-${spec}`}
                                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                             {spec}
                                          </label>
                                      </div>
                                  ))}
                                  {specialties.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">Primero debes agregar especialidades.</p>}
                              </CardContent>
                          </Card>
  
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Database /> Mantenimiento de la Base de Datos
                            </CardTitle>
                            <CardDescription>
                              Realiza tareas de mantenimiento como poblar, respaldar y restaurar los datos de la aplicación.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="flex flex-col items-start gap-4 rounded-lg border p-4">
                                  <h4 className="font-semibold">Poblar con Datos de Prueba</h4>
                                  <p className="text-sm text-muted-foreground">
                                  Este proceso borrará los datos existentes y los reemplazará con los datos de prueba del sistema.
                                  <br />
                                  <strong className="text-destructive">Advertencia:</strong> Esta acción es irreversible.
                                  </p>
                                  <Button
                                  variant="secondary"
                                  onClick={handleSeedDatabase}
                                  disabled={isSeeding}
                                  >
                                  {isSeeding ? (
                                      <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Poblando Base de Datos...
                                      </>
                                  ) : (
                                      "Poblar Base de Datos"
                                  )}
                                  </Button>
                              </div>
  
                               <div className="flex flex-col items-start gap-4 rounded-lg border p-4">
                                  <h4 className="font-semibold">Respaldo y Restauración</h4>
                                  <p className="text-sm text-muted-foreground">
                                      Exporta todos los datos de la aplicación a un archivo JSON, o importa un archivo para restaurar un estado anterior.
                                      <br />
                                      <strong className="text-destructive">Advertencia:</strong> La importación borrará todos los datos actuales.
                                  </p>
                                  <div className="flex gap-2">
                                      <Button onClick={handleExportDatabase} disabled={isExporting}>
                                          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4"/>}
                                          Exportar Datos
                                      </Button>
                                      <Button variant="outline" onClick={() => importFileInputRef.current?.click()} disabled={isImporting}>
                                          {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4"/>}
                                          Importar Datos
                                      </Button>
                                      <input
                                          ref={importFileInputRef}
                                          type="file"
                                          id="import-file-input"
                                          accept=".json"
                                          className="hidden"
                                          onChange={handleFileSelect}
                                      />
                                  </div>
                              </div>
                          </CardContent>
                        </Card>
  
                          <div className="grid md:grid-cols-2 gap-6 items-start">
                               <Card>
                                  <CardHeader className="flex flex-row items-center justify-between">
                                      <CardTitle className="flex items-center gap-2"><MapPin /> Gestión de Ubicaciones</CardTitle>
                                      <Button size="sm" onClick={() => { setEditingCity({ originalName: '', name: '', subscriptionFee: 0 }); setIsCityDialogOpen(true); }}><PlusCircle className="mr-2"/> Ciudad</Button>
                                  </CardHeader>
                                  <CardContent>
                                      <div className="hidden md:block">
                                          <Table>
                                              <TableHeader>
                                                  <TableRow>
                                                      <TableHead>Ciudad</TableHead>
                                                      <TableHead>Tarifa de Suscripción</TableHead>
                                                      <TableHead className="text-right">Acciones</TableHead>
                                                  </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                              {cities.map((city, index) => (
                                                  <TableRow key={`${city.name}-${index}`}>
                                                      <TableCell className="font-medium">{city.name}</TableCell>
                                                      <TableCell className="font-mono">${(city.subscriptionFee || 0).toFixed(2)}</TableCell>
                                                      <TableCell className="flex justify-end gap-2">
                                                          <Button size="icon" variant="outline" onClick={() => { setEditingCity({ originalName: city.name, ...city }); setIsCityDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                                          <Button size="icon" variant="destructive" onClick={() => handleOpenDeleteDialog('city', city.name)}><Trash2 className="h-4 w-4"/></Button>
                                                      </TableCell>
                                                  </TableRow>
                                              ))}
                                              </TableBody>
                                          </Table>
                                      </div>
                                      <div className="space-y-4 md:hidden">
                                          {cities.map((city, index) => (
                                              <div key={`${city.name}-${index}-mobile`} className="p-4 border rounded-lg space-y-3">
                                                  <div className="flex justify-between items-center">
                                                      <div>
                                                          <p className="font-semibold">{city.name}</p>
                                                          <p className="text-sm font-mono text-muted-foreground">${(city.subscriptionFee || 0).toFixed(2)}</p>
                                                      </div>
                                                      <div className="flex gap-2">
                                                          <Button size="icon" variant="outline" onClick={() => { setEditingCity({ originalName: city.name, ...city }); setIsCityDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                                          <Button size="icon" variant="destructive" onClick={() => handleOpenDeleteDialog('city', city.name)}><Trash2 className="h-4 w-4"/></Button>
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                          {cities.length === 0 && (
                                              <p className="text-center text-muted-foreground py-8">No hay ciudades registradas.</p>
                                          )}
                                      </div>
                                  </CardContent>
                              </Card>
  
                               <Card>
                                  <CardHeader className="flex flex-row items-center justify-between">
                                      <CardTitle className="flex items-center gap-2"><BrainCircuit /> Gestión de Especialidades</CardTitle>
                                      <Button size="sm" onClick={() => { setEditingSpecialty({ originalName: '', newName: '' }); setIsSpecialtyDialogOpen(true); }}><PlusCircle className="mr-2"/> Nueva</Button>
                                  </CardHeader>
                                  <CardContent>
                                      <div className="space-y-2">
                                      {specialties.map(spec => (
                                          <div key={spec} className="flex justify-between items-center p-2 rounded-md border">
                                              <span className="font-medium">{spec}</span>
                                              <div className="flex gap-2">
                                                  <Button size="icon" variant="outline" onClick={() => { setEditingSpecialty({ originalName: spec, newName: spec }); setIsSpecialtyDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                                  <Button size="icon" variant="destructive" onClick={() => handleOpenDeleteDialog('specialty', spec)}><Trash2 className="h-4 w-4"/></Button>
                                              </div>
                                          </div>
                                      ))}
                                      </div>
                                  </CardContent>
                              </Card>
                          </div>
                          
                          <Card>
                              <CardHeader className="flex flex-row items-center justify-between">
                                  <CardTitle className="flex items-center gap-2"><Tag /> Gestión de Cupones</CardTitle>
                                  <Button size="sm" onClick={() => { setEditingCoupon(null); setIsCouponDialogOpen(true); }}><PlusCircle className="mr-2"/> Cupón</Button>
                              </CardHeader>
                              <CardContent>
                                  <div className="hidden md:block">
                                      <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>Código</TableHead>
                                                  <TableHead>Tipo</TableHead>
                                                  <TableHead>Valor</TableHead>
                                                  <TableHead>Alcance</TableHead>
                                                  <TableHead className="text-right">Acciones</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                          {coupons.map(coupon => (
                                              <TableRow key={coupon.id}>
                                                  <TableCell className="font-mono">{coupon.code}</TableCell>
                                                  <TableCell className="capitalize">{coupon.discountType === 'fixed' ? 'Fijo' : 'Porcentaje'}</TableCell>
                                                  <TableCell>{coupon.discountType === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}</TableCell>
                                                  <TableCell>{coupon.scope === 'general' ? 'General (Todos)' : doctors.find(d => d.id === coupon.scope)?.name || 'Médico Eliminado'}</TableCell>
                                                  <TableCell className="text-right flex items-center justify-end gap-2">
                                                      <Button size="icon" variant="outline" onClick={() => { setEditingCoupon(coupon); setIsCouponDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                                      <Button size="icon" variant="destructive" onClick={() => handleOpenDeleteDialog('coupon', coupon)}><Trash2 className="h-4 w-4"/></Button>
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                          </TableBody>
                                      </Table>
                                  </div>
                                  <div className="space-y-4 md:hidden">
                                      {coupons.map(coupon => (
                                          <div key={coupon.id} className="p-4 border rounded-lg space-y-3">
                                              <div className="flex justify-between items-start">
                                                  <div>
                                                      <p className="font-semibold font-mono">{coupon.code}</p>
                                                      <p className="text-xs text-muted-foreground">{coupon.scope === 'general' ? 'General' : `Dr. ${doctors.find(d => d.id === coupon.scope)?.name}`}</p>
                                                  </div>
                                                  <Badge variant="secondary">{coupon.discountType === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}</Badge>
                                              </div>
                                              <Separator />
                                              <div className="flex justify-end gap-2">
                                                  <Button variant="outline" size="sm" onClick={() => { setEditingCoupon(coupon); setIsCouponDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                                  <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog('coupon', coupon)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                                              </div>
                                          </div>
                                      ))}
                                      {coupons.length === 0 && <p className="text-center text-muted-foreground py-8">No hay cupones creados.</p>}
                                  </div>
                              </CardContent>
                          </Card>
                      </div>
                  )}
             </>
          </div>
        </main>
      </div>
    </>
  );
}

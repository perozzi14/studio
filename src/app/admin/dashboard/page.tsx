
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import type { Doctor, Seller, Patient, DoctorPayment, AdminSupportTicket, Coupon, SellerPayment, BankDetail, Appointment, CompanyExpense, MarketingMaterial, ChatMessage } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, Stethoscope, UserCheck, BarChart, Settings, CheckCircle, XCircle, Pencil, Eye, Trash2, PlusCircle, Ticket, DollarSign, Wallet, MapPin, Tag, BrainCircuit, Globe, Image as ImageIcon, FileUp, Landmark, Mail, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, FileDown, Database, Loader2, ShoppingBag, Video, FileText, Link as LinkIcon, AlertCircle, Send } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/lib/settings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { z } from 'zod';

const DoctorFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Por favor, ingresa un correo electrónico válido."),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres.").optional().or(z.literal('')),
  specialty: z.string().min(1, "Debes seleccionar una especialidad."),
  city: z.string().min(1, "Debes seleccionar una ciudad."),
  address: z.string().min(5, "La dirección es requerida."),
  sellerId: z.string().nullable(),
});

const SellerFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Por favor, ingresa un correo electrónico válido."),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres.").optional().or(z.literal('')),
  commission: z.number().min(0, "La comisión no puede ser negativa.").max(100, "La comisión no puede ser mayor a 100."),
});

const SellerPaymentFormSchema = z.object({
    amount: z.number().positive("El monto debe ser un número positivo."),
    period: z.string().min(3, "El período es requerido."),
    transactionId: z.string().min(1, "El ID de transacción es requerido."),
    paymentProof: z.any().refine((file) => file?.name, "El comprobante es requerido."),
});

const PatientFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Correo electrónico inválido."),
  cedula: z.string().optional(),
  phone: z.string().optional(),
});

const ExpenseFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser positivo."),
  category: z.enum(['operativo', 'marketing', 'personal']),
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
  description: z.string().optional(),
});

const MarketingMaterialSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  type: z.enum(['image', 'video', 'file', 'url']),
  url: z.string().url("La URL no es válida."),
  thumbnailUrl: z.string().url("La URL de la miniatura no es válida."),
});


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
  const [isSellerFinanceDialogOpen, setIsSellerFinanceDialogOpen] = useState(false);
  const [managingSeller, setManagingSeller] = useState<Seller | null>(null);
  const [isRegisterPaymentDialogOpen, setIsRegisterPaymentDialogOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

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
  
  // States for Support
  const [isSupportDetailDialogOpen, setIsSupportDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");


  // States for Settings & Company Finances
  const { 
      doctorSubscriptionFee,
      cities,
      specialties,
      coupons,
      timezone,
      logoUrl,
      currency,
      companyBankDetails,
      companyExpenses,
      updateSetting,
      addListItem,
      updateListItem,
      deleteListItem,
      addCompanyExpense,
      updateCompanyExpense,
      deleteCompanyExpense,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      addBankDetail,
      updateBankDetail,
      deleteBankDetail
  } = useSettings();
  
  const [tempSubscriptionFee, setTempSubscriptionFee] = useState<string>('');
  const [tempLogoUrl, setTempLogoUrl] = useState<string>('');
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<{ originalName: string, newName: string } | null>(null);
  const [isSpecialtyDialogOpen, setIsSpecialtyDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<{ originalName: string, newName: string } | null>(null);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCompanyBankDetailDialogOpen, setIsCompanyBankDetailDialogOpen] = useState(false);
  const [editingCompanyBankDetail, setEditingCompanyBankDetail] = useState<BankDetail | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  
  // State for DB Seeding
  const [isSeeding, setIsSeeding] = useState(false);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

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
    if (doctorSubscriptionFee) {
        setTempSubscriptionFee(doctorSubscriptionFee.toString());
    }
    if (logoUrl) {
        setTempLogoUrl(logoUrl);
    }
  }, [doctorSubscriptionFee, logoUrl]);
  
  const handleSaveSettings = async () => {
    const newFee = parseFloat(tempSubscriptionFee);
    if (!isNaN(newFee) && newFee > 0) {
        await updateSetting('doctorSubscriptionFee', newFee);
        await updateSetting('logoUrl', tempLogoUrl);
        toast({ title: "Configuración Guardada", description: "Los ajustes generales han sido actualizados." });
    } else {
        toast({ variant: "destructive", title: "Valor Inválido", description: "Por favor, ingresa un número válido para la suscripción." });
    }
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
            specialty: formData.get('doc-specialty') as string,
            city: formData.get('doc-city') as string,
            address: formData.get('doc-address') as string,
            sellerId: formData.get('doc-seller') as string,
        };

        const result = DoctorFormSchema.safeParse(dataToValidate);

        if (!result.success) {
            const errorMessage = result.error.errors.map(err => err.message).join(' ');
            toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
            return;
        }

        const { name, email, specialty, city, address, sellerId } = result.data;
        const sellerIdValue = sellerId === 'null' || !sellerId ? null : sellerId;

        if (editingDoctor) {
            const updatedDoctorData: Partial<Doctor> = {
                name, email, specialty, city, address,
                sellerId: sellerIdValue,
            };
            if (result.data.password) {
              updatedDoctorData.password = result.data.password;
            }
            await firestoreService.updateDoctor(editingDoctor.id, updatedDoctorData);
            toast({ title: "Médico Actualizado", description: `El perfil de ${name} ha sido guardado.` });
        } else {
            const newDoctorData: Omit<Doctor, 'id'> = {
                name, email, specialty, city, address,
                password: result.data.password,
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
                slotDuration: 30,
                schedule: {
                    monday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    tuesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    wednesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    thursday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                    friday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
                    saturday: { active: false, slots: [] },
                    sunday: { active: false, slots: [] },
                },
                status: 'inactive',
                lastPaymentDate: new Date().toISOString().split('T')[0],
                whatsapp: '',
                lat: 0, lng: 0,
                joinDate: new Date().toISOString().split('T')[0],
                subscriptionStatus: 'inactive',
                nextPaymentDate: new Date().toISOString().split('T')[0],
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
                password: result.data.password,
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
            await deleteCompanyExpense(data.id);
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
            await deleteCoupon(data.id);
            toast({ title: "Cupón Eliminado", description: `El cupón "${data.code}" ha sido eliminado.`});
            break;
        case 'bank':
            await deleteBankDetail(data.id);
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

  const handleOpenSellerFinanceDialog = (seller: Seller) => {
    setManagingSeller(seller);
    setIsSellerFinanceDialogOpen(true);
  };
  
  const handleRegisterPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dataToValidate = {
        amount: parseFloat(formData.get('amount') as string),
        period: formData.get('period') as string,
        transactionId: formData.get('transactionId') as string,
        paymentProof: paymentProofFile,
    };

    const result = SellerPaymentFormSchema.safeParse(dataToValidate);

    if (!managingSeller || !result.success) {
        const errorMessage = result.success ? "Faltan datos de la vendedora." : result.error.errors.map(err => err.message).join(' ');
        toast({ variant: "destructive", title: "Errores de Validación", description: errorMessage });
        return;
    }

    const { amount, period, transactionId } = result.data;

    // TODO: In a real app, upload proofFile and get URL
    const newPayment: Omit<SellerPayment, 'id'> = {
      sellerId: managingSeller.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amount,
      period,
      includedDoctors: doctors.filter(d => d.sellerId === managingSeller.id && d.status === 'active'),
      paymentProofUrl: 'https://placehold.co/400x200.png',
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

    await firestoreService.updateDoctorPaymentStatus(paymentId, 'Paid');
    await firestoreService.updateDoctorStatus(payment.doctorId, 'active');
    await firestoreService.updateDoctor(payment.doctorId, { 
      lastPaymentDate: payment.date || new Date().toISOString().split('T')[0],
      subscriptionStatus: 'active',
     });
    
    toast({
      title: "Pago Aprobado",
      description: "El pago ha sido marcado como 'Pagado' y el estado del médico ha sido actualizado.",
    });
    fetchData();
  };

  const handleRejectPayment = async (paymentId: string) => {
    await firestoreService.updateDoctorPaymentStatus(paymentId, 'Rejected');
    toast({
      variant: "destructive",
      title: "Pago Rechazado",
      description: "El pago ha sido marcado como 'Rechazado'.",
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
        await updateCompanyExpense(editingExpense.id, { date, description, amount, category });
        toast({ title: "Gasto Actualizado", description: "El gasto ha sido modificado exitosamente." });
    } else {
        await addCompanyExpense({ date, description, amount, category });
        toast({ title: "Gasto Registrado", description: "El nuevo gasto ha sido agregado." });
    }
    
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };
  
  const handleSaveCity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCity) return;
    
    const newName = (e.currentTarget.elements.namedItem('city-name') as HTMLInputElement).value;
    const result = NameSchema.safeParse(newName);

    if (!result.success) {
        toast({ variant: "destructive", title: "Nombre requerido", description: result.error.errors.map(e => e.message).join(' ') });
        return;
    }

    if (editingCity.originalName) {
        await updateListItem('cities', editingCity.originalName, newName);
        toast({ title: "Ciudad Actualizada" });
    } else {
        await addListItem('cities', newName);
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
        await updateCoupon(editingCoupon.id, { code, discountType, value, scope });
        toast({ title: "Cupón Actualizado" });
    } else {
        await addCoupon({ code, discountType, value, scope });
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
        await updateBankDetail(editingCompanyBankDetail.id, newBankData);
        toast({ title: "Cuenta Actualizada" });
    } else {
        await addBankDetail(newBankData);
        toast({ title: "Cuenta Agregada" });
    }
    setIsCompanyBankDetailDialogOpen(false);
    setEditingCompanyBankDetail(null);
  };

  const handleSaveMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const dataToValidate = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as MarketingMaterial['type'],
        url: formData.get('url') as string,
        thumbnailUrl: formData.get('thumbnailUrl') as string,
      };

      const result = MarketingMaterialSchema.safeParse(dataToValidate);
      if (!result.success) {
          toast({ variant: 'destructive', title: 'Errores de Validación', description: result.error.errors.map(e => e.message).join(' ') });
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
      setEditingMaterial(null);
  };


  const stats = useMemo(() => {
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.status === 'active').length;
    const totalSellers = sellers.length;
    const totalPatients = patients.length;
    
    const totalRevenue = doctorPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const commissionsPaid = sellerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = companyExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
        totalDoctors,
        activeDoctors,
        totalSellers,
        totalPatients,
        totalRevenue,
        commissionsPaid,
        totalExpenses,
        netProfit: totalRevenue - commissionsPaid - totalExpenses,
    }
  }, [doctors, sellers, patients, doctorPayments, sellerPayments, companyExpenses]);

  const pendingDoctorPayments = useMemo(() => {
    return doctorPayments.filter(p => p.status === 'Pending');
  }, [doctorPayments]);

  const handleGenerateAdminFinanceReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("Reporte Financiero de SUMA", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy')}`, 105, 28, { align: 'center' });

    doc.setFontSize(16);
    doc.text("Resumen General", 14, 45);
    doc.line(14, 47, 196, 47);

    doc.setFontSize(12);
    const summaryY = 55;
    const summaryData = [
        ["Ingresos Totales (Suscripciones):", `$${stats.totalRevenue.toFixed(2)}`],
        ["Comisiones Pagadas a Vendedoras:", `$${stats.commissionsPaid.toFixed(2)}`],
        ["Gastos Operativos:", `$${stats.totalExpenses.toFixed(2)}`],
    ];
    summaryData.forEach((row, index) => {
        doc.text(row[0], 16, summaryY + (index * 8));
        doc.text(row[1], 194, summaryY + (index * 8), { align: 'right' });
    });
    
    doc.setFont("helvetica", "bold");
    doc.line(14, summaryY + (summaryData.length * 8) - 2, 196, summaryY + (summaryData.length * 8) - 2);
    doc.text("Beneficio Neto:", 16, summaryY + (summaryData.length * 8) + 5);
    doc.text(`$${stats.netProfit.toFixed(2)}`, 194, summaryY + (summaryData.length * 8) + 5, { align: 'right' });
    doc.setFont("helvetica", "normal");
    
    let currentY = summaryY + (summaryData.length * 8) + 20;

    doc.setFontSize(16);
    doc.text("Detalle de Gastos Operativos", 14, currentY);
    doc.line(14, currentY + 2, 196, currentY + 2);
    currentY += 10;
    
    const head = [['Fecha', 'Descripción', 'Categoría', 'Monto']];
    const body = companyExpenses.map(e => [
        format(new Date(e.date + 'T00:00:00'), 'dd/MM/yyyy'),
        e.description,
        e.category.charAt(0).toUpperCase() + e.category.slice(1),
        `$${e.amount.toFixed(2)}`
    ]);

    (doc as any).autoTable({
        startY: currentY,
        head: head,
        body: body,
        theme: 'striped'
    });
    
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
                                  <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                                  <p className="text-xs text-muted-foreground">{stats.activeDoctors} activos</p>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Total de Vendedoras</CardTitle>
                                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold">{stats.totalSellers}</div>
                                  <p className="text-xs text-muted-foreground">Gestionando referidos</p>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                                  <Users className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold">{stats.totalPatients}</div>
                                  <p className="text-xs text-muted-foreground">Registrados en la plataforma</p>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                                  <BarChart className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${stats.netProfit.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Ingresos - Egresos</p>
                              </CardContent>
                          </Card>
                      </div>
                      <div className="mt-6 text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                          <BarChart className="h-12 w-12" />
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
                                      const activeDoctorsCount = sellerDoctors.filter(d => d.status === 'active').length;
                                      const pendingCommission = activeDoctorsCount * doctorSubscriptionFee * seller.commissionRate;
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
                                                <Button variant="outline" size="icon" onClick={() => handleOpenSellerFinanceDialog(seller)}><Wallet className="h-4 w-4" /></Button>
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
                                    const activeDoctorsCount = sellerDoctors.filter(d => d.status === 'active').length;
                                    const pendingCommission = activeDoctorsCount * doctorSubscriptionFee * seller.commissionRate;
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
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenSellerFinanceDialog(seller)}><Wallet className="mr-2 h-4 w-4" /> Gestionar</Button>
                                                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingSeller(seller); setIsSellerDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleOpenDeleteDialog('seller', seller)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
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
                       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Ingresos (Suscripciones)</CardTitle>
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Pagos de médicos recibidos</p>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Comisiones Pagadas</CardTitle>
                                  <Landmark className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-amber-600">${stats.commissionsPaid.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Pagos a vendedoras</p>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
                                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-red-600">${stats.totalExpenses.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Gastos de la empresa</p>
                              </CardContent>
                          </Card>
                          <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                                  <Wallet className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${stats.netProfit.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Ingresos - Egresos</p>
                              </CardContent>
                          </Card>
                      </div>

                      <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                           <div>
                              <CardTitle>Visión General Financiera</CardTitle>
                              <CardDescription>Revisa el estado financiero de SUMA.</CardDescription>
                           </div>
                           <Button onClick={handleGenerateAdminFinanceReport}>
                               <FileDown className="mr-2"/> Descargar Reporte PDF
                           </Button>
                        </CardHeader>
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
                                                      <TableCell className="font-mono">${payment.amount.toFixed(2)}</TableCell>
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
                                                  <p className="text-sm text-muted-foreground">{format(new Date(payment.date + 'T00:00:00'), "d MMM yyyy", { locale: es })} - <span className="font-mono">${payment.amount.toFixed(2)}</span></p>
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
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Gastos Operativos de SUMA</CardTitle>
                                <CardDescription>Registro de todos los egresos de la empresa.</CardDescription>
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
                                    {companyExpenses.map((expense) => (
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
                                    {companyExpenses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">No hay gastos registrados.</TableCell></TableRow>}
                                </TableBody>
                                </Table>
                            </div>
                            <div className="space-y-4 md:hidden">
                                {companyExpenses.map((expense) => (
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
                                {companyExpenses.length === 0 && <p className="text-center text-muted-foreground py-8">No hay gastos registrados.</p>}
                            </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                            <CardTitle>Historial de Ingresos (Suscripciones)</CardTitle>
                            <CardDescription>Historial de pagos de mensualidades de los médicos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Médico</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {doctorPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{format(new Date(payment.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                <TableCell>{payment.doctorName}</TableCell>
                                                <TableCell className="font-mono">${payment.amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn({
                                                        'bg-green-600 text-white': payment.status === 'Paid',
                                                        'bg-amber-500 text-white': payment.status === 'Pending',
                                                        'bg-red-600 text-white': payment.status === 'Rejected',
                                                    })}>
                                                        {payment.status === 'Paid' ? 'Pagado' : payment.status === 'Pending' ? 'Pendiente' : 'Rechazado'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                            <div className="space-y-4 md:hidden">
                                {doctorPayments.map((payment) => (
                                    <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <p className="font-semibold">{payment.doctorName}</p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(payment.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                                            </div>
                                             <Badge className={cn({
                                                'bg-green-600 text-white': payment.status === 'Paid',
                                                'bg-amber-500 text-white': payment.status === 'Pending',
                                                'bg-red-600 text-white': payment.status === 'Rejected',
                                            })}>
                                                {payment.status === 'Paid' ? 'Pagado' : payment.status === 'Pending' ? 'Pendiente' : 'Rechazado'}
                                            </Badge>
                                        </div>
                                        <p className="text-right font-mono text-lg">${payment.amount.toFixed(2)}</p>
                                    </div>
                                ))}
                                {doctorPayments.length === 0 && <p className="text-center text-muted-foreground py-8">No hay pagos registrados.</p>}
                            </div>
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
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-base">Plan de Suscripción</Label>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                                        <Input 
                                            id="subscription-fee" 
                                            type="number" 
                                            value={tempSubscriptionFee}
                                            onChange={(e) => setTempSubscriptionFee(e.target.value)}
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-base">Logo de SUMA (URL)</Label>
                                     <div className="flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        <Input 
                                            id="logo-url" 
                                            type="text" 
                                            value={tempLogoUrl}
                                            onChange={(e) => setTempLogoUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
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
                            <CardContent>
                                <Button onClick={handleSaveSettings}>Guardar Cambios Generales</Button>
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
                          <CardTitle className="flex items-center gap-2">
                            <Database /> Mantenimiento de la Base de Datos
                          </CardTitle>
                          <CardDescription>
                            Usa esta herramienta para cargar los datos iniciales a tu base de datos Firestore.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col items-start gap-4 rounded-lg border p-4">
                            <p className="text-sm">
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
                                "Poblar Base de Datos con Datos de Prueba"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                        <div className="grid md:grid-cols-2 gap-6 items-start">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2"><MapPin /> Gestión de Ubicaciones</CardTitle>
                                    <Button size="sm" onClick={() => { setEditingCity({ originalName: '', newName: '' }); setIsCityDialogOpen(true); }}><PlusCircle className="mr-2"/> Ciudad</Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                    {cities.map(city => (
                                        <div key={city} className="flex justify-between items-center p-2 rounded-md border">
                                            <span className="font-medium">{city}</span>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" onClick={() => { setEditingCity({ originalName: city, newName: city }); setIsCityDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="destructive" onClick={() => handleOpenDeleteDialog('city', city)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    ))}
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

      {/* Marketing Dialog */}
      <Dialog open={isMarketingDialogOpen} onOpenChange={setIsMarketingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Material" : "Añadir Nuevo Material"}</DialogTitle>
            <DialogDescription>Completa la información del recurso de marketing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMaterial}>
            <div className="grid gap-4 py-4">
              <div><Label htmlFor="title">Título</Label><Input id="title" name="title" defaultValue={editingMaterial?.title} /></div>
              <div><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" defaultValue={editingMaterial?.description} /></div>
              <div><Label htmlFor="type">Tipo de Material</Label>
                <Select name="type" defaultValue={editingMaterial?.type || 'image'}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image"><div className="flex items-center gap-2"><ImageIcon/> Imagen</div></SelectItem>
                    <SelectItem value="video"><div className="flex items-center gap-2"><Video/> Video</div></SelectItem>
                    <SelectItem value="file"><div className="flex items-center gap-2"><FileText/> Archivo (PDF, etc.)</div></SelectItem>
                    <SelectItem value="url"><div className="flex items-center gap-2"><LinkIcon/> Enlace</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="url">URL del Recurso</Label><Input id="url" name="url" defaultValue={editingMaterial?.url} placeholder="https://..."/></div>
              <div><Label htmlFor="thumbnailUrl">URL de la Miniatura</Label><Input id="thumbnailUrl" name="thumbnailUrl" defaultValue={editingMaterial?.thumbnailUrl} placeholder="https://..."/></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Support Ticket Detail Dialog */}
        <Dialog open={isSupportDetailDialogOpen} onOpenChange={setIsSupportDetailDialogOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ticket de Soporte: {selectedTicket?.subject}</DialogTitle>
                    <DialogDescription>
                        Conversación con {selectedTicket?.userName} ({selectedTicket?.userRole}).
                    </DialogDescription>
                </DialogHeader>
                {selectedTicket && (
                    <>
                        <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto pr-4">
                            {(selectedTicket.messages || []).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((msg) => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'admin' && 'justify-end')}>
                                    {msg.sender === 'user' && <Avatar className="h-8 w-8"><AvatarFallback>{selectedTicket.userName.charAt(0)}</AvatarFallback></Avatar>}
                                    <div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'admin' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(new Date(msg.timestamp), { locale: es, addSuffix: true })}</p>
                                    </div>
                                    {msg.sender === 'admin' && <Avatar className="h-8 w-8"><AvatarFallback>A</AvatarFallback></Avatar>}
                                </div>
                            ))}
                        </div>

                        {selectedTicket.status === 'abierto' && (
                            <div className="flex items-center gap-2 border-t pt-4">
                                <Textarea 
                                    placeholder="Escribe tu respuesta..." 
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    rows={2}
                                />
                                <Button onClick={handleSendReply} disabled={!replyMessage.trim()} size="icon">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button variant="outline">Cerrar Ventana</Button></DialogClose>
                            {selectedTicket.status === 'abierto' && (
                                <Button onClick={() => handleUpdateTicketStatus(selectedTicket!.id, 'cerrado')}>
                                    <CheckCircle className="mr-2 h-4 w-4"/> Marcar como Resuelto
                                </Button>
                            )}
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>


      {/* Seller Dialogs */}
      <Dialog open={isSellerDialogOpen} onOpenChange={setIsSellerDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingSeller ? 'Editar Vendedora' : 'Registrar Nueva Vendedora'}</DialogTitle>
                <DialogDescription>
                    {editingSeller ? 'Actualiza la información de la vendedora.' : 'Completa el formulario para agregar una nueva vendedora.'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveSeller}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" name="name" defaultValue={editingSeller?.name || ''} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={editingSeller?.email || ''} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Contraseña</Label>
                        <Input id="password" name="password" type="password" placeholder={editingSeller ? "Dejar en blanco para no cambiar" : ""} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="commission" className="text-right">Comisión (%)</Label>
                        <Input id="commission" name="commission" type="number" defaultValue={(editingSeller?.commissionRate || 0.20) * 100} className="col-span-3" required />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Guardar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isSellerFinanceDialogOpen} onOpenChange={setIsSellerFinanceDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>Gestión Financiera: {managingSeller?.name}</DialogTitle>
                <DialogDescription>
                    Revisa comisiones, registra pagos y consulta el historial de la vendedora.
                </DialogDescription>
            </DialogHeader>
            {managingSeller && (
            (() => {
                const referredDoctors = doctors.filter(d => d.sellerId === managingSeller.id);
                const activeReferredCount = referredDoctors.filter(d => d.status === 'active').length;
                const pendingCommission = activeReferredCount * doctorSubscriptionFee * managingSeller.commissionRate;
                const totalPaid = sellerPayments.filter(p => p.sellerId === managingSeller.id).reduce((sum, p) => sum + p.amount, 0);

                return (
                    <div className="py-4 space-y-6 max-h-[75vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <Card>
                               <CardHeader><CardTitle className="text-base">Comisión Pendiente</CardTitle></CardHeader>
                               <CardContent><p className="text-2xl font-bold text-amber-600">${pendingCommission.toFixed(2)}</p></CardContent>
                           </Card>
                           <Card>
                               <CardHeader><CardTitle className="text-base">Total Histórico Pagado</CardTitle></CardHeader>
                               <CardContent><p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p></CardContent>
                           </Card>
                           <Card>
                               <CardHeader><CardTitle className="text-base">Médicos Activos</CardTitle></CardHeader>
                               <CardContent><p className="text-2xl font-bold">{activeReferredCount} / {referredDoctors.length}</p></CardContent>
                           </Card>
                        </div>
                        
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle>Historial de Pagos</CardTitle>
                                <DialogTrigger asChild>
                                    <Button size="sm" onClick={() => handleRegisterPaymentDialogChange(true)}><PlusCircle className="mr-2" /> Registrar Pago</Button>
                                </DialogTrigger>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Período</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Comprobante</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sellerPayments.filter(p => p.sellerId === managingSeller.id).map(payment => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{format(new Date(payment.paymentDate + 'T00:00:00'), "d MMM yyyy", { locale: es })}</TableCell>
                                                <TableCell>{payment.period}</TableCell>
                                                <TableCell className="font-mono">${payment.amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <a href={payment.paymentProofUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                                        <Eye className="mr-2 h-4 w-4"/> Ver
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Cuentas Bancarias Registradas</CardTitle></CardHeader>
                            <CardContent>
                                {managingSeller.bankDetails.length > 0 ? managingSeller.bankDetails.map(bd => (
                                     <div key={bd.id} className="p-3 border rounded-md mb-2">
                                        <p className="font-semibold">{bd.bank}</p>
                                        <p className="text-sm text-muted-foreground">{bd.accountHolder} - C.I. {bd.idNumber}</p>
                                        <p className="text-sm font-mono">{bd.accountNumber}</p>
                                    </div>
                                )) : <p className="text-muted-foreground text-sm">Esta vendedora no ha registrado cuentas bancarias.</p>}
                            </CardContent>
                        </Card>
                    </div>
                )
            })()
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRegisterPaymentDialogOpen} onOpenChange={handleRegisterPaymentDialogChange}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Registrar Pago para {managingSeller?.name}</DialogTitle>
                  <DialogDescription>Completa el formulario para registrar el pago de la comisión.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterPayment}>
                <div className="space-y-4 py-4">
                    <div><Label htmlFor="payment-amount">Monto a Pagar ($)</Label><Input id="payment-amount" name="amount" type="number" step="0.01" required /></div>
                    <div><Label htmlFor="payment-period">Período de Comisión</Label><Input id="payment-period" name="period" placeholder="Ej: Junio 2024" required /></div>
                    <div><Label htmlFor="payment-txid">ID de Transacción</Label><Input id="payment-txid" name="transactionId" placeholder="ID de la transferencia" required /></div>
                    <div>
                        <Label htmlFor="paymentProofFile">Comprobante de Pago</Label>
                        <Input id="paymentProofFile" type="file" required onChange={(e) => setPaymentProofFile(e.target.files ? e.target.files[0] : null)} />
                        {paymentProofFile && <p className="text-sm text-green-600 mt-2">Archivo seleccionado: {paymentProofFile.name}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Confirmar y Registrar</Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
      {/* Doctor Create/Edit Dialog */}
       <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>{editingDoctor ? 'Editar Médico' : 'Registrar Nuevo Médico'}</DialogTitle>
                <DialogDescription>
                    Completa la información del perfil del médico.
                </DialogDescription>
            </DialogHeader>
             <form onSubmit={handleSaveDoctor}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doc-name" className="text-right">Nombre</Label>
                        <Input id="doc-name" name="doc-name" defaultValue={editingDoctor?.name || ''} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doc-email" className="text-right">Email</Label>
                        <Input id="doc-email" name="doc-email" type="email" defaultValue={editingDoctor?.email || ''} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doc-password" className="text-right">Contraseña</Label>
                        <Input id="doc-password" name="doc-password" type="password" placeholder={editingDoctor ? "Dejar en blanco para no cambiar" : ""} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doc-specialty" className="text-right">Especialidad</Label>
                        <Select name="doc-specialty" defaultValue={editingDoctor?.specialty}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                            <SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doc-address" className="text-right">Dirección</Label>
                        <Input id="doc-address" name="doc-address" defaultValue={editingDoctor?.address || ''} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doc-city" className="text-right">Ciudad</Label>
                         <Select name="doc-city" defaultValue={editingDoctor?.city}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                            <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="doc-seller" className="text-right">Referido por</Label>
                        <Select name="doc-seller" defaultValue={editingDoctor?.sellerId?.toString() || 'null'}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona una vendedora" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">SUMA (Sin Vendedora)</SelectItem>
                                {sellers.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
             </form>
        </DialogContent>
      </Dialog>
      
      {/* Doctor View Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalles del Médico</DialogTitle>
                <DialogDescription>
                    Información completa del perfil, servicios y su historial de pagos.
                </DialogDescription>
            </DialogHeader>
            {selectedDoctor && (
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                     <div>
                        <h4 className="font-semibold mb-2 text-lg">Información del Perfil</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <p><strong>Nombre:</strong> {selectedDoctor.name}</p>
                            <p><strong>Especialidad:</strong> {selectedDoctor.specialty}</p>
                            <p><strong>Email:</strong> {selectedDoctor.email}</p>
                            <p><strong>WhatsApp:</strong> {selectedDoctor.whatsapp}</p>
                            <p className="col-span-full"><strong>Ubicación:</strong> {`${selectedDoctor.address}, ${selectedDoctor.sector}, ${selectedDoctor.city}`}</p>
                            <p><strong>Miembro desde:</strong> {format(new Date(selectedDoctor.joinDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                            <p><strong>Duración de Cita:</strong> {selectedDoctor.slotDuration} min</p>
                            <p><strong>Referido por:</strong> {sellers.find(s => s.id === selectedDoctor.sellerId)?.name || 'SUMA'}</p>
                            <div className="flex items-center gap-2">
                                <strong>Estado:</strong>
                                <Badge variant={selectedDoctor.status === 'active' ? 'default' : 'destructive'} className={cn(selectedDoctor.status === 'active' ? 'bg-green-600' : 'bg-destructive', 'text-white')}>
                                    {selectedDoctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />
                    
                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Descripción Pública</h4>
                        <p className="text-sm text-muted-foreground">{selectedDoctor.description || "No se ha proporcionado una descripción."}</p>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Servicios Ofrecidos</h4>
                        {selectedDoctor.services.length > 0 ? (
                           <ul className="list-disc list-inside text-sm space-y-1">
                                {selectedDoctor.services.map(service => (
                                    <li key={service.id} className="flex justify-between">
                                        <span>{service.name}</span>
                                        <span className="font-mono font-semibold">${service.price.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                           <p className="text-sm text-muted-foreground text-center py-4">No hay servicios registrados.</p>
                        )}
                    </div>

                    <Separator />

                    <div>
                        <h4 className="font-semibold mb-2 text-lg">Historial de Pagos de Suscripción</h4>
                         {doctorPayments.filter(p => p.doctorId === selectedDoctor.id).length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {doctorPayments
                                        .filter(p => p.doctorId === selectedDoctor.id)
                                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(payment => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{format(new Date(payment.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}</TableCell>
                                                <TableCell className="font-mono">${payment.amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn({
                                                        'bg-green-600 text-white': payment.status === 'Paid',
                                                        'bg-amber-500 text-white': payment.status === 'Pending',
                                                        'bg-red-600 text-white': payment.status === 'Rejected',
                                                    })}>
                                                        {payment.status === 'Paid' ? 'Pagado' : payment.status === 'Pending' ? 'Pendiente' : 'Rechazado'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay pagos registrados para este médico.</p>
                        )}
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Dialogs */}
      <Dialog open={isPatientDetailDialogOpen} onOpenChange={setIsPatientDetailDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>Historial del Paciente: {selectedPatientForDetail?.name}</DialogTitle>
                <DialogDescription>
                    Consulta el historial completo de citas y pagos del paciente.
                </DialogDescription>
            </DialogHeader>
            {selectedPatientForDetail && (
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información del Paciente</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <p><strong>Nombre:</strong> {selectedPatientForDetail.name}</p>
                            <p><strong>Email:</strong> {selectedPatientForDetail.email}</p>
                            <p><strong>Cédula:</strong> {selectedPatientForDetail.cedula || 'N/A'}</p>
                            <p><strong>Teléfono:</strong> {selectedPatientForDetail.phone || 'N/A'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Historial de Citas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                const patientAppointments = appointments.filter(a => a.patientId === selectedPatientForDetail.id);
                                if (patientAppointments.length === 0) {
                                    return <p className="text-center text-muted-foreground py-8">Este paciente no tiene citas registradas.</p>;
                                }
                                return (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Doctor</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Servicios</TableHead>
                                                <TableHead>Monto</TableHead>
                                                <TableHead>Pago</TableHead>
                                                <TableHead>Asistencia</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {patientAppointments
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(appt => (
                                                <TableRow key={appt.id}>
                                                    <TableCell className="font-medium">{appt.doctorName}</TableCell>
                                                    <TableCell>{format(new Date(appt.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}</TableCell>
                                                    <TableCell className="text-xs">{appt.services.map(s => s.name).join(', ')}</TableCell>
                                                    <TableCell className="font-mono">${appt.totalPrice.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(appt.paymentStatus === 'Pagado' ? 'bg-green-600 text-white' : '')}>
                                                            {appt.paymentStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={appt.attendance === 'Atendido' ? 'default' : appt.attendance === 'No Asistió' ? 'destructive' : 'secondary'}>
                                                            {appt.attendance}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPatientEditDialogOpen} onOpenChange={setIsPatientEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>Actualiza la información del paciente {editingPatient?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePatient}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="patient-name">Nombre Completo</Label>
                <Input id="patient-name" name="name" defaultValue={editingPatient?.name} required />
              </div>
              <div>
                <Label htmlFor="patient-email">Correo Electrónico</Label>
                <Input id="patient-email" name="email" type="email" defaultValue={editingPatient?.email} required />
              </div>
              <div>
                <Label htmlFor="patient-cedula">Cédula</Label>
                <Input id="patient-cedula" name="cedula" defaultValue={editingPatient?.cedula || ''} />
              </div>
              <div>
                <Label htmlFor="patient-phone">Teléfono</Label>
                <Input id="patient-phone" name="phone" defaultValue={editingPatient?.phone || ''} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este elemento?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente de la base de datos del sistema.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className={buttonVariants({variant: 'destructive'})}>
                Sí, eliminar
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings Dialogs */}
      <Dialog open={isCityDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingCity(null); setIsCityDialogOpen(isOpen); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingCity?.originalName ? `Editando "${editingCity.originalName}"` : 'Agregar Nueva Ciudad'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveCity}>
                <div className="py-4">
                    <Label htmlFor="city-name">Nombre de la Ciudad</Label>
                    <Input id="city-name" name="city-name" defaultValue={editingCity?.newName || ''} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Guardar Ciudad</Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      <Dialog open={isSpecialtyDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingSpecialty(null); setIsSpecialtyDialogOpen(isOpen); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingSpecialty?.originalName ? `Editando "${editingSpecialty.originalName}"` : 'Agregar Nueva Especialidad'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveSpecialty}>
                <div className="py-4">
                    <Label htmlFor="specialty-name">Nombre de la Especialidad</Label>
                    <Input id="specialty-name" name="specialty-name" defaultValue={editingSpecialty?.newName || ''} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Guardar Especialidad</Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isCompanyBankDetailDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingCompanyBankDetail(null); setIsCompanyBankDetailDialogOpen(isOpen); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingCompanyBankDetail ? 'Editar Cuenta de SUMA' : 'Agregar Nueva Cuenta de SUMA'}</DialogTitle>
                  <DialogDescription>Gestiona las cuentas donde los médicos pagarán sus suscripciones.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveBankDetail}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bankName" className="text-right">Banco</Label>
                        <Input id="bankName" name="bankName" defaultValue={editingCompanyBankDetail?.bank || ''} className="col-span-3" required />
                    </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accountHolder" className="text-right">Titular</Label>
                        <Input id="accountHolder" name="accountHolder" defaultValue={editingCompanyBankDetail?.accountHolder || ''} className="col-span-3" required />
                    </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="idNumber" className="text-right">C.I./R.I.F.</Label>
                        <Input id="idNumber" name="idNumber" defaultValue={editingCompanyBankDetail?.idNumber || ''} className="col-span-3" required />
                    </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accountNumber" className="text-right">Nro. Cuenta</Label>
                        <Input id="accountNumber" name="accountNumber" defaultValue={editingCompanyBankDetail?.accountNumber || ''} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descripción</Label>
                        <Input id="description" name="description" defaultValue={editingCompanyBankDetail?.description || ''} className="col-span-3" placeholder="Ej: Cuenta Principal, Zelle, etc."/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Guardar Cuenta</Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      <Dialog open={isCouponDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingCoupon(null); setIsCouponDialogOpen(isOpen); }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</DialogTitle>
                <DialogDescription>Completa la información para el cupón de descuento.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveCoupon}>
              <div className="space-y-4 py-4">
                  <div><Label>Código</Label><Input name="code" defaultValue={editingCoupon?.code} placeholder="VERANO20" required/></div>
                  <div><Label>Tipo de Descuento</Label>
                      <RadioGroup name="discountType" defaultValue={editingCoupon?.discountType || 'percentage'} className="flex gap-4 pt-2">
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="percentage" /> Porcentaje (%)</Label>
                          <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="fixed" /> Fijo ($)</Label>
                      </RadioGroup>
                  </div>
                  <div><Label>Valor</Label><Input name="value" type="number" defaultValue={editingCoupon?.value} placeholder="20" required/></div>
                  <div><Label>Alcance</Label>
                      <Select name="scope" defaultValue={editingCoupon?.scope.toString() || 'general'}>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="general">General (Todos los Médicos)</SelectItem>
                              {doctors.map(doc => <SelectItem key={doc.id} value={doc.id.toString()}>{doc.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit">Guardar Cupón</Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isExpenseDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingExpense(null); setIsExpenseDialogOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Editar Gasto' : 'Agregar Nuevo Gasto'}</DialogTitle>
            <DialogDescription>Registra un gasto operativo de la empresa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveExpense}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="expense-date">Fecha</Label>
                <Input id="expense-date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required />
              </div>
              <div>
                <Label htmlFor="expense-description">Descripción</Label>
                <Input id="expense-description" name="description" defaultValue={editingExpense?.description || ''} required />
              </div>
              <div>
                <Label htmlFor="expense-amount">Monto ($)</Label>
                <Input id="expense-amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount || ''} required />
              </div>
              <div>
                <Label htmlFor="expense-category">Categoría</Label>
                 <Select name="category" defaultValue={editingExpense?.category || 'operativo'}>
                    <SelectTrigger id="expense-category"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="operativo">Operativo</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{editingExpense ? 'Guardar Cambios' : 'Agregar Gasto'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Payment Proof Dialog */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
          </DialogHeader>
          <div className="py-4 relative aspect-video">
            {viewingProofUrl ? (
              <Image src={viewingProofUrl} alt="Comprobante" layout="fill" className="rounded-md object-contain" />
            ) : <p>No se pudo cargar el comprobante.</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

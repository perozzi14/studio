
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import { type Doctor, type SellerPayment, type MarketingMaterial, type AdminSupportTicket, type Seller, type BankDetail, type ChatMessage, type Expense, type DoctorPayment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, Users, DollarSign, Copy, CheckCircle, XCircle, Mail, Phone, Wallet, CalendarClock, Landmark, Eye, MessageSquarePlus, Ticket, Download, Image as ImageIcon, Video, FileText, Coins, PlusCircle, Pencil, Trash2, Loader2, Search, Send, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, getMonth, getYear, formatDistanceToNow, startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { useSettings } from '@/lib/settings';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSellerNotifications } from '@/lib/seller-notifications';


const BankDetailFormSchema = z.object({
  bank: z.string().min(3, "El nombre del banco es requerido."),
  accountHolder: z.string().min(3, "El nombre del titular es requerido."),
  idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
  accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
  description: z.string().nullable().optional(),
});

const SupportTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

const ExpenseFormSchema = z.object({
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser un número positivo."),
  date: z.string().min(1, "La fecha es requerida."),
});

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


const timeRangeLabels: Record<string, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año',
    all: 'Todos'
};


function MarketingMaterialCard({ material, onView }: { material: MarketingMaterial, onView: (m: MarketingMaterial) => void }) {
    const { toast } = useToast();
    
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(material.url);
      toast({ title: "Enlace copiado al portapapeles." });
    };

    return (
        <Card className="flex flex-col h-full cursor-pointer hover:border-primary transition-colors" onClick={() => onView(material)}>
            <CardContent className="p-0 flex-grow">
                <div className="aspect-video relative">
                    <Image src={material.thumbnailUrl} alt={material.title} fill className="object-cover rounded-t-lg" data-ai-hint="marketing material" />
                </div>
                <div className="p-4 space-y-2">
                    <Badge variant="secondary" className="capitalize w-fit">{material.type}</Badge>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{material.description}</CardDescription>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Enlace
                </Button>
                <Button className="w-full" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={material.url} target="_blank" rel="noopener noreferrer">
                       <Download className="mr-2 h-4 w-4" /> Descargar
                    </a>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cities, specialties } = useSettings();
  const { checkAndSetSellerNotifications } = useSellerNotifications();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [referredDoctors, setReferredDoctors] = useState<Doctor[]>([]);
  const [sellerPayments, setSellerPayments] = useState<SellerPayment[]>([]);
  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
  const [marketingMaterials, setMarketingMaterials] = useState<MarketingMaterial[]>([]);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);

  const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
  const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);
  
  const [isPaymentDetailDialogOpen, setIsPaymentDetailDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SellerPayment | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [doctorsToShow, setDoctorsToShow] = useState(10);
  
  const currentTab = searchParams.get('view') || 'referrals';
  
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [isSupportDetailDialogOpen, setIsSupportDetailDialogOpen] = useState(false);
  const [selectedSupportTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MarketingMaterial | null>(null);
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [isDoctorPaymentsDialogOpen, setIsDoctorPaymentsDialogOpen] = useState(false);
  const [selectedDoctorForPayments, setSelectedDoctorForPayments] = useState<Doctor | null>(null);
  
  const [expensePage, setExpensePage] = useState(1);
  const [expenseItemsPerPage, setExpenseItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'seller' || !user.id) return;
    setIsLoading(true);

    try {
        // Fetch global data like marketing materials separately for robustness
        const materials = await firestoreService.getMarketingMaterials();
        setMarketingMaterials(materials);

        // Fetch seller-specific data
        const [seller, allDocs, allPayments, allTickets, allDoctorPayments] = await Promise.all([
            firestoreService.getSeller(user.id),
            firestoreService.getDoctors(),
            firestoreService.getSellerPayments(),
            firestoreService.getSupportTickets(),
            firestoreService.getDoctorPayments(),
        ]);
        
        if (seller) {
            const referredDoctorIds = allDocs.filter(d => d.sellerId === seller.id).map(d => d.id);
            setSellerData(seller);
            setReferredDoctors(allDocs.filter(d => d.sellerId === seller.id));
            setSellerPayments(allPayments.filter(p => p.sellerId === seller.id));
            setDoctorPayments(allDoctorPayments.filter(p => referredDoctorIds.includes(p.doctorId)));
            setSupportTickets(allTickets.filter(t => t.userId === user.email));
        }
    } catch (error) {
        console.error("Error fetching seller data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del panel.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user?.id) {
        fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (user?.role === 'seller' && sellerData) {
        const userTickets = supportTickets.filter(t => t.userId === user.email);
        checkAndSetSellerNotifications(sellerPayments, userTickets, referredDoctors);
    }
  }, [user, sellerData, sellerPayments, supportTickets, referredDoctors, checkAndSetSellerNotifications]);

  const cityFeesMap = useMemo(() => new Map(cities.map(c => [c.name, c.subscriptionFee])), [cities]);

  const filteredSellerExpenses = useMemo(() => {
    if (!sellerData?.expenses) return [];
    
    if (timeRange === 'all') {
      return [...sellerData.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { locale: es });
        endDate = endOfDay(now);
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

    return sellerData.expenses
      .filter(e => {
        const expenseDate = new Date(e.date + 'T00:00:00');
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sellerData, timeRange]);

  const paginatedSellerExpenses = useMemo(() => {
    if (expenseItemsPerPage === -1) return filteredSellerExpenses;
    const startIndex = (expensePage - 1) * expenseItemsPerPage;
    return filteredSellerExpenses.slice(startIndex, startIndex + expenseItemsPerPage);
  }, [filteredSellerExpenses, expensePage, expenseItemsPerPage]);
  
  const totalExpensePages = useMemo(() => {
    if (expenseItemsPerPage === -1) return 1;
    return Math.ceil(filteredSellerExpenses.length / expenseItemsPerPage);
  }, [filteredSellerExpenses, expenseItemsPerPage]);


  const financeStats = useMemo(() => {
    if (!sellerData) return { totalReferred: 0, activeReferredCount: 0, pendingCommission: 0, totalEarned: 0, totalExpenses: 0, netProfit: 0, nextPaymentDate: '', currentPeriod: '', filteredPayments: [], filteredExpenses: [], activeReferred: [], doctorsForPendingCommission: [], hasBeenPaidThisPeriod: false };
    
    const now = new Date();
    const currentPeriod = format(now, "LLLL yyyy", { locale: es });
    
    const hasBeenPaidThisPeriod = sellerPayments.some(p => p.period.toLowerCase() === currentPeriod.toLowerCase());
    
    const activeReferred = referredDoctors.filter(d => d.status === 'active');
    
    let pendingCommission = 0;
    if (!hasBeenPaidThisPeriod) {
        pendingCommission = activeReferred.reduce((sum, doc) => {
            const fee = cityFeesMap.get(doc.city) || 0;
            return sum + (fee * sellerData.commissionRate);
        }, 0);
    }

    const doctorsForPendingCommission = hasBeenPaidThisPeriod ? [] : activeReferred;
    
    let startDate: Date, endDate: Date;

    let filteredPayments = sellerPayments;
    let filteredExpenses = sellerData.expenses || [];
    
    if (timeRange !== 'all') {
        switch (timeRange) {
            case 'today': startDate = startOfDay(now); endDate = endOfDay(now); break;
            case 'week': startDate = startOfWeek(now, { locale: es }); endDate = endOfDay(now); break;
            case 'year': startDate = startOfYear(now); endDate = endOfYear(now); break;
            case 'month': default: startDate = startOfMonth(now); endDate = endOfMonth(now); break;
        }

        filteredPayments = sellerPayments.filter(p => {
            const paymentDate = new Date(p.paymentDate + 'T00:00:00');
            return paymentDate >= startDate && paymentDate <= endDate;
        });

        filteredExpenses = (sellerData.expenses || []).filter(e => {
            const expenseDate = new Date(e.date + 'T00:00:00');
            return expenseDate >= startDate && expenseDate <= endDate;
        });
    }

    const totalEarned = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalEarned - totalExpenses;
    
    const nextPaymentMonth = getMonth(now) === 11 ? 0 : getMonth(now) + 1;
    const nextPaymentYear = getYear(now) === 11 ? getYear(now) + 1 : getYear(now);
    const nextPaymentDate = `16 de ${format(new Date(nextPaymentYear, nextPaymentMonth), 'LLLL', { locale: es })}`;
    
    return { 
        totalReferred: referredDoctors.length, 
        activeReferredCount: activeReferred.length, 
        pendingCommission,
        totalEarned, 
        totalExpenses,
        netProfit,
        nextPaymentDate,
        currentPeriod: currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1),
        filteredPayments,
        filteredExpenses,
        activeReferred,
        doctorsForPendingCommission,
        hasBeenPaidThisPeriod,
    };
  }, [referredDoctors, sellerPayments, sellerData, cityFeesMap, timeRange]);
  
  const filteredAndSortedDoctors = useMemo(() => {
    let doctors = [...referredDoctors]
        .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

    if (searchTerm) {
        doctors = doctors.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (cityFilter !== 'all') {
        doctors = doctors.filter(doc => doc.city === cityFilter);
    }

    if (doctorsToShow !== -1) {
        return doctors.slice(0, doctorsToShow);
    }

    return doctors;
  }, [referredDoctors, searchTerm, cityFilter, doctorsToShow]);

  const handleViewDoctorPayments = (doctor: Doctor) => {
    setSelectedDoctorForPayments(doctor);
    setIsDoctorPaymentsDialogOpen(true);
  };

   const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || user.role !== 'seller') return;
    setIsSubmittingTicket(true);

    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
    };

    const result = SupportTicketSchema.safeParse(dataToValidate);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
      setIsSubmittingTicket(false);
      return;
    }

    const newTicket: Omit<AdminSupportTicket, 'id' | 'messages'> = {
        userId: user.email,
        userName: user.name,
        userRole: 'seller',
        status: 'abierto',
        date: new Date().toISOString().split('T')[0],
        subject: result.data.subject,
        description: result.data.description,
    };
    
    try {
      await firestoreService.addSupportTicket(newTicket);
      fetchData();
      setIsSupportDialogOpen(false);
      (e.target as HTMLFormElement).reset();
      toast({ title: "Ticket Enviado", description: "Tu solicitud ha sido enviada al equipo de soporte de SUMA." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "No se pudo enviar el ticket."});
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleOpenBankDetailDialog = (bankDetail: BankDetail | null) => {
    setEditingBankDetail(bankDetail);
    setIsBankDetailDialogOpen(true);
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
        toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
        return;
    }
    
    if (!sellerData) return;
    
    const newBankDetail: BankDetail = {
      id: editingBankDetail ? editingBankDetail.id : `bank-${Date.now()}`,
      ...result.data,
    };
    
    let updatedBankDetails;
    if (editingBankDetail) {
      updatedBankDetails = sellerData.bankDetails.map(bd => bd.id === editingBankDetail.id ? newBankDetail : bd);
    } else {
      updatedBankDetails = [...sellerData.bankDetails, newBankDetail];
    }
    
    await firestoreService.updateSeller(sellerData.id, { bankDetails: updatedBankDetails });
    fetchData();
    setIsBankDetailDialogOpen(false);
    toast({ title: "Cuenta Bancaria Guardada" });
  };

  const handleDeleteBankDetail = async (bankDetailId: string) => {
    if (!sellerData) return;
    const updatedBankDetails = sellerData.bankDetails.filter(bd => bd.id !== bankDetailId);
    await firestoreService.updateSeller(sellerData.id, { bankDetails: updatedBankDetails });
    fetchData();
    toast({ title: "Cuenta Bancaria Eliminada" });
  };

  const handleViewPaymentDetails = (payment: SellerPayment) => {
    setSelectedPayment(payment);
    setIsPaymentDetailDialogOpen(true);
  };
  
  const handleViewTicket = (ticket: AdminSupportTicket) => {
    setSelectedSupportTicket(ticket);
    setIsSupportDetailDialogOpen(true);
  };

  const handleSendSellerReply = async () => {
    if (!selectedSupportTicket || !replyMessage.trim() || !user) return;

    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        sender: 'user',
        text: replyMessage.trim(),
    };

    await firestoreService.addMessageToSupportTicket(selectedSupportTicket.id, newMessage);

    const updatedTicket = {
        ...selectedSupportTicket,
        messages: [
            ...((selectedSupportTicket.messages || [])),
            { ...newMessage, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() }
        ]
    };
    setSelectedSupportTicket(updatedTicket);

    setReplyMessage("");
    fetchData();
  };

  const handleOpenExpenseDialog = (expense: Expense | null) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sellerData) return;
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
        description: formData.get('expenseDescription') as string,
        amount: parseFloat(formData.get('expenseAmount') as string) || 0,
        date: formData.get('expenseDate') as string,
    };
    const result = ExpenseFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
        return;
    }
    
    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : `expense-${Date.now()}`,
      ...result.data,
    };

    let updatedExpenses;
    if (editingExpense) {
        updatedExpenses = (sellerData.expenses || []).map(exp => exp.id === editingExpense.id ? newExpense : exp);
    } else {
        updatedExpenses = [...(sellerData.expenses || []), newExpense];
    }

    await firestoreService.updateSeller(sellerData.id, { expenses: updatedExpenses });
    fetchData();
    setIsExpenseDialogOpen(false);
    toast({ title: "Gasto Guardado" });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!sellerData) return;
    const updatedExpenses = (sellerData.expenses || []).filter(exp => exp.id !== expenseId);
    await firestoreService.updateSeller(sellerData.id, { expenses: updatedExpenses });
    fetchData();
    toast({ title: "Gasto Eliminado" });
  };

  const handleViewMaterial = (material: MarketingMaterial) => {
    setSelectedMaterial(material);
    setIsMaterialDetailOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || user.role !== 'seller') return;

    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      name: formData.get('doc-name') as string,
      email: formData.get('doc-email') as string,
      password: formData.get('doc-password') as string,
      confirmPassword: formData.get('doc-confirm-password') as string,
      specialty: formData.get('doc-specialty') as string,
      city: formData.get('doc-city') as string,
      address: formData.get('doc-address') as string,
      slotDuration: parseInt(formData.get('doc-slot-duration') as string, 10),
      consultationFee: parseInt(formData.get('doc-consultation-fee') as string, 10),
    };

    const result = DoctorFormSchema.safeParse(dataToValidate);

    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(' ');
      toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
      return;
    }
    
    if (!result.data.password) {
      toast({ variant: 'destructive', title: 'Contraseña Requerida', description: 'Debe establecer una contraseña para los nuevos médicos.' });
      return;
    }

    const existingUser = await firestoreService.findUserByEmail(result.data.email);
    if (existingUser) {
        toast({ variant: 'destructive', title: 'Correo ya registrado', description: 'Este correo electrónico ya está en uso por otro usuario.' });
        return;
    }

    const { name, email, specialty, city, address, password, slotDuration, consultationFee } = result.data;
    
    const joinDate = new Date();
    const paymentDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    if (joinDate.getDate() < 15) {
        paymentDate.setMonth(paymentDate.getMonth() + 1);
    } else {
        paymentDate.setMonth(paymentDate.getMonth() + 2);
    }

    const newDoctorData: Omit<Doctor, 'id'> = {
        name, email, specialty, city, address,
        password: password,
        sellerId: user.id,
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
        slotDuration: slotDuration,
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
    
    try {
        await firestoreService.addDoctor(newDoctorData);
        toast({ title: 'Médico Registrado', description: `El Dr. ${name} ha sido añadido como tu referido.` });
        fetchData();
        setIsDoctorDialogOpen(false);
    } catch (error) {
        console.error("Error adding doctor:", error);
        toast({ variant: 'destructive', title: 'Error al registrar', description: 'No se pudo crear el médico en la base de datos.' });
    }
  };



  if (isLoading || !user || user.role !== 'seller' || !sellerData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${sellerData.referralCode}`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
            <h1 className="text-3xl font-bold font-headline mb-2">Panel de Vendedora</h1>
            <p className="text-muted-foreground mb-8">Bienvenida de nuevo, {user.name}. Aquí puedes gestionar tus médicos y finanzas.</p>

            <>
                {currentTab === 'referrals' && (
                  <div className="mt-6">
                      <div className="space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><LinkIcon className="text-primary"/> Tu Enlace de Referido</CardTitle>
                                <CardDescription>Comparte este enlace con los médicos para que se registren bajo tu código.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-stretch gap-2">
                                <Input value={referralLink} readOnly className="text-sm bg-background flex-1"/>
                                <Button onClick={() => navigator.clipboard.writeText(referralLink)} className="w-full sm:w-auto">
                                    <Copy className="mr-2 h-4 w-4"/>
                                    Copiar Enlace
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <CardTitle>Mis Médicos Referidos</CardTitle>
                                        <CardDescription>
                                            Busca, filtra y registra los doctores que se han unido con tu enlace.
                                        </CardDescription>
                                    </div>
                                     <Button onClick={() => setIsDoctorDialogOpen(true)} className="w-full sm:w-auto">
                                        <PlusCircle className="mr-2 h-4 w-4"/> Registrar Médico
                                    </Button>
                                </div>
                                <div className="mt-4 flex flex-col md:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nombre..."
                                            className="pl-8 w-full"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Select value={cityFilter} onValueChange={setCityFilter}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Filtrar por ciudad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las ciudades</SelectItem>
                                            {cities.map((city) => (
                                                <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(doctorsToShow)} onValueChange={(val) => setDoctorsToShow(Number(val))}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Mostrar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">Mostrar 5</SelectItem>
                                            <SelectItem value="10">Mostrar 10</SelectItem>
                                            <SelectItem value="20">Mostrar 20</SelectItem>
                                            <SelectItem value="-1">Mostrar Todos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table className="hidden md:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Médico</TableHead><TableHead>Contacto</TableHead><TableHead>Especialidad</TableHead>
                                            <TableHead>Ubicación</TableHead><TableHead>Fecha de Registro</TableHead><TableHead className="text-center">Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAndSortedDoctors.length > 0 ? filteredAndSortedDoctors.map((doctor) => (
                                            <TableRow key={doctor.id}>
                                                <TableCell className="font-medium">{doctor.name}</TableCell>
                                                <TableCell><div className="flex flex-col gap-1 text-xs">
                                                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{doctor.email}</span></span>
                                                    <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{doctor.whatsapp}</span></span>
                                                </div></TableCell>
                                                <TableCell>{doctor.specialty}</TableCell><TableCell>{doctor.city}, {doctor.sector}</TableCell>
                                                <TableCell>{format(new Date(doctor.joinDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                <TableCell className="text-center"><Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' && 'bg-green-600 text-white')}>
                                                    {doctor.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                    {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="icon" onClick={() => handleViewDoctorPayments(doctor)}>
                                                        <DollarSign className="h-4 w-4"/>
                                                        <span className="sr-only">Ver Pagos</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No se encontraron médicos con los filtros actuales.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="space-y-4 md:hidden">
                                    {filteredAndSortedDoctors.length > 0 ? filteredAndSortedDoctors.map((doctor) => (
                                        <div key={doctor.id} className="p-4 border rounded-lg space-y-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div><p className="font-bold">{doctor.name}</p><p className="text-sm text-muted-foreground">{doctor.specialty}</p></div>
                                                <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' && 'bg-green-600 text-white')}>
                                                    {doctor.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                    {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                                <div><p className="font-semibold text-xs text-muted-foreground mb-1">Ubicación</p><p>{doctor.city}</p></div>
                                                <div><p className="font-semibold text-xs text-muted-foreground mb-1">Fecha Registro</p><p>{format(new Date(doctor.joinDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</p></div>
                                                <div className="col-span-2"><p className="font-semibold text-xs text-muted-foreground mb-1">Contacto</p>
                                                    <div className="flex flex-col gap-1.5 text-xs">
                                                        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 flex-shrink-0" /> <span>{doctor.email}</span></span>
                                                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" /> <span>{doctor.whatsapp}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator />
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewDoctorPayments(doctor)}>
                                                <DollarSign className="mr-2 h-4 w-4" /> Ver Historial de Pagos
                                            </Button>
                                        </div>
                                    )) : (<div className="h-24 text-center flex items-center justify-center text-muted-foreground">No se encontraron médicos con los filtros actuales.</div>)}
                                </div>
                            </CardContent>
                        </Card>
                      </div>
                    </div>
                )}
                {currentTab === 'finances' && (
                  <div className="mt-6">
                      <div className="space-y-8">
                         <div className="w-full">
                            <div className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2">
                                <Button variant={timeRange === 'today' ? 'default' : 'outline'} onClick={() => setTimeRange('today')}>Hoy</Button>
                                <Button variant={timeRange === 'week' ? 'default' : 'outline'} onClick={() => setTimeRange('week')}>Esta Semana</Button>
                                <Button variant={timeRange === 'month' ? 'default' : 'outline'} onClick={() => setTimeRange('month')}>Este Mes</Button>
                                <Button variant={timeRange === 'year' ? 'default' : 'outline'} onClick={() => setTimeRange('year')}>Este Año</Button>
                                <Button variant={timeRange === 'all' ? 'default' : 'outline'} onClick={() => setTimeRange('all')}>Todos</Button>
                            </div>
                        </div>

                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Comisión Pendiente</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${financeStats.pendingCommission.toFixed(2)}</div><p className="text-xs text-muted-foreground">{financeStats.activeReferredCount} médicos activos</p></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Recibidos</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${financeStats.totalEarned.toFixed(2)}</div><p className="text-xs text-muted-foreground">Pagos de SUMA ({timeRangeLabels[timeRange]})</p></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gastos</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">${financeStats.totalExpenses.toFixed(2)}</div><p className="text-xs text-muted-foreground">Gastos ({timeRangeLabels[timeRange]})</p></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${financeStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${financeStats.netProfit.toFixed(2)}</div><p className="text-xs text-muted-foreground">Ingresos - Gastos ({timeRangeLabels[timeRange]})</p></CardContent></Card>
                        </div>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle>Desglose de Comisiones Pendientes</CardTitle>
                                <CardDescription>
                                    {financeStats.hasBeenPaidThisPeriod 
                                        ? `La comisión para el período de ${financeStats.currentPeriod} ya fue procesada.`
                                        : `Desglose de tu próxima comisión para el período de ${financeStats.currentPeriod}. El pago se realizará el ${financeStats.nextPaymentDate}.`
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Médico Activo</TableHead>
                                            <TableHead>Fecha de Ingreso</TableHead>
                                            <TableHead className="text-right">Comisión Estimada</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financeStats.doctorsForPendingCommission.length > 0 ? (
                                            financeStats.doctorsForPendingCommission.map(doctor => (
                                                <TableRow key={doctor.id}>
                                                    <TableCell className="font-medium">{doctor.name}</TableCell>
                                                    <TableCell>{format(new Date(doctor.joinDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</TableCell>
                                                    <TableCell className="text-right font-mono">${((cityFeesMap.get(doctor.city) || 0) * (sellerData?.commissionRate || 0)).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center">
                                                    {financeStats.hasBeenPaidThisPeriod ? "Comisión de este mes ya pagada." : "No tienes médicos activos para generar comisiones."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter className="justify-end font-bold bg-muted/50 py-3">
                                <div className="flex items-center gap-4 text-lg">
                                    <span>Total Pendiente:</span>
                                    <span className="text-amber-600">${financeStats.pendingCommission.toFixed(2)}</span>
                                </div>
                            </CardFooter>
                        </Card>

                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Landmark/> Historial de Pagos de SUMA</CardTitle>
                                <CardDescription>Registro de todas las comisiones que has recibido.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table className="hidden md:table">
                                    <TableHeader><TableRow><TableHead>Fecha de Pago</TableHead><TableHead>Período de Comisión</TableHead><TableHead>Médicos Pagados</TableHead><TableHead className="text-right">Monto Recibido</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {financeStats.filteredPayments.length > 0 ? financeStats.filteredPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium">{format(new Date(payment.paymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                <TableCell>{payment.period}</TableCell><TableCell>{payment.includedDoctors.length}</TableCell>
                                                <TableCell className="text-right font-mono text-green-600 font-semibold">${payment.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-center"><Button variant="outline" size="sm" onClick={() => handleViewPaymentDetails(payment)}><Eye className="mr-2 h-4 w-4"/>Ver Detalles</Button></TableCell>
                                            </TableRow>
                                        )) : (<TableRow><TableCell colSpan={5} className="h-24 text-center">No has recibido pagos en este período.</TableCell></TableRow>)}
                                    </TableBody>
                                </Table>
                                <div className="space-y-4 md:hidden">
                                     {financeStats.filteredPayments.length > 0 ? financeStats.filteredPayments.map((payment) => (
                                        <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div><p className="font-semibold">{payment.period}</p><p className="text-sm text-muted-foreground">Pagado el {format(new Date(payment.paymentDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</p></div>
                                                <p className="text-lg font-bold font-mono text-green-600">${payment.amount.toFixed(2)}</p>
                                            </div><Separator/>
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewPaymentDetails(payment)}><Eye className="mr-2 h-4 w-4"/>Ver Detalles del Pago</Button>
                                        </div>
                                     )) : (<div className="h-24 text-center flex items-center justify-center text-muted-foreground">No has recibido pagos en este período.</div>)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div><CardTitle>Registro de Gastos</CardTitle><CardDescription>Administra tus gastos operativos.</CardDescription></div>
                                <Button onClick={() => handleOpenExpenseDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {paginatedSellerExpenses.length > 0 ? paginatedSellerExpenses.map(expense => (
                                            <TableRow key={expense.id}>
                                                <TableCell>{format(new Date(expense.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                                <TableCell className="font-medium">{expense.description}</TableCell>
                                                <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-center"><div className="flex items-center justify-center gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => handleOpenExpenseDialog(expense)}><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div></TableCell>
                                            </TableRow>
                                        )) : (<TableRow><TableCell colSpan={4} className="text-center h-24">No hay gastos registrados en este período.</TableCell></TableRow>)}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Página {expensePage} de {totalExpensePages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={String(expenseItemsPerPage)}
                                        onValueChange={(value) => {
                                            setExpenseItemsPerPage(Number(value));
                                            setExpensePage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-28">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 / página</SelectItem>
                                            <SelectItem value="20">20 / página</SelectItem>
                                            <SelectItem value="50">50 / página</SelectItem>
                                            <SelectItem value="-1">Todos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setExpensePage(p => Math.max(1, p - 1))}
                                        disabled={expensePage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setExpensePage(p => Math.min(totalExpensePages, p + 1))}
                                        disabled={expensePage === totalExpensePages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                  </div>
                )}
                {currentTab === 'accounts' && (
                  <div className="mt-6">
                      <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div><CardTitle className="flex items-center gap-2"><Coins /> Mis Cuentas Bancarias</CardTitle><CardDescription>Gestiona tus cuentas para recibir los pagos de comisiones.</CardDescription></div>
                          <Button onClick={() => handleOpenBankDetailDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2"/> Agregar Cuenta</Button>
                      </CardHeader>
                      <CardContent>
                          <Table className="hidden md:table">
                              <TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Descripción</TableHead><TableHead>Titular</TableHead><TableHead>Nro. de Cuenta</TableHead><TableHead>C.I./R.I.F.</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {(sellerData.bankDetails || []).map(bd => (
                                      <TableRow key={bd.id}>
                                          <TableCell className="font-medium">{bd.bank}</TableCell>
                                          <TableCell className="text-muted-foreground">{bd.description || '-'}</TableCell>
                                          <TableCell>{bd.accountHolder}</TableCell>
                                          <TableCell>{bd.accountNumber}</TableCell>
                                          <TableCell>{bd.idNumber}</TableCell>
                                          <TableCell className="text-center"><div className="flex items-center justify-center gap-2">
                                              <Button variant="outline" size="icon" onClick={() => handleOpenBankDetailDialog(bd)}><Pencil className="h-4 w-4" /></Button>
                                              <Button variant="destructive" size="icon" onClick={() => handleDeleteBankDetail(bd.id)}><Trash2 className="h-4 w-4" /></Button>
                                          </div></TableCell>
                                      </TableRow>
                                  ))}
                                  {(sellerData.bankDetails || []).length === 0 && (<TableRow><TableCell colSpan={6} className="text-center h-24">No tienes cuentas bancarias registradas.</TableCell></TableRow>)}
                              </TableBody>
                          </Table>
                          <div className="space-y-4 md:hidden">
                              {(sellerData.bankDetails || []).length > 0 ? (sellerData.bankDetails || []).map(bd => (
                                  <div key={bd.id} className="p-4 border rounded-lg space-y-4">
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                          <div><p className="text-xs text-muted-foreground">Banco</p><p className="font-medium">{bd.bank}</p></div>
                                          <div><p className="text-xs text-muted-foreground">Descripción</p><p className="font-medium">{bd.description || '-'}</p></div>
                                          <div><p className="text-xs text-muted-foreground">Titular</p><p className="font-medium">{bd.accountHolder}</p></div>
                                          <div><p className="text-xs text-muted-foreground">Nro. Cuenta</p><p className="font-mono text-sm">{bd.accountNumber}</p></div>
                                          <div className="col-span-2"><p className="text-xs text-muted-foreground">C.I./R.I.F.</p><p className="font-mono text-sm">{bd.idNumber}</p></div>
                                      </div>
                                      <Separator />
                                      <div className="flex justify-end gap-2">
                                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenBankDetailDialog(bd)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                          <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteBankDetail(bd.id)}><Trash2 className="mr-2 h-4 w-4" /> Borrar</Button>
                                      </div>
                                  </div>
                              )) : (<p className="text-center text-muted-foreground py-8">No tienes cuentas bancarias registradas.</p>)}
                          </div>
                      </CardContent>
                    </Card>
                </div>
                )}
                {currentTab === 'marketing' && (
                  <div className="mt-6">
                      <Card>
                        <CardHeader><CardTitle>Material de Marketing</CardTitle><CardDescription>Recursos proporcionados por SUMA para ayudarte a promocionar la plataforma.</CardDescription></CardHeader>
                        <CardContent>
                            {marketingMaterials.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {marketingMaterials.map(material => (<MarketingMaterialCard key={material.id} material={material} onView={handleViewMaterial} />))}
                                </div>
                            ) : (<p className="text-center text-muted-foreground py-12">No hay materiales de marketing disponibles en este momento.</p>)}
                        </CardContent>
                    </Card>
                </div>
                )}
                {currentTab === 'support' && (
                  <div className="mt-6">
                      <Card>
                        <CardHeader><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div><CardTitle>Soporte Técnico</CardTitle><CardDescription>Gestiona tus tickets de soporte con el equipo de SUMA.</CardDescription></div>
                            <Button onClick={() => setIsSupportDialogOpen(true)}><MessageSquarePlus className="mr-2 h-4 w-4"/> Crear Nuevo Ticket</Button>
                        </div></CardHeader>
                        <CardContent>
                           <Table>
                              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Asunto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                              <TableBody>
                              {(supportTickets || []).map(ticket => (
                                  <TableRow key={ticket.id}>
                                      <TableCell>{format(new Date(ticket.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                                      <TableCell><Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>{ticket.status}</Badge></TableCell>
                                      <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}><Eye className="mr-2 h-4 w-4" /> Ver</Button></TableCell>
                                  </TableRow>
                              ))}
                               {(supportTickets || []).length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No tienes tickets de soporte.</TableCell></TableRow>)}
                              </TableBody>
                          </Table>
                        </CardContent>
                    </Card>
                </div>
                )}
            </>
        </div>
      </main>

        <Dialog open={isBankDetailDialogOpen} onOpenChange={setIsBankDetailDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingBankDetail ? "Editar Cuenta Bancaria" : "Agregar Nueva Cuenta"}</DialogTitle><DialogDescription>{editingBankDetail ? "Modifica los detalles de esta cuenta." : "Añade una nueva cuenta para recibir tus comisiones."}</DialogDescription></DialogHeader>
                <form onSubmit={handleSaveBankDetail}><div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="bankName" className="text-right">Banco</Label><Input id="bankName" name="bankName" defaultValue={editingBankDetail?.bank} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="accountHolder" className="text-right">Titular</Label><Input id="accountHolder" name="accountHolder" defaultValue={editingBankDetail?.accountHolder} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="idNumber" className="text-right">C.I./R.I.F.</Label><Input id="idNumber" name="idNumber" defaultValue={editingBankDetail?.idNumber} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="accountNumber" className="text-right">Nro. Cuenta</Label><Input id="accountNumber" name="accountNumber" defaultValue={editingBankDetail?.accountNumber} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Descripción</Label><Input id="description" name="description" defaultValue={editingBankDetail?.description || ''} className="col-span-3" placeholder="Ej: Cuenta en Dólares" /></div>
                </div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Cambios</Button></DialogFooter></form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isPaymentDetailDialogOpen} onOpenChange={setIsPaymentDetailDialogOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Detalles del Pago</DialogTitle><DialogDescription>Resumen del pago de comisiones para el período {selectedPayment?.period}.</DialogDescription></DialogHeader>
                {selectedPayment && (
                    <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-1">
                            <p><span className="font-semibold">Fecha de Pago:</span> {format(new Date(selectedPayment.paymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                            <p><span className="font-semibold">ID de Transacción:</span> <span className="font-mono text-xs">{selectedPayment.transactionId}</span></p>
                        </div><Separator/>
                        <div><h4 className="font-semibold mb-2">Comprobante de Pago de SUMA</h4><div className="relative aspect-video"><Image src={selectedPayment.paymentProofUrl} alt="Comprobante de pago" fill className="rounded-md border object-contain" data-ai-hint="payment receipt"/></div></div><Separator/>
                        <div>
                            <h4 className="font-semibold mb-2">Desglose de la Comisión</h4>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Médico</TableHead>
                                        <TableHead className="text-right">Comisión Generada</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedPayment.includedDoctors.map(doc => (
                                        <TableRow key={doc.id}>
                                            <TableCell>{doc.name}</TableCell>
                                            <TableCell className="text-right font-mono">${doc.commissionAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-bold">Total Recibido</TableCell>
                                        <TableCell className="text-right font-bold text-green-600 text-lg font-mono">${selectedPayment.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </div>
                )}
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingExpense ? "Editar Gasto" : "Agregar Nuevo Gasto"}</DialogTitle><DialogDescription>Registra un nuevo gasto para llevar un control financiero.</DialogDescription></DialogHeader>
                <form onSubmit={handleSaveExpense}><div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseDate" className="text-right">Fecha</Label><Input id="expenseDate" name="expenseDate" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseDescription" className="text-right">Descripción</Label><Input name="expenseDescription" defaultValue={editingExpense?.description} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseAmount" className="text-right">Monto ($)</Label><Input name="expenseAmount" type="number" defaultValue={editingExpense?.amount} className="col-span-3" /></div>
                </div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Gasto</Button></DialogFooter></form>
            </DialogContent>
        </Dialog>

         <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Abrir un Ticket de Soporte</DialogTitle><DialogDescription>Describe tu problema y el equipo de SUMA se pondrá en contacto contigo.</DialogDescription></DialogHeader>
                <form onSubmit={handleCreateTicket}><div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="subject" className="text-right">Asunto</Label><Input id="subject" name="subject" placeholder="ej., Problema con un referido" className="col-span-3" required /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Descripción</Label><Textarea id="description" name="description" placeholder="Detalla tu inconveniente aquí..." className="col-span-3" rows={5} required /></div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isSubmittingTicket}>
                    {isSubmittingTicket && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Ticket
                  </Button>
                </DialogFooter></form>
            </DialogContent>
        </Dialog>

        <Dialog open={isSupportDetailDialogOpen} onOpenChange={setIsSupportDetailDialogOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ticket de Soporte: {selectedSupportTicket?.subject}</DialogTitle>
                </DialogHeader>
                {selectedSupportTicket && (
                    <>
                        <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto pr-4">
                            {(selectedSupportTicket.messages || []).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((msg) => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'user' && 'justify-end')}>
                                    {msg.sender === 'admin' && <Avatar className="h-8 w-8"><AvatarFallback>A</AvatarFallback></Avatar>}
                                    <div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(new Date(msg.timestamp), { locale: es, addSuffix: true })}</p>
                                    </div>
                                    {msg.sender === 'user' && <Avatar className="h-8 w-8"><AvatarImage src={sellerData?.profileImage} /><AvatarFallback>{(selectedSupportTicket.userName || 'U').charAt(0)}</AvatarFallback></Avatar>}
                                </div>
                            ))}
                        </div>

                        {selectedSupportTicket.status === 'abierto' && (
                            <div className="flex items-center gap-2 border-t pt-4">
                                <Textarea 
                                    placeholder="Escribe tu respuesta..." 
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    rows={2}
                                />
                                <Button onClick={handleSendSellerReply} disabled={!replyMessage.trim()} size="icon">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <DialogFooter className="pt-4">
                            <Button variant="outline" onClick={() => setIsSupportDetailDialogOpen(false)}>Cerrar Ventana</Button></DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
        <Dialog open={isMaterialDetailOpen} onOpenChange={setIsMaterialDetailOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedMaterial?.title}</DialogTitle>
                    <DialogDescription className="capitalize flex items-center gap-2">
                        {selectedMaterial?.type === 'image' && <ImageIcon className="h-4 w-4"/>}
                        {selectedMaterial?.type === 'video' && <Video className="h-4 w-4"/>}
                        {selectedMaterial?.type === 'file' && <FileText className="h-4 w-4"/>}
                        {selectedMaterial?.type === 'url' && <LinkIcon className="h-4 w-4"/>}
                        {selectedMaterial?.type}
                    </DialogDescription>
                </DialogHeader>
                {selectedMaterial && (
                    <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        {(selectedMaterial.type === 'image' || selectedMaterial.type === 'video') &&
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                                {selectedMaterial.type === 'image' && <Image src={selectedMaterial.url} alt={selectedMaterial.title} layout="fill" className="object-contain" />}
                                {selectedMaterial.type === 'video' && <video src={selectedMaterial.url} controls className="w-full h-full" />}
                            </div>
                        }
                        <div>
                            <h4 className="font-semibold mb-1">Descripción Detallada</h4>
                            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{selectedMaterial.description}</p>
                        </div>
                    </div>
                )}
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="outline" className="w-full" onClick={() => {
                        if (!selectedMaterial) return;
                        navigator.clipboard.writeText(selectedMaterial.url);
                        toast({ title: "Enlace copiado al portapapeles." });
                    }}>
                        <Copy className="mr-2"/> Copiar Enlace
                    </Button>
                    <Button className="w-full" asChild>
                        <a href={selectedMaterial?.url} target="_blank" rel="noopener noreferrer" download>
                           <Download className="mr-2"/> Descargar
                        </a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Médico</DialogTitle>
                    <DialogDescription>
                        Completa la información del perfil del médico. Quedará registrado como tu referido.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveDoctor}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-name" className="text-right">Nombre</Label>
                            <Input id="doc-name" name="doc-name" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-email" className="text-right">Email</Label>
                            <Input id="doc-email" name="doc-email" type="email" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-password" className="text-right">Contraseña</Label>
                            <Input id="doc-password" name="doc-password" type="password" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-confirm-password" className="text-right">Confirmar</Label>
                            <Input id="doc-confirm-password" name="doc-confirm-password" type="password" className="col-span-3" required />
                        </div>
                        <p className="col-start-2 col-span-3 text-xs text-muted-foreground">Mínimo 8 caracteres, con mayúsculas, minúsculas y números.</p>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-specialty" className="text-right">Especialidad</Label>
                            <Select name="doc-specialty">
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                                <SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-address" className="text-right">Dirección</Label>
                            <Input id="doc-address" name="doc-address" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-city" className="text-right">Ciudad</Label>
                            <Select name="doc-city">
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                                <SelectContent>{cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-slot-duration" className="text-right">Duración Cita (min)</Label>
                            <Input id="doc-slot-duration" name="doc-slot-duration" type="number" defaultValue="30" className="col-span-3" required min="5"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doc-consultation-fee" className="text-right">Tarifa Consulta ($)</Label>
                            <Input id="doc-consultation-fee" name="doc-consultation-fee" type="number" defaultValue={20} className="col-span-3" required min="0"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit">Guardar Médico</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isDoctorPaymentsDialogOpen} onOpenChange={setIsDoctorPaymentsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Historial de Pagos de {selectedDoctorForPayments?.name}</DialogTitle>
                    <DialogDescription>
                        Lista de todos los pagos de suscripción realizados por este médico.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctorPayments.filter(p => p.doctorId === selectedDoctorForPayments?.id).length > 0 ? (
                                doctorPayments
                                    .filter(p => p.doctorId === selectedDoctorForPayments?.id)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{format(new Date(payment.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge className={cn({
                                                    'bg-green-600 text-white': payment.status === 'Paid',
                                                    'bg-amber-500 text-white': payment.status === 'Pending',
                                                    'bg-red-600 text-white': payment.status === 'Rejected',
                                                })}>
                                                    {payment.status === 'Paid' ? 'Pagado' : payment.status === 'Pending' ? 'En Revisión' : 'Rechazado'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        Este médico no tiene pagos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

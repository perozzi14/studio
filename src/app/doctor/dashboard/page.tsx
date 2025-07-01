
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import { type Appointment, type Doctor, type ChatMessage, type Service, type BankDetail, type Coupon, type Expense, type Schedule, DaySchedule, DoctorPayment, AdminSupportTicket } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { 
    Users, DollarSign, Wallet, CalendarClock, MessageSquarePlus, Ticket, Coins, PlusCircle, Pencil, Trash2, Loader2, Search, Send, TrendingDown, TrendingUp, ChevronLeft, ChevronRight,
    UserCircle, Edit, Link as LinkIcon, Download, Eye, Upload, Video, FileText, Image as ImageIcon, ClipboardList, CalendarDays, Clock, ThumbsUp, ThumbsDown, CheckCircle, XCircle, MessageSquare, FileDown, Briefcase, Calendar, Lock, Shield, X, AlertCircle, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfMonth, startOfMonth, endOfYear, startOfYear, parseISO, formatDistanceToNow, addHours } from 'date-fns';
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
import { useSettings } from '@/lib/settings';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

const BankDetailFormSchema = z.object({
  bank: z.string().min(3, "El nombre del banco es requerido."),
  accountHolder: z.string().min(3, "El nombre del titular es requerido."),
  idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
  accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
  description: z.string().optional(),
});

const ServiceFormSchema = z.object({
  name: z.string().min(3, "El nombre del servicio es requerido."),
  price: z.preprocess((val) => Number(val), z.number().min(0, "El precio no puede ser negativo.")),
});

const CouponFormSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.preprocess((val) => Number(val), z.number().positive("El valor debe ser positivo.")),
});

const ExpenseFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.preprocess((val) => Number(val), z.number().positive("El monto debe ser un número positivo.")),
});

const SupportTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

const DoctorProfileSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  cedula: z.string().min(6, "La cédula es requerida.").optional().or(z.literal('')),
  whatsapp: z.string().min(10, "El WhatsApp es requerido.").optional().or(z.literal('')),
  address: z.string().min(5, "La dirección es requerida."),
  sector: z.string().min(3, "El sector es requerido."),
  consultationFee: z.preprocess((val) => Number(val), z.number().min(0, "La tarifa no puede ser negativa.")),
  slotDuration: z.preprocess((val) => Number(val), z.number().min(5, "La duración debe ser al menos 5 minutos.")),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida."),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const timeRangeLabels: Record<string, string> = {
  today: 'Hoy', week: 'Esta Semana', month: 'Este Mes', year: 'Este Año', all: 'Global',
};

export default function DoctorDashboardPage() {
    const { user, updateUser, changePassword } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { cities } = useSettings();

    const [isLoading, setIsLoading] = useState(true);
    const [doctorData, setDoctorData] = useState<Doctor | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);
    const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);

    const currentTab = searchParams.get('view') || 'appointments';
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

    // Dialog states
    const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
    const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
    const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
    const [isSupportDetailOpen, setIsSupportDetailOpen] = useState(false);
    const [isPaymentReportOpen, setIsPaymentReportOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isScheduleSaved, setIsScheduleSaved] = useState(true);
    
    // Entity states for dialogs
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [selectedSupportTicket, setSelectedSupportTicket] = useState<AdminSupportTicket | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'expense' | 'service' | 'bank' | 'coupon', id: string } | null>(null);

    // Form states
    const [chatMessage, setChatMessage] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [tempSchedule, setTempSchedule] = useState<Schedule | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

    const fetchData = useCallback(async () => {
        if (!user || user.role !== 'doctor' || !user.id) return;
        setIsLoading(true);
        try {
            const [doc, apps, tickets, payments] = await Promise.all([
                firestoreService.getDoctor(user.id),
                firestoreService.getDoctorAppointments(user.id),
                firestoreService.getSupportTickets(),
                firestoreService.getDoctorPayments(),
            ]);
            setDoctorData(doc);
            setTempSchedule(doc?.schedule || null);
            setAppointments(apps);
            setSupportTickets(tickets.filter(t => t.userId === user.email));
            setDoctorPayments(payments.filter(p => p.doctorId === user.id));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error de carga', description: 'No se pudieron cargar los datos del panel.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user?.id) { fetchData(); }
    }, [user, fetchData]);
    
    useEffect(() => {
      if (user === undefined) return;
      if (user === null || user.role !== 'doctor') { router.push('/auth/login'); }
    }, [user, router]);
    
    const cityFeesMap = useMemo(() => new Map(cities.map(c => [c.name, c.subscriptionFee])), [cities]);

    const financialStats = useMemo(() => {
        if (!doctorData) return { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
        
        let filteredAppointments = appointments;
        let filteredExpenses = doctorData.expenses || [];

        if (timeRange !== 'all') {
            const now = new Date();
            let startDate: Date, endDate: Date;
            switch (timeRange) {
                case 'today': startDate = startOfDay(now); endDate = endOfDay(now); break;
                case 'week': startDate = startOfWeek(now, { locale: es }); endDate = endOfDay(now); break;
                case 'year': startDate = startOfYear(now); endDate = endOfYear(now); break;
                case 'month': default: startDate = startOfMonth(now); endDate = endOfMonth(now); break;
            }
            
            filteredAppointments = appointments.filter(a => {
                const apptDate = parseISO(a.date);
                return apptDate >= startDate && apptDate <= endDate;
            });
            filteredExpenses = (doctorData.expenses || []).filter(e => {
                const expenseDate = parseISO(e.date);
                return expenseDate >= startDate && expenseDate <= endDate;
            });
        }
        
        const totalRevenue = filteredAppointments.filter(a => a.paymentStatus === 'Pagado').reduce((sum, a) => sum + a.totalPrice, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

        return { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
    }, [doctorData, appointments, timeRange]);

    const { todayAppointments, tomorrowAppointments, upcomingAppointments, pastAppointments } = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
  
      const todayStr = format(today, 'yyyy-MM-dd');
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
      const tA: Appointment[] = [];
      const tmA: Appointment[] = [];
      const uA: Appointment[] = [];
      const pA: Appointment[] = [];
  
      appointments.forEach(appt => {
        const apptDate = new Date(appt.date + 'T00:00:00');
        if (appt.attendance !== 'Pendiente' || apptDate < today) {
          pA.push(appt);
        } else if (format(apptDate, 'yyyy-MM-dd') === todayStr) {
          tA.push(appt);
        } else if (format(apptDate, 'yyyy-MM-dd') === tomorrowStr) {
          tmA.push(appt);
        } else if (apptDate > tomorrow) {
          uA.push(appt);
        }
      });
  
      return {
        todayAppointments: tA.sort((a,b) => a.time.localeCompare(b.time)),
        tomorrowAppointments: tmA.sort((a,b) => a.time.localeCompare(b.time)),
        upcomingAppointments: uA.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        pastAppointments: pA.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    }, [appointments]);

    const handleUpdateAppointment = async (id: string, data: Partial<Appointment>) => {
        await firestoreService.updateAppointment(id, data);
        fetchData();
        toast({ title: 'Cita actualizada' });
        setIsAppointmentDetailOpen(false);
    };

    const handleOpenDialog = (type: 'appointment' | 'chat', appointment: Appointment) => {
        setSelectedAppointment(appointment);
        if (type === 'appointment') setIsAppointmentDetailOpen(true);
        else if (type === 'chat') setIsChatOpen(true);
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !selectedAppointment || !user) return;
        setIsSendingMessage(true);
        try {
            await firestoreService.addMessageToAppointment(selectedAppointment.id, { sender: 'doctor', text: chatMessage.trim() });
            setChatMessage("");
            await fetchData();
            const updatedAppointment = appointments.find(a => a.id === selectedAppointment.id);
            if (updatedAppointment) setSelectedAppointment(updatedAppointment);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleSaveEntity = async (type: 'expense' | 'service' | 'bank' | 'coupon', data: any) => {
        if (!doctorData) return;
        const listKey = type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services';
        const list = (doctorData[listKey as keyof Doctor] || []) as any[];
        const editingEntity = type === 'expense' ? editingExpense : type === 'service' ? editingService : type === 'bank' ? editingBankDetail : editingCoupon;
        
        let newList;
        if (editingEntity) {
            newList = list.map(item => item.id === editingEntity.id ? { ...item, ...data } : item);
        } else {
            newList = [...list, { ...data, id: `${type}-${Date.now()}` }];
        }
        
        await firestoreService.updateDoctor(doctorData.id, { [listKey]: newList });
        await fetchData();
        toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} guardado.` });
        
        if (type === 'expense') setIsExpenseDialogOpen(false);
        if (type === 'service') setIsServiceDialogOpen(false);
        if (type === 'bank') setIsBankDetailDialogOpen(false);
        if (type === 'coupon') setIsCouponDialogOpen(false);
    };
    
    const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!doctorData) return;
        const formData = new FormData(e.currentTarget);
        const dataToValidate = {
          name: formData.get('name') as string,
          cedula: formData.get('cedula') as string,
          whatsapp: formData.get('whatsapp') as string,
          address: formData.get('address') as string,
          sector: formData.get('sector') as string,
          consultationFee: formData.get('consultationFee') as string,
          slotDuration: formData.get('slotDuration') as string,
          description: formData.get('description') as string,
        };

        const result = DoctorProfileSchema.safeParse(dataToValidate);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
            return;
        }
        
        let profileImageUrl = doctorData.profileImage;
        if (profileImageFile) { profileImageUrl = 'https://placehold.co/400x400.png'; }
        
        let bannerImageUrl = doctorData.bannerImage;
        if (bannerImageFile) { bannerImageUrl = 'https://placehold.co/1200x400.png'; }

        await firestoreService.updateDoctor(doctorData.id, {...result.data, profileImage: profileImageUrl, bannerImage: bannerImageUrl});
        toast({ title: 'Perfil Actualizado' });
        fetchData();
    }
    
    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            currentPassword: formData.get('currentPassword') as string,
            newPassword: formData.get('newPassword') as string,
            confirmPassword: formData.get('confirmPassword') as string
        };
        const result = PasswordChangeSchema.safeParse(data);
        if(!result.success){
            toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
            return;
        }
        const {success, message} = await changePassword(result.data.currentPassword, result.data.newPassword);
        if(success){
            toast({title: 'Éxito', description: message});
            setIsPasswordDialogOpen(false);
        } else {
            toast({variant: 'destructive', title: 'Error', description: message});
        }
    }

    const handleScheduleChange = (day: keyof Schedule, field: 'active' | 'slot', value: any, slotIndex?: number) => {
        if (!tempSchedule) return;
        const newSchedule = { ...tempSchedule };
        if (field === 'active') {
            newSchedule[day].active = value;
        } else if (field === 'slot' && slotIndex !== undefined) {
            newSchedule[day].slots[slotIndex] = value;
        }
        setTempSchedule(newSchedule);
        setIsScheduleSaved(false);
    };

    const handleAddSlot = (day: keyof Schedule) => {
        if (!tempSchedule) return;
        const newSchedule = { ...tempSchedule };
        newSchedule[day].slots.push({ start: '09:00', end: '10:00' });
        setTempSchedule(newSchedule);
        setIsScheduleSaved(false);
    };

    const handleRemoveSlot = (day: keyof Schedule, slotIndex: number) => {
        if (!tempSchedule) return;
        const newSchedule = { ...tempSchedule };
        newSchedule[day].slots.splice(slotIndex, 1);
        setTempSchedule(newSchedule);
        setIsScheduleSaved(false);
    };
    
    const handleSaveSchedule = async () => {
        if(!doctorData || !tempSchedule) return;
        await firestoreService.updateDoctor(doctorData.id, { schedule: tempSchedule });
        toast({ title: 'Horario Guardado', description: 'Tu disponibilidad ha sido actualizada.' });
        setIsScheduleSaved(true);
        fetchData();
    }


    const handleDeleteItem = async () => {
        if (!itemToDelete || !doctorData) return;
        const { type, id } = itemToDelete;
        const listKey = type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services';
        const list = (doctorData[listKey as keyof Doctor] || []) as any[];
        const newList = list.filter(item => item.id !== id);
        
        await firestoreService.updateDoctor(doctorData.id, { [listKey]: newList });
        
        await fetchData();
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
        toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.` });
    };

    const handleReportPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!doctorData || !paymentProofFile) {
            toast({ variant: 'destructive', title: 'Falta el comprobante', description: 'Por favor, sube el archivo del comprobante de pago.' });
            return;
        }
        const formData = new FormData(e.currentTarget);
        const transactionId = formData.get('transactionId') as string;
        const amount = parseFloat(formData.get('amount') as string);
        
        await firestoreService.addDoctorPayment({
            doctorId: doctorData.id,
            doctorName: doctorData.name,
            date: new Date().toISOString().split('T')[0],
            amount: amount,
            status: 'Pending',
            transactionId,
            paymentProofUrl: 'https://placehold.co/400x300.png',
        });
        
        await firestoreService.updateDoctor(doctorData.id, { subscriptionStatus: 'pending_payment' });
        await fetchData();
        setIsPaymentReportOpen(false);
        toast({ title: 'Pago Reportado', description: 'Tu pago está en revisión por el equipo de SUMA.' });
    };

    const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || user.role !== 'doctor') return;
        const formData = new FormData(e.currentTarget);
        const data = { subject: formData.get('subject') as string, description: formData.get('description') as string };
        const result = SupportTicketSchema.safeParse(data);
        if(!result.success){
            toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(e => e.message).join(' ') });
            return;
        }
        await firestoreService.addSupportTicket({ ...result.data, userId: user.email, userName: user.name, userRole: 'doctor', status: 'abierto', date: new Date().toISOString().split('T')[0] });
        fetchData();
        setIsSupportDialogOpen(false);
        toast({ title: 'Ticket Enviado' });
    }

    if (isLoading || !user || !doctorData) {
        return (
          <div className="flex flex-col min-h-screen"> <Header /> <main className="flex-1 container py-12 flex items-center justify-center"> <Loader2 className="h-8 w-8 animate-spin text-primary" /> </main> </div>
        );
    }
    
    const subscriptionFee = cityFeesMap.get(doctorData.city) || 0;
    const daysOfWeek: (keyof Schedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels: Record<keyof Schedule, string> = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 bg-muted/40">
                <div className="container py-12">
                    <h1 className="text-3xl font-bold font-headline mb-2">Panel del Médico</h1>
                    <p className="text-muted-foreground mb-8">Bienvenido de nuevo, {user.name}.</p>
                    
                    {currentTab === 'appointments' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <Card>
                                    <CardHeader><CardTitle>Citas de Hoy ({todayAppointments.length})</CardTitle></CardHeader>
                                    <CardContent>
                                        {todayAppointments.length > 0 ? (
                                            <div className="space-y-4">{todayAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} onOpenDialog={handleOpenDialog} />)}</div>
                                        ) : <p className="text-muted-foreground text-center py-4">No tienes citas para hoy.</p>}
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader><CardTitle>Citas de Mañana ({tomorrowAppointments.length})</CardTitle></CardHeader>
                                    <CardContent>
                                        {tomorrowAppointments.length > 0 ? (
                                            <div className="space-y-4">{tomorrowAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} onOpenDialog={handleOpenDialog} />)}</div>
                                        ) : <p className="text-muted-foreground text-center py-4">No tienes citas para mañana.</p>}
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader><CardTitle>Próximas Citas ({upcomingAppointments.length})</CardTitle></CardHeader>
                                <CardContent>
                                    {upcomingAppointments.length > 0 ? (
                                        <div className="space-y-4">{upcomingAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} onOpenDialog={handleOpenDialog} />)}</div>
                                    ) : <p className="text-muted-foreground text-center py-4">No tienes más citas agendadas.</p>}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Historial de Citas ({pastAppointments.length})</CardTitle></CardHeader>
                                <CardContent>
                                    {pastAppointments.length > 0 ? (
                                        <div className="space-y-4">{pastAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} onOpenDialog={handleOpenDialog} isPast={true} />)}</div>
                                    ) : <p className="text-muted-foreground text-center py-4">No tienes citas en tu historial.</p>}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {currentTab === 'finances' && (
                        <div className="space-y-6">
                            <div className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2">
                                <Button variant={timeRange === 'today' ? 'default' : 'outline'} onClick={() => setTimeRange('today')}>Hoy</Button>
                                <Button variant={timeRange === 'week' ? 'default' : 'outline'} onClick={() => setTimeRange('week')}>Semana</Button>
                                <Button variant={timeRange === 'month' ? 'default' : 'outline'} onClick={() => setTimeRange('month')}>Mes</Button>
                                <Button variant={timeRange === 'year' ? 'default' : 'outline'} onClick={() => setTimeRange('year')}>Año</Button>
                                <Button variant={timeRange === 'all' ? 'default' : 'outline'} onClick={() => setTimeRange('all')}>Global</Button>
                            </div>
                           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${financialStats.totalRevenue.toFixed(2)}</div><p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p></CardContent></Card>
                                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gastos</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">${financialStats.totalExpenses.toFixed(2)}</div><p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p></CardContent></Card>
                                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${financialStats.netProfit.toFixed(2)}</div><p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p></CardContent></Card>
                            </div>
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div><CardTitle>Registro de Gastos</CardTitle><CardDescription>Administra tus gastos operativos y de consultorio.</CardDescription></div>
                                    <Button onClick={() => { setEditingExpense(null); setIsExpenseDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto</Button>
                                </CardHeader>
                                <CardContent><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>{(doctorData?.expenses || []).length > 0 ? doctorData.expenses.map(expense => ( <TableRow key={expense.id}><TableCell>{format(new Date(expense.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</TableCell><TableCell className="font-medium">{expense.description}</TableCell><TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell><TableCell className="text-center"><div className="flex items-center justify-center gap-2"><Button variant="outline" size="icon" onClick={() => { setEditingExpense(expense); setIsExpenseDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => { setItemToDelete({type: 'expense', id: expense.id}); setIsDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)) : (<TableRow><TableCell colSpan={4} className="text-center h-24">No hay gastos registrados.</TableCell></TableRow>)}</TableBody></Table></CardContent>
                            </Card>
                        </div>
                    )}
                    
                    {currentTab === 'subscription' && (
                       <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Shield /> Mi Suscripción</CardTitle><CardDescription>Gestiona tu membresía en SUMA para seguir recibiendo pacientes.</CardDescription></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div className="md:col-span-2 space-y-1"><p className="text-sm text-muted-foreground">Estado Actual</p><Badge className={cn('capitalize text-base px-3 py-1', {'bg-green-600 text-white': doctorData.subscriptionStatus === 'active', 'bg-amber-500 text-white': doctorData.subscriptionStatus === 'pending_payment','bg-red-600 text-white': doctorData.subscriptionStatus === 'inactive'})}>{doctorData.subscriptionStatus === 'active' ? 'Activa' : doctorData.subscriptionStatus === 'pending_payment' ? 'Pago en Revisión' : 'Inactiva'}</Badge></div>
                                    <div className="space-y-1"><p className="text-sm text-muted-foreground">Monto de Suscripción</p><p className="text-2xl font-bold">${subscriptionFee.toFixed(2)}<span className="text-base font-normal text-muted-foreground">/mes</span></p></div>
                                     <div className="space-y-1"><p className="text-sm text-muted-foreground">Último Pago</p><p className="font-semibold">{doctorData.lastPaymentDate ? format(new Date(doctorData.lastPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es }) : 'N/A'}</p></div>
                                    <div className="space-y-1"><p className="text-sm text-muted-foreground">Próximo Vencimiento</p><p className="font-semibold">{doctorData.nextPaymentDate ? format(new Date(doctorData.nextPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es }) : 'N/A'}</p></div>
                                </div>
                                <Card className="bg-muted/30"><CardHeader><CardTitle>Reportar un Pago</CardTitle><CardDescription>¿Ya realizaste el pago de tu suscripción? Repórtalo aquí para que el equipo de SUMA lo verifique.</CardDescription></CardHeader><CardContent><Button onClick={() => setIsPaymentReportOpen(true)} disabled={doctorData.subscriptionStatus === 'pending_payment'}><Upload className="mr-2 h-4 w-4" /> Reportar Pago</Button></CardContent></Card>
                                <Card><CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead><TableHead>ID Transacción</TableHead><TableHead className="text-right">Comprobante</TableHead></TableRow></TableHeader><TableBody>{doctorPayments.length > 0 ? ([...doctorPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => ( <TableRow key={p.id}><TableCell>{format(new Date(p.date + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</TableCell><TableCell>${p.amount.toFixed(2)}</TableCell><TableCell><Badge className={cn({'bg-green-600 text-white': p.status === 'Paid', 'bg-amber-500 text-white': p.status === 'Pending', 'bg-red-600 text-white': p.status === 'Rejected'})}>{p.status === 'Paid' ? 'Pagado' : p.status === 'Pending' ? 'En Revisión' : 'Rechazado'}</Badge></TableCell><TableCell className="font-mono text-xs">{p.transactionId}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" asChild><a href={p.paymentProofUrl || '#'} target="_blank" rel="noopener noreferrer" >Ver</a></Button></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={5} className="h-24 text-center">No hay pagos registrados.</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
                            </CardContent>
                       </Card>
                    )}

                    {currentTab === 'profile' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Perfil Público</CardTitle><CardDescription>Esta información será visible para los pacientes.</CardDescription></CardHeader>
                                <form onSubmit={handleSaveProfile}><CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="name">Nombre Completo</Label><Input id="name" name="name" defaultValue={doctorData.name} /></div>
                                        <div className="space-y-2"><Label htmlFor="cedula">Cédula</Label><Input id="cedula" name="cedula" defaultValue={doctorData.cedula} /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="whatsapp">Nro. WhatsApp</Label><Input id="whatsapp" name="whatsapp" defaultValue={doctorData.whatsapp} /></div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="address">Dirección</Label><Input id="address" name="address" defaultValue={doctorData.address} /></div>
                                        <div className="space-y-2"><Label htmlFor="sector">Sector</Label><Input id="sector" name="sector" defaultValue={doctorData.sector} /></div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="consultationFee">Tarifa Consulta ($)</Label><Input id="consultationFee" name="consultationFee" type="number" defaultValue={doctorData.consultationFee} /></div>
                                        <div className="space-y-2"><Label htmlFor="slotDuration">Duración Cita (min)</Label><Input id="slotDuration" name="slotDuration" type="number" defaultValue={doctorData.slotDuration} /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="description">Descripción Profesional</Label><Textarea id="description" name="description" defaultValue={doctorData.description} rows={5}/></div>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2"><Label>Foto de Perfil</Label><Image src={profileImageFile ? URL.createObjectURL(profileImageFile) : doctorData.profileImage} alt="Perfil" width={100} height={100} className="rounded-full border" /><Input type="file" onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)} /></div>
                                        <div className="space-y-2"><Label>Imagen de Banner</Label><Image src={bannerImageFile ? URL.createObjectURL(bannerImageFile) : doctorData.bannerImage} alt="Banner" width={300} height={100} className="rounded-md border aspect-video object-cover" /><Input type="file" onChange={(e) => setBannerImageFile(e.target.files?.[0] || null)} /></div>
                                    </div>
                                </CardContent><CardFooter><Button type="submit">Guardar Perfil</Button></CardFooter></form>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Seguridad</CardTitle><CardDescription>Cambia tu contraseña.</CardDescription></CardHeader>
                                <CardContent><Button onClick={() => setIsPasswordDialogOpen(true)}>Cambiar Contraseña</Button></CardContent>
                            </Card>
                        </div>
                    )}

                    {currentTab === 'services' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mis Servicios</CardTitle><Button onClick={() => {setEditingService(null); setIsServiceDialogOpen(true);}}><PlusCircle className="mr-2"/>Añadir Servicio</Button></CardHeader>
                            <CardContent><Table><TableHeader><TableRow><TableHead>Nombre del Servicio</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-center w-[120px]">Acciones</TableHead></TableRow></TableHeader><TableBody>{doctorData.services?.length > 0 ? doctorData.services.map(service => (<TableRow key={service.id}><TableCell className="font-medium">{service.name}</TableCell><TableCell className="text-right font-mono">${service.price.toFixed(2)}</TableCell><TableCell className="text-center"><div className="flex justify-center gap-2"><Button variant="outline" size="icon" onClick={() => {setEditingService(service); setIsServiceDialogOpen(true);}}><Pencil className="h-4 w-4"/></Button><Button variant="destructive" size="icon" onClick={() => {setItemToDelete({type: 'service', id: service.id}); setIsDeleteDialogOpen(true);}}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="text-center h-24">No has registrado servicios adicionales.</TableCell></TableRow>}</TableBody></Table></CardContent>
                        </Card>
                    )}

                    {currentTab === 'schedule' && (
                        <Card>
                            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between"><CardTitle>Mi Horario</CardTitle><Button onClick={handleSaveSchedule} disabled={isScheduleSaved}>{isScheduleSaved ? <CheckCircle className="mr-2"/> : <Loader2 className="mr-2 animate-spin"/>} {isScheduleSaved ? 'Horario Guardado' : 'Guardar Cambios'}</Button></CardHeader>
                            <CardContent className="space-y-4">
                                {tempSchedule && daysOfWeek.map(day => (
                                    <div key={day} className="border p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">{dayLabels[day]}</h3><div className="flex items-center gap-2"><Label htmlFor={`switch-${day}`}>Atiende</Label><Switch id={`switch-${day}`} checked={tempSchedule[day].active} onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)} /></div></div>
                                        {tempSchedule[day].active && (
                                            <div className="space-y-2">
                                                {tempSchedule[day].slots.map((slot, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Input type="time" value={slot.start} onChange={(e) => handleScheduleChange(day, 'slot', {...slot, start: e.target.value}, index)} />
                                                        <Input type="time" value={slot.end} onChange={(e) => handleScheduleChange(day, 'slot', {...slot, end: e.target.value}, index)} />
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(day, index)}><X className="h-4 w-4"/></Button>
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={() => handleAddSlot(day)}>+ Añadir bloque</Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {currentTab === 'bank-details' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mis Cuentas Bancarias</CardTitle><Button onClick={() => {setEditingBankDetail(null); setIsBankDetailDialogOpen(true);}}><PlusCircle className="mr-2"/>Añadir Cuenta</Button></CardHeader>
                            <CardContent><Table><TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Titular</TableHead><TableHead className="text-right">Número de Cuenta</TableHead><TableHead className="text-center w-[120px]">Acciones</TableHead></TableRow></TableHeader><TableBody>{doctorData.bankDetails?.length > 0 ? doctorData.bankDetails.map(bd => (<TableRow key={bd.id}><TableCell className="font-medium">{bd.bank}</TableCell><TableCell>{bd.accountHolder}</TableCell><TableCell className="text-right font-mono">{bd.accountNumber}</TableCell><TableCell className="text-center"><div className="flex justify-center gap-2"><Button variant="outline" size="icon" onClick={() => {setEditingBankDetail(bd); setIsBankDetailDialogOpen(true);}}><Pencil className="h-4 w-4"/></Button><Button variant="destructive" size="icon" onClick={() => {setItemToDelete({type: 'bank', id: bd.id}); setIsDeleteDialogOpen(true);}}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>)) : <TableRow><TableCell colSpan={4} className="text-center h-24">No has registrado cuentas bancarias.</TableCell></TableRow>}</TableBody></Table></CardContent>
                        </Card>
                    )}

                    {currentTab === 'coupons' && (
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mis Cupones</CardTitle><Button onClick={() => {setEditingCoupon(null); setIsCouponDialogOpen(true);}}><PlusCircle className="mr-2"/>Añadir Cupón</Button></CardHeader>
                            <CardContent><Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center w-[120px]">Acciones</TableHead></TableRow></TableHeader><TableBody>{doctorData.coupons?.length > 0 ? doctorData.coupons.map(coupon => (<TableRow key={coupon.id}><TableCell className="font-mono font-semibold">{coupon.code}</TableCell><TableCell className="capitalize">{coupon.discountType === 'fixed' ? 'Monto Fijo' : 'Porcentaje'}</TableCell><TableCell className="text-right font-mono">{coupon.discountType === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}</TableCell><TableCell className="text-center"><div className="flex justify-center gap-2"><Button variant="outline" size="icon" onClick={() => {setEditingCoupon(coupon); setIsCouponDialogOpen(true);}}><Pencil className="h-4 w-4"/></Button><Button variant="destructive" size="icon" onClick={() => {setItemToDelete({type: 'coupon', id: coupon.id}); setIsDeleteDialogOpen(true);}}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>)) : <TableRow><TableCell colSpan={4} className="text-center h-24">No has creado cupones.</TableCell></TableRow>}</TableBody></Table></CardContent>
                        </Card>
                    )}

                    {currentTab === 'chat' && (
                        <Card>
                            <CardHeader><CardTitle>Chat con Pacientes</CardTitle><CardDescription>Aquí puedes comunicarte directamente con tus pacientes.</CardDescription></CardHeader>
                            <CardContent className="text-center text-muted-foreground py-12"><p>Por favor, ve a la sección de "Citas" y selecciona una cita para iniciar un chat.</p></CardContent>
                        </Card>
                    )}

                    {currentTab === 'support' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Soporte Técnico</CardTitle><Button onClick={() => setIsSupportDialogOpen(true)}><PlusCircle className="mr-2"/>Abrir Ticket</Button></CardHeader>
                            <CardContent><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Asunto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{supportTickets.length > 0 ? supportTickets.map(ticket => (<TableRow key={ticket.id}><TableCell>{format(parseISO(ticket.date), "dd MMM, yyyy", { locale: es })}</TableCell><TableCell>{ticket.subject}</TableCell><TableCell><Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>{ticket.status}</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => {setSelectedSupportTicket(ticket); setIsSupportDetailOpen(true);}}>Ver</Button></TableCell></TableRow>)) : <TableRow><TableCell colSpan={4} className="text-center h-24">No tienes tickets de soporte.</TableCell></TableRow>}</TableBody></Table></CardContent>
                        </Card>
                    )}
                </div>
            </main>
            
            <AppointmentDetailDialog 
                isOpen={isAppointmentDetailOpen} 
                onOpenChange={setIsAppointmentDetailOpen} 
                appointment={selectedAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onOpenChat={handleOpenDialog}
            />

            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Chat con {selectedAppointment?.patientName}</DialogTitle>
                    <DialogDescription>
                        Conversación sobre la cita del {selectedAppointment && format(addHours(parseISO(selectedAppointment.date), 5), 'dd MMM yyyy', { locale: es })}.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 h-96 flex flex-col gap-4 bg-muted/50 rounded-lg">
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                        {(selectedAppointment?.messages || []).map((msg) => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'doctor' && 'justify-end')}>
                            {msg.sender === 'patient' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{selectedAppointment?.patientName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'doctor' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}>
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(parseISO(msg.timestamp), { locale: es, addSuffix: true })}</p>
                            </div>
                            {msg.sender === 'doctor' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={doctorData.profileImage} />
                                    <AvatarFallback>{doctorData.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                        <Input 
                        placeholder="Escribe tu mensaje..." 
                        className="flex-1"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={isSendingMessage}
                        />
                        <Button type="submit" disabled={isSendingMessage || !chatMessage.trim()}>
                        {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                    </div>
                    <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                        Cerrar
                        </Button>
                    </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Cambiar Contraseña</DialogTitle></DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                        <div><Label htmlFor="currentPassword">Contraseña Actual</Label><Input id="currentPassword" name="currentPassword" type="password" required /></div>
                        <div><Label htmlFor="newPassword">Nueva Contraseña</Label><Input id="newPassword" name="newPassword" type="password" required /></div>
                        <div><Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label><Input id="confirmPassword" name="confirmPassword" type="password" required /></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Actualizar Contraseña</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaymentReportOpen} onOpenChange={setIsPaymentReportOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reportar Pago de Suscripción</DialogTitle><DialogDescription>Completa la información para que verifiquemos tu pago.</DialogDescription></DialogHeader>
                    <form onSubmit={handleReportPayment} className="space-y-4 py-4">
                        <div><Label>Monto a Pagar</Label><Input value={`$${subscriptionFee.toFixed(2)}`} disabled /></div>
                        <div><Label htmlFor="transactionId">ID o Referencia de Transacción</Label><Input id="transactionId" name="transactionId" required/></div>
                        <div><Label htmlFor="amount">Monto Exacto Pagado</Label><Input id="amount" name="amount" type="number" step="0.01" required/></div>
                        <div><Label htmlFor="paymentProofFile">Comprobante de Pago</Label><Input id="paymentProofFile" type="file" required onChange={(e) => setPaymentProofFile(e.target.files ? e.target.files[0] : null)} /></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Reportar Pago</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {name: fd.get('name') as string, price: parseFloat(fd.get('price') as string)}; const result = ServiceFormSchema.safeParse(data); if(result.success) handleSaveEntity('service', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="name">Nombre del Servicio</Label><Input id="name" name="name" defaultValue={editingService?.name || ''} required/></div>
                        <div><Label htmlFor="price">Precio ($)</Label><Input id="price" name="price" type="number" step="0.01" defaultValue={editingService?.price || ''} required/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isBankDetailDialogOpen} onOpenChange={setIsBankDetailDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingBankDetail ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {bank: fd.get('bank') as string, accountHolder: fd.get('accountHolder') as string, idNumber: fd.get('idNumber') as string, accountNumber: fd.get('accountNumber') as string, description: fd.get('description') as string}; const result = BankDetailFormSchema.safeParse(data); if(result.success) handleSaveEntity('bank', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="bank">Banco</Label><Input id="bank" name="bank" defaultValue={editingBankDetail?.bank || ''} required/></div>
                        <div><Label htmlFor="accountHolder">Titular</Label><Input id="accountHolder" name="accountHolder" defaultValue={editingBankDetail?.accountHolder || ''} required/></div>
                        <div><Label htmlFor="idNumber">CI/RIF del Titular</Label><Input id="idNumber" name="idNumber" defaultValue={editingBankDetail?.idNumber || ''} required/></div>
                        <div><Label htmlFor="accountNumber">Número de Cuenta</Label><Input id="accountNumber" name="accountNumber" defaultValue={editingBankDetail?.accountNumber || ''} required/></div>
                        <div><Label htmlFor="description">Descripción (Opcional)</Label><Input id="description" name="description" defaultValue={editingBankDetail?.description || ''}/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</DialogTitle></DialogHeader>
                     <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {code: fd.get('code') as string, discountType: fd.get('discountType') as 'percentage' | 'fixed', value: parseFloat(fd.get('value') as string)}; const result = CouponFormSchema.safeParse(data); if(result.success) handleSaveEntity('coupon', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="code">Código del Cupón</Label><Input id="code" name="code" defaultValue={editingCoupon?.code || ''} required/></div>
                        <div><Label htmlFor="discountType">Tipo</Label><Select name="discountType" defaultValue={editingCoupon?.discountType || 'fixed'}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fixed">Monto Fijo ($)</SelectItem><SelectItem value="percentage">Porcentaje (%)</SelectItem></SelectContent></Select></div>
                        <div><Label htmlFor="value">Valor</Label><Input id="value" name="value" type="number" step="0.01" defaultValue={editingCoupon?.value || ''} required/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {date: fd.get('date') as string, description: fd.get('description') as string, amount: parseFloat(fd.get('amount') as string)}; const result = ExpenseFormSchema.safeParse(data); if(result.success) handleSaveEntity('expense', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="date">Fecha</Label><Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required/></div>
                        <div><Label htmlFor="description">Descripción</Label><Input id="description" name="description" defaultValue={editingExpense?.description || ''} required/></div>
                        <div><Label htmlFor="amount">Monto ($)</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount || ''} required/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Crear Ticket de Soporte</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
                        <div><Label htmlFor="subject">Asunto</Label><Input id="subject" name="subject" required/></div>
                        <div><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" required rows={5}/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Enviar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <Dialog open={isSupportDetailOpen} onOpenChange={setIsSupportDetailOpen}>
                <DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Ticket: {selectedSupportTicket?.subject}</DialogTitle></DialogHeader>
                    {selectedSupportTicket && (<div className="space-y-4">
                        <div className="max-h-80 overflow-y-auto space-y-4 p-4 bg-muted/50 rounded-lg">{(selectedSupportTicket.messages || []).map(msg => <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'doctor' && 'justify-end')}><div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'doctor' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}><p className="text-sm">{msg.text}</p><p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(parseISO(msg.timestamp), { locale: es, addSuffix: true })}</p></div></div>)}</div>
                        {selectedSupportTicket.status === 'abierto' && <div className="flex gap-2"><Input value={chatMessage} onChange={e=>setChatMessage(e.target.value)} placeholder="Escribe tu respuesta..."/><Button onClick={()=>{firestoreService.addMessageToSupportTicket(selectedSupportTicket.id, {sender: 'doctor', text: chatMessage}); setChatMessage(''); fetchData();}}><Send/></Button></div>}
                    </div>)}
                </DialogContent>
            </Dialog>
             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente y no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteItem} className={cn(buttonVariants({variant: 'destructive'}))}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function AppointmentCard({ appointment, onOpenDialog, isPast = false }: { appointment: Appointment, onOpenDialog: (type: 'appointment' | 'chat', appointment: Appointment) => void, isPast?: boolean }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <p className="font-bold text-lg">{appointment.patientName}</p>
                <div className="flex items-center text-sm gap-4 pt-1 text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {format(addHours(parseISO(appointment.date),5), 'dd MMM yyyy', {locale: es})}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {appointment.time}</span>
                </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
              <p className="font-bold text-lg">${appointment.totalPrice.toFixed(2)}</p>
                <div className="flex flex-col gap-2 items-end">
                    {isPast ? (
                        <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': appointment.attendance === 'Atendido'})}>
                            {appointment.attendance}
                        </Badge>
                    ) : (
                    <>
                        <Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn({'bg-green-600 text-white': appointment.paymentStatus === 'Pagado'})}>
                            {appointment.paymentStatus}
                        </Badge>
                        {appointment.patientConfirmationStatus === 'Pendiente' && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <HelpCircle className="mr-1 h-3 w-3" />
                            Por confirmar
                        </Badge>
                        )}
                        {appointment.patientConfirmationStatus === 'Confirmada' && (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Confirmada
                        </Badge>
                        )}
                        {appointment.patientConfirmationStatus === 'Cancelada' && (
                        <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Cancelada
                        </Badge>
                        )}
                    </>
                    )}
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 border-t mt-4 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onOpenDialog('chat', appointment)}><MessageSquare className="mr-2 h-4 w-4"/> Chat</Button>
            <Button size="sm" onClick={() => onOpenDialog('appointment', appointment)}><Eye className="mr-2 h-4 w-4"/> Ver Detalles</Button>
          </CardFooter>
        </Card>
    )
}

function AppointmentDetailDialog({
  isOpen,
  onOpenChange,
  appointment,
  onUpdateAppointment,
  onOpenChat,
}: {
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  appointment: Appointment | null,
  onUpdateAppointment: (id: string, data: Partial<Appointment>) => void,
  onOpenChat: (type: 'chat', appointment: Appointment) => void,
}) {
    if (!appointment) return null;
    
    const [clinicalNotes, setClinicalNotes] = useState(appointment.clinicalNotes || "");
    const [prescription, setPrescription] = useState(appointment.prescription || "");

    useEffect(() => {
        if (appointment) {
            setClinicalNotes(appointment.clinicalNotes || "");
            setPrescription(appointment.prescription || "");
        }
    }, [appointment]);

    const handleSaveRecord = () => {
        onUpdateAppointment(appointment.id, { clinicalNotes, prescription });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detalles de la Cita</DialogTitle>
                    <DialogDescription>Cita con {appointment.patientName} el {format(addHours(parseISO(appointment.date), 5), 'dd MMM yyyy', { locale: es })} a las {appointment.time}.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle className="text-base">Información del Paciente</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <p><strong>Nombre:</strong> {appointment.patientName}</p>
                            </CardContent>
                        </Card>
                        <Card><CardHeader><CardTitle className="text-base">Detalles del Pago</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <p><strong>Total:</strong> <span className="font-mono font-semibold">${appointment.totalPrice.toFixed(2)}</span></p>
                                <p><strong>Método:</strong> <span className="capitalize">{appointment.paymentMethod}</span></p>
                                <div className="flex items-center gap-2"><strong>Estado:</strong><Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn({'bg-green-600 text-white': appointment.paymentStatus === 'Pagado'})}>{appointment.paymentStatus}</Badge></div>
                                {appointment.paymentMethod === 'transferencia' && (
                                    <a href={appointment.paymentProof || '#'} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({variant: 'outline', size: 'sm'}), 'w-full mt-2')}>
                                        <Eye className="mr-2 h-4 w-4"/> Ver Comprobante
                                    </a>
                                )}
                                {appointment.paymentStatus === 'Pendiente' && appointment.paymentMethod === 'transferencia' && (
                                    <Button size="sm" className="w-full mt-2" onClick={() => onUpdateAppointment(appointment.id, { paymentStatus: 'Pagado' })}>
                                        <CheckCircle className="mr-2 h-4 w-4"/> Aprobar Pago
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Gestión de la Cita</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {appointment.attendance === 'Pendiente' ? (
                                <div className="flex items-center gap-4">
                                    <Label>Asistencia del Paciente:</Label>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant={appointment.attendance === 'Atendido' ? 'default' : 'outline'} onClick={() => onUpdateAppointment(appointment.id, { attendance: 'Atendido' })}> <ThumbsUp className="mr-2 h-4 w-4"/>Atendido </Button>
                                        <Button size="sm" variant={appointment.attendance === 'No Asistió' ? 'destructive' : 'outline'} onClick={() => onUpdateAppointment(appointment.id, { attendance: 'No Asistió' })}> <ThumbsDown className="mr-2 h-4 w-4"/>No Asistió </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Label>Asistencia:</Label>
                                    <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': appointment.attendance === 'Atendido'})}>
                                        {appointment.attendance}
                                    </Badge>
                                </div>
                            )}

                            {appointment.attendance === 'Atendido' && (
                                <div className="space-y-4 border-t pt-4">
                                    <div><Label htmlFor="clinicalNotes">Historia Clínica / Notas</Label><Textarea id="clinicalNotes" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} rows={5} placeholder="Añade notas sobre la consulta..." /></div>
                                    <div><Label htmlFor="prescription">Récipé e Indicaciones</Label><Textarea id="prescription" value={prescription} onChange={(e) => setPrescription(e.target.value)} rows={5} placeholder="Añade el récipe y las indicaciones médicas..." /></div>
                                    <Button onClick={handleSaveRecord}><CheckCircle className="mr-2 h-4 w-4"/> Guardar Resumen Clínico</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter className="gap-2 sm:justify-end">
                    <Button type="button" variant="ghost" onClick={() => { onOpenChat('chat', appointment); onOpenChange(false); }}><MessageSquare className="mr-2 h-4 w-4" />Abrir Chat</Button>
                    <DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

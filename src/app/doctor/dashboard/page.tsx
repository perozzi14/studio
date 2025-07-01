
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import { type Appointment, type Doctor, type ChatMessage, type Service, type BankDetail, type Coupon, type Expense, type Schedule, DaySchedule, DoctorPayment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { 
    Users, DollarSign, Wallet, CalendarClock, MessageSquarePlus, Ticket, Coins, PlusCircle, Pencil, Trash2, Loader2, Search, Send, TrendingDown, TrendingUp, ChevronLeft, ChevronRight,
    UserCircle, Edit, Link as LinkIcon, Download, Eye, Upload, Video, FileText, Image as ImageIcon, ClipboardList, CalendarDays, Clock, ThumbsUp, ThumbsDown, CheckCircle, XCircle, MessageSquare, FileDown, Briefcase, Calendar, Lock, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfMonth, startOfMonth, endOfYear, startOfYear, parseISO } from 'date-fns';
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

const timeRangeLabels: Record<string, string> = {
  today: 'Hoy', week: 'Esta Semana', month: 'Este Mes', year: 'Este Año', all: 'Global',
};

const BankDetailFormSchema = z.object({
  bank: z.string().min(3, "El nombre del banco es requerido."),
  accountHolder: z.string().min(3, "El nombre del titular es requerido."),
  idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
  accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
  description: z.string().optional(),
});

const ServiceFormSchema = z.object({
  name: z.string().min(3, "El nombre del servicio es requerido."),
  price: z.number().min(0, "El precio no puede ser negativo."),
});

const CouponFormSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().positive("El valor debe ser positivo."),
});

const ExpenseFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser un número positivo."),
});

const SupportTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

const ClinicalRecordSchema = z.object({
  clinicalNotes: z.string().optional(),
  prescription: z.string().optional(),
});

const DoctorProfileSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  cedula: z.string().min(6, "La cédula es requerida."),
  whatsapp: z.string().min(10, "El WhatsApp es requerido."),
  address: z.string().min(5, "La dirección es requerida."),
  sector: z.string().min(3, "El sector es requerido."),
  consultationFee: z.number().min(0, "La tarifa no puede ser negativa."),
  slotDuration: z.number().min(5, "La duración debe ser al menos 5 minutos."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  profileImage: z.string().optional(),
  bannerImage: z.string().optional(),
  aiHint: z.string().optional(),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida."),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});


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
    const [isRecordOpen, setIsRecordOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
    const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
    const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
    const [isSupportDetailOpen, setIsSupportDetailOpen] = useState(false);
    const [isPaymentReportOpen, setIsPaymentReportOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
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
        if (user?.id) {
            fetchData();
        }
    }, [user, fetchData]);
    
    useEffect(() => {
      if (user === undefined) return;
      if (user === null || user.role !== 'doctor') {
        router.push('/auth/login');
      }
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

        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses
        };
    }, [appointments, doctorData, timeRange]);

    const paginatedExpenses = useMemo(() => {
      const expenses = doctorData?.expenses || [];
      return [...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [doctorData]);


    const { todayAppointments, tomorrowAppointments, upcomingAppointments, pastAppointments } = useMemo(() => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayStr = format(today, 'yyyy-MM-dd');
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

        const tA: Appointment[] = [];
        const tmA: Appointment[] = [];
        const uA: Appointment[] = [];
        const pA: Appointment[] = [];

        [...appointments].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time)).forEach(appt => {
            if (appt.date === todayStr) tA.push(appt);
            else if (appt.date === tomorrowStr) tmA.push(appt);
            else if (new Date(appt.date) > tomorrow) uA.push(appt);
            else pA.push(appt);
        });

        return {
            todayAppointments: tA,
            tomorrowAppointments: tmA,
            upcomingAppointments: uA,
            pastAppointments: pA.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
    }, [appointments]);


    const handleUpdateAppointment = async (id: string, data: Partial<Appointment>) => {
        await firestoreService.updateAppointment(id, data);
        fetchData();
        toast({ title: 'Cita actualizada' });
    };

    const handleOpenDialog = (type: 'appointment' | 'chat' | 'record', appointment: Appointment) => {
        setSelectedAppointment(appointment);
        if (type === 'appointment') setIsAppointmentDetailOpen(true);
        else if (type === 'chat') setIsChatOpen(true);
        else setIsRecordOpen(true);
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !selectedAppointment || !user) return;
        setIsSendingMessage(true);
        try {
            await firestoreService.addMessageToAppointment(selectedAppointment.id, { sender: 'doctor', text: chatMessage.trim() });
            setChatMessage("");
            await fetchData(); // Refresh data to show new message
            const updatedAppointment = appointments.find(a => a.id === selectedAppointment.id);
            if (updatedAppointment) setSelectedAppointment(updatedAppointment);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
        } finally {
            setIsSendingMessage(false);
        }
    };
    
    // All CRUD operations for doctor's sub-collections (expenses, services, etc.)
    const handleSaveEntity = async (type: 'expense' | 'service' | 'bank' | 'coupon', data: any) => {
        if (!doctorData) return;
        const list = (doctorData[type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services'] || []) as any[];
        const editingEntity = type === 'expense' ? editingExpense : type === 'service' ? editingService : type === 'bank' ? editingBankDetail : editingCoupon;
        
        let newList;
        if (editingEntity) {
            newList = list.map(item => item.id === editingEntity.id ? { ...item, ...data } : item);
        } else {
            newList = [...list, { ...data, id: `${type}-${Date.now()}` }];
        }
        
        const updateKey = type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services';
        await firestoreService.updateDoctor(doctorData.id, { [updateKey]: newList });
        await fetchData();
        toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} guardado.` });
        
        // Close respective dialog
        if (type === 'expense') setIsExpenseDialogOpen(false);
        if (type === 'service') setIsServiceDialogOpen(false);
        if (type === 'bank') setIsBankDetailDialogOpen(false);
        if (type === 'coupon') setIsCouponDialogOpen(false);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete || !doctorData) return;
        const { type, id } = itemToDelete;
        const list = (doctorData[type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services'] || []) as any[];
        const newList = list.filter(item => item.id !== id);
        const updateKey = type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services';
        await firestoreService.updateDoctor(doctorData.id, { [updateKey]: newList });
        
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
        
        // In a real app, upload proofFile and get URL. Here we use a placeholder.
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

    if (isLoading || !user || !doctorData) {
        return (
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
          </div>
        );
    }
    
    // Safe to access doctorData and user from here
    const subscriptionFee = cityFeesMap.get(doctorData.city) || 0;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 bg-muted/40">
                <div className="container py-12">
                    <h1 className="text-3xl font-bold font-headline mb-2">Panel del Médico</h1>
                    <p className="text-muted-foreground mb-8">Bienvenido de nuevo, {user.name}.</p>
                    
                     {currentTab === 'appointments' && (
                        <div>Appointments content here...</div>
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
                                    <div>
                                        <CardTitle>Registro de Gastos</CardTitle>
                                        <CardDescription>Administra tus gastos operativos y de consultorio.</CardDescription>
                                    </div>
                                    <Button onClick={() => { setEditingExpense(null); setIsExpenseDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto</Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {paginatedExpenses.length > 0 ? paginatedExpenses.map(expense => (
                                                    <TableRow key={expense.id}>
                                                        <TableCell>{format(new Date(expense.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                                        <TableCell className="font-medium">{expense.description}</TableCell>
                                                        <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button variant="outline" size="icon" onClick={() => { setEditingExpense(expense); setIsExpenseDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                                                <Button variant="destructive" size="icon" onClick={() => { setItemToDelete({type: 'expense', id: expense.id}); setIsDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (<TableRow><TableCell colSpan={4} className="text-center h-24">No hay gastos registrados.</TableCell></TableRow>)}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="space-y-4 md:hidden">
                                        {paginatedExpenses.map(expense => (
                                          <div key={expense.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <p className="font-semibold">{expense.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(expense.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                                              </div>
                                              <p className="text-lg font-mono">${expense.amount.toFixed(2)}</p>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-end gap-2">
                                              <Button variant="outline" size="sm" onClick={() => { setEditingExpense(expense); setIsExpenseDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                              <Button variant="destructive" size="sm" onClick={() => { setItemToDelete({type: 'expense', id: expense.id}); setIsDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                                            </div>
                                          </div>
                                        ))}
                                        {paginatedExpenses.length === 0 && <p className="text-center text-muted-foreground py-8">No hay gastos registrados.</p>}
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    )}
                    
                    {currentTab === 'subscription' && (
                       <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Shield /> Mi Suscripción</CardTitle>
                                <CardDescription>Gestiona tu membresía en SUMA para seguir recibiendo pacientes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div className="md:col-span-2 space-y-1">
                                        <p className="text-sm text-muted-foreground">Estado Actual</p>
                                        <Badge className={cn('capitalize text-base px-3 py-1', {
                                            'bg-green-600 text-white': doctorData.subscriptionStatus === 'active',
                                            'bg-amber-500 text-white': doctorData.subscriptionStatus === 'pending_payment',
                                            'bg-red-600 text-white': doctorData.subscriptionStatus === 'inactive'
                                        })}>
                                            {doctorData.subscriptionStatus === 'active' ? 'Activa' : doctorData.subscriptionStatus === 'pending_payment' ? 'Pago en Revisión' : 'Inactiva'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Monto de Suscripción</p>
                                        <p className="text-2xl font-bold">${subscriptionFee.toFixed(2)}<span className="text-base font-normal text-muted-foreground">/mes</span></p>
                                    </div>
                                     <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Último Pago</p>
                                        <p className="font-semibold">{doctorData.lastPaymentDate ? format(new Date(doctorData.lastPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es }) : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Próximo Vencimiento</p>
                                        <p className="font-semibold">{doctorData.nextPaymentDate ? format(new Date(doctorData.nextPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es }) : 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <Card className="bg-muted/30">
                                    <CardHeader>
                                        <CardTitle>Reportar un Pago</CardTitle>
                                        <CardDescription>
                                            ¿Ya realizaste el pago de tu suscripción? Repórtalo aquí para que el equipo de SUMA lo verifique.
                                            Recuerda realizarlo a cualquiera de las cuentas de la plataforma.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button onClick={() => setIsPaymentReportOpen(true)} disabled={doctorData.subscriptionStatus === 'pending_payment'}>
                                            <Upload className="mr-2 h-4 w-4" /> Reportar Pago
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader>
                                    <CardContent>
                                         <Table>
                                            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead><TableHead>ID Transacción</TableHead><TableHead className="text-right">Comprobante</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                            {doctorPayments.length > 0 ? (
                                                [...doctorPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{format(new Date(p.date + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</TableCell>
                                                    <TableCell>${p.amount.toFixed(2)}</TableCell>
                                                    <TableCell><Badge className={cn({'bg-green-600 text-white': p.status === 'Paid', 'bg-amber-500 text-white': p.status === 'Pending', 'bg-red-600 text-white': p.status === 'Rejected'})}>{p.status === 'Paid' ? 'Pagado' : p.status === 'Pending' ? 'En Revisión' : 'Rechazado'}</Badge></TableCell>
                                                    <TableCell className="font-mono text-xs">{p.transactionId}</TableCell>
                                                    <TableCell className="text-right"><Button variant="outline" size="sm" asChild><a href={p.paymentProofUrl || '#'} target="_blank" rel="noopener noreferrer" >Ver</a></Button></TableCell>
                                                </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay pagos registrados.</TableCell></TableRow>
                                            )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </CardContent>
                       </Card>
                    )}

                </div>
            </main>
             {/* ALL DIALOGS HERE */}
        </div>
    );
}

    
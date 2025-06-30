
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as firestoreService from '@/lib/firestoreService';
import type { Appointment, Doctor, Service, BankDetail, Expense, Patient, Coupon, AdminSupportTicket, DoctorPayment, ChatMessage } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, User, BriefcaseMedical, CalendarClock, PlusCircle, Trash2, Pencil, X, DollarSign, CheckCircle, Coins, TrendingUp, TrendingDown, Wallet, CalendarCheck, History, UserCheck, UserX, MoreVertical, Mail, Cake, VenetianMask, FileImage, Tag, LifeBuoy, Link as LinkIcon, Copy, MessageSquarePlus, MessageSquare, CreditCard, Send, FileDown, FileText, Upload, FileUp, Loader2, Landmark, Banknote, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { startOfDay, endOfDay, startOfWeek, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, format, getWeek, startOfMonth, addDays, isSameDay, formatDistanceToNow, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSettings } from '@/lib/settings';
import { generatePdfReport } from '@/lib/pdf-utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { z } from 'zod';
import { DaySchedule, Schedule } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ServiceFormSchema = z.object({
  name: z.string().min(3, "El nombre del servicio es requerido."),
  price: z.number().positive("El precio debe ser un número positivo."),
});

const BankDetailFormSchema = z.object({
  bank: z.string().min(3, "El nombre del banco es requerido."),
  accountHolder: z.string().min(3, "El nombre del titular es requerido."),
  idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
  accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
  description: z.string().optional(),
});

const ExpenseFormSchema = z.object({
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser un número positivo."),
  date: z.string().min(1, "La fecha es requerida."),
});

const CouponFormSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().positive("El valor debe ser positivo."),
});

const SupportTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

const ProfileFormSchema = z.object({
    name: z.string().min(3, "El nombre es requerido."),
    cedula: z.string().min(5, "La cédula es requerida."),
    whatsapp: z.string().optional(),
    description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
    specialty: z.string(),
    slotDuration: z.number().int().min(5, "La duración debe ser de al menos 5 minutos").positive("La duración debe ser positiva"),
    consultationFee: z.number().min(0, "La tarifa de consulta no puede ser negativa."),
    city: z.string(),
    sector: z.string().optional(),
    address: z.string().min(10, "La dirección completa es requerida."),
    profileImage: z.string().optional(),
    bannerImage: z.string().optional(),
});

const SubscriptionPaymentSchema = z.object({
  amount: z.number().positive("El monto debe ser positivo."),
  date: z.string().min(1, "La fecha es requerida."),
  transactionId: z.string().min(5, "La referencia es requerida."),
  paymentProof: z.any().refine(file => file?.name, "El comprobante es requerido."),
});

const ClinicalNoteSchema = z.string().min(10, "Las notas deben tener al menos 10 caracteres.");
const PrescriptionSchema = z.string().min(10, "La prescripción debe tener al menos 10 caracteres.");

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "Gastos",
    color: "hsl(var(--destructive))",
  },
};

const timeRangeLabels: Record<string, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año',
    all: 'Todos',
};

function UpcomingAppointmentCard({ appointment, onConfirmPayment, onViewDetails }: { appointment: Appointment, onConfirmPayment: (id: string) => void, onViewDetails: (appointment: Appointment) => void }) {
    return (
        <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                    <p className="font-bold text-lg">{appointment.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                        {new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {appointment.time}
                    </p>
                    <p className="text-sm">
                        <span className="font-semibold">Servicios:</span> {appointment.services.map(s => s.name).join(', ')}
                    </p>
                </div>
                <Separator orientation="vertical" className="h-auto hidden sm:block" />
                <Separator orientation="horizontal" className="w-full sm:hidden" />
                <div className="flex sm:flex-col justify-between items-start sm:items-end gap-2 sm:w-48">
                    <div className="text-right flex-1">
                        <p className="font-bold text-xl">${appointment.totalPrice.toFixed(2)}</p>
                        <Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(
                            appointment.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500',
                            "text-white"
                        )}>
                            {appointment.paymentStatus === 'Pagado' ? <Check className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                            {appointment.paymentStatus}
                        </Badge>
                    </div>
                    <div className="flex sm:flex-col items-center gap-2">
                         <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => onViewDetails(appointment)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver Detalles</span>
                        </Button>
                        {appointment.paymentMethod === 'transferencia' && appointment.paymentStatus === 'Pendiente' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-9">
                                        Revisar
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Pago de {appointment.patientName}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            El paciente ha subido un comprobante de pago. Por favor, verifica la transacción antes de confirmar.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                        <p className="font-semibold mb-2">Comprobante de Pago:</p>
                                        {appointment.paymentProof ? (
                                            <Image src={appointment.paymentProof} alt="Comprobante de pago" width={400} height={200} className="rounded-md border"/>
                                        ) : <p className="text-sm text-muted-foreground">No se subió comprobante.</p>}
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onConfirmPayment(appointment.id)}>
                                            <Check className="mr-2 h-4 w-4" /> Marcar como Pagado
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {appointment.paymentMethod === 'efectivo' && appointment.paymentStatus === 'Pendiente' && (
                            <Button size="sm" variant="outline" className="h-9" onClick={() => onConfirmPayment(appointment.id)}>
                                Confirmar Pago
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
             <CardFooter className="p-4 pt-0 border-t mt-4 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm">
                    <p className="text-muted-foreground">Confirmación del Paciente:</p>
                    <Badge variant={
                        appointment.patientConfirmationStatus === 'Confirmada' ? 'default' : 
                        appointment.patientConfirmationStatus === 'Cancelada' ? 'destructive' : 'secondary'
                    } className={cn(
                        {'bg-green-600 text-white': appointment.patientConfirmationStatus === 'Confirmada'},
                        {'bg-amber-500 text-white': appointment.patientConfirmationStatus === 'Pendiente'},
                    )}>
                        {appointment.patientConfirmationStatus}
                    </Badge>
                </div>
            </CardFooter>
        </Card>
    );
}


export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('view') || 'appointments';
  const { toast } = useToast();
  const { specialties, cities, currency, companyBankDetails } = useSettings();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [profileForm, setProfileForm] = useState<Doctor | null>(null);
  
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
  const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);
  
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<(Appointment & { patient?: Patient }) | null>(null);
  const [publicProfileUrl, setPublicProfileUrl] = useState('');

  const [editingClinicalNotes, setEditingClinicalNotes] = useState('');
  const [doctorChatMessage, setDoctorChatMessage] = useState("");
  const [isSendingDoctorMessage, setIsSendingDoctorMessage] = useState(false);
  
  const weekDays = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ] as const;
  
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedChatPatient, setSelectedChatPatient] = useState<Patient | null>(null);

  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);
  const [isReportPaymentDialogOpen, setIsReportPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const [isSupportDetailDialogOpen, setIsSupportDetailDialogOpen] = useState(false);
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<AdminSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  
  const [expensePage, setExpensePage] = useState(1);
  const [expenseItemsPerPage, setExpenseItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'doctor' || !user.id) return;
    setIsLoading(true);

    try {
        const [docData, docAppointments, allPatients, docPayments, allTickets] = await Promise.all([
            firestoreService.getDoctor(user.id),
            firestoreService.getDoctorAppointments(user.id),
            firestoreService.getPatients(),
            firestoreService.getDoctorPayments(),
            firestoreService.getSupportTickets()
        ]);

        if (docData) {
            setDoctorData(docData);
            setProfileForm(docData);
            setPublicProfileUrl(`${window.location.origin}/doctors/${docData.id}`);
            setAppointments(docAppointments);
            setPatients(allPatients);
            setDoctorPayments(docPayments.filter(p => p.doctorId === docData.id));
            setSupportTickets(allTickets.filter(t => t.userId === user.email));
        }
    } catch (error) {
        console.error("Error fetching doctor data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del panel.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user?.id) {
        fetchData();
        const intervalId = setInterval(fetchData, 30000); // Poll every 30 seconds
        return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [user, fetchData]);


  useEffect(() => {
    if (!selectedAppointment) return;
  
    const updatedApptFromList = appointments.find(a => a.id === selectedAppointment.id);
    
    if (updatedApptFromList) {
      const { patient, ...currentAppointmentCoreData } = selectedAppointment;
      const appointmentCoreDataString = JSON.stringify(currentAppointmentCoreData, Object.keys(currentAppointmentCoreData).sort());
      const updatedApptFromListString = JSON.stringify(updatedApptFromList, Object.keys(updatedApptFromList).sort());

      if (appointmentCoreDataString !== updatedApptFromListString) {
          setSelectedAppointment(prev => {
              if (!prev) return null;
              return { ...updatedApptFromList, patient: prev.patient };
          });
      }
    }
  }, [appointments, selectedAppointment]);


  const uniquePatients = useMemo(() => {
    const patientIds = new Set<string>();
    return appointments.reduce((acc: Patient[], appt) => {
      if (!patientIds.has(appt.patientId)) {
        const patient = patients.find(p => p.id === appt.patientId);
        if (patient) {
          acc.push(patient);
          patientIds.add(patient.id);
        }
      }
      return acc;
    }, []);
  }, [appointments, patients]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    appointments.forEach(appt => {
        const apptDate = new Date(appt.date + 'T00:00:00');
        if (apptDate >= today) {
            upcoming.push(appt);
        } else {
            past.push(appt);
        }
    });

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);
  
  const { todayAppointments, tomorrowAppointments } = useMemo(() => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    const todayAppts = appointments.filter(a => isSameDay(new Date(a.date + 'T00:00:00'), today));
    const tomorrowAppts = appointments.filter(a => isSameDay(new Date(a.date + 'T00:00:00'), tomorrow));
    
    const sortByTime = (a: Appointment, b: Appointment) => a.time.localeCompare(b.time);
    todayAppts.sort(sortByTime);
    tomorrowAppts.sort(sortByTime);

    return { todayAppointments: todayAppts, tomorrowAppointments: tomorrowAppts };
  }, [appointments]);

  const filteredDoctorExpenses = useMemo(() => {
    if (!doctorData?.expenses) return [];
    
    if (timeRange === 'all') {
      return [...doctorData.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    return doctorData.expenses
      .filter(e => {
        const expenseDate = new Date(e.date + 'T00:00:00');
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [doctorData, timeRange]);

  const paginatedDoctorExpenses = useMemo(() => {
    if (expenseItemsPerPage === -1) return filteredDoctorExpenses;
    const startIndex = (expensePage - 1) * expenseItemsPerPage;
    return filteredDoctorExpenses.slice(startIndex, startIndex + expenseItemsPerPage);
  }, [filteredDoctorExpenses, expensePage, expenseItemsPerPage]);
  
  const totalExpensePages = useMemo(() => {
    if (expenseItemsPerPage === -1) return 1;
    return Math.ceil(filteredDoctorExpenses.length / expenseItemsPerPage);
  }, [filteredDoctorExpenses, expenseItemsPerPage]);


  const financialStats = useMemo(() => {
    if (!doctorData || !appointments) {
        return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, chartData: [], paidAppointments: [], paidAppointmentsCount: 0 };
    }

    const now = new Date();
    let filteredAppointments = appointments;
    let filteredExpenses = doctorData.expenses || [];
    let timeRangeStartDate: Date = startOfYear(now), timeRangeEndDate: Date = endOfYear(now); // Default to year

    if (timeRange !== 'all') {
        switch (timeRange) {
            case 'today':
                timeRangeStartDate = startOfDay(now);
                timeRangeEndDate = endOfDay(now);
                break;
            case 'week':
                timeRangeStartDate = startOfWeek(now, { locale: es });
                timeRangeEndDate = endOfDay(now);
                break;
            case 'year':
                timeRangeStartDate = startOfYear(now);
                timeRangeEndDate = endOfYear(now);
                break;
            case 'month':
            default:
                timeRangeStartDate = startOfMonth(now);
                timeRangeEndDate = endOfMonth(now);
                break;
        }

        filteredAppointments = appointments.filter(a => {
            const apptDate = new Date(a.date + 'T00:00:00');
            return apptDate >= timeRangeStartDate && apptDate <= timeRangeEndDate;
        });

        filteredExpenses = (doctorData.expenses || []).filter(e => {
            const expDate = new Date(e.date + 'T00:00:00');
            return expDate >= timeRangeStartDate && expDate <= timeRangeEndDate;
        });
    }

    const paidAppointments = filteredAppointments.filter(a => a.paymentStatus === 'Pagado');
    const totalRevenue = paidAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    const chartData: { label: string; income: number; expenses: number }[] = [];
    if (timeRange === 'week' || timeRange === 'month') {
        const intervalDays = eachDayOfInterval({ start: timeRangeStartDate, end: timeRangeEndDate });
        intervalDays.forEach(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            const income = paidAppointments
                .filter(a => a.date === dayString)
                .reduce((sum, a) => sum + a.totalPrice, 0);
            const expenses = filteredExpenses
                .filter(e => e.date === dayString)
                .reduce((sum, e) => sum + e.amount, 0);
            
            if (income > 0 || expenses > 0) {
              chartData.push({
                  label: format(day, 'dd/MM'),
                  income,
                  expenses,
              });
            }
        });
    } else { // 'year' or 'all'
        const dataByMonth: { [key: string]: { income: number; expenses: number } } = {};
        
        const allRelevantTransactions = [
            ...paidAppointments.map(a => ({ type: 'income', date: a.date, amount: a.totalPrice })),
            ...filteredExpenses.map(e => ({ type: 'expense', date: e.date, amount: e.amount }))
        ];

        allRelevantTransactions.forEach(t => {
            const monthKey = format(new Date(t.date + 'T00:00:00'), 'yyyy-MM');
            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = { income: 0, expenses: 0 };
            }
            if (t.type === 'income') {
                dataByMonth[monthKey].income += t.amount;
            } else {
                dataByMonth[monthKey].expenses += t.amount;
            }
        });

        const sortedMonthKeys = Object.keys(dataByMonth).sort();
        sortedMonthKeys.forEach(monthKey => {
            const [year, month] = monthKey.split('-').map(Number);
            chartData.push({
                label: format(new Date(year, month - 1), 'MMM', { locale: es }),
                income: dataByMonth[monthKey].income,
                expenses: dataByMonth[monthKey].expenses,
            });
        });
    }

    return { totalRevenue, totalExpenses, netProfit, chartData, paidAppointments, paidAppointmentsCount: paidAppointments.length };
  }, [doctorData, appointments, timeRange]);
  
  const doctorCityFee = useMemo(() => {
    if (!doctorData || !cities) return 0;
    return cities.find(c => c.name === doctorData.city)?.subscriptionFee || 0;
  }, [cities, doctorData]);


  const handleConfirmPayment = async (appointmentId: string) => {
    await firestoreService.updateAppointment(appointmentId, { paymentStatus: 'Pagado' });
    toast({ title: "¡Pago Confirmado!", description: "El estado de la cita ha sido actualizado a 'Pagado'." });
    fetchData();
  };
  
  const handleOpenServiceDialog = (service: Service | null) => {
    setEditingService(service);
    setIsServiceDialogOpen(true);
  };
  
  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
        name: formData.get('serviceName') as string,
        price: parseFloat(formData.get('servicePrice') as string) || 0,
    };
    const result = ServiceFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
        return;
    }
    
    if (!doctorData) return;

    const newService: Service = {
      id: editingService ? editingService.id : `service-${Date.now()}`,
      name: result.data.name,
      price: result.data.price,
    };

    let updatedServices;
    if (editingService) {
      updatedServices = doctorData.services.map(s => s.id === editingService.id ? newService : s);
    } else {
      updatedServices = [...doctorData.services, newService];
    }
    
    await firestoreService.updateDoctor(doctorData.id, { services: updatedServices });
    fetchData();
    setIsServiceDialogOpen(false);
    toast({ title: "Servicio Guardado", description: "Tu lista de servicios ha sido actualizada." });
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!doctorData) return;
    const updatedServices = doctorData.services.filter(s => s.id !== serviceId);
    await firestoreService.updateDoctor(doctorData.id, { services: updatedServices });
    fetchData();
    toast({ title: "Servicio Eliminado" });
  };
  
  const handleScheduleChange = <T extends keyof DaySchedule>(dayKey: keyof Schedule, field: T, value: DaySchedule[T]) => {
      if (!profileForm) return;
      const newSchedule = { ...profileForm.schedule };
      (newSchedule[dayKey] as any)[field] = value;
      setProfileForm({ ...profileForm, schedule: newSchedule });
  };

  const handleSlotChange = (dayKey: keyof Schedule, slotIndex: number, timeType: 'start' | 'end', time: string) => {
      if (!profileForm) return;
      const newSchedule = { ...profileForm.schedule };
      newSchedule[dayKey].slots[slotIndex][timeType] = time;
      setProfileForm({ ...profileForm, schedule: newSchedule });
  };

  const handleAddSlot = (dayKey: keyof Schedule) => {
      if (!profileForm) return;
      const newSchedule = { ...profileForm.schedule };
      newSchedule[dayKey].slots.push({ start: '09:00', end: '17:00' });
      setProfileForm({ ...profileForm, schedule: newSchedule });
  };

  const handleRemoveSlot = (dayKey: keyof Schedule, slotIndex: number) => {
      if (!profileForm) return;
      const newSchedule = { ...profileForm.schedule };
      newSchedule[dayKey].slots.splice(slotIndex, 1);
      setProfileForm({ ...profileForm, schedule: newSchedule });
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

    if (!doctorData) return;
    
    const newBankDetail: BankDetail = {
      id: editingBankDetail ? editingBankDetail.id : `bank-${Date.now()}`,
      ...result.data,
    };

    let updatedBankDetails;
    if (editingBankDetail) {
      updatedBankDetails = doctorData.bankDetails.map(bd => bd.id === editingBankDetail.id ? newBankDetail : bd);
    } else {
      updatedBankDetails = [...doctorData.bankDetails, newBankDetail];
    }
    
    await firestoreService.updateDoctor(doctorData.id, { bankDetails: updatedBankDetails });
    fetchData();
    setIsBankDetailDialogOpen(false);
    toast({ title: "Cuenta Bancaria Guardada" });
  };

  const handleDeleteBankDetail = async (bankDetailId: string) => {
    if (!doctorData) return;
    const updatedBankDetails = doctorData.bankDetails.filter(bd => bd.id !== bankDetailId);
    await firestoreService.updateDoctor(doctorData.id, { bankDetails: updatedBankDetails });
    fetchData();
    toast({ title: "Cuenta Bancaria Eliminada" });
  };

  const handleOpenExpenseDialog = (expense: Expense | null) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    
    if (!doctorData) return;

    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : `expense-${Date.now()}`,
      ...result.data,
    };

    let updatedExpenses;
    if (editingExpense) {
        updatedExpenses = (doctorData.expenses || []).map(exp => exp.id === editingExpense.id ? newExpense : exp);
    } else {
        updatedExpenses = [...(doctorData.expenses || []), newExpense];
    }

    await firestoreService.updateDoctor(doctorData.id, { expenses: updatedExpenses });
    fetchData();
    setIsExpenseDialogOpen(false);
    toast({ title: "Gasto Guardado" });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!doctorData) return;
    const updatedExpenses = (doctorData.expenses || []).filter(exp => exp.id !== expenseId);
    await firestoreService.updateDoctor(doctorData.id, { expenses: updatedExpenses });
    fetchData();
    toast({ title: "Gasto Eliminado" });
  };
  
  const handleUpdateAttendance = async (appointmentId: string, attendance: 'Atendido' | 'No Asistió') => {
    await firestoreService.updateAppointment(appointmentId, { attendance });
    toast({ title: "Asistencia Actualizada", description: `La cita ha sido marcada como "${attendance}".` });
    fetchData();
  };

  const handleViewDetails = async (appointment: Appointment) => {
      const patient = await firestoreService.getPatient(appointment.patientId);
      setSelectedAppointment({ ...appointment, patient: patient || undefined });
      setEditingClinicalNotes(appointment.clinicalNotes || '');
      setIsDetailDialogOpen(true);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicProfileUrl);
    toast({ title: "¡Enlace Copiado!", description: "La URL de tu perfil público ha sido copiada." });
  };

  const handleSaveCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorData) return;
    
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      code: formData.get('code') as string,
      discountType: formData.get('discountType') as 'percentage' | 'fixed',
      value: parseFloat(formData.get('value') as string),
    };

    const result = CouponFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
        return;
    }

    const newCoupon: Coupon = {
        id: editingCoupon ? editingCoupon.id : `coupon-${Date.now()}`,
        scope: doctorData.id,
        ...result.data,
    };

    let updatedCoupons;
    if (editingCoupon) {
        updatedCoupons = (doctorData.coupons || []).map(c => c.id === editingCoupon.id ? newCoupon : c);
    } else {
        updatedCoupons = [...(doctorData.coupons || []), newCoupon];
    }

    await firestoreService.updateDoctor(doctorData.id, { coupons: updatedCoupons });
    fetchData();
    setIsCouponDialogOpen(false);
    setEditingCoupon(null);
    toast({ title: "Cupón Guardado" });
  };
  
  const handleDeleteCoupon = async (couponId: string) => {
    if (!doctorData) return;
    const updatedCoupons = (doctorData.coupons || []).filter(c => c.id !== couponId);
    await firestoreService.updateDoctor(doctorData.id, { coupons: updatedCoupons });
    fetchData();
    toast({ title: 'Cupón Eliminado' });
  };
  
  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || user.role !== 'doctor' || isSubmittingTicket) return;
    setIsSubmittingTicket(true);

    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
    };

    const result = SupportTicketSchema.safeParse(dataToValidate);

    if (!result.success) {
      const errorMessage = result.error.errors.map(e => e.message).join(' ');
      toast({ variant: 'destructive', title: 'Error de Validación', description: errorMessage });
      setIsSubmittingTicket(false);
      return;
    }

    const newTicket: Omit<AdminSupportTicket, 'id' | 'messages'> = {
        userId: user.email,
        userName: user.name,
        userRole: 'doctor',
        status: 'abierto',
        date: new Date().toISOString().split('T')[0],
        description: result.data.description,
        subject: result.data.subject,
    };
    
    try {
      await firestoreService.addSupportTicket(newTicket);
      fetchData();
      setIsSupportDialogOpen(false);
      (e.target as HTMLFormElement).reset();
      toast({ title: "Ticket Enviado", description: "Tu solicitud ha sido enviada al equipo de soporte de SUMA." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear el ticket." });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleProfileInputChange = (field: keyof Doctor, value: any) => {
    if (profileForm) {
      setProfileForm(prev => ({ ...prev!, [field]: value }));
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'bannerImage') => {
      if (e.target.files && e.target.files[0] && profileForm) {
        const file = e.target.files[0];
        // In a real app, upload to storage and get URL. For now, use blob URL.
        const newUrl = URL.createObjectURL(file);
        setProfileForm(prev => ({ ...prev!, [field]: newUrl }));
      }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profileForm || !doctorData) return;

      const {id, ...dataToSave} = profileForm;

      const result = ProfileFormSchema.safeParse({
          ...dataToSave,
          slotDuration: Number(dataToSave.slotDuration),
          consultationFee: Number(dataToSave.consultationFee),
      });

      if (!result.success) {
          const errorMessage = result.error.errors.map(err => err.message).join(' ');
          toast({ variant: 'destructive', title: 'Error de Validación', description: errorMessage });
          return;
      }
      
      // Note: Image upload logic would go here. For now, we save the blob URL.
      await firestoreService.updateDoctor(doctorData.id, result.data as Partial<Doctor>);
      fetchData();
      toast({ title: "¡Perfil Actualizado!", description: "Tu información personal ha sido guardada correctamente." });
  };

  const handleOpenChat = (patient: Patient) => {
    setSelectedChatPatient(patient);
    setIsChatDialogOpen(true);
  };

  const handleSaveClinicalNotes = async () => {
    if (!selectedAppointment) return;

    const result = ClinicalNoteSchema.safeParse(editingClinicalNotes);
    if (!result.success) {
        toast({ variant: "destructive", title: "Nota Inválida", description: result.error.errors[0].message });
        return;
    }

    await firestoreService.updateAppointment(selectedAppointment.id, { clinicalNotes: result.data });
    fetchData();
    toast({ title: "Notas guardadas", description: "La historia clínica ha sido actualizada."});
  };
  
  const handleSavePrescription = async () => {
    if (!selectedAppointment) return;

    const result = PrescriptionSchema.safeParse(selectedAppointment.prescription);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Récipé Inválido',
        description: result.error.errors[0].message,
      });
      return;
    }

    await firestoreService.updateAppointment(selectedAppointment.id, {
      prescription: result.data,
    });
    fetchData(); // Refresh data
    toast({
      title: 'Récipé Guardado',
      description: 'La prescripción del paciente ha sido actualizada.',
    });
  };

  const handleGeneratePrescription = () => {
    if (!selectedAppointment || !selectedAppointment.patient || !doctorData) {
      return;
    }
    const result = PrescriptionSchema.safeParse(selectedAppointment.prescription);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Récipé Inválido",
        description: "La prescripción no puede estar vacía o ser demasiado corta.",
      });
      return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(doctorData.name, 20, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(doctorData.specialty, 20, 27);
    doc.text(doctorData.address, 20, 34);
    doc.text(`${doctorData.city}, Venezuela`, 20, 41);
    
    doc.line(20, 50, 190, 50);
    
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", 20, 58);
    doc.setFont("helvetica", "normal");
    doc.text(selectedAppointment.patient.name, 40, 58);
    
    doc.setFont("helvetica", "bold");
    doc.text("Cédula:", 130, 58);
    doc.setFont("helvetica", "normal");
    doc.text(selectedAppointment.patient.cedula || 'N/A', 150, 58);
    
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 20, 66);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(), 'dd/MM/yyyy'), 40, 66);
    
    doc.line(20, 75, 190, 75);
    
    doc.setFontSize(26);
    doc.text("Rp.", 20, 90);
    
    doc.setFontSize(12);
    const prescriptionText = result.data;
    const splitText = doc.splitTextToSize(prescriptionText, 160);
    doc.text(splitText, 25, 100);
    
    doc.line(80, 270, 130, 270);
    doc.text("Firma del Médico", 105, 275, { align: 'center' });
    doc.text(doctorData.cedula, 105, 280, { align: 'center' });
    
    doc.save(
      `Recipe_${selectedAppointment.patient.name.replace(' ', '_')}_${selectedAppointment.date}.pdf`
    );
  };
  
  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorData) return;

    const dataToValidate = {
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      transactionId: paymentRef,
      paymentProof,
    };

    const result = SubscriptionPaymentSchema.safeParse(dataToValidate);

    if (!result.success) {
      const errorMessage = result.error.errors.map((err) => err.message).join(" ");
      toast({ variant: "destructive", title: "Error de Validación", description: errorMessage });
      return;
    }

    const { amount, date, transactionId, paymentProof: proofFile } = result.data;

    // TODO: Upload file to Firebase Storage and get URL. For now, using a placeholder.
    const newPayment: Omit<DoctorPayment, 'id'> = {
      doctorId: doctorData.id,
      doctorName: doctorData.name,
      date: date,
      amount: amount,
      status: "Pending",
      paymentProofUrl: 'https://placehold.co/400x200.png', 
      transactionId: transactionId,
    };

    await firestoreService.addDoctorPayment(newPayment);
    await firestoreService.updateDoctor(doctorData.id, { subscriptionStatus: "pending_payment" });
    fetchData();

    toast({ title: "¡Reporte Enviado!", description: "Tu pago ha sido reportado y está pendiente de aprobación." });
    setIsReportPaymentDialogOpen(false);
    setPaymentAmount(""); setPaymentDate(""); setPaymentRef(""); setPaymentProof(null);
  };
  
  const handleViewTicket = (ticket: AdminSupportTicket) => {
    setSelectedSupportTicket(ticket);
    setIsSupportDetailDialogOpen(true);
  };

  const handleSendDoctorReply = async () => {
    if (!selectedSupportTicket || !replyMessage.trim() || !user) return;

    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        sender: 'user',
        text: replyMessage.trim(),
    };

    await firestoreService.addMessageToSupportTicket(selectedSupportTicket.id, newMessage);

    const updatedTicket = {
        ...selectedSupportTicket,
        messages: [
            ...(selectedSupportTicket.messages || []),
            { ...newMessage, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() }
        ]
    };
    setSelectedSupportTicket(updatedTicket);

    setReplyMessage("");
    fetchData();
  };

  const handleSendDoctorMessage = async () => {
    if (!doctorChatMessage.trim() || !selectedAppointment || !user) return;
    setIsSendingDoctorMessage(true);
    
    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        sender: 'doctor',
        text: doctorChatMessage.trim(),
    };

    try {
        await firestoreService.addMessageToAppointment(selectedAppointment.id, newMessage);
        setDoctorChatMessage("");
        await fetchData(); 
    } catch (error) {
        console.error("Error sending message:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
    } finally {
        setIsSendingDoctorMessage(false);
    }
  };


  if (isLoading || !user || !doctorData || !financialStats || !profileForm) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
          <h1 className="text-3xl font-bold font-headline mb-2">Panel del Médico</h1>
          <p className="text-muted-foreground mb-8">Gestiona tu perfil, servicios y citas.</p>

          <>
              {currentTab === 'appointments' && (
              <div className="mt-6">
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">Agenda de Hoy</span>
                                    {todayAppointments.length > 0 && (
                                        <Badge variant="secondary">{todayAppointments.length} {todayAppointments.length === 1 ? 'cita' : 'citas'}</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>{format(new Date(), "eeee, d 'de' LLLL", { locale: es })}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {todayAppointments.length > 0 ? (
                                    <ul className="space-y-4">
                                        {todayAppointments.map(appt => (
                                            <li key={appt.id} className="p-3 rounded-md border bg-card">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarFallback>{appt.patientName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{appt.patientName}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> {appt.time}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant={appt.attendance === 'Pendiente' ? 'secondary' : 'default'} size="sm" className={cn('h-9',
                                                                    {'bg-green-600 hover:bg-green-700': appt.attendance === 'Atendido'},
                                                                    {'bg-red-600 hover:bg-red-700': appt.attendance === 'No Asistió'}
                                                                )}>
                                                                    {appt.attendance === 'Pendiente' ? 'Marcar' : appt.attendance}
                                                                    {appt.attendance === 'Pendiente' && <MoreVertical className="ml-2 h-4 w-4" />}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onClick={() => handleUpdateAttendance(appt.id, 'Atendido')}><UserCheck className="mr-2 h-4 w-4 text-green-600" /> Atendido</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateAttendance(appt.id, 'No Asistió')}><UserX className="mr-2 h-4 w-4 text-red-600" /> No Asistió</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleViewDetails(appt)}><Eye className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs border-t pt-2 mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(appt.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500', "text-white")}>
                                                            <DollarSign className="mr-1 h-3 w-3" /> {appt.paymentStatus}
                                                        </Badge>
                                                        <Badge variant="outline" className="capitalize flex items-center gap-1">
                                                            {appt.paymentMethod === 'efectivo' ? <Banknote className="h-3 w-3"/> : <Landmark className="h-3 w-3" />}
                                                            {appt.paymentMethod}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {appt.paymentMethod === 'transferencia' && appt.paymentStatus === 'Pendiente' && (
                                                            <Button size="sm" variant="outline" className="h-auto py-1 px-2 text-xs" onClick={() => handleViewDetails(appt)}>Revisar Pago</Button>
                                                        )}
                                                        {appt.paymentMethod === 'efectivo' && appt.paymentStatus === 'Pendiente' && (
                                                            <Button size="sm" variant="outline" className="h-auto py-1 px-2 text-xs" onClick={() => handleConfirmPayment(appt.id)}>Confirmar Pago</Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No tienes citas programadas para hoy.</p>
                                )}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">Agenda de Mañana</CardTitle>
                                <CardDescription>{format(addDays(new Date(), 1), "eeee, d 'de' LLLL", { locale: es })}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {tomorrowAppointments.length > 0 ? (
                                    <ul className="space-y-4">
                                        {tomorrowAppointments.map(appt => (
                                             <li key={appt.id} className="p-3 rounded-md border bg-card">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarFallback>{appt.patientName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{appt.patientName}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> {appt.time}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleViewDetails(appt)}><Eye className="h-4 w-4" /></Button>
                                                </div>
                                                <div className="flex items-center justify-between text-xs border-t pt-2 mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(appt.paymentStatus === 'Pagado' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white')}>
                                                            <DollarSign className="mr-1 h-3 w-3" /> {appt.paymentStatus}
                                                        </Badge>
                                                        <Badge variant="outline" className="capitalize flex items-center gap-1">
                                                            {appt.paymentMethod === 'efectivo' ? <Banknote className="h-3 w-3"/> : <Landmark className="h-3 w-3" />}
                                                            {appt.paymentMethod}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {appt.paymentMethod === 'transferencia' && appt.paymentStatus === 'Pendiente' && (
                                                            <Button size="sm" variant="outline" className="h-auto py-1 px-2 text-xs" onClick={() => handleViewDetails(appt)}>Revisar Pago</Button>
                                                        )}
                                                         {appt.paymentMethod === 'efectivo' && appt.paymentStatus === 'Pendiente' && (
                                                            <Button size="sm" variant="outline" className="h-auto py-1 px-2 text-xs" onClick={() => handleConfirmPayment(appt.id)}>Confirmar Pago</Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No tienes citas programadas para mañana.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarCheck /> Todas las Citas Próximas</CardTitle>
                            <CardDescription>
                                Tienes {upcomingAppointments.length} citas programadas en total.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingAppointments.map((appt) => (
                                        <UpcomingAppointmentCard 
                                            key={appt.id} 
                                            appointment={appt} 
                                            onConfirmPayment={handleConfirmPayment} 
                                            onViewDetails={handleViewDetails}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No tienes citas próximas.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History /> Historial de Citas</CardTitle>
                            <CardDescription>
                                Registro de tus citas pasadas y estado de asistencia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Paciente</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Servicios</TableHead>
                                            <TableHead>Pago</TableHead>
                                            <TableHead className="text-center">Conf. Paciente</TableHead>
                                            <TableHead className="text-center">Asistencia</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pastAppointments.length > 0 ? pastAppointments.map((appt) => (
                                            <TableRow key={appt.id}>
                                                <TableCell className="font-medium">{appt.patientName}</TableCell>
                                                <TableCell>{new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                                                <TableCell className="text-sm">{appt.services.map(s => s.name).join(', ')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(appt.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500', "text-white")}>
                                                        {appt.paymentStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={
                                                        appt.patientConfirmationStatus === 'Confirmada' ? 'default' :
                                                        appt.patientConfirmationStatus === 'Cancelada' ? 'destructive' : 'secondary'
                                                    } className={cn(
                                                        {'bg-green-600 text-white': appt.patientConfirmationStatus === 'Confirmada'},
                                                        {'bg-amber-500 text-white': appt.patientConfirmationStatus === 'Pendiente'},
                                                    )}>
                                                        {appt.patientConfirmationStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {appt.attendance === 'Pendiente' ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm">Marcar Asistencia <MoreVertical className="ml-2 h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onClick={() => handleUpdateAttendance(appt.id, 'Atendido')}>
                                                                    <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                                                                    Atendido
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateAttendance(appt.id, 'No Asistió')}>
                                                                    <UserX className="mr-2 h-4 w-4 text-red-600" />
                                                                    No Asistió
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <Badge variant={appt.attendance === 'Atendido' ? 'default' : 'destructive'} className={cn(appt.attendance === 'Atendido' && 'bg-primary')}>
                                                            {appt.attendance}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="icon" onClick={() => handleViewDetails(appt)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24">No hay citas en el historial.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="space-y-4 md:hidden">
                                {pastAppointments.length > 0 ? pastAppointments.map((appt) => (
                                    <div key={appt.id} className="p-4 border rounded-lg space-y-4">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <p className="font-bold">{appt.patientName}</p>
                                                <p className="text-sm text-muted-foreground">{new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                            <Button variant="outline" size="icon" onClick={() => handleViewDetails(appt)}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Ver Detalles</span>
                                            </Button>
                                        </div>
                                        <div className="text-sm space-y-1">
                                          <div><span className="font-semibold">Servicios: </span> 
                                          {appt.services.map(s => s.name).join(', ')}</div>
                                          <div className="flex items-center gap-1.5"><span className="font-semibold">Confirmación Paciente:</span> 
                                            <Badge variant={
                                                appt.patientConfirmationStatus === 'Confirmada' ? 'default' :
                                                appt.patientConfirmationStatus === 'Cancelada' ? 'destructive' : 'secondary'
                                            } className={cn(
                                                {'bg-green-600 text-white': appt.patientConfirmationStatus === 'Confirmada'},
                                                {'bg-amber-500 text-white': appt.patientConfirmationStatus === 'Pendiente'},
                                            )}>
                                                {appt.patientConfirmationStatus}
                                            </Badge>
                                          </div>
                                        </div>
                                        <Separator/>
                                        <div className="flex justify-between items-center">
                                            <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(appt.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500', "text-white")}>
                                                {appt.paymentStatus}
                                            </Badge>
                                             {appt.attendance === 'Pendiente' ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">Marcar Asistencia <MoreVertical className="ml-1 h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => handleUpdateAttendance(appt.id, 'Atendido')}>
                                                                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                                                                Atendido
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateAttendance(appt.id, 'No Asistió')}>
                                                                <UserX className="mr-2 h-4 w-4 text-red-600" />
                                                                No Asistió
                                                            </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <Badge variant={appt.attendance === 'Atendido' ? 'default' : 'destructive'} className={cn(appt.attendance === 'Atendido' && 'bg-primary')}>
                                                        {appt.attendance}
                                                    </Badge>
                                                )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center h-24 flex items-center justify-center text-muted-foreground">No hay citas en el historial.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
                            <Button variant={timeRange === 'all' ? 'default' : 'outline'} onClick={() => setTimeRange('all')}>Todos</Button>
                        </div>
                    </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold text-green-600">${financialStats.totalRevenue.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                              <TrendingDown className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold text-red-600">${financialStats.totalExpenses.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${financialStats.netProfit.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Citas Pagadas</CardTitle>
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">+{financialStats.paidAppointmentsCount}</div>
                              <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                          </CardContent>
                      </Card>
                  </div>
                  <Card>
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                           <CardTitle>Resumen Financiero: {timeRangeLabels[timeRange]}</CardTitle>
                           <CardDescription>Comparativa de ingresos y gastos.</CardDescription>
                        </div>
                        <Button onClick={() => generatePdfReport({
                            title: `Reporte Financiero para Dr. ${doctorData.name}`,
                            subtitle: `Período: ${timeRangeLabels[timeRange]} - Generado el ${format(new Date(), 'dd/MM/yyyy')}`,
                            sections: [
                                {
                                    title: "Ingresos por Citas",
                                    columns: ["Fecha", "Paciente", "Servicios", "Monto"],
                                    data: financialStats.paidAppointments.map(a => [
                                        format(new Date(a.date + 'T00:00:00'), 'dd/MM/yy'),
                                        a.patientName,
                                        a.services.map(s => s.name).join(', '),
                                        `$${a.totalPrice.toFixed(2)}`
                                    ])
                                },
                                {
                                    title: "Gastos del Consultorio",
                                    columns: ["Fecha", "Descripción", "Monto"],
                                    data: (doctorData.expenses || []).map(e => [
                                        format(new Date(e.date + 'T00:00:00'), 'dd/MM/yy'),
                                        e.description,
                                        `$${e.amount.toFixed(2)}`
                                    ])
                                }
                            ],
                            fileName: `Reporte_Financiero_${doctorData.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`
                        })}><FileDown className="mr-2"/> Descargar Reporte PDF</Button>
                      </CardHeader>
                      <CardContent className="pl-2">
                          {timeRange !== 'today' && financialStats.chartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                                <BarChart accessibilityLayer data={financialStats.chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `$${value}`} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                          ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                              <p>
                                {timeRange === 'today' ? 'La vista de gráfico no está disponible para el día de hoy.' : 'No hay datos financieros para mostrar en este período.'}
                              </p>
                            </div>
                          )}
                      </CardContent>
                  </Card>

                   <Card>
                    <CardHeader>
                        <CardTitle>Detalle de Ingresos ({timeRangeLabels[timeRange]})</CardTitle>
                        <CardDescription>Lista de todas las citas pagadas en el período seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Servicios</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead className="w-[120px] text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {financialStats.paidAppointments.length > 0 ? financialStats.paidAppointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((appt) => (
                                        <TableRow key={appt.id}>
                                            <TableCell>{new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                                            <TableCell className="font-medium">{appt.patientName}</TableCell>
                                            <TableCell className="text-sm truncate max-w-xs">{appt.services.map(s => s.name).join(', ')}</TableCell>
                                            <TableCell className="text-right font-mono">${appt.totalPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="outline" size="icon" onClick={() => handleViewDetails(appt)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">No hay ingresos registrados en este período.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="space-y-4 md:hidden">
                            {financialStats.paidAppointments.length > 0 ? financialStats.paidAppointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((appt) => (
                                <div key={appt.id} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="font-bold">{appt.patientName}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <p className="font-semibold text-lg font-mono">${appt.totalPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="text-sm"><span className="font-semibold">Servicios: </span>{appt.services.map(s => s.name).join(', ')}</div>
                                    <Separator/>
                                    <div className="flex justify-end">
                                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(appt)}><Eye className="mr-2 h-4 w-4" /> Ver Detalles</Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center h-24 flex items-center justify-center text-muted-foreground">No hay ingresos registrados en este período.</div>
                            )}
                        </div>
                    </CardContent>
                  </Card>
                  <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div><CardTitle>Registro de Gastos</CardTitle><CardDescription>Administra todos los gastos de tu consultorio.</CardDescription></div>
                                <Button onClick={() => handleOpenExpenseDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto</Button>
                            </div>
                        </CardHeader>
                      <CardContent>
                          <div className="hidden md:block">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Fecha</TableHead>
                                          <TableHead>Descripción</TableHead>
                                          <TableHead className="text-right">Monto</TableHead>
                                          <TableHead className="w-[120px] text-center">Acciones</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {paginatedDoctorExpenses.length > 0 ? paginatedDoctorExpenses.map(expense => (
                                          <TableRow key={expense.id}>
                                              <TableCell>{new Date(expense.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                                              <TableCell className="font-medium">{expense.description}</TableCell>
                                              <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                                              <TableCell className="text-center"><div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" onClick={() => handleOpenExpenseDialog(expense)}><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                                              </div></TableCell>
                                          </TableRow>
                                      )) : (
                                          <TableRow><TableCell colSpan={4} className="text-center h-24">No hay gastos registrados en este período.</TableCell></TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>

                          <div className="space-y-4 md:hidden">
                            {paginatedDoctorExpenses.length > 0 ? paginatedDoctorExpenses.map(expense => (
                                <div key={expense.id} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div><p className="font-medium">{expense.description}</p><p className="text-sm text-muted-foreground">{new Date(expense.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                                        <p className="font-semibold text-lg text-right font-mono">${expense.amount.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenExpenseDialog(expense)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="mr-2 h-4 w-4" /> Borrar</Button>
                                    </div>
                                </div>
                            )) : (<p className="text-center text-muted-foreground py-8">No hay gastos registrados en este período.</p>)}
                          </div>
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

              {currentTab === 'subscription' && (
                <div className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard/> Estado de tu Suscripción</CardTitle>
                            <CardDescription>Gestiona tus pagos y mantén tu cuenta activa para aparecer en los resultados de búsqueda.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Estado Actual</p>
                                <Badge variant={
                                    doctorData.subscriptionStatus === 'active' ? 'default' :
                                    doctorData.subscriptionStatus === 'pending_payment' ? 'secondary' : 'destructive'
                                } className={cn(
                                    'capitalize text-base px-3 py-1',
                                    {
                                        'bg-green-600 text-white': doctorData.subscriptionStatus === 'active',
                                        'bg-amber-500 text-white': doctorData.subscriptionStatus === 'pending_payment',
                                    }
                                )}>
                                    {doctorData.subscriptionStatus === 'active' ? 'Activo' : 
                                     doctorData.subscriptionStatus === 'pending_payment' ? 'Pago en Revisión' : 
                                     'Inactivo'}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Próxima Fecha de Pago</p>
                                <p className="text-lg font-semibold">{format(new Date(doctorData.nextPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                            </div>
                             <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Monto Mensual ({doctorData.city})</p>
                                <p className="text-lg font-semibold">${doctorCityFee.toFixed(2)}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-6">
                            {doctorData.subscriptionStatus === 'pending_payment' ? (
                                 <p className="text-sm text-amber-600 font-semibold">Tu pago está siendo revisado por el equipo de SUMA. Esto puede tardar hasta 24 horas.</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">¿Ya realizaste tu pago? Repórtalo para activar tu cuenta.</p>
                            )}
                           
                            <Button onClick={() => setIsReportPaymentDialogOpen(true)} disabled={doctorData.subscriptionStatus === 'pending_payment'}>
                                <FileUp className="mr-2"/> Reportar Pago
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Landmark/> Cuentas de SUMA para Pagos</CardTitle>
                            <CardDescription>Realiza tu pago en cualquiera de nuestras cuentas y repórtalo usando el botón de arriba.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            {companyBankDetails.map(bd => (
                                <div key={bd.id} className="p-4 border rounded-lg bg-muted/50 space-y-2">
                                    <p className="font-bold text-lg">{bd.bank}</p>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p><span className="font-semibold text-foreground">Titular:</span> {bd.accountHolder}</p>
                                        <p><span className="font-semibold text-foreground">C.I./R.I.F.:</span> {bd.idNumber}</p>
                                        <p><span className="font-semibold text-foreground">Nro. Cuenta:</span> {bd.accountNumber}</p>
                                         {bd.description && <p><span className="font-semibold text-foreground">Descripción:</span> {bd.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Fecha Reporte</TableHead><TableHead>Monto</TableHead><TableHead>Referencia</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {doctorPayments.length > 0 ? doctorPayments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{format(new Date(p.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                            <TableCell>${p.amount.toFixed(2)}</TableCell>
                                            <TableCell className="font-mono text-xs">{p.transactionId}</TableCell>
                                            <TableCell>
                                                <Badge className={cn({
                                                    'bg-green-600 text-white': p.status === 'Paid',
                                                    'bg-amber-500 text-white': p.status === 'Pending',
                                                    'bg-red-600 text-white': p.status === 'Rejected',
                                                })}>
                                                    {p.status === 'Paid' ? 'Aprobado' : p.status === 'Pending' ? 'En Revisión' : 'Rechazado'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">No has realizado ningún pago aún.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
              )}

              {currentTab === 'profile' && (
              <div className="mt-6">
                <div className="space-y-6">
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><User />Mi Perfil</CardTitle>
                          <CardDescription>Actualiza tu información pública y de contacto. Esta información será visible para los pacientes.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <form className="space-y-8" onSubmit={handleProfileSave}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                      <Label className="text-base font-semibold">Foto de Perfil</Label>
                                      <div className="flex items-center gap-6">
                                          <Avatar className="h-24 w-24">
                                              <AvatarImage src={profileForm.profileImage} alt={profileForm.name} />
                                              <AvatarFallback>{profileForm.name?.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="space-y-2 flex-1">
                                              <Input id="profileImage" type="file" accept="image/*" onChange={(e) => handleProfileImageChange(e, 'profileImage')} />
                                              <p className="text-xs text-muted-foreground">Recomendado: 400x400px</p>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <Label className="text-base font-semibold">Banner del Consultorio</Label>
                                      <div className="space-y-2">
                                          <div className="aspect-video relative rounded-md border bg-muted overflow-hidden">
                                               <Image src={profileForm.bannerImage!} alt="Banner" layout="fill" className="object-cover" />
                                          </div>
                                          <Input id="bannerImage" type="file" accept="image/*" onChange={(e) => handleProfileImageChange(e, 'bannerImage')} />
                                          <p className="text-xs text-muted-foreground">Recomendado: 1200x400px</p>
                                      </div>
                                  </div>
                              </div>
                              <Separator />
                              <div className="space-y-4">
                                  <Label className="text-base font-semibold">Información Personal y Contacto</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      <div className="space-y-2"><Label htmlFor="prof-name">Nombre Completo</Label><Input id="prof-name" value={profileForm.name} onChange={(e) => handleProfileInputChange('name', e.target.value)} /></div>
                                      <div className="space-y-2"><Label htmlFor="prof-cedula">Cédula de Identidad</Label><Input id="prof-cedula" value={profileForm.cedula} onChange={(e) => handleProfileInputChange('cedula', e.target.value)} /></div>
                                      <div className="space-y-2"><Label>Correo Electrónico (No editable)</Label><Input value={profileForm.email} disabled /></div>
                                      <div className="space-y-2"><Label htmlFor="prof-whatsapp">Número de WhatsApp</Label><Input id="prof-whatsapp" value={profileForm.whatsapp} onChange={(e) => handleProfileInputChange('whatsapp', e.target.value)} /></div>
                                  </div>
                              </div>
                              <Separator />
                              <div className="space-y-4">
                                   <Label className="text-base font-semibold">Información Profesional</Label>
                                   <div className="space-y-2"><Label htmlFor="prof-desc">Descripción Pública</Label><Textarea id="prof-desc" value={profileForm.description} onChange={(e) => handleProfileInputChange('description', e.target.value)} rows={4} placeholder="Describe tu experiencia..."/></div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      <div className="space-y-2"><Label>Especialidad</Label><Select value={profileForm.specialty} onValueChange={(value) => handleProfileInputChange('specialty', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                                      <div className="space-y-2">
                                        <Label htmlFor="prof-slot-duration">Duración de Cita (minutos)</Label>
                                        <Input
                                            id="prof-slot-duration"
                                            type="number"
                                            value={profileForm.slotDuration || ''}
                                            onChange={(e) => handleProfileInputChange('slotDuration', parseInt(e.target.value, 10) || 0)}
                                            placeholder="Ej: 20"
                                            min="5"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="prof-consultation-fee">Tarifa de Consulta ({currency})</Label>
                                        <Input
                                            id="prof-consultation-fee"
                                            type="number"
                                            value={profileForm.consultationFee ?? ''}
                                            onChange={(e) => handleProfileInputChange('consultationFee', parseFloat(e.target.value) || 0)}
                                            placeholder="Ej: 20"
                                            min="0"
                                            step="0.01"
                                        />
                                      </div>
                                   </div>
                              </div>
                              <Separator />
                              <div className="space-y-4">
                                  <Label className="text-base font-semibold">Ubicación del Consultorio</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                       <div className="space-y-2"><Label>Ciudad</Label><Select value={profileForm.city} onValueChange={(value) => handleProfileInputChange('city', value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                                      <div className="space-y-2"><Label htmlFor="prof-sector">Sector</Label><Input id="prof-sector" value={profileForm.sector} onChange={(e) => handleProfileInputChange('sector', e.target.value)} /></div>
                                      <div className="space-y-2 md:col-span-3"><Label htmlFor="prof-address">Dirección Completa</Label><Input id="prof-address" value={profileForm.address} onChange={(e) => handleProfileInputChange('address', e.target.value)} /></div>
                                  </div>
                              </div>
                              <div className="flex justify-end"><Button type="submit">Guardar Cambios</Button></div>
                          </form>
                      </CardContent>
                  </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><LinkIcon /> Tu Enlace Público</CardTitle>
                            <CardDescription>Comparte este enlace con tus pacientes para que puedan agendar citas directamente.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-stretch gap-2">
                            <Input value={publicProfileUrl} readOnly className="text-sm bg-background flex-1"/>
                            <Button onClick={handleCopyUrl} className="w-full sm:w-auto" disabled={!publicProfileUrl}><Copy className="mr-2 h-4 w-4"/>Copiar Enlace</Button>
                        </CardContent>
                    </Card>
                </div>
              </div>
              )}

              {currentTab === 'services' && (
              <div className="mt-6">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div><CardTitle className="flex items-center gap-2"><BriefcaseMedical /> Mis Servicios</CardTitle><CardDescription>Gestiona los servicios que ofreces y sus precios.</CardDescription></div>
                      <Button onClick={() => handleOpenServiceDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2"/> Agregar Servicio</Button>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader><TableRow><TableHead>Servicio</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {(doctorData.services || []).map(service => (
                                  <TableRow key={service.id}>
                                      <TableCell className="font-medium">{service.name}</TableCell>
                                      <TableCell className="text-right">${service.price.toFixed(2)}</TableCell>
                                      <TableCell className="text-center"><div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenServiceDialog(service)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteService(service.id)}><Trash2 className="h-4 w-4" /></Button>
                                      </div></TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
                </Card>
              </div>
              )}
              
              {currentTab === 'schedule' && (
              <div className="mt-6">
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock /> Mi Horario de Trabajo</CardTitle><CardDescription>Define tu disponibilidad semanal.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        {weekDays.map(({ key, label }) => {
                            const daySchedule = profileForm.schedule[key];
                            return (
                                <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-md border gap-4">
                                    <div className="flex items-center space-x-4">
                                        <Switch id={`switch-${key}`} checked={daySchedule.active} onCheckedChange={(checked) => handleScheduleChange(key, 'active', checked)} />
                                        <Label htmlFor={`switch-${key}`} className="text-base sm:text-lg min-w-[90px]">{label}</Label>
                                    </div>
                                    {daySchedule.active && (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                                            {daySchedule.slots.map((slot, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Input type="time" value={slot.start} onChange={(e) => handleSlotChange(key, index, 'start', e.target.value)} className="w-full sm:w-28" />
                                                    <span>-</span>
                                                    <Input type="time" value={slot.end} onChange={(e) => handleSlotChange(key, index, 'end', e.target.value)} className="w-full sm:w-28" />
                                                    {index > 0 && (<Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(key, index)}><X className="h-4 w-4" /></Button>)}
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => handleAddSlot(key)} className="mt-2 sm:mt-0"><PlusCircle className="mr-2 h-4 w-4" /> Agregar</Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
              </div>
              )}

              {currentTab === 'bank-details' && (
              <div className="mt-6">
                 <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div><CardTitle className="flex items-center gap-2"><Coins /> Mis Datos Bancarios</CardTitle><CardDescription>Gestiona tus cuentas bancarias para recibir pagos.</CardDescription></div>
                        <Button onClick={() => handleOpenBankDetailDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2"/> Agregar Cuenta</Button>
                    </CardHeader>
                    <CardContent>
                        <Table className="hidden md:table">
                            <TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Descripción</TableHead><TableHead>Titular</TableHead><TableHead>Nro. de Cuenta</TableHead><TableHead>C.I./R.I.F.</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {(doctorData.bankDetails || []).map(bd => (
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
                                {(doctorData.bankDetails || []).length === 0 && (<TableRow><TableCell colSpan={6} className="text-center h-24">No tienes cuentas bancarias registradas.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                        <div className="space-y-4 md:hidden">
                            {(doctorData.bankDetails || []).length > 0 ? (doctorData.bankDetails || []).map(bd => (
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

              {currentTab === 'coupons' && (
              <div className="mt-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div><CardTitle className="flex items-center gap-2"><Tag /> Cupones de Descuento</CardTitle><CardDescription>Crea y gestiona cupones para atraer más pacientes.</CardDescription></div>
                        <Button onClick={() => { setEditingCoupon(null); setIsCouponDialogOpen(true); }}><PlusCircle className="mr-2"/> Crear Cupón</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {(doctorData.coupons || []).map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-mono">{coupon.code}</TableCell>
                                    <TableCell className="capitalize">{coupon.discountType === 'fixed' ? 'Fijo' : 'Porcentaje'}</TableCell>
                                    <TableCell>{coupon.discountType === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <Button size="icon" variant="outline" onClick={() => { setEditingCoupon(coupon); setIsCouponDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="destructive" onClick={() => handleDeleteCoupon(coupon.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {(doctorData.coupons || []).length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No has creado cupones.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </div>
              )}

               {currentTab === 'chat' && (
                <div className="mt-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare/> Chat con Pacientes</CardTitle><CardDescription>Comunícate de forma segura con tus pacientes.</CardDescription></CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {uniquePatients.map(patient => (
                                    <Card key={patient.id} className="hover:shadow-md cursor-pointer transition-shadow" onClick={() => handleOpenChat(patient)}>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar><AvatarFallback>{patient.name.charAt(0)}</AvatarFallback></Avatar>
                                            <div><p className="font-semibold">{patient.name}</p><p className="text-sm text-muted-foreground">{patient.email}</p></div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {uniquePatients.length === 0 && (<p className="col-span-full text-center text-muted-foreground py-12">No tienes pacientes con citas agendadas aún.</p>)}
                           </div>
                        </CardContent>
                    </Card>
                </div>
              )}

              {currentTab === 'support' && (
              <div className="mt-6">
                  <Card>
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div><CardTitle className="flex items-center gap-2"><LifeBuoy /> Soporte y Ayuda</CardTitle><CardDescription>Encuentra respuestas a tus preguntas y contacta a nuestro equipo.</CardDescription></div>
                          <Button onClick={() => setIsSupportDialogOpen(true)}><MessageSquarePlus className="mr-2 h-4 w-4"/> Crear Ticket</Button>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Asunto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                              <TableBody>
                              {supportTickets.map(ticket => (
                                  <TableRow key={ticket.id}>
                                      <TableCell>{format(new Date(ticket.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                                      <TableCell><Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>{ticket.status}</Badge></TableCell>
                                      <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}><Eye className="mr-2 h-4 w-4" /> Ver</Button></TableCell>
                                  </TableRow>
                              ))}
                               {(supportTickets.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No tienes tickets de soporte.</TableCell></TableRow>)}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>
              </div>
              )}
          </>
        </div>
      </main>

       <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingService ? "Editar Servicio" : "Agregar Nuevo Servicio"}</DialogTitle><DialogDescription>{editingService ? "Modifica los detalles de este servicio." : "Añade un nuevo servicio a tu lista."}</DialogDescription></DialogHeader>
                <form onSubmit={handleSaveService}><div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="serviceName" className="text-right">Servicio</Label><Input name="serviceName" defaultValue={editingService?.name} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="servicePrice" className="text-right">Precio ($)</Label><Input name="servicePrice" type="number" defaultValue={editingService?.price} className="col-span-3" /></div>
                </div>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Cambios</Button></DialogFooter></form>
            </DialogContent>
        </Dialog>

        <Dialog open={isBankDetailDialogOpen} onOpenChange={setIsBankDetailDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingBankDetail ? "Editar Cuenta Bancaria" : "Agregar Nueva Cuenta"}</DialogTitle><DialogDescription>{editingBankDetail ? "Modifica los detalles de esta cuenta." : "Añade una nueva cuenta para recibir transferencias."}</DialogDescription></DialogHeader>
                <form onSubmit={handleSaveBankDetail}><div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="bankName" className="text-right">Banco</Label><Input id="bankName" name="bankName" defaultValue={editingBankDetail?.bank} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="accountHolder" className="text-right">Titular</Label><Input id="accountHolder" name="accountHolder" defaultValue={editingBankDetail?.accountHolder} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="idNumber" className="text-right">C.I./R.I.F.</Label><Input id="idNumber" name="idNumber" defaultValue={editingBankDetail?.idNumber} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="accountNumber" className="text-right">Nro. Cuenta</Label><Input id="accountNumber" name="accountNumber" defaultValue={editingBankDetail?.accountNumber} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Descripción</Label><Input id="description" name="description" defaultValue={editingBankDetail?.description} className="col-span-3" placeholder="Ej: Cuenta Personal, Zelle, etc."/></div>
                </div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Cambios</Button></DialogFooter></form>
            </DialogContent>
        </Dialog>

        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingExpense ? "Editar Gasto" : "Agregar Nuevo Gasto"}</DialogTitle><DialogDescription>Registra un nuevo gasto para llevar un control financiero.</DialogDescription></DialogHeader>
                <form onSubmit={handleSaveExpense}><div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseDate" className="text-right">Fecha</Label><Input name="expenseDate" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseDescription" className="text-right">Descripción</Label><Input name="expenseDescription" defaultValue={editingExpense?.description} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseAmount" className="text-right">Monto ($)</Label><Input name="expenseAmount" type="number" defaultValue={editingExpense?.amount} className="col-span-3" /></div>
                </div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Gasto</Button></DialogFooter></form>
            </DialogContent>
        </Dialog>

        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader><DialogTitle>Detalles de la Cita</DialogTitle></DialogHeader>
                {selectedAppointment && (
                    <div className="py-4 space-y-4 max-h-[80vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Información del Paciente</h3>
                                <p><strong>Nombre:</strong> {selectedAppointment.patientName}</p>
                                <p><strong>Email:</strong> {selectedAppointment.patient?.email}</p>
                                <p><strong>Cédula:</strong> {selectedAppointment.patient?.cedula}</p>
                                <p><strong>Teléfono:</strong> {selectedAppointment.patient?.phone}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Detalles de la Cita</h3>
                                <p><strong>Fecha y Hora:</strong> {new Date(selectedAppointment.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {selectedAppointment.time}</p>
                                <p><strong>Servicios:</strong> {selectedAppointment.services.map(s => s.name).join(', ')}</p>
                                <p><strong>Total:</strong> ${selectedAppointment.totalPrice.toFixed(2)}</p>
                                <div className="flex items-center gap-2"><strong>Confirmación Paciente:</strong>
                                     <Badge variant={
                                        selectedAppointment.patientConfirmationStatus === 'Confirmada' ? 'default' : 
                                        selectedAppointment.patientConfirmationStatus === 'Cancelada' ? 'destructive' : 'secondary'
                                    } className={cn(
                                        {'bg-green-600 text-white': selectedAppointment.patientConfirmationStatus === 'Confirmada'},
                                        {'bg-amber-500 text-white': selectedAppointment.patientConfirmationStatus === 'Pendiente'},
                                    )}>
                                        {selectedAppointment.patientConfirmationStatus}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2"><strong>Asistencia:</strong>
                                  <Badge variant={selectedAppointment.attendance === 'Atendido' ? 'default' : selectedAppointment.attendance === 'No Asistió' ? 'destructive' : 'secondary'} className={cn(
                                      {'bg-green-600 text-white': selectedAppointment.attendance === 'Atendido'}
                                  )}>
                                      {selectedAppointment.attendance}
                                  </Badge>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Chat con Paciente</h3>
                            <div className="border bg-muted/50 rounded-lg p-4 h-64 overflow-y-auto space-y-4">
                                {(selectedAppointment.messages || []).map(msg => (
                                    <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'doctor' && 'justify-end')}>
                                        {msg.sender === 'patient' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={selectedAppointment.patient?.profileImage || undefined} />
                                                <AvatarFallback>{selectedAppointment.patient?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'doctor' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                         {msg.sender === 'doctor' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={doctorData?.profileImage} />
                                                <AvatarFallback>{doctorData?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {(selectedAppointment.messages || []).length === 0 && (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Aún no hay mensajes.</div>
                                )}
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); handleSendDoctorMessage(); }} className="mt-2 flex gap-2">
                                <Input 
                                value={doctorChatMessage} 
                                onChange={(e) => setDoctorChatMessage(e.target.value)} 
                                placeholder="Escribe un mensaje..."
                                disabled={isSendingDoctorMessage}
                                />
                                <Button type="submit" disabled={isSendingDoctorMessage || !doctorChatMessage.trim()}>
                                {isSendingDoctorMessage ? <Loader2 className="animate-spin" /> : <Send />}
                                </Button>
                            </form>
                        </div>
                        <Separator />
                        <div><h3 className="font-semibold text-lg mb-2">Historia Clínica / Notas</h3><Textarea placeholder="Añade tus notas sobre la consulta aquí..." rows={6} value={editingClinicalNotes} onChange={(e) => setEditingClinicalNotes(e.target.value)} disabled={selectedAppointment.attendance !== 'Atendido'} /><div className="flex justify-end mt-2"><Button onClick={handleSaveClinicalNotes} disabled={selectedAppointment.attendance !== 'Atendido'}>Guardar Notas</Button></div></div>
                        <Separator />
                        <div><h3 className="font-semibold text-lg mb-2">Récipé / Indicaciones</h3>
                           <Textarea
                              placeholder="Escribe la prescripción o indicaciones para el paciente."
                              rows={6}
                              value={selectedAppointment.prescription || ''}
                              onChange={(e) =>
                                  setSelectedAppointment({
                                      ...selectedAppointment,
                                      prescription: e.target.value,
                                  })
                              }
                              disabled={selectedAppointment.attendance !== 'Atendido'}
                            />
                            <div className="flex justify-end mt-2 gap-2">
                              <Button onClick={handleSavePrescription} disabled={selectedAppointment.attendance !== 'Atendido'}>Guardar Récipé</Button>
                              <Button onClick={handleGeneratePrescription} disabled={selectedAppointment.attendance !== 'Atendido'}>Generar Récipé PDF</Button>
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</DialogTitle><DialogDescription>Completa la información para el cupón de descuento.</DialogDescription></DialogHeader>
              <form onSubmit={handleSaveCoupon}><div className="space-y-4 py-4">
                  <div><Label htmlFor="code">Código</Label><Input id="code" name="code" defaultValue={editingCoupon?.code} placeholder="VERANO20" required/></div>
                  <div><Label>Tipo de Descuento</Label><RadioGroup name="discountType" defaultValue={editingCoupon?.discountType || 'percentage'} className="flex gap-4 pt-2"><Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="percentage" /> Porcentaje (%)</Label><Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="fixed" /> Fijo ($)</Label></RadioGroup></div>
                  <div><Label htmlFor="value">Valor</Label><Input id="value" name="value" type="number" defaultValue={editingCoupon?.value} placeholder="20" required/></div>
              </div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Cupón</Button></DialogFooter></form>
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
                                    {msg.sender === 'user' && <Avatar className="h-8 w-8"><AvatarImage src={doctorData?.profileImage} /><AvatarFallback>{(selectedSupportTicket.userName || 'U').charAt(0)}</AvatarFallback></Avatar>}
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
                                <Button onClick={handleSendDoctorReply} disabled={!replyMessage.trim()} size="icon">
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
    </div>
  );
}

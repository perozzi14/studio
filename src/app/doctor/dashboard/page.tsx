
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appointments as mockAppointments, doctors, mockExpenses, type Appointment, type Doctor, type Service, type BankDetail, type Expense, type Patient, mockPatients, type Coupon, type Schedule, type DaySchedule, specialties, cities, locations, type PaymentReport, type SupportTicket } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, User, BriefcaseMedical, CalendarClock, PlusCircle, Trash2, Pencil, X, DollarSign, CheckCircle, Coins, TrendingUp, TrendingDown, Wallet, CalendarCheck, History, UserCheck, UserX, MoreVertical, Mail, Cake, VenetianMask, FileImage, Tag, Percent, Upload, Phone, LifeBuoy, ReceiptText, Send, XCircle } from 'lucide-react';
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
  DialogFooter,
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
  type ChartConfig,
} from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { startOfDay, endOfDay, startOfWeek, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, format, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "Gastos",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

const timeRangeLabels: Record<string, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    year: 'Este Año',
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
                         <p className="text-xs text-muted-foreground capitalize mt-1">
                            Método: {appointment.paymentMethod}
                        </p>
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
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export default function DoctorDashboardPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'appointments';
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [paymentReports, setPaymentReports] = useState<PaymentReport[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
  const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValue, setCouponValue] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<(Appointment & { patient?: Patient }) | null>(null);

  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);
  const initialNewAppointmentState = {
    patientName: '',
    patientCedula: '',
    patientEmail: '',
    patientPhone: '',
    date: new Date(),
    time: '',
    selectedServices: [] as number[],
    paymentMethod: 'efectivo' as 'efectivo' | 'transferencia',
  };
  const [newAppointment, setNewAppointment] = useState(initialNewAppointmentState);
  
  const [isReportPaymentOpen, setIsReportPaymentOpen] = useState(false);
  const [newPaymentReport, setNewPaymentReport] = useState({ date: new Date(), reference: '', amount: ''});
  
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [ticketReply, setTicketReply] = useState('');


  const [weekDays, setWeekDays] = useState([
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ] as { key: keyof Schedule; label: string }[]);


  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/auth/login');
    } else if (user.role !== 'doctor') {
      router.push('/dashboard');
    } else {
      const loggedInDoctor = doctors.find(d => d.id === 1);
      if (loggedInDoctor) {
        setDoctorData(loggedInDoctor);
        
        const doctorAppointments = mockAppointments.filter(appt => appt.doctorId === loggedInDoctor.id);
        setAppointments(doctorAppointments);

        const doctorExpenses = mockExpenses.filter(exp => exp.doctorId === loggedInDoctor.id);
        setExpenses(doctorExpenses);

        setPaymentReports(loggedInDoctor.paymentReports);
        setSupportTickets(loggedInDoctor.supportTickets);
      }
      setIsLoading(false);
    }
  }, [user, router]);

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

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);
  
  const financialStats = useMemo(() => {
    if (!appointments || !expenses) return null;

    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
        case 'today':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
        case 'week':
            startDate = startOfWeek(now, { locale: es });
            endDate = endOfDay(startOfWeek(now, { locale: es }));
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

    const filteredAppointments = appointments.filter(a => {
        const apptDate = new Date(a.date + 'T00:00:00');
        return apptDate >= startDate && apptDate <= endDate;
    });

    const filteredExpenses = expenses.filter(e => {
        const expDate = new Date(e.date + 'T00:00:00');
        return expDate >= startDate && expDate <= endDate;
    });
    
    const paidAppointments = filteredAppointments.filter(a => a.paymentStatus === 'Pagado');
    const totalRevenue = paidAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    let chartData: { label: string; income: number; expenses: number; }[] = [];

    if (timeRange === 'year') {
        const monthOrder = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const monthlyData: Record<string, { income: number; expenses: number }> = {};
        monthOrder.forEach(m => monthlyData[m] = { income: 0, expenses: 0 });

        paidAppointments.forEach(appt => {
            const month = format(new Date(appt.date + 'T00:00:00'), 'MMM', { locale: es }).replace('.','');
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
            if (monthlyData[capitalizedMonth]) {
                monthlyData[capitalizedMonth].income += appt.totalPrice;
            }
        });

        filteredExpenses.forEach(exp => {
            const month = format(new Date(exp.date + 'T00:00:00'), 'MMM', { locale: es }).replace('.','');
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
            if (monthlyData[capitalizedMonth]) {
                monthlyData[capitalizedMonth].expenses += exp.amount;
            }
        });
        
        chartData = Object.entries(monthlyData)
            .map(([label, data]) => ({ label, ...data }))
            .filter(d => d.income > 0 || d.expenses > 0);

    } else if (timeRange === 'month') {
        const weeklyData: Record<string, { income: number; expenses: number }> = {};
        
        paidAppointments.forEach(appt => {
            const weekNumber = getWeek(new Date(appt.date + 'T00:00:00'), { locale: es, weekStartsOn: 1 });
            const weekLabel = `Semana ${weekNumber}`;
            if (!weeklyData[weekLabel]) weeklyData[weekLabel] = { income: 0, expenses: 0 };
            weeklyData[weekLabel].income += appt.totalPrice;
        });

        filteredExpenses.forEach(exp => {
            const weekNumber = getWeek(new Date(exp.date + 'T00:00:00'), { locale: es, weekStartsOn: 1 });
            const weekLabel = `Semana ${weekNumber}`;
            if (!weeklyData[weekLabel]) weeklyData[weekLabel] = { income: 0, expenses: 0 };
            weeklyData[weekLabel].expenses += exp.amount;
        });
        
        chartData = Object.entries(weeklyData)
          .map(([label, data]) => ({ label, ...data }))
          .sort((a,b) => parseInt(a.label.split(' ')[1]) - parseInt(b.label.split(' ')[1]));

    } else if (timeRange === 'week') {
        const dailyData: Record<string, { income: number; expenses: number }> = {};
        const daysOfWeek = eachDayOfInterval({ start: startDate, end: endDate });
        const dayOrder = daysOfWeek.map(d => format(d, "E", { locale: es }));
        
        dayOrder.forEach(dayLabel => {
            dailyData[dayLabel] = { income: 0, expenses: 0 };
        });
        
        paidAppointments.forEach(appt => {
            const dayLabel = format(new Date(appt.date + 'T00:00:00'), "E", { locale: es });
            if (dailyData[dayLabel] !== undefined) dailyData[dayLabel].income += appt.totalPrice;
        });

        filteredExpenses.forEach(exp => {
            const dayLabel = format(new Date(exp.date + 'T00:00:00'), "E", { locale: es });
            if (dailyData[dayLabel] !== undefined) dailyData[dayLabel].expenses += exp.amount;
        });

        chartData = dayOrder.map(label => ({ label, ...dailyData[label] }));
    }

    return {
        totalRevenue,
        totalExpenses,
        netProfit,
        chartData,
        paidAppointmentsCount: paidAppointments.length,
    };
}, [appointments, expenses, timeRange]);


  const handleConfirmPayment = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(appt =>
        appt.id === appointmentId ? { ...appt, paymentStatus: 'Pagado' } : appt
      )
    );
     toast({
        title: "¡Pago Confirmado!",
        description: "El estado de la cita ha sido actualizado a 'Pagado'.",
    });
  };
  
  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorData) return;
    const formData = new FormData(e.currentTarget);
    const updatedData = {
        ...doctorData,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        whatsapp: formData.get('whatsapp') as string,
        address: formData.get('address') as string,
        description: formData.get('description') as string,
    };
    
    // In a real application, you would handle file uploads here
    // For this prototype, we'll just acknowledge the form data
    setDoctorData(updatedData);

    if (user?.name !== updatedData.name) {
      updateUser({ name: updatedData.name });
    }

    toast({
        title: "¡Perfil Actualizado!",
        description: "Tu información de contacto ha sido guardada.",
    });
  };
  
  const handleOpenServiceDialog = (service: Service | null) => {
    setEditingService(service);
    setServiceName(service ? service.name : '');
    setServicePrice(service ? String(service.price) : '');
    setIsServiceDialogOpen(true);
  };
  
  const handleSaveService = () => {
    if (!doctorData || !serviceName || !servicePrice) return;
    const newService: Service = {
      id: editingService ? editingService.id : Date.now(),
      name: serviceName,
      price: parseFloat(servicePrice),
    };
    let updatedServices;
    if (editingService) {
      updatedServices = doctorData.services.map(s => s.id === editingService.id ? newService : s);
    } else {
      updatedServices = [...doctorData.services, newService];
    }
    setDoctorData({ ...doctorData, services: updatedServices });
    setIsServiceDialogOpen(false);
  };

  const handleDeleteService = (serviceId: number) => {
    if (!doctorData) return;
    const updatedServices = doctorData.services.filter(s => s.id !== serviceId);
    setDoctorData({ ...doctorData, services: updatedServices });
  };
  
    const handleScheduleChange = <T extends keyof DaySchedule>(
        dayKey: keyof Schedule,
        field: T,
        value: DaySchedule[T]
    ) => {
        if (!doctorData) return;
        const newSchedule = { ...doctorData.schedule };
        (newSchedule[dayKey] as any)[field] = value;
        setDoctorData({ ...doctorData, schedule: newSchedule });
    };

    const handleSlotChange = (
        dayKey: keyof Schedule,
        slotIndex: number,
        timeType: 'start' | 'end',
        time: string
    ) => {
        if (!doctorData) return;
        const newSchedule = { ...doctorData.schedule };
        newSchedule[dayKey].slots[slotIndex][timeType] = time;
        setDoctorData({ ...doctorData, schedule: newSchedule });
    };

    const handleAddSlot = (dayKey: keyof Schedule) => {
        if (!doctorData) return;
        const newSchedule = { ...doctorData.schedule };
        newSchedule[dayKey].slots.push({ start: '09:00', end: '17:00' });
        setDoctorData({ ...doctorData, schedule: newSchedule });
    };

    const handleRemoveSlot = (dayKey: keyof Schedule, slotIndex: number) => {
        if (!doctorData) return;
        const newSchedule = { ...doctorData.schedule };
        newSchedule[dayKey].slots.splice(slotIndex, 1);
        setDoctorData({ ...doctorData, schedule: newSchedule });
    };

  const handleOpenBankDetailDialog = (bankDetail: BankDetail | null) => {
    setEditingBankDetail(bankDetail);
    setBankName(bankDetail ? bankDetail.bank : '');
    setAccountHolder(bankDetail ? bankDetail.accountHolder : '');
    setIdNumber(bankDetail ? bankDetail.idNumber : '');
    setAccountNumber(bankDetail ? bankDetail.accountNumber : '');
    setIsBankDetailDialogOpen(true);
  };
  
  const handleSaveBankDetail = () => {
    if (!doctorData || !bankName || !accountHolder || !idNumber || !accountNumber) return;
    const newBankDetail: BankDetail = {
      id: editingBankDetail ? editingBankDetail.id : Date.now(),
      bank: bankName,
      accountHolder: accountHolder,
      idNumber: idNumber,
      accountNumber: accountNumber,
    };
    let updatedBankDetails;
    if (editingBankDetail) {
      updatedBankDetails = doctorData.bankDetails.map(bd => bd.id === editingBankDetail.id ? newBankDetail : bd);
    } else {
      updatedBankDetails = [...doctorData.bankDetails, newBankDetail];
    }
    setDoctorData({ ...doctorData, bankDetails: updatedBankDetails });
    setIsBankDetailDialogOpen(false);
  };

  const handleDeleteBankDetail = (bankDetailId: number) => {
    if (!doctorData) return;
    const updatedBankDetails = doctorData.bankDetails.filter(bd => bd.id !== bankDetailId);
    setDoctorData({ ...doctorData, bankDetails: updatedBankDetails });
  };

  const handleOpenExpenseDialog = (expense: Expense | null) => {
    setEditingExpense(expense);
    setExpenseDescription(expense ? expense.description : '');
    setExpenseAmount(expense ? String(expense.amount) : '');
    setExpenseDate(expense ? expense.date : new Date().toISOString().split('T')[0]);
    setIsExpenseDialogOpen(true);
  };

  const handleSaveExpense = () => {
    if (!doctorData || !expenseDescription || !expenseAmount || !expenseDate) return;
    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      doctorId: doctorData.id,
      description: expenseDescription,
      amount: parseFloat(expenseAmount),
      date: expenseDate,
    };

    let updatedExpenses;
    if (editingExpense) {
      updatedExpenses = expenses.map(e => e.id === editingExpense.id ? newExpense : e);
    } else {
      updatedExpenses = [...expenses, newExpense];
    }
    setExpenses(updatedExpenses);
    setIsExpenseDialogOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
  };
  
  const handleOpenCouponDialog = (coupon: Coupon | null) => {
    setEditingCoupon(coupon);
    setCouponCode(coupon ? coupon.code : '');
    setCouponValue(coupon ? String(coupon.value) : '');
    setCouponDiscountType(coupon ? coupon.discountType : 'percentage');
    setIsCouponDialogOpen(true);
  };

  const handleSaveCoupon = () => {
    if (!doctorData || !couponCode || !couponValue) return;
    const newCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : Date.now(),
      code: couponCode.toUpperCase(),
      discountType: couponDiscountType,
      value: parseFloat(couponValue),
    };

    let updatedCoupons;
    if (editingCoupon) {
      updatedCoupons = doctorData.coupons.map(c => c.id === editingCoupon.id ? newCoupon : c);
    } else {
      updatedCoupons = [...doctorData.coupons, newCoupon];
    }
    setDoctorData({ ...doctorData, coupons: updatedCoupons });
    setIsCouponDialogOpen(false);
    toast({
        title: editingCoupon ? "Cupón actualizado" : "Cupón creado",
        description: `El cupón ${newCoupon.code} ha sido guardado.`,
    });
  };

  const handleDeleteCoupon = (couponId: number) => {
    if (!doctorData) return;
    const updatedCoupons = doctorData.coupons.filter(c => c.id !== couponId);
    setDoctorData({ ...doctorData, coupons: updatedCoupons });
  };


  const handleUpdateAttendance = (appointmentId: string, attendance: 'Atendido' | 'No Asistió') => {
    setAppointments(prev =>
      prev.map(appt =>
        appt.id === appointmentId ? { ...appt, attendance } : appt
      )
    );
    toast({
      title: "Asistencia Actualizada",
      description: `La cita ha sido marcada como "${attendance}".`
    });
  };

  const handleViewDetails = (appointment: Appointment) => {
      const patient = patients.find(p => p.id === appointment.patientId);
      setSelectedAppointment({ ...appointment, patient });
      setIsDetailDialogOpen(true);
  };

  const handleSaveManualAppointment = () => {
    if (!doctorData || !newAppointment.patientName || !newAppointment.date || !newAppointment.time || newAppointment.selectedServices.length === 0) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, completa los campos obligatorios: Nombre del Paciente, Fecha, Hora y al menos un servicio.",
        });
        return;
    }

    // Create new patient
    const newPatientId = `pat-${Date.now()}`;
    const newPatient: Patient = {
        id: newPatientId,
        name: newAppointment.patientName,
        cedula: newAppointment.patientCedula,
        phone: newAppointment.patientPhone,
        email: newAppointment.patientEmail,
        age: null,
        gender: null,
    };
    setPatients(prev => [...prev, newPatient]);

    // Create new appointment
    const services = doctorData.services.filter(s => newAppointment.selectedServices.includes(s.id));
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    const newAppt: Appointment = {
        id: `appt-${Date.now()}`,
        patientId: newPatientId,
        patientName: newPatient.name,
        doctorName: doctorData.name,
        doctorId: doctorData.id,
        date: format(newAppointment.date, 'yyyy-MM-dd'),
        time: newAppointment.time,
        services: services,
        totalPrice: totalPrice,
        paymentMethod: newAppointment.paymentMethod,
        paymentStatus: 'Pagado', // Assume paid on the spot
        paymentProof: null,
        attendance: 'Atendido', // Assume attended
    };

    // Add to appointments and re-sort
    setAppointments(prev => [...prev, newAppt].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setIsAddAppointmentOpen(false);
    setNewAppointment(initialNewAppointmentState); // Reset form
    toast({
        title: "¡Cita Registrada!",
        description: `La cita para ${newPatient.name} ha sido creada exitosamente.`
    });
};

const handleReportPayment = () => {
    if (!newPaymentReport.reference || !newPaymentReport.amount) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, complete todos los campos.' });
        return;
    }
    const report: PaymentReport = {
        id: `pay-${Date.now()}`,
        date: format(newPaymentReport.date, 'yyyy-MM-dd'),
        referenceNumber: newPaymentReport.reference,
        amount: parseFloat(newPaymentReport.amount),
        status: 'Pendiente',
        proofUrl: 'https://placehold.co/400x200.png' // Mock URL
    };
    setPaymentReports(prev => [report, ...prev]);
    setIsReportPaymentOpen(false);
    setNewPaymentReport({ date: new Date(), reference: '', amount: '' });
    toast({ title: 'Pago Reportado', description: 'Tu reporte de pago ha sido enviado para verificación.' });
};

const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.message) {
        toast({ variant: 'destructive', title: 'Error', description: 'Asunto y mensaje son requeridos.' });
        return;
    }
    const ticket: SupportTicket = {
        id: `tic-${Date.now()}`,
        subject: newTicket.subject,
        status: 'Abierto',
        createdAt: new Date().toISOString().split('T')[0],
        messages: [
            { from: 'doctor', message: newTicket.message, date: new Date().toISOString() }
        ]
    };
    setSupportTickets(prev => [ticket, ...prev]);
    setIsNewTicketOpen(false);
    setNewTicket({ subject: '', message: '' });
    toast({ title: 'Ticket Creado', description: 'Tu solicitud de soporte ha sido enviada.' });
};

const handleReplyToTicket = (ticketId: string) => {
    if (!ticketReply.trim()) return;

    setSupportTickets(prev => prev.map(ticket => {
        if (ticket.id === ticketId) {
            const newMessage = {
                from: 'doctor' as const,
                message: ticketReply,
                date: new Date().toISOString()
            };
            return {
                ...ticket,
                messages: [...ticket.messages, newMessage]
            };
        }
        return ticket;
    }));

    setTicketReply('');
    toast({ title: 'Respuesta Enviada' });
};


  if (isLoading || !user || !doctorData || !financialStats) {
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

  const renderContent = () => {
    switch(view) {
        case 'appointments':
            return (
                <div className="space-y-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><CalendarCheck /> Citas Próximas</CardTitle>
                                <CardDescription>
                                    Tienes {upcomingAppointments.length} citas programadas.
                                </CardDescription>
                            </div>
                            <Button onClick={() => setIsAddAppointmentOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Agregar Cita Manual
                            </Button>
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
                             {/* Desktop Table */}
                            <Table className="hidden md:table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead>Pago</TableHead>
                                        <TableHead className="text-center">Asistencia</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pastAppointments.length > 0 ? pastAppointments.map((appt) => (
                                        <TableRow key={appt.id}>
                                            <TableCell className="font-medium">{appt.patientName}</TableCell>
                                            <TableCell>{new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                                            <TableCell className="capitalize">{appt.paymentMethod}</TableCell>
                                            <TableCell>
                                                <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(appt.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500', "text-white")}>
                                                    {appt.paymentStatus}
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
                                            <TableCell colSpan={6} className="text-center h-24">No hay citas en el historial.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                             {/* Mobile Cards */}
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
                                        <Separator/>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="font-semibold text-sm mb-1">Pago</p>
                                                <div className="flex flex-col items-start gap-1">
                                                    <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(appt.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500', "text-white")}>
                                                        {appt.paymentStatus}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {appt.paymentMethod}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm mb-1">Asistencia</p>
                                                {appt.attendance === 'Pendiente' ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">Marcar <MoreVertical className="ml-1 h-4 w-4" /></Button>
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
                                    </div>
                                )) : (
                                    <div className="text-center h-24 flex items-center justify-center text-muted-foreground">No hay citas en el historial.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        case 'finances':
             return (
                <div className="space-y-6">
                    <Tabs defaultValue="month" onValueChange={(value) => setTimeRange(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            <TabsTrigger value="today">Hoy</TabsTrigger>
                            <TabsTrigger value="week">Esta Semana</TabsTrigger>
                            <TabsTrigger value="month">Este Mes</TabsTrigger>
                            <TabsTrigger value="year">Este Año</TabsTrigger>
                        </TabsList>
                    </Tabs>

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
                      <CardHeader>
                          <CardTitle>Resumen Financiero: {timeRangeLabels[timeRange]}</CardTitle>
                          <CardDescription>Comparativa de ingresos y gastos para el período seleccionado.</CardDescription>
                      </CardHeader>
                      <CardContent className="pl-2">
                          {timeRange !== 'today' && financialStats.chartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                                <BarChart accessibilityLayer data={financialStats.chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                          ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                              <p>
                                {timeRange === 'today' 
                                  ? 'La vista de gráfico no está disponible para el día de hoy.'
                                  : 'No hay datos financieros para mostrar en este período.'
                                }
                              </p>
                            </div>
                          )}
                      </CardContent>
                  </Card>
                  <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle>Registro de Gastos</CardTitle>
                                    <CardDescription>Administra todos los gastos de tu consultorio.</CardDescription>
                                </div>
                                <Button onClick={() => handleOpenExpenseDialog(null)} className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto
                                </Button>
                            </div>
                        </CardHeader>
                      <CardContent>
                          {/* Desktop Table */}
                          <Table className="hidden md:table">
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Descripción</TableHead>
                                      <TableHead className="text-right">Monto</TableHead>
                                      <TableHead className="w-[120px] text-center">Acciones</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {expenses.length > 0 ? expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                      <TableRow key={expense.id}>
                                          <TableCell>{new Date(expense.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                                          <TableCell className="font-medium">{expense.description}</TableCell>
                                          <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="outline" size="icon" onClick={() => handleOpenExpenseDialog(expense)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="destructive" size="icon" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                          </TableCell>
                                      </TableRow>
                                  )) : (
                                      <TableRow>
                                          <TableCell colSpan={4} className="text-center h-24">No hay gastos registrados.</TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>

                           {/* Mobile Cards */}
                          <div className="space-y-4 md:hidden">
                            {expenses.length > 0 ? expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                <div key={expense.id} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-medium">{expense.description}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(expense.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <p className="font-semibold text-lg text-right font-mono">${expense.amount.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenExpenseDialog(expense)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="mr-2 h-4 w-4" /> Borrar</Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-8">No hay gastos registrados.</p>
                            )}
                          </div>
                      </CardContent>
                  </Card>
                </div>
            )
        case 'profile':
            return (
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User />Mi Perfil Profesional</CardTitle>
                    <CardDescription>Actualiza tu información pública. Estos datos serán visibles para los pacientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                        <div className="space-y-4">
                            <div>
                                <Label>Foto de Perfil</Label>
                                <div className="flex items-center gap-4 mt-2">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={doctorData.profileImage} alt="Foto de perfil" />
                                        <AvatarFallback>{doctorData.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Input id="profileImage" name="profileImage" type="file" className="flex-1" />
                                </div>
                            </div>
                            <div>
                                <Label>Foto de Banner (Consultorio)</Label>
                                <div className="mt-2">
                                    <div className="aspect-video w-full rounded-md border overflow-hidden mb-2 bg-muted">
                                    <Image src={doctorData.bannerImage} alt="Banner del consultorio" width={1280} height={720} className="object-cover w-full h-full" />
                                    </div>
                                    <Input id="bannerImage" name="bannerImage" type="file" />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                           <Label htmlFor="name">Nombre Completo</Label>
                           <Input id="name" name="name" defaultValue={doctorData.name} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico de Contacto</Label>
                                <Input id="email" name="email" type="email" defaultValue={doctorData.email} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp</Label>
                                <Input id="whatsapp" name="whatsapp" placeholder="+584121234567" defaultValue={doctorData.whatsapp} required/>
                            </div>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="specialty">Especialidad</Label>
                           <Select 
                                value={doctorData.specialty}
                                onValueChange={(value) => {
                                    if(doctorData) {
                                        setDoctorData({...doctorData, specialty: value})
                                    }
                                }}
                            >
                             <SelectTrigger id="specialty">
                               <SelectValue placeholder="Selecciona una especialidad" />
                             </SelectTrigger>
                             <SelectContent>
                               {specialties.map(s => (
                                 <SelectItem key={s} value={s}>{s}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad</Label>
                                <Select
                                    value={doctorData.city}
                                    onValueChange={(value) => {
                                        if (doctorData) {
                                            setDoctorData({ ...doctorData, city: value, sector: '' });
                                        }
                                    }}
                                >
                                    <SelectTrigger id="city">
                                        <SelectValue placeholder="Selecciona una ciudad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sector">Sector</Label>
                                <Select
                                    value={doctorData.sector}
                                    onValueChange={(value) => {
                                        if (doctorData) {
                                            setDoctorData({ ...doctorData, sector: value });
                                        }
                                    }}
                                    disabled={!doctorData.city}
                                >
                                    <SelectTrigger id="sector">
                                        <SelectValue placeholder="Selecciona un sector" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctorData.city && locations[doctorData.city] ? (
                                            locations[doctorData.city].map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="" disabled>Selecciona una ciudad primero</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="address">Dirección Completa</Label>
                           <Input id="address" name="address" defaultValue={doctorData.address} />
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="description">Descripción del Perfil</Label>
                           <Textarea id="description" name="description" defaultValue={doctorData.description} placeholder="Una breve descripción sobre ti, tu experiencia y tu enfoque médico." rows={4}/>
                        </div>
                        <Button type="submit">Guardar Cambios</Button>
                    </form>
                </CardContent>
               </Card>
            )
        case 'services':
            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><BriefcaseMedical /> Mis Servicios</CardTitle>
                        <CardDescription>Gestiona los servicios que ofreces y sus precios.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenServiceDialog(null)}><PlusCircle className="mr-2"/> Agregar Servicio</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Servicio</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctorData.services.map(service => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell className="text-right">${service.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-center space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenServiceDialog(service)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteService(service.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
              </Card>
            )
        case 'schedule':
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarClock /> Mi Horario de Trabajo</CardTitle>
                        <CardDescription>Define tu disponibilidad semanal y la duración de tus citas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div>
                            <Label className="text-base font-semibold">Duración de la Cita</Label>
                            <RadioGroup
                                value={String(doctorData.slotDuration)}
                                onValueChange={(value) => setDoctorData({ ...doctorData, slotDuration: parseInt(value, 10) as 30 | 60 })}
                                className="mt-2 flex items-center space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="30" id="slot-30" />
                                    <Label htmlFor="slot-30" className="font-normal">30 minutos</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="60" id="slot-60" />
                                    <Label htmlFor="slot-60" className="font-normal">60 minutos</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <Separator />
                        <div>
                            <Label className="text-base font-semibold">Horario Semanal</Label>
                            <div className="space-y-4 mt-2">
                                {weekDays.map(({ key, label }) => {
                                    const daySchedule = doctorData.schedule[key];
                                    return (
                                        <Card key={key} className={cn(!daySchedule.active && "bg-muted/50")}>
                                            <CardContent className="p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor={`switch-${key}`} className="text-lg font-medium">{label}</Label>
                                                    <Switch
                                                        id={`switch-${key}`}
                                                        checked={daySchedule.active}
                                                        onCheckedChange={(checked) => handleScheduleChange(key, 'active', checked)}
                                                    />
                                                </div>
                                                {daySchedule.active && (
                                                    <div className="space-y-4 pt-2 pl-2 border-l-2 border-primary/50 ml-2 md:pl-4 md:ml-4">
                                                        {daySchedule.slots.map((slot, index) => (
                                                            <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                                <div className="flex-1 flex items-center gap-2">
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.start}
                                                                        onChange={(e) => handleSlotChange(key, index, 'start', e.target.value)}
                                                                    />
                                                                    <span className="font-semibold text-muted-foreground">-</span>
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.end}
                                                                        onChange={(e) => handleSlotChange(key, index, 'end', e.target.value)}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleRemoveSlot(key, index)}
                                                                    className="self-end sm:self-center"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                    <span className="sr-only">Eliminar bloque</span>
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleAddSlot(key)}
                                                            className="w-full sm:w-auto"
                                                        >
                                                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar bloque
                                                        </Button>
                                                    </div>
                                                )}
                                                {!daySchedule.active && (
                                                    <p className="text-sm text-muted-foreground pl-4">Día no laborable</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'bank-details':
            return (
               <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Coins /> Datos Bancarios</CardTitle>
                        <CardDescription>Gestiona tus cuentas bancarias para recibir pagos.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenBankDetailDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2"/> Agregar Cuenta</Button>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <Table className="hidden md:table">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Banco</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>Nro. de Cuenta</TableHead>
                                <TableHead>C.I./R.I.F.</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctorData.bankDetails.map(bd => (
                                <TableRow key={bd.id}>
                                    <TableCell className="font-medium">{bd.bank}</TableCell>
                                    <TableCell>{bd.accountHolder}</TableCell>
                                    <TableCell>{bd.accountNumber}</TableCell>
                                    <TableCell>{bd.idNumber}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenBankDetailDialog(bd)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteBankDetail(bd.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {doctorData.bankDetails.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No tienes cuentas bancarias registradas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {/* Mobile Cards */}
                    <div className="space-y-4 md:hidden">
                        {doctorData.bankDetails.length > 0 ? doctorData.bankDetails.map(bd => (
                            <div key={bd.id} className="p-4 border rounded-lg space-y-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Banco</p>
                                        <p className="font-medium">{bd.bank}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Titular</p>
                                        <p className="font-medium">{bd.accountHolder}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Nro. Cuenta</p>
                                        <p className="font-mono text-sm">{bd.accountNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">C.I./R.I.F.</p>
                                        <p className="font-mono text-sm">{bd.idNumber}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenBankDetailDialog(bd)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteBankDetail(bd.id)}><Trash2 className="mr-2 h-4 w-4" /> Borrar</Button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No tienes cuentas bancarias registradas.</p>
                        )}
                    </div>
                </CardContent>
               </Card>
            )
        case 'coupons':
            return (
               <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Tag /> Cupones de Descuento</CardTitle>
                        <CardDescription>Crea y gestiona cupones para tus pacientes.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenCouponDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2"/> Agregar Cupón</Button>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <Table className="hidden md:table">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctorData.coupons.map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-medium">{coupon.code}</TableCell>
                                    <TableCell className="capitalize">{coupon.discountType === 'percentage' ? 'Porcentaje' : 'Fijo'}</TableCell>
                                    <TableCell className="text-right">{coupon.discountType === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenCouponDialog(coupon)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {doctorData.coupons.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No has creado ningún cupón.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {/* Mobile Cards */}
                    <div className="space-y-4 md:hidden">
                        {doctorData.coupons.length > 0 ? doctorData.coupons.map(coupon => (
                            <div key={coupon.id} className="p-4 border rounded-lg space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="font-semibold text-lg font-mono tracking-wider">{coupon.code}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{coupon.discountType === 'percentage' ? 'Monto Fijo' : 'Porcentaje'}</p>
                                    </div>
                                    <p className="font-bold text-xl text-primary">
                                        {coupon.discountType === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                                    </p>
                                </div>
                                <Separator />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenCouponDialog(coupon)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                    </Button>
                                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteCoupon(coupon.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Borrar
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No has creado ningún cupón.</p>
                        )}
                    </div>
                </CardContent>
               </Card>
            )
        case 'support':
            return (
                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <CardTitle>Estado de la Cuenta</CardTitle>
                                <Badge variant={doctorData.status === 'active' ? 'default' : 'destructive'} className={cn(
                                    "text-base",
                                    doctorData.status === 'active' ? 'bg-green-600 text-white' : ''
                                )}>
                                    {doctorData.status === 'active' 
                                        ? <CheckCircle className="mr-2 h-4 w-4" /> 
                                        : <XCircle className="mr-2 h-4 w-4" />}
                                    {doctorData.status === 'active' ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-muted-foreground text-sm">
                                Este es el estado actual de tu membresía en la plataforma SUMA. Si tu estado es inactivo, por favor reporta tu pago para reactivar tu cuenta.
                            </p>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="payments">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="payments"><ReceiptText className="mr-2" /> Reportar Pagos</TabsTrigger>
                            <TabsTrigger value="support"><LifeBuoy className="mr-2" /> Soporte Técnico</TabsTrigger>
                        </TabsList>
                        <TabsContent value="payments" className="mt-6">
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <CardTitle>Historial de Pagos Reportados</CardTitle>
                                        <CardDescription>Aquí puedes ver el estado de tus pagos mensuales.</CardDescription>
                                    </div>
                                    <Button onClick={() => setIsReportPaymentOpen(true)} className="w-full sm:w-auto"><PlusCircle className="mr-2"/> Reportar Nuevo Pago</Button>
                                </CardHeader>
                                <CardContent>
                                    {/* Desktop Table */}
                                    <Table className="hidden md:table">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Referencia</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                                <TableHead className="text-center">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paymentReports.map(report => (
                                                <TableRow key={report.id}>
                                                    <TableCell>{format(new Date(report.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                    <TableCell className="font-mono">{report.referenceNumber}</TableCell>
                                                    <TableCell className="text-right">${report.amount.toFixed(2)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={report.status === 'Verificado' ? 'default' : report.status === 'Rechazado' ? 'destructive' : 'secondary'} className={cn(report.status === 'Verificado' && 'bg-green-600 text-white')}>
                                                            {report.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {paymentReports.length === 0 && (
                                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No has reportado pagos.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    {/* Mobile Cards */}
                                    <div className="space-y-4 md:hidden">
                                        {paymentReports.length > 0 ? paymentReports.map(report => (
                                            <div key={report.id} className="p-4 border rounded-lg space-y-3">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <p className="font-semibold">Ref: <span className="font-mono">{report.referenceNumber}</span></p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(report.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}
                                                        </p>
                                                    </div>
                                                    <p className="font-bold text-lg">${report.amount.toFixed(2)}</p>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold text-sm">Estado:</p>
                                                    <Badge variant={report.status === 'Verificado' ? 'default' : report.status === 'Rechazado' ? 'destructive' : 'secondary'} className={cn(report.status === 'Verificado' && 'bg-green-600 text-white')}>
                                                        {report.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center h-24 flex items-center justify-center text-muted-foreground">No has reportado pagos.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="support" className="mt-6">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Mis Tickets de Soporte</CardTitle>
                                        <CardDescription>Comunícate con el equipo de SUMA para cualquier duda o problema.</CardDescription>
                                    </div>
                                    <Button onClick={() => setIsNewTicketOpen(true)}><PlusCircle className="mr-2"/> Crear Nuevo Ticket</Button>
                                </CardHeader>
                                <CardContent>
                                    {supportTickets.length > 0 ? (
                                        <Accordion type="single" collapsible className="w-full">
                                            {supportTickets.map(ticket => (
                                                <AccordionItem value={ticket.id} key={ticket.id}>
                                                    <AccordionTrigger>
                                                        <div className="flex-1 flex justify-between items-center pr-4">
                                                            <div className="text-left">
                                                                <p className="font-semibold">{ticket.subject}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Creado: {format(new Date(ticket.createdAt + 'T00:00:00'), "d MMM, yyyy", { locale: es })}
                                                                </p>
                                                            </div>
                                                            <Badge variant={ticket.status === 'Abierto' ? 'destructive' : 'default'}>{ticket.status}</Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-2 space-y-4">
                                                       <div className="max-h-60 overflow-y-auto space-y-4 p-4 border rounded-md bg-muted/50">
                                                            {ticket.messages.map((msg, index) => (
                                                              <div key={index} className={cn("flex items-end gap-2", msg.from === 'doctor' ? "justify-end" : "justify-start")}>
                                                                {msg.from === 'admin' && <Avatar className="h-8 w-8"><AvatarFallback>S</AvatarFallback></Avatar>}
                                                                <div className={cn("max-w-xs md:max-w-md rounded-lg px-3 py-2", msg.from === 'doctor' ? "bg-primary text-primary-foreground" : "bg-background")}>
                                                                    <p className="text-sm">{msg.message}</p>
                                                                    <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(msg.date), "d MMM, HH:mm", { locale: es })}</p>
                                                                </div>
                                                                {msg.from === 'doctor' && <Avatar className="h-8 w-8"><AvatarImage src={doctorData.profileImage} /><AvatarFallback>{doctorData.name.charAt(0)}</AvatarFallback></Avatar>}
                                                              </div>
                                                            ))}
                                                       </div>
                                                       {ticket.status === 'Abierto' && (
                                                          <div className="flex items-start gap-2 pt-4 border-t">
                                                              <Input
                                                                placeholder="Escribe tu respuesta..."
                                                                value={ticketReply}
                                                                onChange={(e) => setTicketReply(e.target.value)}
                                                                onKeyPress={(e) => e.key === 'Enter' && handleReplyToTicket(ticket.id)}
                                                              />
                                                              <Button onClick={() => handleReplyToTicket(ticket.id)}><Send className="h-4 w-4" /></Button>
                                                          </div>
                                                       )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">No tienes tickets de soporte.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )
        default:
            return null;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
          <h1 className="text-3xl font-bold font-headline mb-2">Panel del Médico</h1>
          <p className="text-muted-foreground mb-8">Gestiona tu perfil, servicios y citas.</p>

          <div className="space-y-4">
            {renderContent()}
          </div>

           <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService ? "Editar Servicio" : "Agregar Nuevo Servicio"}</DialogTitle>
                        <DialogDescription>
                            {editingService ? "Modifica los detalles de este servicio." : "Añade un nuevo servicio a tu lista."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="serviceName" className="text-right">Servicio</Label>
                            <Input id="serviceName" value={serviceName} onChange={e => setServiceName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="servicePrice" className="text-right">Precio ($)</Label>
                            <Input id="servicePrice" type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                         </DialogClose>
                        <Button type="button" onClick={handleSaveService}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isBankDetailDialogOpen} onOpenChange={setIsBankDetailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBankDetail ? "Editar Cuenta Bancaria" : "Agregar Nueva Cuenta"}</DialogTitle>
                        <DialogDescription>
                            {editingBankDetail ? "Modifica los detalles de esta cuenta." : "Añade una nueva cuenta para recibir transferencias."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bankName" className="text-right">Banco</Label>
                            <Input id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="accountHolder" className="text-right">Titular</Label>
                            <Input id="accountHolder" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="idNumber" className="text-right">C.I./R.I.F.</Label>
                            <Input id="idNumber" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="accountNumber" className="text-right">Nro. Cuenta</Label>
                            <Input id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                         </DialogClose>
                        <Button type="button" onClick={handleSaveBankDetail}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingExpense ? "Editar Gasto" : "Agregar Nuevo Gasto"}</DialogTitle>
                        <DialogDescription>
                           Registra un nuevo gasto para llevar un control financiero.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expenseDate" className="text-right">Fecha</Label>
                            <Input id="expenseDate" type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expenseDescription" className="text-right">Descripción</Label>
                            <Input id="expenseDescription" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expenseAmount" className="text-right">Monto ($)</Label>
                            <Input id="expenseAmount" type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                         </DialogClose>
                        <Button type="button" onClick={handleSaveExpense}>Guardar Gasto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCoupon ? "Editar Cupón" : "Agregar Nuevo Cupón"}</DialogTitle>
                        <DialogDescription>
                           Crea un nuevo cupón de descuento para tus pacientes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="couponCode" className="text-right">Código</Label>
                            <Input id="couponCode" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="couponValue" className="text-right">Valor</Label>
                            <Input id="couponValue" type="number" value={couponValue} onChange={e => setCouponValue(e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label className="text-right">Tipo</Label>
                             <RadioGroup
                                value={couponDiscountType}
                                onValueChange={(value: any) => setCouponDiscountType(value)}
                                className="col-span-3 flex items-center space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="percentage" id="percentage" />
                                  <Label htmlFor="percentage" className="font-normal flex items-center gap-1"><Percent className="h-4 w-4"/>Porcentaje (%)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="fixed" id="fixed" />
                                  <Label htmlFor="fixed" className="font-normal flex items-center gap-1"><DollarSign className="h-4 w-4"/>Monto Fijo ($)</Label>
                                </div>
                              </RadioGroup>
                        </div>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                         </DialogClose>
                        <Button type="button" onClick={handleSaveCoupon}>Guardar Cupón</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Cita</DialogTitle>
                        <DialogDescription>
                            Resumen completo de la cita y datos del paciente.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><User /> Información del Paciente</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-semibold">Nombre</p>
                                            <p className="text-muted-foreground">{selectedAppointment.patient?.name || 'N/A'}</p>
                                        </div>
                                         <div>
                                            <p className="font-semibold">Cédula</p>
                                            <p className="text-muted-foreground">{selectedAppointment.patient?.cedula || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold flex items-center gap-1"><Mail className="h-4 w-4"/> Correo</p>
                                            <p className="text-muted-foreground">{selectedAppointment.patient?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold flex items-center gap-1"><Phone className="h-4 w-4"/> Teléfono</p>
                                            <p className="text-muted-foreground">{selectedAppointment.patient?.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold flex items-center gap-1"><Cake className="h-4 w-4"/> Edad</p>
                                            <p className="text-muted-foreground">{selectedAppointment.patient?.age || 'No especificada'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold flex items-center gap-1"><VenetianMask className="h-4 w-4"/> Sexo</p>
                                            <p className="text-muted-foreground capitalize">{selectedAppointment.patient?.gender || 'No especificado'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><CalendarClock /> Detalles de la Cita</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-semibold">Fecha y Hora</p>
                                        <p className="text-muted-foreground">{new Date(selectedAppointment.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {selectedAppointment.time}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Servicios Solicitados</p>
                                        <ul className="list-disc list-inside text-muted-foreground">
                                          {selectedAppointment.services.map(s => <li key={s.id}>{s.name} (${s.price.toFixed(2)})</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Estado de Asistencia</p>
                                        <Badge variant={selectedAppointment.attendance === 'Atendido' ? 'default' : selectedAppointment.attendance === 'No Asistió' ? 'destructive' : 'secondary'} className={cn(selectedAppointment.attendance === 'Atendido' && 'bg-primary')}>
                                            {selectedAppointment.attendance}
                                        </Badge>
                                    </div>
                                </CardContent>
                                {(new Date(selectedAppointment.date + 'T00:00:00') <= startOfDay(new Date())) && selectedAppointment.attendance === 'Pendiente' && (
                                    <CardFooter className="justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                handleUpdateAttendance(selectedAppointment.id, 'No Asistió');
                                                setSelectedAppointment(prev => prev ? {...prev, attendance: 'No Asistió'} : null);
                                            }}
                                        >
                                            <UserX className="mr-2 h-4 w-4" />
                                            Marcar No Asistió
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                handleUpdateAttendance(selectedAppointment.id, 'Atendido');
                                                setSelectedAppointment(prev => prev ? {...prev, attendance: 'Atendido'} : null);
                                            }}
                                        >
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Marcar Atendido
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><DollarSign /> Información de Pago</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                           <p className="font-semibold">Monto Total</p>
                                           <p className="text-2xl font-bold text-primary">${selectedAppointment.totalPrice.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                           <p className="font-semibold">Estado del Pago</p>
                                           <Badge variant={selectedAppointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn(
                                                selectedAppointment.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500',
                                                "text-white"
                                            )}>
                                                {selectedAppointment.paymentStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Separator />
                                     <div>
                                        <p className="font-semibold">Método de Pago</p>
                                        <p className="text-muted-foreground capitalize">{selectedAppointment.paymentMethod}</p>
                                    </div>
                                    {selectedAppointment.paymentMethod === 'transferencia' && selectedAppointment.paymentProof && (
                                        <div>
                                            <p className="font-semibold flex items-center gap-1"><FileImage className="h-4 w-4"/> Comprobante de Pago</p>
                                             <Image src={selectedAppointment.paymentProof} alt="Comprobante de pago" width={400} height={200} className="rounded-md border mt-2"/>
                                        </div>
                                    )}
                                </CardContent>
                                {selectedAppointment.paymentStatus === 'Pendiente' && (
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                handleConfirmPayment(selectedAppointment.id);
                                                setSelectedAppointment(prev => prev ? {...prev, paymentStatus: 'Pagado'} : null);
                                            }}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Confirmar Pago
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline">Cerrar</Button>
                         </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddAppointmentOpen} onOpenChange={setIsAddAppointmentOpen}>
              <DialogContent className="max-w-3xl">
                  <DialogHeader>
                      <DialogTitle>Registrar Cita Manual</DialogTitle>
                      <DialogDescription>
                          Completa los datos para registrar una nueva cita para un paciente.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid md:grid-cols-2 gap-8 py-4 max-h-[70vh] overflow-y-auto pr-4">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Información del Paciente</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                              <div className="space-y-1">
                                <Label htmlFor="patientName">Nombre y Apellido</Label>
                                <Input id="patientName" value={newAppointment.patientName} onChange={(e) => setNewAppointment(p => ({...p, patientName: e.target.value}))}/>
                              </div>
                               <div className="space-y-1">
                                <Label htmlFor="patientCedula">Cédula</Label>
                                <Input id="patientCedula" value={newAppointment.patientCedula} onChange={(e) => setNewAppointment(p => ({...p, patientCedula: e.target.value}))}/>
                              </div>
                               <div className="space-y-1">
                                <Label htmlFor="patientEmail">Correo Electrónico</Label>
                                <Input id="patientEmail" type="email" value={newAppointment.patientEmail} onChange={(e) => setNewAppointment(p => ({...p, patientEmail: e.target.value}))}/>
                              </div>
                               <div className="space-y-1">
                                <Label htmlFor="patientPhone">Teléfono</Label>
                                <Input id="patientPhone" type="tel" value={newAppointment.patientPhone} onChange={(e) => setNewAppointment(p => ({...p, patientPhone: e.target.value}))}/>
                              </div>
                          </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Fecha y Hora</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Calendar
                                    mode="single"
                                    selected={newAppointment.date}
                                    onSelect={(date) => setNewAppointment(p => ({...p, date: date || new Date()}))}
                                    className="rounded-md border p-0"
                                    locale={es}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="appointmentTime">Hora (HH:MM)</Label>
                                    <Input id="appointmentTime" type="time" value={newAppointment.time} onChange={(e) => setNewAppointment(p => ({...p, time: e.target.value}))}/>
                                </div>
                            </CardContent>
                        </Card>
                      </div>
                      <div className="space-y-4">
                          <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Servicios Prestados</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {doctorData.services.map(service => (
                                    <div key={service.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                          id={`manual-service-${service.id}`}
                                          checked={newAppointment.selectedServices.includes(service.id)}
                                          onCheckedChange={(checked) => {
                                            setNewAppointment(prev => ({
                                                ...prev,
                                                selectedServices: checked
                                                    ? [...prev.selectedServices, service.id]
                                                    : prev.selectedServices.filter(id => id !== service.id)
                                            }));
                                          }}
                                        />
                                        <Label htmlFor={`manual-service-${service.id}`} className="font-normal flex justify-between w-full">
                                            <span>{service.name}</span>
                                            <span>${service.price.toFixed(2)}</span>
                                        </Label>
                                    </div>
                                ))}
                            </CardContent>
                          </Card>
                           <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Pago</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <RadioGroup 
                                  value={newAppointment.paymentMethod} 
                                  onValueChange={(value: any) => setNewAppointment(p => ({...p, paymentMethod: value}))}
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="efectivo" id="r-efectivo" />
                                    <Label htmlFor="r-efectivo" className="font-normal">Efectivo</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="transferencia" id="r-transferencia" />
                                    <Label htmlFor="r-transferencia" className="font-normal">Transferencia</Label>
                                  </div>
                                </RadioGroup>
                                <Separator/>
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span>${doctorData.services.filter(s => newAppointment.selectedServices.includes(s.id)).reduce((acc, s) => acc + s.price, 0).toFixed(2)}</span>
                                </div>
                            </CardContent>
                          </Card>
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button onClick={handleSaveManualAppointment}>Registrar Cita</Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isReportPaymentOpen} onOpenChange={setIsReportPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reportar Pago Mensual</DialogTitle>
                        <DialogDescription>
                            Completa los datos para registrar tu pago de la membresía.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Fecha del Pago</Label>
                            <Calendar mode="single" selected={newPaymentReport.date} onSelect={(d) => setNewPaymentReport(p => ({...p, date: d || new Date()}))} className="rounded-md border" locale={es} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-ref">Número de Referencia</Label>
                            <Input id="payment-ref" value={newPaymentReport.reference} onChange={(e) => setNewPaymentReport(p => ({...p, reference: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-amount">Monto ($)</Label>
                            <Input id="payment-amount" type="number" value={newPaymentReport.amount} onChange={(e) => setNewPaymentReport(p => ({...p, amount: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-proof">Comprobante de Pago</Label>
                            <Input id="payment-proof" type="file" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button onClick={handleReportPayment}>Enviar Reporte</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Ticket de Soporte</DialogTitle>
                        <DialogDescription>
                            Explica tu problema o duda y te responderemos a la brevedad.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ticket-subject">Asunto</Label>
                            <Input id="ticket-subject" value={newTicket.subject} onChange={(e) => setNewTicket(p => ({...p, subject: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-message">Mensaje</Label>
                            <Textarea id="ticket-message" value={newTicket.message} onChange={(e) => setNewTicket(p => ({...p, message: e.target.value}))} rows={5}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button onClick={handleCreateTicket}>Crear Ticket</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
      </main>
    </div>
  );
}

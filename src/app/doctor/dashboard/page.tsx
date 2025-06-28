
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appointments as mockAppointments, doctors, mockExpenses, type Appointment, type Doctor, type Service, type BankDetail, type Expense, type Patient, mockPatients } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, User, BriefcaseMedical, CalendarClock, PlusCircle, Trash2, Pencil, X, DollarSign, CheckCircle, Coins, TrendingUp, TrendingDown, Wallet, CalendarCheck, History, UserCheck, UserX, MoreVertical, Mail, Cake, VenetianMask, FileImage } from 'lucide-react';
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
import { startOfDay, endOfDay, startOfWeek, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, format, getWeek, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';


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
  const { user } = useAuth();
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

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<(Appointment & { patient?: Patient }) | null>(null);
  
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
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarCheck /> Citas Próximas</CardTitle>
                            <CardDescription>
                                Tienes {upcomingAppointments.length} citas programadas.
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
                             {/* Desktop Table */}
                            <Table className="hidden md:table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Servicios</TableHead>
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
                                            <TableCell className="text-sm">{appt.services.map(s => s.name).join(', ')}</TableCell>
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
                                        <div className="text-sm">
                                          <span className="font-semibold">Servicios: </span>
                                          {appt.services.map(s => s.name).join(', ')}
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
                    <CardTitle className="flex items-center gap-2"><User />Mi Perfil</CardTitle>
                    <CardDescription>Actualiza tu información pública y de contacto.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="name">Nombre Completo</Label>
                           <Input id="name" defaultValue={doctorData.name} />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="specialty">Especialidad</Label>
                           <Input id="specialty" defaultValue={doctorData.specialty} />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="address">Dirección del Consultorio</Label>
                           <Input id="address" defaultValue={doctorData.address} />
                        </div>
                        <Button>Guardar Cambios</Button>
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
                        <CardDescription>Define tu disponibilidad semanal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {weekDays.map(({ key, label }) => {
                            const daySchedule = doctorData.schedule[key];
                            return (
                                <div key={key} className="flex items-center justify-between p-3 rounded-md border">
                                    <div className="flex items-center space-x-4">
                                        <Switch
                                            id={`switch-${key}`}
                                            checked={daySchedule.active}
                                            onCheckedChange={(checked) => handleScheduleChange(key, 'active', checked)}
                                        />
                                        <Label htmlFor={`switch-${key}`} className="text-lg">{label}</Label>
                                    </div>
                                    {daySchedule.active && (
                                        <div className="flex items-center space-x-2">
                                            {daySchedule.slots.map((slot, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Input
                                                        type="time"
                                                        value={slot.start}
                                                        onChange={(e) => handleSlotChange(key, index, 'start', e.target.value)}
                                                        className="w-28"
                                                    />
                                                    <span>-</span>
                                                    <Input
                                                        type="time"
                                                        value={slot.end}
                                                        onChange={(e) => handleSlotChange(key, index, 'end', e.target.value)}
                                                        className="w-28"
                                                    />
                                                    {index > 0 && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(key, index)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => handleAddSlot(key)}>
                                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalles de la Cita</DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="py-4 space-y-4">
                            <div>
                                <h3 className="font-semibold">Paciente</h3>
                                <p>{selectedAppointment.patientName}</p>
                                <p className="text-sm text-muted-foreground">{selectedAppointment.patient?.email}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Fecha y Hora</h3>
                                <p>{new Date(selectedAppointment.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {selectedAppointment.time}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Servicios</h3>
                                <ul className="list-disc list-inside text-muted-foreground">
                                  {selectedAppointment.services.map(s => <li key={s.id}>{s.name}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold">Información de Pago</h3>
                                <p>Total: ${selectedAppointment.totalPrice.toFixed(2)}</p>
                                <p>Método: <span className="capitalize">{selectedAppointment.paymentMethod}</span></p>
                                {selectedAppointment.paymentProof && (
                                     <div className="mt-2">
                                        <p className="font-semibold">Comprobante:</p>
                                        <Image src={selectedAppointment.paymentProof} alt="Comprobante de pago" width={400} height={200} className="rounded-md border"/>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline">Cerrar</Button>
                         </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
      </main>
    </div>
  );
}

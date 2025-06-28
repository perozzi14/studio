
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appointments as mockAppointments, doctors, mockExpenses, type Appointment, type Doctor, type Service, type BankDetail, type Expense, type Patient, mockPatients, type Coupon } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, User, BriefcaseMedical, CalendarClock, PlusCircle, Trash2, Pencil, X, DollarSign, CheckCircle, Coins, TrendingUp, TrendingDown, Wallet, CalendarCheck, History, UserCheck, UserX, MoreVertical, Mail, Cake, VenetianMask, FileImage, Tag, Percent, Upload } from 'lucide-react';
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


// A simple mock for available times. In a real app, this would be more complex.
const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [schedule, setSchedule] = useState<string[]>(availableTimes);
  
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
        setSchedule(availableTimes);
        
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

    const paidAppointments = appointments.filter(a => a.paymentStatus === 'Pagado');
    const totalRevenue = paidAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const monthOrder = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const monthlyIncome = appointments
        .filter(a => a.paymentStatus === 'Pagado')
        .reduce((acc, appt) => {
            const month = new Date(appt.date + 'T00:00:00').toLocaleString('es-ES', { month: 'short' });
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '');
            if (!acc[capitalizedMonth]) acc[capitalizedMonth] = 0;
            acc[capitalizedMonth] += appt.totalPrice;
            return acc;
        }, {} as Record<string, number>);

    const monthlyExpenses = expenses.reduce((acc, exp) => {
        const month = new Date(exp.date + 'T00:00:00').toLocaleString('es-ES', { month: 'short' });
        const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '');
        if (!acc[capitalizedMonth]) acc[capitalizedMonth] = 0;
        acc[capitalizedMonth] += exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const allMonths = new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpenses)]);

    const chartData = monthOrder
      .filter(month => allMonths.has(month))
      .map(month => ({ 
        month, 
        income: monthlyIncome[month] || 0,
        expenses: monthlyExpenses[month] || 0,
       }));
    

    return {
        totalRevenue,
        totalExpenses,
        netProfit,
        chartData
    };
  }, [appointments, expenses]);

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
        specialty: formData.get('specialty') as string,
        city: formData.get('city') as string,
        sector: formData.get('sector') as string,
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
        description: "Tu información pública ha sido guardada.",
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
  
  const handleAddTime = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newTime = (form.elements.namedItem('newTime') as HTMLInputElement).value;
    if (newTime && !schedule.includes(newTime)) {
        setSchedule([...schedule, newTime].sort());
        form.reset();
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setSchedule(schedule.filter(t => t !== timeToRemove));
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
      const patient = mockPatients.find(p => p.id === appointment.patientId);
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
                            <Table>
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
                        </CardContent>
                    </Card>
                </div>
            )
        case 'finances':
             return (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold text-green-600">${financialStats.totalRevenue.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">Proveniente de citas pagadas</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                              <TrendingDown className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold text-red-600">${financialStats.totalExpenses.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">Total de gastos registrados</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${financialStats.netProfit.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">Ingresos menos gastos</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Citas Pagadas</CardTitle>
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">+{appointments.filter(a => a.paymentStatus === 'Pagado').length}</div>
                              <p className="text-xs text-muted-foreground">Total de citas con pago exitoso</p>
                          </CardContent>
                      </Card>
                  </div>
                  <Card>
                      <CardHeader>
                          <CardTitle>Resumen Mensual</CardTitle>
                          <CardDescription>Comparativa de ingresos y gastos por mes.</CardDescription>
                      </CardHeader>
                      <CardContent className="pl-2">
                          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                              <BarChart accessibilityLayer data={financialStats.chartData}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis
                                      dataKey="month"
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
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                              <CardTitle>Registro de Gastos</CardTitle>
                              <CardDescription>Administra todos los gastos de tu consultorio.</CardDescription>
                          </div>
                          <Button onClick={() => handleOpenExpenseDialog(null)}><PlusCircle className="mr-2"/> Agregar Gasto</Button>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Descripción</TableHead>
                                      <TableHead className="text-right">Monto</TableHead>
                                      <TableHead className="text-center">Acciones</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {expenses.length > 0 ? expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                      <TableRow key={expense.id}>
                                          <TableCell>{new Date(expense.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                                          <TableCell className="font-medium">{expense.description}</TableCell>
                                          <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                                          <TableCell className="text-center space-x-2">
                                              <Button variant="outline" size="icon" onClick={() => handleOpenExpenseDialog(expense)}><Pencil className="h-4 w-4" /></Button>
                                              <Button variant="destructive" size="icon" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                                          </TableCell>
                                      </TableRow>
                                  )) : (
                                      <TableRow>
                                          <TableCell colSpan={4} className="text-center h-24">No hay gastos registrados.</TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
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
                    <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
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
                         <div className="space-y-2">
                           <Label htmlFor="specialty">Especialidad</Label>
                           <Input id="specialty" name="specialty" defaultValue={doctorData.specialty} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <Label htmlFor="city">Ciudad</Label>
                               <Input id="city" name="city" defaultValue={doctorData.city} />
                            </div>
                             <div className="space-y-2">
                               <Label htmlFor="sector">Sector</Label>
                               <Input id="sector" name="sector" defaultValue={doctorData.sector} />
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
                    <CardTitle className="flex items-center gap-2"><CalendarClock />Mi Horario</CardTitle>
                    <CardDescription>Define los horarios en los que estás disponible para citas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-medium mb-4">Horas Disponibles</h4>
                        <div className="flex flex-wrap gap-2">
                            {schedule.map(time => (
                                <Badge key={time} variant="secondary" className="text-base px-3 py-1 relative group">
                                    {time}
                                    <button onClick={() => handleRemoveTime(time)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <form onSubmit={handleAddTime} className="flex items-end gap-4">
                         <div className="space-y-2 flex-grow">
                            <Label htmlFor="newTime">Agregar nueva hora</Label>
                            <Input id="newTime" name="newTime" type="time" />
                         </div>
                         <Button type="submit">Agregar</Button>
                    </form>
                </CardContent>
              </Card>
            )
        case 'bank-details':
            return (
               <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Coins /> Datos Bancarios</CardTitle>
                        <CardDescription>Gestiona tus cuentas bancarias para recibir pagos.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenBankDetailDialog(null)}><PlusCircle className="mr-2"/> Agregar Cuenta</Button>
                </CardHeader>
                <CardContent>
                    <Table>
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
                                    <TableCell className="text-center space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenBankDetailDialog(bd)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteBankDetail(bd.id)}><Trash2 className="h-4 w-4" /></Button>
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
                </CardContent>
               </Card>
            )
        case 'coupons':
            return (
               <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Tag /> Cupones de Descuento</CardTitle>
                        <CardDescription>Crea y gestiona cupones para tus pacientes.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenCouponDialog(null)}><PlusCircle className="mr-2"/> Agregar Cupón</Button>
                </CardHeader>
                <CardContent>
                    <Table>
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
                                    <TableCell className="text-center space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenCouponDialog(coupon)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}><Trash2 className="h-4 w-4" /></Button>
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-semibold">Nombre</p>
                                            <p className="text-muted-foreground">{selectedAppointment.patient?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Correo Electrónico</p>
                                            <p className="text-muted-foreground">{selectedAppointment.patient?.email || 'N/A'}</p>
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
                                {(new Date(selectedAppointment.date + 'T00:00:00') <= new Date(new Date().setHours(0,0,0,0)) && selectedAppointment.attendance === 'Pendiente') && (
                                    <CardFooter className="justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                handleUpdateAttendance(selectedAppointment.id, 'No Asistió');
                                                setIsDetailDialogOpen(false);
                                            }}
                                        >
                                            <UserX className="mr-2 h-4 w-4" />
                                            Marcar No Asistió
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                handleUpdateAttendance(selectedAppointment.id, 'Atendido');
                                                setIsDetailDialogOpen(false);
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
                                                setIsDetailDialogOpen(false);
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

        </div>
      </main>
    </div>
  );
}


"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appointments as mockAppointments, doctors, type Appointment, type Doctor, type Service } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye, User, BriefcaseMedical, CalendarClock, PlusCircle, Trash2, Pencil, X, DollarSign, CheckCircle } from 'lucide-react';
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
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";


// A simple mock for available times. In a real app, this would be more complex.
const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for managing the doctor's own data
  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [schedule, setSchedule] = useState<string[]>(availableTimes);
  
  // State for the service dialog
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');


  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/auth/login');
    } else if (user.role !== 'doctor') {
      router.push('/dashboard');
    } else {
      // For this mock, we'll find the doctor data for 'doctor@admin.com'.
      // Let's assume it's Dr. Ana Rodriguez (id: 1)
      const loggedInDoctor = doctors.find(d => d.id === 1);
      if (loggedInDoctor) {
        setDoctorData(loggedInDoctor);
        setSchedule(availableTimes); // You might want to store this in doctorData in a real app
      }
      
      // Filter appointments for the logged-in doctor
      const doctorAppointments = mockAppointments.filter(appt => appt.doctorId === loggedInDoctor?.id);
      setAppointments(doctorAppointments);
      setIsLoading(false);
    }
  }, [user, router]);
  
  const financialStats = useMemo(() => {
    if (!appointments) return null;

    const paidAppointments = appointments.filter(a => a.paymentStatus === 'Pagado');
    const pendingAppointments = appointments.filter(a => a.paymentStatus === 'Pendiente');

    const totalRevenue = paidAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const pendingRevenue = pendingAppointments.reduce((sum, a) => sum + a.totalPrice, 0);

    const monthlyIncome = appointments
        .filter(a => a.paymentStatus === 'Pagado')
        .reduce((acc, appt) => {
            const month = new Date(appt.date + 'T00:00:00').toLocaleString('es-ES', { month: 'short' });
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '');
            if (!acc[capitalizedMonth]) {
                acc[capitalizedMonth] = 0;
            }
            acc[capitalizedMonth] += appt.totalPrice;
            return acc;
        }, {} as Record<string, number>);
    
    // Ensure chronological order for the chart
    const monthOrder = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const chartData = monthOrder
      .filter(month => monthlyIncome[month] !== undefined)
      .map(month => ({ month, income: monthlyIncome[month] }));

    return {
        totalRevenue,
        pendingRevenue,
        paidCount: paidAppointments.length,
        pendingCount: pendingAppointments.length,
        chartData
    };
  }, [appointments]);

  const handleConfirmPayment = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(appt =>
        appt.id === appointmentId ? { ...appt, paymentStatus: 'Pagado' } : appt
      )
    );
  };
  
  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorData) return;
    const formData = new FormData(e.currentTarget);
    const updatedData = {
        ...doctorData,
        name: formData.get('name') as string,
        specialty: formData.get('specialty') as string,
        location: formData.get('location') as string,
    };
    setDoctorData(updatedData);
    // Here you would typically make an API call to save the data
    alert("¡Perfil actualizado! (simulación)");
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
          <h1 className="text-3xl font-bold font-headline mb-2">Panel del Médico</h1>
          <p className="text-muted-foreground mb-8">Gestiona tu perfil, servicios y citas.</p>

          <Tabs defaultValue="appointments" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="appointments">Citas</TabsTrigger>
              <TabsTrigger value="finances">Finanzas</TabsTrigger>
              <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
              <TabsTrigger value="services">Mis Servicios</TabsTrigger>
              <TabsTrigger value="schedule">Mi Horario</TabsTrigger>
            </TabsList>

            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Citas</CardTitle>
                  <CardDescription>
                    Tienes {appointments.length} citas programadas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Servicios</TableHead>
                        <TableHead className="text-right">Pago</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.length > 0 ? appointments.map((appt) => (
                        <TableRow key={appt.id}>
                          <TableCell className="font-medium">{appt.patientName}</TableCell>
                          <TableCell>
                            {new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} a las {appt.time}
                          </TableCell>
                          <TableCell>{appt.services.map(s => s.name).join(', ')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                                <span className="font-semibold">${appt.totalPrice.toFixed(2)}</span>
                                <Badge variant={appt.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={appt.paymentStatus === 'Pagado' ? 'bg-green-600' : 'bg-amber-500'}>
                                    {appt.paymentStatus === 'Pagado' ? <Check className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                                    {appt.paymentStatus}
                                </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {appt.paymentMethod === 'transferencia' && appt.paymentStatus === 'Pendiente' ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Revisar Pago
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Pago de {appt.patientName}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      El paciente ha subido un comprobante de pago. Por favor, verifica la transacción antes de confirmar.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4">
                                    <p className="font-semibold mb-2">Comprobante de Pago:</p>
                                    {appt.paymentProof ? (
                                        <Image src={appt.paymentProof} alt="Comprobante de pago" width={400} height={200} className="rounded-md border"/>
                                    ) : <p className="text-sm text-muted-foreground">No se subió comprobante.</p>}
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleConfirmPayment(appt.id)}>
                                        <Check className="mr-2 h-4 w-4" /> Marcar como Pagado
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <span className="text-xs text-muted-foreground capitalize">{appt.paymentMethod}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">No tienes citas próximas.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finances" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Totales (Pagado)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${financialStats.totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">de {financialStats.paidCount} citas confirmadas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${financialStats.pendingRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">de {financialStats.pendingCount} citas pendientes</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Citas Pagadas</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{financialStats.paidCount}</div>
                            <p className="text-xs text-muted-foreground">Total de citas con pago exitoso</p>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos por Mes</CardTitle>
                        <CardDescription>Un desglose de los ingresos confirmados mensualmente.</CardDescription>
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
                                <Bar
                                    dataKey="income"
                                    fill="var(--color-primary)"
                                    radius={8}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="profile">
               <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User />Mi Perfil Profesional</CardTitle>
                    <CardDescription>Actualiza tu información pública. Estos datos serán visibles para los pacientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                           <Label htmlFor="name">Nombre Completo</Label>
                           <Input id="name" name="name" defaultValue={doctorData.name} />
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="specialty">Especialidad</Label>
                           <Input id="specialty" name="specialty" defaultValue={doctorData.specialty} />
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="location">Ubicación de la Consulta</Label>
                           <Input id="location" name="location" defaultValue={doctorData.location} />
                        </div>
                        <Button type="submit">Guardar Cambios</Button>
                    </form>
                </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="services">
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
            </TabsContent>

            <TabsContent value="schedule">
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
            </TabsContent>
          </Tabs>

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
        </div>
      </main>
    </div>
  );
}

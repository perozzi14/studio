
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { doctors as allDoctors, sellers as allSellers, mockPatients, mockDoctorPayments, mockAdminSupportTickets, type Doctor, type Seller, type Patient, type DoctorPayment, type AdminSupportTicket } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, Stethoscope, UserCheck, BarChart, Settings, CheckCircle, XCircle, Pencil, Eye, Trash2, PlusCircle, Ticket, DollarSign, Wallet } from 'lucide-react';
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
  AlertDialogTrigger,
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const currentTab = searchParams.get('view') || 'overview';
  
  const [doctors, setDoctors] = useState<Doctor[]>(allDoctors);
  const [sellers, setSellers] = useState<Seller[]>(allSellers);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>(mockDoctorPayments);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>(mockAdminSupportTickets);
  const [isLoading, setIsLoading] = useState(true);

  // States for Seller management
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  // States for Doctor management
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  
  useEffect(() => {
    if (user === undefined) return;
    if (user === null || user.role !== 'admin') {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);
  
  const handleDoctorStatusChange = (doctorId: number, newStatus: 'active' | 'inactive') => {
      setDoctors(prevDoctors => 
        prevDoctors.map(doc => doc.id === doctorId ? { ...doc, status: newStatus } : doc)
      );
  };

  const handleOpenDoctorDialog = (doctor: Doctor | null) => {
    setEditingDoctor(doctor);
    setIsDoctorDialogOpen(true);
  };

  const handleViewDoctorDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteDoctor = () => {
    if (!doctorToDelete) return;
    setDoctors(prev => prev.filter(d => d.id !== doctorToDelete.id));
    toast({ title: "Médico Eliminado", description: `El perfil de ${doctorToDelete.name} ha sido eliminado.`});
    setIsDeleteDialogOpen(false);
    setDoctorToDelete(null);
  };

  const stats = useMemo(() => {
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.status === 'active').length;
    const totalSellers = sellers.length;
    const totalPatients = patients.length;
    
    const totalRevenue = doctorPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

    const commissionsPaid = sellers.reduce((acc, seller) => {
        const referredActiveCount = doctors.filter(d => d.sellerId === seller.id && d.status === 'active').length;
        return acc + (referredActiveCount * 50 * seller.commissionRate);
    }, 0);

    return {
        totalDoctors,
        activeDoctors,
        totalSellers,
        totalPatients,
        totalRevenue,
        commissionsPaid,
        netProfit: totalRevenue - commissionsPaid,
    }
  }, [doctors, sellers, patients, doctorPayments]);

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
                                  <CardTitle className="text-sm font-medium">Ingresos (Mes Actual)</CardTitle>
                                  <BarChart className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Estimado basado en médicos activos</p>
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
                                                 <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' && 'bg-green-600 text-white')}>
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
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog(doctor)}><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Vendedora</TableHead>
                                      <TableHead>Referidos (Activos)</TableHead>
                                      <TableHead>Comisión</TableHead>
                                      <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {sellers.map((seller) => {
                                    const sellerDoctors = doctors.filter(d => d.sellerId === seller.id);
                                    const activeDoctorsCount = sellerDoctors.filter(d => d.status === 'active').length;
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
                                          <TableCell className="text-right flex items-center justify-end gap-2">
                                              <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                                              <Button variant="outline" size="icon" onClick={() => { setEditingSeller(seller); setIsSellerDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                              <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                          </TableCell>
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                          </Table>
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
                                              <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                                              <Button variant="outline" size="icon"><Pencil className="h-4 w-4" /></Button>
                                              <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                    </Card>
                </div>
                )}

                {currentTab === 'finances' && (
                 <div className="mt-6">
                    <div className="space-y-6">
                       <div className="grid gap-4 md:grid-cols-3">
                          <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Ingresos Totales (Suscripciones)</CardTitle>
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Basado en los pagos de médicos</p>
                              </CardContent>
                          </Card>
                          <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Comisiones Pagadas</CardTitle>
                                  <Users className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold text-red-600">${stats.commissionsPaid.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Pagos a vendedoras</p>
                              </CardContent>
                          </Card>
                          <Card>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                                  <Wallet className="h-4 w-4 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
                                  <div className="text-2xl font-bold">${stats.netProfit.toFixed(2)}</div>
                                  <p className="text-xs text-muted-foreground">Ingresos - Comisiones</p>
                              </CardContent>
                          </Card>
                      </div>
                      <Card>
                        <CardHeader>
                            <CardTitle>Pagos de Médicos Recibidos</CardTitle>
                            <CardDescription>Historial de pagos de mensualidades de los médicos.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                 <Badge variant={payment.status === 'Paid' ? 'default' : 'secondary'} className={cn(payment.status === 'Paid' && 'bg-green-600 text-white')}>
                                                    {payment.status === 'Paid' ? 'Pagado' : 'Pendiente'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                      </Card>
                    </div>
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
                                              <Button variant="outline" size="sm">
                                                  <Eye className="mr-2 h-4 w-4" /> Ver Ticket
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                    </Card>
                </div>
                )}
           </>
        </div>
      </main>

      {/* Seller Dialog */}
      <Dialog open={isSellerDialogOpen} onOpenChange={setIsSellerDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingSeller ? 'Editar Vendedora' : 'Registrar Nueva Vendedora'}</DialogTitle>
                <DialogDescription>
                    {editingSeller ? 'Actualiza la información de la vendedora.' : 'Completa el formulario para agregar una nueva vendedora.'}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nombre</Label>
                    <Input id="name" defaultValue={editingSeller?.name || ''} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" defaultValue={editingSeller?.email || ''} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="commission" className="text-right">Comisión (%)</Label>
                    <Input id="commission" type="number" defaultValue={(editingSeller?.commissionRate || 0.2) * 100} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">Guardar</Button>
            </DialogFooter>
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
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="doc-name" className="text-right">Nombre</Label>
                    <Input id="doc-name" defaultValue={editingDoctor?.name || ''} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="doc-email" className="text-right">Email</Label>
                    <Input id="doc-email" type="email" defaultValue={editingDoctor?.email || ''} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="doc-specialty" className="text-right">Especialidad</Label>
                    <Input id="doc-specialty" defaultValue={editingDoctor?.specialty || ''} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="doc-address" className="text-right">Dirección</Label>
                    <Input id="doc-address" defaultValue={editingDoctor?.address || ''} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="doc-city" className="text-right">Ciudad</Label>
                    <Input id="doc-city" defaultValue={editingDoctor?.city || ''} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="doc-seller" className="text-right">Referido por</Label>
                     <Select defaultValue={editingDoctor?.sellerId?.toString() || 'null'}>
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
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Doctor View Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Detalles del Médico</DialogTitle>
            </DialogHeader>
            {selectedDoctor && (
                <div className="py-4 space-y-2">
                    <p><strong>Nombre:</strong> {selectedDoctor.name}</p>
                    <p><strong>Email:</strong> {selectedDoctor.email}</p>
                    <p><strong>WhatsApp:</strong> {selectedDoctor.whatsapp}</p>
                    <p><strong>Especialidad:</strong> {selectedDoctor.specialty}</p>
                    <p><strong>Ubicación:</strong> {selectedDoctor.address}, {selectedDoctor.sector}, {selectedDoctor.city}</p>
                    <p><strong>Referido por:</strong> {sellers.find(s => s.id === selectedDoctor.sellerId)?.name || 'SUMA'}</p>
                    <p><strong>Estado:</strong> <Badge variant={selectedDoctor.status === 'active' ? 'default' : 'destructive'} className={cn(selectedDoctor.status === 'active' && 'bg-green-600')}>{selectedDoctor.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></p>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar a este médico?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de <strong>{doctorToDelete?.name}</strong> del sistema.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoctor} className={cn(buttonVariants({variant: 'destructive'}))}>
                Sí, eliminar
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

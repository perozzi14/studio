
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { doctors as allDoctors, sellers as allSellers, mockPatients, mockDoctorPayments, mockAdminSupportTickets, mockSellerPayments, type Doctor, type Seller, type Patient, type DoctorPayment, type AdminSupportTicket, type Coupon, type SellerPayment, type BankDetail, appointments as initialAppointments, type Appointment } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, Stethoscope, UserCheck, BarChart, Settings, CheckCircle, XCircle, Pencil, Eye, Trash2, PlusCircle, Ticket, DollarSign, Wallet, MapPin, Tag, BrainCircuit, Globe, Image as ImageIcon, FileUp, Landmark, Mail, ThumbsUp, ThumbsDown } from 'lucide-react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/lib/settings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const currentTab = searchParams.get('view') || 'overview';
  
  const [doctors, setDoctors] = useState<Doctor[]>(allDoctors);
  const [sellers, setSellers] = useState<Seller[]>(allSellers);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>(mockDoctorPayments);
  const [sellerPayments, setSellerPayments] = useState<SellerPayment[]>(mockSellerPayments);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>(mockAdminSupportTickets);
  const [isLoading, setIsLoading] = useState(true);

  // States for Seller management
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [isSellerFinanceDialogOpen, setIsSellerFinanceDialogOpen] = useState(false);
  const [managingSeller, setManagingSeller] = useState<Seller | null>(null);
  const [isRegisterPaymentDialogOpen, setIsRegisterPaymentDialogOpen] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);

  // States for Doctor management
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'doctor' | 'seller' | 'patient', data: any} | null>(null);

  // States for Patient Management
  const [isPatientDetailDialogOpen, setIsPatientDetailDialogOpen] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);

    // State for Payment Approval
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // States for Settings
  const { 
      doctorSubscriptionFee, setDoctorSubscriptionFee,
      cities, setCities,
      specialties, setSpecialties,
      coupons, setCoupons,
      timezone, setTimezone,
      logoUrl, setLogoUrl,
      currency, setCurrency,
      companyBankDetails, setCompanyBankDetails,
  } = useSettings();
  
  const [tempSubscriptionFee, setTempSubscriptionFee] = useState<string>('');
  const [tempLogoUrl, setTempLogoUrl] = useState<string>('');
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [isSpecialtyDialogOpen, setIsSpecialtyDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<string | null>(null);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCompanyBankDetailDialogOpen, setIsCompanyBankDetailDialogOpen] = useState(false);
  const [editingCompanyBankDetail, setEditingCompanyBankDetail] = useState<BankDetail | null>(null);


  useEffect(() => {
    setTempSubscriptionFee(doctorSubscriptionFee.toString());
    setTempLogoUrl(logoUrl);
  }, [doctorSubscriptionFee, logoUrl]);
  
  const handleSaveSettings = () => {
    const newFee = parseFloat(tempSubscriptionFee);
    if (!isNaN(newFee) && newFee > 0) {
        setDoctorSubscriptionFee(newFee);
        setLogoUrl(tempLogoUrl);
        toast({ title: "Configuración Guardada", description: "Los ajustes generales han sido actualizados." });
    } else {
        toast({ variant: "destructive", title: "Valor Inválido", description: "Por favor, ingresa un número válido para la suscripción." });
    }
  };
  
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
  
  const handleOpenDeleteDialog = (itemType: 'doctor' | 'seller' | 'patient', item: any) => {
    setItemToDelete({ type: itemType, data: item });
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    const { type, data } = itemToDelete;
    
    switch (type) {
      case 'doctor':
        setDoctors(prev => prev.filter(d => d.id !== data.id));
        setCoupons(prev => prev.filter(c => c.scope !== data.id));
        toast({ title: "Médico Eliminado", description: `El perfil de ${data.name} ha sido eliminado.`});
        break;
      case 'seller':
        setSellers(prev => prev.filter(s => s.id !== data.id));
        toast({ title: "Vendedora Eliminada", description: `El perfil de ${data.name} ha sido eliminado.`});
        break;
      case 'patient':
        setPatients(prev => prev.filter(p => p.id !== data.id));
        toast({ title: "Paciente Eliminado", description: `El perfil de ${data.name} ha sido eliminado.`});
        break;
    }
    
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleOpenSellerFinanceDialog = (seller: Seller) => {
    setManagingSeller(seller);
    setIsSellerFinanceDialogOpen(true);
  };
  
  const handleRegisterPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = formData.get('amount') as string;
    const period = formData.get('period') as string;
    const transactionId = formData.get('transactionId') as string;

    if (!managingSeller || !amount || !period || !transactionId || !paymentProofUrl) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Completa todos los campos para registrar el pago." });
      return;
    }

    const newPayment: SellerPayment = {
      id: `pay-${Date.now()}`,
      sellerId: managingSeller.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      period,
      includedDoctors: doctors.filter(d => d.sellerId === managingSeller.id && d.status === 'active'),
      paymentProofUrl,
      transactionId,
    };

    setSellerPayments(prev => [newPayment, ...prev]);
    toast({ title: "Pago Registrado", description: `Se ha registrado el pago para ${managingSeller.name}.` });
    setIsRegisterPaymentDialogOpen(false);
    setPaymentProofUrl(null);
  };

  const handleViewPatientDetails = (patient: Patient) => {
    setSelectedPatientForDetail(patient);
    setIsPatientDetailDialogOpen(true);
  };

  const handleViewProof = (url: string | null) => {
    if (url) {
      setViewingProofUrl(url);
      setIsProofDialogOpen(true);
    }
  };

  const handleApprovePayment = (paymentId: string) => {
    let doctorToActivateId: number | null = null;
    let paymentDate: string | null = null;
    setDoctorPayments(prev => 
      prev.map(p => {
        if (p.id === paymentId) {
          doctorToActivateId = p.doctorId;
          paymentDate = p.date;
          return { ...p, status: 'Paid' };
        }
        return p;
      })
    );

    if (doctorToActivateId) {
      setDoctors(prev =>
        prev.map(doc => 
          doc.id === doctorToActivateId ? { ...doc, status: 'active', lastPaymentDate: paymentDate || new Date().toISOString().split('T')[0] } : doc
        )
      );
    }

    toast({
      title: "Pago Aprobado",
      description: "El pago ha sido marcado como 'Pagado' y el estado del médico ha sido actualizado.",
    });
  };

  const handleRejectPayment = (paymentId: string) => {
    setDoctorPayments(prev => 
      prev.map(p => p.id === paymentId ? { ...p, status: 'Rejected' } : p)
    );
    toast({
      variant: "destructive",
      title: "Pago Rechazado",
      description: "El pago ha sido marcado como 'Rechazado'.",
    });
  };

  const stats = useMemo(() => {
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.status === 'active').length;
    const totalSellers = sellers.length;
    const totalPatients = patients.length;
    
    const totalRevenue = doctorPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

    const commissionsPaid = sellerPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
        totalDoctors,
        activeDoctors,
        totalSellers,
        totalPatients,
        totalRevenue,
        commissionsPaid,
        netProfit: totalRevenue - commissionsPaid,
    }
  }, [doctors, sellers, patients, doctorPayments, sellerPayments]);

  const pendingDoctorPayments = useMemo(() => {
    return doctorPayments.filter(p => p.status === 'Pending');
  }, [doctorPayments]);

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
                                                <Button variant="outline" size="icon"><Pencil className="h-4 w-4" /></Button>
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
                                            <Button variant="outline" size="sm" className="flex-1"><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
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
                        <CardHeader>
                            <CardTitle>Pagos de Médicos Recibidos</CardTitle>
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
                                                <Button variant="outline" size="sm">
                                                    <Eye className="mr-2 h-4 w-4" /> Ver Ticket
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                                        
                                        <Button variant="outline" size="sm" className="w-full">
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
                                        <Select value={currency} onValueChange={setCurrency}>
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
                                        <Select value={timezone} onValueChange={setTimezone}>
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
                                            <p className="font-medium">{bd.bank}</p>
                                            <p className="text-xs text-muted-foreground">{bd.accountHolder}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="outline" onClick={() => { setEditingCompanyBankDetail(bd); setIsCompanyBankDetailDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                ))}
                                {companyBankDetails.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No hay cuentas bancarias registradas.</p>}
                                </div>
                            </CardContent>
                        </Card>
                      </div>

                        <div className="grid md:grid-cols-2 gap-6 items-start">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2"><MapPin /> Gestión de Ubicaciones</CardTitle>
                                    <Button size="sm" onClick={() => setIsCityDialogOpen(true)}><PlusCircle className="mr-2"/> Ciudad</Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                    {cities.map(city => (
                                        <div key={city} className="flex justify-between items-center p-2 rounded-md border">
                                            <span className="font-medium">{city}</span>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" onClick={() => { setEditingCity(city); setIsCityDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2"><BrainCircuit /> Gestión de Especialidades</CardTitle>
                                    <Button size="sm" onClick={() => setIsSpecialtyDialogOpen(true)}><PlusCircle className="mr-2"/> Nueva</Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                    {specialties.map(spec => (
                                        <div key={spec} className="flex justify-between items-center p-2 rounded-md border">
                                            <span className="font-medium">{spec}</span>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" onClick={() => { setEditingSpecialty(spec); setIsSpecialtyDialogOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
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
                                <Button size="sm" onClick={() => setIsCouponDialogOpen(true)}><PlusCircle className="mr-2"/> Cupón</Button>
                            </CardHeader>
                            <CardContent>
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
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
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

      {/* Seller Dialogs */}
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
                                <Button size="sm" onClick={() => setIsRegisterPaymentDialogOpen(true)}><PlusCircle className="mr-2" /> Registrar Pago</Button>
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
      
      <Dialog open={isRegisterPaymentDialogOpen} onOpenChange={setIsRegisterPaymentDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Registrar Pago para {managingSeller?.name}</DialogTitle>
                  <DialogDescription>Completa el formulario para registrar el pago de la comisión.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterPayment}>
                <div className="space-y-4 py-4">
                    <div><Label>Monto a Pagar ($)</Label><Input name="amount" type="number" step="0.01" required /></div>
                    <div><Label>Período de Comisión</Label><Input name="period" placeholder="Ej: Junio 2024" required /></div>
                    <div><Label>ID de Transacción</Label><Input name="transactionId" placeholder="ID de la transferencia" required /></div>
                    <div>
                        <Label>Comprobante de Pago (URL)</Label>
                        <Input name="paymentProofUrl" placeholder="https://..." required onChange={(e) => setPaymentProofUrl(e.target.value)} />
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

      {/* Patient Detail Dialog */}
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


      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar a este {itemToDelete?.type === 'doctor' ? 'médico' : itemToDelete?.type === 'seller' ? 'vendedora' : 'paciente'}?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de <strong>{itemToDelete?.data?.name}</strong> del sistema.
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
                  <DialogTitle>{editingCity ? `Editando "${editingCity}"` : 'Agregar Nueva Ciudad'}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="city-name">Nombre de la Ciudad</Label>
                  <Input id="city-name" defaultValue={editingCity || ''} />
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                  <Button>Guardar Ciudad</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isSpecialtyDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingSpecialty(null); setIsSpecialtyDialogOpen(isOpen); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingSpecialty ? `Editando "${editingSpecialty}"` : 'Agregar Nueva Especialidad'}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="specialty-name">Nombre de la Especialidad</Label>
                  <Input id="specialty-name" defaultValue={editingSpecialty || ''} />
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                  <Button>Guardar Especialidad</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isCompanyBankDetailDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingCompanyBankDetail(null); setIsCompanyBankDetailDialogOpen(isOpen); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingCompanyBankDetail ? 'Editar Cuenta de SUMA' : 'Agregar Nueva Cuenta de SUMA'}</DialogTitle>
                  <DialogDescription>Gestiona las cuentas donde los médicos pagarán sus suscripciones.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="bankName" className="text-right">Banco</Label>
                      <Input id="bankName" defaultValue={editingCompanyBankDetail?.bank || ''} className="col-span-3" />
                  </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="accountHolder" className="text-right">Titular</Label>
                      <Input id="accountHolder" defaultValue={editingCompanyBankDetail?.accountHolder || ''} className="col-span-3" />
                  </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="idNumber" className="text-right">C.I./R.I.F.</Label>
                      <Input id="idNumber" defaultValue={editingCompanyBankDetail?.idNumber || ''} className="col-span-3" />
                  </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="accountNumber" className="text-right">Nro. Cuenta</Label>
                      <Input id="accountNumber" defaultValue={editingCompanyBankDetail?.accountNumber || ''} className="col-span-3" />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                  <Button>Guardar Cuenta</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isCouponDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingCoupon(null); setIsCouponDialogOpen(isOpen); }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</DialogTitle>
                <DialogDescription>Completa la información para el cupón de descuento.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div><Label>Código</Label><Input defaultValue={editingCoupon?.code} placeholder="VERANO20"/></div>
                <div><Label>Tipo de Descuento</Label>
                    <RadioGroup defaultValue={editingCoupon?.discountType || 'percentage'} className="flex gap-4 pt-2">
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="percentage" /> Porcentaje (%)</Label>
                        <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="fixed" /> Fijo ($)</Label>
                    </RadioGroup>
                </div>
                <div><Label>Valor</Label><Input type="number" defaultValue={editingCoupon?.value} placeholder="20"/></div>
                <div><Label>Alcance</Label>
                    <Select defaultValue={editingCoupon?.scope.toString() || 'general'}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">General (Todos los Médicos)</SelectItem>
                            {doctors.map(doc => <SelectItem key={doc.id} value={doc.id.toString()}>{doc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button>Guardar Cupón</Button>
            </DialogFooter>
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

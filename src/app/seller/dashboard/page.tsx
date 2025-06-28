"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { doctors as allDoctors, mockSellerPayments, type Doctor, type SellerPayment } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Link, Users, DollarSign, Copy, CheckCircle, XCircle, Mail, Phone, Wallet, CalendarClock, Landmark, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MONTHLY_DOCTOR_FEE = 50;
const SELLER_COMMISSION_RATE = 0.20;
const COMMISSION_PER_DOCTOR = MONTHLY_DOCTOR_FEE * SELLER_COMMISSION_RATE;


export default function SellerDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('view') || 'referrals';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/auth/login');
    } else if (user.role !== 'seller') {
      router.push('/');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);
  
  const handleTabChange = (value: string) => {
    router.push(`/seller/dashboard?view=${value}`);
  };

  const referredDoctors = useMemo(() => {
    if (user?.role !== 'seller') return [];
    const sellerId = 1; 
    return allDoctors.filter(d => d.sellerId === sellerId);
  }, [user]);

  const financeStats = useMemo(() => {
    const activeReferred = referredDoctors.filter(d => d.status === 'active');
    const pendingCommission = activeReferred.length * COMMISSION_PER_DOCTOR;
    const totalEarned = mockSellerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const now = new Date();
    const nextPaymentMonth = getMonth(now) === 11 ? 0 : getMonth(now) + 1;
    const nextPaymentYear = getMonth(now) === 11 ? getYear(now) + 1 : getYear(now);
    const nextPaymentDate = `16 de ${format(new Date(nextPaymentYear, nextPaymentMonth), 'LLLL', { locale: es })}`;

    return {
      totalReferred: referredDoctors.length,
      activeReferredCount: activeReferred.length,
      pendingCommission,
      totalEarned,
      nextPaymentDate,
    };
  }, [referredDoctors]);

  const copyReferralLink = () => {
    if (!user?.referralCode) return;
    const link = `${window.location.origin}/auth/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "¡Enlace Copiado!",
      description: "El enlace de referido ha sido copiado al portapapeles.",
    });
  };

  if (isLoading || !user || user.role !== 'seller') {
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
  
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${user.referralCode}`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
            <h1 className="text-3xl font-bold font-headline mb-2">Panel de Vendedora</h1>
            <p className="text-muted-foreground mb-8">Bienvenida de nuevo, {user.name}. Aquí puedes gestionar tus médicos y finanzas.</p>

             <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="referrals">Mis Referidos</TabsTrigger>
                    <TabsTrigger value="finances">Finanzas</TabsTrigger>
                </TabsList>
                <TabsContent value="referrals" className="mt-6">
                    <div className="space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Link className="text-primary"/> Tu Enlace de Referido</CardTitle>
                                <CardDescription>Comparte este enlace con los médicos para que se registren bajo tu código.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-stretch gap-2">
                                <Input value={referralLink} readOnly className="text-sm bg-background flex-1"/>
                                <Button onClick={copyReferralLink} className="w-full sm:w-auto">
                                    <Copy className="mr-2 h-4 w-4"/>
                                    Copiar Enlace
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Médicos Referidos</CardTitle>
                                <CardDescription>Un resumen de todos los médicos que has ingresado. Total: {financeStats.totalReferred}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table className="hidden md:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Médico</TableHead>
                                            <TableHead>Contacto</TableHead>
                                            <TableHead>Especialidad</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead>Último Pago</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {referredDoctors.length > 0 ? referredDoctors.map((doctor) => (
                                            <TableRow key={doctor.id}>
                                                <TableCell className="font-medium">{doctor.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{doctor.email}</span></span>
                                                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{doctor.whatsapp}</span></span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{doctor.specialty}</TableCell>
                                                <TableCell>{doctor.city}, {doctor.sector}</TableCell>
                                                <TableCell>{format(new Date(doctor.lastPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' && 'bg-green-600 text-white')}>
                                                        {doctor.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                        {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">Aún no tienes médicos referidos. ¡Comparte tu enlace!</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="space-y-4 md:hidden">
                                    {referredDoctors.length > 0 ? referredDoctors.map((doctor) => (
                                        <div key={doctor.id} className="p-4 border rounded-lg space-y-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div><p className="font-bold">{doctor.name}</p><p className="text-sm text-muted-foreground">{doctor.specialty}</p></div>
                                                <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' && 'bg-green-600 text-white')}>
                                                    {doctor.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                    {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </div>
                                            <Separator/>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                                <div><p className="font-semibold text-xs text-muted-foreground mb-1">Ubicación</p><p>{doctor.city}</p></div>
                                                <div><p className="font-semibold text-xs text-muted-foreground mb-1">Último Pago</p><p>{format(new Date(doctor.lastPaymentDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</p></div>
                                                <div className="col-span-2"><p className="font-semibold text-xs text-muted-foreground mb-1">Contacto</p>
                                                    <div className="flex flex-col gap-1.5 text-xs">
                                                        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 flex-shrink-0" /> <span>{doctor.email}</span></span>
                                                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" /> <span>{doctor.whatsapp}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (<div className="h-24 text-center flex items-center justify-center text-muted-foreground">Aún no tienes médicos referidos. ¡Comparte tu enlace!</div>)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="finances" className="mt-6">
                    <div className="space-y-8">
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Comisión Pendiente (Este Mes)</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">${financeStats.pendingCommission.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">{financeStats.activeReferredCount} médicos activos x ${COMMISSION_PER_DOCTOR}/c.u.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total General Generado</CardTitle>
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${financeStats.totalEarned.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">Suma de todos los pagos recibidos.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Próxima Fecha de Pago</CardTitle>
                                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{financeStats.nextPaymentDate}</div>
                                    <p className="text-xs text-muted-foreground">Cierre de ciclo el 15 de cada mes.</p>
                                </CardContent>
                            </Card>
                        </div>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Landmark/> Historial de Pagos de SUMA</CardTitle>
                                <CardDescription>Registro de todas las comisiones que has recibido.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table className="hidden md:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha de Pago</TableHead>
                                            <TableHead>Período de Comisión</TableHead>
                                            <TableHead className="text-center">Médicos Pagados</TableHead>
                                            <TableHead className="text-right">Monto Recibido</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockSellerPayments.length > 0 ? mockSellerPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium">{format(new Date(payment.paymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                <TableCell>{payment.period}</TableCell>
                                                <TableCell className="text-center">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="link" className="text-sm p-0 h-auto">
                                                                <Eye className="mr-2 h-4 w-4"/>
                                                                Ver {payment.includedDoctors.length} médicos
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-2">
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-sm px-2">Médicos incluidos:</p>
                                                                <ul className="text-xs text-muted-foreground list-disc list-inside">
                                                                    {payment.includedDoctors.map(doc => <li key={doc.id}>{doc.name}</li>)}
                                                                </ul>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-green-600 font-semibold">${payment.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">No has recibido pagos aún.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                <div className="space-y-4 md:hidden">
                                     {mockSellerPayments.length > 0 ? mockSellerPayments.map((payment) => (
                                        <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{payment.period}</p>
                                                    <p className="text-sm text-muted-foreground">Pagado el {format(new Date(payment.paymentDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</p>
                                                </div>
                                                <p className="text-lg font-bold font-mono text-green-600">${payment.amount.toFixed(2)}</p>
                                            </div>
                                            <Separator/>
                                             <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Eye className="mr-2 h-4 w-4"/>
                                                        Ver {payment.includedDoctors.length} médicos incluidos
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-2">
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-sm px-2">Médicos incluidos:</p>
                                                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                                                            {payment.includedDoctors.map(doc => <li key={doc.id}>{doc.name}</li>)}
                                                        </ul>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                     )) : (
                                        <div className="h-24 text-center flex items-center justify-center text-muted-foreground">No has recibido pagos aún.</div>
                                     )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </main>
    </div>
  );
}

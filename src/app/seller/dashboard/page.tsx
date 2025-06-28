
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { doctors as allDoctors, type Doctor } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Link, Users, DollarSign, Copy, CheckCircle, XCircle, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SellerDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
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

  const referredDoctors = useMemo(() => {
    if (user?.role !== 'seller') return [];
    // In a real app, the seller ID would come from the user object.
    // For this mock, we'll assume seller ID is 1.
    const sellerId = 1; 
    return allDoctors.filter(d => d.sellerId === sellerId);
  }, [user]);

  const stats = useMemo(() => {
    const totalReferred = referredDoctors.length;
    const activeReferred = referredDoctors.filter(d => d.status === 'active').length;
    // Mock commission: $25 per active doctor
    const estimatedCommission = activeReferred * 25;
    return { totalReferred, estimatedCommission };
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
           <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             <Skeleton className="h-40 w-full" />
             <Skeleton className="h-28 w-full" />
             <Skeleton className="h-28 w-full" />
           </div>
            <div className="mt-8">
             <Skeleton className="h-64 w-full" />
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
            <p className="text-muted-foreground mb-8">Bienvenida de nuevo, {user.name}. Aquí puedes gestionar tus médicos referidos.</p>
          
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-3 grid md:grid-cols-3 gap-8">
                    <Card className="md:col-span-2">
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
                    <div className="space-y-8">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Médicos Referidos</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalReferred}</div>
                                <p className="text-xs text-muted-foreground">Total de médicos registrados</p>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Comisión Estimada (Mensual)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">${stats.estimatedCommission.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Basado en médicos activos</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista de Médicos Referidos</CardTitle>
                            <CardDescription>Un resumen de todos los médicos que has ingresado a la plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
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
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate">{doctor.email}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate">{doctor.whatsapp}</span>
                                                    </span>
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
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Aún no tienes médicos referidos. ¡Comparte tu enlace!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

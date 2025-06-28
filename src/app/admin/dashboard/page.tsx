
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { doctors as allDoctors, sellers as allSellers, mockPatients, type Doctor, type Seller, type Patient } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Stethoscope, UserCheck, BarChart, Settings, CheckCircle, XCircle, Pencil, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('view') || 'overview';
  
  const [doctors, setDoctors] = useState<Doctor[]>(allDoctors);
  const [sellers, setSellers] = useState<Seller[]>(allSellers);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null || user.role !== 'admin') {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);
  
  const handleTabChange = (value: string) => {
    router.push(`/admin/dashboard?view=${value}`);
  };

  const handleDoctorStatusChange = (doctorId: number, newStatus: 'active' | 'inactive') => {
      setDoctors(prevDoctors => 
        prevDoctors.map(doc => doc.id === doctorId ? { ...doc, status: newStatus } : doc)
      );
  };
  
  const stats = useMemo(() => {
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.status === 'active').length;
    const totalSellers = sellers.length;
    const totalPatients = patients.length;
    
    const totalRevenue = activeDoctors * 50;
    const commissionsPaid = sellers.reduce((acc, seller) => {
        const referredActive = doctors.filter(d => d.sellerId === seller.id && d.status === 'active').length;
        return acc + (referredActive * 50 * 0.20);
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
  }, [doctors, sellers, patients]);

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
          <h1 className="text-3xl font-bold font-headline mb-2">Panel de Administrador</h1>
          <p className="text-muted-foreground mb-8">Bienvenido, {user.name}. Gestiona todo el sistema SUMA desde aquí.</p>

           <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                    <TabsTrigger value="overview">General</TabsTrigger>
                    <TabsTrigger value="doctors">Médicos</TabsTrigger>
                    <TabsTrigger value="sellers">Vendedoras</TabsTrigger>
                    <TabsTrigger value="patients">Pacientes</TabsTrigger>
                    <TabsTrigger value="finances">Finanzas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
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
                </TabsContent>

                <TabsContent value="doctors" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Médicos</CardTitle>
                            <CardDescription>Visualiza, edita y gestiona el estado de todos los médicos en la plataforma.</CardDescription>
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
                                            <TableCell>{sellers.find(s => s.id === doctor.sellerId)?.name || 'N/A'}</TableCell>
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
                                                <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                                                <Button variant="outline" size="icon"><Pencil className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="sellers" className="mt-6">
                    <Card>
                      <CardHeader>
                          <CardTitle>Gestión de Vendedoras</CardTitle>
                          <CardDescription>Próximamente: gestiona las cuentas y referidos de las vendedoras.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                              <UserCheck className="h-12 w-12" />
                              <p>La funcionalidad de gestión de vendedoras estará disponible próximamente.</p>
                          </div>
                      </CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="patients" className="mt-6">
                     <Card>
                      <CardHeader>
                          <CardTitle>Gestión de Pacientes</CardTitle>
                          <CardDescription>Próximamente: busca y gestiona la información de los pacientes.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                              <Users className="h-12 w-12" />
                              <p>La funcionalidad de gestión de pacientes estará disponible próximamente.</p>
                          </div>
                      </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="finances" className="mt-6">
                    <Card>
                      <CardHeader>
                          <CardTitle>Finanzas Globales</CardTitle>
                          <CardDescription>Próximamente: un desglose completo de los ingresos, comisiones y ganancias.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                              <BarChart className="h-12 w-12" />
                              <p>La funcionalidad de finanzas globales estará disponible próximamente.</p>
                          </div>
                      </CardContent>
                    </Card>
                </TabsContent>

           </Tabs>
        </div>
      </main>
    </div>
  );
}

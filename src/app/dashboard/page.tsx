
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarPlus, ClipboardList, User, Edit } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; 
    if (user === null) {
      router.push('/auth/login');
    } else if (user?.role === 'doctor') {
      router.push('/doctor/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'patient') {
    return (
       <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12">
           <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
           </div>
           <div className="mt-8 grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                 <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                 <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
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
          <h1 className="text-3xl font-bold font-headline mb-2">¡Bienvenido de nuevo, {user.name}!</h1>
          <p className="text-muted-foreground mb-8">Este es tu panel médico personal.</p>
          
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 grid gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Citas</CardTitle>
                  <CardDescription>No tienes próximas citas agendadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                    <CalendarPlus className="h-12 w-12" />
                    <p>¿Listo para tu próxima consulta?</p>
                    <Button asChild>
                      <Link href="/find-a-doctor">Reservar una Cita</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial Médico</CardTitle>
                  <CardDescription>Un resumen de tus consultas pasadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                    <ClipboardList className="h-12 w-12" />
                    <p>Tu historial médico aparecerá aquí después de tu primera cita.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User /> Mi Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                   <div>
                      <p className="font-semibold">Nombre</p>
                      <p className="text-muted-foreground">{user.name}</p>
                   </div>
                    <div>
                      <p className="font-semibold">Correo Electrónico</p>
                      <p className="text-muted-foreground">{user.email}</p>
                   </div>
                    <div>
                      <p className="font-semibold">Edad</p>
                      <p className="text-muted-foreground">{user.age || 'No especificada'}</p>
                   </div>
                    <div>
                      <p className="font-semibold">Sexo</p>
                      <p className="text-muted-foreground capitalize">{user.gender || 'No especificado'}</p>
                   </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/profile">
                        <Edit className="mr-2 h-4 w-4"/>
                        Editar Perfil
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

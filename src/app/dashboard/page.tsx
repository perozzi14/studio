
"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header, BottomNav } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarPlus, ClipboardList, User, Edit, CalendarDays, Clock, ThumbsUp, CalendarX, CheckCircle, XCircle } from 'lucide-react';
import { useAppointments } from '@/lib/appointments';
import { useNotifications } from '@/lib/notifications';
import type { Appointment } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function AppointmentCard({ 
  appointment, 
  isPast = false,
  onUpdateConfirmation
}: { 
  appointment: Appointment, 
  isPast?: boolean,
  onUpdateConfirmation?: (id: string, status: 'Confirmada' | 'Cancelada') => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <p className="font-bold text-lg">{appointment.doctorName}</p>
          <p className="text-sm text-muted-foreground">{appointment.services.map(s => s.name).join(', ')}</p>
          <div className="flex items-center text-sm gap-4 pt-1 text-muted-foreground">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {appointment.time}</span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-auto hidden sm:block mx-2" />
        <Separator orientation="horizontal" className="w-full block sm:hidden my-2" />
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between">
          <p className="font-bold text-lg">${appointment.totalPrice.toFixed(2)}</p>
          {isPast ? (
              <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={appointment.attendance === 'Atendido' ? 'bg-green-600 text-white' : ''}>
                  {appointment.attendance}
              </Badge>
          ) : (
              <Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={appointment.paymentStatus === 'Pagado' ? 'bg-green-600 text-white' : ''}>
                  {appointment.paymentStatus}
              </Badge>
          )}
        </div>
      </CardContent>
      {!isPast && onUpdateConfirmation && (
        <CardFooter className="p-4 pt-0 border-t mt-4 flex-col sm:flex-row items-center gap-4">
          {appointment.patientConfirmationStatus === 'Pendiente' && (
            <>
              <p className="text-sm text-muted-foreground text-center sm:text-left flex-1">¿Asistirás a esta cita?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onUpdateConfirmation(appointment.id, 'Cancelada')}>
                  <CalendarX className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" onClick={() => onUpdateConfirmation(appointment.id, 'Confirmada')}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> Confirmar
                </Button>
              </div>
            </>
          )}
          {appointment.patientConfirmationStatus === 'Confirmada' && (
             <Badge variant="default" className="bg-green-600 text-white w-full sm:w-auto justify-center py-1.5 px-3">
                <CheckCircle className="mr-2 h-4 w-4" /> Asistencia Confirmada
             </Badge>
          )}
          {appointment.patientConfirmationStatus === 'Cancelada' && (
             <Badge variant="destructive" className="w-full sm:w-auto justify-center py-1.5 px-3">
                <XCircle className="mr-2 h-4 w-4" /> Cita Cancelada por ti
             </Badge>
          )}
        </CardFooter>
      )}
    </Card>
  );
}


export default function DashboardPage() {
  const { user } = useAuth();
  const { appointments, updateAppointmentConfirmation } = useAppointments();
  const { checkAndSetNotifications } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; 
    if (user === null) {
      router.push('/auth/login');
    } else if (user?.role === 'doctor') {
      router.push('/doctor/dashboard');
    }
  }, [user, router]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    if (!user?.email) return { upcomingAppointments: [], pastAppointments: [] };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userAppointments = appointments.filter(a => a.patientId === user.email);

    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    userAppointments.forEach(appt => {
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
  }, [user, appointments]);
  
  useEffect(() => {
    if (upcomingAppointments.length > 0) {
      checkAndSetNotifications(upcomingAppointments);
    }
  }, [upcomingAppointments, checkAndSetNotifications]);


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
      <main className="flex-1 bg-muted/40 pb-20 md:pb-0">
        <div className="container py-12">
          <h1 className="text-3xl font-bold font-headline mb-2">¡Bienvenido de nuevo, {user.name}!</h1>
          <p className="text-muted-foreground mb-8">Este es tu panel médico personal.</p>
          
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 grid gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Citas</CardTitle>
                  {upcomingAppointments.length === 0 && (
                     <CardDescription>No tienes próximas citas agendadas.</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.map(appt => (
                        <AppointmentCard 
                          key={appt.id} 
                          appointment={appt} 
                          onUpdateConfirmation={updateAppointmentConfirmation}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                      <CalendarPlus className="h-12 w-12" />
                      <p>¿Listo para tu próxima consulta?</p>
                      <Button asChild>
                        <Link href="/find-a-doctor">Reservar una Cita</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial Médico</CardTitle>
                  <CardDescription>Un resumen de tus consultas pasadas.</CardDescription>
                </CardHeader>
                <CardContent>
                   {pastAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {pastAppointments.map(appt => (
                        <AppointmentCard key={appt.id} appointment={appt} isPast />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                      <ClipboardList className="h-12 w-12" />
                      <p>Tu historial médico aparecerá aquí después de tu primera cita.</p>
                    </div>
                  )}
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
      <BottomNav />
    </div>
  );
}


"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appointments as mockAppointments, type Appointment } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, Eye } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import Image from 'next/image';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If auth state is still loading, do nothing
    if (user === undefined) {
      return; 
    }
    // If not logged in, redirect to login
    if (user === null) {
      router.push('/auth/login');
    } else if (user.role !== 'doctor') {
      // If a patient somehow lands here, send them to their dashboard
      router.push('/dashboard');
    } else {
        // Mock fetching data for the logged-in doctor.
        // In a real app, this would be an API call.
        // We are not filtering by doctor ID here for simplicity to show all appointments.
        setAppointments(mockAppointments);
        setIsLoading(false);
    }
  }, [user, router]);

  const handleConfirmPayment = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(appt =>
        appt.id === appointmentId ? { ...appt, paymentStatus: 'Pagado' } : appt
      )
    );
  };

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
          <h1 className="text-3xl font-bold font-headline mb-2">Panel del Médico</h1>
          <p className="text-muted-foreground mb-8">Gestiona tus próximas citas.</p>

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
                  {appointments.map((appt) => (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user data is not loaded yet, don't do anything.
    // If it has loaded and is null, redirect to login.
    if (user === null) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Show a loading state while waiting for user data
  if (!user) {
    return (
       <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12">
           <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
           </div>
           <div className="mt-8">
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
        <Footer />
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
          
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Citas</CardTitle>
                <CardDescription>No tienes próximas citas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>Reserva una nueva cita para verla aquí.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial Médico</CardTitle>
                 <CardDescription>Un resumen de tus consultas pasadas.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="text-center py-12 text-muted-foreground">
                  <p>Tu historial médico está vacío.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

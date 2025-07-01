
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return; // Still loading
    if (!user || user.role !== 'doctor') {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <p className="text-muted-foreground mb-8">Bienvenido de nuevo, {user.name}.</p>
            <Card>
                <CardHeader>
                    <CardTitle>En Mantenimiento</CardTitle>
                    <CardDescription>
                        Estamos realizando una corrección final en el panel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>La funcionalidad completa del panel será restaurada en el siguiente paso. Gracias por tu paciencia.</p>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

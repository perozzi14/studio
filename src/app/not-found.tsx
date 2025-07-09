
"use client";

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <div className="mb-8">
            <Stethoscope className="h-24 w-24 text-primary mx-auto" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">404 - Página No Encontrada</h1>
        <p className="max-w-md text-lg text-muted-foreground mb-8">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <Button asChild size="lg">
            <Link href="/">
                Volver a la Página de Inicio
            </Link>
        </Button>
    </div>
  )
}

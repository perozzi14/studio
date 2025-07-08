import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Stethoscope } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Stethoscope className="h-20 w-20 text-primary mb-6" />
        <h1 className="text-4xl font-bold font-headline mb-2">404 - Página No Encontrada</h1>
        <p className="text-lg text-muted-foreground max-w-md mb-8">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <Button asChild size="lg">
            <Link href="/">Volver a la Página de Inicio</Link>
        </Button>
    </div>
  )
}

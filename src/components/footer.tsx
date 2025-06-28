import Link from "next/link";
import { Stethoscope } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">MedAgenda</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary">
              Acerca de
            </Link>
            <Link href="#" className="hover:text-primary">
              Contacto
            </Link>
            <Link href="#" className="hover:text-primary">
              Política de Privacidad
            </Link>
            <Link href="#" className="hover:text-primary">
              Términos de Servicio
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MedAgenda. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

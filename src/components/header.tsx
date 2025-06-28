
"use client";

import Link from "next/link";
import { Stethoscope, LogIn, UserPlus, Menu, LogOut, LayoutDashboard, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useSearchParams } from "next/navigation";


export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const patientNavLinks = [
    { href: "/find-a-doctor", label: "Buscar Médico" },
    { href: "/ai-assistant", label: "Asistente IA" },
  ];
  
  const doctorNavLinks = [
    { href: "/doctor/dashboard?view=appointments", label: "Citas", view: "appointments" },
    { href: "/doctor/dashboard?view=finances", label: "Finanzas", view: "finances" },
    { href: "/doctor/dashboard?view=profile", label: "Mi Perfil", view: "profile" },
    { href: "/doctor/dashboard?view=services", label: "Mis Servicios", view: "services" },
    { href: "/doctor/dashboard?view=schedule", label: "Mi Horario", view: "schedule" },
    { href: "/doctor/dashboard?view=bank-details", label: "Datos Bancarios", view: "bank-details" },
    { href: "/doctor/dashboard?view=coupons", label: "Cupones", view: "coupons" },
  ];

  const dashboardHref = user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard';
  const currentView = searchParams.get('view') || 'appointments';


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-headline">SUMA</span>
        </Link>
        <nav className="hidden md:flex ml-auto items-center gap-2">
          {user?.role !== 'doctor' && patientNavLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {user?.role === 'doctor' && doctorNavLinks.map((link) => {
               const isActive = (pathname === '/doctor/dashboard' && currentView === link.view);
               return (
                <Button key={link.href} variant={isActive ? "secondary" : "ghost"} size="sm" asChild>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
               )
            })}
          {user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Panel de Control</span>
                  </Link>
                </DropdownMenuItem>
                 {user.role === 'patient' && (
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">
                  <UserPlus className="mr-2 h-4 w-4" /> Regístrate
                </Link>
              </Button>
            </div>
          )}
        </nav>
        <div className="md:hidden ml-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Abrir Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 py-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
                  <Stethoscope className="h-6 w-6 text-primary" />
                  <span className="font-headline">SUMA</span>
                </Link>
                {user?.role !== 'doctor' && patientNavLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link href={link.href} className="text-lg font-medium hover:text-primary">
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                 {user?.role === 'doctor' && doctorNavLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link href={link.href} className="text-lg font-medium hover:text-primary">
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="border-t pt-4 mt-2">
                  {user ? (
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <Avatar>
                           <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                         </Avatar>
                         <div>
                           <p className="font-medium">{user.name}</p>
                           <p className="text-sm text-muted-foreground">{user.email}</p>
                         </div>
                       </div>
                       <SheetClose asChild>
                          <Link href={dashboardHref} className="flex items-center text-lg font-medium hover:text-primary">
                            <LayoutDashboard className="mr-2 h-5 w-5" /> Panel de Control
                          </Link>
                       </SheetClose>
                       {user.role === 'patient' && (
                          <SheetClose asChild>
                            <Link href="/profile" className="flex items-center text-lg font-medium hover:text-primary">
                              <User className="mr-2 h-5 w-5" /> Mi Perfil
                            </Link>
                          </SheetClose>
                       )}
                       <Button onClick={() => { logout(); }} className="w-full">
                         <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                       </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <SheetClose asChild>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/auth/login">Iniciar Sesión</Link>
                        </Button>
                      </SheetClose>
                       <SheetClose asChild>
                        <Button className="w-full" asChild>
                          <Link href="/auth/register">Regístrate</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


"use client";

import Link from "next/link";
import { Stethoscope, LogIn, UserPlus, Menu, LogOut, LayoutDashboard, User, Tag, LifeBuoy, Heart, Search, Bell, BellRing, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useSearchParams } from "next/navigation";
import { useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";


export function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const patientNavLinks = [
    { href: "/find-a-doctor", label: "Buscar Médico" },
    { href: "/ai-assistant", label: "Asistente IA" },
  ];
  
  const adminNavLinks = [
    { href: "/admin/dashboard?view=overview", label: "General" },
    { href: "/admin/dashboard?view=doctors", label: "Médicos" },
    { href: "/admin/dashboard?view=sellers", label: "Vendedoras" },
    { href: "/admin/dashboard?view=patients", label: "Pacientes" },
    { href: "/admin/dashboard?view=finances", label: "Finanzas" },
    { href: "/admin/dashboard?view=support", label: "Soporte" },
    { href: "/admin/dashboard?view=settings", label: "Configuración" },
  ];

  const dashboardHref = user?.role === 'doctor' 
    ? '/doctor/dashboard' 
    : user?.role === 'seller'
    ? '/seller/dashboard'
    : user?.role === 'admin'
    ? '/admin/dashboard?view=overview'
    : '/dashboard';

  const isPatient = user?.role === 'patient';


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-headline">SUMA</span>
        </Link>
        <nav className="hidden md:flex ml-auto items-center gap-2">
          {(!user || user.role === 'patient') && patientNavLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          
          {user?.role === 'admin' && pathname.startsWith('/admin') && adminNavLinks.map((link) => {
            const currentViewParam = searchParams.get('view') || 'overview';
            const linkView = new URL(link.href, 'http://dummy.com').searchParams.get('view');
            const isActive = currentViewParam === linkView;
            return (
              <Button key={link.href} variant={isActive ? 'secondary' : 'ghost'} asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}
          
          {user && isPatient && (
            <Popover onOpenChange={(open) => {
              if (open && unreadCount > 0) {
                setTimeout(() => markAllAsRead(), 500); 
              }
            }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative ml-2">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                  <span className="sr-only">Ver notificaciones</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 md:w-96">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50">
                        <div className="mt-1">
                          {n.read ? <Check className="h-4 w-4 text-green-500"/> : <BellRing className="h-4 w-4 text-primary"/>}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.relativeTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
              </PopoverContent>
            </Popover>
          )}

          {user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1">
                  <Avatar className="h-8 w-8">
                    {user.profileImage && <AvatarImage src={user.profileImage} alt={user.name} />}
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
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Mis Favoritos</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user.role === 'seller' && (
                   <DropdownMenuItem asChild>
                      <Link href="/seller/profile">
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
        <div className="md:hidden ml-auto flex items-center gap-1">
          {user && isPatient && (
            <Popover onOpenChange={(open) => {
              if (open && unreadCount > 0) {
                setTimeout(() => markAllAsRead(), 500);
              }
            }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                  <span className="sr-only">Ver notificaciones</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50">
                        <div className="mt-1">
                          {n.read ? <Check className="h-4 w-4 text-green-500" /> : <BellRing className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.relativeTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
              </PopoverContent>
            </Popover>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Abrir Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="text-left">
                 <SheetTitle className="sr-only">Menú</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 py-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
                  <Stethoscope className="h-6 w-6 text-primary" />
                  <span className="font-headline">SUMA</span>
                </Link>
                {user?.role === 'admin' && pathname.startsWith('/admin') && (
                   <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground font-semibold text-sm">PANEL ADMIN</p>
                    {adminNavLinks.map((link) => (
                      <SheetClose key={link.href} asChild>
                        <Link href={link.href} className="text-lg font-medium hover:text-primary">
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                   </div>
                )}
                {(!user || user.role === 'patient') && patientNavLinks.map((link) => (
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
                           {user.profileImage && <AvatarImage src={user.profileImage} alt={user.name} />}
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
                          <>
                            <SheetClose asChild>
                              <Link href="/profile" className="flex items-center text-lg font-medium hover:text-primary">
                                <User className="mr-2 h-5 w-5" /> Mi Perfil
                              </Link>
                            </SheetClose>
                            <SheetClose asChild>
                              <Link href="/favorites" className="flex items-center text-lg font-medium hover:text-primary">
                                <Heart className="mr-2 h-5 w-5" /> Mis Favoritos
                              </Link>
                            </SheetClose>
                          </>
                       )}
                       {user.role === 'seller' && (
                          <SheetClose asChild>
                            <Link href="/seller/profile" className="flex items-center text-lg font-medium hover:text-primary">
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


const bottomNavItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/find-a-doctor", label: "Buscar", icon: Search },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/profile", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.role !== "patient") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container flex h-16 items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors w-1/4 h-full",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary/80"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

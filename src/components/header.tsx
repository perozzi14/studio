
"use client";

import Link from "next/link";
import { Stethoscope, LogIn, UserPlus, Menu, LogOut, LayoutDashboard, User, Tag, LifeBuoy, Heart, Search, Bell, BellRing, Check, Settings, DollarSign, Ticket, MessageSquare, CreditCard, ShoppingBag, CheckCircle, XCircle, ClipboardList, Home, Bot, ArrowLeft } from "lucide-react";
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
import { useDoctorNotifications } from "@/lib/doctor-notifications";
import { useSellerNotifications } from "@/lib/seller-notifications";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import * as firestoreService from '@/lib/firestoreService';
import { type AdminNotification, type DoctorNotification, type PatientNotification, type SellerNotification } from "@/lib/types";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';


export function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const { doctorNotifications, doctorUnreadCount, markDoctorNotificationsAsRead } = useDoctorNotifications();
  const { sellerNotifications, sellerUnreadCount, markSellerNotificationsAsRead } = useSellerNotifications();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  
  const getAdminNotificationIcon = (type: AdminNotification['type']) => {
    switch(type) {
        case 'payment': return <DollarSign className="h-4 w-4 text-green-500" />;
        case 'new_doctor': return <UserPlus className="h-4 w-4 text-blue-500" />;
        case 'support_ticket': return <Ticket className="h-4 w-4 text-orange-500" />;
        default: return <BellRing className="h-4 w-4 text-primary" />;
    }
  };

  const getPatientNotificationIcon = (type: PatientNotification['type']) => {
    switch(type) {
        case 'reminder': return <BellRing className="h-4 w-4 text-primary" />;
        case 'payment_approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'new_message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
        case 'record_added': return <ClipboardList className="h-4 w-4 text-purple-500" />;
        default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getDoctorNotificationIcon = (type: DoctorNotification['type']) => {
    switch(type) {
        case 'payment_verification': return <DollarSign className="h-4 w-4 text-amber-500" />;
        case 'patient_confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'patient_cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
        case 'new_message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
        case 'support_reply': return <LifeBuoy className="h-4 w-4 text-orange-500" />;
        case 'subscription_update': return <CreditCard className="h-4 w-4 text-indigo-500" />;
        default: return <BellRing className="h-4 w-4 text-primary" />;
    }
  };

  const getSellerNotificationIcon = (type: SellerNotification['type']) => {
    switch(type) {
        case 'payment_processed': return <DollarSign className="h-4 w-4 text-green-500" />;
        case 'new_doctor_registered': return <UserPlus className="h-4 w-4 text-blue-500" />;
        case 'support_reply': return <LifeBuoy className="h-4 w-4 text-orange-500" />;
        default: return <BellRing className="h-4 w-4 text-primary" />;
    }
  };

  const fetchAdminNotifications = useCallback(async () => {
    if (user?.role !== 'admin') {
      setAdminNotifications([]);
      setAdminUnreadCount(0);
      return;
    }

    const [tickets, payments, doctors] = await Promise.all([
        firestoreService.getSupportTickets(),
        firestoreService.getDoctorPayments(),
        firestoreService.getDoctors(),
    ]);

    const paymentNotifications: AdminNotification[] = payments
        .filter(p => p.status === 'Pending' && !p.readByAdmin)
        .map(p => ({
            id: `payment-${p.id}`,
            type: 'payment',
            title: 'Pago Pendiente de Aprobación',
            description: `El Dr. ${p.doctorName} ha reportado un pago.`,
            date: p.date,
            read: false,
            link: `/admin/dashboard?view=finances`
        }));
    
    const ticketNotifications: AdminNotification[] = tickets
        .filter(t => !t.readByAdmin)
        .map(t => ({
            id: `ticket-${t.id}`,
            type: 'support_ticket',
            title: 'Nuevo Ticket de Soporte',
            description: `De: ${t.userName}`,
            date: t.date,
            read: false,
            link: `/admin/dashboard?view=support`
        }));
    
    const doctorNotifications: AdminNotification[] = doctors
        .filter(d => !d.readByAdmin)
        .map(d => ({
            id: `doctor-${d.id}`,
            type: 'new_doctor',
            title: 'Nuevo Médico Registrado',
            description: `El Dr. ${d.name} se ha unido a la plataforma.`,
            date: d.joinDate,
            read: false,
            link: `/admin/dashboard?view=doctors`
        }));

    const allNotifications = [...paymentNotifications, ...ticketNotifications, ...doctorNotifications]
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setAdminNotifications(allNotifications);
    setAdminUnreadCount(allNotifications.filter(n => !n.read).length);
  }, [user]);

  useEffect(() => {
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchAdminNotifications]);
  
  const markAdminNotificationsAsRead = async () => {
    if (adminUnreadCount === 0) return;

    const unreadTicketIds = adminNotifications
      .filter(n => n.type === 'support_ticket' && !n.read)
      .map(n => n.id.replace('ticket-', ''));

    const unreadPaymentIds = adminNotifications
      .filter(n => n.type === 'payment' && !n.read)
      .map(n => n.id.replace('payment-', ''));
    
    const unreadDoctorIds = adminNotifications
      .filter(n => n.type === 'new_doctor' && !n.read)
      .map(n => n.id.replace('doctor-', ''));

    if (unreadTicketIds.length > 0 || unreadPaymentIds.length > 0 || unreadDoctorIds.length > 0) {
        await firestoreService.batchUpdateNotificationsAsRead(unreadTicketIds, unreadPaymentIds, unreadDoctorIds);
        
        // Optimistically update the UI
        setAdminUnreadCount(0);
        setAdminNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };


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
    { href: "/admin/dashboard?view=marketing", label: "Marketing" },
    { href: "/admin/dashboard?view=support", label: "Soporte" },
    { href: "/admin/dashboard?view=settings", label: "Configuración" },
  ];

  const doctorNavLinks = [
    { href: "/doctor/dashboard?view=appointments", label: "Citas" },
    { href: "/doctor/dashboard?view=finances", label: "Finanzas" },
    { href: "/doctor/dashboard?view=subscription", label: "Suscripción" },
    { href: "/doctor/dashboard?view=profile", label: "Mi Perfil" },
    { href: "/doctor/dashboard?view=services", label: "Servicios" },
    { href: "/doctor/dashboard?view=schedule", label: "Horario" },
    { href: "/doctor/dashboard?view=bank-details", label: "Cuentas" },
    { href: "/doctor/dashboard?view=coupons", label: "Cupones" },
    { href: "/doctor/dashboard?view=chat", label: "Chat" },
    { href: "/doctor/dashboard?view=support", label: "Soporte" },
  ];

  const sellerNavLinks = [
    { href: "/seller/dashboard?view=referrals", label: "Mis Referidos" },
    { href: "/seller/dashboard?view=finances", label: "Finanzas" },
    { href: "/seller/dashboard?view=accounts", label: "Cuentas" },
    { href: "/seller/dashboard?view=marketing", label: "Marketing" },
    { href: "/seller/dashboard?view=support", label: "Soporte" },
  ];

  const dashboardHref = user?.role === 'doctor' 
    ? '/doctor/dashboard' 
    : user?.role === 'seller'
    ? '/seller/dashboard?view=referrals'
    : user?.role === 'admin'
    ? '/admin/dashboard?view=overview'
    : '/dashboard';

  const isPatient = user?.role === 'patient';
  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isSeller = user?.role === 'seller';


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-headline">SUMA</span>
        </div>
        <nav className="hidden md:flex ml-auto items-center gap-1 flex-wrap">
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
              <Button key={link.href} variant={isActive ? 'secondary' : 'ghost'} asChild size="sm">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}
          
          {user?.role === 'doctor' && pathname.startsWith('/doctor') && doctorNavLinks.map((link) => {
            const currentViewParam = searchParams.get('view') || 'appointments';
            const linkView = new URL(link.href, 'http://dummy.com').searchParams.get('view');
            const isActive = currentViewParam === linkView;
            return (
              <Button key={link.href} variant={isActive ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}

          {user?.role === 'seller' && pathname.startsWith('/seller') && sellerNavLinks.map((link) => {
            const currentViewParam = searchParams.get('view') || 'referrals';
            const linkView = new URL(link.href, 'http://dummy.com').searchParams.get('view');
            const isActive = currentViewParam === linkView;
            return (
              <Button key={link.href} variant={isActive ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}

          {user && isAdmin && (
            <Popover onOpenChange={(open) => { if (open && adminUnreadCount > 0) markAdminNotificationsAsRead() }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative ml-2">
                  <Bell className="h-5 w-5" />
                  {adminUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{adminUnreadCount}</span>
                    </span>
                  )}
                  <span className="sr-only">Ver notificaciones de admin</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 md:w-96">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {adminNotifications.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {adminNotifications.map(n => (
                      <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-blue-50")}>
                        <div className="mt-1">
                          {getAdminNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
              </PopoverContent>
            </Popover>
          )}

          {user && isDoctor && (
            <Popover onOpenChange={(open) => { if (open && doctorUnreadCount > 0) markDoctorNotificationsAsRead(); }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative ml-2">
                  <Bell className="h-5 w-5" />
                  {doctorUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{doctorUnreadCount}</span>
                    </span>
                  )}
                  <span className="sr-only">Ver notificaciones de doctor</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 md:w-96">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {doctorNotifications.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {doctorNotifications.map(n => (
                      <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-blue-50")}>
                        <div className="mt-1">
                          {getDoctorNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
              </PopoverContent>
            </Popover>
          )}
          
          {user && isSeller && (
            <Popover onOpenChange={(open) => { if (open && sellerUnreadCount > 0) markSellerNotificationsAsRead(); }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative ml-2">
                  <Bell className="h-5 w-5" />
                  {sellerUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{sellerUnreadCount}</span>
                    </span>
                  )}
                  <span className="sr-only">Ver notificaciones de vendedora</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 md:w-96">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {sellerNotifications.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {sellerNotifications.map(n => (
                      <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-blue-50")}>
                        <div className="mt-1">
                          {getSellerNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
              </PopoverContent>
            </Popover>
          )}

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
                      <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-primary/10")}>
                        <div className="mt-1">
                          {getPatientNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                      </Link>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Regístrate
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/register">
                      <User className="mr-2 h-4 w-4" />
                      Como Paciente
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/register-doctor">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Como Médico
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </nav>
        <div className="md:hidden ml-auto flex items-center gap-1">
          {user && isAdmin && (
            <Popover onOpenChange={(open) => { if (open && adminUnreadCount > 0) markAdminNotificationsAsRead() }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {adminUnreadCount > 0 && (
                     <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{adminUnreadCount}</span>
                    </span>
                  )}
                  <span className="sr-only">Ver notificaciones de admin</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {adminNotifications.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {adminNotifications.map(n => (
                      <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-blue-50")}>
                        <div className="mt-1">
                          {getAdminNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
              </PopoverContent>
            </Popover>
          )}

          {user && isDoctor && (
            <Popover onOpenChange={(open) => { if (open && doctorUnreadCount > 0) markDoctorNotificationsAsRead(); }}>
                <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {doctorUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{doctorUnreadCount}</span>
                    </span>
                    )}
                    <span className="sr-only">Ver notificaciones de doctor</span>
                </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                <div className="flex justify-between items-center mb-2 px-2">
                    <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {doctorNotifications.length > 0 ? (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                    {doctorNotifications.map(n => (
                        <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-blue-50")}>
                        <div className="mt-1">
                            {getDoctorNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.description}</p>
                            <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                        </Link>
                    ))}
                    </div>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
                </PopoverContent>
            </Popover>
          )}

          {user && isSeller && (
            <Popover onOpenChange={(open) => { if (open && sellerUnreadCount > 0) markSellerNotificationsAsRead(); }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {sellerUnreadCount > 0 && (
                     <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{sellerUnreadCount}</span>
                    </span>
                  )}
                  <span className="sr-only">Ver notificaciones de vendedora</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="flex justify-between items-center mb-2 px-2">
                  <h4 className="font-medium text-sm">Notificaciones</h4>
                </div>
                {sellerNotifications.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {sellerNotifications.map(n => (
                      <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-blue-50")}>
                        <div className="mt-1">
                          {getSellerNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones.</p>
                )}
              </PopoverContent>
            </Popover>
          )}

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
                      <Link href={n.link} key={n.id} className={cn("p-2 rounded-lg flex items-start gap-3 hover:bg-muted/50", !n.read && "bg-primary/10")}>
                        <div className="mt-1">
                          {getPatientNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">{n.date && formatDistanceToNow(parseISO(n.date), { locale: es, addSuffix: true })}</p>
                        </div>
                      </Link>
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
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader className="text-left">
                 <SheetTitle className="sr-only">Menú</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 py-6">
                <div className="flex items-center gap-2 font-bold text-lg mb-4">
                  <Stethoscope className="h-6 w-6 text-primary" />
                  <span className="font-headline">SUMA</span>
                </div>
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
                {user?.role === 'doctor' && pathname.startsWith('/doctor') && (
                   <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground font-semibold text-sm">PANEL DOCTOR</p>
                    {doctorNavLinks.map((link) => (
                      <SheetClose key={link.href} asChild>
                        <Link href={link.href} className="text-lg font-medium hover:text-primary">
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                   </div>
                )}
                 {user?.role === 'seller' && pathname.startsWith('/seller') && (
                   <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground font-semibold text-sm">PANEL VENDEDORA</p>
                    {sellerNavLinks.map((link) => (
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
                          <Link href="/auth/register">Registrarse (Paciente)</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="w-full" variant="secondary" asChild>
                          <Link href="/auth/register-doctor">Registrarse (Médico)</Link>
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


const patientBottomNavItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/find-a-doctor", label: "Buscar", icon: Search },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/profile", label: "Perfil", icon: User },
];

const publicBottomNavItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/find-a-doctor", label: "Buscar", icon: Search },
    { href: "/ai-assistant", label: "Asistente", icon: Bot },
    { href: "/auth/login", label: "Acceder", icon: LogIn },
];


export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isPublicPage = ['/', '/find-a-doctor', '/ai-assistant'].includes(pathname);

  let navItems;

  if (user && user.role === 'patient') {
    navItems = patientBottomNavItems;
  } else if (!user && isPublicPage) {
    navItems = publicBottomNavItems;
  } else {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
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

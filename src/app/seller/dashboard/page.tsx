
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import { type Doctor, type SellerPayment, type MarketingMaterial, type SupportTicket, type Seller, type BankDetail } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, Users, DollarSign, Copy, CheckCircle, XCircle, Mail, Phone, Wallet, CalendarClock, Landmark, Eye, MessageSquarePlus, Ticket, Download, Image as ImageIcon, Video, FileText, Coins, PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { useSettings } from '@/lib/settings';
import { mockMarketingMaterials } from '@/lib/data';
import { z } from 'zod';

const BankDetailFormSchema = z.object({
  bank: z.string().min(3, "El nombre del banco es requerido."),
  accountHolder: z.string().min(3, "El nombre del titular es requerido."),
  idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
  accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
});

function MarketingMaterialCard({ material }: { material: MarketingMaterial }) {
    const { toast } = useToast();
    const getIcon = () => {
        switch(material.type) {
            case 'image': return <ImageIcon className="h-4 w-4" />;
            case 'video': return <Video className="h-4 w-4" />;
            case 'file': return <FileText className="h-4 w-4" />;
            case 'url': return <LinkIcon className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };
    
    const handleCopy = () => {
      navigator.clipboard.writeText(material.url);
      toast({ title: "Enlace copiado al portapapeles." });
    };

    return (
        <Card>
            <CardContent className="p-0">
                <div className="aspect-video relative">
                    <Image src={material.thumbnailUrl} alt={material.title} fill className="object-cover rounded-t-lg" data-ai-hint="marketing material" />
                </div>
                <div className="p-4 space-y-2">
                    <Badge variant="secondary" className="capitalize w-fit">{material.type}</Badge>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription className="text-xs">{material.description}</CardDescription>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Enlace
                </Button>
                <Button className="w-full" asChild>
                    <a href={material.url} target="_blank" rel="noopener noreferrer">
                       <Download className="mr-2 h-4 w-4" /> Descargar
                    </a>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { doctorSubscriptionFee } = useSettings();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [referredDoctors, setReferredDoctors] = useState<Doctor[]>([]);
  const [sellerPayments, setSellerPayments] = useState<SellerPayment[]>([]);

  const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
  const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);
  
  const [isPaymentDetailDialogOpen, setIsPaymentDetailDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SellerPayment | null>(null);
  
  const currentTab = searchParams.get('view') || 'referrals';

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'seller' || !user.id) return;
    setIsLoading(true);

    try {
        const [seller, allDocs, allPayments] = await Promise.all([
            firestoreService.getSeller(user.id),
            firestoreService.getDoctors(),
            firestoreService.getSellerPayments()
        ]);
        
        if (seller) {
            setSellerData(seller);
            setReferredDoctors(allDocs.filter(d => d.sellerId === seller.id));
            setSellerPayments(allPayments.filter(p => p.sellerId === seller.id));
        }
    } catch (error) {
        console.error("Error fetching seller data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del panel.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user?.id) {
        fetchData();
    }
  }, [user, fetchData]);
  
  const handleTabChange = (value: string) => {
    router.push(`/seller/dashboard?view=${value}`);
  };

  const commissionPerDoctor = useMemo(() => {
    if (!sellerData) return 0;
    return doctorSubscriptionFee * sellerData.commissionRate;
  }, [doctorSubscriptionFee, sellerData]);

  const financeStats = useMemo(() => {
    if (!sellerData) return { totalReferred: 0, activeReferredCount: 0, pendingCommission: 0, totalEarned: 0, nextPaymentDate: '' };
    const activeReferred = referredDoctors.filter(d => d.status === 'active');
    const pendingCommission = activeReferred.length * commissionPerDoctor;
    const totalEarned = sellerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const now = new Date();
    const nextPaymentMonth = getMonth(now) === 11 ? 0 : getMonth(now) + 1;
    const nextPaymentYear = getMonth(now) === 11 ? getYear(now) + 1 : getYear(now);
    const nextPaymentDate = `16 de ${format(new Date(nextPaymentYear, nextPaymentMonth), 'LLLL', { locale: es })}`;

    return { totalReferred: referredDoctors.length, activeReferredCount: activeReferred.length, pendingCommission, totalEarned, nextPaymentDate };
  }, [referredDoctors, commissionPerDoctor, sellerData, sellerPayments]);
  
   const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: "Ticket Enviado", description: "Tu solicitud ha sido enviada al equipo de soporte de SUMA." });
  };

  const handleOpenBankDetailDialog = (bankDetail: BankDetail | null) => {
    setEditingBankDetail(bankDetail);
    setIsBankDetailDialogOpen(true);
  };
  
  const handleSaveBankDetail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
        bank: formData.get('bankName') as string,
        accountHolder: formData.get('accountHolder') as string,
        idNumber: formData.get('idNumber') as string,
        accountNumber: formData.get('accountNumber') as string,
    };
    const result = BankDetailFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
        return;
    }
    
    if (!sellerData) return;
    
    const newBankDetail: BankDetail = {
      id: editingBankDetail ? editingBankDetail.id : `bank-${Date.now()}`,
      ...result.data,
    };
    
    let updatedBankDetails;
    if (editingBankDetail) {
      updatedBankDetails = sellerData.bankDetails.map(bd => bd.id === editingBankDetail.id ? newBankDetail : bd);
    } else {
      updatedBankDetails = [...sellerData.bankDetails, newBankDetail];
    }
    
    await firestoreService.updateSeller(sellerData.id, { bankDetails: updatedBankDetails });
    fetchData();
    setIsBankDetailDialogOpen(false);
    toast({ title: "Cuenta Bancaria Guardada" });
  };

  const handleDeleteBankDetail = async (bankDetailId: string) => {
    if (!sellerData) return;
    const updatedBankDetails = sellerData.bankDetails.filter(bd => bd.id !== bankDetailId);
    await firestoreService.updateSeller(sellerData.id, { bankDetails: updatedBankDetails });
    fetchData();
    toast({ title: "Cuenta Bancaria Eliminada" });
  };

  const handleViewPaymentDetails = (payment: SellerPayment) => {
    setSelectedPayment(payment);
    setIsPaymentDetailDialogOpen(true);
  };

  if (isLoading || !user || user.role !== 'seller' || !sellerData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${sellerData.referralCode}`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
            <h1 className="text-3xl font-bold font-headline mb-2">Panel de Vendedora</h1>
            <p className="text-muted-foreground mb-8">Bienvenida de nuevo, {user.name}. Aquí puedes gestionar tus médicos y finanzas.</p>

             <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                    <TabsTrigger value="referrals">Mis Referidos</TabsTrigger>
                    <TabsTrigger value="finances">Finanzas</TabsTrigger>
                    <TabsTrigger value="accounts">Cuentas</TabsTrigger>
                    <TabsTrigger value="marketing">Marketing</TabsTrigger>
                    <TabsTrigger value="support">Soporte</TabsTrigger>
                </TabsList>
                <TabsContent value="referrals" className="mt-6">
                    <div className="space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><LinkIcon className="text-primary"/> Tu Enlace de Referido</CardTitle>
                                <CardDescription>Comparte este enlace con los médicos para que se registren bajo tu código.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-stretch gap-2">
                                <Input value={referralLink} readOnly className="text-sm bg-background flex-1"/>
                                <Button onClick={() => navigator.clipboard.writeText(referralLink)} className="w-full sm:w-auto">
                                    <Copy className="mr-2 h-4 w-4"/>
                                    Copiar Enlace
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Médicos Referidos</CardTitle>
                                <CardDescription>Un resumen de todos los médicos que has ingresado. Total: {financeStats.totalReferred}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table className="hidden md:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Médico</TableHead><TableHead>Contacto</TableHead><TableHead>Especialidad</TableHead>
                                            <TableHead>Ubicación</TableHead><TableHead>Último Pago</TableHead><TableHead className="text-center">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {referredDoctors.length > 0 ? referredDoctors.map((doctor) => (
                                            <TableRow key={doctor.id}>
                                                <TableCell className="font-medium">{doctor.name}</TableCell>
                                                <TableCell><div className="flex flex-col gap-1 text-xs">
                                                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{doctor.email}</span></span>
                                                    <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{doctor.whatsapp}</span></span>
                                                </div></TableCell>
                                                <TableCell>{doctor.specialty}</TableCell><TableCell>{doctor.city}, {doctor.sector}</TableCell>
                                                <TableCell>{format(new Date(doctor.lastPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                <TableCell className="text-center"><Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' && 'bg-green-600 text-white')}>
                                                    {doctor.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                    {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </Badge></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Aún no tienes médicos referidos. ¡Comparte tu enlace!</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="space-y-4 md:hidden">
                                    {referredDoctors.length > 0 ? referredDoctors.map((doctor) => (
                                        <div key={doctor.id} className="p-4 border rounded-lg space-y-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div><p className="font-bold">{doctor.name}</p><p className="text-sm text-muted-foreground">{doctor.specialty}</p></div>
                                                <Badge variant={doctor.status === 'active' ? 'default' : 'destructive'} className={cn(doctor.status === 'active' && 'bg-green-600 text-white')}>
                                                    {doctor.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                    {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </div>
                                            <Separator/>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                                <div><p className="font-semibold text-xs text-muted-foreground mb-1">Ubicación</p><p>{doctor.city}</p></div>
                                                <div><p className="font-semibold text-xs text-muted-foreground mb-1">Último Pago</p><p>{format(new Date(doctor.lastPaymentDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</p></div>
                                                <div className="col-span-2"><p className="font-semibold text-xs text-muted-foreground mb-1">Contacto</p>
                                                    <div className="flex flex-col gap-1.5 text-xs">
                                                        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 flex-shrink-0" /> <span>{doctor.email}</span></span>
                                                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" /> <span>{doctor.whatsapp}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (<div className="h-24 text-center flex items-center justify-center text-muted-foreground">Aún no tienes médicos referidos. ¡Comparte tu enlace!</div>)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="finances" className="mt-6">
                    <div className="space-y-8">
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Comisión Pendiente (Este Mes)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${financeStats.pendingCommission.toFixed(2)}</div><p className="text-xs text-muted-foreground">{financeStats.activeReferredCount} médicos activos x ${commissionPerDoctor.toFixed(2)}/c.u.</p></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total General Generado</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${financeStats.totalEarned.toFixed(2)}</div><p className="text-xs text-muted-foreground">Suma de todos los pagos recibidos.</p></CardContent></Card>
                            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Próxima Fecha de Pago</CardTitle><CalendarClock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{financeStats.nextPaymentDate}</div><p className="text-xs text-muted-foreground">Cierre de ciclo el 15 de cada mes.</p></CardContent></Card>
                        </div>
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Landmark/> Historial de Pagos de SUMA</CardTitle><CardDescription>Registro de todas las comisiones que has recibido.</CardDescription></CardHeader>
                            <CardContent>
                                <Table className="hidden md:table">
                                    <TableHeader><TableRow><TableHead>Fecha de Pago</TableHead><TableHead>Período de Comisión</TableHead><TableHead>Médicos Pagados</TableHead><TableHead className="text-right">Monto Recibido</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {sellerPayments.length > 0 ? sellerPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium">{format(new Date(payment.paymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                                <TableCell>{payment.period}</TableCell><TableCell>{payment.includedDoctors.length}</TableCell>
                                                <TableCell className="text-right font-mono text-green-600 font-semibold">${payment.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-center"><Button variant="outline" size="sm" onClick={() => handleViewPaymentDetails(payment)}><Eye className="mr-2 h-4 w-4"/>Ver Detalles</Button></TableCell>
                                            </TableRow>
                                        )) : (<TableRow><TableCell colSpan={5} className="h-24 text-center">No has recibido pagos aún.</TableCell></TableRow>)}
                                    </TableBody>
                                </Table>
                                <div className="space-y-4 md:hidden">
                                     {sellerPayments.length > 0 ? sellerPayments.map((payment) => (
                                        <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div><p className="font-semibold">{payment.period}</p><p className="text-sm text-muted-foreground">Pagado el {format(new Date(payment.paymentDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</p></div>
                                                <p className="text-lg font-bold font-mono text-green-600">${payment.amount.toFixed(2)}</p>
                                            </div><Separator/>
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewPaymentDetails(payment)}><Eye className="mr-2 h-4 w-4"/>Ver Detalles del Pago</Button>
                                        </div>
                                     )) : (<div className="h-24 text-center flex items-center justify-center text-muted-foreground">No has recibido pagos aún.</div>)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="accounts" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div><CardTitle className="flex items-center gap-2"><Coins /> Mis Cuentas Bancarias</CardTitle><CardDescription>Gestiona tus cuentas para recibir los pagos de comisiones.</CardDescription></div>
                          <Button onClick={() => handleOpenBankDetailDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2"/> Agregar Cuenta</Button>
                      </CardHeader>
                      <CardContent>
                          <Table className="hidden md:table">
                              <TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Titular</TableHead><TableHead>Nro. de Cuenta</TableHead><TableHead>C.I./R.I.F.</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {sellerData.bankDetails.map(bd => (
                                      <TableRow key={bd.id}>
                                          <TableCell className="font-medium">{bd.bank}</TableCell><TableCell>{bd.accountHolder}</TableCell><TableCell>{bd.accountNumber}</TableCell><TableCell>{bd.idNumber}</TableCell>
                                          <TableCell className="text-center"><div className="flex items-center justify-center gap-2">
                                              <Button variant="outline" size="icon" onClick={() => handleOpenBankDetailDialog(bd)}><Pencil className="h-4 w-4" /></Button>
                                              <Button variant="destructive" size="icon" onClick={() => handleDeleteBankDetail(bd.id)}><Trash2 className="h-4 w-4" /></Button>
                                          </div></TableCell>
                                      </TableRow>
                                  ))}
                                  {sellerData.bankDetails.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center h-24">No tienes cuentas bancarias registradas.</TableCell></TableRow>)}
                              </TableBody>
                          </Table>
                          <div className="space-y-4 md:hidden">
                              {sellerData.bankDetails.length > 0 ? sellerData.bankDetails.map(bd => (
                                  <div key={bd.id} className="p-4 border rounded-lg space-y-4">
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                          <div><p className="text-xs text-muted-foreground">Banco</p><p className="font-medium">{bd.bank}</p></div>
                                          <div><p className="text-xs text-muted-foreground">Titular</p><p className="font-medium">{bd.accountHolder}</p></div>
                                          <div><p className="text-xs text-muted-foreground">Nro. Cuenta</p><p className="font-mono text-sm">{bd.accountNumber}</p></div>
                                          <div><p className="text-xs text-muted-foreground">C.I./R.I.F.</p><p className="font-mono text-sm">{bd.idNumber}</p></div>
                                      </div>
                                      <Separator />
                                      <div className="flex justify-end gap-2">
                                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenBankDetailDialog(bd)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                                          <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteBankDetail(bd.id)}><Trash2 className="mr-2 h-4 w-4" /> Borrar</Button>
                                      </div>
                                  </div>
                              )) : (<p className="text-center text-muted-foreground py-8">No tienes cuentas bancarias registradas.</p>)}
                          </div>
                      </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="marketing" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Material de Marketing</CardTitle><CardDescription>Recursos proporcionados por SUMA para ayudarte a promocionar la plataforma.</CardDescription></CardHeader>
                        <CardContent>
                            {mockMarketingMaterials.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {mockMarketingMaterials.map(material => (<MarketingMaterialCard key={material.id} material={material} />))}
                                </div>
                            ) : (<p className="text-center text-muted-foreground py-12">No hay materiales de marketing disponibles en este momento.</p>)}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="support" className="mt-6">
                    <Card>
                        <CardHeader><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div><CardTitle>Soporte Técnico</CardTitle><CardDescription>Gestiona tus tickets de soporte con el equipo de SUMA.</CardDescription></div>
                            <Dialog><DialogTrigger asChild><Button className="w-full sm:w-auto"><MessageSquarePlus className="mr-2 h-4 w-4"/> Crear Nuevo Ticket</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Abrir un Ticket de Soporte</DialogTitle><DialogDescription>Describe tu problema y el equipo de SUMA se pondrá en contacto contigo.</DialogDescription></DialogHeader>
                                    <form onSubmit={handleCreateTicket}>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="subject" className="text-right">Asunto</Label><Input id="subject" placeholder="ej., Problema con un referido" className="col-span-3" required /></div>
                                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Descripción</Label><Textarea id="description" placeholder="Detalla tu inconveniente aquí..." className="col-span-3" rows={5} required /></div>
                                        </div>
                                        <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><DialogClose asChild><Button type="submit">Enviar Ticket</Button></DialogClose></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div></CardHeader>
                        <CardContent>
                            <Table className="hidden md:table">
                                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Asunto</TableHead><TableHead>Última Respuesta</TableHead><TableHead className="text-center">Estado</TableHead></TableRow></TableHeader>
                                <TableBody><TableRow><TableCell colSpan={4} className="h-24 text-center">No tienes tickets de soporte.</TableCell></TableRow></TableBody>
                            </Table>
                            <div className="space-y-4 md:hidden"><p className="text-center text-muted-foreground py-8">No tienes tickets de soporte.</p></div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </main>

        <Dialog open={isBankDetailDialogOpen} onOpenChange={setIsBankDetailDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingBankDetail ? "Editar Cuenta Bancaria" : "Agregar Nueva Cuenta"}</DialogTitle><DialogDescription>{editingBankDetail ? "Modifica los detalles de esta cuenta." : "Añade una nueva cuenta para recibir tus comisiones."}</DialogDescription></DialogHeader>
                <form onSubmit={handleSaveBankDetail}><div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="bankName" className="text-right">Banco</Label><Input name="bankName" defaultValue={editingBankDetail?.bank} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="accountHolder" className="text-right">Titular</Label><Input name="accountHolder" defaultValue={editingBankDetail?.accountHolder} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="idNumber" className="text-right">C.I./R.I.F.</Label><Input name="idNumber" defaultValue={editingBankDetail?.idNumber} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="accountNumber" className="text-right">Nro. Cuenta</Label><Input name="accountNumber" defaultValue={editingBankDetail?.accountNumber} className="col-span-3" /></div>
                </div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Cambios</Button></DialogFooter></form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isPaymentDetailDialogOpen} onOpenChange={setIsPaymentDetailDialogOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Detalles del Pago</DialogTitle><DialogDescription>Resumen del pago de comisiones para el período {selectedPayment?.period}.</DialogDescription></DialogHeader>
                {selectedPayment && (
                    <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-1">
                            <p><span className="font-semibold">Fecha de Pago:</span> {format(new Date(selectedPayment.paymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                            <p><span className="font-semibold">Monto:</span> <span className="font-bold text-green-600">${selectedPayment.amount.toFixed(2)}</span></p>
                            <p><span className="font-semibold">ID de Transacción:</span> <span className="font-mono text-xs">{selectedPayment.transactionId}</span></p>
                        </div><Separator/>
                        <div><h4 className="font-semibold mb-2">Comprobante de Pago de SUMA</h4><div className="relative aspect-video"><Image src={selectedPayment.paymentProofUrl} alt="Comprobante de pago" fill className="rounded-md border object-contain" data-ai-hint="payment receipt"/></div></div><Separator/>
                        <div><h4 className="font-semibold mb-2">Médicos Incluidos ({selectedPayment.includedDoctors.length})</h4><ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">{selectedPayment.includedDoctors.map(doc => <li key={doc.id}>{doc.name}</li>)}</ul></div>
                    </div>
                )}
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}


"use client";
import { useMemo, useState, useCallback } from "react";
import type { Doctor, DoctorPayment, Seller, SellerPayment, CompanyExpense } from "@/lib/types";
import { useSettings } from "@/lib/settings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { z } from 'zod';
import { Wallet, TrendingUp, TrendingDown, Landmark, FileDown, Eye, ThumbsUp, ThumbsDown, PlusCircle, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from "next/image";

const FinanceChart = dynamic(
  () => import('@/components/admin/finance-chart').then(mod => mod.FinanceChart),
  { 
    ssr: false,
    loading: () => <div className="h-72 w-full flex items-center justify-center bg-muted/50 rounded-lg"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
  }
);

const ExpenseFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser positivo."),
  category: z.enum(['operativo', 'marketing', 'personal']),
});

interface FinancesTabProps {
  doctors: Doctor[];
  sellers: Seller[];
  doctorPayments: DoctorPayment[];
  sellerPayments: SellerPayment[];
  companyExpenses: CompanyExpense[];
  onUpdate: () => void;
}

const timeRangeLabels: Record<string, string> = {
  today: 'Hoy', week: 'Esta Semana', month: 'Este Mes', year: 'Este Año', all: 'Global',
};

export function FinancesTab({ doctors, sellers, doctorPayments, sellerPayments, companyExpenses, onUpdate }: FinancesTabProps) {
  const { deleteListItem, addListItem, updateListItem } = useSettings();
  const { toast } = useToast();
  
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [expenseItemsPerPage, setExpenseItemsPerPage] = useState(10);
  
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'expense', data: any} | null>(null);

  const { cityFeesMap } = useSettings();

  const handleApprovePayment = async (paymentId: string) => {
    const payment = doctorPayments.find(p => p.id === paymentId);
    if (!payment) return;

    const doctorToUpdate = await firestoreService.getDoctor(payment.doctorId);
    if (!doctorToUpdate) {
        toast({ variant: "destructive", title: "Error", description: "No se encontró al médico asociado a este pago." });
        return;
    }
    
    const currentCycleDate = new Date(doctorToUpdate.nextPaymentDate + 'T00:00:00Z');
    let newNextPaymentDate;

    if (new Date() > currentCycleDate) {
        const today = new Date();
        newNextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    } else {
        newNextPaymentDate = new Date(currentCycleDate.getFullYear(), currentCycleDate.getMonth() + 1, 1);
    }
    
    await firestoreService.updateDoctorPaymentStatus(paymentId, 'Paid');
    await firestoreService.updateDoctor(payment.doctorId, { 
      lastPaymentDate: payment.date,
      subscriptionStatus: 'active',
      status: 'active',
      nextPaymentDate: newNextPaymentDate.toISOString().split('T')[0],
     });
    
    toast({ title: "Pago Aprobado", description: `La suscripción del Dr. ${doctorToUpdate.name} ha sido renovada.` });
    onUpdate();
  };

  const handleRejectPayment = async (paymentId: string) => {
    const payment = doctorPayments.find(p => p.id === paymentId);
    if (!payment) return;

    await firestoreService.updateDoctorPaymentStatus(paymentId, 'Rejected');
    await firestoreService.updateDoctor(payment.doctorId, { subscriptionStatus: 'inactive' });
    
    toast({ variant: "destructive", title: "Pago Rechazado", description: "El pago ha sido marcado como 'Rechazado' y la suscripción del médico permanece inactiva." });
    onUpdate();
  };
  
  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as CompanyExpense['category'],
    };
    
    const result = ExpenseFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Errores de Validación', description: errorMessage });
        return;
    }

    const { date, description, amount, category } = result.data;

    if (editingExpense) {
        await updateListItem('companyExpenses', editingExpense.id, { id: editingExpense.id, date, description, amount, category });
        toast({ title: "Gasto Actualizado", description: "El gasto ha sido modificado exitosamente." });
    } else {
        await addListItem('companyExpenses', { date, description, amount, category });
        toast({ title: "Gasto Registrado", description: "El nuevo gasto ha sido agregado." });
    }
    
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
    onUpdate();
  };
  
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    await deleteListItem('companyExpenses', itemToDelete.data.id);
    toast({ title: "Gasto Eliminado" });
    onUpdate();
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  const { filteredDoctorPayments, filteredSellerPayments, filteredCompanyExpenses } = useMemo(() => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    const sortByDate = (items: any[], dateField: 'date' | 'paymentDate') => {
        return [...items].sort((a, b) => {
            if (!a[dateField] || !b[dateField]) return 0;
            return new Date(b[dateField] + 'T00:00:00').getTime() - new Date(a[dateField] + 'T00:00:00').getTime();
        });
    };
    
    if (timeRange === 'all') {
      return {
        filteredDoctorPayments: sortByDate(doctorPayments, 'date'),
        filteredSellerPayments: sortByDate(sellerPayments, 'paymentDate'),
        filteredCompanyExpenses: sortByDate(companyExpenses, 'date'),
      };
    }
    
    switch (timeRange) {
        case 'today': startDate = startOfDay(now); endDate = endOfDay(now); break;
        case 'week': startDate = startOfWeek(now, { locale: es }); endDate = endOfWeek(now, { locale: es }); break;
        case 'year': startDate = startOfYear(now); endDate = endOfYear(now); break;
        case 'month': default: startDate = startOfMonth(now); endDate = endOfMonth(now); break;
    }

    const filterByDateField = (items: any[], dateField: 'date' | 'paymentDate') => {
        const filtered = items.filter(item => {
            if (!item[dateField]) return false;
            const itemDate = new Date(item[dateField] + 'T00:00:00');
            return itemDate >= startDate && itemDate <= endDate;
        });
        return sortByDate(filtered, dateField);
    };

    return {
      filteredDoctorPayments: filterByDateField(doctorPayments, 'date'),
      filteredSellerPayments: filterByDateField(sellerPayments, 'paymentDate'),
      filteredCompanyExpenses: filterByDateField(companyExpenses, 'date'),
    };
  }, [doctorPayments, sellerPayments, companyExpenses, timeRange]);

  const timeRangedStats = useMemo(() => {
    const totalRevenue = filteredDoctorPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const commissionsPaid = filteredSellerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredCompanyExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
        totalRevenue,
        commissionsPaid,
        totalExpenses,
        netProfit: totalRevenue - commissionsPaid - totalExpenses,
    }
  }, [filteredDoctorPayments, filteredSellerPayments, filteredCompanyExpenses]);

  const paginatedCompanyExpenses = useMemo(() => {
    if (expenseItemsPerPage === -1) return filteredCompanyExpenses;
    const startIndex = (expenseCurrentPage - 1) * expenseItemsPerPage;
    const endIndex = startIndex + expenseItemsPerPage;
    return filteredCompanyExpenses.slice(startIndex, endIndex);
  }, [filteredCompanyExpenses, expenseCurrentPage, expenseItemsPerPage]);

  const totalExpensePages = useMemo(() => {
    if (expenseItemsPerPage === -1) return 1;
    return Math.ceil(filteredCompanyExpenses.length / expenseItemsPerPage);
  }, [filteredCompanyExpenses, expenseItemsPerPage]);


  const pendingDoctorPayments = useMemo(() => {
    return doctorPayments.filter(p => p.status === 'Pending');
  }, [doctorPayments]);

  const pendingToPayThisMonth = useMemo(() => {
    const now = new Date();
    const endOfThisMonth = endOfMonth(now);

    return doctors.filter(doc => {
      if (doc.subscriptionStatus === 'pending_payment') {
        return false;
      }
      const nextPayment = new Date(doc.nextPaymentDate + 'T00:00:00');
      return nextPayment <= endOfThisMonth;
    }).sort((a,b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
  }, [doctors]);

  const paymentsByMonth = useMemo(() => {
    const grouped: { [month: string]: DoctorPayment[] } = {};
    const sortedPayments = [...doctorPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedPayments.forEach(payment => {
        const monthKey = format(new Date(payment.date + 'T00:00:00'), 'LLLL yyyy', { locale: es });
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(payment);
    });

    return grouped;
  }, [doctorPayments]);
  
  return (
    <div className="space-y-6">
      <div className="w-full">
        <div className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
            <Button variant={timeRange === 'today' ? 'default' : 'outline'} onClick={() => setTimeRange('today')}>Hoy</Button>
            <Button variant={timeRange === 'week' ? 'default' : 'outline'} onClick={() => setTimeRange('week')}>Esta Semana</Button>
            <Button variant={timeRange === 'month' ? 'default' : 'outline'} onClick={() => setTimeRange('month')}>Este Mes</Button>
            <Button variant={timeRange === 'year' ? 'default' : 'outline'} onClick={() => setTimeRange('year')}>Este Año</Button>
            <Button variant={timeRange === 'all' ? 'default' : 'outline'} onClick={() => setTimeRange('all')}>Global</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos (Suscripciones)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${timeRangedStats.totalRevenue.toFixed(2)}</div><p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Comisiones Pagadas</CardTitle><Landmark className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">${timeRangedStats.commissionsPaid.toFixed(2)}</div><p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">${timeRangedStats.totalExpenses.toFixed(2)}</div><p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${timeRangedStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${timeRangedStats.netProfit.toFixed(2)}</div><p className="text-xs text-muted-foreground">Período: {timeRangeLabels[timeRange]}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><CardTitle>Visión General Financiera</CardTitle><CardDescription>Revisa el estado financiero de SUMA para {timeRangeLabels[timeRange]}.</CardDescription></div>
            <Button onClick={() => {}} disabled><FileDown className="mr-2"/> Descargar Reporte PDF</Button>
        </CardHeader>
        <CardContent><FinanceChart timeRangedStats={timeRangedStats} timeRange={timeRange} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Pagos Pendientes de Aprobación</CardTitle><CardDescription>Revisa y aprueba los pagos de suscripción reportados por los médicos.</CardDescription></CardHeader>
        <CardContent>
            <div className="hidden md:block">
                <Table><TableHeader><TableRow><TableHead>Médico</TableHead><TableHead>Fecha Reporte</TableHead><TableHead>Monto</TableHead><TableHead className="text-center">Comprobante</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {pendingDoctorPayments.length > 0 ? (pendingDoctorPayments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">{payment.doctorName}</TableCell>
                                <TableCell>{format(new Date(payment.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                <TableCell className="font-mono">${(payment.amount || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-center"><Button variant="outline" size="sm" onClick={() => { setViewingProofUrl(payment.paymentProofUrl); setIsProofDialogOpen(true);}}><Eye className="mr-2 h-4 w-4" /> Ver</Button></TableCell>
                                <TableCell className="text-right space-x-2"><Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleRejectPayment(payment.id)}><ThumbsDown className="h-4 w-4" /></Button><Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleApprovePayment(payment.id)}><ThumbsUp className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">No hay pagos pendientes de aprobación.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
            <div className="space-y-4 md:hidden">
                {pendingDoctorPayments.length > 0 ? (pendingDoctorPayments.map((payment) => (
                    <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                        <div><p className="font-semibold">{payment.doctorName}</p><p className="text-sm text-muted-foreground">{format(new Date(payment.date + 'T00:00:00'), "d MMM yyyy", { locale: es })} - <span className="font-mono">${(payment.amount || 0).toFixed(2)}</span></p></div>
                        <Button variant="outline" size="sm" className="w-full mb-2" onClick={() => { setViewingProofUrl(payment.paymentProofUrl); setIsProofDialogOpen(true);}}><Eye className="mr-2 h-4 w-4" /> Ver Comprobante</Button>
                        <div className="flex gap-2"><Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleRejectPayment(payment.id)}><ThumbsDown className="mr-2 h-4 w-4" /> Rechazar</Button><Button size="sm" variant="outline" className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleApprovePayment(payment.id)}><ThumbsUp className="mr-2 h-4 w-4" /> Aprobar</Button></div>
                    </div>
                ))) : (<p className="text-center text-muted-foreground py-8">No hay pagos pendientes de aprobación.</p>)}
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Suscripciones por Vencer este Mes</CardTitle><CardDescription>Lista de médicos cuya suscripción vence o ha vencido en el mes actual y no han reportado un pago.</CardDescription></CardHeader>
        <CardContent>
            <div className="hidden md:block">
                <Table><TableHeader><TableRow><TableHead>Médico</TableHead><TableHead>Ciudad</TableHead><TableHead>Monto a Pagar</TableHead><TableHead>Fecha de Vencimiento</TableHead><TableHead className="text-right">Suscripción</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {pendingToPayThisMonth.length > 0 ? (pendingToPayThisMonth.map((doctor) => (
                            <TableRow key={doctor.id}>
                                <TableCell className="font-medium">{doctor.name}</TableCell><TableCell>{doctor.city}</TableCell>
                                <TableCell className="font-mono">${(cityFeesMap.get(doctor.city) || 0).toFixed(2)}</TableCell>
                                <TableCell>{format(new Date(doctor.nextPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                <TableCell className="text-right"><Badge variant={doctor.subscriptionStatus === 'active' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': doctor.subscriptionStatus === 'active', 'bg-red-600 text-white': doctor.subscriptionStatus === 'inactive'  })}>{doctor.subscriptionStatus === 'active' ? 'Activa (por vencer)' : 'Inactiva'}</Badge></TableCell>
                            </TableRow>
                        ))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">No hay médicos con pagos por vencer para este mes.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
            <div className="space-y-4 md:hidden">
                {pendingToPayThisMonth.length > 0 ? (pendingToPayThisMonth.map((doctor) => (
                    <div key={doctor.id} className="p-4 border rounded-lg space-y-3">
                        <div><p className="font-semibold">{doctor.name}</p><p className="text-sm text-muted-foreground">{doctor.city}</p></div>
                        <div className="flex justify-between items-center text-sm"><p className="text-muted-foreground">Vence:</p><p>{format(new Date(doctor.nextPaymentDate + 'T00:00:00'), "d MMM yyyy", { locale: es })}</p></div>
                        <div className="flex justify-between items-center text-sm"><p className="text-muted-foreground">Monto:</p><p className="font-mono font-semibold">${(cityFeesMap.get(doctor.city) || 0).toFixed(2)}</p></div>
                        <div className="flex justify-between items-center text-sm"><p className="text-muted-foreground">Estado:</p><Badge variant={doctor.subscriptionStatus === 'active' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': doctor.subscriptionStatus === 'active', 'bg-red-600 text-white': doctor.subscriptionStatus === 'inactive'  })}>{doctor.subscriptionStatus === 'active' ? 'Activa (por vencer)' : 'Inactiva'}</Badge></div>
                    </div>
                ))) : (<p className="text-center text-muted-foreground py-8">No hay médicos con pagos por vencer para este mes.</p>)}
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><CardTitle>Gastos Operativos de SUMA</CardTitle><CardDescription>Registro de todos los egresos de la empresa ({timeRangeLabels[timeRange]}).</CardDescription></div>
            <Button onClick={() => { setEditingExpense(null); setIsExpenseDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto</Button>
        </CardHeader>
        <CardContent>
            <div className="hidden md:block">
                <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {paginatedCompanyExpenses.map((expense) => (
                            <TableRow key={expense.id}><TableCell>{format(new Date(expense.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell><TableCell className="font-medium">{expense.description}</TableCell><TableCell className="capitalize">{expense.category}</TableCell><TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell><TableCell className="text-right flex items-center justify-end gap-2"><Button variant="outline" size="icon" onClick={() => { setEditingExpense(expense); setIsExpenseDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => { setItemToDelete({type: 'expense', data: expense}); setIsDeleteDialogOpen(true);}}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                        ))}
                        {paginatedCompanyExpenses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">No hay gastos registrados en este período.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
            <div className="space-y-4 md:hidden">
                {paginatedCompanyExpenses.map((expense) => (
                    <div key={expense.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start"><div><p className="font-semibold">{expense.description}</p><p className="text-xs text-muted-foreground">{format(new Date(expense.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p></div><Badge variant="secondary" className="capitalize">{expense.category}</Badge></div>
                        <p className="text-right font-mono text-lg">${expense.amount.toFixed(2)}</p>
                        <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => { setEditingExpense(expense); setIsExpenseDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button><Button variant="destructive" size="sm" onClick={() => { setItemToDelete({type: 'expense', data: expense}); setIsDeleteDialogOpen(true);}}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button></div>
                    </div>
                ))}
                {paginatedCompanyExpenses.length === 0 && <p className="text-center text-muted-foreground py-8">No hay gastos registrados en este período.</p>}
            </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Página {expenseCurrentPage} de {totalExpensePages}</div>
            <div className="flex items-center gap-2">
                <Select value={String(expenseItemsPerPage)} onValueChange={(value) => { setExpenseItemsPerPage(Number(value)); setExpenseCurrentPage(1); }}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="10">10 por página</SelectItem><SelectItem value="20">20 por página</SelectItem><SelectItem value="50">50 por página</SelectItem><SelectItem value="-1">Mostrar todos</SelectItem></SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setExpenseCurrentPage(p => Math.max(1, p - 1))} disabled={expenseCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setExpenseCurrentPage(p => Math.min(totalExpensePages, p + 1))} disabled={expenseCurrentPage === totalExpensePages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader><CardTitle>Historial de Ingresos por Suscripción</CardTitle><CardDescription>Pagos de mensualidades de los médicos, agrupados por mes.</CardDescription></CardHeader>
        <CardContent>
            {Object.keys(paymentsByMonth).length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(paymentsByMonth)[0]}>
                    {Object.entries(paymentsByMonth).map(([month, payments]) => (
                        <AccordionItem value={month} key={month}>
                            <AccordionTrigger className="text-lg font-medium capitalize">{month}</AccordionTrigger>
                            <AccordionContent>
                                <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Médico</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Detalles</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment.id}><TableCell>{format(new Date(payment.date + 'T00:00:00'), "d 'de' LLLL", { locale: es })}</TableCell><TableCell>{payment.doctorName}</TableCell><TableCell className="font-mono">${(payment.amount || 0).toFixed(2)}</TableCell>
                                                <TableCell><Badge className={cn({'bg-green-600 text-white': payment.status === 'Paid','bg-amber-500 text-white': payment.status === 'Pending','bg-red-600 text-white': payment.status === 'Rejected',})}>{payment.status === 'Paid' ? 'Pagado' : payment.status === 'Pending' ? 'En Revisión' : 'Rechazado'}</Badge></TableCell>
                                                <TableCell className="text-right"><Button variant="outline" size="icon" onClick={() => { setViewingProofUrl(payment.paymentProofUrl); setIsProofDialogOpen(true);}} disabled={!payment.paymentProofUrl}><Eye className="h-4 w-4" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (<p className="text-center text-muted-foreground py-8">No hay pagos registrados.</p>)}
        </CardContent>
      </Card>

      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Comprobante de Pago</DialogTitle></DialogHeader>
          <div className="py-4 relative aspect-video">{viewingProofUrl ? (<Image src={viewingProofUrl} alt="Comprobante" layout="fill" className="rounded-md object-contain" />) : <p>No se pudo cargar el comprobante.</p>}</div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingExpense ? "Editar Gasto" : "Registrar Gasto de SUMA"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveExpense}>
            <div className="space-y-4 py-4">
              <div><Label htmlFor="date">Fecha</Label><Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} /></div>
              <div><Label htmlFor="description">Descripción</Label><Input id="description" name="description" defaultValue={editingExpense?.description || ''} /></div>
              <div><Label htmlFor="amount">Monto ($)</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount || ''} /></div>
              <div><Label htmlFor="category">Categoría</Label><Select name="category" defaultValue={editingExpense?.category || 'operativo'}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="operativo">Operativo</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="personal">Personal</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

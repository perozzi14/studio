
"use client";

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { BankDetail, City, Coupon, CompanyExpense } from '@/lib/types';
import { useSettings } from '@/lib/settings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, PlusCircle, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import Image from 'next/image';
import { z } from 'zod';
import { cn } from "@/lib/utils";

// Schemas for form validation
const GeneralSettingsSchema = z.object({
  logoUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  heroImageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
});

const CityFormSchema = z.object({
  name: z.string().min(3, "El nombre de la ciudad es requerido."),
  subscriptionFee: z.preprocess((val) => Number(val), z.number().min(0, "La tarifa debe ser un número positivo.")),
});

const SpecialtyFormSchema = z.object({
  name: z.string().min(3, "El nombre de la especialidad es requerido."),
});

const CouponFormSchema = z.object({
  code: z.string().min(3, "El código es requerido.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.preprocess((val) => Number(val), z.number().positive("El valor debe ser positivo.")),
  scope: z.string(),
});

const BankDetailFormSchema = z.object({
    bank: z.string().min(3, "El nombre del banco es requerido."),
    accountHolder: z.string().min(3, "El nombre del titular es requerido."),
    idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
    accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
    description: z.string().optional(),
});


export function SettingsTab() {
  const { 
    settings, 
    updateSetting,
    addListItem,
    updateListItem,
    deleteListItem,
    cities,
    specialties,
    coupons,
    companyBankDetails,
  } = useSettings();
  const { toast } = useToast();

  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  
  const [isSpecialtyDialogOpen, setIsSpecialtyDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<string | null>(null);

  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
  const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'city' | 'specialty' | 'coupon' | 'bank', idOrName: string } | null>(null);


  const handleSaveGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
        logoUrl: formData.get('logoUrl') as string,
        heroImageUrl: formData.get('heroImageUrl') as string,
    }
    const result = GeneralSettingsSchema.safeParse(data);
    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
        return;
    }

    if (result.data.logoUrl) await updateSetting('logoUrl', result.data.logoUrl);
    if (result.data.heroImageUrl) await updateSetting('heroImageUrl', result.data.heroImageUrl);
    toast({ title: 'Configuración Guardada' });
  };
  
  const handleSaveCity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = { name: formData.get('cityName') as string, subscriptionFee: formData.get('fee') as string };
    const result = CityFormSchema.safeParse(data);
    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ') });
        return;
    }
    if(editingCity) {
        await updateListItem('cities', editingCity.name, result.data);
        toast({ title: 'Ciudad Actualizada'});
    } else {
        await addListItem('cities', result.data);
        toast({ title: 'Ciudad Añadida'});
    }
    setIsCityDialogOpen(false);
    setEditingCity(null);
  }

  const handleSaveSpecialty = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = { name: formData.get('specialtyName') as string };
      const result = SpecialtyFormSchema.safeParse(data);
      if(!result.success) {
          toast({ variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ') });
          return;
      }
      if(editingSpecialty) {
          await updateListItem('specialties', editingSpecialty, result.data.name);
          toast({ title: 'Especialidad Actualizada'});
      } else {
          await addListItem('specialties', result.data.name);
          toast({ title: 'Especialidad Añadida'});
      }
      setIsSpecialtyDialogOpen(false);
      setEditingSpecialty(null);
  }
  
  const handleSaveCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
          code: formData.get('code') as string,
          discountType: formData.get('discountType') as 'fixed' | 'percentage',
          value: formData.get('value') as string,
          scope: formData.get('scope') as string,
      }
      const result = CouponFormSchema.safeParse(data);
      if(!result.success) {
          toast({ variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ') });
          return;
      }
      if(editingCoupon) {
          await updateListItem('coupons', editingCoupon.id, {...result.data, id: editingCoupon.id});
          toast({ title: 'Cupón Actualizado'});
      } else {
          await addListItem('coupons', result.data);
          toast({ title: 'Cupón Añadido'});
      }
      setIsCouponDialogOpen(false);
      setEditingCoupon(null);
  }

  const handleSaveBankDetail = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
          bank: formData.get('bankName') as string,
          accountHolder: formData.get('holderName') as string,
          idNumber: formData.get('idNumber') as string,
          accountNumber: formData.get('accountNumber') as string,
          description: formData.get('description') as string,
      }
      const result = BankDetailFormSchema.safeParse(data);
      if(!result.success) {
          toast({ variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ') });
          return;
      }
      if(editingBankDetail) {
          await updateListItem('companyBankDetails', editingBankDetail.id, {...result.data, id: editingBankDetail.id});
          toast({ title: 'Cuenta Actualizada'});
      } else {
          await addListItem('companyBankDetails', result.data);
          toast({ title: 'Cuenta Añadida'});
      }
      setIsBankDetailDialogOpen(false);
      setEditingBankDetail(null);
  }

  const confirmDelete = (type: 'city' | 'specialty' | 'coupon' | 'bank', idOrName: string) => {
    setItemToDelete({ type, idOrName });
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    await deleteListItem(itemToDelete.type === 'bank' ? 'companyBankDetails' : `${itemToDelete.type}s` as 'cities' | 'specialties' | 'coupons', itemToDelete.idOrName);
    toast({ title: "Elemento Eliminado" });
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
            <form onSubmit={handleSaveGeneral}>
                <CardHeader><CardTitle>Configuración General</CardTitle><CardDescription>Ajustes globales de la plataforma.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div><Label htmlFor="logoUrl">URL del Logo</Label><Input id="logoUrl" name="logoUrl" defaultValue={settings?.logoUrl} /></div>
                    <div><Label htmlFor="heroImageUrl">URL de la Imagen Principal</Label><Input id="heroImageUrl" name="heroImageUrl" defaultValue={settings?.heroImageUrl} /></div>
                </CardContent>
                <CardFooter><Button type="submit"><Save className="mr-2"/>Guardar</Button></CardFooter>
            </form>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Ciudades y Tarifas</CardTitle><Button onClick={()=>{setEditingCity(null);setIsCityDialogOpen(true);}}><PlusCircle className="mr-2"/>Añadir Ciudad</Button></CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Ciudad</TableHead><TableHead className="text-right">Tarifa de Suscripción</TableHead><TableHead className="w-24 text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>
                {cities.map(c => <TableRow key={c.name}><TableCell>{c.name}</TableCell><TableCell className="text-right">${c.subscriptionFee.toFixed(2)}</TableCell><TableCell className="text-center space-x-2"><Button variant="outline" size="icon" onClick={()=>{setEditingCity(c);setIsCityDialogOpen(true);}}><Pencil/></Button><Button variant="destructive" size="icon" onClick={()=>confirmDelete('city', c.name)}><Trash2/></Button></TableCell></TableRow>)}
            </TableBody></Table></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Especialidades Médicas</CardTitle><Button onClick={()=>{setEditingSpecialty(null);setIsSpecialtyDialogOpen(true);}}><PlusCircle className="mr-2"/>Añadir Especialidad</Button></CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="w-24 text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>
                {specialties.map(s => <TableRow key={s}><TableCell>{s}</TableCell><TableCell className="text-center space-x-2"><Button variant="outline" size="icon" onClick={()=>{setEditingSpecialty(s);setIsSpecialtyDialogOpen(true);}}><Pencil/></Button><Button variant="destructive" size="icon" onClick={()=>confirmDelete('specialty', s)}><Trash2/></Button></TableCell></TableRow>)}
            </TableBody></Table></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Cupones de Descuento</CardTitle><Button onClick={()=>{setEditingCoupon(null);setIsCouponDialogOpen(true);}}><PlusCircle className="mr-2"/>Añadir Cupón</Button></CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Alcance</TableHead><TableHead className="w-24 text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>
                {coupons.map(c => <TableRow key={c.id}><TableCell>{c.code}</TableCell><TableCell>{c.discountType}</TableCell><TableCell>{c.value}</TableCell><TableCell>{c.scope}</TableCell><TableCell className="text-center space-x-2"><Button variant="outline" size="icon" onClick={()=>{setEditingCoupon(c);setIsCouponDialogOpen(true);}}><Pencil/></Button><Button variant="destructive" size="icon" onClick={()=>confirmDelete('coupon', c.id)}><Trash2/></Button></TableCell></TableRow>)}
            </TableBody></Table></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Cuentas Bancarias de SUMA</CardTitle><Button onClick={()=>{setEditingBankDetail(null);setIsBankDetailDialogOpen(true);}}><PlusCircle className="mr-2"/>Añadir Cuenta</Button></CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Titular</TableHead><TableHead>Número</TableHead><TableHead className="w-24 text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>
                {companyBankDetails.map(b => <TableRow key={b.id}><TableCell>{b.bank}</TableCell><TableCell>{b.accountHolder}</TableCell><TableCell>{b.accountNumber}</TableCell><TableCell className="text-center space-x-2"><Button variant="outline" size="icon" onClick={()=>{setEditingBankDetail(b);setIsBankDetailDialogOpen(true);}}><Pencil/></Button><Button variant="destructive" size="icon" onClick={()=>confirmDelete('bank', b.id)}><Trash2/></Button></TableCell></TableRow>)}
            </TableBody></Table></CardContent>
        </Card>
      </div>

        {/* Dialogs */}
        <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingCity ? 'Editar Ciudad' : 'Nueva Ciudad'}</DialogTitle></DialogHeader><form onSubmit={handleSaveCity} className="space-y-4 py-4"><div><Label htmlFor="cityName">Nombre</Label><Input id="cityName" name="cityName" defaultValue={editingCity?.name} required/></div><div><Label htmlFor="fee">Tarifa Mensual ($)</Label><Input id="fee" name="fee" type="number" defaultValue={editingCity?.subscriptionFee} required/></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={isSpecialtyDialogOpen} onOpenChange={setIsSpecialtyDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingSpecialty ? 'Editar Especialidad' : 'Nueva Especialidad'}</DialogTitle></DialogHeader><form onSubmit={handleSaveSpecialty} className="space-y-4 py-4"><div><Label htmlFor="specialtyName">Nombre</Label><Input id="specialtyName" name="specialtyName" defaultValue={editingSpecialty || ''} required/></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</DialogTitle></DialogHeader><form onSubmit={handleSaveCoupon} className="space-y-4 py-4"><div><Label>Código</Label><Input name="code" defaultValue={editingCoupon?.code} required/></div><div><Label>Tipo</Label><Select name="discountType" defaultValue={editingCoupon?.discountType}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fixed">Monto Fijo ($)</SelectItem><SelectItem value="percentage">Porcentaje (%)</SelectItem></SelectContent></Select></div><div><Label>Valor</Label><Input name="value" type="number" defaultValue={editingCoupon?.value} required/></div><div><Label>Alcance</Label><Input name="scope" defaultValue={editingCoupon?.scope || 'general'} required placeholder="general o ID del médico"/></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={isBankDetailDialogOpen} onOpenChange={setIsBankDetailDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingBankDetail ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle></DialogHeader><form onSubmit={handleSaveBankDetail} className="space-y-4 py-4"><div><Label>Banco</Label><Input name="bankName" defaultValue={editingBankDetail?.bank}/></div><div><Label>Titular</Label><Input name="holderName" defaultValue={editingBankDetail?.accountHolder}/></div><div><Label>CI/RIF</Label><Input name="idNumber" defaultValue={editingBankDetail?.idNumber}/></div><div><Label># Cuenta</Label><Input name="accountNumber" defaultValue={editingBankDetail?.accountNumber}/></div><div><Label>Descripción</Label><Input name="description" defaultValue={editingBankDetail?.description || ''}/></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter></form></DialogContent></Dialog>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente y no se puede deshacer. ¿Seguro que quieres eliminar este elemento?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={executeDelete} className={cn(buttonVariants({variant: 'destructive'}))}>Sí, Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}

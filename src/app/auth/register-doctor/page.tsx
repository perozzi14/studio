
"use client";

import { useState } from 'react';
import Link from "next/link";
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Stethoscope, Loader2 } from "lucide-react";
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/lib/settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const DoctorRegistrationSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Por favor, ingresa un correo electrónico válido."),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número."),
  confirmPassword: z.string(),
  specialty: z.string().min(1, "Debes seleccionar una especialidad."),
  city: z.string().min(1, "Debes seleccionar una ciudad."),
  address: z.string().min(5, "La dirección es requerida."),
  slotDuration: z.number().int().min(5, "La duración debe ser al menos 5 min.").positive(),
  consultationFee: z.number().min(0, "La tarifa de consulta no puede ser negativa."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

export default function RegisterDoctorPage() {
  const { registerDoctor } = useAuth();
  const { cities, specialties } = useSettings();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    city: '',
    address: '',
    slotDuration: '30',
    consultationFee: '20'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: 'specialty' | 'city', value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const dataToValidate = {
        ...formData,
        slotDuration: parseInt(formData.slotDuration, 10),
        consultationFee: parseFloat(formData.consultationFee),
    };

    const result = DoctorRegistrationSchema.safeParse(dataToValidate);

    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(' ');
      toast({ variant: 'destructive', title: 'Error de Registro', description: errorMessage });
      setIsLoading(false);
      return;
    }
    
    try {
      await registerDoctor(result.data);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: "Ocurrió un error inesperado durante el registro." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-lg w-full">
        <CardHeader className="text-center">
           <div className="inline-block mx-auto mb-4">
            <Stethoscope className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">
            Registro para Médicos
          </CardTitle>
          <CardDescription>
            Únete a nuestra plataforma y empieza a recibir pacientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" name="name" placeholder="Dr. Juan Perez" required value={formData.name} onChange={handleChange} disabled={isLoading} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required value={formData.email} onChange={handleChange} disabled={isLoading} />
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} disabled={isLoading}/>
                    <p className="text-xs text-muted-foreground">8+ caracteres, con mayúsculas, minúsculas y números.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} disabled={isLoading}/>
                </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad</Label>
                    <Select name="specialty" value={formData.specialty} onValueChange={(v) => handleSelectChange('specialty', v)}>
                        <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                        <SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Select name="city" value={formData.city} onValueChange={(v) => handleSelectChange('city', v)}>
                        <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                        <SelectContent>{cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Dirección del Consultorio</Label>
                <Input id="address" name="address" placeholder="Ej: Av. Principal, Centro Médico, Piso 2, Consultorio 204" required value={formData.address} onChange={handleChange} disabled={isLoading} />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="slotDuration">Duración por Cita (min)</Label>
                    <Input id="slotDuration" name="slotDuration" type="number" required value={formData.slotDuration} onChange={handleChange} disabled={isLoading} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="consultationFee">Tarifa de Consulta ($)</Label>
                    <Input id="consultationFee" name="consultationFee" type="number" required value={formData.consultationFee} onChange={handleChange} disabled={isLoading} />
                </div>
             </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cuenta de Médico
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/login" className="underline">
              Inicia sesión
            </Link>
          </div>
           <Separator className="my-4" />
            <Button variant="ghost" asChild className="w-full text-muted-foreground">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a la página de inicio
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

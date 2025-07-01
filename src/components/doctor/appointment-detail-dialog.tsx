
"use client";

import { useEffect, useState } from "react";
import { Appointment } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { format, parseISO, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface AppointmentDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onUpdateAppointment: (id: string, data: Partial<Appointment>) => void;
  onOpenChat: (type: 'chat', appointment: Appointment) => void;
}

export function AppointmentDetailDialog({
  isOpen,
  onOpenChange,
  appointment,
  onUpdateAppointment,
  onOpenChat,
}: AppointmentDetailDialogProps) {
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [prescription, setPrescription] = useState("");

  useEffect(() => {
    if (appointment) {
      setClinicalNotes(appointment.clinicalNotes || "");
      setPrescription(appointment.prescription || "");
    }
  }, [appointment]);

  const handleSaveRecord = () => {
    if (appointment) {
        onUpdateAppointment(appointment.id, { clinicalNotes, prescription });
    }
  };

  if (!appointment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalles de la Cita</DialogTitle>
                <DialogDescription>Cita con {appointment.patientName} el {format(addHours(parseISO(appointment.date), 5), 'dd MMM yyyy', { locale: es })} a las {appointment.time}.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card><CardHeader><CardTitle className="text-base">Información del Paciente</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>Nombre:</strong> {appointment.patientName}</p>
                        </CardContent>
                    </Card>
                    <Card><CardHeader><CardTitle className="text-base">Detalles del Pago</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <p><strong>Total:</strong> <span className="font-mono font-semibold">${appointment.totalPrice.toFixed(2)}</span></p>
                            <p><strong>Método:</strong> <span className="capitalize">{appointment.paymentMethod}</span></p>
                            <div className="flex items-center gap-2"><strong>Estado:</strong><Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn({'bg-green-600 text-white': appointment.paymentStatus === 'Pagado'})}>{appointment.paymentStatus}</Badge></div>
                            {appointment.paymentMethod === 'transferencia' && (
                                <a href={appointment.paymentProof || '#'} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({variant: 'outline', size: 'sm'}), 'w-full mt-2')}>
                                    <Eye className="mr-2 h-4 w-4"/> Ver Comprobante
                                </a>
                            )}
                            {appointment.paymentStatus === 'Pendiente' && appointment.paymentMethod === 'transferencia' && (
                                <Button size="sm" className="w-full mt-2" onClick={() => onUpdateAppointment(appointment.id, { paymentStatus: 'Pagado' })}>
                                    <CheckCircle className="mr-2 h-4 w-4"/> Aprobar Pago
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader><CardTitle className="text-base">Gestión de la Cita</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {appointment.attendance === 'Pendiente' ? (
                            <div className="flex items-center gap-4">
                                <Label>Asistencia del Paciente:</Label>
                                <div className="flex gap-2">
                                    <Button size="sm" variant={appointment.attendance === 'Atendido' ? 'default' : 'outline'} onClick={() => onUpdateAppointment(appointment.id, { attendance: 'Atendido' })}> <ThumbsUp className="mr-2 h-4 w-4"/>Atendido </Button>
                                    <Button size="sm" variant={appointment.attendance === 'No Asistió' ? 'destructive' : 'outline'} onClick={() => onUpdateAppointment(appointment.id, { attendance: 'No Asistió' })}> <ThumbsDown className="mr-2 h-4 w-4"/>No Asistió </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Label>Asistencia:</Label>
                                <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': appointment.attendance === 'Atendido'})}>
                                    {appointment.attendance}
                                </Badge>
                            </div>
                        )}
                        {appointment.attendance === 'Atendido' && (
                            <div className="space-y-4 border-t pt-4">
                                <div><Label htmlFor="clinicalNotes">Historia Clínica / Notas</Label><Textarea id="clinicalNotes" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} rows={5} placeholder="Añade notas sobre la consulta..." /></div>
                                <div><Label htmlFor="prescription">Récipé e Indicaciones</Label><Textarea id="prescription" value={prescription} onChange={(e) => setPrescription(e.target.value)} rows={5} placeholder="Añade el récipe y las indicaciones médicas..." /></div>
                                <Button onClick={handleSaveRecord}><CheckCircle className="mr-2 h-4 w-4"/> Guardar Resumen Clínico</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => { onOpenChat('chat', appointment); onOpenChange(false); }}><MessageSquare className="mr-2 h-4 w-4" />Abrir Chat</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

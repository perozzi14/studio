
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { doctors, Doctor } from "@/lib/data";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Clock, MapPin, Star, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DoctorProfilePage() {
  const params = useParams();
  const id = params.id ? parseInt(params.id as string, 10) : null;
  const doctor = doctors.find((d) => d.id === id);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  if (!doctor) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Médico no encontrado.</p>
        </main>
      </div>
    );
  }

  const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      setIsBooked(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
             <div className="md:col-span-1">
                <Card className="overflow-hidden">
                    <div className="aspect-w-1 aspect-h-1">
                      <Image
                        src={doctor.image}
                        alt={`Dr. ${doctor.name}`}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                        data-ai-hint={doctor.aiHint}
                      />
                    </div>
                </Card>
             </div>
             <div className="md:col-span-2">
                 <h1 className="text-3xl font-bold font-headline">{doctor.name}</h1>
                  <p className="text-primary font-medium text-xl mt-1">{doctor.specialty}</p>
                  <div className="flex items-center gap-4 text-muted-foreground mt-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{doctor.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-lg">{doctor.rating}</span>
                      <span>({doctor.reviewCount} reseñas)</span>
                    </div>
                  </div>
             </div>
          </div>
          
          <Separator className="my-8 md:my-12" />

          <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Reservar una Cita</CardTitle>
                <CardDescription>Selecciona una fecha y hora que te funcione.</CardDescription>
              </CardHeader>
              <CardContent>
                {isBooked ? (
                  <div className="flex flex-col items-center justify-center text-center h-96">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-bold">¡Cita Confirmada!</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">
                      Tu cita con {doctor.name} el{" "}
                      {selectedDate?.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })} a las {selectedTime} está reservada.
                    </p>
                    <Button onClick={() => setIsBooked(false)} className="mt-6">Reservar Otra Cita</Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="flex flex-col items-center">
                      <h4 className="font-semibold mb-4 text-lg">1. Selecciona una Fecha</h4>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border bg-card"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-semibold mb-4 text-lg text-center md:text-left">2. Selecciona una Hora</h4>
                      {selectedDate ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {availableTimes.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              onClick={() => setSelectedTime(time)}
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              {time}
                            </Button>
                          ))}
                        </div>
                      ) : (
                         <p className="text-muted-foreground text-center md:text-left mt-4">Por favor, selecciona una fecha primero.</p>
                      )}

                      <Button
                        onClick={handleBooking}
                        disabled={!selectedDate || !selectedTime}
                        className="w-full mt-8"
                        size="lg"
                      >
                        Confirmar Cita
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

        </div>
      </main>
    </div>
  );
}

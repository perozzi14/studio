
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { doctors, Doctor } from "@/lib/data";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Clock, MapPin, Star, CheckCircle } from "lucide-react";

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
          <p>Doctor not found.</p>
        </main>
        <Footer />
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
      <main className="flex-1 py-12">
        <div className="container grid md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  <Image
                    src={doctor.image}
                    alt={`Dr. ${doctor.name}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    data-ai-hint={doctor.aiHint}
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold font-headline">{doctor.name}</h2>
                  <p className="text-primary font-medium text-lg">{doctor.specialty}</p>
                  <div className="flex items-center gap-1 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{doctor.location}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-lg">{doctor.rating}</span>
                    <span className="text-muted-foreground">({doctor.reviewCount} reviews)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Book an Appointment</CardTitle>
                <CardDescription>Select a date and time that works for you.</CardDescription>
              </CardHeader>
              <CardContent>
                {isBooked ? (
                  <div className="flex flex-col items-center justify-center text-center h-96">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-bold">Appointment Confirmed!</h3>
                    <p className="text-muted-foreground mt-2">
                      Your appointment with {doctor.name} on{" "}
                      {selectedDate?.toLocaleDateString()} at {selectedTime} is booked.
                    </p>
                    <Button onClick={() => setIsBooked(false)} className="mt-6">Book Another Appointment</Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold mb-4">1. Select a Date</h4>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border bg-card"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">2. Select a Time</h4>
                      <div className="grid grid-cols-2 gap-2">
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
                      <Button
                        onClick={handleBooking}
                        disabled={!selectedDate || !selectedTime}
                        className="w-full mt-8"
                        size="lg"
                      >
                        Confirm Appointment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

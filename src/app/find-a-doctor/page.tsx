"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const specialties = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Oncology",
  "Orthopedics",
];

const doctors = [
  { id: 1, name: "Dr. Ana Rodriguez", specialty: "Cardiology", location: "Mexico City", rating: 4.9, reviewCount: 120, image: "https://placehold.co/300x300.png", aiHint: "woman doctor" },
  { id: 2, name: "Dr. Carlos Sanchez", specialty: "Dermatology", location: "Guadalajara", rating: 4.8, reviewCount: 98, image: "https://placehold.co/300x300.png", aiHint: "man doctor" },
  { id: 3, name: "Dr. Sofia Gomez", specialty: "Neurology", location: "Monterrey", rating: 4.9, reviewCount: 150, image: "https://placehold.co/300x300.png", aiHint: "doctor smile" },
  { id: 4, name: "Dr. Luis Fernandez", specialty: "Pediatrics", location: "Mexico City", rating: 5.0, reviewCount: 210, image: "https://placehold.co/300x300.png", aiHint: "male doctor" },
  { id: 5, name: "Dr. Maria Hernandez", specialty: "Oncology", location: "Guadalajara", rating: 4.7, reviewCount: 75, image: "https://placehold.co/300x300.png", aiHint: "female doctor" },
  { id: 6, name: "Dr. Javier Torres", specialty: "Orthopedics", location: "Mexico City", rating: 4.8, reviewCount: 112, image: "https://placehold.co/300x300.png", aiHint: "doctor portrait" },
];

type Doctor = (typeof doctors)[0];

export default function FindDoctorPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-muted/50 border-b">
          <div className="container py-8">
            <h1 className="text-3xl font-bold font-headline mb-4">
              Find Your Specialist
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="font-medium text-sm">Specialty</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="e.g., Cardiology" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s} value={s.toLowerCase()}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="font-medium text-sm">Location</label>
                <Input placeholder="e.g., Mexico City" />
              </div>
              <div className="space-y-2">
                <label className="font-medium text-sm">Availability</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-card",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button size="lg" className="h-10">Search</Button>
            </div>
          </div>
        </div>

        <div className="container py-12">
          <h2 className="text-2xl font-bold mb-6">
            {doctors.length} doctors found
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden">
          <Image
            src={doctor.image}
            alt={`Dr. ${doctor.name}`}
            width={300}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            data-ai-hint={doctor.aiHint}
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold font-headline">{doctor.name}</h3>
          <p className="text-primary font-medium">{doctor.specialty}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <MapPin className="h-4 w-4" />
            <span>{doctor.location}</span>
          </div>
          <div className="flex items-center gap-1 text-sm mt-2">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold">{doctor.rating}</span>
            <span className="text-muted-foreground">
              ({doctor.reviewCount} reviews)
            </span>
          </div>
          <Button className="w-full mt-6" asChild>
            <Link href={`/doctors/${doctor.id}`}>Book Appointment</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

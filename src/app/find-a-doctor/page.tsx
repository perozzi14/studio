
"use client";

import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, MapPin, Star, Search } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { specialties, doctors, type Doctor } from "@/lib/data";

export default function FindDoctorPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [specialty, setSpecialty] = useState("all");
  const [location, setLocation] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(doctors);

  const handleSearch = () => {
     let results = doctors;

    if (specialty && specialty !== "all") {
      results = results.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    }

    if (location.trim()) {
      results = results.filter(d => d.location.toLowerCase().includes(location.toLowerCase().trim()));
    }

    setFilteredDoctors(results);
  };
  
  // Trigger search on filter change
  useEffect(() => {
    handleSearch();
  }, [specialty, location]);


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
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="e.g., Cardiology" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="font-medium text-sm">Location</label>
                <Input 
                  placeholder="e.g., Mexico City" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
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
              <Button size="lg" className="h-10" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4"/> Search
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-12">
          <h2 className="text-2xl font-bold mb-6">
            {filteredDoctors.length} doctors found
          </h2>
          {filteredDoctors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
             <div className="text-center py-20 bg-muted/50 rounded-lg">
                <p className="text-lg text-muted-foreground">No doctors found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
             </div>
          )}
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

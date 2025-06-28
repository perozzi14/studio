
"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  MapPin,
  Star,
  Search,
  HeartPulse,
  Scan,
  BrainCircuit,
  Baby,
  Shield,
  Bone,
  ChevronDown,
  List,
  Stethoscope,
  Wind,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { specialties, doctors, cities, type Doctor } from "@/lib/data";

const specialtyIcons: Record<string, React.ElementType> = {
  Cardiología: HeartPulse,
  Dermatología: Scan,
  Neurología: BrainCircuit,
  Pediatría: Baby,
  Oncología: Shield,
  Ortopedia: Bone,
  Ginecología: Stethoscope,
  Neumonología: Wind,
};

export default function FindDoctorPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [specialty, setSpecialty] = useState("all");
  const [location, setLocation] = useState("all");
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(doctors);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);

  const handleSearch = () => {
    let results = doctors;

    if (specialty && specialty !== "all") {
      results = results.filter(
        (d) => d.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }

    if (location && location !== "all") {
      results = results.filter(
        (d) => d.city.toLowerCase() === location.toLowerCase()
      );
    }

    // Note: Date filter is not implemented in this version

    setFilteredDoctors(results);
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty, location]);


  const visibleSpecialties = showAllSpecialties
    ? specialties
    : specialties.slice(0, 7);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-muted/50 border-b">
          <div className="container py-8">
            <h1 className="text-3xl font-bold font-headline mb-2">
              Encuentra a Tu Especialista
            </h1>
            <p className="text-muted-foreground mb-6">
              Selecciona una especialidad o usa los filtros para refinar tu búsqueda.
            </p>

            <div className="space-y-6">
              <div>
                <label className="font-medium text-sm mb-3 block">
                  Especialidades
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={specialty === "all" ? "default" : "outline"}
                    onClick={() => setSpecialty("all")}
                    className="flex-col h-auto p-3 gap-1.5"
                  >
                    <List className="h-6 w-6" />
                    <span className="text-xs font-normal">Todas</span>
                  </Button>
                  {visibleSpecialties.map((s) => {
                    const Icon = specialtyIcons[s] || Search;
                    return (
                      <Button
                        key={s}
                        variant={specialty === s ? "default" : "outline"}
                        onClick={() => setSpecialty(s)}
                        className="flex-col h-auto p-3 gap-1.5"
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-normal">{s}</span>
                      </Button>
                    );
                  })}
                  {specialties.length > 7 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                      className="flex-col h-auto p-3 gap-1.5"
                    >
                      <ChevronDown
                        className={cn(
                          "h-6 w-6 transition-transform",
                          showAllSpecialties && "rotate-180"
                        )}
                      />
                      <span className="text-xs font-normal">
                        {showAllSpecialties ? "Ver menos" : "Ver más"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-end gap-4">
                <div className="space-y-2 lg:flex-1">
                  <label className="font-medium text-sm">Ubicación (Ciudad)</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las ciudades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ciudades</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:flex-1">
                  <label className="font-medium text-sm">Disponibilidad</label>
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
                        {date ? (
                          format(date, "PPP", { locale: es })
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  size="lg"
                  className="h-10 w-full lg:w-auto"
                  onClick={handleSearch}
                >
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-12">
           <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {filteredDoctors.length}{" "}
              {filteredDoctors.length === 1
                ? "médico encontrado"
                : "médicos encontrados"}
            </h2>
          </div>

          <div>
            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/50 rounded-lg">
                <p className="text-lg text-muted-foreground">
                  No se encontraron médicos que coincidan con tus criterios.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Intenta ajustar tus filtros.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg w-full">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
          <Image
            src={doctor.profileImage}
            alt={`Dr. ${doctor.name}`}
            fill
            sizes="(max-width: 640px) 96px, 112px"
            className="rounded-lg object-cover"
            data-ai-hint={doctor.aiHint}
          />
        </div>
        <div className="flex flex-col flex-grow h-full">
          <h3 className="text-lg font-bold font-headline leading-tight">{doctor.name}</h3>
          <p className="text-primary font-medium text-sm">{doctor.specialty}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span>{doctor.city}</span>
          </div>
          <div className="flex items-center gap-1 text-xs mt-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold">{doctor.rating}</span>
            <span className="text-muted-foreground">
              ({doctor.reviewCount} reseñas)
            </span>
          </div>
          <Button className="w-full mt-auto" size="sm" asChild>
            <Link href={`/doctors/${doctor.id}`}>Reservar Cita</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

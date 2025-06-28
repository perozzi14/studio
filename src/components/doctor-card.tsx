"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";

import { useAuth } from "@/lib/auth";
import type { Doctor } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { user, toggleFavoriteDoctor } = useAuth();
  const { toast } = useToast();

  const isFavorite = user?.role === 'patient' && user.favoriteDoctorIds?.includes(doctor.id);

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Stop link navigation if card is wrapped in a link
    if (!user) {
        toast({
            variant: "destructive",
            title: "Inicia Sesión",
            description: "Debes iniciar sesión para guardar favoritos.",
        });
        return;
    }
    if (user.role === 'patient') {
        toggleFavoriteDoctor(doctor.id);
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg w-full">
      <CardContent className="relative flex items-center gap-4 p-4">
         {user?.role === 'patient' && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/70 hover:bg-background z-10"
                onClick={handleFavoriteClick}
            >
                <Heart className={cn("h-5 w-5 text-red-500", isFavorite ? "fill-current" : "fill-none")} />
                <span className="sr-only">Marcar como favorito</span>
            </Button>
        )}
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

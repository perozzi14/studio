
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { Header, BottomNav } from "@/components/header";
import { useAuth } from "@/lib/auth";
import * as firestoreService from '@/lib/firestoreService';
import { type Doctor } from "@/lib/types";
import { DoctorCard } from "@/components/doctor-card";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
        setIsLoading(true);
        try {
            const docs = await firestoreService.getDoctors();
            setAllDoctors(docs);
        } catch (error) {
            console.error("Failed to fetch doctors for favorites, possibly offline.", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchDocs();
  }, []);

  const favoriteDoctors = useMemo(() => {
    if (user?.role !== 'patient' || !user.favoriteDoctorIds) {
      return [];
    }
    
    return allDoctors.filter((doctor) =>
      user.favoriteDoctorIds!.includes(doctor.id)
    );
  }, [user, allDoctors]);

  if (user === undefined || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  if (user === null) {
      return (
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="container flex-1 flex flex-col items-center justify-center text-center py-20">
              <h1 className="text-2xl font-bold mb-4">Inicia sesión para ver tus favoritos</h1>
              <p className="text-muted-foreground mb-6">Debes tener una cuenta para guardar y ver tus médicos favoritos.</p>
              <Button asChild>
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
          </main>
        </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40 pb-20 md:pb-0">
        <div className="container py-12">
           <div className="mb-8">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
              <Heart className="text-red-500" />
              Mis Médicos Favoritos
            </h1>
            <p className="text-muted-foreground">
                Aquí están los especialistas que has guardado.
            </p>
          </div>

          <div>
            {favoriteDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-lg border">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold">Aún no tienes favoritos</h2>
                <p className="text-muted-foreground mt-2 mb-6">
                  Haz clic en el corazón sobre la tarjeta de un médico para guardarlo aquí.
                </p>
                <Button asChild>
                    <Link href="/find-a-doctor">
                        Buscar Médicos
                    </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

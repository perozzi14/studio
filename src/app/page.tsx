import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Search, UserCheck, CalendarDays, Bot } from "lucide-react";
import React from "react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter">
              Sistema Unificado de Medicina Avanzada
            </h1>
            <p className="text-lg text-muted-foreground">
              MedAgenda es una plataforma integrada para la gestión de citas
              médicas, conectando a pacientes y profesionales de la salud en un
              entorno moderno, automatizado y fácil de usar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/find-a-doctor">Busca tu Médico</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Únete como Profesional</Link>
              </Button>
            </div>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Paciente feliz en consulta con un doctor"
              width={600}
              height={400}
              className="rounded-xl shadow-lg"
              data-ai-hint="doctor patient"
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted py-20 md:py-24">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">
                ¿Por Qué Elegir MedAgenda?
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Digitalizando la atención médica desde la búsqueda de un doctor
                hasta la gestión del historial clínico, ofreciendo eficiencia
                tanto para el paciente como para el médico.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Search />}
                title="Búsqueda Inteligente de Médicos"
                description="Encuentra al médico adecuado por especialidad, ubicación y disponibilidad."
              />
              <FeatureCard
                icon={<UserCheck />}
                title="Registro Fácil de Pacientes"
                description="Un proceso de registro ágil y seguro."
              />
              <FeatureCard
                icon={<CalendarDays />}
                title="Reservas en Tiempo Real"
                description="Agenda citas en pocos pasos con disponibilidad en tiempo real."
              />
              <FeatureCard
                icon={<Bot />}
                title="Asistente con IA"
                description="Obtén orientación sobre procedimientos y recomendaciones a través de nuestro asistente de WhatsApp."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container py-20 md:py-24">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">
              Cómo Funciona
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StepCard
              number="1"
              title="Busca"
              description="Filtra y encuentra al especialista perfecto para tus necesidades."
            />
            <StepCard
              number="2"
              title="Reserva"
              description="Selecciona un horario disponible y reserva tu cita al instante."
            />
            <StepCard
              number="3"
              title="Gestiona"
              description="Accede a tu historial médico y gestiona tus citas en un solo lugar."
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm text-center flex flex-col items-center">
      <div className="mb-4 inline-block bg-primary/10 p-4 rounded-full">
        {React.cloneElement(icon as React.ReactElement, {
          className: "h-8 w-8 text-primary",
        })}
      </div>
      <h3 className="text-xl font-bold font-headline mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold font-headline mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

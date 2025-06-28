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
              Unified System for Advanced Medicine
            </h1>
            <p className="text-lg text-muted-foreground">
              MedAgenda is an integrated platform for managing medical
              appointments, connecting patients and health professionals in a
              modern, automated, and easy-to-use environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/find-a-doctor">Find Your Doctor</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Join as a Professional</Link>
              </Button>
            </div>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Happy patient consulting with a doctor"
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
                Why Choose MedAgenda?
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Digitizing healthcare from finding a doctor to managing clinical
                history, offering efficiency for both patient and doctor.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Search />}
                title="Smart Doctor Search"
                description="Find the right doctor by specialty, location, and availability."
              />
              <FeatureCard
                icon={<UserCheck />}
                title="Easy Patient Registration"
                description="A streamlined and secure registration process."
              />
              <FeatureCard
                icon={<CalendarDays />}
                title="Real-Time Booking"
                description="Schedule appointments in just a few steps with real-time availability."
              />
              <FeatureCard
                icon={<Bot />}
                title="AI Assistant"
                description="Get guidance on procedures and recommendations via our WhatsApp assistant."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container py-20 md:py-24">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StepCard
              number="1"
              title="Search"
              description="Filter and find the perfect specialist for your needs."
            />
            <StepCard
              number="2"
              title="Book"
              description="Select an available time slot and book your appointment instantly."
            />
            <StepCard
              number="3"
              title="Manage"
              description="Access your medical history and manage your appointments all in one place."
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


"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { OverviewTab } from './tabs/overview-tab';
import { DoctorsTab } from './tabs/doctors-tab';
import { SellersTab } from './tabs/sellers-tab';
import { PatientsTab } from './tabs/patients-tab';
import { FinancesTab } from './tabs/finances-tab';
import { MarketingTab } from './tabs/marketing-tab';
import { SupportTab } from './tabs/support-tab';
import { SettingsTab } from './tabs/settings-tab';


export function AdminDashboardClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (!loading && (user === null || user.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  const currentTab = searchParams.get('view') || 'overview';
  
  const handleTabChange = (value: string) => {
    router.push(`/admin/dashboard?view=${value}`);
  };
  
  const tabs = useMemo(() => [
    { value: "overview", label: "General", component: <OverviewTab /> },
    { value: "doctors", label: "Médicos", component: <DoctorsTab /> },
    { value: "sellers", label: "Vendedoras", component: <SellersTab /> },
    { value: "patients", label: "Pacientes", component: <PatientsTab /> },
    { value: "finances", label: "Finanzas", component: <FinancesTab /> },
    { value: "marketing", label: "Marketing", component: <MarketingTab /> },
    { value: "support", label: "Soporte", component: <SupportTab /> },
    { value: "settings", label: "Configuración", component: <SettingsTab /> },
  ], []);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-headline mb-2">Panel de Administrador</h1>
            <p className="text-muted-foreground">Bienvenido, {user.name}. Gestiona todo el sistema SUMA desde aquí.</p>
          </div>
          
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
            <div className="mt-6">
              {tabs.map(tab => (
                <TabsContent key={tab.value} value={tab.value}>
                  {tab.component}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

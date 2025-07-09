
"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import * as firestoreService from '@/lib/firestoreService';

import { OverviewTab } from './tabs/overview-tab';
import { DoctorsTab } from './tabs/doctors-tab';
import { SellersTab } from './tabs/sellers-tab';
import { PatientsTab } from './tabs/patients-tab';
import { FinancesTab } from './tabs/finances-tab';
import { MarketingTab } from './tabs/marketing-tab';
import { SupportTab } from './tabs/support-tab';
import { SettingsTab } from './tabs/settings-tab';
import type { Doctor, Seller, Patient, MarketingMaterial } from '@/lib/types';


export function AdminDashboardClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('view') || 'overview';
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'doctor' | 'seller' | 'patient' | 'marketing', item: any} | null>(null);


  useEffect(() => {
    if (!loading && (user === null || user.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  const handleTabChange = (value: string) => {
    router.push(`/admin/dashboard?view=${value}`);
  };
  
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
        switch (itemToDelete.type) {
            case 'doctor':
                await firestoreService.deleteDoctor(itemToDelete.item.id);
                toast({ title: "Médico Eliminado" });
                break;
            case 'seller':
                await firestoreService.deleteSeller(itemToDelete.item.id);
                 toast({ title: "Vendedora Eliminada" });
                break;
            case 'patient':
                await firestoreService.deletePatient(itemToDelete.item.id);
                 toast({ title: "Paciente Eliminado" });
                break;
            case 'marketing':
                 await firestoreService.deleteMarketingMaterial(itemToDelete.item.id);
                 toast({ title: "Material Eliminado" });
                 break;
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error al eliminar', description: 'No se pudo completar la operación.' });
    } finally {
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
        // We rely on the individual tabs to re-fetch their data
    }
  };

  const openDeleteDialog = (type: 'doctor' | 'seller' | 'patient' | 'marketing', item: any) => {
    setItemToDelete({ type, item });
    setIsDeleteDialogOpen(true);
  };
  
  const tabs = useMemo(() => [
    { value: "overview", label: "General", component: <OverviewTab /> },
    { value: "doctors", label: "Médicos", component: <DoctorsTab /> },
    { value: "sellers", label: "Vendedoras", component: <SellersTab onDeleteItem={(item) => openDeleteDialog('seller', item)}/> },
    { value: "patients", label: "Pacientes", component: <PatientsTab onDeleteItem={(item) => openDeleteDialog('patient', item)}/> },
    { value: "finances", label: "Finanzas", component: <FinancesTab /> },
    { value: "marketing", label: "Marketing", component: <MarketingTab onDeleteItem={(item) => openDeleteDialog('marketing', item)}/> },
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
                <TabsContent key={tab.value} value={tab.value} forceMount={currentTab === tab.value}>
                  {currentTab === tab.value ? tab.component : null}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </main>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro que deseas eliminar?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción es permanente y no se puede deshacer. Se eliminará a {itemToDelete?.item.name} del sistema.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteItem} className={cn(buttonVariants({ variant: 'destructive' }))}>
                      Sí, Eliminar
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

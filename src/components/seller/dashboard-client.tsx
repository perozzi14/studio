
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import type { Doctor, SellerPayment, MarketingMaterial, AdminSupportTicket, Seller, BankDetail, ChatMessage, Expense, DoctorPayment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralsTab } from './tabs/referrals-tab';
import { FinancesTab } from './tabs/finances-tab';
import { AccountsTab } from './tabs/accounts-tab';
import { MarketingTab } from './tabs/marketing-tab';
import { SupportTab } from './tabs/support-tab';

export function SellerDashboardClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [referredDoctors, setReferredDoctors] = useState<Doctor[]>([]);
  const [sellerPayments, setSellerPayments] = useState<SellerPayment[]>([]);
  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
  const [marketingMaterials, setMarketingMaterials] = useState<MarketingMaterial[]>([]);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);

  const currentTab = searchParams.get('view') || 'referrals';

  const handleTabChange = (value: string) => {
    router.push(`/seller/dashboard?view=${value}`);
  };

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'seller' || !user.id) return;
    setIsLoading(true);
    try {
        const [materials, seller, allDocs, allPayments, allTickets, allDoctorPayments] = await Promise.all([
            firestoreService.getMarketingMaterials(),
            firestoreService.getSeller(user.id),
            firestoreService.getDoctors(),
            firestoreService.getSellerPayments(),
            firestoreService.getSupportTickets(),
            firestoreService.getDoctorPayments(),
        ]);
        
        setMarketingMaterials(materials);
        
        if (seller) {
            const referredDoctorIds = allDocs.filter(d => d.sellerId === seller.id).map(d => d.id);
            setSellerData(seller);
            setReferredDoctors(allDocs.filter(d => d.sellerId === seller.id));
            setSellerPayments(allPayments.filter(p => p.sellerId === seller.id));
            setDoctorPayments(allDoctorPayments.filter(p => referredDoctorIds.includes(p.doctorId)));
            setSupportTickets(allTickets.filter(t => t.userId === user.email));
        }
    } catch (error) {
        console.error("Error fetching seller data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del panel.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user?.id) {
        fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (!loading && (user === null || user.role !== 'seller')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  const tabs = useMemo(() => [
    { value: "referrals", label: "Mis Referidos" },
    { value: "finances", label: "Finanzas" },
    { value: "accounts", label: "Cuentas" },
    { value: "marketing", label: "Marketing" },
    { value: "support", label: "Soporte" },
  ], []);

  if (loading || isLoading || !sellerData) {
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
            <h1 className="text-3xl font-bold font-headline mb-2">Panel de Vendedora</h1>
            <p className="text-muted-foreground mb-8">Bienvenida de nuevo, {user.name}. Aquí puedes gestionar tus médicos y finanzas.</p>

            <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                    {tabs.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                    ))}
                </TabsList>
                <div className="mt-6">
                    <TabsContent value="referrals">
                        <ReferralsTab 
                            referredDoctors={referredDoctors} 
                            referralCode={sellerData.referralCode}
                            onUpdate={fetchData}
                            doctorPayments={doctorPayments}
                        />
                    </TabsContent>
                    <TabsContent value="finances">
                        <FinancesTab
                            sellerData={sellerData}
                            referredDoctors={referredDoctors}
                            sellerPayments={sellerPayments}
                        />
                    </TabsContent>
                    <TabsContent value="accounts">
                        <AccountsTab 
                            sellerData={sellerData}
                            onUpdate={fetchData}
                        />
                    </TabsContent>
                    <TabsContent value="marketing">
                        <MarketingTab marketingMaterials={marketingMaterials}/>
                    </TabsContent>
                    <TabsContent value="support">
                        <SupportTab 
                            supportTickets={supportTickets}
                            sellerData={sellerData}
                            onUpdate={fetchData}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
      </main>
    </div>
  );
}

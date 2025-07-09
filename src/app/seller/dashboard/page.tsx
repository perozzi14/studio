
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/header';
import dynamic from 'next/dynamic';

const SellerDashboardClient = dynamic(
    () => import('@/components/seller/dashboard-client').then(mod => mod.SellerDashboardClient),
    { 
        ssr: false,
        loading: () => <DashboardLoading /> 
    }
);


function DashboardLoading() {
  return (
    <>
      <Header />
      <main className="flex-1 container py-12">
        <div className="mb-8">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    </>
  );
}

function SellerDashboardPageContent() {
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('view') || 'referrals';

    return <SellerDashboardClient currentTab={currentTab} />;
}

export default function SellerDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <SellerDashboardPageContent />
    </Suspense>
  );
}

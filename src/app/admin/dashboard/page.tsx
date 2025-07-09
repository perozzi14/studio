
import { Suspense } from 'react';
import AdminDashboardClient from '@/components/admin/dashboard-client';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardLoading() {
  return (
    <>
      <Header />
      <main className="flex-1 container py-12">
          <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="mt-8">
            <Skeleton className="h-96 w-full" />
          </div>
      </main>
    </>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminDashboardClient />
    </Suspense>
  );
}

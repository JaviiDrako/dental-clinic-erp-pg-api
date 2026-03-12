'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { TreatmentForm } from '@/components/forms/treatment-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function TreatmentFormWithSuspense() {
  return <TreatmentForm />;
}

export default function NewTreatmentPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <Link href="/treatments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Nuevo Tratamiento</h1>
          </div>

          <div className="max-w-2xl">
            <Suspense fallback={<div>Cargando formulario...</div>}>
              <TreatmentFormWithSuspense />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

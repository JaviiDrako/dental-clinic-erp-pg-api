'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { ProcedureForm } from '@/components/forms/procedure-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Componente intermedio para envolver el formulario
function ProcedureFormWithSuspense() {
  return <ProcedureForm />;
}

export default function NewProcedurePage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <Link href="/procedures">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Nuevo Procedimiento</h1>
          </div>

          <div className="max-w-2xl">
            <Suspense fallback={<div>Cargando formulario...</div>}>
              <ProcedureFormWithSuspense />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

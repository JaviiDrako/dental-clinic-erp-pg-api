'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { PatientForm } from '@/components/forms/patient-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function PatientFormWithSuspense() {
  return <PatientForm />;
}

export default function NewPatientPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <Link href="/patients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Nuevo Paciente</h1>
          </div>

          <div className="max-w-2xl">
            <Suspense fallback={<div>Cargando formulario...</div>}>
              <PatientFormWithSuspense />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

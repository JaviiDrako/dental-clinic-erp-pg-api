'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/layout/sidebar';
import type { Treatment } from '@/lib/types';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  async function loadTreatments() {
    try {
      const res = await fetch('/api/treatments');
      const result = await res.json();
      if (result.success && result.data) {
        setTreatments(result.data);
      }
    } catch (error) {
      console.error('Error loading treatments:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTreatments();
  }, []);

  async function toggleTreatment(id: string, currentActive: boolean) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!res.ok) throw new Error('Failed to update');

      toast({
        title: 'Éxito',
        description: `Tratamiento ${!currentActive ? 'activado' : 'desactivado'}`,
      });
      loadTreatments();
    } catch (error) {
      console.error('Error updating treatment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tratamiento',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  }

  const displayed = showInactive 
    ? treatments.filter(t => !t.active)
    : treatments.filter(t => t.active);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Catálogo de Tratamientos</h1>
            <div className="flex gap-2">
              <Button
                variant={showInactive ? 'outline' : 'default'}
                onClick={() => setShowInactive(false)}
              >
                Tratamientos Activos
              </Button>
              <Button
                variant={!showInactive ? 'outline' : 'default'}
                onClick={() => setShowInactive(true)}
              >
                Inactivos
              </Button>
              <Link href="/treatments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Tratamiento
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : displayed.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              No hay tratamientos {showInactive ? 'inactivos' : 'activos'} registrados
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map((treatment) => (
                <Card key={treatment.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{treatment.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      treatment.active 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {treatment.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{treatment.description || 'Sin descripción'}</p>
                  <p className="text-2xl font-bold text-primary mb-4">
                    ${treatment.base_price.toLocaleString()}
                  </p>
                  <Button
                    variant={treatment.active ? 'destructive' : 'default'}
                    className="w-full"
                    size="sm"
                    disabled={updating === treatment.id}
                    onClick={() => toggleTreatment(treatment.id, treatment.active)}
                  >
                    {updating === treatment.id ? 'Actualizando...' : (treatment.active ? '− Desactivar' : '+ Activar')}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

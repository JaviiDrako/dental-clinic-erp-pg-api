'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/layout/sidebar';
import { DashboardCharts } from '@/components/dashboard-charts';
import { Calendar, Users, Stethoscope, Clock, DollarSign } from 'lucide-react';

interface Stats {
  totals: {
    patients: number;
    doctors: number;
    scheduledAppointments: number;
    revenue: number;
  };
  upcomingAppointments: Array<{
    id: string;
    appointment_date: string;
    patient_name: string;
    doctor_name: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const result = await res.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('COP', '$');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
                    
          {/* Tarjetas de totales - AHORA SOLO 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Total Pacientes</span>
              </div>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats?.totals.patients || 0}
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Stethoscope className="w-4 h-4" />
                <span className="text-xs">Total Doctores</span>
              </div>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats?.totals.doctors || 0}
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Citas Programadas</span>
              </div>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats?.totals.scheduledAppointments || 0}
              </div>
            </Card>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando dashboard...</p>
            </div>
          ) : (
            <>
              <DashboardCharts />
            </>
          )}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
              <div className="space-y-2">
                <Link href="/patients/new" className="block">
                  <Button className="w-full" variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Nuevo Paciente
                  </Button>
                </Link>
                <Link href="/appointments/new" className="block">
                  <Button className="w-full" variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Nueva Cita
                  </Button>
                </Link>
                <Link href="/procedures/new" className="block">
                  <Button className="w-full" variant="outline" size="sm">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Nuevo Procedimiento
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Próximas Citas
              </h2>
              {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingAppointments.map((apt) => (
                    <Link 
                      key={apt.id} 
                      href={`/appointments/${apt.id}`}
                      className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition"
                    >
                      <div className="font-medium">{apt.patient_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(apt.appointment_date)}
                      </div>
                      <div className="text-xs text-primary mt-1">
                        Dr. {apt.doctor_name}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay citas programadas</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
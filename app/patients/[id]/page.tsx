'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Calendar, Eye } from 'lucide-react';

interface PatientDetail {
  id: string;
  full_name: string;
  national_id: string;
  phone: string;
  address: string;
  city_name?: string;
  birth_date?: string;
  medical_history?: string;
  created_at: string;
  totalPaid?: number;
  totalPending?: number;
  appointments?: any[];
  procedures?: any[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
      try {
        const res = await fetch(`/api/patients/${patientId}`);
        const result = await res.json();
        if (result.success && result.data) {
          setPatient(result.data);
        }
      } catch (error) {
        console.error('Error loading patient:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Paciente no encontrado</div>
        </div>
      </div>
    );
  }

  // Asegurar valores por defecto
  const totalPaid = patient.totalPaid || 0;
  const totalPending = patient.totalPending || 0;
  const appointments = patient.appointments || [];
  const procedures = patient.procedures || [];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header con nombre y botón volver */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Link href="/patients">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">
                {patient.full_name}
              </h1>
            </div>
          </div>

          {/* Primera fila - 3 cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Información Personal */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Información Personal</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Cédula de Identidad</p>
                  <p className="font-medium">{patient.national_id || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{patient.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ciudad</p>
                  <p className="font-medium">{patient.city_name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">
                    {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registro desde</p>
                  <p className="font-medium">
                    {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Estado Financiero */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Estado Financiero</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-1">Pagado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Pendiente</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalPending.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Historial Médico */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Historial Médico</h2>
              <div className="text-sm">
                <p className="text-muted-foreground">
                  {patient.medical_history || 'Sin antecedentes médicos registrados'}
                </p>
              </div>
            </Card>
          </div>

          {/* Citas Programadas */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Citas Programadas</h2>
              <Button 
                size="sm"
                onClick={() => router.push(`/appointments/new?patientId=${patientId}`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cita
              </Button>
            </div>
            
            {appointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay citas programadas</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment: any) => (
                  <div 
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(appointment.appointment_date).toLocaleDateString()} - {new Date(appointment.appointment_date).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {appointment.doctor?.full_name || 'No asignado'} • {appointment.status === 'scheduled' ? 'Programada' : appointment.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/appointments/${appointment.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Procedimientos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Procedimientos</h2>
              <Button 
                size="sm"
                onClick={() => router.push(`/procedures/new?patientId=${patientId}`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Procedimiento
              </Button>
            </div>

            {procedures.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay procedimientos registrados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {procedures.map((procedure: any) => {
                  const paid = procedure.totalPaid || 0;
                  const pending = procedure.totalPending || 0;
                  
                  // Función para obtener color y texto del estado
                  const getStatusInfo = (status: string) => {
                    switch (status) {
                      case 'planned':
                        return { text: 'Planificado', color: 'bg-yellow-100 text-yellow-800' };
                      case 'in_progress':
                        return { text: 'En Progreso', color: 'bg-blue-100 text-blue-800' };
                      case 'completed':
                        return { text: 'Completado', color: 'bg-green-100 text-green-800' };
                      case 'cancelled':
                        return { text: 'Cancelado', color: 'bg-red-100 text-red-800' };
                      default:
                        return { text: status, color: 'bg-gray-100 text-gray-800' };
                    }
                  };

                  const statusInfo = getStatusInfo(procedure.status);
                  
                  return (
                    <Card key={procedure.id} className="p-4 hover:shadow-md transition-shadow relative">
                      {/* Badge de estado - NUEVO */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      <div className="flex justify-between items-start mb-2 pr-24"> {/* pr-24 para no solaparse con el badge */}
                        <h3 className="font-semibold text-lg">{procedure.treatment?.name || 'Procedimiento'}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/procedures/${procedure.id}`)}
                        >
                          Ver Detalle
                        </Button>
                      </div>
                      
                      <div className="space-y-2 text-sm mt-2">
                        {procedure.tooth_code && (
                          <p><span className="text-muted-foreground">Pieza:</span> {procedure.tooth_code}</p>
                        )}
                        {procedure.diagnosis && (
                          <p><span className="text-muted-foreground">Diagnóstico:</span> {procedure.diagnosis}</p>
                        )}
                        <p><span className="text-muted-foreground">Sesiones:</span> {procedure.sessions?.length || 0}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Pagado</p>
                            <p className="font-medium text-green-600">${paid.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Pendiente</p>
                            <p className="font-medium text-red-600">${pending.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

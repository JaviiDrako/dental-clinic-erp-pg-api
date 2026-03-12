'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Stethoscope, FileText, Activity } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Session {
  id: string;
  session_number: number;
  progress_notes: string;
  description?: string;
  created_at: string;
  procedure_id?: string;
  procedure_name?: string;
  tooth_code?: string;
  diagnosis?: string;
}

interface AppointmentDetail {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_national_id?: string;
  patient_phone?: string;
  doctor_id: string;
  doctor_name: string;
  appointment_date: string;
  status: string;
  general_notes?: string;
  created_at: string;
  sessions: Session[];
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  async function loadAppointment() {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`);
      const result = await res.json();
      if (result.success && result.data) {
        setAppointment(result.data);
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!appointment) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      
      if (result.success) {
        setAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">Cargando...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">Cita no encontrada</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Detalle de Cita</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Información de la Cita - CON EL COMBOBOX AL FINAL */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información de la Cita
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                  <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registrada el</p>
                  <p className="font-medium">
                    {new Date(appointment.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                {/* NUEVO: Combo box de estado */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estado</p>
                  <Select
                    value={appointment.status}
                    onValueChange={handleStatusChange}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {getStatusText(appointment.status)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Programada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  {updating && (
                    <p className="text-xs text-muted-foreground mt-1">Actualizando...</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Información del Paciente */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Paciente
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium text-lg">{appointment.patient_name}</p>
                </div>
                {appointment.patient_national_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cédula</p>
                    <p className="font-medium">{appointment.patient_national_id}</p>
                  </div>
                )}
                {appointment.patient_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{appointment.patient_phone}</p>
                  </div>
                )}
                <Link href={`/patients/${appointment.patient_id}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    Ver Perfil Completo
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Información del Doctor */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Doctor
              </h2>
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium text-lg">Dr. {appointment.doctor_name}</p>
              </div>
            </Card>

            {/* Notas */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notas
              </h2>
              <p className="text-sm whitespace-pre-wrap">
                {appointment.general_notes || 'Sin notas adicionales'}
              </p>
            </Card>
          </div>

          {/* Sesiones Asociadas */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Sesiones Realizadas ({appointment.sessions?.length || 0})
            </h2>
            
            {appointment.sessions && appointment.sessions.length > 0 ? (
              <div className="space-y-4">
                {appointment.sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="font-bold text-primary">{session.session_number}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <p className="font-semibold">Sesión #{session.session_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        {session.procedure_name && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Procedimiento:</span> {session.procedure_name}
                            {session.tooth_code && ` - Pieza ${session.tooth_code}`}
                          </p>
                        )}
                        <p className="text-sm mt-2 bg-muted/50 p-2 rounded">
                          {session.progress_notes || 'Sin notas'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay sesiones registradas</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
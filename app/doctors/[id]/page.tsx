'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calendar, User, Mail, Activity, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Doctor {
  id: string;
  full_name: string;
  national_id: string;
  birth_date?: string;
  active: boolean;
  email?: string;
  role?: string;
  created_at: string;
  user_active?: boolean;
}

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_date: string;
  status: string;
  general_notes?: string;
}

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const doctorId = params.id as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Estado para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    role: '',
    password: '',
    active: true
  });

  useEffect(() => {
    async function loadDoctorData() {
      try {
        // Cargar información del doctor
        const doctorRes = await fetch(`/api/doctors/${doctorId}`);
        const doctorResult = await doctorRes.json();
        
        if (doctorResult.success && doctorResult.data) {
          setDoctor(doctorResult.data);
          setEditForm({
            email: doctorResult.data.email || '',
            role: doctorResult.data.role || 'doctor',
            password: '',
            active: doctorResult.data.active
          });
        }

        // Cargar citas del doctor
        const appointmentsRes = await fetch(`/api/doctors/${doctorId}/appointments`);
        const appointmentsResult = await appointmentsRes.json();
        
        if (appointmentsResult.success) {
          setAppointments(appointmentsResult.data || []);
        }
      } catch (error) {
        console.error('Error loading doctor data:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información del doctor',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadDoctorData();
  }, [doctorId, toast]);

  const handleStatusChange = async (checked: boolean) => {
    if (!doctor) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: checked }),
      });

      const result = await res.json();
      
      if (result.success) {
        setDoctor(prev => prev ? { ...prev, active: checked } : null);
        toast({
          title: 'Éxito',
          description: `Doctor ${checked ? 'activado' : 'desactivado'} correctamente`,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!doctor) return;
    
    setUpdating(true);
    try {
      const updates: any = {
        email: editForm.email,
        role: editForm.role,
        active: editForm.active
      };
      
      if (editForm.password) {
        updates.password = editForm.password;
      }

      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await res.json();
      
      if (result.success) {
        setDoctor(result.data);
        setIsEditing(false);
        toast({
          title: 'Éxito',
          description: 'Datos actualizados correctamente',
        });
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los datos',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Calcular estadísticas
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length;
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando información del doctor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Doctor no encontrado</p>
            <Link href="/doctors">
              <Button>Volver a Doctores</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-3xl font-bold">{doctor.full_name}</h1>
            </div>
            <div className="flex items-center gap-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Editar Información
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSaveChanges} disabled={updating} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Grid principal - 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Información Personal - ocupa 2/3 */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Cédula de Identidad</p>
                  <p className="font-medium text-lg">{doctor.national_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">
                    {doctor.birth_date ? new Date(doctor.birth_date).toLocaleDateString() : 'No registrada'}
                  </p>
                </div>
                
                {/* Email - editable */}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  {isEditing ? (
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      placeholder="email@ejemplo.com"
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{doctor.email || '-'}</p>
                  )}
                </div>

                {/* Rol - editable */}
                <div>
                  <p className="text-sm text-muted-foreground">Rol</p>
                  {isEditing ? (
                    <Select
                      value={editForm.role}
                      onValueChange={(value) => setEditForm({...editForm, role: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="receptionist">Recepcionista</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium capitalize">{doctor.role || 'doctor'}</p>
                  )}
                </div>

                {/* Contraseña - solo editable */}
                {isEditing && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Nueva Contraseña</p>
                    <Input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                      placeholder="Dejar en blanco para no cambiar"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Registro desde</p>
                  <p className="font-medium">
                    {new Date(doctor.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Estado - switch */}
                <div className="col-span-2 flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="font-medium">Estado del Doctor</p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.active ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  <Switch
                    checked={doctor.active}
                    onCheckedChange={handleStatusChange}
                    disabled={updating}
                  />
                </div>
              </div>
            </Card>

            {/* Estadísticas - ocupa 1/3 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Estadísticas
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Citas</p>
                  <p className="text-2xl font-bold">{totalAppointments}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-blue-600">Programadas</p>
                    <p className="text-lg font-bold text-blue-700">{scheduledAppointments}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-green-600">Completadas</p>
                    <p className="text-lg font-bold text-green-700">{completedAppointments}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-xs text-red-600">Canceladas</p>
                    <p className="text-lg font-bold text-red-700">{cancelledAppointments}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Citas Recientes */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Citas Recientes ({totalAppointments})
            </h2>
            
            {appointments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay citas registradas para este doctor
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Fecha y Hora</th>
                      <th className="px-4 py-3 text-left">Paciente</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.slice(0, 10).map((apt) => (
                      <tr key={apt.id} className="border-b hover:bg-muted/50 transition">
                        <td className="px-4 py-3">
                          {new Date(apt.appointment_date).toLocaleDateString()} - {new Date(apt.appointment_date).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 font-medium">{apt.patient_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                            {getStatusText(apt.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/appointments/${apt.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Detalle
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {appointments.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Mostrando las 10 citas más recientes de {appointments.length} totales
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
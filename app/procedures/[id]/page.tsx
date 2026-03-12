'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  session_number: number;
  progress_notes: string;
  description?: string;
  created_at: string;
  appointment_id?: string;
  appointment_date?: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_method_id: string;
  payment_method_name?: string;
  transaction_reference?: string;
  payment_date: string;
}

interface ProcedureDetail {
  id: string;
  patient_id: string;
  patient_name: string;
  treatment_id: string;
  treatment_name: string;
  tooth_code?: string;
  diagnosis?: string;
  total_cost: number;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  sessions: Session[];
  payments: Payment[];
  totalPaid: number;
  totalPending: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

export default function ProcedureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const procedureId = params.id as string;
  const [procedure, setProcedure] = useState<ProcedureDetail | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [sessionData, setSessionData] = useState({
    appointment_id: '',
    description: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method_id: '',
    transaction_reference: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadProcedure();
    loadPaymentMethods();
  }, [procedureId]);

  async function loadProcedure() {
    try {
      const res = await fetch(`/api/procedures/${procedureId}`);
      const result = await res.json();
      if (result.success && result.data) {
        setProcedure(result.data);
        // Cargar citas del paciente
        if (result.data.patient_id) {
          loadAppointments(result.data.patient_id);
        }
      }
    } catch (error) {
      console.error('Error loading procedure:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el procedimiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments(patientId: string) {
    try {
      // Usar la nueva API específica que filtra citas disponibles
      const res = await fetch(`/api/procedures/${procedureId}/available-appointments`);
      const result = await res.json();
      if (result.success) {
        setAppointments(result.data || []);
        console.log('Citas disponibles:', result.data); // Para debug
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }

  async function loadPaymentMethods() {
    try {
      const res = await fetch('/api/payment-methods');
      const result = await res.json();
      if (result.success) {
        setPaymentMethods(result.data || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!procedure) return;
    
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/procedures/${procedureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      
      if (result.success) {
        setProcedure(prev => prev ? { ...prev, status: newStatus } : null);
        toast({
          title: 'Éxito',
          description: 'Estado actualizado',
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
      setUpdatingStatus(false);
    }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!procedure) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/procedures/${procedureId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const result = await res.json();
      
      if (result.success) {
        toast({
          title: 'Éxito',
          description: 'Sesión creada correctamente',
        });
        setSessionData({ appointment_id: '', description: '' });
        setShowSessionForm(false);
        loadProcedure(); // Recargar para mostrar la nueva sesión
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la sesión',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!procedure) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/procedures/${procedureId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          amount: parseFloat(paymentData.amount)
        }),
      });

      const result = await res.json();
      
      if (result.success) {
        toast({
          title: 'Éxito',
          description: 'Pago registrado correctamente',
        });
        setPaymentData({ amount: '', payment_method_id: '', transaction_reference: '' });
        setShowPaymentForm(false);
        loadProcedure(); // Recargar para mostrar el nuevo pago
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planificado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
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
            <p className="mt-2 text-muted-foreground">Cargando procedimiento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!procedure) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Procedimiento no encontrado</p>
            <Link href="/procedures">
              <Button>Volver a Procedimientos</Button>
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
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">{procedure.treatment_name || 'Procedimiento'}</h1>
          </div>

          {/* Grid principal - 2/3 y 1/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - 2/3 - Información del Procedimiento */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Información del Procedimiento</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Paciente</p>
                    <p className="font-medium text-lg">{procedure.patient_name}</p>
                    <Link href={`/patients/${procedure.patient_id}`} className="text-sm text-primary hover:underline">
                      Ver perfil completo
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tratamiento</p>
                    <p className="font-medium">{procedure.treatment_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pieza Dental</p>
                    <p className="font-medium">{procedure.tooth_code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                    <p className="font-medium">
                      {procedure.start_date ? new Date(procedure.start_date).toLocaleDateString() : 'No definida'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Diagnóstico</p>
                    <p className="font-medium">{procedure.diagnosis || 'Sin diagnóstico'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Estado</p>
                    <Select
                      value={procedure.status}
                      onValueChange={handleStatusChange}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue>
                          {getStatusText(procedure.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planificado</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingStatus && (
                      <p className="text-xs text-muted-foreground mt-1">Actualizando...</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Columna derecha - 1/3 - Estado Financiero */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Estado Financiero</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Costo Total</p>
                    <p className="text-2xl font-bold">
                      ${(typeof procedure.total_cost === 'number' ? procedure.total_cost : 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pagado</p>
                    <p className="text-xl font-bold text-green-600">
                      ${(typeof procedure.totalPaid === 'number' ? procedure.totalPaid : 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendiente</p>
                    <p className="text-xl font-bold text-red-600">
                      ${(typeof procedure.totalPending === 'number' ? procedure.totalPending : 0).toFixed(2)}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="w-full mt-2"
                    variant={showPaymentForm ? "outline" : "default"}
                  >
                    {showPaymentForm ? 'Cancelar' : 'Registrar Pago'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Formulario de Pago */}
          {showPaymentForm && (
            <Card className="p-6 mt-6 border-blue-200 bg-blue-50/50">
              <h3 className="font-semibold mb-4">Registrar Nuevo Pago</h3>
              <form onSubmit={handleCreatePayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Monto *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Método de Pago *</Label>
                    <Select 
                      value={paymentData.payment_method_id} 
                      onValueChange={(value) => setPaymentData({...paymentData, payment_method_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="transaction_reference">Referencia (opcional)</Label>
                  <Input
                    id="transaction_reference"
                    placeholder="Ej: Comprobante #123, Transferencia, etc."
                    value={paymentData.transaction_reference}
                    onChange={(e) => setPaymentData({...paymentData, transaction_reference: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Registrando...' : 'Registrar Pago'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentData({ amount: '', payment_method_id: '', transaction_reference: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Sesiones */}
          <Card className="p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Sesiones ({procedure.sessions?.length || 0})</h2>
              <Button 
                onClick={() => setShowSessionForm(!showSessionForm)}
                size="sm"
                variant={showSessionForm ? "outline" : "default"}
              >
                <Plus className="w-4 h-4 mr-2" />
                {showSessionForm ? 'Cancelar' : 'Nueva Sesión'}
              </Button>
            </div>

            {showSessionForm && (
              <form onSubmit={handleCreateSession} className="mb-6 p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <Label htmlFor="appointment_id">Cita Asociada *</Label>
                  {appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-1 p-2 border border-dashed rounded">
                      No hay citas disponibles. Crea una cita primero.
                    </p>
                  ) : (
                    <Select 
                      value={sessionData.appointment_id} 
                      onValueChange={(value) => setSessionData({...sessionData, appointment_id: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona una cita" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id}>
                            {new Date(apt.appointment_date).toLocaleDateString()} - {new Date(apt.appointment_date).toLocaleTimeString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Descripción de la Sesión *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe lo realizado en esta sesión"
                    rows={4}
                    value={sessionData.description}
                    onChange={(e) => setSessionData({...sessionData, description: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting || appointments.length === 0}>
                  {submitting ? 'Creando...' : 'Crear Sesión'}
                </Button>
              </form>
            )}

            {procedure.sessions && procedure.sessions.length > 0 ? (
              <div className="space-y-3">
                {procedure.sessions.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full w-12 h-12 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-muted-foreground">Sesión</span>
                        <span className="text-lg font-bold text-primary">#{session.session_number}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {session.progress_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay sesiones registradas
              </p>
            )}
          </Card>

          {/* Pagos */}
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Historial de Pagos ({procedure.payments?.length || 0})</h2>
            {procedure.payments && procedure.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Método</th>
                      <th className="px-4 py-3 text-left">Monto</th>
                      <th className="px-4 py-3 text-left">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedure.payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3">
                          {new Date(payment.payment_date).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {payment.payment_method_name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600">
                          ${(typeof payment.amount === 'number' ? payment.amount : 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {payment.transaction_reference || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay pagos registrados
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
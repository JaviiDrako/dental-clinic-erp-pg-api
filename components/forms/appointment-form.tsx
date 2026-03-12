'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Patient {
  id: string;
  full_name: string;
}

interface Doctor {
  id: string;
  full_name: string;
}

export function AppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled',
    general_notes: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch('/api/patients?limit=1000'),
          fetch('/api/doctors')
        ]);
        
        const patientsData = await patientsRes.json();
        const doctorsData = await doctorsRes.json();
        
        if (patientsData.success) {
          setPatients(patientsData.data || []);
        }
        if (doctorsData.success) {
          setDoctors(doctorsData.data || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combinar fecha y hora
      const appointmentDateTime = formData.appointment_date && formData.appointment_time
        ? new Date(`${formData.appointment_date}T${formData.appointment_time}`).toISOString()
        : null;

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          appointment_date: appointmentDateTime
        }),
      });

      const result = await res.json();
      
      if (result.success) {
        // Redirigir según de dónde venga
        if (patientId) {
          router.push(`/patients/${patientId}`);
        } else {
          router.push('/appointments');
        }
      } else {
        console.error('Error creating appointment:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="patient_id">Paciente *</Label>
          <Select 
            value={formData.patient_id} 
            onValueChange={(value) => setFormData({...formData, patient_id: value})}
            disabled={!!patientId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doctor_id">Doctor *</Label>
          <Select 
            value={formData.doctor_id} 
            onValueChange={(value) => setFormData({...formData, doctor_id: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  Dr. {doctor.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="appointment_date">Fecha *</Label>
            <Input
              id="appointment_date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_time">Hora *</Label>
            <Input
              id="appointment_time"
              type="time"
              value={formData.appointment_time}
              onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({...formData, status: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Programada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="general_notes">Notas</Label>
          <Textarea
            id="general_notes"
            value={formData.general_notes}
            onChange={(e) => setFormData({...formData, general_notes: e.target.value})}
            placeholder="Notas generales de la cita"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cita'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (patientId) {
                router.push(`/patients/${patientId}`);
              } else {
                router.push('/appointments');
              }
            }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
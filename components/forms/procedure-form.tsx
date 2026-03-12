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

interface Treatment {
  id: string;
  name: string;
  base_price: number;
}

export function ProcedureForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    treatment_id: '',
    tooth_code: '',
    diagnosis: '',
    total_cost: '',
    status: 'planned' // planned, in_progress, completed, cancelled
  });

  useEffect(() => {
    // Cargar pacientes y tratamientos desde la API
    async function loadData() {
      try {
        const [patientsRes, treatmentsRes] = await Promise.all([
          fetch('/api/patients?limit=1000'),
          fetch('/api/treatments')
        ]);
        
        const patientsData = await patientsRes.json();
        const treatmentsData = await treatmentsRes.json();
        
        if (patientsData.success) {
          setPatients(patientsData.data || []);
        }
        if (treatmentsData.success) {
          setTreatments(treatmentsData.data || []);
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
      // Preparar datos para enviar
      const procedureData: any = {
        patient_id: formData.patient_id,
        treatment_id: formData.treatment_id,
        tooth_code: formData.tooth_code || null,
        diagnosis: formData.diagnosis || null,
        total_cost: parseFloat(formData.total_cost),
        status: formData.status,
        start_date: new Date().toISOString() // Siempon la fecha actual al crear
      };

      // Si el estado es 'completed', asignar fecha fin también
      if (formData.status === 'completed') {
        procedureData.end_date = new Date().toISOString();
      }

      const res = await fetch('/api/procedures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(procedureData),
      });

      const result = await res.json();
      
      if (result.success) {
        // Redirigir según de dónde venga
        if (patientId) {
          router.push(`/patients/${patientId}`);
        } else {
          router.push('/procedures');
        }
      } else {
        console.error('Error creating procedure:', result.error);
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
            disabled={!!patientId} // Si viene de paciente, deshabilitar
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
          <Label htmlFor="treatment_id">Tratamiento *</Label>
          <Select 
            value={formData.treatment_id} 
            onValueChange={(value) => {
              const treatment = treatments.find(t => t.id === value);
              setFormData({
                ...formData, 
                treatment_id: value,
                total_cost: treatment?.base_price?.toString() || ''
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tratamiento" />
            </SelectTrigger>
            <SelectContent>
              {treatments.map((treatment) => (
                <SelectItem key={treatment.id} value={treatment.id}>
                  {treatment.name} - ${treatment.base_price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tooth_code">Pieza Dental</Label>
          <Input
            id="tooth_code"
            value={formData.tooth_code}
            onChange={(e) => setFormData({...formData, tooth_code: e.target.value})}
            placeholder="Ej: 12, 24, 36"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnóstico</Label>
          <Textarea
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
            placeholder="Diagnóstico del procedimiento"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_cost">Costo Total *</Label>
          <Input
            id="total_cost"
            type="number"
            step="0.01"
            value={formData.total_cost}
            onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
            placeholder="0.00"
            required
          />
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
              <SelectItem value="planned">Planificado</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            * La fecha de inicio se asignará automáticamente al crear. Si el estado es "Completado", también se asignará la fecha de fin.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Procedimiento'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (patientId) {
                router.push(`/patients/${patientId}`);
              } else {
                router.push('/procedures');
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
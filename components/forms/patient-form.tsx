'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface City {
  id: string;
  name: string;
}

export function PatientForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    phone: '',
    address: '',
    city_id: '',
    birth_date: '',
    medical_history: ''
  });

  // Cargar ciudades
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await fetch('/api/cities');
        const result = await res.json();
        if (result.success) {
          setCities(result.data || []);
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    }
    loadCities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      
      if (result.success) {
        toast({
          title: 'Éxito',
          description: 'Paciente creado correctamente',
        });
        router.push('/patients');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el paciente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="national_id">Cédula de Identidad *</Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => setFormData({...formData, national_id: e.target.value})}
              placeholder="Ej: 1234567"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Ej: 77712345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city_id">Ciudad</Label>
            <Select 
              value={formData.city_id} 
              onValueChange={(value) => setFormData({...formData, city_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Ej: Calle Principal #123"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="medical_history">Antecedentes Médicos</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
              placeholder="Alergias, condiciones preexistentes, etc."
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Guardando...' : 'Guardar Paciente'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/patients')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
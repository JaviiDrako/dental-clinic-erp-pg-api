'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export function DoctorForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    birth_date: '',
    email: '',
    password: '',
    role: 'doctor',
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      
      if (result.success) {
        toast({
          title: 'Éxito',
          description: 'Doctor creado correctamente',
        });
        router.push('/doctors');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el doctor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre Completo *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            placeholder="Ej: Dr. Juan Pérez"
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
          <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-4">Datos de Usuario (opcional)</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="ejemplo@clinica.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="doctor">Doctor</option>
                <option value="admin">Administrador</option>
                <option value="receptionist">Recepcionista</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="active">Estado</Label>
            <p className="text-xs text-muted-foreground">
              Activar/desactivar doctor
            </p>
          </div>
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({...formData, active: checked})}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Guardando...' : 'Guardar Doctor'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/doctors')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export function TreatmentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          base_price: parseFloat(formData.base_price)
        }),
      });

      const result = await res.json();
      
      if (result.success) {
        toast({
          title: 'Éxito',
          description: 'Tratamiento creado correctamente',
        });
        router.push('/treatments');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating treatment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el tratamiento',
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
          <Label htmlFor="name">Nombre del Tratamiento *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ej: Limpieza Dental, Extracción, etc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descripción detallada del tratamiento"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_price">Precio Base *</Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_price}
            onChange={(e) => setFormData({...formData, base_price: e.target.value})}
            placeholder="0.00"
            required
          />
          <p className="text-xs text-muted-foreground">
            Este es el precio sugerido, puede variar según el procedimiento
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="active">Estado</Label>
            <p className="text-xs text-muted-foreground">
              Activar/desactivar tratamiento
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
            {loading ? 'Guardando...' : 'Guardar Tratamiento'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/treatments')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
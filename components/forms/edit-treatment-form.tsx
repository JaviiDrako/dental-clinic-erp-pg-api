'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Treatment {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  active: boolean;
}

interface EditTreatmentFormProps {
  treatment: Treatment;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTreatmentForm({ treatment, open, onClose, onSuccess }: EditTreatmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: treatment.name,
    description: treatment.description || '',
    base_price: treatment.base_price.toString(),
    active: treatment.active
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/treatments/${treatment.id}`, {
        method: 'PUT',
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
          description: 'Tratamiento actualizado correctamente',
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating treatment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tratamiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Tratamiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Tratamiento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Limpieza Dental"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descripción detallada"
              rows={3}
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
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Activo</Label>
              <p className="text-xs text-muted-foreground">
                El tratamiento estará disponible para usar
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({...formData, active: checked})}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/layout/sidebar';
import { Input } from '@/components/ui/input';
import { Plus, Search, X } from 'lucide-react';
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
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  // Función para cargar doctores
  async function loadDoctors() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(search && { search })
      });

      const res = await fetch(`/api/doctors?${params}`);
      const result = await res.json();

      if (result.success) {
        setDoctors(result.data || []);
        setTotalItems(result.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los doctores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }

  // useEffect con debounce para la búsqueda
  useEffect(() => {
    if (initialLoad) {
      loadDoctors();
    } else {
      const timer = setTimeout(() => {
        loadDoctors();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentPage, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Doctores</h1>
            <Link href="/doctors/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Doctor
              </Button>
            </Link>
          </div>

          {/* Barra de búsqueda */}
          <Card className="mb-6 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 pr-8"
              />
              {search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>

          {/* Tabla de Doctores */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando doctores...</p>
            </div>
          ) : doctors.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              {search 
                ? 'No se encontraron doctores con esa búsqueda' 
                : 'No hay doctores registrados'}
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Cédula</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Fecha Nacimiento</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="border-b hover:bg-muted/50 transition">
                        <td className="px-6 py-3 font-medium">{doctor.full_name}</td>
                        <td className="px-6 py-3">{doctor.national_id}</td>
                        <td className="px-6 py-3">{formatDate(doctor.birth_date)}</td>
                        <td className="px-6 py-3">{doctor.email || '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doctor.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {doctor.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/doctors/${doctor.id}`}>
                            <Button variant="outline" size="sm">Ver Detalle</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="border-t px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de{' '}
                      {totalItems} registros
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="px-4 py-2 text-sm">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
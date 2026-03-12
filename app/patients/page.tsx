'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/layout/sidebar';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowUpDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  full_name: string;
  national_id?: string;
  phone?: string;
  city_name?: string;
  birth_date?: string;
  created_at?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSort, setShowSort] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  async function loadPatients() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort: sortOrder,
        ...(search && { search })
      });

      const res = await fetch(`/api/patients?${params}`);
      const result = await res.json();

      if (result.success) {
        setPatients(result.data || []);
        setTotalItems(result.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pacientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }

  // useEffect con debounce
  useEffect(() => {
    if (initialLoad) {
      loadPatients();
    } else {
      const timer = setTimeout(() => {
        loadPatients();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentPage, search, sortOrder]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
            <h1 className="text-3xl font-bold">Pacientes</h1>
            <Link href="/patients/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Paciente
              </Button>
            </Link>
          </div>

          {/* Barra de búsqueda */}
          <Card className="mb-6 p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, CI o teléfono..."
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

              {/* Ordenamiento */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSort(!showSort)}
                  className={`p-2 hover:bg-muted rounded-md transition ${showSort ? 'bg-muted' : ''}`}
                  title="Ordenar"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                {showSort && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortOrder}
                  >
                    {sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Tabla de Pacientes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando pacientes...</p>
            </div>
          ) : patients.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              {search 
                ? 'No se encontraron pacientes con esa búsqueda' 
                : 'No hay pacientes registrados'}
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">CI</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Teléfono</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Ciudad</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Fecha Nacimiento</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} className="border-b hover:bg-muted/50 transition">
                        <td className="px-6 py-3 font-medium">
                          <Link href={`/patients/${patient.id}`} className="hover:underline">
                            {patient.full_name}
                          </Link>
                        </td>
                        <td className="px-6 py-3">{patient.national_id || '-'}</td>
                        <td className="px-6 py-3">{patient.phone || '-'}</td>
                        <td className="px-6 py-3">{patient.city_name || '-'}</td>
                        <td className="px-6 py-3">{formatDate(patient.birth_date)}</td>
                        <td className="px-6 py-3">
                          <Link href={`/patients/${patient.id}`}>
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
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/layout/sidebar';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcedureWithDetails {
  id: string;
  patient_id: string;
  patient_name: string;
  treatment_id: string;
  treatment_name: string;
  status: string;
  diagnosis?: string;
  tooth_code?: string;
  created_at?: string;
}

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<ProcedureWithDetails[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [treatments, setTreatments] = useState<{ id: string; name: string }[]>([]);
  
  // Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterTreatment, setFilterTreatment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  // Cargar tratamientos para el filtro
  useEffect(() => {
    async function loadTreatments() {
      try {
        const res = await fetch('/api/treatments');
        const result = await res.json();
        if (result.success) {
          setTreatments(result.data || []);
        }
      } catch (error) {
        console.error('Error loading treatments:', error);
      }
    }
    loadTreatments();
  }, []);

  // Función para cargar procedimientos
  async function loadProcedures() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort: sortOrder,
        ...(search && { search }),
        ...(filterTreatment && { treatmentId: filterTreatment }),
        ...(filterStatus && { status: filterStatus })
      });

      const res = await fetch(`/api/procedures?${params}`);
      const result = await res.json();

      if (result.success) {
        setProcedures(result.data || []);
        setTotalItems(result.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading procedures:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los procedimientos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }

  // useEffect con debounce para todos los filtros
  useEffect(() => {
    if (initialLoad) {
      loadProcedures();
    } else {
      const timer = setTimeout(() => {
        loadProcedures();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    currentPage,
    search,
    filterTreatment,
    filterStatus,
    sortOrder
  ]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planificado';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Procedimientos</h1>
          </div>

          {/* Barra de búsqueda y filtros */}
          <Card className="mb-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente o tratamiento..."
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
                <button
                  onClick={() => setShowSort(!showSort)}
                  className={`p-2 hover:bg-muted rounded-md transition ${showSort ? 'bg-muted' : ''}`}
                  title="Ordenar"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 hover:bg-muted rounded-md transition ${showFilters ? 'bg-muted' : ''}`}
                  title="Filtros"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Ordenamiento */}
              {showSort && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Ordenar por fecha:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortOrder}
                  >
                    {sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
                  </Button>
                </div>
              )}

              {/* Filtros expandibles */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium block mb-2">Filtrar por Tratamiento</label>
                    <div className="flex gap-2">
                      <select
                        value={filterTreatment}
                        onChange={(e) => {
                          setFilterTreatment(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Todos los tratamientos</option>
                        {treatments.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      {filterTreatment && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilterTreatment('');
                            setCurrentPage(1);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Filtrar por Estado</label>
                    <div className="flex gap-2">
                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Todos los estados</option>
                        <option value="planned">Planificado</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                      {filterStatus && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilterStatus('');
                            setCurrentPage(1);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabla de Procedimientos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando procedimientos...</p>
            </div>
          ) : procedures.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              {search || filterTreatment || filterStatus 
                ? 'No se encontraron procedimientos con esos filtros' 
                : 'No hay procedimientos registrados'}
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Paciente</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Tratamiento</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Pieza Dental</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedures.map((proc) => (
                      <tr key={proc.id} className="border-b hover:bg-muted/50 transition">
                        <td className="px-6 py-3">
                          <Link href={`/patients/${proc.patient_id}`} className="hover:underline font-medium">
                            {proc.patient_name}
                          </Link>
                        </td>
                        <td className="px-6 py-3">{proc.treatment_name}</td>
                        <td className="px-6 py-3">{proc.tooth_code || '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proc.status)}`}>
                            {getStatusText(proc.status)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/procedures/${proc.id}`}>
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
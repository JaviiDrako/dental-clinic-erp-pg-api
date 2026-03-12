'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/layout/sidebar';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  appointment_date: string;
  status: string;
  general_notes?: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  // Función para cargar citas
  async function loadAppointments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort: sortOrder,
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus })
      });

      const res = await fetch(`/api/appointments?${params}`);
      const result = await res.json();

      if (result.success) {
        setAppointments(result.data || []);
        setTotalItems(result.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
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
      loadAppointments();
    } else {
      const timer = setTimeout(() => {
        loadAppointments();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    currentPage,
    search,
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
      case 'scheduled':
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
      case 'scheduled':
        return 'Programada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Citas</h1>
            {/* Botón de Nueva Cita eliminado - solo se crea desde el perfil del paciente */}
          </div>

          {/* Barra de búsqueda y filtros */}
          <Card className="mb-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente o doctor..."
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
                <div className="pt-4 border-t">
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
                      <option value="scheduled">Programada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
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
              )}
            </div>
          </Card>

          {/* Tabla de Citas */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando citas...</p>
            </div>
          ) : appointments.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              {search || filterStatus 
                ? 'No se encontraron citas con esos filtros' 
                : 'No hay citas registradas'}
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Paciente</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Doctor</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Fecha y Hora</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b hover:bg-muted/50 transition">
                        <td className="px-6 py-3">
                          <Link href={`/patients/${appointment.patient_id}`} className="hover:underline font-medium">
                            {appointment.patient_name || 'Sin asignar'}
                          </Link>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/doctors/${appointment.doctor_id}`} className="hover:underline">
                            Dr. {appointment.doctor_name || 'Sin asignar'}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {formatDate(appointment.appointment_date)}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/appointments/${appointment.id}`}>
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
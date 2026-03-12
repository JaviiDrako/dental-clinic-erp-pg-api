'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentRecord {
  id: string;
  patient_name: string;
  patient_id: string;
  procedure_id: string;
  treatment_name: string;
  amount: number;
  payment_method_id: string;
  payment_method_name: string;
  payment_date: string;
  transaction_reference?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; name: string }[]>([]);
  
  // Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterPaymentDate, setFilterPaymentDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  
  // Filtros de período para total recaudado
  const [revenuePeriod, setRevenuePeriod] = useState<'all' | 'daily' | 'monthly' | 'yearly'>('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  // Función para formatear fecha para mostrar (DD/MM/YYYY)
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    
    // Si es una fecha en formato YYYY-MM-DD (del input)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Si es una fecha ISO de la base de datos
    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // Cargar métodos de pago al inicio
  useEffect(() => {
    async function loadPaymentMethods() {
      try {
        const res = await fetch('/api/payment-methods');
        const result = await res.json();
        if (result.success) {
          setPaymentMethods(result.data || []);
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
      }
    }
    loadPaymentMethods();
  }, []);

  // Función para cargar pagos
  async function loadPayments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort: sortOrder,
        ...(search && { search }),
        ...(filterPaymentMethod && { method: filterPaymentMethod }),
        ...(filterPaymentDate && { date: filterPaymentDate }),
        ...(revenuePeriod !== 'all' && { period: revenuePeriod }),
        ...(revenuePeriod === 'daily' && selectedDate && { periodDate: selectedDate }),
        ...(revenuePeriod === 'monthly' && selectedMonth && { periodDate: selectedMonth }),
        ...(revenuePeriod === 'yearly' && selectedYear && { periodDate: selectedYear })
      });

      const res = await fetch(`/api/payments?${params}`);
      const result = await res.json();

      if (result.success) {
        setPayments(result.data || []);
        setTotalItems(result.pagination?.totalItems || 0);
        setTotalRevenue(result.totalRevenue || 0);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pagos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }

  // UN SOLO useEffect con debounce para TODOS los filtros
  useEffect(() => {
    // Evitar carga inicial duplicada
    if (initialLoad) {
      loadPayments();
    } else {
      const timer = setTimeout(() => {
        loadPayments();
      }, 300); // Mismo delay que en pacientes

      return () => clearTimeout(timer);
    }
  }, [
    currentPage,
    search,
    filterPaymentMethod,
    filterPaymentDate,
    sortOrder,
    revenuePeriod,
    selectedDate,
    selectedMonth,
    selectedYear
  ]);

  // Manejador de búsqueda con timeout
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('COP', '$');
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">Pagos</h1>

          {/* Filtros principales */}
          <Card className="mb-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente, tratamiento o referencia..."
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
                    <label className="text-sm font-medium block mb-2">Método de Pago</label>
                    <div className="flex gap-2">
                      <select
                        value={filterPaymentMethod}
                        onChange={(e) => {
                          setFilterPaymentMethod(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Todos los métodos</option>
                        {paymentMethods.map(method => (
                          <option key={method.id} value={method.id}>{method.name}</option>
                        ))}
                      </select>
                      {filterPaymentMethod && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilterPaymentMethod('');
                            setCurrentPage(1);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Fecha específica</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={filterPaymentDate}
                        onChange={(e) => {
                          setFilterPaymentDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="flex-1"
                      />
                      {filterPaymentDate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilterPaymentDate('');
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando...</p>
            </div>
          ) : payments.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              <p className="mb-4">No hay pagos registrados</p>
              <p className="text-sm">Los pagos se registran desde la página de detalle de cada procedimiento.</p>
            </Card>
          ) : (
            <>
              {/* Card de Total Recaudado */}
              <Card className="p-6 mb-6 bg-primary/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Recaudado</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(totalRevenue)}
                    </p>
                    {revenuePeriod !== 'all' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {revenuePeriod === 'daily' && selectedDate && `Día: ${formatDisplayDate(selectedDate)}`}
                        {revenuePeriod === 'monthly' && selectedMonth && `Mes: ${selectedMonth}`}
                        {revenuePeriod === 'yearly' && `Año: ${selectedYear}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <select
                      value={revenuePeriod}
                      onChange={(e) => {
                        setRevenuePeriod(e.target.value as any);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="all">Total General</option>
                      <option value="daily">Por Día</option>
                      <option value="monthly">Por Mes</option>
                      <option value="yearly">Por Año</option>
                    </select>
                    {revenuePeriod === 'daily' && (
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="text-sm"
                      />
                    )}
                    {revenuePeriod === 'monthly' && (
                      <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="text-sm"
                      />
                    )}
                    {revenuePeriod === 'yearly' && (
                      <Input
                        type="number"
                        min="2000"
                        max={new Date().getFullYear()}
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
              </Card>

              {/* Tabla de pagos */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Paciente</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Tratamiento</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Monto</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Método</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Referencia</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-muted/50 transition">
                          <td className="px-6 py-3">
                            <Link href={`/patients/${payment.patient_id}`} className="hover:underline font-medium">
                              {payment.patient_name}
                            </Link>
                          </td>
                          <td className="px-6 py-3">
                            <Link href={`/procedures/${payment.procedure_id}`} className="hover:underline">
                              {payment.treatment_name}
                            </Link>
                          </td>
                          <td className="px-6 py-3 font-semibold text-green-600">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-xs px-2 py-1 bg-muted rounded-full">
                              {payment.payment_method_name}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {formatDisplayDate(payment.payment_date)}
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            {payment.transaction_reference || '-'}
                          </td>
                          <td className="px-6 py-3">
                            <Link href={`/procedures/${payment.procedure_id}`}>
                              <Button variant="outline" size="sm">
                                Ver Procedimiento
                              </Button>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
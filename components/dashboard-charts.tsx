'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Componente para gráfica de Citas por Doctor
function DoctorChart() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState<'all' | 'daily' | 'monthly' | 'yearly'>('all');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period, date, month, year]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ chart: 'doctor', period });
      if (period === 'daily' && date) params.append('date', date);
      if (period === 'monthly' && month) params.append('month', month);
      if (period === 'yearly' && year) params.append('year', year);

      const res = await fetch(`/api/stats?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('Error loading doctor chart:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Citas por Doctor</h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="all">Todo</option>
            <option value="daily">Día</option>
            <option value="monthly">Mes</option>
            <option value="yearly">Año</option>
          </select>
          {period === 'daily' && (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm h-8 w-auto" />
          )}
          {period === 'monthly' && (
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm h-8 w-auto" />
          )}
          {period === 'yearly' && (
            <Input type="number" min="2000" max={new Date().getFullYear()} value={year} onChange={(e) => setYear(e.target.value)} className="text-sm h-8 w-20" />
          )}
        </div>
      </div>
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">Cargando...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sin datos</div>
      )}
    </Card>
  );
}

// Componente para gráfica de Estados de Citas
function StatusChart() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState<'all' | 'daily' | 'monthly' | 'yearly'>('all');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period, date, month, year]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ chart: 'status', period });
      if (period === 'daily' && date) params.append('date', date);
      if (period === 'monthly' && month) params.append('month', month);
      if (period === 'yearly' && year) params.append('year', year);

      const res = await fetch(`/api/stats?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('Error loading status chart:', error);
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Estado de Citas</h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="all">Todo</option>
            <option value="daily">Día</option>
            <option value="monthly">Mes</option>
            <option value="yearly">Año</option>
          </select>
          {period === 'daily' && (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm h-8 w-auto" />
          )}
          {period === 'monthly' && (
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm h-8 w-auto" />
          )}
          {period === 'yearly' && (
            <Input type="number" min="2000" max={new Date().getFullYear()} value={year} onChange={(e) => setYear(e.target.value)} className="text-sm h-8 w-20" />
          )}
        </div>
      </div>
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">Cargando...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
              {data.map((entry: any, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sin datos</div>
      )}
    </Card>
  );
}

// Componente para gráfica de Ingresos
function RevenueChart() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState<'all' | 'daily' | 'monthly' | 'yearly'>('all');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period, date, month, year]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ chart: 'revenue', period });
      if (period === 'daily' && date) params.append('date', date);
      if (period === 'monthly' && month) params.append('month', month);
      if (period === 'yearly' && year) params.append('year', year);

      const res = await fetch(`/api/stats?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('Error loading revenue chart:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value).replace('COP', '$');
  };

  return (
    <Card className="p-6 lg:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ingresos</h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="all">Todo</option>
            <option value="daily">Día</option>
            <option value="monthly">Mes</option>
            <option value="yearly">Año</option>
          </select>
          {period === 'daily' && (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm h-8 w-auto" />
          )}
          {period === 'monthly' && (
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm h-8 w-auto" />
          )}
          {period === 'yearly' && (
            <Input type="number" min="2000" max={new Date().getFullYear()} value={year} onChange={(e) => setYear(e.target.value)} className="text-sm h-8 w-20" />
          )}
        </div>
      </div>
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">Cargando...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sin datos</div>
      )}
    </Card>
  );
}

// Componente principal que exportamos
export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DoctorChart />
      <StatusChart />
      <RevenueChart />
    </div>
  );
}
import { NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/pg';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Verificar si es una petición de gráfica individual
    const chart = searchParams.get('chart'); // 'doctor', 'status', 'revenue'
    const period = searchParams.get('period') || 'all';
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Si es una petición de gráfica individual, devolver solo esos datos
    if (chart === 'doctor') {
      return await getDoctorChartData(period, date, month, year);
    }
    
    if (chart === 'status') {
      return await getStatusChartData(period, date, month, year);
    }
    
    if (chart === 'revenue') {
      return await getRevenueChartData(period, date, month, year);
    }

    // Si no hay chart específico, devolver todos los datos (para carga inicial)
    return await getAllStats();
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

// Función para obtener datos de la gráfica de doctores
async function getDoctorChartData(period: string, date: string | null, month: string | null, year: string | null) {
  let whereClause = '';
  const params: any[] = [];

  if (period !== 'all') {
    if (period === 'daily' && date) {
      whereClause = 'AND DATE(a.appointment_date) = $1';
      params.push(date);
    } else if (period === 'monthly' && month) {
      whereClause = "AND DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', $1::date)";
      params.push(month + '-01');
    } else if (period === 'yearly' && year) {
      whereClause = 'AND EXTRACT(YEAR FROM a.appointment_date) = $1';
      params.push(parseInt(year));
    }
  }

  const data = await queryAll(
    `SELECT 
      d.full_name as name,
      COUNT(a.id) as count
    FROM doctors d
    LEFT JOIN appointments a ON d.id = a.doctor_id ${whereClause}
    WHERE d.active = true
    GROUP BY d.id, d.full_name
    ORDER BY count DESC`,
    params
  );

  return NextResponse.json({
    success: true,
    data: data.map(d => ({
      name: d.name || 'Sin asignar',
      count: parseInt(d.count)
    }))
  });
}

// Función para obtener datos de la gráfica de estados
async function getStatusChartData(period: string, date: string | null, month: string | null, year: string | null) {
  let whereClause = '';
  const params: any[] = [];

  if (period !== 'all') {
    if (period === 'daily' && date) {
      whereClause = 'WHERE DATE(appointment_date) = $1';
      params.push(date);
    } else if (period === 'monthly' && month) {
      whereClause = "WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', $1::date)";
      params.push(month + '-01');
    } else if (period === 'yearly' && year) {
      whereClause = 'WHERE EXTRACT(YEAR FROM appointment_date) = $1';
      params.push(parseInt(year));
    }
  }

  const data = await queryAll(
    `SELECT 
      status,
      COUNT(*) as count
    FROM appointments
    ${whereClause}
    GROUP BY status`,
    params
  );

  const statusMap: { [key: string]: { name: string; color: string } } = {
    scheduled: { name: 'Programada', color: '#3b82f6' },
    completed: { name: 'Completada', color: '#10b981' },
    cancelled: { name: 'Cancelada', color: '#ef4444' }
  };

  return NextResponse.json({
    success: true,
    data: data.map(s => ({
      name: statusMap[s.status]?.name || s.status,
      value: parseInt(s.count),
      color: statusMap[s.status]?.color || '#f59e0b'
    }))
  });
}

// Función para obtener datos de la gráfica de ingresos
async function getRevenueChartData(period: string, date: string | null, month: string | null, year: string | null) {
  let whereClause = '';
  const params: any[] = [];
  let groupBy: string;
  let select: string;
  let orderBy: string;

  if (period === 'daily' && date) {
    whereClause = 'AND DATE(payment_date) = $1';
    params.push(date);
    groupBy = "DATE_TRUNC('hour', payment_date)";
    select = "TO_CHAR(DATE_TRUNC('hour', payment_date), 'HH24:00') as month";
    orderBy = "hour ASC";
  } else if (period === 'monthly' && month) {
    whereClause = "AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', $1::date)";
    params.push(month + '-01');
    groupBy = "DATE(payment_date)";
    select = "TO_CHAR(DATE(payment_date), 'DD/MM') as month";
    orderBy = "day ASC";
  } else if (period === 'yearly' && year) {
    whereClause = 'AND EXTRACT(YEAR FROM payment_date) = $1';
    params.push(parseInt(year));
    groupBy = "DATE_TRUNC('month', payment_date)";
    select = "TO_CHAR(DATE_TRUNC('month', payment_date), 'MM/YYYY') as month";
    orderBy = "month ASC";
  } else {
    // Por defecto, últimos 6 meses
    whereClause = 'AND payment_date >= NOW() - INTERVAL \'6 months\'';
    groupBy = "DATE_TRUNC('month', payment_date)";
    select = "TO_CHAR(DATE_TRUNC('month', payment_date), 'MM/YYYY') as month";
    orderBy = "month ASC";
  }

  const data = await queryAll(
    `SELECT 
      ${select},
      COALESCE(SUM(amount), 0) as revenue
    FROM payments
    WHERE 1=1 ${whereClause}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy}`,
    params
  );

  return NextResponse.json({
    success: true,
    data: data.map(m => ({
      month: m.month,
      revenue: parseFloat(m.revenue)
    }))
  });
}

// Función para obtener todos los datos (carga inicial del dashboard)
async function getAllStats() {
  // Total de pacientes
  const totalPatients = await queryOne('SELECT COUNT(*) as count FROM patients');
  
  // Total de doctores activos
  const totalDoctors = await queryOne('SELECT COUNT(*) as count FROM doctors WHERE active = true');
  
  // Citas programadas
  const scheduledAppointments = await queryOne(
    "SELECT COUNT(*) as count FROM appointments WHERE status = 'scheduled'"
  );

  // Ingresos totales
  const totalRevenue = await queryOne('SELECT COALESCE(SUM(amount), 0) as total FROM payments');

  // Próximas 5 citas
  const upcomingAppointments = await queryAll(`
    SELECT 
      a.id,
      a.appointment_date,
      a.status,
      p.id as patient_id,
      p.full_name as patient_name,
      d.id as doctor_id,
      d.full_name as doctor_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.status = 'scheduled' AND a.appointment_date >= NOW()
    ORDER BY a.appointment_date ASC
    LIMIT 5
  `);

  // Datos para gráfica de doctores (últimos 6 meses por defecto)
  const appointmentsByDoctor = await queryAll(`
    SELECT 
      d.full_name as doctor_name,
      COUNT(a.id) as count
    FROM doctors d
    LEFT JOIN appointments a ON d.id = a.doctor_id 
      AND a.appointment_date >= NOW() - INTERVAL '6 months'
    WHERE d.active = true
    GROUP BY d.id, d.full_name
    ORDER BY count DESC
  `);

  // Datos para gráfica de estados (últimos 6 meses por defecto)
  const appointmentStatus = await queryAll(`
    SELECT 
      status,
      COUNT(*) as count
    FROM appointments
    WHERE appointment_date >= NOW() - INTERVAL '6 months'
    GROUP BY status
  `);

  // Datos para gráfica de ingresos (últimos 6 meses por defecto)
  const monthlyRevenue = await queryAll(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', payment_date), 'MM/YYYY') as month,
      COALESCE(SUM(amount), 0) as revenue
    FROM payments
    WHERE payment_date >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', payment_date)
    ORDER BY month ASC
  `);

  const statusMap: { [key: string]: { name: string; color: string } } = {
    scheduled: { name: 'Programada', color: '#3b82f6' },
    completed: { name: 'Completada', color: '#10b981' },
    cancelled: { name: 'Cancelada', color: '#ef4444' }
  };

  return NextResponse.json({
    success: true,
    data: {
      totals: {
        patients: parseInt(totalPatients?.count || '0'),
        doctors: parseInt(totalDoctors?.count || '0'),
        scheduledAppointments: parseInt(scheduledAppointments?.count || '0'),
        revenue: parseFloat(totalRevenue?.total || '0')
      },
      appointmentsByDoctor: appointmentsByDoctor.map(d => ({
        name: d.doctor_name || 'Sin asignar',
        count: parseInt(d.count)
      })),
      appointmentStatus: appointmentStatus.map(s => ({
        name: statusMap[s.status]?.name || s.status,
        value: parseInt(s.count),
        color: statusMap[s.status]?.color || '#f59e0b'
      })),
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: m.month,
        revenue: parseFloat(m.revenue)
      })),
      upcomingAppointments
    }
  });
}
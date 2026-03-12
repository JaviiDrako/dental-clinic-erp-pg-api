import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/pg';

const ITEMS_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        LOWER(p.full_name) LIKE LOWER($${paramCount}) OR 
        LOWER(d.full_name) LIKE LOWER($${paramCount})
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      conditions.push(`a.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ') 
      : '';

    // Obtener citas con filtros
    const appointments = await queryAll(
      `SELECT 
        a.*,
        p.id as patient_id,
        p.full_name as patient_name,
        p.national_id as patient_national_id,
        d.id as doctor_id,
        d.full_name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       ${whereClause}
       ORDER BY a.appointment_date ${sort === 'asc' ? 'ASC' : 'DESC'}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, ITEMS_PER_PAGE, offset]
    );

    // Obtener total para paginación
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ${whereClause}
    `;
    
    const countResult = await queryOne(countQuery, params);
    const total = parseInt(countResult?.total || '0');

    console.log('[v0] Appointments API - Total:', total, 'Items:', appointments.length);

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit: ITEMS_PER_PAGE,
        totalItems: total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        hasNextPage: page < Math.ceil(total / ITEMS_PER_PAGE),
        hasPrevPage: page > 1
      },
    });
  } catch (error) {
    console.error('[v0] Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching appointments', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const appointment = await queryOne(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, general_notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        body.patient_id,
        body.doctor_id,
        body.appointment_date,
        body.status || 'scheduled',
        body.general_notes
      ]
    );

    return NextResponse.json(
      { success: true, data: appointment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Error creating appointment' },
      { status: 500 }
    );
  }
}
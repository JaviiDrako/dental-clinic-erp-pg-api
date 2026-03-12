import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/pg';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;
    const sort = searchParams.get('sort') || 'desc';
    
    // Obtener parámetros de filtro
    const search = searchParams.get('search') || '';
    const treatmentId = searchParams.get('treatmentId') || '';
    const status = searchParams.get('status') || '';

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        LOWER(patients.full_name) LIKE LOWER($${paramCount}) OR 
        LOWER(treatments.name) LIKE LOWER($${paramCount})
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (treatmentId) {
      conditions.push(`p.treatment_id = $${paramCount}`);
      params.push(treatmentId);
      paramCount++;
    }

    if (status) {
      conditions.push(`p.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ') 
      : '';

    // Consulta con filtros
    const procedures = await queryAll(`
      SELECT 
        p.*,
        patients.id as patient_id,
        patients.full_name as patient_name,
        patients.national_id as patient_national_id,
        treatments.id as treatment_id,
        treatments.name as treatment_name,
        treatments.description as treatment_description,
        treatments.base_price,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', ps.id,
              'appointment_id', ps.appointment_id,
              'session_number', ps.session_number,
              'progress_notes', ps.progress_notes,
              'appointment_date', a.appointment_date,
              'appointment_status', a.status
            )
          ), '[]'::json)
          FROM procedure_sessions ps
          LEFT JOIN appointments a ON ps.appointment_id = a.id
          WHERE ps.procedure_id = p.id
        ) as sessions,
        (
          SELECT COALESCE(SUM(amount), 0)
          FROM payments
          WHERE procedure_id = p.id
        ) as total_paid
      FROM procedures p
      LEFT JOIN patients ON p.patient_id = patients.id
      LEFT JOIN treatments ON p.treatment_id = treatments.id
      ${whereClause}
      ORDER BY p.created_at ${sort === 'desc' ? 'DESC' : 'ASC'}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...params, limit, offset]);
    
    // Obtener total para paginación con los mismos filtros
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM procedures p
      LEFT JOIN patients ON p.patient_id = patients.id
      LEFT JOIN treatments ON p.treatment_id = treatments.id
      ${whereClause}
    `;
    
    const countResult = await queryOne(countQuery, params);
    const total = parseInt(countResult?.total || '0');
    
    return NextResponse.json({
      success: true,
      data: procedures,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Procedures API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch procedures' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patient_id, 
      treatment_id, 
      tooth_code, 
      diagnosis, 
      total_cost, 
      status,
      start_date,
      end_date 
    } = body;
    
    const procedure = await queryOne(`
      INSERT INTO procedures (
        patient_id, treatment_id, tooth_code, diagnosis, 
        total_cost, status, start_date, end_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [patient_id, treatment_id, tooth_code, diagnosis, total_cost, status, start_date, end_date]);
    
    return NextResponse.json({ success: true, data: procedure });
  } catch (error) {
    console.error('Error creating procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create procedure' },
      { status: 500 }
    );
  }
}
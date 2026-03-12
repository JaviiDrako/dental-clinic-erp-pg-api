import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/pg';
import { hashPassword } from '@/lib/auth'; // Importar la función de hash

const ITEMS_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        LOWER(d.full_name) LIKE LOWER($${paramCount}) OR 
        d.national_id LIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ') 
      : '';

    // Obtener doctores con filtros
    const doctors = await queryAll(
      `SELECT 
        d.*,
        u.email,
        u.role,
        u.active as user_active
       FROM doctors d
       LEFT JOIN users u ON d.id = u.doctor_id
       ${whereClause}
       ORDER BY d.full_name ASC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, ITEMS_PER_PAGE, offset]
    );

    // Obtener total para paginación
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM doctors d
      ${whereClause}
    `;
    
    const countResult = await queryOne(countQuery, params);
    const total = parseInt(countResult?.total || '0');

    return NextResponse.json({ 
      success: true, 
      data: doctors,
      pagination: {
        page,
        limit: ITEMS_PER_PAGE,
        totalItems: total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        hasNextPage: page < Math.ceil(total / ITEMS_PER_PAGE),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, national_id, birth_date, email, password, role, active } = body;
    
    // Insertar en doctors
    const doctor = await queryOne(`
      INSERT INTO doctors (full_name, national_id, birth_date, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [full_name, national_id, birth_date, active !== undefined ? active : true]);
    
    // Si se proporcionó email, crear usuario
    if (email && password) {
      // Hashear la contraseña antes de guardar
      const hashedPassword = await hashPassword(password);
      
      await queryOne(`
        INSERT INTO users (email, password_hash, role, doctor_id, active)
        VALUES ($1, $2, $3, $4, $5)
      `, [email, hashedPassword, role || 'doctor', doctor.id, active !== undefined ? active : true]);
    }
    
    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create doctor' },
      { status: 500 }
    );
  }
}
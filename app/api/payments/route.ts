import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/pg';

const ITEMS_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'desc';
    const search = searchParams.get('search') || '';
    const method = searchParams.get('method') || '';
    const date = searchParams.get('date') || '';
    const period = searchParams.get('period') || 'all';
    const periodDate = searchParams.get('periodDate') || '';
    
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        LOWER(p.full_name) LIKE LOWER($${paramCount}) OR 
        LOWER(t.name) LIKE LOWER($${paramCount}) OR 
        LOWER(pay.transaction_reference) LIKE LOWER($${paramCount})
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (method) {
      conditions.push(`pay.payment_method_id = $${paramCount}`);
      params.push(method);
      paramCount++;
    }

    if (date) {
      // Asegurar que la fecha se compare correctamente sin problemas de zona horaria
      conditions.push(`DATE(pay.payment_date) = DATE($${paramCount}::date)`);
      params.push(date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ') 
      : '';

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM payments pay
      LEFT JOIN procedures proc ON pay.procedure_id = proc.id
      LEFT JOIN patients p ON proc.patient_id = p.id
      LEFT JOIN treatments t ON proc.treatment_id = t.id
      ${whereClause}
    `;
    
    const countResult = await queryOne(countQuery, params);
    const totalItems = parseInt(countResult?.count || '0');

    // Obtener pagos paginados
    const payments = await queryAll(
      `SELECT 
        pay.id,
        p.id as patient_id,
        p.full_name as patient_name,
        proc.id as procedure_id,
        t.name as treatment_name,
        pay.amount,
        pay.payment_method_id,
        pm.name as payment_method_name,
        pay.payment_date,
        pay.transaction_reference,
        pay.created_at
       FROM payments pay
       LEFT JOIN procedures proc ON pay.procedure_id = proc.id
       LEFT JOIN patients p ON proc.patient_id = p.id
       LEFT JOIN treatments t ON proc.treatment_id = t.id
       LEFT JOIN payment_methods pm ON pay.payment_method_id = pm.id
       ${whereClause}
       ORDER BY pay.payment_date ${sort === 'asc' ? 'ASC' : 'DESC'}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, ITEMS_PER_PAGE, offset]
    );

    // Calcular total recaudado según el período
    let totalRevenue = 0;
    
    if (period !== 'all' && periodDate) {
      let revenueConditions = [...conditions];
      const revenueParams = [...params];
      let revenueParamCount = paramCount;

      if (period === 'daily') {
        revenueConditions.push(`DATE(pay.payment_date) = DATE($${revenueParamCount})`);
        revenueParams.push(periodDate);
      } else if (period === 'monthly') {
        revenueConditions.push(`DATE_TRUNC('month', pay.payment_date) = DATE_TRUNC('month', $${revenueParamCount}::date)`);
        revenueParams.push(periodDate + '-01');
      } else if (period === 'yearly') {
        revenueConditions.push(`EXTRACT(YEAR FROM pay.payment_date) = $${revenueParamCount}`);
        revenueParams.push(parseInt(periodDate));
      }

      const revenueWhere = revenueConditions.length > 0 
        ? 'WHERE ' + revenueConditions.join(' AND ') 
        : '';

      const revenueResult = await queryOne(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM payments pay
         LEFT JOIN procedures proc ON pay.procedure_id = proc.id
         LEFT JOIN patients p ON proc.patient_id = p.id
         ${revenueWhere}`,
        revenueParams
      );
      
      totalRevenue = parseFloat(revenueResult?.total || '0');
    } else {
      // Total general (todos los pagos)
      const totalResult = await queryOne(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payments`
      );
      totalRevenue = parseFloat(totalResult?.total || '0');
    }

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit: ITEMS_PER_PAGE,
        totalItems,
        totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE),
        hasNextPage: page < Math.ceil(totalItems / ITEMS_PER_PAGE),
        hasPrevPage: page > 1
      },
      totalRevenue
    });

  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
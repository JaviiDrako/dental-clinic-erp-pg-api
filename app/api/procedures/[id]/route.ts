import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Obtener procedimiento con detalles del tratamiento
    const procedure = await queryOne(
      `SELECT 
        p.*,
        t.name as treatment_name,
        t.description as treatment_description,
        t.base_price,
        pat.id as patient_id,
        pat.full_name as patient_name
       FROM procedures p
       LEFT JOIN treatments t ON p.treatment_id = t.id
       LEFT JOIN patients pat ON p.patient_id = pat.id
       WHERE p.id = $1`,
      [id]
    );

    if (!procedure) {
      return NextResponse.json(
        { success: false, error: 'Procedure not found' },
        { status: 404 }
      );
    }

    // Obtener sesiones
    const sessions = await queryAll(
      `SELECT 
        ps.*,
        a.appointment_date,
        a.status as appointment_status
       FROM procedure_sessions ps
       LEFT JOIN appointments a ON ps.appointment_id = a.id
       WHERE ps.procedure_id = $1
       ORDER BY ps.session_number ASC`,
      [id]
    );

    // Obtener pagos con método de pago
    const payments = await queryAll(
      `SELECT 
        pay.*,
        pm.name as payment_method_name
       FROM payments pay
       LEFT JOIN payment_methods pm ON pay.payment_method_id = pm.id
       WHERE pay.procedure_id = $1
       ORDER BY pay.payment_date ASC`,
      [id]
    );

    // Convertir total_cost a número
    const totalCost = typeof procedure.total_cost === 'string' 
      ? parseFloat(procedure.total_cost) 
      : procedure.total_cost || 0;

    // Calcular total pagado (asegurando que sean números)
    const totalPaid = payments.reduce((sum, p) => {
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const totalPending = totalCost - totalPaid;

    // Devolver todo con números, no strings
    return NextResponse.json({
      success: true,
      data: {
        id: procedure.id,
        patient_id: procedure.patient_id,
        patient_name: procedure.patient_name,
        treatment_id: procedure.treatment_id,
        treatment_name: procedure.treatment_name,
        tooth_code: procedure.tooth_code,
        diagnosis: procedure.diagnosis,
        total_cost: totalCost, // Ahora es número
        status: procedure.status,
        start_date: procedure.start_date,
        end_date: procedure.end_date,
        created_at: procedure.created_at,
        sessions: sessions || [],
        payments: payments.map(p => ({
          ...p,
          amount: typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount
        })),
        totalPaid,
        totalPending
      }
    });
  } catch (error) {
    console.error('Error fetching procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch procedure' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Solo permitir actualizar status
    if (!body.status || !['planned', 'in_progress', 'completed', 'cancelled'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Si se completa, asignar fecha fin
    const updateData: any = { status: body.status };
    if (body.status === 'completed') {
      updateData.end_date = new Date().toISOString();
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updateData.status);
    }
    if (updateData.end_date) {
      fields.push(`end_date = $${paramCount++}`);
      values.push(updateData.end_date);
    }

    values.push(id);

    const updatedProcedure = await queryOne(
      `UPDATE procedures 
       SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return NextResponse.json({
      success: true,
      data: updatedProcedure
    });
  } catch (error) {
    console.error('Error updating procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update procedure' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Primero obtener el patient_id del procedimiento
    const procedure = await queryAll(
      `SELECT patient_id FROM procedures WHERE id = $1`,
      [id]
    );

    if (!procedure || procedure.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Procedure not found' },
        { status: 404 }
      );
    }

    const patientId = procedure[0].patient_id;

    // Obtener citas del paciente que:
    // 1. Estén programadas (scheduled)
    // 2. No tengan ya una sesión asociada a este procedimiento
    const appointments = await queryAll(
      `SELECT a.* 
       FROM appointments a
       WHERE a.patient_id = $1 
         AND a.status = 'scheduled'
         AND a.id NOT IN (
           SELECT appointment_id 
           FROM procedure_sessions 
           WHERE procedure_id = $2
         )
       ORDER BY a.appointment_date ASC`,
      [patientId, id]
    );

    return NextResponse.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching available appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const appointment = await queryOne(
      `SELECT 
        a.*,
        p.id as patient_id,
        p.full_name as patient_name,
        p.national_id as patient_national_id,
        p.phone as patient_phone,
        d.id as doctor_id,
        d.full_name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const sessions = await queryAll(
      `SELECT 
        ps.*,
        pr.id as procedure_id,
        pr.tooth_code,
        pr.diagnosis,
        t.name as procedure_name
       FROM procedure_sessions ps
       LEFT JOIN procedures pr ON ps.procedure_id = pr.id
       LEFT JOIN treatments t ON pr.treatment_id = t.id
       WHERE ps.appointment_id = $1
       ORDER BY ps.session_number ASC`,
      [id]
    );

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      session_number: session.session_number,
      progress_notes: session.progress_notes,
      description: session.progress_notes,
      created_at: session.created_at,
      procedure_id: session.procedure_id,
      procedure_name: session.procedure_name,
      tooth_code: session.tooth_code,
      diagnosis: session.diagnosis
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        sessions: formattedSessions
      },
    });
  } catch (error) {
    console.error('Appointment detail API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// SOLO AGREGAR ESTO - endpoint para actualizar estado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.status || !['scheduled', 'completed', 'cancelled'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updatedAppointment = await queryOne(
      `UPDATE appointments 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [body.status, id]
    );

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
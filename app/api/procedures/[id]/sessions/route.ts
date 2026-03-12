import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/pg';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.appointment_id || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Obtener el último número de sesión
    const lastSession = await queryOne(
      'SELECT session_number FROM procedure_sessions WHERE procedure_id = $1 ORDER BY session_number DESC LIMIT 1',
      [id]
    );

    const nextSessionNumber = (lastSession?.session_number || 0) + 1;

    const session = await queryOne(
      `INSERT INTO procedure_sessions (procedure_id, appointment_id, session_number, progress_notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, body.appointment_id, nextSessionNumber, body.description]
    );

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const appointments = await queryAll(
      `SELECT a.*, p.full_name as patient_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.doctor_id = $1
       ORDER BY a.appointment_date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
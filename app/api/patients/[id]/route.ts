import { NextRequest, NextResponse } from 'next/server';
import { getPatientById, updatePatient } from '@/lib/db-pg'; // Cambiado: usar getPatientById

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Usar getPatientById que SÍ trae appointments, procedures y totales
    const patient = await getPatientById(id);

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching patient', details: String(error) },
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

    const patient = await updatePatient(id, {
      full_name: body.full_name,
      national_id: body.national_id,
      phone: body.phone,
      address: body.address,
      city_id: body.city_id,
      birth_date: body.birth_date,
      medical_history: body.medical_history,
    });

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating patient' },
      { status: 500 }
    );
  }
}

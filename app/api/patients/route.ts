import { NextRequest, NextResponse } from 'next/server';
import { getPatients, createPatient } from '@/lib/db-pg';
import { ITEMS_PER_PAGE } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const sortOrder = (searchParams.get('sort') || 'desc') as 'asc' | 'desc';

    const offset = (page - 1) * ITEMS_PER_PAGE;

    const { patients, total } = await getPatients(
      ITEMS_PER_PAGE,
      offset,
      search,
      sortOrder
    );

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        page,
        totalPages,
        totalItems: total,
        itemsPerPage: ITEMS_PER_PAGE,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const patient = await createPatient({
      full_name: body.full_name,
      national_id: body.national_id,
      phone: body.phone,
      address: body.address,
      city_id: body.city_id,
      birth_date: body.birth_date,
      medical_history: body.medical_history,
    });

    return NextResponse.json(
      { success: true, data: patient },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Error creating patient' },
      { status: 500 }
    );
  }
}

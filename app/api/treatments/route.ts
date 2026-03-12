import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/pg'; // IMPORTANTE: agregar queryOne

export async function GET() {
  try {
    const treatments = await queryAll(
      'SELECT * FROM treatments ORDER BY name ASC'
    );
    
    return NextResponse.json({ 
      success: true, 
      data: treatments 
    });
  } catch (error) {
    console.error('Error fetching treatments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch treatments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, description, base_price, active } = body;
    
    // Validar datos requeridos
    if (!name || !base_price) {
      return NextResponse.json(
        { success: false, error: 'Name and base price are required' },
        { status: 400 }
      );
    }

    const treatment = await queryOne(
      `INSERT INTO treatments (name, description, base_price, active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, base_price, active !== undefined ? active : true]
    );

    return NextResponse.json({ success: true, data: treatment });
  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create treatment' },
      { status: 500 }
    );
  }
}
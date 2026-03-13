import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/pg';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.active === undefined) {
      return NextResponse.json(
        { success: false, error: 'Active status is required' },
        { status: 400 }
      );
    }

    const updated = await queryOne(
      'UPDATE treatments SET active = $1 WHERE id = $2 RETURNING *',
      [body.active, id]
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Treatment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Treatment update API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update treatment' },
      { status: 500 }
    );
  }
}

// NUEVO: PUT para actualización completa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, description, base_price, active } = body;

    const updated = await queryOne(
      `UPDATE treatments 
       SET name = $1, description = $2, base_price = $3, active = $4 
       WHERE id = $5 
       RETURNING *`,
      [name, description || null, base_price, active, id]
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Treatment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Treatment update API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update treatment' },
      { status: 500 }
    );
  }
}
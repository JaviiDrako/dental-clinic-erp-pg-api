import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/pg';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // IMPORTANTE: await params
    const body = await request.json();

    if (body.active === undefined) {
      return NextResponse.json(
        { success: false, error: 'Active status is required' },
        { status: 400 }
      );
    }

    // CORREGIDO: Eliminado updated_at que no existe en la tabla
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
import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/pg';
import { hashPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const doctor = await queryOne(
      `SELECT d.*, u.email, u.role, u.active as user_active
       FROM doctors d
       LEFT JOIN users u ON d.id = u.doctor_id
       WHERE d.id = $1`,
      [id]
    );

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Actualizar estado del doctor
    if (body.active !== undefined) {
      // Actualizar doctor
      await queryOne(
        `UPDATE doctors SET active = $1 WHERE id = $2`,
        [body.active, id]
      );

      // Actualizar usuario asociado si existe
      await queryOne(
        `UPDATE users SET active = $1 WHERE doctor_id = $2`,
        [body.active, id]
      );
    }

    // Actualizar email/role si se proporciona
    if (body.email || body.role) {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (body.email) {
        updates.push(`email = $${paramCount++}`);
        values.push(body.email);
      }
      if (body.role) {
        updates.push(`role = $${paramCount++}`);
        values.push(body.role);
      }
      
      values.push(id);

      if (updates.length > 0) {
        await queryOne(
          `UPDATE users SET ${updates.join(', ')} WHERE doctor_id = $${paramCount}`,
          values
        );
      }
    }

    // Actualizar contraseña si se proporciona
    if (body.password) {
      const hashedPassword = await hashPassword(body.password);
      await queryOne(
        `UPDATE users SET password_hash = $1 WHERE doctor_id = $2`,
        [hashedPassword, id]
      );
    }

    // Obtener doctor actualizado
    const updatedDoctor = await queryOne(
      `SELECT d.*, u.email, u.role, u.active as user_active
       FROM doctors d
       LEFT JOIN users u ON d.id = u.doctor_id
       WHERE d.id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedDoctor
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update doctor' },
      { status: 500 }
    );
  }
}
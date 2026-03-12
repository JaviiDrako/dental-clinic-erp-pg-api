import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/pg';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.amount || !body.payment_method_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payment = await queryOne(
      `INSERT INTO payments (procedure_id, amount, payment_method_id, transaction_reference, payment_date)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [id, body.amount, body.payment_method_id, body.transaction_reference || null]
    );

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
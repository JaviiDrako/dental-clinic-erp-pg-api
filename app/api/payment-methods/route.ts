import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/pg';

export async function GET(request: NextRequest) {
  try {
    const methods = await queryAll('SELECT * FROM payment_methods ORDER BY name', []);

    return NextResponse.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error('Payment Methods API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

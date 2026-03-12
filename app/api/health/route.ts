import { NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/pg';

export async function GET() {
  try {
    // Test connection and get table counts
    const tables = [
      'patients',
      'doctors',
      'appointments',
      'procedures',
      'treatments',
      'payments',
      'cities',
    ];

    const counts = {} as Record<string, number>;

    for (const table of tables) {
      const result = await queryOne(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(result?.count || '0');
    }

    console.log('[v0] Database Health Check:', counts);

    return NextResponse.json({
      success: true,
      message: 'Database connection OK',
      tableCounts: counts,
    });
  } catch (error) {
    console.error('[v0] Health check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Database connection failed', details: String(error) },
      { status: 500 }
    );
  }
}

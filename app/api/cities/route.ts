import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/pg';

export async function GET() {
  try {
    const cities = await queryAll(
      'SELECT * FROM cities WHERE active = true ORDER BY name ASC'
    );
    
    return NextResponse.json({ 
      success: true, 
      data: cities 
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
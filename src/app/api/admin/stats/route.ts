import { NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/storage';

export async function GET() {
  try {
    const stats = getAdminStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
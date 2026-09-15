import { NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getAdminStats();
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
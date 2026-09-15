import { NextRequest, NextResponse } from 'next/server';
import { getApplications, getAdminStats } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const apps = getApplications();
    const stats = getAdminStats();

    return NextResponse.json({
      success: true,
      data: {
        applications: apps,
        stats
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Başvurular yüklenirken hata oluştu.' },
      { status: 500 }
    );
  }
}

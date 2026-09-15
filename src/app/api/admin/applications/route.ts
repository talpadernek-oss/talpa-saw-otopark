import { NextRequest, NextResponse } from 'next/server';
import { getApplications, getAdminStats, isPersistentStorageConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const apps = await getApplications();
    const stats = await getAdminStats(apps);

    return NextResponse.json({
      success: true,
      data: {
        applications: apps,
        stats,
        persistentStorage: isPersistentStorageConfigured()
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

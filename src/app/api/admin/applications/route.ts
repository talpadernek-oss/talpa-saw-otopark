import { NextRequest, NextResponse } from 'next/server';
import { getApplications, getAdminStats } from '@/lib/storage';

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
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Başvurular yüklenirken hata oluştu.' },
      { status: 500 }
    );
  }
}

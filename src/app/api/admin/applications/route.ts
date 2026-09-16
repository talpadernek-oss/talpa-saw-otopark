import { NextRequest, NextResponse } from 'next/server';
import { getApplications, getAdminStats, isPersistentStorageConfigured } from '@/lib/storage';
import { isAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();

  try {
    const apps = await getApplications();
    const stats = await getAdminStats(apps);

    // Never ship the encrypted card number to the browser; it is revealed
    // on demand through /api/admin/payment-details.
    const publicApps = apps.map(({ paymentCardEncrypted, ...rest }) => ({
      ...rest,
      hasFullCardNumber: Boolean(paymentCardEncrypted)
    }));

    return NextResponse.json({
      success: true,
      data: {
        applications: publicApps,
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

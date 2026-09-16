import { NextRequest, NextResponse } from 'next/server';
import { updateApplicationStatus, getApplicationById } from '@/lib/storage';
import { sendApplicationForwardEmail } from '@/lib/email';
import { isAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { action, id, status, adminNotes, forwardTo } = body;

    // Forward the application (template + ruhsat attachment) to e.g. the parking operator
    if (action === 'forward') {
      if (!forwardTo || typeof forwardTo !== 'string' || !forwardTo.includes('@')) {
        return NextResponse.json({ success: false, error: 'Lütfen geçerli bir alıcı e-posta adresi giriniz.' }, { status: 400 });
      }

      const app = id ? await getApplicationById(id) : null;
      if (!app) {
        return NextResponse.json({ success: false, error: 'Başvuru bulunamadı.' }, { status: 404 });
      }

      const result = await sendApplicationForwardEmail(app, forwardTo.trim());
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'E-posta iletilemedi.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Abonelik kaydı talebi (ruhsat ekiyle) ${forwardTo.trim()} adresine iletildi.`
      });
    }

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Eksik parametre.' }, { status: 400 });
    }

    const updated = await updateApplicationStatus(id, status, adminNotes);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Başvuru bulunamadı.' }, { status: 404 });
    }

    const { paymentCardEncrypted: _encrypted, ...publicUpdated } = updated;

    return NextResponse.json({
      success: true,
      message: 'Başvuru durumu başarıyla güncellendi.',
      data: publicUpdated
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'İşlem gerçekleştirilemedi.' }, { status: 500 });
  }
}

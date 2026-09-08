import { NextRequest, NextResponse } from 'next/server';
import { updateApplicationStatus, getApplications } from '@/lib/storage';
import { sendCustomEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, status, adminNotes, forwardTo, forwardSubject, forwardBody } = body;

    if (action === 'forward') {
      if (!forwardTo || !forwardTo.includes('@')) {
        return NextResponse.json({ success: false, error: 'Lütfen geçerli bir alıcı e-posta adresi giriniz.' }, { status: 400 });
      }

      const result = await sendCustomEmail(forwardTo, forwardSubject || 'Başvuru İletimi', forwardBody || '');
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'E-posta iletilemedi.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Başvuru detayları ${forwardTo} adresine e-posta ile iletildi.`
      });
    }

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Eksik parametre.' }, { status: 400 });
    }

    const updated = updateApplicationStatus(id, status, adminNotes);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Başvuru bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Başvuru durumu başarıyla güncellendi.',
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'İşlem gerçekleştirilemedi.' }, { status: 500 });
  }
}

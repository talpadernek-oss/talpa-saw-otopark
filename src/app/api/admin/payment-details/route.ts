import { NextRequest, NextResponse } from 'next/server';
import { getApplicationById } from '@/lib/storage';
import { decryptCardNumber, formatCardNumber } from '@/lib/cardCrypto';
import { isAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * Reveals the full card number of a kabin application to an authenticated admin.
 * Requires the x-admin-key header (ADMIN_SECRET_KEY). CVV is never available.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) return unauthorizedResponse();

    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Eksik parametre.' }, { status: 400 });
    }

    const app = await getApplicationById(id);
    if (!app) {
      return NextResponse.json({ success: false, error: 'Başvuru bulunamadı.' }, { status: 404 });
    }

    if (app.role !== 'kabin') {
      return NextResponse.json({ success: false, error: 'Bu başvuru türünde kart bilgisi tutulmaz (TALPA kayıtlı kart).' }, { status: 400 });
    }

    if (!app.paymentCardEncrypted) {
      return NextResponse.json({
        success: false,
        error: `Bu başvuru için tam kart numarası kayıtlı değil (yalnızca son 4 hane: ${app.paymentCardLast4 || '----'}).`
      }, { status: 404 });
    }

    const cardNumber = decryptCardNumber(app.paymentCardEncrypted);

    return NextResponse.json({
      success: true,
      data: {
        cardNumber,
        cardNumberFormatted: formatCardNumber(cardNumber),
        cardholderName: app.paymentCardholderName || '',
        expiryMonth: app.paymentExpiryMonth || '',
        expiryYear: app.paymentExpiryYear || '',
        last4: app.paymentCardLast4 || cardNumber.slice(-4)
      }
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Payment details error:', error);
    return NextResponse.json({ success: false, error: 'Kart bilgisi çözümlenemedi.' }, { status: 500 });
  }
}

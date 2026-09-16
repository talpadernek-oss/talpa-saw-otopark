import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSecret } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * Validates the admin password against ADMIN_SECRET_KEY. The browser keeps the
 * password for the session and sends it as x-admin-key on every admin request.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'ADMIN_SECRET_KEY sunucuda tanımlı değil. Lütfen ortam değişkenini ayarlayınız.' }, { status: 500 });
    }

    const { password } = await req.json();
    if (!verifyAdminSecret(typeof password === 'string' ? password : '')) {
      return NextResponse.json({ success: false, error: 'Geçersiz yönetici şifresi.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Giriş isteği işlenemedi.' }, { status: 400 });
  }
}

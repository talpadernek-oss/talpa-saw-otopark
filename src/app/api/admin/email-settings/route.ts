import { NextRequest, NextResponse } from 'next/server';
import { getEmailSettings, saveEmailSettings } from '@/lib/storage';
import { sendCustomEmail } from '@/lib/email';
import { isAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();

  try {
    const settings = await getEmailSettings();
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'E-posta ayarları yüklenemedi.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { action, adminNotificationEmail, applicantConfirmationTemplate, adminNotificationTemplate, testEmailAddress } = body;

    if (action === 'test') {
      if (!testEmailAddress || !testEmailAddress.includes('@')) {
        return NextResponse.json({ success: false, error: 'Test e-postası için geçerli bir e-posta adresi giriniz.' }, { status: 400 });
      }

      const testSubject = 'TALPA SAW Otopark - Test E-postası';
      const testBody = `Merhaba,

Bu e-posta, TALPA SAW Otopark Portalı SMTP sunucusu konfigürasyonunun (smtp.office365.com:587) çalıştığını doğrulamak amacıyla gönderilen test e-postasıdır.

Tarih: ${new Date().toLocaleString('tr-TR')}
Gönderici Adres: ${process.env.SMTP_USER || 'talpa@talpa.org'}

Dernek / Sistem Yönetimi`;

      const res = await sendCustomEmail(testEmailAddress, testSubject, testBody);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || 'Test e-postası gönderilemedi.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Test e-postası ${testEmailAddress} adresine başarıyla gönderildi.`
      });
    }

    const currentSettings = await getEmailSettings();
    const newSettings = {
      ...currentSettings,
      adminNotificationEmail: adminNotificationEmail || currentSettings.adminNotificationEmail,
      applicantConfirmationTemplate: applicantConfirmationTemplate || currentSettings.applicantConfirmationTemplate,
      adminNotificationTemplate: adminNotificationTemplate || currentSettings.adminNotificationTemplate
    };

    await saveEmailSettings(newSettings);

    return NextResponse.json({
      success: true,
      message: 'E-posta ayarları ve şablonları başarıyla güncellendi.',
      data: newSettings
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Ayarlar kaydedilemedi.' }, { status: 500 });
  }
}

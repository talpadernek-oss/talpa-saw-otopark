import { NextRequest, NextResponse } from 'next/server';
import { addApplication } from '@/lib/storage';
import { sendApplicantConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';
import { isValidTCKN, formatPlate } from '@/lib/tckn';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      role,
      tc,
      name,
      email,
      phone,
      plate,
      ruhsatImage,
      apronCardImage,
      kvkkAccepted,
      explicitConsentAccepted,
      isTalpaMember
    } = body;

    // Validation
    if (!role || (role !== 'kokpit' && role !== 'kabin')) {
      return NextResponse.json({ success: false, error: 'Lütfen geçerli bir görev seçimi yapınız.' }, { status: 400 });
    }

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Lütfen geçerli bir İsim Soyisim giriniz.' }, { status: 400 });
    }

    if (!tc || !isValidTCKN(tc)) {
      return NextResponse.json({ success: false, error: 'Lütfen 11 haneli geçerli T.C. Kimlik Numarası giriniz.' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Lütfen geçerli bir e-posta adresi giriniz.' }, { status: 400 });
    }

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Lütfen geçerli bir telefon numarası giriniz.' }, { status: 400 });
    }

    if (!plate || plate.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Lütfen geçerli bir plaka bilgisi giriniz.' }, { status: 400 });
    }

    if (!kvkkAccepted || !explicitConsentAccepted) {
      return NextResponse.json({ success: false, error: 'Devam etmek için KVKK ve Açık Rıza metinlerini onaylamanız gerekmektedir.' }, { status: 400 });
    }

    const formattedPlate = formatPlate(plate);

    // Save record
    const application = addApplication({
      role,
      tc: tc.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      plate: formattedPlate,
      ruhsatImage: ruhsatImage || '',
      apronCardImage: apronCardImage || '',
      kvkkAccepted: true,
      explicitConsentAccepted: true,
      isTalpaMember: role === 'kokpit' ? (isTalpaMember ?? true) : false
    });

    // Trigger emails asynchronously (doesn't block user response if SMTP is delayed)
    Promise.allSettled([
      sendApplicantConfirmationEmail(application),
      sendAdminNotificationEmail(application)
    ]).then(results => {
      console.log('Automated emails triggered:', results);
    });

    return NextResponse.json({
      success: true,
      message: 'SAW Otopark Ek Kontenjan başvurunuz başarıyla alınmıştır.',
      data: application
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ success: false, error: 'Başvuru kaydedilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}

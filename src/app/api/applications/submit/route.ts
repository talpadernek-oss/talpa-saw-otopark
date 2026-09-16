import { NextRequest, NextResponse } from 'next/server';
import { addApplication } from '@/lib/storage';
import { sendApplicantConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';
import { isValidTCKN, formatPlate } from '@/lib/tckn';
import { encryptCardNumber } from '@/lib/cardCrypto';

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
      startDateOption,
      paymentConsentAccepted,
      paymentCardNumber,
      paymentCardholderName,
      paymentExpiryMonth,
      paymentExpiryYear,
      paymentCvv,
      ruhsatImage,
      apronCardImage,
      kvkkAccepted,
      explicitConsentAccepted,
      parkingTermsAccepted,
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

    if (startDateOption !== 'next_month' && startDateOption !== 'immediate') {
      return NextResponse.json({ success: false, error: 'Lütfen geçerli bir abonelik başlangıç seçeneği belirtiniz.' }, { status: 400 });
    }

    if (role === 'kokpit' && paymentConsentAccepted !== true) {
      return NextResponse.json({ success: false, error: 'Aylık abonman bedeli ödeme onamını kabul etmeniz gerekmektedir.' }, { status: 400 });
    }

    if (role === 'kabin') {
      const normalizedCardNumber = String(paymentCardNumber || '').replace(/\s/g, '');
      const expiryMonth = String(paymentExpiryMonth || '');
      const expiryYear = String(paymentExpiryYear || '');
      const cvv = String(paymentCvv || '');
      const expiryDate = new Date(2000 + Number(expiryYear), Number(expiryMonth), 0);
      const currentMonth = new Date();
      currentMonth.setDate(1);
      if (!/^\d{16}$/.test(normalizedCardNumber) || !/^\d{2}$/.test(expiryMonth) || !/^(0[1-9]|1[0-2])$/.test(expiryMonth) || !/^\d{2}$/.test(expiryYear) || !/^\d{3}$/.test(cvv) || !paymentCardholderName?.trim() || expiryDate < currentMonth) {
        return NextResponse.json({ success: false, error: 'Lütfen geçerli ödeme kartı bilgilerini eksiksiz giriniz.' }, { status: 400 });
      }
    }

    if (!kvkkAccepted || !explicitConsentAccepted) {
      return NextResponse.json({ success: false, error: 'Devam etmek için KVKK ve Açık Rıza metinlerini onaylamanız gerekmektedir.' }, { status: 400 });
    }

    if (parkingTermsAccepted !== true) {
      return NextResponse.json({ success: false, error: 'Devam etmek için Otopark Kullanım Talimatını okuyup onaylamanız gerekmektedir.' }, { status: 400 });
    }

    const formattedPlate = formatPlate(plate);
    const normalizedCardNumber = role === 'kabin' ? String(paymentCardNumber).replace(/\s/g, '') : '';

    // Save record (card number encrypted at rest; CVV is never stored)
    const application = await addApplication({
      role,
      tc: tc.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      plate: formattedPlate,
      startDateOption,
      monthlyFee: role === 'kokpit' ? 2250 : 2500,
      paymentConsentAccepted: role === 'kokpit',
      paymentCardLast4: role === 'kabin' ? normalizedCardNumber.slice(-4) : undefined,
      paymentCardEncrypted: role === 'kabin' ? encryptCardNumber(normalizedCardNumber) : undefined,
      paymentCardholderName: role === 'kabin' ? paymentCardholderName.trim() : undefined,
      paymentExpiryMonth: role === 'kabin' ? String(paymentExpiryMonth) : undefined,
      paymentExpiryYear: role === 'kabin' ? String(paymentExpiryYear) : undefined,
      ruhsatImage: ruhsatImage || '',
      apronCardImage: apronCardImage || '',
      kvkkAccepted: true,
      explicitConsentAccepted: true,
      parkingTermsAccepted: true,
      isTalpaMember: role === 'kokpit' ? (isTalpaMember ?? true) : false
    });

    // Trigger emails asynchronously (doesn't block user response if SMTP is delayed)
    Promise.allSettled([
      sendApplicantConfirmationEmail(application),
      sendAdminNotificationEmail(application)
    ]).then(results => {
      console.log('Automated emails triggered:', results);
    });

    const { paymentCardEncrypted: _encrypted, ...publicApplication } = application;

    return NextResponse.json({
      success: true,
      message: 'SAW Otopark Ek Kontenjan başvurunuz başarıyla alınmıştır.',
      data: publicApplication
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ success: false, error: 'Başvuru kaydedilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}

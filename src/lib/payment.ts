import { ApplicationRecord } from '@/types';

/**
 * Human-readable payment summary for an application.
 * Kokpit: consent to charge the card registered at TALPA.
 * Kabin: masked card (last 4), expiry and cardholder as submitted.
 */
export function getPaymentSummary(app: Pick<ApplicationRecord, 'role' | 'paymentConsentAccepted' | 'paymentCardLast4' | 'paymentCardholderName' | 'paymentExpiryMonth' | 'paymentExpiryYear'>): string {
  if (app.role === 'kokpit') {
    return app.paymentConsentAccepted
      ? "TALPA'ya kayıtlı karttan tahsilat onayı verildi"
      : 'Ödeme onayı alınmadı';
  }

  if (!app.paymentCardLast4) return 'Kart bilgisi girilmedi';

  const expiry = app.paymentExpiryMonth && app.paymentExpiryYear
    ? ` (SKT ${app.paymentExpiryMonth}/${app.paymentExpiryYear})`
    : '';
  const holder = app.paymentCardholderName ? ` - ${app.paymentCardholderName}` : '';
  return `**** **** **** ${app.paymentCardLast4}${expiry}${holder}`;
}

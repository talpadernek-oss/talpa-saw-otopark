import React from 'react';
import { CreditCard } from 'lucide-react';

interface PaymentCardVisualProps {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export default function PaymentCardVisual({
  cardNumber,
  cardholderName,
  expiryMonth,
  expiryYear,
  cvv
}: PaymentCardVisualProps) {
  const displayNumber = cardNumber
    ? cardNumber.replace(/\d(?=.{4})/g, '*').replace(/(.{4})/g, '$1 ').trim()
    : '**** **** **** ****';

  return (
    <div className="relative aspect-[1.586/1] w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-talpa-navy-950 via-talpa-navy-800 to-talpa-navy-600 p-5 text-white shadow-xl sm:p-6">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10" />
      <div className="absolute -bottom-28 -left-12 h-56 w-56 rounded-full border border-talpa-gold-400/20" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <CreditCard className="h-7 w-7 text-talpa-gold-300" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-talpa-gold-200">Ödeme Kartı</span>
        </div>
        <div className="space-y-3">
          <p className="font-mono text-base font-semibold tracking-[0.14em] sm:text-lg">{displayNumber}</p>
          <div className="flex items-end justify-between gap-3 text-[10px] uppercase tracking-wider text-white/70">
            <div className="min-w-0">
              <span className="block">Kart Sahibi</span>
              <strong className="block truncate text-xs tracking-normal text-white">{cardholderName || 'AD SOYAD'}</strong>
            </div>
            <div className="shrink-0 text-right">
              <span className="block">Son Kullanma</span>
              <strong className="text-xs tracking-normal text-white">{expiryMonth || 'AA'}/{expiryYear || 'YY'}</strong>
            </div>
            <div className="shrink-0 text-right">
              <span className="block">CVV</span>
              <strong className="text-xs tracking-normal text-white">{cvv ? '•'.repeat(cvv.length) : '•••'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

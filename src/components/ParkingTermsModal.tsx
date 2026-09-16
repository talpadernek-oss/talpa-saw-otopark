import React from 'react';
import { X, ClipboardCheck, CheckCircle2 } from 'lucide-react';

interface ParkingTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const PARKING_TERMS_TITLE = 'OTOPARK KULLANIM TALİMATI';

export const PARKING_TERMS_ITEMS = [
  'Otopark kartını ilgili otopark işletmesine bizzat başvurarak teslim alacağımı, sözkonusu kartın alınmaması veya gecikme ile alınması, alındığı halde kullanılmaması, abonelik süresi boyunca kısmen veya tamamen veya belirli sürelerle kullanılmamış olması hallerinin, aylık abonelik ücretinin ödenmemesi, kısmen ödenmesi sonucunu doğurmayacağını, işbu başvuru formunu imzaladığım ay dahil olmak üzere abonelik ücretini her ay düzenli olarak ödeyeceğimi,',
  'Yukarıda verdiğim tüm bilgilerin doğru olduğunu bu bilgilerimde değişiklik olduğu takdirde derhal TALPA’ya bizzat başvurarak ve mail ile yazılı biçimde bildirimde bulunacağımı, TALPA İktisadi İşletmesine ödeyeceğim aylık abonelik ödemelerinin, imzaladığım Otomatik Ödeme Talimatına istinaden yukarıda detayları verilen Banka hesabımdan (Yukarıda verilen Kredi Kartımdan) karşılanacağını, Hesap bakiyemin (kredi kartı limitinin) her zaman abonelik ücretini karşılamaya müsait olacağını, Banka hesabımın herhangi bir nedenle kullanılamaz hale gelmesi, haciz konulması, kapatılması (Kredi Kartımın kullanılamaz hale gelmesi, çalınması, iptal edilmesi, son kullanma tarihinin geçmesi vb) hallerinde, Abonelik ücretlerini başka bir kredi kartımı vererek veya TALPA’nın banka hesabına en geç her ayın 8. günü EFT/havale yöntemi ile ödeyeceğimi, Ödemelerin yapılıp yapılmadığını banka ekstresinden düzenli olarak kontrol edeceğimi, Herhangi bir yazılı veya mail ile iptal başvurum olmadığı takdirde ilan edilen yeni ücretler üzerinden kesinti yapılmasına rıza göstermiş sayılacağımı,',
  'Her ayın birinci gününden sonra yaptığım iptal başvurusunun izleyen aydan itibaren geçerli olacağını, 2 ay üstüste ödeme yapmadığım veya birbirini takip eden 12 ay içinde 4 kez gecikme ile ödeme yaptığım takdirde tarafıma yukarıdaki iletişim kanallarından en az biri ile ulaşılarak bilgi verilmesi kaydıyla otopark kartımın iptal edileceğini ve birikmiş borçlarımla ilgili olarak bir bildirim veya ihtarnameye gerek olmaksızın işbu belgeye istinaden tarafıma rücu edileceğini kabul, beyan ve taahhüt ederim.'
];

/**
 * Parking usage terms. Unlike the informational KVKK modals, this one has an
 * explicit "Okudum, Onaylıyorum" action; the consent checkbox is only ticked
 * through that button.
 */
export default function ParkingTermsModal({ isOpen, onClose, onAccept }: ParkingTermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-talpa-navy-950 to-talpa-navy-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-5 h-5 text-talpa-gold-400" />
            <h3 className="font-serif text-lg font-bold">Otopark Kullanım Talimatı</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700 font-sans">
          <h4 className="font-bold text-slate-900 text-sm">{PARKING_TERMS_TITLE}</h4>
          <ol className="space-y-3">
            {PARKING_TERMS_ITEMS.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-talpa-navy-900 text-talpa-gold-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <p className="text-justify">{item}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Devam etmek için talimatın tamamını okuduğunuzu ve kabul ettiğinizi onaylayınız.
          </p>
          <button
            type="button"
            onClick={onAccept}
            className="px-5 py-2.5 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white rounded-xl font-semibold text-xs transition-colors inline-flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-talpa-gold-400" />
            <span>Okudum, Onaylıyorum</span>
          </button>
        </div>
      </div>
    </div>
  );
}

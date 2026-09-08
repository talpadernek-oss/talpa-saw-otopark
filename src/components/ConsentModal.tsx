import React from 'react';
import { X, ShieldCheck, FileCheck } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'kvkk' | 'explicit';
}

export default function ConsentModal({ isOpen, onClose, title, type }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-talpa-navy-950 to-talpa-navy-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {type === 'kvkk' ? (
              <ShieldCheck className="w-5 h-5 text-talpa-gold-400" />
            ) : (
              <FileCheck className="w-5 h-5 text-talpa-gold-400" />
            )}
            <h3 className="font-serif text-lg font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700 font-sans">
          {type === 'kvkk' ? (
            <>
              <h4 className="font-bold text-slate-900 text-sm">SAW OTOPARK EK KONTENJAN BAŞVURUSU KVKK AYDINLATMA METNİ</h4>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, Türkiye Havayolu Pilotları Derneği (“TALPA”) ve Sabiha Gökçen Havalimanı İşletmesi yetkili birimleri tarafından, Sabiha Gökçen Havalimanı (SAW) Otopark Ek Kontenjan Abonelik başvurunuz kapsamında paylaştığınız kişisel verileriniz işlenmektedir.
              </p>

              <h5 className="font-bold text-slate-900 text-xs mt-3">1. İşlenen Kişisel Verileriniz</h5>
              <p>
                Ad soyad, T.C. Kimlik Numarası, e-posta adresi, telefon numarası, görev unvanı (Kokpit / Kabin Görevlisi), araç plaka bilgisi, araç ruhsat görseli ve apron giriş kartı görseli.
              </p>

              <h5 className="font-bold text-slate-900 text-xs mt-3">2. Kişisel Verilerin İşlenme Amaçları</h5>
              <p>
                - Otopark ek kontenjan abonelik taleplerinin toplanması, doğrulanması ve yönetilmesi,<br />
                - Kokpit görevlileri yönünden TALPA üyeliğinin teyit edilmesi,<br />
                - Otopark giriş-çıkış yetkilendirme işlemlerinin Sabiha Gökçen Havalimanı işletmesi ile koordineli yürütülmesi,<br />
                - İletişim faaliyetlerinin ve bildirim e-postalarının sürdürülmesi.
              </p>

              <h5 className="font-bold text-slate-900 text-xs mt-3">3. Kişisel Verilerin Aktarılması</h5>
              <p>
                Kişisel verileriniz, yalnızca otopark abonelik hakkı tanımlama amacıyla Sabiha Gökçen Havalimanı (HEAŞ / İSG) Otopark Yönetim Birimine ve yasal zorunluluk halinde yetkili kamu kurum ve kuruluşlarına aktarılabilmektedir.
              </p>

              <h5 className="font-bold text-slate-900 text-xs mt-3">4. Haklarınız</h5>
              <p>
                KVKK’nın 11. maddesi uyarınca TALPA’ya başvurarak kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme hakkına sahipsiniz.
              </p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-slate-900 text-sm">SAW OTOPARK EK KONTENJAN BAŞVURUSU AÇIK RIZA METNİ</h4>
              <p>
                KVKK Aydınlatma Metni çerçevesinde; Sabiha Gökçen Havalimanı (SAW) Otopark Aboneliği ek kontenjan sürecine katılımım vesilesiyle tarafımca sağlanan ad soyad, T.C. Kimlik No, iletişim bilgileri, araç plaka bilgisi ile yüklediğim araç ruhsatı ve apron kartı görsellerimin:
              </p>

              <ul className="list-disc pl-5 space-y-1 my-2">
                <li>SAW Otopark Yönetim Birimi ve TALPA yetkilileri tarafından abonelik sorgulama ve onay sisteminde işlenmesine,</li>
                <li>Görsellerin kimlik teyidi ve plaka eşleştirme amacıyla incelenmesine,</li>
                <li>E-posta ve SMS yoluyla başvuru sonuç ve bilgilendirme iletilerinin tarafıma gönderilmesine</li>
              </ul>

              <p className="font-medium text-slate-900 mt-3">
                Özgür irademle açık rıza gösterdiğimi ve beyan ettiğim bilgilerin doğru olduğunu onaylıyorum.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white rounded-xl font-semibold text-xs transition-colors"
          >
            Okudum, Anladım
          </button>
        </div>
      </div>
    </div>
  );
}

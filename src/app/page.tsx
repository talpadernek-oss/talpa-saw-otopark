'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plane,
  Users,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Car,
  FileText,
  CreditCard,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import TRPlateVisual from '@/components/TRPlateVisual';
import RuhsatUploadFrame from '@/components/RuhsatUploadFrame';
import ApronUploadFrame from '@/components/ApronUploadFrame';
import PaymentCardVisual from '@/components/PaymentCardVisual';
import ConsentModal from '@/components/ConsentModal';
import { isValidTCKN, formatPlate } from '@/lib/tckn';
import { RoleType, StartDateOption, ApplicationRecord } from '@/types';

export default function ApplicationFormPage() {
  // Step state: 1 = Role Selection, 2 = TALPA Verification (if kokpit), 3 = Main Form, 4 = Success Result
  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<RoleType | null>(null);

  // Verification state
  const [verifyTc, setVerifyTc] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isTalpaMember, setIsTalpaMember] = useState<boolean | null>(null);
  const [talpaRedirectUrl, setTalpaRedirectUrl] = useState('');

  // Main Form fields
  const [name, setName] = useState('');
  const [tc, setTc] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [plateConfirmed, setPlateConfirmed] = useState(false);
  const [startDateOption, setStartDateOption] = useState<StartDateOption | ''>('');
  const [paymentConsentAccepted, setPaymentConsentAccepted] = useState(false);
  const [paymentCardNumber, setPaymentCardNumber] = useState('');
  const [paymentCardholderName, setPaymentCardholderName] = useState('');
  const [paymentExpiryMonth, setPaymentExpiryMonth] = useState('');
  const [paymentExpiryYear, setPaymentExpiryYear] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [ruhsatImage, setRuhsatImage] = useState('');
  const [apronCardImage, setApronCardImage] = useState('');

  // Consent states
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [explicitConsentAccepted, setExplicitConsentAccepted] = useState(false);

  // Modal control
  const [activeModal, setActiveModal] = useState<'kvkk' | 'explicit' | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedApp, setSubmittedApp] = useState<ApplicationRecord | null>(null);

  // Clear a stale validation error as soon as the user changes any form field
  useEffect(() => {
    setFormError('');
  }, [
    name, tc, email, phone, plate, plateConfirmed, startDateOption,
    paymentConsentAccepted, paymentCardNumber, paymentCardholderName,
    paymentExpiryMonth, paymentExpiryYear, paymentCvv,
    ruhsatImage, apronCardImage, kvkkAccepted, explicitConsentAccepted
  ]);

  // Step 1: Select Role
  const handleSelectRole = (selectedRole: RoleType) => {
    setRole(selectedRole);
    setFormError('');
    setVerifyError('');

    if (selectedRole === 'kokpit') {
      setStep(2); // Go to TALPA Membership verification
    } else {
      setIsTalpaMember(false);
      setStep(3); // Direct to form for Kabin Görevlisi
    }
  };

  // Step 2: Verify TALPA Membership
  const handleVerifyTalpa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTc || !isValidTCKN(verifyTc)) {
      setVerifyError('Lütfen 11 haneli geçerli T.C. Kimlik Numarası giriniz.');
      return;
    }

    setVerifyError('');
    setVerifying(true);

    try {
      const res = await fetch('/api/talpa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tcNo: verifyTc })
      });

      const json = await res.json();
      setVerifying(false);

      if (!res.ok || json.success === false || json.ok === false) {
        setIsTalpaMember(null);
        setVerifyError(json.error || 'TALPA üyelik doğrulaması yapılamadı. Lütfen daha sonra tekrar deneyiniz.');
        return;
      }

      if (json.isMember) {
        setIsTalpaMember(true);
        setTc(verifyTc);
        setStep(3);
      } else {
        setIsTalpaMember(false);
        setTalpaRedirectUrl(json.redirectUrl || 'https://www.talpa.org/uyelik/');
      }
    } catch (err) {
      setVerifying(false);
      setIsTalpaMember(null);
      setVerifyError('Sorgulama yapılırken bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    }
  };

  // Step 3: Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('Lütfen Ad Soyad giriniz.');
      return;
    }
    if (!tc || !isValidTCKN(tc)) {
      setFormError('Lütfen geçerli 11 haneli T.C. Kimlik Numarası giriniz.');
      return;
    }
    if (!email || !email.includes('@')) {
      setFormError('Lütfen geçerli e-posta adresi giriniz.');
      return;
    }
    if (!phone || phone.trim().length < 10) {
      setFormError('Lütfen telefon numaranızı giriniz.');
      return;
    }
    if (!plate || plate.trim().length < 5) {
      setFormError('Lütfen araç plaka bilginizi giriniz.');
      return;
    }
    if (!plateConfirmed) {
      setFormError('Lütfen plaka bilginizi ekranda yeniden onaylayınız.');
      return;
    }
    if (!startDateOption) {
      setFormError('Lütfen aboneliğin başlatılmasını istediğiniz tarihi seçiniz.');
      return;
    }
    if (role === 'kokpit' && !paymentConsentAccepted) {
      setFormError('Lütfen aylık abonman bedelinin TALPA\'ya kayıtlı kartınızdan alınmasını onaylayınız.');
      return;
    }
    if (role === 'kabin') {
      const currentMonth = new Date();
      const expiryDate = new Date(2000 + Number(paymentExpiryYear), Number(paymentExpiryMonth), 0);
      currentMonth.setDate(1);
      if (paymentCardNumber.length !== 16 || !paymentCardholderName.trim() || !/^\d{2}$/.test(paymentExpiryMonth) || !/^(0[1-9]|1[0-2])$/.test(paymentExpiryMonth) || !/^\d{2}$/.test(paymentExpiryYear) || !/^\d{3}$/.test(paymentCvv) || expiryDate < currentMonth) {
        setFormError('Lütfen geçerli ödeme kartı bilgilerini eksiksiz giriniz.');
        return;
      }
    }
    if (!ruhsatImage) {
      setFormError('Lütfen dikdörtgen ruhsat çerçevesine araç ruhsat görselini yükleyiniz.');
      return;
    }
    if (!apronCardImage) {
      setFormError('Lütfen Apron kart görselinizi yükleyiniz.');
      return;
    }
    if (!kvkkAccepted || !explicitConsentAccepted) {
      setFormError('Lütfen KVKK Aydınlatma Metni ve Açık Rıza Metnini onaylayınız.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          tc,
          name,
          email,
          phone,
          plate: formatPlate(plate),
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
          isTalpaMember
        })
      });

      const responseText = await res.text();
      let json: { success?: boolean; data?: ApplicationRecord; error?: string };
      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(`Sunucu geçersiz yanıt verdi (HTTP ${res.status}).`);
      }
      setSubmitting(false);

      if (!res.ok || !json.success) {
        setFormError(json.error || 'Başvuru gönderilirken bir hata oluştu.');
        return;
      }

      if (!json.data) {
        setFormError('Sunucu başvuruyu kaydetti ancak başvuru detayını döndüremedi.');
        return;
      }

      setSubmittedApp(json.data);
      setStep(4); // Success screen
    } catch (err) {
      setSubmitting(false);
      setFormError(err instanceof Error ? err.message : 'Başvuru gönderilirken beklenmeyen bir hata oluştu.');
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-16">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-talpa-navy-950 via-talpa-navy-900 to-talpa-navy-800 text-white relative overflow-hidden py-10 px-4 sm:px-6 shadow-md">
        <div className="absolute right-[-100px] top-[-100px] w-96 h-96 rounded-full bg-talpa-gold-500/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-talpa-gold-500/15 border border-talpa-gold-400/30 text-talpa-gold-300 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Sabiha Gökçen Havalimanı (SAW)
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
            SAW Otopark Ek Kontenjan Başvuru Formu
          </h1>

          <p className="text-talpa-sand-200 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Sabiha Gökçen Havalimanı otopark aboneliği ek kontenjanı için taleplerinizi bu form üzerinden iletebilirsiniz.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto w-full px-4 -mt-5 relative z-20">
        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-xl font-bold text-talpa-navy-950">
                Başvuru Sahibinin Görev Unvanı
              </h2>
              <p className="text-xs text-slate-500">
                Lütfen başvurunuza başlamak için uçuş görevinizi seçiniz:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Kokpit Card */}
              <button
                type="button"
                onClick={() => handleSelectRole('kokpit')}
                className="group relative p-6 rounded-2xl border-2 border-slate-200 hover:border-talpa-gold-500 bg-white hover:bg-amber-50/30 transition-all text-left flex flex-col justify-between shadow-xs hover:shadow-lg cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-talpa-navy-900 text-talpa-gold-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Plane className="w-6 h-6 -rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-talpa-navy-950 group-hover:text-talpa-gold-600 transition-colors">
                      Kokpit Görevlisi (Pilot)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Kaptan & İkinci Pilotlar. TALPA üyeliği doğrulanarak işleme devam edilir.
                    </p>
                    <p className="text-sm font-bold text-talpa-navy-900 mt-3">Aylık ücret: 2.250 TL</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-talpa-navy-900 group-hover:text-talpa-gold-600">
                  <span>Seç ve Üyelik Sorgula</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* Kabin Card */}
              <button
                type="button"
                onClick={() => handleSelectRole('kabin')}
                className="group relative p-6 rounded-2xl border-2 border-slate-200 hover:border-talpa-navy-700 bg-white hover:bg-slate-50 transition-all text-left flex flex-col justify-between shadow-xs hover:shadow-lg cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-talpa-navy-800 text-slate-100 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-talpa-navy-950 group-hover:text-talpa-navy-700 transition-colors">
                      Kabin Görevlisi
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Kabin Ekibi Üyeleri. Doğrudan ek kontenjan başvuru formuna geçebilirsiniz.
                    </p>
                    <p className="text-sm font-bold text-talpa-navy-900 mt-3">Aylık ücret: 2.500 TL</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-talpa-navy-900 group-hover:text-talpa-navy-700">
                  <span>Forma Geç</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TALPA MEMBERSHIP VERIFICATION (For Kokpit) */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-talpa-navy-900 text-talpa-gold-400 flex items-center justify-center font-bold">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-talpa-navy-950">
                    TALPA Üyelik Doğrulama
                  </h2>
                  <p className="text-xs text-slate-500">Kokpit Görevlisi (Pilot) Başvurusu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Geri Dön
              </button>
            </div>

            {/* Non-Member Warning View */}
            {isTalpaMember === false && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-red-900 text-sm">TALPA Üyeliği Bulunamadı</h3>
                    <p className="text-xs text-red-700 leading-relaxed">
                      Girdiğiniz T.C. Kimlik Numarası aktif TALPA üyeleri arasında yer almamaktadır. Kokpit ek kontenjan hakkından yararlanabilmek için TALPA üyesi olmanız gerekmektedir.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={talpaRedirectUrl || 'https://www.talpa.org/uyelik/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <span>TALPA Üyelik Formu İçin Tıklayınız</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => { setIsTalpaMember(null); setVerifyTc(''); }}
                    className="px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              </div>
            )}

            {/* Verification Input Form */}
            {isTalpaMember !== false && (
              <form onSubmit={handleVerifyTalpa} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                    T.C. Kimlik Numarası
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={11}
                      value={verifyTc}
                      onChange={(e) => {
                        setVerifyTc(e.target.value.replace(/[^0-9]/g, ''));
                        if (verifyError) setVerifyError('');
                      }}
                      placeholder="11 haneli T.C. Kimlik Numaranız"
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-talpa-gold-400 focus:border-talpa-gold-500 transition-all"
                      autoFocus
                    />
                    <div className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-mono">
                      {verifyTc.length}/11
                    </div>
                  </div>
                </div>

                {verifyError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying || verifyTc.length !== 11}
                  className="w-full h-12 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {verifying ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-talpa-gold-400" />
                      <span>TALPA Üyeliği Sorgulanıyor...</span>
                    </div>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 text-talpa-gold-400" />
                      <span>TALPA Üyeliği Doğrula ve Devam Et</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 3: MAIN APPLICATION FORM */}
        {step === 3 && (
          <form onSubmit={handleSubmitForm} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-talpa-navy-950">
                  SAW Otopark Abonelik Talebi
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-talpa-navy-100 text-talpa-navy-900 px-2.5 py-0.5 rounded-md">
                    {role === 'kokpit' ? 'Kokpit Görevlisi (Pilot)' : 'Kabin Görevlisi'}
                  </span>
                  {isTalpaMember && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      TALPA Üyesi Doğrulandı
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Görev Değiştir
              </button>
            </div>

            {/* General Info Fields */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                1. Kişisel Bilgiler
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    İsim Soyisim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız ve Soyadınız"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    T.C. Kimlik Numarası <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={tc}
                    onChange={(e) => setTc(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="11 haneli TCKN"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    E-posta Adresi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@domain.com"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    Telefon Numarası <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* License Plate Input with Dynamic TR Plate Graphic */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                2. Plaka Bilgisi ve TR Plaka Görseli
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-800 mb-1.5">
                  Araç Plakası <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => {
                    const formatted = formatPlate(e.target.value);
                    setPlate(formatted);
                    setPlateConfirmed(false); // require re-confirm if edited
                  }}
                  placeholder="ör. 34 THY 1933"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-bold tracking-wider text-slate-950 uppercase focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                  required
                />
              </div>

              {/* Dynamic Live TR Plate Representation */}
              <div className="space-y-2 bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>TR Plaka Önizlemesi:</span>
                  <span className="text-[11px] text-slate-500 font-normal">Canlı Görsel</span>
                </div>

                <TRPlateVisual plateText={plate} />

                {/* Interactive Plate Confirmation Checkbox */}
                {plate.trim().length >= 5 && (
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-300 hover:border-talpa-gold-500 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={plateConfirmed}
                        onChange={(e) => setPlateConfirmed(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-talpa-gold-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Yazılan plakayı ({plate.toUpperCase()}) ekranda yeniden onaylıyorum. <span className="text-red-500">*</span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload Area */}
            {/* Subscription Start Date */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                3. Abonelik Başlangıcı
              </h3>
              <div>
                <p className="text-xs font-bold text-slate-800 mb-2">
                  Otopark aboneliğinin başlatılmasını istediğiniz tarihi seçiniz <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${startDateOption === 'next_month' ? 'border-talpa-gold-500 bg-amber-50' : 'border-slate-300 bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="startDateOption"
                      value="next_month"
                      checked={startDateOption === 'next_month'}
                      onChange={() => setStartDateOption('next_month')}
                      className="w-4 h-4 accent-talpa-gold-600"
                    />
                    <span className="text-sm font-semibold text-slate-800">Önümüzdeki ay başında</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${startDateOption === 'immediate' ? 'border-talpa-gold-500 bg-amber-50' : 'border-slate-300 bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="startDateOption"
                      value="immediate"
                      checked={startDateOption === 'immediate'}
                      onChange={() => setStartDateOption('immediate')}
                      className="w-4 h-4 accent-talpa-gold-600"
                    />
                    <span className="text-sm font-semibold text-slate-800">Hemen başlat</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Document Upload Area */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                4. Belge Yükleme (Ruhsat & Apron Kartı)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rectangular Ruhsat Upload Frame */}
                <RuhsatUploadFrame
                  value={ruhsatImage}
                  onChange={(base64) => setRuhsatImage(base64)}
                />

                {/* Apron Card Upload Frame */}
                <ApronUploadFrame
                  value={apronCardImage}
                  onChange={(base64) => setApronCardImage(base64)}
                />
              </div>
            </div>

            {/* Consents & Agreements */}
            {role === 'kabin' && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  5. Ödeme Bilgileri
                </h3>
                <PaymentCardVisual
                  cardNumber={paymentCardNumber}
                  cardholderName={paymentCardholderName}
                  expiryMonth={paymentExpiryMonth}
                  expiryYear={paymentExpiryYear}
                  cvv={paymentCvv}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">16 Haneli Kart Numarası <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={paymentCardNumber}
                      onChange={(e) => setPaymentCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="1234567890123456"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-semibold tracking-wider text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">Kart Sahibinin İsim Soyismi <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={paymentCardholderName}
                      onChange={(e) => setPaymentCardholderName(e.target.value.toLocaleUpperCase('tr-TR'))}
                      placeholder="AD SOYAD"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">Son Kullanma Ayı <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={paymentExpiryMonth}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                        if (value.length === 2 && (!/^(0[1-9]|1[0-2])$/.test(value) || (paymentExpiryYear.length === 2 && new Date(2000 + Number(paymentExpiryYear), Number(value), 0) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)))) {
                          setPaymentError('Geçmiş veya geçersiz bir son kullanma tarihi girilemez.');
                          return;
                        }
                        setPaymentExpiryMonth(value);
                        setPaymentError('');
                      }}
                      placeholder="AA"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">Son Kullanma Yılı <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={paymentExpiryYear}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                        if (value.length === 2 && paymentExpiryMonth.length === 2 && new Date(2000 + Number(value), Number(paymentExpiryMonth), 0) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) {
                          setPaymentError('Geçmiş bir son kullanma tarihi girilemez.');
                          return;
                        }
                        setPaymentExpiryYear(value);
                        setPaymentError('');
                      }}
                      placeholder="YY"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">CVV <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={3}
                      value={paymentCvv}
                      onChange={(e) => setPaymentCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="123"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-talpa-gold-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                {paymentError && <p className="text-xs font-medium text-red-600">{paymentError}</p>}
                <p className="text-[11px] text-slate-500">Aylık ücret: <strong>2.500 TL</strong>. CVV başvuru kaydında saklanmaz.</p>
              </div>
            )}

            <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                {role === 'kabin' ? '6.' : '5.'} Onamlar ve Yasal İzinler
              </h3>

              {/* KVKK Checkbox */}
              <div className="flex items-start justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kvkkAccepted}
                    onChange={(e) => setKvkkAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-talpa-navy-900 rounded"
                  />
                  <span className="text-slate-800 font-medium">
                    <strong className="text-slate-900">KVKK Aydınlatma Metnini</strong> okudum, kişisel verilerimin işlenmesini kabul ediyorum. <span className="text-red-500">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('kvkk')}
                  className="text-talpa-navy-800 hover:text-talpa-gold-600 font-semibold underline shrink-0 text-[11px]"
                >
                  Metni Oku
                </button>
              </div>

              {role === 'kokpit' && (
                <div className="flex items-start gap-2.5 text-xs bg-white p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={paymentConsentAccepted}
                    onChange={(e) => setPaymentConsentAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-talpa-navy-900 rounded"
                  />
                  <span className="text-slate-800 font-medium">
                    Aylık abonman bedelinin TALPA&apos;ya kayıtlı kartımdan alınmasını onaylıyorum. <span className="text-red-500">*</span>
                  </span>
                </div>
              )}

              {/* Explicit Consent Checkbox */}
              <div className="flex items-start justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={explicitConsentAccepted}
                    onChange={(e) => setExplicitConsentAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-talpa-navy-900 rounded"
                  />
                  <span className="text-slate-800 font-medium">
                    <strong className="text-slate-900">Açık Rıza Metnini</strong> okudum, onaylıyorum. <span className="text-red-500">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('explicit')}
                  className="text-talpa-navy-800 hover:text-talpa-gold-600 font-semibold underline shrink-0 text-[11px]"
                >
                  Metni Oku
                </button>
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-13 bg-gradient-to-r from-talpa-navy-950 via-talpa-navy-900 to-talpa-navy-800 hover:from-talpa-navy-900 hover:to-talpa-navy-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-talpa-gold-400" />
                  <span>Başvurunuz İletiliyor...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-talpa-gold-400" />
                  <span>SAW Otopark Ek Kontenjan Başvurusunu Tamamla</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS RESULT SCREEN */}
        {step === 4 && submittedApp && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10 space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Başvuru Alındı
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Talebiniz Başarıyla Kaydedildi!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                SAW Otopark Ek Kontenjan abonelik başvurunuz sistemimize ulaşmıştır. Onay bilgilendirmesi e-posta adresinize gönderilmiştir.
              </p>
            </div>

            {/* Reference Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 text-left max-w-md mx-auto space-y-3 shadow-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase text-slate-500">Referans Kodu:</span>
                <span className="font-mono text-base font-black text-talpa-navy-950 bg-talpa-gold-500/20 px-2.5 py-0.5 rounded border border-talpa-gold-400/40">
                  {submittedApp.referenceCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Ad Soyad:</span>
                  <strong className="text-slate-900 font-bold">{submittedApp.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Görev Unvanı:</span>
                  <strong className="text-slate-900 font-bold uppercase">
                    {submittedApp.role === 'kokpit' ? 'Kokpit Görevlisi' : 'Kabin Görevlisi'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Plaka:</span>
                  <strong className="text-slate-900 font-mono font-bold">{submittedApp.plate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">E-posta:</span>
                  <strong className="text-slate-900 font-bold truncate block">{submittedApp.email}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setName('');
                  setTc('');
                  setEmail('');
                  setPhone('');
                  setPlate('');
                  setPlateConfirmed(false);
                  setStartDateOption('');
                  setPaymentConsentAccepted(false);
                  setPaymentCardNumber('');
                  setPaymentCardholderName('');
                  setPaymentExpiryMonth('');
                  setPaymentExpiryYear('');
                  setPaymentCvv('');
                  setPaymentError('');
                  setRuhsatImage('');
                  setApronCardImage('');
                  setKvkkAccepted(false);
                  setExplicitConsentAccepted(false);
                  setIsTalpaMember(null);
                  setSubmittedApp(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                Yeni Başvuru Yap
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Consent Modals */}
      <ConsentModal
        isOpen={activeModal === 'kvkk'}
        onClose={() => setActiveModal(null)}
        title="KVKK Aydınlatma Metni"
        type="kvkk"
      />

      <ConsentModal
        isOpen={activeModal === 'explicit'}
        onClose={() => setActiveModal(null)}
        title="Açık Rıza Metni"
        type="explicit"
      />
    </div>
  );
}
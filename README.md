# 🚗 TALPA Otopark Asıl Plaka Belirleme ve Yönetim Sistemi

Bu web uygulaması; Türkiye Havayolu Pilotları Derneği (TALPA) kurumsal kimliğine ve [TALPA Danışmanlık](https://danisman.talpa.org/) tasarım standartlarına uygun olarak geliştirilmiştir.

Otopark bariyer sisteminde kayıtlı 2 plakası bulunan yaklaşık 800 üyenin/kullanıcının, 10 gün içerisinde sisteme T.C. Kimlik Numaraları (TCKN) ile giriş yaparak asıl kullanacakları plakayı seçmelerini veya yeni bir plaka tanımlamalarını sağlar. **Hiçbir işlem yapmayan üyelerin ise 1. Plakası otomatik olarak nihai asıl plaka olarak kaydedilir ve Excel dökümüne yansıtılır.**

---

## 🌟 Öne Çıkan Özellikler

1. **TALPA Kurumsal Tasarım Dili**:
   - Gece mavisi & lacivert gradyan başlıklar (`#0d1c36`, `#132949`, `#1b355a`)
   - Asil altın / bronz tonları (`#c8a97e`, `#967a5f`, `#f3ede4`)
   - Gerçekçi kabartmalı Türk Plaka bileşenleri (Mavi TR şeritli, EU/TR yıldız detaylı)
   - 10 günlük canlı geri sayım sayacı

2. **Kullanıcı Akışı**:
   - **T.C. Kimlik No ile Giriş**: 11 haneli TCKN kontrolü ve hızlı üye eşleştirme.
   - **Varsayılan Plaka 1 Seçimi**: Sistem açıldığında 1. Plaka otomatik olarak seçili gelir.
   - **2. Plaka Seçeneği**: Dileyen üye tek tıkla 2. Plakasını asıl plaka olarak belirleyebilir.
   - **Yeni / Özel Plaka Tanımlama**: Otomatik büyük harf ve Türkçe karakter formatlayıcı ile yeni plaka girişi ve anlık canlı önizleme.
   - **Sonuç ve Başvuru Dekontu**: Onay rozeti, referans kodu, PDF/Yazdırma dökümü ve seçim güncelleme imkanı.

3. **Yönetici & Excel Portalı (/admin)**:
   - **Şifre Korumalı**: Şifre sunucu tarafında `ADMIN_SECRET_KEY` ortam değişkeniyle doğrulanır; tüm `/api/admin/*` uçları bu anahtarı ister.
   - **Excel İçe Aktarma (Import)**: Elinizdeki Excel tablosunu (`İsim`, `TC`, `Plaka 1`, `Plaka 2`) sürükle-bırak yöntemiyle tek seferde sisteme yükleme.
   - **Canlı İstatistikler**: Toplam üye, seçim yapanlar, 1. plakayı seçenler, 2. plakayı seçenler, yeni plaka ekleyenler ve bekleyenler.
   - **Tek Tıkla Nihai Excel İndirme (Export)**: Tüm 800 kişinin kesinleşmiş tekil asıl plakalarını (işlem yapmayanların otomatik Plaka 1 değeri dahil) Excel (.xlsx) olarak indirme.

---

## 🚀 GitHub ve Vercel'de Yayınlama (Deploy Rehberi)

### Adım 1: Projeyi Git Deponuza Yükleyin
Proje klasöründe terminali açıp şu komutları çalıştırınız:

```bash
cd talpa-otopark
git init
git add .
git commit -m "feat: TALPA Otopark Plaka Belirleme Sistemi"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/talpa-otopark.git
git push -u origin main
```

### Adım 2: Vercel'e Bağlayın
1. [vercel.com](https://vercel.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2. **"Add New Project"** (Yeni Proje Ekle) butonuna tıklayın.
3. GitHub'a yüklediğiniz **talpa-otopark** reposunu seçin ve **"Import"** deyin.
4. **Framework Preset**: Next.js otomatik olarak algılanacaktır.
5. **"Deploy"** butonuna tıklayın! 1-2 dakika içinde projeniz canlıya alınacaktır.

---

## 💻 Yerel Geliştirme (Local Development)

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Tarayıcıda açın
http://localhost:3000
```

---

## 🔐 Yönetici Paneli Giriş Bilgileri
- **URL**: `/admin`
- **Şifre**: `ADMIN_SECRET_KEY` ortam değişkeninin değeri (varsayılan şifre yoktur; Vercel'de uzun ve rastgele bir değer tanımlayın)
- Oturum yalnızca açık sekmede tutulur (sessionStorage); sekme kapanınca yeniden giriş gerekir
- Kabin başvurularının kart numarası `PAYMENT_ENCRYPTION_KEY` ile şifreli saklanır ve yalnızca girişli yönetici tarafından görüntülenebilir; CVV saklanmaz

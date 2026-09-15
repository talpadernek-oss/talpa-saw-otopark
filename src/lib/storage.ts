import fs from 'fs';
import path from 'path';
import { ApplicationRecord, EmailSettings, AdminStats } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const EMAIL_SETTINGS_FILE = path.join(DATA_DIR, 'email-settings.json');

// Memory fallbacks for serverless environments (Vercel)
let memoryApplications: ApplicationRecord[] = [];
let memoryEmailSettings: EmailSettings | null = null;

// Initial seed applications
const SEED_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app-1',
    referenceCode: 'SAW-2026-98401',
    role: 'kokpit',
    tc: '12345678901',
    name: 'Kpt. Mehmet Yılmaz',
    email: 'mehmet.yilmaz@pilot.org',
    phone: '0532 111 2233',
    plate: '34 THY 1933',
    startDateOption: 'next_month',
    monthlyFee: 2250,
    kvkkAccepted: true,
    explicitConsentAccepted: true,
    isTalpaMember: true,
    status: 'approved',
    adminNotes: 'TALPA Üyeliği doğrulandı. Belgeler tam.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'app-2',
    referenceCode: 'SAW-2026-98402',
    role: 'kabin',
    tc: '98765432109',
    name: 'Ayşe Kaya',
    email: 'ayse.kaya@airline.com',
    phone: '0555 999 8877',
    plate: '06 KPT 404',
    startDateOption: 'immediate',
    monthlyFee: 2500,
    kvkkAccepted: true,
    explicitConsentAccepted: true,
    isTalpaMember: false,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'talpa@talpa.org',
  smtpHost: process.env.SMTP_HOST || 'smtp.office365.com',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || 'talpa@talpa.org',
  smtpPassConfigured: true,
  applicantConfirmationTemplate: {
    subject: 'SAW Otopark Ek Kontenjan Başvurunuz Alındı - {{REF_CODE}}',
    body: `Sayın {{NAME}},

Sabiha Gökçen Havalimanı (SAW) otopark ek kontenjan başvurunuz başarıyla alınmıştır.

Başvuru Detaylarınız:
-----------------------------
Referans Kodu: {{REF_CODE}}
Başvuru Türü: {{ROLE_TITLE}}
Plaka: {{PLATE}}
Başlangıç Tercihi: {{START_DATE}}
Aylık Ücret: {{MONTHLY_FEE}}
T.C. Kimlik No: {{TC}}
Tarih: {{DATE}}

Başvurunuz yetkililer tarafından incelenecek ve durum güncellendiğinde tarafınıza e-posta ile bilgi verilecektir.

Saygılarımızla,
Türkiye Havayolu Pilotları Derneği (TALPA)`
  },
  adminNotificationTemplate: {
    subject: 'Yeni SAW Otopark Ek Kontenjan Başvurusu - {{NAME}} ({{PLATE}})',
    body: `Sistemde Yeni Bir SAW Otopark Ek Kontenjan Başvurusu Oluşturuldu:

Başvuran Bilgileri:
-----------------------------
Ad Soyad: {{NAME}}
Görevi: {{ROLE_TITLE}}
T.C. Kimlik No: {{TC}}
E-posta: {{EMAIL}}
Telefon: {{PHONE}}
Plaka: {{PLATE}}
Abonelik Başlangıcı: {{START_DATE}}
Aylık Ücret: {{MONTHLY_FEE}}
TALPA Üyeliği: {{TALPA_STATUS}}
Referans Kodu: {{REF_CODE}}
Tarih: {{DATE}}

Yönetim panelinden başvuruyu inceleyebilirsiniz.`
  }
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Ignore error in read-only environment
  }
}

export function getApplications(): ApplicationRecord[] {
  try {
    ensureDataDir();
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const data = fs.readFileSync(APPLICATIONS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      memoryApplications = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn('Using memory storage for applications:', e);
  }

  if (memoryApplications.length === 0) {
    memoryApplications = [...SEED_APPLICATIONS];
    saveApplications(memoryApplications);
  }
  return memoryApplications;
}

export function saveApplications(apps: ApplicationRecord[]): boolean {
  memoryApplications = apps;
  try {
    ensureDataDir();
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('Could not write to applications.json file, stored in memory:', e);
    return false;
  }
}

export function addApplication(app: Omit<ApplicationRecord, 'id' | 'createdAt' | 'referenceCode' | 'status'>): ApplicationRecord {
  const apps = getApplications();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const newRecord: ApplicationRecord = {
    ...app,
    id: `app-${Date.now()}-${randomSuffix}`,
    referenceCode: `SAW-2026-${randomSuffix}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  apps.unshift(newRecord);
  saveApplications(apps);
  return newRecord;
}

export function updateApplicationStatus(id: string, status: 'pending' | 'approved' | 'rejected', adminNotes?: string): ApplicationRecord | null {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return null;

  apps[index] = {
    ...apps[index],
    status,
    adminNotes: adminNotes ?? apps[index].adminNotes,
    updatedAt: new Date().toISOString()
  };

  saveApplications(apps);
  return apps[index];
}

export function getEmailSettings(): EmailSettings {
  try {
    ensureDataDir();
    if (fs.existsSync(EMAIL_SETTINGS_FILE)) {
      const data = fs.readFileSync(EMAIL_SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      memoryEmailSettings = { ...DEFAULT_EMAIL_SETTINGS, ...parsed };
      return memoryEmailSettings!;
    }
  } catch (e) {
    console.warn('Using memory storage for email settings:', e);
  }

  if (!memoryEmailSettings) {
    memoryEmailSettings = { ...DEFAULT_EMAIL_SETTINGS };
    saveEmailSettings(memoryEmailSettings);
  }
  return memoryEmailSettings;
}

export function saveEmailSettings(settings: EmailSettings): boolean {
  memoryEmailSettings = settings;
  try {
    ensureDataDir();
    fs.writeFileSync(EMAIL_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('Could not write to email-settings.json file, stored in memory:', e);
    return false;
  }
}

export function getAdminStats(): AdminStats {
  const apps = getApplications();
  return {
    totalApplications: apps.length,
    kokpitCount: apps.filter(a => a.role === 'kokpit').length,
    kabinCount: apps.filter(a => a.role === 'kabin').length,
    pendingCount: apps.filter(a => a.status === 'pending').length,
    approvedCount: apps.filter(a => a.status === 'approved').length,
    rejectedCount: apps.filter(a => a.status === 'rejected').length,
    talpaMemberCount: apps.filter(a => a.isTalpaMember).length
  };
}
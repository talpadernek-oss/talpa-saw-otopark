import fs from 'fs';
import path from 'path';
import { put, get, list, del } from '@vercel/blob';
import { ApplicationRecord, EmailSettings, AdminStats } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const EMAIL_SETTINGS_FILE = path.join(DATA_DIR, 'email-settings.json');

// Vercel Blob (persistent storage on Vercel, where the filesystem is read-only).
// Enabled automatically when BLOB_READ_WRITE_TOKEN is present; otherwise the
// local JSON files under /data are used (local development).
const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_APPS_PREFIX = 'saw-otopark/applications/';
const BLOB_EMAIL_SETTINGS_PATH = 'saw-otopark/email-settings.json';
const BLOB_READ_CONCURRENCY = 25;

// Memory fallbacks for serverless environments without Blob configured
let memoryApplications: ApplicationRecord[] = [];
let memoryEmailSettings: EmailSettings | null = null;

export function isPersistentStorageConfigured(): boolean {
  return BLOB_ENABLED;
}

const appBlobPath = (id: string) => `${BLOB_APPS_PREFIX}${id}.json`;

async function blobReadJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as T;
}

async function blobWriteJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json'
  });
}

async function blobListApplications(): Promise<ApplicationRecord[]> {
  const pathnames: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: BLOB_APPS_PREFIX, cursor, limit: 1000 });
    pathnames.push(...page.blobs.map(b => b.pathname));
    cursor = page.cursor;
  } while (cursor);

  const apps: ApplicationRecord[] = [];
  for (let i = 0; i < pathnames.length; i += BLOB_READ_CONCURRENCY) {
    const chunk = pathnames.slice(i, i + BLOB_READ_CONCURRENCY);
    const records = await Promise.all(chunk.map(p => blobReadJson<ApplicationRecord>(p).catch(() => null)));
    apps.push(...records.filter((r): r is ApplicationRecord => Boolean(r)));
  }

  return apps.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

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
  // Sent to talpa@talpa.org for every application and used verbatim when an
  // application is forwarded to the parking operator (ruhsat image attached).
  adminNotificationTemplate: {
    subject: 'SAW Otopark Abonelik Kaydı Talebi - {{NAME}} ({{PLATE}})',
    body: `Sayın Yetkili,

Üyemiz {{NAME}} adına otoparkınıza {{PLATE}} plakalı aracı ile abonelik kaydı oluşturulmasını rica eder iyi çalışmalar dileriz.

Saygılarımızla,
Türkiye Havayolu Pilotları Derneği (TALPA)`
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

/* ------------------------------------------------------------------------
 * Local (file / memory) implementation
 * ---------------------------------------------------------------------- */

function readApplicationsFromFile(): ApplicationRecord[] {
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
    writeApplicationsToFile(memoryApplications);
  }
  return memoryApplications;
}

function writeApplicationsToFile(apps: ApplicationRecord[]): boolean {
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

function readEmailSettingsFromFile(): EmailSettings {
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
    writeEmailSettingsToFile(memoryEmailSettings);
  }
  return memoryEmailSettings;
}

function writeEmailSettingsToFile(settings: EmailSettings): boolean {
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

/* ------------------------------------------------------------------------
 * Public API (Blob when configured, otherwise file / memory)
 * ---------------------------------------------------------------------- */

export async function getApplications(): Promise<ApplicationRecord[]> {
  if (BLOB_ENABLED) return blobListApplications();
  return readApplicationsFromFile();
}

export async function getApplicationById(id: string): Promise<ApplicationRecord | null> {
  if (BLOB_ENABLED) return blobReadJson<ApplicationRecord>(appBlobPath(id));
  return readApplicationsFromFile().find(a => a.id === id) ?? null;
}

export async function addApplication(app: Omit<ApplicationRecord, 'id' | 'createdAt' | 'referenceCode' | 'status'>): Promise<ApplicationRecord> {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const newRecord: ApplicationRecord = {
    ...app,
    id: `app-${Date.now()}-${randomSuffix}`,
    referenceCode: `SAW-2026-${randomSuffix}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (BLOB_ENABLED) {
    await blobWriteJson(appBlobPath(newRecord.id), newRecord);
    return newRecord;
  }

  const apps = readApplicationsFromFile();
  apps.unshift(newRecord);
  writeApplicationsToFile(apps);
  return newRecord;
}

export async function updateApplicationStatus(id: string, status: 'pending' | 'approved' | 'rejected', adminNotes?: string): Promise<ApplicationRecord | null> {
  if (BLOB_ENABLED) {
    const existing = await blobReadJson<ApplicationRecord>(appBlobPath(id));
    if (!existing) return null;
    const updated: ApplicationRecord = {
      ...existing,
      status,
      adminNotes: adminNotes ?? existing.adminNotes,
      updatedAt: new Date().toISOString()
    };
    await blobWriteJson(appBlobPath(id), updated);
    return updated;
  }

  const apps = readApplicationsFromFile();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return null;

  apps[index] = {
    ...apps[index],
    status,
    adminNotes: adminNotes ?? apps[index].adminNotes,
    updatedAt: new Date().toISOString()
  };

  writeApplicationsToFile(apps);
  return apps[index];
}

export async function deleteApplication(id: string): Promise<boolean> {
  if (BLOB_ENABLED) {
    await del(appBlobPath(id));
    return true;
  }

  const apps = readApplicationsFromFile();
  const remaining = apps.filter(a => a.id !== id);
  if (remaining.length === apps.length) return false;
  return writeApplicationsToFile(remaining);
}

export function getDefaultEmailSettings(): EmailSettings {
  return { ...DEFAULT_EMAIL_SETTINGS };
}

export async function getEmailSettings(): Promise<EmailSettings> {
  if (BLOB_ENABLED) {
    try {
      const stored = await blobReadJson<Partial<EmailSettings>>(BLOB_EMAIL_SETTINGS_PATH);
      if (stored) return { ...DEFAULT_EMAIL_SETTINGS, ...stored };
    } catch (e) {
      console.warn('Could not read email settings from Blob, using defaults:', e);
    }
    return { ...DEFAULT_EMAIL_SETTINGS };
  }
  return readEmailSettingsFromFile();
}

export async function saveEmailSettings(settings: EmailSettings): Promise<boolean> {
  if (BLOB_ENABLED) {
    await blobWriteJson(BLOB_EMAIL_SETTINGS_PATH, settings);
    return true;
  }
  return writeEmailSettingsToFile(settings);
}

export async function getAdminStats(apps?: ApplicationRecord[]): Promise<AdminStats> {
  const records = apps ?? await getApplications();
  return {
    totalApplications: records.length,
    kokpitCount: records.filter(a => a.role === 'kokpit').length,
    kabinCount: records.filter(a => a.role === 'kabin').length,
    pendingCount: records.filter(a => a.status === 'pending').length,
    approvedCount: records.filter(a => a.status === 'approved').length,
    rejectedCount: records.filter(a => a.status === 'rejected').length,
    talpaMemberCount: records.filter(a => a.isTalpaMember).length
  };
}

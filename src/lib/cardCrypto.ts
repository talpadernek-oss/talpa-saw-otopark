import crypto from 'crypto';

/**
 * At-rest encryption for the applicant's card number (AES-256-GCM).
 *
 * The key is derived from PAYMENT_ENCRYPTION_KEY (preferred) or, failing that,
 * ADMIN_SECRET_KEY. Ciphertext is stored as "v1:<iv>:<tag>:<data>" (base64url).
 * CVV is intentionally never stored (PCI DSS).
 */

const KEY_SALT = 'talpa-saw-otopark-card-v1';
const FORMAT_VERSION = 'v1';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = process.env.PAYMENT_ENCRYPTION_KEY || process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    throw new Error('PAYMENT_ENCRYPTION_KEY (veya ADMIN_SECRET_KEY) tanımlı değil; kart bilgisi şifrelenemiyor.');
  }

  cachedKey = crypto.scryptSync(secret, KEY_SALT, 32);
  return cachedKey;
}

export function isCardEncryptionConfigured(): boolean {
  return Boolean(process.env.PAYMENT_ENCRYPTION_KEY || process.env.ADMIN_SECRET_KEY);
}

export function encryptCardNumber(cardNumber: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const data = Buffer.concat([cipher.update(cardNumber, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [FORMAT_VERSION, iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join(':');
}

export function decryptCardNumber(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(':');
  if (version !== FORMAT_VERSION || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Geçersiz şifreli kart verisi formatı.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8');
}

/** "4111111111111111" -> "4111 1111 1111 1111" */
export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

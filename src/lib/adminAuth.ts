import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_KEY_HEADER = 'x-admin-key';

/** Constant-time comparison of a candidate secret against ADMIN_SECRET_KEY. */
export function verifyAdminSecret(candidate: string): boolean {
  const expected = process.env.ADMIN_SECRET_KEY;
  if (!expected || !candidate) return false;

  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Server-side admin check: the request must carry the admin secret in the
 * x-admin-key header and it must match ADMIN_SECRET_KEY.
 */
export function isAdminRequest(req: NextRequest): boolean {
  return verifyAdminSecret(req.headers.get(ADMIN_KEY_HEADER) || '');
}

/** 401 response used by every /api/admin route when the header is missing or wrong. */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Yönetici doğrulaması başarısız. Lütfen yeniden giriş yapınız.' },
    { status: 401 }
  );
}

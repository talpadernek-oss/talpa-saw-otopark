import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_KEY_HEADER = 'x-admin-key';

/**
 * Server-side admin check: the request must carry the admin secret in the
 * x-admin-key header and it must match ADMIN_SECRET_KEY (constant-time compare).
 */
export function isAdminRequest(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET_KEY;
  const provided = req.headers.get(ADMIN_KEY_HEADER);
  if (!expected || !provided) return false;

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

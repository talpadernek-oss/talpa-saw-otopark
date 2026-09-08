/**
 * Turkish TCKN checksum algorithm validator
 */
export function isValidTCKN(tckn: string): boolean {
  if (!tckn || typeof tckn !== 'string') return false;
  const clean = tckn.trim();
  if (clean.length !== 11 || !/^[1-9][0-9]{10}$/.test(clean)) return false;

  const digits = clean.split('').map(Number);
  
  // Rule 1: Sum of odd placed digits (1st, 3rd, 5th, 7th, 9th) * 7 minus sum of even placed digits (2nd, 4th, 6th, 8th) mod 10 = 10th digit
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  
  const tenth = ((oddSum * 7) - evenSum) % 10;
  const tenthExpected = (tenth < 0 ? tenth + 10 : tenth);
  if (digits[9] !== tenthExpected) return false;

  // Rule 2: Sum of first 10 digits mod 10 = 11th digit
  const first10Sum = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  if (first10Sum % 10 !== digits[10]) return false;

  return true;
}

/**
 * Formats Turkish vehicle license plates
 * e.g. "34abc123" -> "34 ABC 123"
 */
export function formatPlate(raw: string): string {
  if (!raw) return '';
  let plate = raw
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase()
    .trim()
    .replace(/[^0-9A-ZÇĞİÖŞÜ]/g, '');

  if (!plate) return '';

  // Match standard Turkish plate format: 2 digits city code, 1-3 letters, 2-4 numbers
  const match = plate.match(/^(\d{2})([A-ZÇĞİÖŞÜ]{1,3})(\d{2,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  }

  return plate;
}

/**
 * Formats ISO date to readable Turkish date string
 */
export function formatTurkishDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}
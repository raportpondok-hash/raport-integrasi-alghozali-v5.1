/**
 * Utility functions for Eastern Arabic numerals and Arabic score word conversions (Tafqit).
 * Strictly matches the Pesantren / Pondok Modern Al-Ghozali style seen in Kasyfud Darajat.
 */

const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toEasternArabicNumerals(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return String(value)
    .split('')
    .map(char => {
      const digit = parseInt(char, 10);
      return !isNaN(digit) ? EASTERN_ARABIC_DIGITS[digit] : char;
    })
    .join('');
}

const ONES: Record<number, string> = {
  0: 'صفر',
  1: 'واحد',
  2: 'اثنان',
  3: 'ثلاث',
  4: 'أربع',
  5: 'خمس',
  6: 'ست',
  7: 'سبع',
  8: 'ثمان',
  9: 'تسع',
};

const TEENS: Record<number, string> = {
  10: 'عشرة',
  11: 'أحد عشر',
  12: 'اثنا عشر',
  13: 'ثلاثة عشر',
  14: 'أربعة عشر',
  15: 'خمسة عشر',
  16: 'ستة عشر',
  17: 'سبعة عشر',
  18: 'ثمانية عشر',
  19: 'تسعة عشر',
};

const TENS: Record<number, string> = {
  20: 'عشرون',
  30: 'ثلاثون',
  40: 'أربعون',
  50: 'خمسون',
  60: 'ستون',
  70: 'سبعون',
  80: 'ثمانون',
  90: 'تسعون',
};

/**
 * Converts a numeric score (0 to 100) into Arabic words as used in Kasyfud Darajat.
 * e.g. 45 -> "خمس و أربعون", 40 -> "أربعون", 62 -> "اثنان و ستون", 100 -> "مائة"
 */
export function numberToArabicWords(num: number): string {
  const n = Math.round(num);
  if (n === 100) return 'مائة';
  if (n < 0 || n > 100) return String(n);

  if (n <= 9) {
    return ONES[n];
  }
  if (n >= 10 && n <= 19) {
    return TEENS[n];
  }
  if (n % 10 === 0) {
    return TENS[n];
  }

  const tensPart = Math.floor(n / 10) * 10;
  const onesPart = n % 10;

  return `${ONES[onesPart]} و ${TENS[tensPart]}`;
}

const ORDINALS: Record<number, string> = {
  1: 'الأول',
  2: 'الثاني',
  3: 'الثالث',
  4: 'الرابع',
  5: 'الخامس',
  6: 'السادس',
  7: 'السابع',
  8: 'الثامن',
  9: 'التاسع',
  10: 'العاشر',
  11: 'الحادي عشر',
  12: 'الثاني عشر',
  13: 'الثالث عشر',
  14: 'الرابع عشر',
  15: 'الخامس عشر',
  16: 'السادس عشر',
  17: 'السابع عشر',
  18: 'الثامن عشر',
  19: 'التاسع عشر',
  20: 'العشرون',
  21: 'الواحد والعشرون',
  22: 'الثاني والعشرون',
  23: 'الثالث والعشرون',
  24: 'الرابع والعشرون',
  25: 'الخامس والعشرون',
  26: 'السادس والعشرون',
  27: 'السابع والعشرون',
  28: 'الثامن والعشرون',
  29: 'التاسع والعشرون',
  30: 'الثلاثون',
  31: 'الحادي والثلاثون',
  32: 'الثاني والثلاثون',
  33: 'الثالث والثلاثون',
  34: 'الرابع والثلاثون',
  35: 'الخامس والثلاثون',
  36: 'السادس والثلاثون',
  37: 'السابع والثلاثون',
  38: 'الثامن والثلاثون',
  39: 'التاسع والثلاثون',
  40: 'الأربعون',
};

export function rankToArabicOrdinal(rank: number): string {
  if (ORDINALS[rank]) return ORDINALS[rank];
  return `المرتبة ${toEasternArabicNumerals(rank)}`;
}

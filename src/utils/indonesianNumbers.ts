/**
 * Utility functions for Indonesian Number Words (Terbilang) & Grade Predicates
 * Specifically designed for Raport Full Day (Non-Mukim)
 */

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

/**
 * Converts a number (0-1000) to Indonesian formal capitalized words
 * e.g. 75 -> "Tujuh Puluh Lima"
 * e.g. 80 -> "Delapan Puluh"
 * e.g. 100 -> "Seratus"
 */
export function numberToIndonesianWords(n: number): string {
  const num = Math.round(n);
  if (num === 0) return 'Nol';
  if (num < 0) return `Minus ${numberToIndonesianWords(Math.abs(num))}`;

  if (num < 12) {
    return SATUAN[num];
  }
  if (num < 20) {
    return `${SATUAN[num - 10]} Belas`;
  }
  if (num < 100) {
    const sisa = num % 10;
    const puluhan = Math.floor(num / 10);
    return `${SATUAN[puluhan]} Puluh${sisa > 0 ? ` ${SATUAN[sisa]}` : ''}`;
  }
  if (num === 100) {
    return 'Seratus';
  }
  if (num < 200) {
    return `Seratus ${numberToIndonesianWords(num - 100)}`;
  }
  if (num < 1000) {
    const ratusan = Math.floor(num / 100);
    const sisa = num % 100;
    return `${SATUAN[ratusan]} Ratus${sisa > 0 ? ` ${numberToIndonesianWords(sisa)}` : ''}`;
  }
  if (num === 1000) {
    return 'Seribu';
  }
  return String(num);
}

/**
 * Returns the affective grade letter (A/B/C/D) based on score
 */
export function getAfektifLetter(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

/**
 * Predicate helper with label
 */
export function getPredicateIndonesian(score: number, kkm: number = 70): {
  grade: 'A' | 'B' | 'C' | 'D';
  label: string;
  status: 'Tuntas' | 'Belum Tuntas';
} {
  const isTuntas = score >= kkm;
  if (score >= 90) return { grade: 'A', label: 'Sangat Baik', status: 'Tuntas' };
  if (score >= 80) return { grade: 'A', label: 'Baik Sekali', status: 'Tuntas' };
  if (score >= kkm) return { grade: 'B', label: 'Baik', status: 'Tuntas' };
  if (score >= 60) return { grade: 'C', label: 'Cukup', status: isTuntas ? 'Tuntas' : 'Belum Tuntas' };
  return { grade: 'D', label: 'Kurang', status: 'Belum Tuntas' };
}

/**
 * Returns short abbreviation of subject name matching Image 1 official format
 * (e.g. Pendidikan Agama Islam -> PAI, Pendidikan Pancasila -> PANCASILA, Matematika -> MTK)
 */
export function getSubjectAbbreviation(nameId: string): string {
  const norm = (nameId || '').trim();
  const map: Record<string, string> = {
    'Pendidikan Agama dan Budi Pekerti': 'PAI',
    'Pendidikan Agama dan Budi Pekerti (PAI)': 'PAI',
    'Pendidikan Agama Islam': 'PAI',
    'PAI': 'PAI',
    'Pendidikan Pancasila': 'PANCASILA',
    'Pancasila': 'PANCASILA',
    'Pendidikan Pancasila dan Kewarganegaraan': 'PPKN',
    'Pendidikan Kewarganegaraan': 'PKN',
    'PKn': 'PKN',
    'Bahasa Indonesia': 'INDO',
    'Matematika': 'MTK',
    'Fisika (IPA)': 'FISIKA',
    'Fisika': 'FISIKA',
    'Kimia (IPA)': 'KIMIA',
    'Kimia': 'KIMIA',
    'Biologi (IPA)': 'BIOLOGI',
    'Biologi': 'BIOLOGI',
    'Sosiologi': 'SOSIO',
    'Ekonomi': 'EKO',
    'Sejarah': 'SEJ',
    'Sejarah Indonesia': 'SEJ',
    'Geografi': 'GEO',
    'Bahasa Inggris': 'INGGRIS',
    'PJOK': 'PJOK',
    'Pendidikan Jasmani dan Kesehatan': 'PJOK',
    'Pendidikan Jasmani, Olahragaa dan Kesehatan (PJOK)': 'PJOK',
    'Pendidikan Jasmani, Olahraga dan Kesehatan (PJOK)': 'PJOK',
    'Informatika': 'INFORM',
    'Seni Budaya': 'SBY',
    'Prakarya': 'PRAK',
    'SBY/PKWU (Life Skill)': 'SBY/PKWU',
    'Bahasa Sunda': 'SUNDA',
    'Basa Sunda (Muatan Lokal)': 'SUNDA',
    'Tahfiz': 'TAHFIZ',
    'TAHFIDZ': 'TAHFIDZ',
    'Tahfidz': 'TAHFIDZ',
    'AL QURAN': 'AL-QURAN',
    'Al Quran': 'AL-QURAN',
    "Al-Qur'an": 'AL-QURAN',
    'HADIS': 'HADIS',
    'Hadis': 'HADIS',
    'FIKIH': 'FIKIH',
    'Fikih': 'FIKIH',
    'BAHASA ARAB': 'B.ARAB',
    'Bahasa Arab': 'B.ARAB',
    'Ilmu Pengetahuan Alam': 'IPA',
    'Ilmu Pengetahuan Sosial': 'IPS',
    'Matematika Tingkat Lanjut': 'MTK TL',
    'Matematika Tingkat Lanjut (MTK TL)': 'MTK TL',
    'Life Skill': 'LIFE SKILL',
    'Antropologi': 'ANTRO',
  };
  return map[norm] || norm.toUpperCase().slice(0, 8);
}


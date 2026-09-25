/**
 * V5.1 — Google Sheets routing configuration.
 *
 * The four URLs below are the physical Google Spreadsheet roots supplied
 * for V5.1. They are NOT Apps Script Web App URLs.
 *
 * Mukim class labels are intentionally preserved exactly as provided.
 */

export const V51_SPREADSHEETS = {
  SMA_FULLDAY: {
    url: 'https://docs.google.com/spreadsheets/d/1o8eZD1ZRwYpyI6PpCJYu1z9aTuepGfaBw7k7fHV3bnM/edit?gid=0#gid=0',
    id: '1o8eZD1ZRwYpyI6PpCJYu1z9aTuepGfaBw7k7fHV3bnM',
  },
  SMP_FULLDAY: {
    url: 'https://docs.google.com/spreadsheets/d/1b1ucL5QYaqsUbLs2_gb01AIrs0IjROZM_J_fSsYfBkc/edit?gid=0#gid=0',
    id: '1b1ucL5QYaqsUbLs2_gb01AIrs0IjROZM_J_fSsYfBkc',
  },
  SMP_MUKIM: {
    url: 'https://docs.google.com/spreadsheets/d/1cnyu5kGQwQm1TQ37t1_iMoeEvQTgmoQTSv0StcWCpuM/edit?gid=0#gid=0',
    id: '1cnyu5kGQwQm1TQ37t1_iMoeEvQTgmoQTSv0StcWCpuM',
  },
  SMA_MUKIM: {
    url: 'https://docs.google.com/spreadsheets/d/1skr_nxM-C5Jj9jwOC1BIxsG7XZ_e3jmQRu0HEf4NcEs/edit?gid=0#gid=0',
    id: '1skr_nxM-C5Jj9jwOC1BIxsG7XZ_e3jmQRu0HEf4NcEs',
  },
} as const;

export type V51SchoolType = 'fullday' | 'mukim';
export type V51Unit = 'SMP' | 'SMA';
export type V51Program = 'UMUM' | 'IPA' | 'IPS';

export interface MukimClassContext {
  /** Stable application id; do not use display labels as IDs. */
  id: string;
  /** Exact display label from the supplied Mukim source. */
  name: string;
  unit: V51Unit;
  grade: string;
  program: V51Program;
}

export const MUKIM_CLASS_CONTEXTS: readonly MukimClassContext[] = [
  { id: 'mukim-smp-1', name: 'KELAS 1(VII   SMP)', unit: 'SMP', grade: 'VII', program: 'UMUM' },
  { id: 'mukim-smp-2', name: 'KELAS 2 (VIII   SMP)', unit: 'SMP', grade: 'VIII', program: 'UMUM' },
  { id: 'mukim-smp-3', name: 'KELAS 3 (IX   SMP)', unit: 'SMP', grade: 'IX', program: 'UMUM' },

  { id: 'mukim-sma-4', name: 'KELAS 4 (10   SMA)', unit: 'SMA', grade: 'X', program: 'UMUM' },
  { id: 'mukim-sma-5ipa', name: 'KELAS 5A+5C IPA   (11 SMA)', unit: 'SMA', grade: 'XI', program: 'IPA' },
  { id: 'mukim-sma-5ips', name: 'KELAS 5B+5D IPS   (11 SMA)', unit: 'SMA', grade: 'XI', program: 'IPS' },
  { id: 'mukim-sma-6ipa', name: 'KELAS 6A+6C-IPA   (12 SMA)', unit: 'SMA', grade: 'XII', program: 'IPA' },
  { id: 'mukim-sma-6ips', name: 'KELAS 6B+6D-IPS   (12 SMA)', unit: 'SMA', grade: 'XII', program: 'IPS' },

  { id: 'mukim-int-1', name: 'KELAS 1INT   (10 SMA)', unit: 'SMA', grade: 'X', program: 'UMUM' },
  { id: 'mukim-int-2ipa', name: 'KELAS 2INT   A-IPA (11 SMA)', unit: 'SMA', grade: 'XI', program: 'IPA' },
  { id: 'mukim-int-2ips', name: 'KELAS 2INT   B-IPS (11 SMA)', unit: 'SMA', grade: 'XI', program: 'IPS' },
  { id: 'mukim-int-3ipa', name: 'KELAS 3INT   A-IPA (12 SMA)', unit: 'SMA', grade: 'XII', program: 'IPA' },
  { id: 'mukim-int-3ips', name: 'KELAS 3INT   B-IPS (12 SMA)', unit: 'SMA', grade: 'XII', program: 'IPS' },
];

export function getV51SpreadsheetId(schoolType: V51SchoolType, unit: V51Unit): string {
  if (schoolType === 'fullday' && unit === 'SMP') return V51_SPREADSHEETS.SMP_FULLDAY.id;
  if (schoolType === 'fullday' && unit === 'SMA') return V51_SPREADSHEETS.SMA_FULLDAY.id;
  if (schoolType === 'mukim' && unit === 'SMP') return V51_SPREADSHEETS.SMP_MUKIM.id;
  return V51_SPREADSHEETS.SMA_MUKIM.id;
}

export function getMukimClassContext(nameOrId: string): MukimClassContext | undefined {
  const needle = String(nameOrId || '').trim();
  return MUKIM_CLASS_CONTEXTS.find((item) => item.id === needle || item.name === needle);
}

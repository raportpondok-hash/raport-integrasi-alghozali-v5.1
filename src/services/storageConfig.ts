import { SchoolType } from '../types';

export const STORAGE_KEY_SHEETS_URL = 'kasyfud_darajat_sheets_webapp_url';
export const STORAGE_KEY_SHEETS_URL_MUKIM = 'kasyfud_darajat_sheets_webapp_url_mukim';
export const STORAGE_KEY_SHEETS_URL_FULLDAY = 'kasyfud_darajat_sheets_webapp_url_fullday';
export const STORAGE_KEY_SHEETS_AUTOSYNC = 'kasyfud_darajat_sheets_autosync';
export const STORAGE_KEY_SHEETS_LAST_SYNC = 'kasyfud_darajat_sheets_last_sync';
export const STORAGE_KEY_SHEETS_LAST_SYNC_MUKIM = 'kasyfud_darajat_sheets_last_sync_mukim';
export const STORAGE_KEY_SHEETS_LAST_SYNC_FULLDAY = 'kasyfud_darajat_sheets_last_sync_fullday';

export const DEFAULT_SPREADSHEET_URL = (import.meta.env.VITE_GAS_WEB_APP_URL || '').trim();

function withRoutingParams(baseUrl: string, schoolType: SchoolType, unit: string, classId = ''): string {
  if (!baseUrl) return '';
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('schoolType', schoolType);
    url.searchParams.set('unit', unit || 'SMP');
    if (classId) url.searchParams.set('classId', classId);
    else url.searchParams.delete('classId');
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function getStoredSheetsUrl(schoolType: SchoolType = 'mukim', unit = 'SMP', classId = ''): string {
  try {
    if (schoolType === 'fullday') {
      const base = localStorage.getItem(STORAGE_KEY_SHEETS_URL_FULLDAY) || DEFAULT_SPREADSHEET_URL;
      return withRoutingParams(base, schoolType, unit, classId);
    }
    const base = localStorage.getItem(STORAGE_KEY_SHEETS_URL_MUKIM) || localStorage.getItem(STORAGE_KEY_SHEETS_URL) || DEFAULT_SPREADSHEET_URL;
    return withRoutingParams(base, schoolType, unit);
  } catch {
    return withRoutingParams(DEFAULT_SPREADSHEET_URL, schoolType, unit, classId);
  }
}

export function saveStoredSheetsUrl(url: string, schoolType: SchoolType = 'mukim'): void {
  try {
    let cleanUrl = url.trim();
    try {
      const parsed = new URL(cleanUrl);
      parsed.searchParams.delete('schoolType');
      parsed.searchParams.delete('unit');
      parsed.searchParams.delete('classId');
      cleanUrl = parsed.toString();
    } catch {}
    if (schoolType === 'fullday') {
      localStorage.setItem(STORAGE_KEY_SHEETS_URL_FULLDAY, cleanUrl);
    } else {
      localStorage.setItem(STORAGE_KEY_SHEETS_URL_MUKIM, cleanUrl);
      localStorage.setItem(STORAGE_KEY_SHEETS_URL, cleanUrl);
    }
  } catch {}
}

export function getStoredLastSync(schoolType: SchoolType = 'mukim'): string {
  try {
    if (schoolType === 'fullday') return localStorage.getItem(STORAGE_KEY_SHEETS_LAST_SYNC_FULLDAY) || '';
    return localStorage.getItem(STORAGE_KEY_SHEETS_LAST_SYNC_MUKIM) || localStorage.getItem(STORAGE_KEY_SHEETS_LAST_SYNC) || '';
  } catch { return ''; }
}

export function saveStoredLastSync(timeStr: string, schoolType: SchoolType = 'mukim'): void {
  try {
    if (schoolType === 'fullday') {
      localStorage.setItem(STORAGE_KEY_SHEETS_LAST_SYNC_FULLDAY, timeStr);
    } else {
      localStorage.setItem(STORAGE_KEY_SHEETS_LAST_SYNC_MUKIM, timeStr);
      localStorage.setItem(STORAGE_KEY_SHEETS_LAST_SYNC, timeStr);
    }
  } catch {}
}

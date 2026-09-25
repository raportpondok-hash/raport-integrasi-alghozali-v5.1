const STORAGE_KEY_SHEETS_URL = 'raport_v51_sma_mukim_gas_url';
const STORAGE_KEY_SHEETS_AUTOSYNC = 'raport_v51_sma_mukim_autosync';
const STORAGE_KEY_SHEETS_LAST_SYNC = 'raport_v51_sma_mukim_last_sync';

export const DEFAULT_SPREADSHEET_URL = (import.meta.env.VITE_GAS_WEB_APP_URL || '').trim();

export function getStoredSheetsUrl(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY_SHEETS_URL) || DEFAULT_SPREADSHEET_URL).trim();
  } catch {
    return DEFAULT_SPREADSHEET_URL;
  }
}

export function saveStoredSheetsUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS_URL, url.trim());
  } catch {}
}

export function getStoredLastSync(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_SHEETS_LAST_SYNC) || '';
  } catch {
    return '';
  }
}

export function saveStoredLastSync(timeStr: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS_LAST_SYNC, timeStr);
  } catch {}
}

export function getStoredAutoSync(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_SHEETS_AUTOSYNC) === 'true';
  } catch {
    return false;
  }
}

export function saveStoredAutoSync(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS_AUTOSYNC, enabled ? 'true' : 'false');
  } catch {}
}

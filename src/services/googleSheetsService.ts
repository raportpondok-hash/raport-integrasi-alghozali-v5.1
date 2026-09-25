/**
 * Google Sheets service — V5.1 SMA MUKIM only.
 *
 * Source of truth: each class Spreadsheet -> REKAP.
 * No SMP, Full Day, batch legacy sync, or local score persistence.
 */

import {
  DEFAULT_SPREADSHEET_URL,
  STORAGE_KEY_SHEETS_URL,
  STORAGE_KEY_SHEETS_AUTOSYNC,
  STORAGE_KEY_SHEETS_LAST_SYNC,
  getStoredSheetsUrl,
  saveStoredSheetsUrl,
  getStoredLastSync,
  saveStoredLastSync,
} from './storageConfig';

export {
  DEFAULT_SPREADSHEET_URL,
  STORAGE_KEY_SHEETS_URL,
  STORAGE_KEY_SHEETS_AUTOSYNC,
  STORAGE_KEY_SHEETS_LAST_SYNC,
  getStoredSheetsUrl,
  saveStoredSheetsUrl,
  getStoredLastSync,
  saveStoredLastSync,
} from './storageConfig';

function getAdminSessionTokenLocal(): string {
  try { return sessionStorage.getItem('raport_admin_session_token') || ''; } catch { return ''; }
}

function getTeacherSessionTokenLocal(): string {
  try { return sessionStorage.getItem('raport_teacher_session_token') || ''; } catch { return ''; }
}

export interface GoogleSheetsSyncResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp?: string;
}

/**
 * Backend source used by the V5.1 SMA Mukim setup modal.
 * The deployed Apps Script source of truth is backend/Code.gs.
 */
export const GOOGLE_APPS_SCRIPT_CODE = "/**\n * RAPORT INTEGRASI PONDOK V5.1\n * Backend khusus sementara: SMA MUKIM.\n *\n * Sumber nilai utama:\n *   Google Spreadsheet kelas masing-masing -> sheet REKAP\n *\n * Setiap kelas SMA MUKIM memiliki Spreadsheet sendiri.\n * Frontend hanya mengirim identitas siswa + mapel + nilai.\n * Backend mencari baris siswa dan kolom mapel pada sheet REKAP,\n * lalu menulis nilai langsung ke kolom mata pelajaran tersebut.\n */\n\nconst CFG = {\n  UNIT: 'SMA',\n  SCHOOL_TYPE: 'mukim',\n  RAW_SHEET: 'Data_Nilai_Raport',\n  TTL: 21600,\n};\n\nconst SMA_MUKIM_SPREADSHEETS = {\n  '1inta': '1zv4P8ZeFzrbpITHAh_zuZvc8MqY5fwr9yod_KMLPH8s',\n  '1intb': '1ogGhkS-aW_NG7hDUV5DGB6VssFrILVd6xuFowpq6NVs',\n  '2int-a': '1j1VCU11TYhzF2lW10XZBK6x3Dcc2JTExRBbgvKUBiws',\n  '2int-b': '1-kSTdSKmMYVYAQLE43ktr6NECtrthQPjNHBILULtmsY',\n  '3int-a': '1hfvskRTvET19oBpGwmvhEwlPjaZHFxSK_wqFd16q6c4',\n  '3int-b': '1Acz4zajHHv6fmT_VOKhUufJVv88d6OqPoleCVYNsKfI',\n  '4a': '1Q2_Cd7OaxPpXE3CAA_t6zFGr-kM4esEFlZ55-WQVMvs',\n  '4b': '1XmPgKJ7XymyjeJJglAnX9jyaARAmqC-T6cA0rLcj3RE',\n  '4c': '1g4t5ygN7EUtN6Czz0ie16yS5oRWRUnNnStb49gfppOQ',\n  '5a': '1O6X1U6WMvRFP9YrroQwCcGzkyWNmwchwL13SY2NiIaA',\n  '5b': '1FVELBPfYuSEEIvFpKnj1JEBcc_4CFmK5RU8raXBH9k8',\n  '5c': '1b4OOUz_MGPqBFwtqQM2BIZ1_JxhmQRBYYwMaEHV_W1U',\n  '5d': '1UVSAWHT6PtnRiqbQzJjN7P1MfhdND3rdrxah9d2UKbU',\n  '6a': '1xFg0gEFQIpA8BRuNzW0IKI626xP4OWTWS7ZONpFVD_0',\n  '6b': '1Chk7cTP01A3hFggmGttCUEfUgWCaV1k7miD_vK-ba1s',\n  '6c': '1bDV-OEHVPc-pmHFgFIsiDP9cwT0vgwv_FBiR1DTH12M',\n  '6d': '1z-uWUEiyZ9dFRxl9wK2igvsYsEcGh_6NLZuWc5ZtfHc',\n};\n\nfunction doGet(e) { return api_(e); }\nfunction doPost(e) { return api_(e); }\n\nfunction api_(e) {\n  const lock = LockService.getScriptLock();\n  lock.waitLock(10000);\n  try {\n    const p = parse_(e);\n    const action = String(p.action || 'health');\n\n    if (action === 'health' || action === 'test') {\n      return out_({\n        status: 'success',\n        success: true,\n        unit: CFG.UNIT,\n        schoolType: CFG.SCHOOL_TYPE,\n        timestamp: new Date().toISOString(),\n      });\n    }\n\n    if (action === 'verifyAdmin') return admin_(p);\n    if (action === 'verifyTeacherPin') return teacher_(p);\n\n    if (action === 'readScores' || action === 'getAll') {\n      auth_(p);\n      return read_(p);\n    }\n\n    if (action === 'updateScore') {\n      auth_(p);\n      return write_(p);\n    }\n\n    return out_({\n      status: 'error',\n      success: false,\n      message: 'Action tidak dikenal: ' + action,\n    });\n  } catch (err) {\n    return out_({\n      status: 'error',\n      success: false,\n      message: String(err.message || err),\n    });\n  } finally {\n    lock.releaseLock();\n  }\n}\n\nfunction parse_(e) {\n  if (e && e.postData && e.postData.contents) {\n    try {\n      return JSON.parse(e.postData.contents);\n    } catch (_) {}\n  }\n  return e && e.parameter || {};\n}\n\nfunction ps_() {\n  return PropertiesService.getScriptProperties();\n}\n\nfunction hash_(value) {\n  return Utilities.computeDigest(\n    Utilities.DigestAlgorithm.SHA_256,\n    String(value),\n    Utilities.Charset.UTF_8\n  ).map(function(b) {\n    b = b < 0 ? b + 256 : b;\n    return ('0' + b.toString(16)).slice(-2);\n  }).join('');\n}\n\nfunction nk_(value) {\n  return String(value || '')\n    .trim()\n    .replace(/\\s+/g, ' ')\n    .toUpperCase();\n}\n\nfunction pk_(name, unit, role) {\n  return 'TEACHER_PIN_' +\n    nk_(name).replace(/[^A-Z0-9]+/g, '_') + '_' +\n    String(unit || 'SMA').toUpperCase() + '_' +\n    String(role || 'guru').toLowerCase();\n}\n\nfunction setAdminPin(pin) {\n  if (String(pin).length < 6) {\n    throw new Error('PIN admin minimal 6 karakter');\n  }\n  ps_().setProperty('ADMIN_PIN_SHA256', hash_(pin));\n  return 'OK';\n}\n\nfunction setTeacherPin(name, unit, role, pin) {\n  if (String(unit).toUpperCase() !== 'SMA') {\n    throw new Error('Hanya SMA');\n  }\n  if (!/^\\d{4,12}$/.test(String(pin))) {\n    throw new Error('PIN harus 4-12 digit');\n  }\n  ps_().setProperty(pk_(name, unit, role), hash_(pin));\n  return 'OK';\n}\n\nfunction admin_(p) {\n  const hash = ps_().getProperty('ADMIN_PIN_SHA256') || '';\n  if (!hash) {\n    return out_({\n      status: 'error',\n      success: false,\n      message: 'ADMIN PIN belum dikonfigurasi',\n    });\n  }\n\n  if (hash_(String(p.pin || '')) !== hash) {\n    return out_({ status: 'success', success: false });\n  }\n\n  return session_('admin', 'admin');\n}\n\nfunction teacher_(p) {\n  const unit = String(p.unit || '').toUpperCase();\n  const role = String(p.role || 'guru').toLowerCase();\n  const name = String(p.teacherName || '').trim();\n\n  if (unit !== 'SMA') {\n    return out_({\n      status: 'success',\n      success: false,\n      message: 'SMP belum diaktifkan',\n    });\n  }\n\n  const hash = ps_().getProperty(pk_(name, unit, role)) || '';\n\n  if (!hash || hash_(String(p.pin || '')) !== hash) {\n    return out_({\n      status: 'success',\n      success: false,\n      authenticated: false,\n    });\n  }\n\n  return session_(name, role);\n}\n\nfunction session_(id, role) {\n  const token = Utilities.getUuid();\n\n  CacheService.getScriptCache().put(\n    'RAPORT_V51_' + token,\n    JSON.stringify({\n      id: id,\n      role: role,\n      unit: 'SMA',\n      schoolType: 'mukim',\n    }),\n    CFG.TTL\n  );\n\n  return out_({\n    status: 'success',\n    success: true,\n    authenticated: true,\n    sessionToken: token,\n    expiresInSeconds: CFG.TTL,\n  });\n}\n\nfunction auth_(p) {\n  const token = String(\n    p.adminSessionToken || p.teacherSessionToken || ''\n  ).trim();\n\n  if (!token) {\n    throw new Error('Sesi login tidak ditemukan');\n  }\n\n  const value =\n    CacheService.getScriptCache().get('RAPORT_V51_' + token);\n\n  if (!value) {\n    throw new Error('Sesi login sudah berakhir');\n  }\n\n  return JSON.parse(value);\n}\n\nfunction scope_(p) {\n  if (String(p.unit || 'SMA').toUpperCase() !== 'SMA') {\n    throw new Error('Backend hanya menerima Pondok SMA');\n  }\n\n  if (String(p.schoolType || 'mukim').toLowerCase() !== 'mukim') {\n    throw new Error('Backend hanya menerima Pondok Mukim SMA');\n  }\n}\n\nfunction normalizeClassId_(classId) {\n  const raw = String(classId || '').trim().toLowerCase();\n\n  const aliases = {\n    '1int-a': '1inta',\n    '1intb': '1intb',\n    '1int-b': '1intb',\n    '2inta': '2int-a',\n    '2intb': '2int-b',\n    '3inta': '3int-a',\n    '3intb': '3int-b',\n  };\n\n  return aliases[raw] || raw;\n}\n\nfunction getSpreadsheetId_(classId) {\n  const key = normalizeClassId_(classId);\n  const id = SMA_MUKIM_SPREADSHEETS[key];\n\n  if (!id) {\n    throw new Error(\n      'Spreadsheet SMA MUKIM belum dipetakan untuk classId: ' + classId\n    );\n  }\n\n  return id;\n}\n\nfunction getTargetSpreadsheet_(classId) {\n  return SpreadsheetApp.openById(getSpreadsheetId_(classId));\n}\n\n/**\n * Normalisasi nama untuk pencocokan header mapel dan nama santri.\n * Tidak mengubah teks asli di spreadsheet.\n */\nfunction norm_(value) {\n  return String(value || '')\n    .replace(/[\\r\\n]+/g, ' ')\n    .replace(/\\s+/g, ' ')\n    .trim()\n    .toUpperCase();\n}\n\nfunction same_(a, b) {\n  return norm_(a) === norm_(b);\n}\n\n/**\n * Cari sheet REKAP. Fallback hanya jika workbook ternyata masih memakai\n * variasi kapitalisasi/trim.\n */\nfunction getRekapSheet_(ss) {\n  const exact = ss.getSheetByName('REKAP');\n  if (exact) return exact;\n\n  const sheets = ss.getSheets();\n  for (let i = 0; i < sheets.length; i++) {\n    if (norm_(sheets[i].getName()) === 'REKAP') {\n      return sheets[i];\n    }\n  }\n\n  throw new Error(\n    'Sheet REKAP tidak ditemukan pada Spreadsheet: ' + ss.getName()\n  );\n}\n\n/**\n * Mencari baris header utama berdasarkan NAMA/NISN.\n * Workbook acuan memiliki header pada area atas sheet.\n */\nfunction findHeaderRow_(values) {\n  const maxRows = Math.min(values.length, 15);\n\n  for (let r = 0; r < maxRows; r++) {\n    let hasName = false;\n    let hasIdentity = false;\n\n    for (let c = 0; c < values[r].length; c++) {\n      const cell = norm_(values[r][c]);\n      if (cell === 'NAMA') hasName = true;\n      if (cell === 'NISN' || cell === 'NIS') hasIdentity = true;\n    }\n\n    if (hasName && hasIdentity) return r;\n  }\n\n  for (let r = 0; r < maxRows; r++) {\n    for (let c = 0; c < values[r].length; c++) {\n      if (norm_(values[r][c]) === 'NAMA') return r;\n    }\n  }\n\n  throw new Error('Baris header NAMA tidak ditemukan di sheet REKAP');\n}\n\nfunction findColumn_(values, headerRow, candidates) {\n  const maxRows = Math.min(values.length, headerRow + 1);\n\n  for (let c = 0; c < values[headerRow].length; c++) {\n    for (let r = 0; r < maxRows; r++) {\n      const cell = norm_(values[r][c]);\n      for (let i = 0; i < candidates.length; i++) {\n        if (cell === norm_(candidates[i])) return c;\n      }\n    }\n  }\n\n  return -1;\n}\n\n/**\n * Cari kolom mata pelajaran di area header.\n * subjectName adalah nama mapel yang dikirim frontend.\n */\nfunction findSubjectColumn_(values, subjectName) {\n  const maxRows = Math.min(values.length, 12);\n  const target = norm_(subjectName);\n\n  if (!target) return -1;\n\n  // Exact match terlebih dahulu.\n  for (let c = 0; c < (values[0] || []).length; c++) {\n    for (let r = 0; r < maxRows; r++) {\n      if (norm_(values[r][c]) === target) return c;\n    }\n  }\n\n  // Fallback aman untuk variasi tanda baca/label.\n  const compactTarget = target.replace(/[^A-Z0-9]/g, '');\n  for (let c = 0; c < (values[0] || []).length; c++) {\n    for (let r = 0; r < maxRows; r++) {\n      const compactCell = norm_(values[r][c]).replace(/[^A-Z0-9]/g, '');\n      if (compactCell && compactCell === compactTarget) return c;\n    }\n  }\n\n  return -1;\n}\n\nfunction findStudentRow_(values, headerRow, nameCol, nisnCol, p) {\n  const targetNisn = norm_(p.nisn);\n  const targetName = norm_(p.studentName);\n\n  // NISN adalah kunci utama jika tersedia.\n  if (nisnCol >= 0 && targetNisn) {\n    for (let r = headerRow + 1; r < values.length; r++) {\n      if (norm_(values[r][nisnCol]) === targetNisn) return r;\n    }\n  }\n\n  // Fallback nama.\n  if (nameCol >= 0 && targetName) {\n    for (let r = headerRow + 1; r < values.length; r++) {\n      if (norm_(values[r][nameCol]) === targetName) return r;\n    }\n  }\n\n  return -1;\n}\n\n/**\n * Baca nilai langsung dari kolom-kolom mapel pada REKAP.\n * Kunci siswa dikembalikan dengan NISN dan nama agar frontend dapat\n * mencocokkan dengan master siswa tanpa menyimpan nilai secara permanen.\n */\nfunction read_(p) {\n  scope_(p);\n\n  const classId = String(p.classId || '').trim();\n  if (!classId) throw new Error('classId wajib untuk membaca nilai');\n\n  const ss = getTargetSpreadsheet_(classId);\n  const sheet = getRekapSheet_(ss);\n  const values = sheet.getDataRange().getDisplayValues();\n\n  if (!values.length) {\n    return out_({\n      status: 'success',\n      success: true,\n      classId: classId,\n      studentsScores: {},\n      rowCount: 0,\n    });\n  }\n\n  const headerRow = findHeaderRow_(values);\n  const nameCol = findColumn_(values, headerRow, ['NAMA']);\n  const nisnCol = findColumn_(values, headerRow, ['NISN', 'NIS']);\n\n  if (nameCol < 0) {\n    throw new Error('Kolom NAMA tidak ditemukan di REKAP');\n  }\n\n  const subjectColumns = {};\n\n  // Ambil semua teks header yang bukan identitas/rekap statistik.\n  for (let c = 0; c < values[0].length; c++) {\n    let subjectName = '';\n\n    for (let r = 0; r <= headerRow; r++) {\n      const cell = String(values[r][c] || '').trim();\n      if (!cell) continue;\n\n      const n = norm_(cell);\n\n      if (\n        n !== 'NO' &&\n        n !== 'NAMA' &&\n        n !== 'NISN' &&\n        n !== 'NIS' &&\n        n !== 'KELAS' &&\n        n !== 'JUMLAH' &&\n        n !== 'RATA-RATA' &&\n        n !== 'RATA2' &&\n        n !== 'RANKING' &&\n        n !== 'PERINGKAT' &&\n        n !== 'KETERANGAN'\n      ) {\n        // Ambil label paling spesifik di area header.\n        subjectName = cell;\n      }\n    }\n\n    if (subjectName) {\n      subjectColumns[c] = subjectName;\n    }\n  }\n\n  const result = {};\n  let rowCount = 0;\n\n  for (let r = headerRow + 1; r < values.length; r++) {\n    const name = String(values[r][nameCol] || '').trim();\n    const nisn = nisnCol >= 0 ? String(values[r][nisnCol] || '').trim() : '';\n\n    if (!name && !nisn) continue;\n\n    const scores = {};\n\n    Object.keys(subjectColumns).forEach(function(colKey) {\n      const c = Number(colKey);\n      const value = String(values[r][c] || '').trim();\n\n      if (value !== '' && isFinite(Number(value))) {\n        scores[subjectColumns[c]] = Number(value);\n      }\n    });\n\n    if (Object.keys(scores).length === 0) continue;\n\n    if (nisn) result[nisn] = scores;\n    if (name) result[norm_(name).toLowerCase()] = scores;\n\n    rowCount++;\n  }\n\n  return out_({\n    status: 'success',\n    success: true,\n    unit: CFG.UNIT,\n    schoolType: CFG.SCHOOL_TYPE,\n    classId: classId,\n    spreadsheetId: ss.getId(),\n    spreadsheetName: ss.getName(),\n    studentsScores: result,\n    rowCount: rowCount,\n    timestamp: new Date().toISOString(),\n  });\n}\n\n/**\n * Tulis nilai langsung ke kolom mata pelajaran pada REKAP.\n * Tidak membuat kolom mapel baru secara otomatis.\n * Jika mapel tidak ditemukan, operasi ditolak agar tidak salah kolom.\n */\nfunction write_(p) {\n  scope_(p);\n\n  const classId = String(p.classId || '').trim();\n  const subjectName = String(p.subjectName || '').trim();\n  const score = Number(p.score);\n\n  if (!classId || !subjectName) {\n    throw new Error('classId dan subjectName wajib');\n  }\n\n  if (!isFinite(score) || score < 0 || score > 100) {\n    throw new Error('Nilai harus 0-100');\n  }\n\n  const ss = getTargetSpreadsheet_(classId);\n  const sheet = getRekapSheet_(ss);\n  const values = sheet.getDataRange().getDisplayValues();\n\n  const headerRow = findHeaderRow_(values);\n  const nameCol = findColumn_(values, headerRow, ['NAMA']);\n  const nisnCol = findColumn_(values, headerRow, ['NISN', 'NIS']);\n\n  const subjectCol = findSubjectColumn_(values, subjectName);\n\n  if (subjectCol < 0) {\n    throw new Error(\n      'Kolom mata pelajaran \"' + subjectName +\n      '\" tidak ditemukan di REKAP ' + ss.getName()\n    );\n  }\n\n  const studentRow = findStudentRow_(\n    values,\n    headerRow,\n    nameCol,\n    nisnCol,\n    p\n  );\n\n  if (studentRow < 0) {\n    throw new Error(\n      'Santri \"' + String(p.studentName || '') +\n      '\" (NISN: ' + String(p.nisn || '-') +\n      ') tidak ditemukan di REKAP ' + ss.getName()\n    );\n  }\n\n  // Tulis tepat ke sel mapel siswa.\n  sheet.getRange(studentRow + 1, subjectCol + 1).setValue(score);\n\n  // Audit trail terpisah agar setiap perubahan tetap terlacak.\n  const raw = getRawSheet_(ss);\n  raw.appendRow([\n    new Date(),\n    classId,\n    p.studentId || '',\n    p.studentName || '',\n    p.nisn || '',\n    p.subjectId || '',\n    subjectName,\n    score,\n    p.teacherName || '',\n    p.role || '',\n  ]);\n\n  SpreadsheetApp.flush();\n\n  return out_({\n    status: 'success',\n    success: true,\n    saved: true,\n    unit: CFG.UNIT,\n    schoolType: CFG.SCHOOL_TYPE,\n    classId: classId,\n    spreadsheetId: ss.getId(),\n    spreadsheetName: ss.getName(),\n    sheetName: sheet.getName(),\n    row: studentRow + 1,\n    column: subjectCol + 1,\n    subjectName: subjectName,\n    score: score,\n    updatedAt: new Date().toISOString(),\n  });\n}\n\nfunction getRawSheet_(ss) {\n  let sheet = ss.getSheetByName(CFG.RAW_SHEET);\n\n  if (!sheet) {\n    sheet = ss.insertSheet(CFG.RAW_SHEET);\n    sheet.getRange(1, 1, 1, 10).setValues([[\n      'Timestamp',\n      'Class ID',\n      'Student ID',\n      'Nama Santri',\n      'NISN',\n      'Subject ID',\n      'Nama Mapel',\n      'Nilai',\n      'Guru',\n      'Role',\n    ]]);\n    sheet.setFrozenRows(1);\n  }\n\n  return sheet;\n}\n\nfunction out_(value) {\n  return ContentService\n    .createTextOutput(JSON.stringify(value))\n    .setMimeType(ContentService.MimeType.JSON);\n}\n";

function validUrl(url: string): boolean {
  return Boolean(url && /^https?:\/\//i.test(url.trim()));
}

async function parseResponse(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { status: 'error', success: false, message: text || `HTTP ${res.status}` }; }
}

export async function testGoogleSheetsConnection(webAppUrl: string): Promise<GoogleSheetsSyncResult> {
  if (!validUrl(webAppUrl)) return { success: false, message: 'URL Apps Script belum diatur.' };
  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'health');
    url.searchParams.set('_ts', String(Date.now()));
    const res = await fetch(url.toString(), { method: 'GET', mode: 'cors', cache: 'no-store' });
    const json = await parseResponse(res);
    if (!res.ok || json.success !== true) {
      return { success: false, message: json.message || `HTTP Error: ${res.status}` };
    }
    return { success: true, message: 'Backend SMA Mukim terhubung.', data: json, timestamp: json.timestamp };
  } catch (err: any) {
    return { success: false, message: `Gagal mengakses Apps Script: ${err?.message || String(err)}` };
  }
}

export async function fetchAllScoresFromSheets(webAppUrl: string): Promise<{
  success: boolean;
  message: string;
  studentsScores?: Record<string, Record<string, number>>;
  rowCount?: number;
}> {
  return {
    success: false,
    message: 'V5.1 membaca nilai berdasarkan kelas yang sedang dibuka. Gunakan fetchScoresForClassFromSheets().',
  };
}

export async function fetchScoresForClassFromSheets(
  webAppUrl: string,
  classId: string
): Promise<{ success: boolean; message: string; studentsScores?: Record<string, Record<string, number>>; rowCount?: number }> {
  if (!validUrl(webAppUrl)) return { success: false, message: 'URL Apps Script belum diatur.' };
  if (!classId) return { success: false, message: 'classId wajib.' };

  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'readScores');
    url.searchParams.set('unit', 'SMA');
    url.searchParams.set('schoolType', 'mukim');
    url.searchParams.set('classId', classId);
    const adminToken = getAdminSessionTokenLocal();
    const teacherToken = getTeacherSessionTokenLocal();
    if (adminToken) url.searchParams.set('adminSessionToken', adminToken);
    if (teacherToken) url.searchParams.set('teacherSessionToken', teacherToken);
    url.searchParams.set('_ts', String(Date.now()));

    const res = await fetch(url.toString(), { method: 'GET', mode: 'cors', cache: 'no-store' });
    const json = await parseResponse(res);
    if (!res.ok || json.status !== 'success') {
      return { success: false, message: json.message || `HTTP Error: ${res.status}` };
    }
    return {
      success: true,
      message: 'Nilai kelas berhasil dimuat dari REKAP.',
      studentsScores: json.studentsScores || {},
      rowCount: Number(json.rowCount || 0),
    };
  } catch (err: any) {
    return { success: false, message: `Error koneksi: ${err?.message || String(err)}` };
  }
}

export async function saveSingleScoreToSheets(
  webAppUrl: string,
  payload: {
    studentId: string;
    studentNo?: number;
    classId: string;
    studentName: string;
    nisn: string;
    subjectId: string;
    score: number;
    subjectName?: string;
    className?: string;
    teacherName?: string;
    waliKelas?: string;
    role?: 'guru' | 'wali_kelas' | 'admin';
  }
): Promise<GoogleSheetsSyncResult> {
  if (!validUrl(webAppUrl)) return { success: false, message: 'URL Apps Script belum diatur.' };

  try {
    const body = JSON.stringify({
      action: 'updateScore',
      unit: 'SMA',
      schoolType: 'mukim',
      adminSessionToken: getAdminSessionTokenLocal(),
      teacherSessionToken: getTeacherSessionTokenLocal(),
      role: payload.role || 'guru',
      ...payload,
    });

    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    const json = await parseResponse(res);

    if (!res.ok || json.status !== 'success') {
      return { success: false, message: json.message || `HTTP Error: ${res.status}`, data: json };
    }

    return {
      success: true,
      message: 'Nilai berhasil disimpan langsung ke kolom mapel pada REKAP.',
      data: json,
      timestamp: json.updatedAt || json.timestamp,
    };
  } catch (err: any) {
    return { success: false, message: `Gagal menyimpan nilai: ${err?.message || String(err)}` };
  }
}

/**
 * Legacy UI compatibility. V5.1 deliberately does not perform bulk score writes:
 * every grade must go through the same single-score validation path.
 */
export async function batchSyncAllToSheets(): Promise<GoogleSheetsSyncResult> {
  return { success: false, message: 'Sinkronisasi massal dinonaktifkan pada V5.1. Gunakan input nilai per sel.' };
}

export async function saveMultipleScoresToSheets(): Promise<GoogleSheetsSyncResult> {
  return { success: false, message: 'Penyimpanan massal dinonaktifkan pada V5.1. Gunakan input nilai per sel.' };
}

export async function initAllClassSheetsInGoogleSheets(): Promise<GoogleSheetsSyncResult> {
  return { success: false, message: 'Struktur Spreadsheet V5.1 dikelola dari workbook kelas, bukan dibuat dari frontend.' };
}

export async function fetchAllSikapFromSheets(): Promise<{ success: boolean; message: string; sikap?: Record<string, { classId: string; sikap: string }> }> {
  return { success: false, message: 'Modul sikap tidak termasuk alur input nilai V5.1.' };
}

export async function saveMultipleSikapToSheets(): Promise<GoogleSheetsSyncResult> {
  return { success: false, message: 'Modul sikap tidak termasuk alur input nilai V5.1.' };
}

/**
 * RAPORT INTEGRASI PONDOK V5.1
 * Backend khusus sementara: SMA MUKIM.
 *
 * Sumber nilai utama:
 *   Google Spreadsheet kelas masing-masing -> sheet REKAP
 *
 * Setiap kelas SMA MUKIM memiliki Spreadsheet sendiri.
 * Frontend hanya mengirim identitas siswa + mapel + nilai.
 * Backend mencari baris siswa dan kolom mapel pada sheet REKAP,
 * lalu menulis nilai langsung ke kolom mata pelajaran tersebut.
 */

const CFG = {
  UNIT: 'SMA',
  SCHOOL_TYPE: 'mukim',
  RAW_SHEET: 'Data_Nilai_Raport',
  TTL: 21600,
};

const SMA_MUKIM_SPREADSHEETS = {
  '1inta': '1zv4P8ZeFzrbpITHAh_zuZvc8MqY5fwr9yod_KMLPH8s',
  '1intb': '1ogGhkS-aW_NG7hDUV5DGB6VssFrILVd6xuFowpq6NVs',
  '2int-a': '1j1VCU11TYhzF2lW10XZBK6x3Dcc2JTExRBbgvKUBiws',
  '2int-b': '1-kSTdSKmMYVYAQLE43ktr6NECtrthQPjNHBILULtmsY',
  '3int-a': '1hfvskRTvET19oBpGwmvhEwlPjaZHFxSK_wqFd16q6c4',
  '3int-b': '1Acz4zajHHv6fmT_VOKhUufJVv88d6OqPoleCVYNsKfI',
  '4a': '1Q2_Cd7OaxPpXE3CAA_t6zFGr-kM4esEFlZ55-WQVMvs',
  '4b': '1XmPgKJ7XymyjeJJglAnX9jyaARAmqC-T6cA0rLcj3RE',
  '5a': '1O6X1U6WMvRFP9YrroQwCcGzkyWNmwchwL13SY2NiIaA',
  '5b': '1FVELBPfYuSEEIvFpKnj1JEBcc_4CFmK5RU8raXBH9k8',
  '5c': '1b4OOUz_MGPqBFwtqQM2BIZ1_JxhmQRBYYwMaEHV_W1U',
  '5d': '1UVSAWHT6PtnRiqbQzJjN7P1MfhdND3rdrxah9d2UKbU',
  '6a': '1xFg0gEFQIpA8BRuNzW0IKI626xP4OWTWS7ZONpFVD_0',
  '6b': '1Chk7cTP01A3hFggmGttCUEfUgWCaV1k7miD_vK-ba1s',
  '6c': '1bDV-OEHVPc-pmHFgFIsiDP9cwT0vgwv_FBiR1DTH12M',
  '6d': '1z-uWUEiyZ9dFRxl9wK2igvsYsEcGh_6NLZuWc5ZtfHc',
};

function doGet(e) { return api_(e); }
function doPost(e) { return api_(e); }

function api_(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = parse_(e);
    const action = String(p.action || 'health');

    if (action === 'health' || action === 'test') {
      return out_({
        status: 'success',
        success: true,
        unit: CFG.UNIT,
        schoolType: CFG.SCHOOL_TYPE,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'verifyAdmin') return admin_(p);
    if (action === 'verifyTeacherPin') return teacher_(p);

    if (action === 'readScores' || action === 'getAll') {
      auth_(p);
      return read_(p);
    }

    if (action === 'updateScore') {
      auth_(p);
      return write_(p);
    }

    return out_({
      status: 'error',
      success: false,
      message: 'Action tidak dikenal: ' + action,
    });
  } catch (err) {
    return out_({
      status: 'error',
      success: false,
      message: String(err.message || err),
    });
  } finally {
    lock.releaseLock();
  }
}

function parse_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {}
  }
  return e && e.parameter || {};
}

function ps_() {
  return PropertiesService.getScriptProperties();
}

function hash_(value) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  ).map(function(b) {
    b = b < 0 ? b + 256 : b;
    return ('0' + b.toString(16)).slice(-2);
  }).join('');
}

function nk_(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function pk_(name, unit, role) {
  return 'TEACHER_PIN_' +
    nk_(name).replace(/[^A-Z0-9]+/g, '_') + '_' +
    String(unit || 'SMA').toUpperCase() + '_' +
    String(role || 'guru').toLowerCase();
}

function setAdminPin(pin) {
  if (String(pin).length < 6) {
    throw new Error('PIN admin minimal 6 karakter');
  }
  ps_().setProperty('ADMIN_PIN_SHA256', hash_(pin));
  return 'OK';
}

function setTeacherPin(name, unit, role, pin) {
  if (String(unit).toUpperCase() !== 'SMA') {
    throw new Error('Hanya SMA');
  }
  if (!/^\d{4,12}$/.test(String(pin))) {
    throw new Error('PIN harus 4-12 digit');
  }
  ps_().setProperty(pk_(name, unit, role), hash_(pin));
  return 'OK';
}

function admin_(p) {
  const hash = ps_().getProperty('ADMIN_PIN_SHA256') || '';
  if (!hash) {
    return out_({
      status: 'error',
      success: false,
      message: 'ADMIN PIN belum dikonfigurasi',
    });
  }

  if (hash_(String(p.pin || '')) !== hash) {
    return out_({ status: 'success', success: false });
  }

  return session_('admin', 'admin');
}

function teacher_(p) {
  const unit = String(p.unit || '').toUpperCase();
  const role = String(p.role || 'guru').toLowerCase();
  const name = String(p.teacherName || '').trim();

  if (unit !== 'SMA') {
    return out_({
      status: 'success',
      success: false,
      message: 'SMP belum diaktifkan',
    });
  }

  const hash = ps_().getProperty(pk_(name, unit, role)) || '';

  if (!hash || hash_(String(p.pin || '')) !== hash) {
    return out_({
      status: 'success',
      success: false,
      authenticated: false,
    });
  }

  return session_(name, role);
}

function session_(id, role) {
  const token = Utilities.getUuid();

  CacheService.getScriptCache().put(
    'RAPORT_V51_' + token,
    JSON.stringify({
      id: id,
      role: role,
      unit: 'SMA',
      schoolType: 'mukim',
    }),
    CFG.TTL
  );

  return out_({
    status: 'success',
    success: true,
    authenticated: true,
    sessionToken: token,
    expiresInSeconds: CFG.TTL,
  });
}

function auth_(p) {
  const token = String(
    p.adminSessionToken || p.teacherSessionToken || ''
  ).trim();

  if (!token) {
    throw new Error('Sesi login tidak ditemukan');
  }

  const value =
    CacheService.getScriptCache().get('RAPORT_V51_' + token);

  if (!value) {
    throw new Error('Sesi login sudah berakhir');
  }

  return JSON.parse(value);
}

function scope_(p) {
  if (String(p.unit || 'SMA').toUpperCase() !== 'SMA') {
    throw new Error('Backend hanya menerima Pondok SMA');
  }

  if (String(p.schoolType || 'mukim').toLowerCase() !== 'mukim') {
    throw new Error('Backend hanya menerima Pondok Mukim SMA');
  }
}

function normalizeClassId_(classId) {
  const raw = String(classId || '').trim().toLowerCase();

  const aliases = {
    '1int-a': '1inta',
    '1intb': '1intb',
    '1int-b': '1intb',
    '2inta': '2int-a',
    '2intb': '2int-b',
    '3inta': '3int-a',
    '3intb': '3int-b',
  };

  return aliases[raw] || raw;
}

function getSpreadsheetId_(classId) {
  const key = normalizeClassId_(classId);
  const id = SMA_MUKIM_SPREADSHEETS[key];

  if (!id) {
    throw new Error(
      'Spreadsheet SMA MUKIM belum dipetakan untuk classId: ' + classId
    );
  }

  return id;
}

function getTargetSpreadsheet_(classId) {
  return SpreadsheetApp.openById(getSpreadsheetId_(classId));
}

/**
 * Normalisasi nama untuk pencocokan header mapel dan nama santri.
 * Tidak mengubah teks asli di spreadsheet.
 */
function norm_(value) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function same_(a, b) {
  return norm_(a) === norm_(b);
}

/**
 * Cari sheet REKAP. Fallback hanya jika workbook ternyata masih memakai
 * variasi kapitalisasi/trim.
 */
function getRekapSheet_(ss) {
  const exact = ss.getSheetByName('REKAP');
  if (exact) return exact;

  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (norm_(sheets[i].getName()) === 'REKAP') {
      return sheets[i];
    }
  }

  throw new Error(
    'Sheet REKAP tidak ditemukan pada Spreadsheet: ' + ss.getName()
  );
}

/**
 * Mencari baris header utama berdasarkan NAMA/NISN.
 * Workbook acuan memiliki header pada area atas sheet.
 */
function findHeaderRow_(values) {
  const maxRows = Math.min(values.length, 15);

  for (let r = 0; r < maxRows; r++) {
    let hasName = false;
    let hasIdentity = false;

    for (let c = 0; c < values[r].length; c++) {
      const cell = norm_(values[r][c]);
      if (cell === 'NAMA') hasName = true;
      if (cell === 'NISN' || cell === 'NIS') hasIdentity = true;
    }

    if (hasName && hasIdentity) return r;
  }

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < values[r].length; c++) {
      if (norm_(values[r][c]) === 'NAMA') return r;
    }
  }

  throw new Error('Baris header NAMA tidak ditemukan di sheet REKAP');
}

function findColumn_(values, headerRow, candidates) {
  const maxRows = Math.min(values.length, headerRow + 1);

  for (let c = 0; c < values[headerRow].length; c++) {
    for (let r = 0; r < maxRows; r++) {
      const cell = norm_(values[r][c]);
      for (let i = 0; i < candidates.length; i++) {
        if (cell === norm_(candidates[i])) return c;
      }
    }
  }

  return -1;
}

/**
 * Cari kolom mata pelajaran di area header.
 * subjectName adalah nama mapel yang dikirim frontend.
 */
function findSubjectColumn_(values, subjectName) {
  const maxRows = Math.min(values.length, 12);
  const target = norm_(subjectName);

  if (!target) return -1;

  // Exact match terlebih dahulu.
  for (let c = 0; c < (values[0] || []).length; c++) {
    for (let r = 0; r < maxRows; r++) {
      if (norm_(values[r][c]) === target) return c;
    }
  }

  // Fallback aman untuk variasi tanda baca/label.
  const compactTarget = target.replace(/[^A-Z0-9]/g, '');
  for (let c = 0; c < (values[0] || []).length; c++) {
    for (let r = 0; r < maxRows; r++) {
      const compactCell = norm_(values[r][c]).replace(/[^A-Z0-9]/g, '');
      if (compactCell && compactCell === compactTarget) return c;
    }
  }

  return -1;
}

function findStudentRow_(values, headerRow, nameCol, nisnCol, p) {
  const targetNisn = norm_(p.nisn);
  const targetName = norm_(p.studentName);

  // NISN adalah kunci utama jika tersedia.
  if (nisnCol >= 0 && targetNisn) {
    for (let r = headerRow + 1; r < values.length; r++) {
      if (norm_(values[r][nisnCol]) === targetNisn) return r;
    }
  }

  // Fallback nama.
  if (nameCol >= 0 && targetName) {
    for (let r = headerRow + 1; r < values.length; r++) {
      if (norm_(values[r][nameCol]) === targetName) return r;
    }
  }

  return -1;
}

/**
 * Baca nilai langsung dari kolom-kolom mapel pada REKAP.
 * Kunci siswa dikembalikan dengan NISN dan nama agar frontend dapat
 * mencocokkan dengan master siswa tanpa menyimpan nilai secara permanen.
 */
function read_(p) {
  scope_(p);

  const classId = String(p.classId || '').trim();
  if (!classId) throw new Error('classId wajib untuk membaca nilai');

  const ss = getTargetSpreadsheet_(classId);
  const sheet = getRekapSheet_(ss);
  const values = sheet.getDataRange().getDisplayValues();

  if (!values.length) {
    return out_({
      status: 'success',
      success: true,
      classId: classId,
      studentsScores: {},
      rowCount: 0,
    });
  }

  const headerRow = findHeaderRow_(values);
  const nameCol = findColumn_(values, headerRow, ['NAMA']);
  const nisnCol = findColumn_(values, headerRow, ['NISN', 'NIS']);

  if (nameCol < 0) {
    throw new Error('Kolom NAMA tidak ditemukan di REKAP');
  }

  const subjectColumns = {};

  // Ambil semua teks header yang bukan identitas/rekap statistik.
  for (let c = 0; c < values[0].length; c++) {
    let subjectName = '';

    for (let r = 0; r <= headerRow; r++) {
      const cell = String(values[r][c] || '').trim();
      if (!cell) continue;

      const n = norm_(cell);

      if (
        n !== 'NO' &&
        n !== 'NAMA' &&
        n !== 'NISN' &&
        n !== 'NIS' &&
        n !== 'KELAS' &&
        n !== 'JUMLAH' &&
        n !== 'RATA-RATA' &&
        n !== 'RATA2' &&
        n !== 'RANKING' &&
        n !== 'PERINGKAT' &&
        n !== 'KETERANGAN'
      ) {
        // Ambil label paling spesifik di area header.
        subjectName = cell;
      }
    }

    if (subjectName) {
      subjectColumns[c] = subjectName;
    }
  }

  const result = {};
  let rowCount = 0;

  for (let r = headerRow + 1; r < values.length; r++) {
    const name = String(values[r][nameCol] || '').trim();
    const nisn = nisnCol >= 0 ? String(values[r][nisnCol] || '').trim() : '';

    if (!name && !nisn) continue;

    const scores = {};

    Object.keys(subjectColumns).forEach(function(colKey) {
      const c = Number(colKey);
      const value = String(values[r][c] || '').trim();

      if (value !== '' && isFinite(Number(value))) {
        scores[subjectColumns[c]] = Number(value);
      }
    });

    if (Object.keys(scores).length === 0) continue;

    if (nisn) result[nisn] = scores;
    if (name) result[norm_(name).toLowerCase()] = scores;

    rowCount++;
  }

  return out_({
    status: 'success',
    success: true,
    unit: CFG.UNIT,
    schoolType: CFG.SCHOOL_TYPE,
    classId: classId,
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    studentsScores: result,
    rowCount: rowCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Tulis nilai langsung ke kolom mata pelajaran pada REKAP.
 * Tidak membuat kolom mapel baru secara otomatis.
 * Jika mapel tidak ditemukan, operasi ditolak agar tidak salah kolom.
 */
function write_(p) {
  scope_(p);

  const classId = String(p.classId || '').trim();
  const subjectName = String(p.subjectName || '').trim();
  const score = Number(p.score);

  if (!classId || !subjectName) {
    throw new Error('classId dan subjectName wajib');
  }

  if (!isFinite(score) || score < 0 || score > 100) {
    throw new Error('Nilai harus 0-100');
  }

  const ss = getTargetSpreadsheet_(classId);
  const sheet = getRekapSheet_(ss);
  const values = sheet.getDataRange().getDisplayValues();

  const headerRow = findHeaderRow_(values);
  const nameCol = findColumn_(values, headerRow, ['NAMA']);
  const nisnCol = findColumn_(values, headerRow, ['NISN', 'NIS']);

  const subjectCol = findSubjectColumn_(values, subjectName);

  if (subjectCol < 0) {
    throw new Error(
      'Kolom mata pelajaran "' + subjectName +
      '" tidak ditemukan di REKAP ' + ss.getName()
    );
  }

  const studentRow = findStudentRow_(
    values,
    headerRow,
    nameCol,
    nisnCol,
    p
  );

  if (studentRow < 0) {
    throw new Error(
      'Santri "' + String(p.studentName || '') +
      '" (NISN: ' + String(p.nisn || '-') +
      ') tidak ditemukan di REKAP ' + ss.getName()
    );
  }

  // Tulis tepat ke sel mapel siswa.
  sheet.getRange(studentRow + 1, subjectCol + 1).setValue(score);

  // Audit trail terpisah agar setiap perubahan tetap terlacak.
  const raw = getRawSheet_(ss);
  raw.appendRow([
    new Date(),
    classId,
    p.studentId || '',
    p.studentName || '',
    p.nisn || '',
    p.subjectId || '',
    subjectName,
    score,
    p.teacherName || '',
    p.role || '',
  ]);

  SpreadsheetApp.flush();

  return out_({
    status: 'success',
    success: true,
    saved: true,
    unit: CFG.UNIT,
    schoolType: CFG.SCHOOL_TYPE,
    classId: classId,
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    sheetName: sheet.getName(),
    row: studentRow + 1,
    column: subjectCol + 1,
    subjectName: subjectName,
    score: score,
    updatedAt: new Date().toISOString(),
  });
}

function getRawSheet_(ss) {
  let sheet = ss.getSheetByName(CFG.RAW_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(CFG.RAW_SHEET);
    sheet.getRange(1, 1, 1, 10).setValues([[
      'Timestamp',
      'Class ID',
      'Student ID',
      'Nama Santri',
      'NISN',
      'Subject ID',
      'Nama Mapel',
      'Nilai',
      'Guru',
      'Role',
    ]]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function out_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

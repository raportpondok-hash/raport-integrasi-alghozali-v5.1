/**
 * Excel Grading Helpers:
 * 1. Download styled Excel template for single subject & multi-subject classes.
 * 2. Parse and import uploaded Excel files (.xlsx, .xls, .csv) with smart matching.
 */

import * as XLSX from 'xlsx';
import { CalculatedStudent, Subject, ClassItem, SchoolConfig } from '../types';
import { generateModernExcel, colIndexToLetter } from './excelModernStyler';

export interface ParseSubjectScoreResult {
  success: boolean;
  message: string;
  updates: { studentId: string; studentName: string; score: number }[];
  skipped: string[];
  errors: string[];
  unmatched: string[];
  totalRowsProcessed: number;
}

export interface ParseClassMultiSubjectResult {
  success: boolean;
  message: string;
  updates: { studentId: string; studentName: string; scores: Record<string, number> }[];
  errors: string[];
  unmatched: string[];
  detectedSubjects: { id: string; nameId: string; colIndex: number }[];
}

/**
 * 1. Unduh Template Excel (.xlsx) Resmi untuk 1 Mata Pelajaran & Kelas.
 * Memuat identitas sekolah, daftar lengkap santri di kelas, dan kolom "Nilai" yang di-highlight.
 */
export function downloadSubjectTemplateExcel(params: {
  students: CalculatedStudent[];
  subject: Subject;
  currentClass: ClassItem;
  assignedTeachers?: string[];
  waliKelas?: string;
}): void {
  const { students, subject, currentClass, assignedTeachers = [], waliKelas = '-' } = params;

  const safeMapel = subject.nameId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeKelas = currentClass.nameLatin.replace(/[^a-zA-Z0-9_-]/g, '_');

  const rows = students.map((std, idx) => {
    const currentScore = std.scores[subject.id];
    return [
      idx + 1,
      std.id,
      std.nisn || '-',
      std.name,
      currentClass.nameLatin,
      subject.nameId,
      typeof currentScore === 'number' && !isNaN(currentScore) ? currentScore : '',
    ];
  });

  generateModernExcel({
    sheetName: 'Template Nilai',
    bannerTitle: 'YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI',
    subtitle: 'TEMPLATE INPUT NILAI SANTRI (UPLOAD EXCEL)',
    metaRows: [
      { label: 'Mata Pelajaran:', value: `${subject.nameId} (${subject.nameAr})`, labelCol: 0, valueCol: 1 },
      { label: 'Kelas:', value: currentClass.nameLatin, labelCol: 0, valueCol: 1 },
      { label: 'Kode Mapel:', value: subject.id, labelCol: 0, valueCol: 1 },
      { label: 'Guru Pengampu:', value: assignedTeachers.join(', ') || '-', labelCol: 0, valueCol: 1 },
      { label: 'Wali Kelas:', value: currentClass.waliKelasName || waliKelas, labelCol: 0, valueCol: 1 },
    ],
    instruction:
      'PETUNJUK: Masukkan nilai angka (0 s.d. 100) pada kolom "Nilai" (kolom warna kuning). ' +
      'Jangan mengubah kolom "ID Santri" & "NISN" agar sistem dapat mencocokkan data santri secara akurat.',
    tableHeaders: ['No', 'ID Santri', 'NISN', 'Nama Lengkap Santri', 'Kelas', 'Mata Pelajaran', 'Nilai'],
    tableHeaderAligns: ['center', 'center', 'center', 'left', 'center', 'center', 'center'],
    highlightColIndex: 6, // Highlight kolom 'Nilai'
    rows,
    colWidths: [6, 16, 18, 34, 18, 26, 14],
    fileName: `Template_Nilai_${safeMapel}_${safeKelas}.xlsx`,
  });
}

/**
 * Normalizes string for fuzzy matching (lowercase, strip extra spaces & punctuation).
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 2. Parse File Excel Hasil Upload untuk 1 Mata Pelajaran.
 * Mendukung file dari:
 * - Template Resmi (memiliki kolom: ID Santri, NISN, Nama Santri, Nilai)
 * - Hasil Export Excel Sebelumnya (memiliki kolom: NISN, Nama Lengkap Santri, Nilai Angka)
 * - Format CSV / Spreadsheet umum dengan kolom nilai.
 */
export async function parseSubjectScoreExcel(
  file: File,
  expectedSubjectId: string,
  studentsInClass: CalculatedStudent[]
): Promise<ParseSubjectScoreResult> {
  const updates: { studentId: string; studentName: string; score: number }[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const unmatched: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        message: 'File Excel tidak memiliki lembar kerja (worksheet).',
        updates: [],
        skipped: [],
        errors: ['File kosong atau format rusak.'],
        unmatched: [],
        totalRowsProcessed: 0,
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawRows.length === 0) {
      return {
        success: false,
        message: 'Lembar kerja Excel kosong.',
        updates: [],
        skipped: [],
        errors: ['Tidak ada data ditemukan pada file.'],
        unmatched: [],
        totalRowsProcessed: 0,
      };
    }

    // Cari baris header tabel
    let headerRowIndex = -1;
    let idCol = -1;
    let nisnCol = -1;
    let nameCol = -1;
    let scoreCol = -1;

    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const rowStr = row.map((c) => String(c || '').toLowerCase().trim());

      const foundScore = rowStr.findIndex((c) =>
        c === 'nilai' ||
        c === 'nilai angka' ||
        c === 'score' ||
        c === 'nilai akhir' ||
        c === 'angka' ||
        c.startsWith('nilai')
      );

      const foundName = rowStr.findIndex((c) =>
        c === 'nama' ||
        c === 'nama santri' ||
        c === 'nama lengkap santri' ||
        c === 'nama lengkap' ||
        c.includes('nama')
      );

      if (foundScore !== -1 && foundName !== -1) {
        headerRowIndex = r;
        scoreCol = foundScore;
        nameCol = foundName;

        idCol = rowStr.findIndex((c) => c === 'id santri' || c === 'id' || c === 'id_santri' || c.includes('id santri'));
        nisnCol = rowStr.findIndex((c) => c === 'nisn' || c.includes('nisn'));
        break;
      }
    }

    if (headerRowIndex === -1 || scoreCol === -1 || nameCol === -1) {
      return {
        success: false,
        message: 'Gagal mendeteksi kolom Nama dan Nilai pada file Excel.',
        updates: [],
        skipped: [],
        errors: [
          'Format file tidak dikenali. Pastikan file memiliki baris header dengan kolom "Nama Santri" dan "Nilai".',
          'Gunakan tombol "Unduh Template Excel" untuk mendapatkan format yang sesuai.',
        ],
        unmatched: [],
        totalRowsProcessed: 0,
      };
    }

    // Buat peta pencarian santri cepat
    const idMap = new Map<string, CalculatedStudent>();
    const nisnMap = new Map<string, CalculatedStudent>();
    const nameMap = new Map<string, CalculatedStudent>();

    studentsInClass.forEach((s) => {
      idMap.set(String(s.id).trim(), s);
      if (s.nisn && s.nisn !== '-' && s.nisn.trim() !== '') {
        nisnMap.set(s.nisn.trim(), s);
      }
      nameMap.set(normalizeName(s.name), s);
    });

    // Proses setiap baris data
    let processedCount = 0;
    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawId = idCol !== -1 ? String(row[idCol] || '').trim() : '';
      const rawNisn = nisnCol !== -1 ? String(row[nisnCol] || '').trim() : '';
      const rawName = String(row[nameCol] || '').trim();
      const rawScore = row[scoreCol];

      // Lewati baris kosong atau baris ringkasan / tanda tangan
      if (!rawName && !rawId && !rawNisn) continue;
      const lowerName = rawName.toLowerCase();
      if (
        lowerName.startsWith('rata-rata') ||
        lowerName.startsWith('total') ||
        lowerName.startsWith('jumlah') ||
        lowerName.startsWith('ditetapkan') ||
        lowerName.startsWith('wali') ||
        lowerName.startsWith('pimpinan')
      ) {
        continue;
      }

      processedCount++;

      // 1. Pencocokan Santri (ID -> NISN -> Nama)
      let matchedStudent: CalculatedStudent | undefined;

      if (rawId && idMap.has(rawId)) {
        matchedStudent = idMap.get(rawId);
      } else if (rawNisn && rawNisn !== '-' && nisnMap.has(rawNisn)) {
        matchedStudent = nisnMap.get(rawNisn);
      } else if (rawName) {
        const norm = normalizeName(rawName);
        matchedStudent = nameMap.get(norm);

        // Fallback: substring matching
        if (!matchedStudent) {
          for (const [key, std] of nameMap.entries()) {
            if (key.includes(norm) || norm.includes(key)) {
              matchedStudent = std;
              break;
            }
          }
        }
      }

      if (!matchedStudent) {
        unmatched.push(`Baris ${r + 1}: Santri "${rawName || rawId || rawNisn}" tidak ditemukan di kelas ini.`);
        continue;
      }

      // 2. Validasi Nilai
      if (rawScore === '' || rawScore === null || rawScore === undefined) {
        skipped.push(`${matchedStudent.name} (nilai kosong)`);
        continue;
      }

      // Format nilai (bisa string dengan koma atau angka)
      let numVal: number;
      if (typeof rawScore === 'number') {
        numVal = rawScore;
      } else {
        const cleanStr = String(rawScore).replace(',', '.').trim();
        numVal = parseFloat(cleanStr);
      }

      if (isNaN(numVal) || numVal < 0 || numVal > 100) {
        errors.push(`Baris ${r + 1}: Nilai "${rawScore}" untuk ${matchedStudent.name} tidak valid (harus angka 0 - 100).`);
        continue;
      }

      const roundedScore = Math.round(numVal);
      updates.push({
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        score: roundedScore,
      });
    }

    return {
      success: updates.length > 0,
      message:
        updates.length > 0
          ? `Berhasil mengurai ${updates.length} nilai santri dari file Excel.`
          : 'Tidak ada nilai yang berhasil diimpor.',
      updates,
      skipped,
      errors,
      unmatched,
      totalRowsProcessed: processedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Terjadi kesalahan saat membaca file Excel: ${err.message || String(err)}`,
      updates: [],
      skipped: [],
      errors: [err.message || String(err)],
      unmatched: [],
      totalRowsProcessed: 0,
    };
  }
}

/**
 * 3. Unduh Template Excel Rekap Seluruh Mata Pelajaran untuk 1 Kelas (Wali Kelas / Admin).
 */
export function downloadClassMultiSubjectTemplateExcel(params: {
  students: CalculatedStudent[];
  subjects: Subject[];
  currentClass: ClassItem;
  config?: SchoolConfig;
}): void {
  const { students, subjects, currentClass, config } = params;

  const safeKelas = currentClass.nameLatin.replace(/[^a-zA-Z0-9_-]/g, '_');
  const tableHeaders = ['No', 'ID Santri', 'NISN', 'Nama Lengkap Santri', ...subjects.map((s) => s.nameId)];
  const tableHeaderAligns: ('center' | 'left' | 'right')[] = [
    'center',
    'center',
    'center',
    'left',
    ...subjects.map(() => 'center' as const),
  ];

  const rows = students.map((std, idx) => {
    const subjectScores = subjects.map((sub) => {
      const sc = std.scores[sub.id];
      return typeof sc === 'number' && !isNaN(sc) ? sc : '';
    });

    return [idx + 1, std.id, std.nisn || '-', std.name, ...subjectScores];
  });

  const colWidths = [6, 16, 18, 34, ...subjects.map(() => 16)];

  generateModernExcel({
    sheetName: 'Template Nilai Kelas',
    bannerTitle: 'YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI',
    subtitle: `TEMPLATE REKAPITULASI NILAI KELAS: ${currentClass.nameLatin}`,
    metaRows: [
      { label: 'Kelas:', value: currentClass.nameLatin, labelCol: 0, valueCol: 1 },
      { label: 'Wali Kelas:', value: currentClass.waliKelasName || config?.waliKelasName || '-', labelCol: 0, valueCol: 1 },
      { label: 'Jumlah Mapel:', value: `${subjects.length} Mata Pelajaran`, labelCol: 0, valueCol: 1 },
      { label: 'Jumlah Santri:', value: `${students.length} Santri`, labelCol: 0, valueCol: 1 },
    ],
    instruction:
      'PETUNJUK: Masukkan nilai (0-100) pada masing-masing kolom mata pelajaran. ' +
      'Jangan mengubah kolom ID Santri, NISN, atau Nama Santri agar nilai terimpor dengan benar.',
    tableHeaders,
    tableHeaderAligns,
    rows,
    colWidths,
    fileName: `Template_Nilai_Kelas_${safeKelas}.xlsx`,
  });
}

/**
 * 4. Parse File Excel Rekap Multi-Mata Pelajaran untuk 1 Kelas.
 */
export async function parseClassMultiSubjectExcel(
  file: File,
  subjectsInClass: Subject[],
  studentsInClass: CalculatedStudent[]
): Promise<ParseClassMultiSubjectResult> {
  const updates: { studentId: string; studentName: string; scores: Record<string, number> }[] = [];
  const errors: string[] = [];
  const unmatched: string[] = [];
  const detectedSubjects: { id: string; nameId: string; colIndex: number }[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        message: 'File Excel tidak memiliki lembar kerja.',
        updates: [],
        errors: ['File kosong atau rusak.'],
        unmatched: [],
        detectedSubjects: [],
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawRows.length === 0) {
      return {
        success: false,
        message: 'Lembar kerja Excel kosong.',
        updates: [],
        errors: ['Tidak ada data ditemukan.'],
        unmatched: [],
        detectedSubjects: [],
      };
    }

    // Cari baris header
    let headerRowIndex = -1;
    let idCol = -1;
    let nisnCol = -1;
    let nameCol = -1;

    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const rowStr = row.map((c) => String(c || '').toLowerCase().trim());

      const foundName = rowStr.findIndex((c) =>
        c === 'nama' || c === 'nama santri' || c === 'nama lengkap santri' || c === 'nama lengkap' || c.includes('nama')
      );

      if (foundName !== -1) {
        headerRowIndex = r;
        nameCol = foundName;
        idCol = rowStr.findIndex((c) => c === 'id santri' || c === 'id' || c.includes('id santri'));
        nisnCol = rowStr.findIndex((c) => c === 'nisn' || c.includes('nisn'));

        // Deteksi kolom mata pelajaran
        subjectsInClass.forEach((sub) => {
          const subNameId = sub.nameId.toLowerCase().trim();
          const subId = sub.id.toLowerCase().trim();

          const colIdx = rowStr.findIndex((c) => {
            if (!c) return false;
            return c === subNameId || c === subId || c.includes(subNameId) || subNameId.includes(c);
          });

          if (colIdx !== -1) {
            detectedSubjects.push({ id: sub.id, nameId: sub.nameId, colIndex: colIdx });
          }
        });

        break;
      }
    }

    if (headerRowIndex === -1 || nameCol === -1 || detectedSubjects.length === 0) {
      return {
        success: false,
        message: 'Gagal mendeteksi kolom nama santri dan mata pelajaran pada file Excel.',
        updates: [],
        errors: ['Format file tidak sesuai. Pastikan terdapat kolom Nama Santri dan nama mata pelajaran.'],
        unmatched: [],
        detectedSubjects: [],
      };
    }

    const idMap = new Map<string, CalculatedStudent>();
    const nisnMap = new Map<string, CalculatedStudent>();
    const nameMap = new Map<string, CalculatedStudent>();

    studentsInClass.forEach((s) => {
      idMap.set(String(s.id).trim(), s);
      if (s.nisn && s.nisn !== '-' && s.nisn.trim() !== '') {
        nisnMap.set(s.nisn.trim(), s);
      }
      nameMap.set(normalizeName(s.name), s);
    });

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawId = idCol !== -1 ? String(row[idCol] || '').trim() : '';
      const rawNisn = nisnCol !== -1 ? String(row[nisnCol] || '').trim() : '';
      const rawName = String(row[nameCol] || '').trim();

      if (!rawName && !rawId && !rawNisn) continue;
      const lowerName = rawName.toLowerCase();
      if (
        lowerName.startsWith('rata-rata') ||
        lowerName.startsWith('total') ||
        lowerName.startsWith('jumlah') ||
        lowerName.startsWith('ditetapkan') ||
        lowerName.startsWith('wali')
      ) {
        continue;
      }

      let matchedStudent: CalculatedStudent | undefined;
      if (rawId && idMap.has(rawId)) {
        matchedStudent = idMap.get(rawId);
      } else if (rawNisn && rawNisn !== '-' && nisnMap.has(rawNisn)) {
        matchedStudent = nisnMap.get(rawNisn);
      } else if (rawName) {
        matchedStudent = nameMap.get(normalizeName(rawName));
      }

      if (!matchedStudent) {
        unmatched.push(`Baris ${r + 1}: Santri "${rawName || rawId}" tidak ditemukan.`);
        continue;
      }

      const scores: Record<string, number> = {};
      detectedSubjects.forEach((sub) => {
        const rawScore = row[sub.colIndex];
        if (rawScore !== '' && rawScore !== null && rawScore !== undefined) {
          const cleanStr = String(rawScore).replace(',', '.').trim();
          const num = parseFloat(cleanStr);
          if (!isNaN(num) && num >= 0 && num <= 100) {
            scores[sub.id] = Math.round(num);
          }
        }
      });

      if (Object.keys(scores).length > 0) {
        updates.push({
          studentId: matchedStudent.id,
          studentName: matchedStudent.name,
          scores,
        });
      }
    }

    return {
      success: updates.length > 0,
      message: `Berhasil mengimpor nilai untuk ${updates.length} santri dan ${detectedSubjects.length} mata pelajaran.`,
      updates,
      errors,
      unmatched,
      detectedSubjects,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Terjadi error: ${err.message || String(err)}`,
      updates: [],
      errors: [err.message || String(err)],
      unmatched: [],
      detectedSubjects: [],
    };
  }
}

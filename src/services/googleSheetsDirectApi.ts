/**
 * Direct Google Sheets API v4 Client
 * 
 * Uses standard OAuth2 Bearer Access Token acquired via Firebase Google Auth.
 * Directly creates, reads, updates, and syncs student grades with Google Sheets.
 */

import { ClassItem, SchoolType } from '../types';
import { getSubjectsForClass } from '../data/curriculumSubjects';

export const STORAGE_KEY_DIRECT_SHEET_ID_MUKIM = 'kasyfud_darajat_google_sheet_id_mukim';
export const STORAGE_KEY_DIRECT_SHEET_ID_FULLDAY = 'kasyfud_darajat_google_sheet_id_fullday';
export const STORAGE_KEY_DIRECT_SHEET_URL_MUKIM = 'kasyfud_darajat_google_sheet_url_mukim';
export const STORAGE_KEY_DIRECT_SHEET_URL_FULLDAY = 'kasyfud_darajat_google_sheet_url_fullday';

/**
 * Extract Spreadsheet ID from a URL or raw ID
 * Format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit...
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Regex to match Google Sheets ID
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  // Check if it's already a raw ID (usually 25-50 characters alphanumeric with dashes/underscores)
  if (/^[a-zA-Z0-9-_]{20,70}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function getStoredDirectSpreadsheetId(schoolType: SchoolType = 'mukim'): string {
  try {
    const key = schoolType === 'fullday' ? STORAGE_KEY_DIRECT_SHEET_ID_FULLDAY : STORAGE_KEY_DIRECT_SHEET_ID_MUKIM;
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function saveStoredDirectSpreadsheetId(id: string, url?: string, schoolType: SchoolType = 'mukim'): void {
  try {
    const idKey = schoolType === 'fullday' ? STORAGE_KEY_DIRECT_SHEET_ID_FULLDAY : STORAGE_KEY_DIRECT_SHEET_ID_MUKIM;
    const urlKey = schoolType === 'fullday' ? STORAGE_KEY_DIRECT_SHEET_URL_FULLDAY : STORAGE_KEY_DIRECT_SHEET_URL_MUKIM;
    localStorage.setItem(idKey, id.trim());
    if (url) {
      localStorage.setItem(urlKey, url.trim());
    } else {
      localStorage.setItem(urlKey, `https://docs.google.com/spreadsheets/d/${id.trim()}/edit`);
    }
  } catch {
    // ignore
  }
}

export function getStoredDirectSpreadsheetUrl(schoolType: SchoolType = 'mukim'): string {
  try {
    const key = schoolType === 'fullday' ? STORAGE_KEY_DIRECT_SHEET_URL_FULLDAY : STORAGE_KEY_DIRECT_SHEET_URL_MUKIM;
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const id = getStoredDirectSpreadsheetId(schoolType);
    return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : '';
  } catch {
    return '';
  }
}

/**
 * Sanitize class name to be a valid Google Sheet tab name (max 100 chars, no special characters like : \ / ? * [ ] )
 */
export function sanitizeSheetTitle(title: string): string {
  return title
    .replace(/[:\\/?*\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 95);
}

/**
 * Fetch spreadsheet metadata to verify access and get existing sheets
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: Array<{ sheetId: number; title: string }> }> {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Gagal mengakses spreadsheet (${response.status}: ${response.statusText})`
    );
  }

  const data = await response.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
  }));

  return {
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
  };
}

/**
 * Create a new Google Spreadsheet in the user's Google Drive with tabs for each class
 */
export async function createSpreadsheetForClasses(
  accessToken: string,
  title: string,
  classes: ClassItem[],
  students: Array<{ id: string; name: string; nisn: string; classId?: string; scores: Record<string, number> }>
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Define initial sheets for each class
  const classSheets = classes.map((c) => ({
    properties: {
      title: sanitizeSheetTitle(c.nameLatin),
      gridProperties: {
        frozenRowCount: 1,
      },
    },
  }));

  // Create the spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: classSheets.length > 0 ? classSheets : [{ properties: { title: 'Nilai Santri' } }],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Now populate header and initial student rows for each class
  await syncAllScoresToSpreadsheet(accessToken, spreadsheetId, classes, students);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Ensure all class tabs exist in the target spreadsheet. If missing, create them.
 */
export async function ensureClassTabsExist(
  accessToken: string,
  spreadsheetId: string,
  classes: ClassItem[]
): Promise<void> {
  const details = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const existingTitles = new Set(details.sheets.map((s) => s.title.toLowerCase().trim()));

  const requests: any[] = [];
  for (const c of classes) {
    const tabName = sanitizeSheetTitle(c.nameLatin);
    if (!existingTitles.has(tabName.toLowerCase().trim())) {
      requests.push({
        addSheet: {
          properties: {
            title: tabName,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      });
      existingTitles.add(tabName.toLowerCase().trim());
    }
  }

  if (requests.length > 0) {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
    if (!res.ok) {
      console.warn('Gagal menambahkan beberapa sheet kelas:', await res.text());
    }
  }
}

/**
 * Push / Sync all student scores to Google Sheets
 */
export async function syncAllScoresToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  classes: ClassItem[],
  students: Array<{ id: string; name: string; nisn: string; classId?: string; scores: Record<string, number> }>
): Promise<{ updatedTabsCount: number; updatedStudentsCount: number }> {
  // 1. Ensure tabs exist
  await ensureClassTabsExist(accessToken, spreadsheetId, classes);

  // 2. Prepare value updates batch
  const data: Array<{ range: string; values: any[][] }> = [];
  let totalStudents = 0;

  for (const cls of classes) {
    const tabName = sanitizeSheetTitle(cls.nameLatin);
    const subjects = getSubjectsForClass(cls.id);
    const classStudents = students.filter((s) => s.classId === cls.id);
    totalStudents += classStudents.length;

    // Header Row
    const headerRow: string[] = ['No', 'NISN', 'Nama Santri'];
    subjects.forEach((s) => {
      headerRow.push(s.nameId);
    });

    // Rows
    const rows: any[][] = [headerRow];
    classStudents.forEach((student, idx) => {
      const row: any[] = [idx + 1, `'${student.nisn || ''}`, student.name];
      subjects.forEach((s) => {
        const score = student.scores[s.id];
        row.push(score !== undefined && score !== null ? score : '');
      });
      rows.push(row);
    });

    // We write to A1:range
    const range = `'${tabName}'!A1`;
    data.push({
      range,
      values: rows,
    });
  }

  if (data.length === 0) {
    return { updatedTabsCount: 0, updatedStudentsCount: 0 };
  }

  // Execute Batch Update Values
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menyimpan nilai ke Google Sheets.');
  }

  return {
    updatedTabsCount: data.length,
    updatedStudentsCount: totalStudents,
  };
}

/**
 * Pull / Fetch scores from Google Sheets and match them with app students
 * Returns a map of studentId -> { subjectId: score }
 */
export async function pullScoresFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  classes: ClassItem[],
  students: Array<{ id: string; name: string; nisn: string; classId?: string }>
): Promise<{
  scoresMap: Record<string, Record<string, number>>;
  matchedStudentsCount: number;
  unmatchedRowsCount: number;
}> {
  const details = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const availableSheetTitles = details.sheets.map((s) => s.title);

  const scoresMap: Record<string, Record<string, number>> = {};
  let matchedStudentsCount = 0;
  let unmatchedRowsCount = 0;

  for (const cls of classes) {
    const cleanClsName = sanitizeSheetTitle(cls.nameLatin).toLowerCase();
    const matchedSheetTitle = availableSheetTitles.find(
      (t) => t.toLowerCase() === cleanClsName || t.toLowerCase().includes(cls.id.toLowerCase())
    );

    if (!matchedSheetTitle) {
      continue;
    }

    // Fetch range A1:ZZ100
    const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      matchedSheetTitle
    )}'!A1:AZ100`;

    const res = await fetch(fetchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) continue;

    const data = await res.json();
    const rows: any[][] = data.values || [];
    if (rows.length < 2) continue; // Only header or empty

    const headerRow: string[] = (rows[0] || []).map((h: any) => String(h || '').trim());
    const subjects = getSubjectsForClass(cls.id);

    // Map column index to subjectId
    const colToSubjectId: Record<number, string> = {};
    headerRow.forEach((colName, colIdx) => {
      if (colIdx < 3) return; // Skip No, NISN, Nama
      const matchedSubject = subjects.find(
        (s) =>
          s.nameId.toLowerCase().trim() === colName.toLowerCase().trim() ||
          s.id.toLowerCase() === colName.toLowerCase()
      );
      if (matchedSubject) {
        colToSubjectId[colIdx] = matchedSubject.id;
      }
    });

    const classStudents = students.filter((s) => s.classId === cls.id);

    // Iterate through data rows
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rowNisn = String(row[1] || '').trim().replace(/['"]/g, '');
      const rowName = String(row[2] || '').trim().toLowerCase();

      // Find matching student by NISN first, then by name
      let foundStudent = classStudents.find((s) => rowNisn && s.nisn && s.nisn === rowNisn);
      if (!foundStudent && rowName) {
        foundStudent = classStudents.find((s) => s.name.toLowerCase().trim() === rowName);
      }
      if (!foundStudent && rowName) {
        // Partial match
        foundStudent = classStudents.find((s) => s.name.toLowerCase().includes(rowName) || rowName.includes(s.name.toLowerCase()));
      }

      if (foundStudent) {
        if (!scoresMap[foundStudent.id]) {
          scoresMap[foundStudent.id] = {};
        }

        let hasScore = false;
        Object.entries(colToSubjectId).forEach(([colIdxStr, subId]) => {
          const colIdx = parseInt(colIdxStr, 10);
          const cellVal = row[colIdx];
          if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
            const numVal = parseInt(String(cellVal).trim(), 10);
            if (!isNaN(numVal)) {
              scoresMap[foundStudent!.id][subId] = Math.max(0, Math.min(100, numVal));
              hasScore = true;
            }
          }
        });

        if (hasScore) {
          matchedStudentsCount++;
        }
      } else {
        unmatchedRowsCount++;
      }
    }
  }

  return {
    scoresMap,
    matchedStudentsCount,
    unmatchedRowsCount,
  };
}

import { AuthUser, ClassItem, JenjangUnit, UserRole, SchoolType } from '../types';
import { getStoredSheetsUrl } from '../services/storageConfig';
import {
  getTeacherProfiles,
  findTeachersForSubjectAndClass,
  TeacherProfile,
  TEACHER_SUBJECTS_ENTRIES,
  normalizeClassToIds,
  isTeacherNameMatch,
  normalizeSubjectKey,
  ALL_TEACHER_ASSIGNMENTS,
} from '../data/teacherSubjectsDatabase';
import { TEACHER_ASSIGNMENTS_REKAP } from '../data/teacherAssignmentsRekap';
import { DAFTAR_WALI_KELAS, WaliKelasEntry } from '../data/waliKelasDatabase';

export const AUTH_USER_KEY = 'kasyfud_darajat_auth_user_v1';
export const ADMIN_SESSION_TOKEN_KEY = 'raport_admin_session_token';
export const TEACHER_SESSION_TOKEN_KEY = 'raport_teacher_session_token';

/**
 * Legacy compatibility helpers.
 * The administrator PIN is server-side only (Apps Script Script Properties).
 * Never read or write ADMIN_PIN from browser storage.
 */
export function getAdminPin(): string {
  return '';
}

export function setAdminPin(_newPin: string): { success: boolean; message: string } {
  return {
    success: false,
    message: 'PIN Administrator hanya dapat dikonfigurasi di Script Properties (ADMIN_PIN).',
  };
}

/**
 * Verify admin PIN
 */
/**
 * Verify administrator PIN against the Vercel server environment.
 * The PIN is never stored in browser localStorage and is never returned by the API.
 */
export async function verifyAdminPin(enteredPin: string): Promise<boolean> {
  const pin = enteredPin.trim();
  if (!pin) return false;
  const webAppUrl = getStoredSheetsUrl();
  if (!webAppUrl) return false;

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'verifyAdmin', pin }),
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (data?.success === true && data?.sessionToken) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, String(data.sessionToken));
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getAdminSessionToken(): string {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getTeacherSessionToken(): string {
  try { return sessionStorage.getItem(TEACHER_SESSION_TOKEN_KEY) || ''; } catch { return ''; }
}

export function clearTeacherSessionToken(): void {
  try { sessionStorage.removeItem(TEACHER_SESSION_TOKEN_KEY); } catch { /* ignore */ }
}

export async function verifyTeacherPin(teacherName: string, unit: JenjangUnit, role: Exclude<UserRole, 'admin'>, pin: string): Promise<boolean> {
  const safePin = String(pin || '').trim();
  if (!teacherName.trim() || !safePin) return false;
  const webAppUrl = getStoredSheetsUrl();
  if (!webAppUrl) return false;
  try {
    const response = await fetch(webAppUrl, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'verifyTeacherPin', teacherName, unit, role, pin: safePin }), cache: 'no-store' });
    if (!response.ok) return false;
    const data = await response.json();
    if (data?.success === true && data?.authenticated === true && data?.sessionToken) {
      try { sessionStorage.setItem(TEACHER_SESSION_TOKEN_KEY, String(data.sessionToken)); } catch { /* ignore */ }
      return true;
    }
    return false;
  } catch { return false; }
}
export function clearAdminSessionToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get saved user session
 */
export function getSavedAuthUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Save user session
 */
export function saveAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Get teachers filtered by unit/jenjang
 */
export function getTeachersByJenjang(unit: JenjangUnit): TeacherProfile[] {
  const profiles = getTeacherProfiles();
  if (unit === 'TMMIA') {
    // TMMIA mencakup seluruh tingkatan (Tingkat SMP & Tingkat SMA)
    return profiles;
  }
  return profiles.filter((t) => t.units.includes(unit));
}

/**
 * Get wali kelas filtered by unit/jenjang
 */
export function getWaliKelasByJenjang(unit: JenjangUnit): WaliKelasEntry[] {
  return DAFTAR_WALI_KELAS.filter((w) => {
    const name = (w.className || '').toLowerCase();
    const isSmpFullDay = name.includes('vii') || name.includes('viii') || name.includes('ix');
    const isSmaFullDay = name.includes('x ') || name.includes('xi') || name.includes('xii');

    if (unit === 'SMP') {
      return (
        w.unit === 'SMP' ||
        w.levelLabel?.toLowerCase().includes('smp') ||
        (w.unit === 'FULL DAY' && isSmpFullDay) ||
        (['1', '2', '3'].some((n) => name.startsWith(n)) && !name.includes('int'))
      );
    }
    if (unit === 'SMA') {
      return (
        w.unit === 'SMA' ||
        w.levelLabel?.toLowerCase().includes('sma') ||
        w.unit === 'INTENSIF' ||
        name.includes('int') ||
        (w.unit === 'FULL DAY' && isSmaFullDay) ||
        ['4', '5', '6'].some((n) => name.startsWith(n))
      );
    }
    if (unit === 'TMMIA') {
      // TMMIA mencakup seluruh jenjang SMP dan SMA
      return true;
    }
    return true;
  });
}

/**
 * Match a class name or class ID from database with the app's ClassItem list
 */
export function matchClassItem(
  classNameOrId: string,
  classes: ClassItem[] = []
): ClassItem | undefined {
  if (!classNameOrId || !Array.isArray(classes)) return undefined;
  const raw = classNameOrId.toLowerCase().trim();

  // 1. Direct ID match
  const byId = classes.find((c) => c && c.id && c.id.toLowerCase() === raw);
  if (byId) return byId;

  // 1b. VII-5 / VII-6 alias match
  if (raw === 'vii-6-fd-pa' || raw === 'vii-5-fd-pa' || raw.includes('vii.5') || raw.includes('vii.6') || raw.includes('vii-5') || raw.includes('vii-6')) {
    const viiClass = classes.find((c) => c && (c.id === 'vii-5-fd-pa' || c.id === 'vii-6-fd-pa'));
    if (viiClass) return viiClass;
  }

  // 2. Direct NameLatin match
  const byName = classes.find((c) => c && c.nameLatin && c.nameLatin.toLowerCase() === raw);
  if (byName) return byName;

  // 3. Normalization search
  const clean = raw.replace(/[^a-z0-9]/g, '');
  if (!clean) return undefined;

  return classes.find((c) => {
    if (!c) return false;
    const cIdClean = (c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cNameClean = (c.nameLatin || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      (clean !== '' && cIdClean === clean) ||
      (clean.length >= 2 && cNameClean.includes(clean)) ||
      (cIdClean.length >= 2 && clean.includes(cIdClean)) ||
      (cNameClean.length >= 2 && clean.includes(cNameClean))
    );
  });
}

/**
 * Menentukan Jenjang Pendidikan (SMP atau SMA) untuk suatu kelas di Pondok Modern Al-Ghozali:
 * 1. Jenjang SMP:
 *    - MUKIM: Kelas 1 - 3 SMP (1A, 1B, 1D, 1E, 2A-F, 3A-F)
 *    - FULL DAY: Kelas VII-3, VII-5, VIII-4, IX-4, IX-8
 * 2. Jenjang SMA:
 *    - MUKIM: 1 Intensif, 2 Intensif, 3 Intensif, dan Kelas 4 - 6
 *    - FULL DAY: Kelas X, XI IPA, XI IPS, XII IPA, XII IPS
 * 
 * *Catatan: Mata pelajaran kepondokan TMMIA diajarkan di seluruh jenjang (baik SMP maupun SMA).
 */
export function getJenjangForClass(cls?: { id?: string; level?: string; nameLatin?: string; schoolType?: SchoolType } | null): JenjangUnit {
  if (!cls) return 'SMP';
  const id = (cls.id || '').toLowerCase();
  const lvl = (cls.level || '').toLowerCase();
  const name = (cls.nameLatin || '').toLowerCase();

  // 1. Full Day Check (SMP: VII-3, VII-5, VIII-4, IX-4, IX-8; SMA: X, XI, XII)
  const isFullDay = (cls as any)?.schoolType === 'fullday' || name.includes('full day') || id.includes('fd');
  if (isFullDay) {
    if (
      id.includes('vii') ||
      id.includes('viii') ||
      id.includes('ix') ||
      name.includes('vii') ||
      name.includes('viii') ||
      name.includes('ix') ||
      name.includes('smp') ||
      lvl === '7' ||
      lvl === '8' ||
      lvl === '9'
    ) {
      return 'SMP';
    }
    if (
      id.includes('x-') ||
      id.includes('xi-') ||
      id.includes('xii-') ||
      name.includes('x ') ||
      name.includes('xa') ||
      name.includes('xb') ||
      name.includes('xi') ||
      name.includes('xii') ||
      name.includes('sma') ||
      lvl === '10' ||
      lvl === '11' ||
      lvl === '12'
    ) {
      return 'SMA';
    }
  }

  // 2. SMA Mukim Check:
  // - 1 Intensif, 2 Intensif, 3 Intensif
  // - Kelas 4, 5, 6 Mukim
  if (
    id.includes('int') ||
    lvl.includes('int') ||
    name.includes('intensif') ||
    name.includes('2int') ||
    name.includes('3int') ||
    name.includes('1int') ||
    id.startsWith('4') ||
    id.startsWith('5') ||
    id.startsWith('6') ||
    lvl === '4' ||
    lvl === '5' ||
    lvl === '6' ||
    name.includes('sma')
  ) {
    return 'SMA';
  }

  // 3. SMP Mukim Check:
  // - Kelas 1 - 3 SMP (1A..1E, 2A..2F, 3A..3F)
  if (
    id.startsWith('1') ||
    id.startsWith('2') ||
    id.startsWith('3') ||
    lvl === '1' ||
    lvl === '2' ||
    lvl === '3' ||
    name.includes('smp')
  ) {
    return 'SMP';
  }

  return 'SMP';
}

/**
 * Get comprehensive assignment details for a teacher cross-referenced with Master Penugasan Guru
 */
export function getTeacherAssignmentDetails(
  teacherName: string,
  classes: ClassItem[] = []
): {
  assignedClassIds: string[];
  assignedClassIdsByUnit: Record<JenjangUnit, string[]>;
  availableUnits: JenjangUnit[];
  assignedSubjectNames: string[];
  homeroomClass?: ClassItem;
  homeroomEntry?: WaliKelasEntry;
  totalClassesCount: number;
} {
  const safeClasses = Array.isArray(classes) ? classes : [];
  const assignedClassIdSet = new Set<string>();
  const subjectNameSet = new Set<string>();
  const availableUnitsSet = new Set<JenjangUnit>();

  const assignedClassIdsByUnit: Record<JenjangUnit, string[]> = {
    SMP: [],
    SMA: [],
    TMMIA: [],
  };

  if (!teacherName) {
    return {
      assignedClassIds: [],
      assignedClassIdsByUnit,
      availableUnits: ['SMP'],
      assignedSubjectNames: [],
      totalClassesCount: 0,
    };
  }

  // 1. Cross-reference ALL_TEACHER_ASSIGNMENTS (SMP, SMA, TMMIA, & Full Day)
  let foundInRekap = false;
  ALL_TEACHER_ASSIGNMENTS.forEach((rec) => {
    if (rec && rec.teacherName && isTeacherNameMatch(rec.teacherName, teacherName)) {
      foundInRekap = true;
      if (rec.subjectName) subjectNameSet.add(rec.subjectName);
      if (rec.unit && (rec.unit === 'SMP' || rec.unit === 'SMA' || rec.unit === 'TMMIA')) {
        availableUnitsSet.add(rec.unit);
      }

      // Map rec.className to verified ClassItem IDs
      const matchedIds = normalizeClassToIds(rec.className || '');
      if (matchedIds.length > 0) {
        matchedIds.forEach((targetId) => {
          const classObj = safeClasses.find((c) => c && c.id === targetId);
          if (classObj) {
            const targetJenjang = getJenjangForClass(classObj);
            assignedClassIdSet.add(targetId);
            availableUnitsSet.add(targetJenjang);
            if (assignedClassIdsByUnit[targetJenjang] && !assignedClassIdsByUnit[targetJenjang].includes(targetId)) {
              assignedClassIdsByUnit[targetJenjang].push(targetId);
            }
            if (rec.unit && assignedClassIdsByUnit[rec.unit] && !assignedClassIdsByUnit[rec.unit].includes(targetId)) {
              assignedClassIdsByUnit[rec.unit].push(targetId);
            }
          }
        });
      } else {
        const matched = matchClassItem(rec.className, safeClasses);
        if (matched) {
          assignedClassIdSet.add(matched.id);
          const matchedJenjang = getJenjangForClass(matched);
          availableUnitsSet.add(matchedJenjang);
          if (assignedClassIdsByUnit[matchedJenjang] && !assignedClassIdsByUnit[matchedJenjang].includes(matched.id)) {
            assignedClassIdsByUnit[matchedJenjang].push(matched.id);
          }
          if (rec.unit && assignedClassIdsByUnit[rec.unit] && !assignedClassIdsByUnit[rec.unit].includes(matched.id)) {
            assignedClassIdsByUnit[rec.unit].push(matched.id);
          }
        }
      }
    }
  });

  // 2. Fallback to TEACHER_SUBJECTS_ENTRIES only if teacher is NOT found in official rekap
  if (!foundInRekap) {
    TEACHER_SUBJECTS_ENTRIES.forEach((entry) => {
      const isTeacher = entry.guruPengampu && entry.guruPengampu.some((g) => isTeacherNameMatch(g, teacherName));

      if (isTeacher) {
        if (entry.namaMapel) subjectNameSet.add(entry.namaMapel);
        const entryUnit: JenjangUnit = entry.unit || 'SMP';
        availableUnitsSet.add(entryUnit);

        // Map each class in entry.daftarKelas to verified ClassItem IDs
        (entry.daftarKelas || []).forEach((clsStr) => {
          const matchedIds = normalizeClassToIds(clsStr);
          if (matchedIds.length > 0) {
            matchedIds.forEach((targetId) => {
              const classObj = safeClasses.find((c) => c && c.id === targetId);
              if (classObj) {
                const targetJenjang = getJenjangForClass(classObj);
                assignedClassIdSet.add(targetId);
                availableUnitsSet.add(targetJenjang);
                if (assignedClassIdsByUnit[targetJenjang] && !assignedClassIdsByUnit[targetJenjang].includes(targetId)) {
                  assignedClassIdsByUnit[targetJenjang].push(targetId);
                }
              }
            });
          } else {
            const matched = matchClassItem(clsStr, safeClasses);
            if (matched) {
              assignedClassIdSet.add(matched.id);
              const matchedJenjang = getJenjangForClass(matched);
              availableUnitsSet.add(matchedJenjang);
              if (assignedClassIdsByUnit[matchedJenjang] && !assignedClassIdsByUnit[matchedJenjang].includes(matched.id)) {
                assignedClassIdsByUnit[matchedJenjang].push(matched.id);
              }
            }
          }
        });
      }
    });
  }

  // 3. Cross-reference Wali Kelas Database
  const homeroomEntry = DAFTAR_WALI_KELAS.find((w) => w && w.waliName && isTeacherNameMatch(w.waliName, teacherName));

  let homeroomClass: ClassItem | undefined;
  if (homeroomEntry) {
    let wUnit: JenjangUnit = 'SMP';
    if (homeroomEntry.unit === 'SMP') wUnit = 'SMP';
    else if (homeroomEntry.unit === 'SMA') wUnit = 'SMA';
    else if (homeroomEntry.unit === 'INTENSIF' || homeroomEntry.unit === 'FULL DAY') {
      const cNameLower = (homeroomEntry.className || '').toLowerCase();
      if (cNameLower.includes('vii') || cNameLower.includes('viii') || cNameLower.includes('ix')) {
        wUnit = 'SMP';
      } else {
        wUnit = 'SMA';
      }
    }
    availableUnitsSet.add(wUnit);

    homeroomClass =
      safeClasses.find(
        (c) =>
          c &&
          ((homeroomEntry.classId && c.id === homeroomEntry.classId) ||
           (c.nameLatin && homeroomEntry.className && c.nameLatin.toLowerCase().includes(homeroomEntry.className.toLowerCase())))
      ) ||
      safeClasses.find((c) => {
        if (!c || !c.id || !homeroomEntry.classId) return false;
        const cClean = c.id.toLowerCase();
        const wClean = homeroomEntry.classId.toLowerCase();
        return cClean === wClean;
      });

    if (homeroomClass) {
      assignedClassIdSet.add(homeroomClass.id);
      if (assignedClassIdsByUnit[wUnit] && !assignedClassIdsByUnit[wUnit].includes(homeroomClass.id)) {
        assignedClassIdsByUnit[wUnit].push(homeroomClass.id);
      }
    }
  }

  // Determine availableUnits sorted
  const unitOrder: JenjangUnit[] = ['SMP', 'SMA', 'TMMIA'];
  const availableUnits = unitOrder.filter((u) => availableUnitsSet.has(u));

  if (availableUnits.length === 0) {
    availableUnits.push('SMP');
  }

  const assignedClassIds = Array.from(assignedClassIdSet);

  return {
    assignedClassIds,
    assignedClassIdsByUnit,
    availableUnits,
    assignedSubjectNames: Array.from(subjectNameSet),
    homeroomClass,
    homeroomEntry,
    totalClassesCount: assignedClassIds.length,
  };
}

/**
 * Check if a class name or ID matches a Wali Kelas's homeroom class
 */
export function isHomeroomClassMatch(user: AuthUser | null, classNameOrId: string): boolean {
  if (!user || user.role !== 'wali_kelas') return false;
  if (!user.homeroomClassId && !user.homeroomClassName) return false;

  const rawTarget = (classNameOrId || '').toLowerCase().trim();
  const cleanTarget = rawTarget.replace(/[^a-z0-9]/g, '');

  const hId = (user.homeroomClassId || '').toLowerCase().trim();
  const cleanHId = hId.replace(/[^a-z0-9]/g, '');

  const hName = (user.homeroomClassName || '').toLowerCase().trim();
  const cleanHName = hName.replace(/[^a-z0-9]/g, '');

  return (
    (cleanHId !== '' && (cleanTarget === cleanHId || cleanTarget.startsWith(cleanHId) || cleanHId.startsWith(cleanTarget))) ||
    (cleanHName !== '' && (cleanTarget.includes(cleanHName) || cleanHName.includes(cleanTarget))) ||
    rawTarget === hId ||
    rawTarget === hName
  );
}

/**
 * Filter classes for a user based on active Jenjang and assigned classes.
 * - Admin: All classes in that Jenjang
 * - Wali Kelas: Homeroom class (if in this jenjang) + any classes where user is assigned teacher
 * - Guru: STRICTLY ONLY the classes where the user is explicitly assigned as Subject Teacher.
 */
export function getClassesForUserAndJenjang(
  user: AuthUser | null,
  activeJenjang: JenjangUnit,
  allClasses: ClassItem[],
  schoolType?: SchoolType
): ClassItem[] {
  const typeFiltered = schoolType
    ? allClasses.filter((c) => (schoolType === 'fullday' ? c.schoolType === 'fullday' : c.schoolType !== 'fullday'))
    : allClasses;

  // TMMIA mencakup seluruh tingkatan (Tingkat SMP & Tingkat SMA)
  const jenjangClasses =
    activeJenjang === 'TMMIA'
      ? typeFiltered
      : typeFiltered.filter((c) => getJenjangForClass(c) === activeJenjang);

  if (!user || user.role === 'admin') {
    return jenjangClasses;
  }

  const allowedClassIds = new Set<string>();

  // If user is Wali Kelas, always include their homeroom class
  if (user.role === 'wali_kelas' && user.homeroomClassId) {
    const homeroomClassObj = allClasses.find(
      (c) =>
        c.id.toLowerCase() === user.homeroomClassId!.toLowerCase() ||
        (user.homeroomClassName && c.nameLatin.toLowerCase().includes(user.homeroomClassName.toLowerCase()))
    );
    if (homeroomClassObj) {
      const hJenjang = getJenjangForClass(homeroomClassObj);
      if (activeJenjang === 'TMMIA' || hJenjang === activeJenjang) {
        allowedClassIds.add(homeroomClassObj.id);
      }
    }
  }

  // Check assigned classes for this unit from Penugasan Guru
  const assignedInThisUnit = user.assignedClassIdsByUnit?.[activeJenjang] || [];
  assignedInThisUnit.forEach((id) => allowedClassIds.add(id));

  // If activeJenjang is TMMIA, check all assigned classes across SMP & SMA
  if (activeJenjang === 'TMMIA' && user.assignedClassIds) {
    user.assignedClassIds.forEach((id) => allowedClassIds.add(id));
  }

  if (allowedClassIds.size > 0) {
    return jenjangClasses.filter((c) => allowedClassIds.has(c.id));
  }

  // Fallback: check general assignedClassIds if specific unit list is empty
  if (user.assignedClassIds && user.assignedClassIds.length > 0) {
    const filtered = jenjangClasses.filter((c) => user.assignedClassIds!.includes(c.id));
    if (filtered.length > 0) return filtered;
  }

  // If user has NO assigned classes in this jenjang, return [] to strictly prevent unauthorized viewing
  return [];
}

/**
 * Check whether a user is authorized to edit grades for a given subject in a class
 * - Admin: Can edit all subjects in all classes
 * - Wali Kelas: Can edit ALL subjects in their homeroom class, plus any subjects they teach in other classes
 * - Guru: Can ONLY edit subjects they are assigned to teach in that specific class
 */
export function canUserEditSubject(
  user: AuthUser | null,
  subjectNameOrId: string,
  classNameOrId: string
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  // WALI KELAS: Has full authority to input and edit all subjects in their homeroom class
  if (user.role === 'wali_kelas' && isHomeroomClassMatch(user, classNameOrId)) {
    return true;
  }

  // Check Master Penugasan Guru for specific subject and class
  const assignedTeachers = findTeachersForSubjectAndClass(subjectNameOrId, classNameOrId);

  // For grade entry, a subject-only match is not sufficient. The teacher must
  // be explicitly assigned to this exact subject + class.
  return assignedTeachers.some((t) => isTeacherNameMatch(t, user.name));
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { INITIAL_SUBJECTS, INITIAL_SCHOOL_CONFIG, INITIAL_STUDENTS, INITIAL_CLASSES } from './data/initialData';
import { MASTER_STUDENTS_3_SMP } from './data/masterStudents3SMP';
import { MASTER_STUDENTS_1_INTENSIF } from './data/masterStudents1Intensif';
import { MASTER_STUDENTS_2_INTENSIF } from './data/masterStudents2Intensif';
import { MASTER_STUDENTS_4_SMA } from './data/masterStudents4SMA';
import { MASTER_STUDENTS_5_SMA } from './data/masterStudents5SMA';
import { MASTER_STUDENTS_6_SMA } from './data/masterStudents6SMA';
import { MASTER_STUDENTS_3_INTENSIF } from './data/masterStudents3Intensif';
import { Subject, StudentRecord, CalculatedStudent, SchoolConfig, ClassItem, AuthUser, JenjangUnit, SchoolType } from './types';
import { ReportCertificate } from './components/ReportCertificate';
import { SidebarControls } from './components/SidebarControls';
import { RekapitulasiTable } from './components/RekapitulasiTable';
import { TeacherGradingView } from './components/TeacherGradingView';
import { DataMasterView } from './components/DataMasterView';
import { StudentModal } from './components/StudentModal';
import { SettingsModal } from './components/SettingsModal';
import { BatchPrintView } from './components/BatchPrintView';
import { ReportDesignModal } from './components/ReportDesignModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { AiAuditModal } from './components/AiAuditModal';
import {
  saveSingleScoreToSheets,
  fetchAllScoresFromSheets,
  fetchScoresForClassFromSheets,
  STORAGE_KEY_SHEETS_URL,
  STORAGE_KEY_SHEETS_AUTOSYNC,
  STORAGE_KEY_SHEETS_LAST_SYNC,
  DEFAULT_SPREADSHEET_URL,
  getStoredSheetsUrl,
  saveStoredSheetsUrl,
  getStoredLastSync,
  saveStoredLastSync,
} from './services/googleSheetsService';
import { SchoolLogo } from './components/SchoolLogo';
import { MuatanMataPelajaranView } from './components/MuatanMataPelajaranView';
import { TeacherDatabaseView } from './components/TeacherDatabaseView';
import { SikapView } from './components/SikapView';
import { LoginView } from './components/LoginView';
import { SessionLockOverlay } from './components/SessionLockOverlay';
import { UserGuideModal } from './components/UserGuideModal';
import { getSubjectsForClass, ensureStudentScoresForClass, MASTER_SUBJECTS_CATALOG } from './data/curriculumSubjects';
import { getWaliKelasForClass } from './data/waliKelasDatabase';
import { getSavedAuthUser, saveAuthUser, getClassesForUserAndJenjang, getJenjangForClass, clearAdminSessionToken, clearTeacherSessionToken } from './utils/authHelpers';
import { exportRaportToPdf } from './utils/exportHelpers';
import { ReportDesignConfig, DEFAULT_DESIGN_CONFIG, getSavedDesignConfig, saveDesignConfig } from './data/reportDesign';
import { ExcelTableToolbar, SelectedColumnKey } from './components/ExcelTableToolbar';
import {
  FileText,
  FileSpreadsheet,
  Plus,
  Sliders,
  RotateCcw,
  PenTool,
  Users,
  BookOpen,
  GraduationCap,
  LogOut,
  ShieldCheck,
  UserCheck,
  Lock,
  School,
  Sparkles,
  Download,
  Loader2,
  FileType,
  Printer,
  Palette,
  Cloud,
  Layers,
  ChevronDown,
} from 'lucide-react';

const STORAGE_KEY_STUDENTS = 'raport_integrasi_pts_2026_2027_empty_template_v1';
const STORAGE_KEY_CONFIG = 'kasyfud_darajat_config_smp_v4';
const STORAGE_KEY_CLASSES = 'kasyfud_darajat_classes_smp_v4';
const STORAGE_KEY_OVERRIDES = 'kasyfud_darajat_overrides_v1';
const STORAGE_KEY_CLASS_SUBJECTS = 'kasyfud_darajat_class_subjects_v1';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getSavedAuthUser());

  // Resolve role flags at the top of the component so every callback/effect/render
  // sees initialized bindings. Keeping these above the early login return also
  // prevents a Temporal Dead Zone (TDZ) when the production bundle evaluates App.
  const [subjects] = useState<Subject[]>(INITIAL_SUBJECTS);

  const [schoolType] = useState<SchoolType>('mukim');
  const [activeJenjang] = useState<JenjangUnit>('SMA');
  const SMA_MUKIM_CLASS_IDS = new Set([
    '1int',
    '2int-a', '2int-b',
    '3int-a', '3int-b',
    '4a', '4b', '4c',
    '5a', '5b', '5c', '5d',
    '6a', '6b', '6c', '6d',
  ]);

  const [classes] = useState<ClassItem[]>(() =>
    INITIAL_CLASSES.filter((c) => SMA_MUKIM_CLASS_IDS.has(c.id))
  );

  // Active class ID e.g. '1a', '1b', '1d', '1e', '1-int-a', 'x-a-fd'
  const [selectedClassId, setSelectedClassId] = useState<string>('3int-b');

  // Active subject ID for teacher grading e.g. 's1' (Tamrin Lughoh)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('s1');

  // NILAI BUKAN DATA FRONTEND: hanya identitas siswa yang dimuat dari master.
  // Nilai selalu kosong saat aplikasi/reload dibuka dan diambil ulang dari Spreadsheet
  // ketika kelas dibuka.
  const [students, setStudents] = useState<StudentRecord[]>(() =>
    INITIAL_STUDENTS
      .filter((s) => SMA_MUKIM_CLASS_IDS.has(s.classId))
      .map((s) => ({ ...s, scores: {}, schoolType: 'mukim' as const }))
  );


  const [config, setConfig] = useState<SchoolConfig>(() => {
    const defaultWali = getWaliKelasForClass('1a') || 'AMALIA NUR FARHIFA, S.Pd.';
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.waliKelasName || parsed.waliKelasName.includes('Siti Nurhaliza')) {
          parsed.waliKelasName = defaultWali;
        }
        if (!parsed.subTitleAr || parsed.subTitleAr.includes('لتقييم منتصف')) {
          parsed.subTitleAr = 'للامتحان التّحريري لفصل الدّراسي الأوّل';
        }
        if (parsed.subTitleId && (parsed.subTitleId.includes('PENILAIAN') || parsed.subTitleId.includes('SUMATIF'))) {
          parsed.subTitleId = 'ASESMEN TENGAH SEMESTER GANJIL';
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      ...INITIAL_SCHOOL_CONFIG,
      subTitleAr: 'للامتحان التّحريري لفصل الدّراسي الأوّل',
      classLatin: '1A (Kelas 1 SMP A)',
      classAr: 'الأوّل - A',
      waliKelasName: defaultWali,
    };
  });

  // Active view: 'master' (Data Master) | 'muatan' (Muatan Mapel) | 'databaseGuru' (Database Guru & Mapel) | 'guru' (Input Nilai) | 'raport' (Raport) | 'rekap' (Rekapitulasi)
  const [activeTab, setActiveTab] = useState<'master' | 'muatan' | 'databaseGuru' | 'guru' | 'raport' | 'rekap' | 'sikap'>('master');

  // Enforce strict role-based view access:
  // - Guru: ONLY 'guru'
  // - Wali Kelas: ONLY 'raport', 'rekap', 'guru'
  // - Admin: All views
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'guru') {
      if (activeTab !== 'guru') {
        setActiveTab('guru');
      }
    } else if (currentUser.role === 'wali_kelas') {
      if (activeTab === 'master' || activeTab === 'muatan' || activeTab === 'databaseGuru') {
        setActiveTab('raport');
      }
    }
  }, [currentUser, activeTab]);

  // Selected student index within the currently viewed class for Raport preview (0-indexed)
  const [selectedClassStudentIndex, setSelectedClassStudentIndex] = useState<number>(0);

  // Range for batch printing
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(15);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<CalculatedStudent | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [designConfig, setDesignConfig] = useState<ReportDesignConfig>(() => getSavedDesignConfig());
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [selectedCol, setSelectedCol] = useState<SelectedColumnKey>('no');

  // Google Sheets Cloud Sync State (Multi-Device)
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
    const initialType = ((): SchoolType => {
      const savedUser = getSavedAuthUser();
      if (savedUser?.schoolType) return savedUser.schoolType;
      try {
        const saved = localStorage.getItem('kasyfud_darajat_active_school_type');
        if (saved === 'fullday' || saved === 'mukim') return saved;
      } catch {}
      return 'mukim';
    })();
    const savedUser = getSavedAuthUser();
    return getStoredSheetsUrl();
  });
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SHEETS_AUTOSYNC) !== 'false';
    } catch {
      return true;
    }
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    const initialType = ((): SchoolType => {
      const savedUser = getSavedAuthUser();
      if (savedUser?.schoolType) return savedUser.schoolType;
      try {
        const saved = localStorage.getItem('kasyfud_darajat_active_school_type');
        if (saved === 'fullday' || saved === 'mukim') return saved;
      } catch {}
      return 'mukim';
    })();
    return getStoredLastSync();
  });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isAiAuditOpen, setIsAiAuditOpen] = useState(false);
  const [aiAuditLoading, setAiAuditLoading] = useState(false);
  const [aiAuditMode, setAiAuditMode] = useState<'fast' | 'deep'>('fast');
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [aiAuditError, setAiAuditError] = useState('');

  // Feature Dropdown Menu State
  const [isFeatureMenuOpen, setIsFeatureMenuOpen] = useState<boolean>(false);
  const featureMenuRef = useRef<HTMLDivElement>(null);

  // Close feature dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (featureMenuRef.current && !featureMenuRef.current.contains(event.target as Node)) {
        setIsFeatureMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFeatureMenuOpen(false);
      }
    }
    if (isFeatureMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFeatureMenuOpen]);

  const handleSelectSchoolType = (_type: SchoolType) => { /* V5.1 is SMA Mukim only. */ };
  // Keep the server-side spreadsheet target aligned with the active jenjang.
  useEffect(() => {
    const nextUrl = getStoredSheetsUrl();
    setSheetsUrl(nextUrl);
    setLastSyncTime(getStoredLastSync());
  }, [activeJenjang, schoolType, selectedClassId]);

  // Excel Cell Selection & Formula Bar Sync
  const [activeCellLabel, setActiveCellLabel] = useState<string>('A1');
  const [activeCellValue, setActiveCellValue] = useState<string>('');
  const [activeCellCoord, setActiveCellCoord] = useState<{ row: number; col: number } | null>(null);

  // Custom Subject Overrides (Arabic name, Latin name, Custom Terbilang)
  const [customSubjectOverrides, setCustomSubjectOverrides] = useState<
    Record<string, { nameAr?: string; nameId?: string; customTerbilang?: string }>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(customSubjectOverrides));
    } catch {
      // ignore
    }
  }, [customSubjectOverrides]);

  // Custom Class Subjects (Dynamic add/delete rows per class)
  const [customClassSubjects, setCustomClassSubjects] = useState<Record<string, Subject[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASS_SUBJECTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLASS_SUBJECTS, JSON.stringify(customClassSubjects));
    } catch {
      // ignore
    }
  }, [customClassSubjects]);

  const handleUpdateSubjectName = (
    subjectId: string,
    overrides: { nameAr?: string; nameId?: string; customTerbilang?: string }
  ) => {
    setCustomSubjectOverrides((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        ...overrides,
      },
    }));
  };

  const handleActiveCellChange = (
    label: string,
    value: string,
    coord?: { row: number; col: number }
  ) => {
    setActiveCellLabel(label);
    setActiveCellValue(value);
    if (coord) {
      setActiveCellCoord(coord);
    }
  };

  const handleSaveDesignConfig = (newConfig: ReportDesignConfig) => {
    setDesignConfig(newConfig);
    saveDesignConfig(newConfig);
  };

  // Auto-sync config header class information when selectedClassId changes
  useEffect(() => {
    const cls = classes.find((c) => c.id === selectedClassId) || INITIAL_CLASSES.find((c) => c.id === selectedClassId);
    if (cls) {
      const isFullDay = cls.schoolType === 'fullday';
      const officialWali = cls.waliKelasName || getWaliKelasForClass(cls.id, classes) || getWaliKelasForClass(cls.nameLatin, classes);
      setConfig((prev) => ({
        ...prev,
        classLatin: cls.nameLatin,
        classAr: cls.nameAr,
        waliKelasName: officialWali || prev.waliKelasName,
        schoolType: isFullDay ? 'fullday' : 'mukim',
        subTitleId: isFullDay ? 'ASESMEN TENGAH SEMESTER GANJIL' : prev.subTitleId,
        schoolName: isFullDay
          ? (cls.nameLatin.toLowerCase().includes('smp') || cls.id.startsWith('vii') || cls.id.startsWith('viii') || cls.id.startsWith('ix') ? 'SMP ISLAM AL-GHOZALI' : 'SMA ISLAM AL GHOZALI')
          : (prev.schoolType === 'fullday' ? 'KMI PONDOK MODERN AL-GHOZALI' : prev.schoolName),
        programStudi: cls.jurusan || prev.programStudi || (isFullDay ? 'UMUM' : undefined),
        kepalaSekolahName: isFullDay
          ? (cls.nameLatin.toLowerCase().includes('smp') || cls.id.startsWith('vii') || cls.id.startsWith('viii') || cls.id.startsWith('ix') ? 'ISWAHYUDIN, SE' : 'Antoni Firdaus, M.Pd.')
          : prev.kepalaSekolahName,
        kepalaSekolahSmpName: 'ISWAHYUDIN, SE',
      }));
    }
  }, [selectedClassId, classes]);

  // Nilai tidak pernah disimpan ke localStorage. Google Spreadsheet adalah source of truth.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
    } catch {
      // ignore
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  // V5.1 class catalog is immutable; class metadata comes from the SMA Mukim master.
  const handleSaveConfig = (newConf: SchoolConfig) => {
    setConfig(newConf);
  };

  // Dynamically compute totals, averages, and ranks for ALL students grouped by class
  const calculatedStudents: CalculatedStudent[] = useMemo(() => {
    // 1. Calculate raw total and average for each student based on their class-specific curriculum
    const withTotals = students.map((std) => {
      const classId = std.classId || '1a';
      const classSubjects = customClassSubjects[classId] || getSubjectsForClass(classId);
      const studentScores = ensureStudentScoresForClass(std.scores, classId, std.nisn || std.id);
      const total = classSubjects.reduce((sum, sub) => {
        const val = studentScores[sub.id];
        return sum + (typeof val === 'number' && !isNaN(val) ? val : 0);
      }, 0);
      const scoredCount = classSubjects.filter((sub) => typeof studentScores[sub.id] === 'number' && !isNaN(studentScores[sub.id])).length;
      const avg = scoredCount > 0 ? Math.round(total / scoredCount) : 0;
      return {
        ...std,
        scores: studentScores,
        totalScore: total,
        averageScore: avg,
        rank: 1, // placeholder
      };
    });

    // 2. Rank students descending by totalScore WITHIN EACH CLASS
    const rankMap = new Map<string, number>();
    const byClass: Record<string, typeof withTotals> = {};

    withTotals.forEach((s) => {
      const cId = s.classId || '1a';
      if (!byClass[cId]) byClass[cId] = [];
      byClass[cId].push(s);
    });

    Object.values(byClass).forEach((classGroup) => {
      const sorted = [...classGroup].sort((a, b) => b.totalScore - a.totalScore);
      let currentRank = 1;
      sorted.forEach((item, idx) => {
        if (idx > 0 && item.totalScore < sorted[idx - 1].totalScore) {
          currentRank = idx + 1;
        }
        rankMap.set(item.id, currentRank);
      });
    });

    // 3. Return students with assigned ranks
    return withTotals.map((s) => ({
      ...s,
      rank: rankMap.get(s.id) || 1,
    }));
  }, [students, customClassSubjects]);

  // Current subjects for the currently selected class
  const currentClassSubjects = useMemo(() => {
    return customClassSubjects[selectedClassId] || getSubjectsForClass(selectedClassId);
  }, [customClassSubjects, selectedClassId]);

  // Ensure active subject ID matches available subjects in selected class
  useEffect(() => {
    if (
      currentClassSubjects.length > 0 &&
      !currentClassSubjects.some((s) => s.id === selectedSubjectId)
    ) {
      setSelectedSubjectId(currentClassSubjects[0].id);
    }
  }, [currentClassSubjects, selectedSubjectId]);

  // Students in currently selected class
  const studentsInCurrentClass = useMemo(() => {
    return calculatedStudents.filter(
      (s) => (s.classId || '1a') === selectedClassId
    );
  }, [calculatedStudents, selectedClassId]);

  // Safe active student for Raport view
  const safeIndex = Math.max(
    0,
    Math.min(selectedClassStudentIndex, studentsInCurrentClass.length - 1)
  );
  const activeStudent = studentsInCurrentClass[safeIndex] || studentsInCurrentClass[0];

  // Update batch print range when class changes
  useEffect(() => {
    setRangeStart(1);
    setRangeEnd(Math.max(1, studentsInCurrentClass.length));
  }, [selectedClassId, studentsInCurrentClass.length]);

  // Handlers
  const handleUpdateStudentName = (studentId: string, newName: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, name: newName } : s))
    );
  };

  const handleUpdateSikap = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((student) => (student.id === studentId ? { ...student, sikap: value } : student))
    );
  };

  const handleUpdateStudentNisn = (studentId: string, newNisn: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, nisn: newNisn } : s))
    );
  };

  const handleAddSubject = () => {
    const existingSubjects = currentClassSubjects;
    const nextNumber = existingSubjects.length + 1;
    const newSubjectId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSubject: Subject = {
      id: newSubjectId,
      order: nextNumber,
      nameAr: `مادة جديدة ${nextNumber}`,
      nameId: `Mata Pelajaran ${nextNumber}`,
      category: 'umum',
    };
    const updated = [...existingSubjects, newSubject];

    setCustomClassSubjects((prev) => ({
      ...prev,
      [selectedClassId]: updated,
    }));

    // Initialize score (80) for this subject on all students in current class
    setStudents((prev) =>
      prev.map((s) => {
        if ((s.classId || '1a') !== selectedClassId) return s;
        return {
          ...s,
          scores: {
            ...s.scores,
            [newSubjectId]: s.scores[newSubjectId] ?? 80,
          },
        };
      })
    );
  };

  const handleDeleteSubject = (subjectId: string) => {
    const existingSubjects = currentClassSubjects;
    const updated = existingSubjects
      .filter((s) => s.id !== subjectId)
      .map((s, idx) => ({
        ...s,
        order: idx + 1, // renumber sequentially
      }));

    setCustomClassSubjects((prev) => ({
      ...prev,
      [selectedClassId]: updated,
    }));

    // Clean up score key from students in this class
    setStudents((prev) =>
      prev.map((s) => {
        if ((s.classId || '1a') !== selectedClassId) return s;
        const newScores = { ...s.scores };
        delete newScores[subjectId];
        return {
          ...s,
          scores: newScores,
        };
      })
    );
  };

  const handleDeleteActiveRow = () => {
    if (!activeCellCoord) return;
    const subject = currentClassSubjects[activeCellCoord.row];
    if (subject) {
      handleDeleteSubject(subject.id);
    }
  };
  // Google Sheets Handlers
  const handleRunAiAudit = async () => {
    if (!sheetsUrl) {
      setAiAuditError('Koneksi Apps Script belum tersedia.');
      return;
    }
    setAiAuditLoading(true);
    setAiAuditError('');
    setAiAuditResult(null);
    try {
      const activeClass = classes.find((c) => c.id === selectedClassId);
      const dataset = {
        scope: {
          schoolType,
          unit: activeJenjang,
          classId: selectedClassId,
          className: activeClass?.nameLatin || config.classLatin || selectedClassId,
          programStudi: activeClass?.jurusan || config.programStudi || ''
        },
        classes: classes.map((c) => ({
          id: c.id,
          name: c.nameLatin || '',
          jurusan: c.jurusan || '',
          unit: getJenjangForClass(c)
        })),
        students: studentsInCurrentClass.map((s) => ({
          id: s.id,
          no: s.no,
          name: s.name,
          nis: (s as any).nis || '',
          nisn: s.nisn || '',
          classId: s.classId,
          scores: s.scores
        })),
        subjects: currentClassSubjects.map((s) => ({
          id: s.id,
          name: s.nameId,
          nameAr: s.nameAr
        })),
        class: activeClass || null
      };

      const response = await fetch(sheetsUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'aiAudit',
          mode: aiAuditMode,
          dataset
        }),
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Audit AI gagal dijalankan.');
      }
      setAiAuditResult(data.audit || null);
    } catch (error) {
      setAiAuditError(error instanceof Error ? error.message : 'Audit AI gagal dijalankan.');
    } finally {
      setAiAuditLoading(false);
    }
  };

  const handleSaveSheetsUrl = (url: string, _targetSchoolType?: SchoolType) => {
    saveStoredSheetsUrl(url);
    setSheetsUrl(url);
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setIsAutoSyncEnabled(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_SHEETS_AUTOSYNC, String(enabled));
    } catch {
      // ignore
    }
  };

  const handleApplyScoresFromSheets = (studentsScores: Record<string, Record<string, number>>) => {
    setStudents((prev) =>
      prev.map((s) => {
        const nisnKey = s.nisn ? s.nisn.trim() : '';
        const nameKey = s.name ? s.name.trim().toLowerCase() : '';
        const incomingScores =
          studentsScores[s.id] ||
          (nisnKey ? studentsScores[nisnKey] : undefined) ||
          (nameKey ? studentsScores[nameKey] : undefined);

        if (incomingScores && Object.keys(incomingScores).length > 0) {
          const resolvedScores: Record<string, number> = { ...s.scores };

          Object.entries(incomingScores).forEach(([rawKey, val]) => {
            if (typeof val === 'number' && !isNaN(val)) {
              resolvedScores[rawKey] = val;

              // Check catalog for ID / legacy ID / nameId normalization
              const catalogEntry =
                MASTER_SUBJECTS_CATALOG[rawKey] ||
                Object.values(MASTER_SUBJECTS_CATALOG).find(
                  (m) =>
                    m.id === rawKey ||
                    m.legacyId === rawKey ||
                    m.nameId.toLowerCase() === rawKey.toLowerCase()
                );

              if (catalogEntry) {
                resolvedScores[catalogEntry.id] = val;
                resolvedScores[catalogEntry.nameId] = val;
                if (catalogEntry.legacyId) {
                  resolvedScores[catalogEntry.legacyId] = val;
                }
              }
            }
          });

          return {
            ...s,
            scores: resolvedScores,
          };
        }
        return s;
      })
    );
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setLastSyncTime(now);
    saveStoredLastSync(now);
    setSyncStatus('synced');
  };

  // Antrean tertunda untuk sinkronisasi Google Sheets (mencegah lag & lock timeout)
  const pendingSyncQueueRef = useRef<
    Map<string, { studentId: string; studentNo?: number; classId: string; className?: string; studentName: string; nisn: string; subjectId: string; subjectName?: string; score: number }>
  >(new Map());
  const syncDebounceTimerRef = useRef<any>(null);

  const flushPendingSyncQueue = () => {
    if (!currentUser || !sheetsUrl || !isAutoSyncEnabled || pendingSyncQueueRef.current.size === 0) return;

    const itemsToSend = Array.from(pendingSyncQueueRef.current.values());
    pendingSyncQueueRef.current.clear();

    setSyncStatus('syncing');
    // Kirim di latar belakang tanpa memblokir antarmuka pengguna
    Promise.allSettled(
      itemsToSend.map((item) =>
        saveSingleScoreToSheets(sheetsUrl, item)
      )
    ).then((results) => {
      const anySuccess = results.some((r) => r.status === 'fulfilled' && r.value.success);
      if (anySuccess) {
        setSyncStatus('synced');
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(now);
        saveStoredLastSync(now);
      } else {
        setSyncStatus('error');
      }
    });
  };

  // SERVER-SOURCE-OF-TRUTH: nilai dipanggil ulang setiap kali kelas dibuka/dipilih.
  // Tidak ada polling dan tidak ada cache nilai di browser.
  useEffect(() => {
    if (!currentUser || !sheetsUrl || !sheetsUrl.trim().startsWith('http') || !selectedClassId) return;

    let cancelled = false;
    setStudents((prev) => prev.map((s) =>
      (s.classId || '') === selectedClassId ? { ...s, scores: {} } : s
    ));
    setSyncStatus('syncing');

    fetchScoresForClassFromSheets(sheetsUrl, selectedClassId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          handleApplyScoresFromSheets(res.studentsScores || {});
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) setSyncStatus('error');
      });

    return () => { cancelled = true; };
  }, [sheetsUrl, selectedClassId, currentUser?.role]);

  const handleUpdateScore = async (studentId: string, subjectId: string, value: number) => {
    // NILAI TIDAK DITULIS KE STATE FRONTEND.
    // Satu-satunya write adalah ke Google Spreadsheet. Setelah berhasil,
    // tampilan tetap kosong; saat kelas dibuka kembali, nilai dipanggil lagi dari server.
    if (!currentUser || !sheetsUrl) {
      setSyncStatus('error');
      return;
    }

    const targetStudent = students.find((s) => s.id === studentId);
    const subject = currentClassSubjects.find((s) => s.id === subjectId);
    if (!targetStudent || !subject) return;

    setSyncStatus('syncing');
    try {
      const result = await saveSingleScoreToSheets(sheetsUrl, {
        studentId: targetStudent.id,
        studentNo: targetStudent.no || 0,
        classId: targetStudent.classId || selectedClassId,
        className: classes.find((c) => c.id === (targetStudent.classId || selectedClassId))?.nameLatin || selectedClassId,
        studentName: targetStudent.name,
        nisn: targetStudent.nisn || '',
        subjectId: subject.id,
        subjectName: subject.nameId,
        score: value,
        role: currentUser.role,
      });

      if (result.success) {
        // Nilai yang sudah tersimpan langsung dikeluarkan dari state frontend.
        // Saat kelas dibuka kembali, nilai akan dipanggil ulang dari Spreadsheet.
        setStudents((prev) => prev.map((s) => {
          if (s.id !== studentId) return s;
          const scores = { ...s.scores };
          delete scores[subjectId];
          return { ...s, scores };
        }));
      }

      setSyncStatus(result.success ? 'synced' : 'error');
      if (result.success) {
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(now);
        saveStoredLastSync(now);
      }
    } catch {
      setSyncStatus('error');
    }
  };

  const handleChangeCellValue = (newVal: string) => {
    setActiveCellValue(newVal);
    if (!activeCellCoord || !activeStudent) return;
    const { row, col } = activeCellCoord;
    const subject = currentClassSubjects[row];
    if (!subject) return;

    if (col === 3) {
      // Nilai
      const numVal = Math.max(0, Math.min(100, Number(newVal) || 0));
      handleUpdateScore(activeStudent.id, subject.id, numVal);
    } else if (col === 1) {
      handleUpdateSubjectName(subject.id, { nameAr: newVal });
    } else if (col === 2) {
      handleUpdateSubjectName(subject.id, { nameId: newVal });
    } else if (col === 4) {
      handleUpdateSubjectName(subject.id, { customTerbilang: newVal });
    }
  };

  const handleSaveStudent = (data: {
    id?: string;
    classId: string;
    name: string;
    nisn: string;
    scores: Record<string, number>;
    keterangan?: string;
  }) => {
    if (data.id) {
      // Edit existing
      setStudents((prev) =>
        prev.map((s) =>
          s.id === data.id
            ? {
                ...s,
                classId: data.classId,
                name: data.name,
                nisn: data.nisn,
                scores: data.scores,
                keterangan: data.keterangan,
              }
            : s
        )
      );
    } else {
      // Add new
      const newStudent: StudentRecord = {
        id: `std-${Date.now()}`,
        no: students.length + 1,
        classId: data.classId,
        name: data.name,
        nisn: data.nisn,
        scores: data.scores,
        keterangan: data.keterangan || 'Tuntas',
      };
      setStudents((prev) => [...prev, newStudent]);
      setSelectedClassId(data.classId);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (students.length <= 1) {
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    if (selectedClassStudentIndex >= studentsInCurrentClass.length - 1) {
      setSelectedClassStudentIndex(Math.max(0, studentsInCurrentClass.length - 2));
    }
  };

  const handleResetToDefault = () => {
    setStudents(INITIAL_STUDENTS);
    setSelectedClassId('1a');
    setSelectedClassStudentIndex(0);
    setRangeStart(1);
    setRangeEnd(15);
    try {
      localStorage.removeItem(STORAGE_KEY_STUDENTS);
    } catch {
      // ignore
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handlePrintSingle = () => {
    window.print();
  };

  /**
   * Menggunakan exportRaportToPdf (jspdf + html2canvas) untuk mengekspor
   * tampilan aktif ReportCertificate ke dalam file PDF resmi (A4).
   */
  const handleDownloadActiveRaportPdf = async () => {
    if (!activeStudent) return;
    const certificateEl = document.getElementById('raport-certificate-container');
    if (!certificateEl) {
      alert('Elemen raport santri tidak ditemukan.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const safeStudentName = activeStudent.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeClassName = (config.classLatin || selectedClassId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Raport_${safeStudentName}_${safeClassName}.pdf`;

      const success = await exportRaportToPdf(certificateEl, fileName);
      if (!success) {
        alert('Gagal mengekspor PDF. Anda dapat menggunakan tombol Cetak browser sebagai alternatif.');
      }
    } catch (error) {
      console.error('Gagal mencetak raport ke PDF:', error);
      alert('Gagal mengekspor PDF. Anda dapat menggunakan tombol Cetak browser sebagai alternatif.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenBatchPrint = () => {
    setIsBatchPrintOpen(true);
  };

  const handleOpenRaportForStudent = (studentId: string) => {
    const student = calculatedStudents.find((s) => s.id === studentId);
    if (student) {
      const targetClass = student.classId || '1a';
      setSelectedClassId(targetClass);
      const classStudents = calculatedStudents.filter((s) => (s.classId || '1a') === targetClass);
      const idxInClass = classStudents.findIndex((s) => s.id === studentId);
      if (idxInClass !== -1) {
        setSelectedClassStudentIndex(idxInClass);
      }
      setActiveTab('raport');
    }
  };

  const handleNavigateToGrading = (classId: string) => {
    setSelectedClassId(classId);
    setActiveTab('guru');
  };

  const handleSelectJenjang = (unit: JenjangUnit) => {
    /* V5.1 fixed to SMA */
    const classesForUnit = getClassesForUserAndJenjang(currentUser, unit, classes, schoolType);
    if (classesForUnit.length > 0) {
      setSelectedClassId(classesForUnit[0].id);
      setSelectedClassStudentIndex(0);
    }
  };

  const handleSelectClassWithJenjangSync = (classId: string) => {
    if (classId === 'all') {
      setSelectedClassId('all');
      return;
    }
    const targetClass = classes.find((c) => c.id === classId) || INITIAL_CLASSES.find((c) => c.id === classId);
    if (targetClass) {
      const targetJenjang = getJenjangForClass(targetClass);
      if (targetJenjang && targetJenjang !== activeJenjang) {
        /* V5.1 fixed to SMA */
      }
    }
    setSelectedClassId(classId);
    setSelectedClassStudentIndex(0);
  };

  const filteredClassesForUser = useMemo(() => {
    return getClassesForUserAndJenjang(currentUser, 'SMA', classes, 'mukim');
  }, [currentUser, activeJenjang, classes, schoolType]);

  // Ensure selectedClassId is valid within current filtered classes
  useEffect(() => {
    if (selectedClassId !== 'all' && filteredClassesForUser.length > 0 && !filteredClassesForUser.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(filteredClassesForUser[0].id);
      setSelectedClassStudentIndex(0);
    }
  }, [filteredClassesForUser, selectedClassId]);

  const handleLoginSuccess = (user: AuthUser) => {
    saveAuthUser(user);
    setCurrentUser(user);

    const userSchoolType = user.schoolType;
    const targetSchoolType = userSchoolType || schoolType;
    if (userSchoolType) {
      try {
        localStorage.setItem('kasyfud_darajat_active_school_type', userSchoolType);
      } catch {}
      setSheetsUrl(getStoredSheetsUrl());
      setLastSyncTime(getStoredLastSync());
    }

    const initialUnit: JenjangUnit = 'SMA';
    /* V5.1 fixed to SMA */

    const initialClasses = getClassesForUserAndJenjang(user, initialUnit, classes, targetSchoolType);

    if (user.role === 'guru') {
      setActiveTab('guru');
      if (initialClasses.length > 0) {
        setSelectedClassId(initialClasses[0].id);
      }
    } else if (user.role === 'wali_kelas') {
      if (user.homeroomClassId) {
        setSelectedClassId(user.homeroomClassId);
      } else if (initialClasses.length > 0) {
        setSelectedClassId(initialClasses[0].id);
      }
      setActiveTab('raport');
    } else {
      setActiveTab('master');
      if (initialClasses.length > 0) {
        setSelectedClassId(initialClasses[0].id);
      }
    }
  };

  const handleLogout = () => {
    clearAdminSessionToken();
    clearTeacherSessionToken();
    saveAuthUser(null);
    setCurrentUser(null);
  };

  // If no user is logged in, present the Login Gateway
  if (!currentUser) {
    return <LoginView classes={classes} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col selection:bg-emerald-200">
      {/* Top Application Navigation Bar (Hidden during print) */}
      <header className="no-print bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-md">
        {/* Main Navbar Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 py-2 flex items-center justify-between gap-3">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <SchoolLogo size={38} className="drop-shadow" />
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-sm sm:text-base tracking-wide text-white">
                    {schoolType === 'fullday' ? 'Raport Al-Ghozali' : 'Kasyfud Darajat'}
                  </h1>
                  <span className="text-[9px] sm:text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-md font-extrabold tracking-wider">
                    V5.1.0
                  </span>
                </div>
                {schoolType === 'mukim' ? (
                  <span className="font-arabic text-emerald-400 font-bold text-base leading-none">
                    (كَشْفُ الدَّرَجَاتِ)
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Full Day
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
                {schoolType === 'fullday'
                  ? `SMP & SMA Islam Al-Ghozali • TA ${config.academicYearLatin}`
                  : `Pondok Modern Al-Ghozali • TA ${config.academicYearLatin}`}
              </p>
            </div>
          </div>

          {/* School Type Switcher (Pondok Mukim vs Full Day) */}
          <div className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-700/80 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => handleSelectSchoolType('mukim')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                schoolType === 'mukim'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Sistem Pondok Modern (Mukim) - Format Kasyfud Darajat"
            >
              <span>🕌</span>
              <span className="hidden sm:inline">Pondok (Mukim)</span>
              <span className="sm:hidden">Mukim</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSchoolType('fullday')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                schoolType === 'fullday'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Sistem Sekolah Full Day - Format Raport Nasional"
            >
              <span>🏫</span>
              <span className="hidden sm:inline">Full Day</span>
              <span className="sm:hidden">Full Day</span>
            </button>
          </div>

          {/* User Profile Badge & Dropdown Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            {/* User Info Badge */}
            <div className="hidden md:flex items-center gap-2 bg-stone-800/90 border border-stone-700/80 px-2.5 py-1.5 rounded-xl">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  currentUser?.role === 'admin'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : currentUser?.role === 'wali_kelas'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {currentUser?.role === 'admin' ? (
                  <ShieldCheck size={16} />
                ) : currentUser?.role === 'wali_kelas' ? (
                  <GraduationCap size={16} />
                ) : (
                  <UserCheck size={16} />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5 leading-tight">
                  <span className="truncate max-w-[130px]">{currentUser.name}</span>
                </div>
                <span className="text-[10px] text-stone-400 block font-medium leading-tight">
                  {currentUser?.role === 'admin'
                    ? 'Administrator'
                    : currentUser?.role === 'wali_kelas'
                    ? `Wali ${currentUser.homeroomClassName || currentUser.unit || 'Kelas'}`
                    : `Guru • ${currentUser.unit || 'Pengampu'}`}
                </span>
              </div>
            </div>

            {/* Dropdown Menu Fitur & Aksi */}
            <div className="relative" ref={featureMenuRef}>
              <button
                type="button"
                onClick={() => setIsFeatureMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition border shadow-xs ${
                  isFeatureMenuOpen
                    ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-stone-800/90 hover:bg-stone-700 text-stone-100 border-stone-700 hover:border-stone-600'
                }`}
                title="Buka Menu Fitur & Pengaturan"
              >
                <div className="relative flex items-center justify-center">
                  <Sliders size={14} className={isFeatureMenuOpen ? 'text-white' : 'text-emerald-400'} />
                  {currentUser?.role === 'admin' && sheetsUrl && (
                    <span
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        syncStatus === 'syncing'
                          ? 'bg-amber-400 animate-spin'
                          : syncStatus === 'error'
                          ? 'bg-rose-400'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                      title={syncStatus === 'syncing' ? 'Sedang Sinkronisasi' : syncStatus === 'error' ? 'Sync Error' : 'Tersinkronisasi'}
                    />
                  )}
                </div>
                <span>Menu Fitur</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isFeatureMenuOpen ? 'rotate-180 text-white' : 'text-stone-400'
                  }`}
                />
              </button>

              {/* Dropdown Popover */}
              {isFeatureMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-stone-900 border border-stone-700/90 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 text-stone-200 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-stone-800"
                  role="menu"
                >
                  {/* User Profile Summary */}
                  <div className="px-4 py-3 bg-stone-950/60 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        currentUser?.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : currentUser?.role === 'wali_kelas'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {currentUser?.role === 'admin' ? (
                        <ShieldCheck size={18} />
                      ) : currentUser?.role === 'wali_kelas' ? (
                        <GraduationCap size={18} />
                      ) : (
                        <UserCheck size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-100 truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-stone-400 font-medium truncate">
                        {currentUser?.role === 'admin'
                          ? 'Administrator Sistem'
                          : currentUser?.role === 'wali_kelas'
                          ? `Wali ${currentUser.homeroomClassName || currentUser.unit || 'Kelas'}`
                          : `Guru • ${currentUser.unit || 'Pengampu'}`}
                      </div>
                      <div className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-800 text-stone-300 rounded border border-stone-700">
                        {schoolType === 'fullday' ? 'Mode Full Day' : 'Mode Pondok (Mukim)'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="py-1.5 px-1 space-y-0.5">
                    <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Fitur & Alat Raport
                    </div>

                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudent(null);
                          setIsStudentModalOpen(true);
                          setIsFeatureMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-stone-800 transition text-stone-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Plus size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-stone-100 group-hover:text-emerald-300 transition-colors">
                            Tambah Siswa Baru
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            Input manual data santri/siswa baru
                          </div>
                        </div>
                      </button>
                    )}

                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDesignModalOpen(true);
                          setIsFeatureMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-stone-800 transition text-stone-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Palette size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-stone-100 group-hover:text-teal-300 transition-colors">
                            Desain & Bingkai Rapor
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            Kustomisasi bingkai, font, & layout (CRUD)
                          </div>
                        </div>
                      </button>
                    )}

                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAiAuditResult(null);
                          setAiAuditError('');
                          setIsAiAuditOpen(true);
                          setIsFeatureMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-stone-800 transition text-stone-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Sparkles size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-stone-100 group-hover:text-violet-300 transition-colors">Cek Data dengan AI</div>
                          <div className="text-[10px] text-stone-400 truncate">GPT-OSS 20B / 120B • audit tanpa mengubah data</div>
                        </div>
                      </button>
                    )}

                    {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSyncModalOpen(true);
                        setIsFeatureMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-stone-800 transition text-stone-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {syncStatus === 'syncing' ? (
                          <Loader2 size={16} className="animate-spin text-amber-400" />
                        ) : (
                          <Cloud size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-stone-100 group-hover:text-blue-300 transition-colors flex items-center justify-between">
                          <span>Google Spreadsheet</span>
                          {sheetsUrl && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                syncStatus === 'syncing'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : syncStatus === 'error'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {syncStatus === 'syncing' ? 'Sync...' : syncStatus === 'error' ? 'Error' : 'Tersambung'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          {sheetsUrl ? 'Data tersimpan' : 'Status data dikelola Admin'}
                        </div>
                      </div>
                    </button>


                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserGuideOpen(true);
                        setIsFeatureMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-stone-800 transition text-stone-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-stone-100 group-hover:text-emerald-300 transition-colors">
                          Panduan Penggunaan
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          Alur singkat sesuai peran Anda
                        </div>
                      </div>
                    </button>

                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsModalOpen(true);
                          setIsFeatureMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-stone-800 transition text-stone-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Sliders size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-stone-100 group-hover:text-amber-300 transition-colors">
                            Pengaturan Raport
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            Titimangsa, kop, & data lembaga
                          </div>
                        </div>
                      </button>
                    )}

                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsFeatureMenuOpen(false);
                          handleResetToDefault();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-rose-950/30 transition text-stone-300 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-400 border border-stone-700 flex items-center justify-center shrink-0 group-hover:text-rose-400 group-hover:border-rose-500/30 group-hover:scale-105 transition-all">
                          <RotateCcw size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-stone-300 group-hover:text-rose-300 transition-colors">
                            Reset Data Master
                          </div>
                          <div className="text-[10px] text-stone-500 truncate">
                            Kembalikan ke data default SMP & SMA
                          </div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Logout Item */}
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFeatureMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-rose-950/50 text-rose-300 transition group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <LogOut size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-rose-200 group-hover:text-rose-100 transition-colors">
                          Keluar / Ganti Akun
                        </div>
                        <div className="text-[10px] text-rose-400/70 truncate">
                          Akhiri sesi login saat ini
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-navbar: View Mode Tabs Bar */}
        <div className="border-t border-stone-800/80 bg-stone-900/95 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* TAB 0: Data Master Siswa (Admin Only) */}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('master')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap text-xs font-bold shrink-0 ${
                  activeTab === 'master'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Users size={15} />
                <span>Data Master ({students.length})</span>
              </button>
            )}

            {/* TAB 1: Input Nilai Guru */}
            <button
              type="button"
              onClick={() => setActiveTab('guru')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap text-xs font-bold shrink-0 ${
                activeTab === 'guru'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <PenTool size={15} />
              <span>Input Nilai Guru</span>
            </button>

            {/* TAB 2: Cetak Raport Santri (Admin & Wali Kelas) */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'wali_kelas') && (
              <button
                type="button"
                onClick={() => setActiveTab('raport')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap text-xs font-bold shrink-0 ${
                  activeTab === 'raport'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <FileText size={15} />
                <span>Cetak Raport</span>
              </button>
            )}

            {/* TAB 3: Rekapitulasi Nilai (Admin & Wali Kelas) */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'wali_kelas') && (
              <button
                type="button"
                onClick={() => setActiveTab('rekap')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap text-xs font-bold shrink-0 ${
                  activeTab === 'rekap'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <FileSpreadsheet size={15} />
                <span>Rekapitulasi Nilai</span>
              </button>
            )}

            {/* TAB: Pengisian Sikap (Admin & Wali Kelas) */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'wali_kelas') && (
              <button
                type="button"
                onClick={() => setActiveTab('sikap')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap text-xs font-bold shrink-0 ${
                  activeTab === 'sikap'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <PenTool size={15} />
                <span>Pengisian Sikap</span>
              </button>
            )}

            {/* TAB 4: Muatan Mata Pelajaran (Admin Only) */}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('muatan')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap text-xs font-bold shrink-0 ${
                  activeTab === 'muatan'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <BookOpen size={15} />
                <span>Muatan Mapel</span>
              </button>
            )}

            {/* TAB 5: Database Guru Mata Pelajaran (Admin Only) */}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('databaseGuru')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap text-xs font-bold shrink-0 ${
                  activeTab === 'databaseGuru'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <GraduationCap size={15} />
                <span>Database Guru</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:max-w-none print:w-auto print:bg-white ${isBatchPrintOpen ? 'print:hidden' : ''}`}>
        {activeTab === 'master' ? (
          /* View 0: Data Master Siswa */
          <DataMasterView
            students={calculatedStudents.filter((s) => {
              if (schoolType === 'fullday') {
                return s.schoolType === 'fullday' || classes.some((c) => c.id === s.classId && c.schoolType === 'fullday');
              }
              return s.schoolType !== 'fullday' && !classes.some((c) => c.id === s.classId && c.schoolType === 'fullday');
            })}
            classes={filteredClassesForUser}
            selectedClassId={selectedClassId}
            onSelectClassId={setSelectedClassId}
            onAddStudent={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            onEditStudent={(std) => {
              setEditingStudent(std);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onNavigateToGrading={handleNavigateToGrading}
            onNavigateToRaport={handleOpenRaportForStudent}
            schoolType={schoolType}
          />
        ) : activeTab === 'sikap' ? (
          <SikapView
            studentsInClass={studentsInCurrentClass}
            selectedClassId={selectedClassId}
            classes={filteredClassesForUser}
            onSelectClassId={setSelectedClassId}
            onUpdateSikap={handleUpdateSikap}
            currentUser={currentUser}
            sheetsUrl={sheetsUrl}
          />
        ) : activeTab === 'muatan' ? (
          /* View: Muatan Mata Pelajaran (Matriks Lengkap 13 Kolom Sesuai Dokumen Kurikulum) */
          <MuatanMataPelajaranView
            onNavigateToGrading={(cId) => {
              setSelectedClassId(cId);
              setActiveTab('guru');
            }}
          />
        ) : activeTab === 'databaseGuru' ? (
          /* View: Database Guru Mata Pelajaran (63 Mapel SMA, SMP, TMMIA) */
          <TeacherDatabaseView
            onNavigateToGrading={(cId) => {
              if (cId) setSelectedClassId(cId);
              setActiveTab('guru');
            }}
          />
        ) : activeTab === 'guru' ? (
          /* View 1: Guru Pilih Kelas -> Tampil Siswa -> Pilih Mapel Yang Diajar */
          <TeacherGradingView
            classes={filteredClassesForUser}
            selectedClassId={selectedClassId}
            onSelectClassId={setSelectedClassId}
            subjects={currentClassSubjects}
            selectedSubjectId={selectedSubjectId}
            onSelectSubjectId={setSelectedSubjectId}
            studentsInClass={studentsInCurrentClass}
            allStudents={calculatedStudents}
            onUpdateScore={handleUpdateScore}
            onOpenRaportForStudent={handleOpenRaportForStudent}
            currentUser={currentUser}
            activeJenjang={activeJenjang}
            onSelectJenjang={handleSelectJenjang}
            onOpenSyncModal={currentUser?.role === 'admin' ? () => setIsSyncModalOpen(true) : undefined}
            sheetsUrl={sheetsUrl}
            syncStatus={syncStatus}
          />
        ) : activeTab === 'raport' ? (
          /* View 2: Authentic Certificate Raport with Sidebar Controls (Image 1 layout) */
          <div className="flex flex-col lg:flex-row items-start justify-center gap-8 print:gap-0 print:block">
            {/* Printable Report Certificate with Quick Actions */}
            <div className="w-full flex-1 flex flex-col items-center overflow-x-auto pb-6 print:pb-0 print:overflow-visible print:block">
              {activeStudent ? (
                <>
                  {/* Top Action Bar above Certificate */}
                  <div className="w-full max-w-[800px] mb-3 bg-white border border-stone-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 flex-wrap print:hidden">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                        #{activeStudent.rank}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-stone-800 line-clamp-1">{activeStudent.name}</p>
                        <p className="text-[11px] text-stone-500 font-medium">
                          NISN: {activeStudent.nisn || '-'} • Kelas: {config.classLatin || selectedClassId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Toggle Mode Edit Desain Langsung (Ala Excel) - Admin Only */}
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => setIsEditingMode((prev) => !prev)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-lg transition shadow-xs ${
                            isEditingMode
                              ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                          }`}
                          title="Buka / Tutup Mode Edit Desain & Tabel Langsung (Middle Align, Font, Lebar Kolom, Padding)"
                        >
                          <Sparkles size={14} className={isEditingMode ? 'text-emerald-300' : 'text-stone-400'} />
                          <span>{isEditingMode ? 'Mode Edit: AKTIF' : 'Mode Edit Desain'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleDownloadActiveRaportPdf}
                        disabled={isExportingPdf}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white font-bold text-xs rounded-lg shadow transition disabled:opacity-50"
                        title="Download Dokumen Raport Format PDF F4 (jsPDF + html2canvas)"
                      >
                        {isExportingPdf ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Membuat PDF...</span>
                          </>
                        ) : (
                          <>
                            <FileType size={14} />
                            <span>Download PDF (F4)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintSingle}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-lg shadow transition"
                        title="Buka Dialog Cetak Browser / Simpan PDF (Kualitas Vektor Asli 100% Presisi F4)"
                      >
                        <Printer size={14} />
                        <span>Cetak / Simpan PDF (F4)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenBatchPrint}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs rounded-lg shadow transition"
                        title="Cetak Masal Seluruh Raport Santri di Kelas Ini (1 Santri 1 Lembar F4)"
                      >
                        <Layers size={14} />
                        <span>Cetak Masal ({studentsInCurrentClass.length} Santri)</span>
                      </button>
                    </div>
                  </div>

                  {/* External Excel Toolbar (Placed OUTSIDE the certificate, only in Edit Mode - Admin Only) */}
                  {currentUser?.role === 'admin' && isEditingMode && (
                    <div className="w-full max-w-[800px] mb-3">
                      <ExcelTableToolbar
                        designConfig={designConfig || DEFAULT_DESIGN_CONFIG}
                        onUpdateDesignConfig={handleSaveDesignConfig}
                        selectedCol={selectedCol}
                        onSelectCol={setSelectedCol}
                        onClose={() => setIsEditingMode(false)}
                        activeCellLabel={activeCellLabel}
                        activeCellValue={activeCellValue}
                        onChangeCellValue={handleChangeCellValue}
                        onAddRow={handleAddSubject}
                        onDeleteRow={handleDeleteActiveRow}
                      />
                    </div>
                  )}

                  <ReportCertificate
                    student={activeStudent}
                    subjects={currentClassSubjects}
                    config={config}
                    classes={classes}
                    designConfig={designConfig}
                    onUpdateDesignConfig={handleSaveDesignConfig}
                    onUpdateScore={handleUpdateScore}
                    customSubjectOverrides={customSubjectOverrides}
                    onUpdateSubjectName={handleUpdateSubjectName}
                    isEditingMode={isEditingMode}
                    selectedCol={selectedCol}
                    onSelectCol={setSelectedCol}
                    onActiveCellChange={handleActiveCellChange}
                    onOpenDateSettings={() => setIsSettingsModalOpen(true)}
                    onUpdateStudentName={handleUpdateStudentName}
                    onUpdateNisn={handleUpdateStudentNisn}
                    onAddSubject={handleAddSubject}
                    onDeleteSubject={handleDeleteSubject}
                  />
                </>
              ) : (
                <div className="bg-white p-12 rounded-xl text-center text-stone-500 shadow border border-stone-200">
                  <p className="font-bold">Belum ada santri di kelas {config.classLatin}.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(null);
                      setIsStudentModalOpen(true);
                    }}
                    className="mt-3 inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    <Plus size={14} /> Tambah Santri di Kelas Ini
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Controls (Exact arrangement matching Image 1) */}
            <div className="w-full lg:w-auto flex justify-center print:hidden no-print">
              <SidebarControls
                students={studentsInCurrentClass}
                classes={filteredClassesForUser}
                selectedClassId={selectedClassId}
                onSelectClassId={setSelectedClassId}
                selectedIndex={safeIndex}
                onSelectIndex={setSelectedClassStudentIndex}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onChangeRangeStart={setRangeStart}
                onChangeRangeEnd={setRangeEnd}
                onPrintSingle={handlePrintSingle}
                onPrintBatch={handleOpenBatchPrint}
                onOpenRekap={() => setActiveTab('rekap')}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenDesignModal={() => setIsDesignModalOpen(true)}
                onEditStudent={(std) => {
                  setEditingStudent(std);
                  setIsStudentModalOpen(true);
                }}
                config={config}
                onUpdateConfig={handleSaveConfig}
                currentUser={currentUser}
                activeJenjang={activeJenjang}
                onSelectJenjang={handleSelectJenjang}
                subjects={currentClassSubjects}
              />
            </div>
          </div>
        ) : (
          /* View 3: Rekapitulasi Nilai Asesmen Sumatif (Image 2 layout) */
          <div className="w-full">
            <RekapitulasiTable
              students={calculatedStudents}
              subjects={currentClassSubjects}
              config={config}
              classes={filteredClassesForUser}
              allClasses={classes}
              activeJenjang={activeJenjang}
              onSelectJenjang={handleSelectJenjang}
              selectedClassId={selectedClassId}
              onSelectClassId={handleSelectClassWithJenjangSync}
              onUpdateScore={handleUpdateScore}
              onAddStudent={() => {
                setEditingStudent(null);
                setIsStudentModalOpen(true);
              }}
              onDeleteStudent={handleDeleteStudent}
              onSelectStudentForRaport={(idx) => {
                setSelectedClassStudentIndex(idx);
                setActiveTab('raport');
              }}
              onOpenBatchPrint={handleOpenBatchPrint}
              onOpenSyncModal={currentUser?.role === 'admin' ? () => setIsSyncModalOpen(true) : undefined}
              onResetData={handleResetToDefault}
              currentUser={currentUser}
              schoolType={schoolType}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        student={editingStudent}
        subjects={subjects}
        classes={classes}
        defaultClassId={selectedClassId}
        onSave={handleSaveStudent}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        adminAccess={currentUser?.role === 'admin'}
        onSave={handleSaveConfig}
      />

      <BatchPrintView
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        students={studentsInCurrentClass}
        subjects={currentClassSubjects}
        config={config}
        classes={classes}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onChangeRangeStart={setRangeStart}
        onChangeRangeEnd={setRangeEnd}
        designConfig={designConfig}
        customSubjectOverrides={customSubjectOverrides}
      />

      <ReportDesignModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        currentConfig={designConfig}
        onSaveConfig={handleSaveDesignConfig}
      />

      <AiAuditModal
        isOpen={isAiAuditOpen}
        onClose={() => setIsAiAuditOpen(false)}
        onRun={handleRunAiAudit}
        loading={aiAuditLoading}
        result={aiAuditResult}
        mode={aiAuditMode}
        onModeChange={setAiAuditMode}
        error={aiAuditError}
      />

      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        currentUser={currentUser}
      />

      {currentUser?.role === 'admin' && (
      <GoogleSheetsSyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                webAppUrl={sheetsUrl}
                onSaveWebAppUrl={handleSaveSheetsUrl}
                isAutoSyncEnabled={isAutoSyncEnabled}
                onToggleAutoSync={handleToggleAutoSync}
                students={calculatedStudents}
                classes={classes}
                onApplyScoresFromSheets={handleApplyScoresFromSheets}
                lastSyncTime={lastSyncTime}
                adminAccess={currentUser?.role === 'admin'}
                activeSchoolType={schoolType}
                onSelectSchoolType={handleSelectSchoolType}
                webAppUrlMukim={getStoredSheetsUrl()}
                webAppUrlFullDay={getStoredSheetsUrl()}
              />
      )}
    </div>
  );
}

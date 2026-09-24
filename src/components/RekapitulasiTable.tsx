import React, { useState, useRef, useMemo } from 'react';
import { Subject, CalculatedStudent, SchoolConfig, ClassItem, AuthUser, SchoolType, JenjangUnit } from '../types';
import { getSubjectsForClass } from '../data/curriculumSubjects';
import { getSubjectAbbreviation } from '../utils/indonesianNumbers';
import { DAFTAR_WALI_KELAS } from '../data/waliKelasDatabase';
import {
  Printer,
  Download,
  Upload,
  Archive,
  Plus,
  RotateCcw,
  ExternalLink,
  Edit3,
  Trash2,
  Search,
  Filter,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  RefreshCw,
  GraduationCap,
  Trophy,
  SlidersHorizontal,
  ArrowUpDown,
  Star,
  Award,
  Sparkles,
  Users,
  Check,
  Cloud,
} from 'lucide-react';
import { canUserEditSubject, getJenjangForClass } from '../utils/authHelpers';
import { exportRekapToExcel } from '../utils/exportHelpers';
import { RekapitulasiAnalyticsChart } from './RekapitulasiAnalyticsChart';
import {
  downloadClassMultiSubjectTemplateExcel,
  parseClassMultiSubjectExcel,
  ParseClassMultiSubjectResult,
} from '../utils/excelGradingHelpers';

interface RekapitulasiTableProps {
  students: CalculatedStudent[];
  subjects: Subject[];
  config: SchoolConfig;
  classes?: ClassItem[];
  allClasses?: ClassItem[];
  activeJenjang?: JenjangUnit;
  onSelectJenjang?: (unit: JenjangUnit) => void;
  selectedClassId?: string;
  onSelectClassId?: (classId: string) => void;
  onUpdateScore: (studentId: string, subjectId: string, value: number) => void;
  onAddStudent: () => void;
  onDeleteStudent: (studentId: string) => void;
  onSelectStudentForRaport: (studentIndex: number) => void;
  onOpenBatchPrint?: () => void;
  onOpenSyncModal?: () => void;
  onResetData: () => void;
  currentUser?: AuthUser | null;
  schoolType?: SchoolType;
}

export const RekapitulasiTable: React.FC<RekapitulasiTableProps> = ({
  students,
  subjects,
  config,
  classes = [],
  allClasses = [],
  activeJenjang,
  onSelectJenjang,
  selectedClassId,
  onSelectClassId,
  onUpdateScore,
  onAddStudent,
  onDeleteStudent,
  onSelectStudentForRaport,
  onOpenBatchPrint,
  onOpenSyncModal,
  onResetData,
  currentUser = null,
  schoolType = 'mukim',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ studentId: string; subjectId: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [classImportResult, setClassImportResult] = useState<ParseClassMultiSubjectResult | null>(null);
  const [isClassImportModalOpen, setIsClassImportModalOpen] = useState(false);
  const [isImportingClass, setIsImportingClass] = useState(false);
  const classFileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter & Sorting state khusus santri untuk peninjauan cepat wali kelas
  type StudentFilterStatus = 'all' | 'tuntas' | 'remedial' | 'top3' | 'top10';
  type ScoreCategoryFilter = 'all' | 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbul' | 'rasib';
  type StudentSortBy = 'default' | 'rank_asc' | 'score_desc' | 'score_asc' | 'name_asc';

  const [studentFilterStatus, setStudentFilterStatus] = useState<StudentFilterStatus>('all');
  const [scoreCategoryFilter, setScoreCategoryFilter] = useState<ScoreCategoryFilter>('all');
  const [sortBy, setSortBy] = useState<StudentSortBy>('default');

  const availableClasses = useMemo(() => {
    const source = allClasses && allClasses.length > 0 ? allClasses : classes;
    return source.filter((c) =>
      schoolType === 'fullday' ? c.schoolType === 'fullday' : c.schoolType !== 'fullday'
    );
  }, [allClasses, classes, schoolType]);

  const getWaliForClassItem = (cls: ClassItem): string => {
    if (cls.waliKelasName) return cls.waliKelasName;
    const found = DAFTAR_WALI_KELAS.find(
      (w) => w.classId === cls.id || w.className.toLowerCase() === cls.nameLatin.toLowerCase()
    );
    return found?.waliName || '';
  };

  const isHomeroomClass = (cls: ClassItem) => {
    if (!currentUser) return false;
    if (currentUser.homeroomClassId && cls.id.toLowerCase() === currentUser.homeroomClassId.toLowerCase()) {
      return true;
    }
    if (
      currentUser.homeroomClassName &&
      cls.nameLatin.toLowerCase().includes(currentUser.homeroomClassName.toLowerCase())
    ) {
      return true;
    }
    const waliName = getWaliForClassItem(cls);
    if (currentUser.role === 'wali_kelas' && waliName) {
      const cleanTeacherName = currentUser.name.toLowerCase().replace(/[^a-z]/g, '');
      const cleanWaliName = waliName.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanTeacherName && cleanWaliName && (cleanWaliName.includes(cleanTeacherName) || cleanTeacherName.includes(cleanWaliName))) {
        return true;
      }
    }
    return false;
  };

  const binaanClasses = useMemo(() => {
    return availableClasses.filter(isHomeroomClass);
  }, [availableClasses, currentUser]);

  const assignedClasses = useMemo(() => {
    if (!currentUser || !currentUser.assignedClassIds) return [];
    return availableClasses.filter(
      (c) => currentUser.assignedClassIds?.includes(c.id) && !isHomeroomClass(c)
    );
  }, [availableClasses, currentUser]);

  const smpClasses = useMemo(() => {
    return availableClasses.filter(
      (c) => getJenjangForClass(c) === 'SMP' && !isHomeroomClass(c) && !currentUser?.assignedClassIds?.includes(c.id)
    );
  }, [availableClasses, currentUser]);

  const smaClasses = useMemo(() => {
    return availableClasses.filter(
      (c) => getJenjangForClass(c) === 'SMA' && !isHomeroomClass(c) && !currentUser?.assignedClassIds?.includes(c.id)
    );
  }, [availableClasses, currentUser]);

  const tmmiaClasses = useMemo(() => {
    return availableClasses.filter(
      (c) => getJenjangForClass(c) === 'TMMIA' && !isHomeroomClass(c) && !currentUser?.assignedClassIds?.includes(c.id)
    );
  }, [availableClasses, currentUser]);

  const handleClassChange = (newClassId: string) => {
    if (!onSelectClassId) return;

    if (newClassId !== 'all') {
      const targetClass = availableClasses.find((c) => c.id === newClassId);
      if (targetClass && onSelectJenjang) {
        const targetJenjang = getJenjangForClass(targetClass);
        if (targetJenjang && targetJenjang !== activeJenjang) {
          onSelectJenjang(targetJenjang);
        }
      }
    }
    onSelectClassId(newClassId);
  };

  const effectiveSubjects = (selectedClassId && selectedClassId !== 'all')
    ? getSubjectsForClass(selectedClassId)
    : subjects;

  const pondokSubjects = effectiveSubjects.filter((s) => s.category === 'pondok');
  const umumSubjects = effectiveSubjects.filter((s) => s.category === 'umum');
  const lisanSubjects = effectiveSubjects.filter((s) => s.category === 'lisan');

  const currentClass = availableClasses.find((c) => c.id === selectedClassId) || classes.find((c) => c.id === selectedClassId);
  const isCurrentClassBinaan = Boolean(currentClass && isHomeroomClass(currentClass));
  const currentClassWali = currentClass ? getWaliForClassItem(currentClass) : config.waliKelasName;

  const isFullDay =
    schoolType === 'fullday' ||
    currentClass?.schoolType === 'fullday' ||
    Boolean(
      selectedClassId &&
        (selectedClassId.includes('-fd') ||
          selectedClassId.startsWith('x-') ||
          selectedClassId.startsWith('vii-') ||
          selectedClassId.startsWith('viii-') ||
          selectedClassId.startsWith('ix-'))
    );

  // Santri pada kelas yang sedang dipilih (sebelum sub-filter status)
  const classStudents = useMemo(() => {
    return students.filter(
      (s) => (!selectedClassId || selectedClassId === 'all' || (s.classId || '1a') === selectedClassId)
    );
  }, [students, selectedClassId]);

  // Statistik agregat kelas binaan untuk diagnostik cepat wali kelas
  const stats = useMemo(() => {
    const total = classStudents.length;
    if (total === 0) {
      return {
        total: 0,
        avg: 0,
        highest: 0,
        lowest: 0,
        tuntasCount: 0,
        remedialCount: 0,
        tuntasPercentage: 0,
        mumtazCount: 0,
        topStudent: null as CalculatedStudent | null,
      };
    }
    const sum = classStudents.reduce((acc, s) => acc + (s.averageScore || 0), 0);
    const avg = Math.round((sum / total) * 10) / 10;
    const highest = Math.max(...classStudents.map((s) => s.averageScore || 0));
    const lowest = Math.min(...classStudents.map((s) => s.averageScore || 0));
    const tuntasCount = classStudents.filter(
      (s) => (s.averageScore || 0) >= 60 && !s.keterangan?.toLowerCase().includes('remedial')
    ).length;
    const remedialCount = total - tuntasCount;
    const tuntasPercentage = Math.round((tuntasCount / total) * 100);
    const mumtazCount = classStudents.filter((s) => (s.averageScore || 0) >= 85).length;
    const sortedByScore = [...classStudents].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    const topStudent = sortedByScore[0] || null;

    return {
      total,
      avg,
      highest,
      lowest,
      tuntasCount,
      remedialCount,
      tuntasPercentage,
      mumtazCount,
      topStudent,
    };
  }, [classStudents]);

  // Hasil filter santri aktif
  const filteredStudents = useMemo(() => {
    const result = classStudents.filter((s) => {
      // 1. Pencarian teks
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNisn = s.nisn?.includes(q);
        const matchNis = s.nis?.includes(q);
        if (!matchName && !matchNisn && !matchNis) return false;
      }

      // 2. Filter Status Ketuntasan / Peringkat
      if (studentFilterStatus === 'tuntas') {
        const isRemedial = (s.averageScore || 0) < 60 || s.keterangan?.toLowerCase().includes('remedial');
        if (isRemedial) return false;
      } else if (studentFilterStatus === 'remedial') {
        const isRemedial = (s.averageScore || 0) < 60 || s.keterangan?.toLowerCase().includes('remedial');
        if (!isRemedial) return false;
      } else if (studentFilterStatus === 'top3') {
        if ((s.rank || 999) > 3) return false;
      } else if (studentFilterStatus === 'top10') {
        if ((s.rank || 999) > 10) return false;
      }

      // 3. Filter Kategori Nilai
      if (scoreCategoryFilter === 'mumtaz') {
        if ((s.averageScore || 0) < 85) return false;
      } else if (scoreCategoryFilter === 'jayyid_jiddan') {
        if ((s.averageScore || 0) < 75 || (s.averageScore || 0) >= 85) return false;
      } else if (scoreCategoryFilter === 'jayyid') {
        if ((s.averageScore || 0) < 65 || (s.averageScore || 0) >= 75) return false;
      } else if (scoreCategoryFilter === 'maqbul') {
        if ((s.averageScore || 0) < 60 || (s.averageScore || 0) >= 65) return false;
      } else if (scoreCategoryFilter === 'rasib') {
        if ((s.averageScore || 0) >= 60) return false;
      }

      return true;
    });

    // 4. Pengurutan
    if (sortBy === 'rank_asc') {
      result.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    } else if (sortBy === 'score_desc') {
      result.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    } else if (sortBy === 'score_asc') {
      result.sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [classStudents, searchTerm, studentFilterStatus, scoreCategoryFilter, sortBy]);

  const isAnySubFilterActive =
    searchTerm.trim() !== '' ||
    studentFilterStatus !== 'all' ||
    scoreCategoryFilter !== 'all' ||
    sortBy !== 'default';

  const handleResetSubFilters = () => {
    setSearchTerm('');
    setStudentFilterStatus('all');
    setScoreCategoryFilter('all');
    setSortBy('default');
  };

  const startEditing = (studentId: string, subjectId: string, currentVal: number) => {
    const student = students.find((s) => s.id === studentId);
    const studentClassId = student?.classId || selectedClassId || '1a';
    const sub = subjects.find((s) => s.id === subjectId);
    if (sub && !canUserEditSubject(currentUser, sub.nameId, studentClassId)) {
      alert(`Anda (${currentUser?.name || 'Pengguna'}) tidak berhak menginput atau mengubah nilai untuk mata pelajaran ${sub.nameId} di kelas ini.`);
      return;
    }
    setEditingCell({ studentId, subjectId });
    setTempValue(String(currentVal || ''));
  };

  const saveEditing = (studentId: string, subjectId: string) => {
    const num = Math.max(0, Math.min(100, parseInt(tempValue, 10) || 0));
    onUpdateScore(studentId, subjectId, num);
    setEditingCell(null);
  };

  const handleExportExcel = () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    exportRekapToExcel(filteredStudents, effectiveSubjects, config, currentClass);
  };

  const handleDownloadClassTemplate = () => {
    const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0] || {
      id: '1a',
      nameLatin: config.classLatin || 'Kelas 1A',
      nameAr: config.classAr || '',
      waliKelasName: config.waliKelasName || '',
    };
    downloadClassMultiSubjectTemplateExcel({
      students: filteredStudents,
      subjects: effectiveSubjects,
      currentClass,
      config,
    });
  };

  const handleTriggerClassUpload = () => {
    classFileInputRef.current?.click();
  };

  const handleClassFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingClass(true);
    try {
      const res = await parseClassMultiSubjectExcel(file, effectiveSubjects, filteredStudents);
      setClassImportResult(res);
      setIsClassImportModalOpen(true);

      if (res.success && res.updates.length > 0) {
        res.updates.forEach((u) => {
          Object.entries(u.scores).forEach(([subId, val]) => {
            if (canUserEditSubject(currentUser, subId, selectedClassId || '1a')) {
              onUpdateScore(u.studentId, subId, val);
            }
          });
        });
      }
    } catch (err: any) {
      alert(`Gagal mengimpor file Excel: ${err.message || String(err)}`);
    } finally {
      setIsImportingClass(false);
      if (classFileInputRef.current) {
        classFileInputRef.current.value = '';
      }
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama',
      'NISN',
      ...effectiveSubjects.map((s) => s.nameId),
      'Jumlah',
      'Rata-rata',
      'Ranking',
      'Keterangan',
    ];

    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${s.name}"`,
      `"${s.nisn}"`,
      ...effectiveSubjects.map((sub) => s.scores[sub.id] || 0),
      s.totalScore,
      s.averageScore,
      s.rank,
      `"${s.keterangan || 'Tuntas'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapitulasi_Nilai_${config.classLatin}_${config.academicYearLatin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRekap = () => {
    window.print();
  };

  const renderClassSelectOptions = () => (
    <>
      {currentUser?.role === 'admin' && (
        <option value="all">Semua Kelas ({availableClasses.length})</option>
      )}

      {binaanClasses.length > 0 && (
        <optgroup label="⭐ KELAS BINAAN SAYA">
          {binaanClasses.map((c) => (
            <option key={`opt-bin-${c.id}`} value={c.id}>
              ⭐ {c.nameLatin} ({c.nameAr}) - Kelas Binaan
            </option>
          ))}
        </optgroup>
      )}

      {assignedClasses.length > 0 && (
        <optgroup label="📖 KELAS PENUGASAN SAYA">
          {assignedClasses.map((c) => (
            <option key={`opt-asg-${c.id}`} value={c.id}>
              📖 {c.nameLatin} ({c.nameAr})
            </option>
          ))}
        </optgroup>
      )}

      {smpClasses.length > 0 && (
        <optgroup label="🏫 TINGKAT SMP">
          {smpClasses.map((c) => (
            <option key={`opt-smp-${c.id}`} value={c.id}>
              {c.nameLatin} ({c.nameAr})
            </option>
          ))}
        </optgroup>
      )}

      {smaClasses.length > 0 && (
        <optgroup label="🎓 TINGKAT SMA">
          {smaClasses.map((c) => (
            <option key={`opt-sma-${c.id}`} value={c.id}>
              {c.nameLatin} ({c.nameAr})
            </option>
          ))}
        </optgroup>
      )}

      {tmmiaClasses.length > 0 && (
        <optgroup label="📚 TINGKAT TMMIA / INTENSIF">
          {tmmiaClasses.map((c) => (
            <option key={`opt-tmmia-${c.id}`} value={c.id}>
              {c.nameLatin} ({c.nameAr})
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Visualisasi Data & Analisis Tren Akademik Santri Menggunakan Recharts */}
      <RekapitulasiAnalyticsChart
        allStudents={students}
        currentClassStudents={filteredStudents}
        classes={availableClasses}
        selectedClassId={selectedClassId}
        onSelectClassId={handleClassChange}
        subjects={effectiveSubjects}
        schoolType={schoolType}
      />

      <div className="w-full bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden flex flex-col">
      {/* Top Action Bar */}
      <div className="no-print p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Class Filter Dropdown in Toolbar */}
          {availableClasses.length > 0 && onSelectClassId && (
            <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-lg px-2.5 py-1">
              <Filter size={13} className="text-emerald-600" />
              <span className="text-[11px] text-stone-500 font-medium">Kelas:</span>
              <select
                id="rekap-toolbar-class-select"
                aria-label="Pilih Kelas dari Toolbar"
                value={selectedClassId || (availableClasses[0]?.id || 'all')}
                onChange={(e) => handleClassChange(e.target.value)}
                className="text-xs font-bold text-stone-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {renderClassSelectOptions()}
              </select>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Cari santri / NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
            />
          </div>
          <span className="text-xs text-stone-500">
            Tampil: <strong>{filteredStudents.length}</strong> santri
          </span>
        </div>


        <div className="flex items-center gap-2 flex-wrap">
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onAddStudent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
            >
              <Plus size={14} />
              Tambah Santri
            </button>
          )}

          {/* Hidden input for class excel upload */}
          <input
            type="file"
            ref={classFileInputRef}
            onChange={handleClassFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Tombol Unduh Template Kelas */}
          <button
            type="button"
            onClick={handleDownloadClassTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition active:scale-95"
            title="Unduh template Excel (.xlsx) seluruh mata pelajaran untuk kelas ini"
          >
            <Download size={13} />
            <span>Unduh Template Kelas</span>
          </button>

          {/* Tombol Upload Nilai Kelas */}
          <button
            type="button"
            onClick={handleTriggerClassUpload}
            disabled={isImportingClass}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Upload file Excel (.xlsx) untuk mengimpor seluruh nilai mata pelajaran kelas ini"
          >
            {isImportingClass ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Mengimpor...</span>
              </>
            ) : (
              <>
                <Upload size={13} />
                <span>Upload Nilai Kelas</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-sm transition"
            title="Download Rekap Nilai ke format Microsoft Excel (.xlsx) dengan Format & Border Modern"
          >
            <FileSpreadsheet size={14} />
            Export Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg transition"
            title="Download Rekap Nilai format CSV"
          >
            <Download size={13} />
            CSV
          </button>

          <button
            type="button"
            onClick={handlePrintRekap}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-sm transition"
          >
            <Printer size={14} />
            Cetak Rekap
          </button>


          {onOpenBatchPrint && (
            <button
              type="button"
              onClick={onOpenBatchPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg shadow-2xs transition"
              title="Cetak Masal Raport F4 untuk santri di kelas ini"
            >
              <Layers size={14} className="text-emerald-700" />
              Cetak Masal F4
            </button>
          )}

          {currentUser?.role === 'admin' && onOpenSyncModal && (
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition"
              title="Sinkronisasi Nilai dengan Google Sheets & Google Drive"
            >
              <Cloud size={14} className="text-emerald-600" />
              Google Sheets
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onResetData}
              title="Kembalikan data santri default"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-stone-200 transition"
            >
              <RotateCcw size={13} />
              Reset Data
            </button>
          )}
        </div>
      </div>

      {/* PANEL FILTER SISWA KHUSUS WALI KELAS & PENINJAUAN REKAPITULASI NILAI */}
      <div className="no-print bg-emerald-50/50 border-b border-emerald-200/80 p-3.5 flex flex-col gap-3">
        {/* Baris 1: Identitas & Pemilihan Cepat Kelas Binaan */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700 text-white text-xs font-black rounded-lg uppercase tracking-wider shadow-2xs">
              <GraduationCap size={15} />
              Tinjau Kelas Binaan
            </span>

            {/* Quick Switch to User's Own Homeroom Class if available */}
            {binaanClasses.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {binaanClasses.map((b) => (
                  <button
                    key={`binaan-btn-${b.id}`}
                    type="button"
                    onClick={() => handleClassChange(b.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                      b.id === selectedClassId
                        ? 'bg-amber-400 hover:bg-amber-500 text-stone-900 ring-2 ring-amber-500 font-extrabold'
                        : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                    }`}
                    title={`Pilih langsung kelas binaan Anda: ${b.nameLatin}`}
                  >
                    <Star size={13} className={b.id === selectedClassId ? 'fill-stone-900 text-stone-900' : 'text-amber-500'} />
                    <span>⭐ Binaan Saya ({b.nameLatin.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Dropdown Pemilihan Kelas Binaan Lengkap */}
            <div className="inline-flex items-center gap-1.5 bg-white border border-stone-300 rounded-lg px-2.5 py-1">
              <Users size={14} className="text-emerald-700" />
              <span className="text-[11px] font-semibold text-stone-600">Pilih Kelas:</span>
              <select
                id="rekap-select-kelas-binaan"
                aria-label="Pilih Kelas Binaan Tertentu"
                value={selectedClassId || ''}
                onChange={(e) => handleClassChange(e.target.value)}
                className="text-xs font-bold text-stone-900 bg-transparent focus:outline-none cursor-pointer max-w-[240px] truncate"
              >
                {renderClassSelectOptions()}
              </select>
            </div>
          </div>

          {/* Wali Kelas & Status Info */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1.5 bg-white border border-stone-200 px-2.5 py-1 rounded-lg text-stone-700 font-medium">
              Wali Kelas: <strong className="text-stone-900">{currentClassWali || '-'}</strong>
            </span>
            {isCurrentClassBinaan && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-extrabold">
                <Star size={12} className="fill-amber-600 text-amber-600" />
                Kelas Binaan Anda
              </span>
            )}
          </div>
        </div>

        {/* Baris 2: Mini Diagnostik Cepat Kelas Binaan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-white/95 p-2.5 rounded-xl border border-stone-200 text-xs shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Total Santri</span>
            <span className="text-sm font-black text-stone-800">{stats.total} Santri</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Rata-rata Kelas</span>
            <span className="text-sm font-black text-emerald-700">{stats.avg}</span>
          </div>
          <button
            type="button"
            onClick={() => setStudentFilterStatus(studentFilterStatus === 'tuntas' ? 'all' : 'tuntas')}
            className={`flex flex-col text-left p-1 rounded-md transition ${
              studentFilterStatus === 'tuntas' ? 'bg-emerald-100 ring-1 ring-emerald-400' : 'hover:bg-stone-50'
            }`}
            title="Klik untuk filter hanya santri tuntas"
          >
            <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center gap-1">
              <CheckCircle2 size={11} /> Tuntas
            </span>
            <span className="text-sm font-black text-emerald-800">
              {stats.tuntasCount} ({stats.tuntasPercentage}%)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStudentFilterStatus(studentFilterStatus === 'remedial' ? 'all' : 'remedial')}
            className={`flex flex-col text-left p-1 rounded-md transition ${
              studentFilterStatus === 'remedial' ? 'bg-red-100 ring-1 ring-red-400' : 'hover:bg-stone-50'
            }`}
            title="Klik untuk filter santri remedial"
          >
            <span className="text-[10px] text-red-700 font-bold uppercase flex items-center gap-1">
              <AlertCircle size={11} /> Perlu Remedial
            </span>
            <span className={`text-sm font-black ${stats.remedialCount > 0 ? 'text-red-700' : 'text-stone-700'}`}>
              {stats.remedialCount} Santri
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStudentFilterStatus(studentFilterStatus === 'top3' ? 'all' : 'top3')}
            className={`flex flex-col text-left p-1 rounded-md transition ${
              studentFilterStatus === 'top3' ? 'bg-amber-100 ring-1 ring-amber-400' : 'hover:bg-stone-50'
            }`}
            title="Klik untuk filter santri berprestasi 3 besar"
          >
            <span className="text-[10px] text-amber-700 font-bold uppercase flex items-center gap-1">
              <Trophy size={11} /> Terbaik #1
            </span>
            <span className="text-xs font-black text-stone-800 truncate" title={stats.topStudent?.name || '-'}>
              {stats.topStudent ? `${stats.topStudent.name.split(' ')[0]} (${stats.highest})` : '-'}
            </span>
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Nilai Terendah</span>
            <span className="text-sm font-black text-stone-700">{stats.lowest}</span>
          </div>
        </div>

        {/* Baris 3: Filter Kriteria Siswa, Pencarian, & Urutan */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1 mr-1">
              <SlidersHorizontal size={13} className="text-emerald-700" />
              Filter Siswa:
            </span>

            <button
              type="button"
              onClick={() => setStudentFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                studentFilterStatus === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300'
              }`}
            >
              Semua ({classStudents.length})
            </button>

            <button
              type="button"
              onClick={() => setStudentFilterStatus('tuntas')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                studentFilterStatus === 'tuntas'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
              }`}
            >
              <CheckCircle2 size={12} />
              Tuntas ({stats.tuntasCount})
            </button>

            <button
              type="button"
              onClick={() => setStudentFilterStatus('remedial')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                studentFilterStatus === 'remedial'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white hover:bg-red-50 text-red-700 border border-red-300'
              }`}
            >
              <AlertCircle size={12} />
              Remedial ({stats.remedialCount})
            </button>

            <button
              type="button"
              onClick={() => setStudentFilterStatus('top10')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                studentFilterStatus === 'top10'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
              }`}
            >
              <Award size={12} />
              10 Besar ({Math.min(10, classStudents.length)})
            </button>

            <button
              type="button"
              onClick={() => setStudentFilterStatus('top3')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                studentFilterStatus === 'top3'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300'
              }`}
            >
              <Trophy size={12} />
              3 Besar ({Math.min(3, classStudents.length)})
            </button>
          </div>

          {/* Secondary Controls: Search, Score category, Sort, & Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input with Clear Button */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input
                type="text"
                placeholder="Cari nama / NISN / NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-7 py-1 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Kategori Nilai */}
            <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2 py-1">
              <span className="text-[11px] text-stone-500 font-semibold">Predikat:</span>
              <select
                id="rekap-filter-predikat"
                aria-label="Filter Berdasarkan Predikat Nilai"
                value={scoreCategoryFilter}
                onChange={(e) => setScoreCategoryFilter(e.target.value as ScoreCategoryFilter)}
                className="text-xs font-bold text-stone-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Nilai</option>
                <option value="mumtaz">Mumtaz (≥ 85)</option>
                <option value="jayyid_jiddan">Jayyid Jiddan (75-84)</option>
                <option value="jayyid">Baik / Jayyid (65-74)</option>
                <option value="maqbul">Cukup / Maqbul (60-64)</option>
                <option value="rasib">Kurang / Rasib (&lt; 60)</option>
              </select>
            </div>

            {/* Urutkan Siswa (Sort) */}
            <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2 py-1">
              <ArrowUpDown size={13} className="text-stone-500" />
              <span className="text-[11px] text-stone-500 font-semibold">Urutkan:</span>
              <select
                id="rekap-sort-siswa"
                aria-label="Urutkan Siswa"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as StudentSortBy)}
                className="text-xs font-bold text-stone-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="default">No Absen</option>
                <option value="rank_asc">Peringkat (1 s/d Terakhir)</option>
                <option value="score_desc">Nilai Rata-rata Tertinggi</option>
                <option value="score_asc">Nilai Rata-rata Terendah</option>
                <option value="name_asc">Nama Santri (A - Z)</option>
              </select>
            </div>

            {/* Reset Sub-filters Button */}
            {isAnySubFilterActive && (
              <button
                type="button"
                onClick={handleResetSubFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition shadow-2xs"
                title="Kembalikan filter siswa ke kondisi awal"
              >
                <RotateCcw size={12} />
                <span>Reset Filter</span>
              </button>
            )}

            <span className="text-xs text-stone-600 font-medium ml-1">
              Menampilkan <strong>{filteredStudents.length}</strong> dari {classStudents.length} santri
            </span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Header (Image 1 style for Full Day vs Mukim) */}
      <div className="text-center py-5 px-4 border-b border-stone-300 bg-stone-50/50">
        {isFullDay ? (
          <>
            <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-wide text-stone-900">
              REKAPITULASI NILAI PESERTA DIDIK
            </h2>
            <h3 className="text-base md:text-lg font-bold text-stone-800 mt-0.5">
              ASESMEN TENGAH SEMESTER GANJIL
            </h3>
            <h4 className="text-base font-bold text-stone-800 mt-0.5">
              {(currentClass?.nameLatin || '').toLowerCase().includes('vii') ||
              (currentClass?.nameLatin || '').toLowerCase().includes('viii') ||
              (currentClass?.nameLatin || '').toLowerCase().includes('ix') ||
              (currentClass?.nameLatin || '').toLowerCase().includes('smp')
                ? 'SMP ISLAM AL-GHOZALI'
                : 'SMA ISLAM AL-GHOZALI'}
            </h4>
            <p className="text-sm font-semibold text-stone-600 mt-1">
              TAHUN PELAJARAN {config.academicYearLatin || '2026/2027'}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-wide text-stone-900">
              {config.subTitleId}
            </h2>
            <h3 className="text-base md:text-lg font-bold text-stone-800 mt-0.5">
              {config.schoolName}
            </h3>
            <p className="text-sm font-semibold text-stone-600">
              TAHUN PELAJARAN {config.academicYearLatin}
            </p>
          </>
        )}

        {/* Print-only Static Class Banner */}
        <div className="hidden print:inline-block mt-2 px-3 py-0.5 bg-stone-200/80 rounded font-bold text-xs uppercase tracking-wider text-stone-800">
          KELAS : {currentClass?.nameLatin || config.classLatin}
        </div>

        {/* Screen-only: Prominent Class Filter Dropdown in Header */}
        <div className="no-print mt-3 flex flex-col items-center justify-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl">
            {/* Header Dropdown Filter Kelas */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-emerald-600 rounded-xl shadow-xs hover:border-emerald-700 transition">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 shrink-0">
                <GraduationCap size={16} className="text-emerald-700" />
                FILTER KELAS:
              </span>
              <select
                id="rekap-header-filter-kelas"
                aria-label="Pilih Kelas Binaan di Header Rekapitulasi"
                value={selectedClassId || ''}
                onChange={(e) => handleClassChange(e.target.value)}
                className="text-xs sm:text-sm font-extrabold text-stone-900 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                {renderClassSelectOptions()}
              </select>
            </div>

            {/* Wali Kelas & Student Count Badges */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {isCurrentClassBinaan ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shadow-2xs">
                  ⭐ Kelas Binaan Anda
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 font-medium text-xs">
                  Wali Kelas: <strong className="text-stone-900">{currentClass?.waliKelasName || config.waliKelasName}</strong>
                </span>
              )}

              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                {filteredStudents.length} Santri
              </span>
            </div>
          </div>

          {/* Quick Switch Buttons for Wali Kelas / Homeroom Classes */}
          {binaanClasses.length > 0 && (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap justify-center">
              <span className="text-[11px] font-bold text-stone-500">Pilih Cepat Binaan:</span>
              {binaanClasses.map((b) => (
                <button
                  key={`pill-binaan-${b.id}`}
                  type="button"
                  id={`btn-quick-class-${b.id}`}
                  onClick={() => handleClassChange(b.id)}
                  title={`Beralih langsung ke ${b.nameLatin}`}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition shadow-2xs ${
                    b.id === selectedClassId
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-500'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  ⭐ {b.nameLatin}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive Scrolling Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse border border-black text-[10.5px] text-center select-none whitespace-nowrap">
          {/* Header Rows */}
          <thead>
            {isFullDay ? (
              <>
                {/* Top Category Header Row (Full Day Image 1) */}
                <tr className="bg-stone-200 font-bold border-b border-black">
                  <th rowSpan={3} className="border border-black px-2 py-2 w-8 bg-stone-300">
                    No
                  </th>
                  <th rowSpan={3} className="border border-black px-3 py-2 text-center min-w-[170px] bg-stone-300">
                    Nama Siswa
                  </th>
                  <th rowSpan={3} className="border border-black px-2 py-2 min-w-[80px] bg-stone-300">
                    NIS
                  </th>

                  {/* MATA PELAJARAN (Group Header) */}
                  <th
                    colSpan={effectiveSubjects.length}
                    className="border border-black py-1.5 bg-[#e2e8f0] text-stone-900 font-extrabold"
                  >
                    MATA PELAJARAN
                  </th>

                  {/* Calculated Outputs (Yellow / Gold) */}
                  <th rowSpan={3} className="border border-black px-1.5 py-2 bg-[#fef08a] font-black text-[10px] w-12" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    Jumlah Nilai Total
                  </th>
                  <th rowSpan={3} className="border border-black px-1.5 py-2 bg-[#fef08a] font-black text-[10px] w-12" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    Rata-Rata
                  </th>
                  <th rowSpan={3} className="border border-black px-1.5 py-2 bg-[#fde047] font-black text-[10px] w-12" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    Ranking
                  </th>

                  {/* KEPRIBADIAN (3 Columns) */}
                  <th colSpan={3} className="border border-black py-1.5 bg-[#e0f2fe] text-stone-900 font-extrabold">
                    KEPRIBADIAN
                  </th>

                  {/* ABSENSI (3 Columns) */}
                  <th colSpan={3} className="border border-black py-1.5 bg-[#fce7f3] text-stone-900 font-extrabold">
                    ABSENSI
                  </th>

                  <th rowSpan={3} className="no-print border border-black px-2 py-2 bg-stone-200 font-bold w-16">
                    AKSI
                  </th>
                </tr>

                {/* Row 2: Subject Names and Sub-categories */}
                <tr className="bg-stone-50 font-bold border-b border-black text-[9.5px]">
                  {effectiveSubjects.map((sub) => (
                    <th
                      key={sub.id}
                      title={sub.nameId}
                      className="border border-black px-1.5 py-2 font-bold bg-white text-stone-900 text-center uppercase"
                    >
                      {getSubjectAbbreviation(sub.nameId)}
                    </th>
                  ))}
                  <th className="border border-black px-1 py-1 font-bold bg-[#f0f9ff] text-[9px]">Kerapihan</th>
                  <th className="border border-black px-1 py-1 font-bold bg-[#f0f9ff] text-[9px]">Kedisiplinan</th>
                  <th className="border border-black px-1 py-1 font-bold bg-[#f0f9ff] text-[9px]">Kejujuran</th>
                  <th className="border border-black px-1 py-1 font-bold bg-[#fdf2f8] text-[9px]">SAKIT</th>
                  <th className="border border-black px-1 py-1 font-bold bg-[#fdf2f8] text-[9px]">IZIN</th>
                  <th className="border border-black px-1 py-1 font-bold bg-[#fdf2f8] text-[9px]">ALPA</th>
                </tr>

                {/* Row 3: Column Numbers */}
                <tr className="bg-stone-100 font-bold border-b-2 border-black text-[9px] text-stone-600">
                  {effectiveSubjects.map((_, i) => (
                    <th key={`num-sub-${i}`} className="border border-black py-0.5">
                      {i + 3}
                    </th>
                  ))}
                  <th className="border border-black py-0.5 bg-[#f0f9ff]">A</th>
                  <th className="border border-black py-0.5 bg-[#f0f9ff]">B</th>
                  <th className="border border-black py-0.5 bg-[#f0f9ff]">C</th>
                  <th className="border border-black py-0.5 bg-[#fdf2f8]">1</th>
                  <th className="border border-black py-0.5 bg-[#fdf2f8]">2</th>
                  <th className="border border-black py-0.5 bg-[#fdf2f8]">3</th>
                </tr>
              </>
            ) : (
              <>
                {/* Top Category Header Row (Mukim) */}
                <tr className="bg-stone-200 font-bold border-b border-black">
                  <th rowSpan={3} className="border border-black px-2 py-2 w-8 bg-stone-300">
                    NO
                  </th>
                  <th rowSpan={3} className="border border-black px-3 py-2 text-left min-w-[170px] bg-stone-300">
                    NAMA
                  </th>
                  <th rowSpan={3} className="border border-black px-2 py-2 min-w-[90px] bg-stone-300">
                    NISN
                  </th>

                  {/* Pondok Subjects Group (Light Blue / Gray) */}
                  {pondokSubjects.length > 0 && (
                    <th
                      colSpan={pondokSubjects.length}
                      className="border border-black py-1.5 bg-[#cbd5e1] text-stone-900 font-extrabold"
                    >
                      MATA PELAJARAN PONDOK
                    </th>
                  )}

                  {/* Umum Subjects Group (Light Green) */}
                  {umumSubjects.length > 0 && (
                    <th
                      colSpan={umumSubjects.length}
                      className="border border-black py-1.5 bg-[#bbf7d0] text-stone-900 font-extrabold"
                    >
                      MATA PELAJARAN UMUM
                    </th>
                  )}

                  {/* Lisan Subjects Group (Peach / Orange) */}
                  {lisanSubjects.length > 0 && (
                    <th
                      colSpan={lisanSubjects.length}
                      className="border border-black py-1.5 bg-[#fed7aa] text-stone-900 font-extrabold"
                    >
                      MATERI LISAN
                    </th>
                  )}

                  {/* Calculated Outputs (Yellow / Gold) */}
                  <th rowSpan={3} className="border border-black px-2 py-2 bg-[#fef08a] font-black text-[11px] w-14">
                    JUMLAH
                  </th>
                  <th rowSpan={3} className="border border-black px-2 py-2 bg-[#fef08a] font-black text-[11px] w-14">
                    RATA-RATA
                  </th>
                  <th rowSpan={3} className="border border-black px-2 py-2 bg-[#fde047] font-black text-[11px] w-14">
                    RANGKING
                  </th>
                  <th rowSpan={3} className="border border-black px-2 py-2 bg-stone-300 font-bold w-20">
                    KETERANGAN
                  </th>
                  <th rowSpan={3} className="no-print border border-black px-2 py-2 bg-stone-200 font-bold w-16">
                    AKSI
                  </th>
                </tr>

                {/* Subject Sequential Numbers (1-10, 1-15, 1-3) */}
                <tr className="bg-stone-100 font-bold border-b border-black text-[10px]">
                  {pondokSubjects.map((_, i) => (
                    <th key={`num-p-${i}`} className="border border-black py-0.5 bg-[#e2e8f0]">
                      {i + 1}
                    </th>
                  ))}
                  {umumSubjects.map((_, i) => (
                    <th key={`num-u-${i}`} className="border border-black py-0.5 bg-[#dcfce7]">
                      {i + 1}
                    </th>
                  ))}
                  {lisanSubjects.map((_, i) => (
                    <th key={`num-l-${i}`} className="border border-black py-0.5 bg-[#ffedd5]">
                      {i + 1}
                    </th>
                  ))}
                </tr>

                {/* Subject Names (Vertical-like / compact header) */}
                <tr className="bg-stone-50 font-bold border-b-2 border-black text-[9.5px]">
                  {effectiveSubjects.map((sub) => (
                    <th
                      key={sub.id}
                      title={sub.nameId}
                      className="border border-black px-1 py-3 max-w-[42px] overflow-hidden text-ellipsis"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {sub.nameId}
                    </th>
                  ))}
                </tr>
              </>
            )}
          </thead>

          {/* Student Data Rows */}
          <tbody>
            {filteredStudents.map((student, idx) => {
              const originalIndex = students.findIndex((s) => s.id === student.id);
              return (
                <tr
                  key={student.id}
                  className="hover:bg-amber-50/60 transition-colors border-b border-black text-stone-900"
                >
                  {/* NO */}
                  <td className="border border-black py-1 px-1 font-bold">
                    {idx + 1}
                  </td>

                  {/* NAMA SISWA */}
                  <td className="border border-black py-1 px-3 text-left font-semibold text-[11px]">
                    <div className="flex items-center justify-between group">
                      <span>{student.name}</span>
                      <button
                        type="button"
                        onClick={() => onSelectStudentForRaport(originalIndex)}
                        title={isFullDay ? 'Buka Raport Siswa Ini' : 'Buka Raport Santri Ini'}
                        className="no-print opacity-0 group-hover:opacity-100 text-emerald-700 hover:text-emerald-900 transition ml-2"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </td>

                  {/* NIS / NISN */}
                  <td className="border border-black py-1 px-2 font-mono text-[10px]">
                    {isFullDay ? (student.nis || student.nisn || '-') : (student.nisn || '-')}
                  </td>

                  {/* Subject Scores (Click to edit inline!) */}
                  {effectiveSubjects.map((sub) => {
                    const score = student.scores[sub.id] || 0;
                    const isEditing =
                      editingCell?.studentId === student.id && editingCell?.subjectId === sub.id;
                    const isUnderKkm = isFullDay ? score < (sub.kkm || 70) : score < 60;

                    return (
                      <td
                        key={sub.id}
                        onClick={() => startEditing(student.id, sub.id, score)}
                        className={`border border-black py-1 px-1 cursor-pointer font-mono text-[10.5px] ${
                          isUnderKkm ? 'text-red-600 font-bold bg-red-50/40' : ''
                        } hover:bg-emerald-100/50 transition-colors`}
                        title="Klik untuk ubah nilai"
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            autoFocus
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() => saveEditing(student.id, sub.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(student.id, sub.id);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-10 text-center font-bold text-xs bg-white border border-emerald-500 rounded p-0 outline-none"
                          />
                        ) : (
                          score
                        )}
                      </td>
                    );
                  })}

                  {/* JUMLAH */}
                  <td className="border border-black py-1 px-1 font-bold font-mono bg-[#fef9c3] text-[11px]">
                    {student.totalScore}
                  </td>

                  {/* RATA-RATA */}
                  <td className="border border-black py-1 px-1 font-bold font-mono bg-[#fef9c3] text-[11px]">
                    {student.averageScore}
                  </td>

                  {/* RANKING */}
                  <td className="border border-black py-1 px-1 font-extrabold font-mono bg-[#fde047] text-[11px]">
                    {student.rank === 1 ? '🥇 1' : student.rank === 2 ? '🥈 2' : student.rank === 3 ? '🥉 3' : student.rank}
                  </td>

                  {isFullDay ? (
                    <>
                      {/* KEPRIBADIAN: Kerapihan, Kedisiplinan, Kejujuran */}
                      <td className="border border-black py-1 px-1 font-bold text-[10px] text-center bg-[#f0f9ff]">
                        {student.kepribadian?.kerapihan || 'A'}
                      </td>
                      <td className="border border-black py-1 px-1 font-bold text-[10px] text-center bg-[#f0f9ff]">
                        {student.kepribadian?.kedisiplinan || 'B'}
                      </td>
                      <td className="border border-black py-1 px-1 font-bold text-[10px] text-center bg-[#f0f9ff]">
                        {student.kepribadian?.kejujuran || 'A'}
                      </td>

                      {/* ABSENSI: Sakit, Izin, Alpa */}
                      <td className="border border-black py-1 px-1 font-mono text-[10px] text-center bg-[#fdf2f8]">
                        {student.absensi?.sakit ?? 0}
                      </td>
                      <td className="border border-black py-1 px-1 font-mono text-[10px] text-center bg-[#fdf2f8]">
                        {student.absensi?.izin ?? 0}
                      </td>
                      <td className="border border-black py-1 px-1 font-mono text-[10px] text-center bg-[#fdf2f8]">
                        {student.absensi?.alpa ?? 0}
                      </td>
                    </>
                  ) : (
                    /* KETERANGAN (Mukim) */
                    <td className="border border-black py-1 px-2 font-medium text-[10px]">
                      {student.keterangan ? (
                        student.keterangan.toLowerCase().includes('remedial') ||
                        student.keterangan.toLowerCase().includes('bimbingan') ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-red-700 bg-red-50 border border-red-200 font-bold">
                            ⚠️ {student.keterangan}
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold">
                            ✓ {student.keterangan}
                          </span>
                        )
                      ) : student.averageScore >= 60 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold">
                          ✓ Tuntas
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-red-700 bg-red-50 border border-red-200 font-bold">
                          ⚠️ Perlu Bimbingan
                        </span>
                      )}
                    </td>
                  )}

                  {/* AKSI */}
                  <td className="no-print border border-black py-1 px-1">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectStudentForRaport(originalIndex)}
                        title={isFullDay ? 'Cetak Raport Siswa' : 'Cetak Raport Santri'}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Printer size={13} />
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(student.id)}
                          title={isFullDay ? 'Hapus Siswa' : 'Hapus Santri'}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Tampilan Kosong Ketika Santri Hasil Filter = 0 */}
            {filteredStudents.length === 0 && (
              <tr>
                <td
                  colSpan={isFullDay ? effectiveSubjects.length + 10 : effectiveSubjects.length + 8}
                  className="py-12 text-center text-stone-500 bg-stone-50/70"
                >
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                    <AlertCircle size={32} className="text-amber-500" />
                    <p className="font-bold text-stone-800 text-sm">
                      Tidak ada santri yang sesuai kriteria filter
                    </p>
                    <p className="text-xs text-stone-500">
                      Silakan sesuaikan kata kunci pencarian, filter status kelulusan, atau klik tombol di bawah untuk menampilkan seluruh santri kelas ini.
                    </p>
                    {isAnySubFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetSubFilters}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <RotateCcw size={13} />
                        <span>Reset Semua Filter Santri</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Empty filler rows up to 10 if needed for table appearance (hanya jika ada santri yang tampil) */}
            {filteredStudents.length > 0 && filteredStudents.length < 10 &&
              Array.from({ length: 10 - filteredStudents.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-black text-stone-400 bg-stone-50/20">
                  <td className="border border-black py-1 text-xs">{filteredStudents.length + i + 1}</td>
                  <td className="border border-black py-1 px-3 text-left"></td>
                  <td className="border border-black py-1"></td>
                  {effectiveSubjects.map((sub) => (
                    <td key={`empty-sub-${sub.id}-${i}`} className="border border-black py-1"></td>
                  ))}
                  <td className="border border-black py-1 bg-stone-100/50">0</td>
                  <td className="border border-black py-1 bg-stone-100/50">0</td>
                  <td className="border border-black py-1 bg-stone-100/50">-</td>
                  {isFullDay ? (
                    <>
                      <td className="border border-black py-1 bg-stone-100/50">-</td>
                      <td className="border border-black py-1 bg-stone-100/50">-</td>
                      <td className="border border-black py-1 bg-stone-100/50">-</td>
                      <td className="border border-black py-1 bg-stone-100/50">0</td>
                      <td className="border border-black py-1 bg-stone-100/50">0</td>
                      <td className="border border-black py-1 bg-stone-100/50">0</td>
                    </>
                  ) : (
                    <td className="border border-black py-1"></td>
                  )}
                  <td className="no-print border border-black py-1"></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Footer Instructions */}
      <div className="no-print p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-between">
        <p className="flex items-center gap-1">
          <Edit3 size={13} />
          <span>Tips: Klik pada angka nilai untuk mengedit nilai santri secara langsung.</span>
        </p>
        <p>Semua perubahan langsung memperbarui peringkat & rata-rata secara otomatis.</p>
      </div>

      {/* Modal Hasil Import Nilai Kelas */}
      {isClassImportModalOpen && classImportResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`p-4 text-white flex items-center justify-between ${classImportResult.success ? 'bg-emerald-700' : 'bg-amber-600'}`}>
              <div className="flex items-center gap-2.5">
                {classImportResult.success ? (
                  <CheckCircle2 size={22} className="text-emerald-200" />
                ) : (
                  <AlertCircle size={22} className="text-amber-200" />
                )}
                <div>
                  <h3 className="font-extrabold text-sm">
                    {classImportResult.success ? 'Import Nilai Kelas Berhasil' : 'Hasil Import Nilai Kelas'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Rekapitulasi Multi-Mata Pelajaran
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClassImportModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                classImportResult.success
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <FileCheck size={24} className={classImportResult.success ? 'text-emerald-600' : 'text-amber-600'} />
                <div>
                  <p className="font-bold text-sm">
                    {classImportResult.updates.length} Santri Berhasil Diperbarui
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {classImportResult.detectedSubjects.length} mata pelajaran terdeteksi dan diproses dari file Excel.
                  </p>
                </div>
              </div>

              {/* Detected Subjects */}
              {classImportResult.detectedSubjects.length > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                  <span className="text-[11px] font-bold text-stone-700 block mb-1.5">
                    Mata Pelajaran yang Diperbarui:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {classImportResult.detectedSubjects.map((sub) => (
                      <span
                        key={sub.id}
                        className="bg-white border border-stone-300 text-stone-800 text-[10px] font-semibold px-2 py-0.5 rounded"
                      >
                        {sub.nameId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings / Errors */}
              {(classImportResult.unmatched.length > 0 || classImportResult.errors.length > 0) && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-[11px]">
                  <span className="font-bold text-stone-700 block">Catatan & Peringatan:</span>
                  {classImportResult.unmatched.map((msg, i) => (
                    <p key={`unmatched-${i}`} className="text-amber-700">• {msg}</p>
                  ))}
                  {classImportResult.errors.map((msg, i) => (
                    <p key={`err-${i}`} className="text-red-700">• {msg}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsClassImportModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

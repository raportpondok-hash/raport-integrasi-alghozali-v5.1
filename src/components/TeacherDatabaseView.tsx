import React, { useState, useMemo } from 'react';
import {
  TEACHER_SUBJECTS_ENTRIES,
  getTeacherProfiles,
  getAllUniqueClasses,
  getSubjectTeachersForClass,
  normalizeClassToIds,
  MASTER_TEACHING_SCHEDULE,
  TeacherSubjectEntry,
  TeacherProfile,
} from '../data/teacherSubjectsDatabase';
import {
  DAFTAR_WALI_KELAS,
  WaliKelasEntry,
} from '../data/waliKelasDatabase';
import {
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Building,
  ArrowRight,
  Layers,
  Award,
  Calendar,
  Grid,
  List,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Clock,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';

interface TeacherDatabaseViewProps {
  onNavigateToGrading?: (classId: string, subjectName?: string) => void;
}

export const TeacherDatabaseView: React.FC<TeacherDatabaseViewProps> = ({
  onNavigateToGrading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'subjects' | 'teachers' | 'byClass' | 'waliKelas' | 'schedule'>('subjects');
  const [selectedUnit, setSelectedUnit] = useState<'ALL' | 'SMA' | 'SMP' | 'TMMIA'>('ALL');
  const [selectedWaliUnit, setSelectedWaliUnit] = useState<'ALL' | 'SMP' | 'SMA' | 'INTENSIF' | 'FULL DAY'>('ALL');
  const [selectedWaliGender, setSelectedWaliGender] = useState<'ALL' | 'Putri' | 'Putra' | 'Campuran'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<TeacherProfile | null>(null);
  const [selectedWaliModal, setSelectedWaliModal] = useState<WaliKelasEntry | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('table');
  const [selectedClassForMatrix, setSelectedClassForMatrix] = useState<string>('1 Intensif');

  // Schedule (1.119 Data) States
  const [scheduleUnitFilter, setScheduleUnitFilter] = useState<'ALL' | 'SMA' | 'SMP' | 'TMMIA'>('ALL');
  const [scheduleClassFilter, setScheduleClassFilter] = useState<string>('ALL');
  const [scheduleTeacherFilter, setScheduleTeacherFilter] = useState<string>('ALL');
  const [scheduleCurrentPage, setScheduleCurrentPage] = useState<number>(1);
  const [scheduleItemsPerPage, setScheduleItemsPerPage] = useState<number>(50);

  const teacherProfiles = useMemo(() => getTeacherProfiles(), []);
  const allClasses = useMemo(() => getAllUniqueClasses(), []);

  // Unique classes and teachers from MASTER_TEACHING_SCHEDULE
  const scheduleUniqueClasses = useMemo(() => {
    return Array.from(new Set(MASTER_TEACHING_SCHEDULE.map((r) => r.className))).sort();
  }, []);

  const scheduleUniqueTeachers = useMemo(() => {
    return Array.from(new Set(MASTER_TEACHING_SCHEDULE.map((r) => r.teacherName))).sort();
  }, []);

  const totalScheduleHours = useMemo(() => {
    return MASTER_TEACHING_SCHEDULE.reduce((acc, r) => acc + (r.hours || 0), 0);
  }, []);

  const filteredSchedule = useMemo(() => {
    return MASTER_TEACHING_SCHEDULE.filter((rec) => {
      // Unit filter
      if (scheduleUnitFilter !== 'ALL' && rec.unit !== scheduleUnitFilter) {
        return false;
      }
      // Class filter
      if (scheduleClassFilter !== 'ALL' && rec.className !== scheduleClassFilter) {
        return false;
      }
      // Teacher filter
      if (scheduleTeacherFilter !== 'ALL' && rec.teacherName !== scheduleTeacherFilter) {
        return false;
      }
      // Search query
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchNo = rec.no.toString().includes(q);
        const matchClass = rec.className.toLowerCase().includes(q);
        const matchSub = rec.subjectName.toLowerCase().includes(q);
        const matchTeacher = rec.teacherName.toLowerCase().includes(q);
        const matchUnit = rec.unit.toLowerCase().includes(q);
        return matchNo || matchClass || matchSub || matchTeacher || matchUnit;
      }
      return true;
    });
  }, [scheduleUnitFilter, scheduleClassFilter, scheduleTeacherFilter, searchTerm]);

  const filteredScheduleHours = useMemo(() => {
    return filteredSchedule.reduce((acc, r) => acc + (r.hours || 0), 0);
  }, [filteredSchedule]);

  const scheduleTotalPages = useMemo(() => {
    if (scheduleItemsPerPage === -1) return 1;
    return Math.max(1, Math.ceil(filteredSchedule.length / scheduleItemsPerPage));
  }, [filteredSchedule.length, scheduleItemsPerPage]);

  const paginatedSchedule = useMemo(() => {
    if (scheduleItemsPerPage === -1) return filteredSchedule;
    const startIndex = (scheduleCurrentPage - 1) * scheduleItemsPerPage;
    return filteredSchedule.slice(startIndex, startIndex + scheduleItemsPerPage);
  }, [filteredSchedule, scheduleCurrentPage, scheduleItemsPerPage]);

  // Stats calculation
  const totalEntries = TEACHER_SUBJECTS_ENTRIES.length;
  const totalTeachers = teacherProfiles.length;
  const smaCount = TEACHER_SUBJECTS_ENTRIES.filter((e) => e.unit === 'SMA').length;
  const smpCount = TEACHER_SUBJECTS_ENTRIES.filter((e) => e.unit === 'SMP').length;
  const tmmiaCount = TEACHER_SUBJECTS_ENTRIES.filter((e) => e.unit === 'TMMIA').length;

  // Filtered entries for Mapel Tab
  const filteredEntries = useMemo(() => {
    return TEACHER_SUBJECTS_ENTRIES.filter((entry) => {
      // Unit filter
      if (selectedUnit !== 'ALL' && entry.unit !== selectedUnit) {
        return false;
      }
      // Class filter
      if (
        selectedClassFilter !== 'ALL' &&
        !entry.daftarKelas.some((c) => c.toLowerCase() === selectedClassFilter.toLowerCase())
      ) {
        return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchCode = entry.kode.toLowerCase().includes(q);
        const matchName = entry.namaMapel.toLowerCase().includes(q);
        const matchTeacher = entry.guruPengampu.some((g) => g.toLowerCase().includes(q));
        const matchClass = entry.daftarKelas.some((c) => c.toLowerCase().includes(q));
        return matchCode || matchName || matchTeacher || matchClass;
      }
      return true;
    });
  }, [selectedUnit, selectedClassFilter, searchTerm]);

  // Filtered teachers for Teachers Tab
  const filteredTeachers = useMemo(() => {
    return teacherProfiles.filter((teacher) => {
      // Unit filter
      if (selectedUnit !== 'ALL' && !teacher.units.includes(selectedUnit as any)) {
        return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchName = teacher.name.toLowerCase().includes(q);
        const matchSub = teacher.subjects.some((s) =>
          s.namaMapel.toLowerCase().includes(q) || s.kode.toLowerCase().includes(q)
        );
        const matchClass = teacher.classesTaught.some((c) => c.toLowerCase().includes(q));
        return matchName || matchSub || matchClass;
      }
      return true;
    });
  }, [teacherProfiles, selectedUnit, searchTerm]);

  // Filtered mapel and exact teachers per selected class for By-Class Tab
  const subjectsForSelectedClass = useMemo(() => {
    return getSubjectTeachersForClass(selectedClassForMatrix);
  }, [selectedClassForMatrix]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered Wali Kelas
  const filteredWaliKelas = useMemo(() => {
    return DAFTAR_WALI_KELAS.filter((item) => {
      // Unit filter
      if (selectedWaliUnit !== 'ALL' && item.unit !== selectedWaliUnit) {
        return false;
      }
      // Gender filter
      if (selectedWaliGender !== 'ALL' && item.gender !== selectedWaliGender) {
        return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchClass = item.className.toLowerCase().includes(q);
        const matchName = item.waliName.toLowerCase().includes(q);
        const matchLevel = item.levelLabel?.toLowerCase().includes(q) || false;
        return matchClass || matchName || matchLevel;
      }
      return true;
    });
  }, [selectedWaliUnit, selectedWaliGender, searchTerm]);

  // Wali Kelas statistics
  const totalWali = DAFTAR_WALI_KELAS.length;
  const waliSmpCount = DAFTAR_WALI_KELAS.filter((w) => w.unit === 'SMP').length;
  const waliSmaCount = DAFTAR_WALI_KELAS.filter((w) => w.unit === 'SMA').length;
  const waliIntCount = DAFTAR_WALI_KELAS.filter((w) => w.unit === 'INTENSIF').length;
  const waliFdCount = DAFTAR_WALI_KELAS.filter((w) => w.unit === 'FULL DAY').length;

  // Export CSV
  const handleExportCSV = () => {
    if (activeSubTab === 'schedule') {
      const headers = ['No', 'Kelas', 'Mata Pelajaran', 'Unit', 'Guru Pengampu', 'Jam Pelajaran (JP)'];
      const rows = filteredSchedule.map((r) => [
        r.no,
        `"${r.className}"`,
        `"${r.subjectName}"`,
        `"${r.unit}"`,
        `"${r.teacherName}"`,
        r.hours,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Rincian_Mata_Pelajaran_Per_Kelas_1119_AlGhozali.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (activeSubTab === 'waliKelas') {
      const headers = ['No', 'Nama Rombel / Kelas', 'Nama Wali Kelas & Gelar', 'Unit', 'Kategori Santri', 'Jenjang'];
      const rows = filteredWaliKelas.map((w) => [
        w.no,
        `"${w.className}"`,
        `"${w.waliName}"`,
        `"${w.unit}"`,
        `"${w.gender}"`,
        `"${w.levelLabel || ''}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Daftar_Wali_Kelas_AlGhozali_${selectedWaliUnit}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = ['Kode', 'Nama Mata Pelajaran', 'Unit', 'Guru Pengampu', 'Daftar Kelas'];
    const rows = filteredEntries.map((e) => [
      `"${e.kode}"`,
      `"${e.namaMapel}"`,
      `"${e.unit}"`,
      `"${e.guruPengampu.join('; ')}"`,
      `"${e.daftarKelas.join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Database_Guru_Mata_Pelajaran_AlGhozali_${selectedUnit}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper unit badge color
  const getUnitBadge = (unit: 'SMA' | 'SMP' | 'TMMIA') => {
    switch (unit) {
      case 'SMA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SMP':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'TMMIA':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================
          HERO & HEADER BANNER
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                <GraduationCap size={13} />
                Pondok Modern Al-Ghozali
              </span>
              <span>•</span>
              <span className="text-stone-500">Tahun Ajaran 2024/2025</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
              Database Guru Mata Pelajaran
            </h1>
            <p className="text-sm text-stone-600 mt-1 max-w-3xl">
              Direktori resmi penugasan guru pengampu mata pelajaran untuk seluruh unit pendidikan (SMA, SMP, dan TMMIA Kuliyyatul Mu'allimin Al-Islamiyyah).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl shadow-2xs transition"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition"
            >
              <Printer size={14} />
              <span>Cetak SK Guru</span>
            </button>
          </div>
        </div>

        {/* Quick Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-stone-200/80">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Total Mapel Terdaftar</span>
              <BookOpen size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">{totalEntries}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">SMA: {smaCount} | SMP: {smpCount} | TMMIA: {tmmiaCount}</div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Asatidz / Guru Pengampu</span>
              <Users size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">{totalTeachers}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">Dewan Guru & Pengasuh</div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Total Rombongan Belajar</span>
              <Building size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">{allClasses.length}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">Kelas Mukim & Non-Mukim</div>
          </div>

          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200/70">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-bold">Jadwal Resmi Mengajar</span>
              <Calendar size={16} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-950">1.119 Data</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">{totalScheduleHours} Total Jam Pelajaran (JP)</div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-medium">Unit Pendidikan</span>
              <Layers size={16} className="text-purple-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">3 Unit</div>
            <div className="text-[11px] text-stone-500 mt-0.5">SMA • SMP • TMMIA Pondok</div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SUB-NAVIGATION TABS & SEARCH / FILTER CONTROLS
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'schedule'
                  ? 'bg-indigo-700 text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar size={14} className={activeSubTab === 'schedule' ? 'text-white' : 'text-indigo-600'} />
              <span>Rincian Jadwal (1.119 Data)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('subjects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'subjects'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen size={14} className={activeSubTab === 'subjects' ? 'text-emerald-600' : ''} />
              <span>Mata Pelajaran ({filteredEntries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('teachers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'teachers'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users size={14} className={activeSubTab === 'teachers' ? 'text-blue-600' : ''} />
              <span>Direktori Asatidz ({filteredTeachers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('byClass')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'byClass'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Building size={14} className={activeSubTab === 'byClass' ? 'text-amber-600' : ''} />
              <span>Distribusi Rombel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('waliKelas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'waliKelas'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck size={14} className={activeSubTab === 'waliKelas' ? 'text-emerald-600' : ''} />
              <span>Daftar Wali Kelas ({filteredWaliKelas.length})</span>
            </button>
          </div>

          {/* Unit Filter Buttons */}
          {activeSubTab === 'schedule' ? (
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium">
              {(['ALL', 'SMP', 'SMA', 'TMMIA'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => {
                    setScheduleUnitFilter(unit);
                    setScheduleCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition font-semibold ${
                    scheduleUnitFilter === unit
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  {unit === 'ALL' ? 'Semua Unit' : unit}
                </button>
              ))}
            </div>
          ) : activeSubTab !== 'waliKelas' ? (
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium">
              {(['ALL', 'SMA', 'SMP', 'TMMIA'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setSelectedUnit(unit)}
                  className={`px-3 py-1 rounded-lg transition font-semibold ${
                    selectedUnit === unit
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  {unit === 'ALL' ? 'Semua Unit' : unit}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium overflow-x-auto">
              {(['ALL', 'SMP', 'SMA', 'INTENSIF', 'FULL DAY'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSelectedWaliUnit(u)}
                  className={`px-3 py-1 rounded-lg transition font-semibold whitespace-nowrap ${
                    selectedWaliUnit === u
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  {u === 'ALL' ? `Semua (${totalWali})` : `${u} (${
                    u === 'SMP' ? waliSmpCount : u === 'SMA' ? waliSmaCount : u === 'INTENSIF' ? waliIntCount : waliFdCount
                  })`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-stone-100">
          <div className="relative w-full sm:flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={
                activeSubTab === 'schedule'
                  ? 'Cari jadwal: no urut (1-1119), nama guru, nama mapel, atau kelas...'
                  : activeSubTab === 'waliKelas'
                  ? 'Cari nama wali kelas, gelar, rombel kelas (misal: 1 A, Putri, 4 B, Intensif, VII.3)...'
                  : 'Cari berdasarkan nama guru, nama mapel, kode (SMA01, SMP02), atau kelas...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (activeSubTab === 'schedule') setScheduleCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>

          {activeSubTab === 'schedule' && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Filter Kelas */}
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <Building size={13} />
                <select
                  value={scheduleClassFilter}
                  onChange={(e) => {
                    setScheduleClassFilter(e.target.value);
                    setScheduleCurrentPage(1);
                  }}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 max-w-[170px]"
                >
                  <option value="ALL">Semua Kelas ({scheduleUniqueClasses.length})</option>
                  {scheduleUniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Guru */}
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <Users size={13} />
                <select
                  value={scheduleTeacherFilter}
                  onChange={(e) => {
                    setScheduleTeacherFilter(e.target.value);
                    setScheduleCurrentPage(1);
                  }}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 max-w-[190px]"
                >
                  <option value="ALL">Semua Guru ({scheduleUniqueTeachers.length})</option>
                  {scheduleUniqueTeachers.map((tch) => (
                    <option key={tch} value={tch}>
                      {tch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset button */}
              {(scheduleUnitFilter !== 'ALL' || scheduleClassFilter !== 'ALL' || scheduleTeacherFilter !== 'ALL' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setScheduleUnitFilter('ALL');
                    setScheduleClassFilter('ALL');
                    setScheduleTeacherFilter('ALL');
                    setSearchTerm('');
                    setScheduleCurrentPage(1);
                  }}
                  className="p-2 text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs transition flex items-center gap-1"
                  title="Reset Filter Jadwal"
                >
                  <RotateCcw size={13} />
                  <span className="text-[11px] font-semibold">Reset</span>
                </button>
              )}
            </div>
          )}

          {activeSubTab === 'waliKelas' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 text-xs text-stone-500 whitespace-nowrap">
                <Filter size={13} />
                <span>Santri:</span>
              </div>
              <select
                value={selectedWaliGender}
                onChange={(e) => setSelectedWaliGender(e.target.value as any)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="ALL">Semua Kategori ({totalWali})</option>
                <option value="Putri">Santri Putri ({DAFTAR_WALI_KELAS.filter(w => w.gender === 'Putri').length})</option>
                <option value="Putra">Santri Putra ({DAFTAR_WALI_KELAS.filter(w => w.gender === 'Putra').length})</option>
                <option value="Campuran">Campuran / Full Day ({DAFTAR_WALI_KELAS.filter(w => w.gender === 'Campuran').length})</option>
              </select>

              {/* View Layout Toggle */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`p-1.5 rounded-lg transition ${
                    viewLayout === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Tampilan Tabel"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewLayout === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Tampilan Kartu Grid"
                >
                  <Grid size={14} />
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'subjects' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 text-xs text-stone-500 whitespace-nowrap">
                <Filter size={13} />
                <span>Filter Kelas:</span>
              </div>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="ALL">Semua Kelas ({allClasses.length})</option>
                {allClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              {/* View Layout Toggle */}
              <div className="hidden lg:flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`p-1.5 rounded-lg transition ${
                    viewLayout === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Tampilan Tabel"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewLayout === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Tampilan Kartu Grid"
                >
                  <Grid size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          TAB 1: DAFTAR MATA PELAJARAN (PER MAPEL)
          ========================================================= */}
      {activeSubTab === 'subjects' && (
        <>
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 mb-3">
                <Search size={22} />
              </div>
              <h3 className="text-base font-bold text-stone-900">Tidak ada data mata pelajaran yang cocok</h3>
              <p className="text-xs text-stone-500 mt-1">
                Silakan coba ubah kata kunci pencarian atau reset filter unit/kelas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedUnit('ALL');
                  setSelectedClassFilter('ALL');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl shadow-xs"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : viewLayout === 'table' ? (
            /* TABLE VIEW */
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold tracking-wider uppercase text-[10px]">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 w-24">Kode</th>
                      <th className="py-3 px-4 w-48">Mata Pelajaran</th>
                      <th className="py-3 px-4 w-20 text-center">Unit</th>
                      <th className="py-3 px-4 min-w-[240px]">Guru Pengampu</th>
                      <th className="py-3 px-4 min-w-[320px]">Daftar Rombel Kelas</th>
                      <th className="py-3 px-4 w-20 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {filteredEntries.map((entry, index) => (
                      <tr key={entry.kode} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-stone-400 text-xs">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                            {entry.kode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 text-sm">{entry.namaMapel}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded border uppercase ${getUnitBadge(
                              entry.unit
                            )}`}
                          >
                            {entry.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {entry.guruPengampu.map((guru) => (
                              <span
                                key={guru}
                                className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200/70 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                              >
                                <GraduationCap size={11} className="text-emerald-600 shrink-0" />
                                <span>{guru}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xl">
                            {entry.daftarKelas.map((kelas) => (
                              <span
                                key={kelas}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer"
                                title={`Kelas: ${kelas}`}
                                onClick={() => {
                                  setSelectedClassForMatrix(kelas);
                                  setActiveSubTab('byClass');
                                }}
                              >
                                {kelas}
                              </span>
                            ))}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-1">
                            Total: {entry.daftarKelas.length} Rombel
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleCopy(`${entry.kode} - ${entry.namaMapel}\nGuru: ${entry.guruPengampu.join('; ')}\nKelas: ${entry.daftarKelas.join('; ')}`, entry.kode)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                            title="Salin Rincian"
                          >
                            {copiedText === entry.kode ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.kode}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-xs bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200 text-stone-800">
                        {entry.kode}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${getUnitBadge(
                          entry.unit
                        )}`}
                      >
                        {entry.unit}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 leading-snug mb-3">
                      {entry.namaMapel}
                    </h3>

                    {/* Teacher Badges */}
                    <div className="mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                        <Users size={11} />
                        <span>Guru Pengampu ({entry.guruPengampu.length})</span>
                      </div>
                      <div className="space-y-1">
                        {entry.guruPengampu.map((guru) => (
                          <div
                            key={guru}
                            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100"
                          >
                            <GraduationCap size={13} className="text-emerald-700 shrink-0" />
                            <span className="truncate">{guru}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Classes */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Building size={11} />
                          <span>Daftar Rombel</span>
                        </span>
                        <span className="text-stone-500 font-mono text-[10px]">{entry.daftarKelas.length} kelas</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {entry.daftarKelas.map((kelas) => (
                          <span
                            key={kelas}
                            className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-medium"
                          >
                            {kelas}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card footer actions */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleCopy(`${entry.kode} - ${entry.namaMapel}\nGuru: ${entry.guruPengampu.join('; ')}\nKelas: ${entry.daftarKelas.join('; ')}`, entry.kode)}
                      className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                    >
                      {copiedText === entry.kode ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Salin Info</span>
                        </>
                      )}
                    </button>

                    {onNavigateToGrading && (
                      <button
                        type="button"
                        onClick={() => onNavigateToGrading('1a', entry.namaMapel)}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <span>Input Nilai</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* =========================================================
          TAB 2: DIREKTORI GURU / ASATIDZ (PER GURU)
          ========================================================= */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-4">
          <div className="text-xs text-stone-500 flex items-center justify-between">
            <span>
              Menampilkan <strong>{filteredTeachers.length}</strong> guru / asatidz pengampu dari total{' '}
              <strong>{totalTeachers}</strong> nama yang terdaftar.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher, index) => (
              <div
                key={teacher.name}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  {/* Top Avatar & Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
                        {teacher.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {teacher.units.map((u) => (
                          <span
                            key={u}
                            className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded uppercase border ${getUnitBadge(
                              u
                            )}`}
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subjects taught */}
                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                      <BookOpen size={11} />
                      <span>Mata Pelajaran ({teacher.subjects.length})</span>
                    </div>
                    <div className="space-y-1">
                      {teacher.subjects.map((sub) => (
                        <div
                          key={sub.kode}
                          className="text-xs font-semibold text-stone-800 bg-stone-50 p-1.5 rounded-lg border border-stone-200/70 flex items-center justify-between"
                        >
                          <span className="truncate pr-2">{sub.namaMapel}</span>
                          <span className="font-mono text-[10px] text-stone-500 bg-white px-1 rounded border border-stone-200">
                            {sub.kode}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Classes taught count */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building size={11} />
                        <span>Rombel Kelas Diampu</span>
                      </span>
                      <span className="text-stone-600 font-bold text-[10px]">
                        {teacher.classesTaught.length} Kelas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                      {teacher.classesTaught.slice(0, 8).map((cls) => (
                        <span
                          key={cls}
                          className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9.5px]"
                        >
                          {cls}
                        </span>
                      ))}
                      {teacher.classesTaught.length > 8 && (
                        <span className="bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                          +{teacher.classesTaught.length - 8} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer button */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedTeacherModal(teacher)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <span>Rincian Lengkap</span>
                    <ArrowRight size={13} />
                  </button>

                  <span className="text-[10px] text-stone-400 font-mono">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: DISTRIBUSI PER KELAS / ROMBEL
          ========================================================= */}
      {activeSubTab === 'byClass' && (
        <div className="space-y-4">
          {/* Class selector bar */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  Pilih Rombongan Belajar
                </span>
                <h3 className="text-lg font-bold text-stone-900">
                  Daftar Guru & Mata Pelajaran Kelas: <span className="text-emerald-700 font-black">{selectedClassForMatrix}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Menampilkan seluruh mata pelajaran beserta dewan guru pengampu yang ditugaskan mengajar di kelas ini.
                </p>
              </div>

              {/* Class Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-stone-600">Ganti Kelas:</label>
                <select
                  value={selectedClassForMatrix}
                  onChange={(e) => setSelectedClassForMatrix(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-300 font-bold rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                >
                  {allClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Kelas {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick class chips */}
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-stone-100">
              <span className="text-xs text-stone-400 py-1 mr-1">Rekomendasi Pintas:</span>
              {['1 Intensif', '2 INT IPA', '2 INT IPS', '3 INT IPA', '4 A Putri', '5 A IPA Putri', '6 A IPA Putri', '1 A Tahfiz Putri', '2 A Tahfiz Putri'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedClassForMatrix(c)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                      selectedClassForMatrix === c
                        ? 'bg-emerald-700 text-white font-bold shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {c}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Results Table for Selected Class */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Muatan Guru Pengampu: {selectedClassForMatrix}
                </h4>
                <p className="text-xs text-stone-500">
                  Ditemukan {subjectsForSelectedClass.length} mata pelajaran diajarkan di kelas ini.
                </p>
              </div>

              {onNavigateToGrading && (
                <button
                  type="button"
                  onClick={() => onNavigateToGrading('1a')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition"
                >
                  <span>Buka Lembar Nilai</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-24">Kode</th>
                    <th className="py-3 px-4 w-52">Nama Mata Pelajaran</th>
                    <th className="py-3 px-4 w-20 text-center">Unit</th>
                    <th className="py-3 px-4">Dewan Guru Pengampu di Kelas Ini</th>
                    <th className="py-3 px-4 w-28 text-center">Total Rombel Lain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800">
                  {subjectsForSelectedClass.map(({ subject: entry, teachers }, idx) => (
                    <tr key={entry.kode + '-' + idx} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-stone-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                          {entry.kode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900 text-sm">
                        {entry.namaMapel}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded border uppercase ${getUnitBadge(
                            entry.unit
                          )}`}
                        >
                          {entry.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {teachers.map((guru) => (
                            <span
                              key={guru}
                              className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-950 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            >
                              <GraduationCap size={13} className="text-emerald-700" />
                              <span>{guru}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-stone-500">
                        {entry.daftarKelas.length} kelas
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: DAFTAR WALI KELAS (35 ROMBEL KELAS)
          ========================================================= */}
      {activeSubTab === 'waliKelas' && (
        <div className="space-y-6">
          {/* Wali Kelas Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              onClick={() => { setSelectedWaliUnit('ALL'); setSelectedWaliGender('ALL'); }}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedWaliUnit === 'ALL' && selectedWaliGender === 'ALL'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                <span>Total Rombel</span>
                <Users size={14} />
              </div>
              <div className="text-2xl font-black">{totalWali}</div>
              <div className="text-[10px] opacity-80 mt-0.5 font-medium">35 Wali Kelas Resmi</div>
            </div>

            <div
              onClick={() => setSelectedWaliUnit('SMP')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedWaliUnit === 'SMP'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-600 mb-1">
                <span className={selectedWaliUnit === 'SMP' ? 'text-emerald-200' : 'text-emerald-700 font-bold'}>Unit SMP</span>
                <Building size={14} />
              </div>
              <div className="text-2xl font-black">{waliSmpCount}</div>
              <div className={`text-[10px] mt-0.5 ${selectedWaliUnit === 'SMP' ? 'text-emerald-100' : 'text-stone-500'}`}>Kelas 1, 2, 3 SMP</div>
            </div>

            <div
              onClick={() => setSelectedWaliUnit('SMA')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedWaliUnit === 'SMA'
                  ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                <span className={selectedWaliUnit === 'SMA' ? 'text-blue-200' : 'text-blue-700 font-bold'}>Unit SMA</span>
                <GraduationCap size={14} />
              </div>
              <div className="text-2xl font-black">{waliSmaCount}</div>
              <div className={`text-[10px] mt-0.5 ${selectedWaliUnit === 'SMA' ? 'text-blue-100' : 'text-stone-500'}`}>Kelas 4, 5, 6 SMA</div>
            </div>

            <div
              onClick={() => setSelectedWaliUnit('INTENSIF')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedWaliUnit === 'INTENSIF'
                  ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-600 mb-1">
                <span className={selectedWaliUnit === 'INTENSIF' ? 'text-amber-200' : 'text-amber-700 font-bold'}>Intensif</span>
                <Layers size={14} />
              </div>
              <div className="text-2xl font-black">{waliIntCount}</div>
              <div className={`text-[10px] mt-0.5 ${selectedWaliUnit === 'INTENSIF' ? 'text-amber-100' : 'text-stone-500'}`}>1, 2, 3 Intensif</div>
            </div>

            <div
              onClick={() => setSelectedWaliUnit('FULL DAY')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedWaliUnit === 'FULL DAY'
                  ? 'bg-purple-800 text-white border-purple-800 shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-purple-600 mb-1">
                <span className={selectedWaliUnit === 'FULL DAY' ? 'text-purple-200' : 'text-purple-700 font-bold'}>Full Day</span>
                <Award size={14} />
              </div>
              <div className="text-2xl font-black">{waliFdCount}</div>
              <div className={`text-[10px] mt-0.5 ${selectedWaliUnit === 'FULL DAY' ? 'text-purple-100' : 'text-stone-500'}`}>Kelas VII, IX, X FD</div>
            </div>
          </div>

          {/* Empty state */}
          {filteredWaliKelas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 mb-3">
                <Search size={22} />
              </div>
              <h3 className="text-base font-bold text-stone-900">Tidak ada data wali kelas yang sesuai filter</h3>
              <p className="text-xs text-stone-500 mt-1">
                Silakan coba ubah kata kunci pencarian atau reset filter unit dan kategori santri.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedWaliUnit('ALL');
                  setSelectedWaliGender('ALL');
                  setSearchTerm('');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : viewLayout === 'table' ? (
            /* TABLE VIEW */
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-stone-50/70 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-sm text-stone-900">
                    Daftar Resmi Wali Kelas Tahun Ajaran 2024/2025
                  </h3>
                  <span className="text-xs text-stone-500 font-normal">
                    ({filteredWaliKelas.length} dari {totalWali} rombel ditampilkan)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl shadow-2xs transition"
                  >
                    <Download size={13} />
                    <span>Download CSV Wali Kelas</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4 w-48">Rombel / Nama Kelas</th>
                      <th className="py-3.5 px-4 w-28 text-center">Unit</th>
                      <th className="py-3.5 px-4 w-32 text-center">Kategori Santri</th>
                      <th className="py-3.5 px-4">Nama Lengkap & Gelar Wali Kelas</th>
                      <th className="py-3.5 px-4 w-44 text-center">Aksi / Navigasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {filteredWaliKelas.map((item) => {
                      const isCopied = copiedText === `wali-${item.no}`;
                      return (
                        <tr
                          key={item.no}
                          className="hover:bg-emerald-50/30 transition-colors group"
                        >
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-stone-400">
                            {item.no}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            <div className="flex items-center gap-2">
                              <span className="bg-stone-100 group-hover:bg-white text-stone-900 px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold tracking-tight">
                                {item.className}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block font-bold text-[10px] px-2.5 py-0.5 rounded-full border uppercase ${
                                item.unit === 'SMP'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.unit === 'SMA'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : item.unit === 'INTENSIF'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                              }`}
                            >
                              {item.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                                item.gender === 'Putri'
                                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                                  : item.gender === 'Putra'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              <span>{item.gender}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-sm text-stone-900 tracking-tight">
                                {item.waliName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.waliName, `wali-${item.no}`)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
                                title="Salin Nama Wali Kelas"
                              >
                                {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedWaliModal(item)}
                                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg transition"
                                title="Lihat Detail Rombel"
                              >
                                Detail
                              </button>
                              {onNavigateToGrading && item.classId && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToGrading(item.classId!)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition"
                                  title="Buka Nilai & Raport Kelas Ini"
                                >
                                  <span>Buka Kelas</span>
                                  <ArrowRight size={11} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWaliKelas.map((item) => {
                const isCopied = copiedText === `wali-${item.no}`;
                return (
                  <div
                    key={item.no}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-md bg-stone-100 text-stone-500 font-mono text-xs font-bold flex items-center justify-center border border-stone-200">
                            {item.no}
                          </span>
                          <span
                            className={`font-bold text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                              item.unit === 'SMP'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : item.unit === 'SMA'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : item.unit === 'INTENSIF'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {item.unit}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            item.gender === 'Putri'
                              ? 'bg-pink-50 text-pink-700 border-pink-200'
                              : item.gender === 'Putra'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {item.gender}
                        </span>
                      </div>

                      {/* Class Title */}
                      <h3 className="text-base font-black text-stone-900 tracking-tight">
                        {item.className}
                      </h3>

                      {/* Wali Kelas Box */}
                      <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5 flex items-center gap-1">
                          <UserCheck size={12} className="text-emerald-600" />
                          <span>Wali Kelas Resmi</span>
                        </div>
                        <div className="font-bold text-sm text-stone-900 leading-snug">
                          {item.waliName}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.waliName, `wali-${item.no}`)}
                        className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 font-medium transition"
                      >
                        {isCopied ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Salin Nama</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedWaliModal(item)}
                          className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition"
                        >
                          Detail
                        </button>
                        {onNavigateToGrading && item.classId && (
                          <button
                            type="button"
                            onClick={() => onNavigateToGrading(item.classId!)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition"
                          >
                            <span>Buka Kelas</span>
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 5: RINCIAN RESMI MATA PELAJARAN PER KELAS (1.119 DATA)
          ========================================================= */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-4">
          {/* Header Card with Info and Download CSV */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Dokumen Kurikulum Resmi 2026/2027
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    Total 1.119 Baris Penugasan
                  </span>
                </div>
                <h3 className="text-lg font-black text-stone-900">
                  Rincian Mata Pelajaran per Kelas (Jadwal & Beban Mengajar)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Menampilkan seluruh data pengampu, rombongan belajar, dan alokasi Jam Pelajaran (JP) resmi untuk seluruh unit SMP, SMA, dan TMMIA Pondok & Non-Mukim.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl shadow-2xs transition"
                >
                  <Download size={14} />
                  <span>Download CSV (1.119 Data)</span>
                </button>
              </div>
            </div>

            {/* Dynamic Status / Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  Baris Penugasan
                </div>
                <div className="text-xl font-black text-stone-900">
                  {filteredSchedule.length} <span className="text-xs font-normal text-stone-500">/ 1.119</span>
                </div>
              </div>

              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/70">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
                  Total Jam Terhitung (JP)
                </div>
                <div className="text-xl font-black text-indigo-950">
                  {filteredScheduleHours} <span className="text-xs font-semibold text-indigo-700">JP</span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  Guru Terlibat
                </div>
                <div className="text-xl font-black text-stone-900">
                  {new Set(filteredSchedule.map((r) => r.teacherName)).size}{' '}
                  <span className="text-xs font-normal text-stone-500">Asatidz</span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  Rombel Tercover
                </div>
                <div className="text-xl font-black text-stone-900">
                  {new Set(filteredSchedule.map((r) => r.className)).size}{' '}
                  <span className="text-xs font-normal text-stone-500">Kelas</span>
                </div>
              </div>
            </div>

            {/* Filter context feedback */}
            {(scheduleTeacherFilter !== 'ALL' || scheduleClassFilter !== 'ALL') && (
              <div className="mt-3 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600 shrink-0" />
                  <span>
                    {scheduleTeacherFilter !== 'ALL' && (
                      <>
                        Filter Guru: <strong>{scheduleTeacherFilter}</strong> — Mengajar <strong>{filteredScheduleHours} JP</strong> di <strong>{new Set(filteredSchedule.map((r) => r.className)).size} kelas</strong>.{' '}
                      </>
                    )}
                    {scheduleClassFilter !== 'ALL' && (
                      <>
                        Filter Kelas: <strong>{scheduleClassFilter}</strong> — Beban kurikulum <strong>{filteredScheduleHours} JP</strong> ({filteredSchedule.length} mata pelajaran).
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleTeacherFilter('ALL');
                    setScheduleClassFilter('ALL');
                    setScheduleCurrentPage(1);
                  }}
                  className="text-[11px] font-bold text-indigo-700 hover:underline shrink-0"
                >
                  Tampilkan Semua
                </button>
              </div>
            )}
          </div>

          {/* Schedule Table */}
          {filteredSchedule.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 mb-3">
                <Search size={22} />
              </div>
              <h3 className="text-base font-bold text-stone-900">Tidak ada jadwal yang cocok</h3>
              <p className="text-xs text-stone-500 mt-1">
                Silakan coba ubah kata kunci pencarian atau reset filter jadwal.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setScheduleUnitFilter('ALL');
                  setScheduleClassFilter('ALL');
                  setScheduleTeacherFilter('ALL');
                  setScheduleCurrentPage(1);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition"
              >
                Reset Semua Filter Jadwal
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-4 w-16 text-center">No</th>
                      <th className="py-3.5 px-4 w-44">Kelas / Rombel</th>
                      <th className="py-3.5 px-4">Mata Pelajaran</th>
                      <th className="py-3.5 px-4 w-24 text-center">Unit</th>
                      <th className="py-3.5 px-4">Guru Pengampu</th>
                      <th className="py-3.5 px-4 w-28 text-center">Alokasi Jam</th>
                      <th className="py-3.5 px-4 w-36 text-center">Aksi / Navigasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {paginatedSchedule.map((rec) => {
                      const isCopied = copiedText === `sched-${rec.no}`;
                      const classIds = normalizeClassToIds(rec.className);
                      const classId = classIds.length > 0 ? classIds[0] : null;

                      return (
                        <tr
                          key={rec.no}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          {/* No */}
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-bold text-xs text-stone-400 group-hover:text-stone-700">
                              {rec.no}
                            </span>
                          </td>

                          {/* Kelas */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900">
                                {rec.className}
                              </span>
                            </div>
                          </td>

                          {/* Mata Pelajaran */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">
                              {rec.subjectName}
                            </div>
                          </td>

                          {/* Unit */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded border tracking-wider uppercase ${getUnitBadge(
                                rec.unit
                              )}`}
                            >
                              {rec.unit}
                            </span>
                          </td>

                          {/* Guru Pengampu */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-stone-900">
                                {rec.teacherName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(rec.teacherName, `sched-${rec.no}`)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
                                title="Salin Nama Guru"
                              >
                                {isCopied ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Jam Pelajaran */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold rounded-lg text-xs">
                              <Clock size={12} className="text-indigo-500" />
                              <span>{rec.hours} JP</span>
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {onNavigateToGrading && classId ? (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToGrading(classId, rec.subjectName)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition"
                                  title={`Buka kelas ${rec.className}`}
                                >
                                  <span>Buka Rapor</span>
                                  <ArrowRight size={11} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClassForMatrix(rec.className);
                                    setActiveSubTab('byClass');
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                                  title="Lihat Distribusi Rombel"
                                >
                                  Lihat Rombel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>Tampilkan:</span>
                  <select
                    value={scheduleItemsPerPage}
                    onChange={(e) => {
                      setScheduleItemsPerPage(Number(e.target.value));
                      setScheduleCurrentPage(1);
                    }}
                    className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-800"
                  >
                    <option value={25}>25 baris</option>
                    <option value={50}>50 baris</option>
                    <option value={100}>100 baris</option>
                    <option value={250}>250 baris</option>
                    <option value={-1}>Tampilkan Semua (1.119 Data)</option>
                  </select>
                  <span>
                    Menampilkan{' '}
                    {scheduleItemsPerPage === -1
                      ? `1 - ${filteredSchedule.length}`
                      : `${Math.min((scheduleCurrentPage - 1) * scheduleItemsPerPage + 1, filteredSchedule.length)} - ${Math.min(
                          scheduleCurrentPage * scheduleItemsPerPage,
                          filteredSchedule.length
                        )}`}{' '}
                    dari {filteredSchedule.length} data
                  </span>
                </div>

                {scheduleItemsPerPage !== -1 && scheduleTotalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={scheduleCurrentPage <= 1}
                      onClick={() => setScheduleCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-1 px-2 text-xs font-bold text-stone-700">
                      <span>Hal {scheduleCurrentPage}</span>
                      <span className="text-stone-400 font-normal">/ {scheduleTotalPages}</span>
                    </div>

                    <button
                      type="button"
                      disabled={scheduleCurrentPage >= scheduleTotalPages}
                      onClick={() => setScheduleCurrentPage((p) => Math.min(scheduleTotalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Halaman Selanjutnya"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL DETAIL WALI KELAS
          ========================================================= */}
      {selectedWaliModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-900 text-white flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-black text-xl shadow-inner">
                  {selectedWaliModal.no}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{selectedWaliModal.className}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/20 text-white uppercase tracking-wider">
                      Unit {selectedWaliModal.unit}
                    </span>
                    <span className="text-xs text-stone-300">
                      • Kategori {selectedWaliModal.gender}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWaliModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-stone-800">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Nama Lengkap & Gelar Wali Kelas
                </div>
                <div className="text-base font-black text-stone-900">
                  {selectedWaliModal.waliName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="text-stone-400 font-bold uppercase text-[10px] mb-0.5">Nomor Urut SK</div>
                  <div className="font-bold text-stone-900">Rombel Ke-{selectedWaliModal.no}</div>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="text-stone-400 font-bold uppercase text-[10px] mb-0.5">Jenjang / Kategori</div>
                  <div className="font-bold text-stone-900">{selectedWaliModal.levelLabel || selectedWaliModal.unit}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `Rombel: ${selectedWaliModal.className}\nWali Kelas: ${selectedWaliModal.waliName}\nUnit: ${selectedWaliModal.unit}\nKategori: ${selectedWaliModal.gender}`,
                    'modal-wali'
                  )
                }
                className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                {copiedText === 'modal-wali' ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Data Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Salin Info Wali Kelas</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                {onNavigateToGrading && selectedWaliModal.classId && (
                  <button
                    type="button"
                    onClick={() => {
                      const cId = selectedWaliModal.classId!;
                      setSelectedWaliModal(null);
                      onNavigateToGrading(cId);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                  >
                    Buka Kelas & Nilai
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedWaliModal(null)}
                  className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DETAIL PROFIL GURU
          ========================================================= */}
      {selectedTeacherModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                  {selectedTeacherModal.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{selectedTeacherModal.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {selectedTeacherModal.units.map((u) => (
                      <span
                        key={u}
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/20 text-white uppercase tracking-wider"
                      >
                        Unit {u}
                      </span>
                    ))}
                    <span className="text-xs text-stone-300">
                      • {selectedTeacherModal.subjects.length} Mata Pelajaran
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTeacherModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-stone-800">
              {/* Subjects List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-emerald-600" />
                  <span>Mata Pelajaran Yang Diampu</span>
                </h4>
                <div className="space-y-2">
                  {selectedTeacherModal.subjects.map((sub) => (
                    <div
                      key={sub.kode}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-stone-900">{sub.namaMapel}</span>
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-stone-200 font-bold">
                          {sub.kode}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mb-2">
                        Unit Pendidikan: <strong>{sub.unit}</strong>
                      </div>
                      <div className="text-[11px] font-semibold text-stone-700">
                        Kelas Diampu ({sub.daftarKelas.length}):
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sub.daftarKelas.map((c) => (
                          <span
                            key={c}
                            className="bg-white text-stone-700 border border-stone-200 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Unique Classes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building size={14} className="text-blue-600" />
                    <span>Seluruh Rombel Kelas ({selectedTeacherModal.classesTaught.length})</span>
                  </span>
                </h4>
                <div className="flex flex-wrap gap-1.5 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  {selectedTeacherModal.classesTaught.map((c) => (
                    <span
                      key={c}
                      className="bg-white text-stone-800 border border-stone-200 px-2 py-1 rounded-md text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `Guru: ${selectedTeacherModal.name}\nUnit: ${selectedTeacherModal.units.join(
                      ', '
                    )}\nMapel: ${selectedTeacherModal.subjects
                      .map((s) => `${s.kode} - ${s.namaMapel}`)
                      .join('; ')}\nKelas: ${selectedTeacherModal.classesTaught.join('; ')}`,
                    'modal'
                  )
                }
                className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                {copiedText === 'modal' ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Data Profil Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Salin Data Profil</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedTeacherModal(null)}
                className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

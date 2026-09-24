import React, { useState, useRef, useMemo } from 'react';
import { ClassItem, Subject, CalculatedStudent, AuthUser, JenjangUnit } from '../types';
import { toEasternArabicNumerals, numberToArabicWords } from '../utils/arabicNumbers';
import { numberToIndonesianWords, getPredicateIndonesian } from '../utils/indonesianNumbers';
import { findTeachersForSubjectAndClass } from '../data/teacherSubjectsDatabase';
import { canUserEditSubject, getJenjangForClass } from '../utils/authHelpers';
import * as XLSX from 'xlsx';
import { saveMultipleScoresToSheets } from '../services/googleSheetsService';
import {
  downloadSubjectTemplateExcel,
  parseSubjectScoreExcel,
  ParseSubjectScoreResult,
} from '../utils/excelGradingHelpers';
import { generateModernExcel } from '../utils/excelModernStyler';
import {
  BookOpen,
  Users,
  GraduationCap,
  Printer,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Lock,
  Unlock,
  ShieldAlert,
  School,
  FileSpreadsheet,
  FileCheck,
  Cloud,
  RefreshCw,
  X,
  FileUp,
  ClipboardPaste,
} from 'lucide-react';

interface TeacherGradingViewProps {
  classes: ClassItem[];
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubjectId: (subjectId: string) => void;
  studentsInClass: CalculatedStudent[];
  allStudents?: CalculatedStudent[];
  onUpdateScore: (studentId: string, subjectId: string, value: number) => void;
  onOpenRaportForStudent: (studentId: string) => void;
  currentUser?: AuthUser | null;
  activeJenjang?: JenjangUnit;
  onSelectJenjang?: (unit: JenjangUnit) => void;
  onOpenSyncModal?: () => void;
  sheetsUrl?: string;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
}

export const TeacherGradingView: React.FC<TeacherGradingViewProps> = ({
  classes,
  selectedClassId,
  onSelectClassId,
  subjects,
  selectedSubjectId,
  onSelectSubjectId,
  studentsInClass,
  allStudents = [],
  onUpdateScore,
  onOpenRaportForStudent,
  currentUser = null,
  activeJenjang,
  onSelectJenjang,
  onOpenSyncModal,
  sheetsUrl,
  syncStatus = 'idle',
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pondok' | 'umum' | 'lisan' | 'diampu'>(() => currentUser?.role === 'guru' ? 'diampu' : 'all');
  const [isSavingToSheets, setIsSavingToSheets] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<ParseSubjectScoreResult | null>(null);
  const [isPasteScoreModalOpen, setIsPasteScoreModalOpen] = useState(false);
  const [pasteScoreText, setPasteScoreText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0] || {
    id: '1a',
    nameLatin: '1A (1 A Tahfiz Putri)',
    nameAr: 'الأوّل - A تحفيظ (بنات)',
    waliKelasName: '',
  };

  const isWaliKelas = currentUser?.role === 'wali_kelas';
  const isGuru = currentUser?.role === 'guru';
  const availableUnits: JenjangUnit[] = currentUser?.availableUnits?.filter(u => u === 'SMP' || u === 'SMA') || (isAdmin ? ['SMP', 'SMA'] : ['SMP']);
  const effectiveJenjang: JenjangUnit = activeJenjang || (currentClass ? getJenjangForClass(currentClass) : 'SMP');
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || {
    id: 's1',
    order: 1,
    nameId: 'Mata Pelajaran',
    nameAr: 'المادة الدراسية',
    category: 'pondok' as const,
  };

  // Find teachers assigned to this subject & class from Database Guru
  const assignedTeachers = useMemo(() => {
    return findTeachersForSubjectAndClass(currentSubject.nameId, currentClass.nameLatin);
  }, [currentSubject.nameId, currentClass.nameLatin]);

  // Check if current logged-in user is authorized to edit scores for this subject in this class
  const canEditCurrentSubject = useMemo(() => {
    if (!currentUser) return true;
    return canUserEditSubject(currentUser, currentSubject.nameId, currentClass.nameLatin);
  }, [currentUser, currentSubject.nameId, currentClass.nameLatin]);

  // Guru hanya melihat mata pelajaran yang memang ditugaskan kepadanya.
  // Admin/Wali tetap menggunakan daftar mata pelajaran sesuai kebutuhan peran.
  const filteredSubjects = isGuru
    ? subjects.filter((s) => canUserEditSubject(currentUser, s.nameId, currentClass.nameLatin))
    : subjects.filter((s) => {
        if (categoryFilter === 'all') return true;
        if (categoryFilter === 'diampu') return canUserEditSubject(currentUser, s.nameId, currentClass.nameLatin);
        return s.category === categoryFilter;
      });

  // Filtered students by search term
  const filteredStudents = studentsInClass.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm)
  );

  // Auto-select first authorized subject for guru when class changes
  React.useEffect(() => {
    if (currentUser?.role === 'guru' && subjects.length > 0) {
      const isCurrentEditable = canUserEditSubject(currentUser, currentSubject.nameId, currentClass.nameLatin);
      if (!isCurrentEditable) {
        const firstEditable = subjects.find((s) => canUserEditSubject(currentUser, s.nameId, currentClass.nameLatin));
        if (firstEditable) {
          onSelectSubjectId(firstEditable.id);
        }
      }
    }
  }, [currentClass.id, currentClass.nameLatin, subjects, currentUser]);

  // Statistics for the selected subject in this class
  const scores = studentsInClass.map((s) => s.scores[currentSubject.id] || 0);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const avgScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const passedCount = scores.filter((sc) => sc >= 60).length;
  const passPercentage = scores.length > 0 ? Math.round((passedCount / scores.length) * 100) : 0;

  // Grade predicate (Indonesian & Pesantren Arabic standards)
  const getPredicate = (score: number) => {
    if (score >= 85) return { label: 'A (Mumtaz)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 75) return { label: 'B (Jayyid Jiddan)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 65) return { label: 'C (Jayyid)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (score >= 60) return { label: 'D (Maqbul)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { label: 'E (Rasib)', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  // Keyboard navigation: pressing Enter or ArrowDown jumps to next student
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextStudent = filteredStudents[currentIndex + 1];
      if (nextStudent && inputRefs.current[nextStudent.id]) {
        inputRefs.current[nextStudent.id]?.focus();
        inputRefs.current[nextStudent.id]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = filteredStudents[currentIndex - 1];
      if (prevStudent && inputRefs.current[prevStudent.id]) {
        inputRefs.current[prevStudent.id]?.focus();
        inputRefs.current[prevStudent.id]?.select();
      }
    }
  };

  const handleSaveToSpreadsheet = async () => {
    if (!sheetsUrl) {
      if (onOpenSyncModal) {
        onOpenSyncModal();
      } else {
        alert('Koneksi data belum tersedia. Silakan hubungi Admin.');
      }
      return;
    }

    setIsSavingToSheets(true);
    setSaveSuccessMessage(null);

    const items = studentsInClass.map((std) => ({
      studentId: std.id,
      studentNo: std.no || 0,
      classId: currentClass.id || std.classId || '1a',
      studentName: std.name,
      nisn: std.nisn || '',
      subjectId: currentSubject.id,
      score: std.scores[currentSubject.id] || 0,
    }));

    try {
      const res = await saveMultipleScoresToSheets(sheetsUrl, {
        classId: currentClass.id,
        className: currentClass.nameLatin,
        subjectId: currentSubject.id,
        subjectName: currentSubject.nameId,
        teacherName: assignedTeachers.join(', ') || currentUser?.name || '-',
        waliKelas: currentClass.waliKelasName || '-',
        items,
      });
      if (res.success) {
        setSaveSuccessMessage(
          `✅ Berhasil menyimpan ${items.length} nilai ${currentSubject.nameId} (${currentClass.nameLatin}) ke sistem!`
        );
        setTimeout(() => setSaveSuccessMessage(null), 6000);
      } else {
        alert(res.message || 'Gagal menyimpan nilai.');
      }
    } catch (err: any) {
      alert(`Error saat menyimpan nilai: ${err.message || String(err)}`);
    } finally {
      setIsSavingToSheets(false);
    }
  };

  const handleApplyPastedScores = (rawText: string) => {
    if (!canEditCurrentSubject) {
      alert(`Anda (${currentUser?.name || 'Pengguna'}) tidak berhak menginput nilai untuk mata pelajaran ${currentSubject.nameId} di kelas ini.`);
      return false;
    }

    const values = rawText
      .replace(/\r/g, '')
      .split(/[\n\t,; ]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (values.length === 0) return false;

    if (values.length !== studentsInClass.length) {
      alert(
        `Jumlah nilai yang ditempel (${values.length}) tidak sama dengan jumlah santri di kelas ini (${studentsInClass.length}).\\n\\nPastikan Anda menyalin seluruh kolom nilai sesuai urutan santri.`
      );
      return false;
    }

    const parsedScores = values.map((value) => Number(value));
    const hasInvalidScore = parsedScores.some(
      (score) => !Number.isFinite(score) || score < 0 || score > 100 || !Number.isInteger(score)
    );

    if (hasInvalidScore) {
      alert('Ada nilai yang tidak valid. Gunakan angka bulat 0–100, satu nilai untuk setiap santri.');
      return false;
    }

    studentsInClass.forEach((student, index) => {
      onUpdateScore(student.id, currentSubject.id, parsedScores[index]);
    });

    setPasteScoreText('');
    setIsPasteScoreModalOpen(false);
    setSaveSuccessMessage(`✅ ${parsedScores.length} nilai berhasil ditempel sesuai urutan santri.`);
    setTimeout(() => setSaveSuccessMessage(null), 5000);
    return true;
  };

  const handlePasteScoreBoxPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setPasteScoreText(pastedText);

    // Setelah guru menempel seluruh kolom nilai, langsung masukkan ke tabel.
    window.setTimeout(() => {
      handleApplyPastedScores(pastedText);
    }, 0);
  };

  const handleExportMapelExcel = () => {
    const safeMapel = currentSubject.nameId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeKelas = currentClass.nameLatin.replace(/[^a-zA-Z0-9_-]/g, '_');
    const isFullDay = currentClass.schoolType === 'fullday' || currentClass.id.includes('-fd');

    if (isFullDay) {
      const isSmp = currentClass.nameLatin.toLowerCase().includes('vii') ||
                    currentClass.nameLatin.toLowerCase().includes('viii') ||
                    currentClass.nameLatin.toLowerCase().includes('ix') ||
                    currentClass.nameLatin.toLowerCase().includes('smp');
      const schoolTitle = isSmp ? 'SMP ISLAM AL-GHOZALI' : 'SMA ISLAM AL-GHOZALI';
      const kkm = currentSubject.kkm || 70;

      const tableHeaders = [
        'No',
        'NIS',
        'Nama Lengkap Siswa',
        'Kelas',
        'KKM',
        'Nilai Angka',
        'Terbilang',
        'Predikat',
        'Status',
      ];

      const tableHeaderAligns: ('center' | 'left' | 'right')[] = [
        'center',
        'center',
        'left',
        'center',
        'center',
        'center',
        'left',
        'center',
        'center',
      ];

      const dataRows = studentsInClass.map((s, idx) => {
        const sc = s.scores[currentSubject.id] || 0;
        const pred = getPredicateIndonesian(sc, kkm);
        return [
          idx + 1,
          s.nis || s.nisn || '-',
          s.name,
          currentClass.nameLatin,
          kkm,
          sc,
          numberToIndonesianWords(sc),
          pred.label,
          pred.status,
        ];
      });

      const passedCountFd = studentsInClass.filter((s) => (s.scores[currentSubject.id] || 0) >= kkm).length;
      const passPercentageFd = studentsInClass.length > 0 ? Math.round((passedCountFd / studentsInClass.length) * 100) : 0;

      const summaryRows = [
        {
          label: 'Statistik Kelas',
          values: {
            2: `Rata-rata: ${avgScore} | Tertinggi: ${maxScore} | Terendah: ${minScore}`,
            5: avgScore,
            8: `${passedCountFd}/${studentsInClass.length} Tuntas (${passPercentageFd}%)`,
          },
        },
      ];

      generateModernExcel({
        sheetName: 'Daftar Nilai Siswa',
        bannerTitle: 'YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI',
        subtitle: `DAFTAR NILAI ASESMEN SUMATIF - ${schoolTitle} - ${currentSubject.nameId.toUpperCase()}`,
        metaRows: [
          { label: 'Mata Pelajaran:', value: currentSubject.nameId, labelCol: 0, valueCol: 1 },
          { label: 'Kelas:', value: currentClass.nameLatin, labelCol: 0, valueCol: 1 },
          { label: 'KKM:', value: String(kkm), labelCol: 0, valueCol: 1 },
          { label: 'Guru Pengampu:', value: assignedTeachers.join(', ') || currentUser?.name || '-', labelCol: 0, valueCol: 1 },
          { label: 'Wali Kelas:', value: currentClass.waliKelasName || '-', labelCol: 0, valueCol: 1 },
          { label: 'Tanggal Unduh:', value: new Date().toLocaleDateString('id-ID'), labelCol: 0, valueCol: 1 },
        ],
        tableHeaders,
        tableHeaderAligns,
        rows: dataRows,
        summaryRows,
        colWidths: [6, 14, 32, 16, 10, 14, 28, 16, 16],
        signatureInfo: {
          placeAndDate: `Ditetapkan di: Gunungsindur, ${new Date().toLocaleDateString('id-ID')}`,
          waliKelasTitle: 'Guru Pengampu',
          waliKelasName: assignedTeachers[0] || currentUser?.name || '-',
          pimpinanTitle: 'Wali Kelas',
          pimpinanName: currentClass.waliKelasName || '-',
        },
        fileName: `Daftar_Nilai_${safeMapel}_${safeKelas}.xlsx`,
      });
      return;
    }

    const tableHeaders = [
      'No',
      'NISN',
      'Nama Lengkap Santri',
      'Kelas',
      'Nilai Angka',
      'Angka Arab',
      'Terbilang Arab (Tafqit)',
      'Predikat',
      'Status',
    ];

    const tableHeaderAligns: ('center' | 'left' | 'right')[] = [
      'center',
      'center',
      'left',
      'center',
      'center',
      'center',
      'right',
      'center',
      'center',
    ];

    const dataRows = studentsInClass.map((s, idx) => {
      const sc = s.scores[currentSubject.id] || 0;
      return [
        idx + 1,
        s.nisn || '-',
        s.name,
        currentClass.nameLatin,
        sc,
        toEasternArabicNumerals(sc),
        numberToArabicWords(sc),
        getPredicate(sc).label,
        sc >= 60 ? 'Tuntas' : 'Belum Tuntas',
      ];
    });

    const summaryRows = [
      {
        label: 'Statistik Kelas',
        values: {
          2: `Rata-rata: ${avgScore} | Tertinggi: ${maxScore} | Terendah: ${minScore}`,
          4: avgScore,
          8: `${passedCount}/${studentsInClass.length} Tuntas (${passPercentage}%)`,
        },
      },
    ];

    generateModernExcel({
      sheetName: 'Daftar Nilai',
      bannerTitle: 'YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI',
      subtitle: `DAFTAR NILAI ASESMEN HASIL BELAJAR SANTRI - ${currentSubject.nameId.toUpperCase()}`,
      metaRows: [
        { label: 'Mata Pelajaran:', value: `${currentSubject.nameId} (${currentSubject.nameAr})`, labelCol: 0, valueCol: 1 },
        { label: 'Kelas:', value: currentClass.nameLatin, labelCol: 0, valueCol: 1 },
        { label: 'Guru Pengampu:', value: assignedTeachers.join(', ') || currentUser?.name || '-', labelCol: 0, valueCol: 1 },
        { label: 'Wali Kelas:', value: currentClass.waliKelasName || '-', labelCol: 0, valueCol: 1 },
        { label: 'Tanggal Unduh:', value: new Date().toLocaleDateString('id-ID'), labelCol: 0, valueCol: 1 },
      ],
      tableHeaders,
      tableHeaderAligns,
      rows: dataRows,
      summaryRows,
      colWidths: [6, 16, 32, 16, 14, 14, 26, 20, 16],
      signatureInfo: {
        placeAndDate: `Ditetapkan di: Gunung Sindur, ${new Date().toLocaleDateString('id-ID')}`,
        waliKelasTitle: 'Guru Pengampu',
        waliKelasName: assignedTeachers[0] || currentUser?.name || '-',
        pimpinanTitle: 'Wali Kelas',
        pimpinanName: currentClass.waliKelasName || '-',
      },
      fileName: `Daftar_Nilai_${safeMapel}_${safeKelas}.xlsx`,
    });
  };

  const handleDownloadTemplate = () => {
    downloadSubjectTemplateExcel({
      students: studentsInClass,
      subject: currentSubject,
      currentClass,
      assignedTeachers,
      waliKelas: currentClass.waliKelasName || '-',
    });
  };

  const handleTriggerUpload = () => {
    if (!canEditCurrentSubject) {
      alert(`Anda (${currentUser?.name || 'Pengguna'}) tidak berhak menginput nilai untuk mata pelajaran ${currentSubject.nameId} di kelas ini.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const res = await parseSubjectScoreExcel(file, currentSubject.id, studentsInClass);
      setImportResult(res);
      setIsImportModalOpen(true);

      if (res.success && res.updates.length > 0) {
        res.updates.forEach((u) => {
          onUpdateScore(u.studentId, currentSubject.id, u.score);
        });
      }
    } catch (err: any) {
      alert(`Gagal mengimpor file: ${err.message || String(err)}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* =========================================================
          STEP 1: GURU PILIH KELAS
          ========================================================= */}
      <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">1</span>
              <span>Langkah Pertama</span>
            </div>
            <h2 className="text-lg font-extrabold text-stone-900 mt-0.5">
              Pilih Kelas Yang Diajar
            </h2>
            <p className="text-xs text-stone-500">
              {isAdmin
                ? `Menampilkan seluruh kelas di Jenjang ${effectiveJenjang}`
                : `Menampilkan hanya kelas yang Anda ampu di Jenjang ${effectiveJenjang}`}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
            <GraduationCap className="text-emerald-600" size={16} />
            <span className="text-stone-500">Wali Kelas:</span>
            <span className="font-bold text-stone-800">{currentClass.waliKelasName || '-'}</span>
          </div>
        </div>

        {/* Multi-Jenjang Selector (Otomatis tampil jika guru mengajar di 2 jenjang atau admin) */}
        {availableUnits.length > 1 && onSelectJenjang && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 p-3.5 rounded-2xl border border-emerald-500/40 text-white mb-4 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <School size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" />
                  {isAdmin ? 'Pilih Jenjang Sekolah:' : `Anda Mengajar di ${availableUnits.length} Jenjang:`}
                </span>
                <span className="text-[11px] text-stone-300">
                  {isAdmin ? 'Filter kelas berdasarkan unit' : 'Pilih jenjang untuk menampilkan kelas yang Anda ampu:'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {availableUnits.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => onSelectJenjang(unit)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    effectiveJenjang === unit
                      ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400 font-extrabold'
                      : 'bg-stone-800/90 text-stone-300 hover:bg-stone-750 hover:text-white border border-stone-700'
                  }`}
                >
                  <span>{unit === 'SMP' ? 'SMP (Kelas 1-3)' : unit === 'SMA' ? 'SMA (Kelas 4-6)' : 'TMMIA / INT'}</span>
                  {effectiveJenjang === unit && <CheckCircle2 size={13} className="text-amber-300" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification Bar of Displayed Classes */}
        <div className="flex items-center justify-between bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl mb-3 text-xs">
          <div className="flex items-center gap-2 text-stone-700 font-semibold">
            <Users size={14} className="text-emerald-600" />
            <span>
              {isAdmin
                ? `Menampilkan ${classes.length} Kelas di Jenjang ${effectiveJenjang}`
                : `Hanya Menampilkan ${classes.length} Kelas Yang Diampu di Jenjang ${effectiveJenjang}`}
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            {currentUser ? `${currentUser.name} (${currentUser.role === 'guru' ? 'Guru' : currentUser.role === 'wali_kelas' ? 'Wali Kelas' : 'Admin'})` : ''}
          </span>
        </div>

        {/* Class Selection Buttons */}
        {classes.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 border border-dashed border-stone-300 rounded-2xl">
            <ShieldAlert size={36} className="mx-auto text-amber-600 mb-2" />
            <h3 className="font-bold text-stone-800 text-sm">
              Tidak Ada Kelas yang Diampu di Jenjang {effectiveJenjang}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Berdasarkan Master Penugasan Guru, Anda ({currentUser?.name || 'Guru'}) tidak memiliki jadwal mengajar pada jenjang ini.
              {availableUnits.length > 1 && ' Silakan beralih ke tombol jenjang lain di atas untuk melihat kelas yang Anda ampu.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {classes.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const count = allStudents.length > 0
                ? allStudents.filter((s) => (s.classId || '1a') === cls.id).length
                : (cls.id === selectedClassId ? studentsInClass.length : 0);
              const isPutri =
                cls.id === '1a' ||
                cls.id === '1b' ||
                cls.id === '2a' ||
                cls.id === '2b' ||
                cls.id === '2c' ||
                cls.id === '3a' ||
                cls.id === '3b' ||
                cls.id === '3c' ||
                cls.id === '4a' ||
                cls.id === '5a' ||
                cls.id === '5b' ||
                cls.id === '6a' ||
                cls.id === '6b';
              const is1Int = cls.id === '1int';
              const is2IntA = cls.id === '2int-a';
              const is2IntB = cls.id === '2int-b';
              const is2Int = is2IntA || is2IntB;
              const is3IntA = cls.id === '3int-a';
              const is3IntB = cls.id === '3int-b';
              const is3Int = is3IntA || is3IntB;
              const is4 = cls.id.startsWith('4');
              const is5 = cls.id.startsWith('5');
              const is6 = cls.id.startsWith('6');
              const levelNum = is1Int ? '1 INT' : is2Int ? '2 INT' : is3Int ? '3 INT' : is4 ? '4 / 1 SMA' : is5 ? '5 / 2 SMA' : is6 ? '6 / 3 SMA' : (cls.id.startsWith('3') && !is3Int) ? '3' : cls.id.startsWith('2') ? '2' : '1';

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectClassId(cls.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-extrabold text-sm ${
                          isSelected ? 'text-emerald-900' : 'text-stone-800'
                        }`}
                      >
                        {is1Int ? '1 INT' : is2IntA ? '2INT.A IPA' : is2IntB ? '2INT.B IPS' : is3IntA ? '3INT.A IPA' : is3IntB ? '3INT.B IPS' : cls.id === '5a' ? '5A IPA' : cls.id === '5b' ? '5B IPS' : cls.id === '5c' ? '5C IPA' : cls.id === '5d' ? '5D IPS' : cls.id === '6a' ? '6A IPA' : cls.id === '6b' ? '6B IPS' : cls.id === '6c' ? '6C IPA' : cls.id === '6d' ? '6D IPS' : cls.nameLatin.split(' ')[0]}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        is1Int ? 'bg-fuchsia-100 text-fuchsia-800' :
                        is2Int ? 'bg-purple-100 text-purple-800' :
                        is3Int ? 'bg-rose-100 text-rose-800' :
                        is4 ? 'bg-emerald-100 text-emerald-800' :
                        is5 ? 'bg-amber-100 text-amber-800' :
                        is6 ? 'bg-teal-100 text-teal-800' :
                        levelNum === '3' ? 'bg-purple-50 text-purple-700' :
                        levelNum === '2' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {is1Int ? '1 INT / SMA' : is2Int ? '2 INT / SMA' : is3Int ? '3 INT / 3 SMA' : is4 ? '4 / 1 SMA' : is5 ? '5 / 2 SMA' : is6 ? '6 / 3 SMA' : `${levelNum} SMP`}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full mt-1">
                    <span className="font-arabic text-sm text-stone-500 font-bold" dir="rtl">
                      {cls.nameAr}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      is1Int || is2Int ? 'text-purple-600' : is3Int ? 'text-rose-600' : isPutri ? 'text-pink-600' : 'text-blue-600'
                    }`}>
                      {is1Int ? '8 Pi • 11 Pa' : is2IntA ? '4 Pi • 4 Pa (IPA)' : is2IntB ? '5 Pi • 4 Pa (IPS)' : is3IntA ? '9 Pi • 9 Pa (IPA)' : is3IntB ? '9 Pi • 7 Pa (IPS)' : cls.id === '5a' || cls.id === '6a' ? 'Putri (IPA)' : cls.id === '5b' || cls.id === '6b' ? 'Putri (IPS)' : cls.id === '5c' || cls.id === '6c' ? 'Putra (IPA)' : cls.id === '5d' || cls.id === '6d' ? 'Putra (IPS)' : isPutri ? 'Putri' : 'Putra'}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] font-medium text-stone-600 flex items-center gap-1">
                    <Users size={12} className="text-stone-400" />
                    <span>{count} Santri</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================
          STEP 2: GURU PILIH MATA PELAJARAN YANG DIAJAR DI KELAS ITU
          ========================================================= */}
      <section className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">2</span>
              <span>Langkah Kedua</span>
            </div>
            <h2 className="text-lg font-extrabold text-stone-900 mt-0.5">
              Pilih Mata Pelajaran Yang Diajar di Kelas {currentClass.nameLatin}
            </h2>
            <p className="text-xs text-stone-500">
              {isGuru
                ? `Menampilkan ${filteredSubjects.length} mata pelajaran yang Anda ajar di kelas ${currentClass.nameLatin}`
                : `Menampilkan ${subjects.length} mata pelajaran resmi kurikulum untuk kelas ${currentClass.nameLatin}`}
            </p>
          </div>

          {/* Category Filter Tabs: Guru tidak perlu filter karena daftar sudah dibatasi hanya pada mapel yang diampu. */}
          {!isGuru && (
            <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
              <button type="button" onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}>
                Semua ({subjects.length})
              </button>
              <button type="button" onClick={() => setCategoryFilter('pondok')} className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'pondok' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}>
                Pondok ({subjects.filter((s) => s.category === 'pondok').length})
              </button>
              <button type="button" onClick={() => setCategoryFilter('umum')} className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'umum' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}>
                Umum ({subjects.filter((s) => s.category === 'umum').length})
              </button>
              {subjects.some((s) => s.category === 'lisan') && (
                <button type="button" onClick={() => setCategoryFilter('lisan')} className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'lisan' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}>
                  Lisan ({subjects.filter((s) => s.category === 'lisan').length})
                </button>
              )}
            </div>
          )}        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredSubjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubjectId(sub.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                    : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span
                      className={`font-mono px-1.5 py-0.2 rounded font-bold text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      #{sub.order}
                    </span>
                    <span
                      className={`text-[9.5px] uppercase font-bold ${
                        isSelected ? 'text-emerald-100' : 'text-stone-400'
                      }`}
                    >
                      {sub.category}
                    </span>
                  </div>

                  <div className="text-xs font-bold truncate" title={sub.nameId}>
                    {sub.nameId}
                  </div>

                  <div
                    className={`font-arabic text-xs mt-0.5 text-right truncate ${
                      isSelected ? 'text-emerald-100' : 'text-stone-500'
                    }`}
                    dir="rtl"
                  >
                    {sub.nameAr}
                  </div>
                </div>

              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          STEP 3: TAMPIL SELURUH SISWA DI KELAS & LEMBAR INPUT NILAI
          ========================================================= */}
      <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Header & Stats Bar */}
        <div className="p-5 border-b border-stone-200 bg-stone-50/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">3</span>
                <span>Daftar Nilai Siswa</span>
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{currentSubject.nameId}</span>
                <span className="font-arabic text-lg font-bold text-emerald-700">
                  ({currentSubject.nameAr})
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold font-sans">
                  Kelas {currentClass.nameLatin}
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Menampilkan seluruh {studentsInClass.length} santri di kelas {currentClass.nameLatin}. Tekan Enter/Panah Bawah untuk pindah ke santri berikutnya.
              </p>

              {/* Guru Pengampu dari Database Guru */}
              {assignedTeachers.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <GraduationCap size={13} className="text-emerald-700" />
                    Guru Pengampu:
                  </span>
                  {assignedTeachers.map((guru) => (
                    <span
                      key={guru}
                      className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>{guru}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Teacher Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <>
              {/* Tombol Simpan Langsung ke Spreadsheet */}
              <button
                type="button"
                onClick={handleSaveToSpreadsheet}
                disabled={isSavingToSheets}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg shadow-sm transition active:scale-95"
                title="Simpan semua nilai mata pelajaran ini"
              >
                {isSavingToSheets ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyimpan nilai...</span>
                  </>
                ) : (
                  <>
                    <Cloud size={14} className="text-emerald-200" />
                    <span>Simpan Nilai</span>
                  </>
                )}
              </button>

              {onOpenSyncModal && (
                <button
                  type="button"
                  onClick={onOpenSyncModal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow-2xs transition ${
                    sheetsUrl
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                  title={sheetsUrl ? 'Data tersimpan dan tersinkron' : 'Koneksi data dikelola Admin'}
                >
                  <Cloud size={14} className={sheetsUrl ? 'text-emerald-600' : 'text-stone-400'} />
                  <span>{sheetsUrl ? 'Status: Terhubung' : 'Status Data'}</span>
                  {sheetsUrl && (
                    <span className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-spin' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  )}
                </button>
              )}

                </>
              )}

              {/* Hidden file input for Excel upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />

              {/* Tombol Unduh Template Excel */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition active:scale-95"
                title="Unduh file template Excel (.xlsx) resmi untuk mengisi nilai santri kelas ini secara offline"
              >
                <Download size={14} />
                <span>Unduh Template Excel</span>
              </button>

              {/* Tombol Upload Nilai Excel */}
              <button
                type="button"
                onClick={handleTriggerUpload}
                disabled={isImporting || !canEditCurrentSubject}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition active:scale-95 ${
                  !canEditCurrentSubject
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title={
                  !canEditCurrentSubject
                    ? 'Hanya Guru Pengampu yang berhak mengupload nilai mata pelajaran ini'
                    : 'Upload file Excel (.xlsx / .xls / .csv) untuk mengimpor nilai santri'
                }
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Upload Nilai Excel</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsPasteScoreModalOpen(true)}
                disabled={!canEditCurrentSubject}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition ${
                  !canEditCurrentSubject
                    ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                    : 'bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-300 hover:border-emerald-300'
                }`}
                title="Salin seluruh kolom nilai dari Excel, lalu tempel ke kotak. Nilai akan masuk sesuai urutan santri."
              >
                <ClipboardPaste size={14} className="text-emerald-600" />
                Tempel Nilai
              </button>

              <button
                type="button"
                onClick={handleExportMapelExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-sm transition"
                title="Download Lembar Nilai Format Microsoft Excel (.xlsx) dengan Format & Border Modern"
              >
                <FileSpreadsheet size={14} />
                Export Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-sm transition"
              >
                <Printer size={14} />
                Cetak Lembar Nilai
              </button>
            </div>
          </div>

          {/* Success Save Banner */}
          {saveSuccessMessage && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {/* Modal Tempel Nilai */}
          {isPasteScoreModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden">
                <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ClipboardPaste size={20} />
                    <div>
                      <h3 className="font-extrabold text-sm">Tempel Nilai</h3>
                      <p className="text-[11px] text-emerald-100">
                        {currentSubject.nameId} • {currentClass.nameLatin}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPasteScoreText('');
                      setIsPasteScoreModalOpen(false);
                    }}
                    className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    <p className="font-bold mb-1">Cara pakai:</p>
                    <p>
                      Salin semua nilai dari Excel, lalu <strong>paste ke kotak di bawah</strong>.
                      Nilai akan langsung masuk mengikuti urutan santri pada tabel.
                    </p>
                    <p className="mt-1 text-emerald-700">
                      Contoh: <strong>80, 75, 90, 88, 72...</strong> untuk santri nomor 1, 2, 3, 4, 5...
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>Jumlah santri: <strong className="text-stone-800">{studentsInClass.length}</strong></span>
                    <span>Format: <strong className="text-stone-800">1 nilai per baris / kolom</strong></span>
                  </div>

                  <textarea
                    autoFocus
                    value={pasteScoreText}
                    onChange={(e) => setPasteScoreText(e.target.value)}
                    onPaste={handlePasteScoreBoxPaste}
                    placeholder={`80
75
90
88
72
...`}
                    className="w-full min-h-[220px] resize-y rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 font-mono text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
                  />

                  <p className="text-[11px] text-stone-500">
                    <strong>Tempel langsung:</strong> begitu seluruh kolom nilai ditempel, sistem akan memasukkannya otomatis.
                  </p>
                </div>

                <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasteScoreText('');
                      setIsPasteScoreModalOpen(false);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPastedScores(pasteScoreText)}
                    disabled={!pasteScoreText.trim()}
                    className="px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    Masukkan Nilai
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <TrendingUp size={18} />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 font-medium block">Rata-Rata Mapel</span>
                <span className="text-lg font-extrabold text-stone-900">{avgScore}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 font-medium block">Tertinggi / Terendah</span>
                <span className="text-lg font-extrabold text-stone-900">
                  {maxScore} <span className="text-xs text-stone-400 font-normal">/ {minScore}</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 font-medium block">Santri Tuntas</span>
                <span className="text-lg font-extrabold text-emerald-700">
                  {passedCount} <span className="text-xs text-stone-400 font-normal">/ {studentsInClass.length}</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <BookOpen size={18} />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 font-medium block">Tingkat Kelulusan</span>
                <span className="text-lg font-extrabold text-stone-900">{passPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Search & Table Toolbar */}
        <div className="no-print p-3 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input
              type="text"
              placeholder="Cari santri di kelas ini..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 font-medium">
              KKM Standar: <strong>60</strong>
            </span>
          </div>
        </div>

        {/* Table of Students in the Selected Class */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-28">NISN</th>
                <th className="py-2.5 px-4 min-w-[200px]">Nama Lengkap Santri</th>
                <th className="py-2.5 px-3 w-32 text-center">Input Nilai (0-100)</th>
                <th className="py-2.5 px-3 w-20 text-center font-arabic text-xs">الأرقام</th>
                <th className="py-2.5 px-4 min-w-[170px] text-right font-arabic text-xs">بالحروف (Tafqit)</th>
                <th className="py-2.5 px-3 w-28 text-center">Predikat</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
                {(isAdmin || isWaliKelas) && (
                  <th className="no-print py-2.5 px-3 w-24 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin || isWaliKelas ? 9 : 8} className="py-12 text-center text-stone-400">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Tidak ada santri di kelas ini.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const score = student.scores[currentSubject.id] ?? 0;
                  const predicate = getPredicate(score);
                  const isPassed = score >= 60;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-emerald-50/40 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-2 px-3 text-center font-bold text-stone-600">
                        {index + 1}
                      </td>

                      {/* NISN */}
                      <td className="py-2 px-3 font-mono text-[11px] text-stone-600">
                        {student.nisn || '-'}
                      </td>

                      {/* Nama Santri */}
                      <td className="py-2 px-4 font-bold text-stone-900">
                        <div className="flex items-center justify-between">
                          <span>{student.name}</span>
                          <span className="text-[10px] text-stone-400 font-normal hidden group-hover:inline">
                            Peringkat #{student.rank}
                          </span>
                        </div>
                      </td>

                      {/* Input Nilai Field */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            ref={(el) => {
                              inputRefs.current[student.id] = el;
                            }}
                            type="number"
                            min="0"
                            max="100"
                            disabled={!canEditCurrentSubject}
                            value={score}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                              onUpdateScore(student.id, currentSubject.id, val);
                            }}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            title={!canEditCurrentSubject ? 'Hanya Guru Pengampu resmi yang berhak mengedit nilai ini' : undefined}
                            className={`w-16 text-center font-mono font-extrabold text-sm py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition ${
                              !canEditCurrentSubject
                                ? 'bg-stone-100 border-stone-300 text-stone-500 cursor-not-allowed'
                                : score < 60
                                ? 'border-red-400 bg-red-50 text-red-700'
                                : 'border-stone-300 bg-white text-stone-900'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Angka Arab Timur */}
                      <td className="py-2 px-3 text-center font-arabic font-bold text-sm text-stone-800">
                        {toEasternArabicNumerals(score)}
                      </td>

                      {/* Terbilang Huruf Arab */}
                      <td className="py-2 px-4 text-right font-arabic font-semibold text-xs text-stone-900 whitespace-nowrap">
                        {numberToArabicWords(score)}
                      </td>

                      {/* Predikat */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${predicate.color}`}
                        >
                          {predicate.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            isPassed ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <AlertCircle size={13} />
                          )}
                          <span>{isPassed ? 'Tuntas' : 'Remidi'}</span>
                        </span>
                      </td>

                      {/* Aksi (Admin & Wali Kelas Only) */}
                      {(isAdmin || isWaliKelas) && (
                        <td className="no-print py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenRaportForStudent(student.id)}
                            title="Buka Raport Kasyfud Darajat Santri Ini"
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md transition inline-flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <ExternalLink size={13} />
                            <span>Raport</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions & Notes */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-stone-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>
              Progres Nilai: <strong className="text-stone-900">{scores.filter((s) => s > 0).length}</strong> dari{' '}
              <strong className="text-stone-900">{studentsInClass.length}</strong> santri telah terisi nilai ({currentSubject.nameId} - {currentClass.nameLatin}).
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSaveToSpreadsheet}
              disabled={isSavingToSheets}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg shadow-sm transition active:scale-95"
              title="Simpan semua nilai santri di kelas ini"
            >
              {isSavingToSheets ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Menyimpan nilai...</span>
                </>
              ) : (
                <>
                  <Cloud size={14} className="text-emerald-200" />
                  <span>Simpan Nilai</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          MODAL HASIL IMPORT NILAI EXCEL
          ========================================================= */}
      {isImportModalOpen && importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className={`p-4 text-white flex items-center justify-between ${importResult.success ? 'bg-emerald-700' : 'bg-amber-600'}`}>
              <div className="flex items-center gap-2.5">
                {importResult.success ? (
                  <CheckCircle2 size={22} className="text-emerald-200" />
                ) : (
                  <AlertCircle size={22} className="text-amber-200" />
                )}
                <div>
                  <h3 className="font-extrabold text-sm">
                    {importResult.success ? 'Import Nilai Excel Berhasil' : 'Peringatan Import Nilai'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    {currentSubject.nameId} • Kelas {currentClass.nameLatin}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                importResult.success
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <FileCheck size={24} className={importResult.success ? 'text-emerald-600' : 'text-amber-600'} />
                <div>
                  <p className="font-bold text-sm">
                    {importResult.updates.length} Nilai Santri Berhasil Diperbarui
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Total {importResult.totalRowsProcessed} baris data diproses dari file Excel.
                  </p>
                </div>
              </div>

              {/* List of updated students */}
              {importResult.updates.length > 0 && (
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="bg-stone-100 px-3 py-1.5 font-bold text-[11px] text-stone-700 flex justify-between">
                    <span>Nama Santri</span>
                    <span>Nilai Baru</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-stone-100">
                    {importResult.updates.map((u, i) => (
                      <div key={u.studentId} className="px-3 py-1.5 flex items-center justify-between text-stone-800 hover:bg-stone-50">
                        <span className="truncate max-w-[280px]">
                          {i + 1}. {u.studentName}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          {u.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings / Errors */}
              {(importResult.unmatched.length > 0 || importResult.errors.length > 0 || importResult.skipped.length > 0) && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-[11px]">
                  <span className="font-bold text-stone-700 block">Catatan & Baris yang Dilewati:</span>
                  {importResult.skipped.length > 0 && (
                    <p className="text-stone-600">
                      • <strong>{importResult.skipped.length} santri dilewati</strong> karena kolom nilai kosong.
                    </p>
                  )}
                  {importResult.unmatched.map((msg, i) => (
                    <p key={`unmatched-${i}`} className="text-amber-700">• {msg}</p>
                  ))}
                  {importResult.errors.map((msg, i) => (
                    <p key={`err-${i}`} className="text-red-700">• {msg}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg transition"
              >
                Tutup
              </button>

              {sheetsUrl && importResult.success && (
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    handleSaveToSpreadsheet();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition"
                >
                  <Cloud size={14} />
                  <span>Simpan Nilai</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

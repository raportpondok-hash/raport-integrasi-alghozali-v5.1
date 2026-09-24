import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CalculatedStudent, Subject, SchoolConfig, ClassItem } from '../types';
import { getSubjectsForClass } from '../data/curriculumSubjects';
import { getWaliKelasForClass } from '../data/waliKelasDatabase';
import { INITIAL_CLASSES } from '../data/initialData';
import { toEasternArabicNumerals, numberToArabicWords, rankToArabicOrdinal } from './arabicNumbers';
import { generateModernExcel } from './excelModernStyler';
import { getSubjectAbbreviation, numberToIndonesianWords, getAfektifLetter } from './indonesianNumbers';

/**
 * Ekspor Rekapitulasi Nilai Seluruh Santri ke format Microsoft Excel (.xlsx) dengan Format & Border Modern
 */
export function exportRekapToExcel(
  students: CalculatedStudent[],
  subjects: Subject[],
  config: SchoolConfig,
  selectedClass?: ClassItem | null,
  classes?: ClassItem[]
) {
  const className = selectedClass ? selectedClass.nameLatin : config.classLatin || 'Semua Kelas';
  const classAr = selectedClass ? selectedClass.nameAr : config.classAr || '';
  const academicYear = config.academicYearLatin || '2026/2027';
  const officialWali =
    (selectedClass ? (selectedClass.waliKelasName || getWaliKelasForClass(selectedClass.id, classes)) : null) ||
    config.waliKelasName ||
    '-';

  const isFullDay = selectedClass?.schoolType === 'fullday' || config.schoolType === 'fullday' || (selectedClass?.id && selectedClass.id.includes('-fd'));

  if (isFullDay) {
    const isSmp = (selectedClass?.nameLatin || '').toLowerCase().includes('vii') ||
                  (selectedClass?.nameLatin || '').toLowerCase().includes('viii') ||
                  (selectedClass?.nameLatin || '').toLowerCase().includes('ix') ||
                  (selectedClass?.nameLatin || '').toLowerCase().includes('smp');
    const schoolTitle = isSmp ? 'SMP ISLAM AL-GHOZALI' : 'SMA ISLAM AL-GHOZALI';

    const tableHeaders: string[] = [
      'No',
      'Nama Siswa',
      'NIS',
      ...subjects.map((s) => getSubjectAbbreviation(s.nameId)),
      'Jumlah Nilai Total',
      'Rata-Rata',
      'Ranking',
      'Kerapihan',
      'Kedisiplinan',
      'Kejujuran',
      'Sakit',
      'Izin',
      'Alpa',
    ];

    const tableHeaderAligns: ('center' | 'left' | 'right')[] = [
      'center',
      'left',
      'center',
      ...subjects.map(() => 'center' as const),
      'center',
      'center',
      'center',
      'center',
      'center',
      'center',
      'center',
      'center',
      'center',
    ];

    const rows = students.map((s, idx) => {
      const scoreValues = subjects.map((sub) => s.scores[sub.id] ?? 0);
      return [
        idx + 1,
        s.name,
        s.nis || s.nisn || '-',
        ...scoreValues,
        s.totalScore,
        s.averageScore,
        s.rank,
        s.kepribadian?.kerapihan || 'A',
        s.kepribadian?.kedisiplinan || 'B',
        s.kepribadian?.kejujuran || 'A',
        s.absensi?.sakit ?? 0,
        s.absensi?.izin ?? 0,
        s.absensi?.alpa ?? 0,
      ];
    });

    const totalCount = students.length;
    const avgClass = totalCount > 0 ? Math.round(students.reduce((a, b) => a + b.averageScore, 0) / totalCount) : 0;

    const summaryRows = [
      {
        label: 'Rata-Rata Kelas',
        values: {
          1: `Rata-rata Kelas: ${avgClass}`,
          [3 + subjects.length]: students.reduce((a, b) => a + b.totalScore, 0),
          [4 + subjects.length]: avgClass,
        },
      },
    ];

    const colWidths = [
      6,
      32,
      14,
      ...subjects.map(() => 14),
      16,
      14,
      12,
      12,
      14,
      12,
      10,
      10,
      10,
    ];

    generateModernExcel({
      sheetName: 'Rekap Nilai Siswa',
      bannerTitle: 'REKAPITULASI NILAI PESERTA DIDIK',
      subtitle: `ASESMEN TENGAH SEMESTER GANJIL - ${schoolTitle} - ${className.toUpperCase()}`,
      metaRows: [
        { label: 'Sekolah:', value: schoolTitle, labelCol: 0, valueCol: 1 },
        { label: 'Kelas:', value: className, labelCol: 0, valueCol: 1 },
        { label: 'Tahun Pelajaran:', value: academicYear, labelCol: 0, valueCol: 1 },
        { label: 'Wali Kelas:', value: officialWali, labelCol: 0, valueCol: 1 },
        { label: 'Tanggal Unduh:', value: new Date().toLocaleDateString('id-ID'), labelCol: 0, valueCol: 1 },
      ],
      tableHeaders,
      tableHeaderAligns,
      rows,
      summaryRows,
      colWidths,
      signatureInfo: {
        placeAndDate: `Ditetapkan di: Gunungsindur, ${new Date().toLocaleDateString('id-ID')}`,
        waliKelasTitle: 'Wali Kelas',
        pimpinanTitle: isSmp ? 'Kepala SMP Islam Al-Ghozali' : 'Kepala SMA Islam Al-Ghozali',
        pimpinanName: isSmp
          ? (config.kepalaSekolahSmpName || (config.kepalaSekolahName && !config.kepalaSekolahName.includes('Antoni') && config.kepalaSekolahName !== 'Kepala SMP' ? config.kepalaSekolahName : 'ISWAHYUDIN, SE'))
          : (config.kepalaSekolahName || 'Antoni Firdaus, M.Pd.'),
      },
      fileName: `Rekapitulasi_Nilai_${className.replace(/[^a-zA-Z0-9_-]/g, '_')}_${academicYear.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`,
    });
    return;
  }


  const tableHeaders: string[] = [
    'No',
    'NISN',
    'Nama Lengkap Santri',
    ...subjects.map((s) => s.nameId),
    'Total Nilai',
    'Rata-rata',
    'Peringkat',
    'Peringkat Arab',
    'Status',
  ];

  const tableHeaderAligns: ('center' | 'left' | 'right')[] = [
    'center',
    'center',
    'left',
    ...subjects.map(() => 'center' as const),
    'center',
    'center',
    'center',
    'right',
    'center',
  ];

  const rows = students.map((s, idx) => {
    const scoreValues = subjects.map((sub) => s.scores[sub.id] ?? 0);
    const isTuntas = s.averageScore >= 60;

    return [
      idx + 1,
      s.nisn || '-',
      s.name,
      ...scoreValues,
      s.totalScore,
      s.averageScore,
      `#${s.rank}`,
      rankToArabicOrdinal(s.rank),
      isTuntas ? 'Tuntas' : 'Remidi',
    ];
  });

  const totalCount = students.length;
  const avgClass = totalCount > 0 ? Math.round(students.reduce((a, b) => a + b.averageScore, 0) / totalCount) : 0;
  const tuntasCount = students.filter((s) => s.averageScore >= 60).length;

  const summaryRows = [
    {
      label: 'Rata-Rata Kelas',
      values: {
        2: `Rata-rata Kelas: ${avgClass}`,
        [3 + subjects.length]: students.reduce((a, b) => a + b.totalScore, 0),
        [4 + subjects.length]: avgClass,
        [6 + subjects.length]: `${tuntasCount}/${totalCount} Tuntas (${Math.round((tuntasCount / (totalCount || 1)) * 100)}%)`,
      },
    },
  ];

  const colWidths = [
    6,
    16,
    32,
    ...subjects.map(() => 16),
    14,
    14,
    14,
    18,
    16,
  ];

  generateModernExcel({
    sheetName: 'Rekap Nilai',
    bannerTitle: 'PESANTREN AL-GHOZALI GUNUNG SINDUR BOGOR',
    subtitle: `REKAPITULASI HASIL UJIAN SANTRI (KASYFUD DARAJAT / كَشْفُ الدَّرَجَاتِ) - ${className.toUpperCase()}`,
    metaRows: [
      { label: 'Kelas:', value: `${className} (${classAr})`, labelCol: 0, valueCol: 1 },
      { label: 'Tahun Ajaran:', value: `${academicYear} (${config.academicYearAr || ''})`, labelCol: 0, valueCol: 1 },
      { label: 'Wali Kelas:', value: officialWali, labelCol: 0, valueCol: 1 },
      { label: 'Tanggal Unduh:', value: new Date().toLocaleDateString('id-ID'), labelCol: 0, valueCol: 1 },
    ],
    tableHeaders,
    tableHeaderAligns,
    rows,
    summaryRows,
    colWidths,
    signatureInfo: {
      placeAndDate: `Ditetapkan di: ${config.placeNameLatin || 'Gunung Sindur'}, ${config.dateMasehi || ''}`,
      waliKelasTitle: 'Wali Kelas',
      waliKelasName: officialWali,
      pimpinanTitle: 'Pimpinan Pesantren',
      pimpinanName: config.direkturName || 'H. Ahmad Syaikhu, Lc.',
    },
    fileName: `Rekapitulasi_Nilai_${className.replace(/[^a-zA-Z0-9_-]/g, '_')}_${academicYear.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`,
  });
}

/**
 * Ekspor Lembar Raport Santri Individu ke format Excel (.xlsx) dengan Format & Border Modern
 */
export function exportSingleRaportToExcel(
  student: CalculatedStudent,
  subjects: Subject[],
  config: SchoolConfig,
  classes?: ClassItem[]
) {
  const effectiveSubjects = student.classId ? getSubjectsForClass(student.classId) : subjects;
  const classInfo = student.classId
    ? ((classes || []).find((c) => c.id === student.classId) ||
       INITIAL_CLASSES.find((c) => c.id === student.classId) ||
       (classes || []).find((c) => c.id.toLowerCase() === student.classId.toLowerCase()) ||
       INITIAL_CLASSES.find((c) => c.id.toLowerCase() === student.classId.toLowerCase()))
    : undefined;

  const officialWali =
    classInfo?.waliKelasName ||
    (student.classId ? getWaliKelasForClass(student.classId, classes) : null) ||
    config.waliKelasName ||
    '-';

  const classNameLatin = classInfo?.nameLatin || config.classLatin || student.classId || '';
  const classNameAr = classInfo?.nameAr || config.classAr || '';
  const academicYear = config.academicYearLatin || '2026/2027';

  const isFullDay = classInfo?.schoolType === 'fullday' || config.schoolType === 'fullday' || (student.classId && student.classId.includes('-fd'));

  if (isFullDay) {
    const isSmp = classNameLatin.toLowerCase().includes('vii') ||
                  classNameLatin.toLowerCase().includes('viii') ||
                  classNameLatin.toLowerCase().includes('ix') ||
                  classNameLatin.toLowerCase().includes('smp');
    const schoolTitle = isSmp ? 'SMP ISLAM AL-GHOZALI' : 'SMA ISLAM AL-GHOZALI';

    const tableHeaders = [
      'No',
      'Mata Pelajaran',
      'KKM',
      'Nilai Angka',
      'Terbilang',
      'Afektif',
    ];

    const tableHeaderAligns: ('center' | 'left' | 'right')[] = [
      'center',
      'left',
      'center',
      'center',
      'left',
      'center',
    ];

    const rows = effectiveSubjects.map((sub, idx) => {
      const score = student.scores[sub.id] ?? 0;
      const kkm = sub.kkm || 70;
      return [
        idx + 1,
        sub.nameId,
        kkm,
        score,
        numberToIndonesianWords(score),
        getAfektifLetter(score),
      ];
    });

    const summaryRows = [
      {
        label: 'Total Nilai',
        values: {
          1: `Nilai Rata-rata: ${student.averageScore} | Peringkat: #${student.rank}`,
          3: student.totalScore,
        },
      },
    ];

    generateModernExcel({
      sheetName: 'Raport Siswa',
      bannerTitle: 'YAYASAN PESANTREN ISLAM AL-GHOZALI',
      subtitle: `LAPORAN HASIL ASESMEN TENGAH SEMESTER GANJIL - ${schoolTitle}`,
      metaRows: [
        { label: 'Nama Peserta Didik:', value: student.name, labelCol: 0, valueCol: 1 },
        { label: 'NIS / NISN:', value: `${student.nis || '-'} / ${student.nisn || '-'}`, labelCol: 0, valueCol: 1 },
        { label: 'Kelas / Program:', value: `${classNameLatin} / ${student.jurusan || 'Umum'}`, labelCol: 0, valueCol: 1 },
        { label: 'Semester / TP:', value: `Ganjil / ${academicYear}`, labelCol: 0, valueCol: 1 },
        { label: 'Wali Kelas:', value: officialWali, labelCol: 0, valueCol: 1 },
      ],
      tableHeaders,
      tableHeaderAligns,
      rows,
      summaryRows,
      colWidths: [6, 32, 10, 14, 28, 12],
      signatureInfo: {
        placeAndDate: `Gunungsindur, ${new Date().toLocaleDateString('id-ID')}`,
        waliKelasTitle: 'Wali Kelas',
        pimpinanTitle: isSmp ? 'Kepala SMP Islam Al-Ghozali' : 'Kepala SMA Islam Al-Ghozali',
        pimpinanName: isSmp
          ? (config.kepalaSekolahSmpName || (config.kepalaSekolahName && !config.kepalaSekolahName.includes('Antoni') && config.kepalaSekolahName !== 'Kepala SMP' ? config.kepalaSekolahName : 'ISWAHYUDIN, SE'))
          : (config.kepalaSekolahName || 'Antoni Firdaus, M.Pd.'),
      },
      fileName: `Raport_${student.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${classNameLatin.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`,
    });
    return;
  }

  const tableHeaders = [
    'No',
    'المواد الدراسية (Mapel Arab)',
    'Mata Pelajaran (Indonesia)',
    'Nilai Angka',
    'Angka Arab',
    'Terbilang Arab (Tafqit)',
    'Nilai Maks',
    'Predikat',
  ];

  const tableHeaderAligns: ('center' | 'left' | 'right')[] = [
    'center',
    'right',
    'left',
    'center',
    'center',
    'right',
    'center',
    'center',
  ];

  const rows = effectiveSubjects.map((sub, idx) => {
    const score = student.scores[sub.id] ?? 0;
    let predikat = 'Maqbul';
    if (score >= 90) predikat = 'Mumtaz (A+)';
    else if (score >= 80) predikat = 'Jayyid Jiddan (A)';
    else if (score >= 70) predikat = 'Jayyid (B)';
    else if (score >= 60) predikat = 'Maqbul (C)';
    else predikat = 'Rasib / Dhoif (D)';

    return [
      idx + 1,
      sub.nameAr,
      sub.nameId,
      score,
      toEasternArabicNumerals(score),
      numberToArabicWords(score),
      100,
      predikat,
    ];
  });

  const summaryRows = [
    {
      label: 'المجموع / Total Nilai',
      values: {
        2: `Nilai Rata-rata: ${student.averageScore}`,
        3: student.totalScore,
        4: toEasternArabicNumerals(student.totalScore),
        7: `Peringkat #${student.rank}`,
      },
    },
    {
      label: 'النتيجة المعدلة / Nilai Rata-rata',
      values: {
        2: `Peringkat (Arab): ${rankToArabicOrdinal(student.rank)}`,
        3: student.averageScore,
        4: toEasternArabicNumerals(student.averageScore),
        7: student.averageScore >= 60 ? 'Tuntas' : 'Remidi',
      },
    },
  ];

  const colWidths = [6, 26, 30, 14, 14, 28, 12, 20];

  generateModernExcel({
    sheetName: 'Raport Santri',
    bannerTitle: 'PESANTREN AL-GHOZALI GUNUNG SINDUR BOGOR',
    subtitle: 'KASYFUD DARAJAT (كَشْفُ الدَّرَجَاتِ) - KARTU HASIL UJIAN SANTRI',
    metaRows: [
      { label: 'Nama Santri (الاسم كامل):', value: student.name, labelCol: 0, valueCol: 1 },
      { label: 'Kelas (الصّفّ):', value: `${classNameLatin} (${classNameAr})`, labelCol: 0, valueCol: 1 },
      { label: 'NISN (الرقم):', value: student.nisn || '-', labelCol: 0, valueCol: 1 },
      { label: 'Tahun Ajaran (العام الدّراسي):', value: `${academicYear} (${config.academicYearAr || ''})`, labelCol: 0, valueCol: 1 },
      { label: 'Wali Kelas (ولي الفصل):', value: officialWali, labelCol: 0, valueCol: 1 },
      { label: 'Pimpinan (مدير المعهد):', value: config.direkturName || 'H. Ahmad Syaikhu, Lc.', labelCol: 0, valueCol: 1 },
    ],
    tableHeaders,
    tableHeaderAligns,
    rows,
    summaryRows,
    colWidths,
    signatureInfo: {
      placeAndDate: `Ditetapkan di: ${config.placeNameLatin || 'Gunung Sindur'}, ${config.dateMasehi || ''} / ${config.dateHijri || ''}`,
      waliKelasTitle: 'Wali Kelas (ولي الفصل)',
      waliKelasName: officialWali,
      pimpinanTitle: 'Pimpinan (مدير المعهد)',
      pimpinanName: config.direkturName || 'H. Ahmad Syaikhu, Lc.',
    },
    fileName: `Raport_${student.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(config.classLatin || 'Kelas').replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`,
  });
}

/**
 * Convert OKLCH color (L C H [/ A]) to standard sRGB rgb/rgba string.
 * This completely prevents html2canvas from crashing on unsupported oklch color functions.
 */
function oklchToRgb(lStr: string, cStr: string, hStr: string, aStr?: string): string {
  try {
    let L = parseFloat(lStr);
    if (lStr.includes('%')) L = L / 100;
    if (isNaN(L)) L = 0.5;

    let C = parseFloat(cStr);
    if (cStr.includes('%')) C = (C / 100) * 0.4;
    if (isNaN(C)) C = 0;

    let H = parseFloat(hStr);
    if (hStr.includes('rad')) H = (H * 180) / Math.PI;
    if (hStr.includes('turn')) H = H * 360;
    if (isNaN(H)) H = 0;

    let A = 1;
    if (aStr !== undefined && aStr.trim() !== '') {
      const cleanA = aStr.replace('/', '').trim();
      A = parseFloat(cleanA);
      if (cleanA.includes('%')) A = A / 100;
      if (isNaN(A)) A = 1;
    }

    const hRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    const gamma = (v: number) =>
      v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;

    const R = Math.round(Math.min(255, Math.max(0, gamma(rLinear) * 255)));
    const G = Math.round(Math.min(255, Math.max(0, gamma(gLinear) * 255)));
    const B = Math.round(Math.min(255, Math.max(0, gamma(bLinear) * 255)));

    if (A < 0.999) {
      return `rgba(${R}, ${G}, ${B}, ${parseFloat(A.toFixed(3))})`;
    }
    return `rgb(${R}, ${G}, ${B})`;
  } catch {
    return '#15803d';
  }
}

/**
 * Convert OKLAB color (L a b [/ A]) to standard sRGB rgb/rgba string.
 */
function oklabToRgb(lStr: string, aStrVal: string, bStrVal: string, alphaStr?: string): string {
  try {
    let L = parseFloat(lStr);
    if (lStr.includes('%')) L = L / 100;
    if (isNaN(L)) L = 0.5;

    let a = parseFloat(aStrVal);
    if (aStrVal.includes('%')) a = (a / 100) * 0.4;
    if (isNaN(a)) a = 0;

    let b = parseFloat(bStrVal);
    if (bStrVal.includes('%')) b = (b / 100) * 0.4;
    if (isNaN(b)) b = 0;

    let A = 1;
    if (alphaStr !== undefined && alphaStr.trim() !== '') {
      const cleanA = alphaStr.replace('/', '').trim();
      A = parseFloat(cleanA);
      if (cleanA.includes('%')) A = A / 100;
      if (isNaN(A)) A = 1;
    }

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    const gamma = (v: number) =>
      v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;

    const R = Math.round(Math.min(255, Math.max(0, gamma(rLinear) * 255)));
    const G = Math.round(Math.min(255, Math.max(0, gamma(gLinear) * 255)));
    const B = Math.round(Math.min(255, Math.max(0, gamma(bLinear) * 255)));

    if (A < 0.999) {
      return `rgba(${R}, ${G}, ${B}, ${parseFloat(A.toFixed(3))})`;
    }
    return `rgb(${R}, ${G}, ${B})`;
  } catch {
    return '#15803d';
  }
}

// Ensure html2canvas never hangs on document.fonts.ready in offscreen/hidden iframes in Chromium
if (typeof window !== 'undefined' && typeof Document !== 'undefined') {
  try {
    const fontsDesc =
      Object.getOwnPropertyDescriptor(Document.prototype, 'fonts') ||
      Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'fonts');
    if (fontsDesc && fontsDesc.get) {
      const origGet = fontsDesc.get;
      Object.defineProperty(Document.prototype, 'fonts', {
        configurable: true,
        enumerable: true,
        get() {
          const fonts = origGet.call(this);
          // If this document is an iframe document (e.g. html2canvas cloned iframe)
          if (this !== window.document && fonts) {
            return new Proxy(fonts, {
              get(target, prop, receiver) {
                if (prop === 'ready') {
                  // Instant resolve! Never hangs in detached / offscreen iframes!
                  return Promise.resolve(target);
                }
                const val = Reflect.get(target, prop, receiver);
                return typeof val === 'function' ? val.bind(target) : val;
              },
            });
          }
          return fonts;
        },
      });
    }
  } catch (e) {
    console.warn('Could not patch Document.prototype.fonts for iframes:', e);
  }
}

/**
 * Replaces all modern CSS color functions (oklch, oklab, lab, lch, color, color-mix)
 * from any string of CSS or attribute values.
 */
function replaceModernColors(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') return '';
  // Fast bail out: if the string does not contain any modern color function, return as is
  if (!/(?:oklch|oklab|color-mix|color\(|lab\(|lch\()/i.test(cssText)) {
    return cssText;
  }

  // 1. Convert OKLCH: oklch(L C H [/ A])
  let result = cssText.replace(
    /oklch\s*\(\s*([^,\s/)]+)\s+([^,\s/)]+)\s+([^,\s/)]+)(?:\s*(?:\/|,)\s*([^)]+))?\s*\)/gi,
    (_match, l, c, h, a) => oklchToRgb(l, c, h, a)
  );

  // 2. Convert OKLAB: oklab(L a b [/ A])
  result = result.replace(
    /oklab\s*\(\s*([^,\s/)]+)\s+([^,\s/)]+)\s+([^,\s/)]+)(?:\s*(?:\/|,)\s*([^)]+))?\s*\)/gi,
    (_match, l, aVal, bVal, alpha) => oklabToRgb(l, aVal, bVal, alpha)
  );

  // 3. Fallback for any other modern color functions (color, color-mix, lab, lch) - safe O(N) regex without nested quantifiers
  result = result.replace(/(?:lab|lch|color-mix|color)\s*\([^)]*\)/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower.includes('emerald') || lower.includes('green') || lower.includes('166534')) {
      return '#166534';
    }
    if (lower.includes('white') || lower.includes('0.9') || lower.includes('255')) {
      return '#ffffff';
    }
    if (lower.includes('gray') || lower.includes('stone') || lower.includes('slate')) {
      return '#374151';
    }
    return '#1c1917';
  });

  // 4. Absolute safety catch: eliminate any stray oklch or oklab calls
  result = result.replace(/oklch\s*\([^)]*\)/gi, '#166534');
  result = result.replace(/oklab\s*\([^)]*\)/gi, '#166534');

  return result;
}

/**
 * Helper to safely convert modern CSS color functions
 * into standard HEX/RGB colors compatible with html2canvas.
 */
function convertToRgbOrHex(cssColorStr: string): string {
  if (!cssColorStr || typeof cssColorStr !== 'string') return cssColorStr;
  return replaceModernColors(cssColorStr);
}

let fontsLoadedPromise: Promise<void> | null = null;

/**
 * Preloads and caches Arabic and Latin fonts once globally
 */
export async function preloadApplicationFonts(): Promise<void> {
  if (fontsLoadedPromise) return fontsLoadedPromise;

  fontsLoadedPromise = (async () => {
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        const fontsToLoad = [
          '400 11px Amiri',
          '600 11px Amiri',
          '700 11px Amiri',
          '700 12px Amiri',
          '700 13px Amiri',
          '700 14px Amiri',
          '700 16px Amiri',
          '700 28px Amiri',
          '400 11px "Plus Jakarta Sans"',
          '600 11px "Plus Jakarta Sans"',
          '700 11px "Plus Jakarta Sans"',
          '700 12px "Plus Jakarta Sans"',
          '400 12px "Scheherazade New"',
          '700 12px "Scheherazade New"',
          '700 14px "Scheherazade New"',
        ];
        await Promise.allSettled(
          fontsToLoad.map((f) =>
            document.fonts.load(f, 'كَشْفُ الدَّرَجَاتِ المواد الدّراسيّة بالحروف بالأرقام عربي 1234567890 INDONESIA ARAB')
          )
        );
        await document.fonts.ready;
      } catch {
        // ignore
      }
    }
  })();

  return fontsLoadedPromise;
}

/**
 * Wait for all document fonts, images, and layout stabilization before capturing
 */
export async function waitForAssetsToLoad(element: HTMLElement): Promise<void> {
  // 1. Ensure fonts are loaded once globally (cached, instantaneous on subsequent calls)
  await preloadApplicationFonts();

  // 2. Wait for all images inside container to be fully loaded
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 300); // safety fallback
        });
      })
    );
  }

  // 3. Small RAF pause to ensure browser layout and CSS are completely painted
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/**
 * Sanitizes all stylesheets and DOM elements in cloned document for html2canvas
 * to prevent crash on modern CSS color functions, preserve Arabic & Latin fonts,
 * and lock exact A4 layout dimensions without distorting metrics.
 */
export function sanitizeClonedDocumentForHtml2Canvas(clonedDoc: Document, clonedEl: HTMLElement): void {
  // 1. Copy already loaded FontFace instances from parent document to clonedDoc with isolated try/catch per font
  if (typeof document !== 'undefined' && document.fonts && clonedDoc.fonts) {
    document.fonts.forEach((font) => {
      try {
        clonedDoc.fonts.add(font);
      } catch {
        // Font might already belong to document FontFaceSet or be restricted
      }
    });
  }

  // Add explicit font-family utility styles without blocking @import network calls
  try {
    const customFontStyle = clonedDoc.createElement('style');
    customFontStyle.textContent = `
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #ffffff !important;
        overflow: hidden !important;
      }
      .font-arabic, [dir="rtl"] {
        font-family: 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif !important;
        letter-spacing: normal !important;
      }
      .font-sans {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
      }
      .report-grade-table, .report-custom-table {
        border-collapse: collapse !important;
        border-spacing: 0 !important;
        width: 100% !important;
        table-layout: fixed !important;
      }
      .report-grade-table th, 
      .report-grade-table td,
      .report-custom-table th,
      .report-custom-table td {
        vertical-align: middle !important;
        box-sizing: border-box !important;
        border: 0.75px solid #1f2937 !important;
        padding: 0 !important;
      }
      .report-custom-table th {
        background-color: #f2f2f2 !important;
      }
      .report-custom-table th > div,
      .report-custom-table td > div {
        display: flex !important;
        align-items: center !important;
        box-sizing: border-box !important;
        line-height: normal !important;
      }
      .report-grade-table .arabic-cell,
      .report-custom-table .text-ar {
        font-family: 'Traditional Arabic', 'Amiri', 'Scheherazade New', serif !important;
        font-weight: 700 !important;
      }
      .report-custom-table .text-lat {
        font-family: 'Times New Roman', Arial, sans-serif !important;
      }
      .report-grade-table .score-word {
        text-align: center !important;
        font-weight: 700 !important;
      }
    `;
    clonedDoc.head.appendChild(customFontStyle);
  } catch {
    // ignore
  }

  // 2. Sanitize all <style> elements by replacing all oklab/oklch/color(...) with rgb/hex
  clonedDoc.querySelectorAll('style').forEach((styleEl) => {
    if (styleEl.textContent && /(?:oklch|oklab|color-mix|color\(|lab\(|lch\()/i.test(styleEl.textContent)) {
      try {
        styleEl.textContent = replaceModernColors(styleEl.textContent);
      } catch {
        // ignore
      }
    }
  });

  // 3. Remove all external stylesheets to eliminate network handshakes inside iframe (fonts already loaded globally)
  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => {
    try {
      const href = linkEl.getAttribute('href') || '';
      if (href.startsWith('http')) {
        linkEl.parentNode?.removeChild(linkEl);
      }
    } catch {
      // ignore
    }
  });

  // 4. Ensure cloned element is the ONLY element in clonedDoc.body, locked to exact F4 dimensions (794px x 1248px)
  if (clonedEl && clonedDoc.body) {
    // Force all scroll positions in cloned document to exact (0, 0)
    if (clonedDoc.defaultView) {
      try {
        clonedDoc.defaultView.scrollTo(0, 0);
      } catch {
        // ignore
      }
    }
    if (clonedDoc.documentElement) {
      clonedDoc.documentElement.scrollTop = 0;
      clonedDoc.documentElement.scrollLeft = 0;
      clonedDoc.documentElement.style.margin = '0';
      clonedDoc.documentElement.style.padding = '0';
      clonedDoc.documentElement.style.overflow = 'hidden';
      clonedDoc.documentElement.style.width = '794px';
      clonedDoc.documentElement.style.height = '1248px';
    }
    if (clonedDoc.body) {
      clonedDoc.body.scrollTop = 0;
      clonedDoc.body.scrollLeft = 0;
    }

    // Safely detach clonedEl from its parent before clearing the rest of clonedDoc.body
    if (clonedEl.parentNode) {
      clonedEl.parentNode.removeChild(clonedEl);
    }
    clonedDoc.body.innerHTML = '';

    clonedDoc.body.style.margin = '0';
    clonedDoc.body.style.padding = '0';
    clonedDoc.body.style.backgroundColor = '#ffffff';
    clonedDoc.body.style.width = '794px';
    clonedDoc.body.style.minWidth = '794px';
    clonedDoc.body.style.maxWidth = '794px';
    clonedDoc.body.style.height = '1248px';
    clonedDoc.body.style.minHeight = '1248px';
    clonedDoc.body.style.maxHeight = '1248px';
    clonedDoc.body.style.overflow = 'hidden';
    clonedDoc.body.style.position = 'relative';

    clonedEl.style.boxShadow = 'none';
    clonedEl.style.borderRadius = '0';
    clonedEl.style.backgroundColor = '#ffffff';
    clonedEl.style.color = '#1c1917';
    clonedEl.style.transform = 'none';
    clonedEl.style.width = '794px';
    clonedEl.style.height = '1248px';
    clonedEl.style.minWidth = '794px';
    clonedEl.style.minHeight = '1248px';
    clonedEl.style.maxWidth = '794px';
    clonedEl.style.maxHeight = '1248px';
    clonedEl.style.margin = '0';
    clonedEl.style.padding = '0';
    clonedEl.style.boxSizing = 'border-box';
    clonedEl.style.position = 'absolute';
    clonedEl.style.top = '0';
    clonedEl.style.left = '0';

    // WATER-TIGHT PURGE: Remove all editing controls, toolbars, buttons, handles, and no-print elements
    clonedEl.querySelectorAll('.no-print, .excel-table-toolbar, [data-editing-control], button, [title*="Geser batas"]').forEach((el) => {
      el.parentNode?.removeChild(el);
    });

    // Replace any active inline score inputs with their text value
    clonedEl.querySelectorAll('input').forEach((inputEl) => {
      const textVal = inputEl.value || '';
      const textNode = clonedDoc.createTextNode(textVal);
      inputEl.parentNode?.replaceChild(textNode, inputEl);
    });

    // Clean up all selection highlights, outlines, and cursor styles
    clonedEl.querySelectorAll('.col-selected-cell, .col-selected-th').forEach((el) => {
      el.classList.remove('col-selected-cell', 'col-selected-th');
      (el as HTMLElement).style.boxShadow = 'none';
      (el as HTMLElement).style.backgroundColor = '';
    });

    clonedEl.querySelectorAll('*').forEach((node) => {
      const el = node as HTMLElement;
      if (el.style) {
        el.style.cursor = 'default';
        el.style.outline = el.classList.contains('frame-container') ? el.style.outline : 'none';
      }
    });

    clonedDoc.body.appendChild(clonedEl);

    // Normalize all table cells to exact pixel heights and guarantee middle alignment
    clonedEl.querySelectorAll('.report-custom-table th, .report-custom-table td').forEach((cellNode) => {
      const cell = cellNode as HTMLElement;
      cell.style.padding = '0';
      cell.style.verticalAlign = 'middle';
      cell.style.boxSizing = 'border-box';
      cell.style.borderColor = '#1f2937';

      const childDiv = cell.querySelector(':scope > div') as HTMLElement | null;
      if (childDiv) {
        const rowH = cell.offsetHeight || parseFloat(cell.style.height) || 22;
        childDiv.style.height = `${rowH}px`;
        childDiv.style.minHeight = `${rowH}px`;
        childDiv.style.maxHeight = 'none';
        childDiv.style.display = 'flex';
        childDiv.style.alignItems = 'center';
        childDiv.style.boxSizing = 'border-box';
        childDiv.style.lineHeight = 'normal';
        childDiv.style.paddingTop = '2px';
        childDiv.style.paddingBottom = '2px';
        childDiv.style.whiteSpace = 'normal';
        childDiv.style.wordBreak = 'break-word';
      }
    });

    // Enforce LTR and isolate on all Latin signature names to prevent RTL punctuation flipping
    clonedEl.querySelectorAll('[dir="ltr"]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.direction = 'ltr';
      htmlEl.style.unicodeBidi = 'isolate';
    });
  }

  // 5. Fast sanitize inline style attributes only (no expensive getComputedStyle reflow)
  const targetElements = clonedEl
    ? [clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))]
    : Array.from(clonedDoc.querySelectorAll('*'));

  targetElements.forEach((node) => {
    const el = node as HTMLElement;
    if (!el || !el.getAttribute) return;
    const styleAttr = el.getAttribute('style');
    if (styleAttr && /(?:oklab|oklch|lab|lch|color|color-mix)\s*\(/i.test(styleAttr)) {
      el.setAttribute('style', replaceModernColors(styleAttr));
    }
  });
}

/**
 * Ekspor Raport Santri ke format PDF Resolusi Tinggi (Standar F4 / Folio 210mm x 330mm)
 */
export async function exportRaportToPdf(
  element: HTMLElement | null,
  fileName: string = 'Raport_Santri.pdf'
): Promise<boolean> {
  if (!element) return false;

  const prevScrollX = window.scrollX || window.pageXOffset || 0;
  const prevScrollY = window.scrollY || window.pageYOffset || 0;

  try {
    // 1. Reset parent window scroll so element has clean 0-based offset
    window.scrollTo(0, 0);

    // 2. Wait for fonts, images, and layout stabilization
    await waitForAssetsToLoad(element);

    // 3. Capture element in fixed dimensions matching exact F4 (210mm x 330mm -> 794px x 1248px)
    const canvas = await html2canvas(element, {
      scale: 3, // 3x High resolution (2382px x 3744px) for razor-sharp vector-like print quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1248,
      windowWidth: 794,
      windowHeight: 1248,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedEl) => {
        sanitizeClonedDocumentForHtml2Canvas(clonedDoc, clonedEl);
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 330],
      compress: true,
    });

    // Fit canvas exactly to F4 (210mm x 330mm) with 0 margin
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      210,
      330
    );

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Failed to export PDF:', err);
    return false;
  } finally {
    // Restore parent window scroll
    window.scrollTo(prevScrollX, prevScrollY);
  }
}

/**
 * Ekspor Raport Santri ke format Gambar PNG / JPG Resolusi Tinggi (F4 210mm x 330mm)
 */
export async function exportRaportToImage(
  element: HTMLElement | null,
  fileName: string = 'Raport_Santri.png',
  format: 'png' | 'jpeg' = 'png'
): Promise<boolean> {
  if (!element) return false;

  const prevScrollX = window.scrollX || window.pageXOffset || 0;
  const prevScrollY = window.scrollY || window.pageYOffset || 0;

  try {
    // 1. Reset parent window scroll so element has clean 0-based offset
    window.scrollTo(0, 0);

    // 2. Wait for fonts, images, and layout stabilization
    await waitForAssetsToLoad(element);

    // 3. Capture element in fixed dimensions matching exact F4 794px x 1248px
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1248,
      windowWidth: 794,
      windowHeight: 1248,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedEl) => {
        sanitizeClonedDocumentForHtml2Canvas(clonedDoc, clonedEl);
      },
    });

    const imageType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(imageType, 0.98);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName.endsWith(`.${format}`) ? fileName : `${fileName}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to export Image:', err);
    return false;
  } finally {
    // Restore parent window scroll
    window.scrollTo(prevScrollX, prevScrollY);
  }
}

/**
 * Ekspor Raport Santri ke format Microsoft Word (.doc) yang 100% identik dengan tampilan sertifikat
 */
export function exportRaportToWord(
  student: CalculatedStudent,
  subjects: Subject[],
  config: SchoolConfig,
  classes?: ClassItem[]
) {
  const effectiveSubjects = student.classId ? getSubjectsForClass(student.classId) : subjects;
  const classInfo = student.classId
    ? ((classes || []).find((c) => c.id === student.classId) ||
       INITIAL_CLASSES.find((c) => c.id === student.classId) ||
       (classes || []).find((c) => c.id.toLowerCase() === student.classId.toLowerCase()) ||
       INITIAL_CLASSES.find((c) => c.id.toLowerCase() === student.classId.toLowerCase()))
    : undefined;

  const officialWali =
    classInfo?.waliKelasName ||
    (student.classId ? getWaliKelasForClass(student.classId, classes) : null) ||
    config.waliKelasName ||
    '-';

  const classNameLatin = classInfo?.nameLatin || config.classLatin || 'Kelas';
  const classNameAr = classInfo?.nameAr || config.classAr || 'الأول التكثيفي - A';

  const academicYearFormatted = config.academicYearAr || 
    (config.academicYearLatin 
      ? `${toEasternArabicNumerals(config.academicYearLatin.split('-')[0] || '')} / ${toEasternArabicNumerals(config.academicYearLatin.split('-')[1] || '')}`
      : '٢٠٢٥ / ٢٠٢٦');

  // Render 5-column rows matching user's template exactly
  const rowsHtml = effectiveSubjects.map((sub, index) => {
    const rawScore = student.scores[sub.id];
    const score = typeof rawScore === 'number' && !isNaN(rawScore) ? rawScore : 0;
    const arabicWords = numberToArabicWords(score);

    return `
      <tr style="height: 22px;">
        <td style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-family: 'Times New Roman', Times, serif; font-weight: bold; font-size: 11pt;">
          ${index + 1}
        </td>
        <td style="border: 1px solid #000; padding: 3px 6px; text-align: right; font-family: 'Traditional Arabic', 'Amiri', serif; font-weight: bold; font-size: 13pt;">
          ${sub.nameAr}
        </td>
        <td style="border: 1px solid #000; padding: 3px 6px; text-align: left; font-family: 'Times New Roman', Times, serif; font-size: 10.5pt;">
          ${sub.nameId}
        </td>
        <td style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-family: 'Times New Roman', Times, serif; font-weight: bold; font-size: 11.5pt;">
          ${score}
        </td>
        <td style="border: 1px solid #000; padding: 3px 6px; text-align: center; font-family: 'Traditional Arabic', 'Amiri', serif; font-weight: bold; font-size: 12.5pt;">
          ${arabicWords}
        </td>
      </tr>
    `;
  }).join('');

  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Raport_${student.name}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 210mm 330mm; /* Standar F4 / Folio Pesantren */
          margin: 12mm 15mm 12mm 15mm;
          mso-header-margin: 10mm;
          mso-footer-margin: 10mm;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
        }
        body {
          font-family: 'Traditional Arabic', 'Amiri', 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.15;
          margin: 0;
          padding: 0;
          direction: rtl;
          text-align: right;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        .header-title {
          font-size: 22pt;
          font-weight: bold;
          font-family: 'Traditional Arabic', 'Amiri', serif;
          margin: 0;
          color: #1b4d2e;
        }
        .header-sub {
          font-size: 13.5pt;
          font-family: 'Traditional Arabic', 'Amiri', serif;
          margin: 2px 0 0 0;
          margin-bottom: 8px;
          color: #000000;
        }
      </style>
    </head>
    <body dir="rtl">
      <div class="Section1">
        <!-- Dual Pentagonal Header with Arabic Calligraphy -->
        <table style="width: 100%; margin-bottom: 6px; border: none;">
          <tr>
            <td style="width: 15%; text-align: right; vertical-align: middle;">
              <div style="width: 55px; height: 55px; border: 2px solid #1b4d2e; border-radius: 8px; text-align: center; line-height: 50px; font-weight: bold; color: #1b4d2e; font-size: 8pt;">
                AL-GHOZALI
              </div>
            </td>
            <td style="width: 70%; text-align: center; vertical-align: middle;">
              <p class="header-title">كشف الدرجات</p>
              <p class="header-sub">${!config.subTitleAr || config.subTitleAr.includes('لتقييم منتصف') ? 'للامتحان التحريري للفصل الدراسي الأول' : config.subTitleAr}</p>
            </td>
            <td style="width: 15%; text-align: left; vertical-align: middle;">
              <div style="width: 55px; height: 55px; border: 2px solid #1b4d2e; border-radius: 8px; text-align: center; line-height: 50px; font-weight: bold; color: #1b4d2e; font-size: 8pt;">
                AL-GHOZALI
              </div>
            </td>
          </tr>
        </table>

        <!-- Student & Academic Info Header Block (2 Baris Presisi Sesuai Template) -->
        <table style="width: 100%; margin-bottom: 8px; padding: 4px 0; font-size: 12pt; font-weight: bold; font-family: 'Traditional Arabic', 'Amiri', serif;" dir="rtl">
          <tr>
            <td style="width: 12%; text-align: right;">الاسم كامل :</td>
            <td style="width: 38%; text-align: right; font-family: 'Times New Roman', serif; text-transform: uppercase;">${student.name}</td>

            <td style="width: 12%; text-align: right;">الصف :</td>
            <td style="width: 38%; text-align: right;">${classNameAr}</td>
          </tr>
          <tr>
            <td style="text-align: right;">الرقم :</td>
            <td style="text-align: right; font-family: 'Times New Roman', serif;">${student.nisn || '-'}</td>

            <td style="text-align: right;">العام الدراسي :</td>
            <td style="text-align: right;">${academicYearFormatted}</td>
          </tr>
        </table>

        <!-- Main Official 5-Column Grade Table Sesuai Template User -->
        <table style="width: 100%; border: 1.5px solid #000; margin-bottom: 6px;" dir="rtl">
          <thead>
            <tr style="background-color: #f2f2f2; font-family: 'Traditional Arabic', 'Amiri', serif; font-weight: bold;">
              <th style="border: 1px solid #000; padding: 5px 4px; width: 6%; text-align: center; font-size: 12pt;">
                الرقم
              </th>
              <th style="border: 1px solid #000; padding: 5px 6px; width: 34%; text-align: center; font-size: 13.5pt;">
                المواد الدراسية
              </th>
              <th style="border: 1px solid #000; padding: 5px 6px; width: 26%; text-align: center; font-family: 'Times New Roman', serif; font-size: 11pt;">
                Mata Pelajaran
              </th>
              <th style="border: 1px solid #000; padding: 5px 4px; width: 14%; text-align: center; font-size: 12pt;">
                الدرجة بالرقـم
              </th>
              <th style="border: 1px solid #000; padding: 5px 6px; width: 20%; text-align: center; font-size: 12pt;">
                الدرجة التي حصلت عليها الطالب/الطالبة
              </th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            
            <!-- Summary 1: Jumlah -->
            <tr style="background-color: #ffffff; font-weight: bold;">
              <td colspan="3" style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 12.5pt;">
                المجموع / Jumlah
              </td>
              <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; font-family: 'Times New Roman', serif; font-size: 11.5pt;">
                ${student.totalScore}
              </td>
              <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 12.5pt;">
                ${toEasternArabicNumerals(student.totalScore)}
              </td>
            </tr>

            <!-- Summary 2: Rata-Rata -->
            <tr style="background-color: #ffffff; font-weight: bold;">
              <td colspan="3" style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 12.5pt;">
                النتيجة المعدلة / Nilai Rata-Rata
              </td>
              <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; font-family: 'Times New Roman', serif; font-size: 11.5pt;">
                ${student.averageScore}
              </td>
              <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 12.5pt;">
                ${toEasternArabicNumerals(student.averageScore)}
              </td>
            </tr>

            <!-- Summary 3: Peringkat -->
            <tr style="background-color: #ffffff; font-weight: bold;">
              <td colspan="3" style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 12.5pt;">
                المقام / Peringkat
              </td>
              <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; font-family: 'Times New Roman', serif; font-size: 11.5pt;">
                ${student.rank}
              </td>
              <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 12.5pt;">
                ${rankToArabicOrdinal(student.rank)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Titimangsa Sesuai Template User -->
        <div style="margin-top: 12px; text-align: right; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 12.5pt; font-weight: bold;" dir="rtl">
          ${config.dateTextAr?.startsWith('تحريرا') ? config.dateTextAr : `تحريرا بـ ${config.placeNameAr || 'غونتونج سندور'}: ${config.dateTextAr}`}
        </div>

        <!-- 2-Tier Official Signatures Sesuai Template Gambar User -->
        <!-- Baris 1: Wali Kelas (Kanan) & Wali Santri (Kiri) -->
        <table style="width: 100%; margin-top: 8px; font-size: 11pt; border: none;" dir="rtl">
          <tr>
            <td style="width: 50%; text-align: right; padding-right: 30px; vertical-align: top;">
              <div style="display: inline-block; text-align: center; min-width: 170px;">
                <p style="font-weight: bold; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 13pt; margin: 0;">${config.waliKelasLabelAr || 'ولي الفصل'}</p>
                <div style="height: 42px;"></div>
                <p style="font-weight: bold; text-decoration: underline; margin: 0; font-family: 'Times New Roman', serif; font-size: 11pt;">${officialWali}</p>
              </div>
            </td>
            <td style="width: 50%; text-align: left; padding-left: 30px; vertical-align: top;">
              <div style="display: inline-block; text-align: center; min-width: 170px;">
                <p style="font-weight: bold; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 13pt; margin: 0;">${config.waliSantriLabelAr || 'ولي الأمر'}</p>
                <div style="height: 42px;"></div>
                <p style="font-weight: bold; margin: 0; font-family: 'Times New Roman', serif; font-size: 11pt;">____________________</p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Baris 2: Direktur / Mudir Al-Ma'had (Tengah Bawah) -->
        <table style="width: 100%; margin-top: 4px; font-size: 11pt; border: none;" dir="rtl">
          <tr>
            <td style="width: 100%; text-align: center; vertical-align: top;">
              <div style="display: inline-block; text-align: center; min-width: 200px;">
                <p style="font-weight: bold; font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 13pt; margin: 0;">${config.direkturLabelAr || 'مدير المعهد'}</p>
                <div style="height: 42px;"></div>
                <p style="font-weight: bold; text-decoration: underline; margin: 0; font-family: 'Times New Roman', serif; font-size: 11pt;">${config.direkturName || 'M. Ya\'qub Unang, S.Ag'}</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Raport_${student.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${classNameLatin.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

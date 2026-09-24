import React, { useState, useMemo } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Subject, CalculatedStudent, SchoolConfig, ClassItem } from '../types';
import { numberToIndonesianWords, getAfektifLetter } from '../utils/indonesianNumbers';
import { getSubjectsForClass } from '../data/curriculumSubjects';
import { getWaliKelasForClass } from '../data/waliKelasDatabase';

interface ReportCertificateFullDayProps {
  student: CalculatedStudent;
  subjects: Subject[];
  config: SchoolConfig;
  classes?: ClassItem[];
  className?: string;
  isPrintOnly?: boolean;
  isEditingMode?: boolean;
  totalStudentsInClass?: number;
  onUpdateScore?: (studentId: string, subjectId: string, score: number) => void;
  onUpdateStudentName?: (studentId: string, newName: string) => void;
  onUpdateNisn?: (studentId: string, newNisn: string) => void;
  paperSize?: 'F4' | 'A4';
  id?: string;
}

export const ReportCertificateFullDay: React.FC<ReportCertificateFullDayProps> = ({
  student,
  subjects,
  config,
  classes = [],
  className = '',
  isPrintOnly = false,
  isEditingMode = false,
  totalStudentsInClass = 36,
  onUpdateScore,
  onUpdateStudentName,
  onUpdateNisn,
  paperSize = 'F4',
  id = 'raport-certificate-container',
}) => {
  const effectiveSubjects =
    subjects && subjects.length > 0
      ? subjects
      : student.classId
      ? getSubjectsForClass(student.classId)
      : [];

  const classInfo = student.classId
    ? classes.find((c) => c.id === student.classId) ||
      classes.find((c) => c.id.toLowerCase() === student.classId.toLowerCase())
    : undefined;

  const isXiiIpaFullDay = (student.classId || '').trim().toLowerCase() === 'xii-ipa-fd';

  const resolvedWaliKelas = isXiiIpaFullDay
    ? ''
    : classInfo?.waliKelasName ||
      (student.classId ? getWaliKelasForClass(student.classId, classes) : undefined) ||
      config.waliKelasName ||
      'Muhammad Zaki';

  const isSmp =
    (classInfo?.level && Number(classInfo.level) <= 9) ||
    (student.classId || '').startsWith('vii') ||
    (student.classId || '').startsWith('viii') ||
    (student.classId || '').startsWith('ix') ||
    (classInfo?.nameLatin || '').toLowerCase().includes('smp');

  const normalizedClassId = (student.classId || '').toLowerCase();
  const normalizedClassName = (classInfo?.nameLatin || config.classLatin || '').toLowerCase();

  const isSma = !isSmp && (
    (classInfo?.level && Number(classInfo.level) >= 10) ||
    normalizedClassId.startsWith('x') ||
    normalizedClassId.startsWith('xi') ||
    normalizedClassId.startsWith('xii') ||
    normalizedClassName.includes('sma') ||
    normalizedClassName.includes('full day sma')
  );

  const resolvedSchoolName = isSma ? 'SMA ISLAM AL-GHOZALI' : 'SMP ISLAM AL-GHOZALI';
  const resolvedProgramStudi = classInfo?.jurusan || (isSma ? 'UMUM' : 'SMP');
  const resolvedClassName = classInfo?.nameLatin || config.classLatin || 'X A';
  // Nama kelas singkat untuk SMP: "VII.3 Full Day Putri" → "VII.3"
  const shortClassName = isSmp
    ? resolvedClassName.split(' Full Day')[0].trim()
    : resolvedClassName;
  // Ekstrak kata Ganjil/Genap dari semesterLatin, misal "1 (Ganjil)" → "Ganjil"
  const semesterShort = (config.semesterLatin || '1 (Ganjil)')
    .replace(/^\d+\s*\(/, '').replace(/\)$/, '').trim();
  const kepalaSekolah = isSma
    ? (config.kepalaSekolahName && !config.kepalaSekolahName.includes('ISWAHYUDIN') ? config.kepalaSekolahName : 'Antoni Firdaus, M.Pd.')
    : (config.kepalaSekolahSmpName || (config.kepalaSekolahName && config.kepalaSekolahName.includes('ISWAHYUDIN') ? config.kepalaSekolahName : 'ISWAHYUDIN, SE'));

  // Editable states for name and NISN
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(student.name);
  const [isEditingNisn, setIsEditingNisn] = useState(false);
  const [nisnVal, setNisnVal] = useState(student.nisn || student.nis || '');

  // Calculate totals and averages
  const scoresArray = effectiveSubjects.map((sub) => {
    const raw = student.scores[sub.id];
    return typeof raw === 'number' && !isNaN(raw) ? raw : 0;
  });
  const totalScore = scoresArray.reduce((a, b) => a + b, 0);
  const avgScore = effectiveSubjects.length > 0 ? totalScore / effectiveSubjects.length : 0;

  const isCompact = effectiveSubjects.length > 17;
  const pageHeight = paperSize === 'A4' ? '297mm' : '330mm';

  return (
    <div
      id={id}
      data-paper-size={paperSize}
      className={`rapor-page paper-${paperSize.toLowerCase()} mx-auto bg-white text-stone-900 ${
        isPrintOnly ? '' : 'shadow-2xl rounded-sm'
      } ${className}`}
      style={{
        width: '210mm',
        height: pageHeight,
        minWidth: '210mm',
        minHeight: pageHeight,
        maxWidth: '210mm',
        maxHeight: pageHeight,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        margin: '0 auto',
        padding: '12mm 14mm 10mm 14mm',
        fontFamily: "'Times New Roman', Times, serif",
      }}
    >
      {/* =========================================================
          KOP RESMI SEKOLAH FULL DAY (SESUAI DOKUMEN ASLI PENGGUNA)
          ========================================================= */}
      <div className="w-full flex items-center justify-between border-b-2 border-stone-900 pb-2 mb-2">
        <div className="flex-shrink-0 flex items-center justify-center pl-1">
          <SchoolLogo size={70} />
        </div>
        <div className="flex-1 text-center px-2">
          <h2 className="text-[13pt] font-extrabold uppercase tracking-wide leading-tight text-stone-900 m-0">
            LAPORAN HASIL BELAJAR PESERTA DIDIK
          </h2>
          <h3 className="text-[11pt] font-bold uppercase tracking-wider leading-tight text-stone-800 m-0 mt-0.5">
            {config.subTitleId && !config.subTitleId.includes('PENILAIAN') && !config.subTitleId.includes('SUMATIF')
              ? config.subTitleId
              : 'ASESMEN TENGAH SEMESTER GANJIL'}
          </h3>
          <h1 className="text-[16pt] font-black tracking-wider leading-tight text-stone-950 m-0 mt-0.5">
            {resolvedSchoolName}
          </h1>
          <p className="text-[11pt] font-bold tracking-wide leading-tight text-stone-900 m-0 mt-0.5">
            TAHUN PELAJARAN {config.academicYearLatin || '2026/2027'}
          </p>
          <p className="text-[8.5pt] font-medium leading-tight text-stone-700 m-0 mt-1">
            {config.schoolAddress ||
              'Jl. Permata No. 19 Desa Curug Kec. Gunungsindur Kab. Bogor Telp. (0251) 8614072'}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center justify-center pr-1 opacity-0 pointer-events-none">
          {/* Ghost balancer to keep header text perfectly centered */}
          <SchoolLogo size={70} />
        </div>
      </div>

      {/* =========================================================
          IDENTITAS SISWA (2 KOLOM RAPI PRESISI)
          ========================================================= */}
      <table className="w-full text-[10pt] font-semibold mb-2.5 border-none border-collapse">
        <tbody>
          <tr>
            <td style={{ width: '15%', padding: '1.5px 0' }}>Nama</td>
            <td style={{ width: '2%', textAlign: 'center', padding: '1.5px 0' }}>:</td>
            <td style={{ width: '38%', padding: '1.5px 4px', fontWeight: 'bold' }}>
              {isEditingMode && !isPrintOnly ? (
                isEditingName ? (
                  <input
                    type="text"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    onBlur={() => {
                      setIsEditingName(false);
                      if (onUpdateStudentName && nameVal.trim()) {
                        onUpdateStudentName(student.id, nameVal.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingName(false);
                        if (onUpdateStudentName && nameVal.trim()) {
                          onUpdateStudentName(student.id, nameVal.trim());
                        }
                      }
                    }}
                    autoFocus
                    className="border border-blue-500 rounded px-1 text-xs w-full"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingName(true)}
                    className="cursor-pointer hover:underline text-blue-900"
                    title="Klik untuk ubah nama"
                  >
                    {student.name}
                  </span>
                )
              ) : (
                student.name
              )}
            </td>
            <td style={{ width: '22%', padding: '1.5px 0' }}>Nomor Induk Siswa</td>
            <td style={{ width: '2%', textAlign: 'center', padding: '1.5px 0' }}>:</td>
            <td style={{ width: '21%', padding: '1.5px 4px' }}>
              {isEditingMode && !isPrintOnly ? (
                isEditingNisn ? (
                  <input
                    type="text"
                    value={nisnVal}
                    onChange={(e) => setNisnVal(e.target.value)}
                    onBlur={() => {
                      setIsEditingNisn(false);
                      if (onUpdateNisn && nisnVal.trim()) {
                        onUpdateNisn(student.id, nisnVal.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingNisn(false);
                        if (onUpdateNisn && nisnVal.trim()) {
                          onUpdateNisn(student.id, nisnVal.trim());
                        }
                      }
                    }}
                    autoFocus
                    className="border border-blue-500 rounded px-1 text-xs w-full"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingNisn(true)}
                    className="cursor-pointer hover:underline text-blue-900"
                    title="Klik untuk ubah NIS/NISN"
                  >
                    {student.nis || student.nisn || '-'}
                  </span>
                )
              ) : (
                student.nis || student.nisn || '-'
              )}
            </td>
          </tr>
          {!isSmp && (
            <tr>
              <td style={{ padding: '1.5px 0' }}>Nama Sekolah</td>
              <td style={{ textAlign: 'center', padding: '1.5px 0' }}>:</td>
              <td style={{ padding: '1.5px 4px' }}>{resolvedSchoolName}</td>
              <td style={{ padding: '1.5px 0' }}>Program Studi</td>
              <td style={{ textAlign: 'center', padding: '1.5px 0' }}>:</td>
              <td style={{ padding: '1.5px 4px' }}>{resolvedProgramStudi}</td>
            </tr>
          )}
          <tr>
            <td style={{ padding: '1.5px 0' }}>Kelas/Semester</td>
            <td style={{ textAlign: 'center', padding: '1.5px 0' }}>:</td>
            <td style={{ padding: '1.5px 4px' }}>
              {`${shortClassName}/${semesterShort.toUpperCase()}`}
            </td>
            <td style={{ padding: '1.5px 0' }}>Tahun Pelajaran</td>
            <td style={{ textAlign: 'center', padding: '1.5px 0' }}>:</td>
            <td style={{ padding: '1.5px 4px' }}>{config.academicYearLatin || '2026/2027'}</td>
          </tr>
        </tbody>
      </table>

      {/* =========================================================
          TABEL NILAI RESMI FULL DAY (SESUAI GAMBAR 2)
          ========================================================= */}
      <table className={`w-full text-stone-950 border-collapse ${isCompact ? 'mb-1 text-[8.5pt]' : 'mb-2.5 text-[9.5pt]'}`}>
        <thead>
          <tr className="bg-sky-100/70 text-center font-bold">
            <th
              rowSpan={2}
              className={`border border-stone-900 px-1 ${isCompact ? 'py-0.5' : 'py-1'}`}
              style={{ width: '5.5%' }}
            >
              NO
            </th>
            <th
              rowSpan={2}
              className={`border border-stone-900 px-2 ${isCompact ? 'py-0.5' : 'py-1'} text-left`}
              style={{ width: '33%' }}
            >
              Komponen Mata Pelajaran
            </th>
            <th
              rowSpan={2}
              className={`border border-stone-900 px-1 ${isCompact ? 'py-0.5' : 'py-1'}`}
              style={{ width: '8%' }}
            >
              KKM
            </th>
            <th
              colSpan={2}
              className={`border border-stone-900 px-2 ${isCompact ? 'py-0' : 'py-0.5'} text-center`}
              style={{ width: '45.5%' }}
            >
              Nilai
            </th>
            <th
              rowSpan={2}
              className={`border border-stone-900 px-1 ${isCompact ? 'py-0.5' : 'py-1'}`}
              style={{ width: '8%' }}
            >
              Afektif
            </th>
          </tr>
          <tr className="bg-sky-50 text-center font-bold">
            <th className={`border border-stone-900 px-1 ${isCompact ? 'py-0' : 'py-0.5'}`} style={{ width: '12%' }}>
              Angka
            </th>
            <th className={`border border-stone-900 px-2 ${isCompact ? 'py-0' : 'py-0.5'} text-left`} style={{ width: '33.5%' }}>
              Huruf
            </th>
          </tr>
        </thead>
        <tbody>
          {effectiveSubjects.map((sub, idx) => {
            const rawScore = student.scores[sub.id];
            const hasScore = typeof rawScore === 'number' && !isNaN(rawScore);
            const scoreVal = hasScore ? rawScore : 0;
            const kkmVal = sub.kkm || 70;
            const terbilang = hasScore ? numberToIndonesianWords(scoreVal) : '-';
            const afektifVal =
              student.afektif?.[sub.id] || (hasScore ? getAfektifLetter(scoreVal) : 'A');

            return (
              <tr key={sub.id} className="hover:bg-slate-50 transition">
                <td className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} font-medium`}>
                  {idx + 1}
                </td>
                <td className={`border border-stone-900 px-2 ${isCompact ? 'py-[1px]' : 'py-0.5'} text-stone-900 font-medium`}>
                  {sub.nameId}
                </td>
                <td className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} font-medium`}>
                  {kkmVal}
                </td>
                <td className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} font-bold`}>
                  {isEditingMode && !isPrintOnly ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={hasScore ? scoreVal : ''}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        if (onUpdateScore) onUpdateScore(student.id, sub.id, val);
                      }}
                      className="w-12 text-center border border-emerald-400 rounded py-0 text-xs font-bold"
                    />
                  ) : hasScore ? (
                    scoreVal
                  ) : (
                    '-'
                  )}
                </td>
                <td className={`border border-stone-900 px-2 ${isCompact ? 'py-[1px] text-[8pt]' : 'py-0.5 text-[9pt]'} italic capitalize`}>
                  {terbilang}
                </td>
                <td className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} font-bold`}>
                  {afektifVal}
                </td>
              </tr>
            );
          })}

          {/* Baris Jumlah */}
          <tr className="font-bold bg-slate-50">
            <td
              colSpan={3}
              className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} uppercase tracking-wider`}
            >
              Jumlah
            </td>
            <td className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} font-black ${isCompact ? 'text-[9pt]' : 'text-[10pt]'}`}>
              {totalScore}
            </td>
            <td colSpan={2} className="border border-stone-900"></td>
          </tr>

          {/* Baris Rata-rata */}
          <tr className="font-bold bg-slate-50">
            <td
              colSpan={3}
              className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} uppercase tracking-wider`}
            >
              Rata-rata
            </td>
            <td className={`border border-stone-900 text-center ${isCompact ? 'py-[1px]' : 'py-0.5'} font-black ${isCompact ? 'text-[9pt]' : 'text-[10pt]'}`}>
              {avgScore.toFixed(2).replace('.', ',')}
            </td>
            <td colSpan={2} className="border border-stone-900"></td>
          </tr>
        </tbody>
      </table>

      {/* =========================================================
          BAGIAN B: KEPRIBADIAN & KETIDAKHADIRAN (SESUAI GAMBAR 2)
          ========================================================= */}
      <div className={`w-full ${isCompact ? 'mb-1.5' : 'mb-2'}`}>
        <h4 className="text-[10pt] font-bold text-stone-950 mb-1">
          B. Kepribadian dan ketidakhadiran
        </h4>

        <div className="w-full flex gap-3">
          {/* Tabel Kiri: Kepribadian & Ranking */}
          <div className="flex-1">
            <table className="w-full border-collapse border border-stone-900 text-[9pt]">
              <thead>
                <tr className="bg-sky-50 text-center font-bold">
                  <th className="border border-stone-900 py-0.5 w-1/2">Kepribadian</th>
                  <th className="border border-stone-900 py-0.5 w-1/2">Ket</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-stone-900 px-2 py-0.5">Kerapihan</td>
                  <td className="border border-stone-900 text-center py-0.5 font-bold">
                    {student.kepribadian?.kerapihan || 'A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-stone-900 px-2 py-0.5">Kedisiplinan</td>
                  <td className="border border-stone-900 text-center py-0.5 font-bold">
                    {student.kepribadian?.kedisiplinan || 'A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-stone-900 px-2 py-0.5">Kejujuran</td>
                  <td className="border border-stone-900 text-center py-0.5 font-bold">
                    {student.kepribadian?.kejujuran || 'A'}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-stone-900 px-2 py-1">Peringkat Kelas</td>
                  <td className="border border-stone-900 text-center py-1">
                    Ke <span className="text-[10pt] font-black text-blue-900">{student.rank}</span>{' '}
                    dari {totalStudentsInClass} siswa
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabel Kanan: Alasan Ketidakhadiran */}
          <div className="flex-1">
            <table className="w-full border-collapse border border-stone-900 text-[9pt]">
              <thead>
                <tr className="bg-sky-50 text-center font-bold">
                  <th className="border border-stone-900 py-0.5 w-1/2">Alasan Ketidakhadiran</th>
                  <th className="border border-stone-900 py-0.5 w-1/2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-stone-900 px-2 py-0.5">Sakit</td>
                  <td className="border border-stone-900 text-center py-0.5">
                    {student.absensi?.sakit ?? 0} hari
                  </td>
                </tr>
                <tr>
                  <td className="border border-stone-900 px-2 py-0.5">Izin</td>
                  <td className="border border-stone-900 text-center py-0.5">
                    {student.absensi?.izin ?? 0} hari
                  </td>
                </tr>
                <tr>
                  <td className="border border-stone-900 px-2 py-0.5">Tanpa Keterangan</td>
                  <td className="border border-stone-900 text-center py-0.5">
                    {student.absensi?.alpa ?? 0} hari
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================
          TANDA TANGAN (3 KOLOM RESMI: ORANG TUA, KEPALA SEKOLAH, WALI KELAS)
          ========================================================= */}
      <div className={`w-full ${isCompact ? 'mt-1 pt-1 text-[8.5pt]' : 'mt-auto pt-2 text-[9.5pt]'}`}>
        <div className="w-full flex justify-between items-start text-center">
          {/* Kolom 1: Orang Tua */}
          <div className="w-1/3 flex flex-col items-center">
            <div className="font-bold text-stone-950">Orang Tua/Wali Peserta Didik</div>
            <div className={`${isCompact ? 'h-11' : 'h-16'} flex items-end justify-center w-full`}>
              <div className="w-36 border-b border-stone-900 pb-0.5"></div>
            </div>
          </div>

          {/* Kolom 2: Mengetahui Kepala Sekolah */}
          <div className="w-1/3 flex flex-col items-center">
            <div className="font-medium text-stone-700">Mengetahui</div>
            <div className="font-bold text-stone-950">Kepala Sekolah</div>
            <div className={`${isCompact ? 'h-10' : 'h-14'} flex items-end justify-center w-full`}>
              <span className="font-bold border-b border-stone-900 pb-0.5 text-stone-950">
                ( {kepalaSekolah} )
              </span>
            </div>
          </div>

          {/* Kolom 3: Titimangsa & Penanggung Jawab */}
          <div className="w-1/3 flex flex-col items-center">
            <div className="font-medium text-stone-700">
              {config.placeNameLatin || 'Gunungsindur'}, {config.dateMasehi || '24 September 2026'}
            </div>
            <div className="font-bold text-stone-950">Wali Kelas</div>
            <div className={`${isCompact ? 'h-10' : 'h-14'} flex items-end justify-center w-full`}>
              <span className="font-bold border-b border-stone-900 pb-0.5 text-stone-950">
                ( {resolvedWaliKelas} )
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

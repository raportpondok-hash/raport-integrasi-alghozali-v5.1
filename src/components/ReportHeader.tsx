import React, { useState, useEffect } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { SchoolConfig } from '../types';
import { toEasternArabicNumerals } from '../utils/arabicNumbers';
import { ReportDesignConfig } from '../data/reportDesign';

interface ReportHeaderProps {
  studentName: string;
  nisn: string;
  config: SchoolConfig;
  designConfig?: ReportDesignConfig;
  isEditingMode?: boolean;
  isPrintOnly?: boolean;
  onUpdateStudentName?: (newName: string) => void;
  onUpdateNisn?: (newNisn: string) => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  studentName,
  nisn,
  config,
  designConfig,
  isEditingMode = false,
  isPrintOnly = false,
  onUpdateStudentName,
  onUpdateNisn,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(studentName);
  const [isEditingNisn, setIsEditingNisn] = useState(false);
  const [nisnVal, setNisnVal] = useState(nisn);

  useEffect(() => {
    setNameVal(studentName);
  }, [studentName]);

  useEffect(() => {
    setNisnVal(nisn);
  }, [nisn]);

  const handleCommitName = () => {
    setIsEditingName(false);
    if (onUpdateStudentName && nameVal.trim() && nameVal !== studentName) {
      onUpdateStudentName(nameVal.trim());
    }
  };

  const handleCommitNisn = () => {
    setIsEditingNisn(false);
    if (onUpdateNisn && nisnVal !== nisn) {
      onUpdateNisn(nisnVal.trim());
    }
  };

  // Format Arabic Academic Year e.g. ٢٠٢٥ / ٢٠٢٦
  const academicYearFormatted = config.academicYearAr || 
    (config.academicYearLatin 
      ? `${toEasternArabicNumerals(config.academicYearLatin.split('-')[0] || '')} / ${toEasternArabicNumerals(config.academicYearLatin.split('-')[1] || '')}`
      : '٢٠٢٥ / ٢٠٢٦');

  const titleFontSize = designConfig?.titleFontSize ?? 25;
  const subTitleFontSize = designConfig?.subTitleFontSize ?? 15;
  const studentInfoFontSize = designConfig?.studentInfoFontSize ?? 14.5;
  const arabicFontFamily = designConfig?.arabicFontFamily ?? "'Traditional Arabic', 'Scheherazade New', 'Amiri', serif";
  const latinFontFamily = designConfig?.latinFontFamily ?? "'Times New Roman', Arial, sans-serif";
  const isTitleItalic = designConfig?.isTitleItalic ? 'italic' : 'normal';

  // Adaptive font sizing for variable data (Student Name & Class)
  const dynamicNameFontSize = studentName.length > 24
    ? Math.max(9.5, studentInfoFontSize - (studentName.length - 24) * 0.22)
    : studentInfoFontSize;
  const resolvedClass = config.classAr || 'الأول التكثيفي - A';
  const dynamicClassFontSize = resolvedClass.length > 22
    ? Math.max(10, studentInfoFontSize - (resolvedClass.length - 22) * 0.25)
    : studentInfoFontSize;

  return (
    <div className="w-full mb-1">
      {/* Header dengan Dual Logo YPI AL-GHOZALI */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        {/* Left Official Logo */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <SchoolLogo size={65} idPrefix="logo-header-left" />
        </div>

        {/* Center Calligraphic Header */}
        <div className="flex-1 text-center px-2 flex flex-col items-center justify-center" dir="rtl">
          <div
            className="font-bold text-stone-950 select-none my-0 leading-tight"
            style={{
              fontSize: `${titleFontSize}pt`,
              fontFamily: arabicFontFamily,
              fontStyle: isTitleItalic,
              letterSpacing: 'normal',
            }}
          >
            كشف الدرجات
          </div>

          <div
            className="font-bold text-stone-900 mt-1 select-none leading-tight"
            style={{
              fontSize: `${subTitleFontSize}pt`,
              fontFamily: arabicFontFamily,
              letterSpacing: 'normal',
            }}
          >
            {!config.subTitleAr || config.subTitleAr.includes('لتقييم منتصف')
              ? 'للامتحان التحريري للفصل الدراسي الأول'
              : config.subTitleAr}
          </div>
        </div>

        {/* Right Official Logo */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <SchoolLogo size={65} idPrefix="logo-header-right" />
        </div>
      </div>

      {/* Identitas Siswa (2 Baris Presisi dengan Titik Dua Sejajar Vertikal & Auto-Fit) */}
      <table 
        className="student-info w-full text-stone-950 font-bold px-1 my-1 border-none" 
        dir="rtl"
        style={{
          fontFamily: arabicFontFamily,
          fontSize: `${studentInfoFontSize}px`,
          borderCollapse: 'collapse',
          border: 'none',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          {/* Sisi Kanan: Label, Titik Dua, Nilai */}
          <col style={{ width: '11%' }} />
          <col style={{ width: '2.5%' }} />
          <col style={{ width: '36.5%' }} />
          {/* Sisi Kiri: Label, Titik Dua, Nilai */}
          <col style={{ width: '13%' }} />
          <col style={{ width: '2.5%' }} />
          <col style={{ width: '34.5%' }} />
        </colgroup>
        <tbody>
          <tr>
            {/* Sisi Kanan: Nama */}
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 0', whiteSpace: 'nowrap' }}>
              <span>الاسم كامل</span>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'middle', border: 'none', padding: '2px 0' }}>
              <span>:</span>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 4px' }}>
              {isEditingMode && !isPrintOnly ? (
                isEditingName ? (
                  <input
                    type="text"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    onBlur={handleCommitName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitName();
                      if (e.key === 'Escape') {
                        setNameVal(studentName);
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    className="px-1.5 py-0.5 border-2 border-[#107c41] rounded bg-white text-stone-900 font-bold uppercase text-xs outline-none shadow-sm min-w-[200px]"
                    dir="ltr"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingName(true)}
                    className="text-stone-950 font-bold uppercase tracking-tight overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-emerald-50 hover:outline-dashed hover:outline-1 hover:outline-emerald-500 rounded px-1 transition inline-block"
                    style={{ fontFamily: latinFontFamily, fontSize: `${dynamicNameFontSize}px` }}
                    title="Klik untuk ketik dan ubah nama santri langsung"
                    dir="ltr"
                  >
                    {studentName}
                  </span>
                )
              ) : (
                <span 
                  className="text-stone-950 font-bold uppercase tracking-tight overflow-hidden text-ellipsis whitespace-nowrap inline-block"
                  style={{ fontFamily: latinFontFamily, fontSize: `${dynamicNameFontSize}px` }}
                  dir="ltr"
                >
                  {studentName}
                </span>
              )}
            </td>

            {/* Sisi Kiri: Kelas */}
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 0', whiteSpace: 'nowrap' }}>
              <span>الصّفّ</span>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'middle', border: 'none', padding: '2px 0' }}>
              <span>:</span>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 4px' }}>
              <span className="whitespace-nowrap" style={{ fontSize: `${dynamicClassFontSize}px` }}>
                {resolvedClass}
              </span>
            </td>
          </tr>

          <tr>
            {/* Sisi Kanan: NISN */}
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 0', whiteSpace: 'nowrap' }}>
              <span>الرقم</span>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'middle', border: 'none', padding: '2px 0' }}>
              <span>:</span>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 4px' }}>
              {isEditingMode && !isPrintOnly ? (
                isEditingNisn ? (
                  <input
                    type="text"
                    value={nisnVal}
                    onChange={(e) => setNisnVal(e.target.value)}
                    onBlur={handleCommitNisn}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitNisn();
                      if (e.key === 'Escape') {
                        setNisnVal(nisn);
                        setIsEditingNisn(false);
                      }
                    }}
                    autoFocus
                    className="px-1.5 py-0.5 border-2 border-[#107c41] rounded bg-white text-stone-900 font-bold text-xs outline-none shadow-sm w-36"
                    dir="ltr"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingNisn(true)}
                    className="text-stone-900 font-bold tracking-wider cursor-pointer hover:bg-emerald-50 hover:outline-dashed hover:outline-1 hover:outline-emerald-500 rounded px-1 transition inline-block"
                    style={{ fontFamily: latinFontFamily, fontSize: `${studentInfoFontSize - 1}px` }}
                    title="Klik untuk ketik dan ubah nomor NISN langsung"
                    dir="ltr"
                  >
                    {nisn || '-'}
                  </span>
                )
              ) : (
                <span 
                  className="text-stone-900 font-bold tracking-wider inline-block"
                  style={{ fontFamily: latinFontFamily, fontSize: `${studentInfoFontSize - 1}px` }}
                  dir="ltr"
                >
                  {nisn || '-'}
                </span>
              )}
            </td>

            {/* Sisi Kiri: Tahun Ajaran */}
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 0', whiteSpace: 'nowrap' }}>
              <span>العام الدّراسي</span>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'middle', border: 'none', padding: '2px 0' }}>
              <span>:</span>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle', border: 'none', padding: '2px 4px' }}>
              <span className="whitespace-nowrap">{academicYearFormatted}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

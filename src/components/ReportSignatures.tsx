import React from 'react';
import { SchoolConfig } from '../types';
import { ReportDesignConfig } from '../data/reportDesign';

interface ReportSignaturesProps {
  config: SchoolConfig;
  onOpenDateSettings?: () => void;
  designConfig?: ReportDesignConfig;
}

export const ReportSignatures: React.FC<ReportSignaturesProps> = ({ config, onOpenDateSettings, designConfig }) => {
  const titimangsaFontSize = designConfig?.titimangsaFontSize ?? 14.5;
  const signatureTitleFontSize = designConfig?.signatureTitleFontSize ?? 15;
  const signatureNameFontSize = designConfig?.signatureNameFontSize ?? 13;
  const titimangsaAlign = designConfig?.titimangsaAlign ?? 'right';
  const arabicFontFamily = designConfig?.arabicFontFamily ?? "'Traditional Arabic', 'Amiri', serif";
  const latinFontFamily = designConfig?.latinFontFamily ?? "'Times New Roman', Arial, sans-serif";
  const waliLen = config.waliKelasName?.length || 0;
  const dynamicWaliFontSize = waliLen > 22
    ? Math.max(9.5, signatureNameFontSize - (waliLen - 22) * 0.25)
    : signatureNameFontSize;

  const dirName = config.direkturName || "M. Ya'qub Unang, S.Ag";
  const dynamicDirFontSize = dirName.length > 24
    ? Math.max(9.5, signatureNameFontSize - (dirName.length - 24) * 0.25)
    : signatureNameFontSize;

  return (
    <div 
      className="w-full text-stone-950 select-none mt-auto" 
      dir="rtl"
      style={{ marginTop: 'auto' }}
    >
      {/* Titimangsa Sesuai Template User */}
      <div 
        onClick={onOpenDateSettings}
        className={`mb-2 px-6 ${onOpenDateSettings ? 'cursor-pointer hover:opacity-80 transition group' : ''}`}
        style={{ textAlign: titimangsaAlign }}
        title={onOpenDateSettings ? 'Klik untuk mengubah tanggal penetapan raport' : undefined}
      >
        <p
          className="text-stone-950 font-bold leading-normal m-0"
          style={{ 
            fontSize: `${titimangsaFontSize}px`,
            fontFamily: arabicFontFamily, 
            letterSpacing: 'normal' 
          }}
        >
          {config.dateTextAr?.startsWith('تحريرا') 
            ? config.dateTextAr 
            : `تحريرا بـ ${config.placeNameAr || 'غونتونج سندور'}: ${config.dateTextAr}`}
        </p>
      </div>

      {/* Baris 1: Wali Kelas (Kanan) & Wali Santri (Kiri) */}
      <div 
        className="w-full flex justify-between items-start text-center px-10"
        style={{
          fontFamily: arabicFontFamily,
        }}
      >
        {/* Kanan (RTL start): Wali Kelas */}
        <div className="min-w-[160px] flex flex-col items-center">
          <div 
            className="font-bold text-stone-950"
            style={{ fontSize: `${signatureTitleFontSize}px` }}
          >
            {config.waliKelasLabelAr || 'ولي الفصل'}
          </div>
          <div className="h-10 md:h-11 flex items-end justify-center w-full">
            <span 
              dir="ltr"
              className="font-bold border-b-2 border-stone-900 pb-0.5 whitespace-nowrap text-stone-950 inline-block max-w-full text-center"
              style={{ 
                fontFamily: latinFontFamily, 
                fontSize: `${dynamicWaliFontSize}px`,
                direction: 'ltr',
                unicodeBidi: 'isolate',
              }}
            >
              {config.waliKelasName}
            </span>
          </div>
        </div>

        {/* Kiri (RTL end): Wali Santri */}
        <div className="min-w-[160px] flex flex-col items-center">
          <div 
            className="font-bold text-stone-950"
            style={{ fontSize: `${signatureTitleFontSize}px` }}
          >
            {config.waliSantriLabelAr || 'ولي الأمر'}
          </div>
          <div className="h-10 md:h-11 flex items-end justify-center w-full">
            <div className="w-36 border-b-2 border-stone-900 mb-1"></div>
          </div>
        </div>
      </div>

      {/* Baris 2: Direktur / Mudir Al-Ma'had (Tengah Bawah) */}
      <div 
        className="w-full flex justify-center items-center text-center mt-2"
        style={{
          fontFamily: arabicFontFamily,
        }}
      >
        <div className="min-w-[180px] flex flex-col items-center">
          <div 
            className="font-bold text-stone-950"
            style={{ fontSize: `${signatureTitleFontSize}px` }}
          >
            {config.direkturLabelAr || 'مدير المعهد'}
          </div>
          <div className="h-10 md:h-11 flex items-end justify-center w-full">
            <span 
              dir="ltr"
              className="font-bold border-b-2 border-stone-900 pb-0.5 whitespace-nowrap text-stone-950 inline-block max-w-full text-center"
              style={{ 
                fontFamily: latinFontFamily, 
                fontSize: `${dynamicDirFontSize}px`,
                direction: 'ltr',
                unicodeBidi: 'isolate',
              }}
            >
              {dirName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

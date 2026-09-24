import React, { useState } from 'react';
import { Subject, CalculatedStudent, SchoolConfig, ClassItem } from '../types';
import { ReportDesignConfig } from '../data/reportDesign';
import { ReportCertificate } from './ReportCertificate';
import { Printer, X, Eye } from 'lucide-react';

interface BatchPrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  students: CalculatedStudent[];
  subjects: Subject[];
  config: SchoolConfig;
  classes?: ClassItem[];
  rangeStart: number;
  rangeEnd: number;
  onChangeRangeStart?: (val: number) => void;
  onChangeRangeEnd?: (val: number) => void;
  designConfig?: ReportDesignConfig;
  customSubjectOverrides?: Record<string, { nameAr?: string; nameId?: string; customTerbilang?: string }>;
}

export const BatchPrintView: React.FC<BatchPrintViewProps> = ({
  isOpen,
  onClose,
  students,
  subjects,
  config,
  classes,
  rangeStart,
  rangeEnd,
  onChangeRangeStart,
  onChangeRangeEnd,
  designConfig,
  customSubjectOverrides,
}) => {
  if (!isOpen) return null;

  const validStart = Math.max(1, Math.min(rangeStart, rangeEnd));
  const validEnd = Math.max(rangeStart, rangeEnd);

  const selectedStudents = students.filter(
    (_, idx) => idx + 1 >= validStart && idx + 1 <= validEnd
  );

  const handlePrintNow = () => {
    window.print();
  };

  const handleSelectAll = () => {
    if (onChangeRangeStart && onChangeRangeEnd) {
      onChangeRangeStart(1);
      onChangeRangeEnd(Math.max(1, students.length));
    }
  };

  return (
    <div
      id="batch-print-modal"
      className="batch-print-overlay fixed inset-0 z-50 flex flex-col bg-stone-900/95 backdrop-blur-sm overflow-y-auto print:static print:inset-auto print:z-auto print:bg-white print:overflow-visible print:p-0 print:block"
    >
      <style>{`
        @media print {
          @page {
            size: 210mm 330mm;
            margin: 0 !important;
          }

          /* Sembunyikan elemen aplikasi utama saat cetak masal aktif */
          body > #root > div > header,
          body > #root > div > main,
          body > #root > div > footer,
          .no-print,
          header,
          footer,
          nav,
          [data-editing-control],
          .excel-table-toolbar {
            display: none !important;
          }

          body, html {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
          }

          #batch-print-modal {
            display: block !important;
            position: static !important;
            inset: auto !important;
            z-index: auto !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          .print-batch-container {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            width: 210mm !important;
          }

          .rapor-print-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            height: 330mm !important; 
            box-sizing: border-box !important;
          }

          .rapor-print-item:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Hilangkan double page-break dari .rapor-page di dalam .rapor-print-item */
          .rapor-print-item .rapor-page {
            page-break-after: auto !important;
            break-after: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
          }

          .rapor-print-item .frame-container,
          .rapor-print-item svg,
          .rapor-print-item svg * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .rapor-print-item svg {
            filter: none !important;
            -webkit-filter: none !important;
          }
        }
      `}</style>

      {/* Top Floating Control Bar */}
      <div className="no-print sticky top-0 z-50 bg-stone-900 border-b border-stone-800 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-400">
            <Eye size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
              <span>Pratinjau Cetak Masal</span>
              <span className="bg-emerald-800/80 text-emerald-200 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                {selectedStudents.length} Lembar Raport
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Kelas {config.classLatin || '-'} • Standar F4 / Folio (210 × 330 mm) • 1 Santri 1 Lembar
            </p>
          </div>
        </div>

        {/* Range Selector Controls */}
        <div className="flex items-center gap-2 bg-stone-800/80 border border-stone-700 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-stone-400 font-medium">Dari No:</span>
          {onChangeRangeStart ? (
            <select
              value={rangeStart}
              onChange={(e) => onChangeRangeStart(Number(e.target.value))}
              className="bg-stone-900 text-stone-100 border border-stone-600 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {students.map((_, i) => (
                <option key={`start-${i + 1}`} value={i + 1}>
                  {i + 1} ({students[i].name.split(' ')[0]})
                </option>
              ))}
            </select>
          ) : (
            <span className="font-bold font-mono text-emerald-400">{rangeStart}</span>
          )}

          <span className="text-stone-400 font-medium ml-1">Sampai:</span>
          {onChangeRangeEnd ? (
            <select
              value={rangeEnd}
              onChange={(e) => onChangeRangeEnd(Number(e.target.value))}
              className="bg-stone-900 text-stone-100 border border-stone-600 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {students.map((_, i) => (
                <option key={`end-${i + 1}`} value={i + 1}>
                  {i + 1} ({students[i].name.split(' ')[0]})
                </option>
              ))}
            </select>
          ) : (
            <span className="font-bold font-mono text-emerald-400">{rangeEnd}</span>
          )}

          {onChangeRangeStart && onChangeRangeEnd && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="ml-2 px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded font-semibold text-[11px] transition"
              title="Pilih seluruh santri di kelas ini"
            >
              Semua ({students.length})
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrintNow}
            disabled={selectedStudents.length === 0}
            className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg text-xs tracking-wider transition disabled:opacity-50"
            title="Buka dialog cetak browser untuk mencetak seluruh raport santri yang dipilih (Bisa simpan ke PDF F4)"
          >
            <Printer size={16} />
            <span>CETAK SEKARANG ({selectedStudents.length} LEMBAR F4)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
            title="Tutup Pratinjau Cetak Masal"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Printable Area containing all certificates */}
      <div className="print-batch-container flex-1 p-4 md:p-8 space-y-12 bg-stone-800/40 print:bg-white print:p-0 print:space-y-0">
        {selectedStudents.length === 0 ? (
          <div className="max-w-md mx-auto my-12 bg-stone-900 border border-stone-700 rounded-xl p-8 text-center text-stone-300">
            <p className="font-bold mb-2 text-rose-400">Tidak ada santri yang dipilih</p>
            <p className="text-xs text-stone-400 mb-4">
              Silakan sesuaikan rentang nomor santri dari panel di atas atau klik tombol Semua.
            </p>
            {onChangeRangeStart && onChangeRangeEnd && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Pilih Seluruh Santri ({students.length})
              </button>
            )}
          </div>
        ) : (
          selectedStudents.map((std, i) => (
            <div key={std.id} className="rapor-print-item relative">
              <div className="no-print max-w-[820px] mx-auto mb-2 text-xs font-semibold text-emerald-300 flex justify-between items-center px-2">
                <span>Lembar {i + 1} dari {selectedStudents.length}</span>
                <span>Santri: {std.name} (NISN: {std.nisn || '-'})</span>
              </div>

              <ReportCertificate
                id={`raport-certificate-${std.id}`}
                student={std}
                subjects={subjects}
                config={config}
                classes={classes}
                designConfig={designConfig}
                customSubjectOverrides={customSubjectOverrides}
                isPrintOnly={true}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

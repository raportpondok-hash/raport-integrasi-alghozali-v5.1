import React, { useState } from 'react';
import { CalculatedStudent, ClassItem, SchoolConfig, AuthUser, JenjangUnit, Subject } from '../types';
import {
  Printer,
  ChevronUp,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  Settings,
  Calendar,
  GraduationCap,
  Edit2,
  Check,
  School,
  FileText,
  Image as ImageIcon,
  FileType,
  Download,
  Loader2,
  Palette,
  Archive,
} from 'lucide-react';
import {
  exportRaportToPdf,
  exportRaportToImage,
  exportSingleRaportToExcel,
  exportRaportToWord,
} from '../utils/exportHelpers';

interface SidebarControlsProps {
  students: CalculatedStudent[];
  classes?: ClassItem[];
  selectedClassId?: string;
  onSelectClassId?: (classId: string) => void;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  rangeStart: number;
  rangeEnd: number;
  onChangeRangeStart: (val: number) => void;
  onChangeRangeEnd: (val: number) => void;
  onPrintSingle: () => void;
  onPrintBatch: () => void;
  onOpenRekap: () => void;
  onOpenSettings: () => void;
  onOpenDesignModal?: () => void;
  onEditStudent: (student: CalculatedStudent) => void;
  config?: SchoolConfig;
  onUpdateConfig?: (newConfig: SchoolConfig) => void;
  currentUser?: AuthUser | null;
  activeJenjang?: JenjangUnit;
  onSelectJenjang?: (unit: JenjangUnit) => void;
  subjects?: Subject[];
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  students,
  classes = [],
  selectedClassId,
  onSelectClassId,
  selectedIndex,
  onSelectIndex,
  rangeStart,
  rangeEnd,
  onChangeRangeStart,
  onChangeRangeEnd,
  onPrintSingle,
  onPrintBatch,
  onOpenRekap,
  onOpenSettings,
  onOpenDesignModal,
  onEditStudent,
  config,
  onUpdateConfig,
  currentUser = null,
  activeJenjang,
  onSelectJenjang,
  subjects = [],
}) => {
  const currentStudent = students[selectedIndex];
  const currentNumber = selectedIndex + 1;

  const isAdmin = currentUser?.role === 'admin';
  const availableUnits: JenjangUnit[] = currentUser?.availableUnits?.filter(u => u === 'SMP' || u === 'SMA') || (isAdmin ? ['SMP', 'SMA'] : ['SMP']);

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [quickDateMasehi, setQuickDateMasehi] = useState(config?.dateMasehi || '25 September 2026');
  const [quickDateHijri, setQuickDateHijri] = useState(config?.dateHijri || '14 Rabiul Awwal 1448');
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const handleExportPdf = async () => {
    if (!currentStudent) return;
    setExportLoading('pdf');
    try {
      const el = document.getElementById('raport-certificate-container');
      const safeName = `Raport_${currentStudent.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(config?.classLatin || 'Kelas').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      await exportRaportToPdf(el, safeName);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor ke PDF. Silakan coba lagi atau gunakan tombol Print.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (!currentStudent) return;
    setExportLoading('image');
    try {
      const el = document.getElementById('raport-certificate-container');
      const safeName = `Raport_${currentStudent.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(config?.classLatin || 'Kelas').replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`;
      await exportRaportToImage(el, safeName, format);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor Gambar. Silakan coba lagi.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportExcel = () => {
    if (!currentStudent || !config) return;
    setExportLoading('excel');
    try {
      exportSingleRaportToExcel(currentStudent, subjects || [], config, classes);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor ke Excel.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportWord = () => {
    if (!currentStudent || !config) return;
    setExportLoading('word');
    try {
      exportRaportToWord(currentStudent, subjects || [], config, classes);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor ke Word.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleSaveQuickDate = () => {
    if (config && onUpdateConfig) {
      const placeAr = config.placeNameAr || 'بغونتونج سندور';
      const updatedDateTextAr = `تحريرا ${placeAr}، ${quickDateMasehi} / ${quickDateHijri}`;
      onUpdateConfig({
        ...config,
        dateMasehi: quickDateMasehi,
        dateHijri: quickDateHijri,
        dateTextAr: updatedDateTextAr,
      });
    }
    setIsEditingDate(false);
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      onSelectIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < students.length - 1) {
      onSelectIndex(selectedIndex + 1);
    }
  };

  return (
    <div className="no-print w-full lg:w-80 bg-white border border-stone-200 rounded-xl shadow-lg p-5 flex flex-col gap-4 sticky top-6">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Panel Kontrol Raport
          </span>
          <h3 className="font-bold text-stone-800 text-sm mt-1">Cetak & Navigasi Santri</h3>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1">
            {onOpenDesignModal && (
              <button
                type="button"
                onClick={onOpenDesignModal}
                title="Kustomisasi Desain & Tata Letak Rapor (CRUD)"
                className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition"
              >
                <Palette size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Pengaturan Lengkap Kop, Tanggal & Tanda Tangan"
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
            >
              <Settings size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Tanggal Penetapan Raport (Editable) */}
      {config && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} className="text-emerald-700" />
              <span>Tanggal Penetapan</span>
            </label>
            <button
              type="button"
              onClick={() => {
                if (isEditingDate) {
                  handleSaveQuickDate();
                } else {
                  setQuickDateMasehi(config.dateMasehi || '25 September 2026');
                  setQuickDateHijri(config.dateHijri || '14 Rabiul Awwal 1448');
                  setIsEditingDate(true);
                }
              }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
            >
              {isEditingDate ? (
                <>
                  <Check size={12} className="text-emerald-600" />
                  Simpan
                </>
              ) : (
                <>
                  <Edit2 size={11} />
                  Edit
                </>
              )}
            </button>
          </div>

          {isEditingDate ? (
            <div className="space-y-2 pt-1 text-xs">
              <div>
                <span className="text-[10px] text-stone-600 font-semibold block mb-0.5">Tanggal Masehi:</span>
                <input
                  type="text"
                  value={quickDateMasehi}
                  onChange={(e) => setQuickDateMasehi(e.target.value)}
                  placeholder="25 September 2026"
                  className="w-full bg-white border border-emerald-300 rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-600 font-semibold block mb-0.5">Tanggal Hijriyah:</span>
                <input
                  type="text"
                  value={quickDateHijri}
                  onChange={(e) => setQuickDateHijri(e.target.value)}
                  placeholder="14 Rabiul Awwal 1448"
                  className="w-full bg-white border border-emerald-300 rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveQuickDate}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded text-[11px] transition shadow-xs"
              >
                Simpan Tanggal Raport
              </button>
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingDate(true)}
              className="cursor-pointer group hover:bg-emerald-100/50 p-1 rounded transition"
              title="Klik untuk langsung mengedit tanggal raport"
            >
              <p className="text-xs font-bold text-stone-800">
                {config.placeNameLatin || 'Gunung Sindur'}, {config.dateMasehi}
              </p>
              <p className="text-[10.5px] text-stone-600">
                {config.dateHijri}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Multi-Jenjang Quick Switcher (Jika guru mengajar di 2 jenjang / admin) */}
      {availableUnits.length > 1 && onSelectJenjang && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
            <span className="flex items-center gap-1">
              <School size={12} className="text-emerald-600" />
              <span>Pilih Jenjang:</span>
            </span>
            <span className="text-[10px] text-stone-500 font-medium">
              {availableUnits.length} Jenjang Diampu
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {availableUnits.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onSelectJenjang(u)}
                className={`py-1 px-1.5 rounded text-[11px] font-bold transition text-center ${
                  activeJenjang === u
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
                title={u === 'TMMIA' ? 'TMMIA mencakup seluruh tingkatan SMP & SMA' : `Jenjang ${u}`}
              >
                {u === 'TMMIA' ? 'TMMIA (Semua)' : u}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Class Selector */}
      {classes.length > 0 && onSelectClassId && (
        <div className="space-y-1.5 pb-2 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} className="text-emerald-600" />
              <span>Pilih Kelas</span>
            </label>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              {classes.length} Kelas {activeJenjang ? `(${activeJenjang})` : ''}
            </span>
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => onSelectClassId(e.target.value)}
            className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameLatin} ({c.nameAr})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 1. Stepper & Student Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
          Pilih Santri
        </label>

        <div className="flex items-center gap-2">
          {/* Stepper with Up/Down buttons */}
          <div className="flex items-center border border-stone-300 rounded-md bg-stone-50 overflow-hidden">
            <span className="w-10 text-center font-bold text-base font-mono text-stone-800">
              {currentNumber}
            </span>
            <div className="flex flex-col border-l border-stone-300">
              <button
                type="button"
                onClick={handlePrev}
                disabled={selectedIndex <= 0}
                className="px-1.5 py-0.5 hover:bg-stone-200 disabled:opacity-30 transition"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedIndex >= students.length - 1}
                className="px-1.5 py-0.5 hover:bg-stone-200 disabled:opacity-30 border-t border-stone-200 transition"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Student Dropdown selector */}
          <select
            value={selectedIndex}
            onChange={(e) => onSelectIndex(Number(e.target.value))}
            className="flex-1 border border-stone-300 rounded-md px-3 py-2 text-xs font-semibold text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {students.map((std, idx) => (
              <option key={std.id} value={idx}>
                {idx + 1}. {std.name}
              </option>
            ))}
          </select>
        </div>

        {/* Current Student Quick Info Card */}
        {currentStudent && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">NISN:</span>
              <span className="font-mono font-bold text-stone-700">{currentStudent.nisn || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Total Nilai:</span>
              <span className="font-bold text-emerald-700">{currentStudent.totalScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Rata-rata / Rank:</span>
              <span className="font-bold text-stone-800">
                {currentStudent.averageScore} (Peringkat #{currentStudent.rank})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditStudent(currentStudent)}
              className="mt-2 w-full text-center text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline pt-1"
            >
              Edit Nilai Santri Ini →
            </button>
          </div>
        )}
      </div>

      {/* 2. Range Selector */}
      <div className="space-y-2 border-t border-stone-200 pt-3">
        <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
          Rentang Cetak Masal
        </label>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[11px] text-stone-500 block mb-1">Dari No:</span>
            <select
              value={rangeStart}
              onChange={(e) => onChangeRangeStart(Number(e.target.value))}
              className="w-full border border-stone-300 rounded px-2 py-1.5 text-xs font-medium bg-white focus:ring-1 focus:ring-emerald-500"
            >
              {students.map((_, i) => (
                <option key={`start-${i + 1}`} value={i + 1}>
                  {i + 1} ({students[i].name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[11px] text-stone-500 block mb-1">Sampai No:</span>
            <select
              value={rangeEnd}
              onChange={(e) => onChangeRangeEnd(Number(e.target.value))}
              className="w-full border border-stone-300 rounded px-2 py-1.5 text-xs font-medium bg-white focus:ring-1 focus:ring-emerald-500"
            >
              {students.map((_, i) => (
                <option key={`end-${i + 1}`} value={i + 1}>
                  {i + 1} ({students[i].name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Big PRINT Button - Highlighted for Exact Vector Print */}
        <button
          type="button"
          onClick={onPrintSingle}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-all tracking-wide text-sm active:scale-[0.99]"
          title="Cetak Langsung atau Simpan sebagai PDF (Ctrl+P) - Standar F4 / Folio 210 x 330 mm"
        >
          <Printer size={17} />
          <span>CETAK / SIMPAN PDF (F4)</span>
        </button>

        {/* PRINT ALL / BATCH Button */}
        <button
          type="button"
          onClick={onPrintBatch}
          className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-2 px-4 rounded-lg border border-stone-300 transition-all text-xs active:scale-[0.99]"
          title="Cetak Masal Seluruh Santri di Kelas Ini (1 Santri 1 Lembar F4)"
        >
          <Layers size={15} className="text-emerald-700" />
          <span>Cetak Masal F4 ({rangeStart} s/d {rangeEnd})</span>
        </button>

        {/* Desain & Tata Letak Rapor (CRUD) - Admin Only */}
        {isAdmin && onOpenDesignModal && (
          <button
            type="button"
            onClick={onOpenDesignModal}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold py-2.5 px-3 rounded-lg shadow-md transition-all text-xs active:scale-[0.99]"
            title="Kustomisasi Bingkai, Tabel, Font Size & Style, Posisi Huruf Raport (CRUD)"
          >
            <Palette size={16} />
            <span>Desain & Tata Letak Rapor (CRUD)</span>
          </button>
        )}

        <p className="text-[10px] text-stone-500 text-center italic">
          *Pilih ukuran kertas F4/Folio (210×330mm) di dialog printer untuk hasil 100% presisi 1 lembar.
        </p>
      </div>

      {/* 4. Export Raport Dokumen (Hanya PDF untuk Raport) */}
      <div className="border-t border-stone-200 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Download size={13} className="text-emerald-600" />
            <span>Unduh File Raport</span>
          </label>
          {exportLoading && (
            <span className="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
              <Loader2 size={11} className="animate-spin text-emerald-600" /> Memproses...
            </span>
          )}
        </div>

        {/* Export to PDF (Clean and focused) */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!!exportLoading || !currentStudent}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs transition shadow-xs disabled:opacity-50"
          title="Download Raport Resmi Format PDF (F4 210x330mm)"
        >
          {exportLoading === 'pdf' ? (
            <Loader2 size={14} className="animate-spin text-rose-600" />
          ) : (
            <FileType size={15} className="text-rose-600" />
          )}
          <span>Download Raport PDF (F4)</span>
        </button>

        {/* Cetak Masal F4 */}
        <button
          type="button"
          onClick={onPrintBatch}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs transition shadow-xs"
          title="Cetak Masal Seluruh Raport Santri Kelas Ini (F4 210x330mm)"
        >
          <Printer size={15} className="text-blue-700" />
          <span>Cetak Masal Raport (F4)</span>
        </button>
      </div>

      {/* 5. Rekapitulasi Shortcut (Excel) */}
      <div className="border-t border-stone-200 pt-3 space-y-2">
        <button
          type="button"
          onClick={onOpenRekap}
          className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold py-2 px-3 rounded-lg text-xs transition"
        >
          <FileSpreadsheet size={15} className="text-emerald-700" />
          <span>Rekapitulasi Nilai (Excel)</span>
        </button>
      </div>
    </div>
  );
};


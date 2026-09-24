import React from 'react';
import { ReportDesignConfig } from '../data/reportDesign';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  MousePointer,
  MoveHorizontal,
  Sliders,
  X,
  Trash2,
} from 'lucide-react';

export type SelectedColumnKey = 'no' | 'subjectAr' | 'subjectLat' | 'score' | 'terbilang' | 'all';

interface ExcelTableToolbarProps {
  designConfig: ReportDesignConfig;
  onUpdateDesignConfig: (newConfig: ReportDesignConfig) => void;
  selectedCol: SelectedColumnKey;
  onSelectCol: (col: SelectedColumnKey) => void;
  onClose?: () => void;
  activeCellLabel?: string;
  activeCellValue?: string;
  onChangeCellValue?: (val: string) => void;
  onAddRow?: () => void;
  onDeleteRow?: () => void;
}

export const ExcelTableToolbar: React.FC<ExcelTableToolbarProps> = ({
  designConfig,
  onUpdateDesignConfig,
  selectedCol,
  onSelectCol,
  onClose,
  activeCellLabel,
  activeCellValue,
  onChangeCellValue,
  onAddRow,
  onDeleteRow,
}) => {
  // Helpers to get and set current column alignment
  const getCurrentAlign = (): 'left' | 'center' | 'right' | 'justify' => {
    switch (selectedCol) {
      case 'no':
        return designConfig.numberAlign || 'center';
      case 'subjectAr':
        return designConfig.arabicSubjectAlign || 'right';
      case 'subjectLat':
        return designConfig.latinSubjectAlign || 'left';
      case 'score':
        return designConfig.scoreAlign || 'center';
      case 'terbilang':
        return designConfig.terbilangAlign || 'center';
      default:
        return 'center';
    }
  };

  const handleSetAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    switch (selectedCol) {
      case 'no':
        onUpdateDesignConfig({ ...designConfig, numberAlign: align });
        break;
      case 'subjectAr':
        onUpdateDesignConfig({ ...designConfig, arabicSubjectAlign: align });
        break;
      case 'subjectLat':
        onUpdateDesignConfig({ ...designConfig, latinSubjectAlign: align });
        break;
      case 'score':
        onUpdateDesignConfig({ ...designConfig, scoreAlign: align as 'left' | 'center' | 'right' });
        break;
      case 'terbilang':
        onUpdateDesignConfig({ ...designConfig, terbilangAlign: align });
        break;
      case 'all':
        onUpdateDesignConfig({
          ...designConfig,
          numberAlign: align,
          arabicSubjectAlign: align,
          latinSubjectAlign: align,
          scoreAlign: align as 'left' | 'center' | 'right',
          terbilangAlign: align,
        });
        break;
    }
  };

  // Helper to get and set vertical alignment (Top, Middle, Bottom)
  const getCurrentVAlign = (): 'top' | 'middle' | 'bottom' => {
    switch (selectedCol) {
      case 'no':
        return designConfig.numberVerticalAlign || designConfig.tableVerticalAlign || 'middle';
      case 'subjectAr':
        return designConfig.arabicSubjectVerticalAlign || designConfig.tableVerticalAlign || 'middle';
      case 'subjectLat':
        return designConfig.latinSubjectVerticalAlign || designConfig.tableVerticalAlign || 'middle';
      case 'score':
        return designConfig.scoreVerticalAlign || designConfig.tableVerticalAlign || 'middle';
      case 'terbilang':
        return designConfig.terbilangVerticalAlign || designConfig.tableVerticalAlign || 'middle';
      default:
        return designConfig.tableVerticalAlign || 'middle';
    }
  };

  const handleSetVAlign = (valign: 'top' | 'middle' | 'bottom') => {
    switch (selectedCol) {
      case 'no':
        onUpdateDesignConfig({ ...designConfig, numberVerticalAlign: valign });
        break;
      case 'subjectAr':
        onUpdateDesignConfig({ ...designConfig, arabicSubjectVerticalAlign: valign });
        break;
      case 'subjectLat':
        onUpdateDesignConfig({ ...designConfig, latinSubjectVerticalAlign: valign });
        break;
      case 'score':
        onUpdateDesignConfig({ ...designConfig, scoreVerticalAlign: valign });
        break;
      case 'terbilang':
        onUpdateDesignConfig({ ...designConfig, terbilangVerticalAlign: valign });
        break;
      case 'all':
        onUpdateDesignConfig({
          ...designConfig,
          tableVerticalAlign: valign,
          numberVerticalAlign: valign,
          arabicSubjectVerticalAlign: valign,
          latinSubjectVerticalAlign: valign,
          scoreVerticalAlign: valign,
          terbilangVerticalAlign: valign,
        });
        break;
    }
  };

  // Helper for font size
  const getCurrentFontSize = (): number => {
    switch (selectedCol) {
      case 'no':
        return designConfig.numberFontSize ?? 12;
      case 'subjectAr':
        return designConfig.arabicSubjectFontSize ?? 14;
      case 'subjectLat':
        return designConfig.latinSubjectFontSize ?? 11.5;
      case 'score':
        return designConfig.scoreFontSize ?? 12.5;
      case 'terbilang':
        return designConfig.terbilangFontSize ?? 14;
      default:
        return designConfig.tableHeaderFontSize ?? 13;
    }
  };

  const handleChangeFontSize = (delta: number) => {
    switch (selectedCol) {
      case 'no':
        onUpdateDesignConfig({
          ...designConfig,
          numberFontSize: Math.max(8, Math.min(22, (designConfig.numberFontSize ?? 12) + delta)),
        });
        break;
      case 'subjectAr':
        onUpdateDesignConfig({
          ...designConfig,
          arabicSubjectFontSize: Math.max(10, Math.min(26, (designConfig.arabicSubjectFontSize ?? 14) + delta)),
        });
        break;
      case 'subjectLat':
        onUpdateDesignConfig({
          ...designConfig,
          latinSubjectFontSize: Math.max(8, Math.min(22, (designConfig.latinSubjectFontSize ?? 11.5) + delta)),
        });
        break;
      case 'score':
        onUpdateDesignConfig({
          ...designConfig,
          scoreFontSize: Math.max(9, Math.min(22, (designConfig.scoreFontSize ?? 12.5) + delta)),
        });
        break;
      case 'terbilang':
        onUpdateDesignConfig({
          ...designConfig,
          terbilangFontSize: Math.max(10, Math.min(26, (designConfig.terbilangFontSize ?? 14) + delta)),
        });
        break;
      case 'all':
        onUpdateDesignConfig({
          ...designConfig,
          numberFontSize: Math.max(8, Math.min(22, (designConfig.numberFontSize ?? 12) + delta)),
          arabicSubjectFontSize: Math.max(10, Math.min(26, (designConfig.arabicSubjectFontSize ?? 14) + delta)),
          latinSubjectFontSize: Math.max(8, Math.min(22, (designConfig.latinSubjectFontSize ?? 11.5) + delta)),
          scoreFontSize: Math.max(9, Math.min(22, (designConfig.scoreFontSize ?? 12.5) + delta)),
          terbilangFontSize: Math.max(10, Math.min(26, (designConfig.terbilangFontSize ?? 14) + delta)),
        });
        break;
    }
  };

  // Helper for column width
  const getCurrentColWidth = (): number => {
    switch (selectedCol) {
      case 'no':
        return designConfig.colWidthNo ?? 5.5;
      case 'subjectAr':
        return designConfig.colWidthSubjectAr ?? 28.5;
      case 'subjectLat':
        return designConfig.colWidthSubjectLat ?? 24.5;
      case 'score':
        return designConfig.colWidthScoreAr ?? 6.5;
      case 'terbilang':
        return designConfig.colWidthTerbilang ?? 28.5;
      default:
        return 20;
    }
  };

  const handleChangeColWidth = (delta: number) => {
    if (selectedCol === 'all') return;
    const current = getCurrentColWidth();
    const nextVal = Math.max(4, Math.min(60, current + delta));
    const diff = nextVal - current;

    // Adjust adjacent columns
    const currentNo = designConfig.colWidthNo ?? 5.5;
    const currentAr = designConfig.colWidthSubjectAr ?? 28.5;
    const currentLat = designConfig.colWidthSubjectLat ?? 24.5;
    const currentScoreAr = designConfig.colWidthScoreAr ?? 6.5;
    const currentScoreLat = designConfig.colWidthScoreLat ?? 6.5;
    const currentTer = designConfig.colWidthTerbilang ?? 28.5;

    let newNo = currentNo;
    let newAr = currentAr;
    let newLat = currentLat;
    let newScoreAr = currentScoreAr;
    let newScoreLat = currentScoreLat;
    let newTer = currentTer;

    switch (selectedCol) {
      case 'no':
        newNo = nextVal;
        newAr = Math.max(15, currentAr - diff);
        break;
      case 'subjectAr':
        newAr = nextVal;
        newLat = Math.max(15, currentLat - diff);
        break;
      case 'subjectLat':
        newLat = nextVal;
        newScoreAr = Math.max(5, currentScoreAr - diff);
        break;
      case 'score':
        newScoreAr = nextVal;
        newScoreLat = nextVal;
        newTer = Math.max(15, currentTer - (diff * 2));
        break;
      case 'terbilang':
        newTer = nextVal;
        newAr = Math.max(15, currentAr - diff);
        break;
    }

    onUpdateDesignConfig({
      ...designConfig,
      colWidthNo: Number(newNo.toFixed(1)),
      colWidthSubjectAr: Number(newAr.toFixed(1)),
      colWidthSubjectLat: Number(newLat.toFixed(1)),
      colWidthScoreAr: Number(newScoreAr.toFixed(1)),
      colWidthScoreLat: Number(newScoreLat.toFixed(1)),
      colWidthScore: Number((newScoreAr + newScoreLat).toFixed(1)),
      colWidthTerbilang: Number(newTer.toFixed(1)),
      numberColWidth: Number(newNo.toFixed(1)),
    });
  };

  const handleResetColumnWidths = () => {
    onUpdateDesignConfig({
      ...designConfig,
      colWidthNo: 5.5,
      colWidthSubjectAr: 28.5,
      colWidthSubjectLat: 24.5,
      colWidthScoreAr: 6.5,
      colWidthScoreLat: 6.5,
      colWidthScore: 13,
      colWidthTerbilang: 28.5,
      numberColWidth: 5.5,
    });
  };

  const currentAlign = getCurrentAlign();
  const currentFontSize = getCurrentFontSize();
  const currentColWidth = getCurrentColWidth();

  return (
    <div className="no-print w-full mb-3 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-emerald-500/40 rounded-xl p-3 shadow-xl text-white text-xs select-none">
      {/* Top Row: Column Selector Tabs & Close Button */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2.5 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
            <Sparkles size={14} className="text-emerald-400" />
            <span>Editor Desain & Tabel:</span>
          </div>

          <div className="flex items-center gap-1 bg-stone-950/80 p-0.5 rounded-lg border border-stone-800 overflow-x-auto max-w-full">
            {[
              { key: 'no', label: '1. الرقم (No)' },
              { key: 'subjectAr', label: '2. المواد (Arab)' },
              { key: 'subjectLat', label: '3. Mapel (Latin)' },
              { key: 'score', label: '4. الدرجة (Nilai)' },
              { key: 'terbilang', label: '5. بالحروف (Terbilang)' },
              { key: 'all', label: 'Semua Kolom' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectCol(item.key as SelectedColumnKey)}
                className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition whitespace-nowrap ${
                  selectedCol === item.key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 rounded-lg text-[11px] font-semibold border border-stone-700 hover:border-rose-700/50 transition"
            title="Tutup Mode Edit Langsung"
          >
            <X size={13} />
            <span>Tutup Edit</span>
          </button>
        )}
      </div>

      {/* Excel Formula Bar: Active Cell coordinate, fx icon, and Formula/Value input */}
      <div className="flex items-center gap-2 bg-stone-950 px-2.5 py-1.5 rounded-lg border border-stone-800 mb-2.5 text-xs">
        <div 
          className="px-2 py-0.5 bg-stone-900 border border-stone-700 rounded font-mono font-bold text-[11px] text-emerald-400 min-w-[65px] text-center select-none"
          title="Koordinat Sel Aktif"
        >
          {activeCellLabel || 'A1'}
        </div>
        <div className="text-emerald-500 font-serif italic text-xs font-bold select-none px-0.5">
          fx
        </div>
        <div className="w-[1px] h-4 bg-stone-800" />
        <input
          type="text"
          value={activeCellValue ?? ''}
          onChange={(e) => onChangeCellValue && onChangeCellValue(e.target.value)}
          placeholder="Klik sel di tabel untuk mengedit nilai, atau ketik langsung di sini..."
          className="flex-1 bg-transparent text-white text-xs outline-none px-1 placeholder-stone-600 font-sans"
        />
      </div>

      {/* Bottom Controls: Alignment, Font Size, Column Width, Row Height */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
        {/* 1. Perataan Vertikal (Top, Middle, Bottom) */}
        <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Vertikal:
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleSetVAlign('top')}
              title="Rata Atas (Top Align)"
              className={`px-1.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                getCurrentVAlign() === 'top'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>Top</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetVAlign('middle')}
              title="Rata Tengah Vertikal (Middle Align)"
              className={`px-2 py-1 rounded text-[10.5px] font-bold transition flex items-center gap-1 ${
                getCurrentVAlign() === 'middle'
                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400 font-extrabold'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span className="text-emerald-300 font-extrabold">⬍ Middle Align</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetVAlign('bottom')}
              title="Rata Bawah (Bottom Align)"
              className={`px-1.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                getCurrentVAlign() === 'bottom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>Bottom</span>
            </button>
          </div>
        </div>

        {/* 2. Posisi / Perataan Huruf Horizontal (Left, Center, Right, Justify) */}
        <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Horizontal:
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleSetAlign('left')}
              title="Rata Kiri (Left)"
              className={`p-1.5 rounded transition ${
                currentAlign === 'left'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleSetAlign('center')}
              title="Rata Tengah (Center)"
              className={`p-1.5 rounded transition ${
                currentAlign === 'center'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleSetAlign('right')}
              title="Rata Kanan (Right)"
              className={`p-1.5 rounded transition ${
                currentAlign === 'right'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <AlignRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleSetAlign('justify')}
              title="Rata Kanan-Kiri (Justify)"
              className={`p-1.5 rounded transition ${
                currentAlign === 'justify'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <AlignJustify size={14} />
            </button>
          </div>
        </div>

        {/* 2. Ukuran Huruf (Font Size) */}
        <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Font:
          </span>
          <button
            type="button"
            onClick={() => handleChangeFontSize(-0.5)}
            className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
            title="Kecilkan Huruf"
          >
            <Minus size={13} />
          </button>
          <span className="font-mono font-bold text-[11px] px-1 text-emerald-300 min-w-[34px] text-center">
            {currentFontSize}px
          </span>
          <button
            type="button"
            onClick={() => handleChangeFontSize(0.5)}
            className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
            title="Besarkan Huruf"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* 3. Lebar Kolom (Width %) */}
        {selectedCol !== 'all' && (
          <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Lebar:
            </span>
            <button
              type="button"
              onClick={() => handleChangeColWidth(-1)}
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Persempit Kolom"
            >
              <Minus size={13} />
            </button>
            <span className="font-mono font-bold text-[11px] px-1 text-teal-300 min-w-[34px] text-center">
              {currentColWidth}%
            </span>
            <button
              type="button"
              onClick={() => handleChangeColWidth(1)}
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Perlebar Kolom"
            >
              <Plus size={13} />
            </button>
          </div>
        )}

        {/* 4. Tinggi Baris Mapel (Row Height) */}
        <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Tinggi Baris:
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateDesignConfig({
                ...designConfig,
                tableRowHeight: Math.max(18, (designConfig.tableRowHeight || 21) - 1),
              })
            }
            className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
            title="Rapatkan Baris"
          >
            <Minus size={13} />
          </button>
          <span className="font-mono font-bold text-[11px] px-1 text-amber-300 min-w-[34px] text-center">
            {designConfig.tableRowHeight || 21}px
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateDesignConfig({
                ...designConfig,
                tableRowHeight: Math.min(32, (designConfig.tableRowHeight || 21) + 1),
              })
            }
            className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
            title="Renggangkan Baris"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* 5. Format Angka Nomor (Khusus Kolom Nomor) */}
        {selectedCol === 'no' && (
          <button
            type="button"
            onClick={() =>
              onUpdateDesignConfig({
                ...designConfig,
                numberFormat: designConfig.numberFormat === 'arabic' ? 'latin' : 'arabic',
              })
            }
            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded text-[10.5px] font-semibold transition"
            title="Ganti Format Angka Nomor Urut"
          >
            Format: {designConfig.numberFormat === 'arabic' ? '١٢٣ (Arab)' : '123 (Latin)'}
          </button>
        )}

        {/* 6. Jarak / Margin Tabel (Atas & Bawah) */}
        <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Posisi Tabel:
          </span>
          <div className="flex items-center gap-1 text-[10.5px]">
            <span className="text-stone-400 text-[10px]">Atas:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  tableMarginTop: Math.max(0, (designConfig.tableMarginTop ?? 4) - 1),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Kurangi Margin Atas Tabel (-1px)"
            >
              <Minus size={11} />
            </button>
            <span className="font-mono font-bold text-emerald-300 min-w-[18px] text-center">
              {designConfig.tableMarginTop ?? 4}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  tableMarginTop: Math.min(35, (designConfig.tableMarginTop ?? 4) + 1),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Tambah Margin Atas Tabel (+1px)"
            >
              <Plus size={11} />
            </button>

            <span className="text-stone-600 mx-0.5">|</span>

            <span className="text-stone-400 text-[10px]">Bawah:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  tableMarginBottom: Math.max(0, (designConfig.tableMarginBottom ?? 4) - 1),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Kurangi Margin Bawah Tabel (-1px)"
            >
              <Minus size={11} />
            </button>
            <span className="font-mono font-bold text-emerald-300 min-w-[18px] text-center">
              {designConfig.tableMarginBottom ?? 4}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  tableMarginBottom: Math.min(35, (designConfig.tableMarginBottom ?? 4) + 1),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Tambah Margin Bawah Tabel (+1px)"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>

        {/* 7. Padding Bingkai (4 Arah: Atas, Bawah, Kiri, Kanan) */}
        <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Bingkai:
          </span>
          <div className="flex items-center gap-1 text-[10.5px]">
            {/* Atas */}
            <span className="text-stone-400 text-[10px]">Atas:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingTop: Math.max(0, (designConfig.framePaddingTop ?? 20) - 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Kurangi Padding Atas (-2px)"
            >
              <Minus size={11} />
            </button>
            <span className="font-mono font-bold text-teal-300 min-w-[18px] text-center">
              {designConfig.framePaddingTop ?? 20}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingTop: Math.min(60, (designConfig.framePaddingTop ?? 20) + 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Tambah Padding Atas (+2px)"
            >
              <Plus size={11} />
            </button>

            <span className="text-stone-600 mx-0.5">|</span>

            {/* Bawah */}
            <span className="text-stone-400 text-[10px]">Bawah:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingBottom: Math.max(0, (designConfig.framePaddingBottom ?? 20) - 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Kurangi Padding Bawah (-2px)"
            >
              <Minus size={11} />
            </button>
            <span className="font-mono font-bold text-teal-300 min-w-[18px] text-center">
              {designConfig.framePaddingBottom ?? 20}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingBottom: Math.min(60, (designConfig.framePaddingBottom ?? 20) + 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Tambah Padding Bawah (+2px)"
            >
              <Plus size={11} />
            </button>

            <span className="text-stone-600 mx-0.5">|</span>

            {/* Kiri */}
            <span className="text-stone-400 text-[10px]">Kiri:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingLeft: Math.max(0, (designConfig.framePaddingLeft ?? 24) - 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Kurangi Padding Kiri (-2px)"
            >
              <Minus size={11} />
            </button>
            <span className="font-mono font-bold text-teal-300 min-w-[18px] text-center">
              {designConfig.framePaddingLeft ?? 24}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingLeft: Math.min(60, (designConfig.framePaddingLeft ?? 24) + 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Tambah Padding Kiri (+2px)"
            >
              <Plus size={11} />
            </button>

            <span className="text-stone-600 mx-0.5">|</span>

            {/* Kanan */}
            <span className="text-stone-400 text-[10px]">Kanan:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingRight: Math.max(0, (designConfig.framePaddingRight ?? 24) - 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Kurangi Padding Kanan (-2px)"
            >
              <Minus size={11} />
            </button>
            <span className="font-mono font-bold text-teal-300 min-w-[18px] text-center">
              {designConfig.framePaddingRight ?? 24}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateDesignConfig({
                  ...designConfig,
                  framePaddingRight: Math.min(60, (designConfig.framePaddingRight ?? 24) + 2),
                })
              }
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition"
              title="Tambah Padding Kanan (+2px)"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>

        {/* 8. Aksi Baris / Tambah & Hapus Mapel */}
        {(onAddRow || onDeleteRow) && (
          <div className="flex items-center gap-1.5 bg-stone-850 px-2 py-1 rounded-lg border border-stone-700/60">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Baris:
            </span>
            {onAddRow && (
              <button
                type="button"
                onClick={onAddRow}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10.5px] font-bold transition shadow-xs"
                title="Tambah Baris / Mata Pelajaran Baru"
              >
                <Plus size={12} />
                <span>+ Baris</span>
              </button>
            )}
            {onDeleteRow && (
              <button
                type="button"
                onClick={onDeleteRow}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-700/80 hover:bg-rose-600 text-white rounded text-[10.5px] font-bold transition shadow-xs"
                title="Hapus Baris Mata Pelajaran Aktif"
              >
                <Trash2 size={12} />
                <span>Hapus</span>
              </button>
            )}
          </div>
        )}

        {/* 9. Reset Kolom */}
        <button
          type="button"
          onClick={handleResetColumnWidths}
          title="Kembalikan Lebar Kolom ke Ukuran Standar"
          className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded transition ml-auto"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="mt-1.5 text-[9.5px] text-stone-400 flex items-center gap-2 border-t border-stone-800/80 pt-1">
        <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
          <MousePointer size={10} />
          <span>Klik langsung kolom tabel untuk memilih</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 text-teal-400/90 font-medium">
          <MoveHorizontal size={10} />
          <span>Geser garis pembatas antar kolom untuk mengatur lebar seperti Excel</span>
        </span>
      </div>
    </div>
  );
};
